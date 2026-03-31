import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useNavigate-B8SeWprX.js";
import { T as i } from "./index-CuMF3NGg.js";
import { c as a, n as o, o as s } from "./backend-BVlbQtYj.js";
import { t as c } from "./hooks-B_9i2gKL.js";
import {
  $t as l,
  Bt as u,
  Cr as d,
  Gn as f,
  Gt as p,
  Hn as m,
  Ht as h,
  Jn as g,
  Jt as _,
  Kt as v,
  Qt as y,
  Rn as b,
  Rt as x,
  Un as S,
  Ut as C,
  Vn as w,
  Vt as T,
  Wn as E,
  Wt as D,
  Xn as O,
  Xt as k,
  Yn as A,
  Z as j,
  _n as M,
  bn as N,
  dn as P,
  dr as F,
  fn as I,
  gn as L,
  hn as R,
  lr as z,
  mn as B,
  on as V,
  pn as H,
  qt as U,
  sn as ee,
  ur as W,
  vn as te,
  vr as ne,
  xn as re,
  yn as ie,
  zt as G,
} from "./src-DHCpG1Q-.js";
import { t as ae } from "./createReactComponent-C2GWxX5y.js";
import { t as oe } from "./IconAlertCircle-DCb3MjbW.js";
import {
  a as K,
  c as q,
  i as se,
  n as ce,
  o as le,
  r as ue,
  s as J,
  t as de,
} from "./QuickTaskModal-Capr98Rt.js";
import {
  a as fe,
  i as pe,
  n as me,
  r as he,
} from "./ScheduleDateTimePicker-Dh4F1sPs.js";
import { t as ge } from "./IconChecklist-Bh1NM8HY.js";
import { r as Y, t as X } from "./TaskStatusBadge-Dnip6s2Y.js";
import { n as _e, t as ve } from "./ToggleSearch-Pbfed2dl.js";
import { t as ye } from "./IconFolder-B8BePKLB.js";
import { t as be } from "./IconFolders-Cug1raja.js";
import { t as xe } from "./IconGripVertical-DJUodMXs.js";
import { t as Se } from "./IconLayoutKanban-Ci0D2ZgQ.js";
import { n as Ce, t as we } from "./KanbanColumn-gWlMolgr.js";
import {
  a as Te,
  b as Ee,
  c as De,
  i as Oe,
  l as ke,
  m as Ae,
  n as je,
  s as Me,
  v as Ne,
  y as Pe,
} from "./ProjectPhaseBadge-lSuNBnqY.js";
import { t as Fe } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as Ie } from "./IconPlus-ZLqtR4Mv.js";
import { t as Le } from "./IconRefresh-BfbGd9fI.js";
import { t as Re } from "./IconSettings-Dmucb6RQ.js";
import { t as ze } from "./IconTrash-bHTcNORt.js";
import { t as Be } from "./IconUser-CnFB9Mif.js";
import { t as Ve } from "./AnimatePresence-qXAN7gDu.js";
import { n as He } from "./dates-DHZmrCUU.js";
import {
  C as Ue,
  _ as We,
  c as Ge,
  p as Ke,
  u as qe,
} from "./search-params-C2OhCtfp.js";
import { t as Je } from "./PageWrapper-CdtdiTMb.js";
import { t as Ye } from "./EmptyState-kahWQ4In.js";
import { n as Xe } from "./RepoContext-D9QMbL6d.js";
var Ze = ae(`outline`, `checkbox`, `Checkbox`, [
    [`path`, { d: `M9 11l3 3l8 -8`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M20 12v6a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h9`,
        key: `svg-1`,
      },
    ],
  ]),
  Qe = ae(`outline`, `file-import`, `FileImport`, [
    [`path`, { d: `M14 3v4a1 1 0 0 0 1 1h4`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M5 13v-8a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2h-5.5m-9.5 -2h7m-3 -3l3 3l-3 3`,
        key: `svg-1`,
      },
    ],
  ]),
  $e = ae(`outline`, `user-check`, `UserCheck`, [
    [`path`, { d: `M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0`, key: `svg-0` }],
    [`path`, { d: `M6 21v-2a4 4 0 0 1 4 -4h4`, key: `svg-1` }],
    [`path`, { d: `M15 19l2 2l4 -4`, key: `svg-2` }],
  ]),
  Z = i(),
  Q = e(t(), 1),
  $ = n();
