import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { n as i } from "./backend-BVlbQtYj.js";
import { t as a } from "./hooks-B_9i2gKL.js";
import {
  Cr as o,
  Er as s,
  Jn as c,
  Kt as l,
  Xn as u,
  Yn as d,
  ar as f,
  dn as p,
  dr as m,
  fn as h,
  ir as g,
  pn as _,
  ur as v,
  xn as y,
  yr as b,
} from "./src-DzioQSsH.js";
import { t as x } from "./createReactComponent-C2GWxX5y.js";
import { t as S } from "./IconArrowUp-CSALj2QJ.js";
import { r as C, t as w } from "./TimeRangeFilter-CoMwH2_p.js";
import { t as T } from "./IconChecklist-Bh1NM8HY.js";
import { t as E } from "./IconClock-BRHjI4rV.js";
import { t as D } from "./IconCode-DJtbkNrt.js";
import { t as O } from "./IconFileText-y2qCeLR_.js";
import { n as k, t as A } from "./ToggleSearch-C64uhWNc.js";
import { t as j } from "./IconFlask-BqyPlSZe.js";
import { t as M } from "./IconLayoutKanban-Ci0D2ZgQ.js";
import { t as N } from "./IconPalette-DCZ_J_lY.js";
import { t as P } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as F } from "./IconTestPipe-DTTvfavR.js";
import { n as I } from "./dates-DHZmrCUU.js";
import {
  C as L,
  S as R,
  a as ee,
  b as te,
  p as ne,
} from "./search-params-2NJX6Or7.js";
import { t as re } from "./PageWrapper-Z5X-C4Rx.js";
import { n as ie } from "./RepoContext-Dg6-rqFp.js";
import { n as ae, r as z } from "./formatDuration-Bscl8bMO.js";
var B = x(`outline`, `arrow-down`, `ArrowDown`, [
    [`path`, { d: `M12 5l0 14`, key: `svg-0` }],
    [`path`, { d: `M18 13l-6 6`, key: `svg-1` }],
    [`path`, { d: `M6 13l6 6`, key: `svg-2` }],
  ]),
  V = x(`outline`, `currency-pound`, `CurrencyPound`, [
    [
      `path`,
      {
        d: `M17 18.5a6 6 0 0 1 -5 0a6 6 0 0 0 -5 .5a3 3 0 0 0 2 -2.5v-7.5a4 4 0 0 1 7.45 -2m-2.55 6h-7`,
        key: `svg-0`,
      },
    ],
  ]),
  H = x(`outline`, `file-off`, `FileOff`, [
    [`path`, { d: `M3 3l18 18`, key: `svg-0` }],
    [
      `path`,
      {
        d: `M7 3h7l5 5v7m0 4a2 2 0 0 1 -2 2h-10a2 2 0 0 1 -2 -2v-14`,
        key: `svg-1`,
      },
    ],
  ]),
  U = r(),
  W = {
    quickTask: T,
    session: b,
    designSession: N,
    doc: O,
    project: M,
    evaluation: j,
    testGen: F,
    automation: P,
    researchQuery: s,
    sessionAudit: b,
    taskAudit: T,
    summarize: O,
  };
function G(e) {
  return W[e] ?? O;
}
var K = {
  quickTask: `Quick Tasks`,
  session: `Sessions`,
  designSession: `Design Sessions`,
  researchQuery: `Research Queries`,
  project: `Projects`,
  doc: `Docs`,
  evaluation: `Evaluations`,
  sessionAudit: `Session Audits`,
  taskAudit: `Task Audits`,
  summarize: `Summaries`,
  testGen: `Test Generation`,
  automation: `Automations`,
};
function q(e) {
  return K[e] ?? e;
}
function J(e) {
  return `£${(e * oe).toFixed(2)}`;
}
function Y(e) {
  return e === 0
    ? `0`
    : e >= 0xe8d4a51000
      ? `${(e / 0xe8d4a51000).toFixed(1)}T`
      : e >= 1e9
        ? `${(e / 1e9).toFixed(1)}B`
        : e >= 1e6
          ? `${(e / 1e6).toFixed(1)}M`
          : e >= 1e3
            ? `${(e / 1e3).toFixed(1)}k`
            : String(e);
}
var oe = 0.74,
  se = 1.34,
  X = {
    costUsd: 0,
    model: `-`,
    inputTokens: 0,
    outputTokens: 0,
    durationMs: 0,
    cacheReadTokens: 0,
    cacheCreationTokens: 0,
  };
