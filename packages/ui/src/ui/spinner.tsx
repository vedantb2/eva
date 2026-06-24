import { cn } from "../utils/cn";

// Eva logo geometry (matches public/icon.svg).
const PURPLE = "0,256 217,237 256,64 295,237 512,256";
const BLUE = "0,256 217,275 256,449 295,275 512,256";

const sizeClasses = {
  sm: "size-4",
  md: "size-6",
  lg: "size-8",
};

/**
 * Loading indicator: the Eva mark drawn as an outline with a dash that
 * continuously traces each half's perimeter. Uses SMIL so it is fully
 * self-contained (no dependency on app CSS / keyframes).
 */
function Spinner({
  size = "md",
  className,
  ...props
}: React.ComponentProps<"svg"> & {
  size?: "sm" | "md" | "lg";
}) {
  return (
    <svg
      viewBox="0 0 512 512"
      role="status"
      aria-label="Loading"
      className={cn(sizeClasses[size], className)}
      {...props}
    >
      <polygon
        points={PURPLE}
        fill="none"
        stroke="#8B3FB8"
        strokeWidth={40}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.28 0.72"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-1"
          dur="2s"
          repeatCount="indefinite"
        />
      </polygon>
      <polygon
        points={BLUE}
        fill="none"
        stroke="#3B7DD8"
        strokeWidth={40}
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.28 0.72"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="-1"
          dur="2s"
          repeatCount="indefinite"
        />
      </polygon>
    </svg>
  );
}

export { Spinner };
