import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { D as t, T as n } from "./index-DSqEo2z3.js";
import { n as r, t as i } from "./NotificationToastStream-BGiKC4L_.js";
var a = n(),
  o = e();
function s() {
  let e = (0, a.c)(2),
    n;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((n = (0, o.jsx)(`div`, {
        "aria-hidden": !0,
        className: `pointer-events-none fixed inset-x-0 top-0 z-0 h-56 bg-gradient-to-b from-background/90 via-background/45 to-transparent`,
      })),
      (e[0] = n))
    : (n = e[0]);
  let s;
  return (
    e[1] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((s = (0, o.jsx)(r, {
          children: (0, o.jsxs)(`div`, {
            className: `relative min-h-screen bg-app-shell`,
            children: [
              n,
              (0, o.jsx)(`div`, {
                className: `relative z-10`,
                children: (0, o.jsx)(t, {}),
              }),
              (0, o.jsx)(i, {}),
            ],
          }),
        })),
        (e[1] = s))
      : (s = e[1]),
    s
  );
}
export { s as component };
