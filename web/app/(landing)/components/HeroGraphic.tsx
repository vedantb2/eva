"use client";

import { useEffect, useState } from "react";

export function HeroGraphic() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const x = (clientX / window.innerWidth - 0.5) * 20;
      const y = (clientY / window.innerHeight - 0.5) * 20;
      setMousePosition({ x, y });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="relative w-full h-[400px] max-w-[600px] mx-auto mt-12 mb-16">
      {/* Floating elements that move with mouse */}
      <div 
        className="absolute w-32 h-32 bg-blue-500/10 rounded-xl backdrop-blur-sm border border-blue-500/20 animate-float"
        style={{ 
          left: '10%', 
          top: '30%', 
          transform: `translate3d(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px, 0)`,
          animationDuration: '7s'
        }}
      />
      <div 
        className="absolute w-48 h-48 bg-primary/10 rounded-xl backdrop-blur-sm border border-primary/20 animate-float"
        style={{ 
          left: '40%', 
          top: '10%', 
          transform: `translate3d(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px, 0)`,
          animationDuration: '9s',
          animationDelay: '1s'
        }}
      />
      <div 
        className="absolute w-40 h-40 bg-purple-500/10 rounded-xl backdrop-blur-sm border border-purple-500/20 animate-float"
        style={{ 
          left: '60%', 
          top: '40%', 
          transform: `translate3d(${mousePosition.x * 0.7}px, ${mousePosition.y * 0.7}px, 0)`,
          animationDuration: '8s',
          animationDelay: '0.5s'
        }}
      />

      {/* Floating mockup elements */}
      <div 
        className="absolute w-72 h-40 bg-background/30 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden animate-shimmer"
        style={{ 
          left: '30%', 
          top: '25%', 
          transform: `translate3d(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px, 0) rotate(-3deg)`,
          zIndex: 2
        }}
      >
        <div className="w-full h-4 bg-primary/10 flex items-center px-3">
          <div className="w-2 h-2 rounded-full bg-primary/40 mr-1.5"></div>
          <div className="w-2 h-2 rounded-full bg-primary/30 mr-1.5"></div>
          <div className="w-2 h-2 rounded-full bg-primary/20"></div>
        </div>
        <div className="p-3">
          <div className="w-1/2 h-3 bg-foreground/10 rounded-full mb-2"></div>
          <div className="w-3/4 h-3 bg-foreground/10 rounded-full mb-4"></div>
          <div className="flex gap-2 mb-3">
            <div className="w-10 h-10 rounded-md bg-primary/20"></div>
            <div className="flex-1">
              <div className="w-3/4 h-2 bg-foreground/10 rounded-full mb-1.5"></div>
              <div className="w-1/2 h-2 bg-foreground/10 rounded-full"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-md bg-blue-500/20"></div>
            <div className="flex-1">
              <div className="w-2/3 h-2 bg-foreground/10 rounded-full mb-1.5"></div>
              <div className="w-1/2 h-2 bg-foreground/10 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div 
        className="absolute w-52 h-52 bg-background/30 backdrop-blur-md rounded-xl border border-border/50 overflow-hidden animate-shimmer"
        style={{ 
          right: '20%', 
          top: '40%', 
          transform: `translate3d(${mousePosition.x * -0.1}px, ${mousePosition.y * -0.1}px, 0) rotate(5deg)`,
          zIndex: 1
        }}
      >
        <div className="w-full h-4 bg-green-500/10 flex items-center px-3">
          <div className="w-2 h-2 rounded-full bg-green-500/40 mr-1.5"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/30 mr-1.5"></div>
          <div className="w-2 h-2 rounded-full bg-green-500/20"></div>
        </div>
        <div className="p-4">
          <div className="w-full h-24 rounded-md bg-green-500/10 mb-4 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <div className="w-6 h-6 rounded-full bg-green-500/40"></div>
            </div>
          </div>
          <div className="w-full h-3 bg-foreground/10 rounded-full mb-2"></div>
          <div className="w-4/5 h-3 bg-foreground/10 rounded-full mb-2"></div>
          <div className="w-2/3 h-3 bg-foreground/10 rounded-full"></div>
        </div>
      </div>

      {/* Animated gradient circles */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 blur-3xl -z-10 animate-morph animate-gradient" style={{ left: '20%', top: '15%' }}></div>
      <div className="absolute w-80 h-80 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-primary/10 blur-3xl -z-10 animate-morph animate-gradient" style={{ right: '15%', top: '20%', animationDelay: '2s' }}></div>
    </div>
  );
} 