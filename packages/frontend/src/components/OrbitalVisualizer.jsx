/**
 * Orbital Visualizer - Siri/Gemini benzeri animasyonlu ses görselleştirici
 * Duruma göre farklı animasyonlar gösterir:
 * - idle: Yavaş nefes alan orb
 * - listening: Nabız atan, kullanıcıyı dinleyen orb
 * - speaking: Aktif konuşan, parlayan orb
 * - processing: Dönen, düşünen orb
 */
import { useMemo } from 'react';

const STATE_CONFIGS = {
  idle: {
    scale: 1,
    glowIntensity: 0.3,
    animationClass: 'animate-breathe',
    colors: ['#6366f1', '#8b5cf6', '#a78bfa'],
    label: '',
  },
  connecting: {
    scale: 0.9,
    glowIntensity: 0.4,
    animationClass: 'animate-pulse-slow',
    colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
    label: 'Bağlanıyor...',
  },
  authenticating: {
    scale: 0.9,
    glowIntensity: 0.4,
    animationClass: 'animate-pulse-slow',
    colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
    label: 'Kimlik doğrulanıyor...',
  },
  ready: {
    scale: 1,
    glowIntensity: 0.5,
    animationClass: 'animate-breathe',
    colors: ['#10b981', '#34d399', '#6ee7b7'],
    label: 'Hazır',
  },
  active: {
    scale: 1.05,
    glowIntensity: 0.6,
    animationClass: 'animate-pulse-slow',
    colors: ['#6366f1', '#8b5cf6', '#a78bfa'],
    label: 'Oturum başlıyor...',
  },
  listening: {
    scale: 1.1,
    glowIntensity: 0.7,
    animationClass: 'animate-listen',
    colors: ['#3b82f6', '#60a5fa', '#93c5fd'],
    label: 'Dinliyorum...',
  },
  speaking: {
    scale: 1.15,
    glowIntensity: 1,
    animationClass: 'animate-speak',
    colors: ['#8b5cf6', '#a78bfa', '#c4b5fd'],
    label: '',
  },
  processing: {
    scale: 1,
    glowIntensity: 0.5,
    animationClass: 'animate-spin-slow',
    colors: ['#f59e0b', '#fbbf24', '#fcd34d'],
    label: 'İşleniyor...',
  },
  completed: {
    scale: 1,
    glowIntensity: 0.4,
    animationClass: 'animate-breathe',
    colors: ['#10b981', '#34d399', '#6ee7b7'],
    label: 'Tamamlandı',
  },
  error: {
    scale: 0.95,
    glowIntensity: 0.3,
    animationClass: 'animate-pulse-slow',
    colors: ['#ef4444', '#f87171', '#fca5a5'],
    label: 'Hata oluştu',
  },
};

export default function OrbitalVisualizer({ state = 'idle', size = 280 }) {
  const config = STATE_CONFIGS[state] || STATE_CONFIGS.idle;

  const gradientId = useMemo(() => `orbital-gradient-${Math.random().toString(36).slice(2)}`, []);
  const glowId = useMemo(() => `orbital-glow-${Math.random().toString(36).slice(2)}`, []);

  const orbSize = size * config.scale;
  const center = size / 2;

  return (
    <div className="relative flex flex-col items-center justify-center select-none">
      <div
        className={`relative ${config.animationClass}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="absolute inset-0"
        >
          <defs>
            <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={config.colors[2]} stopOpacity="0.9" />
              <stop offset="50%" stopColor={config.colors[1]} stopOpacity="0.6" />
              <stop offset="100%" stopColor={config.colors[0]} stopOpacity="0.1" />
            </radialGradient>
            <filter id={glowId}>
              <feGaussianBlur stdDeviation={12 * config.glowIntensity} result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Dış glow halka */}
          <circle
            cx={center}
            cy={center}
            r={orbSize * 0.48}
            fill="none"
            stroke={config.colors[0]}
            strokeWidth="1"
            opacity={config.glowIntensity * 0.3}
            className={state === 'speaking' ? 'animate-ping-slow' : ''}
          />

          {/* Orta halka */}
          <circle
            cx={center}
            cy={center}
            r={orbSize * 0.38}
            fill="none"
            stroke={config.colors[1]}
            strokeWidth="1.5"
            opacity={config.glowIntensity * 0.5}
          />

          {/* Ana orb */}
          <circle
            cx={center}
            cy={center}
            r={orbSize * 0.28}
            fill={`url(#${gradientId})`}
            filter={`url(#${glowId})`}
          />

          {/* İç parlama */}
          <circle
            cx={center}
            cy={center}
            r={orbSize * 0.15}
            fill={config.colors[2]}
            opacity={config.glowIntensity * 0.4}
          />

          {/* Orbital çizgi 1 */}
          {(state === 'speaking' || state === 'listening') && (
            <ellipse
              cx={center}
              cy={center}
              rx={orbSize * 0.42}
              ry={orbSize * 0.18}
              fill="none"
              stroke={config.colors[1]}
              strokeWidth="1"
              opacity="0.4"
              className="animate-orbit"
            />
          )}

          {/* Orbital çizgi 2 */}
          {state === 'speaking' && (
            <ellipse
              cx={center}
              cy={center}
              rx={orbSize * 0.2}
              ry={orbSize * 0.44}
              fill="none"
              stroke={config.colors[2]}
              strokeWidth="1"
              opacity="0.3"
              className="animate-orbit-reverse"
            />
          )}
        </svg>
      </div>

      {config.label && (
        <p className="mt-4 text-sm text-white/60 tracking-wide animate-fade-in">
          {config.label}
        </p>
      )}
    </div>
  );
}
