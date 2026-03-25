import { getTrends } from "./trendScanner";
import { decideTopic } from "./decisionEngine";
import { researchAgent } from "./researchAgent";
import { contentAgent } from "./contentAgent";
import { seoAgent } from "./seoAgent";
import { generateImages } from "./generateImages";
import { generateVideoScript } from "./videoAgent";
import { distribute } from "./distributionEngine";
import { smartAds } from "./smartMonetization";
import { saveMemory } from "./memory";

export async function runGodMode() {
  console.log("👑 GOD MODE ACTIVATED");

  const trends = await getTrends();

  const decision = await decideTopic(trends);
  console.log("🧠 Selected:", decision.topic);

  const research = await researchAgent(decision.topic);
  const content = await contentAgent(decision, research);
  const seo = await seoAgent(content);
  const images = await generateImages();
  const video = await generateVideoScript(content);

  const monetization = smartAds(decision.topic);

  const final = {
    ...content,
    seo,
    images,
    video,
    monetization,
    trend: decision
  };

  await distribute(final);

  saveMemory(final);

  console.log("🚀 FULLY AUTONOMOUS SUCCESS");

  return final;
}