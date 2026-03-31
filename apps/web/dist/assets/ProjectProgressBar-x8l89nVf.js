import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { n } from "./backend-BVlbQtYj.js";
import { t as r } from "./hooks-B_9i2gKL.js";
import { Rt as i, Vt as a, zt as o } from "./src-DzioQSsH.js";
import { r as s, t as c } from "./TaskStatusBadge-pvqpdmz8.js";
var l = t(),
  u = e();
function d(e) {
  let t = (0, l.c)(19),
    { projectId: d, className: f } = e,
    p;
  t[0] === d ? (p = t[1]) : ((p = { projectId: d }), (t[0] = d), (t[1] = p));
  let m = r(n.projects.getTaskProgress, p);
  if (!m) return null;
  if (m.total === 0) {
    let e = `h-1.5 overflow-hidden rounded-full bg-secondary/85 ${f ?? ``}`,
      n;
    t[2] === e
      ? (n = t[3])
      : ((n = (0, u.jsx)(a, {
          asChild: !0,
          children: (0, u.jsx)(`div`, { className: e }),
        })),
        (t[2] = e),
        (t[3] = n));
    let r;
    t[4] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((r = (0, u.jsx)(o, {
          children: (0, u.jsx)(`span`, {
            className: `text-xs text-muted-foreground`,
            children: `No tasks yet`,
          }),
        })),
        (t[4] = r))
      : (r = t[4]);
    let s;
    return (
      t[5] === n
        ? (s = t[6])
        : ((s = (0, u.jsxs)(i, { children: [n, r] })), (t[5] = n), (t[6] = s)),
      s
    );
  }
  let h = `flex h-1.5 overflow-hidden rounded-full bg-secondary ${f ?? ``}`,
    g;
  t[7] === m
    ? (g = t[8])
    : ((g = c.map((e) => {
        let t = m[e];
        return t === 0
          ? null
          : (0, u.jsx)(
              `div`,
              {
                className: s[e].bar,
                style: { width: `${(t / m.total) * 100}%` },
              },
              e,
            );
      })),
      (t[7] = m),
      (t[8] = g));
  let _;
  t[9] !== h || t[10] !== g
    ? ((_ = (0, u.jsx)(a, {
        asChild: !0,
        children: (0, u.jsx)(`div`, { className: h, children: g }),
      })),
      (t[9] = h),
      (t[10] = g),
      (t[11] = _))
    : (_ = t[11]);
  let v;
  t[12] === m
    ? (v = t[13])
    : ((v = c
        .filter((e) => m[e] > 0)
        .map((e) => {
          let t = s[e].icon;
          return (0, u.jsxs)(
            `span`,
            {
              className: `flex items-center gap-1.5 ${s[e].text}`,
              children: [
                (0, u.jsx)(t, { size: 12 }),
                ` `,
                m[e],
                ` `,
                s[e].label,
              ],
            },
            e,
          );
        })),
      (t[12] = m),
      (t[13] = v));
  let y;
  t[14] === v
    ? (y = t[15])
    : ((y = (0, u.jsx)(o, {
        children: (0, u.jsx)(`div`, {
          className: `flex flex-col gap-1`,
          children: v,
        }),
      })),
      (t[14] = v),
      (t[15] = y));
  let b;
  return (
    t[16] !== _ || t[17] !== y
      ? ((b = (0, u.jsxs)(i, { children: [_, y] })),
        (t[16] = _),
        (t[17] = y),
        (t[18] = b))
      : (b = t[18]),
    b
  );
}
export { d as t };
