import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { c as i, n as a, o } from "./backend-BVlbQtYj.js";
import { t as s } from "./hooks-B_9i2gKL.js";
import { Kt as c, Zn as l, ur as u } from "./src-DHCpG1Q-.js";
import { t as d } from "./IconRefresh-BfbGd9fI.js";
import { t as f } from "./PageWrapper-CdtdiTMb.js";
var p = r(),
  m = e(t()),
  h = n();
function g(e, t) {
  let n = new Set(),
    r = [],
    i = t ? [...e, ...t] : e;
  for (let e of i) {
    let t = `${e.owner}/${e.name}`;
    n.has(t) || (n.add(t), r.push({ owner: e.owner, name: e.name }));
  }
  return r;
}
function _() {
  let e = (0, p.c)(24),
    t = s(a.syncSettings.list),
    n;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((n = { includeHidden: !0 }), (e[0] = n))
    : (n = e[0]);
  let r = s(a.githubRepos.list, n),
    l = i(a.syncSettings.set),
    _ = i(a.syncSettings.bulkSet),
    S = o(a.github.listAllAvailableRepos),
    [C, w] = (0, m.useState)(!1),
    [T, E] = (0, m.useState)(void 0),
    D;
  e[1] === S
    ? (D = e[2])
    : ((D = async () => {
        w(!0);
        try {
          E(await S());
        } catch (e) {
          console.error(`Failed to fetch repos:`, e);
        }
        w(!1);
      }),
      (e[1] = S),
      (e[2] = D));
  let O = D,
    k;
  if (
    e[3] !== _ ||
    e[4] !== r ||
    e[5] !== C ||
    e[6] !== T ||
    e[7] !== O ||
    e[8] !== l ||
    e[9] !== t
  ) {
    let n = r ? g(r, T) : [],
      i;
    e[11] === t
      ? (i = e[12])
      : ((i = new Set((t ?? []).filter(b).map(y))), (e[11] = t), (e[12] = i));
    let a = i,
      o;
    e[13] === a
      ? (o = e[14])
      : ((o = (e, t) => !a.has(`${e}/${t}`)), (e[13] = a), (e[14] = o));
    let s = o,
      p;
    e[15] === l
      ? (p = e[16])
      : ((p = (e, t, n) => {
          l({ owner: e, name: t, enabled: n });
        }),
        (e[15] = l),
        (e[16] = p));
    let m = p,
      S = n.reduce(v, {}),
      w = Object.keys(S).sort(),
      E = (e) => S[e].every((e) => s(e.owner, e.name)),
      D = (e) => S[e].some((e) => s(e.owner, e.name)),
      A = (e) => {
        let t = !E(e);
        _({ owner: e, repos: S[e].map((e) => ({ name: e.name, enabled: t })) });
      },
      j = C ? `animate-spin` : ``,
      M;
    e[17] === j
      ? (M = e[18])
      : ((M = (0, h.jsx)(d, { size: 16, className: j })),
        (e[17] = j),
        (e[18] = M));
    let N;
    e[19] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((N = (0, h.jsx)(`span`, {
          className: `hidden sm:inline`,
          children: `Refresh from GitHub`,
        })),
        (e[19] = N))
      : (N = e[19]);
    let P;
    (e[20] !== C || e[21] !== O || e[22] !== M
      ? ((P = (0, h.jsxs)(u, {
          size: `sm`,
          variant: `outline`,
          disabled: C,
          onClick: O,
          className: `motion-press border-border text-muted-foreground hover:scale-[1.01] active:scale-[0.99]`,
          children: [M, N],
        })),
        (e[20] = C),
        (e[21] = O),
        (e[22] = M),
        (e[23] = P))
      : (P = e[23]),
      (k = (0, h.jsx)(f, {
        title: `Sync Settings`,
        showBack: !0,
        headerRight: P,
        children:
          t === void 0 || r === void 0
            ? (0, h.jsx)(`div`, {
                className: `flex items-center justify-center py-20`,
                children: (0, h.jsx)(c, { size: `md` }),
              })
            : n.length === 0
              ? (0, h.jsxs)(`div`, {
                  className: `flex flex-col items-center justify-center gap-3 py-20 text-muted-foreground`,
                  children: [
                    (0, h.jsx)(`p`, {
                      className: `text-sm`,
                      children: `No repos found. Sync your repos first, or fetch from GitHub to discover new ones.`,
                    }),
                    (0, h.jsxs)(u, {
                      size: `sm`,
                      variant: `outline`,
                      disabled: C,
                      onClick: O,
                      children: [
                        (0, h.jsx)(d, {
                          size: 16,
                          className: C ? `animate-spin` : ``,
                        }),
                        `Fetch from GitHub`,
                      ],
                    }),
                  ],
                })
              : (0, h.jsxs)(`div`, {
                  className: `space-y-6`,
                  children: [
                    (0, h.jsx)(`p`, {
                      className: `text-xs text-muted-foreground`,
                      children: `Disabled repos will be skipped during sync. New repos default to enabled.`,
                    }),
                    w.map((e) =>
                      (0, h.jsx)(
                        x,
                        {
                          owner: e,
                          repos: S[e],
                          allEnabled: E(e),
                          someEnabled: D(e),
                          isRepoEnabled: s,
                          onToggleOwner: () => A(e),
                          onToggleRepo: m,
                        },
                        e,
                      ),
                    ),
                  ],
                }),
      })),
      (e[3] = _),
      (e[4] = r),
      (e[5] = C),
      (e[6] = T),
      (e[7] = O),
      (e[8] = l),
      (e[9] = t),
      (e[10] = k));
  } else k = e[10];
  return k;
}
function v(e, t) {
  return (e[t.owner] || (e[t.owner] = []), e[t.owner].push(t), e);
}
function y(e) {
  return `${e.owner}/${e.name}`;
}
function b(e) {
  return !e.enabled;
}
function x(e) {
  let t = (0, p.c)(38),
    {
      owner: n,
      repos: r,
      allEnabled: i,
      someEnabled: a,
      isRepoEnabled: o,
      onToggleOwner: s,
      onToggleRepo: c,
    } = e,
    u,
    d,
    f,
    m;
  if (
    t[0] !== i ||
    t[1] !== o ||
    t[2] !== s ||
    t[3] !== c ||
    t[4] !== n ||
    t[5] !== r ||
    t[6] !== a
  ) {
    let e = [...r].sort(S);
    f = `rounded-lg bg-muted/40 p-3 sm:p-4`;
    let p = i ? !0 : a ? `indeterminate` : !1,
      g;
    t[11] !== s || t[12] !== p
      ? ((g = (0, h.jsx)(l, { checked: p, onCheckedChange: s })),
        (t[11] = s),
        (t[12] = p),
        (t[13] = g))
      : (g = t[13]);
    let _;
    t[14] === n
      ? (_ = t[15])
      : ((_ = (0, h.jsx)(`span`, {
          className: `text-sm font-medium`,
          children: n,
        })),
        (t[14] = n),
        (t[15] = _));
    let v;
    if (t[16] !== o || t[17] !== r) {
      let e;
      (t[19] === o
        ? (e = t[20])
        : ((e = (e) => o(e.owner, e.name)), (t[19] = o), (t[20] = e)),
        (v = r.filter(e)),
        (t[16] = o),
        (t[17] = r),
        (t[18] = v));
    } else v = t[18];
    let y;
    (t[21] !== r.length || t[22] !== v.length
      ? ((y = (0, h.jsxs)(`span`, {
          className: `text-xs text-muted-foreground`,
          children: [v.length, `/`, r.length],
        })),
        (t[21] = r.length),
        (t[22] = v.length),
        (t[23] = y))
      : (y = t[23]),
      t[24] !== g || t[25] !== _ || t[26] !== y
        ? ((m = (0, h.jsxs)(`label`, {
            className: `flex cursor-pointer items-center gap-2.5 pb-3`,
            children: [g, _, y],
          })),
          (t[24] = g),
          (t[25] = _),
          (t[26] = y),
          (t[27] = m))
        : (m = t[27]),
      (u = `space-y-1 pl-1`));
    let b;
    (t[28] !== o || t[29] !== c
      ? ((b = (e) =>
          (0, h.jsxs)(
            `label`,
            {
              className: `flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/60`,
              children: [
                (0, h.jsx)(l, {
                  checked: o(e.owner, e.name),
                  onCheckedChange: (t) => c(e.owner, e.name, t === !0),
                }),
                (0, h.jsx)(`span`, { className: `text-xs`, children: e.name }),
              ],
            },
            e.name,
          )),
        (t[28] = o),
        (t[29] = c),
        (t[30] = b))
      : (b = t[30]),
      (d = e.map(b)),
      (t[0] = i),
      (t[1] = o),
      (t[2] = s),
      (t[3] = c),
      (t[4] = n),
      (t[5] = r),
      (t[6] = a),
      (t[7] = u),
      (t[8] = d),
      (t[9] = f),
      (t[10] = m));
  } else ((u = t[7]), (d = t[8]), (f = t[9]), (m = t[10]));
  let g;
  t[31] !== u || t[32] !== d
    ? ((g = (0, h.jsx)(`div`, { className: u, children: d })),
      (t[31] = u),
      (t[32] = d),
      (t[33] = g))
    : (g = t[33]);
  let _;
  return (
    t[34] !== f || t[35] !== m || t[36] !== g
      ? ((_ = (0, h.jsxs)(`div`, { className: f, children: [m, g] })),
        (t[34] = f),
        (t[35] = m),
        (t[36] = g),
        (t[37] = _))
      : (_ = t[37]),
    _
  );
}
function S(e, t) {
  return e.name.localeCompare(t.name);
}
export { _ as component };
