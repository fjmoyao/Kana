"use client";

import { Card } from "@/components/ui/card";

export function SkeletonCard() {
  return (
    <Card className="w-full animate-pulse space-y-3 p-5">
      <div className="flex items-center justify-between">
        <div className="h-4 w-28 rounded bg-zinc-200" />
        <div className="h-5 w-16 rounded-full bg-zinc-200" />
      </div>
      <div className="h-8 w-36 rounded bg-zinc-200" />
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-zinc-100" />
        <div className="h-3 w-4/5 rounded bg-zinc-100" />
        <div className="h-3 w-3/5 rounded bg-zinc-100" />
      </div>
    </Card>
  );
}
