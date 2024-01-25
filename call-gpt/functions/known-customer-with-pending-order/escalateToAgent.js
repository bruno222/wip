const { sendSMS } = require('../../services/twilio-sdk');
const { addPhoneState, getPhoneState } = require('../../services/state');
const { hijackCall } = require('../../app-frontend-ws');

async function escalateToAgent(functionArgs) {
  try {
    let { From, CallSid } = functionArgs;
    console.log('GPT -> called escalateToAgent function', functionArgs);

    if (!From) {
      return JSON.stringify({ buyStatus: 'ERROR' });
    }

    const { customerName, customerCity } = getPhoneState(From) || {};
    hijackCall(CallSid, customerName, customerCity);

    return JSON.stringify({ buyStatus: 'SUCCESS' });
  } catch (e) {
    console.error('error', e);
    return JSON.stringify({ buyStatus: 'ERROR' });
  }
}

module.exports = escalateToAgent;
