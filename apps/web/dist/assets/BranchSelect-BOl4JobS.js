import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { n as ee, o as i } from "./backend-BVlbQtYj.js";
import {
  Dr as a,
  Fn as o,
  In as s,
  Ln as c,
  Mn as l,
  Nn as u,
  Pn as d,
  Tr as f,
  nn as p,
  rn as m,
  tn as h,
  ur as g,
  wr as _,
} from "./src-DzioQSsH.js";
import { t as v } from "./IconGitBranch-otCxAQ3G.js";
import { t as y } from "./IconLoader2-BhUbT1Hm.js";
import { n as b } from "./RepoContext-Dg6-rqFp.js";
var te = r(),
  x = e(t(), 1),
  S = 3600 * 1e3,
  C = new Map();
function w(e, t) {
  return `${e}/${t}`;
}
function T(e) {
  let t = C.get(e);
  return t
    ? Date.now() - t.timestamp > S
      ? (C.delete(e), null)
      : t.branches
    : null;
}
function E(e, t, n, r) {
  let a = (0, te.c)(25),
    o = r === void 0 ? !0 : r,
    s,
    c;
  a[0] !== e || a[1] !== t
    ? ((s = w(e, t)),
      (c = T(s)),
      (a[0] = e),
      (a[1] = t),
      (a[2] = s),
      (a[3] = c))
    : ((s = a[2]), (c = a[3]));
  let l = c,
    u;
  a[4] === l ? (u = a[5]) : ((u = l ?? []), (a[4] = l), (a[5] = u));
  let [d, f] = (0, x.useState)(u),
    [p, m] = (0, x.useState)(o && !l),
    [h, g] = (0, x.useState)(!1),
    _ = i(ee.github.listBranches),
    v;
  a[6] !== s || a[7] !== _ || a[8] !== n || a[9] !== e || a[10] !== t
    ? ((v = async () => {
        try {
          let r = await _({ installationId: n, owner: e, repo: t });
          (C.set(s, { branches: r, timestamp: Date.now() }), f(r));
        } catch (e) {
          console.error(`Failed to fetch branches:`, e);
        }
      }),
      (a[6] = s),
      (a[7] = _),
      (a[8] = n),
      (a[9] = e),
      (a[10] = t),
      (a[11] = v))
    : (v = a[11]);
  let y = v,
    b,
    S;
  (a[12] !== s || a[13] !== o || a[14] !== y
    ? ((b = () => {
        if (!o) return;
        let e = T(s);
        if (e) {
          (f(e), m(!1));
          return;
        }
        (m(!0), y().finally(() => m(!1)));
      }),
      (S = [y, o, s]),
      (a[12] = s),
      (a[13] = o),
      (a[14] = y),
      (a[15] = b),
      (a[16] = S))
    : ((b = a[15]), (S = a[16])),
    (0, x.useEffect)(b, S));
  let E;
  a[17] !== s || a[18] !== y
    ? ((E = async () => {
        (g(!0), C.delete(s), await y(), g(!1));
      }),
      (a[17] = s),
      (a[18] = y),
      (a[19] = E))
    : (E = a[19]);
  let D = E,
    O;
  return (
    a[20] !== d || a[21] !== p || a[22] !== h || a[23] !== D
      ? ((O = { branches: d, isLoading: p, isValidating: h, refresh: D }),
        (a[20] = d),
        (a[21] = p),
        (a[22] = h),
        (a[23] = D),
        (a[24] = O))
      : (O = a[24]),
    O
  );
}
var D = n();
function O(e) {
  let t = (0, te.c)(38),
    {
      value: n,
      onValueChange: r,
      className: ee,
      disabled: i,
      placeholder: S,
    } = e,
    C = S === void 0 ? `Select a branch` : S,
    { repo: w } = b(),
    [T, O] = (0, x.useState)(!1),
    [re, ie] = (0, x.useState)(!1),
    [k, ae] = (0, x.useState)(``),
    { branches: A, isLoading: j } = E(w.owner, w.name, w.installationId, re),
    M = (0, x.useRef)(null),
    N,
    P;
  (t[0] === T
    ? ((N = t[1]), (P = t[2]))
    : ((N = () => {
        T && M.current && (M.current.scrollTop = 0);
      }),
      (P = [T]),
      (t[0] = T),
      (t[1] = N),
      (t[2] = P)),
    (0, x.useEffect)(N, P));
  let F, I;
  (t[3] === j
    ? ((F = t[4]), (I = t[5]))
    : ((F = () => {
        !j && M.current && (M.current.scrollTop = 0);
      }),
      (I = [j]),
      (t[3] = j),
      (t[4] = F),
      (t[5] = I)),
    (0, x.useEffect)(F, I));
  let L;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((L = () => {
        M.current && (M.current.scrollTop = 0);
      }),
      (t[6] = L))
    : (L = t[6]);
  let R;
  (t[7] === k ? (R = t[8]) : ((R = [k]), (t[7] = k), (t[8] = R)),
    (0, x.useEffect)(L, R));
  let z = i ? !1 : T,
    B;
  t[9] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((B = (e) => {
        (O(e), e ? ie(!0) : ae(``));
      }),
      (t[9] = B))
    : (B = t[9]);
  let V = ee ?? `h-8 text-sm`,
    H;
  t[10] === V
    ? (H = t[11])
    : ((H = a(`w-full justify-between`, V)), (t[10] = V), (t[11] = H));
  let U;
  t[12] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((U = (0, D.jsx)(v, {
        size: 14,
        className: `text-muted-foreground shrink-0`,
      })),
      (t[12] = U))
    : (U = t[12]);
  let W = !n && `text-muted-foreground`,
    G;
  t[13] === W
    ? (G = t[14])
    : ((G = a(`truncate`, W)), (t[13] = W), (t[14] = G));
  let K = n || C,
    q;
  t[15] !== G || t[16] !== K
    ? ((q = (0, D.jsxs)(`div`, {
        className: `flex items-center gap-1.5 min-w-0 flex-1`,
        children: [U, (0, D.jsx)(`span`, { className: G, children: K })],
      })),
      (t[15] = G),
      (t[16] = K),
      (t[17] = q))
    : (q = t[17]);
  let J;
  t[18] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((J = (0, D.jsx)(_, { size: 14, className: `ml-2 opacity-60 shrink-0` })),
      (t[18] = J))
    : (J = t[18]);
  let Y;
  t[19] !== i || t[20] !== T || t[21] !== H || t[22] !== q
    ? ((Y = (0, D.jsx)(m, {
        asChild: !0,
        children: (0, D.jsxs)(g, {
          variant: `outline`,
          role: `combobox`,
          "aria-expanded": T,
          disabled: i,
          className: H,
          children: [q, J],
        }),
      })),
      (t[19] = i),
      (t[20] = T),
      (t[21] = H),
      (t[22] = q),
      (t[23] = Y))
    : (Y = t[23]);
  let X;
  t[24] === k
    ? (X = t[25])
    : ((X = (0, D.jsx)(o, {
        placeholder: `Search branches...`,
        value: k,
        onValueChange: ae,
      })),
      (t[24] = k),
      (t[25] = X));
  let Z;
  t[26] !== A || t[27] !== j || t[28] !== r || t[29] !== n
    ? ((Z = (0, D.jsx)(c, {
        ref: M,
        className: `max-h-[300px]`,
        onWheel: ne,
        children: j
          ? (0, D.jsxs)(`div`, {
              className: `flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground`,
              children: [
                (0, D.jsx)(y, { size: 14, className: `animate-spin` }),
                (0, D.jsx)(`span`, { children: `Loading branches...` }),
              ],
            })
          : (0, D.jsxs)(D.Fragment, {
              children: [
                (0, D.jsx)(u, { children: `No branch found.` }),
                (0, D.jsx)(d, {
                  children: A.map((e) =>
                    (0, D.jsxs)(
                      s,
                      {
                        value: e.name,
                        onSelect: (e) => {
                          (r(e), O(!1));
                        },
                        children: [
                          (0, D.jsx)(v, {
                            size: 14,
                            className: `text-muted-foreground`,
                          }),
                          e.name,
                          (0, D.jsx)(f, {
                            size: 14,
                            className: a(
                              `ml-auto`,
                              n === e.name ? `opacity-100` : `opacity-0`,
                            ),
                          }),
                        ],
                      },
                      e.name,
                    ),
                  ),
                }),
              ],
            }),
      })),
      (t[26] = A),
      (t[27] = j),
      (t[28] = r),
      (t[29] = n),
      (t[30] = Z))
    : (Z = t[30]);
  let Q;
  t[31] !== X || t[32] !== Z
    ? ((Q = (0, D.jsx)(p, {
        className: `w-[min(320px,calc(100vw-2rem))] p-0`,
        align: `start`,
        children: (0, D.jsxs)(l, { children: [X, Z] }),
      })),
      (t[31] = X),
      (t[32] = Z),
      (t[33] = Q))
    : (Q = t[33]);
  let $;
  return (
    t[34] !== Y || t[35] !== Q || t[36] !== z
      ? (($ = (0, D.jsxs)(h, {
          open: z,
          onOpenChange: B,
          modal: !1,
          children: [Y, Q],
        })),
        (t[34] = Y),
        (t[35] = Q),
        (t[36] = z),
        (t[37] = $))
      : ($ = t[37]),
    $
  );
}
function ne(e) {
  return e.stopPropagation();
}
export { O as t };
