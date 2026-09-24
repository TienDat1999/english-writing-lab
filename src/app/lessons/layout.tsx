import { auth, signOut } from "@/auth";
import { DashboardHeader } from "@/components/dashboard-header";

export default async function LessonsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/lessons" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader
        signOutAction={signOutAction}
        user={
          session?.user
            ? {
                name: session.user.name,
                email: session.user.email,
                image: session.user.image,
              }
            : null
        }
      />
      <main className="flex-1 pb-16">{children}</main>
    </div>
  );
}
