import React from "react";

/**
 * Coleção de elementos SVG decorativos para a família "Journaling".
 * Tudo SVG inline → exporta perfeito via html-to-image.
 * Coordenadas em % para escalar com o slide.
 */

export const PAPER_TEXTURES = {
  // Linhas finas cruzadas — papel linho
  linen: `
    repeating-linear-gradient(0deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 4px),
    repeating-linear-gradient(90deg, rgba(0,0,0,0.025) 0px, rgba(0,0,0,0.025) 1px, transparent 1px, transparent 4px)
  `,
  // Manchas suaves — papel kraft
  kraft: `
    radial-gradient(circle at 20% 15%, rgba(0,0,0,0.06), transparent 55%),
    radial-gradient(circle at 80% 85%, rgba(255,255,255,0.04), transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03), transparent 70%)
  `,
  // Linhas horizontais — papel de caderno
  notebook: `
    repeating-linear-gradient(0deg, transparent 0px, transparent 38px, rgba(80,120,180,0.18) 38px, rgba(80,120,180,0.18) 39px)
  `,
  // Quadriculado — folha de matemática
  grid: `
    repeating-linear-gradient(0deg, transparent 0px, transparent 24px, rgba(80,120,180,0.20) 24px, rgba(80,120,180,0.20) 25px),
    repeating-linear-gradient(90deg, transparent 0px, transparent 24px, rgba(80,120,180,0.20) 24px, rgba(80,120,180,0.20) 25px)
  `,
  // Granulado tipo juta
  burlap: `
    repeating-linear-gradient(45deg, rgba(0,0,0,0.04) 0px, rgba(0,0,0,0.04) 2px, transparent 2px, transparent 5px),
    repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0px, rgba(0,0,0,0.03) 2px, transparent 2px, transparent 5px)
  `,
};

interface DecoProps {
  size?: number; // em px (já no native space do slide)
  color?: string;
  opacity?: number;
  rotate?: number;
}

/** Fita washi adesiva semitransparente */
export const WashiTape: React.FC<{ width: number; height?: number; color?: string; rotate?: number; style?: React.CSSProperties }> = ({
  width, height = 36, color = "#e8d9b8", rotate = -8, style,
}) => (
  <div
    style={{
      width,
      height,
      background: `linear-gradient(180deg, ${color}cc 0%, ${color}ee 50%, ${color}cc 100%)`,
      borderTop: `1px dashed rgba(0,0,0,0.08)`,
      borderBottom: `1px dashed rgba(0,0,0,0.08)`,
      transform: `rotate(${rotate}deg)`,
      boxShadow: "0 2px 4px rgba(0,0,0,0.08)",
      position: "absolute",
      ...style,
    }}
  />
);

/** Selo de cera vermelho com textura e marca central */
export const WaxSeal: React.FC<DecoProps> = ({ size = 90, color = "#7a1f15", opacity = 1, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity, transform: `rotate(${rotate}deg)` }}>
    <defs>
      <radialGradient id="waxGrad" cx="40%" cy="35%">
        <stop offset="0%" stopColor={color} stopOpacity="0.95" />
        <stop offset="60%" stopColor={color} />
        <stop offset="100%" stopColor="#3d0d08" />
      </radialGradient>
    </defs>
    {/* corpo irregular */}
    <path
      d="M50 6 C62 8 72 14 78 24 C86 30 92 42 90 54 C92 66 84 78 72 84 C64 92 52 94 40 90 C28 92 16 84 12 72 C6 62 6 50 12 38 C14 26 24 16 36 12 C40 8 46 6 50 6 Z"
      fill="url(#waxGrad)"
    />
    {/* brilho */}
    <ellipse cx="38" cy="32" rx="14" ry="8" fill="rgba(255,255,255,0.18)" />
    {/* marca central */}
    <circle cx="50" cy="50" r="22" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
    <text x="50" y="58" textAnchor="middle" fontSize="22" fontFamily="Georgia, serif" fill="rgba(255,255,255,0.55)" fontStyle="italic">G</text>
  </svg>
);

/** Selo dourado circular */
export const GoldStamp: React.FC<DecoProps> = ({ size = 70, opacity = 1, rotate = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity, transform: `rotate(${rotate}deg)` }}>
    <defs>
      <radialGradient id="goldGrad" cx="35%" cy="35%">
        <stop offset="0%" stopColor="#f5d98a" />
        <stop offset="50%" stopColor="#c9965a" />
        <stop offset="100%" stopColor="#7a4a1e" />
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="44" fill="url(#goldGrad)" />
    <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
    <circle cx="50" cy="50" r="34" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="0.8" strokeDasharray="2 2" />
    <ellipse cx="38" cy="32" rx="12" ry="6" fill="rgba(255,255,255,0.35)" />
  </svg>
);

