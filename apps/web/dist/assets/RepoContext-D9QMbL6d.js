import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { n as i } from "./backend-BVlbQtYj.js";
import { t as a } from "./hooks-B_9i2gKL.js";
import { Kt as o } from "./src-DHCpG1Q-.js";
import { t as s } from "./repoUrl-qff7-TKX.js";
var c = r(),
  l = e(t(), 1),
  u = n(),
  d = (0, l.createContext)(void 0);
function f(e) {
  let t = (0, c.c)(19),
    { children: n, owner: r, repoParam: l } = e,
    f;
  t[0] === l ? (f = t[1]) : ((f = s(l)), (t[0] = l), (t[1] = f));
  let { name: p, appName: m } = f,
    h;
  t[2] !== m || t[3] !== p || t[4] !== r
    ? ((h = { owner: r, name: p, appName: m }),
      (t[2] = m),
      (t[3] = p),
      (t[4] = r),
      (t[5] = h))
    : (h = t[5]);
  let g = a(i.githubRepos.getByOwnerAndName, h),
    _ = m ? `/${r}/${p}--${m}` : `/${r}/${p}`,
    v;
  bb0: {
    if (!g) {
      v = void 0;
      break bb0;
    }
    let e;
    (t[6] !== _ || t[7] !== p || t[8] !== r || t[9] !== g
      ? ((e = {
          repo: g,
          repoId: g._id,
          basePath: _,
          owner: r,
          name: p,
          installationId: g.installationId,
          rootDirectory: g.rootDirectory,
        }),
        (t[6] = _),
        (t[7] = p),
        (t[8] = r),
        (t[9] = g),
        (t[10] = e))
      : (e = t[10]),
      (v = e));
  }
  let y = v;
  if (g === void 0) {
    let e;
    return (
      t[11] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, u.jsx)(`div`, {
            className: `flex items-center justify-center min-h-screen`,
            children: (0, u.jsx)(o, { size: `lg` }),
          })),
          (t[11] = e))
        : (e = t[11]),
      e
    );
  }
  if (g === null) {
    let e;
    t[12] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((e = (0, u.jsx)(`h1`, {
          className: `text-2xl font-bold text-foreground`,
          children: `Repository not found`,
        })),
        (t[12] = e))
      : (e = t[12]);
    let n;
    return (
      t[13] !== p || t[14] !== r
        ? ((n = (0, u.jsxs)(`div`, {
            className: `flex flex-col items-center justify-center min-h-screen gap-4`,
            children: [
              e,
              (0, u.jsxs)(`p`, {
                className: `text-muted-foreground`,
                children: [
                  `The repository "`,
                  r,
                  `/`,
                  p,
                  `" does not exist or you don't have access to it.`,
                ],
              }),
            ],
          })),
          (t[13] = p),
          (t[14] = r),
          (t[15] = n))
        : (n = t[15]),
      n
    );
  }
  let b;
  return (
    t[16] !== n || t[17] !== y
      ? ((b = (0, u.jsx)(d.Provider, { value: y, children: n })),
        (t[16] = n),
        (t[17] = y),
        (t[18] = b))
      : (b = t[18]),
    b
  );
}
function p() {
  let e = (0, l.useContext)(d);
  if (e === void 0) throw Error(`useRepo must be used within a RepoProvider`);
  return e;
}
export { p as n, f as t };
