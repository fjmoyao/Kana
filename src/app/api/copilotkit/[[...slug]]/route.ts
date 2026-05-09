import { createAnthropic } from "@ai-sdk/anthropic";
import { CopilotRuntime, copilotRuntimeNextJSAppRouterEndpoint } from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { KANA_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { kanaTools } from "@/lib/agent/tools";

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const anthropicModel = anthropic(
  process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-20250514",
);

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: anthropicModel,
      prompt: KANA_SYSTEM_PROMPT,
      tools: kanaTools,
      maxSteps: 3,
    }),
  },
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
