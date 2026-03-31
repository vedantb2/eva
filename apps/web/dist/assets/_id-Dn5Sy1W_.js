import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, t as i } from "./index-CuMF3NGg.js";
import { c as a, n as o, t as s } from "./backend-BVlbQtYj.js";
import { t as c } from "./hooks-B_9i2gKL.js";
import { o as l } from "./chunk-5FQGJX7Z-Bf0FmJe5.js";
import {
  $t as u,
  Cr as d,
  Dr as f,
  Gt as p,
  Ht as m,
  Jt as h,
  Kt as g,
  Qt as _,
  Tr as v,
  Ut as y,
  Wt as b,
  Xt as x,
  Zn as S,
  dr as C,
  n as w,
  on as T,
  qt as E,
  r as D,
  sn as O,
  t as k,
  ur as A,
  vt as j,
  wr as M,
  xr as N,
  xt as P,
  yt as F,
} from "./src-DHCpG1Q-.js";
import { t as I } from "./IconAlertTriangle-B1Mqbt3_.js";
import { t as L } from "./IconExternalLink-DInhr4-B.js";
import { t as R } from "./IconPlayerPlay-D3JRfC8r.js";
import { n as z } from "./dates-DHZmrCUU.js";
import { t as B } from "./PageWrapper-CdtdiTMb.js";
import { t as ee } from "./parseActivitySteps-BClmcBqd.js";
import { t as te } from "./formatDuration-Bscl8bMO.js";
import { t as V } from "./CronScheduleCard-CVMoB272.js";
var H = r(),
  U = e(t(), 1),
  W = n(),
  G = {
    critical: `bg-red-500/15 text-red-700 dark:text-red-400`,
    high: `bg-orange-500/15 text-orange-700 dark:text-orange-400`,
    medium: `bg-yellow-500/15 text-yellow-700 dark:text-yellow-400`,
    low: `bg-blue-500/15 text-blue-700 dark:text-blue-400`,
  };
