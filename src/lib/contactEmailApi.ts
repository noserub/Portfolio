const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export type ContactEmailInput = {
  name: string;
  email: string;
  message: string;
  messageId?: string;
};

export type ContactEmailEnv = {
  resendApiKey?: string;
  notifyTo?: string;
  fromEmail?: string;
};

const DEFAULT_NOTIFY_TO = "brian.bureson@gmail.com";
const DEFAULT_FROM = "Portfolio <noreply@bureson.com>";

const MAX_NAME = 200;
const MAX_EMAIL = 320;
const MAX_MESSAGE = 8000;

export function parseContactEmailInput(body: unknown): ContactEmailInput | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Invalid request body" };
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim() : "";
  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  const messageId = typeof raw.messageId === "string" ? raw.messageId.trim() : undefined;

  if (!name) return { error: "Name is required" };
  if (!email) return { error: "Email is required" };
  if (!isValidEmail(email)) return { error: "Email is invalid" };
  if (!message) return { error: "Message is required" };
  if (name.length > MAX_NAME) return { error: "Name is too long" };
  if (email.length > MAX_EMAIL) return { error: "Email is too long" };
  if (message.length > MAX_MESSAGE) return { error: "Message is too long" };

  return { name, email, message, messageId: messageId || undefined };
}

function resolveNotifyTo(env: ContactEmailEnv): string {
  return (
    env.notifyTo?.trim() ||
    process.env.CONTACT_NOTIFY_TO?.trim() ||
    process.env.VITE_PUBLIC_CONTACT_EMAIL?.trim() ||
    process.env.VITE_SITE_OWNER_SIGNIN_EMAIL?.trim() ||
    DEFAULT_NOTIFY_TO
  );
}

function resolveFromEmail(env: ContactEmailEnv): string {
  return env.fromEmail?.trim() || process.env.CONTACT_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

function buildEmailContent(input: ContactEmailInput) {
  const subject = `New Contact Form Message from ${input.name}`;
  const text = [
    "You received a new message from your portfolio contact form:",
    "",
    `Name: ${input.name}`,
    `Email: ${input.email}`,
    "",
    "Message:",
    input.message,
    "",
    input.messageId ? `Message ID: ${input.messageId}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const html = [
    "<p>You received a new message from your portfolio contact form:</p>",
    `<p><strong>Name:</strong> ${escapeHtml(input.name)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(input.email)}</p>`,
    "<p><strong>Message:</strong></p>",
    `<p>${escapeHtml(input.message).replace(/\n/g, "<br>")}</p>`,
    input.messageId ? `<p><small>Message ID: ${escapeHtml(input.messageId)}</small></p>` : "",
  ].join("");

  return { subject, text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendContactEmailViaResend(
  input: ContactEmailInput,
  env: ContactEmailEnv,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = env.resendApiKey?.trim() || process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is not configured. Add it in Vercel Project Settings → Environment Variables.",
    };
  }

  const to = resolveNotifyTo(env);
  const from = resolveFromEmail(env);
  const { subject, text, html } = buildEmailContent(input);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      text,
      html,
      reply_to: input.email,
    }),
  });

  const data = (await response.json().catch(() => ({}))) as { message?: string };

  if (!response.ok) {
    return {
      ok: false,
      error: data.message || `Resend API error (${response.status})`,
    };
  }

  return { ok: true };
}

export async function handleContactEmailApiPost(
  body: unknown,
  env: ContactEmailEnv = {},
): Promise<{ status: number; body: Record<string, unknown> }> {
  const parsed = parseContactEmailInput(body);
  if ("error" in parsed) {
    return { status: 400, body: { error: parsed.error } };
  }

  const result = await sendContactEmailViaResend(parsed, env);
  if (!result.ok) {
    return { status: 500, body: { error: result.error } };
  }

  return { status: 200, body: { success: true } };
}

export async function notifyContactEmailFromClient(input: ContactEmailInput): Promise<boolean> {
  try {
    const response = await fetch("/api/send-contact-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      console.warn("Contact email notification failed:", payload.error || response.statusText);
      return false;
    }

    return true;
  } catch (error) {
    console.warn("Contact email notification request failed:", error);
    return false;
  }
}
