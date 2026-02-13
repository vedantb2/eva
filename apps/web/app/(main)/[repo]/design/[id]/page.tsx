import { readFileSync } from "fs";
import { join } from "path";
import { themeExtend } from "@/lib/tailwind-theme";
import { DesignDetailClient } from "./DesignDetailClient";

const BODY_RESET = `*, *::before, *::after { box-sizing: border-box; border-color: oklch(var(--border)); }
body { margin: 0; padding: 0; background-color: oklch(var(--background)); color: oklch(var(--foreground)); font-family: Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.015em; -webkit-font-smoothing: antialiased; }`;

function getSandpackConfig() {
  const css = readFileSync(join(process.cwd(), "app/globals.css"), "utf8");
  const rootMatch = css.match(/:root\s*\{[^}]*\}/);
  const darkMatch = css.match(/\.dark\s*\{[^}]*\}/);

  const tailwindJson = JSON.stringify(
    { theme: { extend: themeExtend } },
    null,
    2,
  ).replace(/ \/ <alpha-value>\)/g, ")");

  return {
    stylesCss: [rootMatch?.[0] ?? "", darkMatch?.[0] ?? "", BODY_RESET].join(
      "\n",
    ),
    tailwindConfig: `tailwind.config = ${tailwindJson};`,
    externalResources: [
      "https://cdn.tailwindcss.com",
      "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
    ],
  };
}

export default async function DesignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sandpackConfig = getSandpackConfig();
  return (
    <DesignDetailClient designSessionId={id} sandpackConfig={sandpackConfig} />
  );
}
