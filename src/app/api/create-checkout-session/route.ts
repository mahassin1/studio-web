import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type PaymentType = "none" | "deposit" | "full";

const PLATFORM_FEE_PERCENT = 0.1;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      serviceId,
      serviceName,
      fullPrice,
      paymentType,
      depositAmount,
      amountToCharge,
      providerName,
      appointmentDate,
      appointmentTime,
      clientName,
      clientEmail,
      providerEmail,
      handle,
      notes,
    } = body as {
      serviceId?: string;
      serviceName?: string;
      fullPrice?: number;
      paymentType?: PaymentType;
      depositAmount?: number;
      amountToCharge?: number;
      providerName?: string;
      appointmentDate?: string;
      appointmentTime?: string;
      clientName?: string;
      clientEmail?: string;
      providerEmail?: string;
      handle?: string;
      notes?: string;
    };

    if (
      !serviceName ||
      !providerName ||
      !appointmentDate ||
      !appointmentTime ||
      !clientName ||
      !clientEmail ||
      !handle
    ) {
      return NextResponse.json(
        { error: "Missing required checkout data." },
        { status: 400 }
      );
    }

    if (paymentType === "none") {
      return NextResponse.json(
        { error: "This service does not require online payment." },
        { status: 400 }
      );
    }

    const normalizedPaymentType: PaymentType =
      paymentType === "deposit" || paymentType === "full" ? paymentType : "none";

    const numericFullPrice = Number(fullPrice || 0);
    const numericDeposit = Number(depositAmount || 0);
    const numericAmountToCharge = Number(amountToCharge || 0);

    if (normalizedPaymentType === "deposit") {
      if (numericDeposit <= 0 || numericDeposit >= numericFullPrice) {
        return NextResponse.json(
          { error: "Invalid deposit amount." },
          { status: 400 }
        );
      }
    }

    if (normalizedPaymentType === "full" && numericFullPrice <= 0) {
      return NextResponse.json(
        { error: "Invalid full payment amount." },
        { status: 400 }
      );
    }

    if (numericAmountToCharge <= 0) {
      return NextResponse.json(
        { error: "Amount to charge must be greater than 0." },
        { status: 400 }
      );
    }

    const { data: providerProfile, error: providerError } = await supabase
      .from("provider_profiles")
      .select("stripe_account_id")
      .eq("handle", handle)
      .maybeSingle();

    if (providerError) {
      console.error("Failed to load provider payout account:", providerError);
      return NextResponse.json(
        { error: "Could not load provider payout settings." },
        { status: 500 }
      );
    }

    if (!providerProfile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Provider payouts are not set up yet." },
        { status: 400 }
      );
    }

    const platformFee = Number(
      (numericAmountToCharge * PLATFORM_FEE_PERCENT).toFixed(2)
    );
    const providerEarnings = Number(
      (numericAmountToCharge - platformFee).toFixed(2)
    );

    const origin = req.headers.get("origin") || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: clientEmail,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name:
                normalizedPaymentType === "deposit"
                  ? `${serviceName} deposit`
                  : serviceName,
              description: `${providerName} • ${appointmentDate} at ${appointmentTime}`,
            },
            unit_amount: Math.round(numericAmountToCharge * 100),
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        application_fee_amount: Math.round(platformFee * 100),
        transfer_data: {
          destination: providerProfile.stripe_account_id,
        },
      },
      success_url: `${origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/b/${handle}/book`,
      metadata: {
        serviceId: serviceId || "",
        serviceName,
        fullPrice: String(numericFullPrice),
        paymentType: normalizedPaymentType,
        depositAmount: String(numericDeposit),
        amountToCharge: String(numericAmountToCharge),
        platformFee: String(platformFee),
        providerEarnings: String(providerEarnings),
        providerStripeAccountId: providerProfile.stripe_account_id,
        providerName,
        appointmentDate,
        appointmentTime,
        clientName,
        clientEmail,
        providerEmail: providerEmail || "",
        handle,
        notes: notes || "",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("create-checkout-session error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create checkout session.",
      },
      { status: 500 }
    );
  }
}