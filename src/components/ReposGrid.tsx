export type RepoCard = {
name: string;
html_url: string;
description?: string | null;
language?: string | null;
stargazers_count: number;
forks_count: number;
homepage?: string | null;
pushed_at: string; // ISO
};


type Props = { items: RepoCard[] };


export default function ReposGrid({ items }: Props) {
return (
<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
{items.map((r) => (
<article key={r.html_url} className="block overflow-hidden rounded-xl border transition hover:shadow-md bg-white dark:bg-slate-900">
<div className="p-4">
<header className="flex items-start justify-between gap-3">
<h3 className="font-semibold text-base sm:text-lg">
<a href={r.html_url} target="_blank" rel="noopener" className="hover:underline">{r.name}</a>
</h3>
<div className="flex items-center gap-3 text-xs sm:text-sm opacity-80">
<span title="Stars">★ {r.stargazers_count}</span>
<span title="Forks">⎘ {r.forks_count}</span>
</div>
</header>
{r.description && (
<p className="text-sm opacity-80 mt-1 line-clamp-3">{r.description}</p>
)}
<dl className="mt-3 grid grid-cols-2 gap-2 text-xs opacity-75">
{r.language && <div className="rounded border px-2 py-0.5">Språk: {r.language}</div>}
<div className="rounded border px-2 py-0.5">Uppdaterad: {new Date(r.pushed_at).toLocaleDateString()}</div>
</dl>
<footer className="mt-4 flex flex-wrap gap-3 text-sm">
<a className="underline" href={r.html_url} target="_blank" rel="noopener">GitHub</a>
{r.homepage && (
<a className="underline" href={r.homepage} target="_blank" rel="noopener">Demo</a>
)}
</footer>
</div>
</article>
))}
</div>
);
}