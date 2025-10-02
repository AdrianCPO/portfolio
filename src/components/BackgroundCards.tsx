import { useEffect, useRef, useState } from "react";

// ===== utils =====
function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}
type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
function pointAlongPolyline(points: Pt[], t: number) {
  if (points.length < 2) return { pos: points[0] ?? { x: 0, y: 0 }, angle: 0 };
  const seg = points.slice(0, -1).map((p, i) => dist(p, points[i + 1]));
  const total = seg.reduce((a, b) => a + b, 0) || 1;
  let target = total * clamp01(t);
  for (let i = 0; i < seg.length; i++) {
    const L = seg[i];
    if (target <= L) {
      const p1 = points[i], p2 = points[i + 1];
      const k = L ? target / L : 0;
      const x = lerp(p1.x, p2.x, k);
      const y = lerp(p1.y, p2.y, k);
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      return { pos: { x, y }, angle };
    }
    target -= L;
  }
  const pLast = points[points.length - 1], pPrev = points[points.length - 2];
  return { pos: pLast, angle: Math.atan2(pLast.y - pPrev.y, pLast.x - pPrev.x) };
}

// ===== types =====
type Item = {
  slug: string;
  title: string;
  image?: string;
  summary?: string;
};

// ===== card image (liten, contain, fixhöjd) =====
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

