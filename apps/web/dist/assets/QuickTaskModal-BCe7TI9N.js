import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { c as i, n as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
import {
  An as s,
  Cn as c,
  Dn as l,
  En as u,
  Er as d,
  Gn as f,
  Kt as p,
  On as m,
  Rn as h,
  Rt as g,
  Sn as _,
  Tn as v,
  Un as y,
  Vn as b,
  Vt as x,
  Wn as ee,
  Zn as S,
  _n as C,
  ar as w,
  bn as T,
  dn as te,
  dr as ne,
  gn as E,
  hn as D,
  ir as re,
  jn as ie,
  kn as O,
  mn as ae,
  nn as oe,
  on as k,
  pn as se,
  rn as A,
  sn as ce,
  tn as le,
  ur as j,
  vn as M,
  wn as N,
  xn as P,
  yn as ue,
  zt as de,
} from "./src-DzioQSsH.js";
import { t as fe } from "./createReactComponent-C2GWxX5y.js";
import { r as pe, t as me } from "./TaskStatusBadge-pvqpdmz8.js";
import { t as he } from "./IconClipboard-CG1pDYHj.js";
import { t as ge } from "./IconClock-BRHjI4rV.js";
import { t as _e } from "./IconDots-BEl8aRmt.js";
import { t as ve } from "./IconFileText-y2qCeLR_.js";
import { t as ye } from "./IconFolder-B8BePKLB.js";
import { t as be } from "./IconLoader2-BhUbT1Hm.js";
import {
  C as xe,
  S as F,
  T as I,
  _ as L,
  b as Se,
  d as Ce,
  f as we,
  g as Te,
  h as Ee,
  o as R,
  p as De,
  u as Oe,
  w as ke,
  x as Ae,
} from "./ProjectPhaseBadge-Df5sMfLH.js";
import { t as je } from "./IconTrash-bHTcNORt.js";
import { t as Me } from "./IconUserPlus-sJRgozpx.js";
import { t as Ne } from "./src-BHqyiqII.js";
import { n as Pe, t as Fe } from "./dates-DHZmrCUU.js";
import { n as Ie } from "./RepoContext-Dg6-rqFp.js";
import { t as z } from "./BranchSelect-BOl4JobS.js";
var Le = fe(`outline`, `arrow-move-right`, `ArrowMoveRight`, [
    [`path`, { d: `M11 12h10`, key: `svg-0` }],
    [`path`, { d: `M18 9l3 3l-3 3`, key: `svg-1` }],
    [`path`, { d: `M7 12a2 2 0 1 1 -4 0a2 2 0 0 1 4 0`, key: `svg-2` }],
  ]),
  Re = fe(`outline`, `link`, `Link`, [
    [`path`, { d: `M9 15l6 -6`, key: `svg-0` }],
    [
      `path`,
      { d: `M11 6l.463 -.536a5 5 0 0 1 7.071 7.072l-.534 .464`, key: `svg-1` },
    ],
    [
      `path`,
      {
        d: `M13 18l-.397 .534a5.068 5.068 0 0 1 -7.127 0a4.972 4.972 0 0 1 0 -7.071l.524 -.463`,
        key: `svg-2`,
      },
    ],
  ]),
  ze = fe(`outline`, `tag`, `Tag`, [
    [`path`, { d: `M6.5 7.5a1 1 0 1 0 2 0a1 1 0 1 0 -2 0`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M3 6v5.172a2 2 0 0 0 .586 1.414l7.71 7.71a2.41 2.41 0 0 0 3.408 0l5.592 -5.592a2.41 2.41 0 0 0 0 -3.408l-7.71 -7.71a2 2 0 0 0 -1.414 -.586h-5.172a3 3 0 0 0 -3 3`,
        key: `svg-1`,
      },
    ],
  ]),
  B = e(t());
function Be(e, t, n) {
  let r = e.slice();
  return (r.splice(n < 0 ? r.length + n : n, 0, r.splice(t, 1)[0]), r);
}
function Ve(e, t) {
  return e.reduce((e, n, r) => {
    let i = t.get(n);
    return (i && (e[r] = i), e);
  }, Array(e.length));
}
function V(e) {
  return e !== null && e >= 0;
}
function He(e, t) {
  if (e === t) return !0;
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
  return !0;
}
function Ue(e) {
  return typeof e == `boolean` ? { draggable: e, droppable: e } : e;
}
var H = (e) => {
    let { rects: t, activeIndex: n, overIndex: r, index: i } = e,
      a = Be(t, r, n),
      o = t[i],
      s = a[i];
    return !s || !o
      ? null
      : {
          x: s.left - o.left,
          y: s.top - o.top,
          scaleX: s.width / o.width,
          scaleY: s.height / o.height,
        };
  },
  U = { scaleX: 1, scaleY: 1 },
  We = (e) => {
    let {
        activeIndex: t,
        activeNodeRect: n,
        index: r,
        rects: i,
        overIndex: a,
      } = e,
      o = i[t] ?? n;
    if (!o) return null;
    if (r === t) {
      let e = i[a];
      return e
        ? {
            x: 0,
            y: t < a ? e.top + e.height - (o.top + o.height) : e.top - o.top,
            ...U,
          }
        : null;
    }
    let s = Ge(i, r, t);
    return r > t && r <= a
      ? { x: 0, y: -o.height - s, ...U }
      : r < t && r >= a
        ? { x: 0, y: o.height + s, ...U }
        : { x: 0, y: 0, ...U };
  };
function Ge(e, t, n) {
  let r = e[t],
    i = e[t - 1],
    a = e[t + 1];
  return r
    ? n < t
      ? i
        ? r.top - (i.top + i.height)
        : a
          ? a.top - (r.top + r.height)
          : 0
      : a
        ? a.top - (r.top + r.height)
        : i
          ? r.top - (i.top + i.height)
          : 0
    : 0;
}
var Ke = `Sortable`,
  qe = B.createContext({
    activeIndex: -1,
    containerId: Ke,
    disableTransforms: !1,
    items: [],
    overIndex: -1,
    useDragOverlay: !1,
    sortedRects: [],
    strategy: H,
    disabled: { draggable: !1, droppable: !1 },
  });
function Je(e) {
  let { children: t, id: n, items: r, strategy: i = H, disabled: a = !1 } = e,
    {
      active: o,
      dragOverlay: s,
      droppableRects: c,
      over: l,
      measureDroppableContainers: u,
    } = Ee(),
    d = I(Ke, n),
    f = s.rect !== null,
    p = (0, B.useMemo)(
      () => r.map((e) => (typeof e == `object` && `id` in e ? e.id : e)),
      [r],
    ),
    m = o != null,
    h = o ? p.indexOf(o.id) : -1,
    g = l ? p.indexOf(l.id) : -1,
    _ = (0, B.useRef)(p),
    v = !He(p, _.current),
    y = (g !== -1 && h === -1) || v,
    b = Ue(a);
  (ke(() => {
    v && m && u(p);
  }, [v, p, m, u]),
    (0, B.useEffect)(() => {
      _.current = p;
    }, [p]));
  let x = (0, B.useMemo)(
    () => ({
      activeIndex: h,
      containerId: d,
      disabled: b,
      disableTransforms: y,
      items: p,
      overIndex: g,
      useDragOverlay: f,
      sortedRects: Ve(p, c),
      strategy: i,
    }),
    [h, d, b.draggable, b.droppable, y, p, g, c, f, i],
  );
  return B.createElement(qe.Provider, { value: x }, t);
}
var Ye = (e) => {
    let { id: t, items: n, activeIndex: r, overIndex: i } = e;
    return Be(n, r, i).indexOf(t);
  },
  Xe = (e) => {
    let {
      containerId: t,
      isSorting: n,
      wasDragging: r,
      index: i,
      items: a,
      newIndex: o,
      previousItems: s,
      previousContainerId: c,
      transition: l,
    } = e;
    return !l || !r || (s !== a && i === o) ? !1 : n ? !0 : o !== i && t === c;
  },
  Ze = { duration: 200, easing: `ease` },
  Qe = `transform`,
  $e = Se.Transition.toString({ property: Qe, duration: 0, easing: `linear` }),
  et = { roleDescription: `sortable` };
function tt(e) {
  let { disabled: t, index: n, node: r, rect: i } = e,
    [a, o] = (0, B.useState)(null),
    s = (0, B.useRef)(n);
  return (
    ke(() => {
      if (!t && n !== s.current && r.current) {
        let e = i.current;
        if (e) {
          let t = Ce(r.current, { ignoreTransform: !0 }),
            n = {
              x: e.left - t.left,
              y: e.top - t.top,
              scaleX: e.width / t.width,
              scaleY: e.height / t.height,
            };
          (n.x || n.y) && o(n);
        }
      }
      n !== s.current && (s.current = n);
    }, [t, n, r, i]),
    (0, B.useEffect)(() => {
      a && o(null);
    }, [a]),
    a
  );
}
function nt(e) {
  let {
      animateLayoutChanges: t = Xe,
      attributes: n,
      disabled: r,
      data: i,
      getNewIndex: a = Ye,
      id: o,
      strategy: s,
      resizeObserverConfig: c,
      transition: l = Ze,
    } = e,
    {
      items: u,
      containerId: d,
      activeIndex: f,
      disabled: p,
      disableTransforms: m,
      sortedRects: h,
      overIndex: g,
      useDragOverlay: _,
      strategy: v,
    } = (0, B.useContext)(qe),
    y = rt(r, p),
    b = u.indexOf(o),
    x = (0, B.useMemo)(
      () => ({ sortable: { containerId: d, index: b, items: u }, ...i }),
      [d, i, b, u],
    ),
    ee = (0, B.useMemo)(() => u.slice(u.indexOf(o)), [u, o]),
    {
      rect: S,
      node: C,
      isOver: w,
      setNodeRef: T,
    } = L({
      id: o,
      data: x,
      disabled: y.droppable,
      resizeObserverConfig: { updateMeasurementsFor: ee, ...c },
    }),
    {
      active: te,
      activatorEvent: ne,
      activeNodeRect: E,
      attributes: D,
      setNodeRef: re,
      listeners: ie,
      isDragging: O,
      over: ae,
      setActivatorNodeRef: oe,
      transform: k,
    } = Te({
      id: o,
      data: x,
      attributes: { ...et, ...n },
      disabled: y.draggable,
    }),
    se = xe(T, re),
    A = !!te,
    ce = A && !m && V(f) && V(g),
    le = !_ && O,
    j = ce
      ? ((le && ce ? k : null) ??
        (s ?? v)({
          rects: h,
          activeNodeRect: E,
          activeIndex: f,
          overIndex: g,
          index: b,
        }))
      : null,
    M = V(f) && V(g) ? a({ id: o, items: u, activeIndex: f, overIndex: g }) : b,
    N = te?.id,
    P = (0, B.useRef)({ activeId: N, items: u, newIndex: M, containerId: d }),
    ue = u !== P.current.items,
    de = t({
      active: te,
      containerId: d,
      isDragging: O,
      isSorting: A,
      id: o,
      index: b,
      items: u,
      newIndex: P.current.newIndex,
      previousItems: P.current.items,
      previousContainerId: P.current.containerId,
      transition: l,
      wasDragging: P.current.activeId != null,
    }),
    fe = tt({ disabled: !de, index: b, node: C, rect: S });
  return (
    (0, B.useEffect)(() => {
      (A && P.current.newIndex !== M && (P.current.newIndex = M),
        d !== P.current.containerId && (P.current.containerId = d),
        u !== P.current.items && (P.current.items = u));
    }, [A, M, d, u]),
    (0, B.useEffect)(() => {
      if (N === P.current.activeId) return;
      if (N != null && P.current.activeId == null) {
        P.current.activeId = N;
        return;
      }
      let e = setTimeout(() => {
        P.current.activeId = N;
      }, 50);
      return () => clearTimeout(e);
    }, [N]),
    {
      active: te,
      activeIndex: f,
      attributes: D,
      data: x,
      rect: S,
      index: b,
      newIndex: M,
      items: u,
      isOver: w,
      isSorting: A,
      isDragging: O,
      listeners: ie,
      node: C,
      overIndex: g,
      over: ae,
      setNodeRef: se,
      setActivatorNodeRef: oe,
      setDroppableNodeRef: T,
      setDraggableNodeRef: re,
      transform: fe ?? j,
      transition: pe(),
    }
  );
  function pe() {
    if (fe || (ue && P.current.newIndex === b)) return $e;
    if (!((le && !Ae(ne)) || !l) && (A || de))
      return Se.Transition.toString({ ...l, property: Qe });
  }
}
function rt(e, t) {
  return typeof e == `boolean`
    ? { draggable: e, droppable: !1 }
    : {
        draggable: e?.draggable ?? t.draggable,
        droppable: e?.droppable ?? t.droppable,
      };
}
function W(e) {
  if (!e) return !1;
  let t = e.data.current;
  return !!(
    t &&
    `sortable` in t &&
    typeof t.sortable == `object` &&
    `containerId` in t.sortable &&
    `items` in t.sortable &&
    `index` in t.sortable
  );
}
var it = [R.Down, R.Right, R.Up, R.Left],
  at = (e, t) => {
    let {
      context: {
        active: n,
        collisionRect: r,
        droppableRects: i,
        droppableContainers: a,
        over: o,
        scrollableAncestors: s,
      },
    } = t;
    if (it.includes(e.code)) {
      if ((e.preventDefault(), !n || !r)) return;
      let t = [];
      a.getEnabled().forEach((n) => {
        if (!n || (n != null && n.disabled)) return;
        let a = i.get(n.id);
        if (a)
          switch (e.code) {
            case R.Down:
              r.top < a.top && t.push(n);
              break;
            case R.Up:
              r.top > a.top && t.push(n);
              break;
            case R.Left:
              r.left > a.left && t.push(n);
              break;
            case R.Right:
              r.left < a.left && t.push(n);
              break;
          }
      });
      let c = Oe({
          active: n,
          collisionRect: r,
          droppableRects: i,
          droppableContainers: t,
          pointerCoordinates: null,
        }),
        l = we(c, `id`);
      if ((l === o?.id && c.length > 1 && (l = c[1].id), l != null)) {
        let e = a.get(n.id),
          t = a.get(l),
          o = t ? i.get(t.id) : null,
          c = t?.node.current;
        if (c && o && e && t) {
          let n = De(c).some((e, t) => s[t] !== e),
            i = ot(e, t),
            a = st(e, t),
            l =
              n || !i
                ? { x: 0, y: 0 }
                : {
                    x: a ? r.width - o.width : 0,
                    y: a ? r.height - o.height : 0,
                  },
            u = { x: o.left, y: o.top };
          return l.x && l.y ? u : F(u, l);
        }
      }
    }
  };
function ot(e, t) {
  return !W(e) || !W(t)
    ? !1
    : e.data.current.sortable.containerId ===
        t.data.current.sortable.containerId;
}
function st(e, t) {
  return !W(e) || !W(t) || !ot(e, t)
    ? !1
    : e.data.current.sortable.index < t.data.current.sortable.index;
}
var ct = r(),
  G = n();
function lt(e) {
  let t = (0, ct.c)(30),
    {
      open: n,
      onOpenChange: r,
      title: i,
      description: a,
      detail: o,
      confirmLabel: s,
      variant: c,
      onConfirm: l,
      isLoading: u,
    } = e,
    d = c === void 0 ? `default` : c,
    p;
  t[0] === i
    ? (p = t[1])
    : ((p = (0, G.jsx)(ee, { children: (0, G.jsx)(f, { children: i }) })),
      (t[0] = i),
      (t[1] = p));
  let m;
  t[2] === a
    ? (m = t[3])
    : ((m = (0, G.jsx)(`p`, {
        className: `text-muted-foreground`,
        children: a,
      })),
      (t[2] = a),
      (t[3] = m));
  let g;
  t[4] === o
    ? (g = t[5])
    : ((g =
        o &&
        (0, G.jsx)(`p`, {
          className: `text-sm text-muted-foreground mt-3`,
          children: o,
        })),
      (t[4] = o),
      (t[5] = g));
  let _;
  t[6] !== m || t[7] !== g
    ? ((_ = (0, G.jsxs)(`div`, { children: [m, g] })),
      (t[6] = m),
      (t[7] = g),
      (t[8] = _))
    : (_ = t[8]);
  let v;
  t[9] === r
    ? (v = t[10])
    : ((v = (0, G.jsx)(j, {
        variant: `ghost`,
        onClick: () => r(!1),
        children: `Cancel`,
      })),
      (t[9] = r),
      (t[10] = v));
  let x;
  t[11] === u
    ? (x = t[12])
    : ((x = u && (0, G.jsx)(be, { size: 16, className: `animate-spin` })),
      (t[11] = u),
      (t[12] = x));
  let S;
  t[13] !== s || t[14] !== u || t[15] !== l || t[16] !== x || t[17] !== d
    ? ((S = (0, G.jsxs)(j, {
        variant: d,
        onClick: l,
        disabled: u,
        children: [x, s],
      })),
      (t[13] = s),
      (t[14] = u),
      (t[15] = l),
      (t[16] = x),
      (t[17] = d),
      (t[18] = S))
    : (S = t[18]);
  let C;
  t[19] !== v || t[20] !== S
    ? ((C = (0, G.jsxs)(y, { children: [v, S] })),
      (t[19] = v),
      (t[20] = S),
      (t[21] = C))
    : (C = t[21]);
  let w;
  t[22] !== p || t[23] !== _ || t[24] !== C
    ? ((w = (0, G.jsxs)(b, { className: `max-w-md`, children: [p, _, C] })),
      (t[22] = p),
      (t[23] = _),
      (t[24] = C),
      (t[25] = w))
    : (w = t[25]);
  let T;
  return (
    t[26] !== r || t[27] !== n || t[28] !== w
      ? ((T = (0, G.jsx)(h, { open: n, onOpenChange: r, children: w })),
        (t[26] = r),
        (t[27] = n),
        (t[28] = w),
        (t[29] = T))
      : (T = t[29]),
    T
  );
}
function ut({ open: e, onClose: t, taskId: n, taskTitle: r }) {
  let o = i(a.agentTasks.deleteCascade),
    [s, c] = (0, B.useState)(!1);
  return (0, G.jsx)(lt, {
    open: e,
    onOpenChange: (e) => {
      e || t();
    },
    title: `Delete Task`,
    description: (0, G.jsxs)(G.Fragment, {
      children: [
        `Are you sure you want to delete `,
        (0, G.jsx)(`strong`, { children: r }),
        `?`,
      ],
    }),
    detail: `This action cannot be undone.`,
    confirmLabel: `Delete`,
    variant: `destructive`,
    onConfirm: async () => {
      c(!0);
      try {
        (await o({ id: n }), t());
      } catch (e) {
        console.error(`Failed to delete task:`, e);
      } finally {
        c(!1);
      }
    },
    isLoading: s,
  });
}
function dt({
  targetId: e,
  targetAppName: t,
  onClose: n,
  taskId: r,
  taskTitle: o,
}) {
  let s = i(a.agentTasks.update),
    [c, l] = (0, B.useState)(!1);
  return (0, G.jsx)(lt, {
    open: e !== null,
    onOpenChange: (e) => {
      e || n();
    },
    title: `Move Task`,
    description: (0, G.jsxs)(G.Fragment, {
      children: [
        `Move `,
        (0, G.jsx)(`strong`, { children: o }),
        ` to `,
        (0, G.jsx)(`strong`, { children: t }),
        `?`,
      ],
    }),
    detail: `The task will appear in the other app's quick tasks.`,
    confirmLabel: `Move`,
    onConfirm: async () => {
      if (e) {
        l(!0);
        try {
          (await s({ id: r, repoId: e }), n());
        } catch (e) {
          console.error(`Failed to move task:`, e);
        } finally {
          l(!1);
        }
      }
    },
    isLoading: c,
  });
}
var ft = [
  { value: `opus`, label: `Opus` },
  { value: `sonnet`, label: `Sonnet` },
  { value: `haiku`, label: `Haiku` },
];
function pt(e) {
  let t = (0, ct.c)(235),
    {
      id: n,
      title: r,
      status: f,
      taskNumber: p,
      scheduledAt: h,
      tags: y,
      createdBy: b,
      createdAt: ee,
      projectName: oe,
      siblingApps: k,
      onClick: A,
      isSelecting: ce,
      isSelected: le,
      isActive: j,
      onToggleSelect: fe,
      assignedTo: ve,
      model: be,
      projectId: xe,
      users: F,
      currentUserId: I,
      projects: L,
    } = e,
    Se;
  t[0] === n ? (Se = t[1]) : ((Se = { taskId: n }), (t[0] = n), (t[1] = Se));
  let Ce = o(a.agentRuns.listByTask, Se)?.[0]?.status === `error`,
    we = Ce && f !== `done`,
    Te = pe[f],
    Ee = we ? `bg-destructive` : Te.bar,
    R = f === `in_progress` && !Ce,
    [De, Oe] = (0, B.useState)(!1),
    [ke, Ae] = (0, B.useState)(null),
    Ie = i(a.agentTasks.updateStatus),
    z = i(a.agentTasks.update),
    ze;
  t[2] !== ke || t[3] !== k
    ? ((ze = k?.find((e) => e._id === ke)?.appName ?? ``),
      (t[2] = ke),
      (t[3] = k),
      (t[4] = ze))
    : (ze = t[4]);
  let Be = ze,
    Ve = pe[f].icon,
    V;
  t[5] === Ve
    ? (V = t[6])
    : ((V = (0, G.jsxs)(s, {
        children: [(0, G.jsx)(Ve, { size: 16 }), `Status`],
      })),
      (t[5] = Ve),
      (t[6] = V));
  let He;
  t[7] !== n || t[8] !== Ie
    ? ((He = (e) => {
        let t = me.find((t) => t === e);
        t && Ie({ id: n, status: t });
      }),
      (t[7] = n),
      (t[8] = Ie),
      (t[9] = He))
    : (He = t[9]);
  let Ue;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ue = me.map(Et)), (t[10] = Ue))
    : (Ue = t[10]);
  let H;
  t[11] !== f || t[12] !== He
    ? ((H = (0, G.jsx)(O, {
        children: (0, G.jsx)(v, { value: f, onValueChange: He, children: Ue }),
      })),
      (t[11] = f),
      (t[12] = He),
      (t[13] = H))
    : (H = t[13]);
  let U;
  t[14] !== V || t[15] !== H
    ? ((U = (0, G.jsxs)(m, { children: [V, H] })),
      (t[14] = V),
      (t[15] = H),
      (t[16] = U))
    : (U = t[16]);
  let We;
  t[17] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((We = (0, G.jsxs)(s, {
        children: [(0, G.jsx)(Me, { size: 16 }), `Assignee`],
      })),
      (t[17] = We))
    : (We = t[17]);
  let Ge = ve ?? `unassigned`,
    Ke;
  t[18] !== I || t[19] !== n || t[20] !== z || t[21] !== F
    ? ((Ke = (e) => {
        if (e === `unassigned`) z({ id: n, assignedTo: null });
        else {
          let t = (F ?? []).find((t) => t._id === e),
            r = I === e ? I : t?._id;
          if (!r) return;
          z({ id: n, assignedTo: r });
        }
      }),
      (t[18] = I),
      (t[19] = n),
      (t[20] = z),
      (t[21] = F),
      (t[22] = Ke))
    : (Ke = t[22]);
  let qe;
  t[23] === I
    ? (qe = t[24])
    : ((qe = I && (0, G.jsx)(u, { value: I, children: `Assign to me` })),
      (t[23] = I),
      (t[24] = qe));
  let Je, Ye;
  t[25] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Je = (0, G.jsx)(l, {})),
      (Ye = (0, G.jsx)(u, { value: `unassigned`, children: `Unassigned` })),
      (t[25] = Je),
      (t[26] = Ye))
    : ((Je = t[25]), (Ye = t[26]));
  let Xe;
  t[27] === F ? (Xe = t[28]) : ((Xe = F?.map(Tt)), (t[27] = F), (t[28] = Xe));
  let Ze;
  t[29] !== Ke || t[30] !== qe || t[31] !== Xe || t[32] !== Ge
    ? ((Ze = (0, G.jsxs)(m, {
        children: [
          We,
          (0, G.jsx)(O, {
            children: (0, G.jsxs)(v, {
              value: Ge,
              onValueChange: Ke,
              children: [qe, Je, Ye, Xe],
            }),
          }),
        ],
      })),
      (t[29] = Ke),
      (t[30] = qe),
      (t[31] = Xe),
      (t[32] = Ge),
      (t[33] = Ze))
    : (Ze = t[33]);
  let Qe = f !== `todo`,
    $e;
  t[34] === Symbol.for(`react.memo_cache_sentinel`)
    ? (($e = (0, G.jsx)(d, { size: 16 })), (t[34] = $e))
    : ($e = t[34]);
  let et;
  t[35] === Qe
    ? (et = t[36])
    : ((et = (0, G.jsxs)(s, { disabled: Qe, children: [$e, `Model`] })),
      (t[35] = Qe),
      (t[36] = et));
  let tt = be ?? `sonnet`,
    nt;
  t[37] !== n || t[38] !== z
    ? ((nt = (e) => {
        let t = ft.find((t) => t.value === e);
        t && z({ id: n, model: t.value });
      }),
      (t[37] = n),
      (t[38] = z),
      (t[39] = nt))
    : (nt = t[39]);
  let rt;
  t[40] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((rt = ft.map(wt)), (t[40] = rt))
    : (rt = t[40]);
  let W;
  t[41] !== tt || t[42] !== nt
    ? ((W = (0, G.jsx)(O, {
        children: (0, G.jsx)(v, { value: tt, onValueChange: nt, children: rt }),
      })),
      (t[41] = tt),
      (t[42] = nt),
      (t[43] = W))
    : (W = t[43]);
  let it;
  t[44] !== et || t[45] !== W
    ? ((it = (0, G.jsxs)(m, { children: [et, W] })),
      (t[44] = et),
      (t[45] = W),
      (t[46] = it))
    : (it = t[46]);
  let at;
  t[47] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((at = (0, G.jsxs)(s, {
        children: [(0, G.jsx)(ye, { size: 16 }), `Project`],
      })),
      (t[47] = at))
    : (at = t[47]);
  let ot = xe ?? `none`,
    st;
  t[48] !== n || t[49] !== L || t[50] !== z
    ? ((st = (e) => {
        if (e === `none`) z({ id: n, projectId: null });
        else {
          let t = (L ?? []).find((t) => t._id === e);
          if (!t) return;
          z({ id: n, projectId: t._id });
        }
      }),
      (t[48] = n),
      (t[49] = L),
      (t[50] = z),
      (t[51] = st))
    : (st = t[51]);
  let lt;
  t[52] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((lt = (0, G.jsx)(u, { value: `none`, children: `No project` })),
      (t[52] = lt))
    : (lt = t[52]);
  let pt;
  t[53] === L ? (pt = t[54]) : ((pt = L?.map(Ct)), (t[53] = L), (t[54] = pt));
  let Dt;
  t[55] !== ot || t[56] !== st || t[57] !== pt
    ? ((Dt = (0, G.jsxs)(m, {
        children: [
          at,
          (0, G.jsx)(O, {
            children: (0, G.jsxs)(v, {
              value: ot,
              onValueChange: st,
              children: [lt, pt],
            }),
          }),
        ],
      })),
      (t[55] = ot),
      (t[56] = st),
      (t[57] = pt),
      (t[58] = Dt))
    : (Dt = t[58]);
  let Ot;
  t[59] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ot = (0, G.jsx)(l, {})), (t[59] = Ot))
    : (Ot = t[59]);
  let K;
  t[60] === k
    ? (K = t[61])
    : ((K =
        k &&
        k.length > 0 &&
        (0, G.jsxs)(G.Fragment, {
          children: [
            (0, G.jsxs)(m, {
              children: [
                (0, G.jsxs)(s, {
                  children: [(0, G.jsx)(Le, { size: 16 }), `Move to app`],
                }),
                (0, G.jsx)(O, {
                  children: k.map((e) =>
                    (0, G.jsx)(
                      N,
                      {
                        onSelect: (t) => {
                          (t.preventDefault(), Ae(e._id));
                        },
                        children: e.appName,
                      },
                      e._id,
                    ),
                  ),
                }),
              ],
            }),
            (0, G.jsx)(l, {}),
          ],
        })),
      (t[60] = k),
      (t[61] = K));
  let q;
  t[62] === r
    ? (q = t[63])
    : ((q = () => {
        navigator.clipboard.writeText(r);
      }),
      (t[62] = r),
      (t[63] = q));
  let kt;
  t[64] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((kt = (0, G.jsx)(he, { size: 16 })), (t[64] = kt))
    : (kt = t[64]);
  let At;
  t[65] === q
    ? (At = t[66])
    : ((At = (0, G.jsxs)(N, { onSelect: q, children: [kt, `Copy title`] })),
      (t[65] = q),
      (t[66] = At));
  let jt, Mt;
  t[67] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((jt = (0, G.jsxs)(N, {
        onSelect: St,
        children: [(0, G.jsx)(Re, { size: 16 }), `Copy task link`],
      })),
      (Mt = (0, G.jsx)(l, {})),
      (t[67] = jt),
      (t[68] = Mt))
    : ((jt = t[67]), (Mt = t[68]));
  let Nt;
  t[69] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Nt = (0, G.jsxs)(N, {
        className: `text-destructive focus:text-destructive`,
        onSelect: (e) => {
          (e.preventDefault(), Oe(!0));
        },
        children: [(0, G.jsx)(je, { size: 16 }), `Delete`],
      })),
      (t[69] = Nt))
    : (Nt = t[69]);
  let Pt;
  t[70] !== Ze ||
  t[71] !== it ||
  t[72] !== Dt ||
  t[73] !== K ||
  t[74] !== At ||
  t[75] !== U
    ? ((Pt = (0, G.jsxs)(G.Fragment, {
        children: [U, Ze, it, Dt, Ot, K, At, jt, Mt, Nt],
      })),
      (t[70] = Ze),
      (t[71] = it),
      (t[72] = Dt),
      (t[73] = K),
      (t[74] = At),
      (t[75] = U),
      (t[76] = Pt))
    : (Pt = t[76]);
  let Ft = Pt,
    It;
  t[77] === Ve
    ? (It = t[78])
    : ((It = (0, G.jsxs)(T, {
        children: [(0, G.jsx)(Ve, { size: 16 }), `Status`],
      })),
      (t[77] = Ve),
      (t[78] = It));
  let Lt;
  t[79] !== n || t[80] !== Ie
    ? ((Lt = (e) => {
        let t = me.find((t) => t === e);
        t && Ie({ id: n, status: t });
      }),
      (t[79] = n),
      (t[80] = Ie),
      (t[81] = Lt))
    : (Lt = t[81]);
  let J;
  t[82] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((J = me.map(xt)), (t[82] = J))
    : (J = t[82]);
  let Rt;
  t[83] !== f || t[84] !== Lt
    ? ((Rt = (0, G.jsx)(ue, {
        children: (0, G.jsx)(D, { value: f, onValueChange: Lt, children: J }),
      })),
      (t[83] = f),
      (t[84] = Lt),
      (t[85] = Rt))
    : (Rt = t[85]);
  let zt;
  t[86] !== It || t[87] !== Rt
    ? ((zt = (0, G.jsxs)(M, { children: [It, Rt] })),
      (t[86] = It),
      (t[87] = Rt),
      (t[88] = zt))
    : (zt = t[88]);
  let Bt;
  t[89] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Bt = (0, G.jsxs)(T, {
        children: [(0, G.jsx)(Me, { size: 16 }), `Assignee`],
      })),
      (t[89] = Bt))
    : (Bt = t[89]);
  let Vt = ve ?? `unassigned`,
    Ht;
  t[90] !== I || t[91] !== n || t[92] !== z || t[93] !== F
    ? ((Ht = (e) => {
        if (e === `unassigned`) z({ id: n, assignedTo: null });
        else {
          let t = (F ?? []).find((t) => t._id === e),
            r = I === e ? I : t?._id;
          if (!r) return;
          z({ id: n, assignedTo: r });
        }
      }),
      (t[90] = I),
      (t[91] = n),
      (t[92] = z),
      (t[93] = F),
      (t[94] = Ht))
    : (Ht = t[94]);
  let Ut;
  t[95] === I
    ? (Ut = t[96])
    : ((Ut = I && (0, G.jsx)(E, { value: I, children: `Assign to me` })),
      (t[95] = I),
      (t[96] = Ut));
  let Wt, Gt;
  t[97] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Wt = (0, G.jsx)(C, {})),
      (Gt = (0, G.jsx)(E, { value: `unassigned`, children: `Unassigned` })),
      (t[97] = Wt),
      (t[98] = Gt))
    : ((Wt = t[97]), (Gt = t[98]));
  let Kt;
  t[99] === F ? (Kt = t[100]) : ((Kt = F?.map(bt)), (t[99] = F), (t[100] = Kt));
  let Y;
  t[101] !== Vt || t[102] !== Ht || t[103] !== Ut || t[104] !== Kt
    ? ((Y = (0, G.jsxs)(M, {
        children: [
          Bt,
          (0, G.jsx)(ue, {
            children: (0, G.jsxs)(D, {
              value: Vt,
              onValueChange: Ht,
              children: [Ut, Wt, Gt, Kt],
            }),
          }),
        ],
      })),
      (t[101] = Vt),
      (t[102] = Ht),
      (t[103] = Ut),
      (t[104] = Kt),
      (t[105] = Y))
    : (Y = t[105]);
  let qt = f !== `todo`,
    Jt;
  t[106] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Jt = (0, G.jsx)(d, { size: 16 })), (t[106] = Jt))
    : (Jt = t[106]);
  let Yt;
  t[107] === qt
    ? (Yt = t[108])
    : ((Yt = (0, G.jsxs)(T, { disabled: qt, children: [Jt, `Model`] })),
      (t[107] = qt),
      (t[108] = Yt));
  let Xt = be ?? `sonnet`,
    Zt;
  t[109] !== n || t[110] !== z
    ? ((Zt = (e) => {
        let t = ft.find((t) => t.value === e);
        t && z({ id: n, model: t.value });
      }),
      (t[109] = n),
      (t[110] = z),
      (t[111] = Zt))
    : (Zt = t[111]);
  let Qt;
  t[112] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Qt = ft.map(yt)), (t[112] = Qt))
    : (Qt = t[112]);
  let $t;
  t[113] !== Xt || t[114] !== Zt
    ? (($t = (0, G.jsx)(ue, {
        children: (0, G.jsx)(D, { value: Xt, onValueChange: Zt, children: Qt }),
      })),
      (t[113] = Xt),
      (t[114] = Zt),
      (t[115] = $t))
    : ($t = t[115]);
  let en;
  t[116] !== Yt || t[117] !== $t
    ? ((en = (0, G.jsxs)(M, { children: [Yt, $t] })),
      (t[116] = Yt),
      (t[117] = $t),
      (t[118] = en))
    : (en = t[118]);
  let tn;
  t[119] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((tn = (0, G.jsxs)(T, {
        children: [(0, G.jsx)(ye, { size: 16 }), `Project`],
      })),
      (t[119] = tn))
    : (tn = t[119]);
  let nn = xe ?? `none`,
    rn;
  t[120] !== n || t[121] !== L || t[122] !== z
    ? ((rn = (e) => {
        if (e === `none`) z({ id: n, projectId: null });
        else {
          let t = (L ?? []).find((t) => t._id === e);
          if (!t) return;
          z({ id: n, projectId: t._id });
        }
      }),
      (t[120] = n),
      (t[121] = L),
      (t[122] = z),
      (t[123] = rn))
    : (rn = t[123]);
  let an;
  t[124] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((an = (0, G.jsx)(E, { value: `none`, children: `No project` })),
      (t[124] = an))
    : (an = t[124]);
  let on;
  t[125] === L
    ? (on = t[126])
    : ((on = L?.map(vt)), (t[125] = L), (t[126] = on));
  let X;
  t[127] !== nn || t[128] !== rn || t[129] !== on
    ? ((X = (0, G.jsxs)(M, {
        children: [
          tn,
          (0, G.jsx)(ue, {
            children: (0, G.jsxs)(D, {
              value: nn,
              onValueChange: rn,
              children: [an, on],
            }),
          }),
        ],
      })),
      (t[127] = nn),
      (t[128] = rn),
      (t[129] = on),
      (t[130] = X))
    : (X = t[130]);
  let sn;
  t[131] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((sn = (0, G.jsx)(C, {})), (t[131] = sn))
    : (sn = t[131]);
  let Z;
  t[132] === k
    ? (Z = t[133])
    : ((Z =
        k &&
        k.length > 0 &&
        (0, G.jsxs)(G.Fragment, {
          children: [
            (0, G.jsxs)(M, {
              children: [
                (0, G.jsxs)(T, {
                  children: [(0, G.jsx)(Le, { size: 16 }), `Move to app`],
                }),
                (0, G.jsx)(ue, {
                  children: k.map((e) =>
                    (0, G.jsx)(
                      ae,
                      {
                        onSelect: (t) => {
                          (t.preventDefault(), Ae(e._id));
                        },
                        children: e.appName,
                      },
                      e._id,
                    ),
                  ),
                }),
              ],
            }),
            (0, G.jsx)(C, {}),
          ],
        })),
      (t[132] = k),
      (t[133] = Z));
  let Q;
  t[134] === r
    ? (Q = t[135])
    : ((Q = () => {
        navigator.clipboard.writeText(r);
      }),
      (t[134] = r),
      (t[135] = Q));
  let cn;
  t[136] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((cn = (0, G.jsx)(he, { size: 16 })), (t[136] = cn))
    : (cn = t[136]);
  let ln;
  t[137] === Q
    ? (ln = t[138])
    : ((ln = (0, G.jsxs)(ae, { onSelect: Q, children: [cn, `Copy title`] })),
      (t[137] = Q),
      (t[138] = ln));
  let un, dn;
  t[139] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((un = (0, G.jsxs)(ae, {
        onSelect: _t,
        children: [(0, G.jsx)(Re, { size: 16 }), `Copy task link`],
      })),
      (dn = (0, G.jsx)(C, {})),
      (t[139] = un),
      (t[140] = dn))
    : ((un = t[139]), (dn = t[140]));
  let fn;
  t[141] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((fn = (0, G.jsxs)(ae, {
        className: `text-destructive focus:text-destructive`,
        onSelect: (e) => {
          (e.preventDefault(), Oe(!0));
        },
        children: [(0, G.jsx)(je, { size: 16 }), `Delete`],
      })),
      (t[141] = fn))
    : (fn = t[141]);
  let pn;
  t[142] !== zt ||
  t[143] !== Y ||
  t[144] !== en ||
  t[145] !== X ||
  t[146] !== Z ||
  t[147] !== ln
    ? ((pn = (0, G.jsxs)(G.Fragment, {
        children: [zt, Y, en, X, sn, Z, ln, un, dn, fn],
      })),
      (t[142] = zt),
      (t[143] = Y),
      (t[144] = en),
      (t[145] = X),
      (t[146] = Z),
      (t[147] = ln),
      (t[148] = pn))
    : (pn = t[148]);
  let mn = pn,
    $ = `group relative overflow-hidden border-0 transition-[transform,background-color] duration-200 ${we ? `bg-card/88` : R ? `bg-card/95` : j ? `bg-primary/5` : `bg-card/88 hover:bg-card`} ${le ? `ring-2 ring-primary/40` : ``} ${j ? `ring-1 ring-primary/30` : ``} ${A ? `cursor-pointer hover:-translate-y-[1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35` : ``}`,
    hn = A ? `button` : void 0,
    gn = A ? 0 : void 0,
    _n;
  t[149] === A
    ? (_n = t[150])
    : ((_n = (e) => {
        A && (e.key === `Enter` || e.key === ` `) && (e.preventDefault(), A());
      }),
      (t[149] = A),
      (t[150] = _n));
  let vn = `pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full opacity-0 blur-xl transition-opacity duration-200 group-hover:opacity-30 group-focus-within:opacity-30 ${Ee}`,
    yn;
  t[151] === vn
    ? (yn = t[152])
    : ((yn = (0, G.jsx)(`div`, { className: vn })),
      (t[151] = vn),
      (t[152] = yn));
  let bn = `absolute inset-y-1.5 left-0 w-1 rounded-r-full ${Ee}`,
    xn;
  t[153] === bn
    ? (xn = t[154])
    : ((xn = (0, G.jsx)(`div`, { className: bn })),
      (t[153] = bn),
      (t[154] = xn));
  let Sn;
  t[155] !== le || t[156] !== ce || t[157] !== fe
    ? ((Sn =
        ce &&
        (0, G.jsx)(S, {
          checked: le,
          onCheckedChange: () => fe?.(),
          onClick: gt,
          className: `mt-0.5 flex-shrink-0`,
        })),
      (t[155] = le),
      (t[156] = ce),
      (t[157] = fe),
      (t[158] = Sn))
    : (Sn = t[158]);
  let Cn;
  t[159] === p
    ? (Cn = t[160])
    : ((Cn =
        p !== void 0 &&
        (0, G.jsxs)(`span`, {
          className: `text-muted-foreground font-mono mr-1.5`,
          children: [`#`, p],
        })),
      (t[159] = p),
      (t[160] = Cn));
  let wn;
  t[161] !== Cn || t[162] !== r
    ? ((wn = (0, G.jsxs)(`h4`, {
        className: `line-clamp-1 text-sm font-semibold leading-5 text-foreground`,
        children: [Cn, r],
      })),
      (t[161] = Cn),
      (t[162] = r),
      (t[163] = wn))
    : (wn = t[163]);
  let Tn;
  t[164] === oe
    ? (Tn = t[165])
    : ((Tn = oe
        ? (0, G.jsx)(ne, {
            variant: `default`,
            className: `ml-auto shrink-0 px-1.5 py-0 text-[10px] font-medium leading-4`,
            children: (0, G.jsxs)(`div`, {
              className: `flex flex-row gap-0.5 items-center`,
              children: [(0, G.jsx)(ye, { size: 10 }), oe],
            }),
          })
        : null),
      (t[164] = oe),
      (t[165] = Tn));
  let En;
  t[166] === y
    ? (En = t[167])
    : ((En =
        y && y.length > 0
          ? (0, G.jsx)(`div`, {
              className: `mt-1 flex flex-wrap gap-1`,
              children: y.map(ht),
            })
          : null),
      (t[166] = y),
      (t[167] = En));
  let Dn;
  t[168] !== wn || t[169] !== Tn || t[170] !== En
    ? ((Dn = (0, G.jsxs)(`div`, {
        className: `min-w-0 flex-1`,
        children: [wn, Tn, En],
      })),
      (t[168] = wn),
      (t[169] = Tn),
      (t[170] = En),
      (t[171] = Dn))
    : (Dn = t[171]);
  let On;
  t[172] !== h || t[173] !== f
    ? ((On = h
        ? (0, G.jsxs)(g, {
            children: [
              (0, G.jsx)(x, {
                asChild: !0,
                children: (0, G.jsx)(`span`, {
                  className: `flex items-center text-primary`,
                  children: (0, G.jsx)(ge, { size: 14 }),
                }),
              }),
              (0, G.jsx)(de, {
                children:
                  f === `todo`
                    ? `Scheduled for ${Pe(h).format(`MMM D, h:mm A`)}`
                    : `Was scheduled for ${Pe(h).format(`MMM D, h:mm A`)}`,
              }),
            ],
          })
        : null),
      (t[172] = h),
      (t[173] = f),
      (t[174] = On))
    : (On = t[174]);
  let kn;
  t[175] === On
    ? (kn = t[176])
    : ((kn = (0, G.jsx)(`div`, {
        className: `flex shrink-0 items-center gap-0.5`,
        children: On,
      })),
      (t[175] = On),
      (t[176] = kn));
  let An;
  t[177] !== Sn || t[178] !== Dn || t[179] !== kn
    ? ((An = (0, G.jsxs)(`div`, {
        className: `flex min-w-0 items-start gap-1.5`,
        children: [Sn, Dn, kn],
      })),
      (t[177] = Sn),
      (t[178] = Dn),
      (t[179] = kn),
      (t[180] = An))
    : (An = t[180]);
  let jn;
  t[181] === b
    ? (jn = t[182])
    : ((jn = b && (0, G.jsx)(Ne, { userId: b, size: `sm` })),
      (t[181] = b),
      (t[182] = jn));
  let Mn;
  t[183] === jn
    ? (Mn = t[184])
    : ((Mn = (0, G.jsx)(`div`, {
        className: `flex items-center gap-1.5`,
        children: jn,
      })),
      (t[183] = jn),
      (t[184] = Mn));
  let Nn;
  t[185] === ee ? (Nn = t[186]) : ((Nn = Fe(ee)), (t[185] = ee), (t[186] = Nn));
  let Pn;
  t[187] === Nn
    ? (Pn = t[188])
    : ((Pn = (0, G.jsx)(`span`, {
        className: `text-[10px] text-muted-foreground`,
        children: Nn,
      })),
      (t[187] = Nn),
      (t[188] = Pn));
  let Fn;
  t[189] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Fn = (0, G.jsx)(P, {
        asChild: !0,
        children: (0, G.jsx)(`button`, {
          className: `sm:hidden flex items-center justify-center h-6 w-6 rounded-md text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors`,
          onClick: mt,
          children: (0, G.jsx)(_e, { size: 14 }),
        }),
      })),
      (t[189] = Fn))
    : (Fn = t[189]);
  let In;
  t[190] === mn
    ? (In = t[191])
    : ((In = (0, G.jsxs)(te, {
        children: [Fn, (0, G.jsx)(se, { align: `end`, children: mn })],
      })),
      (t[190] = mn),
      (t[191] = In));
  let Ln;
  t[192] !== Pn || t[193] !== In
    ? ((Ln = (0, G.jsxs)(`div`, {
        className: `flex items-center gap-1`,
        children: [Pn, In],
      })),
      (t[192] = Pn),
      (t[193] = In),
      (t[194] = Ln))
    : (Ln = t[194]);
  let Rn;
  t[195] !== Mn || t[196] !== Ln
    ? ((Rn = (0, G.jsxs)(`div`, {
        className: `flex items-center justify-between mt-1`,
        children: [Mn, Ln],
      })),
      (t[195] = Mn),
      (t[196] = Ln),
      (t[197] = Rn))
    : (Rn = t[197]);
  let zn;
  t[198] !== An || t[199] !== Rn
    ? ((zn = (0, G.jsxs)(w, {
        className: `relative z-[1] space-y-1 px-2.5 py-1.5 pl-3 sm:px-3 sm:py-2 sm:pl-3.5`,
        children: [An, Rn],
      })),
      (t[198] = An),
      (t[199] = Rn),
      (t[200] = zn))
    : (zn = t[200]);
  let Bn;
  t[201] !== A ||
  t[202] !== zn ||
  t[203] !== $ ||
  t[204] !== hn ||
  t[205] !== gn ||
  t[206] !== _n ||
  t[207] !== yn ||
  t[208] !== xn
    ? ((Bn = (0, G.jsxs)(re, {
        className: $,
        onClick: A,
        role: hn,
        tabIndex: gn,
        onKeyDown: _n,
        children: [yn, xn, zn],
      })),
      (t[201] = A),
      (t[202] = zn),
      (t[203] = $),
      (t[204] = hn),
      (t[205] = gn),
      (t[206] = _n),
      (t[207] = yn),
      (t[208] = xn),
      (t[209] = Bn))
    : (Bn = t[209]);
  let Vn = Bn,
    Hn;
  t[210] !== Vn || t[211] !== R
    ? ((Hn = R
        ? (0, G.jsx)(`div`, {
            className: `qt-in-progress-border rounded-lg p-px`,
            children: Vn,
          })
        : Vn),
      (t[210] = Vn),
      (t[211] = R),
      (t[212] = Hn))
    : (Hn = t[212]);
  let Un = Hn,
    Wn;
  t[213] === Un
    ? (Wn = t[214])
    : ((Wn = (0, G.jsx)(ie, { asChild: !0, children: Un })),
      (t[213] = Un),
      (t[214] = Wn));
  let Gn;
  t[215] === Ft
    ? (Gn = t[216])
    : ((Gn = (0, G.jsx)(c, { children: Ft })), (t[215] = Ft), (t[216] = Gn));
  let Kn;
  t[217] !== Wn || t[218] !== Gn
    ? ((Kn = (0, G.jsxs)(_, { children: [Wn, Gn] })),
      (t[217] = Wn),
      (t[218] = Gn),
      (t[219] = Kn))
    : (Kn = t[219]);
  let qn;
  t[220] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((qn = () => Oe(!1)), (t[220] = qn))
    : (qn = t[220]);
  let Jn;
  t[221] !== n || t[222] !== De || t[223] !== r
    ? ((Jn = (0, G.jsx)(ut, {
        open: De,
        onClose: qn,
        taskId: n,
        taskTitle: r,
      })),
      (t[221] = n),
      (t[222] = De),
      (t[223] = r),
      (t[224] = Jn))
    : (Jn = t[224]);
  let Yn;
  t[225] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Yn = () => Ae(null)), (t[225] = Yn))
    : (Yn = t[225]);
  let Xn;
  t[226] !== n || t[227] !== ke || t[228] !== Be || t[229] !== r
    ? ((Xn = (0, G.jsx)(dt, {
        targetId: ke,
        targetAppName: Be,
        onClose: Yn,
        taskId: n,
        taskTitle: r,
      })),
      (t[226] = n),
      (t[227] = ke),
      (t[228] = Be),
      (t[229] = r),
      (t[230] = Xn))
    : (Xn = t[230]);
  let Zn;
  return (
    t[231] !== Kn || t[232] !== Jn || t[233] !== Xn
      ? ((Zn = (0, G.jsxs)(G.Fragment, { children: [Kn, Jn, Xn] })),
        (t[231] = Kn),
        (t[232] = Jn),
        (t[233] = Xn),
        (t[234] = Zn))
      : (Zn = t[234]),
    Zn
  );
}
function mt(e) {
  return e.stopPropagation();
}
function ht(e) {
  return (0, G.jsx)(
    ne,
    {
      variant: `secondary`,
      className: `px-1.5 py-0 text-[10px] font-medium leading-4`,
      children: (0, G.jsxs)(`div`, {
        className: `flex flex-row gap-0.5 items-center`,
        children: [(0, G.jsx)(ze, { size: 10 }), e],
      }),
    },
    e,
  );
}
function gt(e) {
  return e.stopPropagation();
}
function _t() {
  navigator.clipboard.writeText(
    window.location.origin + window.location.pathname,
  );
}
function vt(e) {
  return (0, G.jsx)(E, { value: e._id, children: e.title }, e._id);
}
function yt(e) {
  return (0, G.jsx)(E, { value: e.value, children: e.label }, e.value);
}
function bt(e) {
  return (0, G.jsx)(
    E,
    { value: e._id, children: e.fullName ?? e.firstName ?? `Unknown` },
    e._id,
  );
}
function xt(e) {
  let t = pe[e],
    n = t.icon;
  return (0, G.jsxs)(
    E,
    {
      value: e,
      children: [(0, G.jsx)(n, { size: 16, className: t.text }), t.label],
    },
    e,
  );
}
function St() {
  navigator.clipboard.writeText(
    window.location.origin + window.location.pathname,
  );
}
function Ct(e) {
  return (0, G.jsx)(u, { value: e._id, children: e.title }, e._id);
}
function wt(e) {
  return (0, G.jsx)(u, { value: e.value, children: e.label }, e.value);
}
function Tt(e) {
  return (0, G.jsx)(
    u,
    { value: e._id, children: e.fullName ?? e.firstName ?? `Unknown` },
    e._id,
  );
}
function Et(e) {
  let t = pe[e],
    n = t.icon;
  return (0, G.jsxs)(
    u,
    {
      value: e,
      children: [(0, G.jsx)(n, { size: 16, className: t.text }), t.label],
    },
    e,
  );
}
var Dt = (0, B.createContext)(null);
function Ot() {
  return (0, B.useContext)(Dt)?.defaultOptions ?? {};
}
function K() {
  if (typeof navigator > `u`) return `linux`;
  let e = navigator.platform?.toLowerCase() ?? ``,
    t = navigator.userAgent?.toLowerCase() ?? ``;
  return e.includes(`mac`) || t.includes(`mac`)
    ? `mac`
    : e.includes(`win`) || t.includes(`win`)
      ? `windows`
      : `linux`;
}
var q = [`Control`, `Alt`, `Shift`, `Meta`];
new Set(q);
var kt = {
  Control: `Control`,
  Ctrl: `Control`,
  control: `Control`,
  ctrl: `Control`,
  Shift: `Shift`,
  shift: `Shift`,
  Alt: `Alt`,
  Option: `Alt`,
  alt: `Alt`,
  option: `Alt`,
  Command: `Meta`,
  Cmd: `Meta`,
  Meta: `Meta`,
  command: `Meta`,
  cmd: `Meta`,
  meta: `Meta`,
  CommandOrControl: `Mod`,
  Mod: `Mod`,
  commandorcontrol: `Mod`,
  mod: `Mod`,
};
function At(e, t = K()) {
  return e === `Mod` ? (t === `mac` ? `Meta` : `Control`) : e;
}
var jt = new Set(`ABCDEFGHIJKLMNOPQRSTUVWXYZ`.split(``)),
  Mt = new Set([`0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9`]),
  Nt = new Set([
    `F1`,
    `F2`,
    `F3`,
    `F4`,
    `F5`,
    `F6`,
    `F7`,
    `F8`,
    `F9`,
    `F10`,
    `F11`,
    `F12`,
  ]),
  Pt = new Set([
    `ArrowUp`,
    `ArrowDown`,
    `ArrowLeft`,
    `ArrowRight`,
    `Home`,
    `End`,
    `PageUp`,
    `PageDown`,
  ]),
  Ft = new Set([`Enter`, `Escape`, `Space`, `Tab`, `Backspace`, `Delete`]),
  It = new Set([`/`, `[`, `]`, `\\`, `=`, `-`, `,`, `.`, "`"]);
