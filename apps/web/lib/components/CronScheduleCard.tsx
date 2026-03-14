import cronstrue from "cronstrue";
import { CronExpressionParser } from "cron-parser";
import { Input } from "@conductor/ui";

function describeCron(
  expression: string,
): { valid: true; text: string } | { valid: false; partial: boolean } {
  const parts = expression.trim().split(/\s+/);
  if (parts.length < 5) return { valid: false, partial: true };
  try {
    return {
      valid: true,
      text: cronstrue.toString(expression, { use24HourTimeFormat: false }),
    };
  } catch {
    return { valid: false, partial: false };
  }
}

function nextCronDate(expression: string): string | null {
  try {
    const iter = CronExpressionParser.parse(expression, { tz: "UTC" });
    const next = iter.next().toDate();
    return next.toLocaleString("en-GB", {
      timeZone: "UTC",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

interface CronScheduleCardProps {
  value: string;
  onChange: (value: string) => void;
  allowManual?: boolean;
}

export function CronScheduleCard({
  value,
  onChange,
  allowManual = false,
}: CronScheduleCardProps) {
  const displayValue = allowManual && value === "manual" ? "" : value;
  const schedule = allowManual ? value : value || "";

  return (
    <div className="rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4">
      <h3 className="text-sm font-medium">Cron Schedule</h3>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
          Schedule (cron expression)
        </label>
        <CronPreview schedule={schedule} allowManual={allowManual} />
        <Input
          className="h-8 text-xs font-mono text-center"
          placeholder={
            allowManual ? "0 6 * * * (leave empty for manual)" : "0 6 * * *"
          }
          value={displayValue}
          onChange={(e) => {
            if (allowManual) {
              onChange(e.target.value || "manual");
            } else {
              onChange(e.target.value);
            }
          }}
          onBlur={() => {
            if (allowManual) {
              onChange(value.trim() || "manual");
            } else {
              onChange(value.trim());
            }
          }}
        />
        <p className="mt-1 text-[11px] text-muted-foreground">
          Standard cron format (UTC). Examples: <code>0 6 * * *</code> (daily at
          6am), <code>0 6 * * 1</code> (weekly Monday at 6am),{" "}
          <code>0 */6 * * *</code> (every 6 hours)
          {allowManual && ". Leave empty for manual only."}
        </p>
        <CronGuide />
      </div>
    </div>
  );
}

function CronPreview({
  schedule,
  allowManual,
}: {
  schedule: string;
  allowManual: boolean;
}) {
  if (allowManual && schedule === "manual") {
    return (
      <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
        <p className="text-sm text-muted-foreground">Manual only</p>
      </div>
    );
  }

  if (!schedule) return null;

  const result = describeCron(schedule);

  if (!result.valid) {
    return (
      <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
        <p className="text-sm text-muted-foreground">
          {result.partial
            ? "Type a cron expression..."
            : "Invalid cron expression"}
        </p>
      </div>
    );
  }

  const next = nextCronDate(schedule);

  return (
    <div className="mb-2 rounded-md bg-muted/50 px-3 py-2 text-center">
      <p className="text-lg font-medium">{result.text}</p>
      {next && (
        <p className="text-[11px] text-muted-foreground">next at {next} UTC</p>
      )}
    </div>
  );
}

function CronGuide() {
  return (
    <div className="mt-3 rounded-md bg-muted/40 overflow-hidden">
      <div className="bg-muted/30 px-3 py-1.5">
        <p className="text-[11px] font-medium text-muted-foreground">
          Cron format reference
        </p>
      </div>
      <div className="p-2 flex flex-col gap-3 sm:flex-row sm:gap-6 sm:p-3">
        <pre className="overflow-x-auto font-mono text-[11px] text-muted-foreground leading-relaxed shrink-0">
          {"┌─ minute (0-59)\n"}
          {"│ ┌─ hour (0-23)\n"}
          {"│ │ ┌─ day of month (1-31)\n"}
          {"│ │ │ ┌─ month (1-12)\n"}
          {"│ │ │ │ ┌─ day of week (0-6)\n"}
          {"* * * * *"}
        </pre>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] content-start sm:gap-x-4">
          {(
            [
              ["*", "any value"],
              [",", "list separator"],
              ["-", "range"],
              ["/", "step values"],
              ["0-6", "day of week range"],
              ["SUN-SAT", "day names"],
            ] as const
          ).map(([symbol, desc]) => (
            <div key={symbol} className="contents">
              <span className="font-mono text-foreground/70">{symbol}</span>
              <span className="text-muted-foreground">{desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export { describeCron };
