import dotenv from "dotenv";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { NextResponse } from "next/server";

dotenv.config({ path: `.env.local` });

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { prompt } = await req.json();

  const promptTemplate = new PromptTemplate({
    template: `You will act as a fake software service feature generator. Based on the provided details about an
existing software service and an existing set of features, you will provide 20 suggestions for new
features that could be appropriate new features to add to the existing service. Generate 20 ideas
for new features, each unique and concise (one or two sentences) based on the provided details. Each
feature should be unique and should not duplicate existing features, but should be appropriate
incremental new features to add to the service based on the name of the service, the description of
the service, and the current list of existing features. The prompt will be provided in the form of a
JSON object with the following properties: companyName, serviceName, serviceDescription, and
features where features is an array of strings describing each feature. Return the suggestions in
JSON format, as an object with a property "suggestions" which is an array of 20 strings. Only
provide the JSON text for the response. The provided details about the service are as follows:

{serviceDetails}

Your response must only be the expected JSON, with no other text before or after the JSON object.
`,
    inputVariables: ["serviceDetails"],
  });

  try {
    const model = new OpenAI({
      streaming: true,
      modelName: "gpt-3.5-turbo-16k",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = new LLMChain({ llm: model, prompt: promptTemplate });
    const res = await chain.call({ serviceDetails: prompt });

    return NextResponse.json(JSON.parse(res.text));
  } catch (error) {
    console.error(error);
    throw error;
  }
}
