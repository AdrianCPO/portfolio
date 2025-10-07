import { useEffect, useState } from "react";
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
    <header className="sticky top-0 z-50 backdrop-blur border-b border-slate-200/50 dark:border-slate-700/50">
      <nav className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
        <a href={joinBase("./")} className="font-semibold">Adrian</a>
        <div className="flex items-center gap-3">
          {link("projects/", "Projekt")}
          {link("cpo/", "CPO")} {/* ← NY */}
          {link("contact/", "Kontakt")}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}