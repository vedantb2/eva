import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-CuMF3NGg.js";
import { c as n, n as r } from "./backend-BVlbQtYj.js";
import { t as i } from "./hooks-B_9i2gKL.js";
import {
  Jn as a,
  Kt as o,
  Xn as s,
  Yn as c,
  ar as l,
  ir as u,
  ur as d,
  wr as f,
} from "./src-DHCpG1Q-.js";
import { t as p } from "./IconBookmark-BPZPIP3-.js";
import { t as m } from "./IconCode-DJtbkNrt.js";
import { t as h } from "./IconTrash-bHTcNORt.js";
import { n as g } from "./RepoContext-D9QMbL6d.js";
var _ = t(),
  v = e();
function y() {
  let e = (0, _.c)(20),
    { repo: t } = g(),
    y;
  e[0] === t._id
    ? (y = e[1])
    : ((y = { repoId: t._id }), (e[0] = t._id), (e[1] = y));
  let b = i(r.savedQueries.list, y),
    x = n(r.savedQueries.remove),
    S;
  e[2] === x
    ? (S = e[3])
    : ((S = async (e) => {
        await x({ id: e });
      }),
      (e[2] = x),
      (e[3] = S));
  let C = S;
  if (b === void 0) {
    let t;
    return (
      e[4] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, v.jsx)(`div`, {
            className: `flex items-center justify-center h-full`,
            children: (0, v.jsx)(o, { size: `lg` }),
          })),
          (e[4] = t))
        : (t = e[4]),
      t
    );
  }
  if (b.length === 0) {
    let t;
    return (
      e[5] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, v.jsx)(`div`, {
            className: `flex items-center justify-center h-full`,
            children: (0, v.jsxs)(`div`, {
              className: `text-center space-y-3`,
              children: [
                (0, v.jsx)(p, {
                  className: `w-12 h-12 mx-auto text-muted-foreground`,
                }),
                (0, v.jsx)(`p`, {
                  className: `text-sm text-muted-foreground`,
                  children: `No saved queries yet`,
                }),
                (0, v.jsx)(`p`, {
                  className: `text-xs text-muted-foreground`,
                  children: `Save queries from your research conversations to reuse them later`,
                }),
              ],
            }),
          })),
          (e[5] = t))
        : (t = e[5]),
      t
    );
  }
  let w;
  e[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((w = (0, v.jsx)(`h1`, {
        className: `text-lg font-semibold text-foreground`,
        children: `Saved Queries`,
      })),
      (e[6] = w))
    : (w = e[6]);
  let T = b.length === 1 ? `query` : `queries`,
    E;
  e[7] !== b.length || e[8] !== T
    ? ((E = (0, v.jsxs)(`div`, {
        className: `p-4`,
        children: [
          w,
          (0, v.jsxs)(`p`, {
            className: `text-xs text-muted-foreground mt-1`,
            children: [b.length, ` saved`, ` `, T],
          }),
        ],
      })),
      (e[7] = b.length),
      (e[8] = T),
      (e[9] = E))
    : (E = e[9]);
  let D;
  if (e[10] !== C || e[11] !== b) {
    let t;
    (e[13] === C
      ? (t = e[14])
      : ((t = (e) =>
          (0, v.jsx)(
            u,
            {
              children: (0, v.jsxs)(l, {
                className: `p-4 space-y-3`,
                children: [
                  (0, v.jsxs)(`div`, {
                    className: `flex items-start justify-between gap-3`,
                    children: [
                      (0, v.jsxs)(`div`, {
                        className: `space-y-1 min-w-0`,
                        children: [
                          (0, v.jsx)(`p`, {
                            className: `text-sm font-medium text-foreground truncate`,
                            children: e.title,
                          }),
                          (0, v.jsx)(`p`, {
                            className: `text-[10px] text-muted-foreground`,
                            children: new Date(e.createdAt).toLocaleDateString(
                              `en-GB`,
                              {
                                day: `numeric`,
                                month: `short`,
                                year: `numeric`,
                              },
                            ),
                          }),
                        ],
                      }),
                      (0, v.jsx)(d, {
                        size: `icon`,
                        variant: `ghost`,
                        className: `shrink-0 text-muted-foreground hover:text-destructive`,
                        onClick: () => C(e._id),
                        children: (0, v.jsx)(h, { size: 14 }),
                      }),
                    ],
                  }),
                  (0, v.jsxs)(a, {
                    children: [
                      (0, v.jsxs)(s, {
                        className: `flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group`,
                        children: [
                          (0, v.jsx)(m, { size: 14 }),
                          (0, v.jsx)(`span`, { children: `View query` }),
                          (0, v.jsx)(f, {
                            size: 12,
                            className: `transition-transform group-data-[state=open]:rotate-180`,
                          }),
                        ],
                      }),
                      (0, v.jsx)(c, {
                        children: (0, v.jsx)(`pre`, {
                          className: `mt-2 rounded-lg bg-secondary p-3 text-xs overflow-x-auto`,
                          children: (0, v.jsx)(`code`, { children: e.query }),
                        }),
                      }),
                    ],
                  }),
                ],
              }),
            },
            e._id,
          )),
        (e[13] = C),
        (e[14] = t)),
      (D = b.map(t)),
      (e[10] = C),
      (e[11] = b),
      (e[12] = D));
  } else D = e[12];
  let O;
  e[15] === D
    ? (O = e[16])
    : ((O = (0, v.jsx)(`div`, {
        className: `flex-1 overflow-y-auto p-4 space-y-3`,
        children: D,
      })),
      (e[15] = D),
      (e[16] = O));
  let k;
  return (
    e[17] !== E || e[18] !== O
      ? ((k = (0, v.jsxs)(`div`, {
          className: `flex flex-col h-full`,
          children: [E, O],
        })),
        (e[17] = E),
        (e[18] = O),
        (e[19] = k))
      : (k = e[19]),
    k
  );
}
export { y as component };
