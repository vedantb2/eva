interface MetricCardProps {
  title: string;
  value: string;
  unit?: string;
  status?: "normal" | "warning" | "danger";
  bgColor?: string;
  textColor?: string;
  onClick?: () => void;
}

export function MetricCard({
  title,
  value,
  unit,
  status = "normal",
  bgColor,
  textColor,
  onClick,
}: MetricCardProps) {
  const statusColors = {
    normal: {
      bg: "bg-green-100 dark:bg-green-900/20",
      text: "text-green-800 dark:text-green-300",
      status: "Normal",
    },
    warning: {
      bg: "bg-yellow-100 dark:bg-yellow-900/20",
      text: "text-yellow-800 dark:text-yellow-300",
      status: "High",
    },
    danger: {
      bg: "bg-red-100 dark:bg-red-900/20",
      text: "text-red-800 dark:text-red-300",
      status: "High",
    },
  };

  const colorConfig = statusColors[status];
  const finalBgColor = bgColor || colorConfig.bg;
  const finalTextColor = textColor || colorConfig.text;

  const Component = onClick ? "button" : "div";

  return (
    <Component
      className={`${finalBgColor} p-4 rounded-xl flex-1 border border-neutral-100 dark:border-neutral-700 ${
        onClick
          ? "hover:opacity-90 transition-opacity duration-200 cursor-pointer"
          : ""
      }`}
      style={{
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
      }}
      onClick={onClick}
    >
      <p className="text-neutral-600 dark:text-neutral-400 font-dmSans-medium mb-1 text-sm">
        {title}
      </p>
      <div className="flex items-baseline">
        <p className="text-xl font-dmSans-bold text-neutral-900 dark:text-neutral-100">
          {value}
        </p>
        {unit && (
          <p className="text-neutral-600 dark:text-neutral-400 ml-1 font-dmSans-medium text-sm">
            {unit}
          </p>
        )}
      </div>
      <p className={`${finalTextColor} font-dmSans-medium mt-1 text-sm`}>
        {colorConfig.status}
      </p>
    </Component>
  );
}
