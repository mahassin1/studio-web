import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const { userId, email } = await req.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Missing userId or email." },
        { status: 400 }
      );
    }

    const { data: profile, error: profileError } = await supabase
      .from("provider_profiles")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: "Could not load provider profile." },
        { status: 500 }
      );
    }

    let stripeAccountId = profile?.stripe_account_id || "";

    if (!stripeAccountId) {
      const account = await stripe.accounts.create({
        email,
        controller: {
          stripe_dashboard: {
            type: "express",
          },
          fees: {
            payer: "application",
          },
          losses: {
            payments: "application",
          },
        },
      });

      stripeAccountId = account.id;

      const { error: updateError } = await supabase
        .from("provider_profiles")
        .update({ stripe_account_id: stripeAccountId })
        .eq("user_id", userId);

      if (updateError) {
        return NextResponse.json(
          { error: updateError.message || "Could not save Stripe account ID." },
          { status: 500 }
        );
      }
    }

    const baseUrl = req.headers.get("origin") || "http://localhost:3000";

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${baseUrl}/dashboard/earnings`,
      return_url: `${baseUrl}/dashboard/earnings`,
      type: "account_onboarding",
    });

    return NextResponse.json({ url: accountLink.url });
  } catch (error) {
    console.error("Stripe onboarding error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to start Stripe onboarding.",
      },
      { status: 500 }
    );
  }
}