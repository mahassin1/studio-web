"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getProviderByHandle } from "@/lib/mock-data";

type ProviderProfile = {
  id?: string;
  user_id?: string;
  business_name: string | null;
  handle: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  instagram: string | null;
  tiktok: string | null;
  website: string | null;
  specialties: string | null;
  experience: string | null;
  primary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  font_family: string | null;
  portfolio_images: string[] | null;
};

type ServiceItem = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description?: string;
};

type AvailabilityItem = {
  id: string;
  day: string;
  isAvailable: boolean;
  startTime: string;
  endTime: string;
};

function formatTime(value: string) {
  const [hourString, minute] = value.split(":");
  const hour = Number(hourString);
  const suffix = hour >= 12 ? "PM" : "AM";
  const normalizedHour = hour % 12 || 12;
  return `${normalizedHour}:${minute} ${suffix}`;
}

export default function ProviderProfilePage() {
  const params = useParams<{ handle: string }>();
  const handle = params.handle;
  const supabase = createClient();

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilityItem[]>([]);
  const [loading, setLoading] = useState(true);

  const mockProvider = getProviderByHandle(handle);

  useEffect(() => {
    async function loadProfile() {
      if (!handle) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("handle", handle)
        .maybeSingle();

      if (error) {
        console.error("Failed to load provider profile:", error);
      } else {
        setProfile(data);
      }

      const { data: serviceRows, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("provider_handle", handle)
        .order("created_at", { ascending: true });

      if (servicesError) {
        console.error("Failed to load services:", servicesError);
      } else {
        setServices(
          (serviceRows || []).map((item) => ({
            id: item.id,
            name: item.name,
            duration: item.duration,
            price: Number(item.price),
            description: item.description || "",
          }))
        );
      }

      

      const { data: availabilityRows, error: availabilityError } =
        await supabase
          .from("availability")
          .select("*")
          .eq("provider_handle", handle)
          .order("created_at", { ascending: true });

      if (availabilityError) {
        console.error("Failed to load availability:", availabilityError);
      } else {
        setAvailability(
          (availabilityRows || []).map((item) => ({
            id: item.id,
            day: item.day,
            isAvailable: item.is_available,
            startTime: item.start_time,
            endTime: item.end_time,
          }))
        );
      }

      setLoading(false);
    }

    loadProfile();
  }, [handle, supabase]);

  const mergedProvider = useMemo(() => {
    if (!profile && !mockProvider) return null;

    return {
      handle: profile?.handle || mockProvider?.handle || handle,
      name: profile?.business_name || mockProvider?.name || "Provider Name",
      category:
        profile?.category || mockProvider?.category || "Beauty Professional",
      city: profile?.city || mockProvider?.city || "City",
      state: profile?.state || mockProvider?.state || "ST",
      bio: profile?.bio || mockProvider?.bio || "No bio yet.",
      image:
        profile?.profile_image ||
        mockProvider?.image ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
      coverImage: profile?.cover_image || "",
      rating: mockProvider?.rating ?? 4.9,
      reviewCount: mockProvider?.reviewCount ?? 0,
      services: services.length > 0 ? services : mockProvider?.services ?? [],
      availability,
      instagram: profile?.instagram || "",
      tiktok: profile?.tiktok || "",
      website: profile?.website || "",
      specialties: profile?.specialties || "",
      experience: profile?.experience || "",
      primaryColor: profile?.primary_color || "#5f3b2f",
      accentColor: profile?.accent_color || "#f3e8de",
      backgroundColor: profile?.background_color || "#fcfaf8",
      fontFamily: profile?.font_family || "font-sans",
      portfolioImages: profile?.portfolio_images || [],
    };
  }, [profile, mockProvider, handle, services, availability]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            Loading provider profile...
          </div>
        </div>
      </main>
    );
  }

  if (!mergedProvider) {
    return (
      <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <h1 className="text-3xl font-bold">Profile not found</h1>
            <p className="mt-3 text-[#6b5d54]">
              We couldn’t find a provider with this handle.
            </p>
            <Link
              href="/search"
              className="mt-6 inline-flex rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white"
            >
              Back to search
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`min-h-screen text-[#2d211b] ${mergedProvider.fontFamily}`}
      style={{ backgroundColor: mergedProvider.backgroundColor }}
    >
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
          <div
            className="h-56 bg-cover bg-center"
            style={{
              backgroundImage: mergedProvider.coverImage
                ? `url(${mergedProvider.coverImage})`
                : "linear-gradient(to right, #ead7c4, #f1e3d7, #f7efe8)",
            }}
          />

          <div className="px-8 pb-8">
            <div className="-mt-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                <img
                  src={mergedProvider.image}
                  alt={mergedProvider.name}
                  className="h-28 w-28 rounded-3xl border-4 border-white object-cover shadow-md"
                />

                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: mergedProvider.primaryColor }}
                  >
                    {mergedProvider.category}
                  </p>
                  <h1 className="mt-1 text-4xl font-bold">
                    {mergedProvider.name}
                  </h1>
                  <p className="mt-2 text-[#6b5d54]">
                    {mergedProvider.city}, {mergedProvider.state}
                  </p>
                  <p className="mt-2 text-sm text-[#6b5d54]">
                    ⭐ {mergedProvider.rating} ({mergedProvider.reviewCount} reviews)
                  </p>
                </div>
              </div>

              <Link
                href={`/b/${mergedProvider.handle}/book`}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 font-semibold text-white"
                style={{ backgroundColor: mergedProvider.primaryColor }}
              >
                Book now
              </Link>
            </div>

            <div className="mt-8 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <section>
                  <h2 className="text-2xl font-semibold">About</h2>
                  <p className="mt-4 max-w-3xl leading-8 text-[#5f5148]">
                    {mergedProvider.bio}
                  </p>

                  {mergedProvider.specialties && (
                    <p className="mt-4 text-sm text-[#5f5148]">
                      <span className="font-semibold">Specialties:</span>{" "}
                      {mergedProvider.specialties}
                    </p>
                  )}

                  {mergedProvider.experience && (
                    <p className="mt-2 text-sm text-[#5f5148]">
                      <span className="font-semibold">Experience:</span>{" "}
                      {mergedProvider.experience} years
                    </p>
                  )}
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-semibold">Portfolio</h2>
                  <p className="mt-2 text-sm text-[#6b5d54]">
                    A gallery of the provider’s uploaded work.
                  </p>

                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    {mergedProvider.portfolioImages.length > 0 ? (
                      mergedProvider.portfolioImages.map((image, index) => (
                        <div
                          key={`${image}-${index}`}
                          className="overflow-hidden rounded-3xl border border-[#eadfd4]"
                          style={{ backgroundColor: mergedProvider.backgroundColor }}
                        >
                          <img
                            src={image}
                            alt={`Portfolio ${index + 1}`}
                            className="h-64 w-full object-cover"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-[#eadfd4] p-4 text-sm text-[#6b5d54]">
                        No portfolio images added yet.
                      </div>
                    )}
                  </div>
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-semibold">Services</h2>
                  <div className="mt-5 space-y-4">
                    {mergedProvider.services.length > 0 ? (
                      mergedProvider.services.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between rounded-2xl border border-[#eadfd4] p-4"
                          style={{ backgroundColor: mergedProvider.backgroundColor }}
                        >
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="mt-1 text-sm text-[#6b5d54]">
                              {service.duration} min
                            </p>
                            {service.description && (
                              <p className="mt-2 text-sm text-[#6b5d54]">
                                {service.description}
                              </p>
                            )}
                          </div>
                          <p className="font-semibold">${service.price}</p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-[#eadfd4] p-4 text-sm text-[#6b5d54]">
                        No services added yet.
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <section
                  className="rounded-3xl p-6 ring-1 ring-black/5"
                  style={{ backgroundColor: mergedProvider.accentColor }}
                >
                  <h2 className="text-2xl font-semibold">Availability</h2>
                  <p className="mt-2 text-sm text-[#6b5d54]">
                    Weekly schedule preview.
                  </p>

                  <div className="mt-6 space-y-4">
                    {mergedProvider.availability.length > 0 ? (
                      mergedProvider.availability.map((slot) => (
                        <div
                          key={slot.id}
                          className="rounded-2xl bg-white p-4 ring-1 ring-black/5"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <h3 className="font-semibold">{slot.day}</h3>
                            <span
                              className="rounded-full px-3 py-1 text-xs font-medium"
                              style={{
                                backgroundColor: slot.isAvailable
                                  ? mergedProvider.backgroundColor
                                  : "#efe4db",
                                color: "#2d211b",
                              }}
                            >
                              {slot.isAvailable ? "Open" : "Off"}
                            </span>
                          </div>

                          <p className="mt-3 text-sm text-[#5f5148]">
                            {slot.isAvailable
                              ? `${formatTime(slot.startTime)} - ${formatTime(
                                  slot.endTime
                                )}`
                              : "Not available"}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl bg-white p-4 ring-1 ring-black/5 text-sm text-[#6b5d54]">
                        No availability added yet.
                      </div>
                    )}
                  </div>

                  <Link
                    href={`/b/${mergedProvider.handle}/book`}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-xl px-5 py-3 font-semibold text-white"
                    style={{ backgroundColor: mergedProvider.primaryColor }}
                  >
                    Book appointment
                  </Link>
                </section>

                <section
                  className="rounded-3xl p-6 ring-1 ring-black/5"
                  style={{ backgroundColor: mergedProvider.accentColor }}
                >
                  <h2 className="text-2xl font-semibold">Socials</h2>

                  <div className="mt-5 grid gap-3">
                    {mergedProvider.instagram && (
                      <a
                        href={mergedProvider.instagram}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-black/5"
                      >
                        Instagram
                      </a>
                    )}

                    {mergedProvider.tiktok && (
                      <a
                        href={mergedProvider.tiktok}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-black/5"
                      >
                        TikTok
                      </a>
                    )}

                    {mergedProvider.website && (
                      <a
                        href={mergedProvider.website}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-2xl bg-white px-4 py-3 text-sm font-medium ring-1 ring-black/5"
                      >
                        Website
                      </a>
                    )}

                    {!mergedProvider.instagram &&
                      !mergedProvider.tiktok &&
                      !mergedProvider.website && (
                        <p className="text-sm text-[#6b5d54]">
                          No social links added yet.
                        </p>
                      )}
                  </div>
                </section>
              </aside>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}