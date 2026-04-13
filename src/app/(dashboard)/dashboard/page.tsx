import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const fullName =
    (user.user_metadata?.full_name as string | undefined) || "User";
  const role = (user.user_metadata?.role as string | undefined) || "provider";

  const stats = [
    { label: "Appointments Today", value: "4" },
    { label: "This Week", value: "12" },
    { label: "Pending Requests", value: "3" },
    { label: "Revenue", value: "$840" },
  ];

  const quickLinks = [
    { label: "Edit profile", href: "/dashboard/profile" },
    { label: "Manage services", href: "/dashboard/services" },
    { label: "Set availability", href: "/dashboard/availability" },
    { label: "View portfolio", href: "/dashboard/portfolio" },
    { label: "View calendar", href: "/dashboard/calendar" },
    { label: "My bookings", href: "/dashboard/my-appointments" },
  ];

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-medium text-[#8a6b5b]">Dashboard</p>
          <h1 className="mt-2 text-4xl font-bold">
            Welcome back, {fullName}
          </h1>
          <p className="mt-3 max-w-2xl text-[#6b5d54]">
            Signed in as {user.email}. Your current account type is {role}.
          </p>
        </div>

        <Link
          href="/logout"
          className="inline-flex w-fit items-center justify-center rounded-xl bg-[#5f3b2f] px-5 py-3 font-semibold text-white transition hover:opacity-90"
        >
          Log out
        </Link>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-sm text-[#8a6b5b]">{stat.label}</p>
            <p className="mt-3 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-semibold">Account Overview</h2>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Full Name</p>
              <p className="mt-1 font-semibold">{fullName}</p>
            </div>

            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Email</p>
              <p className="mt-1 font-semibold">{user.email}</p>
            </div>

            <div className="rounded-2xl bg-[#f8f4ef] p-4">
              <p className="text-sm text-[#8a6b5b]">Role</p>
              <p className="mt-1 font-semibold capitalize">{role}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <h2 className="text-2xl font-semibold">Quick Actions</h2>
          <div className="mt-5 grid gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl border border-[#eadfd4] bg-[#fcfaf8] px-4 py-4 font-medium transition hover:bg-[#f3e8de]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}