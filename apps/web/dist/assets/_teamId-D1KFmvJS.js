import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, u as i } from "./index-CuMF3NGg.js";
import { c as a, n as o, o as s } from "./backend-BVlbQtYj.js";
import { t as c } from "./hooks-B_9i2gKL.js";
import {
  $t as l,
  Gn as u,
  Gt as d,
  Ht as f,
  Jt as p,
  Kn as m,
  Qt as h,
  Rn as g,
  Un as _,
  Ut as v,
  Vn as y,
  Wn as b,
  Wt as x,
  Xt as S,
  ar as C,
  ir as w,
  qt as T,
  sn as E,
  ur as D,
} from "./src-DHCpG1Q-.js";
import { t as O } from "./IconGitBranch-otCxAQ3G.js";
import { t as k } from "./EnvVarsTable-Dmtrzay0.js";
import { t as A } from "./IconPlus-ZLqtR4Mv.js";
import { t as j } from "./IconTrash-bHTcNORt.js";
import { t as M } from "./IconUserPlus-sJRgozpx.js";
import { t as N } from "./src-DajKanKb.js";
import { S as P, v as F } from "./search-params-C2OhCtfp.js";
import { t as I } from "./PageWrapper-CdtdiTMb.js";
var L = r(),
  R = e(t(), 1),
  z = n();
