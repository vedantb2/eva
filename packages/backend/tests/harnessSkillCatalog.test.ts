import { describe, expect, it } from "vitest";
import {
  filterHarnessCommands,
  isHarnessCatalogUnchanged,
  type ReportedHarnessCommand,
} from "../convex/_harnessSkills/filter";

function command(
  name: string,
  description = "does a thing",
): ReportedHarnessCommand {
  return { name, description };
}

describe("filterHarnessCommands", () => {
  it("keeps prompt skills the CLI adds without a code change here", () => {
    // Denylist, not allowlist: a name nobody has heard of still lands.
    expect(
      filterHarnessCommands([command("loop"), command("brand-new-skill")]).map(
        (skill) => skill.name,
      ),
    ).toEqual(["brand-new-skill", "loop"]);
  });

  it("drops terminal-UI and orchestration-fighting commands", () => {
    const names = filterHarnessCommands([
      command("clear"),
      command("config"),
      command("context"),
      command("usage"),
      command("agents"),
      command("debug"),
      command("heapdump"),
      command("insights"),
      command("recap"),
      command("reload-skills"),
      command("batch"),
      command("team-onboarding"),
      command("fewer-permission-prompts"),
      command("update-config"),
      command("run-skill-generator"),
      command("review"),
    ]).map((skill) => skill.name);
    expect(names).toEqual(["review"]);
  });

  it("drops the CLI's internal `__`-prefixed plumbing", () => {
    expect(filterHarnessCommands([command("__internal-probe")])).toEqual([]);
  });

  it("rejects names that would break the chip token grammar", () => {
    // 24 chars fits `evabuiltinskill_` + name in the 40-char id cap; 25 does not.
    expect(
      filterHarnessCommands([command("a".repeat(24))]).map((s) => s.name),
    ).toEqual(["a".repeat(24)]);
    expect(filterHarnessCommands([command("a".repeat(25))])).toEqual([]);
    // Only lowercase letters, digits and dashes, starting with a letter.
    expect(filterHarnessCommands([command("Review")])).toEqual([]);
    expect(filterHarnessCommands([command("2fast")])).toEqual([]);
    expect(filterHarnessCommands([command("some_skill")])).toEqual([]);
    expect(filterHarnessCommands([command("")])).toEqual([]);
  });

  it("takes the first line of a description and caps its length", () => {
    const [firstLine] = filterHarnessCommands([
      { name: "verify", description: "  Run it end to end  \nThen report\n" },
    ]);
    expect(firstLine?.description).toBe("Run it end to end");

    const [capped] = filterHarnessCommands([
      { name: "deep-research", description: "x".repeat(400) },
    ]);
    expect(capped?.description).toHaveLength(200);
  });

  it("keeps argument hints but omits blank ones", () => {
    expect(
      filterHarnessCommands([
        { name: "loop", description: "d", argumentHint: " 5m /foo " },
        { name: "goal", description: "d", argumentHint: "   " },
      ]),
    ).toEqual([
      { name: "goal", description: "d" },
      { name: "loop", description: "d", argumentHint: "5m /foo" },
    ]);
  });

  it("dedupes by name and sorts, so reports compare positionally", () => {
    expect(
      filterHarnessCommands([
        command("zeta"),
        command("loop", "first wins"),
        command("loop", "second loses"),
      ]),
    ).toEqual([
      { name: "loop", description: "first wins" },
      { name: "zeta", description: "does a thing" },
    ]);
  });
});

describe("isHarnessCatalogUnchanged", () => {
  const skills = [
    { name: "loop", description: "d", argumentHint: "5m" },
    { name: "review", description: "d" },
  ];

  it("recognizes an identical report so the global row is not rewritten", () => {
    expect(
      isHarnessCatalogUnchanged(
        { cliVersion: "2.1.239", skills },
        { cliVersion: "2.1.239", skills: [...skills] },
      ),
    ).toBe(true);
  });

  it("writes when the CLI version, the list, or a single field moves", () => {
    expect(
      isHarnessCatalogUnchanged(
        { cliVersion: "2.1.239", skills },
        { cliVersion: "2.1.240", skills },
      ),
    ).toBe(false);
    expect(
      isHarnessCatalogUnchanged(
        { cliVersion: "2.1.239", skills },
        { cliVersion: "2.1.239", skills: skills.slice(0, 1) },
      ),
    ).toBe(false);
    expect(
      isHarnessCatalogUnchanged(
        { cliVersion: "2.1.239", skills },
        {
          cliVersion: "2.1.239",
          skills: [{ ...skills[0], description: "reworded" }, skills[1]],
        },
      ),
    ).toBe(false);
    expect(
      isHarnessCatalogUnchanged(
        { cliVersion: "2.1.239", skills },
        {
          cliVersion: "2.1.239",
          skills: [{ name: "loop", description: "d" }, skills[1]],
        },
      ),
    ).toBe(false);
  });
});
