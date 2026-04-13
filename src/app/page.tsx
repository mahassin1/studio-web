"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const featuredCategories = [
  {
    title: "Makeup Artists",
    description: "Book soft glam, bridal glam, full glam, and event makeup.",
  },
  {
    title: "Nail Techs",
    description: "Find acrylics, Gel-X, nail art, and luxury manicure services.",
  },
  {
    title: "Hair Stylists",
    description: "Book silk presses, braids, installs, blowouts, and styling.",
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Search professionals",
    description:
      "Browse artists by category, city, service, or specialty.",
  },
  {
    step: "2",
    title: "Pick a service",
    description:
      "View services, prices, availability, and profile details in one place.",
  },
  {
    step: "3",
    title: "Book instantly",
    description:
      "Choose an open time slot, confirm your appointment, and get email confirmation.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!query.trim()) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
      <section className="border-b border-[#eadfd4] bg-white">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#8a6b5b]">
              Beauty marketplace
            </p>

            <h1 className="mt-4 text-5xl font-bold leading-tight md:text-6xl">
              Book beauty services with top professionals near you
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#6b5d54]">
              Discover makeup artists, nail techs, and hairstylists, compare
              services, and book appointments online in minutes.
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-10 flex flex-col gap-3 rounded-[28px] bg-[#f8f4ef] p-4 shadow-sm ring-1 ring-black/5 sm:flex-row"
            >
              <input
                type="text"
                placeholder="Search by service, artist, city, or specialty..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 rounded-2xl border border-[#e3d6cb] bg-white px-5 py-4 outline-none focus:border-[#a97b61]"
              />

              <button
                type="submit"
                className="rounded-2xl bg-[#5f3b2f] px-6 py-4 font-semibold text-white transition hover:opacity-90"
              >
                Search
              </button>
            </form>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/search"
                className="rounded-xl border border-[#d8c4b4] px-5 py-3 text-sm font-semibold text-[#5f3b2f] transition hover:bg-[#f3e8de]"
              >
                Browse professionals
              </Link>

              <Link
                href="/signup"
                className="rounded-xl bg-[#5f3b2f] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Join as a provider
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[28px] bg-[#f3e8de] p-4 sm:col-span-2">
              <img
                src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1400&auto=format&fit=crop"
                alt="Beauty professional applying makeup"
                className="h-72 w-full rounded-[22px] object-cover"
              />
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-[#8a6b5b]">Instant booking</p>
              <p className="mt-2 text-2xl font-bold">Open time slots</p>
              <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                Clients can pick real available appointment times and confirm in
                one flow.
              </p>
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-medium text-[#8a6b5b]">Built for providers</p>
              <p className="mt-2 text-2xl font-bold">Manage everything</p>
              <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                Profiles, services, availability, bookings, and calendars all in
                one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-8">
          <p className="text-sm font-medium text-[#8a6b5b]">Popular categories</p>
          <h2 className="mt-2 text-3xl font-bold">Find the right beauty service</h2>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredCategories.map((category) => (
            <div
              key={category.title}
              className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
            >
              <h3 className="text-2xl font-semibold">{category.title}</h3>
              <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                {category.description}
              </p>
              <Link
                href={`/search?q=${encodeURIComponent(category.title)}`}
                className="mt-6 inline-flex text-sm font-semibold text-[#5f3b2f] underline underline-offset-4"
              >
                Explore {category.title.toLowerCase()}
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="mb-8">
            <p className="text-sm font-medium text-[#8a6b5b]">How it works</p>
            <h2 className="mt-2 text-3xl font-bold">
              A simpler way to discover and book
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((item) => (
              <div
                key={item.step}
                className="rounded-3xl bg-[#fcfaf8] p-6 shadow-sm ring-1 ring-black/5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f3e8de] text-lg font-bold text-[#5f3b2f]">
                  {item.step}
                </div>

                <h3 className="mt-5 text-2xl font-semibold">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="rounded-[32px] bg-[#5f3b2f] px-8 py-12 text-white">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/70">
                For beauty professionals
              </p>
              <h2 className="mt-3 text-4xl font-bold">
                Create your profile and start accepting bookings
              </h2>
              <p className="mt-4 max-w-2xl text-white/80">
                Build your public booking page, manage your calendar, list your
                services, and grow your client base.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl bg-white px-5 py-3 font-semibold text-[#5f3b2f]"
              >
                Get started
              </Link>

              <Link
                href="/login"
                className="rounded-xl border border-white/30 px-5 py-3 font-semibold text-white"
              >
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}