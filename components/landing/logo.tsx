type LogoProps = {
  size?: number;
  className?: string;
};

/**
 * Marca Demiurgos: la "D" (columna + arco) con una chispa esmeralda en la
 * boca y un resplandor interior. El toque especial: la D parece emitir luz,
 * el artesano que da forma a partir del caos.
 */
export function Logo({ size = 34, className }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={className}
      role="img"
      aria-label="Demiurgos"
    >
      <defs>
        <linearGradient id="dmgGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7CF3C6" />
          <stop offset="0.55" stopColor="#3FE0A2" />
          <stop offset="1" stopColor="#0FA56F" />
        </linearGradient>
        <radialGradient id="dmgGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#3FE0A2" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3FE0A2" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="#0A0D0E" stroke="#3FE0A2" strokeOpacity="0.35" strokeWidth="1.2" />
      <circle cx="19" cy="20" r="12" fill="url(#dmgGlow)" opacity="0.6" />
      <path
        d="M14.5 10 V30 M14.5 10 A10 10 0 0 1 14.5 30"
        fill="none"
        stroke="url(#dmgGrad)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M26 15.2 L26.99 19.01 L30.8 20 L26.99 20.99 L26 24.8 L25.01 20.99 L21.2 20 L25.01 19.01 Z"
        fill="#C9FCE8"
      />
    </svg>
  );
}
