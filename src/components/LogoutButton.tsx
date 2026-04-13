"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ToastProvider";

type LogoutButtonProps = {
  variant?: "button" | "menu-item";
};

export default function LogoutButton({
  variant = "button",
}: LogoutButtonProps) {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);

    const { error } = await supabase.auth.signOut();

    setLoading(false);

    if (error) {
      console.error("Logout error:", error);
      showToast("Could not log out. Please try again.");
      return;
    }

    showToast("Logged out successfully");
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {variant === "menu-item" ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-[#2d211b] transition hover:bg-[#f3e8de]"
        >
          Logout
        </button>
      ) : (
        <button
          onClick={() => setShowConfirm(true)}
          className="rounded-xl bg-[#f3e8de] px-4 py-2 text-sm font-medium text-[#2d211b] transition hover:bg-[#eadfd4]"
        >
          Logout
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl ring-1 ring-black/10">
            <h3 className="text-xl font-bold">Log out?</h3>
            <p className="mt-3 text-sm leading-6 text-[#6b5d54]">
              You will be signed out of your account and redirected to the login
              page.
            </p>

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border border-[#e3d6cb] px-4 py-3 font-medium text-[#2d211b]"
                disabled={loading}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex-1 rounded-xl bg-[#5f3b2f] px-4 py-3 font-medium text-white disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Logging out..." : "Yes, log out"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}