import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useNavigate-B8SeWprX.js";
import { S as i, T as a, f as o } from "./index-DSqEo2z3.js";
import {
  a as s,
  c,
  i as l,
  l as u,
  n as d,
  s as f,
} from "./backend-BVlbQtYj.js";
import { n as p, t as m } from "./hooks-B_9i2gKL.js";
import { i as h, s as g } from "./ThemeContext-CtDStTbS.js";
import {
  Bt as _,
  Kt as v,
  ar as y,
  dr as b,
  ir as x,
  ur as S,
  vr as C,
} from "./src-DzioQSsH.js";
import { n as w, t as T } from "./notification-config-CJfQdFLb.js";
import { n as E } from "./dates-DHZmrCUU.js";
var D = e(t(), 1),
  O = (0, D.createContext)(void 0);
function k() {
  let e = (0, D.useContext)(O);
  if (e === void 0)
    throw Error(
      "Could not find `ConvexProviderWithAuth` (or `ConvexProviderWithClerk` or `ConvexProviderWithAuth0`) as an ancestor component. This component may be missing, or you might have two instances of the `convex/react` module loaded in your project.",
    );
  return e;
}
function A({ children: e, client: t, useAuth: n }) {
  let { isLoading: r, isAuthenticated: i, fetchAccessToken: a } = n(),
    [o, s] = (0, D.useState)(null);
  return (
    r && o !== null && s(null),
    !r && !i && o !== !1 && s(!1),
    D.createElement(
      O.Provider,
      { value: { isLoading: o === null, isAuthenticated: i && (o ?? !1) } },
      D.createElement(j, {
        authProviderAuthenticated: i,
        fetchAccessToken: a,
        authProviderLoading: r,
        client: t,
        setIsConvexAuthenticated: s,
      }),
      D.createElement(l, { client: t }, e),
      D.createElement(M, {
        authProviderAuthenticated: i,
        fetchAccessToken: a,
        authProviderLoading: r,
        client: t,
        setIsConvexAuthenticated: s,
      }),
    )
  );
}
function j({
  authProviderAuthenticated: e,
  fetchAccessToken: t,
  authProviderLoading: n,
  client: r,
  setIsConvexAuthenticated: i,
}) {
  return (
    (0, D.useEffect)(() => {
      let n = !0;
      if (e)
        return (
          r.setAuth(t, (e) => {
            n && i(() => e);
          }),
          () => {
            ((n = !1), i((e) => (e ? !1 : null)));
          }
        );
    }, [e, t, n, r, i]),
    null
  );
}
function M({
  authProviderAuthenticated: e,
  fetchAccessToken: t,
  authProviderLoading: n,
  client: r,
  setIsConvexAuthenticated: i,
}) {
  return (
    (0, D.useEffect)(() => {
      if (e)
        return () => {
          (r.clearAuth(), i(() => null));
        };
    }, [e, t, n, r, i]),
    null
  );
}
function N({ children: e }) {
  let { isLoading: t, isAuthenticated: n } = k();
  return t || !n ? null : D.createElement(D.Fragment, null, e);
}
function P({ children: e }) {
  let { isLoading: t } = k();
  return t ? D.createElement(D.Fragment, null, e) : null;
}
function F(e) {
  let t = (0, D.useRef)({ inFlight: !1, upNext: null });
  return (0, D.useCallback)(
    (...n) => {
      if (t.current.inFlight)
        return new Promise((r, i) => {
          t.current.upNext = { fn: e, resolve: r, reject: i, args: n };
        });
      t.current.inFlight = !0;
      let r = e(...n);
      return (
        (async () => {
          try {
            await r;
          } finally {
          }
          for (; t.current.upNext; ) {
            let e = t.current.upNext;
            ((t.current.upNext = null),
              await e
                .fn(...e.args)
                .then(e.resolve)
                .catch(e.reject));
          }
          t.current.inFlight = !1;
        })(),
        r
      );
    },
    [e],
  );
}
function I(e, t, n, r = 1e4, i) {
  let a = (0, D.useRef)(!1),
    o = f(),
    s = i ?? o.url,
    [l, d] = (0, D.useState)(() => crypto.randomUUID()),
    [p, m] = (0, D.useState)(null),
    h = (0, D.useRef)(null),
    [g, _] = (0, D.useState)(null),
    v = (0, D.useRef)(null),
    y = (0, D.useRef)(null),
    b = F(c(e.heartbeat)),
    x = F(c(e.disconnect));
  ((0, D.useEffect)(() => {
    ((y.current &&= (clearInterval(y.current), null)),
      h.current && x({ sessionToken: h.current }),
      d(crypto.randomUUID()),
      m(null),
      _(null));
  }, [t, n, x]),
    (0, D.useEffect)(() => {
      ((h.current = p), (v.current = g));
    }, [p, g]),
    (0, D.useEffect)(() => {
      let e = async () => {
        let e = await b({ roomId: t, userId: n, sessionId: l, interval: r });
        (_(e.roomToken), m(e.sessionToken));
      };
      (e(),
        y.current && clearInterval(y.current),
        (y.current = setInterval(e, r)));
      let i = () => {
        if (h.current) {
          let e = new Blob(
            [
              JSON.stringify({
                path: `presence:disconnect`,
                args: { sessionToken: h.current },
              }),
            ],
            { type: `application/json` },
          );
          navigator.sendBeacon(`${s}/api/mutation`, e);
        }
      };
      window.addEventListener(`beforeunload`, i);
      let o = async () => {
          document.hidden
            ? ((y.current &&= (clearInterval(y.current), null)),
              h.current && (await x({ sessionToken: h.current })))
            : (e(),
              y.current && clearInterval(y.current),
              (y.current = setInterval(e, r)));
        },
        c = () => {
          o().catch(console.error);
        };
      return (
        document.addEventListener(`visibilitychange`, c),
        () => {
          (y.current && clearInterval(y.current),
            document.removeEventListener(`visibilitychange`, c),
            window.removeEventListener(`beforeunload`, i),
            a.current && h.current && x({ sessionToken: h.current }));
        }
      );
    }, [b, x, t, n, s, r, l]),
    (0, D.useEffect)(() => {
      a.current = !0;
    }, []));
  let S = u(e.list, g ? { roomToken: g } : `skip`);
  return (0, D.useMemo)(
    () =>
      S?.slice().sort((e, t) => (e.userId === n ? -1 : t.userId === n ? 1 : 0)),
    [S, n],
  );
}
function L({ children: e, client: t, useAuth: n }) {
  let r = R(n);
  return D.createElement(A, { client: t, useAuth: r }, e);
}
function R(e) {
  return (0, D.useMemo)(
    () =>
      function () {
        let {
            isLoaded: t,
            isSignedIn: n,
            getToken: r,
            orgId: i,
            orgRole: a,
          } = e(),
          o = (0, D.useCallback)(
            async ({ forceRefreshToken: e }) => {
              try {
                return await r({ template: `convex`, skipCache: e });
              } catch {
                return null;
              }
            },
            [i, a],
          );
        return (0, D.useMemo)(
          () => ({
            isLoading: !t,
            isAuthenticated: n ?? !1,
            fetchAccessToken: o,
          }),
          [t, n, o],
        );
      },
    [e],
  );
}
var z = a(),
  B = n();
