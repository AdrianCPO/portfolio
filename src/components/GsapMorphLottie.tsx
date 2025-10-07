import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type Props = {
  /** Lottie JSON-URL (måste innehålla markers som matchar stateMarkers) */
  jsonUrl: string;

  /** Marker-namn i den ordning vi vill stanna (t.ex. ["human1","heart1","dev"]) */
  stateMarkers: string[];

  /** Selektorer för varje “stopp” i samma ordning som stateMarkers */
  cardSelectors: string[];

  /** Storlek på ikonen (px) – kvadrat */
  sizePx?: number; // default 220

  /** Horisontellt avstånd från stoppets kant till ikonens center (px).
      Antingen ett tal (gäller alla) eller en array per stopp. */
  gapX?: number | number[]; // default 32

  /** Vertikal ankarpunkt i stoppet (0=top, 0.5=mitt, 1=botten) */
  yAnchor?: number; // default 0.5

  /** Per-stopp finjustering i Y-led (px), t.ex. [ -8, 0, +6 ] */
  perStopYOffsetPx?: number[];

  /** Hur snabbt ikonen flyttar sig mellan stoppen (sek) */
  moveDuration?: number; // default 0.7

  /** Easing för flytten */
  moveEase?: string; // default "power2.out"

  /** Morph-tid per steg (ms) – vi spelar marker→marker med denna tidskänsla */
  segmentDurationMs?: number; // default 900

  /** Debug-loggar i konsolen */
  debug?: boolean;

  /** Extra wrapper-klasser (t.ex. färg via text-current) */
  className?: string;
};

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

