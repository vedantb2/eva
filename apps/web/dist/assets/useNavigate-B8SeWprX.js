import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
import { t as n } from "./useRouter-DlGunSkq.js";
var r = e(t(), 1);
function i(e) {
  let t = n();
  return r.useCallback(
    (n) => t.navigate({ ...n, from: n.from ?? e?.from }),
    [e?.from, t],
  );
}
export { i as t };
