require('dotenv').config();
const express = require('express');
const path = require('path');
const ExpressWs = require('express-ws');
const colors = require('colors');

const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');

const { feStart, feSendMessage } = require('./app-frontend-ws');
const { addCall, deleteCall, getCall, getPhoneState, addPhoneState } = require('./services/state');

const { sendSMS } = require('./functions/twilio-sdk');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
ExpressWs(app);

const PORT = process.env.PORT || 3000;

let callId = 0;

app.post('/receive-sms', (req, res) => {
  console.log('Received SMS: ', req.body);
  const { From, Body } = req.body;

  // addPhoneState(From, { status: 'waiting' });

  const state = getPhoneState(From);
  if (state && state.status === 'waiting') {
    console.log('step 1');
    if (Body && Body.toLowerCase().includes('yes')) {
      console.log('step 2');
      const text = 'Purchase confirmed. Continue to finalize the sale.';
      // TODO
      // currentCall.gptService.completion(text, currentCall.interactionCount++, 'system', 'system');
      // feSendMessage(CallSid, 'System', text);
      addPhoneState(From, { status: 'done' });
    }
  }
});

app.post('/incoming', (req, res) => {
  const { From, CallSid, CallToken } = req.body;
  console.log('New call: ', From, CallSid);

  callId++;

  const currentCall = {
    CallSid,
    From,
    callId,
    gptService: new GptService(),
    interactionCount: 1,
  };
  addCall(CallSid, currentCall);

  res.status(200);
  res.type('text/xml');

  if (callId > 2) {
    return res.end(`
    <Response>
      <Say>
        Sorry, for this Hachathon we only have 2 lines available. Bye!
      </Say>
    </Response>
    `);
  }

  feSendCommand('call-started', { ...currentCall, gptService: null });

  res.end(`
    <Response>
      <Connect>
        <Stream url="wss://${process.env.SERVER}/connection/${CallSid}" />
      </Connect>
    </Response>
  `);
});

app.use('/', express.static(path.join(__dirname, '../front-end/out')));

app.ws('/connection/:CallSid', (ws, req) => {
  const { CallSid } = req.params;
  const currentCall = getCall(CallSid);
  const { From, gptService } = currentCall;
  console.log(`New connection: ${From} - ${CallSid}`);

  ws.on('error', console.error);
  // Filled in from start message
  let streamSid;

  const streamService = new StreamService(ws);
  const transcriptionService = new TranscriptionService();
  const ttsService = new TextToSpeechService({});

  let marks = [];

  // Incoming from MediaStream
  ws.on('message', function message(data) {
    const msg = JSON.parse(data);
    if (msg.event === 'start') {
      streamSid = msg.start.streamSid;
      const text = "Hello! I understand you're looking for a pair of AirPods, is that correct?";
      feSendMessage(CallSid, 'Bot', text);
      streamService.setStreamSid(streamSid);
      console.log(`Twilio -> Starting Media Stream for ${streamSid}`.underline.red);
      ttsService.generate({ partialResponseIndex: null, partialResponse: text }, 1);
    } else if (msg.event === 'media') {
      transcriptionService.send(msg.media.payload);
    } else if (msg.event === 'mark') {
      const label = msg.mark.name;
      console.log(`Twilio -> Audio completed mark (${msg.sequenceNumber}): ${label}`.red);
      marks = marks.filter((m) => m !== msg.mark.name);
    } else if (msg.event === 'stop') {
      console.log(`Twilio -> Media stream ${streamSid} ended.`.underline.red);

      feSendCommand('call-ended', { ...currentCall, gptService: null });
      callId--;
      deleteCall(CallSid);
    }
  });

  transcriptionService.on('utterance', async (text) => {
    // This is a bit of a hack to filter out empty utterances
    if (marks.length > 0 && text?.length > 5) {
      console.log('Twilio -> Interruption, Clearing stream'.red);
      ws.send(
        JSON.stringify({
          streamSid,
          event: 'clear',
        })
      );
    }
  });

  transcriptionService.on('transcription', async (text) => {
    if (!text) {
      return;
    }
    console.log(`Interaction ${currentCall.interactionCount} – STT -> GPT: ${text}`.yellow);
    feSendMessage(CallSid, 'Customer', text);
    gptService.completion(text, currentCall.interactionCount++);
    // currentCall.interactionCount += 1;
  });

  gptService.on('gptreply', async (gptReply, icount) => {
    console.log(`Interaction ${icount}: GPT -> TTS: ${gptReply.partialResponse}`.green);
    feSendMessage(CallSid, 'Bot', gptReply.partialResponse, icount);
    ttsService.generate(gptReply, icount);
  });

  ttsService.on('speech', (responseIndex, audio, label, icount) => {
    console.log(`Interaction ${icount}: TTS -> TWILIO: ${label}`.blue);
    streamService.buffer(responseIndex, audio);
  });

  streamService.on('audiosent', (markLabel) => {
    marks.push(markLabel);
  });
});

app.listen(PORT);
console.log(`Server running on port ${PORT}`);