// ===== grid placement (2 kolumner × 3 rader) =====
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
  animationSrc = "/images/lårbensprotes.png",
  inertiaMs = 350,        // ↑ större = långsammare/mjukare
  scrollStretch = 1,      // ↑ större = måste scrolla längre
}: {
  items: Item[];
  animationSrc?: string;
  inertiaMs?: number;
  scrollStretch?: number;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const moverWrapRef = useRef<HTMLDivElement>(null); // position (translate)
  const moverImgRef = useRef<HTMLImageElement>(null); // rotation/scale animation

  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const setCardRef = (i: number) => (el: HTMLAnchorElement | null): void => {
    cardRefs.current[i] = el;
  };

  const [d, setD] = useState<string>("");       // SVG path
  const ptsRef = useRef<Pt[]>([]);              // polyline points
  const tMarksRef = useRef<number[]>([0, 0.5, 1]); // waypoints

  // flourish locks
  const FLOURISH_MS = 900;
  const lockUntilRef = useRef<number>(0);
  const lockedPoseRef = useRef<{ pos: Pt; angle: number; t: number } | null>(null);
  const lastHitRef = useRef<number | null>(null);

  // smooth t with inertia
  const tAnimRef = useRef<number>(0);
  const lastTsRef = useRef<number | null>(null);

  // Bygg polyline genom tomrummen bredvid raderna
  const measure = () => {
    const sec = sectionRef.current;
    const c0 = cardRefs.current[0];
    const c1 = cardRefs.current[1];
    const c2 = cardRefs.current[2];
    if (!sec || !c0 || !c1 || !c2) return;

    const secRect = sec.getBoundingClientRect();
    const secTop = secRect.top + window.scrollY;
    const secLeft = secRect.left + window.scrollX;

    const r0 = c0.getBoundingClientRect();
    const r1 = c1.getBoundingClientRect();
    const r2 = c2.getBoundingClientRect();

    const xCol1 = r0.left + r0.width / 2;
    const xCol2 = r1.left + r1.width / 2;
    const yRow1 = r0.top + r0.height / 2;
    const yRow2 = r1.top + r1.height / 2;
    const yRow3 = r2.top + r2.height / 2;

    const P: Pt[] = [
      { x: xCol2 - secLeft, y: yRow1 - secTop }, // höger om rad 1
      { x: xCol1 - secLeft, y: yRow2 - secTop }, // vänster om rad 2
      { x: xCol2 - secLeft, y: yRow3 - secTop }, // höger om rad 3
    ];
    ptsRef.current = P;

    const dStr = `M ${P[0].x},${P[0].y} L ${P[1].x},${P[1].y} L ${P[2].x},${P[2].y}`;
    setD(dStr);

    const L01 = dist(P[0], P[1]);
    const L12 = dist(P[1], P[2]);
    const total = Math.max(1, L01 + L12);
    tMarksRef.current = [0, L01 / total, 1];
  };

  // scroll-driven uppdatering + flourish
  useEffect(() => {
    let raf = 0;
    const EPS = 0.045;
    const START_MARGIN = 0.02;

    const tick = () => {
      const sec = sectionRef.current;
      const wrap = moverWrapRef.current;
      const img = moverImgRef.current;
      const P = ptsRef.current;

      const now = performance.now();
      const last = lastTsRef.current ?? now;
      const dt = now - last;
      lastTsRef.current = now;

      if (sec && wrap && img && P.length >= 2) {
        const rect = sec.getBoundingClientRect();
        const vh = window.innerHeight;

        // --- scroll → targetT (0..1), med "virtual stretch" ---
        const extra = rect.height * Math.max(1, scrollStretch) - rect.height; // ≥0
        const start = window.scrollY + rect.top - vh * 0.25 - extra / 2;
        const end   = window.scrollY + rect.bottom - vh * 0.75 + extra / 2;
        const targetT = clamp01((window.scrollY - start) / Math.max(1, end - start));

        const nowLocked = performance.now() < lockUntilRef.current;

        if (nowLocked && lockedPoseRef.current) {
          // håll position låst under flourish
          const { pos, t } = lockedPoseRef.current;
          tAnimRef.current = t; // frys in anim-t så vi inte missar waypoints
          wrap.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
        } else {
          // --- inerti­a: lågpass-filtrera t ---
          const tau = Math.max(1, inertiaMs); // ms
          const alpha = 1 - Math.exp(-dt / tau); // 0..1
          tAnimRef.current += (targetT - tAnimRef.current) * alpha;

          const t = clamp01(tAnimRef.current);
          const { pos, angle } = pointAlongPolyline(P, t);

          wrap.style.transform = `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`;
          if (!img.style.animation) {
            img.style.setProperty("--base-angle", `${angle}rad`);
            img.style.transform = `rotate(${angle}rad)`;
          }

          // Waypoint-trigger när den ANIMERADE ikonen är nära markeringar
          const tMarks = tMarksRef.current
            .map((tm, i) => ({ tm, i }))
            .filter(({ tm }) => tm > START_MARGIN && tm < 1 - START_MARGIN);

          const hit = tMarks.find(({ tm }) => Math.abs(t - tm) <= EPS);
          if (hit && lastHitRef.current !== hit.i) {
            lockUntilRef.current = performance.now() + FLOURISH_MS;
            lockedPoseRef.current = { pos, angle, t };
            lastHitRef.current = hit.i;

            img.style.setProperty("--base-angle", `${angle}rad`);
            img.style.animation = `flourish ${FLOURISH_MS}ms ease-out`;
            window.setTimeout(() => {
              img.style.animation = "";
            }, FLOURISH_MS + 20);
          }
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inertiaMs, scrollStretch]);

  // re-mät vid mount/resize/load
  useEffect(() => {
    const onResize = () => measure();
    const onLoad = () => measure();
    measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("load", onLoad);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <section ref={sectionRef} className="mx-auto max-w-5xl text-slate-400">
      <style>{`
        @keyframes flourish {
          0%   { transform: rotate(var(--base-angle, 0rad)) scale(1); }
          40%  { transform: rotate(calc(var(--base-angle, 0rad) + 1turn)) scale(1.15); }
          70%  { transform: rotate(calc(var(--base-angle, 0rad) + 1.2turn)) scale(1.05); }
          100% { transform: rotate(var(--base-angle, 0rad)) scale(1); }
        }
      `}</style>

      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">Ortopedingenjör – min bakgrund</h2>
        <a className="text-sm underline" href={joinBase("contact/")}>Fråga mig mer</a>
      </div>

      <div className="relative">
        {/* Path bakom korten – döljs på mobil */}
        <svg className="pointer-events-none absolute inset-0 hidden sm:block -z-10" aria-hidden="true">
          <path d={d} fill="none" stroke="currentColor" strokeWidth="2" className="opacity-25" />
        </svg>

        {/* Mover: wrapper (position) + img (rotation/scale) */}
        <div
          ref={moverWrapRef}
          className="pointer-events-none absolute hidden sm:block -z-10 will-change-transform"
          style={{ transform: "translate(-9999px,-9999px)" }}
        >
          <img
            ref={moverImgRef}
            src={joinBase(animationSrc)}
            alt=""
            width={64}
            height={64}
            style={{ transform: "rotate(0rad)" }}
          />
        </div>

        {/* 2 kolumner × 3 rader (manuell placering) */}
        <div ref={gridRef} className="grid gap-6 grid-cols-1 sm:grid-cols-2 sm:grid-rows-3">
          {items.map((it, i) => (
            <a
              ref={setCardRef(i)}
              key={it.slug}
              href={joinBase(`background/${it.slug}/`)}
              className={`group block overflow-hidden rounded-xl border bg-white/50 transition hover:shadow-md dark:bg-slate-900/50 ${placeClass(i)}`}
            >
              {it.image && <CardImage src={it.image} />}
              <div className="p-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">{it.title}</h3>
                {it.summary && <p className="text-sm opacity-80 mt-1">{it.summary}</p>}
                <span className="mt-2 inline-block text-xs underline opacity-90 group-hover:opacity-100">
                  Läs mer →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
