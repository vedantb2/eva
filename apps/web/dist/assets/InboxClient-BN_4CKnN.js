import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { t } from "./useNavigate-B8SeWprX.js";
import { T as n } from "./index-DSqEo2z3.js";
import { c as r, n as i } from "./backend-BVlbQtYj.js";
import { t as a } from "./hooks-B_9i2gKL.js";
import { Kt as o, Z as s, dr as c, ur as l } from "./src-DzioQSsH.js";
import { t as u } from "./createReactComponent-C2GWxX5y.js";
import { t as d } from "./notification-config-CJfQdFLb.js";
import { t as f } from "./IconInbox-BNGCUXgg.js";
import { t as p } from "./AnimatePresence-DH-EW7mD.js";
import { n as m } from "./dates-DHZmrCUU.js";
import { S as h, i as g } from "./search-params-2NJX6Or7.js";
import { t as _ } from "./PageWrapper-Z5X-C4Rx.js";
import { t as v } from "./EmptyState-CwbiXtLM.js";
var y = u(`outline`, `checks`, `Checks`, [
    [`path`, { d: `M7 12l5 5l10 -10`, key: `svg-0` }],
    [`path`, { d: `M2 12l5 5m5 -5l5 -5`, key: `svg-1` }],
  ]),
  b = n(),
  x = e(),
  S = new Set([
    `projects`,
    `designs`,
    `docs`,
    `sessions`,
    `quick-tasks`,
    `analyse`,
    `settings`,
    `testing-arena`,
    `stats`,
    `automations`,
    `inbox`,
  ]);
