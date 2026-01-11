import { ReactNode } from "react";

export function PageSection({
  title,
  description,
  children,
  rightSection,
  icon,
  iconColor = "icon-primary",
}: {
  title: string;
  description: string;
  children: ReactNode;
  rightSection?: ReactNode;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  iconColor?: string;
}) {
  const IconComponent = icon;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="flex items-center gap-3 mb-2">
            {/* {IconComponent && (
              <div className="p-2 rounded-xl bg-primary/20 border border-primary/30">
                <IconComponent className={iconColor} size={20} />
              </div>
            )} */}
            <h1 className="page-title">{title}</h1>
          </div>
          <p className="page-description">{description}</p>
        </div>
        {rightSection}
      </div>
      {children}
    </div>
  );
}
