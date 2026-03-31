import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import {
  $ as r,
  Q as i,
  et as a,
  it as o,
  nt as s,
  rt as c,
  tt as l,
} from "./src-DzioQSsH.js";
var u = e(t(), 1);
function d(e, t) {
  if (typeof e == `function`) return e(t);
  e != null && (e.current = t);
}
function f(...e) {
  return (t) => {
    let n = !1,
      r = e.map((e) => {
        let r = d(e, t);
        return (!n && typeof r == `function` && (n = !0), r);
      });
    if (n)
      return () => {
        for (let t = 0; t < r.length; t++) {
          let n = r[t];
          typeof n == `function` ? n() : d(e[t], null);
        }
      };
  };
}
function p(...e) {
  return u.useCallback(f(...e), e);
}
var m = n(),
  h = class extends u.Component {
    getSnapshotBeforeUpdate(e) {
      let t = this.props.childRef.current;
      if (t && e.isPresent && !this.props.isPresent && this.props.pop !== !1) {
        let e = t.offsetParent,
          n = (a(e) && e.offsetWidth) || 0,
          r = (a(e) && e.offsetHeight) || 0,
          i = this.props.sizeRef.current;
        ((i.height = t.offsetHeight || 0),
          (i.width = t.offsetWidth || 0),
          (i.top = t.offsetTop),
          (i.left = t.offsetLeft),
          (i.right = n - i.width - i.left),
          (i.bottom = r - i.height - i.top));
      }
      return null;
    }
    componentDidUpdate() {}
    render() {
      return this.props.children;
    }
  };
function g({
  children: e,
  isPresent: t,
  anchorX: n,
  anchorY: i,
  root: a,
  pop: o,
}) {
  let s = (0, u.useId)(),
    c = (0, u.useRef)(null),
    l = (0, u.useRef)({
      width: 0,
      height: 0,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    }),
    { nonce: d } = (0, u.useContext)(r),
    f = p(c, e.props?.ref ?? e?.ref);
  return (
    (0, u.useInsertionEffect)(() => {
      let {
        width: e,
        height: r,
        top: u,
        left: f,
        right: p,
        bottom: m,
      } = l.current;
      if (t || o === !1 || !c.current || !e || !r) return;
      let h = n === `left` ? `left: ${f}` : `right: ${p}`,
        g = i === `bottom` ? `bottom: ${m}` : `top: ${u}`;
      c.current.dataset.motionPopId = s;
      let _ = document.createElement(`style`);
      d && (_.nonce = d);
      let v = a ?? document.head;
      return (
        v.appendChild(_),
        _.sheet &&
          _.sheet.insertRule(`
          [data-motion-pop-id="${s}"] {
            position: absolute !important;
            width: ${e}px !important;
            height: ${r}px !important;
            ${h}px !important;
            ${g}px !important;
          }
        `),
        () => {
          v.contains(_) && v.removeChild(_);
        }
      );
    }, [t]),
    (0, m.jsx)(h, {
      isPresent: t,
      childRef: c,
      sizeRef: l,
      pop: o,
      children: o === !1 ? e : u.cloneElement(e, { ref: f }),
    })
  );
}
var _ = ({
  children: e,
  initial: t,
  isPresent: n,
  onExitComplete: r,
  custom: i,
  presenceAffectsLayout: a,
  mode: o,
  anchorX: s,
  anchorY: d,
  root: f,
}) => {
  let p = c(v),
    h = (0, u.useId)(),
    _ = !0,
    y = (0, u.useMemo)(
      () => (
        (_ = !1),
        {
          id: h,
          initial: t,
          isPresent: n,
          custom: i,
          onExitComplete: (e) => {
            p.set(e, !0);
            for (let e of p.values()) if (!e) return;
            r && r();
          },
          register: (e) => (p.set(e, !1), () => p.delete(e)),
        }
      ),
      [n, p, r],
    );
  return (
    a && _ && (y = { ...y }),
    (0, u.useMemo)(() => {
      p.forEach((e, t) => p.set(t, !1));
    }, [n]),
    u.useEffect(() => {
      !n && !p.size && r && r();
    }, [n]),
    (e = (0, m.jsx)(g, {
      pop: o === `popLayout`,
      isPresent: n,
      anchorX: s,
      anchorY: d,
      root: f,
      children: e,
    })),
    (0, m.jsx)(l.Provider, { value: y, children: e })
  );
};
function v() {
  return new Map();
}
var y = (e) => e.key || ``;
function b(e) {
  let t = [];
  return (
    u.Children.forEach(e, (e) => {
      (0, u.isValidElement)(e) && t.push(e);
    }),
    t
  );
}
var x = ({
  children: e,
  custom: t,
  initial: n = !0,
  onExitComplete: r,
  presenceAffectsLayout: a = !0,
  mode: l = `sync`,
  propagate: d = !1,
  anchorX: f = `left`,
  anchorY: p = `top`,
  root: h,
}) => {
  let [g, v] = i(d),
    x = (0, u.useMemo)(() => b(e), [e]),
    S = d && !g ? [] : x.map(y),
    C = (0, u.useRef)(!0),
    w = (0, u.useRef)(x),
    T = c(() => new Map()),
    E = (0, u.useRef)(new Set()),
    [D, O] = (0, u.useState)(x),
    [k, A] = (0, u.useState)(x);
  s(() => {
    ((C.current = !1), (w.current = x));
    for (let e = 0; e < k.length; e++) {
      let t = y(k[e]);
      S.includes(t)
        ? (T.delete(t), E.current.delete(t))
        : T.get(t) !== !0 && T.set(t, !1);
    }
  }, [k, S.length, S.join(`-`)]);
  let j = [];
  if (x !== D) {
    let e = [...x];
    for (let t = 0; t < k.length; t++) {
      let n = k[t],
        r = y(n);
      S.includes(r) || (e.splice(t, 0, n), j.push(n));
    }
    return (l === `wait` && j.length && (e = j), A(b(e)), O(x), null);
  }
  let { forceRender: M } = (0, u.useContext)(o);
  return (0, m.jsx)(m.Fragment, {
    children: k.map((e) => {
      let i = y(e),
        o = d && !g ? !1 : x === k || S.includes(i);
      return (0, m.jsx)(
        _,
        {
          isPresent: o,
          initial: !C.current || n ? void 0 : !1,
          custom: t,
          presenceAffectsLayout: a,
          mode: l,
          root: h,
          onExitComplete: o
            ? void 0
            : () => {
                if (E.current.has(i)) return;
                if ((E.current.add(i), T.has(i))) T.set(i, !0);
                else return;
                let e = !0;
                (T.forEach((t) => {
                  t || (e = !1);
                }),
                  e && (M?.(), A(w.current), d && v?.(), r && r()));
              },
          anchorX: f,
          anchorY: p,
          children: e,
        },
        i,
      );
    }),
  });
};
export { x as t };
