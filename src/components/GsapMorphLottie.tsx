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
  stateMarkers: [string, string, string];        // ["human","heart","dev"]
  cardSelectors: [string, string, string];       // vänster: skills, heart, projects
  slotSelectors: [string, string, string];       // höger: human-slot, heart-slot, dev-slot
  laneSelector: string;                          // sticky container i högerkolumn
  sizePx?: number;                               // Lottie viewbox-storlek (din AE=1080)
  scale?: number;                                // visuell skala utan att påverka koordinater
  segmentDurationMs?: number;
  moveDuration?: number;
  moveEase?: string;
  stateOffsetsPx?: [XY, XY, XY];                 // kompensation per state
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
  scale = 1,
  segmentDurationMs = 900,
  moveDuration = 0.6,
  moveEase = "power2.out",
  stateOffsetsPx = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  debug = false,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const framesRef = useRef<number[]>([]);
  const currIdxRef = useRef<number>(0);

  /* === 1) Mät vänstersektioner och kopiera höjden till slotarna === */
  function syncSlotHeights() {
    cardSelectors.forEach((sel, i) => {
      const left = document.querySelector<HTMLElement>(sel);
      const slot = document.querySelector<HTMLElement>(slotSelectors[i]);
      if (!left || !slot) return;
      const h = left.getBoundingClientRect().height;
      slot.style.height = `${Math.max(160, Math.round(h))}px`;
    });
  }

  /* === 2) Hämta slot-centers i lane-koordinater (inte viewport) === */
  function getSlotCentersInLane(): [XY, XY, XY] {
    const lane = document.querySelector<HTMLElement>(laneSelector);
    if (!lane) return [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }] as any;
    const lr = lane.getBoundingClientRect();

    const centers = slotSelectors.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return { x: lr.width / 2, y: lr.height / 2 };
      const r = el.getBoundingClientRect();
      // koordinater RELATIVT lane:
      return {
        x: (r.left - lr.left) + r.width / 2,
        y: (r.top - lr.top) + r.height / 2,
      };
    }) as [XY, XY, XY];

    return centers;
  }

  /* === 3) Flytt till viss slot (absolut i lane) === */
  function moveToSlot(index: number, immediate = false) {
    const host = hostRef.current;
    const lane = document.querySelector<HTMLElement>(laneSelector);
    if (!host || !lane) return;
    const centers = getSlotCentersInLane();
    const c = centers[index] ?? centers[centers.length - 1];
    const off = stateOffsetsPx[index] ?? { x: 0, y: 0 };

    gsap.to(host, {
      x: Math.round(c.x - sizePx / 2 + off.x),
      y: Math.round(c.y - sizePx / 2 + off.y),
      duration: immediate ? 0 : moveDuration,
      ease: moveEase,
      overwrite: true,
    });
  }

  /* === 4) Spela mellan markers === */
  function playTo(index: number) {
    const anim = animRef.current;
    const frames = framesRef.current;
    if (!anim) return;
    const from = currIdxRef.current;
    if (from === index) return;

    const start = frames[from] ?? 0;
    const end = frames[index] ?? 0;
    const fr = (anim as any).frameRate ?? (anim as any).animationData?.fr ?? 60;
    const dist = Math.abs(end - start);
    const naturalMs = (dist / fr) * 1000;
    const speed = naturalMs > 0 ? naturalMs / (segmentDurationMs || 900) : 1;

    const onDone = () => {
      currIdxRef.current = index;
      anim.removeEventListener("complete", onDone as any);
      if (debug) console.log("[Lottie] state =", index);
    };

    anim.removeEventListener("complete", onDone as any);
    anim.setDirection(end >= start ? 1 : -1);
    anim.setSpeed(speed);
    anim.addEventListener("complete", onDone as any);
    anim.playSegments([start, end], true);
  }

  /* === 5) Ladda Lottie och init i närmaste slot (i lane-koordinater) === */
  useEffect(() => {
    const host = hostRef.current;
    const lane = document.querySelector<HTMLElement>(laneSelector);
    if (!host || !lane) return;

    if (animRef.current) animRef.current.destroy();

    const anim = lottie.loadAnimation({
      container: host,
      renderer: "svg",
      loop: false,
      autoplay: false,
      path: jsonUrl,
      rendererSettings: {
        progressiveLoad: true,
        preserveAspectRatio: "xMidYMid meet",
        className: "lottie-svg",
      },
    });

    const onDomLoaded = () => {
      const md: any = (anim as any).animationData;
      const byName = new Map((md?.markers ?? []).map((m: any) => [m.cm, m.tm]));
      framesRef.current = stateMarkers.map((n) => byName.get(n) ?? 0);

      // host är absolut i lane
      host.style.position = "absolute";
      host.style.left = "0";
      host.style.top = "0";
      host.style.width = `${sizePx}px`;
      host.style.height = `${sizePx}px`;
      host.style.transformOrigin = "top left";

      // visuell skala
      host.style.transform = `translate(0px,0px) scale(${scale})`;

      syncSlotHeights();

      // init: välj den slot vars center ligger närmast lane-mitten
      const centers = getSlotCentersInLane();
      const laneRect = lane.getBoundingClientRect();
      const laneMidY = laneRect.height / 2;
      let init = 0;
      let best = Infinity;
      centers.forEach((c, i) => {
        const d = Math.abs(c.y - laneMidY);
        if (d < best) { best = d; init = i; }
      });

      try { anim.goToAndStop(framesRef.current[init] ?? 0, true); } catch {}
      currIdxRef.current = init;
      moveToSlot(init, true);
    };

    anim.addEventListener("DOMLoaded", onDomLoaded);
    animRef.current = anim;

    return () => {
      anim.removeEventListener("DOMLoaded", onDomLoaded);
      anim.destroy();
      animRef.current = null;
    };
  }, [jsonUrl, stateMarkers.join("|"), sizePx, scale]);

  /* === 6) ScrollTriggers – “trösklar” som hos Konovalenko === */
  useEffect(() => {
    const triggers: ScrollTrigger[] = [];

    const createRange = (sel: string, onEnter: () => void, onEnterBack: () => void, onLeave?: (dir: 1 | -1) => void) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return;
      const st = ScrollTrigger.create({
        trigger: el,
        start: "top center+=10%",     // tröskel in
        end:   "bottom center-=10%",  // tröskel ut
        onEnter: () => onEnter(),
        onEnterBack: () => onEnterBack(),
        onLeave: (self) => onLeave?.(self.direction as 1 | -1),
      });
      triggers.push(st);
    };

    // 0) Skills ⇒ Human
    createRange(
      cardSelectors[0],
      () => { moveToSlot(0); playTo(0); },
      () => { moveToSlot(0); playTo(0); }
    );

    // 1) Heart ⇒ Heart när inne; lämnar upp/ned ⇒ Human/Dev
    createRange(
      cardSelectors[1],
      () => { moveToSlot(1); playTo(1); },
      () => { moveToSlot(1); playTo(1); },
      (dir) => {
        if (dir === 1) { moveToSlot(2); playTo(2); }   // lämnar nedåt ⇒ Dev
        else           { moveToSlot(0); playTo(0); }   // lämnar uppåt ⇒ Human
      }
    );

    // 2) Projects ⇒ Dev
    createRange(
      cardSelectors[2],
      () => { moveToSlot(2); playTo(2); },
      () => { moveToSlot(2); playTo(2); }
    );

    const refresh = () => {
      syncSlotHeights();
      moveToSlot(currIdxRef.current, true);
      ScrollTrigger.refresh();
    };

    window.addEventListener("resize", refresh, { passive: true });
    const t = setTimeout(refresh, 250);
    window.addEventListener("load", refresh, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", refresh as any);
      triggers.forEach((tr) => tr.kill());
    };
  }, [
    cardSelectors.join("|"),
    slotSelectors.join("|"),
    laneSelector,
    sizePx,
    moveDuration,
    moveEase,
    stateOffsetsPx.map(o => `${o.x},${o.y}`).join("|"),
  ]);

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
