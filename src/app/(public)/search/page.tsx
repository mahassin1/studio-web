"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProviderProfile = {
  id: string;
  user_id?: string;
  business_name: string | null;
  handle: string | null;
  category: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  profile_image: string | null;
  cover_image: string | null;
  specialties: string | null;
  experience: string | null;
};

type ServiceRow = {
  id: string;
  provider_handle: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
};

type SearchCard = {
  id: string;
  handle: string;
  businessName: string;
  category: string;
  city: string;
  state: string;
  bio: string;
  image: string;
  specialties: string;
  experience: string;
  services: ServiceRow[];
  minPrice: number | null;
};

export default function SearchPage() {
  const supabase = createClient();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [providers, setProviders] = useState<SearchCard[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");
  const [serviceFilter, setServiceFilter] = useState("All");

  useEffect(() => {
    setSearchTerm(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    async function loadSearchData() {
      setLoading(true);

      const { data: providerRows, error: providerError } = await supabase
        .from("provider_profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (providerError) {
        console.error("Failed to load provider profiles:", providerError);
        setLoading(false);
        return;
      }

      const { data: serviceRows, error: serviceError } = await supabase
        .from("services")
        .select("*")
        .order("created_at", { ascending: true });

      if (serviceError) {
        console.error("Failed to load services:", serviceError);
        setLoading(false);
        return;
      }

      const mappedProviders: SearchCard[] = (providerRows || [])
        .filter((provider: ProviderProfile) => provider.handle)
        .map((provider: ProviderProfile) => {
          const providerServices = (serviceRows || []).filter(
            (service: ServiceRow) => service.provider_handle === provider.handle
          );

          const minPrice =
            providerServices.length > 0
              ? Math.min(...providerServices.map((service) => Number(service.price)))
              : null;

          return {
            id: provider.id,
            handle: provider.handle || "",
            businessName: provider.business_name || "Provider Name",
            category: provider.category || "Beauty Professional",
            city: provider.city || "City",
            state: provider.state || "ST",
            bio: provider.bio || "No bio available yet.",
            image:
              provider.profile_image ||
              "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=800&auto=format&fit=crop",
            specialties: provider.specialties || "",
            experience: provider.experience || "",
            services: providerServices,
            minPrice,
          };
        });

      setProviders(mappedProviders);
      setLoading(false);
    }

    loadSearchData();
  }, [supabase]);

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(providers.map((provider) => provider.category).filter(Boolean))
    );
    return ["All", ...unique];
  }, [providers]);

  const cities = useMemo(() => {
    const unique = Array.from(
      new Set(providers.map((provider) => provider.city).filter(Boolean))
    );
    return ["All", ...unique];
  }, [providers]);

  const services = useMemo(() => {
    const unique = Array.from(
      new Set(
        providers.flatMap((provider) =>
          provider.services.map((service) => service.name).filter(Boolean)
        )
      )
    );
    return ["All", ...unique];
  }, [providers]);

  const filteredProviders = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return providers.filter((provider) => {
      const matchesSearch =
        !normalizedSearch ||
        provider.businessName.toLowerCase().includes(normalizedSearch) ||
        provider.category.toLowerCase().includes(normalizedSearch) ||
        provider.city.toLowerCase().includes(normalizedSearch) ||
        provider.state.toLowerCase().includes(normalizedSearch) ||
        provider.bio.toLowerCase().includes(normalizedSearch) ||
        provider.specialties.toLowerCase().includes(normalizedSearch) ||
        provider.services.some(
          (service) =>
            service.name.toLowerCase().includes(normalizedSearch) ||
            (service.description || "").toLowerCase().includes(normalizedSearch)
        );

      const matchesCategory =
        categoryFilter === "All" || provider.category === categoryFilter;

      const matchesCity = cityFilter === "All" || provider.city === cityFilter;

      const matchesService =
        serviceFilter === "All" ||
        provider.services.some((service) => service.name === serviceFilter);

      return matchesSearch && matchesCategory && matchesCity && matchesService;
    });
  }, [providers, searchTerm, categoryFilter, cityFilter, serviceFilter]);

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
      <section className="border-b border-[#eadfd4] bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <p className="text-sm font-medium text-[#8a6b5b]">Marketplace</p>
          <h1 className="mt-2 text-4xl font-bold">
            Find beauty professionals near you
          </h1>
          <p className="mt-4 max-w-2xl text-[#6b5d54]">
            Search makeup artists, nail techs, and hairstylists by city,
            category, service, or specialty.
          </p>

          <div className="mt-8 grid gap-4 rounded-3xl bg-[#f8f4ef] p-5 md:grid-cols-2 xl:grid-cols-4">
            <input
              type="text"
              placeholder="Search by name, service, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none focus:border-[#a97b61]"
            />

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none focus:border-[#a97b61]"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category === "All" ? "All categories" : category}
                </option>
              ))}
            </select>

            <select
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none focus:border-[#a97b61]"
            >
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city === "All" ? "All cities" : city}
                </option>
              ))}
            </select>

            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="rounded-xl border border-[#e3d6cb] bg-white px-4 py-3 outline-none focus:border-[#a97b61]"
            >
              {services.map((service) => (
                <option key={service} value={service}>
                  {service === "All" ? "All services" : service}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-sm text-[#6b5d54]">
            {loading
              ? "Loading professionals..."
              : `${filteredProviders.length} professional${
                  filteredProviders.length === 1 ? "" : "s"
                } found`}
          </p>

          {!loading && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setCategoryFilter("All");
                setCityFilter("All");
                setServiceFilter("All");
              }}
              className="text-sm font-medium text-[#5f3b2f] underline underline-offset-4"
            >
              Clear filters
            </button>
          )}
        </div>

        {loading ? (
          <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
            Loading search results...
          </div>
        ) : filteredProviders.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map((provider) => (
              <article
                key={provider.id}
                className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5"
              >
                <div className="h-48 bg-[#f3e8de]">
                  <img
                    src={provider.image}
                    alt={provider.businessName}
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="p-6">
                  <p className="text-sm font-medium text-[#8a6b5b]">
                    {provider.category}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {provider.businessName}
                  </h2>

                  <p className="mt-2 text-sm text-[#6b5d54]">
                    {provider.city}, {provider.state}
                  </p>

                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#5f5148]">
                    {provider.bio}
                  </p>

                  {provider.specialties && (
                    <p className="mt-4 text-sm text-[#5f5148]">
                      <span className="font-semibold">Specialties:</span>{" "}
                      {provider.specialties}
                    </p>
                  )}

                  {provider.experience && (
                    <p className="mt-2 text-sm text-[#5f5148]">
                      <span className="font-semibold">Experience:</span>{" "}
                      {provider.experience} years
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {provider.services.slice(0, 3).map((service) => (
                      <span
                        key={service.id}
                        className="rounded-full border border-[#eadfd4] bg-[#fcfaf8] px-3 py-1 text-xs font-medium"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-6 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8a6b5b]">Starting at</p>
                      <p className="text-lg font-bold">
                        {provider.minPrice !== null
                          ? `$${provider.minPrice}`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        href={`/b/${provider.handle}`}
                        className="rounded-xl border border-[#d8c4b4] px-4 py-2 text-sm font-semibold text-[#5f3b2f]"
                      >
                        View profile
                      </Link>

                      <Link
                        href={`/b/${provider.handle}/book`}
                        className="rounded-xl bg-[#5f3b2f] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-black/5">
            <h2 className="text-2xl font-semibold">No results found</h2>
            <p className="mt-3 text-[#6b5d54]">
              Try changing your search term or filters.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}