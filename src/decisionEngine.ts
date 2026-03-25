import OpenAI from "openai";
import { config } from "./config";

const openai = new OpenAI({ apiKey: config.openaiKey });

export async function decideTopic(trends: string[]) {
  const prompt = `
You are an AI CEO.

Pick the BEST topic for maximum:
- Traffic
- Virality
- Monetization

Trends:
${trends.join(", ")}

Return JSON:
{
  "topic": "",
  "reason": "",
  "profit_score": 1-100
}
`;

  const res = await openai.chat.completions.create({
    model: "gpt-5.3",
    messages: [{ role: "user", content: prompt }]
  });

  return JSON.parse(res.choices[0].message.content!);
}