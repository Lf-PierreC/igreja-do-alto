import React from "react";

interface BrandLogoProps {
  variant?: "on-red" | "on-dark" | "on-dark2" | "on-sand" | "on-light";
  size?: "sm" | "md" | "lg" | "xl";
  showTagline?: boolean;
  className?: string;
}

export function MountainIcon({
  circleColor = "#CB4B3B",
  mountainColor = "#CB4B3B",
  size = 44,
  className = "",
}: {
  circleColor?: string;
  mountainColor?: string;
  skyColor?: string;
  size?: number;
  className?: string;
}) {
  const maskId = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <mask id={maskId}>
          <rect width="100" height="100" fill="black" />
          <circle cx="50" cy="50" r="48" fill="white" />
          <circle cx="50" cy="50" r="42" fill="black" />
          <path
            d="M6 56 L29 29 L63 69 L58 69 L35 41 L51 22 L73 49 L82 38 L94 54 A43 43 0 0 1 6 56 Z"
            fill="white"
          />
          <path
            d="M7 55 L29 30 L59 66 L64 66 L36 33 L51 17 L73 44 L82 34 L93 50 A42.5 42.5 0 1 1 7 55 Z"
            fill="white"
          />
          <path d="M28 29 L60 67 L64.5 67 L32.5 29 Z" fill="black" />
        </mask>
      </defs>
      <rect
        width="100"
        height="100"
        fill={mountainColor || circleColor}
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export function BrandLogo({
  variant = "on-dark",
  size = "md",
  showTagline = false,
  className = "",
}: BrandLogoProps) {
  const palettes = {
    "on-red": {
      circle: "#DCDACF",
      mountain: "#DCDACF",
      sky: "#CB4B3B",
      text: "#DCDACF",
      tagline: "#DCDACF",
    },
    "on-dark": {
      circle: "#CB4B3B",
      mountain: "#CB4B3B",
      sky: "#252525",
      text: "#DCDACF",
      tagline: "#CB4B3B",
    },
    "on-dark2": {
      circle: "#CB4B3B",
      mountain: "#CB4B3B",
      sky: "#252525",
      text: "#DCDACF",
      tagline: "#DCDACF",
    },
    "on-sand": {
      circle: "#252525",
      mountain: "#252525",
      sky: "#DCDACF",
      text: "#252525",
      tagline: "#CB4B3B",
    },
    "on-light": {
      circle: "#CB4B3B",
      mountain: "#CB4B3B",
      sky: "#FFFFFF",
      text: "#252525",
      tagline: "#CB4B3B",
    },
  };

  const sizes = {
    sm: { icon: 36, title: "text-base leading-none", sub: "text-[10px]" },
    md: { icon: 46, title: "text-xl leading-none", sub: "text-xs" },
    lg: { icon: 58, title: "text-2xl leading-none", sub: "text-xs" },
    xl: { icon: 72, title: "text-3xl sm:text-4xl leading-none", sub: "text-sm" },
  };

  const currentPalette = palettes[variant];
  const currentSize = sizes[size];

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      <MountainIcon
        size={currentSize.icon}
        circleColor={currentPalette.circle}
        mountainColor={currentPalette.mountain}
        skyColor={currentPalette.sky}
      />
      <div className="flex flex-col justify-center">
        <span
          style={{ color: currentPalette.text }}
          className={`font-black uppercase tracking-tight ${currentSize.title}`}
        >
          IGREJA
          <br />
          DO ALTO
        </span>
        {showTagline && (
          <span
            style={{ color: currentPalette.tagline }}
            className={`mt-1 font-semibold uppercase tracking-widest opacity-90 ${currentSize.sub}`}
          >
            Lugar de Proteção, Provisão e Direção
          </span>
        )}
      </div>
    </div>
  );
}
