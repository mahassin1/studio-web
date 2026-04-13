"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function handleLogout() {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.replace("/login");
    }

    handleLogout();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#fcfaf8] text-[#2d211b] flex items-center justify-center px-6">
      <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-black/5">
        Signing you out...
      </div>
    </main>
  );
}