import { useEffect, useRef, useState } from "react";
import ThemeToggle from "./ThemeToggle";

// Säker join av BASE_URL + path
function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

function useActivePath() {
  const [path, setPath] = useState<string>("/");
  useEffect(() => {
    const base = (import.meta.env.BASE_URL ?? "/") as string;
    const b = base.endsWith("/") ? base : `${base}/`;
    // Ex: /portfolio/projects/ -> /projects/
    setPath(window.location.pathname.replace(b, "/"));
  }, []);
  return path;
}

export default function Nav() {
  const path = useActivePath();
  const barRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [atTop, setAtTop] = useState(true);
  const [height, setHeight] = useState(64);

  // Mäta höjden och hålla spacer i sync
  useEffect(() => {
    const el = barRef.current!;
    const measure = () => setHeight(el?.getBoundingClientRect().height ?? 64);
    measure();
    const ro = new ResizeObserver(measure);
    if (el) ro.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Headroom: göm på nedåt, visa på uppåt
  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;
    const threshold = 6; // px innan vi reagerar (minskar jitter)

    const onScroll = () => {
      const y = window.scrollY;
      setAtTop(y <= 0);

      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const dy = y - lastY;
        if (dy > threshold && y > height + 10) {
          // rullar NED → göm
          setVisible(false);
        } else if (dy < -threshold) {
          // rullar UPP → visa
          setVisible(true);
        }
        lastY = y;
        ticking = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [height]);

  const link = (href: string, label: string) => {
    const active = path.startsWith(href.startsWith("/") ? href : `/${href}`);
    return (
      <a
        href={joinBase(href)}
        className={
          "px-2 py-1 rounded hover:underline " +
          (active ? "font-semibold underline" : "")
        }
      >
        {label}
      </a>
    );
  };

  return (
    <>
      {/* FIXED bar som kan skjutas ut/inn med translateY */}
      <div
        ref={barRef}
        className={[
          "fixed inset-x-0 top-0 z-50 transition-transform duration-200 will-change-transform",
          visible ? "translate-y-0" : "-translate-y-full",
        ].join(" ")}
      >
        <div
          className={[
            "mx-auto max-w-6xl px-4",
            atTop
              ? "bg-transparent"
              : "backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-b border-black/5 dark:border-white/10",
          ].join(" ")}
        >
          <nav className="py-3 flex items-center justify-between">
            <a href={joinBase("./")} className="font-semibold">
              Adrian
            </a>
            <div className="flex items-center gap-3">
              {link("projects/", "Projekt")}
              {link("cpo/", "CPO")}
              {link("contact/", "Kontakt")}
              <ThemeToggle />
            </div>
          </nav>
        </div>
      </div>

      {/* Spacer så innehållet inte hamnar bakom fixed nav */}
      <div style={{ height }} aria-hidden="true" />
    </>
  );
}
