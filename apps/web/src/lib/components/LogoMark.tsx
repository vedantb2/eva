import { useState } from "react";
import {
  EVA_MARK_BLUE,
  EVA_MARK_BOTTOM_POINTS,
  EVA_MARK_PURPLE,
  EVA_MARK_TOP_POINTS,
} from "@/lib/utils/evaMark";

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
        points={EVA_MARK_TOP_POINTS}
        className="logo-draw-poly"
        fill={EVA_MARK_PURPLE}
        stroke={EVA_MARK_PURPLE}
        pathLength={1}
      />
      <polygon
        points={EVA_MARK_BOTTOM_POINTS}
        className="logo-draw-poly"
        fill={EVA_MARK_BLUE}
        stroke={EVA_MARK_BLUE}
        pathLength={1}
      />
    </svg>
  );
}
