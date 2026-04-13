"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Finalizing your booking...");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function confirmBooking() {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        if (!isMounted) return;
        setStatus("error");
        setError("Missing payment session.");
        return;
      }

      try {
        const response = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ sessionId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Could not confirm booking.");
        }

        if (!isMounted) return;

        setStatus("success");
        setMessage("Payment confirmed. Redirecting to your booking details...");

        const query = new URLSearchParams({
          provider: data.providerName || "",
          service: data.serviceName || "",
          date: data.appointmentDate || "",
          time: data.appointmentTime || "",
          handle: data.handle || "",
          paymentType: data.paymentType || "full",
          amountPaid: String(data.amountPaid || 0),
          remainingDue: String(data.remainingDue || 0),
        });

        window.setTimeout(() => {
          router.replace(`/booking-confirmation?${query.toString()}`);
        }, 1200);
      } catch (err) {
        console.error(err);

        if (!isMounted) return;

        setStatus("error");
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while confirming your booking."
        );
      }
    }

    confirmBooking();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="min-h-screen bg-[#fcfaf8] px-6 py-12 text-[#2d211b]">
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
          {status === "loading" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f3e8de]">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#5f3b2f] border-t-transparent" />
              </div>

              <h1 className="mt-6 text-3xl font-bold">Processing payment</h1>
              <p className="mt-3 leading-7 text-[#6b5d54]">{message}</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5ea] text-2xl">
                ✓
              </div>

              <h1 className="mt-6 text-3xl font-bold">Payment successful</h1>
              <p className="mt-3 leading-7 text-[#6b5d54]">{message}</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#fdecec] text-2xl">
                !
              </div>

              <h1 className="mt-6 text-3xl font-bold">
                We couldn’t finish your booking
              </h1>
              <p className="mt-3 leading-7 text-[#6b5d54]">{error}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link
                  href="/search"
                  className="rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white"
                >
                  Back to search
                </Link>

                <Link
                  href="/client/appointments"
                  className="rounded-xl border border-[#e3d6cb] px-5 py-3 font-semibold text-[#2d211b]"
                >
                  View my appointments
                </Link>
              </div>

              <p className="mt-5 text-sm text-[#8a6b5b]">
                Your payment may still have gone through, so check your email or
                dashboard before trying again.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}