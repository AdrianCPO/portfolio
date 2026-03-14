type Item = {
  slug: string;
  title: string;
  summary?: string;
  image?: string | null | undefined;
};

const withBase = (p: string) => {
  const base =
    typeof import.meta !== "undefined" && import.meta.env?.BASE_URL
      ? import.meta.env.BASE_URL
      : "/";

  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const pp = p.startsWith("/") ? p.slice(1) : p;

  return `${b}/${pp}`;
};

export default function BackgroundCards({
  items,
  className = "",
}: {
  items: Item[];
  className?: string;
}) {
  return (
    <div className={`grid gap-6 ${className}`}>
      {items.map((it, i) => (
        <a
          key={it.slug}
          id={`bg-card-${i + 1}`}
          href={withBase(`/background/${it.slug}/`)}
          className="group grid overflow-hidden rounded-2xl border border-slate-200 bg-white transition duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 md:grid-cols-[280px_1fr]"
        >
          {it.image && (
            <div className="flex min-h-[220px] items-center justify-center bg-slate-50 p-8 dark:bg-slate-800/60 md:min-h-full">
              <img
                src={it.image}
                alt=""
                className="max-h-48 w-auto max-w-full object-contain transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}

          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
              CPO / Bakgrund
            </p>

            <h3 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">
              {it.title}
            </h3>

            {it.summary && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300 sm:text-base">
                {it.summary}
              </p>
            )}

            <div className="mt-5">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 transition group-hover:gap-3 dark:text-white">
                Läs mer
                <span aria-hidden="true">→</span>
              </span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}