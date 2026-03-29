"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { triggerReindex } from "@/lib/triggerReindex";

export default function DeleteItemButton({
  deleteUrl,
  title,
}: {
  deleteUrl: string;
  title: string;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    const res = await fetch(deleteUrl, { method: "DELETE" });
    if (res.ok) {
      triggerReindex();
      router.refresh();
    }
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleDelete}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-red-700"
        >
          Delete
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-md px-2 py-1 text-xs text-slate-400 transition hover:text-white"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-500/15 hover:text-red-400"
      title={`Delete "${title}"`}
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}
