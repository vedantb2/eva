import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./useNavigate-B8SeWprX.js";
import { T as i, l as a } from "./index-CuMF3NGg.js";
import { c as o, n as s, o as c } from "./backend-BVlbQtYj.js";
import { Cr as l, Kt as u, Tr as d, ur as f, wr as p } from "./src-DHCpG1Q-.js";
import { t as m } from "./IconBrandGithub-DBmykLtu.js";
import { t as h } from "./IconFolder-B8BePKLB.js";
var g = e(t(), 1),
  _ = i(),
  v = n();
function y(e) {
  let t = (0, _.c)(2),
    { children: n } = e,
    r;
  return (
    t[0] === n
      ? (r = t[1])
      : ((r = (0, v.jsx)(`div`, {
          className: `flex-1 overflow-auto scrollbar`,
          children: (0, v.jsx)(`div`, {
            className: `mx-auto flex min-h-full w-full max-w-[1320px] flex-col gap-4 px-3 pb-8 pt-4 md:gap-6 md:px-5 md:pt-5 lg:px-6 lg:pt-6 animate-in fade-in slide-in-from-bottom-1 duration-300`,
            children: n,
          }),
        })),
        (t[0] = n),
        (t[1] = r)),
    r
  );
}
function b(e) {
  let t = (0, _.c)(28),
    {
      repo: n,
      isExpanded: r,
      isAdded: i,
      onToggleExpand: a,
      onAdd: o,
      children: s,
    } = e,
    c;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, v.jsx)(m, {
        className: `w-5 h-5 text-muted-foreground flex-shrink-0`,
      })),
      (t[0] = c))
    : (c = t[0]);
  let u;
  t[1] === n.name
    ? (u = t[2])
    : ((u = (0, v.jsx)(`p`, {
        className: `font-medium text-sm sm:text-base text-foreground truncate`,
        children: n.name,
      })),
      (t[1] = n.name),
      (t[2] = u));
  let h;
  t[3] === n.owner
    ? (h = t[4])
    : ((h = (0, v.jsx)(`p`, {
        className: `text-xs sm:text-sm text-muted-foreground truncate`,
        children: n.owner,
      })),
      (t[3] = n.owner),
      (t[4] = h));
  let g;
  t[5] !== u || t[6] !== h
    ? ((g = (0, v.jsxs)(`div`, {
        className: `flex items-center gap-2 sm:gap-3 min-w-0 flex-1`,
        children: [
          c,
          (0, v.jsxs)(`div`, { className: `min-w-0`, children: [u, h] }),
        ],
      })),
      (t[5] = u),
      (t[6] = h),
      (t[7] = g))
    : (g = t[7]);
  let y;
  t[8] !== i || t[9] !== o
    ? ((y = i
        ? (0, v.jsxs)(`span`, {
            className: `flex items-center gap-1 text-success text-xs sm:text-sm`,
            children: [
              (0, v.jsx)(d, { className: `w-4 h-4` }),
              (0, v.jsx)(`span`, {
                className: `hidden sm:inline`,
                children: `Added`,
              }),
            ],
          })
        : (0, v.jsx)(f, { size: `sm`, onClick: o, children: `Add` })),
      (t[8] = i),
      (t[9] = o),
      (t[10] = y))
    : (y = t[10]);
  let b;
  t[11] === r
    ? (b = t[12])
    : ((b = r
        ? (0, v.jsx)(p, { className: `w-4 h-4` })
        : (0, v.jsx)(l, { className: `w-4 h-4` })),
      (t[11] = r),
      (t[12] = b));
  let x;
  t[13] !== a || t[14] !== b
    ? ((x = (0, v.jsx)(f, {
        size: `sm`,
        variant: `ghost`,
        onClick: a,
        children: b,
      })),
      (t[13] = a),
      (t[14] = b),
      (t[15] = x))
    : (x = t[15]);
  let S;
  t[16] !== y || t[17] !== x
    ? ((S = (0, v.jsxs)(`div`, {
        className: `flex items-center gap-2 flex-shrink-0`,
        children: [y, x],
      })),
      (t[16] = y),
      (t[17] = x),
      (t[18] = S))
    : (S = t[18]);
  let C;
  t[19] !== g || t[20] !== S
    ? ((C = (0, v.jsxs)(`div`, {
        className: `flex items-center justify-between p-3 sm:p-4 bg-card`,
        children: [g, S],
      })),
      (t[19] = g),
      (t[20] = S),
      (t[21] = C))
    : (C = t[21]);
  let w;
  t[22] !== s || t[23] !== r
    ? ((w =
        r &&
        (0, v.jsx)(`div`, {
          className: `mt-6 bg-muted/30 p-3 sm:p-4 space-y-2`,
          children: s,
        })),
      (t[22] = s),
      (t[23] = r),
      (t[24] = w))
    : (w = t[24]);
  let T;
  return (
    t[25] !== w || t[26] !== C
      ? ((T = (0, v.jsxs)(`div`, {
          className: `rounded-xl bg-muted/40 overflow-hidden`,
          children: [C, w],
        })),
        (t[25] = w),
        (t[26] = C),
        (t[27] = T))
      : (T = t[27]),
    T
  );
}
function x(e) {
  let t = (0, _.c)(29),
    {
      apps: n,
      isDetecting: r,
      addedRepos: i,
      repoFullName: a,
      onAddApp: o,
    } = e,
    [s, c] = (0, g.useState)(``);
  if (r) {
    let e;
    return (
      t[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, v.jsxs)(`div`, {
            className: `flex items-center gap-2 py-2`,
            children: [
              (0, v.jsx)(u, { size: `sm` }),
              (0, v.jsx)(`span`, {
                className: `text-xs text-muted-foreground`,
                children: `Detecting workspace apps...`,
              }),
            ],
          })),
          (t[0] = e))
        : (e = t[0]),
      e
    );
  }
  if (n.length === 0) {
    let e;
    return (
      t[1] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, v.jsx)(`p`, {
            className: `text-xs text-muted-foreground py-1`,
            children: `No workspace apps detected. This repo can be added as a single project.`,
          })),
          (t[1] = e))
        : (e = t[1]),
      e
    );
  }
  let l;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (0, v.jsx)(`p`, {
        className: `text-xs font-medium text-muted-foreground mb-2`,
        children: `Monorepo apps detected:`,
      })),
      (t[2] = l))
    : (l = t[2]);
  let p;
  if (t[3] !== i || t[4] !== n || t[5] !== o || t[6] !== a) {
    let e;
    (t[8] !== i || t[9] !== o || t[10] !== a
      ? ((e = (e) => {
          let t = `${a}:${e.path}`;
          return (0, v.jsxs)(
            `div`,
            {
              className: `flex items-center justify-between p-2 rounded-lg bg-muted/40`,
              children: [
                (0, v.jsxs)(`div`, {
                  className: `flex items-center gap-2 min-w-0`,
                  children: [
                    (0, v.jsx)(h, {
                      className: `w-4 h-4 text-muted-foreground flex-shrink-0`,
                    }),
                    (0, v.jsxs)(`div`, {
                      className: `min-w-0`,
                      children: [
                        (0, v.jsx)(`p`, {
                          className: `text-sm font-medium text-foreground truncate`,
                          children: e.name,
                        }),
                        (0, v.jsxs)(`p`, {
                          className: `text-xs text-muted-foreground truncate`,
                          children: [
                            e.path,
                            e.hasDevScript && ` · has dev script`,
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                i.has(t)
                  ? (0, v.jsxs)(`span`, {
                      className: `flex items-center gap-1 text-success text-xs flex-shrink-0`,
                      children: [
                        (0, v.jsx)(d, { className: `w-3 h-3` }),
                        `Added`,
                      ],
                    })
                  : (0, v.jsx)(f, {
                      size: `sm`,
                      variant: `secondary`,
                      className: `flex-shrink-0`,
                      onClick: () => o(e.path),
                      children: `Add`,
                    }),
              ],
            },
            e.path,
          );
        }),
        (t[8] = i),
        (t[9] = o),
        (t[10] = a),
        (t[11] = e))
      : (e = t[11]),
      (p = n.map(e)),
      (t[3] = i),
      (t[4] = n),
      (t[5] = o),
      (t[6] = a),
      (t[7] = p));
  } else p = t[7];
  let m;
  t[12] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (e) => c(e.target.value)), (t[12] = m))
    : (m = t[12]);
  let y;
  t[13] === s
    ? (y = t[14])
    : ((y = (0, v.jsx)(`input`, {
        type: `text`,
        placeholder: `Custom root directory...`,
        value: s,
        onChange: m,
        className: `flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm`,
      })),
      (t[13] = s),
      (t[14] = y));
  let b;
  t[15] === s ? (b = t[16]) : ((b = s.trim()), (t[15] = s), (t[16] = b));
  let x = !b,
    S;
  t[17] !== s || t[18] !== o
    ? ((S = () => {
        (o(s.trim()), c(``));
      }),
      (t[17] = s),
      (t[18] = o),
      (t[19] = S))
    : (S = t[19]);
  let C;
  t[20] !== x || t[21] !== S
    ? ((C = (0, v.jsx)(f, {
        size: `sm`,
        variant: `secondary`,
        disabled: x,
        onClick: S,
        children: `Add`,
      })),
      (t[20] = x),
      (t[21] = S),
      (t[22] = C))
    : (C = t[22]);
  let w;
  t[23] !== y || t[24] !== C
    ? ((w = (0, v.jsxs)(`div`, {
        className: `flex items-center gap-2 pt-2`,
        children: [y, C],
      })),
      (t[23] = y),
      (t[24] = C),
      (t[25] = w))
    : (w = t[25]);
  let T;
  return (
    t[26] !== p || t[27] !== w
      ? ((T = (0, v.jsxs)(v.Fragment, { children: [l, p, w] })),
        (t[26] = p),
        (t[27] = w),
        (t[28] = T))
      : (T = t[28]),
    T
  );
}
function S({ installationId: e, autoSync: t }) {
  let n = r(),
    [i, a] = (0, g.useState)([]),
    [l, d] = (0, g.useState)(!0),
    [p, m] = (0, g.useState)(!1),
    [h, _] = (0, g.useState)(null),
    [S, C] = (0, g.useState)(new Set()),
    [w, T] = (0, g.useState)(null),
    [E, D] = (0, g.useState)({}),
    [O, k] = (0, g.useState)(null),
    A = (0, g.useRef)(!1),
    j = o(s.githubRepos.create),
    M = c(s.github.listRepos),
    N = c(s.github.detectMonorepoApps);
  ((0, g.useEffect)(() => {
    M({ installationId: Number(e) })
      .then((e) => {
        (a(e), d(!1));
      })
      .catch((e) => {
        (_(e instanceof Error ? e.message : `Failed to fetch repos`), d(!1));
      });
  }, [e, M]),
    (0, g.useEffect)(() => {
      !l && i.length > 0 && t && !A.current && ((A.current = !0), P());
    }, [l, i, t]));
  let P = async () => {
      if (!p) {
        m(!0);
        for (let t of i)
          if (!S.has(t.fullName))
            try {
              (await j({
                owner: t.owner,
                name: t.name,
                installationId: Number(e),
                githubId: t.id,
              }),
                C((e) => new Set([...e, t.fullName])));
            } catch {}
        (m(!1), n({ to: `/home` }));
      }
    },
    F = async (t) => {
      if (w === t.fullName) {
        T(null);
        return;
      }
      if ((T(t.fullName), !E[t.fullName])) {
        k(t.fullName);
        try {
          let n = await N({
            installationId: Number(e),
            owner: t.owner,
            name: t.name,
          });
          D((e) => ({ ...e, [t.fullName]: n }));
        } catch {
          D((e) => ({ ...e, [t.fullName]: [] }));
        }
        k(null);
      }
    },
    I = async (t, n) => {
      let r = n ? `${t.fullName}:${n}` : t.fullName;
      if (!S.has(r))
        try {
          (await j({
            owner: t.owner,
            name: t.name,
            installationId: Number(e),
            githubId: t.id,
            rootDirectory: n,
          }),
            C((e) => new Set([...e, r])));
        } catch {}
    };
  return l || p
    ? (0, v.jsx)(y, {
        children: (0, v.jsxs)(`div`, {
          className: `flex flex-col items-center justify-center py-20`,
          children: [
            (0, v.jsx)(u, { size: `lg`, className: `mb-4` }),
            (0, v.jsx)(`p`, {
              className: `text-muted-foreground`,
              children: p ? `Adding codebases...` : `Loading codebases...`,
            }),
          ],
        }),
      })
    : h
      ? (0, v.jsx)(y, {
          children: (0, v.jsxs)(`div`, {
            className: `flex flex-col items-center justify-center py-20`,
            children: [
              (0, v.jsx)(`p`, {
                className: `text-destructive mb-4`,
                children: h,
              }),
              (0, v.jsx)(f, {
                variant: `secondary`,
                onClick: () => n({ to: `/home` }),
                children: `Back to Codebases`,
              }),
            ],
          }),
        })
      : (0, v.jsx)(y, {
          children: (0, v.jsxs)(`div`, {
            className: `max-w-2xl mx-auto py-4 sm:py-8`,
            children: [
              (0, v.jsx)(`h1`, {
                className: `text-xl sm:text-2xl font-bold text-foreground mb-2`,
                children: `GitHub App Installed`,
              }),
              (0, v.jsx)(`p`, {
                className: `text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6`,
                children: `Select which codebases you want to add to Eva.`,
              }),
              (0, v.jsx)(`div`, {
                className: `space-y-2 sm:space-y-3 mb-4 sm:mb-6`,
                children: i.map((e) =>
                  (0, v.jsx)(
                    b,
                    {
                      repo: e,
                      isExpanded: w === e.fullName,
                      isAdded: S.has(e.fullName),
                      onToggleExpand: () => F(e),
                      onAdd: () => I(e),
                      children: (0, v.jsx)(x, {
                        apps: E[e.fullName] ?? [],
                        isDetecting: O === e.fullName,
                        addedRepos: S,
                        repoFullName: e.fullName,
                        onAddApp: (t) => I(e, t),
                      }),
                    },
                    e.id,
                  ),
                ),
              }),
              (0, v.jsxs)(`div`, {
                className: `flex flex-col sm:flex-row gap-2 sm:gap-3`,
                children: [
                  (0, v.jsx)(f, {
                    className: `flex-1`,
                    onClick: P,
                    disabled: i.length === S.size,
                    children: `Add All & Continue`,
                  }),
                  (0, v.jsx)(f, {
                    variant: `secondary`,
                    onClick: () => n({ to: `/home` }),
                    children: `Done`,
                  }),
                ],
              }),
            ],
          }),
        });
}
function C() {
  let e = (0, _.c)(3),
    { id: t } = a.useParams(),
    { auto: n } = a.useSearch(),
    r = n !== `false`,
    i;
  return (
    e[0] !== t || e[1] !== r
      ? ((i = (0, v.jsx)(S, { installationId: t, autoSync: r })),
        (e[0] = t),
        (e[1] = r),
        (e[2] = i))
      : (i = e[2]),
    i
  );
}
export { C as component };
