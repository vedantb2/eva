import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const utilsSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "_utils.ts"),
  "utf8",
);

test("startVercelPty creates tmux shells that source sandbox env", () => {
  expect(utilsSource).toContain("/vercel/sandbox/.eva-env.sh");
  expect(utilsSource).toContain("exec bash -i");
  expect(utilsSource).toContain("tmux new-session -d -s");
});

test("startVercelPty keeps tmux output in xterm's scrollable normal buffer", () => {
  expect(utilsSource).toContain("xterm*:smcup@:rmcup@");
  expect(utilsSource).toContain("alternate-screen off");
  expect(utilsSource).toContain("status off");
  expect(utilsSource).toContain("history-limit 50000");
});
