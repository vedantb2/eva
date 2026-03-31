import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { n as r } from "./shim-DlYA1Ap9.js";
import { T as i } from "./index-DSqEo2z3.js";
import { Tr as a, dr as o } from "./src-DzioQSsH.js";
import { t as s } from "./createReactComponent-C2GWxX5y.js";
import { t as c } from "./IconCircleCheck-DfkWjjtD.js";
import { i as l } from "./TaskStatusBadge-pvqpdmz8.js";
import { t as u } from "./IconClock-BRHjI4rV.js";
var d = s(`outline`, `notes`, `Notes`, [
    [
      `path`,
      {
        d: `M5 5a2 2 0 0 1 2 -2h10a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2l0 -14`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M9 7l6 0`, key: `svg-1` }],
    [`path`, { d: `M9 11l6 0`, key: `svg-2` }],
    [`path`, { d: `M9 15l4 0`, key: `svg-3` }],
  ]),
  f = e(t());
function p() {
  var e = [...arguments];
  return (0, f.useMemo)(
    () => (t) => {
      e.forEach((e) => e(t));
    },
    e,
  );
}
var m =
  typeof window < `u` &&
  window.document !== void 0 &&
  window.document.createElement !== void 0;
function h(e) {
  let t = Object.prototype.toString.call(e);
  return t === `[object Window]` || t === `[object global]`;
}
function g(e) {
  return `nodeType` in e;
}
function _(e) {
  return e
    ? h(e)
      ? e
      : g(e)
        ? (e.ownerDocument?.defaultView ?? window)
        : window
    : window;
}
function v(e) {
  let { Document: t } = _(e);
  return e instanceof t;
}
function y(e) {
  return h(e) ? !1 : e instanceof _(e).HTMLElement;
}
function b(e) {
  return e instanceof _(e).SVGElement;
}
function x(e) {
  return e
    ? h(e)
      ? e.document
      : g(e)
        ? v(e)
          ? e
          : y(e) || b(e)
            ? e.ownerDocument
            : document
        : document
    : document;
}
var S = m ? f.useLayoutEffect : f.useEffect;
function C(e) {
  let t = (0, f.useRef)(e);
  return (
    S(() => {
      t.current = e;
    }),
    (0, f.useCallback)(function () {
      var e = [...arguments];
      return t.current == null ? void 0 : t.current(...e);
    }, [])
  );
}
function w() {
  let e = (0, f.useRef)(null);
  return [
    (0, f.useCallback)((t, n) => {
      e.current = setInterval(t, n);
    }, []),
    (0, f.useCallback)(() => {
      e.current !== null && (clearInterval(e.current), (e.current = null));
    }, []),
  ];
}
function T(e, t) {
  t === void 0 && (t = [e]);
  let n = (0, f.useRef)(e);
  return (
    S(() => {
      n.current !== e && (n.current = e);
    }, t),
    n
  );
}
function E(e, t) {
  let n = (0, f.useRef)();
  return (0, f.useMemo)(() => {
    let t = e(n.current);
    return ((n.current = t), t);
  }, [...t]);
}
function D(e) {
  let t = C(e),
    n = (0, f.useRef)(null);
  return [
    n,
    (0, f.useCallback)((e) => {
      (e !== n.current && t?.(e, n.current), (n.current = e));
    }, []),
  ];
}
function O(e) {
  let t = (0, f.useRef)();
  return (
    (0, f.useEffect)(() => {
      t.current = e;
    }, [e]),
    t.current
  );
}
var ee = {};
function te(e, t) {
  return (0, f.useMemo)(() => {
    if (t) return t;
    let n = ee[e] == null ? 0 : ee[e] + 1;
    return ((ee[e] = n), e + `-` + n);
  }, [e, t]);
}
function ne(e) {
  return function (t) {
    return [...arguments].slice(1).reduce(
      (t, n) => {
        let r = Object.entries(n);
        for (let [n, i] of r) {
          let r = t[n];
          r != null && (t[n] = r + e * i);
        }
        return t;
      },
      { ...t },
    );
  };
}
var k = ne(1),
  A = ne(-1);
function re(e) {
  return `clientX` in e && `clientY` in e;
}
function j(e) {
  if (!e) return !1;
  let { KeyboardEvent: t } = _(e.target);
  return t && e instanceof t;
}
function ie(e) {
  if (!e) return !1;
  let { TouchEvent: t } = _(e.target);
  return t && e instanceof t;
}
function ae(e) {
  if (ie(e)) {
    if (e.touches && e.touches.length) {
      let { clientX: t, clientY: n } = e.touches[0];
      return { x: t, y: n };
    } else if (e.changedTouches && e.changedTouches.length) {
      let { clientX: t, clientY: n } = e.changedTouches[0];
      return { x: t, y: n };
    }
  }
  return re(e) ? { x: e.clientX, y: e.clientY } : null;
}
var M = Object.freeze({
    Translate: {
      toString(e) {
        if (!e) return;
        let { x: t, y: n } = e;
        return (
          `translate3d(` +
          (t ? Math.round(t) : 0) +
          `px, ` +
          (n ? Math.round(n) : 0) +
          `px, 0)`
        );
      },
    },
    Scale: {
      toString(e) {
        if (!e) return;
        let { scaleX: t, scaleY: n } = e;
        return `scaleX(` + t + `) scaleY(` + n + `)`;
      },
    },
    Transform: {
      toString(e) {
        if (e) return [M.Translate.toString(e), M.Scale.toString(e)].join(` `);
      },
    },
    Transition: {
      toString(e) {
        let { property: t, duration: n, easing: r } = e;
        return t + ` ` + n + `ms ` + r;
      },
    },
  }),
  N = `a,frame,iframe,input:not([type=hidden]):not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),*[tabindex]`;
function P(e) {
  return e.matches(N) ? e : e.querySelector(N);
}
var oe = { display: `none` };
function se(e) {
  let { id: t, value: n } = e;
  return f.createElement(`div`, { id: t, style: oe }, n);
}
function F(e) {
  let { id: t, announcement: n, ariaLiveType: r = `assertive` } = e;
  return f.createElement(
    `div`,
    {
      id: t,
      style: {
        position: `fixed`,
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        margin: -1,
        border: 0,
        padding: 0,
        overflow: `hidden`,
        clip: `rect(0 0 0 0)`,
        clipPath: `inset(100%)`,
        whiteSpace: `nowrap`,
      },
      role: `status`,
      "aria-live": r,
      "aria-atomic": !0,
    },
    n,
  );
}
function ce() {
  let [e, t] = (0, f.useState)(``);
  return {
    announce: (0, f.useCallback)((e) => {
      e != null && t(e);
    }, []),
    announcement: e,
  };
}
var le = e(r()),
  ue = (0, f.createContext)(null);
function de(e) {
  let t = (0, f.useContext)(ue);
  (0, f.useEffect)(() => {
    if (!t)
      throw Error(
        `useDndMonitor must be used within a children of <DndContext>`,
      );
    return t(e);
  }, [e, t]);
}
function fe() {
  let [e] = (0, f.useState)(() => new Set()),
    t = (0, f.useCallback)((t) => (e.add(t), () => e.delete(t)), [e]);
  return [
    (0, f.useCallback)(
      (t) => {
        let { type: n, event: r } = t;
        e.forEach((e) => e[n]?.call(e, r));
      },
      [e],
    ),
    t,
  ];
}
var pe = {
    draggable: `
    To pick up a draggable item, press the space bar.
    While dragging, use the arrow keys to move the item.
    Press space again to drop the item in its new position, or press escape to cancel.
  `,
  },
  I = {
    onDragStart(e) {
      let { active: t } = e;
      return `Picked up draggable item ` + t.id + `.`;
    },
    onDragOver(e) {
      let { active: t, over: n } = e;
      return n
        ? `Draggable item ` +
            t.id +
            ` was moved over droppable area ` +
            n.id +
            `.`
        : `Draggable item ` + t.id + ` is no longer over a droppable area.`;
    },
    onDragEnd(e) {
      let { active: t, over: n } = e;
      return n
        ? `Draggable item ` + t.id + ` was dropped over droppable area ` + n.id
        : `Draggable item ` + t.id + ` was dropped.`;
    },
    onDragCancel(e) {
      let { active: t } = e;
      return `Dragging was cancelled. Draggable item ` + t.id + ` was dropped.`;
    },
  };
function me(e) {
  let {
      announcements: t = I,
      container: n,
      hiddenTextDescribedById: r,
      screenReaderInstructions: i = pe,
    } = e,
    { announce: a, announcement: o } = ce(),
    s = te(`DndLiveRegion`),
    [c, l] = (0, f.useState)(!1);
  if (
    ((0, f.useEffect)(() => {
      l(!0);
    }, []),
    de(
      (0, f.useMemo)(
        () => ({
          onDragStart(e) {
            let { active: n } = e;
            a(t.onDragStart({ active: n }));
          },
          onDragMove(e) {
            let { active: n, over: r } = e;
            t.onDragMove && a(t.onDragMove({ active: n, over: r }));
          },
          onDragOver(e) {
            let { active: n, over: r } = e;
            a(t.onDragOver({ active: n, over: r }));
          },
          onDragEnd(e) {
            let { active: n, over: r } = e;
            a(t.onDragEnd({ active: n, over: r }));
          },
          onDragCancel(e) {
            let { active: n, over: r } = e;
            a(t.onDragCancel({ active: n, over: r }));
          },
        }),
        [a, t],
      ),
    ),
    !c)
  )
    return null;
  let u = f.createElement(
    f.Fragment,
    null,
    f.createElement(se, { id: r, value: i.draggable }),
    f.createElement(F, { id: s, announcement: o }),
  );
  return n ? (0, le.createPortal)(u, n) : u;
}
var L;
(function (e) {
  ((e.DragStart = `dragStart`),
    (e.DragMove = `dragMove`),
    (e.DragEnd = `dragEnd`),
    (e.DragCancel = `dragCancel`),
    (e.DragOver = `dragOver`),
    (e.RegisterDroppable = `registerDroppable`),
    (e.SetDroppableDisabled = `setDroppableDisabled`),
    (e.UnregisterDroppable = `unregisterDroppable`));
})((L ||= {}));
function R() {}
function z(e, t) {
  return (0, f.useMemo)(() => ({ sensor: e, options: t ?? {} }), [e, t]);
}
function he() {
  var e = [...arguments];
  return (0, f.useMemo)(() => [...e].filter((e) => e != null), [...e]);
}
var B = Object.freeze({ x: 0, y: 0 });
function V(e, t) {
  return Math.sqrt((e.x - t.x) ** 2 + (e.y - t.y) ** 2);
}
function H(e, t) {
  let n = ae(e);
  if (!n) return `0 0`;
  let r = {
    x: ((n.x - t.left) / t.width) * 100,
    y: ((n.y - t.top) / t.height) * 100,
  };
  return r.x + `% ` + r.y + `%`;
}
function ge(e, t) {
  let {
      data: { value: n },
    } = e,
    {
      data: { value: r },
    } = t;
  return n - r;
}
function _e(e, t) {
  let {
      data: { value: n },
    } = e,
    {
      data: { value: r },
    } = t;
  return r - n;
}
function U(e) {
  let { left: t, top: n, height: r, width: i } = e;
  return [
    { x: t, y: n },
    { x: t + i, y: n },
    { x: t, y: n + r },
    { x: t + i, y: n + r },
  ];
}
function ve(e, t) {
  if (!e || e.length === 0) return null;
  let [n] = e;
  return t ? n[t] : n;
}
function W(e, t, n) {
  return (
    t === void 0 && (t = e.left),
    n === void 0 && (n = e.top),
    { x: t + e.width * 0.5, y: n + e.height * 0.5 }
  );
}
var ye = (e) => {
    let { collisionRect: t, droppableRects: n, droppableContainers: r } = e,
      i = W(t, t.left, t.top),
      a = [];
    for (let e of r) {
      let { id: t } = e,
        r = n.get(t);
      if (r) {
        let n = V(W(r), i);
        a.push({ id: t, data: { droppableContainer: e, value: n } });
      }
    }
    return a.sort(ge);
  },
  be = (e) => {
    let { collisionRect: t, droppableRects: n, droppableContainers: r } = e,
      i = U(t),
      a = [];
    for (let e of r) {
      let { id: t } = e,
        r = n.get(t);
      if (r) {
        let n = U(r),
          o = i.reduce((e, t, r) => e + V(n[r], t), 0),
          s = Number((o / 4).toFixed(4));
        a.push({ id: t, data: { droppableContainer: e, value: s } });
      }
    }
    return a.sort(ge);
  };
function xe(e, t) {
  let n = Math.max(t.top, e.top),
    r = Math.max(t.left, e.left),
    i = Math.min(t.left + t.width, e.left + e.width),
    a = Math.min(t.top + t.height, e.top + e.height),
    o = i - r,
    s = a - n;
  if (r < i && n < a) {
    let n = t.width * t.height,
      r = e.width * e.height,
      i = o * s,
      a = i / (n + r - i);
    return Number(a.toFixed(4));
  }
  return 0;
}
var Se = (e) => {
  let { collisionRect: t, droppableRects: n, droppableContainers: r } = e,
    i = [];
  for (let e of r) {
    let { id: r } = e,
      a = n.get(r);
    if (a) {
      let n = xe(a, t);
      n > 0 && i.push({ id: r, data: { droppableContainer: e, value: n } });
    }
  }
  return i.sort(_e);
};
function Ce(e, t) {
  let { top: n, left: r, bottom: i, right: a } = t;
  return n <= e.y && e.y <= i && r <= e.x && e.x <= a;
}
var we = (e) => {
  let { droppableContainers: t, droppableRects: n, pointerCoordinates: r } = e;
  if (!r) return [];
  let i = [];
  for (let e of t) {
    let { id: t } = e,
      a = n.get(t);
    if (a && Ce(r, a)) {
      let n = U(a).reduce((e, t) => e + V(r, t), 0),
        o = Number((n / 4).toFixed(4));
      i.push({ id: t, data: { droppableContainer: e, value: o } });
    }
  }
  return i.sort(ge);
};
function Te(e, t, n) {
  return {
    ...e,
    scaleX: t && n ? t.width / n.width : 1,
    scaleY: t && n ? t.height / n.height : 1,
  };
}
function Ee(e, t) {
  return e && t ? { x: e.left - t.left, y: e.top - t.top } : B;
}
function G(e) {
  return function (t) {
    return [...arguments]
      .slice(1)
      .reduce(
        (t, n) => ({
          ...t,
          top: t.top + e * n.y,
          bottom: t.bottom + e * n.y,
          left: t.left + e * n.x,
          right: t.right + e * n.x,
        }),
        { ...t },
      );
  };
}
var De = G(1);
function K(e) {
  if (e.startsWith(`matrix3d(`)) {
    let t = e.slice(9, -1).split(/, /);
    return { x: +t[12], y: +t[13], scaleX: +t[0], scaleY: +t[5] };
  } else if (e.startsWith(`matrix(`)) {
    let t = e.slice(7, -1).split(/, /);
    return { x: +t[4], y: +t[5], scaleX: +t[0], scaleY: +t[3] };
  }
  return null;
}
function q(e, t, n) {
  let r = K(t);
  if (!r) return e;
  let { scaleX: i, scaleY: a, x: o, y: s } = r,
    c = e.left - o - (1 - i) * parseFloat(n),
    l = e.top - s - (1 - a) * parseFloat(n.slice(n.indexOf(` `) + 1)),
    u = i ? e.width / i : e.width,
    d = a ? e.height / a : e.height;
  return { width: u, height: d, top: l, right: c + u, bottom: l + d, left: c };
}
var Oe = { ignoreTransform: !1 };
function J(e, t) {
  t === void 0 && (t = Oe);
  let n = e.getBoundingClientRect();
  if (t.ignoreTransform) {
    let { transform: t, transformOrigin: r } = _(e).getComputedStyle(e);
    t && (n = q(n, t, r));
  }
  let { top: r, left: i, width: a, height: o, bottom: s, right: c } = n;
  return { top: r, left: i, width: a, height: o, bottom: s, right: c };
}
function ke(e) {
  return J(e, { ignoreTransform: !0 });
}
function Ae(e) {
  let t = e.innerWidth,
    n = e.innerHeight;
  return { top: 0, left: 0, right: t, bottom: n, width: t, height: n };
}
function je(e, t) {
  return (
    t === void 0 && (t = _(e).getComputedStyle(e)),
    t.position === `fixed`
  );
}
function Me(e, t) {
  t === void 0 && (t = _(e).getComputedStyle(e));
  let n = /(auto|scroll|overlay)/;
  return [`overflow`, `overflowX`, `overflowY`].some((e) => {
    let r = t[e];
    return typeof r == `string` ? n.test(r) : !1;
  });
}
function Y(e, t) {
  let n = [];
  function r(i) {
    if ((t != null && n.length >= t) || !i) return n;
    if (v(i) && i.scrollingElement != null && !n.includes(i.scrollingElement))
      return (n.push(i.scrollingElement), n);
    if (!y(i) || b(i) || n.includes(i)) return n;
    let a = _(e).getComputedStyle(i);
    return (i !== e && Me(i, a) && n.push(i), je(i, a) ? n : r(i.parentNode));
  }
  return e ? r(e) : n;
}
function Ne(e) {
  let [t] = Y(e, 1);
  return t ?? null;
}
function Pe(e) {
  return !m || !e
    ? null
    : h(e)
      ? e
      : g(e)
        ? v(e) || e === x(e).scrollingElement
          ? window
          : y(e)
            ? e
            : null
        : null;
}
function Fe(e) {
  return h(e) ? e.scrollX : e.scrollLeft;
}
function Ie(e) {
  return h(e) ? e.scrollY : e.scrollTop;
}
function Le(e) {
  return { x: Fe(e), y: Ie(e) };
}
var X;
(function (e) {
  ((e[(e.Forward = 1)] = `Forward`), (e[(e.Backward = -1)] = `Backward`));
})((X ||= {}));
function Re(e) {
  return !m || !e ? !1 : e === document.scrollingElement;
}
function ze(e) {
  let t = { x: 0, y: 0 },
    n = Re(e)
      ? { height: window.innerHeight, width: window.innerWidth }
      : { height: e.clientHeight, width: e.clientWidth },
    r = { x: e.scrollWidth - n.width, y: e.scrollHeight - n.height };
  return {
    isTop: e.scrollTop <= t.y,
    isLeft: e.scrollLeft <= t.x,
    isBottom: e.scrollTop >= r.y,
    isRight: e.scrollLeft >= r.x,
    maxScroll: r,
    minScroll: t,
  };
}
var Be = { x: 0.2, y: 0.2 };
function Ve(e, t, n, r, i) {
  let { top: a, left: o, right: s, bottom: c } = n;
  (r === void 0 && (r = 10), i === void 0 && (i = Be));
  let { isTop: l, isBottom: u, isLeft: d, isRight: f } = ze(e),
    p = { x: 0, y: 0 },
    m = { x: 0, y: 0 },
    h = { height: t.height * i.y, width: t.width * i.x };
  return (
    !l && a <= t.top + h.height
      ? ((p.y = X.Backward),
        (m.y = r * Math.abs((t.top + h.height - a) / h.height)))
      : !u &&
        c >= t.bottom - h.height &&
        ((p.y = X.Forward),
        (m.y = r * Math.abs((t.bottom - h.height - c) / h.height))),
    !f && s >= t.right - h.width
      ? ((p.x = X.Forward),
        (m.x = r * Math.abs((t.right - h.width - s) / h.width)))
      : !d &&
        o <= t.left + h.width &&
        ((p.x = X.Backward),
        (m.x = r * Math.abs((t.left + h.width - o) / h.width))),
    { direction: p, speed: m }
  );
}
function He(e) {
  if (e === document.scrollingElement) {
    let { innerWidth: e, innerHeight: t } = window;
    return { top: 0, left: 0, right: e, bottom: t, width: e, height: t };
  }
  let { top: t, left: n, right: r, bottom: i } = e.getBoundingClientRect();
  return {
    top: t,
    left: n,
    right: r,
    bottom: i,
    width: e.clientWidth,
    height: e.clientHeight,
  };
}
function Ue(e) {
  return e.reduce((e, t) => k(e, Le(t)), B);
}
function We(e) {
  return e.reduce((e, t) => e + Fe(t), 0);
}
function Ge(e) {
  return e.reduce((e, t) => e + Ie(t), 0);
}
function Ke(e, t) {
  if ((t === void 0 && (t = J), !e)) return;
  let { top: n, left: r, bottom: i, right: a } = t(e);
  Ne(e) &&
    (i <= 0 || a <= 0 || n >= window.innerHeight || r >= window.innerWidth) &&
    e.scrollIntoView({ block: `center`, inline: `center` });
}
var qe = [
    [`x`, [`left`, `right`], We],
    [`y`, [`top`, `bottom`], Ge],
  ],
  Je = class {
    constructor(e, t) {
      ((this.rect = void 0),
        (this.width = void 0),
        (this.height = void 0),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.right = void 0),
        (this.left = void 0));
      let n = Y(t),
        r = Ue(n);
      ((this.rect = { ...e }),
        (this.width = e.width),
        (this.height = e.height));
      for (let [e, t, i] of qe)
        for (let a of t)
          Object.defineProperty(this, a, {
            get: () => {
              let t = i(n),
                o = r[e] - t;
              return this.rect[a] + o;
            },
            enumerable: !0,
          });
      Object.defineProperty(this, `rect`, { enumerable: !1 });
    }
  },
  Ye = class {
    constructor(e) {
      ((this.target = void 0),
        (this.listeners = []),
        (this.removeAll = () => {
          this.listeners.forEach((e) => this.target?.removeEventListener(...e));
        }),
        (this.target = e));
    }
    add(e, t, n) {
      var r;
      ((r = this.target) == null || r.addEventListener(e, t, n),
        this.listeners.push([e, t, n]));
    }
  };
function Xe(e) {
  let { EventTarget: t } = _(e);
  return e instanceof t ? e : x(e);
}
function Ze(e, t) {
  let n = Math.abs(e.x),
    r = Math.abs(e.y);
  return typeof t == `number`
    ? Math.sqrt(n ** 2 + r ** 2) > t
    : `x` in t && `y` in t
      ? n > t.x && r > t.y
      : `x` in t
        ? n > t.x
        : `y` in t
          ? r > t.y
          : !1;
}
var Z;
(function (e) {
  ((e.Click = `click`),
    (e.DragStart = `dragstart`),
    (e.Keydown = `keydown`),
    (e.ContextMenu = `contextmenu`),
    (e.Resize = `resize`),
    (e.SelectionChange = `selectionchange`),
    (e.VisibilityChange = `visibilitychange`));
})((Z ||= {}));
function Qe(e) {
  e.preventDefault();
}
function $e(e) {
  e.stopPropagation();
}
var Q;
(function (e) {
  ((e.Space = `Space`),
    (e.Down = `ArrowDown`),
    (e.Right = `ArrowRight`),
    (e.Left = `ArrowLeft`),
    (e.Up = `ArrowUp`),
    (e.Esc = `Escape`),
    (e.Enter = `Enter`),
    (e.Tab = `Tab`));
})((Q ||= {}));
var et = {
    start: [Q.Space, Q.Enter],
    cancel: [Q.Esc],
    end: [Q.Space, Q.Enter, Q.Tab],
  },
  tt = (e, t) => {
    let { currentCoordinates: n } = t;
    switch (e.code) {
      case Q.Right:
        return { ...n, x: n.x + 25 };
      case Q.Left:
        return { ...n, x: n.x - 25 };
      case Q.Down:
        return { ...n, y: n.y + 25 };
      case Q.Up:
        return { ...n, y: n.y - 25 };
    }
  },
  nt = class {
    constructor(e) {
      ((this.props = void 0),
        (this.autoScrollEnabled = !1),
        (this.referenceCoordinates = void 0),
        (this.listeners = void 0),
        (this.windowListeners = void 0),
        (this.props = e));
      let {
        event: { target: t },
      } = e;
      ((this.props = e),
        (this.listeners = new Ye(x(t))),
        (this.windowListeners = new Ye(_(t))),
        (this.handleKeyDown = this.handleKeyDown.bind(this)),
        (this.handleCancel = this.handleCancel.bind(this)),
        this.attach());
    }
    attach() {
      (this.handleStart(),
        this.windowListeners.add(Z.Resize, this.handleCancel),
        this.windowListeners.add(Z.VisibilityChange, this.handleCancel),
        setTimeout(() => this.listeners.add(Z.Keydown, this.handleKeyDown)));
    }
    handleStart() {
      let { activeNode: e, onStart: t } = this.props,
        n = e.node.current;
      (n && Ke(n), t(B));
    }
    handleKeyDown(e) {
      if (j(e)) {
        let { active: t, context: n, options: r } = this.props,
          {
            keyboardCodes: i = et,
            coordinateGetter: a = tt,
            scrollBehavior: o = `smooth`,
          } = r,
          { code: s } = e;
        if (i.end.includes(s)) {
          this.handleEnd(e);
          return;
        }
        if (i.cancel.includes(s)) {
          this.handleCancel(e);
          return;
        }
        let { collisionRect: c } = n.current,
          l = c ? { x: c.left, y: c.top } : B;
        this.referenceCoordinates ||= l;
        let u = a(e, { active: t, context: n.current, currentCoordinates: l });
        if (u) {
          let t = A(u, l),
            r = { x: 0, y: 0 },
            { scrollableAncestors: i } = n.current;
          for (let n of i) {
            let i = e.code,
              {
                isTop: a,
                isRight: s,
                isLeft: c,
                isBottom: l,
                maxScroll: d,
                minScroll: f,
              } = ze(n),
              p = He(n),
              m = {
                x: Math.min(
                  i === Q.Right ? p.right - p.width / 2 : p.right,
                  Math.max(i === Q.Right ? p.left : p.left + p.width / 2, u.x),
                ),
                y: Math.min(
                  i === Q.Down ? p.bottom - p.height / 2 : p.bottom,
                  Math.max(i === Q.Down ? p.top : p.top + p.height / 2, u.y),
                ),
              },
              h = (i === Q.Right && !s) || (i === Q.Left && !c),
              g = (i === Q.Down && !l) || (i === Q.Up && !a);
            if (h && m.x !== u.x) {
              let e = n.scrollLeft + t.x,
                a = (i === Q.Right && e <= d.x) || (i === Q.Left && e >= f.x);
              if (a && !t.y) {
                n.scrollTo({ left: e, behavior: o });
                return;
              }
              (a
                ? (r.x = n.scrollLeft - e)
                : (r.x =
                    i === Q.Right ? n.scrollLeft - d.x : n.scrollLeft - f.x),
                r.x && n.scrollBy({ left: -r.x, behavior: o }));
              break;
            } else if (g && m.y !== u.y) {
              let e = n.scrollTop + t.y,
                a = (i === Q.Down && e <= d.y) || (i === Q.Up && e >= f.y);
              if (a && !t.x) {
                n.scrollTo({ top: e, behavior: o });
                return;
              }
              (a
                ? (r.y = n.scrollTop - e)
                : (r.y = i === Q.Down ? n.scrollTop - d.y : n.scrollTop - f.y),
                r.y && n.scrollBy({ top: -r.y, behavior: o }));
              break;
            }
          }
          this.handleMove(e, k(A(u, this.referenceCoordinates), r));
        }
      }
    }
    handleMove(e, t) {
      let { onMove: n } = this.props;
      (e.preventDefault(), n(t));
    }
    handleEnd(e) {
      let { onEnd: t } = this.props;
      (e.preventDefault(), this.detach(), t());
    }
    handleCancel(e) {
      let { onCancel: t } = this.props;
      (e.preventDefault(), this.detach(), t());
    }
    detach() {
      (this.listeners.removeAll(), this.windowListeners.removeAll());
    }
  };
nt.activators = [
  {
    eventName: `onKeyDown`,
    handler: (e, t, n) => {
      let { keyboardCodes: r = et, onActivation: i } = t,
        { active: a } = n,
        { code: o } = e.nativeEvent;
      if (r.start.includes(o)) {
        let t = a.activatorNode.current;
        return t && e.target !== t
          ? !1
          : (e.preventDefault(), i?.({ event: e.nativeEvent }), !0);
      }
      return !1;
    },
  },
];
function rt(e) {
  return !!(e && `distance` in e);
}
function it(e) {
  return !!(e && `delay` in e);
}
var at = class {
    constructor(e, t, n) {
      (n === void 0 && (n = Xe(e.event.target)),
        (this.props = void 0),
        (this.events = void 0),
        (this.autoScrollEnabled = !0),
        (this.document = void 0),
        (this.activated = !1),
        (this.initialCoordinates = void 0),
        (this.timeoutId = null),
        (this.listeners = void 0),
        (this.documentListeners = void 0),
        (this.windowListeners = void 0),
        (this.props = e),
        (this.events = t));
      let { event: r } = e,
        { target: i } = r;
      ((this.props = e),
        (this.events = t),
        (this.document = x(i)),
        (this.documentListeners = new Ye(this.document)),
        (this.listeners = new Ye(n)),
        (this.windowListeners = new Ye(_(i))),
        (this.initialCoordinates = ae(r) ?? B),
        (this.handleStart = this.handleStart.bind(this)),
        (this.handleMove = this.handleMove.bind(this)),
        (this.handleEnd = this.handleEnd.bind(this)),
        (this.handleCancel = this.handleCancel.bind(this)),
        (this.handleKeydown = this.handleKeydown.bind(this)),
        (this.removeTextSelection = this.removeTextSelection.bind(this)),
        this.attach());
    }
    attach() {
      let {
        events: e,
        props: {
          options: { activationConstraint: t, bypassActivationConstraint: n },
        },
      } = this;
      if (
        (this.listeners.add(e.move.name, this.handleMove, { passive: !1 }),
        this.listeners.add(e.end.name, this.handleEnd),
        e.cancel && this.listeners.add(e.cancel.name, this.handleCancel),
        this.windowListeners.add(Z.Resize, this.handleCancel),
        this.windowListeners.add(Z.DragStart, Qe),
        this.windowListeners.add(Z.VisibilityChange, this.handleCancel),
        this.windowListeners.add(Z.ContextMenu, Qe),
        this.documentListeners.add(Z.Keydown, this.handleKeydown),
        t)
      ) {
        if (
          n != null &&
          n({
            event: this.props.event,
            activeNode: this.props.activeNode,
            options: this.props.options,
          })
        )
          return this.handleStart();
        if (it(t)) {
          ((this.timeoutId = setTimeout(this.handleStart, t.delay)),
            this.handlePending(t));
          return;
        }
        if (rt(t)) {
          this.handlePending(t);
          return;
        }
      }
      this.handleStart();
    }
    detach() {
      (this.listeners.removeAll(),
        this.windowListeners.removeAll(),
        setTimeout(this.documentListeners.removeAll, 50),
        this.timeoutId !== null &&
          (clearTimeout(this.timeoutId), (this.timeoutId = null)));
    }
    handlePending(e, t) {
      let { active: n, onPending: r } = this.props;
      r(n, e, this.initialCoordinates, t);
    }
    handleStart() {
      let { initialCoordinates: e } = this,
        { onStart: t } = this.props;
      e &&
        ((this.activated = !0),
        this.documentListeners.add(Z.Click, $e, { capture: !0 }),
        this.removeTextSelection(),
        this.documentListeners.add(Z.SelectionChange, this.removeTextSelection),
        t(e));
    }
    handleMove(e) {
      let { activated: t, initialCoordinates: n, props: r } = this,
        {
          onMove: i,
          options: { activationConstraint: a },
        } = r;
      if (!n) return;
      let o = ae(e) ?? B,
        s = A(n, o);
      if (!t && a) {
        if (rt(a)) {
          if (a.tolerance != null && Ze(s, a.tolerance))
            return this.handleCancel();
          if (Ze(s, a.distance)) return this.handleStart();
        }
        if (it(a) && Ze(s, a.tolerance)) return this.handleCancel();
        this.handlePending(a, s);
        return;
      }
      (e.cancelable && e.preventDefault(), i(o));
    }
    handleEnd() {
      let { onAbort: e, onEnd: t } = this.props;
      (this.detach(), this.activated || e(this.props.active), t());
    }
    handleCancel() {
      let { onAbort: e, onCancel: t } = this.props;
      (this.detach(), this.activated || e(this.props.active), t());
    }
    handleKeydown(e) {
      e.code === Q.Esc && this.handleCancel();
    }
    removeTextSelection() {
      var e;
      (e = this.document.getSelection()) == null || e.removeAllRanges();
    }
  },
  ot = {
    cancel: { name: `pointercancel` },
    move: { name: `pointermove` },
    end: { name: `pointerup` },
  },
  st = class extends at {
    constructor(e) {
      let { event: t } = e,
        n = x(t.target);
      super(e, ot, n);
    }
  };
st.activators = [
  {
    eventName: `onPointerDown`,
    handler: (e, t) => {
      let { nativeEvent: n } = e,
        { onActivation: r } = t;
      return !n.isPrimary || n.button !== 0 ? !1 : (r?.({ event: n }), !0);
    },
  },
];
var ct = { move: { name: `mousemove` }, end: { name: `mouseup` } },
  lt;
(function (e) {
  e[(e.RightClick = 2)] = `RightClick`;
})((lt ||= {}));
var ut = class extends at {
  constructor(e) {
    super(e, ct, x(e.event.target));
  }
};
ut.activators = [
  {
    eventName: `onMouseDown`,
    handler: (e, t) => {
      let { nativeEvent: n } = e,
        { onActivation: r } = t;
      return n.button === lt.RightClick ? !1 : (r?.({ event: n }), !0);
    },
  },
];
var dt = {
    cancel: { name: `touchcancel` },
    move: { name: `touchmove` },
    end: { name: `touchend` },
  },
  ft = class extends at {
    constructor(e) {
      super(e, dt);
    }
    static setup() {
      return (
        window.addEventListener(dt.move.name, e, { capture: !1, passive: !1 }),
        function () {
          window.removeEventListener(dt.move.name, e);
        }
      );
      function e() {}
    }
  };
ft.activators = [
  {
    eventName: `onTouchStart`,
    handler: (e, t) => {
      let { nativeEvent: n } = e,
        { onActivation: r } = t,
        { touches: i } = n;
      return i.length > 1 ? !1 : (r?.({ event: n }), !0);
    },
  },
];
var pt;
(function (e) {
  ((e[(e.Pointer = 0)] = `Pointer`),
    (e[(e.DraggableRect = 1)] = `DraggableRect`));
})((pt ||= {}));
var mt;
(function (e) {
  ((e[(e.TreeOrder = 0)] = `TreeOrder`),
    (e[(e.ReversedTreeOrder = 1)] = `ReversedTreeOrder`));
})((mt ||= {}));
function ht(e) {
  let {
      acceleration: t,
      activator: n = pt.Pointer,
      canScroll: r,
      draggingRect: i,
      enabled: a,
      interval: o = 5,
      order: s = mt.TreeOrder,
      pointerCoordinates: c,
      scrollableAncestors: l,
      scrollableAncestorRects: u,
      delta: d,
      threshold: p,
    } = e,
    m = _t({ delta: d, disabled: !a }),
    [h, g] = w(),
    _ = (0, f.useRef)({ x: 0, y: 0 }),
    v = (0, f.useRef)({ x: 0, y: 0 }),
    y = (0, f.useMemo)(() => {
      switch (n) {
        case pt.Pointer:
          return c ? { top: c.y, bottom: c.y, left: c.x, right: c.x } : null;
        case pt.DraggableRect:
          return i;
      }
    }, [n, i, c]),
    b = (0, f.useRef)(null),
    x = (0, f.useCallback)(() => {
      let e = b.current;
      if (!e) return;
      let t = _.current.x * v.current.x,
        n = _.current.y * v.current.y;
      e.scrollBy(t, n);
    }, []),
    S = (0, f.useMemo)(
      () => (s === mt.TreeOrder ? [...l].reverse() : l),
      [s, l],
    );
  (0, f.useEffect)(() => {
    if (!a || !l.length || !y) {
      g();
      return;
    }
    for (let e of S) {
      if (r?.(e) === !1) continue;
      let n = u[l.indexOf(e)];
      if (!n) continue;
      let { direction: i, speed: a } = Ve(e, n, y, t, p);
      for (let e of [`x`, `y`]) m[e][i[e]] || ((a[e] = 0), (i[e] = 0));
      if (a.x > 0 || a.y > 0) {
        (g(), (b.current = e), h(x, o), (_.current = a), (v.current = i));
        return;
      }
    }
    ((_.current = { x: 0, y: 0 }), (v.current = { x: 0, y: 0 }), g());
  }, [
    t,
    x,
    r,
    g,
    a,
    o,
    JSON.stringify(y),
    JSON.stringify(m),
    h,
    l,
    S,
    u,
    JSON.stringify(p),
  ]);
}
var gt = {
  x: { [X.Backward]: !1, [X.Forward]: !1 },
  y: { [X.Backward]: !1, [X.Forward]: !1 },
};
function _t(e) {
  let { delta: t, disabled: n } = e,
    r = O(t);
  return E(
    (e) => {
      if (n || !r || !e) return gt;
      let i = { x: Math.sign(t.x - r.x), y: Math.sign(t.y - r.y) };
      return {
        x: {
          [X.Backward]: e.x[X.Backward] || i.x === -1,
          [X.Forward]: e.x[X.Forward] || i.x === 1,
        },
        y: {
          [X.Backward]: e.y[X.Backward] || i.y === -1,
          [X.Forward]: e.y[X.Forward] || i.y === 1,
        },
      };
    },
    [n, t, r],
  );
}
function vt(e, t) {
  let n = t == null ? void 0 : e.get(t),
    r = n ? n.node.current : null;
  return E((e) => (t == null ? null : (r ?? e ?? null)), [r, t]);
}
function yt(e, t) {
  return (0, f.useMemo)(
    () =>
      e.reduce((e, n) => {
        let { sensor: r } = n,
          i = r.activators.map((e) => ({
            eventName: e.eventName,
            handler: t(e.handler, n),
          }));
        return [...e, ...i];
      }, []),
    [e, t],
  );
}
var bt;
(function (e) {
  ((e[(e.Always = 0)] = `Always`),
    (e[(e.BeforeDragging = 1)] = `BeforeDragging`),
    (e[(e.WhileDragging = 2)] = `WhileDragging`));
})((bt ||= {}));
var xt;
(function (e) {
  e.Optimized = `optimized`;
})((xt ||= {}));
var St = new Map();
function Ct(e, t) {
  let { dragging: n, dependencies: r, config: i } = t,
    [a, o] = (0, f.useState)(null),
    { frequency: s, measure: c, strategy: l } = i,
    u = (0, f.useRef)(e),
    d = _(),
    p = T(d),
    m = (0, f.useCallback)(
      function (e) {
        (e === void 0 && (e = []),
          !p.current &&
            o((t) =>
              t === null ? e : t.concat(e.filter((e) => !t.includes(e))),
            ));
      },
      [p],
    ),
    h = (0, f.useRef)(null),
    g = E(
      (t) => {
        if (d && !n) return St;
        if (!t || t === St || u.current !== e || a != null) {
          let t = new Map();
          for (let n of e) {
            if (!n) continue;
            if (a && a.length > 0 && !a.includes(n.id) && n.rect.current) {
              t.set(n.id, n.rect.current);
              continue;
            }
            let e = n.node.current,
              r = e ? new Je(c(e), e) : null;
            ((n.rect.current = r), r && t.set(n.id, r));
          }
          return t;
        }
        return t;
      },
      [e, a, n, d, c],
    );
  return (
    (0, f.useEffect)(() => {
      u.current = e;
    }, [e]),
    (0, f.useEffect)(() => {
      d || m();
    }, [n, d]),
    (0, f.useEffect)(() => {
      a && a.length > 0 && o(null);
    }, [JSON.stringify(a)]),
    (0, f.useEffect)(() => {
      d ||
        typeof s != `number` ||
        h.current !== null ||
        (h.current = setTimeout(() => {
          (m(), (h.current = null));
        }, s));
    }, [s, d, m, ...r]),
    {
      droppableRects: g,
      measureDroppableContainers: m,
      measuringScheduled: a != null,
    }
  );
  function _() {
    switch (l) {
      case bt.Always:
        return !1;
      case bt.BeforeDragging:
        return n;
      default:
        return !n;
    }
  }
}
function wt(e, t) {
  return E(
    (n) => (e ? n || (typeof t == `function` ? t(e) : e) : null),
    [t, e],
  );
}
function Tt(e, t) {
  return wt(e, t);
}
function Et(e) {
  let { callback: t, disabled: n } = e,
    r = C(t),
    i = (0, f.useMemo)(() => {
      if (n || typeof window > `u` || window.MutationObserver === void 0)
        return;
      let { MutationObserver: e } = window;
      return new e(r);
    }, [r, n]);
  return ((0, f.useEffect)(() => () => i?.disconnect(), [i]), i);
}
function Dt(e) {
  let { callback: t, disabled: n } = e,
    r = C(t),
    i = (0, f.useMemo)(() => {
      if (n || typeof window > `u` || window.ResizeObserver === void 0) return;
      let { ResizeObserver: e } = window;
      return new e(r);
    }, [n]);
  return ((0, f.useEffect)(() => () => i?.disconnect(), [i]), i);
}
function Ot(e) {
  return new Je(J(e), e);
}
function kt(e, t, n) {
  t === void 0 && (t = Ot);
  let [r, i] = (0, f.useState)(null);
  function a() {
    i((r) => {
      if (!e) return null;
      if (e.isConnected === !1) return r ?? n ?? null;
      let i = t(e);
      return JSON.stringify(r) === JSON.stringify(i) ? r : i;
    });
  }
  let o = Et({
      callback(t) {
        if (e)
          for (let n of t) {
            let { type: t, target: r } = n;
            if (
              t === `childList` &&
              r instanceof HTMLElement &&
              r.contains(e)
            ) {
              a();
              break;
            }
          }
      },
    }),
    s = Dt({ callback: a });
  return (
    S(() => {
      (a(),
        e
          ? (s?.observe(e),
            o?.observe(document.body, { childList: !0, subtree: !0 }))
          : (s?.disconnect(), o?.disconnect()));
    }, [e]),
    r
  );
}
function At(e) {
  return Ee(e, wt(e));
}
var jt = [];
function Mt(e) {
  let t = (0, f.useRef)(e),
    n = E(
      (n) =>
        e
          ? n &&
            n !== jt &&
            e &&
            t.current &&
            e.parentNode === t.current.parentNode
            ? n
            : Y(e)
          : jt,
      [e],
    );
  return (
    (0, f.useEffect)(() => {
      t.current = e;
    }, [e]),
    n
  );
}
function Nt(e) {
  let [t, n] = (0, f.useState)(null),
    r = (0, f.useRef)(e),
    i = (0, f.useCallback)((e) => {
      let t = Pe(e.target);
      t && n((e) => (e ? (e.set(t, Le(t)), new Map(e)) : null));
    }, []);
  return (
    (0, f.useEffect)(() => {
      let t = r.current;
      if (e !== t) {
        a(t);
        let o = e
          .map((e) => {
            let t = Pe(e);
            return t
              ? (t.addEventListener(`scroll`, i, { passive: !0 }), [t, Le(t)])
              : null;
          })
          .filter((e) => e != null);
        (n(o.length ? new Map(o) : null), (r.current = e));
      }
      return () => {
        (a(e), a(t));
      };
      function a(e) {
        e.forEach((e) => {
          Pe(e)?.removeEventListener(`scroll`, i);
        });
      }
    }, [i, e]),
    (0, f.useMemo)(
      () =>
        e.length
          ? t
            ? Array.from(t.values()).reduce((e, t) => k(e, t), B)
            : Ue(e)
          : B,
      [e, t],
    )
  );
}
function Pt(e, t) {
  t === void 0 && (t = []);
  let n = (0, f.useRef)(null);
  return (
    (0, f.useEffect)(() => {
      n.current = null;
    }, t),
    (0, f.useEffect)(() => {
      let t = e !== B;
      (t && !n.current && (n.current = e),
        !t && n.current && (n.current = null));
    }, [e]),
    n.current ? A(e, n.current) : B
  );
}
function Ft(e) {
  (0, f.useEffect)(
    () => {
      if (!m) return;
      let t = e.map((e) => {
        let { sensor: t } = e;
        return t.setup == null ? void 0 : t.setup();
      });
      return () => {
        for (let e of t) e?.();
      };
    },
    e.map((e) => {
      let { sensor: t } = e;
      return t;
    }),
  );
}
function It(e, t) {
  return (0, f.useMemo)(
    () =>
      e.reduce((e, n) => {
        let { eventName: r, handler: i } = n;
        return (
          (e[r] = (e) => {
            i(e, t);
          }),
          e
        );
      }, {}),
    [e, t],
  );
}
function Lt(e) {
  return (0, f.useMemo)(() => (e ? Ae(e) : null), [e]);
}
var Rt = [];
function zt(e, t) {
  t === void 0 && (t = J);
  let [n] = e,
    r = Lt(n ? _(n) : null),
    [i, a] = (0, f.useState)(Rt);
  function o() {
    a(() => (e.length ? e.map((e) => (Re(e) ? r : new Je(t(e), e))) : Rt));
  }
  let s = Dt({ callback: o });
  return (
    S(() => {
      (s?.disconnect(), o(), e.forEach((e) => s?.observe(e)));
    }, [e]),
    i
  );
}
function Bt(e) {
  if (!e) return null;
  if (e.children.length > 1) return e;
  let t = e.children[0];
  return y(t) ? t : e;
}
function Vt(e) {
  let { measure: t } = e,
    [n, r] = (0, f.useState)(null),
    i = Dt({
      callback: (0, f.useCallback)(
        (e) => {
          for (let { target: n } of e)
            if (y(n)) {
              r((e) => {
                let r = t(n);
                return e ? { ...e, width: r.width, height: r.height } : r;
              });
              break;
            }
        },
        [t],
      ),
    }),
    [a, o] = D(
      (0, f.useCallback)(
        (e) => {
          let n = Bt(e);
          (i?.disconnect(), n && i?.observe(n), r(n ? t(n) : null));
        },
        [t, i],
      ),
    );
  return (0, f.useMemo)(() => ({ nodeRef: a, rect: n, setRef: o }), [n, a, o]);
}
var Ht = [
    { sensor: st, options: {} },
    { sensor: nt, options: {} },
  ],
  Ut = { current: {} },
  Wt = {
    draggable: { measure: ke },
    droppable: {
      measure: ke,
      strategy: bt.WhileDragging,
      frequency: xt.Optimized,
    },
    dragOverlay: { measure: J },
  },
  Gt = class extends Map {
    get(e) {
      return e == null ? void 0 : (super.get(e) ?? void 0);
    }
    toArray() {
      return Array.from(this.values());
    }
    getEnabled() {
      return this.toArray().filter((e) => {
        let { disabled: t } = e;
        return !t;
      });
    }
    getNodeFor(e) {
      return this.get(e)?.node.current ?? void 0;
    }
  },
  Kt = {
    activatorEvent: null,
    active: null,
    activeNode: null,
    activeNodeRect: null,
    collisions: null,
    containerNodeRect: null,
    draggableNodes: new Map(),
    droppableRects: new Map(),
    droppableContainers: new Gt(),
    over: null,
    dragOverlay: { nodeRef: { current: null }, rect: null, setRef: R },
    scrollableAncestors: [],
    scrollableAncestorRects: [],
    measuringConfiguration: Wt,
    measureDroppableContainers: R,
    windowRect: null,
    measuringScheduled: !1,
  },
  qt = {
    activatorEvent: null,
    activators: [],
    active: null,
    activeNodeRect: null,
    ariaDescribedById: { draggable: `` },
    dispatch: R,
    draggableNodes: new Map(),
    over: null,
    measureDroppableContainers: R,
  },
  Jt = (0, f.createContext)(qt),
  Yt = (0, f.createContext)(Kt);
function Xt() {
  return {
    draggable: {
      active: null,
      initialCoordinates: { x: 0, y: 0 },
      nodes: new Map(),
      translate: { x: 0, y: 0 },
    },
    droppable: { containers: new Gt() },
  };
}
function Zt(e, t) {
  switch (t.type) {
    case L.DragStart:
      return {
        ...e,
        draggable: {
          ...e.draggable,
          initialCoordinates: t.initialCoordinates,
          active: t.active,
        },
      };
    case L.DragMove:
      return e.draggable.active == null
        ? e
        : {
            ...e,
            draggable: {
              ...e.draggable,
              translate: {
                x: t.coordinates.x - e.draggable.initialCoordinates.x,
                y: t.coordinates.y - e.draggable.initialCoordinates.y,
              },
            },
          };
    case L.DragEnd:
    case L.DragCancel:
      return {
        ...e,
        draggable: {
          ...e.draggable,
          active: null,
          initialCoordinates: { x: 0, y: 0 },
          translate: { x: 0, y: 0 },
        },
      };
    case L.RegisterDroppable: {
      let { element: n } = t,
        { id: r } = n,
        i = new Gt(e.droppable.containers);
      return (
        i.set(r, n),
        { ...e, droppable: { ...e.droppable, containers: i } }
      );
    }
    case L.SetDroppableDisabled: {
      let { id: n, key: r, disabled: i } = t,
        a = e.droppable.containers.get(n);
      if (!a || r !== a.key) return e;
      let o = new Gt(e.droppable.containers);
      return (
        o.set(n, { ...a, disabled: i }),
        { ...e, droppable: { ...e.droppable, containers: o } }
      );
    }
    case L.UnregisterDroppable: {
      let { id: n, key: r } = t,
        i = e.droppable.containers.get(n);
      if (!i || r !== i.key) return e;
      let a = new Gt(e.droppable.containers);
      return (
        a.delete(n),
        { ...e, droppable: { ...e.droppable, containers: a } }
      );
    }
    default:
      return e;
  }
}
function Qt(e) {
  let { disabled: t } = e,
    { active: n, activatorEvent: r, draggableNodes: i } = (0, f.useContext)(Jt),
    a = O(r),
    o = O(n?.id);
  return (
    (0, f.useEffect)(() => {
      if (!t && !r && a && o != null) {
        if (!j(a) || document.activeElement === a.target) return;
        let e = i.get(o);
        if (!e) return;
        let { activatorNode: t, node: n } = e;
        if (!t.current && !n.current) return;
        requestAnimationFrame(() => {
          for (let e of [t.current, n.current]) {
            if (!e) continue;
            let t = P(e);
            if (t) {
              t.focus();
              break;
            }
          }
        });
      }
    }, [r, t, i, o, a]),
    null
  );
}
function $t(e, t) {
  let { transform: n, ...r } = t;
  return e != null && e.length
    ? e.reduce((e, t) => t({ transform: e, ...r }), n)
    : n;
}
function en(e) {
  return (0, f.useMemo)(
    () => ({
      draggable: { ...Wt.draggable, ...e?.draggable },
      droppable: { ...Wt.droppable, ...e?.droppable },
      dragOverlay: { ...Wt.dragOverlay, ...e?.dragOverlay },
    }),
    [e?.draggable, e?.droppable, e?.dragOverlay],
  );
}
function tn(e) {
  let { activeNode: t, measure: n, initialRect: r, config: i = !0 } = e,
    a = (0, f.useRef)(!1),
    { x: o, y: s } = typeof i == `boolean` ? { x: i, y: i } : i;
  S(() => {
    if ((!o && !s) || !t) {
      a.current = !1;
      return;
    }
    if (a.current || !r) return;
    let e = t?.node.current;
    if (!e || e.isConnected === !1) return;
    let i = Ee(n(e), r);
    if (
      (o || (i.x = 0),
      s || (i.y = 0),
      (a.current = !0),
      Math.abs(i.x) > 0 || Math.abs(i.y) > 0)
    ) {
      let t = Ne(e);
      t && t.scrollBy({ top: i.y, left: i.x });
    }
  }, [t, o, s, r, n]);
}
var nn = (0, f.createContext)({ ...B, scaleX: 1, scaleY: 1 }),
  $;
(function (e) {
  ((e[(e.Uninitialized = 0)] = `Uninitialized`),
    (e[(e.Initializing = 1)] = `Initializing`),
    (e[(e.Initialized = 2)] = `Initialized`));
})(($ ||= {}));
var rn = (0, f.memo)(function (e) {
    let {
        id: t,
        accessibility: n,
        autoScroll: r = !0,
        children: i,
        sensors: a = Ht,
        collisionDetection: o = Se,
        measuring: s,
        modifiers: c,
        ...l
      } = e,
      [u, d] = (0, f.useReducer)(Zt, void 0, Xt),
      [p, m] = fe(),
      [h, g] = (0, f.useState)($.Uninitialized),
      v = h === $.Initialized,
      {
        draggable: { active: y, nodes: b, translate: x },
        droppable: { containers: C },
      } = u,
      w = y == null ? null : b.get(y),
      E = (0, f.useRef)({ initial: null, translated: null }),
      D = (0, f.useMemo)(
        () => (y == null ? null : { id: y, data: w?.data ?? Ut, rect: E }),
        [y, w],
      ),
      O = (0, f.useRef)(null),
      [ee, ne] = (0, f.useState)(null),
      [A, re] = (0, f.useState)(null),
      j = T(l, Object.values(l)),
      ie = te(`DndDescribedBy`, t),
      M = (0, f.useMemo)(() => C.getEnabled(), [C]),
      N = en(s),
      {
        droppableRects: P,
        measureDroppableContainers: oe,
        measuringScheduled: se,
      } = Ct(M, { dragging: v, dependencies: [x.x, x.y], config: N.droppable }),
      F = vt(b, y),
      ce = (0, f.useMemo)(() => (A ? ae(A) : null), [A]),
      de = Fe(),
      pe = Tt(F, N.draggable.measure);
    tn({
      activeNode: y == null ? null : b.get(y),
      config: de.layoutShiftCompensation,
      initialRect: pe,
      measure: N.draggable.measure,
    });
    let I = kt(F, N.draggable.measure, pe),
      R = kt(F ? F.parentElement : null),
      z = (0, f.useRef)({
        activatorEvent: null,
        active: null,
        activeNode: F,
        collisionRect: null,
        collisions: null,
        droppableRects: P,
        draggableNodes: b,
        draggingNode: null,
        draggingNodeRect: null,
        droppableContainers: C,
        over: null,
        scrollableAncestors: [],
        scrollAdjustedTranslate: null,
      }),
      he = C.getNodeFor(z.current.over?.id),
      B = Vt({ measure: N.dragOverlay.measure }),
      V = B.nodeRef.current ?? F,
      H = v ? (B.rect ?? I) : null,
      ge = !!(B.nodeRef.current && B.rect),
      _e = At(ge ? null : I),
      U = Lt(V ? _(V) : null),
      W = Mt(v ? (he ?? F) : null),
      ye = zt(W),
      be = $t(c, {
        transform: { x: x.x - _e.x, y: x.y - _e.y, scaleX: 1, scaleY: 1 },
        activatorEvent: A,
        active: D,
        activeNodeRect: I,
        containerNodeRect: R,
        draggingNodeRect: H,
        over: z.current.over,
        overlayNodeRect: B.rect,
        scrollableAncestors: W,
        scrollableAncestorRects: ye,
        windowRect: U,
      }),
      xe = ce ? k(ce, x) : null,
      Ce = Nt(W),
      we = Pt(Ce),
      Ee = Pt(Ce, [I]),
      G = k(be, we),
      K = H ? De(H, be) : null,
      q =
        D && K
          ? o({
              active: D,
              collisionRect: K,
              droppableRects: P,
              droppableContainers: M,
              pointerCoordinates: xe,
            })
          : null,
      Oe = ve(q, `id`),
      [J, ke] = (0, f.useState)(null),
      Ae = Te(ge ? be : k(be, Ee), J?.rect ?? null, I),
      je = (0, f.useRef)(null),
      Me = (0, f.useCallback)(
        (e, t) => {
          let { sensor: n, options: r } = t;
          if (O.current == null) return;
          let i = b.get(O.current);
          if (!i) return;
          let a = e.nativeEvent;
          je.current = new n({
            active: O.current,
            activeNode: i,
            event: a,
            options: r,
            context: z,
            onAbort(e) {
              if (!b.get(e)) return;
              let { onDragAbort: t } = j.current,
                n = { id: e };
              (t?.(n), p({ type: `onDragAbort`, event: n }));
            },
            onPending(e, t, n, r) {
              if (!b.get(e)) return;
              let { onDragPending: i } = j.current,
                a = { id: e, constraint: t, initialCoordinates: n, offset: r };
              (i?.(a), p({ type: `onDragPending`, event: a }));
            },
            onStart(e) {
              let t = O.current;
              if (t == null) return;
              let n = b.get(t);
              if (!n) return;
              let { onDragStart: r } = j.current,
                i = {
                  activatorEvent: a,
                  active: { id: t, data: n.data, rect: E },
                };
              (0, le.unstable_batchedUpdates)(() => {
                (r?.(i),
                  g($.Initializing),
                  d({ type: L.DragStart, initialCoordinates: e, active: t }),
                  p({ type: `onDragStart`, event: i }),
                  ne(je.current),
                  re(a));
              });
            },
            onMove(e) {
              d({ type: L.DragMove, coordinates: e });
            },
            onEnd: o(L.DragEnd),
            onCancel: o(L.DragCancel),
          });
          function o(e) {
            return async function () {
              let {
                  active: t,
                  collisions: n,
                  over: r,
                  scrollAdjustedTranslate: i,
                } = z.current,
                o = null;
              if (t && i) {
                let { cancelDrop: s } = j.current;
                ((o = {
                  activatorEvent: a,
                  active: t,
                  collisions: n,
                  delta: i,
                  over: r,
                }),
                  e === L.DragEnd &&
                    typeof s == `function` &&
                    (await Promise.resolve(s(o))) &&
                    (e = L.DragCancel));
              }
              ((O.current = null),
                (0, le.unstable_batchedUpdates)(() => {
                  (d({ type: e }),
                    g($.Uninitialized),
                    ke(null),
                    ne(null),
                    re(null),
                    (je.current = null));
                  let t = e === L.DragEnd ? `onDragEnd` : `onDragCancel`;
                  if (o) {
                    let e = j.current[t];
                    (e?.(o), p({ type: t, event: o }));
                  }
                }));
            };
          }
        },
        [b],
      ),
      Y = yt(
        a,
        (0, f.useCallback)(
          (e, t) => (n, r) => {
            let i = n.nativeEvent,
              a = b.get(r);
            if (O.current !== null || !a || i.dndKit || i.defaultPrevented)
              return;
            let o = { active: a };
            e(n, t.options, o) === !0 &&
              ((i.dndKit = { capturedBy: t.sensor }),
              (O.current = r),
              Me(n, t));
          },
          [b, Me],
        ),
      );
    (Ft(a),
      S(() => {
        I && h === $.Initializing && g($.Initialized);
      }, [I, h]),
      (0, f.useEffect)(() => {
        let { onDragMove: e } = j.current,
          { active: t, activatorEvent: n, collisions: r, over: i } = z.current;
        if (!t || !n) return;
        let a = {
          active: t,
          activatorEvent: n,
          collisions: r,
          delta: { x: G.x, y: G.y },
          over: i,
        };
        (0, le.unstable_batchedUpdates)(() => {
          (e?.(a), p({ type: `onDragMove`, event: a }));
        });
      }, [G.x, G.y]),
      (0, f.useEffect)(() => {
        let {
          active: e,
          activatorEvent: t,
          collisions: n,
          droppableContainers: r,
          scrollAdjustedTranslate: i,
        } = z.current;
        if (!e || O.current == null || !t || !i) return;
        let { onDragOver: a } = j.current,
          o = r.get(Oe),
          s =
            o && o.rect.current
              ? {
                  id: o.id,
                  rect: o.rect.current,
                  data: o.data,
                  disabled: o.disabled,
                }
              : null,
          c = {
            active: e,
            activatorEvent: t,
            collisions: n,
            delta: { x: i.x, y: i.y },
            over: s,
          };
        (0, le.unstable_batchedUpdates)(() => {
          (ke(s), a?.(c), p({ type: `onDragOver`, event: c }));
        });
      }, [Oe]),
      S(() => {
        ((z.current = {
          activatorEvent: A,
          active: D,
          activeNode: F,
          collisionRect: K,
          collisions: q,
          droppableRects: P,
          draggableNodes: b,
          draggingNode: V,
          draggingNodeRect: H,
          droppableContainers: C,
          over: J,
          scrollableAncestors: W,
          scrollAdjustedTranslate: G,
        }),
          (E.current = { initial: H, translated: K }));
      }, [D, F, q, K, b, V, H, P, C, J, W, G]),
      ht({
        ...de,
        delta: x,
        draggingRect: K,
        pointerCoordinates: xe,
        scrollableAncestors: W,
        scrollableAncestorRects: ye,
      }));
    let Ne = (0, f.useMemo)(
        () => ({
          active: D,
          activeNode: F,
          activeNodeRect: I,
          activatorEvent: A,
          collisions: q,
          containerNodeRect: R,
          dragOverlay: B,
          draggableNodes: b,
          droppableContainers: C,
          droppableRects: P,
          over: J,
          measureDroppableContainers: oe,
          scrollableAncestors: W,
          scrollableAncestorRects: ye,
          measuringConfiguration: N,
          measuringScheduled: se,
          windowRect: U,
        }),
        [D, F, I, A, q, R, B, b, C, P, J, oe, W, ye, N, se, U],
      ),
      Pe = (0, f.useMemo)(
        () => ({
          activatorEvent: A,
          activators: Y,
          active: D,
          activeNodeRect: I,
          ariaDescribedById: { draggable: ie },
          dispatch: d,
          draggableNodes: b,
          over: J,
          measureDroppableContainers: oe,
        }),
        [A, Y, D, I, d, ie, b, J, oe],
      );
    return f.createElement(
      ue.Provider,
      { value: m },
      f.createElement(
        Jt.Provider,
        { value: Pe },
        f.createElement(
          Yt.Provider,
          { value: Ne },
          f.createElement(nn.Provider, { value: Ae }, i),
        ),
        f.createElement(Qt, { disabled: n?.restoreFocus === !1 }),
      ),
      f.createElement(me, { ...n, hiddenTextDescribedById: ie }),
    );
    function Fe() {
      let e = ee?.autoScrollEnabled === !1,
        t = typeof r == `object` ? r.enabled === !1 : r === !1,
        n = v && !e && !t;
      return typeof r == `object` ? { ...r, enabled: n } : { enabled: n };
    }
  }),
  an = (0, f.createContext)(null),
  on = `button`,
  sn = `Draggable`;
function cn(e) {
  let { id: t, data: n, disabled: r = !1, attributes: i } = e,
    a = te(sn),
    {
      activators: o,
      activatorEvent: s,
      active: c,
      activeNodeRect: l,
      ariaDescribedById: u,
      draggableNodes: d,
      over: p,
    } = (0, f.useContext)(Jt),
    {
      role: m = on,
      roleDescription: h = `draggable`,
      tabIndex: g = 0,
    } = i ?? {},
    _ = c?.id === t,
    v = (0, f.useContext)(_ ? nn : an),
    [y, b] = D(),
    [x, C] = D(),
    w = It(o, t),
    E = T(n);
  return (
    S(
      () => (
        d.set(t, { id: t, key: a, node: y, activatorNode: x, data: E }),
        () => {
          let e = d.get(t);
          e && e.key === a && d.delete(t);
        }
      ),
      [d, t],
    ),
    {
      active: c,
      activatorEvent: s,
      activeNodeRect: l,
      attributes: (0, f.useMemo)(
        () => ({
          role: m,
          tabIndex: g,
          "aria-disabled": r,
          "aria-pressed": _ && m === on ? !0 : void 0,
          "aria-roledescription": h,
          "aria-describedby": u.draggable,
        }),
        [r, m, g, _, h, u.draggable],
      ),
      isDragging: _,
      listeners: r ? void 0 : w,
      node: y,
      over: p,
      setNodeRef: b,
      setActivatorNodeRef: C,
      transform: v,
    }
  );
}
function ln() {
  return (0, f.useContext)(Yt);
}
var un = `Droppable`,
  dn = { timeout: 25 };
function fn(e) {
  let { data: t, disabled: n = !1, id: r, resizeObserverConfig: i } = e,
    a = te(un),
    {
      active: o,
      dispatch: s,
      over: c,
      measureDroppableContainers: l,
    } = (0, f.useContext)(Jt),
    u = (0, f.useRef)({ disabled: n }),
    d = (0, f.useRef)(!1),
    p = (0, f.useRef)(null),
    m = (0, f.useRef)(null),
    { disabled: h, updateMeasurementsFor: g, timeout: _ } = { ...dn, ...i },
    v = T(g ?? r),
    y = Dt({
      callback: (0, f.useCallback)(() => {
        if (!d.current) {
          d.current = !0;
          return;
        }
        (m.current != null && clearTimeout(m.current),
          (m.current = setTimeout(() => {
            (l(Array.isArray(v.current) ? v.current : [v.current]),
              (m.current = null));
          }, _)));
      }, [_]),
      disabled: h || !o,
    }),
    [b, x] = D(
      (0, f.useCallback)(
        (e, t) => {
          y && (t && (y.unobserve(t), (d.current = !1)), e && y.observe(e));
        },
        [y],
      ),
    ),
    S = T(t);
  return (
    (0, f.useEffect)(() => {
      !y ||
        !b.current ||
        (y.disconnect(), (d.current = !1), y.observe(b.current));
    }, [b, y]),
    (0, f.useEffect)(
      () => (
        s({
          type: L.RegisterDroppable,
          element: { id: r, key: a, disabled: n, node: b, rect: p, data: S },
        }),
        () => s({ type: L.UnregisterDroppable, key: a, id: r })
      ),
      [r],
    ),
    (0, f.useEffect)(() => {
      n !== u.current.disabled &&
        (s({ type: L.SetDroppableDisabled, id: r, key: a, disabled: n }),
        (u.current.disabled = n));
    }, [r, a, n, s]),
    { active: o, rect: p, isOver: c?.id === r, node: b, over: c, setNodeRef: x }
  );
}
function pn(e) {
  let { animation: t, children: n } = e,
    [r, i] = (0, f.useState)(null),
    [a, o] = (0, f.useState)(null),
    s = O(n);
  return (
    !n && !r && s && i(s),
    S(() => {
      if (!a) return;
      let e = r?.key,
        n = r?.props.id;
      if (e == null || n == null) {
        i(null);
        return;
      }
      Promise.resolve(t(n, a)).then(() => {
        i(null);
      });
    }, [t, r, a]),
    f.createElement(
      f.Fragment,
      null,
      n,
      r ? (0, f.cloneElement)(r, { ref: o }) : null,
    )
  );
}
var mn = { x: 0, y: 0, scaleX: 1, scaleY: 1 };
function hn(e) {
  let { children: t } = e;
  return f.createElement(
    Jt.Provider,
    { value: qt },
    f.createElement(nn.Provider, { value: mn }, t),
  );
}
var gn = { position: `fixed`, touchAction: `none` },
  _n = (e) => (j(e) ? `transform 250ms ease` : void 0),
  vn = (0, f.forwardRef)((e, t) => {
    let {
      as: n,
      activatorEvent: r,
      adjustScale: i,
      children: a,
      className: o,
      rect: s,
      style: c,
      transform: l,
      transition: u = _n,
    } = e;
    if (!s) return null;
    let d = i ? l : { ...l, scaleX: 1, scaleY: 1 },
      p = {
        ...gn,
        width: s.width,
        height: s.height,
        top: s.top,
        left: s.left,
        transform: M.Transform.toString(d),
        transformOrigin: i && r ? H(r, s) : void 0,
        transition: typeof u == `function` ? u(r) : u,
        ...c,
      };
    return f.createElement(n, { className: o, style: p, ref: t }, a);
  }),
  yn = {
    duration: 250,
    easing: `ease`,
    keyframes: (e) => {
      let {
        transform: { initial: t, final: n },
      } = e;
      return [
        { transform: M.Transform.toString(t) },
        { transform: M.Transform.toString(n) },
      ];
    },
    sideEffects: ((e) => (t) => {
      let { active: n, dragOverlay: r } = t,
        i = {},
        { styles: a, className: o } = e;
      if (a != null && a.active)
        for (let [e, t] of Object.entries(a.active))
          t !== void 0 &&
            ((i[e] = n.node.style.getPropertyValue(e)),
            n.node.style.setProperty(e, t));
      if (a != null && a.dragOverlay)
        for (let [e, t] of Object.entries(a.dragOverlay))
          t !== void 0 && r.node.style.setProperty(e, t);
      return (
        o != null && o.active && n.node.classList.add(o.active),
        o != null && o.dragOverlay && r.node.classList.add(o.dragOverlay),
        function () {
          for (let [e, t] of Object.entries(i)) n.node.style.setProperty(e, t);
          o != null && o.active && n.node.classList.remove(o.active);
        }
      );
    })({ styles: { active: { opacity: `0` } } }),
  };
function bn(e) {
  let {
    config: t,
    draggableNodes: n,
    droppableContainers: r,
    measuringConfiguration: i,
  } = e;
  return C((e, a) => {
    if (t === null) return;
    let o = n.get(e);
    if (!o) return;
    let s = o.node.current;
    if (!s) return;
    let c = Bt(a);
    if (!c) return;
    let { transform: l } = _(a).getComputedStyle(a),
      u = K(l);
    if (!u) return;
    let d = typeof t == `function` ? t : xn(t);
    return (
      Ke(s, i.draggable.measure),
      d({
        active: { id: e, data: o.data, node: s, rect: i.draggable.measure(s) },
        draggableNodes: n,
        dragOverlay: { node: a, rect: i.dragOverlay.measure(c) },
        droppableContainers: r,
        measuringConfiguration: i,
        transform: u,
      })
    );
  });
}
function xn(e) {
  let {
    duration: t,
    easing: n,
    sideEffects: r,
    keyframes: i,
  } = { ...yn, ...e };
  return (e) => {
    let { active: a, dragOverlay: o, transform: s, ...c } = e;
    if (!t) return;
    let l = { x: o.rect.left - a.rect.left, y: o.rect.top - a.rect.top },
      u = {
        scaleX: s.scaleX === 1 ? 1 : (a.rect.width * s.scaleX) / o.rect.width,
        scaleY: s.scaleY === 1 ? 1 : (a.rect.height * s.scaleY) / o.rect.height,
      },
      d = { x: s.x - l.x, y: s.y - l.y, ...u },
      f = i({
        ...c,
        active: a,
        dragOverlay: o,
        transform: { initial: s, final: d },
      }),
      [p] = f,
      m = f[f.length - 1];
    if (JSON.stringify(p) === JSON.stringify(m)) return;
    let h = r?.({ active: a, dragOverlay: o, ...c }),
      g = o.node.animate(f, { duration: t, easing: n, fill: `forwards` });
    return new Promise((e) => {
      g.onfinish = () => {
        (h?.(), e());
      };
    });
  };
}
var Sn = 0;
function Cn(e) {
  return (0, f.useMemo)(() => {
    if (e != null) return (Sn++, Sn);
  }, [e]);
}
var wn = f.memo((e) => {
    let {
        adjustScale: t = !1,
        children: n,
        dropAnimation: r,
        style: i,
        transition: a,
        modifiers: o,
        wrapperElement: s = `div`,
        className: c,
        zIndex: l = 999,
      } = e,
      {
        activatorEvent: u,
        active: d,
        activeNodeRect: p,
        containerNodeRect: m,
        draggableNodes: h,
        droppableContainers: g,
        dragOverlay: _,
        over: v,
        measuringConfiguration: y,
        scrollableAncestors: b,
        scrollableAncestorRects: x,
        windowRect: S,
      } = ln(),
      C = (0, f.useContext)(nn),
      w = Cn(d?.id),
      T = $t(o, {
        activatorEvent: u,
        active: d,
        activeNodeRect: p,
        containerNodeRect: m,
        draggingNodeRect: _.rect,
        over: v,
        overlayNodeRect: _.rect,
        scrollableAncestors: b,
        scrollableAncestorRects: x,
        transform: C,
        windowRect: S,
      }),
      E = wt(p),
      D = bn({
        config: r,
        draggableNodes: h,
        droppableContainers: g,
        measuringConfiguration: y,
      }),
      O = E ? _.setRef : void 0;
    return f.createElement(
      hn,
      null,
      f.createElement(
        pn,
        { animation: D },
        d && w
          ? f.createElement(
              vn,
              {
                key: w,
                id: d.id,
                ref: O,
                as: s,
                activatorEvent: u,
                adjustScale: t,
                className: c,
                transition: a,
                rect: E,
                style: { zIndex: l, ...i },
                transform: T,
              },
              n,
            )
          : null,
      ),
    );
  }),
  Tn = i(),
  En = n(),
  Dn = [`draft`, `finalized`, `active`, `completed`, `cancelled`],
  On = {
    draft: {
      bg: `bg-secondary`,
      bar: `bg-muted-foreground/50`,
      text: `text-muted-foreground`,
      label: `Draft`,
      icon: d,
    },
    finalized: {
      bg: `bg-blue-500/10`,
      bar: `bg-blue-500`,
      text: `text-blue-600 dark:text-blue-400`,
      label: `Finalized`,
      icon: a,
    },
    active: {
      bg: `bg-status-progress-bg`,
      bar: `bg-status-progress-bar`,
      text: `text-status-progress`,
      label: `Active`,
      icon: u,
    },
    completed: {
      bg: `bg-status-done-bg`,
      bar: `bg-status-done-bar`,
      text: `text-status-done`,
      label: `Completed`,
      icon: c,
    },
    cancelled: {
      bg: `bg-status-cancelled-bg`,
      bar: `bg-status-cancelled-bar`,
      text: `text-status-cancelled`,
      label: `Cancelled`,
      icon: l,
    },
  };
function kn(e) {
  let t = (0, Tn.c)(7),
    { phase: n } = e,
    r = On[n],
    i = r.icon,
    a = `${r.text} ${r.bg} border-transparent`,
    s = `mr-1 ${r.text}`,
    c;
  t[0] !== i || t[1] !== s
    ? ((c = (0, En.jsx)(i, { size: 14, className: s })),
      (t[0] = i),
      (t[1] = s),
      (t[2] = c))
    : (c = t[2]);
  let l;
  return (
    t[3] !== r.label || t[4] !== a || t[5] !== c
      ? ((l = (0, En.jsxs)(o, { className: a, children: [c, r.label] })),
        (t[3] = r.label),
        (t[4] = a),
        (t[5] = c),
        (t[6] = l))
      : (l = t[6]),
    l
  );
}
export {
  p as C,
  A as S,
  te as T,
  fn as _,
  wn as a,
  M as b,
  st as c,
  J as d,
  ve as f,
  cn as g,
  ln as h,
  rn as i,
  ye as l,
  we as m,
  kn as n,
  Q as o,
  Y as p,
  On as r,
  nt as s,
  Dn as t,
  be as u,
  z as v,
  S as w,
  j as x,
  he as y,
};
