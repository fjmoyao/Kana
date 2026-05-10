import { NextResponse } from "next/server";
import { parseEpmBill } from "../../../lib/parser/parse-epm-bill";
import { extractTextFromPdf } from "../../../lib/parser/extract-text";
import { getBillFile } from "../../../lib/server/bill-file-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const fileId = body?.fileId;

    if (typeof fileId !== "string" || !fileId) {
      return NextResponse.json({ error: "fileId is required" }, { status: 400 });
    }

    const storedFile = getBillFile(fileId);
    if (!storedFile) {
      return NextResponse.json({ error: "Uploaded PDF not found" }, { status: 404 });
    }

    const text = await extractTextFromPdf(storedFile.buffer);
    const bill = await parseEpmBill(text, { sourceFile: storedFile.fileName });

    return NextResponse.json({ bill });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF parse failed";
    const status = message.includes("no readable text") ? 422 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
