import plugin from "tailwindcss/plugin";

/**
 * Tailwind v3 port of `shadow-plugin` (MIT, flornkm/shadow-plugin).
 *
 * The published package is v4-only — its source is entirely `@theme`,
 * `@utility` and `--value()`, none of which Tailwind 3.4 parses, so importing
 * `shadow-plugin` here emits zero classes. The package stays in
 * `package.json` as the provenance of these values; this file is what actually
 * generates them. Class names and layer geometry are kept identical to
 * upstream so the `smooth-shadow-ring` agent skill reads true in this repo.
 *
 * The idea: a single `0 1px 3px` shadow reads as a grey smudge, because real
 * occlusion falls off over distance rather than stopping. Each size below
 * stacks five or six layers whose blur roughly halves each step while opacity
 * falls, so elevation reads as depth.
 *
 * Two things are deliberately NOT ported:
 * - `smooth-ring-{color}`, which needs v4's `--value()`/`--modifier()`. Ring
 *   colour is set through the `--smooth-ring-color` variable instead, the
 *   escape hatch upstream documents.
 * - Upstream's `!important` on every utility. It exists to win v4's `@utility`
 *   ordering; in v3 `addUtilities` order already handles it, and `!important`
 *   would defeat `tailwind-merge`, which cannot see that `smooth-shadow-md`
 *   conflicts with `shadow-sm` (it is not a class tailwind-merge knows).
 *   Do not put a `shadow-*` and a `smooth-shadow-*` on the same element.
 *
 * `ring-*` DOES compose — see `shadowRule` for why that needed care.
 */

/**
 * Layer geometry per size, verbatim from upstream's `src/shadows.css`. Each
 * entry is `[<offset/blur/spread>, <opacity percent>]`; the colour is filled in
 * by `layersFor` so shadow tint stays a single knob.
 */
const RAMP = {
  xs: [["0 0 4px 0", 4]],
  sm: [
    ["0 18px 47px 0", 3],
    ["0 7.5px 19px 0", 2],
    ["0 4px 10.5px 0", 2],
    ["0 2.3px 5.8px 0", 1],
    ["0 1.2px 3.1px 0", 1],
    ["0 0.5px 1.3px 0", 1],
  ],
  md: [
    ["0 17.54px 23.39px 0", 4],
    ["0 9.4px 12.5px 0", 3],
    ["0 5.25px 7px 0", 2],
    ["0 2.79px 3.72px -2px", 1],
    ["0 1.16px 1.5px 0", 1],
  ],
  lg: [
    ["0 25px 50px 0", 5],
    ["0 12px 24px 0", 4],
    ["0 6px 12px 0", 3],
    ["0 3px 6px 0", 2],
    ["0 1.5px 3px 0", 2],
  ],
  xl: [
    ["0 40px 80px 0", 6],
    ["0 20px 40px 0", 5],
    ["0 10px 20px 0", 4],
    ["0 5px 10px 0", 3],
    ["0 2px 4px 0", 2],
  ],
  "2xl": [
    ["0 60px 120px 0", 7],
    ["0 30px 60px 0", 6],
    ["0 15px 30px 0", 5],
    ["0 7.5px 15px 0", 4],
    ["0 3px 6px 0", 3],
  ],
};

/** The hairline that `smooth-shadow-ring-*` bakes in as its outermost layer. */
const RING_LAYER = "0 0 0 1px var(--smooth-ring-color)";

function layersFor(size) {
  return RAMP[size].map(
    ([geometry, opacity]) =>
      `${geometry} color-mix(in srgb, var(--smooth-shadow-color) ${opacity}%, transparent)`,
  );
}

/**
 * Composed exactly like a native Tailwind `shadow-*`: the layers go into
 * `--tw-shadow` and `box-shadow` re-reads the ring variables. Writing
 * `box-shadow` directly would work, but it sits later in the stylesheet than
 * the core `ring-*` utilities, so it would silently delete every focus and
 * selection ring on the same element. Tailwind's base sets all three vars to
 * `0 0 #0000` on `*`, so the fallbacks are only belt-and-braces.
 *
 * `--tw-shadow-color` is what Tailwind's `shadow-{color}` utilities set, so
 * tinting composes where v3 supports it; black is the fallback otherwise.
 */
function shadowRule(layers) {
  return {
    "--smooth-shadow-color": "var(--tw-shadow-color, black)",
    "--tw-shadow": layers.join(", "),
    boxShadow:
      "var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)",
  };
}

function buildUtilities() {
  const utilities = {};

  for (const size of Object.keys(RAMP)) {
    const layers = layersFor(size);
    utilities[`.smooth-shadow-${size}`] = shadowRule(layers);
    utilities[`.smooth-shadow-ring-${size}`] = shadowRule([
      ...layers,
      RING_LAYER,
    ]);
  }

  // Bare aliases: upstream treats medium as the default size.
  utilities[".smooth-shadow"] = shadowRule(layersFor("md"));
  utilities[".smooth-shadow-ring"] = shadowRule([
    ...layersFor("md"),
    RING_LAYER,
  ]);
  // Cancels a smooth shadow inherited from a primitive without also cancelling
  // rings — core `shadow-none` cannot, because it sits earlier in the sheet.
  utilities[".smooth-shadow-none"] = shadowRule(["0 0 #0000"]);

  return utilities;
}

export default plugin(({ addBase, addUtilities }) => {
  addBase({
    /*
     * Upstream hardcodes rgba(0,0,0,0.05) light / rgba(255,255,255,0.18) dark.
     * eva points the ring at its own `--border` token instead, for two reasons:
     * the hairline then keeps exactly the weight it had as `border-border`, so
     * converting a surface changes its elevation without also changing its
     * edge; and eva has three appearances, not two, and `--border` is already
     * tuned for each (`surfaceTokens.test.ts` asserts it clears both the canvas
     * and the card tone).
     *
     * One declaration covers all three: `.dark` and `.neutral` are set on
     * <html>, the same element as `:root`, so the winning `--border` is already
     * in scope when this resolves.
     */
    ":root": { "--smooth-ring-color": "rgb(var(--border))" },
  });

  addUtilities(buildUtilities());
});
