import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { d as r, r as i, s as a, u as o } from "./backend-BVlbQtYj.js";
var s = n(),
  c = e(t(), 1),
  l = (0, c.createContext)({ registry: null }),
  u = ({ children: e, debug: t, expiration: n, maxIdleEntries: r }) => {
    let i = a();
    if (i === void 0)
      throw Error(
        "Could not find Convex client! `ConvexQueryCacheProvider` must be used in the React component tree under `ConvexProvider`. Did you forget it? See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app",
      );
    let o = (0, c.useMemo)(
      () => new p(i, { debug: t, expiration: n, maxIdleEntries: r }),
      [i, t, n, r],
    );
    return (0, s.jsx)(l.Provider, { value: { registry: o }, children: e });
  },
  d = 3e5,
  f = 250,
  p = class {
    queries;
    subs;
    convex;
    timeout;
    maxIdleEntries;
    idle;
    constructor(e, t) {
      if (
        ((this.queries = new Map()),
        (this.subs = new Map()),
        (this.convex = e),
        (this.idle = 0),
        (this.timeout = t.expiration ?? d),
        (this.maxIdleEntries = t.maxIdleEntries ?? f),
        t.debug ?? !1)
      ) {
        let e = new WeakRef(this),
          t = setInterval(() => {
            let n = e.deref();
            n === void 0 ? clearInterval(t) : n.debug();
          }, 3e3);
      }
    }
    start(e, t, n, r) {
      let i = this.queries.get(t);
      (this.subs.set(e, t),
        i === void 0
          ? ((i = {
              refs: new Set(),
              evictTimer: null,
              unsub: this.convex.watchQuery(n, r).onUpdate(() => {}),
            }),
            this.queries.set(t, i))
          : i.evictTimer !== null &&
            (--this.idle, clearTimeout(i.evictTimer), (i.evictTimer = null)),
        i.refs.add(e));
    }
    end(e) {
      let t = this.subs.get(e);
      if (t) {
        this.subs.delete(e);
        let n = this.queries.get(t);
        if ((n?.refs.delete(e), n?.refs.size === 0)) {
          let e = () => {
            (n.unsub(), this.queries.delete(t));
          };
          this.idle == this.maxIdleEntries
            ? e()
            : ((this.idle += 1),
              (n.evictTimer = window.setTimeout(() => {
                (--this.idle, e());
              }, this.timeout)));
        }
      }
    }
    debug() {
      (console.log(`DEBUG CACHE`),
        console.log(`IDLE = ${this.idle}`),
        console.log(` SUBS`));
      for (let [e, t] of this.subs.entries()) console.log(`  ${e} => ${t}`);
      console.log(` QUERIES`);
      for (let [e, t] of this.queries.entries())
        console.log(`  ${e} => ${t.refs.size} refs, evict = ${t.evictTimer}`);
      console.log(`~~~~~~~~~~~~~~~~~~~~~~`);
    }
  },
  m =
    typeof crypto < `u` && crypto.randomUUID
      ? crypto.randomUUID.bind(crypto)
      : () =>
          Math.random().toString(36).substring(2) +
          Math.random().toString(36).substring(2);
function h(e) {
  let { registry: t } = (0, c.useContext)(l);
  if (t === null)
    throw Error(
      "Could not find `ConvexQueryCacheContext`! This `useQuery` implementation must be used in the React component tree under `ConvexQueryCacheProvider`. Did you forget it? ",
    );
  let n = {};
  for (let [t, { query: r, args: i }] of Object.entries(e)) n[t] = _(r, i);
  return (
    (0, c.useEffect)(() => {
      let r = [];
      for (let [i, { query: a, args: o }] of Object.entries(e)) {
        let e = m();
        (t.start(e, n[i], a, o), r.push(e));
      }
      return () => {
        for (let e of r) t.end(e);
      };
    }, [t, JSON.stringify(n)]),
    i((0, c.useMemo)(() => e, [JSON.stringify(n)]))
  );
}
function g(e, ...t) {
  let n = t[0] ?? {},
    r = h(n === `skip` ? {} : { _default: { query: e, args: n } })._default;
  if (r instanceof Error) throw r;
  return r;
}
function _(e, t) {
  let n = [o(e), r(t)];
  return JSON.stringify(n);
}
export { u as n, g as t };
