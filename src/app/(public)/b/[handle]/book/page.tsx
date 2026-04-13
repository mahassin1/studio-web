"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProviderByHandle } from "@/lib/mock-data";

type PaymentType = "none" | "deposit" | "full";

type ProviderProfile = {
  id?: string;
  user_id?: string;
  business_name: string | null;
  handle: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  contact_email?: string | null;
  primary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  font_family: string | null;
};

type ServiceItem = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
  payment_type?: PaymentType | null;
  deposit_amount?: number | null;
};

type AvailabilityItem = {
  id: string;
  day: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

type AppointmentItem = {
  id: string;
  appointment_date: string | null;
  appointment_time: string;
  status: string;
};

const dayOrder = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getNextDateForDay(dayName: string) {
  const now = new Date();
  const currentDay = now.getDay();
  const targetDay = dayOrder.indexOf(dayName);

  if (targetDay === -1) return null;

  let diff = targetDay - currentDay;
  if (diff < 0) diff += 7;

  const target = new Date(now);
  target.setDate(now.getDate() + diff);

  return target.toISOString().split("T")[0];
}

function toMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTimeString(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatTimeDisplay(value: string) {
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

function generateTimeSlots(
  startTime: string,
  endTime: string,
  serviceDuration: number
) {
  const start = toMinutes(startTime);
  const end = toMinutes(endTime);

  if (!serviceDuration || end <= start) return [];

  const slots: string[] = [];

  for (
    let current = start;
    current + serviceDuration <= end;
    current += serviceDuration
  ) {
    slots.push(toTimeString(current));
  }

  return slots;
}

export default function BookingPage() {
  const params = useParams<{ handle: string }>();
  const handle = params.handle?.toLowerCase();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [bookedAppointments, setBookedAppointments] = useState<
    AppointmentItem[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingAppointments, setLoadingAppointments] = useState(false);

  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const mockProvider = getProviderByHandle(handle || "");

  useEffect(() => {
    async function loadBookingData() {
      if (!handle) {
        setLoading(false);
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (profileError) {
        console.error("Failed to load provider profile:", profileError);
      }

      const { data: serviceRows, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("provider_handle", handle)
        .order("created_at", { ascending: true });

      if (servicesError) {
        console.error("Failed to load services:", servicesError);
      }

      const { data: availabilityRows, error: availabilityError } =
        await supabase
          .from("availability")
          .select("*")
          .eq("provider_handle", handle)
          .order("created_at", { ascending: true });

      if (availabilityError) {
        console.error("Failed to load availability:", availabilityError);
      }

      setProfile(profileData || null);

      const mappedServices: ServiceItem[] =
        serviceRows?.map((item) => ({
          id: item.id,
          name: item.name,
          duration: Number(item.duration),
          price: Number(item.price),
          description: item.description || "",
          payment_type: (item.payment_type as PaymentType) || "none",
          deposit_amount:
            item.deposit_amount !== null && item.deposit_amount !== undefined
              ? Number(item.deposit_amount)
              : null,
        })) || mockProvider?.services || [];

      const mappedAvailability: AvailabilityItem[] =
        availabilityRows?.map((item) => ({
          id: item.id,
          day: item.day,
          isAvailable: item.is_available,
          startTime: item.start_time,
          endTime: item.end_time,
        })) || [];

      setServices(mappedServices);
      setAvailability(mappedAvailability);

      const defaultServiceId = mappedServices[0]?.id ?? "";
      const firstOpenDay = mappedAvailability.find((item) => item.isAvailable);

      setSelectedServiceId(defaultServiceId);
      setSelectedDay(firstOpenDay?.day ?? "");
      setSelectedDate(
        firstOpenDay ? getNextDateForDay(firstOpenDay.day) || "" : ""
      );
      setSelectedTime("");

      setLoading(false);
    }

    loadBookingData();
  }, [handle, supabase, mockProvider?.services]);

  useEffect(() => {
    async function loadBookedAppointments() {
      if (!handle || !selectedDate) {
        setBookedAppointments([]);
        return;
      }

      setLoadingAppointments(true);

      const { data, error } = await supabase
        .from("appointments")
        .select("id, appointment_date, appointment_time, status")
        .eq("provider_handle", handle)
        .eq("appointment_date", selectedDate)
        .in("status", ["pending", "confirmed"]);

      if (error) {
        console.error("Failed to load booked appointments:", error);
        setBookedAppointments([]);
      } else {
        setBookedAppointments((data as AppointmentItem[]) || []);
      }

      setLoadingAppointments(false);
    }

    loadBookedAppointments();
  }, [handle, selectedDate, supabase]);

  const mergedProvider = useMemo(() => {
    if (!profile && !mockProvider) return null;

    return {
      handle: profile?.handle || mockProvider?.handle || handle,
      name: profile?.business_name || mockProvider?.name || "Provider Name",
      category:
        profile?.category || mockProvider?.category || "Beauty Professional",
      city: profile?.city || mockProvider?.city || "City",
      state: profile?.state || mockProvider?.state || "ST",
      contactEmail: profile?.contact_email || "",
      primaryColor: profile?.primary_color || "#5f3b2f",
      accentColor: profile?.accent_color || "#f3e8de",
      backgroundColor: profile?.background_color || "#fcfaf8",
      fontFamily: profile?.font_family || "font-sans",
    };
  }, [profile, mockProvider, handle]);

  const selectedService = useMemo(() => {
    return services.find((service) => service.id === selectedServiceId);
  }, [services, selectedServiceId]);

  const availableDays = useMemo(() => {
    return availability.filter((item) => item.isAvailable);
  }, [availability]);

  const selectedAvailabilityRow = useMemo(() => {
    return availability.find(
      (item) => item.day === selectedDay && item.isAvailable
    );
  }, [availability, selectedDay]);

  const rawTimeSlots = useMemo(() => {
    if (!selectedAvailabilityRow || !selectedService) return [];
    return generateTimeSlots(
      selectedAvailabilityRow.startTime,
      selectedAvailabilityRow.endTime,
      selectedService.duration
    );
  }, [selectedAvailabilityRow, selectedService]);

  const bookedTimes = useMemo(() => {
    return new Set(bookedAppointments.map((item) => item.appointment_time));
  }, [bookedAppointments]);

  const availableTimeSlots = useMemo(() => {
    return rawTimeSlots.filter((time) => !bookedTimes.has(time));
  }, [rawTimeSlots, bookedTimes]);

  const amountDueNow = useMemo(() => {
    if (!selectedService) return 0;

    if (selectedService.payment_type === "deposit") {
      return Number(selectedService.deposit_amount || 0);
    }

    if (selectedService.payment_type === "full") {
      return Number(selectedService.price || 0);
    }

    return 0;
  }, [selectedService]);

  const remainingDue = useMemo(() => {
    if (!selectedService) return 0;

    if (selectedService.payment_type === "deposit") {
      return Number(selectedService.price || 0) - Number(selectedService.deposit_amount || 0);
    }

    if (selectedService.payment_type === "full") {
      return 0;
    }

    return Number(selectedService.price || 0);
  }, [selectedService]);

  useEffect(() => {
    if (availableTimeSlots.length === 0) {
      setSelectedTime("");
      return;
    }

    if (!availableTimeSlots.includes(selectedTime)) {
      setSelectedTime(availableTimeSlots[0]);
    }
  }, [availableTimeSlots, selectedTime]);

  function handleDayChange(day: string) {
    setSelectedDay(day);
    setSelectedDate(getNextDateForDay(day) || "");
    setSelectedTime("");
  }

  async function createPayLaterAppointment() {
    if (!mergedProvider || !selectedService || !selectedTime) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: providerProfile } = await supabase
      .from("provider_profiles")
      .select("user_id, category, city, state, contact_email")
      .eq("handle", mergedProvider.handle)
      .maybeSingle();

    const { data: conflictingAppointment } = await supabase
      .from("appointments")
      .select("id")
      .eq("provider_handle", mergedProvider.handle)
      .eq("appointment_date", selectedDate)
      .eq("appointment_time", selectedTime)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (conflictingAppointment) {
      setSaving(false);
      setMessage("That time was just booked. Please choose another slot.");
      return;
    }

    const { error } = await supabase.from("appointments").insert({
      provider_user_id: providerProfile?.user_id || null,
      client_user_id: user?.id || null,
      provider_handle: mergedProvider.handle,
      provider_name: mergedProvider.name,
      provider_category: providerProfile?.category || mergedProvider.category,
      client_name: fullName,
      client_email: email,
      service_name: selectedService.name,
      service_duration: selectedService.duration,
      service_price: selectedService.price,
      appointment_day: selectedDay,
      appointment_date: selectedDate,
      appointment_time: selectedTime,
      notes: notes || null,
      status: "confirmed",
      location:
        providerProfile?.city && providerProfile?.state
          ? `${providerProfile.city}, ${providerProfile.state}`
          : `${mergedProvider.city}, ${mergedProvider.state}`,
      payment_type: "none",
      amount_paid: 0,
      remaining_due: selectedService.price,
      payment_status: "unpaid",
    });

    if (error) {
      console.error("Failed to create appointment:", error);
      setSaving(false);
      setMessage(error.message || "Failed to book appointment.");
      return;
    }

    try {
      await fetch(
        "https://pvrxhkibbyhidacqfgmi.supabase.co/functions/v1/send-booking-email",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clientEmail: email,
            clientName: fullName,
            providerEmail: providerProfile?.contact_email || mergedProvider.contactEmail,
            providerName: mergedProvider.name,
            serviceName: selectedService.name,
            appointmentDate: selectedDate,
            appointmentTime: selectedTime,
          }),
        }
      );
    } catch (emailError) {
      console.error("Email failed:", emailError);
    }

    router.push(
  `/booking-confirmation?provider=${encodeURIComponent(
    mergedProvider.name
  )}&service=${encodeURIComponent(
    selectedService.name
  )}&date=${encodeURIComponent(
    selectedDate
  )}&time=${encodeURIComponent(
    selectedTime
  )}&handle=${encodeURIComponent(
    mergedProvider.handle || ""
  )}&paymentType=none&amountPaid=0&remainingDue=${encodeURIComponent(
    String(selectedService.price)
  )}`
);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!fullName.trim() || !email.trim()) {
      setSaving(false);
      setMessage("Please fill in your name and email.");
      return;
    }

    if (!mergedProvider || !selectedService || !selectedTime) {
      setSaving(false);
      setMessage("Please select a service, day, and time.");
      return;
    }

    if ((selectedService.payment_type || "none") === "none") {
      await createPayLaterAppointment();
      return;
    }

    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        fullPrice: selectedService.price,
        paymentType: selectedService.payment_type || "none",
        depositAmount: selectedService.deposit_amount || 0,
        amountToCharge: amountDueNow,
        providerName: mergedProvider.name,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        clientName: fullName,
        clientEmail: email,
        providerEmail: mergedProvider.contactEmail,
        handle: mergedProvider.handle,
        notes,
      }),
    });

    const data = await response.json();

    if (data.url) {
      window.location.href = data.url;
      return;
    }

    console.error("Stripe error:", data.error);
    setMessage(data.error || "Could not start checkout.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            Loading booking page...
          </div>
        </div>
      </main>
    );
  }

  if (!mergedProvider) {
    notFound();
  }

  return (
    <main
      className={`min-h-screen text-[#2d211b] ${mergedProvider.fontFamily}`}
      style={{ backgroundColor: mergedProvider.backgroundColor }}
    >
      <div className="mx-auto max-w-5xl px-6 py-12">
        <Link
          href={`/b/${mergedProvider.handle}`}
          className="text-sm font-medium underline underline-offset-4"
          style={{ color: mergedProvider.primaryColor }}
        >
          ← Back to profile
        </Link>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            <p
              className="text-sm font-medium"
              style={{ color: mergedProvider.primaryColor }}
            >
              {mergedProvider.category}
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Book with {mergedProvider.name}
            </h1>

            <p className="mt-2 text-[#6b5d54]">
              Choose a service, pick an available day, and complete your booking.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium">Service</label>
                <select
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                >
                  {services.map((service) => (
                    <option key={service.id} value={service.id}>
                      {service.name} — ${service.price} — {service.duration} min
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Day</label>
                <select
                  value={selectedDay}
                  onChange={(e) => handleDayChange(e.target.value)}
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                >
                  {availableDays.map((slot) => (
                    <option key={slot.id || slot.day} value={slot.day}>
                      {slot.day}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Date</label>
                <input
                  type="text"
                  value={selectedDate}
                  readOnly
                  className="w-full rounded-xl border border-[#e3d6cb] bg-[#faf6f2] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Time slots
                </label>

                {loadingAppointments ? (
                  <p className="rounded-xl border border-[#e3d6cb] bg-[#faf6f2] px-4 py-3 text-sm text-[#6b5d54]">
                    Loading time slots...
                  </p>
                ) : availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {availableTimeSlots.map((time) => {
                      const isSelected = selectedTime === time;

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className="rounded-xl border px-4 py-3 text-sm font-medium transition"
                          style={{
                            borderColor: isSelected
                              ? mergedProvider.primaryColor
                              : "#e3d6cb",
                            backgroundColor: isSelected
                              ? mergedProvider.primaryColor
                              : "#ffffff",
                            color: isSelected ? "#ffffff" : "#2d211b",
                          }}
                        >
                          {formatTimeDisplay(time)}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-[#e3d6cb] bg-[#faf6f2] px-4 py-3 text-sm text-[#6b5d54]">
                    No open time slots available for this day.
                  </p>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any appointment notes"
                  rows={4}
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving || !selectedTime}
                className="rounded-xl px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                style={{ backgroundColor: mergedProvider.primaryColor }}
              >
                {saving
                  ? "Processing..."
                  : selectedService?.payment_type === "deposit"
                  ? "Pay deposit"
                  : selectedService?.payment_type === "full"
                  ? "Pay now"
                  : "Confirm booking"}
              </button>
            </form>
          </section>

          <aside
            className="h-fit rounded-3xl p-6 shadow-sm ring-1 ring-black/5"
            style={{ backgroundColor: mergedProvider.accentColor }}
          >
            <h2 className="text-2xl font-semibold">Booking summary</h2>

            <div className="mt-6 space-y-4">
              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Professional</p>
                <p className="mt-1 font-semibold">{mergedProvider.name}</p>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Service</p>
                <p className="mt-1 font-semibold">
                  {selectedService?.name ?? "Select a service"}
                </p>
                {selectedService && (
                  <p className="mt-1 text-sm text-[#6b5d54]">
                    ${selectedService.price} · {selectedService.duration} min
                  </p>
                )}
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Payment</p>
                <p className="mt-1 font-semibold">
                  {selectedService?.payment_type === "deposit"
                    ? "Deposit required"
                    : selectedService?.payment_type === "full"
                    ? "Full payment required"
                    : "Pay in person"}
                </p>
                {selectedService && (
                  <div className="mt-2 text-sm text-[#6b5d54] space-y-1">
                    <p>Due now: ${amountDueNow}</p>
                    <p>Remaining due: ${remainingDue}</p>
                  </div>
                )}
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Day</p>
                <p className="mt-1 font-semibold">
                  {selectedDay || "Select a day"}
                </p>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Date</p>
                <p className="mt-1 font-semibold">
                  {selectedDate || "Select a date"}
                </p>
              </div>

              <div
                className="rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <p className="text-sm text-[#6b5d54]">Time</p>
                <p className="mt-1 font-semibold">
                  {selectedTime
                    ? formatTimeDisplay(selectedTime)
                    : "Select a time"}
                </p>
              </div>
            </div>

            {message && (
              <div
                className="mt-6 rounded-2xl p-4"
                style={{ backgroundColor: mergedProvider.backgroundColor }}
              >
                <h3 className="font-semibold">Notice</h3>
                <p className="mt-2 text-sm leading-6 text-[#5f5148]">
                  {message}
                </p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}