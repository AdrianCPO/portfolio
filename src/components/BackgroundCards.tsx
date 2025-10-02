import React, { useEffect, useRef } from "react";

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

// Små, “contain”-ade bilder med padding och fixhöjd
const IMG_H = "h-28 sm:h-32 md:h-36 lg:h-40";
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
          sizes="(min-width: 640px) 33vw, 100vw"
        />
      </div>
    </div>
  );
}

// placering i 2x3-grid på ≥sm
function placeClass(i: number) {
  // 0 → col 1 / row 1
  // 1 → col 2 / row 2
  // 2 → col 1 / row 3
  const map = [
    "sm:col-start-1 sm:row-start-1",
    "sm:col-start-2 sm:row-start-2",
    "sm:col-start-1 sm:row-start-3",
  ];
  return map[i] ?? "";
}

export default function BackgroundCards({
  items,
  enableHoverTrail = false,
}: {
  items: Item[];
  enableHoverTrail?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enableHoverTrail || !ref.current) return;
    // hook för framtida animation
    return () => {};
  }, [enableHoverTrail]);

  return (
    <section ref={ref} className="mx-auto max-w-5xl">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold">Ortopedingenjör – min bakgrund</h2>
        <a className="text-sm underline" href={joinBase("contact/")}>Fråga mig mer</a>
      </div>

      {/* 1 kolumn på mobil. På ≥sm: exakt 2 kolumner × 3 rader, vi positionerar barnen manuellt */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 sm:grid-rows-3">
        {items.map((it, i) => (
          <a
            key={it.slug}
            href={joinBase(`background/${it.slug}/`)}
            className={`group block overflow-hidden rounded-xl border bg-white/50 transition hover:shadow-md dark:bg-slate-900/50 ${placeClass(i)}`}
          >
            {it.image && <CardImage src={it.image} />}
            <div className="p-3">
              <h3 className="font-semibold">{it.title}</h3>
              {it.summary && <p className="text-sm opacity-80 mt-1">{it.summary}</p>}
              <span className="mt-2 inline-block text-xs underline opacity-90 group-hover:opacity-100">
                Läs mer →
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
