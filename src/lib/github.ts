export type GitHubRepo = {
name: string;
html_url: string;
description?: string | null;
language?: string | null;
stargazers_count: number;
forks_count: number;
homepage?: string | null;
pushed_at: string; // ISO date
archived: boolean;
fork: boolean;
owner: { login: string };
};


export type GetUserReposOptions = {
username: string;
include?: string[]; // visa endast dessa repo-namn
exclude?: string[]; // exkludera repo-namn
hideForks?: boolean; // default: true
includeArchived?: boolean; // default: false
token?: string; // valfritt: GITHUB_TOKEN för högre rate limit
};


const API_VERSION = "2022-11-28";
const UA = "astro-portfolio-adriancpo";


async function fetchJson<T>(url: string, token?: string): Promise<T> {
const res = await fetch(url, {
headers: {
"User-Agent": UA,
Accept: "application/vnd.github+json",
"X-GitHub-Api-Version": API_VERSION,
...(token ? { Authorization: `Bearer ${token}` } : {}),
},
});
if (!res.ok) {
const text = await res.text().catch(() => "");
throw new Error(`GitHub ${res.status} ${res.statusText}: ${text.slice(0, 140)}`);
}
return (await res.json()) as T;
}


export async function getUserRepos(opts: GetUserReposOptions): Promise<GitHubRepo[]> {
const { username, include, exclude, hideForks = true, includeArchived = false, token } = opts;
const url = `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`;
const data = await fetchJson<GitHubRepo[]>(url, token);


let list = Array.isArray(data) ? data : [];


if (hideForks) list = list.filter((r) => !r.fork);
if (!includeArchived) list = list.filter((r) => !r.archived);


if (include?.length) {
const set = new Set(include.map((s) => s.toLowerCase()));
list = list.filter((r) => set.has(r.name.toLowerCase()));
}
if (exclude?.length) {
const set = new Set(exclude.map((s) => s.toLowerCase()));
list = list.filter((r) => !set.has(r.name.toLowerCase()));
}


list.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
return list;
}