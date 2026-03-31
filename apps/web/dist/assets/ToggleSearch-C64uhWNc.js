import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import {
  Rt as i,
  Vt as a,
  Z as o,
  br as s,
  sn as c,
  ur as l,
  vr as u,
  zt as d,
} from "./src-DzioQSsH.js";
import { t as f } from "./createReactComponent-C2GWxX5y.js";
import { t as p } from "./AnimatePresence-DH-EW7mD.js";
var m = f(`outline`, `filter`, `Filter`, [
    [
      `path`,
      {
        d: `M4 4h16v2.172a2 2 0 0 1 -.586 1.414l-4.414 4.414v7l-6 2v-8.5l-4.48 -4.928a2 2 0 0 1 -.52 -1.345v-2.227`,
        key: `svg-0`,
      },
    ],
  ]),
  h = r(),
  g = e(t(), 1),
  _ = n();
function v(e) {
  let t = (0, h.c)(6),
    { value: n, onChange: r, placeholder: f, tooltipLabel: m, visible: v } = e,
    y = f === void 0 ? `Search...` : f,
    b = m === void 0 ? `Search` : m,
    x = v === void 0 ? !0 : v,
    [S, C] = (0, g.useState)(!1),
    w = S || !!n;
  if (!x) return null;
  let T;
  return (
    t[0] !== r || t[1] !== y || t[2] !== w || t[3] !== b || t[4] !== n
      ? ((T = (0, _.jsx)(p, {
          mode: `popLayout`,
          initial: !1,
          children: w
            ? (0, _.jsx)(
                o.div,
                {
                  initial: { opacity: 0, width: 0 },
                  animate: { opacity: 1, width: `auto` },
                  exit: { opacity: 0, width: 0 },
                  transition: { duration: 0.2 },
                  className: `overflow-hidden`,
                  children: (0, _.jsxs)(`div`, {
                    className: `relative w-28 sm:w-32 md:w-44`,
                    children: [
                      (0, _.jsx)(s, {
                        size: 14,
                        className: `pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground`,
                      }),
                      (0, _.jsx)(c, {
                        autoFocus: !0,
                        placeholder: y,
                        value: n,
                        onChange: (e) => r(e.target.value || null),
                        onBlur: () => {
                          n || C(!1);
                        },
                        onKeyDown: (e) => {
                          e.key === `Escape` && (r(null), C(!1));
                        },
                        className: `h-8 pl-7 pr-7 text-sm`,
                      }),
                      n &&
                        (0, _.jsx)(`button`, {
                          type: `button`,
                          onClick: () => {
                            (r(null), C(!1));
                          },
                          className: `absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground`,
                          children: (0, _.jsx)(u, { size: 13 }),
                        }),
                    ],
                  }),
                },
                `toggle-search-input`,
              )
            : (0, _.jsx)(
                o.div,
                {
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                  transition: { duration: 0.15 },
                  children: (0, _.jsxs)(i, {
                    children: [
                      (0, _.jsx)(a, {
                        asChild: !0,
                        children: (0, _.jsx)(l, {
                          variant: `ghost`,
                          size: `icon`,
                          className: `motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97]`,
                          onClick: () => C(!0),
                          children: (0, _.jsx)(s, { size: 16 }),
                        }),
                      }),
                      (0, _.jsx)(d, { children: b }),
                    ],
                  }),
                },
                `toggle-search-icon`,
              ),
        })),
        (t[0] = r),
        (t[1] = y),
        (t[2] = w),
        (t[3] = b),
        (t[4] = n),
        (t[5] = T))
      : (T = t[5]),
    T
  );
}
export { m as n, v as t };
