import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
import {
  _ as n,
  g as r,
  h as i,
  m as a,
  p as o,
  v as s,
} from "./index-CuMF3NGg.js";
var c = e(t(), 1);
function l() {
  if (typeof window > `u` || !window.GestureEvent) return 50;
  try {
    let e = navigator.userAgent?.match(/version\/([\d\.]+) safari/i);
    return parseFloat(e[1]) >= 17 ? 120 : 320;
  } catch {
    return 320;
  }
}
function u(e) {
  return { method: `throttle`, timeMs: e };
}
var d = u(l());
function f(e) {
  return e === null || (Array.isArray(e) && e.length === 0);
}
function p(e, t, n) {
  if (typeof e == `string`) n.set(t, e);
  else {
    n.delete(t);
    for (let r of e) n.append(t, r);
    n.has(t) || n.set(t, ``);
  }
  return n;
}
function m() {
  let e = new Map();
  return {
    on(t, n) {
      let r = e.get(t) || [];
      return (r.push(n), e.set(t, r), () => this.off(t, n));
    },
    off(t, n) {
      let r = e.get(t);
      r &&
        e.set(
          t,
          r.filter((e) => e !== n),
        );
    },
    emit(t, n) {
      e.get(t)?.forEach((e) => e(n));
    },
  };
}
function h(e, t, n) {
  function r() {
    (e(), n.removeEventListener(`abort`, a));
  }
  let i = setTimeout(r, t);
  function a() {
    (clearTimeout(i), n.removeEventListener(`abort`, a));
  }
  n.addEventListener(`abort`, a);
}
function g() {
  let e = Promise;
  if (Promise.hasOwnProperty(`withResolvers`)) return Promise.withResolvers();
  let t = () => {},
    n = () => {};
  return {
    promise: new e((e, r) => {
      ((t = e), (n = r));
    }),
    resolve: t,
    reject: n,
  };
}
function _(e, t) {
  let n = t;
  for (let t = e.length - 1; t >= 0; t--) {
    let r = e[t];
    if (!r) continue;
    let i = n;
    n = () => r(i);
  }
  n();
}
function v() {
  return new URLSearchParams(location.search);
}
var y = class {
    updateMap = new Map();
    options = { history: `replace`, scroll: !1, shallow: !0 };
    timeMs = d.timeMs;
    transitions = new Set();
    resolvers = null;
    controller = null;
    lastFlushedAt = 0;
    resetQueueOnNextPush = !1;
    push({ key: e, query: t, options: n }, r = d.timeMs) {
      ((this.resetQueueOnNextPush &&= (this.reset(), !1)),
        o(`[nuqs gtq] Enqueueing %s=%s %O`, e, t, n),
        this.updateMap.set(e, t),
        n.history === `push` && (this.options.history = `push`),
        n.scroll && (this.options.scroll = !0),
        n.shallow === !1 && (this.options.shallow = !1),
        n.startTransition && this.transitions.add(n.startTransition),
        (!Number.isFinite(this.timeMs) || r > this.timeMs) &&
          (this.timeMs = r));
    }
    getQueuedQuery(e) {
      return this.updateMap.get(e);
    }
    getPendingPromise({ getSearchParamsSnapshot: e = v }) {
      return this.resolvers?.promise ?? Promise.resolve(e());
    }
    flush({ getSearchParamsSnapshot: e = v, rateLimitFactor: t = 1, ...n }, r) {
      if (
        ((this.controller ??= new AbortController()),
        !Number.isFinite(this.timeMs))
      )
        return (
          o(`[nuqs gtq] Skipping flush due to throttleMs=Infinity`),
          Promise.resolve(e())
        );
      if (this.resolvers) return this.resolvers.promise;
      this.resolvers = g();
      let i = () => {
        this.lastFlushedAt = performance.now();
        let [t, i] = this.applyPendingUpdates(
          {
            ...n,
            autoResetQueueOnUpdate: n.autoResetQueueOnUpdate ?? !0,
            getSearchParamsSnapshot: e,
          },
          r,
        );
        (i === null
          ? (this.resolvers.resolve(t), (this.resetQueueOnNextPush = !0))
          : this.resolvers.reject(t),
          (this.resolvers = null));
      };
      return (
        h(
          () => {
            let e = performance.now() - this.lastFlushedAt,
              n = this.timeMs,
              r = t * Math.max(0, n - e);
            (o(
              `[nuqs gtq] Scheduling flush in %f ms. Throttled at %f ms (x%f)`,
              r,
              n,
              t,
            ),
              r === 0 ? i() : h(i, r, this.controller.signal));
          },
          0,
          this.controller.signal,
        ),
        this.resolvers.promise
      );
    }
    abort() {
      return (
        this.controller?.abort(),
        (this.controller = new AbortController()),
        this.resolvers?.resolve(new URLSearchParams()),
        (this.resolvers = null),
        this.reset()
      );
    }
    reset() {
      let e = Array.from(this.updateMap.keys());
      return (
        o(
          `[nuqs gtq] Resetting queue %s`,
          JSON.stringify(Object.fromEntries(this.updateMap)),
        ),
        this.updateMap.clear(),
        this.transitions.clear(),
        (this.options = { history: `replace`, scroll: !1, shallow: !0 }),
        (this.timeMs = d.timeMs),
        e
      );
    }
    applyPendingUpdates(e, t) {
      let { updateUrl: n, getSearchParamsSnapshot: r } = e,
        i = r();
      if (
        (o(
          `[nuqs gtq] Applying %d pending update(s) on top of %s`,
          this.updateMap.size,
          i.toString(),
        ),
        this.updateMap.size === 0)
      )
        return [i, null];
      let s = Array.from(this.updateMap.entries()),
        c = { ...this.options },
        l = Array.from(this.transitions);
      (e.autoResetQueueOnUpdate && this.reset(),
        o(`[nuqs gtq] Flushing queue %O with options %O`, s, c));
      for (let [e, t] of s) t === null ? i.delete(e) : (i = p(t, e, i));
      t && (i = t(i));
      try {
        return (
          _(l, () => {
            n(i, c);
          }),
          [i, null]
        );
      } catch (e) {
        return (console.error(a(429), s.map(([e]) => e).join(), e), [i, e]);
      }
    }
  },
  b = new y();
