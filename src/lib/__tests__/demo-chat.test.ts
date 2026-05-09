import test from "node:test";
import assert from "node:assert/strict";
import { getDeterministicChatReply, getDeterministicSuggestions } from "../demo-chat.ts";
import { sampleBills, personas } from "../sample-data.ts";

test("benchmark prompt routes to benchmark view with comparison copy", () => {
  const result = getDeterministicChatReply({
    prompt: "How do I compare to similar households?",
    bills: sampleBills,
    activeBillIndex: sampleBills.length - 1,
    personas,
  });

  assert.equal(result.view, "benchmark");
  assert.match(result.reply, /similar estrato/i);
  assert.match(result.reply, /Similar Households view/i);
});

test("empty bill context asks for an upload instead of failing", () => {
  const result = getDeterministicChatReply({
    prompt: "How do I compare to similar households?",
    bills: [],
    activeBillIndex: 0,
    personas,
  });

  assert.equal(result.view, null);
  assert.match(result.reply, /upload an epm pdf/i);
});

test("bill-loaded suggestions include the benchmark shortcut", () => {
  const suggestions = getDeterministicSuggestions(true);
  assert.ok(
    suggestions.some(
      (suggestion) =>
        suggestion.message === "How do I compare to similar households?",
    ),
  );
});
