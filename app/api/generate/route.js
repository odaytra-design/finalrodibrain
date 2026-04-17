
import OpenAI from "openai";

export async function POST(req){
  const {input}=await req.json();

  const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY});

  const res=await openai.chat.completions.create({
    model:"gpt-4o-mini",
    messages:[{role:"user",content:input}]
  });

  return Response.json({result:res.choices[0].message.content});
}
