import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { n } from "./backend-BVlbQtYj.js";
import { t as r } from "./hooks-B_9i2gKL.js";
import {
  $t as i,
  Jt as a,
  Kt as o,
  Qt as s,
  Xt as c,
  ar as l,
  ir as u,
  qt as d,
} from "./src-DzioQSsH.js";
import { t as f } from "./IconChecklist-Bh1NM8HY.js";
import { t as p } from "./IconGitPullRequest-A3RyN7ym.js";
import { t as m } from "./IconPercentage-BsDAoz3z.js";
import { t as h } from "./IconUsers-C0ORl3PB.js";
import { n as g } from "./dates-DHZmrCUU.js";
import { S as ee, d as _ } from "./search-params-2NJX6Or7.js";
import { n as v } from "./RepoContext-Dg6-rqFp.js";
var y = t(),
  b = [
    { value: `1d`, label: `1D` },
    { value: `3d`, label: `3D` },
    { value: `1w`, label: `1W` },
    { value: `1m`, label: `1M` },
    { value: `3m`, label: `3M` },
    { value: `6m`, label: `6M` },
    { value: `1y`, label: `1Y` },
    { value: `all`, label: `All` },
  ];
function te(e) {
  return b.some((t) => t.value === e);
}
var x = 864e5,
  S = 36e5;
