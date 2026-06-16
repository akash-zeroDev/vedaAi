const { BedrockRuntimeClient, ConverseCommand } = require("@aws-sdk/client-bedrock-runtime");
require('dotenv').config({ path: '/Users/apple/Desktop/VedaAi/veda-ai-assessment/backend/.env' });

async function testBedrock() {
  console.log("Testing Bedrock with AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
  
  const bedrockClient = new BedrockRuntimeClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    }
  });

  const command = new ConverseCommand({
    modelId: 'meta.llama3-70b-instruct-v1:0',
    messages: [{ role: "user", content: [{ text: "Hello, testing 123" }] }],
  });

  try {
    const response = await bedrockClient.send(command);
    console.log("Success! Response:", response.output.message.content[0].text);
  } catch (error) {
    console.error("Bedrock Error:");
    console.error("Name:", error.name);
    console.error("Message:", error.message);
  }
}

testBedrock();
