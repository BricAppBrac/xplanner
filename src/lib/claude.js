import { buildSystemPrompt } from "./systemPrompt";

export async function sendMessage(messages, profile, cultures) {
  const systemPrompt = buildSystemPrompt(profile, cultures);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-opus-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });

  const data = await response.json();
  return data.content[0].text;
}
