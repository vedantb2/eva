import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { c as r, n as i, o as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
import {
  Kt as s,
  Tr as c,
  ar as l,
  dr as u,
  ir as d,
  sn as f,
  ur as p,
  yr as m,
} from "./src-DzioQSsH.js";
import { t as h } from "./IconAlertCircle-DCb3MjbW.js";
import { t as g } from "./IconEyeOff-BRNChqHT.js";
import { t as _ } from "./IconEye-B7_3GMo_.js";
import { t as v } from "./IconFolders-Cug1raja.js";
import { t as y } from "./IconPlus-ZLqtR4Mv.js";
import { t as b } from "./IconRefresh-BfbGd9fI.js";
import { t as x } from "./PageWrapper-Z5X-C4Rx.js";
import { n as S } from "./RepoContext-Dg6-rqFp.js";
var C = e(t(), 1),
  w = n();
function T() {
  let { repo: e } = S(),
    t = a(i.github.detectMonorepoApps),
    n = r(i.githubRepos.create),
    T = r(i.githubRepos.toggleHidden),
    E = o(i.githubRepos.list, { includeHidden: !0 }),
    [D, O] = (0, C.useState)([]),
    [k, A] = (0, C.useState)(!0),
    [j, M] = (0, C.useState)(null),
    [N, P] = (0, C.useState)(null),
    [F, I] = (0, C.useState)(``),
    L = (E ?? []).filter(
      (t) => t.owner === e.owner && t.name === e.name && t.rootDirectory,
    ),
    R = new Set(L.map((e) => e.rootDirectory)),
    z = async () => {
      (A(!0), M(null));
      try {
        O(
          (
            await t({
              installationId: e.installationId,
              owner: e.owner,
              name: e.name,
            })
          ).filter((e) => e.path.startsWith(`apps/`)),
        );
      } catch (e) {
        M(e instanceof Error ? e.message : `Detection failed`);
      }
      A(!1);
    };
  (0, C.useEffect)(() => {
    z();
  }, [e.owner, e.name, e.installationId]);
  let B = async (t) => {
      P(t);
      try {
        await n({
          owner: e.owner,
          name: e.name,
          installationId: e.installationId,
          githubId: e.githubId,
          rootDirectory: t,
          teamId: e.teamId,
        });
      } catch (e) {
        console.error(`Failed to add app:`, e);
      }
      P(null);
    },
    V = async () => {
      let e = F.trim().replace(/^\/+|\/+$/g, ``);
      e && (await B(e), I(``));
    };
  return (0, w.jsxs)(x, {
    title: `Monorepo Apps`,
    headerRight: (0, w.jsxs)(p, {
      size: `sm`,
      variant: `outline`,
      disabled: k,
      onClick: () => void z(),
      className: `motion-press border-border text-muted-foreground`,
      children: [
        (0, w.jsx)(b, { size: 16, className: k ? `animate-spin` : `` }),
        (0, w.jsx)(`span`, {
          className: `hidden sm:inline`,
          children: `Re-detect`,
        }),
      ],
    }),
    children: [
      L.length > 0 &&
        (0, w.jsxs)(`div`, {
          className: `space-y-2`,
          children: [
            (0, w.jsx)(`h3`, {
              className: `text-sm font-medium text-foreground`,
              children: `Connected Apps`,
            }),
            (0, w.jsx)(`p`, {
              className: `text-xs text-muted-foreground`,
              children: `Toggle visibility to hide apps from the sidebar and home page without removing them.`,
            }),
            (0, w.jsx)(`div`, {
              className: `space-y-2`,
              children: L.map((e) =>
                (0, w.jsx)(
                  d,
                  {
                    className: `ui-surface-strong`,
                    children: (0, w.jsxs)(l, {
                      className: `flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3`,
                      children: [
                        (0, w.jsx)(v, {
                          size: 18,
                          className: `text-muted-foreground`,
                        }),
                        (0, w.jsxs)(`div`, {
                          className: `min-w-0 flex-1`,
                          children: [
                            (0, w.jsx)(`p`, {
                              className: `truncate text-sm font-medium text-foreground`,
                              children: e.rootDirectory?.split(`/`).pop(),
                            }),
                            (0, w.jsx)(`p`, {
                              className: `text-xs text-muted-foreground`,
                              children: e.rootDirectory,
                            }),
                          ],
                        }),
                        (0, w.jsx)(p, {
                          size: `sm`,
                          variant: e.hidden ? `outline` : `ghost`,
                          onClick: () =>
                            T({ repoId: e._id, hidden: e.hidden !== !0 }),
                          className: e.hidden
                            ? `motion-press gap-1.5 border-border text-muted-foreground`
                            : `motion-press gap-1.5 text-muted-foreground hover:text-foreground`,
                          children: e.hidden
                            ? (0, w.jsxs)(w.Fragment, {
                                children: [
                                  (0, w.jsx)(g, { size: 14 }),
                                  `Hidden`,
                                ],
                              })
                            : (0, w.jsxs)(w.Fragment, {
                                children: [
                                  (0, w.jsx)(_, { size: 14 }),
                                  `Visible`,
                                ],
                              }),
                        }),
                      ],
                    }),
                  },
                  e._id,
                ),
              ),
            }),
          ],
        }),
      (0, w.jsxs)(`div`, {
        className: `space-y-3`,
        children: [
          (0, w.jsx)(`h3`, {
            className: `text-sm font-medium text-foreground`,
            children: `Detect Apps`,
          }),
          (0, w.jsxs)(`p`, {
            className: `text-xs text-muted-foreground`,
            children: [
              `Scan`,
              ` `,
              (0, w.jsxs)(`span`, {
                className: `font-medium text-foreground`,
                children: [e.owner, `/`, e.name],
              }),
              ` `,
              `for workspace apps and add them as separate codebases.`,
            ],
          }),
        ],
      }),
      k
        ? (0, w.jsx)(`div`, {
            className: `flex items-center justify-center py-12`,
            children: (0, w.jsxs)(`div`, {
              className: `flex flex-col items-center gap-3`,
              children: [
                (0, w.jsx)(s, { size: `md` }),
                (0, w.jsx)(`p`, {
                  className: `text-sm text-muted-foreground`,
                  children: `Scanning workspace configuration...`,
                }),
              ],
            }),
          })
        : j
          ? (0, w.jsx)(d, {
              className: `border-destructive/30`,
              children: (0, w.jsxs)(l, {
                className: `flex items-center gap-3 p-4`,
                children: [
                  (0, w.jsx)(h, { size: 20, className: `text-destructive` }),
                  (0, w.jsxs)(`div`, {
                    children: [
                      (0, w.jsx)(`p`, {
                        className: `text-sm font-medium text-foreground`,
                        children: `Detection failed`,
                      }),
                      (0, w.jsx)(`p`, {
                        className: `text-xs text-muted-foreground`,
                        children: j,
                      }),
                    ],
                  }),
                ],
              }),
            })
          : D.length === 0
            ? (0, w.jsx)(d, {
                children: (0, w.jsxs)(l, {
                  className: `flex flex-col items-center gap-2 p-8 text-center`,
                  children: [
                    (0, w.jsx)(v, {
                      size: 28,
                      className: `text-muted-foreground/50`,
                    }),
                    (0, w.jsx)(`p`, {
                      className: `text-sm font-medium text-foreground`,
                      children: `No workspace apps detected`,
                    }),
                    (0, w.jsx)(`p`, {
                      className: `text-xs text-muted-foreground`,
                      children: `This repository doesn't appear to have a monorepo workspace configuration (package.json workspaces or pnpm-workspace.yaml).`,
                    }),
                  ],
                }),
              })
            : (0, w.jsx)(`div`, {
                className: `space-y-2`,
                children: D.map((e) => {
                  let t = R.has(e.path),
                    n = N === e.path;
                  return (0, w.jsx)(
                    d,
                    {
                      className: `ui-surface-strong`,
                      children: (0, w.jsxs)(l, {
                        className: `flex items-center gap-2 p-2.5 sm:gap-3 sm:p-3`,
                        children: [
                          (0, w.jsx)(v, {
                            size: 18,
                            className: `text-muted-foreground`,
                          }),
                          (0, w.jsxs)(`div`, {
                            className: `min-w-0 flex-1`,
                            children: [
                              (0, w.jsxs)(`div`, {
                                className: `flex items-center gap-2`,
                                children: [
                                  (0, w.jsx)(`p`, {
                                    className: `truncate text-sm font-medium text-foreground`,
                                    children: e.name,
                                  }),
                                  e.hasDevScript &&
                                    (0, w.jsxs)(u, {
                                      variant: `secondary`,
                                      className: `gap-1 text-[10px]`,
                                      children: [
                                        (0, w.jsx)(m, { size: 10 }),
                                        `dev`,
                                      ],
                                    }),
                                ],
                              }),
                              (0, w.jsx)(`p`, {
                                className: `text-xs text-muted-foreground`,
                                children: e.path,
                              }),
                            ],
                          }),
                          t
                            ? (0, w.jsxs)(u, {
                                variant: `outline`,
                                className: `gap-1 border-primary/30 text-primary`,
                                children: [
                                  (0, w.jsx)(c, { size: 12 }),
                                  `Added`,
                                ],
                              })
                            : (0, w.jsxs)(p, {
                                size: `sm`,
                                variant: `outline`,
                                disabled: n,
                                onClick: () => void B(e.path),
                                className: `motion-press`,
                                children: [
                                  n
                                    ? (0, w.jsx)(s, { size: `sm` })
                                    : (0, w.jsx)(y, { size: 14 }),
                                  `Add`,
                                ],
                              }),
                        ],
                      }),
                    },
                    e.path,
                  );
                }),
              }),
      (0, w.jsx)(d, {
        className: `mt-2`,
        children: (0, w.jsxs)(l, {
          className: `p-3`,
          children: [
            (0, w.jsx)(`p`, {
              className: `mb-2 text-xs font-medium text-muted-foreground`,
              children: `Custom root directory`,
            }),
            (0, w.jsxs)(`form`, {
              onSubmit: (e) => {
                (e.preventDefault(), V());
              },
              className: `flex items-center gap-2`,
              children: [
                (0, w.jsx)(f, {
                  placeholder: `e.g. apps/api`,
                  value: F,
                  onChange: (e) => I(e.target.value),
                  className: `flex-1`,
                }),
                (0, w.jsxs)(p, {
                  type: `submit`,
                  size: `sm`,
                  disabled:
                    !F.trim() || N === F.trim().replace(/^\/+|\/+$/g, ``),
                  className: `motion-press`,
                  children: [(0, w.jsx)(y, { size: 14 }), `Add`],
                }),
              ],
            }),
          ],
        }),
      }),
    ],
  });
}
var E = T;
export { E as component };
