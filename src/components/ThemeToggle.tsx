import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState<boolean | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const initial = (saved ?? system) === "dark";
    setIsDark(initial);
  }, []);

  useEffect(() => {
    if (isDark === null) return;
    document.documentElement.classList.toggle("dark", isDark);
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
