import {
  AnthropicAdapter,
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";
import { BuiltInAgent } from "@copilotkit/runtime/v2";
import { KANA_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { kanaTools } from "@/lib/agent/tools";

const serviceAdapter = new AnthropicAdapter({
  model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest",
});

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model: serviceAdapter.getLanguageModel(),
      prompt: KANA_SYSTEM_PROMPT,
      tools: kanaTools,
      maxSteps: 5,
    }),
  },
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
    serviceAdapter,
  });
  return handleRequest(req);
};
