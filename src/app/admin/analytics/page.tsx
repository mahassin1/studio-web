"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "mabdallah@berkeley.edu";

type Row = {
  id: string;
  provider_name: string | null;
  service_name: string | null;
  appointment_date: string | null;
  payment_type: string | null;
  amount_paid: number | null;
  platform_fee: number | null;
  provider_earnings: number | null;
};

function formatMoney(value: number | null | undefined) {
  const num = Number(value || 0);
  return `$${num.toFixed(2).replace(/\.00$/, "")}`;
}

export default function AdminAnalyticsPage() {
  const supabase = createClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        window.location.href = "/";
        return;
      }

      if (user.email !== ADMIN_EMAIL) {
        window.location.href = "/";
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select(
          "id, provider_name, service_name, appointment_date, payment_type, amount_paid, platform_fee, provider_earnings"
        )
        .order("appointment_date", { ascending: false });

      if (error) {
        console.error("Failed to load analytics:", error);
        setMessage(error.message || "Failed to load analytics.");
        setLoading(false);
        return;
      }

      setRows(
        (data || []).map((item) => ({
          id: item.id,
          provider_name: item.provider_name,
          service_name: item.service_name,
          appointment_date: item.appointment_date,
          payment_type: item.payment_type,
          amount_paid:
            item.amount_paid !== null ? Number(item.amount_paid) : null,
          platform_fee:
            item.platform_fee !== null ? Number(item.platform_fee) : null,
          provider_earnings:
            item.provider_earnings !== null
              ? Number(item.provider_earnings)
              : null,
        }))
      );

      setLoading(false);
    }

    loadData();
  }, [supabase]);

  const stats = useMemo(() => {
    return {
      totalRevenue: rows.reduce(
        (sum, r) => sum + Number(r.amount_paid || 0),
        0
      ),
      platformRevenue: rows.reduce(
        (sum, r) => sum + Number(r.platform_fee || 0),
        0
      ),
      providerPayouts: rows.reduce(
        (sum, r) => sum + Number(r.provider_earnings || 0),
        0
      ),
      totalBookings: rows.length,
    };
  }, [rows]);

  if (loading) {
    return (
      <main className="px-6 py-8 text-[#2d211b]">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          Loading analytics...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 text-[#2d211b]">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#8a6b5b]">Admin</p>
        <h1 className="mt-2 text-3xl font-bold">Platform Analytics</h1>
        <p className="mt-2 text-[#6b5d54]">
          Review revenue, platform fees, and provider earnings across all bookings.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-2xl bg-white p-4 text-sm text-[#6b5d54] shadow-sm ring-1 ring-black/5">
          {message}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-500">Total revenue</p>
          <p className="mt-2 text-xl font-bold">
            {formatMoney(stats.totalRevenue)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-500">Your revenue</p>
          <p className="mt-2 text-xl font-bold">
            {formatMoney(stats.platformRevenue)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-500">Provider payouts</p>
          <p className="mt-2 text-xl font-bold">
            {formatMoney(stats.providerPayouts)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm text-gray-500">Bookings</p>
          <p className="mt-2 text-xl font-bold">{stats.totalBookings}</p>
        </div>
      </div>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-xl font-semibold">All bookings</h2>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr>
                <th className="py-2 text-left">Provider</th>
                <th className="py-2 text-left">Service</th>
                <th className="py-2 text-left">Date</th>
                <th className="py-2 text-left">Type</th>
                <th className="py-2 text-left">Paid</th>
                <th className="py-2 text-left">Fee</th>
                <th className="py-2 text-left">Provider gets</th>
              </tr>
            </thead>

            <tbody>
              {rows.length > 0 ? (
                rows.map((r) => (
                  <tr key={r.id} className="border-t">
                    <td className="py-3">{r.provider_name}</td>
                    <td>{r.service_name}</td>
                    <td>{r.appointment_date}</td>
                    <td>{r.payment_type}</td>
                    <td>{formatMoney(r.amount_paid)}</td>
                    <td>{formatMoney(r.platform_fee)}</td>
                    <td>{formatMoney(r.provider_earnings)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-[#6b5d54]">
                    No booking data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}