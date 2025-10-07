export default function Footer() {
  return (
    <footer className="mt-16 border-t border-slate-200/50 dark:border-slate-700/50">
      <div className="mx-auto max-w-6xl px-4 py-6 text-sm opacity-80">
  {"\u00A9 "}{new Date().getFullYear()} Adrian — byggt med Astro, React & Tailwind.
</div>
    </footer>
  );
}
