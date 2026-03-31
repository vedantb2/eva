import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { t } from "./link-HPAZ_wn3.js";
import { T as n } from "./index-DSqEo2z3.js";
import { c as r, n as i, o as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
import { Gt as s, Ht as c, Wt as l, ar as u, ir as d } from "./src-DzioQSsH.js";
import { t as f } from "./EnvVarsTable-CPa2Jyix.js";
import { t as p } from "./IconUsers-C0ORl3PB.js";
import { S as m, r as h } from "./search-params-2NJX6Or7.js";
import { t as g } from "./PageWrapper-Z5X-C4Rx.js";
import { n as _ } from "./RepoContext-Dg6-rqFp.js";
var v = n(),
  y = e();
function b() {
  let e = (0, v.c)(20),
    { repoId: t } = _(),
    n;
  e[0] === t ? (n = e[1]) : ((n = { repoId: t }), (e[0] = t), (e[1] = n));
  let s = o(i.repoEnvVars.list, n),
    c = a(i.repoEnvVarsActions.upsertVar),
    l = a(i.repoEnvVarsActions.revealValue),
    u = r(i.repoEnvVars.removeVar),
    d = r(i.repoEnvVars.toggleSandboxExclude),
    p;
  e[2] !== t || e[3] !== c
    ? ((p = async (e, n, r) => {
        await c({ repoId: t, key: e, value: n, sandboxExclude: r });
      }),
      (e[2] = t),
      (e[3] = c),
      (e[4] = p))
    : (p = e[4]);
  let m;
  e[5] !== t || e[6] !== l
    ? ((m = (e) => l({ repoId: t, key: e })),
      (e[5] = t),
      (e[6] = l),
      (e[7] = m))
    : (m = e[7]);
  let h;
  e[8] !== u || e[9] !== t
    ? ((h = async (e) => {
        await u({ repoId: t, key: e });
      }),
      (e[8] = u),
      (e[9] = t),
      (e[10] = h))
    : (h = e[10]);
  let g;
  e[11] !== t || e[12] !== d
    ? ((g = async (e, n) => {
        await d({ repoId: t, key: e, sandboxExclude: n });
      }),
      (e[11] = t),
      (e[12] = d),
      (e[13] = g))
    : (g = e[13]);
  let b;
  return (
    e[14] !== p || e[15] !== m || e[16] !== h || e[17] !== g || e[18] !== s
      ? ((b = (0, y.jsx)(f, {
          vars: s,
          onUpsert: p,
          onReveal: m,
          onRemove: h,
          onToggleSandboxExclude: g,
          description: `Repo-specific variables injected into sandboxes for this repository.`,
        })),
        (e[14] = p),
        (e[15] = m),
        (e[16] = h),
        (e[17] = g),
        (e[18] = s),
        (e[19] = b))
      : (b = e[19]),
    b
  );
}
function x() {
  let e = (0, v.c)(35),
    { repo: n } = _(),
    s;
  e[0] === n.teamId
    ? (s = e[1])
    : ((s = n.teamId ? { id: n.teamId } : `skip`),
      (e[0] = n.teamId),
      (e[1] = s));
  let c = o(i.teams.get, s),
    l;
  e[2] === n.teamId
    ? (l = e[3])
    : ((l = n.teamId ? { teamId: n.teamId } : `skip`),
      (e[2] = n.teamId),
      (e[3] = l));
  let m = o(i.teamEnvVars.list, l),
    h = a(i.teamEnvVarsActions.upsertVar),
    g = a(i.teamEnvVarsActions.revealValue),
    b = r(i.teamEnvVars.removeVar),
    x = r(i.teamEnvVars.toggleSandboxExclude);
  if (!n.teamId || !c) {
    let t;
    return (
      e[4] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, y.jsx)(d, {
            children: (0, y.jsxs)(u, {
              className: `flex flex-col items-center justify-center py-12`,
              children: [
                (0, y.jsx)(p, {
                  size: 48,
                  className: `mb-4 text-muted-foreground/50`,
                }),
                (0, y.jsx)(`p`, {
                  className: `mb-2 text-sm font-medium`,
                  children: `No team configured`,
                }),
                (0, y.jsx)(`p`, {
                  className: `text-xs text-muted-foreground`,
                  children: `This repository is not part of any team yet`,
                }),
              ],
            }),
          })),
          (e[4] = t))
        : (t = e[4]),
      t
    );
  }
  let S;
  e[5] !== n.teamId || e[6] !== h
    ? ((S = async (e, t, r) => {
        n.teamId &&
          (await h({ teamId: n.teamId, key: e, value: t, sandboxExclude: r }));
      }),
      (e[5] = n.teamId),
      (e[6] = h),
      (e[7] = S))
    : (S = e[7]);
  let C;
  e[8] !== n.teamId || e[9] !== g
    ? ((C = async (e) =>
        n.teamId ? await g({ teamId: n.teamId, key: e }) : null),
      (e[8] = n.teamId),
      (e[9] = g),
      (e[10] = C))
    : (C = e[10]);
  let w;
  e[11] !== b || e[12] !== n.teamId
    ? ((w = async (e) => {
        n.teamId && (await b({ teamId: n.teamId, key: e }));
      }),
      (e[11] = b),
      (e[12] = n.teamId),
      (e[13] = w))
    : (w = e[13]);
  let T;
  e[14] !== n.teamId || e[15] !== x
    ? ((T = async (e, t) => {
        n.teamId && (await x({ teamId: n.teamId, key: e, sandboxExclude: t }));
      }),
      (e[14] = n.teamId),
      (e[15] = x),
      (e[16] = T))
    : (T = e[16]);
  let E;
  e[17] !== S || e[18] !== C || e[19] !== w || e[20] !== T || e[21] !== m
    ? ((E = (0, y.jsx)(f, {
        vars: m,
        description: `Team-level variables inherited by all codebases in this team.`,
        onUpsert: S,
        onReveal: C,
        onRemove: w,
        onToggleSandboxExclude: T,
      })),
      (e[17] = S),
      (e[18] = C),
      (e[19] = w),
      (e[20] = T),
      (e[21] = m),
      (e[22] = E))
    : (E = e[22]);
  let D;
  e[23] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((D = (0, y.jsx)(p, { size: 16, className: `text-muted-foreground` })),
      (e[23] = D))
    : (D = e[23]);
  let O = c.displayName ?? c.name,
    k;
  e[24] === O
    ? (k = e[25])
    : ((k = (0, y.jsxs)(`p`, {
        className: `text-sm`,
        children: [
          `Team:`,
          ` `,
          (0, y.jsx)(`span`, { className: `font-medium`, children: O }),
        ],
      })),
      (e[24] = O),
      (e[25] = k));
  let A;
  e[26] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((A = (0, y.jsx)(`span`, {
        className: `text-muted-foreground`,
        children: `•`,
      })),
      (e[26] = A))
    : (A = e[26]);
  let j;
  e[27] === c._id
    ? (j = e[28])
    : ((j = (0, y.jsx)(t, {
        to: `/teams/$teamId`,
        params: { teamId: c._id },
        target: `_blank`,
        className: `text-sm text-primary hover:underline`,
        children: `Manage team variables →`,
      })),
      (e[27] = c._id),
      (e[28] = j));
  let M;
  e[29] !== j || e[30] !== k
    ? ((M = (0, y.jsxs)(`div`, {
        className: `flex items-center gap-2`,
        children: [D, k, A, j],
      })),
      (e[29] = j),
      (e[30] = k),
      (e[31] = M))
    : (M = e[31]);
  let N;
  return (
    e[32] !== M || e[33] !== E
      ? ((N = (0, y.jsxs)(`div`, { className: `space-y-4`, children: [E, M] })),
        (e[32] = M),
        (e[33] = E),
        (e[34] = N))
      : (N = e[34]),
    N
  );
}
function S() {
  let e = (0, v.c)(14),
    [t, n] = m(`tab`, h),
    r;
  e[0] === n
    ? (r = e[1])
    : ((r = (e) => {
        (e === `repo` || e === `team`) && n(e);
      }),
      (e[0] = n),
      (e[1] = r));
  let i;
  e[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, y.jsxs)(l, {
        className: `mb-4`,
        children: [
          (0, y.jsx)(s, { value: `repo`, children: `Repo` }),
          (0, y.jsx)(s, { value: `team`, children: `Team` }),
        ],
      })),
      (e[2] = i))
    : (i = e[2]);
  let a;
  e[3] !== r || e[4] !== t
    ? ((a = (0, y.jsx)(c, { value: t, onValueChange: r, children: i })),
      (e[3] = r),
      (e[4] = t),
      (e[5] = a))
    : (a = e[5]);
  let o;
  e[6] === t
    ? (o = e[7])
    : ((o = t === `repo` && (0, y.jsx)(b, {})), (e[6] = t), (e[7] = o));
  let u;
  e[8] === t
    ? (u = e[9])
    : ((u = t === `team` && (0, y.jsx)(x, {})), (e[8] = t), (e[9] = u));
  let d;
  return (
    e[10] !== a || e[11] !== o || e[12] !== u
      ? ((d = (0, y.jsxs)(g, {
          title: `Environment Variables`,
          children: [a, o, u],
        })),
        (e[10] = a),
        (e[11] = o),
        (e[12] = u),
        (e[13] = d))
      : (d = e[13]),
    d
  );
}
var C = S;
export { C as component };
