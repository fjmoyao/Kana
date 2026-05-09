import { z } from "zod";

export const openGenerativeUIContentSchema = z.object({
  initialHeight: z.number().optional(),
  generating: z.boolean().optional(),
  css: z.string().optional(),
  cssComplete: z.boolean().optional(),
  html: z.array(z.string()).optional(),
  htmlComplete: z.boolean().optional(),
  jsFunctions: z.string().optional(),
  jsFunctionsComplete: z.boolean().optional(),
  jsExpressions: z.array(z.string()).optional(),
  jsExpressionsComplete: z.boolean().optional(),
});

export type OpenGenerativeUIContent = z.infer<
  typeof openGenerativeUIContentSchema
>;

interface BuildDocumentOptions {
  includeScripts?: boolean;
}

export function hasGeneratedUiMarkup(content: OpenGenerativeUIContent) {
  return Boolean(
    content.css?.trim() ||
      content.html?.some((chunk) => chunk.trim().length > 0),
  );
}

export function buildOpenGenerativeUiDocument(
  content: OpenGenerativeUIContent,
  options: BuildDocumentOptions = {},
) {
  const rawHtml = content.html?.join("") ?? "";
  const css = [
    "html, body { margin: 0; min-height: 100%; background: transparent; }",
    "body { font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif; }",
    content.css ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  let documentHtml = ensureHtmlDocument(rawHtml);
  documentHtml = injectIntoHead(
    documentHtml,
    [
      '<meta charset="utf-8">',
      '<meta name="viewport" content="width=device-width, initial-scale=1">',
      "<base target=\"_blank\">",
      `<style>${escapeStyleText(css)}</style>`,
    ].join("\n"),
  );

  if (options.includeScripts) {
    const script = buildRuntimeScript(content);
    if (script) {
      documentHtml = injectBeforeBodyClose(
        documentHtml,
        `<script>${escapeScriptText(script)}</script>`,
      );
    }
  }

  return documentHtml;
}

function ensureHtmlDocument(rawHtml: string) {
  const html = rawHtml.trim();

  if (!html) {
    return "<!doctype html><html><head></head><body></body></html>";
  }

  if (/<!doctype\s+html/i.test(html) || /<html[\s>]/i.test(html)) {
    return html;
  }

  if (/<head[\s>]/i.test(html) || /<body[\s>]/i.test(html)) {
    return `<!doctype html><html>${html}</html>`;
  }

  return `<!doctype html><html><head></head><body>${html}</body></html>`;
}

function injectIntoHead(documentHtml: string, markup: string) {
  if (/<\/head>/i.test(documentHtml)) {
    return documentHtml.replace(/<\/head>/i, `${markup}</head>`);
  }

  if (/<html[\s>]/i.test(documentHtml)) {
    return documentHtml.replace(
      /<html([^>]*)>/i,
      `<html$1><head>${markup}</head>`,
    );
  }

  return `<head>${markup}</head>${documentHtml}`;
}

function injectBeforeBodyClose(documentHtml: string, markup: string) {
  if (/<\/body>/i.test(documentHtml)) {
    return documentHtml.replace(/<\/body>/i, `${markup}</body>`);
  }

  return `${documentHtml}${markup}`;
}

function buildRuntimeScript(content: OpenGenerativeUIContent) {
  const snippets = [
    content.jsFunctions,
    ...(content.jsExpressions ?? []),
  ].filter((snippet): snippet is string => Boolean(snippet?.trim()));

  if (snippets.length === 0) return "";

  return `
window.addEventListener("DOMContentLoaded", function () {
  try {
${snippets.join("\n;\n")}
  } catch (error) {
    console.error("[Kana generated UI]", error);
  }
});
`.trim();
}

function escapeStyleText(styleText: string) {
  return styleText.replace(/<\/style/gi, "<\\/style");
}

function escapeScriptText(scriptText: string) {
  return scriptText.replace(/<\/script/gi, "<\\/script");
}
