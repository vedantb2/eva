import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { n as i } from "./backend-BVlbQtYj.js";
import { t as a } from "./hooks-B_9i2gKL.js";
import {
  Bt as o,
  Kt as s,
  Rt as c,
  Vt as l,
  Z as u,
  ar as d,
  en as f,
  ir as p,
  zt as m,
} from "./src-DzioQSsH.js";
import { t as h } from "./createReactComponent-C2GWxX5y.js";
import { n as g, r as _, t as v } from "./TimeRangeFilter-CoMwH2_p.js";
import { t as y } from "./IconChecklist-Bh1NM8HY.js";
import { t as b } from "./IconGitPullRequest-A3RyN7ym.js";
import { t as x } from "./IconPercentage-BsDAoz3z.js";
import { t as S } from "./IconUser-CnFB9Mif.js";
import { t as C } from "./IconUsers-C0ORl3PB.js";
import { n as w } from "./dates-DHZmrCUU.js";
import { S as T, b as E } from "./search-params-2NJX6Or7.js";
import { t as D } from "./PageWrapper-Z5X-C4Rx.js";
import { n as ee } from "./RepoContext-Dg6-rqFp.js";
var te = h(`outline`, `flame`, `Flame`, [
    [
      `path`,
      {
        d: `M12 10.941c2.333 -3.308 .167 -7.823 -1 -8.941c0 3.395 -2.235 5.299 -3.667 6.706c-1.43 1.408 -2.333 3.294 -2.333 5.588c0 3.704 3.134 6.706 7 6.706c3.866 0 7 -3.002 7 -6.706c0 -1.712 -1.232 -4.403 -2.333 -5.588c-2.084 3.353 -3.257 3.353 -4.667 2.235`,
        key: `svg-0`,
      },
    ],
  ]),
  ne = h(`outline`, `minus`, `Minus`, [
    [`path`, { d: `M5 12l14 0`, key: `svg-0` }],
  ]),
  re = h(`outline`, `trending-down`, `TrendingDown`, [
    [`path`, { d: `M3 7l6 6l4 -4l8 8`, key: `svg-0` }],
    [`path`, { d: `M21 10l0 7l-7 0`, key: `svg-1` }],
  ]),
  ie = h(`outline`, `trending-up`, `TrendingUp`, [
    [`path`, { d: `M3 17l6 -6l4 4l8 -8`, key: `svg-0` }],
    [`path`, { d: `M14 7l7 0l0 7`, key: `svg-1` }],
  ]),
  O = h(`outline`, `trophy`, `Trophy`, [
    [`path`, { d: `M8 21l8 0`, key: `svg-0` }],
    [`path`, { d: `M12 17l0 4`, key: `svg-1` }],
    [`path`, { d: `M7 4l10 0`, key: `svg-2` }],
    [`path`, { d: `M17 4v8a5 5 0 0 1 -10 0v-8`, key: `svg-3` }],
    [`path`, { d: `M3 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`, key: `svg-4` }],
    [`path`, { d: `M17 9a2 2 0 1 0 4 0a2 2 0 1 0 -4 0`, key: `svg-5` }],
  ]),
  ae = r(),
  k = n();
function oe(e) {
  let t = (0, ae.c)(11),
    { current: n, previous: r } = e;
  if (r === 0 && n === 0) return null;
  let i;
  t[0] !== n || t[1] !== r
    ? ((i = r > 0 ? Math.round(((n - r) / r) * 100) : n > 0 ? 100 : 0),
      (t[0] = n),
      (t[1] = r),
      (t[2] = i))
    : (i = t[2]);
  let a = i;
  if (a === 0) {
    let e;
    return (
      t[3] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, k.jsxs)(`span`, {
            className: `inline-flex items-center gap-0.5 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground`,
            children: [(0, k.jsx)(ne, { size: 12 }), `0%`],
          })),
          (t[3] = e))
        : (e = t[3]),
      e
    );
  }
  let o = a > 0,
    s = `inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium ${o ? `bg-success/10 text-success` : `bg-destructive/10 text-destructive`}`,
    c;
  t[4] === o
    ? (c = t[5])
    : ((c = o ? (0, k.jsx)(ie, { size: 12 }) : (0, k.jsx)(re, { size: 12 })),
      (t[4] = o),
      (t[5] = c));
  let l = o ? `+` : ``,
    u;
  return (
    t[6] !== a || t[7] !== s || t[8] !== c || t[9] !== l
      ? ((u = (0, k.jsxs)(`span`, { className: s, children: [c, l, a, `%`] })),
        (t[6] = a),
        (t[7] = s),
        (t[8] = c),
        (t[9] = l),
        (t[10] = u))
      : (u = t[10]),
    u
  );
}
function se(e) {
  let t = (0, ae.c)(22),
    {
      icon: n,
      label: r,
      value: i,
      subtitle: a,
      previousValue: o,
      currentValue: s,
    } = e,
    c = o !== void 0 && s !== void 0,
    l;
  t[0] === n
    ? (l = t[1])
    : ((l = (0, k.jsx)(`div`, {
        className: `rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2`,
        children: (0, k.jsx)(n, { size: 18, className: `sm:h-5 sm:w-5` }),
      })),
      (t[0] = n),
      (t[1] = l));
  let u;
  t[2] !== s || t[3] !== o || t[4] !== c
    ? ((u = c && (0, k.jsx)(oe, { current: s, previous: o })),
      (t[2] = s),
      (t[3] = o),
      (t[4] = c),
      (t[5] = u))
    : (u = t[5]);
  let f;
  t[6] !== l || t[7] !== u
    ? ((f = (0, k.jsxs)(`div`, {
        className: `flex items-center justify-between`,
        children: [l, u],
      })),
      (t[6] = l),
      (t[7] = u),
      (t[8] = f))
    : (f = t[8]);
  let m;
  t[9] === i
    ? (m = t[10])
    : ((m = (0, k.jsx)(`p`, {
        className: `text-2xl font-bold tabular-nums text-foreground sm:text-3xl`,
        children: i,
      })),
      (t[9] = i),
      (t[10] = m));
  let h;
  t[11] === r
    ? (h = t[12])
    : ((h = (0, k.jsx)(`p`, {
        className: `text-xs text-muted-foreground sm:text-sm`,
        children: r,
      })),
      (t[11] = r),
      (t[12] = h));
  let g;
  t[13] === a
    ? (g = t[14])
    : ((g =
        a &&
        (0, k.jsx)(`p`, {
          className: `text-xs text-muted-foreground`,
          children: a,
        })),
      (t[13] = a),
      (t[14] = g));
  let _;
  t[15] !== m || t[16] !== h || t[17] !== g
    ? ((_ = (0, k.jsxs)(`div`, { className: `min-w-0`, children: [m, h, g] })),
      (t[15] = m),
      (t[16] = h),
      (t[17] = g),
      (t[18] = _))
    : (_ = t[18]);
  let v;
  return (
    t[19] !== f || t[20] !== _
      ? ((v = (0, k.jsx)(p, {
          className: `bg-muted/40 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-muted/60`,
          children: (0, k.jsxs)(d, {
            className: `flex flex-col gap-2 p-3 sm:p-4`,
            children: [f, _],
          }),
        })),
        (t[19] = f),
        (t[20] = _),
        (t[21] = v))
      : (v = t[21]),
    v
  );
}
var A = e(t(), 1);
function ce(e) {
  return (e + 0.5) | 0;
}
var j = (e, t, n) => Math.max(Math.min(e, n), t);
function M(e) {
  return j(ce(e * 2.55), 0, 255);
}
function N(e) {
  return j(ce(e * 255), 0, 255);
}
function P(e) {
  return j(ce(e / 2.55) / 100, 0, 1);
}
function le(e) {
  return j(ce(e * 100), 0, 100);
}
var F = {
    0: 0,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    a: 10,
    b: 11,
    c: 12,
    d: 13,
    e: 14,
    f: 15,
  },
  ue = [...`0123456789ABCDEF`],
  de = (e) => ue[e & 15],
  fe = (e) => ue[(e & 240) >> 4] + ue[e & 15],
  pe = (e) => (e & 240) >> 4 == (e & 15),
  me = (e) => pe(e.r) && pe(e.g) && pe(e.b) && pe(e.a);
function he(e) {
  var t = e.length,
    n;
  return (
    e[0] === `#` &&
      (t === 4 || t === 5
        ? (n = {
            r: 255 & (F[e[1]] * 17),
            g: 255 & (F[e[2]] * 17),
            b: 255 & (F[e[3]] * 17),
            a: t === 5 ? F[e[4]] * 17 : 255,
          })
        : (t === 7 || t === 9) &&
          (n = {
            r: (F[e[1]] << 4) | F[e[2]],
            g: (F[e[3]] << 4) | F[e[4]],
            b: (F[e[5]] << 4) | F[e[6]],
            a: t === 9 ? (F[e[7]] << 4) | F[e[8]] : 255,
          })),
    n
  );
}
var ge = (e, t) => (e < 255 ? t(e) : ``);
function _e(e) {
  var t = me(e) ? de : fe;
  return e ? `#` + t(e.r) + t(e.g) + t(e.b) + ge(e.a, t) : void 0;
}
var ve =
  /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
function ye(e, t, n) {
  let r = t * Math.min(n, 1 - n),
    i = (t, i = (t + e / 30) % 12) =>
      n - r * Math.max(Math.min(i - 3, 9 - i, 1), -1);
  return [i(0), i(8), i(4)];
}
function be(e, t, n) {
  let r = (r, i = (r + e / 60) % 6) =>
    n - n * t * Math.max(Math.min(i, 4 - i, 1), 0);
  return [r(5), r(3), r(1)];
}
function xe(e, t, n) {
  let r = ye(e, 1, 0.5),
    i;
  for (t + n > 1 && ((i = 1 / (t + n)), (t *= i), (n *= i)), i = 0; i < 3; i++)
    ((r[i] *= 1 - t - n), (r[i] += t));
  return r;
}
function Se(e, t, n, r, i) {
  return e === i
    ? (t - n) / r + (t < n ? 6 : 0)
    : t === i
      ? (n - e) / r + 2
      : (e - t) / r + 4;
}
function Ce(e) {
  let t = e.r / 255,
    n = e.g / 255,
    r = e.b / 255,
    i = Math.max(t, n, r),
    a = Math.min(t, n, r),
    o = (i + a) / 2,
    s,
    c,
    l;
  return (
    i !== a &&
      ((l = i - a),
      (c = o > 0.5 ? l / (2 - i - a) : l / (i + a)),
      (s = Se(t, n, r, l, i)),
      (s = s * 60 + 0.5)),
    [s | 0, c || 0, o]
  );
}
function we(e, t, n, r) {
  return (Array.isArray(t) ? e(t[0], t[1], t[2]) : e(t, n, r)).map(N);
}
function Te(e, t, n) {
  return we(ye, e, t, n);
}
function Ee(e, t, n) {
  return we(xe, e, t, n);
}
function De(e, t, n) {
  return we(be, e, t, n);
}
function Oe(e) {
  return ((e % 360) + 360) % 360;
}
function ke(e) {
  let t = ve.exec(e),
    n = 255,
    r;
  if (!t) return;
  t[5] !== r && (n = t[6] ? M(+t[5]) : N(+t[5]));
  let i = Oe(+t[2]),
    a = t[3] / 100,
    o = t[4] / 100;
  return (
    (r =
      t[1] === `hwb`
        ? Ee(i, a, o)
        : t[1] === `hsv`
          ? De(i, a, o)
          : Te(i, a, o)),
    { r: r[0], g: r[1], b: r[2], a: n }
  );
}
function Ae(e, t) {
  var n = Ce(e);
  ((n[0] = Oe(n[0] + t)),
    (n = Te(n)),
    (e.r = n[0]),
    (e.g = n[1]),
    (e.b = n[2]));
}
function je(e) {
  if (!e) return;
  let t = Ce(e),
    n = t[0],
    r = le(t[1]),
    i = le(t[2]);
  return e.a < 255
    ? `hsla(${n}, ${r}%, ${i}%, ${P(e.a)})`
    : `hsl(${n}, ${r}%, ${i}%)`;
}
var Me = {
    x: `dark`,
    Z: `light`,
    Y: `re`,
    X: `blu`,
    W: `gr`,
    V: `medium`,
    U: `slate`,
    A: `ee`,
    T: `ol`,
    S: `or`,
    B: `ra`,
    C: `lateg`,
    D: `ights`,
    R: `in`,
    Q: `turquois`,
    E: `hi`,
    P: `ro`,
    O: `al`,
    N: `le`,
    M: `de`,
    L: `yello`,
    F: `en`,
    K: `ch`,
    G: `arks`,
    H: `ea`,
    I: `ightg`,
    J: `wh`,
  },
  Ne = {
    OiceXe: `f0f8ff`,
    antiquewEte: `faebd7`,
    aqua: `ffff`,
    aquamarRe: `7fffd4`,
    azuY: `f0ffff`,
    beige: `f5f5dc`,
    bisque: `ffe4c4`,
    black: `0`,
    blanKedOmond: `ffebcd`,
    Xe: `ff`,
    XeviTet: `8a2be2`,
    bPwn: `a52a2a`,
    burlywood: `deb887`,
    caMtXe: `5f9ea0`,
    KartYuse: `7fff00`,
    KocTate: `d2691e`,
    cSO: `ff7f50`,
    cSnflowerXe: `6495ed`,
    cSnsilk: `fff8dc`,
    crimson: `dc143c`,
    cyan: `ffff`,
    xXe: `8b`,
    xcyan: `8b8b`,
    xgTMnPd: `b8860b`,
    xWay: `a9a9a9`,
    xgYF: `6400`,
    xgYy: `a9a9a9`,
    xkhaki: `bdb76b`,
    xmagFta: `8b008b`,
    xTivegYF: `556b2f`,
    xSange: `ff8c00`,
    xScEd: `9932cc`,
    xYd: `8b0000`,
    xsOmon: `e9967a`,
    xsHgYF: `8fbc8f`,
    xUXe: `483d8b`,
    xUWay: `2f4f4f`,
    xUgYy: `2f4f4f`,
    xQe: `ced1`,
    xviTet: `9400d3`,
    dAppRk: `ff1493`,
    dApskyXe: `bfff`,
    dimWay: `696969`,
    dimgYy: `696969`,
    dodgerXe: `1e90ff`,
    fiYbrick: `b22222`,
    flSOwEte: `fffaf0`,
    foYstWAn: `228b22`,
    fuKsia: `ff00ff`,
    gaRsbSo: `dcdcdc`,
    ghostwEte: `f8f8ff`,
    gTd: `ffd700`,
    gTMnPd: `daa520`,
    Way: `808080`,
    gYF: `8000`,
    gYFLw: `adff2f`,
    gYy: `808080`,
    honeyMw: `f0fff0`,
    hotpRk: `ff69b4`,
    RdianYd: `cd5c5c`,
    Rdigo: `4b0082`,
    ivSy: `fffff0`,
    khaki: `f0e68c`,
    lavFMr: `e6e6fa`,
    lavFMrXsh: `fff0f5`,
    lawngYF: `7cfc00`,
    NmoncEffon: `fffacd`,
    ZXe: `add8e6`,
    ZcSO: `f08080`,
    Zcyan: `e0ffff`,
    ZgTMnPdLw: `fafad2`,
    ZWay: `d3d3d3`,
    ZgYF: `90ee90`,
    ZgYy: `d3d3d3`,
    ZpRk: `ffb6c1`,
    ZsOmon: `ffa07a`,
    ZsHgYF: `20b2aa`,
    ZskyXe: `87cefa`,
    ZUWay: `778899`,
    ZUgYy: `778899`,
    ZstAlXe: `b0c4de`,
    ZLw: `ffffe0`,
    lime: `ff00`,
    limegYF: `32cd32`,
    lRF: `faf0e6`,
    magFta: `ff00ff`,
    maPon: `800000`,
    VaquamarRe: `66cdaa`,
    VXe: `cd`,
    VScEd: `ba55d3`,
    VpurpN: `9370db`,
    VsHgYF: `3cb371`,
    VUXe: `7b68ee`,
    VsprRggYF: `fa9a`,
    VQe: `48d1cc`,
    VviTetYd: `c71585`,
    midnightXe: `191970`,
    mRtcYam: `f5fffa`,
    mistyPse: `ffe4e1`,
    moccasR: `ffe4b5`,
    navajowEte: `ffdead`,
    navy: `80`,
    Tdlace: `fdf5e6`,
    Tive: `808000`,
    TivedBb: `6b8e23`,
    Sange: `ffa500`,
    SangeYd: `ff4500`,
    ScEd: `da70d6`,
    pOegTMnPd: `eee8aa`,
    pOegYF: `98fb98`,
    pOeQe: `afeeee`,
    pOeviTetYd: `db7093`,
    papayawEp: `ffefd5`,
    pHKpuff: `ffdab9`,
    peru: `cd853f`,
    pRk: `ffc0cb`,
    plum: `dda0dd`,
    powMrXe: `b0e0e6`,
    purpN: `800080`,
    YbeccapurpN: `663399`,
    Yd: `ff0000`,
    Psybrown: `bc8f8f`,
    PyOXe: `4169e1`,
    saddNbPwn: `8b4513`,
    sOmon: `fa8072`,
    sandybPwn: `f4a460`,
    sHgYF: `2e8b57`,
    sHshell: `fff5ee`,
    siFna: `a0522d`,
    silver: `c0c0c0`,
    skyXe: `87ceeb`,
    UXe: `6a5acd`,
    UWay: `708090`,
    UgYy: `708090`,
    snow: `fffafa`,
    sprRggYF: `ff7f`,
    stAlXe: `4682b4`,
    tan: `d2b48c`,
    teO: `8080`,
    tEstN: `d8bfd8`,
    tomato: `ff6347`,
    Qe: `40e0d0`,
    viTet: `ee82ee`,
    JHt: `f5deb3`,
    wEte: `ffffff`,
    wEtesmoke: `f5f5f5`,
    Lw: `ffff00`,
    LwgYF: `9acd32`,
  };
function Pe() {
  let e = {},
    t = Object.keys(Ne),
    n = Object.keys(Me),
    r,
    i,
    a,
    o,
    s;
  for (r = 0; r < t.length; r++) {
    for (o = s = t[r], i = 0; i < n.length; i++)
      ((a = n[i]), (s = s.replace(a, Me[a])));
    ((a = parseInt(Ne[o], 16)),
      (e[s] = [(a >> 16) & 255, (a >> 8) & 255, a & 255]));
  }
  return e;
}
var Fe;
function Ie(e) {
  Fe || ((Fe = Pe()), (Fe.transparent = [0, 0, 0, 0]));
  let t = Fe[e.toLowerCase()];
  return t && { r: t[0], g: t[1], b: t[2], a: t.length === 4 ? t[3] : 255 };
}
var Le =
  /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
function Re(e) {
  let t = Le.exec(e),
    n = 255,
    r,
    i,
    a;
  if (t) {
    if (t[7] !== r) {
      let e = +t[7];
      n = t[8] ? M(e) : j(e * 255, 0, 255);
    }
    return (
      (r = +t[1]),
      (i = +t[3]),
      (a = +t[5]),
      (r = 255 & (t[2] ? M(r) : j(r, 0, 255))),
      (i = 255 & (t[4] ? M(i) : j(i, 0, 255))),
      (a = 255 & (t[6] ? M(a) : j(a, 0, 255))),
      { r, g: i, b: a, a: n }
    );
  }
}
function ze(e) {
  return (
    e &&
    (e.a < 255
      ? `rgba(${e.r}, ${e.g}, ${e.b}, ${P(e.a)})`
      : `rgb(${e.r}, ${e.g}, ${e.b})`)
  );
}
var Be = (e) => (e <= 0.0031308 ? e * 12.92 : e ** (1 / 2.4) * 1.055 - 0.055),
  Ve = (e) => (e <= 0.04045 ? e / 12.92 : ((e + 0.055) / 1.055) ** 2.4);
function He(e, t, n) {
  let r = Ve(P(e.r)),
    i = Ve(P(e.g)),
    a = Ve(P(e.b));
  return {
    r: N(Be(r + n * (Ve(P(t.r)) - r))),
    g: N(Be(i + n * (Ve(P(t.g)) - i))),
    b: N(Be(a + n * (Ve(P(t.b)) - a))),
    a: e.a + n * (t.a - e.a),
  };
}
function Ue(e, t, n) {
  if (e) {
    let r = Ce(e);
    ((r[t] = Math.max(0, Math.min(r[t] + r[t] * n, t === 0 ? 360 : 1))),
      (r = Te(r)),
      (e.r = r[0]),
      (e.g = r[1]),
      (e.b = r[2]));
  }
}
function We(e, t) {
  return e && Object.assign(t || {}, e);
}
function Ge(e) {
  var t = { r: 0, g: 0, b: 0, a: 255 };
  return (
    Array.isArray(e)
      ? e.length >= 3 &&
        ((t = { r: e[0], g: e[1], b: e[2], a: 255 }),
        e.length > 3 && (t.a = N(e[3])))
      : ((t = We(e, { r: 0, g: 0, b: 0, a: 1 })), (t.a = N(t.a))),
    t
  );
}
function Ke(e) {
  return e.charAt(0) === `r` ? Re(e) : ke(e);
}
var qe = class e {
  constructor(t) {
    if (t instanceof e) return t;
    let n = typeof t,
      r;
    (n === `object`
      ? (r = Ge(t))
      : n === `string` && (r = he(t) || Ie(t) || Ke(t)),
      (this._rgb = r),
      (this._valid = !!r));
  }
  get valid() {
    return this._valid;
  }
  get rgb() {
    var e = We(this._rgb);
    return (e && (e.a = P(e.a)), e);
  }
  set rgb(e) {
    this._rgb = Ge(e);
  }
  rgbString() {
    return this._valid ? ze(this._rgb) : void 0;
  }
  hexString() {
    return this._valid ? _e(this._rgb) : void 0;
  }
  hslString() {
    return this._valid ? je(this._rgb) : void 0;
  }
  mix(e, t) {
    if (e) {
      let n = this.rgb,
        r = e.rgb,
        i,
        a = t === i ? 0.5 : t,
        o = 2 * a - 1,
        s = n.a - r.a,
        c = ((o * s === -1 ? o : (o + s) / (1 + o * s)) + 1) / 2;
      ((i = 1 - c),
        (n.r = 255 & (c * n.r + i * r.r + 0.5)),
        (n.g = 255 & (c * n.g + i * r.g + 0.5)),
        (n.b = 255 & (c * n.b + i * r.b + 0.5)),
        (n.a = a * n.a + (1 - a) * r.a),
        (this.rgb = n));
    }
    return this;
  }
  interpolate(e, t) {
    return (e && (this._rgb = He(this._rgb, e._rgb, t)), this);
  }
  clone() {
    return new e(this.rgb);
  }
  alpha(e) {
    return ((this._rgb.a = N(e)), this);
  }
  clearer(e) {
    let t = this._rgb;
    return ((t.a *= 1 - e), this);
  }
  greyscale() {
    let e = this._rgb;
    return ((e.r = e.g = e.b = ce(e.r * 0.3 + e.g * 0.59 + e.b * 0.11)), this);
  }
  opaquer(e) {
    let t = this._rgb;
    return ((t.a *= 1 + e), this);
  }
  negate() {
    let e = this._rgb;
    return ((e.r = 255 - e.r), (e.g = 255 - e.g), (e.b = 255 - e.b), this);
  }
  lighten(e) {
    return (Ue(this._rgb, 2, e), this);
  }
  darken(e) {
    return (Ue(this._rgb, 2, -e), this);
  }
  saturate(e) {
    return (Ue(this._rgb, 1, e), this);
  }
  desaturate(e) {
    return (Ue(this._rgb, 1, -e), this);
  }
  rotate(e) {
    return (Ae(this._rgb, e), this);
  }
};
function Je() {}
var Ye = (() => {
  let e = 0;
  return () => e++;
})();
function I(e) {
  return e == null;
}
function L(e) {
  if (Array.isArray && Array.isArray(e)) return !0;
  let t = Object.prototype.toString.call(e);
  return t.slice(0, 7) === `[object` && t.slice(-6) === `Array]`;
}
function R(e) {
  return e !== null && Object.prototype.toString.call(e) === `[object Object]`;
}
function z(e) {
  return (typeof e == `number` || e instanceof Number) && isFinite(+e);
}
function B(e, t) {
  return z(e) ? e : t;
}
function V(e, t) {
  return e === void 0 ? t : e;
}
var Xe = (e, t) =>
  typeof e == `string` && e.endsWith(`%`) ? (parseFloat(e) / 100) * t : +e;
function H(e, t, n) {
  if (e && typeof e.call == `function`) return e.apply(n, t);
}
function U(e, t, n, r) {
  let i, a, o;
  if (L(e))
    if (((a = e.length), r)) for (i = a - 1; i >= 0; i--) t.call(n, e[i], i);
    else for (i = 0; i < a; i++) t.call(n, e[i], i);
  else if (R(e))
    for (o = Object.keys(e), a = o.length, i = 0; i < a; i++)
      t.call(n, e[o[i]], o[i]);
}
function Ze(e, t) {
  let n, r, i, a;
  if (!e || !t || e.length !== t.length) return !1;
  for (n = 0, r = e.length; n < r; ++n)
    if (
      ((i = e[n]),
      (a = t[n]),
      i.datasetIndex !== a.datasetIndex || i.index !== a.index)
    )
      return !1;
  return !0;
}
function Qe(e) {
  if (L(e)) return e.map(Qe);
  if (R(e)) {
    let t = Object.create(null),
      n = Object.keys(e),
      r = n.length,
      i = 0;
    for (; i < r; ++i) t[n[i]] = Qe(e[n[i]]);
    return t;
  }
  return e;
}
function $e(e) {
  return [`__proto__`, `prototype`, `constructor`].indexOf(e) === -1;
}
function et(e, t, n, r) {
  if (!$e(e)) return;
  let i = t[e],
    a = n[e];
  R(i) && R(a) ? tt(i, a, r) : (t[e] = Qe(a));
}
function tt(e, t, n) {
  let r = L(t) ? t : [t],
    i = r.length;
  if (!R(e)) return e;
  n ||= {};
  let a = n.merger || et,
    o;
  for (let t = 0; t < i; ++t) {
    if (((o = r[t]), !R(o))) continue;
    let i = Object.keys(o);
    for (let t = 0, r = i.length; t < r; ++t) a(i[t], e, o, n);
  }
  return e;
}
function nt(e, t) {
  return tt(e, t, { merger: rt });
}
function rt(e, t, n) {
  if (!$e(e)) return;
  let r = t[e],
    i = n[e];
  R(r) && R(i)
    ? nt(r, i)
    : Object.prototype.hasOwnProperty.call(t, e) || (t[e] = Qe(i));
}
var it = { "": (e) => e, x: (e) => e.x, y: (e) => e.y };
function at(e) {
  let t = e.split(`.`),
    n = [],
    r = ``;
  for (let e of t)
    ((r += e),
      r.endsWith(`\\`) ? (r = r.slice(0, -1) + `.`) : (n.push(r), (r = ``)));
  return n;
}
function ot(e) {
  let t = at(e);
  return (e) => {
    for (let n of t) {
      if (n === ``) break;
      e &&= e[n];
    }
    return e;
  };
}
function st(e, t) {
  return (it[t] || (it[t] = ot(t)))(e);
}
function ct(e) {
  return e.charAt(0).toUpperCase() + e.slice(1);
}
var lt = (e) => e !== void 0,
  ut = (e) => typeof e == `function`,
  dt = (e, t) => {
    if (e.size !== t.size) return !1;
    for (let n of e) if (!t.has(n)) return !1;
    return !0;
  };
function ft(e) {
  return e.type === `mouseup` || e.type === `click` || e.type === `contextmenu`;
}
var W = Math.PI,
  G = 2 * W,
  pt = G + W,
  mt = 1 / 0,
  ht = W / 180,
  K = W / 2,
  gt = W / 4,
  _t = (W * 2) / 3,
  vt = Math.log10,
  yt = Math.sign;
function bt(e, t, n) {
  return Math.abs(e - t) < n;
}
function xt(e) {
  let t = Math.round(e);
  e = bt(e, t, e / 1e3) ? t : e;
  let n = 10 ** Math.floor(vt(e)),
    r = e / n;
  return (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * n;
}
function St(e) {
  let t = [],
    n = Math.sqrt(e),
    r;
  for (r = 1; r < n; r++) e % r === 0 && (t.push(r), t.push(e / r));
  return (n === (n | 0) && t.push(n), t.sort((e, t) => e - t).pop(), t);
}
function Ct(e) {
  return (
    typeof e == `symbol` ||
    (typeof e == `object` &&
      !!e &&
      !(Symbol.toPrimitive in e || `toString` in e || `valueOf` in e))
  );
}
function wt(e) {
  return !Ct(e) && !isNaN(parseFloat(e)) && isFinite(e);
}
function Tt(e, t) {
  let n = Math.round(e);
  return n - t <= e && n + t >= e;
}
function Et(e, t, n) {
  let r, i, a;
  for (r = 0, i = e.length; r < i; r++)
    ((a = e[r][n]),
      isNaN(a) || ((t.min = Math.min(t.min, a)), (t.max = Math.max(t.max, a))));
}
function Dt(e) {
  return (W / 180) * e;
}
function Ot(e) {
  return (180 / W) * e;
}
function kt(e) {
  if (!z(e)) return;
  let t = 1,
    n = 0;
  for (; Math.round(e * t) / t !== e; ) ((t *= 10), n++);
  return n;
}
function At(e, t) {
  let n = t.x - e.x,
    r = t.y - e.y,
    i = Math.sqrt(n * n + r * r),
    a = Math.atan2(r, n);
  return (a < -0.5 * W && (a += G), { angle: a, distance: i });
}
function jt(e, t) {
  return Math.sqrt((t.x - e.x) ** 2 + (t.y - e.y) ** 2);
}
function Mt(e, t) {
  return ((e - t + pt) % G) - W;
}
function q(e) {
  return ((e % G) + G) % G;
}
function Nt(e, t, n, r) {
  let i = q(e),
    a = q(t),
    o = q(n),
    s = q(a - i),
    c = q(o - i),
    l = q(i - a),
    u = q(i - o);
  return i === a || i === o || (r && a === o) || (s > c && l < u);
}
function J(e, t, n) {
  return Math.max(t, Math.min(n, e));
}
function Pt(e) {
  return J(e, -32768, 32767);
}
function Ft(e, t, n, r = 1e-6) {
  return e >= Math.min(t, n) - r && e <= Math.max(t, n) + r;
}
function It(e, t, n) {
  n ||= (n) => e[n] < t;
  let r = e.length - 1,
    i = 0,
    a;
  for (; r - i > 1; ) ((a = (i + r) >> 1), n(a) ? (i = a) : (r = a));
  return { lo: i, hi: r };
}
var Lt = (e, t, n, r) =>
    It(
      e,
      n,
      r
        ? (r) => {
            let i = e[r][t];
            return i < n || (i === n && e[r + 1][t] === n);
          }
        : (r) => e[r][t] < n,
    ),
  Rt = (e, t, n) => It(e, n, (r) => e[r][t] >= n);
function zt(e, t, n) {
  let r = 0,
    i = e.length;
  for (; r < i && e[r] < t; ) r++;
  for (; i > r && e[i - 1] > n; ) i--;
  return r > 0 || i < e.length ? e.slice(r, i) : e;
}
var Bt = [`push`, `pop`, `shift`, `splice`, `unshift`];
function Vt(e, t) {
  if (e._chartjs) {
    e._chartjs.listeners.push(t);
    return;
  }
  (Object.defineProperty(e, `_chartjs`, {
    configurable: !0,
    enumerable: !1,
    value: { listeners: [t] },
  }),
    Bt.forEach((t) => {
      let n = `_onData` + ct(t),
        r = e[t];
      Object.defineProperty(e, t, {
        configurable: !0,
        enumerable: !1,
        value(...t) {
          let i = r.apply(this, t);
          return (
            e._chartjs.listeners.forEach((e) => {
              typeof e[n] == `function` && e[n](...t);
            }),
            i
          );
        },
      });
    }));
}
function Ht(e, t) {
  let n = e._chartjs;
  if (!n) return;
  let r = n.listeners,
    i = r.indexOf(t);
  (i !== -1 && r.splice(i, 1),
    !(r.length > 0) &&
      (Bt.forEach((t) => {
        delete e[t];
      }),
      delete e._chartjs));
}
function Ut(e) {
  let t = new Set(e);
  return t.size === e.length ? e : Array.from(t);
}
var Wt = (function () {
  return typeof window > `u`
    ? function (e) {
        return e();
      }
    : window.requestAnimationFrame;
})();
function Gt(e, t) {
  let n = [],
    r = !1;
  return function (...i) {
    ((n = i),
      r ||
        ((r = !0),
        Wt.call(window, () => {
          ((r = !1), e.apply(t, n));
        })));
  };
}
function Kt(e, t) {
  let n;
  return function (...r) {
    return (
      t ? (clearTimeout(n), (n = setTimeout(e, t, r))) : e.apply(this, r),
      t
    );
  };
}
var qt = (e) => (e === `start` ? `left` : e === `end` ? `right` : `center`),
  Jt = (e, t, n) => (e === `start` ? t : e === `end` ? n : (t + n) / 2),
  Yt = (e, t, n, r) =>
    e === (r ? `left` : `right`) ? n : e === `center` ? (t + n) / 2 : t;
function Xt(e, t, n) {
  let r = t.length,
    i = 0,
    a = r;
  if (e._sorted) {
    let { iScale: o, vScale: s, _parsed: c } = e,
      l = e.dataset && e.dataset.options ? e.dataset.options.spanGaps : null,
      u = o.axis,
      { min: d, max: f, minDefined: p, maxDefined: m } = o.getUserBounds();
    if (p) {
      if (
        ((i = Math.min(
          Lt(c, u, d).lo,
          n ? r : Lt(t, u, o.getPixelForValue(d)).lo,
        )),
        l)
      ) {
        let e = c
          .slice(0, i + 1)
          .reverse()
          .findIndex((e) => !I(e[s.axis]));
        i -= Math.max(0, e);
      }
      i = J(i, 0, r - 1);
    }
    if (m) {
      let e = Math.max(
        Lt(c, o.axis, f, !0).hi + 1,
        n ? 0 : Lt(t, u, o.getPixelForValue(f), !0).hi + 1,
      );
      if (l) {
        let t = c.slice(e - 1).findIndex((e) => !I(e[s.axis]));
        e += Math.max(0, t);
      }
      a = J(e, i, r) - i;
    } else a = r - i;
  }
  return { start: i, count: a };
}
function Zt(e) {
  let { xScale: t, yScale: n, _scaleRanges: r } = e,
    i = { xmin: t.min, xmax: t.max, ymin: n.min, ymax: n.max };
  if (!r) return ((e._scaleRanges = i), !0);
  let a =
    r.xmin !== t.min ||
    r.xmax !== t.max ||
    r.ymin !== n.min ||
    r.ymax !== n.max;
  return (Object.assign(r, i), a);
}
var Qt = (e) => e === 0 || e === 1,
  $t = (e, t, n) => -(2 ** (10 * --e) * Math.sin(((e - t) * G) / n)),
  en = (e, t, n) => 2 ** (-10 * e) * Math.sin(((e - t) * G) / n) + 1,
  tn = {
    linear: (e) => e,
    easeInQuad: (e) => e * e,
    easeOutQuad: (e) => -e * (e - 2),
    easeInOutQuad: (e) =>
      (e /= 0.5) < 1 ? 0.5 * e * e : -0.5 * (--e * (e - 2) - 1),
    easeInCubic: (e) => e * e * e,
    easeOutCubic: (e) => --e * e * e + 1,
    easeInOutCubic: (e) =>
      (e /= 0.5) < 1 ? 0.5 * e * e * e : 0.5 * ((e -= 2) * e * e + 2),
    easeInQuart: (e) => e * e * e * e,
    easeOutQuart: (e) => -(--e * e * e * e - 1),
    easeInOutQuart: (e) =>
      (e /= 0.5) < 1 ? 0.5 * e * e * e * e : -0.5 * ((e -= 2) * e * e * e - 2),
    easeInQuint: (e) => e * e * e * e * e,
    easeOutQuint: (e) => --e * e * e * e * e + 1,
    easeInOutQuint: (e) =>
      (e /= 0.5) < 1
        ? 0.5 * e * e * e * e * e
        : 0.5 * ((e -= 2) * e * e * e * e + 2),
    easeInSine: (e) => -Math.cos(e * K) + 1,
    easeOutSine: (e) => Math.sin(e * K),
    easeInOutSine: (e) => -0.5 * (Math.cos(W * e) - 1),
    easeInExpo: (e) => (e === 0 ? 0 : 2 ** (10 * (e - 1))),
    easeOutExpo: (e) => (e === 1 ? 1 : -(2 ** (-10 * e)) + 1),
    easeInOutExpo: (e) =>
      Qt(e)
        ? e
        : e < 0.5
          ? 0.5 * 2 ** (10 * (e * 2 - 1))
          : 0.5 * (-(2 ** (-10 * (e * 2 - 1))) + 2),
    easeInCirc: (e) => (e >= 1 ? e : -(Math.sqrt(1 - e * e) - 1)),
    easeOutCirc: (e) => Math.sqrt(1 - --e * e),
    easeInOutCirc: (e) =>
      (e /= 0.5) < 1
        ? -0.5 * (Math.sqrt(1 - e * e) - 1)
        : 0.5 * (Math.sqrt(1 - (e -= 2) * e) + 1),
    easeInElastic: (e) => (Qt(e) ? e : $t(e, 0.075, 0.3)),
    easeOutElastic: (e) => (Qt(e) ? e : en(e, 0.075, 0.3)),
    easeInOutElastic(e) {
      let t = 0.1125,
        n = 0.45;
      return Qt(e)
        ? e
        : e < 0.5
          ? 0.5 * $t(e * 2, t, n)
          : 0.5 + 0.5 * en(e * 2 - 1, t, n);
    },
    easeInBack(e) {
      let t = 1.70158;
      return e * e * ((t + 1) * e - t);
    },
    easeOutBack(e) {
      let t = 1.70158;
      return --e * e * ((t + 1) * e + t) + 1;
    },
    easeInOutBack(e) {
      let t = 1.70158;
      return (e /= 0.5) < 1
        ? 0.5 * (e * e * (((t *= 1.525) + 1) * e - t))
        : 0.5 * ((e -= 2) * e * (((t *= 1.525) + 1) * e + t) + 2);
    },
    easeInBounce: (e) => 1 - tn.easeOutBounce(1 - e),
    easeOutBounce(e) {
      let t = 7.5625,
        n = 2.75;
      return e < 1 / n
        ? t * e * e
        : e < 2 / n
          ? t * (e -= 1.5 / n) * e + 0.75
          : e < 2.5 / n
            ? t * (e -= 2.25 / n) * e + 0.9375
            : t * (e -= 2.625 / n) * e + 0.984375;
    },
    easeInOutBounce: (e) =>
      e < 0.5
        ? tn.easeInBounce(e * 2) * 0.5
        : tn.easeOutBounce(e * 2 - 1) * 0.5 + 0.5,
  };
function nn(e) {
  if (e && typeof e == `object`) {
    let t = e.toString();
    return t === `[object CanvasPattern]` || t === `[object CanvasGradient]`;
  }
  return !1;
}
function rn(e) {
  return nn(e) ? e : new qe(e);
}
function an(e) {
  return nn(e) ? e : new qe(e).saturate(0.5).darken(0.1).hexString();
}
var on = [`x`, `y`, `borderWidth`, `radius`, `tension`],
  sn = [`color`, `borderColor`, `backgroundColor`];
function cn(e) {
  (e.set(`animation`, {
    delay: void 0,
    duration: 1e3,
    easing: `easeOutQuart`,
    fn: void 0,
    from: void 0,
    loop: void 0,
    to: void 0,
    type: void 0,
  }),
    e.describe(`animation`, {
      _fallback: !1,
      _indexable: !1,
      _scriptable: (e) =>
        e !== `onProgress` && e !== `onComplete` && e !== `fn`,
    }),
    e.set(`animations`, {
      colors: { type: `color`, properties: sn },
      numbers: { type: `number`, properties: on },
    }),
    e.describe(`animations`, { _fallback: `animation` }),
    e.set(`transitions`, {
      active: { animation: { duration: 400 } },
      resize: { animation: { duration: 0 } },
      show: {
        animations: {
          colors: { from: `transparent` },
          visible: { type: `boolean`, duration: 0 },
        },
      },
      hide: {
        animations: {
          colors: { to: `transparent` },
          visible: { type: `boolean`, easing: `linear`, fn: (e) => e | 0 },
        },
      },
    }));
}
function ln(e) {
  e.set(`layout`, {
    autoPadding: !0,
    padding: { top: 0, right: 0, bottom: 0, left: 0 },
  });
}
var un = new Map();
function dn(e, t) {
  t ||= {};
  let n = e + JSON.stringify(t),
    r = un.get(n);
  return (r || ((r = new Intl.NumberFormat(e, t)), un.set(n, r)), r);
}
function fn(e, t, n) {
  return dn(t, n).format(e);
}
var pn = {
  values(e) {
    return L(e) ? e : `` + e;
  },
  numeric(e, t, n) {
    if (e === 0) return `0`;
    let r = this.chart.options.locale,
      i,
      a = e;
    if (n.length > 1) {
      let t = Math.max(Math.abs(n[0].value), Math.abs(n[n.length - 1].value));
      ((t < 1e-4 || t > 0x38d7ea4c68000) && (i = `scientific`), (a = mn(e, n)));
    }
    let o = vt(Math.abs(a)),
      s = isNaN(o) ? 1 : Math.max(Math.min(-1 * Math.floor(o), 20), 0),
      c = { notation: i, minimumFractionDigits: s, maximumFractionDigits: s };
    return (Object.assign(c, this.options.ticks.format), fn(e, r, c));
  },
  logarithmic(e, t, n) {
    if (e === 0) return `0`;
    let r = n[t].significand || e / 10 ** Math.floor(vt(e));
    return [1, 2, 3, 5, 10, 15].includes(r) || t > 0.8 * n.length
      ? pn.numeric.call(this, e, t, n)
      : ``;
  },
};
function mn(e, t) {
  let n = t.length > 3 ? t[2].value - t[1].value : t[1].value - t[0].value;
  return (
    Math.abs(n) >= 1 && e !== Math.floor(e) && (n = e - Math.floor(e)),
    n
  );
}
var hn = { formatters: pn };
function gn(e) {
  (e.set(`scale`, {
    display: !0,
    offset: !1,
    reverse: !1,
    beginAtZero: !1,
    bounds: `ticks`,
    clip: !0,
    grace: 0,
    grid: {
      display: !0,
      lineWidth: 1,
      drawOnChartArea: !0,
      drawTicks: !0,
      tickLength: 8,
      tickWidth: (e, t) => t.lineWidth,
      tickColor: (e, t) => t.color,
      offset: !1,
    },
    border: { display: !0, dash: [], dashOffset: 0, width: 1 },
    title: { display: !1, text: ``, padding: { top: 4, bottom: 4 } },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: !1,
      textStrokeWidth: 0,
      textStrokeColor: ``,
      padding: 3,
      display: !0,
      autoSkip: !0,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: hn.formatters.values,
      minor: {},
      major: {},
      align: `center`,
      crossAlign: `near`,
      showLabelBackdrop: !1,
      backdropColor: `rgba(255, 255, 255, 0.75)`,
      backdropPadding: 2,
    },
  }),
    e.route(`scale.ticks`, `color`, ``, `color`),
    e.route(`scale.grid`, `color`, ``, `borderColor`),
    e.route(`scale.border`, `color`, ``, `borderColor`),
    e.route(`scale.title`, `color`, ``, `color`),
    e.describe(`scale`, {
      _fallback: !1,
      _scriptable: (e) =>
        !e.startsWith(`before`) &&
        !e.startsWith(`after`) &&
        e !== `callback` &&
        e !== `parser`,
      _indexable: (e) =>
        e !== `borderDash` && e !== `tickBorderDash` && e !== `dash`,
    }),
    e.describe(`scales`, { _fallback: `scale` }),
    e.describe(`scale.ticks`, {
      _scriptable: (e) => e !== `backdropPadding` && e !== `callback`,
      _indexable: (e) => e !== `backdropPadding`,
    }));
}
var _n = Object.create(null),
  vn = Object.create(null);
function yn(e, t) {
  if (!t) return e;
  let n = t.split(`.`);
  for (let t = 0, r = n.length; t < r; ++t) {
    let r = n[t];
    e = e[r] || (e[r] = Object.create(null));
  }
  return e;
}
function bn(e, t, n) {
  return typeof t == `string` ? tt(yn(e, t), n) : tt(yn(e, ``), t);
}
var Y = new (class {
  constructor(e, t) {
    ((this.animation = void 0),
      (this.backgroundColor = `rgba(0,0,0,0.1)`),
      (this.borderColor = `rgba(0,0,0,0.1)`),
      (this.color = `#666`),
      (this.datasets = {}),
      (this.devicePixelRatio = (e) => e.chart.platform.getDevicePixelRatio()),
      (this.elements = {}),
      (this.events = [
        `mousemove`,
        `mouseout`,
        `click`,
        `touchstart`,
        `touchmove`,
      ]),
      (this.font = {
        family: `'Helvetica Neue', 'Helvetica', 'Arial', sans-serif`,
        size: 12,
        style: `normal`,
        lineHeight: 1.2,
        weight: null,
      }),
      (this.hover = {}),
      (this.hoverBackgroundColor = (e, t) => an(t.backgroundColor)),
      (this.hoverBorderColor = (e, t) => an(t.borderColor)),
      (this.hoverColor = (e, t) => an(t.color)),
      (this.indexAxis = `x`),
      (this.interaction = {
        mode: `nearest`,
        intersect: !0,
        includeInvisible: !1,
      }),
      (this.maintainAspectRatio = !0),
      (this.onHover = null),
      (this.onClick = null),
      (this.parsing = !0),
      (this.plugins = {}),
      (this.responsive = !0),
      (this.scale = void 0),
      (this.scales = {}),
      (this.showLine = !0),
      (this.drawActiveElementsOnTop = !0),
      this.describe(e),
      this.apply(t));
  }
  set(e, t) {
    return bn(this, e, t);
  }
  get(e) {
    return yn(this, e);
  }
  describe(e, t) {
    return bn(vn, e, t);
  }
  override(e, t) {
    return bn(_n, e, t);
  }
  route(e, t, n, r) {
    let i = yn(this, e),
      a = yn(this, n),
      o = `_` + t;
    Object.defineProperties(i, {
      [o]: { value: i[t], writable: !0 },
      [t]: {
        enumerable: !0,
        get() {
          let e = this[o],
            t = a[r];
          return R(e) ? Object.assign({}, t, e) : V(e, t);
        },
        set(e) {
          this[o] = e;
        },
      },
    });
  }
  apply(e) {
    e.forEach((e) => e(this));
  }
})(
  {
    _scriptable: (e) => !e.startsWith(`on`),
    _indexable: (e) => e !== `events`,
    hover: { _fallback: `interaction` },
    interaction: { _scriptable: !1, _indexable: !1 },
  },
  [cn, ln, gn],
);
function xn(e) {
  return !e || I(e.size) || I(e.family)
    ? null
    : (e.style ? e.style + ` ` : ``) +
        (e.weight ? e.weight + ` ` : ``) +
        e.size +
        `px ` +
        e.family;
}
function Sn(e, t, n, r, i) {
  let a = t[i];
  return (
    a || ((a = t[i] = e.measureText(i).width), n.push(i)),
    a > r && (r = a),
    r
  );
}
function Cn(e, t, n, r) {
  r ||= {};
  let i = (r.data = r.data || {}),
    a = (r.garbageCollect = r.garbageCollect || []);
  (r.font !== t &&
    ((i = r.data = {}), (a = r.garbageCollect = []), (r.font = t)),
    e.save(),
    (e.font = t));
  let o = 0,
    s = n.length,
    c,
    l,
    u,
    d,
    f;
  for (c = 0; c < s; c++)
    if (((d = n[c]), d != null && !L(d))) o = Sn(e, i, a, o, d);
    else if (L(d))
      for (l = 0, u = d.length; l < u; l++)
        ((f = d[l]), f != null && !L(f) && (o = Sn(e, i, a, o, f)));
  e.restore();
  let p = a.length / 2;
  if (p > n.length) {
    for (c = 0; c < p; c++) delete i[a[c]];
    a.splice(0, p);
  }
  return o;
}
function wn(e, t, n) {
  let r = e.currentDevicePixelRatio,
    i = n === 0 ? 0 : Math.max(n / 2, 0.5);
  return Math.round((t - i) * r) / r + i;
}
function Tn(e, t) {
  (!t && !e) ||
    ((t ||= e.getContext(`2d`)),
    t.save(),
    t.resetTransform(),
    t.clearRect(0, 0, e.width, e.height),
    t.restore());
}
function En(e, t, n, r) {
  Dn(e, t, n, r, null);
}
function Dn(e, t, n, r, i) {
  let a,
    o,
    s,
    c,
    l,
    u,
    d,
    f,
    p = t.pointStyle,
    m = t.rotation,
    h = t.radius,
    g = (m || 0) * ht;
  if (
    p &&
    typeof p == `object` &&
    ((a = p.toString()),
    a === `[object HTMLImageElement]` || a === `[object HTMLCanvasElement]`)
  ) {
    (e.save(),
      e.translate(n, r),
      e.rotate(g),
      e.drawImage(p, -p.width / 2, -p.height / 2, p.width, p.height),
      e.restore());
    return;
  }
  if (!(isNaN(h) || h <= 0)) {
    switch ((e.beginPath(), p)) {
      default:
        (i ? e.ellipse(n, r, i / 2, h, 0, 0, G) : e.arc(n, r, h, 0, G),
          e.closePath());
        break;
      case `triangle`:
        ((u = i ? i / 2 : h),
          e.moveTo(n + Math.sin(g) * u, r - Math.cos(g) * h),
          (g += _t),
          e.lineTo(n + Math.sin(g) * u, r - Math.cos(g) * h),
          (g += _t),
          e.lineTo(n + Math.sin(g) * u, r - Math.cos(g) * h),
          e.closePath());
        break;
      case `rectRounded`:
        ((l = h * 0.516),
          (c = h - l),
          (o = Math.cos(g + gt) * c),
          (d = Math.cos(g + gt) * (i ? i / 2 - l : c)),
          (s = Math.sin(g + gt) * c),
          (f = Math.sin(g + gt) * (i ? i / 2 - l : c)),
          e.arc(n - d, r - s, l, g - W, g - K),
          e.arc(n + f, r - o, l, g - K, g),
          e.arc(n + d, r + s, l, g, g + K),
          e.arc(n - f, r + o, l, g + K, g + W),
          e.closePath());
        break;
      case `rect`:
        if (!m) {
          ((c = Math.SQRT1_2 * h),
            (u = i ? i / 2 : c),
            e.rect(n - u, r - c, 2 * u, 2 * c));
          break;
        }
        g += gt;
      case `rectRot`:
        ((d = Math.cos(g) * (i ? i / 2 : h)),
          (o = Math.cos(g) * h),
          (s = Math.sin(g) * h),
          (f = Math.sin(g) * (i ? i / 2 : h)),
          e.moveTo(n - d, r - s),
          e.lineTo(n + f, r - o),
          e.lineTo(n + d, r + s),
          e.lineTo(n - f, r + o),
          e.closePath());
        break;
      case `crossRot`:
        g += gt;
      case `cross`:
        ((d = Math.cos(g) * (i ? i / 2 : h)),
          (o = Math.cos(g) * h),
          (s = Math.sin(g) * h),
          (f = Math.sin(g) * (i ? i / 2 : h)),
          e.moveTo(n - d, r - s),
          e.lineTo(n + d, r + s),
          e.moveTo(n + f, r - o),
          e.lineTo(n - f, r + o));
        break;
      case `star`:
        ((d = Math.cos(g) * (i ? i / 2 : h)),
          (o = Math.cos(g) * h),
          (s = Math.sin(g) * h),
          (f = Math.sin(g) * (i ? i / 2 : h)),
          e.moveTo(n - d, r - s),
          e.lineTo(n + d, r + s),
          e.moveTo(n + f, r - o),
          e.lineTo(n - f, r + o),
          (g += gt),
          (d = Math.cos(g) * (i ? i / 2 : h)),
          (o = Math.cos(g) * h),
          (s = Math.sin(g) * h),
          (f = Math.sin(g) * (i ? i / 2 : h)),
          e.moveTo(n - d, r - s),
          e.lineTo(n + d, r + s),
          e.moveTo(n + f, r - o),
          e.lineTo(n - f, r + o));
        break;
      case `line`:
        ((o = i ? i / 2 : Math.cos(g) * h),
          (s = Math.sin(g) * h),
          e.moveTo(n - o, r - s),
          e.lineTo(n + o, r + s));
        break;
      case `dash`:
        (e.moveTo(n, r),
          e.lineTo(n + Math.cos(g) * (i ? i / 2 : h), r + Math.sin(g) * h));
        break;
      case !1:
        e.closePath();
        break;
    }
    (e.fill(), t.borderWidth > 0 && e.stroke());
  }
}
function On(e, t, n) {
  return (
    (n ||= 0.5),
    !t ||
      (e &&
        e.x > t.left - n &&
        e.x < t.right + n &&
        e.y > t.top - n &&
        e.y < t.bottom + n)
  );
}
function kn(e, t) {
  (e.save(),
    e.beginPath(),
    e.rect(t.left, t.top, t.right - t.left, t.bottom - t.top),
    e.clip());
}
function An(e) {
  e.restore();
}
function jn(e, t, n, r, i) {
  if (!t) return e.lineTo(n.x, n.y);
  if (i === `middle`) {
    let r = (t.x + n.x) / 2;
    (e.lineTo(r, t.y), e.lineTo(r, n.y));
  } else (i === `after`) == !!r ? e.lineTo(n.x, t.y) : e.lineTo(t.x, n.y);
  e.lineTo(n.x, n.y);
}
function Mn(e, t, n, r) {
  if (!t) return e.lineTo(n.x, n.y);
  e.bezierCurveTo(
    r ? t.cp1x : t.cp2x,
    r ? t.cp1y : t.cp2y,
    r ? n.cp2x : n.cp1x,
    r ? n.cp2y : n.cp1y,
    n.x,
    n.y,
  );
}
function Nn(e, t) {
  (t.translation && e.translate(t.translation[0], t.translation[1]),
    I(t.rotation) || e.rotate(t.rotation),
    t.color && (e.fillStyle = t.color),
    t.textAlign && (e.textAlign = t.textAlign),
    t.textBaseline && (e.textBaseline = t.textBaseline));
}
function Pn(e, t, n, r, i) {
  if (i.strikethrough || i.underline) {
    let a = e.measureText(r),
      o = t - a.actualBoundingBoxLeft,
      s = t + a.actualBoundingBoxRight,
      c = n - a.actualBoundingBoxAscent,
      l = n + a.actualBoundingBoxDescent,
      u = i.strikethrough ? (c + l) / 2 : l;
    ((e.strokeStyle = e.fillStyle),
      e.beginPath(),
      (e.lineWidth = i.decorationWidth || 2),
      e.moveTo(o, u),
      e.lineTo(s, u),
      e.stroke());
  }
}
function Fn(e, t) {
  let n = e.fillStyle;
  ((e.fillStyle = t.color),
    e.fillRect(t.left, t.top, t.width, t.height),
    (e.fillStyle = n));
}
function In(e, t, n, r, i, a = {}) {
  let o = L(t) ? t : [t],
    s = a.strokeWidth > 0 && a.strokeColor !== ``,
    c,
    l;
  for (e.save(), e.font = i.string, Nn(e, a), c = 0; c < o.length; ++c)
    ((l = o[c]),
      a.backdrop && Fn(e, a.backdrop),
      s &&
        (a.strokeColor && (e.strokeStyle = a.strokeColor),
        I(a.strokeWidth) || (e.lineWidth = a.strokeWidth),
        e.strokeText(l, n, r, a.maxWidth)),
      e.fillText(l, n, r, a.maxWidth),
      Pn(e, n, r, l, a),
      (r += Number(i.lineHeight)));
  e.restore();
}
function Ln(e, t) {
  let { x: n, y: r, w: i, h: a, radius: o } = t;
  (e.arc(n + o.topLeft, r + o.topLeft, o.topLeft, 1.5 * W, W, !0),
    e.lineTo(n, r + a - o.bottomLeft),
    e.arc(n + o.bottomLeft, r + a - o.bottomLeft, o.bottomLeft, W, K, !0),
    e.lineTo(n + i - o.bottomRight, r + a),
    e.arc(
      n + i - o.bottomRight,
      r + a - o.bottomRight,
      o.bottomRight,
      K,
      0,
      !0,
    ),
    e.lineTo(n + i, r + o.topRight),
    e.arc(n + i - o.topRight, r + o.topRight, o.topRight, 0, -K, !0),
    e.lineTo(n + o.topLeft, r));
}
var Rn = /^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/,
  zn = /^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/;
function Bn(e, t) {
  let n = (`` + e).match(Rn);
  if (!n || n[1] === `normal`) return t * 1.2;
  switch (((e = +n[2]), n[3])) {
    case `px`:
      return e;
    case `%`:
      e /= 100;
      break;
  }
  return t * e;
}
var Vn = (e) => +e || 0;
function Hn(e, t) {
  let n = {},
    r = R(t),
    i = r ? Object.keys(t) : t,
    a = R(e) ? (r ? (n) => V(e[n], e[t[n]]) : (t) => e[t]) : () => e;
  for (let e of i) n[e] = Vn(a(e));
  return n;
}
function Un(e) {
  return Hn(e, { top: `y`, right: `x`, bottom: `y`, left: `x` });
}
function Wn(e) {
  return Hn(e, [`topLeft`, `topRight`, `bottomLeft`, `bottomRight`]);
}
function X(e) {
  let t = Un(e);
  return ((t.width = t.left + t.right), (t.height = t.top + t.bottom), t);
}
function Z(e, t) {
  ((e ||= {}), (t ||= Y.font));
  let n = V(e.size, t.size);
  typeof n == `string` && (n = parseInt(n, 10));
  let r = V(e.style, t.style);
  r &&
    !(`` + r).match(zn) &&
    (console.warn(`Invalid font style specified: "` + r + `"`), (r = void 0));
  let i = {
    family: V(e.family, t.family),
    lineHeight: Bn(V(e.lineHeight, t.lineHeight), n),
    size: n,
    style: r,
    weight: V(e.weight, t.weight),
    string: ``,
  };
  return ((i.string = xn(i)), i);
}
function Gn(e, t, n, r) {
  let i = !0,
    a,
    o,
    s;
  for (a = 0, o = e.length; a < o; ++a)
    if (
      ((s = e[a]),
      s !== void 0 &&
        (t !== void 0 && typeof s == `function` && ((s = s(t)), (i = !1)),
        n !== void 0 && L(s) && ((s = s[n % s.length]), (i = !1)),
        s !== void 0))
    )
      return (r && !i && (r.cacheable = !1), s);
}
function Kn(e, t, n) {
  let { min: r, max: i } = e,
    a = Xe(t, (i - r) / 2),
    o = (e, t) => (n && e === 0 ? 0 : e + t);
  return { min: o(r, -Math.abs(a)), max: o(i, a) };
}
function qn(e, t) {
  return Object.assign(Object.create(e), t);
}
function Jn(e, t = [``], n, r, i = () => e[0]) {
  let a = n || e;
  return (
    r === void 0 && (r = ur(`_fallback`, e)),
    new Proxy(
      {
        [Symbol.toStringTag]: `Object`,
        _cacheable: !0,
        _scopes: e,
        _rootScopes: a,
        _fallback: r,
        _getTarget: i,
        override: (n) => Jn([n, ...e], t, a, r),
      },
      {
        deleteProperty(t, n) {
          return (delete t[n], delete t._keys, delete e[0][n], !0);
        },
        get(n, r) {
          return $n(n, r, () => lr(r, t, e, n));
        },
        getOwnPropertyDescriptor(e, t) {
          return Reflect.getOwnPropertyDescriptor(e._scopes[0], t);
        },
        getPrototypeOf() {
          return Reflect.getPrototypeOf(e[0]);
        },
        has(e, t) {
          return dr(e).includes(t);
        },
        ownKeys(e) {
          return dr(e);
        },
        set(e, t, n) {
          let r = (e._storage ||= i());
          return ((e[t] = r[t] = n), delete e._keys, !0);
        },
      },
    )
  );
}
function Yn(e, t, n, r) {
  let i = {
    _cacheable: !1,
    _proxy: e,
    _context: t,
    _subProxy: n,
    _stack: new Set(),
    _descriptors: Xn(e, r),
    setContext: (t) => Yn(e, t, n, r),
    override: (i) => Yn(e.override(i), t, n, r),
  };
  return new Proxy(i, {
    deleteProperty(t, n) {
      return (delete t[n], delete e[n], !0);
    },
    get(e, t, n) {
      return $n(e, t, () => er(e, t, n));
    },
    getOwnPropertyDescriptor(t, n) {
      return t._descriptors.allKeys
        ? Reflect.has(e, n)
          ? { enumerable: !0, configurable: !0 }
          : void 0
        : Reflect.getOwnPropertyDescriptor(e, n);
    },
    getPrototypeOf() {
      return Reflect.getPrototypeOf(e);
    },
    has(t, n) {
      return Reflect.has(e, n);
    },
    ownKeys() {
      return Reflect.ownKeys(e);
    },
    set(t, n, r) {
      return ((e[n] = r), delete t[n], !0);
    },
  });
}
function Xn(e, t = { scriptable: !0, indexable: !0 }) {
  let {
    _scriptable: n = t.scriptable,
    _indexable: r = t.indexable,
    _allKeys: i = t.allKeys,
  } = e;
  return {
    allKeys: i,
    scriptable: n,
    indexable: r,
    isScriptable: ut(n) ? n : () => n,
    isIndexable: ut(r) ? r : () => r,
  };
}
var Zn = (e, t) => (e ? e + ct(t) : t),
  Qn = (e, t) =>
    R(t) &&
    e !== `adapters` &&
    (Object.getPrototypeOf(t) === null || t.constructor === Object);
function $n(e, t, n) {
  if (Object.prototype.hasOwnProperty.call(e, t) || t === `constructor`)
    return e[t];
  let r = n();
  return ((e[t] = r), r);
}
function er(e, t, n) {
  let { _proxy: r, _context: i, _subProxy: a, _descriptors: o } = e,
    s = r[t];
  return (
    ut(s) && o.isScriptable(t) && (s = tr(t, s, e, n)),
    L(s) && s.length && (s = nr(t, s, e, o.isIndexable)),
    Qn(t, s) && (s = Yn(s, i, a && a[t], o)),
    s
  );
}
function tr(e, t, n, r) {
  let { _proxy: i, _context: a, _subProxy: o, _stack: s } = n;
  if (s.has(e))
    throw Error(`Recursion detected: ` + Array.from(s).join(`->`) + `->` + e);
  s.add(e);
  let c = t(a, o || r);
  return (s.delete(e), Qn(e, c) && (c = or(i._scopes, i, e, c)), c);
}
function nr(e, t, n, r) {
  let { _proxy: i, _context: a, _subProxy: o, _descriptors: s } = n;
  if (a.index !== void 0 && r(e)) return t[a.index % t.length];
  if (R(t[0])) {
    let n = t,
      r = i._scopes.filter((e) => e !== n);
    t = [];
    for (let c of n) {
      let n = or(r, i, e, c);
      t.push(Yn(n, a, o && o[e], s));
    }
  }
  return t;
}
function rr(e, t, n) {
  return ut(e) ? e(t, n) : e;
}
var ir = (e, t) => (e === !0 ? t : typeof e == `string` ? st(t, e) : void 0);
function ar(e, t, n, r, i) {
  for (let a of t) {
    let t = ir(n, a);
    if (t) {
      e.add(t);
      let a = rr(t._fallback, n, i);
      if (a !== void 0 && a !== n && a !== r) return a;
    } else if (t === !1 && r !== void 0 && n !== r) return null;
  }
  return !1;
}
function or(e, t, n, r) {
  let i = t._rootScopes,
    a = rr(t._fallback, n, r),
    o = [...e, ...i],
    s = new Set();
  s.add(r);
  let c = sr(s, o, n, a || n, r);
  return c === null ||
    (a !== void 0 && a !== n && ((c = sr(s, o, a, c, r)), c === null))
    ? !1
    : Jn(Array.from(s), [``], i, a, () => cr(t, n, r));
}
function sr(e, t, n, r, i) {
  for (; n; ) n = ar(e, t, n, r, i);
  return n;
}
function cr(e, t, n) {
  let r = e._getTarget();
  t in r || (r[t] = {});
  let i = r[t];
  return L(i) && R(n) ? n : i || {};
}
function lr(e, t, n, r) {
  let i;
  for (let a of t)
    if (((i = ur(Zn(a, e), n)), i !== void 0))
      return Qn(e, i) ? or(n, r, e, i) : i;
}
function ur(e, t) {
  for (let n of t) {
    if (!n) continue;
    let t = n[e];
    if (t !== void 0) return t;
  }
}
function dr(e) {
  let t = e._keys;
  return ((t ||= e._keys = fr(e._scopes)), t);
}
function fr(e) {
  let t = new Set();
  for (let n of e)
    for (let e of Object.keys(n).filter((e) => !e.startsWith(`_`))) t.add(e);
  return Array.from(t);
}
var pr = 2 ** -52 || 1e-14,
  mr = (e, t) => t < e.length && !e[t].skip && e[t],
  hr = (e) => (e === `x` ? `y` : `x`);
function gr(e, t, n, r) {
  let i = e.skip ? t : e,
    a = t,
    o = n.skip ? t : n,
    s = jt(a, i),
    c = jt(o, a),
    l = s / (s + c),
    u = c / (s + c);
  ((l = isNaN(l) ? 0 : l), (u = isNaN(u) ? 0 : u));
  let d = r * l,
    f = r * u;
  return {
    previous: { x: a.x - d * (o.x - i.x), y: a.y - d * (o.y - i.y) },
    next: { x: a.x + f * (o.x - i.x), y: a.y + f * (o.y - i.y) },
  };
}
function _r(e, t, n) {
  let r = e.length,
    i,
    a,
    o,
    s,
    c,
    l = mr(e, 0);
  for (let u = 0; u < r - 1; ++u)
    if (((c = l), (l = mr(e, u + 1)), !(!c || !l))) {
      if (bt(t[u], 0, pr)) {
        n[u] = n[u + 1] = 0;
        continue;
      }
      ((i = n[u] / t[u]),
        (a = n[u + 1] / t[u]),
        (s = i ** 2 + a ** 2),
        !(s <= 9) &&
          ((o = 3 / Math.sqrt(s)),
          (n[u] = i * o * t[u]),
          (n[u + 1] = a * o * t[u])));
    }
}
function vr(e, t, n = `x`) {
  let r = hr(n),
    i = e.length,
    a,
    o,
    s,
    c = mr(e, 0);
  for (let l = 0; l < i; ++l) {
    if (((o = s), (s = c), (c = mr(e, l + 1)), !s)) continue;
    let i = s[n],
      u = s[r];
    (o &&
      ((a = (i - o[n]) / 3),
      (s[`cp1${n}`] = i - a),
      (s[`cp1${r}`] = u - a * t[l])),
      c &&
        ((a = (c[n] - i) / 3),
        (s[`cp2${n}`] = i + a),
        (s[`cp2${r}`] = u + a * t[l])));
  }
}
function yr(e, t = `x`) {
  let n = hr(t),
    r = e.length,
    i = Array(r).fill(0),
    a = Array(r),
    o,
    s,
    c,
    l = mr(e, 0);
  for (o = 0; o < r; ++o)
    if (((s = c), (c = l), (l = mr(e, o + 1)), c)) {
      if (l) {
        let e = l[t] - c[t];
        i[o] = e === 0 ? 0 : (l[n] - c[n]) / e;
      }
      a[o] = s
        ? l
          ? yt(i[o - 1]) === yt(i[o])
            ? (i[o - 1] + i[o]) / 2
            : 0
          : i[o - 1]
        : i[o];
    }
  (_r(e, i, a), vr(e, a, t));
}
function br(e, t, n) {
  return Math.max(Math.min(e, n), t);
}
function xr(e, t) {
  let n,
    r,
    i,
    a,
    o,
    s = On(e[0], t);
  for (n = 0, r = e.length; n < r; ++n)
    ((o = a),
      (a = s),
      (s = n < r - 1 && On(e[n + 1], t)),
      a &&
        ((i = e[n]),
        o &&
          ((i.cp1x = br(i.cp1x, t.left, t.right)),
          (i.cp1y = br(i.cp1y, t.top, t.bottom))),
        s &&
          ((i.cp2x = br(i.cp2x, t.left, t.right)),
          (i.cp2y = br(i.cp2y, t.top, t.bottom)))));
}
function Sr(e, t, n, r, i) {
  let a, o, s, c;
  if (
    (t.spanGaps && (e = e.filter((e) => !e.skip)),
    t.cubicInterpolationMode === `monotone`)
  )
    yr(e, i);
  else {
    let n = r ? e[e.length - 1] : e[0];
    for (a = 0, o = e.length; a < o; ++a)
      ((s = e[a]),
        (c = gr(n, s, e[Math.min(a + 1, o - (r ? 0 : 1)) % o], t.tension)),
        (s.cp1x = c.previous.x),
        (s.cp1y = c.previous.y),
        (s.cp2x = c.next.x),
        (s.cp2y = c.next.y),
        (n = s));
  }
  t.capBezierPoints && xr(e, n);
}
function Cr() {
  return typeof window < `u` && typeof document < `u`;
}
function wr(e) {
  let t = e.parentNode;
  return (t && t.toString() === `[object ShadowRoot]` && (t = t.host), t);
}
function Tr(e, t, n) {
  let r;
  return (
    typeof e == `string`
      ? ((r = parseInt(e, 10)),
        e.indexOf(`%`) !== -1 && (r = (r / 100) * t.parentNode[n]))
      : (r = e),
    r
  );
}
var Er = (e) => e.ownerDocument.defaultView.getComputedStyle(e, null);
function Dr(e, t) {
  return Er(e).getPropertyValue(t);
}
var Or = [`top`, `right`, `bottom`, `left`];
function kr(e, t, n) {
  let r = {};
  n = n ? `-` + n : ``;
  for (let i = 0; i < 4; i++) {
    let a = Or[i];
    r[a] = parseFloat(e[t + `-` + a + n]) || 0;
  }
  return ((r.width = r.left + r.right), (r.height = r.top + r.bottom), r);
}
var Ar = (e, t, n) => (e > 0 || t > 0) && (!n || !n.shadowRoot);
function jr(e, t) {
  let n = e.touches,
    r = n && n.length ? n[0] : e,
    { offsetX: i, offsetY: a } = r,
    o = !1,
    s,
    c;
  if (Ar(i, a, e.target)) ((s = i), (c = a));
  else {
    let e = t.getBoundingClientRect();
    ((s = r.clientX - e.left), (c = r.clientY - e.top), (o = !0));
  }
  return { x: s, y: c, box: o };
}
function Mr(e, t) {
  if (`native` in e) return e;
  let { canvas: n, currentDevicePixelRatio: r } = t,
    i = Er(n),
    a = i.boxSizing === `border-box`,
    o = kr(i, `padding`),
    s = kr(i, `border`, `width`),
    { x: c, y: l, box: u } = jr(e, n),
    d = o.left + (u && s.left),
    f = o.top + (u && s.top),
    { width: p, height: m } = t;
  return (
    a && ((p -= o.width + s.width), (m -= o.height + s.height)),
    {
      x: Math.round((((c - d) / p) * n.width) / r),
      y: Math.round((((l - f) / m) * n.height) / r),
    }
  );
}
function Nr(e, t, n) {
  let r, i;
  if (t === void 0 || n === void 0) {
    let a = e && wr(e);
    if (!a) ((t = e.clientWidth), (n = e.clientHeight));
    else {
      let e = a.getBoundingClientRect(),
        o = Er(a),
        s = kr(o, `border`, `width`),
        c = kr(o, `padding`);
      ((t = e.width - c.width - s.width),
        (n = e.height - c.height - s.height),
        (r = Tr(o.maxWidth, a, `clientWidth`)),
        (i = Tr(o.maxHeight, a, `clientHeight`)));
    }
  }
  return { width: t, height: n, maxWidth: r || mt, maxHeight: i || mt };
}
var Pr = (e) => Math.round(e * 10) / 10;
function Fr(e, t, n, r) {
  let i = Er(e),
    a = kr(i, `margin`),
    o = Tr(i.maxWidth, e, `clientWidth`) || mt,
    s = Tr(i.maxHeight, e, `clientHeight`) || mt,
    c = Nr(e, t, n),
    { width: l, height: u } = c;
  if (i.boxSizing === `content-box`) {
    let e = kr(i, `border`, `width`),
      t = kr(i, `padding`);
    ((l -= t.width + e.width), (u -= t.height + e.height));
  }
  return (
    (l = Math.max(0, l - a.width)),
    (u = Math.max(0, r ? l / r : u - a.height)),
    (l = Pr(Math.min(l, o, c.maxWidth))),
    (u = Pr(Math.min(u, s, c.maxHeight))),
    l && !u && (u = Pr(l / 2)),
    (t !== void 0 || n !== void 0) &&
      r &&
      c.height &&
      u > c.height &&
      ((u = c.height), (l = Pr(Math.floor(u * r)))),
    { width: l, height: u }
  );
}
function Ir(e, t, n) {
  let r = t || 1,
    i = Pr(e.height * r),
    a = Pr(e.width * r);
  ((e.height = Pr(e.height)), (e.width = Pr(e.width)));
  let o = e.canvas;
  return (
    o.style &&
      (n || (!o.style.height && !o.style.width)) &&
      ((o.style.height = `${e.height}px`), (o.style.width = `${e.width}px`)),
    e.currentDevicePixelRatio !== r || o.height !== i || o.width !== a
      ? ((e.currentDevicePixelRatio = r),
        (o.height = i),
        (o.width = a),
        e.ctx.setTransform(r, 0, 0, r, 0, 0),
        !0)
      : !1
  );
}
var Lr = (function () {
  let e = !1;
  try {
    let t = {
      get passive() {
        return ((e = !0), !1);
      },
    };
    Cr() &&
      (window.addEventListener(`test`, null, t),
      window.removeEventListener(`test`, null, t));
  } catch {}
  return e;
})();
function Rr(e, t) {
  let n = Dr(e, t),
    r = n && n.match(/^(\d+)(\.\d+)?px$/);
  return r ? +r[1] : void 0;
}
function zr(e, t, n, r) {
  return { x: e.x + n * (t.x - e.x), y: e.y + n * (t.y - e.y) };
}
function Br(e, t, n, r) {
  return {
    x: e.x + n * (t.x - e.x),
    y:
      r === `middle`
        ? n < 0.5
          ? e.y
          : t.y
        : r === `after`
          ? n < 1
            ? e.y
            : t.y
          : n > 0
            ? t.y
            : e.y,
  };
}
function Vr(e, t, n, r) {
  let i = { x: e.cp2x, y: e.cp2y },
    a = { x: t.cp1x, y: t.cp1y },
    o = zr(e, i, n),
    s = zr(i, a, n),
    c = zr(a, t, n);
  return zr(zr(o, s, n), zr(s, c, n), n);
}
var Hr = function (e, t) {
    return {
      x(n) {
        return e + e + t - n;
      },
      setWidth(e) {
        t = e;
      },
      textAlign(e) {
        return e === `center` ? e : e === `right` ? `left` : `right`;
      },
      xPlus(e, t) {
        return e - t;
      },
      leftForLtr(e, t) {
        return e - t;
      },
    };
  },
  Ur = function () {
    return {
      x(e) {
        return e;
      },
      setWidth(e) {},
      textAlign(e) {
        return e;
      },
      xPlus(e, t) {
        return e + t;
      },
      leftForLtr(e, t) {
        return e;
      },
    };
  };
function Wr(e, t, n) {
  return e ? Hr(t, n) : Ur();
}
function Gr(e, t) {
  let n, r;
  (t === `ltr` || t === `rtl`) &&
    ((n = e.canvas.style),
    (r = [n.getPropertyValue(`direction`), n.getPropertyPriority(`direction`)]),
    n.setProperty(`direction`, t, `important`),
    (e.prevTextDirection = r));
}
function Kr(e, t) {
  t !== void 0 &&
    (delete e.prevTextDirection,
    e.canvas.style.setProperty(`direction`, t[0], t[1]));
}
function qr(e) {
  return e === `angle`
    ? { between: Nt, compare: Mt, normalize: q }
    : { between: Ft, compare: (e, t) => e - t, normalize: (e) => e };
}
function Jr({ start: e, end: t, count: n, loop: r, style: i }) {
  return {
    start: e % n,
    end: t % n,
    loop: r && (t - e + 1) % n === 0,
    style: i,
  };
}
function Yr(e, t, n) {
  let { property: r, start: i, end: a } = n,
    { between: o, normalize: s } = qr(r),
    c = t.length,
    { start: l, end: u, loop: d } = e,
    f,
    p;
  if (d) {
    for (l += c, u += c, f = 0, p = c; f < p && o(s(t[l % c][r]), i, a); ++f)
      (l--, u--);
    ((l %= c), (u %= c));
  }
  return (u < l && (u += c), { start: l, end: u, loop: d, style: e.style });
}
function Xr(e, t, n) {
  if (!n) return [e];
  let { property: r, start: i, end: a } = n,
    o = t.length,
    { compare: s, between: c, normalize: l } = qr(r),
    { start: u, end: d, loop: f, style: p } = Yr(e, t, n),
    m = [],
    h = !1,
    g = null,
    _,
    v,
    y,
    b = () => c(i, y, _) && s(i, y) !== 0,
    x = () => s(a, _) === 0 || c(a, y, _),
    S = () => h || b(),
    C = () => !h || x();
  for (let e = u, n = u; e <= d; ++e)
    ((v = t[e % o]),
      !v.skip &&
        ((_ = l(v[r])),
        _ !== y &&
          ((h = c(_, i, a)),
          g === null && S() && (g = s(_, i) === 0 ? e : n),
          g !== null &&
            C() &&
            (m.push(Jr({ start: g, end: e, loop: f, count: o, style: p })),
            (g = null)),
          (n = e),
          (y = _))));
  return (
    g !== null && m.push(Jr({ start: g, end: d, loop: f, count: o, style: p })),
    m
  );
}
function Zr(e, t) {
  let n = [],
    r = e.segments;
  for (let i = 0; i < r.length; i++) {
    let a = Xr(r[i], e.points, t);
    a.length && n.push(...a);
  }
  return n;
}
function Qr(e, t, n, r) {
  let i = 0,
    a = t - 1;
  if (n && !r) for (; i < t && !e[i].skip; ) i++;
  for (; i < t && e[i].skip; ) i++;
  for (i %= t, n && (a += i); a > i && e[a % t].skip; ) a--;
  return ((a %= t), { start: i, end: a });
}
function $r(e, t, n, r) {
  let i = e.length,
    a = [],
    o = t,
    s = e[t],
    c;
  for (c = t + 1; c <= n; ++c) {
    let n = e[c % i];
    (n.skip || n.stop
      ? s.skip ||
        ((r = !1),
        a.push({ start: t % i, end: (c - 1) % i, loop: r }),
        (t = o = n.stop ? c : null))
      : ((o = c), s.skip && (t = c)),
      (s = n));
  }
  return (o !== null && a.push({ start: t % i, end: o % i, loop: r }), a);
}
function ei(e, t) {
  let n = e.points,
    r = e.options.spanGaps,
    i = n.length;
  if (!i) return [];
  let a = !!e._loop,
    { start: o, end: s } = Qr(n, i, a, r);
  return r === !0
    ? ti(e, [{ start: o, end: s, loop: a }], n, t)
    : ti(
        e,
        $r(n, o, s < o ? s + i : s, !!e._fullLoop && o === 0 && s === i - 1),
        n,
        t,
      );
}
function ti(e, t, n, r) {
  return !r || !r.setContext || !n ? t : ni(e, t, n, r);
}
function ni(e, t, n, r) {
  let i = e._chart.getContext(),
    a = ri(e.options),
    {
      _datasetIndex: o,
      options: { spanGaps: s },
    } = e,
    c = n.length,
    l = [],
    u = a,
    d = t[0].start,
    f = d;
  function p(e, t, r, i) {
    let a = s ? -1 : 1;
    if (e !== t) {
      for (e += c; n[e % c].skip; ) e -= a;
      for (; n[t % c].skip; ) t += a;
      e % c !== t % c &&
        (l.push({ start: e % c, end: t % c, loop: r, style: i }),
        (u = i),
        (d = t % c));
    }
  }
  for (let e of t) {
    d = s ? d : e.start;
    let t = n[d % c],
      a;
    for (f = d + 1; f <= e.end; f++) {
      let s = n[f % c];
      ((a = ri(
        r.setContext(
          qn(i, {
            type: `segment`,
            p0: t,
            p1: s,
            p0DataIndex: (f - 1) % c,
            p1DataIndex: f % c,
            datasetIndex: o,
          }),
        ),
      )),
        ii(a, u) && p(d, f - 1, e.loop, u),
        (t = s),
        (u = a));
    }
    d < f - 1 && p(d, f - 1, e.loop, u);
  }
  return l;
}
function ri(e) {
  return {
    backgroundColor: e.backgroundColor,
    borderCapStyle: e.borderCapStyle,
    borderDash: e.borderDash,
    borderDashOffset: e.borderDashOffset,
    borderJoinStyle: e.borderJoinStyle,
    borderWidth: e.borderWidth,
    borderColor: e.borderColor,
  };
}
function ii(e, t) {
  if (!t) return !1;
  let n = [],
    r = function (e, t) {
      return nn(t) ? (n.includes(t) || n.push(t), n.indexOf(t)) : t;
    };
  return JSON.stringify(e, r) !== JSON.stringify(t, r);
}
function ai(e, t, n) {
  return e.options.clip ? e[n] : t[n];
}
function oi(e, t) {
  let { xScale: n, yScale: r } = e;
  return n && r
    ? {
        left: ai(n, t, `left`),
        right: ai(n, t, `right`),
        top: ai(r, t, `top`),
        bottom: ai(r, t, `bottom`),
      }
    : t;
}
function si(e, t) {
  let n = t._clip;
  if (n.disabled) return !1;
  let r = oi(t, e.chartArea);
  return {
    left: n.left === !1 ? 0 : r.left - (n.left === !0 ? 0 : n.left),
    right: n.right === !1 ? e.width : r.right + (n.right === !0 ? 0 : n.right),
    top: n.top === !1 ? 0 : r.top - (n.top === !0 ? 0 : n.top),
    bottom:
      n.bottom === !1 ? e.height : r.bottom + (n.bottom === !0 ? 0 : n.bottom),
  };
}
var ci = new (class {
    constructor() {
      ((this._request = null),
        (this._charts = new Map()),
        (this._running = !1),
        (this._lastDate = void 0));
    }
    _notify(e, t, n, r) {
      let i = t.listeners[r],
        a = t.duration;
      i.forEach((r) =>
        r({
          chart: e,
          initial: t.initial,
          numSteps: a,
          currentStep: Math.min(n - t.start, a),
        }),
      );
    }
    _refresh() {
      this._request ||=
        ((this._running = !0),
        Wt.call(window, () => {
          (this._update(),
            (this._request = null),
            this._running && this._refresh());
        }));
    }
    _update(e = Date.now()) {
      let t = 0;
      (this._charts.forEach((n, r) => {
        if (!n.running || !n.items.length) return;
        let i = n.items,
          a = i.length - 1,
          o = !1,
          s;
        for (; a >= 0; --a)
          ((s = i[a]),
            s._active
              ? (s._total > n.duration && (n.duration = s._total),
                s.tick(e),
                (o = !0))
              : ((i[a] = i[i.length - 1]), i.pop()));
        (o && (r.draw(), this._notify(r, n, e, `progress`)),
          i.length ||
            ((n.running = !1),
            this._notify(r, n, e, `complete`),
            (n.initial = !1)),
          (t += i.length));
      }),
        (this._lastDate = e),
        t === 0 && (this._running = !1));
    }
    _getAnims(e) {
      let t = this._charts,
        n = t.get(e);
      return (
        n ||
          ((n = {
            running: !1,
            initial: !0,
            items: [],
            listeners: { complete: [], progress: [] },
          }),
          t.set(e, n)),
        n
      );
    }
    listen(e, t, n) {
      this._getAnims(e).listeners[t].push(n);
    }
    add(e, t) {
      !t || !t.length || this._getAnims(e).items.push(...t);
    }
    has(e) {
      return this._getAnims(e).items.length > 0;
    }
    start(e) {
      let t = this._charts.get(e);
      t &&
        ((t.running = !0),
        (t.start = Date.now()),
        (t.duration = t.items.reduce((e, t) => Math.max(e, t._duration), 0)),
        this._refresh());
    }
    running(e) {
      if (!this._running) return !1;
      let t = this._charts.get(e);
      return !(!t || !t.running || !t.items.length);
    }
    stop(e) {
      let t = this._charts.get(e);
      if (!t || !t.items.length) return;
      let n = t.items,
        r = n.length - 1;
      for (; r >= 0; --r) n[r].cancel();
      ((t.items = []), this._notify(e, t, Date.now(), `complete`));
    }
    remove(e) {
      return this._charts.delete(e);
    }
  })(),
  li = `transparent`,
  ui = {
    boolean(e, t, n) {
      return n > 0.5 ? t : e;
    },
    color(e, t, n) {
      let r = rn(e || li),
        i = r.valid && rn(t || li);
      return i && i.valid ? i.mix(r, n).hexString() : t;
    },
    number(e, t, n) {
      return e + (t - e) * n;
    },
  },
  di = class {
    constructor(e, t, n, r) {
      let i = t[n];
      r = Gn([e.to, r, i, e.from]);
      let a = Gn([e.from, i, r]);
      ((this._active = !0),
        (this._fn = e.fn || ui[e.type || typeof a]),
        (this._easing = tn[e.easing] || tn.linear),
        (this._start = Math.floor(Date.now() + (e.delay || 0))),
        (this._duration = this._total = Math.floor(e.duration)),
        (this._loop = !!e.loop),
        (this._target = t),
        (this._prop = n),
        (this._from = a),
        (this._to = r),
        (this._promises = void 0));
    }
    active() {
      return this._active;
    }
    update(e, t, n) {
      if (this._active) {
        this._notify(!1);
        let r = this._target[this._prop],
          i = n - this._start,
          a = this._duration - i;
        ((this._start = n),
          (this._duration = Math.floor(Math.max(a, e.duration))),
          (this._total += i),
          (this._loop = !!e.loop),
          (this._to = Gn([e.to, t, r, e.from])),
          (this._from = Gn([e.from, r, t])));
      }
    }
    cancel() {
      this._active &&
        (this.tick(Date.now()), (this._active = !1), this._notify(!1));
    }
    tick(e) {
      let t = e - this._start,
        n = this._duration,
        r = this._prop,
        i = this._from,
        a = this._loop,
        o = this._to,
        s;
      if (((this._active = i !== o && (a || t < n)), !this._active)) {
        ((this._target[r] = o), this._notify(!0));
        return;
      }
      if (t < 0) {
        this._target[r] = i;
        return;
      }
      ((s = (t / n) % 2),
        (s = a && s > 1 ? 2 - s : s),
        (s = this._easing(Math.min(1, Math.max(0, s)))),
        (this._target[r] = this._fn(i, o, s)));
    }
    wait() {
      let e = (this._promises ||= []);
      return new Promise((t, n) => {
        e.push({ res: t, rej: n });
      });
    }
    _notify(e) {
      let t = e ? `res` : `rej`,
        n = this._promises || [];
      for (let e = 0; e < n.length; e++) n[e][t]();
    }
  },
  fi = class {
    constructor(e, t) {
      ((this._chart = e), (this._properties = new Map()), this.configure(t));
    }
    configure(e) {
      if (!R(e)) return;
      let t = Object.keys(Y.animation),
        n = this._properties;
      Object.getOwnPropertyNames(e).forEach((r) => {
        let i = e[r];
        if (!R(i)) return;
        let a = {};
        for (let e of t) a[e] = i[e];
        ((L(i.properties) && i.properties) || [r]).forEach((e) => {
          (e === r || !n.has(e)) && n.set(e, a);
        });
      });
    }
    _animateOptions(e, t) {
      let n = t.options,
        r = mi(e, n);
      if (!r) return [];
      let i = this._createAnimations(r, n);
      return (
        n.$shared &&
          pi(e.options.$animations, n).then(
            () => {
              e.options = n;
            },
            () => {},
          ),
        i
      );
    }
    _createAnimations(e, t) {
      let n = this._properties,
        r = [],
        i = (e.$animations ||= {}),
        a = Object.keys(t),
        o = Date.now(),
        s;
      for (s = a.length - 1; s >= 0; --s) {
        let c = a[s];
        if (c.charAt(0) === `$`) continue;
        if (c === `options`) {
          r.push(...this._animateOptions(e, t));
          continue;
        }
        let l = t[c],
          u = i[c],
          d = n.get(c);
        if (u)
          if (d && u.active()) {
            u.update(d, l, o);
            continue;
          } else u.cancel();
        if (!d || !d.duration) {
          e[c] = l;
          continue;
        }
        ((i[c] = u = new di(d, e, c, l)), r.push(u));
      }
      return r;
    }
    update(e, t) {
      if (this._properties.size === 0) {
        Object.assign(e, t);
        return;
      }
      let n = this._createAnimations(e, t);
      if (n.length) return (ci.add(this._chart, n), !0);
    }
  };
function pi(e, t) {
  let n = [],
    r = Object.keys(t);
  for (let t = 0; t < r.length; t++) {
    let i = e[r[t]];
    i && i.active() && n.push(i.wait());
  }
  return Promise.all(n);
}
function mi(e, t) {
  if (!t) return;
  let n = e.options;
  if (!n) {
    e.options = t;
    return;
  }
  return (
    n.$shared &&
      (e.options = n = Object.assign({}, n, { $shared: !1, $animations: {} })),
    n
  );
}
function hi(e, t) {
  let n = (e && e.options) || {},
    r = n.reverse,
    i = n.min === void 0 ? t : 0,
    a = n.max === void 0 ? t : 0;
  return { start: r ? a : i, end: r ? i : a };
}
function gi(e, t, n) {
  if (n === !1) return !1;
  let r = hi(e, n),
    i = hi(t, n);
  return { top: i.end, right: r.end, bottom: i.start, left: r.start };
}
function _i(e) {
  let t, n, r, i;
  return (
    R(e)
      ? ((t = e.top), (n = e.right), (r = e.bottom), (i = e.left))
      : (t = n = r = i = e),
    { top: t, right: n, bottom: r, left: i, disabled: e === !1 }
  );
}
function vi(e, t) {
  let n = [],
    r = e._getSortedDatasetMetas(t),
    i,
    a;
  for (i = 0, a = r.length; i < a; ++i) n.push(r[i].index);
  return n;
}
function yi(e, t, n, r = {}) {
  let i = e.keys,
    a = r.mode === `single`,
    o,
    s,
    c,
    l;
  if (t === null) return;
  let u = !1;
  for (o = 0, s = i.length; o < s; ++o) {
    if (((c = +i[o]), c === n)) {
      if (((u = !0), r.all)) continue;
      break;
    }
    ((l = e.values[c]), z(l) && (a || t === 0 || yt(t) === yt(l)) && (t += l));
  }
  return !u && !r.all ? 0 : t;
}
function bi(e, t) {
  let { iScale: n, vScale: r } = t,
    i = n.axis === `x` ? `x` : `y`,
    a = r.axis === `x` ? `x` : `y`,
    o = Object.keys(e),
    s = Array(o.length),
    c,
    l,
    u;
  for (c = 0, l = o.length; c < l; ++c)
    ((u = o[c]), (s[c] = { [i]: u, [a]: e[u] }));
  return s;
}
function xi(e, t) {
  let n = e && e.options.stacked;
  return n || (n === void 0 && t.stack !== void 0);
}
function Si(e, t, n) {
  return `${e.id}.${t.id}.${n.stack || n.type}`;
}
function Ci(e) {
  let { min: t, max: n, minDefined: r, maxDefined: i } = e.getUserBounds();
  return { min: r ? t : -1 / 0, max: i ? n : 1 / 0 };
}
function wi(e, t, n) {
  let r = e[t] || (e[t] = {});
  return r[n] || (r[n] = {});
}
function Ti(e, t, n, r) {
  for (let i of t.getMatchingVisibleMetas(r).reverse()) {
    let t = e[i.index];
    if ((n && t > 0) || (!n && t < 0)) return i.index;
  }
  return null;
}
function Ei(e, t) {
  let { chart: n, _cachedMeta: r } = e,
    i = (n._stacks ||= {}),
    { iScale: a, vScale: o, index: s } = r,
    c = a.axis,
    l = o.axis,
    u = Si(a, o, r),
    d = t.length,
    f;
  for (let e = 0; e < d; ++e) {
    let n = t[e],
      { [c]: a, [l]: d } = n,
      p = (n._stacks ||= {});
    ((f = p[l] = wi(i, u, a)),
      (f[s] = d),
      (f._top = Ti(f, o, !0, r.type)),
      (f._bottom = Ti(f, o, !1, r.type)));
    let m = (f._visualValues ||= {});
    m[s] = d;
  }
}
function Di(e, t) {
  let n = e.scales;
  return Object.keys(n)
    .filter((e) => n[e].axis === t)
    .shift();
}
function Oi(e, t) {
  return qn(e, {
    active: !1,
    dataset: void 0,
    datasetIndex: t,
    index: t,
    mode: `default`,
    type: `dataset`,
  });
}
function ki(e, t, n) {
  return qn(e, {
    active: !1,
    dataIndex: t,
    parsed: void 0,
    raw: void 0,
    element: n,
    index: t,
    mode: `default`,
    type: `data`,
  });
}
function Ai(e, t) {
  let n = e.controller.index,
    r = e.vScale && e.vScale.axis;
  if (r) {
    t ||= e._parsed;
    for (let e of t) {
      let t = e._stacks;
      if (!t || t[r] === void 0 || t[r][n] === void 0) return;
      (delete t[r][n],
        t[r]._visualValues !== void 0 &&
          t[r]._visualValues[n] !== void 0 &&
          delete t[r]._visualValues[n]);
    }
  }
}
var ji = (e) => e === `reset` || e === `none`,
  Mi = (e, t) => (t ? e : Object.assign({}, e)),
  Ni = (e, t, n) =>
    e && !t.hidden && t._stacked && { keys: vi(n, !0), values: null },
  Pi = class {
    static defaults = {};
    static datasetElementType = null;
    static dataElementType = null;
    constructor(e, t) {
      ((this.chart = e),
        (this._ctx = e.ctx),
        (this.index = t),
        (this._cachedDataOpts = {}),
        (this._cachedMeta = this.getMeta()),
        (this._type = this._cachedMeta.type),
        (this.options = void 0),
        (this._parsing = !1),
        (this._data = void 0),
        (this._objectData = void 0),
        (this._sharedOptions = void 0),
        (this._drawStart = void 0),
        (this._drawCount = void 0),
        (this.enableOptionSharing = !1),
        (this.supportsDecimation = !1),
        (this.$context = void 0),
        (this._syncList = []),
        (this.datasetElementType = new.target.datasetElementType),
        (this.dataElementType = new.target.dataElementType),
        this.initialize());
    }
    initialize() {
      let e = this._cachedMeta;
      (this.configure(),
        this.linkScales(),
        (e._stacked = xi(e.vScale, e)),
        this.addElements(),
        this.options.fill &&
          !this.chart.isPluginEnabled(`filler`) &&
          console.warn(
            `Tried to use the 'fill' option without the 'Filler' plugin enabled. Please import and register the 'Filler' plugin and make sure it is not disabled in the options`,
          ));
    }
    updateIndex(e) {
      (this.index !== e && Ai(this._cachedMeta), (this.index = e));
    }
    linkScales() {
      let e = this.chart,
        t = this._cachedMeta,
        n = this.getDataset(),
        r = (e, t, n, r) => (e === `x` ? t : e === `r` ? r : n),
        i = (t.xAxisID = V(n.xAxisID, Di(e, `x`))),
        a = (t.yAxisID = V(n.yAxisID, Di(e, `y`))),
        o = (t.rAxisID = V(n.rAxisID, Di(e, `r`))),
        s = t.indexAxis,
        c = (t.iAxisID = r(s, i, a, o)),
        l = (t.vAxisID = r(s, a, i, o));
      ((t.xScale = this.getScaleForId(i)),
        (t.yScale = this.getScaleForId(a)),
        (t.rScale = this.getScaleForId(o)),
        (t.iScale = this.getScaleForId(c)),
        (t.vScale = this.getScaleForId(l)));
    }
    getDataset() {
      return this.chart.data.datasets[this.index];
    }
    getMeta() {
      return this.chart.getDatasetMeta(this.index);
    }
    getScaleForId(e) {
      return this.chart.scales[e];
    }
    _getOtherScale(e) {
      let t = this._cachedMeta;
      return e === t.iScale ? t.vScale : t.iScale;
    }
    reset() {
      this._update(`reset`);
    }
    _destroy() {
      let e = this._cachedMeta;
      (this._data && Ht(this._data, this), e._stacked && Ai(e));
    }
    _dataCheck() {
      let e = this.getDataset(),
        t = (e.data ||= []),
        n = this._data;
      if (R(t)) {
        let e = this._cachedMeta;
        this._data = bi(t, e);
      } else if (n !== t) {
        if (n) {
          Ht(n, this);
          let e = this._cachedMeta;
          (Ai(e), (e._parsed = []));
        }
        (t && Object.isExtensible(t) && Vt(t, this),
          (this._syncList = []),
          (this._data = t));
      }
    }
    addElements() {
      let e = this._cachedMeta;
      (this._dataCheck(),
        this.datasetElementType && (e.dataset = new this.datasetElementType()));
    }
    buildOrUpdateElements(e) {
      let t = this._cachedMeta,
        n = this.getDataset(),
        r = !1;
      this._dataCheck();
      let i = t._stacked;
      ((t._stacked = xi(t.vScale, t)),
        t.stack !== n.stack && ((r = !0), Ai(t), (t.stack = n.stack)),
        this._resyncElements(e),
        (r || i !== t._stacked) &&
          (Ei(this, t._parsed), (t._stacked = xi(t.vScale, t))));
    }
    configure() {
      let e = this.chart.config,
        t = e.datasetScopeKeys(this._type),
        n = e.getOptionScopes(this.getDataset(), t, !0);
      ((this.options = e.createResolver(n, this.getContext())),
        (this._parsing = this.options.parsing),
        (this._cachedDataOpts = {}));
    }
    parse(e, t) {
      let { _cachedMeta: n, _data: r } = this,
        { iScale: i, _stacked: a } = n,
        o = i.axis,
        s = e === 0 && t === r.length ? !0 : n._sorted,
        c = e > 0 && n._parsed[e - 1],
        l,
        u,
        d;
      if (this._parsing === !1) ((n._parsed = r), (n._sorted = !0), (d = r));
      else {
        d = L(r[e])
          ? this.parseArrayData(n, r, e, t)
          : R(r[e])
            ? this.parseObjectData(n, r, e, t)
            : this.parsePrimitiveData(n, r, e, t);
        let i = () => u[o] === null || (c && u[o] < c[o]);
        for (l = 0; l < t; ++l)
          ((n._parsed[l + e] = u = d[l]), s && (i() && (s = !1), (c = u)));
        n._sorted = s;
      }
      a && Ei(this, d);
    }
    parsePrimitiveData(e, t, n, r) {
      let { iScale: i, vScale: a } = e,
        o = i.axis,
        s = a.axis,
        c = i.getLabels(),
        l = i === a,
        u = Array(r),
        d,
        f,
        p;
      for (d = 0, f = r; d < f; ++d)
        ((p = d + n),
          (u[d] = { [o]: l || i.parse(c[p], p), [s]: a.parse(t[p], p) }));
      return u;
    }
    parseArrayData(e, t, n, r) {
      let { xScale: i, yScale: a } = e,
        o = Array(r),
        s,
        c,
        l,
        u;
      for (s = 0, c = r; s < c; ++s)
        ((l = s + n),
          (u = t[l]),
          (o[s] = { x: i.parse(u[0], l), y: a.parse(u[1], l) }));
      return o;
    }
    parseObjectData(e, t, n, r) {
      let { xScale: i, yScale: a } = e,
        { xAxisKey: o = `x`, yAxisKey: s = `y` } = this._parsing,
        c = Array(r),
        l,
        u,
        d,
        f;
      for (l = 0, u = r; l < u; ++l)
        ((d = l + n),
          (f = t[d]),
          (c[l] = { x: i.parse(st(f, o), d), y: a.parse(st(f, s), d) }));
      return c;
    }
    getParsed(e) {
      return this._cachedMeta._parsed[e];
    }
    getDataElement(e) {
      return this._cachedMeta.data[e];
    }
    applyStack(e, t, n) {
      let r = this.chart,
        i = this._cachedMeta,
        a = t[e.axis];
      return yi(
        { keys: vi(r, !0), values: t._stacks[e.axis]._visualValues },
        a,
        i.index,
        { mode: n },
      );
    }
    updateRangeFromParsed(e, t, n, r) {
      let i = n[t.axis],
        a = i === null ? NaN : i,
        o = r && n._stacks[t.axis];
      (r && o && ((r.values = o), (a = yi(r, i, this._cachedMeta.index))),
        (e.min = Math.min(e.min, a)),
        (e.max = Math.max(e.max, a)));
    }
    getMinMax(e, t) {
      let n = this._cachedMeta,
        r = n._parsed,
        i = n._sorted && e === n.iScale,
        a = r.length,
        o = this._getOtherScale(e),
        s = Ni(t, n, this.chart),
        c = { min: 1 / 0, max: -1 / 0 },
        { min: l, max: u } = Ci(o),
        d,
        f;
      function p() {
        f = r[d];
        let t = f[o.axis];
        return !z(f[e.axis]) || l > t || u < t;
      }
      for (
        d = 0;
        d < a && !(!p() && (this.updateRangeFromParsed(c, e, f, s), i));
        ++d
      );
      if (i) {
        for (d = a - 1; d >= 0; --d)
          if (!p()) {
            this.updateRangeFromParsed(c, e, f, s);
            break;
          }
      }
      return c;
    }
    getAllParsedValues(e) {
      let t = this._cachedMeta._parsed,
        n = [],
        r,
        i,
        a;
      for (r = 0, i = t.length; r < i; ++r)
        ((a = t[r][e.axis]), z(a) && n.push(a));
      return n;
    }
    getMaxOverflow() {
      return !1;
    }
    getLabelAndValue(e) {
      let t = this._cachedMeta,
        n = t.iScale,
        r = t.vScale,
        i = this.getParsed(e);
      return {
        label: n ? `` + n.getLabelForValue(i[n.axis]) : ``,
        value: r ? `` + r.getLabelForValue(i[r.axis]) : ``,
      };
    }
    _update(e) {
      let t = this._cachedMeta;
      (this.update(e || `default`),
        (t._clip = _i(
          V(this.options.clip, gi(t.xScale, t.yScale, this.getMaxOverflow())),
        )));
    }
    update(e) {}
    draw() {
      let e = this._ctx,
        t = this.chart,
        n = this._cachedMeta,
        r = n.data || [],
        i = t.chartArea,
        a = [],
        o = this._drawStart || 0,
        s = this._drawCount || r.length - o,
        c = this.options.drawActiveElementsOnTop,
        l;
      for (n.dataset && n.dataset.draw(e, i, o, s), l = o; l < o + s; ++l) {
        let t = r[l];
        t.hidden || (t.active && c ? a.push(t) : t.draw(e, i));
      }
      for (l = 0; l < a.length; ++l) a[l].draw(e, i);
    }
    getStyle(e, t) {
      let n = t ? `active` : `default`;
      return e === void 0 && this._cachedMeta.dataset
        ? this.resolveDatasetElementOptions(n)
        : this.resolveDataElementOptions(e || 0, n);
    }
    getContext(e, t, n) {
      let r = this.getDataset(),
        i;
      if (e >= 0 && e < this._cachedMeta.data.length) {
        let t = this._cachedMeta.data[e];
        ((i = t.$context ||= ki(this.getContext(), e, t)),
          (i.parsed = this.getParsed(e)),
          (i.raw = r.data[e]),
          (i.index = i.dataIndex = e));
      } else
        ((i = this.$context ||= Oi(this.chart.getContext(), this.index)),
          (i.dataset = r),
          (i.index = i.datasetIndex = this.index));
      return ((i.active = !!t), (i.mode = n), i);
    }
    resolveDatasetElementOptions(e) {
      return this._resolveElementOptions(this.datasetElementType.id, e);
    }
    resolveDataElementOptions(e, t) {
      return this._resolveElementOptions(this.dataElementType.id, t, e);
    }
    _resolveElementOptions(e, t = `default`, n) {
      let r = t === `active`,
        i = this._cachedDataOpts,
        a = e + `-` + t,
        o = i[a],
        s = this.enableOptionSharing && lt(n);
      if (o) return Mi(o, s);
      let c = this.chart.config,
        l = c.datasetElementScopeKeys(this._type, e),
        u = r ? [`${e}Hover`, `hover`, e, ``] : [e, ``],
        d = c.getOptionScopes(this.getDataset(), l),
        f = Object.keys(Y.elements[e]),
        p = c.resolveNamedOptions(d, f, () => this.getContext(n, r, t), u);
      return (
        p.$shared && ((p.$shared = s), (i[a] = Object.freeze(Mi(p, s)))),
        p
      );
    }
    _resolveAnimations(e, t, n) {
      let r = this.chart,
        i = this._cachedDataOpts,
        a = `animation-${t}`,
        o = i[a];
      if (o) return o;
      let s;
      if (r.options.animation !== !1) {
        let r = this.chart.config,
          i = r.datasetAnimationScopeKeys(this._type, t),
          a = r.getOptionScopes(this.getDataset(), i);
        s = r.createResolver(a, this.getContext(e, n, t));
      }
      let c = new fi(r, s && s.animations);
      return (s && s._cacheable && (i[a] = Object.freeze(c)), c);
    }
    getSharedOptions(e) {
      if (e.$shared) return (this._sharedOptions ||= Object.assign({}, e));
    }
    includeOptions(e, t) {
      return !t || ji(e) || this.chart._animationsDisabled;
    }
    _getSharedOptions(e, t) {
      let n = this.resolveDataElementOptions(e, t),
        r = this._sharedOptions,
        i = this.getSharedOptions(n),
        a = this.includeOptions(t, i) || i !== r;
      return (
        this.updateSharedOptions(i, t, n),
        { sharedOptions: i, includeOptions: a }
      );
    }
    updateElement(e, t, n, r) {
      ji(r) ? Object.assign(e, n) : this._resolveAnimations(t, r).update(e, n);
    }
    updateSharedOptions(e, t, n) {
      e && !ji(t) && this._resolveAnimations(void 0, t).update(e, n);
    }
    _setStyle(e, t, n, r) {
      e.active = r;
      let i = this.getStyle(t, r);
      this._resolveAnimations(t, n, r).update(e, {
        options: (!r && this.getSharedOptions(i)) || i,
      });
    }
    removeHoverStyle(e, t, n) {
      this._setStyle(e, n, `active`, !1);
    }
    setHoverStyle(e, t, n) {
      this._setStyle(e, n, `active`, !0);
    }
    _removeDatasetHoverStyle() {
      let e = this._cachedMeta.dataset;
      e && this._setStyle(e, void 0, `active`, !1);
    }
    _setDatasetHoverStyle() {
      let e = this._cachedMeta.dataset;
      e && this._setStyle(e, void 0, `active`, !0);
    }
    _resyncElements(e) {
      let t = this._data,
        n = this._cachedMeta.data;
      for (let [e, t, n] of this._syncList) this[e](t, n);
      this._syncList = [];
      let r = n.length,
        i = t.length,
        a = Math.min(i, r);
      (a && this.parse(0, a),
        i > r
          ? this._insertElements(r, i - r, e)
          : i < r && this._removeElements(i, r - i));
    }
    _insertElements(e, t, n = !0) {
      let r = this._cachedMeta,
        i = r.data,
        a = e + t,
        o,
        s = (e) => {
          for (e.length += t, o = e.length - 1; o >= a; o--) e[o] = e[o - t];
        };
      for (s(i), o = e; o < a; ++o) i[o] = new this.dataElementType();
      (this._parsing && s(r._parsed),
        this.parse(e, t),
        n && this.updateElements(i, e, t, `reset`));
    }
    updateElements(e, t, n, r) {}
    _removeElements(e, t) {
      let n = this._cachedMeta;
      if (this._parsing) {
        let r = n._parsed.splice(e, t);
        n._stacked && Ai(n, r);
      }
      n.data.splice(e, t);
    }
    _sync(e) {
      if (this._parsing) this._syncList.push(e);
      else {
        let [t, n, r] = e;
        this[t](n, r);
      }
      this.chart._dataChanges.push([this.index, ...e]);
    }
    _onDataPush() {
      let e = arguments.length;
      this._sync([`_insertElements`, this.getDataset().data.length - e, e]);
    }
    _onDataPop() {
      this._sync([`_removeElements`, this._cachedMeta.data.length - 1, 1]);
    }
    _onDataShift() {
      this._sync([`_removeElements`, 0, 1]);
    }
    _onDataSplice(e, t) {
      t && this._sync([`_removeElements`, e, t]);
      let n = arguments.length - 2;
      n && this._sync([`_insertElements`, e, n]);
    }
    _onDataUnshift() {
      this._sync([`_insertElements`, 0, arguments.length]);
    }
  };
function Fi(e, t) {
  if (!e._cache.$bar) {
    let n = e.getMatchingVisibleMetas(t),
      r = [];
    for (let t = 0, i = n.length; t < i; t++)
      r = r.concat(n[t].controller.getAllParsedValues(e));
    e._cache.$bar = Ut(r.sort((e, t) => e - t));
  }
  return e._cache.$bar;
}
function Ii(e) {
  let t = e.iScale,
    n = Fi(t, e.type),
    r = t._length,
    i,
    a,
    o,
    s,
    c = () => {
      o === 32767 ||
        o === -32768 ||
        (lt(s) && (r = Math.min(r, Math.abs(o - s) || r)), (s = o));
    };
  for (i = 0, a = n.length; i < a; ++i) ((o = t.getPixelForValue(n[i])), c());
  for (s = void 0, i = 0, a = t.ticks.length; i < a; ++i)
    ((o = t.getPixelForTick(i)), c());
  return r;
}
function Li(e, t, n, r) {
  let i = n.barThickness,
    a,
    o;
  return (
    I(i)
      ? ((a = t.min * n.categoryPercentage), (o = n.barPercentage))
      : ((a = i * r), (o = 1)),
    { chunk: a / r, ratio: o, start: t.pixels[e] - a / 2 }
  );
}
function Ri(e, t, n, r) {
  let i = t.pixels,
    a = i[e],
    o = e > 0 ? i[e - 1] : null,
    s = e < i.length - 1 ? i[e + 1] : null,
    c = n.categoryPercentage;
  (o === null && (o = a - (s === null ? t.end - t.start : s - a)),
    s === null && (s = a + a - o));
  let l = a - ((a - Math.min(o, s)) / 2) * c;
  return {
    chunk: ((Math.abs(s - o) / 2) * c) / r,
    ratio: n.barPercentage,
    start: l,
  };
}
function zi(e, t, n, r) {
  let i = n.parse(e[0], r),
    a = n.parse(e[1], r),
    o = Math.min(i, a),
    s = Math.max(i, a),
    c = o,
    l = s;
  (Math.abs(o) > Math.abs(s) && ((c = s), (l = o)),
    (t[n.axis] = l),
    (t._custom = { barStart: c, barEnd: l, start: i, end: a, min: o, max: s }));
}
function Bi(e, t, n, r) {
  return (L(e) ? zi(e, t, n, r) : (t[n.axis] = n.parse(e, r)), t);
}
function Vi(e, t, n, r) {
  let i = e.iScale,
    a = e.vScale,
    o = i.getLabels(),
    s = i === a,
    c = [],
    l,
    u,
    d,
    f;
  for (l = n, u = n + r; l < u; ++l)
    ((f = t[l]),
      (d = {}),
      (d[i.axis] = s || i.parse(o[l], l)),
      c.push(Bi(f, d, a, l)));
  return c;
}
function Hi(e) {
  return e && e.barStart !== void 0 && e.barEnd !== void 0;
}
function Ui(e, t, n) {
  return e === 0 ? (t.isHorizontal() ? 1 : -1) * (t.min >= n ? 1 : -1) : yt(e);
}
function Wi(e) {
  let t, n, r, i, a;
  return (
    e.horizontal
      ? ((t = e.base > e.x), (n = `left`), (r = `right`))
      : ((t = e.base < e.y), (n = `bottom`), (r = `top`)),
    t ? ((i = `end`), (a = `start`)) : ((i = `start`), (a = `end`)),
    { start: n, end: r, reverse: t, top: i, bottom: a }
  );
}
function Gi(e, t, n, r) {
  let i = t.borderSkipped,
    a = {};
  if (!i) {
    e.borderSkipped = a;
    return;
  }
  if (i === !0) {
    e.borderSkipped = { top: !0, right: !0, bottom: !0, left: !0 };
    return;
  }
  let { start: o, end: s, reverse: c, top: l, bottom: u } = Wi(e);
  (i === `middle` &&
    n &&
    ((e.enableBorderRadius = !0),
    (n._top || 0) === r
      ? (i = l)
      : (n._bottom || 0) === r
        ? (i = u)
        : ((a[Ki(u, o, s, c)] = !0), (i = l))),
    (a[Ki(i, o, s, c)] = !0),
    (e.borderSkipped = a));
}
function Ki(e, t, n, r) {
  return (r ? ((e = qi(e, t, n)), (e = Ji(e, n, t))) : (e = Ji(e, t, n)), e);
}
function qi(e, t, n) {
  return e === t ? n : e === n ? t : e;
}
function Ji(e, t, n) {
  return e === `start` ? t : e === `end` ? n : e;
}
function Yi(e, { inflateAmount: t }, n) {
  e.inflateAmount = t === `auto` ? (n === 1 ? 0.33 : 0) : t;
}
var Xi = class extends Pi {
    static id = `bar`;
    static defaults = {
      datasetElementType: !1,
      dataElementType: `bar`,
      categoryPercentage: 0.8,
      barPercentage: 0.9,
      grouped: !0,
      animations: {
        numbers: {
          type: `number`,
          properties: [`x`, `y`, `base`, `width`, `height`],
        },
      },
    };
    static overrides = {
      scales: {
        _index_: { type: `category`, offset: !0, grid: { offset: !0 } },
        _value_: { type: `linear`, beginAtZero: !0 },
      },
    };
    parsePrimitiveData(e, t, n, r) {
      return Vi(e, t, n, r);
    }
    parseArrayData(e, t, n, r) {
      return Vi(e, t, n, r);
    }
    parseObjectData(e, t, n, r) {
      let { iScale: i, vScale: a } = e,
        { xAxisKey: o = `x`, yAxisKey: s = `y` } = this._parsing,
        c = i.axis === `x` ? o : s,
        l = a.axis === `x` ? o : s,
        u = [],
        d,
        f,
        p,
        m;
      for (d = n, f = n + r; d < f; ++d)
        ((m = t[d]),
          (p = {}),
          (p[i.axis] = i.parse(st(m, c), d)),
          u.push(Bi(st(m, l), p, a, d)));
      return u;
    }
    updateRangeFromParsed(e, t, n, r) {
      super.updateRangeFromParsed(e, t, n, r);
      let i = n._custom;
      i &&
        t === this._cachedMeta.vScale &&
        ((e.min = Math.min(e.min, i.min)), (e.max = Math.max(e.max, i.max)));
    }
    getMaxOverflow() {
      return 0;
    }
    getLabelAndValue(e) {
      let { iScale: t, vScale: n } = this._cachedMeta,
        r = this.getParsed(e),
        i = r._custom,
        a = Hi(i)
          ? `[` + i.start + `, ` + i.end + `]`
          : `` + n.getLabelForValue(r[n.axis]);
      return { label: `` + t.getLabelForValue(r[t.axis]), value: a };
    }
    initialize() {
      ((this.enableOptionSharing = !0), super.initialize());
      let e = this._cachedMeta;
      e.stack = this.getDataset().stack;
    }
    update(e) {
      let t = this._cachedMeta;
      this.updateElements(t.data, 0, t.data.length, e);
    }
    updateElements(e, t, n, r) {
      let i = r === `reset`,
        {
          index: a,
          _cachedMeta: { vScale: o },
        } = this,
        s = o.getBasePixel(),
        c = o.isHorizontal(),
        l = this._getRuler(),
        { sharedOptions: u, includeOptions: d } = this._getSharedOptions(t, r);
      for (let f = t; f < t + n; f++) {
        let t = this.getParsed(f),
          n =
            i || I(t[o.axis])
              ? { base: s, head: s }
              : this._calculateBarValuePixels(f),
          p = this._calculateBarIndexPixels(f, l),
          m = (t._stacks || {})[o.axis],
          h = {
            horizontal: c,
            base: n.base,
            enableBorderRadius:
              !m || Hi(t._custom) || a === m._top || a === m._bottom,
            x: c ? n.head : p.center,
            y: c ? p.center : n.head,
            height: c ? p.size : Math.abs(n.size),
            width: c ? Math.abs(n.size) : p.size,
          };
        d &&
          (h.options =
            u || this.resolveDataElementOptions(f, e[f].active ? `active` : r));
        let g = h.options || e[f].options;
        (Gi(h, g, m, a), Yi(h, g, l.ratio), this.updateElement(e[f], f, h, r));
      }
    }
    _getStacks(e, t) {
      let { iScale: n } = this._cachedMeta,
        r = n
          .getMatchingVisibleMetas(this._type)
          .filter((e) => e.controller.options.grouped),
        i = n.options.stacked,
        a = [],
        o = this._cachedMeta.controller.getParsed(t),
        s = o && o[n.axis],
        c = (e) => {
          let t = e._parsed.find((e) => e[n.axis] === s),
            r = t && t[e.vScale.axis];
          if (I(r) || isNaN(r)) return !0;
        };
      for (let n of r)
        if (
          !(t !== void 0 && c(n)) &&
          ((i === !1 ||
            a.indexOf(n.stack) === -1 ||
            (i === void 0 && n.stack === void 0)) &&
            a.push(n.stack),
          n.index === e)
        )
          break;
      return (a.length || a.push(void 0), a);
    }
    _getStackCount(e) {
      return this._getStacks(void 0, e).length;
    }
    _getAxisCount() {
      return this._getAxis().length;
    }
    getFirstScaleIdForIndexAxis() {
      let e = this.chart.scales,
        t = this.chart.options.indexAxis;
      return Object.keys(e)
        .filter((n) => e[n].axis === t)
        .shift();
    }
    _getAxis() {
      let e = {},
        t = this.getFirstScaleIdForIndexAxis();
      for (let n of this.chart.data.datasets)
        e[V(this.chart.options.indexAxis === `x` ? n.xAxisID : n.yAxisID, t)] =
          !0;
      return Object.keys(e);
    }
    _getStackIndex(e, t, n) {
      let r = this._getStacks(e, n),
        i = t === void 0 ? -1 : r.indexOf(t);
      return i === -1 ? r.length - 1 : i;
    }
    _getRuler() {
      let e = this.options,
        t = this._cachedMeta,
        n = t.iScale,
        r = [],
        i,
        a;
      for (i = 0, a = t.data.length; i < a; ++i)
        r.push(n.getPixelForValue(this.getParsed(i)[n.axis], i));
      let o = e.barThickness;
      return {
        min: o || Ii(t),
        pixels: r,
        start: n._startPixel,
        end: n._endPixel,
        stackCount: this._getStackCount(),
        scale: n,
        grouped: e.grouped,
        ratio: o ? 1 : e.categoryPercentage * e.barPercentage,
      };
    }
    _calculateBarValuePixels(e) {
      let {
          _cachedMeta: { vScale: t, _stacked: n, index: r },
          options: { base: i, minBarLength: a },
        } = this,
        o = i || 0,
        s = this.getParsed(e),
        c = s._custom,
        l = Hi(c),
        u = s[t.axis],
        d = 0,
        f = n ? this.applyStack(t, s, n) : u,
        p,
        m;
      (f !== u && ((d = f - u), (f = u)),
        l &&
          ((u = c.barStart),
          (f = c.barEnd - c.barStart),
          u !== 0 && yt(u) !== yt(c.barEnd) && (d = 0),
          (d += u)));
      let h = !I(i) && !l ? i : d,
        g = t.getPixelForValue(h);
      if (
        ((p = this.chart.getDataVisibility(e) ? t.getPixelForValue(d + f) : g),
        (m = p - g),
        Math.abs(m) < a)
      ) {
        ((m = Ui(m, t, o) * a), u === o && (g -= m / 2));
        let e = t.getPixelForDecimal(0),
          i = t.getPixelForDecimal(1);
        ((g = Math.max(Math.min(g, Math.max(e, i)), Math.min(e, i))),
          (p = g + m),
          n &&
            !l &&
            (s._stacks[t.axis]._visualValues[r] =
              t.getValueForPixel(p) - t.getValueForPixel(g)));
      }
      if (g === t.getPixelForValue(o)) {
        let e = (yt(m) * t.getLineWidthForValue(o)) / 2;
        ((g += e), (m -= e));
      }
      return { size: m, base: g, head: p, center: p + m / 2 };
    }
    _calculateBarIndexPixels(e, t) {
      let n = t.scale,
        r = this.options,
        i = r.skipNull,
        a = V(r.maxBarThickness, 1 / 0),
        o,
        s,
        c = this._getAxisCount();
      if (t.grouped) {
        let n = i ? this._getStackCount(e) : t.stackCount,
          l =
            r.barThickness === `flex` ? Ri(e, t, r, n * c) : Li(e, t, r, n * c),
          u =
            this.chart.options.indexAxis === `x`
              ? this.getDataset().xAxisID
              : this.getDataset().yAxisID,
          d = this._getAxis().indexOf(V(u, this.getFirstScaleIdForIndexAxis())),
          f =
            this._getStackIndex(
              this.index,
              this._cachedMeta.stack,
              i ? e : void 0,
            ) + d;
        ((o = l.start + l.chunk * f + l.chunk / 2),
          (s = Math.min(a, l.chunk * l.ratio)));
      } else
        ((o = n.getPixelForValue(this.getParsed(e)[n.axis], e)),
          (s = Math.min(a, t.min * t.ratio)));
      return { base: o - s / 2, head: o + s / 2, center: o, size: s };
    }
    draw() {
      let e = this._cachedMeta,
        t = e.vScale,
        n = e.data,
        r = n.length,
        i = 0;
      for (; i < r; ++i)
        this.getParsed(i)[t.axis] !== null &&
          !n[i].hidden &&
          n[i].draw(this._ctx);
    }
  },
  Zi = class extends Pi {
    static id = `line`;
    static defaults = {
      datasetElementType: `line`,
      dataElementType: `point`,
      showLine: !0,
      spanGaps: !1,
    };
    static overrides = {
      scales: { _index_: { type: `category` }, _value_: { type: `linear` } },
    };
    initialize() {
      ((this.enableOptionSharing = !0),
        (this.supportsDecimation = !0),
        super.initialize());
    }
    update(e) {
      let t = this._cachedMeta,
        { dataset: n, data: r = [], _dataset: i } = t,
        a = this.chart._animationsDisabled,
        { start: o, count: s } = Xt(t, r, a);
      ((this._drawStart = o),
        (this._drawCount = s),
        Zt(t) && ((o = 0), (s = r.length)),
        (n._chart = this.chart),
        (n._datasetIndex = this.index),
        (n._decimated = !!i._decimated),
        (n.points = r));
      let c = this.resolveDatasetElementOptions(e);
      (this.options.showLine || (c.borderWidth = 0),
        (c.segment = this.options.segment),
        this.updateElement(n, void 0, { animated: !a, options: c }, e),
        this.updateElements(r, o, s, e));
    }
    updateElements(e, t, n, r) {
      let i = r === `reset`,
        { iScale: a, vScale: o, _stacked: s, _dataset: c } = this._cachedMeta,
        { sharedOptions: l, includeOptions: u } = this._getSharedOptions(t, r),
        d = a.axis,
        f = o.axis,
        { spanGaps: p, segment: m } = this.options,
        h = wt(p) ? p : 1 / 0,
        g = this.chart._animationsDisabled || i || r === `none`,
        _ = t + n,
        v = e.length,
        y = t > 0 && this.getParsed(t - 1);
      for (let n = 0; n < v; ++n) {
        let p = e[n],
          v = g ? p : {};
        if (n < t || n >= _) {
          v.skip = !0;
          continue;
        }
        let b = this.getParsed(n),
          x = I(b[f]),
          S = (v[d] = a.getPixelForValue(b[d], n)),
          C = (v[f] =
            i || x
              ? o.getBasePixel()
              : o.getPixelForValue(s ? this.applyStack(o, b, s) : b[f], n));
        ((v.skip = isNaN(S) || isNaN(C) || x),
          (v.stop = n > 0 && Math.abs(b[d] - y[d]) > h),
          m && ((v.parsed = b), (v.raw = c.data[n])),
          u &&
            (v.options =
              l || this.resolveDataElementOptions(n, p.active ? `active` : r)),
          g || this.updateElement(p, n, v, r),
          (y = b));
      }
    }
    getMaxOverflow() {
      let e = this._cachedMeta,
        t = e.dataset,
        n = (t.options && t.options.borderWidth) || 0,
        r = e.data || [];
      if (!r.length) return n;
      let i = r[0].size(this.resolveDataElementOptions(0)),
        a = r[r.length - 1].size(this.resolveDataElementOptions(r.length - 1));
      return Math.max(n, i, a) / 2;
    }
    draw() {
      let e = this._cachedMeta;
      (e.dataset.updateControlPoints(this.chart.chartArea, e.iScale.axis),
        super.draw());
    }
  };
function Qi() {
  throw Error(
    `This method is not implemented: Check that a complete date adapter is provided.`,
  );
}
var $i = {
  _date: class e {
    static override(t) {
      Object.assign(e.prototype, t);
    }
    options;
    constructor(e) {
      this.options = e || {};
    }
    init() {}
    formats() {
      return Qi();
    }
    parse() {
      return Qi();
    }
    format() {
      return Qi();
    }
    add() {
      return Qi();
    }
    diff() {
      return Qi();
    }
    startOf() {
      return Qi();
    }
    endOf() {
      return Qi();
    }
  },
};
function ea(e, t, n, r) {
  let { controller: i, data: a, _sorted: o } = e,
    s = i._cachedMeta.iScale,
    c = e.dataset && e.dataset.options ? e.dataset.options.spanGaps : null;
  if (s && t === s.axis && t !== `r` && o && a.length) {
    let o = s._reversePixels ? Rt : Lt;
    if (!r) {
      let r = o(a, t, n);
      if (c) {
        let { vScale: t } = i._cachedMeta,
          { _parsed: n } = e,
          a = n
            .slice(0, r.lo + 1)
            .reverse()
            .findIndex((e) => !I(e[t.axis]));
        r.lo -= Math.max(0, a);
        let o = n.slice(r.hi).findIndex((e) => !I(e[t.axis]));
        r.hi += Math.max(0, o);
      }
      return r;
    } else if (i._sharedOptions) {
      let e = a[0],
        r = typeof e.getRange == `function` && e.getRange(t);
      if (r) {
        let e = o(a, t, n - r),
          i = o(a, t, n + r);
        return { lo: e.lo, hi: i.hi };
      }
    }
  }
  return { lo: 0, hi: a.length - 1 };
}
function ta(e, t, n, r, i) {
  let a = e.getSortedVisibleDatasetMetas(),
    o = n[t];
  for (let e = 0, n = a.length; e < n; ++e) {
    let { index: n, data: s } = a[e],
      { lo: c, hi: l } = ea(a[e], t, o, i);
    for (let e = c; e <= l; ++e) {
      let t = s[e];
      t.skip || r(t, n, e);
    }
  }
}
function na(e) {
  let t = e.indexOf(`x`) !== -1,
    n = e.indexOf(`y`) !== -1;
  return function (e, r) {
    let i = t ? Math.abs(e.x - r.x) : 0,
      a = n ? Math.abs(e.y - r.y) : 0;
    return Math.sqrt(i ** 2 + a ** 2);
  };
}
function ra(e, t, n, r, i) {
  let a = [];
  return (
    (!i && !e.isPointInArea(t)) ||
      ta(
        e,
        n,
        t,
        function (n, o, s) {
          (!i && !On(n, e.chartArea, 0)) ||
            (n.inRange(t.x, t.y, r) &&
              a.push({ element: n, datasetIndex: o, index: s }));
        },
        !0,
      ),
    a
  );
}
function ia(e, t, n, r) {
  let i = [];
  function a(e, n, a) {
    let { startAngle: o, endAngle: s } = e.getProps(
        [`startAngle`, `endAngle`],
        r,
      ),
      { angle: c } = At(e, { x: t.x, y: t.y });
    Nt(c, o, s) && i.push({ element: e, datasetIndex: n, index: a });
  }
  return (ta(e, n, t, a), i);
}
function aa(e, t, n, r, i, a) {
  let o = [],
    s = na(n),
    c = 1 / 0;
  function l(n, l, u) {
    let d = n.inRange(t.x, t.y, i);
    if (r && !d) return;
    let f = n.getCenterPoint(i);
    if (!(a || e.isPointInArea(f)) && !d) return;
    let p = s(t, f);
    p < c
      ? ((o = [{ element: n, datasetIndex: l, index: u }]), (c = p))
      : p === c && o.push({ element: n, datasetIndex: l, index: u });
  }
  return (ta(e, n, t, l), o);
}
function oa(e, t, n, r, i, a) {
  return !a && !e.isPointInArea(t)
    ? []
    : n === `r` && !r
      ? ia(e, t, n, i)
      : aa(e, t, n, r, i, a);
}
function sa(e, t, n, r, i) {
  let a = [],
    o = n === `x` ? `inXRange` : `inYRange`,
    s = !1;
  return (
    ta(e, n, t, (e, r, c) => {
      e[o] &&
        e[o](t[n], i) &&
        (a.push({ element: e, datasetIndex: r, index: c }),
        (s ||= e.inRange(t.x, t.y, i)));
    }),
    r && !s ? [] : a
  );
}
var ca = {
    evaluateInteractionItems: ta,
    modes: {
      index(e, t, n, r) {
        let i = Mr(t, e),
          a = n.axis || `x`,
          o = n.includeInvisible || !1,
          s = n.intersect ? ra(e, i, a, r, o) : oa(e, i, a, !1, r, o),
          c = [];
        return s.length
          ? (e.getSortedVisibleDatasetMetas().forEach((e) => {
              let t = s[0].index,
                n = e.data[t];
              n &&
                !n.skip &&
                c.push({ element: n, datasetIndex: e.index, index: t });
            }),
            c)
          : [];
      },
      dataset(e, t, n, r) {
        let i = Mr(t, e),
          a = n.axis || `xy`,
          o = n.includeInvisible || !1,
          s = n.intersect ? ra(e, i, a, r, o) : oa(e, i, a, !1, r, o);
        if (s.length > 0) {
          let t = s[0].datasetIndex,
            n = e.getDatasetMeta(t).data;
          s = [];
          for (let e = 0; e < n.length; ++e)
            s.push({ element: n[e], datasetIndex: t, index: e });
        }
        return s;
      },
      point(e, t, n, r) {
        return ra(e, Mr(t, e), n.axis || `xy`, r, n.includeInvisible || !1);
      },
      nearest(e, t, n, r) {
        let i = Mr(t, e),
          a = n.axis || `xy`,
          o = n.includeInvisible || !1;
        return oa(e, i, a, n.intersect, r, o);
      },
      x(e, t, n, r) {
        return sa(e, Mr(t, e), `x`, n.intersect, r);
      },
      y(e, t, n, r) {
        return sa(e, Mr(t, e), `y`, n.intersect, r);
      },
    },
  },
  la = [`left`, `top`, `right`, `bottom`];
function ua(e, t) {
  return e.filter((e) => e.pos === t);
}
function da(e, t) {
  return e.filter((e) => la.indexOf(e.pos) === -1 && e.box.axis === t);
}
function fa(e, t) {
  return e.sort((e, n) => {
    let r = t ? n : e,
      i = t ? e : n;
    return r.weight === i.weight ? r.index - i.index : r.weight - i.weight;
  });
}
function pa(e) {
  let t = [],
    n,
    r,
    i,
    a,
    o,
    s;
  for (n = 0, r = (e || []).length; n < r; ++n)
    ((i = e[n]),
      ({
        position: a,
        options: { stack: o, stackWeight: s = 1 },
      } = i),
      t.push({
        index: n,
        box: i,
        pos: a,
        horizontal: i.isHorizontal(),
        weight: i.weight,
        stack: o && a + o,
        stackWeight: s,
      }));
  return t;
}
function ma(e) {
  let t = {};
  for (let n of e) {
    let { stack: e, pos: r, stackWeight: i } = n;
    if (!e || !la.includes(r)) continue;
    let a = t[e] || (t[e] = { count: 0, placed: 0, weight: 0, size: 0 });
    (a.count++, (a.weight += i));
  }
  return t;
}
function ha(e, t) {
  let n = ma(e),
    { vBoxMaxWidth: r, hBoxMaxHeight: i } = t,
    a,
    o,
    s;
  for (a = 0, o = e.length; a < o; ++a) {
    s = e[a];
    let { fullSize: o } = s.box,
      c = n[s.stack],
      l = c && s.stackWeight / c.weight;
    s.horizontal
      ? ((s.width = l ? l * r : o && t.availableWidth), (s.height = i))
      : ((s.width = r), (s.height = l ? l * i : o && t.availableHeight));
  }
  return n;
}
function ga(e) {
  let t = pa(e),
    n = fa(
      t.filter((e) => e.box.fullSize),
      !0,
    ),
    r = fa(ua(t, `left`), !0),
    i = fa(ua(t, `right`)),
    a = fa(ua(t, `top`), !0),
    o = fa(ua(t, `bottom`)),
    s = da(t, `x`),
    c = da(t, `y`);
  return {
    fullSize: n,
    leftAndTop: r.concat(a),
    rightAndBottom: i.concat(c).concat(o).concat(s),
    chartArea: ua(t, `chartArea`),
    vertical: r.concat(i).concat(c),
    horizontal: a.concat(o).concat(s),
  };
}
function _a(e, t, n, r) {
  return Math.max(e[n], t[n]) + Math.max(e[r], t[r]);
}
function va(e, t) {
  ((e.top = Math.max(e.top, t.top)),
    (e.left = Math.max(e.left, t.left)),
    (e.bottom = Math.max(e.bottom, t.bottom)),
    (e.right = Math.max(e.right, t.right)));
}
function ya(e, t, n, r) {
  let { pos: i, box: a } = n,
    o = e.maxPadding;
  if (!R(i)) {
    n.size && (e[i] -= n.size);
    let t = r[n.stack] || { size: 0, count: 1 };
    ((t.size = Math.max(t.size, n.horizontal ? a.height : a.width)),
      (n.size = t.size / t.count),
      (e[i] += n.size));
  }
  a.getPadding && va(o, a.getPadding());
  let s = Math.max(0, t.outerWidth - _a(o, e, `left`, `right`)),
    c = Math.max(0, t.outerHeight - _a(o, e, `top`, `bottom`)),
    l = s !== e.w,
    u = c !== e.h;
  return (
    (e.w = s),
    (e.h = c),
    n.horizontal ? { same: l, other: u } : { same: u, other: l }
  );
}
function ba(e) {
  let t = e.maxPadding;
  function n(n) {
    let r = Math.max(t[n] - e[n], 0);
    return ((e[n] += r), r);
  }
  ((e.y += n(`top`)), (e.x += n(`left`)), n(`right`), n(`bottom`));
}
function xa(e, t) {
  let n = t.maxPadding;
  function r(e) {
    let r = { left: 0, top: 0, right: 0, bottom: 0 };
    return (
      e.forEach((e) => {
        r[e] = Math.max(t[e], n[e]);
      }),
      r
    );
  }
  return r(e ? [`left`, `right`] : [`top`, `bottom`]);
}
function Sa(e, t, n, r) {
  let i = [],
    a,
    o,
    s,
    c,
    l,
    u;
  for (a = 0, o = e.length, l = 0; a < o; ++a) {
    ((s = e[a]),
      (c = s.box),
      c.update(s.width || t.w, s.height || t.h, xa(s.horizontal, t)));
    let { same: o, other: d } = ya(t, n, s, r);
    ((l |= o && i.length), (u ||= d), c.fullSize || i.push(s));
  }
  return (l && Sa(i, t, n, r)) || u;
}
function Ca(e, t, n, r, i) {
  ((e.top = n),
    (e.left = t),
    (e.right = t + r),
    (e.bottom = n + i),
    (e.width = r),
    (e.height = i));
}
function wa(e, t, n, r) {
  let i = n.padding,
    { x: a, y: o } = t;
  for (let s of e) {
    let e = s.box,
      c = r[s.stack] || { count: 1, placed: 0, weight: 1 },
      l = s.stackWeight / c.weight || 1;
    if (s.horizontal) {
      let r = t.w * l,
        a = c.size || e.height;
      (lt(c.start) && (o = c.start),
        e.fullSize
          ? Ca(e, i.left, o, n.outerWidth - i.right - i.left, a)
          : Ca(e, t.left + c.placed, o, r, a),
        (c.start = o),
        (c.placed += r),
        (o = e.bottom));
    } else {
      let r = t.h * l,
        o = c.size || e.width;
      (lt(c.start) && (a = c.start),
        e.fullSize
          ? Ca(e, a, i.top, o, n.outerHeight - i.bottom - i.top)
          : Ca(e, a, t.top + c.placed, o, r),
        (c.start = a),
        (c.placed += r),
        (a = e.right));
    }
  }
  ((t.x = a), (t.y = o));
}
var Ta = {
    addBox(e, t) {
      ((e.boxes ||= []),
        (t.fullSize = t.fullSize || !1),
        (t.position = t.position || `top`),
        (t.weight = t.weight || 0),
        (t._layers =
          t._layers ||
          function () {
            return [
              {
                z: 0,
                draw(e) {
                  t.draw(e);
                },
              },
            ];
          }),
        e.boxes.push(t));
    },
    removeBox(e, t) {
      let n = e.boxes ? e.boxes.indexOf(t) : -1;
      n !== -1 && e.boxes.splice(n, 1);
    },
    configure(e, t, n) {
      ((t.fullSize = n.fullSize),
        (t.position = n.position),
        (t.weight = n.weight));
    },
    update(e, t, n, r) {
      if (!e) return;
      let i = X(e.options.layout.padding),
        a = Math.max(t - i.width, 0),
        o = Math.max(n - i.height, 0),
        s = ga(e.boxes),
        c = s.vertical,
        l = s.horizontal;
      U(e.boxes, (e) => {
        typeof e.beforeLayout == `function` && e.beforeLayout();
      });
      let u =
          c.reduce(
            (e, t) =>
              t.box.options && t.box.options.display === !1 ? e : e + 1,
            0,
          ) || 1,
        d = Object.freeze({
          outerWidth: t,
          outerHeight: n,
          padding: i,
          availableWidth: a,
          availableHeight: o,
          vBoxMaxWidth: a / 2 / u,
          hBoxMaxHeight: o / 2,
        }),
        f = Object.assign({}, i);
      va(f, X(r));
      let p = Object.assign(
          { maxPadding: f, w: a, h: o, x: i.left, y: i.top },
          i,
        ),
        m = ha(c.concat(l), d);
      (Sa(s.fullSize, p, d, m),
        Sa(c, p, d, m),
        Sa(l, p, d, m) && Sa(c, p, d, m),
        ba(p),
        wa(s.leftAndTop, p, d, m),
        (p.x += p.w),
        (p.y += p.h),
        wa(s.rightAndBottom, p, d, m),
        (e.chartArea = {
          left: p.left,
          top: p.top,
          right: p.left + p.w,
          bottom: p.top + p.h,
          height: p.h,
          width: p.w,
        }),
        U(s.chartArea, (t) => {
          let n = t.box;
          (Object.assign(n, e.chartArea),
            n.update(p.w, p.h, { left: 0, top: 0, right: 0, bottom: 0 }));
        }));
    },
  },
  Ea = class {
    acquireContext(e, t) {}
    releaseContext(e) {
      return !1;
    }
    addEventListener(e, t, n) {}
    removeEventListener(e, t, n) {}
    getDevicePixelRatio() {
      return 1;
    }
    getMaximumSize(e, t, n, r) {
      return (
        (t = Math.max(0, t || e.width)),
        (n ||= e.height),
        { width: t, height: Math.max(0, r ? Math.floor(t / r) : n) }
      );
    }
    isAttached(e) {
      return !0;
    }
    updateConfig(e) {}
  },
  Da = class extends Ea {
    acquireContext(e) {
      return (e && e.getContext && e.getContext(`2d`)) || null;
    }
    updateConfig(e) {
      e.options.animation = !1;
    }
  },
  Oa = `$chartjs`,
  ka = {
    touchstart: `mousedown`,
    touchmove: `mousemove`,
    touchend: `mouseup`,
    pointerenter: `mouseenter`,
    pointerdown: `mousedown`,
    pointermove: `mousemove`,
    pointerup: `mouseup`,
    pointerleave: `mouseout`,
    pointerout: `mouseout`,
  },
  Aa = (e) => e === null || e === ``;
function ja(e, t) {
  let n = e.style,
    r = e.getAttribute(`height`),
    i = e.getAttribute(`width`);
  if (
    ((e[Oa] = {
      initial: {
        height: r,
        width: i,
        style: { display: n.display, height: n.height, width: n.width },
      },
    }),
    (n.display = n.display || `block`),
    (n.boxSizing = n.boxSizing || `border-box`),
    Aa(i))
  ) {
    let t = Rr(e, `width`);
    t !== void 0 && (e.width = t);
  }
  if (Aa(r))
    if (e.style.height === ``) e.height = e.width / (t || 2);
    else {
      let t = Rr(e, `height`);
      t !== void 0 && (e.height = t);
    }
  return e;
}
var Ma = Lr ? { passive: !0 } : !1;
function Na(e, t, n) {
  e && e.addEventListener(t, n, Ma);
}
function Pa(e, t, n) {
  e && e.canvas && e.canvas.removeEventListener(t, n, Ma);
}
function Fa(e, t) {
  let n = ka[e.type] || e.type,
    { x: r, y: i } = Mr(e, t);
  return {
    type: n,
    chart: t,
    native: e,
    x: r === void 0 ? null : r,
    y: i === void 0 ? null : i,
  };
}
function Ia(e, t) {
  for (let n of e) if (n === t || n.contains(t)) return !0;
}
function La(e, t, n) {
  let r = e.canvas,
    i = new MutationObserver((e) => {
      let t = !1;
      for (let n of e)
        ((t ||= Ia(n.addedNodes, r)), (t &&= !Ia(n.removedNodes, r)));
      t && n();
    });
  return (i.observe(document, { childList: !0, subtree: !0 }), i);
}
function Ra(e, t, n) {
  let r = e.canvas,
    i = new MutationObserver((e) => {
      let t = !1;
      for (let n of e)
        ((t ||= Ia(n.removedNodes, r)), (t &&= !Ia(n.addedNodes, r)));
      t && n();
    });
  return (i.observe(document, { childList: !0, subtree: !0 }), i);
}
var za = new Map(),
  Ba = 0;
function Va() {
  let e = window.devicePixelRatio;
  e !== Ba &&
    ((Ba = e),
    za.forEach((t, n) => {
      n.currentDevicePixelRatio !== e && t();
    }));
}
function Ha(e, t) {
  (za.size || window.addEventListener(`resize`, Va), za.set(e, t));
}
function Ua(e) {
  (za.delete(e), za.size || window.removeEventListener(`resize`, Va));
}
function Wa(e, t, n) {
  let r = e.canvas,
    i = r && wr(r);
  if (!i) return;
  let a = Gt((e, t) => {
      let r = i.clientWidth;
      (n(e, t), r < i.clientWidth && n());
    }, window),
    o = new ResizeObserver((e) => {
      let t = e[0],
        n = t.contentRect.width,
        r = t.contentRect.height;
      (n === 0 && r === 0) || a(n, r);
    });
  return (o.observe(i), Ha(e, a), o);
}
function Ga(e, t, n) {
  (n && n.disconnect(), t === `resize` && Ua(e));
}
function Ka(e, t, n) {
  let r = e.canvas,
    i = Gt((t) => {
      e.ctx !== null && n(Fa(t, e));
    }, e);
  return (Na(r, t, i), i);
}
var qa = class extends Ea {
  acquireContext(e, t) {
    let n = e && e.getContext && e.getContext(`2d`);
    return n && n.canvas === e ? (ja(e, t), n) : null;
  }
  releaseContext(e) {
    let t = e.canvas;
    if (!t[Oa]) return !1;
    let n = t[Oa].initial;
    [`height`, `width`].forEach((e) => {
      let r = n[e];
      I(r) ? t.removeAttribute(e) : t.setAttribute(e, r);
    });
    let r = n.style || {};
    return (
      Object.keys(r).forEach((e) => {
        t.style[e] = r[e];
      }),
      (t.width = t.width),
      delete t[Oa],
      !0
    );
  }
  addEventListener(e, t, n) {
    this.removeEventListener(e, t);
    let r = (e.$proxies ||= {});
    r[t] = ({ attach: La, detach: Ra, resize: Wa }[t] || Ka)(e, t, n);
  }
  removeEventListener(e, t) {
    let n = (e.$proxies ||= {}),
      r = n[t];
    r &&
      (({ attach: Ga, detach: Ga, resize: Ga }[t] || Pa)(e, t, r),
      (n[t] = void 0));
  }
  getDevicePixelRatio() {
    return window.devicePixelRatio;
  }
  getMaximumSize(e, t, n, r) {
    return Fr(e, t, n, r);
  }
  isAttached(e) {
    let t = e && wr(e);
    return !!(t && t.isConnected);
  }
};
function Ja(e) {
  return !Cr() || (typeof OffscreenCanvas < `u` && e instanceof OffscreenCanvas)
    ? Da
    : qa;
}
var Ya = class {
  static defaults = {};
  static defaultRoutes = void 0;
  x;
  y;
  active = !1;
  options;
  $animations;
  tooltipPosition(e) {
    let { x: t, y: n } = this.getProps([`x`, `y`], e);
    return { x: t, y: n };
  }
  hasValue() {
    return wt(this.x) && wt(this.y);
  }
  getProps(e, t) {
    let n = this.$animations;
    if (!t || !n) return this;
    let r = {};
    return (
      e.forEach((e) => {
        r[e] = n[e] && n[e].active() ? n[e]._to : this[e];
      }),
      r
    );
  }
};
function Xa(e, t) {
  let n = e.options.ticks,
    r = Za(e),
    i = Math.min(n.maxTicksLimit || r, r),
    a = n.major.enabled ? $a(t) : [],
    o = a.length,
    s = a[0],
    c = a[o - 1],
    l = [];
  if (o > i) return (eo(t, l, a, o / i), l);
  let u = Qa(a, t, i);
  if (o > 0) {
    let e,
      n,
      r = o > 1 ? Math.round((c - s) / (o - 1)) : null;
    for (to(t, l, u, I(r) ? 0 : s - r, s), e = 0, n = o - 1; e < n; e++)
      to(t, l, u, a[e], a[e + 1]);
    return (to(t, l, u, c, I(r) ? t.length : c + r), l);
  }
  return (to(t, l, u), l);
}
function Za(e) {
  let t = e.options.offset,
    n = e._tickSize(),
    r = e._length / n + (t ? 0 : 1),
    i = e._maxLength / n;
  return Math.floor(Math.min(r, i));
}
function Qa(e, t, n) {
  let r = no(e),
    i = t.length / n;
  if (!r) return Math.max(i, 1);
  let a = St(r);
  for (let e = 0, t = a.length - 1; e < t; e++) {
    let t = a[e];
    if (t > i) return t;
  }
  return Math.max(i, 1);
}
function $a(e) {
  let t = [],
    n,
    r;
  for (n = 0, r = e.length; n < r; n++) e[n].major && t.push(n);
  return t;
}
function eo(e, t, n, r) {
  let i = 0,
    a = n[0],
    o;
  for (r = Math.ceil(r), o = 0; o < e.length; o++)
    o === a && (t.push(e[o]), i++, (a = n[i * r]));
}
function to(e, t, n, r, i) {
  let a = V(r, 0),
    o = Math.min(V(i, e.length), e.length),
    s = 0,
    c,
    l,
    u;
  for (
    n = Math.ceil(n), i && ((c = i - r), (n = c / Math.floor(c / n))), u = a;
    u < 0;
  )
    (s++, (u = Math.round(a + s * n)));
  for (l = Math.max(a, 0); l < o; l++)
    l === u && (t.push(e[l]), s++, (u = Math.round(a + s * n)));
}
function no(e) {
  let t = e.length,
    n,
    r;
  if (t < 2) return !1;
  for (r = e[0], n = 1; n < t; ++n) if (e[n] - e[n - 1] !== r) return !1;
  return r;
}
var ro = (e) => (e === `left` ? `right` : e === `right` ? `left` : e),
  io = (e, t, n) => (t === `top` || t === `left` ? e[t] + n : e[t] - n),
  ao = (e, t) => Math.min(t || e, e);
function oo(e, t) {
  let n = [],
    r = e.length / t,
    i = e.length,
    a = 0;
  for (; a < i; a += r) n.push(e[Math.floor(a)]);
  return n;
}
function so(e, t, n) {
  let r = e.ticks.length,
    i = Math.min(t, r - 1),
    a = e._startPixel,
    o = e._endPixel,
    s = 1e-6,
    c = e.getPixelForTick(i),
    l;
  if (
    !(
      n &&
      ((l =
        r === 1
          ? Math.max(c - a, o - c)
          : t === 0
            ? (e.getPixelForTick(1) - c) / 2
            : (c - e.getPixelForTick(i - 1)) / 2),
      (c += i < t ? l : -l),
      c < a - s || c > o + s)
    )
  )
    return c;
}
function co(e, t) {
  U(e, (e) => {
    let n = e.gc,
      r = n.length / 2,
      i;
    if (r > t) {
      for (i = 0; i < r; ++i) delete e.data[n[i]];
      n.splice(0, r);
    }
  });
}
function lo(e) {
  return e.drawTicks ? e.tickLength : 0;
}
function uo(e, t) {
  if (!e.display) return 0;
  let n = Z(e.font, t),
    r = X(e.padding);
  return (L(e.text) ? e.text.length : 1) * n.lineHeight + r.height;
}
function fo(e, t) {
  return qn(e, { scale: t, type: `scale` });
}
function po(e, t, n) {
  return qn(e, { tick: n, index: t, type: `tick` });
}
function mo(e, t, n) {
  let r = qt(e);
  return (((n && t !== `right`) || (!n && t === `right`)) && (r = ro(r)), r);
}
function ho(e, t, n, r) {
  let { top: i, left: a, bottom: o, right: s, chart: c } = e,
    { chartArea: l, scales: u } = c,
    d = 0,
    f,
    p,
    m,
    h = o - i,
    g = s - a;
  if (e.isHorizontal()) {
    if (((p = Jt(r, a, s)), R(n))) {
      let e = Object.keys(n)[0],
        r = n[e];
      m = u[e].getPixelForValue(r) + h - t;
    } else m = n === `center` ? (l.bottom + l.top) / 2 + h - t : io(e, n, t);
    f = s - a;
  } else {
    if (R(n)) {
      let e = Object.keys(n)[0],
        r = n[e];
      p = u[e].getPixelForValue(r) - g + t;
    } else p = n === `center` ? (l.left + l.right) / 2 - g + t : io(e, n, t);
    ((m = Jt(r, o, i)), (d = n === `left` ? -K : K));
  }
  return { titleX: p, titleY: m, maxWidth: f, rotation: d };
}
var go = class e extends Ya {
    constructor(e) {
      (super(),
        (this.id = e.id),
        (this.type = e.type),
        (this.options = void 0),
        (this.ctx = e.ctx),
        (this.chart = e.chart),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.left = void 0),
        (this.right = void 0),
        (this.width = void 0),
        (this.height = void 0),
        (this._margins = { left: 0, right: 0, top: 0, bottom: 0 }),
        (this.maxWidth = void 0),
        (this.maxHeight = void 0),
        (this.paddingTop = void 0),
        (this.paddingBottom = void 0),
        (this.paddingLeft = void 0),
        (this.paddingRight = void 0),
        (this.axis = void 0),
        (this.labelRotation = void 0),
        (this.min = void 0),
        (this.max = void 0),
        (this._range = void 0),
        (this.ticks = []),
        (this._gridLineItems = null),
        (this._labelItems = null),
        (this._labelSizes = null),
        (this._length = 0),
        (this._maxLength = 0),
        (this._longestTextCache = {}),
        (this._startPixel = void 0),
        (this._endPixel = void 0),
        (this._reversePixels = !1),
        (this._userMax = void 0),
        (this._userMin = void 0),
        (this._suggestedMax = void 0),
        (this._suggestedMin = void 0),
        (this._ticksLength = 0),
        (this._borderValue = 0),
        (this._cache = {}),
        (this._dataLimitsCached = !1),
        (this.$context = void 0));
    }
    init(e) {
      ((this.options = e.setContext(this.getContext())),
        (this.axis = e.axis),
        (this._userMin = this.parse(e.min)),
        (this._userMax = this.parse(e.max)),
        (this._suggestedMin = this.parse(e.suggestedMin)),
        (this._suggestedMax = this.parse(e.suggestedMax)));
    }
    parse(e, t) {
      return e;
    }
    getUserBounds() {
      let {
        _userMin: e,
        _userMax: t,
        _suggestedMin: n,
        _suggestedMax: r,
      } = this;
      return (
        (e = B(e, 1 / 0)),
        (t = B(t, -1 / 0)),
        (n = B(n, 1 / 0)),
        (r = B(r, -1 / 0)),
        { min: B(e, n), max: B(t, r), minDefined: z(e), maxDefined: z(t) }
      );
    }
    getMinMax(e) {
      let {
          min: t,
          max: n,
          minDefined: r,
          maxDefined: i,
        } = this.getUserBounds(),
        a;
      if (r && i) return { min: t, max: n };
      let o = this.getMatchingVisibleMetas();
      for (let s = 0, c = o.length; s < c; ++s)
        ((a = o[s].controller.getMinMax(this, e)),
          r || (t = Math.min(t, a.min)),
          i || (n = Math.max(n, a.max)));
      return (
        (t = i && t > n ? n : t),
        (n = r && t > n ? t : n),
        { min: B(t, B(n, t)), max: B(n, B(t, n)) }
      );
    }
    getPadding() {
      return {
        left: this.paddingLeft || 0,
        top: this.paddingTop || 0,
        right: this.paddingRight || 0,
        bottom: this.paddingBottom || 0,
      };
    }
    getTicks() {
      return this.ticks;
    }
    getLabels() {
      let e = this.chart.data;
      return (
        this.options.labels ||
        (this.isHorizontal() ? e.xLabels : e.yLabels) ||
        e.labels ||
        []
      );
    }
    getLabelItems(e = this.chart.chartArea) {
      return (this._labelItems ||= this._computeLabelItems(e));
    }
    beforeLayout() {
      ((this._cache = {}), (this._dataLimitsCached = !1));
    }
    beforeUpdate() {
      H(this.options.beforeUpdate, [this]);
    }
    update(e, t, n) {
      let { beginAtZero: r, grace: i, ticks: a } = this.options,
        o = a.sampleSize;
      (this.beforeUpdate(),
        (this.maxWidth = e),
        (this.maxHeight = t),
        (this._margins = n =
          Object.assign({ left: 0, right: 0, top: 0, bottom: 0 }, n)),
        (this.ticks = null),
        (this._labelSizes = null),
        (this._gridLineItems = null),
        (this._labelItems = null),
        this.beforeSetDimensions(),
        this.setDimensions(),
        this.afterSetDimensions(),
        (this._maxLength = this.isHorizontal()
          ? this.width + n.left + n.right
          : this.height + n.top + n.bottom),
        (this._dataLimitsCached ||=
          (this.beforeDataLimits(),
          this.determineDataLimits(),
          this.afterDataLimits(),
          (this._range = Kn(this, i, r)),
          !0)),
        this.beforeBuildTicks(),
        (this.ticks = this.buildTicks() || []),
        this.afterBuildTicks());
      let s = o < this.ticks.length;
      (this._convertTicksToLabels(s ? oo(this.ticks, o) : this.ticks),
        this.configure(),
        this.beforeCalculateLabelRotation(),
        this.calculateLabelRotation(),
        this.afterCalculateLabelRotation(),
        a.display &&
          (a.autoSkip || a.source === `auto`) &&
          ((this.ticks = Xa(this, this.ticks)),
          (this._labelSizes = null),
          this.afterAutoSkip()),
        s && this._convertTicksToLabels(this.ticks),
        this.beforeFit(),
        this.fit(),
        this.afterFit(),
        this.afterUpdate());
    }
    configure() {
      let e = this.options.reverse,
        t,
        n;
      (this.isHorizontal()
        ? ((t = this.left), (n = this.right))
        : ((t = this.top), (n = this.bottom), (e = !e)),
        (this._startPixel = t),
        (this._endPixel = n),
        (this._reversePixels = e),
        (this._length = n - t),
        (this._alignToPixels = this.options.alignToPixels));
    }
    afterUpdate() {
      H(this.options.afterUpdate, [this]);
    }
    beforeSetDimensions() {
      H(this.options.beforeSetDimensions, [this]);
    }
    setDimensions() {
      (this.isHorizontal()
        ? ((this.width = this.maxWidth),
          (this.left = 0),
          (this.right = this.width))
        : ((this.height = this.maxHeight),
          (this.top = 0),
          (this.bottom = this.height)),
        (this.paddingLeft = 0),
        (this.paddingTop = 0),
        (this.paddingRight = 0),
        (this.paddingBottom = 0));
    }
    afterSetDimensions() {
      H(this.options.afterSetDimensions, [this]);
    }
    _callHooks(e) {
      (this.chart.notifyPlugins(e, this.getContext()),
        H(this.options[e], [this]));
    }
    beforeDataLimits() {
      this._callHooks(`beforeDataLimits`);
    }
    determineDataLimits() {}
    afterDataLimits() {
      this._callHooks(`afterDataLimits`);
    }
    beforeBuildTicks() {
      this._callHooks(`beforeBuildTicks`);
    }
    buildTicks() {
      return [];
    }
    afterBuildTicks() {
      this._callHooks(`afterBuildTicks`);
    }
    beforeTickToLabelConversion() {
      H(this.options.beforeTickToLabelConversion, [this]);
    }
    generateTickLabels(e) {
      let t = this.options.ticks,
        n,
        r,
        i;
      for (n = 0, r = e.length; n < r; n++)
        ((i = e[n]), (i.label = H(t.callback, [i.value, n, e], this)));
    }
    afterTickToLabelConversion() {
      H(this.options.afterTickToLabelConversion, [this]);
    }
    beforeCalculateLabelRotation() {
      H(this.options.beforeCalculateLabelRotation, [this]);
    }
    calculateLabelRotation() {
      let e = this.options,
        t = e.ticks,
        n = ao(this.ticks.length, e.ticks.maxTicksLimit),
        r = t.minRotation || 0,
        i = t.maxRotation,
        a = r,
        o,
        s,
        c;
      if (
        !this._isVisible() ||
        !t.display ||
        r >= i ||
        n <= 1 ||
        !this.isHorizontal()
      ) {
        this.labelRotation = r;
        return;
      }
      let l = this._getLabelSizes(),
        u = l.widest.width,
        d = l.highest.height,
        f = J(this.chart.width - u, 0, this.maxWidth);
      ((o = e.offset ? this.maxWidth / n : f / (n - 1)),
        u + 6 > o &&
          ((o = f / (n - (e.offset ? 0.5 : 1))),
          (s =
            this.maxHeight -
            lo(e.grid) -
            t.padding -
            uo(e.title, this.chart.options.font)),
          (c = Math.sqrt(u * u + d * d)),
          (a = Ot(
            Math.min(
              Math.asin(J((l.highest.height + 6) / o, -1, 1)),
              Math.asin(J(s / c, -1, 1)) - Math.asin(J(d / c, -1, 1)),
            ),
          )),
          (a = Math.max(r, Math.min(i, a)))),
        (this.labelRotation = a));
    }
    afterCalculateLabelRotation() {
      H(this.options.afterCalculateLabelRotation, [this]);
    }
    afterAutoSkip() {}
    beforeFit() {
      H(this.options.beforeFit, [this]);
    }
    fit() {
      let e = { width: 0, height: 0 },
        {
          chart: t,
          options: { ticks: n, title: r, grid: i },
        } = this,
        a = this._isVisible(),
        o = this.isHorizontal();
      if (a) {
        let a = uo(r, t.options.font);
        if (
          (o
            ? ((e.width = this.maxWidth), (e.height = lo(i) + a))
            : ((e.height = this.maxHeight), (e.width = lo(i) + a)),
          n.display && this.ticks.length)
        ) {
          let {
              first: t,
              last: r,
              widest: i,
              highest: a,
            } = this._getLabelSizes(),
            s = n.padding * 2,
            c = Dt(this.labelRotation),
            l = Math.cos(c),
            u = Math.sin(c);
          if (o) {
            let t = n.mirror ? 0 : u * i.width + l * a.height;
            e.height = Math.min(this.maxHeight, e.height + t + s);
          } else {
            let t = n.mirror ? 0 : l * i.width + u * a.height;
            e.width = Math.min(this.maxWidth, e.width + t + s);
          }
          this._calculatePadding(t, r, u, l);
        }
      }
      (this._handleMargins(),
        o
          ? ((this.width = this._length =
              t.width - this._margins.left - this._margins.right),
            (this.height = e.height))
          : ((this.width = e.width),
            (this.height = this._length =
              t.height - this._margins.top - this._margins.bottom)));
    }
    _calculatePadding(e, t, n, r) {
      let {
          ticks: { align: i, padding: a },
          position: o,
        } = this.options,
        s = this.labelRotation !== 0,
        c = o !== `top` && this.axis === `x`;
      if (this.isHorizontal()) {
        let o = this.getPixelForTick(0) - this.left,
          l = this.right - this.getPixelForTick(this.ticks.length - 1),
          u = 0,
          d = 0;
        (s
          ? c
            ? ((u = r * e.width), (d = n * t.height))
            : ((u = n * e.height), (d = r * t.width))
          : i === `start`
            ? (d = t.width)
            : i === `end`
              ? (u = e.width)
              : i !== `inner` && ((u = e.width / 2), (d = t.width / 2)),
          (this.paddingLeft = Math.max(
            ((u - o + a) * this.width) / (this.width - o),
            0,
          )),
          (this.paddingRight = Math.max(
            ((d - l + a) * this.width) / (this.width - l),
            0,
          )));
      } else {
        let n = t.height / 2,
          r = e.height / 2;
        (i === `start`
          ? ((n = 0), (r = e.height))
          : i === `end` && ((n = t.height), (r = 0)),
          (this.paddingTop = n + a),
          (this.paddingBottom = r + a));
      }
    }
    _handleMargins() {
      this._margins &&
        ((this._margins.left = Math.max(this.paddingLeft, this._margins.left)),
        (this._margins.top = Math.max(this.paddingTop, this._margins.top)),
        (this._margins.right = Math.max(
          this.paddingRight,
          this._margins.right,
        )),
        (this._margins.bottom = Math.max(
          this.paddingBottom,
          this._margins.bottom,
        )));
    }
    afterFit() {
      H(this.options.afterFit, [this]);
    }
    isHorizontal() {
      let { axis: e, position: t } = this.options;
      return t === `top` || t === `bottom` || e === `x`;
    }
    isFullSize() {
      return this.options.fullSize;
    }
    _convertTicksToLabels(e) {
      (this.beforeTickToLabelConversion(), this.generateTickLabels(e));
      let t, n;
      for (t = 0, n = e.length; t < n; t++)
        I(e[t].label) && (e.splice(t, 1), n--, t--);
      this.afterTickToLabelConversion();
    }
    _getLabelSizes() {
      let e = this._labelSizes;
      if (!e) {
        let t = this.options.ticks.sampleSize,
          n = this.ticks;
        (t < n.length && (n = oo(n, t)),
          (this._labelSizes = e =
            this._computeLabelSizes(
              n,
              n.length,
              this.options.ticks.maxTicksLimit,
            )));
      }
      return e;
    }
    _computeLabelSizes(e, t, n) {
      let { ctx: r, _longestTextCache: i } = this,
        a = [],
        o = [],
        s = Math.floor(t / ao(t, n)),
        c = 0,
        l = 0,
        u,
        d,
        f,
        p,
        m,
        h,
        g,
        _,
        v,
        y,
        b;
      for (u = 0; u < t; u += s) {
        if (
          ((p = e[u].label),
          (m = this._resolveTickFontOptions(u)),
          (r.font = h = m.string),
          (g = i[h] = i[h] || { data: {}, gc: [] }),
          (_ = m.lineHeight),
          (v = y = 0),
          !I(p) && !L(p))
        )
          ((v = Sn(r, g.data, g.gc, v, p)), (y = _));
        else if (L(p))
          for (d = 0, f = p.length; d < f; ++d)
            ((b = p[d]),
              !I(b) && !L(b) && ((v = Sn(r, g.data, g.gc, v, b)), (y += _)));
        (a.push(v), o.push(y), (c = Math.max(v, c)), (l = Math.max(y, l)));
      }
      co(i, t);
      let x = a.indexOf(c),
        S = o.indexOf(l),
        C = (e) => ({ width: a[e] || 0, height: o[e] || 0 });
      return {
        first: C(0),
        last: C(t - 1),
        widest: C(x),
        highest: C(S),
        widths: a,
        heights: o,
      };
    }
    getLabelForValue(e) {
      return e;
    }
    getPixelForValue(e, t) {
      return NaN;
    }
    getValueForPixel(e) {}
    getPixelForTick(e) {
      let t = this.ticks;
      return e < 0 || e > t.length - 1
        ? null
        : this.getPixelForValue(t[e].value);
    }
    getPixelForDecimal(e) {
      this._reversePixels && (e = 1 - e);
      let t = this._startPixel + e * this._length;
      return Pt(this._alignToPixels ? wn(this.chart, t, 0) : t);
    }
    getDecimalForPixel(e) {
      let t = (e - this._startPixel) / this._length;
      return this._reversePixels ? 1 - t : t;
    }
    getBasePixel() {
      return this.getPixelForValue(this.getBaseValue());
    }
    getBaseValue() {
      let { min: e, max: t } = this;
      return e < 0 && t < 0 ? t : e > 0 && t > 0 ? e : 0;
    }
    getContext(e) {
      let t = this.ticks || [];
      if (e >= 0 && e < t.length) {
        let n = t[e];
        return (n.$context ||= po(this.getContext(), e, n));
      }
      return (this.$context ||= fo(this.chart.getContext(), this));
    }
    _tickSize() {
      let e = this.options.ticks,
        t = Dt(this.labelRotation),
        n = Math.abs(Math.cos(t)),
        r = Math.abs(Math.sin(t)),
        i = this._getLabelSizes(),
        a = e.autoSkipPadding || 0,
        o = i ? i.widest.width + a : 0,
        s = i ? i.highest.height + a : 0;
      return this.isHorizontal()
        ? s * n > o * r
          ? o / n
          : s / r
        : s * r < o * n
          ? s / n
          : o / r;
    }
    _isVisible() {
      let e = this.options.display;
      return e === `auto` ? this.getMatchingVisibleMetas().length > 0 : !!e;
    }
    _computeGridLineItems(e) {
      let t = this.axis,
        n = this.chart,
        r = this.options,
        { grid: i, position: a, border: o } = r,
        s = i.offset,
        c = this.isHorizontal(),
        l = this.ticks.length + (s ? 1 : 0),
        u = lo(i),
        d = [],
        f = o.setContext(this.getContext()),
        p = f.display ? f.width : 0,
        m = p / 2,
        h = function (e) {
          return wn(n, e, p);
        },
        g,
        _,
        v,
        y,
        b,
        x,
        S,
        C,
        w,
        T,
        E,
        D;
      if (a === `top`)
        ((g = h(this.bottom)),
          (x = this.bottom - u),
          (C = g - m),
          (T = h(e.top) + m),
          (D = e.bottom));
      else if (a === `bottom`)
        ((g = h(this.top)),
          (T = e.top),
          (D = h(e.bottom) - m),
          (x = g + m),
          (C = this.top + u));
      else if (a === `left`)
        ((g = h(this.right)),
          (b = this.right - u),
          (S = g - m),
          (w = h(e.left) + m),
          (E = e.right));
      else if (a === `right`)
        ((g = h(this.left)),
          (w = e.left),
          (E = h(e.right) - m),
          (b = g + m),
          (S = this.left + u));
      else if (t === `x`) {
        if (a === `center`) g = h((e.top + e.bottom) / 2 + 0.5);
        else if (R(a)) {
          let e = Object.keys(a)[0],
            t = a[e];
          g = h(this.chart.scales[e].getPixelForValue(t));
        }
        ((T = e.top), (D = e.bottom), (x = g + m), (C = x + u));
      } else if (t === `y`) {
        if (a === `center`) g = h((e.left + e.right) / 2);
        else if (R(a)) {
          let e = Object.keys(a)[0],
            t = a[e];
          g = h(this.chart.scales[e].getPixelForValue(t));
        }
        ((b = g - m), (S = b - u), (w = e.left), (E = e.right));
      }
      let ee = V(r.ticks.maxTicksLimit, l),
        te = Math.max(1, Math.ceil(l / ee));
      for (_ = 0; _ < l; _ += te) {
        let e = this.getContext(_),
          t = i.setContext(e),
          r = o.setContext(e),
          a = t.lineWidth,
          l = t.color,
          u = r.dash || [],
          f = r.dashOffset,
          p = t.tickWidth,
          m = t.tickColor,
          h = t.tickBorderDash || [],
          g = t.tickBorderDashOffset;
        ((v = so(this, _, s)),
          v !== void 0 &&
            ((y = wn(n, v, a)),
            c ? (b = S = w = E = y) : (x = C = T = D = y),
            d.push({
              tx1: b,
              ty1: x,
              tx2: S,
              ty2: C,
              x1: w,
              y1: T,
              x2: E,
              y2: D,
              width: a,
              color: l,
              borderDash: u,
              borderDashOffset: f,
              tickWidth: p,
              tickColor: m,
              tickBorderDash: h,
              tickBorderDashOffset: g,
            })));
      }
      return ((this._ticksLength = l), (this._borderValue = g), d);
    }
    _computeLabelItems(e) {
      let t = this.axis,
        n = this.options,
        { position: r, ticks: i } = n,
        a = this.isHorizontal(),
        o = this.ticks,
        { align: s, crossAlign: c, padding: l, mirror: u } = i,
        d = lo(n.grid),
        f = d + l,
        p = u ? -l : f,
        m = -Dt(this.labelRotation),
        h = [],
        g,
        _,
        v,
        y,
        b,
        x,
        S,
        C,
        w,
        T,
        E,
        D,
        ee = `middle`;
      if (r === `top`)
        ((x = this.bottom - p), (S = this._getXAxisLabelAlignment()));
      else if (r === `bottom`)
        ((x = this.top + p), (S = this._getXAxisLabelAlignment()));
      else if (r === `left`) {
        let e = this._getYAxisLabelAlignment(d);
        ((S = e.textAlign), (b = e.x));
      } else if (r === `right`) {
        let e = this._getYAxisLabelAlignment(d);
        ((S = e.textAlign), (b = e.x));
      } else if (t === `x`) {
        if (r === `center`) x = (e.top + e.bottom) / 2 + f;
        else if (R(r)) {
          let e = Object.keys(r)[0],
            t = r[e];
          x = this.chart.scales[e].getPixelForValue(t) + f;
        }
        S = this._getXAxisLabelAlignment();
      } else if (t === `y`) {
        if (r === `center`) b = (e.left + e.right) / 2 - f;
        else if (R(r)) {
          let e = Object.keys(r)[0],
            t = r[e];
          b = this.chart.scales[e].getPixelForValue(t);
        }
        S = this._getYAxisLabelAlignment(d).textAlign;
      }
      t === `y` &&
        (s === `start` ? (ee = `top`) : s === `end` && (ee = `bottom`));
      let te = this._getLabelSizes();
      for (g = 0, _ = o.length; g < _; ++g) {
        ((v = o[g]), (y = v.label));
        let e = i.setContext(this.getContext(g));
        ((C = this.getPixelForTick(g) + i.labelOffset),
          (w = this._resolveTickFontOptions(g)),
          (T = w.lineHeight),
          (E = L(y) ? y.length : 1));
        let t = E / 2,
          n = e.color,
          s = e.textStrokeColor,
          l = e.textStrokeWidth,
          d = S;
        a
          ? ((b = C),
            S === `inner` &&
              (d =
                g === _ - 1
                  ? this.options.reverse
                    ? `left`
                    : `right`
                  : g === 0
                    ? this.options.reverse
                      ? `right`
                      : `left`
                    : `center`),
            (D =
              r === `top`
                ? c === `near` || m !== 0
                  ? -E * T + T / 2
                  : c === `center`
                    ? -te.highest.height / 2 - t * T + T
                    : -te.highest.height + T / 2
                : c === `near` || m !== 0
                  ? T / 2
                  : c === `center`
                    ? te.highest.height / 2 - t * T
                    : te.highest.height - E * T),
            u && (D *= -1),
            m !== 0 && !e.showLabelBackdrop && (b += (T / 2) * Math.sin(m)))
          : ((x = C), (D = ((1 - E) * T) / 2));
        let f;
        if (e.showLabelBackdrop) {
          let t = X(e.backdropPadding),
            n = te.heights[g],
            r = te.widths[g],
            i = D - t.top,
            a = 0 - t.left;
          switch (ee) {
            case `middle`:
              i -= n / 2;
              break;
            case `bottom`:
              i -= n;
              break;
          }
          switch (S) {
            case `center`:
              a -= r / 2;
              break;
            case `right`:
              a -= r;
              break;
            case `inner`:
              g === _ - 1 ? (a -= r) : g > 0 && (a -= r / 2);
              break;
          }
          f = {
            left: a,
            top: i,
            width: r + t.width,
            height: n + t.height,
            color: e.backdropColor,
          };
        }
        h.push({
          label: y,
          font: w,
          textOffset: D,
          options: {
            rotation: m,
            color: n,
            strokeColor: s,
            strokeWidth: l,
            textAlign: d,
            textBaseline: ee,
            translation: [b, x],
            backdrop: f,
          },
        });
      }
      return h;
    }
    _getXAxisLabelAlignment() {
      let { position: e, ticks: t } = this.options;
      if (-Dt(this.labelRotation)) return e === `top` ? `left` : `right`;
      let n = `center`;
      return (
        t.align === `start`
          ? (n = `left`)
          : t.align === `end`
            ? (n = `right`)
            : t.align === `inner` && (n = `inner`),
        n
      );
    }
    _getYAxisLabelAlignment(e) {
      let {
          position: t,
          ticks: { crossAlign: n, mirror: r, padding: i },
        } = this.options,
        a = this._getLabelSizes(),
        o = e + i,
        s = a.widest.width,
        c,
        l;
      return (
        t === `left`
          ? r
            ? ((l = this.right + i),
              n === `near`
                ? (c = `left`)
                : n === `center`
                  ? ((c = `center`), (l += s / 2))
                  : ((c = `right`), (l += s)))
            : ((l = this.right - o),
              n === `near`
                ? (c = `right`)
                : n === `center`
                  ? ((c = `center`), (l -= s / 2))
                  : ((c = `left`), (l = this.left)))
          : t === `right`
            ? r
              ? ((l = this.left + i),
                n === `near`
                  ? (c = `right`)
                  : n === `center`
                    ? ((c = `center`), (l -= s / 2))
                    : ((c = `left`), (l -= s)))
              : ((l = this.left + o),
                n === `near`
                  ? (c = `left`)
                  : n === `center`
                    ? ((c = `center`), (l += s / 2))
                    : ((c = `right`), (l = this.right)))
            : (c = `right`),
        { textAlign: c, x: l }
      );
    }
    _computeLabelArea() {
      if (this.options.ticks.mirror) return;
      let e = this.chart,
        t = this.options.position;
      if (t === `left` || t === `right`)
        return { top: 0, left: this.left, bottom: e.height, right: this.right };
      if (t === `top` || t === `bottom`)
        return { top: this.top, left: 0, bottom: this.bottom, right: e.width };
    }
    drawBackground() {
      let {
        ctx: e,
        options: { backgroundColor: t },
        left: n,
        top: r,
        width: i,
        height: a,
      } = this;
      t && (e.save(), (e.fillStyle = t), e.fillRect(n, r, i, a), e.restore());
    }
    getLineWidthForValue(e) {
      let t = this.options.grid;
      if (!this._isVisible() || !t.display) return 0;
      let n = this.ticks.findIndex((t) => t.value === e);
      return n >= 0 ? t.setContext(this.getContext(n)).lineWidth : 0;
    }
    drawGrid(e) {
      let t = this.options.grid,
        n = this.ctx,
        r = (this._gridLineItems ||= this._computeGridLineItems(e)),
        i,
        a,
        o = (e, t, r) => {
          !r.width ||
            !r.color ||
            (n.save(),
            (n.lineWidth = r.width),
            (n.strokeStyle = r.color),
            n.setLineDash(r.borderDash || []),
            (n.lineDashOffset = r.borderDashOffset),
            n.beginPath(),
            n.moveTo(e.x, e.y),
            n.lineTo(t.x, t.y),
            n.stroke(),
            n.restore());
        };
      if (t.display)
        for (i = 0, a = r.length; i < a; ++i) {
          let e = r[i];
          (t.drawOnChartArea &&
            o({ x: e.x1, y: e.y1 }, { x: e.x2, y: e.y2 }, e),
            t.drawTicks &&
              o(
                { x: e.tx1, y: e.ty1 },
                { x: e.tx2, y: e.ty2 },
                {
                  color: e.tickColor,
                  width: e.tickWidth,
                  borderDash: e.tickBorderDash,
                  borderDashOffset: e.tickBorderDashOffset,
                },
              ));
        }
    }
    drawBorder() {
      let {
          chart: e,
          ctx: t,
          options: { border: n, grid: r },
        } = this,
        i = n.setContext(this.getContext()),
        a = n.display ? i.width : 0;
      if (!a) return;
      let o = r.setContext(this.getContext(0)).lineWidth,
        s = this._borderValue,
        c,
        l,
        u,
        d;
      (this.isHorizontal()
        ? ((c = wn(e, this.left, a) - a / 2),
          (l = wn(e, this.right, o) + o / 2),
          (u = d = s))
        : ((u = wn(e, this.top, a) - a / 2),
          (d = wn(e, this.bottom, o) + o / 2),
          (c = l = s)),
        t.save(),
        (t.lineWidth = i.width),
        (t.strokeStyle = i.color),
        t.beginPath(),
        t.moveTo(c, u),
        t.lineTo(l, d),
        t.stroke(),
        t.restore());
    }
    drawLabels(e) {
      if (!this.options.ticks.display) return;
      let t = this.ctx,
        n = this._computeLabelArea();
      n && kn(t, n);
      let r = this.getLabelItems(e);
      for (let e of r) {
        let n = e.options,
          r = e.font,
          i = e.label,
          a = e.textOffset;
        In(t, i, 0, a, r, n);
      }
      n && An(t);
    }
    drawTitle() {
      let {
        ctx: e,
        options: { position: t, title: n, reverse: r },
      } = this;
      if (!n.display) return;
      let i = Z(n.font),
        a = X(n.padding),
        o = n.align,
        s = i.lineHeight / 2;
      t === `bottom` || t === `center` || R(t)
        ? ((s += a.bottom),
          L(n.text) && (s += i.lineHeight * (n.text.length - 1)))
        : (s += a.top);
      let {
        titleX: c,
        titleY: l,
        maxWidth: u,
        rotation: d,
      } = ho(this, s, t, o);
      In(e, n.text, 0, 0, i, {
        color: n.color,
        maxWidth: u,
        rotation: d,
        textAlign: mo(o, t, r),
        textBaseline: `middle`,
        translation: [c, l],
      });
    }
    draw(e) {
      this._isVisible() &&
        (this.drawBackground(),
        this.drawGrid(e),
        this.drawBorder(),
        this.drawTitle(),
        this.drawLabels(e));
    }
    _layers() {
      let t = this.options,
        n = (t.ticks && t.ticks.z) || 0,
        r = V(t.grid && t.grid.z, -1),
        i = V(t.border && t.border.z, 0);
      return !this._isVisible() || this.draw !== e.prototype.draw
        ? [
            {
              z: n,
              draw: (e) => {
                this.draw(e);
              },
            },
          ]
        : [
            {
              z: r,
              draw: (e) => {
                (this.drawBackground(), this.drawGrid(e), this.drawTitle());
              },
            },
            {
              z: i,
              draw: () => {
                this.drawBorder();
              },
            },
            {
              z: n,
              draw: (e) => {
                this.drawLabels(e);
              },
            },
          ];
    }
    getMatchingVisibleMetas(e) {
      let t = this.chart.getSortedVisibleDatasetMetas(),
        n = this.axis + `AxisID`,
        r = [],
        i,
        a;
      for (i = 0, a = t.length; i < a; ++i) {
        let a = t[i];
        a[n] === this.id && (!e || a.type === e) && r.push(a);
      }
      return r;
    }
    _resolveTickFontOptions(e) {
      return Z(this.options.ticks.setContext(this.getContext(e)).font);
    }
    _maxDigits() {
      let e = this._resolveTickFontOptions(0).lineHeight;
      return (this.isHorizontal() ? this.width : this.height) / e;
    }
  },
  _o = class {
    constructor(e, t, n) {
      ((this.type = e),
        (this.scope = t),
        (this.override = n),
        (this.items = Object.create(null)));
    }
    isForType(e) {
      return Object.prototype.isPrototypeOf.call(
        this.type.prototype,
        e.prototype,
      );
    }
    register(e) {
      let t = Object.getPrototypeOf(e),
        n;
      bo(t) && (n = this.register(t));
      let r = this.items,
        i = e.id,
        a = this.scope + `.` + i;
      if (!i) throw Error(`class does not have id: ` + e);
      return i in r
        ? a
        : ((r[i] = e),
          vo(e, a, n),
          this.override && Y.override(e.id, e.overrides),
          a);
    }
    get(e) {
      return this.items[e];
    }
    unregister(e) {
      let t = this.items,
        n = e.id,
        r = this.scope;
      (n in t && delete t[n],
        r && n in Y[r] && (delete Y[r][n], this.override && delete _n[n]));
    }
  };
function vo(e, t, n) {
  let r = tt(Object.create(null), [n ? Y.get(n) : {}, Y.get(t), e.defaults]);
  (Y.set(t, r),
    e.defaultRoutes && yo(t, e.defaultRoutes),
    e.descriptors && Y.describe(t, e.descriptors));
}
function yo(e, t) {
  Object.keys(t).forEach((n) => {
    let r = n.split(`.`),
      i = r.pop(),
      a = [e].concat(r).join(`.`),
      o = t[n].split(`.`),
      s = o.pop(),
      c = o.join(`.`);
    Y.route(a, i, c, s);
  });
}
function bo(e) {
  return `id` in e && `defaults` in e;
}
var xo = new (class {
    constructor() {
      ((this.controllers = new _o(Pi, `datasets`, !0)),
        (this.elements = new _o(Ya, `elements`)),
        (this.plugins = new _o(Object, `plugins`)),
        (this.scales = new _o(go, `scales`)),
        (this._typedRegistries = [
          this.controllers,
          this.scales,
          this.elements,
        ]));
    }
    add(...e) {
      this._each(`register`, e);
    }
    remove(...e) {
      this._each(`unregister`, e);
    }
    addControllers(...e) {
      this._each(`register`, e, this.controllers);
    }
    addElements(...e) {
      this._each(`register`, e, this.elements);
    }
    addPlugins(...e) {
      this._each(`register`, e, this.plugins);
    }
    addScales(...e) {
      this._each(`register`, e, this.scales);
    }
    getController(e) {
      return this._get(e, this.controllers, `controller`);
    }
    getElement(e) {
      return this._get(e, this.elements, `element`);
    }
    getPlugin(e) {
      return this._get(e, this.plugins, `plugin`);
    }
    getScale(e) {
      return this._get(e, this.scales, `scale`);
    }
    removeControllers(...e) {
      this._each(`unregister`, e, this.controllers);
    }
    removeElements(...e) {
      this._each(`unregister`, e, this.elements);
    }
    removePlugins(...e) {
      this._each(`unregister`, e, this.plugins);
    }
    removeScales(...e) {
      this._each(`unregister`, e, this.scales);
    }
    _each(e, t, n) {
      [...t].forEach((t) => {
        let r = n || this._getRegistryForType(t);
        n || r.isForType(t) || (r === this.plugins && t.id)
          ? this._exec(e, r, t)
          : U(t, (t) => {
              let r = n || this._getRegistryForType(t);
              this._exec(e, r, t);
            });
      });
    }
    _exec(e, t, n) {
      let r = ct(e);
      (H(n[`before` + r], [], n), t[e](n), H(n[`after` + r], [], n));
    }
    _getRegistryForType(e) {
      for (let t = 0; t < this._typedRegistries.length; t++) {
        let n = this._typedRegistries[t];
        if (n.isForType(e)) return n;
      }
      return this.plugins;
    }
    _get(e, t, n) {
      let r = t.get(e);
      if (r === void 0)
        throw Error(`"` + e + `" is not a registered ` + n + `.`);
      return r;
    }
  })(),
  So = class {
    constructor() {
      this._init = void 0;
    }
    notify(e, t, n, r) {
      if (
        (t === `beforeInit` &&
          ((this._init = this._createDescriptors(e, !0)),
          this._notify(this._init, e, `install`)),
        this._init === void 0)
      )
        return;
      let i = r ? this._descriptors(e).filter(r) : this._descriptors(e),
        a = this._notify(i, e, t, n);
      return (
        t === `afterDestroy` &&
          (this._notify(i, e, `stop`),
          this._notify(this._init, e, `uninstall`),
          (this._init = void 0)),
        a
      );
    }
    _notify(e, t, n, r) {
      r ||= {};
      for (let i of e) {
        let e = i.plugin,
          a = e[n];
        if (H(a, [t, r, i.options], e) === !1 && r.cancelable) return !1;
      }
      return !0;
    }
    invalidate() {
      I(this._cache) ||
        ((this._oldCache = this._cache), (this._cache = void 0));
    }
    _descriptors(e) {
      if (this._cache) return this._cache;
      let t = (this._cache = this._createDescriptors(e));
      return (this._notifyStateChanges(e), t);
    }
    _createDescriptors(e, t) {
      let n = e && e.config,
        r = V(n.options && n.options.plugins, {}),
        i = Co(n);
      return r === !1 && !t ? [] : To(e, i, r, t);
    }
    _notifyStateChanges(e) {
      let t = this._oldCache || [],
        n = this._cache,
        r = (e, t) =>
          e.filter((e) => !t.some((t) => e.plugin.id === t.plugin.id));
      (this._notify(r(t, n), e, `stop`), this._notify(r(n, t), e, `start`));
    }
  };
function Co(e) {
  let t = {},
    n = [],
    r = Object.keys(xo.plugins.items);
  for (let e = 0; e < r.length; e++) n.push(xo.getPlugin(r[e]));
  let i = e.plugins || [];
  for (let e = 0; e < i.length; e++) {
    let r = i[e];
    n.indexOf(r) === -1 && (n.push(r), (t[r.id] = !0));
  }
  return { plugins: n, localIds: t };
}
function wo(e, t) {
  return !t && e === !1 ? null : e === !0 ? {} : e;
}
function To(e, { plugins: t, localIds: n }, r, i) {
  let a = [],
    o = e.getContext();
  for (let s of t) {
    let t = s.id,
      c = wo(r[t], i);
    c !== null &&
      a.push({
        plugin: s,
        options: Eo(e.config, { plugin: s, local: n[t] }, c, o),
      });
  }
  return a;
}
function Eo(e, { plugin: t, local: n }, r, i) {
  let a = e.pluginScopeKeys(t),
    o = e.getOptionScopes(r, a);
  return (
    n && t.defaults && o.push(t.defaults),
    e.createResolver(o, i, [``], { scriptable: !1, indexable: !1, allKeys: !0 })
  );
}
function Do(e, t) {
  let n = Y.datasets[e] || {};
  return (
    ((t.datasets || {})[e] || {}).indexAxis || t.indexAxis || n.indexAxis || `x`
  );
}
function Oo(e, t) {
  let n = e;
  return (
    e === `_index_` ? (n = t) : e === `_value_` && (n = t === `x` ? `y` : `x`),
    n
  );
}
function ko(e, t) {
  return e === t ? `_index_` : `_value_`;
}
function Ao(e) {
  if (e === `x` || e === `y` || e === `r`) return e;
}
function jo(e) {
  if (e === `top` || e === `bottom`) return `x`;
  if (e === `left` || e === `right`) return `y`;
}
function Mo(e, ...t) {
  if (Ao(e)) return e;
  for (let n of t) {
    let t =
      n.axis || jo(n.position) || (e.length > 1 && Ao(e[0].toLowerCase()));
    if (t) return t;
  }
  throw Error(
    `Cannot determine type of '${e}' axis. Please provide 'axis' or 'position' option.`,
  );
}
function No(e, t, n) {
  if (n[t + `AxisID`] === e) return { axis: t };
}
function Po(e, t) {
  if (t.data && t.data.datasets) {
    let n = t.data.datasets.filter((t) => t.xAxisID === e || t.yAxisID === e);
    if (n.length) return No(e, `x`, n[0]) || No(e, `y`, n[0]);
  }
  return {};
}
function Fo(e, t) {
  let n = _n[e.type] || { scales: {} },
    r = t.scales || {},
    i = Do(e.type, t),
    a = Object.create(null);
  return (
    Object.keys(r).forEach((t) => {
      let o = r[t];
      if (!R(o))
        return console.error(`Invalid scale configuration for scale: ${t}`);
      if (o._proxy)
        return console.warn(
          `Ignoring resolver passed as options for scale: ${t}`,
        );
      let s = Mo(t, o, Po(t, e), Y.scales[o.type]),
        c = ko(s, i),
        l = n.scales || {};
      a[t] = nt(Object.create(null), [{ axis: s }, o, l[s], l[c]]);
    }),
    e.data.datasets.forEach((n) => {
      let i = n.type || e.type,
        o = n.indexAxis || Do(i, t),
        s = (_n[i] || {}).scales || {};
      Object.keys(s).forEach((e) => {
        let t = Oo(e, o),
          i = n[t + `AxisID`] || t;
        ((a[i] = a[i] || Object.create(null)),
          nt(a[i], [{ axis: t }, r[i], s[e]]));
      });
    }),
    Object.keys(a).forEach((e) => {
      let t = a[e];
      nt(t, [Y.scales[t.type], Y.scale]);
    }),
    a
  );
}
function Io(e) {
  let t = (e.options ||= {});
  ((t.plugins = V(t.plugins, {})), (t.scales = Fo(e, t)));
}
function Lo(e) {
  return (
    (e ||= {}),
    (e.datasets = e.datasets || []),
    (e.labels = e.labels || []),
    e
  );
}
function Ro(e) {
  return ((e ||= {}), (e.data = Lo(e.data)), Io(e), e);
}
var zo = new Map(),
  Bo = new Set();
function Vo(e, t) {
  let n = zo.get(e);
  return (n || ((n = t()), zo.set(e, n), Bo.add(n)), n);
}
var Ho = (e, t, n) => {
    let r = st(t, n);
    r !== void 0 && e.add(r);
  },
  Uo = class {
    constructor(e) {
      ((this._config = Ro(e)),
        (this._scopeCache = new Map()),
        (this._resolverCache = new Map()));
    }
    get platform() {
      return this._config.platform;
    }
    get type() {
      return this._config.type;
    }
    set type(e) {
      this._config.type = e;
    }
    get data() {
      return this._config.data;
    }
    set data(e) {
      this._config.data = Lo(e);
    }
    get options() {
      return this._config.options;
    }
    set options(e) {
      this._config.options = e;
    }
    get plugins() {
      return this._config.plugins;
    }
    update() {
      let e = this._config;
      (this.clearCache(), Io(e));
    }
    clearCache() {
      (this._scopeCache.clear(), this._resolverCache.clear());
    }
    datasetScopeKeys(e) {
      return Vo(e, () => [[`datasets.${e}`, ``]]);
    }
    datasetAnimationScopeKeys(e, t) {
      return Vo(`${e}.transition.${t}`, () => [
        [`datasets.${e}.transitions.${t}`, `transitions.${t}`],
        [`datasets.${e}`, ``],
      ]);
    }
    datasetElementScopeKeys(e, t) {
      return Vo(`${e}-${t}`, () => [
        [`datasets.${e}.elements.${t}`, `datasets.${e}`, `elements.${t}`, ``],
      ]);
    }
    pluginScopeKeys(e) {
      let t = e.id,
        n = this.type;
      return Vo(`${n}-plugin-${t}`, () => [
        [`plugins.${t}`, ...(e.additionalOptionScopes || [])],
      ]);
    }
    _cachedScopes(e, t) {
      let n = this._scopeCache,
        r = n.get(e);
      return ((!r || t) && ((r = new Map()), n.set(e, r)), r);
    }
    getOptionScopes(e, t, n) {
      let { options: r, type: i } = this,
        a = this._cachedScopes(e, n),
        o = a.get(t);
      if (o) return o;
      let s = new Set();
      t.forEach((t) => {
        (e && (s.add(e), t.forEach((t) => Ho(s, e, t))),
          t.forEach((e) => Ho(s, r, e)),
          t.forEach((e) => Ho(s, _n[i] || {}, e)),
          t.forEach((e) => Ho(s, Y, e)),
          t.forEach((e) => Ho(s, vn, e)));
      });
      let c = Array.from(s);
      return (
        c.length === 0 && c.push(Object.create(null)),
        Bo.has(t) && a.set(t, c),
        c
      );
    }
    chartOptionScopes() {
      let { options: e, type: t } = this;
      return [e, _n[t] || {}, Y.datasets[t] || {}, { type: t }, Y, vn];
    }
    resolveNamedOptions(e, t, n, r = [``]) {
      let i = { $shared: !0 },
        { resolver: a, subPrefixes: o } = Wo(this._resolverCache, e, r),
        s = a;
      if (Ko(a, t)) {
        ((i.$shared = !1), (n = ut(n) ? n() : n));
        let t = this.createResolver(e, n, o);
        s = Yn(a, n, t);
      }
      for (let e of t) i[e] = s[e];
      return i;
    }
    createResolver(e, t, n = [``], r) {
      let { resolver: i } = Wo(this._resolverCache, e, n);
      return R(t) ? Yn(i, t, void 0, r) : i;
    }
  };
function Wo(e, t, n) {
  let r = e.get(t);
  r || ((r = new Map()), e.set(t, r));
  let i = n.join(),
    a = r.get(i);
  return (
    a ||
      ((a = {
        resolver: Jn(t, n),
        subPrefixes: n.filter((e) => !e.toLowerCase().includes(`hover`)),
      }),
      r.set(i, a)),
    a
  );
}
var Go = (e) => R(e) && Object.getOwnPropertyNames(e).some((t) => ut(e[t]));
function Ko(e, t) {
  let { isScriptable: n, isIndexable: r } = Xn(e);
  for (let i of t) {
    let t = n(i),
      a = r(i),
      o = (a || t) && e[i];
    if ((t && (ut(o) || Go(o))) || (a && L(o))) return !0;
  }
  return !1;
}
var qo = `4.5.1`,
  Jo = [`top`, `bottom`, `left`, `right`, `chartArea`];
function Yo(e, t) {
  return e === `top` || e === `bottom` || (Jo.indexOf(e) === -1 && t === `x`);
}
function Xo(e, t) {
  return function (n, r) {
    return n[e] === r[e] ? n[t] - r[t] : n[e] - r[e];
  };
}
function Zo(e) {
  let t = e.chart,
    n = t.options.animation;
  (t.notifyPlugins(`afterRender`), H(n && n.onComplete, [e], t));
}
function Qo(e) {
  let t = e.chart,
    n = t.options.animation;
  H(n && n.onProgress, [e], t);
}
function $o(e) {
  return (
    Cr() && typeof e == `string`
      ? (e = document.getElementById(e))
      : e && e.length && (e = e[0]),
    e && e.canvas && (e = e.canvas),
    e
  );
}
var es = {},
  ts = (e) => {
    let t = $o(e);
    return Object.values(es)
      .filter((e) => e.canvas === t)
      .pop();
  };
function ns(e, t, n) {
  let r = Object.keys(e);
  for (let i of r) {
    let r = +i;
    if (r >= t) {
      let a = e[i];
      (delete e[i], (n > 0 || r > t) && (e[r + n] = a));
    }
  }
}
function rs(e, t, n, r) {
  return !n || e.type === `mouseout` ? null : r ? t : e;
}
var is = class {
  static defaults = Y;
  static instances = es;
  static overrides = _n;
  static registry = xo;
  static version = qo;
  static getChart = ts;
  static register(...e) {
    (xo.add(...e), as());
  }
  static unregister(...e) {
    (xo.remove(...e), as());
  }
  constructor(e, t) {
    let n = (this.config = new Uo(t)),
      r = $o(e),
      i = ts(r);
    if (i)
      throw Error(
        `Canvas is already in use. Chart with ID '` +
          i.id +
          `' must be destroyed before the canvas with ID '` +
          i.canvas.id +
          `' can be reused.`,
      );
    let a = n.createResolver(n.chartOptionScopes(), this.getContext());
    ((this.platform = new (n.platform || Ja(r))()),
      this.platform.updateConfig(n));
    let o = this.platform.acquireContext(r, a.aspectRatio),
      s = o && o.canvas,
      c = s && s.height,
      l = s && s.width;
    if (
      ((this.id = Ye()),
      (this.ctx = o),
      (this.canvas = s),
      (this.width = l),
      (this.height = c),
      (this._options = a),
      (this._aspectRatio = this.aspectRatio),
      (this._layers = []),
      (this._metasets = []),
      (this._stacks = void 0),
      (this.boxes = []),
      (this.currentDevicePixelRatio = void 0),
      (this.chartArea = void 0),
      (this._active = []),
      (this._lastEvent = void 0),
      (this._listeners = {}),
      (this._responsiveListeners = void 0),
      (this._sortedMetasets = []),
      (this.scales = {}),
      (this._plugins = new So()),
      (this.$proxies = {}),
      (this._hiddenIndices = {}),
      (this.attached = !1),
      (this._animationsDisabled = void 0),
      (this.$context = void 0),
      (this._doResize = Kt((e) => this.update(e), a.resizeDelay || 0)),
      (this._dataChanges = []),
      (es[this.id] = this),
      !o || !s)
    ) {
      console.error(
        `Failed to create chart: can't acquire context from the given item`,
      );
      return;
    }
    (ci.listen(this, `complete`, Zo),
      ci.listen(this, `progress`, Qo),
      this._initialize(),
      this.attached && this.update());
  }
  get aspectRatio() {
    let {
      options: { aspectRatio: e, maintainAspectRatio: t },
      width: n,
      height: r,
      _aspectRatio: i,
    } = this;
    return I(e) ? (t && i ? i : r ? n / r : null) : e;
  }
  get data() {
    return this.config.data;
  }
  set data(e) {
    this.config.data = e;
  }
  get options() {
    return this._options;
  }
  set options(e) {
    this.config.options = e;
  }
  get registry() {
    return xo;
  }
  _initialize() {
    return (
      this.notifyPlugins(`beforeInit`),
      this.options.responsive
        ? this.resize()
        : Ir(this, this.options.devicePixelRatio),
      this.bindEvents(),
      this.notifyPlugins(`afterInit`),
      this
    );
  }
  clear() {
    return (Tn(this.canvas, this.ctx), this);
  }
  stop() {
    return (ci.stop(this), this);
  }
  resize(e, t) {
    ci.running(this)
      ? (this._resizeBeforeDraw = { width: e, height: t })
      : this._resize(e, t);
  }
  _resize(e, t) {
    let n = this.options,
      r = this.canvas,
      i = n.maintainAspectRatio && this.aspectRatio,
      a = this.platform.getMaximumSize(r, e, t, i),
      o = n.devicePixelRatio || this.platform.getDevicePixelRatio(),
      s = this.width ? `resize` : `attach`;
    ((this.width = a.width),
      (this.height = a.height),
      (this._aspectRatio = this.aspectRatio),
      Ir(this, o, !0) &&
        (this.notifyPlugins(`resize`, { size: a }),
        H(n.onResize, [this, a], this),
        this.attached && this._doResize(s) && this.render()));
  }
  ensureScalesHaveIDs() {
    U(this.options.scales || {}, (e, t) => {
      e.id = t;
    });
  }
  buildOrUpdateScales() {
    let e = this.options,
      t = e.scales,
      n = this.scales,
      r = Object.keys(n).reduce((e, t) => ((e[t] = !1), e), {}),
      i = [];
    (t &&
      (i = i.concat(
        Object.keys(t).map((e) => {
          let n = t[e],
            r = Mo(e, n),
            i = r === `r`,
            a = r === `x`;
          return {
            options: n,
            dposition: i ? `chartArea` : a ? `bottom` : `left`,
            dtype: i ? `radialLinear` : a ? `category` : `linear`,
          };
        }),
      )),
      U(i, (t) => {
        let i = t.options,
          a = i.id,
          o = Mo(a, i),
          s = V(i.type, t.dtype);
        ((i.position === void 0 || Yo(i.position, o) !== Yo(t.dposition)) &&
          (i.position = t.dposition),
          (r[a] = !0));
        let c = null;
        (a in n && n[a].type === s
          ? (c = n[a])
          : ((c = new (xo.getScale(s))({
              id: a,
              type: s,
              ctx: this.ctx,
              chart: this,
            })),
            (n[c.id] = c)),
          c.init(i, e));
      }),
      U(r, (e, t) => {
        e || delete n[t];
      }),
      U(n, (e) => {
        (Ta.configure(this, e, e.options), Ta.addBox(this, e));
      }));
  }
  _updateMetasets() {
    let e = this._metasets,
      t = this.data.datasets.length,
      n = e.length;
    if ((e.sort((e, t) => e.index - t.index), n > t)) {
      for (let e = t; e < n; ++e) this._destroyDatasetMeta(e);
      e.splice(t, n - t);
    }
    this._sortedMetasets = e.slice(0).sort(Xo(`order`, `index`));
  }
  _removeUnreferencedMetasets() {
    let {
      _metasets: e,
      data: { datasets: t },
    } = this;
    (e.length > t.length && delete this._stacks,
      e.forEach((e, n) => {
        t.filter((t) => t === e._dataset).length === 0 &&
          this._destroyDatasetMeta(n);
      }));
  }
  buildOrUpdateControllers() {
    let e = [],
      t = this.data.datasets,
      n,
      r;
    for (this._removeUnreferencedMetasets(), n = 0, r = t.length; n < r; n++) {
      let r = t[n],
        i = this.getDatasetMeta(n),
        a = r.type || this.config.type;
      if (
        (i.type &&
          i.type !== a &&
          (this._destroyDatasetMeta(n), (i = this.getDatasetMeta(n))),
        (i.type = a),
        (i.indexAxis = r.indexAxis || Do(a, this.options)),
        (i.order = r.order || 0),
        (i.index = n),
        (i.label = `` + r.label),
        (i.visible = this.isDatasetVisible(n)),
        i.controller)
      )
        (i.controller.updateIndex(n), i.controller.linkScales());
      else {
        let t = xo.getController(a),
          { datasetElementType: r, dataElementType: o } = Y.datasets[a];
        (Object.assign(t, {
          dataElementType: xo.getElement(o),
          datasetElementType: r && xo.getElement(r),
        }),
          (i.controller = new t(this, n)),
          e.push(i.controller));
      }
    }
    return (this._updateMetasets(), e);
  }
  _resetElements() {
    U(
      this.data.datasets,
      (e, t) => {
        this.getDatasetMeta(t).controller.reset();
      },
      this,
    );
  }
  reset() {
    (this._resetElements(), this.notifyPlugins(`reset`));
  }
  update(e) {
    let t = this.config;
    t.update();
    let n = (this._options = t.createResolver(
        t.chartOptionScopes(),
        this.getContext(),
      )),
      r = (this._animationsDisabled = !n.animation);
    if (
      (this._updateScales(),
      this._checkEventBindings(),
      this._updateHiddenIndices(),
      this._plugins.invalidate(),
      this.notifyPlugins(`beforeUpdate`, { mode: e, cancelable: !0 }) === !1)
    )
      return;
    let i = this.buildOrUpdateControllers();
    this.notifyPlugins(`beforeElementsUpdate`);
    let a = 0;
    for (let e = 0, t = this.data.datasets.length; e < t; e++) {
      let { controller: t } = this.getDatasetMeta(e),
        n = !r && i.indexOf(t) === -1;
      (t.buildOrUpdateElements(n), (a = Math.max(+t.getMaxOverflow(), a)));
    }
    ((a = this._minPadding = n.layout.autoPadding ? a : 0),
      this._updateLayout(a),
      r ||
        U(i, (e) => {
          e.reset();
        }),
      this._updateDatasets(e),
      this.notifyPlugins(`afterUpdate`, { mode: e }),
      this._layers.sort(Xo(`z`, `_idx`)));
    let { _active: o, _lastEvent: s } = this;
    (s
      ? this._eventHandler(s, !0)
      : o.length && this._updateHoverStyles(o, o, !0),
      this.render());
  }
  _updateScales() {
    (U(this.scales, (e) => {
      Ta.removeBox(this, e);
    }),
      this.ensureScalesHaveIDs(),
      this.buildOrUpdateScales());
  }
  _checkEventBindings() {
    let e = this.options;
    (!dt(new Set(Object.keys(this._listeners)), new Set(e.events)) ||
      !!this._responsiveListeners !== e.responsive) &&
      (this.unbindEvents(), this.bindEvents());
  }
  _updateHiddenIndices() {
    let { _hiddenIndices: e } = this,
      t = this._getUniformDataChanges() || [];
    for (let { method: n, start: r, count: i } of t)
      ns(e, r, n === `_removeElements` ? -i : i);
  }
  _getUniformDataChanges() {
    let e = this._dataChanges;
    if (!e || !e.length) return;
    this._dataChanges = [];
    let t = this.data.datasets.length,
      n = (t) =>
        new Set(
          e
            .filter((e) => e[0] === t)
            .map((e, t) => t + `,` + e.splice(1).join(`,`)),
        ),
      r = n(0);
    for (let e = 1; e < t; e++) if (!dt(r, n(e))) return;
    return Array.from(r)
      .map((e) => e.split(`,`))
      .map((e) => ({ method: e[1], start: +e[2], count: +e[3] }));
  }
  _updateLayout(e) {
    if (this.notifyPlugins(`beforeLayout`, { cancelable: !0 }) === !1) return;
    Ta.update(this, this.width, this.height, e);
    let t = this.chartArea,
      n = t.width <= 0 || t.height <= 0;
    ((this._layers = []),
      U(
        this.boxes,
        (e) => {
          (n && e.position === `chartArea`) ||
            (e.configure && e.configure(), this._layers.push(...e._layers()));
        },
        this,
      ),
      this._layers.forEach((e, t) => {
        e._idx = t;
      }),
      this.notifyPlugins(`afterLayout`));
  }
  _updateDatasets(e) {
    if (
      this.notifyPlugins(`beforeDatasetsUpdate`, {
        mode: e,
        cancelable: !0,
      }) !== !1
    ) {
      for (let e = 0, t = this.data.datasets.length; e < t; ++e)
        this.getDatasetMeta(e).controller.configure();
      for (let t = 0, n = this.data.datasets.length; t < n; ++t)
        this._updateDataset(t, ut(e) ? e({ datasetIndex: t }) : e);
      this.notifyPlugins(`afterDatasetsUpdate`, { mode: e });
    }
  }
  _updateDataset(e, t) {
    let n = this.getDatasetMeta(e),
      r = { meta: n, index: e, mode: t, cancelable: !0 };
    this.notifyPlugins(`beforeDatasetUpdate`, r) !== !1 &&
      (n.controller._update(t),
      (r.cancelable = !1),
      this.notifyPlugins(`afterDatasetUpdate`, r));
  }
  render() {
    this.notifyPlugins(`beforeRender`, { cancelable: !0 }) !== !1 &&
      (ci.has(this)
        ? this.attached && !ci.running(this) && ci.start(this)
        : (this.draw(), Zo({ chart: this })));
  }
  draw() {
    let e;
    if (this._resizeBeforeDraw) {
      let { width: e, height: t } = this._resizeBeforeDraw;
      ((this._resizeBeforeDraw = null), this._resize(e, t));
    }
    if (
      (this.clear(),
      this.width <= 0 ||
        this.height <= 0 ||
        this.notifyPlugins(`beforeDraw`, { cancelable: !0 }) === !1)
    )
      return;
    let t = this._layers;
    for (e = 0; e < t.length && t[e].z <= 0; ++e) t[e].draw(this.chartArea);
    for (this._drawDatasets(); e < t.length; ++e) t[e].draw(this.chartArea);
    this.notifyPlugins(`afterDraw`);
  }
  _getSortedDatasetMetas(e) {
    let t = this._sortedMetasets,
      n = [],
      r,
      i;
    for (r = 0, i = t.length; r < i; ++r) {
      let i = t[r];
      (!e || i.visible) && n.push(i);
    }
    return n;
  }
  getSortedVisibleDatasetMetas() {
    return this._getSortedDatasetMetas(!0);
  }
  _drawDatasets() {
    if (this.notifyPlugins(`beforeDatasetsDraw`, { cancelable: !0 }) === !1)
      return;
    let e = this.getSortedVisibleDatasetMetas();
    for (let t = e.length - 1; t >= 0; --t) this._drawDataset(e[t]);
    this.notifyPlugins(`afterDatasetsDraw`);
  }
  _drawDataset(e) {
    let t = this.ctx,
      n = { meta: e, index: e.index, cancelable: !0 },
      r = si(this, e);
    this.notifyPlugins(`beforeDatasetDraw`, n) !== !1 &&
      (r && kn(t, r),
      e.controller.draw(),
      r && An(t),
      (n.cancelable = !1),
      this.notifyPlugins(`afterDatasetDraw`, n));
  }
  isPointInArea(e) {
    return On(e, this.chartArea, this._minPadding);
  }
  getElementsAtEventForMode(e, t, n, r) {
    let i = ca.modes[t];
    return typeof i == `function` ? i(this, e, n, r) : [];
  }
  getDatasetMeta(e) {
    let t = this.data.datasets[e],
      n = this._metasets,
      r = n.filter((e) => e && e._dataset === t).pop();
    return (
      r ||
        ((r = {
          type: null,
          data: [],
          dataset: null,
          controller: null,
          hidden: null,
          xAxisID: null,
          yAxisID: null,
          order: (t && t.order) || 0,
          index: e,
          _dataset: t,
          _parsed: [],
          _sorted: !1,
        }),
        n.push(r)),
      r
    );
  }
  getContext() {
    return (this.$context ||= qn(null, { chart: this, type: `chart` }));
  }
  getVisibleDatasetCount() {
    return this.getSortedVisibleDatasetMetas().length;
  }
  isDatasetVisible(e) {
    let t = this.data.datasets[e];
    if (!t) return !1;
    let n = this.getDatasetMeta(e);
    return typeof n.hidden == `boolean` ? !n.hidden : !t.hidden;
  }
  setDatasetVisibility(e, t) {
    let n = this.getDatasetMeta(e);
    n.hidden = !t;
  }
  toggleDataVisibility(e) {
    this._hiddenIndices[e] = !this._hiddenIndices[e];
  }
  getDataVisibility(e) {
    return !this._hiddenIndices[e];
  }
  _updateVisibility(e, t, n) {
    let r = n ? `show` : `hide`,
      i = this.getDatasetMeta(e),
      a = i.controller._resolveAnimations(void 0, r);
    lt(t)
      ? ((i.data[t].hidden = !n), this.update())
      : (this.setDatasetVisibility(e, n),
        a.update(i, { visible: n }),
        this.update((t) => (t.datasetIndex === e ? r : void 0)));
  }
  hide(e, t) {
    this._updateVisibility(e, t, !1);
  }
  show(e, t) {
    this._updateVisibility(e, t, !0);
  }
  _destroyDatasetMeta(e) {
    let t = this._metasets[e];
    (t && t.controller && t.controller._destroy(), delete this._metasets[e]);
  }
  _stop() {
    let e, t;
    for (
      this.stop(), ci.remove(this), e = 0, t = this.data.datasets.length;
      e < t;
      ++e
    )
      this._destroyDatasetMeta(e);
  }
  destroy() {
    this.notifyPlugins(`beforeDestroy`);
    let { canvas: e, ctx: t } = this;
    (this._stop(),
      this.config.clearCache(),
      e &&
        (this.unbindEvents(),
        Tn(e, t),
        this.platform.releaseContext(t),
        (this.canvas = null),
        (this.ctx = null)),
      delete es[this.id],
      this.notifyPlugins(`afterDestroy`));
  }
  toBase64Image(...e) {
    return this.canvas.toDataURL(...e);
  }
  bindEvents() {
    (this.bindUserEvents(),
      this.options.responsive
        ? this.bindResponsiveEvents()
        : (this.attached = !0));
  }
  bindUserEvents() {
    let e = this._listeners,
      t = this.platform,
      n = (n, r) => {
        (t.addEventListener(this, n, r), (e[n] = r));
      },
      r = (e, t, n) => {
        ((e.offsetX = t), (e.offsetY = n), this._eventHandler(e));
      };
    U(this.options.events, (e) => n(e, r));
  }
  bindResponsiveEvents() {
    this._responsiveListeners ||= {};
    let e = this._responsiveListeners,
      t = this.platform,
      n = (n, r) => {
        (t.addEventListener(this, n, r), (e[n] = r));
      },
      r = (n, r) => {
        e[n] && (t.removeEventListener(this, n, r), delete e[n]);
      },
      i = (e, t) => {
        this.canvas && this.resize(e, t);
      },
      a,
      o = () => {
        (r(`attach`, o),
          (this.attached = !0),
          this.resize(),
          n(`resize`, i),
          n(`detach`, a));
      };
    ((a = () => {
      ((this.attached = !1),
        r(`resize`, i),
        this._stop(),
        this._resize(0, 0),
        n(`attach`, o));
    }),
      t.isAttached(this.canvas) ? o() : a());
  }
  unbindEvents() {
    (U(this._listeners, (e, t) => {
      this.platform.removeEventListener(this, t, e);
    }),
      (this._listeners = {}),
      U(this._responsiveListeners, (e, t) => {
        this.platform.removeEventListener(this, t, e);
      }),
      (this._responsiveListeners = void 0));
  }
  updateHoverStyle(e, t, n) {
    let r = n ? `set` : `remove`,
      i,
      a,
      o,
      s;
    for (
      t === `dataset` &&
        ((i = this.getDatasetMeta(e[0].datasetIndex)),
        i.controller[`_` + r + `DatasetHoverStyle`]()),
        o = 0,
        s = e.length;
      o < s;
      ++o
    ) {
      a = e[o];
      let t = a && this.getDatasetMeta(a.datasetIndex).controller;
      t && t[r + `HoverStyle`](a.element, a.datasetIndex, a.index);
    }
  }
  getActiveElements() {
    return this._active || [];
  }
  setActiveElements(e) {
    let t = this._active || [],
      n = e.map(({ datasetIndex: e, index: t }) => {
        let n = this.getDatasetMeta(e);
        if (!n) throw Error(`No dataset found at index ` + e);
        return { datasetIndex: e, element: n.data[t], index: t };
      });
    Ze(n, t) ||
      ((this._active = n),
      (this._lastEvent = null),
      this._updateHoverStyles(n, t));
  }
  notifyPlugins(e, t, n) {
    return this._plugins.notify(this, e, t, n);
  }
  isPluginEnabled(e) {
    return this._plugins._cache.filter((t) => t.plugin.id === e).length === 1;
  }
  _updateHoverStyles(e, t, n) {
    let r = this.options.hover,
      i = (e, t) =>
        e.filter(
          (e) =>
            !t.some(
              (t) => e.datasetIndex === t.datasetIndex && e.index === t.index,
            ),
        ),
      a = i(t, e),
      o = n ? e : i(e, t);
    (a.length && this.updateHoverStyle(a, r.mode, !1),
      o.length && r.mode && this.updateHoverStyle(o, r.mode, !0));
  }
  _eventHandler(e, t) {
    let n = {
        event: e,
        replay: t,
        cancelable: !0,
        inChartArea: this.isPointInArea(e),
      },
      r = (t) =>
        (t.options.events || this.options.events).includes(e.native.type);
    if (this.notifyPlugins(`beforeEvent`, n, r) === !1) return;
    let i = this._handleEvent(e, t, n.inChartArea);
    return (
      (n.cancelable = !1),
      this.notifyPlugins(`afterEvent`, n, r),
      (i || n.changed) && this.render(),
      this
    );
  }
  _handleEvent(e, t, n) {
    let { _active: r = [], options: i } = this,
      a = t,
      o = this._getActiveElements(e, r, n, a),
      s = ft(e),
      c = rs(e, this._lastEvent, n, s);
    n &&
      ((this._lastEvent = null),
      H(i.onHover, [e, o, this], this),
      s && H(i.onClick, [e, o, this], this));
    let l = !Ze(o, r);
    return (
      (l || t) && ((this._active = o), this._updateHoverStyles(o, r, t)),
      (this._lastEvent = c),
      l
    );
  }
  _getActiveElements(e, t, n, r) {
    if (e.type === `mouseout`) return [];
    if (!n) return t;
    let i = this.options.hover;
    return this.getElementsAtEventForMode(e, i.mode, i, r);
  }
};
function as() {
  return U(is.instances, (e) => e._plugins.invalidate());
}
function os(e, t, n = t) {
  ((e.lineCap = V(n.borderCapStyle, t.borderCapStyle)),
    e.setLineDash(V(n.borderDash, t.borderDash)),
    (e.lineDashOffset = V(n.borderDashOffset, t.borderDashOffset)),
    (e.lineJoin = V(n.borderJoinStyle, t.borderJoinStyle)),
    (e.lineWidth = V(n.borderWidth, t.borderWidth)),
    (e.strokeStyle = V(n.borderColor, t.borderColor)));
}
function ss(e, t, n) {
  e.lineTo(n.x, n.y);
}
function cs(e) {
  return e.stepped
    ? jn
    : e.tension || e.cubicInterpolationMode === `monotone`
      ? Mn
      : ss;
}
function ls(e, t, n = {}) {
  let r = e.length,
    { start: i = 0, end: a = r - 1 } = n,
    { start: o, end: s } = t,
    c = Math.max(i, o),
    l = Math.min(a, s),
    u = (i < o && a < o) || (i > s && a > s);
  return {
    count: r,
    start: c,
    loop: t.loop,
    ilen: l < c && !u ? r + l - c : l - c,
  };
}
function us(e, t, n, r) {
  let { points: i, options: a } = t,
    { count: o, start: s, loop: c, ilen: l } = ls(i, n, r),
    u = cs(a),
    { move: d = !0, reverse: f } = r || {},
    p,
    m,
    h;
  for (p = 0; p <= l; ++p)
    ((m = i[(s + (f ? l - p : p)) % o]),
      !m.skip &&
        (d ? (e.moveTo(m.x, m.y), (d = !1)) : u(e, h, m, f, a.stepped),
        (h = m)));
  return (c && ((m = i[(s + (f ? l : 0)) % o]), u(e, h, m, f, a.stepped)), !!c);
}
function ds(e, t, n, r) {
  let i = t.points,
    { count: a, start: o, ilen: s } = ls(i, n, r),
    { move: c = !0, reverse: l } = r || {},
    u = 0,
    d = 0,
    f,
    p,
    m,
    h,
    g,
    _,
    v = (e) => (o + (l ? s - e : e)) % a,
    y = () => {
      h !== g && (e.lineTo(u, g), e.lineTo(u, h), e.lineTo(u, _));
    };
  for (c && ((p = i[v(0)]), e.moveTo(p.x, p.y)), f = 0; f <= s; ++f) {
    if (((p = i[v(f)]), p.skip)) continue;
    let t = p.x,
      n = p.y,
      r = t | 0;
    (r === m
      ? (n < h ? (h = n) : n > g && (g = n), (u = (d * u + t) / ++d))
      : (y(), e.lineTo(t, n), (m = r), (d = 0), (h = g = n)),
      (_ = n));
  }
  y();
}
function fs(e) {
  let t = e.options,
    n = t.borderDash && t.borderDash.length;
  return !e._decimated &&
    !e._loop &&
    !t.tension &&
    t.cubicInterpolationMode !== `monotone` &&
    !t.stepped &&
    !n
    ? ds
    : us;
}
function ps(e) {
  return e.stepped
    ? Br
    : e.tension || e.cubicInterpolationMode === `monotone`
      ? Vr
      : zr;
}
function ms(e, t, n, r) {
  let i = t._path;
  (i || ((i = t._path = new Path2D()), t.path(i, n, r) && i.closePath()),
    os(e, t.options),
    e.stroke(i));
}
function hs(e, t, n, r) {
  let { segments: i, options: a } = t,
    o = fs(t);
  for (let s of i)
    (os(e, a, s.style),
      e.beginPath(),
      o(e, t, s, { start: n, end: n + r - 1 }) && e.closePath(),
      e.stroke());
}
var gs = typeof Path2D == `function`;
function _s(e, t, n, r) {
  gs && !t.options.segment ? ms(e, t, n, r) : hs(e, t, n, r);
}
var vs = class extends Ya {
  static id = `line`;
  static defaults = {
    borderCapStyle: `butt`,
    borderDash: [],
    borderDashOffset: 0,
    borderJoinStyle: `miter`,
    borderWidth: 3,
    capBezierPoints: !0,
    cubicInterpolationMode: `default`,
    fill: !1,
    spanGaps: !1,
    stepped: !1,
    tension: 0,
  };
  static defaultRoutes = {
    backgroundColor: `backgroundColor`,
    borderColor: `borderColor`,
  };
  static descriptors = {
    _scriptable: !0,
    _indexable: (e) => e !== `borderDash` && e !== `fill`,
  };
  constructor(e) {
    (super(),
      (this.animated = !0),
      (this.options = void 0),
      (this._chart = void 0),
      (this._loop = void 0),
      (this._fullLoop = void 0),
      (this._path = void 0),
      (this._points = void 0),
      (this._segments = void 0),
      (this._decimated = !1),
      (this._pointsUpdated = !1),
      (this._datasetIndex = void 0),
      e && Object.assign(this, e));
  }
  updateControlPoints(e, t) {
    let n = this.options;
    if (
      (n.tension || n.cubicInterpolationMode === `monotone`) &&
      !n.stepped &&
      !this._pointsUpdated
    ) {
      let r = n.spanGaps ? this._loop : this._fullLoop;
      (Sr(this._points, n, e, r, t), (this._pointsUpdated = !0));
    }
  }
  set points(e) {
    ((this._points = e),
      delete this._segments,
      delete this._path,
      (this._pointsUpdated = !1));
  }
  get points() {
    return this._points;
  }
  get segments() {
    return (this._segments ||= ei(this, this.options.segment));
  }
  first() {
    let e = this.segments,
      t = this.points;
    return e.length && t[e[0].start];
  }
  last() {
    let e = this.segments,
      t = this.points,
      n = e.length;
    return n && t[e[n - 1].end];
  }
  interpolate(e, t) {
    let n = this.options,
      r = e[t],
      i = this.points,
      a = Zr(this, { property: t, start: r, end: r });
    if (!a.length) return;
    let o = [],
      s = ps(n),
      c,
      l;
    for (c = 0, l = a.length; c < l; ++c) {
      let { start: l, end: u } = a[c],
        d = i[l],
        f = i[u];
      if (d === f) {
        o.push(d);
        continue;
      }
      let p = s(d, f, Math.abs((r - d[t]) / (f[t] - d[t])), n.stepped);
      ((p[t] = e[t]), o.push(p));
    }
    return o.length === 1 ? o[0] : o;
  }
  pathSegment(e, t, n) {
    return fs(this)(e, this, t, n);
  }
  path(e, t, n) {
    let r = this.segments,
      i = fs(this),
      a = this._loop;
    ((t ||= 0), (n ||= this.points.length - t));
    for (let o of r) a &= i(e, this, o, { start: t, end: t + n - 1 });
    return !!a;
  }
  draw(e, t, n, r) {
    let i = this.options || {};
    ((this.points || []).length &&
      i.borderWidth &&
      (e.save(), _s(e, this, n, r), e.restore()),
      this.animated && ((this._pointsUpdated = !1), (this._path = void 0)));
  }
};
function ys(e, t, n, r) {
  let i = e.options,
    { [n]: a } = e.getProps([n], r);
  return Math.abs(t - a) < i.radius + i.hitRadius;
}
var bs = class extends Ya {
  static id = `point`;
  parsed;
  skip;
  stop;
  static defaults = {
    borderWidth: 1,
    hitRadius: 1,
    hoverBorderWidth: 1,
    hoverRadius: 4,
    pointStyle: `circle`,
    radius: 3,
    rotation: 0,
  };
  static defaultRoutes = {
    backgroundColor: `backgroundColor`,
    borderColor: `borderColor`,
  };
  constructor(e) {
    (super(),
      (this.options = void 0),
      (this.parsed = void 0),
      (this.skip = void 0),
      (this.stop = void 0),
      e && Object.assign(this, e));
  }
  inRange(e, t, n) {
    let r = this.options,
      { x: i, y: a } = this.getProps([`x`, `y`], n);
    return (e - i) ** 2 + (t - a) ** 2 < (r.hitRadius + r.radius) ** 2;
  }
  inXRange(e, t) {
    return ys(this, e, `x`, t);
  }
  inYRange(e, t) {
    return ys(this, e, `y`, t);
  }
  getCenterPoint(e) {
    let { x: t, y: n } = this.getProps([`x`, `y`], e);
    return { x: t, y: n };
  }
  size(e) {
    e = e || this.options || {};
    let t = e.radius || 0;
    t = Math.max(t, (t && e.hoverRadius) || 0);
    let n = (t && e.borderWidth) || 0;
    return (t + n) * 2;
  }
  draw(e, t) {
    let n = this.options;
    this.skip ||
      n.radius < 0.1 ||
      !On(this, t, this.size(n) / 2) ||
      ((e.strokeStyle = n.borderColor),
      (e.lineWidth = n.borderWidth),
      (e.fillStyle = n.backgroundColor),
      En(e, n, this.x, this.y));
  }
  getRange() {
    let e = this.options || {};
    return e.radius + e.hitRadius;
  }
};
function xs(e, t) {
  let {
      x: n,
      y: r,
      base: i,
      width: a,
      height: o,
    } = e.getProps([`x`, `y`, `base`, `width`, `height`], t),
    s,
    c,
    l,
    u,
    d;
  return (
    e.horizontal
      ? ((d = o / 2),
        (s = Math.min(n, i)),
        (c = Math.max(n, i)),
        (l = r - d),
        (u = r + d))
      : ((d = a / 2),
        (s = n - d),
        (c = n + d),
        (l = Math.min(r, i)),
        (u = Math.max(r, i))),
    { left: s, top: l, right: c, bottom: u }
  );
}
function Ss(e, t, n, r) {
  return e ? 0 : J(t, n, r);
}
function Cs(e, t, n) {
  let r = e.options.borderWidth,
    i = e.borderSkipped,
    a = Un(r);
  return {
    t: Ss(i.top, a.top, 0, n),
    r: Ss(i.right, a.right, 0, t),
    b: Ss(i.bottom, a.bottom, 0, n),
    l: Ss(i.left, a.left, 0, t),
  };
}
function ws(e, t, n) {
  let { enableBorderRadius: r } = e.getProps([`enableBorderRadius`]),
    i = e.options.borderRadius,
    a = Wn(i),
    o = Math.min(t, n),
    s = e.borderSkipped,
    c = r || R(i);
  return {
    topLeft: Ss(!c || s.top || s.left, a.topLeft, 0, o),
    topRight: Ss(!c || s.top || s.right, a.topRight, 0, o),
    bottomLeft: Ss(!c || s.bottom || s.left, a.bottomLeft, 0, o),
    bottomRight: Ss(!c || s.bottom || s.right, a.bottomRight, 0, o),
  };
}
function Ts(e) {
  let t = xs(e),
    n = t.right - t.left,
    r = t.bottom - t.top,
    i = Cs(e, n / 2, r / 2),
    a = ws(e, n / 2, r / 2);
  return {
    outer: { x: t.left, y: t.top, w: n, h: r, radius: a },
    inner: {
      x: t.left + i.l,
      y: t.top + i.t,
      w: n - i.l - i.r,
      h: r - i.t - i.b,
      radius: {
        topLeft: Math.max(0, a.topLeft - Math.max(i.t, i.l)),
        topRight: Math.max(0, a.topRight - Math.max(i.t, i.r)),
        bottomLeft: Math.max(0, a.bottomLeft - Math.max(i.b, i.l)),
        bottomRight: Math.max(0, a.bottomRight - Math.max(i.b, i.r)),
      },
    },
  };
}
function Es(e, t, n, r) {
  let i = t === null,
    a = n === null,
    o = e && !(i && a) && xs(e, r);
  return o && (i || Ft(t, o.left, o.right)) && (a || Ft(n, o.top, o.bottom));
}
function Ds(e) {
  return e.topLeft || e.topRight || e.bottomLeft || e.bottomRight;
}
function Os(e, t) {
  e.rect(t.x, t.y, t.w, t.h);
}
function ks(e, t, n = {}) {
  let r = e.x === n.x ? 0 : -t,
    i = e.y === n.y ? 0 : -t,
    a = (e.x + e.w === n.x + n.w ? 0 : t) - r,
    o = (e.y + e.h === n.y + n.h ? 0 : t) - i;
  return { x: e.x + r, y: e.y + i, w: e.w + a, h: e.h + o, radius: e.radius };
}
var As = class extends Ya {
  static id = `bar`;
  static defaults = {
    borderSkipped: `start`,
    borderWidth: 0,
    borderRadius: 0,
    inflateAmount: `auto`,
    pointStyle: void 0,
  };
  static defaultRoutes = {
    backgroundColor: `backgroundColor`,
    borderColor: `borderColor`,
  };
  constructor(e) {
    (super(),
      (this.options = void 0),
      (this.horizontal = void 0),
      (this.base = void 0),
      (this.width = void 0),
      (this.height = void 0),
      (this.inflateAmount = void 0),
      e && Object.assign(this, e));
  }
  draw(e) {
    let {
        inflateAmount: t,
        options: { borderColor: n, backgroundColor: r },
      } = this,
      { inner: i, outer: a } = Ts(this),
      o = Ds(a.radius) ? Ln : Os;
    (e.save(),
      (a.w !== i.w || a.h !== i.h) &&
        (e.beginPath(),
        o(e, ks(a, t, i)),
        e.clip(),
        o(e, ks(i, -t, a)),
        (e.fillStyle = n),
        e.fill(`evenodd`)),
      e.beginPath(),
      o(e, ks(i, t)),
      (e.fillStyle = r),
      e.fill(),
      e.restore());
  }
  inRange(e, t, n) {
    return Es(this, e, t, n);
  }
  inXRange(e, t) {
    return Es(this, e, null, t);
  }
  inYRange(e, t) {
    return Es(this, null, e, t);
  }
  getCenterPoint(e) {
    let {
      x: t,
      y: n,
      base: r,
      horizontal: i,
    } = this.getProps([`x`, `y`, `base`, `horizontal`], e);
    return { x: i ? (t + r) / 2 : t, y: i ? n : (n + r) / 2 };
  }
  getRange(e) {
    return e === `x` ? this.width / 2 : this.height / 2;
  }
};
function js(e, t, n) {
  let r = e.segments,
    i = e.points,
    a = t.points,
    o = [];
  for (let e of r) {
    let { start: r, end: s } = e;
    s = Ps(r, s, i);
    let c = Ms(n, i[r], i[s], e.loop);
    if (!t.segments) {
      o.push({ source: e, target: c, start: i[r], end: i[s] });
      continue;
    }
    let l = Zr(t, c);
    for (let t of l) {
      let r = Ms(n, a[t.start], a[t.end], t.loop),
        s = Xr(e, i, r);
      for (let e of s)
        o.push({
          source: e,
          target: t,
          start: { [n]: Fs(c, r, `start`, Math.max) },
          end: { [n]: Fs(c, r, `end`, Math.min) },
        });
    }
  }
  return o;
}
function Ms(e, t, n, r) {
  if (r) return;
  let i = t[e],
    a = n[e];
  return (
    e === `angle` && ((i = q(i)), (a = q(a))),
    { property: e, start: i, end: a }
  );
}
function Ns(e, t) {
  let { x: n = null, y: r = null } = e || {},
    i = t.points,
    a = [];
  return (
    t.segments.forEach(({ start: e, end: t }) => {
      t = Ps(e, t, i);
      let o = i[e],
        s = i[t];
      r === null
        ? n !== null && (a.push({ x: n, y: o.y }), a.push({ x: n, y: s.y }))
        : (a.push({ x: o.x, y: r }), a.push({ x: s.x, y: r }));
    }),
    a
  );
}
function Ps(e, t, n) {
  for (; t > e; t--) {
    let e = n[t];
    if (!isNaN(e.x) && !isNaN(e.y)) break;
  }
  return t;
}
function Fs(e, t, n, r) {
  return e && t ? r(e[n], t[n]) : e ? e[n] : t ? t[n] : 0;
}
function Is(e, t) {
  let n = [],
    r = !1;
  return (
    L(e) ? ((r = !0), (n = e)) : (n = Ns(e, t)),
    n.length
      ? new vs({ points: n, options: { tension: 0 }, _loop: r, _fullLoop: r })
      : null
  );
}
function Ls(e) {
  return e && e.fill !== !1;
}
function Rs(e, t, n) {
  let r = e[t].fill,
    i = [t],
    a;
  if (!n) return r;
  for (; r !== !1 && i.indexOf(r) === -1; ) {
    if (!z(r)) return r;
    if (((a = e[r]), !a)) return !1;
    if (a.visible) return r;
    (i.push(r), (r = a.fill));
  }
  return !1;
}
function zs(e, t, n) {
  let r = Us(e);
  if (R(r)) return isNaN(r.value) ? !1 : r;
  let i = parseFloat(r);
  return z(i) && Math.floor(i) === i
    ? Bs(r[0], t, i, n)
    : [`origin`, `start`, `end`, `stack`, `shape`].indexOf(r) >= 0 && r;
}
function Bs(e, t, n, r) {
  return (
    (e === `-` || e === `+`) && (n = t + n),
    n === t || n < 0 || n >= r ? !1 : n
  );
}
function Vs(e, t) {
  let n = null;
  return (
    e === `start`
      ? (n = t.bottom)
      : e === `end`
        ? (n = t.top)
        : R(e)
          ? (n = t.getPixelForValue(e.value))
          : t.getBasePixel && (n = t.getBasePixel()),
    n
  );
}
function Hs(e, t, n) {
  let r;
  return (
    (r =
      e === `start`
        ? n
        : e === `end`
          ? t.options.reverse
            ? t.min
            : t.max
          : R(e)
            ? e.value
            : t.getBaseValue()),
    r
  );
}
function Us(e) {
  let t = e.options,
    n = t.fill,
    r = V(n && n.target, n);
  return (
    r === void 0 && (r = !!t.backgroundColor),
    r === !1 || r === null ? !1 : r === !0 ? `origin` : r
  );
}
function Ws(e) {
  let { scale: t, index: n, line: r } = e,
    i = [],
    a = r.segments,
    o = r.points,
    s = Gs(t, n);
  s.push(Is({ x: null, y: t.bottom }, r));
  for (let e = 0; e < a.length; e++) {
    let t = a[e];
    for (let e = t.start; e <= t.end; e++) Ks(i, o[e], s);
  }
  return new vs({ points: i, options: {} });
}
function Gs(e, t) {
  let n = [],
    r = e.getMatchingVisibleMetas(`line`);
  for (let e = 0; e < r.length; e++) {
    let i = r[e];
    if (i.index === t) break;
    i.hidden || n.unshift(i.dataset);
  }
  return n;
}
function Ks(e, t, n) {
  let r = [];
  for (let i = 0; i < n.length; i++) {
    let a = n[i],
      { first: o, last: s, point: c } = qs(a, t, `x`);
    if (!(!c || (o && s))) {
      if (o) r.unshift(c);
      else if ((e.push(c), !s)) break;
    }
  }
  e.push(...r);
}
function qs(e, t, n) {
  let r = e.interpolate(t, n);
  if (!r) return {};
  let i = r[n],
    a = e.segments,
    o = e.points,
    s = !1,
    c = !1;
  for (let e = 0; e < a.length; e++) {
    let t = a[e],
      r = o[t.start][n],
      l = o[t.end][n];
    if (Ft(i, r, l)) {
      ((s = i === r), (c = i === l));
      break;
    }
  }
  return { first: s, last: c, point: r };
}
var Js = class {
  constructor(e) {
    ((this.x = e.x), (this.y = e.y), (this.radius = e.radius));
  }
  pathSegment(e, t, n) {
    let { x: r, y: i, radius: a } = this;
    return (
      (t ||= { start: 0, end: G }),
      e.arc(r, i, a, t.end, t.start, !0),
      !n.bounds
    );
  }
  interpolate(e) {
    let { x: t, y: n, radius: r } = this,
      i = e.angle;
    return { x: t + Math.cos(i) * r, y: n + Math.sin(i) * r, angle: i };
  }
};
function Ys(e) {
  let { chart: t, fill: n, line: r } = e;
  if (z(n)) return Xs(t, n);
  if (n === `stack`) return Ws(e);
  if (n === `shape`) return !0;
  let i = Zs(e);
  return i instanceof Js ? i : Is(i, r);
}
function Xs(e, t) {
  let n = e.getDatasetMeta(t);
  return n && e.isDatasetVisible(t) ? n.dataset : null;
}
function Zs(e) {
  return (e.scale || {}).getPointPositionForValue ? $s(e) : Qs(e);
}
function Qs(e) {
  let { scale: t = {}, fill: n } = e,
    r = Vs(n, t);
  if (z(r)) {
    let e = t.isHorizontal();
    return { x: e ? r : null, y: e ? null : r };
  }
  return null;
}
function $s(e) {
  let { scale: t, fill: n } = e,
    r = t.options,
    i = t.getLabels().length,
    a = r.reverse ? t.max : t.min,
    o = Hs(n, t, a),
    s = [];
  if (r.grid.circular) {
    let e = t.getPointPositionForValue(0, a);
    return new Js({
      x: e.x,
      y: e.y,
      radius: t.getDistanceFromCenterForValue(o),
    });
  }
  for (let e = 0; e < i; ++e) s.push(t.getPointPositionForValue(e, o));
  return s;
}
function ec(e, t, n) {
  let r = Ys(t),
    { chart: i, index: a, line: o, scale: s, axis: c } = t,
    l = o.options,
    u = l.fill,
    d = l.backgroundColor,
    { above: f = d, below: p = d } = u || {},
    m = si(i, i.getDatasetMeta(a));
  r &&
    o.points.length &&
    (kn(e, n),
    tc(e, {
      line: o,
      target: r,
      above: f,
      below: p,
      area: n,
      scale: s,
      axis: c,
      clip: m,
    }),
    An(e));
}
function tc(e, t) {
  let {
      line: n,
      target: r,
      above: i,
      below: a,
      area: o,
      scale: s,
      clip: c,
    } = t,
    l = n._loop ? `angle` : t.axis;
  e.save();
  let u = a;
  (a !== i &&
    (l === `x`
      ? (nc(e, r, o.top),
        ic(e, { line: n, target: r, color: i, scale: s, property: l, clip: c }),
        e.restore(),
        e.save(),
        nc(e, r, o.bottom))
      : l === `y` &&
        (rc(e, r, o.left),
        ic(e, { line: n, target: r, color: a, scale: s, property: l, clip: c }),
        e.restore(),
        e.save(),
        rc(e, r, o.right),
        (u = i))),
    ic(e, { line: n, target: r, color: u, scale: s, property: l, clip: c }),
    e.restore());
}
function nc(e, t, n) {
  let { segments: r, points: i } = t,
    a = !0,
    o = !1;
  e.beginPath();
  for (let s of r) {
    let { start: r, end: c } = s,
      l = i[r],
      u = i[Ps(r, c, i)];
    (a
      ? (e.moveTo(l.x, l.y), (a = !1))
      : (e.lineTo(l.x, n), e.lineTo(l.x, l.y)),
      (o = !!t.pathSegment(e, s, { move: o })),
      o ? e.closePath() : e.lineTo(u.x, n));
  }
  (e.lineTo(t.first().x, n), e.closePath(), e.clip());
}
function rc(e, t, n) {
  let { segments: r, points: i } = t,
    a = !0,
    o = !1;
  e.beginPath();
  for (let s of r) {
    let { start: r, end: c } = s,
      l = i[r],
      u = i[Ps(r, c, i)];
    (a
      ? (e.moveTo(l.x, l.y), (a = !1))
      : (e.lineTo(n, l.y), e.lineTo(l.x, l.y)),
      (o = !!t.pathSegment(e, s, { move: o })),
      o ? e.closePath() : e.lineTo(n, u.y));
  }
  (e.lineTo(n, t.first().y), e.closePath(), e.clip());
}
function ic(e, t) {
  let { line: n, target: r, property: i, color: a, scale: o, clip: s } = t,
    c = js(n, r, i);
  for (let { source: t, target: l, start: u, end: d } of c) {
    let { style: { backgroundColor: c = a } = {} } = t,
      f = r !== !0;
    (e.save(), (e.fillStyle = c), ac(e, o, s, f && Ms(i, u, d)), e.beginPath());
    let p = !!n.pathSegment(e, t),
      m;
    if (f) {
      p ? e.closePath() : oc(e, r, d, i);
      let t = !!r.pathSegment(e, l, { move: p, reverse: !0 });
      ((m = p && t), m || oc(e, r, u, i));
    }
    (e.closePath(), e.fill(m ? `evenodd` : `nonzero`), e.restore());
  }
}
function ac(e, t, n, r) {
  let i = t.chart.chartArea,
    { property: a, start: o, end: s } = r || {};
  if (a === `x` || a === `y`) {
    let t, r, c, l;
    (a === `x`
      ? ((t = o), (r = i.top), (c = s), (l = i.bottom))
      : ((t = i.left), (r = o), (c = i.right), (l = s)),
      e.beginPath(),
      n &&
        ((t = Math.max(t, n.left)),
        (c = Math.min(c, n.right)),
        (r = Math.max(r, n.top)),
        (l = Math.min(l, n.bottom))),
      e.rect(t, r, c - t, l - r),
      e.clip());
  }
}
function oc(e, t, n, r) {
  let i = t.interpolate(n, r);
  i && e.lineTo(i.x, i.y);
}
var sc = {
    id: `filler`,
    afterDatasetsUpdate(e, t, n) {
      let r = (e.data.datasets || []).length,
        i = [],
        a,
        o,
        s,
        c;
      for (o = 0; o < r; ++o)
        ((a = e.getDatasetMeta(o)),
          (s = a.dataset),
          (c = null),
          s &&
            s.options &&
            s instanceof vs &&
            (c = {
              visible: e.isDatasetVisible(o),
              index: o,
              fill: zs(s, o, r),
              chart: e,
              axis: a.controller.options.indexAxis,
              scale: a.vScale,
              line: s,
            }),
          (a.$filler = c),
          i.push(c));
      for (o = 0; o < r; ++o)
        ((c = i[o]),
          !(!c || c.fill === !1) && (c.fill = Rs(i, o, n.propagate)));
    },
    beforeDraw(e, t, n) {
      let r = n.drawTime === `beforeDraw`,
        i = e.getSortedVisibleDatasetMetas(),
        a = e.chartArea;
      for (let t = i.length - 1; t >= 0; --t) {
        let n = i[t].$filler;
        n &&
          (n.line.updateControlPoints(a, n.axis),
          r && n.fill && ec(e.ctx, n, a));
      }
    },
    beforeDatasetsDraw(e, t, n) {
      if (n.drawTime !== `beforeDatasetsDraw`) return;
      let r = e.getSortedVisibleDatasetMetas();
      for (let t = r.length - 1; t >= 0; --t) {
        let n = r[t].$filler;
        Ls(n) && ec(e.ctx, n, e.chartArea);
      }
    },
    beforeDatasetDraw(e, t, n) {
      let r = t.meta.$filler;
      !Ls(r) || n.drawTime !== `beforeDatasetDraw` || ec(e.ctx, r, e.chartArea);
    },
    defaults: { propagate: !0, drawTime: `beforeDatasetDraw` },
  },
  cc = (e, t) => {
    let { boxHeight: n = t, boxWidth: r = t } = e;
    return (
      e.usePointStyle &&
        ((n = Math.min(n, t)), (r = e.pointStyleWidth || Math.min(r, t))),
      { boxWidth: r, boxHeight: n, itemHeight: Math.max(t, n) }
    );
  },
  lc = (e, t) =>
    e !== null &&
    t !== null &&
    e.datasetIndex === t.datasetIndex &&
    e.index === t.index,
  uc = class extends Ya {
    constructor(e) {
      (super(),
        (this._added = !1),
        (this.legendHitBoxes = []),
        (this._hoveredItem = null),
        (this.doughnutMode = !1),
        (this.chart = e.chart),
        (this.options = e.options),
        (this.ctx = e.ctx),
        (this.legendItems = void 0),
        (this.columnSizes = void 0),
        (this.lineWidths = void 0),
        (this.maxHeight = void 0),
        (this.maxWidth = void 0),
        (this.top = void 0),
        (this.bottom = void 0),
        (this.left = void 0),
        (this.right = void 0),
        (this.height = void 0),
        (this.width = void 0),
        (this._margins = void 0),
        (this.position = void 0),
        (this.weight = void 0),
        (this.fullSize = void 0));
    }
    update(e, t, n) {
      ((this.maxWidth = e),
        (this.maxHeight = t),
        (this._margins = n),
        this.setDimensions(),
        this.buildLabels(),
        this.fit());
    }
    setDimensions() {
      this.isHorizontal()
        ? ((this.width = this.maxWidth),
          (this.left = this._margins.left),
          (this.right = this.width))
        : ((this.height = this.maxHeight),
          (this.top = this._margins.top),
          (this.bottom = this.height));
    }
    buildLabels() {
      let e = this.options.labels || {},
        t = H(e.generateLabels, [this.chart], this) || [];
      (e.filter && (t = t.filter((t) => e.filter(t, this.chart.data))),
        e.sort && (t = t.sort((t, n) => e.sort(t, n, this.chart.data))),
        this.options.reverse && t.reverse(),
        (this.legendItems = t));
    }
    fit() {
      let { options: e, ctx: t } = this;
      if (!e.display) {
        this.width = this.height = 0;
        return;
      }
      let n = e.labels,
        r = Z(n.font),
        i = r.size,
        a = this._computeTitleHeight(),
        { boxWidth: o, itemHeight: s } = cc(n, i),
        c,
        l;
      ((t.font = r.string),
        this.isHorizontal()
          ? ((c = this.maxWidth), (l = this._fitRows(a, i, o, s) + 10))
          : ((l = this.maxHeight), (c = this._fitCols(a, r, o, s) + 10)),
        (this.width = Math.min(c, e.maxWidth || this.maxWidth)),
        (this.height = Math.min(l, e.maxHeight || this.maxHeight)));
    }
    _fitRows(e, t, n, r) {
      let {
          ctx: i,
          maxWidth: a,
          options: {
            labels: { padding: o },
          },
        } = this,
        s = (this.legendHitBoxes = []),
        c = (this.lineWidths = [0]),
        l = r + o,
        u = e;
      ((i.textAlign = `left`), (i.textBaseline = `middle`));
      let d = -1,
        f = -l;
      return (
        this.legendItems.forEach((e, p) => {
          let m = n + t / 2 + i.measureText(e.text).width;
          ((p === 0 || c[c.length - 1] + m + 2 * o > a) &&
            ((u += l), (c[c.length - (p > 0 ? 0 : 1)] = 0), (f += l), d++),
            (s[p] = { left: 0, top: f, row: d, width: m, height: r }),
            (c[c.length - 1] += m + o));
        }),
        u
      );
    }
    _fitCols(e, t, n, r) {
      let {
          ctx: i,
          maxHeight: a,
          options: {
            labels: { padding: o },
          },
        } = this,
        s = (this.legendHitBoxes = []),
        c = (this.columnSizes = []),
        l = a - e,
        u = o,
        d = 0,
        f = 0,
        p = 0,
        m = 0;
      return (
        this.legendItems.forEach((e, a) => {
          let { itemWidth: h, itemHeight: g } = dc(n, t, i, e, r);
          (a > 0 &&
            f + g + 2 * o > l &&
            ((u += d + o),
            c.push({ width: d, height: f }),
            (p += d + o),
            m++,
            (d = f = 0)),
            (s[a] = { left: p, top: f, col: m, width: h, height: g }),
            (d = Math.max(d, h)),
            (f += g + o));
        }),
        (u += d),
        c.push({ width: d, height: f }),
        u
      );
    }
    adjustHitBoxes() {
      if (!this.options.display) return;
      let e = this._computeTitleHeight(),
        {
          legendHitBoxes: t,
          options: {
            align: n,
            labels: { padding: r },
            rtl: i,
          },
        } = this,
        a = Wr(i, this.left, this.width);
      if (this.isHorizontal()) {
        let i = 0,
          o = Jt(n, this.left + r, this.right - this.lineWidths[i]);
        for (let s of t)
          (i !== s.row &&
            ((i = s.row),
            (o = Jt(n, this.left + r, this.right - this.lineWidths[i]))),
            (s.top += this.top + e + r),
            (s.left = a.leftForLtr(a.x(o), s.width)),
            (o += s.width + r));
      } else {
        let i = 0,
          o = Jt(n, this.top + e + r, this.bottom - this.columnSizes[i].height);
        for (let s of t)
          (s.col !== i &&
            ((i = s.col),
            (o = Jt(
              n,
              this.top + e + r,
              this.bottom - this.columnSizes[i].height,
            ))),
            (s.top = o),
            (s.left += this.left + r),
            (s.left = a.leftForLtr(a.x(s.left), s.width)),
            (o += s.height + r));
      }
    }
    isHorizontal() {
      return (
        this.options.position === `top` || this.options.position === `bottom`
      );
    }
    draw() {
      if (this.options.display) {
        let e = this.ctx;
        (kn(e, this), this._draw(), An(e));
      }
    }
    _draw() {
      let { options: e, columnSizes: t, lineWidths: n, ctx: r } = this,
        { align: i, labels: a } = e,
        o = Y.color,
        s = Wr(e.rtl, this.left, this.width),
        c = Z(a.font),
        { padding: l } = a,
        u = c.size,
        d = u / 2,
        f;
      (this.drawTitle(),
        (r.textAlign = s.textAlign(`left`)),
        (r.textBaseline = `middle`),
        (r.lineWidth = 0.5),
        (r.font = c.string));
      let { boxWidth: p, boxHeight: m, itemHeight: h } = cc(a, u),
        g = function (e, t, n) {
          if (isNaN(p) || p <= 0 || isNaN(m) || m < 0) return;
          r.save();
          let i = V(n.lineWidth, 1);
          if (
            ((r.fillStyle = V(n.fillStyle, o)),
            (r.lineCap = V(n.lineCap, `butt`)),
            (r.lineDashOffset = V(n.lineDashOffset, 0)),
            (r.lineJoin = V(n.lineJoin, `miter`)),
            (r.lineWidth = i),
            (r.strokeStyle = V(n.strokeStyle, o)),
            r.setLineDash(V(n.lineDash, [])),
            a.usePointStyle)
          )
            Dn(
              r,
              {
                radius: (m * Math.SQRT2) / 2,
                pointStyle: n.pointStyle,
                rotation: n.rotation,
                borderWidth: i,
              },
              s.xPlus(e, p / 2),
              t + d,
              a.pointStyleWidth && p,
            );
          else {
            let a = t + Math.max((u - m) / 2, 0),
              o = s.leftForLtr(e, p),
              c = Wn(n.borderRadius);
            (r.beginPath(),
              Object.values(c).some((e) => e !== 0)
                ? Ln(r, { x: o, y: a, w: p, h: m, radius: c })
                : r.rect(o, a, p, m),
              r.fill(),
              i !== 0 && r.stroke());
          }
          r.restore();
        },
        _ = function (e, t, n) {
          In(r, n.text, e, t + h / 2, c, {
            strikethrough: n.hidden,
            textAlign: s.textAlign(n.textAlign),
          });
        },
        v = this.isHorizontal(),
        y = this._computeTitleHeight();
      ((f = v
        ? {
            x: Jt(i, this.left + l, this.right - n[0]),
            y: this.top + l + y,
            line: 0,
          }
        : {
            x: this.left + l,
            y: Jt(i, this.top + y + l, this.bottom - t[0].height),
            line: 0,
          }),
        Gr(this.ctx, e.textDirection));
      let b = h + l;
      (this.legendItems.forEach((o, u) => {
        ((r.strokeStyle = o.fontColor), (r.fillStyle = o.fontColor));
        let m = r.measureText(o.text).width,
          h = s.textAlign((o.textAlign ||= a.textAlign)),
          x = p + d + m,
          S = f.x,
          C = f.y;
        if (
          (s.setWidth(this.width),
          v
            ? u > 0 &&
              S + x + l > this.right &&
              ((C = f.y += b),
              f.line++,
              (S = f.x = Jt(i, this.left + l, this.right - n[f.line])))
            : u > 0 &&
              C + b > this.bottom &&
              ((S = f.x = S + t[f.line].width + l),
              f.line++,
              (C = f.y =
                Jt(i, this.top + y + l, this.bottom - t[f.line].height))),
          g(s.x(S), C, o),
          (S = Yt(h, S + p + d, v ? S + x : this.right, e.rtl)),
          _(s.x(S), C, o),
          v)
        )
          f.x += x + l;
        else if (typeof o.text != `string`) {
          let e = c.lineHeight;
          f.y += mc(o, e) + l;
        } else f.y += b;
      }),
        Kr(this.ctx, e.textDirection));
    }
    drawTitle() {
      let e = this.options,
        t = e.title,
        n = Z(t.font),
        r = X(t.padding);
      if (!t.display) return;
      let i = Wr(e.rtl, this.left, this.width),
        a = this.ctx,
        o = t.position,
        s = n.size / 2,
        c = r.top + s,
        l,
        u = this.left,
        d = this.width;
      if (this.isHorizontal())
        ((d = Math.max(...this.lineWidths)),
          (l = this.top + c),
          (u = Jt(e.align, u, this.right - d)));
      else {
        let t = this.columnSizes.reduce((e, t) => Math.max(e, t.height), 0);
        l =
          c +
          Jt(
            e.align,
            this.top,
            this.bottom - t - e.labels.padding - this._computeTitleHeight(),
          );
      }
      let f = Jt(o, u, u + d);
      ((a.textAlign = i.textAlign(qt(o))),
        (a.textBaseline = `middle`),
        (a.strokeStyle = t.color),
        (a.fillStyle = t.color),
        (a.font = n.string),
        In(a, t.text, f, l, n));
    }
    _computeTitleHeight() {
      let e = this.options.title,
        t = Z(e.font),
        n = X(e.padding);
      return e.display ? t.lineHeight + n.height : 0;
    }
    _getLegendItemAt(e, t) {
      let n, r, i;
      if (Ft(e, this.left, this.right) && Ft(t, this.top, this.bottom)) {
        for (i = this.legendHitBoxes, n = 0; n < i.length; ++n)
          if (
            ((r = i[n]),
            Ft(e, r.left, r.left + r.width) && Ft(t, r.top, r.top + r.height))
          )
            return this.legendItems[n];
      }
      return null;
    }
    handleEvent(e) {
      let t = this.options;
      if (!hc(e.type, t)) return;
      let n = this._getLegendItemAt(e.x, e.y);
      if (e.type === `mousemove` || e.type === `mouseout`) {
        let r = this._hoveredItem,
          i = lc(r, n);
        (r && !i && H(t.onLeave, [e, r, this], this),
          (this._hoveredItem = n),
          n && !i && H(t.onHover, [e, n, this], this));
      } else n && H(t.onClick, [e, n, this], this);
    }
  };
function dc(e, t, n, r, i) {
  return { itemWidth: fc(r, e, t, n), itemHeight: pc(i, r, t.lineHeight) };
}
function fc(e, t, n, r) {
  let i = e.text;
  return (
    i &&
      typeof i != `string` &&
      (i = i.reduce((e, t) => (e.length > t.length ? e : t))),
    t + n.size / 2 + r.measureText(i).width
  );
}
function pc(e, t, n) {
  let r = e;
  return (typeof t.text != `string` && (r = mc(t, n)), r);
}
function mc(e, t) {
  return t * (e.text ? e.text.length : 0);
}
function hc(e, t) {
  return !!(
    ((e === `mousemove` || e === `mouseout`) && (t.onHover || t.onLeave)) ||
    (t.onClick && (e === `click` || e === `mouseup`))
  );
}
var gc = {
    id: `legend`,
    _element: uc,
    start(e, t, n) {
      let r = (e.legend = new uc({ ctx: e.ctx, options: n, chart: e }));
      (Ta.configure(e, r, n), Ta.addBox(e, r));
    },
    stop(e) {
      (Ta.removeBox(e, e.legend), delete e.legend);
    },
    beforeUpdate(e, t, n) {
      let r = e.legend;
      (Ta.configure(e, r, n), (r.options = n));
    },
    afterUpdate(e) {
      let t = e.legend;
      (t.buildLabels(), t.adjustHitBoxes());
    },
    afterEvent(e, t) {
      t.replay || e.legend.handleEvent(t.event);
    },
    defaults: {
      display: !0,
      position: `top`,
      align: `center`,
      fullSize: !0,
      reverse: !1,
      weight: 1e3,
      onClick(e, t, n) {
        let r = t.datasetIndex,
          i = n.chart;
        i.isDatasetVisible(r)
          ? (i.hide(r), (t.hidden = !0))
          : (i.show(r), (t.hidden = !1));
      },
      onHover: null,
      onLeave: null,
      labels: {
        color: (e) => e.chart.options.color,
        boxWidth: 40,
        padding: 10,
        generateLabels(e) {
          let t = e.data.datasets,
            {
              labels: {
                usePointStyle: n,
                pointStyle: r,
                textAlign: i,
                color: a,
                useBorderRadius: o,
                borderRadius: s,
              },
            } = e.legend.options;
          return e._getSortedDatasetMetas().map((e) => {
            let c = e.controller.getStyle(n ? 0 : void 0),
              l = X(c.borderWidth);
            return {
              text: t[e.index].label,
              fillStyle: c.backgroundColor,
              fontColor: a,
              hidden: !e.visible,
              lineCap: c.borderCapStyle,
              lineDash: c.borderDash,
              lineDashOffset: c.borderDashOffset,
              lineJoin: c.borderJoinStyle,
              lineWidth: (l.width + l.height) / 4,
              strokeStyle: c.borderColor,
              pointStyle: r || c.pointStyle,
              rotation: c.rotation,
              textAlign: i || c.textAlign,
              borderRadius: o && (s || c.borderRadius),
              datasetIndex: e.index,
            };
          }, this);
        },
      },
      title: {
        color: (e) => e.chart.options.color,
        display: !1,
        position: `center`,
        text: ``,
      },
    },
    descriptors: {
      _scriptable: (e) => !e.startsWith(`on`),
      labels: {
        _scriptable: (e) => ![`generateLabels`, `filter`, `sort`].includes(e),
      },
    },
  },
  _c = {
    average(e) {
      if (!e.length) return !1;
      let t,
        n,
        r = new Set(),
        i = 0,
        a = 0;
      for (t = 0, n = e.length; t < n; ++t) {
        let n = e[t].element;
        if (n && n.hasValue()) {
          let e = n.tooltipPosition();
          (r.add(e.x), (i += e.y), ++a);
        }
      }
      return a === 0 || r.size === 0
        ? !1
        : { x: [...r].reduce((e, t) => e + t) / r.size, y: i / a };
    },
    nearest(e, t) {
      if (!e.length) return !1;
      let n = t.x,
        r = t.y,
        i = 1 / 0,
        a,
        o,
        s;
      for (a = 0, o = e.length; a < o; ++a) {
        let n = e[a].element;
        if (n && n.hasValue()) {
          let e = jt(t, n.getCenterPoint());
          e < i && ((i = e), (s = n));
        }
      }
      if (s) {
        let e = s.tooltipPosition();
        ((n = e.x), (r = e.y));
      }
      return { x: n, y: r };
    },
  };
function vc(e, t) {
  return (t && (L(t) ? Array.prototype.push.apply(e, t) : e.push(t)), e);
}
function yc(e) {
  return (typeof e == `string` || e instanceof String) &&
    e.indexOf(`
`) > -1
    ? e.split(`
`)
    : e;
}
function bc(e, t) {
  let { element: n, datasetIndex: r, index: i } = t,
    a = e.getDatasetMeta(r).controller,
    { label: o, value: s } = a.getLabelAndValue(i);
  return {
    chart: e,
    label: o,
    parsed: a.getParsed(i),
    raw: e.data.datasets[r].data[i],
    formattedValue: s,
    dataset: a.getDataset(),
    dataIndex: i,
    datasetIndex: r,
    element: n,
  };
}
function xc(e, t) {
  let n = e.chart.ctx,
    { body: r, footer: i, title: a } = e,
    { boxWidth: o, boxHeight: s } = t,
    c = Z(t.bodyFont),
    l = Z(t.titleFont),
    u = Z(t.footerFont),
    d = a.length,
    f = i.length,
    p = r.length,
    m = X(t.padding),
    h = m.height,
    g = 0,
    _ = r.reduce(
      (e, t) => e + t.before.length + t.lines.length + t.after.length,
      0,
    );
  if (
    ((_ += e.beforeBody.length + e.afterBody.length),
    d &&
      (h += d * l.lineHeight + (d - 1) * t.titleSpacing + t.titleMarginBottom),
    _)
  ) {
    let e = t.displayColors ? Math.max(s, c.lineHeight) : c.lineHeight;
    h += p * e + (_ - p) * c.lineHeight + (_ - 1) * t.bodySpacing;
  }
  f && (h += t.footerMarginTop + f * u.lineHeight + (f - 1) * t.footerSpacing);
  let v = 0,
    y = function (e) {
      g = Math.max(g, n.measureText(e).width + v);
    };
  return (
    n.save(),
    (n.font = l.string),
    U(e.title, y),
    (n.font = c.string),
    U(e.beforeBody.concat(e.afterBody), y),
    (v = t.displayColors ? o + 2 + t.boxPadding : 0),
    U(r, (e) => {
      (U(e.before, y), U(e.lines, y), U(e.after, y));
    }),
    (v = 0),
    (n.font = u.string),
    U(e.footer, y),
    n.restore(),
    (g += m.width),
    { width: g, height: h }
  );
}
function Sc(e, t) {
  let { y: n, height: r } = t;
  return n < r / 2 ? `top` : n > e.height - r / 2 ? `bottom` : `center`;
}
function Cc(e, t, n, r) {
  let { x: i, width: a } = r,
    o = n.caretSize + n.caretPadding;
  if ((e === `left` && i + a + o > t.width) || (e === `right` && i - a - o < 0))
    return !0;
}
function wc(e, t, n, r) {
  let { x: i, width: a } = n,
    {
      width: o,
      chartArea: { left: s, right: c },
    } = e,
    l = `center`;
  return (
    r === `center`
      ? (l = i <= (s + c) / 2 ? `left` : `right`)
      : i <= a / 2
        ? (l = `left`)
        : i >= o - a / 2 && (l = `right`),
    Cc(l, e, t, n) && (l = `center`),
    l
  );
}
function Tc(e, t, n) {
  let r = n.yAlign || t.yAlign || Sc(e, n);
  return { xAlign: n.xAlign || t.xAlign || wc(e, t, n, r), yAlign: r };
}
function Ec(e, t) {
  let { x: n, width: r } = e;
  return (t === `right` ? (n -= r) : t === `center` && (n -= r / 2), n);
}
function Dc(e, t, n) {
  let { y: r, height: i } = e;
  return (
    t === `top` ? (r += n) : t === `bottom` ? (r -= i + n) : (r -= i / 2),
    r
  );
}
function Oc(e, t, n, r) {
  let { caretSize: i, caretPadding: a, cornerRadius: o } = e,
    { xAlign: s, yAlign: c } = n,
    l = i + a,
    { topLeft: u, topRight: d, bottomLeft: f, bottomRight: p } = Wn(o),
    m = Ec(t, s),
    h = Dc(t, c, l);
  return (
    c === `center`
      ? s === `left`
        ? (m += l)
        : s === `right` && (m -= l)
      : s === `left`
        ? (m -= Math.max(u, f) + i)
        : s === `right` && (m += Math.max(d, p) + i),
    { x: J(m, 0, r.width - t.width), y: J(h, 0, r.height - t.height) }
  );
}
function kc(e, t, n) {
  let r = X(n.padding);
  return t === `center`
    ? e.x + e.width / 2
    : t === `right`
      ? e.x + e.width - r.right
      : e.x + r.left;
}
function Ac(e) {
  return vc([], yc(e));
}
function jc(e, t, n) {
  return qn(e, { tooltip: t, tooltipItems: n, type: `tooltip` });
}
function Mc(e, t) {
  let n = t && t.dataset && t.dataset.tooltip && t.dataset.tooltip.callbacks;
  return n ? e.override(n) : e;
}
var Nc = {
  beforeTitle: Je,
  title(e) {
    if (e.length > 0) {
      let t = e[0],
        n = t.chart.data.labels,
        r = n ? n.length : 0;
      if (this && this.options && this.options.mode === `dataset`)
        return t.dataset.label || ``;
      if (t.label) return t.label;
      if (r > 0 && t.dataIndex < r) return n[t.dataIndex];
    }
    return ``;
  },
  afterTitle: Je,
  beforeBody: Je,
  beforeLabel: Je,
  label(e) {
    if (this && this.options && this.options.mode === `dataset`)
      return e.label + `: ` + e.formattedValue || e.formattedValue;
    let t = e.dataset.label || ``;
    t && (t += `: `);
    let n = e.formattedValue;
    return (I(n) || (t += n), t);
  },
  labelColor(e) {
    let t = e.chart
      .getDatasetMeta(e.datasetIndex)
      .controller.getStyle(e.dataIndex);
    return {
      borderColor: t.borderColor,
      backgroundColor: t.backgroundColor,
      borderWidth: t.borderWidth,
      borderDash: t.borderDash,
      borderDashOffset: t.borderDashOffset,
      borderRadius: 0,
    };
  },
  labelTextColor() {
    return this.options.bodyColor;
  },
  labelPointStyle(e) {
    let t = e.chart
      .getDatasetMeta(e.datasetIndex)
      .controller.getStyle(e.dataIndex);
    return { pointStyle: t.pointStyle, rotation: t.rotation };
  },
  afterLabel: Je,
  afterBody: Je,
  beforeFooter: Je,
  footer: Je,
  afterFooter: Je,
};
function Q(e, t, n, r) {
  let i = e[t].call(n, r);
  return i === void 0 ? Nc[t].call(n, r) : i;
}
var Pc = class extends Ya {
    static positioners = _c;
    constructor(e) {
      (super(),
        (this.opacity = 0),
        (this._active = []),
        (this._eventPosition = void 0),
        (this._size = void 0),
        (this._cachedAnimations = void 0),
        (this._tooltipItems = []),
        (this.$animations = void 0),
        (this.$context = void 0),
        (this.chart = e.chart),
        (this.options = e.options),
        (this.dataPoints = void 0),
        (this.title = void 0),
        (this.beforeBody = void 0),
        (this.body = void 0),
        (this.afterBody = void 0),
        (this.footer = void 0),
        (this.xAlign = void 0),
        (this.yAlign = void 0),
        (this.x = void 0),
        (this.y = void 0),
        (this.height = void 0),
        (this.width = void 0),
        (this.caretX = void 0),
        (this.caretY = void 0),
        (this.labelColors = void 0),
        (this.labelPointStyles = void 0),
        (this.labelTextColors = void 0));
    }
    initialize(e) {
      ((this.options = e),
        (this._cachedAnimations = void 0),
        (this.$context = void 0));
    }
    _resolveAnimations() {
      let e = this._cachedAnimations;
      if (e) return e;
      let t = this.chart,
        n = this.options.setContext(this.getContext()),
        r = n.enabled && t.options.animation && n.animations,
        i = new fi(this.chart, r);
      return (r._cacheable && (this._cachedAnimations = Object.freeze(i)), i);
    }
    getContext() {
      return (this.$context ||= jc(
        this.chart.getContext(),
        this,
        this._tooltipItems,
      ));
    }
    getTitle(e, t) {
      let { callbacks: n } = t,
        r = Q(n, `beforeTitle`, this, e),
        i = Q(n, `title`, this, e),
        a = Q(n, `afterTitle`, this, e),
        o = [];
      return ((o = vc(o, yc(r))), (o = vc(o, yc(i))), (o = vc(o, yc(a))), o);
    }
    getBeforeBody(e, t) {
      return Ac(Q(t.callbacks, `beforeBody`, this, e));
    }
    getBody(e, t) {
      let { callbacks: n } = t,
        r = [];
      return (
        U(e, (e) => {
          let t = { before: [], lines: [], after: [] },
            i = Mc(n, e);
          (vc(t.before, yc(Q(i, `beforeLabel`, this, e))),
            vc(t.lines, Q(i, `label`, this, e)),
            vc(t.after, yc(Q(i, `afterLabel`, this, e))),
            r.push(t));
        }),
        r
      );
    }
    getAfterBody(e, t) {
      return Ac(Q(t.callbacks, `afterBody`, this, e));
    }
    getFooter(e, t) {
      let { callbacks: n } = t,
        r = Q(n, `beforeFooter`, this, e),
        i = Q(n, `footer`, this, e),
        a = Q(n, `afterFooter`, this, e),
        o = [];
      return ((o = vc(o, yc(r))), (o = vc(o, yc(i))), (o = vc(o, yc(a))), o);
    }
    _createItems(e) {
      let t = this._active,
        n = this.chart.data,
        r = [],
        i = [],
        a = [],
        o = [],
        s,
        c;
      for (s = 0, c = t.length; s < c; ++s) o.push(bc(this.chart, t[s]));
      return (
        e.filter && (o = o.filter((t, r, i) => e.filter(t, r, i, n))),
        e.itemSort && (o = o.sort((t, r) => e.itemSort(t, r, n))),
        U(o, (t) => {
          let n = Mc(e.callbacks, t);
          (r.push(Q(n, `labelColor`, this, t)),
            i.push(Q(n, `labelPointStyle`, this, t)),
            a.push(Q(n, `labelTextColor`, this, t)));
        }),
        (this.labelColors = r),
        (this.labelPointStyles = i),
        (this.labelTextColors = a),
        (this.dataPoints = o),
        o
      );
    }
    update(e, t) {
      let n = this.options.setContext(this.getContext()),
        r = this._active,
        i,
        a = [];
      if (!r.length) this.opacity !== 0 && (i = { opacity: 0 });
      else {
        let e = _c[n.position].call(this, r, this._eventPosition);
        ((a = this._createItems(n)),
          (this.title = this.getTitle(a, n)),
          (this.beforeBody = this.getBeforeBody(a, n)),
          (this.body = this.getBody(a, n)),
          (this.afterBody = this.getAfterBody(a, n)),
          (this.footer = this.getFooter(a, n)));
        let t = (this._size = xc(this, n)),
          o = Object.assign({}, e, t),
          s = Tc(this.chart, n, o),
          c = Oc(n, o, s, this.chart);
        ((this.xAlign = s.xAlign),
          (this.yAlign = s.yAlign),
          (i = {
            opacity: 1,
            x: c.x,
            y: c.y,
            width: t.width,
            height: t.height,
            caretX: e.x,
            caretY: e.y,
          }));
      }
      ((this._tooltipItems = a),
        (this.$context = void 0),
        i && this._resolveAnimations().update(this, i),
        e &&
          n.external &&
          n.external.call(this, {
            chart: this.chart,
            tooltip: this,
            replay: t,
          }));
    }
    drawCaret(e, t, n, r) {
      let i = this.getCaretPosition(e, n, r);
      (t.lineTo(i.x1, i.y1), t.lineTo(i.x2, i.y2), t.lineTo(i.x3, i.y3));
    }
    getCaretPosition(e, t, n) {
      let { xAlign: r, yAlign: i } = this,
        { caretSize: a, cornerRadius: o } = n,
        { topLeft: s, topRight: c, bottomLeft: l, bottomRight: u } = Wn(o),
        { x: d, y: f } = e,
        { width: p, height: m } = t,
        h,
        g,
        _,
        v,
        y,
        b;
      return (
        i === `center`
          ? ((y = f + m / 2),
            r === `left`
              ? ((h = d), (g = h - a), (v = y + a), (b = y - a))
              : ((h = d + p), (g = h + a), (v = y - a), (b = y + a)),
            (_ = h))
          : ((g =
              r === `left`
                ? d + Math.max(s, l) + a
                : r === `right`
                  ? d + p - Math.max(c, u) - a
                  : this.caretX),
            i === `top`
              ? ((v = f), (y = v - a), (h = g - a), (_ = g + a))
              : ((v = f + m), (y = v + a), (h = g + a), (_ = g - a)),
            (b = v)),
        { x1: h, x2: g, x3: _, y1: v, y2: y, y3: b }
      );
    }
    drawTitle(e, t, n) {
      let r = this.title,
        i = r.length,
        a,
        o,
        s;
      if (i) {
        let c = Wr(n.rtl, this.x, this.width);
        for (
          e.x = kc(this, n.titleAlign, n),
            t.textAlign = c.textAlign(n.titleAlign),
            t.textBaseline = `middle`,
            a = Z(n.titleFont),
            o = n.titleSpacing,
            t.fillStyle = n.titleColor,
            t.font = a.string,
            s = 0;
          s < i;
          ++s
        )
          (t.fillText(r[s], c.x(e.x), e.y + a.lineHeight / 2),
            (e.y += a.lineHeight + o),
            s + 1 === i && (e.y += n.titleMarginBottom - o));
      }
    }
    _drawColorBox(e, t, n, r, i) {
      let a = this.labelColors[n],
        o = this.labelPointStyles[n],
        { boxHeight: s, boxWidth: c } = i,
        l = Z(i.bodyFont),
        u = kc(this, `left`, i),
        d = r.x(u),
        f = s < l.lineHeight ? (l.lineHeight - s) / 2 : 0,
        p = t.y + f;
      if (i.usePointStyle) {
        let t = {
            radius: Math.min(c, s) / 2,
            pointStyle: o.pointStyle,
            rotation: o.rotation,
            borderWidth: 1,
          },
          n = r.leftForLtr(d, c) + c / 2,
          l = p + s / 2;
        ((e.strokeStyle = i.multiKeyBackground),
          (e.fillStyle = i.multiKeyBackground),
          En(e, t, n, l),
          (e.strokeStyle = a.borderColor),
          (e.fillStyle = a.backgroundColor),
          En(e, t, n, l));
      } else {
        ((e.lineWidth = R(a.borderWidth)
          ? Math.max(...Object.values(a.borderWidth))
          : a.borderWidth || 1),
          (e.strokeStyle = a.borderColor),
          e.setLineDash(a.borderDash || []),
          (e.lineDashOffset = a.borderDashOffset || 0));
        let t = r.leftForLtr(d, c),
          n = r.leftForLtr(r.xPlus(d, 1), c - 2),
          o = Wn(a.borderRadius);
        Object.values(o).some((e) => e !== 0)
          ? (e.beginPath(),
            (e.fillStyle = i.multiKeyBackground),
            Ln(e, { x: t, y: p, w: c, h: s, radius: o }),
            e.fill(),
            e.stroke(),
            (e.fillStyle = a.backgroundColor),
            e.beginPath(),
            Ln(e, { x: n, y: p + 1, w: c - 2, h: s - 2, radius: o }),
            e.fill())
          : ((e.fillStyle = i.multiKeyBackground),
            e.fillRect(t, p, c, s),
            e.strokeRect(t, p, c, s),
            (e.fillStyle = a.backgroundColor),
            e.fillRect(n, p + 1, c - 2, s - 2));
      }
      e.fillStyle = this.labelTextColors[n];
    }
    drawBody(e, t, n) {
      let { body: r } = this,
        {
          bodySpacing: i,
          bodyAlign: a,
          displayColors: o,
          boxHeight: s,
          boxWidth: c,
          boxPadding: l,
        } = n,
        u = Z(n.bodyFont),
        d = u.lineHeight,
        f = 0,
        p = Wr(n.rtl, this.x, this.width),
        m = function (n) {
          (t.fillText(n, p.x(e.x + f), e.y + d / 2), (e.y += d + i));
        },
        h = p.textAlign(a),
        g,
        _,
        v,
        y,
        b,
        x,
        S;
      for (
        t.textAlign = a,
          t.textBaseline = `middle`,
          t.font = u.string,
          e.x = kc(this, h, n),
          t.fillStyle = n.bodyColor,
          U(this.beforeBody, m),
          f = o && h !== `right` ? (a === `center` ? c / 2 + l : c + 2 + l) : 0,
          y = 0,
          x = r.length;
        y < x;
        ++y
      ) {
        for (
          g = r[y],
            _ = this.labelTextColors[y],
            t.fillStyle = _,
            U(g.before, m),
            v = g.lines,
            o &&
              v.length &&
              (this._drawColorBox(t, e, y, p, n),
              (d = Math.max(u.lineHeight, s))),
            b = 0,
            S = v.length;
          b < S;
          ++b
        )
          (m(v[b]), (d = u.lineHeight));
        U(g.after, m);
      }
      ((f = 0), (d = u.lineHeight), U(this.afterBody, m), (e.y -= i));
    }
    drawFooter(e, t, n) {
      let r = this.footer,
        i = r.length,
        a,
        o;
      if (i) {
        let s = Wr(n.rtl, this.x, this.width);
        for (
          e.x = kc(this, n.footerAlign, n),
            e.y += n.footerMarginTop,
            t.textAlign = s.textAlign(n.footerAlign),
            t.textBaseline = `middle`,
            a = Z(n.footerFont),
            t.fillStyle = n.footerColor,
            t.font = a.string,
            o = 0;
          o < i;
          ++o
        )
          (t.fillText(r[o], s.x(e.x), e.y + a.lineHeight / 2),
            (e.y += a.lineHeight + n.footerSpacing));
      }
    }
    drawBackground(e, t, n, r) {
      let { xAlign: i, yAlign: a } = this,
        { x: o, y: s } = e,
        { width: c, height: l } = n,
        {
          topLeft: u,
          topRight: d,
          bottomLeft: f,
          bottomRight: p,
        } = Wn(r.cornerRadius);
      ((t.fillStyle = r.backgroundColor),
        (t.strokeStyle = r.borderColor),
        (t.lineWidth = r.borderWidth),
        t.beginPath(),
        t.moveTo(o + u, s),
        a === `top` && this.drawCaret(e, t, n, r),
        t.lineTo(o + c - d, s),
        t.quadraticCurveTo(o + c, s, o + c, s + d),
        a === `center` && i === `right` && this.drawCaret(e, t, n, r),
        t.lineTo(o + c, s + l - p),
        t.quadraticCurveTo(o + c, s + l, o + c - p, s + l),
        a === `bottom` && this.drawCaret(e, t, n, r),
        t.lineTo(o + f, s + l),
        t.quadraticCurveTo(o, s + l, o, s + l - f),
        a === `center` && i === `left` && this.drawCaret(e, t, n, r),
        t.lineTo(o, s + u),
        t.quadraticCurveTo(o, s, o + u, s),
        t.closePath(),
        t.fill(),
        r.borderWidth > 0 && t.stroke());
    }
    _updateAnimationTarget(e) {
      let t = this.chart,
        n = this.$animations,
        r = n && n.x,
        i = n && n.y;
      if (r || i) {
        let n = _c[e.position].call(this, this._active, this._eventPosition);
        if (!n) return;
        let a = (this._size = xc(this, e)),
          o = Object.assign({}, n, this._size),
          s = Tc(t, e, o),
          c = Oc(e, o, s, t);
        (r._to !== c.x || i._to !== c.y) &&
          ((this.xAlign = s.xAlign),
          (this.yAlign = s.yAlign),
          (this.width = a.width),
          (this.height = a.height),
          (this.caretX = n.x),
          (this.caretY = n.y),
          this._resolveAnimations().update(this, c));
      }
    }
    _willRender() {
      return !!this.opacity;
    }
    draw(e) {
      let t = this.options.setContext(this.getContext()),
        n = this.opacity;
      if (!n) return;
      this._updateAnimationTarget(t);
      let r = { width: this.width, height: this.height },
        i = { x: this.x, y: this.y };
      n = Math.abs(n) < 0.001 ? 0 : n;
      let a = X(t.padding),
        o =
          this.title.length ||
          this.beforeBody.length ||
          this.body.length ||
          this.afterBody.length ||
          this.footer.length;
      t.enabled &&
        o &&
        (e.save(),
        (e.globalAlpha = n),
        this.drawBackground(i, e, r, t),
        Gr(e, t.textDirection),
        (i.y += a.top),
        this.drawTitle(i, e, t),
        this.drawBody(i, e, t),
        this.drawFooter(i, e, t),
        Kr(e, t.textDirection),
        e.restore());
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(e, t) {
      let n = this._active,
        r = e.map(({ datasetIndex: e, index: t }) => {
          let n = this.chart.getDatasetMeta(e);
          if (!n) throw Error(`Cannot find a dataset at index ` + e);
          return { datasetIndex: e, element: n.data[t], index: t };
        }),
        i = !Ze(n, r),
        a = this._positionChanged(r, t);
      (i || a) &&
        ((this._active = r),
        (this._eventPosition = t),
        (this._ignoreReplayEvents = !0),
        this.update(!0));
    }
    handleEvent(e, t, n = !0) {
      if (t && this._ignoreReplayEvents) return !1;
      this._ignoreReplayEvents = !1;
      let r = this.options,
        i = this._active || [],
        a = this._getActiveElements(e, i, t, n),
        o = this._positionChanged(a, e),
        s = t || !Ze(a, i) || o;
      return (
        s &&
          ((this._active = a),
          (r.enabled || r.external) &&
            ((this._eventPosition = { x: e.x, y: e.y }), this.update(!0, t))),
        s
      );
    }
    _getActiveElements(e, t, n, r) {
      let i = this.options;
      if (e.type === `mouseout`) return [];
      if (!r)
        return t.filter(
          (e) =>
            this.chart.data.datasets[e.datasetIndex] &&
            this.chart
              .getDatasetMeta(e.datasetIndex)
              .controller.getParsed(e.index) !== void 0,
        );
      let a = this.chart.getElementsAtEventForMode(e, i.mode, i, n);
      return (i.reverse && a.reverse(), a);
    }
    _positionChanged(e, t) {
      let { caretX: n, caretY: r, options: i } = this,
        a = _c[i.position].call(this, e, t);
      return a !== !1 && (n !== a.x || r !== a.y);
    }
  },
  Fc = {
    id: `tooltip`,
    _element: Pc,
    positioners: _c,
    afterInit(e, t, n) {
      n && (e.tooltip = new Pc({ chart: e, options: n }));
    },
    beforeUpdate(e, t, n) {
      e.tooltip && e.tooltip.initialize(n);
    },
    reset(e, t, n) {
      e.tooltip && e.tooltip.initialize(n);
    },
    afterDraw(e) {
      let t = e.tooltip;
      if (t && t._willRender()) {
        let n = { tooltip: t };
        if (
          e.notifyPlugins(`beforeTooltipDraw`, { ...n, cancelable: !0 }) === !1
        )
          return;
        (t.draw(e.ctx), e.notifyPlugins(`afterTooltipDraw`, n));
      }
    },
    afterEvent(e, t) {
      if (e.tooltip) {
        let n = t.replay;
        e.tooltip.handleEvent(t.event, n, t.inChartArea) && (t.changed = !0);
      }
    },
    defaults: {
      enabled: !0,
      external: null,
      position: `average`,
      backgroundColor: `rgba(0,0,0,0.8)`,
      titleColor: `#fff`,
      titleFont: { weight: `bold` },
      titleSpacing: 2,
      titleMarginBottom: 6,
      titleAlign: `left`,
      bodyColor: `#fff`,
      bodySpacing: 2,
      bodyFont: {},
      bodyAlign: `left`,
      footerColor: `#fff`,
      footerSpacing: 2,
      footerMarginTop: 6,
      footerFont: { weight: `bold` },
      footerAlign: `left`,
      padding: 6,
      caretPadding: 2,
      caretSize: 5,
      cornerRadius: 6,
      boxHeight: (e, t) => t.bodyFont.size,
      boxWidth: (e, t) => t.bodyFont.size,
      multiKeyBackground: `#fff`,
      displayColors: !0,
      boxPadding: 0,
      borderColor: `rgba(0,0,0,0)`,
      borderWidth: 0,
      animation: { duration: 400, easing: `easeOutQuart` },
      animations: {
        numbers: {
          type: `number`,
          properties: [`x`, `y`, `width`, `height`, `caretX`, `caretY`],
        },
        opacity: { easing: `linear`, duration: 200 },
      },
      callbacks: Nc,
    },
    defaultRoutes: { bodyFont: `font`, footerFont: `font`, titleFont: `font` },
    descriptors: {
      _scriptable: (e) =>
        e !== `filter` && e !== `itemSort` && e !== `external`,
      _indexable: !1,
      callbacks: { _scriptable: !1, _indexable: !1 },
      animation: { _fallback: !1 },
      animations: { _fallback: `animation` },
    },
    additionalOptionScopes: [`interaction`],
  },
  Ic = (e, t, n, r) => (
    typeof t == `string`
      ? ((n = e.push(t) - 1), r.unshift({ index: n, label: t }))
      : isNaN(t) && (n = null),
    n
  );
function Lc(e, t, n, r) {
  let i = e.indexOf(t);
  return i === -1 ? Ic(e, t, n, r) : i === e.lastIndexOf(t) ? i : n;
}
var Rc = (e, t) => (e === null ? null : J(Math.round(e), 0, t));
function zc(e) {
  let t = this.getLabels();
  return e >= 0 && e < t.length ? t[e] : e;
}
var Bc = class extends go {
  static id = `category`;
  static defaults = { ticks: { callback: zc } };
  constructor(e) {
    (super(e),
      (this._startValue = void 0),
      (this._valueRange = 0),
      (this._addedLabels = []));
  }
  init(e) {
    let t = this._addedLabels;
    if (t.length) {
      let e = this.getLabels();
      for (let { index: n, label: r } of t) e[n] === r && e.splice(n, 1);
      this._addedLabels = [];
    }
    super.init(e);
  }
  parse(e, t) {
    if (I(e)) return null;
    let n = this.getLabels();
    return (
      (t =
        isFinite(t) && n[t] === e ? t : Lc(n, e, V(t, e), this._addedLabels)),
      Rc(t, n.length - 1)
    );
  }
  determineDataLimits() {
    let { minDefined: e, maxDefined: t } = this.getUserBounds(),
      { min: n, max: r } = this.getMinMax(!0);
    (this.options.bounds === `ticks` &&
      (e || (n = 0), t || (r = this.getLabels().length - 1)),
      (this.min = n),
      (this.max = r));
  }
  buildTicks() {
    let e = this.min,
      t = this.max,
      n = this.options.offset,
      r = [],
      i = this.getLabels();
    ((i = e === 0 && t === i.length - 1 ? i : i.slice(e, t + 1)),
      (this._valueRange = Math.max(i.length - (n ? 0 : 1), 1)),
      (this._startValue = this.min - (n ? 0.5 : 0)));
    for (let n = e; n <= t; n++) r.push({ value: n });
    return r;
  }
  getLabelForValue(e) {
    return zc.call(this, e);
  }
  configure() {
    (super.configure(),
      this.isHorizontal() || (this._reversePixels = !this._reversePixels));
  }
  getPixelForValue(e) {
    return (
      typeof e != `number` && (e = this.parse(e)),
      e === null
        ? NaN
        : this.getPixelForDecimal((e - this._startValue) / this._valueRange)
    );
  }
  getPixelForTick(e) {
    let t = this.ticks;
    return e < 0 || e > t.length - 1 ? null : this.getPixelForValue(t[e].value);
  }
  getValueForPixel(e) {
    return Math.round(
      this._startValue + this.getDecimalForPixel(e) * this._valueRange,
    );
  }
  getBasePixel() {
    return this.bottom;
  }
};
function Vc(e, t) {
  let n = [],
    {
      bounds: r,
      step: i,
      min: a,
      max: o,
      precision: s,
      count: c,
      maxTicks: l,
      maxDigits: u,
      includeBounds: d,
    } = e,
    f = i || 1,
    p = l - 1,
    { min: m, max: h } = t,
    g = !I(a),
    _ = !I(o),
    v = !I(c),
    y = (h - m) / (u + 1),
    b = xt((h - m) / p / f) * f,
    x,
    S,
    C,
    w;
  if (b < 1e-14 && !g && !_) return [{ value: m }, { value: h }];
  ((w = Math.ceil(h / b) - Math.floor(m / b)),
    w > p && (b = xt((w * b) / p / f) * f),
    I(s) || ((x = 10 ** s), (b = Math.ceil(b * x) / x)),
    r === `ticks`
      ? ((S = Math.floor(m / b) * b), (C = Math.ceil(h / b) * b))
      : ((S = m), (C = h)),
    g && _ && i && Tt((o - a) / i, b / 1e3)
      ? ((w = Math.round(Math.min((o - a) / b, l))),
        (b = (o - a) / w),
        (S = a),
        (C = o))
      : v
        ? ((S = g ? a : S), (C = _ ? o : C), (w = c - 1), (b = (C - S) / w))
        : ((w = (C - S) / b),
          (w = bt(w, Math.round(w), b / 1e3) ? Math.round(w) : Math.ceil(w))));
  let T = Math.max(kt(b), kt(S));
  ((x = 10 ** (I(s) ? T : s)),
    (S = Math.round(S * x) / x),
    (C = Math.round(C * x) / x));
  let E = 0;
  for (
    g &&
    (d && S !== a
      ? (n.push({ value: a }),
        S < a && E++,
        bt(Math.round((S + E * b) * x) / x, a, Hc(a, y, e)) && E++)
      : S < a && E++);
    E < w;
    ++E
  ) {
    let e = Math.round((S + E * b) * x) / x;
    if (_ && e > o) break;
    n.push({ value: e });
  }
  return (
    _ && d && C !== o
      ? n.length && bt(n[n.length - 1].value, o, Hc(o, y, e))
        ? (n[n.length - 1].value = o)
        : n.push({ value: o })
      : (!_ || C === o) && n.push({ value: C }),
    n
  );
}
function Hc(e, t, { horizontal: n, minRotation: r }) {
  let i = Dt(r),
    a = (n ? Math.sin(i) : Math.cos(i)) || 0.001,
    o = 0.75 * t * (`` + e).length;
  return Math.min(t / a, o);
}
var Uc = class extends go {
    constructor(e) {
      (super(e),
        (this.start = void 0),
        (this.end = void 0),
        (this._startValue = void 0),
        (this._endValue = void 0),
        (this._valueRange = 0));
    }
    parse(e, t) {
      return I(e) ||
        ((typeof e == `number` || e instanceof Number) && !isFinite(+e))
        ? null
        : +e;
    }
    handleTickRangeOptions() {
      let { beginAtZero: e } = this.options,
        { minDefined: t, maxDefined: n } = this.getUserBounds(),
        { min: r, max: i } = this,
        a = (e) => (r = t ? r : e),
        o = (e) => (i = n ? i : e);
      if (e) {
        let e = yt(r),
          t = yt(i);
        e < 0 && t < 0 ? o(0) : e > 0 && t > 0 && a(0);
      }
      if (r === i) {
        let t = i === 0 ? 1 : Math.abs(i * 0.05);
        (o(i + t), e || a(r - t));
      }
      ((this.min = r), (this.max = i));
    }
    getTickLimit() {
      let { maxTicksLimit: e, stepSize: t } = this.options.ticks,
        n;
      return (
        t
          ? ((n = Math.ceil(this.max / t) - Math.floor(this.min / t) + 1),
            n > 1e3 &&
              (console.warn(
                `scales.${this.id}.ticks.stepSize: ${t} would result generating up to ${n} ticks. Limiting to 1000.`,
              ),
              (n = 1e3)))
          : ((n = this.computeTickLimit()), (e ||= 11)),
        e && (n = Math.min(e, n)),
        n
      );
    }
    computeTickLimit() {
      return 1 / 0;
    }
    buildTicks() {
      let e = this.options,
        t = e.ticks,
        n = this.getTickLimit();
      n = Math.max(2, n);
      let r = Vc(
        {
          maxTicks: n,
          bounds: e.bounds,
          min: e.min,
          max: e.max,
          precision: t.precision,
          step: t.stepSize,
          count: t.count,
          maxDigits: this._maxDigits(),
          horizontal: this.isHorizontal(),
          minRotation: t.minRotation || 0,
          includeBounds: t.includeBounds !== !1,
        },
        this._range || this,
      );
      return (
        e.bounds === `ticks` && Et(r, this, `value`),
        e.reverse
          ? (r.reverse(), (this.start = this.max), (this.end = this.min))
          : ((this.start = this.min), (this.end = this.max)),
        r
      );
    }
    configure() {
      let e = this.ticks,
        t = this.min,
        n = this.max;
      if ((super.configure(), this.options.offset && e.length)) {
        let r = (n - t) / Math.max(e.length - 1, 1) / 2;
        ((t -= r), (n += r));
      }
      ((this._startValue = t),
        (this._endValue = n),
        (this._valueRange = n - t));
    }
    getLabelForValue(e) {
      return fn(e, this.chart.options.locale, this.options.ticks.format);
    }
  },
  Wc = class extends Uc {
    static id = `linear`;
    static defaults = { ticks: { callback: hn.formatters.numeric } };
    determineDataLimits() {
      let { min: e, max: t } = this.getMinMax(!0);
      ((this.min = z(e) ? e : 0),
        (this.max = z(t) ? t : 1),
        this.handleTickRangeOptions());
    }
    computeTickLimit() {
      let e = this.isHorizontal(),
        t = e ? this.width : this.height,
        n = Dt(this.options.ticks.minRotation),
        r = (e ? Math.sin(n) : Math.cos(n)) || 0.001,
        i = this._resolveTickFontOptions(0);
      return Math.ceil(t / Math.min(40, i.lineHeight / r));
    }
    getPixelForValue(e) {
      return e === null
        ? NaN
        : this.getPixelForDecimal((e - this._startValue) / this._valueRange);
    }
    getValueForPixel(e) {
      return this._startValue + this.getDecimalForPixel(e) * this._valueRange;
    }
  },
  Gc = (e) => Math.floor(vt(e)),
  Kc = (e, t) => 10 ** (Gc(e) + t);
function qc(e) {
  return e / 10 ** Gc(e) == 1;
}
function Jc(e, t, n) {
  let r = 10 ** n,
    i = Math.floor(e / r);
  return Math.ceil(t / r) - i;
}
function Yc(e, t) {
  let n = Gc(t - e);
  for (; Jc(e, t, n) > 10; ) n++;
  for (; Jc(e, t, n) < 10; ) n--;
  return Math.min(n, Gc(e));
}
function Xc(e, { min: t, max: n }) {
  t = B(e.min, t);
  let r = [],
    i = Gc(t),
    a = Yc(t, n),
    o = a < 0 ? 10 ** Math.abs(a) : 1,
    s = 10 ** a,
    c = i > a ? 10 ** i : 0,
    l = Math.round((t - c) * o) / o,
    u = Math.floor((t - c) / s / 10) * s * 10,
    d = Math.floor((l - u) / 10 ** a),
    f = B(e.min, Math.round((c + u + d * 10 ** a) * o) / o);
  for (; f < n; )
    (r.push({ value: f, major: qc(f), significand: d }),
      d >= 10 ? (d = d < 15 ? 15 : 20) : d++,
      d >= 20 && (a++, (d = 2), (o = a >= 0 ? 1 : o)),
      (f = Math.round((c + u + d * 10 ** a) * o) / o));
  let p = B(e.max, f);
  return (r.push({ value: p, major: qc(p), significand: d }), r);
}
(class extends go {
  static id = `logarithmic`;
  static defaults = {
    ticks: { callback: hn.formatters.logarithmic, major: { enabled: !0 } },
  };
  constructor(e) {
    (super(e),
      (this.start = void 0),
      (this.end = void 0),
      (this._startValue = void 0),
      (this._valueRange = 0));
  }
  parse(e, t) {
    let n = Uc.prototype.parse.apply(this, [e, t]);
    if (n === 0) {
      this._zero = !0;
      return;
    }
    return z(n) && n > 0 ? n : null;
  }
  determineDataLimits() {
    let { min: e, max: t } = this.getMinMax(!0);
    ((this.min = z(e) ? Math.max(0, e) : null),
      (this.max = z(t) ? Math.max(0, t) : null),
      this.options.beginAtZero && (this._zero = !0),
      this._zero &&
        this.min !== this._suggestedMin &&
        !z(this._userMin) &&
        (this.min = e === Kc(this.min, 0) ? Kc(this.min, -1) : Kc(this.min, 0)),
      this.handleTickRangeOptions());
  }
  handleTickRangeOptions() {
    let { minDefined: e, maxDefined: t } = this.getUserBounds(),
      n = this.min,
      r = this.max,
      i = (t) => (n = e ? n : t),
      a = (e) => (r = t ? r : e);
    (n === r && (n <= 0 ? (i(1), a(10)) : (i(Kc(n, -1)), a(Kc(r, 1)))),
      n <= 0 && i(Kc(r, -1)),
      r <= 0 && a(Kc(n, 1)),
      (this.min = n),
      (this.max = r));
  }
  buildTicks() {
    let e = this.options,
      t = Xc({ min: this._userMin, max: this._userMax }, this);
    return (
      e.bounds === `ticks` && Et(t, this, `value`),
      e.reverse
        ? (t.reverse(), (this.start = this.max), (this.end = this.min))
        : ((this.start = this.min), (this.end = this.max)),
      t
    );
  }
  getLabelForValue(e) {
    return e === void 0
      ? `0`
      : fn(e, this.chart.options.locale, this.options.ticks.format);
  }
  configure() {
    let e = this.min;
    (super.configure(),
      (this._startValue = vt(e)),
      (this._valueRange = vt(this.max) - vt(e)));
  }
  getPixelForValue(e) {
    return (
      (e === void 0 || e === 0) && (e = this.min),
      e === null || isNaN(e)
        ? NaN
        : this.getPixelForDecimal(
            e === this.min ? 0 : (vt(e) - this._startValue) / this._valueRange,
          )
    );
  }
  getValueForPixel(e) {
    let t = this.getDecimalForPixel(e);
    return 10 ** (this._startValue + t * this._valueRange);
  }
});
function Zc(e) {
  let t = e.ticks;
  if (t.display && e.display) {
    let e = X(t.backdropPadding);
    return V(t.font && t.font.size, Y.font.size) + e.height;
  }
  return 0;
}
function Qc(e, t, n) {
  return (
    (n = L(n) ? n : [n]),
    { w: Cn(e, t.string, n), h: n.length * t.lineHeight }
  );
}
function $c(e, t, n, r, i) {
  return e === r || e === i
    ? { start: t - n / 2, end: t + n / 2 }
    : e < r || e > i
      ? { start: t - n, end: t }
      : { start: t, end: t + n };
}
function el(e) {
  let t = {
      l: e.left + e._padding.left,
      r: e.right - e._padding.right,
      t: e.top + e._padding.top,
      b: e.bottom - e._padding.bottom,
    },
    n = Object.assign({}, t),
    r = [],
    i = [],
    a = e._pointLabels.length,
    o = e.options.pointLabels,
    s = o.centerPointLabels ? W / a : 0;
  for (let c = 0; c < a; c++) {
    let a = o.setContext(e.getPointLabelContext(c));
    i[c] = a.padding;
    let l = e.getPointPosition(c, e.drawingArea + i[c], s),
      u = Z(a.font),
      d = Qc(e.ctx, u, e._pointLabels[c]);
    r[c] = d;
    let f = q(e.getIndexAngle(c) + s),
      p = Math.round(Ot(f));
    tl(n, t, f, $c(p, l.x, d.w, 0, 180), $c(p, l.y, d.h, 90, 270));
  }
  (e.setCenterPoint(t.l - n.l, n.r - t.r, t.t - n.t, n.b - t.b),
    (e._pointLabelItems = il(e, r, i)));
}
function tl(e, t, n, r, i) {
  let a = Math.abs(Math.sin(n)),
    o = Math.abs(Math.cos(n)),
    s = 0,
    c = 0;
  (r.start < t.l
    ? ((s = (t.l - r.start) / a), (e.l = Math.min(e.l, t.l - s)))
    : r.end > t.r && ((s = (r.end - t.r) / a), (e.r = Math.max(e.r, t.r + s))),
    i.start < t.t
      ? ((c = (t.t - i.start) / o), (e.t = Math.min(e.t, t.t - c)))
      : i.end > t.b &&
        ((c = (i.end - t.b) / o), (e.b = Math.max(e.b, t.b + c))));
}
function nl(e, t, n) {
  let r = e.drawingArea,
    { extra: i, additionalAngle: a, padding: o, size: s } = n,
    c = e.getPointPosition(t, r + i + o, a),
    l = Math.round(Ot(q(c.angle + K))),
    u = sl(c.y, s.h, l),
    d = al(l),
    f = ol(c.x, s.w, d);
  return {
    visible: !0,
    x: c.x,
    y: u,
    textAlign: d,
    left: f,
    top: u,
    right: f + s.w,
    bottom: u + s.h,
  };
}
function rl(e, t) {
  if (!t) return !0;
  let { left: n, top: r, right: i, bottom: a } = e;
  return !(
    On({ x: n, y: r }, t) ||
    On({ x: n, y: a }, t) ||
    On({ x: i, y: r }, t) ||
    On({ x: i, y: a }, t)
  );
}
function il(e, t, n) {
  let r = [],
    i = e._pointLabels.length,
    a = e.options,
    { centerPointLabels: o, display: s } = a.pointLabels,
    c = { extra: Zc(a) / 2, additionalAngle: o ? W / i : 0 },
    l;
  for (let a = 0; a < i; a++) {
    ((c.padding = n[a]), (c.size = t[a]));
    let i = nl(e, a, c);
    (r.push(i), s === `auto` && ((i.visible = rl(i, l)), i.visible && (l = i)));
  }
  return r;
}
function al(e) {
  return e === 0 || e === 180 ? `center` : e < 180 ? `left` : `right`;
}
function ol(e, t, n) {
  return (n === `right` ? (e -= t) : n === `center` && (e -= t / 2), e);
}
function sl(e, t, n) {
  return (
    n === 90 || n === 270 ? (e -= t / 2) : (n > 270 || n < 90) && (e -= t),
    e
  );
}
function cl(e, t, n) {
  let { left: r, top: i, right: a, bottom: o } = n,
    { backdropColor: s } = t;
  if (!I(s)) {
    let n = Wn(t.borderRadius),
      c = X(t.backdropPadding);
    e.fillStyle = s;
    let l = r - c.left,
      u = i - c.top,
      d = a - r + c.width,
      f = o - i + c.height;
    Object.values(n).some((e) => e !== 0)
      ? (e.beginPath(), Ln(e, { x: l, y: u, w: d, h: f, radius: n }), e.fill())
      : e.fillRect(l, u, d, f);
  }
}
function ll(e, t) {
  let {
    ctx: n,
    options: { pointLabels: r },
  } = e;
  for (let i = t - 1; i >= 0; i--) {
    let t = e._pointLabelItems[i];
    if (!t.visible) continue;
    let a = r.setContext(e.getPointLabelContext(i));
    cl(n, a, t);
    let o = Z(a.font),
      { x: s, y: c, textAlign: l } = t;
    In(n, e._pointLabels[i], s, c + o.lineHeight / 2, o, {
      color: a.color,
      textAlign: l,
      textBaseline: `middle`,
    });
  }
}
function ul(e, t, n, r) {
  let { ctx: i } = e;
  if (n) i.arc(e.xCenter, e.yCenter, t, 0, G);
  else {
    let n = e.getPointPosition(0, t);
    i.moveTo(n.x, n.y);
    for (let a = 1; a < r; a++)
      ((n = e.getPointPosition(a, t)), i.lineTo(n.x, n.y));
  }
}
function dl(e, t, n, r, i) {
  let a = e.ctx,
    o = t.circular,
    { color: s, lineWidth: c } = t;
  (!o && !r) ||
    !s ||
    !c ||
    n < 0 ||
    (a.save(),
    (a.strokeStyle = s),
    (a.lineWidth = c),
    a.setLineDash(i.dash || []),
    (a.lineDashOffset = i.dashOffset),
    a.beginPath(),
    ul(e, n, o, r),
    a.closePath(),
    a.stroke(),
    a.restore());
}
function fl(e, t, n) {
  return qn(e, { label: n, index: t, type: `pointLabel` });
}
(class extends Uc {
  static id = `radialLinear`;
  static defaults = {
    display: !0,
    animate: !0,
    position: `chartArea`,
    angleLines: {
      display: !0,
      lineWidth: 1,
      borderDash: [],
      borderDashOffset: 0,
    },
    grid: { circular: !1 },
    startAngle: 0,
    ticks: { showLabelBackdrop: !0, callback: hn.formatters.numeric },
    pointLabels: {
      backdropColor: void 0,
      backdropPadding: 2,
      display: !0,
      font: { size: 10 },
      callback(e) {
        return e;
      },
      padding: 5,
      centerPointLabels: !1,
    },
  };
  static defaultRoutes = {
    "angleLines.color": `borderColor`,
    "pointLabels.color": `color`,
    "ticks.color": `color`,
  };
  static descriptors = { angleLines: { _fallback: `grid` } };
  constructor(e) {
    (super(e),
      (this.xCenter = void 0),
      (this.yCenter = void 0),
      (this.drawingArea = void 0),
      (this._pointLabels = []),
      (this._pointLabelItems = []));
  }
  setDimensions() {
    let e = (this._padding = X(Zc(this.options) / 2)),
      t = (this.width = this.maxWidth - e.width),
      n = (this.height = this.maxHeight - e.height);
    ((this.xCenter = Math.floor(this.left + t / 2 + e.left)),
      (this.yCenter = Math.floor(this.top + n / 2 + e.top)),
      (this.drawingArea = Math.floor(Math.min(t, n) / 2)));
  }
  determineDataLimits() {
    let { min: e, max: t } = this.getMinMax(!1);
    ((this.min = z(e) && !isNaN(e) ? e : 0),
      (this.max = z(t) && !isNaN(t) ? t : 0),
      this.handleTickRangeOptions());
  }
  computeTickLimit() {
    return Math.ceil(this.drawingArea / Zc(this.options));
  }
  generateTickLabels(e) {
    (Uc.prototype.generateTickLabels.call(this, e),
      (this._pointLabels = this.getLabels()
        .map((e, t) => {
          let n = H(this.options.pointLabels.callback, [e, t], this);
          return n || n === 0 ? n : ``;
        })
        .filter((e, t) => this.chart.getDataVisibility(t))));
  }
  fit() {
    let e = this.options;
    e.display && e.pointLabels.display
      ? el(this)
      : this.setCenterPoint(0, 0, 0, 0);
  }
  setCenterPoint(e, t, n, r) {
    ((this.xCenter += Math.floor((e - t) / 2)),
      (this.yCenter += Math.floor((n - r) / 2)),
      (this.drawingArea -= Math.min(
        this.drawingArea / 2,
        Math.max(e, t, n, r),
      )));
  }
  getIndexAngle(e) {
    let t = G / (this._pointLabels.length || 1),
      n = this.options.startAngle || 0;
    return q(e * t + Dt(n));
  }
  getDistanceFromCenterForValue(e) {
    if (I(e)) return NaN;
    let t = this.drawingArea / (this.max - this.min);
    return this.options.reverse ? (this.max - e) * t : (e - this.min) * t;
  }
  getValueForDistanceFromCenter(e) {
    if (I(e)) return NaN;
    let t = e / (this.drawingArea / (this.max - this.min));
    return this.options.reverse ? this.max - t : this.min + t;
  }
  getPointLabelContext(e) {
    let t = this._pointLabels || [];
    if (e >= 0 && e < t.length) {
      let n = t[e];
      return fl(this.getContext(), e, n);
    }
  }
  getPointPosition(e, t, n = 0) {
    let r = this.getIndexAngle(e) - K + n;
    return {
      x: Math.cos(r) * t + this.xCenter,
      y: Math.sin(r) * t + this.yCenter,
      angle: r,
    };
  }
  getPointPositionForValue(e, t) {
    return this.getPointPosition(e, this.getDistanceFromCenterForValue(t));
  }
  getBasePosition(e) {
    return this.getPointPositionForValue(e || 0, this.getBaseValue());
  }
  getPointLabelPosition(e) {
    let { left: t, top: n, right: r, bottom: i } = this._pointLabelItems[e];
    return { left: t, top: n, right: r, bottom: i };
  }
  drawBackground() {
    let {
      backgroundColor: e,
      grid: { circular: t },
    } = this.options;
    if (e) {
      let n = this.ctx;
      (n.save(),
        n.beginPath(),
        ul(
          this,
          this.getDistanceFromCenterForValue(this._endValue),
          t,
          this._pointLabels.length,
        ),
        n.closePath(),
        (n.fillStyle = e),
        n.fill(),
        n.restore());
    }
  }
  drawGrid() {
    let e = this.ctx,
      t = this.options,
      { angleLines: n, grid: r, border: i } = t,
      a = this._pointLabels.length,
      o,
      s,
      c;
    if (
      (t.pointLabels.display && ll(this, a),
      r.display &&
        this.ticks.forEach((e, t) => {
          if (t !== 0 || (t === 0 && this.min < 0)) {
            s = this.getDistanceFromCenterForValue(e.value);
            let n = this.getContext(t),
              o = r.setContext(n),
              c = i.setContext(n);
            dl(this, o, s, a, c);
          }
        }),
      n.display)
    ) {
      for (e.save(), o = a - 1; o >= 0; o--) {
        let r = n.setContext(this.getPointLabelContext(o)),
          { color: i, lineWidth: a } = r;
        !a ||
          !i ||
          ((e.lineWidth = a),
          (e.strokeStyle = i),
          e.setLineDash(r.borderDash),
          (e.lineDashOffset = r.borderDashOffset),
          (s = this.getDistanceFromCenterForValue(
            t.reverse ? this.min : this.max,
          )),
          (c = this.getPointPosition(o, s)),
          e.beginPath(),
          e.moveTo(this.xCenter, this.yCenter),
          e.lineTo(c.x, c.y),
          e.stroke());
      }
      e.restore();
    }
  }
  drawBorder() {}
  drawLabels() {
    let e = this.ctx,
      t = this.options,
      n = t.ticks;
    if (!n.display) return;
    let r = this.getIndexAngle(0),
      i,
      a;
    (e.save(),
      e.translate(this.xCenter, this.yCenter),
      e.rotate(r),
      (e.textAlign = `center`),
      (e.textBaseline = `middle`),
      this.ticks.forEach((r, o) => {
        if (o === 0 && this.min >= 0 && !t.reverse) return;
        let s = n.setContext(this.getContext(o)),
          c = Z(s.font);
        if (
          ((i = this.getDistanceFromCenterForValue(this.ticks[o].value)),
          s.showLabelBackdrop)
        ) {
          ((e.font = c.string),
            (a = e.measureText(r.label).width),
            (e.fillStyle = s.backdropColor));
          let t = X(s.backdropPadding);
          e.fillRect(
            -a / 2 - t.left,
            -i - c.size / 2 - t.top,
            a + t.width,
            c.size + t.height,
          );
        }
        In(e, r.label, 0, -i, c, {
          color: s.color,
          strokeColor: s.textStrokeColor,
          strokeWidth: s.textStrokeWidth,
        });
      }),
      e.restore());
  }
  drawTitle() {}
});
var pl = {
    millisecond: { common: !0, size: 1, steps: 1e3 },
    second: { common: !0, size: 1e3, steps: 60 },
    minute: { common: !0, size: 6e4, steps: 60 },
    hour: { common: !0, size: 36e5, steps: 24 },
    day: { common: !0, size: 864e5, steps: 30 },
    week: { common: !1, size: 6048e5, steps: 4 },
    month: { common: !0, size: 2628e6, steps: 12 },
    quarter: { common: !1, size: 7884e6, steps: 4 },
    year: { common: !0, size: 3154e7 },
  },
  $ = Object.keys(pl);
function ml(e, t) {
  return e - t;
}
function hl(e, t) {
  if (I(t)) return null;
  let n = e._adapter,
    { parser: r, round: i, isoWeekday: a } = e._parseOpts,
    o = t;
  return (
    typeof r == `function` && (o = r(o)),
    z(o) || (o = typeof r == `string` ? n.parse(o, r) : n.parse(o)),
    o === null
      ? null
      : (i &&
          (o =
            i === `week` && (wt(a) || a === !0)
              ? n.startOf(o, `isoWeek`, a)
              : n.startOf(o, i)),
        +o)
  );
}
function gl(e, t, n, r) {
  let i = $.length;
  for (let a = $.indexOf(e); a < i - 1; ++a) {
    let e = pl[$[a]],
      i = e.steps ? e.steps : 2 ** 53 - 1;
    if (e.common && Math.ceil((n - t) / (i * e.size)) <= r) return $[a];
  }
  return $[i - 1];
}
function _l(e, t, n, r, i) {
  for (let a = $.length - 1; a >= $.indexOf(n); a--) {
    let n = $[a];
    if (pl[n].common && e._adapter.diff(i, r, n) >= t - 1) return n;
  }
  return $[n ? $.indexOf(n) : 0];
}
function vl(e) {
  for (let t = $.indexOf(e) + 1, n = $.length; t < n; ++t)
    if (pl[$[t]].common) return $[t];
}
function yl(e, t, n) {
  if (!n) e[t] = !0;
  else if (n.length) {
    let { lo: r, hi: i } = It(n, t),
      a = n[r] >= t ? n[r] : n[i];
    e[a] = !0;
  }
}
function bl(e, t, n, r) {
  let i = e._adapter,
    a = +i.startOf(t[0].value, r),
    o = t[t.length - 1].value,
    s,
    c;
  for (s = a; s <= o; s = +i.add(s, 1, r))
    ((c = n[s]), c >= 0 && (t[c].major = !0));
  return t;
}
function xl(e, t, n) {
  let r = [],
    i = {},
    a = t.length,
    o,
    s;
  for (o = 0; o < a; ++o)
    ((s = t[o]), (i[s] = o), r.push({ value: s, major: !1 }));
  return a === 0 || !n ? r : bl(e, r, i, n);
}
var Sl = class extends go {
  static id = `time`;
  static defaults = {
    bounds: `data`,
    adapters: {},
    time: {
      parser: !1,
      unit: !1,
      round: !1,
      isoWeekday: !1,
      minUnit: `millisecond`,
      displayFormats: {},
    },
    ticks: { source: `auto`, callback: !1, major: { enabled: !1 } },
  };
  constructor(e) {
    (super(e),
      (this._cache = { data: [], labels: [], all: [] }),
      (this._unit = `day`),
      (this._majorUnit = void 0),
      (this._offsets = {}),
      (this._normalized = !1),
      (this._parseOpts = void 0));
  }
  init(e, t = {}) {
    let n = (e.time ||= {}),
      r = (this._adapter = new $i._date(e.adapters.date));
    (r.init(t),
      nt(n.displayFormats, r.formats()),
      (this._parseOpts = {
        parser: n.parser,
        round: n.round,
        isoWeekday: n.isoWeekday,
      }),
      super.init(e),
      (this._normalized = t.normalized));
  }
  parse(e, t) {
    return e === void 0 ? null : hl(this, e);
  }
  beforeLayout() {
    (super.beforeLayout(), (this._cache = { data: [], labels: [], all: [] }));
  }
  determineDataLimits() {
    let e = this.options,
      t = this._adapter,
      n = e.time.unit || `day`,
      { min: r, max: i, minDefined: a, maxDefined: o } = this.getUserBounds();
    function s(e) {
      (!a && !isNaN(e.min) && (r = Math.min(r, e.min)),
        !o && !isNaN(e.max) && (i = Math.max(i, e.max)));
    }
    ((!a || !o) &&
      (s(this._getLabelBounds()),
      (e.bounds !== `ticks` || e.ticks.source !== `labels`) &&
        s(this.getMinMax(!1))),
      (r = z(r) && !isNaN(r) ? r : +t.startOf(Date.now(), n)),
      (i = z(i) && !isNaN(i) ? i : +t.endOf(Date.now(), n) + 1),
      (this.min = Math.min(r, i - 1)),
      (this.max = Math.max(r + 1, i)));
  }
  _getLabelBounds() {
    let e = this.getLabelTimestamps(),
      t = 1 / 0,
      n = -1 / 0;
    return (
      e.length && ((t = e[0]), (n = e[e.length - 1])),
      { min: t, max: n }
    );
  }
  buildTicks() {
    let e = this.options,
      t = e.time,
      n = e.ticks,
      r = n.source === `labels` ? this.getLabelTimestamps() : this._generate();
    e.bounds === `ticks` &&
      r.length &&
      ((this.min = this._userMin || r[0]),
      (this.max = this._userMax || r[r.length - 1]));
    let i = this.min,
      a = this.max,
      o = zt(r, i, a);
    return (
      (this._unit =
        t.unit ||
        (n.autoSkip
          ? gl(t.minUnit, this.min, this.max, this._getLabelCapacity(i))
          : _l(this, o.length, t.minUnit, this.min, this.max))),
      (this._majorUnit =
        !n.major.enabled || this._unit === `year` ? void 0 : vl(this._unit)),
      this.initOffsets(r),
      e.reverse && o.reverse(),
      xl(this, o, this._majorUnit)
    );
  }
  afterAutoSkip() {
    this.options.offsetAfterAutoskip &&
      this.initOffsets(this.ticks.map((e) => +e.value));
  }
  initOffsets(e = []) {
    let t = 0,
      n = 0,
      r,
      i;
    this.options.offset &&
      e.length &&
      ((r = this.getDecimalForValue(e[0])),
      (t = e.length === 1 ? 1 - r : (this.getDecimalForValue(e[1]) - r) / 2),
      (i = this.getDecimalForValue(e[e.length - 1])),
      (n =
        e.length === 1
          ? i
          : (i - this.getDecimalForValue(e[e.length - 2])) / 2));
    let a = e.length < 3 ? 0.5 : 0.25;
    ((t = J(t, 0, a)),
      (n = J(n, 0, a)),
      (this._offsets = { start: t, end: n, factor: 1 / (t + 1 + n) }));
  }
  _generate() {
    let e = this._adapter,
      t = this.min,
      n = this.max,
      r = this.options,
      i = r.time,
      a = i.unit || gl(i.minUnit, t, n, this._getLabelCapacity(t)),
      o = V(r.ticks.stepSize, 1),
      s = a === `week` ? i.isoWeekday : !1,
      c = wt(s) || s === !0,
      l = {},
      u = t,
      d,
      f;
    if (
      (c && (u = +e.startOf(u, `isoWeek`, s)),
      (u = +e.startOf(u, c ? `day` : a)),
      e.diff(n, t, a) > 1e5 * o)
    )
      throw Error(
        t + ` and ` + n + ` are too far apart with stepSize of ` + o + ` ` + a,
      );
    let p = r.ticks.source === `data` && this.getDataTimestamps();
    for (d = u, f = 0; d < n; d = +e.add(d, o, a), f++) yl(l, d, p);
    return (
      (d === n || r.bounds === `ticks` || f === 1) && yl(l, d, p),
      Object.keys(l)
        .sort(ml)
        .map((e) => +e)
    );
  }
  getLabelForValue(e) {
    let t = this._adapter,
      n = this.options.time;
    return n.tooltipFormat
      ? t.format(e, n.tooltipFormat)
      : t.format(e, n.displayFormats.datetime);
  }
  format(e, t) {
    let n = this.options.time.displayFormats,
      r = this._unit,
      i = t || n[r];
    return this._adapter.format(e, i);
  }
  _tickFormatFunction(e, t, n, r) {
    let i = this.options,
      a = i.ticks.callback;
    if (a) return H(a, [e, t, n], this);
    let o = i.time.displayFormats,
      s = this._unit,
      c = this._majorUnit,
      l = s && o[s],
      u = c && o[c],
      d = n[t],
      f = c && u && d && d.major;
    return this._adapter.format(e, r || (f ? u : l));
  }
  generateTickLabels(e) {
    let t, n, r;
    for (t = 0, n = e.length; t < n; ++t)
      ((r = e[t]), (r.label = this._tickFormatFunction(r.value, t, e)));
  }
  getDecimalForValue(e) {
    return e === null ? NaN : (e - this.min) / (this.max - this.min);
  }
  getPixelForValue(e) {
    let t = this._offsets,
      n = this.getDecimalForValue(e);
    return this.getPixelForDecimal((t.start + n) * t.factor);
  }
  getValueForPixel(e) {
    let t = this._offsets,
      n = this.getDecimalForPixel(e) / t.factor - t.end;
    return this.min + n * (this.max - this.min);
  }
  _getLabelSize(e) {
    let t = this.options.ticks,
      n = this.ctx.measureText(e).width,
      r = Dt(this.isHorizontal() ? t.maxRotation : t.minRotation),
      i = Math.cos(r),
      a = Math.sin(r),
      o = this._resolveTickFontOptions(0).size;
    return { w: n * i + o * a, h: n * a + o * i };
  }
  _getLabelCapacity(e) {
    let t = this.options.time,
      n = t.displayFormats,
      r = n[t.unit] || n.millisecond,
      i = this._tickFormatFunction(e, 0, xl(this, [e], this._majorUnit), r),
      a = this._getLabelSize(i),
      o =
        Math.floor(this.isHorizontal() ? this.width / a.w : this.height / a.h) -
        1;
    return o > 0 ? o : 1;
  }
  getDataTimestamps() {
    let e = this._cache.data || [],
      t,
      n;
    if (e.length) return e;
    let r = this.getMatchingVisibleMetas();
    if (this._normalized && r.length)
      return (this._cache.data = r[0].controller.getAllParsedValues(this));
    for (t = 0, n = r.length; t < n; ++t)
      e = e.concat(r[t].controller.getAllParsedValues(this));
    return (this._cache.data = this.normalize(e));
  }
  getLabelTimestamps() {
    let e = this._cache.labels || [],
      t,
      n;
    if (e.length) return e;
    let r = this.getLabels();
    for (t = 0, n = r.length; t < n; ++t) e.push(hl(this, r[t]));
    return (this._cache.labels = this._normalized ? e : this.normalize(e));
  }
  normalize(e) {
    return Ut(e.sort(ml));
  }
};
function Cl(e, t, n) {
  let r = 0,
    i = e.length - 1,
    a,
    o,
    s,
    c;
  n
    ? (t >= e[r].pos && t <= e[i].pos && ({ lo: r, hi: i } = Lt(e, `pos`, t)),
      ({ pos: a, time: s } = e[r]),
      ({ pos: o, time: c } = e[i]))
    : (t >= e[r].time &&
        t <= e[i].time &&
        ({ lo: r, hi: i } = Lt(e, `time`, t)),
      ({ time: a, pos: s } = e[r]),
      ({ time: o, pos: c } = e[i]));
  let l = o - a;
  return l ? s + ((c - s) * (t - a)) / l : s;
}
(class extends Sl {
  static id = `timeseries`;
  static defaults = Sl.defaults;
  constructor(e) {
    (super(e),
      (this._table = []),
      (this._minPos = void 0),
      (this._tableRange = void 0));
  }
  initOffsets() {
    let e = this._getTimestampsForTable(),
      t = (this._table = this.buildLookupTable(e));
    ((this._minPos = Cl(t, this.min)),
      (this._tableRange = Cl(t, this.max) - this._minPos),
      super.initOffsets(e));
  }
  buildLookupTable(e) {
    let { min: t, max: n } = this,
      r = [],
      i = [],
      a,
      o,
      s,
      c,
      l;
    for (a = 0, o = e.length; a < o; ++a)
      ((c = e[a]), c >= t && c <= n && r.push(c));
    if (r.length < 2)
      return [
        { time: t, pos: 0 },
        { time: n, pos: 1 },
      ];
    for (a = 0, o = r.length; a < o; ++a)
      ((l = r[a + 1]),
        (s = r[a - 1]),
        (c = r[a]),
        Math.round((l + s) / 2) !== c && i.push({ time: c, pos: a / (o - 1) }));
    return i;
  }
  _generate() {
    let e = this.min,
      t = this.max,
      n = super.getDataTimestamps();
    return (
      (!n.includes(e) || !n.length) && n.splice(0, 0, e),
      (!n.includes(t) || n.length === 1) && n.push(t),
      n.sort((e, t) => e - t)
    );
  }
  _getTimestampsForTable() {
    let e = this._cache.all || [];
    if (e.length) return e;
    let t = this.getDataTimestamps(),
      n = this.getLabelTimestamps();
    return (
      (e =
        t.length && n.length ? this.normalize(t.concat(n)) : t.length ? t : n),
      (e = this._cache.all = e),
      e
    );
  }
  getDecimalForValue(e) {
    return (Cl(this._table, e) - this._minPos) / this._tableRange;
  }
  getValueForPixel(e) {
    let t = this._offsets,
      n = this.getDecimalForPixel(e) / t.factor - t.end;
    return Cl(this._table, n * this._tableRange + this._minPos, !0);
  }
});
var wl = `label`;
function Tl(e, t) {
  typeof e == `function` ? e(t) : e && (e.current = t);
}
function El(e, t) {
  let n = e.options;
  n && t && Object.assign(n, t);
}
function Dl(e, t) {
  e.labels = t;
}
function Ol(e, t, n = wl) {
  let r = [];
  e.datasets = t.map((t) => {
    let i = e.datasets.find((e) => e[n] === t[n]);
    return !i || !t.data || r.includes(i)
      ? { ...t }
      : (r.push(i), Object.assign(i, t), i);
  });
}
function kl(e, t = wl) {
  let n = { labels: [], datasets: [] };
  return (Dl(n, e.labels), Ol(n, e.datasets, t), n);
}
function Al(e, t) {
  let {
      height: n = 150,
      width: r = 300,
      redraw: i = !1,
      datasetIdKey: a,
      type: o,
      data: s,
      options: c,
      plugins: l = [],
      fallbackContent: u,
      updateMode: d,
      ...f
    } = e,
    p = (0, A.useRef)(null),
    m = (0, A.useRef)(null),
    h = () => {
      p.current &&
        ((m.current = new is(p.current, {
          type: o,
          data: kl(s, a),
          options: c && { ...c },
          plugins: l,
        })),
        Tl(t, m.current));
    },
    g = () => {
      (Tl(t, null), (m.current &&= (m.current.destroy(), null)));
    };
  return (
    (0, A.useEffect)(() => {
      !i && m.current && c && El(m.current, c);
    }, [i, c]),
    (0, A.useEffect)(() => {
      !i && m.current && Dl(m.current.config.data, s.labels);
    }, [i, s.labels]),
    (0, A.useEffect)(() => {
      !i && m.current && s.datasets && Ol(m.current.config.data, s.datasets, a);
    }, [i, s.datasets]),
    (0, A.useEffect)(() => {
      m.current && (i ? (g(), setTimeout(h)) : m.current.update(d));
    }, [i, c, s.labels, s.datasets, d]),
    (0, A.useEffect)(() => {
      m.current && (g(), setTimeout(h));
    }, [o]),
    (0, A.useEffect)(() => (h(), () => g()), []),
    (0, k.jsx)(`canvas`, {
      ref: p,
      role: `img`,
      height: n,
      width: r,
      ...f,
      children: u,
    })
  );
}
var jl = (0, A.forwardRef)(Al);
function Ml(e, t) {
  return (
    is.register(t),
    (0, A.forwardRef)((t, n) => (0, k.jsx)(jl, { ...t, ref: n, type: e }))
  );
}
var Nl = Ml(`line`, Zi),
  Pl = Ml(`bar`, Xi);
function Fl(e, t = 1) {
  return typeof document > `u`
    ? `transparent`
    : `oklch(${getComputedStyle(document.documentElement).getPropertyValue(`--${e}`).trim()} / ${t})`;
}
is.register(Bc, Wc, As, Fc);
function Il(e) {
  let t = (0, ae.c)(16),
    { timeline: n } = e,
    r;
  t[0] === n ? (r = t[1]) : ((r = n.map(Rl)), (t[0] = n), (t[1] = r));
  let i = r,
    a;
  t[2] === n ? (a = t[3]) : ((a = n.map(Ll)), (t[2] = n), (t[3] = a));
  let o, s;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = Fl(`chart-1`, 0.8)), (s = Fl(`chart-1`)), (t[4] = o), (t[5] = s))
    : ((o = t[4]), (s = t[5]));
  let c;
  t[6] === a
    ? (c = t[7])
    : ((c = [
        {
          label: `PRs Shipped`,
          data: a,
          backgroundColor: o,
          borderColor: s,
          borderWidth: 1,
          borderRadius: 4,
        },
      ]),
      (t[6] = a),
      (t[7] = c));
  let l;
  t[8] !== i || t[9] !== c
    ? ((l = { labels: i, datasets: c }), (t[8] = i), (t[9] = c), (t[10] = l))
    : (l = t[10]);
  let u = l,
    f;
  t[11] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = { legend: { display: !1 } }), (t[11] = f))
    : (f = t[11]);
  let m;
  t[12] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = {
        responsive: !0,
        maintainAspectRatio: !1,
        plugins: f,
        scales: { y: { beginAtZero: !0, ticks: { stepSize: 1 } } },
      }),
      (t[12] = m))
    : (m = t[12]);
  let h = m,
    g;
  t[13] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((g = (0, k.jsx)(`h3`, {
        className: `text-sm font-semibold text-foreground mb-3 sm:mb-4`,
        children: `PRs Shipped Over Time`,
      })),
      (t[13] = g))
    : (g = t[13]);
  let _;
  return (
    t[14] === u
      ? (_ = t[15])
      : ((_ = (0, k.jsx)(p, {
          className: `shadow-none bg-muted/40`,
          children: (0, k.jsxs)(d, {
            className: `p-3 sm:p-4`,
            children: [
              g,
              (0, k.jsx)(`div`, {
                className: `h-48 sm:h-64`,
                children: (0, k.jsx)(Pl, { data: u, options: h }),
              }),
            ],
          }),
        })),
        (t[14] = u),
        (t[15] = _)),
    _
  );
}
function Ll(e) {
  return e.prsShipped;
}
function Rl(e) {
  return w(e.date).format(`M/D`);
}
function zl(e) {
  let t = (0, ae.c)(21),
    { totalSessions: n, sessionsWithPr: r, shipRate: i } = e,
    a;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((a = (0, k.jsx)(`h3`, {
        className: `text-sm font-semibold text-foreground`,
        children: `Session to PR Funnel`,
      })),
      (t[0] = a))
    : (a = t[0]);
  let o;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, k.jsx)(`span`, {
        className: `text-muted-foreground`,
        children: `Sessions Created`,
      })),
      (t[1] = o))
    : (o = t[1]);
  let s;
  t[2] === n
    ? (s = t[3])
    : ((s = (0, k.jsxs)(`div`, {
        className: `flex justify-between text-sm mb-1`,
        children: [
          o,
          (0, k.jsx)(`span`, {
            className: `font-medium text-foreground`,
            children: n,
          }),
        ],
      })),
      (t[2] = n),
      (t[3] = s));
  let c;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = (0, k.jsx)(f, { value: 100 })), (t[4] = c))
    : (c = t[4]);
  let l;
  t[5] === s
    ? (l = t[6])
    : ((l = (0, k.jsxs)(`div`, { children: [s, c] })), (t[5] = s), (t[6] = l));
  let u;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((u = (0, k.jsx)(`span`, {
        className: `text-muted-foreground`,
        children: `PRs Opened`,
      })),
      (t[7] = u))
    : (u = t[7]);
  let m;
  t[8] === r
    ? (m = t[9])
    : ((m = (0, k.jsxs)(`div`, {
        className: `flex justify-between text-sm mb-1`,
        children: [
          u,
          (0, k.jsx)(`span`, {
            className: `font-medium text-foreground`,
            children: r,
          }),
        ],
      })),
      (t[8] = r),
      (t[9] = m));
  let h = n > 0 ? (r / n) * 100 : 0,
    g;
  t[10] === h
    ? (g = t[11])
    : ((g = (0, k.jsx)(f, { value: h })), (t[10] = h), (t[11] = g));
  let _;
  t[12] !== m || t[13] !== g
    ? ((_ = (0, k.jsxs)(`div`, { children: [m, g] })),
      (t[12] = m),
      (t[13] = g),
      (t[14] = _))
    : (_ = t[14]);
  let v;
  t[15] === i
    ? (v = t[16])
    : ((v = (0, k.jsx)(`div`, {
        className: `pt-2`,
        children: (0, k.jsxs)(`p`, {
          className: `text-sm text-muted-foreground`,
          children: [
            `Ship Rate:`,
            ` `,
            (0, k.jsxs)(`span`, {
              className: `font-bold text-foreground`,
              children: [i, `%`],
            }),
          ],
        }),
      })),
      (t[15] = i),
      (t[16] = v));
  let y;
  return (
    t[17] !== _ || t[18] !== v || t[19] !== l
      ? ((y = (0, k.jsx)(p, {
          className: `shadow-none bg-muted/40`,
          children: (0, k.jsxs)(d, {
            className: `p-3 space-y-3 sm:p-4 sm:space-y-4`,
            children: [
              a,
              (0, k.jsxs)(`div`, {
                className: `space-y-3`,
                children: [l, _, v],
              }),
            ],
          }),
        })),
        (t[17] = _),
        (t[18] = v),
        (t[19] = l),
        (t[20] = y))
      : (y = t[20]),
    y
  );
}
is.register(Bc, Wc, bs, vs, sc, Fc, gc);
function Bl(e) {
  let t = (0, ae.c)(25),
    { timeline: n } = e,
    r;
  t[0] === n ? (r = t[1]) : ((r = n.map(Ul)), (t[0] = n), (t[1] = r));
  let i = r,
    a;
  t[2] === n ? (a = t[3]) : ((a = n.map(Hl)), (t[2] = n), (t[3] = a));
  let o, s;
  t[4] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = Fl(`chart-2`)), (s = Fl(`chart-2`, 0.1)), (t[4] = o), (t[5] = s))
    : ((o = t[4]), (s = t[5]));
  let c;
  t[6] === a
    ? (c = t[7])
    : ((c = {
        label: `Sessions`,
        data: a,
        borderColor: o,
        backgroundColor: s,
        fill: !0,
        tension: 0.4,
      }),
      (t[6] = a),
      (t[7] = c));
  let l;
  t[8] === n ? (l = t[9]) : ((l = n.map(Vl)), (t[8] = n), (t[9] = l));
  let u, f;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((u = Fl(`chart-4`)), (f = Fl(`chart-4`, 0.1)), (t[10] = u), (t[11] = f))
    : ((u = t[10]), (f = t[11]));
  let m;
  t[12] === l
    ? (m = t[13])
    : ((m = {
        label: `Runs`,
        data: l,
        borderColor: u,
        backgroundColor: f,
        fill: !0,
        tension: 0.4,
      }),
      (t[12] = l),
      (t[13] = m));
  let h;
  t[14] !== c || t[15] !== m
    ? ((h = [c, m]), (t[14] = c), (t[15] = m), (t[16] = h))
    : (h = t[16]);
  let g;
  t[17] !== i || t[18] !== h
    ? ((g = { labels: i, datasets: h }), (t[17] = i), (t[18] = h), (t[19] = g))
    : (g = t[19]);
  let _ = g,
    v;
  t[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = { legend: { position: `bottom`, labels: { usePointStyle: !0 } } }),
      (t[20] = v))
    : (v = t[20]);
  let y;
  t[21] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((y = {
        responsive: !0,
        maintainAspectRatio: !1,
        plugins: v,
        scales: { y: { beginAtZero: !0, ticks: { stepSize: 1 } } },
      }),
      (t[21] = y))
    : (y = t[21]);
  let b = y,
    x;
  t[22] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((x = (0, k.jsx)(`h3`, {
        className: `text-sm font-semibold text-foreground mb-3 sm:mb-4`,
        children: `Activity Over Time`,
      })),
      (t[22] = x))
    : (x = t[22]);
  let S;
  return (
    t[23] === _
      ? (S = t[24])
      : ((S = (0, k.jsx)(p, {
          className: `shadow-none bg-muted/40`,
          children: (0, k.jsxs)(d, {
            className: `p-3 sm:p-4`,
            children: [
              x,
              (0, k.jsx)(`div`, {
                className: `h-48 sm:h-64`,
                children: (0, k.jsx)(Nl, { data: _, options: b }),
              }),
            ],
          }),
        })),
        (t[23] = _),
        (t[24] = S)),
    S
  );
}
function Vl(e) {
  return e.runs;
}
function Hl(e) {
  return e.sessions;
}
function Ul(e) {
  return w(e.date).format(`M/D`);
}
var Wl = [
  `text-warning`,
  `text-muted-foreground`,
  `text-warning/70`,
  `text-muted-foreground`,
  `text-muted-foreground`,
];
function Gl(e) {
  let t = (0, ae.c)(6),
    { entries: n } = e;
  if (n.length === 0) {
    let e;
    return (
      t[0] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((e = (0, k.jsx)(p, {
            className: `bg-muted/40 shadow-none animate-in fade-in duration-300`,
            children: (0, k.jsxs)(d, {
              className: `p-3 sm:p-4`,
              children: [
                (0, k.jsx)(`h3`, {
                  className: `text-sm font-semibold text-foreground mb-3 sm:mb-4`,
                  children: `Top Contributors`,
                }),
                (0, k.jsx)(`div`, {
                  className: `py-8 text-center text-muted-foreground`,
                  children: `No activity yet`,
                }),
              ],
            }),
          })),
          (t[0] = e))
        : (e = t[0]),
      e
    );
  }
  let r;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = (0, k.jsx)(`h3`, {
        className: `text-sm font-semibold text-foreground mb-3 sm:mb-4`,
        children: `Top Contributors`,
      })),
      (t[1] = r))
    : (r = t[1]);
  let i;
  t[2] === n ? (i = t[3]) : ((i = n.map(Kl)), (t[2] = n), (t[3] = i));
  let a;
  return (
    t[4] === i
      ? (a = t[5])
      : ((a = (0, k.jsx)(p, {
          className: `bg-muted/40 shadow-none animate-in fade-in duration-300`,
          children: (0, k.jsxs)(d, {
            className: `p-3 sm:p-4`,
            children: [
              r,
              (0, k.jsx)(`div`, { className: `space-y-3`, children: i }),
            ],
          }),
        })),
        (t[4] = i),
        (t[5] = a)),
    a
  );
}
function Kl(e, t) {
  return (0, k.jsxs)(
    `div`,
    {
      className: `motion-base flex items-center gap-2 rounded-lg p-1.5 transition-all duration-200 hover:translate-x-0.5 hover:bg-muted sm:gap-3 sm:p-2`,
      children: [
        (0, k.jsx)(`div`, {
          className: `w-6 text-center font-bold ${Wl[t]}`,
          children:
            t === 0 ? (0, k.jsx)(O, { size: 18, className: `mx-auto` }) : t + 1,
        }),
        (0, k.jsx)(`div`, {
          className: `p-1.5 rounded-full bg-secondary sm:p-2`,
          children: (0, k.jsx)(S, {
            size: 14,
            className: `text-muted-foreground sm:w-4 sm:h-4`,
          }),
        }),
        (0, k.jsx)(`div`, {
          className: `flex-1 min-w-0`,
          children: (0, k.jsx)(`p`, {
            className: `text-sm font-medium text-foreground truncate`,
            children: e.fullName || `Unknown User`,
          }),
        }),
        (0, k.jsxs)(`div`, {
          className: `flex items-center gap-2 text-xs sm:gap-4`,
          children: [
            (0, k.jsxs)(`div`, {
              className: `text-right`,
              children: [
                (0, k.jsx)(`p`, {
                  className: `font-semibold text-foreground`,
                  children: e.prsCreated,
                }),
                (0, k.jsx)(`p`, {
                  className: `text-muted-foreground`,
                  children: `PRs`,
                }),
              ],
            }),
            (0, k.jsxs)(`div`, {
              className: `text-right`,
              children: [
                (0, k.jsx)(`p`, {
                  className: `font-semibold text-foreground`,
                  children: e.tasksCompleted,
                }),
                (0, k.jsx)(`p`, {
                  className: `text-muted-foreground`,
                  children: `tasks`,
                }),
              ],
            }),
          ],
        }),
      ],
    },
    e.clerkId,
  );
}
var ql = 7,
  Jl = [``, `Mon`, ``, `Wed`, ``, `Fri`, ``],
  Yl = [
    `Jan`,
    `Feb`,
    `Mar`,
    `Apr`,
    `May`,
    `Jun`,
    `Jul`,
    `Aug`,
    `Sep`,
    `Oct`,
    `Nov`,
    `Dec`,
  ];
function Xl(e, t) {
  if (e === 0) return `bg-muted/50`;
  let n = e / t;
  return n <= 0.25
    ? `bg-emerald-300/60 dark:bg-emerald-800/60`
    : n <= 0.5
      ? `bg-emerald-400/70 dark:bg-emerald-700/70`
      : n <= 0.75
        ? `bg-emerald-500/80 dark:bg-emerald-600/80`
        : `bg-emerald-600 dark:bg-emerald-500`;
}
function Zl(e, t) {
  let n = new Map();
  for (let t of e) n.set(t.date, t.count);
  let r = new Date();
  r.setHours(0, 0, 0, 0);
  let i = r.getDay(),
    a = (t - 1) * ql + i + 1,
    o = new Date(r);
  o.setDate(o.getDate() - a + 1);
  let s = [],
    c = [],
    l = new Date(o);
  for (let e = 0; e < a; e++) {
    let e = l.toISOString().slice(0, 10),
      t = l.getDay();
    (t === 0 && c.length > 0 && (s.push(c), (c = [])),
      c.push({ date: e, count: n.get(e) ?? 0, dayOfWeek: t }),
      l.setDate(l.getDate() + 1));
  }
  return (c.length > 0 && s.push(c), s);
}
function Ql(e) {
  let t = [],
    n = -1;
  for (let r = 0; r < e.length; r++) {
    let i = e[r][0];
    if (!i) continue;
    let a = new Date(i.date).getMonth();
    a !== n && (t.push({ label: Yl[a], colIndex: r }), (n = a));
  }
  return t;
}
function $l(e) {
  return new Date(e + `T00:00:00`).toLocaleDateString(`en-US`, {
    month: `short`,
    day: `numeric`,
    year: `numeric`,
  });
}
function eu(e) {
  let t = new Map();
  for (let n of e) t.set(n.date, n.count);
  let n = new Date();
  n.setHours(0, 0, 0, 0);
  let r = 0,
    i = new Date(n);
  for (;;) {
    let e = i.toISOString().slice(0, 10);
    if ((t.get(e) ?? 0) === 0) break;
    (r++, i.setDate(i.getDate() - 1));
  }
  let a = 0,
    o = 0,
    s = [...t.entries()].sort((e, t) => e[0].localeCompare(t[0])),
    c;
  for (let [e, t] of s) {
    let n = new Date(e + `T00:00:00`);
    (t > 0
      ? (c && n.getTime() - c.getTime() === 864e5 ? o++ : (o = 1),
        o > a && (a = o))
      : (o = 0),
      (c = n));
  }
  return { currentStreak: r, longestStreak: a };
}
function tu(e) {
  let t = (0, ae.c)(54),
    { data: n, days: r } = e,
    i = Math.max(2, Math.ceil((r ?? 365) / 7) + 1),
    a,
    s,
    u,
    d,
    f,
    p;
  if (t[0] !== n || t[1] !== i) {
    let e = Zl(n, i),
      r = 0;
    p = 0;
    for (let t of e)
      for (let e of t) (e.count > r && (r = e.count), (p += e.count));
    let o;
    (t[8] === n ? (o = t[9]) : ((o = eu(n)), (t[8] = n), (t[9] = o)),
      ({ currentStreak: a, longestStreak: s } = o),
      (u = e),
      (d = r || 1),
      (f = Ql(e)),
      (t[0] = n),
      (t[1] = i),
      (t[2] = a),
      (t[3] = s),
      (t[4] = u),
      (t[5] = d),
      (t[6] = f),
      (t[7] = p));
  } else
    ((a = t[2]), (s = t[3]), (u = t[4]), (d = t[5]), (f = t[6]), (p = t[7]));
  let h;
  t[10] !== a ||
  t[11] !== s ||
  t[12] !== u ||
  t[13] !== d ||
  t[14] !== f ||
  t[15] !== p
    ? ((h = {
        weeks: u,
        maxCount: d,
        monthHeaders: f,
        totalCount: p,
        currentStreak: a,
        longestStreak: s,
      }),
      (t[10] = a),
      (t[11] = s),
      (t[12] = u),
      (t[13] = d),
      (t[14] = f),
      (t[15] = p),
      (t[16] = h))
    : (h = t[16]);
  let {
      weeks: g,
      maxCount: _,
      monthHeaders: v,
      totalCount: y,
      currentStreak: b,
      longestStreak: x,
    } = h,
    S;
  t[17] === y
    ? (S = t[18])
    : ((S = (0, k.jsx)(`p`, {
        className: `text-3xl font-bold tabular-nums text-foreground`,
        children: y,
      })),
      (t[17] = y),
      (t[18] = S));
  let C = r ? ` in the last ${r} days` : ` in the last year`,
    w;
  t[19] === C
    ? (w = t[20])
    : ((w = (0, k.jsxs)(`p`, {
        className: `text-sm text-muted-foreground`,
        children: [`tasks completed`, C],
      })),
      (t[19] = C),
      (t[20] = w));
  let T;
  t[21] !== S || t[22] !== w
    ? ((T = (0, k.jsxs)(`div`, { children: [S, w] })),
      (t[21] = S),
      (t[22] = w),
      (t[23] = T))
    : (T = t[23]);
  let E;
  t[24] === b
    ? (E = t[25])
    : ((E =
        b > 0 &&
        (0, k.jsxs)(`div`, {
          className: `flex items-center gap-1.5`,
          children: [
            (0, k.jsx)(te, { size: 18, className: `text-warning` }),
            (0, k.jsx)(`div`, {
              children: (0, k.jsxs)(`p`, {
                className: `text-sm font-semibold tabular-nums text-foreground`,
                children: [b, ` day streak`],
              }),
            }),
          ],
        })),
      (t[24] = b),
      (t[25] = E));
  let D;
  t[26] !== b || t[27] !== x
    ? ((D =
        x > b &&
        (0, k.jsx)(`div`, {
          children: (0, k.jsxs)(`p`, {
            className: `text-xs text-muted-foreground`,
            children: [
              `Longest:`,
              ` `,
              (0, k.jsxs)(`span`, {
                className: `font-semibold tabular-nums text-foreground`,
                children: [x, `d`],
              }),
            ],
          }),
        })),
      (t[26] = b),
      (t[27] = x),
      (t[28] = D))
    : (D = t[28]);
  let ee;
  t[29] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ee = (0, k.jsx)(`span`, { children: `Less` })), (t[29] = ee))
    : (ee = t[29]);
  let ne;
  t[30] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ne = (0, k.jsxs)(`div`, {
        className: `flex items-center gap-1 text-xs text-muted-foreground`,
        children: [
          ee,
          (0, k.jsxs)(`div`, {
            className: `flex gap-0.5`,
            children: [
              (0, k.jsx)(`div`, {
                className: `size-2.5 rounded-sm bg-muted/50`,
              }),
              (0, k.jsx)(`div`, {
                className: `size-2.5 rounded-sm bg-emerald-300/60 dark:bg-emerald-800/60`,
              }),
              (0, k.jsx)(`div`, {
                className: `size-2.5 rounded-sm bg-emerald-400/70 dark:bg-emerald-700/70`,
              }),
              (0, k.jsx)(`div`, {
                className: `size-2.5 rounded-sm bg-emerald-500/80 dark:bg-emerald-600/80`,
              }),
              (0, k.jsx)(`div`, {
                className: `size-2.5 rounded-sm bg-emerald-600 dark:bg-emerald-500`,
              }),
            ],
          }),
          (0, k.jsx)(`span`, { children: `More` }),
        ],
      })),
      (t[30] = ne))
    : (ne = t[30]);
  let re;
  t[31] !== D || t[32] !== E
    ? ((re = (0, k.jsxs)(`div`, {
        className: `flex items-center gap-4`,
        children: [E, D, ne],
      })),
      (t[31] = D),
      (t[32] = E),
      (t[33] = re))
    : (re = t[33]);
  let ie;
  t[34] !== re || t[35] !== T
    ? ((ie = (0, k.jsxs)(`div`, {
        className: `flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-4`,
        children: [T, re],
      })),
      (t[34] = re),
      (t[35] = T),
      (t[36] = ie))
    : (ie = t[36]);
  let O = `auto repeat(${g.length}, 1fr)`,
    oe;
  t[37] === O
    ? (oe = t[38])
    : ((oe = { gridTemplateColumns: O }), (t[37] = O), (t[38] = oe));
  let se;
  t[39] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((se = (0, k.jsx)(`div`, { className: `h-4` })), (t[39] = se))
    : (se = t[39]);
  let A;
  t[40] !== v || t[41] !== g.length
    ? ((A = v.map((e, t) => {
        let n = (t + 1 < v.length ? v[t + 1].colIndex : g.length) - e.colIndex;
        return (0, k.jsx)(
          `div`,
          {
            className: `text-xs text-muted-foreground px-0.5`,
            style: { gridColumn: `${e.colIndex + 2} / span ${n}` },
            children: e.label,
          },
          e.label + e.colIndex,
        );
      })),
      (t[40] = v),
      (t[41] = g.length),
      (t[42] = A))
    : (A = t[42]);
  let ce;
  t[43] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ce = Array.from({ length: ql })), (t[43] = ce))
    : (ce = t[43]);
  let j;
  t[44] !== _ || t[45] !== g
    ? ((j = ce.map((e, t) => {
        let n = g.map((e, n) => {
          let r = e.find((e) => e.dayOfWeek === t);
          return r
            ? (0, k.jsxs)(
                c,
                {
                  children: [
                    (0, k.jsx)(l, {
                      asChild: !0,
                      children: (0, k.jsx)(`div`, {
                        className: `size-[13px] m-[1.5px] rounded-[3px] ${Xl(r.count, _)} transition-colors hover:ring-1 hover:ring-foreground/20`,
                      }),
                    }),
                    (0, k.jsxs)(m, {
                      side: `top`,
                      className: `text-xs`,
                      children: [
                        (0, k.jsxs)(`span`, {
                          className: `font-medium`,
                          children: [
                            r.count,
                            ` `,
                            r.count === 1 ? `task` : `tasks`,
                          ],
                        }),
                        ` `,
                        `on `,
                        $l(r.date),
                      ],
                    }),
                  ],
                },
                n,
              )
            : (0, k.jsx)(`div`, { className: `size-[13px] m-[1.5px]` }, n);
        });
        return [
          (0, k.jsx)(
            `div`,
            {
              className: `text-xs text-muted-foreground pr-2 flex items-center justify-end h-[16px]`,
              children: Jl[t],
            },
            `label-${t}`,
          ),
          ...n,
        ];
      })),
      (t[44] = _),
      (t[45] = g),
      (t[46] = j))
    : (j = t[46]);
  let M;
  t[47] !== oe || t[48] !== A || t[49] !== j
    ? ((M = (0, k.jsx)(o, {
        delayDuration: 0,
        children: (0, k.jsx)(`div`, {
          className: `overflow-x-auto rounded-xl bg-muted/40 p-3 sm:p-4`,
          children: (0, k.jsxs)(`div`, {
            className: `inline-grid min-w-max`,
            style: oe,
            children: [se, A, j],
          }),
        }),
      })),
      (t[47] = oe),
      (t[48] = A),
      (t[49] = j),
      (t[50] = M))
    : (M = t[50]);
  let N;
  return (
    t[51] !== ie || t[52] !== M
      ? ((N = (0, k.jsxs)(`div`, { className: `w-full`, children: [ie, M] })),
        (t[51] = ie),
        (t[52] = M),
        (t[53] = N))
      : (N = t[53]),
    N
  );
}
function nu() {
  let e = (0, ae.c)(41),
    { repo: t } = ee(),
    [n, r] = T(`range`, E),
    o;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = { "7d": 7, "30d": 30, "90d": 90, all: void 0 }), (e[0] = o))
    : (o = e[0]);
  let c = o,
    l;
  e[1] === n ? (l = e[2]) : ((l = _(n)), (e[1] = n), (e[2] = l));
  let d = l,
    f;
  e[3] === n ? (f = e[4]) : ((f = g(n)), (e[3] = n), (e[4] = f));
  let p;
  e[5] === d
    ? (p = e[6])
    : ((p = d ?? w().subtract(90, `day`).valueOf()), (e[5] = d), (e[6] = p));
  let m = c[n],
    h;
  e[7] !== d || e[8] !== f || e[9] !== p || e[10] !== m
    ? ((h = { startTime: d, bucketSize: f, timelineStart: p, heatmapDays: m }),
      (e[7] = d),
      (e[8] = f),
      (e[9] = p),
      (e[10] = m),
      (e[11] = h))
    : (h = e[11]);
  let { startTime: S, bucketSize: te, timelineStart: ne, heatmapDays: re } = h,
    ie;
  e[12] !== t._id || e[13] !== S
    ? ((ie = { repoId: t._id, startTime: S }),
      (e[12] = t._id),
      (e[13] = S),
      (e[14] = ie))
    : (ie = e[14]);
  let O = a(i.analytics.getImpactStats, ie),
    oe;
  e[15] === t._id
    ? (oe = e[16])
    : ((oe = { repoId: t._id }), (e[15] = t._id), (e[16] = oe));
  let A = a(i.analytics.getActiveUsers, oe),
    ce;
  e[17] !== te || e[18] !== t._id || e[19] !== ne
    ? ((ce = { repoId: t._id, startTime: ne, bucketSizeMs: te }),
      (e[17] = te),
      (e[18] = t._id),
      (e[19] = ne),
      (e[20] = ce))
    : (ce = e[20]);
  let j = a(i.analytics.getActivityTimeline, ce),
    M;
  e[21] !== t._id || e[22] !== S
    ? ((M = { repoId: t._id, startTime: S }),
      (e[21] = t._id),
      (e[22] = S),
      (e[23] = M))
    : (M = e[23]);
  let N = a(i.analytics.getLeaderboard, M),
    P;
  e[24] !== t._id || e[25] !== S
    ? ((P = { repoId: t._id, startTime: S }),
      (e[24] = t._id),
      (e[25] = S),
      (e[26] = P))
    : (P = e[26]);
  let le = a(i.analytics.getActivityHeatmap, P),
    F =
      O === void 0 ||
      A === void 0 ||
      j === void 0 ||
      N === void 0 ||
      le === void 0,
    ue;
  e[27] !== r || e[28] !== n
    ? ((ue = (0, k.jsx)(v, { value: n, onChange: r })),
      (e[27] = r),
      (e[28] = n),
      (e[29] = ue))
    : (ue = e[29]);
  let de;
  e[30] !== A ||
  e[31] !== le ||
  e[32] !== re ||
  e[33] !== O ||
  e[34] !== F ||
  e[35] !== N ||
  e[36] !== j
    ? ((de = F
        ? (0, k.jsx)(`div`, {
            className: `flex items-center justify-center py-12`,
            children: (0, k.jsx)(s, { size: `lg` }),
          })
        : (0, k.jsxs)(`div`, {
            className: `space-y-6`,
            children: [
              (0, k.jsx)(u.div, {
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3 },
                children: (0, k.jsx)(tu, { data: le, days: re }),
              }),
              (0, k.jsxs)(u.div, {
                className: `grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4`,
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.1 },
                children: [
                  (0, k.jsx)(se, {
                    icon: b,
                    label: `PRs Shipped`,
                    value: O.prsShipped,
                    currentValue: O.prsShipped,
                    previousValue:
                      `prevPrsShipped` in O ? O.prevPrsShipped : void 0,
                  }),
                  (0, k.jsx)(se, {
                    icon: x,
                    label: `Ship Rate`,
                    value: `${O.shipRate}%`,
                    subtitle: `${O.sessionsWithPr} of ${O.totalSessions} sessions`,
                    currentValue: O.shipRate,
                    previousValue:
                      `prevShipRate` in O ? O.prevShipRate : void 0,
                  }),
                  (0, k.jsx)(se, {
                    icon: C,
                    label: `Humans Prompting`,
                    value: A.count,
                    subtitle: `Last 5 minutes`,
                  }),
                  (0, k.jsx)(se, {
                    icon: y,
                    label: `Tasks Completed`,
                    value: O.tasksCompleted,
                    currentValue: O.tasksCompleted,
                    previousValue:
                      `prevTasksCompleted` in O ? O.prevTasksCompleted : void 0,
                  }),
                ],
              }),
              (0, k.jsxs)(u.div, {
                className: `grid grid-cols-1 gap-4 lg:grid-cols-3`,
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.2 },
                children: [
                  (0, k.jsx)(`div`, {
                    className: `lg:col-span-2`,
                    children: (0, k.jsx)(Il, { timeline: j }),
                  }),
                  (0, k.jsx)(zl, {
                    totalSessions: O.totalSessions,
                    sessionsWithPr: O.sessionsWithPr,
                    shipRate: O.shipRate,
                  }),
                ],
              }),
              (0, k.jsxs)(u.div, {
                className: `grid grid-cols-1 gap-4 lg:grid-cols-3`,
                initial: { opacity: 0, y: 12 },
                animate: { opacity: 1, y: 0 },
                transition: { duration: 0.3, delay: 0.35 },
                children: [
                  (0, k.jsx)(`div`, {
                    className: `lg:col-span-2`,
                    children: (0, k.jsx)(Bl, { timeline: j }),
                  }),
                  (0, k.jsx)(Gl, { entries: N }),
                ],
              }),
            ],
          })),
      (e[30] = A),
      (e[31] = le),
      (e[32] = re),
      (e[33] = O),
      (e[34] = F),
      (e[35] = N),
      (e[36] = j),
      (e[37] = de))
    : (de = e[37]);
  let fe;
  return (
    e[38] !== ue || e[39] !== de
      ? ((fe = (0, k.jsx)(D, {
          title: `Stats`,
          headerRight: ue,
          children: de,
        })),
        (e[38] = ue),
        (e[39] = de),
        (e[40] = fe))
      : (fe = e[40]),
    fe
  );
}
var ru = nu;
export { ru as component };
