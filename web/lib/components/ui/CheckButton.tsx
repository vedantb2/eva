import { IconCheck } from "@tabler/icons-react";

interface CheckButtonProps {
  checked?: boolean;
  onClick?: () => void;
  size?: "sm" | "md" | "lg";
  color?: string;
  disabled?: boolean;
}

export function CheckButton({ 
  checked = false, 
  onClick, 
  size = "md",
  color = "#db2777", // PINK_600
  disabled = false
}: CheckButtonProps) {
  const sizeClasses = {
    sm: "w-5 h-5",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        ${sizeClasses[size]} 
        rounded-full 
        border-2 
        flex items-center justify-center 
        transition-all duration-200
        ${checked 
          ? "border-transparent shadow-sm" 
          : "border-neutral-300 dark:border-neutral-600 hover:border-neutral-400 dark:hover:border-neutral-500"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={checked ? { backgroundColor: color } : {}}
    >
      {checked && (
        <IconCheck 
          size={iconSizes[size]} 
          color="white" 
          className="drop-shadow-sm"
        />
      )}
    </button>
  );
}