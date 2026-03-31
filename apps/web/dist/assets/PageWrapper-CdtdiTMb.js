import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { T as t } from "./index-CuMF3NGg.js";
import { ur as n } from "./src-DHCpG1Q-.js";
import { t as r } from "./IconArrowLeft-yF5T69Ob.js";
var i = t(),
  a = e();
function o(e) {
  let t = (0, i.c)(30),
    {
      title: o,
      headerCenter: c,
      headerRight: l,
      showBack: u,
      onBack: d,
      fillHeight: f,
      children: p,
      childPadding: m,
    } = e,
    h = u === void 0 ? !1 : u,
    g = f === void 0 ? !1 : f,
    _ = m === void 0 ? !0 : m,
    v;
  t[0] !== d || t[1] !== h
    ? ((v =
        h &&
        (0, a.jsx)(n, {
          size: `icon`,
          variant: `outline`,
          onClick: d ?? s,
          className: `motion-press h-9 w-9 flex-shrink-0 rounded-full hover:scale-[1.03] active:scale-[0.97]`,
          children: (0, a.jsx)(r, {
            size: 16,
            className: `text-muted-foreground`,
          }),
        })),
      (t[0] = d),
      (t[1] = h),
      (t[2] = v))
    : (v = t[2]);
  let y;
  t[3] === o
    ? (y = t[4])
    : ((y =
        o &&
        (0, a.jsx)(`h1`, {
          className: `min-w-0 whitespace-nowrap text-base font-semibold tracking-[-0.02em] text-foreground sm:text-lg md:text-xl animate-in fade-in slide-in-from-left-1 duration-300`,
          children: o,
        })),
      (t[3] = o),
      (t[4] = y));
  let b;
  t[5] !== v || t[6] !== y
    ? ((b = (0, a.jsxs)(`div`, {
        className: `flex min-w-0 items-center gap-2 sm:gap-3`,
        children: [v, y],
      })),
      (t[5] = v),
      (t[6] = y),
      (t[7] = b))
    : (b = t[7]);
  let x;
  t[8] === c
    ? (x = t[9])
    : ((x = c
        ? (0, a.jsx)(`div`, {
            className: `hidden min-w-0 justify-center md:flex animate-in fade-in duration-300`,
            children: (0, a.jsx)(`div`, {
              className: `w-full max-w-xl`,
              children: c,
            }),
          })
        : (0, a.jsx)(`div`, { className: `hidden md:block` })),
      (t[8] = c),
      (t[9] = x));
  let S;
  t[10] === l
    ? (S = t[11])
    : ((S = (0, a.jsx)(`div`, {
        className: `flex min-h-10 items-center justify-end gap-1.5 sm:gap-2 justify-self-end animate-in fade-in slide-in-from-right-1 duration-300`,
        children: l,
      })),
      (t[10] = l),
      (t[11] = S));
  let C;
  t[12] !== b || t[13] !== x || t[14] !== S
    ? ((C = (0, a.jsxs)(`div`, {
        className: `grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]`,
        children: [b, x, S],
      })),
      (t[12] = b),
      (t[13] = x),
      (t[14] = S),
      (t[15] = C))
    : (C = t[15]);
  let w;
  t[16] === c
    ? (w = t[17])
    : ((w =
        c &&
        (0, a.jsx)(`div`, {
          className: `mt-2 md:hidden animate-in fade-in duration-300`,
          children: c,
        })),
      (t[16] = c),
      (t[17] = w));
  let T;
  t[18] !== w || t[19] !== C
    ? ((T = (0, a.jsxs)(`div`, {
        className: `motion-base relative p-3 sm:px-4`,
        children: [C, w],
      })),
      (t[18] = w),
      (t[19] = C),
      (t[20] = T))
    : (T = t[20]);
  let E = `flex-1 min-h-0 ${g ? `overflow-hidden flex flex-col` : `overflow-auto scrollbar`}`,
    D = `flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-1 duration-300 ${_ ? `p-3 pt-0` : ``} ${g ? `flex-1 min-h-0 overflow-hidden` : `min-h-full`}`,
    O;
  t[21] !== p || t[22] !== D
    ? ((O = (0, a.jsx)(`div`, { className: D, children: p })),
      (t[21] = p),
      (t[22] = D),
      (t[23] = O))
    : (O = t[23]);
  let k;
  t[24] !== E || t[25] !== O
    ? ((k = (0, a.jsx)(`div`, { className: E, children: O })),
      (t[24] = E),
      (t[25] = O),
      (t[26] = k))
    : (k = t[26]);
  let A;
  return (
    t[27] !== T || t[28] !== k
      ? ((A = (0, a.jsx)(`div`, {
          className: `flex-1 h-full min-h-0 overflow-hidden animate-in fade-in duration-300`,
          children: (0, a.jsxs)(`div`, {
            className: `flex h-full min-h-0 flex-col overflow-hidden`,
            children: [T, k],
          }),
        })),
        (t[27] = T),
        (t[28] = k),
        (t[29] = A))
      : (A = t[29]),
    A
  );
}
function s() {
  return window.history.back();
}
export { o as t };
