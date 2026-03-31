import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-DSqEo2z3.js";
import { cr as i, ur as a } from "./src-DzioQSsH.js";
import { t as o } from "./createReactComponent-C2GWxX5y.js";
import { n as s } from "./dates-DHZmrCUU.js";
var c = o(`outline`, `calendar-clock`, `CalendarClock`, [
    [
      `path`,
      {
        d: `M10.5 21h-4.5a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v3`,
        key: `svg-0`,
      },
    ],
    [`path`, { d: `M16 3v4`, key: `svg-1` }],
    [`path`, { d: `M8 3v4`, key: `svg-2` }],
    [`path`, { d: `M4 11h10`, key: `svg-3` }],
    [`path`, { d: `M14 18a4 4 0 1 0 8 0a4 4 0 1 0 -8 0`, key: `svg-4` }],
    [`path`, { d: `M18 16.5v1.5l.5 .5`, key: `svg-5` }],
  ]),
  l = o(`outline`, `tags`, `Tags`, [
    [
      `path`,
      {
        d: `M3 8v4.172a2 2 0 0 0 .586 1.414l5.71 5.71a2.41 2.41 0 0 0 3.408 0l3.592 -3.592a2.41 2.41 0 0 0 0 -3.408l-5.71 -5.71a2 2 0 0 0 -1.414 -.586h-4.172a2 2 0 0 0 -2 2`,
        key: `svg-0`,
      },
    ],
    [
      `path`,
      {
        d: `M18 19l1.592 -1.592a4.82 4.82 0 0 0 0 -6.816l-4.592 -4.592`,
        key: `svg-1`,
      },
    ],
    [`path`, { d: `M7 10h-.01`, key: `svg-2` }],
  ]),
  u = r(),
  d = e(t(), 1),
  f = n();
