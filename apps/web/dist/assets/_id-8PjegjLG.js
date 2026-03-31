import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, o as i } from "./index-CuMF3NGg.js";
import { c as a, n as o, o as s } from "./backend-BVlbQtYj.js";
import { t as c } from "./hooks-B_9i2gKL.js";
import {
  B as l,
  Ct as u,
  F as d,
  Gn as f,
  Gt as p,
  H as m,
  Ht as h,
  I as g,
  Kt as _,
  L as v,
  R as y,
  Rn as b,
  St as x,
  Tt as ee,
  Un as S,
  V as C,
  Vn as te,
  W as ne,
  Wn as w,
  Wt as re,
  Z as T,
  _r as ie,
  _t as ae,
  at as oe,
  ct as E,
  dr as se,
  dt as ce,
  ft as le,
  gr as ue,
  gt as de,
  hr as D,
  ht as fe,
  lt as pe,
  mr as me,
  mt as he,
  pt as ge,
  q as _e,
  ur as O,
  ut as ve,
  wt as ye,
  xr as be,
  yr as xe,
  z as Se,
} from "./src-DHCpG1Q-.js";
import { t as Ce } from "./createReactComponent-C2GWxX5y.js";
import { n as we, r as Te, t as Ee } from "./MediaPreview-DkU_ziMx.js";
import { t as De } from "./IconCircleCheck-DfkWjjtD.js";
import { t as Oe } from "./IconCode-DJtbkNrt.js";
import { t as ke } from "./IconDeviceDesktop-DW-nbygi.js";
import { t as Ae } from "./IconExternalLink-DInhr4-B.js";
import { t as je } from "./IconGitPullRequest-A3RyN7ym.js";
import { n as Me, t as Ne } from "./IconLayoutSidebarRightExpand-aEe3Th2z.js";
import {
  a as Pe,
  i as Fe,
  n as Ie,
  o as Le,
  r as Re,
  s as ze,
  t as Be,
} from "./PreviewNavBar-BYKOVH-7.js";
import { t as Ve } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as He } from "./IconRefresh-BfbGd9fI.js";
import { t as Ue } from "./IconSparkles-Bq4op_oV.js";
import { t as We } from "./IconWorld-DR9G-8rM.js";
import { t as Ge } from "./AnimatePresence-qXAN7gDu.js";
import { n as Ke } from "./dates-DHZmrCUU.js";
import {
  S as qe,
  f as Je,
  m as Ye,
  s as Xe,
} from "./search-params-C2OhCtfp.js";
import { n as Ze } from "./RepoContext-D9QMbL6d.js";
import {
  a as Qe,
  c as $e,
  i as et,
  n as tt,
  o as nt,
  r as rt,
  s as it,
  t as at,
} from "./StreamingActivityDisplay-CD4bZNYp.js";
var ot = Ce(`outline`, `clipboard-list`, `ClipboardList`, [
    [
      `path`,
      {
        d: `M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2`,
        key: `svg-0`,
      },
    ],
    [
      `path`,
      {
        d: `M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2`,
        key: `svg-1`,
      },
    ],
    [`path`, { d: `M9 12l.01 0`, key: `svg-2` }],
    [`path`, { d: `M13 12l2 0`, key: `svg-3` }],
    [`path`, { d: `M9 16l.01 0`, key: `svg-4` }],
    [`path`, { d: `M13 16l2 0`, key: `svg-5` }],
  ]),
  st = Ce(`outline`, `message-circle`, `MessageCircle`, [
    [
      `path`,
      {
        d: `M3 20l1.3 -3.9c-2.324 -3.437 -1.426 -7.872 2.1 -10.374c3.526 -2.501 8.59 -2.296 11.845 .48c3.255 2.777 3.695 7.266 1.029 10.501c-2.666 3.235 -7.615 4.215 -11.574 2.293l-4.7 1`,
        key: `svg-0`,
      },
    ],
  ]),
  ct = Ce(`outline`, `send`, `Send`, [
    [`path`, { d: `M10 14l11 -11`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M21 3l-6.5 18a.55 .55 0 0 1 -1 0l-3.5 -7l-7 -3.5a.55 .55 0 0 1 0 -1l18 -6.5`,
        key: `svg-1`,
      },
    ],
  ]),
  lt = r(),
  k = e(t(), 1),
  A = n(),
  ut = [`Running code audits`, `Analyzing results`, `Generating report`];
function dt({
  sessionId: e,
  title: t,
  branchName: n,
  prUrl: r,
  summary: i,
  messages: m,
  queuedMessages: C,
  planContent: ne,
  streamingActivity: _e,
  streamingContent: xe,
  summaryStreamingActivity: Ce,
  isSandboxActive: ke,
  isSandboxToggling: Ae,
  onSandboxToggle: Pe,
  isArchived: Le,
  previewUrl: ze,
  sandboxCollapsed: Be,
  onToggleSandbox: He,
}) {
  let { repo: We } = Ze(),
    [Je, Xe] = (0, k.useState)(!1),
    [lt, dt] = (0, k.useState)(!1),
    [ft, pt] = (0, k.useState)(!1),
    [mt, j] = (0, k.useState)(!1),
    [M, ht] = (0, k.useState)(!1),
    [gt, _t] = (0, k.useState)(`confirm`),
    [vt, yt] = (0, k.useState)(0),
    [bt, xt] = qe(`mode`, Ye),
    St = We.defaultModel ?? `sonnet`,
    Ct = (0, k.useMemo)(() => Qe(e, St), [e, St]),
    wt = (0, k.useMemo)(() => nt(e, `default`), [e]),
    [Tt, Et] = (0, k.useState)(Ct),
    [Dt, Ot] = (0, k.useState)(wt),
    kt = it(e),
    At = $e(e),
    jt = (0, k.useCallback)(
      (e) => {
        (Et(e), kt(e));
      },
      [kt],
    ),
    Mt = (0, k.useCallback)(
      (e) => {
        (Ot(e), At(e));
      },
      [At],
    ),
    Nt = (0, A.jsx)(rt, {});
  a(o.sessions.updateLastMessage);
  let Pt = a(o.summarizeWorkflow.startSummarize),
    Ft = a(o.sessions.addMessage),
    It = a(o.sessionWorkflow.startExecute),
    Lt = a(o.sessionWorkflow.enqueueMessage),
    Rt = a(o.queuedMessages.update),
    N = a(o.queuedMessages.remove),
    zt = s(o.github.createSessionPr),
    Bt = a(o.audits.startSessionAudit),
    Vt = c(
      o.audits.getBySession,
      gt === `auditing` ? { sessionId: e } : `skip`,
    ),
    Ht = (0, k.useCallback)(
      async (t, n, r, i) => {
        await It({
          sessionId: e,
          message: t,
          mode: n,
          model: r,
          responseLength: i,
        });
      },
      [It, e],
    ),
    Ut = async (t) => {
      if (!t.trim()) return;
      let n = t.trim();
      if (Yt) {
        await Lt({
          sessionId: e,
          message: n,
          mode: bt,
          model: Tt,
          responseLength: Dt,
        });
        return;
      }
      Xe(!0);
      try {
        (await Ft({ id: e, role: `user`, content: n, mode: bt }),
          await Ht(n, bt, Tt, Dt));
      } catch (t) {
        (await Ft({
          id: e,
          role: `assistant`,
          content: `Error: ${t instanceof Error ? t.message : `Failed to send message`}`,
          mode: bt,
        }),
          Xe(!1));
      }
    },
    Wt = async () => {
      dt(!0);
      try {
        await Pt({ sessionId: e });
      } finally {
        dt(!1);
      }
    },
    Gt = async () => {
      (_t(`auditing`), yt(0), ht(!0));
      try {
        await zt({ sessionId: e });
        try {
          await Bt({ sessionId: e });
        } catch {
          _t(`complete`);
        }
      } catch {
        _t(`confirm`);
      } finally {
        ht(!1);
      }
    },
    Kt = () => {
      (j(!1), _t(`confirm`), yt(0));
    };
  ((0, k.useEffect)(() => {
    if (gt !== `auditing`) return;
    let e = Vt?.status;
    if (e !== `completed` && e !== `error`) return;
    let t = ut.map((e, t) => setTimeout(() => yt((e) => e + 1), (t + 1) * 400));
    return () => t.forEach(clearTimeout);
  }, [Vt?.status, gt]),
    (0, k.useEffect)(() => {
      if (gt === `auditing` && vt >= ut.length) {
        let e = setTimeout(() => _t(`complete`), 300);
        return () => clearTimeout(e);
      }
    }, [gt, vt]));
  let qt = m[m.length - 1],
    Jt = !!qt && qt.role === `assistant` && !qt.content,
    Yt = Je || Jt;
  (0, k.useEffect)(() => {
    Je && qt?.role === `assistant` && qt.content && Xe(!1);
  }, [Je, qt]);
  let Xt = a(o.sessionWorkflow.cancelExecution),
    Zt = async () => {
      await Xt({ sessionId: e });
    },
    Qt = !ke,
    $t = Je && !Jt ? `submitted` : void 0,
    en = async ({ text: e }) => {
      Qt || (await Ut(e));
    },
    tn = !!(i && i.length > 0),
    nn = !!Ce,
    rn = (0, k.useMemo)(
      () =>
        C.map((e) => {
          let t = [
            e.mode === `execute`
              ? `Execute`
              : e.mode === `plan`
                ? `PRD`
                : `Ask`,
            e.model ? e.model : null,
            e.responseLength && e.responseLength !== `default`
              ? e.responseLength
              : null,
          ].filter((e) => !!e);
          return {
            id: e._id,
            content: e.content,
            info: t.length > 0 ? t.join(` / `) : void 0,
          };
        }),
      [C],
    );
  return (0, A.jsxs)(Fe, {
    title: t,
    isArchived: Le,
    headerLeft: (0, A.jsx)(O, {
      size: `icon`,
      variant: ke ? `destructive` : `secondary`,
      onClick: () => Pe(ke ? `stop` : `start`),
      disabled: Ae,
      className: `motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97] ${ke ? `` : `text-success`}`,
      children: Ae
        ? (0, A.jsx)(_, { size: `sm` })
        : ke
          ? (0, A.jsx)(be, { className: `w-4 h-4` })
          : (0, A.jsx)(Ve, { className: `w-4 h-4` }),
    }),
    headerRight: (0, A.jsxs)(A.Fragment, {
      children: [
        (0, A.jsx)(O, {
          size: `sm`,
          variant: `secondary`,
          className: `motion-press text-primary hover:scale-[1.01] active:scale-[0.99]`,
          asChild: !!ze,
          disabled: !ze,
          children: ze
            ? (0, A.jsxs)(`a`, {
                href: ze,
                target: `_blank`,
                rel: `noopener noreferrer`,
                children: [
                  (0, A.jsx)(Te, { size: 14 }),
                  (0, A.jsx)(`span`, {
                    className: `hidden sm:inline`,
                    children: `View Preview`,
                  }),
                ],
              })
            : (0, A.jsxs)(A.Fragment, {
                children: [
                  (0, A.jsx)(Te, { size: 14 }),
                  (0, A.jsx)(`span`, {
                    className: `hidden sm:inline`,
                    children: `View Preview`,
                  }),
                ],
              }),
        }),
        r
          ? (0, A.jsx)(`a`, {
              href: r,
              target: `_blank`,
              rel: `noopener noreferrer`,
              children: (0, A.jsxs)(se, {
                variant: `outline`,
                className: `motion-base gap-1 cursor-pointer hover:scale-[1.01]`,
                children: [(0, A.jsx)(je, { size: 12 }), `View PR`],
              }),
            })
          : n
            ? (0, A.jsxs)(O, {
                size: `sm`,
                variant: `secondary`,
                className: `motion-press text-success hover:scale-[1.01] active:scale-[0.99]`,
                onClick: () => j(!0),
                children: [
                  (0, A.jsx)(ct, { size: 12 }),
                  (0, A.jsx)(`span`, {
                    className: `hidden sm:inline`,
                    children: `Send for Review`,
                  }),
                ],
              })
            : null,
        (0, A.jsx)(O, {
          size: `icon`,
          variant: `secondary`,
          onClick: () => pt(!0),
          disabled: lt || !ke || m.length === 0,
          className: `motion-press h-8 w-8 text-primary hover:scale-[1.03] active:scale-[0.97]`,
          title: tn ? `Regenerate summary` : `Generate summary`,
          children: lt
            ? (0, A.jsx)(_, { size: `sm` })
            : (0, A.jsx)(Ue, { className: `w-4 h-4` }),
        }),
        He &&
          (0, A.jsx)(O, {
            size: `icon`,
            variant: `ghost`,
            className: `size-8 motion-press hover:scale-[1.03] active:scale-[0.97]`,
            onClick: He,
            title: Be ? `Show sandbox panel` : `Hide sandbox panel`,
            children: Be
              ? (0, A.jsx)(Ne, { className: `size-4` })
              : (0, A.jsx)(Me, { className: `size-4` }),
          }),
      ],
    }),
    children: [
      (0, A.jsx)(Ge, {
        children:
          (nn || tn) &&
          (0, A.jsx)(T.div, {
            initial: { opacity: 0, y: -8 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: -8 },
            transition: { duration: 0.2 },
            children: (0, A.jsx)(me, {
              type: `single`,
              collapsible: !0,
              defaultValue: nn ? `summary` : void 0,
              className: `w-full min-w-0 px-3 sm:px-6 bg-secondary rounded-b-3xl`,
              children: (0, A.jsxs)(ue, {
                value: `summary`,
                className: `border-b-0`,
                children: [
                  (0, A.jsx)(ie, {
                    className: `py-2 text-sm`,
                    children: (0, A.jsxs)(`div`, {
                      className: `flex flex-row gap-2 items-center text-primary`,
                      children: [
                        (0, A.jsx)(Ue, { size: 14 }),
                        (0, A.jsx)(`p`, { children: `Session summary` }),
                      ],
                    }),
                  }),
                  (0, A.jsx)(D, {
                    className: `pb-2`,
                    children: nn
                      ? (0, A.jsx)(tt, { activity: Ce })
                      : tn
                        ? (0, A.jsx)(`ul`, {
                            className: `list-disc list-inside text-sm text-primary space-y-1 pl-4`,
                            children: i?.map((e, t) =>
                              (0, A.jsx)(`li`, { children: e }, t),
                            ),
                          })
                        : null,
                  }),
                ],
              }),
            }),
          }),
      }),
      (0, A.jsxs)(x, {
        className: `flex-1 min-h-0`,
        children: [
          (0, A.jsx)(u, {
            className: `gap-3 p-3`,
            children:
              m.length === 0
                ? (0, A.jsx)(ye, {
                    title: ke
                      ? `No messages yet. Start the conversation!`
                      : `Sandbox is inactive. Start the sandbox to begin chatting.`,
                  })
                : m.map((e) =>
                    e.isSystemAlert
                      ? (0, A.jsx)(
                          Ie,
                          {
                            content: e.content ?? ``,
                            errorDetail: e.errorDetail,
                          },
                          e._id,
                        )
                      : (0, A.jsx)(
                          T.div,
                          {
                            initial: { opacity: 0, y: 10 },
                            animate: { opacity: 1, y: 0 },
                            transition: {
                              duration: 0.18,
                              ease: [0.22, 1, 0.36, 1],
                            },
                            children: (0, A.jsxs)(fe, {
                              from: e.role,
                              children: [
                                (0, A.jsx)(de, {
                                  className:
                                    e.role === `user`
                                      ? `rounded-xl bg-secondary text-foreground px-4 py-3`
                                      : `px-1 py-2`,
                                  children:
                                    e.role === `assistant` && !e.content
                                      ? (0, A.jsxs)(A.Fragment, {
                                          children: [
                                            xe
                                              ? (0, A.jsx)(ae, {
                                                  className: `prose prose-sm dark:prose-invert max-w-none`,
                                                  children: xe,
                                                })
                                              : null,
                                            (0, A.jsx)(tt, {
                                              activity: _e,
                                              name: `Eva`,
                                              icon: Nt,
                                              startedAt: e.timestamp,
                                            }),
                                          ],
                                        })
                                      : (0, A.jsx)(A.Fragment, {
                                          children:
                                            e.role === `assistant`
                                              ? (0, A.jsxs)(A.Fragment, {
                                                  children: [
                                                    e.activityLog &&
                                                      (0, A.jsx)(at, {
                                                        activityLog:
                                                          e.activityLog,
                                                        name: `Eva`,
                                                        icon: Nt,
                                                        startedAt: e.timestamp,
                                                        finishedAt:
                                                          e.finishedAt,
                                                      }),
                                                    (0, A.jsx)(ae, {
                                                      className: `prose prose-sm dark:prose-invert max-w-none`,
                                                      children: e.content,
                                                    }),
                                                    e.imageUrl &&
                                                      (0, A.jsx)(Ee, {
                                                        url: e.imageUrl,
                                                      }),
                                                    e.videoUrl &&
                                                      (0, A.jsx)(we, {
                                                        url: e.videoUrl,
                                                      }),
                                                  ],
                                                })
                                              : (0, A.jsxs)(A.Fragment, {
                                                  children: [
                                                    (0, A.jsx)(`p`, {
                                                      className: `text-sm whitespace-pre-wrap break-words`,
                                                      children: e.content,
                                                    }),
                                                    (0, A.jsxs)(`div`, {
                                                      className: `flex items-center justify-between gap-3`,
                                                      children: [
                                                        e.mode &&
                                                          (0, A.jsxs)(`div`, {
                                                            className: `flex items-center gap-1 text-[11px] text-muted-foreground/60`,
                                                            children: [
                                                              e.mode ===
                                                                `execute` &&
                                                                (0, A.jsxs)(
                                                                  A.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      A.jsx)(
                                                                        Oe,
                                                                        {
                                                                          className: `w-2.5 h-2.5`,
                                                                        },
                                                                      ),
                                                                      ` `,
                                                                      `Execute`,
                                                                    ],
                                                                  },
                                                                ),
                                                              e.mode ===
                                                                `ask` &&
                                                                (0, A.jsxs)(
                                                                  A.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      A.jsx)(
                                                                        st,
                                                                        {
                                                                          className: `w-2.5 h-2.5`,
                                                                        },
                                                                      ),
                                                                      ` `,
                                                                      `Ask`,
                                                                    ],
                                                                  },
                                                                ),
                                                              e.mode ===
                                                                `plan` &&
                                                                (0, A.jsxs)(
                                                                  A.Fragment,
                                                                  {
                                                                    children: [
                                                                      (0,
                                                                      A.jsx)(
                                                                        ot,
                                                                        {
                                                                          className: `w-2.5 h-2.5`,
                                                                        },
                                                                      ),
                                                                      ` `,
                                                                      `PRD`,
                                                                    ],
                                                                  },
                                                                ),
                                                            ],
                                                          }),
                                                        e.timestamp &&
                                                          (0, A.jsx)(`span`, {
                                                            className: `text-[11px] text-muted-foreground/60`,
                                                            children: Ke(
                                                              e.timestamp,
                                                            ).format(`h:mm A`),
                                                          }),
                                                      ],
                                                    }),
                                                  ],
                                                }),
                                        }),
                                }),
                                e.role === `user` &&
                                  (0, A.jsx)(`div`, {
                                    className: `mt-0.5 ml-auto`,
                                    children: (0, A.jsx)(et, {
                                      userId: e.userId,
                                    }),
                                  }),
                              ],
                            }),
                          },
                          e._id,
                        ),
                  ),
          }),
          (0, A.jsx)(ee, {}),
        ],
      }),
      !Le &&
        (0, A.jsxs)(`div`, {
          className: `p-2 md:p-3`,
          children: [
            (0, A.jsx)(Re, {
              items: rn,
              onEdit: async (e, t) => {
                await Rt({ id: e, content: t });
              },
              onDelete: async (e) => {
                await N({ id: e });
              },
            }),
            (0, A.jsx)(Ge, {
              children:
                bt === `plan` &&
                ne &&
                (0, A.jsx)(T.div, {
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: 8 },
                  transition: { duration: 0.2 },
                  children: (0, A.jsxs)(d, {
                    defaultOpen: !0,
                    className: `mb-2`,
                    children: [
                      (0, A.jsxs)(y, {
                        className: `p-4`,
                        children: [
                          (0, A.jsx)(Se, { children: `Product Requirements` }),
                          (0, A.jsx)(l, {}),
                        ],
                      }),
                      (0, A.jsx)(g, {
                        className: `px-3 pb-3 pt-0 max-h-40 overflow-y-auto sm:px-4 sm:pb-4 sm:max-h-64`,
                        children: (0, A.jsx)(ae, {
                          className: `prose prose-sm dark:prose-invert max-w-none`,
                          children: ne,
                        }),
                      }),
                      (0, A.jsx)(v, {
                        className: `px-4 pb-4 pt-0 gap-2`,
                        children: (0, A.jsxs)(O, {
                          size: `sm`,
                          className: `motion-press bg-success text-success-foreground hover:bg-success/90 hover:scale-[1.01] active:scale-[0.99]`,
                          onClick: () => xt(`execute`),
                          children: [
                            (0, A.jsx)(Oe, { className: `w-3.5 h-3.5` }),
                            `Approve Plan`,
                          ],
                        }),
                      }),
                    ],
                  }),
                }),
            }),
            (0, A.jsxs)(`div`, {
              className: `relative pt-4`,
              children: [
                (0, A.jsx)(h, {
                  value: bt,
                  onValueChange: (e) => {
                    (e === `execute` || e === `ask` || e === `plan`) && xt(e);
                  },
                  className: `absolute left-1.5 top-4 z-20 -translate-y-1/2 sm:left-3`,
                  children: (0, A.jsxs)(re, {
                    className: `h-8 rounded-full  p-0.5`,
                    children: [
                      (0, A.jsxs)(p, {
                        value: `execute`,
                        className: `rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary`,
                        children: [
                          (0, A.jsx)(Oe, { className: `w-3 h-3` }),
                          `Execute`,
                        ],
                      }),
                      (0, A.jsxs)(p, {
                        value: `ask`,
                        className: `rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary`,
                        children: [
                          (0, A.jsx)(st, { className: `w-3 h-3` }),
                          `Ask`,
                        ],
                      }),
                      (0, A.jsxs)(p, {
                        value: `plan`,
                        className: `rounded-full text-xs px-2.5 py-1 gap-1 transition-all data-[state=active]:text-primary`,
                        children: [
                          (0, A.jsx)(ot, { className: `w-3 h-3` }),
                          `PRD`,
                        ],
                      }),
                    ],
                  }),
                }),
                (0, A.jsxs)(ve, {
                  onSubmit: en,
                  children: [
                    (0, A.jsx)(ge, {
                      className: `pt-8`,
                      placeholder: ke
                        ? bt === `execute`
                          ? `Describe the changes to make to Eva...`
                          : bt === `ask`
                            ? `Ask Eva a question about the codebase...`
                            : `Describe the feature or product requirements to Eva...`
                        : `Start the sandbox to begin chatting...`,
                      disabled: Qt,
                    }),
                    (0, A.jsxs)(ce, {
                      children: [
                        (0, A.jsxs)(he, {
                          children: [
                            (0, A.jsx)(E, {
                              value: Tt,
                              onValueChange: jt,
                              disabled: Qt,
                            }),
                            (0, A.jsx)(pe, {
                              value: Dt,
                              onValueChange: Mt,
                              disabled: Qt,
                            }),
                          ],
                        }),
                        (0, A.jsxs)(`div`, {
                          className: `flex items-center gap-1`,
                          children: [
                            (0, A.jsx)(oe, { disabled: Qt }),
                            Yt
                              ? (0, A.jsx)(O, {
                                  size: `icon-sm`,
                                  type: `button`,
                                  variant: `destructive`,
                                  onClick: Zt,
                                  title: `Stop Eva`,
                                  children: (0, A.jsx)(be, {
                                    className: `size-4`,
                                  }),
                                })
                              : null,
                            (0, A.jsx)(le, {
                              status: $t,
                              disabled: Qt,
                              title: Yt ? `Queue message` : `Send message`,
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        }),
      (0, A.jsx)(b, {
        open: ft,
        onOpenChange: (e) => {
          e || pt(!1);
        },
        children: (0, A.jsxs)(te, {
          children: [
            (0, A.jsx)(w, {
              children: (0, A.jsx)(f, {
                children: tn ? `Regenerate Summary` : `Generate Summary`,
              }),
            }),
            (0, A.jsx)(`div`, {
              className: `space-y-2 text-sm text-muted-foreground`,
              children: (0, A.jsx)(`p`, {
                children: tn
                  ? `This will regenerate and replace the current session summary.`
                  : `This will generate a session summary from the current chat history.`,
              }),
            }),
            (0, A.jsxs)(S, {
              children: [
                (0, A.jsx)(O, {
                  variant: `ghost`,
                  onClick: () => pt(!1),
                  children: `Cancel`,
                }),
                (0, A.jsx)(O, {
                  onClick: async () => {
                    (await Wt(), pt(!1));
                  },
                  disabled: lt,
                  children: lt ? (0, A.jsx)(_, { size: `sm` }) : `Confirm`,
                }),
              ],
            }),
          ],
        }),
      }),
      (0, A.jsx)(b, {
        open: mt,
        onOpenChange: (e) => {
          e || Kt();
        },
        children: (0, A.jsx)(te, {
          children: (0, A.jsxs)(Ge, {
            mode: `wait`,
            children: [
              gt === `confirm` &&
                (0, A.jsxs)(
                  T.div,
                  {
                    className: `space-y-4`,
                    initial: { opacity: 0 },
                    animate: { opacity: 1 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.2 },
                    children: [
                      (0, A.jsx)(w, {
                        children: (0, A.jsx)(f, {
                          children: `Send for Code Review`,
                        }),
                      }),
                      (0, A.jsxs)(`div`, {
                        className: `space-y-2 text-sm text-muted-foreground`,
                        children: [
                          (0, A.jsx)(`p`, {
                            children: `By clicking this you confirm that all your changes have been tested in your session, you are happy with those changes, have generated a summary, and agree with the changes. Your session will become uneditable while a developer reviews the code changes before merging into staging/production.`,
                          }),
                          (0, A.jsx)(`p`, {
                            children: `The following audits will also run automatically in the background:`,
                          }),
                          (0, A.jsx)(`p`, {
                            children: `An automated code audit will run to check accessibility, testing, code quality, and other configured checks.`,
                          }),
                        ],
                      }),
                      (0, A.jsxs)(S, {
                        children: [
                          (0, A.jsx)(O, {
                            variant: `ghost`,
                            onClick: Kt,
                            children: `Cancel`,
                          }),
                          (0, A.jsx)(O, {
                            className: `bg-success text-success-foreground hover:bg-success/90`,
                            onClick: Gt,
                            disabled: M,
                            children: M
                              ? (0, A.jsx)(_, { size: `sm` })
                              : `Confirm`,
                          }),
                        ],
                      }),
                    ],
                  },
                  `confirm`,
                ),
              gt === `auditing` &&
                (0, A.jsxs)(
                  T.div,
                  {
                    className: `space-y-4`,
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    exit: { opacity: 0, x: -20 },
                    transition: { duration: 0.2 },
                    children: [
                      (0, A.jsx)(w, {
                        children: (0, A.jsx)(f, {
                          children: `Auditing in Progress`,
                        }),
                      }),
                      (0, A.jsx)(`div`, {
                        className: `space-y-4 py-2`,
                        children: ut.map((e, t) => {
                          let n = t < vt,
                            r = t === vt && vt < ut.length;
                          return (0, A.jsxs)(
                            T.div,
                            {
                              className: `flex items-center gap-3`,
                              initial: { opacity: 0, x: -8 },
                              animate: { opacity: 1, x: 0 },
                              transition: { delay: t * 0.1, duration: 0.2 },
                              children: [
                                (0, A.jsx)(`div`, {
                                  className: `flex h-5 w-5 items-center justify-center`,
                                  children: n
                                    ? (0, A.jsx)(T.div, {
                                        initial: { scale: 0 },
                                        animate: { scale: 1 },
                                        transition: {
                                          type: `spring`,
                                          stiffness: 300,
                                          damping: 20,
                                        },
                                        children: (0, A.jsx)(De, {
                                          size: 20,
                                          className: `text-success`,
                                        }),
                                      })
                                    : r
                                      ? (0, A.jsx)(_, { size: `sm` })
                                      : (0, A.jsx)(`div`, {
                                          className: `h-4 w-4 rounded-full ring-2 ring-muted`,
                                        }),
                                }),
                                (0, A.jsx)(`span`, {
                                  className: `text-sm ${n || r ? `text-foreground` : `text-muted-foreground`}`,
                                  children: e,
                                }),
                              ],
                            },
                            e,
                          );
                        }),
                      }),
                    ],
                  },
                  `auditing`,
                ),
              gt === `complete` &&
                (0, A.jsxs)(
                  T.div,
                  {
                    className: `space-y-4`,
                    initial: { opacity: 0, x: 20 },
                    animate: { opacity: 1, x: 0 },
                    transition: { duration: 0.3 },
                    children: [
                      (0, A.jsx)(w, {
                        children: (0, A.jsx)(f, { children: `Review Sent` }),
                      }),
                      (0, A.jsxs)(T.div, {
                        initial: { opacity: 0, y: 8 },
                        animate: { opacity: 1, y: 0 },
                        transition: { duration: 0.3, delay: 0.1 },
                        className: `rounded-lg bg-success/10 p-4 text-center`,
                        children: [
                          (0, A.jsx)(De, {
                            size: 24,
                            className: `mx-auto mb-2 text-success`,
                          }),
                          (0, A.jsx)(`p`, {
                            className: `text-sm font-medium text-success`,
                            children: `This information has automatically been sent to the dev team.`,
                          }),
                        ],
                      }),
                      (0, A.jsx)(S, {
                        children: (0, A.jsx)(O, {
                          onClick: Kt,
                          children: `Done`,
                        }),
                      }),
                    ],
                  },
                  `complete`,
                ),
            ],
          }),
        }),
      }),
    ],
  });
}
var ft = Object.defineProperty,
  pt = Object.getOwnPropertyDescriptor,
  mt = (e, t) => {
    for (var n in t) ft(e, n, { get: t[n], enumerable: !0 });
  },
  j = (e, t, n, r) => {
    for (
      var i = r > 1 ? void 0 : r ? pt(t, n) : t, a = e.length - 1, o;
      a >= 0;
      a--
    )
      (o = e[a]) && (i = (r ? o(t, n, i) : o(i)) || i);
    return (r && i && ft(t, n, i), i);
  },
  M = (e, t) => (n, r) => t(n, r, e),
  ht = `Terminal input`,
  gt = { get: () => ht, set: (e) => (ht = e) },
  _t = `Too much output to announce, navigate to rows manually to read`,
  vt = { get: () => _t, set: (e) => (_t = e) };
function yt(e) {
  return e.replace(/\r?\n/g, `\r`);
}
function bt(e, t) {
  return t ? `\x1B[200~` + e + `\x1B[201~` : e;
}
function xt(e, t) {
  (e.clipboardData && e.clipboardData.setData(`text/plain`, t.selectionText),
    e.preventDefault());
}
function St(e, t, n, r) {
  (e.stopPropagation(),
    e.clipboardData && Ct(e.clipboardData.getData(`text/plain`), t, n, r));
}
function Ct(e, t, n, r) {
  ((e = yt(e)),
    (e = bt(
      e,
      n.decPrivateModes.bracketedPasteMode &&
        r.rawOptions.ignoreBracketedPasteMode !== !0,
    )),
    n.triggerDataEvent(e, !0),
    (t.value = ``));
}
function wt(e, t, n) {
  let r = n.getBoundingClientRect(),
    i = e.clientX - r.left - 10,
    a = e.clientY - r.top - 10;
  ((t.style.width = `20px`),
    (t.style.height = `20px`),
    (t.style.left = `${i}px`),
    (t.style.top = `${a}px`),
    (t.style.zIndex = `1000`),
    t.focus());
}
function Tt(e, t, n, r, i) {
  (wt(e, t, n),
    i && r.rightClickSelect(e),
    (t.value = r.selectionText),
    t.select());
}
function Et(e) {
  return e > 65535
    ? ((e -= 65536),
      String.fromCharCode((e >> 10) + 55296) +
        String.fromCharCode((e % 1024) + 56320))
    : String.fromCharCode(e);
}
function Dt(e, t = 0, n = e.length) {
  let r = ``;
  for (let i = t; i < n; ++i) {
    let t = e[i];
    t > 65535
      ? ((t -= 65536),
        (r +=
          String.fromCharCode((t >> 10) + 55296) +
          String.fromCharCode((t % 1024) + 56320)))
      : (r += String.fromCharCode(t));
  }
  return r;
}
var Ot = class {
    constructor() {
      this._interim = 0;
    }
    clear() {
      this._interim = 0;
    }
    decode(e, t) {
      let n = e.length;
      if (!n) return 0;
      let r = 0,
        i = 0;
      if (this._interim) {
        let n = e.charCodeAt(i++);
        (56320 <= n && n <= 57343
          ? (t[r++] = (this._interim - 55296) * 1024 + n - 56320 + 65536)
          : ((t[r++] = this._interim), (t[r++] = n)),
          (this._interim = 0));
      }
      for (let a = i; a < n; ++a) {
        let i = e.charCodeAt(a);
        if (55296 <= i && i <= 56319) {
          if (++a >= n) return ((this._interim = i), r);
          let o = e.charCodeAt(a);
          56320 <= o && o <= 57343
            ? (t[r++] = (i - 55296) * 1024 + o - 56320 + 65536)
            : ((t[r++] = i), (t[r++] = o));
          continue;
        }
        i !== 65279 && (t[r++] = i);
      }
      return r;
    }
  },
  kt = class {
    constructor() {
      this.interim = new Uint8Array(3);
    }
    clear() {
      this.interim.fill(0);
    }
    decode(e, t) {
      let n = e.length;
      if (!n) return 0;
      let r = 0,
        i,
        a,
        o,
        s,
        c = 0,
        l = 0;
      if (this.interim[0]) {
        let i = !1,
          a = this.interim[0];
        a &= (a & 224) == 192 ? 31 : (a & 240) == 224 ? 15 : 7;
        let o = 0,
          s;
        for (; (s = this.interim[++o] & 63) && o < 4; ) ((a <<= 6), (a |= s));
        let c =
            (this.interim[0] & 224) == 192
              ? 2
              : (this.interim[0] & 240) == 224
                ? 3
                : 4,
          u = c - o;
        for (; l < u; ) {
          if (l >= n) return 0;
          if (((s = e[l++]), (s & 192) != 128)) {
            (l--, (i = !0));
            break;
          } else ((this.interim[o++] = s), (a <<= 6), (a |= s & 63));
        }
        (i ||
          (c === 2
            ? a < 128
              ? l--
              : (t[r++] = a)
            : c === 3
              ? a < 2048 ||
                (a >= 55296 && a <= 57343) ||
                a === 65279 ||
                (t[r++] = a)
              : a < 65536 || a > 1114111 || (t[r++] = a)),
          this.interim.fill(0));
      }
      let u = n - 4,
        d = l;
      for (; d < n; ) {
        for (
          ;
          d < u &&
          !((i = e[d]) & 128) &&
          !((a = e[d + 1]) & 128) &&
          !((o = e[d + 2]) & 128) &&
          !((s = e[d + 3]) & 128);
        )
          ((t[r++] = i), (t[r++] = a), (t[r++] = o), (t[r++] = s), (d += 4));
        if (((i = e[d++]), i < 128)) t[r++] = i;
        else if ((i & 224) == 192) {
          if (d >= n) return ((this.interim[0] = i), r);
          if (((a = e[d++]), (a & 192) != 128)) {
            d--;
            continue;
          }
          if (((c = ((i & 31) << 6) | (a & 63)), c < 128)) {
            d--;
            continue;
          }
          t[r++] = c;
        } else if ((i & 240) == 224) {
          if (d >= n) return ((this.interim[0] = i), r);
          if (((a = e[d++]), (a & 192) != 128)) {
            d--;
            continue;
          }
          if (d >= n) return ((this.interim[0] = i), (this.interim[1] = a), r);
          if (((o = e[d++]), (o & 192) != 128)) {
            d--;
            continue;
          }
          if (
            ((c = ((i & 15) << 12) | ((a & 63) << 6) | (o & 63)),
            c < 2048 || (c >= 55296 && c <= 57343) || c === 65279)
          )
            continue;
          t[r++] = c;
        } else if ((i & 248) == 240) {
          if (d >= n) return ((this.interim[0] = i), r);
          if (((a = e[d++]), (a & 192) != 128)) {
            d--;
            continue;
          }
          if (d >= n) return ((this.interim[0] = i), (this.interim[1] = a), r);
          if (((o = e[d++]), (o & 192) != 128)) {
            d--;
            continue;
          }
          if (d >= n)
            return (
              (this.interim[0] = i),
              (this.interim[1] = a),
              (this.interim[2] = o),
              r
            );
          if (((s = e[d++]), (s & 192) != 128)) {
            d--;
            continue;
          }
          if (
            ((c =
              ((i & 7) << 18) | ((a & 63) << 12) | ((o & 63) << 6) | (s & 63)),
            c < 65536 || c > 1114111)
          )
            continue;
          t[r++] = c;
        }
      }
      return r;
    }
  },
  At = ``,
  jt = ` `,
  Mt = class e {
    constructor() {
      ((this.fg = 0), (this.bg = 0), (this.extended = new Nt()));
    }
    static toColorRGB(e) {
      return [(e >>> 16) & 255, (e >>> 8) & 255, e & 255];
    }
    static fromColorRGB(e) {
      return ((e[0] & 255) << 16) | ((e[1] & 255) << 8) | (e[2] & 255);
    }
    clone() {
      let t = new e();
      return (
        (t.fg = this.fg),
        (t.bg = this.bg),
        (t.extended = this.extended.clone()),
        t
      );
    }
    isInverse() {
      return this.fg & 67108864;
    }
    isBold() {
      return this.fg & 134217728;
    }
    isUnderline() {
      return this.hasExtendedAttrs() && this.extended.underlineStyle !== 0
        ? 1
        : this.fg & 268435456;
    }
    isBlink() {
      return this.fg & 536870912;
    }
    isInvisible() {
      return this.fg & 1073741824;
    }
    isItalic() {
      return this.bg & 67108864;
    }
    isDim() {
      return this.bg & 134217728;
    }
    isStrikethrough() {
      return this.fg & 2147483648;
    }
    isProtected() {
      return this.bg & 536870912;
    }
    isOverline() {
      return this.bg & 1073741824;
    }
    getFgColorMode() {
      return this.fg & 50331648;
    }
    getBgColorMode() {
      return this.bg & 50331648;
    }
    isFgRGB() {
      return (this.fg & 50331648) == 50331648;
    }
    isBgRGB() {
      return (this.bg & 50331648) == 50331648;
    }
    isFgPalette() {
      return (
        (this.fg & 50331648) == 16777216 || (this.fg & 50331648) == 33554432
      );
    }
    isBgPalette() {
      return (
        (this.bg & 50331648) == 16777216 || (this.bg & 50331648) == 33554432
      );
    }
    isFgDefault() {
      return (this.fg & 50331648) == 0;
    }
    isBgDefault() {
      return (this.bg & 50331648) == 0;
    }
    isAttributeDefault() {
      return this.fg === 0 && this.bg === 0;
    }
    getFgColor() {
      switch (this.fg & 50331648) {
        case 16777216:
        case 33554432:
          return this.fg & 255;
        case 50331648:
          return this.fg & 16777215;
        default:
          return -1;
      }
    }
    getBgColor() {
      switch (this.bg & 50331648) {
        case 16777216:
        case 33554432:
          return this.bg & 255;
        case 50331648:
          return this.bg & 16777215;
        default:
          return -1;
      }
    }
    hasExtendedAttrs() {
      return this.bg & 268435456;
    }
    updateExtended() {
      this.extended.isEmpty()
        ? (this.bg &= -268435457)
        : (this.bg |= 268435456);
    }
    getUnderlineColor() {
      if (this.bg & 268435456 && ~this.extended.underlineColor)
        switch (this.extended.underlineColor & 50331648) {
          case 16777216:
          case 33554432:
            return this.extended.underlineColor & 255;
          case 50331648:
            return this.extended.underlineColor & 16777215;
          default:
            return this.getFgColor();
        }
      return this.getFgColor();
    }
    getUnderlineColorMode() {
      return this.bg & 268435456 && ~this.extended.underlineColor
        ? this.extended.underlineColor & 50331648
        : this.getFgColorMode();
    }
    isUnderlineColorRGB() {
      return this.bg & 268435456 && ~this.extended.underlineColor
        ? (this.extended.underlineColor & 50331648) == 50331648
        : this.isFgRGB();
    }
    isUnderlineColorPalette() {
      return this.bg & 268435456 && ~this.extended.underlineColor
        ? (this.extended.underlineColor & 50331648) == 16777216 ||
            (this.extended.underlineColor & 50331648) == 33554432
        : this.isFgPalette();
    }
    isUnderlineColorDefault() {
      return this.bg & 268435456 && ~this.extended.underlineColor
        ? (this.extended.underlineColor & 50331648) == 0
        : this.isFgDefault();
    }
    getUnderlineStyle() {
      return this.fg & 268435456
        ? this.bg & 268435456
          ? this.extended.underlineStyle
          : 1
        : 0;
    }
    getUnderlineVariantOffset() {
      return this.extended.underlineVariantOffset;
    }
  },
  Nt = class e {
    constructor(e = 0, t = 0) {
      ((this._ext = 0), (this._urlId = 0), (this._ext = e), (this._urlId = t));
    }
    get ext() {
      return this._urlId
        ? (this._ext & -469762049) | (this.underlineStyle << 26)
        : this._ext;
    }
    set ext(e) {
      this._ext = e;
    }
    get underlineStyle() {
      return this._urlId ? 5 : (this._ext & 469762048) >> 26;
    }
    set underlineStyle(e) {
      ((this._ext &= -469762049), (this._ext |= (e << 26) & 469762048));
    }
    get underlineColor() {
      return this._ext & 67108863;
    }
    set underlineColor(e) {
      ((this._ext &= -67108864), (this._ext |= e & 67108863));
    }
    get urlId() {
      return this._urlId;
    }
    set urlId(e) {
      this._urlId = e;
    }
    get underlineVariantOffset() {
      let e = (this._ext & 3758096384) >> 29;
      return e < 0 ? e ^ 4294967288 : e;
    }
    set underlineVariantOffset(e) {
      ((this._ext &= 536870911), (this._ext |= (e << 29) & 3758096384));
    }
    clone() {
      return new e(this._ext, this._urlId);
    }
    isEmpty() {
      return this.underlineStyle === 0 && this._urlId === 0;
    }
  },
  Pt = class e extends Mt {
    constructor() {
      (super(...arguments),
        (this.content = 0),
        (this.fg = 0),
        (this.bg = 0),
        (this.extended = new Nt()),
        (this.combinedData = ``));
    }
    static fromCharData(t) {
      let n = new e();
      return (n.setFromCharData(t), n);
    }
    isCombined() {
      return this.content & 2097152;
    }
    getWidth() {
      return this.content >> 22;
    }
    getChars() {
      return this.content & 2097152
        ? this.combinedData
        : this.content & 2097151
          ? Et(this.content & 2097151)
          : ``;
    }
    getCode() {
      return this.isCombined()
        ? this.combinedData.charCodeAt(this.combinedData.length - 1)
        : this.content & 2097151;
    }
    setFromCharData(e) {
      ((this.fg = e[0]), (this.bg = 0));
      let t = !1;
      if (e[1].length > 2) t = !0;
      else if (e[1].length === 2) {
        let n = e[1].charCodeAt(0);
        if (55296 <= n && n <= 56319) {
          let r = e[1].charCodeAt(1);
          56320 <= r && r <= 57343
            ? (this.content =
                ((n - 55296) * 1024 + r - 56320 + 65536) | (e[2] << 22))
            : (t = !0);
        } else t = !0;
      } else this.content = e[1].charCodeAt(0) | (e[2] << 22);
      t &&
        ((this.combinedData = e[1]), (this.content = 2097152 | (e[2] << 22)));
    }
    getAsCharData() {
      return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
    }
  },
  Ft = `di$target`,
  It = `di$dependencies`,
  Lt = new Map();
function Rt(e) {
  return e[It] || [];
}
function N(e) {
  if (Lt.has(e)) return Lt.get(e);
  let t = function (e, n, r) {
    if (arguments.length !== 3)
      throw Error(
        `@IServiceName-decorator can only be used to decorate a parameter`,
      );
    zt(t, e, r);
  };
  return ((t._id = e), Lt.set(e, t), t);
}
function zt(e, t, n) {
  t[Ft] === t
    ? t[It].push({ id: e, index: n })
    : ((t[It] = [{ id: e, index: n }]), (t[Ft] = t));
}
var Bt = N(`BufferService`),
  Vt = N(`CoreMouseService`),
  Ht = N(`CoreService`),
  Ut = N(`CharsetService`),
  Wt = N(`InstantiationService`),
  Gt = N(`LogService`),
  Kt = N(`OptionsService`),
  qt = N(`OscLinkService`),
  Jt = N(`UnicodeService`),
  Yt = N(`DecorationService`),
  Xt = class {
    constructor(e, t, n) {
      ((this._bufferService = e),
        (this._optionsService = t),
        (this._oscLinkService = n));
    }
    provideLinks(e, t) {
      let n = this._bufferService.buffer.lines.get(e - 1);
      if (!n) {
        t(void 0);
        return;
      }
      let r = [],
        i = this._optionsService.rawOptions.linkHandler,
        a = new Pt(),
        o = n.getTrimmedLength(),
        s = -1,
        c = -1,
        l = !1;
      for (let t = 0; t < o; t++)
        if (!(c === -1 && !n.hasContent(t))) {
          if ((n.loadCell(t, a), a.hasExtendedAttrs() && a.extended.urlId))
            if (c === -1) {
              ((c = t), (s = a.extended.urlId));
              continue;
            } else l = a.extended.urlId !== s;
          else c !== -1 && (l = !0);
          if (l || (c !== -1 && t === o - 1)) {
            let n = this._oscLinkService.getLinkData(s)?.uri;
            if (n) {
              let a = {
                  start: { x: c + 1, y: e },
                  end: { x: t + (!l && t === o - 1 ? 1 : 0), y: e },
                },
                s = !1;
              if (!i?.allowNonHttpProtocols)
                try {
                  let e = new URL(n);
                  [`http:`, `https:`].includes(e.protocol) || (s = !0);
                } catch {
                  s = !0;
                }
              s ||
                r.push({
                  text: n,
                  range: a,
                  activate: (e, t) => (i ? i.activate(e, t, a) : Zt(e, t)),
                  hover: (e, t) => i?.hover?.(e, t, a),
                  leave: (e, t) => i?.leave?.(e, t, a),
                });
            }
            ((l = !1),
              a.hasExtendedAttrs() && a.extended.urlId
                ? ((c = t), (s = a.extended.urlId))
                : ((c = -1), (s = -1)));
          }
        }
      t(r);
    }
  };
Xt = j([M(0, Bt), M(1, Kt), M(2, qt)], Xt);
function Zt(e, t) {
  if (
    confirm(`Do you want to navigate to ${t}?

WARNING: This link could potentially be dangerous`)
  ) {
    let e = window.open();
    if (e) {
      try {
        e.opener = null;
      } catch {}
      e.location.href = t;
    } else console.warn(`Opening link blocked as opener could not be cleared`);
  }
}
var Qt = N(`CharSizeService`),
  $t = N(`CoreBrowserService`),
  en = N(`MouseService`),
  tn = N(`RenderService`),
  nn = N(`SelectionService`),
  rn = N(`CharacterJoinerService`),
  an = N(`ThemeService`),
  on = N(`LinkProviderService`),
  sn = new (class {
    constructor() {
      ((this.listeners = []),
        (this.unexpectedErrorHandler = function (e) {
          setTimeout(() => {
            throw e.stack
              ? pn.isErrorNoTelemetry(e)
                ? new pn(
                    e.message +
                      `

` +
                      e.stack,
                  )
                : Error(
                    e.message +
                      `

` +
                      e.stack,
                  )
              : e;
          }, 0);
        }));
    }
    addListener(e) {
      return (
        this.listeners.push(e),
        () => {
          this._removeListener(e);
        }
      );
    }
    emit(e) {
      this.listeners.forEach((t) => {
        t(e);
      });
    }
    _removeListener(e) {
      this.listeners.splice(this.listeners.indexOf(e), 1);
    }
    setUnexpectedErrorHandler(e) {
      this.unexpectedErrorHandler = e;
    }
    getUnexpectedErrorHandler() {
      return this.unexpectedErrorHandler;
    }
    onUnexpectedError(e) {
      (this.unexpectedErrorHandler(e), this.emit(e));
    }
    onUnexpectedExternalError(e) {
      this.unexpectedErrorHandler(e);
    }
  })();
function cn(e) {
  un(e) || sn.onUnexpectedError(e);
}
var ln = `Canceled`;
function un(e) {
  return e instanceof dn
    ? !0
    : e instanceof Error && e.name === ln && e.message === ln;
}
var dn = class extends Error {
  constructor() {
    (super(ln), (this.name = this.message));
  }
};
function fn(e) {
  return Error(e ? `Illegal argument: ${e}` : `Illegal argument`);
}
var pn = class e extends Error {
    constructor(e) {
      (super(e), (this.name = `CodeExpectedError`));
    }
    static fromError(t) {
      if (t instanceof e) return t;
      let n = new e();
      return ((n.message = t.message), (n.stack = t.stack), n);
    }
    static isErrorNoTelemetry(e) {
      return e.name === `CodeExpectedError`;
    }
  },
  mn = class e extends Error {
    constructor(t) {
      (super(t || `An unexpected bug occurred.`),
        Object.setPrototypeOf(this, e.prototype));
    }
  };
function hn(e, t, n = 0, r = e.length) {
  let i = n,
    a = r;
  for (; i < a; ) {
    let n = Math.floor((i + a) / 2);
    t(e[n]) ? (i = n + 1) : (a = n);
  }
  return i - 1;
}
var gn = class e {
  constructor(e) {
    ((this._array = e), (this._findLastMonotonousLastIdx = 0));
  }
  findLastMonotonous(t) {
    if (e.assertInvariants) {
      if (this._prevFindLastPredicate) {
        for (let e of this._array)
          if (this._prevFindLastPredicate(e) && !t(e))
            throw Error(
              `MonotonousArray: current predicate must be weaker than (or equal to) the previous predicate.`,
            );
      }
      this._prevFindLastPredicate = t;
    }
    let n = hn(this._array, t, this._findLastMonotonousLastIdx);
    return (
      (this._findLastMonotonousLastIdx = n + 1),
      n === -1 ? void 0 : this._array[n]
    );
  }
};
gn.assertInvariants = !1;
function _n(e, t = 0) {
  return e[e.length - (1 + t)];
}
var vn;
((e) => {
  function t(e) {
    return e < 0;
  }
  e.isLessThan = t;
  function n(e) {
    return e <= 0;
  }
  e.isLessThanOrEqual = n;
  function r(e) {
    return e > 0;
  }
  e.isGreaterThan = r;
  function i(e) {
    return e === 0;
  }
  ((e.isNeitherLessOrGreaterThan = i),
    (e.greaterThan = 1),
    (e.lessThan = -1),
    (e.neitherLessOrGreaterThan = 0));
})((vn ||= {}));
function yn(e, t) {
  return (n, r) => t(e(n), e(r));
}
var bn = (e, t) => e - t,
  xn = class e {
    constructor(e) {
      this.iterate = e;
    }
    forEach(e) {
      this.iterate((t) => (e(t), !0));
    }
    toArray() {
      let e = [];
      return (this.iterate((t) => (e.push(t), !0)), e);
    }
    filter(t) {
      return new e((e) => this.iterate((n) => (t(n) ? e(n) : !0)));
    }
    map(t) {
      return new e((e) => this.iterate((n) => e(t(n))));
    }
    some(e) {
      let t = !1;
      return (this.iterate((n) => ((t = e(n)), !t)), t);
    }
    findFirst(e) {
      let t;
      return (this.iterate((n) => (e(n) ? ((t = n), !1) : !0)), t);
    }
    findLast(e) {
      let t;
      return (this.iterate((n) => (e(n) && (t = n), !0)), t);
    }
    findLastMaxBy(e) {
      let t,
        n = !0;
      return (
        this.iterate(
          (r) => ((n || vn.isGreaterThan(e(r, t))) && ((n = !1), (t = r)), !0),
        ),
        t
      );
    }
  };
xn.empty = new xn((e) => {});
function Sn(e, t) {
  let n = Object.create(null);
  for (let r of e) {
    let e = t(r),
      i = n[e];
    ((i ||= n[e] = []), i.push(r));
  }
  return n;
}
var Cn = class {
  constructor() {
    this.map = new Map();
  }
  add(e, t) {
    let n = this.map.get(e);
    (n || ((n = new Set()), this.map.set(e, n)), n.add(t));
  }
  delete(e, t) {
    let n = this.map.get(e);
    n && (n.delete(t), n.size === 0 && this.map.delete(e));
  }
  forEach(e, t) {
    let n = this.map.get(e);
    n && n.forEach(t);
  }
  get(e) {
    return this.map.get(e) || new Set();
  }
};
function wn(e, t) {
  let n = this,
    r = !1,
    i;
  return function () {
    if (r) return i;
    if (((r = !0), t))
      try {
        i = e.apply(n, arguments);
      } finally {
        t();
      }
    else i = e.apply(n, arguments);
    return i;
  };
}
var Tn;
((e) => {
  function t(e) {
    return e && typeof e == `object` && typeof e[Symbol.iterator] == `function`;
  }
  e.is = t;
  let n = Object.freeze([]);
  function r() {
    return n;
  }
  e.empty = r;
  function* i(e) {
    yield e;
  }
  e.single = i;
  function a(e) {
    return t(e) ? e : i(e);
  }
  e.wrap = a;
  function o(e) {
    return e || n;
  }
  e.from = o;
  function* s(e) {
    for (let t = e.length - 1; t >= 0; t--) yield e[t];
  }
  e.reverse = s;
  function c(e) {
    return !e || e[Symbol.iterator]().next().done === !0;
  }
  e.isEmpty = c;
  function l(e) {
    return e[Symbol.iterator]().next().value;
  }
  e.first = l;
  function u(e, t) {
    let n = 0;
    for (let r of e) if (t(r, n++)) return !0;
    return !1;
  }
  e.some = u;
  function d(e, t) {
    for (let n of e) if (t(n)) return n;
  }
  e.find = d;
  function* f(e, t) {
    for (let n of e) t(n) && (yield n);
  }
  e.filter = f;
  function* p(e, t) {
    let n = 0;
    for (let r of e) yield t(r, n++);
  }
  e.map = p;
  function* m(e, t) {
    let n = 0;
    for (let r of e) yield* t(r, n++);
  }
  e.flatMap = m;
  function* h(...e) {
    for (let t of e) yield* t;
  }
  e.concat = h;
  function g(e, t, n) {
    let r = n;
    for (let n of e) r = t(r, n);
    return r;
  }
  e.reduce = g;
  function* _(e, t, n = e.length) {
    for (
      t < 0 && (t += e.length),
        n < 0 ? (n += e.length) : n > e.length && (n = e.length);
      t < n;
      t++
    )
      yield e[t];
  }
  e.slice = _;
  function v(t, n = 1 / 0) {
    let r = [];
    if (n === 0) return [r, t];
    let i = t[Symbol.iterator]();
    for (let t = 0; t < n; t++) {
      let t = i.next();
      if (t.done) return [r, e.empty()];
      r.push(t.value);
    }
    return [
      r,
      {
        [Symbol.iterator]() {
          return i;
        },
      },
    ];
  }
  e.consume = v;
  async function y(e) {
    let t = [];
    for await (let n of e) t.push(n);
    return Promise.resolve(t);
  }
  e.asyncToArray = y;
})((Tn ||= {}));
var En = !1,
  Dn = null,
  On = class e {
    constructor() {
      this.livingDisposables = new Map();
    }
    getDisposableData(t) {
      let n = this.livingDisposables.get(t);
      return (
        n ||
          ((n = {
            parent: null,
            source: null,
            isSingleton: !1,
            value: t,
            idx: e.idx++,
          }),
          this.livingDisposables.set(t, n)),
        n
      );
    }
    trackDisposable(e) {
      let t = this.getDisposableData(e);
      t.source ||= Error().stack;
    }
    setParent(e, t) {
      let n = this.getDisposableData(e);
      n.parent = t;
    }
    markAsDisposed(e) {
      this.livingDisposables.delete(e);
    }
    markAsSingleton(e) {
      this.getDisposableData(e).isSingleton = !0;
    }
    getRootParent(e, t) {
      let n = t.get(e);
      if (n) return n;
      let r = e.parent
        ? this.getRootParent(this.getDisposableData(e.parent), t)
        : e;
      return (t.set(e, r), r);
    }
    getTrackedDisposables() {
      let e = new Map();
      return [...this.livingDisposables.entries()]
        .filter(
          ([, t]) => t.source !== null && !this.getRootParent(t, e).isSingleton,
        )
        .flatMap(([e]) => e);
    }
    computeLeakingDisposables(e = 10, t) {
      let n;
      if (t) n = t;
      else {
        let e = new Map(),
          t = [...this.livingDisposables.values()].filter(
            (t) => t.source !== null && !this.getRootParent(t, e).isSingleton,
          );
        if (t.length === 0) return;
        let r = new Set(t.map((e) => e.value));
        if (
          ((n = t.filter((e) => !(e.parent && r.has(e.parent)))),
          n.length === 0)
        )
          throw Error(`There are cyclic diposable chains!`);
      }
      if (!n) return;
      function r(e) {
        function t(e, t) {
          for (
            ;
            e.length > 0 &&
            t.some((t) => (typeof t == `string` ? t === e[0] : e[0].match(t)));
          )
            e.shift();
        }
        let n = e.source
          .split(
            `
`,
          )
          .map((e) => e.trim().replace(`at `, ``))
          .filter((e) => e !== ``);
        return (
          t(n, [
            `Error`,
            /^trackDisposable \(.*\)$/,
            /^DisposableTracker.trackDisposable \(.*\)$/,
          ]),
          n.reverse()
        );
      }
      let i = new Cn();
      for (let e of n) {
        let t = r(e);
        for (let n = 0; n <= t.length; n++)
          i.add(
            t.slice(0, n).join(`
`),
            e,
          );
      }
      n.sort(yn((e) => e.idx, bn));
      let a = ``,
        o = 0;
      for (let t of n.slice(0, e)) {
        o++;
        let e = r(t),
          s = [];
        for (let t = 0; t < e.length; t++) {
          let a = e[t];
          a = `(shared with ${
            i.get(
              e.slice(0, t + 1).join(`
`),
            ).size
          }/${n.length} leaks) at ${a}`;
          let o = Sn(
            [
              ...i.get(
                e.slice(0, t).join(`
`),
              ),
            ].map((e) => r(e)[t]),
            (e) => e,
          );
          delete o[e[t]];
          for (let [e, t] of Object.entries(o))
            s.unshift(
              `    - stacktraces of ${t.length} other leaks continue with ${e}`,
            );
          s.unshift(a);
        }
        a += `


==================== Leaking disposable ${o}/${n.length}: ${t.value.constructor.name} ====================
${s.join(`
`)}
============================================================

`;
      }
      return (
        n.length > e &&
          (a += `


... and ${n.length - e} more leaking disposables

`),
        { leaks: n, details: a }
      );
    }
  };
On.idx = 0;
function kn(e) {
  Dn = e;
}
if (En) {
  let e = `__is_disposable_tracked__`;
  kn(
    new (class {
      trackDisposable(t) {
        let n = Error(`Potentially leaked disposable`).stack;
        setTimeout(() => {
          t[e] || console.log(n);
        }, 3e3);
      }
      setParent(t, n) {
        if (t && t !== F.None)
          try {
            t[e] = !0;
          } catch {}
      }
      markAsDisposed(t) {
        if (t && t !== F.None)
          try {
            t[e] = !0;
          } catch {}
      }
      markAsSingleton(e) {}
    })(),
  );
}
function An(e) {
  return (Dn?.trackDisposable(e), e);
}
function jn(e) {
  Dn?.markAsDisposed(e);
}
function Mn(e, t) {
  Dn?.setParent(e, t);
}
function Nn(e, t) {
  if (Dn) for (let n of e) Dn.setParent(n, t);
}
function Pn(e) {
  return (Dn?.markAsSingleton(e), e);
}
function Fn(e) {
  if (Tn.is(e)) {
    let t = [];
    for (let n of e)
      if (n)
        try {
          n.dispose();
        } catch (e) {
          t.push(e);
        }
    if (t.length === 1) throw t[0];
    if (t.length > 1)
      throw AggregateError(t, `Encountered errors while disposing of store`);
    return Array.isArray(e) ? [] : e;
  } else if (e) return (e.dispose(), e);
}
function In(...e) {
  let t = P(() => Fn(e));
  return (Nn(e, t), t);
}
function P(e) {
  let t = An({
    dispose: wn(() => {
      (jn(t), e());
    }),
  });
  return t;
}
var Ln = class e {
  constructor() {
    ((this._toDispose = new Set()), (this._isDisposed = !1), An(this));
  }
  dispose() {
    this._isDisposed || (jn(this), (this._isDisposed = !0), this.clear());
  }
  get isDisposed() {
    return this._isDisposed;
  }
  clear() {
    if (this._toDispose.size !== 0)
      try {
        Fn(this._toDispose);
      } finally {
        this._toDispose.clear();
      }
  }
  add(t) {
    if (!t) return t;
    if (t === this) throw Error(`Cannot register a disposable on itself!`);
    return (
      Mn(t, this),
      this._isDisposed
        ? e.DISABLE_DISPOSED_WARNING ||
          console.warn(
            Error(
              `Trying to add a disposable to a DisposableStore that has already been disposed of. The added object will be leaked!`,
            ).stack,
          )
        : this._toDispose.add(t),
      t
    );
  }
  delete(e) {
    if (e) {
      if (e === this) throw Error(`Cannot dispose a disposable on itself!`);
      (this._toDispose.delete(e), e.dispose());
    }
  }
  deleteAndLeak(e) {
    e && this._toDispose.has(e) && (this._toDispose.delete(e), Mn(e, null));
  }
};
Ln.DISABLE_DISPOSED_WARNING = !1;
var Rn = Ln,
  F = class {
    constructor() {
      ((this._store = new Rn()), An(this), Mn(this._store, this));
    }
    dispose() {
      (jn(this), this._store.dispose());
    }
    _register(e) {
      if (e === this) throw Error(`Cannot register a disposable on itself!`);
      return this._store.add(e);
    }
  };
F.None = Object.freeze({ dispose() {} });
var zn = class {
    constructor() {
      ((this._isDisposed = !1), An(this));
    }
    get value() {
      return this._isDisposed ? void 0 : this._value;
    }
    set value(e) {
      this._isDisposed ||
        e === this._value ||
        (this._value?.dispose(), e && Mn(e, this), (this._value = e));
    }
    clear() {
      this.value = void 0;
    }
    dispose() {
      ((this._isDisposed = !0),
        jn(this),
        this._value?.dispose(),
        (this._value = void 0));
    }
    clearAndLeak() {
      let e = this._value;
      return ((this._value = void 0), e && Mn(e, null), e);
    }
  },
  Bn = typeof window == `object` ? window : globalThis,
  Vn = class e {
    constructor(t) {
      ((this.element = t),
        (this.next = e.Undefined),
        (this.prev = e.Undefined));
    }
  };
Vn.Undefined = new Vn(void 0);
var I = Vn,
  Hn = class {
    constructor() {
      ((this._first = I.Undefined),
        (this._last = I.Undefined),
        (this._size = 0));
    }
    get size() {
      return this._size;
    }
    isEmpty() {
      return this._first === I.Undefined;
    }
    clear() {
      let e = this._first;
      for (; e !== I.Undefined; ) {
        let t = e.next;
        ((e.prev = I.Undefined), (e.next = I.Undefined), (e = t));
      }
      ((this._first = I.Undefined),
        (this._last = I.Undefined),
        (this._size = 0));
    }
    unshift(e) {
      return this._insert(e, !1);
    }
    push(e) {
      return this._insert(e, !0);
    }
    _insert(e, t) {
      let n = new I(e);
      if (this._first === I.Undefined) ((this._first = n), (this._last = n));
      else if (t) {
        let e = this._last;
        ((this._last = n), (n.prev = e), (e.next = n));
      } else {
        let e = this._first;
        ((this._first = n), (n.next = e), (e.prev = n));
      }
      this._size += 1;
      let r = !1;
      return () => {
        r || ((r = !0), this._remove(n));
      };
    }
    shift() {
      if (this._first !== I.Undefined) {
        let e = this._first.element;
        return (this._remove(this._first), e);
      }
    }
    pop() {
      if (this._last !== I.Undefined) {
        let e = this._last.element;
        return (this._remove(this._last), e);
      }
    }
    _remove(e) {
      if (e.prev !== I.Undefined && e.next !== I.Undefined) {
        let t = e.prev;
        ((t.next = e.next), (e.next.prev = t));
      } else
        e.prev === I.Undefined && e.next === I.Undefined
          ? ((this._first = I.Undefined), (this._last = I.Undefined))
          : e.next === I.Undefined
            ? ((this._last = this._last.prev), (this._last.next = I.Undefined))
            : e.prev === I.Undefined &&
              ((this._first = this._first.next),
              (this._first.prev = I.Undefined));
      --this._size;
    }
    *[Symbol.iterator]() {
      let e = this._first;
      for (; e !== I.Undefined; ) (yield e.element, (e = e.next));
    }
  },
  Un =
    globalThis.performance && typeof globalThis.performance.now == `function`,
  Wn = class e {
    static create(t) {
      return new e(t);
    }
    constructor(e) {
      ((this._now =
        Un && e === !1
          ? Date.now
          : globalThis.performance.now.bind(globalThis.performance)),
        (this._startTime = this._now()),
        (this._stopTime = -1));
    }
    stop() {
      this._stopTime = this._now();
    }
    reset() {
      ((this._startTime = this._now()), (this._stopTime = -1));
    }
    elapsed() {
      return this._stopTime === -1
        ? this._now() - this._startTime
        : this._stopTime - this._startTime;
    }
  },
  Gn = !1,
  Kn = !1,
  qn = !1,
  Jn;
((e) => {
  e.None = () => F.None;
  function t(e) {
    if (qn) {
      let { onDidAddListener: t } = e,
        n = er.create(),
        r = 0;
      e.onDidAddListener = () => {
        (++r === 2 &&
          (console.warn(
            `snapshotted emitter LIKELY used public and SHOULD HAVE BEEN created with DisposableStore. snapshotted here`,
          ),
          n.print()),
          t?.());
      };
    }
  }
  function n(e, t) {
    return f(e, () => {}, 0, void 0, !0, void 0, t);
  }
  e.defer = n;
  function r(e) {
    return (t, n = null, r) => {
      let i = !1,
        a;
      return (
        (a = e(
          (e) => {
            if (!i) return (a ? a.dispose() : (i = !0), t.call(n, e));
          },
          null,
          r,
        )),
        i && a.dispose(),
        a
      );
    };
  }
  e.once = r;
  function i(e, t, n) {
    return u((n, r = null, i) => e((e) => n.call(r, t(e)), null, i), n);
  }
  e.map = i;
  function a(e, t, n) {
    return u(
      (n, r = null, i) =>
        e(
          (e) => {
            (t(e), n.call(r, e));
          },
          null,
          i,
        ),
      n,
    );
  }
  e.forEach = a;
  function o(e, t, n) {
    return u((n, r = null, i) => e((e) => t(e) && n.call(r, e), null, i), n);
  }
  e.filter = o;
  function s(e) {
    return e;
  }
  e.signal = s;
  function c(...e) {
    return (t, n = null, r) =>
      d(In(...e.map((e) => e((e) => t.call(n, e)))), r);
  }
  e.any = c;
  function l(e, t, n, r) {
    let a = n;
    return i(e, (e) => ((a = t(a, e)), a), r);
  }
  e.reduce = l;
  function u(e, n) {
    let r,
      i = {
        onWillAddFirstListener() {
          r = e(a.fire, a);
        },
        onDidRemoveLastListener() {
          r?.dispose();
        },
      };
    n || t(i);
    let a = new L(i);
    return (n?.add(a), a.event);
  }
  function d(e, t) {
    return (t instanceof Array ? t.push(e) : t && t.add(e), e);
  }
  function f(e, n, r = 100, i = !1, a = !1, o, s) {
    let c,
      l,
      u,
      d = 0,
      f,
      p = {
        leakWarningThreshold: o,
        onWillAddFirstListener() {
          c = e((e) => {
            (d++,
              (l = n(l, e)),
              i && !u && (m.fire(l), (l = void 0)),
              (f = () => {
                let e = l;
                ((l = void 0),
                  (u = void 0),
                  (!i || d > 1) && m.fire(e),
                  (d = 0));
              }),
              typeof r == `number`
                ? (clearTimeout(u), (u = setTimeout(f, r)))
                : u === void 0 && ((u = 0), queueMicrotask(f)));
          });
        },
        onWillRemoveListener() {
          a && d > 0 && f?.();
        },
        onDidRemoveLastListener() {
          ((f = void 0), c.dispose());
        },
      };
    s || t(p);
    let m = new L(p);
    return (s?.add(m), m.event);
  }
  e.debounce = f;
  function p(t, n = 0, r) {
    return e.debounce(
      t,
      (e, t) => (e ? (e.push(t), e) : [t]),
      n,
      void 0,
      !0,
      void 0,
      r,
    );
  }
  e.accumulate = p;
  function m(e, t = (e, t) => e === t, n) {
    let r = !0,
      i;
    return o(
      e,
      (e) => {
        let n = r || !t(e, i);
        return ((r = !1), (i = e), n);
      },
      n,
    );
  }
  e.latch = m;
  function h(t, n, r) {
    return [e.filter(t, n, r), e.filter(t, (e) => !n(e), r)];
  }
  e.split = h;
  function g(e, t = !1, n = [], r) {
    let i = n.slice(),
      a = e((e) => {
        i ? i.push(e) : s.fire(e);
      });
    r && r.add(a);
    let o = () => {
        (i?.forEach((e) => s.fire(e)), (i = null));
      },
      s = new L({
        onWillAddFirstListener() {
          a || ((a = e((e) => s.fire(e))), r && r.add(a));
        },
        onDidAddFirstListener() {
          i && (t ? setTimeout(o) : o());
        },
        onDidRemoveLastListener() {
          (a && a.dispose(), (a = null));
        },
      });
    return (r && r.add(s), s.event);
  }
  e.buffer = g;
  function _(e, t) {
    return (n, r, i) => {
      let a = t(new y());
      return e(
        function (e) {
          let t = a.evaluate(e);
          t !== v && n.call(r, t);
        },
        void 0,
        i,
      );
    };
  }
  e.chain = _;
  let v = Symbol(`HaltChainable`);
  class y {
    constructor() {
      this.steps = [];
    }
    map(e) {
      return (this.steps.push(e), this);
    }
    forEach(e) {
      return (this.steps.push((t) => (e(t), t)), this);
    }
    filter(e) {
      return (this.steps.push((t) => (e(t) ? t : v)), this);
    }
    reduce(e, t) {
      let n = t;
      return (this.steps.push((t) => ((n = e(n, t)), n)), this);
    }
    latch(e = (e, t) => e === t) {
      let t = !0,
        n;
      return (
        this.steps.push((r) => {
          let i = t || !e(r, n);
          return ((t = !1), (n = r), i ? r : v);
        }),
        this
      );
    }
    evaluate(e) {
      for (let t of this.steps) if (((e = t(e)), e === v)) break;
      return e;
    }
  }
  function b(e, t, n = (e) => e) {
    let r = (...e) => i.fire(n(...e)),
      i = new L({
        onWillAddFirstListener: () => e.on(t, r),
        onDidRemoveLastListener: () => e.removeListener(t, r),
      });
    return i.event;
  }
  e.fromNodeEventEmitter = b;
  function x(e, t, n = (e) => e) {
    let r = (...e) => i.fire(n(...e)),
      i = new L({
        onWillAddFirstListener: () => e.addEventListener(t, r),
        onDidRemoveLastListener: () => e.removeEventListener(t, r),
      });
    return i.event;
  }
  e.fromDOMEventEmitter = x;
  function ee(e) {
    return new Promise((t) => r(e)(t));
  }
  e.toPromise = ee;
  function S(e) {
    let t = new L();
    return (
      e
        .then(
          (e) => {
            t.fire(e);
          },
          () => {
            t.fire(void 0);
          },
        )
        .finally(() => {
          t.dispose();
        }),
      t.event
    );
  }
  e.fromPromise = S;
  function C(e, t) {
    return e((e) => t.fire(e));
  }
  e.forward = C;
  function te(e, t, n) {
    return (t(n), e((e) => t(e)));
  }
  e.runAndSubscribe = te;
  class ne {
    constructor(e, n) {
      ((this._observable = e), (this._counter = 0), (this._hasChanged = !1));
      let r = {
        onWillAddFirstListener: () => {
          e.addObserver(this);
        },
        onDidRemoveLastListener: () => {
          e.removeObserver(this);
        },
      };
      (n || t(r), (this.emitter = new L(r)), n && n.add(this.emitter));
    }
    beginUpdate(e) {
      this._counter++;
    }
    handlePossibleChange(e) {}
    handleChange(e, t) {
      this._hasChanged = !0;
    }
    endUpdate(e) {
      (this._counter--,
        this._counter === 0 &&
          (this._observable.reportChanges(),
          this._hasChanged &&
            ((this._hasChanged = !1),
            this.emitter.fire(this._observable.get()))));
    }
  }
  function w(e, t) {
    return new ne(e, t).emitter.event;
  }
  e.fromObservable = w;
  function re(e) {
    return (t, n, r) => {
      let i = 0,
        a = !1,
        o = {
          beginUpdate() {
            i++;
          },
          endUpdate() {
            (i--, i === 0 && (e.reportChanges(), a && ((a = !1), t.call(n))));
          },
          handlePossibleChange() {},
          handleChange() {
            a = !0;
          },
        };
      (e.addObserver(o), e.reportChanges());
      let s = {
        dispose() {
          e.removeObserver(o);
        },
      };
      return (r instanceof Rn ? r.add(s) : Array.isArray(r) && r.push(s), s);
    };
  }
  e.fromObservableLight = re;
})((Jn ||= {}));
var Yn = class e {
  constructor(t) {
    ((this.listenerCount = 0),
      (this.invocationCount = 0),
      (this.elapsedOverall = 0),
      (this.durations = []),
      (this.name = `${t}_${e._idPool++}`),
      e.all.add(this));
  }
  start(e) {
    ((this._stopWatch = new Wn()), (this.listenerCount = e));
  }
  stop() {
    if (this._stopWatch) {
      let e = this._stopWatch.elapsed();
      (this.durations.push(e),
        (this.elapsedOverall += e),
        (this.invocationCount += 1),
        (this._stopWatch = void 0));
    }
  }
};
((Yn.all = new Set()), (Yn._idPool = 0));
var Xn = Yn,
  Zn = -1,
  Qn = class e {
    constructor(t, n, r = (e._idPool++).toString(16).padStart(3, `0`)) {
      ((this._errorHandler = t),
        (this.threshold = n),
        (this.name = r),
        (this._warnCountdown = 0));
    }
    dispose() {
      this._stacks?.clear();
    }
    check(e, t) {
      let n = this.threshold;
      if (n <= 0 || t < n) return;
      this._stacks ||= new Map();
      let r = this._stacks.get(e.value) || 0;
      if (
        (this._stacks.set(e.value, r + 1),
        --this._warnCountdown,
        this._warnCountdown <= 0)
      ) {
        this._warnCountdown = n * 0.5;
        let [e, r] = this.getMostFrequentStack(),
          i = `[${this.name}] potential listener LEAK detected, having ${t} listeners already. MOST frequent listener (${r}):`;
        (console.warn(i), console.warn(e));
        let a = new tr(i, e);
        this._errorHandler(a);
      }
      return () => {
        let t = this._stacks.get(e.value) || 0;
        this._stacks.set(e.value, t - 1);
      };
    }
    getMostFrequentStack() {
      if (!this._stacks) return;
      let e,
        t = 0;
      for (let [n, r] of this._stacks) (!e || t < r) && ((e = [n, r]), (t = r));
      return e;
    }
  };
Qn._idPool = 1;
var $n = Qn,
  er = class e {
    constructor(e) {
      this.value = e;
    }
    static create() {
      return new e(Error().stack ?? ``);
    }
    print() {
      console.warn(
        this.value
          .split(
            `
`,
          )
          .slice(2).join(`
`),
      );
    }
  },
  tr = class extends Error {
    constructor(e, t) {
      (super(e), (this.name = `ListenerLeakError`), (this.stack = t));
    }
  },
  nr = class extends Error {
    constructor(e, t) {
      (super(e), (this.name = `ListenerRefusalError`), (this.stack = t));
    }
  },
  rr = 0,
  ir = class {
    constructor(e) {
      ((this.value = e), (this.id = rr++));
    }
  },
  ar = 2,
  or = (e, t) => {
    if (e instanceof ir) t(e);
    else
      for (let n = 0; n < e.length; n++) {
        let r = e[n];
        r && t(r);
      }
  },
  sr;
if (Gn) {
  let e = [];
  (setInterval(() => {
    e.length !== 0 &&
      (console.warn(
        `[LEAKING LISTENERS] GC'ed these listeners that were NOT yet disposed:`,
      ),
      console.warn(
        e.join(`
`),
      ),
      (e.length = 0));
  }, 3e3),
    (sr = new FinalizationRegistry((t) => {
      typeof t == `string` && e.push(t);
    })));
}
var L = class {
    constructor(e) {
      ((this._size = 0),
        (this._options = e),
        (this._leakageMon =
          Zn > 0 || this._options?.leakWarningThreshold
            ? new $n(
                e?.onListenerError ?? cn,
                this._options?.leakWarningThreshold ?? Zn,
              )
            : void 0),
        (this._perfMon = this._options?._profName
          ? new Xn(this._options._profName)
          : void 0),
        (this._deliveryQueue = this._options?.deliveryQueue));
    }
    dispose() {
      if (!this._disposed) {
        if (
          ((this._disposed = !0),
          this._deliveryQueue?.current === this && this._deliveryQueue.reset(),
          this._listeners)
        ) {
          if (Kn) {
            let e = this._listeners;
            queueMicrotask(() => {
              or(e, (e) => e.stack?.print());
            });
          }
          ((this._listeners = void 0), (this._size = 0));
        }
        (this._options?.onDidRemoveLastListener?.(),
          this._leakageMon?.dispose());
      }
    }
    get event() {
      return (
        (this._event ??= (e, t, n) => {
          if (
            this._leakageMon &&
            this._size > this._leakageMon.threshold ** 2
          ) {
            let e = `[${this._leakageMon.name}] REFUSES to accept new listeners because it exceeded its threshold by far (${this._size} vs ${this._leakageMon.threshold})`;
            console.warn(e);
            let t = this._leakageMon.getMostFrequentStack() ?? [
                `UNKNOWN stack`,
                -1,
              ],
              n = new nr(
                `${e}. HINT: Stack shows most frequent listener (${t[1]}-times)`,
                t[0],
              );
            return ((this._options?.onListenerError || cn)(n), F.None);
          }
          if (this._disposed) return F.None;
          t && (e = e.bind(t));
          let r = new ir(e),
            i;
          (this._leakageMon &&
            this._size >= Math.ceil(this._leakageMon.threshold * 0.2) &&
            ((r.stack = er.create()),
            (i = this._leakageMon.check(r.stack, this._size + 1))),
            Kn && (r.stack = er.create()),
            this._listeners
              ? this._listeners instanceof ir
                ? ((this._deliveryQueue ??= new cr()),
                  (this._listeners = [this._listeners, r]))
                : this._listeners.push(r)
              : (this._options?.onWillAddFirstListener?.(this),
                (this._listeners = r),
                this._options?.onDidAddFirstListener?.(this)),
            this._size++);
          let a = P(() => {
            (sr?.unregister(a), i?.(), this._removeListener(r));
          });
          if (
            (n instanceof Rn ? n.add(a) : Array.isArray(n) && n.push(a), sr)
          ) {
            let e = Error()
                .stack.split(
                  `
`,
                )
                .slice(2, 3)
                .join(
                  `
`,
                )
                .trim(),
              t = /(file:|vscode-file:\/\/vscode-app)?(\/[^:]*:\d+:\d+)/.exec(
                e,
              );
            sr.register(a, t?.[2] ?? e, a);
          }
          return a;
        }),
        this._event
      );
    }
    _removeListener(e) {
      if ((this._options?.onWillRemoveListener?.(this), !this._listeners))
        return;
      if (this._size === 1) {
        ((this._listeners = void 0),
          this._options?.onDidRemoveLastListener?.(this),
          (this._size = 0));
        return;
      }
      let t = this._listeners,
        n = t.indexOf(e);
      if (n === -1)
        throw (
          console.log(`disposed?`, this._disposed),
          console.log(`size?`, this._size),
          console.log(`arr?`, JSON.stringify(this._listeners)),
          Error(`Attempted to dispose unknown listener`)
        );
      (this._size--, (t[n] = void 0));
      let r = this._deliveryQueue.current === this;
      if (this._size * ar <= t.length) {
        let e = 0;
        for (let n = 0; n < t.length; n++)
          t[n]
            ? (t[e++] = t[n])
            : r &&
              (this._deliveryQueue.end--,
              e < this._deliveryQueue.i && this._deliveryQueue.i--);
        t.length = e;
      }
    }
    _deliver(e, t) {
      if (!e) return;
      let n = this._options?.onListenerError || cn;
      if (!n) {
        e.value(t);
        return;
      }
      try {
        e.value(t);
      } catch (e) {
        n(e);
      }
    }
    _deliverQueue(e) {
      let t = e.current._listeners;
      for (; e.i < e.end; ) this._deliver(t[e.i++], e.value);
      e.reset();
    }
    fire(e) {
      if (
        (this._deliveryQueue?.current &&
          (this._deliverQueue(this._deliveryQueue), this._perfMon?.stop()),
        this._perfMon?.start(this._size),
        this._listeners)
      )
        if (this._listeners instanceof ir) this._deliver(this._listeners, e);
        else {
          let t = this._deliveryQueue;
          (t.enqueue(this, e, this._listeners.length), this._deliverQueue(t));
        }
      this._perfMon?.stop();
    }
    hasListeners() {
      return this._size > 0;
    }
  },
  cr = class {
    constructor() {
      ((this.i = -1), (this.end = 0));
    }
    enqueue(e, t, n) {
      ((this.i = 0), (this.end = n), (this.current = e), (this.value = t));
    }
    reset() {
      ((this.i = this.end), (this.current = void 0), (this.value = void 0));
    }
  },
  lr = class {
    constructor() {
      ((this.mapWindowIdToZoomLevel = new Map()),
        (this._onDidChangeZoomLevel = new L()),
        (this.onDidChangeZoomLevel = this._onDidChangeZoomLevel.event),
        (this.mapWindowIdToZoomFactor = new Map()),
        (this._onDidChangeFullscreen = new L()),
        (this.onDidChangeFullscreen = this._onDidChangeFullscreen.event),
        (this.mapWindowIdToFullScreen = new Map()));
    }
    getZoomLevel(e) {
      return this.mapWindowIdToZoomLevel.get(this.getWindowId(e)) ?? 0;
    }
    setZoomLevel(e, t) {
      if (this.getZoomLevel(t) === e) return;
      let n = this.getWindowId(t);
      (this.mapWindowIdToZoomLevel.set(n, e),
        this._onDidChangeZoomLevel.fire(n));
    }
    getZoomFactor(e) {
      return this.mapWindowIdToZoomFactor.get(this.getWindowId(e)) ?? 1;
    }
    setZoomFactor(e, t) {
      this.mapWindowIdToZoomFactor.set(this.getWindowId(t), e);
    }
    setFullscreen(e, t) {
      if (this.isFullscreen(t) === e) return;
      let n = this.getWindowId(t);
      (this.mapWindowIdToFullScreen.set(n, e),
        this._onDidChangeFullscreen.fire(n));
    }
    isFullscreen(e) {
      return !!this.mapWindowIdToFullScreen.get(this.getWindowId(e));
    }
    getWindowId(e) {
      return e.vscodeWindowId;
    }
  };
lr.INSTANCE = new lr();
var ur = lr;
function dr(e, t, n) {
  (typeof t == `string` && (t = e.matchMedia(t)),
    t.addEventListener(`change`, n));
}
ur.INSTANCE.onDidChangeZoomLevel;
function fr(e) {
  return ur.INSTANCE.getZoomFactor(e);
}
ur.INSTANCE.onDidChangeFullscreen;
var pr = typeof navigator == `object` ? navigator.userAgent : ``,
  mr = pr.indexOf(`Firefox`) >= 0,
  hr = pr.indexOf(`AppleWebKit`) >= 0,
  gr = pr.indexOf(`Chrome`) >= 0,
  _r = !gr && pr.indexOf(`Safari`) >= 0;
(pr.indexOf(`Electron/`), pr.indexOf(`Android`));
var vr = !1;
if (typeof Bn.matchMedia == `function`) {
  let e = Bn.matchMedia(
      `(display-mode: standalone) or (display-mode: window-controls-overlay)`,
    ),
    t = Bn.matchMedia(`(display-mode: fullscreen)`);
  ((vr = e.matches),
    dr(Bn, e, ({ matches: e }) => {
      (vr && t.matches) || (vr = e);
    }));
}
function yr() {
  return vr;
}
var br = `en`,
  xr = !1,
  Sr = !1,
  Cr = !1,
  wr = !1,
  Tr = !1,
  Er = br,
  Dr,
  Or = globalThis,
  kr;
typeof Or.vscode < `u` && typeof Or.vscode.process < `u`
  ? (kr = Or.vscode.process)
  : typeof process < `u` &&
    typeof process?.versions?.node == `string` &&
    (kr = process);
var Ar = typeof kr?.versions?.electron == `string` && kr?.type === `renderer`;
if (typeof kr == `object`) {
  ((xr = kr.platform === `win32`),
    (Sr = kr.platform === `darwin`),
    (Cr = kr.platform === `linux`),
    Cr && kr.env.SNAP && kr.env.SNAP_REVISION,
    kr.env.CI || kr.env.BUILD_ARTIFACTSTAGINGDIRECTORY,
    (Er = br));
  let e = kr.env.VSCODE_NLS_CONFIG;
  if (e)
    try {
      let t = JSON.parse(e);
      (t.userLocale,
        t.osLocale,
        (Er = t.resolvedLanguage || br),
        t.languagePack?.translationsConfigFile);
    } catch {}
  wr = !0;
} else
  typeof navigator == `object` && !Ar
    ? ((Dr = navigator.userAgent),
      (xr = Dr.indexOf(`Windows`) >= 0),
      (Sr = Dr.indexOf(`Macintosh`) >= 0),
      (Dr.indexOf(`Macintosh`) >= 0 ||
        Dr.indexOf(`iPad`) >= 0 ||
        Dr.indexOf(`iPhone`) >= 0) &&
        navigator.maxTouchPoints &&
        navigator.maxTouchPoints,
      (Cr = Dr.indexOf(`Linux`) >= 0),
      Dr?.indexOf(`Mobi`),
      (Tr = !0),
      (Er = globalThis._VSCODE_NLS_LANGUAGE || br),
      navigator.language.toLowerCase())
    : console.error(`Unable to resolve platform.`);
var jr = xr,
  Mr = Sr,
  Nr = Cr,
  Pr = wr;
Tr && typeof Or.importScripts == `function` && Or.origin;
var Fr = Dr,
  Ir = Er,
  Lr;
((e) => {
  function t() {
    return Ir;
  }
  e.value = t;
  function n() {
    return Ir.length === 2
      ? Ir === `en`
      : Ir.length >= 3
        ? Ir[0] === `e` && Ir[1] === `n` && Ir[2] === `-`
        : !1;
  }
  e.isDefaultVariant = n;
  function r() {
    return Ir === `en`;
  }
  e.isDefault = r;
})((Lr ||= {}));
var Rr = typeof Or.postMessage == `function` && !Or.importScripts;
(() => {
  if (Rr) {
    let e = [];
    Or.addEventListener(`message`, (t) => {
      if (t.data && t.data.vscodeScheduleAsyncWork)
        for (let n = 0, r = e.length; n < r; n++) {
          let r = e[n];
          if (r.id === t.data.vscodeScheduleAsyncWork) {
            (e.splice(n, 1), r.callback());
            return;
          }
        }
    });
    let t = 0;
    return (n) => {
      let r = ++t;
      (e.push({ id: r, callback: n }),
        Or.postMessage({ vscodeScheduleAsyncWork: r }, `*`));
    };
  }
  return (e) => setTimeout(e);
})();
var zr = !!(Fr && Fr.indexOf(`Chrome`) >= 0);
(Fr && Fr.indexOf(`Firefox`),
  !zr && Fr && Fr.indexOf(`Safari`),
  Fr && Fr.indexOf(`Edg/`),
  Fr && Fr.indexOf(`Android`));
var Br = typeof navigator == `object` ? navigator : {};
(Pr ||
  (document.queryCommandSupported && document.queryCommandSupported(`copy`)) ||
  (Br && Br.clipboard && Br.clipboard.writeText),
  Pr || (Br && Br.clipboard && Br.clipboard.readText),
  Pr || yr() || Br.keyboard,
  `ontouchstart` in Bn || Br.maxTouchPoints,
  Bn.PointerEvent && (`ontouchstart` in Bn || navigator.maxTouchPoints));
var Vr = class {
    constructor() {
      ((this._keyCodeToStr = []), (this._strToKeyCode = Object.create(null)));
    }
    define(e, t) {
      ((this._keyCodeToStr[e] = t), (this._strToKeyCode[t.toLowerCase()] = e));
    }
    keyCodeToStr(e) {
      return this._keyCodeToStr[e];
    }
    strToKeyCode(e) {
      return this._strToKeyCode[e.toLowerCase()] || 0;
    }
  },
  Hr = new Vr(),
  Ur = new Vr(),
  Wr = new Vr(),
  Gr = Array(230),
  Kr;
((e) => {
  function t(e) {
    return Hr.keyCodeToStr(e);
  }
  e.toString = t;
  function n(e) {
    return Hr.strToKeyCode(e);
  }
  e.fromString = n;
  function r(e) {
    return Ur.keyCodeToStr(e);
  }
  e.toUserSettingsUS = r;
  function i(e) {
    return Wr.keyCodeToStr(e);
  }
  e.toUserSettingsGeneral = i;
  function a(e) {
    return Ur.strToKeyCode(e) || Wr.strToKeyCode(e);
  }
  e.fromUserSettings = a;
  function o(e) {
    if (e >= 98 && e <= 113) return null;
    switch (e) {
      case 16:
        return `Up`;
      case 18:
        return `Down`;
      case 15:
        return `Left`;
      case 17:
        return `Right`;
    }
    return Hr.keyCodeToStr(e);
  }
  e.toElectronAccelerator = o;
})((Kr ||= {}));
var qr = class e {
    constructor(e, t, n, r, i) {
      ((this.ctrlKey = e),
        (this.shiftKey = t),
        (this.altKey = n),
        (this.metaKey = r),
        (this.keyCode = i));
    }
    equals(t) {
      return (
        t instanceof e &&
        this.ctrlKey === t.ctrlKey &&
        this.shiftKey === t.shiftKey &&
        this.altKey === t.altKey &&
        this.metaKey === t.metaKey &&
        this.keyCode === t.keyCode
      );
    }
    getHashCode() {
      return `K${this.ctrlKey ? `1` : `0`}${this.shiftKey ? `1` : `0`}${this.altKey ? `1` : `0`}${this.metaKey ? `1` : `0`}${this.keyCode}`;
    }
    isModifierKey() {
      return (
        this.keyCode === 0 ||
        this.keyCode === 5 ||
        this.keyCode === 57 ||
        this.keyCode === 6 ||
        this.keyCode === 4
      );
    }
    toKeybinding() {
      return new Jr([this]);
    }
    isDuplicateModifierCase() {
      return (
        (this.ctrlKey && this.keyCode === 5) ||
        (this.shiftKey && this.keyCode === 4) ||
        (this.altKey && this.keyCode === 6) ||
        (this.metaKey && this.keyCode === 57)
      );
    }
  },
  Jr = class {
    constructor(e) {
      if (e.length === 0) throw fn(`chords`);
      this.chords = e;
    }
    getHashCode() {
      let e = ``;
      for (let t = 0, n = this.chords.length; t < n; t++)
        (t !== 0 && (e += `;`), (e += this.chords[t].getHashCode()));
      return e;
    }
    equals(e) {
      if (e === null || this.chords.length !== e.chords.length) return !1;
      for (let t = 0; t < this.chords.length; t++)
        if (!this.chords[t].equals(e.chords[t])) return !1;
      return !0;
    }
  };
function Yr(e) {
  if (e.charCode) {
    let t = String.fromCharCode(e.charCode).toUpperCase();
    return Kr.fromString(t);
  }
  let t = e.keyCode;
  if (t === 3) return 7;
  if (mr)
    switch (t) {
      case 59:
        return 85;
      case 60:
        if (Nr) return 97;
        break;
      case 61:
        return 86;
      case 107:
        return 109;
      case 109:
        return 111;
      case 173:
        return 88;
      case 224:
        if (Mr) return 57;
        break;
    }
  else if (hr && ((Mr && t === 93) || (!Mr && t === 92))) return 57;
  return Gr[t] || 0;
}
var Xr = Mr ? 256 : 2048,
  Zr = 512,
  Qr = 1024,
  $r = Mr ? 2048 : 256,
  ei = class {
    constructor(e) {
      this._standardKeyboardEventBrand = !0;
      let t = e;
      ((this.browserEvent = t),
        (this.target = t.target),
        (this.ctrlKey = t.ctrlKey),
        (this.shiftKey = t.shiftKey),
        (this.altKey = t.altKey),
        (this.metaKey = t.metaKey),
        (this.altGraphKey = t.getModifierState?.(`AltGraph`)),
        (this.keyCode = Yr(t)),
        (this.code = t.code),
        (this.ctrlKey = this.ctrlKey || this.keyCode === 5),
        (this.altKey = this.altKey || this.keyCode === 6),
        (this.shiftKey = this.shiftKey || this.keyCode === 4),
        (this.metaKey = this.metaKey || this.keyCode === 57),
        (this._asKeybinding = this._computeKeybinding()),
        (this._asKeyCodeChord = this._computeKeyCodeChord()));
    }
    preventDefault() {
      this.browserEvent &&
        this.browserEvent.preventDefault &&
        this.browserEvent.preventDefault();
    }
    stopPropagation() {
      this.browserEvent &&
        this.browserEvent.stopPropagation &&
        this.browserEvent.stopPropagation();
    }
    toKeyCodeChord() {
      return this._asKeyCodeChord;
    }
    equals(e) {
      return this._asKeybinding === e;
    }
    _computeKeybinding() {
      let e = 0;
      this.keyCode !== 5 &&
        this.keyCode !== 4 &&
        this.keyCode !== 6 &&
        this.keyCode !== 57 &&
        (e = this.keyCode);
      let t = 0;
      return (
        this.ctrlKey && (t |= Xr),
        this.altKey && (t |= Zr),
        this.shiftKey && (t |= Qr),
        this.metaKey && (t |= $r),
        (t |= e),
        t
      );
    }
    _computeKeyCodeChord() {
      let e = 0;
      return (
        this.keyCode !== 5 &&
          this.keyCode !== 4 &&
          this.keyCode !== 6 &&
          this.keyCode !== 57 &&
          (e = this.keyCode),
        new qr(this.ctrlKey, this.shiftKey, this.altKey, this.metaKey, e)
      );
    }
  },
  ti = new WeakMap();
function ni(e) {
  if (!e.parent || e.parent === e) return null;
  try {
    let t = e.location,
      n = e.parent.location;
    if (t.origin !== `null` && n.origin !== `null` && t.origin !== n.origin)
      return null;
  } catch {
    return null;
  }
  return e.parent;
}
var ri = class {
    static getSameOriginWindowChain(e) {
      let t = ti.get(e);
      if (!t) {
        ((t = []), ti.set(e, t));
        let n = e,
          r;
        do
          ((r = ni(n)),
            r
              ? t.push({
                  window: new WeakRef(n),
                  iframeElement: n.frameElement || null,
                })
              : t.push({ window: new WeakRef(n), iframeElement: null }),
            (n = r));
        while (n);
      }
      return t.slice(0);
    }
    static getPositionOfChildWindowRelativeToAncestorWindow(e, t) {
      if (!t || e === t) return { top: 0, left: 0 };
      let n = 0,
        r = 0,
        i = this.getSameOriginWindowChain(e);
      for (let e of i) {
        let i = e.window.deref();
        if (
          ((n += i?.scrollY ?? 0),
          (r += i?.scrollX ?? 0),
          i === t || !e.iframeElement)
        )
          break;
        let a = e.iframeElement.getBoundingClientRect();
        ((n += a.top), (r += a.left));
      }
      return { top: n, left: r };
    }
  },
  ii = class {
    constructor(e, t) {
      ((this.timestamp = Date.now()),
        (this.browserEvent = t),
        (this.leftButton = t.button === 0),
        (this.middleButton = t.button === 1),
        (this.rightButton = t.button === 2),
        (this.buttons = t.buttons),
        (this.target = t.target),
        (this.detail = t.detail || 1),
        t.type === `dblclick` && (this.detail = 2),
        (this.ctrlKey = t.ctrlKey),
        (this.shiftKey = t.shiftKey),
        (this.altKey = t.altKey),
        (this.metaKey = t.metaKey),
        typeof t.pageX == `number`
          ? ((this.posx = t.pageX), (this.posy = t.pageY))
          : ((this.posx =
              t.clientX +
              this.target.ownerDocument.body.scrollLeft +
              this.target.ownerDocument.documentElement.scrollLeft),
            (this.posy =
              t.clientY +
              this.target.ownerDocument.body.scrollTop +
              this.target.ownerDocument.documentElement.scrollTop)));
      let n = ri.getPositionOfChildWindowRelativeToAncestorWindow(e, t.view);
      ((this.posx -= n.left), (this.posy -= n.top));
    }
    preventDefault() {
      this.browserEvent.preventDefault();
    }
    stopPropagation() {
      this.browserEvent.stopPropagation();
    }
  },
  ai = class {
    constructor(e, t = 0, n = 0) {
      ((this.browserEvent = e || null),
        (this.target = e ? e.target || e.targetNode || e.srcElement : null),
        (this.deltaY = n),
        (this.deltaX = t));
      let r = !1;
      if (gr) {
        let e = navigator.userAgent.match(/Chrome\/(\d+)/);
        r = (e ? parseInt(e[1]) : 123) <= 122;
      }
      if (e) {
        let t = e,
          n = e,
          i = e.view?.devicePixelRatio || 1;
        if (typeof t.wheelDeltaY < `u`)
          r
            ? (this.deltaY = t.wheelDeltaY / (120 * i))
            : (this.deltaY = t.wheelDeltaY / 120);
        else if (typeof n.VERTICAL_AXIS < `u` && n.axis === n.VERTICAL_AXIS)
          this.deltaY = -n.detail / 3;
        else if (e.type === `wheel`) {
          let t = e;
          t.deltaMode === t.DOM_DELTA_LINE
            ? mr && !Mr
              ? (this.deltaY = -e.deltaY / 3)
              : (this.deltaY = -e.deltaY)
            : (this.deltaY = -e.deltaY / 40);
        }
        if (typeof t.wheelDeltaX < `u`)
          _r && jr
            ? (this.deltaX = -(t.wheelDeltaX / 120))
            : r
              ? (this.deltaX = t.wheelDeltaX / (120 * i))
              : (this.deltaX = t.wheelDeltaX / 120);
        else if (typeof n.HORIZONTAL_AXIS < `u` && n.axis === n.HORIZONTAL_AXIS)
          this.deltaX = -e.detail / 3;
        else if (e.type === `wheel`) {
          let t = e;
          t.deltaMode === t.DOM_DELTA_LINE
            ? mr && !Mr
              ? (this.deltaX = -e.deltaX / 3)
              : (this.deltaX = -e.deltaX)
            : (this.deltaX = -e.deltaX / 40);
        }
        this.deltaY === 0 &&
          this.deltaX === 0 &&
          e.wheelDelta &&
          (r
            ? (this.deltaY = e.wheelDelta / (120 * i))
            : (this.deltaY = e.wheelDelta / 120));
      }
    }
    preventDefault() {
      this.browserEvent?.preventDefault();
    }
    stopPropagation() {
      this.browserEvent?.stopPropagation();
    }
  },
  oi = Object.freeze(function (e, t) {
    let n = setTimeout(e.bind(t), 0);
    return {
      dispose() {
        clearTimeout(n);
      },
    };
  }),
  si;
((e) => {
  function t(t) {
    return t === e.None || t === e.Cancelled || t instanceof ci
      ? !0
      : !t || typeof t != `object`
        ? !1
        : typeof t.isCancellationRequested == `boolean` &&
          typeof t.onCancellationRequested == `function`;
  }
  ((e.isCancellationToken = t),
    (e.None = Object.freeze({
      isCancellationRequested: !1,
      onCancellationRequested: Jn.None,
    })),
    (e.Cancelled = Object.freeze({
      isCancellationRequested: !0,
      onCancellationRequested: oi,
    })));
})((si ||= {}));
var ci = class {
    constructor() {
      ((this._isCancelled = !1), (this._emitter = null));
    }
    cancel() {
      this._isCancelled ||
        ((this._isCancelled = !0),
        this._emitter && (this._emitter.fire(void 0), this.dispose()));
    }
    get isCancellationRequested() {
      return this._isCancelled;
    }
    get onCancellationRequested() {
      return this._isCancelled
        ? oi
        : ((this._emitter ||= new L()), this._emitter.event);
    }
    dispose() {
      this._emitter &&= (this._emitter.dispose(), null);
    }
  },
  li = class {
    constructor(e, t) {
      ((this._isDisposed = !1),
        (this._token = -1),
        typeof e == `function` &&
          typeof t == `number` &&
          this.setIfNotSet(e, t));
    }
    dispose() {
      (this.cancel(), (this._isDisposed = !0));
    }
    cancel() {
      this._token !== -1 && (clearTimeout(this._token), (this._token = -1));
    }
    cancelAndSet(e, t) {
      if (this._isDisposed)
        throw new mn(`Calling 'cancelAndSet' on a disposed TimeoutTimer`);
      (this.cancel(),
        (this._token = setTimeout(() => {
          ((this._token = -1), e());
        }, t)));
    }
    setIfNotSet(e, t) {
      if (this._isDisposed)
        throw new mn(`Calling 'setIfNotSet' on a disposed TimeoutTimer`);
      this._token === -1 &&
        (this._token = setTimeout(() => {
          ((this._token = -1), e());
        }, t));
    }
  },
  ui = class {
    constructor() {
      ((this.disposable = void 0), (this.isDisposed = !1));
    }
    cancel() {
      (this.disposable?.dispose(), (this.disposable = void 0));
    }
    cancelAndSet(e, t, n = globalThis) {
      if (this.isDisposed)
        throw new mn(`Calling 'cancelAndSet' on a disposed IntervalTimer`);
      this.cancel();
      let r = n.setInterval(() => {
        e();
      }, t);
      this.disposable = P(() => {
        (n.clearInterval(r), (this.disposable = void 0));
      });
    }
    dispose() {
      (this.cancel(), (this.isDisposed = !0));
    }
  };
(function () {
  typeof globalThis.requestIdleCallback != `function` ||
    globalThis.cancelIdleCallback;
})();
var di;
((e) => {
  async function t(e) {
    let t,
      n = await Promise.all(
        e.map((e) =>
          e.then(
            (e) => e,
            (e) => {
              t ||= e;
            },
          ),
        ),
      );
    if (typeof t < `u`) throw t;
    return n;
  }
  e.settled = t;
  function n(e) {
    return new Promise(async (t, n) => {
      try {
        await e(t, n);
      } catch (e) {
        n(e);
      }
    });
  }
  e.withAsyncBody = n;
})((di ||= {}));
var fi = class e {
  static fromArray(t) {
    return new e((e) => {
      e.emitMany(t);
    });
  }
  static fromPromise(t) {
    return new e(async (e) => {
      e.emitMany(await t);
    });
  }
  static fromPromises(t) {
    return new e(async (e) => {
      await Promise.all(t.map(async (t) => e.emitOne(await t)));
    });
  }
  static merge(t) {
    return new e(async (e) => {
      await Promise.all(
        t.map(async (t) => {
          for await (let n of t) e.emitOne(n);
        }),
      );
    });
  }
  constructor(e, t) {
    ((this._state = 0),
      (this._results = []),
      (this._error = null),
      (this._onReturn = t),
      (this._onStateChanged = new L()),
      queueMicrotask(async () => {
        let t = {
          emitOne: (e) => this.emitOne(e),
          emitMany: (e) => this.emitMany(e),
          reject: (e) => this.reject(e),
        };
        try {
          (await Promise.resolve(e(t)), this.resolve());
        } catch (e) {
          this.reject(e);
        } finally {
          ((t.emitOne = void 0), (t.emitMany = void 0), (t.reject = void 0));
        }
      }));
  }
  [Symbol.asyncIterator]() {
    let e = 0;
    return {
      next: async () => {
        do {
          if (this._state === 2) throw this._error;
          if (e < this._results.length)
            return { done: !1, value: this._results[e++] };
          if (this._state === 1) return { done: !0, value: void 0 };
          await Jn.toPromise(this._onStateChanged.event);
        } while (!0);
      },
      return: async () => (this._onReturn?.(), { done: !0, value: void 0 }),
    };
  }
  static map(t, n) {
    return new e(async (e) => {
      for await (let r of t) e.emitOne(n(r));
    });
  }
  map(t) {
    return e.map(this, t);
  }
  static filter(t, n) {
    return new e(async (e) => {
      for await (let r of t) n(r) && e.emitOne(r);
    });
  }
  filter(t) {
    return e.filter(this, t);
  }
  static coalesce(t) {
    return e.filter(t, (e) => !!e);
  }
  coalesce() {
    return e.coalesce(this);
  }
  static async toPromise(e) {
    let t = [];
    for await (let n of e) t.push(n);
    return t;
  }
  toPromise() {
    return e.toPromise(this);
  }
  emitOne(e) {
    this._state === 0 && (this._results.push(e), this._onStateChanged.fire());
  }
  emitMany(e) {
    this._state === 0 &&
      ((this._results = this._results.concat(e)), this._onStateChanged.fire());
  }
  resolve() {
    this._state === 0 && ((this._state = 1), this._onStateChanged.fire());
  }
  reject(e) {
    this._state === 0 &&
      ((this._state = 2), (this._error = e), this._onStateChanged.fire());
  }
};
fi.EMPTY = fi.fromArray([]);
function pi(e) {
  return 55296 <= e && e <= 56319;
}
function mi(e) {
  return 56320 <= e && e <= 57343;
}
function hi(e, t) {
  return ((e - 55296) << 10) + (t - 56320) + 65536;
}
function gi(e) {
  return _i(e, 0);
}
function _i(e, t) {
  switch (typeof e) {
    case `object`:
      return e === null ? vi(349, t) : Array.isArray(e) ? xi(e, t) : Si(e, t);
    case `string`:
      return bi(e, t);
    case `boolean`:
      return yi(e, t);
    case `number`:
      return vi(e, t);
    case `undefined`:
      return vi(937, t);
    default:
      return vi(617, t);
  }
}
function vi(e, t) {
  return ((t << 5) - t + e) | 0;
}
function yi(e, t) {
  return vi(e ? 433 : 863, t);
}
function bi(e, t) {
  t = vi(149417, t);
  for (let n = 0, r = e.length; n < r; n++) t = vi(e.charCodeAt(n), t);
  return t;
}
function xi(e, t) {
  return ((t = vi(104579, t)), e.reduce((e, t) => _i(t, e), t));
}
function Si(e, t) {
  return (
    (t = vi(181387, t)),
    Object.keys(e)
      .sort()
      .reduce((t, n) => ((t = bi(n, t)), _i(e[n], t)), t)
  );
}
function Ci(e, t, n = 32) {
  let r = n - t,
    i = ~((1 << r) - 1);
  return ((e << t) | ((i & e) >>> r)) >>> 0;
}
function wi(e, t = 0, n = e.byteLength, r = 0) {
  for (let i = 0; i < n; i++) e[t + i] = r;
}
function Ti(e, t, n = `0`) {
  for (; e.length < t; ) e = n + e;
  return e;
}
function Ei(e, t = 32) {
  return e instanceof ArrayBuffer
    ? Array.from(new Uint8Array(e))
        .map((e) => e.toString(16).padStart(2, `0`))
        .join(``)
    : Ti((e >>> 0).toString(16), t / 4);
}
var Di = class e {
  constructor() {
    ((this._h0 = 1732584193),
      (this._h1 = 4023233417),
      (this._h2 = 2562383102),
      (this._h3 = 271733878),
      (this._h4 = 3285377520),
      (this._buff = new Uint8Array(67)),
      (this._buffDV = new DataView(this._buff.buffer)),
      (this._buffLen = 0),
      (this._totalLen = 0),
      (this._leftoverHighSurrogate = 0),
      (this._finished = !1));
  }
  update(e) {
    let t = e.length;
    if (t === 0) return;
    let n = this._buff,
      r = this._buffLen,
      i = this._leftoverHighSurrogate,
      a,
      o;
    for (
      i === 0 ? ((a = e.charCodeAt(0)), (o = 0)) : ((a = i), (o = -1), (i = 0));
      ;
    ) {
      let s = a;
      if (pi(a))
        if (o + 1 < t) {
          let t = e.charCodeAt(o + 1);
          mi(t) ? (o++, (s = hi(a, t))) : (s = 65533);
        } else {
          i = a;
          break;
        }
      else mi(a) && (s = 65533);
      if (((r = this._push(n, r, s)), o++, o < t)) a = e.charCodeAt(o);
      else break;
    }
    ((this._buffLen = r), (this._leftoverHighSurrogate = i));
  }
  _push(e, t, n) {
    return (
      n < 128
        ? (e[t++] = n)
        : n < 2048
          ? ((e[t++] = 192 | ((n & 1984) >>> 6)),
            (e[t++] = 128 | ((n & 63) >>> 0)))
          : n < 65536
            ? ((e[t++] = 224 | ((n & 61440) >>> 12)),
              (e[t++] = 128 | ((n & 4032) >>> 6)),
              (e[t++] = 128 | ((n & 63) >>> 0)))
            : ((e[t++] = 240 | ((n & 1835008) >>> 18)),
              (e[t++] = 128 | ((n & 258048) >>> 12)),
              (e[t++] = 128 | ((n & 4032) >>> 6)),
              (e[t++] = 128 | ((n & 63) >>> 0))),
      t >= 64 &&
        (this._step(),
        (t -= 64),
        (this._totalLen += 64),
        (e[0] = e[64]),
        (e[1] = e[65]),
        (e[2] = e[66])),
      t
    );
  }
  digest() {
    return (
      this._finished ||
        ((this._finished = !0),
        this._leftoverHighSurrogate &&
          ((this._leftoverHighSurrogate = 0),
          (this._buffLen = this._push(this._buff, this._buffLen, 65533))),
        (this._totalLen += this._buffLen),
        this._wrapUp()),
      Ei(this._h0) + Ei(this._h1) + Ei(this._h2) + Ei(this._h3) + Ei(this._h4)
    );
  }
  _wrapUp() {
    ((this._buff[this._buffLen++] = 128),
      wi(this._buff, this._buffLen),
      this._buffLen > 56 && (this._step(), wi(this._buff)));
    let e = 8 * this._totalLen;
    (this._buffDV.setUint32(56, Math.floor(e / 4294967296), !1),
      this._buffDV.setUint32(60, e % 4294967296, !1),
      this._step());
  }
  _step() {
    let t = e._bigBlock32,
      n = this._buffDV;
    for (let e = 0; e < 64; e += 4) t.setUint32(e, n.getUint32(e, !1), !1);
    for (let e = 64; e < 320; e += 4)
      t.setUint32(
        e,
        Ci(
          t.getUint32(e - 12, !1) ^
            t.getUint32(e - 32, !1) ^
            t.getUint32(e - 56, !1) ^
            t.getUint32(e - 64, !1),
          1,
        ),
        !1,
      );
    let r = this._h0,
      i = this._h1,
      a = this._h2,
      o = this._h3,
      s = this._h4,
      c,
      l,
      u;
    for (let e = 0; e < 80; e++)
      (e < 20
        ? ((c = (i & a) | (~i & o)), (l = 1518500249))
        : e < 40
          ? ((c = i ^ a ^ o), (l = 1859775393))
          : e < 60
            ? ((c = (i & a) | (i & o) | (a & o)), (l = 2400959708))
            : ((c = i ^ a ^ o), (l = 3395469782)),
        (u = (Ci(r, 5) + c + s + l + t.getUint32(e * 4, !1)) & 4294967295),
        (s = o),
        (o = a),
        (a = Ci(i, 30)),
        (i = r),
        (r = u));
    ((this._h0 = (this._h0 + r) & 4294967295),
      (this._h1 = (this._h1 + i) & 4294967295),
      (this._h2 = (this._h2 + a) & 4294967295),
      (this._h3 = (this._h3 + o) & 4294967295),
      (this._h4 = (this._h4 + s) & 4294967295));
  }
};
Di._bigBlock32 = new DataView(new ArrayBuffer(320));
var {
    registerWindow: Oi,
    getWindow: ki,
    getDocument: Ai,
    getWindows: ji,
    getWindowsCount: Mi,
    getWindowId: Ni,
    getWindowById: Pi,
    hasWindow: Fi,
    onDidRegisterWindow: Ii,
    onWillUnregisterWindow: Li,
    onDidUnregisterWindow: Ri,
  } = (function () {
    let e = new Map(),
      t = { window: Bn, disposables: new Rn() };
    e.set(Bn.vscodeWindowId, t);
    let n = new L(),
      r = new L(),
      i = new L();
    function a(n, r) {
      return (typeof n == `number` ? e.get(n) : void 0) ?? (r ? t : void 0);
    }
    return {
      onDidRegisterWindow: n.event,
      onWillUnregisterWindow: i.event,
      onDidUnregisterWindow: r.event,
      registerWindow(t) {
        if (e.has(t.vscodeWindowId)) return F.None;
        let a = new Rn(),
          o = { window: t, disposables: a.add(new Rn()) };
        return (
          e.set(t.vscodeWindowId, o),
          a.add(
            P(() => {
              (e.delete(t.vscodeWindowId), r.fire(t));
            }),
          ),
          a.add(
            R(t, z.BEFORE_UNLOAD, () => {
              i.fire(t);
            }),
          ),
          n.fire(o),
          a
        );
      },
      getWindows() {
        return e.values();
      },
      getWindowsCount() {
        return e.size;
      },
      getWindowId(e) {
        return e.vscodeWindowId;
      },
      hasWindow(t) {
        return e.has(t);
      },
      getWindowById: a,
      getWindow(e) {
        let t = e;
        if (t?.ownerDocument?.defaultView)
          return t.ownerDocument.defaultView.window;
        let n = e;
        return n?.view ? n.view.window : Bn;
      },
      getDocument(e) {
        return ki(e).document;
      },
    };
  })(),
  zi = class {
    constructor(e, t, n, r) {
      ((this._node = e),
        (this._type = t),
        (this._handler = n),
        (this._options = r || !1),
        this._node.addEventListener(this._type, this._handler, this._options));
    }
    dispose() {
      this._handler &&=
        (this._node.removeEventListener(
          this._type,
          this._handler,
          this._options,
        ),
        (this._node = null),
        null);
    }
  };
function R(e, t, n, r) {
  return new zi(e, t, n, r);
}
function Bi(e, t) {
  return function (n) {
    return t(new ii(e, n));
  };
}
function Vi(e) {
  return function (t) {
    return e(new ei(t));
  };
}
var Hi = function (e, t, n, r) {
    let i = n;
    return (
      t === `click` || t === `mousedown` || t === `contextmenu`
        ? (i = Bi(ki(e), n))
        : (t === `keydown` || t === `keypress` || t === `keyup`) && (i = Vi(n)),
      R(e, t, i, r)
    );
  },
  Ui,
  Wi = class extends ui {
    constructor(e) {
      (super(), (this.defaultTarget = e && ki(e)));
    }
    cancelAndSet(e, t, n) {
      return super.cancelAndSet(e, t, n ?? this.defaultTarget);
    }
  },
  Gi = class {
    constructor(e, t = 0) {
      ((this._runner = e), (this.priority = t), (this._canceled = !1));
    }
    dispose() {
      this._canceled = !0;
    }
    execute() {
      if (!this._canceled)
        try {
          this._runner();
        } catch (e) {
          cn(e);
        }
    }
    static sort(e, t) {
      return t.priority - e.priority;
    }
  };
(function () {
  let e = new Map(),
    t = new Map(),
    n = new Map(),
    r = new Map(),
    i = (i) => {
      n.set(i, !1);
      let a = e.get(i) ?? [];
      for (t.set(i, a), e.set(i, []), r.set(i, !0); a.length > 0; )
        (a.sort(Gi.sort), a.shift().execute());
      r.set(i, !1);
    };
  Ui = (t, r, a = 0) => {
    let o = Ni(t),
      s = new Gi(r, a),
      c = e.get(o);
    return (
      c || ((c = []), e.set(o, c)),
      c.push(s),
      n.get(o) || (n.set(o, !0), t.requestAnimationFrame(() => i(o))),
      s
    );
  };
})();
var Ki = class e {
  constructor(e, t) {
    ((this.width = e), (this.height = t));
  }
  with(t = this.width, n = this.height) {
    return t !== this.width || n !== this.height ? new e(t, n) : this;
  }
  static is(e) {
    return (
      typeof e == `object` &&
      typeof e.height == `number` &&
      typeof e.width == `number`
    );
  }
  static lift(t) {
    return t instanceof e ? t : new e(t.width, t.height);
  }
  static equals(e, t) {
    return e === t
      ? !0
      : !e || !t
        ? !1
        : e.width === t.width && e.height === t.height;
  }
};
Ki.None = new Ki(0, 0);
function qi(e) {
  let t = e.getBoundingClientRect(),
    n = ki(e);
  return {
    left: t.left + n.scrollX,
    top: t.top + n.scrollY,
    width: t.width,
    height: t.height,
  };
}
new (class {
  constructor() {
    this.mutationObservers = new Map();
  }
  observe(e, t, n) {
    let r = this.mutationObservers.get(e);
    r || ((r = new Map()), this.mutationObservers.set(e, r));
    let i = gi(n),
      a = r.get(i);
    if (a) a.users += 1;
    else {
      let o = new L(),
        s = new MutationObserver((e) => o.fire(e));
      s.observe(e, n);
      let c = (a = { users: 1, observer: s, onDidMutate: o.event });
      (t.add(
        P(() => {
          (--c.users,
            c.users === 0 &&
              (o.dispose(),
              s.disconnect(),
              r?.delete(i),
              r?.size === 0 && this.mutationObservers.delete(e)));
        }),
      ),
        r.set(i, a));
    }
    return a.onDidMutate;
  }
})();
var z = {
    CLICK: `click`,
    AUXCLICK: `auxclick`,
    DBLCLICK: `dblclick`,
    MOUSE_UP: `mouseup`,
    MOUSE_DOWN: `mousedown`,
    MOUSE_OVER: `mouseover`,
    MOUSE_MOVE: `mousemove`,
    MOUSE_OUT: `mouseout`,
    MOUSE_ENTER: `mouseenter`,
    MOUSE_LEAVE: `mouseleave`,
    MOUSE_WHEEL: `wheel`,
    POINTER_UP: `pointerup`,
    POINTER_DOWN: `pointerdown`,
    POINTER_MOVE: `pointermove`,
    POINTER_LEAVE: `pointerleave`,
    CONTEXT_MENU: `contextmenu`,
    WHEEL: `wheel`,
    KEY_DOWN: `keydown`,
    KEY_PRESS: `keypress`,
    KEY_UP: `keyup`,
    LOAD: `load`,
    BEFORE_UNLOAD: `beforeunload`,
    UNLOAD: `unload`,
    PAGE_SHOW: `pageshow`,
    PAGE_HIDE: `pagehide`,
    PASTE: `paste`,
    ABORT: `abort`,
    ERROR: `error`,
    RESIZE: `resize`,
    SCROLL: `scroll`,
    FULLSCREEN_CHANGE: `fullscreenchange`,
    WK_FULLSCREEN_CHANGE: `webkitfullscreenchange`,
    SELECT: `select`,
    CHANGE: `change`,
    SUBMIT: `submit`,
    RESET: `reset`,
    FOCUS: `focus`,
    FOCUS_IN: `focusin`,
    FOCUS_OUT: `focusout`,
    BLUR: `blur`,
    INPUT: `input`,
    STORAGE: `storage`,
    DRAG_START: `dragstart`,
    DRAG: `drag`,
    DRAG_ENTER: `dragenter`,
    DRAG_LEAVE: `dragleave`,
    DRAG_OVER: `dragover`,
    DROP: `drop`,
    DRAG_END: `dragend`,
    ANIMATION_START: hr ? `webkitAnimationStart` : `animationstart`,
    ANIMATION_END: hr ? `webkitAnimationEnd` : `animationend`,
    ANIMATION_ITERATION: hr ? `webkitAnimationIteration` : `animationiteration`,
  },
  Ji = /([\w\-]+)?(#([\w\-]+))?((\.([\w\-]+))*)/;
function Yi(e, t, n, ...r) {
  let i = Ji.exec(t);
  if (!i) throw Error(`Bad use of emmet`);
  let a = i[1] || `div`,
    o;
  return (
    (o =
      e === `http://www.w3.org/1999/xhtml`
        ? document.createElement(a)
        : document.createElementNS(e, a)),
    i[3] && (o.id = i[3]),
    i[4] && (o.className = i[4].replace(/\./g, ` `).trim()),
    n &&
      Object.entries(n).forEach(([e, t]) => {
        typeof t > `u` ||
          (/^on\w+$/.test(e)
            ? (o[e] = t)
            : e === `selected`
              ? t && o.setAttribute(e, `true`)
              : o.setAttribute(e, t));
      }),
    o.append(...r),
    o
  );
}
function Xi(e, t, ...n) {
  return Yi(`http://www.w3.org/1999/xhtml`, e, t, ...n);
}
Xi.SVG = function (e, t, ...n) {
  return Yi(`http://www.w3.org/2000/svg`, e, t, ...n);
};
var Zi = class {
  constructor(e) {
    ((this.domNode = e),
      (this._maxWidth = ``),
      (this._width = ``),
      (this._height = ``),
      (this._top = ``),
      (this._left = ``),
      (this._bottom = ``),
      (this._right = ``),
      (this._paddingTop = ``),
      (this._paddingLeft = ``),
      (this._paddingBottom = ``),
      (this._paddingRight = ``),
      (this._fontFamily = ``),
      (this._fontWeight = ``),
      (this._fontSize = ``),
      (this._fontStyle = ``),
      (this._fontFeatureSettings = ``),
      (this._fontVariationSettings = ``),
      (this._textDecoration = ``),
      (this._lineHeight = ``),
      (this._letterSpacing = ``),
      (this._className = ``),
      (this._display = ``),
      (this._position = ``),
      (this._visibility = ``),
      (this._color = ``),
      (this._backgroundColor = ``),
      (this._layerHint = !1),
      (this._contain = `none`),
      (this._boxShadow = ``));
  }
  setMaxWidth(e) {
    let t = Qi(e);
    this._maxWidth !== t &&
      ((this._maxWidth = t), (this.domNode.style.maxWidth = this._maxWidth));
  }
  setWidth(e) {
    let t = Qi(e);
    this._width !== t &&
      ((this._width = t), (this.domNode.style.width = this._width));
  }
  setHeight(e) {
    let t = Qi(e);
    this._height !== t &&
      ((this._height = t), (this.domNode.style.height = this._height));
  }
  setTop(e) {
    let t = Qi(e);
    this._top !== t && ((this._top = t), (this.domNode.style.top = this._top));
  }
  setLeft(e) {
    let t = Qi(e);
    this._left !== t &&
      ((this._left = t), (this.domNode.style.left = this._left));
  }
  setBottom(e) {
    let t = Qi(e);
    this._bottom !== t &&
      ((this._bottom = t), (this.domNode.style.bottom = this._bottom));
  }
  setRight(e) {
    let t = Qi(e);
    this._right !== t &&
      ((this._right = t), (this.domNode.style.right = this._right));
  }
  setPaddingTop(e) {
    let t = Qi(e);
    this._paddingTop !== t &&
      ((this._paddingTop = t),
      (this.domNode.style.paddingTop = this._paddingTop));
  }
  setPaddingLeft(e) {
    let t = Qi(e);
    this._paddingLeft !== t &&
      ((this._paddingLeft = t),
      (this.domNode.style.paddingLeft = this._paddingLeft));
  }
  setPaddingBottom(e) {
    let t = Qi(e);
    this._paddingBottom !== t &&
      ((this._paddingBottom = t),
      (this.domNode.style.paddingBottom = this._paddingBottom));
  }
  setPaddingRight(e) {
    let t = Qi(e);
    this._paddingRight !== t &&
      ((this._paddingRight = t),
      (this.domNode.style.paddingRight = this._paddingRight));
  }
  setFontFamily(e) {
    this._fontFamily !== e &&
      ((this._fontFamily = e),
      (this.domNode.style.fontFamily = this._fontFamily));
  }
  setFontWeight(e) {
    this._fontWeight !== e &&
      ((this._fontWeight = e),
      (this.domNode.style.fontWeight = this._fontWeight));
  }
  setFontSize(e) {
    let t = Qi(e);
    this._fontSize !== t &&
      ((this._fontSize = t), (this.domNode.style.fontSize = this._fontSize));
  }
  setFontStyle(e) {
    this._fontStyle !== e &&
      ((this._fontStyle = e), (this.domNode.style.fontStyle = this._fontStyle));
  }
  setFontFeatureSettings(e) {
    this._fontFeatureSettings !== e &&
      ((this._fontFeatureSettings = e),
      (this.domNode.style.fontFeatureSettings = this._fontFeatureSettings));
  }
  setFontVariationSettings(e) {
    this._fontVariationSettings !== e &&
      ((this._fontVariationSettings = e),
      (this.domNode.style.fontVariationSettings = this._fontVariationSettings));
  }
  setTextDecoration(e) {
    this._textDecoration !== e &&
      ((this._textDecoration = e),
      (this.domNode.style.textDecoration = this._textDecoration));
  }
  setLineHeight(e) {
    let t = Qi(e);
    this._lineHeight !== t &&
      ((this._lineHeight = t),
      (this.domNode.style.lineHeight = this._lineHeight));
  }
  setLetterSpacing(e) {
    let t = Qi(e);
    this._letterSpacing !== t &&
      ((this._letterSpacing = t),
      (this.domNode.style.letterSpacing = this._letterSpacing));
  }
  setClassName(e) {
    this._className !== e &&
      ((this._className = e), (this.domNode.className = this._className));
  }
  toggleClassName(e, t) {
    (this.domNode.classList.toggle(e, t),
      (this._className = this.domNode.className));
  }
  setDisplay(e) {
    this._display !== e &&
      ((this._display = e), (this.domNode.style.display = this._display));
  }
  setPosition(e) {
    this._position !== e &&
      ((this._position = e), (this.domNode.style.position = this._position));
  }
  setVisibility(e) {
    this._visibility !== e &&
      ((this._visibility = e),
      (this.domNode.style.visibility = this._visibility));
  }
  setColor(e) {
    this._color !== e &&
      ((this._color = e), (this.domNode.style.color = this._color));
  }
  setBackgroundColor(e) {
    this._backgroundColor !== e &&
      ((this._backgroundColor = e),
      (this.domNode.style.backgroundColor = this._backgroundColor));
  }
  setLayerHinting(e) {
    this._layerHint !== e &&
      ((this._layerHint = e),
      (this.domNode.style.transform = this._layerHint
        ? `translate3d(0px, 0px, 0px)`
        : ``));
  }
  setBoxShadow(e) {
    this._boxShadow !== e &&
      ((this._boxShadow = e), (this.domNode.style.boxShadow = e));
  }
  setContain(e) {
    this._contain !== e &&
      ((this._contain = e), (this.domNode.style.contain = this._contain));
  }
  setAttribute(e, t) {
    this.domNode.setAttribute(e, t);
  }
  removeAttribute(e) {
    this.domNode.removeAttribute(e);
  }
  appendChild(e) {
    this.domNode.appendChild(e.domNode);
  }
  removeChild(e) {
    this.domNode.removeChild(e.domNode);
  }
};
function Qi(e) {
  return typeof e == `number` ? `${e}px` : e;
}
function $i(e) {
  return new Zi(e);
}
var ea = class {
  constructor() {
    ((this._hooks = new Rn()),
      (this._pointerMoveCallback = null),
      (this._onStopCallback = null));
  }
  dispose() {
    (this.stopMonitoring(!1), this._hooks.dispose());
  }
  stopMonitoring(e, t) {
    if (!this.isMonitoring()) return;
    (this._hooks.clear(), (this._pointerMoveCallback = null));
    let n = this._onStopCallback;
    ((this._onStopCallback = null), e && n && n(t));
  }
  isMonitoring() {
    return !!this._pointerMoveCallback;
  }
  startMonitoring(e, t, n, r, i) {
    (this.isMonitoring() && this.stopMonitoring(!1),
      (this._pointerMoveCallback = r),
      (this._onStopCallback = i));
    let a = e;
    try {
      (e.setPointerCapture(t),
        this._hooks.add(
          P(() => {
            try {
              e.releasePointerCapture(t);
            } catch {}
          }),
        ));
    } catch {
      a = ki(e);
    }
    (this._hooks.add(
      R(a, z.POINTER_MOVE, (e) => {
        if (e.buttons !== n) {
          this.stopMonitoring(!0);
          return;
        }
        (e.preventDefault(), this._pointerMoveCallback(e));
      }),
    ),
      this._hooks.add(R(a, z.POINTER_UP, (e) => this.stopMonitoring(!0))));
  }
};
function ta(e, t, n) {
  let r = null,
    i = null;
  if (
    (typeof n.value == `function`
      ? ((r = `value`),
        (i = n.value),
        i.length !== 0 &&
          console.warn(
            `Memoize should only be used in functions with zero parameters`,
          ))
      : typeof n.get == `function` && ((r = `get`), (i = n.get)),
    !i)
  )
    throw Error(`not supported`);
  let a = `$memoize$${t}`;
  n[r] = function (...e) {
    return (
      this.hasOwnProperty(a) ||
        Object.defineProperty(this, a, {
          configurable: !1,
          enumerable: !1,
          writable: !1,
          value: i.apply(this, e),
        }),
      this[a]
    );
  };
}
var na;
((e) => (
  (e.Tap = `-xterm-gesturetap`),
  (e.Change = `-xterm-gesturechange`),
  (e.Start = `-xterm-gesturestart`),
  (e.End = `-xterm-gesturesend`),
  (e.Contextmenu = `-xterm-gesturecontextmenu`)
))((na ||= {}));
var ra = class e extends F {
  constructor() {
    (super(),
      (this.dispatched = !1),
      (this.targets = new Hn()),
      (this.ignoreTargets = new Hn()),
      (this.activeTouches = {}),
      (this.handle = null),
      (this._lastSetTapCountTime = 0),
      this._register(
        Jn.runAndSubscribe(
          Ii,
          ({ window: e, disposables: t }) => {
            (t.add(
              R(e.document, `touchstart`, (e) => this.onTouchStart(e), {
                passive: !1,
              }),
            ),
              t.add(R(e.document, `touchend`, (t) => this.onTouchEnd(e, t))),
              t.add(
                R(e.document, `touchmove`, (e) => this.onTouchMove(e), {
                  passive: !1,
                }),
              ));
          },
          { window: Bn, disposables: this._store },
        ),
      ));
  }
  static addTarget(t) {
    return e.isTouchDevice()
      ? ((e.INSTANCE ||= Pn(new e())), P(e.INSTANCE.targets.push(t)))
      : F.None;
  }
  static ignoreTarget(t) {
    return e.isTouchDevice()
      ? ((e.INSTANCE ||= Pn(new e())), P(e.INSTANCE.ignoreTargets.push(t)))
      : F.None;
  }
  static isTouchDevice() {
    return `ontouchstart` in Bn || navigator.maxTouchPoints > 0;
  }
  dispose() {
    ((this.handle &&= (this.handle.dispose(), null)), super.dispose());
  }
  onTouchStart(e) {
    let t = Date.now();
    this.handle &&= (this.handle.dispose(), null);
    for (let n = 0, r = e.targetTouches.length; n < r; n++) {
      let r = e.targetTouches.item(n);
      this.activeTouches[r.identifier] = {
        id: r.identifier,
        initialTarget: r.target,
        initialTimeStamp: t,
        initialPageX: r.pageX,
        initialPageY: r.pageY,
        rollingTimestamps: [t],
        rollingPageX: [r.pageX],
        rollingPageY: [r.pageY],
      };
      let i = this.newGestureEvent(na.Start, r.target);
      ((i.pageX = r.pageX), (i.pageY = r.pageY), this.dispatchEvent(i));
    }
    this.dispatched &&= (e.preventDefault(), e.stopPropagation(), !1);
  }
  onTouchEnd(t, n) {
    let r = Date.now(),
      i = Object.keys(this.activeTouches).length;
    for (let a = 0, o = n.changedTouches.length; a < o; a++) {
      let o = n.changedTouches.item(a);
      if (!this.activeTouches.hasOwnProperty(String(o.identifier))) {
        console.warn(`move of an UNKNOWN touch`, o);
        continue;
      }
      let s = this.activeTouches[o.identifier],
        c = Date.now() - s.initialTimeStamp;
      if (
        c < e.HOLD_DELAY &&
        Math.abs(s.initialPageX - _n(s.rollingPageX)) < 30 &&
        Math.abs(s.initialPageY - _n(s.rollingPageY)) < 30
      ) {
        let e = this.newGestureEvent(na.Tap, s.initialTarget);
        ((e.pageX = _n(s.rollingPageX)),
          (e.pageY = _n(s.rollingPageY)),
          this.dispatchEvent(e));
      } else if (
        c >= e.HOLD_DELAY &&
        Math.abs(s.initialPageX - _n(s.rollingPageX)) < 30 &&
        Math.abs(s.initialPageY - _n(s.rollingPageY)) < 30
      ) {
        let e = this.newGestureEvent(na.Contextmenu, s.initialTarget);
        ((e.pageX = _n(s.rollingPageX)),
          (e.pageY = _n(s.rollingPageY)),
          this.dispatchEvent(e));
      } else if (i === 1) {
        let e = _n(s.rollingPageX),
          n = _n(s.rollingPageY),
          i = _n(s.rollingTimestamps) - s.rollingTimestamps[0],
          a = e - s.rollingPageX[0],
          o = n - s.rollingPageY[0],
          c = [...this.targets].filter(
            (e) =>
              s.initialTarget instanceof Node && e.contains(s.initialTarget),
          );
        this.inertia(
          t,
          c,
          r,
          Math.abs(a) / i,
          a > 0 ? 1 : -1,
          e,
          Math.abs(o) / i,
          o > 0 ? 1 : -1,
          n,
        );
      }
      (this.dispatchEvent(this.newGestureEvent(na.End, s.initialTarget)),
        delete this.activeTouches[o.identifier]);
    }
    this.dispatched &&= (n.preventDefault(), n.stopPropagation(), !1);
  }
  newGestureEvent(e, t) {
    let n = document.createEvent(`CustomEvent`);
    return (n.initEvent(e, !1, !0), (n.initialTarget = t), (n.tapCount = 0), n);
  }
  dispatchEvent(t) {
    if (t.type === na.Tap) {
      let n = new Date().getTime(),
        r = 0;
      ((r = n - this._lastSetTapCountTime > e.CLEAR_TAP_COUNT_TIME ? 1 : 2),
        (this._lastSetTapCountTime = n),
        (t.tapCount = r));
    } else
      (t.type === na.Change || t.type === na.Contextmenu) &&
        (this._lastSetTapCountTime = 0);
    if (t.initialTarget instanceof Node) {
      for (let e of this.ignoreTargets) if (e.contains(t.initialTarget)) return;
      let e = [];
      for (let n of this.targets)
        if (n.contains(t.initialTarget)) {
          let r = 0,
            i = t.initialTarget;
          for (; i && i !== n; ) (r++, (i = i.parentElement));
          e.push([r, n]);
        }
      e.sort((e, t) => e[0] - t[0]);
      for (let [n, r] of e) (r.dispatchEvent(t), (this.dispatched = !0));
    }
  }
  inertia(t, n, r, i, a, o, s, c, l) {
    this.handle = Ui(t, () => {
      let u = Date.now(),
        d = u - r,
        f = 0,
        p = 0,
        m = !0;
      ((i += e.SCROLL_FRICTION * d),
        (s += e.SCROLL_FRICTION * d),
        i > 0 && ((m = !1), (f = a * i * d)),
        s > 0 && ((m = !1), (p = c * s * d)));
      let h = this.newGestureEvent(na.Change);
      ((h.translationX = f),
        (h.translationY = p),
        n.forEach((e) => e.dispatchEvent(h)),
        m || this.inertia(t, n, u, i, a, o + f, s, c, l + p));
    });
  }
  onTouchMove(e) {
    let t = Date.now();
    for (let n = 0, r = e.changedTouches.length; n < r; n++) {
      let r = e.changedTouches.item(n);
      if (!this.activeTouches.hasOwnProperty(String(r.identifier))) {
        console.warn(`end of an UNKNOWN touch`, r);
        continue;
      }
      let i = this.activeTouches[r.identifier],
        a = this.newGestureEvent(na.Change, i.initialTarget);
      ((a.translationX = r.pageX - _n(i.rollingPageX)),
        (a.translationY = r.pageY - _n(i.rollingPageY)),
        (a.pageX = r.pageX),
        (a.pageY = r.pageY),
        this.dispatchEvent(a),
        i.rollingPageX.length > 3 &&
          (i.rollingPageX.shift(),
          i.rollingPageY.shift(),
          i.rollingTimestamps.shift()),
        i.rollingPageX.push(r.pageX),
        i.rollingPageY.push(r.pageY),
        i.rollingTimestamps.push(t));
    }
    this.dispatched &&= (e.preventDefault(), e.stopPropagation(), !1);
  }
};
((ra.SCROLL_FRICTION = -0.005),
  (ra.HOLD_DELAY = 700),
  (ra.CLEAR_TAP_COUNT_TIME = 400),
  j([ta], ra, `isTouchDevice`, 1));
var ia = ra,
  aa = class extends F {
    onclick(e, t) {
      this._register(R(e, z.CLICK, (n) => t(new ii(ki(e), n))));
    }
    onmousedown(e, t) {
      this._register(R(e, z.MOUSE_DOWN, (n) => t(new ii(ki(e), n))));
    }
    onmouseover(e, t) {
      this._register(R(e, z.MOUSE_OVER, (n) => t(new ii(ki(e), n))));
    }
    onmouseleave(e, t) {
      this._register(R(e, z.MOUSE_LEAVE, (n) => t(new ii(ki(e), n))));
    }
    onkeydown(e, t) {
      this._register(R(e, z.KEY_DOWN, (e) => t(new ei(e))));
    }
    onkeyup(e, t) {
      this._register(R(e, z.KEY_UP, (e) => t(new ei(e))));
    }
    oninput(e, t) {
      this._register(R(e, z.INPUT, t));
    }
    onblur(e, t) {
      this._register(R(e, z.BLUR, t));
    }
    onfocus(e, t) {
      this._register(R(e, z.FOCUS, t));
    }
    onchange(e, t) {
      this._register(R(e, z.CHANGE, t));
    }
    ignoreGesture(e) {
      return ia.ignoreTarget(e);
    }
  },
  oa = 11,
  sa = class extends aa {
    constructor(e) {
      (super(),
        (this._onActivate = e.onActivate),
        (this.bgDomNode = document.createElement(`div`)),
        (this.bgDomNode.className = `arrow-background`),
        (this.bgDomNode.style.position = `absolute`),
        (this.bgDomNode.style.width = e.bgWidth + `px`),
        (this.bgDomNode.style.height = e.bgHeight + `px`),
        typeof e.top < `u` && (this.bgDomNode.style.top = `0px`),
        typeof e.left < `u` && (this.bgDomNode.style.left = `0px`),
        typeof e.bottom < `u` && (this.bgDomNode.style.bottom = `0px`),
        typeof e.right < `u` && (this.bgDomNode.style.right = `0px`),
        (this.domNode = document.createElement(`div`)),
        (this.domNode.className = e.className),
        (this.domNode.style.position = `absolute`),
        (this.domNode.style.width = oa + `px`),
        (this.domNode.style.height = oa + `px`),
        typeof e.top < `u` && (this.domNode.style.top = e.top + `px`),
        typeof e.left < `u` && (this.domNode.style.left = e.left + `px`),
        typeof e.bottom < `u` && (this.domNode.style.bottom = e.bottom + `px`),
        typeof e.right < `u` && (this.domNode.style.right = e.right + `px`),
        (this._pointerMoveMonitor = this._register(new ea())),
        this._register(
          Hi(this.bgDomNode, z.POINTER_DOWN, (e) => this._arrowPointerDown(e)),
        ),
        this._register(
          Hi(this.domNode, z.POINTER_DOWN, (e) => this._arrowPointerDown(e)),
        ),
        (this._pointerdownRepeatTimer = this._register(new Wi())),
        (this._pointerdownScheduleRepeatTimer = this._register(new li())));
    }
    _arrowPointerDown(e) {
      !e.target ||
        !(e.target instanceof Element) ||
        (this._onActivate(),
        this._pointerdownRepeatTimer.cancel(),
        this._pointerdownScheduleRepeatTimer.cancelAndSet(() => {
          this._pointerdownRepeatTimer.cancelAndSet(
            () => this._onActivate(),
            1e3 / 24,
            ki(e),
          );
        }, 200),
        this._pointerMoveMonitor.startMonitoring(
          e.target,
          e.pointerId,
          e.buttons,
          (e) => {},
          () => {
            (this._pointerdownRepeatTimer.cancel(),
              this._pointerdownScheduleRepeatTimer.cancel());
          },
        ),
        e.preventDefault());
    }
  },
  ca = class e {
    constructor(e, t, n, r, i, a, o) {
      ((this._forceIntegerValues = e),
        (this._scrollStateBrand = void 0),
        this._forceIntegerValues &&
          ((t |= 0), (n |= 0), (r |= 0), (i |= 0), (a |= 0), (o |= 0)),
        (this.rawScrollLeft = r),
        (this.rawScrollTop = o),
        t < 0 && (t = 0),
        r + t > n && (r = n - t),
        r < 0 && (r = 0),
        i < 0 && (i = 0),
        o + i > a && (o = a - i),
        o < 0 && (o = 0),
        (this.width = t),
        (this.scrollWidth = n),
        (this.scrollLeft = r),
        (this.height = i),
        (this.scrollHeight = a),
        (this.scrollTop = o));
    }
    equals(e) {
      return (
        this.rawScrollLeft === e.rawScrollLeft &&
        this.rawScrollTop === e.rawScrollTop &&
        this.width === e.width &&
        this.scrollWidth === e.scrollWidth &&
        this.scrollLeft === e.scrollLeft &&
        this.height === e.height &&
        this.scrollHeight === e.scrollHeight &&
        this.scrollTop === e.scrollTop
      );
    }
    withScrollDimensions(t, n) {
      return new e(
        this._forceIntegerValues,
        typeof t.width < `u` ? t.width : this.width,
        typeof t.scrollWidth < `u` ? t.scrollWidth : this.scrollWidth,
        n ? this.rawScrollLeft : this.scrollLeft,
        typeof t.height < `u` ? t.height : this.height,
        typeof t.scrollHeight < `u` ? t.scrollHeight : this.scrollHeight,
        n ? this.rawScrollTop : this.scrollTop,
      );
    }
    withScrollPosition(t) {
      return new e(
        this._forceIntegerValues,
        this.width,
        this.scrollWidth,
        typeof t.scrollLeft < `u` ? t.scrollLeft : this.rawScrollLeft,
        this.height,
        this.scrollHeight,
        typeof t.scrollTop < `u` ? t.scrollTop : this.rawScrollTop,
      );
    }
    createScrollEvent(e, t) {
      let n = this.width !== e.width,
        r = this.scrollWidth !== e.scrollWidth,
        i = this.scrollLeft !== e.scrollLeft,
        a = this.height !== e.height,
        o = this.scrollHeight !== e.scrollHeight,
        s = this.scrollTop !== e.scrollTop;
      return {
        inSmoothScrolling: t,
        oldWidth: e.width,
        oldScrollWidth: e.scrollWidth,
        oldScrollLeft: e.scrollLeft,
        width: this.width,
        scrollWidth: this.scrollWidth,
        scrollLeft: this.scrollLeft,
        oldHeight: e.height,
        oldScrollHeight: e.scrollHeight,
        oldScrollTop: e.scrollTop,
        height: this.height,
        scrollHeight: this.scrollHeight,
        scrollTop: this.scrollTop,
        widthChanged: n,
        scrollWidthChanged: r,
        scrollLeftChanged: i,
        heightChanged: a,
        scrollHeightChanged: o,
        scrollTopChanged: s,
      };
    }
  },
  la = class extends F {
    constructor(e) {
      (super(),
        (this._scrollableBrand = void 0),
        (this._onScroll = this._register(new L())),
        (this.onScroll = this._onScroll.event),
        (this._smoothScrollDuration = e.smoothScrollDuration),
        (this._scheduleAtNextAnimationFrame = e.scheduleAtNextAnimationFrame),
        (this._state = new ca(e.forceIntegerValues, 0, 0, 0, 0, 0, 0)),
        (this._smoothScrolling = null));
    }
    dispose() {
      ((this._smoothScrolling &&= (this._smoothScrolling.dispose(), null)),
        super.dispose());
    }
    setSmoothScrollDuration(e) {
      this._smoothScrollDuration = e;
    }
    validateScrollPosition(e) {
      return this._state.withScrollPosition(e);
    }
    getScrollDimensions() {
      return this._state;
    }
    setScrollDimensions(e, t) {
      let n = this._state.withScrollDimensions(e, t);
      (this._setState(n, !!this._smoothScrolling),
        this._smoothScrolling?.acceptScrollDimensions(this._state));
    }
    getFutureScrollPosition() {
      return this._smoothScrolling ? this._smoothScrolling.to : this._state;
    }
    getCurrentScrollPosition() {
      return this._state;
    }
    setScrollPositionNow(e) {
      let t = this._state.withScrollPosition(e);
      ((this._smoothScrolling &&= (this._smoothScrolling.dispose(), null)),
        this._setState(t, !1));
    }
    setScrollPositionSmooth(e, t) {
      if (this._smoothScrollDuration === 0) return this.setScrollPositionNow(e);
      if (this._smoothScrolling) {
        e = {
          scrollLeft:
            typeof e.scrollLeft > `u`
              ? this._smoothScrolling.to.scrollLeft
              : e.scrollLeft,
          scrollTop:
            typeof e.scrollTop > `u`
              ? this._smoothScrolling.to.scrollTop
              : e.scrollTop,
        };
        let n = this._state.withScrollPosition(e);
        if (
          this._smoothScrolling.to.scrollLeft === n.scrollLeft &&
          this._smoothScrolling.to.scrollTop === n.scrollTop
        )
          return;
        let r;
        ((r = t
          ? new pa(
              this._smoothScrolling.from,
              n,
              this._smoothScrolling.startTime,
              this._smoothScrolling.duration,
            )
          : this._smoothScrolling.combine(
              this._state,
              n,
              this._smoothScrollDuration,
            )),
          this._smoothScrolling.dispose(),
          (this._smoothScrolling = r));
      } else {
        let t = this._state.withScrollPosition(e);
        this._smoothScrolling = pa.start(
          this._state,
          t,
          this._smoothScrollDuration,
        );
      }
      this._smoothScrolling.animationFrameDisposable =
        this._scheduleAtNextAnimationFrame(() => {
          this._smoothScrolling &&
            ((this._smoothScrolling.animationFrameDisposable = null),
            this._performSmoothScrolling());
        });
    }
    hasPendingScrollAnimation() {
      return !!this._smoothScrolling;
    }
    _performSmoothScrolling() {
      if (!this._smoothScrolling) return;
      let e = this._smoothScrolling.tick(),
        t = this._state.withScrollPosition(e);
      if ((this._setState(t, !0), this._smoothScrolling)) {
        if (e.isDone) {
          (this._smoothScrolling.dispose(), (this._smoothScrolling = null));
          return;
        }
        this._smoothScrolling.animationFrameDisposable =
          this._scheduleAtNextAnimationFrame(() => {
            this._smoothScrolling &&
              ((this._smoothScrolling.animationFrameDisposable = null),
              this._performSmoothScrolling());
          });
      }
    }
    _setState(e, t) {
      let n = this._state;
      n.equals(e) ||
        ((this._state = e),
        this._onScroll.fire(this._state.createScrollEvent(n, t)));
    }
  },
  ua = class {
    constructor(e, t, n) {
      ((this.scrollLeft = e), (this.scrollTop = t), (this.isDone = n));
    }
  };
function da(e, t) {
  let n = t - e;
  return function (t) {
    return e + n * ha(t);
  };
}
function fa(e, t, n) {
  return function (r) {
    return r < n ? e(r / n) : t((r - n) / (1 - n));
  };
}
var pa = class e {
  constructor(e, t, n, r) {
    ((this.from = e),
      (this.to = t),
      (this.duration = r),
      (this.startTime = n),
      (this.animationFrameDisposable = null),
      this._initAnimations());
  }
  _initAnimations() {
    ((this.scrollLeft = this._initAnimation(
      this.from.scrollLeft,
      this.to.scrollLeft,
      this.to.width,
    )),
      (this.scrollTop = this._initAnimation(
        this.from.scrollTop,
        this.to.scrollTop,
        this.to.height,
      )));
  }
  _initAnimation(e, t, n) {
    if (Math.abs(e - t) > 2.5 * n) {
      let r, i;
      return (
        e < t
          ? ((r = e + 0.75 * n), (i = t - 0.75 * n))
          : ((r = e - 0.75 * n), (i = t + 0.75 * n)),
        fa(da(e, r), da(i, t), 0.33)
      );
    }
    return da(e, t);
  }
  dispose() {
    this.animationFrameDisposable !== null &&
      (this.animationFrameDisposable.dispose(),
      (this.animationFrameDisposable = null));
  }
  acceptScrollDimensions(e) {
    ((this.to = e.withScrollPosition(this.to)), this._initAnimations());
  }
  tick() {
    return this._tick(Date.now());
  }
  _tick(e) {
    let t = (e - this.startTime) / this.duration;
    return t < 1
      ? new ua(this.scrollLeft(t), this.scrollTop(t), !1)
      : new ua(this.to.scrollLeft, this.to.scrollTop, !0);
  }
  combine(t, n, r) {
    return e.start(t, n, r);
  }
  static start(t, n, r) {
    return ((r += 10), new e(t, n, Date.now() - 10, r));
  }
};
function ma(e) {
  return e ** 3;
}
function ha(e) {
  return 1 - ma(1 - e);
}
var ga = class extends F {
    constructor(e, t, n) {
      (super(),
        (this._visibility = e),
        (this._visibleClassName = t),
        (this._invisibleClassName = n),
        (this._domNode = null),
        (this._isVisible = !1),
        (this._isNeeded = !1),
        (this._rawShouldBeVisible = !1),
        (this._shouldBeVisible = !1),
        (this._revealTimer = this._register(new li())));
    }
    setVisibility(e) {
      this._visibility !== e &&
        ((this._visibility = e), this._updateShouldBeVisible());
    }
    setShouldBeVisible(e) {
      ((this._rawShouldBeVisible = e), this._updateShouldBeVisible());
    }
    _applyVisibilitySetting() {
      return this._visibility === 2
        ? !1
        : this._visibility === 3
          ? !0
          : this._rawShouldBeVisible;
    }
    _updateShouldBeVisible() {
      let e = this._applyVisibilitySetting();
      this._shouldBeVisible !== e &&
        ((this._shouldBeVisible = e), this.ensureVisibility());
    }
    setIsNeeded(e) {
      this._isNeeded !== e && ((this._isNeeded = e), this.ensureVisibility());
    }
    setDomNode(e) {
      ((this._domNode = e),
        this._domNode.setClassName(this._invisibleClassName),
        this.setShouldBeVisible(!1));
    }
    ensureVisibility() {
      if (!this._isNeeded) {
        this._hide(!1);
        return;
      }
      this._shouldBeVisible ? this._reveal() : this._hide(!0);
    }
    _reveal() {
      this._isVisible ||
        ((this._isVisible = !0),
        this._revealTimer.setIfNotSet(() => {
          this._domNode?.setClassName(this._visibleClassName);
        }, 0));
    }
    _hide(e) {
      (this._revealTimer.cancel(),
        this._isVisible &&
          ((this._isVisible = !1),
          this._domNode?.setClassName(
            this._invisibleClassName + (e ? ` fade` : ``),
          )));
    }
  },
  _a = 140,
  va = class extends aa {
    constructor(e) {
      (super(),
        (this._lazyRender = e.lazyRender),
        (this._host = e.host),
        (this._scrollable = e.scrollable),
        (this._scrollByPage = e.scrollByPage),
        (this._scrollbarState = e.scrollbarState),
        (this._visibilityController = this._register(
          new ga(
            e.visibility,
            `visible scrollbar ` + e.extraScrollbarClassName,
            `invisible scrollbar ` + e.extraScrollbarClassName,
          ),
        )),
        this._visibilityController.setIsNeeded(this._scrollbarState.isNeeded()),
        (this._pointerMoveMonitor = this._register(new ea())),
        (this._shouldRender = !0),
        (this.domNode = $i(document.createElement(`div`))),
        this.domNode.setAttribute(`role`, `presentation`),
        this.domNode.setAttribute(`aria-hidden`, `true`),
        this._visibilityController.setDomNode(this.domNode),
        this.domNode.setPosition(`absolute`),
        this._register(
          R(this.domNode.domNode, z.POINTER_DOWN, (e) =>
            this._domNodePointerDown(e),
          ),
        ));
    }
    _createArrow(e) {
      let t = this._register(new sa(e));
      (this.domNode.domNode.appendChild(t.bgDomNode),
        this.domNode.domNode.appendChild(t.domNode));
    }
    _createSlider(e, t, n, r) {
      ((this.slider = $i(document.createElement(`div`))),
        this.slider.setClassName(`slider`),
        this.slider.setPosition(`absolute`),
        this.slider.setTop(e),
        this.slider.setLeft(t),
        typeof n == `number` && this.slider.setWidth(n),
        typeof r == `number` && this.slider.setHeight(r),
        this.slider.setLayerHinting(!0),
        this.slider.setContain(`strict`),
        this.domNode.domNode.appendChild(this.slider.domNode),
        this._register(
          R(this.slider.domNode, z.POINTER_DOWN, (e) => {
            e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e));
          }),
        ),
        this.onclick(this.slider.domNode, (e) => {
          e.leftButton && e.stopPropagation();
        }));
    }
    _onElementSize(e) {
      return (
        this._scrollbarState.setVisibleSize(e) &&
          (this._visibilityController.setIsNeeded(
            this._scrollbarState.isNeeded(),
          ),
          (this._shouldRender = !0),
          this._lazyRender || this.render()),
        this._shouldRender
      );
    }
    _onElementScrollSize(e) {
      return (
        this._scrollbarState.setScrollSize(e) &&
          (this._visibilityController.setIsNeeded(
            this._scrollbarState.isNeeded(),
          ),
          (this._shouldRender = !0),
          this._lazyRender || this.render()),
        this._shouldRender
      );
    }
    _onElementScrollPosition(e) {
      return (
        this._scrollbarState.setScrollPosition(e) &&
          (this._visibilityController.setIsNeeded(
            this._scrollbarState.isNeeded(),
          ),
          (this._shouldRender = !0),
          this._lazyRender || this.render()),
        this._shouldRender
      );
    }
    beginReveal() {
      this._visibilityController.setShouldBeVisible(!0);
    }
    beginHide() {
      this._visibilityController.setShouldBeVisible(!1);
    }
    render() {
      this._shouldRender &&
        ((this._shouldRender = !1),
        this._renderDomNode(
          this._scrollbarState.getRectangleLargeSize(),
          this._scrollbarState.getRectangleSmallSize(),
        ),
        this._updateSlider(
          this._scrollbarState.getSliderSize(),
          this._scrollbarState.getArrowSize() +
            this._scrollbarState.getSliderPosition(),
        ));
    }
    _domNodePointerDown(e) {
      e.target === this.domNode.domNode && this._onPointerDown(e);
    }
    delegatePointerDown(e) {
      let t = this.domNode.domNode.getClientRects()[0].top,
        n = t + this._scrollbarState.getSliderPosition(),
        r =
          t +
          this._scrollbarState.getSliderPosition() +
          this._scrollbarState.getSliderSize(),
        i = this._sliderPointerPosition(e);
      n <= i && i <= r
        ? e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e))
        : this._onPointerDown(e);
    }
    _onPointerDown(e) {
      let t, n;
      if (
        e.target === this.domNode.domNode &&
        typeof e.offsetX == `number` &&
        typeof e.offsetY == `number`
      )
        ((t = e.offsetX), (n = e.offsetY));
      else {
        let r = qi(this.domNode.domNode);
        ((t = e.pageX - r.left), (n = e.pageY - r.top));
      }
      let r = this._pointerDownRelativePosition(t, n);
      (this._setDesiredScrollPositionNow(
        this._scrollByPage
          ? this._scrollbarState.getDesiredScrollPositionFromOffsetPaged(r)
          : this._scrollbarState.getDesiredScrollPositionFromOffset(r),
      ),
        e.button === 0 && (e.preventDefault(), this._sliderPointerDown(e)));
    }
    _sliderPointerDown(e) {
      if (!e.target || !(e.target instanceof Element)) return;
      let t = this._sliderPointerPosition(e),
        n = this._sliderOrthogonalPointerPosition(e),
        r = this._scrollbarState.clone();
      (this.slider.toggleClassName(`active`, !0),
        this._pointerMoveMonitor.startMonitoring(
          e.target,
          e.pointerId,
          e.buttons,
          (e) => {
            let i = this._sliderOrthogonalPointerPosition(e),
              a = Math.abs(i - n);
            if (jr && a > _a) {
              this._setDesiredScrollPositionNow(r.getScrollPosition());
              return;
            }
            let o = this._sliderPointerPosition(e) - t;
            this._setDesiredScrollPositionNow(
              r.getDesiredScrollPositionFromDelta(o),
            );
          },
          () => {
            (this.slider.toggleClassName(`active`, !1), this._host.onDragEnd());
          },
        ),
        this._host.onDragStart());
    }
    _setDesiredScrollPositionNow(e) {
      let t = {};
      (this.writeScrollPosition(t, e),
        this._scrollable.setScrollPositionNow(t));
    }
    updateScrollbarSize(e) {
      (this._updateScrollbarSize(e),
        this._scrollbarState.setScrollbarSize(e),
        (this._shouldRender = !0),
        this._lazyRender || this.render());
    }
    isNeeded() {
      return this._scrollbarState.isNeeded();
    }
  },
  ya = class e {
    constructor(e, t, n, r, i, a) {
      ((this._scrollbarSize = Math.round(t)),
        (this._oppositeScrollbarSize = Math.round(n)),
        (this._arrowSize = Math.round(e)),
        (this._visibleSize = r),
        (this._scrollSize = i),
        (this._scrollPosition = a),
        (this._computedAvailableSize = 0),
        (this._computedIsNeeded = !1),
        (this._computedSliderSize = 0),
        (this._computedSliderRatio = 0),
        (this._computedSliderPosition = 0),
        this._refreshComputedValues());
    }
    clone() {
      return new e(
        this._arrowSize,
        this._scrollbarSize,
        this._oppositeScrollbarSize,
        this._visibleSize,
        this._scrollSize,
        this._scrollPosition,
      );
    }
    setVisibleSize(e) {
      let t = Math.round(e);
      return this._visibleSize === t
        ? !1
        : ((this._visibleSize = t), this._refreshComputedValues(), !0);
    }
    setScrollSize(e) {
      let t = Math.round(e);
      return this._scrollSize === t
        ? !1
        : ((this._scrollSize = t), this._refreshComputedValues(), !0);
    }
    setScrollPosition(e) {
      let t = Math.round(e);
      return this._scrollPosition === t
        ? !1
        : ((this._scrollPosition = t), this._refreshComputedValues(), !0);
    }
    setScrollbarSize(e) {
      this._scrollbarSize = Math.round(e);
    }
    setOppositeScrollbarSize(e) {
      this._oppositeScrollbarSize = Math.round(e);
    }
    static _computeValues(e, t, n, r, i) {
      let a = Math.max(0, n - e),
        o = Math.max(0, a - 2 * t),
        s = r > 0 && r > n;
      if (!s)
        return {
          computedAvailableSize: Math.round(a),
          computedIsNeeded: s,
          computedSliderSize: Math.round(o),
          computedSliderRatio: 0,
          computedSliderPosition: 0,
        };
      let c = Math.round(Math.max(20, Math.floor((n * o) / r))),
        l = (o - c) / (r - n),
        u = i * l;
      return {
        computedAvailableSize: Math.round(a),
        computedIsNeeded: s,
        computedSliderSize: Math.round(c),
        computedSliderRatio: l,
        computedSliderPosition: Math.round(u),
      };
    }
    _refreshComputedValues() {
      let t = e._computeValues(
        this._oppositeScrollbarSize,
        this._arrowSize,
        this._visibleSize,
        this._scrollSize,
        this._scrollPosition,
      );
      ((this._computedAvailableSize = t.computedAvailableSize),
        (this._computedIsNeeded = t.computedIsNeeded),
        (this._computedSliderSize = t.computedSliderSize),
        (this._computedSliderRatio = t.computedSliderRatio),
        (this._computedSliderPosition = t.computedSliderPosition));
    }
    getArrowSize() {
      return this._arrowSize;
    }
    getScrollPosition() {
      return this._scrollPosition;
    }
    getRectangleLargeSize() {
      return this._computedAvailableSize;
    }
    getRectangleSmallSize() {
      return this._scrollbarSize;
    }
    isNeeded() {
      return this._computedIsNeeded;
    }
    getSliderSize() {
      return this._computedSliderSize;
    }
    getSliderPosition() {
      return this._computedSliderPosition;
    }
    getDesiredScrollPositionFromOffset(e) {
      if (!this._computedIsNeeded) return 0;
      let t = e - this._arrowSize - this._computedSliderSize / 2;
      return Math.round(t / this._computedSliderRatio);
    }
    getDesiredScrollPositionFromOffsetPaged(e) {
      if (!this._computedIsNeeded) return 0;
      let t = e - this._arrowSize,
        n = this._scrollPosition;
      return (
        t < this._computedSliderPosition
          ? (n -= this._visibleSize)
          : (n += this._visibleSize),
        n
      );
    }
    getDesiredScrollPositionFromDelta(e) {
      if (!this._computedIsNeeded) return 0;
      let t = this._computedSliderPosition + e;
      return Math.round(t / this._computedSliderRatio);
    }
  },
  ba = class extends va {
    constructor(e, t, n) {
      let r = e.getScrollDimensions(),
        i = e.getCurrentScrollPosition();
      if (
        (super({
          lazyRender: t.lazyRender,
          host: n,
          scrollbarState: new ya(
            t.horizontalHasArrows ? t.arrowSize : 0,
            t.horizontal === 2 ? 0 : t.horizontalScrollbarSize,
            t.vertical === 2 ? 0 : t.verticalScrollbarSize,
            r.width,
            r.scrollWidth,
            i.scrollLeft,
          ),
          visibility: t.horizontal,
          extraScrollbarClassName: `horizontal`,
          scrollable: e,
          scrollByPage: t.scrollByPage,
        }),
        t.horizontalHasArrows)
      )
        throw Error(`horizontalHasArrows is not supported in xterm.js`);
      this._createSlider(
        Math.floor((t.horizontalScrollbarSize - t.horizontalSliderSize) / 2),
        0,
        void 0,
        t.horizontalSliderSize,
      );
    }
    _updateSlider(e, t) {
      (this.slider.setWidth(e), this.slider.setLeft(t));
    }
    _renderDomNode(e, t) {
      (this.domNode.setWidth(e),
        this.domNode.setHeight(t),
        this.domNode.setLeft(0),
        this.domNode.setBottom(0));
    }
    onDidScroll(e) {
      return (
        (this._shouldRender =
          this._onElementScrollSize(e.scrollWidth) || this._shouldRender),
        (this._shouldRender =
          this._onElementScrollPosition(e.scrollLeft) || this._shouldRender),
        (this._shouldRender =
          this._onElementSize(e.width) || this._shouldRender),
        this._shouldRender
      );
    }
    _pointerDownRelativePosition(e, t) {
      return e;
    }
    _sliderPointerPosition(e) {
      return e.pageX;
    }
    _sliderOrthogonalPointerPosition(e) {
      return e.pageY;
    }
    _updateScrollbarSize(e) {
      this.slider.setHeight(e);
    }
    writeScrollPosition(e, t) {
      e.scrollLeft = t;
    }
    updateOptions(e) {
      (this.updateScrollbarSize(
        e.horizontal === 2 ? 0 : e.horizontalScrollbarSize,
      ),
        this._scrollbarState.setOppositeScrollbarSize(
          e.vertical === 2 ? 0 : e.verticalScrollbarSize,
        ),
        this._visibilityController.setVisibility(e.horizontal),
        (this._scrollByPage = e.scrollByPage));
    }
  },
  xa = class extends va {
    constructor(e, t, n) {
      let r = e.getScrollDimensions(),
        i = e.getCurrentScrollPosition();
      if (
        (super({
          lazyRender: t.lazyRender,
          host: n,
          scrollbarState: new ya(
            t.verticalHasArrows ? t.arrowSize : 0,
            t.vertical === 2 ? 0 : t.verticalScrollbarSize,
            0,
            r.height,
            r.scrollHeight,
            i.scrollTop,
          ),
          visibility: t.vertical,
          extraScrollbarClassName: `vertical`,
          scrollable: e,
          scrollByPage: t.scrollByPage,
        }),
        t.verticalHasArrows)
      )
        throw Error(`horizontalHasArrows is not supported in xterm.js`);
      this._createSlider(
        0,
        Math.floor((t.verticalScrollbarSize - t.verticalSliderSize) / 2),
        t.verticalSliderSize,
        void 0,
      );
    }
    _updateSlider(e, t) {
      (this.slider.setHeight(e), this.slider.setTop(t));
    }
    _renderDomNode(e, t) {
      (this.domNode.setWidth(t),
        this.domNode.setHeight(e),
        this.domNode.setRight(0),
        this.domNode.setTop(0));
    }
    onDidScroll(e) {
      return (
        (this._shouldRender =
          this._onElementScrollSize(e.scrollHeight) || this._shouldRender),
        (this._shouldRender =
          this._onElementScrollPosition(e.scrollTop) || this._shouldRender),
        (this._shouldRender =
          this._onElementSize(e.height) || this._shouldRender),
        this._shouldRender
      );
    }
    _pointerDownRelativePosition(e, t) {
      return t;
    }
    _sliderPointerPosition(e) {
      return e.pageY;
    }
    _sliderOrthogonalPointerPosition(e) {
      return e.pageX;
    }
    _updateScrollbarSize(e) {
      this.slider.setWidth(e);
    }
    writeScrollPosition(e, t) {
      e.scrollTop = t;
    }
    updateOptions(e) {
      (this.updateScrollbarSize(e.vertical === 2 ? 0 : e.verticalScrollbarSize),
        this._scrollbarState.setOppositeScrollbarSize(0),
        this._visibilityController.setVisibility(e.vertical),
        (this._scrollByPage = e.scrollByPage));
    }
  },
  Sa = 500,
  Ca = 50,
  wa = !0,
  Ta = class {
    constructor(e, t, n) {
      ((this.timestamp = e),
        (this.deltaX = t),
        (this.deltaY = n),
        (this.score = 0));
    }
  },
  Ea = class {
    constructor() {
      ((this._capacity = 5),
        (this._memory = []),
        (this._front = -1),
        (this._rear = -1));
    }
    isPhysicalMouseWheel() {
      if (this._front === -1 && this._rear === -1) return !1;
      let e = 1,
        t = 0,
        n = 1,
        r = this._rear;
      do {
        let i = r === this._front ? e : 2 ** -n;
        if (((e -= i), (t += this._memory[r].score * i), r === this._front))
          break;
        ((r = (this._capacity + r - 1) % this._capacity), n++);
      } while (!0);
      return t <= 0.5;
    }
    acceptStandardWheelEvent(e) {
      if (gr) {
        let t = fr(ki(e.browserEvent));
        this.accept(Date.now(), e.deltaX * t, e.deltaY * t);
      } else this.accept(Date.now(), e.deltaX, e.deltaY);
    }
    accept(e, t, n) {
      let r = null,
        i = new Ta(e, t, n);
      (this._front === -1 && this._rear === -1
        ? ((this._memory[0] = i), (this._front = 0), (this._rear = 0))
        : ((r = this._memory[this._rear]),
          (this._rear = (this._rear + 1) % this._capacity),
          this._rear === this._front &&
            (this._front = (this._front + 1) % this._capacity),
          (this._memory[this._rear] = i)),
        (i.score = this._computeScore(i, r)));
    }
    _computeScore(e, t) {
      if (Math.abs(e.deltaX) > 0 && Math.abs(e.deltaY) > 0) return 1;
      let n = 0.5;
      if (
        ((!this._isAlmostInt(e.deltaX) || !this._isAlmostInt(e.deltaY)) &&
          (n += 0.25),
        t)
      ) {
        let r = Math.abs(e.deltaX),
          i = Math.abs(e.deltaY),
          a = Math.abs(t.deltaX),
          o = Math.abs(t.deltaY),
          s = Math.max(Math.min(r, a), 1),
          c = Math.max(Math.min(i, o), 1),
          l = Math.max(r, a),
          u = Math.max(i, o);
        l % s === 0 && u % c === 0 && (n -= 0.5);
      }
      return Math.min(Math.max(n, 0), 1);
    }
    _isAlmostInt(e) {
      return Math.abs(Math.round(e) - e) < 0.01;
    }
  };
Ea.INSTANCE = new Ea();
var Da = Ea,
  Oa = class extends aa {
    constructor(e, t, n) {
      (super(),
        (this._onScroll = this._register(new L())),
        (this.onScroll = this._onScroll.event),
        (this._onWillScroll = this._register(new L())),
        (this.onWillScroll = this._onWillScroll.event),
        (this._options = Aa(t)),
        (this._scrollable = n),
        this._register(
          this._scrollable.onScroll((e) => {
            (this._onWillScroll.fire(e),
              this._onDidScroll(e),
              this._onScroll.fire(e));
          }),
        ));
      let r = {
        onMouseWheel: (e) => this._onMouseWheel(e),
        onDragStart: () => this._onDragStart(),
        onDragEnd: () => this._onDragEnd(),
      };
      ((this._verticalScrollbar = this._register(
        new xa(this._scrollable, this._options, r),
      )),
        (this._horizontalScrollbar = this._register(
          new ba(this._scrollable, this._options, r),
        )),
        (this._domNode = document.createElement(`div`)),
        (this._domNode.className =
          `xterm-scrollable-element ` + this._options.className),
        this._domNode.setAttribute(`role`, `presentation`),
        (this._domNode.style.position = `relative`),
        this._domNode.appendChild(e),
        this._domNode.appendChild(this._horizontalScrollbar.domNode.domNode),
        this._domNode.appendChild(this._verticalScrollbar.domNode.domNode),
        this._options.useShadows
          ? ((this._leftShadowDomNode = $i(document.createElement(`div`))),
            this._leftShadowDomNode.setClassName(`shadow`),
            this._domNode.appendChild(this._leftShadowDomNode.domNode),
            (this._topShadowDomNode = $i(document.createElement(`div`))),
            this._topShadowDomNode.setClassName(`shadow`),
            this._domNode.appendChild(this._topShadowDomNode.domNode),
            (this._topLeftShadowDomNode = $i(document.createElement(`div`))),
            this._topLeftShadowDomNode.setClassName(`shadow`),
            this._domNode.appendChild(this._topLeftShadowDomNode.domNode))
          : ((this._leftShadowDomNode = null),
            (this._topShadowDomNode = null),
            (this._topLeftShadowDomNode = null)),
        (this._listenOnDomNode =
          this._options.listenOnDomNode || this._domNode),
        (this._mouseWheelToDispose = []),
        this._setListeningToMouseWheel(this._options.handleMouseWheel),
        this.onmouseover(this._listenOnDomNode, (e) => this._onMouseOver(e)),
        this.onmouseleave(this._listenOnDomNode, (e) => this._onMouseLeave(e)),
        (this._hideTimeout = this._register(new li())),
        (this._isDragging = !1),
        (this._mouseIsOver = !1),
        (this._shouldRender = !0),
        (this._revealOnScroll = !0));
    }
    get options() {
      return this._options;
    }
    dispose() {
      ((this._mouseWheelToDispose = Fn(this._mouseWheelToDispose)),
        super.dispose());
    }
    getDomNode() {
      return this._domNode;
    }
    getOverviewRulerLayoutInfo() {
      return {
        parent: this._domNode,
        insertBefore: this._verticalScrollbar.domNode.domNode,
      };
    }
    delegateVerticalScrollbarPointerDown(e) {
      this._verticalScrollbar.delegatePointerDown(e);
    }
    getScrollDimensions() {
      return this._scrollable.getScrollDimensions();
    }
    setScrollDimensions(e) {
      this._scrollable.setScrollDimensions(e, !1);
    }
    updateClassName(e) {
      ((this._options.className = e),
        Mr && (this._options.className += ` mac`),
        (this._domNode.className =
          `xterm-scrollable-element ` + this._options.className));
    }
    updateOptions(e) {
      (typeof e.handleMouseWheel < `u` &&
        ((this._options.handleMouseWheel = e.handleMouseWheel),
        this._setListeningToMouseWheel(this._options.handleMouseWheel)),
        typeof e.mouseWheelScrollSensitivity < `u` &&
          (this._options.mouseWheelScrollSensitivity =
            e.mouseWheelScrollSensitivity),
        typeof e.fastScrollSensitivity < `u` &&
          (this._options.fastScrollSensitivity = e.fastScrollSensitivity),
        typeof e.scrollPredominantAxis < `u` &&
          (this._options.scrollPredominantAxis = e.scrollPredominantAxis),
        typeof e.horizontal < `u` && (this._options.horizontal = e.horizontal),
        typeof e.vertical < `u` && (this._options.vertical = e.vertical),
        typeof e.horizontalScrollbarSize < `u` &&
          (this._options.horizontalScrollbarSize = e.horizontalScrollbarSize),
        typeof e.verticalScrollbarSize < `u` &&
          (this._options.verticalScrollbarSize = e.verticalScrollbarSize),
        typeof e.scrollByPage < `u` &&
          (this._options.scrollByPage = e.scrollByPage),
        this._horizontalScrollbar.updateOptions(this._options),
        this._verticalScrollbar.updateOptions(this._options),
        this._options.lazyRender || this._render());
    }
    setRevealOnScroll(e) {
      this._revealOnScroll = e;
    }
    delegateScrollFromMouseWheelEvent(e) {
      this._onMouseWheel(new ai(e));
    }
    _setListeningToMouseWheel(e) {
      this._mouseWheelToDispose.length > 0 !== e &&
        ((this._mouseWheelToDispose = Fn(this._mouseWheelToDispose)), e) &&
        this._mouseWheelToDispose.push(
          R(
            this._listenOnDomNode,
            z.MOUSE_WHEEL,
            (e) => {
              this._onMouseWheel(new ai(e));
            },
            { passive: !1 },
          ),
        );
    }
    _onMouseWheel(e) {
      if (e.browserEvent?.defaultPrevented) return;
      let t = Da.INSTANCE;
      wa && t.acceptStandardWheelEvent(e);
      let n = !1;
      if (e.deltaY || e.deltaX) {
        let r = e.deltaY * this._options.mouseWheelScrollSensitivity,
          i = e.deltaX * this._options.mouseWheelScrollSensitivity;
        (this._options.scrollPredominantAxis &&
          (this._options.scrollYToX && i + r === 0
            ? (i = r = 0)
            : Math.abs(r) >= Math.abs(i)
              ? (i = 0)
              : (r = 0)),
          this._options.flipAxes && ([r, i] = [i, r]));
        let a = !Mr && e.browserEvent && e.browserEvent.shiftKey;
        ((this._options.scrollYToX || a) && !i && ((i = r), (r = 0)),
          e.browserEvent &&
            e.browserEvent.altKey &&
            ((i *= this._options.fastScrollSensitivity),
            (r *= this._options.fastScrollSensitivity)));
        let o = this._scrollable.getFutureScrollPosition(),
          s = {};
        if (r) {
          let e = Ca * r,
            t = o.scrollTop - (e < 0 ? Math.floor(e) : Math.ceil(e));
          this._verticalScrollbar.writeScrollPosition(s, t);
        }
        if (i) {
          let e = Ca * i,
            t = o.scrollLeft - (e < 0 ? Math.floor(e) : Math.ceil(e));
          this._horizontalScrollbar.writeScrollPosition(s, t);
        }
        ((s = this._scrollable.validateScrollPosition(s)),
          (o.scrollLeft !== s.scrollLeft || o.scrollTop !== s.scrollTop) &&
            (wa &&
            this._options.mouseWheelSmoothScroll &&
            t.isPhysicalMouseWheel()
              ? this._scrollable.setScrollPositionSmooth(s)
              : this._scrollable.setScrollPositionNow(s),
            (n = !0)));
      }
      let r = n;
      (!r && this._options.alwaysConsumeMouseWheel && (r = !0),
        !r &&
          this._options.consumeMouseWheelIfScrollbarIsNeeded &&
          (this._verticalScrollbar.isNeeded() ||
            this._horizontalScrollbar.isNeeded()) &&
          (r = !0),
        r && (e.preventDefault(), e.stopPropagation()));
    }
    _onDidScroll(e) {
      ((this._shouldRender =
        this._horizontalScrollbar.onDidScroll(e) || this._shouldRender),
        (this._shouldRender =
          this._verticalScrollbar.onDidScroll(e) || this._shouldRender),
        this._options.useShadows && (this._shouldRender = !0),
        this._revealOnScroll && this._reveal(),
        this._options.lazyRender || this._render());
    }
    renderNow() {
      if (!this._options.lazyRender)
        throw Error("Please use `lazyRender` together with `renderNow`!");
      this._render();
    }
    _render() {
      if (
        this._shouldRender &&
        ((this._shouldRender = !1),
        this._horizontalScrollbar.render(),
        this._verticalScrollbar.render(),
        this._options.useShadows)
      ) {
        let e = this._scrollable.getCurrentScrollPosition(),
          t = e.scrollTop > 0,
          n = e.scrollLeft > 0,
          r = n ? ` left` : ``,
          i = t ? ` top` : ``,
          a = n || t ? ` top-left-corner` : ``;
        (this._leftShadowDomNode.setClassName(`shadow${r}`),
          this._topShadowDomNode.setClassName(`shadow${i}`),
          this._topLeftShadowDomNode.setClassName(`shadow${a}${i}${r}`));
      }
    }
    _onDragStart() {
      ((this._isDragging = !0), this._reveal());
    }
    _onDragEnd() {
      ((this._isDragging = !1), this._hide());
    }
    _onMouseLeave(e) {
      ((this._mouseIsOver = !1), this._hide());
    }
    _onMouseOver(e) {
      ((this._mouseIsOver = !0), this._reveal());
    }
    _reveal() {
      (this._verticalScrollbar.beginReveal(),
        this._horizontalScrollbar.beginReveal(),
        this._scheduleHide());
    }
    _hide() {
      !this._mouseIsOver &&
        !this._isDragging &&
        (this._verticalScrollbar.beginHide(),
        this._horizontalScrollbar.beginHide());
    }
    _scheduleHide() {
      !this._mouseIsOver &&
        !this._isDragging &&
        this._hideTimeout.cancelAndSet(() => this._hide(), Sa);
    }
  },
  ka = class extends Oa {
    constructor(e, t, n) {
      super(e, t, n);
    }
    setScrollPosition(e) {
      e.reuseAnimation
        ? this._scrollable.setScrollPositionSmooth(e, e.reuseAnimation)
        : this._scrollable.setScrollPositionNow(e);
    }
    getScrollPosition() {
      return this._scrollable.getCurrentScrollPosition();
    }
  };
function Aa(e) {
  let t = {
    lazyRender: typeof e.lazyRender < `u` ? e.lazyRender : !1,
    className: typeof e.className < `u` ? e.className : ``,
    useShadows: typeof e.useShadows < `u` ? e.useShadows : !0,
    handleMouseWheel: typeof e.handleMouseWheel < `u` ? e.handleMouseWheel : !0,
    flipAxes: typeof e.flipAxes < `u` ? e.flipAxes : !1,
    consumeMouseWheelIfScrollbarIsNeeded:
      typeof e.consumeMouseWheelIfScrollbarIsNeeded < `u`
        ? e.consumeMouseWheelIfScrollbarIsNeeded
        : !1,
    alwaysConsumeMouseWheel:
      typeof e.alwaysConsumeMouseWheel < `u` ? e.alwaysConsumeMouseWheel : !1,
    scrollYToX: typeof e.scrollYToX < `u` ? e.scrollYToX : !1,
    mouseWheelScrollSensitivity:
      typeof e.mouseWheelScrollSensitivity < `u`
        ? e.mouseWheelScrollSensitivity
        : 1,
    fastScrollSensitivity:
      typeof e.fastScrollSensitivity < `u` ? e.fastScrollSensitivity : 5,
    scrollPredominantAxis:
      typeof e.scrollPredominantAxis < `u` ? e.scrollPredominantAxis : !0,
    mouseWheelSmoothScroll:
      typeof e.mouseWheelSmoothScroll < `u` ? e.mouseWheelSmoothScroll : !0,
    arrowSize: typeof e.arrowSize < `u` ? e.arrowSize : 11,
    listenOnDomNode: typeof e.listenOnDomNode < `u` ? e.listenOnDomNode : null,
    horizontal: typeof e.horizontal < `u` ? e.horizontal : 1,
    horizontalScrollbarSize:
      typeof e.horizontalScrollbarSize < `u` ? e.horizontalScrollbarSize : 10,
    horizontalSliderSize:
      typeof e.horizontalSliderSize < `u` ? e.horizontalSliderSize : 0,
    horizontalHasArrows:
      typeof e.horizontalHasArrows < `u` ? e.horizontalHasArrows : !1,
    vertical: typeof e.vertical < `u` ? e.vertical : 1,
    verticalScrollbarSize:
      typeof e.verticalScrollbarSize < `u` ? e.verticalScrollbarSize : 10,
    verticalHasArrows:
      typeof e.verticalHasArrows < `u` ? e.verticalHasArrows : !1,
    verticalSliderSize:
      typeof e.verticalSliderSize < `u` ? e.verticalSliderSize : 0,
    scrollByPage: typeof e.scrollByPage < `u` ? e.scrollByPage : !1,
  };
  return (
    (t.horizontalSliderSize =
      typeof e.horizontalSliderSize < `u`
        ? e.horizontalSliderSize
        : t.horizontalScrollbarSize),
    (t.verticalSliderSize =
      typeof e.verticalSliderSize < `u`
        ? e.verticalSliderSize
        : t.verticalScrollbarSize),
    Mr && (t.className += ` mac`),
    t
  );
}
var ja = class extends F {
  constructor(e, t, n, r, i, a, o, s) {
    (super(),
      (this._bufferService = n),
      (this._optionsService = o),
      (this._renderService = s),
      (this._onRequestScrollLines = this._register(new L())),
      (this.onRequestScrollLines = this._onRequestScrollLines.event),
      (this._isSyncing = !1),
      (this._isHandlingScroll = !1),
      (this._suppressOnScrollHandler = !1));
    let c = this._register(
      new la({
        forceIntegerValues: !1,
        smoothScrollDuration:
          this._optionsService.rawOptions.smoothScrollDuration,
        scheduleAtNextAnimationFrame: (e) => Ui(r.window, e),
      }),
    );
    (this._register(
      this._optionsService.onSpecificOptionChange(
        `smoothScrollDuration`,
        () => {
          c.setSmoothScrollDuration(
            this._optionsService.rawOptions.smoothScrollDuration,
          );
        },
      ),
    ),
      (this._scrollableElement = this._register(
        new ka(
          t,
          {
            vertical: 1,
            horizontal: 2,
            useShadows: !1,
            mouseWheelSmoothScroll: !0,
            ...this._getChangeOptions(),
          },
          c,
        ),
      )),
      this._register(
        this._optionsService.onMultipleOptionChange(
          [`scrollSensitivity`, `fastScrollSensitivity`, `overviewRuler`],
          () => this._scrollableElement.updateOptions(this._getChangeOptions()),
        ),
      ),
      this._register(
        i.onProtocolChange((e) => {
          this._scrollableElement.updateOptions({
            handleMouseWheel: !(e & 16),
          });
        }),
      ),
      this._scrollableElement.setScrollDimensions({
        height: 0,
        scrollHeight: 0,
      }),
      this._register(
        Jn.runAndSubscribe(a.onChangeColors, () => {
          this._scrollableElement.getDomNode().style.backgroundColor =
            a.colors.background.css;
        }),
      ),
      e.appendChild(this._scrollableElement.getDomNode()),
      this._register(P(() => this._scrollableElement.getDomNode().remove())),
      (this._styleElement = r.mainDocument.createElement(`style`)),
      t.appendChild(this._styleElement),
      this._register(P(() => this._styleElement.remove())),
      this._register(
        Jn.runAndSubscribe(a.onChangeColors, () => {
          this._styleElement.textContent = [
            `.xterm .xterm-scrollable-element > .scrollbar > .slider {`,
            `  background: ${a.colors.scrollbarSliderBackground.css};`,
            `}`,
            `.xterm .xterm-scrollable-element > .scrollbar > .slider:hover {`,
            `  background: ${a.colors.scrollbarSliderHoverBackground.css};`,
            `}`,
            `.xterm .xterm-scrollable-element > .scrollbar > .slider.active {`,
            `  background: ${a.colors.scrollbarSliderActiveBackground.css};`,
            `}`,
          ].join(`
`);
        }),
      ),
      this._register(this._bufferService.onResize(() => this.queueSync())),
      this._register(
        this._bufferService.buffers.onBufferActivate(() => {
          ((this._latestYDisp = void 0), this.queueSync());
        }),
      ),
      this._register(this._bufferService.onScroll(() => this._sync())),
      this._register(
        this._scrollableElement.onScroll((e) => this._handleScroll(e)),
      ));
  }
  scrollLines(e) {
    let t = this._scrollableElement.getScrollPosition();
    this._scrollableElement.setScrollPosition({
      reuseAnimation: !0,
      scrollTop:
        t.scrollTop + e * this._renderService.dimensions.css.cell.height,
    });
  }
  scrollToLine(e, t) {
    (t && (this._latestYDisp = e),
      this._scrollableElement.setScrollPosition({
        reuseAnimation: !t,
        scrollTop: e * this._renderService.dimensions.css.cell.height,
      }));
  }
  _getChangeOptions() {
    return {
      mouseWheelScrollSensitivity:
        this._optionsService.rawOptions.scrollSensitivity,
      fastScrollSensitivity:
        this._optionsService.rawOptions.fastScrollSensitivity,
      verticalScrollbarSize:
        this._optionsService.rawOptions.overviewRuler?.width || 14,
    };
  }
  queueSync(e) {
    (e !== void 0 && (this._latestYDisp = e),
      this._queuedAnimationFrame === void 0 &&
        (this._queuedAnimationFrame = this._renderService.addRefreshCallback(
          () => {
            ((this._queuedAnimationFrame = void 0),
              this._sync(this._latestYDisp));
          },
        )));
  }
  _sync(e = this._bufferService.buffer.ydisp) {
    !this._renderService ||
      this._isSyncing ||
      ((this._isSyncing = !0),
      (this._suppressOnScrollHandler = !0),
      this._scrollableElement.setScrollDimensions({
        height: this._renderService.dimensions.css.canvas.height,
        scrollHeight:
          this._renderService.dimensions.css.cell.height *
          this._bufferService.buffer.lines.length,
      }),
      (this._suppressOnScrollHandler = !1),
      e !== this._latestYDisp &&
        this._scrollableElement.setScrollPosition({
          scrollTop: e * this._renderService.dimensions.css.cell.height,
        }),
      (this._isSyncing = !1));
  }
  _handleScroll(e) {
    if (
      !this._renderService ||
      this._isHandlingScroll ||
      this._suppressOnScrollHandler
    )
      return;
    this._isHandlingScroll = !0;
    let t = Math.round(
        e.scrollTop / this._renderService.dimensions.css.cell.height,
      ),
      n = t - this._bufferService.buffer.ydisp;
    (n !== 0 && ((this._latestYDisp = t), this._onRequestScrollLines.fire(n)),
      (this._isHandlingScroll = !1));
  }
};
ja = j([M(2, Bt), M(3, $t), M(4, Vt), M(5, an), M(6, Kt), M(7, tn)], ja);
var Ma = class extends F {
  constructor(e, t, n, r, i) {
    (super(),
      (this._screenElement = e),
      (this._bufferService = t),
      (this._coreBrowserService = n),
      (this._decorationService = r),
      (this._renderService = i),
      (this._decorationElements = new Map()),
      (this._altBufferIsActive = !1),
      (this._dimensionsChanged = !1),
      (this._container = document.createElement(`div`)),
      this._container.classList.add(`xterm-decoration-container`),
      this._screenElement.appendChild(this._container),
      this._register(
        this._renderService.onRenderedViewportChange(() =>
          this._doRefreshDecorations(),
        ),
      ),
      this._register(
        this._renderService.onDimensionsChange(() => {
          ((this._dimensionsChanged = !0), this._queueRefresh());
        }),
      ),
      this._register(
        this._coreBrowserService.onDprChange(() => this._queueRefresh()),
      ),
      this._register(
        this._bufferService.buffers.onBufferActivate(() => {
          this._altBufferIsActive =
            this._bufferService.buffer === this._bufferService.buffers.alt;
        }),
      ),
      this._register(
        this._decorationService.onDecorationRegistered(() =>
          this._queueRefresh(),
        ),
      ),
      this._register(
        this._decorationService.onDecorationRemoved((e) =>
          this._removeDecoration(e),
        ),
      ),
      this._register(
        P(() => {
          (this._container.remove(), this._decorationElements.clear());
        }),
      ));
  }
  _queueRefresh() {
    this._animationFrame === void 0 &&
      (this._animationFrame = this._renderService.addRefreshCallback(() => {
        (this._doRefreshDecorations(), (this._animationFrame = void 0));
      }));
  }
  _doRefreshDecorations() {
    for (let e of this._decorationService.decorations)
      this._renderDecoration(e);
    this._dimensionsChanged = !1;
  }
  _renderDecoration(e) {
    (this._refreshStyle(e),
      this._dimensionsChanged && this._refreshXPosition(e));
  }
  _createElement(e) {
    let t = this._coreBrowserService.mainDocument.createElement(`div`);
    (t.classList.add(`xterm-decoration`),
      t.classList.toggle(
        `xterm-decoration-top-layer`,
        e?.options?.layer === `top`,
      ),
      (t.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`),
      (t.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`),
      (t.style.top = `${(e.marker.line - this._bufferService.buffers.active.ydisp) * this._renderService.dimensions.css.cell.height}px`),
      (t.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`));
    let n = e.options.x ?? 0;
    return (
      n && n > this._bufferService.cols && (t.style.display = `none`),
      this._refreshXPosition(e, t),
      t
    );
  }
  _refreshStyle(e) {
    let t = e.marker.line - this._bufferService.buffers.active.ydisp;
    if (t < 0 || t >= this._bufferService.rows)
      e.element &&
        ((e.element.style.display = `none`), e.onRenderEmitter.fire(e.element));
    else {
      let n = this._decorationElements.get(e);
      (n ||
        ((n = this._createElement(e)),
        (e.element = n),
        this._decorationElements.set(e, n),
        this._container.appendChild(n),
        e.onDispose(() => {
          (this._decorationElements.delete(e), n.remove());
        })),
        (n.style.display = this._altBufferIsActive ? `none` : `block`),
        this._altBufferIsActive ||
          ((n.style.width = `${Math.round((e.options.width || 1) * this._renderService.dimensions.css.cell.width)}px`),
          (n.style.height = `${(e.options.height || 1) * this._renderService.dimensions.css.cell.height}px`),
          (n.style.top = `${t * this._renderService.dimensions.css.cell.height}px`),
          (n.style.lineHeight = `${this._renderService.dimensions.css.cell.height}px`)),
        e.onRenderEmitter.fire(n));
    }
  }
  _refreshXPosition(e, t = e.element) {
    if (!t) return;
    let n = e.options.x ?? 0;
    (e.options.anchor || `left`) === `right`
      ? (t.style.right = n
          ? `${n * this._renderService.dimensions.css.cell.width}px`
          : ``)
      : (t.style.left = n
          ? `${n * this._renderService.dimensions.css.cell.width}px`
          : ``);
  }
  _removeDecoration(e) {
    (this._decorationElements.get(e)?.remove(),
      this._decorationElements.delete(e),
      e.dispose());
  }
};
Ma = j([M(1, Bt), M(2, $t), M(3, Yt), M(4, tn)], Ma);
var Na = class {
    constructor() {
      ((this._zones = []),
        (this._zonePool = []),
        (this._zonePoolIndex = 0),
        (this._linePadding = { full: 0, left: 0, center: 0, right: 0 }));
    }
    get zones() {
      return (
        (this._zonePool.length = Math.min(
          this._zonePool.length,
          this._zones.length,
        )),
        this._zones
      );
    }
    clear() {
      ((this._zones.length = 0), (this._zonePoolIndex = 0));
    }
    addDecoration(e) {
      if (e.options.overviewRulerOptions) {
        for (let t of this._zones)
          if (
            t.color === e.options.overviewRulerOptions.color &&
            t.position === e.options.overviewRulerOptions.position
          ) {
            if (this._lineIntersectsZone(t, e.marker.line)) return;
            if (
              this._lineAdjacentToZone(
                t,
                e.marker.line,
                e.options.overviewRulerOptions.position,
              )
            ) {
              this._addLineToZone(t, e.marker.line);
              return;
            }
          }
        if (this._zonePoolIndex < this._zonePool.length) {
          ((this._zonePool[this._zonePoolIndex].color =
            e.options.overviewRulerOptions.color),
            (this._zonePool[this._zonePoolIndex].position =
              e.options.overviewRulerOptions.position),
            (this._zonePool[this._zonePoolIndex].startBufferLine =
              e.marker.line),
            (this._zonePool[this._zonePoolIndex].endBufferLine = e.marker.line),
            this._zones.push(this._zonePool[this._zonePoolIndex++]));
          return;
        }
        (this._zones.push({
          color: e.options.overviewRulerOptions.color,
          position: e.options.overviewRulerOptions.position,
          startBufferLine: e.marker.line,
          endBufferLine: e.marker.line,
        }),
          this._zonePool.push(this._zones[this._zones.length - 1]),
          this._zonePoolIndex++);
      }
    }
    setPadding(e) {
      this._linePadding = e;
    }
    _lineIntersectsZone(e, t) {
      return t >= e.startBufferLine && t <= e.endBufferLine;
    }
    _lineAdjacentToZone(e, t, n) {
      return (
        t >= e.startBufferLine - this._linePadding[n || `full`] &&
        t <= e.endBufferLine + this._linePadding[n || `full`]
      );
    }
    _addLineToZone(e, t) {
      ((e.startBufferLine = Math.min(e.startBufferLine, t)),
        (e.endBufferLine = Math.max(e.endBufferLine, t)));
    }
  },
  Pa = { full: 0, left: 0, center: 0, right: 0 },
  Fa = { full: 0, left: 0, center: 0, right: 0 },
  Ia = { full: 0, left: 0, center: 0, right: 0 },
  La = class extends F {
    constructor(e, t, n, r, i, a, o, s) {
      (super(),
        (this._viewportElement = e),
        (this._screenElement = t),
        (this._bufferService = n),
        (this._decorationService = r),
        (this._renderService = i),
        (this._optionsService = a),
        (this._themeService = o),
        (this._coreBrowserService = s),
        (this._colorZoneStore = new Na()),
        (this._shouldUpdateDimensions = !0),
        (this._shouldUpdateAnchor = !0),
        (this._lastKnownBufferLength = 0),
        (this._canvas =
          this._coreBrowserService.mainDocument.createElement(`canvas`)),
        this._canvas.classList.add(`xterm-decoration-overview-ruler`),
        this._refreshCanvasDimensions(),
        this._viewportElement.parentElement?.insertBefore(
          this._canvas,
          this._viewportElement,
        ),
        this._register(P(() => this._canvas?.remove())));
      let c = this._canvas.getContext(`2d`);
      if (c) this._ctx = c;
      else throw Error(`Ctx cannot be null`);
      (this._register(
        this._decorationService.onDecorationRegistered(() =>
          this._queueRefresh(void 0, !0),
        ),
      ),
        this._register(
          this._decorationService.onDecorationRemoved(() =>
            this._queueRefresh(void 0, !0),
          ),
        ),
        this._register(
          this._renderService.onRenderedViewportChange(() =>
            this._queueRefresh(),
          ),
        ),
        this._register(
          this._bufferService.buffers.onBufferActivate(() => {
            this._canvas.style.display =
              this._bufferService.buffer === this._bufferService.buffers.alt
                ? `none`
                : `block`;
          }),
        ),
        this._register(
          this._bufferService.onScroll(() => {
            this._lastKnownBufferLength !==
              this._bufferService.buffers.normal.lines.length &&
              (this._refreshDrawHeightConstants(),
              this._refreshColorZonePadding());
          }),
        ),
        this._register(
          this._renderService.onRender(() => {
            (!this._containerHeight ||
              this._containerHeight !== this._screenElement.clientHeight) &&
              (this._queueRefresh(!0),
              (this._containerHeight = this._screenElement.clientHeight));
          }),
        ),
        this._register(
          this._coreBrowserService.onDprChange(() => this._queueRefresh(!0)),
        ),
        this._register(
          this._optionsService.onSpecificOptionChange(`overviewRuler`, () =>
            this._queueRefresh(!0),
          ),
        ),
        this._register(
          this._themeService.onChangeColors(() => this._queueRefresh()),
        ),
        this._queueRefresh(!0));
    }
    get _width() {
      return this._optionsService.options.overviewRuler?.width || 0;
    }
    _refreshDrawConstants() {
      let e = Math.floor((this._canvas.width - 1) / 3),
        t = Math.ceil((this._canvas.width - 1) / 3);
      ((Fa.full = this._canvas.width),
        (Fa.left = e),
        (Fa.center = t),
        (Fa.right = e),
        this._refreshDrawHeightConstants(),
        (Ia.full = 1),
        (Ia.left = 1),
        (Ia.center = 1 + Fa.left),
        (Ia.right = 1 + Fa.left + Fa.center));
    }
    _refreshDrawHeightConstants() {
      Pa.full = Math.round(2 * this._coreBrowserService.dpr);
      let e = this._canvas.height / this._bufferService.buffer.lines.length,
        t = Math.round(
          Math.max(Math.min(e, 12), 6) * this._coreBrowserService.dpr,
        );
      ((Pa.left = t), (Pa.center = t), (Pa.right = t));
    }
    _refreshColorZonePadding() {
      (this._colorZoneStore.setPadding({
        full: Math.floor(
          (this._bufferService.buffers.active.lines.length /
            (this._canvas.height - 1)) *
            Pa.full,
        ),
        left: Math.floor(
          (this._bufferService.buffers.active.lines.length /
            (this._canvas.height - 1)) *
            Pa.left,
        ),
        center: Math.floor(
          (this._bufferService.buffers.active.lines.length /
            (this._canvas.height - 1)) *
            Pa.center,
        ),
        right: Math.floor(
          (this._bufferService.buffers.active.lines.length /
            (this._canvas.height - 1)) *
            Pa.right,
        ),
      }),
        (this._lastKnownBufferLength =
          this._bufferService.buffers.normal.lines.length));
    }
    _refreshCanvasDimensions() {
      ((this._canvas.style.width = `${this._width}px`),
        (this._canvas.width = Math.round(
          this._width * this._coreBrowserService.dpr,
        )),
        (this._canvas.style.height = `${this._screenElement.clientHeight}px`),
        (this._canvas.height = Math.round(
          this._screenElement.clientHeight * this._coreBrowserService.dpr,
        )),
        this._refreshDrawConstants(),
        this._refreshColorZonePadding());
    }
    _refreshDecorations() {
      (this._shouldUpdateDimensions && this._refreshCanvasDimensions(),
        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height),
        this._colorZoneStore.clear());
      for (let e of this._decorationService.decorations)
        this._colorZoneStore.addDecoration(e);
      ((this._ctx.lineWidth = 1), this._renderRulerOutline());
      let e = this._colorZoneStore.zones;
      for (let t of e) t.position !== `full` && this._renderColorZone(t);
      for (let t of e) t.position === `full` && this._renderColorZone(t);
      ((this._shouldUpdateDimensions = !1), (this._shouldUpdateAnchor = !1));
    }
    _renderRulerOutline() {
      ((this._ctx.fillStyle =
        this._themeService.colors.overviewRulerBorder.css),
        this._ctx.fillRect(0, 0, 1, this._canvas.height),
        this._optionsService.rawOptions.overviewRuler.showTopBorder &&
          this._ctx.fillRect(1, 0, this._canvas.width - 1, 1),
        this._optionsService.rawOptions.overviewRuler.showBottomBorder &&
          this._ctx.fillRect(
            1,
            this._canvas.height - 1,
            this._canvas.width - 1,
            this._canvas.height,
          ));
    }
    _renderColorZone(e) {
      ((this._ctx.fillStyle = e.color),
        this._ctx.fillRect(
          Ia[e.position || `full`],
          Math.round(
            (this._canvas.height - 1) *
              (e.startBufferLine /
                this._bufferService.buffers.active.lines.length) -
              Pa[e.position || `full`] / 2,
          ),
          Fa[e.position || `full`],
          Math.round(
            (this._canvas.height - 1) *
              ((e.endBufferLine - e.startBufferLine) /
                this._bufferService.buffers.active.lines.length) +
              Pa[e.position || `full`],
          ),
        ));
    }
    _queueRefresh(e, t) {
      ((this._shouldUpdateDimensions = e || this._shouldUpdateDimensions),
        (this._shouldUpdateAnchor = t || this._shouldUpdateAnchor),
        this._animationFrame === void 0 &&
          (this._animationFrame =
            this._coreBrowserService.window.requestAnimationFrame(() => {
              (this._refreshDecorations(), (this._animationFrame = void 0));
            })));
    }
  };
La = j([M(2, Bt), M(3, Yt), M(4, tn), M(5, Kt), M(6, an), M(7, $t)], La);
var B;
((e) => (
  (e.NUL = `\0`),
  (e.SOH = ``),
  (e.STX = ``),
  (e.ETX = ``),
  (e.EOT = ``),
  (e.ENQ = ``),
  (e.ACK = ``),
  (e.BEL = `\x07`),
  (e.BS = `\b`),
  (e.HT = `	`),
  (e.LF = `
`),
  (e.VT = `\v`),
  (e.FF = `\f`),
  (e.CR = `\r`),
  (e.SO = ``),
  (e.SI = ``),
  (e.DLE = ``),
  (e.DC1 = ``),
  (e.DC2 = ``),
  (e.DC3 = ``),
  (e.DC4 = ``),
  (e.NAK = ``),
  (e.SYN = ``),
  (e.ETB = ``),
  (e.CAN = ``),
  (e.EM = ``),
  (e.SUB = ``),
  (e.ESC = `\x1B`),
  (e.FS = ``),
  (e.GS = ``),
  (e.RS = ``),
  (e.US = ``),
  (e.SP = ` `),
  (e.DEL = ``)
))((B ||= {}));
var Ra;
((e) => (
  (e.PAD = ``),
  (e.HOP = ``),
  (e.BPH = ``),
  (e.NBH = ``),
  (e.IND = ``),
  (e.NEL = ``),
  (e.SSA = ``),
  (e.ESA = ``),
  (e.HTS = ``),
  (e.HTJ = ``),
  (e.VTS = ``),
  (e.PLD = ``),
  (e.PLU = ``),
  (e.RI = ``),
  (e.SS2 = ``),
  (e.SS3 = ``),
  (e.DCS = ``),
  (e.PU1 = ``),
  (e.PU2 = ``),
  (e.STS = ``),
  (e.CCH = ``),
  (e.MW = ``),
  (e.SPA = ``),
  (e.EPA = ``),
  (e.SOS = ``),
  (e.SGCI = ``),
  (e.SCI = ``),
  (e.CSI = ``),
  (e.ST = ``),
  (e.OSC = ``),
  (e.PM = ``),
  (e.APC = ``)
))((Ra ||= {}));
var za;
((e) => (e.ST = `${B.ESC}\\`))((za ||= {}));
var Ba = class {
  constructor(e, t, n, r, i, a) {
    ((this._textarea = e),
      (this._compositionView = t),
      (this._bufferService = n),
      (this._optionsService = r),
      (this._coreService = i),
      (this._renderService = a),
      (this._isComposing = !1),
      (this._isSendingComposition = !1),
      (this._compositionPosition = { start: 0, end: 0 }),
      (this._dataAlreadySent = ``));
  }
  get isComposing() {
    return this._isComposing;
  }
  compositionstart() {
    ((this._isComposing = !0),
      (this._compositionPosition.start = this._textarea.value.length),
      (this._compositionView.textContent = ``),
      (this._dataAlreadySent = ``),
      this._compositionView.classList.add(`active`));
  }
  compositionupdate(e) {
    ((this._compositionView.textContent = e.data),
      this.updateCompositionElements(),
      setTimeout(() => {
        this._compositionPosition.end = this._textarea.value.length;
      }, 0));
  }
  compositionend() {
    this._finalizeComposition(!0);
  }
  keydown(e) {
    if (this._isComposing || this._isSendingComposition) {
      if (
        e.keyCode === 20 ||
        e.keyCode === 229 ||
        e.keyCode === 16 ||
        e.keyCode === 17 ||
        e.keyCode === 18
      )
        return !1;
      this._finalizeComposition(!1);
    }
    return e.keyCode === 229 ? (this._handleAnyTextareaChanges(), !1) : !0;
  }
  _finalizeComposition(e) {
    if (
      (this._compositionView.classList.remove(`active`),
      (this._isComposing = !1),
      e)
    ) {
      let e = {
        start: this._compositionPosition.start,
        end: this._compositionPosition.end,
      };
      ((this._isSendingComposition = !0),
        setTimeout(() => {
          if (this._isSendingComposition) {
            this._isSendingComposition = !1;
            let t;
            ((e.start += this._dataAlreadySent.length),
              (t = this._isComposing
                ? this._textarea.value.substring(
                    e.start,
                    this._compositionPosition.start,
                  )
                : this._textarea.value.substring(e.start)),
              t.length > 0 && this._coreService.triggerDataEvent(t, !0));
          }
        }, 0));
    } else {
      this._isSendingComposition = !1;
      let e = this._textarea.value.substring(
        this._compositionPosition.start,
        this._compositionPosition.end,
      );
      this._coreService.triggerDataEvent(e, !0);
    }
  }
  _handleAnyTextareaChanges() {
    let e = this._textarea.value;
    setTimeout(() => {
      if (!this._isComposing) {
        let t = this._textarea.value,
          n = t.replace(e, ``);
        ((this._dataAlreadySent = n),
          t.length > e.length
            ? this._coreService.triggerDataEvent(n, !0)
            : t.length < e.length
              ? this._coreService.triggerDataEvent(`${B.DEL}`, !0)
              : t.length === e.length &&
                t !== e &&
                this._coreService.triggerDataEvent(t, !0));
      }
    }, 0);
  }
  updateCompositionElements(e) {
    if (this._isComposing) {
      if (this._bufferService.buffer.isCursorInViewport) {
        let e = Math.min(
            this._bufferService.buffer.x,
            this._bufferService.cols - 1,
          ),
          t = this._renderService.dimensions.css.cell.height,
          n =
            this._bufferService.buffer.y *
            this._renderService.dimensions.css.cell.height,
          r = e * this._renderService.dimensions.css.cell.width;
        ((this._compositionView.style.left = r + `px`),
          (this._compositionView.style.top = n + `px`),
          (this._compositionView.style.height = t + `px`),
          (this._compositionView.style.lineHeight = t + `px`),
          (this._compositionView.style.fontFamily =
            this._optionsService.rawOptions.fontFamily),
          (this._compositionView.style.fontSize =
            this._optionsService.rawOptions.fontSize + `px`));
        let i = this._compositionView.getBoundingClientRect();
        ((this._textarea.style.left = r + `px`),
          (this._textarea.style.top = n + `px`),
          (this._textarea.style.width = Math.max(i.width, 1) + `px`),
          (this._textarea.style.height = Math.max(i.height, 1) + `px`),
          (this._textarea.style.lineHeight = i.height + `px`));
      }
      e || setTimeout(() => this.updateCompositionElements(!0), 0);
    }
  }
};
Ba = j([M(2, Bt), M(3, Kt), M(4, Ht), M(5, tn)], Ba);
var V = 0,
  Va = 0,
  H = 0,
  U = 0,
  Ha = { css: `#00000000`, rgba: 0 },
  W;
((e) => {
  function t(e, t, n, r) {
    return r === void 0
      ? `#${Ga(e)}${Ga(t)}${Ga(n)}`
      : `#${Ga(e)}${Ga(t)}${Ga(n)}${Ga(r)}`;
  }
  e.toCss = t;
  function n(e, t, n, r = 255) {
    return ((e << 24) | (t << 16) | (n << 8) | r) >>> 0;
  }
  e.toRgba = n;
  function r(t, n, r, i) {
    return { css: e.toCss(t, n, r, i), rgba: e.toRgba(t, n, r, i) };
  }
  e.toColor = r;
})((W ||= {}));
var G;
((e) => {
  function t(e, t) {
    if (((U = (t.rgba & 255) / 255), U === 1))
      return { css: t.css, rgba: t.rgba };
    let n = (t.rgba >> 24) & 255,
      r = (t.rgba >> 16) & 255,
      i = (t.rgba >> 8) & 255,
      a = (e.rgba >> 24) & 255,
      o = (e.rgba >> 16) & 255,
      s = (e.rgba >> 8) & 255;
    return (
      (V = a + Math.round((n - a) * U)),
      (Va = o + Math.round((r - o) * U)),
      (H = s + Math.round((i - s) * U)),
      { css: W.toCss(V, Va, H), rgba: W.toRgba(V, Va, H) }
    );
  }
  e.blend = t;
  function n(e) {
    return (e.rgba & 255) == 255;
  }
  e.isOpaque = n;
  function r(e, t, n) {
    let r = Wa.ensureContrastRatio(e.rgba, t.rgba, n);
    if (r) return W.toColor((r >> 24) & 255, (r >> 16) & 255, (r >> 8) & 255);
  }
  e.ensureContrastRatio = r;
  function i(e) {
    let t = (e.rgba | 255) >>> 0;
    return (
      ([V, Va, H] = Wa.toChannels(t)),
      { css: W.toCss(V, Va, H), rgba: t }
    );
  }
  e.opaque = i;
  function a(e, t) {
    return (
      (U = Math.round(t * 255)),
      ([V, Va, H] = Wa.toChannels(e.rgba)),
      { css: W.toCss(V, Va, H, U), rgba: W.toRgba(V, Va, H, U) }
    );
  }
  e.opacity = a;
  function o(e, t) {
    return ((U = e.rgba & 255), a(e, (U * t) / 255));
  }
  e.multiplyOpacity = o;
  function s(e) {
    return [(e.rgba >> 24) & 255, (e.rgba >> 16) & 255, (e.rgba >> 8) & 255];
  }
  e.toColorRGB = s;
})((G ||= {}));
var K;
((e) => {
  let t, n;
  try {
    let e = document.createElement(`canvas`);
    ((e.width = 1), (e.height = 1));
    let r = e.getContext(`2d`, { willReadFrequently: !0 });
    r &&
      ((t = r),
      (t.globalCompositeOperation = `copy`),
      (n = t.createLinearGradient(0, 0, 1, 1)));
  } catch {}
  function r(e) {
    if (e.match(/#[\da-f]{3,8}/i))
      switch (e.length) {
        case 4:
          return (
            (V = parseInt(e.slice(1, 2).repeat(2), 16)),
            (Va = parseInt(e.slice(2, 3).repeat(2), 16)),
            (H = parseInt(e.slice(3, 4).repeat(2), 16)),
            W.toColor(V, Va, H)
          );
        case 5:
          return (
            (V = parseInt(e.slice(1, 2).repeat(2), 16)),
            (Va = parseInt(e.slice(2, 3).repeat(2), 16)),
            (H = parseInt(e.slice(3, 4).repeat(2), 16)),
            (U = parseInt(e.slice(4, 5).repeat(2), 16)),
            W.toColor(V, Va, H, U)
          );
        case 7:
          return {
            css: e,
            rgba: ((parseInt(e.slice(1), 16) << 8) | 255) >>> 0,
          };
        case 9:
          return { css: e, rgba: parseInt(e.slice(1), 16) >>> 0 };
      }
    let r = e.match(
      /rgba?\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*(,\s*(0|1|\d?\.(\d+))\s*)?\)/,
    );
    if (r)
      return (
        (V = parseInt(r[1])),
        (Va = parseInt(r[2])),
        (H = parseInt(r[3])),
        (U = Math.round((r[5] === void 0 ? 1 : parseFloat(r[5])) * 255)),
        W.toColor(V, Va, H, U)
      );
    if (
      !t ||
      !n ||
      ((t.fillStyle = n), (t.fillStyle = e), typeof t.fillStyle != `string`) ||
      (t.fillRect(0, 0, 1, 1),
      ([V, Va, H, U] = t.getImageData(0, 0, 1, 1).data),
      U !== 255)
    )
      throw Error(`css.toColor: Unsupported css format`);
    return { rgba: W.toRgba(V, Va, H, U), css: e };
  }
  e.toColor = r;
})((K ||= {}));
var Ua;
((e) => {
  function t(e) {
    return n((e >> 16) & 255, (e >> 8) & 255, e & 255);
  }
  e.relativeLuminance = t;
  function n(e, t, n) {
    let r = e / 255,
      i = t / 255,
      a = n / 255,
      o = r <= 0.03928 ? r / 12.92 : ((r + 0.055) / 1.055) ** 2.4,
      s = i <= 0.03928 ? i / 12.92 : ((i + 0.055) / 1.055) ** 2.4,
      c = a <= 0.03928 ? a / 12.92 : ((a + 0.055) / 1.055) ** 2.4;
    return o * 0.2126 + s * 0.7152 + c * 0.0722;
  }
  e.relativeLuminance2 = n;
})((Ua ||= {}));
var Wa;
((e) => {
  function t(e, t) {
    if (((U = (t & 255) / 255), U === 1)) return t;
    let n = (t >> 24) & 255,
      r = (t >> 16) & 255,
      i = (t >> 8) & 255,
      a = (e >> 24) & 255,
      o = (e >> 16) & 255,
      s = (e >> 8) & 255;
    return (
      (V = a + Math.round((n - a) * U)),
      (Va = o + Math.round((r - o) * U)),
      (H = s + Math.round((i - s) * U)),
      W.toRgba(V, Va, H)
    );
  }
  e.blend = t;
  function n(e, t, n) {
    let a = Ua.relativeLuminance(e >> 8),
      o = Ua.relativeLuminance(t >> 8);
    if (Ka(a, o) < n) {
      if (o < a) {
        let o = r(e, t, n),
          s = Ka(a, Ua.relativeLuminance(o >> 8));
        if (s < n) {
          let r = i(e, t, n);
          return s > Ka(a, Ua.relativeLuminance(r >> 8)) ? o : r;
        }
        return o;
      }
      let s = i(e, t, n),
        c = Ka(a, Ua.relativeLuminance(s >> 8));
      if (c < n) {
        let i = r(e, t, n);
        return c > Ka(a, Ua.relativeLuminance(i >> 8)) ? s : i;
      }
      return s;
    }
  }
  e.ensureContrastRatio = n;
  function r(e, t, n) {
    let r = (e >> 24) & 255,
      i = (e >> 16) & 255,
      a = (e >> 8) & 255,
      o = (t >> 24) & 255,
      s = (t >> 16) & 255,
      c = (t >> 8) & 255,
      l = Ka(Ua.relativeLuminance2(o, s, c), Ua.relativeLuminance2(r, i, a));
    for (; l < n && (o > 0 || s > 0 || c > 0); )
      ((o -= Math.max(0, Math.ceil(o * 0.1))),
        (s -= Math.max(0, Math.ceil(s * 0.1))),
        (c -= Math.max(0, Math.ceil(c * 0.1))),
        (l = Ka(
          Ua.relativeLuminance2(o, s, c),
          Ua.relativeLuminance2(r, i, a),
        )));
    return ((o << 24) | (s << 16) | (c << 8) | 255) >>> 0;
  }
  e.reduceLuminance = r;
  function i(e, t, n) {
    let r = (e >> 24) & 255,
      i = (e >> 16) & 255,
      a = (e >> 8) & 255,
      o = (t >> 24) & 255,
      s = (t >> 16) & 255,
      c = (t >> 8) & 255,
      l = Ka(Ua.relativeLuminance2(o, s, c), Ua.relativeLuminance2(r, i, a));
    for (; l < n && (o < 255 || s < 255 || c < 255); )
      ((o = Math.min(255, o + Math.ceil((255 - o) * 0.1))),
        (s = Math.min(255, s + Math.ceil((255 - s) * 0.1))),
        (c = Math.min(255, c + Math.ceil((255 - c) * 0.1))),
        (l = Ka(
          Ua.relativeLuminance2(o, s, c),
          Ua.relativeLuminance2(r, i, a),
        )));
    return ((o << 24) | (s << 16) | (c << 8) | 255) >>> 0;
  }
  e.increaseLuminance = i;
  function a(e) {
    return [(e >> 24) & 255, (e >> 16) & 255, (e >> 8) & 255, e & 255];
  }
  e.toChannels = a;
})((Wa ||= {}));
function Ga(e) {
  let t = e.toString(16);
  return t.length < 2 ? `0` + t : t;
}
function Ka(e, t) {
  return e < t ? (t + 0.05) / (e + 0.05) : (e + 0.05) / (t + 0.05);
}
var qa = class extends Mt {
    constructor(e, t, n) {
      (super(),
        (this.content = 0),
        (this.combinedData = ``),
        (this.fg = e.fg),
        (this.bg = e.bg),
        (this.combinedData = t),
        (this._width = n));
    }
    isCombined() {
      return 2097152;
    }
    getWidth() {
      return this._width;
    }
    getChars() {
      return this.combinedData;
    }
    getCode() {
      return 2097151;
    }
    setFromCharData(e) {
      throw Error(`not implemented`);
    }
    getAsCharData() {
      return [this.fg, this.getChars(), this.getWidth(), this.getCode()];
    }
  },
  Ja = class {
    constructor(e) {
      ((this._bufferService = e),
        (this._characterJoiners = []),
        (this._nextCharacterJoinerId = 0),
        (this._workCell = new Pt()));
    }
    register(e) {
      let t = { id: this._nextCharacterJoinerId++, handler: e };
      return (this._characterJoiners.push(t), t.id);
    }
    deregister(e) {
      for (let t = 0; t < this._characterJoiners.length; t++)
        if (this._characterJoiners[t].id === e)
          return (this._characterJoiners.splice(t, 1), !0);
      return !1;
    }
    getJoinedCharacters(e) {
      if (this._characterJoiners.length === 0) return [];
      let t = this._bufferService.buffer.lines.get(e);
      if (!t || t.length === 0) return [];
      let n = [],
        r = t.translateToString(!0),
        i = 0,
        a = 0,
        o = 0,
        s = t.getFg(0),
        c = t.getBg(0);
      for (let e = 0; e < t.getTrimmedLength(); e++)
        if ((t.loadCell(e, this._workCell), this._workCell.getWidth() !== 0)) {
          if (this._workCell.fg !== s || this._workCell.bg !== c) {
            if (e - i > 1) {
              let e = this._getJoinedRanges(r, o, a, t, i);
              for (let t = 0; t < e.length; t++) n.push(e[t]);
            }
            ((i = e),
              (o = a),
              (s = this._workCell.fg),
              (c = this._workCell.bg));
          }
          a += this._workCell.getChars().length || jt.length;
        }
      if (this._bufferService.cols - i > 1) {
        let e = this._getJoinedRanges(r, o, a, t, i);
        for (let t = 0; t < e.length; t++) n.push(e[t]);
      }
      return n;
    }
    _getJoinedRanges(e, t, n, r, i) {
      let a = e.substring(t, n),
        o = [];
      try {
        o = this._characterJoiners[0].handler(a);
      } catch (e) {
        console.error(e);
      }
      for (let e = 1; e < this._characterJoiners.length; e++)
        try {
          let t = this._characterJoiners[e].handler(a);
          for (let e = 0; e < t.length; e++) Ja._mergeRanges(o, t[e]);
        } catch (e) {
          console.error(e);
        }
      return (this._stringRangesToCellRanges(o, r, i), o);
    }
    _stringRangesToCellRanges(e, t, n) {
      let r = 0,
        i = !1,
        a = 0,
        o = e[r];
      if (o) {
        for (let s = n; s < this._bufferService.cols; s++) {
          let n = t.getWidth(s),
            c = t.getString(s).length || jt.length;
          if (n !== 0) {
            if ((!i && o[0] <= a && ((o[0] = s), (i = !0)), o[1] <= a)) {
              if (((o[1] = s), (o = e[++r]), !o)) break;
              o[0] <= a ? ((o[0] = s), (i = !0)) : (i = !1);
            }
            a += c;
          }
        }
        o && (o[1] = this._bufferService.cols);
      }
    }
    static _mergeRanges(e, t) {
      let n = !1;
      for (let r = 0; r < e.length; r++) {
        let i = e[r];
        if (n) {
          if (t[1] <= i[0]) return ((e[r - 1][1] = t[1]), e);
          if (t[1] <= i[1])
            return ((e[r - 1][1] = Math.max(t[1], i[1])), e.splice(r, 1), e);
          (e.splice(r, 1), r--);
        } else {
          if (t[1] <= i[0]) return (e.splice(r, 0, t), e);
          if (t[1] <= i[1]) return ((i[0] = Math.min(t[0], i[0])), e);
          t[0] < i[1] && ((i[0] = Math.min(t[0], i[0])), (n = !0));
          continue;
        }
      }
      return (n ? (e[e.length - 1][1] = t[1]) : e.push(t), e);
    }
  };
Ja = j([M(0, Bt)], Ja);
function Ya(e) {
  return 57508 <= e && e <= 57558;
}
function Xa(e) {
  return 9472 <= e && e <= 9631;
}
function Za(e) {
  return Ya(e) || Xa(e);
}
function Qa() {
  return {
    css: { canvas: $a(), cell: $a() },
    device: {
      canvas: $a(),
      cell: $a(),
      char: { width: 0, height: 0, left: 0, top: 0 },
    },
  };
}
function $a() {
  return { width: 0, height: 0 };
}
var eo = class {
  constructor(e, t, n, r, i, a, o) {
    ((this._document = e),
      (this._characterJoinerService = t),
      (this._optionsService = n),
      (this._coreBrowserService = r),
      (this._coreService = i),
      (this._decorationService = a),
      (this._themeService = o),
      (this._workCell = new Pt()),
      (this._columnSelectMode = !1),
      (this.defaultSpacing = 0));
  }
  handleSelectionChanged(e, t, n) {
    ((this._selectionStart = e),
      (this._selectionEnd = t),
      (this._columnSelectMode = n));
  }
  createRow(e, t, n, r, i, a, o, s, c, l, u) {
    let d = [],
      f = this._characterJoinerService.getJoinedCharacters(t),
      p = this._themeService.colors,
      m = e.getNoBgTrimmedLength();
    n && m < a + 1 && (m = a + 1);
    let h,
      g = 0,
      _ = ``,
      v = 0,
      y = 0,
      b = 0,
      x = 0,
      ee = !1,
      S = 0,
      C = !1,
      te = 0,
      ne = 0,
      w = [],
      re = l !== -1 && u !== -1;
    for (let T = 0; T < m; T++) {
      e.loadCell(T, this._workCell);
      let m = this._workCell.getWidth();
      if (m === 0) continue;
      let ie = !1,
        ae = T >= ne,
        oe = T,
        E = this._workCell;
      if (f.length > 0 && T === f[0][0] && ae) {
        let r = f.shift(),
          i = this._isCellInSelection(r[0], t);
        for (v = r[0] + 1; v < r[1]; v++)
          ae &&= i === this._isCellInSelection(v, t);
        ((ae &&= !n || a < r[0] || a >= r[1]),
          ae
            ? ((ie = !0),
              (E = new qa(
                this._workCell,
                e.translateToString(!0, r[0], r[1]),
                r[1] - r[0],
              )),
              (oe = r[1] - 1),
              (m = E.getWidth()))
            : (ne = r[1]));
      }
      let se = this._isCellInSelection(T, t),
        ce = n && T === a,
        le = re && T >= l && T <= u,
        ue = !1;
      this._decorationService.forEachDecorationAtCell(T, t, void 0, (e) => {
        ue = !0;
      });
      let de = E.getChars() || jt;
      if (
        (de === ` ` && (E.isUnderline() || E.isOverline()) && (de = `\xA0`),
        (te = m * s - c.get(de, E.isBold(), E.isItalic())),
        !h)
      )
        h = this._document.createElement(`span`);
      else if (
        g &&
        ((se && C) || (!se && !C && E.bg === y)) &&
        ((se && C && p.selectionForeground) || E.fg === b) &&
        E.extended.ext === x &&
        le === ee &&
        te === S &&
        !ce &&
        !ie &&
        !ue &&
        ae
      ) {
        (E.isInvisible() ? (_ += jt) : (_ += de), g++);
        continue;
      } else
        (g && (h.textContent = _),
          (h = this._document.createElement(`span`)),
          (g = 0),
          (_ = ``));
      if (
        ((y = E.bg),
        (b = E.fg),
        (x = E.extended.ext),
        (ee = le),
        (S = te),
        (C = se),
        ie && a >= T && a <= oe && (a = T),
        !this._coreService.isCursorHidden &&
          ce &&
          this._coreService.isCursorInitialized)
      ) {
        if ((w.push(`xterm-cursor`), this._coreBrowserService.isFocused))
          (o && w.push(`xterm-cursor-blink`),
            w.push(
              r === `bar`
                ? `xterm-cursor-bar`
                : r === `underline`
                  ? `xterm-cursor-underline`
                  : `xterm-cursor-block`,
            ));
        else if (i)
          switch (i) {
            case `outline`:
              w.push(`xterm-cursor-outline`);
              break;
            case `block`:
              w.push(`xterm-cursor-block`);
              break;
            case `bar`:
              w.push(`xterm-cursor-bar`);
              break;
            case `underline`:
              w.push(`xterm-cursor-underline`);
              break;
            default:
              break;
          }
      }
      if (
        (E.isBold() && w.push(`xterm-bold`),
        E.isItalic() && w.push(`xterm-italic`),
        E.isDim() && w.push(`xterm-dim`),
        (_ = E.isInvisible() ? jt : E.getChars() || jt),
        E.isUnderline() &&
          (w.push(`xterm-underline-${E.extended.underlineStyle}`),
          _ === ` ` && (_ = `\xA0`),
          !E.isUnderlineColorDefault()))
      )
        if (E.isUnderlineColorRGB())
          h.style.textDecorationColor = `rgb(${Mt.toColorRGB(E.getUnderlineColor()).join(`,`)})`;
        else {
          let e = E.getUnderlineColor();
          (this._optionsService.rawOptions.drawBoldTextInBrightColors &&
            E.isBold() &&
            e < 8 &&
            (e += 8),
            (h.style.textDecorationColor = p.ansi[e].css));
        }
      (E.isOverline() && (w.push(`xterm-overline`), _ === ` ` && (_ = `\xA0`)),
        E.isStrikethrough() && w.push(`xterm-strikethrough`),
        le && (h.style.textDecoration = `underline`));
      let D = E.getFgColor(),
        fe = E.getFgColorMode(),
        pe = E.getBgColor(),
        me = E.getBgColorMode(),
        he = !!E.isInverse();
      if (he) {
        let e = D;
        ((D = pe), (pe = e));
        let t = fe;
        ((fe = me), (me = t));
      }
      let ge,
        _e,
        O = !1;
      (this._decorationService.forEachDecorationAtCell(T, t, void 0, (e) => {
        (e.options.layer !== `top` && O) ||
          (e.backgroundColorRGB &&
            ((me = 50331648),
            (pe = (e.backgroundColorRGB.rgba >> 8) & 16777215),
            (ge = e.backgroundColorRGB)),
          e.foregroundColorRGB &&
            ((fe = 50331648),
            (D = (e.foregroundColorRGB.rgba >> 8) & 16777215),
            (_e = e.foregroundColorRGB)),
          (O = e.options.layer === `top`));
      }),
        !O &&
          se &&
          ((ge = this._coreBrowserService.isFocused
            ? p.selectionBackgroundOpaque
            : p.selectionInactiveBackgroundOpaque),
          (pe = (ge.rgba >> 8) & 16777215),
          (me = 50331648),
          (O = !0),
          p.selectionForeground &&
            ((fe = 50331648),
            (D = (p.selectionForeground.rgba >> 8) & 16777215),
            (_e = p.selectionForeground))),
        O && w.push(`xterm-decoration-top`));
      let ve;
      switch (me) {
        case 16777216:
        case 33554432:
          ((ve = p.ansi[pe]), w.push(`xterm-bg-${pe}`));
          break;
        case 50331648:
          ((ve = W.toColor(pe >> 16, (pe >> 8) & 255, pe & 255)),
            this._addStyle(
              h,
              `background-color:#${to((pe >>> 0).toString(16), `0`, 6)}`,
            ));
          break;
        default:
          he
            ? ((ve = p.foreground), w.push(`xterm-bg-257`))
            : (ve = p.background);
      }
      switch ((ge || (E.isDim() && (ge = G.multiplyOpacity(ve, 0.5))), fe)) {
        case 16777216:
        case 33554432:
          (E.isBold() &&
            D < 8 &&
            this._optionsService.rawOptions.drawBoldTextInBrightColors &&
            (D += 8),
            this._applyMinimumContrast(h, ve, p.ansi[D], E, ge, void 0) ||
              w.push(`xterm-fg-${D}`));
          break;
        case 50331648:
          let e = W.toColor((D >> 16) & 255, (D >> 8) & 255, D & 255);
          this._applyMinimumContrast(h, ve, e, E, ge, _e) ||
            this._addStyle(h, `color:#${to(D.toString(16), `0`, 6)}`);
          break;
        default:
          this._applyMinimumContrast(h, ve, p.foreground, E, ge, _e) ||
            (he && w.push(`xterm-fg-257`));
      }
      ((w.length &&= ((h.className = w.join(` `)), 0)),
        !ce && !ie && !ue && ae ? g++ : (h.textContent = _),
        te !== this.defaultSpacing && (h.style.letterSpacing = `${te}px`),
        d.push(h),
        (T = oe));
    }
    return (h && g && (h.textContent = _), d);
  }
  _applyMinimumContrast(e, t, n, r, i, a) {
    if (
      this._optionsService.rawOptions.minimumContrastRatio === 1 ||
      Za(r.getCode())
    )
      return !1;
    let o = this._getContrastCache(r),
      s;
    if ((!i && !a && (s = o.getColor(t.rgba, n.rgba)), s === void 0)) {
      let e =
        this._optionsService.rawOptions.minimumContrastRatio /
        (r.isDim() ? 2 : 1);
      ((s = G.ensureContrastRatio(i || t, a || n, e)),
        o.setColor((i || t).rgba, (a || n).rgba, s ?? null));
    }
    return s ? (this._addStyle(e, `color:${s.css}`), !0) : !1;
  }
  _getContrastCache(e) {
    return e.isDim()
      ? this._themeService.colors.halfContrastCache
      : this._themeService.colors.contrastCache;
  }
  _addStyle(e, t) {
    e.setAttribute(`style`, `${e.getAttribute(`style`) || ``}${t};`);
  }
  _isCellInSelection(e, t) {
    let n = this._selectionStart,
      r = this._selectionEnd;
    return !n || !r
      ? !1
      : this._columnSelectMode
        ? n[0] <= r[0]
          ? e >= n[0] && t >= n[1] && e < r[0] && t <= r[1]
          : e < n[0] && t >= n[1] && e >= r[0] && t <= r[1]
        : (t > n[1] && t < r[1]) ||
          (n[1] === r[1] && t === n[1] && e >= n[0] && e < r[0]) ||
          (n[1] < r[1] && t === r[1] && e < r[0]) ||
          (n[1] < r[1] && t === n[1] && e >= n[0]);
  }
};
eo = j([M(1, rn), M(2, Kt), M(3, $t), M(4, Ht), M(5, Yt), M(6, an)], eo);
function to(e, t, n) {
  for (; e.length < n; ) e = t + e;
  return e;
}
var no = class {
    constructor(e, t) {
      ((this._flat = new Float32Array(256)),
        (this._font = ``),
        (this._fontSize = 0),
        (this._weight = `normal`),
        (this._weightBold = `bold`),
        (this._measureElements = []),
        (this._container = e.createElement(`div`)),
        this._container.classList.add(`xterm-width-cache-measure-container`),
        this._container.setAttribute(`aria-hidden`, `true`),
        (this._container.style.whiteSpace = `pre`),
        (this._container.style.fontKerning = `none`));
      let n = e.createElement(`span`);
      n.classList.add(`xterm-char-measure-element`);
      let r = e.createElement(`span`);
      (r.classList.add(`xterm-char-measure-element`),
        (r.style.fontWeight = `bold`));
      let i = e.createElement(`span`);
      (i.classList.add(`xterm-char-measure-element`),
        (i.style.fontStyle = `italic`));
      let a = e.createElement(`span`);
      (a.classList.add(`xterm-char-measure-element`),
        (a.style.fontWeight = `bold`),
        (a.style.fontStyle = `italic`),
        (this._measureElements = [n, r, i, a]),
        this._container.appendChild(n),
        this._container.appendChild(r),
        this._container.appendChild(i),
        this._container.appendChild(a),
        t.appendChild(this._container),
        this.clear());
    }
    dispose() {
      (this._container.remove(),
        (this._measureElements.length = 0),
        (this._holey = void 0));
    }
    clear() {
      (this._flat.fill(-9999), (this._holey = new Map()));
    }
    setFont(e, t, n, r) {
      (e === this._font &&
        t === this._fontSize &&
        n === this._weight &&
        r === this._weightBold) ||
        ((this._font = e),
        (this._fontSize = t),
        (this._weight = n),
        (this._weightBold = r),
        (this._container.style.fontFamily = this._font),
        (this._container.style.fontSize = `${this._fontSize}px`),
        (this._measureElements[0].style.fontWeight = `${n}`),
        (this._measureElements[1].style.fontWeight = `${r}`),
        (this._measureElements[2].style.fontWeight = `${n}`),
        (this._measureElements[3].style.fontWeight = `${r}`),
        this.clear());
    }
    get(e, t, n) {
      let r = 0;
      if (!t && !n && e.length === 1 && (r = e.charCodeAt(0)) < 256) {
        if (this._flat[r] !== -9999) return this._flat[r];
        let t = this._measure(e, 0);
        return (t > 0 && (this._flat[r] = t), t);
      }
      let i = e;
      (t && (i += `B`), n && (i += `I`));
      let a = this._holey.get(i);
      if (a === void 0) {
        let r = 0;
        (t && (r |= 1),
          n && (r |= 2),
          (a = this._measure(e, r)),
          a > 0 && this._holey.set(i, a));
      }
      return a;
    }
    _measure(e, t) {
      let n = this._measureElements[t];
      return ((n.textContent = e.repeat(32)), n.offsetWidth / 32);
    }
  },
  ro = class {
    constructor() {
      this.clear();
    }
    clear() {
      ((this.hasSelection = !1),
        (this.columnSelectMode = !1),
        (this.viewportStartRow = 0),
        (this.viewportEndRow = 0),
        (this.viewportCappedStartRow = 0),
        (this.viewportCappedEndRow = 0),
        (this.startCol = 0),
        (this.endCol = 0),
        (this.selectionStart = void 0),
        (this.selectionEnd = void 0));
    }
    update(e, t, n, r = !1) {
      if (
        ((this.selectionStart = t),
        (this.selectionEnd = n),
        !t || !n || (t[0] === n[0] && t[1] === n[1]))
      ) {
        this.clear();
        return;
      }
      let i = e.buffers.active.ydisp,
        a = t[1] - i,
        o = n[1] - i,
        s = Math.max(a, 0),
        c = Math.min(o, e.rows - 1);
      if (s >= e.rows || c < 0) {
        this.clear();
        return;
      }
      ((this.hasSelection = !0),
        (this.columnSelectMode = r),
        (this.viewportStartRow = a),
        (this.viewportEndRow = o),
        (this.viewportCappedStartRow = s),
        (this.viewportCappedEndRow = c),
        (this.startCol = t[0]),
        (this.endCol = n[0]));
    }
    isCellSelected(e, t, n) {
      return this.hasSelection
        ? ((n -= e.buffer.active.viewportY),
          this.columnSelectMode
            ? this.startCol <= this.endCol
              ? t >= this.startCol &&
                n >= this.viewportCappedStartRow &&
                t < this.endCol &&
                n <= this.viewportCappedEndRow
              : t < this.startCol &&
                n >= this.viewportCappedStartRow &&
                t >= this.endCol &&
                n <= this.viewportCappedEndRow
            : (n > this.viewportStartRow && n < this.viewportEndRow) ||
              (this.viewportStartRow === this.viewportEndRow &&
                n === this.viewportStartRow &&
                t >= this.startCol &&
                t < this.endCol) ||
              (this.viewportStartRow < this.viewportEndRow &&
                n === this.viewportEndRow &&
                t < this.endCol) ||
              (this.viewportStartRow < this.viewportEndRow &&
                n === this.viewportStartRow &&
                t >= this.startCol))
        : !1;
    }
  };
function io() {
  return new ro();
}
var ao = `xterm-dom-renderer-owner-`,
  oo = `xterm-rows`,
  so = `xterm-fg-`,
  co = `xterm-bg-`,
  lo = `xterm-focus`,
  uo = `xterm-selection`,
  fo = 1,
  po = class extends F {
    constructor(e, t, n, r, i, a, o, s, c, l, u, d, f, p) {
      (super(),
        (this._terminal = e),
        (this._document = t),
        (this._element = n),
        (this._screenElement = r),
        (this._viewportElement = i),
        (this._helperContainer = a),
        (this._linkifier2 = o),
        (this._charSizeService = c),
        (this._optionsService = l),
        (this._bufferService = u),
        (this._coreService = d),
        (this._coreBrowserService = f),
        (this._themeService = p),
        (this._terminalClass = fo++),
        (this._rowElements = []),
        (this._selectionRenderModel = io()),
        (this.onRequestRedraw = this._register(new L()).event),
        (this._rowContainer = this._document.createElement(`div`)),
        this._rowContainer.classList.add(oo),
        (this._rowContainer.style.lineHeight = `normal`),
        this._rowContainer.setAttribute(`aria-hidden`, `true`),
        this._refreshRowElements(
          this._bufferService.cols,
          this._bufferService.rows,
        ),
        (this._selectionContainer = this._document.createElement(`div`)),
        this._selectionContainer.classList.add(uo),
        this._selectionContainer.setAttribute(`aria-hidden`, `true`),
        (this.dimensions = Qa()),
        this._updateDimensions(),
        this._register(
          this._optionsService.onOptionChange(() =>
            this._handleOptionsChanged(),
          ),
        ),
        this._register(
          this._themeService.onChangeColors((e) => this._injectCss(e)),
        ),
        this._injectCss(this._themeService.colors),
        (this._rowFactory = s.createInstance(eo, document)),
        this._element.classList.add(ao + this._terminalClass),
        this._screenElement.appendChild(this._rowContainer),
        this._screenElement.appendChild(this._selectionContainer),
        this._register(
          this._linkifier2.onShowLinkUnderline((e) => this._handleLinkHover(e)),
        ),
        this._register(
          this._linkifier2.onHideLinkUnderline((e) => this._handleLinkLeave(e)),
        ),
        this._register(
          P(() => {
            (this._element.classList.remove(ao + this._terminalClass),
              this._rowContainer.remove(),
              this._selectionContainer.remove(),
              this._widthCache.dispose(),
              this._themeStyleElement.remove(),
              this._dimensionsStyleElement.remove());
          }),
        ),
        (this._widthCache = new no(this._document, this._helperContainer)),
        this._widthCache.setFont(
          this._optionsService.rawOptions.fontFamily,
          this._optionsService.rawOptions.fontSize,
          this._optionsService.rawOptions.fontWeight,
          this._optionsService.rawOptions.fontWeightBold,
        ),
        this._setDefaultSpacing());
    }
    _updateDimensions() {
      let e = this._coreBrowserService.dpr;
      ((this.dimensions.device.char.width = this._charSizeService.width * e),
        (this.dimensions.device.char.height = Math.ceil(
          this._charSizeService.height * e,
        )),
        (this.dimensions.device.cell.width =
          this.dimensions.device.char.width +
          Math.round(this._optionsService.rawOptions.letterSpacing)),
        (this.dimensions.device.cell.height = Math.floor(
          this.dimensions.device.char.height *
            this._optionsService.rawOptions.lineHeight,
        )),
        (this.dimensions.device.char.left = 0),
        (this.dimensions.device.char.top = 0),
        (this.dimensions.device.canvas.width =
          this.dimensions.device.cell.width * this._bufferService.cols),
        (this.dimensions.device.canvas.height =
          this.dimensions.device.cell.height * this._bufferService.rows),
        (this.dimensions.css.canvas.width = Math.round(
          this.dimensions.device.canvas.width / e,
        )),
        (this.dimensions.css.canvas.height = Math.round(
          this.dimensions.device.canvas.height / e,
        )),
        (this.dimensions.css.cell.width =
          this.dimensions.css.canvas.width / this._bufferService.cols),
        (this.dimensions.css.cell.height =
          this.dimensions.css.canvas.height / this._bufferService.rows));
      for (let e of this._rowElements)
        ((e.style.width = `${this.dimensions.css.canvas.width}px`),
          (e.style.height = `${this.dimensions.css.cell.height}px`),
          (e.style.lineHeight = `${this.dimensions.css.cell.height}px`),
          (e.style.overflow = `hidden`));
      this._dimensionsStyleElement ||
        ((this._dimensionsStyleElement = this._document.createElement(`style`)),
        this._screenElement.appendChild(this._dimensionsStyleElement));
      let t = `${this._terminalSelector} .${oo} span { display: inline-block; height: 100%; vertical-align: top;}`;
      ((this._dimensionsStyleElement.textContent = t),
        (this._selectionContainer.style.height =
          this._viewportElement.style.height),
        (this._screenElement.style.width = `${this.dimensions.css.canvas.width}px`),
        (this._screenElement.style.height = `${this.dimensions.css.canvas.height}px`));
    }
    _injectCss(e) {
      this._themeStyleElement ||
        ((this._themeStyleElement = this._document.createElement(`style`)),
        this._screenElement.appendChild(this._themeStyleElement));
      let t = `${this._terminalSelector} .${oo} { pointer-events: none; color: ${e.foreground.css}; font-family: ${this._optionsService.rawOptions.fontFamily}; font-size: ${this._optionsService.rawOptions.fontSize}px; font-kerning: none; white-space: pre}`;
      ((t += `${this._terminalSelector} .${oo} .xterm-dim { color: ${G.multiplyOpacity(e.foreground, 0.5).css};}`),
        (t += `${this._terminalSelector} span:not(.xterm-bold) { font-weight: ${this._optionsService.rawOptions.fontWeight};}${this._terminalSelector} span.xterm-bold { font-weight: ${this._optionsService.rawOptions.fontWeightBold};}${this._terminalSelector} span.xterm-italic { font-style: italic;}`));
      let n = `blink_underline_${this._terminalClass}`,
        r = `blink_bar_${this._terminalClass}`,
        i = `blink_block_${this._terminalClass}`;
      ((t += `@keyframes ${n} { 50% {  border-bottom-style: hidden; }}`),
        (t += `@keyframes ${r} { 50% {  box-shadow: none; }}`),
        (t += `@keyframes ${i} { 0% {  background-color: ${e.cursor.css};  color: ${e.cursorAccent.css}; } 50% {  background-color: inherit;  color: ${e.cursor.css}; }}`),
        (t += `${this._terminalSelector} .${oo}.${lo} .xterm-cursor.xterm-cursor-blink.xterm-cursor-underline { animation: ${n} 1s step-end infinite;}${this._terminalSelector} .${oo}.${lo} .xterm-cursor.xterm-cursor-blink.xterm-cursor-bar { animation: ${r} 1s step-end infinite;}${this._terminalSelector} .${oo}.${lo} .xterm-cursor.xterm-cursor-blink.xterm-cursor-block { animation: ${i} 1s step-end infinite;}${this._terminalSelector} .${oo} .xterm-cursor.xterm-cursor-block { background-color: ${e.cursor.css}; color: ${e.cursorAccent.css};}${this._terminalSelector} .${oo} .xterm-cursor.xterm-cursor-block:not(.xterm-cursor-blink) { background-color: ${e.cursor.css} !important; color: ${e.cursorAccent.css} !important;}${this._terminalSelector} .${oo} .xterm-cursor.xterm-cursor-outline { outline: 1px solid ${e.cursor.css}; outline-offset: -1px;}${this._terminalSelector} .${oo} .xterm-cursor.xterm-cursor-bar { box-shadow: ${this._optionsService.rawOptions.cursorWidth}px 0 0 ${e.cursor.css} inset;}${this._terminalSelector} .${oo} .xterm-cursor.xterm-cursor-underline { border-bottom: 1px ${e.cursor.css}; border-bottom-style: solid; height: calc(100% - 1px);}`),
        (t += `${this._terminalSelector} .${uo} { position: absolute; top: 0; left: 0; z-index: 1; pointer-events: none;}${this._terminalSelector}.focus .${uo} div { position: absolute; background-color: ${e.selectionBackgroundOpaque.css};}${this._terminalSelector} .${uo} div { position: absolute; background-color: ${e.selectionInactiveBackgroundOpaque.css};}`));
      for (let [n, r] of e.ansi.entries())
        t += `${this._terminalSelector} .${so}${n} { color: ${r.css}; }${this._terminalSelector} .${so}${n}.xterm-dim { color: ${G.multiplyOpacity(r, 0.5).css}; }${this._terminalSelector} .${co}${n} { background-color: ${r.css}; }`;
      ((t += `${this._terminalSelector} .${so}257 { color: ${G.opaque(e.background).css}; }${this._terminalSelector} .${so}257.xterm-dim { color: ${G.multiplyOpacity(G.opaque(e.background), 0.5).css}; }${this._terminalSelector} .${co}257 { background-color: ${e.foreground.css}; }`),
        (this._themeStyleElement.textContent = t));
    }
    _setDefaultSpacing() {
      let e =
        this.dimensions.css.cell.width - this._widthCache.get(`W`, !1, !1);
      ((this._rowContainer.style.letterSpacing = `${e}px`),
        (this._rowFactory.defaultSpacing = e));
    }
    handleDevicePixelRatioChange() {
      (this._updateDimensions(),
        this._widthCache.clear(),
        this._setDefaultSpacing());
    }
    _refreshRowElements(e, t) {
      for (let e = this._rowElements.length; e <= t; e++) {
        let e = this._document.createElement(`div`);
        (this._rowContainer.appendChild(e), this._rowElements.push(e));
      }
      for (; this._rowElements.length > t; )
        this._rowContainer.removeChild(this._rowElements.pop());
    }
    handleResize(e, t) {
      (this._refreshRowElements(e, t),
        this._updateDimensions(),
        this.handleSelectionChanged(
          this._selectionRenderModel.selectionStart,
          this._selectionRenderModel.selectionEnd,
          this._selectionRenderModel.columnSelectMode,
        ));
    }
    handleCharSizeChanged() {
      (this._updateDimensions(),
        this._widthCache.clear(),
        this._setDefaultSpacing());
    }
    handleBlur() {
      (this._rowContainer.classList.remove(lo),
        this.renderRows(0, this._bufferService.rows - 1));
    }
    handleFocus() {
      (this._rowContainer.classList.add(lo),
        this.renderRows(
          this._bufferService.buffer.y,
          this._bufferService.buffer.y,
        ));
    }
    handleSelectionChanged(e, t, n) {
      if (
        (this._selectionContainer.replaceChildren(),
        this._rowFactory.handleSelectionChanged(e, t, n),
        this.renderRows(0, this._bufferService.rows - 1),
        !e ||
          !t ||
          (this._selectionRenderModel.update(this._terminal, e, t, n),
          !this._selectionRenderModel.hasSelection))
      )
        return;
      let r = this._selectionRenderModel.viewportStartRow,
        i = this._selectionRenderModel.viewportEndRow,
        a = this._selectionRenderModel.viewportCappedStartRow,
        o = this._selectionRenderModel.viewportCappedEndRow,
        s = this._document.createDocumentFragment();
      if (n) {
        let n = e[0] > t[0];
        s.appendChild(
          this._createSelectionElement(
            a,
            n ? t[0] : e[0],
            n ? e[0] : t[0],
            o - a + 1,
          ),
        );
      } else {
        let n = r === a ? e[0] : 0,
          c = a === i ? t[0] : this._bufferService.cols;
        s.appendChild(this._createSelectionElement(a, n, c));
        let l = o - a - 1;
        if (
          (s.appendChild(
            this._createSelectionElement(a + 1, 0, this._bufferService.cols, l),
          ),
          a !== o)
        ) {
          let e = i === o ? t[0] : this._bufferService.cols;
          s.appendChild(this._createSelectionElement(o, 0, e));
        }
      }
      this._selectionContainer.appendChild(s);
    }
    _createSelectionElement(e, t, n, r = 1) {
      let i = this._document.createElement(`div`),
        a = t * this.dimensions.css.cell.width,
        o = this.dimensions.css.cell.width * (n - t);
      return (
        a + o > this.dimensions.css.canvas.width &&
          (o = this.dimensions.css.canvas.width - a),
        (i.style.height = `${r * this.dimensions.css.cell.height}px`),
        (i.style.top = `${e * this.dimensions.css.cell.height}px`),
        (i.style.left = `${a}px`),
        (i.style.width = `${o}px`),
        i
      );
    }
    handleCursorMove() {}
    _handleOptionsChanged() {
      (this._updateDimensions(),
        this._injectCss(this._themeService.colors),
        this._widthCache.setFont(
          this._optionsService.rawOptions.fontFamily,
          this._optionsService.rawOptions.fontSize,
          this._optionsService.rawOptions.fontWeight,
          this._optionsService.rawOptions.fontWeightBold,
        ),
        this._setDefaultSpacing());
    }
    clear() {
      for (let e of this._rowElements) e.replaceChildren();
    }
    renderRows(e, t) {
      let n = this._bufferService.buffer,
        r = n.ybase + n.y,
        i = Math.min(n.x, this._bufferService.cols - 1),
        a =
          this._coreService.decPrivateModes.cursorBlink ??
          this._optionsService.rawOptions.cursorBlink,
        o =
          this._coreService.decPrivateModes.cursorStyle ??
          this._optionsService.rawOptions.cursorStyle,
        s = this._optionsService.rawOptions.cursorInactiveStyle;
      for (let c = e; c <= t; c++) {
        let e = c + n.ydisp,
          t = this._rowElements[c],
          l = n.lines.get(e);
        if (!t || !l) break;
        t.replaceChildren(
          ...this._rowFactory.createRow(
            l,
            e,
            e === r,
            o,
            s,
            i,
            a,
            this.dimensions.css.cell.width,
            this._widthCache,
            -1,
            -1,
          ),
        );
      }
    }
    get _terminalSelector() {
      return `.${ao}${this._terminalClass}`;
    }
    _handleLinkHover(e) {
      this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !0);
    }
    _handleLinkLeave(e) {
      this._setCellUnderline(e.x1, e.x2, e.y1, e.y2, e.cols, !1);
    }
    _setCellUnderline(e, t, n, r, i, a) {
      (n < 0 && (e = 0), r < 0 && (t = 0));
      let o = this._bufferService.rows - 1;
      ((n = Math.max(Math.min(n, o), 0)),
        (r = Math.max(Math.min(r, o), 0)),
        (i = Math.min(i, this._bufferService.cols)));
      let s = this._bufferService.buffer,
        c = s.ybase + s.y,
        l = Math.min(s.x, i - 1),
        u = this._optionsService.rawOptions.cursorBlink,
        d = this._optionsService.rawOptions.cursorStyle,
        f = this._optionsService.rawOptions.cursorInactiveStyle;
      for (let o = n; o <= r; ++o) {
        let p = o + s.ydisp,
          m = this._rowElements[o],
          h = s.lines.get(p);
        if (!m || !h) break;
        m.replaceChildren(
          ...this._rowFactory.createRow(
            h,
            p,
            p === c,
            d,
            f,
            l,
            u,
            this.dimensions.css.cell.width,
            this._widthCache,
            a ? (o === n ? e : 0) : -1,
            a ? (o === r ? t : i) - 1 : -1,
          ),
        );
      }
    }
  };
po = j(
  [M(7, Wt), M(8, Qt), M(9, Kt), M(10, Bt), M(11, Ht), M(12, $t), M(13, an)],
  po,
);
var mo = class extends F {
  constructor(e, t, n) {
    (super(),
      (this._optionsService = n),
      (this.width = 0),
      (this.height = 0),
      (this._onCharSizeChange = this._register(new L())),
      (this.onCharSizeChange = this._onCharSizeChange.event));
    try {
      this._measureStrategy = this._register(new _o(this._optionsService));
    } catch {
      this._measureStrategy = this._register(
        new go(e, t, this._optionsService),
      );
    }
    this._register(
      this._optionsService.onMultipleOptionChange(
        [`fontFamily`, `fontSize`],
        () => this.measure(),
      ),
    );
  }
  get hasValidSize() {
    return this.width > 0 && this.height > 0;
  }
  measure() {
    let e = this._measureStrategy.measure();
    (e.width !== this.width || e.height !== this.height) &&
      ((this.width = e.width),
      (this.height = e.height),
      this._onCharSizeChange.fire());
  }
};
mo = j([M(2, Kt)], mo);
var ho = class extends F {
    constructor() {
      (super(...arguments), (this._result = { width: 0, height: 0 }));
    }
    _validateAndSet(e, t) {
      e !== void 0 &&
        e > 0 &&
        t !== void 0 &&
        t > 0 &&
        ((this._result.width = e), (this._result.height = t));
    }
  },
  go = class extends ho {
    constructor(e, t, n) {
      (super(),
        (this._document = e),
        (this._parentElement = t),
        (this._optionsService = n),
        (this._measureElement = this._document.createElement(`span`)),
        this._measureElement.classList.add(`xterm-char-measure-element`),
        (this._measureElement.textContent = `W`.repeat(32)),
        this._measureElement.setAttribute(`aria-hidden`, `true`),
        (this._measureElement.style.whiteSpace = `pre`),
        (this._measureElement.style.fontKerning = `none`),
        this._parentElement.appendChild(this._measureElement));
    }
    measure() {
      return (
        (this._measureElement.style.fontFamily =
          this._optionsService.rawOptions.fontFamily),
        (this._measureElement.style.fontSize = `${this._optionsService.rawOptions.fontSize}px`),
        this._validateAndSet(
          Number(this._measureElement.offsetWidth) / 32,
          Number(this._measureElement.offsetHeight),
        ),
        this._result
      );
    }
  },
  _o = class extends ho {
    constructor(e) {
      (super(),
        (this._optionsService = e),
        (this._canvas = new OffscreenCanvas(100, 100)),
        (this._ctx = this._canvas.getContext(`2d`)));
      let t = this._ctx.measureText(`W`);
      if (
        !(
          `width` in t &&
          `fontBoundingBoxAscent` in t &&
          `fontBoundingBoxDescent` in t
        )
      )
        throw Error(`Required font metrics not supported`);
    }
    measure() {
      this._ctx.font = `${this._optionsService.rawOptions.fontSize}px ${this._optionsService.rawOptions.fontFamily}`;
      let e = this._ctx.measureText(`W`);
      return (
        this._validateAndSet(
          e.width,
          e.fontBoundingBoxAscent + e.fontBoundingBoxDescent,
        ),
        this._result
      );
    }
  },
  vo = class extends F {
    constructor(e, t, n) {
      (super(),
        (this._textarea = e),
        (this._window = t),
        (this.mainDocument = n),
        (this._isFocused = !1),
        (this._cachedIsFocused = void 0),
        (this._screenDprMonitor = this._register(new yo(this._window))),
        (this._onDprChange = this._register(new L())),
        (this.onDprChange = this._onDprChange.event),
        (this._onWindowChange = this._register(new L())),
        (this.onWindowChange = this._onWindowChange.event),
        this._register(
          this.onWindowChange((e) => this._screenDprMonitor.setWindow(e)),
        ),
        this._register(
          Jn.forward(this._screenDprMonitor.onDprChange, this._onDprChange),
        ),
        this._register(
          R(this._textarea, `focus`, () => (this._isFocused = !0)),
        ),
        this._register(
          R(this._textarea, `blur`, () => (this._isFocused = !1)),
        ));
    }
    get window() {
      return this._window;
    }
    set window(e) {
      this._window !== e &&
        ((this._window = e), this._onWindowChange.fire(this._window));
    }
    get dpr() {
      return this.window.devicePixelRatio;
    }
    get isFocused() {
      return (
        this._cachedIsFocused === void 0 &&
          ((this._cachedIsFocused =
            this._isFocused && this._textarea.ownerDocument.hasFocus()),
          queueMicrotask(() => (this._cachedIsFocused = void 0))),
        this._cachedIsFocused
      );
    }
  },
  yo = class extends F {
    constructor(e) {
      (super(),
        (this._parentWindow = e),
        (this._windowResizeListener = this._register(new zn())),
        (this._onDprChange = this._register(new L())),
        (this.onDprChange = this._onDprChange.event),
        (this._outerListener = () => this._setDprAndFireIfDiffers()),
        (this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio),
        this._updateDpr(),
        this._setWindowResizeListener(),
        this._register(P(() => this.clearListener())));
    }
    setWindow(e) {
      ((this._parentWindow = e),
        this._setWindowResizeListener(),
        this._setDprAndFireIfDiffers());
    }
    _setWindowResizeListener() {
      this._windowResizeListener.value = R(this._parentWindow, `resize`, () =>
        this._setDprAndFireIfDiffers(),
      );
    }
    _setDprAndFireIfDiffers() {
      (this._parentWindow.devicePixelRatio !== this._currentDevicePixelRatio &&
        this._onDprChange.fire(this._parentWindow.devicePixelRatio),
        this._updateDpr());
    }
    _updateDpr() {
      this._outerListener &&
        (this._resolutionMediaMatchList?.removeListener(this._outerListener),
        (this._currentDevicePixelRatio = this._parentWindow.devicePixelRatio),
        (this._resolutionMediaMatchList = this._parentWindow.matchMedia(
          `screen and (resolution: ${this._parentWindow.devicePixelRatio}dppx)`,
        )),
        this._resolutionMediaMatchList.addListener(this._outerListener));
    }
    clearListener() {
      !this._resolutionMediaMatchList ||
        !this._outerListener ||
        (this._resolutionMediaMatchList.removeListener(this._outerListener),
        (this._resolutionMediaMatchList = void 0),
        (this._outerListener = void 0));
    }
  },
  bo = class extends F {
    constructor() {
      (super(),
        (this.linkProviders = []),
        this._register(P(() => (this.linkProviders.length = 0))));
    }
    registerLinkProvider(e) {
      return (
        this.linkProviders.push(e),
        {
          dispose: () => {
            let t = this.linkProviders.indexOf(e);
            t !== -1 && this.linkProviders.splice(t, 1);
          },
        }
      );
    }
  };
function xo(e, t, n) {
  let r = n.getBoundingClientRect(),
    i = e.getComputedStyle(n),
    a = parseInt(i.getPropertyValue(`padding-left`)),
    o = parseInt(i.getPropertyValue(`padding-top`));
  return [t.clientX - r.left - a, t.clientY - r.top - o];
}
function So(e, t, n, r, i, a, o, s, c) {
  if (!a) return;
  let l = xo(e, t, n);
  if (l)
    return (
      (l[0] = Math.ceil((l[0] + (c ? o / 2 : 0)) / o)),
      (l[1] = Math.ceil(l[1] / s)),
      (l[0] = Math.min(Math.max(l[0], 1), r + (c ? 1 : 0))),
      (l[1] = Math.min(Math.max(l[1], 1), i)),
      l
    );
}
var Co = class {
  constructor(e, t) {
    ((this._renderService = e), (this._charSizeService = t));
  }
  getCoords(e, t, n, r, i) {
    return So(
      window,
      e,
      t,
      n,
      r,
      this._charSizeService.hasValidSize,
      this._renderService.dimensions.css.cell.width,
      this._renderService.dimensions.css.cell.height,
      i,
    );
  }
  getMouseReportCoords(e, t) {
    let n = xo(window, e, t);
    if (this._charSizeService.hasValidSize)
      return (
        (n[0] = Math.min(
          Math.max(n[0], 0),
          this._renderService.dimensions.css.canvas.width - 1,
        )),
        (n[1] = Math.min(
          Math.max(n[1], 0),
          this._renderService.dimensions.css.canvas.height - 1,
        )),
        {
          col: Math.floor(n[0] / this._renderService.dimensions.css.cell.width),
          row: Math.floor(
            n[1] / this._renderService.dimensions.css.cell.height,
          ),
          x: Math.floor(n[0]),
          y: Math.floor(n[1]),
        }
      );
  }
};
Co = j([M(0, tn), M(1, Qt)], Co);
var wo = class {
    constructor(e, t) {
      ((this._renderCallback = e),
        (this._coreBrowserService = t),
        (this._refreshCallbacks = []));
    }
    dispose() {
      this._animationFrame &&=
        (this._coreBrowserService.window.cancelAnimationFrame(
          this._animationFrame,
        ),
        void 0);
    }
    addRefreshCallback(e) {
      return (
        this._refreshCallbacks.push(e),
        (this._animationFrame ||=
          this._coreBrowserService.window.requestAnimationFrame(() =>
            this._innerRefresh(),
          )),
        this._animationFrame
      );
    }
    refresh(e, t, n) {
      ((this._rowCount = n),
        (e = e === void 0 ? 0 : e),
        (t = t === void 0 ? this._rowCount - 1 : t),
        (this._rowStart =
          this._rowStart === void 0 ? e : Math.min(this._rowStart, e)),
        (this._rowEnd =
          this._rowEnd === void 0 ? t : Math.max(this._rowEnd, t)),
        !this._animationFrame &&
          (this._animationFrame =
            this._coreBrowserService.window.requestAnimationFrame(() =>
              this._innerRefresh(),
            )));
    }
    _innerRefresh() {
      if (
        ((this._animationFrame = void 0),
        this._rowStart === void 0 ||
          this._rowEnd === void 0 ||
          this._rowCount === void 0)
      ) {
        this._runRefreshCallbacks();
        return;
      }
      let e = Math.max(this._rowStart, 0),
        t = Math.min(this._rowEnd, this._rowCount - 1);
      ((this._rowStart = void 0),
        (this._rowEnd = void 0),
        this._renderCallback(e, t),
        this._runRefreshCallbacks());
    }
    _runRefreshCallbacks() {
      for (let e of this._refreshCallbacks) e(0);
      this._refreshCallbacks = [];
    }
  },
  To = {};
mt(To, {
  getSafariVersion: () => Mo,
  isChromeOS: () => Ro,
  isFirefox: () => ko,
  isIpad: () => Po,
  isIphone: () => Fo,
  isLegacyEdge: () => Ao,
  isLinux: () => Lo,
  isMac: () => No,
  isNode: () => Eo,
  isSafari: () => jo,
  isWindows: () => Io,
});
var Eo = typeof process < `u` && `title` in process,
  Do = Eo ? `node` : navigator.userAgent,
  Oo = Eo ? `node` : navigator.platform,
  ko = Do.includes(`Firefox`),
  Ao = Do.includes(`Edge`),
  jo = /^((?!chrome|android).)*safari/i.test(Do);
function Mo() {
  if (!jo) return 0;
  let e = Do.match(/Version\/(\d+)/);
  return e === null || e.length < 2 ? 0 : parseInt(e[1]);
}
var No = [`Macintosh`, `MacIntel`, `MacPPC`, `Mac68K`].includes(Oo),
  Po = Oo === `iPad`,
  Fo = Oo === `iPhone`,
  Io = [`Windows`, `Win16`, `Win32`, `WinCE`].includes(Oo),
  Lo = Oo.indexOf(`Linux`) >= 0,
  Ro = /\bCrOS\b/.test(Do),
  zo = class {
    constructor() {
      ((this._tasks = []), (this._i = 0));
    }
    enqueue(e) {
      (this._tasks.push(e), this._start());
    }
    flush() {
      for (; this._i < this._tasks.length; )
        this._tasks[this._i]() || this._i++;
      this.clear();
    }
    clear() {
      ((this._idleCallback &&=
        (this._cancelCallback(this._idleCallback), void 0)),
        (this._i = 0),
        (this._tasks.length = 0));
    }
    _start() {
      this._idleCallback ||= this._requestCallback(this._process.bind(this));
    }
    _process(e) {
      this._idleCallback = void 0;
      let t = 0,
        n = 0,
        r = e.timeRemaining(),
        i = 0;
      for (; this._i < this._tasks.length; ) {
        if (
          ((t = performance.now()),
          this._tasks[this._i]() || this._i++,
          (t = Math.max(1, performance.now() - t)),
          (n = Math.max(t, n)),
          (i = e.timeRemaining()),
          n * 1.5 > i)
        ) {
          (r - t < -20 &&
            console.warn(
              `task queue exceeded allotted deadline by ${Math.abs(Math.round(r - t))}ms`,
            ),
            this._start());
          return;
        }
        r = i;
      }
      this.clear();
    }
  },
  Bo = class extends zo {
    _requestCallback(e) {
      return setTimeout(() => e(this._createDeadline(16)));
    }
    _cancelCallback(e) {
      clearTimeout(e);
    }
    _createDeadline(e) {
      let t = performance.now() + e;
      return { timeRemaining: () => Math.max(0, t - performance.now()) };
    }
  },
  Vo = class extends zo {
    _requestCallback(e) {
      return requestIdleCallback(e);
    }
    _cancelCallback(e) {
      cancelIdleCallback(e);
    }
  },
  Ho = !Eo && `requestIdleCallback` in window ? Vo : Bo,
  Uo = class {
    constructor() {
      this._queue = new Ho();
    }
    set(e) {
      (this._queue.clear(), this._queue.enqueue(e));
    }
    flush() {
      this._queue.flush();
    }
  },
  Wo = class extends F {
    constructor(e, t, n, r, i, a, o, s, c) {
      (super(),
        (this._rowCount = e),
        (this._optionsService = n),
        (this._charSizeService = r),
        (this._coreService = i),
        (this._coreBrowserService = s),
        (this._renderer = this._register(new zn())),
        (this._pausedResizeTask = new Uo()),
        (this._observerDisposable = this._register(new zn())),
        (this._isPaused = !1),
        (this._needsFullRefresh = !1),
        (this._isNextRenderRedrawOnly = !0),
        (this._needsSelectionRefresh = !1),
        (this._canvasWidth = 0),
        (this._canvasHeight = 0),
        (this._selectionState = {
          start: void 0,
          end: void 0,
          columnSelectMode: !1,
        }),
        (this._onDimensionsChange = this._register(new L())),
        (this.onDimensionsChange = this._onDimensionsChange.event),
        (this._onRenderedViewportChange = this._register(new L())),
        (this.onRenderedViewportChange = this._onRenderedViewportChange.event),
        (this._onRender = this._register(new L())),
        (this.onRender = this._onRender.event),
        (this._onRefreshRequest = this._register(new L())),
        (this.onRefreshRequest = this._onRefreshRequest.event),
        (this._renderDebouncer = new wo(
          (e, t) => this._renderRows(e, t),
          this._coreBrowserService,
        )),
        this._register(this._renderDebouncer),
        (this._syncOutputHandler = new Go(
          this._coreBrowserService,
          this._coreService,
          () => this._fullRefresh(),
        )),
        this._register(P(() => this._syncOutputHandler.dispose())),
        this._register(
          this._coreBrowserService.onDprChange(() =>
            this.handleDevicePixelRatioChange(),
          ),
        ),
        this._register(o.onResize(() => this._fullRefresh())),
        this._register(
          o.buffers.onBufferActivate(() => this._renderer.value?.clear()),
        ),
        this._register(
          this._optionsService.onOptionChange(() =>
            this._handleOptionsChanged(),
          ),
        ),
        this._register(
          this._charSizeService.onCharSizeChange(() =>
            this.handleCharSizeChanged(),
          ),
        ),
        this._register(a.onDecorationRegistered(() => this._fullRefresh())),
        this._register(a.onDecorationRemoved(() => this._fullRefresh())),
        this._register(
          this._optionsService.onMultipleOptionChange(
            [
              `customGlyphs`,
              `drawBoldTextInBrightColors`,
              `letterSpacing`,
              `lineHeight`,
              `fontFamily`,
              `fontSize`,
              `fontWeight`,
              `fontWeightBold`,
              `minimumContrastRatio`,
              `rescaleOverlappingGlyphs`,
            ],
            () => {
              (this.clear(),
                this.handleResize(o.cols, o.rows),
                this._fullRefresh());
            },
          ),
        ),
        this._register(
          this._optionsService.onMultipleOptionChange(
            [`cursorBlink`, `cursorStyle`],
            () => this.refreshRows(o.buffer.y, o.buffer.y, !0),
          ),
        ),
        this._register(c.onChangeColors(() => this._fullRefresh())),
        this._registerIntersectionObserver(this._coreBrowserService.window, t),
        this._register(
          this._coreBrowserService.onWindowChange((e) =>
            this._registerIntersectionObserver(e, t),
          ),
        ));
    }
    get dimensions() {
      return this._renderer.value.dimensions;
    }
    _registerIntersectionObserver(e, t) {
      if (`IntersectionObserver` in e) {
        let n = new e.IntersectionObserver(
          (e) => this._handleIntersectionChange(e[e.length - 1]),
          { threshold: 0 },
        );
        (n.observe(t),
          (this._observerDisposable.value = P(() => n.disconnect())));
      }
    }
    _handleIntersectionChange(e) {
      ((this._isPaused =
        e.isIntersecting === void 0
          ? e.intersectionRatio === 0
          : !e.isIntersecting),
        !this._isPaused &&
          !this._charSizeService.hasValidSize &&
          this._charSizeService.measure(),
        !this._isPaused &&
          this._needsFullRefresh &&
          (this._pausedResizeTask.flush(),
          this.refreshRows(0, this._rowCount - 1),
          (this._needsFullRefresh = !1)));
    }
    refreshRows(e, t, n = !1) {
      if (this._isPaused) {
        this._needsFullRefresh = !0;
        return;
      }
      if (this._coreService.decPrivateModes.synchronizedOutput) {
        this._syncOutputHandler.bufferRows(e, t);
        return;
      }
      let r = this._syncOutputHandler.flush();
      (r && ((e = Math.min(e, r.start)), (t = Math.max(t, r.end))),
        n || (this._isNextRenderRedrawOnly = !1),
        this._renderDebouncer.refresh(e, t, this._rowCount));
    }
    _renderRows(e, t) {
      if (this._renderer.value) {
        if (this._coreService.decPrivateModes.synchronizedOutput) {
          this._syncOutputHandler.bufferRows(e, t);
          return;
        }
        ((e = Math.min(e, this._rowCount - 1)),
          (t = Math.min(t, this._rowCount - 1)),
          this._renderer.value.renderRows(e, t),
          (this._needsSelectionRefresh &&=
            (this._renderer.value.handleSelectionChanged(
              this._selectionState.start,
              this._selectionState.end,
              this._selectionState.columnSelectMode,
            ),
            !1)),
          this._isNextRenderRedrawOnly ||
            this._onRenderedViewportChange.fire({ start: e, end: t }),
          this._onRender.fire({ start: e, end: t }),
          (this._isNextRenderRedrawOnly = !0));
      }
    }
    resize(e, t) {
      ((this._rowCount = t), this._fireOnCanvasResize());
    }
    _handleOptionsChanged() {
      this._renderer.value &&
        (this.refreshRows(0, this._rowCount - 1), this._fireOnCanvasResize());
    }
    _fireOnCanvasResize() {
      this._renderer.value &&
        ((this._renderer.value.dimensions.css.canvas.width ===
          this._canvasWidth &&
          this._renderer.value.dimensions.css.canvas.height ===
            this._canvasHeight) ||
          this._onDimensionsChange.fire(this._renderer.value.dimensions));
    }
    hasRenderer() {
      return !!this._renderer.value;
    }
    setRenderer(e) {
      ((this._renderer.value = e),
        this._renderer.value &&
          (this._renderer.value.onRequestRedraw((e) =>
            this.refreshRows(e.start, e.end, !0),
          ),
          (this._needsSelectionRefresh = !0),
          this._fullRefresh()));
    }
    addRefreshCallback(e) {
      return this._renderDebouncer.addRefreshCallback(e);
    }
    _fullRefresh() {
      this._isPaused
        ? (this._needsFullRefresh = !0)
        : this.refreshRows(0, this._rowCount - 1);
    }
    clearTextureAtlas() {
      this._renderer.value &&
        (this._renderer.value.clearTextureAtlas?.(), this._fullRefresh());
    }
    handleDevicePixelRatioChange() {
      (this._charSizeService.measure(),
        this._renderer.value &&
          (this._renderer.value.handleDevicePixelRatioChange(),
          this.refreshRows(0, this._rowCount - 1)));
    }
    handleResize(e, t) {
      this._renderer.value &&
        (this._isPaused
          ? this._pausedResizeTask.set(() =>
              this._renderer.value?.handleResize(e, t),
            )
          : this._renderer.value.handleResize(e, t),
        this._fullRefresh());
    }
    handleCharSizeChanged() {
      this._renderer.value?.handleCharSizeChanged();
    }
    handleBlur() {
      this._renderer.value?.handleBlur();
    }
    handleFocus() {
      this._renderer.value?.handleFocus();
    }
    handleSelectionChanged(e, t, n) {
      ((this._selectionState.start = e),
        (this._selectionState.end = t),
        (this._selectionState.columnSelectMode = n),
        this._renderer.value?.handleSelectionChanged(e, t, n));
    }
    handleCursorMove() {
      this._renderer.value?.handleCursorMove();
    }
    clear() {
      this._renderer.value?.clear();
    }
  };
Wo = j(
  [M(2, Kt), M(3, Qt), M(4, Ht), M(5, Yt), M(6, Bt), M(7, $t), M(8, an)],
  Wo,
);
var Go = class {
  constructor(e, t, n) {
    ((this._coreBrowserService = e),
      (this._coreService = t),
      (this._onTimeout = n),
      (this._start = 0),
      (this._end = 0),
      (this._isBuffering = !1));
  }
  bufferRows(e, t) {
    (this._isBuffering
      ? ((this._start = Math.min(this._start, e)),
        (this._end = Math.max(this._end, t)))
      : ((this._start = e), (this._end = t), (this._isBuffering = !0)),
      this._timeout === void 0 &&
        (this._timeout = this._coreBrowserService.window.setTimeout(() => {
          ((this._timeout = void 0),
            (this._coreService.decPrivateModes.synchronizedOutput = !1),
            this._onTimeout());
        }, 1e3)));
  }
  flush() {
    if (
      (this._timeout !== void 0 &&
        (this._coreBrowserService.window.clearTimeout(this._timeout),
        (this._timeout = void 0)),
      !this._isBuffering)
    )
      return;
    let e = { start: this._start, end: this._end };
    return ((this._isBuffering = !1), e);
  }
  dispose() {
    this._timeout !== void 0 &&
      (this._coreBrowserService.window.clearTimeout(this._timeout),
      (this._timeout = void 0));
  }
};
function Ko(e, t, n, r) {
  let i = n.buffer.x,
    a = n.buffer.y;
  if (!n.buffer.hasScrollback)
    return Yo(i, a, e, t, n, r) + Xo(a, t, n, r) + Zo(i, a, e, t, n, r);
  let o;
  if (a === t) return ((o = i > e ? `D` : `C`), is(Math.abs(i - e), rs(o, r)));
  o = a > t ? `D` : `C`;
  let s = Math.abs(a - t);
  return is(
    Jo(a > t ? e : i, n) + (s - 1) * n.cols + 1 + qo(a > t ? i : e, n),
    rs(o, r),
  );
}
function qo(e, t) {
  return e - 1;
}
function Jo(e, t) {
  return t.cols - e;
}
function Yo(e, t, n, r, i, a) {
  return Xo(t, r, i, a).length === 0
    ? ``
    : is(ns(e, t, e, t - $o(t, i), !1, i).length, rs(`D`, a));
}
function Xo(e, t, n, r) {
  let i = e - $o(e, n),
    a = t - $o(t, n);
  return is(Math.abs(i - a) - Qo(e, t, n), rs(ts(e, t), r));
}
function Zo(e, t, n, r, i, a) {
  let o;
  o = Xo(t, r, i, a).length > 0 ? r - $o(r, i) : t;
  let s = r,
    c = es(e, t, n, r, i, a);
  return is(ns(e, o, n, s, c === `C`, i).length, rs(c, a));
}
function Qo(e, t, n) {
  let r = 0,
    i = e - $o(e, n),
    a = t - $o(t, n);
  for (let o = 0; o < Math.abs(i - a); o++) {
    let a = ts(e, t) === `A` ? -1 : 1;
    n.buffer.lines.get(i + a * o)?.isWrapped && r++;
  }
  return r;
}
function $o(e, t) {
  let n = 0,
    r = t.buffer.lines.get(e),
    i = r?.isWrapped;
  for (; i && e >= 0 && e < t.rows; )
    (n++, (r = t.buffer.lines.get(--e)), (i = r?.isWrapped));
  return n;
}
function es(e, t, n, r, i, a) {
  let o;
  return (
    (o = Xo(n, r, i, a).length > 0 ? r - $o(r, i) : t),
    (e < n && o <= r) || (e >= n && o < r) ? `C` : `D`
  );
}
function ts(e, t) {
  return e > t ? `A` : `B`;
}
function ns(e, t, n, r, i, a) {
  let o = e,
    s = t,
    c = ``;
  for (; (o !== n || s !== r) && s >= 0 && s < a.buffer.lines.length; )
    ((o += i ? 1 : -1),
      i && o > a.cols - 1
        ? ((c += a.buffer.translateBufferLineToString(s, !1, e, o)),
          (o = 0),
          (e = 0),
          s++)
        : !i &&
          o < 0 &&
          ((c += a.buffer.translateBufferLineToString(s, !1, 0, e + 1)),
          (o = a.cols - 1),
          (e = o),
          s--));
  return c + a.buffer.translateBufferLineToString(s, !1, e, o);
}
function rs(e, t) {
  let n = t ? `O` : `[`;
  return B.ESC + n + e;
}
function is(e, t) {
  e = Math.floor(e);
  let n = ``;
  for (let r = 0; r < e; r++) n += t;
  return n;
}
var as = class {
  constructor(e) {
    ((this._bufferService = e),
      (this.isSelectAllActive = !1),
      (this.selectionStartLength = 0));
  }
  clearSelection() {
    ((this.selectionStart = void 0),
      (this.selectionEnd = void 0),
      (this.isSelectAllActive = !1),
      (this.selectionStartLength = 0));
  }
  get finalSelectionStart() {
    return this.isSelectAllActive
      ? [0, 0]
      : !this.selectionEnd || !this.selectionStart
        ? this.selectionStart
        : this.areSelectionValuesReversed()
          ? this.selectionEnd
          : this.selectionStart;
  }
  get finalSelectionEnd() {
    if (this.isSelectAllActive)
      return [
        this._bufferService.cols,
        this._bufferService.buffer.ybase + this._bufferService.rows - 1,
      ];
    if (this.selectionStart) {
      if (!this.selectionEnd || this.areSelectionValuesReversed()) {
        let e = this.selectionStart[0] + this.selectionStartLength;
        return e > this._bufferService.cols
          ? e % this._bufferService.cols === 0
            ? [
                this._bufferService.cols,
                this.selectionStart[1] +
                  Math.floor(e / this._bufferService.cols) -
                  1,
              ]
            : [
                e % this._bufferService.cols,
                this.selectionStart[1] +
                  Math.floor(e / this._bufferService.cols),
              ]
          : [e, this.selectionStart[1]];
      }
      if (
        this.selectionStartLength &&
        this.selectionEnd[1] === this.selectionStart[1]
      ) {
        let e = this.selectionStart[0] + this.selectionStartLength;
        return e > this._bufferService.cols
          ? [
              e % this._bufferService.cols,
              this.selectionStart[1] + Math.floor(e / this._bufferService.cols),
            ]
          : [Math.max(e, this.selectionEnd[0]), this.selectionEnd[1]];
      }
      return this.selectionEnd;
    }
  }
  areSelectionValuesReversed() {
    let e = this.selectionStart,
      t = this.selectionEnd;
    return !e || !t ? !1 : e[1] > t[1] || (e[1] === t[1] && e[0] > t[0]);
  }
  handleTrim(e) {
    return (
      this.selectionStart && (this.selectionStart[1] -= e),
      this.selectionEnd && (this.selectionEnd[1] -= e),
      this.selectionEnd && this.selectionEnd[1] < 0
        ? (this.clearSelection(), !0)
        : (this.selectionStart &&
            this.selectionStart[1] < 0 &&
            (this.selectionStart[1] = 0),
          !1)
    );
  }
};
function os(e, t) {
  if (e.start.y > e.end.y)
    throw Error(
      `Buffer range end (${e.end.x}, ${e.end.y}) cannot be before start (${e.start.x}, ${e.start.y})`,
    );
  return t * (e.end.y - e.start.y) + (e.end.x - e.start.x + 1);
}
var ss = 50,
  cs = 15,
  ls = 50,
  us = 500,
  ds = RegExp(`\xA0`, `g`),
  fs = class extends F {
    constructor(e, t, n, r, i, a, o, s, c) {
      (super(),
        (this._element = e),
        (this._screenElement = t),
        (this._linkifier = n),
        (this._bufferService = r),
        (this._coreService = i),
        (this._mouseService = a),
        (this._optionsService = o),
        (this._renderService = s),
        (this._coreBrowserService = c),
        (this._dragScrollAmount = 0),
        (this._enabled = !0),
        (this._workCell = new Pt()),
        (this._mouseDownTimeStamp = 0),
        (this._oldHasSelection = !1),
        (this._oldSelectionStart = void 0),
        (this._oldSelectionEnd = void 0),
        (this._onLinuxMouseSelection = this._register(new L())),
        (this.onLinuxMouseSelection = this._onLinuxMouseSelection.event),
        (this._onRedrawRequest = this._register(new L())),
        (this.onRequestRedraw = this._onRedrawRequest.event),
        (this._onSelectionChange = this._register(new L())),
        (this.onSelectionChange = this._onSelectionChange.event),
        (this._onRequestScrollLines = this._register(new L())),
        (this.onRequestScrollLines = this._onRequestScrollLines.event),
        (this._mouseMoveListener = (e) => this._handleMouseMove(e)),
        (this._mouseUpListener = (e) => this._handleMouseUp(e)),
        this._coreService.onUserInput(() => {
          this.hasSelection && this.clearSelection();
        }),
        (this._trimListener = this._bufferService.buffer.lines.onTrim((e) =>
          this._handleTrim(e),
        )),
        this._register(
          this._bufferService.buffers.onBufferActivate((e) =>
            this._handleBufferActivate(e),
          ),
        ),
        this.enable(),
        (this._model = new as(this._bufferService)),
        (this._activeSelectionMode = 0),
        this._register(
          P(() => {
            this._removeMouseDownListeners();
          }),
        ),
        this._register(
          this._bufferService.onResize((e) => {
            e.rowsChanged && this.clearSelection();
          }),
        ));
    }
    reset() {
      this.clearSelection();
    }
    disable() {
      (this.clearSelection(), (this._enabled = !1));
    }
    enable() {
      this._enabled = !0;
    }
    get selectionStart() {
      return this._model.finalSelectionStart;
    }
    get selectionEnd() {
      return this._model.finalSelectionEnd;
    }
    get hasSelection() {
      let e = this._model.finalSelectionStart,
        t = this._model.finalSelectionEnd;
      return !e || !t ? !1 : e[0] !== t[0] || e[1] !== t[1];
    }
    get selectionText() {
      let e = this._model.finalSelectionStart,
        t = this._model.finalSelectionEnd;
      if (!e || !t) return ``;
      let n = this._bufferService.buffer,
        r = [];
      if (this._activeSelectionMode === 3) {
        if (e[0] === t[0]) return ``;
        let i = e[0] < t[0] ? e[0] : t[0],
          a = e[0] < t[0] ? t[0] : e[0];
        for (let o = e[1]; o <= t[1]; o++) {
          let e = n.translateBufferLineToString(o, !0, i, a);
          r.push(e);
        }
      } else {
        let i = e[1] === t[1] ? t[0] : void 0;
        r.push(n.translateBufferLineToString(e[1], !0, e[0], i));
        for (let i = e[1] + 1; i <= t[1] - 1; i++) {
          let e = n.lines.get(i),
            t = n.translateBufferLineToString(i, !0);
          e?.isWrapped ? (r[r.length - 1] += t) : r.push(t);
        }
        if (e[1] !== t[1]) {
          let e = n.lines.get(t[1]),
            i = n.translateBufferLineToString(t[1], !0, 0, t[0]);
          e && e.isWrapped ? (r[r.length - 1] += i) : r.push(i);
        }
      }
      return r
        .map((e) => e.replace(ds, ` `))
        .join(
          Io
            ? `\r
`
            : `
`,
        );
    }
    clearSelection() {
      (this._model.clearSelection(),
        this._removeMouseDownListeners(),
        this.refresh(),
        this._onSelectionChange.fire());
    }
    refresh(e) {
      ((this._refreshAnimationFrame ||=
        this._coreBrowserService.window.requestAnimationFrame(() =>
          this._refresh(),
        )),
        Lo &&
          e &&
          this.selectionText.length &&
          this._onLinuxMouseSelection.fire(this.selectionText));
    }
    _refresh() {
      ((this._refreshAnimationFrame = void 0),
        this._onRedrawRequest.fire({
          start: this._model.finalSelectionStart,
          end: this._model.finalSelectionEnd,
          columnSelectMode: this._activeSelectionMode === 3,
        }));
    }
    _isClickInSelection(e) {
      let t = this._getMouseBufferCoords(e),
        n = this._model.finalSelectionStart,
        r = this._model.finalSelectionEnd;
      return !n || !r || !t ? !1 : this._areCoordsInSelection(t, n, r);
    }
    isCellInSelection(e, t) {
      let n = this._model.finalSelectionStart,
        r = this._model.finalSelectionEnd;
      return !n || !r ? !1 : this._areCoordsInSelection([e, t], n, r);
    }
    _areCoordsInSelection(e, t, n) {
      return (
        (e[1] > t[1] && e[1] < n[1]) ||
        (t[1] === n[1] && e[1] === t[1] && e[0] >= t[0] && e[0] < n[0]) ||
        (t[1] < n[1] && e[1] === n[1] && e[0] < n[0]) ||
        (t[1] < n[1] && e[1] === t[1] && e[0] >= t[0])
      );
    }
    _selectWordAtCursor(e, t) {
      let n = this._linkifier.currentLink?.link?.range;
      if (n)
        return (
          (this._model.selectionStart = [n.start.x - 1, n.start.y - 1]),
          (this._model.selectionStartLength = os(n, this._bufferService.cols)),
          (this._model.selectionEnd = void 0),
          !0
        );
      let r = this._getMouseBufferCoords(e);
      return r
        ? (this._selectWordAt(r, t), (this._model.selectionEnd = void 0), !0)
        : !1;
    }
    selectAll() {
      ((this._model.isSelectAllActive = !0),
        this.refresh(),
        this._onSelectionChange.fire());
    }
    selectLines(e, t) {
      (this._model.clearSelection(),
        (e = Math.max(e, 0)),
        (t = Math.min(t, this._bufferService.buffer.lines.length - 1)),
        (this._model.selectionStart = [0, e]),
        (this._model.selectionEnd = [this._bufferService.cols, t]),
        this.refresh(),
        this._onSelectionChange.fire());
    }
    _handleTrim(e) {
      this._model.handleTrim(e) && this.refresh();
    }
    _getMouseBufferCoords(e) {
      let t = this._mouseService.getCoords(
        e,
        this._screenElement,
        this._bufferService.cols,
        this._bufferService.rows,
        !0,
      );
      if (t)
        return (t[0]--, t[1]--, (t[1] += this._bufferService.buffer.ydisp), t);
    }
    _getMouseEventScrollAmount(e) {
      let t = xo(this._coreBrowserService.window, e, this._screenElement)[1],
        n = this._renderService.dimensions.css.canvas.height;
      return t >= 0 && t <= n
        ? 0
        : (t > n && (t -= n),
          (t = Math.min(Math.max(t, -ss), ss)),
          (t /= ss),
          t / Math.abs(t) + Math.round(t * (cs - 1)));
    }
    shouldForceSelection(e) {
      return No
        ? e.altKey &&
            this._optionsService.rawOptions.macOptionClickForcesSelection
        : e.shiftKey;
    }
    handleMouseDown(e) {
      if (
        ((this._mouseDownTimeStamp = e.timeStamp),
        !(e.button === 2 && this.hasSelection) && e.button === 0)
      ) {
        if (!this._enabled) {
          if (!this.shouldForceSelection(e)) return;
          e.stopPropagation();
        }
        (e.preventDefault(),
          (this._dragScrollAmount = 0),
          this._enabled && e.shiftKey
            ? this._handleIncrementalClick(e)
            : e.detail === 1
              ? this._handleSingleClick(e)
              : e.detail === 2
                ? this._handleDoubleClick(e)
                : e.detail === 3 && this._handleTripleClick(e),
          this._addMouseDownListeners(),
          this.refresh(!0));
      }
    }
    _addMouseDownListeners() {
      (this._screenElement.ownerDocument &&
        (this._screenElement.ownerDocument.addEventListener(
          `mousemove`,
          this._mouseMoveListener,
        ),
        this._screenElement.ownerDocument.addEventListener(
          `mouseup`,
          this._mouseUpListener,
        )),
        (this._dragScrollIntervalTimer =
          this._coreBrowserService.window.setInterval(
            () => this._dragScroll(),
            ls,
          )));
    }
    _removeMouseDownListeners() {
      (this._screenElement.ownerDocument &&
        (this._screenElement.ownerDocument.removeEventListener(
          `mousemove`,
          this._mouseMoveListener,
        ),
        this._screenElement.ownerDocument.removeEventListener(
          `mouseup`,
          this._mouseUpListener,
        )),
        this._coreBrowserService.window.clearInterval(
          this._dragScrollIntervalTimer,
        ),
        (this._dragScrollIntervalTimer = void 0));
    }
    _handleIncrementalClick(e) {
      this._model.selectionStart &&
        (this._model.selectionEnd = this._getMouseBufferCoords(e));
    }
    _handleSingleClick(e) {
      if (
        ((this._model.selectionStartLength = 0),
        (this._model.isSelectAllActive = !1),
        (this._activeSelectionMode = this.shouldColumnSelect(e) ? 3 : 0),
        (this._model.selectionStart = this._getMouseBufferCoords(e)),
        !this._model.selectionStart)
      )
        return;
      this._model.selectionEnd = void 0;
      let t = this._bufferService.buffer.lines.get(
        this._model.selectionStart[1],
      );
      t &&
        t.length !== this._model.selectionStart[0] &&
        t.hasWidth(this._model.selectionStart[0]) === 0 &&
        this._model.selectionStart[0]++;
    }
    _handleDoubleClick(e) {
      this._selectWordAtCursor(e, !0) && (this._activeSelectionMode = 1);
    }
    _handleTripleClick(e) {
      let t = this._getMouseBufferCoords(e);
      t && ((this._activeSelectionMode = 2), this._selectLineAt(t[1]));
    }
    shouldColumnSelect(e) {
      return (
        e.altKey &&
        !(No && this._optionsService.rawOptions.macOptionClickForcesSelection)
      );
    }
    _handleMouseMove(e) {
      if ((e.stopImmediatePropagation(), !this._model.selectionStart)) return;
      let t = this._model.selectionEnd
        ? [this._model.selectionEnd[0], this._model.selectionEnd[1]]
        : null;
      if (
        ((this._model.selectionEnd = this._getMouseBufferCoords(e)),
        !this._model.selectionEnd)
      ) {
        this.refresh(!0);
        return;
      }
      (this._activeSelectionMode === 2
        ? this._model.selectionEnd[1] < this._model.selectionStart[1]
          ? (this._model.selectionEnd[0] = 0)
          : (this._model.selectionEnd[0] = this._bufferService.cols)
        : this._activeSelectionMode === 1 &&
          this._selectToWordAt(this._model.selectionEnd),
        (this._dragScrollAmount = this._getMouseEventScrollAmount(e)),
        this._activeSelectionMode !== 3 &&
          (this._dragScrollAmount > 0
            ? (this._model.selectionEnd[0] = this._bufferService.cols)
            : this._dragScrollAmount < 0 && (this._model.selectionEnd[0] = 0)));
      let n = this._bufferService.buffer;
      if (this._model.selectionEnd[1] < n.lines.length) {
        let e = n.lines.get(this._model.selectionEnd[1]);
        e &&
          e.hasWidth(this._model.selectionEnd[0]) === 0 &&
          this._model.selectionEnd[0] < this._bufferService.cols &&
          this._model.selectionEnd[0]++;
      }
      (!t ||
        t[0] !== this._model.selectionEnd[0] ||
        t[1] !== this._model.selectionEnd[1]) &&
        this.refresh(!0);
    }
    _dragScroll() {
      if (
        !(!this._model.selectionEnd || !this._model.selectionStart) &&
        this._dragScrollAmount
      ) {
        this._onRequestScrollLines.fire({
          amount: this._dragScrollAmount,
          suppressScrollEvent: !1,
        });
        let e = this._bufferService.buffer;
        (this._dragScrollAmount > 0
          ? (this._activeSelectionMode !== 3 &&
              (this._model.selectionEnd[0] = this._bufferService.cols),
            (this._model.selectionEnd[1] = Math.min(
              e.ydisp + this._bufferService.rows,
              e.lines.length - 1,
            )))
          : (this._activeSelectionMode !== 3 &&
              (this._model.selectionEnd[0] = 0),
            (this._model.selectionEnd[1] = e.ydisp)),
          this.refresh());
      }
    }
    _handleMouseUp(e) {
      let t = e.timeStamp - this._mouseDownTimeStamp;
      if (
        (this._removeMouseDownListeners(),
        this.selectionText.length <= 1 &&
          t < us &&
          e.altKey &&
          this._optionsService.rawOptions.altClickMovesCursor)
      ) {
        if (
          this._bufferService.buffer.ybase === this._bufferService.buffer.ydisp
        ) {
          let t = this._mouseService.getCoords(
            e,
            this._element,
            this._bufferService.cols,
            this._bufferService.rows,
            !1,
          );
          if (t && t[0] !== void 0 && t[1] !== void 0) {
            let e = Ko(
              t[0] - 1,
              t[1] - 1,
              this._bufferService,
              this._coreService.decPrivateModes.applicationCursorKeys,
            );
            this._coreService.triggerDataEvent(e, !0);
          }
        }
      } else this._fireEventIfSelectionChanged();
    }
    _fireEventIfSelectionChanged() {
      let e = this._model.finalSelectionStart,
        t = this._model.finalSelectionEnd,
        n = !!e && !!t && (e[0] !== t[0] || e[1] !== t[1]);
      if (!n) {
        this._oldHasSelection && this._fireOnSelectionChange(e, t, n);
        return;
      }
      !e ||
        !t ||
        ((!this._oldSelectionStart ||
          !this._oldSelectionEnd ||
          e[0] !== this._oldSelectionStart[0] ||
          e[1] !== this._oldSelectionStart[1] ||
          t[0] !== this._oldSelectionEnd[0] ||
          t[1] !== this._oldSelectionEnd[1]) &&
          this._fireOnSelectionChange(e, t, n));
    }
    _fireOnSelectionChange(e, t, n) {
      ((this._oldSelectionStart = e),
        (this._oldSelectionEnd = t),
        (this._oldHasSelection = n),
        this._onSelectionChange.fire());
    }
    _handleBufferActivate(e) {
      (this.clearSelection(),
        this._trimListener.dispose(),
        (this._trimListener = e.activeBuffer.lines.onTrim((e) =>
          this._handleTrim(e),
        )));
    }
    _convertViewportColToCharacterIndex(e, t) {
      let n = t;
      for (let r = 0; t >= r; r++) {
        let i = e.loadCell(r, this._workCell).getChars().length;
        this._workCell.getWidth() === 0
          ? n--
          : i > 1 && t !== r && (n += i - 1);
      }
      return n;
    }
    setSelection(e, t, n) {
      (this._model.clearSelection(),
        this._removeMouseDownListeners(),
        (this._model.selectionStart = [e, t]),
        (this._model.selectionStartLength = n),
        this.refresh(),
        this._fireEventIfSelectionChanged());
    }
    rightClickSelect(e) {
      this._isClickInSelection(e) ||
        (this._selectWordAtCursor(e, !1) && this.refresh(!0),
        this._fireEventIfSelectionChanged());
    }
    _getWordAt(e, t, n = !0, r = !0) {
      if (e[0] >= this._bufferService.cols) return;
      let i = this._bufferService.buffer,
        a = i.lines.get(e[1]);
      if (!a) return;
      let o = i.translateBufferLineToString(e[1], !1),
        s = this._convertViewportColToCharacterIndex(a, e[0]),
        c = s,
        l = e[0] - s,
        u = 0,
        d = 0,
        f = 0,
        p = 0;
      if (o.charAt(s) === ` `) {
        for (; s > 0 && o.charAt(s - 1) === ` `; ) s--;
        for (; c < o.length && o.charAt(c + 1) === ` `; ) c++;
      } else {
        let t = e[0],
          n = e[0];
        (a.getWidth(t) === 0 && (u++, t--), a.getWidth(n) === 2 && (d++, n++));
        let r = a.getString(n).length;
        for (
          r > 1 && ((p += r - 1), (c += r - 1));
          t > 0 &&
          s > 0 &&
          !this._isCharWordSeparator(a.loadCell(t - 1, this._workCell));
        ) {
          a.loadCell(t - 1, this._workCell);
          let e = this._workCell.getChars().length;
          (this._workCell.getWidth() === 0
            ? (u++, t--)
            : e > 1 && ((f += e - 1), (s -= e - 1)),
            s--,
            t--);
        }
        for (
          ;
          n < a.length &&
          c + 1 < o.length &&
          !this._isCharWordSeparator(a.loadCell(n + 1, this._workCell));
        ) {
          a.loadCell(n + 1, this._workCell);
          let e = this._workCell.getChars().length;
          (this._workCell.getWidth() === 2
            ? (d++, n++)
            : e > 1 && ((p += e - 1), (c += e - 1)),
            c++,
            n++);
        }
      }
      c++;
      let m = s + l - u + f,
        h = Math.min(this._bufferService.cols, c - s + u + d - f - p);
      if (!(!t && o.slice(s, c).trim() === ``)) {
        if (n && m === 0 && a.getCodePoint(0) !== 32) {
          let t = i.lines.get(e[1] - 1);
          if (
            t &&
            a.isWrapped &&
            t.getCodePoint(this._bufferService.cols - 1) !== 32
          ) {
            let t = this._getWordAt(
              [this._bufferService.cols - 1, e[1] - 1],
              !1,
              !0,
              !1,
            );
            if (t) {
              let e = this._bufferService.cols - t.start;
              ((m -= e), (h += e));
            }
          }
        }
        if (
          r &&
          m + h === this._bufferService.cols &&
          a.getCodePoint(this._bufferService.cols - 1) !== 32
        ) {
          let t = i.lines.get(e[1] + 1);
          if (t?.isWrapped && t.getCodePoint(0) !== 32) {
            let t = this._getWordAt([0, e[1] + 1], !1, !1, !0);
            t && (h += t.length);
          }
        }
        return { start: m, length: h };
      }
    }
    _selectWordAt(e, t) {
      let n = this._getWordAt(e, t);
      if (n) {
        for (; n.start < 0; ) ((n.start += this._bufferService.cols), e[1]--);
        ((this._model.selectionStart = [n.start, e[1]]),
          (this._model.selectionStartLength = n.length));
      }
    }
    _selectToWordAt(e) {
      let t = this._getWordAt(e, !0);
      if (t) {
        let n = e[1];
        for (; t.start < 0; ) ((t.start += this._bufferService.cols), n--);
        if (!this._model.areSelectionValuesReversed())
          for (; t.start + t.length > this._bufferService.cols; )
            ((t.length -= this._bufferService.cols), n++);
        this._model.selectionEnd = [
          this._model.areSelectionValuesReversed()
            ? t.start
            : t.start + t.length,
          n,
        ];
      }
    }
    _isCharWordSeparator(e) {
      return e.getWidth() === 0
        ? !1
        : this._optionsService.rawOptions.wordSeparator.indexOf(e.getChars()) >=
            0;
    }
    _selectLineAt(e) {
      let t = this._bufferService.buffer.getWrappedRangeForLine(e),
        n = {
          start: { x: 0, y: t.first },
          end: { x: this._bufferService.cols - 1, y: t.last },
        };
      ((this._model.selectionStart = [0, t.first]),
        (this._model.selectionEnd = void 0),
        (this._model.selectionStartLength = os(n, this._bufferService.cols)));
    }
  };
fs = j([M(3, Bt), M(4, Ht), M(5, en), M(6, Kt), M(7, tn), M(8, $t)], fs);
var ps = class {
    constructor() {
      this._data = {};
    }
    set(e, t, n) {
      (this._data[e] || (this._data[e] = {}), (this._data[e][t] = n));
    }
    get(e, t) {
      return this._data[e] ? this._data[e][t] : void 0;
    }
    clear() {
      this._data = {};
    }
  },
  ms = class {
    constructor() {
      ((this._color = new ps()), (this._css = new ps()));
    }
    setCss(e, t, n) {
      this._css.set(e, t, n);
    }
    getCss(e, t) {
      return this._css.get(e, t);
    }
    setColor(e, t, n) {
      this._color.set(e, t, n);
    }
    getColor(e, t) {
      return this._color.get(e, t);
    }
    clear() {
      (this._color.clear(), this._css.clear());
    }
  },
  q = Object.freeze(
    (() => {
      let e = [
          K.toColor(`#2e3436`),
          K.toColor(`#cc0000`),
          K.toColor(`#4e9a06`),
          K.toColor(`#c4a000`),
          K.toColor(`#3465a4`),
          K.toColor(`#75507b`),
          K.toColor(`#06989a`),
          K.toColor(`#d3d7cf`),
          K.toColor(`#555753`),
          K.toColor(`#ef2929`),
          K.toColor(`#8ae234`),
          K.toColor(`#fce94f`),
          K.toColor(`#729fcf`),
          K.toColor(`#ad7fa8`),
          K.toColor(`#34e2e2`),
          K.toColor(`#eeeeec`),
        ],
        t = [0, 95, 135, 175, 215, 255];
      for (let n = 0; n < 216; n++) {
        let r = t[((n / 36) % 6) | 0],
          i = t[((n / 6) % 6) | 0],
          a = t[n % 6];
        e.push({ css: W.toCss(r, i, a), rgba: W.toRgba(r, i, a) });
      }
      for (let t = 0; t < 24; t++) {
        let n = 8 + t * 10;
        e.push({ css: W.toCss(n, n, n), rgba: W.toRgba(n, n, n) });
      }
      return e;
    })(),
  ),
  hs = K.toColor(`#ffffff`),
  gs = K.toColor(`#000000`),
  _s = K.toColor(`#ffffff`),
  vs = gs,
  ys = { css: `rgba(255, 255, 255, 0.3)`, rgba: 4294967117 },
  bs = hs,
  xs = class extends F {
    constructor(e) {
      (super(),
        (this._optionsService = e),
        (this._contrastCache = new ms()),
        (this._halfContrastCache = new ms()),
        (this._onChangeColors = this._register(new L())),
        (this.onChangeColors = this._onChangeColors.event),
        (this._colors = {
          foreground: hs,
          background: gs,
          cursor: _s,
          cursorAccent: vs,
          selectionForeground: void 0,
          selectionBackgroundTransparent: ys,
          selectionBackgroundOpaque: G.blend(gs, ys),
          selectionInactiveBackgroundTransparent: ys,
          selectionInactiveBackgroundOpaque: G.blend(gs, ys),
          scrollbarSliderBackground: G.opacity(hs, 0.2),
          scrollbarSliderHoverBackground: G.opacity(hs, 0.4),
          scrollbarSliderActiveBackground: G.opacity(hs, 0.5),
          overviewRulerBorder: hs,
          ansi: q.slice(),
          contrastCache: this._contrastCache,
          halfContrastCache: this._halfContrastCache,
        }),
        this._updateRestoreColors(),
        this._setTheme(this._optionsService.rawOptions.theme),
        this._register(
          this._optionsService.onSpecificOptionChange(
            `minimumContrastRatio`,
            () => this._contrastCache.clear(),
          ),
        ),
        this._register(
          this._optionsService.onSpecificOptionChange(`theme`, () =>
            this._setTheme(this._optionsService.rawOptions.theme),
          ),
        ));
    }
    get colors() {
      return this._colors;
    }
    _setTheme(e = {}) {
      let t = this._colors;
      if (
        ((t.foreground = J(e.foreground, hs)),
        (t.background = J(e.background, gs)),
        (t.cursor = G.blend(t.background, J(e.cursor, _s))),
        (t.cursorAccent = G.blend(t.background, J(e.cursorAccent, vs))),
        (t.selectionBackgroundTransparent = J(e.selectionBackground, ys)),
        (t.selectionBackgroundOpaque = G.blend(
          t.background,
          t.selectionBackgroundTransparent,
        )),
        (t.selectionInactiveBackgroundTransparent = J(
          e.selectionInactiveBackground,
          t.selectionBackgroundTransparent,
        )),
        (t.selectionInactiveBackgroundOpaque = G.blend(
          t.background,
          t.selectionInactiveBackgroundTransparent,
        )),
        (t.selectionForeground = e.selectionForeground
          ? J(e.selectionForeground, Ha)
          : void 0),
        t.selectionForeground === Ha && (t.selectionForeground = void 0),
        G.isOpaque(t.selectionBackgroundTransparent) &&
          (t.selectionBackgroundTransparent = G.opacity(
            t.selectionBackgroundTransparent,
            0.3,
          )),
        G.isOpaque(t.selectionInactiveBackgroundTransparent) &&
          (t.selectionInactiveBackgroundTransparent = G.opacity(
            t.selectionInactiveBackgroundTransparent,
            0.3,
          )),
        (t.scrollbarSliderBackground = J(
          e.scrollbarSliderBackground,
          G.opacity(t.foreground, 0.2),
        )),
        (t.scrollbarSliderHoverBackground = J(
          e.scrollbarSliderHoverBackground,
          G.opacity(t.foreground, 0.4),
        )),
        (t.scrollbarSliderActiveBackground = J(
          e.scrollbarSliderActiveBackground,
          G.opacity(t.foreground, 0.5),
        )),
        (t.overviewRulerBorder = J(e.overviewRulerBorder, bs)),
        (t.ansi = q.slice()),
        (t.ansi[0] = J(e.black, q[0])),
        (t.ansi[1] = J(e.red, q[1])),
        (t.ansi[2] = J(e.green, q[2])),
        (t.ansi[3] = J(e.yellow, q[3])),
        (t.ansi[4] = J(e.blue, q[4])),
        (t.ansi[5] = J(e.magenta, q[5])),
        (t.ansi[6] = J(e.cyan, q[6])),
        (t.ansi[7] = J(e.white, q[7])),
        (t.ansi[8] = J(e.brightBlack, q[8])),
        (t.ansi[9] = J(e.brightRed, q[9])),
        (t.ansi[10] = J(e.brightGreen, q[10])),
        (t.ansi[11] = J(e.brightYellow, q[11])),
        (t.ansi[12] = J(e.brightBlue, q[12])),
        (t.ansi[13] = J(e.brightMagenta, q[13])),
        (t.ansi[14] = J(e.brightCyan, q[14])),
        (t.ansi[15] = J(e.brightWhite, q[15])),
        e.extendedAnsi)
      ) {
        let n = Math.min(t.ansi.length - 16, e.extendedAnsi.length);
        for (let r = 0; r < n; r++)
          t.ansi[r + 16] = J(e.extendedAnsi[r], q[r + 16]);
      }
      (this._contrastCache.clear(),
        this._halfContrastCache.clear(),
        this._updateRestoreColors(),
        this._onChangeColors.fire(this.colors));
    }
    restoreColor(e) {
      (this._restoreColor(e), this._onChangeColors.fire(this.colors));
    }
    _restoreColor(e) {
      if (e === void 0) {
        for (let e = 0; e < this._restoreColors.ansi.length; ++e)
          this._colors.ansi[e] = this._restoreColors.ansi[e];
        return;
      }
      switch (e) {
        case 256:
          this._colors.foreground = this._restoreColors.foreground;
          break;
        case 257:
          this._colors.background = this._restoreColors.background;
          break;
        case 258:
          this._colors.cursor = this._restoreColors.cursor;
          break;
        default:
          this._colors.ansi[e] = this._restoreColors.ansi[e];
      }
    }
    modifyColors(e) {
      (e(this._colors), this._onChangeColors.fire(this.colors));
    }
    _updateRestoreColors() {
      this._restoreColors = {
        foreground: this._colors.foreground,
        background: this._colors.background,
        cursor: this._colors.cursor,
        ansi: this._colors.ansi.slice(),
      };
    }
  };
xs = j([M(0, Kt)], xs);
function J(e, t) {
  if (e !== void 0)
    try {
      return K.toColor(e);
    } catch {}
  return t;
}
var Ss = class {
    constructor(...e) {
      this._entries = new Map();
      for (let [t, n] of e) this.set(t, n);
    }
    set(e, t) {
      let n = this._entries.get(e);
      return (this._entries.set(e, t), n);
    }
    forEach(e) {
      for (let [t, n] of this._entries.entries()) e(t, n);
    }
    has(e) {
      return this._entries.has(e);
    }
    get(e) {
      return this._entries.get(e);
    }
  },
  Cs = class {
    constructor() {
      ((this._services = new Ss()), this._services.set(Wt, this));
    }
    setService(e, t) {
      this._services.set(e, t);
    }
    getService(e) {
      return this._services.get(e);
    }
    createInstance(e, ...t) {
      let n = Rt(e).sort((e, t) => e.index - t.index),
        r = [];
      for (let t of n) {
        let n = this._services.get(t.id);
        if (!n)
          throw Error(
            `[createInstance] ${e.name} depends on UNKNOWN service ${t.id._id}.`,
          );
        r.push(n);
      }
      let i = n.length > 0 ? n[0].index : t.length;
      if (t.length !== i)
        throw Error(
          `[createInstance] First service dependency of ${e.name} at position ${i + 1} conflicts with ${t.length} static arguments`,
        );
      return new e(...t, ...r);
    }
  },
  ws = { trace: 0, debug: 1, info: 2, warn: 3, error: 4, off: 5 },
  Ts = `xterm.js: `,
  Es = class extends F {
    constructor(e) {
      (super(),
        (this._optionsService = e),
        (this._logLevel = 5),
        this._updateLogLevel(),
        this._register(
          this._optionsService.onSpecificOptionChange(`logLevel`, () =>
            this._updateLogLevel(),
          ),
        ),
        (Ds = this));
    }
    get logLevel() {
      return this._logLevel;
    }
    _updateLogLevel() {
      this._logLevel = ws[this._optionsService.rawOptions.logLevel];
    }
    _evalLazyOptionalParams(e) {
      for (let t = 0; t < e.length; t++)
        typeof e[t] == `function` && (e[t] = e[t]());
    }
    _log(e, t, n) {
      (this._evalLazyOptionalParams(n),
        e.call(
          console,
          (this._optionsService.options.logger ? `` : Ts) + t,
          ...n,
        ));
    }
    trace(e, ...t) {
      this._logLevel <= 0 &&
        this._log(
          this._optionsService.options.logger?.trace.bind(
            this._optionsService.options.logger,
          ) ?? console.log,
          e,
          t,
        );
    }
    debug(e, ...t) {
      this._logLevel <= 1 &&
        this._log(
          this._optionsService.options.logger?.debug.bind(
            this._optionsService.options.logger,
          ) ?? console.log,
          e,
          t,
        );
    }
    info(e, ...t) {
      this._logLevel <= 2 &&
        this._log(
          this._optionsService.options.logger?.info.bind(
            this._optionsService.options.logger,
          ) ?? console.info,
          e,
          t,
        );
    }
    warn(e, ...t) {
      this._logLevel <= 3 &&
        this._log(
          this._optionsService.options.logger?.warn.bind(
            this._optionsService.options.logger,
          ) ?? console.warn,
          e,
          t,
        );
    }
    error(e, ...t) {
      this._logLevel <= 4 &&
        this._log(
          this._optionsService.options.logger?.error.bind(
            this._optionsService.options.logger,
          ) ?? console.error,
          e,
          t,
        );
    }
  };
Es = j([M(0, Kt)], Es);
var Ds,
  Os = class extends F {
    constructor(e) {
      (super(),
        (this._maxLength = e),
        (this.onDeleteEmitter = this._register(new L())),
        (this.onDelete = this.onDeleteEmitter.event),
        (this.onInsertEmitter = this._register(new L())),
        (this.onInsert = this.onInsertEmitter.event),
        (this.onTrimEmitter = this._register(new L())),
        (this.onTrim = this.onTrimEmitter.event),
        (this._array = Array(this._maxLength)),
        (this._startIndex = 0),
        (this._length = 0));
    }
    get maxLength() {
      return this._maxLength;
    }
    set maxLength(e) {
      if (this._maxLength === e) return;
      let t = Array(e);
      for (let n = 0; n < Math.min(e, this.length); n++)
        t[n] = this._array[this._getCyclicIndex(n)];
      ((this._array = t), (this._maxLength = e), (this._startIndex = 0));
    }
    get length() {
      return this._length;
    }
    set length(e) {
      if (e > this._length)
        for (let t = this._length; t < e; t++) this._array[t] = void 0;
      this._length = e;
    }
    get(e) {
      return this._array[this._getCyclicIndex(e)];
    }
    set(e, t) {
      this._array[this._getCyclicIndex(e)] = t;
    }
    push(e) {
      ((this._array[this._getCyclicIndex(this._length)] = e),
        this._length === this._maxLength
          ? ((this._startIndex = ++this._startIndex % this._maxLength),
            this.onTrimEmitter.fire(1))
          : this._length++);
    }
    recycle() {
      if (this._length !== this._maxLength)
        throw Error(`Can only recycle when the buffer is full`);
      return (
        (this._startIndex = ++this._startIndex % this._maxLength),
        this.onTrimEmitter.fire(1),
        this._array[this._getCyclicIndex(this._length - 1)]
      );
    }
    get isFull() {
      return this._length === this._maxLength;
    }
    pop() {
      return this._array[this._getCyclicIndex(this._length-- - 1)];
    }
    splice(e, t, ...n) {
      if (t) {
        for (let n = e; n < this._length - t; n++)
          this._array[this._getCyclicIndex(n)] =
            this._array[this._getCyclicIndex(n + t)];
        ((this._length -= t),
          this.onDeleteEmitter.fire({ index: e, amount: t }));
      }
      for (let t = this._length - 1; t >= e; t--)
        this._array[this._getCyclicIndex(t + n.length)] =
          this._array[this._getCyclicIndex(t)];
      for (let t = 0; t < n.length; t++)
        this._array[this._getCyclicIndex(e + t)] = n[t];
      if (
        (n.length && this.onInsertEmitter.fire({ index: e, amount: n.length }),
        this._length + n.length > this._maxLength)
      ) {
        let e = this._length + n.length - this._maxLength;
        ((this._startIndex += e),
          (this._length = this._maxLength),
          this.onTrimEmitter.fire(e));
      } else this._length += n.length;
    }
    trimStart(e) {
      (e > this._length && (e = this._length),
        (this._startIndex += e),
        (this._length -= e),
        this.onTrimEmitter.fire(e));
    }
    shiftElements(e, t, n) {
      if (!(t <= 0)) {
        if (e < 0 || e >= this._length)
          throw Error(`start argument out of range`);
        if (e + n < 0)
          throw Error(`Cannot shift elements in list beyond index 0`);
        if (n > 0) {
          for (let r = t - 1; r >= 0; r--) this.set(e + r + n, this.get(e + r));
          let r = e + t + n - this._length;
          if (r > 0)
            for (this._length += r; this._length > this._maxLength; )
              (this._length--, this._startIndex++, this.onTrimEmitter.fire(1));
        } else for (let r = 0; r < t; r++) this.set(e + r + n, this.get(e + r));
      }
    }
    _getCyclicIndex(e) {
      return (this._startIndex + e) % this._maxLength;
    }
  },
  Y = 3,
  X = Object.freeze(new Mt()),
  ks = 0,
  As = 2,
  js = class e {
    constructor(e, t, n = !1) {
      ((this.isWrapped = n),
        (this._combined = {}),
        (this._extendedAttrs = {}),
        (this._data = new Uint32Array(e * Y)));
      let r = t || Pt.fromCharData([0, At, 1, 0]);
      for (let t = 0; t < e; ++t) this.setCell(t, r);
      this.length = e;
    }
    get(e) {
      let t = this._data[e * Y + 0],
        n = t & 2097151;
      return [
        this._data[e * Y + 1],
        t & 2097152 ? this._combined[e] : n ? Et(n) : ``,
        t >> 22,
        t & 2097152
          ? this._combined[e].charCodeAt(this._combined[e].length - 1)
          : n,
      ];
    }
    set(e, t) {
      ((this._data[e * Y + 1] = t[0]),
        t[1].length > 1
          ? ((this._combined[e] = t[1]),
            (this._data[e * Y + 0] = e | 2097152 | (t[2] << 22)))
          : (this._data[e * Y + 0] = t[1].charCodeAt(0) | (t[2] << 22)));
    }
    getWidth(e) {
      return this._data[e * Y + 0] >> 22;
    }
    hasWidth(e) {
      return this._data[e * Y + 0] & 12582912;
    }
    getFg(e) {
      return this._data[e * Y + 1];
    }
    getBg(e) {
      return this._data[e * Y + 2];
    }
    hasContent(e) {
      return this._data[e * Y + 0] & 4194303;
    }
    getCodePoint(e) {
      let t = this._data[e * Y + 0];
      return t & 2097152
        ? this._combined[e].charCodeAt(this._combined[e].length - 1)
        : t & 2097151;
    }
    isCombined(e) {
      return this._data[e * Y + 0] & 2097152;
    }
    getString(e) {
      let t = this._data[e * Y + 0];
      return t & 2097152
        ? this._combined[e]
        : t & 2097151
          ? Et(t & 2097151)
          : ``;
    }
    isProtected(e) {
      return this._data[e * Y + 2] & 536870912;
    }
    loadCell(e, t) {
      return (
        (ks = e * Y),
        (t.content = this._data[ks + 0]),
        (t.fg = this._data[ks + 1]),
        (t.bg = this._data[ks + 2]),
        t.content & 2097152 && (t.combinedData = this._combined[e]),
        t.bg & 268435456 && (t.extended = this._extendedAttrs[e]),
        t
      );
    }
    setCell(e, t) {
      (t.content & 2097152 && (this._combined[e] = t.combinedData),
        t.bg & 268435456 && (this._extendedAttrs[e] = t.extended),
        (this._data[e * Y + 0] = t.content),
        (this._data[e * Y + 1] = t.fg),
        (this._data[e * Y + 2] = t.bg));
    }
    setCellFromCodepoint(e, t, n, r) {
      (r.bg & 268435456 && (this._extendedAttrs[e] = r.extended),
        (this._data[e * Y + 0] = t | (n << 22)),
        (this._data[e * Y + 1] = r.fg),
        (this._data[e * Y + 2] = r.bg));
    }
    addCodepointToCell(e, t, n) {
      let r = this._data[e * Y + 0];
      (r & 2097152
        ? (this._combined[e] += Et(t))
        : r & 2097151
          ? ((this._combined[e] = Et(r & 2097151) + Et(t)),
            (r &= -2097152),
            (r |= 2097152))
          : (r = t | (1 << 22)),
        n && ((r &= -12582913), (r |= n << 22)),
        (this._data[e * Y + 0] = r));
    }
    insertCells(e, t, n) {
      if (
        ((e %= this.length),
        e &&
          this.getWidth(e - 1) === 2 &&
          this.setCellFromCodepoint(e - 1, 0, 1, n),
        t < this.length - e)
      ) {
        let r = new Pt();
        for (let n = this.length - e - t - 1; n >= 0; --n)
          this.setCell(e + t + n, this.loadCell(e + n, r));
        for (let r = 0; r < t; ++r) this.setCell(e + r, n);
      } else for (let t = e; t < this.length; ++t) this.setCell(t, n);
      this.getWidth(this.length - 1) === 2 &&
        this.setCellFromCodepoint(this.length - 1, 0, 1, n);
    }
    deleteCells(e, t, n) {
      if (((e %= this.length), t < this.length - e)) {
        let r = new Pt();
        for (let n = 0; n < this.length - e - t; ++n)
          this.setCell(e + n, this.loadCell(e + t + n, r));
        for (let e = this.length - t; e < this.length; ++e) this.setCell(e, n);
      } else for (let t = e; t < this.length; ++t) this.setCell(t, n);
      (e &&
        this.getWidth(e - 1) === 2 &&
        this.setCellFromCodepoint(e - 1, 0, 1, n),
        this.getWidth(e) === 0 &&
          !this.hasContent(e) &&
          this.setCellFromCodepoint(e, 0, 1, n));
    }
    replaceCells(e, t, n, r = !1) {
      if (r) {
        for (
          e &&
            this.getWidth(e - 1) === 2 &&
            !this.isProtected(e - 1) &&
            this.setCellFromCodepoint(e - 1, 0, 1, n),
            t < this.length &&
              this.getWidth(t - 1) === 2 &&
              !this.isProtected(t) &&
              this.setCellFromCodepoint(t, 0, 1, n);
          e < t && e < this.length;
        )
          (this.isProtected(e) || this.setCell(e, n), e++);
        return;
      }
      for (
        e &&
          this.getWidth(e - 1) === 2 &&
          this.setCellFromCodepoint(e - 1, 0, 1, n),
          t < this.length &&
            this.getWidth(t - 1) === 2 &&
            this.setCellFromCodepoint(t, 0, 1, n);
        e < t && e < this.length;
      )
        this.setCell(e++, n);
    }
    resize(e, t) {
      if (e === this.length)
        return this._data.length * 4 * As < this._data.buffer.byteLength;
      let n = e * Y;
      if (e > this.length) {
        if (this._data.buffer.byteLength >= n * 4)
          this._data = new Uint32Array(this._data.buffer, 0, n);
        else {
          let e = new Uint32Array(n);
          (e.set(this._data), (this._data = e));
        }
        for (let n = this.length; n < e; ++n) this.setCell(n, t);
      } else {
        this._data = this._data.subarray(0, n);
        let t = Object.keys(this._combined);
        for (let n = 0; n < t.length; n++) {
          let r = parseInt(t[n], 10);
          r >= e && delete this._combined[r];
        }
        let r = Object.keys(this._extendedAttrs);
        for (let t = 0; t < r.length; t++) {
          let n = parseInt(r[t], 10);
          n >= e && delete this._extendedAttrs[n];
        }
      }
      return ((this.length = e), n * 4 * As < this._data.buffer.byteLength);
    }
    cleanupMemory() {
      if (this._data.length * 4 * As < this._data.buffer.byteLength) {
        let e = new Uint32Array(this._data.length);
        return (e.set(this._data), (this._data = e), 1);
      }
      return 0;
    }
    fill(e, t = !1) {
      if (t) {
        for (let t = 0; t < this.length; ++t)
          this.isProtected(t) || this.setCell(t, e);
        return;
      }
      ((this._combined = {}), (this._extendedAttrs = {}));
      for (let t = 0; t < this.length; ++t) this.setCell(t, e);
    }
    copyFrom(e) {
      (this.length === e.length
        ? this._data.set(e._data)
        : (this._data = new Uint32Array(e._data)),
        (this.length = e.length),
        (this._combined = {}));
      for (let t in e._combined) this._combined[t] = e._combined[t];
      this._extendedAttrs = {};
      for (let t in e._extendedAttrs)
        this._extendedAttrs[t] = e._extendedAttrs[t];
      this.isWrapped = e.isWrapped;
    }
    clone() {
      let t = new e(0);
      ((t._data = new Uint32Array(this._data)), (t.length = this.length));
      for (let e in this._combined) t._combined[e] = this._combined[e];
      for (let e in this._extendedAttrs)
        t._extendedAttrs[e] = this._extendedAttrs[e];
      return ((t.isWrapped = this.isWrapped), t);
    }
    getTrimmedLength() {
      for (let e = this.length - 1; e >= 0; --e)
        if (this._data[e * Y + 0] & 4194303)
          return e + (this._data[e * Y + 0] >> 22);
      return 0;
    }
    getNoBgTrimmedLength() {
      for (let e = this.length - 1; e >= 0; --e)
        if (this._data[e * Y + 0] & 4194303 || this._data[e * Y + 2] & 50331648)
          return e + (this._data[e * Y + 0] >> 22);
      return 0;
    }
    copyCellsFrom(e, t, n, r, i) {
      let a = e._data;
      if (i)
        for (let i = r - 1; i >= 0; i--) {
          for (let e = 0; e < Y; e++)
            this._data[(n + i) * Y + e] = a[(t + i) * Y + e];
          a[(t + i) * Y + 2] & 268435456 &&
            (this._extendedAttrs[n + i] = e._extendedAttrs[t + i]);
        }
      else
        for (let i = 0; i < r; i++) {
          for (let e = 0; e < Y; e++)
            this._data[(n + i) * Y + e] = a[(t + i) * Y + e];
          a[(t + i) * Y + 2] & 268435456 &&
            (this._extendedAttrs[n + i] = e._extendedAttrs[t + i]);
        }
      let o = Object.keys(e._combined);
      for (let r = 0; r < o.length; r++) {
        let i = parseInt(o[r], 10);
        i >= t && (this._combined[i - t + n] = e._combined[i]);
      }
    }
    translateToString(e, t, n, r) {
      ((t ??= 0),
        (n ??= this.length),
        e && (n = Math.min(n, this.getTrimmedLength())),
        r && (r.length = 0));
      let i = ``;
      for (; t < n; ) {
        let e = this._data[t * Y + 0],
          n = e & 2097151,
          a = e & 2097152 ? this._combined[t] : n ? Et(n) : jt;
        if (((i += a), r)) for (let e = 0; e < a.length; ++e) r.push(t);
        t += e >> 22 || 1;
      }
      return (r && r.push(t), i);
    }
  };
function Ms(e, t, n, r, i, a) {
  let o = [];
  for (let s = 0; s < e.length - 1; s++) {
    let c = s,
      l = e.get(++c);
    if (!l.isWrapped) continue;
    let u = [e.get(s)];
    for (; c < e.length && l.isWrapped; ) (u.push(l), (l = e.get(++c)));
    if (!a && r >= s && r < c) {
      s += u.length - 1;
      continue;
    }
    let d = 0,
      f = Is(u, d, t),
      p = 1,
      m = 0;
    for (; p < u.length; ) {
      let e = Is(u, p, t),
        r = e - m,
        a = n - f,
        o = Math.min(r, a);
      (u[d].copyCellsFrom(u[p], m, f, o, !1),
        (f += o),
        f === n && (d++, (f = 0)),
        (m += o),
        m === e && (p++, (m = 0)),
        f === 0 &&
          d !== 0 &&
          u[d - 1].getWidth(n - 1) === 2 &&
          (u[d].copyCellsFrom(u[d - 1], n - 1, f++, 1, !1),
          u[d - 1].setCell(n - 1, i)));
    }
    u[d].replaceCells(f, n, i);
    let h = 0;
    for (
      let e = u.length - 1;
      e > 0 && (e > d || u[e].getTrimmedLength() === 0);
      e--
    )
      h++;
    (h > 0 && (o.push(s + u.length - h), o.push(h)), (s += u.length - 1));
  }
  return o;
}
function Ns(e, t) {
  let n = [],
    r = 0,
    i = t[r],
    a = 0;
  for (let o = 0; o < e.length; o++)
    if (i === o) {
      let n = t[++r];
      (e.onDeleteEmitter.fire({ index: o - a, amount: n }),
        (o += n - 1),
        (a += n),
        (i = t[++r]));
    } else n.push(o);
  return { layout: n, countRemoved: a };
}
function Ps(e, t) {
  let n = [];
  for (let r = 0; r < t.length; r++) n.push(e.get(t[r]));
  for (let t = 0; t < n.length; t++) e.set(t, n[t]);
  e.length = t.length;
}
function Fs(e, t, n) {
  let r = [],
    i = e.map((n, r) => Is(e, r, t)).reduce((e, t) => e + t),
    a = 0,
    o = 0,
    s = 0;
  for (; s < i; ) {
    if (i - s < n) {
      r.push(i - s);
      break;
    }
    a += n;
    let c = Is(e, o, t);
    a > c && ((a -= c), o++);
    let l = e[o].getWidth(a - 1) === 2;
    l && a--;
    let u = l ? n - 1 : n;
    (r.push(u), (s += u));
  }
  return r;
}
function Is(e, t, n) {
  if (t === e.length - 1) return e[t].getTrimmedLength();
  let r = !e[t].hasContent(n - 1) && e[t].getWidth(n - 1) === 1,
    i = e[t + 1].getWidth(0) === 2;
  return r && i ? n - 1 : n;
}
var Ls = class e {
  constructor(t) {
    ((this.line = t),
      (this.isDisposed = !1),
      (this._disposables = []),
      (this._id = e._nextId++),
      (this._onDispose = this.register(new L())),
      (this.onDispose = this._onDispose.event));
  }
  get id() {
    return this._id;
  }
  dispose() {
    this.isDisposed ||
      ((this.isDisposed = !0),
      (this.line = -1),
      this._onDispose.fire(),
      Fn(this._disposables),
      (this._disposables.length = 0));
  }
  register(e) {
    return (this._disposables.push(e), e);
  }
};
Ls._nextId = 1;
var Rs = Ls,
  Z = {},
  zs = Z.B;
((Z[0] = {
  "`": `◆`,
  a: `▒`,
  b: `␉`,
  c: `␌`,
  d: `␍`,
  e: `␊`,
  f: `°`,
  g: `±`,
  h: `␤`,
  i: `␋`,
  j: `┘`,
  k: `┐`,
  l: `┌`,
  m: `└`,
  n: `┼`,
  o: `⎺`,
  p: `⎻`,
  q: `─`,
  r: `⎼`,
  s: `⎽`,
  t: `├`,
  u: `┤`,
  v: `┴`,
  w: `┬`,
  x: `│`,
  y: `≤`,
  z: `≥`,
  "{": `π`,
  "|": `≠`,
  "}": `£`,
  "~": `·`,
}),
  (Z.A = { "#": `£` }),
  (Z.B = void 0),
  (Z[4] = {
    "#": `£`,
    "@": `¾`,
    "[": `ij`,
    "\\": `½`,
    "]": `|`,
    "{": `¨`,
    "|": `f`,
    "}": `¼`,
    "~": `´`,
  }),
  (Z.C = Z[5] =
    {
      "[": `Ä`,
      "\\": `Ö`,
      "]": `Å`,
      "^": `Ü`,
      "`": `é`,
      "{": `ä`,
      "|": `ö`,
      "}": `å`,
      "~": `ü`,
    }),
  (Z.R = {
    "#": `£`,
    "@": `à`,
    "[": `°`,
    "\\": `ç`,
    "]": `§`,
    "{": `é`,
    "|": `ù`,
    "}": `è`,
    "~": `¨`,
  }),
  (Z.Q = {
    "@": `à`,
    "[": `â`,
    "\\": `ç`,
    "]": `ê`,
    "^": `î`,
    "`": `ô`,
    "{": `é`,
    "|": `ù`,
    "}": `è`,
    "~": `û`,
  }),
  (Z.K = {
    "@": `§`,
    "[": `Ä`,
    "\\": `Ö`,
    "]": `Ü`,
    "{": `ä`,
    "|": `ö`,
    "}": `ü`,
    "~": `ß`,
  }),
  (Z.Y = {
    "#": `£`,
    "@": `§`,
    "[": `°`,
    "\\": `ç`,
    "]": `é`,
    "`": `ù`,
    "{": `à`,
    "|": `ò`,
    "}": `è`,
    "~": `ì`,
  }),
  (Z.E = Z[6] =
    {
      "@": `Ä`,
      "[": `Æ`,
      "\\": `Ø`,
      "]": `Å`,
      "^": `Ü`,
      "`": `ä`,
      "{": `æ`,
      "|": `ø`,
      "}": `å`,
      "~": `ü`,
    }),
  (Z.Z = {
    "#": `£`,
    "@": `§`,
    "[": `¡`,
    "\\": `Ñ`,
    "]": `¿`,
    "{": `°`,
    "|": `ñ`,
    "}": `ç`,
  }),
  (Z.H = Z[7] =
    {
      "@": `É`,
      "[": `Ä`,
      "\\": `Ö`,
      "]": `Å`,
      "^": `Ü`,
      "`": `é`,
      "{": `ä`,
      "|": `ö`,
      "}": `å`,
      "~": `ü`,
    }),
  (Z[`=`] = {
    "#": `ù`,
    "@": `à`,
    "[": `é`,
    "\\": `ç`,
    "]": `ê`,
    "^": `î`,
    _: `è`,
    "`": `ô`,
    "{": `ä`,
    "|": `ö`,
    "}": `ü`,
    "~": `û`,
  }));
var Bs = 4294967295,
  Vs = class {
    constructor(e, t, n) {
      ((this._hasScrollback = e),
        (this._optionsService = t),
        (this._bufferService = n),
        (this.ydisp = 0),
        (this.ybase = 0),
        (this.y = 0),
        (this.x = 0),
        (this.tabs = {}),
        (this.savedY = 0),
        (this.savedX = 0),
        (this.savedCurAttrData = X.clone()),
        (this.savedCharset = zs),
        (this.markers = []),
        (this._nullCell = Pt.fromCharData([0, At, 1, 0])),
        (this._whitespaceCell = Pt.fromCharData([0, jt, 1, 32])),
        (this._isClearing = !1),
        (this._memoryCleanupQueue = new Ho()),
        (this._memoryCleanupPosition = 0),
        (this._cols = this._bufferService.cols),
        (this._rows = this._bufferService.rows),
        (this.lines = new Os(this._getCorrectBufferLength(this._rows))),
        (this.scrollTop = 0),
        (this.scrollBottom = this._rows - 1),
        this.setupTabStops());
    }
    getNullCell(e) {
      return (
        e
          ? ((this._nullCell.fg = e.fg),
            (this._nullCell.bg = e.bg),
            (this._nullCell.extended = e.extended))
          : ((this._nullCell.fg = 0),
            (this._nullCell.bg = 0),
            (this._nullCell.extended = new Nt())),
        this._nullCell
      );
    }
    getWhitespaceCell(e) {
      return (
        e
          ? ((this._whitespaceCell.fg = e.fg),
            (this._whitespaceCell.bg = e.bg),
            (this._whitespaceCell.extended = e.extended))
          : ((this._whitespaceCell.fg = 0),
            (this._whitespaceCell.bg = 0),
            (this._whitespaceCell.extended = new Nt())),
        this._whitespaceCell
      );
    }
    getBlankLine(e, t) {
      return new js(this._bufferService.cols, this.getNullCell(e), t);
    }
    get hasScrollback() {
      return this._hasScrollback && this.lines.maxLength > this._rows;
    }
    get isCursorInViewport() {
      let e = this.ybase + this.y - this.ydisp;
      return e >= 0 && e < this._rows;
    }
    _getCorrectBufferLength(e) {
      if (!this._hasScrollback) return e;
      let t = e + this._optionsService.rawOptions.scrollback;
      return t > Bs ? Bs : t;
    }
    fillViewportRows(e) {
      if (this.lines.length === 0) {
        e === void 0 && (e = X);
        let t = this._rows;
        for (; t--; ) this.lines.push(this.getBlankLine(e));
      }
    }
    clear() {
      ((this.ydisp = 0),
        (this.ybase = 0),
        (this.y = 0),
        (this.x = 0),
        (this.lines = new Os(this._getCorrectBufferLength(this._rows))),
        (this.scrollTop = 0),
        (this.scrollBottom = this._rows - 1),
        this.setupTabStops());
    }
    resize(e, t) {
      let n = this.getNullCell(X),
        r = 0,
        i = this._getCorrectBufferLength(t);
      if (
        (i > this.lines.maxLength && (this.lines.maxLength = i),
        this.lines.length > 0)
      ) {
        if (this._cols < e)
          for (let t = 0; t < this.lines.length; t++)
            r += +this.lines.get(t).resize(e, n);
        let a = 0;
        if (this._rows < t)
          for (let r = this._rows; r < t; r++)
            this.lines.length < t + this.ybase &&
              (this._optionsService.rawOptions.windowsMode ||
              this._optionsService.rawOptions.windowsPty.backend !== void 0 ||
              this._optionsService.rawOptions.windowsPty.buildNumber !== void 0
                ? this.lines.push(new js(e, n))
                : this.ybase > 0 &&
                    this.lines.length <= this.ybase + this.y + a + 1
                  ? (this.ybase--, a++, this.ydisp > 0 && this.ydisp--)
                  : this.lines.push(new js(e, n)));
        else
          for (let e = this._rows; e > t; e--)
            this.lines.length > t + this.ybase &&
              (this.lines.length > this.ybase + this.y + 1
                ? this.lines.pop()
                : (this.ybase++, this.ydisp++));
        if (i < this.lines.maxLength) {
          let e = this.lines.length - i;
          (e > 0 &&
            (this.lines.trimStart(e),
            (this.ybase = Math.max(this.ybase - e, 0)),
            (this.ydisp = Math.max(this.ydisp - e, 0)),
            (this.savedY = Math.max(this.savedY - e, 0))),
            (this.lines.maxLength = i));
        }
        ((this.x = Math.min(this.x, e - 1)),
          (this.y = Math.min(this.y, t - 1)),
          a && (this.y += a),
          (this.savedX = Math.min(this.savedX, e - 1)),
          (this.scrollTop = 0));
      }
      if (
        ((this.scrollBottom = t - 1),
        this._isReflowEnabled && (this._reflow(e, t), this._cols > e))
      )
        for (let t = 0; t < this.lines.length; t++)
          r += +this.lines.get(t).resize(e, n);
      ((this._cols = e),
        (this._rows = t),
        this._memoryCleanupQueue.clear(),
        r > 0.1 * this.lines.length &&
          ((this._memoryCleanupPosition = 0),
          this._memoryCleanupQueue.enqueue(() =>
            this._batchedMemoryCleanup(),
          )));
    }
    _batchedMemoryCleanup() {
      let e = !0;
      this._memoryCleanupPosition >= this.lines.length &&
        ((this._memoryCleanupPosition = 0), (e = !1));
      let t = 0;
      for (; this._memoryCleanupPosition < this.lines.length; )
        if (
          ((t += this.lines.get(this._memoryCleanupPosition++).cleanupMemory()),
          t > 100)
        )
          return !0;
      return e;
    }
    get _isReflowEnabled() {
      let e = this._optionsService.rawOptions.windowsPty;
      return e && e.buildNumber
        ? this._hasScrollback &&
            e.backend === `conpty` &&
            e.buildNumber >= 21376
        : this._hasScrollback && !this._optionsService.rawOptions.windowsMode;
    }
    _reflow(e, t) {
      this._cols !== e &&
        (e > this._cols ? this._reflowLarger(e, t) : this._reflowSmaller(e, t));
    }
    _reflowLarger(e, t) {
      let n = this._optionsService.rawOptions.reflowCursorLine,
        r = Ms(
          this.lines,
          this._cols,
          e,
          this.ybase + this.y,
          this.getNullCell(X),
          n,
        );
      if (r.length > 0) {
        let n = Ns(this.lines, r);
        (Ps(this.lines, n.layout),
          this._reflowLargerAdjustViewport(e, t, n.countRemoved));
      }
    }
    _reflowLargerAdjustViewport(e, t, n) {
      let r = this.getNullCell(X),
        i = n;
      for (; i-- > 0; )
        this.ybase === 0
          ? (this.y > 0 && this.y--,
            this.lines.length < t && this.lines.push(new js(e, r)))
          : (this.ydisp === this.ybase && this.ydisp--, this.ybase--);
      this.savedY = Math.max(this.savedY - n, 0);
    }
    _reflowSmaller(e, t) {
      let n = this._optionsService.rawOptions.reflowCursorLine,
        r = this.getNullCell(X),
        i = [],
        a = 0;
      for (let o = this.lines.length - 1; o >= 0; o--) {
        let s = this.lines.get(o);
        if (!s || (!s.isWrapped && s.getTrimmedLength() <= e)) continue;
        let c = [s];
        for (; s.isWrapped && o > 0; )
          ((s = this.lines.get(--o)), c.unshift(s));
        if (!n) {
          let e = this.ybase + this.y;
          if (e >= o && e < o + c.length) continue;
        }
        let l = c[c.length - 1].getTrimmedLength(),
          u = Fs(c, this._cols, e),
          d = u.length - c.length,
          f;
        f =
          this.ybase === 0 && this.y !== this.lines.length - 1
            ? Math.max(0, this.y - this.lines.maxLength + d)
            : Math.max(0, this.lines.length - this.lines.maxLength + d);
        let p = [];
        for (let e = 0; e < d; e++) {
          let e = this.getBlankLine(X, !0);
          p.push(e);
        }
        (p.length > 0 &&
          (i.push({ start: o + c.length + a, newLines: p }), (a += p.length)),
          c.push(...p));
        let m = u.length - 1,
          h = u[m];
        h === 0 && (m--, (h = u[m]));
        let g = c.length - d - 1,
          _ = l;
        for (; g >= 0; ) {
          let e = Math.min(_, h);
          if (c[m] === void 0) break;
          (c[m].copyCellsFrom(c[g], _ - e, h - e, e, !0),
            (h -= e),
            h === 0 && (m--, (h = u[m])),
            (_ -= e),
            _ === 0 && (g--, (_ = Is(c, Math.max(g, 0), this._cols))));
        }
        for (let t = 0; t < c.length; t++) u[t] < e && c[t].setCell(u[t], r);
        let v = d - f;
        for (; v-- > 0; )
          this.ybase === 0
            ? this.y < t - 1
              ? (this.y++, this.lines.pop())
              : (this.ybase++, this.ydisp++)
            : this.ybase <
                Math.min(this.lines.maxLength, this.lines.length + a) - t &&
              (this.ybase === this.ydisp && this.ydisp++, this.ybase++);
        this.savedY = Math.min(this.savedY + d, this.ybase + t - 1);
      }
      if (i.length > 0) {
        let e = [],
          t = [];
        for (let e = 0; e < this.lines.length; e++) t.push(this.lines.get(e));
        let n = this.lines.length,
          r = n - 1,
          o = 0,
          s = i[o];
        this.lines.length = Math.min(
          this.lines.maxLength,
          this.lines.length + a,
        );
        let c = 0;
        for (let l = Math.min(this.lines.maxLength - 1, n + a - 1); l >= 0; l--)
          if (s && s.start > r + c) {
            for (let e = s.newLines.length - 1; e >= 0; e--)
              this.lines.set(l--, s.newLines[e]);
            (l++,
              e.push({ index: r + 1, amount: s.newLines.length }),
              (c += s.newLines.length),
              (s = i[++o]));
          } else this.lines.set(l, t[r--]);
        let l = 0;
        for (let t = e.length - 1; t >= 0; t--)
          ((e[t].index += l),
            this.lines.onInsertEmitter.fire(e[t]),
            (l += e[t].amount));
        let u = Math.max(0, n + a - this.lines.maxLength);
        u > 0 && this.lines.onTrimEmitter.fire(u);
      }
    }
    translateBufferLineToString(e, t, n = 0, r) {
      let i = this.lines.get(e);
      return i ? i.translateToString(t, n, r) : ``;
    }
    getWrappedRangeForLine(e) {
      let t = e,
        n = e;
      for (; t > 0 && this.lines.get(t).isWrapped; ) t--;
      for (; n + 1 < this.lines.length && this.lines.get(n + 1).isWrapped; )
        n++;
      return { first: t, last: n };
    }
    setupTabStops(e) {
      for (
        e == null
          ? ((this.tabs = {}), (e = 0))
          : this.tabs[e] || (e = this.prevStop(e));
        e < this._cols;
        e += this._optionsService.rawOptions.tabStopWidth
      )
        this.tabs[e] = !0;
    }
    prevStop(e) {
      for (e ??= this.x; !this.tabs[--e] && e > 0; );
      return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
    }
    nextStop(e) {
      for (e ??= this.x; !this.tabs[++e] && e < this._cols; );
      return e >= this._cols ? this._cols - 1 : e < 0 ? 0 : e;
    }
    clearMarkers(e) {
      this._isClearing = !0;
      for (let t = 0; t < this.markers.length; t++)
        this.markers[t].line === e &&
          (this.markers[t].dispose(), this.markers.splice(t--, 1));
      this._isClearing = !1;
    }
    clearAllMarkers() {
      this._isClearing = !0;
      for (let e = 0; e < this.markers.length; e++) this.markers[e].dispose();
      ((this.markers.length = 0), (this._isClearing = !1));
    }
    addMarker(e) {
      let t = new Rs(e);
      return (
        this.markers.push(t),
        t.register(
          this.lines.onTrim((e) => {
            ((t.line -= e), t.line < 0 && t.dispose());
          }),
        ),
        t.register(
          this.lines.onInsert((e) => {
            t.line >= e.index && (t.line += e.amount);
          }),
        ),
        t.register(
          this.lines.onDelete((e) => {
            (t.line >= e.index && t.line < e.index + e.amount && t.dispose(),
              t.line > e.index && (t.line -= e.amount));
          }),
        ),
        t.register(t.onDispose(() => this._removeMarker(t))),
        t
      );
    }
    _removeMarker(e) {
      this._isClearing || this.markers.splice(this.markers.indexOf(e), 1);
    }
  },
  Hs = class extends F {
    constructor(e, t) {
      (super(),
        (this._optionsService = e),
        (this._bufferService = t),
        (this._onBufferActivate = this._register(new L())),
        (this.onBufferActivate = this._onBufferActivate.event),
        this.reset(),
        this._register(
          this._optionsService.onSpecificOptionChange(`scrollback`, () =>
            this.resize(this._bufferService.cols, this._bufferService.rows),
          ),
        ),
        this._register(
          this._optionsService.onSpecificOptionChange(`tabStopWidth`, () =>
            this.setupTabStops(),
          ),
        ));
    }
    reset() {
      ((this._normal = new Vs(!0, this._optionsService, this._bufferService)),
        this._normal.fillViewportRows(),
        (this._alt = new Vs(!1, this._optionsService, this._bufferService)),
        (this._activeBuffer = this._normal),
        this._onBufferActivate.fire({
          activeBuffer: this._normal,
          inactiveBuffer: this._alt,
        }),
        this.setupTabStops());
    }
    get alt() {
      return this._alt;
    }
    get active() {
      return this._activeBuffer;
    }
    get normal() {
      return this._normal;
    }
    activateNormalBuffer() {
      this._activeBuffer !== this._normal &&
        ((this._normal.x = this._alt.x),
        (this._normal.y = this._alt.y),
        this._alt.clearAllMarkers(),
        this._alt.clear(),
        (this._activeBuffer = this._normal),
        this._onBufferActivate.fire({
          activeBuffer: this._normal,
          inactiveBuffer: this._alt,
        }));
    }
    activateAltBuffer(e) {
      this._activeBuffer !== this._alt &&
        (this._alt.fillViewportRows(e),
        (this._alt.x = this._normal.x),
        (this._alt.y = this._normal.y),
        (this._activeBuffer = this._alt),
        this._onBufferActivate.fire({
          activeBuffer: this._alt,
          inactiveBuffer: this._normal,
        }));
    }
    resize(e, t) {
      (this._normal.resize(e, t),
        this._alt.resize(e, t),
        this.setupTabStops(e));
    }
    setupTabStops(e) {
      (this._normal.setupTabStops(e), this._alt.setupTabStops(e));
    }
  },
  Us = 2,
  Ws = 1,
  Gs = class extends F {
    constructor(e) {
      (super(),
        (this.isUserScrolling = !1),
        (this._onResize = this._register(new L())),
        (this.onResize = this._onResize.event),
        (this._onScroll = this._register(new L())),
        (this.onScroll = this._onScroll.event),
        (this.cols = Math.max(e.rawOptions.cols || 0, Us)),
        (this.rows = Math.max(e.rawOptions.rows || 0, Ws)),
        (this.buffers = this._register(new Hs(e, this))),
        this._register(
          this.buffers.onBufferActivate((e) => {
            this._onScroll.fire(e.activeBuffer.ydisp);
          }),
        ));
    }
    get buffer() {
      return this.buffers.active;
    }
    resize(e, t) {
      let n = this.cols !== e,
        r = this.rows !== t;
      ((this.cols = e),
        (this.rows = t),
        this.buffers.resize(e, t),
        this._onResize.fire({
          cols: e,
          rows: t,
          colsChanged: n,
          rowsChanged: r,
        }));
    }
    reset() {
      (this.buffers.reset(), (this.isUserScrolling = !1));
    }
    scroll(e, t = !1) {
      let n = this.buffer,
        r;
      ((r = this._cachedBlankLine),
        (!r ||
          r.length !== this.cols ||
          r.getFg(0) !== e.fg ||
          r.getBg(0) !== e.bg) &&
          ((r = n.getBlankLine(e, t)), (this._cachedBlankLine = r)),
        (r.isWrapped = t));
      let i = n.ybase + n.scrollTop,
        a = n.ybase + n.scrollBottom;
      if (n.scrollTop === 0) {
        let e = n.lines.isFull;
        (a === n.lines.length - 1
          ? e
            ? n.lines.recycle().copyFrom(r)
            : n.lines.push(r.clone())
          : n.lines.splice(a + 1, 0, r.clone()),
          e
            ? this.isUserScrolling && (n.ydisp = Math.max(n.ydisp - 1, 0))
            : (n.ybase++, this.isUserScrolling || n.ydisp++));
      } else {
        let e = a - i + 1;
        (n.lines.shiftElements(i + 1, e - 1, -1), n.lines.set(a, r.clone()));
      }
      (this.isUserScrolling || (n.ydisp = n.ybase),
        this._onScroll.fire(n.ydisp));
    }
    scrollLines(e, t) {
      let n = this.buffer;
      if (e < 0) {
        if (n.ydisp === 0) return;
        this.isUserScrolling = !0;
      } else e + n.ydisp >= n.ybase && (this.isUserScrolling = !1);
      let r = n.ydisp;
      ((n.ydisp = Math.max(Math.min(n.ydisp + e, n.ybase), 0)),
        r !== n.ydisp && (t || this._onScroll.fire(n.ydisp)));
    }
  };
Gs = j([M(0, Kt)], Gs);
var Ks = {
    cols: 80,
    rows: 24,
    cursorBlink: !1,
    cursorStyle: `block`,
    cursorWidth: 1,
    cursorInactiveStyle: `outline`,
    customGlyphs: !0,
    drawBoldTextInBrightColors: !0,
    documentOverride: null,
    fastScrollModifier: `alt`,
    fastScrollSensitivity: 5,
    fontFamily: `monospace`,
    fontSize: 15,
    fontWeight: `normal`,
    fontWeightBold: `bold`,
    ignoreBracketedPasteMode: !1,
    lineHeight: 1,
    letterSpacing: 0,
    linkHandler: null,
    logLevel: `info`,
    logger: null,
    scrollback: 1e3,
    scrollOnEraseInDisplay: !1,
    scrollOnUserInput: !0,
    scrollSensitivity: 1,
    screenReaderMode: !1,
    smoothScrollDuration: 0,
    macOptionIsMeta: !1,
    macOptionClickForcesSelection: !1,
    minimumContrastRatio: 1,
    disableStdin: !1,
    allowProposedApi: !1,
    allowTransparency: !1,
    tabStopWidth: 8,
    theme: {},
    reflowCursorLine: !1,
    rescaleOverlappingGlyphs: !1,
    rightClickSelectsWord: No,
    windowOptions: {},
    windowsMode: !1,
    windowsPty: {},
    wordSeparator: ` ()[]{}',"\``,
    altClickMovesCursor: !0,
    convertEol: !1,
    termName: `xterm`,
    cancelEvents: !1,
    overviewRuler: {},
  },
  qs = [
    `normal`,
    `bold`,
    `100`,
    `200`,
    `300`,
    `400`,
    `500`,
    `600`,
    `700`,
    `800`,
    `900`,
  ],
  Js = class extends F {
    constructor(e) {
      (super(),
        (this._onOptionChange = this._register(new L())),
        (this.onOptionChange = this._onOptionChange.event));
      let t = { ...Ks };
      for (let n in e)
        if (n in t)
          try {
            let r = e[n];
            t[n] = this._sanitizeAndValidateOption(n, r);
          } catch (e) {
            console.error(e);
          }
      ((this.rawOptions = t),
        (this.options = { ...t }),
        this._setupOptions(),
        this._register(
          P(() => {
            ((this.rawOptions.linkHandler = null),
              (this.rawOptions.documentOverride = null));
          }),
        ));
    }
    onSpecificOptionChange(e, t) {
      return this.onOptionChange((n) => {
        n === e && t(this.rawOptions[e]);
      });
    }
    onMultipleOptionChange(e, t) {
      return this.onOptionChange((n) => {
        e.indexOf(n) !== -1 && t();
      });
    }
    _setupOptions() {
      let e = (e) => {
          if (!(e in Ks)) throw Error(`No option with key "${e}"`);
          return this.rawOptions[e];
        },
        t = (e, t) => {
          if (!(e in Ks)) throw Error(`No option with key "${e}"`);
          ((t = this._sanitizeAndValidateOption(e, t)),
            this.rawOptions[e] !== t &&
              ((this.rawOptions[e] = t), this._onOptionChange.fire(e)));
        };
      for (let n in this.rawOptions) {
        let r = { get: e.bind(this, n), set: t.bind(this, n) };
        Object.defineProperty(this.options, n, r);
      }
    }
    _sanitizeAndValidateOption(e, t) {
      switch (e) {
        case `cursorStyle`:
          if (((t ||= Ks[e]), !Ys(t)))
            throw Error(`"${t}" is not a valid value for ${e}`);
          break;
        case `wordSeparator`:
          t ||= Ks[e];
          break;
        case `fontWeight`:
        case `fontWeightBold`:
          if (typeof t == `number` && 1 <= t && t <= 1e3) break;
          t = qs.includes(t) ? t : Ks[e];
          break;
        case `cursorWidth`:
          t = Math.floor(t);
        case `lineHeight`:
        case `tabStopWidth`:
          if (t < 1) throw Error(`${e} cannot be less than 1, value: ${t}`);
          break;
        case `minimumContrastRatio`:
          t = Math.max(1, Math.min(21, Math.round(t * 10) / 10));
          break;
        case `scrollback`:
          if (((t = Math.min(t, 4294967295)), t < 0))
            throw Error(`${e} cannot be less than 0, value: ${t}`);
          break;
        case `fastScrollSensitivity`:
        case `scrollSensitivity`:
          if (t <= 0)
            throw Error(`${e} cannot be less than or equal to 0, value: ${t}`);
          break;
        case `rows`:
        case `cols`:
          if (!t && t !== 0) throw Error(`${e} must be numeric, value: ${t}`);
          break;
        case `windowsPty`:
          t ??= {};
          break;
      }
      return t;
    }
  };
function Ys(e) {
  return e === `block` || e === `underline` || e === `bar`;
}
function Xs(e, t = 5) {
  if (typeof e != `object`) return e;
  let n = Array.isArray(e) ? [] : {};
  for (let r in e) n[r] = t <= 1 ? e[r] : e[r] && Xs(e[r], t - 1);
  return n;
}
var Zs = Object.freeze({ insertMode: !1 }),
  Qs = Object.freeze({
    applicationCursorKeys: !1,
    applicationKeypad: !1,
    bracketedPasteMode: !1,
    cursorBlink: void 0,
    cursorStyle: void 0,
    origin: !1,
    reverseWraparound: !1,
    sendFocus: !1,
    synchronizedOutput: !1,
    wraparound: !0,
  }),
  $s = class extends F {
    constructor(e, t, n) {
      (super(),
        (this._bufferService = e),
        (this._logService = t),
        (this._optionsService = n),
        (this.isCursorInitialized = !1),
        (this.isCursorHidden = !1),
        (this._onData = this._register(new L())),
        (this.onData = this._onData.event),
        (this._onUserInput = this._register(new L())),
        (this.onUserInput = this._onUserInput.event),
        (this._onBinary = this._register(new L())),
        (this.onBinary = this._onBinary.event),
        (this._onRequestScrollToBottom = this._register(new L())),
        (this.onRequestScrollToBottom = this._onRequestScrollToBottom.event),
        (this.modes = Xs(Zs)),
        (this.decPrivateModes = Xs(Qs)));
    }
    reset() {
      ((this.modes = Xs(Zs)), (this.decPrivateModes = Xs(Qs)));
    }
    triggerDataEvent(e, t = !1) {
      if (this._optionsService.rawOptions.disableStdin) return;
      let n = this._bufferService.buffer;
      (t &&
        this._optionsService.rawOptions.scrollOnUserInput &&
        n.ybase !== n.ydisp &&
        this._onRequestScrollToBottom.fire(),
        t && this._onUserInput.fire(),
        this._logService.debug(`sending data "${e}"`),
        this._logService.trace(`sending data (codes)`, () =>
          e.split(``).map((e) => e.charCodeAt(0)),
        ),
        this._onData.fire(e));
    }
    triggerBinaryEvent(e) {
      this._optionsService.rawOptions.disableStdin ||
        (this._logService.debug(`sending binary "${e}"`),
        this._logService.trace(`sending binary (codes)`, () =>
          e.split(``).map((e) => e.charCodeAt(0)),
        ),
        this._onBinary.fire(e));
    }
  };
$s = j([M(0, Bt), M(1, Gt), M(2, Kt)], $s);
var ec = {
  NONE: { events: 0, restrict: () => !1 },
  X10: {
    events: 1,
    restrict: (e) =>
      e.button === 4 || e.action !== 1
        ? !1
        : ((e.ctrl = !1), (e.alt = !1), (e.shift = !1), !0),
  },
  VT200: { events: 19, restrict: (e) => e.action !== 32 },
  DRAG: { events: 23, restrict: (e) => !(e.action === 32 && e.button === 3) },
  ANY: { events: 31, restrict: (e) => !0 },
};
function tc(e, t) {
  let n = (e.ctrl ? 16 : 0) | (e.shift ? 4 : 0) | (e.alt ? 8 : 0);
  return (
    e.button === 4
      ? ((n |= 64), (n |= e.action))
      : ((n |= e.button & 3),
        e.button & 4 && (n |= 64),
        e.button & 8 && (n |= 128),
        e.action === 32 ? (n |= 32) : e.action === 0 && !t && (n |= 3)),
    n
  );
}
var nc = String.fromCharCode,
  rc = {
    DEFAULT: (e) => {
      let t = [tc(e, !1) + 32, e.col + 32, e.row + 32];
      return t[0] > 255 || t[1] > 255 || t[2] > 255
        ? ``
        : `\x1B[M${nc(t[0])}${nc(t[1])}${nc(t[2])}`;
    },
    SGR: (e) => {
      let t = e.action === 0 && e.button !== 4 ? `m` : `M`;
      return `\x1B[<${tc(e, !0)};${e.col};${e.row}${t}`;
    },
    SGR_PIXELS: (e) => {
      let t = e.action === 0 && e.button !== 4 ? `m` : `M`;
      return `\x1B[<${tc(e, !0)};${e.x};${e.y}${t}`;
    },
  },
  ic = class extends F {
    constructor(e, t, n) {
      (super(),
        (this._bufferService = e),
        (this._coreService = t),
        (this._optionsService = n),
        (this._protocols = {}),
        (this._encodings = {}),
        (this._activeProtocol = ``),
        (this._activeEncoding = ``),
        (this._lastEvent = null),
        (this._wheelPartialScroll = 0),
        (this._onProtocolChange = this._register(new L())),
        (this.onProtocolChange = this._onProtocolChange.event));
      for (let e of Object.keys(ec)) this.addProtocol(e, ec[e]);
      for (let e of Object.keys(rc)) this.addEncoding(e, rc[e]);
      this.reset();
    }
    addProtocol(e, t) {
      this._protocols[e] = t;
    }
    addEncoding(e, t) {
      this._encodings[e] = t;
    }
    get activeProtocol() {
      return this._activeProtocol;
    }
    get areMouseEventsActive() {
      return this._protocols[this._activeProtocol].events !== 0;
    }
    set activeProtocol(e) {
      if (!this._protocols[e]) throw Error(`unknown protocol "${e}"`);
      ((this._activeProtocol = e),
        this._onProtocolChange.fire(this._protocols[e].events));
    }
    get activeEncoding() {
      return this._activeEncoding;
    }
    set activeEncoding(e) {
      if (!this._encodings[e]) throw Error(`unknown encoding "${e}"`);
      this._activeEncoding = e;
    }
    reset() {
      ((this.activeProtocol = `NONE`),
        (this.activeEncoding = `DEFAULT`),
        (this._lastEvent = null),
        (this._wheelPartialScroll = 0));
    }
    consumeWheelEvent(e, t, n) {
      if (e.deltaY === 0 || e.shiftKey || t === void 0 || n === void 0)
        return 0;
      let r = t / n,
        i = this._applyScrollModifier(e.deltaY, e);
      return (
        e.deltaMode === WheelEvent.DOM_DELTA_PIXEL
          ? ((i /= r + 0),
            Math.abs(e.deltaY) < 50 && (i *= 0.3),
            (this._wheelPartialScroll += i),
            (i =
              Math.floor(Math.abs(this._wheelPartialScroll)) *
              (this._wheelPartialScroll > 0 ? 1 : -1)),
            (this._wheelPartialScroll %= 1))
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE &&
            (i *= this._bufferService.rows),
        i
      );
    }
    _applyScrollModifier(e, t) {
      return t.altKey || t.ctrlKey || t.shiftKey
        ? e *
            this._optionsService.rawOptions.fastScrollSensitivity *
            this._optionsService.rawOptions.scrollSensitivity
        : e * this._optionsService.rawOptions.scrollSensitivity;
    }
    triggerMouseEvent(e) {
      if (
        e.col < 0 ||
        e.col >= this._bufferService.cols ||
        e.row < 0 ||
        e.row >= this._bufferService.rows ||
        (e.button === 4 && e.action === 32) ||
        (e.button === 3 && e.action !== 32) ||
        (e.button !== 4 && (e.action === 2 || e.action === 3)) ||
        (e.col++,
        e.row++,
        e.action === 32 &&
          this._lastEvent &&
          this._equalEvents(
            this._lastEvent,
            e,
            this._activeEncoding === `SGR_PIXELS`,
          )) ||
        !this._protocols[this._activeProtocol].restrict(e)
      )
        return !1;
      let t = this._encodings[this._activeEncoding](e);
      return (
        t &&
          (this._activeEncoding === `DEFAULT`
            ? this._coreService.triggerBinaryEvent(t)
            : this._coreService.triggerDataEvent(t, !0)),
        (this._lastEvent = e),
        !0
      );
    }
    explainEvents(e) {
      return {
        down: !!(e & 1),
        up: !!(e & 2),
        drag: !!(e & 4),
        move: !!(e & 8),
        wheel: !!(e & 16),
      };
    }
    _equalEvents(e, t, n) {
      if (n) {
        if (e.x !== t.x || e.y !== t.y) return !1;
      } else if (e.col !== t.col || e.row !== t.row) return !1;
      return !(
        e.button !== t.button ||
        e.action !== t.action ||
        e.ctrl !== t.ctrl ||
        e.alt !== t.alt ||
        e.shift !== t.shift
      );
    }
  };
ic = j([M(0, Bt), M(1, Ht), M(2, Kt)], ic);
var ac = [
    [768, 879],
    [1155, 1158],
    [1160, 1161],
    [1425, 1469],
    [1471, 1471],
    [1473, 1474],
    [1476, 1477],
    [1479, 1479],
    [1536, 1539],
    [1552, 1557],
    [1611, 1630],
    [1648, 1648],
    [1750, 1764],
    [1767, 1768],
    [1770, 1773],
    [1807, 1807],
    [1809, 1809],
    [1840, 1866],
    [1958, 1968],
    [2027, 2035],
    [2305, 2306],
    [2364, 2364],
    [2369, 2376],
    [2381, 2381],
    [2385, 2388],
    [2402, 2403],
    [2433, 2433],
    [2492, 2492],
    [2497, 2500],
    [2509, 2509],
    [2530, 2531],
    [2561, 2562],
    [2620, 2620],
    [2625, 2626],
    [2631, 2632],
    [2635, 2637],
    [2672, 2673],
    [2689, 2690],
    [2748, 2748],
    [2753, 2757],
    [2759, 2760],
    [2765, 2765],
    [2786, 2787],
    [2817, 2817],
    [2876, 2876],
    [2879, 2879],
    [2881, 2883],
    [2893, 2893],
    [2902, 2902],
    [2946, 2946],
    [3008, 3008],
    [3021, 3021],
    [3134, 3136],
    [3142, 3144],
    [3146, 3149],
    [3157, 3158],
    [3260, 3260],
    [3263, 3263],
    [3270, 3270],
    [3276, 3277],
    [3298, 3299],
    [3393, 3395],
    [3405, 3405],
    [3530, 3530],
    [3538, 3540],
    [3542, 3542],
    [3633, 3633],
    [3636, 3642],
    [3655, 3662],
    [3761, 3761],
    [3764, 3769],
    [3771, 3772],
    [3784, 3789],
    [3864, 3865],
    [3893, 3893],
    [3895, 3895],
    [3897, 3897],
    [3953, 3966],
    [3968, 3972],
    [3974, 3975],
    [3984, 3991],
    [3993, 4028],
    [4038, 4038],
    [4141, 4144],
    [4146, 4146],
    [4150, 4151],
    [4153, 4153],
    [4184, 4185],
    [4448, 4607],
    [4959, 4959],
    [5906, 5908],
    [5938, 5940],
    [5970, 5971],
    [6002, 6003],
    [6068, 6069],
    [6071, 6077],
    [6086, 6086],
    [6089, 6099],
    [6109, 6109],
    [6155, 6157],
    [6313, 6313],
    [6432, 6434],
    [6439, 6440],
    [6450, 6450],
    [6457, 6459],
    [6679, 6680],
    [6912, 6915],
    [6964, 6964],
    [6966, 6970],
    [6972, 6972],
    [6978, 6978],
    [7019, 7027],
    [7616, 7626],
    [7678, 7679],
    [8203, 8207],
    [8234, 8238],
    [8288, 8291],
    [8298, 8303],
    [8400, 8431],
    [12330, 12335],
    [12441, 12442],
    [43014, 43014],
    [43019, 43019],
    [43045, 43046],
    [64286, 64286],
    [65024, 65039],
    [65056, 65059],
    [65279, 65279],
    [65529, 65531],
  ],
  oc = [
    [68097, 68099],
    [68101, 68102],
    [68108, 68111],
    [68152, 68154],
    [68159, 68159],
    [119143, 119145],
    [119155, 119170],
    [119173, 119179],
    [119210, 119213],
    [119362, 119364],
    [917505, 917505],
    [917536, 917631],
    [917760, 917999],
  ],
  Q;
function sc(e, t) {
  let n = 0,
    r = t.length - 1,
    i;
  if (e < t[0][0] || e > t[r][1]) return !1;
  for (; r >= n; )
    if (((i = (n + r) >> 1), e > t[i][1])) n = i + 1;
    else if (e < t[i][0]) r = i - 1;
    else return !0;
  return !1;
}
var cc = class {
    constructor() {
      if (((this.version = `6`), !Q)) {
        ((Q = new Uint8Array(65536)),
          Q.fill(1),
          (Q[0] = 0),
          Q.fill(0, 1, 32),
          Q.fill(0, 127, 160),
          Q.fill(2, 4352, 4448),
          (Q[9001] = 2),
          (Q[9002] = 2),
          Q.fill(2, 11904, 42192),
          (Q[12351] = 1),
          Q.fill(2, 44032, 55204),
          Q.fill(2, 63744, 64256),
          Q.fill(2, 65040, 65050),
          Q.fill(2, 65072, 65136),
          Q.fill(2, 65280, 65377),
          Q.fill(2, 65504, 65511));
        for (let e = 0; e < ac.length; ++e) Q.fill(0, ac[e][0], ac[e][1] + 1);
      }
    }
    wcwidth(e) {
      return e < 32
        ? 0
        : e < 127
          ? 1
          : e < 65536
            ? Q[e]
            : sc(e, oc)
              ? 0
              : (e >= 131072 && e <= 196605) || (e >= 196608 && e <= 262141)
                ? 2
                : 1;
    }
    charProperties(e, t) {
      let n = this.wcwidth(e),
        r = n === 0 && t !== 0;
      if (r) {
        let e = lc.extractWidth(t);
        e === 0 ? (r = !1) : e > n && (n = e);
      }
      return lc.createPropertyValue(0, n, r);
    }
  },
  lc = class e {
    constructor() {
      ((this._providers = Object.create(null)),
        (this._active = ``),
        (this._onChange = new L()),
        (this.onChange = this._onChange.event));
      let e = new cc();
      (this.register(e),
        (this._active = e.version),
        (this._activeProvider = e));
    }
    static extractShouldJoin(e) {
      return (e & 1) != 0;
    }
    static extractWidth(e) {
      return (e >> 1) & 3;
    }
    static extractCharKind(e) {
      return e >> 3;
    }
    static createPropertyValue(e, t, n = !1) {
      return ((e & 16777215) << 3) | ((t & 3) << 1) | (n ? 1 : 0);
    }
    dispose() {
      this._onChange.dispose();
    }
    get versions() {
      return Object.keys(this._providers);
    }
    get activeVersion() {
      return this._active;
    }
    set activeVersion(e) {
      if (!this._providers[e]) throw Error(`unknown Unicode version "${e}"`);
      ((this._active = e),
        (this._activeProvider = this._providers[e]),
        this._onChange.fire(e));
    }
    register(e) {
      this._providers[e.version] = e;
    }
    wcwidth(e) {
      return this._activeProvider.wcwidth(e);
    }
    getStringCellWidth(t) {
      let n = 0,
        r = 0,
        i = t.length;
      for (let a = 0; a < i; ++a) {
        let o = t.charCodeAt(a);
        if (55296 <= o && o <= 56319) {
          if (++a >= i) return n + this.wcwidth(o);
          let e = t.charCodeAt(a);
          56320 <= e && e <= 57343
            ? (o = (o - 55296) * 1024 + e - 56320 + 65536)
            : (n += this.wcwidth(e));
        }
        let s = this.charProperties(o, r),
          c = e.extractWidth(s);
        (e.extractShouldJoin(s) && (c -= e.extractWidth(r)), (n += c), (r = s));
      }
      return n;
    }
    charProperties(e, t) {
      return this._activeProvider.charProperties(e, t);
    }
  },
  uc = class {
    constructor() {
      ((this.glevel = 0), (this._charsets = []));
    }
    reset() {
      ((this.charset = void 0), (this._charsets = []), (this.glevel = 0));
    }
    setgLevel(e) {
      ((this.glevel = e), (this.charset = this._charsets[e]));
    }
    setgCharset(e, t) {
      ((this._charsets[e] = t), this.glevel === e && (this.charset = t));
    }
  };
function dc(e) {
  let t = e.buffer.lines.get(e.buffer.ybase + e.buffer.y - 1)?.get(e.cols - 1),
    n = e.buffer.lines.get(e.buffer.ybase + e.buffer.y);
  n && t && (n.isWrapped = t[3] !== 0 && t[3] !== 32);
}
var fc = 2147483647,
  pc = 256,
  mc = class e {
    constructor(e = 32, t = 32) {
      if (((this.maxLength = e), (this.maxSubParamsLength = t), t > pc))
        throw Error(`maxSubParamsLength must not be greater than 256`);
      ((this.params = new Int32Array(e)),
        (this.length = 0),
        (this._subParams = new Int32Array(t)),
        (this._subParamsLength = 0),
        (this._subParamsIdx = new Uint16Array(e)),
        (this._rejectDigits = !1),
        (this._rejectSubDigits = !1),
        (this._digitIsSub = !1));
    }
    static fromArray(t) {
      let n = new e();
      if (!t.length) return n;
      for (let e = Array.isArray(t[0]) ? 1 : 0; e < t.length; ++e) {
        let r = t[e];
        if (Array.isArray(r))
          for (let e = 0; e < r.length; ++e) n.addSubParam(r[e]);
        else n.addParam(r);
      }
      return n;
    }
    clone() {
      let t = new e(this.maxLength, this.maxSubParamsLength);
      return (
        t.params.set(this.params),
        (t.length = this.length),
        t._subParams.set(this._subParams),
        (t._subParamsLength = this._subParamsLength),
        t._subParamsIdx.set(this._subParamsIdx),
        (t._rejectDigits = this._rejectDigits),
        (t._rejectSubDigits = this._rejectSubDigits),
        (t._digitIsSub = this._digitIsSub),
        t
      );
    }
    toArray() {
      let e = [];
      for (let t = 0; t < this.length; ++t) {
        e.push(this.params[t]);
        let n = this._subParamsIdx[t] >> 8,
          r = this._subParamsIdx[t] & 255;
        r - n > 0 && e.push(Array.prototype.slice.call(this._subParams, n, r));
      }
      return e;
    }
    reset() {
      ((this.length = 0),
        (this._subParamsLength = 0),
        (this._rejectDigits = !1),
        (this._rejectSubDigits = !1),
        (this._digitIsSub = !1));
    }
    addParam(e) {
      if (((this._digitIsSub = !1), this.length >= this.maxLength)) {
        this._rejectDigits = !0;
        return;
      }
      if (e < -1) throw Error(`values lesser than -1 are not allowed`);
      ((this._subParamsIdx[this.length] =
        (this._subParamsLength << 8) | this._subParamsLength),
        (this.params[this.length++] = e > fc ? fc : e));
    }
    addSubParam(e) {
      if (((this._digitIsSub = !0), this.length)) {
        if (
          this._rejectDigits ||
          this._subParamsLength >= this.maxSubParamsLength
        ) {
          this._rejectSubDigits = !0;
          return;
        }
        if (e < -1) throw Error(`values lesser than -1 are not allowed`);
        ((this._subParams[this._subParamsLength++] = e > fc ? fc : e),
          this._subParamsIdx[this.length - 1]++);
      }
    }
    hasSubParams(e) {
      return (this._subParamsIdx[e] & 255) - (this._subParamsIdx[e] >> 8) > 0;
    }
    getSubParams(e) {
      let t = this._subParamsIdx[e] >> 8,
        n = this._subParamsIdx[e] & 255;
      return n - t > 0 ? this._subParams.subarray(t, n) : null;
    }
    getSubParamsAll() {
      let e = {};
      for (let t = 0; t < this.length; ++t) {
        let n = this._subParamsIdx[t] >> 8,
          r = this._subParamsIdx[t] & 255;
        r - n > 0 && (e[t] = this._subParams.slice(n, r));
      }
      return e;
    }
    addDigit(e) {
      let t;
      if (
        this._rejectDigits ||
        !(t = this._digitIsSub ? this._subParamsLength : this.length) ||
        (this._digitIsSub && this._rejectSubDigits)
      )
        return;
      let n = this._digitIsSub ? this._subParams : this.params,
        r = n[t - 1];
      n[t - 1] = ~r ? Math.min(r * 10 + e, fc) : e;
    }
  },
  hc = [],
  gc = class {
    constructor() {
      ((this._state = 0),
        (this._active = hc),
        (this._id = -1),
        (this._handlers = Object.create(null)),
        (this._handlerFb = () => {}),
        (this._stack = { paused: !1, loopPosition: 0, fallThrough: !1 }));
    }
    registerHandler(e, t) {
      this._handlers[e] === void 0 && (this._handlers[e] = []);
      let n = this._handlers[e];
      return (
        n.push(t),
        {
          dispose: () => {
            let e = n.indexOf(t);
            e !== -1 && n.splice(e, 1);
          },
        }
      );
    }
    clearHandler(e) {
      this._handlers[e] && delete this._handlers[e];
    }
    setHandlerFallback(e) {
      this._handlerFb = e;
    }
    dispose() {
      ((this._handlers = Object.create(null)),
        (this._handlerFb = () => {}),
        (this._active = hc));
    }
    reset() {
      if (this._state === 2)
        for (
          let e = this._stack.paused
            ? this._stack.loopPosition - 1
            : this._active.length - 1;
          e >= 0;
          --e
        )
          this._active[e].end(!1);
      ((this._stack.paused = !1),
        (this._active = hc),
        (this._id = -1),
        (this._state = 0));
    }
    _start() {
      if (
        ((this._active = this._handlers[this._id] || hc), !this._active.length)
      )
        this._handlerFb(this._id, `START`);
      else
        for (let e = this._active.length - 1; e >= 0; e--)
          this._active[e].start();
    }
    _put(e, t, n) {
      if (!this._active.length) this._handlerFb(this._id, `PUT`, Dt(e, t, n));
      else
        for (let r = this._active.length - 1; r >= 0; r--)
          this._active[r].put(e, t, n);
    }
    start() {
      (this.reset(), (this._state = 1));
    }
    put(e, t, n) {
      if (this._state !== 3) {
        if (this._state === 1)
          for (; t < n; ) {
            let n = e[t++];
            if (n === 59) {
              ((this._state = 2), this._start());
              break;
            }
            if (n < 48 || 57 < n) {
              this._state = 3;
              return;
            }
            (this._id === -1 && (this._id = 0),
              (this._id = this._id * 10 + n - 48));
          }
        this._state === 2 && n - t > 0 && this._put(e, t, n);
      }
    }
    end(e, t = !0) {
      if (this._state !== 0) {
        if (this._state !== 3)
          if ((this._state === 1 && this._start(), !this._active.length))
            this._handlerFb(this._id, `END`, e);
          else {
            let n = !1,
              r = this._active.length - 1,
              i = !1;
            if (
              (this._stack.paused &&
                ((r = this._stack.loopPosition - 1),
                (n = t),
                (i = this._stack.fallThrough),
                (this._stack.paused = !1)),
              !i && n === !1)
            ) {
              for (; r >= 0 && ((n = this._active[r].end(e)), n !== !0); r--)
                if (n instanceof Promise)
                  return (
                    (this._stack.paused = !0),
                    (this._stack.loopPosition = r),
                    (this._stack.fallThrough = !1),
                    n
                  );
              r--;
            }
            for (; r >= 0; r--)
              if (((n = this._active[r].end(!1)), n instanceof Promise))
                return (
                  (this._stack.paused = !0),
                  (this._stack.loopPosition = r),
                  (this._stack.fallThrough = !0),
                  n
                );
          }
        ((this._active = hc), (this._id = -1), (this._state = 0));
      }
    }
  },
  _c = class {
    constructor(e) {
      ((this._handler = e), (this._data = ``), (this._hitLimit = !1));
    }
    start() {
      ((this._data = ``), (this._hitLimit = !1));
    }
    put(e, t, n) {
      this._hitLimit ||
        ((this._data += Dt(e, t, n)),
        this._data.length > 1e7 && ((this._data = ``), (this._hitLimit = !0)));
    }
    end(e) {
      let t = !1;
      if (this._hitLimit) t = !1;
      else if (e && ((t = this._handler(this._data)), t instanceof Promise))
        return t.then((e) => ((this._data = ``), (this._hitLimit = !1), e));
      return ((this._data = ``), (this._hitLimit = !1), t);
    }
  },
  vc = [],
  yc = class {
    constructor() {
      ((this._handlers = Object.create(null)),
        (this._active = vc),
        (this._ident = 0),
        (this._handlerFb = () => {}),
        (this._stack = { paused: !1, loopPosition: 0, fallThrough: !1 }));
    }
    dispose() {
      ((this._handlers = Object.create(null)),
        (this._handlerFb = () => {}),
        (this._active = vc));
    }
    registerHandler(e, t) {
      this._handlers[e] === void 0 && (this._handlers[e] = []);
      let n = this._handlers[e];
      return (
        n.push(t),
        {
          dispose: () => {
            let e = n.indexOf(t);
            e !== -1 && n.splice(e, 1);
          },
        }
      );
    }
    clearHandler(e) {
      this._handlers[e] && delete this._handlers[e];
    }
    setHandlerFallback(e) {
      this._handlerFb = e;
    }
    reset() {
      if (this._active.length)
        for (
          let e = this._stack.paused
            ? this._stack.loopPosition - 1
            : this._active.length - 1;
          e >= 0;
          --e
        )
          this._active[e].unhook(!1);
      ((this._stack.paused = !1), (this._active = vc), (this._ident = 0));
    }
    hook(e, t) {
      if (
        (this.reset(),
        (this._ident = e),
        (this._active = this._handlers[e] || vc),
        !this._active.length)
      )
        this._handlerFb(this._ident, `HOOK`, t);
      else
        for (let e = this._active.length - 1; e >= 0; e--)
          this._active[e].hook(t);
    }
    put(e, t, n) {
      if (!this._active.length)
        this._handlerFb(this._ident, `PUT`, Dt(e, t, n));
      else
        for (let r = this._active.length - 1; r >= 0; r--)
          this._active[r].put(e, t, n);
    }
    unhook(e, t = !0) {
      if (!this._active.length) this._handlerFb(this._ident, `UNHOOK`, e);
      else {
        let n = !1,
          r = this._active.length - 1,
          i = !1;
        if (
          (this._stack.paused &&
            ((r = this._stack.loopPosition - 1),
            (n = t),
            (i = this._stack.fallThrough),
            (this._stack.paused = !1)),
          !i && n === !1)
        ) {
          for (; r >= 0 && ((n = this._active[r].unhook(e)), n !== !0); r--)
            if (n instanceof Promise)
              return (
                (this._stack.paused = !0),
                (this._stack.loopPosition = r),
                (this._stack.fallThrough = !1),
                n
              );
          r--;
        }
        for (; r >= 0; r--)
          if (((n = this._active[r].unhook(!1)), n instanceof Promise))
            return (
              (this._stack.paused = !0),
              (this._stack.loopPosition = r),
              (this._stack.fallThrough = !0),
              n
            );
      }
      ((this._active = vc), (this._ident = 0));
    }
  },
  bc = new mc();
bc.addParam(0);
var xc = class {
    constructor(e) {
      ((this._handler = e),
        (this._data = ``),
        (this._params = bc),
        (this._hitLimit = !1));
    }
    hook(e) {
      ((this._params = e.length > 1 || e.params[0] ? e.clone() : bc),
        (this._data = ``),
        (this._hitLimit = !1));
    }
    put(e, t, n) {
      this._hitLimit ||
        ((this._data += Dt(e, t, n)),
        this._data.length > 1e7 && ((this._data = ``), (this._hitLimit = !0)));
    }
    unhook(e) {
      let t = !1;
      if (this._hitLimit) t = !1;
      else if (
        e &&
        ((t = this._handler(this._data, this._params)), t instanceof Promise)
      )
        return t.then(
          (e) => (
            (this._params = bc),
            (this._data = ``),
            (this._hitLimit = !1),
            e
          ),
        );
      return ((this._params = bc), (this._data = ``), (this._hitLimit = !1), t);
    }
  },
  Sc = class {
    constructor(e) {
      this.table = new Uint8Array(e);
    }
    setDefault(e, t) {
      this.table.fill((e << 4) | t);
    }
    add(e, t, n, r) {
      this.table[(t << 8) | e] = (n << 4) | r;
    }
    addMany(e, t, n, r) {
      for (let i = 0; i < e.length; i++)
        this.table[(t << 8) | e[i]] = (n << 4) | r;
    }
  },
  Cc = 160,
  wc = (function () {
    let e = new Sc(4095),
      t = Array.apply(null, Array(256)).map((e, t) => t),
      n = (e, n) => t.slice(e, n),
      r = n(32, 127),
      i = n(0, 24);
    (i.push(25), i.push.apply(i, n(28, 32)));
    let a = n(0, 14),
      o;
    for (o in (e.setDefault(1, 0), e.addMany(r, 0, 2, 0), a))
      (e.addMany([24, 26, 153, 154], o, 3, 0),
        e.addMany(n(128, 144), o, 3, 0),
        e.addMany(n(144, 152), o, 3, 0),
        e.add(156, o, 0, 0),
        e.add(27, o, 11, 1),
        e.add(157, o, 4, 8),
        e.addMany([152, 158, 159], o, 0, 7),
        e.add(155, o, 11, 3),
        e.add(144, o, 11, 9));
    return (
      e.addMany(i, 0, 3, 0),
      e.addMany(i, 1, 3, 1),
      e.add(127, 1, 0, 1),
      e.addMany(i, 8, 0, 8),
      e.addMany(i, 3, 3, 3),
      e.add(127, 3, 0, 3),
      e.addMany(i, 4, 3, 4),
      e.add(127, 4, 0, 4),
      e.addMany(i, 6, 3, 6),
      e.addMany(i, 5, 3, 5),
      e.add(127, 5, 0, 5),
      e.addMany(i, 2, 3, 2),
      e.add(127, 2, 0, 2),
      e.add(93, 1, 4, 8),
      e.addMany(r, 8, 5, 8),
      e.add(127, 8, 5, 8),
      e.addMany([156, 27, 24, 26, 7], 8, 6, 0),
      e.addMany(n(28, 32), 8, 0, 8),
      e.addMany([88, 94, 95], 1, 0, 7),
      e.addMany(r, 7, 0, 7),
      e.addMany(i, 7, 0, 7),
      e.add(156, 7, 0, 0),
      e.add(127, 7, 0, 7),
      e.add(91, 1, 11, 3),
      e.addMany(n(64, 127), 3, 7, 0),
      e.addMany(n(48, 60), 3, 8, 4),
      e.addMany([60, 61, 62, 63], 3, 9, 4),
      e.addMany(n(48, 60), 4, 8, 4),
      e.addMany(n(64, 127), 4, 7, 0),
      e.addMany([60, 61, 62, 63], 4, 0, 6),
      e.addMany(n(32, 64), 6, 0, 6),
      e.add(127, 6, 0, 6),
      e.addMany(n(64, 127), 6, 0, 0),
      e.addMany(n(32, 48), 3, 9, 5),
      e.addMany(n(32, 48), 5, 9, 5),
      e.addMany(n(48, 64), 5, 0, 6),
      e.addMany(n(64, 127), 5, 7, 0),
      e.addMany(n(32, 48), 4, 9, 5),
      e.addMany(n(32, 48), 1, 9, 2),
      e.addMany(n(32, 48), 2, 9, 2),
      e.addMany(n(48, 127), 2, 10, 0),
      e.addMany(n(48, 80), 1, 10, 0),
      e.addMany(n(81, 88), 1, 10, 0),
      e.addMany([89, 90, 92], 1, 10, 0),
      e.addMany(n(96, 127), 1, 10, 0),
      e.add(80, 1, 11, 9),
      e.addMany(i, 9, 0, 9),
      e.add(127, 9, 0, 9),
      e.addMany(n(28, 32), 9, 0, 9),
      e.addMany(n(32, 48), 9, 9, 12),
      e.addMany(n(48, 60), 9, 8, 10),
      e.addMany([60, 61, 62, 63], 9, 9, 10),
      e.addMany(i, 11, 0, 11),
      e.addMany(n(32, 128), 11, 0, 11),
      e.addMany(n(28, 32), 11, 0, 11),
      e.addMany(i, 10, 0, 10),
      e.add(127, 10, 0, 10),
      e.addMany(n(28, 32), 10, 0, 10),
      e.addMany(n(48, 60), 10, 8, 10),
      e.addMany([60, 61, 62, 63], 10, 0, 11),
      e.addMany(n(32, 48), 10, 9, 12),
      e.addMany(i, 12, 0, 12),
      e.add(127, 12, 0, 12),
      e.addMany(n(28, 32), 12, 0, 12),
      e.addMany(n(32, 48), 12, 9, 12),
      e.addMany(n(48, 64), 12, 0, 11),
      e.addMany(n(64, 127), 12, 12, 13),
      e.addMany(n(64, 127), 10, 12, 13),
      e.addMany(n(64, 127), 9, 12, 13),
      e.addMany(i, 13, 13, 13),
      e.addMany(r, 13, 13, 13),
      e.add(127, 13, 0, 13),
      e.addMany([27, 156, 24, 26], 13, 14, 0),
      e.add(Cc, 0, 2, 0),
      e.add(Cc, 8, 5, 8),
      e.add(Cc, 6, 0, 6),
      e.add(Cc, 11, 0, 11),
      e.add(Cc, 13, 13, 13),
      e
    );
  })(),
  Tc = class extends F {
    constructor(e = wc) {
      (super(),
        (this._transitions = e),
        (this._parseStack = {
          state: 0,
          handlers: [],
          handlerPos: 0,
          transition: 0,
          chunkPos: 0,
        }),
        (this.initialState = 0),
        (this.currentState = this.initialState),
        (this._params = new mc()),
        this._params.addParam(0),
        (this._collect = 0),
        (this.precedingJoinState = 0),
        (this._printHandlerFb = (e, t, n) => {}),
        (this._executeHandlerFb = (e) => {}),
        (this._csiHandlerFb = (e, t) => {}),
        (this._escHandlerFb = (e) => {}),
        (this._errorHandlerFb = (e) => e),
        (this._printHandler = this._printHandlerFb),
        (this._executeHandlers = Object.create(null)),
        (this._csiHandlers = Object.create(null)),
        (this._escHandlers = Object.create(null)),
        this._register(
          P(() => {
            ((this._csiHandlers = Object.create(null)),
              (this._executeHandlers = Object.create(null)),
              (this._escHandlers = Object.create(null)));
          }),
        ),
        (this._oscParser = this._register(new gc())),
        (this._dcsParser = this._register(new yc())),
        (this._errorHandler = this._errorHandlerFb),
        this.registerEscHandler({ final: `\\` }, () => !0));
    }
    _identifier(e, t = [64, 126]) {
      let n = 0;
      if (e.prefix) {
        if (e.prefix.length > 1)
          throw Error(`only one byte as prefix supported`);
        if (((n = e.prefix.charCodeAt(0)), (n && 60 > n) || n > 63))
          throw Error(`prefix must be in range 0x3c .. 0x3f`);
      }
      if (e.intermediates) {
        if (e.intermediates.length > 2)
          throw Error(`only two bytes as intermediates are supported`);
        for (let t = 0; t < e.intermediates.length; ++t) {
          let r = e.intermediates.charCodeAt(t);
          if (32 > r || r > 47)
            throw Error(`intermediate must be in range 0x20 .. 0x2f`);
          ((n <<= 8), (n |= r));
        }
      }
      if (e.final.length !== 1) throw Error(`final must be a single byte`);
      let r = e.final.charCodeAt(0);
      if (t[0] > r || r > t[1])
        throw Error(`final must be in range ${t[0]} .. ${t[1]}`);
      return ((n <<= 8), (n |= r), n);
    }
    identToString(e) {
      let t = [];
      for (; e; ) (t.push(String.fromCharCode(e & 255)), (e >>= 8));
      return t.reverse().join(``);
    }
    setPrintHandler(e) {
      this._printHandler = e;
    }
    clearPrintHandler() {
      this._printHandler = this._printHandlerFb;
    }
    registerEscHandler(e, t) {
      let n = this._identifier(e, [48, 126]);
      this._escHandlers[n] === void 0 && (this._escHandlers[n] = []);
      let r = this._escHandlers[n];
      return (
        r.push(t),
        {
          dispose: () => {
            let e = r.indexOf(t);
            e !== -1 && r.splice(e, 1);
          },
        }
      );
    }
    clearEscHandler(e) {
      this._escHandlers[this._identifier(e, [48, 126])] &&
        delete this._escHandlers[this._identifier(e, [48, 126])];
    }
    setEscHandlerFallback(e) {
      this._escHandlerFb = e;
    }
    setExecuteHandler(e, t) {
      this._executeHandlers[e.charCodeAt(0)] = t;
    }
    clearExecuteHandler(e) {
      this._executeHandlers[e.charCodeAt(0)] &&
        delete this._executeHandlers[e.charCodeAt(0)];
    }
    setExecuteHandlerFallback(e) {
      this._executeHandlerFb = e;
    }
    registerCsiHandler(e, t) {
      let n = this._identifier(e);
      this._csiHandlers[n] === void 0 && (this._csiHandlers[n] = []);
      let r = this._csiHandlers[n];
      return (
        r.push(t),
        {
          dispose: () => {
            let e = r.indexOf(t);
            e !== -1 && r.splice(e, 1);
          },
        }
      );
    }
    clearCsiHandler(e) {
      this._csiHandlers[this._identifier(e)] &&
        delete this._csiHandlers[this._identifier(e)];
    }
    setCsiHandlerFallback(e) {
      this._csiHandlerFb = e;
    }
    registerDcsHandler(e, t) {
      return this._dcsParser.registerHandler(this._identifier(e), t);
    }
    clearDcsHandler(e) {
      this._dcsParser.clearHandler(this._identifier(e));
    }
    setDcsHandlerFallback(e) {
      this._dcsParser.setHandlerFallback(e);
    }
    registerOscHandler(e, t) {
      return this._oscParser.registerHandler(e, t);
    }
    clearOscHandler(e) {
      this._oscParser.clearHandler(e);
    }
    setOscHandlerFallback(e) {
      this._oscParser.setHandlerFallback(e);
    }
    setErrorHandler(e) {
      this._errorHandler = e;
    }
    clearErrorHandler() {
      this._errorHandler = this._errorHandlerFb;
    }
    reset() {
      ((this.currentState = this.initialState),
        this._oscParser.reset(),
        this._dcsParser.reset(),
        this._params.reset(),
        this._params.addParam(0),
        (this._collect = 0),
        (this.precedingJoinState = 0),
        this._parseStack.state !== 0 &&
          ((this._parseStack.state = 2), (this._parseStack.handlers = [])));
    }
    _preserveStack(e, t, n, r, i) {
      ((this._parseStack.state = e),
        (this._parseStack.handlers = t),
        (this._parseStack.handlerPos = n),
        (this._parseStack.transition = r),
        (this._parseStack.chunkPos = i));
    }
    parse(e, t, n) {
      let r = 0,
        i = 0,
        a = 0,
        o;
      if (this._parseStack.state)
        if (this._parseStack.state === 2)
          ((this._parseStack.state = 0), (a = this._parseStack.chunkPos + 1));
        else {
          if (n === void 0 || this._parseStack.state === 1)
            throw (
              (this._parseStack.state = 1),
              Error(
                `improper continuation due to previous async handler, giving up parsing`,
              )
            );
          let t = this._parseStack.handlers,
            i = this._parseStack.handlerPos - 1;
          switch (this._parseStack.state) {
            case 3:
              if (n === !1 && i > -1) {
                for (; i >= 0 && ((o = t[i](this._params)), o !== !0); i--)
                  if (o instanceof Promise)
                    return ((this._parseStack.handlerPos = i), o);
              }
              this._parseStack.handlers = [];
              break;
            case 4:
              if (n === !1 && i > -1) {
                for (; i >= 0 && ((o = t[i]()), o !== !0); i--)
                  if (o instanceof Promise)
                    return ((this._parseStack.handlerPos = i), o);
              }
              this._parseStack.handlers = [];
              break;
            case 6:
              if (
                ((r = e[this._parseStack.chunkPos]),
                (o = this._dcsParser.unhook(r !== 24 && r !== 26, n)),
                o)
              )
                return o;
              (r === 27 && (this._parseStack.transition |= 1),
                this._params.reset(),
                this._params.addParam(0),
                (this._collect = 0));
              break;
            case 5:
              if (
                ((r = e[this._parseStack.chunkPos]),
                (o = this._oscParser.end(r !== 24 && r !== 26, n)),
                o)
              )
                return o;
              (r === 27 && (this._parseStack.transition |= 1),
                this._params.reset(),
                this._params.addParam(0),
                (this._collect = 0));
              break;
          }
          ((this._parseStack.state = 0),
            (a = this._parseStack.chunkPos + 1),
            (this.precedingJoinState = 0),
            (this.currentState = this._parseStack.transition & 15));
        }
      for (let n = a; n < t; ++n) {
        switch (
          ((r = e[n]),
          (i =
            this._transitions.table[
              (this.currentState << 8) | (r < 160 ? r : Cc)
            ]),
          i >> 4)
        ) {
          case 2:
            for (let i = n + 1; ; ++i) {
              if (i >= t || (r = e[i]) < 32 || (r > 126 && r < Cc)) {
                (this._printHandler(e, n, i), (n = i - 1));
                break;
              }
              if (++i >= t || (r = e[i]) < 32 || (r > 126 && r < Cc)) {
                (this._printHandler(e, n, i), (n = i - 1));
                break;
              }
              if (++i >= t || (r = e[i]) < 32 || (r > 126 && r < Cc)) {
                (this._printHandler(e, n, i), (n = i - 1));
                break;
              }
              if (++i >= t || (r = e[i]) < 32 || (r > 126 && r < Cc)) {
                (this._printHandler(e, n, i), (n = i - 1));
                break;
              }
            }
            break;
          case 3:
            (this._executeHandlers[r]
              ? this._executeHandlers[r]()
              : this._executeHandlerFb(r),
              (this.precedingJoinState = 0));
            break;
          case 0:
            break;
          case 1:
            if (
              this._errorHandler({
                position: n,
                code: r,
                currentState: this.currentState,
                collect: this._collect,
                params: this._params,
                abort: !1,
              }).abort
            )
              return;
            break;
          case 7:
            let a = this._csiHandlers[(this._collect << 8) | r],
              s = a ? a.length - 1 : -1;
            for (; s >= 0 && ((o = a[s](this._params)), o !== !0); s--)
              if (o instanceof Promise)
                return (this._preserveStack(3, a, s, i, n), o);
            (s < 0 &&
              this._csiHandlerFb((this._collect << 8) | r, this._params),
              (this.precedingJoinState = 0));
            break;
          case 8:
            do
              switch (r) {
                case 59:
                  this._params.addParam(0);
                  break;
                case 58:
                  this._params.addSubParam(-1);
                  break;
                default:
                  this._params.addDigit(r - 48);
              }
            while (++n < t && (r = e[n]) > 47 && r < 60);
            n--;
            break;
          case 9:
            ((this._collect <<= 8), (this._collect |= r));
            break;
          case 10:
            let c = this._escHandlers[(this._collect << 8) | r],
              l = c ? c.length - 1 : -1;
            for (; l >= 0 && ((o = c[l]()), o !== !0); l--)
              if (o instanceof Promise)
                return (this._preserveStack(4, c, l, i, n), o);
            (l < 0 && this._escHandlerFb((this._collect << 8) | r),
              (this.precedingJoinState = 0));
            break;
          case 11:
            (this._params.reset(),
              this._params.addParam(0),
              (this._collect = 0));
            break;
          case 12:
            this._dcsParser.hook((this._collect << 8) | r, this._params);
            break;
          case 13:
            for (let i = n + 1; ; ++i)
              if (
                i >= t ||
                (r = e[i]) === 24 ||
                r === 26 ||
                r === 27 ||
                (r > 127 && r < Cc)
              ) {
                (this._dcsParser.put(e, n, i), (n = i - 1));
                break;
              }
            break;
          case 14:
            if (((o = this._dcsParser.unhook(r !== 24 && r !== 26)), o))
              return (this._preserveStack(6, [], 0, i, n), o);
            (r === 27 && (i |= 1),
              this._params.reset(),
              this._params.addParam(0),
              (this._collect = 0),
              (this.precedingJoinState = 0));
            break;
          case 4:
            this._oscParser.start();
            break;
          case 5:
            for (let i = n + 1; ; i++)
              if (i >= t || (r = e[i]) < 32 || (r > 127 && r < Cc)) {
                (this._oscParser.put(e, n, i), (n = i - 1));
                break;
              }
            break;
          case 6:
            if (((o = this._oscParser.end(r !== 24 && r !== 26)), o))
              return (this._preserveStack(5, [], 0, i, n), o);
            (r === 27 && (i |= 1),
              this._params.reset(),
              this._params.addParam(0),
              (this._collect = 0),
              (this.precedingJoinState = 0));
            break;
        }
        this.currentState = i & 15;
      }
    }
  },
  Ec =
    /^([\da-f])\/([\da-f])\/([\da-f])$|^([\da-f]{2})\/([\da-f]{2})\/([\da-f]{2})$|^([\da-f]{3})\/([\da-f]{3})\/([\da-f]{3})$|^([\da-f]{4})\/([\da-f]{4})\/([\da-f]{4})$/,
  Dc = /^[\da-f]+$/;
function Oc(e) {
  if (!e) return;
  let t = e.toLowerCase();
  if (t.indexOf(`rgb:`) === 0) {
    t = t.slice(4);
    let e = Ec.exec(t);
    if (e) {
      let t = e[1] ? 15 : e[4] ? 255 : e[7] ? 4095 : 65535;
      return [
        Math.round((parseInt(e[1] || e[4] || e[7] || e[10], 16) / t) * 255),
        Math.round((parseInt(e[2] || e[5] || e[8] || e[11], 16) / t) * 255),
        Math.round((parseInt(e[3] || e[6] || e[9] || e[12], 16) / t) * 255),
      ];
    }
  } else if (
    t.indexOf(`#`) === 0 &&
    ((t = t.slice(1)), Dc.exec(t) && [3, 6, 9, 12].includes(t.length))
  ) {
    let e = t.length / 3,
      n = [0, 0, 0];
    for (let r = 0; r < 3; ++r) {
      let i = parseInt(t.slice(e * r, e * r + e), 16);
      n[r] = e === 1 ? i << 4 : e === 2 ? i : e === 3 ? i >> 4 : i >> 8;
    }
    return n;
  }
}
function kc(e, t) {
  let n = e.toString(16),
    r = n.length < 2 ? `0` + n : n;
  switch (t) {
    case 4:
      return n[0];
    case 8:
      return r;
    case 12:
      return (r + r).slice(0, 3);
    default:
      return r + r;
  }
}
function Ac(e, t = 16) {
  let [n, r, i] = e;
  return `rgb:${kc(n, t)}/${kc(r, t)}/${kc(i, t)}`;
}
var jc = { "(": 0, ")": 1, "*": 2, "+": 3, "-": 1, ".": 2 },
  Mc = 131072,
  Nc = 10;
function Pc(e, t) {
  if (e > 24) return t.setWinLines || !1;
  switch (e) {
    case 1:
      return !!t.restoreWin;
    case 2:
      return !!t.minimizeWin;
    case 3:
      return !!t.setWinPosition;
    case 4:
      return !!t.setWinSizePixels;
    case 5:
      return !!t.raiseWin;
    case 6:
      return !!t.lowerWin;
    case 7:
      return !!t.refreshWin;
    case 8:
      return !!t.setWinSizeChars;
    case 9:
      return !!t.maximizeWin;
    case 10:
      return !!t.fullscreenWin;
    case 11:
      return !!t.getWinState;
    case 13:
      return !!t.getWinPosition;
    case 14:
      return !!t.getWinSizePixels;
    case 15:
      return !!t.getScreenSizePixels;
    case 16:
      return !!t.getCellSizePixels;
    case 18:
      return !!t.getWinSizeChars;
    case 19:
      return !!t.getScreenSizeChars;
    case 20:
      return !!t.getIconTitle;
    case 21:
      return !!t.getWinTitle;
    case 22:
      return !!t.pushTitle;
    case 23:
      return !!t.popTitle;
    case 24:
      return !!t.setWinLines;
  }
  return !1;
}
var Fc = 5e3,
  Ic = 0,
  Lc = class extends F {
    constructor(e, t, n, r, i, a, o, s, c = new Tc()) {
      (super(),
        (this._bufferService = e),
        (this._charsetService = t),
        (this._coreService = n),
        (this._logService = r),
        (this._optionsService = i),
        (this._oscLinkService = a),
        (this._coreMouseService = o),
        (this._unicodeService = s),
        (this._parser = c),
        (this._parseBuffer = new Uint32Array(4096)),
        (this._stringDecoder = new Ot()),
        (this._utf8Decoder = new kt()),
        (this._windowTitle = ``),
        (this._iconName = ``),
        (this._windowTitleStack = []),
        (this._iconNameStack = []),
        (this._curAttrData = X.clone()),
        (this._eraseAttrDataInternal = X.clone()),
        (this._onRequestBell = this._register(new L())),
        (this.onRequestBell = this._onRequestBell.event),
        (this._onRequestRefreshRows = this._register(new L())),
        (this.onRequestRefreshRows = this._onRequestRefreshRows.event),
        (this._onRequestReset = this._register(new L())),
        (this.onRequestReset = this._onRequestReset.event),
        (this._onRequestSendFocus = this._register(new L())),
        (this.onRequestSendFocus = this._onRequestSendFocus.event),
        (this._onRequestSyncScrollBar = this._register(new L())),
        (this.onRequestSyncScrollBar = this._onRequestSyncScrollBar.event),
        (this._onRequestWindowsOptionsReport = this._register(new L())),
        (this.onRequestWindowsOptionsReport =
          this._onRequestWindowsOptionsReport.event),
        (this._onA11yChar = this._register(new L())),
        (this.onA11yChar = this._onA11yChar.event),
        (this._onA11yTab = this._register(new L())),
        (this.onA11yTab = this._onA11yTab.event),
        (this._onCursorMove = this._register(new L())),
        (this.onCursorMove = this._onCursorMove.event),
        (this._onLineFeed = this._register(new L())),
        (this.onLineFeed = this._onLineFeed.event),
        (this._onScroll = this._register(new L())),
        (this.onScroll = this._onScroll.event),
        (this._onTitleChange = this._register(new L())),
        (this.onTitleChange = this._onTitleChange.event),
        (this._onColor = this._register(new L())),
        (this.onColor = this._onColor.event),
        (this._parseStack = {
          paused: !1,
          cursorStartX: 0,
          cursorStartY: 0,
          decodedLength: 0,
          position: 0,
        }),
        (this._specialColors = [256, 257, 258]),
        this._register(this._parser),
        (this._dirtyRowTracker = new Rc(this._bufferService)),
        (this._activeBuffer = this._bufferService.buffer),
        this._register(
          this._bufferService.buffers.onBufferActivate(
            (e) => (this._activeBuffer = e.activeBuffer),
          ),
        ),
        this._parser.setCsiHandlerFallback((e, t) => {
          this._logService.debug(`Unknown CSI code: `, {
            identifier: this._parser.identToString(e),
            params: t.toArray(),
          });
        }),
        this._parser.setEscHandlerFallback((e) => {
          this._logService.debug(`Unknown ESC code: `, {
            identifier: this._parser.identToString(e),
          });
        }),
        this._parser.setExecuteHandlerFallback((e) => {
          this._logService.debug(`Unknown EXECUTE code: `, { code: e });
        }),
        this._parser.setOscHandlerFallback((e, t, n) => {
          this._logService.debug(`Unknown OSC code: `, {
            identifier: e,
            action: t,
            data: n,
          });
        }),
        this._parser.setDcsHandlerFallback((e, t, n) => {
          (t === `HOOK` && (n = n.toArray()),
            this._logService.debug(`Unknown DCS code: `, {
              identifier: this._parser.identToString(e),
              action: t,
              payload: n,
            }));
        }),
        this._parser.setPrintHandler((e, t, n) => this.print(e, t, n)),
        this._parser.registerCsiHandler({ final: `@` }, (e) =>
          this.insertChars(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: ` `, final: `@` },
          (e) => this.scrollLeft(e),
        ),
        this._parser.registerCsiHandler({ final: `A` }, (e) =>
          this.cursorUp(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: ` `, final: `A` },
          (e) => this.scrollRight(e),
        ),
        this._parser.registerCsiHandler({ final: `B` }, (e) =>
          this.cursorDown(e),
        ),
        this._parser.registerCsiHandler({ final: `C` }, (e) =>
          this.cursorForward(e),
        ),
        this._parser.registerCsiHandler({ final: `D` }, (e) =>
          this.cursorBackward(e),
        ),
        this._parser.registerCsiHandler({ final: `E` }, (e) =>
          this.cursorNextLine(e),
        ),
        this._parser.registerCsiHandler({ final: `F` }, (e) =>
          this.cursorPrecedingLine(e),
        ),
        this._parser.registerCsiHandler({ final: `G` }, (e) =>
          this.cursorCharAbsolute(e),
        ),
        this._parser.registerCsiHandler({ final: `H` }, (e) =>
          this.cursorPosition(e),
        ),
        this._parser.registerCsiHandler({ final: `I` }, (e) =>
          this.cursorForwardTab(e),
        ),
        this._parser.registerCsiHandler({ final: `J` }, (e) =>
          this.eraseInDisplay(e, !1),
        ),
        this._parser.registerCsiHandler({ prefix: `?`, final: `J` }, (e) =>
          this.eraseInDisplay(e, !0),
        ),
        this._parser.registerCsiHandler({ final: `K` }, (e) =>
          this.eraseInLine(e, !1),
        ),
        this._parser.registerCsiHandler({ prefix: `?`, final: `K` }, (e) =>
          this.eraseInLine(e, !0),
        ),
        this._parser.registerCsiHandler({ final: `L` }, (e) =>
          this.insertLines(e),
        ),
        this._parser.registerCsiHandler({ final: `M` }, (e) =>
          this.deleteLines(e),
        ),
        this._parser.registerCsiHandler({ final: `P` }, (e) =>
          this.deleteChars(e),
        ),
        this._parser.registerCsiHandler({ final: `S` }, (e) =>
          this.scrollUp(e),
        ),
        this._parser.registerCsiHandler({ final: `T` }, (e) =>
          this.scrollDown(e),
        ),
        this._parser.registerCsiHandler({ final: `X` }, (e) =>
          this.eraseChars(e),
        ),
        this._parser.registerCsiHandler({ final: `Z` }, (e) =>
          this.cursorBackwardTab(e),
        ),
        this._parser.registerCsiHandler({ final: "`" }, (e) =>
          this.charPosAbsolute(e),
        ),
        this._parser.registerCsiHandler({ final: `a` }, (e) =>
          this.hPositionRelative(e),
        ),
        this._parser.registerCsiHandler({ final: `b` }, (e) =>
          this.repeatPrecedingCharacter(e),
        ),
        this._parser.registerCsiHandler({ final: `c` }, (e) =>
          this.sendDeviceAttributesPrimary(e),
        ),
        this._parser.registerCsiHandler({ prefix: `>`, final: `c` }, (e) =>
          this.sendDeviceAttributesSecondary(e),
        ),
        this._parser.registerCsiHandler({ final: `d` }, (e) =>
          this.linePosAbsolute(e),
        ),
        this._parser.registerCsiHandler({ final: `e` }, (e) =>
          this.vPositionRelative(e),
        ),
        this._parser.registerCsiHandler({ final: `f` }, (e) =>
          this.hVPosition(e),
        ),
        this._parser.registerCsiHandler({ final: `g` }, (e) =>
          this.tabClear(e),
        ),
        this._parser.registerCsiHandler({ final: `h` }, (e) => this.setMode(e)),
        this._parser.registerCsiHandler({ prefix: `?`, final: `h` }, (e) =>
          this.setModePrivate(e),
        ),
        this._parser.registerCsiHandler({ final: `l` }, (e) =>
          this.resetMode(e),
        ),
        this._parser.registerCsiHandler({ prefix: `?`, final: `l` }, (e) =>
          this.resetModePrivate(e),
        ),
        this._parser.registerCsiHandler({ final: `m` }, (e) =>
          this.charAttributes(e),
        ),
        this._parser.registerCsiHandler({ final: `n` }, (e) =>
          this.deviceStatus(e),
        ),
        this._parser.registerCsiHandler({ prefix: `?`, final: `n` }, (e) =>
          this.deviceStatusPrivate(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: `!`, final: `p` },
          (e) => this.softReset(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: ` `, final: `q` },
          (e) => this.setCursorStyle(e),
        ),
        this._parser.registerCsiHandler({ final: `r` }, (e) =>
          this.setScrollRegion(e),
        ),
        this._parser.registerCsiHandler({ final: `s` }, (e) =>
          this.saveCursor(e),
        ),
        this._parser.registerCsiHandler({ final: `t` }, (e) =>
          this.windowOptions(e),
        ),
        this._parser.registerCsiHandler({ final: `u` }, (e) =>
          this.restoreCursor(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: `'`, final: `}` },
          (e) => this.insertColumns(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: `'`, final: `~` },
          (e) => this.deleteColumns(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: `"`, final: `q` },
          (e) => this.selectProtected(e),
        ),
        this._parser.registerCsiHandler(
          { intermediates: `$`, final: `p` },
          (e) => this.requestMode(e, !0),
        ),
        this._parser.registerCsiHandler(
          { prefix: `?`, intermediates: `$`, final: `p` },
          (e) => this.requestMode(e, !1),
        ),
        this._parser.setExecuteHandler(B.BEL, () => this.bell()),
        this._parser.setExecuteHandler(B.LF, () => this.lineFeed()),
        this._parser.setExecuteHandler(B.VT, () => this.lineFeed()),
        this._parser.setExecuteHandler(B.FF, () => this.lineFeed()),
        this._parser.setExecuteHandler(B.CR, () => this.carriageReturn()),
        this._parser.setExecuteHandler(B.BS, () => this.backspace()),
        this._parser.setExecuteHandler(B.HT, () => this.tab()),
        this._parser.setExecuteHandler(B.SO, () => this.shiftOut()),
        this._parser.setExecuteHandler(B.SI, () => this.shiftIn()),
        this._parser.setExecuteHandler(Ra.IND, () => this.index()),
        this._parser.setExecuteHandler(Ra.NEL, () => this.nextLine()),
        this._parser.setExecuteHandler(Ra.HTS, () => this.tabSet()),
        this._parser.registerOscHandler(
          0,
          new _c((e) => (this.setTitle(e), this.setIconName(e), !0)),
        ),
        this._parser.registerOscHandler(1, new _c((e) => this.setIconName(e))),
        this._parser.registerOscHandler(2, new _c((e) => this.setTitle(e))),
        this._parser.registerOscHandler(
          4,
          new _c((e) => this.setOrReportIndexedColor(e)),
        ),
        this._parser.registerOscHandler(8, new _c((e) => this.setHyperlink(e))),
        this._parser.registerOscHandler(
          10,
          new _c((e) => this.setOrReportFgColor(e)),
        ),
        this._parser.registerOscHandler(
          11,
          new _c((e) => this.setOrReportBgColor(e)),
        ),
        this._parser.registerOscHandler(
          12,
          new _c((e) => this.setOrReportCursorColor(e)),
        ),
        this._parser.registerOscHandler(
          104,
          new _c((e) => this.restoreIndexedColor(e)),
        ),
        this._parser.registerOscHandler(
          110,
          new _c((e) => this.restoreFgColor(e)),
        ),
        this._parser.registerOscHandler(
          111,
          new _c((e) => this.restoreBgColor(e)),
        ),
        this._parser.registerOscHandler(
          112,
          new _c((e) => this.restoreCursorColor(e)),
        ),
        this._parser.registerEscHandler({ final: `7` }, () =>
          this.saveCursor(),
        ),
        this._parser.registerEscHandler({ final: `8` }, () =>
          this.restoreCursor(),
        ),
        this._parser.registerEscHandler({ final: `D` }, () => this.index()),
        this._parser.registerEscHandler({ final: `E` }, () => this.nextLine()),
        this._parser.registerEscHandler({ final: `H` }, () => this.tabSet()),
        this._parser.registerEscHandler({ final: `M` }, () =>
          this.reverseIndex(),
        ),
        this._parser.registerEscHandler({ final: `=` }, () =>
          this.keypadApplicationMode(),
        ),
        this._parser.registerEscHandler({ final: `>` }, () =>
          this.keypadNumericMode(),
        ),
        this._parser.registerEscHandler({ final: `c` }, () => this.fullReset()),
        this._parser.registerEscHandler({ final: `n` }, () =>
          this.setgLevel(2),
        ),
        this._parser.registerEscHandler({ final: `o` }, () =>
          this.setgLevel(3),
        ),
        this._parser.registerEscHandler({ final: `|` }, () =>
          this.setgLevel(3),
        ),
        this._parser.registerEscHandler({ final: `}` }, () =>
          this.setgLevel(2),
        ),
        this._parser.registerEscHandler({ final: `~` }, () =>
          this.setgLevel(1),
        ),
        this._parser.registerEscHandler(
          { intermediates: `%`, final: `@` },
          () => this.selectDefaultCharset(),
        ),
        this._parser.registerEscHandler(
          { intermediates: `%`, final: `G` },
          () => this.selectDefaultCharset(),
        ));
      for (let e in Z)
        (this._parser.registerEscHandler({ intermediates: `(`, final: e }, () =>
          this.selectCharset(`(` + e),
        ),
          this._parser.registerEscHandler(
            { intermediates: `)`, final: e },
            () => this.selectCharset(`)` + e),
          ),
          this._parser.registerEscHandler(
            { intermediates: `*`, final: e },
            () => this.selectCharset(`*` + e),
          ),
          this._parser.registerEscHandler(
            { intermediates: `+`, final: e },
            () => this.selectCharset(`+` + e),
          ),
          this._parser.registerEscHandler(
            { intermediates: `-`, final: e },
            () => this.selectCharset(`-` + e),
          ),
          this._parser.registerEscHandler(
            { intermediates: `.`, final: e },
            () => this.selectCharset(`.` + e),
          ),
          this._parser.registerEscHandler(
            { intermediates: `/`, final: e },
            () => this.selectCharset(`/` + e),
          ));
      (this._parser.registerEscHandler({ intermediates: `#`, final: `8` }, () =>
        this.screenAlignmentPattern(),
      ),
        this._parser.setErrorHandler(
          (e) => (this._logService.error(`Parsing error: `, e), e),
        ),
        this._parser.registerDcsHandler(
          { intermediates: `$`, final: `q` },
          new xc((e, t) => this.requestStatusString(e, t)),
        ));
    }
    getAttrData() {
      return this._curAttrData;
    }
    _preserveStack(e, t, n, r) {
      ((this._parseStack.paused = !0),
        (this._parseStack.cursorStartX = e),
        (this._parseStack.cursorStartY = t),
        (this._parseStack.decodedLength = n),
        (this._parseStack.position = r));
    }
    _logSlowResolvingAsync(e) {
      this._logService.logLevel <= 3 &&
        Promise.race([
          e,
          new Promise((e, t) => setTimeout(() => t(`#SLOW_TIMEOUT`), Fc)),
        ]).catch((e) => {
          if (e !== `#SLOW_TIMEOUT`) throw e;
          console.warn(`async parser handler taking longer than ${Fc} ms`);
        });
    }
    _getCurrentLinkId() {
      return this._curAttrData.extended.urlId;
    }
    parse(e, t) {
      let n,
        r = this._activeBuffer.x,
        i = this._activeBuffer.y,
        a = 0,
        o = this._parseStack.paused;
      if (o) {
        if (
          (n = this._parser.parse(
            this._parseBuffer,
            this._parseStack.decodedLength,
            t,
          ))
        )
          return (this._logSlowResolvingAsync(n), n);
        ((r = this._parseStack.cursorStartX),
          (i = this._parseStack.cursorStartY),
          (this._parseStack.paused = !1),
          e.length > Mc && (a = this._parseStack.position + Mc));
      }
      if (
        (this._logService.logLevel <= 1 &&
          this._logService.debug(
            `parsing data ${typeof e == `string` ? ` "${e}"` : ` "${Array.prototype.map.call(e, (e) => String.fromCharCode(e)).join(``)}"`}`,
          ),
        this._logService.logLevel === 0 &&
          this._logService.trace(
            `parsing data (codes)`,
            typeof e == `string` ? e.split(``).map((e) => e.charCodeAt(0)) : e,
          ),
        this._parseBuffer.length < e.length &&
          this._parseBuffer.length < Mc &&
          (this._parseBuffer = new Uint32Array(Math.min(e.length, Mc))),
        o || this._dirtyRowTracker.clearRange(),
        e.length > Mc)
      )
        for (let t = a; t < e.length; t += Mc) {
          let a = t + Mc < e.length ? t + Mc : e.length,
            o =
              typeof e == `string`
                ? this._stringDecoder.decode(
                    e.substring(t, a),
                    this._parseBuffer,
                  )
                : this._utf8Decoder.decode(e.subarray(t, a), this._parseBuffer);
          if ((n = this._parser.parse(this._parseBuffer, o)))
            return (
              this._preserveStack(r, i, o, t),
              this._logSlowResolvingAsync(n),
              n
            );
        }
      else if (!o) {
        let t =
          typeof e == `string`
            ? this._stringDecoder.decode(e, this._parseBuffer)
            : this._utf8Decoder.decode(e, this._parseBuffer);
        if ((n = this._parser.parse(this._parseBuffer, t)))
          return (
            this._preserveStack(r, i, t, 0),
            this._logSlowResolvingAsync(n),
            n
          );
      }
      (this._activeBuffer.x !== r || this._activeBuffer.y !== i) &&
        this._onCursorMove.fire();
      let s =
          this._dirtyRowTracker.end +
          (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp),
        c =
          this._dirtyRowTracker.start +
          (this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp);
      c < this._bufferService.rows &&
        this._onRequestRefreshRows.fire({
          start: Math.min(c, this._bufferService.rows - 1),
          end: Math.min(s, this._bufferService.rows - 1),
        });
    }
    print(e, t, n) {
      let r,
        i,
        a = this._charsetService.charset,
        o = this._optionsService.rawOptions.screenReaderMode,
        s = this._bufferService.cols,
        c = this._coreService.decPrivateModes.wraparound,
        l = this._coreService.modes.insertMode,
        u = this._curAttrData,
        d = this._activeBuffer.lines.get(
          this._activeBuffer.ybase + this._activeBuffer.y,
        );
      (this._dirtyRowTracker.markDirty(this._activeBuffer.y),
        this._activeBuffer.x &&
          n - t > 0 &&
          d.getWidth(this._activeBuffer.x - 1) === 2 &&
          d.setCellFromCodepoint(this._activeBuffer.x - 1, 0, 1, u));
      let f = this._parser.precedingJoinState;
      for (let p = t; p < n; ++p) {
        if (((r = e[p]), r < 127 && a)) {
          let e = a[String.fromCharCode(r)];
          e && (r = e.charCodeAt(0));
        }
        let t = this._unicodeService.charProperties(r, f);
        i = lc.extractWidth(t);
        let n = lc.extractShouldJoin(t),
          m = n ? lc.extractWidth(f) : 0;
        if (
          ((f = t),
          o && this._onA11yChar.fire(Et(r)),
          this._getCurrentLinkId() &&
            this._oscLinkService.addLineToLink(
              this._getCurrentLinkId(),
              this._activeBuffer.ybase + this._activeBuffer.y,
            ),
          this._activeBuffer.x + i - m > s)
        ) {
          if (c) {
            let e = d,
              t = this._activeBuffer.x - m;
            for (
              this._activeBuffer.x = m,
                this._activeBuffer.y++,
                this._activeBuffer.y === this._activeBuffer.scrollBottom + 1
                  ? (this._activeBuffer.y--,
                    this._bufferService.scroll(this._eraseAttrData(), !0))
                  : (this._activeBuffer.y >= this._bufferService.rows &&
                      (this._activeBuffer.y = this._bufferService.rows - 1),
                    (this._activeBuffer.lines.get(
                      this._activeBuffer.ybase + this._activeBuffer.y,
                    ).isWrapped = !0)),
                d = this._activeBuffer.lines.get(
                  this._activeBuffer.ybase + this._activeBuffer.y,
                ),
                m > 0 && d instanceof js && d.copyCellsFrom(e, t, 0, m, !1);
              t < s;
            )
              e.setCellFromCodepoint(t++, 0, 1, u);
          } else if (((this._activeBuffer.x = s - 1), i === 2)) continue;
        }
        if (n && this._activeBuffer.x) {
          let e = d.getWidth(this._activeBuffer.x - 1) ? 1 : 2;
          d.addCodepointToCell(this._activeBuffer.x - e, r, i);
          for (let e = i - m; --e >= 0; )
            d.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
          continue;
        }
        if (
          (l &&
            (d.insertCells(
              this._activeBuffer.x,
              i - m,
              this._activeBuffer.getNullCell(u),
            ),
            d.getWidth(s - 1) === 2 && d.setCellFromCodepoint(s - 1, 0, 1, u)),
          d.setCellFromCodepoint(this._activeBuffer.x++, r, i, u),
          i > 0)
        )
          for (; --i; ) d.setCellFromCodepoint(this._activeBuffer.x++, 0, 0, u);
      }
      ((this._parser.precedingJoinState = f),
        this._activeBuffer.x < s &&
          n - t > 0 &&
          d.getWidth(this._activeBuffer.x) === 0 &&
          !d.hasContent(this._activeBuffer.x) &&
          d.setCellFromCodepoint(this._activeBuffer.x, 0, 1, u),
        this._dirtyRowTracker.markDirty(this._activeBuffer.y));
    }
    registerCsiHandler(e, t) {
      return e.final === `t` && !e.prefix && !e.intermediates
        ? this._parser.registerCsiHandler(e, (e) =>
            Pc(e.params[0], this._optionsService.rawOptions.windowOptions)
              ? t(e)
              : !0,
          )
        : this._parser.registerCsiHandler(e, t);
    }
    registerDcsHandler(e, t) {
      return this._parser.registerDcsHandler(e, new xc(t));
    }
    registerEscHandler(e, t) {
      return this._parser.registerEscHandler(e, t);
    }
    registerOscHandler(e, t) {
      return this._parser.registerOscHandler(e, new _c(t));
    }
    bell() {
      return (this._onRequestBell.fire(), !0);
    }
    lineFeed() {
      return (
        this._dirtyRowTracker.markDirty(this._activeBuffer.y),
        this._optionsService.rawOptions.convertEol &&
          (this._activeBuffer.x = 0),
        this._activeBuffer.y++,
        this._activeBuffer.y === this._activeBuffer.scrollBottom + 1
          ? (this._activeBuffer.y--,
            this._bufferService.scroll(this._eraseAttrData()))
          : this._activeBuffer.y >= this._bufferService.rows
            ? (this._activeBuffer.y = this._bufferService.rows - 1)
            : (this._activeBuffer.lines.get(
                this._activeBuffer.ybase + this._activeBuffer.y,
              ).isWrapped = !1),
        this._activeBuffer.x >= this._bufferService.cols &&
          this._activeBuffer.x--,
        this._dirtyRowTracker.markDirty(this._activeBuffer.y),
        this._onLineFeed.fire(),
        !0
      );
    }
    carriageReturn() {
      return ((this._activeBuffer.x = 0), !0);
    }
    backspace() {
      if (!this._coreService.decPrivateModes.reverseWraparound)
        return (
          this._restrictCursor(),
          this._activeBuffer.x > 0 && this._activeBuffer.x--,
          !0
        );
      if (
        (this._restrictCursor(this._bufferService.cols),
        this._activeBuffer.x > 0)
      )
        this._activeBuffer.x--;
      else if (
        this._activeBuffer.x === 0 &&
        this._activeBuffer.y > this._activeBuffer.scrollTop &&
        this._activeBuffer.y <= this._activeBuffer.scrollBottom &&
        this._activeBuffer.lines.get(
          this._activeBuffer.ybase + this._activeBuffer.y,
        )?.isWrapped
      ) {
        ((this._activeBuffer.lines.get(
          this._activeBuffer.ybase + this._activeBuffer.y,
        ).isWrapped = !1),
          this._activeBuffer.y--,
          (this._activeBuffer.x = this._bufferService.cols - 1));
        let e = this._activeBuffer.lines.get(
          this._activeBuffer.ybase + this._activeBuffer.y,
        );
        e.hasWidth(this._activeBuffer.x) &&
          !e.hasContent(this._activeBuffer.x) &&
          this._activeBuffer.x--;
      }
      return (this._restrictCursor(), !0);
    }
    tab() {
      if (this._activeBuffer.x >= this._bufferService.cols) return !0;
      let e = this._activeBuffer.x;
      return (
        (this._activeBuffer.x = this._activeBuffer.nextStop()),
        this._optionsService.rawOptions.screenReaderMode &&
          this._onA11yTab.fire(this._activeBuffer.x - e),
        !0
      );
    }
    shiftOut() {
      return (this._charsetService.setgLevel(1), !0);
    }
    shiftIn() {
      return (this._charsetService.setgLevel(0), !0);
    }
    _restrictCursor(e = this._bufferService.cols - 1) {
      ((this._activeBuffer.x = Math.min(e, Math.max(0, this._activeBuffer.x))),
        (this._activeBuffer.y = this._coreService.decPrivateModes.origin
          ? Math.min(
              this._activeBuffer.scrollBottom,
              Math.max(this._activeBuffer.scrollTop, this._activeBuffer.y),
            )
          : Math.min(
              this._bufferService.rows - 1,
              Math.max(0, this._activeBuffer.y),
            )),
        this._dirtyRowTracker.markDirty(this._activeBuffer.y));
    }
    _setCursor(e, t) {
      (this._dirtyRowTracker.markDirty(this._activeBuffer.y),
        this._coreService.decPrivateModes.origin
          ? ((this._activeBuffer.x = e),
            (this._activeBuffer.y = this._activeBuffer.scrollTop + t))
          : ((this._activeBuffer.x = e), (this._activeBuffer.y = t)),
        this._restrictCursor(),
        this._dirtyRowTracker.markDirty(this._activeBuffer.y));
    }
    _moveCursor(e, t) {
      (this._restrictCursor(),
        this._setCursor(this._activeBuffer.x + e, this._activeBuffer.y + t));
    }
    cursorUp(e) {
      let t = this._activeBuffer.y - this._activeBuffer.scrollTop;
      return (
        t >= 0
          ? this._moveCursor(0, -Math.min(t, e.params[0] || 1))
          : this._moveCursor(0, -(e.params[0] || 1)),
        !0
      );
    }
    cursorDown(e) {
      let t = this._activeBuffer.scrollBottom - this._activeBuffer.y;
      return (
        t >= 0
          ? this._moveCursor(0, Math.min(t, e.params[0] || 1))
          : this._moveCursor(0, e.params[0] || 1),
        !0
      );
    }
    cursorForward(e) {
      return (this._moveCursor(e.params[0] || 1, 0), !0);
    }
    cursorBackward(e) {
      return (this._moveCursor(-(e.params[0] || 1), 0), !0);
    }
    cursorNextLine(e) {
      return (this.cursorDown(e), (this._activeBuffer.x = 0), !0);
    }
    cursorPrecedingLine(e) {
      return (this.cursorUp(e), (this._activeBuffer.x = 0), !0);
    }
    cursorCharAbsolute(e) {
      return (
        this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y),
        !0
      );
    }
    cursorPosition(e) {
      return (
        this._setCursor(
          e.length >= 2 ? (e.params[1] || 1) - 1 : 0,
          (e.params[0] || 1) - 1,
        ),
        !0
      );
    }
    charPosAbsolute(e) {
      return (
        this._setCursor((e.params[0] || 1) - 1, this._activeBuffer.y),
        !0
      );
    }
    hPositionRelative(e) {
      return (this._moveCursor(e.params[0] || 1, 0), !0);
    }
    linePosAbsolute(e) {
      return (
        this._setCursor(this._activeBuffer.x, (e.params[0] || 1) - 1),
        !0
      );
    }
    vPositionRelative(e) {
      return (this._moveCursor(0, e.params[0] || 1), !0);
    }
    hVPosition(e) {
      return (this.cursorPosition(e), !0);
    }
    tabClear(e) {
      let t = e.params[0];
      return (
        t === 0
          ? delete this._activeBuffer.tabs[this._activeBuffer.x]
          : t === 3 && (this._activeBuffer.tabs = {}),
        !0
      );
    }
    cursorForwardTab(e) {
      if (this._activeBuffer.x >= this._bufferService.cols) return !0;
      let t = e.params[0] || 1;
      for (; t--; ) this._activeBuffer.x = this._activeBuffer.nextStop();
      return !0;
    }
    cursorBackwardTab(e) {
      if (this._activeBuffer.x >= this._bufferService.cols) return !0;
      let t = e.params[0] || 1;
      for (; t--; ) this._activeBuffer.x = this._activeBuffer.prevStop();
      return !0;
    }
    selectProtected(e) {
      let t = e.params[0];
      return (
        t === 1 && (this._curAttrData.bg |= 536870912),
        (t === 2 || t === 0) && (this._curAttrData.bg &= -536870913),
        !0
      );
    }
    _eraseInBufferLine(e, t, n, r = !1, i = !1) {
      let a = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
      (a.replaceCells(
        t,
        n,
        this._activeBuffer.getNullCell(this._eraseAttrData()),
        i,
      ),
        r && (a.isWrapped = !1));
    }
    _resetBufferLine(e, t = !1) {
      let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
      n &&
        (n.fill(this._activeBuffer.getNullCell(this._eraseAttrData()), t),
        this._bufferService.buffer.clearMarkers(this._activeBuffer.ybase + e),
        (n.isWrapped = !1));
    }
    eraseInDisplay(e, t = !1) {
      this._restrictCursor(this._bufferService.cols);
      let n;
      switch (e.params[0]) {
        case 0:
          for (
            n = this._activeBuffer.y,
              this._dirtyRowTracker.markDirty(n),
              this._eraseInBufferLine(
                n++,
                this._activeBuffer.x,
                this._bufferService.cols,
                this._activeBuffer.x === 0,
                t,
              );
            n < this._bufferService.rows;
            n++
          )
            this._resetBufferLine(n, t);
          this._dirtyRowTracker.markDirty(n);
          break;
        case 1:
          for (
            n = this._activeBuffer.y,
              this._dirtyRowTracker.markDirty(n),
              this._eraseInBufferLine(n, 0, this._activeBuffer.x + 1, !0, t),
              this._activeBuffer.x + 1 >= this._bufferService.cols &&
                (this._activeBuffer.lines.get(n + 1).isWrapped = !1);
            n--;
          )
            this._resetBufferLine(n, t);
          this._dirtyRowTracker.markDirty(0);
          break;
        case 2:
          if (this._optionsService.rawOptions.scrollOnEraseInDisplay) {
            for (
              n = this._bufferService.rows,
                this._dirtyRowTracker.markRangeDirty(0, n - 1);
              n-- &&
              !this._activeBuffer.lines
                .get(this._activeBuffer.ybase + n)
                ?.getTrimmedLength();
            );
            for (; n >= 0; n--)
              this._bufferService.scroll(this._eraseAttrData());
          } else {
            for (
              n = this._bufferService.rows,
                this._dirtyRowTracker.markDirty(n - 1);
              n--;
            )
              this._resetBufferLine(n, t);
            this._dirtyRowTracker.markDirty(0);
          }
          break;
        case 3:
          let e = this._activeBuffer.lines.length - this._bufferService.rows;
          e > 0 &&
            (this._activeBuffer.lines.trimStart(e),
            (this._activeBuffer.ybase = Math.max(
              this._activeBuffer.ybase - e,
              0,
            )),
            (this._activeBuffer.ydisp = Math.max(
              this._activeBuffer.ydisp - e,
              0,
            )),
            this._onScroll.fire(0));
          break;
      }
      return !0;
    }
    eraseInLine(e, t = !1) {
      switch ((this._restrictCursor(this._bufferService.cols), e.params[0])) {
        case 0:
          this._eraseInBufferLine(
            this._activeBuffer.y,
            this._activeBuffer.x,
            this._bufferService.cols,
            this._activeBuffer.x === 0,
            t,
          );
          break;
        case 1:
          this._eraseInBufferLine(
            this._activeBuffer.y,
            0,
            this._activeBuffer.x + 1,
            !1,
            t,
          );
          break;
        case 2:
          this._eraseInBufferLine(
            this._activeBuffer.y,
            0,
            this._bufferService.cols,
            !0,
            t,
          );
          break;
      }
      return (this._dirtyRowTracker.markDirty(this._activeBuffer.y), !0);
    }
    insertLines(e) {
      this._restrictCursor();
      let t = e.params[0] || 1;
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let n = this._activeBuffer.ybase + this._activeBuffer.y,
        r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom,
        i = this._bufferService.rows - 1 + this._activeBuffer.ybase - r + 1;
      for (; t--; )
        (this._activeBuffer.lines.splice(i - 1, 1),
          this._activeBuffer.lines.splice(
            n,
            0,
            this._activeBuffer.getBlankLine(this._eraseAttrData()),
          ));
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.y,
          this._activeBuffer.scrollBottom,
        ),
        (this._activeBuffer.x = 0),
        !0
      );
    }
    deleteLines(e) {
      this._restrictCursor();
      let t = e.params[0] || 1;
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let n = this._activeBuffer.ybase + this._activeBuffer.y,
        r;
      for (
        r = this._bufferService.rows - 1 - this._activeBuffer.scrollBottom,
          r = this._bufferService.rows - 1 + this._activeBuffer.ybase - r;
        t--;
      )
        (this._activeBuffer.lines.splice(n, 1),
          this._activeBuffer.lines.splice(
            r,
            0,
            this._activeBuffer.getBlankLine(this._eraseAttrData()),
          ));
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.y,
          this._activeBuffer.scrollBottom,
        ),
        (this._activeBuffer.x = 0),
        !0
      );
    }
    insertChars(e) {
      this._restrictCursor();
      let t = this._activeBuffer.lines.get(
        this._activeBuffer.ybase + this._activeBuffer.y,
      );
      return (
        t &&
          (t.insertCells(
            this._activeBuffer.x,
            e.params[0] || 1,
            this._activeBuffer.getNullCell(this._eraseAttrData()),
          ),
          this._dirtyRowTracker.markDirty(this._activeBuffer.y)),
        !0
      );
    }
    deleteChars(e) {
      this._restrictCursor();
      let t = this._activeBuffer.lines.get(
        this._activeBuffer.ybase + this._activeBuffer.y,
      );
      return (
        t &&
          (t.deleteCells(
            this._activeBuffer.x,
            e.params[0] || 1,
            this._activeBuffer.getNullCell(this._eraseAttrData()),
          ),
          this._dirtyRowTracker.markDirty(this._activeBuffer.y)),
        !0
      );
    }
    scrollUp(e) {
      let t = e.params[0] || 1;
      for (; t--; )
        (this._activeBuffer.lines.splice(
          this._activeBuffer.ybase + this._activeBuffer.scrollTop,
          1,
        ),
          this._activeBuffer.lines.splice(
            this._activeBuffer.ybase + this._activeBuffer.scrollBottom,
            0,
            this._activeBuffer.getBlankLine(this._eraseAttrData()),
          ));
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    scrollDown(e) {
      let t = e.params[0] || 1;
      for (; t--; )
        (this._activeBuffer.lines.splice(
          this._activeBuffer.ybase + this._activeBuffer.scrollBottom,
          1,
        ),
          this._activeBuffer.lines.splice(
            this._activeBuffer.ybase + this._activeBuffer.scrollTop,
            0,
            this._activeBuffer.getBlankLine(X),
          ));
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    scrollLeft(e) {
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let t = e.params[0] || 1;
      for (
        let e = this._activeBuffer.scrollTop;
        e <= this._activeBuffer.scrollBottom;
        ++e
      ) {
        let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
        (n.deleteCells(
          0,
          t,
          this._activeBuffer.getNullCell(this._eraseAttrData()),
        ),
          (n.isWrapped = !1));
      }
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    scrollRight(e) {
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let t = e.params[0] || 1;
      for (
        let e = this._activeBuffer.scrollTop;
        e <= this._activeBuffer.scrollBottom;
        ++e
      ) {
        let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
        (n.insertCells(
          0,
          t,
          this._activeBuffer.getNullCell(this._eraseAttrData()),
        ),
          (n.isWrapped = !1));
      }
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    insertColumns(e) {
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let t = e.params[0] || 1;
      for (
        let e = this._activeBuffer.scrollTop;
        e <= this._activeBuffer.scrollBottom;
        ++e
      ) {
        let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
        (n.insertCells(
          this._activeBuffer.x,
          t,
          this._activeBuffer.getNullCell(this._eraseAttrData()),
        ),
          (n.isWrapped = !1));
      }
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    deleteColumns(e) {
      if (
        this._activeBuffer.y > this._activeBuffer.scrollBottom ||
        this._activeBuffer.y < this._activeBuffer.scrollTop
      )
        return !0;
      let t = e.params[0] || 1;
      for (
        let e = this._activeBuffer.scrollTop;
        e <= this._activeBuffer.scrollBottom;
        ++e
      ) {
        let n = this._activeBuffer.lines.get(this._activeBuffer.ybase + e);
        (n.deleteCells(
          this._activeBuffer.x,
          t,
          this._activeBuffer.getNullCell(this._eraseAttrData()),
        ),
          (n.isWrapped = !1));
      }
      return (
        this._dirtyRowTracker.markRangeDirty(
          this._activeBuffer.scrollTop,
          this._activeBuffer.scrollBottom,
        ),
        !0
      );
    }
    eraseChars(e) {
      this._restrictCursor();
      let t = this._activeBuffer.lines.get(
        this._activeBuffer.ybase + this._activeBuffer.y,
      );
      return (
        t &&
          (t.replaceCells(
            this._activeBuffer.x,
            this._activeBuffer.x + (e.params[0] || 1),
            this._activeBuffer.getNullCell(this._eraseAttrData()),
          ),
          this._dirtyRowTracker.markDirty(this._activeBuffer.y)),
        !0
      );
    }
    repeatPrecedingCharacter(e) {
      let t = this._parser.precedingJoinState;
      if (!t) return !0;
      let n = e.params[0] || 1,
        r = lc.extractWidth(t),
        i = this._activeBuffer.x - r,
        a = this._activeBuffer.lines
          .get(this._activeBuffer.ybase + this._activeBuffer.y)
          .getString(i),
        o = new Uint32Array(a.length * n),
        s = 0;
      for (let e = 0; e < a.length; ) {
        let t = a.codePointAt(e) || 0;
        ((o[s++] = t), (e += t > 65535 ? 2 : 1));
      }
      let c = s;
      for (let e = 1; e < n; ++e) (o.copyWithin(c, 0, s), (c += s));
      return (this.print(o, 0, c), !0);
    }
    sendDeviceAttributesPrimary(e) {
      return (
        e.params[0] > 0 ||
          (this._is(`xterm`) || this._is(`rxvt-unicode`) || this._is(`screen`)
            ? this._coreService.triggerDataEvent(B.ESC + `[?1;2c`)
            : this._is(`linux`) &&
              this._coreService.triggerDataEvent(B.ESC + `[?6c`)),
        !0
      );
    }
    sendDeviceAttributesSecondary(e) {
      return (
        e.params[0] > 0 ||
          (this._is(`xterm`)
            ? this._coreService.triggerDataEvent(B.ESC + `[>0;276;0c`)
            : this._is(`rxvt-unicode`)
              ? this._coreService.triggerDataEvent(B.ESC + `[>85;95;0c`)
              : this._is(`linux`)
                ? this._coreService.triggerDataEvent(e.params[0] + `c`)
                : this._is(`screen`) &&
                  this._coreService.triggerDataEvent(B.ESC + `[>83;40003;0c`)),
        !0
      );
    }
    _is(e) {
      return (this._optionsService.rawOptions.termName + ``).indexOf(e) === 0;
    }
    setMode(e) {
      for (let t = 0; t < e.length; t++)
        switch (e.params[t]) {
          case 4:
            this._coreService.modes.insertMode = !0;
            break;
          case 20:
            this._optionsService.options.convertEol = !0;
            break;
        }
      return !0;
    }
    setModePrivate(e) {
      for (let t = 0; t < e.length; t++)
        switch (e.params[t]) {
          case 1:
            this._coreService.decPrivateModes.applicationCursorKeys = !0;
            break;
          case 2:
            (this._charsetService.setgCharset(0, zs),
              this._charsetService.setgCharset(1, zs),
              this._charsetService.setgCharset(2, zs),
              this._charsetService.setgCharset(3, zs));
            break;
          case 3:
            this._optionsService.rawOptions.windowOptions.setWinLines &&
              (this._bufferService.resize(132, this._bufferService.rows),
              this._onRequestReset.fire());
            break;
          case 6:
            ((this._coreService.decPrivateModes.origin = !0),
              this._setCursor(0, 0));
            break;
          case 7:
            this._coreService.decPrivateModes.wraparound = !0;
            break;
          case 12:
            this._optionsService.options.cursorBlink = !0;
            break;
          case 45:
            this._coreService.decPrivateModes.reverseWraparound = !0;
            break;
          case 66:
            (this._logService.debug(
              `Serial port requested application keypad.`,
            ),
              (this._coreService.decPrivateModes.applicationKeypad = !0),
              this._onRequestSyncScrollBar.fire());
            break;
          case 9:
            this._coreMouseService.activeProtocol = `X10`;
            break;
          case 1e3:
            this._coreMouseService.activeProtocol = `VT200`;
            break;
          case 1002:
            this._coreMouseService.activeProtocol = `DRAG`;
            break;
          case 1003:
            this._coreMouseService.activeProtocol = `ANY`;
            break;
          case 1004:
            ((this._coreService.decPrivateModes.sendFocus = !0),
              this._onRequestSendFocus.fire());
            break;
          case 1005:
            this._logService.debug(`DECSET 1005 not supported (see #2507)`);
            break;
          case 1006:
            this._coreMouseService.activeEncoding = `SGR`;
            break;
          case 1015:
            this._logService.debug(`DECSET 1015 not supported (see #2507)`);
            break;
          case 1016:
            this._coreMouseService.activeEncoding = `SGR_PIXELS`;
            break;
          case 25:
            this._coreService.isCursorHidden = !1;
            break;
          case 1048:
            this.saveCursor();
            break;
          case 1049:
            this.saveCursor();
          case 47:
          case 1047:
            (this._bufferService.buffers.activateAltBuffer(
              this._eraseAttrData(),
            ),
              (this._coreService.isCursorInitialized = !0),
              this._onRequestRefreshRows.fire(void 0),
              this._onRequestSyncScrollBar.fire());
            break;
          case 2004:
            this._coreService.decPrivateModes.bracketedPasteMode = !0;
            break;
          case 2026:
            this._coreService.decPrivateModes.synchronizedOutput = !0;
            break;
        }
      return !0;
    }
    resetMode(e) {
      for (let t = 0; t < e.length; t++)
        switch (e.params[t]) {
          case 4:
            this._coreService.modes.insertMode = !1;
            break;
          case 20:
            this._optionsService.options.convertEol = !1;
            break;
        }
      return !0;
    }
    resetModePrivate(e) {
      for (let t = 0; t < e.length; t++)
        switch (e.params[t]) {
          case 1:
            this._coreService.decPrivateModes.applicationCursorKeys = !1;
            break;
          case 3:
            this._optionsService.rawOptions.windowOptions.setWinLines &&
              (this._bufferService.resize(80, this._bufferService.rows),
              this._onRequestReset.fire());
            break;
          case 6:
            ((this._coreService.decPrivateModes.origin = !1),
              this._setCursor(0, 0));
            break;
          case 7:
            this._coreService.decPrivateModes.wraparound = !1;
            break;
          case 12:
            this._optionsService.options.cursorBlink = !1;
            break;
          case 45:
            this._coreService.decPrivateModes.reverseWraparound = !1;
            break;
          case 66:
            (this._logService.debug(`Switching back to normal keypad.`),
              (this._coreService.decPrivateModes.applicationKeypad = !1),
              this._onRequestSyncScrollBar.fire());
            break;
          case 9:
          case 1e3:
          case 1002:
          case 1003:
            this._coreMouseService.activeProtocol = `NONE`;
            break;
          case 1004:
            this._coreService.decPrivateModes.sendFocus = !1;
            break;
          case 1005:
            this._logService.debug(`DECRST 1005 not supported (see #2507)`);
            break;
          case 1006:
            this._coreMouseService.activeEncoding = `DEFAULT`;
            break;
          case 1015:
            this._logService.debug(`DECRST 1015 not supported (see #2507)`);
            break;
          case 1016:
            this._coreMouseService.activeEncoding = `DEFAULT`;
            break;
          case 25:
            this._coreService.isCursorHidden = !0;
            break;
          case 1048:
            this.restoreCursor();
            break;
          case 1049:
          case 47:
          case 1047:
            (this._bufferService.buffers.activateNormalBuffer(),
              e.params[t] === 1049 && this.restoreCursor(),
              (this._coreService.isCursorInitialized = !0),
              this._onRequestRefreshRows.fire(void 0),
              this._onRequestSyncScrollBar.fire());
            break;
          case 2004:
            this._coreService.decPrivateModes.bracketedPasteMode = !1;
            break;
          case 2026:
            ((this._coreService.decPrivateModes.synchronizedOutput = !1),
              this._onRequestRefreshRows.fire(void 0));
            break;
        }
      return !0;
    }
    requestMode(e, t) {
      let n;
      ((e) => (
        (e[(e.NOT_RECOGNIZED = 0)] = `NOT_RECOGNIZED`),
        (e[(e.SET = 1)] = `SET`),
        (e[(e.RESET = 2)] = `RESET`),
        (e[(e.PERMANENTLY_SET = 3)] = `PERMANENTLY_SET`),
        (e[(e.PERMANENTLY_RESET = 4)] = `PERMANENTLY_RESET`)
      ))((n ||= {}));
      let r = this._coreService.decPrivateModes,
        { activeProtocol: i, activeEncoding: a } = this._coreMouseService,
        o = this._coreService,
        { buffers: s, cols: c } = this._bufferService,
        { active: l, alt: u } = s,
        d = this._optionsService.rawOptions,
        f = (e, n) => (
          o.triggerDataEvent(`${B.ESC}[${t ? `` : `?`}${e};${n}$y`),
          !0
        ),
        p = (e) => (e ? 1 : 2),
        m = e.params[0];
      return t
        ? m === 2
          ? f(m, 4)
          : m === 4
            ? f(m, p(o.modes.insertMode))
            : m === 12
              ? f(m, 3)
              : m === 20
                ? f(m, p(d.convertEol))
                : f(m, 0)
        : m === 1
          ? f(m, p(r.applicationCursorKeys))
          : m === 3
            ? f(
                m,
                d.windowOptions.setWinLines
                  ? c === 80
                    ? 2
                    : c === 132
                      ? 1
                      : 0
                  : 0,
              )
            : m === 6
              ? f(m, p(r.origin))
              : m === 7
                ? f(m, p(r.wraparound))
                : m === 8
                  ? f(m, 3)
                  : m === 9
                    ? f(m, p(i === `X10`))
                    : m === 12
                      ? f(m, p(d.cursorBlink))
                      : m === 25
                        ? f(m, p(!o.isCursorHidden))
                        : m === 45
                          ? f(m, p(r.reverseWraparound))
                          : m === 66
                            ? f(m, p(r.applicationKeypad))
                            : m === 67
                              ? f(m, 4)
                              : m === 1e3
                                ? f(m, p(i === `VT200`))
                                : m === 1002
                                  ? f(m, p(i === `DRAG`))
                                  : m === 1003
                                    ? f(m, p(i === `ANY`))
                                    : m === 1004
                                      ? f(m, p(r.sendFocus))
                                      : m === 1005
                                        ? f(m, 4)
                                        : m === 1006
                                          ? f(m, p(a === `SGR`))
                                          : m === 1015
                                            ? f(m, 4)
                                            : m === 1016
                                              ? f(m, p(a === `SGR_PIXELS`))
                                              : m === 1048
                                                ? f(m, 1)
                                                : m === 47 ||
                                                    m === 1047 ||
                                                    m === 1049
                                                  ? f(m, p(l === u))
                                                  : m === 2004
                                                    ? f(
                                                        m,
                                                        p(r.bracketedPasteMode),
                                                      )
                                                    : m === 2026
                                                      ? f(
                                                          m,
                                                          p(
                                                            r.synchronizedOutput,
                                                          ),
                                                        )
                                                      : f(m, 0);
    }
    _updateAttrColor(e, t, n, r, i) {
      return (
        t === 2
          ? ((e |= 50331648),
            (e &= -16777216),
            (e |= Mt.fromColorRGB([n, r, i])))
          : t === 5 && ((e &= -50331904), (e |= 33554432 | (n & 255))),
        e
      );
    }
    _extractColor(e, t, n) {
      let r = [0, 0, -1, 0, 0, 0],
        i = 0,
        a = 0;
      do {
        if (((r[a + i] = e.params[t + a]), e.hasSubParams(t + a))) {
          let n = e.getSubParams(t + a),
            o = 0;
          do (r[1] === 5 && (i = 1), (r[a + o + 1 + i] = n[o]));
          while (++o < n.length && o + a + 1 + i < r.length);
          break;
        }
        if ((r[1] === 5 && a + i >= 2) || (r[1] === 2 && a + i >= 5)) break;
        r[1] && (i = 1);
      } while (++a + t < e.length && a + i < r.length);
      for (let e = 2; e < r.length; ++e) r[e] === -1 && (r[e] = 0);
      switch (r[0]) {
        case 38:
          n.fg = this._updateAttrColor(n.fg, r[1], r[3], r[4], r[5]);
          break;
        case 48:
          n.bg = this._updateAttrColor(n.bg, r[1], r[3], r[4], r[5]);
          break;
        case 58:
          ((n.extended = n.extended.clone()),
            (n.extended.underlineColor = this._updateAttrColor(
              n.extended.underlineColor,
              r[1],
              r[3],
              r[4],
              r[5],
            )));
      }
      return a;
    }
    _processUnderline(e, t) {
      ((t.extended = t.extended.clone()),
        (!~e || e > 5) && (e = 1),
        (t.extended.underlineStyle = e),
        (t.fg |= 268435456),
        e === 0 && (t.fg &= -268435457),
        t.updateExtended());
    }
    _processSGR0(e) {
      ((e.fg = X.fg),
        (e.bg = X.bg),
        (e.extended = e.extended.clone()),
        (e.extended.underlineStyle = 0),
        (e.extended.underlineColor &= -67108864),
        e.updateExtended());
    }
    charAttributes(e) {
      if (e.length === 1 && e.params[0] === 0)
        return (this._processSGR0(this._curAttrData), !0);
      let t = e.length,
        n,
        r = this._curAttrData;
      for (let i = 0; i < t; i++)
        ((n = e.params[i]),
          n >= 30 && n <= 37
            ? ((r.fg &= -50331904), (r.fg |= 16777216 | (n - 30)))
            : n >= 40 && n <= 47
              ? ((r.bg &= -50331904), (r.bg |= 16777216 | (n - 40)))
              : n >= 90 && n <= 97
                ? ((r.fg &= -50331904), (r.fg |= (n - 90) | 16777224))
                : n >= 100 && n <= 107
                  ? ((r.bg &= -50331904), (r.bg |= (n - 100) | 16777224))
                  : n === 0
                    ? this._processSGR0(r)
                    : n === 1
                      ? (r.fg |= 134217728)
                      : n === 3
                        ? (r.bg |= 67108864)
                        : n === 4
                          ? ((r.fg |= 268435456),
                            this._processUnderline(
                              e.hasSubParams(i) ? e.getSubParams(i)[0] : 1,
                              r,
                            ))
                          : n === 5
                            ? (r.fg |= 536870912)
                            : n === 7
                              ? (r.fg |= 67108864)
                              : n === 8
                                ? (r.fg |= 1073741824)
                                : n === 9
                                  ? (r.fg |= 2147483648)
                                  : n === 2
                                    ? (r.bg |= 134217728)
                                    : n === 21
                                      ? this._processUnderline(2, r)
                                      : n === 22
                                        ? ((r.fg &= -134217729),
                                          (r.bg &= -134217729))
                                        : n === 23
                                          ? (r.bg &= -67108865)
                                          : n === 24
                                            ? ((r.fg &= -268435457),
                                              this._processUnderline(0, r))
                                            : n === 25
                                              ? (r.fg &= -536870913)
                                              : n === 27
                                                ? (r.fg &= -67108865)
                                                : n === 28
                                                  ? (r.fg &= -1073741825)
                                                  : n === 29
                                                    ? (r.fg &= 2147483647)
                                                    : n === 39
                                                      ? ((r.fg &= -67108864),
                                                        (r.fg |=
                                                          X.fg & 16777215))
                                                      : n === 49
                                                        ? ((r.bg &= -67108864),
                                                          (r.bg |=
                                                            X.bg & 16777215))
                                                        : n === 38 ||
                                                            n === 48 ||
                                                            n === 58
                                                          ? (i +=
                                                              this._extractColor(
                                                                e,
                                                                i,
                                                                r,
                                                              ))
                                                          : n === 53
                                                            ? (r.bg |= 1073741824)
                                                            : n === 55
                                                              ? (r.bg &=
                                                                  -1073741825)
                                                              : n === 59
                                                                ? ((r.extended =
                                                                    r.extended.clone()),
                                                                  (r.extended.underlineColor =
                                                                    -1),
                                                                  r.updateExtended())
                                                                : n === 100
                                                                  ? ((r.fg &=
                                                                      -67108864),
                                                                    (r.fg |=
                                                                      X.fg &
                                                                      16777215),
                                                                    (r.bg &=
                                                                      -67108864),
                                                                    (r.bg |=
                                                                      X.bg &
                                                                      16777215))
                                                                  : this._logService.debug(
                                                                      `Unknown SGR attribute: %d.`,
                                                                      n,
                                                                    ));
      return !0;
    }
    deviceStatus(e) {
      switch (e.params[0]) {
        case 5:
          this._coreService.triggerDataEvent(`${B.ESC}[0n`);
          break;
        case 6:
          let e = this._activeBuffer.y + 1,
            t = this._activeBuffer.x + 1;
          this._coreService.triggerDataEvent(`${B.ESC}[${e};${t}R`);
          break;
      }
      return !0;
    }
    deviceStatusPrivate(e) {
      switch (e.params[0]) {
        case 6:
          let e = this._activeBuffer.y + 1,
            t = this._activeBuffer.x + 1;
          this._coreService.triggerDataEvent(`${B.ESC}[?${e};${t}R`);
          break;
        case 15:
          break;
        case 25:
          break;
        case 26:
          break;
        case 53:
          break;
      }
      return !0;
    }
    softReset(e) {
      return (
        (this._coreService.isCursorHidden = !1),
        this._onRequestSyncScrollBar.fire(),
        (this._activeBuffer.scrollTop = 0),
        (this._activeBuffer.scrollBottom = this._bufferService.rows - 1),
        (this._curAttrData = X.clone()),
        this._coreService.reset(),
        this._charsetService.reset(),
        (this._activeBuffer.savedX = 0),
        (this._activeBuffer.savedY = this._activeBuffer.ybase),
        (this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg),
        (this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg),
        (this._activeBuffer.savedCharset = this._charsetService.charset),
        (this._coreService.decPrivateModes.origin = !1),
        !0
      );
    }
    setCursorStyle(e) {
      let t = e.length === 0 ? 1 : e.params[0];
      if (t === 0)
        ((this._coreService.decPrivateModes.cursorStyle = void 0),
          (this._coreService.decPrivateModes.cursorBlink = void 0));
      else {
        switch (t) {
          case 1:
          case 2:
            this._coreService.decPrivateModes.cursorStyle = `block`;
            break;
          case 3:
          case 4:
            this._coreService.decPrivateModes.cursorStyle = `underline`;
            break;
          case 5:
          case 6:
            this._coreService.decPrivateModes.cursorStyle = `bar`;
            break;
        }
        let e = t % 2 == 1;
        this._coreService.decPrivateModes.cursorBlink = e;
      }
      return !0;
    }
    setScrollRegion(e) {
      let t = e.params[0] || 1,
        n;
      return (
        (e.length < 2 ||
          (n = e.params[1]) > this._bufferService.rows ||
          n === 0) &&
          (n = this._bufferService.rows),
        n > t &&
          ((this._activeBuffer.scrollTop = t - 1),
          (this._activeBuffer.scrollBottom = n - 1),
          this._setCursor(0, 0)),
        !0
      );
    }
    windowOptions(e) {
      if (!Pc(e.params[0], this._optionsService.rawOptions.windowOptions))
        return !0;
      let t = e.length > 1 ? e.params[1] : 0;
      switch (e.params[0]) {
        case 14:
          t !== 2 && this._onRequestWindowsOptionsReport.fire(0);
          break;
        case 16:
          this._onRequestWindowsOptionsReport.fire(1);
          break;
        case 18:
          this._bufferService &&
            this._coreService.triggerDataEvent(
              `${B.ESC}[8;${this._bufferService.rows};${this._bufferService.cols}t`,
            );
          break;
        case 22:
          ((t === 0 || t === 2) &&
            (this._windowTitleStack.push(this._windowTitle),
            this._windowTitleStack.length > Nc &&
              this._windowTitleStack.shift()),
            (t === 0 || t === 1) &&
              (this._iconNameStack.push(this._iconName),
              this._iconNameStack.length > Nc && this._iconNameStack.shift()));
          break;
        case 23:
          ((t === 0 || t === 2) &&
            this._windowTitleStack.length &&
            this.setTitle(this._windowTitleStack.pop()),
            (t === 0 || t === 1) &&
              this._iconNameStack.length &&
              this.setIconName(this._iconNameStack.pop()));
          break;
      }
      return !0;
    }
    saveCursor(e) {
      return (
        (this._activeBuffer.savedX = this._activeBuffer.x),
        (this._activeBuffer.savedY =
          this._activeBuffer.ybase + this._activeBuffer.y),
        (this._activeBuffer.savedCurAttrData.fg = this._curAttrData.fg),
        (this._activeBuffer.savedCurAttrData.bg = this._curAttrData.bg),
        (this._activeBuffer.savedCharset = this._charsetService.charset),
        !0
      );
    }
    restoreCursor(e) {
      return (
        (this._activeBuffer.x = this._activeBuffer.savedX || 0),
        (this._activeBuffer.y = Math.max(
          this._activeBuffer.savedY - this._activeBuffer.ybase,
          0,
        )),
        (this._curAttrData.fg = this._activeBuffer.savedCurAttrData.fg),
        (this._curAttrData.bg = this._activeBuffer.savedCurAttrData.bg),
        (this._charsetService.charset = this._savedCharset),
        this._activeBuffer.savedCharset &&
          (this._charsetService.charset = this._activeBuffer.savedCharset),
        this._restrictCursor(),
        !0
      );
    }
    setTitle(e) {
      return ((this._windowTitle = e), this._onTitleChange.fire(e), !0);
    }
    setIconName(e) {
      return ((this._iconName = e), !0);
    }
    setOrReportIndexedColor(e) {
      let t = [],
        n = e.split(`;`);
      for (; n.length > 1; ) {
        let e = n.shift(),
          r = n.shift();
        if (/^\d+$/.exec(e)) {
          let n = parseInt(e);
          if (zc(n))
            if (r === `?`) t.push({ type: 0, index: n });
            else {
              let e = Oc(r);
              e && t.push({ type: 1, index: n, color: e });
            }
        }
      }
      return (t.length && this._onColor.fire(t), !0);
    }
    setHyperlink(e) {
      let t = e.indexOf(`;`);
      if (t === -1) return !0;
      let n = e.slice(0, t).trim(),
        r = e.slice(t + 1);
      return r
        ? this._createHyperlink(n, r)
        : n.trim()
          ? !1
          : this._finishHyperlink();
    }
    _createHyperlink(e, t) {
      this._getCurrentLinkId() && this._finishHyperlink();
      let n = e.split(`:`),
        r,
        i = n.findIndex((e) => e.startsWith(`id=`));
      return (
        i !== -1 && (r = n[i].slice(3) || void 0),
        (this._curAttrData.extended = this._curAttrData.extended.clone()),
        (this._curAttrData.extended.urlId = this._oscLinkService.registerLink({
          id: r,
          uri: t,
        })),
        this._curAttrData.updateExtended(),
        !0
      );
    }
    _finishHyperlink() {
      return (
        (this._curAttrData.extended = this._curAttrData.extended.clone()),
        (this._curAttrData.extended.urlId = 0),
        this._curAttrData.updateExtended(),
        !0
      );
    }
    _setOrReportSpecialColor(e, t) {
      let n = e.split(`;`);
      for (
        let e = 0;
        e < n.length && !(t >= this._specialColors.length);
        ++e, ++t
      )
        if (n[e] === `?`)
          this._onColor.fire([{ type: 0, index: this._specialColors[t] }]);
        else {
          let r = Oc(n[e]);
          r &&
            this._onColor.fire([
              { type: 1, index: this._specialColors[t], color: r },
            ]);
        }
      return !0;
    }
    setOrReportFgColor(e) {
      return this._setOrReportSpecialColor(e, 0);
    }
    setOrReportBgColor(e) {
      return this._setOrReportSpecialColor(e, 1);
    }
    setOrReportCursorColor(e) {
      return this._setOrReportSpecialColor(e, 2);
    }
    restoreIndexedColor(e) {
      if (!e) return (this._onColor.fire([{ type: 2 }]), !0);
      let t = [],
        n = e.split(`;`);
      for (let e = 0; e < n.length; ++e)
        if (/^\d+$/.exec(n[e])) {
          let r = parseInt(n[e]);
          zc(r) && t.push({ type: 2, index: r });
        }
      return (t.length && this._onColor.fire(t), !0);
    }
    restoreFgColor(e) {
      return (this._onColor.fire([{ type: 2, index: 256 }]), !0);
    }
    restoreBgColor(e) {
      return (this._onColor.fire([{ type: 2, index: 257 }]), !0);
    }
    restoreCursorColor(e) {
      return (this._onColor.fire([{ type: 2, index: 258 }]), !0);
    }
    nextLine() {
      return ((this._activeBuffer.x = 0), this.index(), !0);
    }
    keypadApplicationMode() {
      return (
        this._logService.debug(`Serial port requested application keypad.`),
        (this._coreService.decPrivateModes.applicationKeypad = !0),
        this._onRequestSyncScrollBar.fire(),
        !0
      );
    }
    keypadNumericMode() {
      return (
        this._logService.debug(`Switching back to normal keypad.`),
        (this._coreService.decPrivateModes.applicationKeypad = !1),
        this._onRequestSyncScrollBar.fire(),
        !0
      );
    }
    selectDefaultCharset() {
      return (
        this._charsetService.setgLevel(0),
        this._charsetService.setgCharset(0, zs),
        !0
      );
    }
    selectCharset(e) {
      return e.length === 2
        ? (e[0] === `/` ||
            this._charsetService.setgCharset(jc[e[0]], Z[e[1]] || zs),
          !0)
        : (this.selectDefaultCharset(), !0);
    }
    index() {
      return (
        this._restrictCursor(),
        this._activeBuffer.y++,
        this._activeBuffer.y === this._activeBuffer.scrollBottom + 1
          ? (this._activeBuffer.y--,
            this._bufferService.scroll(this._eraseAttrData()))
          : this._activeBuffer.y >= this._bufferService.rows &&
            (this._activeBuffer.y = this._bufferService.rows - 1),
        this._restrictCursor(),
        !0
      );
    }
    tabSet() {
      return ((this._activeBuffer.tabs[this._activeBuffer.x] = !0), !0);
    }
    reverseIndex() {
      if (
        (this._restrictCursor(),
        this._activeBuffer.y === this._activeBuffer.scrollTop)
      ) {
        let e = this._activeBuffer.scrollBottom - this._activeBuffer.scrollTop;
        (this._activeBuffer.lines.shiftElements(
          this._activeBuffer.ybase + this._activeBuffer.y,
          e,
          1,
        ),
          this._activeBuffer.lines.set(
            this._activeBuffer.ybase + this._activeBuffer.y,
            this._activeBuffer.getBlankLine(this._eraseAttrData()),
          ),
          this._dirtyRowTracker.markRangeDirty(
            this._activeBuffer.scrollTop,
            this._activeBuffer.scrollBottom,
          ));
      } else (this._activeBuffer.y--, this._restrictCursor());
      return !0;
    }
    fullReset() {
      return (this._parser.reset(), this._onRequestReset.fire(), !0);
    }
    reset() {
      ((this._curAttrData = X.clone()),
        (this._eraseAttrDataInternal = X.clone()));
    }
    _eraseAttrData() {
      return (
        (this._eraseAttrDataInternal.bg &= -67108864),
        (this._eraseAttrDataInternal.bg |= this._curAttrData.bg & 67108863),
        this._eraseAttrDataInternal
      );
    }
    setgLevel(e) {
      return (this._charsetService.setgLevel(e), !0);
    }
    screenAlignmentPattern() {
      let e = new Pt();
      ((e.content = 4194373),
        (e.fg = this._curAttrData.fg),
        (e.bg = this._curAttrData.bg),
        this._setCursor(0, 0));
      for (let t = 0; t < this._bufferService.rows; ++t) {
        let n = this._activeBuffer.ybase + this._activeBuffer.y + t,
          r = this._activeBuffer.lines.get(n);
        r && (r.fill(e), (r.isWrapped = !1));
      }
      return (this._dirtyRowTracker.markAllDirty(), this._setCursor(0, 0), !0);
    }
    requestStatusString(e, t) {
      let n = (e) => (
          this._coreService.triggerDataEvent(`${B.ESC}${e}${B.ESC}\\`),
          !0
        ),
        r = this._bufferService.buffer,
        i = this._optionsService.rawOptions;
      return n(
        e === `"q`
          ? `P1$r${this._curAttrData.isProtected() ? 1 : 0}"q`
          : e === `"p`
            ? `P1$r61;1"p`
            : e === `r`
              ? `P1$r${r.scrollTop + 1};${r.scrollBottom + 1}r`
              : e === `m`
                ? `P1$r0m`
                : e === ` q`
                  ? `P1$r${{ block: 2, underline: 4, bar: 6 }[i.cursorStyle] - (i.cursorBlink ? 1 : 0)} q`
                  : `P0$r`,
      );
    }
    markRangeDirty(e, t) {
      this._dirtyRowTracker.markRangeDirty(e, t);
    }
  },
  Rc = class {
    constructor(e) {
      ((this._bufferService = e), this.clearRange());
    }
    clearRange() {
      ((this.start = this._bufferService.buffer.y),
        (this.end = this._bufferService.buffer.y));
    }
    markDirty(e) {
      e < this.start ? (this.start = e) : e > this.end && (this.end = e);
    }
    markRangeDirty(e, t) {
      (e > t && ((Ic = e), (e = t), (t = Ic)),
        e < this.start && (this.start = e),
        t > this.end && (this.end = t));
    }
    markAllDirty() {
      this.markRangeDirty(0, this._bufferService.rows - 1);
    }
  };
Rc = j([M(0, Bt)], Rc);
function zc(e) {
  return 0 <= e && e < 256;
}
var Bc = 5e7,
  Vc = 12,
  Hc = 50,
  Uc = class extends F {
    constructor(e) {
      (super(),
        (this._action = e),
        (this._writeBuffer = []),
        (this._callbacks = []),
        (this._pendingData = 0),
        (this._bufferOffset = 0),
        (this._isSyncWriting = !1),
        (this._syncCalls = 0),
        (this._didUserInput = !1),
        (this._onWriteParsed = this._register(new L())),
        (this.onWriteParsed = this._onWriteParsed.event));
    }
    handleUserInput() {
      this._didUserInput = !0;
    }
    writeSync(e, t) {
      if (t !== void 0 && this._syncCalls > t) {
        this._syncCalls = 0;
        return;
      }
      if (
        ((this._pendingData += e.length),
        this._writeBuffer.push(e),
        this._callbacks.push(void 0),
        this._syncCalls++,
        this._isSyncWriting)
      )
        return;
      this._isSyncWriting = !0;
      let n;
      for (; (n = this._writeBuffer.shift()); ) {
        this._action(n);
        let e = this._callbacks.shift();
        e && e();
      }
      ((this._pendingData = 0),
        (this._bufferOffset = 2147483647),
        (this._isSyncWriting = !1),
        (this._syncCalls = 0));
    }
    write(e, t) {
      if (this._pendingData > Bc)
        throw Error(
          `write data discarded, use flow control to avoid losing data`,
        );
      if (!this._writeBuffer.length) {
        if (((this._bufferOffset = 0), this._didUserInput)) {
          ((this._didUserInput = !1),
            (this._pendingData += e.length),
            this._writeBuffer.push(e),
            this._callbacks.push(t),
            this._innerWrite());
          return;
        }
        setTimeout(() => this._innerWrite());
      }
      ((this._pendingData += e.length),
        this._writeBuffer.push(e),
        this._callbacks.push(t));
    }
    _innerWrite(e = 0, t = !0) {
      let n = e || performance.now();
      for (; this._writeBuffer.length > this._bufferOffset; ) {
        let e = this._writeBuffer[this._bufferOffset],
          r = this._action(e, t);
        if (r) {
          r.catch(
            (e) => (
              queueMicrotask(() => {
                throw e;
              }),
              Promise.resolve(!1)
            ),
          ).then((e) =>
            performance.now() - n >= Vc
              ? setTimeout(() => this._innerWrite(0, e))
              : this._innerWrite(n, e),
          );
          return;
        }
        let i = this._callbacks[this._bufferOffset];
        if (
          (i && i(),
          this._bufferOffset++,
          (this._pendingData -= e.length),
          performance.now() - n >= Vc)
        )
          break;
      }
      (this._writeBuffer.length > this._bufferOffset
        ? (this._bufferOffset > Hc &&
            ((this._writeBuffer = this._writeBuffer.slice(this._bufferOffset)),
            (this._callbacks = this._callbacks.slice(this._bufferOffset)),
            (this._bufferOffset = 0)),
          setTimeout(() => this._innerWrite()))
        : ((this._writeBuffer.length = 0),
          (this._callbacks.length = 0),
          (this._pendingData = 0),
          (this._bufferOffset = 0)),
        this._onWriteParsed.fire());
    }
  },
  Wc = class {
    constructor(e) {
      ((this._bufferService = e),
        (this._nextId = 1),
        (this._entriesWithId = new Map()),
        (this._dataByLinkId = new Map()));
    }
    registerLink(e) {
      let t = this._bufferService.buffer;
      if (e.id === void 0) {
        let n = t.addMarker(t.ybase + t.y),
          r = { data: e, id: this._nextId++, lines: [n] };
        return (
          n.onDispose(() => this._removeMarkerFromLink(r, n)),
          this._dataByLinkId.set(r.id, r),
          r.id
        );
      }
      let n = e,
        r = this._getEntryIdKey(n),
        i = this._entriesWithId.get(r);
      if (i) return (this.addLineToLink(i.id, t.ybase + t.y), i.id);
      let a = t.addMarker(t.ybase + t.y),
        o = {
          id: this._nextId++,
          key: this._getEntryIdKey(n),
          data: n,
          lines: [a],
        };
      return (
        a.onDispose(() => this._removeMarkerFromLink(o, a)),
        this._entriesWithId.set(o.key, o),
        this._dataByLinkId.set(o.id, o),
        o.id
      );
    }
    addLineToLink(e, t) {
      let n = this._dataByLinkId.get(e);
      if (n && n.lines.every((e) => e.line !== t)) {
        let e = this._bufferService.buffer.addMarker(t);
        (n.lines.push(e), e.onDispose(() => this._removeMarkerFromLink(n, e)));
      }
    }
    getLinkData(e) {
      return this._dataByLinkId.get(e)?.data;
    }
    _getEntryIdKey(e) {
      return `${e.id};;${e.uri}`;
    }
    _removeMarkerFromLink(e, t) {
      let n = e.lines.indexOf(t);
      n !== -1 &&
        (e.lines.splice(n, 1),
        e.lines.length === 0 &&
          (e.data.id !== void 0 && this._entriesWithId.delete(e.key),
          this._dataByLinkId.delete(e.id)));
    }
  };
Wc = j([M(0, Bt)], Wc);
var Gc = !1,
  Kc = class extends F {
    constructor(e) {
      (super(),
        (this._windowsWrappingHeuristics = this._register(new zn())),
        (this._onBinary = this._register(new L())),
        (this.onBinary = this._onBinary.event),
        (this._onData = this._register(new L())),
        (this.onData = this._onData.event),
        (this._onLineFeed = this._register(new L())),
        (this.onLineFeed = this._onLineFeed.event),
        (this._onResize = this._register(new L())),
        (this.onResize = this._onResize.event),
        (this._onWriteParsed = this._register(new L())),
        (this.onWriteParsed = this._onWriteParsed.event),
        (this._onScroll = this._register(new L())),
        (this._instantiationService = new Cs()),
        (this.optionsService = this._register(new Js(e))),
        this._instantiationService.setService(Kt, this.optionsService),
        (this._bufferService = this._register(
          this._instantiationService.createInstance(Gs),
        )),
        this._instantiationService.setService(Bt, this._bufferService),
        (this._logService = this._register(
          this._instantiationService.createInstance(Es),
        )),
        this._instantiationService.setService(Gt, this._logService),
        (this.coreService = this._register(
          this._instantiationService.createInstance($s),
        )),
        this._instantiationService.setService(Ht, this.coreService),
        (this.coreMouseService = this._register(
          this._instantiationService.createInstance(ic),
        )),
        this._instantiationService.setService(Vt, this.coreMouseService),
        (this.unicodeService = this._register(
          this._instantiationService.createInstance(lc),
        )),
        this._instantiationService.setService(Jt, this.unicodeService),
        (this._charsetService = this._instantiationService.createInstance(uc)),
        this._instantiationService.setService(Ut, this._charsetService),
        (this._oscLinkService = this._instantiationService.createInstance(Wc)),
        this._instantiationService.setService(qt, this._oscLinkService),
        (this._inputHandler = this._register(
          new Lc(
            this._bufferService,
            this._charsetService,
            this.coreService,
            this._logService,
            this.optionsService,
            this._oscLinkService,
            this.coreMouseService,
            this.unicodeService,
          ),
        )),
        this._register(
          Jn.forward(this._inputHandler.onLineFeed, this._onLineFeed),
        ),
        this._register(this._inputHandler),
        this._register(
          Jn.forward(this._bufferService.onResize, this._onResize),
        ),
        this._register(Jn.forward(this.coreService.onData, this._onData)),
        this._register(Jn.forward(this.coreService.onBinary, this._onBinary)),
        this._register(
          this.coreService.onRequestScrollToBottom(() =>
            this.scrollToBottom(!0),
          ),
        ),
        this._register(
          this.coreService.onUserInput(() =>
            this._writeBuffer.handleUserInput(),
          ),
        ),
        this._register(
          this.optionsService.onMultipleOptionChange(
            [`windowsMode`, `windowsPty`],
            () => this._handleWindowsPtyOptionChange(),
          ),
        ),
        this._register(
          this._bufferService.onScroll(() => {
            (this._onScroll.fire({
              position: this._bufferService.buffer.ydisp,
            }),
              this._inputHandler.markRangeDirty(
                this._bufferService.buffer.scrollTop,
                this._bufferService.buffer.scrollBottom,
              ));
          }),
        ),
        (this._writeBuffer = this._register(
          new Uc((e, t) => this._inputHandler.parse(e, t)),
        )),
        this._register(
          Jn.forward(this._writeBuffer.onWriteParsed, this._onWriteParsed),
        ));
    }
    get onScroll() {
      return (
        this._onScrollApi ||
          ((this._onScrollApi = this._register(new L())),
          this._onScroll.event((e) => {
            this._onScrollApi?.fire(e.position);
          })),
        this._onScrollApi.event
      );
    }
    get cols() {
      return this._bufferService.cols;
    }
    get rows() {
      return this._bufferService.rows;
    }
    get buffers() {
      return this._bufferService.buffers;
    }
    get options() {
      return this.optionsService.options;
    }
    set options(e) {
      for (let t in e) this.optionsService.options[t] = e[t];
    }
    write(e, t) {
      this._writeBuffer.write(e, t);
    }
    writeSync(e, t) {
      (this._logService.logLevel <= 3 &&
        !Gc &&
        (this._logService.warn(
          `writeSync is unreliable and will be removed soon.`,
        ),
        (Gc = !0)),
        this._writeBuffer.writeSync(e, t));
    }
    input(e, t = !0) {
      this.coreService.triggerDataEvent(e, t);
    }
    resize(e, t) {
      isNaN(e) ||
        isNaN(t) ||
        ((e = Math.max(e, Us)),
        (t = Math.max(t, Ws)),
        this._bufferService.resize(e, t));
    }
    scroll(e, t = !1) {
      this._bufferService.scroll(e, t);
    }
    scrollLines(e, t) {
      this._bufferService.scrollLines(e, t);
    }
    scrollPages(e) {
      this.scrollLines(e * (this.rows - 1));
    }
    scrollToTop() {
      this.scrollLines(-this._bufferService.buffer.ydisp);
    }
    scrollToBottom(e) {
      this.scrollLines(
        this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp,
      );
    }
    scrollToLine(e) {
      let t = e - this._bufferService.buffer.ydisp;
      t !== 0 && this.scrollLines(t);
    }
    registerEscHandler(e, t) {
      return this._inputHandler.registerEscHandler(e, t);
    }
    registerDcsHandler(e, t) {
      return this._inputHandler.registerDcsHandler(e, t);
    }
    registerCsiHandler(e, t) {
      return this._inputHandler.registerCsiHandler(e, t);
    }
    registerOscHandler(e, t) {
      return this._inputHandler.registerOscHandler(e, t);
    }
    _setup() {
      this._handleWindowsPtyOptionChange();
    }
    reset() {
      (this._inputHandler.reset(),
        this._bufferService.reset(),
        this._charsetService.reset(),
        this.coreService.reset(),
        this.coreMouseService.reset());
    }
    _handleWindowsPtyOptionChange() {
      let e = !1,
        t = this.optionsService.rawOptions.windowsPty;
      (t && t.buildNumber !== void 0 && t.buildNumber !== void 0
        ? (e = t.backend === `conpty` && t.buildNumber < 21376)
        : this.optionsService.rawOptions.windowsMode && (e = !0),
        e
          ? this._enableWindowsWrappingHeuristics()
          : this._windowsWrappingHeuristics.clear());
    }
    _enableWindowsWrappingHeuristics() {
      if (!this._windowsWrappingHeuristics.value) {
        let e = [];
        (e.push(this.onLineFeed(dc.bind(null, this._bufferService))),
          e.push(
            this.registerCsiHandler(
              { final: `H` },
              () => (dc(this._bufferService), !1),
            ),
          ),
          (this._windowsWrappingHeuristics.value = P(() => {
            for (let t of e) t.dispose();
          })));
      }
    }
  },
  qc = {
    48: [`0`, `)`],
    49: [`1`, `!`],
    50: [`2`, `@`],
    51: [`3`, `#`],
    52: [`4`, `$`],
    53: [`5`, `%`],
    54: [`6`, `^`],
    55: [`7`, `&`],
    56: [`8`, `*`],
    57: [`9`, `(`],
    186: [`;`, `:`],
    187: [`=`, `+`],
    188: [`,`, `<`],
    189: [`-`, `_`],
    190: [`.`, `>`],
    191: [`/`, `?`],
    192: ["`", `~`],
    219: [`[`, `{`],
    220: [`\\`, `|`],
    221: [`]`, `}`],
    222: [`'`, `"`],
  };
function Jc(e, t, n, r) {
  let i = { type: 0, cancel: !1, key: void 0 },
    a =
      (e.shiftKey ? 1 : 0) |
      (e.altKey ? 2 : 0) |
      (e.ctrlKey ? 4 : 0) |
      (e.metaKey ? 8 : 0);
  switch (e.keyCode) {
    case 0:
      e.key === `UIKeyInputUpArrow`
        ? t
          ? (i.key = B.ESC + `OA`)
          : (i.key = B.ESC + `[A`)
        : e.key === `UIKeyInputLeftArrow`
          ? t
            ? (i.key = B.ESC + `OD`)
            : (i.key = B.ESC + `[D`)
          : e.key === `UIKeyInputRightArrow`
            ? t
              ? (i.key = B.ESC + `OC`)
              : (i.key = B.ESC + `[C`)
            : e.key === `UIKeyInputDownArrow` &&
              (t ? (i.key = B.ESC + `OB`) : (i.key = B.ESC + `[B`));
      break;
    case 8:
      ((i.key = e.ctrlKey ? `\b` : B.DEL), e.altKey && (i.key = B.ESC + i.key));
      break;
    case 9:
      if (e.shiftKey) {
        i.key = B.ESC + `[Z`;
        break;
      }
      ((i.key = B.HT), (i.cancel = !0));
      break;
    case 13:
      ((i.key = e.altKey ? B.ESC + B.CR : B.CR), (i.cancel = !0));
      break;
    case 27:
      ((i.key = B.ESC), e.altKey && (i.key = B.ESC + B.ESC), (i.cancel = !0));
      break;
    case 37:
      if (e.metaKey) break;
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `D`)
        : t
          ? (i.key = B.ESC + `OD`)
          : (i.key = B.ESC + `[D`);
      break;
    case 39:
      if (e.metaKey) break;
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `C`)
        : t
          ? (i.key = B.ESC + `OC`)
          : (i.key = B.ESC + `[C`);
      break;
    case 38:
      if (e.metaKey) break;
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `A`)
        : t
          ? (i.key = B.ESC + `OA`)
          : (i.key = B.ESC + `[A`);
      break;
    case 40:
      if (e.metaKey) break;
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `B`)
        : t
          ? (i.key = B.ESC + `OB`)
          : (i.key = B.ESC + `[B`);
      break;
    case 45:
      !e.shiftKey && !e.ctrlKey && (i.key = B.ESC + `[2~`);
      break;
    case 46:
      a ? (i.key = B.ESC + `[3;` + (a + 1) + `~`) : (i.key = B.ESC + `[3~`);
      break;
    case 36:
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `H`)
        : t
          ? (i.key = B.ESC + `OH`)
          : (i.key = B.ESC + `[H`);
      break;
    case 35:
      a
        ? (i.key = B.ESC + `[1;` + (a + 1) + `F`)
        : t
          ? (i.key = B.ESC + `OF`)
          : (i.key = B.ESC + `[F`);
      break;
    case 33:
      e.shiftKey
        ? (i.type = 2)
        : e.ctrlKey
          ? (i.key = B.ESC + `[5;` + (a + 1) + `~`)
          : (i.key = B.ESC + `[5~`);
      break;
    case 34:
      e.shiftKey
        ? (i.type = 3)
        : e.ctrlKey
          ? (i.key = B.ESC + `[6;` + (a + 1) + `~`)
          : (i.key = B.ESC + `[6~`);
      break;
    case 112:
      a ? (i.key = B.ESC + `[1;` + (a + 1) + `P`) : (i.key = B.ESC + `OP`);
      break;
    case 113:
      a ? (i.key = B.ESC + `[1;` + (a + 1) + `Q`) : (i.key = B.ESC + `OQ`);
      break;
    case 114:
      a ? (i.key = B.ESC + `[1;` + (a + 1) + `R`) : (i.key = B.ESC + `OR`);
      break;
    case 115:
      a ? (i.key = B.ESC + `[1;` + (a + 1) + `S`) : (i.key = B.ESC + `OS`);
      break;
    case 116:
      a ? (i.key = B.ESC + `[15;` + (a + 1) + `~`) : (i.key = B.ESC + `[15~`);
      break;
    case 117:
      a ? (i.key = B.ESC + `[17;` + (a + 1) + `~`) : (i.key = B.ESC + `[17~`);
      break;
    case 118:
      a ? (i.key = B.ESC + `[18;` + (a + 1) + `~`) : (i.key = B.ESC + `[18~`);
      break;
    case 119:
      a ? (i.key = B.ESC + `[19;` + (a + 1) + `~`) : (i.key = B.ESC + `[19~`);
      break;
    case 120:
      a ? (i.key = B.ESC + `[20;` + (a + 1) + `~`) : (i.key = B.ESC + `[20~`);
      break;
    case 121:
      a ? (i.key = B.ESC + `[21;` + (a + 1) + `~`) : (i.key = B.ESC + `[21~`);
      break;
    case 122:
      a ? (i.key = B.ESC + `[23;` + (a + 1) + `~`) : (i.key = B.ESC + `[23~`);
      break;
    case 123:
      a ? (i.key = B.ESC + `[24;` + (a + 1) + `~`) : (i.key = B.ESC + `[24~`);
      break;
    default:
      if (e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey)
        e.keyCode >= 65 && e.keyCode <= 90
          ? (i.key = String.fromCharCode(e.keyCode - 64))
          : e.keyCode === 32
            ? (i.key = B.NUL)
            : e.keyCode >= 51 && e.keyCode <= 55
              ? (i.key = String.fromCharCode(e.keyCode - 51 + 27))
              : e.keyCode === 56
                ? (i.key = B.DEL)
                : e.keyCode === 219
                  ? (i.key = B.ESC)
                  : e.keyCode === 220
                    ? (i.key = B.FS)
                    : e.keyCode === 221 && (i.key = B.GS);
      else if ((!n || r) && e.altKey && !e.metaKey) {
        let t = qc[e.keyCode]?.[e.shiftKey ? 1 : 0];
        if (t) i.key = B.ESC + t;
        else if (e.keyCode >= 65 && e.keyCode <= 90) {
          let t = e.ctrlKey ? e.keyCode - 64 : e.keyCode + 32,
            n = String.fromCharCode(t);
          (e.shiftKey && (n = n.toUpperCase()), (i.key = B.ESC + n));
        } else if (e.keyCode === 32) i.key = B.ESC + (e.ctrlKey ? B.NUL : ` `);
        else if (e.key === `Dead` && e.code.startsWith(`Key`)) {
          let t = e.code.slice(3, 4);
          (e.shiftKey || (t = t.toLowerCase()),
            (i.key = B.ESC + t),
            (i.cancel = !0));
        }
      } else
        n && !e.altKey && !e.ctrlKey && !e.shiftKey && e.metaKey
          ? e.keyCode === 65 && (i.type = 1)
          : e.key &&
              !e.ctrlKey &&
              !e.altKey &&
              !e.metaKey &&
              e.keyCode >= 48 &&
              e.key.length === 1
            ? (i.key = e.key)
            : e.key &&
              e.ctrlKey &&
              (e.key === `_` && (i.key = B.US),
              e.key === `@` && (i.key = B.NUL));
      break;
  }
  return i;
}
var $ = 0,
  Yc = class {
    constructor(e) {
      ((this._getKey = e),
        (this._array = []),
        (this._insertedValues = []),
        (this._flushInsertedTask = new Ho()),
        (this._isFlushingInserted = !1),
        (this._deletedIndices = []),
        (this._flushDeletedTask = new Ho()),
        (this._isFlushingDeleted = !1));
    }
    clear() {
      ((this._array.length = 0),
        (this._insertedValues.length = 0),
        this._flushInsertedTask.clear(),
        (this._isFlushingInserted = !1),
        (this._deletedIndices.length = 0),
        this._flushDeletedTask.clear(),
        (this._isFlushingDeleted = !1));
    }
    insert(e) {
      (this._flushCleanupDeleted(),
        this._insertedValues.length === 0 &&
          this._flushInsertedTask.enqueue(() => this._flushInserted()),
        this._insertedValues.push(e));
    }
    _flushInserted() {
      let e = this._insertedValues.sort(
          (e, t) => this._getKey(e) - this._getKey(t),
        ),
        t = 0,
        n = 0,
        r = Array(this._array.length + this._insertedValues.length);
      for (let i = 0; i < r.length; i++)
        n >= this._array.length ||
        this._getKey(e[t]) <= this._getKey(this._array[n])
          ? ((r[i] = e[t]), t++)
          : (r[i] = this._array[n++]);
      ((this._array = r), (this._insertedValues.length = 0));
    }
    _flushCleanupInserted() {
      !this._isFlushingInserted &&
        this._insertedValues.length > 0 &&
        this._flushInsertedTask.flush();
    }
    delete(e) {
      if ((this._flushCleanupInserted(), this._array.length === 0)) return !1;
      let t = this._getKey(e);
      if (
        t === void 0 ||
        (($ = this._search(t)), $ === -1) ||
        this._getKey(this._array[$]) !== t
      )
        return !1;
      do
        if (this._array[$] === e)
          return (
            this._deletedIndices.length === 0 &&
              this._flushDeletedTask.enqueue(() => this._flushDeleted()),
            this._deletedIndices.push($),
            !0
          );
      while (++$ < this._array.length && this._getKey(this._array[$]) === t);
      return !1;
    }
    _flushDeleted() {
      this._isFlushingDeleted = !0;
      let e = this._deletedIndices.sort((e, t) => e - t),
        t = 0,
        n = Array(this._array.length - e.length),
        r = 0;
      for (let i = 0; i < this._array.length; i++)
        e[t] === i ? t++ : (n[r++] = this._array[i]);
      ((this._array = n),
        (this._deletedIndices.length = 0),
        (this._isFlushingDeleted = !1));
    }
    _flushCleanupDeleted() {
      !this._isFlushingDeleted &&
        this._deletedIndices.length > 0 &&
        this._flushDeletedTask.flush();
    }
    *getKeyIterator(e) {
      if (
        (this._flushCleanupInserted(),
        this._flushCleanupDeleted(),
        this._array.length !== 0 &&
          (($ = this._search(e)),
          !($ < 0 || $ >= this._array.length) &&
            this._getKey(this._array[$]) === e))
      )
        do yield this._array[$];
        while (++$ < this._array.length && this._getKey(this._array[$]) === e);
    }
    forEachByKey(e, t) {
      if (
        (this._flushCleanupInserted(),
        this._flushCleanupDeleted(),
        this._array.length !== 0 &&
          (($ = this._search(e)),
          !($ < 0 || $ >= this._array.length) &&
            this._getKey(this._array[$]) === e))
      )
        do t(this._array[$]);
        while (++$ < this._array.length && this._getKey(this._array[$]) === e);
    }
    values() {
      return (
        this._flushCleanupInserted(),
        this._flushCleanupDeleted(),
        [...this._array].values()
      );
    }
    _search(e) {
      let t = 0,
        n = this._array.length - 1;
      for (; n >= t; ) {
        let r = (t + n) >> 1,
          i = this._getKey(this._array[r]);
        if (i > e) n = r - 1;
        else if (i < e) t = r + 1;
        else {
          for (; r > 0 && this._getKey(this._array[r - 1]) === e; ) r--;
          return r;
        }
      }
      return t;
    }
  },
  Xc = 0,
  Zc = 0,
  Qc = class extends F {
    constructor() {
      (super(),
        (this._decorations = new Yc((e) => e?.marker.line)),
        (this._onDecorationRegistered = this._register(new L())),
        (this.onDecorationRegistered = this._onDecorationRegistered.event),
        (this._onDecorationRemoved = this._register(new L())),
        (this.onDecorationRemoved = this._onDecorationRemoved.event),
        this._register(P(() => this.reset())));
    }
    get decorations() {
      return this._decorations.values();
    }
    registerDecoration(e) {
      if (e.marker.isDisposed) return;
      let t = new $c(e);
      if (t) {
        let e = t.marker.onDispose(() => t.dispose()),
          n = t.onDispose(() => {
            (n.dispose(),
              t &&
                (this._decorations.delete(t) &&
                  this._onDecorationRemoved.fire(t),
                e.dispose()));
          });
        (this._decorations.insert(t), this._onDecorationRegistered.fire(t));
      }
      return t;
    }
    reset() {
      for (let e of this._decorations.values()) e.dispose();
      this._decorations.clear();
    }
    *getDecorationsAtCell(e, t, n) {
      let r = 0,
        i = 0;
      for (let a of this._decorations.getKeyIterator(t))
        ((r = a.options.x ?? 0),
          (i = r + (a.options.width ?? 1)),
          e >= r &&
            e < i &&
            (!n || (a.options.layer ?? `bottom`) === n) &&
            (yield a));
    }
    forEachDecorationAtCell(e, t, n, r) {
      this._decorations.forEachByKey(t, (t) => {
        ((Xc = t.options.x ?? 0),
          (Zc = Xc + (t.options.width ?? 1)),
          e >= Xc &&
            e < Zc &&
            (!n || (t.options.layer ?? `bottom`) === n) &&
            r(t));
      });
    }
  },
  $c = class extends Rn {
    constructor(e) {
      (super(),
        (this.options = e),
        (this.onRenderEmitter = this.add(new L())),
        (this.onRender = this.onRenderEmitter.event),
        (this._onDispose = this.add(new L())),
        (this.onDispose = this._onDispose.event),
        (this._cachedBg = null),
        (this._cachedFg = null),
        (this.marker = e.marker),
        this.options.overviewRulerOptions &&
          !this.options.overviewRulerOptions.position &&
          (this.options.overviewRulerOptions.position = `full`));
    }
    get backgroundColorRGB() {
      return (
        this._cachedBg === null &&
          (this.options.backgroundColor
            ? (this._cachedBg = K.toColor(this.options.backgroundColor))
            : (this._cachedBg = void 0)),
        this._cachedBg
      );
    }
    get foregroundColorRGB() {
      return (
        this._cachedFg === null &&
          (this.options.foregroundColor
            ? (this._cachedFg = K.toColor(this.options.foregroundColor))
            : (this._cachedFg = void 0)),
        this._cachedFg
      );
    }
    dispose() {
      (this._onDispose.fire(), super.dispose());
    }
  },
  el = 1e3,
  tl = class {
    constructor(e, t = el) {
      ((this._renderCallback = e),
        (this._debounceThresholdMS = t),
        (this._lastRefreshMs = 0),
        (this._additionalRefreshRequested = !1));
    }
    dispose() {
      this._refreshTimeoutID && clearTimeout(this._refreshTimeoutID);
    }
    refresh(e, t, n) {
      ((this._rowCount = n),
        (e = e === void 0 ? 0 : e),
        (t = t === void 0 ? this._rowCount - 1 : t),
        (this._rowStart =
          this._rowStart === void 0 ? e : Math.min(this._rowStart, e)),
        (this._rowEnd =
          this._rowEnd === void 0 ? t : Math.max(this._rowEnd, t)));
      let r = performance.now();
      if (r - this._lastRefreshMs >= this._debounceThresholdMS)
        ((this._lastRefreshMs = r), this._innerRefresh());
      else if (!this._additionalRefreshRequested) {
        let e = r - this._lastRefreshMs,
          t = this._debounceThresholdMS - e;
        ((this._additionalRefreshRequested = !0),
          (this._refreshTimeoutID = window.setTimeout(() => {
            ((this._lastRefreshMs = performance.now()),
              this._innerRefresh(),
              (this._additionalRefreshRequested = !1),
              (this._refreshTimeoutID = void 0));
          }, t)));
      }
    }
    _innerRefresh() {
      if (
        this._rowStart === void 0 ||
        this._rowEnd === void 0 ||
        this._rowCount === void 0
      )
        return;
      let e = Math.max(this._rowStart, 0),
        t = Math.min(this._rowEnd, this._rowCount - 1);
      ((this._rowStart = void 0),
        (this._rowEnd = void 0),
        this._renderCallback(e, t));
    }
  },
  nl = 20,
  rl = !1,
  il = class extends F {
    constructor(e, t, n, r) {
      (super(),
        (this._terminal = e),
        (this._coreBrowserService = n),
        (this._renderService = r),
        (this._rowColumns = new WeakMap()),
        (this._liveRegionLineCount = 0),
        (this._charsToConsume = []),
        (this._charsToAnnounce = ``));
      let i = this._coreBrowserService.mainDocument;
      ((this._accessibilityContainer = i.createElement(`div`)),
        this._accessibilityContainer.classList.add(`xterm-accessibility`),
        (this._rowContainer = i.createElement(`div`)),
        this._rowContainer.setAttribute(`role`, `list`),
        this._rowContainer.classList.add(`xterm-accessibility-tree`),
        (this._rowElements = []));
      for (let e = 0; e < this._terminal.rows; e++)
        ((this._rowElements[e] = this._createAccessibilityTreeNode()),
          this._rowContainer.appendChild(this._rowElements[e]));
      if (
        ((this._topBoundaryFocusListener = (e) =>
          this._handleBoundaryFocus(e, 0)),
        (this._bottomBoundaryFocusListener = (e) =>
          this._handleBoundaryFocus(e, 1)),
        this._rowElements[0].addEventListener(
          `focus`,
          this._topBoundaryFocusListener,
        ),
        this._rowElements[this._rowElements.length - 1].addEventListener(
          `focus`,
          this._bottomBoundaryFocusListener,
        ),
        this._accessibilityContainer.appendChild(this._rowContainer),
        (this._liveRegion = i.createElement(`div`)),
        this._liveRegion.classList.add(`live-region`),
        this._liveRegion.setAttribute(`aria-live`, `assertive`),
        this._accessibilityContainer.appendChild(this._liveRegion),
        (this._liveRegionDebouncer = this._register(
          new tl(this._renderRows.bind(this)),
        )),
        !this._terminal.element)
      )
        throw Error(`Cannot enable accessibility before Terminal.open`);
      (rl
        ? (this._accessibilityContainer.classList.add(`debug`),
          this._rowContainer.classList.add(`debug`),
          (this._debugRootContainer = i.createElement(`div`)),
          this._debugRootContainer.classList.add(`xterm`),
          this._debugRootContainer.appendChild(
            i.createTextNode(`------start a11y------`),
          ),
          this._debugRootContainer.appendChild(this._accessibilityContainer),
          this._debugRootContainer.appendChild(
            i.createTextNode(`------end a11y------`),
          ),
          this._terminal.element.insertAdjacentElement(
            `afterend`,
            this._debugRootContainer,
          ))
        : this._terminal.element.insertAdjacentElement(
            `afterbegin`,
            this._accessibilityContainer,
          ),
        this._register(
          this._terminal.onResize((e) => this._handleResize(e.rows)),
        ),
        this._register(
          this._terminal.onRender((e) => this._refreshRows(e.start, e.end)),
        ),
        this._register(this._terminal.onScroll(() => this._refreshRows())),
        this._register(this._terminal.onA11yChar((e) => this._handleChar(e))),
        this._register(
          this._terminal.onLineFeed(() =>
            this._handleChar(`
`),
          ),
        ),
        this._register(this._terminal.onA11yTab((e) => this._handleTab(e))),
        this._register(this._terminal.onKey((e) => this._handleKey(e.key))),
        this._register(this._terminal.onBlur(() => this._clearLiveRegion())),
        this._register(
          this._renderService.onDimensionsChange(() =>
            this._refreshRowsDimensions(),
          ),
        ),
        this._register(
          R(i, `selectionchange`, () => this._handleSelectionChange()),
        ),
        this._register(
          this._coreBrowserService.onDprChange(() =>
            this._refreshRowsDimensions(),
          ),
        ),
        this._refreshRowsDimensions(),
        this._refreshRows(),
        this._register(
          P(() => {
            (rl
              ? this._debugRootContainer.remove()
              : this._accessibilityContainer.remove(),
              (this._rowElements.length = 0));
          }),
        ));
    }
    _handleTab(e) {
      for (let t = 0; t < e; t++) this._handleChar(` `);
    }
    _handleChar(e) {
      this._liveRegionLineCount < nl + 1 &&
        (this._charsToConsume.length > 0
          ? this._charsToConsume.shift() !== e && (this._charsToAnnounce += e)
          : (this._charsToAnnounce += e),
        e ===
          `
` &&
          (this._liveRegionLineCount++,
          this._liveRegionLineCount === nl + 1 &&
            (this._liveRegion.textContent += vt.get())));
    }
    _clearLiveRegion() {
      ((this._liveRegion.textContent = ``), (this._liveRegionLineCount = 0));
    }
    _handleKey(e) {
      (this._clearLiveRegion(),
        /\p{Control}/u.test(e) || this._charsToConsume.push(e));
    }
    _refreshRows(e, t) {
      this._liveRegionDebouncer.refresh(e, t, this._terminal.rows);
    }
    _renderRows(e, t) {
      let n = this._terminal.buffer,
        r = n.lines.length.toString();
      for (let i = e; i <= t; i++) {
        let e = n.lines.get(n.ydisp + i),
          t = [],
          a = e?.translateToString(!0, void 0, void 0, t) || ``,
          o = (n.ydisp + i + 1).toString(),
          s = this._rowElements[i];
        s &&
          (a.length === 0
            ? ((s.textContent = `\xA0`), this._rowColumns.set(s, [0, 1]))
            : ((s.textContent = a), this._rowColumns.set(s, t)),
          s.setAttribute(`aria-posinset`, o),
          s.setAttribute(`aria-setsize`, r),
          this._alignRowWidth(s));
      }
      this._announceCharacters();
    }
    _announceCharacters() {
      this._charsToAnnounce.length !== 0 &&
        ((this._liveRegion.textContent += this._charsToAnnounce),
        (this._charsToAnnounce = ``));
    }
    _handleBoundaryFocus(e, t) {
      let n = e.target,
        r = this._rowElements[t === 0 ? 1 : this._rowElements.length - 2];
      if (
        n.getAttribute(`aria-posinset`) ===
          (t === 0 ? `1` : `${this._terminal.buffer.lines.length}`) ||
        e.relatedTarget !== r
      )
        return;
      let i, a;
      if (
        (t === 0
          ? ((i = n),
            (a = this._rowElements.pop()),
            this._rowContainer.removeChild(a))
          : ((i = this._rowElements.shift()),
            (a = n),
            this._rowContainer.removeChild(i)),
        i.removeEventListener(`focus`, this._topBoundaryFocusListener),
        a.removeEventListener(`focus`, this._bottomBoundaryFocusListener),
        t === 0)
      ) {
        let e = this._createAccessibilityTreeNode();
        (this._rowElements.unshift(e),
          this._rowContainer.insertAdjacentElement(`afterbegin`, e));
      } else {
        let e = this._createAccessibilityTreeNode();
        (this._rowElements.push(e), this._rowContainer.appendChild(e));
      }
      (this._rowElements[0].addEventListener(
        `focus`,
        this._topBoundaryFocusListener,
      ),
        this._rowElements[this._rowElements.length - 1].addEventListener(
          `focus`,
          this._bottomBoundaryFocusListener,
        ),
        this._terminal.scrollLines(t === 0 ? -1 : 1),
        this._rowElements[t === 0 ? 1 : this._rowElements.length - 2].focus(),
        e.preventDefault(),
        e.stopImmediatePropagation());
    }
    _handleSelectionChange() {
      if (this._rowElements.length === 0) return;
      let e = this._coreBrowserService.mainDocument.getSelection();
      if (!e) return;
      if (e.isCollapsed) {
        this._rowContainer.contains(e.anchorNode) &&
          this._terminal.clearSelection();
        return;
      }
      if (!e.anchorNode || !e.focusNode) {
        console.error(`anchorNode and/or focusNode are null`);
        return;
      }
      let t = { node: e.anchorNode, offset: e.anchorOffset },
        n = { node: e.focusNode, offset: e.focusOffset };
      if (
        ((t.node.compareDocumentPosition(n.node) &
          Node.DOCUMENT_POSITION_PRECEDING ||
          (t.node === n.node && t.offset > n.offset)) &&
          ([t, n] = [n, t]),
        t.node.compareDocumentPosition(this._rowElements[0]) &
          (Node.DOCUMENT_POSITION_CONTAINED_BY |
            Node.DOCUMENT_POSITION_FOLLOWING) &&
          (t = { node: this._rowElements[0].childNodes[0], offset: 0 }),
        !this._rowContainer.contains(t.node))
      )
        return;
      let r = this._rowElements.slice(-1)[0];
      if (
        (n.node.compareDocumentPosition(r) &
          (Node.DOCUMENT_POSITION_CONTAINED_BY |
            Node.DOCUMENT_POSITION_PRECEDING) &&
          (n = { node: r, offset: r.textContent?.length ?? 0 }),
        !this._rowContainer.contains(n.node))
      )
        return;
      let i = ({ node: e, offset: t }) => {
          let n = e instanceof Text ? e.parentNode : e,
            r = parseInt(n?.getAttribute(`aria-posinset`), 10) - 1;
          if (isNaN(r))
            return (console.warn(`row is invalid. Race condition?`), null);
          let i = this._rowColumns.get(n);
          if (!i)
            return (console.warn(`columns is null. Race condition?`), null);
          let a = t < i.length ? i[t] : i.slice(-1)[0] + 1;
          return (
            a >= this._terminal.cols && (++r, (a = 0)),
            { row: r, column: a }
          );
        },
        a = i(t),
        o = i(n);
      if (!(!a || !o)) {
        if (a.row > o.row || (a.row === o.row && a.column >= o.column))
          throw Error(`invalid range`);
        this._terminal.select(
          a.column,
          a.row,
          (o.row - a.row) * this._terminal.cols - a.column + o.column,
        );
      }
    }
    _handleResize(e) {
      this._rowElements[this._rowElements.length - 1].removeEventListener(
        `focus`,
        this._bottomBoundaryFocusListener,
      );
      for (
        let e = this._rowContainer.children.length;
        e < this._terminal.rows;
        e++
      )
        ((this._rowElements[e] = this._createAccessibilityTreeNode()),
          this._rowContainer.appendChild(this._rowElements[e]));
      for (; this._rowElements.length > e; )
        this._rowContainer.removeChild(this._rowElements.pop());
      (this._rowElements[this._rowElements.length - 1].addEventListener(
        `focus`,
        this._bottomBoundaryFocusListener,
      ),
        this._refreshRowsDimensions());
    }
    _createAccessibilityTreeNode() {
      let e = this._coreBrowserService.mainDocument.createElement(`div`);
      return (
        e.setAttribute(`role`, `listitem`),
        (e.tabIndex = -1),
        this._refreshRowDimensions(e),
        e
      );
    }
    _refreshRowsDimensions() {
      if (this._renderService.dimensions.css.cell.height) {
        (Object.assign(this._accessibilityContainer.style, {
          width: `${this._renderService.dimensions.css.canvas.width}px`,
          fontSize: `${this._terminal.options.fontSize}px`,
        }),
          this._rowElements.length !== this._terminal.rows &&
            this._handleResize(this._terminal.rows));
        for (let e = 0; e < this._terminal.rows; e++)
          (this._refreshRowDimensions(this._rowElements[e]),
            this._alignRowWidth(this._rowElements[e]));
      }
    }
    _refreshRowDimensions(e) {
      e.style.height = `${this._renderService.dimensions.css.cell.height}px`;
    }
    _alignRowWidth(e) {
      e.style.transform = ``;
      let t = e.getBoundingClientRect().width,
        n = this._rowColumns.get(e)?.slice(-1)?.[0];
      if (!n) return;
      let r = n * this._renderService.dimensions.css.cell.width;
      e.style.transform = `scaleX(${r / t})`;
    }
  };
il = j([M(1, Wt), M(2, $t), M(3, tn)], il);
var al = class extends F {
  constructor(e, t, n, r, i) {
    (super(),
      (this._element = e),
      (this._mouseService = t),
      (this._renderService = n),
      (this._bufferService = r),
      (this._linkProviderService = i),
      (this._linkCacheDisposables = []),
      (this._isMouseOut = !0),
      (this._wasResized = !1),
      (this._activeLine = -1),
      (this._onShowLinkUnderline = this._register(new L())),
      (this.onShowLinkUnderline = this._onShowLinkUnderline.event),
      (this._onHideLinkUnderline = this._register(new L())),
      (this.onHideLinkUnderline = this._onHideLinkUnderline.event),
      this._register(
        P(() => {
          (Fn(this._linkCacheDisposables),
            (this._linkCacheDisposables.length = 0),
            (this._lastMouseEvent = void 0),
            this._activeProviderReplies?.clear());
        }),
      ),
      this._register(
        this._bufferService.onResize(() => {
          (this._clearCurrentLink(), (this._wasResized = !0));
        }),
      ),
      this._register(
        R(this._element, `mouseleave`, () => {
          ((this._isMouseOut = !0), this._clearCurrentLink());
        }),
      ),
      this._register(
        R(this._element, `mousemove`, this._handleMouseMove.bind(this)),
      ),
      this._register(
        R(this._element, `mousedown`, this._handleMouseDown.bind(this)),
      ),
      this._register(
        R(this._element, `mouseup`, this._handleMouseUp.bind(this)),
      ));
  }
  get currentLink() {
    return this._currentLink;
  }
  _handleMouseMove(e) {
    this._lastMouseEvent = e;
    let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
    if (!t) return;
    this._isMouseOut = !1;
    let n = e.composedPath();
    for (let e = 0; e < n.length; e++) {
      let t = n[e];
      if (t.classList.contains(`xterm`)) break;
      if (t.classList.contains(`xterm-hover`)) return;
    }
    (!this._lastBufferCell ||
      t.x !== this._lastBufferCell.x ||
      t.y !== this._lastBufferCell.y) &&
      (this._handleHover(t), (this._lastBufferCell = t));
  }
  _handleHover(e) {
    if (this._activeLine !== e.y || this._wasResized) {
      (this._clearCurrentLink(),
        this._askForLink(e, !1),
        (this._wasResized = !1));
      return;
    }
    (this._currentLink && this._linkAtPosition(this._currentLink.link, e)) ||
      (this._clearCurrentLink(), this._askForLink(e, !0));
  }
  _askForLink(e, t) {
    (!this._activeProviderReplies || !t) &&
      (this._activeProviderReplies?.forEach((e) => {
        e?.forEach((e) => {
          e.link.dispose && e.link.dispose();
        });
      }),
      (this._activeProviderReplies = new Map()),
      (this._activeLine = e.y));
    let n = !1;
    for (let [r, i] of this._linkProviderService.linkProviders.entries())
      t
        ? this._activeProviderReplies?.get(r) &&
          (n = this._checkLinkProviderResult(r, e, n))
        : i.provideLinks(e.y, (t) => {
            if (this._isMouseOut) return;
            let i = t?.map((e) => ({ link: e }));
            (this._activeProviderReplies?.set(r, i),
              (n = this._checkLinkProviderResult(r, e, n)),
              this._activeProviderReplies?.size ===
                this._linkProviderService.linkProviders.length &&
                this._removeIntersectingLinks(
                  e.y,
                  this._activeProviderReplies,
                ));
          });
  }
  _removeIntersectingLinks(e, t) {
    let n = new Set();
    for (let r = 0; r < t.size; r++) {
      let i = t.get(r);
      if (i)
        for (let t = 0; t < i.length; t++) {
          let r = i[t],
            a = r.link.range.start.y < e ? 0 : r.link.range.start.x,
            o =
              r.link.range.end.y > e
                ? this._bufferService.cols
                : r.link.range.end.x;
          for (let e = a; e <= o; e++) {
            if (n.has(e)) {
              i.splice(t--, 1);
              break;
            }
            n.add(e);
          }
        }
    }
  }
  _checkLinkProviderResult(e, t, n) {
    if (!this._activeProviderReplies) return n;
    let r = this._activeProviderReplies.get(e),
      i = !1;
    for (let t = 0; t < e; t++)
      (!this._activeProviderReplies.has(t) ||
        this._activeProviderReplies.get(t)) &&
        (i = !0);
    if (!i && r) {
      let e = r.find((e) => this._linkAtPosition(e.link, t));
      e && ((n = !0), this._handleNewLink(e));
    }
    if (
      this._activeProviderReplies.size ===
        this._linkProviderService.linkProviders.length &&
      !n
    )
      for (let e = 0; e < this._activeProviderReplies.size; e++) {
        let r = this._activeProviderReplies
          .get(e)
          ?.find((e) => this._linkAtPosition(e.link, t));
        if (r) {
          ((n = !0), this._handleNewLink(r));
          break;
        }
      }
    return n;
  }
  _handleMouseDown() {
    this._mouseDownLink = this._currentLink;
  }
  _handleMouseUp(e) {
    if (!this._currentLink) return;
    let t = this._positionFromMouseEvent(e, this._element, this._mouseService);
    t &&
      this._mouseDownLink &&
      ol(this._mouseDownLink.link, this._currentLink.link) &&
      this._linkAtPosition(this._currentLink.link, t) &&
      this._currentLink.link.activate(e, this._currentLink.link.text);
  }
  _clearCurrentLink(e, t) {
    !this._currentLink ||
      !this._lastMouseEvent ||
      ((!e ||
        !t ||
        (this._currentLink.link.range.start.y >= e &&
          this._currentLink.link.range.end.y <= t)) &&
        (this._linkLeave(
          this._element,
          this._currentLink.link,
          this._lastMouseEvent,
        ),
        (this._currentLink = void 0),
        Fn(this._linkCacheDisposables),
        (this._linkCacheDisposables.length = 0)));
  }
  _handleNewLink(e) {
    if (!this._lastMouseEvent) return;
    let t = this._positionFromMouseEvent(
      this._lastMouseEvent,
      this._element,
      this._mouseService,
    );
    t &&
      this._linkAtPosition(e.link, t) &&
      ((this._currentLink = e),
      (this._currentLink.state = {
        decorations: {
          underline:
            e.link.decorations === void 0 ? !0 : e.link.decorations.underline,
          pointerCursor:
            e.link.decorations === void 0
              ? !0
              : e.link.decorations.pointerCursor,
        },
        isHovered: !0,
      }),
      this._linkHover(this._element, e.link, this._lastMouseEvent),
      (e.link.decorations = {}),
      Object.defineProperties(e.link.decorations, {
        pointerCursor: {
          get: () => this._currentLink?.state?.decorations.pointerCursor,
          set: (e) => {
            this._currentLink?.state &&
              this._currentLink.state.decorations.pointerCursor !== e &&
              ((this._currentLink.state.decorations.pointerCursor = e),
              this._currentLink.state.isHovered &&
                this._element.classList.toggle(`xterm-cursor-pointer`, e));
          },
        },
        underline: {
          get: () => this._currentLink?.state?.decorations.underline,
          set: (t) => {
            this._currentLink?.state &&
              this._currentLink?.state?.decorations.underline !== t &&
              ((this._currentLink.state.decorations.underline = t),
              this._currentLink.state.isHovered &&
                this._fireUnderlineEvent(e.link, t));
          },
        },
      }),
      this._linkCacheDisposables.push(
        this._renderService.onRenderedViewportChange((e) => {
          if (!this._currentLink) return;
          let t =
              e.start === 0
                ? 0
                : e.start + 1 + this._bufferService.buffer.ydisp,
            n = this._bufferService.buffer.ydisp + 1 + e.end;
          if (
            this._currentLink.link.range.start.y >= t &&
            this._currentLink.link.range.end.y <= n &&
            (this._clearCurrentLink(t, n), this._lastMouseEvent)
          ) {
            let e = this._positionFromMouseEvent(
              this._lastMouseEvent,
              this._element,
              this._mouseService,
            );
            e && this._askForLink(e, !1);
          }
        }),
      ));
  }
  _linkHover(e, t, n) {
    (this._currentLink?.state &&
      ((this._currentLink.state.isHovered = !0),
      this._currentLink.state.decorations.underline &&
        this._fireUnderlineEvent(t, !0),
      this._currentLink.state.decorations.pointerCursor &&
        e.classList.add(`xterm-cursor-pointer`)),
      t.hover && t.hover(n, t.text));
  }
  _fireUnderlineEvent(e, t) {
    let n = e.range,
      r = this._bufferService.buffer.ydisp,
      i = this._createLinkUnderlineEvent(
        n.start.x - 1,
        n.start.y - r - 1,
        n.end.x,
        n.end.y - r - 1,
        void 0,
      );
    (t ? this._onShowLinkUnderline : this._onHideLinkUnderline).fire(i);
  }
  _linkLeave(e, t, n) {
    (this._currentLink?.state &&
      ((this._currentLink.state.isHovered = !1),
      this._currentLink.state.decorations.underline &&
        this._fireUnderlineEvent(t, !1),
      this._currentLink.state.decorations.pointerCursor &&
        e.classList.remove(`xterm-cursor-pointer`)),
      t.leave && t.leave(n, t.text));
  }
  _linkAtPosition(e, t) {
    let n = e.range.start.y * this._bufferService.cols + e.range.start.x,
      r = e.range.end.y * this._bufferService.cols + e.range.end.x,
      i = t.y * this._bufferService.cols + t.x;
    return n <= i && i <= r;
  }
  _positionFromMouseEvent(e, t, n) {
    let r = n.getCoords(
      e,
      t,
      this._bufferService.cols,
      this._bufferService.rows,
    );
    if (r) return { x: r[0], y: r[1] + this._bufferService.buffer.ydisp };
  }
  _createLinkUnderlineEvent(e, t, n, r, i) {
    return {
      x1: e,
      y1: t,
      x2: n,
      y2: r,
      cols: this._bufferService.cols,
      fg: i,
    };
  }
};
al = j([M(1, en), M(2, tn), M(3, Bt), M(4, on)], al);
function ol(e, t) {
  return (
    e.text === t.text &&
    e.range.start.x === t.range.start.x &&
    e.range.start.y === t.range.start.y &&
    e.range.end.x === t.range.end.x &&
    e.range.end.y === t.range.end.y
  );
}
var sl = class extends Kc {
  constructor(e = {}) {
    (super(e),
      (this._linkifier = this._register(new zn())),
      (this.browser = To),
      (this._keyDownHandled = !1),
      (this._keyDownSeen = !1),
      (this._keyPressHandled = !1),
      (this._unprocessedDeadKey = !1),
      (this._accessibilityManager = this._register(new zn())),
      (this._onCursorMove = this._register(new L())),
      (this.onCursorMove = this._onCursorMove.event),
      (this._onKey = this._register(new L())),
      (this.onKey = this._onKey.event),
      (this._onRender = this._register(new L())),
      (this.onRender = this._onRender.event),
      (this._onSelectionChange = this._register(new L())),
      (this.onSelectionChange = this._onSelectionChange.event),
      (this._onTitleChange = this._register(new L())),
      (this.onTitleChange = this._onTitleChange.event),
      (this._onBell = this._register(new L())),
      (this.onBell = this._onBell.event),
      (this._onFocus = this._register(new L())),
      (this._onBlur = this._register(new L())),
      (this._onA11yCharEmitter = this._register(new L())),
      (this._onA11yTabEmitter = this._register(new L())),
      (this._onWillOpen = this._register(new L())),
      this._setup(),
      (this._decorationService = this._instantiationService.createInstance(Qc)),
      this._instantiationService.setService(Yt, this._decorationService),
      (this._linkProviderService =
        this._instantiationService.createInstance(bo)),
      this._instantiationService.setService(on, this._linkProviderService),
      this._linkProviderService.registerLinkProvider(
        this._instantiationService.createInstance(Xt),
      ),
      this._register(
        this._inputHandler.onRequestBell(() => this._onBell.fire()),
      ),
      this._register(
        this._inputHandler.onRequestRefreshRows((e) =>
          this.refresh(e?.start ?? 0, e?.end ?? this.rows - 1),
        ),
      ),
      this._register(
        this._inputHandler.onRequestSendFocus(() => this._reportFocus()),
      ),
      this._register(this._inputHandler.onRequestReset(() => this.reset())),
      this._register(
        this._inputHandler.onRequestWindowsOptionsReport((e) =>
          this._reportWindowsOptions(e),
        ),
      ),
      this._register(
        this._inputHandler.onColor((e) => this._handleColorEvent(e)),
      ),
      this._register(
        Jn.forward(this._inputHandler.onCursorMove, this._onCursorMove),
      ),
      this._register(
        Jn.forward(this._inputHandler.onTitleChange, this._onTitleChange),
      ),
      this._register(
        Jn.forward(this._inputHandler.onA11yChar, this._onA11yCharEmitter),
      ),
      this._register(
        Jn.forward(this._inputHandler.onA11yTab, this._onA11yTabEmitter),
      ),
      this._register(
        this._bufferService.onResize((e) => this._afterResize(e.cols, e.rows)),
      ),
      this._register(
        P(() => {
          ((this._customKeyEventHandler = void 0),
            this.element?.parentNode?.removeChild(this.element));
        }),
      ));
  }
  get linkifier() {
    return this._linkifier.value;
  }
  get onFocus() {
    return this._onFocus.event;
  }
  get onBlur() {
    return this._onBlur.event;
  }
  get onA11yChar() {
    return this._onA11yCharEmitter.event;
  }
  get onA11yTab() {
    return this._onA11yTabEmitter.event;
  }
  get onWillOpen() {
    return this._onWillOpen.event;
  }
  _handleColorEvent(e) {
    if (this._themeService)
      for (let t of e) {
        let e,
          n = ``;
        switch (t.index) {
          case 256:
            ((e = `foreground`), (n = `10`));
            break;
          case 257:
            ((e = `background`), (n = `11`));
            break;
          case 258:
            ((e = `cursor`), (n = `12`));
            break;
          default:
            ((e = `ansi`), (n = `4;` + t.index));
        }
        switch (t.type) {
          case 0:
            let r = G.toColorRGB(
              e === `ansi`
                ? this._themeService.colors.ansi[t.index]
                : this._themeService.colors[e],
            );
            this.coreService.triggerDataEvent(`${B.ESC}]${n};${Ac(r)}${za.ST}`);
            break;
          case 1:
            if (e === `ansi`)
              this._themeService.modifyColors(
                (e) => (e.ansi[t.index] = W.toColor(...t.color)),
              );
            else {
              let n = e;
              this._themeService.modifyColors(
                (e) => (e[n] = W.toColor(...t.color)),
              );
            }
            break;
          case 2:
            this._themeService.restoreColor(t.index);
            break;
        }
      }
  }
  _setup() {
    (super._setup(), (this._customKeyEventHandler = void 0));
  }
  get buffer() {
    return this.buffers.active;
  }
  focus() {
    this.textarea && this.textarea.focus({ preventScroll: !0 });
  }
  _handleScreenReaderModeOptionChange(e) {
    e
      ? !this._accessibilityManager.value &&
        this._renderService &&
        (this._accessibilityManager.value =
          this._instantiationService.createInstance(il, this))
      : this._accessibilityManager.clear();
  }
  _handleTextAreaFocus(e) {
    (this.coreService.decPrivateModes.sendFocus &&
      this.coreService.triggerDataEvent(B.ESC + `[I`),
      this.element.classList.add(`focus`),
      this._showCursor(),
      this._onFocus.fire());
  }
  blur() {
    return this.textarea?.blur();
  }
  _handleTextAreaBlur() {
    ((this.textarea.value = ``),
      this.refresh(this.buffer.y, this.buffer.y),
      this.coreService.decPrivateModes.sendFocus &&
        this.coreService.triggerDataEvent(B.ESC + `[O`),
      this.element.classList.remove(`focus`),
      this._onBlur.fire());
  }
  _syncTextArea() {
    if (
      !this.textarea ||
      !this.buffer.isCursorInViewport ||
      this._compositionHelper.isComposing ||
      !this._renderService
    )
      return;
    let e = this.buffer.ybase + this.buffer.y,
      t = this.buffer.lines.get(e);
    if (!t) return;
    let n = Math.min(this.buffer.x, this.cols - 1),
      r = this._renderService.dimensions.css.cell.height,
      i = t.getWidth(n),
      a = this._renderService.dimensions.css.cell.width * i,
      o = this.buffer.y * this._renderService.dimensions.css.cell.height,
      s = n * this._renderService.dimensions.css.cell.width;
    ((this.textarea.style.left = s + `px`),
      (this.textarea.style.top = o + `px`),
      (this.textarea.style.width = a + `px`),
      (this.textarea.style.height = r + `px`),
      (this.textarea.style.lineHeight = r + `px`),
      (this.textarea.style.zIndex = `-5`));
  }
  _initGlobal() {
    (this._bindKeys(),
      this._register(
        R(this.element, `copy`, (e) => {
          this.hasSelection() && xt(e, this._selectionService);
        }),
      ));
    let e = (e) => St(e, this.textarea, this.coreService, this.optionsService);
    (this._register(R(this.textarea, `paste`, e)),
      this._register(R(this.element, `paste`, e)),
      ko
        ? this._register(
            R(this.element, `mousedown`, (e) => {
              e.button === 2 &&
                Tt(
                  e,
                  this.textarea,
                  this.screenElement,
                  this._selectionService,
                  this.options.rightClickSelectsWord,
                );
            }),
          )
        : this._register(
            R(this.element, `contextmenu`, (e) => {
              Tt(
                e,
                this.textarea,
                this.screenElement,
                this._selectionService,
                this.options.rightClickSelectsWord,
              );
            }),
          ),
      Lo &&
        this._register(
          R(this.element, `auxclick`, (e) => {
            e.button === 1 && wt(e, this.textarea, this.screenElement);
          }),
        ));
  }
  _bindKeys() {
    (this._register(R(this.textarea, `keyup`, (e) => this._keyUp(e), !0)),
      this._register(R(this.textarea, `keydown`, (e) => this._keyDown(e), !0)),
      this._register(
        R(this.textarea, `keypress`, (e) => this._keyPress(e), !0),
      ),
      this._register(
        R(this.textarea, `compositionstart`, () =>
          this._compositionHelper.compositionstart(),
        ),
      ),
      this._register(
        R(this.textarea, `compositionupdate`, (e) =>
          this._compositionHelper.compositionupdate(e),
        ),
      ),
      this._register(
        R(this.textarea, `compositionend`, () =>
          this._compositionHelper.compositionend(),
        ),
      ),
      this._register(R(this.textarea, `input`, (e) => this._inputEvent(e), !0)),
      this._register(
        this.onRender(() =>
          this._compositionHelper.updateCompositionElements(),
        ),
      ));
  }
  open(e) {
    if (!e) throw Error(`Terminal requires a parent element.`);
    if (
      (e.isConnected ||
        this._logService.debug(
          `Terminal.open was called on an element that was not attached to the DOM`,
        ),
      this.element?.ownerDocument.defaultView && this._coreBrowserService)
    ) {
      this.element.ownerDocument.defaultView !==
        this._coreBrowserService.window &&
        (this._coreBrowserService.window =
          this.element.ownerDocument.defaultView);
      return;
    }
    ((this._document = e.ownerDocument),
      this.options.documentOverride &&
        this.options.documentOverride instanceof Document &&
        (this._document = this.optionsService.rawOptions.documentOverride),
      (this.element = this._document.createElement(`div`)),
      (this.element.dir = `ltr`),
      this.element.classList.add(`terminal`),
      this.element.classList.add(`xterm`),
      e.appendChild(this.element));
    let t = this._document.createDocumentFragment();
    ((this._viewportElement = this._document.createElement(`div`)),
      this._viewportElement.classList.add(`xterm-viewport`),
      t.appendChild(this._viewportElement),
      (this.screenElement = this._document.createElement(`div`)),
      this.screenElement.classList.add(`xterm-screen`),
      this._register(
        R(this.screenElement, `mousemove`, (e) => this.updateCursorStyle(e)),
      ),
      (this._helperContainer = this._document.createElement(`div`)),
      this._helperContainer.classList.add(`xterm-helpers`),
      this.screenElement.appendChild(this._helperContainer),
      t.appendChild(this.screenElement));
    let n = (this.textarea = this._document.createElement(`textarea`));
    (this.textarea.classList.add(`xterm-helper-textarea`),
      this.textarea.setAttribute(`aria-label`, gt.get()),
      Ro || this.textarea.setAttribute(`aria-multiline`, `false`),
      this.textarea.setAttribute(`autocorrect`, `off`),
      this.textarea.setAttribute(`autocapitalize`, `off`),
      this.textarea.setAttribute(`spellcheck`, `false`),
      (this.textarea.tabIndex = 0),
      this._register(
        this.optionsService.onSpecificOptionChange(
          `disableStdin`,
          () => (n.readOnly = this.optionsService.rawOptions.disableStdin),
        ),
      ),
      (this.textarea.readOnly = this.optionsService.rawOptions.disableStdin),
      (this._coreBrowserService = this._register(
        this._instantiationService.createInstance(
          vo,
          this.textarea,
          e.ownerDocument.defaultView ?? window,
          (this._document ?? typeof window < `u`) ? window.document : null,
        ),
      )),
      this._instantiationService.setService($t, this._coreBrowserService),
      this._register(
        R(this.textarea, `focus`, (e) => this._handleTextAreaFocus(e)),
      ),
      this._register(
        R(this.textarea, `blur`, () => this._handleTextAreaBlur()),
      ),
      this._helperContainer.appendChild(this.textarea),
      (this._charSizeService = this._instantiationService.createInstance(
        mo,
        this._document,
        this._helperContainer,
      )),
      this._instantiationService.setService(Qt, this._charSizeService),
      (this._themeService = this._instantiationService.createInstance(xs)),
      this._instantiationService.setService(an, this._themeService),
      (this._characterJoinerService =
        this._instantiationService.createInstance(Ja)),
      this._instantiationService.setService(rn, this._characterJoinerService),
      (this._renderService = this._register(
        this._instantiationService.createInstance(
          Wo,
          this.rows,
          this.screenElement,
        ),
      )),
      this._instantiationService.setService(tn, this._renderService),
      this._register(
        this._renderService.onRenderedViewportChange((e) =>
          this._onRender.fire(e),
        ),
      ),
      this.onResize((e) => this._renderService.resize(e.cols, e.rows)),
      (this._compositionView = this._document.createElement(`div`)),
      this._compositionView.classList.add(`composition-view`),
      (this._compositionHelper = this._instantiationService.createInstance(
        Ba,
        this.textarea,
        this._compositionView,
      )),
      this._helperContainer.appendChild(this._compositionView),
      (this._mouseService = this._instantiationService.createInstance(Co)),
      this._instantiationService.setService(en, this._mouseService));
    let r = (this._linkifier.value = this._register(
      this._instantiationService.createInstance(al, this.screenElement),
    ));
    this.element.appendChild(t);
    try {
      this._onWillOpen.fire(this.element);
    } catch {}
    (this._renderService.hasRenderer() ||
      this._renderService.setRenderer(this._createRenderer()),
      this._register(
        this.onCursorMove(() => {
          (this._renderService.handleCursorMove(), this._syncTextArea());
        }),
      ),
      this._register(
        this.onResize(() =>
          this._renderService.handleResize(this.cols, this.rows),
        ),
      ),
      this._register(this.onBlur(() => this._renderService.handleBlur())),
      this._register(this.onFocus(() => this._renderService.handleFocus())),
      (this._viewport = this._register(
        this._instantiationService.createInstance(
          ja,
          this.element,
          this.screenElement,
        ),
      )),
      this._register(
        this._viewport.onRequestScrollLines((e) => {
          (super.scrollLines(e, !1), this.refresh(0, this.rows - 1));
        }),
      ),
      (this._selectionService = this._register(
        this._instantiationService.createInstance(
          fs,
          this.element,
          this.screenElement,
          r,
        ),
      )),
      this._instantiationService.setService(nn, this._selectionService),
      this._register(
        this._selectionService.onRequestScrollLines((e) =>
          this.scrollLines(e.amount, e.suppressScrollEvent),
        ),
      ),
      this._register(
        this._selectionService.onSelectionChange(() =>
          this._onSelectionChange.fire(),
        ),
      ),
      this._register(
        this._selectionService.onRequestRedraw((e) =>
          this._renderService.handleSelectionChanged(
            e.start,
            e.end,
            e.columnSelectMode,
          ),
        ),
      ),
      this._register(
        this._selectionService.onLinuxMouseSelection((e) => {
          ((this.textarea.value = e),
            this.textarea.focus(),
            this.textarea.select());
        }),
      ),
      this._register(
        Jn.any(
          this._onScroll.event,
          this._inputHandler.onScroll,
        )(() => {
          (this._selectionService.refresh(), this._viewport?.queueSync());
        }),
      ),
      this._register(
        this._instantiationService.createInstance(Ma, this.screenElement),
      ),
      this._register(
        R(this.element, `mousedown`, (e) =>
          this._selectionService.handleMouseDown(e),
        ),
      ),
      this.coreMouseService.areMouseEventsActive
        ? (this._selectionService.disable(),
          this.element.classList.add(`enable-mouse-events`))
        : this._selectionService.enable(),
      this.options.screenReaderMode &&
        (this._accessibilityManager.value =
          this._instantiationService.createInstance(il, this)),
      this._register(
        this.optionsService.onSpecificOptionChange(`screenReaderMode`, (e) =>
          this._handleScreenReaderModeOptionChange(e),
        ),
      ),
      this.options.overviewRuler.width &&
        (this._overviewRulerRenderer = this._register(
          this._instantiationService.createInstance(
            La,
            this._viewportElement,
            this.screenElement,
          ),
        )),
      this.optionsService.onSpecificOptionChange(`overviewRuler`, (e) => {
        !this._overviewRulerRenderer &&
          e &&
          this._viewportElement &&
          this.screenElement &&
          (this._overviewRulerRenderer = this._register(
            this._instantiationService.createInstance(
              La,
              this._viewportElement,
              this.screenElement,
            ),
          ));
      }),
      this._charSizeService.measure(),
      this.refresh(0, this.rows - 1),
      this._initGlobal(),
      this.bindMouse());
  }
  _createRenderer() {
    return this._instantiationService.createInstance(
      po,
      this,
      this._document,
      this.element,
      this.screenElement,
      this._viewportElement,
      this._helperContainer,
      this.linkifier,
    );
  }
  bindMouse() {
    let e = this,
      t = this.element;
    function n(t) {
      let n = e._mouseService.getMouseReportCoords(t, e.screenElement);
      if (!n) return !1;
      let r, i;
      switch (t.overrideType || t.type) {
        case `mousemove`:
          ((i = 32),
            t.buttons === void 0
              ? ((r = 3),
                t.button !== void 0 && (r = t.button < 3 ? t.button : 3))
              : (r =
                  t.buttons & 1
                    ? 0
                    : t.buttons & 4
                      ? 1
                      : t.buttons & 2
                        ? 2
                        : 3));
          break;
        case `mouseup`:
          ((i = 0), (r = t.button < 3 ? t.button : 3));
          break;
        case `mousedown`:
          ((i = 1), (r = t.button < 3 ? t.button : 3));
          break;
        case `wheel`:
          if (
            e._customWheelEventHandler &&
            e._customWheelEventHandler(t) === !1
          )
            return !1;
          let n = t.deltaY;
          if (
            n === 0 ||
            e.coreMouseService.consumeWheelEvent(
              t,
              e._renderService?.dimensions?.device?.cell?.height,
              e._coreBrowserService?.dpr,
            ) === 0
          )
            return !1;
          ((i = n < 0 ? 0 : 1), (r = 4));
          break;
        default:
          return !1;
      }
      return i === void 0 || r === void 0 || r > 4
        ? !1
        : e.coreMouseService.triggerMouseEvent({
            col: n.col,
            row: n.row,
            x: n.x,
            y: n.y,
            button: r,
            action: i,
            ctrl: t.ctrlKey,
            alt: t.altKey,
            shift: t.shiftKey,
          });
    }
    let r = { mouseup: null, wheel: null, mousedrag: null, mousemove: null },
      i = {
        mouseup: (e) => (
          n(e),
          e.buttons ||
            (this._document.removeEventListener(`mouseup`, r.mouseup),
            r.mousedrag &&
              this._document.removeEventListener(`mousemove`, r.mousedrag)),
          this.cancel(e)
        ),
        wheel: (e) => (n(e), this.cancel(e, !0)),
        mousedrag: (e) => {
          e.buttons && n(e);
        },
        mousemove: (e) => {
          e.buttons || n(e);
        },
      };
    (this._register(
      this.coreMouseService.onProtocolChange((e) => {
        (e
          ? (this.optionsService.rawOptions.logLevel === `debug` &&
              this._logService.debug(
                `Binding to mouse events:`,
                this.coreMouseService.explainEvents(e),
              ),
            this.element.classList.add(`enable-mouse-events`),
            this._selectionService.disable())
          : (this._logService.debug(`Unbinding from mouse events.`),
            this.element.classList.remove(`enable-mouse-events`),
            this._selectionService.enable()),
          e & 8
            ? (r.mousemove ||=
                (t.addEventListener(`mousemove`, i.mousemove), i.mousemove))
            : (t.removeEventListener(`mousemove`, r.mousemove),
              (r.mousemove = null)),
          e & 16
            ? (r.wheel ||=
                (t.addEventListener(`wheel`, i.wheel, { passive: !1 }),
                i.wheel))
            : (t.removeEventListener(`wheel`, r.wheel), (r.wheel = null)),
          e & 2
            ? (r.mouseup ||= i.mouseup)
            : (this._document.removeEventListener(`mouseup`, r.mouseup),
              (r.mouseup = null)),
          e & 4
            ? (r.mousedrag ||= i.mousedrag)
            : (this._document.removeEventListener(`mousemove`, r.mousedrag),
              (r.mousedrag = null)));
      }),
    ),
      (this.coreMouseService.activeProtocol =
        this.coreMouseService.activeProtocol),
      this._register(
        R(t, `mousedown`, (e) => {
          if (
            (e.preventDefault(),
            this.focus(),
            !(
              !this.coreMouseService.areMouseEventsActive ||
              this._selectionService.shouldForceSelection(e)
            ))
          )
            return (
              n(e),
              r.mouseup &&
                this._document.addEventListener(`mouseup`, r.mouseup),
              r.mousedrag &&
                this._document.addEventListener(`mousemove`, r.mousedrag),
              this.cancel(e)
            );
        }),
      ),
      this._register(
        R(
          t,
          `wheel`,
          (t) => {
            if (!r.wheel) {
              if (
                this._customWheelEventHandler &&
                this._customWheelEventHandler(t) === !1
              )
                return !1;
              if (!this.buffer.hasScrollback) {
                if (t.deltaY === 0) return !1;
                if (
                  e.coreMouseService.consumeWheelEvent(
                    t,
                    e._renderService?.dimensions?.device?.cell?.height,
                    e._coreBrowserService?.dpr,
                  ) === 0
                )
                  return this.cancel(t, !0);
                let n =
                  B.ESC +
                  (this.coreService.decPrivateModes.applicationCursorKeys
                    ? `O`
                    : `[`) +
                  (t.deltaY < 0 ? `A` : `B`);
                return (
                  this.coreService.triggerDataEvent(n, !0),
                  this.cancel(t, !0)
                );
              }
            }
          },
          { passive: !1 },
        ),
      ));
  }
  refresh(e, t) {
    this._renderService?.refreshRows(e, t);
  }
  updateCursorStyle(e) {
    this._selectionService?.shouldColumnSelect(e)
      ? this.element.classList.add(`column-select`)
      : this.element.classList.remove(`column-select`);
  }
  _showCursor() {
    this.coreService.isCursorInitialized ||
      ((this.coreService.isCursorInitialized = !0),
      this.refresh(this.buffer.y, this.buffer.y));
  }
  scrollLines(e, t) {
    (this._viewport ? this._viewport.scrollLines(e) : super.scrollLines(e, t),
      this.refresh(0, this.rows - 1));
  }
  scrollPages(e) {
    this.scrollLines(e * (this.rows - 1));
  }
  scrollToTop() {
    this.scrollLines(-this._bufferService.buffer.ydisp);
  }
  scrollToBottom(e) {
    e && this._viewport
      ? this._viewport.scrollToLine(this.buffer.ybase, !0)
      : this.scrollLines(
          this._bufferService.buffer.ybase - this._bufferService.buffer.ydisp,
        );
  }
  scrollToLine(e) {
    let t = e - this._bufferService.buffer.ydisp;
    t !== 0 && this.scrollLines(t);
  }
  paste(e) {
    Ct(e, this.textarea, this.coreService, this.optionsService);
  }
  attachCustomKeyEventHandler(e) {
    this._customKeyEventHandler = e;
  }
  attachCustomWheelEventHandler(e) {
    this._customWheelEventHandler = e;
  }
  registerLinkProvider(e) {
    return this._linkProviderService.registerLinkProvider(e);
  }
  registerCharacterJoiner(e) {
    if (!this._characterJoinerService)
      throw Error(`Terminal must be opened first`);
    let t = this._characterJoinerService.register(e);
    return (this.refresh(0, this.rows - 1), t);
  }
  deregisterCharacterJoiner(e) {
    if (!this._characterJoinerService)
      throw Error(`Terminal must be opened first`);
    this._characterJoinerService.deregister(e) &&
      this.refresh(0, this.rows - 1);
  }
  get markers() {
    return this.buffer.markers;
  }
  registerMarker(e) {
    return this.buffer.addMarker(this.buffer.ybase + this.buffer.y + e);
  }
  registerDecoration(e) {
    return this._decorationService.registerDecoration(e);
  }
  hasSelection() {
    return this._selectionService ? this._selectionService.hasSelection : !1;
  }
  select(e, t, n) {
    this._selectionService.setSelection(e, t, n);
  }
  getSelection() {
    return this._selectionService ? this._selectionService.selectionText : ``;
  }
  getSelectionPosition() {
    if (!(!this._selectionService || !this._selectionService.hasSelection))
      return {
        start: {
          x: this._selectionService.selectionStart[0],
          y: this._selectionService.selectionStart[1],
        },
        end: {
          x: this._selectionService.selectionEnd[0],
          y: this._selectionService.selectionEnd[1],
        },
      };
  }
  clearSelection() {
    this._selectionService?.clearSelection();
  }
  selectAll() {
    this._selectionService?.selectAll();
  }
  selectLines(e, t) {
    this._selectionService?.selectLines(e, t);
  }
  _keyDown(e) {
    if (
      ((this._keyDownHandled = !1),
      (this._keyDownSeen = !0),
      this._customKeyEventHandler && this._customKeyEventHandler(e) === !1)
    )
      return !1;
    let t = this.browser.isMac && this.options.macOptionIsMeta && e.altKey;
    if (!t && !this._compositionHelper.keydown(e))
      return (
        this.options.scrollOnUserInput &&
          this.buffer.ybase !== this.buffer.ydisp &&
          this.scrollToBottom(!0),
        !1
      );
    !t &&
      (e.key === `Dead` || e.key === `AltGraph`) &&
      (this._unprocessedDeadKey = !0);
    let n = Jc(
      e,
      this.coreService.decPrivateModes.applicationCursorKeys,
      this.browser.isMac,
      this.options.macOptionIsMeta,
    );
    if ((this.updateCursorStyle(e), n.type === 3 || n.type === 2)) {
      let t = this.rows - 1;
      return (this.scrollLines(n.type === 2 ? -t : t), this.cancel(e, !0));
    }
    if (
      (n.type === 1 && this.selectAll(),
      this._isThirdLevelShift(this.browser, e) ||
        (n.cancel && this.cancel(e, !0), !n.key) ||
        (e.key &&
          !e.ctrlKey &&
          !e.altKey &&
          !e.metaKey &&
          e.key.length === 1 &&
          e.key.charCodeAt(0) >= 65 &&
          e.key.charCodeAt(0) <= 90))
    )
      return !0;
    if (this._unprocessedDeadKey) return ((this._unprocessedDeadKey = !1), !0);
    if (
      ((n.key === B.ETX || n.key === B.CR) && (this.textarea.value = ``),
      this._onKey.fire({ key: n.key, domEvent: e }),
      this._showCursor(),
      this.coreService.triggerDataEvent(n.key, !0),
      !this.optionsService.rawOptions.screenReaderMode || e.altKey || e.ctrlKey)
    )
      return this.cancel(e, !0);
    this._keyDownHandled = !0;
  }
  _isThirdLevelShift(e, t) {
    let n =
      (e.isMac &&
        !this.options.macOptionIsMeta &&
        t.altKey &&
        !t.ctrlKey &&
        !t.metaKey) ||
      (e.isWindows && t.altKey && t.ctrlKey && !t.metaKey) ||
      (e.isWindows && t.getModifierState(`AltGraph`));
    return t.type === `keypress` ? n : n && (!t.keyCode || t.keyCode > 47);
  }
  _keyUp(e) {
    ((this._keyDownSeen = !1),
      !(this._customKeyEventHandler && this._customKeyEventHandler(e) === !1) &&
        (cl(e) || this.focus(),
        this.updateCursorStyle(e),
        (this._keyPressHandled = !1)));
  }
  _keyPress(e) {
    let t;
    if (
      ((this._keyPressHandled = !1),
      this._keyDownHandled ||
        (this._customKeyEventHandler && this._customKeyEventHandler(e) === !1))
    )
      return !1;
    if ((this.cancel(e), e.charCode)) t = e.charCode;
    else if (e.which === null || e.which === void 0) t = e.keyCode;
    else if (e.which !== 0 && e.charCode !== 0) t = e.which;
    else return !1;
    return !t ||
      ((e.altKey || e.ctrlKey || e.metaKey) &&
        !this._isThirdLevelShift(this.browser, e))
      ? !1
      : ((t = String.fromCharCode(t)),
        this._onKey.fire({ key: t, domEvent: e }),
        this._showCursor(),
        this.coreService.triggerDataEvent(t, !0),
        (this._keyPressHandled = !0),
        (this._unprocessedDeadKey = !1),
        !0);
  }
  _inputEvent(e) {
    if (
      e.data &&
      e.inputType === `insertText` &&
      (!e.composed || !this._keyDownSeen) &&
      !this.optionsService.rawOptions.screenReaderMode
    ) {
      if (this._keyPressHandled) return !1;
      this._unprocessedDeadKey = !1;
      let t = e.data;
      return (this.coreService.triggerDataEvent(t, !0), this.cancel(e), !0);
    }
    return !1;
  }
  resize(e, t) {
    if (e === this.cols && t === this.rows) {
      this._charSizeService &&
        !this._charSizeService.hasValidSize &&
        this._charSizeService.measure();
      return;
    }
    super.resize(e, t);
  }
  _afterResize(e, t) {
    this._charSizeService?.measure();
  }
  clear() {
    if (!(this.buffer.ybase === 0 && this.buffer.y === 0)) {
      (this.buffer.clearAllMarkers(),
        this.buffer.lines.set(
          0,
          this.buffer.lines.get(this.buffer.ybase + this.buffer.y),
        ),
        (this.buffer.lines.length = 1),
        (this.buffer.ydisp = 0),
        (this.buffer.ybase = 0),
        (this.buffer.y = 0));
      for (let e = 1; e < this.rows; e++)
        this.buffer.lines.push(this.buffer.getBlankLine(X));
      (this._onScroll.fire({ position: this.buffer.ydisp }),
        this.refresh(0, this.rows - 1));
    }
  }
  reset() {
    ((this.options.rows = this.rows), (this.options.cols = this.cols));
    let e = this._customKeyEventHandler;
    (this._setup(),
      super.reset(),
      this._selectionService?.reset(),
      this._decorationService.reset(),
      (this._customKeyEventHandler = e),
      this.refresh(0, this.rows - 1));
  }
  clearTextureAtlas() {
    this._renderService?.clearTextureAtlas();
  }
  _reportFocus() {
    this.element?.classList.contains(`focus`)
      ? this.coreService.triggerDataEvent(B.ESC + `[I`)
      : this.coreService.triggerDataEvent(B.ESC + `[O`);
  }
  _reportWindowsOptions(e) {
    if (this._renderService)
      switch (e) {
        case 0:
          let e = this._renderService.dimensions.css.canvas.width.toFixed(0),
            t = this._renderService.dimensions.css.canvas.height.toFixed(0);
          this.coreService.triggerDataEvent(`${B.ESC}[4;${t};${e}t`);
          break;
        case 1:
          let n = this._renderService.dimensions.css.cell.width.toFixed(0),
            r = this._renderService.dimensions.css.cell.height.toFixed(0);
          this.coreService.triggerDataEvent(`${B.ESC}[6;${r};${n}t`);
          break;
      }
  }
  cancel(e, t) {
    if (!(!this.options.cancelEvents && !t))
      return (e.preventDefault(), e.stopPropagation(), !1);
  }
};
function cl(e) {
  return e.keyCode === 16 || e.keyCode === 17 || e.keyCode === 18;
}
var ll = class {
    constructor() {
      this._addons = [];
    }
    dispose() {
      for (let e = this._addons.length - 1; e >= 0; e--)
        this._addons[e].instance.dispose();
    }
    loadAddon(e, t) {
      let n = { instance: t, dispose: t.dispose, isDisposed: !1 };
      (this._addons.push(n),
        (t.dispose = () => this._wrappedAddonDispose(n)),
        t.activate(e));
    }
    _wrappedAddonDispose(e) {
      if (e.isDisposed) return;
      let t = -1;
      for (let n = 0; n < this._addons.length; n++)
        if (this._addons[n] === e) {
          t = n;
          break;
        }
      if (t === -1)
        throw Error(`Could not dispose an addon that has not been loaded`);
      ((e.isDisposed = !0),
        e.dispose.apply(e.instance),
        this._addons.splice(t, 1));
    }
  },
  ul = class {
    constructor(e) {
      this._line = e;
    }
    get isWrapped() {
      return this._line.isWrapped;
    }
    get length() {
      return this._line.length;
    }
    getCell(e, t) {
      if (!(e < 0 || e >= this._line.length))
        return t
          ? (this._line.loadCell(e, t), t)
          : this._line.loadCell(e, new Pt());
    }
    translateToString(e, t, n) {
      return this._line.translateToString(e, t, n);
    }
  },
  dl = class {
    constructor(e, t) {
      ((this._buffer = e), (this.type = t));
    }
    init(e) {
      return ((this._buffer = e), this);
    }
    get cursorY() {
      return this._buffer.y;
    }
    get cursorX() {
      return this._buffer.x;
    }
    get viewportY() {
      return this._buffer.ydisp;
    }
    get baseY() {
      return this._buffer.ybase;
    }
    get length() {
      return this._buffer.lines.length;
    }
    getLine(e) {
      let t = this._buffer.lines.get(e);
      if (t) return new ul(t);
    }
    getNullCell() {
      return new Pt();
    }
  },
  fl = class extends F {
    constructor(e) {
      (super(),
        (this._core = e),
        (this._onBufferChange = this._register(new L())),
        (this.onBufferChange = this._onBufferChange.event),
        (this._normal = new dl(this._core.buffers.normal, `normal`)),
        (this._alternate = new dl(this._core.buffers.alt, `alternate`)),
        this._core.buffers.onBufferActivate(() =>
          this._onBufferChange.fire(this.active),
        ));
    }
    get active() {
      if (this._core.buffers.active === this._core.buffers.normal)
        return this.normal;
      if (this._core.buffers.active === this._core.buffers.alt)
        return this.alternate;
      throw Error(`Active buffer is neither normal nor alternate`);
    }
    get normal() {
      return this._normal.init(this._core.buffers.normal);
    }
    get alternate() {
      return this._alternate.init(this._core.buffers.alt);
    }
  },
  pl = class {
    constructor(e) {
      this._core = e;
    }
    registerCsiHandler(e, t) {
      return this._core.registerCsiHandler(e, (e) => t(e.toArray()));
    }
    addCsiHandler(e, t) {
      return this.registerCsiHandler(e, t);
    }
    registerDcsHandler(e, t) {
      return this._core.registerDcsHandler(e, (e, n) => t(e, n.toArray()));
    }
    addDcsHandler(e, t) {
      return this.registerDcsHandler(e, t);
    }
    registerEscHandler(e, t) {
      return this._core.registerEscHandler(e, t);
    }
    addEscHandler(e, t) {
      return this.registerEscHandler(e, t);
    }
    registerOscHandler(e, t) {
      return this._core.registerOscHandler(e, t);
    }
    addOscHandler(e, t) {
      return this.registerOscHandler(e, t);
    }
  },
  ml = class {
    constructor(e) {
      this._core = e;
    }
    register(e) {
      this._core.unicodeService.register(e);
    }
    get versions() {
      return this._core.unicodeService.versions;
    }
    get activeVersion() {
      return this._core.unicodeService.activeVersion;
    }
    set activeVersion(e) {
      this._core.unicodeService.activeVersion = e;
    }
  },
  hl = [`cols`, `rows`],
  gl = 0,
  _l = class extends F {
    constructor(e) {
      (super(),
        (this._core = this._register(new sl(e))),
        (this._addonManager = this._register(new ll())),
        (this._publicOptions = { ...this._core.options }));
      let t = (e) => this._core.options[e],
        n = (e, t) => {
          (this._checkReadonlyOptions(e), (this._core.options[e] = t));
        };
      for (let e in this._core.options) {
        let r = { get: t.bind(this, e), set: n.bind(this, e) };
        Object.defineProperty(this._publicOptions, e, r);
      }
    }
    _checkReadonlyOptions(e) {
      if (hl.includes(e))
        throw Error(`Option "${e}" can only be set in the constructor`);
    }
    _checkProposedApi() {
      if (!this._core.optionsService.rawOptions.allowProposedApi)
        throw Error(
          `You must set the allowProposedApi option to true to use proposed API`,
        );
    }
    get onBell() {
      return this._core.onBell;
    }
    get onBinary() {
      return this._core.onBinary;
    }
    get onCursorMove() {
      return this._core.onCursorMove;
    }
    get onData() {
      return this._core.onData;
    }
    get onKey() {
      return this._core.onKey;
    }
    get onLineFeed() {
      return this._core.onLineFeed;
    }
    get onRender() {
      return this._core.onRender;
    }
    get onResize() {
      return this._core.onResize;
    }
    get onScroll() {
      return this._core.onScroll;
    }
    get onSelectionChange() {
      return this._core.onSelectionChange;
    }
    get onTitleChange() {
      return this._core.onTitleChange;
    }
    get onWriteParsed() {
      return this._core.onWriteParsed;
    }
    get element() {
      return this._core.element;
    }
    get parser() {
      return ((this._parser ||= new pl(this._core)), this._parser);
    }
    get unicode() {
      return (this._checkProposedApi(), new ml(this._core));
    }
    get textarea() {
      return this._core.textarea;
    }
    get rows() {
      return this._core.rows;
    }
    get cols() {
      return this._core.cols;
    }
    get buffer() {
      return (
        (this._buffer ||= this._register(new fl(this._core))),
        this._buffer
      );
    }
    get markers() {
      return (this._checkProposedApi(), this._core.markers);
    }
    get modes() {
      let e = this._core.coreService.decPrivateModes,
        t = `none`;
      switch (this._core.coreMouseService.activeProtocol) {
        case `X10`:
          t = `x10`;
          break;
        case `VT200`:
          t = `vt200`;
          break;
        case `DRAG`:
          t = `drag`;
          break;
        case `ANY`:
          t = `any`;
          break;
      }
      return {
        applicationCursorKeysMode: e.applicationCursorKeys,
        applicationKeypadMode: e.applicationKeypad,
        bracketedPasteMode: e.bracketedPasteMode,
        insertMode: this._core.coreService.modes.insertMode,
        mouseTrackingMode: t,
        originMode: e.origin,
        reverseWraparoundMode: e.reverseWraparound,
        sendFocusMode: e.sendFocus,
        synchronizedOutputMode: e.synchronizedOutput,
        wraparoundMode: e.wraparound,
      };
    }
    get options() {
      return this._publicOptions;
    }
    set options(e) {
      for (let t in e) this._publicOptions[t] = e[t];
    }
    blur() {
      this._core.blur();
    }
    focus() {
      this._core.focus();
    }
    input(e, t = !0) {
      this._core.input(e, t);
    }
    resize(e, t) {
      (this._verifyIntegers(e, t), this._core.resize(e, t));
    }
    open(e) {
      this._core.open(e);
    }
    attachCustomKeyEventHandler(e) {
      this._core.attachCustomKeyEventHandler(e);
    }
    attachCustomWheelEventHandler(e) {
      this._core.attachCustomWheelEventHandler(e);
    }
    registerLinkProvider(e) {
      return this._core.registerLinkProvider(e);
    }
    registerCharacterJoiner(e) {
      return (this._checkProposedApi(), this._core.registerCharacterJoiner(e));
    }
    deregisterCharacterJoiner(e) {
      (this._checkProposedApi(), this._core.deregisterCharacterJoiner(e));
    }
    registerMarker(e = 0) {
      return (this._verifyIntegers(e), this._core.registerMarker(e));
    }
    registerDecoration(e) {
      return (
        this._checkProposedApi(),
        this._verifyPositiveIntegers(e.x ?? 0, e.width ?? 0, e.height ?? 0),
        this._core.registerDecoration(e)
      );
    }
    hasSelection() {
      return this._core.hasSelection();
    }
    select(e, t, n) {
      (this._verifyIntegers(e, t, n), this._core.select(e, t, n));
    }
    getSelection() {
      return this._core.getSelection();
    }
    getSelectionPosition() {
      return this._core.getSelectionPosition();
    }
    clearSelection() {
      this._core.clearSelection();
    }
    selectAll() {
      this._core.selectAll();
    }
    selectLines(e, t) {
      (this._verifyIntegers(e, t), this._core.selectLines(e, t));
    }
    dispose() {
      super.dispose();
    }
    scrollLines(e) {
      (this._verifyIntegers(e), this._core.scrollLines(e));
    }
    scrollPages(e) {
      (this._verifyIntegers(e), this._core.scrollPages(e));
    }
    scrollToTop() {
      this._core.scrollToTop();
    }
    scrollToBottom() {
      this._core.scrollToBottom();
    }
    scrollToLine(e) {
      (this._verifyIntegers(e), this._core.scrollToLine(e));
    }
    clear() {
      this._core.clear();
    }
    write(e, t) {
      this._core.write(e, t);
    }
    writeln(e, t) {
      (this._core.write(e),
        this._core.write(
          `\r
`,
          t,
        ));
    }
    paste(e) {
      this._core.paste(e);
    }
    refresh(e, t) {
      (this._verifyIntegers(e, t), this._core.refresh(e, t));
    }
    reset() {
      this._core.reset();
    }
    clearTextureAtlas() {
      this._core.clearTextureAtlas();
    }
    loadAddon(e) {
      this._addonManager.loadAddon(this, e);
    }
    static get strings() {
      return {
        get promptLabel() {
          return gt.get();
        },
        set promptLabel(e) {
          gt.set(e);
        },
        get tooMuchOutput() {
          return vt.get();
        },
        set tooMuchOutput(e) {
          vt.set(e);
        },
      };
    }
    _verifyIntegers(...e) {
      for (gl of e)
        if (gl === 1 / 0 || isNaN(gl) || gl % 1 != 0)
          throw Error(`This API only accepts integers`);
    }
    _verifyPositiveIntegers(...e) {
      for (gl of e)
        if (gl && (gl === 1 / 0 || isNaN(gl) || gl % 1 != 0 || gl < 0))
          throw Error(`This API only accepts positive integers`);
    }
  },
  vl = 2,
  yl = 1,
  bl = class {
    activate(e) {
      this._terminal = e;
    }
    dispose() {}
    fit() {
      let e = this.proposeDimensions();
      if (!e || !this._terminal || isNaN(e.cols) || isNaN(e.rows)) return;
      let t = this._terminal._core;
      (this._terminal.rows !== e.rows || this._terminal.cols !== e.cols) &&
        (t._renderService.clear(), this._terminal.resize(e.cols, e.rows));
    }
    proposeDimensions() {
      if (
        !this._terminal ||
        !this._terminal.element ||
        !this._terminal.element.parentElement
      )
        return;
      let e = this._terminal._core._renderService.dimensions;
      if (e.css.cell.width === 0 || e.css.cell.height === 0) return;
      let t =
          this._terminal.options.scrollback === 0
            ? 0
            : this._terminal.options.overviewRuler?.width || 14,
        n = window.getComputedStyle(this._terminal.element.parentElement),
        r = parseInt(n.getPropertyValue(`height`)),
        i = Math.max(0, parseInt(n.getPropertyValue(`width`))),
        a = window.getComputedStyle(this._terminal.element),
        o = {
          top: parseInt(a.getPropertyValue(`padding-top`)),
          bottom: parseInt(a.getPropertyValue(`padding-bottom`)),
          right: parseInt(a.getPropertyValue(`padding-right`)),
          left: parseInt(a.getPropertyValue(`padding-left`)),
        },
        s = o.top + o.bottom,
        c = o.right + o.left,
        l = r - s,
        u = i - c - t;
      return {
        cols: Math.max(vl, Math.floor(u / e.css.cell.width)),
        rows: Math.max(yl, Math.floor(l / e.css.cell.height)),
      };
    }
  },
  xl = class {
    constructor(e, t, n, r = {}) {
      ((this._terminal = e),
        (this._regex = t),
        (this._handler = n),
        (this._options = r));
    }
    provideLinks(e, t) {
      let n = Cl.computeLink(e, this._regex, this._terminal, this._handler);
      t(this._addCallbacks(n));
    }
    _addCallbacks(e) {
      return e.map(
        (e) => (
          (e.leave = this._options.leave),
          (e.hover = (t, n) => {
            if (this._options.hover) {
              let { range: r } = e;
              this._options.hover(t, n, r);
            }
          }),
          e
        ),
      );
    }
  };
function Sl(e) {
  try {
    let t = new URL(e),
      n =
        t.password && t.username
          ? `${t.protocol}//${t.username}:${t.password}@${t.host}`
          : t.username
            ? `${t.protocol}//${t.username}@${t.host}`
            : `${t.protocol}//${t.host}`;
    return e.toLocaleLowerCase().startsWith(n.toLocaleLowerCase());
  } catch {
    return !1;
  }
}
var Cl = class e {
    static computeLink(t, n, r, i) {
      let a = new RegExp(n.source, (n.flags || ``) + `g`),
        [o, s] = e._getWindowedLineStrings(t - 1, r),
        c = o.join(``),
        l,
        u = [];
      for (; (l = a.exec(c)); ) {
        let t = l[0];
        if (!Sl(t)) continue;
        let [n, a] = e._mapStrIdx(r, s, 0, l.index),
          [o, c] = e._mapStrIdx(r, n, a, t.length);
        if (n === -1 || a === -1 || o === -1 || c === -1) continue;
        let d = { start: { x: a + 1, y: n + 1 }, end: { x: c, y: o + 1 } };
        u.push({ range: d, text: t, activate: i });
      }
      return u;
    }
    static _getWindowedLineStrings(e, t) {
      let n,
        r = e,
        i = e,
        a = 0,
        o = ``,
        s = [];
      if ((n = t.buffer.active.getLine(e))) {
        let e = n.translateToString(!0);
        if (n.isWrapped && e[0] !== ` `) {
          for (
            a = 0;
            (n = t.buffer.active.getLine(--r)) &&
            a < 2048 &&
            ((o = n.translateToString(!0)),
            (a += o.length),
            s.push(o),
            !(!n.isWrapped || o.indexOf(` `) !== -1));
          );
          s.reverse();
        }
        for (
          s.push(e), a = 0;
          (n = t.buffer.active.getLine(++i)) &&
          n.isWrapped &&
          a < 2048 &&
          ((o = n.translateToString(!0)),
          (a += o.length),
          s.push(o),
          o.indexOf(` `) === -1);
        );
      }
      return [s, r];
    }
    static _mapStrIdx(e, t, n, r) {
      let i = e.buffer.active,
        a = i.getNullCell(),
        o = n;
      for (; r; ) {
        let e = i.getLine(t);
        if (!e) return [-1, -1];
        for (let n = o; n < e.length; ++n) {
          e.getCell(n, a);
          let o = a.getChars();
          if (
            a.getWidth() &&
            ((r -= o.length || 1), n === e.length - 1 && o === ``)
          ) {
            let e = i.getLine(t + 1);
            e &&
              e.isWrapped &&
              (e.getCell(0, a), a.getWidth() === 2 && (r += 1));
          }
          if (r < 0) return [t, n];
        }
        (t++, (o = 0));
      }
      return [t, o];
    }
  },
  wl =
    /(https?|HTTPS?):[/]{2}[^\s"'!*(){}|\\\^<>`]*[^\s"':,.!?{}|\\\^~\[\]`()<>]/;
function Tl(e, t) {
  let n = window.open();
  if (n) {
    try {
      n.opener = null;
    } catch {}
    n.location.href = t;
  } else console.warn(`Opening link blocked as opener could not be cleared`);
}
var El = class {
    constructor(e = Tl, t = {}) {
      ((this._handler = e), (this._options = t));
    }
    activate(e) {
      this._terminal = e;
      let t = this._options,
        n = t.urlRegex || wl;
      this._linkProvider = this._terminal.registerLinkProvider(
        new xl(this._terminal, n, this._handler, t),
      );
    }
    dispose() {
      this._linkProvider?.dispose();
    }
  },
  Dl = 3,
  Ol = 1e3;
function kl(e, t, n) {
  let r = e.getPropertyValue(t).trim();
  return `rgb(${(r.length > 0 ? r : n).split(/\s+/).join(`, `)})`;
}
function Al(e, t, n, r) {
  let i = e.getPropertyValue(t).trim();
  return `rgba(${(i.length > 0 ? i : r).split(/\s+/).join(`, `)}, ${n})`;
}
function jl(e) {
  return typeof e != `object` || !e || !(`type` in e)
    ? !1
    : Object.assign({}, e).type === `control`;
}
function Ml({ sessionId: e, sandboxId: t, isActive: n, devCommand: r }) {
  let i = (0, k.useRef)(null),
    [a, c] = (0, k.useState)(!1),
    [l, u] = (0, k.useState)(null),
    [d, f] = (0, k.useState)(0),
    p = (0, k.useRef)(null),
    m = (0, k.useRef)(null),
    h = (0, k.useRef)(null),
    g = (0, k.useRef)(!1),
    v = (0, k.useRef)(0),
    y = s(o.pty.connectPty),
    b = s(o.pty.resizePty),
    x = e,
    ee = (0, k.useRef)(b);
  ee.current = b;
  let S = (0, k.useCallback)(
    async (e, t) => {
      let { wsUrl: n, isNewPty: i } = await y({
        sessionId: x,
        cols: e.cols,
        rows: e.rows,
      });
      if (!t.current) return;
      let a = new WebSocket(n);
      ((a.binaryType = `arraybuffer`), (h.current = a));
      let o = new TextDecoder();
      ((a.onopen = () => {
        v.current = 0;
      }),
        (a.onmessage = (e) => {
          if (p.current)
            if (typeof e.data == `string`) {
              try {
                let t = JSON.parse(e.data);
                if (jl(t)) {
                  if (t.status === `connected`) {
                    (p.current.writeln(`\x1B[32m* Connected to sandbox\x1B[0m\r
`),
                      i &&
                        r &&
                        a.readyState === WebSocket.OPEN &&
                        (p.current
                          .writeln(`\x1B[33m* Starting dev server...\x1B[0m\r
`),
                        setTimeout(() => {
                          a.readyState === WebSocket.OPEN && a.send(r + `\r`);
                        }, 300)));
                    return;
                  }
                  if (t.status === `error`) {
                    p.current.writeln(
                      `\x1b[31m* Error: ${t.error ?? `unknown`}\x1b[0m`,
                    );
                    return;
                  }
                  return;
                }
              } catch {}
              p.current.write(e.data);
            } else p.current.write(o.decode(e.data, { stream: !0 }));
        }),
        (a.onclose = () => {
          !t.current ||
            g.current ||
            v.current >= Dl ||
            (v.current++,
            p.current &&
              p.current.writeln(
                `\r\n\x1b[33m* Reconnecting (${v.current}/${Dl})...\x1b[0m`,
              ),
            setTimeout(() => {
              t.current && p.current && S(p.current, t).catch(() => {});
            }, Ol));
        }),
        e.onData((e) => {
          a.readyState === WebSocket.OPEN && a.send(e);
        }));
    },
    [y, x, r],
  );
  return (
    (0, k.useEffect)(() => {
      if (!n || !t || !i.current) return;
      let e = { current: !0 },
        r = i.current;
      return (
        (async () => {
          (c(!0), u(null), (g.current = !1), (v.current = 0));
          try {
            ((h.current &&= ((g.current = !0), h.current.close(), null)),
              p.current && p.current.dispose());
            let t = getComputedStyle(document.documentElement),
              n = new _l({
                cursorBlink: !0,
                fontSize: 13,
                fontFamily: `Menlo, Monaco, 'Courier New', monospace`,
                theme: {
                  background: kl(t, `--card`, `17 24 39`),
                  foreground: kl(t, `--foreground`, `226 232 240`),
                  cursor: kl(t, `--primary`, `16 145 130`),
                  cursorAccent: kl(t, `--card`, `17 24 39`),
                  selectionBackground: Al(t, `--primary`, 0.26, `16 145 130`),
                },
                allowProposedApi: !0,
              }),
              i = new bl(),
              a = new El();
            (n.loadAddon(i),
              n.loadAddon(a),
              n.open(r),
              (p.current = n),
              (m.current = i),
              await new Promise((e) => {
                setTimeout(() => {
                  (i.fit(), e());
                }, 0);
              }));
            for (let e = 0; e < n.rows - 1; e++) n.writeln(``);
            (n.writeln(`\x1B[33m* Connecting to sandbox...\x1B[0m`),
              await S(n, e));
          } catch (t) {
            e.current &&
              u(
                t instanceof Error
                  ? t.message
                  : `Failed to initialize terminal`,
              );
          } finally {
            e.current && c(!1);
          }
        })(),
        () => {
          ((e.current = !1),
            (g.current = !0),
            (h.current &&= (h.current.close(), null)),
            (p.current &&= (p.current.dispose(), null)));
        }
      );
    }, [n, t, x, d, S]),
    (0, k.useEffect)(() => {
      if (!i.current) return;
      let e = i.current,
        t = new ResizeObserver((e) => {
          let t = e[0];
          if (
            !(!t || t.contentRect.width === 0 || t.contentRect.height === 0) &&
            m.current &&
            p.current
          ) {
            m.current.fit();
            let { cols: e, rows: t } = p.current;
            ee.current({ sessionId: x, cols: e, rows: t }).catch(() => {});
          }
        });
      return (t.observe(e), () => t.disconnect());
    }, [x]),
    !n || !t
      ? (0, A.jsxs)(`div`, {
          className: `flex h-full flex-col items-center justify-center gap-3 text-muted-foreground`,
          children: [
            (0, A.jsx)(xe, { className: `h-12 w-12 opacity-50` }),
            (0, A.jsx)(`p`, {
              className: `text-sm`,
              children: n
                ? `Waiting for sandbox...`
                : `Start the sandbox to use the terminal`,
            }),
          ],
        })
      : l
        ? (0, A.jsxs)(`div`, {
            className: `flex h-full flex-col items-center justify-center gap-3 text-muted-foreground`,
            children: [
              (0, A.jsx)(`p`, {
                className: `text-sm text-destructive`,
                children: l,
              }),
              (0, A.jsxs)(O, {
                size: `sm`,
                variant: `secondary`,
                onClick: () => f((e) => e + 1),
                children: [(0, A.jsx)(He, { className: `h-4 w-4` }), `Retry`],
              }),
            ],
          })
        : (0, A.jsxs)(`div`, {
            className: `relative flex h-full flex-col bg-card`,
            children: [
              a &&
                (0, A.jsx)(`div`, {
                  className: `absolute inset-0 z-10 flex items-center justify-center bg-card`,
                  children: (0, A.jsx)(_, { size: `lg` }),
                }),
              (0, A.jsx)(`div`, { ref: i, className: `min-h-0 flex-1` }),
            ],
          })
  );
}
function Nl(e) {
  let t = (0, lt.c)(8),
    {
      previewInfo: n,
      isLoading: r,
      onRefresh: i,
      containerRef: a,
      port: o,
      onPortChange: s,
    } = e,
    { iframeRef: c } = _e(),
    l = n?.url ?? null,
    u;
  return (
    t[0] !== a ||
    t[1] !== c ||
    t[2] !== r ||
    t[3] !== s ||
    t[4] !== i ||
    t[5] !== o ||
    t[6] !== l
      ? ((u = (0, A.jsx)(ne, {
          children: (0, A.jsx)(Be, {
            previewUrl: l,
            iframeRef: c,
            containerRef: a,
            port: o,
            onPortChange: s,
            isLoading: r,
            onRefresh: i,
          }),
        })),
        (t[0] = a),
        (t[1] = c),
        (t[2] = r),
        (t[3] = s),
        (t[4] = i),
        (t[5] = o),
        (t[6] = l),
        (t[7] = u))
      : (u = t[7]),
    u
  );
}
function Pl(e) {
  let t = (0, lt.c)(22),
    {
      isActive: n,
      sandboxId: r,
      previewInfo: i,
      isLoading: a,
      error: o,
      iframeKey: s,
      onRefresh: c,
      port: l,
      onPortChange: u,
    } = e,
    d = (0, k.useRef)(null);
  if (!n || !r) {
    let e;
    t[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((e = (0, A.jsx)(We, { className: `w-12 h-12 opacity-50` })),
        (t[0] = e))
      : (e = t[0]);
    let r = n
        ? `Waiting for sandbox...`
        : `Start the sandbox to preview your app`,
      i;
    return (
      t[1] === r
        ? (i = t[2])
        : ((i = (0, A.jsx)(`div`, {
            className: `h-full flex flex-col`,
            children: (0, A.jsxs)(`div`, {
              className: `flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3`,
              children: [
                e,
                (0, A.jsx)(`p`, { className: `text-sm`, children: r }),
              ],
            }),
          })),
          (t[1] = r),
          (t[2] = i)),
      i
    );
  }
  let f = i?.url ?? ``,
    p;
  t[3] !== a || t[4] !== u || t[5] !== c || t[6] !== l || t[7] !== i
    ? ((p = (0, A.jsx)(Nl, {
        previewInfo: i,
        isLoading: a,
        onRefresh: c,
        containerRef: d,
        port: l,
        onPortChange: u,
      })),
      (t[3] = a),
      (t[4] = u),
      (t[5] = c),
      (t[6] = l),
      (t[7] = i),
      (t[8] = p))
    : (p = t[8]);
  let h = i?.url,
    g;
  t[9] !== o || t[10] !== a || t[11] !== c || t[12] !== i
    ? ((g =
        a && !i
          ? (0, A.jsx)(`div`, {
              className: `absolute inset-0 flex items-center justify-center bg-secondary z-10`,
              children: (0, A.jsx)(_, { size: `lg` }),
            })
          : o
            ? (0, A.jsxs)(`div`, {
                className: `absolute inset-0 flex flex-col items-center justify-center gap-3`,
                children: [
                  (0, A.jsx)(`p`, {
                    className: `text-sm text-destructive`,
                    children: o,
                  }),
                  (0, A.jsxs)(O, {
                    size: `sm`,
                    variant: `secondary`,
                    onClick: c,
                    children: [
                      (0, A.jsx)(He, { className: `w-4 h-4` }),
                      `Retry`,
                    ],
                  }),
                ],
              })
            : void 0),
      (t[9] = o),
      (t[10] = a),
      (t[11] = c),
      (t[12] = i),
      (t[13] = g))
    : (g = t[13]);
  let v;
  t[14] !== s || t[15] !== h || t[16] !== g
    ? ((v = (0, A.jsx)(m, { src: h, loading: g }, s)),
      (t[14] = s),
      (t[15] = h),
      (t[16] = g),
      (t[17] = v))
    : (v = t[17]);
  let y;
  return (
    t[18] !== f || t[19] !== p || t[20] !== v
      ? ((y = (0, A.jsxs)(C, {
          ref: d,
          defaultUrl: f,
          className: `h-full rounded-none border-0`,
          children: [p, v],
        })),
        (t[18] = f),
        (t[19] = p),
        (t[20] = v),
        (t[21] = y))
      : (y = t[21]),
    y
  );
}
function Fl(e) {
  try {
    let t = new URL(e);
    return (t.protocol === `http:` && (t.protocol = `https:`), t.toString());
  } catch {
    return e;
  }
}
function Il(e) {
  let t = (t) => `conductor:${e}:${t}`;
  return {
    get(e) {
      try {
        let n = sessionStorage.getItem(t(e));
        return n ? JSON.parse(n).url : null;
      } catch {
        return null;
      }
    },
    set(e, n) {
      sessionStorage.setItem(t(e), JSON.stringify({ url: n }));
    },
    clear(e) {
      sessionStorage.removeItem(t(e));
    },
  };
}
var Ll = Il(`editor`);
function Rl(e) {
  let t = (0, lt.c)(38),
    { sessionId: n, sandboxId: r, isActive: i, repoId: a } = e,
    [c, l] = (0, k.useState)(null),
    [u, d] = (0, k.useState)(`idle`),
    [f, p] = (0, k.useState)(null),
    m = (0, k.useRef)(void 0),
    h = (0, k.useRef)(0),
    g = s(o.daytona.getPreviewUrl),
    v = s(o.daytona.toggleCodeServer),
    y;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((y = () => {
        (clearTimeout(m.current), (m.current = void 0));
      }),
      (t[0] = y))
    : (y = t[0]);
  let b = y,
    x;
  t[1] !== g || t[2] !== i || t[3] !== a || t[4] !== r || t[5] !== n
    ? ((x = async () => {
        if (!r || !i) return;
        h.current = 0;
        let e = async () => {
          try {
            let t = await g({
              sandboxId: r,
              port: 8080,
              checkReady: !0,
              repoId: a,
            });
            if (t.ready) {
              (await Le(t.url), l(t.url), d(`running`), Ll.set(n, t.url));
              return;
            }
            if (((h.current += 1), h.current >= 20)) {
              (p(`Editor failed to start. Check sandbox logs.`), d(`error`));
              return;
            }
            m.current = setTimeout(e, 3e3);
          } catch (e) {
            let t = e;
            (p(t instanceof Error ? t.message : `Failed to load editor`),
              d(`error`));
          }
        };
        e();
      }),
      (t[1] = g),
      (t[2] = i),
      (t[3] = a),
      (t[4] = r),
      (t[5] = n),
      (t[6] = x))
    : (x = t[6]);
  let ee = x,
    S;
  t[7] !== g ||
  t[8] !== ee ||
  t[9] !== a ||
  t[10] !== r ||
  t[11] !== n ||
  t[12] !== v
    ? ((S = async () => {
        if (r) {
          (d(`starting`), p(null), l(null), b());
          try {
            let e = await g({
              sandboxId: r,
              port: 8080,
              checkReady: !0,
              repoId: a,
            });
            if (e.ready) {
              (await Le(e.url), l(e.url), d(`running`), Ll.set(n, e.url));
              return;
            }
            (await v({ sandboxId: r, repoId: a, action: `start` }), await ee());
          } catch (e) {
            let t = e;
            (p(t instanceof Error ? t.message : `Failed to start editor`),
              d(`error`));
          }
        }
      }),
      (t[7] = g),
      (t[8] = ee),
      (t[9] = a),
      (t[10] = r),
      (t[11] = n),
      (t[12] = v),
      (t[13] = S))
    : (S = t[13]);
  let C = S,
    te,
    ne;
  if (
    (t[14] !== u || t[15] !== i || t[16] !== r || t[17] !== n
      ? ((te = () => {
          if (i && r && u === `idle`) {
            let e = Ll.get(n);
            e && (l(e), d(`running`));
          }
          return (i || Ll.clear(n), b);
        }),
        (ne = [i, r, u, b, n]),
        (t[14] = u),
        (t[15] = i),
        (t[16] = r),
        (t[17] = n),
        (t[18] = te),
        (t[19] = ne))
      : ((te = t[18]), (ne = t[19])),
    (0, k.useEffect)(te, ne),
    !i || !r)
  ) {
    let e;
    return (
      t[20] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground gap-3`,
            children: [
              (0, A.jsx)(Oe, { className: `w-12 h-12 opacity-50` }),
              (0, A.jsx)(`p`, {
                className: `text-sm`,
                children: `Start the sandbox to use the editor`,
              }),
            ],
          })),
          (t[20] = e))
        : (e = t[20]),
      e
    );
  }
  if (u === `idle`) {
    let e, n;
    t[21] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((e = (0, A.jsx)(Oe, { className: `w-12 h-12 opacity-50` })),
        (n = (0, A.jsx)(`p`, {
          className: `text-sm`,
          children: `Editor is not running`,
        })),
        (t[21] = e),
        (t[22] = n))
      : ((e = t[21]), (n = t[22]));
    let r;
    return (
      t[23] === C
        ? (r = t[24])
        : ((r = (0, A.jsxs)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground gap-3`,
            children: [
              e,
              n,
              (0, A.jsx)(O, {
                size: `sm`,
                variant: `secondary`,
                onClick: C,
                children: `Start Editor`,
              }),
            ],
          })),
          (t[23] = C),
          (t[24] = r)),
      r
    );
  }
  let w;
  t[25] === u
    ? (w = t[26])
    : ((w =
        u === `starting` &&
        (0, A.jsxs)(`div`, {
          className: `absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3`,
          children: [
            (0, A.jsx)(_, { size: `lg` }),
            (0, A.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `Starting editor...`,
            }),
          ],
        })),
      (t[25] = u),
      (t[26] = w));
  let re;
  t[27] !== u || t[28] !== f || t[29] !== C
    ? ((re =
        u === `error` &&
        (0, A.jsxs)(`div`, {
          className: `absolute inset-0 flex flex-col items-center justify-center gap-3 z-10`,
          children: [
            (0, A.jsx)(`p`, {
              className: `text-sm text-destructive`,
              children: f,
            }),
            (0, A.jsxs)(O, {
              size: `sm`,
              variant: `secondary`,
              onClick: C,
              children: [
                (0, A.jsx)(He, { className: `w-4 h-4 mr-1` }),
                `Retry`,
              ],
            }),
          ],
        })),
      (t[27] = u),
      (t[28] = f),
      (t[29] = C),
      (t[30] = re))
    : (re = t[30]);
  let T;
  t[31] !== u || t[32] !== c
    ? ((T =
        c &&
        u === `running` &&
        (0, A.jsx)(`iframe`, {
          src: Fl(c),
          className: `absolute inset-0 w-full h-full border-0`,
          allow: `clipboard-read; clipboard-write`,
        })),
      (t[31] = u),
      (t[32] = c),
      (t[33] = T))
    : (T = t[33]);
  let ie;
  return (
    t[34] !== w || t[35] !== re || t[36] !== T
      ? ((ie = (0, A.jsx)(`div`, {
          className: `h-full flex flex-col`,
          children: (0, A.jsxs)(`div`, {
            className: `flex-1 min-h-0 relative`,
            children: [w, re, T],
          }),
        })),
        (t[34] = w),
        (t[35] = re),
        (t[36] = T),
        (t[37] = ie))
      : (ie = t[37]),
    ie
  );
}
var zl = Il(`desktop`);
function Bl(e) {
  let t = new URL(e);
  return (
    (t.pathname = t.pathname.replace(/\/?$/, `/vnc_lite.html`)),
    t.searchParams.set(`autoconnect`, `true`),
    t.searchParams.set(`resize`, `scale`),
    t.searchParams.set(`quality`, `6`),
    t.searchParams.set(`compression`, `2`),
    t.toString()
  );
}
function Vl(e) {
  let t = (0, lt.c)(55),
    { sessionId: n, sandboxId: r, isActive: i, repoId: a } = e,
    [c, l] = (0, k.useState)(null),
    [u, d] = (0, k.useState)(`idle`),
    [f, p] = (0, k.useState)(null),
    [, m] = (0, k.useState)(!1),
    h = (0, k.useRef)(void 0),
    g = (0, k.useRef)(0),
    v = (0, k.useRef)(null),
    y = s(o.daytona.getPreviewUrl),
    b = s(o.daytona.toggleDesktopServer),
    x = s(o.daytona.launchChromeInDesktop),
    ee;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ee = () => {
        (clearTimeout(h.current), (h.current = void 0));
      }),
      (t[0] = ee))
    : (ee = t[0]);
  let S = ee,
    C;
  t[1] !== y ||
  t[2] !== i ||
  t[3] !== x ||
  t[4] !== a ||
  t[5] !== r ||
  t[6] !== n
    ? ((C = async () => {
        if (!r || !i) return;
        g.current = 0;
        let e = async () => {
          try {
            let t = await y({
              sandboxId: r,
              port: 6080,
              checkReady: !0,
              repoId: a,
            });
            if (t.ready) {
              await Le(t.url);
              let e = Bl(t.url);
              (l(e),
                d(`running`),
                zl.set(n, e),
                x({ sandboxId: r, repoId: a }).catch(Ul));
              return;
            }
            if (((g.current += 1), g.current >= 40)) {
              (p(`Desktop environment failed to start. Check sandbox logs.`),
                d(`error`));
              return;
            }
            h.current = setTimeout(e, 3e3);
          } catch (e) {
            let t = e;
            (p(t instanceof Error ? t.message : `Failed to load desktop`),
              d(`error`));
          }
        };
        e();
      }),
      (t[1] = y),
      (t[2] = i),
      (t[3] = x),
      (t[4] = a),
      (t[5] = r),
      (t[6] = n),
      (t[7] = C))
    : (C = t[7]);
  let te = C,
    ne;
  t[8] !== y ||
  t[9] !== x ||
  t[10] !== te ||
  t[11] !== a ||
  t[12] !== r ||
  t[13] !== n ||
  t[14] !== b
    ? ((ne = async () => {
        if (r) {
          (d(`starting`), p(null), l(null), S());
          try {
            let e = await y({
              sandboxId: r,
              port: 6080,
              checkReady: !0,
              repoId: a,
            });
            if (e.ready) {
              await Le(e.url);
              let t = Bl(e.url);
              (l(t),
                d(`running`),
                zl.set(n, t),
                x({ sandboxId: r, repoId: a }).catch(Hl));
              return;
            }
            (await b({ sandboxId: r, repoId: a, action: `start` }), await te());
          } catch (e) {
            let t = e;
            (p(t instanceof Error ? t.message : `Failed to start desktop`),
              d(`error`));
          }
        }
      }),
      (t[8] = y),
      (t[9] = x),
      (t[10] = te),
      (t[11] = a),
      (t[12] = r),
      (t[13] = n),
      (t[14] = b),
      (t[15] = ne))
    : (ne = t[15]);
  let w = ne,
    re;
  t[16] !== a || t[17] !== r || t[18] !== n || t[19] !== b
    ? ((re = async () => {
        if (r) {
          (S(), d(`idle`), l(null), p(null), zl.clear(n));
          try {
            await b({ sandboxId: r, repoId: a, action: `stop` });
          } catch {}
        }
      }),
      (t[16] = a),
      (t[17] = r),
      (t[18] = n),
      (t[19] = b),
      (t[20] = re))
    : (re = t[20]);
  let T = re,
    ie,
    ae;
  (t[21] !== u || t[22] !== i || t[23] !== r || t[24] !== n
    ? ((ie = () => {
        if (i && r && u === `idle`) {
          let e = zl.get(n);
          e && (l(e), d(`running`));
        }
        return (i || zl.clear(n), S);
      }),
      (ae = [i, r, u, S, n]),
      (t[21] = u),
      (t[22] = i),
      (t[23] = r),
      (t[24] = n),
      (t[25] = ie),
      (t[26] = ae))
    : ((ie = t[25]), (ae = t[26])),
    (0, k.useEffect)(ie, ae));
  let oe;
  t[27] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((oe = () => {
        v.current &&
          (document.fullscreenElement
            ? (document.exitFullscreen(), m(!1))
            : (v.current.requestFullscreen(), m(!0)));
      }),
      (t[27] = oe))
    : (oe = t[27]);
  let E = oe,
    se,
    ce;
  if (
    (t[28] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((se = () => {
          let e = () => {
            m(!!document.fullscreenElement);
          };
          return (
            document.addEventListener(`fullscreenchange`, e),
            () => document.removeEventListener(`fullscreenchange`, e)
          );
        }),
        (ce = []),
        (t[28] = se),
        (t[29] = ce))
      : ((se = t[28]), (ce = t[29])),
    (0, k.useEffect)(se, ce),
    !i || !r)
  ) {
    let e;
    return (
      t[30] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, A.jsxs)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground gap-3`,
            children: [
              (0, A.jsx)(ke, { className: `w-12 h-12 opacity-50` }),
              (0, A.jsx)(`p`, {
                className: `text-sm`,
                children: `Start the sandbox to use the desktop`,
              }),
            ],
          })),
          (t[30] = e))
        : (e = t[30]),
      e
    );
  }
  if (u === `idle`) {
    let e, n;
    t[31] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((e = (0, A.jsx)(ke, { className: `w-12 h-12 opacity-50` })),
        (n = (0, A.jsx)(`p`, {
          className: `text-sm`,
          children: `Desktop is not running`,
        })),
        (t[31] = e),
        (t[32] = n))
      : ((e = t[31]), (n = t[32]));
    let r;
    return (
      t[33] === w
        ? (r = t[34])
        : ((r = (0, A.jsxs)(`div`, {
            className: `h-full flex flex-col items-center justify-center text-muted-foreground gap-3`,
            children: [
              e,
              n,
              (0, A.jsx)(O, {
                size: `sm`,
                variant: `secondary`,
                onClick: w,
                children: `Start Desktop`,
              }),
            ],
          })),
          (t[33] = w),
          (t[34] = r)),
      r
    );
  }
  let le;
  t[35] !== u || t[36] !== T || t[37] !== c
    ? ((le =
        c &&
        u === `running` &&
        (0, A.jsxs)(`div`, {
          className: `flex items-center justify-end gap-1 pb-1 mb-1 px-2 py-1`,
          children: [
            (0, A.jsx)(O, {
              size: `icon`,
              variant: `ghost`,
              className: `size-8`,
              onClick: E,
              children: (0, A.jsx)(ze, { className: `w-4 h-4` }),
            }),
            (0, A.jsx)(O, {
              size: `icon`,
              variant: `ghost`,
              className: `size-8`,
              asChild: !0,
              children: (0, A.jsx)(`a`, {
                href: c,
                target: `_blank`,
                rel: `noopener noreferrer`,
                children: (0, A.jsx)(Ae, { className: `w-4 h-4` }),
              }),
            }),
            (0, A.jsx)(O, {
              size: `icon`,
              variant: `ghost`,
              className: `size-8 text-destructive hover:bg-destructive/10`,
              onClick: T,
              children: (0, A.jsx)(be, { className: `w-4 h-4` }),
            }),
          ],
        })),
      (t[35] = u),
      (t[36] = T),
      (t[37] = c),
      (t[38] = le))
    : (le = t[38]);
  let ue;
  t[39] === u
    ? (ue = t[40])
    : ((ue =
        u === `starting` &&
        (0, A.jsxs)(`div`, {
          className: `absolute inset-0 flex flex-col items-center justify-center bg-secondary z-10 gap-3`,
          children: [
            (0, A.jsx)(_, { size: `lg` }),
            (0, A.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `Starting desktop environment...`,
            }),
          ],
        })),
      (t[39] = u),
      (t[40] = ue));
  let de;
  t[41] !== u || t[42] !== f || t[43] !== w
    ? ((de =
        u === `error` &&
        (0, A.jsxs)(`div`, {
          className: `absolute inset-0 flex flex-col items-center justify-center gap-3 z-10`,
          children: [
            (0, A.jsx)(`p`, {
              className: `text-sm text-destructive`,
              children: f,
            }),
            (0, A.jsxs)(O, {
              size: `sm`,
              variant: `secondary`,
              onClick: w,
              children: [
                (0, A.jsx)(He, { className: `w-4 h-4 mr-1` }),
                `Retry`,
              ],
            }),
          ],
        })),
      (t[41] = u),
      (t[42] = f),
      (t[43] = w),
      (t[44] = de))
    : (de = t[44]);
  let D;
  t[45] !== u || t[46] !== c
    ? ((D =
        c &&
        u === `running` &&
        (0, A.jsx)(`iframe`, {
          src: Fl(c),
          className: `absolute inset-0 w-full h-full border-0`,
          allow: `clipboard-read; clipboard-write`,
        })),
      (t[45] = u),
      (t[46] = c),
      (t[47] = D))
    : (D = t[47]);
  let fe;
  t[48] !== ue || t[49] !== de || t[50] !== D
    ? ((fe = (0, A.jsxs)(`div`, {
        className: `flex-1 min-h-0 relative`,
        children: [ue, de, D],
      })),
      (t[48] = ue),
      (t[49] = de),
      (t[50] = D),
      (t[51] = fe))
    : (fe = t[51]);
  let pe;
  return (
    t[52] !== le || t[53] !== fe
      ? ((pe = (0, A.jsxs)(`div`, {
          className: `h-full flex flex-col`,
          ref: v,
          children: [le, fe],
        })),
        (t[52] = le),
        (t[53] = fe),
        (t[54] = pe))
      : (pe = t[54]),
    pe
  );
}
function Hl() {}
function Ul() {}
var Wl = new Set([`preview`, `desktop`, `editor`, `terminal`]),
  Gl = [
    { value: `preview`, label: `Preview`, icon: We },
    { value: `desktop`, label: `Computer`, icon: ke },
    { value: `editor`, label: `Editor`, icon: Oe },
    { value: `terminal`, label: `Terminal`, icon: xe },
  ];
function Kl(e) {
  return Wl.has(e);
}
function ql(e) {
  let t = (0, lt.c)(9),
    { activeTab: n, onTabChange: r } = e,
    i;
  t[0] === r
    ? (i = t[1])
    : ((i = (e) => {
        Kl(e) && r(e);
      }),
      (t[0] = r),
      (t[1] = i));
  let a;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = (0, A.jsx)(re, {
        className: `h-auto gap-0 rounded-none border-0 bg-transparent p-0 shadow-none`,
        children: Gl.map(Jl),
      })),
      (t[2] = a))
    : (a = t[2]);
  let o;
  t[3] !== n || t[4] !== i
    ? ((o = (0, A.jsx)(h, { value: n, onValueChange: i, children: a })),
      (t[3] = n),
      (t[4] = i),
      (t[5] = o))
    : (o = t[5]);
  let s;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, A.jsx)(`div`, {
        className: `absolute bottom-0 left-0 right-0 h-px bg-border`,
      })),
      (t[6] = s))
    : (s = t[6]);
  let c;
  return (
    t[7] === o
      ? (c = t[8])
      : ((c = (0, A.jsxs)(`div`, {
          className: `relative flex items-end px-2 pt-1.5 bg-secondary/50`,
          children: [o, s],
        })),
        (t[7] = o),
        (t[8] = c)),
    c
  );
}
function Jl(e) {
  let t = e.icon;
  return (0, A.jsxs)(
    p,
    {
      value: e.value,
      className: `relative flex items-center gap-1.5 rounded-none rounded-t-md border border-b-0 px-4 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary`,
      children: [(0, A.jsx)(t, { className: `w-3.5 h-3.5` }), e.label],
    },
    e.value,
  );
}
function Yl(e, t) {
  try {
    let n = sessionStorage.getItem(`conductor:preview:${e}:${t}`);
    if (!n) return null;
    let r = JSON.parse(n);
    return { url: r.url, port: r.port };
  } catch {
    return null;
  }
}
function Xl(e, t) {
  sessionStorage.setItem(
    `conductor:preview:${e}:${t.port}`,
    JSON.stringify({ url: t.url, port: t.port }),
  );
}
function Zl(e, t) {
  sessionStorage.removeItem(`conductor:preview:${e}:${t}`);
}
function Ql({
  sessionId: e,
  sandboxId: t,
  isActive: n,
  repoId: r,
  devPort: i,
  devCommand: a,
  previewInfo: c,
  onPreviewInfoChange: l,
}) {
  let [u, d] = qe(`tab`, Je),
    [f, p] = (0, k.useState)(!1),
    [m, h] = (0, k.useState)(null),
    [g, _] = (0, k.useState)(0),
    [v, y] = qe(`port`, Xe),
    b = i ?? v,
    x = s(o.daytona.getPreviewUrl),
    ee = (0, k.useRef)(null),
    S = (0, k.useCallback)(() => {
      ee.current &&= (clearTimeout(ee.current), null);
    }, []),
    C = (0, k.useCallback)(async () => {
      if (!(!t || !n)) {
        (p(!0), h(null), S());
        try {
          let n = await x({ sandboxId: t, port: b, checkReady: !0, repoId: r });
          n.ready
            ? (await Le(n.url), l(n), Xl(e, n), _((e) => e + 1), p(!1))
            : (ee.current = setTimeout(() => {
                C();
              }, 3e3));
        } catch (e) {
          (h(e instanceof Error ? e.message : `Failed to load preview`), p(!1));
        }
      }
    }, [t, n, x, S, r, b, e, l]);
  (0, k.useEffect)(() => {
    if (n && t) {
      let t = Yl(e, b);
      if (t) {
        l(t);
        return;
      }
      C();
    }
    return (n || Zl(e, b), S);
  }, [n, t, C, S, e, b, l]);
  let te = (0, k.useMemo)(
    () =>
      (0, A.jsx)(Ml, {
        sessionId: e,
        sandboxId: t,
        isActive: n,
        devCommand: a,
      }),
    [e, t, n, a],
  );
  return (0, A.jsxs)(`div`, {
    className: `h-full flex flex-col`,
    children: [
      (0, A.jsx)(ql, {
        activeTab: u,
        onTabChange: (0, k.useCallback)(
          (e) => {
            d(e);
          },
          [d],
        ),
      }),
      (0, A.jsxs)(`div`, {
        className: `flex-1 overflow-hidden bg-card`,
        children: [
          (0, A.jsx)(`div`, {
            className: u === `preview` ? `h-full` : `hidden`,
            children: (0, A.jsx)(Pl, {
              isActive: n,
              sandboxId: t,
              previewInfo: c,
              isLoading: f,
              error: m,
              iframeKey: g,
              onRefresh: C,
              port: b,
              onPortChange: y,
            }),
          }),
          (0, A.jsx)(`div`, {
            className: u === `editor` ? `h-full` : `hidden`,
            children: (0, A.jsx)(Rl, {
              sessionId: e,
              sandboxId: t,
              isActive: n,
              repoId: r,
            }),
          }),
          (0, A.jsx)(`div`, {
            className: u === `terminal` ? `h-full` : `hidden`,
            children: (0, A.jsx)(`div`, {
              className: `h-full flex flex-col`,
              children: (0, A.jsx)(`div`, {
                className: `flex-1 min-h-0`,
                children: te,
              }),
            }),
          }),
          (0, A.jsx)(`div`, {
            className: u === `desktop` ? `h-full` : `hidden`,
            children: (0, A.jsx)(Vl, {
              sessionId: e,
              sandboxId: t,
              isActive: n,
              repoId: r,
            }),
          }),
        ],
      }),
    ],
  });
}
function $l({ sessionId: e }) {
  let { repo: t } = Ze(),
    n = e,
    r = c(o.sessions.get, { id: n }),
    i = c(o.messages.listByParent, { parentId: n }),
    s = c(o.queuedMessages.listByParent, { parentId: n }),
    l = c(o.streaming.get, { entityId: n }),
    u = c(o.streaming.get, { entityId: `summary:${n}` }),
    d = a(o.sessions.startSandbox),
    f = a(o.sessions.stopSandbox),
    p = r?.status === `starting`,
    [m, h] = (0, k.useState)(!1),
    [g, v] = (0, k.useState)(null),
    y = (0, k.useCallback)((e) => v(e), []),
    b = async (e) => {
      if (e === `start`) await d({ sessionId: n });
      else {
        h(!0);
        try {
          await f({ sessionId: n });
        } finally {
          h(!1);
        }
      }
    };
  if (r === void 0)
    return (0, A.jsx)(`div`, {
      className: `flex items-center justify-center h-full`,
      children: (0, A.jsx)(_, { size: `lg` }),
    });
  if (r === null)
    return (0, A.jsx)(`div`, {
      className: `flex items-center justify-center h-full`,
      children: (0, A.jsx)(`div`, {
        className: `text-center`,
        children: (0, A.jsx)(`p`, {
          className: `text-muted-foreground`,
          children: `This session does not exist or has been deleted.`,
        }),
      }),
    });
  let x = r.status === `active`;
  return (0, A.jsx)(Pe, {
    leftPanel: ({ rightPanelCollapsed: e, onToggleRightPanel: t }) =>
      (0, A.jsx)(dt, {
        sessionId: n,
        title: r.title,
        branchName: r.branchName,
        prUrl: r.prUrl,
        summary: r.summary,
        messages: i ?? [],
        queuedMessages: s ?? [],
        planContent: r.planContent,
        streamingActivity: l?.currentActivity,
        streamingContent: l?.currentContent,
        summaryStreamingActivity: u?.currentActivity,
        isSandboxActive: x,
        isSandboxToggling: p || m,
        onSandboxToggle: b,
        isArchived: r.archived === !0,
        previewUrl: g?.url,
        sandboxCollapsed: e,
        onToggleSandbox: t,
      }),
    rightPanel: (0, A.jsx)(Ql, {
      sessionId: n,
      sandboxId: r.sandboxId,
      isActive: x,
      repoId: r.repoId,
      devPort: r.devPort,
      devCommand: r.devCommand,
      previewInfo: g,
      onPreviewInfoChange: y,
    }),
    leftDefaultSize: `30%`,
    leftMinWidthPx: 350,
    rightMinWidthPx: 300,
    collapseCookieName: `sandbox-collapsed`,
  });
}
function eu() {
  let e = (0, lt.c)(2),
    { id: t } = i.useParams(),
    n;
  return (
    e[0] === t
      ? (n = e[1])
      : ((n = (0, A.jsx)($l, { sessionId: t })), (e[0] = t), (e[1] = n)),
    n
  );
}
export { eu as component };
