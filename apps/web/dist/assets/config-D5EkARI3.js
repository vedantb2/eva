import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { c as i, n as a, t as o } from "./backend-BVlbQtYj.js";
import {
  $t as s,
  Jt as c,
  Qt as l,
  Xt as u,
  Zn as d,
  qt as f,
  sn as p,
  ur as m,
  vr as h,
} from "./src-DHCpG1Q-.js";
import { t as g } from "./IconPlus-ZLqtR4Mv.js";
import { t as _ } from "./PageWrapper-CdtdiTMb.js";
import { n as v } from "./RepoContext-D9QMbL6d.js";
import { t as y } from "./BranchSelect-B_az_4Wj.js";
var b = r(),
  x = e(t(), 1),
  S = n();
function C() {
  let e = (0, b.c)(45),
    { repo: t, repoId: n } = v(),
    r = i(a.githubRepos.updateConfig),
    u;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((u = (0, S.jsx)(`h3`, {
        className: `text-sm font-medium`,
        children: `Repository Configuration`,
      })),
      (e[0] = u))
    : (u = e[0]);
  let m;
  e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (0, S.jsx)(`label`, {
        className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
        children: `Default Base Branch`,
      })),
      (e[1] = m))
    : (m = e[1]);
  let h = t.defaultBaseBranch ?? `main`,
    g;
  e[2] !== n || e[3] !== r
    ? ((g = (e) => r({ repoId: n, defaultBaseBranch: e || void 0 })),
      (e[2] = n),
      (e[3] = r),
      (e[4] = g))
    : (g = e[4]);
  let x;
  e[5] !== h || e[6] !== g
    ? ((x = (0, S.jsx)(y, {
        value: h,
        onValueChange: g,
        className: `h-8 text-xs`,
        placeholder: `Select a branch`,
      })),
      (e[5] = h),
      (e[6] = g),
      (e[7] = x))
    : (x = e[7]);
  let C;
  e[8] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((C = (0, S.jsxs)(`p`, {
        className: `mt-1 text-[11px] text-muted-foreground`,
        children: [
          `The default branch used when creating quick tasks. Defaults to`,
          ` `,
          (0, S.jsx)(`code`, { children: `main` }),
          ` if not set.`,
        ],
      })),
      (e[8] = C))
    : (C = e[8]);
  let T;
  e[9] === x
    ? (T = e[10])
    : ((T = (0, S.jsxs)(`div`, { children: [m, x, C] })),
      (e[9] = x),
      (e[10] = T));
  let D;
  e[11] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((D = (0, S.jsx)(`label`, {
        className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
        children: `Default Model`,
      })),
      (e[11] = D))
    : (D = e[11]);
  let O = t.defaultModel ?? `sonnet`,
    k;
  e[12] !== n || e[13] !== r
    ? ((k = (e) => {
        let t = o.find((t) => t === e);
        t && r({ repoId: n, defaultModel: t });
      }),
      (e[12] = n),
      (e[13] = r),
      (e[14] = k))
    : (k = e[14]);
  let A;
  e[15] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((A = (0, S.jsx)(l, {
        className: `h-8 text-xs`,
        children: (0, S.jsx)(s, {}),
      })),
      (e[15] = A))
    : (A = e[15]);
  let j;
  e[16] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((j = (0, S.jsx)(c, { children: o.map(w) })), (e[16] = j))
    : (j = e[16]);
  let M;
  e[17] !== O || e[18] !== k
    ? ((M = (0, S.jsxs)(f, { value: O, onValueChange: k, children: [A, j] })),
      (e[17] = O),
      (e[18] = k),
      (e[19] = M))
    : (M = e[19]);
  let N;
  e[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((N = (0, S.jsxs)(`p`, {
        className: `mt-1 text-[11px] text-muted-foreground`,
        children: [
          `The default model used when creating new tasks. Defaults to`,
          ` `,
          (0, S.jsx)(`code`, { children: `Sonnet` }),
          ` if not set.`,
        ],
      })),
      (e[20] = N))
    : (N = e[20]);
  let P;
  e[21] === M
    ? (P = e[22])
    : ((P = (0, S.jsxs)(`div`, { children: [D, M, N] })),
      (e[21] = M),
      (e[22] = P));
  let F = t.screenshotsVideosEnabled ?? !0,
    I;
  e[23] !== n || e[24] !== r
    ? ((I = (e) => r({ repoId: n, screenshotsVideosEnabled: e === !0 })),
      (e[23] = n),
      (e[24] = r),
      (e[25] = I))
    : (I = e[25]);
  let L;
  e[26] !== F || e[27] !== I
    ? ((L = (0, S.jsx)(d, {
        checked: F,
        onCheckedChange: I,
        className: `mt-0.5`,
      })),
      (e[26] = F),
      (e[27] = I),
      (e[28] = L))
    : (L = e[28]);
  let R;
  e[29] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((R = (0, S.jsxs)(`div`, {
        className: `min-w-0`,
        children: [
          (0, S.jsx)(`p`, {
            className: `text-xs font-medium`,
            children: `Screenshots and Videos`,
          }),
          (0, S.jsx)(`p`, {
            className: `mt-0.5 text-[11px] text-muted-foreground`,
            children: `Use agent browser to record walkthroughs, verify its work, etc.`,
          }),
        ],
      })),
      (e[29] = R))
    : (R = e[29]);
  let z;
  e[30] === L
    ? (z = e[31])
    : ((z = (0, S.jsx)(`div`, {
        className: `rounded-md bg-muted/40 p-3`,
        children: (0, S.jsxs)(`div`, {
          className: `flex items-start gap-3`,
          children: [L, R],
        }),
      })),
      (e[30] = L),
      (e[31] = z));
  let B;
  e[32] !== t.deploymentProjectName ||
  e[33] !== t.parentRepoId ||
  e[34] !== n ||
  e[35] !== r
    ? ((B =
        t.parentRepoId &&
        (0, S.jsxs)(`div`, {
          children: [
            (0, S.jsx)(`label`, {
              className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
              children: `Deployment Project Name`,
            }),
            (0, S.jsx)(p, {
              className: `h-8 text-xs`,
              placeholder: `e.g. my-vercel-project`,
              defaultValue: t.deploymentProjectName ?? ``,
              onBlur: (e) => {
                let i = e.target.value.trim();
                i !== (t.deploymentProjectName ?? ``) &&
                  r({ repoId: n, deploymentProjectName: i || void 0 });
              },
            }),
            (0, S.jsx)(`p`, {
              className: `mt-1 text-[11px] text-muted-foreground`,
              children: `Vercel or Netlify project name for this app. Used to match the correct preview deployment in monorepos.`,
            }),
          ],
        })),
      (e[32] = t.deploymentProjectName),
      (e[33] = t.parentRepoId),
      (e[34] = n),
      (e[35] = r),
      (e[36] = B))
    : (B = e[36]);
  let V;
  e[37] !== P || e[38] !== z || e[39] !== B || e[40] !== T
    ? ((V = (0, S.jsxs)(`div`, {
        className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
        children: [
          u,
          (0, S.jsxs)(`div`, {
            className: `grid gap-4`,
            children: [T, P, z, B],
          }),
        ],
      })),
      (e[37] = P),
      (e[38] = z),
      (e[39] = B),
      (e[40] = T),
      (e[41] = V))
    : (V = e[41]);
  let H;
  e[42] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((H = (0, S.jsx)(E, {})), (e[42] = H))
    : (H = e[42]);
  let U;
  return (
    e[43] === V
      ? (U = e[44])
      : ((U = (0, S.jsx)(_, {
          title: `Config`,
          children: (0, S.jsxs)(`div`, {
            className: `space-y-4`,
            children: [V, H],
          }),
        })),
        (e[43] = V),
        (e[44] = U)),
    U
  );
}
function w(e) {
  return (0, S.jsx)(
    u,
    { value: e, children: e.charAt(0).toUpperCase() + e.slice(1) },
    e,
  );
}
function T(e) {
  try {
    return new URL(e.includes(`://`) ? e : `https://${e}`).hostname;
  } catch {
    return e;
  }
}
function E() {
  let e = (0, b.c)(33),
    { repo: t, repoId: n } = v(),
    r = i(a.githubRepos.updateConfig),
    [o, s] = (0, x.useState)(``),
    c;
  e[0] === t.domains
    ? (c = e[1])
    : ((c = t.domains ?? []), (e[0] = t.domains), (e[1] = c));
  let l = c,
    u;
  e[2] !== l || e[3] !== o || e[4] !== n || e[5] !== r
    ? ((u = () => {
        let e = o.trim().toLowerCase();
        if (!e) return;
        let t = T(e);
        l.includes(t) || (r({ repoId: n, domains: [...l, t] }), s(``));
      }),
      (e[2] = l),
      (e[3] = o),
      (e[4] = n),
      (e[5] = r),
      (e[6] = u))
    : (u = e[6]);
  let d = u,
    f;
  e[7] !== l || e[8] !== n || e[9] !== r
    ? ((f = (e) => {
        r({ repoId: n, domains: l.filter((t) => t !== e) });
      }),
      (e[7] = l),
      (e[8] = n),
      (e[9] = r),
      (e[10] = f))
    : (f = e[10]);
  let _ = f,
    y;
  e[11] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((y = (0, S.jsxs)(`div`, {
        children: [
          (0, S.jsx)(`h3`, {
            className: `text-sm font-medium`,
            children: `Domains`,
          }),
          (0, S.jsx)(`p`, {
            className: `mt-1 text-[11px] text-muted-foreground`,
            children: `Hostnames where this app is deployed. The Chrome extension will auto-select this repo when browsing these domains.`,
          }),
        ],
      })),
      (e[11] = y))
    : (y = e[11]);
  let C;
  e[12] !== l || e[13] !== _
    ? ((C =
        l.length > 0 &&
        (0, S.jsx)(`div`, {
          className: `flex flex-wrap gap-2`,
          children: l.map((e) =>
            (0, S.jsxs)(
              `span`,
              {
                className: `inline-flex items-center gap-1 rounded-md bg-muted/50 px-2 py-1 text-xs`,
                children: [
                  e,
                  (0, S.jsx)(`button`, {
                    type: `button`,
                    onClick: () => _(e),
                    className: `ml-0.5 rounded hover:bg-muted-foreground/20 p-0.5`,
                    children: (0, S.jsx)(h, { size: 12 }),
                  }),
                ],
              },
              e,
            ),
          ),
        })),
      (e[12] = l),
      (e[13] = _),
      (e[14] = C))
    : (C = e[14]);
  let w;
  e[15] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((w = (e) => s(e.target.value)), (e[15] = w))
    : (w = e[15]);
  let E;
  e[16] === d
    ? (E = e[17])
    : ((E = (e) => {
        e.key === `Enter` && d();
      }),
      (e[16] = d),
      (e[17] = E));
  let D;
  e[18] !== o || e[19] !== E
    ? ((D = (0, S.jsx)(p, {
        className: `h-8 text-xs flex-1`,
        placeholder: `e.g. myapp.com or localhost:3000`,
        value: o,
        onChange: w,
        onKeyDown: E,
      })),
      (e[18] = o),
      (e[19] = E),
      (e[20] = D))
    : (D = e[20]);
  let O;
  e[21] === o ? (O = e[22]) : ((O = o.trim()), (e[21] = o), (e[22] = O));
  let k = !O,
    A;
  e[23] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((A = (0, S.jsx)(g, { size: 14 })), (e[23] = A))
    : (A = e[23]);
  let j;
  e[24] !== d || e[25] !== k
    ? ((j = (0, S.jsxs)(m, {
        variant: `outline`,
        size: `sm`,
        className: `h-8`,
        onClick: d,
        disabled: k,
        children: [A, `Add`],
      })),
      (e[24] = d),
      (e[25] = k),
      (e[26] = j))
    : (j = e[26]);
  let M;
  e[27] !== j || e[28] !== D
    ? ((M = (0, S.jsxs)(`div`, { className: `flex gap-2`, children: [D, j] })),
      (e[27] = j),
      (e[28] = D),
      (e[29] = M))
    : (M = e[29]);
  let N;
  return (
    e[30] !== M || e[31] !== C
      ? ((N = (0, S.jsxs)(`div`, {
          className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
          children: [y, C, M],
        })),
        (e[30] = M),
        (e[31] = C),
        (e[32] = N))
      : (N = e[32]),
    N
  );
}
var D = C;
export { D as component };
