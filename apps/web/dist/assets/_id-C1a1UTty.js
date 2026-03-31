import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, s as i } from "./index-CuMF3NGg.js";
import { c as a, n as o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import {
  C as c,
  Gt as l,
  H as u,
  Ht as d,
  K as f,
  Kt as p,
  S as m,
  Tr as h,
  U as g,
  V as _,
  W as v,
  Wt as y,
  _ as b,
  b as x,
  f as S,
  g as C,
  h as w,
  m as T,
  p as E,
  t as D,
  ur as O,
  v as k,
  vr as A,
  x as j,
  y as M,
} from "./src-DHCpG1Q-.js";
import { t as N } from "./IconAlertTriangle-B1Mqbt3_.js";
import { t as P } from "./IconCode-DJtbkNrt.js";
import { t as F } from "./IconGitPullRequest-A3RyN7ym.js";
import { t as I } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as L } from "./IconTool-KJTf_zgT.js";
import { t as R } from "./IconWorld-DR9G-8rM.js";
import { n as z } from "./dates-DHZmrCUU.js";
import { S as B, t as V, y as H } from "./search-params-C2OhCtfp.js";
import { n as U } from "./RepoContext-D9QMbL6d.js";
import { t as W } from "./parseActivitySteps-BClmcBqd.js";
import { t as G } from "./BranchSelect-B_az_4Wj.js";
var K = r(),
  q = e(t(), 1),
  J = n();
