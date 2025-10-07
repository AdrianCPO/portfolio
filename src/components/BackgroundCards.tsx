type Item = {
  slug: string;
  title: string;
  summary?: string;
  image?: string | null | undefined;
};

export default function BackgroundCards({
  items,
  className = "",
}: {
  items: Item[];
  className?: string;
}) {
  return (
    <div className={`grid gap-6 grid-cols-1 ${className}`}>
      {items.map((it, i) => (
        <a
          key={it.slug}
          id={`bg-card-${i + 1}`}
          href={`/background/${it.slug}/`}
          className="group block overflow-hidden rounded-xl border bg-white dark:bg-slate-900 transition hover:shadow-md"
        >
          {it.image && (
            <div className="relative w-full overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-800 h-40 md:h-48 lg:h-56">
              <img
                src={it.image}
                alt=""
                className="!h-full !w-full object-contain p-4"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
          <div className="p-4">
            <h3 className="text-lg sm:text-xl font-semibold">{it.title}</h3>
            {it.summary && (
              <p className="text-sm sm:text-base opacity-80 mt-2">{it.summary}</p>
            )}
            <span className="mt-3 inline-block text-xs underline opacity-90 group-hover:opacity-100">
              Läs mer →
            </span>
          </div>
        </a>
      ))}
    </div>
  );
}
