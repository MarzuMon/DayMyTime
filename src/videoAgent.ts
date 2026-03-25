export async function generateVideoScript(content: any) {
  return `
🎬 Hook:
${content.title}

📖 Story:
${content.content.slice(0, 300)}

🔥 CTA:
Follow for more productivity hacks!
`;
}