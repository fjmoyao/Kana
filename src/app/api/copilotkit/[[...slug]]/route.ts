import {
  CopilotRuntime,
  copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime";

const runtime = new CopilotRuntime({
  actions: [
    {
      name: "greet",
      description: "Greet the user as Kana, the utility copilot for Medellin households",
      parameters: [],
      handler: async () => {
        return "Hello from Kana! Upload an EPM utility bill PDF to get started.";
      },
    },
  ],
});

export const POST = async (req: Request) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    endpoint: "/api/copilotkit",
  });
  return handleRequest(req);
};
