import { t as e } from "./jsx-runtime-bxCDpROR.js";
import { t } from "./useNavigate-B8SeWprX.js";
import { T as n, a as r } from "./index-CuMF3NGg.js";
import { n as i } from "./backend-BVlbQtYj.js";
import { t as a } from "./hooks-B_9i2gKL.js";
import { Cr as o, Kt as s } from "./src-DHCpG1Q-.js";
import { t as c } from "./IconChevronLeft-w8GxvfTC.js";
import { t as l } from "./TaskStatusBadge-Dnip6s2Y.js";
import { t as u } from "./TaskDetailInline-sp3xARaq.js";
import { S as d, u as f } from "./search-params-C2OhCtfp.js";
import { t as p } from "./PageWrapper-CdtdiTMb.js";
import { n as m } from "./RepoContext-D9QMbL6d.js";
var h = n(),
  g = e();
function _() {
  let e = (0, h.c)(57),
    { taskId: n } = r.useParams(),
    _ = t(),
    { basePath: y, repo: b } = m(),
    [x] = d(`view`, f),
    S = n,
    C;
  e[0] === b._id
    ? (C = e[1])
    : ((C = { repoId: b._id }), (e[0] = b._id), (e[1] = C));
  let w = a(i.agentTasks.getAllTasks, C),
    T;
  bb0: {
    if (!w) {
      T = void 0;
      break bb0;
    }
    let t;
    if (e[2] !== w || e[3] !== S) {
      let n;
      (e[5] === S
        ? (n = e[6])
        : ((n = (e) => e._id === S), (e[5] = S), (e[6] = n)),
        (t = w.find(n)),
        (e[2] = w),
        (e[3] = S),
        (e[4] = t));
    } else t = e[4];
    T = t;
  }
  let E = T,
    D;
  bb1: {
    if (!w) {
      let t;
      (e[7] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = []), (e[7] = t))
        : (t = e[7]),
        (D = t));
      break bb1;
    }
    let t;
    if (e[8] !== w) {
      let n = new Map();
      for (let e of w) {
        let t = n.get(e.status) ?? [];
        (t.push(e), n.set(e.status, t));
      }
      t = [];
      for (let e of l) {
        let r = n.get(e);
        r && (r.sort(v), t.push(...r));
      }
      ((e[8] = w), (e[9] = t));
    } else t = e[9];
    D = t;
  }
  let O = D,
    k;
  bb2: {
    if (O.length === 0) {
      let t;
      (e[10] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = { prevTaskId: null, nextTaskId: null }), (e[10] = t))
        : (t = e[10]),
        (k = t));
      break bb2;
    }
    let t = O.findIndex((e) => e._id === S);
    if (t === -1) {
      let t;
      (e[11] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = { prevTaskId: null, nextTaskId: null }), (e[11] = t))
        : (t = e[11]),
        (k = t));
      break bb2;
    }
    let n = t > 0 ? O[t - 1]._id : null,
      r = t < O.length - 1 ? O[t + 1]._id : null,
      i;
    (e[12] !== n || e[13] !== r
      ? ((i = { prevTaskId: n, nextTaskId: r }),
        (e[12] = n),
        (e[13] = r),
        (e[14] = i))
      : (i = e[14]),
      (k = i));
  }
  let { prevTaskId: A, nextTaskId: j } = k,
    M = x === `kanban` ? `` : `?view=${x}`,
    N;
  e[15] !== y || e[16] !== _ || e[17] !== M
    ? ((N = () => {
        _({ to: `${y}/quick-tasks${M}` });
      }),
      (e[15] = y),
      (e[16] = _),
      (e[17] = M),
      (e[18] = N))
    : (N = e[18]);
  let P = N,
    F;
  e[19] !== y || e[20] !== _ || e[21] !== A || e[22] !== M
    ? ((F = () => {
        A && _({ to: `${y}/quick-tasks/${A}${M}` });
      }),
      (e[19] = y),
      (e[20] = _),
      (e[21] = A),
      (e[22] = M),
      (e[23] = F))
    : (F = e[23]);
  let I = F,
    L;
  e[24] !== y || e[25] !== _ || e[26] !== j || e[27] !== M
    ? ((L = () => {
        j && _({ to: `${y}/quick-tasks/${j}${M}` });
      }),
      (e[24] = y),
      (e[25] = _),
      (e[26] = j),
      (e[27] = M),
      (e[28] = L))
    : (L = e[28]);
  let R = L;
  if (w === void 0) {
    let t;
    return (
      e[29] === Symbol.for(`react.memo_cache_sentinel`)
        ? ((t = (0, g.jsx)(`div`, {
            className: `flex h-full flex-1 items-center justify-center`,
            children: (0, g.jsx)(s, {}),
          })),
          (e[29] = t))
        : (t = e[29]),
      t
    );
  }
  let z;
  e[30] === P
    ? (z = e[31])
    : ((z = (0, g.jsx)(`button`, {
        onClick: P,
        className: `text-muted-foreground hover:text-foreground transition-colors font-semibold`,
        children: `Quick Tasks`,
      })),
      (e[30] = P),
      (e[31] = z));
  let B;
  e[32] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((B = (0, g.jsx)(o, {
        size: 14,
        className: `text-muted-foreground/50 flex-shrink-0`,
      })),
      (e[32] = B))
    : (B = e[32]);
  let V = E?.taskNumber ? `#${E.taskNumber}` : ``,
    H = E?.title ? ` ${E.title}` : ``,
    U;
  e[33] !== H || e[34] !== V
    ? ((U = (0, g.jsxs)(`span`, {
        className: `truncate font-semibold`,
        children: [V, H],
      })),
      (e[33] = H),
      (e[34] = V),
      (e[35] = U))
    : (U = e[35]);
  let W;
  e[36] !== U || e[37] !== z
    ? ((W = (0, g.jsxs)(`div`, {
        className: `flex items-center gap-1.5 text-base sm:text-lg md:text-xl`,
        children: [z, B, U],
      })),
      (e[36] = U),
      (e[37] = z),
      (e[38] = W))
    : (W = e[38]);
  let G = !A,
    K;
  e[39] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((K = (0, g.jsx)(c, { size: 16 })), (e[39] = K))
    : (K = e[39]);
  let q;
  e[40] !== I || e[41] !== G
    ? ((q = (0, g.jsx)(`button`, {
        onClick: I,
        disabled: G,
        className: `p-1 rounded hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none`,
        title: `Previous task`,
        children: K,
      })),
      (e[40] = I),
      (e[41] = G),
      (e[42] = q))
    : (q = e[42]);
  let J = !j,
    Y;
  e[43] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((Y = (0, g.jsx)(o, { size: 16 })), (e[43] = Y))
    : (Y = e[43]);
  let X;
  e[44] !== R || e[45] !== J
    ? ((X = (0, g.jsx)(`button`, {
        onClick: R,
        disabled: J,
        className: `p-1 rounded hover:bg-muted/60 transition-colors disabled:opacity-30 disabled:pointer-events-none`,
        title: `Next task`,
        children: Y,
      })),
      (e[44] = R),
      (e[45] = J),
      (e[46] = X))
    : (X = e[46]);
  let Z;
  e[47] !== q || e[48] !== X
    ? ((Z = (0, g.jsxs)(`div`, {
        className: `flex items-center gap-0.5`,
        children: [q, X],
      })),
      (e[47] = q),
      (e[48] = X),
      (e[49] = Z))
    : (Z = e[49]);
  let Q;
  e[50] !== P || e[51] !== S
    ? ((Q = (0, g.jsx)(`div`, {
        className: `relative flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden p-3 pt-0`,
        children: (0, g.jsx)(`div`, {
          className: `flex-1 min-h-0 overflow-hidden`,
          children: (0, g.jsx)(u, { onClose: P, taskId: S }, S),
        }),
      })),
      (e[50] = P),
      (e[51] = S),
      (e[52] = Q))
    : (Q = e[52]);
  let $;
  return (
    e[53] !== W || e[54] !== Z || e[55] !== Q
      ? (($ = (0, g.jsx)(p, {
          title: W,
          fillHeight: !0,
          childPadding: !1,
          headerRight: Z,
          children: Q,
        })),
        (e[53] = W),
        (e[54] = Z),
        (e[55] = Q),
        (e[56] = $))
      : ($ = e[56]),
    $
  );
}
function v(e, t) {
  return t.createdAt - e.createdAt;
}
var y = _;
export { y as component };