function ne(e) {
  if (e !== `all`)
    return e === `1d`
      ? g().subtract(1, `day`).valueOf()
      : e === `3d`
        ? g().subtract(3, `day`).valueOf()
        : e === `1w`
          ? g().subtract(1, `week`).valueOf()
          : e === `1m`
            ? g().subtract(1, `month`).valueOf()
            : e === `3m`
              ? g().subtract(3, `month`).valueOf()
              : e === `6m`
                ? g().subtract(6, `month`).valueOf()
                : g().subtract(1, `year`).valueOf();
}
function re(e) {
  return e === `all`
    ? { startTime: 0, bucketSizeMs: 30 * x }
    : e === `1d`
      ? { startTime: g().subtract(1, `day`).valueOf(), bucketSizeMs: 2 * S }
      : e === `3d`
        ? { startTime: g().subtract(3, `day`).valueOf(), bucketSizeMs: 6 * S }
        : e === `1w`
          ? { startTime: g().subtract(1, `week`).valueOf(), bucketSizeMs: x }
          : e === `1m`
            ? {
                startTime: g().subtract(1, `month`).valueOf(),
                bucketSizeMs: 3 * x,
              }
            : e === `3m`
              ? {
                  startTime: g().subtract(3, `month`).valueOf(),
                  bucketSizeMs: 7 * x,
                }
              : e === `6m`
                ? {
                    startTime: g().subtract(6, `month`).valueOf(),
                    bucketSizeMs: 14 * x,
                  }
                : {
                    startTime: g().subtract(1, `year`).valueOf(),
                    bucketSizeMs: 30 * x,
                  };
}
var C = e();
function w(e) {
  let t = (0, y.c)(12),
    { values: n, toneClassName: r } = e,
    i;
  if (t[0] !== n) {
    let e = n.length === 0 ? [0, 0] : n.length === 1 ? [n[0], n[0]] : n,
      r = Math.min(...e),
      a = Math.max(...e) - r;
    ((i = e
      .map(
        (t, n) =>
          `${2 + (n / (e.length - 1)) * 92},${32 - (a === 0 ? 0.5 : (t - r) / a) * 30}`,
      )
      .join(` `)),
      (t[0] = n),
      (t[1] = i));
  } else i = t[1];
  let a = i,
    o = `2,32 ${a} 94,32`,
    s = `h-[34px] w-24 ${r}`,
    c;
  t[2] === o
    ? (c = t[3])
    : ((c = (0, C.jsx)(`polyline`, {
        points: o,
        fill: `currentColor`,
        fillOpacity: 0.12,
        stroke: `none`,
      })),
      (t[2] = o),
      (t[3] = c));
  let l;
  t[4] === a
    ? (l = t[5])
    : ((l = (0, C.jsx)(`polyline`, {
        points: a,
        fill: `none`,
        stroke: `currentColor`,
        strokeOpacity: 0.9,
        strokeWidth: 2,
        strokeLinecap: `round`,
        strokeLinejoin: `round`,
      })),
      (t[4] = a),
      (t[5] = l));
  let u;
  t[6] !== c || t[7] !== l
    ? ((u = (0, C.jsxs)(`svg`, {
        viewBox: `0 0 96 34`,
        className: `h-full w-full`,
        children: [c, l],
      })),
      (t[6] = c),
      (t[7] = l),
      (t[8] = u))
    : (u = t[8]);
  let d;
  return (
    t[9] !== s || t[10] !== u
      ? ((d = (0, C.jsx)(`div`, { className: s, children: u })),
        (t[9] = s),
        (t[10] = u),
        (t[11] = d))
      : (d = t[11]),
    d
  );
}
function T(e) {
  let t = (0, y.c)(18),
    { icon: n, label: r, value: i, trendValues: a, trendToneClassName: o } = e,
    s;
  t[0] === n
    ? (s = t[1])
    : ((s = (0, C.jsx)(n, {
        size: 20,
        className: `text-primary sm:size-6 shrink-0`,
      })),
      (t[0] = n),
      (t[1] = s));
  let c;
  t[2] === i
    ? (c = t[3])
    : ((c = (0, C.jsx)(`p`, {
        className: `text-xl font-semibold text-foreground tabular-nums sm:text-2xl`,
        children: i,
      })),
      (t[2] = i),
      (t[3] = c));
  let d;
  t[4] === r
    ? (d = t[5])
    : ((d = (0, C.jsx)(`p`, {
        className: `text-sm text-muted-foreground mt-1`,
        children: r,
      })),
      (t[4] = r),
      (t[5] = d));
  let f;
  t[6] !== c || t[7] !== d
    ? ((f = (0, C.jsxs)(`div`, { children: [c, d] })),
      (t[6] = c),
      (t[7] = d),
      (t[8] = f))
    : (f = t[8]);
  let p;
  t[9] !== s || t[10] !== f
    ? ((p = (0, C.jsxs)(`div`, {
        className: `flex items-center gap-2 sm:gap-3`,
        children: [s, f],
      })),
      (t[9] = s),
      (t[10] = f),
      (t[11] = p))
    : (p = t[11]);
  let m;
  t[12] !== o || t[13] !== a
    ? ((m = (0, C.jsx)(w, { values: a, toneClassName: o })),
      (t[12] = o),
      (t[13] = a),
      (t[14] = m))
    : (m = t[14]);
  let h;
  return (
    t[15] !== p || t[16] !== m
      ? ((h = (0, C.jsx)(u, {
          className: `ui-surface-interactive h-full`,
          children: (0, C.jsxs)(l, {
            className: `flex h-full items-center justify-between gap-2 p-3 sm:gap-3 sm:p-5`,
            children: [p, m],
          }),
        })),
        (t[15] = p),
        (t[16] = m),
        (t[17] = h))
      : (h = t[17]),
    h
  );
}
function E() {
  let e = (0, y.c)(46),
    { repo: t } = v(),
    [c, l] = ee(`statsRange`, _),
    u;
  e[0] === c ? (u = e[1]) : ((u = ne(c)), (e[0] = c), (e[1] = u));
  let g = u,
    x;
  e[2] === c ? (x = e[3]) : ((x = re(c)), (e[2] = c), (e[3] = x));
  let S = x,
    w;
  e[4] !== t._id || e[5] !== g
    ? ((w = { repoId: t._id, startTime: g }),
      (e[4] = t._id),
      (e[5] = g),
      (e[6] = w))
    : (w = e[6]);
  let E = r(n.analytics.getImpactStats, w),
    M;
  e[7] === t._id
    ? (M = e[8])
    : ((M = { repoId: t._id }), (e[7] = t._id), (e[8] = M));
  let N = r(n.analytics.getActiveUsers, M),
    P;
  e[9] !== t._id || e[10] !== S.bucketSizeMs || e[11] !== S.startTime
    ? ((P = {
        repoId: t._id,
        startTime: S.startTime,
        bucketSizeMs: S.bucketSizeMs,
      }),
      (e[9] = t._id),
      (e[10] = S.bucketSizeMs),
      (e[11] = S.startTime),
      (e[12] = P))
    : (P = e[12]);
  let F = r(n.analytics.getActivityTimeline, P),
    I = E === void 0 || N === void 0 || F === void 0,
    L;
  e[13] === F ? (L = e[14]) : ((L = F?.map(j) ?? []), (e[13] = F), (e[14] = L));
  let R = L,
    z;
  e[15] === F ? (z = e[16]) : ((z = F?.map(A) ?? []), (e[15] = F), (e[16] = z));
  let B = z,
    V;
  e[17] === F ? (V = e[18]) : ((V = F?.map(k) ?? []), (e[17] = F), (e[18] = V));
  let H = V,
    U;
  e[19] === F ? (U = e[20]) : ((U = F?.map(O) ?? []), (e[19] = F), (e[20] = U));
  let W = U,
    G;
  e[21] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((G = (0, C.jsxs)(`div`, {
        className: `flex items-center gap-2 w-max`,
        children: [
          (0, C.jsx)(`img`, {
            src: `/icon.png`,
            alt: `Eva`,
            width: 30,
            height: 30,
            className: `rounded-full`,
          }),
          (0, C.jsx)(`span`, {
            className: `text-xl tracking-tight font-semibold text-primary`,
            children: `Eva's Stats`,
          }),
        ],
      })),
      (e[21] = G))
    : (G = e[21]);
  let K;
  e[22] !== t.name || e[23] !== t.owner
    ? ((K = (0, C.jsxs)(`div`, {
        children: [
          G,
          (0, C.jsxs)(`p`, {
            className: `mt-2 text-sm font-medium text-muted-foreground`,
            children: [t.owner, `/`, t.name],
          }),
        ],
      })),
      (e[22] = t.name),
      (e[23] = t.owner),
      (e[24] = K))
    : (K = e[24]);
  let q;
  e[25] === l
    ? (q = e[26])
    : ((q = (e) => {
        te(e) && l(e);
      }),
      (e[25] = l),
      (e[26] = q));
  let J;
  e[27] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((J = (0, C.jsx)(s, {
        className: `h-9 w-[110px]`,
        children: (0, C.jsx)(i, {}),
      })),
      (e[27] = J))
    : (J = e[27]);
  let Y;
  e[28] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Y = (0, C.jsx)(a, { children: b.map(D) })), (e[28] = Y))
    : (Y = e[28]);
  let X;
  e[29] !== c || e[30] !== q
    ? ((X = (0, C.jsxs)(d, { value: c, onValueChange: q, children: [J, Y] })),
      (e[29] = c),
      (e[30] = q),
      (e[31] = X))
    : (X = e[31]);
  let Z;
  e[32] !== K || e[33] !== X
    ? ((Z = (0, C.jsx)(`div`, {
        className: `ui-surface p-5 sm:p-6`,
        children: (0, C.jsxs)(`div`, {
          className: `flex items-start justify-between gap-4`,
          children: [K, X],
        }),
      })),
      (e[32] = K),
      (e[33] = X),
      (e[34] = Z))
    : (Z = e[34]);
  let Q;
  e[35] !== N ||
  e[36] !== H ||
  e[37] !== E ||
  e[38] !== I ||
  e[39] !== R ||
  e[40] !== B ||
  e[41] !== W
    ? ((Q = I
        ? (0, C.jsx)(`div`, {
            className: `flex items-center justify-center py-12`,
            children: (0, C.jsx)(o, {}),
          })
        : (0, C.jsxs)(`div`, {
            className: `grid grid-cols-1 gap-4 sm:grid-cols-2`,
            children: [
              (0, C.jsx)(T, {
                icon: p,
                label: `PRs Shipped`,
                value: E.prsShipped,
                trendValues: R,
                trendToneClassName: `text-chart-1`,
              }),
              (0, C.jsx)(T, {
                icon: m,
                label: `Cook Rate`,
                value: E.shipRate + `%`,
                trendValues: B,
                trendToneClassName: `text-chart-2`,
              }),
              (0, C.jsx)(T, {
                icon: h,
                label: `Cookers Now`,
                value: N.count,
                trendValues: H,
                trendToneClassName: `text-chart-3`,
              }),
              (0, C.jsx)(T, {
                icon: f,
                label: `Tasks Done`,
                value: E.tasksCompleted,
                trendValues: W,
                trendToneClassName: `text-chart-4`,
              }),
            ],
          })),
      (e[35] = N),
      (e[36] = H),
      (e[37] = E),
      (e[38] = I),
      (e[39] = R),
      (e[40] = B),
      (e[41] = W),
      (e[42] = Q))
    : (Q = e[42]);
  let $;
  return (
    e[43] !== Z || e[44] !== Q
      ? (($ = (0, C.jsx)(`div`, {
          className: `flex h-full items-center justify-center p-4 sm:p-6`,
          children: (0, C.jsxs)(`div`, {
            className: `w-full max-w-3xl space-y-4`,
            children: [Z, Q],
          }),
        })),
        (e[43] = Z),
        (e[44] = Q),
        (e[45] = $))
      : ($ = e[45]),
    $
  );
}
function D(e) {
  return (0, C.jsx)(c, { value: e.value, children: e.label }, e.value);
}
function O(e) {
  return e.tasksCompleted;
}
function k(e) {
  return e.activeUsers;
}
function A(e) {
  return e.sessions > 0 ? Math.round((e.sessionsWithPr / e.sessions) * 100) : 0;
}
function j(e) {
  return e.prsShipped;
}
var M = E;
export { M as component };
