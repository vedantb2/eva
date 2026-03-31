import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { t as r } from "./link-HPAZ_wn3.js";
import { t as i } from "./useNavigate-B8SeWprX.js";
import { D as a, T as o, d as s } from "./index-CuMF3NGg.js";
import { n as c } from "./backend-BVlbQtYj.js";
import { t as l } from "./hooks-B_9i2gKL.js";
import {
  Er as u,
  Gn as d,
  Rn as ee,
  Un as te,
  Vn as ne,
  Wn as f,
  br as re,
  qn as p,
  ur as ie,
  yr as ae,
} from "./src-DHCpG1Q-.js";
import { t as m } from "./createReactComponent-C2GWxX5y.js";
import { t as oe } from "./IconAlertTriangle-B1Mqbt3_.js";
import {
  a as se,
  i as h,
  n as g,
  o as _,
  r as v,
  t as y,
} from "./Sidebar-7q-1YaRQ.js";
import { t as b } from "./IconChecklist-Bh1NM8HY.js";
import { t as x } from "./IconFileText-y2qCeLR_.js";
import { t as S } from "./IconFlask-BqyPlSZe.js";
import { t as C } from "./IconLayoutKanban-Ci0D2ZgQ.js";
import { n as ce, t as w } from "./RepoContext-D9QMbL6d.js";
var T = m(`outline`, `shield`, `Shield`, [
    [
      `path`,
      {
        d: `M12 3a12 12 0 0 0 8.5 3a12 12 0 0 1 -8.5 15a12 12 0 0 1 -8.5 -15a12 12 0 0 0 8.5 -3`,
        key: `svg-0`,
      },
    ],
  ]),
  le = o(),
  ue = e(t(), 1),
  E = n(),
  D = `mx-2 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors data-[selected=true]:bg-accent/80 data-[selected=true]:text-primary`,
  O = `[&_[cmdk-group-heading]]:px-4 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-[0.08em] [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase`;