new Set([...jt, ...Mt, ...Nt, ...Pt, ...Ft, ...It]);
var Lt = {
  Esc: `Escape`,
  esc: `Escape`,
  escape: `Escape`,
  Return: `Enter`,
  return: `Enter`,
  enter: `Enter`,
  " ": `Space`,
  space: `Space`,
  Spacebar: `Space`,
  spacebar: `Space`,
  tab: `Tab`,
  backspace: `Backspace`,
  Del: `Delete`,
  del: `Delete`,
  delete: `Delete`,
  Up: `ArrowUp`,
  up: `ArrowUp`,
  arrowup: `ArrowUp`,
  Down: `ArrowDown`,
  down: `ArrowDown`,
  arrowdown: `ArrowDown`,
  Left: `ArrowLeft`,
  left: `ArrowLeft`,
  arrowleft: `ArrowLeft`,
  Right: `ArrowRight`,
  right: `ArrowRight`,
  arrowright: `ArrowRight`,
  home: `Home`,
  end: `End`,
  pageup: `PageUp`,
  pagedown: `PageDown`,
  PgUp: `PageUp`,
  PgDn: `PageDown`,
  pgup: `PageUp`,
  pgdn: `PageDown`,
};
function J(e) {
  if (e in Lt) return Lt[e];
  if (e.length === 1 && /^[a-zA-Z]$/.test(e)) return e.toUpperCase();
  let t = e.toUpperCase();
  return /^F([1-9]|1[0-2])$/.test(t) ? t : e;
}
function Rt(e, t = K()) {
  let n = e.split(`+`),
    r = new Set(),
    i = ``;
  for (let e = 0; e < n.length; e++) {
    let a = n[e].trim();
    if (e === n.length - 1) i = J(a);
    else {
      let e = kt[a] ?? kt[a.toLowerCase()];
      if (e) {
        let n = At(e, t);
        r.add(n);
      } else n.length === 1 && (i = J(a));
    }
  }
  return (
    !i && n.length > 0 && (i = J(n[n.length - 1].trim())),
    {
      key: i,
      ctrl: r.has(`Control`),
      shift: r.has(`Shift`),
      alt: r.has(`Alt`),
      meta: r.has(`Meta`),
      modifiers: q.filter((e) => r.has(e)),
    }
  );
}
function zt(e, t = K()) {
  let n = e.ctrl ?? !1,
    r = e.shift ?? !1,
    i = e.alt ?? !1,
    a = e.meta ?? !1;
  e.mod && (At(`Mod`, t) === `Control` ? (n = !0) : (a = !0));
  let o = q.filter((e) => {
    switch (e) {
      case `Control`:
        return n;
      case `Shift`:
        return r;
      case `Alt`:
        return i;
      case `Meta`:
        return a;
      default:
        return !1;
    }
  });
  return { key: e.key, ctrl: n, shift: r, alt: i, meta: a, modifiers: o };
}
function Bt(e) {
  let t = [];
  for (let n of q) e.modifiers.includes(n) && t.push(n);
  return (t.push(e.key), t.join(`+`));
}
function Vt(e, t, n = K()) {
  let r = typeof t == `string` ? Rt(t, n) : t;
  if (
    e.ctrlKey !== r.ctrl ||
    e.shiftKey !== r.shift ||
    e.altKey !== r.alt ||
    e.metaKey !== r.meta
  )
    return !1;
  let i = J(e.key),
    a = r.key;
  if (
    i !== `Dead` &&
    i.length === 1 &&
    a.length === 1 &&
    i.toUpperCase() === a.toUpperCase()
  )
    return !0;
  if (i === `Dead` || (i.length === 1 && a.length === 1)) {
    if (e.code?.startsWith(`Key`)) {
      let t = e.code.slice(3);
      if (t.length === 1 && /^[A-Za-z]$/.test(t))
        return t.toUpperCase() === a.toUpperCase();
    }
    if (e.code?.startsWith(`Digit`)) {
      let t = e.code.slice(5);
      if (t.length === 1 && /^[0-9]$/.test(t)) return t === a;
    }
    return !1;
  }
  return i === a;
}
var Ht = {
  preventDefault: !0,
  stopPropagation: !0,
  eventType: `keydown`,
  enabled: !0,
  ignoreInputs: !0,
  conflictBehavior: `warn`,
};
function Ut(e) {
  return !(e.ctrl || e.meta || e.key === `Escape`);
}
function Wt(e) {
  if (!e) return !1;
  if (e instanceof HTMLInputElement) {
    let t = e.type.toLowerCase();
    return !(t === `button` || t === `submit` || t === `reset`);
  }
  return !!(
    e instanceof HTMLTextAreaElement ||
    e instanceof HTMLSelectElement ||
    (e instanceof HTMLElement && e.isContentEditable)
  );
}
function Gt(e, t) {
  return t === document || t === window
    ? e.currentTarget === t || e.currentTarget === document.documentElement
    : t === window
      ? e.currentTarget === window ||
        e.currentTarget === document ||
        e.currentTarget === document.documentElement
      : !!(
          t instanceof HTMLElement &&
          (e.currentTarget === t ||
            (e.target instanceof Node && t.contains(e.target)))
        );
}
function Kt(e, t, n, r) {
  if (n !== `allow`) {
    if (n === `warn`) {
      console.warn(
        `'${t}' is already registered. Multiple handlers will be triggered. Use conflictBehavior: 'replace' to replace the existing handler, or conflictBehavior: 'allow' to suppress this warning.`,
      );
      return;
    }
    if (n === `error`)
      throw Error(
        `'${t}' is already registered. Use conflictBehavior: 'replace' to replace the existing handler, or conflictBehavior: 'allow' to allow multiple registrations.`,
      );
    r(e);
  }
}
var Y = ((e) => (
  (e[(e.None = 0)] = `None`),
  (e[(e.Mutable = 1)] = `Mutable`),
  (e[(e.Watching = 2)] = `Watching`),
  (e[(e.RecursedCheck = 4)] = `RecursedCheck`),
  (e[(e.Recursed = 8)] = `Recursed`),
  (e[(e.Dirty = 16)] = `Dirty`),
  (e[(e.Pending = 32)] = `Pending`),
  e
))(Y || {});
function qt({ update: e, notify: t, unwatched: n }) {
  return {
    link: r,
    unlink: i,
    propagate: a,
    checkDirty: o,
    shallowPropagate: s,
  };
  function r(e, t, n) {
    let r = t.depsTail;
    if (r !== void 0 && r.dep === e) return;
    let i = r === void 0 ? t.deps : r.nextDep;
    if (i !== void 0 && i.dep === e) {
      ((i.version = n), (t.depsTail = i));
      return;
    }
    let a = e.subsTail;
    if (a !== void 0 && a.version === n && a.sub === t) return;
    let o =
      (t.depsTail =
      e.subsTail =
        {
          version: n,
          dep: e,
          sub: t,
          prevDep: r,
          nextDep: i,
          prevSub: a,
          nextSub: void 0,
        });
    (i !== void 0 && (i.prevDep = o),
      r === void 0 ? (t.deps = o) : (r.nextDep = o),
      a === void 0 ? (e.subs = o) : (a.nextSub = o));
  }
  function i(e, t = e.sub) {
    let r = e.dep,
      i = e.prevDep,
      a = e.nextDep,
      o = e.nextSub,
      s = e.prevSub;
    return (
      a === void 0 ? (t.depsTail = i) : (a.prevDep = i),
      i === void 0 ? (t.deps = a) : (i.nextDep = a),
      o === void 0 ? (r.subsTail = s) : (o.prevSub = s),
      s === void 0 ? (r.subs = o) === void 0 && n(r) : (s.nextSub = o),
      a
    );
  }
  function a(e) {
    let n = e.nextSub,
      r;
    top: do {
      let i = e.sub,
        a = i.flags;
      if (
        (a & 60
          ? a & 12
            ? a & 4
              ? !(a & 48) && c(e, i)
                ? ((i.flags = a | 40), (a &= 1))
                : (a = 0)
              : (i.flags = (a & -9) | 32)
            : (a = 0)
          : (i.flags = a | 32),
        a & 2 && t(i),
        a & 1)
      ) {
        let t = i.subs;
        if (t !== void 0) {
          let i = (e = t).nextSub;
          i !== void 0 && ((r = { value: n, prev: r }), (n = i));
          continue;
        }
      }
      if ((e = n) !== void 0) {
        n = e.nextSub;
        continue;
      }
      for (; r !== void 0; )
        if (((e = r.value), (r = r.prev), e !== void 0)) {
          n = e.nextSub;
          continue top;
        }
      break;
    } while (!0);
  }
  function o(t, n) {
    let r,
      i = 0,
      a = !1;
    top: do {
      let o = t.dep,
        c = o.flags;
      if (n.flags & 16) a = !0;
      else if ((c & 17) == 17) {
        if (e(o)) {
          let e = o.subs;
          (e.nextSub !== void 0 && s(e), (a = !0));
        }
      } else if ((c & 33) == 33) {
        ((t.nextSub !== void 0 || t.prevSub !== void 0) &&
          (r = { value: t, prev: r }),
          (t = o.deps),
          (n = o),
          ++i);
        continue;
      }
      if (!a) {
        let e = t.nextDep;
        if (e !== void 0) {
          t = e;
          continue;
        }
      }
      for (; i--; ) {
        let i = n.subs,
          o = i.nextSub !== void 0;
        if ((o ? ((t = r.value), (r = r.prev)) : (t = i), a)) {
          if (e(n)) {
            (o && s(i), (n = t.sub));
            continue;
          }
          a = !1;
        } else n.flags &= -33;
        n = t.sub;
        let c = t.nextDep;
        if (c !== void 0) {
          t = c;
          continue top;
        }
      }
      return a;
    } while (!0);
  }
  function s(e) {
    do {
      let n = e.sub,
        r = n.flags;
      (r & 48) == 32 && ((n.flags = r | 16), (r & 6) == 2 && t(n));
    } while ((e = e.nextSub) !== void 0);
  }
  function c(e, t) {
    let n = t.depsTail;
    for (; n !== void 0; ) {
      if (n === e) return !0;
      n = n.prevDep;
    }
    return !1;
  }
}
var Jt = 0,
  Yt = 0,
  Xt = [],
  {
    link: Zt,
    unlink: Qt,
    propagate: $t,
    checkDirty: en,
    shallowPropagate: tn,
  } = qt({
    update(e) {
      return e.depsTail === void 0 ? an(e) : rn(e);
    },
    notify(e) {
      let t = Yt,
        n = t;
      do
        if (
          ((Xt[t++] = e),
          (e.flags &= -3),
          (e = e.subs?.sub),
          e === void 0 || !(e.flags & 2))
        )
          break;
      while (!0);
      for (Yt = t; n < --t; ) {
        let e = Xt[n];
        ((Xt[n++] = Xt[t]), (Xt[t] = e));
      }
    },
    unwatched(e) {
      e.flags & 1
        ? e.depsTail !== void 0 && ((e.depsTail = void 0), (e.flags = 17), X(e))
        : on.call(e);
    },
  });