function Z(e) {
  if (!e) return X;
  try {
    let t = JSON.parse(e),
      n = t.usage ?? {},
      r = t.modelUsage ?? {},
      i = Object.keys(r),
      a =
        (typeof n.input_tokens == `number` ? n.input_tokens : 0) +
        (typeof n.cache_read_input_tokens == `number`
          ? n.cache_read_input_tokens
          : 0) +
        (typeof n.cache_creation_input_tokens == `number`
          ? n.cache_creation_input_tokens
          : 0);
    return {
      costUsd: typeof t.total_cost_usd == `number` ? t.total_cost_usd : 0,
      model: i.length > 0 ? i[0] : `-`,
      inputTokens: a,
      outputTokens: typeof n.output_tokens == `number` ? n.output_tokens : 0,
      durationMs: typeof t.duration_ms == `number` ? t.duration_ms : 0,
      cacheReadTokens:
        typeof n.cache_read_input_tokens == `number`
          ? n.cache_read_input_tokens
          : 0,
      cacheCreationTokens:
        typeof n.cache_creation_input_tokens == `number`
          ? n.cache_creation_input_tokens
          : 0,
    };
  } catch {
    return X;
  }
}
var Q = n();
function ce(e) {
  let t = (0, U.c)(26),
    { totalCost: n, totalDuration: r, totalInput: i, totalOutput: a } = e,
    o;
  t[0] === n ? (o = t[1]) : ((o = J(n)), (t[0] = n), (t[1] = o));
  let s;
  t[2] === n ? (s = t[3]) : ((s = J(n * se).slice(1)), (t[2] = n), (t[3] = s));
  let c = `$${s}`,
    l;
  t[4] !== o || t[5] !== c
    ? ((l = { icon: V, label: `Total Cost`, value: o, subtitle: c }),
      (t[4] = o),
      (t[5] = c),
      (t[6] = l))
    : (l = t[6]);
  let u;
  t[7] === r ? (u = t[8]) : ((u = ae(r)), (t[7] = r), (t[8] = u));
  let d;
  t[9] === u
    ? (d = t[10])
    : ((d = { icon: E, label: `Ran For`, value: u, subtitle: void 0 }),
      (t[9] = u),
      (t[10] = d));
  let f;
  t[11] === i ? (f = t[12]) : ((f = Y(i)), (t[11] = i), (t[12] = f));
  let p;
  t[13] === f
    ? (p = t[14])
    : ((p = { icon: B, label: `Input Tokens`, value: f, subtitle: void 0 }),
      (t[13] = f),
      (t[14] = p));
  let m;
  t[15] === a ? (m = t[16]) : ((m = Y(a)), (t[15] = a), (t[16] = m));
  let h;
  t[17] === m
    ? (h = t[18])
    : ((h = { icon: S, label: `Output Tokens`, value: m, subtitle: void 0 }),
      (t[17] = m),
      (t[18] = h));
  let g;
  t[19] !== h || t[20] !== l || t[21] !== d || t[22] !== p
    ? ((g = [l, d, p, h]),
      (t[19] = h),
      (t[20] = l),
      (t[21] = d),
      (t[22] = p),
      (t[23] = g))
    : (g = t[23]);
  let _ = g,
    v;
  return (
    t[24] === _
      ? (v = t[25])
      : ((v = (0, Q.jsx)(`div`, {
          className: `grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-4`,
          children: _.map(le),
        })),
        (t[24] = _),
        (t[25] = v)),
    v
  );
}
function le(e) {
  return (0, Q.jsx)(
    g,
    {
      className: `motion-emphasized bg-muted/40 transition-[transform,background-color] duration-200 hover:-translate-y-0.5 hover:bg-muted/60`,
      children: (0, Q.jsxs)(f, {
        className: `flex flex-row items-center gap-2.5 p-3 sm:gap-3 sm:p-4`,
        children: [
          (0, Q.jsx)(`div`, {
            className: `motion-base rounded-lg bg-secondary p-1.5 text-muted-foreground sm:p-2`,
            children: (0, Q.jsx)(e.icon, {
              size: 18,
              className: `sm:h-5 sm:w-5`,
            }),
          }),
          (0, Q.jsxs)(`div`, {
            className: `min-w-0`,
            children: [
              (0, Q.jsx)(`p`, {
                className: `text-lg font-bold text-foreground sm:text-2xl`,
                children: e.value,
              }),
              (0, Q.jsxs)(`div`, {
                className: `flex items-baseline gap-1.5`,
                children: [
                  (0, Q.jsx)(`p`, {
                    className: `text-xs text-muted-foreground sm:text-sm`,
                    children: e.label,
                  }),
                  e.subtitle &&
                    (0, Q.jsx)(`span`, {
                      className: `text-xs text-muted-foreground/60`,
                      children: e.subtitle,
                    }),
                ],
              }),
            ],
          }),
        ],
      }),
    },
    e.label,
  );
}
function ue(e) {
  let t = (0, U.c)(31),
    {
      visibleTypes: n,
      availableTypes: r,
      onTypeToggle: i,
      timeRange: a,
      onTimeRangeChange: o,
      searchQuery: s,
      onSearchChange: c,
    } = e,
    l = n.size > 0,
    u;
  t[0] !== c || t[1] !== s
    ? ((u = (0, Q.jsx)(A, {
        value: s,
        onChange: c,
        placeholder: `Search logs...`,
        tooltipLabel: `Search logs`,
      })),
      (t[0] = c),
      (t[1] = s),
      (t[2] = u))
    : (u = t[2]);
  let d;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = (0, Q.jsx)(k, { size: 14 })), (t[3] = d))
    : (d = t[3]);
  let f = l ? `${n.size} of ${r.length} Types` : `All Types`,
    g;
  t[4] === f
    ? (g = t[5])
    : ((g = (0, Q.jsx)(`span`, { className: `hidden sm:inline`, children: f })),
      (t[4] = f),
      (t[5] = g));
  let b = l ? `${n.size}/${r.length}` : `All`,
    x;
  t[6] === b
    ? (x = t[7])
    : ((x = (0, Q.jsx)(`span`, { className: `sm:hidden`, children: b })),
      (t[6] = b),
      (t[7] = x));
  let S;
  t[8] !== l || t[9] !== n.size
    ? ((S =
        l &&
        (0, Q.jsx)(m, {
          variant: `default`,
          className: `ml-0.5 h-4 min-w-4 px-1 text-[10px]`,
          children: n.size,
        })),
      (t[8] = l),
      (t[9] = n.size),
      (t[10] = S))
    : (S = t[10]);
  let C;
  t[11] !== g || t[12] !== x || t[13] !== S
    ? ((C = (0, Q.jsx)(y, {
        asChild: !0,
        children: (0, Q.jsxs)(v, {
          variant: `secondary`,
          size: `sm`,
          className: `motion-press`,
          children: [d, g, x, S],
        }),
      })),
      (t[11] = g),
      (t[12] = x),
      (t[13] = S),
      (t[14] = C))
    : (C = t[14]);
  let T;
  t[15] !== r || t[16] !== i || t[17] !== n
    ? ((T = r.map((e) =>
        (0, Q.jsx)(
          h,
          {
            checked: n.size === 0 || n.has(e),
            onCheckedChange: () => i(e, r),
            onSelect: de,
            children: q(e),
          },
          e,
        ),
      )),
      (t[15] = r),
      (t[16] = i),
      (t[17] = n),
      (t[18] = T))
    : (T = t[18]);
  let E;
  t[19] === T
    ? (E = t[20])
    : ((E = (0, Q.jsx)(_, { align: `end`, children: T })),
      (t[19] = T),
      (t[20] = E));
  let D;
  t[21] !== E || t[22] !== C
    ? ((D = (0, Q.jsxs)(p, { children: [C, E] })),
      (t[21] = E),
      (t[22] = C),
      (t[23] = D))
    : (D = t[23]);
  let O;
  t[24] !== o || t[25] !== a
    ? ((O = (0, Q.jsx)(w, { value: a, onChange: o })),
      (t[24] = o),
      (t[25] = a),
      (t[26] = O))
    : (O = t[26]);
  let j;
  return (
    t[27] !== u || t[28] !== D || t[29] !== O
      ? ((j = (0, Q.jsxs)(`div`, {
          className: `flex items-center gap-1.5 sm:gap-2`,
          children: [u, D, O],
        })),
        (t[27] = u),
        (t[28] = D),
        (t[29] = O),
        (t[30] = j))
      : (j = t[30]),
    j
  );
}
function de(e) {
  return e.preventDefault();
}
var fe = e(t(), 1);
function pe(e) {
  let t = (0, U.c)(12),
    { raw: n } = e,
    [r, i] = (0, fe.useState)(!1);
  if (!n) return null;
  let a = n;
  try {
    let e;
    (t[0] === n
      ? (e = t[1])
      : ((e = JSON.stringify(JSON.parse(n), null, 2)), (t[0] = n), (t[1] = e)),
      (a = e));
  } catch {}
  let o;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = () => i($)), (t[2] = o))
    : (o = t[2]);
  let s;
  t[3] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((s = (0, Q.jsx)(D, { size: 12 })), (t[3] = s))
    : (s = t[3]);
  let c = r ? `Hide raw` : `View raw`,
    l;
  t[4] === c
    ? (l = t[5])
    : ((l = (0, Q.jsxs)(`button`, {
        onClick: o,
        className: `motion-base flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground`,
        children: [s, c],
      })),
      (t[4] = c),
      (t[5] = l));
  let u;
  t[6] !== a || t[7] !== r
    ? ((u =
        r &&
        (0, Q.jsx)(`pre`, {
          className: `mt-2 max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 font-mono text-xs leading-relaxed text-muted-foreground`,
          children: a,
        })),
      (t[6] = a),
      (t[7] = r),
      (t[8] = u))
    : (u = t[8]);
  let d;
  return (
    t[9] !== l || t[10] !== u
      ? ((d = (0, Q.jsxs)(`div`, { className: `mt-2`, children: [l, u] })),
        (t[9] = l),
        (t[10] = u),
        (t[11] = d))
      : (d = t[11]),
    d
  );
}
function $(e) {
  return !e;
}
function me(e) {
  let t = (0, U.c)(24),
    { type: n, logs: r, total: i } = e,
    a;
  t[0] === n ? (a = t[1]) : ((a = G(n)), (t[0] = n), (t[1] = a));
  let s = a,
    l;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((l = (0, Q.jsx)(o, {
        size: 14,
        className: `chevron-icon shrink-0 text-muted-foreground transition-transform`,
      })),
      (t[2] = l))
    : (l = t[2]);
  let f;
  t[3] === s
    ? (f = t[4])
    : ((f = (0, Q.jsx)(s, {
        size: 16,
        className: `shrink-0 text-muted-foreground`,
      })),
      (t[3] = s),
      (t[4] = f));
  let p;
  t[5] === n ? (p = t[6]) : ((p = q(n)), (t[5] = n), (t[6] = p));
  let m;
  t[7] === p
    ? (m = t[8])
    : ((m = (0, Q.jsx)(`span`, {
        className: `tracking-[-0.01em]`,
        children: p,
      })),
      (t[7] = p),
      (t[8] = m));
  let h;
  t[9] === i ? (h = t[10]) : ((h = J(i)), (t[9] = i), (t[10] = h));
  let g;
  t[11] === h
    ? (g = t[12])
    : ((g = (0, Q.jsx)(`span`, {
        className: `ml-auto font-mono text-xs text-muted-foreground`,
        children: h,
      })),
      (t[11] = h),
      (t[12] = g));
  let _;
  t[13] !== f || t[14] !== m || t[15] !== g
    ? ((_ = (0, Q.jsxs)(u, {
        className: `motion-base flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted/60 sm:gap-2.5 sm:px-4 [&[data-state=open]>.chevron-icon]:rotate-90`,
        children: [l, f, m, g],
      })),
      (t[13] = f),
      (t[14] = m),
      (t[15] = g),
      (t[16] = _))
    : (_ = t[16]);
  let v;
  t[17] === r ? (v = t[18]) : ((v = r.map(he)), (t[17] = r), (t[18] = v));
  let y;
  t[19] === v
    ? (y = t[20])
    : ((y = (0, Q.jsx)(d, {
        children: (0, Q.jsx)(`div`, {
          className: `ml-2 pl-3 sm:ml-4 sm:pl-4`,
          children: v,
        }),
      })),
      (t[19] = v),
      (t[20] = y));
  let b;
  return (
    t[21] !== y || t[22] !== _
      ? ((b = (0, Q.jsxs)(c, { defaultOpen: !0, children: [_, y] })),
        (t[21] = y),
        (t[22] = _),
        (t[23] = b))
      : (b = t[23]),
    b
  );
}
function he(e) {
  let t = Z(e.rawResultEvent);
  return (0, Q.jsxs)(
    `div`,
    {
      className: `motion-base rounded-lg px-3 py-2.5 transition-colors hover:bg-accent/25`,
      children: [
        (0, Q.jsxs)(`div`, {
          className: `flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3`,
          children: [
            (0, Q.jsx)(`span`, {
              className: `min-w-0 flex-1 truncate text-sm`,
              children: e.entityTitle,
            }),
            (0, Q.jsxs)(`div`, {
              className: `flex flex-wrap items-center gap-1.5 sm:gap-2`,
              children: [
                (0, Q.jsx)(m, {
                  variant: `outline`,
                  className: `font-mono text-[11px]`,
                  children: t.model,
                }),
                (0, Q.jsxs)(`span`, {
                  className: `text-xs tabular-nums text-muted-foreground`,
                  children: [
                    Y(t.inputTokens),
                    ` in /`,
                    ` `,
                    Y(t.outputTokens),
                    ` out`,
                  ],
                }),
                t.durationMs > 0 &&
                  (0, Q.jsx)(`span`, {
                    className: `text-xs tabular-nums text-muted-foreground`,
                    children: z(t.durationMs),
                  }),
                (0, Q.jsx)(`span`, {
                  className: `font-mono text-xs font-medium tabular-nums`,
                  children: J(t.costUsd),
                }),
                (0, Q.jsx)(`span`, {
                  className: `text-xs text-muted-foreground/70`,
                  children: I(e.createdAt).format(`MMM D, HH:mm`),
                }),
              ],
            }),
          ],
        }),
        (0, Q.jsx)(pe, { raw: e.rawResultEvent }),
      ],
    },
    e._id,
  );
}
function ge() {
  let e = (0, U.c)(56),
    { repo: t } = ie(),
    [n, r] = R(`range`, te),
    [o, s] = R(`q`, ne),
    c;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((c = { entityTypes: ee }), (e[0] = c))
    : (c = e[0]);
  let [u, d] = L(c),
    { entityTypes: f } = u,
    p;
  e[1] === f ? (p = e[2]) : ((p = new Set(f)), (e[1] = f), (e[2] = p));
  let m = p,
    h;
  e[3] !== d || e[4] !== m
    ? ((h = (e, t) => {
        let n = new Set(m.size === 0 ? t : m);
        if (n.has(e)) {
          if (n.size === 1) return;
          n.delete(e);
        } else n.add(e);
        d({ entityTypes: t.every((e) => n.has(e)) ? [] : [...n] });
      }),
      (e[3] = d),
      (e[4] = m),
      (e[5] = h))
    : (h = e[5]);
  let g = h,
    _;
  e[6] === n ? (_ = e[7]) : ((_ = C(n)), (e[6] = n), (e[7] = _));
  let v = _ ?? void 0,
    y = f.length > 0 ? f : void 0,
    b;
  e[8] !== t._id || e[9] !== v || e[10] !== y
    ? ((b = { repoId: t._id, startTime: v, entityTypes: y }),
      (e[8] = t._id),
      (e[9] = v),
      (e[10] = y),
      (e[11] = b))
    : (b = e[11]);
  let x = a(i.logs.listByRepo, b),
    S;
  if (e[12] !== x || e[13] !== o) {
    bb0: {
      if (!x) {
        S = void 0;
        break bb0;
      }
      let e = (o ?? ``).toLowerCase().trim();
      if (!e) {
        S = x;
        break bb0;
      }
      S = x.filter((t) => t.entityTitle.toLowerCase().includes(e));
    }
    ((e[12] = x), (e[13] = o), (e[14] = S));
  } else S = e[14];
  let w = S,
    T;
  bb1: {
    if (!w) {
      let t;
      (e[15] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = {
            totalCost: 0,
            totalInput: 0,
            totalOutput: 0,
            totalDuration: 0,
            grouped: [],
            availableTypes: [],
          }),
          (e[15] = t))
        : (t = e[15]),
        (T = t));
      break bb1;
    }
    let t = 0,
      n = 0,
      r = 0,
      i = 0,
      a,
      o,
      s,
      c,
      l,
      u;
    if (
      e[16] !== t ||
      e[17] !== i ||
      e[18] !== w ||
      e[19] !== n ||
      e[20] !== r
    ) {
      let d = new Map();
      for (let e of w) {
        let a = Z(e.rawResultEvent);
        ((t += a.costUsd),
          (n += a.inputTokens),
          (r += a.outputTokens),
          (i += a.durationMs));
        let o = d.get(e.entityType);
        o
          ? (o.logs.push(e), (o.total += a.costUsd))
          : d.set(e.entityType, { logs: [e], total: a.costUsd });
      }
      let f = Array.from(d.entries()).sort(be).map(ye);
      ((a = t),
        (o = n),
        (s = r),
        (c = i),
        (l = f),
        (u = f.map(ve)),
        (e[16] = t),
        (e[17] = i),
        (e[18] = w),
        (e[19] = n),
        (e[20] = r),
        (e[21] = a),
        (e[22] = o),
        (e[23] = s),
        (e[24] = c),
        (e[25] = l),
        (e[26] = u),
        (e[27] = t),
        (e[28] = n),
        (e[29] = r),
        (e[30] = i));
    } else
      ((a = e[21]),
        (o = e[22]),
        (s = e[23]),
        (c = e[24]),
        (l = e[25]),
        (u = e[26]),
        (t = e[27]),
        (n = e[28]),
        (r = e[29]),
        (i = e[30]));
    let d;
    (e[31] !== a ||
    e[32] !== o ||
    e[33] !== s ||
    e[34] !== c ||
    e[35] !== l ||
    e[36] !== u
      ? ((d = {
          totalCost: a,
          totalInput: o,
          totalOutput: s,
          totalDuration: c,
          grouped: l,
          availableTypes: u,
        }),
        (e[31] = a),
        (e[32] = o),
        (e[33] = s),
        (e[34] = c),
        (e[35] = l),
        (e[36] = u),
        (e[37] = d))
      : (d = e[37]),
      (T = d));
  }
  let {
      totalCost: E,
      totalInput: D,
      totalOutput: O,
      totalDuration: k,
      grouped: A,
      availableTypes: j,
    } = T,
    M = o ?? ``,
    N;
  e[38] !== j ||
  e[39] !== g ||
  e[40] !== s ||
  e[41] !== r ||
  e[42] !== M ||
  e[43] !== n ||
  e[44] !== m
    ? ((N = (0, Q.jsx)(ue, {
        visibleTypes: m,
        availableTypes: j,
        onTypeToggle: g,
        timeRange: n,
        onTimeRangeChange: r,
        searchQuery: M,
        onSearchChange: s,
      })),
      (e[38] = j),
      (e[39] = g),
      (e[40] = s),
      (e[41] = r),
      (e[42] = M),
      (e[43] = n),
      (e[44] = m),
      (e[45] = N))
    : (N = e[45]);
  let P;
  e[46] !== w ||
  e[47] !== A ||
  e[48] !== E ||
  e[49] !== k ||
  e[50] !== D ||
  e[51] !== O
    ? ((P =
        w === void 0
          ? (0, Q.jsx)(`div`, {
              className: `flex items-center justify-center py-16`,
              children: (0, Q.jsx)(l, { size: `lg` }),
            })
          : w.length === 0
            ? (0, Q.jsxs)(`div`, {
                className: `flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground`,
                children: [
                  (0, Q.jsx)(`div`, {
                    className: `rounded-xl bg-secondary p-3`,
                    children: (0, Q.jsx)(H, { size: 24 }),
                  }),
                  (0, Q.jsx)(`p`, {
                    className: `text-sm`,
                    children: `No logs found for this time range`,
                  }),
                ],
              })
            : (0, Q.jsxs)(`div`, {
                className: `space-y-5`,
                children: [
                  (0, Q.jsx)(ce, {
                    totalCost: E,
                    totalDuration: k,
                    totalInput: D,
                    totalOutput: O,
                  }),
                  (0, Q.jsx)(`div`, {
                    className: `space-y-1`,
                    children: A.map(_e),
                  }),
                ],
              })),
      (e[46] = w),
      (e[47] = A),
      (e[48] = E),
      (e[49] = k),
      (e[50] = D),
      (e[51] = O),
      (e[52] = P))
    : (P = e[52]);
  let F;
  return (
    e[53] !== N || e[54] !== P
      ? ((F = (0, Q.jsx)(re, { title: `Logs`, headerRight: N, children: P })),
        (e[53] = N),
        (e[54] = P),
        (e[55] = F))
      : (F = e[55]),
    F
  );
}
function _e(e) {
  return (0, Q.jsx)(me, { type: e.type, logs: e.logs, total: e.total }, e.type);
}
function ve(e) {
  return e.type;
}
function ye(e) {
  let [t, n] = e;
  return { type: t, ...n };
}
function be(e, t) {
  return t[1].total - e[1].total;
}
var xe = ge;
export { xe as component };
