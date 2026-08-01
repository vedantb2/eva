import {
  IconAlertTriangle,
  IconCheck,
  IconPlayerPlayFilled,
  IconSparkles,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@eva/ui";
import {
  MockChip,
  MockDot,
  MockLabel,
  MockLine,
  MockWindow,
} from "./MockParts";

type DiffKind = "ctx" | "add" | "del";

const DIFF_LINES: readonly {
  sign: string;
  text: string;
  kind: DiffKind;
}[] = [
  {
    sign: " ",
    text: "export function isValidPostcode(raw: string) {",
    kind: "ctx",
  },
  { sign: "-", text: "  return POSTCODE.test(raw);", kind: "del" },
  {
    sign: "+",
    text: '  const value = raw.replace(/\\s+/g, "").toUpperCase();',
    kind: "add",
  },
  { sign: "+", text: "  return POSTCODE.test(value);", kind: "add" },
  { sign: " ", text: "}", kind: "ctx" },
];

const DIFF_TONE: Record<DiffKind, string> = {
  ctx: "text-muted-foreground",
  add: "bg-success/10 text-success",
  del: "bg-destructive/10 text-destructive",
};

/** Pull request view: metadata, the diff, and the recap Eva posts back. */
export function ReviewsPreview() {
  return (
    <MockWindow
      title="acme/web · pull request #142"
      trailing={
        <span className="flex items-center gap-2 font-mono text-[10px]">
          <span className="text-success">+142</span>
          <span className="text-destructive">−38</span>
        </span>
      }
      bodyClassName="p-3.5"
    >
      <div className="flex items-center gap-2">
        <MockChip tone="success">Open</MockChip>
        <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-foreground">
          Fix checkout postcode validation
        </p>
      </div>

      <div className="mt-3 overflow-hidden rounded-md border border-border">
        <div className="border-b border-border bg-muted/40 px-2.5 py-1.5">
          <p className="truncate font-mono text-[9.5px] text-muted-foreground">
            src/checkout/validate.ts
          </p>
        </div>
        <div className="divide-y divide-border/50 font-mono text-[9.5px] leading-[1.7]">
          {DIFF_LINES.map((line) => (
            <p
              key={line.text}
              className={cn("truncate px-2.5", DIFF_TONE[line.kind])}
            >
              <span className="select-none opacity-60">{line.sign} </span>
              {line.text}
            </p>
          ))}
        </div>
      </div>

      <div className="mt-3 space-y-1.5 rounded-md border border-primary/25 bg-primary/5 p-2.5">
        <div className="flex items-center gap-1.5">
          <IconSparkles size={12} className="text-primary" aria-hidden />
          <MockLabel>Eva recap · sticky comment</MockLabel>
        </div>
        <MockLine width="w-[94%]" />
        <MockLine width="w-[72%]" />
      </div>
    </MockWindow>
  );
}

const GAPS = [
  {
    title: "Guest checkout is not implemented",
    where: "Requirement 3.2",
    tone: "danger" as const,
    label: "Critical",
  },
  {
    title: "No retry on payment timeout",
    where: "Requirement 5.1",
    tone: "warning" as const,
    label: "Major",
  },
  {
    title: "Error copy differs from the spec",
    where: "Requirement 2.4",
    tone: "neutral" as const,
    label: "Minor",
  },
];

/** Testing Arena: the codebase scored against a document's requirements. */
export function ArenaPreview() {
  return (
    <MockWindow
      title="testing arena · checkout-rework.md"
      trailing={<MockChip tone="warning">3 gaps</MockChip>}
      bodyClassName="p-3.5"
    >
      <div className="flex items-center gap-3 rounded-md border border-border bg-muted/25 px-3 py-2.5">
        <p className="text-2xl font-semibold tabular-nums text-foreground">
          14<span className="text-base text-muted-foreground">/17</span>
        </p>
        <div className="min-w-0 flex-1">
          <MockLabel>Requirements met</MockLabel>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
            <span className="block h-full w-[82%] rounded-full bg-success" />
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-1.5">
        {GAPS.map((gap) => (
          <div
            key={gap.title}
            className="flex items-center gap-2.5 rounded-md border border-border bg-card px-2.5 py-2"
          >
            <IconAlertTriangle
              size={13}
              className={cn(
                "shrink-0",
                gap.tone === "danger" ? "text-destructive" : "text-warning",
              )}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11.5px] font-medium text-foreground">
                {gap.title}
              </p>
              <p className="truncate text-[10px] text-muted-foreground">
                {gap.where}
              </p>
            </div>
            <MockChip tone={gap.tone}>{gap.label}</MockChip>
          </div>
        ))}
      </div>

      <p className="mt-3 text-center text-[10.5px] text-muted-foreground">
        Turn any gap into a task without leaving the page.
      </p>
    </MockWindow>
  );
}