function ne({ run: e, repoOwner: t, repoName: n }) {
  let r = e.findings ?? [],
    [i, s] = (0, U.useState)(new Set()),
    [c, l] = (0, U.useState)(!1),
    u = a(o.automations.createTasksFromFindings),
    d = r.filter((e) => !e.taskId),
    f = d.length > 0 && d.every((e) => i.has(e.id));
  function p(e) {
    s((t) => {
      let n = new Set(t);
      return (n.has(e) ? n.delete(e) : n.add(e), n);
    });
  }
  function m() {
    s(f ? new Set() : new Set(d.map((e) => e.id)));
  }
  async function h(t) {
    if (i.size !== 0) {
      l(!0);
      try {
        (await u({ runId: e._id, findingIds: Array.from(i), autoRun: t }),
          s(new Set()));
      } finally {
        l(!1);
      }
    }
  }
  return (0, W.jsxs)(`div`, {
    className: `space-y-2`,
    children: [
      d.length > 0 &&
        (0, W.jsxs)(`div`, {
          className: `flex items-center gap-2 pb-1`,
          children: [
            (0, W.jsx)(S, { checked: f, onCheckedChange: m }),
            (0, W.jsxs)(`span`, {
              className: `text-xs text-muted-foreground`,
              children: [`Select all (`, d.length, `)`],
            }),
          ],
        }),
      r.map((e) =>
        (0, W.jsx)(
          K,
          {
            finding: e,
            selected: i.has(e.id),
            onToggle: () => p(e.id),
            repoOwner: t,
            repoName: n,
          },
          e.id,
        ),
      ),
      d.length > 0 &&
        (0, W.jsxs)(`div`, {
          className: `flex items-center gap-2 pt-2`,
          children: [
            (0, W.jsxs)(A, {
              size: `sm`,
              variant: `outline`,
              disabled: i.size === 0 || c,
              onClick: () => h(!1),
              children: [
                c && (0, W.jsx)(g, { size: `sm` }),
                `Create Tasks (`,
                i.size,
                `)`,
              ],
            }),
            (0, W.jsxs)(A, {
              size: `sm`,
              disabled: i.size === 0 || c,
              onClick: () => h(!0),
              children: [
                c && (0, W.jsx)(g, { size: `sm` }),
                `Create & Run (`,
                i.size,
                `)`,
              ],
            }),
          ],
        }),
    ],
  });
}
function K(e) {
  let t = (0, H.c)(34),
    { finding: n, selected: r, onToggle: i, repoOwner: a, repoName: o } = e,
    [s, c] = (0, U.useState)(!1),
    l = n.taskId !== void 0,
    u = l ? `/${a}/${o}/quick-tasks?taskId=${n.taskId}` : null,
    p;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((p = f(`rounded-lg bg-muted/40 overflow-hidden`)), (t[0] = p))
    : (p = t[0]);
  let m = l ? !0 : r,
    h;
  t[1] !== l || t[2] !== i || t[3] !== m
    ? ((h = (0, W.jsx)(S, { checked: m, disabled: l, onCheckedChange: i })),
      (t[1] = l),
      (t[2] = i),
      (t[3] = m),
      (t[4] = h))
    : (h = t[4]);
  let g;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = () => c(J)), (t[5] = g))
    : (g = t[5]);
  let _;
  t[6] === s
    ? (_ = t[7])
    : ((_ = s
        ? (0, W.jsx)(M, {
            size: 14,
            className: `shrink-0 text-muted-foreground`,
          })
        : (0, W.jsx)(d, {
            size: 14,
            className: `shrink-0 text-muted-foreground`,
          })),
      (t[6] = s),
      (t[7] = _));
  let v = G[n.severity],
    y;
  t[8] === v
    ? (y = t[9])
    : ((y = f(
        `inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium`,
        v,
      )),
      (t[8] = v),
      (t[9] = y));
  let b;
  t[10] !== n.severity || t[11] !== y
    ? ((b = (0, W.jsx)(`span`, { className: y, children: n.severity })),
      (t[10] = n.severity),
      (t[11] = y),
      (t[12] = b))
    : (b = t[12]);
  let x;
  t[13] === n.title
    ? (x = t[14])
    : ((x = (0, W.jsx)(`span`, {
        className: `text-sm font-medium truncate`,
        children: n.title,
      })),
      (t[13] = n.title),
      (t[14] = x));
  let C;
  t[15] !== _ || t[16] !== b || t[17] !== x
    ? ((C = (0, W.jsxs)(`button`, {
        type: `button`,
        onClick: g,
        className: `flex flex-1 items-center gap-2 text-left min-w-0`,
        children: [_, b, x],
      })),
      (t[15] = _),
      (t[16] = b),
      (t[17] = x),
      (t[18] = C))
    : (C = t[18]);
  let w;
  t[19] !== l || t[20] !== u
    ? ((w =
        l &&
        u &&
        (0, W.jsxs)(`a`, {
          href: u,
          className: `inline-flex items-center gap-1 text-xs text-primary hover:underline shrink-0`,
          children: [(0, W.jsx)(L, { size: 12 }), `Task created`],
        })),
      (t[19] = l),
      (t[20] = u),
      (t[21] = w))
    : (w = t[21]);
  let T;
  t[22] !== C || t[23] !== w || t[24] !== h
    ? ((T = (0, W.jsxs)(`div`, {
        className: `flex items-center gap-3 px-3 py-2.5`,
        children: [h, C, w],
      })),
      (t[22] = C),
      (t[23] = w),
      (t[24] = h),
      (t[25] = T))
    : (T = t[25]);
  let E;
  t[26] !== s ||
  t[27] !== n.description ||
  t[28] !== n.filePaths ||
  t[29] !== n.suggestedFix
    ? ((E =
        s &&
        (0, W.jsxs)(`div`, {
          className: `px-3 pb-3 pl-10 space-y-2`,
          children: [
            (0, W.jsx)(`p`, {
              className: `text-sm text-muted-foreground whitespace-pre-wrap`,
              children: n.description,
            }),
            n.filePaths &&
              n.filePaths.length > 0 &&
              (0, W.jsxs)(`div`, {
                children: [
                  (0, W.jsx)(`p`, {
                    className: `text-xs font-medium text-muted-foreground mb-1`,
                    children: `Files`,
                  }),
                  (0, W.jsx)(`div`, {
                    className: `flex flex-wrap gap-1`,
                    children: n.filePaths.map(q),
                  }),
                ],
              }),
            n.suggestedFix &&
              (0, W.jsxs)(`div`, {
                children: [
                  (0, W.jsx)(`p`, {
                    className: `text-xs font-medium text-muted-foreground mb-1`,
                    children: `Suggested Fix`,
                  }),
                  (0, W.jsx)(`p`, {
                    className: `text-sm text-muted-foreground whitespace-pre-wrap`,
                    children: n.suggestedFix,
                  }),
                ],
              }),
          ],
        })),
      (t[26] = s),
      (t[27] = n.description),
      (t[28] = n.filePaths),
      (t[29] = n.suggestedFix),
      (t[30] = E))
    : (E = t[30]);
  let D;
  return (
    t[31] !== T || t[32] !== E
      ? ((D = (0, W.jsxs)(`div`, { className: p, children: [T, E] })),
        (t[31] = T),
        (t[32] = E),
        (t[33] = D))
      : (D = t[33]),
    D
  );
}
function q(e) {
  return (0, W.jsx)(
    `span`,
    {
      className: `inline-block rounded bg-muted px-1.5 py-0.5 text-xs font-mono`,
      children: e,
    },
    e,
  );
}
function J(e) {
  return !e;
}
var re = { cjk: P, math: F, mermaid: j };
function Y(e) {
  let t = (0, H.c)(45),
    { automation: n, repoOwner: r, repoName: i } = e,
    s = a(o.automations.update),
    l = a(o.automations.runNow),
    u;
  t[0] === n._id
    ? (u = t[1])
    : ((u = { automationId: n._id }), (t[0] = n._id), (t[1] = u));
  let d = c(o.automations.listRuns, u),
    h;
  t[2] === d ? (h = t[3]) : ((h = d?.some(X)), (t[2] = d), (t[3] = h));
  let g = h,
    _;
  t[4] === n.title
    ? (_ = t[5])
    : ((_ = (0, W.jsx)(`span`, { children: n.title })),
      (t[4] = n.title),
      (t[5] = _));
  let v;
  t[6] !== n._id || t[7] !== n.enabled || t[8] !== s
    ? ((v = () => s({ id: n._id, enabled: !n.enabled })),
      (t[6] = n._id),
      (t[7] = n.enabled),
      (t[8] = s),
      (t[9] = v))
    : (v = t[9]);
  let x = n.enabled ? `bg-emerald-500` : `bg-muted-foreground/30`,
    S;
  t[10] === x
    ? (S = t[11])
    : ((S = f(
        `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
        x,
      )),
      (t[10] = x),
      (t[11] = S));
  let C = n.enabled ? `translate-x-5` : `translate-x-0`,
    w;
  t[12] === C
    ? (w = t[13])
    : ((w = f(
        `pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform`,
        C,
      )),
      (t[12] = C),
      (t[13] = w));
  let T;
  t[14] === w
    ? (T = t[15])
    : ((T = (0, W.jsx)(`span`, { className: w })), (t[14] = w), (t[15] = T));
  let E;
  t[16] !== v || t[17] !== S || t[18] !== T
    ? ((E = (0, W.jsx)(`button`, {
        type: `button`,
        onClick: v,
        className: S,
        children: T,
      })),
      (t[16] = v),
      (t[17] = S),
      (t[18] = T),
      (t[19] = E))
    : (E = t[19]);
  let D;
  t[20] !== E || t[21] !== _
    ? ((D = (0, W.jsxs)(`div`, {
        className: `flex items-center gap-3`,
        children: [_, E],
      })),
      (t[20] = E),
      (t[21] = _),
      (t[22] = D))
    : (D = t[22]);
  let O = g === !0 || !n.description,
    k;
  t[23] !== n._id || t[24] !== l
    ? ((k = () => l({ automationId: n._id })),
      (t[23] = n._id),
      (t[24] = l),
      (t[25] = k))
    : (k = t[25]);
  let j;
  t[26] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((j = (0, W.jsx)(R, { size: 14 })), (t[26] = j))
    : (j = t[26]);
  let M;
  t[27] !== O || t[28] !== k
    ? ((M = (0, W.jsxs)(A, {
        size: `sm`,
        variant: `outline`,
        disabled: O,
        onClick: k,
        children: [j, `Run Now`],
      })),
      (t[27] = O),
      (t[28] = k),
      (t[29] = M))
    : (M = t[29]);
  let N;
  t[30] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((N = (0, W.jsxs)(b, {
        children: [
          (0, W.jsx)(p, { value: `history`, children: `Run History` }),
          (0, W.jsx)(p, { value: `settings`, children: `Settings` }),
        ],
      })),
      (t[30] = N))
    : (N = t[30]);
  let P = n.actionsEnabled === !0,
    F;
  t[31] !== i || t[32] !== r || t[33] !== d || t[34] !== P
    ? ((F = (0, W.jsx)(y, {
        value: `history`,
        children: (0, W.jsx)(Z, {
          runs: d,
          actionsEnabled: P,
          repoOwner: r,
          repoName: i,
        }),
      })),
      (t[31] = i),
      (t[32] = r),
      (t[33] = d),
      (t[34] = P),
      (t[35] = F))
    : (F = t[35]);
  let I;
  t[36] === n
    ? (I = t[37])
    : ((I = (0, W.jsx)(y, {
        value: `settings`,
        children: (0, W.jsx)($, { automation: n }),
      })),
      (t[36] = n),
      (t[37] = I));
  let L;
  t[38] !== F || t[39] !== I
    ? ((L = (0, W.jsxs)(m, {
        defaultValue: `history`,
        className: `space-y-4`,
        children: [N, F, I],
      })),
      (t[38] = F),
      (t[39] = I),
      (t[40] = L))
    : (L = t[40]);
  let z;
  return (
    t[41] !== D || t[42] !== M || t[43] !== L
      ? ((z = (0, W.jsx)(B, { title: D, headerRight: M, children: L })),
        (t[41] = D),
        (t[42] = M),
        (t[43] = L),
        (t[44] = z))
      : (z = t[44]),
    z
  );
}
function X(e) {
  return e.status === `queued` || e.status === `running`;
}
function Z(e) {
  let t = (0, H.c)(15),
    { runs: n, actionsEnabled: r, repoOwner: i, repoName: s } = e,
    c = a(o.automations.acknowledgeRun);
  if (n === void 0) {
    let e;
    return (
      t[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, W.jsx)(`div`, {
            className: `flex items-center justify-center py-12`,
            children: (0, W.jsx)(g, { size: `lg` }),
          })),
          (t[0] = e))
        : (e = t[0]),
      e
    );
  }
  if (n.length === 0) {
    let e;
    return (
      t[1] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, W.jsx)(`div`, {
            className: `rounded-lg bg-muted/40 p-8 text-center`,
            children: (0, W.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `No runs yet. Enable the automation and wait for the cron schedule to trigger, or click "Run Now".`,
            }),
          })),
          (t[1] = e))
        : (e = t[1]),
      e
    );
  }
  let l;
  if (t[2] !== c || t[3] !== r || t[4] !== s || t[5] !== i || t[6] !== n) {
    let e;
    (t[8] !== c || t[9] !== r || t[10] !== s || t[11] !== i
      ? ((e = (e) =>
          (0, W.jsx)(
            Q,
            {
              run: e,
              actionsEnabled: r,
              repoOwner: i,
              repoName: s,
              onAcknowledge: () => c({ runId: e._id }),
            },
            e._id,
          )),
        (t[8] = c),
        (t[9] = r),
        (t[10] = s),
        (t[11] = i),
        (t[12] = e))
      : (e = t[12]),
      (l = n.map(e)),
      (t[2] = c),
      (t[3] = r),
      (t[4] = s),
      (t[5] = i),
      (t[6] = n),
      (t[7] = l));
  } else l = t[7];
  let u;
  return (
    t[13] === l
      ? (u = t[14])
      : ((u = (0, W.jsx)(`div`, { className: `space-y-2`, children: l })),
        (t[13] = l),
        (t[14] = u)),
    u
  );
}
function Q(e) {
  let t = (0, H.c)(65),
    {
      run: n,
      actionsEnabled: r,
      repoOwner: i,
      repoName: s,
      onAcknowledge: u,
    } = e,
    f = n.status === `running` || n.status === `queued`,
    [p, m] = (0, U.useState)(f),
    h = a(o.automations.cancelRun),
    g = `automation-run-${n._id}`,
    _;
  t[0] !== f || t[1] !== g
    ? ((_ = f ? { entityId: g } : `skip`), (t[0] = f), (t[1] = g), (t[2] = _))
    : (_ = t[2]);
  let y = c(o.streaming.get, _),
    b = D(n.startedAt, f),
    x =
      n.status === `success`
        ? `success`
        : n.status === `error`
          ? `destructive`
          : n.status === `running`
            ? `warning`
            : `secondary`,
    S;
  t[3] !== b || t[4] !== f || t[5] !== n.finishedAt || t[6] !== n.startedAt
    ? ((S =
        n.finishedAt && n.startedAt
          ? te(n.startedAt, n.finishedAt)
          : f && n.startedAt
            ? w(b)
            : ``),
      (t[3] = b),
      (t[4] = f),
      (t[5] = n.finishedAt),
      (t[6] = n.startedAt),
      (t[7] = S))
    : (S = t[7]);
  let T = S,
    E;
  t[8] === y
    ? (E = t[9])
    : ((E = y?.currentActivity ? ee(y.currentActivity) : null),
      (t[8] = y),
      (t[9] = E));
  let O = E,
    j;
  t[10] === n.activityLog
    ? (j = t[11])
    : ((j = n.activityLog ? ee(n.activityLog) : null),
      (t[10] = n.activityLog),
      (t[11] = j));
  let P = j,
    F;
  t[12] !== p || t[13] !== f || t[14] !== u || t[15] !== n.acknowledged
    ? ((F = () => {
        let e = !p;
        (m(e), e && !n.acknowledged && !f && u());
      }),
      (t[12] = p),
      (t[13] = f),
      (t[14] = u),
      (t[15] = n.acknowledged),
      (t[16] = F))
    : (F = t[16]);
  let R;
  t[17] === p
    ? (R = t[18])
    : ((R = p
        ? (0, W.jsx)(M, {
            size: 14,
            className: `shrink-0 text-muted-foreground`,
          })
        : (0, W.jsx)(d, {
            size: 14,
            className: `shrink-0 text-muted-foreground`,
          })),
      (t[17] = p),
      (t[18] = R));
  let B;
  t[19] !== x || t[20] !== n.status
    ? ((B = (0, W.jsx)(C, { variant: x, children: n.status })),
      (t[19] = x),
      (t[20] = n.status),
      (t[21] = B))
    : (B = t[21]);
  let V;
  t[22] === n.startedAt
    ? (V = t[23])
    : ((V = z(n.startedAt).format(`DD/MM/YYYY HH:mm`)),
      (t[22] = n.startedAt),
      (t[23] = V));
  let G;
  t[24] === V
    ? (G = t[25])
    : ((G = (0, W.jsx)(`span`, {
        className: `text-sm text-muted-foreground`,
        children: V,
      })),
      (t[24] = V),
      (t[25] = G));
  let K;
  t[26] !== n.error || t[27] !== n.resultSummary
    ? ((K = n.resultSummary
        ? n.resultSummary.slice(0, 80)
        : n.error
          ? n.error.slice(0, 80)
          : ``),
      (t[26] = n.error),
      (t[27] = n.resultSummary),
      (t[28] = K))
    : (K = t[28]);
  let q;
  t[29] === K
    ? (q = t[30])
    : ((q = (0, W.jsx)(`span`, {
        className: `flex-1 truncate text-sm font-medium`,
        children: K,
      })),
      (t[29] = K),
      (t[30] = q));
  let J;
  t[31] === T
    ? (J = t[32])
    : ((J =
        T &&
        (0, W.jsx)(`span`, {
          className: `shrink-0 text-xs text-muted-foreground`,
          children: T,
        })),
      (t[31] = T),
      (t[32] = J));
  let Y;
  t[33] !== h || t[34] !== f || t[35] !== n._id
    ? ((Y =
        f &&
        (0, W.jsxs)(A, {
          size: `sm`,
          variant: `destructive`,
          className: `shrink-0 h-7 text-xs`,
          onClick: (e) => {
            (e.stopPropagation(), h({ runId: n._id }));
          },
          children: [(0, W.jsx)(N, { size: 12 }), `Stop`],
        })),
      (t[33] = h),
      (t[34] = f),
      (t[35] = n._id),
      (t[36] = Y))
    : (Y = t[36]);
  let X;
  t[37] !== u || t[38] !== n.acknowledged || t[39] !== n.status
    ? ((X =
        !n.acknowledged &&
        n.status !== `queued` &&
        n.status !== `running` &&
        (0, W.jsxs)(A, {
          size: `sm`,
          variant: `outline`,
          className: `shrink-0 h-7 text-xs`,
          onClick: (e) => {
            (e.stopPropagation(), u());
          },
          children: [(0, W.jsx)(v, { size: 12 }), `Read`],
        })),
      (t[37] = u),
      (t[38] = n.acknowledged),
      (t[39] = n.status),
      (t[40] = X))
    : (X = t[40]);
  let Z;
  t[41] === n.acknowledged
    ? (Z = t[42])
    : ((Z =
        n.acknowledged &&
        (0, W.jsx)(`span`, {
          className: `shrink-0 text-xs text-emerald-600`,
          children: `Read`,
        })),
      (t[41] = n.acknowledged),
      (t[42] = Z));
  let Q;
  t[43] !== q ||
  t[44] !== J ||
  t[45] !== Y ||
  t[46] !== X ||
  t[47] !== Z ||
  t[48] !== F ||
  t[49] !== R ||
  t[50] !== B ||
  t[51] !== G
    ? ((Q = (0, W.jsxs)(`button`, {
        type: `button`,
        onClick: F,
        className: `flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-muted/30 transition-colors`,
        children: [R, B, G, q, J, Y, X, Z],
      })),
      (t[43] = q),
      (t[44] = J),
      (t[45] = Y),
      (t[46] = X),
      (t[47] = Z),
      (t[48] = F),
      (t[49] = R),
      (t[50] = B),
      (t[51] = G),
      (t[52] = Q))
    : (Q = t[52]);
  let $;
  t[53] !== r ||
  t[54] !== P ||
  t[55] !== p ||
  t[56] !== f ||
  t[57] !== O ||
  t[58] !== s ||
  t[59] !== i ||
  t[60] !== n
    ? (($ =
        p &&
        (0, W.jsxs)(`div`, {
          className: `px-4 py-3 space-y-3`,
          children: [
            f && O && (0, W.jsx)(k, { steps: O, isStreaming: !0 }),
            !f && P && (0, W.jsx)(k, { steps: P }),
            r && n.findings && n.findings.length > 0
              ? (0, W.jsx)(ne, { run: n, repoOwner: i, repoName: s })
              : (0, W.jsxs)(W.Fragment, {
                  children: [
                    r &&
                      n.resultSummary &&
                      !n.findings &&
                      n.status === `success` &&
                      (0, W.jsxs)(`div`, {
                        className: `flex items-center gap-2 rounded-lg bg-yellow-500/10 px-3 py-2`,
                        children: [
                          (0, W.jsx)(I, {
                            size: 14,
                            className: `shrink-0 text-yellow-600`,
                          }),
                          (0, W.jsx)(`p`, {
                            className: `text-xs text-yellow-700 dark:text-yellow-400`,
                            children: `Could not parse findings from report`,
                          }),
                        ],
                      }),
                    n.resultSummary &&
                      (0, W.jsx)(`div`, {
                        children: (0, W.jsx)(l, {
                          className: `text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0`,
                          plugins: re,
                          children: n.resultSummary,
                        }),
                      }),
                  ],
                }),
            n.error &&
              (0, W.jsxs)(`div`, {
                children: [
                  (0, W.jsx)(`p`, {
                    className: `text-xs font-medium text-red-500 mb-1`,
                    children: `Error`,
                  }),
                  (0, W.jsx)(`p`, {
                    className: `text-sm text-red-600 whitespace-pre-wrap`,
                    children: n.error,
                  }),
                ],
              }),
            n.prUrl &&
              (0, W.jsx)(`div`, {
                children: (0, W.jsxs)(`a`, {
                  href: n.prUrl,
                  target: `_blank`,
                  rel: `noopener noreferrer`,
                  className: `inline-flex items-center gap-1.5 text-sm text-primary hover:underline`,
                  children: [(0, W.jsx)(L, { size: 14 }), `View Pull Request`],
                }),
              }),
            !f &&
              !n.resultSummary &&
              !n.error &&
              !P &&
              (0, W.jsx)(`p`, {
                className: `text-sm text-muted-foreground`,
                children: `No details available.`,
              }),
          ],
        })),
      (t[53] = r),
      (t[54] = P),
      (t[55] = p),
      (t[56] = f),
      (t[57] = O),
      (t[58] = s),
      (t[59] = i),
      (t[60] = n),
      (t[61] = $))
    : ($ = t[61]);
  let ie;
  return (
    t[62] !== Q || t[63] !== $
      ? ((ie = (0, W.jsxs)(`div`, {
          className: `rounded-lg bg-muted/40 overflow-hidden`,
          children: [Q, $],
        })),
        (t[62] = Q),
        (t[63] = $),
        (t[64] = ie))
      : (ie = t[64]),
    ie
  );
}
function $({ automation: e }) {
  let t = a(o.automations.update),
    [n, r] = (0, U.useState)(e.title),
    [i, c] = (0, U.useState)(e.description),
    [l, d] = (0, U.useState)(e.cronSchedule),
    [p, m] = (0, U.useState)(e.model ?? `sonnet`),
    [v, y] = (0, U.useState)(e.readOnly === !0),
    [b, S] = (0, U.useState)(e.actionsEnabled === !0),
    [C, w] = (0, U.useState)(!1),
    D =
      n !== e.title ||
      i !== e.description ||
      l !== e.cronSchedule ||
      p !== (e.model ?? `sonnet`) ||
      v !== (e.readOnly === !0) ||
      b !== (e.actionsEnabled === !0);
  return (0, W.jsxs)(`div`, {
    className: `space-y-4`,
    children: [
      (0, W.jsx)(V, { value: l, onChange: d }),
      (0, W.jsxs)(`div`, {
        className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
        children: [
          (0, W.jsx)(`h3`, {
            className: `text-sm font-medium`,
            children: `Description`,
          }),
          (0, W.jsxs)(`div`, {
            children: [
              (0, W.jsx)(`label`, {
                className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
                children: `Title`,
              }),
              (0, W.jsx)(O, {
                className: `h-8 text-xs`,
                placeholder: `Automation title`,
                value: n,
                onChange: (e) => r(e.target.value),
              }),
            ],
          }),
          (0, W.jsxs)(`div`, {
            children: [
              (0, W.jsx)(`label`, {
                className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
                children: `Prompt`,
              }),
              (0, W.jsx)(T, {
                className: `min-h-[120px] text-xs`,
                placeholder: `Describe what this automation should do...`,
                value: i,
                onChange: (e) => c(e.target.value),
              }),
              (0, W.jsx)(`p`, {
                className: `mt-1 text-[11px] text-muted-foreground`,
                children: `The prompt that will be executed on each run.`,
              }),
            ],
          }),
        ],
      }),
      (0, W.jsx)(`div`, {
        className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
        children: (0, W.jsxs)(`div`, {
          className: `flex items-center justify-between`,
          children: [
            (0, W.jsxs)(`div`, {
              children: [
                (0, W.jsx)(`h3`, {
                  className: `text-sm font-medium`,
                  children: `Report Only`,
                }),
                (0, W.jsx)(`p`, {
                  className: `text-[11px] text-muted-foreground mt-0.5`,
                  children: `Analyze and report without making code changes, branches, or PRs`,
                }),
              ],
            }),
            (0, W.jsx)(`button`, {
              type: `button`,
              onClick: () => y(!v),
              className: f(
                `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
                v ? `bg-emerald-500` : `bg-muted-foreground/30`,
              ),
              children: (0, W.jsx)(`span`, {
                className: f(
                  `pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform`,
                  v ? `translate-x-5` : `translate-x-0`,
                ),
              }),
            }),
          ],
        }),
      }),
      v &&
        (0, W.jsx)(`div`, {
          className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
          children: (0, W.jsxs)(`div`, {
            className: `flex items-center justify-between`,
            children: [
              (0, W.jsxs)(`div`, {
                children: [
                  (0, W.jsx)(`h3`, {
                    className: `text-sm font-medium`,
                    children: `Actions`,
                  }),
                  (0, W.jsx)(`p`, {
                    className: `text-[11px] text-muted-foreground mt-0.5`,
                    children: `Parse findings into actionable items you can convert to tasks`,
                  }),
                ],
              }),
              (0, W.jsx)(`button`, {
                type: `button`,
                onClick: () => S(!b),
                className: f(
                  `relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`,
                  b ? `bg-emerald-500` : `bg-muted-foreground/30`,
                ),
                children: (0, W.jsx)(`span`, {
                  className: f(
                    `pointer-events-none block h-5 w-5 rounded-full bg-white transition-transform`,
                    b ? `translate-x-5` : `translate-x-0`,
                  ),
                }),
              }),
            ],
          }),
        }),
      (0, W.jsxs)(`div`, {
        className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
        children: [
          (0, W.jsx)(`h3`, {
            className: `text-sm font-medium`,
            children: `Model`,
          }),
          (0, W.jsxs)(`div`, {
            children: [
              (0, W.jsx)(`label`, {
                className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
                children: `Claude Model`,
              }),
              (0, W.jsxs)(E, {
                value: p,
                onValueChange: (e) => {
                  let t = s.find((t) => t === e);
                  t && m(t);
                },
                children: [
                  (0, W.jsx)(_, {
                    className: `h-8 text-xs`,
                    children: (0, W.jsx)(u, {}),
                  }),
                  (0, W.jsx)(h, {
                    children: s.map((e) =>
                      (0, W.jsx)(
                        x,
                        {
                          value: e,
                          children: e.charAt(0).toUpperCase() + e.slice(1),
                        },
                        e,
                      ),
                    ),
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      (0, W.jsx)(`div`, {
        className: `flex justify-end`,
        children: (0, W.jsxs)(A, {
          onClick: async () => {
            w(!0);
            try {
              await t({
                id: e._id,
                title: n,
                description: i,
                cronSchedule: l,
                model: p,
                readOnly: v,
                actionsEnabled: v ? b : !1,
              });
            } finally {
              w(!1);
            }
          },
          disabled: C || !D,
          children: [C && (0, W.jsx)(g, { size: `sm` }), `Save`],
        }),
      }),
    ],
  });
}
function ie() {
  let e = (0, H.c)(8),
    { id: t, owner: n, repo: r } = i.useParams(),
    a = t,
    s;
  e[0] === a ? (s = e[1]) : ((s = { id: a }), (e[0] = a), (e[1] = s));
  let l = c(o.automations.get, s);
  if (l === void 0) {
    let t;
    return (
      e[2] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, W.jsx)(`div`, {
            className: `h-full flex items-center justify-center`,
            children: (0, W.jsx)(g, { size: `lg` }),
          })),
          (e[2] = t))
        : (t = e[2]),
      t
    );
  }
  if (l === null) {
    let t;
    return (
      e[3] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, W.jsx)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground`,
            children: (0, W.jsx)(`p`, { children: `Automation not found` }),
          })),
          (e[3] = t))
        : (t = e[3]),
      t
    );
  }
  let u;
  return (
    e[4] !== l || e[5] !== n || e[6] !== r
      ? ((u = (0, W.jsx)(Y, { automation: l, repoOwner: n, repoName: r })),
        (e[4] = l),
        (e[5] = n),
        (e[6] = r),
        (e[7] = u))
      : (u = e[7]),
    u
  );
}
export { ie as component };
