import { o as e, t } from "./chunk-CFjPhJqf.js";
import { n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./shim-DlYA1Ap9.js";
function i(e) {
  return e[e.length - 1];
}
function a(e) {
  return typeof e == `function`;
}
function o(e, t) {
  return a(e) ? e(t) : e;
}
var s = Object.prototype.hasOwnProperty,
  c = Object.prototype.propertyIsEnumerable,
  l = () => Object.create(null),
  u = (e, t) => d(e, t, l);
function d(e, t, n = () => ({}), r = 0) {
  if (e === t) return e;
  if (r > 500) return t;
  let i = t,
    a = h(e) && h(i);
  if (!a && !(p(e) && p(i))) return i;
  let o = a ? e : f(e);
  if (!o) return i;
  let c = a ? i : f(i);
  if (!c) return i;
  let l = o.length,
    u = c.length,
    m = a ? Array(u) : n(),
    g = 0;
  for (let t = 0; t < u; t++) {
    let o = a ? t : c[t],
      u = e[o],
      f = i[o];
    if (u === f) {
      ((m[o] = u), (a ? t < l : s.call(e, o)) && g++);
      continue;
    }
    if (
      u === null ||
      f === null ||
      typeof u != `object` ||
      typeof f != `object`
    ) {
      m[o] = f;
      continue;
    }
    let p = d(u, f, n, r + 1);
    ((m[o] = p), p === u && g++);
  }
  return l === u && g === l ? e : m;
}
function f(e) {
  let t = Object.getOwnPropertyNames(e);
  for (let n of t) if (!c.call(e, n)) return !1;
  let n = Object.getOwnPropertySymbols(e);
  if (n.length === 0) return t;
  let r = t;
  for (let t of n) {
    if (!c.call(e, t)) return !1;
    r.push(t);
  }
  return r;
}
function p(e) {
  if (!m(e)) return !1;
  let t = e.constructor;
  if (t === void 0) return !0;
  let n = t.prototype;
  return !(!m(n) || !n.hasOwnProperty(`isPrototypeOf`));
}
function m(e) {
  return Object.prototype.toString.call(e) === `[object Object]`;
}
function h(e) {
  return Array.isArray(e) && e.length === Object.keys(e).length;
}
function g(e, t, n) {
  if (e === t) return !0;
  if (typeof e != typeof t) return !1;
  if (Array.isArray(e) && Array.isArray(t)) {
    if (e.length !== t.length) return !1;
    for (let r = 0, i = e.length; r < i; r++) if (!g(e[r], t[r], n)) return !1;
    return !0;
  }
  if (p(e) && p(t)) {
    let r = n?.ignoreUndefined ?? !0;
    if (n?.partial) {
      for (let i in t)
        if ((!r || t[i] !== void 0) && !g(e[i], t[i], n)) return !1;
      return !0;
    }
    let i = 0;
    if (!r) i = Object.keys(e).length;
    else for (let t in e) e[t] !== void 0 && i++;
    let a = 0;
    for (let o in t)
      if ((!r || t[o] !== void 0) && (a++, a > i || !g(e[o], t[o], n)))
        return !1;
    return i === a;
  }
  return !1;
}
function _(e) {
  let t,
    n,
    r = new Promise((e, r) => {
      ((t = e), (n = r));
    });
  return (
    (r.status = `pending`),
    (r.resolve = (n) => {
      ((r.status = `resolved`), (r.value = n), t(n), e?.(n));
    }),
    (r.reject = (e) => {
      ((r.status = `rejected`), n(e));
    }),
    r
  );
}
function v(e) {
  return typeof e?.message == `string`
    ? e.message.startsWith(`Failed to fetch dynamically imported module`) ||
        e.message.startsWith(`error loading dynamically imported module`) ||
        e.message.startsWith(`Importing a module script failed`)
    : !1;
}
function y(e) {
  return !!(e && typeof e == `object` && typeof e.then == `function`);
}
function b(e) {
  return e.replace(/[\x00-\x1f\x7f]/g, ``);
}
function x(e) {
  let t;
  try {
    t = decodeURI(e);
  } catch {
    t = e.replaceAll(/%[0-9A-F]{2}/gi, (e) => {
      try {
        return decodeURI(e);
      } catch {
        return e;
      }
    });
  }
  return b(t);
}
var S = [`http:`, `https:`, `mailto:`, `tel:`];
function C(e, t) {
  if (!e) return !1;
  try {
    let n = new URL(e);
    return !t.has(n.protocol);
  } catch {
    return !1;
  }
}
var w = {
    "&": `\\u0026`,
    ">": `\\u003e`,
    "<": `\\u003c`,
    "\u2028": `\\u2028`,
    "\u2029": `\\u2029`,
  },
  T = /[&><\u2028\u2029]/g;
function E(e) {
  return e.replace(T, (e) => w[e]);
}
function D(e) {
  if (!e || (!/[%\\\x00-\x1f\x7f]/.test(e) && !e.startsWith(`//`)))
    return { path: e, handledProtocolRelativeURL: !1 };
  let t = /%25|%5C/gi,
    n = 0,
    r = ``,
    i;
  for (; (i = t.exec(e)) !== null; )
    ((r += x(e.slice(n, i.index)) + i[0]), (n = t.lastIndex));
  r += x(n ? e.slice(n) : e);
  let a = !1;
  return (
    r.startsWith(`//`) && ((a = !0), (r = `/` + r.replace(/^\/+/, ``))),
    { path: r, handledProtocolRelativeURL: a }
  );
}
function O(e) {
  return /\s|[^\u0000-\u007F]/.test(e)
    ? e.replace(/\s|[^\u0000-\u007F]/gu, encodeURIComponent)
    : e;
}
function k(e, t) {
  if (e === t) return !0;
  if (e.length !== t.length) return !1;
  for (let n = 0; n < e.length; n++) if (e[n] !== t[n]) return !1;
  return !0;
}
function A() {
  throw Error(`Invariant failed`);
}
var j = t((e) => {
    var t = n(),
      i = r();
    function a(e, t) {
      return (e === t && (e !== 0 || 1 / e == 1 / t)) || (e !== e && t !== t);
    }
    var o = typeof Object.is == `function` ? Object.is : a,
      s = i.useSyncExternalStore,
      c = t.useRef,
      l = t.useEffect,
      u = t.useMemo,
      d = t.useDebugValue;
    e.useSyncExternalStoreWithSelector = function (e, t, n, r, i) {
      var a = c(null);
      if (a.current === null) {
        var f = { hasValue: !1, value: null };
        a.current = f;
      } else f = a.current;
      a = u(
        function () {
          function e(e) {
            if (!a) {
              if (((a = !0), (s = e), (e = r(e)), i !== void 0 && f.hasValue)) {
                var t = f.value;
                if (i(t, e)) return (c = t);
              }
              return (c = e);
            }
            if (((t = c), o(s, e))) return t;
            var n = r(e);
            return i !== void 0 && i(t, n) ? ((s = e), t) : ((s = e), (c = n));
          }
          var a = !1,
            s,
            c,
            l = n === void 0 ? null : n;
          return [
            function () {
              return e(t());
            },
            l === null
              ? void 0
              : function () {
                  return e(l());
                },
          ];
        },
        [t, n, r, i],
      );
      var p = s(e, a[0], a[1]);
      return (
        l(
          function () {
            ((f.hasValue = !0), (f.value = p));
          },
          [p],
        ),
        d(p),
        p
      );
    };
  }),
  M = t((e, t) => {
    t.exports = j();
  }),
  N = e(n(), 1),
  P = M();
function F(e, t) {
  return e === t;
}
function I(e, t, n = F) {
  let r = (0, N.useCallback)(
      (t) => {
        if (!e) return () => {};
        let { unsubscribe: n } = e.subscribe(t);
        return n;
      },
      [e],
    ),
    i = (0, N.useCallback)(() => e?.get(), [e]);
  return (0, P.useSyncExternalStoreWithSelector)(r, i, i, t, n);
}
export {
  d as _,
  k as a,
  g as c,
  o as d,
  C as f,
  u as g,
  i as h,
  S as i,
  O as l,
  y as m,
  M as n,
  _ as o,
  v as p,
  A as r,
  D as s,
  I as t,
  E as u,
};
