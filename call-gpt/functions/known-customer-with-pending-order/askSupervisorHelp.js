async function askSupervisorHelp(functionArgs) {
  try {
    let { callId } = functionArgs;
    console.log('GPT -> called askSupervisorHelp function', functionArgs);

    if (!callId) {
      return JSON.stringify({ buyStatus: 'ERROR' });
    }

    feSendCommand('raise-hand', { callId });

    return JSON.stringify({ buyStatus: 'SUCCESS' });
  } catch (e) {
    console.error('error', e);
    return JSON.stringify({ buyStatus: 'ERROR' });
  }
}

module.exports = askSupervisorHelp;

// setTimeout(() => {
//   askSupervisorHelp({ callId: '2' });
// }, 5000);
