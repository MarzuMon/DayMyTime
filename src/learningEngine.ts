import { getMemory } from "./memory";

export function improveStrategy() {
  const memory = getMemory();

  return {
    bestTopics: memory.map(m => m.trend?.topic),
    improvement: "Focus more on high-engagement topics"
  };
}