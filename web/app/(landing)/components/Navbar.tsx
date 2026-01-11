import { Building2 } from "lucide-react";
import Link from "next/link";
import { LoginButton } from "../HomeButtons";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto backdrop-blur-md bg-background/30 border border-border/20 shadow-lg rounded-2xl px-6 py-3 flex items-center justify-between transition-all duration-300 hover:bg-background/40 hover:border-border/30 hover:shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/40 to-primary/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent rounded-full scale-0 group-hover:scale-150 opacity-0 group-hover:opacity-100 transition-all duration-700"></div>
            <Building2 className="h-8 w-8 text-primary transition-all group-hover:scale-110 duration-300 relative z-10" />
          </div>
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 group-hover:from-primary group-hover:to-primary/70 transition-all duration-300">
            Vense
          </span>
          <div className="absolute h-8 w-8 -left-3 bg-primary/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500 group-hover:translate-x-1"></div>
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link
            href="/features"
            className="text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            Features
            <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-primary group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </Link>
          <Link
            href="/pricing"
            className="text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            Pricing
            <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-primary group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </Link>
          <Link
            href="/docs"
            className="text-muted-foreground hover:text-primary transition-colors duration-300 relative group"
          >
            Documentation
            <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-primary group-hover:w-full group-hover:left-0 transition-all duration-300"></span>
          </Link>
        </div>
        <div className="flex gap-4">
          <LoginButton />
        </div>
      </div>
    </nav>
  );
}
