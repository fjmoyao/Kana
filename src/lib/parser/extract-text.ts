type PdfParseResult = {
  text?: string;
};

type PdfParse = (buffer: Buffer) => Promise<PdfParseResult>;

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("extractTextFromPdf expects a PDF Buffer.");
  }

  if (buffer.byteLength === 0) {
    throw new Error("Cannot extract text from an empty PDF buffer.");
  }

  const pdfParse = await loadPdfParse();
  const result = await pdfParse(buffer);
  const text = normalizeExtractedText(result.text ?? "");

  if (!text) {
    throw new Error("PDF text extraction returned no readable text.");
  }

  return text;
}

function normalizeExtractedText(text: string): string {
  return text
    .normalize("NFC")
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function loadPdfParse(): Promise<PdfParse> {
  try {
    const pdfParseModule = await import("pdf-parse");
    return (pdfParseModule.default ?? pdfParseModule) as PdfParse;
  } catch (error) {
    throw new Error(
      `pdf-parse is required for PDF extraction. Run npm install before parsing PDFs. ${String(error)}`,
    );
  }
}
