import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function extractTextFromBillFile(filePath) {
  const extension = extname(filePath).toLowerCase();
  if (extension === ".txt") {
    return readFile(filePath, "utf8");
  }

  if (extension !== ".pdf") {
    throw new Error(`Unsupported bill input: ${extension || "unknown extension"}`);
  }

  const attempts = [
    () => runCommand("pdftotext", ["-layout", filePath, "-"]),
    () => runCommand("mutool", ["draw", "-F", "txt", "-o", "-", filePath]),
  ];

  const errors = [];
  for (const attempt of attempts) {
    try {
      const output = await attempt();
      if (output.trim()) return output;
    } catch (error) {
      errors.push(error.message);
    }
  }

  throw new Error(
    [
      "Could not extract text from PDF.",
      "Install Poppler (`pdftotext`) or MuPDF (`mutool`), or pass a .txt file with extracted bill text.",
      `Extractor errors: ${errors.join(" | ")}`,
    ].join(" "),
  );
}

async function runCommand(command, args) {
  const { stdout } = await execFileAsync(command, args, {
    maxBuffer: 20 * 1024 * 1024,
  });
  return stdout;
}
