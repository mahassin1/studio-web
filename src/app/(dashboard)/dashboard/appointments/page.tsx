"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

type Appointment = {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
};

function getStatusStyles(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "bg-green-100 text-green-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    case "completed":
      return "bg-blue-100 text-blue-700";
    case "cancelled":
      return "bg-red-100 text-red-700";
    default:
      return "";
  }
}

export default function AppointmentsPage() {
  const supabase = createClient();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      pending: appointments.filter((a) => a.status === "pending").length,
    };
  }, [appointments]);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .eq("provider_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load appointments:", error);
      } else {
        setAppointments(
          (data || []).map((item) => ({
            id: item.id,
            clientName: item.client_name,
            service: item.service_name,
            date: item.appointment_date || item.appointment_day || "",
            time: item.appointment_time,
            status: item.status,
          }))
        );
      }

      setLoading(false);
    }

    loadAppointments();
  }, [supabase]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Failed to update status:", error);
      return;
    }

    setAppointments((prev) =>
      prev.map((appt) => (appt.id === id ? { ...appt, status } : appt))
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a6b5b]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Appointments</h1>
            <p className="mt-3 text-[#6b5d54]">
              View and manage all your bookings.
            </p>
          </div>

          <div className="flex gap-4">
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Total</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Confirmed</p>
              <p className="text-xl font-bold">{stats.confirmed}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Pending</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          {loading ? (
            <div className="py-10 text-center text-[#6b5d54]">
              Loading appointments...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#eadfd4] text-sm text-[#8a6b5b]">
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Actions</th>
                  </tr>
                </thead>

                <tbody className="text-sm">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="border-b border-[#f0e6dc]">
                      <td className="py-4 font-medium">{appt.clientName}</td>
                      <td>{appt.service}</td>
                      <td>{appt.date}</td>
                      <td>{appt.time}</td>
                      <td>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(
                            appt.status
                          )}`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(appt.id, "confirmed")}
                            className="rounded-lg bg-green-600 px-3 py-1 text-xs text-white"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, "completed")}
                            className="rounded-lg bg-blue-600 px-3 py-1 text-xs text-white"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => updateStatus(appt.id, "cancelled")}
                            className="rounded-lg bg-red-600 px-3 py-1 text-xs text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {appointments.length === 0 && (
                <div className="py-10 text-center text-[#6b5d54]">
                  No appointments yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}