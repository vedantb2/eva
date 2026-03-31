const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/info-NVLQJR56-00fvOGUv.js",
      "assets/chunk-FPAJGGOC-Ccs3hkso.js",
      "assets/chunk-CFjPhJqf.js",
      "assets/isEmpty-D802w2WA.js",
      "assets/identity-X8ntysRl.js",
      "assets/reduce-CDZcdOiT.js",
      "assets/flatten-CUhNQmdn.js",
      "assets/chunk-LBM3YZW2-Cz5SZwkS.js",
      "assets/packet-BFZMPI3H-Dptb5H-P.js",
      "assets/chunk-76Q3JFCE-DFvG-25F.js",
      "assets/pie-7BOR55EZ-DZeWrlnN.js",
      "assets/chunk-T53DSG4Q-B0tiI3G3.js",
      "assets/architecture-U656AL7Q-DQTBS8GM.js",
      "assets/chunk-O7ZBX7Z2-fRVTVZSd.js",
      "assets/gitGraph-F6HP7TQM-nTz1zR5B.js",
      "assets/chunk-S6J4BHB3-sncwf7hO.js",
      "assets/radar-NHE76QYJ-Bt-ZKbmk.js",
      "assets/chunk-LHMN2FUI-N-3Vo1Sy.js",
      "assets/treemap-KMMF4GRG-C83vivVX.js",
      "assets/chunk-FWNWRKHM-DWFLVeY6.js",
    ]),
) => i.map((i) => d[i]);
import { t as e } from "./preload-helper-CM8YhcCa.js";
import { f as t } from "./chunk-FPAJGGOC-Ccs3hkso.js";
import "./chunk-O7ZBX7Z2-fRVTVZSd.js";
import "./chunk-S6J4BHB3-sncwf7hO.js";
import "./chunk-LBM3YZW2-Cz5SZwkS.js";
import "./chunk-76Q3JFCE-DFvG-25F.js";
import "./chunk-T53DSG4Q-B0tiI3G3.js";
import "./chunk-LHMN2FUI-N-3Vo1Sy.js";
import "./chunk-FWNWRKHM-DWFLVeY6.js";
var n = {},
  r = {
    info: t(async () => {
      let { createInfoServices: t } = await e(
        async () => {
          let { createInfoServices: e } = await import(
            `./info-NVLQJR56-00fvOGUv.js`
          );
          return { createInfoServices: e };
        },
        __vite__mapDeps([0, 1, 2, 3, 4, 5, 6, 7]),
      );
      n.info = t().Info.parser.LangiumParser;
    }, `info`),
    packet: t(async () => {
      let { createPacketServices: t } = await e(
        async () => {
          let { createPacketServices: e } = await import(
            `./packet-BFZMPI3H-Dptb5H-P.js`
          );
          return { createPacketServices: e };
        },
        __vite__mapDeps([8, 1, 2, 3, 4, 5, 6, 9]),
      );
      n.packet = t().Packet.parser.LangiumParser;
    }, `packet`),
    pie: t(async () => {
      let { createPieServices: t } = await e(
        async () => {
          let { createPieServices: e } = await import(
            `./pie-7BOR55EZ-DZeWrlnN.js`
          );
          return { createPieServices: e };
        },
        __vite__mapDeps([10, 1, 2, 3, 4, 5, 6, 11]),
      );
      n.pie = t().Pie.parser.LangiumParser;
    }, `pie`),
    architecture: t(async () => {
      let { createArchitectureServices: t } = await e(
        async () => {
          let { createArchitectureServices: e } = await import(
            `./architecture-U656AL7Q-DQTBS8GM.js`
          );
          return { createArchitectureServices: e };
        },
        __vite__mapDeps([12, 1, 2, 3, 4, 5, 6, 13]),
      );
      n.architecture = t().Architecture.parser.LangiumParser;
    }, `architecture`),
    gitGraph: t(async () => {
      let { createGitGraphServices: t } = await e(
        async () => {
          let { createGitGraphServices: e } = await import(
            `./gitGraph-F6HP7TQM-nTz1zR5B.js`
          );
          return { createGitGraphServices: e };
        },
        __vite__mapDeps([14, 1, 2, 3, 4, 5, 6, 15]),
      );
      n.gitGraph = t().GitGraph.parser.LangiumParser;
    }, `gitGraph`),
    radar: t(async () => {
      let { createRadarServices: t } = await e(
        async () => {
          let { createRadarServices: e } = await import(
            `./radar-NHE76QYJ-Bt-ZKbmk.js`
          );
          return { createRadarServices: e };
        },
        __vite__mapDeps([16, 1, 2, 3, 4, 5, 6, 17]),
      );
      n.radar = t().Radar.parser.LangiumParser;
    }, `radar`),
    treemap: t(async () => {
      let { createTreemapServices: t } = await e(
        async () => {
          let { createTreemapServices: e } = await import(
            `./treemap-KMMF4GRG-C83vivVX.js`
          );
          return { createTreemapServices: e };
        },
        __vite__mapDeps([18, 1, 2, 3, 4, 5, 6, 19]),
      );
      n.treemap = t().Treemap.parser.LangiumParser;
    }, `treemap`),
  };
async function i(e, t) {
  let i = r[e];
  if (!i) throw Error(`Unknown diagram type: ${e}`);
  n[e] || (await i());
  let o = n[e].parse(t);
  if (o.lexerErrors.length > 0 || o.parserErrors.length > 0) throw new a(o);
  return o.value;
}
t(i, `parse`);
var a = class extends Error {
  constructor(e) {
    let t = e.lexerErrors.map((e) => e.message).join(`
`),
      n = e.parserErrors.map((e) => e.message).join(`
`);
    (super(`Parsing failed: ${t} ${n}`), (this.result = e));
  }
  static {
    t(this, `MermaidParseError`);
  }
};
export { i as t };
