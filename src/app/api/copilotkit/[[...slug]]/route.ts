import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { KANA_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { kanaTools } from "@/lib/agent/tools";

const chatModel =
  process.env.KANA_CHAT_MODEL ??
  process.env.COPILOTKIT_CHAT_MODEL ??
  "claude-haiku-4-5-20251001";
const model =
  chatModel.includes(":") || chatModel.includes("/")
    ? chatModel
    : `anthropic:${chatModel}`;

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model,
      prompt: KANA_SYSTEM_PROMPT,
      tools: kanaTools,
      maxSteps: 6,
      maxOutputTokens: 1200,
      maxRetries: 1,
      temperature: 0.2,
      providerOptions: {
        anthropic: {
          disableParallelToolUse: true,
        },
      },
    }),
  },
});

const handler = createCopilotRuntimeHandler({
  runtime,
  basePath: "/api/copilotkit",
  mode: "single-route",
});

async function routeHandler(req: Request) {
  return handler(req);
}

export const GET = routeHandler;
export const POST = routeHandler;
export const PUT = routeHandler;
export const DELETE = routeHandler;
export const OPTIONS = routeHandler;
