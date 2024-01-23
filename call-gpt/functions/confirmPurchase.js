const { sendSMS } = require('../services/twilio-sdk');
const { addPhoneState } = require('../services/state');

async function confirmPurchase(functionArgs) {
  try {
    let { From, CallSid } = functionArgs;
    console.log('GPT -> called confirmPurchase function', functionArgs);

    if (!From) {
      return JSON.stringify({ buyStatus: 'ERROR' });
    }

    const code = Math.floor(Math.random() * 1000000);
    addPhoneState(From, { status: 'waiting', code, CallSid });
    await sendSMS(From, `Click to buy - http://${process.env.SERVER}/sms/${From.replace('+', '')}/${code}`);

    return JSON.stringify({ buyStatus: 'SMS_CONFIRMATION_SENT' });
  } catch (e) {
    console.error('error', e);
    return JSON.stringify({ buyStatus: 'EXCEPTION' });
  }
}

module.exports = confirmPurchase;
