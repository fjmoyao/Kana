import {
  BuiltInAgent,
  CopilotRuntime,
  createCopilotRuntimeHandler,
} from "@copilotkit/runtime/v2";
import { KANA_SYSTEM_PROMPT } from "@/lib/agent/system-prompt";
import { kanaTools } from "@/lib/agent/tools";

const model = process.env.ANTHROPIC_MODEL
  ? `anthropic:${process.env.ANTHROPIC_MODEL}`
  : "anthropic:claude-haiku-4-5-20251001";

const runtime = new CopilotRuntime({
  agents: {
    default: new BuiltInAgent({
      model,
      instructions: KANA_SYSTEM_PROMPT,
      tools: kanaTools,
      maxSteps: 5,
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
