import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type XY = { x: number; y: number };

type Props = {
  jsonUrl: string;
  stateMarkers: [string, string, string];
  cardSelectors: [string, string, string];
  slotSelectors: [string, string, string];
  laneSelector: string;
  sizePx?: number;                 // artboard-storlek i Lottie
  media?: string;                  // när den aktiveras
  // position & skala
  offsets?: [XY, XY, XY];          // NYTT: föredras
  stateOffsetsPx?: [XY, XY, XY];   // BAKÅT-KOMP: gamla namnet
  segmentMs?: number;
  moveMs?: number;
  // skala-tuning
  scaleBase?: number;              // multiplicerar autoskalan
  minScale?: number;
  maxScale?: number;
  debug?: boolean;
  className?: string;
};

export default function GsapMorphLottie({
  jsonUrl,
  stateMarkers,
  cardSelectors,
  slotSelectors,
  laneSelector,
  sizePx = 1080,
  media = "(min-width: 1280px)",
  offsets,
  stateOffsetsPx,
  segmentMs = 700,
  moveMs = 0.5,
  scaleBase = 1.45,          // default nära din tidigare känsla
  minScale = 1.0,            // min 1x så den inte blir pytteliten
  maxScale = 1.8,
  debug = false,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const framesRef = useRef<number[]>([]);
  const idxRef = useRef(0);
  const enabledRef = useRef(false);
  const stRef = useRef<ScrollTrigger | null>(null);

  const effOffsets: [XY, XY, XY] =
    (offsets ?? stateOffsetsPx ?? [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]) as [XY, XY, XY];

  const log = (...a: any[]) => debug && console.log("[MorphLottie]", ...a);
  const laneEl = () => document.querySelector<HTMLElement>(laneSelector) || undefined;

  function readMarkerFrames(anim: AnimationItem) {
    const md: any = (anim as any).animationData;
    const byName = new Map<string, number>((md?.markers ?? []).map((m: any) => [String(m.cm), Number(m.tm)]));
    framesRef.current = stateMarkers.map((n) => byName.get(n) ?? 0);
    log("frames:", framesRef.current);
  }

  function applyScale() {
    const host = hostRef.current;
    const lane = laneEl();
    if (!host || !lane) return;
    const w = lane.getBoundingClientRect().width || sizePx;
    let s = (w / sizePx) * (scaleBase || 1);
    s = Math.max(minScale, Math.min(s, maxScale));
    gsap.set(host, { scale: s, transformOrigin: "0 0" });
    log("scale:", s);
  }

  function getSlotCenters(): [XY, XY, XY] {
    const lane = laneEl()!;
    const lr = lane.getBoundingClientRect();
    return slotSelectors.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      const r = el.getBoundingClientRect();
      return { x: (r.left - lr.left) + r.width / 2, y: (r.top - lr.top) + r.height / 2 };
    }) as [XY, XY, XY];
  }

  function moveTo(index: number, immediate = false) {
    const host = hostRef.current; if (!host) return;
    const centers = getSlotCenters();
    const c = centers[index] ?? centers[centers.length - 1];
    const off = effOffsets[index] ?? { x: 0, y: 0 };
    gsap.to(host, {
      x: Math.round(c.x - sizePx / 2 + off.x),
      y: Math.round(c.y - sizePx / 2 + off.y),
      duration: immediate ? 0 : moveMs,
      ease: "power2.out",
      overwrite: true,
    });
  }

  function morphTo(index: number) {
    const anim = animRef.current; if (!anim) return;
    const frames = framesRef.current; const from = idxRef.current; if (from === index) return;
    const start = frames[from] ?? 0; const end = frames[index] ?? 0;
    const fr = (anim as any).frameRate ?? (anim as any).animationData?.fr ?? 60;
    const dist = Math.abs(end - start);
    const speed = dist > 0 ? (dist / fr) * 1000 / (segmentMs || 700) : 1;

    const onDone = () => {
      anim.removeEventListener("complete", onDone as any);
      idxRef.current = index;
    };

    anim.setDirection(end >= start ? 1 : -1);
    anim.setSpeed(speed);
    anim.addEventListener("complete", onDone as any);
    anim.playSegments([start, end], true);
  }

  function computeActiveIndex(): number {
    const rects = cardSelectors.map((sel) => document.querySelector<HTMLElement>(sel)!.getBoundingClientRect());
    const centers = rects.map((r) => r.top + r.height / 2);
    const vp = window.innerHeight / 2;
    let best = Infinity, idx = 0;
    centers.forEach((c, i) => { const d = Math.abs(c - vp); if (d < best) { best = d; idx = i; } });
    return idx;
  }

  function syncSlotHeights() {
    cardSelectors.forEach((sel, i) => {
      const card = document.querySelector<HTMLElement>(sel);
      const slot = document.querySelector<HTMLElement>(slotSelectors[i]);
      if (!card || !slot) return;
      const h = Math.max(160, Math.round(card.getBoundingClientRect().height));
      slot.style.height = `${h}px`;
    });
  }

  function createTrigger() {
    const first = document.querySelector<HTMLElement>(cardSelectors[0]);
    const last = document.querySelector<HTMLElement>(cardSelectors[2]);
    if (!first || !last) return null;
    return ScrollTrigger.create({
      trigger: first,
      start: "top top+=100",
      endTrigger: last,
      end: "bottom bottom-=100",
      onUpdate: () => {
        const idx = computeActiveIndex();
        if (idx !== idxRef.current) {
          moveTo(idx);
          morphTo(idx);
        }
      },
    });
  }

  function enable() {
    if (enabledRef.current) return; enabledRef.current = true;
    const host = hostRef.current; const lane = laneEl();
    if (!host || !lane) return;

    // init host styles
    host.style.position = "absolute";
    host.style.left = "0";
    host.style.top = "0";
    host.style.width = `${sizePx}px`;
    host.style.height = `${sizePx}px`;
    host.style.pointerEvents = "none";
    host.style.zIndex = "3";

    const anim = lottie.loadAnimation({
      container: host,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: jsonUrl,
      rendererSettings: {
        progressiveLoad: true,
        // Viktigt: lås top-left-ankare så positioner blir stabila
        preserveAspectRatio: "xMinYMin meet",
        className: "lottie-svg",
      },
    });

    const onDom = () => {
      readMarkerFrames(anim);
      syncSlotHeights();
      applyScale();
      try { anim.goToAndStop(framesRef.current[idxRef.current] ?? 0, true); } catch {}
      moveTo(idxRef.current, true);
      stRef.current = createTrigger();
      window.addEventListener("resize", onResize, { passive: true });
      window.addEventListener("orientationchange", onResize, { passive: true });
    };

    (anim as any).addEventListener("DOMLoaded", onDom);
    animRef.current = anim;
  }

  function disable() {
    if (!enabledRef.current) return; enabledRef.current = false;
    stRef.current?.kill(); stRef.current = null;
    animRef.current?.destroy(); animRef.current = null;
    window.removeEventListener("resize", onResize as any);
    window.removeEventListener("orientationchange", onResize as any);
  }

  function onResize() {
    if (!enabledRef.current) return;
    syncSlotHeights();
    applyScale();
    moveTo(idxRef.current, true);
    ScrollTrigger.refresh();
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(media);
    const handle = () => { mql.matches ? enable() : disable(); };
    handle();
    mql.addEventListener("change", handle);
    return () => { mql.removeEventListener("change", handle); disable(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jsonUrl, media, sizePx, laneSelector, ...cardSelectors, ...slotSelectors, ...stateMarkers]);

  return (
    <div ref={hostRef} className={className}>
      <style>{`
        .lottie-svg [stroke] { stroke: currentColor !important; }
        .lottie-svg [fill]:not([fill="none"]) { fill: currentColor !important; }
        .lottie-svg * { vector-effect: non-scaling-stroke; }
      `}</style>
    </div>
  );
}
