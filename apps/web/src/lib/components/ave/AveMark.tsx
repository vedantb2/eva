import { cn } from "@eva/ui";
import {
  EVA_MARK_BLUE,
  EVA_MARK_BOTTOM_POINTS,
  EVA_MARK_PURPLE,
  EVA_MARK_TOP_POINTS,
} from "@/lib/utils/evaMark";

/**
 * Same enlargement the favicon uses (`1.45` into its disc). Authored star
 * geometry leaves a gutter in a 512 viewBox; at FAB size that gutter reads as
 * a tiny glyph on glass. Scale + clip so the mark fills the circle.
 */
const DISC_STAR_SCALE = 1.45;

/**
 * Manager Ave's mark: Eva's two-tone star, full-bleed in its disc. The product
 * icon is Eva herself — this is that icon at a density that works as a launcher,
 * not a 22px glyph sitting in a chrome button.
 */
export function AveMark({
  size,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cn("inline-flex overflow-hidden rounded-full", className)}
      style={
        size === undefined ? undefined : { width: size, height: size }
      }
    >
      <svg
        viewBox="0 0 512 512"
        className="size-full"
        aria-hidden
      >
        <circle cx="256" cy="256" r="256" className="fill-card" />
        <g
          transform={`translate(256 256) scale(${DISC_STAR_SCALE}) translate(-256 -256)`}
        >
          <polygon points={EVA_MARK_TOP_POINTS} fill={EVA_MARK_PURPLE} />
          <polygon points={EVA_MARK_BOTTOM_POINTS} fill={EVA_MARK_BLUE} />
        </g>
      </svg>
    </span>
  );
}
