import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r, n as i } from "./index-CuMF3NGg.js";
import { c as a, n as o, o as s } from "./backend-BVlbQtYj.js";
import { t as c } from "./hooks-B_9i2gKL.js";
import {
  $t as l,
  Ct as u,
  Gn as d,
  Gt as f,
  Ht as p,
  Jt as m,
  Kt as h,
  Qt as g,
  Rn as _,
  St as v,
  Tr as y,
  Tt as b,
  Ut as x,
  Vn as S,
  Wn as C,
  Wt as w,
  Xt as T,
  Z as E,
  _t as D,
  at as ee,
  ct as te,
  dt as ne,
  ft as re,
  gt as ie,
  ht as ae,
  mt as oe,
  on as se,
  pt as ce,
  qt as le,
  sn as ue,
  ur as O,
  ut as de,
  wt as fe,
  xr as k,
} from "./src-DHCpG1Q-.js";
import { t as A } from "./createReactComponent-C2GWxX5y.js";
import { t as j } from "./IconDeviceDesktop-DW-nbygi.js";
import {
  a as M,
  i as pe,
  n as me,
  o as N,
  r as he,
  t as P,
} from "./PreviewNavBar-BYKOVH-7.js";
import { t as F } from "./IconPlayerPlay-D3JRfC8r.js";
import { t as I } from "./IconTrash-bHTcNORt.js";
import { t as ge } from "./IconUsers-C0ORl3PB.js";
import { n as _e } from "./dates-DHZmrCUU.js";
import { C as L, n as R, x as z } from "./search-params-C2OhCtfp.js";
import { n as B } from "./RepoContext-D9QMbL6d.js";
import {
  a as V,
  i as ve,
  n as ye,
  r as be,
  s as xe,
  t as Se,
} from "./StreamingActivityDisplay-CD4bZNYp.js";
var H = A(`outline`, `device-mobile`, `DeviceMobile`, [
    [
      `path`,
      {
        d: `M6 5a2 2 0 0 1 2 -2h8a2 2 0 0 1 2 2v14a2 2 0 0 1 -2 2h-8a2 2 0 0 1 -2 -2v-14`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M11 4h2`, key: `svg-1` }],
    [`path`, { d: `M12 17v.01`, key: `svg-2` }],
  ]),
  Ce = A(`outline`, `edit`, `Edit`, [
    [
      `path`,
      {
        d: `M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1`,
        key: `svg-0`,
      },
    ],
    [
      `path`,
      {
        d: `M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415`,
        key: `svg-1`,
      },
    ],
    [`path`, { d: `M16 5l3 3`, key: `svg-2` }],
  ]),
  we = r(),
  U = e(t(), 1),
  W = n();
function G(e) {
  let t = (0, we.c)(15),
    { repoId: n, value: r, onChange: i } = e,
    a;
  t[0] === n ? (a = t[1]) : ((a = { repoId: n }), (t[0] = n), (t[1] = a));
  let s = c(o.designPersonas.list, a),
    u = r ?? `none`,
    d;
  t[2] !== i || t[3] !== s
    ? ((d = (e) => {
        let t = s?.find((t) => t._id === e);
        i(t?._id);
      }),
      (t[2] = i),
      (t[3] = s),
      (t[4] = d))
    : (d = t[4]);
  let f;
  t[5] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((f = (0, W.jsx)(g, {
        className: `h-7 w-auto gap-1.5 border-none bg-transparent text-xs text-muted-foreground shadow-none hover:bg-accent hover:text-foreground`,
        children: (0, W.jsx)(l, { placeholder: `No persona` }),
      })),
      (t[5] = f))
    : (f = t[5]);
  let p;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((p = (0, W.jsx)(T, { value: `none`, children: `No persona` })),
      (t[6] = p))
    : (p = t[6]);
  let h;
  t[7] === s ? (h = t[8]) : ((h = s?.map(K)), (t[7] = s), (t[8] = h));
  let _;
  t[9] === h
    ? (_ = t[10])
    : ((_ = (0, W.jsxs)(m, { children: [p, h] })), (t[9] = h), (t[10] = _));
  let v;
  return (
    t[11] !== u || t[12] !== d || t[13] !== _
      ? ((v = (0, W.jsxs)(le, {
          value: u,
          onValueChange: d,
          children: [f, _],
        })),
        (t[11] = u),
        (t[12] = d),
        (t[13] = _),
        (t[14] = v))
      : (v = t[14]),
    v
  );
}
function K(e) {
  return (0, W.jsx)(T, { value: e._id, children: e.name }, e._id);
}
function Te(e) {
  let t = (0, we.c)(59),
    { repoId: n, selectedPersonaId: r, onClearPersona: i } = e,
    s;
  t[0] === n ? (s = t[1]) : ((s = { repoId: n }), (t[0] = n), (t[1] = s));
  let l = c(o.designPersonas.list, s),
    u = a(o.designPersonas.create),
    f = a(o.designPersonas.update),
    p = a(o.designPersonas.remove),
    [m, h] = (0, U.useState)(!1),
    [g, v] = (0, U.useState)(null),
    [y, b] = (0, U.useState)(!1),
    [x, w] = (0, U.useState)(``),
    [T, E] = (0, U.useState)(``),
    [D, ee] = (0, U.useState)(null),
    te;
  t[2] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((te = () => {
        (v(null), b(!1), w(``), E(``));
      }),
      (t[2] = te))
    : (te = t[2]);
  let ne = te,
    re;
  t[3] !== u ||
  t[4] !== g ||
  t[5] !== x ||
  t[6] !== T ||
  t[7] !== n ||
  t[8] !== f
    ? ((re = async () => {
        !x.trim() ||
          !T.trim() ||
          (g
            ? await f({ id: g, name: x.trim(), prompt: T.trim() })
            : await u({ repoId: n, name: x.trim(), prompt: T.trim() }),
          ne());
      }),
      (t[3] = u),
      (t[4] = g),
      (t[5] = x),
      (t[6] = T),
      (t[7] = n),
      (t[8] = f),
      (t[9] = re))
    : (re = t[9]);
  let ie = re,
    ae;
  t[10] !== D || t[11] !== i || t[12] !== p || t[13] !== r
    ? ((ae = async () => {
        D && (await p({ id: D }), r === D && i(), ee(null));
      }),
      (t[10] = D),
      (t[11] = i),
      (t[12] = p),
      (t[13] = r),
      (t[14] = ae))
    : (ae = t[14]);
  let oe = ae,
    ce;
  t[15] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ce = (e) => {
        (b(!1), v(e._id), w(e.name), E(e.prompt));
      }),
      (t[15] = ce))
    : (ce = t[15]);
  let le = ce,
    de;
  t[16] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((de = () => {
        (v(null), b(!0), w(``), E(``));
      }),
      (t[16] = de))
    : (de = t[16]);
  let fe = de,
    k;
  t[17] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((k = (e) => w(e.target.value)), (t[17] = k))
    : (k = t[17]);
  let A;
  t[18] === x
    ? (A = t[19])
    : ((A = (0, W.jsx)(ue, {
        placeholder: `Persona name`,
        value: x,
        onChange: k,
      })),
      (t[18] = x),
      (t[19] = A));
  let j;
  t[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((j = (e) => E(e.target.value)), (t[20] = j))
    : (j = t[20]);
  let M;
  t[21] === T
    ? (M = t[22])
    : ((M = (0, W.jsx)(se, {
        placeholder: `Describe this persona — their role, goals, context, preferences...`,
        value: T,
        onChange: j,
        rows: 3,
      })),
      (t[21] = T),
      (t[22] = M));
  let pe;
  t[23] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((pe = (0, W.jsx)(O, {
        size: `sm`,
        variant: `ghost`,
        onClick: ne,
        children: `Cancel`,
      })),
      (t[23] = pe))
    : (pe = t[23]);
  let me = g ? `Save` : `Create`,
    N;
  t[24] !== ie || t[25] !== me
    ? ((N = (0, W.jsxs)(`div`, {
        className: `flex gap-2 justify-end`,
        children: [
          pe,
          (0, W.jsx)(O, { size: `sm`, onClick: ie, children: me }),
        ],
      })),
      (t[24] = ie),
      (t[25] = me),
      (t[26] = N))
    : (N = t[26]);
  let he;
  t[27] !== M || t[28] !== N || t[29] !== A
    ? ((he = (0, W.jsxs)(`div`, {
        className: `space-y-2 rounded-md bg-muted/40 p-3`,
        children: [A, M, N],
      })),
      (t[27] = M),
      (t[28] = N),
      (t[29] = A),
      (t[30] = he))
    : (he = t[30]);
  let P = he,
    F;
  t[31] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((F = (e) => {
        (h(e), e || ne());
      }),
      (t[31] = F))
    : (F = t[31]);
  let _e;
  t[32] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((_e = (0, W.jsxs)(O, {
        variant: `secondary`,
        size: `sm`,
        className: `motion-press text-primary hover:scale-[1.01] active:scale-[0.99]`,
        onClick: () => h(!0),
        children: [(0, W.jsx)(ge, { size: 14 }), `Personas`],
      })),
      (t[32] = _e))
    : (_e = t[32]);
  let L;
  t[33] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((L = (0, W.jsx)(C, {
        children: (0, W.jsx)(d, { children: `Manage Personas` }),
      })),
      (t[33] = L))
    : (L = t[33]);
  let R;
  t[34] !== g || t[35] !== P || t[36] !== l
    ? ((R = l?.map((e) =>
        g === e._id
          ? (0, W.jsx)(`div`, { children: P }, e._id)
          : (0, W.jsxs)(
              `div`,
              {
                className: `flex items-center justify-between rounded-md bg-muted/40 px-3 py-2`,
                children: [
                  (0, W.jsxs)(`div`, {
                    className: `min-w-0`,
                    children: [
                      (0, W.jsx)(`p`, {
                        className: `text-sm font-medium truncate`,
                        children: e.name,
                      }),
                      (0, W.jsx)(`p`, {
                        className: `text-xs text-muted-foreground truncate`,
                        children: e.prompt,
                      }),
                    ],
                  }),
                  (0, W.jsxs)(`div`, {
                    className: `flex gap-1 shrink-0 ml-2`,
                    children: [
                      (0, W.jsx)(O, {
                        size: `sm`,
                        variant: `ghost`,
                        className: `h-7 w-7 p-0`,
                        onClick: () => le(e),
                        children: (0, W.jsx)(Ce, { size: 14 }),
                      }),
                      (0, W.jsx)(O, {
                        size: `sm`,
                        variant: `ghost`,
                        className: `h-7 w-7 p-0 text-destructive`,
                        onClick: () => ee(e._id),
                        children: (0, W.jsx)(I, { size: 14 }),
                      }),
                    ],
                  }),
                ],
              },
              e._id,
            ),
      )),
      (t[34] = g),
      (t[35] = P),
      (t[36] = l),
      (t[37] = R))
    : (R = t[37]);
  let z;
  t[38] !== y || t[39] !== P
    ? ((z = y
        ? P
        : (0, W.jsx)(O, {
            size: `sm`,
            variant: `secondary`,
            className: `w-full`,
            onClick: fe,
            children: `Add persona`,
          })),
      (t[38] = y),
      (t[39] = P),
      (t[40] = z))
    : (z = t[40]);
  let B;
  t[41] !== R || t[42] !== z
    ? ((B = (0, W.jsxs)(S, {
        className: `max-w-[calc(100vw-2rem)] sm:max-w-md`,
        children: [
          L,
          (0, W.jsxs)(`div`, {
            className: `space-y-3 max-h-[60vh] overflow-y-auto`,
            children: [R, z],
          }),
        ],
      })),
      (t[41] = R),
      (t[42] = z),
      (t[43] = B))
    : (B = t[43]);
  let V;
  t[44] !== m || t[45] !== B
    ? ((V = (0, W.jsxs)(_, { open: m, onOpenChange: F, children: [_e, B] })),
      (t[44] = m),
      (t[45] = B),
      (t[46] = V))
    : (V = t[46]);
  let ve = !!D,
    ye;
  t[47] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((ye = (e) => {
        e || ee(null);
      }),
      (t[47] = ye))
    : (ye = t[47]);
  let be, xe;
  t[48] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((be = (0, W.jsx)(C, {
        children: (0, W.jsx)(d, { children: `Delete persona` }),
      })),
      (xe = (0, W.jsx)(`p`, {
        className: `text-sm text-muted-foreground`,
        children: `Are you sure you want to delete this persona? This cannot be undone.`,
      })),
      (t[48] = be),
      (t[49] = xe))
    : ((be = t[48]), (xe = t[49]));
  let Se;
  t[50] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Se = (0, W.jsx)(O, {
        size: `sm`,
        variant: `ghost`,
        onClick: () => ee(null),
        children: `Cancel`,
      })),
      (t[50] = Se))
    : (Se = t[50]);
  let H;
  t[51] === oe
    ? (H = t[52])
    : ((H = (0, W.jsxs)(S, {
        className: `max-w-[calc(100vw-2rem)] sm:max-w-sm`,
        children: [
          be,
          xe,
          (0, W.jsxs)(`div`, {
            className: `flex gap-2 justify-end`,
            children: [
              Se,
              (0, W.jsx)(O, {
                size: `sm`,
                variant: `destructive`,
                onClick: oe,
                children: `Delete`,
              }),
            ],
          }),
        ],
      })),
      (t[51] = oe),
      (t[52] = H));
  let G;
  t[53] !== ve || t[54] !== H
    ? ((G = (0, W.jsx)(_, { open: ve, onOpenChange: ye, children: H })),
      (t[53] = ve),
      (t[54] = H),
      (t[55] = G))
    : (G = t[55]);
  let K;
  return (
    t[56] !== V || t[57] !== G
      ? ((K = (0, W.jsxs)(W.Fragment, { children: [V, G] })),
        (t[56] = V),
        (t[57] = G),
        (t[58] = K))
      : (K = t[58]),
    K
  );
}
function q(e) {
  let t = (0, we.c)(90),
    {
      designSessionId: n,
      title: r,
      isArchived: i,
      isSandboxActive: s,
      isSandboxToggling: l,
      isExecuting: d,
      onSandboxToggle: f,
      repoId: p,
    } = e,
    m;
  t[0] === n ? (m = t[1]) : ((m = { parentId: n }), (t[0] = n), (t[1] = m));
  let g = c(o.messages.listByParent, m),
    _;
  t[2] === n ? (_ = t[3]) : ((_ = { entityId: n }), (t[2] = n), (t[3] = _));
  let y = c(o.streaming.get, _),
    x;
  t[4] === n ? (x = t[5]) : ((x = { parentId: n }), (t[4] = n), (t[5] = x));
  let S = c(o.queuedMessages.listByParent, x),
    C;
  t[6] === p ? (C = t[7]) : ((C = { repoId: p }), (t[6] = p), (t[7] = C));
  let w = c(o.designPersonas.list, C),
    T = a(o.designSessions.executeMessage),
    se = a(o.designSessions.enqueueMessage),
    le = a(o.designSessions.cancelExecution),
    ue = a(o.queuedMessages.update),
    A = a(o.queuedMessages.remove),
    [j, M] = (0, U.useState)(!1),
    [N, P] = (0, U.useState)(),
    [I, ge] = (0, U.useState)(3),
    L;
  t[8] === n ? (L = t[9]) : ((L = V(n, `sonnet`)), (t[8] = n), (t[9] = L));
  let [R, z] = (0, U.useState)(L),
    B = xe(n),
    H;
  t[10] === B
    ? (H = t[11])
    : ((H = (e) => {
        (z(e), B(e));
      }),
      (t[10] = B),
      (t[11] = H));
  let Ce = H,
    K;
  t[12] === g ? (K = t[13]) : ((K = g ?? []), (t[12] = g), (t[13] = K));
  let q = K,
    J = q[q.length - 1],
    Oe,
    ke;
  (t[14] !== j || t[15] !== J
    ? ((Oe = () => {
        j && J?.role === `assistant` && J.content && M(!1);
      }),
      (ke = [j, J]),
      (t[14] = j),
      (t[15] = J),
      (t[16] = Oe),
      (t[17] = ke))
    : ((Oe = t[16]), (ke = t[17])),
    (0, U.useEffect)(Oe, ke));
  let Ae;
  t[18] === w
    ? (Ae = t[19])
    : ((Ae = new Map(w?.map(De) ?? [])), (t[18] = w), (t[19] = Ae));
  let Y = Ae,
    je;
  t[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((je = (0, W.jsx)(be, {})), (t[20] = je))
    : (je = t[20]);
  let Me = je,
    X = j || d,
    Ne;
  t[21] !== n ||
  t[22] !== se ||
  t[23] !== T ||
  t[24] !== X ||
  t[25] !== s ||
  t[26] !== I ||
  t[27] !== N
    ? ((Ne = async (e) => {
        if (!(!e.trim() || !s)) {
          if (X) {
            await se({ id: n, message: e.trim(), personaId: N, numDesigns: I });
            return;
          }
          M(!0);
          try {
            await T({ id: n, message: e.trim(), personaId: N, numDesigns: I });
          } catch {
            M(!1);
          }
        }
      }),
      (t[21] = n),
      (t[22] = se),
      (t[23] = T),
      (t[24] = X),
      (t[25] = s),
      (t[26] = I),
      (t[27] = N),
      (t[28] = Ne))
    : (Ne = t[28]);
  let Pe = Ne,
    Fe;
  t[29] !== le || t[30] !== n
    ? ((Fe = async () => {
        await le({ id: n });
      }),
      (t[29] = le),
      (t[30] = n),
      (t[31] = Fe))
    : (Fe = t[31]);
  let Ie = Fe,
    Le;
  t[32] === Pe
    ? (Le = t[33])
    : ((Le = async (e) => {
        let { text: t } = e;
        await Pe(t);
      }),
      (t[32] = Pe),
      (t[33] = Le));
  let Re = Le,
    Z;
  t[34] === S ? (Z = t[35]) : ((Z = S ?? []), (t[34] = S), (t[35] = Z));
  let ze;
  if (t[36] !== Y || t[37] !== Z) {
    let e;
    (t[39] === Y
      ? (e = t[40])
      : ((e = (e) => {
          let t = [
            e.personaId ? (Y.get(e.personaId)?.name ?? `Persona`) : null,
            typeof e.numDesigns == `number`
              ? `${e.numDesigns} design${e.numDesigns === 1 ? `` : `s`}`
              : null,
          ].filter(Ee);
          return {
            id: e._id,
            content: e.content,
            info: t.length > 0 ? t.join(` / `) : void 0,
          };
        }),
        (t[39] = Y),
        (t[40] = e)),
      (ze = Z.map(e)),
      (t[36] = Y),
      (t[37] = Z),
      (t[38] = ze));
  } else ze = t[38];
  let Be = ze,
    Ve = s ? `destructive` : `secondary`,
    Q;
  t[41] !== s || t[42] !== f
    ? ((Q = () => f(s ? `stop` : `start`)),
      (t[41] = s),
      (t[42] = f),
      (t[43] = Q))
    : (Q = t[43]);
  let He = `motion-press h-8 w-8 hover:scale-[1.03] active:scale-[0.97] ${s ? `` : `text-success`}`,
    Ue;
  t[44] !== s || t[45] !== l
    ? ((Ue = l
        ? (0, W.jsx)(h, { size: `sm` })
        : s
          ? (0, W.jsx)(k, { className: `w-4 h-4` })
          : (0, W.jsx)(F, { className: `w-4 h-4` })),
      (t[44] = s),
      (t[45] = l),
      (t[46] = Ue))
    : (Ue = t[46]);
  let We;
  t[47] !== l || t[48] !== Ve || t[49] !== Q || t[50] !== He || t[51] !== Ue
    ? ((We = (0, W.jsx)(O, {
        size: `icon`,
        variant: Ve,
        onClick: Q,
        disabled: l,
        className: He,
        children: Ue,
      })),
      (t[47] = l),
      (t[48] = Ve),
      (t[49] = Q),
      (t[50] = He),
      (t[51] = Ue),
      (t[52] = We))
    : (We = t[52]);
  let Ge;
  t[53] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ge = () => P(void 0)), (t[53] = Ge))
    : (Ge = t[53]);
  let Ke;
  t[54] !== p || t[55] !== N
    ? ((Ke = (0, W.jsx)(Te, {
        repoId: p,
        selectedPersonaId: N,
        onClearPersona: Ge,
      })),
      (t[54] = p),
      (t[55] = N),
      (t[56] = Ke))
    : (Ke = t[56]);
  let qe;
  t[57] !== s || t[58] !== q || t[59] !== Y || t[60] !== y?.currentActivity
    ? ((qe =
        q.length === 0
          ? (0, W.jsx)(fe, {
              title: s
                ? `Describe the UI you want to design`
                : `Start the sandbox to begin designing`,
            })
          : q.map((e) =>
              e.isSystemAlert
                ? (0, W.jsx)(
                    me,
                    { content: e.content ?? ``, errorDetail: e.errorDetail },
                    e._id,
                  )
                : (0, W.jsx)(
                    E.div,
                    {
                      initial: { opacity: 0, y: 10 },
                      animate: { opacity: 1, y: 0 },
                      transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
                      children: (0, W.jsxs)(ae, {
                        from: e.role,
                        children: [
                          (0, W.jsx)(ie, {
                            className:
                              e.role === `user`
                                ? `rounded-xl bg-secondary text-foreground px-4 py-3`
                                : `px-1 py-2`,
                            children:
                              e.role === `assistant` && !e.content
                                ? (0, W.jsx)(ye, {
                                    activity: y?.currentActivity,
                                    name: `Eva`,
                                    icon: Me,
                                  })
                                : (0, W.jsx)(W.Fragment, {
                                    children:
                                      e.role === `assistant`
                                        ? (0, W.jsxs)(W.Fragment, {
                                            children: [
                                              e.activityLog &&
                                                (0, W.jsx)(Se, {
                                                  activityLog: e.activityLog,
                                                  name: `Eva`,
                                                  icon: Me,
                                                }),
                                              (0, W.jsx)(D, {
                                                className: `prose prose-sm dark:prose-invert max-w-none`,
                                                children: e.content,
                                              }),
                                            ],
                                          })
                                        : (0, W.jsxs)(W.Fragment, {
                                            children: [
                                              (0, W.jsx)(`p`, {
                                                className: `text-sm whitespace-pre-wrap break-words`,
                                                children: e.content,
                                              }),
                                              (0, W.jsxs)(`div`, {
                                                className: `flex items-center justify-between gap-3`,
                                                children: [
                                                  e.personaId &&
                                                    (0, W.jsx)(`span`, {
                                                      className: `text-[11px] text-muted-foreground/60`,
                                                      children:
                                                        Y.get(e.personaId)
                                                          ?.name ?? `Persona`,
                                                    }),
                                                  e.timestamp &&
                                                    (0, W.jsx)(`span`, {
                                                      className: `text-[11px] text-muted-foreground/60`,
                                                      children: _e(
                                                        e.timestamp,
                                                      ).format(`h:mm A`),
                                                    }),
                                                ],
                                              }),
                                            ],
                                          }),
                                  }),
                          }),
                          e.role === `user` &&
                            (0, W.jsx)(`div`, {
                              className: `mt-0.5 ml-auto`,
                              children: (0, W.jsx)(ve, { userId: e.userId }),
                            }),
                        ],
                      }),
                    },
                    e._id,
                  ),
            )),
      (t[57] = s),
      (t[58] = q),
      (t[59] = Y),
      (t[60] = y?.currentActivity),
      (t[61] = qe))
    : (qe = t[61]);
  let Je;
  t[62] === qe
    ? (Je = t[63])
    : ((Je = (0, W.jsx)(u, { className: `gap-3 p-3`, children: qe })),
      (t[62] = qe),
      (t[63] = Je));
  let Ye;
  t[64] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Ye = (0, W.jsx)(b, {})), (t[64] = Ye))
    : (Ye = t[64]);
  let Xe;
  t[65] === Je
    ? (Xe = t[66])
    : ((Xe = (0, W.jsxs)(v, {
        className: `flex-1 min-h-0`,
        children: [Je, Ye],
      })),
      (t[65] = Je),
      (t[66] = Xe));
  let $;
  t[67] !== A ||
  t[68] !== Ie ||
  t[69] !== Re ||
  t[70] !== i ||
  t[71] !== X ||
  t[72] !== s ||
  t[73] !== j ||
  t[74] !== R ||
  t[75] !== I ||
  t[76] !== d ||
  t[77] !== Be ||
  t[78] !== p ||
  t[79] !== N ||
  t[80] !== Ce ||
  t[81] !== ue
    ? (($ =
        !i &&
        (0, W.jsxs)(`div`, {
          className: `p-2 md:p-3`,
          children: [
            (0, W.jsx)(he, {
              items: Be,
              onEdit: async (e, t) => {
                await ue({ id: e, content: t });
              },
              onDelete: async (e) => {
                await A({ id: e });
              },
            }),
            (0, W.jsxs)(de, {
              onSubmit: Re,
              children: [
                (0, W.jsx)(ce, {
                  placeholder: s
                    ? `Describe the design you want...`
                    : `Start the sandbox to begin designing...`,
                  disabled: !s,
                }),
                (0, W.jsxs)(ne, {
                  children: [
                    (0, W.jsxs)(oe, {
                      children: [
                        (0, W.jsx)(te, {
                          value: R,
                          onValueChange: Ce,
                          disabled: !s,
                        }),
                        (0, W.jsx)(G, { repoId: p, value: N, onChange: P }),
                      ],
                    }),
                    (0, W.jsxs)(`div`, {
                      className: `flex items-center gap-1 text-xs text-muted-foreground`,
                      children: [
                        (0, W.jsx)(`span`, { children: `Designs:` }),
                        [1, 2, 3, 4, 5].map((e) =>
                          (0, W.jsx)(
                            `button`,
                            {
                              type: `button`,
                              onClick: () => ge(e),
                              disabled: !s,
                              className: `w-5 h-5 rounded text-xs font-medium transition-colors disabled:opacity-40 ${I === e ? `bg-primary text-primary-foreground` : `hover:bg-accent`}`,
                              children: e,
                            },
                            e,
                          ),
                        ),
                      ],
                    }),
                    (0, W.jsxs)(`div`, {
                      className: `flex items-center gap-1`,
                      children: [
                        (0, W.jsx)(ee, { disabled: !s }),
                        X
                          ? (0, W.jsx)(O, {
                              size: `icon-sm`,
                              type: `button`,
                              variant: `destructive`,
                              onClick: Ie,
                              title: `Stop Eva`,
                              children: (0, W.jsx)(k, { className: `size-4` }),
                            })
                          : null,
                        (0, W.jsx)(re, {
                          status: j && !d ? `submitted` : void 0,
                          disabled: !s,
                          title: X ? `Queue message` : `Send message`,
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          ],
        })),
      (t[67] = A),
      (t[68] = Ie),
      (t[69] = Re),
      (t[70] = i),
      (t[71] = X),
      (t[72] = s),
      (t[73] = j),
      (t[74] = R),
      (t[75] = I),
      (t[76] = d),
      (t[77] = Be),
      (t[78] = p),
      (t[79] = N),
      (t[80] = Ce),
      (t[81] = ue),
      (t[82] = $))
    : ($ = t[82]);
  let Ze;
  return (
    t[83] !== i ||
    t[84] !== We ||
    t[85] !== Ke ||
    t[86] !== Xe ||
    t[87] !== $ ||
    t[88] !== r
      ? ((Ze = (0, W.jsx)(`div`, {
          className: `flex flex-col min-w-0 h-full`,
          children: (0, W.jsxs)(pe, {
            title: r,
            isArchived: i,
            headerLeft: We,
            headerRight: Ke,
            children: [Xe, $],
          }),
        })),
        (t[83] = i),
        (t[84] = We),
        (t[85] = Ke),
        (t[86] = Xe),
        (t[87] = $),
        (t[88] = r),
        (t[89] = Ze))
      : (Ze = t[89]),
    Ze
  );
}
function Ee(e) {
  return !!e;
}
function De(e) {
  return [e._id, e];
}
var J = [`a`, `b`, `c`];
function Oe(e) {
  return (
    [...e].reverse().find((e) => e.role === `assistant` && e.variations?.length)
      ?.variations ?? []
  );
}
function ke({
  previewUrl: e,
  sandboxRunning: t,
  isArchived: n,
  isExecuting: r,
  latestVariations: i,
  selectedVariationIndex: a,
  isSandboxStarting: o,
  onStartSandbox: s,
  onSelectVariation: c,
}) {
  let [{ tab: l, view: u }, d] = L({ tab: R, view: z }),
    m = Number(l),
    g = (0, U.useRef)(null),
    _ = (0, U.useRef)(new Map()),
    v = (0, U.useRef)(null);
  return (
    (v.current = _.current.get(m) ?? null),
    i.length === 0
      ? (0, W.jsx)(`div`, {
          className: `flex flex-col min-w-0 h-full`,
          children: (0, W.jsx)(`div`, {
            className: `flex items-center justify-center h-full text-muted-foreground`,
            children: (0, W.jsx)(`p`, {
              className: `text-sm`,
              children: r
                ? `Generating designs...`
                : `Send a prompt to generate designs`,
            }),
          }),
        })
      : (0, W.jsx)(`div`, {
          ref: g,
          className: `flex flex-col min-w-0 h-full`,
          children: (0, W.jsxs)(p, {
            value: l,
            onValueChange: (e) => {
              (e === `0` || e === `1` || e === `2`) && d({ tab: e });
            },
            className: `flex flex-col h-full`,
            children: [
              (0, W.jsxs)(`div`, {
                className: `relative flex items-end px-2 pt-1.5 bg-secondary/50`,
                children: [
                  (0, W.jsx)(w, {
                    className: `h-auto gap-0 rounded-none border-0 bg-transparent p-0 shadow-none`,
                    children: i.map((e, t) =>
                      (0, W.jsxs)(
                        f,
                        {
                          value: String(t),
                          className: `relative flex items-center gap-1.5 rounded-none rounded-t-md border border-b-0 px-4 py-1.5 text-sm font-medium data-[state=active]:bg-card data-[state=active]:border-border data-[state=active]:z-10 data-[state=active]:shadow-none data-[state=inactive]:bg-transparent data-[state=inactive]:border-transparent data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:text-foreground data-[state=inactive]:hover:bg-secondary`,
                          children: [`Design `, String.fromCharCode(65 + t)],
                        },
                        t,
                      ),
                    ),
                  }),
                  (0, W.jsx)(`div`, {
                    className: `absolute bottom-0 left-0 right-0 h-px bg-border`,
                  }),
                ],
              }),
              (0, W.jsxs)(`div`, {
                className: `flex items-center gap-1 px-2 py-1.5 shrink-0`,
                children: [
                  (0, W.jsx)(p, {
                    value: u,
                    onValueChange: (e) => {
                      (e === `desktop` || e === `mobile`) && d({ view: e });
                    },
                    children: (0, W.jsxs)(w, {
                      className: `h-8`,
                      children: [
                        (0, W.jsx)(f, {
                          value: `desktop`,
                          className: `text-xs px-2`,
                          children: (0, W.jsx)(j, { size: 14 }),
                        }),
                        (0, W.jsx)(f, {
                          value: `mobile`,
                          className: `text-xs px-2`,
                          children: (0, W.jsx)(H, { size: 14 }),
                        }),
                      ],
                    }),
                  }),
                  (0, W.jsx)(P, {
                    previewUrl: e,
                    iframeRef: v,
                    containerRef: g,
                    port: 3e3,
                    defaultPath: `/design-preview`,
                  }),
                ],
              }),
              i.map((r, i) =>
                (0, W.jsx)(
                  x,
                  {
                    value: String(i),
                    className: `flex-1 m-0 min-h-0 relative bg-muted/30`,
                    children: (0, W.jsx)(`div`, {
                      className: `transition-all duration-150 ${u === `mobile` ? `absolute inset-0 mx-auto my-auto max-h-[100%] aspect-[9/16] border border-border rounded-xl overflow-hidden bg-background` : `absolute inset-0`}`,
                      children: e
                        ? (0, W.jsx)(`iframe`, {
                            ref: (e) => {
                              e ? _.current.set(i, e) : _.current.delete(i);
                            },
                            src: `${e}/design-preview?v=${J[i] ?? `a`}`,
                            className: `w-full h-full border-0`,
                            title: r.label,
                          })
                        : (0, W.jsx)(`div`, {
                            className: `flex items-center justify-center h-full text-muted-foreground`,
                            children: (0, W.jsx)(`div`, {
                              className: `text-center`,
                              children: t
                                ? (0, W.jsx)(h, { size: `md` })
                                : (0, W.jsxs)(W.Fragment, {
                                    children: [
                                      (0, W.jsx)(`p`, {
                                        className: `text-sm mb-2`,
                                        children: n
                                          ? `Sandbox not available for archived sessions`
                                          : `Sandbox not running`,
                                      }),
                                      !n &&
                                        (0, W.jsxs)(O, {
                                          size: `sm`,
                                          variant: `secondary`,
                                          onClick: s,
                                          disabled: o,
                                          children: [
                                            (0, W.jsx)(F, { size: 14 }),
                                            o ? `Starting...` : `Start sandbox`,
                                          ],
                                        }),
                                    ],
                                  }),
                            }),
                          }),
                    }),
                  },
                  i,
                ),
              ),
              (0, W.jsxs)(`div`, {
                className: `flex items-center justify-between gap-2 px-3 py-2 shrink-0`,
                children: [
                  !n &&
                    (0, W.jsxs)(O, {
                      size: `sm`,
                      variant: `secondary`,
                      className: `h-7 text-xs gap-1 shrink-0`,
                      onClick: () => c(m),
                      disabled: a === m,
                      children: [
                        (0, W.jsx)(y, { size: 14 }),
                        a === m ? `Selected` : `Use this design`,
                      ],
                    }),
                  (0, W.jsx)(`p`, {
                    className: `text-xs text-muted-foreground truncate`,
                    children: i[m]?.label,
                  }),
                ],
              }),
            ],
          }),
        })
  );
}
function Ae({ designSessionId: e }) {
  let t = c(o.designSessions.get, { id: e }),
    n = c(o.messages.listByParent, { parentId: e }),
    { repo: r } = B(),
    i = a(o.designSessions.selectVariation),
    l = a(o.designSessions.startSandbox),
    u = a(o.designSessions.stopSandbox),
    d = s(o.daytona.getPreviewUrl),
    [f, p] = (0, U.useState)(!1),
    [m, g] = (0, U.useState)(null),
    _ = t?.status === `starting`,
    v = t?.status === `active`,
    y = (0, U.useCallback)(async () => {
      if (!t?.sandboxId) {
        g(null);
        return;
      }
      try {
        let e = await d({
          sandboxId: t.sandboxId,
          port: t.devPort ?? 3e3,
          repoId: t.repoId,
        });
        (await N(e.url), g(e.url));
      } catch {
        g(null);
      }
    }, [t?.sandboxId, d, t?.repoId]);
  (0, U.useEffect)(() => {
    y();
  }, [y]);
  let b = n ?? [],
    x = b[b.length - 1],
    S = !!x && x.role === `assistant` && !x.content,
    C = (0, U.useMemo)(() => Oe(b), [b]),
    w = async (t) => {
      if (t === `start`) await l({ id: e });
      else {
        p(!0);
        try {
          (await u({ id: e }), g(null));
        } finally {
          p(!1);
        }
      }
    },
    T = (t) => {
      i({ id: e, variationIndex: t });
    };
  if (t === void 0)
    return (0, W.jsx)(`div`, {
      className: `flex items-center justify-center h-full`,
      children: (0, W.jsx)(h, { size: `lg` }),
    });
  if (t === null)
    return (0, W.jsx)(`div`, {
      className: `flex items-center justify-center h-full`,
      children: (0, W.jsx)(`p`, {
        className: `text-muted-foreground`,
        children: `Design session not found`,
      }),
    });
  let E = t.archived === !0;
  return (0, W.jsx)(M, {
    leftPanel: () =>
      (0, W.jsx)(q, {
        designSessionId: e,
        title: t.title,
        isArchived: E,
        isSandboxActive: v,
        isSandboxToggling: _ || f,
        isExecuting: S,
        onSandboxToggle: w,
        repoId: t.repoId,
      }),
    rightPanel: (0, W.jsx)(ke, {
      previewUrl: m,
      sandboxRunning: v,
      isArchived: E,
      isExecuting: S,
      latestVariations: C,
      selectedVariationIndex: t.selectedVariationIndex,
      isSandboxStarting: _,
      onStartSandbox: () => w(`start`),
      onSelectVariation: T,
    }),
    leftDefaultSize: `40%`,
    leftMinWidthPx: 280,
    rightMinWidthPx: 300,
    collapseCookieName: `design-preview-collapsed`,
  });
}
function Y() {
  let e = (0, we.c)(2),
    { id: t } = i.useParams(),
    n = t,
    r;
  return (
    e[0] === n
      ? (r = e[1])
      : ((r = (0, W.jsx)(Ae, { designSessionId: n })), (e[0] = n), (e[1] = r)),
    r
  );
}
export { Y as component };
