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
