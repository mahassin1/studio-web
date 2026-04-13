"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

function formatTimeDisplay(value: string) {
  if (!value) return "";
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

function formatMoney(value: string | null) {
  if (!value) return "$0";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "$0";
  return `$${numeric.toFixed(2).replace(/\.00$/, "")}`;
}

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams();

  const provider = searchParams.get("provider") || "Provider";
  const service = searchParams.get("service") || "Service";
  const date = searchParams.get("date") || "Date";
  const time = searchParams.get("time") || "";
  const handle = searchParams.get("handle") || "";

  const paymentType = searchParams.get("paymentType") || "none";
  const amountPaid = searchParams.get("amountPaid");
  const remainingDue = searchParams.get("remainingDue");

  const paymentHeading =
    paymentType === "deposit"
      ? "Deposit paid"
      : paymentType === "full"
      ? "Payment completed"
      : "Booking confirmed";

  const paymentMessage =
    paymentType === "deposit"
      ? "Your deposit has been paid and your appointment is confirmed."
      : paymentType === "full"
      ? "Your payment has been completed and your appointment is confirmed."
      : "Your appointment has been successfully submitted. Payment will be collected in person.";

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-12">
        <div className="w-full rounded-[32px] bg-white p-10 shadow-sm ring-1 ring-black/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f3e8de] text-2xl">
            ✓
          </div>

          <h1 className="mt-6 text-center text-3xl font-bold">
            {paymentHeading}
          </h1>

          <p className="mt-3 text-center text-[#6b5d54]">{paymentMessage}</p>

          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Professional</p>
              <p className="mt-1 font-semibold">{provider}</p>
            </div>

            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Service</p>
              <p className="mt-1 font-semibold">{service}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f8f4ef] p-4">
                <p className="text-sm text-[#8a6b5b]">Date</p>
                <p className="mt-1 font-semibold">{date}</p>
              </div>

              <div className="rounded-2xl bg-[#f8f4ef] p-4">
                <p className="text-sm text-[#8a6b5b]">Time</p>
                <p className="mt-1 font-semibold">
                  {time ? formatTimeDisplay(time) : "Time"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Payment type</p>
              <p className="mt-1 font-semibold">
                {paymentType === "deposit"
                  ? "Deposit"
                  : paymentType === "full"
                  ? "Full payment"
                  : "Pay in person"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#f8f4ef] p-4">
                <p className="text-sm text-[#8a6b5b]">Amount paid now</p>
                <p className="mt-1 font-semibold">
                  {paymentType === "none" ? "$0" : formatMoney(amountPaid)}
                </p>
              </div>

              <div className="rounded-2xl bg-[#f8f4ef] p-4">
                <p className="text-sm text-[#8a6b5b]">Remaining due</p>
                <p className="mt-1 font-semibold">
                  {paymentType === "full"
                    ? "$0"
                    : formatMoney(remainingDue)}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/client/appointments"
              className="inline-flex items-center justify-center rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white"
            >
              View my appointments
            </Link>

            {handle && (
              <Link
                href={`/b/${handle}`}
                className="inline-flex items-center justify-center rounded-xl border border-[#d8c4b4] px-5 py-3 font-semibold text-[#5f3b2f]"
              >
                Back to profile
              </Link>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}