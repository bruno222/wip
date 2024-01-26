const WebSocket = require('ws');
const { getCall, getPhoneState, getAllCalls } = require('./services/state');

const wss = new WebSocket.Server({ port: 8080 });

feSendCommand = (type, payload) => {
  console.log(`(feSendCommand) ${type}: ${JSON.stringify(payload)}`);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, ...payload }));
    }
  });
};

feSendMessage = (CallSid, sender, text, interactionId) => {
  console.log(`(feSendMessage) ${sender}: ${text}`);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      //   console.log(`(feSendMessage) sending to id=${ws.id}...`);
      ws.send(JSON.stringify({ type: 'new-msg', CallSid, sender, text, interactionId }));
    }
  });
};

module.exports.feSendMessage = feSendMessage;

let id = 0;
wss.on('connection', (ws) => {
  ws.id = ++id;
  console.log('New client connected', ws.id);

  ws.send(JSON.stringify({ type: 'front-end-connected' }));

  //feSendCommand('call-started', { ...currentCall, gptService: null });

  //   ws.timer = setInterval(() => {
  //     console.log(`Sending message to ${ws.id}...`);

  //     ws.send(
  //       JSON.stringify({
  //         sender: 'Server',
  //         text: `Hello from server! ${ws.id}`,
  //       })
  //     );
  //   }, 2000);

  ws.on('message', (message) => {
    console.log(`Received message: ${message}`);
    const { type, text, CallSid } = JSON.parse(message);

    //
    // When front-end just connected, it asks the backend for the current calls
    //
    if (type === 'give-me-all-current-calls') {
      getAllCalls().map((currentCall) => {
        feSendCommand('call-started', { ...currentCall, gptService: null });
      });
    }

    //
    // Supervisor sent a hint message
    //
    if (type === 'new-msg-from-supervisor') {
      const currentCall = getCall(CallSid);
      if (!currentCall) {
        console.log(`CallSid not found!`.red);
        return;
      }
      console.log(`Interaction ${currentCall.interactionCount} – STT -> GPT: ${text}`.yellow);
      feSendMessage(CallSid, 'Supervisor', text);
      currentCall.gptService.completion(text, currentCall.interactionCount++, 'system', 'system');
    }

    //
    // Supervisor hijacked the call
    //
    if (type === 'hijack-call') {
      const currentCall = getCall(CallSid);
      if (!currentCall) {
        console.log(`CallSid not found!`.red);
        return;
      }

      const { customerName, customerCity } = getPhoneState(currentCall.From) || {};
      hijackCall(CallSid, customerName, customerCity);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(ws.timer);
  });

  ws.on('error', (err) => {
    console.error('error', err);
  });
});

// setInterval(() => {
//   feSendMessage('Server', `okkk`);
// }, 3000);

async function hijackCall(callSid, customerName, customerCity) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const client = require('twilio')(accountSid, authToken);

  const answer = await client.calls(callSid).update({
    twiml: `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
            <Say language="en-US" loop="1" voice="Google.en-US-Standard-A">Please wait a second while I forward you to one of your agents.</Say>
            <Enqueue workflowSid="${process.env.TWILIO_TASK_ROUTER_WORKFLOW}">
                <Task>{ "type": "inbound", "name": "${customerName}", "city": "${customerCity}", "autoAccept": 1 }</Task>
            </Enqueue>
        </Response>  `,
  });

  console.log('call update answer: ', answer);
}

module.exports.hijackCall = hijackCall;
