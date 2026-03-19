"use client";

import { useState } from "react";

export default function FallbackImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallback?: React.ReactNode;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return fallback ?? null;

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
