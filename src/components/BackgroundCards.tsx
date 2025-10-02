// src/components/BackgroundCards.tsx
import { useEffect, useRef } from "react";

// Säker join av BASE_URL + path
function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

type Item = {
  slug: string;
  title: string;
  image?: string;
  summary?: string;
};

type Props = {
  items: Item[];
  // Placeholder för framtida “mouse-follow”-animation
  enableHoverTrail?: boolean;
};

export default function BackgroundCards({ items, enableHoverTrail }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Minimal “hook point” för framtida animation
  useEffect(() => {
    if (!enableHoverTrail || !containerRef.current) return;
    const el = containerRef.current;
    // Här kan vi senare sätta upp en canvas eller ett följe-element.
    // Just nu gör vi inget – bara reserverar platsen.
    return () => { /* cleanup */ };
  }, [enableHoverTrail]);

  return (
    <section ref={containerRef} className="mx-auto max-w-5xl">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Ortopedingenjör – min bakgrund</h2>
        <a className="text-sm underline" href={joinBase("contact/")}>Fråga mig mer</a>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        {items.map((it) => (
          <a
            key={it.slug}
            href={joinBase(`background/${it.slug}/`)}
            className="group block rounded-xl border p-3 hover:shadow-md transition bg-white/50 dark:bg-slate-900/50"
          >
            {it.image && (
              <img
                src={it.image}
                alt=""
                className="mb-3 aspect-[4/3] w-full rounded-lg object-cover"
              />
            )}
            <h3 className="font-semibold">{it.title}</h3>
            {it.summary && (
              <p className="text-sm opacity-80 mt-1 line-clamp-3">{it.summary}</p>
            )}
            <span className="mt-2 inline-block text-xs underline opacity-90 group-hover:opacity-100">
              Läs mer →
            </span>
          </a>
        ))}
      </div>
    </section>
  );
}
