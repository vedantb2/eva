import Image from "next/image";

export function EvaIcon({ size = 20 }: { size?: number }) {
  return (
    <Image
      src="/icon.png"
      alt="Eva"
      width={size}
      height={size}
      className="rounded-full"
    />
  );
}
