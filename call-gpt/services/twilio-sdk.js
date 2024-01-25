const authToken = process.env.TWILIO_AUTH_TOKEN;
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const client = require('twilio')(accountSid, authToken);

module.exports.sendSMS = async (to, body) => {
  console.log('Sending SMS:', to, body);

  await client.messages.create({
    body,
    from: process.env.FROM_NUMBER,
    mediaUrl: ['https://sko24-hackathon-8512.twil.io/mens_orange.jpg'],
    to,
  });
};

// to test
// module.exports.sendSMS('+19494337060', 'Hello from Twilio!');
