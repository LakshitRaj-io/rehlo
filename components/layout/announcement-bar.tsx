import { site } from "@/data/site";

export function AnnouncementBar() {
  const text = site.announcement;
  return (
    <div className="marquee overflow-hidden bg-ink text-warm">
      <p className="sr-only">{text}</p>
      <div className="marquee-track flex w-max py-1.5 [animation-duration:60s]" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="label flex items-center gap-6 px-6 !text-[0.75rem]">
            {text}
            <span className="inline-block size-1.5 rotate-45 bg-lime" />
          </span>
        ))}
      </div>
    </div>
  );
}
