import { SectionLabel } from "@/lib/components/theme/_components/SectionLabel";
import {
  RolePresetPicker,
  type RolePresetKey,
} from "@/lib/components/personalisation/RolePresetPicker";

interface WelcomeSetupRoleStepProps {
  activeRole: RolePresetKey | null;
  onSelect: (role: RolePresetKey | null) => void;
}

export function WelcomeSetupRoleStep({
  activeRole,
  onSelect,
}: WelcomeSetupRoleStepProps) {
  return (
    <section className="space-y-3">
      <div>
        <SectionLabel>Your role</SectionLabel>
        <p className="text-sm text-muted-foreground">
          Choose how Eva should explain work to you. This shapes communication
          style, not what code changes are made.
        </p>
      </div>
      <RolePresetPicker activeRole={activeRole} onSelect={onSelect} />
    </section>
  );
}