function V() {
  return window.matchMedia(`(prefers-color-scheme: dark)`).matches
    ? `dark`
    : `light`;
}
function H(e) {
  return e === `system` ? V() : e;
}
function U(e) {
  document.documentElement.classList.toggle(`dark`, e === `dark`);
}
function W(e) {
  let t = (0, z.c)(15),
    { children: n } = e,
    [r, i] = (0, D.useState)(G),
    a;
  t[0] === r ? (a = t[1]) : ((a = () => H(r)), (t[0] = r), (t[1] = a));
  let [o, s] = (0, D.useState)(a),
    c;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (e) => {
        (i(e), localStorage.setItem(`theme`, e));
        let t = H(e);
        (s(t), U(t));
      }),
      (t[2] = c))
    : (c = t[2]);
  let l = c,
    u,
    d;
  (t[3] === o
    ? ((u = t[4]), (d = t[5]))
    : ((u = () => {
        U(o);
      }),
      (d = [o]),
      (t[3] = o),
      (t[4] = u),
      (t[5] = d)),
    (0, D.useEffect)(u, d));
  let f, p;
  (t[6] === r
    ? ((f = t[7]), (p = t[8]))
    : ((f = () => {
        if (r !== `system`) return;
        let e = window.matchMedia(`(prefers-color-scheme: dark)`),
          t = () => {
            let e = V();
            (s(e), U(e));
          };
        return (
          e.addEventListener(`change`, t),
          () => e.removeEventListener(`change`, t)
        );
      }),
      (p = [r]),
      (t[6] = r),
      (t[7] = f),
      (t[8] = p)),
    (0, D.useEffect)(f, p));
  let m;
  t[9] !== o || t[10] !== r
    ? ((m = { theme: r, resolvedTheme: o, setTheme: l }),
      (t[9] = o),
      (t[10] = r),
      (t[11] = m))
    : (m = t[11]);
  let h;
  return (
    t[12] !== n || t[13] !== m
      ? ((h = (0, B.jsx)(g.Provider, { value: m, children: n })),
        (t[12] = n),
        (t[13] = m),
        (t[14] = h))
      : (h = t[14]),
    h
  );
}
function G() {
  let e = localStorage.getItem(`theme`);
  return e === `dark` || e === `light` || e === `system` ? e : `light`;
}
if (!o.VITE_CONVEX_URL)
  throw Error(`Missing VITE_CONVEX_URL in your .env file`);
