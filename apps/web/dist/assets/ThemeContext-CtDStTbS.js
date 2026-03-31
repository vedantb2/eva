import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { c as i, n as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
var s = e(t(), 1),
  c = (0, s.createContext)({
    theme: `light`,
    resolvedTheme: `light`,
    setTheme: () => {},
  });
function l() {
  return (0, s.useContext)(c);
}
var u = r(),
  d = n(),
  f = {
    accentColor: `teal`,
    radius: `md`,
    fontFamily: `inter`,
    letterSpacing: `normal`,
  };
function p(e) {
  return {
    accentColor: e.accentColor ?? f.accentColor,
    radius: e.radius ?? f.radius,
    fontFamily: e.fontFamily ?? f.fontFamily,
    letterSpacing: e.letterSpacing ?? f.letterSpacing,
  };
}
var m = {
    inter: {
      label: `Inter`,
      variable: `--font-inter`,
      stack: `Inter, ui-sans-serif, system-ui, sans-serif`,
    },
    roboto: {
      label: `Roboto`,
      variable: `--font-roboto`,
      stack: `Roboto, ui-sans-serif, system-ui, sans-serif`,
    },
    poppins: {
      label: `Poppins`,
      variable: `--font-poppins`,
      stack: `Poppins, ui-sans-serif, system-ui, sans-serif`,
    },
    "dm-sans": {
      label: `DM Sans`,
      variable: `--font-dm-sans`,
      stack: `'DM Sans', ui-sans-serif, system-ui, sans-serif`,
    },
    "space-grotesk": {
      label: `Space Grotesk`,
      variable: `--font-space-grotesk`,
      stack: `'Space Grotesk', ui-sans-serif, system-ui, sans-serif`,
    },
    geist: {
      label: `Geist`,
      variable: `--font-geist-sans`,
      stack: `'Geist Sans', ui-sans-serif, system-ui, sans-serif`,
    },
    "source-serif": {
      label: `Source Serif`,
      variable: `--font-source-serif`,
      stack: `'Source Serif 4', Georgia, 'Times New Roman', serif`,
    },
    jakarta: {
      label: `Jakarta Sans`,
      variable: `--font-jakarta`,
      stack: `'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif`,
    },
    outfit: {
      label: `Outfit`,
      variable: `--font-outfit`,
      stack: `Outfit, ui-sans-serif, system-ui, sans-serif`,
    },
    nunito: {
      label: `Nunito`,
      variable: `--font-nunito`,
      stack: `Nunito, ui-sans-serif, system-ui, sans-serif`,
    },
    "ibm-plex": {
      label: `IBM Plex Sans`,
      variable: `--font-ibm-plex`,
      stack: `'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif`,
    },
    figtree: {
      label: `Figtree`,
      variable: `--font-figtree`,
      stack: `Figtree, ui-sans-serif, system-ui, sans-serif`,
    },
  },
  h = (0, s.createContext)(void 0),
  g = {
    teal: {
      label: `Teal`,
      preview: `#0D8478`,
      light: {
        primary: `13 132 120`,
        foreground: `255 255 255`,
        accent: `224 240 236`,
        accentFg: `10 90 81`,
      },
      dark: {
        primary: `52 199 181`,
        foreground: `8 23 20`,
        accent: `34 47 44`,
        accentFg: `214 233 228`,
      },
    },
    blue: {
      label: `Blue`,
      preview: `#2563EB`,
      light: {
        primary: `37 99 235`,
        foreground: `255 255 255`,
        accent: `219 234 254`,
        accentFg: `29 78 216`,
      },
      dark: {
        primary: `96 165 250`,
        foreground: `8 18 40`,
        accent: `22 36 60`,
        accentFg: `191 219 254`,
      },
    },
    purple: {
      label: `Purple`,
      preview: `#7C3AED`,
      light: {
        primary: `124 58 237`,
        foreground: `255 255 255`,
        accent: `237 233 254`,
        accentFg: `91 33 182`,
      },
      dark: {
        primary: `167 139 250`,
        foreground: `18 8 40`,
        accent: `38 28 58`,
        accentFg: `221 214 254`,
      },
    },
    rose: {
      label: `Rose`,
      preview: `#E11D48`,
      light: {
        primary: `225 29 72`,
        foreground: `255 255 255`,
        accent: `255 228 230`,
        accentFg: `159 18 57`,
      },
      dark: {
        primary: `251 113 133`,
        foreground: `40 8 18`,
        accent: `58 20 30`,
        accentFg: `253 164 175`,
      },
    },
    orange: {
      label: `Orange`,
      preview: `#EA580C`,
      light: {
        primary: `234 88 12`,
        foreground: `255 255 255`,
        accent: `255 237 213`,
        accentFg: `154 52 18`,
      },
      dark: {
        primary: `251 146 60`,
        foreground: `40 18 8`,
        accent: `58 30 12`,
        accentFg: `253 186 116`,
      },
    },
    green: {
      label: `Green`,
      preview: `#15803D`,
      light: {
        primary: `21 128 61`,
        foreground: `255 255 255`,
        accent: `220 252 231`,
        accentFg: `21 128 61`,
      },
      dark: {
        primary: `74 222 128`,
        foreground: `8 30 18`,
        accent: `18 46 28`,
        accentFg: `187 247 208`,
      },
    },
    amber: {
      label: `Amber`,
      preview: `#D97706`,
      light: {
        primary: `217 119 6`,
        foreground: `255 255 255`,
        accent: `254 243 199`,
        accentFg: `146 64 14`,
      },
      dark: {
        primary: `251 191 36`,
        foreground: `26 19 4`,
        accent: `55 37 10`,
        accentFg: `253 230 138`,
      },
    },
    cyan: {
      label: `Cyan`,
      preview: `#0891B2`,
      light: {
        primary: `8 145 178`,
        foreground: `255 255 255`,
        accent: `207 250 254`,
        accentFg: `22 78 99`,
      },
      dark: {
        primary: `34 211 238`,
        foreground: `4 26 34`,
        accent: `12 54 70`,
        accentFg: `165 243 252`,
      },
    },
    pink: {
      label: `Pink`,
      preview: `#DB2777`,
      light: {
        primary: `219 39 119`,
        foreground: `255 255 255`,
        accent: `252 231 243`,
        accentFg: `157 23 77`,
      },
      dark: {
        primary: `244 114 182`,
        foreground: `40 8 22`,
        accent: `62 20 42`,
        accentFg: `251 207 232`,
      },
    },
    indigo: {
      label: `Indigo`,
      preview: `#4F46E5`,
      light: {
        primary: `79 70 229`,
        foreground: `255 255 255`,
        accent: `224 231 255`,
        accentFg: `55 48 163`,
      },
      dark: {
        primary: `129 140 248`,
        foreground: `12 10 40`,
        accent: `30 27 75`,
        accentFg: `199 210 254`,
      },
    },
    red: {
      label: `Red`,
      preview: `#DC2626`,
      light: {
        primary: `220 38 38`,
        foreground: `255 255 255`,
        accent: `254 226 226`,
        accentFg: `153 27 27`,
      },
      dark: {
        primary: `248 113 113`,
        foreground: `40 8 8`,
        accent: `58 20 20`,
        accentFg: `254 202 202`,
      },
    },
  },
  _ = {
    none: `0rem`,
    sm: `0.25rem`,
    md: `0.5rem`,
    lg: `0.75rem`,
    xl: `1rem`,
    full: `9999px`,
  },
  v = {
    tighter: { label: `Tighter`, value: `-0.04em` },
    tight: { label: `Tight`, value: `-0.02em` },
    normal: { label: `Normal`, value: `-0.012em` },
    wide: { label: `Wide`, value: `0.01em` },
    wider: { label: `Wider`, value: `0.03em` },
  };
function y(e, t) {
  let n = e.accentColor ?? `teal`,
    r = e.radius ?? `md`,
    i = e.fontFamily ?? `inter`,
    a = e.letterSpacing ?? `normal`;
  if (
    (document.documentElement.style.setProperty(`--radius`, _[r]),
    document.documentElement.style.setProperty(`--font-sans`, m[i].stack),
    document.documentElement.style.setProperty(`--tracking-normal`, v[a].value),
    n === `teal`)
  ) {
    let e = document.getElementById(`custom-theme-accent`);
    e && e.remove();
    return;
  }
  let o = g[n];
  t ? o.dark : o.light;
  let s = document.getElementById(`custom-theme-accent`),
    c;
  (s instanceof HTMLStyleElement
    ? (c = s)
    : ((c = document.createElement(`style`)),
      (c.id = `custom-theme-accent`),
      document.head.appendChild(c)),
    (c.textContent = `
    :root {
      --primary: ${o.light.primary};
      --primary-foreground: ${o.light.foreground};
      --ring: ${o.light.primary};
      --chart-1: ${o.light.primary};
      --accent: ${o.light.accent};
      --accent-foreground: ${o.light.accentFg};
      --sidebar-primary: ${o.light.primary};
      --sidebar-primary-foreground: ${o.light.foreground};
      --sidebar-ring: ${o.light.primary};
      --sidebar-accent-foreground: ${o.light.accentFg};
    }
    .dark {
      --primary: ${o.dark.primary};
      --primary-foreground: ${o.dark.foreground};
      --ring: ${o.dark.primary};
      --chart-1: ${o.dark.primary};
      --accent: ${o.dark.accent};
      --accent-foreground: ${o.dark.accentFg};
      --sidebar-primary: ${o.dark.primary};
      --sidebar-primary-foreground: ${o.dark.foreground};
      --sidebar-ring: ${o.dark.primary};
      --sidebar-accent-foreground: ${o.dark.accentFg};
    }
  `));
}
function b(e) {
  let t = (0, u.c)(33),
    { children: n } = e,
    { theme: r, setTheme: c } = l(),
    [f, p] = (0, s.useState)(!1),
    m = o(a.auth.getTheme),
    g = i(a.auth.setTheme),
    _ = o(a.auth.getCustomTheme),
    v = i(a.auth.setCustomTheme),
    b,
    x;
  (t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((b = () => {
        p(!0);
      }),
      (x = []),
      (t[0] = b),
      (t[1] = x))
    : ((b = t[0]), (x = t[1])),
    (0, s.useEffect)(b, x));
  let S;
  t[2] !== c || t[3] !== m || t[4] !== r
    ? ((S = () => {
        m != null && m !== r && c(m);
      }),
      (t[2] = c),
      (t[3] = m),
      (t[4] = r),
      (t[5] = S))
    : (S = t[5]);
  let C;
  (t[6] === m ? (C = t[7]) : ((C = [m]), (t[6] = m), (t[7] = C)),
    (0, s.useEffect)(S, C));
  let w, T;
  (t[8] !== _ || t[9] !== r
    ? ((w = () => {
        _ !== void 0 && y(_ ?? {}, r === `dark`);
      }),
      (T = [_, r]),
      (t[8] = _),
      (t[9] = r),
      (t[10] = w),
      (t[11] = T))
    : ((w = t[10]), (T = t[11])),
    (0, s.useEffect)(w, T));
  let E;
  t[12] !== c || t[13] !== g
    ? ((E = (e) => {
        (c(e), (e === `light` || e === `dark`) && g({ theme: e }));
      }),
      (t[12] = c),
      (t[13] = g),
      (t[14] = E))
    : (E = t[14]);
  let D = E,
    O;
  t[15] !== D || t[16] !== r
    ? ((O = () => {
        D(r === `dark` ? `light` : `dark`);
      }),
      (t[15] = D),
      (t[16] = r),
      (t[17] = O))
    : (O = t[17]);
  let k = O,
    A;
  t[18] !== v || t[19] !== r
    ? ((A = (e) => {
        (v({ customTheme: e }), y(e, r === `dark`));
      }),
      (t[18] = v),
      (t[19] = r),
      (t[20] = A))
    : (A = t[20]);
  let j = A,
    M;
  t[21] === _ ? (M = t[22]) : ((M = _ ?? {}), (t[21] = _), (t[22] = M));
  let N = M,
    P = r || `dark`,
    F;
  t[23] !== N ||
  t[24] !== f ||
  t[25] !== j ||
  t[26] !== D ||
  t[27] !== P ||
  t[28] !== k
    ? ((F = {
        theme: P,
        setTheme: D,
        toggleTheme: k,
        mounted: f,
        customTheme: N,
        setCustomTheme: j,
      }),
      (t[23] = N),
      (t[24] = f),
      (t[25] = j),
      (t[26] = D),
      (t[27] = P),
      (t[28] = k),
      (t[29] = F))
    : (F = t[29]);
  let I;
  return (
    t[30] !== n || t[31] !== F
      ? ((I = (0, d.jsx)(h.Provider, { value: F, children: n })),
        (t[30] = n),
        (t[31] = F),
        (t[32] = I))
      : (I = t[32]),
    I
  );
}
function x() {
  let e = (0, s.useContext)(h);
  if (e === void 0)
    throw Error(`useThemeContext must be used within a ThemeProvider`);
  return e;
}
export { p as a, l as c, b as i, m as n, x as o, v as r, c as s, g as t };
