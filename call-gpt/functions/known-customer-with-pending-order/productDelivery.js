const { sendSMS } = require('../../services/twilio-sdk');
const { addPhoneState } = require('../../services/state');

async function confirmPurchase(functionArgs) {
  try {
    let { From } = functionArgs;
    console.log('GPT -> called confirmPurchase function', functionArgs);

    if (!From) {
      return JSON.stringify({ buyStatus: 'ERROR' });
    }

    addPhoneState(From, { orderStatus: 'completed-order' });

    return JSON.stringify({ status: 'OK' });
  } catch (e) {
    console.error('error', e);
    return JSON.stringify({ buyStatus: 'EXCEPTION' });
  }
}

module.exports = confirmPurchase;
