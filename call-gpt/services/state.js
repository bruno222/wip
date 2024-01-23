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

module.exports.phoneState = {};

module.exports.getPhoneState = (phoneNumber) => {
  return module.exports.phoneState[phoneNumber];
};

module.exports.addPhoneState = (phoneNumber, state) => {
  // add on top
  if (module.exports.phoneState[phoneNumber]) {
    module.exports.phoneState[phoneNumber] = {
      ...module.exports.phoneState[phoneNumber],
      ...state,
    };

    return;
  }

  // add new
  module.exports.phoneState[phoneNumber] = state;
};
