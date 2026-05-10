type PdfFileCandidate = {
  name?: string;
  type?: string;
};

const PDF_MIME_TYPES = new Set([
  "application/pdf",
  "application/x-pdf",
  "text/pdf",
  "text/x-pdf",
]);

export function isPdfFile(file: PdfFileCandidate): boolean {
  const mimeType = file.type?.trim().toLowerCase() ?? "";
  const fileName = file.name?.trim().toLowerCase() ?? "";

  return (
    fileName.endsWith(".pdf") ||
    PDF_MIME_TYPES.has(mimeType) ||
    mimeType.endsWith("+pdf")
  );
}
