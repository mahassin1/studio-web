"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import LogoutButton from "@/components/LogoutButton";

type UserProfile = {
  fullName: string;
  email: string;
  role: string;
};

function getInitials(name: string, email: string) {
  if (name.trim()) {
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }

  return email.slice(0, 2).toUpperCase();
}

type UserMenuProps = {
  dashboardType: "provider" | "client";
};

export default function UserMenu({ dashboardType }: UserMenuProps) {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    fullName: "",
    email: "",
    role: "",
  });

  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setProfile({
        fullName: user.user_metadata?.full_name || "",
        email: user.email || "",
        role: user.user_metadata?.role || "",
      });
    }

    loadUser();
  }, [supabase]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const initials = useMemo(
    () => getInitials(profile.fullName, profile.email),
    [profile.fullName, profile.email]
  );

  const accountHref =
    dashboardType === "provider" ? "/dashboard/profile" : "/client/appointments";

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-3 rounded-2xl bg-[#f3e8de] px-3 py-2 transition hover:bg-[#eadfd4]"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5f3b2f] text-sm font-bold text-white">
          {initials}
        </div>

        <div className="hidden text-left sm:block">
          <p className="text-sm font-medium text-[#2d211b]">
            {profile.fullName || "Account"}
          </p>
          <p className="text-xs text-[#6b5d54]">
            {profile.role || "member"}
          </p>
        </div>
      </button>

      {open && (
        <div className="absolute right-0 top-14 z-[90] w-72 rounded-3xl bg-white p-3 shadow-xl ring-1 ring-black/10">
          <div className="rounded-2xl bg-[#fcfaf8] p-4">
            <p className="font-semibold text-[#2d211b]">
              {profile.fullName || "Account"}
            </p>
            <p className="mt-1 text-sm text-[#6b5d54]">{profile.email}</p>
          </div>

          <div className="mt-3 grid gap-1">
            <Link
              href={accountHref}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2 text-sm font-medium text-[#2d211b] transition hover:bg-[#f3e8de]"
            >
              Account
            </Link>

            {dashboardType === "provider" ? (
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[#2d211b] transition hover:bg-[#f3e8de]"
              >
                Provider dashboard
              </Link>
            ) : (
              <Link
                href="/client/calendar"
                onClick={() => setOpen(false)}
                className="rounded-xl px-3 py-2 text-sm font-medium text-[#2d211b] transition hover:bg-[#f3e8de]"
              >
                My calendar
              </Link>
            )}

            <LogoutButton variant="menu-item" />
          </div>
        </div>
      )}
    </div>
  );
}