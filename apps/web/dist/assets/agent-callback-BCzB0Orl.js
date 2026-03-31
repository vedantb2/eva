import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useSearch-BIrryvYa.js";
import { t as i } from "./useNavigate-B8SeWprX.js";
import { C as a, T as o } from "./index-DSqEo2z3.js";
var s = o(),
  c = e(t()),
  l = n();
function u() {
  let e = (0, s.c)(8),
    { signIn: t, setActive: n } = a(),
    o;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = { from: `/agent-callback` }), (e[0] = o))
    : (o = e[0]);
  let { ticket: u } = r(o),
    f = i(),
    p = (0, c.useRef)(!1),
    m,
    h;
  (e[1] !== f || e[2] !== n || e[3] !== t || e[4] !== u
    ? ((m = () => {
        !u ||
          !t ||
          p.current ||
          ((p.current = !0),
          t
            .create({ strategy: `ticket`, ticket: u })
            .then((e) => {
              if (e.createdSessionId)
                return n({ session: e.createdSessionId }).then(() => {
                  f({ to: `/home`, replace: !0 });
                });
            })
            .catch(d));
      }),
      (h = [t, n, u, f]),
      (e[1] = f),
      (e[2] = n),
      (e[3] = t),
      (e[4] = u),
      (e[5] = m),
      (e[6] = h))
    : ((m = e[5]), (h = e[6])),
    (0, c.useEffect)(m, h));
  let g;
  return (
    e[7] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((g = (0, l.jsx)(`div`, {
          className: `flex h-screen items-center justify-center`,
          children: (0, l.jsx)(`p`, {
            className: `text-muted-foreground`,
            children: `Signing in...`,
          }),
        })),
        (e[7] = g))
      : (g = e[7]),
    g
  );
}
function d(e) {
  console.error(`Agent sign-in failed:`, e);
}
export { u as component };
