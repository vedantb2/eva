import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import {
  J as i,
  Tr as a,
  X as o,
  Yn as s,
  Z as c,
  _t as l,
  ar as u,
  fr as d,
  gt as f,
  ht as p,
  ir as m,
  pr as h,
  sn as g,
  t as _,
  ur as v,
} from "./src-DHCpG1Q-.js";
import { t as y } from "./IconArrowRight-ooQFWrrR.js";
import { t as b } from "./IconLoader2-BhUbT1Hm.js";
import { t as x } from "./IconPencil-D7oAN1Zq.js";
import { t as S } from "./src-DajKanKb.js";
import { t as C } from "./parseActivitySteps-BClmcBqd.js";
var w = r(),
  T = e(t(), 1),
  E = n();
function D(e) {
  let t = (0, w.c)(63),
    { question: n, options: r, onAnswer: i, isLoading: o } = e,
    s = o === void 0 ? !1 : o,
    [c, l] = (0, T.useState)(``),
    [d, f] = (0, T.useState)(``),
    p = c === `__other__`,
    h;
  t[0] !== d || t[1] !== p || t[2] !== i || t[3] !== c
    ? ((h = () => {
        p && d.trim()
          ? (i(d.trim()), l(``), f(``))
          : c && c !== `__other__` && (i(c), l(``), f(``));
      }),
      (t[0] = d),
      (t[1] = p),
      (t[2] = i),
      (t[3] = c),
      (t[4] = h))
    : (h = t[4]);
  let _ = h,
    S;
  t[5] !== d || t[6] !== p || t[7] !== c
    ? ((S = p ? d.trim().length > 0 : c.length > 0),
      (t[5] = d),
      (t[6] = p),
      (t[7] = c),
      (t[8] = S))
    : (S = t[8]);
  let C = S,
    D;
  t[9] === n
    ? (D = t[10])
    : ((D = (0, E.jsx)(`p`, {
        className: `text-[15px] font-semibold leading-snug text-foreground`,
        children: n,
      })),
      (t[9] = n),
      (t[10] = D));
  let A;
  if (t[11] !== s || t[12] !== r || t[13] !== c) {
    let e;
    (t[15] !== s || t[16] !== c
      ? ((e = (e, t) => {
          let n = c === e.label,
            r = `ABCDEFGHIJKLMNOPQRSTUVWXYZ`[t] ?? String(t + 1);
          return (0, E.jsx)(
            m,
            {
              className: `cursor-pointer shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${n ? `border-primary bg-accent ring-1 ring-primary` : `border-transparent bg-secondary hover:bg-muted`} ${s ? `pointer-events-none opacity-50` : ``}`,
              onClick: () => !s && l(e.label),
              role: `button`,
              tabIndex: s ? -1 : 0,
              onKeyDown: (t) => {
                s ||
                  ((t.key === `Enter` || t.key === ` `) &&
                    (t.preventDefault(), l(e.label)));
              },
              children: (0, E.jsxs)(u, {
                className: `flex flex-row items-start gap-3 py-2 px-2.5`,
                children: [
                  (0, E.jsx)(`span`, {
                    className: `
                    w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5
                    text-[11px] font-bold tracking-wide transition-all duration-150
                    ${n ? `bg-primary text-primary-foreground` : `bg-secondary text-muted-foreground`}
                  `,
                    children: n
                      ? (0, E.jsx)(a, { size: 13, strokeWidth: 3 })
                      : r,
                  }),
                  (0, E.jsxs)(`div`, {
                    className: `flex-1 min-w-0`,
                    children: [
                      (0, E.jsx)(`span`, {
                        className: `text-sm leading-snug font-medium ${n ? `text-primary` : `text-muted-foreground`}`,
                        children: e.label,
                      }),
                      (0, E.jsx)(`p`, {
                        className: `text-xs text-muted-foreground mt-0.5 leading-relaxed`,
                        children: e.description,
                      }),
                    ],
                  }),
                ],
              }),
            },
            `${e.label}-${t}`,
          );
        }),
        (t[15] = s),
        (t[16] = c),
        (t[17] = e))
      : (e = t[17]),
      (A = r.map(e)),
      (t[11] = s),
      (t[12] = r),
      (t[13] = c),
      (t[14] = A));
  } else A = t[14];
  let j = `cursor-pointer shadow-none transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${p ? `border-primary bg-accent ring-1 ring-primary` : `border-transparent bg-secondary hover:bg-muted`} ${s ? `pointer-events-none opacity-50` : ``}`,
    M;
  t[18] === s
    ? (M = t[19])
    : ((M = () => !s && l(`__other__`)), (t[18] = s), (t[19] = M));
  let N = s ? -1 : 0,
    P;
  t[20] === s
    ? (P = t[21])
    : ((P = (e) => {
        s ||
          ((e.key === `Enter` || e.key === ` `) &&
            (e.preventDefault(), l(`__other__`)));
      }),
      (t[20] = s),
      (t[21] = P));
  let F = `
                  w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-150
                  ${p ? `bg-primary text-primary-foreground` : `bg-secondary text-muted-foreground`}
                `,
    I;
  t[22] === p
    ? (I = t[23])
    : ((I = p
        ? (0, E.jsx)(a, { size: 13, strokeWidth: 3 })
        : (0, E.jsx)(x, { size: 13 })),
      (t[22] = p),
      (t[23] = I));
  let L;
  t[24] !== F || t[25] !== I
    ? ((L = (0, E.jsx)(`span`, { className: F, children: I })),
      (t[24] = F),
      (t[25] = I),
      (t[26] = L))
    : (L = t[26]);
  let R = `flex-1 text-sm ${p ? `text-primary font-medium` : `text-muted-foreground`}`,
    z;
  t[27] === R
    ? (z = t[28])
    : ((z = (0, E.jsx)(`span`, { className: R, children: `Other...` })),
      (t[27] = R),
      (t[28] = z));
  let B;
  t[29] !== L || t[30] !== z
    ? ((B = (0, E.jsxs)(`div`, {
        className: `flex items-center gap-3`,
        children: [L, z],
      })),
      (t[29] = L),
      (t[30] = z),
      (t[31] = B))
    : (B = t[31]);
  let V;
  t[32] !== C || t[33] !== d || t[34] !== _ || t[35] !== s || t[36] !== p
    ? ((V =
        p &&
        (0, E.jsx)(`div`, {
          className: `mt-2 ml-9 animate-in fade-in slide-in-from-top-1 duration-150`,
          onClick: k,
          onKeyDown: O,
          children: (0, E.jsx)(g, {
            value: d,
            onChange: (e) => f(e.target.value),
            placeholder: `Type your answer...`,
            disabled: s,
            autoFocus: !0,
            className: `h-8 text-sm bg-background border-border shadow-none`,
            onKeyDown: (e) => {
              e.key === `Enter` && C && !s && _();
            },
          }),
        })),
      (t[32] = C),
      (t[33] = d),
      (t[34] = _),
      (t[35] = s),
      (t[36] = p),
      (t[37] = V))
    : (V = t[37]);
  let H;
  t[38] !== B || t[39] !== V
    ? ((H = (0, E.jsxs)(u, { className: `py-2 px-2.5`, children: [B, V] })),
      (t[38] = B),
      (t[39] = V),
      (t[40] = H))
    : (H = t[40]);
  let U;
  t[41] !== H || t[42] !== j || t[43] !== M || t[44] !== N || t[45] !== P
    ? ((U = (0, E.jsx)(m, {
        className: j,
        onClick: M,
        role: `button`,
        tabIndex: N,
        onKeyDown: P,
        children: H,
      })),
      (t[41] = H),
      (t[42] = j),
      (t[43] = M),
      (t[44] = N),
      (t[45] = P),
      (t[46] = U))
    : (U = t[46]);
  let W;
  t[47] !== U || t[48] !== A
    ? ((W = (0, E.jsxs)(`div`, {
        className: `grid grid-cols-1 gap-1 sm:grid-cols-2`,
        children: [A, U],
      })),
      (t[47] = U),
      (t[48] = A),
      (t[49] = W))
    : (W = t[49]);
  let G = !C || s,
    K;
  t[50] === s
    ? (K = t[51])
    : ((K = s
        ? (0, E.jsx)(b, { className: `mr-2 h-4 w-4 animate-spin` })
        : null),
      (t[50] = s),
      (t[51] = K));
  let q;
  t[52] === s
    ? (q = t[53])
    : ((q =
        !s && (0, E.jsx)(y, { size: 15, strokeWidth: 2.5, className: `ml-1` })),
      (t[52] = s),
      (t[53] = q));
  let J;
  t[54] !== _ || t[55] !== G || t[56] !== K || t[57] !== q
    ? ((J = (0, E.jsxs)(v, {
        className: `w-full`,
        onClick: _,
        disabled: G,
        children: [K, `Submit`, q],
      })),
      (t[54] = _),
      (t[55] = G),
      (t[56] = K),
      (t[57] = q),
      (t[58] = J))
    : (J = t[58]);
  let Y;
  return (
    t[59] !== W || t[60] !== J || t[61] !== D
      ? ((Y = (0, E.jsxs)(`div`, {
          className: `space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200`,
          children: [D, W, J],
        })),
        (t[59] = W),
        (t[60] = J),
        (t[61] = D),
        (t[62] = Y))
      : (Y = t[62]),
    Y
  );
}
function O(e) {
  return e.stopPropagation();
}
function k(e) {
  return e.stopPropagation();
}
function A(e) {
  let t = (0, w.c)(19),
    { role: n, content: r, logs: a, isStreaming: u, userId: m } = e,
    g = n === `user`,
    v;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = (0, E.jsx)(`img`, {
        src: `/icon.png`,
        alt: `Eva`,
        width: 20,
        height: 20,
        className: `rounded-full`,
      })),
      (t[0] = v))
    : (v = t[0]);
  let y = v,
    b,
    x;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((b = { opacity: 0, y: 10 }),
      (x = { opacity: 1, y: 0 }),
      (t[1] = b),
      (t[2] = x))
    : ((b = t[1]), (x = t[2]));
  let T;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((T = { duration: 0.18, ease: [0.22, 1, 0.36, 1] }), (t[3] = T))
    : (T = t[3]);
  let D = g ? `rounded-xl bg-secondary text-foreground px-4 py-3` : `px-1 py-2`,
    O;
  t[4] !== r || t[5] !== u || t[6] !== g || t[7] !== a
    ? ((O = u
        ? (() => {
            let e = C(r);
            return e
              ? (0, E.jsx)(_, {
                  steps: e,
                  isStreaming: !0,
                  name: `Eva`,
                  icon: y,
                })
              : (0, E.jsxs)(i, {
                  isStreaming: !0,
                  defaultOpen: !0,
                  children: [
                    (0, E.jsx)(o, { getThinkingMessage: M }),
                    (0, E.jsx)(s, {
                      className: `mt-4 text-sm text-muted-foreground`,
                      children: (0, E.jsx)(`pre`, {
                        className: `whitespace-pre-wrap font-mono text-xs`,
                        children: r || `Starting...`,
                      }),
                    }),
                  ],
                });
          })()
        : (0, E.jsx)(E.Fragment, {
            children: g
              ? (0, E.jsx)(`p`, {
                  className: `text-sm whitespace-pre-wrap break-words`,
                  children: r,
                })
              : (0, E.jsxs)(E.Fragment, {
                  children: [
                    a &&
                      (() => {
                        let e = C(a);
                        return e
                          ? (0, E.jsx)(_, { steps: e, name: `Eva`, icon: y })
                          : (0, E.jsxs)(i, {
                              defaultOpen: !1,
                              children: [
                                (0, E.jsx)(o, { getThinkingMessage: j }),
                                (0, E.jsx)(s, {
                                  className: `mt-4 text-sm text-muted-foreground`,
                                  children: (0, E.jsx)(`pre`, {
                                    className: `whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto`,
                                    children: a,
                                  }),
                                }),
                              ],
                            });
                      })(),
                    (0, E.jsx)(l, {
                      className: `prose prose-sm dark:prose-invert max-w-none`,
                      children: r,
                    }),
                  ],
                }),
          })),
      (t[4] = r),
      (t[5] = u),
      (t[6] = g),
      (t[7] = a),
      (t[8] = O))
    : (O = t[8]);
  let k;
  t[9] !== D || t[10] !== O
    ? ((k = (0, E.jsx)(f, { className: D, children: O })),
      (t[9] = D),
      (t[10] = O),
      (t[11] = k))
    : (k = t[11]);
  let A;
  t[12] !== g || t[13] !== m
    ? ((A =
        g &&
        (0, E.jsx)(`div`, {
          className: `mt-0.5 ml-auto`,
          children: m
            ? (0, E.jsx)(S, { userId: m, hideLastSeen: !0, size: `md` })
            : (0, E.jsx)(d, {
                className: `h-7 w-7`,
                children: (0, E.jsx)(h, {
                  className: `bg-secondary text-xs text-muted-foreground`,
                  children: `U`,
                }),
              }),
        })),
      (t[12] = g),
      (t[13] = m),
      (t[14] = A))
    : (A = t[14]);
  let N;
  return (
    t[15] !== n || t[16] !== k || t[17] !== A
      ? ((N = (0, E.jsx)(c.div, {
          initial: b,
          animate: x,
          transition: T,
          children: (0, E.jsxs)(p, { from: n, children: [k, A] }),
        })),
        (t[15] = n),
        (t[16] = k),
        (t[17] = A),
        (t[18] = N))
      : (N = t[18]),
    N
  );
}
function j() {
  return `View logs`;
}
function M(e) {
  return e ? `Working...` : `Processing complete`;
}
export { D as n, A as t };
