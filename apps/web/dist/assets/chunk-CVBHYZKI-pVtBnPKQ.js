import { h as e } from "./src-BAB06iur.js";
var t = e(({ flowchart: e }) => {
  let t = e?.subGraphTitleMargin?.top ?? 0,
    n = e?.subGraphTitleMargin?.bottom ?? 0;
  return {
    subGraphTitleTopMargin: t,
    subGraphTitleBottomMargin: n,
    subGraphTitleTotalMargin: t + n,
  };
}, `getSubGraphTitleMargins`);
export { t };
