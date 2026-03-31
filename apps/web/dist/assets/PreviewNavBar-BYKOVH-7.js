import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import {
  A as i,
  D as a,
  E as o,
  G as s,
  Gn as c,
  Kt as l,
  M as u,
  N as d,
  O as f,
  P as p,
  Rn as m,
  Rt as h,
  T as g,
  Un as _,
  Vn as v,
  Vt as y,
  Wn as b,
  Z as x,
  j as S,
  k as C,
  on as w,
  sn as T,
  ur as E,
  w as ee,
  zt as te,
} from "./src-DHCpG1Q-.js";
import { t as D } from "./createReactComponent-C2GWxX5y.js";
import { t as ne } from "./IconAlertTriangle-B1Mqbt3_.js";
import { t as re } from "./IconArchive-6rxbtTQ5.js";
import { t as ie } from "./IconArrowLeft-yF5T69Ob.js";
import { t as ae } from "./IconArrowRight-ooQFWrrR.js";
import { t as O } from "./IconExternalLink-DInhr4-B.js";
import { t as oe } from "./IconGripVertical-DJUodMXs.js";
import { t as se } from "./IconInfoCircle-DJ0cNBVW.js";
import { t as ce } from "./IconPencil-D7oAN1Zq.js";
import { t as le } from "./IconRefresh-BfbGd9fI.js";
import { t as ue } from "./IconTrash-bHTcNORt.js";
var de = D(`outline`, `maximize`, `Maximize`, [
    [`path`, { d: `M4 8v-2a2 2 0 0 1 2 -2h2`, key: `svg-0` }],
    [`path`, { d: `M4 16v2a2 2 0 0 0 2 2h2`, key: `svg-1` }],
    [`path`, { d: `M16 4h2a2 2 0 0 1 2 2v2`, key: `svg-2` }],
    [`path`, { d: `M16 20h2a2 2 0 0 0 2 -2v-2`, key: `svg-3` }],
  ]),
  fe = new Set();
async function pe(e) {
  let t = new URL(e);
  t.protocol === `http:` && (t.protocol = `https:`);
  let n = t.toString(),
    r = t.origin;
  if (!fe.has(r))
    try {
      (await fetch(n, {
        method: `HEAD`,
        mode: `no-cors`,
        headers: { "X-Daytona-Skip-Preview-Warning": `true` },
      }),
        fe.add(r));
    } catch {}
}
var k = n(),
  A = e(t(), 1);
