export function PageHeading({
  description,
  eyebrow,
  title,
}: {
  description: string;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className="admin-enter max-w-3xl">
      <p className="admin-kicker text-[var(--navy-bright)]">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] sm:text-4xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-soft)] sm:text-base">
        {description}
      </p>
    </div>
  );
}
