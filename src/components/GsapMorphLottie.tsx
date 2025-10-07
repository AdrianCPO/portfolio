import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type XY = { x: number; y: number };
type StateIdx = 0 | 1 | 2; // 🔹 smal typ

type Props = {
  jsonUrl: string;
  stateMarkers: [string, string, string];        // ["human","heart","dev"]
  cardSelectors: [string, string, string];       // vänster: skills, heart, projects
  slotSelectors: [string, string, string];       // höger: human-slot, heart-slot, dev-slot
  laneSelector: string;                          // sticky container i högerkolumn
  sizePx?: number;
  scale?: number;
  segmentDurationMs?: number;
  moveDuration?: number;
  moveEase?: string;
  stateOffsetsPx?: [XY, XY, XY];
  initialIndex?: StateIdx;                       // 🔹 smal typ här också
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
  scale = 1.4,
  segmentDurationMs = 900,
  moveDuration = 0.6,
  moveEase = "power2.out",
  stateOffsetsPx = [{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }],
  initialIndex = 0,
  debug = false,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const framesRef = useRef<number[]>([]);
  const currIdxRef = useRef<StateIdx>(0);
  const isPlayingRef = useRef(false);
  const pendingIdxRef = useRef<StateIdx | null>(null);

  const toIdx = (n: number): StateIdx => (n <= 0 ? 0 : n >= 2 ? 2 : 1);

  function syncSlotHeights() {
    cardSelectors.forEach((sel, i) => {
      const left = document.querySelector<HTMLElement>(sel);
      const slot = document.querySelector<HTMLElement>(slotSelectors[i]);
      if (!left || !slot) return;
      const h = left.getBoundingClientRect().height;
      slot.style.height = `${Math.max(160, Math.round(h))}px`;
    });
  }

  function getLaneRect() {
    const lane = document.querySelector<HTMLElement>(laneSelector);
    return lane?.getBoundingClientRect();
  }

  function getSlotCentersInLane(): [XY, XY, XY] {
    const lane = document.querySelector<HTMLElement>(laneSelector)!;
    const lr = lane.getBoundingClientRect();
    return slotSelectors.map((sel) => {
      const el = document.querySelector<HTMLElement>(sel)!;
      const r = el.getBoundingClientRect();
      return { x: (r.left - lr.left) + r.width / 2, y: (r.top - lr.top) + r.height / 2 };
    }) as [XY, XY, XY];
  }

  function moveToSlot(index: StateIdx, immediate = false) {
    const host = hostRef.current;
    if (!host) return;
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

  function morphTo(index: StateIdx) {
    const anim = animRef.current;
    const frames = framesRef.current;
    if (!anim) return;

    if (isPlayingRef.current) { pendingIdxRef.current = index; return; }
    const from = currIdxRef.current;
    if (from === index) return;

    const start = frames[from] ?? 0;
    const end = frames[index] ?? 0;
    const fr = (anim as any).frameRate ?? (anim as any).animationData?.fr ?? 60;
    const dist = Math.abs(end - start);
    const speed = dist > 0 ? (dist / fr) * 1000 / (segmentDurationMs || 900) : 1;

    const onDone = () => {
      anim.removeEventListener("complete", onDone as any);
      currIdxRef.current = index;
      isPlayingRef.current = false;
      if (pendingIdxRef.current !== null && pendingIdxRef.current !== currIdxRef.current) {
        const next = pendingIdxRef.current as StateIdx;
        pendingIdxRef.current = null;
        moveToSlot(next, false);
        morphTo(next);
      }
    };

    isPlayingRef.current = true;
    anim.setDirection(end >= start ? 1 : -1);
    anim.setSpeed(speed);
    anim.addEventListener("complete", onDone as any);
    anim.playSegments([start, end], true);
    if (debug) console.log(`[morph] ${from} → ${index} (speed=${speed.toFixed(2)})`);
  }

  function computeActiveIndex(): StateIdx {
    const rects = cardSelectors.map((sel) => document.querySelector<HTMLElement>(sel)!.getBoundingClientRect());
    const centers = rects.map(r => r.top + r.height / 2);
    const mid01 = (centers[0] + centers[1]) / 2;
    const mid12 = (centers[1] + centers[2]) / 2;
    const vy = window.innerHeight / 2;
    return vy < mid01 ? 0 : vy < mid12 ? 1 : 2;
  }

  // Ladda Lottie & init
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
      // 🔹 Typa kartan korrekt
      const byName: Map<string, number> = new Map<string, number>(
        (md?.markers ?? []).map((m: any) => [m.cm as string, Number(m.tm)])
      );
      framesRef.current = stateMarkers.map((n) => byName.get(n) ?? 0);

      host.style.position = "absolute";
      host.style.left = "0";
      host.style.top = "0";
      host.style.width = `${sizePx}px`;
      host.style.height = `${sizePx}px`;
      host.style.transformOrigin = "top left";
      host.style.pointerEvents = "none";
      host.style.zIndex = "3";
      host.style.transform = `translate(0px,0px) scale(${scale})`;

      syncSlotHeights();

      const nearTop = window.scrollY < 150;
      let init: StateIdx = initialIndex; // 🔹 strikt typ
      if (!nearTop) {
        const lr = getLaneRect()!;
        const centers = getSlotCentersInLane();
        const laneMidY = lr.height / 2;
        let best = Infinity;
        let bestIdx = 0;
        centers.forEach((c, i) => {
          const d = Math.abs(c.y - laneMidY);
          if (d < best) { best = d; bestIdx = i; }
        });
        init = toIdx(bestIdx);
      }

      try { anim.goToAndStop(framesRef.current[init] ?? 0, true); } catch {}
      currIdxRef.current = init;
      moveToSlot(init, true);
      if (debug) console.log("[init] start index:", init, "nearTop:", nearTop);
    };

    anim.addEventListener("DOMLoaded", onDomLoaded);
    animRef.current = anim;

    return () => {
      anim.removeEventListener("DOMLoaded", onDomLoaded);
      anim.destroy();
      animRef.current = null;
    };
  }, [jsonUrl, stateMarkers.join("|"), sizePx, scale, initialIndex]);

  // En trigger som uppdaterar aktiv sektion
  useEffect(() => {
    const first = document.querySelector<HTMLElement>(cardSelectors[0]);
    const last  = document.querySelector<HTMLElement>(cardSelectors[2]);
    if (!first || !last) return;

    const t = ScrollTrigger.create({
      trigger: first,
      start: "top top+=100",
      endTrigger: last,
      end: "bottom bottom-=100",
      onUpdate: () => {
        const idx = computeActiveIndex();
        if (idx !== currIdxRef.current) {
          moveToSlot(idx, false);
          morphTo(idx);
        }
      },
    });

    const refresh = () => {
      syncSlotHeights();
      moveToSlot(currIdxRef.current, true);
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("load", refresh, { once: true });

    return () => {
      window.removeEventListener("resize", refresh as any);
      t.kill();
    };
  }, [cardSelectors.join("|"), slotSelectors.join("|"), laneSelector, sizePx, moveDuration, moveEase]);

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
