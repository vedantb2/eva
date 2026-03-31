import { t as e } from "./chunk-XAJISQIX-Bc9dQdPG.js";
import { g as t, h as n } from "./src-BAB06iur.js";
import { c as r } from "./chunk-ABZYJK2D-BcBvUh_0.js";
import { t as i } from "./chunk-EXTU4WIE-B-MXTPDr.js";
import { t as a } from "./mermaid-parser.core-Cg-_l7W8.js";
var o = {
    parse: n(async (e) => {
      let n = await a(`info`, e);
      t.debug(n);
    }, `parse`),
  },
  s = { version: e.version + `` },
  c = {
    parser: o,
    db: { getVersion: n(() => s.version, `getVersion`) },
    renderer: {
      draw: n((e, n, a) => {
        t.debug(
          `rendering info diagram
` + e,
        );
        let o = i(n);
        (r(o, 100, 400, !0),
          o
            .append(`g`)
            .append(`text`)
            .attr(`x`, 100)
            .attr(`y`, 40)
            .attr(`class`, `version`)
            .attr(`font-size`, 32)
            .style(`text-anchor`, `middle`)
            .text(`v${a}`));
      }, `draw`),
    },
  };
export { c as diagram };