var K = new s(o.VITE_CONVEX_URL);
function q() {
  let e = (0, z.c)(4),
    { isAuthenticated: t } = k(),
    n = c(d.auth.ensureUserExists),
    r,
    i;
  return (
    e[0] !== n || e[1] !== t
      ? ((r = () => {
          t && n({}).catch(console.error);
        }),
        (i = [t, n]),
        (e[0] = n),
        (e[1] = t),
        (e[2] = r),
        (e[3] = i))
      : ((r = e[2]), (i = e[3])),
    (0, D.useEffect)(r, i),
    null
  );
}
function J() {
  let e = (0, z.c)(2),
    t = m(d.auth.me);
  if (!t) return null;
  let n;
  return (
    e[0] === t
      ? (n = e[1])
      : ((n = (0, B.jsx)(Y, { userId: t })), (e[0] = t), (e[1] = n)),
    n
  );
}
function Y(e) {
  let { userId: t } = e;
  return (I(d.presence, `platform`, t), null);
}
function X({ children: e }) {
  return (0, B.jsx)(L, {
    client: K,
    useAuth: i,
    children: (0, B.jsxs)(p, {
      children: [
        (0, B.jsx)(q, {}),
        (0, B.jsxs)(W, {
          children: [
            (0, B.jsx)(P, {
              children: (0, B.jsx)(`div`, {
                className: `min-h-screen w-full bg-background`,
                children: (0, B.jsx)(v, { size: `lg` }),
              }),
            }),
            (0, B.jsx)(N, {
              children: (0, B.jsx)(h, {
                children: (0, B.jsxs)(_, {
                  delayDuration: 300,
                  children: [e, (0, B.jsx)(J, {})],
                }),
              }),
            }),
          ],
        }),
      ],
    }),
  });
}
var Z = 4,
  Q = 9e3;
