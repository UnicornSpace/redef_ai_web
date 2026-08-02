"use client";

import { MotionConfig, motion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { AVATAR_ACCENT_VARS, accentIndexFor, initialsOf } from "@/lib/avatar";

/* Honors the user's reduced-motion setting across every animation */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/* ------------------------------------------------------------------ */
/* Motion — Apple-style springs                                        */
/* critically damped by default; bounce reserved for momentum          */
/* ------------------------------------------------------------------ */

export const springSmooth = {
  type: "spring",
  bounce: 0,
  duration: 0.65,
} as const;
export const springSnappy = {
  type: "spring",
  bounce: 0,
  duration: 0.4,
} as const;
export const springPlayful = {
  type: "spring",
  bounce: 0.22,
  duration: 0.55,
} as const;

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

export function Container({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`f-container ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Divider() {
  return (
    <Container>
      <hr className="f-hr" />
    </Container>
  );
}

/* Scroll-in reveal — spring from current value, interrupt-safe */
export function Reveal({
  children,
  delay = 0,
  y = 26,
  className = "",
  style,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ ...springSmooth, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Redef logo                                                          */
/* ------------------------------------------------------------------ */

export function RedefLogo({ height = 30 }: { height?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 2 }}>
      <img
        src="/logo.png"
        alt=""
        height={height + 12}
        width={height + 12}
        style={{ display: "block", marginRight: -8 }}
      />
      <span
        style={{
          fontWeight: 800,
          fontSize: height * 0.72,
          letterSpacing: "-0.03em",
          color: "var(--ink)",
          lineHeight: 1,
        }}
      >
        edef AI
      </span>
    </span>
  );
}

/* Initials-on-a-color-circle avatar — used wherever we'd show a photo but
   have none stored (nav/footer account state, habit invite cards). */
export function NavAvatar({
  seed,
  size = 30,
}: {
  seed: string;
  size?: number;
}) {
  const color = AVATAR_ACCENT_VARS[accentIndexFor(seed)];
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        color: "#fff",
        fontWeight: 800,
        fontSize: size * 0.38,
        letterSpacing: "-0.02em",
        flexShrink: 0,
      }}
    >
      {initialsOf(seed)}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Icons                                                               */
/* ------------------------------------------------------------------ */

export function MicIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
      <path
        d="M5.5 11.5a6.5 6.5 0 0 0 13 0"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ArrowIcon({
  size = 15,
  rotate = 0,
}: {
  size?: number;
  rotate?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={(size * 15) / 18}
      viewBox="0 0 18 15"
      fill="none"
      style={{ transform: rotate ? `rotate(${rotate}deg)` : undefined }}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9.94417 0.373474L17.2534 7.49997L9.94417 14.6265L8.7225 13.3735L13.8492 8.37497H0L0 6.62497L13.8492 6.62497L8.7225 1.62647L9.94417 0.373474Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function TickIcon({ size = 17 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={(size * 14) / 18}
      viewBox="0 0 18 14"
      fill="none"
      style={{ marginTop: 6, minWidth: size }}
    >
      <path
        d="M1 6.76191L6.33333 12L17 1"
        stroke="currentColor"
        strokeWidth="2.25"
      />
    </svg>
  );
}

export function ChevronDown({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 12 12"
      fill="none"
    >
      <path
        d="M2.5 4.5L6 8L9.5 4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PlayStoreIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M14.222 9.374c1.037-.61 1.037-2.137 0-2.748L11.528 5.04 8.32 8l3.207 2.96zm-3.595 2.116L7.583 8.68 1.03 14.73c.201 1.029 1.36 1.61 2.303 1.055zM1 13.396V2.603L6.846 8zM1.03 1.27l6.553 6.05 3.044-2.81L3.333.215C2.39-.341 1.231.24 1.03 1.27" />
    </svg>
  );
}

/* 4-point sparkle */
export function Sparkle({
  size = 24,
  color = "var(--g-amber)",
  style,
  className = "",
}: {
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={style}
      className={className}
    >
      <path
        d="M12 0C13.1 7.9 16.1 10.9 24 12C16.1 13.1 13.1 16.1 12 24C10.9 16.1 7.9 13.1 0 12C7.9 10.9 10.9 7.9 12 0Z"
        fill={color}
      />
    </svg>
  );
}

/* Animated voice equalizer bars */
export function VoiceWave({
  color = "#fff",
  height = 16,
  bars = 5,
  width = 3,
}: {
  color?: string;
  height?: number;
  bars?: number;
  width?: number;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: width,
        height,
      }}
    >
      {Array.from({ length: bars }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed decorative bars
          key={i}
          className="f-eq-bar"
          style={{
            width,
            height,
            borderRadius: width,
            background: color,
            animationDelay: `${i * 0.13}s`,
            display: "block",
          }}
        />
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Buttons                                                             */
/* ------------------------------------------------------------------ */

export function PillButton({
  variant = "dark",
  href,
  children,
  onClick,
  className = "",
}: {
  variant?: "dark" | "beige" | "white" | "green";
  href?: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `f-btn f-btn-${variant} ${className}`;
  if (href) {
    const external = href.startsWith("http");
    return (
      <a
        href={href}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
        className={cls}
      >
        {children}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Section text helpers                                                */
/* ------------------------------------------------------------------ */

export function Eyebrow({
  color,
  children,
}: {
  color: string;
  children: ReactNode;
}) {
  return (
    <p className="f-eyebrow" style={{ color }}>
      {children}
    </p>
  );
}

export function TickList({
  items,
  color,
  columns = 1,
}: {
  items: string[];
  color: string;
  columns?: 1 | 2;
}) {
  return (
    <ul
      style={{
        display: "grid",
        gridTemplateColumns: columns === 2 ? "1fr 1fr" : "1fr",
        gap: "1rem 1.25rem",
        color,
        margin: 0,
        padding: "0.65rem 0 0.4rem",
        listStyle: "none",
      }}
    >
      {items.map((item) => (
        <li
          key={item}
          style={{ display: "flex", alignItems: "flex-start", gap: "0.9rem" }}
        >
          <TickIcon />
          <span
            style={{
              fontSize: "1.06rem",
              fontWeight: 700,
              letterSpacing: "-0.012em",
              color: "var(--ink)",
              lineHeight: 1.6,
            }}
          >
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Mascots — the Redef shape buddies                                   */
/* ------------------------------------------------------------------ */

/* Small face overlay used to give any shape a personality */
export function Face({
  scale = 1,
  mouth = "smile",
  color = "var(--g-ink)",
}: {
  scale?: number;
  mouth?: "smile" | "open" | "wave";
  color?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={54 * scale}
      height={34 * scale}
      viewBox="0 0 54 34"
      fill="none"
      style={{ display: "block" }}
    >
      <ellipse cx="13" cy="10" rx="4.6" ry="5.8" fill={color} />
      <ellipse cx="41" cy="10" rx="4.6" ry="5.8" fill={color} />
      {mouth === "smile" ? (
        <path
          d="M19 22 Q27 30 35 22"
          stroke={color}
          strokeWidth="3.6"
          strokeLinecap="round"
          fill="none"
        />
      ) : mouth === "open" ? (
        <ellipse cx="27" cy="24" rx="6" ry="7" fill={color} />
      ) : (
        <g>
          {[0, 1, 2, 3, 4].map((i) => (
            <rect
              key={`wave-${i}`}
              className="f-eq-bar"
              x={17 + i * 5}
              y={18}
              width={3}
              height={12}
              rx={1.5}
              fill={color}
              style={{ animationDelay: `${i * 0.12}s` }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/* Echo — the Redef voice-orb mascot: squircle blob with a waveform mouth */
export function EchoMascot({
  size = 150,
  color = "var(--g-green)",
  faceColor = "#eafce7",
}: {
  size?: number;
  color?: string;
  faceColor?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 140 140"
      fill="none"
      style={{ display: "block" }}
    >
      {/* soft squircle body */}
      <path
        d="M70 6C114 6 134 26 134 70C134 114 114 134 70 134C26 134 6 114 6 70C6 26 26 6 70 6Z"
        fill={color}
      />
      {/* inner face plate */}
      <path
        d="M70 26C99 26 114 41 114 70C114 99 99 114 70 114C41 114 26 99 26 70C26 41 41 26 70 26Z"
        fill={faceColor}
        opacity={0.28}
      />
      {/* eyes */}
      <ellipse cx="52" cy="60" rx="5.6" ry="7.2" fill="var(--g-ink)" />
      <ellipse cx="88" cy="60" rx="5.6" ry="7.2" fill="var(--g-ink)" />
      {/* blush */}
      <circle cx="40" cy="76" r="6" fill="#ffffff" opacity={0.35} />
      <circle cx="100" cy="76" r="6" fill="#ffffff" opacity={0.35} />
      {/* waveform mouth */}
      {[0, 1, 2, 3, 4].map((i) => (
        <rect
          key={`echo-wave-${i}`}
          className="f-eq-bar"
          x={54 + i * 7}
          y={78}
          width={4}
          height={18}
          rx={2}
          fill="var(--g-ink)"
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
      {/* antenna */}
      <path d="M70 6 v-0" />
      <circle cx="112" cy="24" r="7" fill="var(--g-amber)" />
    </svg>
  );
}

/* Daisy flower helper */
export function Daisy({
  size = 96,
  petal = "var(--g-amber)",
  center = "var(--g-coral)",
}: {
  size?: number;
  petal?: string;
  center?: string;
}) {
  const c = 50;
  const points = Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { x: c + Math.cos(a) * 26, y: c + Math.sin(a) * 26 };
  });
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      style={{ display: "block" }}
    >
      {points.map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={20} fill={petal} />
      ))}
      <circle cx={c} cy={c} r={15} fill={center} />
    </svg>
  );
}
