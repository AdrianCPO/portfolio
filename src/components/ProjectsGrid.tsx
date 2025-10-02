export type Project = {
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  image?: string;
  repo?: string;
  demo?: string;
  date?: string | null;
};

type Props = { items: Project[] };

// Bas-join
function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

// Samma setup: små, “contain”-ade bilder med padding och fixhöjd
const IMG_H = "h-28 sm:h-32 md:h-36 lg:h-40"; // ← ändra här om du vill

function CardImage({ src }: { src: string }) {
  return (
    <div className={`relative w-full overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-900 ${IMG_H}`}>
      <div className="absolute inset-0 p-2">
        <img
          src={src}
          alt=""
          className="!h-full !w-full object-contain"
          loading="lazy"
          decoding="async"
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        />
      </div>
    </div>
  );
}

export default function ProjectsGrid({ items }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <a
          key={p.slug}
          href={joinBase(`projects/${p.slug}/`)}
          className="block overflow-hidden rounded-xl border transition hover:shadow-md"
        >
          {p.image && <CardImage src={p.image} />}
          <div className="p-4">
            <h3 className="font-semibold">{p.title}</h3>
            {p.summary && <p className="text-sm opacity-80 mt-1">{p.summary}</p>}
            {p.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {p.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 border rounded">{t}</span>
                ))}
              </div>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}
