"use client";

/* eslint-disable @next/next/no-img-element -- plain <img> so admin-entered URLs from any host work, with a local fallback */
import { useState, type ImgHTMLAttributes } from "react";
import { FALLBACK_IMAGE } from "@/lib/media";
import { cn } from "@/lib/utils";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & {
  src: string | undefined | null;
  alt: string;
  priority?: boolean;
};

export function SafeImage({ src, alt, className, priority, ...rest }: Props) {
  const [failed, setFailed] = useState<string | null>(null);
  const real = src && failed !== src ? src : FALLBACK_IMAGE;
  return (
    <img
      {...rest}
      src={real}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : undefined}
      onError={() => {
        if (src && failed !== src) setFailed(src);
      }}
      className={cn("bg-paper-deep", className, real === FALLBACK_IMAGE ? "!object-contain p-[8%]" : "object-cover")}
    />
  );
}
