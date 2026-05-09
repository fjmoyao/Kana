"use client";

import { useEffect } from "react";
import type { ReactActivityMessageRenderer } from "@copilotkit/react-core/v2";
import { useGeneratedViewStore } from "@/lib/store/generated-view-store";
import {
  openGenerativeUIContentSchema,
  type OpenGenerativeUIContent,
} from "@/lib/open-generative-ui";

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

  return null;
}
