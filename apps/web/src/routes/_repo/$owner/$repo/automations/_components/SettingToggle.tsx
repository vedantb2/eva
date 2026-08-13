import { Switch } from "@eva/ui";

interface SettingToggleProps {
  title: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}

/**
 * A labelled on/off row for automation settings cards. The control is the
 * shared `Switch` so Neutral (near-white primary) keeps a visible knob.
 */
export function SettingToggle({
  title,
  description,
  checked,
  onChange,
}: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h3 className="text-sm font-medium">{title}</h3>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        aria-label={title}
      />
    </div>
  );
}
