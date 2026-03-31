import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./link-HPAZ_wn3.js";
import { t as i } from "./useNavigate-B8SeWprX.js";
import { T as a } from "./index-DSqEo2z3.js";
import { c as o, n as s, o as c } from "./backend-BVlbQtYj.js";
import { t as l } from "./hooks-B_9i2gKL.js";
import {
  Cn as u,
  Gn as d,
  Kt as f,
  Rn as p,
  Sn as m,
  Un as h,
  Vn as g,
  Wn as _,
  Z as v,
  ar as y,
  dn as b,
  ir as x,
  jn as S,
  mn as C,
  pn as w,
  ur as T,
  vr as E,
  wn as D,
  xn as O,
  yr as k,
} from "./src-DzioQSsH.js";
import { t as A } from "./createReactComponent-C2GWxX5y.js";
import { t as j } from "./IconBrandGithub-DBmykLtu.js";
import { t as M } from "./IconCode-DJtbkNrt.js";
import { t as N } from "./IconDots-BEl8aRmt.js";
import { t as P } from "./IconEyeOff-BRNChqHT.js";
import { t as F } from "./IconEye-B7_3GMo_.js";
import { t as I } from "./IconFileText-y2qCeLR_.js";
import { t as L } from "./IconFolders-Cug1raja.js";
import { t as R } from "./IconLayoutKanban-Ci0D2ZgQ.js";
import { t as z } from "./IconPlus-ZLqtR4Mv.js";
import { t as B } from "./IconRefresh-BfbGd9fI.js";
import { t as V } from "./IconSettings-Dmucb6RQ.js";
import { t as H } from "./IconSparkles-Bq4op_oV.js";
import { t as U } from "./AnimatePresence-DH-EW7mD.js";
import { n as W } from "./repoUrl-qff7-TKX.js";
import { t as G } from "./PageWrapper-Z5X-C4Rx.js";
var K = A(`outline`, `plug-connected-x`, `PlugConnectedX`, [
    [`path`, { d: `M20 16l-4 4`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M7 12l5 5l-1.5 1.5a3.536 3.536 0 1 1 -5 -5l1.5 -1.5`,
        key: `svg-1`,
      },
    ],
    [
      `path`,
      {
        d: `M17 12l-5 -5l1.5 -1.5a3.536 3.536 0 1 1 5 5l-1.5 1.5`,
        key: `svg-2`,
      },
    ],
    [`path`, { d: `M3 21l2.5 -2.5`, key: `svg-3` }],
    [`path`, { d: `M18.5 5.5l2.5 -2.5`, key: `svg-4` }],
    [`path`, { d: `M10 11l-2 2`, key: `svg-5` }],
    [`path`, { d: `M13 14l-2 2`, key: `svg-6` }],
    [`path`, { d: `M16 16l4 4`, key: `svg-7` }],
  ]),
  q = e(t(), 1),
  J = a(),
  Y = n(),
  X = [
    {
      icon: R,
      label: `Projects`,
      shortDesc: `Autonomous feature builder`,
      longDesc: `Eva plans and executes large features end-to-end — tasks, PRs, and reviews — without interrupting your flow.`,
    },
    {
      icon: k,
      label: `Sessions`,
      shortDesc: `Interactive pair programming`,
      longDesc: `Chat with Eva in real time to iterate on ideas, debug issues, and ship incremental changes fast.`,
    },
    {
      icon: M,
      label: `Quick Tasks`,
      shortDesc: `Small fixes & changes`,
      longDesc: `Ship one-off fixes and small changes without spinning up a full project or session.`,
    },
    {
      icon: I,
      label: `Documents`,
      shortDesc: `AI-assisted docs`,
      longDesc: `Generate and maintain specs, PRDs, and runbooks — kept in sync with your actual codebase.`,
    },
  ];
function Z(e) {
  let t = (0, J.c)(13),
    { onDismiss: n } = e,
    r,
    i,
    a,
    o;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = { opacity: 0, y: -6 }),
      (i = { opacity: 1, y: 0 }),
      (a = { opacity: 0, y: -6 }),
      (o = { duration: 0.2 }),
      (t[0] = r),
      (t[1] = i),
      (t[2] = a),
      (t[3] = o))
    : ((r = t[0]), (i = t[1]), (a = t[2]), (o = t[3]));
  let s;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, Y.jsx)(`div`, {
        className: `pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl`,
      })),
      (t[4] = s))
    : (s = t[4]);
  let c;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, Y.jsxs)(`div`, {
        className: `flex items-center gap-2`,
        children: [
          (0, Y.jsx)(`div`, {
            className: `flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10`,
            children: (0, Y.jsx)(H, { size: 14, className: `text-primary` }),
          }),
          (0, Y.jsx)(`p`, {
            className: `text-sm font-semibold text-foreground`,
            children: `Getting started with Eva`,
          }),
        ],
      })),
      (t[5] = c))
    : (c = t[5]);
  let l;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (0, Y.jsx)(E, { size: 14 })), (t[6] = l))
    : (l = t[6]);
  let u;
  t[7] === n
    ? (u = t[8])
    : ((u = (0, Y.jsxs)(`div`, {
        className: `mb-3 flex items-center justify-between`,
        children: [
          c,
          (0, Y.jsx)(T, {
            size: `icon`,
            variant: `ghost`,
            onClick: n,
            className: `-mr-1 h-7 w-7 text-muted-foreground hover:text-foreground`,
            children: l,
          }),
        ],
      })),
      (t[7] = n),
      (t[8] = u));
  let d;
  t[9] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = (0, Y.jsx)(`p`, {
        className: `mb-3 text-xs text-muted-foreground`,
        children: `Select a repository below to access Eva's tools for planning, coding, and shipping.`,
      })),
      (t[9] = d))
    : (d = t[9]);
  let f;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, Y.jsx)(`div`, {
        className: `grid grid-cols-2 gap-2 sm:grid-cols-4`,
        children: X.map(Q),
      })),
      (t[10] = f))
    : (f = t[10]);
  let p;
  return (
    t[11] === u
      ? (p = t[12])
      : ((p = (0, Y.jsx)(v.div, {
          initial: r,
          animate: i,
          exit: a,
          transition: o,
          children: (0, Y.jsx)(x, {
            className: `ui-surface-strong mb-6 overflow-hidden`,
            children: (0, Y.jsx)(y, {
              className: `p-4 sm:p-5`,
              children: (0, Y.jsxs)(`div`, {
                className: `relative`,
                children: [s, u, d, f],
              }),
            }),
          }),
        })),
        (t[11] = u),
        (t[12] = p)),
    p
  );
}
function Q(e) {
  return (0, Y.jsxs)(
    `div`,
    {
      className: `flex flex-col gap-1.5 rounded-lg bg-muted/40 p-2.5`,
      children: [
        (0, Y.jsx)(`div`, {
          className: `flex h-6 w-6 items-center justify-center rounded-md bg-primary/10`,
          children: (0, Y.jsx)(e.icon, { size: 13, className: `text-primary` }),
        }),
        (0, Y.jsx)(`p`, {
          className: `text-xs font-medium text-foreground`,
          children: e.label,
        }),
        (0, Y.jsx)(`p`, {
          className: `text-[11px] leading-relaxed text-muted-foreground`,
          children: e.shortDesc,
        }),
      ],
    },
    e.label,
  );
}
function ee(e) {
  let t = (0, J.c)(17),
    { connectUrl: n } = e,
    r;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = [
        { num: 1, label: `Connect GitHub`, active: !0 },
        { num: 2, label: `Select a repo`, active: !1 },
        { num: 3, label: `Start building`, active: !1 },
      ]),
      (t[0] = r))
    : (r = t[0]);
  let i = r,
    a,
    o,
    s;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = { opacity: 0, y: 10 }),
      (o = { opacity: 1, y: 0 }),
      (s = { duration: 0.25 }),
      (t[1] = a),
      (t[2] = o),
      (t[3] = s))
    : ((a = t[1]), (o = t[2]), (s = t[3]));
  let c;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, Y.jsx)(`div`, {
        className: `mb-12 flex items-center gap-2`,
        children: i.map((e, t) =>
          (0, Y.jsxs)(
            `div`,
            {
              className: `flex items-center gap-2`,
              children: [
                (0, Y.jsx)(`div`, {
                  className: `flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all ${e.active ? `bg-primary text-background ring-2 ring-primary/25 ring-offset-1 ring-offset-background` : `bg-secondary text-muted-foreground`}`,
                  children: e.num,
                }),
                (0, Y.jsx)(`span`, {
                  className: `whitespace-nowrap text-xs ${e.active ? `font-medium text-foreground` : `text-muted-foreground`}`,
                  children: e.label,
                }),
                t < i.length - 1 &&
                  (0, Y.jsx)(`div`, {
                    className: `mx-1 h-px w-8 flex-shrink-0 ${t === 0 ? `bg-gradient-to-r from-primary/40 to-border` : `bg-border`}`,
                  }),
              ],
            },
            e.num,
          ),
        ),
      })),
      (t[4] = c))
    : (c = t[4]);
  let l, u;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (0, Y.jsx)(`div`, {
        className: `absolute h-32 w-32 rounded-full bg-primary/5 blur-3xl`,
      })),
      (u = (0, Y.jsx)(`div`, {
        className: `absolute h-20 w-20 rounded-full bg-primary/10 blur-xl`,
      })),
      (t[5] = l),
      (t[6] = u))
    : ((l = t[5]), (u = t[6]));
  let d, f, p;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, Y.jsxs)(`div`, {
        className: `relative mb-6 flex items-center justify-center`,
        children: [
          l,
          u,
          (0, Y.jsx)(`div`, {
            className: `relative flex h-14 w-14 items-center justify-center rounded-2xl bg-muted/40 ring-1 ring-primary/15`,
            children: (0, Y.jsx)(j, { size: 26, className: `text-primary` }),
          }),
        ],
      })),
      (p = (0, Y.jsx)(`h2`, {
        className: `mb-2 text-xl font-semibold tracking-tight text-foreground`,
        children: `Connect your GitHub`,
      })),
      (d = (0, Y.jsx)(`p`, {
        className: `mb-6 text-sm leading-relaxed text-muted-foreground`,
        children: `Link your codebases to unlock Eva's AI tools for planning, coding, and shipping features autonomously.`,
      })),
      (t[7] = d),
      (t[8] = f),
      (t[9] = p))
    : ((d = t[7]), (f = t[8]), (p = t[9]));
  let m;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (0, Y.jsx)(j, { size: 16 })), (t[10] = m))
    : (m = t[10]);
  let h;
  t[11] === n
    ? (h = t[12])
    : ((h = (0, Y.jsxs)(`div`, {
        className: `mb-10 flex max-w-sm flex-col items-center text-center`,
        children: [
          f,
          p,
          d,
          (0, Y.jsx)(T, {
            asChild: !0,
            className: `bg-foreground px-6 font-medium text-background hover:scale-[1.01] active:scale-[0.99]`,
            children: (0, Y.jsxs)(`a`, {
              href: n,
              children: [m, `Connect GitHub`],
            }),
          }),
        ],
      })),
      (t[11] = n),
      (t[12] = h));
  let g;
  t[13] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = (0, Y.jsx)(`p`, {
        className: `mb-3 text-center text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60`,
        children: `What you'll get access to`,
      })),
      (t[13] = g))
    : (g = t[13]);
  let _;
  t[14] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((_ = (0, Y.jsxs)(`div`, {
        className: `w-full max-w-lg`,
        children: [
          g,
          (0, Y.jsx)(`div`, {
            className: `grid grid-cols-2 gap-2 sm:grid-cols-4`,
            children: X.map(te),
          }),
        ],
      })),
      (t[14] = _))
    : (_ = t[14]);
  let y;
  return (
    t[15] === h
      ? (y = t[16])
      : ((y = (0, Y.jsxs)(v.div, {
          initial: a,
          animate: o,
          transition: s,
          className: `flex flex-col items-center px-4 py-12`,
          children: [c, h, _],
        })),
        (t[15] = h),
        (t[16] = y)),
    y
  );
}
function te(e, t) {
  return (0, Y.jsx)(
    v.div,
    {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.2, delay: 0.15 + t * 0.06 },
      children: (0, Y.jsxs)(x, {
        className: `ui-surface-strong h-full overflow-hidden`,
        children: [
          (0, Y.jsx)(`div`, {
            className: `h-px bg-gradient-to-r from-primary/50 via-primary/20 to-transparent`,
          }),
          (0, Y.jsxs)(y, {
            className: `p-3`,
            children: [
              (0, Y.jsx)(e.icon, { size: 16, className: `mb-2 text-primary` }),
              (0, Y.jsx)(`p`, {
                className: `text-xs font-medium text-foreground`,
                children: e.label,
              }),
              (0, Y.jsx)(`p`, {
                className: `mt-1 text-[11px] leading-relaxed text-muted-foreground`,
                children: e.longDesc,
              }),
            ],
          }),
        ],
      }),
    },
    e.label,
  );
}
function ne(e) {
  let t = (0, J.c)(50),
    { repo: n, index: i, onManageApps: a } = e,
    c = o(s.githubRepos.toggleHidden),
    l = n._id,
    d,
    f,
    p;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = { opacity: 0, y: 10 }),
      (f = { opacity: 1, y: 0 }),
      (p = { opacity: 0, y: -10 }),
      (t[0] = d),
      (t[1] = f),
      (t[2] = p))
    : ((d = t[0]), (f = t[1]), (p = t[2]));
  let h = Math.min(i * 0.03, 0.2),
    g;
  t[3] === h
    ? (g = t[4])
    : ((g = { duration: 0.2, delay: h }), (t[3] = h), (t[4] = g));
  let _;
  t[5] !== n.name || t[6] !== n.owner || t[7] !== n.rootDirectory
    ? ((_ = W(n.owner, n.name, n.rootDirectory)),
      (t[5] = n.name),
      (t[6] = n.owner),
      (t[7] = n.rootDirectory),
      (t[8] = _))
    : (_ = t[8]);
  let b = n.connected === !1 ? `text-destructive/60` : `text-muted-foreground`,
    C;
  t[9] === b
    ? (C = t[10])
    : ((C = (0, Y.jsx)(j, { size: 20, className: b })),
      (t[9] = b),
      (t[10] = C));
  let w;
  t[11] !== n.name || t[12] !== n.rootDirectory
    ? ((w = n.rootDirectory ? n.rootDirectory.split(`/`).pop() : n.name),
      (t[11] = n.name),
      (t[12] = n.rootDirectory),
      (t[13] = w))
    : (w = t[13]);
  let T;
  t[14] === w
    ? (T = t[15])
    : ((T = (0, Y.jsx)(`p`, {
        className: `truncate text-sm font-medium text-foreground`,
        children: w,
      })),
      (t[14] = w),
      (t[15] = T));
  let E;
  t[16] !== n.name || t[17] !== n.owner
    ? ((E = (0, Y.jsxs)(`p`, {
        className: `mt-0.5 text-xs text-muted-foreground`,
        children: [n.owner, `/`, n.name],
      })),
      (t[16] = n.name),
      (t[17] = n.owner),
      (t[18] = E))
    : (E = t[18]);
  let O;
  t[19] !== T || t[20] !== E
    ? ((O = (0, Y.jsxs)(`div`, {
        className: `min-w-0 flex-1`,
        children: [T, E],
      })),
      (t[19] = T),
      (t[20] = E),
      (t[21] = O))
    : (O = t[21]);
  let k;
  t[22] === n.connected
    ? (k = t[23])
    : ((k =
        n.connected === !1 &&
        (0, Y.jsxs)(`div`, {
          className: `flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-destructive`,
          children: [
            (0, Y.jsx)(K, { size: 11 }),
            (0, Y.jsx)(`span`, {
              className: `text-[11px] font-medium`,
              children: `Disconnected`,
            }),
          ],
        })),
      (t[22] = n.connected),
      (t[23] = k));
  let A;
  t[24] !== O || t[25] !== k || t[26] !== C
    ? ((A = (0, Y.jsx)(x, {
        className: `motion-emphasized ui-surface-interactive cursor-pointer`,
        children: (0, Y.jsxs)(y, {
          className: `flex items-center gap-3 p-3`,
          children: [C, O, k],
        }),
      })),
      (t[24] = O),
      (t[25] = k),
      (t[26] = C),
      (t[27] = A))
    : (A = t[27]);
  let M;
  t[28] !== A || t[29] !== _
    ? ((M = (0, Y.jsx)(S, {
        asChild: !0,
        children: (0, Y.jsx)(`div`, {
          className: `group/card relative`,
          children: (0, Y.jsx)(r, {
            to: _,
            className: `block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35`,
            children: A,
          }),
        }),
      })),
      (t[28] = A),
      (t[29] = _),
      (t[30] = M))
    : (M = t[30]);
  let N;
  t[31] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((N = (0, Y.jsx)(L, { size: 16 })), (t[31] = N))
    : (N = t[31]);
  let F;
  t[32] === a
    ? (F = t[33])
    : ((F = (0, Y.jsxs)(D, { onClick: a, children: [N, `Manage apps`] })),
      (t[32] = a),
      (t[33] = F));
  let I;
  t[34] !== n._id || t[35] !== c
    ? ((I = () => c({ repoId: n._id, hidden: !0 })),
      (t[34] = n._id),
      (t[35] = c),
      (t[36] = I))
    : (I = t[36]);
  let R;
  t[37] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((R = (0, Y.jsx)(P, { size: 16 })), (t[37] = R))
    : (R = t[37]);
  let z;
  t[38] === I
    ? (z = t[39])
    : ((z = (0, Y.jsxs)(D, { onClick: I, children: [R, `Hide`] })),
      (t[38] = I),
      (t[39] = z));
  let B;
  t[40] !== F || t[41] !== z
    ? ((B = (0, Y.jsxs)(u, { children: [F, z] })),
      (t[40] = F),
      (t[41] = z),
      (t[42] = B))
    : (B = t[42]);
  let V;
  t[43] !== M || t[44] !== B
    ? ((V = (0, Y.jsxs)(m, { children: [M, B] })),
      (t[43] = M),
      (t[44] = B),
      (t[45] = V))
    : (V = t[45]);
  let H;
  return (
    t[46] !== n._id || t[47] !== V || t[48] !== g
      ? ((H = (0, Y.jsx)(
          v.div,
          { initial: d, animate: f, exit: p, transition: g, children: V },
          l,
        )),
        (t[46] = n._id),
        (t[47] = V),
        (t[48] = g),
        (t[49] = H))
      : (H = t[49]),
    H
  );
}
function re(e) {
  let t = (0, J.c)(16),
    { groupName: n, repos: r, onManageApps: i } = e,
    a,
    o,
    s;
  if (t[0] !== n || t[1] !== i || t[2] !== r) {
    let e = r.reduce(oe, {}),
      c = Object.entries(e).sort(ae);
    (t[6] === n
      ? (s = t[7])
      : ((s = (0, Y.jsx)(`h2`, {
          className: `mb-3 text-sm font-semibold text-foreground`,
          children: n,
        })),
        (t[6] = n),
        (t[7] = s)),
      (a = `space-y-4`));
    let l;
    (t[8] === i
      ? (l = t[9])
      : ((l = (e) => {
          let [t, n] = e;
          return (0, Y.jsxs)(
            `div`,
            {
              children: [
                (0, Y.jsxs)(`div`, {
                  className: `mb-2 flex items-center gap-2`,
                  children: [
                    (n.length > 1 || n.some(ie)) &&
                      (0, Y.jsx)(L, {
                        size: 14,
                        className: `text-muted-foreground/60`,
                      }),
                    (0, Y.jsx)(`h3`, {
                      className: `text-xs font-medium text-muted-foreground`,
                      children: t,
                    }),
                  ],
                }),
                (0, Y.jsx)(`div`, {
                  className: `grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3`,
                  children: (0, Y.jsx)(U, {
                    initial: !1,
                    children: n.map((e, t) =>
                      (0, Y.jsx)(
                        ne,
                        { repo: e, index: t, onManageApps: () => i(e) },
                        e._id,
                      ),
                    ),
                  }),
                }),
              ],
            },
            t,
          );
        }),
        (t[8] = i),
        (t[9] = l)),
      (o = c.map(l)),
      (t[0] = n),
      (t[1] = i),
      (t[2] = r),
      (t[3] = a),
      (t[4] = o),
      (t[5] = s));
  } else ((a = t[3]), (o = t[4]), (s = t[5]));
  let c;
  t[10] !== a || t[11] !== o
    ? ((c = (0, Y.jsx)(`div`, { className: a, children: o })),
      (t[10] = a),
      (t[11] = o),
      (t[12] = c))
    : (c = t[12]);
  let l;
  return (
    t[13] !== s || t[14] !== c
      ? ((l = (0, Y.jsxs)(`div`, { children: [s, c] })),
        (t[13] = s),
        (t[14] = c),
        (t[15] = l))
      : (l = t[15]),
    l
  );
}
function ie(e) {
  return e.rootDirectory;
}
function ae(e, t) {
  let [n] = e,
    [r] = t;
  return n.localeCompare(r);
}
function oe(e, t) {
  let n = `${t.owner}/${t.name}`;
  return (e[n] || (e[n] = []), e[n].push(t), e);
}
function se(e) {
  let t = (0, J.c)(25),
    { open: n, onOpenChange: r } = e,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = { includeHidden: !0 }), (t[0] = i))
    : (i = t[0]);
  let a = l(s.githubRepos.list, i),
    c = o(s.githubRepos.toggleHidden),
    u,
    f,
    m,
    h,
    v,
    y,
    b;
  if (t[1] !== a || t[2] !== r || t[3] !== n || t[4] !== c) {
    let e = a?.filter(ce) ?? [];
    ((f = p),
      (y = n),
      (b = r),
      (u = g),
      t[12] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((v = (0, Y.jsx)(_, {
            children: (0, Y.jsx)(d, { children: `Hidden Codebases` }),
          })),
          (t[12] = v))
        : (v = t[12]),
      (m = `mt-2 space-y-2 max-h-96 overflow-y-auto`),
      (h =
        e.length === 0
          ? (0, Y.jsx)(`p`, {
              className: `py-6 text-center text-sm text-muted-foreground`,
              children: `No hidden codebases`,
            })
          : e.map((e) =>
              (0, Y.jsxs)(
                `div`,
                {
                  className: `flex items-center justify-between rounded-lg bg-muted/40 p-3`,
                  children: [
                    (0, Y.jsxs)(`div`, {
                      className: `flex items-center gap-3 min-w-0`,
                      children: [
                        (0, Y.jsx)(j, {
                          size: 18,
                          className: `shrink-0 text-muted-foreground`,
                        }),
                        (0, Y.jsxs)(`div`, {
                          className: `min-w-0`,
                          children: [
                            (0, Y.jsx)(`p`, {
                              className: `truncate text-sm font-medium text-foreground`,
                              children: e.rootDirectory
                                ? e.rootDirectory.split(`/`).pop()
                                : e.name,
                            }),
                            (0, Y.jsxs)(`p`, {
                              className: `text-xs text-muted-foreground`,
                              children: [e.owner, `/`, e.name],
                            }),
                          ],
                        }),
                      ],
                    }),
                    (0, Y.jsxs)(T, {
                      size: `sm`,
                      variant: `ghost`,
                      onClick: () => c({ repoId: e._id, hidden: !1 }),
                      className: `shrink-0 text-muted-foreground hover:text-foreground`,
                      children: [(0, Y.jsx)(F, { size: 16 }), `Show`],
                    }),
                  ],
                },
                e._id,
              ),
            )),
      (t[1] = a),
      (t[2] = r),
      (t[3] = n),
      (t[4] = c),
      (t[5] = u),
      (t[6] = f),
      (t[7] = m),
      (t[8] = h),
      (t[9] = v),
      (t[10] = y),
      (t[11] = b));
  } else
    ((u = t[5]),
      (f = t[6]),
      (m = t[7]),
      (h = t[8]),
      (v = t[9]),
      (y = t[10]),
      (b = t[11]));
  let x;
  t[13] !== m || t[14] !== h
    ? ((x = (0, Y.jsx)(`div`, { className: m, children: h })),
      (t[13] = m),
      (t[14] = h),
      (t[15] = x))
    : (x = t[15]);
  let S;
  t[16] !== u || t[17] !== v || t[18] !== x
    ? ((S = (0, Y.jsxs)(u, { children: [v, x] })),
      (t[16] = u),
      (t[17] = v),
      (t[18] = x),
      (t[19] = S))
    : (S = t[19]);
  let C;
  return (
    t[20] !== f || t[21] !== y || t[22] !== b || t[23] !== S
      ? ((C = (0, Y.jsx)(f, { open: y, onOpenChange: b, children: S })),
        (t[20] = f),
        (t[21] = y),
        (t[22] = b),
        (t[23] = S),
        (t[24] = C))
      : (C = t[24]),
    C
  );
}
function ce(e) {
  return e.hidden === !0;
}
var le = `vb-eva-dev`,
  $ = `eva-welcome-dismissed`;
