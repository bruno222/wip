const WebSocket = require('ws');
const { getCall } = require('./services/state');

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
    // ws.send(`Server received your message: ${message}`);

    const { type, text, CallSid } = JSON.parse(message);
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
