const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8080 });

feSendMessage = (sender, text, interactionId) => {
  console.log(`(feSendMessage) ${sender}: ${text}`);
  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      //   console.log(`(feSendMessage) sending to id=${ws.id}...`);
      ws.send(JSON.stringify({ sender, text, interactionId }));
    }
  });
};

module.exports.feSendMessage = feSendMessage;

let id = 0;
wss.on('connection', (ws) => {
  ws.id = ++id;
  console.log('New client connected', ws.id);

  ws.send(
    JSON.stringify({
      sender: 'Status',
      text: `You are connected :)`,
    })
  );

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
    ws.send(`Server received your message: ${message}`);
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
