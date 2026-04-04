// Client-side fire-and-forget reindex trigger with debounce

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function triggerReindex(): void {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    fetch("/api/admin/reindex", { method: "POST" })
      .then((res) => {
        if (res.status === 409) {
          console.log("[reindex] Already running, skipped");
        } else if (res.status === 429) {
          console.log("[reindex] Rate limited, will retry on next save");
        } else if (!res.ok) {
          console.error("[reindex] Failed:", res.status);
        } else {
          console.log("[reindex] Started successfully");
        }
      })
      .catch((err) => console.error("[reindex] Network error:", err));
    debounceTimer = null;
  }, 5000);
}
