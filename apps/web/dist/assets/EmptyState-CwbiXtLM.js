import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { ur as n } from "./src-DzioQSsH.js";
import { t as r } from "./IconPlus-ZLqtR4Mv.js";
var i = t(),
  a = e();
function o(e) {
  let t = (0, i.c)(15),
    {
      icon: o,
      title: s,
      description: c,
      actionLabel: l,
      onAction: u,
      action: d,
    } = e,
    f;
  t[0] === o
    ? (f = t[1])
    : ((f = (0, a.jsx)(`div`, {
        className: `mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary`,
        children: o,
      })),
      (t[0] = o),
      (t[1] = f));
  let p;
  t[2] === s
    ? (p = t[3])
    : ((p = (0, a.jsx)(`p`, {
        className: `text-base font-semibold tracking-[-0.01em] text-foreground`,
        children: s,
      })),
      (t[2] = s),
      (t[3] = p));
  let m;
  t[4] === c
    ? (m = t[5])
    : ((m =
        c &&
        (0, a.jsx)(`p`, {
          className: `mt-2 max-w-sm text-sm text-muted-foreground`,
          children: c,
        })),
      (t[4] = c),
      (t[5] = m));
  let h;
  t[6] !== l || t[7] !== u
    ? ((h =
        l &&
        u &&
        (0, a.jsxs)(n, {
          size: `sm`,
          onClick: u,
          className: `mt-5`,
          children: [(0, a.jsx)(r, { size: 16 }), l],
        })),
      (t[6] = l),
      (t[7] = u),
      (t[8] = h))
    : (h = t[8]);
  let g;
  return (
    t[9] !== d || t[10] !== f || t[11] !== p || t[12] !== m || t[13] !== h
      ? ((g = (0, a.jsxs)(`div`, {
          className: `ui-surface mx-auto flex w-full max-w-xl flex-col items-center justify-center border-dashed px-4 py-8 text-center sm:px-6 sm:py-14`,
          children: [f, p, m, h, d],
        })),
        (t[9] = d),
        (t[10] = f),
        (t[11] = p),
        (t[12] = m),
        (t[13] = h),
        (t[14] = g))
      : (g = t[14]),
    g
  );
}
export { o as t };
