import Link from "next/link";
import { IconChevronRight } from "@tabler/icons-react";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  href?: string;
  leftIcon?: React.ComponentType<{ size: number; color?: string; style?: any }>;
  rightIcon?: React.ComponentType<{
    size: number;
    color?: string;
    style?: any;
  }>;
}

export function Card({
  children,
  title,
  href,
  leftIcon: Icon,
  rightIcon: RightIcon,
}: CardProps) {
  const THEME_COLOR = "#16a34a"; // GREEN_600
  const NEUTRAL_500 = "#737373";

  return (
    <div className="p-3 md:p-4 flex flex-col gap-3 md:gap-4 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-sm">
      <div className="flex justify-between items-center">
        {title && (
          <div className="flex items-center gap-2">
            {Icon && (
              <Icon
                size={16}
                color={THEME_COLOR}
                style={{ color: THEME_COLOR }}
              />
            )}
            <h3 className="text-lg font-dmSans-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
              {title}
            </h3>
          </div>
        )}
        {href && (
          <Link
            className="font-dmSans-medium text-green-600 tracking-tight"
            href={href}
          >
            <div className="flex items-center">
              <span className="font-dmSans-medium text-green-600 tracking-tight">
                View all
              </span>
              <IconChevronRight
                size={14}
                color={THEME_COLOR}
                style={{ marginTop: 1, color: THEME_COLOR }}
              />
            </div>
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}
