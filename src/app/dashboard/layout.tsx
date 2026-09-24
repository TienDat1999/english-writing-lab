import { redirect } from "next/navigation";

import { signOut } from "@/auth";
import { DashboardBottomNav } from "@/components/dashboard-bottom-nav";
import { DashboardHeader } from "@/components/dashboard-header";
import { getSession } from "@/server/auth/session";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session?.user) {
    redirect("/login");
  }

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader
        signOutAction={signOutAction}
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />
      <main className="pb-20 md:pb-10 min-h-[calc(100vh-4rem)]">{children}</main>
      <DashboardBottomNav />
    </div>
  );
}
