import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    const saved = localStorage.getItem("theme");
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initial = saved ? saved === "dark" : root.classList.contains("dark") || systemDark;
    root.classList.toggle("dark", initial);
    setIsDark(initial);
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    const root = document.documentElement;
    root.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (isDark === null) return null;

  return (
    <button
      type="button"
      onClick={() => setIsDark(v => !v)}
      className="rounded px-3 py-1 border text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
      aria-label="Växla mörkt läge"
      title="Växla mörkt läge"
    >
      {isDark ? "☀️ Ljust" : "🌙 Mörkt"}
    </button>
  );
}