const AUDIT_CATEGORIES = [
  { name: "Types", detail: "No any, unknown or assertions", pass: true },
  { name: "Tests", detail: "Changed logic has coverage", pass: true },
  {
    name: "Accessibility",
    detail: "Interactive elements are labelled",
    pass: false,
  },
  { name: "Secrets", detail: "Nothing committed in plain text", pass: true },
  { name: "Migrations", detail: "Schema changes are reversible", pass: true },
];

/** Audits: your own review checklist, run against every pull request. */
export function AuditsPreview() {
  return (
    <MockWindow
      title="acme/web · audit checklist"
      trailing={<MockChip tone="danger">1 finding</MockChip>}
      bodyClassName="p-3.5"
    >
      <div className="space-y-1.5">
        {AUDIT_CATEGORIES.map((category) => (
          <div
            key={category.name}
            className={cn(
              "flex items-center gap-2.5 rounded-md border px-2.5 py-2",
              category.pass
                ? "border-border bg-card"
                : "border-destructive/30 bg-destructive/5",
            )}
          >
            <span
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded-full",
                category.pass ? "bg-success/15" : "bg-destructive/15",
              )}
            >
              {category.pass ? (
                <IconCheck size={10} className="text-success" aria-hidden />
              ) : (
                <IconX size={10} className="text-destructive" aria-hidden />
              )}
            </span>
            <p className="shrink-0 text-[11.5px] font-medium text-foreground">
              {category.name}
            </p>
            <p className="min-w-0 flex-1 truncate text-[10.5px] text-muted-foreground">
              {category.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-muted/25 px-2.5 py-2">
        <MockDot tone="primary" pulse />
        <p className="truncate text-[10.5px] text-muted-foreground">
          Sending the accessibility finding back to the agent…
        </p>
      </div>
    </MockWindow>
  );
}

/** Proof: a recording captured from real Chrome inside the sandbox. */
export function ProofPreview() {
  return (
    <MockWindow
      title="acme/web #142 · proof"
      trailing={<MockChip tone="success">Attached to PR</MockChip>}
      bodyClassName="p-3.5"
    >
      <div className="relative overflow-hidden rounded-md border border-border bg-muted/30">
        <div className="flex items-center gap-1.5 border-b border-border bg-card px-2 py-1.5">
          <span className="flex gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-border" />
            <span className="size-1.5 rounded-full bg-border" />
          </span>
          <span className="truncate rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">
            127.0.0.1:3000/checkout
          </span>
        </div>

        <div className="space-y-2 p-3">
          <MockLine width="w-1/3" />
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5 rounded border border-border bg-card p-2">
              <MockLine width="w-2/3" tone="faint" />
              <MockLine width="w-full" tone="faint" />
            </div>
            <div className="space-y-1.5 rounded border border-border bg-card p-2">
              <MockLine width="w-1/2" tone="faint" />
              <MockLine width="w-3/4" tone="faint" />
            </div>
          </div>
          <span className="block h-6 w-24 rounded bg-primary/25" />
        </div>

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex size-9 items-center justify-center rounded-full bg-card/90 smooth-shadow-ring-sm backdrop-blur-sm">
            <IconPlayerPlayFilled
              size={13}
              className="translate-x-px text-foreground"
              aria-hidden
            />
          </span>
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <MockDot tone="danger" pulse />
        <span className="font-mono text-[10px] text-muted-foreground">
          00:12 / 00:31
        </span>
        <span className="ml-auto text-[10px] text-muted-foreground">
          Recorded in the sandbox, not on your machine
        </span>
      </div>
    </MockWindow>
  );
}
