import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import {
  a as n,
  c as r,
  n as i,
  o as a,
  r as o,
  t as s,
} from "./ThemeContext-CtDStTbS.js";
import { Dr as c, Kt as l, Tr as u } from "./src-DzioQSsH.js";
import { t as d } from "./IconDeviceDesktop-DW-nbygi.js";
import { n as f, t as p } from "./IconSun-BhHhWZQ7.js";
import { t as m } from "./PageWrapper-Z5X-C4Rx.js";
var h = t(),
  g = e();
function _(e) {
  let t = (0, h.c)(2),
    { children: n } = e,
    r;
  return (
    t[0] === n
      ? (r = t[1])
      : ((r = (0, g.jsx)(`p`, {
          className: `mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground`,
          children: n,
        })),
        (t[0] = n),
        (t[1] = r)),
    r
  );
}
function v(e) {
  let t = (0, h.c)(5),
    { currentMode: n, onModeChange: r } = e,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, g.jsx)(_, { children: `Appearance` })), (t[0] = i))
    : (i = t[0]);
  let a;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = [`light`, `dark`, `system`]), (t[1] = a))
    : (a = t[1]);
  let o;
  return (
    t[2] !== n || t[3] !== r
      ? ((o = (0, g.jsxs)(`section`, {
          children: [
            i,
            (0, g.jsx)(`div`, {
              className: `grid grid-cols-3 gap-2 sm:gap-3`,
              children: a.map((e) => {
                let t = n === e,
                  i = e === `light` ? p : e === `dark` ? f : d,
                  a =
                    e === `light` ? `Light` : e === `dark` ? `Dark` : `System`;
                return (0, g.jsxs)(
                  `button`,
                  {
                    onClick: () => r(e),
                    className: c(
                      `relative flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all sm:gap-3 sm:p-4 sm:text-sm`,
                      t
                        ? `bg-primary/8 text-primary ring-1 ring-primary/20`
                        : `bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground`,
                    ),
                    children: [
                      t &&
                        (0, g.jsx)(`span`, {
                          className: `absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground`,
                          children: (0, g.jsx)(u, { size: 10, strokeWidth: 3 }),
                        }),
                      (0, g.jsx)(`div`, {
                        className: c(
                          `flex h-12 w-full items-center justify-center rounded-lg sm:h-16`,
                          e === `light`
                            ? `bg-white`
                            : e === `dark`
                              ? `bg-zinc-900`
                              : `bg-gradient-to-br from-white to-zinc-900`,
                        ),
                        children: (0, g.jsx)(i, {
                          size: 22,
                          className:
                            e === `light`
                              ? `text-amber-500`
                              : e === `dark`
                                ? `text-blue-300`
                                : `text-muted-foreground`,
                        }),
                      }),
                      a,
                    ],
                  },
                  e,
                );
              }),
            }),
          ],
        })),
        (t[2] = n),
        (t[3] = r),
        (t[4] = o))
      : (o = t[4]),
    o
  );
}
var y = [
  {
    name: `Default`,
    theme: {
      accentColor: `indigo`,
      fontFamily: `geist`,
      radius: `md`,
      letterSpacing: `tight`,
    },
    previewColor: `#4F46E5`,
  },
  {
    name: `Modern`,
    theme: {
      accentColor: `blue`,
      fontFamily: `inter`,
      radius: `xl`,
      letterSpacing: `tight`,
    },
    previewColor: `#2563EB`,
  },
  {
    name: `Formal`,
    theme: {
      accentColor: `orange`,
      fontFamily: `source-serif`,
      radius: `md`,
      letterSpacing: `normal`,
    },
    previewColor: `#EA580C`,
  },
  {
    name: `Cool`,
    theme: {
      accentColor: `green`,
      fontFamily: `jakarta`,
      radius: `lg`,
      letterSpacing: `normal`,
    },
    previewColor: `#15803D`,
  },
];
function b(e, t) {
  return (
    e.accentColor === t.accentColor &&
    e.fontFamily === t.fontFamily &&
    e.radius === t.radius &&
    e.letterSpacing === t.letterSpacing
  );
}
function x(e) {
  let t = (0, h.c)(6),
    { currentTheme: n, onApplyPreset: r } = e,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, g.jsx)(_, { children: `Presets` })), (t[0] = i))
    : (i = t[0]);
  let a;
  t[1] !== n || t[2] !== r
    ? ((a = y.map((e) => {
        let t = b(e.theme, n);
        return (0, g.jsxs)(
          `button`,
          {
            onClick: () => r(e.theme),
            className: c(
              `relative flex flex-col items-center gap-2 rounded-xl p-3 text-xs font-medium transition-all sm:gap-3 sm:p-4 sm:text-sm`,
              t
                ? `bg-primary/8 text-primary ring-1 ring-primary/20`
                : `bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground`,
            ),
            children: [
              t &&
                (0, g.jsx)(`span`, {
                  className: `absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground`,
                  children: (0, g.jsx)(u, { size: 10, strokeWidth: 3 }),
                }),
              (0, g.jsx)(`span`, {
                className: `h-4 w-4 shrink-0 rounded-full`,
                style: { backgroundColor: e.previewColor },
              }),
              e.name,
            ],
          },
          e.name,
        );
      })),
      (t[1] = n),
      (t[2] = r),
      (t[3] = a))
    : (a = t[3]);
  let o;
  return (
    t[4] === a
      ? (o = t[5])
      : ((o = (0, g.jsxs)(`section`, {
          children: [
            i,
            (0, g.jsx)(`div`, {
              className: `grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3`,
              children: a,
            }),
          ],
        })),
        (t[4] = a),
        (t[5] = o)),
    o
  );
}
function S(e) {
  let t = (0, h.c)(8),
    { active: n, onClick: r, children: i, className: a, title: o } = e,
    s = n
      ? `bg-primary/8 text-foreground ring-1 ring-primary/20`
      : `bg-card/60 text-muted-foreground hover:bg-muted/60 hover:text-foreground`,
    l;
  t[0] !== a || t[1] !== s
    ? ((l = c(
        `flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium transition-all sm:gap-2.5 sm:px-3.5 sm:py-2.5 sm:text-sm`,
        s,
        a,
      )),
      (t[0] = a),
      (t[1] = s),
      (t[2] = l))
    : (l = t[2]);
  let u;
  return (
    t[3] !== i || t[4] !== r || t[5] !== l || t[6] !== o
      ? ((u = (0, g.jsx)(`button`, {
          onClick: r,
          title: o,
          className: l,
          children: i,
        })),
        (t[3] = i),
        (t[4] = r),
        (t[5] = l),
        (t[6] = o),
        (t[7] = u))
      : (u = t[7]),
    u
  );
}
function C(e) {
  let t = (0, h.c)(5),
    { accentColor: n, onAccentChange: r } = e,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, g.jsx)(_, { children: `Accent Color` })), (t[0] = i))
    : (i = t[0]);
  let a;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = Object.entries(s)), (t[1] = a))
    : (a = t[1]);
  let o;
  return (
    t[2] !== n || t[3] !== r
      ? ((o = (0, g.jsxs)(`section`, {
          children: [
            i,
            (0, g.jsx)(`div`, {
              className: `flex flex-wrap gap-2 sm:gap-3`,
              children: a.map((e) => {
                let [t, i] = e,
                  a = n === t;
                return (0, g.jsxs)(
                  S,
                  {
                    active: a,
                    onClick: () => r(t),
                    title: i.label,
                    className: `group relative`,
                    children: [
                      (0, g.jsx)(`span`, {
                        className: c(
                          `relative flex h-5 w-5 shrink-0 items-center justify-center rounded-full transition-transform group-hover:scale-110`,
                          a && `scale-110`,
                        ),
                        style: { backgroundColor: i.preview },
                        children:
                          a &&
                          (0, g.jsx)(u, {
                            size: 11,
                            className: `text-white`,
                            strokeWidth: 3,
                          }),
                      }),
                      i.label,
                    ],
                  },
                  t,
                );
              }),
            }),
          ],
        })),
        (t[2] = n),
        (t[3] = r),
        (t[4] = o))
      : (o = t[4]),
    o
  );
}
var w = [
    { value: `none`, label: `None` },
    { value: `sm`, label: `Small` },
    { value: `md`, label: `Medium` },
    { value: `lg`, label: `Large` },
    { value: `xl`, label: `X-Large` },
    { value: `full`, label: `Full` },
  ],
  T = [
    { value: `tighter`, label: `Tighter` },
    { value: `tight`, label: `Tight` },
    { value: `normal`, label: `Normal` },
    { value: `wide`, label: `Wide` },
    { value: `wider`, label: `Wider` },
  ];