function nn() {
  return Jt;
}
function rn(e) {
  ((e.depsTail = void 0), (e.flags = 5));
  try {
    let t = e.value;
    return t !== (e.value = e.getter(t));
  } finally {
    ((e.flags &= -5), X(e));
  }
}
function an(e) {
  return ((e.flags = 1), e.currentValue !== (e.currentValue = e.pendingValue));
}
function on() {
  ((this.depsTail = void 0), (this.flags = 0), X(this));
  let e = this.subs;
  e !== void 0 && Qt(e);
}
function X(e) {
  let t = e.depsTail,
    n = t === void 0 ? e.deps : t.nextDep;
  for (; n !== void 0; ) n = Qt(n, e);
}
function sn(e, t, n) {
  let r = typeof e == `object`,
    i = r ? e : void 0;
  return {
    next: (r ? e.next : e)?.bind(i),
    error: (r ? e.error : t)?.bind(i),
    complete: (r ? e.complete : n)?.bind(i),
  };
}
var Z = [],
  Q = 0,
  {
    link: cn,
    unlink: ln,
    propagate: un,
    checkDirty: dn,
    shallowPropagate: fn,
  } = qt({
    update(e) {
      return e._update();
    },
    notify(e) {
      ((Z[mn++] = e), (e.flags &= ~Y.Watching));
    },
    unwatched(e) {
      e.depsTail !== void 0 &&
        ((e.depsTail = void 0), (e.flags = Y.Mutable | Y.Dirty), hn(e));
    },
  }),
  pn = 0,
  mn = 0,
  $;
