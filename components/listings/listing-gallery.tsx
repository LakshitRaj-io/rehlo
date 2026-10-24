"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { SafeImage } from "@/components/ui/safe-image";
import { cn } from "@/lib/utils";

export function ListingGallery({ images, title }: { images: string[]; title: string }) {
  const list = images.length ? images : [""];
  const [index, setIndex] = useState(0);
  const go = (d: number) => setIndex((i) => (i + d + list.length) % list.length);

  return (
    <div className="flex flex-col gap-3">
      <div
        className="group relative aspect-[4/3] overflow-hidden border-2 border-ink bg-paper-deep shadow-[var(--shadow-hard)] md:aspect-[16/10]"
        role="region"
        aria-roledescription="carousel"
        aria-label={`Photos of ${title}`}
        data-cursor={list.length > 1 ? "drag" : undefined}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") go(-1);
          if (e.key === "ArrowRight") go(1);
        }}
      >
        {list.map((src, i) => (
          <SafeImage
            key={`${src}-${i}`}
            src={src}
            alt={`${title}, photo ${i + 1} of ${list.length}`}
            priority={i === 0}
            aria-hidden={i !== index}
            className={cn("absolute inset-0 size-full transition-opacity duration-300", i === index ? "opacity-100" : "opacity-0")}
          />
        ))}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center border-2 border-ink bg-warm transition-transform hover:-translate-x-0.5"
              aria-label="Previous photo"
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 grid size-11 -translate-y-1/2 place-items-center border-2 border-ink bg-warm transition-transform hover:translate-x-0.5"
              aria-label="Next photo"
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
            <p className="label price absolute bottom-3 left-3 border-2 border-ink bg-ink px-2 py-1 text-warm" aria-live="polite">
              {index + 1} / {list.length}
            </p>
          </>
        )}
      </div>
      {list.length > 1 && (
        <ul className="flex gap-3 overflow-x-auto pb-2" aria-label="Choose a photo">
          {list.map((src, i) => (
            <li key={`${src}-thumb-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={cn(
                  "block border-2 border-ink transition-transform",
                  i === index ? "-translate-y-1 shadow-[var(--shadow-hard-sm)] outline outline-2 outline-offset-2 outline-lime" : "opacity-70 hover:opacity-100",
                )}
              >
                <SafeImage src={src} alt="" className="h-16 w-24 md:h-20 md:w-28" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
