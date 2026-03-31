import {
  C as e,
  E as t,
  O as n,
  S as r,
  b as i,
  c as a,
  d as o,
  i as s,
  m as c,
  p as l,
  s as u,
  u as d,
} from "./identity-X8ntysRl.js";
var f = c(Object.keys, Object),
  p = Object.prototype.hasOwnProperty;
function m(e) {
  if (!l(e)) return f(e);
  var t = [];
  for (var n in Object(e)) p.call(e, n) && n != `constructor` && t.push(n);
  return t;
}
var h = r(n, `DataView`),
  g = r(n, `Promise`),
  _ = r(n, `Set`),
  v = r(n, `WeakMap`),
  y = `[object Map]`,
  b = `[object Object]`,
  x = `[object Promise]`,
  S = `[object Set]`,
  C = `[object WeakMap]`,
  w = `[object DataView]`,
  T = e(h),
  E = e(i),
  D = e(g),
  O = e(_),
  k = e(v),
  A = t;
((h && A(new h(new ArrayBuffer(1))) != w) ||
  (i && A(new i()) != y) ||
  (g && A(g.resolve()) != x) ||
  (_ && A(new _()) != S) ||
  (v && A(new v()) != C)) &&
  (A = function (n) {
    var r = t(n),
      i = r == b ? n.constructor : void 0,
      a = i ? e(i) : ``;
    if (a)
      switch (a) {
        case T:
          return w;
        case E:
          return y;
        case D:
          return x;
        case O:
          return S;
        case k:
          return C;
      }
    return r;
  });
var j = A,
  M = `[object Map]`,
  N = `[object Set]`,
  P = Object.prototype.hasOwnProperty;
function F(e) {
  if (e == null) return !0;
  if (
    a(e) &&
    (d(e) ||
      typeof e == `string` ||
      typeof e.splice == `function` ||
      u(e) ||
      s(e) ||
      o(e))
  )
    return !e.length;
  var t = j(e);
  if (t == M || t == N) return !e.size;
  if (l(e)) return !m(e).length;
  for (var n in e) if (P.call(e, n)) return !1;
  return !0;
}
export { m as i, j as n, _ as r, F as t };
