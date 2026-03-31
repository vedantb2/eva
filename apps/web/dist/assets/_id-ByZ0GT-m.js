import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { r } from "./route-D5lx65YK.js";
import { T as i } from "./index-CuMF3NGg.js";
import { c as a, n as o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import {
  At as c,
  Ct as l,
  Dt as u,
  Et as d,
  Ft as f,
  It as p,
  Kt as m,
  Lt as h,
  Mt as g,
  Nt as _,
  Ot as v,
  Pt as y,
  St as b,
  Tr as x,
  Tt as S,
  Z as C,
  _t as w,
  a as T,
  at as E,
  c as D,
  ct as O,
  d as k,
  dt as ee,
  ft as A,
  gt as j,
  ht as M,
  i as N,
  jt as P,
  kt as F,
  l as I,
  lt as te,
  mt as ne,
  o as L,
  pt as R,
  s as z,
  t as B,
  u as V,
  ur as H,
  ut as re,
  vr as ie,
  wt as ae,
} from "./src-DHCpG1Q-.js";
import { t as U } from "./createReactComponent-C2GWxX5y.js";
import { t as W } from "./IconBookmark-BPZPIP3-.js";
import { n as G, t as K } from "./IconLayoutSidebarRightExpand-aEe3Th2z.js";
import { t as q } from "./IconTrash-bHTcNORt.js";
import { t as J } from "./AnimatePresence-qXAN7gDu.js";
import { n as oe } from "./RepoContext-D9QMbL6d.js";
import {
  a as se,
  c as ce,
  i as le,
  n as ue,
  o as de,
  r as fe,
  s as pe,
} from "./StreamingActivityDisplay-CD4bZNYp.js";
import { t as Y } from "./parseActivitySteps-BClmcBqd.js";
var me = U(`filled`, `bookmark-filled`, `BookmarkFilled`, [
    [
      `path`,
      {
        d: `M14 2a5 5 0 0 1 5 5v14a1 1 0 0 1 -1.555 .832l-5.445 -3.63l-5.444 3.63a1 1 0 0 1 -1.55 -.72l-.006 -.112v-14a5 5 0 0 1 5 -5h4z`,
        key: `svg-0`,
      },
    ],
  ]),
  X = e(t(), 1),
  Z = i(),
  Q = n();
function $(e) {
  let t = (0, Z.c)(26),
    {
      message: n,
      previousUserContent: r,
      streamingActivity: i,
      isSaved: a,
      onCancel: o,
      onConfirm: s,
      onSaveQuery: l,
    } = e,
    f;
  t[0] === n.role
    ? (f = t[1])
    : ((f =
        n.role === `assistant` &&
        (0, Q.jsxs)(`div`, {
          className: `flex items-center gap-2`,
          children: [
            (0, Q.jsx)(fe, { size: 32 }),
            (0, Q.jsx)(`span`, {
              className: `text-xs font-medium text-muted-foreground`,
              children: `Eva`,
            }),
          ],
        })),
      (t[0] = n.role),
      (t[1] = f));
  let p =
      n.role === `user`
        ? `rounded-xl bg-secondary text-foreground px-4 py-3`
        : `px-1 py-2`,
    m;
  t[2] !== a ||
  t[3] !== n._id ||
  t[4] !== n.activityLog ||
  t[5] !== n.content ||
  t[6] !== n.queryCode ||
  t[7] !== n.role ||
  t[8] !== n.status ||
  t[9] !== o ||
  t[10] !== s ||
  t[11] !== l ||
  t[12] !== r ||
  t[13] !== i
    ? ((m =
        n.role === `assistant` && !n.content
          ? (0, Q.jsx)(ue, { activity: i, thinkingLabel: `Analysing...` })
          : n.role === `assistant` && n.status === `pending`
            ? (0, Q.jsxs)(Q.Fragment, {
                children: [
                  (0, Q.jsxs)(d, {
                    state: `pending`,
                    children: [
                      (0, Q.jsx)(P, {
                        children: (0, Q.jsx)(`p`, {
                          className: `text-xs font-medium text-muted-foreground`,
                          children: `Generated query:`,
                        }),
                      }),
                      (0, Q.jsx)(c, {
                        children: (0, Q.jsxs)(V, {
                          code: n.content,
                          language: `typescript`,
                          children: [
                            (0, Q.jsx)(k, {}),
                            (0, Q.jsx)(`pre`, {
                              className: `overflow-x-auto p-3 text-xs`,
                              children: (0, Q.jsx)(`code`, {
                                children: n.content,
                              }),
                            }),
                          ],
                        }),
                      }),
                      (0, Q.jsxs)(v, {
                        children: [
                          (0, Q.jsxs)(u, {
                            variant: `outline`,
                            onClick: () => o(n._id),
                            children: [(0, Q.jsx)(ie, { size: 14 }), `Cancel`],
                          }),
                          (0, Q.jsxs)(u, {
                            onClick: () => s(n._id, n.content, r),
                            children: [
                              (0, Q.jsx)(x, { size: 14 }),
                              `Run query`,
                            ],
                          }),
                        ],
                      }),
                    ],
                  }),
                  n.activityLog &&
                    (() => {
                      let e = Y(n.activityLog);
                      return e
                        ? (0, Q.jsxs)(`details`, {
                            className: `mt-2 group`,
                            children: [
                              (0, Q.jsx)(`summary`, {
                                className: `text-xs text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors`,
                                children: `Generation logs`,
                              }),
                              (0, Q.jsx)(`div`, {
                                className: `mt-2`,
                                children: (0, Q.jsx)(B, { steps: e }),
                              }),
                            ],
                          })
                        : null;
                    })(),
                ],
              })
            : n.role === `assistant` && n.status === `cancelled`
              ? (0, Q.jsx)(d, {
                  state: `rejected`,
                  children: (0, Q.jsx)(F, {
                    children: (0, Q.jsx)(`p`, {
                      className: `text-sm text-muted-foreground italic`,
                      children: `Query cancelled`,
                    }),
                  }),
                })
              : n.role === `assistant`
                ? n.queryCode
                  ? (0, Q.jsx)(N, {
                      state: `completed`,
                      children: (0, Q.jsx)(T, {
                        children: (0, Q.jsxs)(z, {
                          defaultValue: `output`,
                          children: [
                            (0, Q.jsxs)(D, {
                              children: [
                                (0, Q.jsx)(I, {
                                  value: `output`,
                                  children: `Output`,
                                }),
                                (0, Q.jsx)(I, {
                                  value: `code`,
                                  children: `Code`,
                                }),
                                n.activityLog &&
                                  (0, Q.jsx)(I, {
                                    value: `logs`,
                                    children: `Logs`,
                                  }),
                              ],
                            }),
                            (0, Q.jsx)(L, {
                              value: `output`,
                              children: (0, Q.jsx)(w, {
                                className: `prose prose-sm dark:prose-invert max-w-none`,
                                children: n.content,
                              }),
                            }),
                            (0, Q.jsxs)(L, {
                              value: `code`,
                              children: [
                                (0, Q.jsxs)(V, {
                                  code: n.queryCode,
                                  language: `typescript`,
                                  children: [
                                    (0, Q.jsx)(k, {}),
                                    (0, Q.jsx)(`pre`, {
                                      className: `overflow-x-auto p-3 text-xs`,
                                      children: (0, Q.jsx)(`code`, {
                                        children: n.queryCode,
                                      }),
                                    }),
                                  ],
                                }),
                                (0, Q.jsx)(`div`, {
                                  className: `mt-2`,
                                  children: a
                                    ? (0, Q.jsxs)(`div`, {
                                        className: `flex items-center gap-1.5 text-xs text-muted-foreground`,
                                        children: [
                                          (0, Q.jsx)(me, { size: 14 }),
                                          (0, Q.jsx)(`span`, {
                                            children: `Saved`,
                                          }),
                                        ],
                                      })
                                    : (0, Q.jsxs)(H, {
                                        size: `sm`,
                                        variant: `outline`,
                                        onClick: () => l(n.queryCode ?? ``, r),
                                        children: [
                                          (0, Q.jsx)(W, { size: 14 }),
                                          `Save query`,
                                        ],
                                      }),
                                }),
                              ],
                            }),
                            n.activityLog &&
                              (0, Q.jsx)(L, {
                                value: `logs`,
                                children: (0, Q.jsx)(`div`, {
                                  className: `p-3`,
                                  children: (0, Q.jsx)(B, {
                                    steps: Y(n.activityLog) ?? [],
                                  }),
                                }),
                              }),
                          ],
                        }),
                      }),
                    })
                  : (0, Q.jsx)(w, {
                      className: `prose prose-sm dark:prose-invert max-w-none`,
                      children: n.content,
                    })
                : (0, Q.jsx)(`p`, {
                    className: `text-sm whitespace-pre-wrap break-words`,
                    children: n.content,
                  })),
      (t[2] = a),
      (t[3] = n._id),
      (t[4] = n.activityLog),
      (t[5] = n.content),
      (t[6] = n.queryCode),
      (t[7] = n.role),
      (t[8] = n.status),
      (t[9] = o),
      (t[10] = s),
      (t[11] = l),
      (t[12] = r),
      (t[13] = i),
      (t[14] = m))
    : (m = t[14]);
  let h;
  t[15] !== p || t[16] !== m
    ? ((h = (0, Q.jsx)(j, { className: p, children: m })),
      (t[15] = p),
      (t[16] = m),
      (t[17] = h))
    : (h = t[17]);
  let g;
  t[18] !== n.role || t[19] !== n.userId
    ? ((g =
        n.role === `user` &&
        (0, Q.jsx)(`div`, {
          className: `mt-0.5 ml-auto`,
          children: (0, Q.jsx)(le, { userId: n.userId, className: `h-8 w-8` }),
        })),
      (t[18] = n.role),
      (t[19] = n.userId),
      (t[20] = g))
    : (g = t[20]);
  let _;
  return (
    t[21] !== n.role || t[22] !== f || t[23] !== h || t[24] !== g
      ? ((_ = (0, Q.jsxs)(M, { from: n.role, children: [f, h, g] })),
        (t[21] = n.role),
        (t[22] = f),
        (t[23] = h),
        (t[24] = g),
        (t[25] = _))
      : (_ = t[25]),
    _
  );
}
function he({ queryId: e, title: t, repoId: n }) {
  let r = s(o.messages.listByParent, { parentId: e }),
    i = s(o.streaming.get, { entityId: e }),
    c = s(o.savedQueries.list, { repoId: n }),
    u = a(o.savedQueries.create),
    [d, f] = (0, X.useState)(!1),
    p = (0, X.useMemo)(() => se(e, `sonnet`), [e]),
    m = (0, X.useMemo)(() => de(e, `default`), [e]),
    [h, g] = (0, X.useState)(p),
    [_, v] = (0, X.useState)(m),
    y = pe(e),
    x = ce(e),
    w = (0, X.useCallback)(
      (e) => {
        (g(e), y(e));
      },
      [y],
    ),
    T = (0, X.useCallback)(
      (e) => {
        (v(e), x(e));
      },
      [x],
    ),
    D = a(o.researchQueries.updateMessageStatus),
    k = a(o.researchQueryWorkflow.startGenerate),
    j = a(o.researchQueryWorkflow.startConfirm),
    M = r ?? [],
    N = async (t) => {
      if (!(!t.trim() || d)) {
        f(!0);
        try {
          await k({ queryId: e, question: t.trim(), repoId: n, model: h });
        } finally {
          f(!1);
        }
      }
    },
    P = (t, r, i) => {
      j({ queryId: e, queryCode: r, messageId: t, question: i, repoId: n });
    },
    F = (t) => {
      D({ id: e, messageId: t, status: `cancelled` });
    },
    I = (e) => c?.some((t) => t.query === e) ?? !1,
    L = (t, r) => {
      u({ repoId: n, title: r, query: t, researchQueryId: e });
    },
    z = async ({ text: e }) => {
      await N(e);
    },
    B = (e, n) => (n > 0 ? e[n - 1] : void 0)?.content ?? t;
  return (0, Q.jsxs)(`div`, {
    className: `flex-1 flex flex-col h-full overflow-hidden`,
    children: [
      (0, Q.jsx)(`div`, {
        className: `p-4`,
        children: (0, Q.jsx)(`h1`, {
          className: `text-lg font-semibold text-foreground`,
          children: t,
        }),
      }),
      (0, Q.jsxs)(b, {
        className: `flex-1`,
        children: [
          (0, Q.jsx)(l, {
            className: `gap-4 p-6 justify-end`,
            children:
              M.length === 0
                ? (0, Q.jsx)(ae, {
                    title: `No messages yet. Start the conversation!`,
                  })
                : M.map((e, t) =>
                    (0, Q.jsx)(
                      C.div,
                      {
                        initial: { opacity: 0, y: 10 },
                        animate: { opacity: 1, y: 0 },
                        transition: {
                          duration: 0.18,
                          ease: [0.22, 1, 0.36, 1],
                        },
                        children: (0, Q.jsx)($, {
                          message: e,
                          previousUserContent: B(M, t),
                          streamingActivity: i?.currentActivity,
                          isSaved: e.queryCode ? I(e.queryCode) : !1,
                          onCancel: F,
                          onConfirm: P,
                          onSaveQuery: L,
                        }),
                      },
                      e._id,
                    ),
                  ),
          }),
          (0, Q.jsx)(S, {}),
        ],
      }),
      (0, Q.jsx)(`div`, {
        className: `px-5 pb-4`,
        children: (0, Q.jsxs)(re, {
          onSubmit: z,
          children: [
            (0, Q.jsx)(R, {
              placeholder: `Ask Eva to perform an analysis...`,
              disabled: d,
            }),
            (0, Q.jsxs)(ee, {
              children: [
                (0, Q.jsxs)(ne, {
                  children: [
                    (0, Q.jsx)(O, { value: h, onValueChange: w, disabled: d }),
                    (0, Q.jsx)(te, { value: _, onValueChange: T, disabled: d }),
                  ],
                }),
                (0, Q.jsxs)(`div`, {
                  className: `flex items-center gap-1`,
                  children: [
                    (0, Q.jsx)(E, { disabled: d }),
                    (0, Q.jsx)(A, {
                      status: d ? `submitted` : void 0,
                      disabled: d,
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function ge(e) {
  let t = (0, Z.c)(24),
    { repoId: n } = e,
    r;
  t[0] === n ? (r = t[1]) : ((r = { repoId: n }), (t[0] = n), (t[1] = r));
  let i = s(o.savedQueries.list, r),
    c = a(o.savedQueries.remove),
    [l, u] = (0, X.useState)(!1),
    d;
  t[2] === c
    ? (d = t[3])
    : ((d = async (e) => {
        await c({ id: e });
      }),
      (t[2] = c),
      (t[3] = d));
  let m = d,
    v = `flex h-full flex-col overflow-hidden pl-6 transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${l ? `w-12` : `w-[33%]`}`,
    b = `flex items-center p-2 ${l ? `justify-center` : ``}`,
    x;
  t[4] === l
    ? (x = t[5])
    : ((x = (0, Q.jsx)(H, {
        size: `icon`,
        variant: `ghost`,
        className: `motion-press text-primary hover:scale-[1.03] active:scale-[0.97]`,
        onClick: () => u(!l),
        children: l ? (0, Q.jsx)(K, { size: 16 }) : (0, Q.jsx)(G, { size: 16 }),
      })),
      (t[4] = l),
      (t[5] = x));
  let S;
  t[6] === l
    ? (S = t[7])
    : ((S =
        !l &&
        (0, Q.jsx)(C.p, {
          className: `text-sm font-semibold text-primary`,
          initial: { opacity: 0, x: 8 },
          animate: { opacity: 1, x: 0 },
          exit: { opacity: 0, x: 8 },
          transition: { duration: 0.18 },
          children: `Saved Queries`,
        })),
      (t[6] = l),
      (t[7] = S));
  let w;
  t[8] === S
    ? (w = t[9])
    : ((w = (0, Q.jsx)(J, { initial: !1, children: S })),
      (t[8] = S),
      (t[9] = w));
  let T;
  t[10] !== b || t[11] !== x || t[12] !== w
    ? ((T = (0, Q.jsxs)(`div`, { className: b, children: [x, w] })),
      (t[10] = b),
      (t[11] = x),
      (t[12] = w),
      (t[13] = T))
    : (T = t[13]);
  let E;
  t[14] !== m || t[15] !== l || t[16] !== i
    ? ((E =
        !l &&
        (0, Q.jsx)(
          C.div,
          {
            className: `flex-1 overflow-y-auto p-3 space-y-2`,
            initial: { opacity: 0, x: 10 },
            animate: { opacity: 1, x: 0 },
            exit: { opacity: 0, x: 10 },
            transition: { duration: 0.2 },
            children:
              !i || i.length === 0
                ? (0, Q.jsxs)(`div`, {
                    className: `flex flex-col items-center justify-center h-full gap-2`,
                    children: [
                      (0, Q.jsx)(W, {
                        size: 20,
                        className: `text-muted-foreground`,
                      }),
                      (0, Q.jsx)(`p`, {
                        className: `text-xs text-muted-foreground`,
                        children: `No saved queries yet`,
                      }),
                    ],
                  })
                : (0, Q.jsx)(J, {
                    initial: !1,
                    children: i.map((e) =>
                      (0, Q.jsx)(
                        C.div,
                        {
                          initial: { opacity: 0, y: 8 },
                          animate: { opacity: 1, y: 0 },
                          exit: { opacity: 0, y: 8 },
                          transition: { duration: 0.18 },
                          children: (0, Q.jsxs)(g, {
                            children: [
                              (0, Q.jsxs)(p, {
                                className: `px-3 py-2`,
                                children: [
                                  (0, Q.jsx)(h, {
                                    className: `line-clamp-2 text-xs`,
                                    children: e.title,
                                  }),
                                  (0, Q.jsx)(y, {
                                    children: (0, Q.jsx)(_, {
                                      tooltip: `Delete`,
                                      className: `size-6 text-muted-foreground hover:text-destructive`,
                                      onClick: () => m(e._id),
                                      children: (0, Q.jsx)(q, { size: 12 }),
                                    }),
                                  }),
                                ],
                              }),
                              (0, Q.jsx)(f, {
                                className: `p-2`,
                                children: (0, Q.jsx)(V, {
                                  code: e.query,
                                  language: `typescript`,
                                  className: `max-h-20 overflow-hidden`,
                                }),
                              }),
                            ],
                          }),
                        },
                        e._id,
                      ),
                    ),
                  }),
          },
          `saved-queries-panel-content`,
        )),
      (t[14] = m),
      (t[15] = l),
      (t[16] = i),
      (t[17] = E))
    : (E = t[17]);
  let D;
  t[18] === E
    ? (D = t[19])
    : ((D = (0, Q.jsx)(J, { initial: !1, children: E })),
      (t[18] = E),
      (t[19] = D));
  let O;
  return (
    t[20] !== D || t[21] !== v || t[22] !== T
      ? ((O = (0, Q.jsxs)(`div`, { className: v, children: [T, D] })),
        (t[20] = D),
        (t[21] = v),
        (t[22] = T),
        (t[23] = O))
      : (O = t[23]),
    O
  );
}
var _e = r(`/_repo/$owner/$repo/analyse/query/$id`);
function ve() {
  let e = (0, Z.c)(13),
    { id: t } = _e.useParams(),
    { repo: n } = oe(),
    r;
  e[0] === t ? (r = e[1]) : ((r = { id: t }), (e[0] = t), (e[1] = r));
  let i = s(o.researchQueries.get, r);
  if (i === void 0) {
    let t;
    return (
      e[2] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, Q.jsx)(`div`, {
            className: `flex items-center justify-center h-full`,
            children: (0, Q.jsx)(m, { size: `lg` }),
          })),
          (e[2] = t))
        : (t = e[2]),
      t
    );
  }
  if (i === null) {
    let t;
    return (
      e[3] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, Q.jsx)(`div`, {
            className: `flex items-center justify-center h-full`,
            children: (0, Q.jsx)(`p`, {
              className: `text-muted-foreground`,
              children: `This query does not exist or has been deleted.`,
            }),
          })),
          (e[3] = t))
        : (t = e[3]),
      t
    );
  }
  let a;
  e[4] !== t || e[5] !== n._id || e[6] !== i.title
    ? ((a = (0, Q.jsx)(he, { queryId: t, title: i.title, repoId: n._id })),
      (e[4] = t),
      (e[5] = n._id),
      (e[6] = i.title),
      (e[7] = a))
    : (a = e[7]);
  let c;
  e[8] === n._id
    ? (c = e[9])
    : ((c = (0, Q.jsx)(ge, { repoId: n._id })), (e[8] = n._id), (e[9] = c));
  let l;
  return (
    e[10] !== a || e[11] !== c
      ? ((l = (0, Q.jsxs)(`div`, {
          className: `flex h-full`,
          children: [a, c],
        })),
        (e[10] = a),
        (e[11] = c),
        (e[12] = l))
      : (l = e[12]),
    l
  );
}
var ye = ve;
export { ye as component };
