import assert from "node:assert/strict";
import { test } from "node:test";
import { isPdfFile } from "../pdf.ts";

test("isPdfFile accepts PDFs by extension when browsers omit or generalize MIME type", () => {
  assert.equal(isPdfFile({ name: "epm-bill.pdf", type: "" }), true);
  assert.equal(
    isPdfFile({ name: "epm-bill.PDF", type: "application/octet-stream" }),
    true,
  );
});

test("isPdfFile accepts common PDF MIME variants", () => {
  assert.equal(isPdfFile({ name: "download", type: "application/pdf" }), true);
  assert.equal(isPdfFile({ name: "download", type: "application/x-pdf" }), true);
});

test("isPdfFile rejects non-PDF files", () => {
  assert.equal(isPdfFile({ name: "notes.txt", type: "text/plain" }), false);
  assert.equal(isPdfFile({ name: "archive.zip", type: "" }), false);
});
