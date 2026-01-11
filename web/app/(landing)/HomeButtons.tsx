"use client";

import { Button } from "@/components/ui/button";
import { ChevronRight, Play, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton, SignUpButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function LoginButton() {
  return (
    <>
      <Unauthenticated>
        <SignInButton>
          <Button
            variant="ghost"
            className="hover:bg-background/60 hover:text-primary transition-all duration-300 relative group overflow-hidden"
          >
            <span className="relative z-10">Login</span>
            <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
          </Button>
        </SignInButton>
        <SignUpButton>
          <Button className="relative overflow-hidden group shadow-md">
            <span className="relative z-10 flex items-center gap-1">
              Get Started
              <ArrowRight
                className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                color="white"
                fill="white"
              />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"></span>
            <span className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
            <span className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
          </Button>
        </SignUpButton>
      </Unauthenticated>
      <Authenticated>
        <Button className="relative overflow-hidden group shadow-md" asChild>
          <Link href="/dashboard" className="px-5">
            <span className="relative z-10 flex items-center gap-1">
              Dashboard
              <ArrowRight
                className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                color="white"
                fill="white"
              />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-300"></span>
            <span className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
            <span className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
          </Link>
        </Button>
        <UserButton />
      </Authenticated>
    </>
  );
}

export function MainButtons() {
  return (
    <>
      <SignUpButton>
        <Button
          size="lg"
          className="relative overflow-hidden group px-6 py-6 h-auto shadow-lg"
        >
          <span className="relative z-10 mr-1">Start Free Trial</span>
          <div className="relative z-10 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center overflow-hidden group-hover:bg-white/30 transition-all duration-300">
            <ChevronRight className="h-3.5 w-3.5 text-white group-hover:translate-x-5 transition-all duration-500" />
            <ChevronRight className="h-3.5 w-3.5 text-white absolute -left-5 group-hover:translate-x-5 transition-all duration-500" />
          </div>
          <span className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 group-hover:opacity-90 transition-all duration-300"></span>
          <span className="absolute inset-0 bg-gradient-to-br from-primary/80 to-primary opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
          <span className="absolute -inset-2 bg-gradient-to-r from-primary/30 to-transparent blur-xl opacity-0 group-hover:opacity-100 transition-all duration-500"></span>
        </Button>
      </SignUpButton>
      <Button
        size="lg"
        variant="outline"
        className="backdrop-blur-md bg-background/20 border-border/50 hover:bg-background/30 px-6 py-6 h-auto transition-all duration-300 shadow-md relative overflow-hidden group"
        asChild
      >
        <Link href="/demo" className="flex items-center gap-2">
          <div className="relative z-10 size-8 rounded-full bg-background/40 backdrop-blur-sm flex items-center justify-center group-hover:bg-primary/20 transition-all duration-300">
            <Play className="h-4 w-4 relative z-10 fill-primary text-primary group-hover:scale-105 transition-all duration-300" />
          </div>
          <span className="relative z-10">Watch Demo</span>
          <span className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 border border-primary/30 transition-opacity duration-300"></span>
          <span className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
        </Link>
      </Button>
    </>
  );
}
