/**
 * Pure HTML builders for transactional emails. No Convex or Node dependencies,
 * so this module can be imported from both "use node" actions and elsewhere.
 * Email clients ignore <style>/external CSS, so every style is inlined.
 */

/** A single unread notification rendered in the daily digest. */
export interface DigestNotification {
  title: string;
  message?: string;
  href?: string;
  type: string;
  createdAt: number;
}

export interface DigestEmailOptions {
  recipientName?: string;
  /** Base URL of the web app, e.g. https://app.example.com (no trailing slash needed). */
  appUrl: string;
  notifications: DigestNotification[];
}

const BRAND = "#4f46e5";
const TEXT = "#111827";
const MUTED = "#6b7280";
const SURFACE = "#f3f4f6";

// Inter first, with a system fallback stack for clients that ignore web fonts
// (Gmail, Outlook desktop). Apple Mail / iOS Mail load Inter via the @import.
const FONT_STACK =
  "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Escapes the five HTML-significant characters so user content cannot break the markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/** Formats a timestamp as "DD Mon YYYY" in UTC for a stable, locale-independent output. */
function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** Joins the app base URL with a notification path, tolerating slashes on either side. */
function buildLink(appUrl: string, href: string): string {
  const base = appUrl.replace(/\/+$/, "");
  const path = href.startsWith("/") ? href : `/${href}`;
  return `${base}${path}`;
}

/** Wraps body content in a centred, responsive email shell with a logo header and footer. */
export function wrapEmailLayout(opts: {
  title: string;
  bodyHtml: string;
  /** Base URL of the web app, used to load the logo from its public assets. */
  appUrl: string;
}): string {
  const logoUrl = `${opts.appUrl.replace(/\/+$/, "")}/icon.png`;
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(opts.title)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    </style>
  </head>
  <body style="margin:0;padding:0;background-color:${SURFACE};font-family:${FONT_STACK};color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE};padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:28px 32px;">
                <img src="${escapeHtml(logoUrl)}" width="44" height="44" alt="Eva" style="display:block;border-radius:12px;margin-bottom:20px;" />
                ${opts.bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:${SURFACE};">
                <p style="margin:0;font-size:12px;line-height:18px;color:${MUTED};">
                  You are receiving this email because you have unread notifications. Open the app to manage them.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/** Renders one notification row: title, optional message, date, and optional view link. */
function renderNotification(n: DigestNotification, appUrl: string): string {
  const message = n.message
    ? `<p style="margin:4px 0 0;font-size:14px;line-height:20px;color:${MUTED};">${escapeHtml(n.message)}</p>`
    : "";
  const link = n.href
    ? `<a href="${escapeHtml(buildLink(appUrl, n.href))}" style="display:inline-block;margin-top:8px;font-size:13px;font-weight:600;color:${BRAND};text-decoration:none;">View &rarr;</a>`
    : "";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;background-color:${SURFACE};border-radius:10px;">
    <tr>
      <td style="padding:16px 18px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-size:15px;font-weight:600;line-height:21px;color:${TEXT};">${escapeHtml(n.title)}</td>
            <td align="right" style="font-size:12px;color:${MUTED};white-space:nowrap;padding-left:12px;">${escapeHtml(formatDate(n.createdAt))}</td>
          </tr>
        </table>
        ${message}
        ${link}
      </td>
    </tr>
  </table>`;
}

/** Builds the full daily unread-notification digest email as an HTML string. */
export function buildNotificationDigestHtml(opts: DigestEmailOptions): string {
  const count = opts.notifications.length;
  const greeting = opts.recipientName
    ? `Hi ${escapeHtml(opts.recipientName)},`
    : "Hi,";
  const heading = `You have ${count} unread notification${count === 1 ? "" : "s"}`;
  const rows = opts.notifications
    .map((n) => renderNotification(n, opts.appUrl))
    .join("");

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:15px;line-height:22px;color:${TEXT};">${greeting}</p>
    <h1 style="margin:0 0 20px;font-size:20px;line-height:28px;font-weight:700;color:${TEXT};">${heading}</h1>
    ${rows}
    <a href="${escapeHtml(opts.appUrl.replace(/\/+$/, ""))}" style="display:inline-block;margin-top:8px;padding:10px 18px;font-size:14px;font-weight:600;color:#ffffff;background-color:${BRAND};border-radius:8px;text-decoration:none;">Open the app</a>
  `;

  return wrapEmailLayout({ title: heading, bodyHtml, appUrl: opts.appUrl });
}

export interface ChangelogEmailOptions {
  recipientName?: string;
  /** Base URL of the web app, e.g. https://app.example.com (no trailing slash needed). */
  appUrl: string;
  /** Changelog body already converted from markdown to trusted HTML by the caller. */
  contentHtml: string;
  publishedAt: number;
}

/**
 * Builds the weekly changelog announcement email. The caller converts the
 * stored markdown to HTML (contentHtml) before passing it in, so this stays a
 * pure module with no markdown dependency.
 */
export function buildChangelogEmailHtml(opts: ChangelogEmailOptions): string {
  const greeting = opts.recipientName
    ? `Hi ${escapeHtml(opts.recipientName)},`
    : "Hi,";
  const heading = "What's new in Eva";

  const bodyHtml = `
    <p style="margin:0 0 4px;font-size:15px;line-height:22px;color:${TEXT};">${greeting}</p>
    <h1 style="margin:0 0 4px;font-size:20px;line-height:28px;font-weight:700;color:${TEXT};">${heading}</h1>
    <p style="margin:0 0 20px;font-size:13px;color:${MUTED};">${escapeHtml(formatDate(opts.publishedAt))}</p>
    <div style="font-size:14px;line-height:22px;color:${TEXT};">${opts.contentHtml}</div>
    <p style="margin:24px 0 0;">
      <a href="${escapeHtml(opts.appUrl.replace(/\/+$/, ""))}" style="display:inline-block;padding:10px 18px;font-size:14px;font-weight:600;color:#ffffff;background-color:${BRAND};border-radius:8px;text-decoration:none;">Open the app</a>
    </p>
  `;

  return wrapEmailLayout({ title: heading, bodyHtml, appUrl: opts.appUrl });
}
