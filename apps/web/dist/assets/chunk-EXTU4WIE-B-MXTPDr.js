import { h as e, p as t } from "./src-BAB06iur.js";
import { b as n } from "./chunk-ABZYJK2D-BcBvUh_0.js";
var r = e((e) => {
  let { securityLevel: r } = n(),
    i = t(`body`);
  return (
    r === `sandbox` &&
      (i = t((t(`#i${e}`).node()?.contentDocument ?? document).body)),
    i.select(`#${e}`)
  );
}, `selectSvgElement`);
export { r as t };
