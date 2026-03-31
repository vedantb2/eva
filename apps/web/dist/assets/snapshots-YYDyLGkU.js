import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { c as i, n as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
import {
  Cr as s,
  Gt as c,
  Ht as l,
  Kt as u,
  Tr as d,
  Ut as f,
  Wt as p,
  ur as m,
  vr as h,
  wr as g,
} from "./src-DHCpG1Q-.js";
import { t as _ } from "./IconCamera-DSHdkxs3.js";
import { t as v } from "./IconClock-BRHjI4rV.js";
import { t as y } from "./IconExternalLink-DInhr4-B.js";
import { t as b } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as x } from "./IconTrash-bHTcNORt.js";
import { t as S } from "./PageWrapper-CdtdiTMb.js";
import { n as C } from "./RepoContext-D9QMbL6d.js";
import { n as w } from "./formatDuration-Bscl8bMO.js";
import { n as T, t as E } from "./CronScheduleCard-CVMoB272.js";
import { t as D } from "./BranchSelect-B_az_4Wj.js";
var O = r(),
  k = e(t(), 1),
  A = n();
function j() {
  let { repoId: e, owner: t, name: n } = C(),
    r = o(a.repoSnapshots.getRepoSnapshot, { repoId: e }),
    s = o(a.repoSnapshots.listBuilds, r ? { repoSnapshotId: r._id } : `skip`),
    d = i(a.repoSnapshots.saveRepoSnapshot),
    h = i(a.repoSnapshots.deleteRepoSnapshot),
    g = i(a.repoSnapshots.startBuild),
    [v, y] = (0, k.useState)(`manual`),
    [O, j] = (0, k.useState)(`main`),
    [N, I] = (0, k.useState)(!1),
    [L, R] = (0, k.useState)(!1),
    [z, B] = (0, k.useState)(null);
  (0, k.useEffect)(() => {
    if (r !== void 0) {
      if (r) {
        (y(r.schedule), j(r.workflowRef ?? `main`));
        return;
      }
      (y(`manual`), j(`main`));
    }
  }, [r?._id, r?.updatedAt, r === null]);
  let V = async () => {
      I(!0);
      try {
        await d({ repoId: e, schedule: v, workflowRef: O.trim() || void 0 });
      } finally {
        I(!1);
      }
    },
    H = async () => {
      r && (await h({ repoSnapshotId: r._id }), y(`manual`), j(`main`));
    },
    U = async () => {
      if (r) {
        R(!0);
        try {
          await g({ repoSnapshotId: r._id });
        } catch {
        } finally {
          R(!1);
        }
      }
    },
    W = s && s.length > 0 && s[0].status === `running`,
    G = s && s.length > 0 ? s[0] : null;
  return r === void 0
    ? (0, A.jsx)(S, {
        title: `Snapshots`,
        children: (0, A.jsx)(`div`, {
          className: `flex items-center justify-center py-12`,
          children: (0, A.jsx)(u, { size: `lg` }),
        }),
      })
    : (0, A.jsx)(S, {
        title: `Snapshots`,
        children: (0, A.jsxs)(l, {
          defaultValue: `configuration`,
          className: `space-y-4`,
          children: [
            (0, A.jsxs)(p, {
              children: [
                (0, A.jsx)(c, {
                  value: `configuration`,
                  children: `Configuration`,
                }),
                (0, A.jsx)(c, { value: `status`, children: `Status` }),
                (0, A.jsx)(c, { value: `builds`, children: `Builds` }),
              ],
            }),
            (0, A.jsxs)(f, {
              value: `configuration`,
              className: `space-y-4`,
              children: [
                r &&
                  (0, A.jsx)(`div`, {
                    className: `flex justify-end`,
                    children: (0, A.jsxs)(m, {
                      size: `sm`,
                      variant: `destructive`,
                      onClick: H,
                      children: [
                        (0, A.jsx)(x, { size: 14, className: `mr-1.5` }),
                        `Delete Config`,
                      ],
                    }),
                  }),
                (0, A.jsx)(E, { value: v, onChange: y, allowManual: !0 }),
                (0, A.jsxs)(`div`, {
                  className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
                  children: [
                    (0, A.jsx)(`h3`, {
                      className: `text-sm font-medium`,
                      children: `Workflow Branch`,
                    }),
                    (0, A.jsxs)(`div`, {
                      children: [
                        (0, A.jsx)(`label`, {
                          className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
                          children: `Branch`,
                        }),
                        (0, A.jsx)(D, {
                          value: O,
                          onValueChange: j,
                          className: `h-8 text-xs`,
                          placeholder: `Select a branch`,
                        }),
                        (0, A.jsxs)(`p`, {
                          className: `mt-1 text-[11px] text-muted-foreground`,
                          children: [
                            `Branch where `,
                            (0, A.jsx)(`code`, {
                              children: `rebuild-snapshot.yml`,
                            }),
                            ` exists. Defaults to `,
                            (0, A.jsx)(`code`, { children: `main` }),
                            ` if empty.`,
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                (0, A.jsxs)(`div`, {
                  className: `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`,
                  children: [
                    (0, A.jsxs)(`p`, {
                      className: `text-[11px] text-muted-foreground`,
                      children: [
                        `Requires `,
                        (0, A.jsx)(`code`, {
                          className: `font-mono`,
                          children: `rebuild-snapshot.yml`,
                        }),
                        ` `,
                        `workflow on target branch and`,
                        ` `,
                        (0, A.jsx)(`code`, {
                          className: `font-mono`,
                          children: `DAYTONA_API_KEY`,
                        }),
                        ` secret in the repo.`,
                      ],
                    }),
                    (0, A.jsxs)(m, {
                      size: `sm`,
                      onClick: V,
                      disabled: N,
                      className: `shrink-0`,
                      children: [
                        N
                          ? (0, A.jsx)(u, { size: `sm`, className: `mr-1.5` })
                          : null,
                        `Save`,
                      ],
                    }),
                  ],
                }),
              ],
            }),
            (0, A.jsx)(f, {
              value: `status`,
              className: `space-y-6`,
              children: r
                ? (0, A.jsxs)(`div`, {
                    className: `rounded-lg bg-muted/40 p-4 space-y-3`,
                    children: [
                      (0, A.jsx)(`h3`, {
                        className: `text-sm font-medium`,
                        children: `Current Status`,
                      }),
                      (0, A.jsxs)(`div`, {
                        className: `grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 sm:gap-4`,
                        children: [
                          (0, A.jsxs)(`div`, {
                            children: [
                              (0, A.jsx)(`span`, {
                                className: `text-muted-foreground`,
                                children: `Snapshot Name`,
                              }),
                              (0, A.jsx)(`p`, {
                                className: `font-mono mt-0.5`,
                                children: r.snapshotName,
                              }),
                            ],
                          }),
                          (0, A.jsxs)(`div`, {
                            children: [
                              (0, A.jsx)(`span`, {
                                className: `text-muted-foreground`,
                                children: `Schedule`,
                              }),
                              (0, A.jsx)(`p`, {
                                className: `mt-0.5`,
                                children:
                                  r.schedule === `manual`
                                    ? `Manual`
                                    : (() => {
                                        let e = T(r.schedule);
                                        return e.valid ? e.text : r.schedule;
                                      })(),
                              }),
                            ],
                          }),
                          (0, A.jsxs)(`div`, {
                            children: [
                              (0, A.jsx)(`span`, {
                                className: `text-muted-foreground`,
                                children: `Workflow Branch`,
                              }),
                              (0, A.jsx)(`p`, {
                                className: `font-mono mt-0.5`,
                                children: r.workflowRef ?? `main`,
                              }),
                            ],
                          }),
                          G &&
                            (0, A.jsxs)(A.Fragment, {
                              children: [
                                (0, A.jsxs)(`div`, {
                                  children: [
                                    (0, A.jsx)(`span`, {
                                      className: `text-muted-foreground`,
                                      children: `Last Build`,
                                    }),
                                    (0, A.jsx)(`p`, {
                                      className: `mt-0.5`,
                                      children: new Date(
                                        G.startedAt,
                                      ).toLocaleDateString(`en-GB`, {
                                        day: `numeric`,
                                        month: `short`,
                                        year: `numeric`,
                                        hour: `2-digit`,
                                        minute: `2-digit`,
                                      }),
                                    }),
                                  ],
                                }),
                                (0, A.jsxs)(`div`, {
                                  children: [
                                    (0, A.jsx)(`span`, {
                                      className: `text-muted-foreground`,
                                      children: `Status`,
                                    }),
                                    (0, A.jsx)(`p`, {
                                      className: `mt-0.5`,
                                      children: (0, A.jsx)(P, {
                                        status: G.status,
                                      }),
                                    }),
                                  ],
                                }),
                                (0, A.jsxs)(`div`, {
                                  children: [
                                    (0, A.jsx)(`span`, {
                                      className: `text-muted-foreground`,
                                      children: `Warmup`,
                                    }),
                                    (0, A.jsx)(`p`, {
                                      className: `mt-0.5`,
                                      children: (0, A.jsx)(F, {
                                        status: G.warmupStatus,
                                      }),
                                    }),
                                  ],
                                }),
                              ],
                            }),
                        ],
                      }),
                      (0, A.jsxs)(m, {
                        size: `sm`,
                        onClick: U,
                        disabled: L || W,
                        children: [
                          W
                            ? (0, A.jsx)(u, { size: `sm`, className: `mr-1.5` })
                            : (0, A.jsx)(b, { size: 14, className: `mr-1.5` }),
                          W ? `Building...` : `Rebuild Now`,
                        ],
                      }),
                    ],
                  })
                : (0, A.jsx)(`div`, {
                    className: `rounded-lg bg-muted/40 p-8 text-center`,
                    children: (0, A.jsx)(`p`, {
                      className: `text-sm text-muted-foreground`,
                      children: `No snapshot configured yet. Configure one in the Configuration tab.`,
                    }),
                  }),
            }),
            (0, A.jsx)(f, {
              value: `builds`,
              className: `space-y-6`,
              children:
                r && s && s.length > 0
                  ? (0, A.jsxs)(`div`, {
                      className: `rounded-lg bg-muted/40 overflow-hidden`,
                      children: [
                        (0, A.jsx)(`div`, {
                          className: `px-4 py-3`,
                          children: (0, A.jsx)(`h3`, {
                            className: `text-sm font-medium`,
                            children: `Build History`,
                          }),
                        }),
                        (0, A.jsx)(`div`, {
                          className: `overflow-x-auto`,
                          children: (0, A.jsxs)(`table`, {
                            className: `w-full text-xs min-w-[320px] sm:min-w-[420px]`,
                            children: [
                              (0, A.jsx)(`thead`, {
                                children: (0, A.jsxs)(`tr`, {
                                  className: `text-left text-muted-foreground`,
                                  children: [
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium w-8 sm:px-4`,
                                    }),
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium sm:px-4`,
                                      children: `Date`,
                                    }),
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium sm:px-4`,
                                      children: `Duration`,
                                    }),
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium sm:px-4`,
                                      children: `Trigger`,
                                    }),
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium sm:px-4`,
                                      children: `Status`,
                                    }),
                                    (0, A.jsx)(`th`, {
                                      className: `px-2 py-2 font-medium sm:px-4`,
                                      children: `Warmup`,
                                    }),
                                  ],
                                }),
                              }),
                              (0, A.jsx)(`tbody`, {
                                children: s.map((e) => {
                                  let r = z === e._id;
                                  return (0, A.jsx)(
                                    M,
                                    {
                                      build: e,
                                      isExpanded: r,
                                      duration: e.completedAt
                                        ? w(e.completedAt - e.startedAt)
                                        : e.status === `running`
                                          ? `Running...`
                                          : `-`,
                                      repoFullName: `${t}/${n}`,
                                      onToggle: () => B(r ? null : e._id),
                                    },
                                    e._id,
                                  );
                                }),
                              }),
                            ],
                          }),
                        }),
                      ],
                    })
                  : r && s && s.length === 0
                    ? (0, A.jsxs)(`div`, {
                        className: `flex flex-col items-center justify-center py-12 text-muted-foreground`,
                        children: [
                          (0, A.jsx)(_, {
                            size: 48,
                            className: `mb-3 opacity-40`,
                          }),
                          (0, A.jsx)(`p`, {
                            className: `text-sm`,
                            children: `No builds yet. Click "Rebuild Now" to start.`,
                          }),
                        ],
                      })
                    : (0, A.jsx)(`div`, {
                        className: `rounded-lg bg-muted/40 p-8 text-center`,
                        children: (0, A.jsx)(`p`, {
                          className: `text-sm text-muted-foreground`,
                          children: `No snapshot configured yet. Configure one in the Configuration tab.`,
                        }),
                      }),
            }),
          ],
        }),
      });
}
function M(e) {
  let t = (0, O.c)(31),
    { build: n, isExpanded: r, duration: i, repoFullName: a, onToggle: o } = e,
    c = n.workflowRunId
      ? `https://github.com/${a}/actions/runs/${n.workflowRunId}`
      : null,
    l;
  t[0] === r
    ? (l = t[1])
    : ((l = (0, A.jsx)(`td`, {
        className: `px-2 py-2 sm:px-4`,
        children: r ? (0, A.jsx)(g, { size: 14 }) : (0, A.jsx)(s, { size: 14 }),
      })),
      (t[0] = r),
      (t[1] = l));
  let u;
  t[2] === n.startedAt
    ? (u = t[3])
    : ((u = new Date(n.startedAt).toLocaleDateString(`en-GB`, {
        day: `numeric`,
        month: `short`,
        hour: `2-digit`,
        minute: `2-digit`,
      })),
      (t[2] = n.startedAt),
      (t[3] = u));
  let d;
  t[4] === u
    ? (d = t[5])
    : ((d = (0, A.jsx)(`td`, { className: `px-2 py-2 sm:px-4`, children: u })),
      (t[4] = u),
      (t[5] = d));
  let f;
  t[6] === i
    ? (f = t[7])
    : ((f = (0, A.jsx)(`td`, { className: `px-2 py-2 sm:px-4`, children: i })),
      (t[6] = i),
      (t[7] = f));
  let p;
  t[8] === n.triggeredBy
    ? (p = t[9])
    : ((p = (0, A.jsx)(`td`, {
        className: `px-2 py-2 capitalize sm:px-4`,
        children: n.triggeredBy,
      })),
      (t[8] = n.triggeredBy),
      (t[9] = p));
  let m;
  t[10] === n.status
    ? (m = t[11])
    : ((m = (0, A.jsx)(`td`, {
        className: `px-2 py-2 sm:px-4`,
        children: (0, A.jsx)(P, { status: n.status }),
      })),
      (t[10] = n.status),
      (t[11] = m));
  let h;
  t[12] === n.warmupStatus
    ? (h = t[13])
    : ((h = (0, A.jsx)(`td`, {
        className: `px-2 py-2 sm:px-4`,
        children: (0, A.jsx)(F, { status: n.warmupStatus }),
      })),
      (t[12] = n.warmupStatus),
      (t[13] = h));
  let _;
  t[14] !== o ||
  t[15] !== l ||
  t[16] !== d ||
  t[17] !== f ||
  t[18] !== p ||
  t[19] !== m ||
  t[20] !== h
    ? ((_ = (0, A.jsxs)(`tr`, {
        className: `cursor-pointer hover:bg-muted/30`,
        onClick: o,
        children: [l, d, f, p, m, h],
      })),
      (t[14] = o),
      (t[15] = l),
      (t[16] = d),
      (t[17] = f),
      (t[18] = p),
      (t[19] = m),
      (t[20] = h),
      (t[21] = _))
    : (_ = t[21]);
  let v;
  t[22] !== n.error ||
  t[23] !== n.logs ||
  t[24] !== n.warmupError ||
  t[25] !== r ||
  t[26] !== c
    ? ((v =
        r &&
        (0, A.jsx)(`tr`, {
          children: (0, A.jsxs)(`td`, {
            colSpan: 6,
            className: `px-4 py-3`,
            children: [
              n.error &&
                (0, A.jsx)(`div`, {
                  className: `mb-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive`,
                  children: n.error,
                }),
              n.warmupError &&
                (0, A.jsxs)(`div`, {
                  className: `mb-2 rounded bg-destructive/10 px-3 py-2 text-xs text-destructive`,
                  children: [`Warmup failed: `, n.warmupError],
                }),
              c &&
                (0, A.jsxs)(`a`, {
                  href: c,
                  target: `_blank`,
                  rel: `noopener noreferrer`,
                  className: `mb-2 inline-flex items-center gap-1 text-xs text-blue-500 hover:underline`,
                  onClick: N,
                  children: [
                    (0, A.jsx)(y, { size: 12 }),
                    `View GitHub Actions Run`,
                  ],
                }),
              n.logs
                ? (0, A.jsx)(`pre`, {
                    className: `max-h-64 overflow-auto rounded bg-muted/50 p-2 font-mono text-[10px] leading-relaxed whitespace-pre-wrap sm:p-3 sm:text-[11px]`,
                    children: n.logs,
                  })
                : (0, A.jsx)(`p`, {
                    className: `text-xs text-muted-foreground`,
                    children: `No logs available.`,
                  }),
            ],
          }),
        })),
      (t[22] = n.error),
      (t[23] = n.logs),
      (t[24] = n.warmupError),
      (t[25] = r),
      (t[26] = c),
      (t[27] = v))
    : (v = t[27]);
  let b;
  return (
    t[28] !== _ || t[29] !== v
      ? ((b = (0, A.jsxs)(A.Fragment, { children: [_, v] })),
        (t[28] = _),
        (t[29] = v),
        (t[30] = b))
      : (b = t[30]),
    b
  );
}
function N(e) {
  return e.stopPropagation();
}
function P(e) {
  let t = (0, O.c)(3),
    { status: n } = e;
  if (n === `running`) {
    let e;
    return (
      t[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`span`, {
            className: `inline-flex items-center gap-1 text-blue-500`,
            children: [(0, A.jsx)(v, { size: 12 }), `Running`],
          })),
          (t[0] = e))
        : (e = t[0]),
      e
    );
  }
  if (n === `success`) {
    let e;
    return (
      t[1] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`span`, {
            className: `inline-flex items-center gap-1 text-green-500`,
            children: [(0, A.jsx)(d, { size: 12 }), `Success`],
          })),
          (t[1] = e))
        : (e = t[1]),
      e
    );
  }
  let r;
  return (
    t[2] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((r = (0, A.jsxs)(`span`, {
          className: `inline-flex items-center gap-1 text-destructive`,
          children: [(0, A.jsx)(h, { size: 12 }), `Error`],
        })),
        (t[2] = r))
      : (r = t[2]),
    r
  );
}
function F(e) {
  let t = (0, O.c)(4),
    { status: n } = e;
  if (!n) {
    let e;
    return (
      t[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsx)(`span`, {
            className: `text-muted-foreground`,
            children: `—`,
          })),
          (t[0] = e))
        : (e = t[0]),
      e
    );
  }
  if (n === `pending`) {
    let e;
    return (
      t[1] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`span`, {
            className: `inline-flex items-center gap-1 text-blue-500`,
            children: [(0, A.jsx)(v, { size: 12 }), `Pending`],
          })),
          (t[1] = e))
        : (e = t[1]),
      e
    );
  }
  if (n === `success`) {
    let e;
    return (
      t[2] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`span`, {
            className: `inline-flex items-center gap-1 text-green-500`,
            children: [(0, A.jsx)(d, { size: 12 }), `Warmed`],
          })),
          (t[2] = e))
        : (e = t[2]),
      e
    );
  }
  let r;
  return (
    t[3] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((r = (0, A.jsxs)(`span`, {
          className: `inline-flex items-center gap-1 text-destructive`,
          children: [(0, A.jsx)(h, { size: 12 }), `Failed`],
        })),
        (t[3] = r))
      : (r = t[3]),
    r
  );
}
var I = j;
export { I as component };
