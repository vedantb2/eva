import { o as e, t } from "./chunk-CFjPhJqf.js";
import { v as n } from "./src-BAB06iur.js";
var r = t((e, t) => {
    (function (n, r) {
      typeof e == `object` && t !== void 0
        ? (t.exports = r())
        : typeof define == `function` && define.amd
          ? define(r)
          : ((n =
              typeof globalThis < `u`
                ? globalThis
                : n || self).dayjs_plugin_relativeTime = r());
    })(e, function () {
      return function (e, t, n) {
        e ||= {};
        var r = t.prototype,
          i = {
            future: `in %s`,
            past: `%s ago`,
            s: `a few seconds`,
            m: `a minute`,
            mm: `%d minutes`,
            h: `an hour`,
            hh: `%d hours`,
            d: `a day`,
            dd: `%d days`,
            M: `a month`,
            MM: `%d months`,
            y: `a year`,
            yy: `%d years`,
          };
        function a(e, t, n, i) {
          return r.fromToBase(e, t, n, i);
        }
        ((n.en.relativeTime = i),
          (r.fromToBase = function (t, r, a, o, s) {
            for (
              var c,
                l,
                u,
                d = a.$locale().relativeTime || i,
                f = e.thresholds || [
                  { l: `s`, r: 44, d: `second` },
                  { l: `m`, r: 89 },
                  { l: `mm`, r: 44, d: `minute` },
                  { l: `h`, r: 89 },
                  { l: `hh`, r: 21, d: `hour` },
                  { l: `d`, r: 35 },
                  { l: `dd`, r: 25, d: `day` },
                  { l: `M`, r: 45 },
                  { l: `MM`, r: 10, d: `month` },
                  { l: `y`, r: 17 },
                  { l: `yy`, d: `year` },
                ],
                p = f.length,
                m = 0;
              m < p;
              m += 1
            ) {
              var h = f[m];
              h.d && (c = o ? n(t).diff(a, h.d, !0) : a.diff(t, h.d, !0));
              var g = (e.rounding || Math.round)(Math.abs(c));
              if (((u = c > 0), g <= h.r || !h.r)) {
                g <= 1 && m > 0 && (h = f[m - 1]);
                var _ = d[h.l];
                (s && (g = s(`` + g)),
                  (l =
                    typeof _ == `string`
                      ? _.replace(`%d`, g)
                      : _(g, r, h.l, u)));
                break;
              }
            }
            if (r) return l;
            var v = u ? d.future : d.past;
            return typeof v == `function` ? v(l) : v.replace(`%s`, l);
          }),
          (r.to = function (e, t) {
            return a(e, t, this, !0);
          }),
          (r.from = function (e, t) {
            return a(e, t, this);
          }));
        var o = function (e) {
          return e.$u ? n.utc() : n();
        };
        ((r.toNow = function (e) {
          return this.to(o(this), e);
        }),
          (r.fromNow = function (e) {
            return this.from(o(this), e);
          }));
      };
    });
  }),
  i = e(n(), 1),
  a = e(r(), 1);
i.default.extend(a.default);
function o(e) {
  let t = (0, i.default)(),
    n = (0, i.default)(e),
    r = t.diff(n, `second`);
  if (r < 60) return `${r}s`;
  let a = t.diff(n, `minute`);
  if (a < 60) return `${a}m`;
  let o = t.diff(n, `hour`);
  if (o < 24) return `${o}h`;
  let s = t.diff(n, `day`);
  if (s < 30) return `${s}d`;
  let c = t.diff(n, `month`);
  return c < 12 ? `${c}mo` : `${t.diff(n, `year`)}y`;
}
var s = i.default;
export { s as n, o as t };