export default function GsapMorphLottie({
  jsonUrl,
  stateMarkers,
  cardSelectors,
  sizePx = 220,
  gapX = 32,
  yAnchor = 0.5,
  perStopYOffsetPx = [],
  moveDuration = 0.7,
  moveEase = "power2.out",
  segmentDurationMs = 900,
  debug = false,
  className = "",
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null); // overlay-ikon (position: fixed)
  const animRef = useRef<AnimationItem | null>(null); // Lottie instance
  const markerFramesRef = useRef<number[]>([]); // frames per marker
  const currIdxRef = useRef<number>(0); // nuvarande state-index
  const completeHandlerRef = useRef<((...a: any[]) => void) | null>(null);
  const playingRef = useRef(false);

  // === Hjälpare: hämta stoppens "ankarpunkter" (x,y) ===
  function computeTargets(): Array<{ x: number; y: number; side: "left" | "right" }> {
    const vw = window.innerWidth;
    const cx = vw / 2;
    const out: Array<{ x: number; y: number; side: "left" | "right" }> = [];

    const gaps = Array.isArray(gapX) ? gapX : cardSelectors.map(() => gapX);

    cardSelectors.forEach((sel, i) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) {
        out.push({ x: cx, y: window.innerHeight / 2, side: "left" });
        return;
      }

      const r = el.getBoundingClientRect();
      const midX = r.left + r.width / 2;
      const midY = r.top + r.height * clamp01(yAnchor);
      const side = midX < cx ? "leftCol" : "rightCol";

      const gx = typeof gaps[i] === "number" ? (gaps[i] as number) : 32;
      const perY = perStopYOffsetPx[i] ?? 0;

      // Ikonens center placeras en bit utanför stoppets kant
      const x = side === "leftCol" ? r.right + gx : r.left - gx;
      const y = midY + perY;

      out.push({ x, y, side: side === "leftCol" ? "right" : "left" });
    });

    return out;
  }

  // === Hitta stoppet närmast viewportens mitt (för bättre init) ===
  function getClosestStopIndex() {
    const targets = computeTargets();
    const vy = window.innerHeight * 0.5; // viewport-mitt
    let best = 0;
    let bestDist = Number.POSITIVE_INFINITY;
    targets.forEach((t, i) => {
      const d = Math.abs(t.y - vy);
      if (d < bestDist) {
        best = i;
        bestDist = d;
      }
    });
    return best;
  }

  // === Spela marker→marker (utan AE-positioner) ===
  function playBetweenMarkers(fromIndex: number, toIndex: number) {
    const anim = animRef.current;
    const frames = markerFramesRef.current;
    if (!anim || frames.length < 2) return;

    const start = frames[fromIndex];
    const end = frames[toIndex];
    if (typeof start !== "number" || typeof end !== "number") return;

    const fr = (anim as any).frameRate ?? (anim as any).animationData?.fr ?? 60;
    const dist = Math.abs(end - start);
    const naturalMs = (dist / fr) * 1000;
    const speed = naturalMs > 0 ? naturalMs / (segmentDurationMs || 900) : 1;

    // Rensa ev. tidigare complete-handler
    if (completeHandlerRef.current) {
      anim.removeEventListener("complete", completeHandlerRef.current as any);
      completeHandlerRef.current = null;
    }

    playingRef.current = true;

    const handleComplete = () => {
     currIdxRef.current = toIndex;
        playingRef.current = false;
        anim.removeEventListener("complete", handleComplete as any);
        completeHandlerRef.current = null;
     if (debug) console.log("[Lottie] Reached state", toIndex);
};  

    completeHandlerRef.current = handleComplete;

    anim.setSpeed(speed);
    anim.setDirection(end >= start ? 1 : -1);
    anim.addEventListener("complete", handleComplete as any);
    anim.playSegments([start, end], true);

    if (debug) console.log("[Lottie] Play", fromIndex, "→", toIndex, "(frames:", start, "→", end, ", speed:", speed, ")");
  }

  // === Ladda Lottie & markers ===
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (animRef.current) {
      animRef.current.destroy();
      animRef.current = null;
    }

    const anim = lottie.loadAnimation({
      container: host, // vi ritar direkt i overlayn
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
      // Läs Bodymovin-markers
      const md: any = (anim as any).animationData;
      const allMarkers: Array<{ tm: number; cm: string }> = md?.markers ?? [];
      const byName = new Map(allMarkers.map((m) => [m.cm, m.tm]));

      const frames = stateMarkers.map((name) => {
        const f = byName.get(name);
        if (typeof f !== "number") {
          console.warn(`[GsapMorphLottie] Marker saknas: "${name}"`);
          return 0;
        }
        return f;
      });
      markerFramesRef.current = frames;

      // ✅ NYTT: initiera på närmaste stopp i nuvarande vy
      const initial = getClosestStopIndex();
      currIdxRef.current = initial;
      const f0 = frames[initial] ?? 0;
      try {
        anim.goToAndStop(f0, true);
      } catch {}

      if (debug) {
        console.log("[Lottie] markers:", stateMarkers, "frames:", frames, "init index:", initial, "frame:", f0);
      }
    };

    anim.addEventListener("DOMLoaded", onDomLoaded);
    animRef.current = anim;

    return () => {
      anim.removeEventListener("DOMLoaded", onDomLoaded);
      anim.destroy();
      animRef.current = null;
    };
  }, [jsonUrl, stateMarkers.join("|"), debug]);

  // === Flytta ikonen mellan stoppen med ScrollTrigger (triggers = stoppen) ===
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // Init overlay-storlek & pointer-events
    gsap.set(host, {
      position: "fixed",
      left: 0,
      top: 0,
      width: sizePx,
      height: sizePx,
      x: 0,
      y: 0,
      pointerEvents: "none",
    });

    const moveTo = (i: number, immediate = false) => {
      const targets = computeTargets();
      const t = targets[i] ?? targets[targets.length - 1];
      if (!t) return;
      const x = Math.round(t.x - sizePx / 2);
      const y = Math.round(t.y - sizePx / 2);
      gsap.to(host, {
        x,
        y,
        duration: immediate ? 0 : moveDuration,
        ease: moveEase,
        overwrite: true,
      });
    };

    // ✅ NYTT: placera overlay vid närmaste stopp direkt
    const initIdx = getClosestStopIndex();
    moveTo(initIdx, true);

    // Skapa triggers per stopp – onEnter (scroll ned) / onEnterBack (scroll upp)
    const triggers: ScrollTrigger[] = [];

    cardSelectors.forEach((sel, i) => {
      const el = document.querySelector<HTMLElement>(sel);
      if (!el) return;

      const st = ScrollTrigger.create({
        trigger: el,
        start: "top center+=10%",
        end: "bottom center-=10%",
        onEnter: () => {
          moveTo(i);
          const from = currIdxRef.current;
          if (from !== i) playBetweenMarkers(from, i);
        },
        onEnterBack: () => {
          moveTo(i);
          const from = currIdxRef.current;
          if (from !== i) playBetweenMarkers(from, i);
        },
      });
      triggers.push(st);
    });

    // Uppdatera positioner på resize/refresh
    const onRefresh = () => {
      ScrollTrigger.refresh();
      const closest = getClosestStopIndex();
      currIdxRef.current = closest;
      moveTo(closest, true);
    };
    window.addEventListener("resize", onRefresh, { passive: true });

    // Vänta in sena bilder/layouter
    const t = setTimeout(onRefresh, 300);

    // ✅ NYTT: nudge även när hela sidan är klar
    const onLoad = () => {
      const closest = getClosestStopIndex();
      currIdxRef.current = closest;
      moveTo(closest, true);
    };
    window.addEventListener("load", onLoad, { once: true });

    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", onRefresh as any);
      window.removeEventListener("load", onLoad as any);
      triggers.forEach((tr) => tr.kill());
    };
  }, [
    cardSelectors.join("|"),
    sizePx,
    moveDuration,
    moveEase,
    gapX,
    yAnchor,
    perStopYOffsetPx.join("|"),
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