/** Espiral metálico horizontal (binder) */
export const SpiralBinder: React.FC<{ width: number; rings?: number }> = ({ width, rings = 9 }) => {
  const ringSize = 28;
  const gap = (width - rings * ringSize) / (rings + 1);
  return (
    <div style={{ width, height: 50, position: "relative", display: "flex", alignItems: "center" }}>
      {/* barra central horizontal */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 22,
        height: 6,
        background: "linear-gradient(180deg, #cbd0d6 0%, #8a8f96 50%, #5a5f66 100%)",
        borderRadius: 2,
      }} />
      {Array.from({ length: rings }).map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          left: gap + i * (ringSize + gap),
          top: 0,
          width: ringSize,
          height: 50,
        }}>
          <svg viewBox="0 0 28 50" width={ringSize} height={50}>
            <ellipse cx="14" cy="14" rx="10" ry="12" fill="none" stroke="#6b7078" strokeWidth="3" />
            <ellipse cx="14" cy="14" rx="10" ry="12" fill="none" stroke="#d8dce0" strokeWidth="1" />
            <line x1="14" y1="2" x2="14" y2="48" stroke="#9a9fa6" strokeWidth="2" />
            <line x1="14" y1="2" x2="14" y2="48" stroke="#e0e3e6" strokeWidth="0.8" />
          </svg>
        </div>
      ))}
    </div>
  );
};

/** Forma orgânica de papel rasgado (clip-path via SVG) */
export const TornPaperPath: React.FC<{ width: number; height: number; fill?: string; rotate?: number; style?: React.CSSProperties; children?: React.ReactNode }> = ({
  width, height, fill = "#fefdf8", rotate = 0, style, children,
}) => (
  <div style={{ width, height, position: "relative", transform: `rotate(${rotate}deg)`, ...style }}>
    <svg viewBox="0 0 400 400" width={width} height={height} style={{ position: "absolute", inset: 0, filter: "drop-shadow(0 6px 12px rgba(0,0,0,0.18))" }} preserveAspectRatio="none">
      <path
        d="M20 40 Q15 25 30 22 L70 18 Q85 14 100 20 L150 12 Q170 16 190 14 L240 18 Q260 12 280 20 L330 16 Q360 22 375 35 L380 80 Q385 110 378 140 L385 190 Q382 220 378 250 L383 295 Q378 330 365 358 L320 372 Q290 382 260 376 L220 385 Q190 380 160 384 L110 378 Q80 384 50 372 Q25 360 18 335 L22 290 Q15 260 20 230 L16 180 Q22 145 18 110 L20 70 Z"
        fill={fill}
      />
    </svg>
    <div style={{ position: "absolute", inset: 0, padding: "10% 12%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      {children}
    </div>
  </div>
);

/** Envelope aberto com aba */
export const EnvelopeShape: React.FC<{ width: number; height: number; color?: string; flapColor?: string }> = ({
  width, height, color = "#e8d4b8", flapColor = "#d4bc97",
}) => (
  <svg viewBox="0 0 200 140" width={width} height={height} style={{ filter: "drop-shadow(0 8px 16px rgba(0,0,0,0.2))" }}>
    {/* corpo */}
    <rect x="10" y="40" width="180" height="95" rx="3" fill={color} />
    {/* aba aberta */}
    <path d="M10 40 L100 5 L190 40 L100 75 Z" fill={flapColor} />
    <path d="M10 40 L100 75 L190 40" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
  </svg>
);

/** Linhas horizontais de caderno (decoração interna) */
export const NotebookLines: React.FC<{ color?: string; spacing?: number }> = ({ color = "rgba(180,30,30,0.15)", spacing = 38 }) => (
  <div
    style={{
      position: "absolute", inset: 0, pointerEvents: "none",
      backgroundImage: `repeating-linear-gradient(0deg, transparent 0px, transparent ${spacing - 1}px, ${color} ${spacing - 1}px, ${color} ${spacing}px)`,
    }}
  />
);

/** Seta desenhada à mão */
export const HandDrawnArrow: React.FC<{ width?: number; color?: string; rotate?: number; style?: React.CSSProperties }> = ({
  width = 110, color = "#fefdf8", rotate = 0, style,
}) => (
  <svg width={width} height={width * 0.7} viewBox="0 0 110 80" style={{ position: "absolute", transform: `rotate(${rotate}deg)`, ...style }}>
    <path
      d="M5 15 Q30 5 60 25 Q85 45 95 65"
      fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round"
    />
    <path d="M85 58 L95 65 L88 75" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

/** Clipe metálico no topo */
export const PaperClip: React.FC<{ size?: number; rotate?: number; style?: React.CSSProperties }> = ({
  size = 50, rotate = 15, style,
}) => (
  <svg width={size} height={size * 1.6} viewBox="0 0 30 50" style={{ position: "absolute", transform: `rotate(${rotate}deg)`, filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.25))", ...style }}>
    <path d="M8 5 Q8 2 12 2 L20 2 Q24 2 24 6 L24 38 Q24 44 18 44 L12 44 Q6 44 6 38 L6 12 Q6 8 10 8 L18 8" fill="none" stroke="#9aa0a8" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M8 5 Q8 2 12 2 L20 2 Q24 2 24 6 L24 38 Q24 44 18 44 L12 44 Q6 44 6 38 L6 12 Q6 8 10 8 L18 8" fill="none" stroke="#dde1e5" strokeWidth="0.8" strokeLinecap="round" />
  </svg>
);
