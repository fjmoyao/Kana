import { NextResponse } from "next/server";
import { parseEpmBill } from "../../../lib/parser/parse-epm-bill";
import { extractTextFromPdf } from "../../../lib/parser/extract-text";
import { isPdfFile } from "../../../lib/files/pdf";
import { storeBillFile } from "../../../lib/server/bill-file-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "PDF file is required" }, { status: 400 });
    }

    if (!isPdfFile(file)) {
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
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF upload failed";
    const status = message.includes("no readable text") ? 422 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
