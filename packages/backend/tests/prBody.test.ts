import { expect, test } from "vitest";
import {
  buildPrBody,
  buildProjectPrSections,
  buildTaskPrSections,
} from "../convex/prBody";

test("buildTaskPrSections numbers change requests and formats image/video proofs", () => {
  const sections = buildTaskPrSections(
    "Ship the toggle",
    ["Bump contrast", "Fix focus ring"],
    [
      {
        fileName: "ui.png",
        message: null,
        url: "https://cdn.example/ui.png",
        contentType: "image/png",
      },
      {
        fileName: "walk.mp4",
        message: null,
        url: "https://cdn.example/walk.mp4",
        contentType: "video/mp4",
      },
      {
        fileName: null,
        message: "Manual check passed",
        url: null,
        contentType: null,
      },
    ],
  );

  expect(sections).toEqual([
    { heading: "Task", content: "Ship the toggle" },
    {
      heading: "Change Requests",
      content: "1. Bump contrast\n2. Fix focus ring",
    },
    {
      heading: "Proof",
      content:
        "![ui.png](https://cdn.example/ui.png)\n- [walk.mp4](https://cdn.example/walk.mp4) (video)\n- Manual check passed",
    },
  ]);
});

test("buildProjectPrSections lists completed tasks with optional descriptions", () => {
  expect(
    buildProjectPrSections("Carepulse rollout", "Phase 1", [
      { title: "Login", description: "SSO flow" },
      { title: "Dashboard", description: undefined },
    ]),
  ).toEqual([
    {
      heading: "Project",
      content: "**Carepulse rollout**\n\nPhase 1",
    },
    {
      heading: "Completed Tasks",
      content: "1. **Login** — SSO flow\n2. **Dashboard**",
    },
  ]);
});

test("buildPrBody joins sections and appends Eva footer link", () => {
  const body = buildPrBody(
    [{ heading: "Task", content: "Hello" }],
    "https://eva.example.com/task/1",
  );
  expect(body).toContain("## Task\nHello\n");
  expect(body).toContain(
    "[View in Eva](https://eva.example.com/task/1) | *Created by Eva*",
  );
});
