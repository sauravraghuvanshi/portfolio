import type { NewsletterDraft, Subscriber } from "./newsletter";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://saurav-portfolio.azurewebsites.net";

export function buildNewsletterHtml(
  draft: NewsletterDraft,
  subscriber: Subscriber
): string {
  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const weekFormatted = formatWeekDate(draft.weekOf);
  const greeting = subscriber.name ? `Hi ${subscriber.name},` : "Hi there,";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <title>${escHtml(draft.subject)}</title>
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <![endif]-->
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { margin: 0; padding: 0; background: #f0f4f8; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
    .email-wrapper { background: #f0f4f8; padding: 32px 16px; }
    .email-container { max-width: 600px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px 16px 0 0; padding: 32px 40px; }
    .header-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
    .logo { display: flex; align-items: center; gap: 12px; }
    .logo-badge { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: #fff; }
    .logo-text { color: #f8fafc; font-size: 14px; font-weight: 600; }
    .logo-sub { color: #64748b; font-size: 11px; margin-top: 1px; }
    .issue-badge { background: rgba(59,130,246,0.15); border: 1px solid rgba(59,130,246,0.3); border-radius: 20px; padding: 4px 12px; color: #93c5fd; font-size: 11px; font-weight: 500; }
    .header-title { font-size: 28px; font-weight: 700; color: #f8fafc; line-height: 1.3; margin-bottom: 10px; }
    .header-meta { color: #94a3b8; font-size: 13px; }
    .cover-image { width: 100%; height: 220px; object-fit: cover; display: block; }
    .body-card { background: #ffffff; padding: 0; }
    .greeting { padding: 32px 40px 0; color: #374151; font-size: 15px; line-height: 1.6; }
    .section { padding: 28px 40px; border-bottom: 1px solid #f1f5f9; }
    .section:last-child { border-bottom: none; }
    .section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 16px; }
    .story { margin-bottom: 24px; }
    .story:last-child { margin-bottom: 0; }
    .story-num { width: 22px; height: 22px; border-radius: 6px; background: #eff6ff; color: #3b82f6; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 8px; }
    .story-title { font-size: 16px; font-weight: 600; color: #111827; line-height: 1.4; margin-bottom: 6px; }
    .story-body { font-size: 14px; color: #4b5563; line-height: 1.7; margin-bottom: 8px; }
    .story-link { font-size: 13px; color: #3b82f6; font-weight: 500; text-decoration: none; }
    .spotlight { background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 12px; padding: 24px; border-left: 4px solid #3b82f6; }
    .spotlight-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #3b82f6; margin-bottom: 10px; }
    .spotlight-title { font-size: 17px; font-weight: 700; color: #1e3a5f; margin-bottom: 8px; }
    .spotlight-body { font-size: 14px; color: #1e40af; line-height: 1.7; }
    .tip-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 24px; border-left: 4px solid #22c55e; }
    .tip-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #16a34a; margin-bottom: 10px; }
    .tip-title { font-size: 16px; font-weight: 700; color: #14532d; margin-bottom: 8px; }
    .tip-body { font-size: 14px; color: #166534; line-height: 1.7; }
    .closing { font-size: 15px; color: #374151; line-height: 1.7; }
    .signature { margin-top: 20px; display: flex; align-items: center; gap: 12px; }
    .sig-badge { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: #fff; font-size: 16px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
    .sig-name { font-size: 15px; font-weight: 600; color: #111827; }
    .sig-title { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .footer { background: #f8fafc; border-radius: 0 0 16px 16px; padding: 24px 40px; text-align: center; }
    .footer-links { margin-bottom: 12px; }
    .footer-link { color: #6b7280; font-size: 12px; text-decoration: none; margin: 0 8px; }
    .footer-text { color: #9ca3af; font-size: 11px; line-height: 1.6; }
    .unsub-link { color: #9ca3af; text-decoration: underline; }
    @media (max-width: 600px) {
      .header, .section, .greeting, .footer { padding-left: 24px !important; padding-right: 24px !important; }
      .header-title { font-size: 22px !important; }
    }
  </style>
</head>
<body>
<div class="email-wrapper">
  <div class="email-container">

    <!-- Header -->
    <div class="header">
      <div class="header-top">
        <div class="logo">
          <div class="logo-badge">SR</div>
          <div>
            <div class="logo-text">Saurav Raghuvanshi</div>
            <div class="logo-sub">Cloud &amp; AI Weekly</div>
          </div>
        </div>
        <div class="issue-badge">${weekFormatted}</div>
      </div>
      <div class="header-title">${escHtml(draft.title)}</div>
      <div class="header-meta">${weekFormatted} &nbsp;·&nbsp; AI &amp; Cloud Insights for Architects</div>
    </div>

    ${draft.coverImageUrl ? `<img src="${escHtml(draft.coverImageUrl)}" alt="Newsletter cover" class="cover-image" />` : ""}

    <!-- Body -->
    <div class="body-card">
      <div class="greeting">${escHtml(greeting)}<br /><br />Here's your weekly roundup of what matters in AI and Cloud — curated and analysed for architects and engineering leaders.</div>

      ${draft.htmlContent}

      <!-- Footer -->
      <div class="section" style="border-bottom:none;">
        <div class="closing">
          <p style="margin:0 0 16px;">That's it for this week. If any of this was useful, forward it to a colleague — it helps more architects stay ahead of the curve.</p>
          <p style="margin:0 0 20px;">See you next Saturday,</p>
          <div class="signature">
            <div class="sig-badge">SR</div>
            <div>
              <div class="sig-name">Saurav Raghuvanshi</div>
              <div class="sig-title">Digital Cloud Solution Architect · Microsoft</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-links">
        <a href="${SITE_URL}" class="footer-link">Website</a>
        <a href="${SITE_URL}/blog" class="footer-link">Blog</a>
        <a href="https://linkedin.com/in/sauravraghuvanshi/" class="footer-link">LinkedIn</a>
      </div>
      <div class="footer-text">
        You're receiving this because you subscribed at <a href="${SITE_URL}" style="color:#9ca3af;">${SITE_URL.replace(/^https?:\/\//, "")}</a>.<br />
        <a href="${unsubUrl}" class="unsub-link">Unsubscribe</a> &nbsp;·&nbsp; Bengaluru, India
      </div>
    </div>

  </div>
</div>
</body>
</html>`;
}

/** Build the inner HTML sections from AI-generated structured content */
export function buildSectionsHtml(sections: NewsletterSection[]): string {
  return sections
    .map((section) => {
      switch (section.type) {
        case "stories":
          return buildStoriesSection(section);
        case "spotlight":
          return buildSpotlightSection(section);
        case "tip":
          return buildTipSection(section);
        default:
          return "";
      }
    })
    .join("");
}

export interface NewsletterSection {
  type: "stories" | "spotlight" | "tip";
  heading: string;
  items?: { title: string; content: string; url?: string }[];
  content?: string;
  url?: string;
}

function buildStoriesSection(section: NewsletterSection): string {
  if (!section.items?.length) return "";
  const storiesHtml = section.items
    .map(
      (item, i) => `
      <div class="story">
        <div class="story-num">${i + 1}</div>
        <div class="story-title">${escHtml(item.title)}</div>
        <div class="story-body">${escHtml(item.content)}</div>
        ${item.url ? `<a href="${escHtml(item.url)}" class="story-link" target="_blank" rel="noopener">Read more →</a>` : ""}
      </div>`
    )
    .join("");

  return `
    <div class="section">
      <div class="section-label">${escHtml(section.heading)}</div>
      ${storiesHtml}
    </div>`;
}

function buildSpotlightSection(section: NewsletterSection): string {
  return `
    <div class="section">
      <div class="spotlight">
        <div class="spotlight-label">Azure Spotlight</div>
        <div class="spotlight-title">${escHtml(section.heading)}</div>
        <div class="spotlight-body">${escHtml(section.content ?? "")}</div>
        ${section.url ? `<br /><a href="${escHtml(section.url)}" style="color:#3b82f6;font-size:13px;font-weight:500;text-decoration:none;" target="_blank" rel="noopener">Read more →</a>` : ""}
      </div>
    </div>`;
}

function buildTipSection(section: NewsletterSection): string {
  return `
    <div class="section">
      <div class="tip-box">
        <div class="tip-label">Tip of the Week</div>
        <div class="tip-title">${escHtml(section.heading)}</div>
        <div class="tip-body">${escHtml(section.content ?? "")}</div>
      </div>
    </div>`;
}

function formatWeekDate(weekOf: string): string {
  try {
    const d = new Date(`${weekOf}T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  } catch {
    return weekOf;
  }
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
