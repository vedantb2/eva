import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, test, vi } from "vitest";
import { FONT_FAMILIES } from "./themeTokens";
import { GOOGLE_FONT_HREFS } from "./googleFonts";

const here = dirname(fileURLToPath(import.meta.url));
const indexHtml = readFileSync(join(here, "../../../index.html"), "utf8");
const themeContext = readFileSync(join(here, "ThemeContext.tsx"), "utf8");
const typographySection = readFileSync(
  join(here, "..", "components", "theme", "_components", "TypographySection.tsx"),
  "utf8",
);

const googleHrefCount = Object.values(GOOGLE_FONT_HREFS).filter(
  (href) => href !== null,
).length;

describe("GOOGLE_FONT_HREFS", () => {
  test("covers every picker family and leaves Geist without a Google file", () => {
    expect(Object.keys(GOOGLE_FONT_HREFS).sort()).toEqual(
      Object.keys(FONT_FAMILIES).sort(),
    );
    expect(GOOGLE_FONT_HREFS.geist).toBeNull();
    expect(GOOGLE_FONT_HREFS.inter).toContain("family=Inter:wght@400;500;600;700");
  });
});

describe("index.html boot loads one family", () => {
  test("does not request the 12-family kitchen-sink stylesheet", () => {
    expect(indexHtml).not.toContain("family=DM+Sans:wght@100..1000");
    expect(indexHtml).not.toContain("family=Inter:wght@100..900");
  });

  test("boot map stays in sync with GOOGLE_FONT_HREFS", () => {
    for (const href of Object.values(GOOGLE_FONT_HREFS)) {
      if (href === null) continue;
      expect(indexHtml).toContain(href);
    }
    expect(indexHtml).toContain("var fontHrefs = {");
    expect(indexHtml).toContain('fontLink.setAttribute("data-eva-font-href"');
    // An early return in the hint block used to skip Inter on first visit.
    expect(indexHtml).not.toContain("if (!raw) return;");
  });
});

test("theme apply and the picker load fonts without a new effect", () => {
  expect(themeContext).toContain("ensureGoogleFont(fontFamily)");
  expect(typographySection).toContain("preloadGoogleFontsForPicker()");
});

describe("ensureGoogleFont", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  test("injects a stylesheet once per href and skips Geist", async () => {
    vi.resetModules();
    type FontLink = {
      rel: string;
      href: string;
      media: string;
      onload: (() => void) | null;
      setAttribute: (name: string, value: string) => void;
    };
    const created: FontLink[] = [];
    const headLinks: { getAttribute: (name: string) => string | null }[] = [];
    vi.stubGlobal("document", {
      querySelectorAll: () => headLinks,
      createElement: (tag: string) => {
        expect(tag).toBe("link");
        const el: FontLink = {
          rel: "",
          href: "",
          media: "",
          onload: null,
          setAttribute: (name: string, value: string) => {
            if (name === "data-eva-font-href") {
              headLinks.push({
                getAttribute: (key: string) =>
                  key === "data-eva-font-href" ? value : null,
              });
            }
          },
        };
        created.push(el);
        return el;
      },
      head: {
        appendChild: () => undefined,
      },
    });
    const fonts = await import("./googleFonts");
    fonts.ensureGoogleFont("geist");
    expect(created).toHaveLength(0);
    fonts.ensureGoogleFont("inter");
    fonts.ensureGoogleFont("inter");
    expect(created).toHaveLength(1);
    expect(created[0]?.href).toBe(GOOGLE_FONT_HREFS.inter);
    fonts.preloadGoogleFontsForPicker();
    fonts.preloadGoogleFontsForPicker();
    expect(created).toHaveLength(googleHrefCount);
  });
});
