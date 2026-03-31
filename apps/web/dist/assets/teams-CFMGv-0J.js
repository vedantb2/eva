import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./link-HPAZ_wn3.js";
import { T as i } from "./index-DSqEo2z3.js";
import { c as a, n as o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import {
  Gn as c,
  Kn as l,
  Rn as u,
  Un as d,
  Vn as f,
  Wn as p,
  ar as m,
  ir as h,
  or as g,
  sn as _,
  sr as v,
  ur as y,
} from "./src-DzioQSsH.js";
import { t as b } from "./IconPlus-ZLqtR4Mv.js";
import { t as x } from "./IconUsers-C0ORl3PB.js";
import { t as S } from "./PageWrapper-Z5X-C4Rx.js";
var C = i(),
  w = e(t(), 1),
  T = n();
function E() {
  let e = (0, C.c)(46),
    t = s(o.teams.list) ?? [],
    n = a(o.teams.create),
    r;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = { open: !1, name: ``, error: ``, isSubmitting: !1 }), (e[0] = r))
    : (r = e[0]);
  let [i, g] = (0, w.useState)(r),
    v;
  e[1] !== i.name || e[2] !== n
    ? ((v = async () => {
        if (!i.name.trim()) {
          g(j);
          return;
        }
        g(A);
        try {
          (await n({ name: i.name }),
            g({ open: !1, name: ``, error: ``, isSubmitting: !1 }));
        } catch (e) {
          let t = e,
            n = t instanceof Error ? t.message : `Failed to create team`;
          g((e) => ({ ...e, error: n, isSubmitting: !1 }));
        }
      }),
      (e[1] = i.name),
      (e[2] = n),
      (e[3] = v))
    : (v = e[3]);
  let E = v,
    M;
  e[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((M = (e) => {
        g(e ? k : { open: !1, name: ``, error: ``, isSubmitting: !1 });
      }),
      (e[4] = M))
    : (M = e[4]);
  let N = M,
    P;
  e[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((P = (0, T.jsx)(`p`, {
        className: `text-sm text-muted-foreground`,
        children: `Manage your teams and collaborate on codebases`,
      })),
      (e[5] = P))
    : (P = e[5]);
  let F;
  e[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((F = (0, T.jsx)(l, {
        asChild: !0,
        children: (0, T.jsxs)(y, {
          size: `sm`,
          children: [
            (0, T.jsx)(b, { size: 16, className: `mr-1.5` }),
            `New Team`,
          ],
        }),
      })),
      (e[6] = F))
    : (F = e[6]);
  let I;
  e[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((I = (0, T.jsx)(p, {
        children: (0, T.jsx)(c, { children: `Create Team` }),
      })),
      (e[7] = I))
    : (I = e[7]);
  let L;
  e[8] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((L = (e) => g((t) => ({ ...t, name: e.target.value, error: `` }))),
      (e[8] = L))
    : (L = e[8]);
  let R;
  e[9] === E
    ? (R = e[10])
    : ((R = (e) => e.key === `Enter` && E()), (e[9] = E), (e[10] = R));
  let z;
  e[11] !== i.isSubmitting || e[12] !== i.name || e[13] !== R
    ? ((z = (0, T.jsx)(`div`, {
        children: (0, T.jsx)(_, {
          value: i.name,
          onChange: L,
          placeholder: `Team name`,
          disabled: i.isSubmitting,
          onKeyDown: R,
        }),
      })),
      (e[11] = i.isSubmitting),
      (e[12] = i.name),
      (e[13] = R),
      (e[14] = z))
    : (z = e[14]);
  let B;
  e[15] === i.error
    ? (B = e[16])
    : ((B =
        i.error &&
        (0, T.jsx)(`div`, {
          className: `rounded-lg border border-destructive/50 bg-destructive/10 p-3`,
          children: (0, T.jsx)(`p`, {
            className: `text-sm text-destructive`,
            children: i.error,
          }),
        })),
      (e[15] = i.error),
      (e[16] = B));
  let V;
  e[17] !== z || e[18] !== B
    ? ((V = (0, T.jsxs)(`div`, { className: `space-y-4`, children: [z, B] })),
      (e[17] = z),
      (e[18] = B),
      (e[19] = V))
    : (V = e[19]);
  let H;
  e[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((H = () => N(!1)), (e[20] = H))
    : (H = e[20]);
  let U;
  e[21] === i.isSubmitting
    ? (U = e[22])
    : ((U = (0, T.jsx)(y, {
        variant: `outline`,
        onClick: H,
        disabled: i.isSubmitting,
        children: `Cancel`,
      })),
      (e[21] = i.isSubmitting),
      (e[22] = U));
  let W = i.isSubmitting ? `Creating...` : `Create`,
    G;
  e[23] !== i.isSubmitting || e[24] !== E || e[25] !== W
    ? ((G = (0, T.jsx)(y, {
        onClick: E,
        disabled: i.isSubmitting,
        children: W,
      })),
      (e[23] = i.isSubmitting),
      (e[24] = E),
      (e[25] = W),
      (e[26] = G))
    : (G = e[26]);
  let K;
  e[27] !== U || e[28] !== G
    ? ((K = (0, T.jsxs)(d, { children: [U, G] })),
      (e[27] = U),
      (e[28] = G),
      (e[29] = K))
    : (K = e[29]);
  let q;
  e[30] !== V || e[31] !== K
    ? ((q = (0, T.jsxs)(f, { children: [I, V, K] })),
      (e[30] = V),
      (e[31] = K),
      (e[32] = q))
    : (q = e[32]);
  let J;
  e[33] !== i.open || e[34] !== q
    ? ((J = (0, T.jsxs)(`div`, {
        className: `mb-4 flex items-center justify-between`,
        children: [
          P,
          (0, T.jsxs)(u, { open: i.open, onOpenChange: N, children: [F, q] }),
        ],
      })),
      (e[33] = i.open),
      (e[34] = q),
      (e[35] = J))
    : (J = e[35]);
  let Y;
  e[36] === t ? (Y = e[37]) : ((Y = t.map(O)), (e[36] = t), (e[37] = Y));
  let X;
  e[38] === Y
    ? (X = e[39])
    : ((X = (0, T.jsx)(`div`, {
        className: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`,
        children: Y,
      })),
      (e[38] = Y),
      (e[39] = X));
  let Z;
  e[40] === t.length
    ? (Z = e[41])
    : ((Z =
        t.length === 0 &&
        (0, T.jsx)(h, {
          className: `mt-8`,
          children: (0, T.jsxs)(m, {
            className: `flex flex-col items-center justify-center py-12`,
            children: [
              (0, T.jsx)(x, {
                size: 48,
                className: `mb-4 text-muted-foreground/50`,
              }),
              (0, T.jsx)(`p`, {
                className: `mb-2 text-sm font-medium`,
                children: `No teams yet`,
              }),
              (0, T.jsx)(`p`, {
                className: `mb-4 text-xs text-muted-foreground`,
                children: `Create a team to collaborate on codebases`,
              }),
              (0, T.jsxs)(y, {
                size: `sm`,
                onClick: () => g(D),
                children: [
                  (0, T.jsx)(b, { size: 16, className: `mr-1.5` }),
                  `Create Team`,
                ],
              }),
            ],
          }),
        })),
      (e[40] = t.length),
      (e[41] = Z));
  let Q;
  return (
    e[42] !== J || e[43] !== X || e[44] !== Z
      ? ((Q = (0, T.jsxs)(S, { title: `Teams`, children: [J, X, Z] })),
        (e[42] = J),
        (e[43] = X),
        (e[44] = Z),
        (e[45] = Q))
      : (Q = e[45]),
    Q
  );
}
function D(e) {
  return { ...e, open: !0 };
}
function O(e) {
  return (0, T.jsx)(
    r,
    {
      to: `/teams/$teamId`,
      params: { teamId: e._id },
      children: (0, T.jsx)(h, {
        className: `h-full transition-colors hover:bg-accent/50`,
        children: (0, T.jsx)(g, {
          children: (0, T.jsxs)(`div`, {
            className: `flex items-start justify-between`,
            children: [
              (0, T.jsxs)(`div`, {
                className: `flex items-center gap-2`,
                children: [
                  (0, T.jsx)(`div`, {
                    className: `flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10`,
                    children: (0, T.jsx)(x, {
                      size: 16,
                      className: `text-primary`,
                    }),
                  }),
                  (0, T.jsx)(v, {
                    className: `text-base`,
                    children: e.displayName ?? e.name,
                  }),
                ],
              }),
              (0, T.jsx)(`span`, {
                className: `rounded-full bg-secondary px-2 py-0.5 text-xs font-medium`,
                children: e.userRole,
              }),
            ],
          }),
        }),
      }),
    },
    e._id,
  );
}
function k(e) {
  return { ...e, open: !0 };
}
function A(e) {
  return { ...e, error: ``, isSubmitting: !0 };
}
function j(e) {
  return { ...e, error: `Team name is required` };
}
var M = E;
export { M as component };
