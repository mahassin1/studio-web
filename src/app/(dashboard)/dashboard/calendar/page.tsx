"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@/lib/supabase/client";

type AppointmentStatus = "confirmed" | "pending" | "completed" | "cancelled";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  extendedProps: {
    clientName: string;
    serviceName: string;
    status: AppointmentStatus;
    time: string;
    notes?: string;
  };
};

function getStatusLabel(status: AppointmentStatus) {
  switch (status) {
    case "confirmed":
      return "Confirmed";
    case "pending":
      return "Pending";
    case "completed":
      return "Completed";
    case "cancelled":
      return "Cancelled";
    default:
      return status;
  }
}

export default function ProviderCalendarPage() {
  const supabase = createClient();

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

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
      console.error("Failed to load calendar appointments:", error);
      setLoading(false);
      return;
    }

    const mappedEvents: CalendarEvent[] = (data || [])
      .filter((item) => item.appointment_date && item.appointment_time)
      .map((item) => {
        const start = `${item.appointment_date}T${item.appointment_time}`;

        let end: string | undefined = undefined;
        if (item.service_duration) {
          const [hours, minutes] = item.appointment_time.split(":").map(Number);
          const startDate = new Date(item.appointment_date);
          startDate.setHours(hours, minutes, 0, 0);

          const endDate = new Date(startDate.getTime() + item.service_duration * 60000);
          end = endDate.toISOString();
        }

        const getColor = (status: string) => {
  switch (status) {
    case "confirmed":
      return "#16a34a"; // green
    case "pending":
      return "#eab308"; // yellow
    case "completed":
      return "#2563eb"; // blue
    case "cancelled":
      return "#dc2626"; // red
    default:
      return "#6b7280"; // gray
  }
};

return {
  id: item.id,
  title: `${item.client_name} — ${item.service_name}`,
  start,
  end,
  backgroundColor: getColor(item.status),
  borderColor: getColor(item.status),
  extendedProps: {
    clientName: item.client_name,
    serviceName: item.service_name,
    status: item.status,
    time: item.appointment_time,
    notes: item.notes || "",
  },
};
      });

    setEvents(mappedEvents);
    setLoading(false);
  }

  useEffect(() => {
    loadAppointments();
  }, []);

  async function updateStatus(
    appointmentId: string,
    status: AppointmentStatus
  ) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", appointmentId);

    if (error) {
      console.error("Failed to update status:", error);
      return;
    }

    setEvents((prev) =>
      prev.map((event) =>
        event.id === appointmentId
          ? {
              ...event,
              extendedProps: {
                ...event.extendedProps,
                status,
              },
            }
          : event
      )
    );

    setSelectedEvent((prev) =>
      prev && prev.id === appointmentId
        ? {
            ...prev,
            extendedProps: {
              ...prev.extendedProps,
              status,
            },
          }
        : prev
    );
  }

  const stats = useMemo(() => {
    return {
      total: events.length,
      pending: events.filter((e) => e.extendedProps.status === "pending").length,
      confirmed: events.filter((e) => e.extendedProps.status === "confirmed").length,
    };
  }, [events]);

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a6b5b]">Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold">Calendar</h1>
            <p className="mt-3 text-[#6b5d54]">
              View your bookings in a calendar layout.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Total</p>
              <p className="mt-1 text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Pending</p>
              <p className="mt-1 text-2xl font-bold">{stats.pending}</p>
            </div>
            <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
              <p className="text-sm text-[#8a6b5b]">Confirmed</p>
              <p className="mt-1 text-2xl font-bold">{stats.confirmed}</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            {loading ? (
              <div className="py-10 text-center text-[#6b5d54]">
                Loading calendar...
              </div>
            ) : (
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay",
                }}
                events={events}
                height="auto"
                eventClick={(info) => {
                  const found = events.find((event) => event.id === info.event.id);
                  if (found) setSelectedEvent(found);
                }}
              />
            )}
          </section>

          <aside className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-semibold">Appointment details</h2>

            {selectedEvent ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-sm text-[#8a6b5b]">Client</p>
                  <p className="mt-1 font-semibold">
                    {selectedEvent.extendedProps.clientName}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-sm text-[#8a6b5b]">Service</p>
                  <p className="mt-1 font-semibold">
                    {selectedEvent.extendedProps.serviceName}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-sm text-[#8a6b5b]">Time</p>
                  <p className="mt-1 font-semibold">
                    {selectedEvent.extendedProps.time}
                  </p>
                </div>

                <div className="rounded-2xl bg-[#f8f4ef] p-4">
                  <p className="text-sm text-[#8a6b5b]">Status</p>
                  <p className="mt-1 font-semibold">
                    {getStatusLabel(selectedEvent.extendedProps.status)}
                  </p>
                </div>

                {selectedEvent.extendedProps.notes && (
                  <div className="rounded-2xl bg-[#f8f4ef] p-4">
                    <p className="text-sm text-[#8a6b5b]">Notes</p>
                    <p className="mt-1 text-sm leading-6">
                      {selectedEvent.extendedProps.notes}
                    </p>
                  </div>
                )}

                <div className="grid gap-3">
                  <button
                    onClick={() => updateStatus(selectedEvent.id, "confirmed")}
                    className="rounded-xl bg-green-600 px-4 py-3 font-medium text-white"
                  >
                    Mark confirmed
                  </button>

                  <button
                    onClick={() => updateStatus(selectedEvent.id, "completed")}
                    className="rounded-xl bg-blue-600 px-4 py-3 font-medium text-white"
                  >
                    Mark completed
                  </button>

                  <button
                    onClick={() => updateStatus(selectedEvent.id, "cancelled")}
                    className="rounded-xl bg-red-600 px-4 py-3 font-medium text-white"
                  >
                    Cancel appointment
                  </button>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-[#6b5d54]">
                Click an appointment on the calendar to view details.
              </p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}