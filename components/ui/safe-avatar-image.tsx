/**
 * REQ-0038/0039 — avatar with primary src (e.g. Google) and robohash fallback on error.
 * referrerPolicy=no-referrer helps Google CDN hotlink reliability.
 */
"use client";

import { useState } from "react";
import { SafeImage, type SafeImageProps } from "@/components/ui/safe-image";

export type SafeAvatarImageProps = Omit<SafeImageProps, "src"> & {
  src: string;
  fallbackSrc: string;
};

export function SafeAvatarImage({
  src,
  fallbackSrc,
  onError,
  referrerPolicy = "no-referrer",
  ...props
}: SafeAvatarImageProps) {
  const [fallbackForSrc, setFallbackForSrc] = useState<string | null>(null);
  const currentSrc =
    fallbackForSrc === src && src ? fallbackSrc : src;

  return (
    <SafeImage
      {...props}
      src={currentSrc}
      referrerPolicy={referrerPolicy}
      unoptimized
      onError={(e) => {
        if (src && currentSrc !== fallbackSrc) {
          setFallbackForSrc(src);
        }
        onError?.(e);
      }}
    />
  );
}