function x(e, t, n) {
  let r = (0, c.useCallback)(() => {
      let t = Object.fromEntries(e.map((e) => [e, n(e)]));
      return [JSON.stringify(t), t];
    }, [e.join(`,`), n]),
    i = (0, c.useRef)(null);
  return (
    i.current === null && (i.current = r()),
    (0, c.useSyncExternalStore)(
      (0, c.useCallback)(
        (n) => {
          let r = e.map((e) => t(e, n));
          return () => r.forEach((e) => e());
        },
        [e.join(`,`), t],
      ),
      () => {
        let [e, t] = r();
        return i.current[0] === e ? i.current[1] : ((i.current = [e, t]), t);
      },
      () => i.current[1],
    )
  );
}
var S = class {
    callback;
    resolvers = g();
    controller = new AbortController();
    queuedValue = void 0;
    constructor(e) {
      this.callback = e;
    }
    abort() {
      (this.controller.abort(), (this.queuedValue = void 0));
    }
    push(e, t) {
      return (
        (this.queuedValue = e),
        this.controller.abort(),
        (this.controller = new AbortController()),
        h(
          () => {
            let t = this.resolvers;
            try {
              o(`[nuqs dq] Flushing debounce queue`, e);
              let n = this.callback(e);
              (o(`[nuqs dq] Reset debounce queue %O`, this.queuedValue),
                (this.queuedValue = void 0),
                (this.resolvers = g()),
                n.then((e) => t.resolve(e)).catch((e) => t.reject(e)));
            } catch (e) {
              ((this.queuedValue = void 0), t.reject(e));
            }
          },
          t,
          this.controller.signal,
        ),
        this.resolvers.promise
      );
    }
  },
  C = new (class {
    throttleQueue;
    queues = new Map();
    queuedQuerySync = m();
    constructor(e = new y()) {
      this.throttleQueue = e;
    }
    useQueuedQueries(e) {
      return x(
        e,
        (e, t) => this.queuedQuerySync.on(e, t),
        (e) => this.getQueuedQuery(e),
      );
    }
    push(e, t, n, r) {
      if (!Number.isFinite(t)) {
        let e = n.getSearchParamsSnapshot ?? v;
        return Promise.resolve(e());
      }
      let i = e.key;
      if (!this.queues.has(i)) {
        o("[nuqs dqc] Creating debounce queue for `%s`", i);
        let e = new S(
          (e) => (
            this.throttleQueue.push(e),
            this.throttleQueue.flush(n, r).finally(() => {
              (this.queues.get(e.key)?.queuedValue === void 0 &&
                (o("[nuqs dqc] Cleaning up empty queue for `%s`", e.key),
                this.queues.delete(e.key)),
                this.queuedQuerySync.emit(e.key));
            })
          ),
        );
        this.queues.set(i, e);
      }
      o(`[nuqs dqc] Enqueueing debounce update %O`, e);
      let a = this.queues.get(i).push(e, t);
      return (this.queuedQuerySync.emit(i), a);
    }
    abort(e) {
      let t = this.queues.get(e);
      return t
        ? (o(
            `[nuqs dqc] Aborting debounce queue %s=%s`,
            e,
            t.queuedValue?.query,
          ),
          this.queues.delete(e),
          t.abort(),
          this.queuedQuerySync.emit(e),
          (e) => (e.then(t.resolvers.resolve, t.resolvers.reject), e))
        : (e) => e;
    }
    abortAll() {
      for (let [e, t] of this.queues.entries())
        (o(`[nuqs dqc] Aborting debounce queue %s=%s`, e, t.queuedValue?.query),
          t.abort(),
          t.resolvers.resolve(new URLSearchParams()),
          this.queuedQuerySync.emit(e));
      this.queues.clear();
    }
    getQueuedQuery(e) {
      let t = this.queues.get(e)?.queuedValue?.query;
      return t === void 0 ? this.throttleQueue.getQueuedQuery(e) : t;
    }
  })(b);
