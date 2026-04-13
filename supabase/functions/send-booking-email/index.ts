// deno-lint-ignore-file no-import-prefix
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      clientEmail,
      clientName,
      providerEmail,
      providerName,
      serviceName,
      appointmentDate,
      appointmentTime,
    } = await req.json();

    if (!RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Missing RESEND_API_KEY secret." }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const emailsToSend = [];

    // Client confirmation email
    if (clientEmail) {
      emailsToSend.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "BeautyBook <onboarding@resend.dev>",
            to: [clientEmail],
            subject: `Booking confirmed with ${providerName}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>Your booking is confirmed</h2>
                <p>Hi ${clientName},</p>
                <p>Your appointment has been booked successfully.</p>

                <div style="margin-top: 16px; padding: 16px; background: #f8f4ef; border-radius: 12px;">
                  <p><strong>Provider:</strong> ${providerName}</p>
                  <p><strong>Service:</strong> ${serviceName}</p>
                  <p><strong>Date:</strong> ${appointmentDate}</p>
                  <p><strong>Time:</strong> ${appointmentTime}</p>
                </div>

                <p style="margin-top: 16px;">Thank you for booking with BeautyBook.</p>
              </div>
            `,
          }),
        })
      );
    }

    // Provider notification email
    if (providerEmail) {
      emailsToSend.push(
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "BeautyBook <onboarding@resend.dev>",
            to: [providerEmail],
            subject: `New booking from ${clientName}`,
            html: `
              <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                <h2>You have a new booking</h2>
                <p>Hi ${providerName},</p>
                <p>A new client has booked one of your services.</p>

                <div style="margin-top: 16px; padding: 16px; background: #f8f4ef; border-radius: 12px;">
                  <p><strong>Client:</strong> ${clientName}</p>
                  <p><strong>Client email:</strong> ${clientEmail}</p>
                  <p><strong>Service:</strong> ${serviceName}</p>
                  <p><strong>Date:</strong> ${appointmentDate}</p>
                  <p><strong>Time:</strong> ${appointmentTime}</p>
                </div>

                <p style="margin-top: 16px;">Log in to BeautyBook to manage this appointment.</p>
              </div>
            `,
          }),
        })
      );
    }

    const results = await Promise.all(emailsToSend);
    const payloads = await Promise.all(results.map((res) => res.json()));

    return new Response(JSON.stringify(payloads), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});