"use client";

import { useRef, useEffect, ReactNode } from "react";

interface SwipeGesturesProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number;
  className?: string;
  children: ReactNode;
}

export function SwipeGestures({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = "",
  children
}: SwipeGesturesProps) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if swipe is horizontal or vertical
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (absDeltaX > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absDeltaY > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      touchStartRef.current = null;
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
    };

    // For desktop mouse events (optional)
    let mouseStartRef: { x: number; y: number } | null = null;
    let isMouseDown = false;

    const handleMouseDown = (e: MouseEvent) => {
      isMouseDown = true;
      mouseStartRef = {
        x: e.clientX,
        y: e.clientY
      };
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown || !mouseStartRef) return;
      
      isMouseDown = false;
      const deltaX = e.clientX - mouseStartRef.x;
      const deltaY = e.clientY - mouseStartRef.y;

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Determine if swipe is horizontal or vertical
      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (absDeltaX > threshold) {
          if (deltaX > 0) {
            onSwipeRight?.();
          } else {
            onSwipeLeft?.();
          }
        }
      } else {
        // Vertical swipe
        if (absDeltaY > threshold) {
          if (deltaY > 0) {
            onSwipeDown?.();
          } else {
            onSwipeUp?.();
          }
        }
      }

      mouseStartRef = null;
    };

    const handleMouseLeave = () => {
      isMouseDown = false;
      mouseStartRef = null;
    };

    // Touch events
    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });
    element.addEventListener("touchcancel", handleTouchCancel, { passive: true });

    // Mouse events (for desktop)
    element.addEventListener("mousedown", handleMouseDown);
    element.addEventListener("mouseup", handleMouseUp);
    element.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
      element.removeEventListener("touchcancel", handleTouchCancel);
      element.removeEventListener("mousedown", handleMouseDown);
      element.removeEventListener("mouseup", handleMouseUp);
      element.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown, threshold]);

  return (
    <div ref={elementRef} className={className}>
      {children}
    </div>
  );
}