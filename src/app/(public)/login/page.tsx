"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Role = "provider" | "client";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    const user = data.user;

    // 👇 Get role from user metadata
    const role = user?.user_metadata?.role as Role | undefined;

    if (role === "provider") {
      router.push("/dashboard");
    } else {
      router.push("/search");
    }
  }

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b]">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-black/5 lg:grid-cols-2">
          {/* LEFT SIDE */}
          <section className="hidden bg-[#f3e8de] p-10 lg:flex lg:flex-col lg:justify-between">
            <div>
              <span className="inline-flex rounded-full bg-white px-4 py-1 text-sm font-medium text-[#5a4033]">
                Welcome back
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight">
                Log in and continue your booking experience
              </h1>

              <p className="mt-5 max-w-md text-base leading-7 text-[#5f5148]">
                Access your dashboard, manage bookings, or discover new beauty
                professionals.
              </p>
            </div>

            <div className="mt-10 rounded-3xl bg-white/80 p-6">
              <p className="text-sm text-[#6b5d54]">New here?</p>
              <Link
                href="/signup"
                className="mt-2 inline-flex text-sm font-semibold text-[#5f3b2f] underline underline-offset-4"
              >
                Create an account
              </Link>
            </div>
          </section>

          {/* RIGHT SIDE */}
          <section className="p-8 sm:p-10">
            <div className="mx-auto max-w-md">
              <p className="text-sm font-medium text-[#8a6b5b]">Login</p>
              <h2 className="mt-2 text-3xl font-bold">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
                Enter your credentials to continue.
              </p>

              <form onSubmit={handleLogin} className="mt-8 grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none focus:border-[#a97b61]"
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
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-[#e3d6cb] px-4 py-3 outline-none focus:border-[#a97b61]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Log in"}
                </button>
              </form>

              {message && (
                <div className="mt-5 rounded-2xl border border-[#eadfd4] bg-[#faf3ec] p-4 text-sm text-[#5f5148]">
                  {message}
                </div>
              )}

              <p className="mt-6 text-sm text-[#6b5d54]">
                Don’t have an account?{" "}
                <Link
                  href="/signup"
                  className="font-semibold text-[#5f3b2f] underline underline-offset-4"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}