function w(e, t) {
  return e === t
    ? !0
    : e === null ||
        t === null ||
        typeof e == `string` ||
        typeof t == `string` ||
        e.length !== t.length
      ? !1
      : e.every((e, n) => e === t[n]);
}
function T(e, t, n) {
  try {
    return e(t);
  } catch (e) {
    return (
      s(
        "[nuqs] Error while parsing value `%s`: %O" +
          (n ? " (for key `%s`)" : ``),
        t,
        e,
        n,
      ),
      null
    );
  }
}
function E(e) {
  function t(t) {
    if (t === void 0) return null;
    let n = ``;
    if (Array.isArray(t)) {
      if (t[0] === void 0) return null;
      n = t[0];
    }
    return (typeof t == `string` && (n = t), T(e.parse, n));
  }
  return {
    type: `single`,
    eq: (e, t) => e === t,
    ...e,
    parseServerSide: t,
    withDefault(e) {
      return {
        ...this,
        defaultValue: e,
        parseServerSide(n) {
          return t(n) ?? e;
        },
      };
    },
    withOptions(e) {
      return { ...this, ...e };
    },
  };
}
var D = E({ parse: (e) => e, serialize: String }),
  O = E({
    parse: (e) => {
      let t = parseInt(e);
      return t == t ? t : null;
    },
    serialize: (e) => `` + Math.round(e),
  });
(E({
  parse: (e) => {
    let t = parseInt(e);
    return t == t ? t - 1 : null;
  },
  serialize: (e) => `` + Math.round(e + 1),
}),
  E({
    parse: (e) => {
      let t = parseInt(e, 16);
      return t == t ? t : null;
    },
    serialize: (e) => {
      let t = Math.round(e).toString(16);
      return (t.length & 1 ? `0` : ``) + t;
    },
  }),
  E({
    parse: (e) => {
      let t = parseFloat(e);
      return t == t ? t : null;
    },
    serialize: String,
  }),
  E({ parse: (e) => e.toLowerCase() === `true`, serialize: String }));
