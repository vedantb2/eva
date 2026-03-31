import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, r as i } from "./index-CuMF3NGg.js";
import { c as a, n as o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import {
  Bn as c,
  Gn as l,
  Gt as u,
  Hn as d,
  Ht as f,
  Kt as p,
  Rn as m,
  Rt as h,
  Sr as g,
  Un as _,
  Ut as v,
  Vn as y,
  Vt as b,
  Wn as x,
  Wt as ee,
  dn as S,
  mn as C,
  on as te,
  ot as w,
  pn as T,
  sn as E,
  st as D,
  t as O,
  ur as k,
  vr as A,
  xn as j,
  xr as ne,
  zt as M,
} from "./src-DHCpG1Q-.js";
import { t as N } from "./createReactComponent-C2GWxX5y.js";
import { t as P } from "./IconArrowRight-ooQFWrrR.js";
import { t as F } from "./IconDots-BEl8aRmt.js";
import { t as I } from "./IconExternalLink-DInhr4-B.js";
import { t as L } from "./IconGripVertical-DJUodMXs.js";
import { t as R } from "./IconInfoCircle-DJ0cNBVW.js";
import { t as z } from "./IconPlus-ZLqtR4Mv.js";
import { t as re } from "./IconTestPipe-DTTvfavR.js";
import { t as B } from "./IconTrash-bHTcNORt.js";
import { n as V } from "./dates-DHZmrCUU.js";
import { t as H } from "./parseActivitySteps-BClmcBqd.js";
import { n as U, t as W } from "./ChatMessage-DBIt3tG-.js";
var G = N(`outline`, `history`, `History`, [
    [`path`, { d: `M12 8l0 4l2 2`, key: `svg-0` }],
    [`path`, { d: `M3.05 11a9 9 0 1 1 .5 4m-.5 5v-5h5`, key: `svg-1` }],
  ]),
  K = N(`outline`, `message-chatbot`, `MessageChatbot`, [
    [
      `path`,
      {
        d: `M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M9.5 9h.01`, key: `svg-1` }],
    [`path`, { d: `M14.5 9h.01`, key: `svg-2` }],
    [`path`, { d: `M9.5 13a3.5 3.5 0 0 0 5 0`, key: `svg-3` }],
  ]),
  q = r(),
  J = e(t(), 1),
  Y = n();
function X({ doc: e, open: t, onOpenChange: n, readOnly: r }) {
  let i = a(o.docs.addInterviewMessage),
    c = a(o.docs.clearInterview),
    u = a(o.docInterviewWorkflow.startInterview),
    f = a(o.docInterviewWorkflow.startGenerate),
    h = (0, J.useRef)(null),
    [v, b] = (0, J.useState)(!1),
    [ee, S] = (0, J.useState)(!1),
    [C, T] = (0, J.useState)(``),
    E = (0, J.useRef)(!1),
    A = !!w(),
    { isListening: j, toggle: M } = D(T),
    N = s(o.streaming.get, t && !r ? { entityId: e._id } : `skip`),
    F = e.interviewHistory ?? [],
    I = (0, J.useMemo)(() => {
      let e = [];
      for (let t = 0; t < F.length - 1; t++) {
        let n = F[t],
          r = F[t + 1];
        if (n.role === `assistant` && r?.role === `user`)
          try {
            let t = JSON.parse(n.content);
            t.question && e.push({ question: t.question, answer: r.content });
          } catch {
            continue;
          }
      }
      return e;
    }, [F]);
  ((0, J.useEffect)(() => {
    let t = F[F.length - 1];
    if (t?.role === `assistant` && t.content) {
      b(!1);
      try {
        let r = JSON.parse(t.content);
        r.description && r.requirements
          ? n(!1)
          : r.ready === !0 &&
            (b(!0), f({ docId: e._id, docTitle: e.title, previousAnswers: I }));
      } catch {}
    }
  }, [F, n, I, e._id, e.title, f]),
    (0, J.useEffect)(() => {
      h.current?.scrollIntoView({ behavior: `smooth` });
    }, [F]),
    (0, J.useEffect)(() => {
      !t || r || E.current || (F.length === 0 && ((E.current = !0), L([])));
    }, [t]));
  let L = (0, J.useCallback)(
      async (t) => {
        (b(!0),
          await u({ docId: e._id, docTitle: e.title, previousAnswers: t }));
      },
      [e._id, e.title, u],
    ),
    R = async (t) => {
      let n = [...F].reverse().find((e) => e.role === `assistant`),
        r = ``;
      if (n)
        try {
          r = JSON.parse(n.content).question || ``;
        } catch {}
      (T(``), j && M(``));
      let a = [...I, { question: r, answer: t }];
      (await i({ id: e._id, role: `user`, content: t }), L(a));
    },
    z = () => {
      C.trim() && R(C.trim());
    },
    re = async () => {
      (await c({ id: e._id }), b(!1), (E.current = !1), S(!1));
    },
    V = (e) =>
      typeof e == `object` &&
      !!e &&
      typeof e.label == `string` &&
      typeof e.description == `string`,
    G = (() => {
      if (v || r) return null;
      let e = [...F].reverse().find((e) => e.role === `assistant`);
      if (!e) return null;
      try {
        let t = JSON.parse(e.content);
        if (t.question && Array.isArray(t.options) && t.options.every(V))
          return t;
      } catch {
        return null;
      }
      return null;
    })(),
    K = F.length > 0 && F[F.length - 1]?.role === `user`,
    q = G && !K,
    X = F.filter((e) => e.role === `assistant`).length;
  return (0, Y.jsxs)(Y.Fragment, {
    children: [
      (0, Y.jsx)(m, {
        open: t,
        onOpenChange: n,
        children: (0, Y.jsxs)(y, {
          className: `max-w-[calc(100vw-2rem)] w-full max-h-[95vh] flex flex-col sm:max-w-5xl`,
          children: [
            (0, Y.jsx)(x, {
              children: (0, Y.jsxs)(l, {
                children: [
                  r ? `Interview History` : `Interview`,
                  `: `,
                  e.title,
                ],
              }),
            }),
            (0, Y.jsxs)(`div`, {
              className: `flex-1 overflow-y-auto scrollbar space-y-3 p-2 sm:p-3`,
              children: [
                F.length === 0 &&
                  r &&
                  (0, Y.jsx)(`p`, {
                    className: `text-sm text-muted-foreground text-center py-8`,
                    children: `No interview history yet.`,
                  }),
                F.map((e, t) => {
                  if (e.role === `assistant`) {
                    if (!e.content) {
                      let e = H(N?.currentActivity);
                      return e
                        ? (0, Y.jsx)(
                            O,
                            { steps: e, isStreaming: !0 },
                            `msg-${t}`,
                          )
                        : (0, Y.jsx)(
                            W,
                            {
                              role: `assistant`,
                              content: N?.currentActivity || `Starting...`,
                              isStreaming: !0,
                            },
                            `msg-${t}`,
                          );
                    }
                    try {
                      let n = JSON.parse(e.content);
                      if (n.question)
                        return (0, Y.jsx)(
                          W,
                          {
                            role: `assistant`,
                            content: n.question,
                            logs: e.activityLog,
                          },
                          `msg-${t}`,
                        );
                      if (n.description && n.requirements)
                        return (0, Y.jsx)(
                          W,
                          {
                            role: `assistant`,
                            content: `Generated description, requirements, and user flows.`,
                          },
                          `msg-${t}`,
                        );
                      if (n.error)
                        return (0, Y.jsx)(
                          W,
                          {
                            role: `assistant`,
                            content: `Something went wrong. Please try again.`,
                          },
                          `msg-${t}`,
                        );
                    } catch {}
                    return (0, Y.jsx)(
                      W,
                      {
                        role: `assistant`,
                        content: e.content,
                        logs: e.activityLog,
                      },
                      `msg-${t}`,
                    );
                  }
                  return (0, Y.jsx)(
                    W,
                    { role: `user`, content: e.content, userId: e.userId },
                    `msg-${t}`,
                  );
                }),
                !r &&
                  (v || K) &&
                  !F.some((e) => e.role === `assistant` && !e.content) &&
                  (0, Y.jsxs)(`div`, {
                    className: `flex gap-3 items-center`,
                    children: [
                      (0, Y.jsx)(p, { size: `sm` }),
                      (0, Y.jsx)(`span`, {
                        className: `text-sm text-muted-foreground`,
                        children: `Thinking...`,
                      }),
                    ],
                  }),
                (0, Y.jsx)(`div`, { ref: h }),
              ],
            }),
            !r &&
              (0, Y.jsxs)(`div`, {
                className: `space-y-3 pt-2 border-t border-border`,
                children: [
                  q &&
                    (0, Y.jsxs)(Y.Fragment, {
                      children: [
                        (0, Y.jsx)(U, {
                          question: G.question,
                          options: G.options,
                          onAnswer: R,
                          isLoading: v,
                          questionNumber: X,
                        }),
                        A &&
                          (0, Y.jsxs)(`div`, {
                            className: `space-y-2`,
                            children: [
                              (0, Y.jsxs)(`div`, {
                                className: `flex items-center gap-2`,
                                children: [
                                  (0, Y.jsx)(`div`, {
                                    className: `h-px flex-1 bg-border`,
                                  }),
                                  (0, Y.jsx)(`span`, {
                                    className: `text-xs text-muted-foreground`,
                                    children: `or describe in your own words`,
                                  }),
                                  (0, Y.jsx)(`div`, {
                                    className: `h-px flex-1 bg-border`,
                                  }),
                                ],
                              }),
                              (0, Y.jsxs)(`div`, {
                                className: `flex gap-2`,
                                children: [
                                  (0, Y.jsx)(te, {
                                    value: C,
                                    onChange: (e) => T(e.target.value),
                                    placeholder: j
                                      ? `Listening...`
                                      : `Click the mic or type here...`,
                                    rows: 2,
                                    className: `text-sm bg-card flex-1`,
                                    disabled: v,
                                  }),
                                  (0, Y.jsxs)(`div`, {
                                    className: `flex flex-col gap-1`,
                                    children: [
                                      (0, Y.jsx)(k, {
                                        size: `icon`,
                                        variant: j
                                          ? `destructive`
                                          : `secondary`,
                                        onClick: () => M(C),
                                        disabled: v,
                                        className: `h-9 w-9 sm:h-8 sm:w-8`,
                                        children: j
                                          ? (0, Y.jsx)(ne, { size: 14 })
                                          : (0, Y.jsx)(g, { size: 14 }),
                                      }),
                                      (0, Y.jsx)(k, {
                                        size: `icon`,
                                        variant: `default`,
                                        onClick: z,
                                        disabled: v || !C.trim(),
                                        className: `h-9 w-9 sm:h-8 sm:w-8`,
                                        children: (0, Y.jsx)(P, { size: 14 }),
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                      ],
                    }),
                  (0, Y.jsxs)(`div`, {
                    className: `flex items-center justify-between`,
                    children: [
                      (0, Y.jsxs)(`span`, {
                        className: `text-xs text-muted-foreground`,
                        children: [`Questions: `, X],
                      }),
                      (0, Y.jsxs)(k, {
                        size: `sm`,
                        variant: `destructive`,
                        onClick: () => S(!0),
                        disabled: v || F.length === 0,
                        children: [(0, Y.jsx)(B, { size: 16 }), `Clear`],
                      }),
                    ],
                  }),
                ],
              }),
          ],
        }),
      }),
      (0, Y.jsx)(m, {
        open: ee,
        onOpenChange: S,
        children: (0, Y.jsxs)(y, {
          className: `max-w-sm`,
          children: [
            (0, Y.jsxs)(x, {
              children: [
                (0, Y.jsx)(l, { children: `Clear interview?` }),
                (0, Y.jsx)(d, {
                  children: `This will permanently delete all interview questions and answers. This cannot be undone.`,
                }),
              ],
            }),
            (0, Y.jsxs)(_, {
              children: [
                (0, Y.jsx)(k, {
                  variant: `secondary`,
                  onClick: () => S(!1),
                  children: `Cancel`,
                }),
                (0, Y.jsx)(k, {
                  variant: `destructive`,
                  onClick: re,
                  children: `Clear`,
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
function Z(e) {
  let t = (0, q.c)(16),
    { onConfirm: n, label: r } = e,
    [i, a] = (0, J.useState)(!1),
    o;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = () => a(!0)), (t[0] = o))
    : (o = t[0]);
  let s;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, Y.jsx)(k, {
        size: `icon`,
        variant: `ghost`,
        onClick: o,
        className: `text-muted-foreground hover:text-destructive flex-shrink-0 h-8 w-8`,
        children: (0, Y.jsx)(A, { size: 14 }),
      })),
      (t[1] = s))
    : (s = t[1]);
  let u;
  t[2] === r
    ? (u = t[3])
    : ((u = (0, Y.jsxs)(l, { children: [`Delete `, r, `?`] })),
      (t[2] = r),
      (t[3] = u));
  let f;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, Y.jsx)(d, { children: `This action cannot be undone.` })),
      (t[4] = f))
    : (f = t[4]);
  let p;
  t[5] === u
    ? (p = t[6])
    : ((p = (0, Y.jsxs)(x, { children: [u, f] })), (t[5] = u), (t[6] = p));
  let h;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((h = (0, Y.jsx)(c, {
        asChild: !0,
        children: (0, Y.jsx)(k, {
          variant: `secondary`,
          size: `sm`,
          children: `Cancel`,
        }),
      })),
      (t[7] = h))
    : (h = t[7]);
  let g;
  t[8] === n
    ? (g = t[9])
    : ((g = (0, Y.jsxs)(_, {
        children: [
          h,
          (0, Y.jsx)(k, {
            variant: `destructive`,
            size: `sm`,
            onClick: () => {
              (n(), a(!1));
            },
            children: `Delete`,
          }),
        ],
      })),
      (t[8] = n),
      (t[9] = g));
  let v;
  t[10] !== p || t[11] !== g
    ? ((v = (0, Y.jsxs)(y, {
        hideCloseButton: !0,
        className: `max-w-sm`,
        children: [p, g],
      })),
      (t[10] = p),
      (t[11] = g),
      (t[12] = v))
    : (v = t[12]);
  let b;
  return (
    t[13] !== i || t[14] !== v
      ? ((b = (0, Y.jsxs)(m, { open: i, onOpenChange: a, children: [s, v] })),
        (t[13] = i),
        (t[14] = v),
        (t[15] = b))
      : (b = t[15]),
    b
  );
}
function Q(e) {
  let t = (0, q.c)(2),
    { doc: n } = e,
    r;
  return (
    t[0] === n
      ? (r = t[1])
      : ((r = (0, Y.jsx)(ie, { doc: n }, n._id)), (t[0] = n), (t[1] = r)),
    r
  );
}
function ie({ doc: e }) {
  let t = s(o.streaming.get, { entityId: e._id }),
    n = H(t?.currentActivity),
    [r, i] = (0, J.useState)(!1),
    [g, w] = (0, J.useState)(!1),
    [D, A] = (0, J.useState)(!1),
    [N, P] = (0, J.useState)(!1),
    [B, U] = (0, J.useState)(!1),
    W = a(o.testGenWorkflow.startTestGen),
    q = a(o.testGenWorkflow.cancelTestGen),
    Q = a(o.docs.update).withOptimisticUpdate((e, t) => {
      let n = e.getQuery(o.docs.get, { id: t.id });
      n &&
        e.setQuery(
          o.docs.get,
          { id: t.id },
          { ...n, ...t, updatedAt: Date.now() },
        );
    }),
    ie = () => {
      Q({ id: e._id, requirements: [...(e.requirements ?? []), ``] });
    },
    ae = (t, n) => {
      let r = (e.requirements ?? []).map((e, r) => (r === t ? n : e));
      Q({ id: e._id, requirements: r });
    },
    oe = (t) => {
      let n = (e.requirements ?? []).filter((e, n) => n !== t);
      Q({ id: e._id, requirements: n });
    },
    se = () => {
      Q({
        id: e._id,
        userFlows: [...(e.userFlows ?? []), { name: ``, steps: [``] }],
      });
    },
    ce = (t) => {
      let n = (e.userFlows ?? []).filter((e, n) => n !== t);
      Q({ id: e._id, userFlows: n });
    },
    le = (t, n) => {
      let r = (e.userFlows ?? []).map((e, r) =>
        r === t ? { ...e, name: n } : e,
      );
      Q({ id: e._id, userFlows: r });
    },
    ue = (t) => {
      let n = (e.userFlows ?? []).map((e, n) =>
        n === t ? { ...e, steps: [...e.steps, ``] } : e,
      );
      Q({ id: e._id, userFlows: n });
    },
    de = (t, n) => {
      let r = (e.userFlows ?? []).map((e, r) =>
        r === t ? { ...e, steps: e.steps.filter((e, t) => t !== n) } : e,
      );
      Q({ id: e._id, userFlows: r });
    },
    fe = (t, n, r) => {
      let i = (e.userFlows ?? []).map((e, i) =>
        i === t ? { ...e, steps: e.steps.map((e, t) => (t === n ? r : e)) } : e,
      );
      Q({ id: e._id, userFlows: i });
    },
    pe = async () => {
      if (!(N || e.testGenStatus === `running`)) {
        P(!0);
        try {
          await W({ docId: e._id });
        } finally {
          P(!1);
        }
      }
    },
    me = async () => {
      U(!0);
      try {
        await q({ docId: e._id });
      } finally {
        U(!1);
      }
    },
    $ = e.testGenStatus === `running` || N;
  return (0, Y.jsxs)(`div`, {
    className: `h-full flex flex-col overflow-hidden`,
    children: [
      (0, Y.jsxs)(`div`, {
        className: `flex items-center gap-1.5 px-3 py-2 sm:gap-3 sm:px-4 sm:py-3`,
        children: [
          (0, Y.jsxs)(`div`, {
            className: `flex items-baseline gap-2 min-w-0`,
            children: [
              (0, Y.jsx)(`input`, {
                value: e.title,
                onChange: (t) => Q({ id: e._id, title: t.target.value }),
                className: `text-lg font-semibold bg-transparent border-none outline-none focus:ring-0 p-0 min-w-0 w-auto cursor-text placeholder:text-muted-foreground`,
                placeholder: `Document title`,
                size: Math.max(e.title.length, 12),
              }),
              (0, Y.jsx)(`span`, {
                className: `text-xs text-muted-foreground whitespace-nowrap flex-shrink-0`,
                children: V(e.updatedAt).fromNow(),
              }),
            ],
          }),
          $ &&
            (0, Y.jsxs)(`div`, {
              className: `flex items-center gap-1.5 ml-auto text-sm text-muted-foreground`,
              children: [
                (0, Y.jsx)(p, { size: `sm` }),
                (0, Y.jsx)(`span`, {
                  className: `hidden sm:inline`,
                  children: `Generating...`,
                }),
              ],
            }),
          (0, Y.jsxs)(S, {
            children: [
              (0, Y.jsx)(j, {
                asChild: !0,
                children: (0, Y.jsx)(k, {
                  size: `icon`,
                  variant: `ghost`,
                  className: $ ? `` : `ml-auto`,
                  children: (0, Y.jsx)(F, { size: 16 }),
                }),
              }),
              (0, Y.jsxs)(T, {
                align: `end`,
                children: [
                  (0, Y.jsxs)(C, {
                    onClick: () => i(!0),
                    children: [(0, Y.jsx)(K, { size: 16 }), `Interview Me`],
                  }),
                  e.testGenStatus === `completed` && e.testPrUrl
                    ? (0, Y.jsx)(C, {
                        asChild: !0,
                        children: (0, Y.jsxs)(`a`, {
                          href: e.testPrUrl,
                          target: `_blank`,
                          rel: `noopener noreferrer`,
                          children: [
                            (0, Y.jsx)(I, { size: 16 }),
                            `View Tests PR`,
                          ],
                        }),
                      })
                    : (0, Y.jsxs)(C, {
                        onClick: () => A(!0),
                        disabled: $,
                        children: [
                          (0, Y.jsx)(re, { size: 16 }),
                          `Generate Tests`,
                        ],
                      }),
                  (e.interviewHistory ?? []).length > 0 &&
                    (0, Y.jsxs)(C, {
                      onClick: () => w(!0),
                      children: [(0, Y.jsx)(G, { size: 16 }), `View History`],
                    }),
                ],
              }),
            ],
          }),
        ],
      }),
      (0, Y.jsx)(X, { doc: e, open: r, onOpenChange: i }),
      (0, Y.jsx)(X, { doc: e, open: g, onOpenChange: w, readOnly: !0 }),
      (0, Y.jsx)(m, {
        open: D,
        onOpenChange: A,
        children: (0, Y.jsxs)(y, {
          hideCloseButton: !0,
          className: `max-w-sm`,
          children: [
            (0, Y.jsxs)(x, {
              children: [
                (0, Y.jsx)(l, { children: `Generate Tests?` }),
                (0, Y.jsx)(d, {
                  children: `This will generate tests based on the current requirements and user flows.`,
                }),
              ],
            }),
            (0, Y.jsxs)(_, {
              children: [
                (0, Y.jsx)(c, {
                  asChild: !0,
                  children: (0, Y.jsx)(k, {
                    variant: `secondary`,
                    size: `sm`,
                    children: `Cancel`,
                  }),
                }),
                (0, Y.jsx)(k, {
                  size: `sm`,
                  onClick: () => {
                    (A(!1), pe());
                  },
                  children: `Generate`,
                }),
              ],
            }),
          ],
        }),
      }),
      t &&
        (0, Y.jsx)(`div`, {
          className: `px-4 pb-3`,
          children: (0, Y.jsxs)(`div`, {
            className: `rounded-lg bg-muted/40 p-3 space-y-2`,
            children: [
              (0, Y.jsxs)(`div`, {
                className: `flex items-center gap-2 text-sm font-medium`,
                children: [
                  (0, Y.jsx)(p, { size: `sm` }),
                  (0, Y.jsx)(`span`, {
                    className: `flex-1`,
                    children: $ ? `Generating tests...` : `Processing PRD...`,
                  }),
                  (0, Y.jsxs)(k, {
                    variant: `destructive`,
                    size: `sm`,
                    className: `h-6 px-2 text-xs`,
                    onClick: me,
                    disabled: B,
                    children: [
                      B
                        ? (0, Y.jsx)(p, { size: `sm` })
                        : (0, Y.jsx)(ne, { size: 14 }),
                      `Stop`,
                    ],
                  }),
                ],
              }),
              n
                ? (0, Y.jsx)(O, { steps: n, isStreaming: !0 })
                : (0, Y.jsx)(`p`, {
                    className: `text-xs text-muted-foreground whitespace-pre-wrap`,
                    children: t.currentActivity,
                  }),
            ],
          }),
        }),
      (0, Y.jsxs)(f, {
        defaultValue: `requirements`,
        className: `flex-1 flex flex-col overflow-hidden`,
        children: [
          (0, Y.jsx)(`div`, {
            className: `px-4`,
            children: (0, Y.jsxs)(ee, {
              children: [
                (0, Y.jsx)(u, {
                  value: `requirements`,
                  children: `Requirements`,
                }),
                (0, Y.jsx)(u, { value: `user-flows`, children: `User Flows` }),
              ],
            }),
          }),
          (0, Y.jsxs)(v, {
            value: `requirements`,
            className: `flex-1 overflow-y-auto scrollbar p-3 space-y-4 mt-0 sm:p-6 sm:space-y-6`,
            children: [
              (0, Y.jsxs)(`section`, {
                children: [
                  (0, Y.jsx)(`label`, {
                    className: `text-sm font-medium text-muted-foreground mb-2 block`,
                    children: `Description`,
                  }),
                  (0, Y.jsx)(te, {
                    value: e.description ?? ``,
                    onChange: (t) =>
                      Q({ id: e._id, description: t.target.value }),
                    placeholder: `What does this page or feature do?`,
                    rows: 2,
                    className: `bg-card`,
                  }),
                ],
              }),
              (0, Y.jsxs)(`section`, {
                children: [
                  (0, Y.jsxs)(`div`, {
                    className: `flex items-center justify-between mb-2`,
                    children: [
                      (0, Y.jsxs)(`label`, {
                        className: `text-sm font-medium text-muted-foreground flex items-center gap-1.5`,
                        children: [
                          `Requirements`,
                          (0, Y.jsxs)(h, {
                            children: [
                              (0, Y.jsx)(b, {
                                asChild: !0,
                                children: (0, Y.jsx)(R, {
                                  size: 14,
                                  className: `text-muted-foreground`,
                                }),
                              }),
                              (0, Y.jsx)(M, {
                                children: `Used for code-level testing and evaluation`,
                              }),
                            ],
                          }),
                        ],
                      }),
                      (0, Y.jsxs)(k, {
                        size: `sm`,
                        variant: `secondary`,
                        onClick: ie,
                        children: [(0, Y.jsx)(z, { size: 14 }), `Add`],
                      }),
                    ],
                  }),
                  (e.requirements ?? []).length === 0
                    ? (0, Y.jsx)(`p`, {
                        className: `text-sm text-muted-foreground`,
                        children: `No requirements yet. Add items that should be verified during testing.`,
                      })
                    : (0, Y.jsx)(`div`, {
                        className: `space-y-2`,
                        children: (e.requirements ?? []).map((e, t) =>
                          (0, Y.jsxs)(
                            `div`,
                            {
                              className: `flex items-center gap-2`,
                              children: [
                                (0, Y.jsx)(L, {
                                  size: 14,
                                  className: `text-muted-foreground flex-shrink-0`,
                                }),
                                (0, Y.jsx)(E, {
                                  value: e,
                                  onChange: (e) => ae(t, e.target.value),
                                  placeholder: `e.g. Users can log in with email`,
                                  className: `h-8 text-sm bg-card`,
                                }),
                                (0, Y.jsx)(Z, {
                                  onConfirm: () => oe(t),
                                  label: `requirement`,
                                }),
                              ],
                            },
                            t,
                          ),
                        ),
                      }),
                ],
              }),
            ],
          }),
          (0, Y.jsx)(v, {
            value: `user-flows`,
            className: `flex-1 overflow-y-auto scrollbar p-3 space-y-4 mt-0 sm:p-6 sm:space-y-6`,
            children: (0, Y.jsxs)(`section`, {
              children: [
                (0, Y.jsxs)(`div`, {
                  className: `flex items-center justify-between mb-2`,
                  children: [
                    (0, Y.jsxs)(`label`, {
                      className: `text-sm font-medium text-muted-foreground flex items-center gap-1.5`,
                      children: [
                        `User Flows`,
                        (0, Y.jsxs)(h, {
                          children: [
                            (0, Y.jsx)(b, {
                              asChild: !0,
                              children: (0, Y.jsx)(R, {
                                size: 14,
                                className: `text-muted-foreground`,
                              }),
                            }),
                            (0, Y.jsx)(M, {
                              children: `Used for UI testing in the testing arena`,
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, Y.jsxs)(k, {
                      size: `sm`,
                      variant: `secondary`,
                      onClick: se,
                      children: [(0, Y.jsx)(z, { size: 14 }), `Add Flow`],
                    }),
                  ],
                }),
                (e.userFlows ?? []).length === 0
                  ? (0, Y.jsx)(`p`, {
                      className: `text-sm text-muted-foreground`,
                      children: `No user flows yet. Add step-by-step flows to test in the UI testing tab.`,
                    })
                  : (0, Y.jsx)(`div`, {
                      className: `space-y-4`,
                      children: (e.userFlows ?? []).map((e, t) =>
                        (0, Y.jsxs)(
                          `div`,
                          {
                            className: `bg-muted/40 rounded-lg p-3 sm:p-4`,
                            children: [
                              (0, Y.jsxs)(`div`, {
                                className: `flex items-center gap-2 mb-3`,
                                children: [
                                  (0, Y.jsx)(E, {
                                    value: e.name,
                                    onChange: (e) => le(t, e.target.value),
                                    placeholder: `Flow ${t + 1}`,
                                    className: `h-8 text-sm bg-background`,
                                  }),
                                  (0, Y.jsx)(Z, {
                                    onConfirm: () => ce(t),
                                    label: `flow`,
                                  }),
                                ],
                              }),
                              (0, Y.jsx)(`div`, {
                                className: `space-y-2`,
                                children: e.steps.map((e, n) =>
                                  (0, Y.jsxs)(
                                    `div`,
                                    {
                                      className: `flex items-center gap-2`,
                                      children: [
                                        (0, Y.jsxs)(`span`, {
                                          className: `text-xs text-muted-foreground w-5 text-right flex-shrink-0 tabular-nums`,
                                          children: [n + 1, `.`],
                                        }),
                                        (0, Y.jsx)(E, {
                                          value: e,
                                          onChange: (e) =>
                                            fe(t, n, e.target.value),
                                          placeholder: `Describe this step`,
                                          className: `h-8 text-sm bg-background`,
                                        }),
                                        (0, Y.jsx)(Z, {
                                          onConfirm: () => de(t, n),
                                          label: `step`,
                                        }),
                                      ],
                                    },
                                    n,
                                  ),
                                ),
                              }),
                              (0, Y.jsxs)(k, {
                                size: `sm`,
                                variant: `ghost`,
                                onClick: () => ue(t),
                                className: `mt-2 text-muted-foreground`,
                                children: [
                                  (0, Y.jsx)(z, { size: 14 }),
                                  `Add Step`,
                                ],
                              }),
                            ],
                          },
                          t,
                        ),
                      ),
                    }),
              ],
            }),
          }),
        ],
      }),
    ],
  });
}
function ae() {
  let e = (0, q.c)(6),
    { id: t } = i.useParams(),
    n = t,
    r;
  e[0] === n ? (r = e[1]) : ((r = { id: n }), (e[0] = n), (e[1] = r));
  let a = s(o.docs.get, r);
  if (a === void 0) {
    let t;
    return (
      e[2] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, Y.jsx)(`div`, {
            className: `h-full flex items-center justify-center`,
            children: (0, Y.jsx)(p, { size: `lg` }),
          })),
          (e[2] = t))
        : (t = e[2]),
      t
    );
  }
  if (a === null) {
    let t;
    return (
      e[3] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, Y.jsx)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground`,
            children: (0, Y.jsx)(`p`, { children: `Document not found` }),
          })),
          (e[3] = t))
        : (t = e[3]),
      t
    );
  }
  let c;
  return (
    e[4] === a
      ? (c = e[5])
      : ((c = (0, Y.jsx)(Q, { doc: a })), (e[4] = a), (e[5] = c)),
    c
  );
}
export { ae as component };
