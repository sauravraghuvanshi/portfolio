"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Drop-in replacement for next/image that shows a shimmer skeleton
 * while the image loads, then fades it in smoothly.
 */
export default function ImageWithShimmer({
  className,
  onLoad,
  ...props
}: ImageProps) {
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      {!loaded && (
        <span className="absolute inset-0 shimmer-placeholder rounded-[inherit]" />
      )}
      <Image
        {...props}
        className={cn(
          className,
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={(e) => {
          setLoaded(true);
          if (typeof onLoad === "function") {
            (onLoad as (e: React.SyntheticEvent<HTMLImageElement>) => void)(e);
          }
        }}
      />
    </>
  );
}
