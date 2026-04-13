import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
 

const EMAIL_FUNCTION_URL =
  "https://pvrxhkibbyhidacqfgmi.supabase.co/functions/v1/send-booking-email";

type PaymentType = "none" | "deposit" | "full";

export async function POST(req: Request) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId." },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: "Stripe session not found." },
        { status: 404 }
      );
    }

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not completed." },
        { status: 400 }
      );
    }

    const metadata = session.metadata || {};

    const providerName = metadata.providerName || "";
    const serviceName = metadata.serviceName || "";
    const appointmentDate = metadata.appointmentDate || "";
    const appointmentTime = metadata.appointmentTime || "";
    const clientName = metadata.clientName || "";
    const clientEmail = metadata.clientEmail || "";
    const providerEmail = metadata.providerEmail || "";
    const handle = metadata.handle || "";
    const notes = metadata.notes || "";
    const paymentType = (metadata.paymentType || "full") as PaymentType;

    const fullPrice = Number(metadata.fullPrice || 0);
    const amountToCharge =
      typeof session.amount_total === "number"
        ? session.amount_total / 100
        : Number(metadata.amountToCharge || 0);
    const platformFee = Number(metadata.platformFee || 0);
    const providerEarnings = Number(metadata.providerEarnings || 0);

    if (
      !providerName ||
      !serviceName ||
      !appointmentDate ||
      !appointmentTime ||
      !clientName ||
      !clientEmail ||
      !handle
    ) {
      return NextResponse.json(
        { error: "Missing required booking metadata." },
        { status: 400 }
      );
    }

    let remainingDue = 0;
    let paymentStatus = "paid";

    if (paymentType === "deposit") {
      remainingDue = Math.max(fullPrice - amountToCharge, 0);
      paymentStatus = "partially_paid";
    } else if (paymentType === "full") {
      remainingDue = 0;
      paymentStatus = "paid";
    }

    const { data: existingBySession, error: existingSessionError } =
      await supabase
        .from("appointments")
        .select("id")
        .eq("stripe_session_id", session.id)
        .maybeSingle();

    if (existingSessionError) {
      console.error("Error checking stripe session:", existingSessionError);
      return NextResponse.json(
        { error: "Could not verify existing booking." },
        { status: 500 }
      );
    }

    if (existingBySession) {
      return NextResponse.json({
        success: true,
        alreadyConfirmed: true,
        providerName,
        serviceName,
        appointmentDate,
        appointmentTime,
        handle,
        paymentType,
        amountPaid: amountToCharge,
        remainingDue,
        platformFee,
        providerEarnings,
      });
    }

    const { data: providerProfile, error: providerError } = await supabase
      .from("provider_profiles")
      .select("user_id, category, city, state, contact_email")
      .eq("handle", handle)
      .maybeSingle();

    if (providerError) {
      console.error("Error loading provider profile:", providerError);
      return NextResponse.json(
        { error: "Could not load provider profile." },
        { status: 500 }
      );
    }

    const { data: conflict, error: conflictError } = await supabase
      .from("appointments")
      .select("id")
      .eq("provider_handle", handle)
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (conflictError) {
      console.error("Error checking appointment conflict:", conflictError);
      return NextResponse.json(
        { error: "Could not check appointment availability." },
        { status: 500 }
      );
    }

    if (conflict) {
      return NextResponse.json(
        { error: "That appointment time is no longer available." },
        { status: 409 }
      );
    }

    const { error: insertError } = await supabase.from("appointments").insert({
      provider_user_id: providerProfile?.user_id || null,
      client_user_id: null,
      provider_handle: handle,
      provider_name: providerName,
      provider_category: providerProfile?.category || null,
      client_name: clientName,
      client_email: clientEmail,
      service_name: serviceName,
      service_duration: null,
      service_price: fullPrice || amountToCharge,
      appointment_day: null,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      notes: notes || null,
      status: "confirmed",
      location:
        providerProfile?.city && providerProfile?.state
          ? `${providerProfile.city}, ${providerProfile.state}`
          : null,
      stripe_session_id: session.id,
      payment_type: paymentType,
      amount_paid: amountToCharge,
      remaining_due: remainingDue,
      payment_status: paymentStatus,
      platform_fee: platformFee,
      provider_earnings: providerEarnings,
    });

    if (insertError) {
      console.error("Error inserting appointment:", insertError);
      return NextResponse.json(
        { error: insertError.message || "Could not create appointment." },
        { status: 500 }
      );
    }

    try {
      await fetch(EMAIL_FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientEmail,
          clientName,
          providerEmail: providerEmail || providerProfile?.contact_email || "",
          providerName,
          serviceName,
          appointmentDate,
          appointmentTime,
        }),
      });
    } catch (emailError) {
      console.error("Email trigger failed:", emailError);
    }

    return NextResponse.json({
      success: true,
      providerName,
      serviceName,
      appointmentDate,
      appointmentTime,
      handle,
      paymentType,
      amountPaid: amountToCharge,
      remainingDue,
      platformFee,
      providerEarnings,
    });
  } catch (error) {
    console.error("confirm-booking route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error confirming booking.",
      },
      { status: 500 }
    );
  }
}