function hn(e) {
  let t = e.depsTail,
    n = t === void 0 ? e.deps : t.nextDep;
  for (; n !== void 0; ) n = ln(n, e);
}
function gn() {
  if (!(nn() > 0)) {
    for (; pn < mn; ) {
      let e = Z[pn];
      ((Z[pn++] = void 0), e.notify());
    }
    ((pn = 0), (mn = 0));
  }
}
function _n(e, t) {
  let n = typeof e == `function`,
    r = e,
    i = {
      _snapshot: n ? void 0 : e,
      subs: void 0,
      subsTail: void 0,
      deps: void 0,
      depsTail: void 0,
      flags: n ? Y.None : Y.Mutable,
      get() {
        return ($ !== void 0 && cn(i, $, Q), i._snapshot);
      },
      subscribe(e) {
        let t = sn(e),
          n = { current: !1 },
          r = vn(() => {
            (i.get(), n.current ? t.next?.(i._snapshot) : (n.current = !0));
          });
        return {
          unsubscribe: () => {
            r.stop();
          },
        };
      },
      _update(e) {
        let a = $,
          o = t?.compare ?? Object.is;
        (($ = i),
          ++Q,
          (i.depsTail = void 0),
          n && (i.flags = Y.Mutable | Y.RecursedCheck));
        try {
          let t = i._snapshot,
            a = typeof e == `function` ? e(t) : e === void 0 && n ? r(t) : e;
          return t === void 0 || !o(t, a) ? ((i._snapshot = a), !0) : !1;
        } finally {
          (($ = a), n && (i.flags &= ~Y.RecursedCheck), hn(i));
        }
      },
    };
  return (
    n
      ? ((i.flags = Y.Mutable | Y.Dirty),
        (i.get = function () {
          let e = i.flags;
          if (e & Y.Dirty || (e & Y.Pending && dn(i.deps, i))) {
            if (i._update()) {
              let e = i.subs;
              e !== void 0 && fn(e);
            }
          } else e & Y.Pending && (i.flags = e & ~Y.Pending);
          return ($ !== void 0 && cn(i, $, Q), i._snapshot);
        }))
      : (i.set = function (e) {
          if (i._update(e)) {
            let e = i.subs;
            e !== void 0 && (un(e), fn(e), gn());
          }
        }),
    i
  );
}
function vn(e) {
  let t = () => {
      let t = $;
      (($ = n),
        ++Q,
        (n.depsTail = void 0),
        (n.flags = Y.Watching | Y.RecursedCheck));
      try {
        return e();
      } finally {
        (($ = t), (n.flags &= ~Y.RecursedCheck), hn(n));
      }
    },
    n = {
      deps: void 0,
      depsTail: void 0,
      subs: void 0,
      subsTail: void 0,
      flags: Y.Watching | Y.RecursedCheck,
      notify() {
        let e = this.flags;
        e & Y.Dirty || (e & Y.Pending && dn(this.deps, this))
          ? t()
          : (this.flags = Y.Watching);
      },
      stop() {
        ((this.flags = Y.None), (this.depsTail = void 0), hn(this));
      },
    };
  return (t(), n);
}
var yn = class {
    constructor(e) {
      this.atom = _n(e);
    }
    setState(e) {
      this.atom.set(e);
    }
    get state() {
      return this.atom.get();
    }
    get() {
      return this.state;
    }
    subscribe(e) {
      return this.atom.subscribe(sn(e));
    }
  },
  bn = 0;
