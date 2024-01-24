// create metadata for all the available functions to pass to completions API
const tools = [
  {
    type: 'function',
    function: {
      name: 'buyCharger',
      description: 'Buy a charger for your phone',
      parameters: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            enum: ['usb c', 'lightning'],
            description: 'The model of the charger, USB B for Android or Lightning for iPhone.',
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
