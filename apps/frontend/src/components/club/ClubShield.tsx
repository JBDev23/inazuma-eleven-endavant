import { DEFAULT_SHIELD_URL } from "@inazuma/shared";

interface ClubShieldProps {
  shieldUrl?: string | null;
  alt?: string;
  className?: string;
}

export function ClubShield({
  shieldUrl,
  alt = "",
  className = "w-10 h-10 object-contain",
}: ClubShieldProps) {
  return (
    <img
      src={shieldUrl || DEFAULT_SHIELD_URL}
      alt={alt}
      className={className}
    />
  );
}
