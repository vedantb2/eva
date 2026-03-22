export function EvaIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/icon.png"
      alt="Eva"
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
