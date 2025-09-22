import { useEffect, useState } from "react";
import ThemeToggle from "./ThemeToggle";

function useActivePath() {
  const [path, setPath] = useState<string>("/");
  useEffect(() => {
    setPath(window.location.pathname.replace(import.meta.env.BASE_URL, "/"));
  }, []);
  return path;
}

export default function Nav() {
  const path = useActivePath();
  const link = (href: string, label: string) => {
    const active = path.startsWith(href);
    return (
      <a
        href={href}
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
        <a href="./" className="font-semibold">Adrian</a>
        <div className="flex items-center gap-3">
          {link("./projects/", "Projekt")}
          {link("./contact/", "Kontakt")}
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
