import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import {
  J as n,
  X as r,
  Yn as i,
  fr as a,
  pr as o,
  t as s,
} from "./src-DzioQSsH.js";
import { t as c } from "./src-BHqyiqII.js";
import { t as l } from "./parseActivitySteps-BClmcBqd.js";
import { t as u } from "./formatDuration-Bscl8bMO.js";
var d = t(),
  f = [`opus`, `sonnet`, `haiku`],
  p = [`default`, `detailed`];
function m(e) {
  return f.includes(e);
}
function h(e) {
  return p.includes(e);
}
function g(e) {
  return `conductor:session-settings:${e}`;
}
function _(e) {
  try {
    let t = sessionStorage.getItem(g(e));
    return t ? JSON.parse(t) : {};
  } catch {
    return {};
  }
}
function v(e, t) {
  sessionStorage.setItem(g(e), JSON.stringify(t));
}
function y(e, t) {
  let n = _(e).model;
  return n && m(n) ? n : t;
}
function b(e, t) {
  let n = _(e).responseLength;
  return n && h(n) ? n : t;
}
function x(e) {
  let t = (0, d.c)(2),
    n;
  return (
    t[0] === e
      ? (n = t[1])
      : ((n = (t) => {
          v(e, { ..._(e), model: t });
        }),
        (t[0] = e),
        (t[1] = n)),
    n
  );
}
function S(e) {
  let t = (0, d.c)(2),
    n;
  return (
    t[0] === e
      ? (n = t[1])
      : ((n = (t) => {
          v(e, { ..._(e), responseLength: t });
        }),
        (t[0] = e),
        (t[1] = n)),
    n
  );
}
var C = e();
function w(e) {
  let t = (0, d.c)(5),
    { userId: n, className: r } = e,
    i = r === void 0 ? `h-7 w-7` : r;
  if (n) {
    let e;
    return (
      t[0] === n
        ? (e = t[1])
        : ((e = (0, C.jsx)(c, { userId: n, hideLastSeen: !0, size: `md` })),
          (t[0] = n),
          (t[1] = e)),
      e
    );
  }
  let s;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, C.jsx)(o, {
        className: `bg-secondary text-xs text-muted-foreground`,
        children: `U`,
      })),
      (t[2] = s))
    : (s = t[2]);
  let l;
  return (
    t[3] === i
      ? (l = t[4])
      : ((l = (0, C.jsx)(a, { className: i, children: s })),
        (t[3] = i),
        (t[4] = l)),
    l
  );
}
function T(e) {
  let t = (0, d.c)(2),
    { size: n } = e,
    r = n === void 0 ? 20 : n,
    i;
  return (
    t[0] === r
      ? (i = t[1])
      : ((i = (0, C.jsx)(`img`, {
          src: `/icon.png`,
          alt: `Eva`,
          width: r,
          height: r,
          className: `rounded-full`,
        })),
        (t[0] = r),
        (t[1] = i)),
    i
  );
}
function E(e) {
  let t = (0, d.c)(11),
    {
      activity: n,
      isStreaming: r,
      name: i,
      icon: a,
      thinkingLabel: o,
      startedAt: c,
    } = e,
    u = r === void 0 ? !0 : r,
    f = o === void 0 ? `Working...` : o,
    p;
  t[0] === n ? (p = t[1]) : ((p = l(n)), (t[0] = n), (t[1] = p));
  let m = p,
    h;
  t[2] !== m || t[3] !== f
    ? ((h = m ?? [{ type: `thinking`, label: f, status: `active` }]),
      (t[2] = m),
      (t[3] = f),
      (t[4] = h))
    : (h = t[4]);
  let g;
  return (
    t[5] !== a || t[6] !== u || t[7] !== i || t[8] !== c || t[9] !== h
      ? ((g = (0, C.jsx)(s, {
          steps: h,
          isStreaming: u,
          name: i,
          icon: a,
          startedAt: c,
        })),
        (t[5] = a),
        (t[6] = u),
        (t[7] = i),
        (t[8] = c),
        (t[9] = h),
        (t[10] = g))
      : (g = t[10]),
    g
  );
}
function D(e) {
  let t = (0, d.c)(13),
    { activityLog: a, name: o, icon: c, startedAt: f, finishedAt: p } = e,
    m;
  t[0] === a ? (m = t[1]) : ((m = l(a)), (t[0] = a), (t[1] = m));
  let h = m,
    g;
  t[2] !== p || t[3] !== f
    ? ((g = f && p ? u(f, p) : void 0), (t[2] = p), (t[3] = f), (t[4] = g))
    : (g = t[4]);
  let _ = g;
  if (h) {
    let e;
    return (
      t[5] !== _ || t[6] !== c || t[7] !== o || t[8] !== h
        ? ((e = (0, C.jsx)(s, { steps: h, name: o, icon: c, duration: _ })),
          (t[5] = _),
          (t[6] = c),
          (t[7] = o),
          (t[8] = h),
          (t[9] = e))
        : (e = t[9]),
      e
    );
  }
  let v;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = (0, C.jsx)(r, { getThinkingMessage: O })), (t[10] = v))
    : (v = t[10]);
  let y;
  return (
    t[11] === a
      ? (y = t[12])
      : ((y = (0, C.jsxs)(n, {
          defaultOpen: !1,
          children: [
            v,
            (0, C.jsx)(i, {
              className: `mt-4 text-sm text-muted-foreground`,
              children: (0, C.jsx)(`pre`, {
                className: `whitespace-pre-wrap font-mono text-xs max-h-64 overflow-y-auto`,
                children: a,
              }),
            }),
          ],
        })),
        (t[11] = a),
        (t[12] = y)),
    y
  );
}
function O() {
  return `View logs`;
}
export { y as a, S as c, w as i, E as n, b as o, T as r, x as s, D as t };
