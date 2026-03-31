import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
import { r as n, t as r } from "./useRouter-DlGunSkq.js";
import { p as i } from "./useStore-DeDDmIeh.js";
import { a, i as o, n as s, o as c, s as l } from "./route-D5lx65YK.js";
import { n as u, t as d } from "./useSearch-BIrryvYa.js";
import { t as f } from "./useNavigate-B8SeWprX.js";
function p(e) {
  return typeof e == `object`
    ? new m(e, { silent: !0 }).createRoute(e)
    : new m(e, { silent: !0 }).createRoute;
}
var m = class {
    constructor(e, t) {
      ((this.path = e),
        (this.createRoute = (e) => {
          let t = s(e);
          return ((t.isRoot = !1), t);
        }),
        (this.silent = t?.silent));
    }
  },
  h = class {
    constructor(e) {
      ((this.useMatch = (e) =>
        u({
          select: e?.select,
          from: this.options.id,
          structuralSharing: e?.structuralSharing,
        })),
        (this.useRouteContext = (e) => o({ ...e, from: this.options.id })),
        (this.useSearch = (e) =>
          d({
            select: e?.select,
            structuralSharing: e?.structuralSharing,
            from: this.options.id,
          })),
        (this.useParams = (e) =>
          a({
            select: e?.select,
            structuralSharing: e?.structuralSharing,
            from: this.options.id,
          })),
        (this.useLoaderDeps = (e) => c({ ...e, from: this.options.id })),
        (this.useLoaderData = (e) => l({ ...e, from: this.options.id })),
        (this.useNavigate = () =>
          f({ from: r().routesById[this.options.id].fullPath })),
        (this.options = e));
    }
  };
function g(e) {
  return typeof e == `object` ? new h(e) : (t) => new h({ id: e, ...t });
}
var _ = e(t(), 1);
function v(e, t) {
  let r,
    a,
    o,
    s,
    c = () => (
      (r ||= e()
        .then((e) => {
          ((r = void 0), (a = e[t ?? `default`]));
        })
        .catch((e) => {
          if (
            ((o = e),
            i(o) &&
              o instanceof Error &&
              typeof window < `u` &&
              typeof sessionStorage < `u`)
          ) {
            let e = `tanstack_router_reload:${o.message}`;
            sessionStorage.getItem(e) ||
              (sessionStorage.setItem(e, `1`), (s = !0));
          }
        })),
      r
    ),
    l = function (e) {
      if (s) throw (window.location.reload(), new Promise(() => {}));
      if (o) throw o;
      if (!a)
        if (n) n(c());
        else throw c();
      return _.createElement(a, e);
    };
  return ((l.preload = c), l);
}
export { p as n, g as r, v as t };
