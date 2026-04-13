"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type DayAvailability = {
  id?: string;
  day: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

const defaultAvailability: DayAvailability[] = [
  { day: "Monday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { day: "Tuesday", isAvailable: true, startTime: "10:00", endTime: "18:00" },
  { day: "Wednesday", isAvailable: true, startTime: "09:00", endTime: "17:00" },
  { day: "Thursday", isAvailable: true, startTime: "10:00", endTime: "18:00" },
  { day: "Friday", isAvailable: true, startTime: "09:00", endTime: "15:00" },
  { day: "Saturday", isAvailable: false, startTime: "10:00", endTime: "14:00" },
  { day: "Sunday", isAvailable: false, startTime: "10:00", endTime: "14:00" },
];

function formatTime(value: string) {
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

export default function AvailabilityPage() {
  const supabase = createClient();

  const [availability, setAvailability] =
    useState<DayAvailability[]>(defaultAvailability);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const availableDaysCount = useMemo(() => {
    return availability.filter((item) => item.isAvailable).length;
  }, [availability]);

  useEffect(() => {
    async function loadAvailability() {
      setLoading(true);
      setMessage("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setLoading(false);
        setMessage("You must be logged in to manage availability.");
        return;
      }

      const { data: rows, error } = await supabase
        .from("availability")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Failed to load availability:", error);
        setLoading(false);
        setMessage("Could not load availability.");
        return;
      }

      if (rows && rows.length > 0) {
        setAvailability(
          rows.map((row) => ({
            id: row.id,
            day: row.day,
            isAvailable: row.is_available,
            startTime: row.start_time,
            endTime: row.end_time,
          }))
        );
      } else {
        setAvailability(defaultAvailability);
      }

      setLoading(false);
    }

    loadAvailability();
  }, [supabase]);

  function updateDay(
    day: string,
    field: keyof DayAvailability,
    value: string | boolean
  ) {
    setAvailability((prev) =>
      prev.map((item) =>
        item.day === day ? { ...item, [field]: value } : item
      )
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaved(false);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setSaving(false);
      setMessage("You must be logged in to save availability.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("provider_profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.handle) {
      setSaving(false);
      setMessage("Please save your provider profile first.");
      return;
    }

    const { error: deleteError } = await supabase
      .from("availability")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Failed to clear old availability:", deleteError);
      setSaving(false);
      setMessage("Could not update availability.");
      return;
    }

    const rows = availability.map((item) => ({
      user_id: user.id,
      provider_handle: profile.handle,
      day: item.day,
      is_available: item.isAvailable,
      start_time: item.startTime,
      end_time: item.endTime,
    }));

    const { error: insertError } = await supabase
      .from("availability")
      .insert(rows);

    setSaving(false);

    if (insertError) {
      console.error("Failed to save availability:", insertError);
      setMessage(insertError.message || "Failed to save availability.");
      return;
    }

    setSaved(true);
    setMessage("Availability saved.");
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            Loading availability...
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-[#8a6b5b]">Provider Setup</p>
            <h1 className="mt-2 text-4xl font-bold">Set your availability</h1>
            <p className="mt-3 max-w-2xl text-[#6b5d54]">
              Choose which days you work and what time clients can book with you.
            </p>
          </div>

          <div className="rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-black/5">
            <p className="text-sm text-[#8a6b5b]">Available Days</p>
            <p className="mt-1 text-2xl font-bold">{availableDaysCount}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <div>
              <h2 className="text-2xl font-semibold">Weekly schedule</h2>
              <p className="mt-2 text-sm text-[#6b5d54]">
                Toggle each day on or off and set working hours.
              </p>
            </div>

            <div className="mt-8 space-y-4">
              {availability.map((item) => (
                <div
                  key={item.day}
                  className="rounded-3xl border border-[#eadfd4] bg-[#fcfaf8] p-5"
                >
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                    <div className="min-w-[140px]">
                      <h3 className="text-lg font-semibold">{item.day}</h3>
                      <p className="mt-1 text-sm text-[#6b5d54]">
                        {item.isAvailable ? "Available" : "Unavailable"}
                      </p>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                      <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-black/5">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(e) =>
                            updateDay(item.day, "isAvailable", e.target.checked)
                          }
                          className="h-4 w-4"
                        />
                        <span className="text-sm font-medium">Available</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="mb-2 block text-xs font-medium text-[#8a6b5b]">
                            Start
                          </label>
                          <input
                            type="time"
                            value={item.startTime}
                            onChange={(e) =>
                              updateDay(item.day, "startTime", e.target.value)
                            }
                            disabled={!item.isAvailable}
                            className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-medium text-[#8a6b5b]">
                            End
                          </label>
                          <input
                            type="time"
                            value={item.endTime}
                            onChange={(e) =>
                              updateDay(item.day, "endTime", e.target.value)
                            }
                            disabled={!item.isAvailable}
                            className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="mt-8 rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save availability"}
            </button>

            {saved && (
              <div className="mt-6 rounded-2xl border border-[#d7c2b2] bg-[#faf3ec] p-4">
                <h3 className="font-semibold">Availability saved</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f5148]">
                  Your weekly schedule has been saved to Supabase.
                </p>
              </div>
            )}

            {message && !saved && (
              <div className="mt-6 rounded-2xl border border-[#eadfd4] bg-[#fcfaf8] p-4 text-sm text-[#5f5148]">
                {message}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-semibold">Schedule preview</h2>
            <p className="mt-2 text-sm text-[#6b5d54]">
              This shows a quick summary of your current working hours.
            </p>

            <div className="mt-6 space-y-4">
              {availability.map((item) => (
                <div key={item.day} className="rounded-2xl bg-[#f8f4ef] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <p className="font-semibold">{item.day}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        item.isAvailable
                          ? "bg-white text-[#2d211b]"
                          : "bg-[#efe4db] text-[#7a6558]"
                      }`}
                    >
                      {item.isAvailable ? "Open" : "Off"}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-[#5f5148]">
                    {item.isAvailable
                      ? `${formatTime(item.startTime)} - ${formatTime(
                          item.endTime
                        )}`
                      : "Not available"}
                  </p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}