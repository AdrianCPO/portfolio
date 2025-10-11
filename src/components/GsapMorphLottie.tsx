import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { gsap } from "gsap";

type XY = { x: number; y: number };

type Props = {
  jsonUrl: string;
  stateMarkers: [string, string, string];   // t.ex. ["human1","heart1","dev"]
  cardSelectors: [string, string, string];  // ["#skills-wrap","#heart-wrap","#projects-wrap"]
  slotSelectors: [string, string, string];  // ["#slot-human","#slot-heart","#slot-dev"]
  laneSelector: string;                     // "#icon-lane"
  sizePx?: number;
  media?: string;

  // layout/position
  offsets?: [XY, XY, XY];
  stateOffsetsPx?: [XY, XY, XY];            // bakåtkomp
  scaleBase?: number;
  minScale?: number;
  maxScale?: number;

  // beteende
  segmentMs?: number;                       // morph-längd (ms)
  posMs?: number;                           // flytt-längd (ms)
  debug?: boolean;
  className?: string;
   moveMs?: number;    
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
  scaleBase = 1.9,
  minScale = 1.1,
  maxScale = 2.1,
  segmentMs = 650,     // LÅNG och mjuk morph
  posMs = 400,          // långsam förflyttning mellan slots
  debug = false,
  className = "",
}: Props) {
  // DOM / Lottie
  const hostRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const loadedRef = useRef(false);

  // frames
  const framesRef = useRef<[number, number, number]>([0, 0, 0]);

  // state
  const activeIdxRef = useRef(0);
  const thresholdsRef = useRef<{ t1: number; t2: number }>({ t1: 0, t2: 1 });
  const centersLaneRef = useRef<[XY, XY, XY]>([
    { x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 },
  ]);

  // tweens
  const moveTweenRef = useRef<gsap.core.Tween | null>(null);
  const morphTweenRef = useRef<gsap.core.Tween | null>(null);
  const chainRef = useRef<Promise<void>>(Promise.resolve());

  // observers
  const roRef = useRef<ResizeObserver | null>(null);

  const effOffsets: [XY, XY, XY] =
    (offsets ?? stateOffsetsPx ?? [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]) as [XY, XY, XY];

  const qs = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel) || undefined;
  const laneEl = () => qs<HTMLElement>(laneSelector);
  const log = (...a: any[]) => debug && console.log("[MorphLottie]", ...a);

  // ---------- Frames ----------
  function readMarkerFrames(anim: AnimationItem) {
    const md: any = (anim as any).animationData;
    const ip = Number(md?.ip ?? 0);
    const op = Number(md?.op ?? 1);
    const end = Math.max(ip + 1, op - 1);
    const markers = new Map<string, number>((md?.markers ?? []).map((m: any) => [String(m.cm), Number(m.tm)]));
    const [m0, m1, m2] = stateMarkers;
    const f0 = markers.get(m0) ?? ip;
    const f1 = markers.get(m1) ?? Math.round((ip + end) / 2);
    const f2 = markers.get(m2) ?? end;
    framesRef.current = [f0, f1, f2];
    log("frames:", framesRef.current);
  }

  // ---------- Geometry ----------
  function applyScale() {
    const host = hostRef.current, lane = laneEl();
    if (!host || !lane) return;
    const r = lane.getBoundingClientRect();
    const base = Math.max(1e-6, Math.min(r.width, r.height)); // stabil skala efter min(width,height)
    let s = (base / sizePx) * (scaleBase || 1);
    s = Math.max(minScale, Math.min(maxScale, s));
    gsap.set(host, { scale: s, transformOrigin: "0 0" });
  }

  function measureCentersInLane() {
    const lane = laneEl()!;
    const lr = lane.getBoundingClientRect();
    const c = slotSelectors.map((sel, i) => {
      const el = qs<HTMLElement>(sel)!;
      const r = el.getBoundingClientRect();
      return {
        x: (r.left - lr.left) + r.width / 2 + (effOffsets[i]?.x ?? 0),
        y: (r.top  - lr.top)  + r.height/ 2 + (effOffsets[i]?.y ?? 0),
      };
    }) as [XY, XY, XY];
    centersLaneRef.current = c;
  }

  function syncSlotHeights() {
    cardSelectors.forEach((sel, i) => {
      const card = qs<HTMLElement>(sel);
      const slot = qs<HTMLElement>(slotSelectors[i]);
      if (!card || !slot) return;
      const h = Math.max(200, Math.round(card.getBoundingClientRect().height));
      slot.style.height = `${h}px`;
    });
  }

  // mitt-trösklar (bestäms av kortens center i dokument-koordinater)
  function computeThresholds() {
    const getCenterAbs = (sel: string) => {
      const el = qs<HTMLElement>(sel)!;
      const r = el.getBoundingClientRect();
      return r.top + window.scrollY + r.height / 2;
    };
    const y0 = getCenterAbs(cardSelectors[0]);
    const y1 = getCenterAbs(cardSelectors[1]);
    const y2 = getCenterAbs(cardSelectors[2]);
    thresholdsRef.current = { t1: (y0 + y1) / 2, t2: (y1 + y2) / 2 };
    log("thresholds:", thresholdsRef.current);
  }

  // ---------- Helpers ----------
  function posToIndex(index: number, immediate = false) {
    const host = hostRef.current; if (!host) return;
    const c = centersLaneRef.current[index];
    const x = Math.round(c.x - sizePx / 2);
    const y = Math.round(c.y - sizePx / 2);

    moveTweenRef.current?.kill();
    if (immediate || posMs <= 0) {
      gsap.set(host, { x, y });
    } else {
      moveTweenRef.current = gsap.to(host, {
        x, y, duration: posMs / 1000, ease: "power2.inOut", overwrite: true,
      });
    }
  }

  function morphExact(fromIdx: number, toIdx: number): Promise<void> {
    return new Promise((resolve) => {
      const anim = animRef.current; if (!anim) return resolve();
      const [f0, f1, f2] = framesRef.current;
      const from = fromIdx === 0 ? f0 : fromIdx === 1 ? f1 : f2;
      const to   =  toIdx === 0 ? f0 :  toIdx === 1 ? f1 : f2;
      if (from === to) {
        try { anim.goToAndStop(to, true); } catch {}
        return resolve();
      }

      morphTweenRef.current?.kill();
      const proxy = { t: 0 };
      morphTweenRef.current = gsap.to(proxy, {
        t: 1,
        duration: (segmentMs || 1400) / 1000,
        ease: "none",
        onUpdate: () => {
          const f = Math.round(from + (to - from) * proxy.t);
          try { anim.goToAndStop(f, true); } catch {}
        },
        onComplete: () => {
          try { anim.goToAndStop(to, true); } catch {}
          resolve();
        },
      });
    });
  }

  function queueTransition(nextIdx: number, immediate = false) {
    chainRef.current = chainRef.current
      .then(async () => {
        const cur = activeIdxRef.current;
        if (cur === nextIdx) return;

        if (immediate) {
          // direktställ både pos + frame
          posToIndex(nextIdx, true);
          const [f0, f1, f2] = framesRef.current;
          try { animRef.current?.goToAndStop(nextIdx === 0 ? f0 : nextIdx === 1 ? f1 : f2, true); } catch {}
          activeIdxRef.current = nextIdx;
          return;
        }

        // 1) flytta till sloten
        await new Promise<void>((res) => {
          posToIndex(nextIdx, false);
          if (!moveTweenRef.current) return res();
          moveTweenRef.current.eventCallback("onComplete", () => res());
        });

        // 2) morpha exakt
        await morphExact(cur, nextIdx);

        activeIdxRef.current = nextIdx;
      })
      .catch(() => {});
  }

  // räkna fram vilket index som gäller för nuvarande scroll
  function currentIndexFromScroll(): number {
    const mid = window.scrollY + window.innerHeight / 2;
    const { t1, t2 } = thresholdsRef.current;
    if (mid < t1) return 0;
    if (mid < t2) return 1;
    return 2;
  }

  // ---------- Event wiring ----------
  const scrollRafRef = useRef(false);
  function onScrollRaf() {
    scrollRafRef.current = false;
    const idx = currentIndexFromScroll();
    if (idx !== activeIdxRef.current) {
      queueTransition(idx);
    }
  }
  function onScroll() {
    if (!scrollRafRef.current) {
      scrollRafRef.current = true;
      requestAnimationFrame(onScrollRaf);
    }
  }

  function remeasureAll() {
    syncSlotHeights();
    applyScale();
    measureCentersInLane();
    computeThresholds();
    // håll kvar exakt på nuvarande plats/frame
    const idx = activeIdxRef.current;
    const c = centersLaneRef.current[idx];
    gsap.set(hostRef.current, { x: Math.round(c.x - sizePx / 2), y: Math.round(c.y - sizePx / 2) });
  }

  // ---------- Lifecycle ----------
  function enable() {
    const host = hostRef.current, lane = laneEl();
    if (!host || !lane) return;

    Object.assign(host.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: `${sizePx}px`,
      height: `${sizePx}px`,
      pointerEvents: "none",
      zIndex: "3",
      willChange: "transform",
      transform: "translateZ(0)",
    });

    const anim = lottie.loadAnimation({
      container: host,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: jsonUrl,
      rendererSettings: {
        progressiveLoad: true,
        preserveAspectRatio: "xMinYMin meet",
        className: "lottie-svg",
      },
    });

    (anim as any).addEventListener("DOMLoaded", () => {
      loadedRef.current = true;
      readMarkerFrames(anim);
      remeasureAll();

      // initial index för aktuell scroll
      const initIdx = currentIndexFromScroll();
      activeIdxRef.current = initIdx;
      // ställ pos + frame exakt (ingen tween)
      const [f0, f1, f2] = framesRef.current;
      const c = centersLaneRef.current[initIdx];
      gsap.set(host, { x: Math.round(c.x - sizePx / 2), y: Math.round(c.y - sizePx / 2) });
      try { anim.goToAndStop(initIdx === 0 ? f0 : initIdx === 1 ? f1 : f2, true); } catch {}

      // observers
      if (!roRef.current) {
        const ro = new ResizeObserver(() => {
          requestAnimationFrame(() => {
            remeasureAll();
          });
        });
        cardSelectors.forEach((sel) => { const el = qs<HTMLElement>(sel); if (el) ro.observe(el); });
        roRef.current = ro;
      }

      // listeners
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", remeasureAll, { passive: true });
      window.addEventListener("orientationchange", remeasureAll, { passive: true });
    });

    animRef.current = anim;
  }

  function disable() {
    window.removeEventListener("scroll", onScroll as any);
    window.removeEventListener("resize", remeasureAll as any);
    window.removeEventListener("orientationchange", remeasureAll as any);

    roRef.current?.disconnect(); roRef.current = null;

    moveTweenRef.current?.kill(); moveTweenRef.current = null;
    morphTweenRef.current?.kill(); morphTweenRef.current = null;

    animRef.current?.destroy(); animRef.current = null;
    loadedRef.current = false;

    chainRef.current = Promise.resolve();
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(media);
    const handler = () => { mql.matches ? enable() : disable(); };
    handler();
    mql.addEventListener("change", handler);
    return () => { mql.removeEventListener("change", handler); disable(); };
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
