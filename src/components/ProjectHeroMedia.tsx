import { useRef } from "react";

type Props = {
  title: string;
  poster?: string;
  video?: string;
};

export default function ProjectHeroMedia({ title, poster, video }: Props) {
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
      className="group overflow-hidden rounded-2xl border bg-slate-50 p-4 dark:bg-slate-900 min-h-[420px] flex items-center justify-center"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div className="relative w-full flex items-center justify-center">
        {poster && (
          <img
            src={poster}
            alt={title}
            className="absolute inset-0 m-auto max-h-[380px] w-full rounded-xl object-contain transition duration-300 group-hover:opacity-0"
          />
        )}

        {video && (
          <video
            ref={videoRef}
            className="max-h-[380px] w-full rounded-xl object-contain opacity-0 transition duration-300 group-hover:opacity-100"
            src={video}
            muted
            loop
            playsInline
            preload="metadata"
          />
        )}

        {!video && poster && (
          <img
            src={poster}
            alt={title}
            className="max-h-[380px] w-full rounded-xl object-contain"
          />
        )}
      </div>
    </div>
  );
}