"use client";

import { useFrontendTool } from "@copilotkit/react-core/v2";
import { z } from "zod";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import type { OpenGenerativeUIContent } from "@/lib/open-generative-ui";
import { OpenGenerativeSurface } from "./open-generative-surface";

const kanaSurfaceSchema = z.object({
  title: z
    .string()
    .describe("Short title for the generated Kana analysis surface."),
  initialHeight: z
    .number()
    .min(260)
    .max(900)
    .optional()
    .describe("Requested iframe height for the generated UI."),
  css: z
    .string()
    .describe("CSS for the generated surface. Keep it scoped and compact."),
  html: z
    .string()
    .describe("HTML body for the generated surface, using inline bill values."),
  js: z
    .string()
    .optional()
    .describe("Optional JavaScript for lightweight interactivity only."),
});

type KanaSurfaceArgs = z.infer<typeof kanaSurfaceSchema>;

export function useKanaSurface() {
  useFrontendTool({
    name: "render_kana_surface",
    description:
      "Render an open-ended, AI-generated Kana UI surface in both chat and the shared workspace. Use this for bill analysis, comparisons, savings plans, change analysis, custom dashboards, and any visual answer that should not be a fixed template.",
    parameters: kanaSurfaceSchema,
    followUp: false,
    handler: async (args: KanaSurfaceArgs) => {
      useGeneratedViewStore.getState().setOpenGeneratedView(toContent(args));
      return "Rendered generated Kana surface in the shared workspace.";
    },
    render: ({ args }) => {
      const parsed = kanaSurfaceSchema.safeParse(args);
      if (!parsed.success) return null;

      return (
        <div className="my-3">
          <OpenGenerativeSurface content={toContent(parsed.data)} compact />
          <p className="mt-2 text-xs text-zinc-400">
            Mirrored in the shared Kana workspace.
          </p>
        </div>
      );
    },
  });
}

function toContent(args: KanaSurfaceArgs): OpenGenerativeUIContent {
  const content: OpenGenerativeUIContent = {
    initialHeight: args.initialHeight ?? 520,
    generating: false,
    css: args.css,
    cssComplete: true,
    html: [args.html],
    htmlComplete: true,
  };

  if (args.js?.trim()) {
    content.jsFunctions = args.js;
    content.jsFunctionsComplete = true;
    content.jsExpressionsComplete = true;
  }

  return content;
}