function et(e) {
  let t = e.split(`
`),
    n = new Set();
  for (let e of t) {
    let t = e.trim();
    if (!t) continue;
    let r = t.match(/linear\.app\/[^/]+\/issue\/([A-Z]+-\d+)/i);
    if (r) {
      n.add(r[1].toUpperCase());
      continue;
    }
    let i = t.match(/^([A-Z]+-\d+)$/i);
    i && n.add(i[1].toUpperCase());
  }
  return Array.from(n);
}
function tt({ isOpen: e, onClose: t }) {
  let { repo: n } = Xe(),
    [r, i] = (0, Q.useState)(``),
    [c, l] = (0, Q.useState)(!1),
    [u, d] = (0, Q.useState)(null),
    p = s(o.linearActions.fetchIssues),
    m = a(o.agentTasks.createQuickTasksBatch),
    h = (0, Q.useMemo)(() => et(r), [r]),
    g = async () => {
      if (!(h.length === 0 || !n)) {
        (l(!0), d(null));
        try {
          let e = await p({ repoId: n._id, identifiers: h });
          if (e.length === 0) {
            d(
              `No issues found. Check that the identifiers are correct and you have access to them.`,
            );
            return;
          }
          let r = e.map((e) => ({
            title: `${e.identifier}: ${e.title}`,
            description: e.description || void 0,
          }));
          (await m({ repoId: n._id, tasks: r }), i(``), d(null), t());
        } catch (e) {
          d(e instanceof Error ? e.message : String(e));
        } finally {
          l(!1);
        }
      }
    },
    _ = () => {
      c || (d(null), t());
    };
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || _();
    },
    children: (0, $.jsxs)(w, {
      children: [
        (0, $.jsx)(E, {
          children: (0, $.jsx)(f, { children: `Import from Linear` }),
        }),
        (0, $.jsxs)(`div`, {
          className: `space-y-4`,
          children: [
            (0, $.jsxs)(`div`, {
              className: `space-y-1.5`,
              children: [
                (0, $.jsx)(V, {
                  placeholder: `Paste Linear URLs or identifiers (one per line)
Example:
https://linear.app/team/issue/TEAM-123/...
TEAM-456`,
                  value: r,
                  onChange: (e) => i(e.target.value),
                  rows: 6,
                  autoFocus: !0,
                }),
                h.length > 0 &&
                  (0, $.jsxs)(`p`, {
                    className: `text-sm text-muted-foreground break-words`,
                    children: [
                      h.length,
                      ` issue`,
                      h.length === 1 ? `` : `s`,
                      ` `,
                      `detected: `,
                      h.join(`, `),
                    ],
                  }),
              ],
            }),
            u &&
              (0, $.jsxs)(`div`, {
                className: `flex items-start gap-2 rounded-lg border border-destructive bg-destructive/10 p-3 text-sm text-destructive`,
                children: [
                  (0, $.jsx)(oe, { size: 16, className: `mt-0.5 shrink-0` }),
                  (0, $.jsx)(`div`, { children: u }),
                ],
              }),
          ],
        }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: _,
              disabled: c,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: g,
              disabled: c || h.length === 0,
              children: [
                c && (0, $.jsx)(v, { size: `sm` }),
                `Import `,
                h.length,
                ` Issue`,
                h.length === 1 ? `` : `s`,
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function nt(e) {
  let t = (0, Z.c)(21),
    { item: n, renderCard: r, onItemClick: i } = e,
    a;
  t[0] === n._id
    ? (a = t[1])
    : ((a = { id: n._id }), (t[0] = n._id), (t[1] = a));
  let {
      attributes: o,
      listeners: s,
      setNodeRef: c,
      transform: l,
      transition: u,
      isDragging: d,
    } = J(a),
    f;
  t[2] === l
    ? (f = t[3])
    : ((f = Ee.Transform.toString(l)), (t[2] = l), (t[3] = f));
  let p;
  t[4] !== f || t[5] !== u
    ? ((p = { transform: f, transition: u }),
      (t[4] = f),
      (t[5] = u),
      (t[6] = p))
    : (p = t[6]);
  let m = p,
    h = `rounded-lg transition-opacity duration-150 ${d ? `opacity-40 cursor-grabbing` : `cursor-grab`}`,
    g;
  t[7] !== n || t[8] !== i
    ? ((g = () => i(n)), (t[7] = n), (t[8] = i), (t[9] = g))
    : (g = t[9]);
  let _;
  t[10] !== n || t[11] !== r
    ? ((_ = r(n)), (t[10] = n), (t[11] = r), (t[12] = _))
    : (_ = t[12]);
  let v;
  return (
    t[13] !== o ||
    t[14] !== s ||
    t[15] !== c ||
    t[16] !== m ||
    t[17] !== h ||
    t[18] !== g ||
    t[19] !== _
      ? ((v = (0, $.jsx)(j.div, {
          layout: !0,
          ref: c,
          style: m,
          className: h,
          ...o,
          ...s,
          onClick: g,
          children: _,
        })),
        (t[13] = o),
        (t[14] = s),
        (t[15] = c),
        (t[16] = m),
        (t[17] = h),
        (t[18] = g),
        (t[19] = _),
        (t[20] = v))
      : (v = t[20]),
    v
  );
}
function rt(e) {
  let t = (0, Z.c)(48),
    {
      items: n,
      onStatusChange: r,
      renderCard: i,
      renderOverlay: a,
      onItemClick: o,
      fillHeight: s,
      columnExtra: c,
    } = e,
    l = s === void 0 ? !1 : s,
    [u, d] = (0, Q.useState)(null),
    [f, p] = (0, Q.useState)(null),
    m;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = { q: Ke, statuses: We }), (t[0] = m))
    : (m = t[0]);
  let [h] = Ue(m),
    { q: g, statuses: _ } = h,
    v = g,
    y;
  t[1] === _ ? (y = t[2]) : ((y = new Set(_)), (t[1] = _), (t[2] = y));
  let b = y,
    x;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((x = { activationConstraint: { delay: 200, tolerance: 10 } }),
      (t[3] = x))
    : (x = t[3]);
  let S = Pe(Ne(De, x)),
    C;
  if (t[4] !== n || t[5] !== v) {
    bb0: {
      let e = v.toLowerCase().trim();
      if (!e) {
        C = n;
        break bb0;
      }
      C = n.filter(
        (t) =>
          t.title.toLowerCase().includes(e) ||
          t.description?.toLowerCase().includes(e),
      );
    }
    ((t[4] = n), (t[5] = v), (t[6] = C));
  } else C = t[6];
  let w = C,
    T;
  t[7] === w
    ? (T = t[8])
    : ((T = X.reduce(
        (e, t) => ((e[t] = w.filter((e) => e.status === t)), e),
        {},
      )),
      (t[7] = w),
      (t[8] = T));
  let E = T,
    D;
  t[9] === n
    ? (D = t[10])
    : ((D = (e) => {
        let t = n.find((t) => t._id === e.active.id);
        if (t) {
          d(t);
          let n =
            e.active.rect.current.initial?.width ??
            e.active.rect.current.translated?.width;
          p(n ? Math.round(n) : null);
        }
      }),
      (t[9] = n),
      (t[10] = D));
  let O = D,
    k;
  t[11] !== n || t[12] !== r
    ? ((k = async (e) => {
        (d(null), p(null));
        let { active: t, over: i } = e;
        if (!i) return;
        let a = t.id,
          o = i.id,
          s = n.find((e) => e._id === a);
        if (!s) return;
        let c = X.find((e) => e === o);
        if (c) {
          if (s.status !== c)
            try {
              await r(a, c);
            } catch (e) {
              console.error(`Failed to update status:`, e);
            }
          return;
        }
        let l = n.find((e) => e._id === o);
        if (l && s.status !== l.status)
          try {
            await r(a, l.status);
          } catch (e) {
            console.error(`Failed to update status:`, e);
          }
      }),
      (t[11] = n),
      (t[12] = r),
      (t[13] = k))
    : (k = t[13]);
  let A = k,
    M;
  t[14] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((M = (e) => {
        (d(null), p(null));
      }),
      (t[14] = M))
    : (M = t[14]);
  let N = M,
    P = l
      ? `flex min-w-0 flex-1 min-h-0 flex-col gap-3 animate-in fade-in duration-300`
      : `space-y-3 animate-in fade-in duration-300`,
    F = `flex w-full items-stretch gap-2 pb-1 sm:gap-3 ${l ? `min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden scrollbar snap-x snap-mandatory sm:snap-none` : ``}`,
    I;
  if (t[15] !== c || t[16] !== E || t[17] !== o || t[18] !== i || t[19] !== b) {
    let e;
    t[21] === b
      ? (e = t[22])
      : ((e = (e) => b.has(e)), (t[21] = b), (t[22] = e));
    let n;
    (t[23] !== c || t[24] !== E || t[25] !== o || t[26] !== i
      ? ((n = (e) =>
          (0, $.jsx)(
            j.div,
            {
              layout: !0,
              className: `flex min-h-0 min-w-[70vw] sm:min-w-0 flex-1 self-stretch snap-center`,
              initial: { opacity: 0, y: 8 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: 8 },
              transition: { duration: 0.2 },
              children: (0, $.jsx)(we, {
                id: e,
                config: Y[e],
                count: E[e]?.length ?? 0,
                headerExtra: c?.(e),
                children: (0, $.jsx)(se, {
                  items: E[e]?.map(it) ?? [],
                  strategy: q,
                  children: (0, $.jsx)(Ve, {
                    initial: !1,
                    children: E[e]?.map((e) =>
                      (0, $.jsx)(
                        nt,
                        { item: e, renderCard: i, onItemClick: o },
                        e._id,
                      ),
                    ),
                  }),
                }),
              }),
            },
            e,
          )),
        (t[23] = c),
        (t[24] = E),
        (t[25] = o),
        (t[26] = i),
        (t[27] = n))
      : (n = t[27]),
      (I = X.filter(e).map(n)),
      (t[15] = c),
      (t[16] = E),
      (t[17] = o),
      (t[18] = i),
      (t[19] = b),
      (t[20] = I));
  } else I = t[20];
  let L;
  t[28] === I
    ? (L = t[29])
    : ((L = (0, $.jsx)(Ve, { initial: !1, children: I })),
      (t[28] = I),
      (t[29] = L));
  let R;
  t[30] !== F || t[31] !== L
    ? ((R = (0, $.jsx)(`div`, { className: F, children: L })),
      (t[30] = F),
      (t[31] = L),
      (t[32] = R))
    : (R = t[32]);
  let z;
  t[33] !== u || t[34] !== f || t[35] !== a
    ? ((z = u
        ? (0, $.jsx)(`div`, {
            className: `pointer-events-none rotate-[1.5deg]`,
            style: f ? { width: `${f}px` } : void 0,
            children: a(u),
          })
        : null),
      (t[33] = u),
      (t[34] = f),
      (t[35] = a),
      (t[36] = z))
    : (z = t[36]);
  let B;
  t[37] === z
    ? (B = t[38])
    : ((B = (0, $.jsx)(Te, { children: z })), (t[37] = z), (t[38] = B));
  let V;
  t[39] !== A || t[40] !== O || t[41] !== S || t[42] !== R || t[43] !== B
    ? ((V = (0, $.jsxs)(Oe, {
        sensors: S,
        collisionDetection: Ae,
        onDragStart: O,
        onDragEnd: A,
        onDragCancel: N,
        children: [R, B],
      })),
      (t[39] = A),
      (t[40] = O),
      (t[41] = S),
      (t[42] = R),
      (t[43] = B),
      (t[44] = V))
    : (V = t[44]);
  let H;
  return (
    t[45] !== P || t[46] !== V
      ? ((H = (0, $.jsx)(`div`, { className: P, children: V })),
        (t[45] = P),
        (t[46] = V),
        (t[47] = H))
      : (H = t[47]),
    H
  );
}
function it(e) {
  return e._id;
}
function at(e) {
  let t = (0, Z.c)(25),
    {
      isOpen: n,
      onOpenChange: r,
      ownedCount: i,
      skippedCount: a,
      onConfirm: o,
      isLoading: s,
    } = e,
    c;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, $.jsx)(E, {
        children: (0, $.jsx)(f, { children: `Fix All Tasks` }),
      })),
      (t[0] = c))
    : (c = t[0]);
  let l;
  t[1] !== i || t[2] !== a
    ? ((l = (0, $.jsx)(`div`, {
        className: `text-sm text-muted-foreground space-y-2`,
        children:
          i > 0
            ? (0, $.jsxs)($.Fragment, {
                children: [
                  (0, $.jsxs)(`p`, {
                    children: [
                      `Eva will run and complete `,
                      i,
                      ` task`,
                      i !== 1 && `s`,
                      ` you created.`,
                    ],
                  }),
                  a > 0 &&
                    (0, $.jsxs)(`p`, {
                      className: `text-warning`,
                      children: [
                        a,
                        ` task`,
                        a !== 1 && `s`,
                        ` created by others will be skipped. Only the task owner can run Eva.`,
                      ],
                    }),
                  (0, $.jsx)(`p`, {
                    children: `If there is an issue, Eva will return the task to To Do with a red border.`,
                  }),
                  (0, $.jsx)(`p`, {
                    children: `If successful, she will move it to Code Review.`,
                  }),
                ],
              })
            : (0, $.jsx)(`p`, {
                children: `Only the task owner can run Eva. None of the todo tasks were created by you.`,
              }),
      })),
      (t[1] = i),
      (t[2] = a),
      (t[3] = l))
    : (l = t[3]);
  let u;
  t[4] === r
    ? (u = t[5])
    : ((u = (0, $.jsx)(W, {
        variant: `ghost`,
        onClick: () => r(!1),
        children: `Cancel`,
      })),
      (t[4] = r),
      (t[5] = u));
  let d = i === 0 || s,
    p;
  t[6] !== o || t[7] !== r
    ? ((p = () => {
        (r(!1), o());
      }),
      (t[6] = o),
      (t[7] = r),
      (t[8] = p))
    : (p = t[8]);
  let m;
  t[9] === s
    ? (m = t[10])
    : ((m = s && (0, $.jsx)(v, { size: `sm` })), (t[9] = s), (t[10] = m));
  let h;
  t[11] !== d || t[12] !== p || t[13] !== m
    ? ((h = (0, $.jsxs)(W, {
        disabled: d,
        onClick: p,
        children: [m, `Fix All`],
      })),
      (t[11] = d),
      (t[12] = p),
      (t[13] = m),
      (t[14] = h))
    : (h = t[14]);
  let g;
  t[15] !== u || t[16] !== h
    ? ((g = (0, $.jsxs)(S, { children: [u, h] })),
      (t[15] = u),
      (t[16] = h),
      (t[17] = g))
    : (g = t[17]);
  let _;
  t[18] !== l || t[19] !== g
    ? ((_ = (0, $.jsxs)(w, { children: [c, l, g] })),
      (t[18] = l),
      (t[19] = g),
      (t[20] = _))
    : (_ = t[20]);
  let y;
  return (
    t[21] !== n || t[22] !== r || t[23] !== _
      ? ((y = (0, $.jsx)(b, { open: n, onOpenChange: r, children: _ })),
        (t[21] = n),
        (t[22] = r),
        (t[23] = _),
        (t[24] = y))
      : (y = t[24]),
    y
  );
}
function ot({
  tasks: e,
  projectNames: t,
  isSelecting: n,
  selectedIds: r,
  onToggleSelect: i,
  onOpenTask: s,
}) {
  let { repoId: l } = Xe(),
    u = c(o.auth.me),
    d = c(o.githubRepos.listSiblingApps, { repoId: l }),
    f = c(o.users.listAll),
    p = c(o.projects.list, { repoId: l }),
    m = a(o.agentTasks.updateStatus),
    h = a(o.agentTasks.startExecution),
    [g, _] = (0, Q.useState)(!1),
    [y, b] = (0, Q.useState)(!1),
    x = [...e].sort((e, t) => t.createdAt - e.createdAt);
  if (x.length === 0) return null;
  let S = async (e, t) => {
      let n = x.find((t) => t._id === e);
      n && (await m({ id: n._id, status: t }));
    },
    C = x.filter((e) => e.status === `todo`),
    w = C.filter((e) => e.createdBy === u),
    T = C.length - w.length;
  return (0, $.jsxs)($.Fragment, {
    children: [
      (0, $.jsx)(rt, {
        items: x,
        onStatusChange: S,
        onItemClick: (e) => {
          n ? i(e._id) : s(e._id);
        },
        fillHeight: !0,
        columnExtra: (e) =>
          e === `todo` && C.length > 0
            ? (0, $.jsxs)(W, {
                size: `sm`,
                onClick: () => b(!0),
                disabled: g,
                children: [
                  g
                    ? (0, $.jsx)(v, { size: `sm` })
                    : (0, $.jsx)(Fe, { size: 14 }),
                  `Fix All`,
                ],
              })
            : null,
        renderCard: (e) =>
          (0, $.jsx)(ue, {
            id: e._id,
            title: e.title,
            description: e.description,
            status: e.status,
            scheduledAt: e.scheduledAt,
            tags: e.tags,
            createdBy: e.createdBy,
            createdAt: e.createdAt,
            projectName: e.projectId ? t.get(e.projectId) : void 0,
            siblingApps: d ?? void 0,
            isSelecting: n,
            isSelected: r.has(e._id),
            onToggleSelect: () => i(e._id),
            assignedTo: e.assignedTo,
            model: e.model,
            projectId: e.projectId,
            repoId: e.repoId ?? l,
            users: f ?? void 0,
            currentUserId: u ?? void 0,
            projects: p ?? void 0,
          }),
        renderOverlay: (e) =>
          (0, $.jsx)(ue, {
            id: e._id,
            title: e.title,
            description: e.description,
            status: e.status,
            scheduledAt: e.scheduledAt,
            tags: e.tags,
            createdBy: e.createdBy,
            createdAt: e.createdAt,
            projectName: e.projectId ? t.get(e.projectId) : void 0,
            siblingApps: d ?? void 0,
            isSelecting: n,
            isSelected: r.has(e._id),
            assignedTo: e.assignedTo,
            model: e.model,
            projectId: e.projectId,
            repoId: e.repoId ?? l,
            users: f ?? void 0,
            currentUserId: u ?? void 0,
            projects: p ?? void 0,
          }),
      }),
      (0, $.jsx)(at, {
        isOpen: y,
        onOpenChange: b,
        ownedCount: w.length,
        skippedCount: T,
        onConfirm: async () => {
          if (w.length !== 0) {
            _(!0);
            try {
              let e = (
                await Promise.all(
                  w.map(async (e) => {
                    try {
                      return (await h({ id: e._id }), !0);
                    } catch (t) {
                      return (
                        console.error(`Failed to start task ${e._id}:`, t),
                        !1
                      );
                    }
                  }),
                )
              ).filter((e) => !e).length;
              e > 0 &&
                console.error(
                  `Fix All started ${w.length - e} of ${w.length} tasks`,
                );
            } catch (e) {
              console.error(`Failed to fix all:`, e);
            } finally {
              _(!1);
            }
          }
        },
        isLoading: g,
      }),
    ],
  });
}
function st({
  tasks: e,
  projectNames: t,
  isSelecting: n,
  selectedIds: r,
  onToggleSelect: i,
  onOpenTask: s,
  selectedTaskId: l,
}) {
  let { repoId: u } = Xe(),
    f = c(o.auth.me),
    p = c(o.githubRepos.listSiblingApps, { repoId: u }),
    m = c(o.users.listAll),
    h = c(o.projects.list, { repoId: u }),
    _ = a(o.agentTasks.startExecution),
    [y, b] = (0, Q.useState)(!1),
    [x, S] = (0, Q.useState)(!1),
    [C, w] = (0, Q.useState)(() => new Set(X)),
    [{ q: T, statuses: E }, D] = Ue({ q: Ke, statuses: We }),
    k = T,
    j = (0, Q.useMemo)(() => new Set(E), [E]),
    M = (0, Q.useMemo)(
      () => [...e].sort((e, t) => t.createdAt - e.createdAt),
      [e],
    ),
    N = (0, Q.useMemo)(() => {
      let e = k.toLowerCase().trim();
      return e
        ? M.filter(
            (t) =>
              t.title.toLowerCase().includes(e) ||
              t.description?.toLowerCase().includes(e),
          )
        : M;
    }, [M, k]),
    P = (0, Q.useMemo)(
      () =>
        X.reduce((e, t) => ((e[t] = N.filter((e) => e.status === t)), e), {}),
      [N],
    ),
    F = M.filter((e) => e.status === `todo`),
    I = F.filter((e) => e.createdBy === f),
    L = F.length - I.length,
    R = (e) => {
      w((t) => {
        let n = new Set(t);
        return (n.has(e) ? n.delete(e) : n.add(e), n);
      });
    };
  return (0, $.jsxs)($.Fragment, {
    children: [
      (0, $.jsx)(`div`, {
        className: `flex flex-1 min-h-0 flex-col gap-2 sm:gap-3`,
        children: (0, $.jsx)(`div`, {
          className: `flex-1 min-h-0 overflow-y-auto scrollbar space-y-1 pb-2`,
          children: X.filter((e) => j.has(e)).map((e) => {
            let a = Y[e],
              o = P[e] ?? [],
              c = a.icon;
            return (0, $.jsxs)(
              g,
              {
                open: C.has(e),
                onOpenChange: () => R(e),
                children: [
                  (0, $.jsxs)(`div`, {
                    className: `flex items-center sticky top-0 z-10 bg-background pb-1.5 pt-0.5`,
                    children: [
                      (0, $.jsx)(O, {
                        asChild: !0,
                        children: (0, $.jsxs)(`button`, {
                          className: `flex flex-1 items-center gap-2 rounded-lg px-2 py-3 sm:px-3 sm:py-2 text-left transition-colors hover:bg-muted/50 min-h-[44px]`,
                          children: [
                            (0, $.jsx)(d, {
                              size: 14,
                              className: `text-muted-foreground transition-transform duration-200 ${C.has(e) ? `rotate-90` : ``}`,
                            }),
                            (0, $.jsx)(c, { size: 14, className: a.text }),
                            (0, $.jsx)(`span`, {
                              className: `text-sm font-medium ${a.text}`,
                              children: a.label,
                            }),
                            (0, $.jsx)(`span`, {
                              className: `text-xs text-muted-foreground/60 tabular-nums`,
                              children: o.length,
                            }),
                          ],
                        }),
                      }),
                      e === `todo` &&
                        F.length > 0 &&
                        (0, $.jsxs)(W, {
                          size: `sm`,
                          onClick: () => S(!0),
                          disabled: y,
                          className: `mr-2 min-h-[36px]`,
                          children: [
                            y
                              ? (0, $.jsx)(v, { size: `sm` })
                              : (0, $.jsx)(Fe, { size: 14 }),
                            (0, $.jsx)(`span`, {
                              className: `hidden sm:inline`,
                              children: `Fix All`,
                            }),
                            (0, $.jsx)(`span`, {
                              className: `sm:hidden`,
                              children: `Fix`,
                            }),
                          ],
                        }),
                    ],
                  }),
                  (0, $.jsx)(A, {
                    children:
                      o.length === 0
                        ? (0, $.jsx)(`div`, {
                            className: `flex items-center justify-center py-4 text-xs text-muted-foreground`,
                            children: `No tasks`,
                          })
                        : (0, $.jsx)(`div`, {
                            className: `flex flex-col gap-0.5 pr-1.5 pb-1.5`,
                            children: o.map((e) =>
                              (0, $.jsx)(
                                ue,
                                {
                                  id: e._id,
                                  title: e.title,
                                  description: e.description,
                                  status: e.status,
                                  scheduledAt: e.scheduledAt,
                                  tags: e.tags,
                                  createdBy: e.createdBy,
                                  createdAt: e.createdAt,
                                  projectName: e.projectId
                                    ? t.get(e.projectId)
                                    : void 0,
                                  onClick: () => {
                                    n ? i(e._id) : s(e._id);
                                  },
                                  isSelecting: n,
                                  isSelected: r.has(e._id),
                                  isActive: l === e._id,
                                  onToggleSelect: () => i(e._id),
                                  siblingApps: p ?? void 0,
                                  assignedTo: e.assignedTo,
                                  model: e.model,
                                  projectId: e.projectId,
                                  repoId: e.repoId ?? u,
                                  users: m ?? void 0,
                                  currentUserId: f ?? void 0,
                                  projects: h ?? void 0,
                                },
                                e._id,
                              ),
                            ),
                          }),
                  }),
                ],
              },
              e,
            );
          }),
        }),
      }),
      (0, $.jsx)(at, {
        isOpen: x,
        onOpenChange: S,
        ownedCount: I.length,
        skippedCount: L,
        onConfirm: async () => {
          if (I.length !== 0) {
            b(!0);
            try {
              let e = (
                await Promise.all(
                  I.map(async (e) => {
                    try {
                      return (await _({ id: e._id }), !0);
                    } catch (t) {
                      return (
                        console.error(`Failed to start task ${e._id}:`, t),
                        !1
                      );
                    }
                  }),
                )
              ).filter((e) => !e).length;
              e > 0 &&
                console.error(
                  `Fix All started ${I.length - e} of ${I.length} tasks`,
                );
            } catch (e) {
              console.error(`Failed to fix all:`, e);
            } finally {
              b(!1);
            }
          }
        },
        isLoading: y,
      }),
    ],
  });
}
function ct(e) {
  let t = (0, Z.c)(42),
    {
      view: n,
      onViewChange: r,
      searchQuery: i,
      onSearchChange: a,
      hasQuickTasks: o,
      isSelecting: s,
      onStartSelecting: c,
      onCreateTask: l,
      onImport: u,
      projects: d,
      projectFilter: f,
      onProjectFilterChange: p,
    } = e,
    m;
  t[0] !== f || t[1] !== d
    ? ((m =
        f === `all`
          ? `All Tasks`
          : f === `none`
            ? `No Project`
            : (d?.find((e) => e._id === f)?.title ?? `Project`)),
      (t[0] = f),
      (t[1] = d),
      (t[2] = m))
    : (m = t[2]);
  let h = m,
    g;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = { statuses: We }), (t[3] = g))
    : (g = t[3]);
  let [_, v] = Ue(g),
    { statuses: y } = _,
    b;
  t[4] === y ? (b = t[5]) : ((b = new Set(y)), (t[4] = y), (t[5] = b));
  let S = b,
    C;
  t[6] !== v || t[7] !== S
    ? ((C = (e) => {
        let t = new Set(S);
        if (t.has(e)) {
          if (t.size === 1) return;
          t.delete(e);
        } else t.add(e);
        v({ statuses: [...t] });
      }),
      (t[6] = v),
      (t[7] = S),
      (t[8] = C))
    : (C = t[8]);
  let w = C,
    E;
  t[9] !== o || t[10] !== a || t[11] !== i
    ? ((E = (0, $.jsx)(ve, {
        value: i,
        onChange: a,
        placeholder: `Search tasks...`,
        tooltipLabel: `Search tasks`,
        visible: o,
      })),
      (t[9] = o),
      (t[10] = a),
      (t[11] = i),
      (t[12] = E))
    : (E = t[12]);
  let D;
  t[13] !== o || t[14] !== r || t[15] !== n
    ? ((D =
        o &&
        (0, $.jsxs)(`div`, {
          className: `flex items-center rounded-lg bg-muted/40 overflow-hidden`,
          children: [
            (0, $.jsxs)(x, {
              children: [
                (0, $.jsx)(T, {
                  asChild: !0,
                  children: (0, $.jsx)(W, {
                    variant: n === `kanban` ? `secondary` : `ghost`,
                    size: `icon`,
                    className: `motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]`,
                    onClick: () => r(`kanban`),
                    children: (0, $.jsx)(Se, { size: 16 }),
                  }),
                }),
                (0, $.jsx)(G, { children: `Kanban view` }),
              ],
            }),
            (0, $.jsxs)(x, {
              children: [
                (0, $.jsx)(T, {
                  asChild: !0,
                  children: (0, $.jsx)(W, {
                    variant: n === `list` ? `secondary` : `ghost`,
                    size: `icon`,
                    className: `motion-press h-8 w-8 rounded-none hover:scale-[1.03] active:scale-[0.97]`,
                    onClick: () => r(`list`),
                    children: (0, $.jsx)(Ce, { size: 16 }),
                  }),
                }),
                (0, $.jsx)(G, { children: `List view` }),
              ],
            }),
          ],
        })),
      (t[13] = o),
      (t[14] = r),
      (t[15] = n),
      (t[16] = D))
    : (D = t[16]);
  let O;
  t[17] !== o || t[18] !== s || t[19] !== c
    ? ((O =
        o && !s
          ? (0, $.jsx)(
              j.div,
              {
                initial: { opacity: 0, y: -6 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: -6 },
                transition: { duration: 0.18 },
                children: (0, $.jsxs)(x, {
                  children: [
                    (0, $.jsx)(T, {
                      asChild: !0,
                      children: (0, $.jsxs)(W, {
                        size: `sm`,
                        variant: `secondary`,
                        className: `motion-press hover:scale-[1.01] active:scale-[0.99]`,
                        onClick: c,
                        children: [
                          (0, $.jsx)(Ze, { size: 16 }),
                          (0, $.jsx)(`span`, {
                            className: `hidden sm:inline`,
                            children: `Select`,
                          }),
                        ],
                      }),
                    }),
                    (0, $.jsx)(G, {
                      className: `sm:hidden`,
                      children: `Select`,
                    }),
                  ],
                }),
              },
              `quick-task-select-action`,
            )
          : null),
      (t[17] = o),
      (t[18] = s),
      (t[19] = c),
      (t[20] = O))
    : (O = t[20]);
  let k;
  t[21] === O
    ? (k = t[22])
    : ((k = (0, $.jsx)(Ve, { initial: !1, mode: `popLayout`, children: O })),
      (t[21] = O),
      (t[22] = k));
  let A;
  t[23] !== h ||
  t[24] !== w ||
  t[25] !== o ||
  t[26] !== u ||
  t[27] !== p ||
  t[28] !== f ||
  t[29] !== d ||
  t[30] !== S
    ? ((A =
        o &&
        (0, $.jsxs)(P, {
          children: [
            (0, $.jsx)(re, {
              asChild: !0,
              children: (0, $.jsxs)(W, {
                size: `sm`,
                variant: `secondary`,
                className: `motion-press hover:scale-[1.01] active:scale-[0.99]`,
                children: [
                  (0, $.jsx)(Re, { size: 16 }),
                  (0, $.jsx)(`span`, {
                    className: `hidden sm:inline`,
                    children: `Options`,
                  }),
                ],
              }),
            }),
            (0, $.jsxs)(H, {
              align: `end`,
              children: [
                (0, $.jsxs)(B, {
                  onSelect: u,
                  children: [
                    (0, $.jsx)(Qe, { size: 16, className: `mr-2` }),
                    `Import from Linear`,
                  ],
                }),
                (0, $.jsx)(M, {}),
                (0, $.jsxs)(te, {
                  children: [
                    (0, $.jsxs)(N, {
                      children: [
                        (0, $.jsx)(ye, { size: 16, className: `mr-2` }),
                        h,
                      ],
                    }),
                    (0, $.jsx)(ie, {
                      children: (0, $.jsxs)(R, {
                        value: f,
                        onValueChange: p,
                        children: [
                          (0, $.jsx)(L, {
                            value: `all`,
                            children: `All Tasks`,
                          }),
                          (0, $.jsx)(L, {
                            value: `none`,
                            children: `No Project`,
                          }),
                          d &&
                            d.length > 0 &&
                            (0, $.jsxs)($.Fragment, {
                              children: [(0, $.jsx)(M, {}), d.map(ut)],
                            }),
                        ],
                      }),
                    }),
                  ],
                }),
                (0, $.jsxs)(te, {
                  children: [
                    (0, $.jsxs)(N, {
                      children: [
                        (0, $.jsx)(_e, { size: 16, className: `mr-2` }),
                        S.size === X.length
                          ? `All Statuses`
                          : `${S.size} Statuses`,
                      ],
                    }),
                    (0, $.jsx)(ie, {
                      children: X.map((e) => {
                        let t = Y[e];
                        return (0, $.jsxs)(
                          I,
                          {
                            checked: S.has(e),
                            onCheckedChange: () => w(e),
                            onSelect: lt,
                            children: [
                              (0, $.jsx)(t.icon, {
                                size: 16,
                                className: t.text + ` mr-2`,
                              }),
                              (0, $.jsx)(`span`, {
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
              ],
            }),
          ],
        })),
      (t[23] = h),
      (t[24] = w),
      (t[25] = o),
      (t[26] = u),
      (t[27] = p),
      (t[28] = f),
      (t[29] = d),
      (t[30] = S),
      (t[31] = A))
    : (A = t[31]);
  let F, z;
  t[32] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((F = (0, $.jsx)(Ie, { size: 16 })),
      (z = (0, $.jsx)(`span`, {
        className: `hidden sm:inline`,
        children: `New Task`,
      })),
      (t[32] = F),
      (t[33] = z))
    : ((F = t[32]), (z = t[33]));
  let V;
  t[34] === l
    ? (V = t[35])
    : ((V = (0, $.jsxs)(W, {
        size: `sm`,
        className: `motion-press hover:scale-[1.01] active:scale-[0.99]`,
        onClick: l,
        children: [F, z],
      })),
      (t[34] = l),
      (t[35] = V));
  let U;
  return (
    t[36] !== A || t[37] !== V || t[38] !== E || t[39] !== D || t[40] !== k
      ? ((U = (0, $.jsxs)(`div`, {
          className: `flex items-center gap-1.5 sm:gap-2`,
          children: [E, D, k, A, V],
        })),
        (t[36] = A),
        (t[37] = V),
        (t[38] = E),
        (t[39] = D),
        (t[40] = k),
        (t[41] = U))
      : (U = t[41]),
    U
  );
}
function lt(e) {
  return e.preventDefault();
}
function ut(e) {
  return (0, $.jsx)(L, { value: e._id, children: e.title }, e._id);
}
var dt = [
  { key: `changeStatus`, label: `Change Status`, icon: Le },
  { key: `assign`, label: `Assign to...`, icon: Be },
  { key: `assignMe`, label: `Assign to Me`, icon: $e },
  { key: `addLabels`, label: `Add Labels`, icon: pe },
  { key: `group`, label: `Group into Project`, icon: be },
  { key: `schedule`, label: `Schedule Run`, icon: fe },
  { key: `run`, label: `Run Tasks`, icon: Fe },
  { key: `delete`, label: `Delete All`, icon: ze, destructive: !0 },
];
function ft(e) {
  let t = (0, Z.c)(8),
    {
      isSelecting: n,
      selectedCount: r,
      onExitSelect: i,
      onSetBulkAction: a,
    } = e,
    o = r > 0,
    s;
  t[0] !== o || t[1] !== n || t[2] !== i || t[3] !== a || t[4] !== r
    ? ((s =
        n &&
        (0, $.jsx)(
          j.div,
          {
            className: `absolute inset-x-0 bottom-3 z-20 flex justify-center px-4 pb-[env(safe-area-inset-bottom)]`,
            initial: { opacity: 0, y: 20 },
            animate: { opacity: 1, y: 0 },
            exit: { opacity: 0, y: 20 },
            transition: { duration: 0.15, ease: `easeOut` },
            children: (0, $.jsx)(u, {
              delayDuration: 300,
              children: (0, $.jsxs)(`div`, {
                className: `flex items-center gap-1 rounded-xl bg-foreground px-2.5 py-2 shadow-lg`,
                children: [
                  (0, $.jsx)(`div`, {
                    className: `flex items-center px-2.5`,
                    children: (0, $.jsxs)(`span`, {
                      className: `text-sm font-medium text-background tabular-nums`,
                      children: [r, ` selected`],
                    }),
                  }),
                  (0, $.jsx)(z, {
                    orientation: `vertical`,
                    className: `mx-1.5 h-5 bg-background/20`,
                  }),
                  dt.map((e) =>
                    (0, $.jsxs)(
                      `span`,
                      {
                        className: `flex items-center`,
                        children: [
                          e.destructive &&
                            (0, $.jsx)(z, {
                              orientation: `vertical`,
                              className: `mx-1.5 h-5 bg-background/20`,
                            }),
                          (0, $.jsxs)(x, {
                            children: [
                              (0, $.jsx)(T, {
                                asChild: !0,
                                children: (0, $.jsx)(`button`, {
                                  type: `button`,
                                  className: `inline-flex h-9 w-9 items-center justify-center rounded-lg transition-colors disabled:pointer-events-none disabled:opacity-30 ${e.destructive ? `text-red-400 hover:bg-red-500/20 hover:text-red-300` : `text-background/70 hover:bg-background/10 hover:text-background`}`,
                                  onClick: () => a(e.key),
                                  disabled: !o,
                                  children: (0, $.jsx)(e.icon, { size: 17 }),
                                }),
                              }),
                              (0, $.jsx)(G, {
                                side: `top`,
                                className: `text-xs`,
                                sideOffset: 8,
                                children: e.label,
                              }),
                            ],
                          }),
                        ],
                      },
                      e.key,
                    ),
                  ),
                  (0, $.jsx)(z, {
                    orientation: `vertical`,
                    className: `mx-1.5 h-5 bg-background/20`,
                  }),
                  (0, $.jsxs)(x, {
                    children: [
                      (0, $.jsx)(T, {
                        asChild: !0,
                        children: (0, $.jsx)(`button`, {
                          type: `button`,
                          className: `inline-flex h-9 w-9 items-center justify-center rounded-lg text-background/70 transition-colors hover:bg-background/10 hover:text-background`,
                          onClick: i,
                          children: (0, $.jsx)(ne, { size: 17 }),
                        }),
                      }),
                      (0, $.jsx)(G, {
                        side: `top`,
                        className: `text-xs`,
                        sideOffset: 8,
                        children: `Cancel selection`,
                      }),
                    ],
                  }),
                ],
              }),
            }),
          },
          `quick-tasks-bulk-bar`,
        )),
      (t[0] = o),
      (t[1] = n),
      (t[2] = i),
      (t[3] = a),
      (t[4] = r),
      (t[5] = s))
    : (s = t[5]);
  let c;
  return (
    t[6] === s
      ? (c = t[7])
      : ((c = (0, $.jsx)(Ve, { initial: !1, children: s })),
        (t[6] = s),
        (t[7] = c)),
    c
  );
}
function pt(e) {
  let t = (0, Z.c)(22),
    { task: n, index: r } = e,
    i;
  t[0] === n._id
    ? (i = t[1])
    : ((i = { id: n._id }), (t[0] = n._id), (t[1] = i));
  let {
      attributes: a,
      listeners: o,
      setNodeRef: s,
      transform: c,
      transition: l,
      isDragging: u,
    } = J(i),
    d;
  t[2] === c
    ? (d = t[3])
    : ((d = Ee.Transform.toString(c)), (t[2] = c), (t[3] = d));
  let f;
  t[4] !== d || t[5] !== l
    ? ((f = { transform: d, transition: l }),
      (t[4] = d),
      (t[5] = l),
      (t[6] = f))
    : (f = t[6]);
  let p = f,
    m = `flex items-center gap-2 rounded-lg px-3 py-2 bg-muted/40 ${u ? `opacity-50` : ``}`,
    h;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((h = (0, $.jsx)(xe, { size: 16 })), (t[7] = h))
    : (h = t[7]);
  let g;
  t[8] !== a || t[9] !== o
    ? ((g = (0, $.jsx)(`button`, {
        type: `button`,
        className: `cursor-grab touch-none text-muted-foreground hover:text-foreground`,
        ...a,
        ...o,
        children: h,
      })),
      (t[8] = a),
      (t[9] = o),
      (t[10] = g))
    : (g = t[10]);
  let _ = r + 1,
    v;
  t[11] === _
    ? (v = t[12])
    : ((v = (0, $.jsx)(`span`, {
        className: `text-xs font-mono text-muted-foreground w-5 text-right shrink-0`,
        children: _,
      })),
      (t[11] = _),
      (t[12] = v));
  let y;
  t[13] === n.title
    ? (y = t[14])
    : ((y = (0, $.jsx)(`span`, {
        className: `text-sm truncate`,
        children: n.title,
      })),
      (t[13] = n.title),
      (t[14] = y));
  let b;
  return (
    t[15] !== s ||
    t[16] !== p ||
    t[17] !== m ||
    t[18] !== g ||
    t[19] !== v ||
    t[20] !== y
      ? ((b = (0, $.jsxs)(`div`, {
          ref: s,
          style: p,
          className: m,
          children: [g, v, y],
        })),
        (t[15] = s),
        (t[16] = p),
        (t[17] = m),
        (t[18] = g),
        (t[19] = v),
        (t[20] = y),
        (t[21] = b))
      : (b = t[21]),
    b
  );
}
function mt({ isOpen: e, onClose: t, selectedTasks: n, onSuccess: i }) {
  let { repo: s, basePath: l } = Xe(),
    u = r(),
    [d, m] = (0, Q.useState)(``),
    [g, _] = (0, Q.useState)(null),
    [y, x] = (0, Q.useState)(!1),
    [T, O] = (0, Q.useState)(`new`),
    [k, A] = (0, Q.useState)([]);
  (0, Q.useEffect)(() => {
    e && A(n);
  }, [e, n]);
  let j = c(o.projects.list, { repoId: s._id }),
    M = a(o.projects.createFromTasks),
    N = a(o.agentTasks.assignToProject),
    P = Pe(
      Ne(De, { activationConstraint: { distance: 5 } }),
      Ne(Me, { coordinateGetter: le }),
    ),
    F = (e) => {
      let { active: t, over: n } = e;
      !n ||
        t.id === n.id ||
        A((e) =>
          K(
            e,
            e.findIndex((e) => e._id === t.id),
            e.findIndex((e) => e._id === n.id),
          ),
        );
    },
    I = k.map((e) => e._id);
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || t();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-[calc(100vw-2rem)] sm:max-w-xl`,
      children: [
        (0, $.jsx)(E, {
          children: (0, $.jsxs)(f, {
            children: [
              `Group `,
              k.length,
              ` task`,
              k.length === 1 ? `` : `s`,
              ` into project`,
            ],
          }),
        }),
        (0, $.jsxs)(`div`, {
          className: `space-y-1`,
          children: [
            (0, $.jsx)(`label`, {
              className: `text-sm font-medium text-muted-foreground`,
              children: `Task order (drag to reorder)`,
            }),
            (0, $.jsx)(`div`, {
              className: `max-h-48 overflow-y-auto space-y-1`,
              children: (0, $.jsx)(Oe, {
                sensors: P,
                collisionDetection: ke,
                onDragEnd: F,
                children: (0, $.jsx)(se, {
                  items: k.map((e) => e._id),
                  strategy: q,
                  children: k.map((e, t) =>
                    (0, $.jsx)(pt, { task: e, index: t }, e._id),
                  ),
                }),
              }),
            }),
          ],
        }),
        (0, $.jsxs)(h, {
          value: T,
          onValueChange: O,
          children: [
            (0, $.jsxs)(D, {
              className: `w-full`,
              children: [
                (0, $.jsx)(p, {
                  value: `new`,
                  className: `flex-1`,
                  children: `New Project`,
                }),
                (0, $.jsx)(p, {
                  value: `existing`,
                  className: `flex-1`,
                  children: `Existing Project`,
                }),
              ],
            }),
            (0, $.jsx)(C, {
              value: `new`,
              children: (0, $.jsxs)(`div`, {
                className: `pt-2 space-y-1.5`,
                children: [
                  (0, $.jsx)(`label`, {
                    className: `text-sm font-medium`,
                    children: `Project title`,
                  }),
                  (0, $.jsx)(ee, {
                    placeholder: `e.g. Bug fixes, UI improvements...`,
                    value: d,
                    onChange: (e) => m(e.target.value),
                    autoFocus: !0,
                  }),
                ],
              }),
            }),
            (0, $.jsx)(C, {
              value: `existing`,
              children: (0, $.jsxs)(`div`, {
                className: `pt-2 space-y-2 max-h-80 overflow-y-auto`,
                children: [
                  j?.filter(
                    (e) => e.phase === `active` || e.phase === `completed`,
                  ).length === 0 &&
                    (0, $.jsx)(`p`, {
                      className: `text-sm text-muted-foreground text-center py-4`,
                      children: `No active projects`,
                    }),
                  j
                    ?.filter(
                      (e) => e.phase === `active` || e.phase === `completed`,
                    )
                    .map((e) =>
                      (0, $.jsxs)(
                        `button`,
                        {
                          type: `button`,
                          onClick: () => _(e._id),
                          className: `w-full rounded-lg p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35 ${g === e._id ? `ring-2 ring-primary bg-accent` : `bg-muted hover:bg-accent/70`}`,
                          children: [
                            (0, $.jsxs)(`div`, {
                              className: `flex items-center justify-between gap-2`,
                              children: [
                                (0, $.jsx)(`span`, {
                                  className: `text-sm font-medium truncate`,
                                  children: e.title,
                                }),
                                (0, $.jsx)(je, { phase: e.phase }),
                              ],
                            }),
                            e.description &&
                              (0, $.jsx)(`p`, {
                                className: `text-xs text-muted-foreground mt-1 line-clamp-1`,
                                children: e.description,
                              }),
                          ],
                        },
                        e._id,
                      ),
                    ),
                ],
              }),
            }),
          ],
        }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: t,
              children: `Cancel`,
            }),
            T === `new`
              ? (0, $.jsxs)(W, {
                  onClick: async () => {
                    if (!(!d.trim() || I.length === 0)) {
                      x(!0);
                      try {
                        let e = await M({
                          repoId: s._id,
                          title: d.trim(),
                          taskIds: I,
                        });
                        (m(``), i(), t(), u({ to: `${l}/projects/${e}` }));
                      } finally {
                        x(!1);
                      }
                    }
                  },
                  disabled: y || !d.trim() || I.length === 0,
                  children: [
                    y && (0, $.jsx)(v, { size: `sm` }),
                    `Create Project`,
                  ],
                })
              : (0, $.jsxs)(W, {
                  onClick: async () => {
                    if (!(!g || I.length === 0)) {
                      x(!0);
                      try {
                        (await N({ taskIds: I, projectId: g }),
                          _(null),
                          i(),
                          t());
                      } finally {
                        x(!1);
                      }
                    }
                  },
                  disabled: y || !g || I.length === 0,
                  children: [
                    y && (0, $.jsx)(v, { size: `sm` }),
                    `Add to Project`,
                  ],
                }),
          ],
        }),
      ],
    }),
  });
}
function ht({ isOpen: e, onClose: t, selectedTaskIds: n, onSuccess: r }) {
  let i = a(o.agentTasks.remove),
    [s, c] = (0, Q.useState)(!1),
    l = n.size;
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || t();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsxs)(f, {
              children: [`Delete `, l, ` task`, l === 1 ? `` : `s`, `?`],
            }),
            (0, $.jsxs)(m, {
              children: [
                `This action cannot be undone. The selected task`,
                l === 1 ? `` : `s`,
                ` will be permanently deleted.`,
              ],
            }),
          ],
        }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: t,
              disabled: s,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              variant: `destructive`,
              onClick: async () => {
                c(!0);
                try {
                  (await Promise.all([...n].map((e) => i({ id: e }))),
                    r(),
                    t());
                } finally {
                  c(!1);
                }
              },
              disabled: s,
              children: [
                s && (0, $.jsx)(v, { size: `sm` }),
                `Delete `,
                l,
                ` task`,
                l === 1 ? `` : `s`,
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function gt({ isOpen: e, onClose: t, selectedTasks: n, onSuccess: r }) {
  let i = a(o.agentTasks.update),
    [s, c] = (0, Q.useState)(``),
    [l, u] = (0, Q.useState)(!1),
    d = n.length,
    p = s
      .split(`,`)
      .map((e) => e.trim())
      .filter(Boolean),
    h = () => {
      (c(``), t());
    },
    g = async () => {
      if (p.length !== 0) {
        u(!0);
        try {
          (await Promise.all(
            n.map((e) => {
              let t = e.tags ?? [],
                n = [...new Set([...t, ...p])];
              return i({ id: e._id, tags: n });
            }),
          ),
            c(``),
            r(),
            t());
        } finally {
          u(!1);
        }
      }
    };
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || h();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsxs)(f, {
              children: [`Add labels to `, d, ` task`, d === 1 ? `` : `s`],
            }),
            (0, $.jsx)(m, {
              children: `Enter labels as comma-separated values. They will be added to each task's existing labels.`,
            }),
          ],
        }),
        (0, $.jsxs)(`div`, {
          className: `space-y-2`,
          children: [
            (0, $.jsx)(ee, {
              placeholder: `bug, ui, backend`,
              value: s,
              onChange: (e) => c(e.target.value),
              onKeyDown: (e) => {
                e.key === `Enter` && (e.preventDefault(), g());
              },
              autoFocus: !0,
            }),
            p.length > 0 &&
              (0, $.jsx)(`div`, {
                className: `flex flex-wrap gap-1`,
                children: p.map((e) =>
                  (0, $.jsx)(F, { variant: `outline`, children: e }, e),
                ),
              }),
          ],
        }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: h,
              disabled: l,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: g,
              disabled: l || p.length === 0,
              children: [l && (0, $.jsx)(v, { size: `sm` }), `Add Labels`],
            }),
          ],
        }),
      ],
    }),
  });
}
function _t({
  isOpen: e,
  onClose: t,
  selectedTaskIds: n,
  onSuccess: r,
  mode: i,
}) {
  let s = a(o.agentTasks.update),
    u = c(o.users.listAll),
    d = c(o.auth.me),
    [p, h] = (0, Q.useState)(``),
    [g, x] = (0, Q.useState)(!1),
    C = n.size,
    T = [...n],
    D = u?.find((e) => e._id === d),
    O =
      D?.fullName ||
      [D?.firstName, D?.lastName].filter(Boolean).join(` `) ||
      `you`,
    A = () => {
      (h(``), t());
    },
    j = async (e) => {
      x(!0);
      try {
        (await Promise.all(T.map((t) => s({ id: t, assignedTo: e }))),
          h(``),
          r(),
          t());
      } finally {
        x(!1);
      }
    },
    M = (e) =>
      e.fullName ||
      [e.firstName, e.lastName].filter(Boolean).join(` `) ||
      `Unnamed User`;
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || A();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsx)(f, {
              children:
                i === `me`
                  ? `Assign ${C} task${C === 1 ? `` : `s`} to yourself?`
                  : `Assign ${C} task${C === 1 ? `` : `s`}`,
            }),
            i === `me`
              ? (0, $.jsxs)(m, {
                  children: [
                    C,
                    ` task`,
                    C === 1 ? `` : `s`,
                    ` will be assigned to`,
                    ` `,
                    O,
                    `.`,
                  ],
                })
              : (0, $.jsx)(m, {
                  children: `Choose a team member to assign the selected tasks to.`,
                }),
          ],
        }),
        i === `pick` &&
          (0, $.jsxs)(U, {
            value: p,
            onValueChange: h,
            children: [
              (0, $.jsx)(y, {
                children: (0, $.jsx)(l, { placeholder: `Select a user` }),
              }),
              (0, $.jsx)(_, {
                children: (u ?? []).map((e) =>
                  (0, $.jsx)(k, { value: e._id, children: M(e) }, e._id),
                ),
              }),
            ],
          }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: A,
              disabled: g,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: () => {
                if (i === `me` && d) j(d);
                else if (i === `pick` && p) {
                  let e = u?.find((e) => e._id === p);
                  e && j(e._id);
                }
              },
              disabled: g || (i === `pick` && !p) || (i === `me` && !d),
              children: [
                g && (0, $.jsx)(v, { size: `sm` }),
                i === `me` ? `Assign to Me` : `Assign`,
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function vt({ isOpen: e, onClose: t, selectedTaskIds: n, onSuccess: r }) {
  let i = a(o.agentTasks.updateStatus),
    [s, c] = (0, Q.useState)(``),
    [u, d] = (0, Q.useState)(!1),
    p = n.size,
    h = [...n],
    g = () => {
      (c(``), t());
    };
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || g();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsxs)(f, {
              children: [`Change status of `, p, ` task`, p === 1 ? `` : `s`],
            }),
            (0, $.jsx)(m, {
              children: `All selected tasks will be moved to the chosen status.`,
            }),
          ],
        }),
        (0, $.jsxs)(U, {
          value: s,
          onValueChange: (e) => {
            let t = X.find((t) => t === e);
            t && c(t);
          },
          children: [
            (0, $.jsx)(y, {
              children: (0, $.jsx)(l, { placeholder: `Select a status` }),
            }),
            (0, $.jsx)(_, {
              children: X.map((e) =>
                (0, $.jsx)(k, { value: e, children: Y[e].label }, e),
              ),
            }),
          ],
        }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: g,
              disabled: u,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: async () => {
                if (s) {
                  d(!0);
                  try {
                    (await Promise.all(h.map((e) => i({ id: e, status: s }))),
                      c(``),
                      r(),
                      t());
                  } finally {
                    d(!1);
                  }
                }
              },
              disabled: u || !s,
              children: [u && (0, $.jsx)(v, { size: `sm` }), `Change Status`],
            }),
          ],
        }),
      ],
    }),
  });
}
function yt({ isOpen: e, onClose: t, selectedTaskIds: n, onSuccess: r }) {
  let i = a(o.agentTasks.startExecution),
    [s, c] = (0, Q.useState)(!1),
    [l, u] = (0, Q.useState)(null),
    d = n.size;
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || (u(null), t());
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsxs)(f, {
              children: [`Run `, d, ` task`, d === 1 ? `` : `s`, `?`],
            }),
            (0, $.jsxs)(m, {
              children: [
                `Eva will start working on the selected task`,
                d === 1 ? `` : `s`,
                ` immediately.`,
              ],
            }),
          ],
        }),
        l &&
          (0, $.jsx)(`p`, {
            className: `text-sm text-destructive`,
            children: l,
          }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: t,
              disabled: s,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: async () => {
                (c(!0), u(null));
                try {
                  let e = [...n],
                    a = (
                      await Promise.all(
                        e.map(async (e) => {
                          try {
                            return (await i({ id: e }), !0);
                          } catch (t) {
                            return (
                              console.error(`Failed to start task ${e}:`, t),
                              !1
                            );
                          }
                        }),
                      )
                    ).filter((e) => e).length;
                  if (a === d) {
                    (r(), t());
                    return;
                  }
                  u(
                    a === 0
                      ? `Failed to start any selected tasks. Check task state and try again.`
                      : `Started ${a} of ${d} tasks. ${d - a} failed to start.`,
                  );
                } catch (e) {
                  (console.error(`Failed to run tasks:`, e),
                    u(`Failed to run selected tasks.`));
                } finally {
                  c(!1);
                }
              },
              disabled: s,
              children: [
                s && (0, $.jsx)(v, { size: `sm` }),
                `Run `,
                d,
                ` task`,
                d === 1 ? `` : `s`,
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function bt({ isOpen: e, onClose: t, selectedTaskIds: n, onSuccess: r }) {
  let i = a(o.agentTasks.scheduleExecution),
    s = a(o.agentTasks.updateScheduledExecution),
    [c, l] = (0, Q.useState)(!1),
    [u, d] = (0, Q.useState)(null),
    {
      selectedDate: p,
      setSelectedDate: h,
      time: g,
      setTime: _,
      timestamp: y,
      reset: x,
    } = he(),
    C = n.size,
    T = async () => {
      if (y) {
        (l(!0), d(null));
        try {
          let e = [...n],
            t = (
              await Promise.all(
                e.map(async (e) => {
                  try {
                    return (await i({ id: e, scheduledAt: y }), !0);
                  } catch {
                    try {
                      return (await s({ id: e, scheduledAt: y }), !0);
                    } catch (t) {
                      return (
                        console.error(`Failed to schedule task ${e}:`, t),
                        !1
                      );
                    }
                  }
                }),
              )
            ).filter(Boolean).length;
          if (t === C) {
            (r(), D());
            return;
          }
          d(
            t === 0
              ? `Failed to schedule any selected tasks. Only todo tasks can be scheduled.`
              : `Scheduled ${t} of ${C} tasks. ${C - t} failed (may not be in todo status).`,
          );
        } catch (e) {
          (console.error(`Failed to schedule tasks:`, e),
            d(`Failed to schedule selected tasks.`));
        } finally {
          l(!1);
        }
      }
    };
  function D() {
    (d(null), x(), t());
  }
  return (0, $.jsx)(b, {
    open: e,
    onOpenChange: (e) => {
      e || D();
    },
    children: (0, $.jsxs)(w, {
      className: `max-w-sm`,
      children: [
        (0, $.jsxs)(E, {
          children: [
            (0, $.jsxs)(f, {
              children: [`Schedule `, C, ` task`, C === 1 ? `` : `s`],
            }),
            (0, $.jsxs)(m, {
              children: [
                `Set a date and time to run the selected task`,
                C === 1 ? `` : `s`,
                `.`,
              ],
            }),
          ],
        }),
        (0, $.jsx)(me, {
          selectedDate: p,
          onDateChange: h,
          time: g,
          onTimeChange: _,
          timestamp: y,
          calendarClassName: `border rounded-md shadow-none mx-auto`,
          showPreview: !1,
        }),
        y &&
          (0, $.jsxs)(`p`, {
            className: `text-sm text-muted-foreground px-1`,
            children: [
              `Tasks will run at`,
              ` `,
              (0, $.jsx)(`span`, {
                className: `font-medium text-foreground`,
                children: He(y).format(`MMM D, h:mm A`),
              }),
            ],
          }),
        u &&
          (0, $.jsx)(`p`, {
            className: `text-sm text-destructive px-1`,
            children: u,
          }),
        (0, $.jsxs)(S, {
          children: [
            (0, $.jsx)(W, {
              variant: `secondary`,
              onClick: D,
              disabled: c,
              children: `Cancel`,
            }),
            (0, $.jsxs)(W, {
              onClick: T,
              disabled: c || !y,
              children: [
                c && (0, $.jsx)(v, { size: `sm` }),
                `Schedule `,
                C,
                ` task`,
                C === 1 ? `` : `s`,
              ],
            }),
          ],
        }),
      ],
    }),
  });
}
function xt(e) {
  let t = (0, Z.c)(49),
    {
      activeBulkAction: n,
      onCloseBulkAction: r,
      selectedTaskIds: i,
      selectedTasks: a,
      onSuccess: o,
    } = e,
    s = n === `group`,
    c;
  t[0] !== r || t[1] !== o || t[2] !== a || t[3] !== s
    ? ((c = (0, $.jsx)(mt, {
        isOpen: s,
        onClose: r,
        selectedTasks: a,
        onSuccess: o,
      })),
      (t[0] = r),
      (t[1] = o),
      (t[2] = a),
      (t[3] = s),
      (t[4] = c))
    : (c = t[4]);
  let l = n === `delete`,
    u;
  t[5] !== r || t[6] !== o || t[7] !== i || t[8] !== l
    ? ((u = (0, $.jsx)(ht, {
        isOpen: l,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
      })),
      (t[5] = r),
      (t[6] = o),
      (t[7] = i),
      (t[8] = l),
      (t[9] = u))
    : (u = t[9]);
  let d = n === `addLabels`,
    f;
  t[10] !== r || t[11] !== o || t[12] !== a || t[13] !== d
    ? ((f = (0, $.jsx)(gt, {
        isOpen: d,
        onClose: r,
        selectedTasks: a,
        onSuccess: o,
      })),
      (t[10] = r),
      (t[11] = o),
      (t[12] = a),
      (t[13] = d),
      (t[14] = f))
    : (f = t[14]);
  let p = n === `assign`,
    m;
  t[15] !== r || t[16] !== o || t[17] !== i || t[18] !== p
    ? ((m = (0, $.jsx)(_t, {
        isOpen: p,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
        mode: `pick`,
      })),
      (t[15] = r),
      (t[16] = o),
      (t[17] = i),
      (t[18] = p),
      (t[19] = m))
    : (m = t[19]);
  let h = n === `assignMe`,
    g;
  t[20] !== r || t[21] !== o || t[22] !== i || t[23] !== h
    ? ((g = (0, $.jsx)(_t, {
        isOpen: h,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
        mode: `me`,
      })),
      (t[20] = r),
      (t[21] = o),
      (t[22] = i),
      (t[23] = h),
      (t[24] = g))
    : (g = t[24]);
  let _ = n === `changeStatus`,
    v;
  t[25] !== r || t[26] !== o || t[27] !== i || t[28] !== _
    ? ((v = (0, $.jsx)(vt, {
        isOpen: _,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
      })),
      (t[25] = r),
      (t[26] = o),
      (t[27] = i),
      (t[28] = _),
      (t[29] = v))
    : (v = t[29]);
  let y = n === `run`,
    b;
  t[30] !== r || t[31] !== o || t[32] !== i || t[33] !== y
    ? ((b = (0, $.jsx)(yt, {
        isOpen: y,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
      })),
      (t[30] = r),
      (t[31] = o),
      (t[32] = i),
      (t[33] = y),
      (t[34] = b))
    : (b = t[34]);
  let x = n === `schedule`,
    S;
  t[35] !== r || t[36] !== o || t[37] !== i || t[38] !== x
    ? ((S = (0, $.jsx)(bt, {
        isOpen: x,
        onClose: r,
        selectedTaskIds: i,
        onSuccess: o,
      })),
      (t[35] = r),
      (t[36] = o),
      (t[37] = i),
      (t[38] = x),
      (t[39] = S))
    : (S = t[39]);
  let C;
  return (
    t[40] !== g ||
    t[41] !== v ||
    t[42] !== b ||
    t[43] !== S ||
    t[44] !== c ||
    t[45] !== u ||
    t[46] !== f ||
    t[47] !== m
      ? ((C = (0, $.jsxs)($.Fragment, { children: [c, u, f, m, g, v, b, S] })),
        (t[40] = g),
        (t[41] = v),
        (t[42] = b),
        (t[43] = S),
        (t[44] = c),
        (t[45] = u),
        (t[46] = f),
        (t[47] = m),
        (t[48] = C))
      : (C = t[48]),
    C
  );
}
function St() {
  let e = (0, Z.c)(91),
    t = r(),
    { basePath: n, repo: i } = Xe(),
    a;
  e[0] === i._id
    ? (a = e[1])
    : ((a = { repoId: i._id }), (e[0] = i._id), (e[1] = a));
  let s = c(o.agentTasks.getAllTasks, a),
    [l, u] = (0, Q.useState)(!1),
    [d, f] = (0, Q.useState)(!1),
    [p, m] = (0, Q.useState)(!1),
    h;
  e[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((h = new Set()), (e[2] = h))
    : (h = e[2]);
  let [g, _] = (0, Q.useState)(h),
    [y, b] = (0, Q.useState)(null),
    x;
  e[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((x = { q: Ke, view: qe, project: Ge }), (e[3] = x))
    : (x = e[3]);
  let [S, C] = Ue(x),
    { q: w, view: T, project: E } = S,
    D = w,
    O;
  e[4] === i._id
    ? (O = e[5])
    : ((O = { repoId: i._id }), (e[4] = i._id), (e[5] = O));
  let k = c(o.projects.list, O),
    A;
  if (e[6] !== k) {
    if (((A = new Map()), k)) for (let e of k) A.set(e._id, e.title);
    ((e[6] = k), (e[7] = A));
  } else A = e[7];
  let M = A,
    N;
  bb0: {
    if (!s) {
      let t;
      (e[8] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = []), (e[8] = t))
        : (t = e[8]),
        (N = t));
      break bb0;
    }
    if (E === `all`) {
      N = s;
      break bb0;
    }
    if (E === `none`) {
      let t;
      (e[9] === s ? (t = e[10]) : ((t = s.filter(Ct)), (e[9] = s), (e[10] = t)),
        (N = t));
      break bb0;
    }
    let t;
    if (e[11] !== E || e[12] !== s) {
      let n;
      (e[14] === E
        ? (n = e[15])
        : ((n = (e) => e.projectId === E), (e[14] = E), (e[15] = n)),
        (t = s.filter(n)),
        (e[11] = E),
        (e[12] = s),
        (e[13] = t));
    } else t = e[13];
    N = t;
  }
  let P = N,
    F;
  e[16] === s ? (F = e[17]) : ((F = s ?? []), (e[16] = s), (e[17] = F));
  let I = F.length > 0,
    L = P.length > 0,
    R;
  if (e[18] !== s) {
    if (((R = new Set()), s)) for (let e of s) R.add(e._id);
    ((e[18] = s), (e[19] = R));
  } else R = e[19];
  let z = R,
    B,
    V;
  (e[20] !== p || e[21] !== z
    ? ((B = () => {
        p &&
          _((e) => {
            let t = !1,
              n = new Set();
            for (let r of e) z.has(r) ? n.add(r) : (t = !0);
            return t ? n : e;
          });
      }),
      (V = [z, p]),
      (e[20] = p),
      (e[21] = z),
      (e[22] = B),
      (e[23] = V))
    : ((B = e[22]), (V = e[23])),
    (0, Q.useEffect)(B, V));
  let H;
  if (e[24] !== P || e[25] !== g) {
    let t;
    (e[27] === g
      ? (t = e[28])
      : ((t = (e) => g.has(e._id)), (e[27] = g), (e[28] = t)),
      (H = P.filter(t)),
      (e[24] = P),
      (e[25] = g),
      (e[26] = H));
  } else H = e[26];
  let U = H,
    ee;
  e[29] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ee = (e) => {
        _((t) => {
          let n = new Set(t);
          return (n.has(e) ? n.delete(e) : n.add(e), n);
        });
      }),
      (e[29] = ee))
    : (ee = e[29]);
  let W = ee,
    te;
  e[30] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((te = () => {
        (m(!1), _(new Set()), b(null));
      }),
      (e[30] = te))
    : (te = e[30]);
  let ne = te,
    re;
  e[31] !== n || e[32] !== t || e[33] !== T
    ? ((re = (e) => {
        t({ to: `${n}/quick-tasks/${e}${T === `kanban` ? `` : `?view=${T}`}` });
      }),
      (e[31] = n),
      (e[32] = t),
      (e[33] = T),
      (e[34] = re))
    : (re = e[34]);
  let ie = re,
    G;
  e[35] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((G = () => b(null)), (e[35] = G))
    : (G = e[35]);
  let ae = G,
    oe;
  if (
    (e[36] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((oe = (e) => {
          (e.preventDefault(), u(!0));
        }),
        (e[36] = oe))
      : (oe = e[36]),
    ce(`Alt+N`, oe),
    s === void 0)
  ) {
    let t;
    return (
      e[37] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, $.jsx)(`div`, {
            className: `flex h-full flex-1 items-center justify-center`,
            children: (0, $.jsx)(v, {}),
          })),
          (e[37] = t))
        : (t = e[37]),
      t
    );
  }
  let K;
  e[38] === C
    ? (K = e[39])
    : ((K = (e) => C({ view: e })), (e[38] = C), (e[39] = K));
  let q;
  e[40] === C
    ? (q = e[41])
    : ((q = (e) => C({ q: e })), (e[40] = C), (e[41] = q));
  let se, le, ue;
  e[42] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((se = () => m(!0)),
      (le = () => u(!0)),
      (ue = () => f(!0)),
      (e[42] = se),
      (e[43] = le),
      (e[44] = ue))
    : ((se = e[42]), (le = e[43]), (ue = e[44]));
  let J;
  e[45] === C
    ? (J = e[46])
    : ((J = (e) => C({ project: e })), (e[45] = C), (e[46] = J));
  let fe;
  e[47] !== I ||
  e[48] !== p ||
  e[49] !== E ||
  e[50] !== k ||
  e[51] !== D ||
  e[52] !== K ||
  e[53] !== q ||
  e[54] !== J ||
  e[55] !== T
    ? ((fe = (0, $.jsx)(ct, {
        view: T,
        onViewChange: K,
        searchQuery: D,
        onSearchChange: q,
        hasQuickTasks: I,
        isSelecting: p,
        onStartSelecting: se,
        onCreateTask: le,
        onImport: ue,
        projects: k,
        projectFilter: E,
        onProjectFilterChange: J,
      })),
      (e[47] = I),
      (e[48] = p),
      (e[49] = E),
      (e[50] = k),
      (e[51] = D),
      (e[52] = K),
      (e[53] = q),
      (e[54] = J),
      (e[55] = T),
      (e[56] = fe))
    : (fe = e[56]);
  let pe;
  e[57] !== ie ||
  e[58] !== L ||
  e[59] !== p ||
  e[60] !== M ||
  e[61] !== P ||
  e[62] !== g ||
  e[63] !== T
    ? ((pe = (0, $.jsx)(Ve, {
        mode: `wait`,
        children: L
          ? T === `kanban`
            ? (0, $.jsx)(
                j.div,
                {
                  className: `flex min-w-0 flex-1 min-h-0`,
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: 8 },
                  transition: { duration: 0.2 },
                  children: (0, $.jsx)(ot, {
                    tasks: P,
                    projectNames: M,
                    isSelecting: p,
                    selectedIds: g,
                    onToggleSelect: W,
                    onOpenTask: ie,
                  }),
                },
                `quick-tasks-board`,
              )
            : (0, $.jsx)(
                j.div,
                {
                  className: `flex min-w-0 flex-1 min-h-0`,
                  initial: { opacity: 0, y: 8 },
                  animate: { opacity: 1, y: 0 },
                  exit: { opacity: 0, y: 8 },
                  transition: { duration: 0.2 },
                  children: (0, $.jsx)(st, {
                    tasks: P,
                    projectNames: M,
                    isSelecting: p,
                    selectedIds: g,
                    onToggleSelect: W,
                    onOpenTask: ie,
                  }),
                },
                `quick-tasks-list`,
              )
          : (0, $.jsx)(
              j.div,
              {
                initial: { opacity: 0, y: 8 },
                animate: { opacity: 1, y: 0 },
                exit: { opacity: 0, y: 8 },
                transition: { duration: 0.2 },
                children: (0, $.jsx)(Ye, {
                  icon: (0, $.jsx)(ge, {
                    size: 24,
                    className: `text-muted-foreground`,
                  }),
                  title: `No quick tasks`,
                  description: `Quick tasks are standalone tasks not tied to a feature. Create one for small, one-off work.`,
                  actionLabel: `Create Quick Task`,
                  onAction: () => u(!0),
                }),
              },
              `quick-tasks-empty`,
            ),
      })),
      (e[57] = ie),
      (e[58] = L),
      (e[59] = p),
      (e[60] = M),
      (e[61] = P),
      (e[62] = g),
      (e[63] = T),
      (e[64] = pe))
    : (pe = e[64]);
  let me;
  e[65] !== y || e[66] !== L || e[67] !== p || e[68] !== g
    ? ((me =
        L &&
        (0, $.jsx)(ft, {
          isSelecting: p,
          selectedCount: g.size,
          onExitSelect: ne,
          activeBulkAction: y,
          onSetBulkAction: b,
        })),
      (e[65] = y),
      (e[66] = L),
      (e[67] = p),
      (e[68] = g),
      (e[69] = me))
    : (me = e[69]);
  let he;
  e[70] !== pe || e[71] !== me
    ? ((he = (0, $.jsxs)(`div`, {
        className: `relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0`,
        children: [pe, me],
      })),
      (e[70] = pe),
      (e[71] = me),
      (e[72] = he))
    : (he = e[72]);
  let Y;
  e[73] !== fe || e[74] !== he
    ? ((Y = (0, $.jsx)(Je, {
        title: `Quick Tasks`,
        fillHeight: !0,
        childPadding: !1,
        headerRight: fe,
        children: he,
      })),
      (e[73] = fe),
      (e[74] = he),
      (e[75] = Y))
    : (Y = e[75]);
  let X;
  e[76] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((X = () => u(!1)), (e[76] = X))
    : (X = e[76]);
  let _e;
  e[77] === l
    ? (_e = e[78])
    : ((_e = (0, $.jsx)(de, { isOpen: l, onClose: X })),
      (e[77] = l),
      (e[78] = _e));
  let ve;
  e[79] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ve = () => f(!1)), (e[79] = ve))
    : (ve = e[79]);
  let ye;
  e[80] === d
    ? (ye = e[81])
    : ((ye = (0, $.jsx)(tt, { isOpen: d, onClose: ve })),
      (e[80] = d),
      (e[81] = ye));
  let be;
  e[82] !== y || e[83] !== g || e[84] !== U
    ? ((be = (0, $.jsx)(xt, {
        activeBulkAction: y,
        onCloseBulkAction: ae,
        selectedTaskIds: g,
        selectedTasks: U,
        onSuccess: ne,
      })),
      (e[82] = y),
      (e[83] = g),
      (e[84] = U),
      (e[85] = be))
    : (be = e[85]);
  let xe;
  return (
    e[86] !== Y || e[87] !== _e || e[88] !== ye || e[89] !== be
      ? ((xe = (0, $.jsxs)($.Fragment, { children: [Y, _e, ye, be] })),
        (e[86] = Y),
        (e[87] = _e),
        (e[88] = ye),
        (e[89] = be),
        (e[90] = xe))
      : (xe = e[90]),
    xe
  );
}
function Ct(e) {
  return !e.projectId;
}
var wt = St;
export { wt as component };