function p(e, t) {
  if (!e) return null;
  let n = t.split(`:`);
  if (n.length < 2) return null;
  let [r, i] = n.map(Number);
  if (isNaN(r) || isNaN(i)) return null;
  let a = s(e).hour(r).minute(i).second(0).millisecond(0);
  return a.valueOf() <= Date.now() ? null : a.valueOf();
}
function m(e) {
  let t = (0, u.c)(12),
    n;
  t[0] === e
    ? (n = t[1])
    : ((n = e ? new Date(e) : new Date()), (t[0] = e), (t[1] = n));
  let [r, i] = (0, d.useState)(n),
    a;
  t[2] === e
    ? (a = t[3])
    : ((a = e ? s(e).format(`HH:mm`) : s().format(`HH:mm`)),
      (t[2] = e),
      (t[3] = a));
  let [o, c] = (0, d.useState)(a),
    l;
  t[4] !== r || t[5] !== o
    ? ((l = p(r, o)), (t[4] = r), (t[5] = o), (t[6] = l))
    : (l = t[6]);
  let f = l,
    m;
  t[7] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((m = (e) => {
        (i(e ? new Date(e) : new Date()),
          c(e ? s(e).format(`HH:mm`) : s().format(`HH:mm`)));
      }),
      (t[7] = m))
    : (m = t[7]);
  let h = m,
    g;
  return (
    t[8] !== r || t[9] !== o || t[10] !== f
      ? ((g = {
          selectedDate: r,
          setSelectedDate: i,
          time: o,
          setTime: c,
          timestamp: f,
          reset: h,
        }),
        (t[8] = r),
        (t[9] = o),
        (t[10] = f),
        (t[11] = g))
      : (g = t[11]),
    g
  );
}
function h(e) {
  let t = (0, u.c)(19),
    {
      selectedDate: n,
      onDateChange: r,
      time: a,
      onTimeChange: o,
      timestamp: c,
      calendarClassName: l,
      showPreview: d,
    } = e,
    p = l === void 0 ? `border-0 shadow-none` : l,
    m = d === void 0 ? !0 : d,
    h;
  t[0] === Symbol.for(`react.memo_cache_sentinel`)
    ? ((h = { before: new Date() }), (t[0] = h))
    : (h = t[0]);
  let g;
  t[1] !== p || t[2] !== r || t[3] !== n
    ? ((g = (0, f.jsx)(i, {
        mode: `single`,
        selected: n,
        onSelect: r,
        disabled: h,
        className: p,
      })),
      (t[1] = p),
      (t[2] = r),
      (t[3] = n),
      (t[4] = g))
    : (g = t[4]);
  let _;
  t[5] === o
    ? (_ = t[6])
    : ((_ = (e) => o(e.target.value)), (t[5] = o), (t[6] = _));
  let v;
  t[7] !== _ || t[8] !== a
    ? ((v = (0, f.jsxs)(`label`, {
        className: `flex items-center gap-2 text-sm text-muted-foreground`,
        children: [
          `Time`,
          (0, f.jsx)(`input`, {
            type: `time`,
            value: a,
            onChange: _,
            className: `flex-1 rounded-md border bg-background px-2 py-1 text-sm`,
          }),
        ],
      })),
      (t[7] = _),
      (t[8] = a),
      (t[9] = v))
    : (v = t[9]);
  let y;
  t[10] !== m || t[11] !== c
    ? ((y =
        m &&
        c &&
        (0, f.jsxs)(`p`, {
          className: `text-xs text-muted-foreground`,
          children: [
            `Scheduled for`,
            ` `,
            (0, f.jsx)(`span`, {
              className: `font-medium text-foreground`,
              children: s(c).format(`MMM D, h:mm A`),
            }),
          ],
        })),
      (t[10] = m),
      (t[11] = c),
      (t[12] = y))
    : (y = t[12]);
  let b;
  t[13] !== v || t[14] !== y
    ? ((b = (0, f.jsxs)(`div`, {
        className: `border-t px-3 py-2 flex flex-col gap-2`,
        children: [v, y],
      })),
      (t[13] = v),
      (t[14] = y),
      (t[15] = b))
    : (b = t[15]);
  let x;
  return (
    t[16] !== g || t[17] !== b
      ? ((x = (0, f.jsxs)(f.Fragment, { children: [g, b] })),
        (t[16] = g),
        (t[17] = b),
        (t[18] = x))
      : (x = t[18]),
    x
  );
}
function g(e) {
  let t = (0, u.c)(7),
    {
      isScheduled: n,
      timestamp: r,
      onSchedule: i,
      onRemove: o,
      scheduleLabel: s,
      updateLabel: c,
    } = e,
    l = s === void 0 ? `Schedule` : s,
    d = c === void 0 ? `Update` : c,
    p;
  return (
    t[0] !== n ||
    t[1] !== o ||
    t[2] !== i ||
    t[3] !== l ||
    t[4] !== r ||
    t[5] !== d
      ? ((p = (0, f.jsx)(`div`, {
          className: `flex gap-2 px-3 pb-2`,
          children: n
            ? (0, f.jsxs)(f.Fragment, {
                children: [
                  o &&
                    (0, f.jsx)(a, {
                      size: `sm`,
                      variant: `destructive`,
                      onClick: o,
                      className: `flex-1`,
                      children: `Remove`,
                    }),
                  (0, f.jsx)(a, {
                    size: `sm`,
                    onClick: i,
                    disabled: !r,
                    className: `flex-1`,
                    children: d,
                  }),
                ],
              })
            : (0, f.jsx)(a, {
                size: `sm`,
                onClick: i,
                disabled: !r,
                className: `w-full`,
                children: l,
              }),
        })),
        (t[0] = n),
        (t[1] = o),
        (t[2] = i),
        (t[3] = l),
        (t[4] = r),
        (t[5] = d),
        (t[6] = p))
      : (p = t[6]),
    p
  );
}
export { c as a, l as i, h as n, m as r, g as t };
