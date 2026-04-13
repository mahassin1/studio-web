"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

type ClientAppointment = {
  id: string;
  providerName: string;
  providerCategory: string;
  service: string;
  date: string;
  time: string;
  location: string;
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
      return "bg-gray-100 text-gray-700";
  }
}

export default function MyAppointmentsPage() {
  const supabase = createClient();

  const [appointments, setAppointments] = useState<ClientAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  const stats = useMemo(() => {
    return {
      total: appointments.length,
      upcoming: appointments.filter(
        (appointment) =>
          appointment.status === "confirmed" || appointment.status === "pending"
      ).length,
      completed: appointments.filter(
        (appointment) => appointment.status === "completed"
      ).length,
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
        .eq("client_user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load client appointments:", error);
      } else {
        setAppointments(
          (data || []).map((item) => ({
            id: item.id,
            providerName: item.provider_name || "Provider",
            providerCategory: item.provider_category || "Beauty Professional",
            service: item.service_name,
            date: item.appointment_date || item.appointment_day || "",
            time: item.appointment_time,
            location: item.location || "",
            status: item.status,
          }))
        );
      }

      setLoading(false);
    }

    loadAppointments();
  }, [supabase]);

  async function handleCancel(id: string) {
    const { error } = await supabase
      .from("appointments")
      .update({ status: "cancelled" })
      .eq("id", id);

    if (error) {
      console.error("Failed to cancel appointment:", error);
      return;
    }

    setAppointments((prev) =>
      prev.map((appointment) =>
        appointment.id === id
          ? { ...appointment, status: "cancelled" as AppointmentStatus }
          : appointment
      )
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a6b5b]">Client Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">My Appointments</h1>
            <p className="mt-3 max-w-2xl text-[#6b5d54]">
              View your upcoming bookings, past appointments, and appointment
              statuses in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Total</p>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Upcoming</p>
              <p className="mt-1 text-2xl font-bold">{stats.upcoming}</p>
            </div>

            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Completed</p>
              <p className="mt-1 text-2xl font-bold">{stats.completed}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            Loading appointments...
          </div>
        ) : (
          <div className="grid gap-6">
            {appointments.length > 0 ? (
              appointments.map((appointment) => (
                <section
                  key={appointment.id}
                  className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <p className="text-sm font-medium text-[#8a6b5b]">
                          {appointment.providerCategory}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusStyles(
                            appointment.status
                          )}`}
                        >
                          {appointment.status}
                        </span>
                      </div>

                      <h2 className="mt-2 text-2xl font-bold">
                        {appointment.providerName}
                      </h2>

                      <p className="mt-2 text-[#5f5148]">{appointment.service}</p>

                      <div className="mt-4 grid gap-2 text-sm text-[#6b5d54] sm:grid-cols-3">
                        <p>
                          <span className="font-medium text-[#2d211b]">Date:</span>{" "}
                          {appointment.date}
                        </p>
                        <p>
                          <span className="font-medium text-[#2d211b]">Time:</span>{" "}
                          {appointment.time}
                        </p>
                        <p>
                          <span className="font-medium text-[#2d211b]">
                            Location:
                          </span>{" "}
                          {appointment.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {(appointment.status === "confirmed" ||
                        appointment.status === "pending") && (
                        <button
                          type="button"
                          onClick={() => handleCancel(appointment.id)}
                          className="rounded-xl bg-[#5f3b2f] px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                        >
                          Cancel booking
                        </button>
                      )}
                    </div>
                  </div>
                </section>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
                <h2 className="text-2xl font-semibold">No appointments yet</h2>
                <p className="mt-3 text-[#6b5d54]">
                  Once you book a service, your appointments will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}