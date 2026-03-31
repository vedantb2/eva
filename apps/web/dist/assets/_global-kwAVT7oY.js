import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { D as t, T as n } from "./index-CuMF3NGg.js";
import { n as r, t as i } from "./NotificationToastStream-6oFj6yLC.js";
import { n as a, r as o, t as s } from "./Sidebar-7q-1YaRQ.js";
var c = n(),
  l = e();
function u() {
  let e = (0, c.c)(4),
    { collapsed: n } = o(),
    r = `relative flex min-h-screen flex-col pt-14 transition-[padding] duration-300 lg:pt-0 ${n ? `lg:pl-20` : `lg:pl-64`}`,
    i;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, l.jsx)(`div`, {
        "aria-hidden": !0,
        className: `pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent`,
      })),
      (e[0] = i))
    : (i = e[0]);
  let a;
  e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = (0, l.jsxs)(`div`, {
        className: `relative flex flex-1 flex-col bg-background`,
        children: [
          i,
          (0, l.jsx)(`div`, {
            className: `relative z-10 mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8`,
            children: (0, l.jsx)(t, {}),
          }),
        ],
      })),
      (e[1] = a))
    : (a = e[1]);
  let s;
  return (
    e[2] === r
      ? (s = e[3])
      : ((s = (0, l.jsx)(`div`, { className: r, children: a })),
        (e[2] = r),
        (e[3] = s)),
    s
  );
}
function d() {
  let e = (0, c.c)(1),
    t;
  return (
    e[0] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((t = (0, l.jsx)(r, {
          children: (0, l.jsxs)(a, {
            children: [(0, l.jsx)(s, {}), (0, l.jsx)(u, {}), (0, l.jsx)(i, {})],
          }),
        })),
        (e[0] = t))
      : (t = e[0]),
    t
  );
}
export { d as component };
