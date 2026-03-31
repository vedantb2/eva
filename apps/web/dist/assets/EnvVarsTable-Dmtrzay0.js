import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import {
  Gn as i,
  Kt as a,
  Rn as o,
  Tr as ee,
  Un as te,
  Vn as s,
  Wn as ne,
  on as c,
  sn as re,
  ur as l,
  vr as ie,
} from "./src-DHCpG1Q-.js";
import { t as u } from "./createReactComponent-C2GWxX5y.js";
import { t as ae } from "./IconClipboard-CG1pDYHj.js";
import { t as oe } from "./IconCopy-CPz-YjEu.js";
import { t as se } from "./IconEyeOff-BRNChqHT.js";
import { t as ce } from "./IconEye-B7_3GMo_.js";
import { t as le } from "./IconKey-C6tcC9Yp.js";
import { t as ue } from "./IconPencil-D7oAN1Zq.js";
import { t as de } from "./IconPlus-ZLqtR4Mv.js";
import { t as fe } from "./IconTrash-bHTcNORt.js";
var pe = u(`outline`, `lock-open`, `LockOpen`, [
    [
      `path`,
      {
        d: `M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -6`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M11 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-1` }],
    [`path`, { d: `M8 11v-5a4 4 0 0 1 8 0`, key: `svg-2` }],
  ]),
  me = u(`outline`, `lock`, `Lock`, [
    [
      `path`,
      {
        d: `M5 13a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v6a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-6`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M11 16a1 1 0 1 0 2 0a1 1 0 0 0 -2 0`, key: `svg-1` }],
    [`path`, { d: `M8 11v-4a4 4 0 1 1 8 0v4`, key: `svg-2` }],
  ]),
  d = r(),
  f = e(t(), 1),
  p = n();
