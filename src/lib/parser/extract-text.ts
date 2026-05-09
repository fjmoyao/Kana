import { join } from "node:path";
import { pathToFileURL } from "node:url";

type PdfTextResult = {
  text?: string;
};

type PdfParser = {
  getText: () => Promise<PdfTextResult>;
  destroy: () => Promise<void>;
};

type PdfParseConstructor = {
  new (options: { data: Buffer }): PdfParser;
  setWorker: (workerSrc?: string) => string;
};

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  if (!Buffer.isBuffer(buffer)) {
    throw new TypeError("extractTextFromPdf expects a PDF Buffer.");
  }

  if (buffer.byteLength === 0) {
    throw new Error("Cannot extract text from an empty PDF buffer.");
  }

  const PDFParse = await loadPdfParse();
  configurePdfWorker(PDFParse);
  const parser = new PDFParse({ data: buffer });

  let result: PdfTextResult;
  try {
    result = await parser.getText();
  } finally {
    await parser.destroy();
  }

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

async function loadPdfParse(): Promise<PdfParseConstructor> {
  try {
    const pdfParseModule = await import("pdf-parse");
    if ("PDFParse" in pdfParseModule && typeof pdfParseModule.PDFParse === "function") {
      return pdfParseModule.PDFParse as PdfParseConstructor;
    }

    throw new TypeError("pdf-parse v2 did not expose a PDFParse constructor.");
  } catch (error) {
    throw new Error(
      `pdf-parse is required for PDF extraction. Run npm install before parsing PDFs. ${String(error)}`,
    );
  }
}

function configurePdfWorker(PDFParse: PdfParseConstructor): void {
  const workerPath = join(process.cwd(), "node_modules/pdf-parse/dist/worker/pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).toString());
}
