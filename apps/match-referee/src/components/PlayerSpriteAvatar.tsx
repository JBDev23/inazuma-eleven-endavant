"use client";

import { cn } from "@/lib/utils";

const DEFAULT_SPRITE = "/sprites/default.webp";

export interface PlayerSpriteAvatarProps {
  spriteUrl?: string | null;
  alt: string;
  className?: string;
  shape?: "circle" | "rounded" | "square";
  imgClassName?: string;
}

export function PlayerSpriteAvatar({
  spriteUrl,
  alt,
  className,
  shape = "circle",
  imgClassName,
}: PlayerSpriteAvatarProps) {
  const shapeClass =
    shape === "circle"
      ? "rounded-full"
      : shape === "rounded"
        ? "rounded-xl"
        : "rounded-lg";

  return (
    <div
      className={cn("relative shrink-0 overflow-hidden bg-slate-900", shapeClass, className)}
    >
      <img
        src={spriteUrl || DEFAULT_SPRITE}
        alt={alt}
        className={cn("h-full w-full object-cover object-top", imgClassName)}
      />
    </div>
  );
}
