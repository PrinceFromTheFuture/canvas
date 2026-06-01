import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { LanguageModel } from "ai";

/**
 * DeepSeek v4 is the primary model, reached through the OpenAI-compatible
 * provider. `transformRequestBody` disables DeepSeek's thinking mode: reports
 * are deterministic data projections, so chain-of-thought adds latency/cost
 * without improving the constrained output. OpenAI/Anthropic remain available
 * via AI_PROVIDER; the rest of the system depends only on `LanguageModel`.
 */
function getDeepSeekModel(): LanguageModel {
  const deepseek = createOpenAICompatible({
    name: "deepseek",
    baseURL: "https://api.deepseek.com/v1",
    apiKey: process.env.DEEPSEEK_API_KEY,
    transformRequestBody: (body) => ({
      ...body,
      thinking: { type: "disabled" },
    }),
  });
  return deepseek.chatModel(process.env.AI_MODEL ?? "deepseek-v4-flash");
}

export function getModel(): LanguageModel {
  const provider = (process.env.AI_PROVIDER ?? "deepseek").toLowerCase();

  if (provider === "openai") {
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });
    return openai(process.env.AI_MODEL ?? "gpt-4o-mini");
  }
  if (provider === "anthropic") {
    const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    return anthropic(process.env.AI_MODEL ?? "claude-3-5-sonnet-latest");
  }
  return getDeepSeekModel();
}