function E(e) {
  let t = (0, h.c)(21),
    {
      fontFamily: n,
      onFontChange: r,
      letterSpacing: a,
      onLetterSpacingChange: s,
      radius: c,
      onRadiusChange: l,
    } = e,
    d;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = (0, g.jsx)(_, { children: `Border Radius` })), (t[0] = d))
    : (d = t[0]);
  let f;
  t[1] !== l || t[2] !== c
    ? ((f = w.map((e) => {
        let { value: t, label: n } = e;
        return (0, g.jsxs)(
          S,
          {
            active: c === t,
            onClick: () => l(t),
            children: [
              (0, g.jsx)(`span`, {
                className: `h-5 w-5 shrink-0 border-2 border-current`,
                style: {
                  borderRadius:
                    t === `none`
                      ? `0px`
                      : t === `sm`
                        ? `3px`
                        : t === `md`
                          ? `6px`
                          : t === `lg`
                            ? `10px`
                            : t === `xl`
                              ? `14px`
                              : `9999px`,
                },
              }),
              n,
            ],
          },
          t,
        );
      })),
      (t[1] = l),
      (t[2] = c),
      (t[3] = f))
    : (f = t[3]);
  let p;
  t[4] === f
    ? (p = t[5])
    : ((p = (0, g.jsxs)(`section`, {
        children: [
          d,
          (0, g.jsx)(`div`, {
            className: `flex flex-wrap gap-2 sm:gap-3`,
            children: f,
          }),
        ],
      })),
      (t[4] = f),
      (t[5] = p));
  let m;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (0, g.jsx)(_, { children: `Font` })), (t[6] = m))
    : (m = t[6]);
  let v;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = Object.entries(i)), (t[7] = v))
    : (v = t[7]);
  let y;
  t[8] !== n || t[9] !== r
    ? ((y = (0, g.jsxs)(`section`, {
        children: [
          m,
          (0, g.jsx)(`div`, {
            className: `flex flex-wrap gap-2 sm:gap-3`,
            children: v.map((e) => {
              let [t, i] = e,
                a = n === t;
              return (0, g.jsxs)(
                S,
                {
                  active: a,
                  onClick: () => r(t),
                  children: [
                    a &&
                      (0, g.jsx)(u, {
                        size: 14,
                        className: `shrink-0 text-primary`,
                        strokeWidth: 2.5,
                      }),
                    (0, g.jsx)(`span`, {
                      style: { fontFamily: i.stack },
                      children: i.label,
                    }),
                  ],
                },
                t,
              );
            }),
          }),
        ],
      })),
      (t[8] = n),
      (t[9] = r),
      (t[10] = y))
    : (y = t[10]);
  let b;
  t[11] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((b = (0, g.jsx)(_, { children: `Font Spacing` })), (t[11] = b))
    : (b = t[11]);
  let x;
  t[12] !== a || t[13] !== s
    ? ((x = T.map((e) => {
        let { value: t, label: n } = e;
        return (0, g.jsxs)(
          S,
          {
            active: a === t,
            onClick: () => s(t),
            children: [
              (0, g.jsx)(`span`, {
                className: `text-xs font-semibold`,
                style: { letterSpacing: o[t].value },
                children: `Aa`,
              }),
              n,
            ],
          },
          t,
        );
      })),
      (t[12] = a),
      (t[13] = s),
      (t[14] = x))
    : (x = t[14]);
  let C;
  t[15] === x
    ? (C = t[16])
    : ((C = (0, g.jsxs)(`section`, {
        children: [
          b,
          (0, g.jsx)(`div`, {
            className: `flex flex-wrap gap-2 sm:gap-3`,
            children: x,
          }),
        ],
      })),
      (t[15] = x),
      (t[16] = C));
  let E;
  return (
    t[17] !== p || t[18] !== y || t[19] !== C
      ? ((E = (0, g.jsxs)(g.Fragment, { children: [p, y, C] })),
        (t[17] = p),
        (t[18] = y),
        (t[19] = C),
        (t[20] = E))
      : (E = t[20]),
    E
  );
}
function D(e) {
  let t = (0, h.c)(19),
    {
      accentColor: n,
      radius: r,
      fontFamily: a,
      letterSpacing: c,
      currentMode: l,
    } = e,
    u;
  t[0] === r
    ? (u = t[1])
    : ((u = w.find((e) => e.value === r)?.label ?? r), (t[0] = r), (t[1] = u));
  let d = u,
    f;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, g.jsx)(_, { children: `Preview` })), (t[2] = f))
    : (f = t[2]);
  let p = s[n],
    m;
  t[3] === p.preview
    ? (m = t[4])
    : ((m = (0, g.jsx)(`div`, {
        className: `mt-1 h-3 w-3 shrink-0 rounded-full`,
        style: { backgroundColor: p.preview },
      })),
      (t[3] = p.preview),
      (t[4] = m));
  let v = s[n],
    y = i[a],
    b = o[c],
    x;
  t[5] === l
    ? (x = t[6])
    : ((x = l.charAt(0).toUpperCase()), (t[5] = l), (t[6] = x));
  let S = x + l.slice(1),
    C;
  t[7] !== d ||
  t[8] !== v.label ||
  t[9] !== y.label ||
  t[10] !== b.label ||
  t[11] !== S
    ? ((C = (0, g.jsxs)(`p`, {
        className: `text-xs sm:text-sm font-semibold text-foreground`,
        children: [
          v.label,
          ` · `,
          d,
          ` radius · `,
          y.label,
          ` ·`,
          ` `,
          b.label,
          ` spacing ·`,
          ` `,
          S,
          ` mode`,
        ],
      })),
      (t[7] = d),
      (t[8] = v.label),
      (t[9] = y.label),
      (t[10] = b.label),
      (t[11] = S),
      (t[12] = C))
    : (C = t[12]);
  let T;
  t[13] !== C || t[14] !== m
    ? ((T = (0, g.jsxs)(`div`, {
        className: `mb-4 flex items-start gap-2`,
        children: [m, C],
      })),
      (t[13] = C),
      (t[14] = m),
      (t[15] = T))
    : (T = t[15]);
  let E;
  t[16] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((E = (0, g.jsxs)(`div`, {
        className: `flex flex-wrap items-center gap-2`,
        children: [
          (0, g.jsx)(`button`, {
            className: `rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90`,
            children: `Primary button`,
          }),
          (0, g.jsx)(`button`, {
            className: `rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-accent`,
            children: `Secondary button`,
          }),
          (0, g.jsx)(`span`, {
            className: `rounded-md border border-primary/30 bg-primary/10 px-2 py-1 text-xs font-medium text-primary`,
            children: `Badge`,
          }),
          (0, g.jsx)(`span`, {
            className: `text-xs text-muted-foreground`,
            children: `Muted text`,
          }),
        ],
      })),
      (t[16] = E))
    : (E = t[16]);
  let D;
  return (
    t[17] === T
      ? (D = t[18])
      : ((D = (0, g.jsxs)(`section`, {
          children: [
            f,
            (0, g.jsxs)(`div`, {
              className: `rounded-xl bg-muted/40 p-3 sm:p-5`,
              children: [T, E],
            }),
          ],
        })),
        (t[17] = T),
        (t[18] = D)),
    D
  );
}
function O() {
  let e = (0, h.c)(48),
    {
      theme: t,
      setTheme: i,
      customTheme: o,
      setCustomTheme: s,
      mounted: c,
    } = a(),
    { setTheme: u } = r(),
    d;
  e[0] === o ? (d = e[1]) : ((d = n(o)), (e[0] = o), (e[1] = d));
  let f = d,
    { accentColor: p, radius: _, fontFamily: y, letterSpacing: b } = f,
    S;
  e[2] !== u || e[3] !== i
    ? ((S = (e) => {
        e === `system` ? u(`system`) : i(e);
      }),
      (e[2] = u),
      (e[3] = i),
      (e[4] = S))
    : (S = e[4]);
  let w = S,
    T = t === `dark` ? `dark` : t === `light` ? `light` : `system`,
    O;
  e[5] !== o || e[6] !== s
    ? ((O = (e) => {
        s({ ...o, accentColor: e });
      }),
      (e[5] = o),
      (e[6] = s),
      (e[7] = O))
    : (O = e[7]);
  let k = O,
    A;
  e[8] !== o || e[9] !== s
    ? ((A = (e) => {
        s({ ...o, radius: e });
      }),
      (e[8] = o),
      (e[9] = s),
      (e[10] = A))
    : (A = e[10]);
  let j = A,
    M;
  e[11] !== o || e[12] !== s
    ? ((M = (e) => {
        s({ ...o, fontFamily: e });
      }),
      (e[11] = o),
      (e[12] = s),
      (e[13] = M))
    : (M = e[13]);
  let N = M,
    P;
  e[14] !== o || e[15] !== s
    ? ((P = (e) => {
        s({ ...o, letterSpacing: e });
      }),
      (e[14] = o),
      (e[15] = s),
      (e[16] = P))
    : (P = e[16]);
  let F = P,
    I;
  e[17] === s
    ? (I = e[18])
    : ((I = (e) => {
        s(e);
      }),
      (e[17] = s),
      (e[18] = I));
  let L = I;
  if (!c) {
    let t;
    return (
      e[19] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, g.jsx)(m, {
            title: `Theme`,
            children: (0, g.jsx)(`div`, {
              className: `flex items-center justify-center py-12`,
              children: (0, g.jsx)(l, { size: `lg` }),
            }),
          })),
          (e[19] = t))
        : (t = e[19]),
      t
    );
  }
  let R;
  e[20] !== T || e[21] !== w
    ? ((R = (0, g.jsx)(v, { currentMode: T, onModeChange: w })),
      (e[20] = T),
      (e[21] = w),
      (e[22] = R))
    : (R = e[22]);
  let z;
  e[23] !== L || e[24] !== f
    ? ((z = (0, g.jsx)(x, { currentTheme: f, onApplyPreset: L })),
      (e[23] = L),
      (e[24] = f),
      (e[25] = z))
    : (z = e[25]);
  let B;
  e[26] !== p || e[27] !== k
    ? ((B = (0, g.jsx)(C, { accentColor: p, onAccentChange: k })),
      (e[26] = p),
      (e[27] = k),
      (e[28] = B))
    : (B = e[28]);
  let V;
  e[29] !== y ||
  e[30] !== N ||
  e[31] !== F ||
  e[32] !== j ||
  e[33] !== b ||
  e[34] !== _
    ? ((V = (0, g.jsx)(E, {
        fontFamily: y,
        onFontChange: N,
        letterSpacing: b,
        onLetterSpacingChange: F,
        radius: _,
        onRadiusChange: j,
      })),
      (e[29] = y),
      (e[30] = N),
      (e[31] = F),
      (e[32] = j),
      (e[33] = b),
      (e[34] = _),
      (e[35] = V))
    : (V = e[35]);
  let H;
  e[36] !== p || e[37] !== T || e[38] !== y || e[39] !== b || e[40] !== _
    ? ((H = (0, g.jsx)(D, {
        accentColor: p,
        radius: _,
        fontFamily: y,
        letterSpacing: b,
        currentMode: T,
      })),
      (e[36] = p),
      (e[37] = T),
      (e[38] = y),
      (e[39] = b),
      (e[40] = _),
      (e[41] = H))
    : (H = e[41]);
  let U;
  return (
    e[42] !== V || e[43] !== H || e[44] !== R || e[45] !== z || e[46] !== B
      ? ((U = (0, g.jsx)(m, {
          title: `Theme`,
          children: (0, g.jsxs)(`div`, {
            className: `max-w-2xl space-y-6 sm:space-y-8`,
            children: [R, z, B, V, H],
          }),
        })),
        (e[42] = V),
        (e[43] = H),
        (e[44] = R),
        (e[45] = z),
        (e[46] = B),
        (e[47] = U))
      : (U = e[47]),
    U
  );
}
export { O as t };
