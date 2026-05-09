import { NextResponse } from "next/server";
import { parseEpmBill } from "../../../lib/parser/parse-epm-bill";
import { extractTextFromPdf } from "../../../lib/parser/extract-text";
import { storeBillFile } from "../../../lib/server/bill-file-store";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
  }

  if (file.type && file.type !== "application/pdf") {
    return NextResponse.json({ error: "Only PDF files are supported" }, { status: 415 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const storedFile = storeBillFile(file.name, buffer);
  const text = await extractTextFromPdf(buffer);
  const bill = await parseEpmBill(text, { sourceFile: file.name });

  return NextResponse.json({
    fileId: storedFile.fileId,
    fileName: storedFile.fileName,
    bill,
  });
}