function k(e, t) {
  return e.valueOf() === t.valueOf();
}
(E({
  parse: (e) => {
    let t = parseInt(e);
    return t == t ? new Date(t) : null;
  },
  serialize: (e) => `` + e.valueOf(),
  eq: k,
}),
  E({
    parse: (e) => {
      let t = new Date(e);
      return t.valueOf() == t.valueOf() ? t : null;
    },
    serialize: (e) => e.toISOString(),
    eq: k,
  }),
  E({
    parse: (e) => {
      let t = new Date(e.slice(0, 10));
      return t.valueOf() == t.valueOf() ? t : null;
    },
    serialize: (e) => e.toISOString().slice(0, 10),
    eq: k,
  }));
function A(e) {
  return E({
    parse: (t) => {
      let n = t;
      return e.includes(n) ? n : null;
    },
    serialize: String,
  });
}
function j(e, t = `,`) {
  let n = e.eq ?? ((e, t) => e === t),
    r = encodeURIComponent(t);
  return E({
    parse: (n) =>
      n === ``
        ? []
        : n
            .split(t)
            .map((n, i) => T(e.parse, n.replaceAll(r, t), `[${i}]`))
            .filter((e) => e != null),
    serialize: (n) =>
      n
        .map((n) => (e.serialize ? e.serialize(n) : String(n)).replaceAll(t, r))
        .join(t),
    eq(e, t) {
      return e === t
        ? !0
        : e.length === t.length
          ? e.every((e, r) => n(e, t[r]))
          : !1;
    },
  });
}
var M = m(),
  N = {};
