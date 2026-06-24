import {
  AbsoluteFill,
  spring,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { COLORS, FONT } from "./tokens";

type Word = {
  text: string;
  delay: number;
};

function AnimatedWord({ text, delay }: Word) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: { damping: 14, stiffness: 100, mass: 1 },
    from: 0,
    to: 1,
  });

  const translateY = interpolate(progress, [0, 1], [40, 0]);
  const opacity = interpolate(progress, [0, 0.3], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${translateY}px)`,
        opacity,
        marginRight: "0.25em",
      }}
    >
      {text}
    </span>
  );
}

type TitleSlideProps = {
  eyebrow?: string;
  headline: string;
  subtitle?: string;
};

/** Scene 1: Intro title. Eyebrow → animated headline words → fading subtitle. */
export function TitleSlide({ eyebrow, headline, subtitle }: TitleSlideProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const eyebrowProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120 },
    from: 0,
    to: 1,
  });

  const words = headline.split(" ");

  // Subtitle fades in after words finish (word 0 starts at frame 6, each +6 frames)
  const subtitleStartFrame = 6 + words.length * 6 + 6;
  const subtitleOpacity = interpolate(
    frame - subtitleStartFrame,
    [0, 18],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    },
  );
  const subtitleY = interpolate(frame - subtitleStartFrame, [0, 18], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {eyebrow && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 14,
            fontWeight: 600,
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            color: COLORS.accent,
            opacity: eyebrowProgress,
            transform: `translateY(${interpolate(eyebrowProgress, [0, 1], [10, 0])}px)`,
          }}
        >
          {eyebrow}
        </div>
      )}

      <div
        style={{
          fontFamily: FONT,
          fontSize: 72,
          fontWeight: 700,
          color: COLORS.foreground,
          letterSpacing: "-0.02em",
          lineHeight: 1.1,
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        {words.map((word, i) => (
          <AnimatedWord key={i} text={word} delay={6 + i * 6} />
        ))}
      </div>

      {subtitle && (
        <div
          style={{
            fontFamily: FONT,
            fontSize: 22,
            fontWeight: 400,
            color: COLORS.foregroundMuted,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
            maxWidth: 600,
          }}
        >
          {subtitle}
        </div>
      )}
    </AbsoluteFill>
  );
}