function Y() {
  let e = (0, K.c)(8),
    [t] = (0, q.useState)(!1),
    n;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((n = []), (e[0] = n))
    : (n = e[0]);
  let [r] = (0, q.useState)(n),
    i;
  e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, J.jsx)(v, {
        children: (0, J.jsx)(f, {
          placeholder: `Enter URL to test...`,
          className: `h-8 text-xs`,
        }),
      })),
      (e[1] = i))
    : (i = e[1]);
  let a;
  e[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = (0, J.jsx)(u, {
        loading: (0, J.jsxs)(`div`, {
          className: `absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-secondary`,
          children: [
            (0, J.jsx)(R, { size: 48, className: `mb-3 opacity-50` }),
            (0, J.jsx)(`p`, {
              className: `text-sm`,
              children: `Enter a URL and run the test to see Eva interact with your UI`,
            }),
          ],
        }),
      })),
      (e[2] = a))
    : (a = e[2]);
  let o;
  e[3] === t
    ? (o = e[4])
    : ((o =
        t &&
        (0, J.jsxs)(`div`, {
          className: `flex items-center gap-1.5`,
          children: [
            (0, J.jsx)(`span`, {
              className: `w-1.5 h-1.5 rounded-full bg-success animate-pulse`,
            }),
            (0, J.jsx)(`span`, {
              className: `text-xs text-success`,
              children: `Running`,
            }),
          ],
        })),
      (e[3] = t),
      (e[4] = o));
  let s;
  return (
    e[5] !== r || e[6] !== o
      ? ((s = (0, J.jsxs)(_, {
          className: `h-full rounded-none border-0`,
          children: [i, a, (0, J.jsx)(g, { logs: r, children: o })],
        })),
        (e[5] = r),
        (e[6] = o),
        (e[7] = s))
      : (s = e[7]),
    s
  );
}
function X(e) {
  let t = (0, K.c)(25),
    { report: n, streamingActivity: r } = e,
    i,
    a,
    o,
    s,
    l;
  if (
    t[0] !== n.createdAt ||
    t[1] !== n.error ||
    t[2] !== n.fixStatus ||
    t[3] !== n.prUrl ||
    t[4] !== n.results ||
    t[5] !== n.status ||
    t[6] !== n.summary ||
    t[7] !== r
  ) {
    let e = n.results.filter(ee),
      u = n.results.filter($),
      d = n.results.length,
      f =
        d > 0
          ? { passed: e.length, failed: u.length, skipped: 0, total: d }
          : void 0;
    ((i = w),
      (a = f),
      t[13] !== n.status || t[14] !== r
        ? ((o =
            n.status === `running` &&
            (() => {
              let e = W(r);
              return e
                ? (0, J.jsx)(`div`, {
                    className: `px-4 py-3`,
                    children: (0, J.jsx)(D, { steps: e, isStreaming: !0 }),
                  })
                : (0, J.jsxs)(`div`, {
                    className: `flex items-center gap-3 px-4 py-3`,
                    children: [
                      (0, J.jsx)(p, { size: `sm` }),
                      (0, J.jsx)(`span`, {
                        className: `text-sm text-muted-foreground truncate`,
                        children: r || `Evaluating codebase...`,
                      }),
                    ],
                  });
            })()),
          (t[13] = n.status),
          (t[14] = r),
          (t[15] = o))
        : (o = t[15]),
      t[16] !== n.error || t[17] !== n.status
        ? ((s =
            n.status === `error` &&
            n.error &&
            (0, J.jsx)(`div`, {
              className: `p-4`,
              children: (0, J.jsx)(E, {
                children: (0, J.jsx)(T, { children: n.error }),
              }),
            })),
          (t[16] = n.error),
          (t[17] = n.status),
          (t[18] = s))
        : (s = t[18]),
      (l =
        n.status === `completed` &&
        (0, J.jsxs)(J.Fragment, {
          children: [
            (0, J.jsxs)(b, {
              children: [
                (0, J.jsx)(M, {}),
                (0, J.jsxs)(`div`, {
                  className: `flex items-center gap-2`,
                  children: [
                    n.fixStatus === `fixing` &&
                      (0, J.jsxs)(`span`, {
                        className: `flex items-center gap-1.5 text-xs text-muted-foreground`,
                        children: [
                          (0, J.jsx)(p, { size: `sm` }),
                          `Fixing issues...`,
                        ],
                      }),
                    n.fixStatus === `fix_error` &&
                      (0, J.jsxs)(`span`, {
                        className: `flex items-center gap-1.5 text-xs text-destructive`,
                        children: [(0, J.jsx)(N, { size: 14 }), `Fix failed`],
                      }),
                    n.prUrl &&
                      (0, J.jsxs)(`a`, {
                        href: n.prUrl,
                        target: `_blank`,
                        rel: `noopener noreferrer`,
                        className: `inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/5 transition-colors`,
                        children: [(0, J.jsx)(F, { size: 14 }), `View Fix PR`],
                      }),
                    (0, J.jsx)(`span`, {
                      className: `text-sm text-muted-foreground`,
                      children: z(n.createdAt).fromNow(),
                    }),
                  ],
                }),
              ],
            }),
            (0, J.jsxs)(C, {
              children: [
                (0, J.jsx)(k, {}),
                n.fixStatus === `fixing` &&
                  (() => {
                    let e = W(r);
                    return e
                      ? (0, J.jsxs)(`div`, {
                          className: `rounded-md border border-primary/20 bg-primary/5 px-4 py-3`,
                          children: [
                            (0, J.jsxs)(`div`, {
                              className: `flex items-center gap-1.5 mb-2`,
                              children: [
                                (0, J.jsx)(L, {
                                  size: 14,
                                  className: `text-primary shrink-0`,
                                }),
                                (0, J.jsx)(`span`, {
                                  className: `text-xs font-medium text-primary`,
                                  children: `Fixing issues...`,
                                }),
                              ],
                            }),
                            (0, J.jsx)(D, { steps: e, isStreaming: !0 }),
                          ],
                        })
                      : (0, J.jsxs)(`div`, {
                          className: `flex items-center gap-2 rounded-md border border-primary/20 bg-primary/5 px-3 py-2`,
                          children: [
                            (0, J.jsx)(L, {
                              size: 14,
                              className: `text-primary shrink-0`,
                            }),
                            (0, J.jsx)(`span`, {
                              className: `text-sm text-primary`,
                              children:
                                r ||
                                `Eva is fixing the failing requirements and will create a PR automatically...`,
                            }),
                          ],
                        });
                  })(),
                n.summary &&
                  (0, J.jsx)(`p`, {
                    className: `text-sm text-muted-foreground leading-relaxed`,
                    children: n.summary,
                  }),
                u.length > 0 &&
                  (0, J.jsxs)(x, {
                    name: `Failed`,
                    status: `failed`,
                    defaultOpen: !0,
                    children: [
                      (0, J.jsx)(m, {
                        children: (0, J.jsx)(c, { failed: u.length }),
                      }),
                      (0, J.jsx)(j, { children: u.map(Q) }),
                    ],
                  }),
                e.length > 0 &&
                  (0, J.jsxs)(x, {
                    name: `Passed`,
                    status: `passed`,
                    children: [
                      (0, J.jsx)(m, {
                        children: (0, J.jsx)(c, { passed: e.length }),
                      }),
                      (0, J.jsx)(j, { children: e.map(Z) }),
                    ],
                  }),
              ],
            }),
          ],
        })),
      (t[0] = n.createdAt),
      (t[1] = n.error),
      (t[2] = n.fixStatus),
      (t[3] = n.prUrl),
      (t[4] = n.results),
      (t[5] = n.status),
      (t[6] = n.summary),
      (t[7] = r),
      (t[8] = i),
      (t[9] = a),
      (t[10] = o),
      (t[11] = s),
      (t[12] = l));
  } else ((i = t[8]), (a = t[9]), (o = t[10]), (s = t[11]), (l = t[12]));
  let u;
  return (
    t[19] !== i || t[20] !== a || t[21] !== o || t[22] !== s || t[23] !== l
      ? ((u = (0, J.jsxs)(i, { summary: a, children: [o, s, l] })),
        (t[19] = i),
        (t[20] = a),
        (t[21] = o),
        (t[22] = s),
        (t[23] = l),
        (t[24] = u))
      : (u = t[24]),
    u
  );
}
function Z(e, t) {
  return (0, J.jsxs)(
    `div`,
    {
      children: [
        (0, J.jsx)(S, { name: e.requirement, status: `passed` }),
        (0, J.jsx)(`p`, {
          className: `px-4 pb-2 text-xs text-muted-foreground sm:px-6 md:px-10`,
          children: e.detail,
        }),
      ],
    },
    t,
  );
}
function Q(e, t) {
  return (0, J.jsxs)(
    `div`,
    {
      children: [
        (0, J.jsx)(S, { name: e.requirement, status: `failed` }),
        (0, J.jsx)(`p`, {
          className: `px-4 pb-2 text-xs text-muted-foreground sm:px-6 md:px-10`,
          children: e.detail,
        }),
      ],
    },
    t,
  );
}
function $(e) {
  return !e.passed;
}
function ee(e) {
  return e.passed;
}
function te(e) {
  let t = (0, K.c)(28),
    { report: n, isActive: r, onClick: i } = e,
    a;
  t[0] === n.results
    ? (a = t[1])
    : ((a = n.results.filter(re)), (t[0] = n.results), (t[1] = a));
  let o = a.length,
    s;
  t[2] === n.results
    ? (s = t[3])
    : ((s = n.results.filter(ne)), (t[2] = n.results), (t[3] = s));
  let c = s.length,
    l = n.results.length,
    u;
  t[4] !== o || t[5] !== l
    ? ((u = l > 0 ? Math.round((o / l) * 100) : 0),
      (t[4] = o),
      (t[5] = l),
      (t[6] = u))
    : (u = t[6]);
  let d = u,
    f = `w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border transition-colors text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${r ? `border-primary bg-primary/5 ring-1 ring-primary` : `border-transparent hover:bg-muted/50`}`,
    m;
  t[7] !== c ||
  t[8] !== d ||
  t[9] !== o ||
  t[10] !== n.createdAt ||
  t[11] !== n.fixStatus ||
  t[12] !== n.prUrl ||
  t[13] !== n.status ||
  t[14] !== l
    ? ((m =
        n.status === `completed` &&
        (0, J.jsxs)(J.Fragment, {
          children: [
            c === 0
              ? (0, J.jsx)(h, { size: 14, className: `text-success shrink-0` })
              : n.prUrl
                ? (0, J.jsx)(F, {
                    size: 14,
                    className: `text-primary shrink-0`,
                  })
                : (0, J.jsx)(A, {
                    size: 14,
                    className: `text-destructive shrink-0`,
                  }),
            (0, J.jsxs)(`div`, {
              className: `flex flex-col min-w-0`,
              children: [
                (0, J.jsxs)(`span`, {
                  className: `text-sm tabular-nums`,
                  children: [o, `/`, l, ` passed`],
                }),
                (0, J.jsxs)(`span`, {
                  className: `text-xs text-muted-foreground`,
                  children: [
                    d,
                    `% · `,
                    z(n.createdAt).fromNow(),
                    n.fixStatus === `fixing` && ` · Fixing...`,
                    n.prUrl && ` · PR created`,
                  ],
                }),
              ],
            }),
          ],
        })),
      (t[7] = c),
      (t[8] = d),
      (t[9] = o),
      (t[10] = n.createdAt),
      (t[11] = n.fixStatus),
      (t[12] = n.prUrl),
      (t[13] = n.status),
      (t[14] = l),
      (t[15] = m))
    : (m = t[15]);
  let g;
  t[16] !== n.createdAt || t[17] !== n.status
    ? ((g =
        n.status === `error` &&
        (0, J.jsxs)(J.Fragment, {
          children: [
            (0, J.jsx)(N, { size: 14, className: `text-destructive shrink-0` }),
            (0, J.jsxs)(`div`, {
              className: `flex flex-col min-w-0`,
              children: [
                (0, J.jsx)(`span`, {
                  className: `text-sm text-destructive`,
                  children: `Error`,
                }),
                (0, J.jsx)(`span`, {
                  className: `text-xs text-muted-foreground`,
                  children: z(n.createdAt).fromNow(),
                }),
              ],
            }),
          ],
        })),
      (t[16] = n.createdAt),
      (t[17] = n.status),
      (t[18] = g))
    : (g = t[18]);
  let _;
  t[19] !== n.createdAt || t[20] !== n.status
    ? ((_ =
        n.status === `running` &&
        (0, J.jsxs)(J.Fragment, {
          children: [
            (0, J.jsx)(p, { size: `sm` }),
            (0, J.jsxs)(`div`, {
              className: `flex flex-col min-w-0`,
              children: [
                (0, J.jsx)(`span`, {
                  className: `text-sm text-muted-foreground`,
                  children: `Running...`,
                }),
                (0, J.jsx)(`span`, {
                  className: `text-xs text-muted-foreground`,
                  children: z(n.createdAt).fromNow(),
                }),
              ],
            }),
          ],
        })),
      (t[19] = n.createdAt),
      (t[20] = n.status),
      (t[21] = _))
    : (_ = t[21]);
  let v;
  return (
    t[22] !== i || t[23] !== f || t[24] !== m || t[25] !== g || t[26] !== _
      ? ((v = (0, J.jsxs)(`button`, {
          onClick: i,
          className: f,
          children: [m, g, _],
        })),
        (t[22] = i),
        (t[23] = f),
        (t[24] = m),
        (t[25] = g),
        (t[26] = _),
        (t[27] = v))
      : (v = t[27]),
    v
  );
}
function ne(e) {
  return !e.passed;
}
function re(e) {
  return e.passed;
}
function ie(e) {
  let t = (0, K.c)(26),
    { reports: n, streamingActivity: r } = e,
    [i, a] = (0, q.useState)(null),
    o;
  t[0] !== n || t[1] !== i
    ? ((o = i ?? n?.find(ae)?._id ?? n?.[0]?._id ?? null),
      (t[0] = n),
      (t[1] = i),
      (t[2] = o))
    : (o = t[2]);
  let s = o,
    c;
  t[3] !== s || t[4] !== n
    ? ((c = n?.find((e) => e._id === s)), (t[3] = s), (t[4] = n), (t[5] = c))
    : (c = t[5]);
  let l = c;
  if (n === void 0) {
    let e;
    return (
      t[6] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, J.jsx)(`div`, {
            className: `flex items-center justify-center h-32`,
            children: (0, J.jsx)(p, {}),
          })),
          (t[6] = e))
        : (e = t[6]),
      e
    );
  }
  if (n.length === 0) {
    let e;
    return (
      t[7] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, J.jsxs)(`div`, {
            className: `flex flex-col items-center justify-center h-32 text-muted-foreground`,
            children: [
              (0, J.jsx)(`p`, {
                className: `text-sm`,
                children: `No test runs yet`,
              }),
              (0, J.jsx)(`p`, {
                className: `text-xs mt-1`,
                children: `Click "Run Test" to evaluate this doc`,
              }),
            ],
          })),
          (t[7] = e))
        : (e = t[7]),
      e
    );
  }
  let u;
  t[8] === n.length
    ? (u = t[9])
    : ((u = (0, J.jsxs)(`p`, {
        className: `text-xs font-medium text-muted-foreground px-2 py-1`,
        children: [`Test runs (`, n.length, `)`],
      })),
      (t[8] = n.length),
      (t[9] = u));
  let d;
  if (t[10] !== s || t[11] !== n) {
    let e;
    (t[13] === s
      ? (e = t[14])
      : ((e = (e) =>
          (0, J.jsx)(
            te,
            { report: e, isActive: e._id === s, onClick: () => a(e._id) },
            e._id,
          )),
        (t[13] = s),
        (t[14] = e)),
      (d = n.map(e)),
      (t[10] = s),
      (t[11] = n),
      (t[12] = d));
  } else d = t[12];
  let f;
  t[15] !== u || t[16] !== d
    ? ((f = (0, J.jsxs)(`div`, {
        className: `w-full shrink-0 border-b overflow-y-auto scrollbar p-2 space-y-1 max-h-32 sm:max-h-none sm:w-56 sm:border-b-0 sm:border-r`,
        children: [u, d],
      })),
      (t[15] = u),
      (t[16] = d),
      (t[17] = f))
    : (f = t[17]);
  let m;
  t[18] !== l || t[19] !== r
    ? ((m =
        l &&
        (0, J.jsx)(X, {
          report: l,
          streamingActivity:
            l.status === `running` || l.fixStatus === `fixing` ? r : void 0,
        })),
      (t[18] = l),
      (t[19] = r),
      (t[20] = m))
    : (m = t[20]);
  let h;
  t[21] === m
    ? (h = t[22])
    : ((h = (0, J.jsx)(`div`, {
        className: `flex-1 overflow-y-auto scrollbar p-4`,
        children: m,
      })),
      (t[21] = m),
      (t[22] = h));
  let g;
  return (
    t[23] !== f || t[24] !== h
      ? ((g = (0, J.jsxs)(`div`, {
          className: `h-full flex flex-col overflow-hidden sm:flex-row`,
          children: [f, h],
        })),
        (t[23] = f),
        (t[24] = h),
        (t[25] = g))
      : (g = t[25]),
    g
  );
}
function ae(e) {
  return e.status === `running`;
}
function oe() {
  let { id: e } = i.useParams(),
    { repo: t } = U(),
    n = s(o.docs.get, { id: e }),
    r = s(o.evaluationReports.listByDoc, n ? { docId: n._id } : `skip`),
    c = r?.find((e) => e.status === `running` || e.fixStatus === `fixing`),
    u = s(o.streaming.get, c ? { entityId: c._id } : `skip`),
    f = a(o.evaluationWorkflow.startEvaluation),
    [m, h] = (0, q.useState)(!1),
    [g, _] = B(`tab`, H),
    [v, b] = B(`branch`, V);
  return n === void 0
    ? (0, J.jsx)(`div`, {
        className: `h-full flex items-center justify-center`,
        children: (0, J.jsx)(p, { size: `lg` }),
      })
    : n === null
      ? (0, J.jsx)(`div`, {
          className: `h-full flex flex-col items-center justify-center text-muted-foreground`,
          children: (0, J.jsx)(`p`, { children: `Document not found` }),
        })
      : (0, J.jsxs)(`div`, {
          className: `h-full flex flex-col overflow-hidden`,
          children: [
            (0, J.jsx)(`div`, {
              className: `px-2 py-2 flex flex-col gap-1.5 sm:px-4`,
              children: (0, J.jsxs)(`div`, {
                className: `flex flex-wrap items-center justify-between gap-2`,
                children: [
                  (0, J.jsx)(d, {
                    value: g,
                    onValueChange: (e) => {
                      _(e);
                    },
                    children: (0, J.jsxs)(y, {
                      className: `h-8`,
                      children: [
                        (0, J.jsxs)(l, {
                          value: `code`,
                          className: `text-xs space-x-2`,
                          children: [
                            (0, J.jsx)(P, { size: 14 }),
                            (0, J.jsx)(`span`, { children: `Code Testing` }),
                          ],
                        }),
                        (0, J.jsxs)(l, {
                          value: `ui`,
                          className: `text-xs space-x-2`,
                          children: [
                            (0, J.jsx)(R, { size: 14 }),
                            (0, J.jsx)(`span`, { children: `UI Testing` }),
                          ],
                        }),
                      ],
                    }),
                  }),
                  (0, J.jsxs)(`div`, {
                    className: `flex items-center gap-2`,
                    children: [
                      (0, J.jsx)(G, {
                        value: v,
                        onValueChange: b,
                        className: `h-7 text-xs w-24 sm:w-36`,
                      }),
                      (0, J.jsxs)(O, {
                        size: `sm`,
                        onClick:
                          g === `code`
                            ? async () => {
                                if (n) {
                                  h(!0);
                                  try {
                                    await f({
                                      docId: n._id,
                                      repoId: t._id,
                                      branchName: v === `main` ? void 0 : v,
                                    });
                                  } finally {
                                    h(!1);
                                  }
                                }
                              }
                            : void 0,
                        disabled: g === `code` && m,
                        children: [
                          (0, J.jsx)(I, { size: 16 }),
                          m && g === `code` ? `Running...` : `Run Test`,
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            }),
            (0, J.jsx)(`div`, {
              className: `flex-1 min-h-0 overflow-hidden`,
              children:
                g === `code`
                  ? (0, J.jsx)(ie, {
                      reports: r,
                      streamingActivity: u?.currentActivity,
                    })
                  : (0, J.jsx)(Y, {}),
            }),
          ],
        });
}
export { oe as component };
