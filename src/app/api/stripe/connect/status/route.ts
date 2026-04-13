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
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId." }, { status: 400 });
    }

    const { data: profile, error: profileError } = await supabase
      .from("provider_profiles")
      .select("stripe_account_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (profileError || !profile?.stripe_account_id) {
      return NextResponse.json(
        { error: "Stripe account not found." },
        { status: 404 }
      );
    }

    const account = await stripe.accounts.retrieve(profile.stripe_account_id);

    const payoutsEnabled = !!account.payouts_enabled;
    const onboardingComplete =
      !!account.charges_enabled && !!account.details_submitted;

    const { error: updateError } = await supabase
      .from("provider_profiles")
      .update({
        payouts_enabled: payoutsEnabled,
        stripe_onboarding_complete: onboardingComplete,
      })
      .eq("user_id", userId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Could not update payout status." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      payoutsEnabled,
      onboardingComplete,
    });
  } catch (error) {
    console.error("Stripe status error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to load Stripe status.",
      },
      { status: 500 }
    );
  }
}