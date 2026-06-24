import { useState } from "react";

// Logo geometry (matches public/icon.svg).
const PURPLE = "0,256 217,237 256,64 295,237 512,256";
const BLUE = "0,256 217,275 256,449 295,275 512,256";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Animated Eva logo: the mark draws itself on mount and replays on hover.
 * Re-keying the <svg> on mouse-enter remounts it, which restarts the CSS
 * draw animation (see `.logo-draw-poly` in globals.css).
 */
export function LogoMark({ size = 22, className }: LogoMarkProps) {
  const [runId, setRunId] = useState(0);

  return (
    <svg
      key={runId}
      onMouseEnter={() => setRunId((n) => n + 1)}
      viewBox="0 0 512 512"
      width={size}
      height={size}
      role="img"
      aria-label="Eva"
      className={className}
    >
      <polygon
        points={PURPLE}
        className="logo-draw-poly"
        fill="#8B3FB8"
        stroke="#8B3FB8"
        pathLength={1}
      />
      <polygon
        points={BLUE}
        className="logo-draw-poly"
        fill="#3B7DD8"
        stroke="#3B7DD8"
        pathLength={1}
      />
    </svg>
  );
}
