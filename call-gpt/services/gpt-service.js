const EventEmitter = require('events');
const colors = require('colors');
const OpenAI = require('openai');
const { getCall, getPhoneState } = require('./state');

// we have different GPT Agent Personas. Each of them are loaded differently
// depending on the scenario the customer is in.
const scenarios = [
  'unknown-customer',
  'known-customer-with-no-order',
  'known-customer-with-pending-order',
  'known-customer-with-completed-order',
];

// load all the different function-manifests
const tools = {};
const availableFunctions = {};

for (const scenario of scenarios) {
  tools[scenario] = require(`../functions/${scenario}/function-manifest`);

  // load all the different functions from all the scenarios
  availableFunctions[scenario] = {};
  tools[scenario].forEach((tool) => {
    functionName = tool.function.name;
    availableFunctions[scenario][functionName] = require(`../functions/${scenario}/${functionName}`);
  });
}

class GptService extends EventEmitter {
  constructor(CallSid, From) {
    super();
    this.CallSid = CallSid;
    this.openai = new OpenAI();
    this.partialResponseIndex = 0;

    const phoneState = getPhoneState(From) || {};
    const isCustomerKnown = !!(phoneState.customerName && phoneState.customerCity);
    const orderStatus = phoneState.orderStatus || 'no-order';
    console.log('GPT -> isCustomerKnown', isCustomerKnown, phoneState);

    this.prepareAgentPersona(isCustomerKnown, orderStatus, phoneState);
    console.log('GPT -> Scenario: ', this.scenario);
  }

  prepareAgentPersona(isCustomerKnown, orderStatus, phoneState) {
    //
    // AI persona for the Scenario: unknown-customer
    //
    if (!isCustomerKnown) {
      this.scenario = 'unknown-customer';
      this.tool = tools[this.scenario];

      const content = `
      - You are an outbound sales representative selling Chargers. 
      - You have a youthful and cheery personality. 
      - Keep your responses as brief as possible but make every attempt to keep the caller on the phone without being rude. 
      - Don't ask more than 1 question at a time. 
      - Before going deeper into the conversation, always ask the customer name and his city for shipping purposes.
      - Ask for clarification if a user request is ambiguous. 
      - Speak out all prices to include the currency. 
      - Once you know which model they would like proceed with the purchase.
      - Dont forget to always call the function confirmPurchase to send a confirmation SMS to the customer. Reminder the customer that he/she needs to click on the link in that SMS. 
      - You must add a '•' symbol every 5 to 10 words at natural pauses where your response can be split for text to speech.`;

      this.userContext = [
        {
          role: 'system',
          content,
        },
        { role: 'assistant', content: "Hello! I understand you're looking for a pair of AirPods, is that correct?" },
      ];

      return;
    }

    //
    // AI persona for the Scenario: known-customer-with-no-order
    //
    if (isCustomerKnown && orderStatus === 'no-order') {
      this.scenario = 'known-customer-with-no-order';
      this.tool = tools[this.scenario];
      const { customerName, customerCity } = phoneState;

      const content = `
        - You are an outbound sales representative selling Chargers. 
        - You have a youthful and cheery personality. 
        - Keep your responses as brief as possible but make every attempt to keep the caller on the phone without being rude. 
        - Don't ask more than 1 question at a time. 
        - You know the customer name, it is ${customerName} and he/she is from ${customerCity}, make a exagerated funny joke about where he/she is from!
        - Ask for clarification if a user request is ambiguous. 
        - Speak out all prices to include the currency. 
        - Once you know which model they would like proceed with the purchase.
        - Dont forget to always call the function confirmPurchase to send a confirmation SMS to the customer. Reminder the customer that he/she needs to click on the link in that SMS. 
        - You must add a '•' symbol every 5 to 10 words at natural pauses where your response can be split for text to speech.`;

      this.userContext = [
        {
          role: 'system',
          content,
        },
      ];

      return;
    }

    //
    // AI persona for the Scenario: known-customer-with-pending-order
    //
    if (isCustomerKnown && orderStatus === 'pending-order') {
      this.scenario = 'known-customer-with-pending-order';
      this.tool = tools[this.scenario];
      const { customerName, customerCity } = phoneState;

      const content = `
        - You are an outbound sales representative selling Chargers. 
        - You have a youthful and cheery personality. 
        - Keep your responses as brief as possible but make every attempt to keep the caller on the phone without being rude. 
        - Don't ask more than 1 question at a time. 
        - You know the customer name, it is ${customerName} and he/she is from ${customerCity}, make a exagerated funny joke about where he/she is from!
        - Customer has a pending order, start the conversations asking if he/she wants to change or cancel the order.
        - If the customer says that the product was delivered already, call function productDelivery to update the order status.
        - Ask for clarification if a user request is ambiguous. 
        - Speak out all prices to include the currency. 
        - Once you know which model they would like proceed with the purchase.
        - Dont forget to always call the function confirmPurchase to send a confirmation SMS to the customer. Reminder the customer that he/she needs to click on the link in that SMS. 
        - You must add a '•' symbol every 5 to 10 words at natural pauses where your response can be split for text to speech.`;

      this.userContext = [
        {
          role: 'system',
          content,
        },
      ];

      return;
    }

    //
    // AI persona for the Scenario: known-customer-with-completed-order
    //
    if (isCustomerKnown && orderStatus === 'completed-order') {
      this.scenario = 'known-customer-with-completed-order';
      this.tool = tools[this.scenario];
      const { customerName, customerCity } = phoneState;

      const content = `
        - You are an outbound sales representative selling Chargers. 
        - You have a youthful and cheery personality. 
        - Keep your responses as brief as possible but make every attempt to keep the caller on the phone without being rude. 
        - Don't ask more than 1 question at a time. 
        - Customer ${customerName} has a completed order, ask why the customer is calling you again, ask if the customer got in love with you.
        - Ask for clarification if a user request is ambiguous.                         
        - You must add a '•' symbol every 5 to 10 words at natural pauses where your response can be split for text to speech.`;

      this.userContext = [
        {
          role: 'system',
          content,
        },
      ];

      return;
    }
  }

