"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "provider" | "client";

export default function SignupPage() {
  const router = useRouter();
    const supabase = createClient();
   


  const [role, setRole] = useState<Role>("provider");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    // If email confirmation is enabled, session will usually be null
    if (!data.session) {
      setMessage("Account created. Please check your email to confirm your account.");
      return;
    }

    // If the user is instantly signed in
if (role === "provider") {
  router.push("/dashboard/profile");
} else {
  router.push("/client/appointments");
}
  }

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
          <section className="hidden bg-[#f3e8de] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-1 text-sm font-medium text-[#5a4033]">
                Get started
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight">
                Create your account and start booking or accepting clients
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-[#5f5148]">
                Professionals can create a public profile, manage bookings, and
                showcase their work. Clients can discover providers and book
                services online.
              </p>
            </div>

            <div className="mt-10 rounded-3xl bg-white/80 p-6">
              <p className="text-sm text-[#6b5d54]">Already registered?</p>
              <Link
                href="/login"
                className="mt-2 inline-flex text-sm font-semibold text-[#5f3b2f] underline underline-offset-4"
              >
                Sign in instead
              </Link>
            </div>
          </section>

          <section className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-medium text-[#8a6b5b]">Signup</p>
              <h2 className="mt-2 text-3xl font-bold">Create account</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                Choose your role to get started.
              </p>

              <div className="mt-8">
                <p className="mb-3 text-sm font-medium">I am joining as a</p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole("provider")}
                    className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                      role === "provider"
                        ? "border-[#5f3b2f] bg-[#5f3b2f] text-white"
                        : "border-[#e3d6cb] bg-white text-[#2d211b]"
                    }`}
                  >
                    Beauty Professional
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("client")}
                    className={`rounded-2xl border px-4 py-4 text-sm font-medium transition ${
                      role === "client"
                        ? "border-[#5f3b2f] bg-[#5f3b2f] text-white"
                        : "border-[#e3d6cb] bg-white text-[#2d211b]"
                    }`}
                  >
                    Client
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none transition focus:border-[#a97b61]"
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
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none transition focus:border-[#a97b61]"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none transition focus:border-[#a97b61]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? "Creating account..." : "Create account"}
                </button>
              </form>

              {message && (
                <div className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#faf3ec] p-4 text-sm text-[#5f5148]">
                  {message}
                </div>
              )}

              <p className="mt-6 text-sm text-[#6b5d54]">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-[#5f3b2f] underline underline-offset-4"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}