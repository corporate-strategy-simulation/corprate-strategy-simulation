import dotenv from "dotenv";
import Replicate from "replicate";
import { NextResponse } from "next/server";
import { LLMChain } from "langchain/chains";
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";

dotenv.config({ path: `.env.local` });

export async function POST(request: Request) {
  const { serviceName, serviceDescription } = await request.json();

  const promptTemplate = new PromptTemplate({
    template: `Generate a concise, specific prompt for a text-to-image model to generate a logo for a subscription service
named {serviceName}.

The prompt must specify the image style and include specific details of the subject. The prompt must use the following
format:
<style> logo of <subject>, <addition style keywords, subject details>.

The the service {serviceName} is described as follows: {serviceDescription}

Based on the name and description of the service, select an appropriate subject for a simple, clear logo.
Consider a subject which is symbolic or evocative of the service, or a subject which could indirectly relate to the service.
Do not explain the symbolism, just use a concise description of the subject.
Do not include any words or suggestions for text in the logo.
Do not include any letters in the logo.

Select a style and subject for the logo based on the name and description of the service, and then generate
a prompt in the requested format, similar to the examples, using the selected style and subject for the service.
Pick a single, specific subject to use in the prompt.

Examples of prompts for logos:
  - "Logo design, logo style, modern, Luxurious, Geometrical, vector, adobe illustrator, symmetrical logo of sacred mushroom, plant medicine, white background, Psychedelic Shop."
  - "Vector anime chibi style logo of a single piece of flaming popcorn with a smiling face, with mirrorshades sunglasses, popcorn as morpheus, clean composition, symmetrical."
  - "A modern and sleek logo of a 3D geometric shape with a gradient color scheme, futuristic vibe."
  - "E-sports logo of a lion, vector art, black & white."
  - "A colorful and whimsical logo of a friendly teddy bear, illustration."
  - "A bold and edgy logo of an abstract graphic with a vibrant color scheme, for a fashion-forward streetwear brand."

Respond only with the prompt for the logo, with no other text before or after the prompt.
`,
    inputVariables: ["serviceName", "serviceDescription"],
  });

  let imagePrompt: string;
  try {
    const model = new OpenAI({
      streaming: true,
      modelName: "gpt-3.5-turbo-16k",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    const chain = new LLMChain({ llm: model, prompt: promptTemplate });
    const res = await chain.call({ serviceName, serviceDescription });

    imagePrompt = res.text;
  } catch (error) {
    console.error(error);
    throw error;
  }

  console.log("imagePrompt", imagePrompt);
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN || "",
  });

  const output = await replicate.run(
    "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
    {
      input: {
        prompt: imagePrompt,
        negative_prompt: "text",
        image_dimensions: "512x512",
      },
    }
  );

  const outputArray = output as string[];
  return NextResponse.json(
    outputArray.map((item) => ({
      source: item,
      description: imagePrompt,
    }))
  );
}
