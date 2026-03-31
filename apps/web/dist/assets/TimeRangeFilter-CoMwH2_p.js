import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import {
  dn as n,
  gn as r,
  hn as i,
  pn as a,
  ur as o,
  xn as s,
} from "./src-DzioQSsH.js";
import { t as c } from "./createReactComponent-C2GWxX5y.js";
import { n as l } from "./dates-DHZmrCUU.js";
var u = c(`outline`, `calendar`, `Calendar`, [
    [
      `path`,
      {
        d: `M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M16 3v4`, key: `svg-1` }],
    [`path`, { d: `M8 3v4`, key: `svg-2` }],
    [`path`, { d: `M4 11h16`, key: `svg-3` }],
    [`path`, { d: `M11 15h1`, key: `svg-4` }],
    [`path`, { d: `M12 15v3`, key: `svg-5` }],
  ]),
  d = t(),
  f = e(),
  p = 864e5,
  m = [`7d`, `30d`, `90d`, `all`],
  h = {
    "7d": `Last 7 days`,
    "30d": `Last 30 days`,
    "90d": `Last 90 days`,
    all: `All time`,
  };
function g(e) {
  return m.includes(e);
}
function _(e) {
  if (e !== `all`)
    return l().subtract({ "7d": 7, "30d": 30, "90d": 90 }[e], `day`).valueOf();
}
function v(e) {
  return e === `7d` || e === `30d` ? p : 7 * p;
}
function y(e) {
  let t = (0, d.c)(12),
    { value: r, onChange: c } = e,
    l;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (0, f.jsx)(u, { size: 14 })), (t[0] = l))
    : (l = t[0]);
  let p = h[r],
    _;
  t[1] === p
    ? (_ = t[2])
    : ((_ = (0, f.jsx)(s, {
        asChild: !0,
        children: (0, f.jsxs)(o, {
          variant: `secondary`,
          size: `sm`,
          className: `max-w-[160px] sm:max-w-none`,
          children: [
            l,
            (0, f.jsx)(`span`, { className: `truncate`, children: p }),
          ],
        }),
      })),
      (t[1] = p),
      (t[2] = _));
  let v;
  t[3] === c
    ? (v = t[4])
    : ((v = (e) => {
        g(e) && c(e);
      }),
      (t[3] = c),
      (t[4] = v));
  let y;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((y = m.map(b)), (t[5] = y))
    : (y = t[5]);
  let x;
  t[6] !== v || t[7] !== r
    ? ((x = (0, f.jsx)(a, {
        children: (0, f.jsx)(i, { value: r, onValueChange: v, children: y }),
      })),
      (t[6] = v),
      (t[7] = r),
      (t[8] = x))
    : (x = t[8]);
  let S;
  return (
    t[9] !== _ || t[10] !== x
      ? ((S = (0, f.jsxs)(n, { children: [_, x] })),
        (t[9] = _),
        (t[10] = x),
        (t[11] = S))
      : (S = t[11]),
    S
  );
}
function b(e) {
  return (0, f.jsx)(r, { value: e, children: h[e] }, e);
}
export { v as n, _ as r, y as t };
