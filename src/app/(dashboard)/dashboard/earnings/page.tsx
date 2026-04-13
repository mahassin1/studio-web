"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EarningRow = {
  id: string;
  client_name: string | null;
  service_name: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  payment_type: string | null;
  amount_paid: number | null;
  remaining_due: number | null;
  platform_fee: number | null;
  provider_earnings: number | null;
  payment_status: string | null;
  status: string | null;
};

function formatMoney(value: number | null | undefined) {
  const amount = Number(value || 0);
  return `$${amount.toFixed(2).replace(/\.00$/, "")}`;
}

function formatTimeDisplay(value: string | null) {
  if (!value) return "";
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

export default function EarningsPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<EarningRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadEarnings() {
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

      const { data: profile, error: profileError } = await supabase
        .from("provider_profiles")
        .select("handle")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError || !profile?.handle) {
        setLoading(false);
        setMessage("Provider profile not found.");
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          `
          id,
          client_name,
          service_name,
          appointment_date,
          appointment_time,
          payment_type,
          amount_paid,
          remaining_due,
          platform_fee,
          provider_earnings,
          payment_status,
          status
        `
        )
        .eq("provider_handle", profile.handle)
        .order("appointment_date", { ascending: false })
        .order("appointment_time", { ascending: false });

      if (error) {
        console.error("Failed to load earnings:", error);
        setMessage(error.message || "Failed to load earnings.");
        setLoading(false);
        return;
      }

      setRows(
        (data || []).map((item) => ({
          id: item.id,
          client_name: item.client_name,
          service_name: item.service_name,
          appointment_date: item.appointment_date,
          appointment_time: item.appointment_time,
          payment_type: item.payment_type,
          amount_paid:
            item.amount_paid !== null ? Number(item.amount_paid) : null,
          remaining_due:
            item.remaining_due !== null ? Number(item.remaining_due) : null,
          platform_fee:
            item.platform_fee !== null ? Number(item.platform_fee) : null,
          provider_earnings:
            item.provider_earnings !== null
              ? Number(item.provider_earnings)
              : null,
          payment_status: item.payment_status,
          status: item.status,
        }))
      );

      setLoading(false);
    }

    loadEarnings();
  }, [supabase]);

  const stats = useMemo(() => {
    const paidRows = rows.filter((row) => (row.amount_paid || 0) > 0);

    return {
      onlineRevenue: paidRows.reduce(
        (sum, row) => sum + Number(row.amount_paid || 0),
        0
      ),
      platformFees: paidRows.reduce(
        (sum, row) => sum + Number(row.platform_fee || 0),
        0
      ),
      providerEarnings: paidRows.reduce(
        (sum, row) => sum + Number(row.provider_earnings || 0),
        0
      ),
      unpaidBookings: rows.filter((row) => row.payment_type === "none").length,
    };
  }, [rows]);

  if (loading) {
    return (
      <main className="px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          Loading earnings...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 text-[#2d211b]">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#8a6b5b]">Provider Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Earnings</h1>
        <p className="mt-2 max-w-2xl text-[#6b5d54]">
          Review online payments, platform fees, and what you earned from each
          booking.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-[#8a6b5b]">Online revenue</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(stats.onlineRevenue)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-[#8a6b5b]">Platform fees</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(stats.platformFees)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-[#8a6b5b]">Your earnings</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMoney(stats.providerEarnings)}
          </p>
        </div>

        <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-[#8a6b5b]">Pay-in-person bookings</p>
          <p className="mt-2 text-2xl font-bold">{stats.unpaidBookings}</p>
        </div>
      </div>

      <section className="mt-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">Booking earnings</h2>

        {message && <p className="mt-3 text-sm text-[#6b5d54]">{message}</p>}

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-sm text-[#8a6b5b]">
                <th className="pb-2 pr-4">Client</th>
                <th className="pb-2 pr-4">Service</th>
                <th className="pb-2 pr-4">Date</th>
                <th className="pb-2 pr-4">Payment</th>
                <th className="pb-2 pr-4">Paid now</th>
                <th className="pb-2 pr-4">Fee</th>
                <th className="pb-2 pr-4">You earn</th>
                <th className="pb-2 pr-4">Remaining</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr
                    key={row.id}
                    className="rounded-2xl bg-[#fcfaf8] text-sm text-[#2d211b]"
                  >
                    <td className="rounded-l-2xl px-4 py-4">
                      {row.client_name || "Client"}
                    </td>
                    <td className="px-4 py-4">{row.service_name || "Service"}</td>
                    <td className="px-4 py-4">
                      <div>{row.appointment_date || "-"}</div>
                      <div className="text-xs text-[#8a6b5b]">
                        {formatTimeDisplay(row.appointment_time)}
                      </div>
                    </td>
                    <td className="px-4 py-4 capitalize">
                      {row.payment_type === "none"
                        ? "In person"
                        : row.payment_type || "-"}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(row.amount_paid || 0)}
                    </td>
                    <td className="px-4 py-4">
                      {formatMoney(row.platform_fee || 0)}
                    </td>
                    <td className="px-4 py-4 font-semibold">
                      {formatMoney(row.provider_earnings || 0)}
                    </td>
                    <td className="rounded-r-2xl px-4 py-4">
                      {formatMoney(row.remaining_due || 0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="rounded-2xl bg-[#fcfaf8] px-4 py-6 text-sm text-[#6b5d54]"
                  >
                    No earnings data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}