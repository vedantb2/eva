import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { c as i, n as a } from "./backend-BVlbQtYj.js";
import { t as o } from "./hooks-B_9i2gKL.js";
import { Zn as s, on as c, sn as l, ur as u } from "./src-DzioQSsH.js";
import { t as d } from "./IconPlus-ZLqtR4Mv.js";
import { t as f } from "./IconTrash-bHTcNORt.js";
import { t as p } from "./PageWrapper-Z5X-C4Rx.js";
import { n as m } from "./RepoContext-Dg6-rqFp.js";
var h = r(),
  g = e(t(), 1),
  _ = n();
function v(e) {
  let t = (0, h.c)(28),
    [n, r] = (0, g.useState)(``),
    [o, s] = (0, g.useState)(``),
    f = i(a.auditCategories.create),
    p;
  t[0] !== f ||
  t[1] !== o ||
  t[2] !== n ||
  t[3] !== e.appId ||
  t[4] !== e.repoId
    ? ((p = async () => {
        !n.trim() ||
          !o.trim() ||
          (await f({
            repoId: e.repoId,
            name: n.trim(),
            description: o.trim(),
            appId: e.appId,
          }),
          r(``),
          s(``));
      }),
      (t[0] = f),
      (t[1] = o),
      (t[2] = n),
      (t[3] = e.appId),
      (t[4] = e.repoId),
      (t[5] = p))
    : (p = t[5]);
  let m = p,
    v;
  t[6] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((v = (0, _.jsx)(`label`, {
        className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
        children: `Name`,
      })),
      (t[6] = v))
    : (v = t[6]);
  let y;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((y = (e) => r(e.target.value)), (t[7] = y))
    : (y = t[7]);
  let b;
  t[8] === n
    ? (b = t[9])
    : ((b = (0, _.jsxs)(`div`, {
        children: [
          v,
          (0, _.jsx)(l, {
            value: n,
            onChange: y,
            placeholder: `e.g. Performance`,
            className: `h-8 text-xs`,
          }),
        ],
      })),
      (t[8] = n),
      (t[9] = b));
  let x;
  t[10] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((x = (0, _.jsx)(`label`, {
        className: `mb-1.5 block text-xs font-medium text-muted-foreground`,
        children: `Description`,
      })),
      (t[10] = x))
    : (x = t[10]);
  let S;
  t[11] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((S = (e) => s(e.target.value)), (t[11] = S))
    : (S = t[11]);
  let C;
  t[12] === o
    ? (C = t[13])
    : ((C = (0, _.jsx)(c, {
        value: o,
        onChange: S,
        placeholder: `Describe what this audit should check for...`,
        className: `text-xs min-h-[60px] resize-none`,
      })),
      (t[12] = o),
      (t[13] = C));
  let w;
  t[14] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((w = (0, _.jsx)(`p`, {
        className: `mt-1 text-[11px] text-muted-foreground`,
        children: `This description is sent to the AI as instructions for what to audit.`,
      })),
      (t[14] = w))
    : (w = t[14]);
  let T;
  t[15] === C
    ? (T = t[16])
    : ((T = (0, _.jsxs)(`div`, { children: [x, C, w] })),
      (t[15] = C),
      (t[16] = T));
  let E;
  t[17] !== o || t[18] !== n
    ? ((E = !n.trim() || !o.trim()), (t[17] = o), (t[18] = n), (t[19] = E))
    : (E = t[19]);
  let D;
  t[20] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((D = (0, _.jsx)(d, { size: 14 })), (t[20] = D))
    : (D = t[20]);
  let O;
  t[21] !== m || t[22] !== E
    ? ((O = (0, _.jsxs)(u, {
        variant: `outline`,
        size: `sm`,
        onClick: m,
        disabled: E,
        className: `w-fit`,
        children: [D, `Add Category`],
      })),
      (t[21] = m),
      (t[22] = E),
      (t[23] = O))
    : (O = t[23]);
  let k;
  return (
    t[24] !== O || t[25] !== b || t[26] !== T
      ? ((k = (0, _.jsxs)(`div`, {
          className: `grid gap-3`,
          children: [b, T, O],
        })),
        (t[24] = O),
        (t[25] = b),
        (t[26] = T),
        (t[27] = k))
      : (k = t[27]),
    k
  );
}
function y() {
  let e = (0, h.c)(29),
    { repo: t, repoId: n } = m(),
    r;
  e[0] === n ? (r = e[1]) : ((r = { repoId: n }), (e[0] = n), (e[1] = r));
  let s = o(a.auditCategories.listByRepo, r),
    c = i(a.auditCategories.toggleEnabled),
    l = i(a.auditCategories.remove);
  if (!s) return null;
  let u, d, f, g, y;
  if (
    e[2] !== s ||
    e[3] !== l ||
    e[4] !== t.parentRepoId ||
    e[5] !== n ||
    e[6] !== c
  ) {
    let r = s.filter(b),
      i = t.parentRepoId !== void 0,
      a = i ? s.filter((e) => e.appId === n) : [];
    ((u = p), (y = `Audits`), (d = `space-y-6`));
    let o;
    e[12] === Symbol.for(`react.memo_cache_sentinel`)
      ? ((o = (0, _.jsxs)(`div`, {
          children: [
            (0, _.jsx)(`h3`, {
              className: `text-sm font-medium`,
              children: `Repo-level Audits`,
            }),
            (0, _.jsx)(`p`, {
              className: `text-[11px] text-muted-foreground mt-0.5`,
              children: `These audits run for all tasks across the repo and all apps.`,
            }),
          ],
        })),
        (e[12] = o))
      : (o = e[12]);
    let m =
        r.length > 0 &&
        (0, _.jsx)(`div`, {
          className: `grid gap-2`,
          children: r.map((e) =>
            (0, _.jsx)(
              x,
              {
                category: e,
                onToggle: (t) => c({ id: e._id, enabled: t }),
                onRemove: () => l({ id: e._id }),
              },
              e._id,
            ),
          ),
        }),
      h;
    e[13] === r
      ? (h = e[14])
      : ((h =
          r.length === 0 &&
          (0, _.jsx)(`p`, {
            className: `text-xs text-muted-foreground text-center py-6`,
            children: `No audit categories configured yet.`,
          })),
        (e[13] = r),
        (e[14] = h));
    let S = t.parentRepoId ?? n,
      C;
    (e[15] === S
      ? (C = e[16])
      : ((C = (0, _.jsx)(v, { repoId: S })), (e[15] = S), (e[16] = C)),
      e[17] !== m || e[18] !== h || e[19] !== C
        ? ((f = (0, _.jsxs)(`div`, {
            className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
            children: [o, m, h, C],
          })),
          (e[17] = m),
          (e[18] = h),
          (e[19] = C),
          (e[20] = f))
        : (f = e[20]),
      (g =
        i &&
        (0, _.jsxs)(`div`, {
          className: `rounded-lg bg-muted/40 p-3 space-y-4 sm:p-4`,
          children: [
            (0, _.jsxs)(`div`, {
              children: [
                (0, _.jsx)(`h3`, {
                  className: `text-sm font-medium`,
                  children: `App-specific Audits`,
                }),
                (0, _.jsx)(`p`, {
                  className: `text-[11px] text-muted-foreground mt-0.5`,
                  children: `Audits that only run for this app.`,
                }),
              ],
            }),
            a.length > 0 &&
              (0, _.jsx)(`div`, {
                className: `grid gap-2`,
                children: a.map((e) =>
                  (0, _.jsx)(
                    x,
                    {
                      category: e,
                      onToggle: (t) => c({ id: e._id, enabled: t }),
                      onRemove: () => l({ id: e._id }),
                    },
                    e._id,
                  ),
                ),
              }),
            (0, _.jsx)(v, { repoId: n, appId: n }),
          ],
        })),
      (e[2] = s),
      (e[3] = l),
      (e[4] = t.parentRepoId),
      (e[5] = n),
      (e[6] = c),
      (e[7] = u),
      (e[8] = d),
      (e[9] = f),
      (e[10] = g),
      (e[11] = y));
  } else ((u = e[7]), (d = e[8]), (f = e[9]), (g = e[10]), (y = e[11]));
  let S;
  e[21] !== d || e[22] !== f || e[23] !== g
    ? ((S = (0, _.jsxs)(`div`, { className: d, children: [f, g] })),
      (e[21] = d),
      (e[22] = f),
      (e[23] = g),
      (e[24] = S))
    : (S = e[24]);
  let C;
  return (
    e[25] !== u || e[26] !== y || e[27] !== S
      ? ((C = (0, _.jsx)(u, { title: y, children: S })),
        (e[25] = u),
        (e[26] = y),
        (e[27] = S),
        (e[28] = C))
      : (C = e[28]),
    C
  );
}
function b(e) {
  return e.appId === void 0;
}
function x(e) {
  let t = (0, h.c)(19),
    { category: n, onToggle: r, onRemove: i } = e,
    a;
  t[0] === r ? (a = t[1]) : ((a = (e) => r(e === !0)), (t[0] = r), (t[1] = a));
  let o;
  t[2] !== n.enabled || t[3] !== a
    ? ((o = (0, _.jsx)(s, {
        checked: n.enabled,
        onCheckedChange: a,
        className: `mt-0.5`,
      })),
      (t[2] = n.enabled),
      (t[3] = a),
      (t[4] = o))
    : (o = t[4]);
  let c;
  t[5] === n.name
    ? (c = t[6])
    : ((c = (0, _.jsx)(`p`, {
        className: `text-xs font-medium`,
        children: n.name,
      })),
      (t[5] = n.name),
      (t[6] = c));
  let l;
  t[7] === n.description
    ? (l = t[8])
    : ((l = (0, _.jsx)(`p`, {
        className: `text-[11px] text-muted-foreground mt-0.5 line-clamp-2`,
        children: n.description,
      })),
      (t[7] = n.description),
      (t[8] = l));
  let u;
  t[9] !== c || t[10] !== l
    ? ((u = (0, _.jsxs)(`div`, {
        className: `flex-1 min-w-0`,
        children: [c, l],
      })),
      (t[9] = c),
      (t[10] = l),
      (t[11] = u))
    : (u = t[11]);
  let d;
  t[12] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((d = (0, _.jsx)(f, { size: 14 })), (t[12] = d))
    : (d = t[12]);
  let p;
  t[13] === i
    ? (p = t[14])
    : ((p = (0, _.jsx)(`button`, {
        onClick: i,
        className: `text-muted-foreground hover:text-destructive transition-colors p-1`,
        children: d,
      })),
      (t[13] = i),
      (t[14] = p));
  let m;
  return (
    t[15] !== o || t[16] !== u || t[17] !== p
      ? ((m = (0, _.jsxs)(`div`, {
          className: `flex items-start gap-3 rounded-md bg-muted/40 p-3`,
          children: [o, u, p],
        })),
        (t[15] = o),
        (t[16] = u),
        (t[17] = p),
        (t[18] = m))
      : (m = t[18]),
    m
  );
}
var S = y;
export { S as component };
