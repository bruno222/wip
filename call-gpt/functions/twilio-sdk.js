const authToken = process.env.SMS_TWILIO_AUTH_TOKEN;
const accountSid = process.env.SMS_TWILIO_ACCOUNT_SID;
const client = require('twilio')(accountSid, authToken);

module.exports.sendSMS = async (to, body) => {
  console.log('Sending SMS to: ', to);

  await client.messages.create({
    body,
    from: process.env.SMS_FROM_NUMBER,
    to,
  });
};

// to test
// module.exports.sendSMS('+19494337060', 'Hello from Twilio!');
