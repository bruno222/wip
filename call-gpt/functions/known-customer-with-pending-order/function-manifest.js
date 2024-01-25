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
      name: 'productDelivery',
      description: 'Update the order status to delivered',
    },
  },
];

module.exports = tools;
