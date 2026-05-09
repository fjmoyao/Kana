"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useBillStore } from "@/lib/store/bill-store";
import type { Bill } from "@/types/bill";

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadZone() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addBill = useBillStore((s) => s.addBill);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.type && file.type !== "application/pdf") {
        setStatus("error");
        setError("Only PDF files are supported");
        return;
      }

      setStatus("uploading");
      setFileName(file.name);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", { method: "POST", body: formData });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || `Upload failed (${res.status})`);
        }

        const data: { fileId: string; fileName: string; bill: Bill } =
          await res.json();
        addBill(data.bill);
        setStatus("success");
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    },
    [addBill],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setStatus("idle");
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      for (const file of files) {
        uploadFile(file);
      }
      e.target.value = "";
    },
    [uploadFile],
  );

  return (
    <Card
      className={`relative flex flex-col items-center justify-center gap-3 border-2 border-dashed p-8 transition-colors cursor-pointer ${
        status === "dragging"
          ? "border-blue-500 bg-blue-50"
          : status === "error"
            ? "border-red-300 bg-red-50"
            : status === "success"
              ? "border-green-300 bg-green-50"
              : "border-zinc-300 hover:border-zinc-400"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        setStatus("dragging");
      }}
      onDragLeave={() => setStatus("idle")}
      onDrop={handleDrop}
      onClick={() => document.getElementById("pdf-upload")?.click()}
    >
      <input
        id="pdf-upload"
        type="file"
        accept=".pdf"
        multiple
        className="hidden"
        onChange={handleFileInput}
      />

      {status === "uploading" && (
        <>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          <p className="text-sm text-zinc-600">Parsing {fileName}...</p>
        </>
      )}

      {status === "success" && (
        <>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Parsed
          </Badge>
          <p className="text-sm text-zinc-600">{fileName}</p>
          <p className="text-xs text-zinc-400">Drop another bill or click to upload</p>
        </>
      )}

      {status === "error" && (
        <>
          <Badge variant="destructive">Error</Badge>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-zinc-400">Try again</p>
        </>
      )}

      {(status === "idle" || status === "dragging") && (
        <>
          <svg
            className="h-8 w-8 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="text-sm font-medium text-zinc-700">
            Drop your EPM bill PDF here
          </p>
          <p className="text-xs text-zinc-400">or click to browse</p>
        </>
      )}
    </Card>
  );
}
