//
//  Current Calls state
//
//  - CallSid is the "primary key" and basically we have everything from the webhook /incoming

module.exports.currentCalls = {};
module.exports.getCall = (CallSid) => {
  return module.exports.currentCalls[CallSid];
};
module.exports.deleteCall = (CallSid) => {
  delete module.exports.currentCalls[CallSid];
};
module.exports.addCall = (CallSid, call) => {
  module.exports.currentCalls[CallSid] = call;
};

//
// Phone State
//
//  - phone number is the "primary key" and we have more customer data here
//      that does not change no matter how many calls the customer calls in
//      (more like a "persistent" state, but it is in-memory for the hackathon)
//
phoneState = {};

module.exports.getPhoneState = (phoneNumber) => {
  return phoneState[phoneNumber];
};

module.exports.addPhoneState = (phoneNumber, state) => {
  // add on top
  if (phoneState[phoneNumber]) {
    phoneState[phoneNumber] = {
      ...phoneState[phoneNumber],
      ...state,
    };

    console.log('Phone state updated', phoneNumber, phoneState[phoneNumber]);
    return;
  }

  // add new
  console.log('Phone state created', phoneNumber, state);
  phoneState[phoneNumber] = state;
};