function $() {
  let e = (0, z.c)(18),
    t = m(d.notifications.list),
    n = c(d.notifications.markAsRead),
    i = r(),
    a = (0, D.useRef)(null),
    o;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = []), (e[0] = o))
    : (o = e[0]);
  let [s, l] = (0, D.useState)(o),
    u,
    f;
  (e[1] === t
    ? ((u = e[2]), (f = e[3]))
    : ((u = () => {
        if (!t) return;
        let e = new Set(t.map(ne)),
          n = a.current;
        if (!n) {
          a.current = e;
          return;
        }
        let r = t.filter((e) => !n.has(e._id));
        ((a.current = e),
          r.length !== 0 &&
            l((e) => {
              let t = new Set(e.map(te)),
                n = [...e],
                i = Date.now();
              for (let e of [...r].reverse())
                t.has(e._id) ||
                  (n.unshift({ notification: e, expiresAt: i + Q }),
                  t.add(e._id));
              return n.slice(0, Z);
            }));
      }),
      (f = [t]),
      (e[1] = t),
      (e[2] = u),
      (e[3] = f)),
    (0, D.useEffect)(u, f));
  let p, h;
  (e[4] === s.length
    ? ((p = e[5]), (h = e[6]))
    : ((p = () => {
        if (s.length === 0) return;
        let e = window.setInterval(() => {
          let e = Date.now();
          l((t) => t.filter((t) => t.expiresAt > e));
        }, 500);
        return () => window.clearInterval(e);
      }),
      (h = [s.length]),
      (e[4] = s.length),
      (e[5] = p),
      (e[6] = h)),
    (0, D.useEffect)(p, h));
  let g;
  e[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = (e) => {
        l((t) => t.filter((t) => t.notification._id !== e));
      }),
      (e[7] = g))
    : (g = e[7]);
  let _ = g,
    v;
  e[8] !== n || e[9] !== i
    ? ((v = (e) => {
        if ((e.read || n({ id: e._id }).catch(ee), _(e._id), e.href)) {
          i({ to: e.href });
          return;
        }
        i({ to: `/inbox` });
      }),
      (e[8] = n),
      (e[9] = i),
      (e[10] = v))
    : (v = e[10]);
  let O = v;
  if (s.length === 0) return null;
  let k;
  if (e[11] !== O || e[12] !== s) {
    let t;
    (e[14] === O
      ? (t = e[15])
      : ((t = (e) => {
          let t = e.notification,
            n = w[t.type];
          return (0, B.jsx)(
            x,
            {
              className: `pointer-events-auto bg-background/95 shadow-lg`,
              children: (0, B.jsx)(y, {
                className: `p-3`,
                children: (0, B.jsxs)(`div`, {
                  className: `flex items-start gap-3`,
                  children: [
                    (0, B.jsx)(T, { type: t.type }),
                    (0, B.jsxs)(`div`, {
                      className: `min-w-0 flex-1`,
                      children: [
                        (0, B.jsxs)(`div`, {
                          className: `flex items-start justify-between gap-2`,
                          children: [
                            (0, B.jsx)(`p`, {
                              className: `text-sm font-medium leading-snug`,
                              children: t.title,
                            }),
                            (0, B.jsx)(S, {
                              size: `icon-xs`,
                              variant: `ghost`,
                              onClick: () => _(t._id),
                              "aria-label": `Dismiss notification`,
                              children: (0, B.jsx)(C, { size: 14 }),
                            }),
                          ],
                        }),
                        (0, B.jsxs)(`div`, {
                          className: `mt-1 flex items-center gap-2`,
                          children: [
                            (0, B.jsx)(b, {
                              variant: n.badgeVariant,
                              className: `h-4 px-1.5 py-0 text-[10px]`,
                              children: n.label,
                            }),
                            (0, B.jsx)(`span`, {
                              className: `text-xs text-muted-foreground`,
                              children: E(t.createdAt).fromNow(),
                            }),
                          ],
                        }),
                        (0, B.jsx)(`div`, {
                          className: `mt-2`,
                          children: (0, B.jsx)(S, {
                            size: `sm`,
                            variant: `outline`,
                            className: `h-7 text-xs`,
                            onClick: () => O(t),
                            children: `Open`,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
              }),
            },
            t._id,
          );
        }),
        (e[14] = O),
        (e[15] = t)),
      (k = s.map(t)),
      (e[11] = O),
      (e[12] = s),
      (e[13] = k));
  } else k = e[13];
  let A;
  return (
    e[16] === k
      ? (A = e[17])
      : ((A = (0, B.jsx)(`div`, {
          className: `pointer-events-none fixed right-4 top-20 z-40 flex w-[min(28rem,calc(100vw-2rem))] flex-col gap-2`,
          children: k,
        })),
        (e[16] = k),
        (e[17] = A)),
    A
  );
}
function ee() {}
function te(e) {
  return e.notification._id;
}
function ne(e) {
  return e._id;
}
export { X as n, $ as t };