function B(e) {
  let t = (0, L.c)(29),
    { teamId: n, members: r, isOwner: i } = e,
    s = a(o.teamMembers.add),
    c = a(o.teamMembers.remove),
    l;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = { open: !1, email: ``, error: ``, isSubmitting: !1 }), (t[0] = l))
    : (l = t[0]);
  let [d, f] = (0, R.useState)(l),
    p;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((p = (e) => {
        f(e ? U : { open: !1, email: ``, error: ``, isSubmitting: !1 });
      }),
      (t[1] = p))
    : (p = t[1]);
  let h = p,
    v;
  t[2] !== s || t[3] !== d.email || t[4] !== n
    ? ((v = async () => {
        if (!d.email.trim()) {
          f(H);
          return;
        }
        f(V);
        try {
          (await s({ teamId: n, userEmail: d.email }),
            f({ open: !1, email: ``, error: ``, isSubmitting: !1 }));
        } catch (e) {
          let t = e,
            n = t instanceof Error ? t.message : `Failed to add member`;
          f((e) => ({ ...e, error: n, isSubmitting: !1 }));
        }
      }),
      (t[2] = s),
      (t[3] = d.email),
      (t[4] = n),
      (t[5] = v))
    : (v = t[5]);
  let x = v,
    S;
  t[6] !== d.email ||
  t[7] !== d.error ||
  t[8] !== d.isSubmitting ||
  t[9] !== d.open ||
  t[10] !== x ||
  t[11] !== i
    ? ((S =
        i &&
        (0, z.jsxs)(g, {
          open: d.open,
          onOpenChange: h,
          children: [
            (0, z.jsx)(m, {
              asChild: !0,
              children: (0, z.jsxs)(D, {
                size: `sm`,
                children: [
                  (0, z.jsx)(M, { size: 16, className: `mr-1.5` }),
                  `Add Member`,
                ],
              }),
            }),
            (0, z.jsxs)(y, {
              children: [
                (0, z.jsx)(b, {
                  children: (0, z.jsx)(u, { children: `Add Team Member` }),
                }),
                (0, z.jsxs)(`div`, {
                  className: `space-y-4`,
                  children: [
                    (0, z.jsx)(`div`, {
                      children: (0, z.jsx)(E, {
                        type: `email`,
                        value: d.email,
                        onChange: (e) =>
                          f((t) => ({
                            ...t,
                            email: e.target.value,
                            error: ``,
                          })),
                        placeholder: `Email address`,
                        disabled: d.isSubmitting,
                        onKeyDown: (e) => e.key === `Enter` && x(),
                      }),
                    }),
                    d.error &&
                      (0, z.jsx)(`div`, {
                        className: `rounded-lg border border-destructive/50 bg-destructive/10 p-3`,
                        children: (0, z.jsx)(`p`, {
                          className: `text-sm text-destructive`,
                          children: d.error,
                        }),
                      }),
                  ],
                }),
                (0, z.jsxs)(_, {
                  children: [
                    (0, z.jsx)(D, {
                      variant: `outline`,
                      onClick: () => h(!1),
                      disabled: d.isSubmitting,
                      children: `Cancel`,
                    }),
                    (0, z.jsx)(D, {
                      onClick: x,
                      disabled: d.isSubmitting,
                      children: d.isSubmitting ? `Adding...` : `Add`,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })),
      (t[6] = d.email),
      (t[7] = d.error),
      (t[8] = d.isSubmitting),
      (t[9] = d.open),
      (t[10] = x),
      (t[11] = i),
      (t[12] = S))
    : (S = t[12]);
  let T;
  t[13] === S
    ? (T = t[14])
    : ((T = (0, z.jsx)(`div`, {
        className: `mb-4 flex justify-end`,
        children: S,
      })),
      (t[13] = S),
      (t[14] = T));
  let O;
  if (t[15] !== i || t[16] !== r || t[17] !== c || t[18] !== n) {
    let e;
    (t[20] !== i || t[21] !== c || t[22] !== n
      ? ((e = (e) =>
          (0, z.jsx)(
            w,
            {
              children: (0, z.jsxs)(C, {
                className: `flex items-center justify-between p-4`,
                children: [
                  (0, z.jsxs)(`div`, {
                    className: `flex items-center gap-3`,
                    children: [
                      (0, z.jsx)(N, {
                        userId: e.userId,
                        hideLastSeen: !0,
                        size: `md`,
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`p`, {
                            className: `text-sm font-medium`,
                            children:
                              e.user?.fullName || e.user?.email || `Unknown`,
                          }),
                          (0, z.jsx)(`p`, {
                            className: `text-xs text-muted-foreground`,
                            children: e.user?.email,
                          }),
                        ],
                      }),
                    ],
                  }),
                  (0, z.jsxs)(`div`, {
                    className: `flex items-center gap-2`,
                    children: [
                      (0, z.jsx)(`span`, {
                        className: `rounded-full bg-secondary px-2 py-1 text-xs`,
                        children: e.role,
                      }),
                      i &&
                        e.role !== `owner` &&
                        (0, z.jsx)(D, {
                          size: `icon`,
                          variant: `ghost`,
                          onClick: () => c({ teamId: n, userId: e.userId }),
                          children: (0, z.jsx)(j, { size: 14 }),
                        }),
                    ],
                  }),
                ],
              }),
            },
            e._id,
          )),
        (t[20] = i),
        (t[21] = c),
        (t[22] = n),
        (t[23] = e))
      : (e = t[23]),
      (O = r.map(e)),
      (t[15] = i),
      (t[16] = r),
      (t[17] = c),
      (t[18] = n),
      (t[19] = O));
  } else O = t[19];
  let k;
  t[24] === O
    ? (k = t[25])
    : ((k = (0, z.jsx)(`div`, { className: `space-y-2`, children: O })),
      (t[24] = O),
      (t[25] = k));
  let A;
  return (
    t[26] !== T || t[27] !== k
      ? ((A = (0, z.jsxs)(z.Fragment, { children: [T, k] })),
        (t[26] = T),
        (t[27] = k),
        (t[28] = A))
      : (A = t[28]),
    A
  );
}
function V(e) {
  return { ...e, error: ``, isSubmitting: !0 };
}
function H(e) {
  return { ...e, error: `Email is required` };
}
function U(e) {
  return { ...e, open: !0 };
}
function W(e) {
  let t = (0, L.c)(36),
    { teamId: n, repos: r, allRepos: i, isOwner: s } = e,
    c = a(o.githubRepos.assignToTeam),
    d = a(o.githubRepos.removeFromTeam),
    f;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = { open: !1, selectedRepoId: ``, error: ``, isSubmitting: !1 }),
      (t[0] = f))
    : (f = t[0]);
  let [v, x] = (0, R.useState)(f),
    S;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((S = (e) => {
        x(
          e ? Y : { open: !1, selectedRepoId: ``, error: ``, isSubmitting: !1 },
        );
      }),
      (t[1] = S))
    : (S = t[1]);
  let E = S,
    k;
  t[2] !== i || t[3] !== c || t[4] !== v.selectedRepoId || t[5] !== n
    ? ((k = async () => {
        if (!v.selectedRepoId) {
          x(J);
          return;
        }
        let e = i.find((e) => e._id === v.selectedRepoId);
        if (!e) {
          x(q);
          return;
        }
        x(K);
        try {
          (await c({ teamId: n, repoId: e._id }),
            x({ open: !1, selectedRepoId: ``, error: ``, isSubmitting: !1 }));
        } catch (e) {
          let t = e,
            n = t instanceof Error ? t.message : `Failed to add repository`;
          x((e) => ({ ...e, error: n, isSubmitting: !1 }));
        }
      }),
      (t[2] = i),
      (t[3] = c),
      (t[4] = v.selectedRepoId),
      (t[5] = n),
      (t[6] = k))
    : (k = t[6]);
  let M = k,
    N,
    P;
  if (
    t[7] !== i ||
    t[8] !== v.error ||
    t[9] !== v.isSubmitting ||
    t[10] !== v.open ||
    t[11] !== v.selectedRepoId ||
    t[12] !== M ||
    t[13] !== s ||
    t[14] !== n
  ) {
    let e;
    t[17] === n
      ? (e = t[18])
      : ((e = (e) => e.teamId !== n), (t[17] = n), (t[18] = e));
    let r = i.filter(e);
    ((N = `mb-4 flex justify-end`),
      (P =
        s &&
        (0, z.jsxs)(g, {
          open: v.open,
          onOpenChange: E,
          children: [
            (0, z.jsx)(m, {
              asChild: !0,
              children: (0, z.jsxs)(D, {
                size: `sm`,
                children: [
                  (0, z.jsx)(A, { size: 16, className: `mr-1.5` }),
                  `Add Repository`,
                ],
              }),
            }),
            (0, z.jsxs)(y, {
              children: [
                (0, z.jsx)(b, {
                  children: (0, z.jsx)(u, { children: `Add Repository` }),
                }),
                (0, z.jsxs)(`div`, {
                  className: `space-y-4`,
                  children: [
                    (0, z.jsx)(`div`, {
                      children: (0, z.jsxs)(T, {
                        value: v.selectedRepoId,
                        onValueChange: (e) =>
                          x((t) => ({ ...t, selectedRepoId: e, error: `` })),
                        disabled: v.isSubmitting,
                        children: [
                          (0, z.jsx)(h, {
                            children: (0, z.jsx)(l, {
                              placeholder: `Select a repository`,
                            }),
                          }),
                          (0, z.jsx)(p, { children: r.map(G) }),
                        ],
                      }),
                    }),
                    v.error &&
                      (0, z.jsx)(`div`, {
                        className: `rounded-lg border border-destructive/50 bg-destructive/10 p-3`,
                        children: (0, z.jsx)(`p`, {
                          className: `text-sm text-destructive`,
                          children: v.error,
                        }),
                      }),
                  ],
                }),
                (0, z.jsxs)(_, {
                  children: [
                    (0, z.jsx)(D, {
                      variant: `outline`,
                      onClick: () => E(!1),
                      disabled: v.isSubmitting,
                      children: `Cancel`,
                    }),
                    (0, z.jsx)(D, {
                      onClick: M,
                      disabled: v.isSubmitting,
                      children: v.isSubmitting ? `Adding...` : `Add`,
                    }),
                  ],
                }),
              ],
            }),
          ],
        })),
      (t[7] = i),
      (t[8] = v.error),
      (t[9] = v.isSubmitting),
      (t[10] = v.open),
      (t[11] = v.selectedRepoId),
      (t[12] = M),
      (t[13] = s),
      (t[14] = n),
      (t[15] = N),
      (t[16] = P));
  } else ((N = t[15]), (P = t[16]));
  let F;
  t[19] !== N || t[20] !== P
    ? ((F = (0, z.jsx)(`div`, { className: N, children: P })),
      (t[19] = N),
      (t[20] = P),
      (t[21] = F))
    : (F = t[21]);
  let I;
  if (t[22] !== s || t[23] !== d || t[24] !== r || t[25] !== n) {
    let e;
    (t[27] !== s || t[28] !== d || t[29] !== n
      ? ((e = (e) =>
          (0, z.jsx)(
            w,
            {
              children: (0, z.jsxs)(C, {
                className: `flex items-center justify-between p-3 sm:p-4`,
                children: [
                  (0, z.jsxs)(`div`, {
                    className: `flex items-center gap-2`,
                    children: [
                      (0, z.jsx)(O, {
                        size: 20,
                        className: `text-muted-foreground`,
                      }),
                      (0, z.jsxs)(`div`, {
                        children: [
                          (0, z.jsx)(`p`, {
                            className: `text-sm font-medium`,
                            children: e.rootDirectory
                              ? e.rootDirectory.split(`/`).pop()
                              : e.name,
                          }),
                          (0, z.jsxs)(`p`, {
                            className: `text-xs text-muted-foreground`,
                            children: [e.owner, `/`, e.name],
                          }),
                        ],
                      }),
                    ],
                  }),
                  s &&
                    (0, z.jsx)(D, {
                      size: `icon`,
                      variant: `ghost`,
                      onClick: () => d({ teamId: n, repoId: e._id }),
                      children: (0, z.jsx)(j, { size: 14 }),
                    }),
                ],
              }),
            },
            e._id,
          )),
        (t[27] = s),
        (t[28] = d),
        (t[29] = n),
        (t[30] = e))
      : (e = t[30]),
      (I = r.map(e)),
      (t[22] = s),
      (t[23] = d),
      (t[24] = r),
      (t[25] = n),
      (t[26] = I));
  } else I = t[26];
  let B;
  t[31] === I
    ? (B = t[32])
    : ((B = (0, z.jsx)(`div`, { className: `space-y-2`, children: I })),
      (t[31] = I),
      (t[32] = B));
  let V;
  return (
    t[33] !== F || t[34] !== B
      ? ((V = (0, z.jsxs)(z.Fragment, { children: [F, B] })),
        (t[33] = F),
        (t[34] = B),
        (t[35] = V))
      : (V = t[35]),
    V
  );
}
function G(e) {
  return (0, z.jsxs)(
    S,
    { value: e._id, children: [e.owner, `/`, e.name] },
    e._id,
  );
}
function K(e) {
  return { ...e, error: ``, isSubmitting: !0 };
}
function q(e) {
  return { ...e, error: `Repository not found` };
}
function J(e) {
  return { ...e, error: `Please select a repository` };
}
function Y(e) {
  return { ...e, open: !0 };
}
function X(e) {
  let t = (0, L.c)(18),
    { teamId: n, teamEnvVars: r } = e,
    i = s(o.teamEnvVarsActions.upsertVar),
    c = s(o.teamEnvVarsActions.revealValue),
    l = a(o.teamEnvVars.removeVar),
    u = a(o.teamEnvVars.toggleSandboxExclude),
    d;
  t[0] !== n || t[1] !== i
    ? ((d = async (e, t, r) => {
        await i({ teamId: n, key: e, value: t, sandboxExclude: r });
      }),
      (t[0] = n),
      (t[1] = i),
      (t[2] = d))
    : (d = t[2]);
  let f;
  t[3] !== c || t[4] !== n
    ? ((f = (e) => c({ teamId: n, key: e })),
      (t[3] = c),
      (t[4] = n),
      (t[5] = f))
    : (f = t[5]);
  let p;
  t[6] !== l || t[7] !== n
    ? ((p = async (e) => {
        await l({ teamId: n, key: e });
      }),
      (t[6] = l),
      (t[7] = n),
      (t[8] = p))
    : (p = t[8]);
  let m;
  t[9] !== n || t[10] !== u
    ? ((m = async (e, t) => {
        await u({ teamId: n, key: e, sandboxExclude: t });
      }),
      (t[9] = n),
      (t[10] = u),
      (t[11] = m))
    : (m = t[11]);
  let h;
  return (
    t[12] !== d || t[13] !== f || t[14] !== p || t[15] !== m || t[16] !== r
      ? ((h = (0, z.jsx)(k, {
          vars: r,
          onUpsert: d,
          onReveal: f,
          onRemove: p,
          onToggleSandboxExclude: m,
          description: `Team-level variables inherited by all codebases in this team.`,
        })),
        (t[12] = d),
        (t[13] = f),
        (t[14] = p),
        (t[15] = m),
        (t[16] = r),
        (t[17] = h))
      : (h = t[17]),
    h
  );
}
function Z(e) {
  let t = (0, L.c)(29),
    { teamId: n } = e,
    r = n,
    i;
  t[0] === r ? (i = t[1]) : ((i = { id: r }), (t[0] = r), (t[1] = i));
  let a = c(o.teams.get, i),
    s = c(o.teamMembers.list, a ? { teamId: a._id } : `skip`) ?? [],
    l = c(o.githubRepos.listByTeam, a ? { teamId: a._id } : `skip`) ?? [],
    u = c(o.githubRepos.list, { includeHidden: !0 }) ?? [],
    p;
  t[2] === a
    ? (p = t[3])
    : ((p = a ? { teamId: a._id } : `skip`), (t[2] = a), (t[3] = p));
  let m = c(o.teamEnvVars.list, p),
    [h, g] = P(`tab`, F);
  if (!a) {
    let e;
    return (
      t[4] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, z.jsx)(I, {
            title: `Team`,
            children: (0, z.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `Team not found`,
            }),
          })),
          (t[4] = e))
        : (e = t[4]),
      e
    );
  }
  let _ = a.userRole === `owner`,
    y = a.displayName ?? a.name,
    b;
  t[5] === g
    ? (b = t[6])
    : ((b = (e) => {
        (e === `members` || e === `repos` || e === `env`) && g(e);
      }),
      (t[5] = g),
      (t[6] = b));
  let S;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((S = (0, z.jsxs)(x, {
        className: `mb-4`,
        children: [
          (0, z.jsx)(d, { value: `members`, children: `Members` }),
          (0, z.jsx)(d, { value: `repos`, children: `Codebases` }),
          (0, z.jsx)(d, { value: `env`, children: `Environment Variables` }),
        ],
      })),
      (t[7] = S))
    : (S = t[7]);
  let C;
  t[8] !== _ || t[9] !== s || t[10] !== a._id
    ? ((C = (0, z.jsx)(v, {
        value: `members`,
        children: (0, z.jsx)(B, { teamId: a._id, members: s, isOwner: _ }),
      })),
      (t[8] = _),
      (t[9] = s),
      (t[10] = a._id),
      (t[11] = C))
    : (C = t[11]);
  let w;
  t[12] !== u || t[13] !== _ || t[14] !== l || t[15] !== a._id
    ? ((w = (0, z.jsx)(v, {
        value: `repos`,
        children: (0, z.jsx)(W, {
          teamId: a._id,
          repos: l,
          allRepos: u,
          isOwner: _,
        }),
      })),
      (t[12] = u),
      (t[13] = _),
      (t[14] = l),
      (t[15] = a._id),
      (t[16] = w))
    : (w = t[16]);
  let T;
  t[17] !== a._id || t[18] !== m
    ? ((T = (0, z.jsx)(v, {
        value: `env`,
        children: (0, z.jsx)(X, { teamId: a._id, teamEnvVars: m }),
      })),
      (t[17] = a._id),
      (t[18] = m),
      (t[19] = T))
    : (T = t[19]);
  let E;
  t[20] !== b || t[21] !== C || t[22] !== w || t[23] !== T || t[24] !== h
    ? ((E = (0, z.jsxs)(f, {
        value: h,
        onValueChange: b,
        children: [S, C, w, T],
      })),
      (t[20] = b),
      (t[21] = C),
      (t[22] = w),
      (t[23] = T),
      (t[24] = h),
      (t[25] = E))
    : (E = t[25]);
  let D;
  return (
    t[26] !== y || t[27] !== E
      ? ((D = (0, z.jsx)(I, { title: y, children: E })),
        (t[26] = y),
        (t[27] = E),
        (t[28] = D))
      : (D = t[28]),
    D
  );
}
function Q() {
  let e = (0, L.c)(2),
    { teamId: t } = i.useParams(),
    n;
  return (
    e[0] === t
      ? (n = e[1])
      : ((n = (0, z.jsx)(Z, { teamId: t })), (e[0] = t), (e[1] = n)),
    n
  );
}
export { Q as component };
