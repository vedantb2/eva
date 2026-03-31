import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
import { t as n } from "./useRouter-DlGunSkq.js";
import { _ as r, r as i, t as a } from "./useStore-DeDDmIeh.js";
import { n as o, t as s } from "./matchContext-BiQ98AWt.js";
var c = e(t(), 1),
  l = { state: void 0, get: () => void 0, subscribe: () => () => {} };
function u(e) {
  let t = n(),
    u = c.useContext(e.from ? s : o),
    d = e.from ?? u,
    f = d
      ? e.from
        ? t.stores.getMatchStoreByRouteId(d)
        : t.stores.activeMatchStoresById.get(d)
      : void 0,
    p = c.useRef(void 0);
  return a(f ?? l, (n) => {
    if (((e.shouldThrow ?? !0) && !n && i(), n === void 0)) return;
    let a = e.select ? e.select(n) : n;
    if (e.structuralSharing ?? t.options.defaultStructuralSharing) {
      let e = r(p.current, a);
      return ((p.current = e), e);
    }
    return a;
  });
}
function d(e) {
  return u({
    from: e.from,
    strict: e.strict,
    shouldThrow: e.shouldThrow,
    structuralSharing: e.structuralSharing,
    select: (t) => (e.select ? e.select(t.search) : t.search),
  });
}
export { u as n, d as t };
