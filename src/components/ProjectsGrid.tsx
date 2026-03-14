import { useRef } from "react";

export type Project = {
  slug: string;
  title: string;
  summary?: string;
  tags?: string[];
  image?: string;
  poster?: string;
  previewVideo?: string;
  repo?: string;
  demo?: string;
  date?: string | null;
};

type Props = { items: Project[] };

function joinBase(path: string) {
  const base = (import.meta.env.BASE_URL ?? "/") as string;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path.slice(1) : path;
  return `${b}/${p}`;
}

const MEDIA_H = "h-48 sm:h-52 md:h-56";

function CardMedia({
  poster,
  video,
  title,
}: {
  poster?: string;
  video?: string;
  title: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const handleEnter = async () => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
    } catch {}
  };

  const handleLeave = () => {
    if (!videoRef.current) return;
    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  };

  return (
    <div
      className={`group/media relative w-full overflow-hidden rounded-t-xl bg-slate-50 dark:bg-slate-900 ${MEDIA_H}`}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      {poster && (
        <img
          src={poster}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover/media:scale-[1.02] group-hover/media:opacity-0"
          loading="lazy"
          decoding="async"
        />
      )}

      {video && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-300 group-hover/media:opacity-100"
          src={video}
          muted
          loop
          playsInline
          preload="metadata"
        />
      )}

      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

      {video && (
        <div className="absolute right-3 top-3 rounded-full border border-white/30 bg-black/40 px-2 py-1 text-xs text-white backdrop-blur">
          Preview
        </div>
      )}
    </div>
  );
}

export default function ProjectsGrid({ items }: Props) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <a
          key={p.slug}
          href={joinBase(`projects/${p.slug}/`)}
          className="group block overflow-hidden rounded-xl border transition duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <CardMedia
            poster={p.poster ?? p.image}
            video={p.previewVideo}
            title={p.title}
          />

          <div className="p-4">
            <h3 className="font-semibold">{p.title}</h3>
              <p className="text-xs opacity-60">{p.slug}</p>

            {p.summary && (
              <p className="mt-1 text-sm opacity-80">{p.summary}</p>
              
            )}

            {p.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {p.tags.map((t) => (
                  <span key={t} className="rounded border px-2 py-0.5">
                    {t}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </a>
      ))}
    </div>
  );
}