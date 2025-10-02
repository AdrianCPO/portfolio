// src/components/ProjectsGrid.tsx
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

// Joinar säkert BASE_URL + path (hanterar /-dubletter)
function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

export default function ProjectsGrid({ items }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <a
          key={p.slug}
          href={joinBase(`projects/${p.slug}/`)}
          className="block rounded-xl border p-4 hover:shadow-md transition"
        >
          {p.image && (
            <img
              src={p.image}
              alt=""
              className="mb-3 aspect-video w-full rounded-lg object-cover"
            />
          )}
          <h3 className="font-semibold">{p.title}</h3>
          {p.summary && <p className="text-sm opacity-80 mt-1">{p.summary}</p>}
          {p.tags?.length ? (
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              {p.tags.map((t) => (
                <span key={t} className="px-2 py-0.5 border rounded">
                  {t}
                </span>
              ))}
            </div>
          ) : null}
        </a>
      ))}
    </div>
  );
}
