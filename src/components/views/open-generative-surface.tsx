"use client";

import { useMemo } from "react";
import {
  buildOpenGenerativeUiDocument,
  hasGeneratedUiMarkup,
  type OpenGenerativeUIContent,
} from "@/lib/open-generative-ui";

interface OpenGenerativeSurfaceProps {
  content: OpenGenerativeUIContent;
  compact?: boolean;
}

export function OpenGenerativeSurface({
  content,
  compact = false,
}: OpenGenerativeSurfaceProps) {
  const canRenderMarkup = hasGeneratedUiMarkup(content);
  const height = Math.max(
    compact ? 220 : 380,
    Math.min(
      content.initialHeight ?? (compact ? 260 : 520),
      compact ? 420 : 760,
    ),
  );
  const includeScripts =
    Boolean(content.htmlComplete) &&
    (Boolean(content.jsFunctionsComplete) ||
      Boolean(content.jsExpressionsComplete));
  const srcDoc = useMemo(
    () => buildOpenGenerativeUiDocument(content, { includeScripts }),
    [content, includeScripts],
  );

  if (!canRenderMarkup) {
    return (
      <div className="rounded-[24px] border border-blue-100 bg-blue-50/70 p-5">
        <div className="h-2 w-24 animate-pulse rounded-full bg-blue-200" />
        <div className="mt-4 h-3 w-5/6 animate-pulse rounded-full bg-white" />
        <div className="mt-2 h-3 w-2/3 animate-pulse rounded-full bg-white" />
        <p className="mt-4 text-xs font-medium text-blue-700">
          Generating a custom Kana surface...
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
      {content.generating !== false && (
        <div className="flex items-center justify-between border-b border-blue-100 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-700">
          <span>Generating live UI</span>
          <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
        </div>
      )}
      <iframe
        className="block w-full bg-transparent"
        sandbox="allow-scripts"
        srcDoc={srcDoc}
        style={{ height }}
        title="Kana generated UI"
      />
    </div>
  );
}
