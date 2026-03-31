import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-DSqEo2z3.js";
import { ar as n, dr as r, ir as i, or as a } from "./src-DzioQSsH.js";
import { t as o } from "./createReactComponent-C2GWxX5y.js";
import "./TaskStatusBadge-pvqpdmz8.js";
import { _ as s } from "./ProjectPhaseBadge-Df5sMfLH.js";
var c = o(`outline`, `list`, `List`, [
    [`path`, { d: `M9 6l11 0`, key: `svg-0` }],
    [`path`, { d: `M9 12l11 0`, key: `svg-1` }],
    [`path`, { d: `M9 18l11 0`, key: `svg-2` }],
    [`path`, { d: `M5 6l0 .01`, key: `svg-3` }],
    [`path`, { d: `M5 12l0 .01`, key: `svg-4` }],
    [`path`, { d: `M5 18l0 .01`, key: `svg-5` }],
  ]),
  l = t(),
  u = e();
function d(e) {
  let t = (0, l.c)(27),
    {
      id: o,
      config: c,
      count: d,
      children: f,
      droppable: p,
      headerExtra: m,
      emptyLabel: h,
    } = e,
    g = p === void 0 ? !0 : p,
    _ = h === void 0 ? `No items` : h,
    v = !g,
    y;
  t[0] !== o || t[1] !== v
    ? ((y = { id: o, disabled: v }), (t[0] = o), (t[1] = v), (t[2] = y))
    : (y = t[2]);
  let { setNodeRef: b, isOver: x } = s(y),
    S = c.icon,
    C = `flex min-h-0 min-w-0 flex-1 self-stretch flex-col overflow-clip shadow-none transition-colors duration-200 border-none ${x ? `bg-primary/10` : `bg-accent/15`}`,
    w = `${c.bg} ${c.text} gap-1.5 border-transparent py-1`,
    T;
  t[3] !== S || t[4] !== c.text
    ? ((T = (0, u.jsx)(S, { size: 14, className: c.text })),
      (t[3] = S),
      (t[4] = c.text),
      (t[5] = T))
    : (T = t[5]);
  let E;
  t[6] === d
    ? (E = t[7])
    : ((E = (0, u.jsx)(`span`, {
        className: `text-foreground/50 tabular-nums`,
        children: d,
      })),
      (t[6] = d),
      (t[7] = E));
  let D;
  t[8] !== c.label || t[9] !== w || t[10] !== T || t[11] !== E
    ? ((D = (0, u.jsxs)(r, {
        variant: `outline`,
        className: w,
        children: [T, c.label, E],
      })),
      (t[8] = c.label),
      (t[9] = w),
      (t[10] = T),
      (t[11] = E),
      (t[12] = D))
    : (D = t[12]);
  let O;
  t[13] !== m || t[14] !== D
    ? ((O = (0, u.jsxs)(a, {
        className: `flex flex-row items-center justify-between p-2 pb-2 md:p-2 md:pb-2 flex-shrink-0 space-y-0`,
        children: [D, m],
      })),
      (t[13] = m),
      (t[14] = D),
      (t[15] = O))
    : (O = t[15]);
  let k;
  t[16] !== d || t[17] !== _
    ? ((k =
        d === 0 &&
        (0, u.jsx)(`div`, {
          className: `flex flex-1 items-center justify-center py-6 text-xs text-muted-foreground/50`,
          children: _,
        })),
      (t[16] = d),
      (t[17] = _),
      (t[18] = k))
    : (k = t[18]);
  let A;
  t[19] !== f || t[20] !== k
    ? ((A = (0, u.jsxs)(n, {
        className: `flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto overscroll-y-contain p-1.5 pt-0 scrollbar md:p-1.5 md:pt-0`,
        children: [k, f],
      })),
      (t[19] = f),
      (t[20] = k),
      (t[21] = A))
    : (A = t[21]);
  let j;
  return (
    t[22] !== b || t[23] !== O || t[24] !== A || t[25] !== C
      ? ((j = (0, u.jsxs)(i, { ref: b, className: C, children: [O, A] })),
        (t[22] = b),
        (t[23] = O),
        (t[24] = A),
        (t[25] = C),
        (t[26] = j))
      : (j = t[26]),
    j
  );
}
export { c as n, d as t };