function xn() {
  return `hotkey_${++bn}`;
}
var Sn = class e {
  static #e = null;
  #t;
  #n = new Map();
  #r = new Map();
  constructor() {
    ((this.registrations = new yn(new Map())), (this.#t = K()));
  }
  static getInstance() {
    return ((e.#e ||= new e()), e.#e);
  }
  static resetInstance() {
    e.#e &&= (e.#e.destroy(), null);
  }
  register(e, t, n = {}) {
    if (typeof document > `u` && !n.target) {
      let e = t;
      return {
        id: xn(),
        unregister: () => {},
        get callback() {
          return e;
        },
        set callback(t) {
          e = t;
        },
        setOptions: () => {},
        get isActive() {
          return !1;
        },
      };
    }
    let r = xn(),
      i = n.platform ?? this.#t,
      a = typeof e == `string` ? Rt(e, i) : zt(e, i),
      o = typeof e == `string` ? e : Bt(a),
      s = n.target ?? document,
      c = n.conflictBehavior ?? `warn`,
      l = this.#d(o, s);
    l && Kt(l.id, o, c, (e) => this.#i(e));
    let u = n.ignoreInputs ?? Ut(a),
      d = {
        id: r,
        hotkey: o,
        parsedHotkey: a,
        callback: t,
        options: {
          ...Ht,
          requireReset: !1,
          ...n,
          platform: i,
          ignoreInputs: u,
        },
        hasFired: !1,
        triggerCount: 0,
        target: s,
      };
    (this.registrations.setState((e) => new Map(e).set(r, d)),
      this.#r.has(s) || this.#r.set(s, new Set()),
      this.#r.get(s).add(r),
      this.#a(s));
    let f = this;
    return {
      get id() {
        return r;
      },
      unregister: () => {
        f.#i(r);
      },
      get callback() {
        return f.registrations.state.get(r)?.callback ?? t;
      },
      set callback(e) {
        let t = f.registrations.state.get(r);
        t && (t.callback = e);
      },
      setOptions: (e) => {
        f.registrations.setState((t) => {
          let n = t.get(r);
          if (n) {
            let i = new Map(t);
            return (i.set(r, { ...n, options: { ...n.options, ...e } }), i);
          }
          return t;
        });
      },
      get isActive() {
        return f.registrations.state.has(r);
      },
    };
  }
  #i(e) {
    let t = this.registrations.state.get(e);
    if (!t) return;
    let n = t.target;
    this.registrations.setState((t) => {
      let n = new Map(t);
      return (n.delete(e), n);
    });
    let r = this.#r.get(n);
    r && (r.delete(e), r.size === 0 && this.#o(n));
  }
  #a(e) {
    if (typeof document > `u` || this.#n.has(e)) return;
    let t = this.#l(e),
      n = this.#u(e);
    (e.addEventListener(`keydown`, t),
      e.addEventListener(`keyup`, n),
      this.#n.set(e, { keydown: t, keyup: n }));
  }
  #o(e) {
    if (typeof document > `u`) return;
    let t = this.#n.get(e);
    t &&
      (e.removeEventListener(`keydown`, t.keydown),
      e.removeEventListener(`keyup`, t.keyup),
      this.#n.delete(e),
      this.#r.delete(e));
  }
  #s(e, t, n) {
    let r = this.#r.get(t);
    if (r)
      for (let i of r) {
        let r = this.registrations.state.get(i);
        if (
          r &&
          Gt(e, t) &&
          r.options.enabled &&
          !(
            r.options.ignoreInputs !== !1 &&
            Wt(e.target) &&
            e.target !== r.target
          )
        )
          if (n === `keydown`) {
            if (r.options.eventType !== `keydown`) continue;
            Vt(e, r.parsedHotkey, r.options.platform) &&
              (r.options.preventDefault && e.preventDefault(),
              r.options.stopPropagation && e.stopPropagation(),
              (!r.options.requireReset || !r.hasFired) &&
                (this.#c(r, e), r.options.requireReset && (r.hasFired = !0)));
          } else
            (r.options.eventType === `keyup` &&
              Vt(e, r.parsedHotkey, r.options.platform) &&
              this.#c(r, e),
              r.options.requireReset &&
                r.hasFired &&
                this.#f(r, e) &&
                (r.hasFired = !1));
      }
  }
  #c(e, t) {
    (e.options.preventDefault && t.preventDefault(),
      e.options.stopPropagation && t.stopPropagation(),
      e.triggerCount++,
      this.registrations.setState((e) => new Map(e)));
    let n = { hotkey: e.hotkey, parsedHotkey: e.parsedHotkey };
    e.callback(t, n);
  }
  #l(e) {
    return (t) => {
      this.#s(t, e, `keydown`);
    };
  }
  #u(e) {
    return (t) => {
      this.#s(t, e, `keyup`);
    };
  }
  #d(e, t) {
    for (let n of this.registrations.state.values())
      if (n.hotkey === e && n.target === t) return n;
    return null;
  }
  #f(e, t) {
    let n = e.parsedHotkey,
      r = J(t.key),
      i = n.key.length === 1 ? n.key.toUpperCase() : n.key;
    return !!(
      (r.length === 1 ? r.toUpperCase() : r) === i ||
      (n.ctrl && r === `Control`) ||
      (n.shift && r === `Shift`) ||
      (n.alt && r === `Alt`) ||
      (n.meta && r === `Meta`)
    );
  }
  triggerRegistration(e) {
    let t = this.registrations.state.get(e);
    if (!t) return !1;
    let n = t.parsedHotkey,
      r = new KeyboardEvent(t.options.eventType ?? `keydown`, {
        key: n.key,
        ctrlKey: n.ctrl,
        shiftKey: n.shift,
        altKey: n.alt,
        metaKey: n.meta,
        bubbles: !0,
        cancelable: !0,
      });
    return (
      t.triggerCount++,
      this.registrations.setState((e) => new Map(e)),
      t.callback(r, { hotkey: t.hotkey, parsedHotkey: t.parsedHotkey }),
      !0
    );
  }
  getRegistrationCount() {
    return this.registrations.state.size;
  }
  isRegistered(e, t) {
    for (let n of this.registrations.state.values())
      if (n.hotkey === e && (t === void 0 || n.target === t)) return !0;
    return !1;
  }
  destroy() {
    for (let e of this.#n.keys()) this.#o(e);
    (this.registrations.setState(() => new Map()),
      this.#n.clear(),
      this.#r.clear());
  }
};
function Cn() {
  return Sn.getInstance();
}
function wn(e, t, n = {}) {
  let r = { ...Ot().hotkey, ...n },
    i = Cn(),
    a = (0, B.useRef)(null),
    o = (0, B.useRef)(t),
    s = (0, B.useRef)(r),
    c = (0, B.useRef)(i);
  ((o.current = t), (s.current = r), (c.current = i));
  let l = (0, B.useRef)(null),
    u = (0, B.useRef)(null),
    d = r.platform ?? K(),
    f = typeof e == `string` ? e : Bt(zt(e, d)),
    { target: p, ...m } = r;
  ((0, B.useEffect)(() => {
    let e = Tn(s.current.target)
      ? s.current.target.current
      : (s.current.target ?? (typeof document < `u` ? document : null));
    if (!e) return;
    let t = l.current !== null && l.current !== e,
      n = u.current !== null && u.current !== f;
    return (
      a.current?.isActive &&
        (t || n) &&
        (a.current.unregister(), (a.current = null)),
      (!a.current || !a.current.isActive) &&
        (a.current = c.current.register(f, o.current, {
          ...s.current,
          target: e,
        })),
      (l.current = e),
      (u.current = f),
      () => {
        a.current?.isActive && (a.current.unregister(), (a.current = null));
      }
    );
  }, [f, n.enabled]),
    a.current?.isActive && ((a.current.callback = t), a.current.setOptions(m)));
}
function Tn(e) {
  return typeof e == `object` && !!e && `current` in e;
}
function En({ isOpen: e, onClose: t, projectId: n }) {
  let { repo: r } = Ie(),
    s = r.defaultBaseBranch ?? `main`,
    [c, l] = (0, B.useState)(``),
    [u, d] = (0, B.useState)(``),
    [m, g] = (0, B.useState)(s),
    [_, v] = (0, B.useState)(!1),
    [x, S] = (0, B.useState)(null),
    [C, w] = (0, B.useState)(null),
    T = i(a.agentTasks.createQuickTask),
    te = i(a.agentTasks.saveDraft),
    ne = i(a.agentTasks.activateDraft),
    E = i(a.agentTasks.remove),
    D = o(a.agentTasks.listDrafts, { repoId: r._id }),
    re = c.trim() || u.trim(),
    ie = (0, B.useCallback)(() => {
      (l(``), d(``), g(s), S(null));
    }, [s]),
    O = (0, B.useCallback)(async () => {
      (re &&
        (await te({
          id: x ?? void 0,
          repoId: r._id,
          title: c.trim() || void 0,
          description: u.trim() || void 0,
          baseBranch: m,
          projectId: n,
        })),
        ie(),
        t());
    }, [re, te, x, r._id, c, u, m, n, ie, t]),
    ae = async () => {
      if (!(!c.trim() || !m || !r)) {
        v(!0);
        try {
          (x
            ? await ne({
                id: x,
                title: c.trim(),
                description: u.trim() || void 0,
                baseBranch: m,
                model: r.defaultModel,
              })
            : await T({
                repoId: r._id,
                title: c.trim(),
                description: u.trim() || void 0,
                baseBranch: m,
                model: r.defaultModel,
                projectId: n,
              }),
            ie(),
            t());
        } finally {
          v(!1);
        }
      }
    },
    se = (e) => {
      (l(e.title ?? ``),
        d(e.description ?? ``),
        g(e.baseBranch ?? s),
        S(e._id));
    },
    M = async (e) => {
      (await E({ id: e }), w(null), x === e && ie());
    },
    N = !_ && !!c.trim() && !!m;
  return (
    wn(
      `Mod+Enter`,
      (e) => {
        (e.preventDefault(), N && ae());
      },
      { enabled: e },
    ),
    (0, G.jsx)(h, {
      open: e,
      onOpenChange: (e) => {
        e || O();
      },
      children: (0, G.jsxs)(b, {
        children: [
          (0, G.jsx)(ee, {
            children: (0, G.jsx)(f, {
              children: x ? `Continue Draft` : `New Quick Task`,
            }),
          }),
          (0, G.jsxs)(`div`, {
            className: `space-y-4`,
            children: [
              (0, G.jsx)(ce, {
                placeholder: `What needs to be done?`,
                value: c,
                onChange: (e) => l(e.target.value),
                autoFocus: !0,
              }),
              (0, G.jsx)(k, {
                placeholder: `Add more details (optional)`,
                value: u,
                onChange: (e) => d(e.target.value),
                rows: 6,
                className: `min-h-[120px] max-h-[50vh] sm:min-h-[200px]`,
              }),
              (0, G.jsx)(z, {
                value: m,
                onValueChange: g,
                placeholder: `Select a base branch`,
                className: `h-10`,
              }),
            ],
          }),
          (0, G.jsxs)(y, {
            className: `flex-col-reverse gap-2 sm:flex-row sm:justify-between`,
            children: [
              (0, G.jsx)(`div`, {
                children:
                  D &&
                  D.length > 0 &&
                  (0, G.jsxs)(le, {
                    children: [
                      (0, G.jsx)(A, {
                        asChild: !0,
                        children: (0, G.jsxs)(j, {
                          variant: `ghost`,
                          size: `sm`,
                          children: [
                            (0, G.jsx)(ve, { size: 16 }),
                            `Drafts (`,
                            D.length,
                            `)`,
                          ],
                        }),
                      }),
                      (0, G.jsxs)(oe, {
                        align: `start`,
                        className: `w-72 p-0`,
                        children: [
                          (0, G.jsx)(`div`, {
                            className: `px-3 py-2 border-b border-border`,
                            children: (0, G.jsx)(`p`, {
                              className: `text-sm font-medium`,
                              children: `Saved Drafts`,
                            }),
                          }),
                          (0, G.jsx)(`div`, {
                            className: `max-h-56 overflow-y-auto`,
                            children: D.map((e) =>
                              (0, G.jsx)(
                                `div`,
                                {
                                  children:
                                    C === e._id
                                      ? (0, G.jsxs)(`div`, {
                                          className: `flex items-center justify-between gap-2 px-3 py-2 text-sm bg-destructive/5`,
                                          children: [
                                            (0, G.jsx)(`span`, {
                                              className: `text-destructive truncate`,
                                              children: `Delete draft?`,
                                            }),
                                            (0, G.jsxs)(`div`, {
                                              className: `flex gap-1 shrink-0`,
                                              children: [
                                                (0, G.jsx)(j, {
                                                  variant: `ghost`,
                                                  size: `sm`,
                                                  className: `h-6 px-2 text-xs`,
                                                  onClick: () => w(null),
                                                  children: `Cancel`,
                                                }),
                                                (0, G.jsx)(j, {
                                                  variant: `destructive`,
                                                  size: `sm`,
                                                  className: `h-6 px-2 text-xs`,
                                                  onClick: () => M(e._id),
                                                  children: `Delete`,
                                                }),
                                              ],
                                            }),
                                          ],
                                        })
                                      : (0, G.jsxs)(`div`, {
                                          role: `button`,
                                          tabIndex: 0,
                                          className: `flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-accent transition-colors group cursor-pointer`,
                                          onClick: () => se(e),
                                          onKeyDown: (t) => {
                                            (t.key === `Enter` ||
                                              t.key === ` `) &&
                                              se(e);
                                          },
                                          children: [
                                            (0, G.jsx)(`span`, {
                                              className: `flex-1 truncate`,
                                              children:
                                                e.title ||
                                                (0, G.jsx)(`span`, {
                                                  className: `text-muted-foreground italic`,
                                                  children: `Untitled`,
                                                }),
                                            }),
                                            (0, G.jsx)(`button`, {
                                              className: `opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-destructive/10 hover:text-destructive transition-all`,
                                              onClick: (t) => {
                                                (t.stopPropagation(), w(e._id));
                                              },
                                              children: (0, G.jsx)(je, {
                                                size: 14,
                                              }),
                                            }),
                                          ],
                                        }),
                                },
                                e._id,
                              ),
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
              }),
              (0, G.jsxs)(`div`, {
                className: `flex gap-2`,
                children: [
                  (0, G.jsx)(j, {
                    variant: `secondary`,
                    onClick: O,
                    children: `Cancel`,
                  }),
                  (0, G.jsxs)(j, {
                    onClick: ae,
                    disabled: !N,
                    children: [
                      _ && (0, G.jsx)(p, { size: `sm` }),
                      `Create Task`,
                      (0, G.jsx)(`kbd`, {
                        className: `ml-1.5 text-xs opacity-60`,
                        children: `⌘↵`,
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    })
  );
}
export {
  Be as a,
  We as c,
  Je as i,
  wn as n,
  at as o,
  pt as r,
  nt as s,
  En as t,
};
