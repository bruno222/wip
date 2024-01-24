require('dotenv').config();
const express = require('express');
const path = require('path');
const { sendSMS } = require('./services/twilio-sdk');
const ExpressWs = require('express-ws');
const colors = require('colors');

const { GptService } = require('./services/gpt-service');
const { StreamService } = require('./services/stream-service');
const { TranscriptionService } = require('./services/transcription-service');
const { TextToSpeechService } = require('./services/tts-service');

const { feStart, feSendMessage } = require('./app-frontend-ws');
const { addCall, deleteCall, getCall, getPhoneState, addPhoneState } = require('./services/state');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
ExpressWs(app);

const PORT = process.env.PORT || 3000;

let callId = 0;

app.get('/sms/:phone/:code', async (req, res) => {
  try {
    const { phone, code } = req.params;
    const From = `+${phone}`;
    console.log('SMS link clicked. Code: ', code, 'From: ', From);
    const state = getPhoneState(From);
    const currentCall = getCall(state.CallSid);
    res.status(200);

    if (!state || state.status !== 'waiting') {
      return res.end(`Humm... You have no pending purchase.`);
    }

    if (state.status === 'expired') {
      return res.end(`You already bought it! Thank you!`);
    }

    if (state.code !== +code) {
      console.log('Invalid code', state.code, code, state);
      return res.end(`Invalid Code... Please try again.`);
    }

    //
    // Success Scenario
    //
    console.log('Success confirming the SMS link!'.green);

    addPhoneState(From, { status: 'expired' });

    currentCall.gptService.completion(
      'Stop talking what ever you are talking and just say to the customer that you just saw an update in your system and his/her purchase has been done. Thank the customer and say bye.',
      currentCall.interactionCount++,
      'system',
      'system'
    );
    return res.end(`Confirmed! Thank you for your purchase!`);
  } catch (e) {
    res.end('error');
    console.error('error', e);
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
    gptService: new GptService(CallSid, From),
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

app.ws('/connection/:CallSid', (ws, req) => {
  const { CallSid } = req.params;
  const currentCall = getCall(CallSid);
  const { From, gptService } = currentCall;
  const { customerName } = getPhoneState(From);
  const isCustomerKnown = !!customerName;
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

      streamService.setStreamSid(streamSid);
      console.log(`Twilio -> Starting Media Stream for ${streamSid}`.underline.red);

      console.log('isCustomerKnown', isCustomerKnown);
      if (!isCustomerKnown) {
        const text = "Hello! I understand you're looking for a pair of AirPods, is that correct?";
        feSendMessage(CallSid, 'Bot', text);
        ttsService.generate({ partialResponseIndex: null, partialResponse: text }, 1);
      }
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
