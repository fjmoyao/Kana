"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { isPdfFile } from "@/lib/files/pdf";
import { useBillStore } from "@/lib/store/bill-store";
import type { Bill } from "@/types/bill";

type UploadStatus = "idle" | "dragging" | "uploading" | "success" | "error";

export function UploadZone() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const addBill = useBillStore((s) => s.addBill);

  useEffect(() => {
    const preventBrowserFileOpen = (event: DragEvent) => {
      if (hasDraggedFiles(event)) {
        event.preventDefault();
      }
    };

    window.addEventListener("dragover", preventBrowserFileOpen);
    window.addEventListener("drop", preventBrowserFileOpen);

    return () => {
      window.removeEventListener("dragover", preventBrowserFileOpen);
      window.removeEventListener("drop", preventBrowserFileOpen);
    };
  }, []);

  const uploadFile = useCallback(
    async (file: File) => {
      if (!isPdfFile(file)) {
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

  const uploadFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      if (files.length === 0) {
        setStatus("error");
        setError("Drop a PDF file to upload");
        return;
      }

      for (const file of files) {
        await uploadFile(file);
      }
    },
    [uploadFile],
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setStatus("idle");
      await uploadFiles(e.dataTransfer.files);
    },
    [uploadFiles],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    if (!hasDraggedFiles(e.nativeEvent)) return;

    e.preventDefault();
    e.stopPropagation();
    setStatus("dragging");
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!hasDraggedFiles(e.nativeEvent)) return;

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setStatus("dragging");
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (isNode(e.relatedTarget) && e.currentTarget.contains(e.relatedTarget)) {
      return;
    }

    setStatus("idle");
  }, []);

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      await uploadFiles(e.target.files || []);
      e.target.value = "";
    },
    [uploadFiles],
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
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id="pdf-upload"
        type="file"
        aria-label="Upload EPM bill PDF"
        accept=".pdf,application/pdf,application/x-pdf"
        multiple
        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onChange={handleFileInput}
      />

      {status === "uploading" && (
        <div className="pointer-events-none contents">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-700" />
          <p className="text-sm text-zinc-600">Parsing {fileName}...</p>
        </div>
      )}

      {status === "success" && (
        <div className="pointer-events-none contents">
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Parsed
          </Badge>
          <p className="text-sm text-zinc-600">{fileName}</p>
          <p className="text-xs text-zinc-400">Drop another bill or click to upload</p>
        </div>
      )}

      {status === "error" && (
        <div className="pointer-events-none contents">
          <Badge variant="destructive">Error</Badge>
          <p className="text-sm text-red-600">{error}</p>
          <p className="text-xs text-zinc-400">Try again</p>
        </div>
      )}

      {(status === "idle" || status === "dragging") && (
        <div className="pointer-events-none contents">
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
        </div>
      )}
    </Card>
  );
}

function hasDraggedFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

function isNode(value: EventTarget | null): value is Node {
  return value instanceof Node;
}
