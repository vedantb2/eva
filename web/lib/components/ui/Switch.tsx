"use client";

import { useState } from "react";

interface SwitchProps {
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onColor?: string;
  offColor?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ 
  value = false, 
  onValueChange, 
  onColor = "#db2777", 
  offColor = "#e5e7eb",
  disabled = false,
  className = ""
}: SwitchProps) {
  const [isOn, setIsOn] = useState(value);

  const handleToggle = () => {
    if (disabled) return;
    
    const newValue = !isOn;
    setIsOn(newValue);
    onValueChange?.(newValue);
  };

  const backgroundColor = isOn ? onColor : offColor;
  const translateX = isOn ? "translate-x-5" : "translate-x-0";

  return (
    <button
      type="button"
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
      style={{ backgroundColor }}
      onClick={handleToggle}
      disabled={disabled}
      role="switch"
      aria-checked={isOn}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${translateX}`}
      />
    </button>
  );
}