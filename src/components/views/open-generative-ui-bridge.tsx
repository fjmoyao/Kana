"use client";

import { useEffect } from "react";
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import {
  openGenerativeUIContentSchema,
  type OpenGenerativeUIContent,
} from "@/lib/open-generative-ui";
import { OpenGenerativeSurface } from "./open-generative-surface";

const OPEN_GENERATIVE_UI_ACTIVITY_TYPE = "open-generative-ui";

export const kanaOpenGenerativeUIActivityRenderer: ReactActivityMessageRenderer<OpenGenerativeUIContent> =
  {
    activityType: OPEN_GENERATIVE_UI_ACTIVITY_TYPE,
    content: openGenerativeUIContentSchema,
    render: ({ content }) => <OpenGenerativeUIBridge content={content} />,
  };

function OpenGenerativeUIBridge({
  content,
}: {
  content: OpenGenerativeUIContent;
}) {
  const setOpenGeneratedView = useGeneratedViewStore(
    (s) => s.setOpenGeneratedView,
  );

  useEffect(() => {
    setOpenGeneratedView(content);
  }, [content, setOpenGeneratedView]);

  return (
    <div className="my-3">
      <OpenGenerativeSurface content={content} compact />
      <p className="mt-2 text-xs text-zinc-400">
        Mirrored in the shared Kana workspace.
      </p>
    </div>
  );
}
