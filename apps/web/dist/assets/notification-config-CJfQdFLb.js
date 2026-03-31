import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { Tr as n, fr as r, pr as i } from "./src-DzioQSsH.js";
import { t as a } from "./createReactComponent-C2GWxX5y.js";
import { t as o } from "./IconAlertTriangle-B1Mqbt3_.js";
import { t as s } from "./IconInfoCircle-DJ0cNBVW.js";
import { t as c } from "./IconMessage-DOvCfST-.js";
import { t as l } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as u } from "./IconUserPlus-sJRgozpx.js";
var d = a(`outline`, `file-export`, `FileExport`, [
    [`path`, { d: `M14 3v4a1 1 0 0 0 1 1h4`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M11.5 21h-4.5a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v5m-5 6h7m-3 -3l3 3l-3 3`,
        key: `svg-1`,
      },
    ],
  ]),
  f = a(`outline`, `repeat`, `Repeat`, [
    [`path`, { d: `M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3`, key: `svg-0` }],
    [`path`, { d: `M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3`, key: `svg-1` }],
  ]),
  p = t(),
  m = e(),
  h = {
    routine_complete: {
      icon: f,
      label: `Routine`,
      badgeVariant: `secondary`,
      iconBg: `bg-secondary`,
      iconColor: `text-secondary-foreground`,
    },
    export_ready: {
      icon: d,
      label: `Export`,
      badgeVariant: `default`,
      iconBg: `bg-primary/10`,
      iconColor: `text-primary`,
    },
    task_complete: {
      icon: n,
      label: `Task Done`,
      badgeVariant: `success`,
      iconBg: `bg-success/10`,
      iconColor: `text-success`,
    },
    task_assigned: {
      icon: u,
      label: `Assigned`,
      badgeVariant: `warning`,
      iconBg: `bg-warning/10`,
      iconColor: `text-warning`,
    },
    comment_added: {
      icon: c,
      label: `Comment`,
      badgeVariant: `default`,
      iconBg: `bg-primary/10`,
      iconColor: `text-primary`,
    },
    run_completed: {
      icon: l,
      label: `Run Done`,
      badgeVariant: `success`,
      iconBg: `bg-success/10`,
      iconColor: `text-success`,
    },
    rate_limit: {
      icon: o,
      label: `Rate Limit`,
      badgeVariant: `warning`,
      iconBg: `bg-warning/10`,
      iconColor: `text-warning`,
    },
    system: {
      icon: s,
      label: `System`,
      badgeVariant: `outline`,
      iconBg: `bg-muted`,
      iconColor: `text-muted-foreground`,
    },
  };
function g(e) {
  let t = (0, p.c)(10),
    { type: n, size: a } = e,
    o = a === void 0 ? `sm` : a,
    s = h[n],
    c = s.icon,
    l = o === `sm` ? `h-8 w-8` : `h-10 w-10`,
    u = o === `sm` ? 16 : 20,
    d = `${l} rounded-lg flex-shrink-0`,
    f = `rounded-lg ${s.iconBg}`,
    g;
  t[0] !== c || t[1] !== s.iconColor || t[2] !== u
    ? ((g = (0, m.jsx)(c, { size: u, className: s.iconColor })),
      (t[0] = c),
      (t[1] = s.iconColor),
      (t[2] = u),
      (t[3] = g))
    : (g = t[3]);
  let _;
  t[4] !== f || t[5] !== g
    ? ((_ = (0, m.jsx)(i, { className: f, children: g })),
      (t[4] = f),
      (t[5] = g),
      (t[6] = _))
    : (_ = t[6]);
  let v;
  return (
    t[7] !== d || t[8] !== _
      ? ((v = (0, m.jsx)(r, { className: d, children: _ })),
        (t[7] = d),
        (t[8] = _),
        (t[9] = v))
      : (v = t[9]),
    v
  );
}
export { h as n, g as t };