function k() {
  let e = (0, le.c)(141),
    { isOpen: t, setIsOpen: n } = se(),
    [r, a] = (0, ue.useState)(``),
    o = i(),
    { repo: s, basePath: d } = ce(),
    te;
  e[0] === s._id
    ? (te = e[1])
    : ((te = { repoId: s._id }), (e[0] = s._id), (e[1] = te));
  let f = l(c.projects.list, te),
    ie;
  e[2] === s._id
    ? (ie = e[3])
    : ((ie = { repoId: s._id }), (e[2] = s._id), (e[3] = ie));
  let m = l(c.sessions.list, ie),
    oe;
  e[4] === s._id
    ? (oe = e[5])
    : ((oe = { repoId: s._id }), (e[4] = s._id), (e[5] = oe));
  let h = l(c.docs.list, oe),
    g;
  e[6] === s._id
    ? (g = e[7])
    : ((g = { repoId: s._id }), (e[6] = s._id), (e[7] = g));
  let v = l(c.researchQueries.list, g),
    y;
  e[8] === s._id
    ? (y = e[9])
    : ((y = { repoId: s._id }), (e[8] = s._id), (e[9] = y));
  let w = l(c.agentTasks.getAllTasks, y),
    k,
    de;
  (e[10] === t
    ? ((k = e[11]), (de = e[12]))
    : ((k = () => {
        t || a(``);
      }),
      (de = [t]),
      (e[10] = t),
      (e[11] = k),
      (e[12] = de)),
    (0, ue.useEffect)(k, de));
  let A;
  e[13] !== o || e[14] !== n
    ? ((A = (e) => {
        (o({ to: e }), n(!1));
      }),
      (e[13] = o),
      (e[14] = n),
      (e[15] = A))
    : (A = e[15]);
  let j = A,
    fe;
  e[16] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((fe = (0, E.jsx)(re, {
        className: `size-4 flex-shrink-0 text-muted-foreground`,
      })),
      (e[16] = fe))
    : (fe = e[16]);
  let M;
  e[17] === r
    ? (M = e[18])
    : ((M = (0, E.jsx)(p.Input, {
        autoFocus: !0,
        placeholder: `Search pages, projects, sessions...`,
        value: r,
        onValueChange: a,
        className: `flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground`,
      })),
      (e[17] = r),
      (e[18] = M));
  let N;
  e[19] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((N = (0, E.jsx)(`kbd`, {
        className: `rounded-md bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground`,
        children: `ESC`,
      })),
      (e[19] = N))
    : (N = e[19]);
  let P;
  e[20] === M
    ? (P = e[21])
    : ((P = (0, E.jsxs)(`div`, {
        className: `flex items-center gap-2 px-4 py-3 focus-within:ring-2 focus-within:ring-ring/35`,
        children: [fe, M, N],
      })),
      (e[20] = M),
      (e[21] = P));
  let F;
  e[22] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((F = (0, E.jsx)(p.Empty, {
        className: `text-sm text-muted-foreground text-center py-8`,
        children: `No results found`,
      })),
      (e[22] = F))
    : (F = e[22]);
  let I;
  e[23] !== d || e[24] !== j
    ? ((I = () => j(`${d}/projects`)), (e[23] = d), (e[24] = j), (e[25] = I))
    : (I = e[25]);
  let L, R, z;
  e[26] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((L = (0, E.jsx)(C, { size: 16, className: `flex-shrink-0` })),
      (R = (0, E.jsx)(`span`, { className: `flex-1`, children: `Projects` })),
      (z = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Build`,
      })),
      (e[26] = L),
      (e[27] = R),
      (e[28] = z))
    : ((L = e[26]), (R = e[27]), (z = e[28]));
  let B;
  e[29] === I
    ? (B = e[30])
    : ((B = (0, E.jsxs)(p.Item, {
        value: `Projects`,
        className: D,
        onSelect: I,
        children: [L, R, z],
      })),
      (e[29] = I),
      (e[30] = B));
  let V;
  e[31] !== d || e[32] !== j
    ? ((V = () => j(`${d}/quick-tasks`)), (e[31] = d), (e[32] = j), (e[33] = V))
    : (V = e[33]);
  let pe, me, he;
  e[34] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((pe = (0, E.jsx)(b, { size: 16, className: `flex-shrink-0` })),
      (me = (0, E.jsx)(`span`, {
        className: `flex-1`,
        children: `Quick Tasks`,
      })),
      (he = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Fix`,
      })),
      (e[34] = pe),
      (e[35] = me),
      (e[36] = he))
    : ((pe = e[34]), (me = e[35]), (he = e[36]));
  let H;
  e[37] === V
    ? (H = e[38])
    : ((H = (0, E.jsxs)(p.Item, {
        value: `Quick Tasks`,
        className: D,
        onSelect: V,
        children: [pe, me, he],
      })),
      (e[37] = V),
      (e[38] = H));
  let U;
  e[39] !== d || e[40] !== j
    ? ((U = () => j(`${d}/sessions`)), (e[39] = d), (e[40] = j), (e[41] = U))
    : (U = e[41]);
  let ge, _e, ve;
  e[42] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ge = (0, E.jsx)(ae, { size: 16, className: `flex-shrink-0` })),
      (_e = (0, E.jsx)(`span`, { className: `flex-1`, children: `Sessions` })),
      (ve = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Fix`,
      })),
      (e[42] = ge),
      (e[43] = _e),
      (e[44] = ve))
    : ((ge = e[42]), (_e = e[43]), (ve = e[44]));
  let W;
  e[45] === U
    ? (W = e[46])
    : ((W = (0, E.jsxs)(p.Item, {
        value: `Sessions`,
        className: D,
        onSelect: U,
        children: [ge, _e, ve],
      })),
      (e[45] = U),
      (e[46] = W));
  let G;
  e[47] !== d || e[48] !== j
    ? ((G = () => j(`${d}/docs`)), (e[47] = d), (e[48] = j), (e[49] = G))
    : (G = e[49]);
  let ye, be, xe;
  e[50] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ye = (0, E.jsx)(x, { size: 16, className: `flex-shrink-0` })),
      (be = (0, E.jsx)(`span`, { className: `flex-1`, children: `Documents` })),
      (xe = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Test`,
      })),
      (e[50] = ye),
      (e[51] = be),
      (e[52] = xe))
    : ((ye = e[50]), (be = e[51]), (xe = e[52]));
  let K;
  e[53] === G
    ? (K = e[54])
    : ((K = (0, E.jsxs)(p.Item, {
        value: `Documents`,
        className: D,
        onSelect: G,
        children: [ye, be, xe],
      })),
      (e[53] = G),
      (e[54] = K));
  let q;
  e[55] !== d || e[56] !== j
    ? ((q = () => j(`${d}/testing-arena`)),
      (e[55] = d),
      (e[56] = j),
      (e[57] = q))
    : (q = e[57]);
  let Se, Ce, we;
  e[58] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Se = (0, E.jsx)(S, { size: 16, className: `flex-shrink-0` })),
      (Ce = (0, E.jsx)(`span`, {
        className: `flex-1`,
        children: `Testing Arena`,
      })),
      (we = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Test`,
      })),
      (e[58] = Se),
      (e[59] = Ce),
      (e[60] = we))
    : ((Se = e[58]), (Ce = e[59]), (we = e[60]));
  let J;
  e[61] === q
    ? (J = e[62])
    : ((J = (0, E.jsxs)(p.Item, {
        value: `Testing Arena`,
        className: D,
        onSelect: q,
        children: [Se, Ce, we],
      })),
      (e[61] = q),
      (e[62] = J));
  let Y;
  e[63] !== d || e[64] !== j
    ? ((Y = () => j(`${d}/analyse`)), (e[63] = d), (e[64] = j), (e[65] = Y))
    : (Y = e[65]);
  let Te, Ee, De;
  e[66] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Te = (0, E.jsx)(u, { size: 16, className: `flex-shrink-0` })),
      (Ee = (0, E.jsx)(`span`, { className: `flex-1`, children: `Analyse` })),
      (De = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Data`,
      })),
      (e[66] = Te),
      (e[67] = Ee),
      (e[68] = De))
    : ((Te = e[66]), (Ee = e[67]), (De = e[68]));
  let X;
  e[69] === Y
    ? (X = e[70])
    : ((X = (0, E.jsxs)(p.Item, {
        value: `Analyse`,
        className: D,
        onSelect: Y,
        children: [Te, Ee, De],
      })),
      (e[69] = Y),
      (e[70] = X));
  let Z;
  e[71] !== d || e[72] !== j
    ? ((Z = () => j(`${d}/stats`)), (e[71] = d), (e[72] = j), (e[73] = Z))
    : (Z = e[73]);
  let Oe, ke, Ae;
  e[74] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Oe = (0, E.jsx)(_, { size: 16, className: `flex-shrink-0` })),
      (ke = (0, E.jsx)(`span`, { className: `flex-1`, children: `Stats` })),
      (Ae = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Analytics`,
      })),
      (e[74] = Oe),
      (e[75] = ke),
      (e[76] = Ae))
    : ((Oe = e[74]), (ke = e[75]), (Ae = e[76]));
  let Q;
  e[77] === Z
    ? (Q = e[78])
    : ((Q = (0, E.jsxs)(p.Item, {
        value: `Stats`,
        className: D,
        onSelect: Z,
        children: [Oe, ke, Ae],
      })),
      (e[77] = Z),
      (e[78] = Q));
  let je;
  e[79] !== d || e[80] !== j
    ? ((je = () => j(`${d}/settings`)), (e[79] = d), (e[80] = j), (e[81] = je))
    : (je = e[81]);
  let Me, Ne, Pe;
  e[82] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Me = (0, E.jsx)(T, { size: 16, className: `flex-shrink-0` })),
      (Ne = (0, E.jsx)(`span`, { className: `flex-1`, children: `Settings` })),
      (Pe = (0, E.jsx)(`span`, {
        className: `text-xs text-muted-foreground`,
        children: `Settings`,
      })),
      (e[82] = Me),
      (e[83] = Ne),
      (e[84] = Pe))
    : ((Me = e[82]), (Ne = e[83]), (Pe = e[84]));
  let Fe;
  e[85] === je
    ? (Fe = e[86])
    : ((Fe = (0, E.jsxs)(p.Item, {
        value: `Settings`,
        className: D,
        onSelect: je,
        children: [Me, Ne, Pe],
      })),
      (e[85] = je),
      (e[86] = Fe));
  let Ie;
  e[87] !== B ||
  e[88] !== H ||
  e[89] !== W ||
  e[90] !== K ||
  e[91] !== J ||
  e[92] !== X ||
  e[93] !== Q ||
  e[94] !== Fe
    ? ((Ie = (0, E.jsxs)(p.Group, {
        heading: `Pages`,
        className: O,
        children: [B, H, W, K, J, X, Q, Fe],
      })),
      (e[87] = B),
      (e[88] = H),
      (e[89] = W),
      (e[90] = K),
      (e[91] = J),
      (e[92] = X),
      (e[93] = Q),
      (e[94] = Fe),
      (e[95] = Ie))
    : (Ie = e[95]);
  let $;
  e[96] !== d || e[97] !== j || e[98] !== f || e[99] !== r
    ? (($ =
        r &&
        f &&
        f.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Projects`,
          className: O,
          children: f.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: `${e.title} ${e.description ?? ``}`,
                className: D,
                onSelect: () => j(`${d}/projects/${e._id}`),
                children: [
                  (0, E.jsx)(C, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: e.phase,
                  }),
                ],
              },
              e._id,
            ),
          ),
        })),
      (e[96] = d),
      (e[97] = j),
      (e[98] = f),
      (e[99] = r),
      (e[100] = $))
    : ($ = e[100]);
  let Le;
  e[101] !== d || e[102] !== j || e[103] !== r || e[104] !== w
    ? ((Le =
        r &&
        w &&
        w.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Tasks`,
          className: O,
          children: w.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: e.title,
                className: D,
                onSelect: () => j(`${d}/quick-tasks`),
                children: [
                  (0, E.jsx)(b, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: e.status,
                  }),
                ],
              },
              e._id,
            ),
          ),
        })),
      (e[101] = d),
      (e[102] = j),
      (e[103] = r),
      (e[104] = w),
      (e[105] = Le))
    : (Le = e[105]);
  let Re;
  e[106] !== d || e[107] !== j || e[108] !== r || e[109] !== m
    ? ((Re =
        r &&
        m &&
        m.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Sessions`,
          className: O,
          children: m.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: e.title,
                className: D,
                onSelect: () => j(`${d}/sessions/${e._id}`),
                children: [
                  (0, E.jsx)(ae, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: e.status,
                  }),
                ],
              },
              e._id,
            ),
          ),
        })),
      (e[106] = d),
      (e[107] = j),
      (e[108] = r),
      (e[109] = m),
      (e[110] = Re))
    : (Re = e[110]);
  let ze;
  e[111] !== d || e[112] !== h || e[113] !== j || e[114] !== r
    ? ((ze =
        r &&
        h &&
        h.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Documents`,
          className: O,
          children: h.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: e.title,
                className: D,
                onSelect: () => j(`${d}/docs/${e._id}`),
                children: [
                  (0, E.jsx)(x, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: `Doc`,
                  }),
                ],
              },
              e._id,
            ),
          ),
        })),
      (e[111] = d),
      (e[112] = h),
      (e[113] = j),
      (e[114] = r),
      (e[115] = ze))
    : (ze = e[115]);
  let Be;
  e[116] !== d || e[117] !== h || e[118] !== j || e[119] !== r
    ? ((Be =
        r &&
        h &&
        h.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Testing Arena`,
          className: O,
          children: h.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: `test ${e.title}`,
                className: D,
                onSelect: () => j(`${d}/testing-arena/${e._id}`),
                children: [
                  (0, E.jsx)(S, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: `Test`,
                  }),
                ],
              },
              `test-${e._id}`,
            ),
          ),
        })),
      (e[116] = d),
      (e[117] = h),
      (e[118] = j),
      (e[119] = r),
      (e[120] = Be))
    : (Be = e[120]);
  let Ve;
  e[121] !== d || e[122] !== j || e[123] !== v || e[124] !== r
    ? ((Ve =
        r &&
        v &&
        v.length > 0 &&
        (0, E.jsx)(p.Group, {
          heading: `Queries`,
          className: O,
          children: v.map((e) =>
            (0, E.jsxs)(
              p.Item,
              {
                value: e.title,
                className: D,
                onSelect: () => j(`${d}/analyse/query/${e._id}`),
                children: [
                  (0, E.jsx)(u, { size: 16, className: `flex-shrink-0` }),
                  (0, E.jsx)(`span`, {
                    className: `flex-1 truncate`,
                    children: e.title,
                  }),
                  (0, E.jsx)(`span`, {
                    className: `text-xs text-muted-foreground`,
                    children: `Analysis Query`,
                  }),
                ],
              },
              e._id,
            ),
          ),
        })),
      (e[121] = d),
      (e[122] = j),
      (e[123] = v),
      (e[124] = r),
      (e[125] = Ve))
    : (Ve = e[125]);
  let He;
  e[126] !== Ie ||
  e[127] !== $ ||
  e[128] !== Le ||
  e[129] !== Re ||
  e[130] !== ze ||
  e[131] !== Be ||
  e[132] !== Ve
    ? ((He = (0, E.jsxs)(p.List, {
        className: `max-h-80 overflow-y-auto py-2`,
        children: [F, Ie, $, Le, Re, ze, Be, Ve],
      })),
      (e[126] = Ie),
      (e[127] = $),
      (e[128] = Le),
      (e[129] = Re),
      (e[130] = ze),
      (e[131] = Be),
      (e[132] = Ve),
      (e[133] = He))
    : (He = e[133]);
  let Ue;
  e[134] !== P || e[135] !== He
    ? ((Ue = (0, E.jsx)(ne, {
        hideCloseButton: !0,
        className: `top-[28%] max-w-xl translate-y-0 gap-0 p-0`,
        children: (0, E.jsxs)(p, {
          className: `flex flex-col bg-transparent`,
          shouldFilter: !0,
          children: [P, He],
        }),
      })),
      (e[134] = P),
      (e[135] = He),
      (e[136] = Ue))
    : (Ue = e[136]);
  let We;
  return (
    e[137] !== t || e[138] !== n || e[139] !== Ue
      ? ((We = (0, E.jsx)(ee, { open: t, onOpenChange: n, children: Ue })),
        (e[137] = t),
        (e[138] = n),
        (e[139] = Ue),
        (e[140] = We))
      : (We = e[140]),
    We
  );
}
var de = [
  {
    key: `CLAUDE_CODE_OAUTH_TOKEN`,
    required: !0,
    description: `OAuth token for Claude Code CLI authentication in sandboxes`,
  },
  {
    key: `DAYTONA_API_KEY`,
    required: !0,
    description: `API key for provisioning and managing Daytona sandboxes`,
  },
];
function A() {
  let e = (0, le.c)(58),
    { repo: t } = ce(),
    [n, i] = (0, ue.useState)(!1),
    a;
  e[0] === t.teamId
    ? (a = e[1])
    : ((a = t.teamId ? { id: t.teamId } : `skip`),
      (e[0] = t.teamId),
      (e[1] = a));
  let o = l(c.teams.get, a),
    s;
  e[2] === t.teamId
    ? (s = e[3])
    : ((s = t.teamId ? { teamId: t.teamId } : `skip`),
      (e[2] = t.teamId),
      (e[3] = s));
  let u = l(c.teamEnvVars.list, s),
    re;
  e[4] === t._id
    ? (re = e[5])
    : ((re = { repoId: t._id }), (e[4] = t._id), (e[5] = re));
  let p = l(c.repoEnvVars.list, re);
  if (!t.teamId || !o || u === void 0 || p === void 0) return null;
  let ae;
  e[6] !== p || e[7] !== u
    ? ((ae = [...u, ...p]), (e[6] = p), (e[7] = u), (e[8] = ae))
    : (ae = e[8]);
  let m = ae,
    se;
  e[9] === m
    ? (se = e[10])
    : ((se = new Set(m.map(M))), (e[9] = m), (e[10] = se));
  let h = se,
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
    D,
    O;
  if (e[11] !== n || e[12] !== h) {
    S = Symbol.for(`react.early_return_sentinel`);
    bb0: {
      let t;
      e[25] === h
        ? (t = e[26])
        : ((t = (e) => !h.has(e.key)), (e[25] = h), (e[26] = t));
      let r = de.filter(t);
      if (!r.some(fe) || n) {
        S = null;
        break bb0;
      }
      ((_ = ee),
        (b = !0),
        e[27] === Symbol.for(`react.memo_cache_sentinel`)
          ? ((x = (e) => !e && i(!0)), (e[27] = x))
          : (x = e[27]),
        (g = ne),
        e[28] === Symbol.for(`react.memo_cache_sentinel`)
          ? ((y = (0, E.jsx)(f, {
              children: (0, E.jsxs)(`div`, {
                className: `flex items-center gap-3`,
                children: [
                  (0, E.jsx)(`div`, {
                    className: `flex h-10 w-10 items-center justify-center rounded-full bg-yellow-500/10`,
                    children: (0, E.jsx)(oe, {
                      size: 20,
                      className: `text-yellow-600 dark:text-yellow-500`,
                    }),
                  }),
                  (0, E.jsx)(d, { children: `Setup Required` }),
                ],
              }),
            })),
            (e[28] = y))
          : (y = e[28]),
        (O = `space-y-4`),
        e[29] === Symbol.for(`react.memo_cache_sentinel`)
          ? ((v = (0, E.jsx)(`p`, {
              className: `text-sm text-muted-foreground`,
              children: `To use sandboxes and AI features, you need to configure the following environment variables in your team or repo settings.`,
            })),
            (e[29] = v))
          : (v = e[29]),
        (T = `rounded-lg bg-muted/40 p-4`),
        e[30] === Symbol.for(`react.memo_cache_sentinel`)
          ? ((D = (0, E.jsx)(`p`, {
              className: `mb-2 text-xs font-medium text-muted-foreground`,
              children: `Missing Variables:`,
            })),
            (e[30] = D))
          : (D = e[30]),
        (C = `flex flex-col gap-2`),
        (w = r.map(j)));
    }
    ((e[11] = n),
      (e[12] = h),
      (e[13] = g),
      (e[14] = _),
      (e[15] = v),
      (e[16] = y),
      (e[17] = b),
      (e[18] = x),
      (e[19] = S),
      (e[20] = C),
      (e[21] = w),
      (e[22] = T),
      (e[23] = D),
      (e[24] = O));
  } else
    ((g = e[13]),
      (_ = e[14]),
      (v = e[15]),
      (y = e[16]),
      (b = e[17]),
      (x = e[18]),
      (S = e[19]),
      (C = e[20]),
      (w = e[21]),
      (T = e[22]),
      (D = e[23]),
      (O = e[24]));
  if (S !== Symbol.for(`react.early_return_sentinel`)) return S;
  let k;
  e[31] !== C || e[32] !== w
    ? ((k = (0, E.jsx)(`div`, { className: C, children: w })),
      (e[31] = C),
      (e[32] = w),
      (e[33] = k))
    : (k = e[33]);
  let A;
  e[34] !== k || e[35] !== T || e[36] !== D
    ? ((A = (0, E.jsxs)(`div`, { className: T, children: [D, k] })),
      (e[34] = k),
      (e[35] = T),
      (e[36] = D),
      (e[37] = A))
    : (A = e[37]);
  let N;
  e[38] !== v || e[39] !== A || e[40] !== O
    ? ((N = (0, E.jsxs)(`div`, { className: O, children: [v, A] })),
      (e[38] = v),
      (e[39] = A),
      (e[40] = O),
      (e[41] = N))
    : (N = e[41]);
  let P;
  e[42] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((P = (0, E.jsx)(ie, {
        variant: `outline`,
        onClick: () => i(!0),
        children: `Dismiss`,
      })),
      (e[42] = P))
    : (P = e[42]);
  let F;
  e[43] === o._id
    ? (F = e[44])
    : ((F = { teamId: o._id }), (e[43] = o._id), (e[44] = F));
  let I;
  e[45] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((I = (0, E.jsx)(ie, { children: `Configure Team Settings` })),
      (e[45] = I))
    : (I = e[45]);
  let L;
  e[46] === F
    ? (L = e[47])
    : ((L = (0, E.jsxs)(te, {
        children: [
          P,
          (0, E.jsx)(r, { to: `/teams/$teamId`, params: F, children: I }),
        ],
      })),
      (e[46] = F),
      (e[47] = L));
  let R;
  e[48] !== g || e[49] !== y || e[50] !== N || e[51] !== L
    ? ((R = (0, E.jsxs)(g, { children: [y, N, L] })),
      (e[48] = g),
      (e[49] = y),
      (e[50] = N),
      (e[51] = L),
      (e[52] = R))
    : (R = e[52]);
  let z;
  return (
    e[53] !== _ || e[54] !== b || e[55] !== x || e[56] !== R
      ? ((z = (0, E.jsx)(_, { open: b, onOpenChange: x, children: R })),
        (e[53] = _),
        (e[54] = b),
        (e[55] = x),
        (e[56] = R),
        (e[57] = z))
      : (z = e[57]),
    z
  );
}
function j(e) {
  return (0, E.jsxs)(
    `div`,
    {
      className: `flex flex-col gap-0.5`,
      children: [
        (0, E.jsxs)(`div`, {
          className: `flex items-center gap-2`,
          children: [
            (0, E.jsx)(`code`, {
              className: `rounded bg-background px-2 py-1 font-mono text-sm`,
              children: e.key,
            }),
            e.required
              ? (0, E.jsx)(`span`, {
                  className: `rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400`,
                  children: `Required`,
                })
              : (0, E.jsx)(`span`, {
                  className: `rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-medium text-yellow-600 dark:text-yellow-500`,
                  children: `Optional`,
                }),
          ],
        }),
        (0, E.jsx)(`p`, {
          className: `pl-2 text-xs text-muted-foreground`,
          children: e.description,
        }),
      ],
    },
    e.key,
  );
}
function fe(e) {
  return e.required;
}
function M(e) {
  return e.key;
}
function N(e) {
  let t = (0, le.c)(4),
    { collapsed: n } = v(),
    r = `relative flex h-screen flex-col overflow-hidden pt-14 transition-[padding] duration-300 lg:pt-0 ${n ? `lg:pl-20` : `lg:pl-64`}`,
    i;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, E.jsx)(`div`, {
        "aria-hidden": !0,
        className: `pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent`,
      })),
      (t[0] = i))
    : (i = t[0]);
  let o;
  t[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((o = (0, E.jsxs)(`div`, {
        className: `relative flex h-full flex-col overflow-hidden bg-background`,
        children: [
          i,
          (0, E.jsxs)(`div`, {
            className: `relative z-10 flex-1 min-h-0 overflow-hidden`,
            children: [(0, E.jsx)(A, {}), (0, E.jsx)(a, {})],
          }),
        ],
      })),
      (t[1] = o))
    : (o = t[1]);
  let s;
  return (
    t[2] === r
      ? (s = t[3])
      : ((s = (0, E.jsx)(`div`, { className: r, children: o })),
        (t[2] = r),
        (t[3] = s)),
    s
  );
}
function P() {
  let e = (0, le.c)(6),
    { owner: t, repo: n } = s.useParams(),
    r;
  e[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((r = (0, E.jsx)(y, {})), (e[0] = r))
    : (r = e[0]);
  let i, o;
  e[1] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((i = (0, E.jsx)(N, { children: (0, E.jsx)(a, {}) })),
      (o = (0, E.jsx)(k, {})),
      (e[1] = i),
      (e[2] = o))
    : ((i = e[1]), (o = e[2]));
  let c;
  return (
    e[3] !== t || e[4] !== n
      ? ((c = (0, E.jsx)(g, {
          children: (0, E.jsx)(h, {
            children: (0, E.jsxs)(w, {
              owner: t,
              repoParam: n,
              children: [r, i, o],
            }),
          }),
        })),
        (e[3] = t),
        (e[4] = n),
        (e[5] = c))
      : (c = e[5]),
    c
  );
}
export { P as component };