function C(e) {
  let t = e.split(`/`).filter(Boolean);
  if (t.length < 3 || S.has(t[2])) return e;
  let [n, r, i, ...a] = t;
  return `/${n}/${r}--${i}/${a.join(`/`)}`;
}
function w(e) {
  let t = [],
    n = new Map();
  for (let r of e) {
    let e = m(r.createdAt),
      i = m(),
      a;
    if (
      ((a = e.isSame(i, `day`)
        ? `Today`
        : e.isSame(i.subtract(1, `day`), `day`)
          ? `Yesterday`
          : e.isSame(i, `week`)
            ? e.format(`dddd`)
            : e.format(`MMMM D, YYYY`)),
      !n.has(a))
    ) {
      let e = [];
      (n.set(a, e), t.push({ label: a, items: e }));
    }
    n.get(a).push(r);
  }
  return t;
}
function T() {
  let e = (0, b.c)(35),
    n = t(),
    u = a(i.notifications.list),
    S = a(i.notifications.countUnread) ?? 0,
    T = r(i.notifications.markAsRead),
    D = r(i.notifications.markAllAsRead),
    [O, k] = h(`filter`, g),
    A;
  bb0: {
    if (!u) {
      A = void 0;
      break bb0;
    }
    if (O === `unread`) {
      let t;
      (e[0] === u ? (t = e[1]) : ((t = u.filter(E)), (e[0] = u), (e[1] = t)),
        (A = t));
      break bb0;
    }
    A = u;
  }
  let j = A,
    M;
  bb1: {
    if (!j) {
      M = void 0;
      break bb1;
    }
    let t;
    (e[2] === j ? (t = e[3]) : ((t = w(j)), (e[2] = j), (e[3] = t)), (M = t));
  }
  let N = M,
    P;
  e[4] !== T || e[5] !== n
    ? ((P = (e) => {
        (e.read || T({ id: e._id }), e.href && n({ to: C(e.href) }));
      }),
      (e[4] = T),
      (e[5] = n),
      (e[6] = P))
    : (P = e[6]);
  let F = P,
    I = O === `all` ? `secondary` : `ghost`,
    L;
  e[7] === k ? (L = e[8]) : ((L = () => k(`all`)), (e[7] = k), (e[8] = L));
  let R;
  e[9] !== I || e[10] !== L
    ? ((R = (0, x.jsx)(l, {
        size: `sm`,
        variant: I,
        className: `h-7 text-xs`,
        onClick: L,
        children: `All`,
      })),
      (e[9] = I),
      (e[10] = L),
      (e[11] = R))
    : (R = e[11]);
  let z = O === `unread` ? `secondary` : `ghost`,
    B;
  e[12] === k
    ? (B = e[13])
    : ((B = () => k(`unread`)), (e[12] = k), (e[13] = B));
  let V;
  e[14] === S
    ? (V = e[15])
    : ((V =
        S > 0 &&
        (0, x.jsx)(c, {
          className: `ml-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]`,
          children: S,
        })),
      (e[14] = S),
      (e[15] = V));
  let H;
  e[16] !== z || e[17] !== B || e[18] !== V
    ? ((H = (0, x.jsxs)(l, {
        size: `sm`,
        variant: z,
        className: `h-7 text-xs`,
        onClick: B,
        children: [`Unread`, V],
      })),
      (e[16] = z),
      (e[17] = B),
      (e[18] = V),
      (e[19] = H))
    : (H = e[19]);
  let U;
  e[20] !== D || e[21] !== S
    ? ((U =
        S > 0 &&
        (0, x.jsxs)(x.Fragment, {
          children: [
            (0, x.jsx)(`div`, {
              className: `mx-1 h-4 w-px bg-muted-foreground/20 hidden sm:block`,
            }),
            (0, x.jsxs)(l, {
              size: `sm`,
              variant: `ghost`,
              onClick: () => D(),
              className: `h-7 text-xs text-muted-foreground hidden sm:inline-flex`,
              children: [(0, x.jsx)(y, { size: 14 }), `Mark all read`],
            }),
            (0, x.jsx)(l, {
              size: `icon-sm`,
              variant: `ghost`,
              onClick: () => D(),
              className: `h-7 w-7 text-muted-foreground sm:hidden`,
              title: `Mark all as read`,
              children: (0, x.jsx)(y, { size: 14 }),
            }),
          ],
        })),
      (e[20] = D),
      (e[21] = S),
      (e[22] = U))
    : (U = e[22]);
  let W;
  e[23] !== U || e[24] !== R || e[25] !== H
    ? ((W = (0, x.jsxs)(`div`, {
        className: `flex items-center gap-1`,
        children: [R, H, U],
      })),
      (e[23] = U),
      (e[24] = R),
      (e[25] = H),
      (e[26] = W))
    : (W = e[26]);
  let G;
  e[27] !== O || e[28] !== j || e[29] !== N || e[30] !== F
    ? ((G =
        j === void 0
          ? (0, x.jsx)(`div`, {
              className: `flex items-center justify-center py-20`,
              children: (0, x.jsx)(o, {}),
            })
          : j.length === 0
            ? (0, x.jsx)(`div`, {
                className: `flex items-center justify-center py-20`,
                children: (0, x.jsx)(v, {
                  icon: (0, x.jsx)(f, {
                    size: 24,
                    className: `text-muted-foreground`,
                  }),
                  title:
                    O === `unread`
                      ? `No unread notifications`
                      : `No notifications yet`,
                  description: `You're all caught up`,
                }),
              })
            : (0, x.jsx)(`div`, {
                className: `rounded-lg bg-muted/40 overflow-hidden`,
                children: (0, x.jsx)(p, {
                  initial: !1,
                  children: N.map((e) =>
                    (0, x.jsxs)(
                      s.div,
                      {
                        initial: { opacity: 0 },
                        animate: { opacity: 1 },
                        exit: { opacity: 0 },
                        transition: { duration: 0.15 },
                        children: [
                          (0, x.jsx)(`div`, {
                            className: `bg-muted/60 px-3 sm:px-4 py-1.5`,
                            children: (0, x.jsx)(`span`, {
                              className: `text-xs font-medium text-muted-foreground`,
                              children: e.label,
                            }),
                          }),
                          e.items.map((e, t) =>
                            (0, x.jsx)(
                              s.div,
                              {
                                initial: { opacity: 0 },
                                animate: { opacity: 1 },
                                exit: { opacity: 0, height: 0 },
                                transition: {
                                  duration: 0.15,
                                  delay: Math.min(t * 0.02, 0.1),
                                },
                                children: (0, x.jsxs)(`button`, {
                                  onClick: () => F(e),
                                  className: `group flex w-full items-center gap-2 px-3 py-2 text-left transition-colors duration-100 hover:bg-muted/50 focus-visible:outline-none focus-visible:bg-muted/50 sm:gap-3 sm:px-4 ${e.read ? `opacity-60` : ``}`,
                                  children: [
                                    (0, x.jsx)(`div`, {
                                      className: `flex w-3 items-center justify-center flex-shrink-0`,
                                      children:
                                        !e.read &&
                                        (0, x.jsx)(`span`, {
                                          className: `h-2 w-2 rounded-full bg-primary`,
                                        }),
                                    }),
                                    (0, x.jsx)(d, { type: e.type, size: `sm` }),
                                    (0, x.jsx)(`span`, {
                                      className: `flex-1 min-w-0 text-xs font-medium truncate sm:text-sm`,
                                      children: e.title,
                                    }),
                                    (0, x.jsx)(`span`, {
                                      className: `text-[10px] text-muted-foreground tabular-nums flex-shrink-0 sm:text-xs`,
                                      children: m(e.createdAt).fromNow(),
                                    }),
                                  ],
                                }),
                              },
                              e._id,
                            ),
                          ),
                        ],
                      },
                      e.label,
                    ),
                  ),
                }),
              })),
      (e[27] = O),
      (e[28] = j),
      (e[29] = N),
      (e[30] = F),
      (e[31] = G))
    : (G = e[31]);
  let K;
  return (
    e[32] !== W || e[33] !== G
      ? ((K = (0, x.jsx)(_, { title: `Inbox`, headerRight: W, children: G })),
        (e[32] = W),
        (e[33] = G),
        (e[34] = K))
      : (K = e[34]),
    K
  );
}
function E(e) {
  return !e.read;
}
export { T as t };
