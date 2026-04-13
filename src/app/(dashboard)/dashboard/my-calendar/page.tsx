"use client";

import { useEffect, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { createClient } from "@/lib/supabase/client";

type CalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
};

export default function MyCalendarPage() {
  const supabase = createClient();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
        console.error("Failed to load client calendar:", error);
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

          return {
            id: item.id,
            title: `${item.provider_name} — ${item.service_name}`,
            start,
            end,
          };
        });

      setEvents(mappedEvents);
      setLoading(false);
    }

    loadAppointments();
  }, []);

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#8a6b5b]">Client Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold">My Calendar</h1>
          <p className="mt-3 text-[#6b5d54]">
            View all your appointments in calendar format.
          </p>
        </div>

        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
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
            />
          )}
        </div>
      </div>
    </main>
  );
}