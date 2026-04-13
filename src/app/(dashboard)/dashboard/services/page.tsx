"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PaymentType = "none" | "deposit" | "full";

type ServiceRow = {
  id: string;
  provider_handle: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  payment_type: PaymentType | null;
  deposit_amount: number | null;
};

export default function ServicesPage() {
  const supabase = createClient();
    

  const [providerHandle, setProviderHandle] = useState("");
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [duration, setDuration] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("none");
  const [depositAmount, setDepositAmount] = useState("");

  async function loadServices() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoading(false);
      setMessage("You must be logged in.");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("provider_profiles")
      .select("handle")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.handle) {
      setLoading(false);
      setMessage("Please create your provider profile first.");
      return;
    }

    setProviderHandle(profile.handle);

    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("provider_handle", profile.handle)
      .order("created_at", { ascending: true });

    if (error) {
  setMessage(error.message || error.details || "Failed to add service.");
  return;
}

    setServices(
      (data || []).map((item) => ({
        id: item.id,
        provider_handle: item.provider_handle,
        name: item.name,
        duration: Number(item.duration),
        price: Number(item.price),
        description: item.description || "",
        payment_type: (item.payment_type as PaymentType) || "none",
        deposit_amount:
          item.deposit_amount !== null && item.deposit_amount !== undefined
            ? Number(item.deposit_amount)
            : null,
      }))
    );

    setLoading(false);
  }

  useEffect(() => {
    loadServices();
  }, []);

  async function handleAddService(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    if (!providerHandle) {
      setSaving(false);
      setMessage("Provider handle not found.");
      return;
    }

    const numericPrice = Number(price);
    const numericDuration = Number(duration);
    const numericDeposit =
      depositAmount.trim() === "" ? null : Number(depositAmount);

    if (!name.trim() || !numericPrice || !numericDuration) {
      setSaving(false);
      setMessage("Please fill in service name, duration, and price.");
      return;
    }

    if (paymentType === "deposit") {
      if (numericDeposit === null || Number.isNaN(numericDeposit)) {
        setSaving(false);
        setMessage("Please enter a valid deposit amount.");
        return;
      }

      if (numericDeposit <= 0 || numericDeposit >= numericPrice) {
        setSaving(false);
        setMessage("Deposit must be greater than 0 and less than full price.");
        return;
      }
    }

    const payload = {
      provider_handle: providerHandle,
      name: name.trim(),
      duration: numericDuration,
      price: numericPrice,
      description: description.trim() || null,
      payment_type: paymentType,
      deposit_amount: paymentType === "deposit" ? numericDeposit : null,
    };

    const { error } = await supabase.from("services").insert(payload);

    setSaving(false);

    if (error) {
      console.error("Failed to add service:", error);
      setMessage(error.message || "Failed to add service.");
      return;
    }

    setName("");
    setDuration("");
    setPrice("");
    setDescription("");
    setPaymentType("none");
    setDepositAmount("");
    setMessage("Service added.");
    loadServices();
  }

  async function handleDeleteService(id: string) {
    const { error } = await supabase.from("services").delete().eq("id", id);

    if (error) {
      console.error("Failed to delete service:", error);
      setMessage("Failed to delete service.");
      return;
    }

    setServices((prev) => prev.filter((service) => service.id !== id));
  }

  function getPaymentLabel(service: ServiceRow) {
    if (service.payment_type === "deposit") {
      return `Deposit required${
        service.deposit_amount ? ` ($${service.deposit_amount})` : ""
      }`;
    }

    if (service.payment_type === "full") {
      return "Full payment required";
    }

    return "Pay in person";
  }

  if (loading) {
    return (
      <main className="px-6 py-8">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          Loading services...
        </div>
      </main>
    );
  }

  return (
    <main className="px-6 py-8 text-[#2d211b]">
      <div className="mb-8">
        <p className="text-sm font-medium text-[#8a6b5b]">Provider Dashboard</p>
        <h1 className="mt-2 text-3xl font-bold">Services</h1>
        <p className="mt-2 max-w-2xl text-[#6b5d54]">
          Add your services and choose how clients pay for each one.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Add a service</h2>

          <form onSubmit={handleAddService} className="mt-6 grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium">
                Service name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Bridal Glam"
                className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="90"
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Full price
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="150"
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what is included in this service"
                rows={4}
                className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                Payment type
              </label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
              >
                <option value="none">Pay in person</option>
                <option value="deposit">Deposit required</option>
                <option value="full">Full payment required</option>
              </select>
            </div>

            {paymentType === "deposit" && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Deposit amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none"
                />
                <p className="mt-2 text-xs text-[#8a6b5b]">
                  This is what the client pays online. The rest is paid in person.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add service"}
            </button>

            {message && (
              <p className="text-sm text-[#6b5d54]">{message}</p>
            )}
          </form>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-xl font-semibold">Your services</h2>

          <div className="mt-6 space-y-4">
            {services.length > 0 ? (
              services.map((service) => (
                <div
                  key={service.id}
                  className="rounded-2xl border border-[#eadfd4] p-5"
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{service.name}</h3>
                      <p className="mt-1 text-sm text-[#6b5d54]">
                        {service.duration} min · ${service.price}
                      </p>

                      {service.description && (
                        <p className="mt-3 text-sm leading-6 text-[#5f5148]">
                          {service.description}
                        </p>
                      )}

                      <div className="mt-4 inline-flex rounded-full bg-[#f8f4ef] px-3 py-1 text-xs font-medium text-[#5f3b2f]">
                        {getPaymentLabel(service)}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteService(service.id)}
                      className="rounded-xl border border-[#e3d6cb] px-4 py-2 text-sm font-medium text-[#2d211b]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-[#eadfd4] p-6 text-sm text-[#6b5d54]">
                No services added yet.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}