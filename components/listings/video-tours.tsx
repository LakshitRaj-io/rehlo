import { Video } from "lucide-react";

/** Walkthrough videos for a listing. Loads only metadata until someone presses play. */
export function VideoTours({ videos, title }: { videos: string[]; title: string }) {
  if (!videos.length) return null;
  return (
    <section aria-labelledby="tours" className="mt-12">
      <h2 id="tours" className="display flex items-center gap-3 text-3xl md:text-4xl">
        <Video className="size-7 shrink-0 md:size-8" aria-hidden="true" />
        {videos.length === 1 ? "Video tour" : "Video tours"}
      </h2>
      <ul className={videos.length > 1 ? "mt-4 grid gap-4 md:grid-cols-2" : "mt-4"}>
        {videos.map((src, i) => (
          <li key={src} className="border-2 border-ink bg-ink shadow-[var(--shadow-hard)]">
            <video
              src={src}
              controls
              playsInline
              preload="metadata"
              className="aspect-video w-full bg-ink"
              aria-label={`${title}, video tour ${i + 1} of ${videos.length}`}
            >
              Your browser can&apos;t play this video. <a href={src}>Download it instead</a>.
            </video>
          </li>
        ))}
      </ul>
    </section>
  );
}
