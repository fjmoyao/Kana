#!/usr/bin/env node
import { basename } from "node:path";
import { parseEpmBillText } from "./epmBillParser.js";
import { extractTextFromBillFile } from "./pdfTextExtractor.js";

const [inputPath] = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));

if (!inputPath) {
  console.error("Usage: npm run parse:epm -- <bill.pdf|bill.txt>");
  process.exit(1);
}

try {
  const text = await extractTextFromBillFile(inputPath);
  const parsed = parseEpmBillText(text, { sourceFile: basename(inputPath) });
  console.log(JSON.stringify(parsed, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
