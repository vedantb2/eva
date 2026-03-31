import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { c as r, n as i } from "./backend-BVlbQtYj.js";
import {
  Gn as a,
  Hn as o,
  Kn as s,
  Rn as c,
  Un as l,
  Vn as u,
  Wn as d,
  on as f,
  ur as p,
  zn as m,
} from "./src-DzioQSsH.js";
import { t as h } from "./IconPencil-D7oAN1Zq.js";
import { t as g } from "./PageWrapper-Z5X-C4Rx.js";
import { n as _ } from "./RepoContext-Dg6-rqFp.js";
var v = e(t(), 1),
  y = n();
function b() {
  let { repo: e, repoId: t } = _(),
    n = r(i.githubRepos.updateMcpRootPrompt),
    [b, x] = (0, v.useState)(!1),
    [S, C] = (0, v.useState)(``),
    [w, T] = (0, v.useState)(!1),
    E = e.mcpRootPrompt ?? ``,
    D = (0, v.useCallback)(() => {
      (C(E), x(!0));
    }, [E]),
    O = (0, v.useCallback)(async () => {
      T(!0);
      try {
        (await n({ repoId: t, mcpRootPrompt: S.trim() || void 0 }), x(!1));
      } finally {
        T(!1);
      }
    }, [n, t, S]);
  return (0, y.jsx)(g, {
    title: `MCP Config`,
    children: (0, y.jsx)(`div`, {
      className: `space-y-4`,
      children: (0, y.jsxs)(`div`, {
        className: `rounded-lg bg-muted/40 p-3 space-y-3 sm:p-4`,
        children: [
          (0, y.jsxs)(`div`, {
            className: `flex items-start justify-between gap-2`,
            children: [
              (0, y.jsxs)(`div`, {
                children: [
                  (0, y.jsx)(`h3`, {
                    className: `text-sm font-medium`,
                    children: `Root Prompt`,
                  }),
                  (0, y.jsx)(`p`, {
                    className: `mt-1 text-[11px] text-muted-foreground`,
                    children: `Freeform instructions injected into MCP server context to guide the AI on your data topology. Shared across all apps in a monorepo.`,
                  }),
                ],
              }),
              (0, y.jsxs)(c, {
                open: b,
                onOpenChange: x,
                children: [
                  (0, y.jsx)(s, {
                    asChild: !0,
                    children: (0, y.jsxs)(p, {
                      variant: `ghost`,
                      size: `sm`,
                      className: `h-7 shrink-0`,
                      onClick: D,
                      children: [(0, y.jsx)(h, { size: 14 }), `Edit`],
                    }),
                  }),
                  (0, y.jsxs)(u, {
                    className: `max-w-2xl`,
                    children: [
                      (0, y.jsxs)(d, {
                        children: [
                          (0, y.jsx)(a, { children: `Edit Root Prompt` }),
                          (0, y.jsx)(o, {
                            children: `Instructions injected into MCP server context. Shared across all apps in a monorepo.`,
                          }),
                        ],
                      }),
                      (0, y.jsx)(m, {
                        children: (0, y.jsx)(f, {
                          className: `min-h-[280px] text-xs font-mono`,
                          placeholder: `Describe your repo's data topology, table relationships, or any context the MCP server should know...`,
                          value: S,
                          onChange: (e) => C(e.target.value),
                        }),
                      }),
                      (0, y.jsxs)(l, {
                        children: [
                          (0, y.jsx)(p, {
                            variant: `ghost`,
                            size: `sm`,
                            onClick: () => x(!1),
                            children: `Cancel`,
                          }),
                          (0, y.jsx)(p, {
                            size: `sm`,
                            onClick: O,
                            disabled: S === E || w,
                            children: w ? `Saving...` : `Save`,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
          E
            ? (0, y.jsx)(`pre`, {
                className: `whitespace-pre-wrap text-xs font-mono text-foreground/80 leading-relaxed`,
                children: E,
              })
            : (0, y.jsx)(`p`, {
                className: `text-xs text-muted-foreground italic`,
                children: `No root prompt configured.`,
              }),
        ],
      }),
    }),
  });
}
var x = b;
export { x as component };
