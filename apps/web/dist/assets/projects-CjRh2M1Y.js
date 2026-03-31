import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useNavigate-B8SeWprX.js";
import { T as i } from "./index-DSqEo2z3.js";
import { c as a, n as o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import {
  An as c,
  Cn as l,
  Cr as u,
  Dn as d,
  Dr as f,
  En as p,
  Gn as m,
  Jn as h,
  Kt as g,
  On as _,
  Rn as v,
  Rt as y,
  Sn as b,
  Tn as x,
  Un as S,
  Vn as C,
  Vt as w,
  Wn as T,
  Xn as E,
  Yn as D,
  Z as ee,
  dn as O,
  fn as k,
  jn as te,
  kn as ne,
  on as A,
  pn as j,
  sn as re,
  ur as M,
  wn as N,
  xn as ie,
  zt as P,
} from "./src-DzioQSsH.js";
import { t as F } from "./createReactComponent-C2GWxX5y.js";
import { t as ae } from "./IconClipboard-CG1pDYHj.js";
import { t as oe } from "./IconCopy-CPz-YjEu.js";
import { n as I, t as se } from "./ToggleSearch-C64uhWNc.js";
import { t as ce } from "./IconGitBranch-otCxAQ3G.js";
import { t as L } from "./IconLayoutKanban-Ci0D2ZgQ.js";
import { n as R, t as le } from "./KanbanColumn-BGVZpZh6.js";
import { r as z, t as B } from "./ProjectPhaseBadge-Df5sMfLH.js";
import { t as ue } from "./IconPencil-D7oAN1Zq.js";
import { t as de } from "./IconPlus-ZLqtR4Mv.js";
import { t as fe } from "./IconTrash-bHTcNORt.js";
import { t as pe } from "./IconUserPlus-sJRgozpx.js";
import { t as V } from "./AnimatePresence-DH-EW7mD.js";
import { t as me } from "./src-BHqyiqII.js";
import { n as H } from "./dates-DHZmrCUU.js";
import {
  C as U,
  g as he,
  h as ge,
  l as _e,
  o as ve,
  p as ye,
} from "./search-params-2NJX6Or7.js";
import { t as be } from "./PageWrapper-Z5X-C4Rx.js";
import { t as xe } from "./EmptyState-CwbiXtLM.js";
import { n as Se } from "./RepoContext-Dg6-rqFp.js";
import { t as Ce } from "./ProjectProgressBar-x8l89nVf.js";
import { t as we } from "./BranchSelect-BOl4JobS.js";
var Te = F(`outline`, `sort-ascending`, `SortAscending`, [
    [`path`, { d: `M4 6l7 0`, key: `svg-0` }],
    [`path`, { d: `M4 12l7 0`, key: `svg-1` }],
    [`path`, { d: `M4 18l9 0`, key: `svg-2` }],
    [`path`, { d: `M15 9l3 -3l3 3`, key: `svg-3` }],
    [`path`, { d: `M18 6l0 12`, key: `svg-4` }],
  ]),
  W = F(`outline`, `sort-descending`, `SortDescending`, [
    [`path`, { d: `M4 6l9 0`, key: `svg-0` }],
    [`path`, { d: `M4 12l7 0`, key: `svg-1` }],
    [`path`, { d: `M4 18l7 0`, key: `svg-2` }],
    [`path`, { d: `M15 15l3 3l3 -3`, key: `svg-3` }],
    [`path`, { d: `M18 6l0 12`, key: `svg-4` }],
  ]),
  Ee = F(`outline`, `timeline`, `Timeline`, [
    [`path`, { d: `M4 16l6 -7l5 5l5 -6`, key: `svg-0` }],
    [`path`, { d: `M14 14a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-1` }],
    [`path`, { d: `M9 9a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-2` }],
    [`path`, { d: `M3 16a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-3` }],
    [`path`, { d: `M19 8a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-4` }],
  ]),
  G = e(t(), 1),
  K = n();
function De({ isOpen: e, onClose: t }) {
  let { repo: n, basePath: i } = Se(),
    s = r(),
    c = n?.defaultBaseBranch ?? `main`,
    [l, u] = (0, G.useState)(``),
    [d, f] = (0, G.useState)(``),
    [p, h] = (0, G.useState)(c),
    [_, y] = (0, G.useState)(!1),
    b = a(o.projects.create);
  return (0, K.jsx)(v, {
    open: e,
    onOpenChange: (e) => {
      e || t();
    },
    children: (0, K.jsxs)(C, {
      children: [
        (0, K.jsx)(T, { children: (0, K.jsx)(m, { children: `New Project` }) }),
        (0, K.jsxs)(`div`, {
          className: `space-y-4`,
          children: [
            (0, K.jsx)(re, {
              placeholder: `Project title`,
              value: l,
              onChange: (e) => u(e.target.value),
              autoFocus: !0,
            }),
            (0, K.jsx)(A, {
              placeholder: `Describe what you want to build...`,
              value: d,
              onChange: (e) => f(e.target.value),
              rows: 4,
            }),
            (0, K.jsx)(we, { value: p, onValueChange: h }),
          ],
        }),
        (0, K.jsxs)(S, {
          children: [
            (0, K.jsx)(M, {
              variant: `secondary`,
              onClick: t,
              children: `Cancel`,
            }),
            (0, K.jsxs)(M, {
              onClick: async () => {
                if (!(!l.trim() || !d.trim() || !n)) {
                  y(!0);
                  try {
                    let e = await b({
                      repoId: n._id,
                      title: l.trim(),
                      rawInput: d.trim(),
                      baseBranch: p,
                    });
                    (u(``), f(``), h(c), t(), s({ to: i + `/projects/` + e }));
                  } finally {
                    y(!1);
                  }
                }
              },
              disabled: _ || !l.trim() || !d.trim(),
              children: [_ && (0, K.jsx)(g, { size: `sm` }), `Create Project`],
            }),
          ],
        }),
      ],
    }),
  });
}
var q = 864e5,
  J = 140,
  Oe = 208,
  Y = 42,
  X = typeof window < `u` ? window.matchMedia(`(min-width: 640px)`) : null;
function ke(e) {
  return (
    X?.addEventListener(`change`, e),
    () => X?.removeEventListener(`change`, e)
  );
}
function Ae() {
  return X?.matches ?? !0;
}
function je() {
  return !0;
}
var Me = 8,
  Ne = 80,
  Pe = 24,
  Z = 1.2,
  Fe = 4,
  Q = 180,
  Ie = 240;
function Le({ projects: e, basePath: t }) {
  let n = r(),
    i = (0, G.useSyncExternalStore)(ke, Ae, je) ? Oe : J,
    a = (0, G.useRef)(null),
    [o, s] = (0, G.useState)(Pe),
    [c, l] = (0, G.useState)(0),
    [u, d] = (0, G.useState)(!1),
    [p, m] = (0, G.useState)({ left: 0, right: 0 }),
    h = (0, G.useRef)(null),
    g = (0, G.useRef)(!1),
    _ = (0, G.useRef)(!1),
    {
      withDates: v,
      withoutDates: y,
      baseOriginDate: b,
      baseSpanDays: x,
    } = (0, G.useMemo)(() => {
      let t = e.filter((e) => e.projectStartDate && e.projectEndDate),
        n = e.filter((e) => !e.projectStartDate || !e.projectEndDate);
      if (t.length === 0)
        return {
          withDates: [],
          withoutDates: n,
          baseOriginDate: 0,
          baseSpanDays: 0,
        };
      let r = t.flatMap((e) => [e.projectStartDate, e.projectEndDate]),
        i = Date.now(),
        a = Math.min(...r, i),
        o = Math.max(...r, i),
        s = Math.max(1, Math.ceil((o - a) / q) + 1),
        c = Math.min(60, Math.max(14, Math.ceil(s * 0.15)));
      return {
        withDates: t,
        withoutDates: n,
        baseOriginDate: a - c * q,
        baseSpanDays: s + c * 2,
      };
    }, [e]),
    S = x === 0 ? 0 : b - p.left * q,
    C = x === 0 ? 0 : x + p.left + p.right,
    w = C * o,
    T = (0, G.useCallback)(
      (e, t = w) => {
        let n = a.current;
        if (!n) return Math.max(0, e);
        let r = Math.max(0, n.clientWidth - i),
          o = Math.max(0, t - r);
        return Math.min(Math.max(0, e), o);
      },
      [w, i],
    ),
    E = (0, G.useCallback)(
      (e, t) => {
        l((n) => T(typeof e == `function` ? e(n) : e, t ?? w));
      },
      [T, w],
    ),
    D = (0, G.useCallback)(() => {
      !a.current ||
        C === 0 ||
        E(
          ((Date.now() - S) / q) * o -
            Math.max(0, a.current.clientWidth - i) / 2,
        );
    }, [S, o, E, C, i]),
    ee = (0, G.useCallback)(
      (e, t) => {
        let n = Math.min(Ne, Math.max(Me, e));
        if (n === o) return;
        let r = a.current;
        if (!r) {
          s(n);
          return;
        }
        let l = Math.max(0, r.clientWidth - i),
          u = t ?? l / 2,
          d = (c + u) / o,
          f = C * n,
          p = d * n - u;
        (s(n), E(p, f));
      },
      [o, c, E, C, i],
    );
  ((0, G.useEffect)(() => {
    E((e) => e);
  }, [E, w]),
    (0, G.useEffect)(() => {
      (m({ left: 0, right: 0 }), (_.current = !1));
    }, [b, x]),
    (0, G.useEffect)(() => {
      if (C === 0 || _.current) return;
      _.current = !0;
      let e = requestAnimationFrame(() => {
        D();
      });
      return () => cancelAnimationFrame(e);
    }, [D, C]),
    (0, G.useEffect)(() => {
      if (C === 0) return;
      let e = a.current;
      if (!e) return;
      let t = Math.max(0, e.clientWidth - i),
        n = Math.max(0, w - t),
        r = Math.max(Ie, Math.round(t * 0.2));
      if (c <= r) {
        let e = Q * o,
          n = (C + Q) * o,
          r = Math.max(0, n - t),
          i = Math.min(c + e, r),
          a = i - c;
        (m((e) => ({ left: e.left + Q, right: e.right })),
          l(i),
          h.current && (h.current.startScroll += a));
        return;
      }
      n - c <= r && m((e) => ({ left: e.left, right: e.right + Q }));
    }, [o, c, C, w, i]));
  let O = (0, G.useMemo)(() => {
      if (C === 0) return [];
      let e = [],
        t = H(S).startOf(`month`),
        n = H(S).add(C, `day`);
      for (; t.isBefore(n); ) {
        let n = t.add(1, `month`),
          r = Math.max(0, t.diff(H(S), `day`)),
          i = Math.min(C, n.diff(H(S), `day`));
        (e.push({ label: t.format(`MMM YYYY`), x: r * o, width: (i - r) * o }),
          (t = n));
      }
      return e;
    }, [S, C, o]),
    k = (0, G.useMemo)(
      () => (o >= 30 ? 1 : o >= 18 ? 2 : o >= 11 ? 7 : 14),
      [o],
    ),
    te = (0, G.useMemo)(() => {
      if (C === 0) return [];
      let e = [];
      for (let t = 0; t <= C; t += k) {
        let n = H(S).add(t, `day`);
        e.push({ label: k <= 2 ? n.format(`D`) : n.format(`MMM D`), x: t * o });
      }
      return e;
    }, [k, S, C, o]),
    ne = (0, G.useMemo)(
      () => (C === 0 ? null : ((Date.now() - S) / q) * o),
      [S, C, o],
    ),
    A = (0, G.useCallback)(
      (e) => {
        let t = Math.abs(e.deltaX),
          n = Math.abs(e.deltaY),
          r = e.shiftKey || t > n * 1.2;
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          let t = a.current;
          if (!t) return;
          let n = t.getBoundingClientRect(),
            r = Math.max(0, t.clientWidth - i),
            s = Math.min(r, Math.max(0, e.clientX - n.left - i));
          ee(o * (e.deltaY > 0 ? 1 / Z : Z), s);
          return;
        }
        if (r) {
          e.preventDefault();
          let t = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
          E((e) => e + t);
          return;
        }
        e.preventDefault();
        let s = a.current;
        if (!s) return;
        let c = s.getBoundingClientRect(),
          l = Math.max(0, s.clientWidth - i),
          u = Math.min(l, Math.max(0, e.clientX - c.left - i));
        ee(o * (e.deltaY > 0 ? 1 / Z : Z), u);
      },
      [o, E, ee, i],
    ),
    j = (0, G.useCallback)((e) => {
      let t = h.current;
      t &&
        ((e !== void 0 && t.pointerId !== e) ||
          (t.moved &&
            ((g.current = !0),
            requestAnimationFrame(() => {
              g.current = !1;
            })),
          (h.current = null),
          d(!1)));
    }, []),
    re = (0, G.useCallback)(
      (e) => {
        e.button === 0 &&
          (h.current ||
            ((h.current = {
              startX: e.clientX,
              startScroll: c,
              moved: !1,
              pointerId: e.pointerId,
            }),
            d(!0),
            e.preventDefault(),
            e.currentTarget.setPointerCapture(e.pointerId)));
      },
      [c],
    ),
    N = (0, G.useCallback)(
      (e) => {
        let t = h.current;
        if (!t || t.pointerId !== e.pointerId) return;
        Math.abs(t.startX - e.clientX) > Fe && (t.moved = !0);
        let n = t.startX - e.clientX;
        E(t.startScroll + n);
      },
      [E],
    ),
    ie = (0, G.useCallback)(
      (e) => {
        let t = h.current;
        !t ||
          t.pointerId !== e.pointerId ||
          (e.currentTarget.hasPointerCapture(e.pointerId) &&
            e.currentTarget.releasePointerCapture(e.pointerId),
          j(e.pointerId));
      },
      [j],
    ),
    P = (0, G.useCallback)(
      (e) => {
        j(e.pointerId);
      },
      [j],
    ),
    F = (0, G.useCallback)(
      (e) => {
        j(e.pointerId);
      },
      [j],
    ),
    ae = (0, G.useCallback)(
      (e) => {
        g.current || n({ to: `${t}/projects/${e}` });
      },
      [n, t],
    );
  return e.length === 0
    ? null
    : (0, K.jsx)(K.Fragment, {
        children: (0, K.jsxs)(`div`, {
          className: `flex min-h-0 min-w-0 flex-1 flex-col gap-3 animate-in fade-in duration-300`,
          children: [
            v.length > 0 &&
              (0, K.jsxs)(`div`, {
                ref: a,
                className: `relative flex min-h-0 min-w-0 flex-1 overflow-hidden select-none`,
                style: { cursor: u ? `grabbing` : `grab` },
                onWheel: A,
                onPointerDown: re,
                onPointerMove: N,
                onPointerUp: ie,
                onPointerCancel: P,
                onLostPointerCapture: F,
                children: [
                  ne !== null &&
                    (0, K.jsxs)(`div`, {
                      className: `pointer-events-none absolute inset-y-0 z-20 transition-[left] duration-200 ease-out`,
                      style: { left: ne - c + i },
                      children: [
                        (0, K.jsx)(`div`, {
                          className: `absolute inset-y-0 left-0 w-px bg-primary/40`,
                        }),
                        (0, K.jsx)(`div`, {
                          className: `absolute left-1/2 top-2 -translate-x-1/2 rounded-full border border-primary/35 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary`,
                          children: `Today`,
                        }),
                      ],
                    }),
                  (0, K.jsxs)(`div`, {
                    className: `flex min-h-0 min-w-0 flex-1 flex-col`,
                    children: [
                      (0, K.jsxs)(`div`, {
                        className: `flex pb-6 bg-background/55`,
                        children: [
                          (0, K.jsx)(`div`, {
                            className: `flex shrink-0 items-center justify-center px-3 pb-2`,
                            style: { width: i },
                            children: (0, K.jsx)(M, {
                              size: `sm`,
                              variant: `ghost`,
                              className: `h-6 px-2 text-[10px]`,
                              onPointerDown: (e) => e.stopPropagation(),
                              onMouseDown: (e) => e.stopPropagation(),
                              onClick: (e) => {
                                (e.stopPropagation(), D());
                              },
                              children: `Today`,
                            }),
                          }),
                          (0, K.jsx)(`div`, {
                            className: `min-w-0 flex-1 overflow-hidden`,
                            children: (0, K.jsxs)(`div`, {
                              className: `relative bg-gradient-to-b from-muted/30 to-transparent transition-transform duration-200 ease-out`,
                              style: {
                                width: w,
                                transform: `translateX(-${c}px)`,
                              },
                              children: [
                                (0, K.jsx)(`div`, {
                                  className: `relative h-7`,
                                  children: O.map((e, t) =>
                                    (0, K.jsx)(
                                      `div`,
                                      {
                                        className: `absolute flex h-full items-center truncate px-2 text-[10px] font-semibold text-foreground/70 transition-[left,width] duration-200 ease-out`,
                                        style: { left: e.x, width: e.width },
                                        children: e.label,
                                      },
                                      `${e.label}-${t}`,
                                    ),
                                  ),
                                }),
                                (0, K.jsx)(`div`, {
                                  className: `relative h-6 pt-1`,
                                  children: te.map((e, t) =>
                                    (0, K.jsx)(
                                      `span`,
                                      {
                                        className: `absolute whitespace-nowrap px-1 text-[10px] text-muted-foreground transition-[left] duration-200 ease-out`,
                                        style: { left: e.x },
                                        children: e.label,
                                      },
                                      `${e.label}-${t}`,
                                    ),
                                  ),
                                }),
                              ],
                            }),
                          }),
                        ],
                      }),
                      (0, K.jsx)(`div`, {
                        className: `min-h-0 min-w-0 overflow-y-auto scrollbar`,
                        children: v.map((e, t) => {
                          let n = e.projectStartDate,
                            r = e.projectEndDate,
                            a = ((n - S) / q) * o,
                            s = Math.max(((r - n) / q) * o, 6),
                            l = z[e.phase],
                            u = Math.max(1, Math.round((r - n) / q) + 1),
                            d = s > 74,
                            p = s > 126;
                          return (0, K.jsxs)(
                            `div`,
                            {
                              className: f(
                                `group flex items-center animate-in fade-in duration-300`,
                                t % 2 == 0
                                  ? `bg-background/25`
                                  : `bg-background/10`,
                              ),
                              style: { height: Y },
                              children: [
                                (0, K.jsxs)(`button`, {
                                  className: `motion-base flex h-full shrink-0 items-center gap-2 px-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35`,
                                  style: { width: i },
                                  onClick: () => ae(e._id),
                                  children: [
                                    (0, K.jsx)(`span`, {
                                      className: f(
                                        `h-2 w-2 shrink-0 rounded-full`,
                                        l.bar,
                                      ),
                                    }),
                                    (0, K.jsx)(`span`, {
                                      className: `min-w-0 flex-1 truncate text-sm font-medium text-foreground transition-colors group-hover:text-primary`,
                                      children: e.title,
                                    }),
                                  ],
                                }),
                                (0, K.jsx)(`div`, {
                                  className: `relative h-full min-w-0 flex-1 overflow-hidden`,
                                  style: { height: Y },
                                  children: (0, K.jsx)(`div`, {
                                    className: `relative h-full transition-transform duration-200 ease-out`,
                                    style: {
                                      width: w,
                                      transform: `translateX(-${c}px)`,
                                    },
                                    children: (0, K.jsxs)(`button`, {
                                      className: f(
                                        `absolute top-1/2 flex -translate-y-1/2 items-center gap-1 overflow-hidden rounded-md bg-card/95 pr-1.5 transition-[left,width,transform,filter] duration-200 ease-out hover:scale-[1.01] hover:brightness-95`,
                                        l.bg,
                                      ),
                                      style: {
                                        left: a,
                                        width: s,
                                        height: Y - 16,
                                      },
                                      onClick: () => ae(e._id),
                                      children: [
                                        (0, K.jsx)(`span`, {
                                          className: f(
                                            `absolute inset-y-0 left-0 w-1 rounded-l-md`,
                                            l.bar,
                                          ),
                                        }),
                                        d &&
                                          (0, K.jsxs)(`span`, {
                                            className: f(
                                              `truncate pl-2 text-[11px] font-medium`,
                                              l.text,
                                            ),
                                            children: [
                                              H(n).format(`MMM D`),
                                              ` -`,
                                              ` `,
                                              H(r).format(`MMM D`),
                                            ],
                                          }),
                                        p &&
                                          (0, K.jsxs)(`span`, {
                                            className: `ml-auto rounded bg-background/60 px-1.5 py-0.5 text-[10px] font-semibold text-foreground/70`,
                                            children: [u, `d`],
                                          }),
                                      ],
                                    }),
                                  }),
                                }),
                              ],
                            },
                            e._id,
                          );
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            y.length > 0 &&
              (0, K.jsxs)(`p`, {
                className: `px-1 text-xs text-muted-foreground`,
                children: [
                  y.length,
                  ` unscheduled`,
                  ` `,
                  y.length === 1 ? `project` : `projects`,
                ],
              }),
          ],
        }),
      });
}
var Re = i();
function $(e) {
  let t = (0, Re.c)(150),
    {
      projectId: n,
      userId: r,
      title: i,
      description: u,
      rawInput: f,
      branchName: h,
      repoFullName: g,
      accentColor: y,
      members: w,
      projectLead: E,
      phase: D,
      isActive: ee,
      onClick: O,
      onDelete: k,
    } = e,
    [j, ie] = (0, G.useState)(!1),
    [P, F] = (0, G.useState)(i),
    [I, se] = (0, G.useState)(u ?? ``),
    L = a(o.projects.update),
    R = s(o.auth.me),
    le = s(o.users.listAll),
    de;
  t[0] === w ? (de = t[1]) : ((de = w ?? []), (t[0] = w), (t[1] = de));
  let V;
  t[2] !== E || t[3] !== de
    ? ((V = new Set([E, ...de].filter(Ue))),
      (t[2] = E),
      (t[3] = de),
      (t[4] = V))
    : (V = t[4]);
  let me;
  t[5] === V ? (me = t[6]) : ((me = [...V]), (t[5] = V), (t[6] = me));
  let H = me,
    U = R === r,
    he = u ?? f,
    ge = z[D].icon,
    _e;
  t[7] !== H || t[8] !== r
    ? ((_e = H.length > 0 ? H : [r]), (t[7] = H), (t[8] = r), (t[9] = _e))
    : (_e = t[9]);
  let ve = _e,
    ye;
  t[10] === ve
    ? (ye = t[11])
    : ((ye = ve.slice(0, 3)), (t[10] = ve), (t[11] = ye));
  let be = ye,
    xe = ve.length - 3,
    Se = `group relative shrink-0 overflow-hidden rounded-lg transition-[transform,background-color] duration-200 ${ee ? `bg-primary/5 ring-1 ring-primary/30` : `bg-card/88 hover:-translate-y-[1px] hover:bg-card hover:z-10`}`,
    we;
  t[12] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((we = (0, K.jsx)(`div`, {
        className: `pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full bg-primary/10 blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100`,
      })),
      (t[12] = we))
    : (we = t[12]);
  let Te = `absolute inset-y-2 left-0 w-1 rounded-r-full ${y}`,
    W;
  t[13] === Te
    ? (W = t[14])
    : ((W = (0, K.jsx)(`div`, { className: Te })), (t[13] = Te), (t[14] = W));
  let Ee;
  t[15] === O
    ? (Ee = t[16])
    : ((Ee = (e) => {
        (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), O?.());
      }),
      (t[15] = O),
      (t[16] = Ee));
  let De;
  t[17] === i
    ? (De = t[18])
    : ((De = (0, K.jsx)(`div`, {
        children: (0, K.jsx)(`h3`, {
          className: `line-clamp-1 text-sm font-semibold leading-5 text-foreground transition-colors duration-200 group-hover:text-primary`,
          children: i,
        }),
      })),
      (t[17] = i),
      (t[18] = De));
  let q;
  t[19] !== u || t[20] !== he
    ? ((q = he
        ? (0, K.jsx)(`p`, {
            className: `mt-1 line-clamp-1 text-xs leading-relaxed ${u ? `text-muted-foreground` : `italic text-muted-foreground/80`}`,
            children: he,
          })
        : null),
      (t[19] = u),
      (t[20] = he),
      (t[21] = q))
    : (q = t[21]);
  let J;
  t[22] === n
    ? (J = t[23])
    : ((J = (0, K.jsx)(Ce, {
        projectId: n,
        className: `mt-2 h-1.5 bg-secondary/75`,
      })),
      (t[22] = n),
      (t[23] = J));
  let Oe;
  t[24] === be ? (Oe = t[25]) : ((Oe = be.map(He)), (t[24] = be), (t[25] = Oe));
  let Y;
  t[26] === xe
    ? (Y = t[27])
    : ((Y =
        xe > 0 &&
        (0, K.jsxs)(`div`, {
          className: `-ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-background bg-muted text-[10px] font-semibold text-muted-foreground`,
          children: [`+`, xe],
        })),
      (t[26] = xe),
      (t[27] = Y));
  let X;
  t[28] !== Oe || t[29] !== Y
    ? ((X = (0, K.jsx)(`div`, {
        className: `mt-2 flex flex-wrap items-center gap-2`,
        children: (0, K.jsx)(`div`, {
          className: `flex min-w-0 items-center`,
          children: (0, K.jsxs)(`div`, {
            className: `flex shrink-0 -space-x-1.5 items-center pr-1`,
            children: [Oe, Y],
          }),
        }),
      })),
      (t[28] = Oe),
      (t[29] = Y),
      (t[30] = X))
    : (X = t[30]);
  let ke;
  t[31] !== O ||
  t[32] !== Ee ||
  t[33] !== De ||
  t[34] !== q ||
  t[35] !== J ||
  t[36] !== X
    ? ((ke = (0, K.jsxs)(`div`, {
        role: `button`,
        tabIndex: 0,
        className: `relative z-[1] block w-full cursor-pointer p-2 pl-3 text-left motion-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35`,
        onClick: O,
        onKeyDown: Ee,
        children: [De, q, J, X],
      })),
      (t[31] = O),
      (t[32] = Ee),
      (t[33] = De),
      (t[34] = q),
      (t[35] = J),
      (t[36] = X),
      (t[37] = ke))
    : (ke = t[37]);
  let Ae;
  t[38] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ae = (0, K.jsx)(T, {
        children: (0, K.jsx)(m, { children: `Edit Project` }),
      })),
      (t[38] = Ae))
    : (Ae = t[38]);
  let je;
  t[39] !== I || t[40] !== P || t[41] !== n || t[42] !== L
    ? ((je = async (e) => {
        (e.preventDefault(),
          await L({ id: n, title: P, description: I || void 0 }),
          ie(!1));
      }),
      (t[39] = I),
      (t[40] = P),
      (t[41] = n),
      (t[42] = L),
      (t[43] = je))
    : (je = t[43]);
  let Me;
  t[44] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Me = (e) => F(e.target.value)), (t[44] = Me))
    : (Me = t[44]);
  let Ne;
  t[45] === P
    ? (Ne = t[46])
    : ((Ne = (0, K.jsx)(re, {
        placeholder: `Title`,
        value: P,
        onChange: Me,
        autoFocus: !0,
      })),
      (t[45] = P),
      (t[46] = Ne));
  let Pe;
  t[47] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Pe = (e) => se(e.target.value)), (t[47] = Pe))
    : (Pe = t[47]);
  let Z;
  t[48] === I
    ? (Z = t[49])
    : ((Z = (0, K.jsx)(A, {
        placeholder: `Description`,
        value: I,
        onChange: Pe,
        rows: 3,
      })),
      (t[48] = I),
      (t[49] = Z));
  let Fe;
  t[50] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Fe = (0, K.jsx)(M, {
        type: `button`,
        variant: `ghost`,
        onClick: () => ie(!1),
        children: `Cancel`,
      })),
      (t[50] = Fe))
    : (Fe = t[50]);
  let Q;
  t[51] === P ? (Q = t[52]) : ((Q = P.trim()), (t[51] = P), (t[52] = Q));
  let Ie = !Q,
    Le;
  t[53] === Ie
    ? (Le = t[54])
    : ((Le = (0, K.jsxs)(S, {
        children: [
          Fe,
          (0, K.jsx)(M, { type: `submit`, disabled: Ie, children: `Save` }),
        ],
      })),
      (t[53] = Ie),
      (t[54] = Le));
  let $;
  t[55] !== je || t[56] !== Ne || t[57] !== Z || t[58] !== Le
    ? (($ = (0, K.jsxs)(C, {
        onClick: Ve,
        children: [
          Ae,
          (0, K.jsxs)(`form`, {
            onSubmit: je,
            className: `flex flex-col gap-4`,
            children: [Ne, Z, Le],
          }),
        ],
      })),
      (t[55] = je),
      (t[56] = Ne),
      (t[57] = Z),
      (t[58] = Le),
      (t[59] = $))
    : ($ = t[59]);
  let We;
  t[60] !== j || t[61] !== $
    ? ((We = (0, K.jsx)(v, { open: j, onOpenChange: ie, children: $ })),
      (t[60] = j),
      (t[61] = $),
      (t[62] = We))
    : (We = t[62]);
  let Ge;
  t[63] !== ke || t[64] !== We || t[65] !== Se || t[66] !== W
    ? ((Ge = (0, K.jsxs)(`div`, { className: Se, children: [we, W, ke, We] })),
      (t[63] = ke),
      (t[64] = We),
      (t[65] = Se),
      (t[66] = W),
      (t[67] = Ge))
    : (Ge = t[67]);
  let Ke = Ge,
    qe;
  t[68] === Ke
    ? (qe = t[69])
    : ((qe = (0, K.jsx)(te, { asChild: !0, children: Ke })),
      (t[68] = Ke),
      (t[69] = qe));
  let Je = !U,
    Ye = z[D],
    Xe;
  t[70] !== ge || t[71] !== Ye.text
    ? ((Xe = (0, K.jsx)(ge, { size: 16, className: Ye.text })),
      (t[70] = ge),
      (t[71] = Ye.text),
      (t[72] = Xe))
    : (Xe = t[72]);
  let Ze;
  t[73] !== Je || t[74] !== Xe
    ? ((Ze = (0, K.jsxs)(c, { disabled: Je, children: [Xe, `Phase`] })),
      (t[73] = Je),
      (t[74] = Xe),
      (t[75] = Ze))
    : (Ze = t[75]);
  let Qe;
  t[76] !== n || t[77] !== L
    ? ((Qe = (e) => {
        let t = B.find((t) => t === e);
        t && L({ id: n, phase: t });
      }),
      (t[76] = n),
      (t[77] = L),
      (t[78] = Qe))
    : (Qe = t[78]);
  let $e;
  t[79] === Symbol.for(`react.memo_cache_sentinel`)
    ? (($e = B.map(Be)), (t[79] = $e))
    : ($e = t[79]);
  let et;
  t[80] !== D || t[81] !== Qe
    ? ((et = (0, K.jsx)(ne, {
        children: (0, K.jsx)(x, { value: D, onValueChange: Qe, children: $e }),
      })),
      (t[80] = D),
      (t[81] = Qe),
      (t[82] = et))
    : (et = t[82]);
  let tt;
  t[83] !== Ze || t[84] !== et
    ? ((tt = (0, K.jsxs)(_, { children: [Ze, et] })),
      (t[83] = Ze),
      (t[84] = et),
      (t[85] = tt))
    : (tt = t[85]);
  let nt = !U,
    rt;
  t[86] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((rt = (0, K.jsx)(pe, { size: 16 })), (t[86] = rt))
    : (rt = t[86]);
  let it;
  t[87] === nt
    ? (it = t[88])
    : ((it = (0, K.jsxs)(c, { disabled: nt, children: [rt, `Project Lead`] })),
      (t[87] = nt),
      (t[88] = it));
  let at = E ?? `none`,
    ot;
  t[89] !== R || t[90] !== n || t[91] !== L || t[92] !== le
    ? ((ot = (e) => {
        if (e === `none`) {
          L({ id: n, projectLead: null });
          return;
        }
        let t = (le ?? []).find((t) => t._id === e),
          r = R === e ? R : t?._id;
        r && L({ id: n, projectLead: r });
      }),
      (t[89] = R),
      (t[90] = n),
      (t[91] = L),
      (t[92] = le),
      (t[93] = ot))
    : (ot = t[93]);
  let st;
  t[94] === R
    ? (st = t[95])
    : ((st = R
        ? (0, K.jsxs)(K.Fragment, {
            children: [
              (0, K.jsx)(p, { value: R, children: `Set myself as lead` }),
              (0, K.jsx)(d, {}),
            ],
          })
        : null),
      (t[94] = R),
      (t[95] = st));
  let ct;
  t[96] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ct = (0, K.jsx)(p, { value: `none`, children: `No lead` })),
      (t[96] = ct))
    : (ct = t[96]);
  let lt;
  t[97] === le ? (lt = t[98]) : ((lt = le ?? []), (t[97] = le), (t[98] = lt));
  let ut;
  t[99] === lt
    ? (ut = t[100])
    : ((ut = lt.map(ze)), (t[99] = lt), (t[100] = ut));
  let dt;
  t[101] !== at || t[102] !== ot || t[103] !== st || t[104] !== ut
    ? ((dt = (0, K.jsx)(ne, {
        children: (0, K.jsxs)(x, {
          value: at,
          onValueChange: ot,
          children: [st, ct, ut],
        }),
      })),
      (t[101] = at),
      (t[102] = ot),
      (t[103] = st),
      (t[104] = ut),
      (t[105] = dt))
    : (dt = t[105]);
  let ft;
  t[106] !== it || t[107] !== dt
    ? ((ft = (0, K.jsxs)(_, { children: [it, dt] })),
      (t[106] = it),
      (t[107] = dt),
      (t[108] = ft))
    : (ft = t[108]);
  let pt;
  t[109] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((pt = (0, K.jsx)(d, {})), (t[109] = pt))
    : (pt = t[109]);
  let mt;
  t[110] !== h || t[111] !== g
    ? ((mt = h
        ? (0, K.jsx)(N, {
            asChild: !0,
            children: (0, K.jsxs)(`a`, {
              href: `https://github.com/${g}/tree/${h}`,
              target: `_blank`,
              rel: `noopener noreferrer`,
              children: [(0, K.jsx)(ce, { size: 16 }), `View Branch`],
            }),
          })
        : null),
      (t[110] = h),
      (t[111] = g),
      (t[112] = mt))
    : (mt = t[112]);
  let ht = !U,
    gt;
  t[113] !== u || t[114] !== i
    ? ((gt = () => {
        (F(i), se(u ?? ``), ie(!0));
      }),
      (t[113] = u),
      (t[114] = i),
      (t[115] = gt))
    : (gt = t[115]);
  let _t;
  t[116] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((_t = (0, K.jsx)(ue, { size: 16 })), (t[116] = _t))
    : (_t = t[116]);
  let vt;
  t[117] === U
    ? (vt = t[118])
    : ((vt =
        !U &&
        (0, K.jsx)(`span`, {
          className: `ml-2 text-xs text-muted-foreground`,
          children: `Owner only`,
        })),
      (t[117] = U),
      (t[118] = vt));
  let yt;
  t[119] !== ht || t[120] !== gt || t[121] !== vt
    ? ((yt = (0, K.jsxs)(N, {
        disabled: ht,
        onClick: gt,
        children: [_t, `Edit Details`, vt],
      })),
      (t[119] = ht),
      (t[120] = gt),
      (t[121] = vt),
      (t[122] = yt))
    : (yt = t[122]);
  let bt;
  t[123] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((bt = (0, K.jsx)(d, {})), (t[123] = bt))
    : (bt = t[123]);
  let xt;
  t[124] === i
    ? (xt = t[125])
    : ((xt = () => {
        navigator.clipboard.writeText(i);
      }),
      (t[124] = i),
      (t[125] = xt));
  let St;
  t[126] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((St = (0, K.jsx)(ae, { size: 16 })), (t[126] = St))
    : (St = t[126]);
  let Ct;
  t[127] === xt
    ? (Ct = t[128])
    : ((Ct = (0, K.jsxs)(N, { onClick: xt, children: [St, `Copy title`] })),
      (t[127] = xt),
      (t[128] = Ct));
  let wt;
  t[129] === h
    ? (wt = t[130])
    : ((wt = h
        ? (0, K.jsxs)(N, {
            onClick: () => {
              navigator.clipboard.writeText(h);
            },
            children: [(0, K.jsx)(oe, { size: 16 }), `Copy branch name`],
          })
        : null),
      (t[129] = h),
      (t[130] = wt));
  let Tt;
  t[131] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Tt = (0, K.jsx)(d, {})), (t[131] = Tt))
    : (Tt = t[131]);
  let Et = !U,
    Dt;
  t[132] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Dt = (0, K.jsx)(fe, { size: 16 })), (t[132] = Dt))
    : (Dt = t[132]);
  let Ot;
  t[133] === U
    ? (Ot = t[134])
    : ((Ot =
        !U &&
        (0, K.jsx)(`span`, {
          className: `ml-2 text-xs text-muted-foreground`,
          children: `Owner only`,
        })),
      (t[133] = U),
      (t[134] = Ot));
  let kt;
  t[135] !== k || t[136] !== Et || t[137] !== Ot
    ? ((kt = (0, K.jsxs)(N, {
        className: `text-destructive`,
        disabled: Et,
        onClick: k,
        children: [Dt, `Delete`, Ot],
      })),
      (t[135] = k),
      (t[136] = Et),
      (t[137] = Ot),
      (t[138] = kt))
    : (kt = t[138]);
  let At;
  t[139] !== tt ||
  t[140] !== ft ||
  t[141] !== mt ||
  t[142] !== yt ||
  t[143] !== Ct ||
  t[144] !== wt ||
  t[145] !== kt
    ? ((At = (0, K.jsxs)(l, {
        children: [tt, ft, pt, mt, yt, bt, Ct, wt, Tt, kt],
      })),
      (t[139] = tt),
      (t[140] = ft),
      (t[141] = mt),
      (t[142] = yt),
      (t[143] = Ct),
      (t[144] = wt),
      (t[145] = kt),
      (t[146] = At))
    : (At = t[146]);
  let jt;
  return (
    t[147] !== qe || t[148] !== At
      ? ((jt = (0, K.jsxs)(b, { children: [qe, At] })),
        (t[147] = qe),
        (t[148] = At),
        (t[149] = jt))
      : (jt = t[149]),
    jt
  );
}
function ze(e) {
  return (0, K.jsx)(
    p,
    { value: e._id, children: e.fullName ?? e.firstName ?? `Unknown` },
    e._id,
  );
}
function Be(e) {
  let t = z[e],
    n = t.icon;
  return (0, K.jsxs)(
    p,
    {
      value: e,
      children: [(0, K.jsx)(n, { size: 16, className: t.text }), t.label],
    },
    e,
  );
}
function Ve(e) {
  return e.stopPropagation();
}
function He(e) {
  return (0, K.jsx)(me, { userId: e, hideLastSeen: !0 }, e);
}
function Ue(e) {
  return e !== void 0;
}
function We(e) {
  let t = (0, Re.c)(22),
    { projectsByPhase: n, visiblePhases: r, onOpenProject: i, onDelete: a } = e,
    { owner: o, name: s } = Se(),
    c;
  t[0] === n
    ? (c = t[1])
    : ((c = () => {
        let e = new Set(B.filter((e) => (n[e] ?? []).length > 0));
        return e.size > 0 ? e : new Set(B);
      }),
      (t[0] = n),
      (t[1] = c));
  let [l, d] = (0, G.useState)(c),
    f;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (e) => {
        d((t) => {
          let n = new Set(t);
          return (n.has(e) ? n.delete(e) : n.add(e), n);
        });
      }),
      (t[2] = f))
    : (f = t[2]);
  let p = f,
    m;
  if (
    t[3] !== s ||
    t[4] !== a ||
    t[5] !== i ||
    t[6] !== l ||
    t[7] !== o ||
    t[8] !== n ||
    t[9] !== r
  ) {
    let e;
    t[11] === r
      ? (e = t[12])
      : ((e = (e) => r.has(e)), (t[11] = r), (t[12] = e));
    let c;
    (t[13] !== s ||
    t[14] !== a ||
    t[15] !== i ||
    t[16] !== l ||
    t[17] !== o ||
    t[18] !== n
      ? ((c = (e) => {
          let t = z[e],
            r = n[e] ?? [],
            c = t.icon;
          return (0, K.jsxs)(
            h,
            {
              open: l.has(e),
              onOpenChange: () => p(e),
              children: [
                (0, K.jsx)(E, {
                  asChild: !0,
                  children: (0, K.jsxs)(`button`, {
                    className: `flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted/50 sticky top-0 z-10 bg-background`,
                    children: [
                      (0, K.jsx)(u, {
                        size: 14,
                        className: `text-muted-foreground transition-transform duration-200 ${l.has(e) ? `rotate-90` : ``}`,
                      }),
                      (0, K.jsx)(c, { size: 14, className: t.text }),
                      (0, K.jsx)(`span`, {
                        className: `text-sm font-medium ${t.text}`,
                        children: t.label,
                      }),
                      (0, K.jsx)(`span`, {
                        className: `text-xs text-muted-foreground/60 tabular-nums`,
                        children: r.length,
                      }),
                    ],
                  }),
                }),
                (0, K.jsx)(D, {
                  children:
                    r.length === 0
                      ? (0, K.jsx)(`div`, {
                          className: `flex items-center justify-center py-4 text-xs text-muted-foreground`,
                          children: `No projects`,
                        })
                      : (0, K.jsx)(`div`, {
                          className: `flex flex-col gap-1.5 px-1.5 pb-1.5`,
                          children: r.map((t) =>
                            (0, K.jsx)(
                              $,
                              {
                                projectId: t._id,
                                userId: t.userId,
                                title: t.title,
                                description: t.description,
                                rawInput: t.rawInput,
                                branchName: t.branchName,
                                repoFullName: `${o}/${s}`,
                                createdAt: t._creationTime,
                                accentColor: z[e].bar,
                                members: t.members,
                                projectLead: t.projectLead,
                                phase: e,
                                onClick: () => i(t._id),
                                onDelete: () => a(t._id, t.title),
                              },
                              t._id,
                            ),
                          ),
                        }),
                }),
              ],
            },
            e,
          );
        }),
        (t[13] = s),
        (t[14] = a),
        (t[15] = i),
        (t[16] = l),
        (t[17] = o),
        (t[18] = n),
        (t[19] = c))
      : (c = t[19]),
      (m = B.filter(e).map(c)),
      (t[3] = s),
      (t[4] = a),
      (t[5] = i),
      (t[6] = l),
      (t[7] = o),
      (t[8] = n),
      (t[9] = r),
      (t[10] = m));
  } else m = t[10];
  let g;
  return (
    t[20] === m
      ? (g = t[21])
      : ((g = (0, K.jsx)(`div`, {
          className: `flex-1 w-full overflow-y-auto scrollbar space-y-1`,
          children: m,
        })),
        (t[20] = m),
        (t[21] = g)),
    g
  );
}
function Ge(e) {
  let t = (0, Re.c)(17),
    {
      projectsByPhase: n,
      visiblePhases: r,
      owner: i,
      name: a,
      onOpenProject: o,
      onDelete: s,
    } = e,
    c;
  if (
    t[0] !== a ||
    t[1] !== s ||
    t[2] !== o ||
    t[3] !== i ||
    t[4] !== n ||
    t[5] !== r
  ) {
    let e;
    t[7] === r ? (e = t[8]) : ((e = (e) => r.has(e)), (t[7] = r), (t[8] = e));
    let l;
    (t[9] !== a || t[10] !== s || t[11] !== o || t[12] !== i || t[13] !== n
      ? ((l = (e) =>
          (0, K.jsx)(
            le,
            {
              id: e,
              config: z[e],
              count: n[e].length,
              droppable: !1,
              emptyLabel: `No projects`,
              children: n[e].map((t) =>
                (0, K.jsx)(
                  $,
                  {
                    projectId: t._id,
                    userId: t.userId,
                    title: t.title,
                    description: t.description,
                    rawInput: t.rawInput,
                    branchName: t.branchName,
                    repoFullName: `${i}/${a}`,
                    createdAt: t._creationTime,
                    accentColor: z[e].bar,
                    members: t.members,
                    projectLead: t.projectLead,
                    phase: e,
                    onClick: () => o(t._id),
                    onDelete: () => s(t._id, t.title),
                  },
                  t._id,
                ),
              ),
            },
            e,
          )),
        (t[9] = a),
        (t[10] = s),
        (t[11] = o),
        (t[12] = i),
        (t[13] = n),
        (t[14] = l))
      : (l = t[14]),
      (c = B.filter(e).map(l)),
      (t[0] = a),
      (t[1] = s),
      (t[2] = o),
      (t[3] = i),
      (t[4] = n),
      (t[5] = r),
      (t[6] = c));
  } else c = t[6];
  let l;
  return (
    t[15] === c
      ? (l = t[16])
      : ((l = (0, K.jsx)(K.Fragment, { children: c })),
        (t[15] = c),
        (t[16] = l)),
    l
  );
}
function Ke(e) {
  let t = (0, Re.c)(26),
    { project: n, onClose: r, onConfirm: i, isDeleting: a } = e,
    o = n !== null,
    s;
  t[0] === r
    ? (s = t[1])
    : ((s = (e) => {
        e || r();
      }),
      (t[0] = r),
      (t[1] = s));
  let c;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, K.jsx)(T, {
        children: (0, K.jsx)(m, { children: `Delete Project` }),
      })),
      (t[2] = c))
    : (c = t[2]);
  let l = n?.title,
    u;
  t[3] === l
    ? (u = t[4])
    : ((u = (0, K.jsxs)(`p`, {
        className: `text-muted-foreground`,
        children: [
          `Are you sure you want to delete `,
          (0, K.jsx)(`strong`, { children: l }),
          `?`,
        ],
      })),
      (t[3] = l),
      (t[4] = u));
  let d, f;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = (0, K.jsx)(`div`, {
        className: `mt-3 p-3 bg-warning-bg rounded-lg`,
        children: (0, K.jsx)(`p`, {
          className: `text-sm text-warning`,
          children: `This will permanently delete the project and all associated tasks, agent runs, and dependencies.`,
        }),
      })),
      (f = (0, K.jsx)(`p`, {
        className: `text-sm text-muted-foreground mt-3`,
        children: `This action cannot be undone.`,
      })),
      (t[5] = d),
      (t[6] = f))
    : ((d = t[5]), (f = t[6]));
  let p;
  t[7] === u
    ? (p = t[8])
    : ((p = (0, K.jsxs)(`div`, { children: [u, d, f] })),
      (t[7] = u),
      (t[8] = p));
  let h;
  t[9] !== a || t[10] !== r
    ? ((h = (0, K.jsx)(M, {
        variant: `ghost`,
        onClick: r,
        disabled: a,
        children: `Cancel`,
      })),
      (t[9] = a),
      (t[10] = r),
      (t[11] = h))
    : (h = t[11]);
  let g = a ? `Deleting...` : `Delete Project`,
    _;
  t[12] !== a || t[13] !== i || t[14] !== g
    ? ((_ = (0, K.jsx)(M, {
        variant: `destructive`,
        onClick: i,
        disabled: a,
        children: g,
      })),
      (t[12] = a),
      (t[13] = i),
      (t[14] = g),
      (t[15] = _))
    : (_ = t[15]);
  let y;
  t[16] !== _ || t[17] !== h
    ? ((y = (0, K.jsxs)(S, { children: [h, _] })),
      (t[16] = _),
      (t[17] = h),
      (t[18] = y))
    : (y = t[18]);
  let b;
  t[19] !== y || t[20] !== p
    ? ((b = (0, K.jsxs)(C, { children: [c, p, y] })),
      (t[19] = y),
      (t[20] = p),
      (t[21] = b))
    : (b = t[21]);
  let x;
  return (
    t[22] !== o || t[23] !== b || t[24] !== s
      ? ((x = (0, K.jsx)(v, { open: o, onOpenChange: s, children: b })),
        (t[22] = o),
        (t[23] = b),
        (t[24] = s),
        (t[25] = x))
      : (x = t[25]),
    x
  );
}
var qe = [
  { key: `kanban`, icon: L, label: `Kanban view` },
  { key: `timeline`, icon: Ee, label: `Timeline view` },
  { key: `list`, icon: R, label: `List view` },
];
function Je() {
  let { repo: e, basePath: t, owner: n, name: i } = Se(),
    c = s(o.projects.list, { repoId: e._id }),
    l = a(o.projects.deleteCascade),
    u = r(),
    [d, f] = (0, G.useState)(!1),
    [{ q: p, phases: m, sort: h, dir: _, view: v }, b] = U({
      q: ye,
      phases: ve,
      sort: he,
      dir: ge,
      view: _e,
    }),
    x = p,
    S = (0, G.useMemo)(() => new Set(m), [m]),
    C = h,
    T = _,
    [E, D] = (0, G.useState)(null),
    [te, ne] = (0, G.useState)(!1),
    A = c !== void 0 && c.length > 0,
    re = (0, G.useMemo)(() => {
      if (!c) return [];
      let e = x.toLowerCase().trim();
      return c
        .filter((e) => S.has(e.phase))
        .filter((t) =>
          e
            ? t.title.toLowerCase().includes(e) ||
              t.rawInput?.toLowerCase().includes(e) ||
              t.description?.toLowerCase().includes(e)
            : !0,
        )
        .sort((e, t) => {
          let n = 0;
          switch (C) {
            case `created`:
              n = e._creationTime - t._creationTime;
              break;
            case `title`:
              n = e.title.localeCompare(t.title);
              break;
          }
          return T === `asc` ? n : -n;
        });
    }, [c, C, T, x, S]),
    N = (0, G.useMemo)(
      () =>
        B.reduce((e, t) => ((e[t] = re.filter((e) => e.phase === t)), e), {
          draft: [],
          finalized: [],
          active: [],
          completed: [],
          cancelled: [],
        }),
      [re],
    ),
    F = async () => {
      if (E) {
        ne(!0);
        try {
          (await l({ id: E.id }), D(null));
        } finally {
          ne(!1);
        }
      }
    },
    ae = (e) => {
      let t = new Set(S);
      if (t.has(e)) {
        if (t.size === 1) return;
        t.delete(e);
      } else t.add(e);
      b({ phases: [...t] });
    },
    oe = (e) => {
      u({ to: `${t}/projects/${e}` });
    };
  return (0, K.jsxs)(K.Fragment, {
    children: [
      (0, K.jsx)(be, {
        title: `Projects`,
        fillHeight: !0,
        childPadding: !1,
        headerRight: (0, K.jsxs)(`div`, {
          className: `flex items-center gap-1.5 sm:gap-2`,
          children: [
            (0, K.jsx)(se, {
              value: x,
              onChange: (e) => b({ q: e }),
              placeholder: `Search projects...`,
              tooltipLabel: `Search projects`,
              visible: A,
            }),
            A &&
              (0, K.jsx)(`div`, {
                className: `flex items-center rounded-lg bg-muted/40 overflow-hidden`,
                children: qe.map((e) =>
                  (0, K.jsxs)(
                    y,
                    {
                      children: [
                        (0, K.jsx)(w, {
                          asChild: !0,
                          children: (0, K.jsx)(M, {
                            variant: v === e.key ? `secondary` : `ghost`,
                            size: `icon`,
                            className: `motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]`,
                            onClick: () => b({ view: e.key }),
                            children: (0, K.jsx)(e.icon, { size: 16 }),
                          }),
                        }),
                        (0, K.jsx)(P, { children: e.label }),
                      ],
                    },
                    e.key,
                  ),
                ),
              }),
            A &&
              (0, K.jsxs)(O, {
                children: [
                  (0, K.jsx)(ie, {
                    asChild: !0,
                    children: (0, K.jsxs)(M, {
                      variant: `secondary`,
                      size: `sm`,
                      className: `hidden sm:inline-flex`,
                      children: [
                        (0, K.jsx)(I, { size: 16 }),
                        S.size === B.length ? `All Phases` : `${S.size} Phases`,
                      ],
                    }),
                  }),
                  (0, K.jsx)(j, {
                    children: B.map((e) => {
                      let t = z[e];
                      return (0, K.jsxs)(
                        k,
                        {
                          checked: S.has(e),
                          onCheckedChange: () => ae(e),
                          onSelect: (e) => e.preventDefault(),
                          children: [
                            (0, K.jsx)(t.icon, {
                              size: 16,
                              className: t.text + ` mr-2`,
                            }),
                            (0, K.jsx)(`span`, {
                              className: t.text,
                              children: t.label,
                            }),
                          ],
                        },
                        e,
                      );
                    }),
                  }),
                ],
              }),
            A &&
              (0, K.jsxs)(O, {
                children: [
                  (0, K.jsx)(ie, {
                    asChild: !0,
                    children: (0, K.jsx)(M, {
                      variant: `secondary`,
                      size: `icon`,
                      className: `h-8 w-8 sm:hidden`,
                      children: (0, K.jsx)(I, { size: 16 }),
                    }),
                  }),
                  (0, K.jsx)(j, {
                    children: B.map((e) => {
                      let t = z[e];
                      return (0, K.jsxs)(
                        k,
                        {
                          checked: S.has(e),
                          onCheckedChange: () => ae(e),
                          onSelect: (e) => e.preventDefault(),
                          children: [
                            (0, K.jsx)(t.icon, {
                              size: 16,
                              className: t.text + ` mr-2`,
                            }),
                            (0, K.jsx)(`span`, {
                              className: t.text,
                              children: t.label,
                            }),
                          ],
                        },
                        e,
                      );
                    }),
                  }),
                ],
              }),
            A &&
              (0, K.jsxs)(y, {
                children: [
                  (0, K.jsx)(w, {
                    asChild: !0,
                    children: (0, K.jsx)(M, {
                      variant: `secondary`,
                      size: `icon`,
                      className: `h-8 w-8`,
                      onClick: () => b({ dir: _ === `asc` ? `desc` : `asc` }),
                      children:
                        T === `asc`
                          ? (0, K.jsx)(Te, { size: 16 })
                          : (0, K.jsx)(W, { size: 16 }),
                    }),
                  }),
                  (0, K.jsx)(P, {
                    children:
                      T === `asc`
                        ? `Ascending - click to reverse`
                        : `Descending - click to reverse`,
                  }),
                ],
              }),
            (0, K.jsxs)(M, {
              size: `sm`,
              className: `motion-press hover:scale-[1.01] active:scale-[0.99]`,
              onClick: () => f(!0),
              children: [
                (0, K.jsx)(de, { size: 16 }),
                (0, K.jsx)(`span`, {
                  className: `hidden sm:inline`,
                  children: `New Project`,
                }),
              ],
            }),
          ],
        }),
        children: (0, K.jsx)(`div`, {
          className: `relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0`,
          children:
            c === void 0
              ? (0, K.jsx)(`div`, {
                  className: `flex flex-1 items-center justify-center`,
                  children: (0, K.jsx)(g, {}),
                })
              : c.length === 0
                ? (0, K.jsx)(xe, {
                    icon: (0, K.jsx)(L, {
                      size: 24,
                      className: `text-muted-foreground`,
                    }),
                    title: `No projects yet`,
                    description: `Create a project to describe a feature and let AI help you break it down into tasks`,
                    actionLabel: `Create Project`,
                    onAction: () => f(!0),
                  })
                : (0, K.jsx)(V, {
                    initial: !1,
                    mode: `wait`,
                    children:
                      v === `kanban`
                        ? (0, K.jsx)(
                            ee.div,
                            {
                              className: `flex flex-1 min-h-0 items-stretch gap-3 overflow-x-auto overflow-y-hidden scrollbar [&>*]:min-w-[220px] sm:[&>*]:min-w-0`,
                              initial: { opacity: 0, y: 8 },
                              animate: { opacity: 1, y: 0 },
                              exit: { opacity: 0, y: -8 },
                              transition: { duration: 0.2 },
                              children: (0, K.jsx)(Ge, {
                                projectsByPhase: N,
                                visiblePhases: S,
                                owner: n,
                                name: i,
                                onOpenProject: oe,
                                onDelete: (e, t) => D({ id: e, title: t }),
                              }),
                            },
                            `projects-kanban-view`,
                          )
                        : v === `timeline`
                          ? (0, K.jsx)(
                              ee.div,
                              {
                                className: `flex flex-1 min-h-0 min-w-0`,
                                initial: { opacity: 0, y: 8 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: -8 },
                                transition: { duration: 0.2 },
                                children: (0, K.jsx)(Le, {
                                  projects: re,
                                  basePath: t,
                                }),
                              },
                              `projects-timeline-view`,
                            )
                          : (0, K.jsx)(
                              ee.div,
                              {
                                className: `flex flex-1 min-h-0`,
                                initial: { opacity: 0, y: 8 },
                                animate: { opacity: 1, y: 0 },
                                exit: { opacity: 0, y: -8 },
                                transition: { duration: 0.2 },
                                children: (0, K.jsx)(We, {
                                  projectsByPhase: N,
                                  visiblePhases: S,
                                  basePath: t,
                                  onOpenProject: oe,
                                  onDelete: (e, t) => D({ id: e, title: t }),
                                }),
                              },
                              `projects-list-view`,
                            ),
                  }),
        }),
      }),
      (0, K.jsx)(De, { isOpen: d, onClose: () => f(!1) }),
      (0, K.jsx)(Ke, {
        project: E,
        onClose: () => D(null),
        onConfirm: F,
        isDeleting: te,
      }),
    ],
  });
}
var Ye = Je;
export { Ye as component };
