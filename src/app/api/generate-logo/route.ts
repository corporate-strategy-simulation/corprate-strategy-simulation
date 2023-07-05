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

    The prompt must specify the image style and include specific details of subject.

    Examples of prompts for logos:
     - Logo design, logo style, modern, Luxurious, Geometrical, vector, adobe illustrator, symmetrical, sacred mushroom, plant medicine, white background, Psychedelic Shop.
     - Vector anime chibi style logo featuring a single piece of flaming piece of popcorn with a smiling face, with mirrorshades sunglasses, popcorn as morpheus, clean composition, symmetrical.
     - A modern and sleek logo for a tech company specializing in virtual reality technology. The logo should incorporate a futuristic vibe and feature a 3D geometric shape with a gradient color scheme.
     - E-sports Logo, Lion, vector art, black & white.
     - A colorful and whimsical logo for a children’s toy store. The logo should include an illustration of a friendly animal, such as a teddy bear or a unicorn, and incorporate a playful font.
     - A bold and edgy logo for a fashion-forward streetwear brand. The logo should incorporate a graffiti-style font and feature an abstract graphic with a vibrant color scheme.

    The the service {serviceName} is described as follows: {serviceDescription}

    The logo should be inspired by or somehow represent the service based on the name and description of the service.

    Respond only with the prompt for the logo, with no other text before or after the prompt.
`,
    inputVariables: ["serviceName", "serviceDescription"],
  });

  let imagePrompt;
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
      },
    }
  );

  return NextResponse.json(output);
}
