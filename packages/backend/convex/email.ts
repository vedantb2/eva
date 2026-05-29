"use node";

import sendgrid from "@sendgrid/mail";

/** Reads a required environment variable, throwing a clear error when it is missing. */
function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set in the Convex environment`);
  }
  return value;
}

export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/** Lowercases and de-duplicates a single email or list of emails. */
function normalizeEmails(emails: string | string[] | undefined): string[] {
  if (!emails) return [];
  const emailArray = Array.isArray(emails) ? emails : [emails];
  return Array.from(new Set(emailArray.map((email) => email.toLowerCase())));
}

/**
 * Sends an email via SendGrid.
 *
 * In production (EMAIL_ENV === "production") mail is sent to the real recipients,
 * with any BCC addresses already present in to/cc removed. In every other
 * environment all mail is redirected to SENDGRID_DEV_TEST_EMAIL so test runs
 * never reach real users.
 */
export async function sendEmail(data: SendEmailPayload): Promise<void> {
  sendgrid.setApiKey(getEnv("SENDGRID_API_KEY"));
  // SendGrid renders { email, name } as the sender display name in the inbox.
  const from = {
    email: data.from ?? getEnv("SENDGRID_FROM_EMAIL"),
    name: "Eva",
  };

  // TEMPORARY: production branch disabled while testing the dev redirect path.
  // Re-enable this block (and remove this comment) once dev testing is done so
  // that real recipients receive mail in production.
  // if (process.env.EMAIL_ENV === "production") {
  //   const normalizedTo = normalizeEmails(data.to);
  //   const normalizedCc = normalizeEmails(data.cc);
  //   const toAndCc = new Set([...normalizedTo, ...normalizedCc]);
  //   const filteredBcc = normalizeEmails(data.bcc).filter(
  //     (email) => !toAndCc.has(email),
  //   );
  //
  //   await sendgrid.send({
  //     from,
  //     subject: data.subject,
  //     html: data.html,
  //     to: normalizedTo,
  //     cc: normalizedCc,
  //     bcc: filteredBcc,
  //     replyTo: data.replyTo,
  //   });
  //   return;
  // }

  // Non-production: redirect everything to the test inbox.
  await sendgrid.send({
    from,
    subject: `[dev] ${data.subject}`,
    html: data.html,
    to: getEnv("SENDGRID_DEV_TEST_EMAIL"),
  });
}
