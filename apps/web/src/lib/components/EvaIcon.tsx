export function EvaIcon({ size = 20 }: { size?: number }) {
  return (
    <img
      src="/icon.png"
      alt="Eva"
      width={size}
      height={size}
      className="rounded-full outline outline-1 outline-black/10 dark:outline-white/10"
    />
  );
}
