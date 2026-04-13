import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ADMIN_EMAIL = "mabdallah@berkeley.edu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // not logged in → go to login
  if (!user) {
    redirect("/login");
  }

  // not admin → block access
  if (user.email !== ADMIN_EMAIL) {
    redirect("/");
  }

  return <>{children}</>;
}