  async completion(text, interactionCount, role = 'user', name = 'user') {
    if (name != 'user') {
      this.userContext.push({ role: role, name: name, content: text });
    } else {
      this.userContext.push({ role: role, content: text });
    }

    // Step 1: Send user transcription to Chat GPT
    const stream = await this.openai.chat.completions.create({
      // model: "gpt-4-1106-preview",
      model: 'gpt-4',
      messages: this.userContext,
      tools: this.tool.length > 0 ? this.tool : undefined,
      stream: true,
    });

    let completeResponse = '';
    let partialResponse = '';
    let functionName = '';
    let functionArgs = '';
    let finishReason = '';

    for await (const chunk of stream) {
      let content = chunk.choices[0]?.delta?.content || '';
      let deltas = chunk.choices[0].delta;

      // Step 2: check if GPT wanted to call a function
      if (deltas.tool_calls) {
        // Step 3: call the function
        let name = deltas.tool_calls[0]?.function?.name || '';
        if (name != '') {
          functionName = name;
        }
        let args = deltas.tool_calls[0]?.function?.arguments || '';
        if (args != '') {
          // args are streamed as JSON string so we need to concatenate all chunks
          functionArgs += args;
        }
      }
      // check to see if it is finished
      finishReason = chunk.choices[0].finish_reason;

      // need to call function on behalf of Chat GPT with the arguments it parsed from the conversation
      if (finishReason === 'tool_calls') {
        // parse JSON string of args into JSON object
        try {
          functionArgs = JSON.parse(functionArgs);
        } catch (error) {
          // was seeing an error where sometimes we have two sets of args
          if (functionArgs.indexOf('{') != functionArgs.lastIndexOf('{'))
            functionArgs = JSON.parse(functionArgs.substring(functionArgs.indexOf(''), functionArgs.indexOf('}') + 1));
        }

        //
        // Get all states and pass everything to all functions to make is easier to work with
        //
        const currentCall = getCall(this.CallSid);
        if (currentCall) {
          functionArgs = {
            ...functionArgs,
            ...currentCall,
            gptService: undefined,
          };

          const phoneState = getPhoneState(currentCall.From);
          if (phoneState) {
            functionArgs = {
              ...functionArgs,
              ...phoneState,
            };
          }
        }

        const functionToCall = availableFunctions[this.scenario][functionName];
        let functionResponse = await functionToCall(functionArgs);

        console.log('functionResponse: ', functionResponse); // {"stock":10}

        // Step 4: send the info on the function call and function response to GPT
        this.userContext.push({
          role: 'function',
          name: functionName,
          content: functionResponse,
        });
        // extend conversation with function response

        // call the completion function again but pass in the function response to have OpenAI generate a new assistant response
        await this.completion(functionResponse, interactionCount, 'function', functionName);
      } else {
        // We use completeResponse for userContext
        completeResponse += content;
        // We use partialResponse to provide a chunk for TTS
        partialResponse += content;
        // Emit last partial response and add complete response to userContext
        if (content.trim().slice(-1) === '•' || finishReason === 'stop') {
          const gptReply = {
            partialResponseIndex: this.partialResponseIndex,
            partialResponse,
          };

          console.log('gptReply', gptReply);

          this.emit('gptreply', gptReply, interactionCount);
          this.partialResponseIndex++;
          partialResponse = '';
        }
      }
    }
    this.userContext.push({ role: 'assistant', content: completeResponse });
    console.log(`GPT -> user context length: ${this.userContext.length}`.green);
  }
}

module.exports = { GptService };
