const { sendSMS } = require('../services/twilio-sdk');
const { addPhoneState } = require('../services/state');

async function saveCustomerName(functionArgs) {
  try {
    let { From, CallSid, customerName, customerCity } = functionArgs;
    console.log('GPT -> called saveCustomerName function', functionArgs);

    if (!From || !customerName | !customerCity) {
      console.log('(saveCustomerName) Missing parameters', functionArgs);
      return 'MISSING_PARAMETERS';
    }

    addPhoneState(From, { customerName, customerCity });
    return 'CONTINUE';
  } catch (e) {
    console.error('error', e);
    return 'ERROR';
  }
}

module.exports = saveCustomerName;
