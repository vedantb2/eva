import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { i as r, n as i, r as a, t as o } from "./chunk-5FQGJX7Z-Bf0FmJe5.js";
var s = e(t(), 1),
  c = n(),
  l = a(
    `block`,
    `before:content-[counter(line)]`,
    `before:inline-block`,
    `before:[counter-increment:line]`,
    `before:w-6`,
    `before:mr-4`,
    `before:text-[13px]`,
    `before:text-right`,
    `before:text-muted-foreground/50`,
    `before:font-mono`,
    `before:select-none`,
  ),
  u = (0, s.memo)(
    ({ children: e, result: t, language: n, className: r, ...i }) => {
      let o = (0, s.useMemo)(
        () => ({ backgroundColor: t.bg, color: t.fg }),
        [t.bg, t.fg],
      );
      return (0, c.jsx)(`pre`, {
        className: a(r, `p-4 text-sm dark:bg-(--shiki-dark-bg)!`),
        "data-language": n,
        "data-streamdown": `code-block-body`,
        style: o,
        ...i,
        children: (0, c.jsx)(`code`, {
          className: `[counter-increment:line_0] [counter-reset:line]`,
          children: t.tokens.map((e, t) =>
            (0, c.jsx)(
              `span`,
              {
                className: l,
                children: e.map((e, t) =>
                  (0, c.jsx)(
                    `span`,
                    {
                      className: `dark:bg-(--shiki-dark-bg)! dark:text-(--shiki-dark)!`,
                      style: {
                        color: e.color,
                        backgroundColor: e.bgColor,
                        ...e.htmlStyle,
                      },
                      ...e.htmlAttrs,
                      children: e.content,
                    },
                    t,
                  ),
                ),
              },
              t,
            ),
          ),
        }),
      });
    },
    (e, t) =>
      e.result === t.result &&
      e.language === t.language &&
      e.className === t.className,
  ),
  d = ({ className: e, language: t, style: n, ...r }) =>
    (0, c.jsx)(`div`, {
      className: a(
        `my-4 w-full overflow-hidden rounded-xl border border-border`,
        e,
      ),
      "data-language": t,
      "data-streamdown": `code-block`,
      style: {
        contentVisibility: `auto`,
        containIntrinsicSize: `auto 200px`,
        ...n,
      },
      ...r,
    }),
  f = ({ language: e, children: t }) =>
    (0, c.jsxs)(`div`, {
      className: `flex items-center justify-between bg-muted/80 p-3 text-muted-foreground text-xs`,
      "data-language": e,
      "data-streamdown": `code-block-header`,
      children: [
        (0, c.jsx)(`span`, {
          className: `ml-1 font-mono lowercase`,
          children: e,
        }),
        (0, c.jsx)(`div`, {
          className: `flex items-center gap-2`,
          children: t,
        }),
      ],
    }),
  p = ({ code: e, language: t, className: n, children: a, ...l }) => {
    let { shikiTheme: p } = (0, s.useContext)(o),
      m = r(),
      h = (0, s.useMemo)(
        () => ({
          bg: `transparent`,
          fg: `inherit`,
          tokens: e
            .split(
              `
`,
            )
            .map((e) => [
              {
                content: e,
                color: `inherit`,
                bgColor: `transparent`,
                htmlStyle: {},
                offset: 0,
              },
            ]),
        }),
        [e],
      ),
      [g, _] = (0, s.useState)(h);
    return (
      (0, s.useEffect)(() => {
        if (!m) {
          _(h);
          return;
        }
        let n = m.highlight({ code: e, language: t, themes: p }, (e) => {
          _(e);
        });
        if (n) {
          _(n);
          return;
        }
        _(h);
      }, [e, t, p, m, h]),
      (0, c.jsx)(i.Provider, {
        value: { code: e },
        children: (0, c.jsxs)(d, {
          language: t,
          children: [
            (0, c.jsx)(f, { language: t, children: a }),
            (0, c.jsx)(u, { className: n, language: t, result: g, ...l }),
          ],
        }),
      })
    );
  };
export { p as CodeBlock };
