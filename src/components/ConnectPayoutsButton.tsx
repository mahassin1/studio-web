"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConnectPayoutsButton() {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleConnect() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setMessage("You must be logged in.");
      return;
    }

    const response = await fetch("/api/stripe/connect/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: user.id,
        email: user.email,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.url) {
      setLoading(false);
      setMessage(data.error || "Could not start onboarding.");
      return;
    }

    window.location.href = data.url;
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleConnect}
        disabled={loading}
        className="rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Opening Stripe..." : "Connect payouts"}
      </button>

      {message && <p className="text-sm text-[#6b5d54]">{message}</p>}
    </div>
  );
}