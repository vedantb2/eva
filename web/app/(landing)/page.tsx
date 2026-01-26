import Image from "next/image";
import { LandingAuthNav } from "./LandingAuthNav";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900">
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Image
                src="/icon.png"
                alt="Eva"
                width={24}
                height={24}
                className="rounded-full"
              />{" "}
              <span className="text-xl font-semibold text-neutral-900 dark:text-white">
                Eva
              </span>
            </div>
            <LandingAuthNav />
          </div>
        </div>
      </nav>
    </div>
  );
}
