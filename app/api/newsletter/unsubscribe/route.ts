import { NextRequest, NextResponse } from "next/server";
import { getSubscriberByToken, unsubscribeByToken } from "@/lib/newsletter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saurav-portfolio.azurewebsites.net";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new Response(unsubscribePage("error", "Invalid unsubscribe link."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    });
  }

  const subscriber = getSubscriberByToken(token);
  if (!subscriber) {
    return new Response(unsubscribePage("error", "This unsubscribe link is invalid or has already been used."), {
      status: 404,
      headers: { "Content-Type": "text/html" },
    });
  }

  if (subscriber.status === "unsubscribed") {
    return new Response(unsubscribePage("already", "You are already unsubscribed from this newsletter."), {
      status: 200,
      headers: { "Content-Type": "text/html" },
    });
  }

  const success = unsubscribeByToken(token);
  if (!success) {
    return new Response(unsubscribePage("error", "Something went wrong. Please try again."), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    });
  }

  return new Response(unsubscribePage("success", "You've been successfully unsubscribed."), {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}

// One-click unsubscribe (RFC 8058)
export async function POST(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });
  unsubscribeByToken(token);
  return NextResponse.json({ message: "Unsubscribed" });
}

function unsubscribePage(type: "success" | "already" | "error", message: string): string {
  const colors = {
    success: { bg: "#f0fdf4", border: "#22c55e", text: "#15803d", icon: "✓" },
    already: { bg: "#eff6ff", border: "#3b82f6", text: "#1d4ed8", icon: "ℹ" },
    error: { bg: "#fef2f2", border: "#ef4444", text: "#dc2626", icon: "✕" },
  };
  const c = colors[type];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Newsletter Unsubscribe</title>
  <style>
    body { margin: 0; padding: 40px 16px; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { max-width: 400px; width: 100%; background: #fff; border-radius: 16px; padding: 40px; text-align: center; box-shadow: 0 4px 24px rgba(0,0,0,0.06); }
    .icon { width: 56px; height: 56px; border-radius: 50%; background: ${c.bg}; border: 2px solid ${c.border}; color: ${c.text}; font-size: 24px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; }
    h1 { font-size: 20px; font-weight: 700; color: #111827; margin: 0 0 8px; }
    p { font-size: 14px; color: #6b7280; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 10px 24px; background: #1e293b; color: #fff; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 500; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${c.icon}</div>
    <h1>${type === "success" ? "Unsubscribed" : type === "already" ? "Already Unsubscribed" : "Error"}</h1>
    <p>${message}</p>
    <a href="${SITE_URL}">Back to site</a>
  </div>
</body>
</html>`;
}
