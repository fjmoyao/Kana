import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildOpenGenerativeUiDocument,
  hasGeneratedUiMarkup,
  openGenerativeUIContentSchema,
} from "../open-generative-ui.ts";

test("OpenGenerativeUI schema accepts streamed activity content", () => {
  const result = openGenerativeUIContentSchema.safeParse({
    initialHeight: 420,
    generating: true,
    css: ".card { color: #0369a1; }",
    cssComplete: true,
    html: ["<section class=\"card\">", "Benchmark</section>"],
    htmlComplete: false,
  });

  assert.ok(result.success);
});

test("hasGeneratedUiMarkup returns true for CSS or HTML chunks", () => {
  assert.equal(hasGeneratedUiMarkup({}), false);
  assert.equal(hasGeneratedUiMarkup({ css: ".card {}" }), true);
  assert.equal(hasGeneratedUiMarkup({ html: ["<div>Generated</div>"] }), true);
});

test("buildOpenGenerativeUiDocument wraps fragments and injects styles", () => {
  const html = buildOpenGenerativeUiDocument({
    css: ".metric { font-weight: 700; }",
    html: ["<main><p class=\"metric\">COP 42,000</p></main>"],
  });

  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<meta name="viewport"/i);
  assert.match(html, /\.metric \{ font-weight: 700; \}/);
  assert.match(html, /COP 42,000/);
});

test("buildOpenGenerativeUiDocument includes scripts only when requested", () => {
  const content = {
    html: ["<button id=\"save\">Save</button>"],
    jsFunctions: "function label(){ document.body.dataset.ready = 'yes'; }",
    jsExpressions: ["label()"],
  };

  const withoutScripts = buildOpenGenerativeUiDocument(content);
  const withScripts = buildOpenGenerativeUiDocument(content, {
    includeScripts: true,
  });

  assert.doesNotMatch(withoutScripts, /document\.body\.dataset\.ready/);
  assert.match(withScripts, /document\.body\.dataset\.ready/);
  assert.match(withScripts, /DOMContentLoaded/);
});
