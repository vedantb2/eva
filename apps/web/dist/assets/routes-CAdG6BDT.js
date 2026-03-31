import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useNavigate-B8SeWprX.js";
import { S as i, T as a, b as o, f as s, y as c } from "./index-DSqEo2z3.js";
import { ur as l } from "./src-DzioQSsH.js";
var u = a(),
  d = e(t()),
  f = n(),
  p = s.VITE_ENV === `production`;
function m() {
  let e = (0, u.c)(8),
    { isSignedIn: t, isLoaded: n } = i(),
    a = r(),
    s;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = new URLSearchParams(window.location.search).has(`agent`)),
      (e[0] = s))
    : (s = e[0]);
  let m = s,
    g,
    _;
  (e[1] !== n || e[2] !== t || e[3] !== a
    ? ((g = () => {
        if (n) {
          if (t) {
            a({ to: `/home`, replace: !0 });
            return;
          }
          m && (window.location.href = `/api/auth/agent-login`);
        }
      }),
      (_ = [n, t, m, a]),
      (e[1] = n),
      (e[2] = t),
      (e[3] = a),
      (e[4] = g),
      (e[5] = _))
    : ((g = e[4]), (_ = e[5])),
    (0, d.useEffect)(g, _));
  let v;
  e[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = (0, f.jsxs)(`div`, {
        className: `flex flex-col items-center gap-4`,
        children: [
          (0, f.jsx)(`img`, {
            src: `/icon.png`,
            alt: `Eva`,
            width: 80,
            height: 80,
            className: `rounded-2xl`,
          }),
          (0, f.jsx)(`h1`, {
            className: `text-3xl font-bold tracking-tight text-foreground`,
            children: `Eva`,
          }),
          (0, f.jsx)(`p`, {
            className: `text-center text-sm text-muted-foreground`,
            children: `Your AI Coworker`,
          }),
        ],
      })),
      (e[6] = v))
    : (v = e[6]);
  let y;
  return (
    e[7] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((y = (0, f.jsx)(`div`, {
          className: `flex min-h-screen items-center justify-center`,
          children: (0, f.jsxs)(`div`, {
            className: `flex flex-col items-center gap-8`,
            children: [
              v,
              (0, f.jsx)(`div`, {
                className: `flex flex-col gap-3 sm:flex-row`,
                children: p
                  ? (0, f.jsxs)(f.Fragment, {
                      children: [
                        (0, f.jsx)(l, {
                          size: `lg`,
                          variant: `default`,
                          disabled: !0,
                          children: `Sign In`,
                        }),
                        (0, f.jsx)(l, {
                          size: `lg`,
                          variant: `outline`,
                          disabled: !0,
                          children: `Sign Up`,
                        }),
                      ],
                    })
                  : (0, f.jsxs)(f.Fragment, {
                      children: [
                        (0, f.jsx)(c, {
                          mode: `modal`,
                          children: (0, f.jsx)(l, {
                            size: `lg`,
                            variant: `default`,
                            children: `Sign In`,
                          }),
                        }),
                        (0, f.jsx)(o, {
                          mode: `modal`,
                          children: (0, f.jsx)(l, {
                            size: `lg`,
                            variant: `outline`,
                            children: `Sign Up`,
                          }),
                        }),
                      ],
                    }),
              }),
              !p &&
                (0, f.jsx)(`div`, {
                  className: `flex justify-center`,
                  children: (0, f.jsx)(l, {
                    size: `lg`,
                    variant: `outline`,
                    onClick: h,
                    children: `Sign in as Eva`,
                  }),
                }),
              p &&
                (0, f.jsx)(`div`, {
                  className: `max-w-sm rounded-lg bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground`,
                  children: `Eva is fully open source and self-hosted. Clone the repo, create your own Convex and Clerk projects, and run it locally.`,
                }),
            ],
          }),
        })),
        (e[7] = y))
      : (y = e[7]),
    y
  );
}
function h() {
  window.location.href = `/?agent`;
}
export { m as component };
