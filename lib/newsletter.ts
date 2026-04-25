import fs from "fs";
import path from "path";
import { contentDir } from "./content-dir";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Subscriber {
  id: string;
  email: string;
  name?: string;
  subscribedAt: string;
  status: "active" | "unsubscribed";
  unsubscribeToken: string;
}

export interface NewsletterDraft {
  id: string;
  title: string;
  subject: string;
  previewText: string;
  htmlContent: string;
  coverImageUrl?: string;
  status: "draft" | "approved" | "sent";
  generatedAt: string;
  approvedAt?: string;
  sentAt?: string;
  weekOf: string;
  sources: string[];
  recipientCount?: number;
}

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

function subscribersPath(): string {
  return path.join(contentDir, "subscribers.json");
}

function newslettersDir(): string {
  return path.join(contentDir, "newsletters");
}

function draftPath(id: string): string {
  return path.join(newslettersDir(), `${id}.json`);
}

// ---------------------------------------------------------------------------
// Subscribers
// ---------------------------------------------------------------------------

export function getSubscribers(): Subscriber[] {
  const filePath = subscribersPath();
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as Subscriber[];
  } catch {
    return [];
  }
}

export function saveSubscribers(subscribers: Subscriber[]): void {
  const filePath = subscribersPath();
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(subscribers, null, 2) + "\n", "utf-8");
}

export function getSubscriberByEmail(email: string): Subscriber | null {
  return getSubscribers().find((s) => s.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export function getSubscriberByToken(token: string): Subscriber | null {
  return getSubscribers().find((s) => s.unsubscribeToken === token) ?? null;
}

export function addSubscriber(email: string, name?: string): Subscriber {
  const subscribers = getSubscribers();
  const existing = subscribers.find((s) => s.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    if (existing.status === "unsubscribed") {
      existing.status = "active";
      existing.subscribedAt = new Date().toISOString();
      saveSubscribers(subscribers);
    }
    return existing;
  }

  const subscriber: Subscriber = {
    id: crypto.randomUUID(),
    email: email.toLowerCase().trim(),
    name: name?.trim() || undefined,
    subscribedAt: new Date().toISOString(),
    status: "active",
    unsubscribeToken: crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, ""),
  };
  subscribers.push(subscriber);
  saveSubscribers(subscribers);
  return subscriber;
}

export function unsubscribeByToken(token: string): boolean {
  const subscribers = getSubscribers();
  const sub = subscribers.find((s) => s.unsubscribeToken === token);
  if (!sub || sub.status === "unsubscribed") return false;
  sub.status = "unsubscribed";
  saveSubscribers(subscribers);
  return true;
}

export function getSubscriberStats() {
  const subscribers = getSubscribers();
  return {
    total: subscribers.length,
    active: subscribers.filter((s) => s.status === "active").length,
    unsubscribed: subscribers.filter((s) => s.status === "unsubscribed").length,
  };
}

// ---------------------------------------------------------------------------
// Newsletter Drafts
// ---------------------------------------------------------------------------

export function getNewsletterDrafts(): NewsletterDraft[] {
  const dir = newslettersDir();
  if (!fs.existsSync(dir)) return [];
  try {
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        try {
          const raw = fs.readFileSync(path.join(dir, f), "utf-8").replace(/^\uFEFF/, "");
          return JSON.parse(raw) as NewsletterDraft;
        } catch {
          return null;
        }
      })
      .filter((d): d is NewsletterDraft => d !== null)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  } catch {
    return [];
  }
}

export function getNewsletterDraft(id: string): NewsletterDraft | null {
  const filePath = draftPath(id);
  if (!fs.existsSync(filePath)) return null;
  try {
    const raw = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
    return JSON.parse(raw) as NewsletterDraft;
  } catch {
    return null;
  }
}

export function saveNewsletterDraft(draft: NewsletterDraft): void {
  const dir = newslettersDir();
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(draftPath(draft.id), JSON.stringify(draft, null, 2) + "\n", "utf-8");
}

export function updateNewsletterDraft(id: string, updates: Partial<NewsletterDraft>): NewsletterDraft | null {
  const draft = getNewsletterDraft(id);
  if (!draft) return null;
  const updated = { ...draft, ...updates };
  saveNewsletterDraft(updated);
  return updated;
}

export function deleteNewsletterDraft(id: string): boolean {
  const filePath = draftPath(id);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

export function getLastSentNewsletter(): NewsletterDraft | null {
  return getNewsletterDrafts().find((d) => d.status === "sent") ?? null;
}

export function getActiveSubscribers(): Subscriber[] {
  return getSubscribers().filter((s) => s.status === "active");
}