function ue() {
  let e = (0, J.c)(37),
    t = i(),
    n;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((n = {}), (e[0] = n))
    : (n = e[0]);
  let r = l(s.githubRepos.list, n),
    a = l(s.teams.list) ?? [],
    o = c(s.github.syncRepos),
    [u, m] = (0, q.useState)(!1),
    [v, y] = (0, q.useState)(!1),
    [x, S] = (0, q.useState)(!1),
    [E, D] = (0, q.useState)(!0),
    k,
    A;
  (e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((k = () => {
        D(localStorage.getItem($) === `true`);
      }),
      (A = []),
      (e[1] = k),
      (e[2] = A))
    : ((k = e[1]), (A = e[2])),
    (0, q.useEffect)(k, A));
  let j;
  e[3] === o
    ? (j = e[4])
    : ((j = async () => {
        m(!0);
        try {
          await o();
        } catch (e) {
          console.error(`Sync failed:`, e);
        }
        m(!1);
      }),
      (e[3] = o),
      (e[4] = j));
  let M = j,
    F;
  e[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((F = () => {
        (localStorage.setItem($, `true`), D(!0));
      }),
      (e[5] = F))
    : (F = e[5]);
  let I = F,
    L = `https://github.com/apps/` + le + `/installations/new`,
    R = r && r.length > 0,
    H;
  e[6] !== r || e[7] !== a
    ? ((H = r
        ? r.reduce((e, t) => {
            let n = t.teamId ? a.find((e) => e._id === t.teamId) : void 0,
              r = n ? (n.displayName ?? n.name) : `My Team`;
            return (e[r] || (e[r] = []), e[r].push(t), e);
          }, {})
        : {}),
      (e[6] = r),
      (e[7] = a),
      (e[8] = H))
    : (H = e[8]);
  let K = H,
    X;
  if (
    e[9] !== K ||
    e[10] !== M ||
    e[11] !== R ||
    e[12] !== v ||
    e[13] !== t ||
    e[14] !== r ||
    e[15] !== x ||
    e[16] !== u ||
    e[17] !== E
  ) {
    let n = Object.keys(K).sort(de),
      i;
    e[19] !== M ||
    e[20] !== R ||
    e[21] !== v ||
    e[22] !== t ||
    e[23] !== x ||
    e[24] !== u
      ? ((i =
          R &&
          (0, Y.jsxs)(Y.Fragment, {
            children: [
              (0, Y.jsxs)(b, {
                children: [
                  (0, Y.jsx)(O, {
                    asChild: !0,
                    children: (0, Y.jsx)(T, {
                      size: `sm`,
                      variant: `outline`,
                      className: `motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]`,
                      children: (0, Y.jsx)(N, { size: 16 }),
                    }),
                  }),
                  (0, Y.jsxs)(w, {
                    align: `end`,
                    children: [
                      (0, Y.jsxs)(C, {
                        onClick: () => t({ to: `/settings/sync` }),
                        children: [
                          (0, Y.jsx)(V, { size: 16 }),
                          `Sync Settings`,
                        ],
                      }),
                      (0, Y.jsxs)(C, {
                        onClick: () => y(!0),
                        children: [
                          (0, Y.jsx)(P, { size: 16 }),
                          `Hidden Codebases`,
                        ],
                      }),
                      (0, Y.jsxs)(C, {
                        disabled: u,
                        onClick: () => S(!0),
                        children: [
                          (0, Y.jsx)(B, {
                            size: 16,
                            className: u ? `animate-spin` : ``,
                          }),
                          u ? `Syncing...` : `Sync Repos`,
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              (0, Y.jsx)(se, { open: v, onOpenChange: y }),
              (0, Y.jsx)(p, {
                open: x,
                onOpenChange: S,
                children: (0, Y.jsxs)(g, {
                  children: [
                    (0, Y.jsx)(_, {
                      children: (0, Y.jsx)(d, { children: `Sync Repos` }),
                    }),
                    (0, Y.jsx)(`p`, {
                      className: `text-sm text-muted-foreground`,
                      children: `This will re-sync all repositories from GitHub. Continue?`,
                    }),
                    (0, Y.jsxs)(h, {
                      children: [
                        (0, Y.jsx)(T, {
                          variant: `secondary`,
                          size: `sm`,
                          onClick: () => S(!1),
                          children: `Cancel`,
                        }),
                        (0, Y.jsxs)(T, {
                          size: `sm`,
                          disabled: u,
                          onClick: () => {
                            (S(!1), M());
                          },
                          children: [
                            (0, Y.jsx)(B, {
                              size: 16,
                              className: u ? `animate-spin` : ``,
                            }),
                            `Sync`,
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            ],
          })),
        (e[19] = M),
        (e[20] = R),
        (e[21] = v),
        (e[22] = t),
        (e[23] = x),
        (e[24] = u),
        (e[25] = i))
      : (i = e[25]);
    let a = R ? `https://github.com/settings/installations` : L,
      o = R ? `_blank` : void 0,
      s = R ? `noopener noreferrer` : void 0,
      c;
    e[26] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((c = (0, Y.jsx)(z, { size: 16 })), (e[26] = c))
      : (c = e[26]);
    let l = R ? `Add Repos` : `Connect GitHub`,
      m;
    e[27] === l
      ? (m = e[28])
      : ((m = (0, Y.jsx)(`span`, {
          className: `hidden sm:inline`,
          children: l,
        })),
        (e[27] = l),
        (e[28] = m));
    let D;
    e[29] !== s || e[30] !== m || e[31] !== a || e[32] !== o
      ? ((D = (0, Y.jsx)(T, {
          size: `sm`,
          asChild: !0,
          className: `motion-press bg-foreground font-medium text-background hover:scale-[1.01] active:scale-[0.99]`,
          children: (0, Y.jsxs)(`a`, {
            href: a,
            target: o,
            rel: s,
            children: [c, m],
          }),
        })),
        (e[29] = s),
        (e[30] = m),
        (e[31] = a),
        (e[32] = o),
        (e[33] = D))
      : (D = e[33]);
    let k;
    (e[34] !== D || e[35] !== i
      ? ((k = (0, Y.jsxs)(`div`, {
          className: `flex items-center gap-2`,
          children: [i, D],
        })),
        (e[34] = D),
        (e[35] = i),
        (e[36] = k))
      : (k = e[36]),
      (X = (0, Y.jsx)(G, {
        title: `Codebases`,
        headerRight: k,
        children:
          r === void 0
            ? (0, Y.jsx)(`div`, {
                className: `flex items-center justify-center py-20`,
                children: (0, Y.jsx)(f, { size: `md` }),
              })
            : r.length === 0
              ? (0, Y.jsx)(ee, { connectUrl: L })
              : (0, Y.jsxs)(Y.Fragment, {
                  children: [
                    (0, Y.jsx)(U, {
                      children: !E && (0, Y.jsx)(Z, { onDismiss: I }),
                    }),
                    (0, Y.jsx)(`div`, {
                      className: `space-y-6`,
                      children: n.map((e) =>
                        (0, Y.jsx)(
                          re,
                          {
                            groupName: e,
                            repos: K[e],
                            onManageApps: (e) =>
                              t({
                                to:
                                  W(e.owner, e.name, e.rootDirectory) +
                                  `/settings/monorepo`,
                              }),
                          },
                          e,
                        ),
                      ),
                    }),
                  ],
                }),
      })),
      (e[9] = K),
      (e[10] = M),
      (e[11] = R),
      (e[12] = v),
      (e[13] = t),
      (e[14] = r),
      (e[15] = x),
      (e[16] = u),
      (e[17] = E),
      (e[18] = X));
  } else X = e[18];
  return X;
}
function de(e, t) {
  return e === `My Team` ? -1 : t === `My Team` ? 1 : e.localeCompare(t);
}
var fe = ue;
export { fe as component };