function me(e, t) {
  let n = getComputedStyle(e);
  return t * parseFloat(n.fontSize);
}
function he(e, t) {
  let n = getComputedStyle(e.ownerDocument.body);
  return t * parseFloat(n.fontSize);
}
function ge(e) {
  return (e / 100) * window.innerHeight;
}
function _e(e) {
  return (e / 100) * window.innerWidth;
}
function ve(e) {
  switch (typeof e) {
    case `number`:
      return [e, `px`];
    case `string`: {
      let t = parseFloat(e);
      return e.endsWith(`%`)
        ? [t, `%`]
        : e.endsWith(`px`)
          ? [t, `px`]
          : e.endsWith(`rem`)
            ? [t, `rem`]
            : e.endsWith(`em`)
              ? [t, `em`]
              : e.endsWith(`vh`)
                ? [t, `vh`]
                : e.endsWith(`vw`)
                  ? [t, `vw`]
                  : [t, `%`];
    }
  }
}
function j({ groupSize: e, panelElement: t, styleProp: n }) {
  let r,
    [i, a] = ve(n);
  switch (a) {
    case `%`:
      r = (i / 100) * e;
      break;
    case `px`:
      r = i;
      break;
    case `rem`:
      r = he(t, i);
      break;
    case `em`:
      r = me(t, i);
      break;
    case `vh`:
      r = ge(i);
      break;
    case `vw`:
      r = _e(i);
      break;
  }
  return r;
}
function M(e) {
  return parseFloat(e.toFixed(3));
}
function N({ group: e }) {
  let { orientation: t, panels: n } = e;
  return n.reduce(
    (e, n) => (
      (e +=
        t === `horizontal` ? n.element.offsetWidth : n.element.offsetHeight),
      e
    ),
    0,
  );
}
function ye(e) {
  let { panels: t } = e,
    n = N({ group: e });
  return n === 0
    ? t.map((e) => ({
        collapsedSize: 0,
        collapsible: e.panelConstraints.collapsible === !0,
        defaultSize: void 0,
        disabled: e.panelConstraints.disabled,
        minSize: 0,
        maxSize: 100,
        panelId: e.id,
      }))
    : t.map((e) => {
        let { element: t, panelConstraints: r } = e,
          i = 0;
        r.collapsedSize !== void 0 &&
          (i = M(
            (j({ groupSize: n, panelElement: t, styleProp: r.collapsedSize }) /
              n) *
              100,
          ));
        let a;
        r.defaultSize !== void 0 &&
          (a = M(
            (j({ groupSize: n, panelElement: t, styleProp: r.defaultSize }) /
              n) *
              100,
          ));
        let o = 0;
        r.minSize !== void 0 &&
          (o = M(
            (j({ groupSize: n, panelElement: t, styleProp: r.minSize }) / n) *
              100,
          ));
        let s = 100;
        return (
          r.maxSize !== void 0 &&
            (s = M(
              (j({ groupSize: n, panelElement: t, styleProp: r.maxSize }) / n) *
                100,
            )),
          {
            collapsedSize: i,
            collapsible: r.collapsible === !0,
            defaultSize: a,
            disabled: r.disabled,
            minSize: o,
            maxSize: s,
            panelId: e.id,
          }
        );
      });
}
function P(e, t = `Assertion error`) {
  if (!e) throw Error(t);
}
function be(e, t) {
  return Array.from(t).sort(e === `horizontal` ? xe : Se);
}
function xe(e, t) {
  let n = e.element.offsetLeft - t.element.offsetLeft;
  return n === 0 ? e.element.offsetWidth - t.element.offsetWidth : n;
}
function Se(e, t) {
  let n = e.element.offsetTop - t.element.offsetTop;
  return n === 0 ? e.element.offsetHeight - t.element.offsetHeight : n;
}
function Ce(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `nodeType` in e &&
    e.nodeType === Node.ELEMENT_NODE
  );
}
function we(e, t) {
  return {
    x:
      e.x >= t.left && e.x <= t.right
        ? 0
        : Math.min(Math.abs(e.x - t.left), Math.abs(e.x - t.right)),
    y:
      e.y >= t.top && e.y <= t.bottom
        ? 0
        : Math.min(Math.abs(e.y - t.top), Math.abs(e.y - t.bottom)),
  };
}
function Te({ orientation: e, rects: t, targetRect: n }) {
  let r = { x: n.x + n.width / 2, y: n.y + n.height / 2 },
    i,
    a = Number.MAX_VALUE;
  for (let n of t) {
    let { x: t, y: o } = we(r, n),
      s = e === `horizontal` ? t : o;
    s < a && ((a = s), (i = n));
  }
  return (P(i, `No rect found`), i);
}
var Ee;
function De() {
  return (
    Ee === void 0 &&
      (Ee =
        typeof matchMedia == `function`
          ? !!matchMedia(`(pointer:coarse)`).matches
          : !1),
    Ee
  );
}
function Oe(e) {
  let { element: t, orientation: n, panels: r, separators: i } = e,
    a = be(
      n,
      Array.from(t.children)
        .filter(Ce)
        .map((e) => ({ element: e })),
    ).map(({ element: e }) => e),
    o = [],
    s = !1,
    c = !1,
    l = -1,
    u = -1,
    d = 0,
    f,
    p = [];
  {
    let e = -1;
    for (let t of a)
      t.hasAttribute(`data-panel`) &&
        (e++, t.ariaDisabled === null && (d++, l === -1 && (l = e), (u = e)));
  }
  if (d > 1) {
    let t = -1;
    for (let d of a)
      if (d.hasAttribute(`data-panel`)) {
        t++;
        let i = r.find((e) => e.element === d);
        if (i) {
          if (f) {
            let r = f.element.getBoundingClientRect(),
              a = d.getBoundingClientRect(),
              m;
            if (c) {
              let e =
                  n === `horizontal`
                    ? new DOMRect(r.right, r.top, 0, r.height)
                    : new DOMRect(r.left, r.bottom, r.width, 0),
                t =
                  n === `horizontal`
                    ? new DOMRect(a.left, a.top, 0, a.height)
                    : new DOMRect(a.left, a.top, a.width, 0);
              switch (p.length) {
                case 0:
                  m = [e, t];
                  break;
                case 1: {
                  let i = p[0];
                  m = [
                    i,
                    Te({
                      orientation: n,
                      rects: [r, a],
                      targetRect: i.element.getBoundingClientRect(),
                    }) === r
                      ? t
                      : e,
                  ];
                  break;
                }
                default:
                  m = p;
                  break;
              }
            } else
              m = p.length
                ? p
                : [
                    n === `horizontal`
                      ? new DOMRect(r.right, a.top, a.left - r.right, a.height)
                      : new DOMRect(
                          a.left,
                          r.bottom,
                          a.width,
                          a.top - r.bottom,
                        ),
                  ];
            for (let n of m) {
              let r = `width` in n ? n : n.element.getBoundingClientRect(),
                a = De()
                  ? e.resizeTargetMinimumSize.coarse
                  : e.resizeTargetMinimumSize.fine;
              if (r.width < a) {
                let e = a - r.width;
                r = new DOMRect(r.x - e / 2, r.y, r.width + e, r.height);
              }
              if (r.height < a) {
                let e = a - r.height;
                r = new DOMRect(r.x, r.y - e / 2, r.width, r.height + e);
              }
              (!s &&
                !(t <= l || t > u) &&
                o.push({
                  group: e,
                  groupSize: N({ group: e }),
                  panels: [f, i],
                  separator: `width` in n ? void 0 : n,
                  rect: r,
                }),
                (s = !1));
            }
          }
          ((c = !1), (f = i), (p = []));
        }
      } else if (d.hasAttribute(`data-separator`)) {
        d.ariaDisabled !== null && (s = !0);
        let e = i.find((e) => e.element === d);
        e ? p.push(e) : ((f = void 0), (p = []));
      } else c = !0;
  }
  return o;
}
var ke = class {
  #e = {};
  addListener(e, t) {
    let n = this.#e[e];
    return (
      n === void 0 ? (this.#e[e] = [t]) : n.includes(t) || n.push(t),
      () => {
        this.removeListener(e, t);
      }
    );
  }
  emit(e, t) {
    let n = this.#e[e];
    if (n !== void 0)
      if (n.length === 1) n[0].call(null, t);
      else {
        let e = !1,
          r = null,
          i = Array.from(n);
        for (let n = 0; n < i.length; n++) {
          let a = i[n];
          try {
            a.call(null, t);
          } catch (t) {
            r === null && ((e = !0), (r = t));
          }
        }
        if (e) throw r;
      }
  }
  removeAllListeners() {
    this.#e = {};
  }
  removeListener(e, t) {
    let n = this.#e[e];
    if (n !== void 0) {
      let e = n.indexOf(t);
      e >= 0 && n.splice(e, 1);
    }
  }
};
function F(e, t, n = 0) {
  return Math.abs(M(e) - M(t)) <= n;
}
var I = {
    cursorFlags: 0,
    interactionState: { state: `inactive` },
    mountedGroups: new Map(),
  },
  L = new ke();
function R() {
  return I;
}
function z(e) {
  let t = typeof e == `function` ? e(I) : e;
  if (I === t) return I;
  let n = I;
  return (
    (I = { ...I, ...t }),
    t.cursorFlags !== void 0 && L.emit(`cursorFlagsChange`, I.cursorFlags),
    t.interactionState !== void 0 &&
      L.emit(`interactionStateChange`, I.interactionState),
    t.mountedGroups !== void 0 &&
      (I.mountedGroups.forEach((e, t) => {
        e.derivedPanelConstraints.forEach((r) => {
          if (r.collapsible) {
            let { layout: i } = n.mountedGroups.get(t) ?? {};
            if (i) {
              let n = F(r.collapsedSize, e.layout[r.panelId]),
                a = F(r.collapsedSize, i[r.panelId]);
              n &&
                !a &&
                (t.inMemoryLastExpandedPanelSizes[r.panelId] = i[r.panelId]);
            }
          }
        });
      }),
      L.emit(`mountedGroupsChange`, I.mountedGroups)),
    I
  );
}
function Ae(e, t, n) {
  let r,
    i = { x: 1 / 0, y: 1 / 0 };
  for (let a of t) {
    let t = we(n, a.rect);
    switch (e) {
      case `horizontal`:
        t.x <= i.x && ((r = a), (i = t));
        break;
      case `vertical`:
        t.y <= i.y && ((r = a), (i = t));
        break;
    }
  }
  return r ? { distance: i, hitRegion: r } : void 0;
}
function je(e) {
  return (
    typeof e == `object` &&
    !!e &&
    `nodeType` in e &&
    e.nodeType === Node.DOCUMENT_FRAGMENT_NODE
  );
}
function Me(e, t) {
  if (e === t) throw Error(`Cannot compare node with itself`);
  let n = { a: Re(e), b: Re(t) },
    r;
  for (; n.a.at(-1) === n.b.at(-1); ) ((r = n.a.pop()), n.b.pop());
  P(
    r,
    `Stacking order can only be calculated for elements with a common ancestor`,
  );
  let i = { a: Le(Ie(n.a)), b: Le(Ie(n.b)) };
  if (i.a === i.b) {
    let e = r.childNodes,
      t = { a: n.a.at(-1), b: n.b.at(-1) },
      i = e.length;
    for (; i--; ) {
      let n = e[i];
      if (n === t.a) return 1;
      if (n === t.b) return -1;
    }
  }
  return Math.sign(i.a - i.b);
}
var Ne =
  /\b(?:position|zIndex|opacity|transform|webkitTransform|mixBlendMode|filter|webkitFilter|isolation)\b/;
function Pe(e) {
  let t = getComputedStyle(ze(e) ?? e).display;
  return t === `flex` || t === `inline-flex`;
}
function Fe(e) {
  let t = getComputedStyle(e);
  return !!(
    t.position === `fixed` ||
    (t.zIndex !== `auto` && (t.position !== `static` || Pe(e))) ||
    +t.opacity < 1 ||
    (`transform` in t && t.transform !== `none`) ||
    (`webkitTransform` in t && t.webkitTransform !== `none`) ||
    (`mixBlendMode` in t && t.mixBlendMode !== `normal`) ||
    (`filter` in t && t.filter !== `none`) ||
    (`webkitFilter` in t && t.webkitFilter !== `none`) ||
    (`isolation` in t && t.isolation === `isolate`) ||
    Ne.test(t.willChange) ||
    t.webkitOverflowScrolling === `touch`
  );
}
function Ie(e) {
  let t = e.length;
  for (; t--; ) {
    let n = e[t];
    if ((P(n, `Missing node`), Fe(n))) return n;
  }
  return null;
}
function Le(e) {
  return (e && Number(getComputedStyle(e).zIndex)) || 0;
}
function Re(e) {
  let t = [];
  for (; e; ) (t.push(e), (e = ze(e)));
  return t;
}
function ze(e) {
  let { parentNode: t } = e;
  return je(t) ? t.host : t;
}
function Be(e, t) {
  return (
    e.x < t.x + t.width &&
    e.x + e.width > t.x &&
    e.y < t.y + t.height &&
    e.y + e.height > t.y
  );
}
function Ve({ groupElement: e, hitRegion: t, pointerEventTarget: n }) {
  if (!Ce(n) || n.contains(e) || e.contains(n)) return !0;
  if (Me(n, e) > 0) {
    let r = n;
    for (; r; ) {
      if (r.contains(e)) return !0;
      if (Be(r.getBoundingClientRect(), t)) return !1;
      r = r.parentElement;
    }
  }
  return !0;
}
function B(e, t) {
  let n = [];
  return (
    t.forEach((t, r) => {
      if (r.disabled) return;
      let i = Oe(r),
        a = Ae(r.orientation, i, { x: e.clientX, y: e.clientY });
      a &&
        a.distance.x <= 0 &&
        a.distance.y <= 0 &&
        Ve({
          groupElement: r.element,
          hitRegion: a.hitRegion.rect,
          pointerEventTarget: e.target,
        }) &&
        n.push(a.hitRegion);
    }),
    n
  );
}
function He(e, t) {
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++) if (e[n] != t[n]) return !1;
  return !0;
}
function V(e, t) {
  return F(e, t) ? 0 : e > t ? 1 : -1;
}
function H({
  overrideDisabledPanels: e,
  panelConstraints: t,
  prevSize: n,
  size: r,
}) {
  let {
    collapsedSize: i = 0,
    collapsible: a,
    disabled: o,
    maxSize: s = 100,
    minSize: c = 0,
  } = t;
  if (o && !e) return n;
  if (V(r, c) < 0)
    if (a) {
      let e = (i + c) / 2;
      r = V(r, e) < 0 ? i : c;
    } else r = c;
  return ((r = Math.min(s, r)), (r = M(r)), r);
}
function U({
  delta: e,
  initialLayout: t,
  panelConstraints: n,
  pivotIndices: r,
  prevLayout: i,
  trigger: a,
}) {
  if (F(e, 0)) return t;
  let o = a === `imperative-api`,
    s = Object.values(t),
    c = Object.values(i),
    l = [...s],
    [u, d] = r;
  (P(u != null, `Invalid first pivot index`),
    P(d != null, `Invalid second pivot index`));
  let f = 0;
  switch (a) {
    case `keyboard`:
      {
        let t = e < 0 ? d : u,
          r = n[t];
        P(r, `Panel constraints not found for index ${t}`);
        let { collapsedSize: i = 0, collapsible: a, minSize: o = 0 } = r;
        if (a) {
          let n = s[t];
          if (
            (P(n != null, `Previous layout not found for panel index ${t}`),
            F(n, i))
          ) {
            let t = o - n;
            V(t, Math.abs(e)) > 0 && (e = e < 0 ? 0 - t : t);
          }
        }
      }
      {
        let t = e < 0 ? u : d,
          r = n[t];
        P(r, `No panel constraints found for index ${t}`);
        let { collapsedSize: i = 0, collapsible: a, minSize: o = 0 } = r;
        if (a) {
          let n = s[t];
          if (
            (P(n != null, `Previous layout not found for panel index ${t}`),
            F(n, o))
          ) {
            let t = n - i;
            V(t, Math.abs(e)) > 0 && (e = e < 0 ? 0 - t : t);
          }
        }
      }
      break;
    default: {
      let t = e < 0 ? d : u,
        r = n[t];
      P(r, `Panel constraints not found for index ${t}`);
      let i = s[t],
        { collapsible: a, collapsedSize: o, minSize: c } = r;
      if (a && V(i, c) < 0)
        if (e > 0) {
          let t = c - o,
            n = t / 2;
          V(i + e, c) < 0 && (e = V(e, n) <= 0 ? 0 : t);
        } else {
          let t = c - o,
            n = 100 - t / 2;
          V(i - e, c) < 0 && (e = V(100 + e, n) > 0 ? 0 : -t);
        }
      break;
    }
  }
  {
    let t = e < 0 ? 1 : -1,
      r = e < 0 ? d : u,
      i = 0;
    for (;;) {
      let e = s[r];
      P(e != null, `Previous layout not found for panel index ${r}`);
      let a =
        H({
          overrideDisabledPanels: o,
          panelConstraints: n[r],
          prevSize: e,
          size: 100,
        }) - e;
      if (((i += a), (r += t), r < 0 || r >= n.length)) break;
    }
    let a = Math.min(Math.abs(e), Math.abs(i));
    e = e < 0 ? 0 - a : a;
  }
  {
    let t = e < 0 ? u : d;
    for (; t >= 0 && t < n.length; ) {
      let r = Math.abs(e) - Math.abs(f),
        i = s[t];
      P(i != null, `Previous layout not found for panel index ${t}`);
      let a = i - r,
        c = H({
          overrideDisabledPanels: o,
          panelConstraints: n[t],
          prevSize: i,
          size: a,
        });
      if (
        !F(i, c) &&
        ((f += i - c),
        (l[t] = c),
        f
          .toFixed(3)
          .localeCompare(Math.abs(e).toFixed(3), void 0, { numeric: !0 }) >= 0)
      )
        break;
      e < 0 ? t-- : t++;
    }
  }
  if (He(c, l)) return i;
  {
    let t = e < 0 ? d : u,
      r = s[t];
    P(r != null, `Previous layout not found for panel index ${t}`);
    let i = r + f,
      a = H({
        overrideDisabledPanels: o,
        panelConstraints: n[t],
        prevSize: r,
        size: i,
      });
    if (((l[t] = a), !F(a, i))) {
      let t = i - a,
        r = e < 0 ? d : u;
      for (; r >= 0 && r < n.length; ) {
        let i = l[r];
        P(i != null, `Previous layout not found for panel index ${r}`);
        let a = i + t,
          s = H({
            overrideDisabledPanels: o,
            panelConstraints: n[r],
            prevSize: i,
            size: a,
          });
        if ((F(i, s) || ((t -= s - i), (l[r] = s)), F(t, 0))) break;
        e > 0 ? r-- : r++;
      }
    }
  }
  if (
    !F(
      Object.values(l).reduce((e, t) => t + e, 0),
      100,
      0.1,
    )
  )
    return i;
  let p = Object.keys(i);
  return l.reduce((e, t, n) => ((e[p[n]] = t), e), {});
}
function W(e, t) {
  if (Object.keys(e).length !== Object.keys(t).length) return !1;
  for (let n in e) if (t[n] === void 0 || V(e[n], t[n]) !== 0) return !1;
  return !0;
}
function G({ layout: e, panelConstraints: t }) {
  let n = Object.values(e),
    r = [...n],
    i = r.reduce((e, t) => e + t, 0);
  if (r.length !== t.length)
    throw Error(
      `Invalid ${t.length} panel layout: ${r.map((e) => `${e}%`).join(`, `)}`,
    );
  if (!F(i, 100) && r.length > 0)
    for (let e = 0; e < t.length; e++) {
      let t = r[e];
      (P(t != null, `No layout data found for index ${e}`),
        (r[e] = (100 / i) * t));
    }
  let a = 0;
  for (let e = 0; e < t.length; e++) {
    let i = n[e];
    P(i != null, `No layout data found for index ${e}`);
    let o = r[e];
    P(o != null, `No layout data found for index ${e}`);
    let s = H({
      overrideDisabledPanels: !0,
      panelConstraints: t[e],
      prevSize: i,
      size: o,
    });
    o != s && ((a += o - s), (r[e] = s));
  }
  if (!F(a, 0))
    for (let e = 0; e < t.length; e++) {
      let n = r[e];
      P(n != null, `No layout data found for index ${e}`);
      let i = n + a,
        o = H({
          overrideDisabledPanels: !0,
          panelConstraints: t[e],
          prevSize: n,
          size: i,
        });
      if (n !== o && ((a -= o - n), (r[e] = o), F(a, 0))) break;
    }
  let o = Object.keys(e);
  return r.reduce((e, t, n) => ((e[o[n]] = t), e), {});
}
function Ue({ groupId: e, panelId: t }) {
  let n = () => {
      let { mountedGroups: t } = R();
      for (let [
        n,
        {
          defaultLayoutDeferred: r,
          derivedPanelConstraints: i,
          layout: a,
          separatorToPanels: o,
        },
      ] of t)
        if (n.id === e)
          return {
            defaultLayoutDeferred: r,
            derivedPanelConstraints: i,
            group: n,
            layout: a,
            separatorToPanels: o,
          };
      throw Error(`Group ${e} not found`);
    },
    r = () => {
      let e = n().derivedPanelConstraints.find((e) => e.panelId === t);
      if (e !== void 0) return e;
      throw Error(`Panel constraints not found for Panel ${t}`);
    },
    i = () => {
      let e = n().group.panels.find((e) => e.id === t);
      if (e !== void 0) return e;
      throw Error(`Layout not found for Panel ${t}`);
    },
    a = () => {
      let e = n().layout[t];
      if (e !== void 0) return e;
      throw Error(`Layout not found for Panel ${t}`);
    },
    o = (e) => {
      let r = a();
      if (e === r) return;
      let {
          defaultLayoutDeferred: i,
          derivedPanelConstraints: o,
          group: s,
          layout: c,
          separatorToPanels: l,
        } = n(),
        u = s.panels.findIndex((e) => e.id === t),
        d = u === s.panels.length - 1,
        f = G({
          layout: U({
            delta: d ? r - e : e - r,
            initialLayout: c,
            panelConstraints: o,
            pivotIndices: d ? [u - 1, u] : [u, u + 1],
            prevLayout: c,
            trigger: `imperative-api`,
          }),
          panelConstraints: o,
        });
      W(c, f) ||
        z((e) => ({
          mountedGroups: new Map(e.mountedGroups).set(s, {
            defaultLayoutDeferred: i,
            derivedPanelConstraints: o,
            layout: f,
            separatorToPanels: l,
          }),
        }));
    };
  return {
    collapse: () => {
      let { collapsible: e, collapsedSize: t } = r(),
        { mutableValues: n } = i(),
        s = a();
      e && s !== t && ((n.expandToSize = s), o(t));
    },
    expand: () => {
      let { collapsible: e, collapsedSize: t, minSize: n } = r(),
        { mutableValues: s } = i(),
        c = a();
      if (e && c === t) {
        let e = s.expandToSize ?? n;
        (e === 0 && (e = 1), o(e));
      }
    },
    getSize: () => {
      let { group: e } = n(),
        t = a(),
        { element: r } = i();
      return {
        asPercentage: t,
        inPixels:
          e.orientation === `horizontal` ? r.offsetWidth : r.offsetHeight,
      };
    },
    isCollapsed: () => {
      let { collapsible: e, collapsedSize: t } = r(),
        n = a();
      return e && F(t, n);
    },
    resize: (e) => {
      if (a() !== e) {
        let t;
        switch (typeof e) {
          case `number`: {
            let { group: r } = n();
            t = M((e / N({ group: r })) * 100);
            break;
          }
          case `string`:
            t = parseFloat(e);
            break;
        }
        o(t);
      }
    },
  };
}
function We(e) {
  if (e.defaultPrevented) return;
  let { mountedGroups: t } = R();
  B(e, t).forEach((t) => {
    if (t.separator) {
      let n = t.panels.find((e) => e.panelConstraints.defaultSize !== void 0);
      if (n) {
        let r = n.panelConstraints.defaultSize,
          i = Ue({ groupId: t.group.id, panelId: n.id });
        i && r !== void 0 && (i.resize(r), e.preventDefault());
      }
    }
  });
}
function K(e) {
  let { mountedGroups: t } = R();
  for (let [n] of t) if (n.separators.some((t) => t.element === e)) return n;
  throw Error(`Could not find parent Group for separator element`);
}
function Ge({ groupId: e }) {
  let t = () => {
    let { mountedGroups: t } = R();
    for (let [n, r] of t) if (n.id === e) return { group: n, ...r };
    throw Error(`Could not find Group with id "${e}"`);
  };
  return {
    getLayout() {
      let { defaultLayoutDeferred: e, layout: n } = t();
      return e ? {} : n;
    },
    setLayout(e) {
      let {
          defaultLayoutDeferred: n,
          derivedPanelConstraints: r,
          group: i,
          layout: a,
          separatorToPanels: o,
        } = t(),
        s = G({ layout: e, panelConstraints: r });
      if (n) return a;
      if (!W(a, s)) {
        z((e) => ({
          mountedGroups: new Map(e.mountedGroups).set(i, {
            defaultLayoutDeferred: n,
            derivedPanelConstraints: r,
            layout: s,
            separatorToPanels: o,
          }),
        }));
        let e = i.panels.map(({ id: e }) => e).join(`,`);
        i.inMemoryLayouts[e] = s;
      }
      return s;
    },
  };
}
function Ke(e) {
  let { mountedGroups: t } = R(),
    n = t.get(e);
  return (P(n, `Mounted Group ${e.id} not found`), n);
}
function q(e, t) {
  let n = K(e),
    r = Ke(n),
    i = n.separators.find((t) => t.element === e);
  P(i, `Matching separator not found`);
  let a = r.separatorToPanels.get(i);
  P(a, `Matching panels not found`);
  let o = a.map((e) => n.panels.indexOf(e)),
    s = Ge({ groupId: n.id }).getLayout(),
    c = G({
      layout: U({
        delta: t,
        initialLayout: s,
        panelConstraints: r.derivedPanelConstraints,
        pivotIndices: o,
        prevLayout: s,
        trigger: `keyboard`,
      }),
      panelConstraints: r.derivedPanelConstraints,
    });
  W(s, c) ||
    z((e) => ({
      mountedGroups: new Map(e.mountedGroups).set(n, {
        defaultLayoutDeferred: r.defaultLayoutDeferred,
        derivedPanelConstraints: r.derivedPanelConstraints,
        layout: c,
        separatorToPanels: r.separatorToPanels,
      }),
    }));
}
function qe(e) {
  if (e.defaultPrevented) return;
  let t = e.currentTarget,
    n = K(t);
  if (!n.disabled)
    switch (e.key) {
      case `ArrowDown`:
        (e.preventDefault(), n.orientation === `vertical` && q(t, 5));
        break;
      case `ArrowLeft`:
        (e.preventDefault(), n.orientation === `horizontal` && q(t, -5));
        break;
      case `ArrowRight`:
        (e.preventDefault(), n.orientation === `horizontal` && q(t, 5));
        break;
      case `ArrowUp`:
        (e.preventDefault(), n.orientation === `vertical` && q(t, -5));
        break;
      case `End`:
        (e.preventDefault(), q(t, 100));
        break;
      case `Enter`: {
        e.preventDefault();
        let n = K(t),
          {
            derivedPanelConstraints: r,
            layout: i,
            separatorToPanels: a,
          } = Ke(n),
          o = n.separators.find((e) => e.element === t);
        P(o, `Matching separator not found`);
        let s = a.get(o);
        P(s, `Matching panels not found`);
        let c = s[0],
          l = r.find((e) => e.panelId === c.id);
        if ((P(l, `Panel metadata not found`), l.collapsible)) {
          let e = i[c.id];
          q(
            t,
            (l.collapsedSize === e
              ? (n.inMemoryLastExpandedPanelSizes[c.id] ?? l.minSize)
              : l.collapsedSize) - e,
          );
        }
        break;
      }
      case `F6`: {
        e.preventDefault();
        let n = K(t).separators.map((e) => e.element),
          r = Array.from(n).findIndex((t) => t === e.currentTarget);
        (P(r !== null, `Index not found`),
          n[
            e.shiftKey
              ? r > 0
                ? r - 1
                : n.length - 1
              : r + 1 < n.length
                ? r + 1
                : 0
          ].focus());
        break;
      }
      case `Home`:
        (e.preventDefault(), q(t, -100));
        break;
    }
}
function Je(e) {
  if (e.defaultPrevented || (e.pointerType === `mouse` && e.button > 0)) return;
  let { mountedGroups: t } = R(),
    n = B(e, t),
    r = new Map(),
    i = !1;
  (n.forEach((e) => {
    e.separator && (i || ((i = !0), e.separator.element.focus()));
    let n = t.get(e.group);
    n && r.set(e.group, n.layout);
  }),
    z({
      interactionState: {
        hitRegions: n,
        initialLayoutMap: r,
        pointerDownAtPoint: { x: e.clientX, y: e.clientY },
        state: `active`,
      },
    }),
    n.length && e.preventDefault());
}
var Ye = (e) => e,
  Xe = () => {},
  Ze = 1,
  Qe = 2,
  $e = 4,
  et = 8,
  tt = 3,
  nt = 12,
  J;
