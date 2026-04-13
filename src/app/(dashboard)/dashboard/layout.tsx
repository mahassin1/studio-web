import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const role = user.user_metadata?.role;

  if (role !== "provider") {
    redirect("/client/appointments");
  }

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-[#2d211b]">
      <div className="flex">
        <aside className="hidden w-64 flex-col border-r border-[#eadfd4] bg-white p-6 lg:flex">
          <div>
            <h1 className="text-2xl font-bold">BeautyBook</h1>
            <p className="mt-1 text-sm text-[#8a6b5b]">Dashboard</p>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            <SidebarLink href="/dashboard">Overview</SidebarLink>
            <SidebarLink href="/dashboard/profile">Profile</SidebarLink>
            <SidebarLink href="/dashboard/services">Services</SidebarLink>
            <SidebarLink href="/dashboard/availability">Availability</SidebarLink>
            <SidebarLink href="/dashboard/appointments">Appointments</SidebarLink>
            <SidebarLink href="/dashboard/portfolio">Portfolio</SidebarLink>
            <SidebarLink href="/dashboard/calendar">Calendar</SidebarLink>
          </nav>

          <div className="mt-auto pt-10">
            <Link
              href="/"
              className="text-sm text-[#6b5d54] underline underline-offset-4"
            >
              ← Back to website
            </Link>
          </div>
        </aside>
        <SidebarLink href="/dashboard/earnings">Earnings</SidebarLink>

        <div className="flex-1">
          <header className="flex items-center justify-between border-b border-[#eadfd4] bg-white px-6 py-4">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <UserMenu dashboardType="provider" />
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}

function SidebarLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl px-4 py-3 text-sm font-medium text-[#2d211b] transition hover:bg-[#f3e8de]"
    >
      {children}
    </Link>
  );
}