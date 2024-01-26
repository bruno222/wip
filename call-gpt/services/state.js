const fs = require('fs');
const path = require('path');

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
module.exports.getAllCalls = () => {
  const currentCalls = [];
  Object.keys(module.exports.currentCalls).map((CallSid) => currentCalls.push(module.exports.currentCalls[CallSid]));
  return currentCalls;
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
  const state = phoneState[phoneNumber];

  if (!state) {
    phoneState[phoneNumber] = loadPhoneState(phoneNumber);
  }

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
    savePhoneState(phoneNumber, phoneState[phoneNumber]);
    return;
  }

  // add new
  console.log('Phone state created', phoneNumber, state);
  phoneState[phoneNumber] = state;
  savePhoneState(phoneNumber, phoneState[phoneNumber]);
};

// Save state of the customer to disk to be reloaded to memory later in case Node.js gets restarted
savePhoneState = (From, json) => {
  fs.writeFileSync(path.join(__dirname, './.saved-state', From.replace('+', '')), JSON.stringify(json));
};

// Load state of the customer from disk and return the content
const triedToLoadAlready = {};
loadPhoneState = (From) => {
  if (triedToLoadAlready[From]) {
    return;
  }
  try {
    const file = fs.readFileSync(path.join(__dirname, './.saved-state', From.replace('+', '')));
    return JSON.parse(file);
  } catch (e) {
    triedToLoadAlready[From] = 1;
    return;
  }
};

// savePhoneState('+49123123132', { a: 1, b: 2 });
// console.log(loadPhoneState('+49123123132'));