function rt() {
  return (
    J === void 0 &&
      ((J = !1),
      typeof window < `u` &&
        (window.navigator.userAgent.includes(`Chrome`) ||
          window.navigator.userAgent.includes(`Firefox`)) &&
        (J = !0)),
    J
  );
}
function it({ cursorFlags: e, groups: t, state: n }) {
  let r = 0,
    i = 0;
  switch (n) {
    case `active`:
    case `hover`:
      t.forEach((e) => {
        if (!e.disableCursor)
          switch (e.orientation) {
            case `horizontal`:
              r++;
              break;
            case `vertical`:
              i++;
              break;
          }
      });
  }
  if (!(r === 0 && i === 0)) {
    switch (n) {
      case `active`:
        if (e && rt()) {
          let t = (e & Ze) !== 0,
            n = (e & Qe) !== 0,
            r = (e & $e) !== 0,
            i = (e & et) !== 0;
          if (t) return r ? `se-resize` : i ? `ne-resize` : `e-resize`;
          if (n) return r ? `sw-resize` : i ? `nw-resize` : `w-resize`;
          if (r) return `s-resize`;
          if (i) return `n-resize`;
        }
        break;
    }
    return rt()
      ? r > 0 && i > 0
        ? `move`
        : r > 0
          ? `ew-resize`
          : `ns-resize`
      : r > 0 && i > 0
        ? `grab`
        : r > 0
          ? `col-resize`
          : `row-resize`;
  }
}
var at = new WeakMap();
function ot(e) {
  if (e.defaultView === null || e.defaultView === void 0) return;
  let { prevStyle: t, styleSheet: n } = at.get(e) ?? {};
  n === void 0 &&
    ((n = new e.defaultView.CSSStyleSheet()), e.adoptedStyleSheets.push(n));
  let { cursorFlags: r, interactionState: i } = R();
  switch (i.state) {
    case `active`:
    case `hover`: {
      let e = it({
          cursorFlags: r,
          groups: i.hitRegions.map((e) => e.group),
          state: i.state,
        }),
        a = `*, *:hover {cursor: ${e} !important; ${i.state === `active` ? `touch-action: none;` : ``} }`;
      if (t === a) return;
      ((t = a),
        e
          ? n.cssRules.length === 0
            ? n.insertRule(a)
            : n.replaceSync(a)
          : n.cssRules.length === 1 && n.deleteRule(0));
      break;
    }
    case `inactive`:
      ((t = void 0), n.cssRules.length === 1 && n.deleteRule(0));
      break;
  }
  at.set(e, { prevStyle: t, styleSheet: n });
}
function st({
  document: e,
  event: t,
  hitRegions: n,
  initialLayoutMap: r,
  mountedGroups: i,
  pointerDownAtPoint: a,
  prevCursorFlags: o,
}) {
  let s = 0,
    c = new Map(i);
  n.forEach((e) => {
    let { group: n, groupSize: o } = e,
      { disableCursor: l, orientation: u, panels: d } = n,
      f = 0;
    f = a
      ? u === `horizontal`
        ? ((t.clientX - a.x) / o) * 100
        : ((t.clientY - a.y) / o) * 100
      : u === `horizontal`
        ? t.clientX < 0
          ? -100
          : 100
        : t.clientY < 0
          ? -100
          : 100;
    let p = r.get(n),
      {
        defaultLayoutDeferred: m,
        derivedPanelConstraints: h,
        layout: g,
        separatorToPanels: _,
      } = i.get(n) ?? { defaultLayoutDeferred: !1 };
    if (h && p && g && _) {
      let t = U({
        delta: f,
        initialLayout: p,
        panelConstraints: h,
        pivotIndices: e.panels.map((e) => d.indexOf(e)),
        prevLayout: g,
        trigger: `mouse-or-touch`,
      });
      if (W(t, g)) {
        if (f !== 0 && !l)
          switch (u) {
            case `horizontal`:
              s |= f < 0 ? Ze : Qe;
              break;
            case `vertical`:
              s |= f < 0 ? $e : et;
              break;
          }
      } else {
        c.set(e.group, {
          defaultLayoutDeferred: m,
          derivedPanelConstraints: h,
          layout: t,
          separatorToPanels: _,
        });
        let n = e.group.panels.map(({ id: e }) => e).join(`,`);
        e.group.inMemoryLayouts[n] = t;
      }
    }
  });
  let l = 0;
  (t.movementX === 0 ? (l |= o & tt) : (l |= s & tt),
    t.movementY === 0 ? (l |= o & nt) : (l |= s & nt),
    z({ cursorFlags: l, mountedGroups: c }),
    ot(e));
}
function ct(e) {
  let { cursorFlags: t, interactionState: n, mountedGroups: r } = R();
  switch (n.state) {
    case `active`:
      st({
        document: e.currentTarget,
        event: e,
        hitRegions: n.hitRegions,
        initialLayoutMap: n.initialLayoutMap,
        mountedGroups: r,
        prevCursorFlags: t,
      });
  }
}
function lt(e) {
  if (e.defaultPrevented) return;
  let { cursorFlags: t, interactionState: n, mountedGroups: r } = R();
  switch (n.state) {
    case `active`:
      if (e.buttons === 0) {
        (z((e) =>
          e.interactionState.state === `inactive`
            ? e
            : { cursorFlags: 0, interactionState: { state: `inactive` } },
        ),
          z((e) => ({ mountedGroups: new Map(e.mountedGroups) })));
        return;
      }
      st({
        document: e.currentTarget,
        event: e,
        hitRegions: n.hitRegions,
        initialLayoutMap: n.initialLayoutMap,
        mountedGroups: r,
        pointerDownAtPoint: n.pointerDownAtPoint,
        prevCursorFlags: t,
      });
      break;
    default: {
      let t = B(e, r);
      (t.length === 0
        ? n.state !== `inactive` &&
          z({ interactionState: { state: `inactive` } })
        : z({ interactionState: { hitRegions: t, state: `hover` } }),
        ot(e.currentTarget));
      break;
    }
  }
}
function ut(e) {
  if (e.relatedTarget instanceof HTMLIFrameElement) {
    let { interactionState: e } = R();
    switch (e.state) {
      case `hover`:
        z({ interactionState: { state: `inactive` } });
    }
  }
}
function dt(e) {
  if (e.defaultPrevented || (e.pointerType === `mouse` && e.button > 0)) return;
  let { interactionState: t } = R();
  switch (t.state) {
    case `active`:
      (z({ cursorFlags: 0, interactionState: { state: `inactive` } }),
        t.hitRegions.length > 0 &&
          (ot(e.currentTarget),
          z((e) => ({ mountedGroups: new Map(e.mountedGroups) })),
          e.preventDefault()));
  }
}
function ft(e) {
  let t = 0,
    n = 0,
    r = {};
  for (let i of e)
    if (i.defaultSize !== void 0) {
      t++;
      let e = M(i.defaultSize);
      ((n += e), (r[i.panelId] = e));
    } else r[i.panelId] = void 0;
  let i = e.length - t;
  if (i !== 0) {
    let t = M((100 - n) / i);
    for (let n of e) n.defaultSize === void 0 && (r[n.panelId] = t);
  }
  return r;
}
function pt(e, t, n) {
  if (!n[0]) return;
  let r = e.panels.find((e) => e.element === t);
  if (!r || !r.onResize) return;
  let i = N({ group: e }),
    a =
      e.orientation === `horizontal`
        ? r.element.offsetWidth
        : r.element.offsetHeight,
    o = r.mutableValues.prevSize,
    s = { asPercentage: M((a / i) * 100), inPixels: a };
  ((r.mutableValues.prevSize = s), r.onResize(s, r.id, o));
}
function mt(e, t) {
  if (Object.keys(e).length !== Object.keys(t).length) return !1;
  for (let n in e) if (e[n] !== t[n]) return !1;
  return !0;
}
function ht(e, t) {
  let n = e.map((e) => e.id),
    r = Object.keys(t);
  if (n.length !== r.length) return !1;
  for (let e of n) if (!r.includes(e)) return !1;
  return !0;
}
var Y = new Map();
function gt(e) {
  let t = !0;
  P(e.element.ownerDocument.defaultView, `Cannot register an unmounted Group`);
  let n = e.element.ownerDocument.defaultView.ResizeObserver,
    r = new Set(),
    i = new Set(),
    a = new n((n) => {
      for (let r of n) {
        let { borderBoxSize: n, target: i } = r;
        if (i === e.element) {
          if (t) {
            if (N({ group: e }) === 0) return;
            z((t) => {
              let n = t.mountedGroups.get(e);
              if (n) {
                let r = ye(e),
                  i = n.defaultLayoutDeferred ? ft(r) : n.layout,
                  a = G({ layout: i, panelConstraints: r });
                return !n.defaultLayoutDeferred &&
                  W(i, a) &&
                  mt(n.derivedPanelConstraints, r)
                  ? t
                  : {
                      mountedGroups: new Map(t.mountedGroups).set(e, {
                        defaultLayoutDeferred: !1,
                        derivedPanelConstraints: r,
                        layout: a,
                        separatorToPanels: n.separatorToPanels,
                      }),
                    };
              }
              return t;
            });
          }
        } else pt(e, i, n);
      }
    });
  (a.observe(e.element),
    e.panels.forEach((e) => {
      (P(
        !r.has(e.id),
        `Panel ids must be unique; id "${e.id}" was used more than once`,
      ),
        r.add(e.id),
        e.onResize && a.observe(e.element));
    }));
  let o = N({ group: e }),
    s = ye(e),
    c = e.panels.map(({ id: e }) => e).join(`,`),
    l = e.defaultLayout;
  l && (ht(e.panels, l) || (l = void 0));
  let u = G({
      layout: e.inMemoryLayouts[c] ?? l ?? ft(s),
      panelConstraints: s,
    }),
    d = Oe(e),
    f = e.element.ownerDocument;
  return (
    z((t) => {
      let n = new Map();
      return (
        Y.set(f, (Y.get(f) ?? 0) + 1),
        d.forEach((e) => {
          e.separator && n.set(e.separator, e.panels);
        }),
        {
          mountedGroups: new Map(t.mountedGroups).set(e, {
            defaultLayoutDeferred: o === 0,
            derivedPanelConstraints: s,
            layout: u,
            separatorToPanels: n,
          }),
        }
      );
    }),
    e.separators.forEach((e) => {
      (P(
        !i.has(e.id),
        `Separator ids must be unique; id "${e.id}" was used more than once`,
      ),
        i.add(e.id),
        e.element.addEventListener(`keydown`, qe));
    }),
    Y.get(f) === 1 &&
      (f.addEventListener(`dblclick`, We, !0),
      f.addEventListener(`pointerdown`, Je, !0),
      f.addEventListener(`pointerleave`, ct),
      f.addEventListener(`pointermove`, lt),
      f.addEventListener(`pointerout`, ut),
      f.addEventListener(`pointerup`, dt, !0)),
    function () {
      ((t = !1),
        Y.set(f, Math.max(0, (Y.get(f) ?? 0) - 1)),
        z((t) => {
          let n = new Map(t.mountedGroups);
          return (n.delete(e), { mountedGroups: n });
        }),
        e.separators.forEach((e) => {
          e.element.removeEventListener(`keydown`, qe);
        }),
        Y.get(f) ||
          (f.removeEventListener(`dblclick`, We, !0),
          f.removeEventListener(`pointerdown`, Je, !0),
          f.removeEventListener(`pointerleave`, ct),
          f.removeEventListener(`pointermove`, lt),
          f.removeEventListener(`pointerout`, ut),
          f.removeEventListener(`pointerup`, dt, !0)),
        a.disconnect());
    }
  );
}
function _t() {
  let [e, t] = (0, A.useState)({});
  return [e, (0, A.useCallback)(() => t({}), [])];
}
function vt(e) {
  let t = (0, A.useId)();
  return `${e ?? t}`;
}
var X = typeof window < `u` ? A.useLayoutEffect : A.useEffect;
function Z(e) {
  let t = (0, A.useRef)(e);
  return (
    X(() => {
      t.current = e;
    }, [e]),
    (0, A.useCallback)((...e) => t.current?.(...e), [t])
  );
}
function yt(...e) {
  return Z((t) => {
    e.forEach((e) => {
      if (e)
        switch (typeof e) {
          case `function`:
            e(t);
            break;
          case `object`:
            e.current = t;
            break;
        }
    });
  });
}
function Q(e) {
  let t = (0, A.useRef)({ ...e });
  return (
    X(() => {
      for (let n in e) t.current[n] = e[n];
    }, [e]),
    t.current
  );
}
var bt = (0, A.createContext)(null);
function xt(e, t) {
  let n = (0, A.useRef)({ getLayout: () => ({}), setLayout: Ye });
  ((0, A.useImperativeHandle)(t, () => n.current, []),
    X(() => {
      Object.assign(n.current, Ge({ groupId: e }));
    }));
}
function St({
  children: e,
  className: t,
  defaultLayout: n,
  disableCursor: r,
  disabled: i,
  elementRef: a,
  groupRef: o,
  id: s,
  onLayoutChange: c,
  onLayoutChanged: l,
  orientation: u = `horizontal`,
  resizeTargetMinimumSize: d = { coarse: 20, fine: 10 },
  style: f,
  ...p
}) {
  let m = (0, A.useRef)({ onLayoutChange: {}, onLayoutChanged: {} }),
    h = Z((e) => {
      W(m.current.onLayoutChange, e) ||
        ((m.current.onLayoutChange = e), c?.(e));
    }),
    g = Z((e) => {
      W(m.current.onLayoutChanged, e) ||
        ((m.current.onLayoutChanged = e), l?.(e));
    }),
    _ = vt(s),
    v = (0, A.useRef)(null),
    [y, b] = _t(),
    x = (0, A.useRef)({
      lastExpandedPanelSizes: {},
      layouts: {},
      panels: [],
      resizeTargetMinimumSize: d,
      separators: [],
    }),
    S = yt(v, a);
  xt(_, o);
  let C = Z((e, t) => {
      let { interactionState: r, mountedGroups: i } = R();
      for (let n of i.keys())
        if (n.id === e) {
          let e = i.get(n);
          if (e) {
            let i = !1;
            switch (r.state) {
              case `active`:
                i = r.hitRegions.some((e) => e.group === n);
                break;
            }
            return {
              flexGrow: e.layout[t] ?? 1,
              pointerEvents: i ? `none` : void 0,
            };
          }
        }
      return { flexGrow: n?.[t] ?? 1 };
    }),
    w = Q({ defaultLayout: n, disableCursor: r }),
    T = (0, A.useMemo)(
      () => ({
        get disableCursor() {
          return !!w.disableCursor;
        },
        getPanelStyles: C,
        id: _,
        orientation: u,
        registerPanel: (e) => {
          let t = x.current;
          return (
            (t.panels = be(u, [...t.panels, e])),
            b(),
            () => {
              ((t.panels = t.panels.filter((t) => t !== e)), b());
            }
          );
        },
        registerSeparator: (e) => {
          let t = x.current;
          return (
            (t.separators = be(u, [...t.separators, e])),
            b(),
            () => {
              ((t.separators = t.separators.filter((t) => t !== e)), b());
            }
          );
        },
        togglePanelDisabled: (e, t) => {
          let n = x.current.panels.find((t) => t.id === e);
          n && (n.panelConstraints.disabled = t);
          let { mountedGroups: r } = R();
          for (let e of r.keys())
            if (e.id === _) {
              let t = r.get(e);
              t && (t.derivedPanelConstraints = ye(e));
            }
        },
        toggleSeparatorDisabled: (e, t) => {
          let n = x.current.separators.find((t) => t.id === e);
          n && (n.disabled = t);
        },
      }),
      [C, _, b, u, w],
    ),
    E = (0, A.useRef)(null);
  return (
    X(() => {
      let e = v.current;
      if (e === null) return;
      let t = x.current,
        n;
      if (
        w.defaultLayout !== void 0 &&
        Object.keys(w.defaultLayout).length === t.panels.length
      ) {
        n = {};
        for (let e of t.panels) {
          let t = w.defaultLayout[e.id];
          t !== void 0 && (n[e.id] = t);
        }
      }
      let r = {
        defaultLayout: n,
        disableCursor: !!w.disableCursor,
        disabled: !!i,
        element: e,
        id: _,
        inMemoryLastExpandedPanelSizes: x.current.lastExpandedPanelSizes,
        inMemoryLayouts: x.current.layouts,
        orientation: u,
        panels: t.panels,
        resizeTargetMinimumSize: t.resizeTargetMinimumSize,
        separators: t.separators,
      };
      E.current = r;
      let a = gt(r),
        o = R().mountedGroups.get(r);
      if (o) {
        let {
          defaultLayoutDeferred: e,
          derivedPanelConstraints: t,
          layout: n,
        } = o;
        !e && t.length > 0 && (h(n), g(n));
      }
      let s = L.addListener(`interactionStateChange`, (e) => {
          e.state;
        }),
        c = L.addListener(`mountedGroupsChange`, (e) => {
          let t = e.get(r);
          if (t) {
            let {
              defaultLayoutDeferred: e,
              derivedPanelConstraints: n,
              layout: r,
            } = t;
            if (e || n.length === 0) return;
            let { interactionState: i } = R(),
              a = i.state !== `active`;
            (h(r), a && g(r));
          }
        });
      return () => {
        ((E.current = null), a(), s(), c());
      };
    }, [i, _, g, h, u, y, w]),
    (0, A.useEffect)(() => {
      let e = E.current;
      e && ((e.defaultLayout = n), (e.disableCursor = !!r));
    }),
    (0, k.jsx)(bt.Provider, {
      value: T,
      children: (0, k.jsx)(`div`, {
        ...p,
        className: t,
        "data-group": !0,
        "data-testid": _,
        id: _,
        ref: S,
        style: {
          height: `100%`,
          width: `100%`,
          overflow: `hidden`,
          ...f,
          display: `flex`,
          flexDirection: u === `horizontal` ? `row` : `column`,
          flexWrap: `nowrap`,
        },
        children: e,
      }),
    })
  );
}
St.displayName = `Group`;
function Ct() {
  let e = (0, A.useContext)(bt);
  return (
    P(
      e,
      `Group Context not found; did you render a Panel or Separator outside of a Group?`,
    ),
    e
  );
}
function wt(e, t) {
  let { id: n } = Ct(),
    r = (0, A.useRef)({
      collapse: Xe,
      expand: Xe,
      getSize: () => ({ asPercentage: 0, inPixels: 0 }),
      isCollapsed: () => !1,
      resize: Xe,
    });
  ((0, A.useImperativeHandle)(t, () => r.current, []),
    X(() => {
      Object.assign(r.current, Ue({ groupId: n, panelId: e }));
    }));
}
function Tt({
  children: e,
  className: t,
  collapsedSize: n = `0%`,
  collapsible: r = !1,
  defaultSize: i,
  disabled: a,
  elementRef: o,
  id: s,
  maxSize: c = `100%`,
  minSize: l = `0%`,
  onResize: u,
  panelRef: d,
  style: f,
  ...p
}) {
  let m = !!s,
    h = vt(s),
    g = Q({ disabled: a }),
    _ = (0, A.useRef)(null),
    v = yt(_, o),
    {
      getPanelStyles: y,
      id: b,
      registerPanel: x,
      togglePanelDisabled: S,
    } = Ct(),
    C = u !== null,
    w = Z((e, t, n) => {
      u?.(e, s, n);
    });
  (X(() => {
    let e = _.current;
    if (e !== null)
      return x({
        element: e,
        id: h,
        idIsStable: m,
        mutableValues: { expandToSize: void 0, prevSize: void 0 },
        onResize: C ? w : void 0,
        panelConstraints: {
          collapsedSize: n,
          collapsible: r,
          defaultSize: i,
          disabled: g.disabled,
          maxSize: c,
          minSize: l,
        },
      });
  }, [n, r, i, C, h, m, c, l, w, x, g]),
    (0, A.useEffect)(() => {
      S(h, !!a);
    }, [a, h, S]),
    wt(h, d));
  let T = (0, A.useSyncExternalStore)(
    (e) => (
      L.addListener(`mountedGroupsChange`, e),
      () => {
        L.removeListener(`mountedGroupsChange`, e);
      }
    ),
    () => JSON.stringify(y(b, h)),
    () => JSON.stringify(y(b, h)),
  );
  return (0, k.jsx)(`div`, {
    ...p,
    "aria-disabled": a || void 0,
    "data-panel": !0,
    "data-testid": h,
    id: h,
    ref: v,
    style: {
      ...Et,
      display: `flex`,
      flexBasis: 0,
      flexShrink: 1,
      overflow: `hidden`,
      ...JSON.parse(T),
    },
    children: (0, k.jsx)(`div`, {
      className: t,
      style: { maxHeight: `100%`, maxWidth: `100%`, flexGrow: 1, ...f },
      children: e,
    }),
  });
}
Tt.displayName = `Panel`;
var Et = {
  minHeight: 0,
  maxHeight: `100%`,
  height: `auto`,
  minWidth: 0,
  maxWidth: `100%`,
  width: `auto`,
  border: `none`,
  borderWidth: 0,
  padding: 0,
  margin: 0,
};
function Dt() {
  return (0, A.useRef)(null);
}
function Ot({ layout: e, panelConstraints: t, panelId: n, panelIndex: r }) {
  let i,
    a,
    o = e[n],
    s = t.find((e) => e.panelId === n);
  if (s) {
    let c = s.maxSize,
      l = s.collapsible ? s.collapsedSize : s.minSize,
      u = [r, r + 1];
    ((a = G({
      layout: U({
        delta: l - o,
        initialLayout: e,
        panelConstraints: t,
        pivotIndices: u,
        prevLayout: e,
      }),
      panelConstraints: t,
    })[n]),
      (i = G({
        layout: U({
          delta: c - o,
          initialLayout: e,
          panelConstraints: t,
          pivotIndices: u,
          prevLayout: e,
        }),
        panelConstraints: t,
      })[n]));
  }
  return { valueControls: n, valueMax: i, valueMin: a, valueNow: o };
}
function kt({
  children: e,
  className: t,
  disabled: n,
  elementRef: r,
  id: i,
  style: a,
  ...o
}) {
  let s = vt(i),
    c = Q({ disabled: n }),
    [l, u] = (0, A.useState)({}),
    [d, f] = (0, A.useState)(`inactive`),
    p = (0, A.useRef)(null),
    m = yt(p, r),
    {
      disableCursor: h,
      id: g,
      orientation: _,
      registerSeparator: v,
      toggleSeparatorDisabled: y,
    } = Ct(),
    b = _ === `horizontal` ? `vertical` : `horizontal`;
  (X(() => {
    let e = p.current;
    if (e !== null) {
      let t = { disabled: c.disabled, element: e, id: s },
        n = v(t),
        r = L.addListener(`interactionStateChange`, (e) => {
          f(
            e.state !== `inactive` &&
              e.hitRegions.some((e) => e.separator === t)
              ? e.state
              : `inactive`,
          );
        }),
        i = L.addListener(`mountedGroupsChange`, (e) => {
          e.forEach(
            (
              { derivedPanelConstraints: e, layout: n, separatorToPanels: r },
              i,
            ) => {
              if (i.id === g) {
                let a = r.get(t);
                if (a) {
                  let t = a[0],
                    r = i.panels.indexOf(t);
                  u(
                    Ot({
                      layout: n,
                      panelConstraints: e,
                      panelId: t.id,
                      panelIndex: r,
                    }),
                  );
                }
              }
            },
          );
        });
      return () => {
        (r(), i(), n());
      };
    }
  }, [g, s, v, c]),
    (0, A.useEffect)(() => {
      y(s, !!n);
    }, [n, s, y]));
  let x;
  return (
    n && !h && (x = `not-allowed`),
    (0, k.jsx)(`div`, {
      ...o,
      "aria-controls": l.valueControls,
      "aria-disabled": n || void 0,
      "aria-orientation": b,
      "aria-valuemax": l.valueMax,
      "aria-valuemin": l.valueMin,
      "aria-valuenow": l.valueNow,
      children: e,
      className: t,
      "data-separator": n ? `disabled` : d,
      "data-testid": s,
      id: s,
      ref: m,
      role: `separator`,
      style: { flexBasis: `auto`, cursor: x, ...a, flexGrow: 0, flexShrink: 0 },
      tabIndex: n ? void 0 : 0,
    })
  );
}
kt.displayName = `Separator`;
var At = r();
function jt(e) {
  let t = (0, At.c)(3),
    [n, r] = (0, A.useState)(!1),
    i,
    a;
  return (
    t[0] === e
      ? ((i = t[1]), (a = t[2]))
      : ((i = () => {
          let t = window.matchMedia(e);
          r(t.matches);
          let n = (e) => r(e.matches);
          return (
            t.addEventListener(`change`, n),
            () => t.removeEventListener(`change`, n)
          );
        }),
        (a = [e]),
        (t[0] = e),
        (t[1] = i),
        (t[2] = a)),
    (0, A.useEffect)(i, a),
    n
  );
}
var Mt = 3600 * 24 * 365;
function Nt(e) {
  return typeof document > `u` ? !1 : document.cookie.includes(`${e}=true`);
}
function Pt(e, t) {
  document.cookie = `${e}=${t}; path=/; max-age=${Mt}; SameSite=Lax`;
}
function Ft({
  leftPanel: e,
  rightPanel: t,
  leftDefaultSize: n,
  leftMinWidthPx: r,
  rightMinWidthPx: i,
  collapseCookieName: a,
}) {
  let o = Dt(),
    [s, c] = (0, A.useState)(() => Nt(a)),
    l = jt(`(max-width: 767px)`);
  (0, A.useEffect)(() => {
    s && o.current?.collapse();
  }, [s, o]);
  let u = {
    rightPanelCollapsed: s,
    onToggleRightPanel: () => {
      let e = !s;
      (e ? o.current?.collapse() : o.current?.expand(), c(e), Pt(a, e));
    },
  };
  return l
    ? (0, k.jsxs)(`div`, {
        className: `flex h-full flex-col`,
        children: [
          (0, k.jsx)(`div`, {
            className: s ? `flex-1 min-h-0` : `h-1/2 min-h-0`,
            children: e(u),
          }),
          !s &&
            (0, k.jsxs)(k.Fragment, {
              children: [
                (0, k.jsx)(`div`, { className: `h-px bg-border shrink-0` }),
                (0, k.jsx)(`div`, { className: `h-1/2 min-h-0`, children: t }),
              ],
            }),
        ],
      })
    : (0, k.jsxs)(St, {
        orientation: `horizontal`,
        className: `h-full`,
        children: [
          (0, k.jsx)(Tt, { defaultSize: n, minSize: r, children: e(u) }),
          (0, k.jsx)(kt, {
            className: `w-px bg-border hover:bg-primary/50 data-[resize-handle-active]:bg-primary transition-colors ${s ? `hidden` : ``}`,
            children: (0, k.jsx)(`div`, {
              className: `flex items-center justify-center w-3 h-full -mx-1.5 relative z-10`,
              children: (0, k.jsx)(oe, {
                className: `w-4 h-4 text-muted-foreground/50`,
              }),
            }),
          }),
          (0, k.jsx)(Tt, {
            collapsible: !0,
            collapsedSize: 0,
            defaultSize: `60%`,
            minSize: i,
            panelRef: o,
            children: t,
          }),
        ],
      });
}
function It(e) {
  let t = (0, At.c)(7),
    { headerLeft: n, headerRight: r, isArchived: i, children: a } = e,
    o;
  t[0] !== n || t[1] !== r || t[2] !== i
    ? ((o = i
        ? (0, k.jsxs)(`div`, {
            className: `flex items-center gap-2 px-3 py-3 border-b border-border bg-muted/50 animate-in fade-in duration-300 sm:px-4 sm:py-5`,
            children: [
              (0, k.jsx)(re, { size: 16, className: `text-muted-foreground` }),
              (0, k.jsx)(`span`, {
                className: `text-sm text-muted-foreground`,
                children: `This session is archived and read-only`,
              }),
            ],
          })
        : (0, k.jsxs)(`div`, {
            className: `flex items-center justify-between gap-1 p-2 animate-in fade-in duration-300 sm:gap-2 sm:p-3`,
            children: [
              n
                ? (0, k.jsx)(`div`, {
                    className: `flex items-center gap-1.5 sm:gap-2`,
                    children: n,
                  })
                : (0, k.jsx)(`div`, {}),
              r &&
                (0, k.jsx)(`div`, {
                  className: `flex items-center gap-1 sm:gap-2 flex-wrap justify-end`,
                  children: r,
                }),
            ],
          })),
      (t[0] = n),
      (t[1] = r),
      (t[2] = i),
      (t[3] = o))
    : (o = t[3]);
  let s;
  return (
    t[4] !== a || t[5] !== o
      ? ((s = (0, k.jsxs)(`div`, {
          className: `flex h-full min-h-0 flex-col max-w-3xl mx-auto w-full`,
          children: [o, a],
        })),
        (t[4] = a),
        (t[5] = o),
        (t[6] = s))
      : (s = t[6]),
    s
  );
}
function Lt({ items: e, label: t = `Queued`, onEdit: n, onDelete: r }) {
  let [s, l] = (0, A.useState)(null),
    [x, T] = (0, A.useState)(null),
    [D, ne] = (0, A.useState)(``),
    [re, ie] = (0, A.useState)(!1),
    [ae, O] = (0, A.useState)(!1);
  return (
    (0, A.useEffect)(() => {
      ne(s?.content ?? ``);
    }, [s]),
    e.length === 0
      ? null
      : (0, k.jsxs)(k.Fragment, {
          children: [
            (0, k.jsx)(ee, {
              className: `mb-2`,
              children: (0, k.jsxs)(S, {
                defaultOpen: !0,
                children: [
                  (0, k.jsx)(p, {
                    children: (0, k.jsx)(d, { count: e.length, label: t }),
                  }),
                  (0, k.jsx)(u, {
                    children: (0, k.jsx)(i, {
                      children: e.map((e) =>
                        (0, k.jsxs)(
                          g,
                          {
                            children: [
                              (0, k.jsx)(C, {}),
                              (0, k.jsx)(f, {
                                className: `truncate`,
                                children: (0, k.jsx)(`div`, {
                                  className: `truncate`,
                                  children: e.content,
                                }),
                              }),
                              (0, k.jsxs)(a, {
                                children: [
                                  e.info
                                    ? (0, k.jsxs)(h, {
                                        children: [
                                          (0, k.jsx)(y, {
                                            asChild: !0,
                                            children: (0, k.jsx)(o, {
                                              "aria-label": `Queued message details`,
                                              children: (0, k.jsx)(se, {
                                                size: 14,
                                              }),
                                            }),
                                          }),
                                          (0, k.jsx)(te, {
                                            children: (0, k.jsx)(`p`, {
                                              children: e.info,
                                            }),
                                          }),
                                        ],
                                      })
                                    : null,
                                  n
                                    ? (0, k.jsx)(o, {
                                        "aria-label": `Edit queued message`,
                                        onClick: () => l(e),
                                        children: (0, k.jsx)(ce, { size: 14 }),
                                      })
                                    : null,
                                  r
                                    ? (0, k.jsx)(o, {
                                        "aria-label": `Delete queued message`,
                                        onClick: () => T(e),
                                        children: (0, k.jsx)(ue, { size: 14 }),
                                      })
                                    : null,
                                ],
                              }),
                            ],
                          },
                          e.id,
                        ),
                      ),
                    }),
                  }),
                ],
              }),
            }),
            (0, k.jsx)(m, {
              open: s !== null,
              onOpenChange: (e) => {
                e || l(null);
              },
              children: (0, k.jsxs)(v, {
                children: [
                  (0, k.jsx)(b, {
                    children: (0, k.jsx)(c, {
                      children: `Edit queued message`,
                    }),
                  }),
                  (0, k.jsx)(w, {
                    value: D,
                    onChange: (e) => ne(e.target.value),
                    rows: 5,
                  }),
                  (0, k.jsxs)(_, {
                    children: [
                      (0, k.jsx)(E, {
                        variant: `ghost`,
                        onClick: () => l(null),
                        children: `Cancel`,
                      }),
                      (0, k.jsx)(E, {
                        disabled: re || !D.trim() || !s || !n,
                        onClick: async () => {
                          if (!(!s || !n)) {
                            ie(!0);
                            try {
                              (await n(s.id, D), l(null));
                            } finally {
                              ie(!1);
                            }
                          }
                        },
                        children: `Save`,
                      }),
                    ],
                  }),
                ],
              }),
            }),
            (0, k.jsx)(m, {
              open: x !== null,
              onOpenChange: (e) => {
                e || T(null);
              },
              children: (0, k.jsxs)(v, {
                children: [
                  (0, k.jsx)(b, {
                    children: (0, k.jsx)(c, {
                      children: `Delete queued message`,
                    }),
                  }),
                  (0, k.jsx)(`p`, {
                    className: `text-sm text-muted-foreground`,
                    children: `Remove this queued prompt before it runs?`,
                  }),
                  (0, k.jsxs)(_, {
                    children: [
                      (0, k.jsx)(E, {
                        variant: `ghost`,
                        onClick: () => T(null),
                        children: `Cancel`,
                      }),
                      (0, k.jsx)(E, {
                        variant: `destructive`,
                        disabled: ae || !x || !r,
                        onClick: async () => {
                          if (!(!x || !r)) {
                            O(!0);
                            try {
                              (await r(x.id), T(null));
                            } finally {
                              O(!1);
                            }
                          }
                        },
                        children: `Delete`,
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        })
  );
}
function Rt(e) {
  let t = (0, At.c)(18),
    { content: n, errorDetail: r } = e,
    [i, a] = (0, A.useState)(!1),
    o,
    s,
    l;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = { opacity: 0 }),
      (s = { opacity: 1 }),
      (l = { duration: 0.2 }),
      (t[0] = o),
      (t[1] = s),
      (t[2] = l))
    : ((o = t[0]), (s = t[1]), (l = t[2]));
  let u;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((u = (0, k.jsx)(`div`, { className: `h-px flex-1 bg-border` })),
      (t[3] = u))
    : (u = t[3]);
  let d;
  t[4] === n
    ? (d = t[5])
    : ((d = (0, k.jsx)(`span`, {
        className: `text-xs font-medium text-muted-foreground whitespace-nowrap max-w-[60%] truncate sm:max-w-none sm:truncate-none`,
        children: n,
      })),
      (t[4] = n),
      (t[5] = d));
  let f;
  t[6] === r
    ? (f = t[7])
    : ((f =
        r &&
        (0, k.jsx)(`button`, {
          onClick: () => a(!0),
          className: `text-xs font-medium text-destructive hover:underline whitespace-nowrap`,
          children: `View error`,
        })),
      (t[6] = r),
      (t[7] = f));
  let p;
  t[8] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((p = (0, k.jsx)(`div`, { className: `h-px flex-1 bg-border` })),
      (t[8] = p))
    : (p = t[8]);
  let h;
  t[9] !== d || t[10] !== f
    ? ((h = (0, k.jsxs)(x.div, {
        initial: o,
        animate: s,
        transition: l,
        className: `flex items-center gap-3 py-1`,
        children: [u, d, f, p],
      })),
      (t[9] = d),
      (t[10] = f),
      (t[11] = h))
    : (h = t[11]);
  let g;
  t[12] !== r || t[13] !== i
    ? ((g =
        r &&
        (0, k.jsx)(m, {
          open: i,
          onOpenChange: a,
          children: (0, k.jsxs)(v, {
            children: [
              (0, k.jsx)(b, {
                children: (0, k.jsxs)(c, {
                  className: `flex items-center gap-2`,
                  children: [
                    (0, k.jsx)(ne, { size: 16, className: `text-destructive` }),
                    `Sandbox Error`,
                  ],
                }),
              }),
              (0, k.jsx)(`pre`, {
                className: `whitespace-pre-wrap text-sm text-muted-foreground bg-muted rounded-lg p-4 max-h-64 overflow-y-auto`,
                children: r,
              }),
              (0, k.jsx)(_, {
                children: (0, k.jsx)(E, {
                  variant: `ghost`,
                  onClick: () => a(!1),
                  children: `Close`,
                }),
              }),
            ],
          }),
        })),
      (t[12] = r),
      (t[13] = i),
      (t[14] = g))
    : (g = t[14]);
  let y;
  return (
    t[15] !== h || t[16] !== g
      ? ((y = (0, k.jsxs)(k.Fragment, { children: [h, g] })),
        (t[15] = h),
        (t[16] = g),
        (t[17] = y))
      : (y = t[17]),
    y
  );
}
function $(e) {
  try {
    let t = new URL(e);
    return t.pathname + t.search + t.hash;
  } catch {
    return `/`;
  }
}
function zt(e, t) {
  try {
    let n = new URL(e);
    n.protocol === `http:` && (n.protocol = `https:`);
    let r = t.startsWith(`/`) ? t : `/${t}`;
    return `${n.origin}${r}`;
  } catch {
    return e;
  }
}
function Bt({
  previewUrl: e,
  iframeRef: t,
  containerRef: n,
  port: r,
  onPortChange: i,
  defaultPath: a = `/`,
  isLoading: o = !1,
  onRefresh: c,
}) {
  let [u, d] = (0, A.useState)(String(r)),
    [f, p] = (0, A.useState)(a),
    [m, h] = (0, A.useState)(e);
  e !== m && (h(e), p($(e ?? a)));
  let g = (0, A.useCallback)(() => {
    try {
      let e = t.current?.contentWindow?.location.href;
      e && p($(e));
    } catch {}
  }, [t]);
  (0, A.useEffect)(() => {
    let e = t.current;
    if (!e) return;
    e.addEventListener(`load`, g);
    function n(e) {
      e.source === t.current?.contentWindow &&
        typeof e.data == `object` &&
        e.data !== null &&
        `type` in e.data &&
        e.data.type === `navigation` &&
        `url` in e.data &&
        typeof e.data.url == `string` &&
        p($(e.data.url));
    }
    return (
      window.addEventListener(`message`, n),
      () => {
        (e.removeEventListener(`load`, g),
          window.removeEventListener(`message`, n));
      }
    );
  }, [t, g]);
  function _() {
    try {
      (t.current?.contentWindow?.history.back(), setTimeout(g, 200));
    } catch {}
  }
  function v() {
    try {
      (t.current?.contentWindow?.history.forward(), setTimeout(g, 200));
    } catch {}
  }
  function y() {
    t.current && (t.current.src = t.current.src);
  }
  function b() {
    !t.current || !e || (t.current.src = zt(e, f));
  }
  function x() {
    let e = parseInt(u, 10);
    !isNaN(e) && e > 0 && e <= 65535 ? i?.(e) : d(String(r));
  }
  let S = e ? zt(e, f) : void 0;
  function C() {
    document.fullscreenElement
      ? document.exitFullscreen()
      : n.current?.requestFullscreen();
  }
  return (0, k.jsxs)(k.Fragment, {
    children: [
      (0, k.jsx)(s, {
        tooltip: `Back`,
        onClick: _,
        children: (0, k.jsx)(ie, { className: `w-3.5 h-3.5` }),
      }),
      (0, k.jsx)(s, {
        tooltip: `Forward`,
        onClick: v,
        children: (0, k.jsx)(ae, { className: `w-3.5 h-3.5` }),
      }),
      (0, k.jsx)(s, {
        tooltip: `Reload`,
        onClick: o && c ? c : y,
        disabled: o,
        children: o
          ? (0, k.jsx)(l, { size: `sm` })
          : (0, k.jsx)(le, { className: `w-3.5 h-3.5` }),
      }),
      (0, k.jsx)(T, {
        className: `h-8 flex-1 text-xs`,
        value: f,
        onChange: (e) => p(e.target.value),
        onBlur: b,
        onKeyDown: (e) => {
          e.key === `Enter` && b();
        },
        placeholder: `/`,
        "aria-label": `Preview path`,
      }),
      (0, k.jsx)(T, {
        className: `h-8 w-14 text-xs text-center px-1 sm:w-16`,
        value: u,
        onChange: (e) => d(e.target.value),
        onBlur: x,
        onKeyDown: (e) => {
          e.key === `Enter` && x();
        },
        "aria-label": `Preview port`,
      }),
      (0, k.jsx)(s, {
        tooltip: `Open in new tab`,
        disabled: !e,
        asChild: !0,
        children: (0, k.jsx)(`a`, {
          href: S,
          target: `_blank`,
          rel: `noopener noreferrer`,
          children: (0, k.jsx)(O, { className: `w-3.5 h-3.5` }),
        }),
      }),
      (0, k.jsx)(s, {
        tooltip: `Fullscreen`,
        onClick: C,
        children: (0, k.jsx)(de, { className: `w-3.5 h-3.5` }),
      }),
    ],
  });
}
export { Ft as a, It as i, Rt as n, pe as o, Lt as r, de as s, Bt as t };
