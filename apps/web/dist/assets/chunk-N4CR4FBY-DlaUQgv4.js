const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/dagre-6UL2VRFP-B1IwPFos.js",
      "assets/chunk-JA3XYJ7Z-ByUEKWPH.js",
      "assets/src-BAB06iur.js",
      "assets/chunk-CFjPhJqf.js",
      "assets/chunk-S3R3BYOJ-qZRxmO84.js",
      "assets/dist-sj4ly5hH.js",
      "assets/math-DsrlwHr4.js",
      "assets/chunk-ABZYJK2D-BcBvUh_0.js",
      "assets/preload-helper-CM8YhcCa.js",
      "assets/identity-X8ntysRl.js",
      "assets/dagre-CF1oBap_.js",
      "assets/graphlib-BolwGYrB.js",
      "assets/isEmpty-D802w2WA.js",
      "assets/reduce-CDZcdOiT.js",
      "assets/flatten-CUhNQmdn.js",
      "assets/clone-Bf-ZG9ye.js",
      "assets/chunk-ATLVNIR6-BjpTnV3z.js",
      "assets/chunk-CVBHYZKI-pVtBnPKQ.js",
      "assets/chunk-HN2XXSSU-C17-XOpQ.js",
      "assets/chunk-JZLCHNYA-DexENr_S.js",
      "assets/chunk-QXUST7PY-B--XlkK4.js",
      "assets/line-xAZ3WWpC.js",
      "assets/path-D2AxaElO.js",
      "assets/array-BtZstxtO.js",
      "assets/cose-bilkent-S5V4N54A-h7Fvqrhy.js",
      "assets/cytoscape.esm-CVrJG8E_.js",
    ]),
) => i.map((i) => d[i]);
import { t as e } from "./preload-helper-CM8YhcCa.js";
import { g as t, h as n } from "./src-BAB06iur.js";
import { s as r, y as i } from "./chunk-ABZYJK2D-BcBvUh_0.js";
import { u as a } from "./chunk-S3R3BYOJ-qZRxmO84.js";
import { a as o, i as s, s as c } from "./chunk-JZLCHNYA-DexENr_S.js";
import { a as l, i as u, n as d, r as f } from "./chunk-QXUST7PY-B--XlkK4.js";
var p = {
    common: r,
    getConfig: i,
    insertCluster: s,
    insertEdge: d,
    insertEdgeLabel: f,
    insertMarkers: u,
    insertNode: o,
    interpolateToCurve: a,
    labelHelper: c,
    log: t,
    positionEdgeLabel: l,
  },
  m = {},
  h = n((e) => {
    for (let t of e) m[t.name] = t;
  }, `registerLayoutLoaders`);
n(() => {
  h([
    {
      name: `dagre`,
      loader: n(
        async () =>
          await e(
            () => import(`./dagre-6UL2VRFP-B1IwPFos.js`),
            __vite__mapDeps([
              0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18,
              19, 20, 21, 22, 23,
            ]),
          ),
        `loader`,
      ),
    },
    ...[
      {
        name: `cose-bilkent`,
        loader: n(
          async () =>
            await e(
              () => import(`./cose-bilkent-S5V4N54A-h7Fvqrhy.js`),
              __vite__mapDeps([24, 3, 25, 2]),
            ),
          `loader`,
        ),
      },
    ],
  ]);
}, `registerDefaultLayoutLoaders`)();
var g = n(async (e, t) => {
    if (!(e.layoutAlgorithm in m))
      throw Error(`Unknown layout algorithm: ${e.layoutAlgorithm}`);
    let n = m[e.layoutAlgorithm];
    return (await n.loader()).render(e, t, p, { algorithm: n.algorithm });
  }, `render`),
  _ = n((e = ``, { fallback: n = `dagre` } = {}) => {
    if (e in m) return e;
    if (n in m)
      return (
        t.warn(
          `Layout algorithm ${e} is not registered. Using ${n} as fallback.`,
        ),
        n
      );
    throw Error(`Both layout algorithms ${e} and ${n} are not registered.`);
  }, `getRegisteredLayoutAlgorithm`);
export { h as n, g as r, _ as t };
