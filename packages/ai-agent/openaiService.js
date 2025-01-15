import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const openaiApiKey = process.env.OPENAI_API_KEY;
const openaiApiUrl = 'https://api.openai.com/v1/chat/completions';

const customJsonSchema = {
  type: "object",
  properties: {
    hasContext: { type: "boolean" },
    hasVoted: { type: "boolean" },
    providingDetails: { type: "boolean" },
    textResponse: { type: "string" },
  },
  required: ["textResponse", "hasContext", "hasVoted", "providingDetails"]
};

const generateResponse = async (messages) => {
  try {
    const response = await axios.post(
      openaiApiUrl,
      {
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: 150,
        functions: [
          {
            name: "generate_custom_structure",
            parameters: customJsonSchema,
            description: "Generate a response adhering to the custom structure defined by the JSON schema.",
          }
        ],
        function_call: {
          name: "generate_custom_structure",
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      }
    );

    // Return the structured data
    return response.data.choices[0].message.function_call.arguments;
  } catch (error) {
    console.error('Error generating response:', error.response ? error.response.data : error.message);
    throw error;
  }
};

export { generateResponse };

