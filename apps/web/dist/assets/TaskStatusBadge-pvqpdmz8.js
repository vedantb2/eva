import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { dr as n } from "./src-DzioQSsH.js";
import { t as r } from "./createReactComponent-C2GWxX5y.js";
import { t as i } from "./IconCircleCheck-DfkWjjtD.js";
import { t as a } from "./IconClock-BRHjI4rV.js";
import { t as o } from "./IconEye-B7_3GMo_.js";
import { t as s } from "./IconPencil-D7oAN1Zq.js";
var c = r(`outline`, `circle-x`, `CircleX`, [
    [`path`, { d: `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0`, key: `svg-0` }],
    [`path`, { d: `M10 10l4 4m0 -4l-4 4`, key: `svg-1` }],
  ]),
  l = r(`outline`, `circle`, `Circle`, [
    [`path`, { d: `M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0`, key: `svg-0` }],
  ]),
  u = r(`outline`, `clipboard-check`, `ClipboardCheck`, [
    [
      `path`,
      {
        d: `M9 5h-2a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-12a2 2 0 0 0 -2 -2h-2`,
        key: `svg-0`,
      },
    ],
    [
      `path`,
      {
        d: `M9 5a2 2 0 0 1 2 -2h2a2 2 0 0 1 2 2a2 2 0 0 1 -2 2h-2a2 2 0 0 1 -2 -2`,
        key: `svg-1`,
      },
    ],
    [`path`, { d: `M9 14l2 2l4 -4`, key: `svg-2` }],
  ]),
  d = t(),
  f = e(),
  p = [
    `todo`,
    `in_progress`,
    `code_review`,
    `business_review`,
    `done`,
    `cancelled`,
  ],
  m = {
    draft: {
      bg: `bg-secondary`,
      cardBg: `bg-secondary`,
      bar: `bg-muted-foreground/50`,
      text: `text-muted-foreground`,
      label: `Draft`,
      icon: s,
    },
    todo: {
      bg: `bg-secondary`,
      cardBg: `bg-secondary`,
      bar: `bg-foreground/50`,
      text: `text-muted-foreground`,
      label: `To Do`,
      icon: l,
    },
    in_progress: {
      bg: `bg-status-progress-bg`,
      cardBg: `bg-status-progress-subtle`,
      bar: `bg-status-progress-bar`,
      text: `text-status-progress`,
      label: `In Progress`,
      icon: a,
    },
    code_review: {
      bg: `bg-status-code-review-bg`,
      cardBg: `bg-status-code-review-subtle`,
      bar: `bg-status-code-review-bar`,
      text: `text-status-code-review`,
      label: `Code Review`,
      icon: o,
    },
    business_review: {
      bg: `bg-status-business-review-bg`,
      cardBg: `bg-status-business-review-subtle`,
      bar: `bg-status-business-review-bar`,
      text: `text-status-business-review`,
      label: `Business Review`,
      icon: u,
    },
    done: {
      bg: `bg-status-done-bg`,
      cardBg: `bg-status-done-subtle`,
      bar: `bg-status-done-bar`,
      text: `text-status-done`,
      label: `Done`,
      icon: i,
    },
    cancelled: {
      bg: `bg-status-cancelled-bg`,
      cardBg: `bg-status-cancelled-subtle`,
      bar: `bg-status-cancelled-bar`,
      text: `text-status-cancelled`,
      label: `Cancelled`,
      icon: c,
    },
  };
function h(e) {
  let t = (0, d.c)(7),
    { status: r } = e,
    i = m[r],
    a = i.icon,
    o = `${i.text} ${i.bg} border-transparent`,
    s = `mr-1 ${i.text}`,
    c;
  t[0] !== a || t[1] !== s
    ? ((c = (0, f.jsx)(a, { size: 14, className: s })),
      (t[0] = a),
      (t[1] = s),
      (t[2] = c))
    : (c = t[2]);
  let l;
  return (
    t[3] !== i.label || t[4] !== o || t[5] !== c
      ? ((l = (0, f.jsxs)(n, { className: o, children: [c, i.label] })),
        (t[3] = i.label),
        (t[4] = o),
        (t[5] = c),
        (t[6] = l))
      : (l = t[6]),
    l
  );
}
export { c as i, h as n, m as r, p as t };
