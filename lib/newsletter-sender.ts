import { Resend } from "resend";
import { getActiveSubscribers, updateNewsletterDraft, type NewsletterDraft, type Subscriber } from "./newsletter";
import { buildNewsletterHtml } from "./newsletter-template";

function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set");
  return new Resend(apiKey);
}

function getFromEmail(): string {
  return process.env.FROM_EMAIL ?? "newsletter@resend.dev";
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saurav-portfolio.azurewebsites.net";

interface SendResult {
  sent: number;
  failed: number;
  errors: string[];
}

/** Send a newsletter draft to all active subscribers */
export async function sendNewsletter(draft: NewsletterDraft): Promise<SendResult> {
  if (draft.status !== "approved") {
    throw new Error("Newsletter must be approved before sending");
  }

  const resend = getResend();
  const subscribers = getActiveSubscribers();

  if (subscribers.length === 0) {
    throw new Error("No active subscribers to send to");
  }

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  // Send in batches of 50 to respect rate limits
  const batchSize = 50;
  for (let i = 0; i < subscribers.length; i += batchSize) {
    const batch = subscribers.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (subscriber: Subscriber) => {
        try {
          const html = buildNewsletterHtml(draft, subscriber);
          await resend.emails.send({
            from: `Saurav Raghuvanshi <${getFromEmail()}>`,
            to: subscriber.email,
            subject: draft.subject,
            html,
            headers: {
              "List-Unsubscribe": `<${SITE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          });
          sent++;
        } catch (err) {
          failed++;
          errors.push(`${subscriber.email}: ${err instanceof Error ? err.message : String(err)}`);
        }
      })
    );
    // Brief pause between batches
    if (i + batchSize < subscribers.length) {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // Update draft status
  updateNewsletterDraft(draft.id, {
    status: "sent",
    sentAt: new Date().toISOString(),
    recipientCount: sent,
  });

  return { sent, failed, errors };
}

/** Send a welcome email to a new subscriber */
export async function sendWelcomeEmail(subscriber: Subscriber): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // silently skip if not configured

  const resend = new Resend(apiKey);
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const greeting = subscriber.name ? `Hi ${subscriber.name}` : "Hi there";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Welcome to Cloud &amp; AI Weekly</title>
  <style>
    body { margin: 0; padding: 0; background: #f0f4f8; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrap { max-width: 540px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px 40px; text-align: center; }
    .logo { width: 56px; height: 56px; border-radius: 14px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; font-size: 22px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; }
    .header-title { font-size: 22px; font-weight: 700; color: #f8fafc; margin-bottom: 4px; }
    .header-sub { font-size: 13px; color: #94a3b8; }
    .body { padding: 32px 40px; }
    .body p { font-size: 15px; color: #374151; line-height: 1.7; margin: 0 0 16px; }
    .feature-list { list-style: none; padding: 0; margin: 20px 0; }
    .feature-list li { font-size: 14px; color: #4b5563; padding: 8px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 8px; }
    .check { color: #22c55e; font-weight: 700; }
    .footer { padding: 16px 40px 24px; text-align: center; font-size: 11px; color: #9ca3af; }
    .unsub { color: #9ca3af; text-decoration: underline; }
  </style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="logo">SR</div>
    <div class="header-title">Cloud &amp; AI Weekly</div>
    <div class="header-sub">by Saurav Raghuvanshi</div>
  </div>
  <div class="body">
    <p>${greeting}, welcome aboard!</p>
    <p>Every Saturday you'll get a curated digest of the most important AI and cloud news — analysed from an architect's perspective, so you can stay ahead without the noise.</p>
    <p>Each issue includes:</p>
    <ul class="feature-list">
      <li><span class="check">✓</span> 5 top AI &amp; Cloud stories with architectural analysis</li>
      <li><span class="check">✓</span> Azure Spotlight — one deep-dive per week</li>
      <li><span class="check">✓</span> Tip of the Week — actionable and practical</li>
    </ul>
    <p>First issue lands this Saturday. Until then, catch up on my <a href="${SITE_URL}/blog" style="color:#3b82f6;">latest blog posts</a> or explore the <a href="${SITE_URL}/projects" style="color:#3b82f6;">project portfolio</a>.</p>
    <p style="margin-bottom:0;">See you Saturday,<br /><strong>Saurav</strong><br /><span style="font-size:12px;color:#6b7280;">Digital Cloud Solution Architect · Microsoft</span></p>
  </div>
  <div class="footer">
    <a href="${unsubUrl}" class="unsub">Unsubscribe</a> &nbsp;·&nbsp; Bengaluru, India
  </div>
</div>
</body>
</html>`;

  try {
    await resend.emails.send({
      from: `Saurav Raghuvanshi <${getFromEmail()}>`,
      to: subscriber.email,
      subject: "Welcome to Cloud & AI Weekly",
      html,
    });
  } catch {
    // Welcome email failure is non-fatal
  }
}