function P(e, t = {}) {
  let s = (0, c.useId)(),
    l = r(),
    u = n(),
    {
      history: f = `replace`,
      scroll: p = l?.scroll ?? !1,
      shallow: m = l?.shallow ?? !0,
      throttleMs: h = d.timeMs,
      limitUrlUpdates: g = l?.limitUrlUpdates,
      clearOnDefault: _ = l?.clearOnDefault ?? !0,
      startTransition: v,
      urlKeys: y = N,
    } = t,
    x = Object.keys(e).join(`,`),
    S = (0, c.useMemo)(
      () => Object.fromEntries(Object.keys(e).map((e) => [e, y[e] ?? e])),
      [x, JSON.stringify(y)],
    ),
    w = i(Object.values(S)),
    T = w.searchParams,
    E = (0, c.useRef)({}),
    D = (0, c.useMemo)(
      () =>
        Object.fromEntries(
          Object.keys(e).map((t) => [t, e[t].defaultValue ?? null]),
        ),
      [
        Object.values(e)
          .map(({ defaultValue: e }) => e)
          .join(`,`),
      ],
    ),
    O = C.useQueuedQueries(Object.values(S)),
    [k, A] = (0, c.useState)(
      () => F(e, y, T ?? new URLSearchParams(), O).state,
    ),
    j = (0, c.useRef)(k);
  if (
    (o("[nuq+ %s `%s`] render - state: %O, iSP: %s", s, x, k, T),
    Object.keys(E.current).join(`&`) !== Object.values(S).join(`&`))
  ) {
    let { state: t, hasChanged: n } = F(e, y, T, O, E.current, j.current);
    (n &&
      (o("[nuq+ %s `%s`] State changed: %O", s, x, {
        state: t,
        initialSearchParams: T,
        queuedQueries: O,
        queryRef: E.current,
        stateRef: j.current,
      }),
      (j.current = t),
      A(t)),
      (E.current = Object.fromEntries(
        Object.entries(S).map(([t, n]) => [
          n,
          e[t]?.type === `multi` ? T?.getAll(n) : (T?.get(n) ?? null),
        ]),
      )));
  }
  ((0, c.useEffect)(() => {
    let { state: t, hasChanged: n } = F(e, y, T, O, E.current, j.current);
    n &&
      (o("[nuq+ %s `%s`] State changed: %O", s, x, {
        state: t,
        initialSearchParams: T,
        queuedQueries: O,
        queryRef: E.current,
        stateRef: j.current,
      }),
      (j.current = t),
      A(t));
  }, [
    Object.values(S)
      .map((e) => `${e}=${T?.getAll(e)}`)
      .join(`&`),
    JSON.stringify(O),
  ]),
    (0, c.useEffect)(() => {
      let t = Object.keys(e).reduce(
        (t, n) => (
          (t[n] = ({ state: t, query: r }) => {
            A((i) => {
              let { defaultValue: a } = e[n],
                c = S[n],
                l = t ?? a ?? null,
                u = i[n] ?? a ?? null;
              return Object.is(u, l)
                ? (o(
                    "[nuq+ %s `%s`] Cross-hook key sync %s: %O (default: %O). no change, skipping, resolved: %O",
                    s,
                    x,
                    c,
                    t,
                    a,
                    j.current,
                  ),
                  i)
                : ((j.current = { ...j.current, [n]: l }),
                  (E.current[c] = r),
                  o(
                    "[nuq+ %s `%s`] Cross-hook key sync %s: %O (default: %O). updateInternalState, resolved: %O",
                    s,
                    x,
                    c,
                    t,
                    a,
                    j.current,
                  ),
                  j.current);
            });
          }),
          t
        ),
        {},
      );
      for (let n of Object.keys(e)) {
        let e = S[n];
        (o("[nuq+ %s `%s`] Subscribing to sync for `%s`", s, e, x),
          M.on(e, t[n]));
      }
      return () => {
        for (let n of Object.keys(e)) {
          let e = S[n];
          (o("[nuq+ %s `%s`] Unsubscribing to sync for `%s`", s, e, x),
            M.off(e, t[n]));
        }
      };
    }, [x, S]));
  let P = (0, c.useCallback)(
    (t, n = {}) => {
      let r = Object.fromEntries(Object.keys(e).map((e) => [e, null])),
        i = typeof t == `function` ? (t(I(j.current, D)) ?? r) : (t ?? r);
      o("[nuq+ %s `%s`] setState: %O", s, x, i);
      let c,
        l = 0,
        y = !1,
        T = [];
      for (let [t, r] of Object.entries(i)) {
        let i = e[t],
          o = S[t];
        if (!i || r === void 0) continue;
        (n.clearOnDefault ?? i.clearOnDefault ?? _) &&
          r !== null &&
          i.defaultValue !== void 0 &&
          (i.eq ?? ((e, t) => e === t))(r, i.defaultValue) &&
          (r = null);
        let s = r === null ? null : (i.serialize ?? String)(r);
        M.emit(o, { state: r, query: s });
        let x = {
          key: o,
          query: s,
          options: {
            history: n.history ?? i.history ?? f,
            shallow: n.shallow ?? i.shallow ?? m,
            scroll: n.scroll ?? i.scroll ?? p,
            startTransition: n.startTransition ?? i.startTransition ?? v,
          },
        };
        if (
          n?.limitUrlUpdates?.method === `debounce` ||
          g?.method === `debounce` ||
          i.limitUrlUpdates?.method === `debounce`
        ) {
          x.options.shallow === !0 && console.warn(a(422));
          let e =
              n?.limitUrlUpdates?.timeMs ??
              g?.timeMs ??
              i.limitUrlUpdates?.timeMs ??
              d.timeMs,
            t = C.push(x, e, w, u);
          l < e && ((c = t), (l = e));
        } else {
          let e =
            n?.limitUrlUpdates?.timeMs ??
            i?.limitUrlUpdates?.timeMs ??
            g?.timeMs ??
            n.throttleMs ??
            i.throttleMs ??
            h;
          (T.push(C.abort(o)), b.push(x, e), (y = !0));
        }
      }
      let E = T.reduce(
        (e, t) => t(e),
        y ? b.flush(w, u) : b.getPendingPromise(w),
      );
      return c ?? E;
    },
    [
      x,
      f,
      m,
      p,
      h,
      g?.method,
      g?.timeMs,
      v,
      S,
      w.updateUrl,
      w.getSearchParamsSnapshot,
      w.rateLimitFactor,
      u,
      D,
    ],
  );
  return [(0, c.useMemo)(() => I(k, D), [k, D]), P];
}
function F(e, t, n, r, i, a) {
  let o = !1,
    s = Object.entries(e).reduce((e, [s, c]) => {
      let l = t?.[s] ?? s,
        u = r[l],
        d = c.type === `multi` ? [] : null,
        p =
          u === void 0
            ? ((c.type === `multi` ? n?.getAll(l) : n?.get(l)) ?? d)
            : u;
      return i && a && w(i[l] ?? d, p)
        ? ((e[s] = a[s] ?? null), e)
        : ((o = !0),
          (e[s] = (f(p) ? null : T(c.parse, p, l)) ?? null),
          i && (i[l] = p),
          e);
    }, {});
  if (!o) {
    let t = Object.keys(e),
      n = Object.keys(a ?? {});
    o = t.length !== n.length || t.some((e) => !n.includes(e));
  }
  return { state: s, hasChanged: o };
}
function I(e, t) {
  return Object.fromEntries(
    Object.keys(e).map((n) => [n, e[n] ?? t[n] ?? null]),
  );
}
function L(e, t = {}) {
  let { parse: n, type: r, serialize: i, eq: a, defaultValue: o, ...s } = t,
    [{ [e]: l }, u] = P(
      {
        [e]: {
          parse: n ?? ((e) => e),
          type: r,
          serialize: i,
          eq: a,
          defaultValue: o,
        },
      },
      s,
    );
  return [
    l,
    (0, c.useCallback)(
      (t, n = {}) =>
        u((n) => ({ [e]: typeof t == `function` ? t(n[e]) : t }), n),
      [e, u],
    ),
  ];
}
var R = { history: `replace` },
  z = { history: `push` },
  B = D.withDefault(``).withOptions(R),
  V = [
    `todo`,
    `in_progress`,
    `code_review`,
    `business_review`,
    `done`,
    `cancelled`,
  ],
  H = j(A(V))
    .withDefault([...V])
    .withOptions(R),
  U = [`draft`, `finalized`, `active`, `completed`, `cancelled`],
  W = j(A(U))
    .withDefault([...U])
    .withOptions(R),
  G = A([`created`, `title`]).withDefault(`created`).withOptions(R),
  K = A([`asc`, `desc`]).withDefault(`desc`).withOptions(R),
  q = A([`7d`, `30d`, `90d`, `all`]).withDefault(`30d`).withOptions(R),
  J = A([`1d`, `3d`, `1w`, `1m`, `3m`, `6m`, `1y`, `all`])
    .withDefault(`all`)
    .withOptions(R),
  Y = A([`preview`, `editor`, `terminal`, `desktop`])
    .withDefault(`preview`)
    .withOptions(z),
  X = A([`execute`, `ask`, `plan`]).withDefault(`execute`).withOptions(z),
  Z = D.withDefault(`0`).withOptions(z),
  Q = A([`desktop`, `mobile`]).withDefault(`desktop`).withOptions(z),
  $ = A([`code`, `ui`]).withDefault(`code`).withOptions(z),
  ee = A([`all`, `unread`]).withDefault(`all`).withOptions(R),
  te = A([`kanban`, `timeline`, `list`]).withDefault(`kanban`).withOptions(z),
  ne = A([`kanban`, `list`]).withDefault(`kanban`).withOptions(z),
  re = D.withDefault(`none`).withOptions(R),
  ie = O.withDefault(3001).withOptions(R),
  ae = D.withDefault(`main`).withOptions(R),
  oe = A([`repo`, `team`]).withDefault(`repo`).withOptions(z),
  se = A([`members`, `repos`, `env`]).withDefault(`members`).withOptions(z),
  ce = j(D).withDefault([]).withOptions(R);
export {
  P as C,
  L as S,
  H as _,
  ce as a,
  q as b,
  re as c,
  J as d,
  Y as f,
  G as g,
  K as h,
  ee as i,
  te as l,
  X as m,
  Z as n,
  W as o,
  B as p,
  oe as r,
  ie as s,
  ae as t,
  ne as u,
  se as v,
  Q as x,
  $ as y,
};
