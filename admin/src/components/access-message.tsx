import { DraftwiseBrand } from "@draftwise/ui";

import { signOut } from "@/auth";

export function AccessMessage({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  const learnerUrl = process.env.NEXT_PUBLIC_LEARNER_APP_URL ?? "http://localhost:3001";

  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="admin-panel w-full max-w-xl p-7 sm:p-10">
        <DraftwiseBrand suffix="Admin" />
        <p className="admin-kicker mt-10 text-[var(--danger)]">{eyebrow}</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.04em] sm:text-4xl">{title}</h1>
        <p className="mt-4 text-sm leading-7 text-[var(--ink-soft)]">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a className="rounded-xl bg-[var(--navy)] px-5 py-3 text-center text-sm font-bold text-white" href={learnerUrl}>
            Về app học
          </a>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="w-full rounded-xl border border-[var(--line)] bg-white px-5 py-3 text-sm font-bold sm:w-auto" type="submit">
              Đổi tài khoản
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
