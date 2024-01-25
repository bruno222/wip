// create metadata for all the available functions to pass to completions API
const tools = [
   {
    type: 'function',
    function: {
      name: 'buyCharger',
      description: 'Buy a pair of shoes',
      parameters: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            enum: ['sandals', 'running shoes','walking shoes', 'tennis shoes', 'dress shoes'],
            description: 'The type of shoes, running, tennis for Sports or sandals, dress shoes for leisure.',
          },
        },
        required: ['model'],
      },
      returns: {
        type: 'object',
        properties: {
          buyStatus: {
            type: 'string',
            description: 'Contains the status of the purchase.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'confirmPurchase',
      description: 'Security step to confirm the sale, sending an SMS to the customer with a link to be confirmed.',
      returns: {
        type: 'object',
        properties: {
          buyStatus: {
            type: 'string',
            description: 'Contains the status of this security step.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'saveCustomerName',
      description: 'Save the customer name and the city he/she is from',
      parameters: {
        type: 'object',
        properties: {
          customerName: {
            type: 'string',
            description: 'First name of the customer',
          },
          customerCity: {
            type: 'string',
            description: 'City of the customer',
          },
        },
        required: ['customerName', 'customerCity'],
      },
    },
  },
];

module.exports = tools;
