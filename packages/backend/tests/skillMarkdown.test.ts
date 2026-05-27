import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseSkillMarkdown } from "../convex/_repoSkills/skillMarkdown";

const carepulseDescription = `---
name: carepulse-data-tables
description:
  CarePulse data table conventions using mantine-datatable and nuqs for
  URL-based filter and sort state. Use when creating or editing list/table
  views in apps/web.
license: MIT
---

# Body
`;

const singleLineDescription = `---
name: vercel-react-best-practices
description: React and Next.js performance optimization guidelines from Vercel Engineering.
---

# Body
`;

const foldedDescription = `---
name: example-skill
description: >
  First line of a folded description that continues
  on the next line.
---

# Body
`;

describe("parseSkillMarkdown", () => {
  it("parses YAML-indented multiline description", () => {
    const result = parseSkillMarkdown(carepulseDescription, "fallback");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.skill.title, "carepulse-data-tables");
    assert.match(result.skill.description, /CarePulse data table conventions/);
  });

  it("parses single-line description", () => {
    const result = parseSkillMarkdown(singleLineDescription, "fallback");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.skill.title, "vercel-react-best-practices");
    assert.match(result.skill.description, /React and Next\.js/);
  });

  it("parses folded description block", () => {
    const result = parseSkillMarkdown(foldedDescription, "fallback");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.skill.title, "example-skill");
    assert.match(result.skill.description, /folded description/);
  });

  it("rejects missing frontmatter", () => {
    const result = parseSkillMarkdown("# No frontmatter", "fallback");
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "no_frontmatter");
  });

  it("rejects empty description", () => {
    const result = parseSkillMarkdown(
      `---
name: empty-desc
description:
license: MIT
---
`,
      "fallback",
    );
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.reason, "missing_description");
  });
});
