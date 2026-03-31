import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { Gn as i, Rn as a, Vn as o, Wn as s } from "./src-DHCpG1Q-.js";
import { t as c } from "./createReactComponent-C2GWxX5y.js";
import { t as l } from "./IconExternalLink-DInhr4-B.js";
var u = c(`outline`, `brand-vercel`, `BrandVercel`, [
    [`path`, { d: `M3 19h18l-9 -15l-9 15`, key: `svg-0` }],
  ]),
  d = r(),
  f = e(t(), 1),
  p = n(),
  m = [1, 3, 5, 8];
function h(e) {
  let t = (0, d.c)(20),
    { url: n } = e,
    r = (0, f.useRef)(null),
    [i, a] = (0, f.useState)(3),
    o,
    s,
    c,
    l;
  if (t[0] !== i || t[1] !== n) {
    let e = (e) => {
      (a(e),
        r.current &&
          ((r.current.playbackRate = e), (r.current.defaultPlaybackRate = e)));
    };
    c = `space-y-1.5`;
    let u, d;
    (t[6] === i
      ? ((u = t[7]), (d = t[8]))
      : ((u = () => {
          r.current &&
            ((r.current.playbackRate = i), (r.current.defaultPlaybackRate = i));
        }),
        (d = () => {
          r.current &&
            r.current.playbackRate !== i &&
            (r.current.playbackRate = i);
        }),
        (t[6] = i),
        (t[7] = u),
        (t[8] = d)),
      t[9] !== u || t[10] !== d || t[11] !== n
        ? ((l = (0, p.jsx)(`video`, {
            ref: r,
            src: n,
            controls: !0,
            playsInline: !0,
            preload: `metadata`,
            className: `rounded-lg border max-w-full`,
            onLoadedMetadata: u,
            onPlay: d,
          })),
          (t[9] = u),
          (t[10] = d),
          (t[11] = n),
          (t[12] = l))
        : (l = t[12]),
      (o = `flex items-center gap-1`),
      (s = m.map((t) =>
        (0, p.jsxs)(
          `button`,
          {
            type: `button`,
            onClick: () => e(t),
            className: `px-2 py-0.5 text-xs rounded-md transition-colors ${i === t ? `bg-primary text-primary-foreground` : `bg-muted text-muted-foreground hover:bg-muted/80`}`,
            children: [t, `x`],
          },
          t,
        ),
      )),
      (t[0] = i),
      (t[1] = n),
      (t[2] = o),
      (t[3] = s),
      (t[4] = c),
      (t[5] = l));
  } else ((o = t[2]), (s = t[3]), (c = t[4]), (l = t[5]));
  let u;
  t[13] !== o || t[14] !== s
    ? ((u = (0, p.jsx)(`div`, { className: o, children: s })),
      (t[13] = o),
      (t[14] = s),
      (t[15] = u))
    : (u = t[15]);
  let h;
  return (
    t[16] !== c || t[17] !== l || t[18] !== u
      ? ((h = (0, p.jsxs)(`div`, { className: c, children: [l, u] })),
        (t[16] = c),
        (t[17] = l),
        (t[18] = u),
        (t[19] = h))
      : (h = t[19]),
    h
  );
}
function g(e) {
  let t = (0, d.c)(13),
    { url: n } = e,
    [r, c] = (0, f.useState)(!1),
    u;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((u = () => c(!0)), (t[0] = u))
    : (u = t[0]);
  let m;
  t[1] === n
    ? (m = t[2])
    : ((m = (0, p.jsx)(`button`, {
        type: `button`,
        onClick: u,
        className: `block`,
        children: (0, p.jsx)(`img`, {
          src: n,
          alt: `Screenshot`,
          className: `rounded-lg max-w-full border cursor-pointer hover:opacity-90 transition-opacity`,
        }),
      })),
      (t[1] = n),
      (t[2] = m));
  let h;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((h = (0, p.jsx)(i, {
        className: `sr-only`,
        children: `Screenshot Preview`,
      })),
      (t[3] = h))
    : (h = t[3]);
  let g;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = (0, p.jsx)(l, { size: 14 })), (t[4] = g))
    : (g = t[4]);
  let _;
  t[5] === n
    ? (_ = t[6])
    : ((_ = (0, p.jsxs)(o, {
        className: `max-w-[90vw] max-h-[90vh] p-0 overflow-hidden`,
        children: [
          h,
          (0, p.jsx)(s, {
            className: `absolute top-2 right-10 z-10`,
            children: (0, p.jsxs)(`a`, {
              href: n,
              target: `_blank`,
              rel: `noopener noreferrer`,
              className: `inline-flex items-center gap-1 rounded-md bg-background/80 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors`,
              children: [g, `Open in new tab`],
            }),
          }),
          (0, p.jsx)(`img`, {
            src: n,
            alt: `Screenshot`,
            className: `w-full h-full object-contain`,
          }),
        ],
      })),
      (t[5] = n),
      (t[6] = _));
  let v;
  t[7] !== r || t[8] !== _
    ? ((v = (0, p.jsx)(a, { open: r, onOpenChange: c, children: _ })),
      (t[7] = r),
      (t[8] = _),
      (t[9] = v))
    : (v = t[9]);
  let y;
  return (
    t[10] !== m || t[11] !== v
      ? ((y = (0, p.jsxs)(p.Fragment, { children: [m, v] })),
        (t[10] = m),
        (t[11] = v),
        (t[12] = y))
      : (y = t[12]),
    y
  );
}
export { h as n, u as r, g as t };
