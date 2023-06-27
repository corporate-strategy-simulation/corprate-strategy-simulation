import dotenv from "dotenv";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { NextResponse } from "next/server";

dotenv.config({ path: `.env.local` });

export async function POST(req: Request) {
  // Extract the `prompt` from the body of the request
  const { prompt } = await req.json();

  const companyOnboardPrompt = new PromptTemplate({
    template: `You will act as a fake company name generator. Based on the
      provided topic, you will provide one suggestion for an online software service that could be 
      provided by a new technology company, along with the name of the new service and the new 
      company. Generate one idea for a new company. It must be unique and new, but it must be
      inspired by the provided topic. The service name and company name must not correspond to any known company 
      or service in existence, but it is OK if there is an existing company or service that does 
      something similar. The names should be in title case, like "Cool Company", not PascalCase
      like "CoolCompany". Return the suggestion in JSON format, as an object with 4 properties: 
      companyName, serviceName, serviceDescription, and features. The features should be a list of 
      strings describing the initial 20 features that the service would need to implement to be 
      usable. The suggested topic is: 

      {topic}

      Your response must only be the expected JSON, with no other text before or after the JSON 
      object. Only respond with a complete, valid JSON object.
      `,
    inputVariables: ["topic"],
  });

  try {
    const model = new OpenAI({
      streaming: true,
      modelName: "gpt-3.5-turbo-16k",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = new LLMChain({ llm: model, prompt: companyOnboardPrompt });
    const res = await chain.call({ topic: prompt });

    return NextResponse.json(JSON.parse(res.text));
  } catch (error) {
    console.error(error);
    throw error;
  }
}