function he(e) {
  let t = [];
  for (let n of e.split(`
`)) {
    let e = n.trim();
    if (!e || e.startsWith(`#`)) continue;
    let r = e.indexOf(`=`);
    if (r < 1) continue;
    let i = e.slice(0, r).trim(),
      a = e.slice(r + 1);
    (((a.startsWith(`"`) && a.endsWith(`"`)) ||
      (a.startsWith(`'`) && a.endsWith(`'`))) &&
      (a = a.slice(1, -1)),
      i && t.push({ key: i, value: a }));
  }
  return t;
}
function m(e) {
  let t = (0, d.c)(119),
    {
      vars: n,
      onUpsert: r,
      onReveal: u,
      onRemove: m,
      onToggleSandboxExclude: h,
      description: g,
      readOnly: be,
    } = e,
    _ = be === void 0 ? !1 : be,
    [v, xe] = (0, f.useState)(!1),
    [y, Se] = (0, f.useState)(``),
    [b, x] = (0, f.useState)(``),
    [S, Ce] = (0, f.useState)(!1),
    [C, we] = (0, f.useState)(null),
    [w, Te] = (0, f.useState)(``),
    [T, E] = (0, f.useState)(null),
    D;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((D = {}), (t[0] = D))
    : (D = t[0]);
  let [O, k] = (0, f.useState)(D),
    [A, Ee] = (0, f.useState)(null),
    [j, De] = (0, f.useState)(null),
    [Oe, M] = (0, f.useState)(!1),
    [N, P] = (0, f.useState)(``),
    [ke, Ae] = (0, f.useState)(!1),
    je;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((je = () => {
        (xe(!0), Se(``), x(``));
      }),
      (t[1] = je))
    : (je = t[1]);
  let Me = je,
    Ne;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ne = () => {
        (xe(!1), Se(``), x(``));
      }),
      (t[2] = Ne))
    : (Ne = t[2]);
  let Pe = Ne,
    Fe;
  t[3] !== y || t[4] !== r || t[5] !== b
    ? ((Fe = async () => {
        !y.trim() ||
          !b.trim() ||
          !r ||
          (Ce(!0), await r(y.trim(), b, !1), Ce(!1), xe(!1), Se(``), x(``));
      }),
      (t[3] = y),
      (t[4] = r),
      (t[5] = b),
      (t[6] = Fe))
    : (Fe = t[6]);
  let F = Fe,
    Ie;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ie = (e) => {
        (we(e), Te(``));
      }),
      (t[7] = Ie))
    : (Ie = t[7]);
  let Le = Ie,
    Re;
  t[8] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Re = () => {
        (we(null), Te(``));
      }),
      (t[8] = Re))
    : (Re = t[8]);
  let ze = Re,
    Be;
  t[9] !== w || t[10] !== C || t[11] !== r || t[12] !== n
    ? ((Be = async () => {
        if (!C || !w.trim() || !r) return;
        let e = n?.find((e) => e.key === C);
        (Ce(!0),
          await r(C, w, e?.sandboxExclude ?? !1),
          Ce(!1),
          we(null),
          Te(``),
          k((e) => {
            let t = { ...e };
            return (delete t[C], t);
          }));
      }),
      (t[9] = w),
      (t[10] = C),
      (t[11] = r),
      (t[12] = n),
      (t[13] = Be))
    : (Be = t[13]);
  let I = Be,
    Ve;
  t[14] !== T || t[15] !== m
    ? ((Ve = async () => {
        !T ||
          !m ||
          (await m(T),
          k((e) => {
            let t = { ...e };
            return (delete t[T], t);
          }),
          E(null));
      }),
      (t[14] = T),
      (t[15] = m),
      (t[16] = Ve))
    : (Ve = t[16]);
  let He = Ve,
    Ue;
  t[17] !== u || t[18] !== O
    ? ((Ue = async (e) => {
        if (!u) return;
        if (O[e] !== void 0) {
          k((t) => {
            let n = { ...t };
            return (delete n[e], n);
          });
          return;
        }
        Ee(e);
        let t = await u(e);
        (t !== null && k((n) => ({ ...n, [e]: t })), Ee(null));
      }),
      (t[17] = u),
      (t[18] = O),
      (t[19] = Ue))
    : (Ue = t[19]);
  let L = Ue,
    We;
  t[20] !== u || t[21] !== O
    ? ((We = async (e) => {
        if (!u) return;
        let t = O[e];
        if (t === void 0) {
          let n = await u(e);
          if (n === null) return;
          t = n;
        }
        (await navigator.clipboard.writeText(t),
          De(e),
          setTimeout(() => De(null), 1500));
      }),
      (t[20] = u),
      (t[21] = O),
      (t[22] = We))
    : (We = t[22]);
  let R = We,
    Ge;
  t[23] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ge = (e) => {
        let t = e.clipboardData.getData(`text`);
        t.includes(`
`) && (e.preventDefault(), P(t), M(!0), Pe());
      }),
      (t[23] = Ge))
    : (Ge = t[23]);
  let Ke = Ge,
    qe;
  t[24] !== N || t[25] !== r
    ? ((qe = async () => {
        if (!r) return;
        let e = he(N);
        if (e.length !== 0) {
          Ae(!0);
          for (let { key: t, value: n } of e) await r(t, n, !1);
          (Ae(!1), M(!1), P(``));
        }
      }),
      (t[24] = N),
      (t[25] = r),
      (t[26] = qe))
    : (qe = t[26]);
  let Je = qe,
    Ye;
  t[27] === N ? (Ye = t[28]) : ((Ye = he(N)), (t[27] = N), (t[28] = Ye));
  let z = Ye,
    B,
    V;
  if (
    t[29] !== v ||
    t[30] !== j ||
    t[31] !== R ||
    t[32] !== g ||
    t[33] !== w ||
    t[34] !== C ||
    t[35] !== F ||
    t[36] !== y ||
    t[37] !== h ||
    t[38] !== _ ||
    t[39] !== O ||
    t[40] !== A ||
    t[41] !== I ||
    t[42] !== S ||
    t[43] !== L ||
    t[44] !== b ||
    t[45] !== n
  ) {
    let e = (n?.filter(ye) ?? []).sort(ve),
      r = (n?.filter(_e) ?? []).sort(ge),
      i = (n && n.length > 0) || v,
      o;
    t[48] !== j ||
    t[49] !== R ||
    t[50] !== w ||
    t[51] !== C ||
    t[52] !== h ||
    t[53] !== _ ||
    t[54] !== O ||
    t[55] !== A ||
    t[56] !== I ||
    t[57] !== S ||
    t[58] !== L
      ? ((o = (e) =>
          (0, p.jsxs)(
            `tr`,
            {
              className: `last:border-0`,
              children: [
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 font-mono text-xs sm:px-4`,
                  children: e.key,
                }),
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 sm:px-4`,
                  children:
                    C === e.key
                      ? (0, p.jsx)(re, {
                          value: w,
                          onChange: (e) => Te(e.target.value),
                          placeholder: `Enter new value`,
                          className: `h-7 font-mono text-xs`,
                          autoFocus: !0,
                          onKeyDown: (e) => {
                            (e.key === `Enter` && I(),
                              e.key === `Escape` && ze());
                          },
                        })
                      : (0, p.jsx)(`span`, {
                          className: `font-mono text-xs text-muted-foreground`,
                          children: O[e.key] ?? e.value,
                        }),
                }),
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 text-right sm:px-4`,
                  children:
                    C === e.key
                      ? (0, p.jsxs)(`div`, {
                          className: `flex items-center justify-end gap-1`,
                          children: [
                            (0, p.jsx)(l, {
                              size: `icon-sm`,
                              variant: `ghost`,
                              onClick: I,
                              disabled: !w.trim() || S,
                              title: `Save`,
                              className: `text-primary hover:text-primary`,
                              children: (0, p.jsx)(ee, { size: 14 }),
                            }),
                            (0, p.jsx)(l, {
                              size: `icon-sm`,
                              variant: `ghost`,
                              onClick: ze,
                              title: `Cancel`,
                              children: (0, p.jsx)(ie, { size: 14 }),
                            }),
                          ],
                        })
                      : (0, p.jsxs)(`div`, {
                          className: `flex items-center justify-end gap-1`,
                          children: [
                            (0, p.jsx)(l, {
                              size: `icon-sm`,
                              variant: `ghost`,
                              onClick: () => L(e.key),
                              disabled: A === e.key,
                              title:
                                O[e.key] === void 0
                                  ? `Reveal value`
                                  : `Hide value`,
                              children:
                                O[e.key] === void 0
                                  ? (0, p.jsx)(ce, { size: 14 })
                                  : (0, p.jsx)(se, { size: 14 }),
                            }),
                            (0, p.jsx)(l, {
                              size: `icon-sm`,
                              variant: `ghost`,
                              onClick: () => R(e.key),
                              title: j === e.key ? `Copied!` : `Copy value`,
                              children:
                                j === e.key
                                  ? (0, p.jsx)(ee, {
                                      size: 14,
                                      className: `text-primary`,
                                    })
                                  : (0, p.jsx)(oe, { size: 14 }),
                            }),
                            !_ &&
                              (0, p.jsxs)(p.Fragment, {
                                children: [
                                  h &&
                                    (0, p.jsx)(l, {
                                      size: `icon-sm`,
                                      variant: `ghost`,
                                      onClick: () =>
                                        h(e.key, !e.sandboxExclude),
                                      title: e.sandboxExclude
                                        ? `Excluded from sandbox (click to include)`
                                        : `Included in sandbox (click to exclude)`,
                                      children: e.sandboxExclude
                                        ? (0, p.jsx)(me, {
                                            size: 14,
                                            className: `text-amber-500`,
                                          })
                                        : (0, p.jsx)(pe, { size: 14 }),
                                    }),
                                  (0, p.jsx)(l, {
                                    size: `icon-sm`,
                                    variant: `ghost`,
                                    onClick: () => Le(e.key),
                                    title: `Edit`,
                                    children: (0, p.jsx)(ue, { size: 14 }),
                                  }),
                                  (0, p.jsx)(l, {
                                    size: `icon-sm`,
                                    variant: `ghost`,
                                    onClick: () => E(e.key),
                                    title: `Delete`,
                                    className: `text-destructive hover:text-destructive`,
                                    children: (0, p.jsx)(fe, { size: 14 }),
                                  }),
                                ],
                              }),
                          ],
                        }),
                }),
              ],
            },
            e.key,
          )),
        (t[48] = j),
        (t[49] = R),
        (t[50] = w),
        (t[51] = C),
        (t[52] = h),
        (t[53] = _),
        (t[54] = O),
        (t[55] = A),
        (t[56] = I),
        (t[57] = S),
        (t[58] = L),
        (t[59] = o))
      : (o = t[59]);
    let te = o,
      s;
    t[60] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((s = (0, p.jsx)(`thead`, {
          children: (0, p.jsxs)(`tr`, {
            className: `text-left text-muted-foreground`,
            children: [
              (0, p.jsx)(`th`, {
                className: `px-2.5 py-2.5 font-medium sm:px-4`,
                children: `Key`,
              }),
              (0, p.jsx)(`th`, {
                className: `px-2.5 py-2.5 font-medium sm:px-4`,
                children: `Value`,
              }),
              (0, p.jsx)(`th`, {
                className: `px-2.5 py-2.5 text-right font-medium sm:px-4`,
                children: `Actions`,
              }),
            ],
          }),
        })),
        (t[60] = s))
      : (s = t[60]);
    let ne = s,
      c;
    t[61] !== v || t[62] !== F || t[63] !== y || t[64] !== S || t[65] !== b
      ? ((c = v
          ? (0, p.jsxs)(`tr`, {
              children: [
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 sm:px-4`,
                  children: (0, p.jsx)(re, {
                    value: y,
                    onChange: (e) => Se(e.target.value),
                    onPaste: Ke,
                    placeholder: `e.g. API_KEY`,
                    className: `h-7 font-mono text-xs`,
                    autoFocus: !0,
                    onKeyDown: (e) => {
                      e.key === `Escape` && Pe();
                    },
                  }),
                }),
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 sm:px-4`,
                  children: (0, p.jsx)(re, {
                    value: b,
                    onChange: (e) => x(e.target.value),
                    placeholder: `Enter value`,
                    className: `h-7 font-mono text-xs`,
                    onKeyDown: (e) => {
                      (e.key === `Enter` && F(), e.key === `Escape` && Pe());
                    },
                  }),
                }),
                (0, p.jsx)(`td`, {
                  className: `px-2.5 py-2.5 text-right sm:px-4`,
                  children: (0, p.jsxs)(`div`, {
                    className: `flex items-center justify-end gap-1`,
                    children: [
                      (0, p.jsx)(l, {
                        size: `icon-sm`,
                        variant: `ghost`,
                        onClick: F,
                        disabled: !y.trim() || !b.trim() || S,
                        title: `Save`,
                        className: `text-primary hover:text-primary`,
                        children: (0, p.jsx)(ee, { size: 14 }),
                      }),
                      (0, p.jsx)(l, {
                        size: `icon-sm`,
                        variant: `ghost`,
                        onClick: Pe,
                        title: `Cancel`,
                        children: (0, p.jsx)(ie, { size: 14 }),
                      }),
                    ],
                  }),
                }),
              ],
            })
          : null),
        (t[61] = v),
        (t[62] = F),
        (t[63] = y),
        (t[64] = S),
        (t[65] = b),
        (t[66] = c))
      : (c = t[66]);
    let u = c,
      d;
    t[67] === g
      ? (d = t[68])
      : ((d = (0, p.jsx)(`p`, {
          className: `text-xs text-muted-foreground`,
          children: g,
        })),
        (t[67] = g),
        (t[68] = d));
    let f;
    (t[69] !== v || t[70] !== _
      ? ((f =
          !_ &&
          (0, p.jsxs)(`div`, {
            className: `flex items-center gap-2 shrink-0`,
            children: [
              (0, p.jsxs)(l, {
                size: `sm`,
                variant: `outline`,
                onClick: () => M(!0),
                children: [
                  (0, p.jsx)(ae, { size: 16, className: `mr-1.5` }),
                  `Paste`,
                ],
              }),
              (0, p.jsxs)(l, {
                size: `sm`,
                onClick: Me,
                disabled: v,
                children: [
                  (0, p.jsx)(de, { size: 16, className: `mr-1.5` }),
                  `Add Variable`,
                ],
              }),
            ],
          })),
        (t[69] = v),
        (t[70] = _),
        (t[71] = f))
      : (f = t[71]),
      t[72] !== d || t[73] !== f
        ? ((B = (0, p.jsxs)(`div`, {
            className: `mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`,
            children: [d, f],
          })),
          (t[72] = d),
          (t[73] = f),
          (t[74] = B))
        : (B = t[74]),
      (V =
        n === void 0
          ? (0, p.jsx)(`div`, {
              className: `flex items-center justify-center py-12`,
              children: (0, p.jsx)(a, { size: `lg` }),
            })
          : i
            ? (0, p.jsxs)(`div`, {
                className: `space-y-6`,
                children: [
                  (0, p.jsx)(`div`, {
                    className: `rounded-lg bg-muted/40 overflow-x-auto`,
                    children: (0, p.jsxs)(`table`, {
                      className: `w-full text-sm min-w-[360px]`,
                      children: [
                        ne,
                        (0, p.jsxs)(`tbody`, {
                          children: [
                            u,
                            e.map(te),
                            e.length === 0 &&
                              !v &&
                              (0, p.jsx)(`tr`, {
                                children: (0, p.jsx)(`td`, {
                                  colSpan: 3,
                                  className: `px-4 py-6 text-center text-xs text-muted-foreground`,
                                  children: `No sandbox variables`,
                                }),
                              }),
                          ],
                        }),
                      ],
                    }),
                  }),
                  r.length > 0 &&
                    (0, p.jsxs)(`div`, {
                      children: [
                        (0, p.jsxs)(`div`, {
                          className: `mb-2 flex items-center gap-1.5`,
                          children: [
                            (0, p.jsx)(me, {
                              size: 14,
                              className: `text-amber-500`,
                            }),
                            (0, p.jsx)(`p`, {
                              className: `text-xs font-medium text-muted-foreground`,
                              children: `Excluded from Sandbox`,
                            }),
                          ],
                        }),
                        (0, p.jsx)(`div`, {
                          className: `rounded-lg bg-muted/40 overflow-x-auto`,
                          children: (0, p.jsxs)(`table`, {
                            className: `w-full text-sm min-w-[360px]`,
                            children: [
                              ne,
                              (0, p.jsx)(`tbody`, { children: r.map(te) }),
                            ],
                          }),
                        }),
                      ],
                    }),
                ],
              })
            : (0, p.jsxs)(`div`, {
                className: `flex flex-col items-center justify-center py-16 text-muted-foreground`,
                children: [
                  (0, p.jsx)(le, { size: 48, className: `mb-3 opacity-40` }),
                  (0, p.jsx)(`p`, {
                    className: `text-sm`,
                    children: `No environment variables configured`,
                  }),
                ],
              })),
      (t[29] = v),
      (t[30] = j),
      (t[31] = R),
      (t[32] = g),
      (t[33] = w),
      (t[34] = C),
      (t[35] = F),
      (t[36] = y),
      (t[37] = h),
      (t[38] = _),
      (t[39] = O),
      (t[40] = A),
      (t[41] = I),
      (t[42] = S),
      (t[43] = L),
      (t[44] = b),
      (t[45] = n),
      (t[46] = B),
      (t[47] = V));
  } else ((B = t[46]), (V = t[47]));
  let Xe;
  t[75] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Xe = (e) => {
        e || (M(!1), P(``));
      }),
      (t[75] = Xe))
    : (Xe = t[75]);
  let Ze;
  t[76] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ze = (0, p.jsx)(ne, {
        children: (0, p.jsx)(i, { children: `Paste Environment Variables` }),
      })),
      (t[76] = Ze))
    : (Ze = t[76]);
  let Qe;
  t[77] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Qe = (0, p.jsx)(`span`, {
        className: `font-mono`,
        children: `KEY=VALUE`,
      })),
      (t[77] = Qe))
    : (Qe = t[77]);
  let $e;
  t[78] === Symbol.for(`react.memo_cache_sentinel`)
    ? (($e = (0, p.jsxs)(`p`, {
        className: `text-xs text-muted-foreground`,
        children: [
          `Paste your variables in`,
          ` `,
          Qe,
          ` format, one per line. Lines starting with `,
          (0, p.jsx)(`span`, { className: `font-mono`, children: `#` }),
          ` are ignored.`,
        ],
      })),
      (t[78] = $e))
    : ($e = t[78]);
  let et;
  t[79] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((et = (e) => P(e.target.value)), (t[79] = et))
    : (et = t[79]);
  let H;
  t[80] === N
    ? (H = t[81])
    : ((H = (0, p.jsx)(c, {
        value: N,
        onChange: et,
        placeholder: `API_KEY=abc123
DATABASE_URL=postgres://...`,
        className: `h-40 font-mono text-xs`,
        autoFocus: !0,
      })),
      (t[80] = N),
      (t[81] = H));
  let U;
  t[82] === z.length
    ? (U = t[83])
    : ((U =
        z.length > 0 &&
        (0, p.jsxs)(`p`, {
          className: `text-xs text-muted-foreground`,
          children: [
            z.length,
            ` variable`,
            z.length === 1 ? `` : `s`,
            ` detected`,
          ],
        })),
      (t[82] = z.length),
      (t[83] = U));
  let W;
  t[84] !== H || t[85] !== U
    ? ((W = (0, p.jsxs)(`div`, {
        className: `space-y-3`,
        children: [$e, H, U],
      })),
      (t[84] = H),
      (t[85] = U),
      (t[86] = W))
    : (W = t[86]);
  let tt;
  t[87] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((tt = (0, p.jsx)(l, {
        variant: `outline`,
        size: `sm`,
        onClick: () => {
          (M(!1), P(``));
        },
        children: `Cancel`,
      })),
      (t[87] = tt))
    : (tt = t[87]);
  let nt = z.length === 0 || ke,
    G;
  t[88] === ke
    ? (G = t[89])
    : ((G = ke && (0, p.jsx)(a, { size: `sm`, className: `mr-1.5` })),
      (t[88] = ke),
      (t[89] = G));
  let rt =
      z.length > 0 ? `${z.length} Variable${z.length === 1 ? `` : `s`}` : ``,
    K;
  t[90] !== Je || t[91] !== nt || t[92] !== G || t[93] !== rt
    ? ((K = (0, p.jsxs)(te, {
        children: [
          tt,
          (0, p.jsxs)(l, {
            size: `sm`,
            onClick: Je,
            disabled: nt,
            children: [G, `Import`, ` `, rt],
          }),
        ],
      })),
      (t[90] = Je),
      (t[91] = nt),
      (t[92] = G),
      (t[93] = rt),
      (t[94] = K))
    : (K = t[94]);
  let q;
  t[95] !== W || t[96] !== K
    ? ((q = (0, p.jsxs)(s, { className: `sm:max-w-lg`, children: [Ze, W, K] })),
      (t[95] = W),
      (t[96] = K),
      (t[97] = q))
    : (q = t[97]);
  let J;
  t[98] !== Oe || t[99] !== q
    ? ((J = (0, p.jsx)(o, { open: Oe, onOpenChange: Xe, children: q })),
      (t[98] = Oe),
      (t[99] = q),
      (t[100] = J))
    : (J = t[100]);
  let it = T !== null,
    Y;
  t[101] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Y = (e) => {
        e || E(null);
      }),
      (t[101] = Y))
    : (Y = t[101]);
  let at;
  t[102] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((at = (0, p.jsx)(ne, {
        children: (0, p.jsx)(i, { children: `Delete Variable` }),
      })),
      (t[102] = at))
    : (at = t[102]);
  let X;
  t[103] === T
    ? (X = t[104])
    : ((X = (0, p.jsxs)(`p`, {
        className: `text-sm text-muted-foreground`,
        children: [
          `Are you sure you want to delete`,
          ` `,
          (0, p.jsx)(`span`, {
            className: `font-mono font-medium text-foreground`,
            children: T,
          }),
          `? This cannot be undone.`,
        ],
      })),
      (t[103] = T),
      (t[104] = X));
  let ot;
  t[105] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ot = (0, p.jsx)(l, {
        variant: `outline`,
        size: `sm`,
        onClick: () => E(null),
        children: `Cancel`,
      })),
      (t[105] = ot))
    : (ot = t[105]);
  let Z;
  t[106] === He
    ? (Z = t[107])
    : ((Z = (0, p.jsxs)(te, {
        children: [
          ot,
          (0, p.jsx)(l, {
            size: `sm`,
            variant: `destructive`,
            onClick: He,
            children: `Delete`,
          }),
        ],
      })),
      (t[106] = He),
      (t[107] = Z));
  let Q;
  t[108] !== X || t[109] !== Z
    ? ((Q = (0, p.jsxs)(s, { children: [at, X, Z] })),
      (t[108] = X),
      (t[109] = Z),
      (t[110] = Q))
    : (Q = t[110]);
  let $;
  t[111] !== it || t[112] !== Q
    ? (($ = (0, p.jsx)(o, { open: it, onOpenChange: Y, children: Q })),
      (t[111] = it),
      (t[112] = Q),
      (t[113] = $))
    : ($ = t[113]);
  let st;
  return (
    t[114] !== B || t[115] !== V || t[116] !== J || t[117] !== $
      ? ((st = (0, p.jsxs)(`div`, { children: [B, V, J, $] })),
        (t[114] = B),
        (t[115] = V),
        (t[116] = J),
        (t[117] = $),
        (t[118] = st))
      : (st = t[118]),
    st
  );
}
function ge(e, t) {
  return e.key.localeCompare(t.key);
}
function _e(e) {
  return e.sandboxExclude;
}
function ve(e, t) {
  return e.key.localeCompare(t.key);
}
function ye(e) {
  return !e.sandboxExclude;
}
export { m as t };
