import { handleContactEmailApiPost } from "../src/lib/contactEmailApi";

export const config = {
  runtime: "edge",
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const body = await req.json();
    const result = await handleContactEmailApiPost(body, {
      resendApiKey: process.env.RESEND_API_KEY,
      notifyTo:
        process.env.CONTACT_NOTIFY_TO ||
        process.env.VITE_PUBLIC_CONTACT_EMAIL ||
        process.env.VITE_SITE_OWNER_SIGNIN_EMAIL,
      fromEmail: process.env.CONTACT_FROM_EMAIL,
    });

    return new Response(JSON.stringify(result.body), {
      status: result.status,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to send email";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
}
