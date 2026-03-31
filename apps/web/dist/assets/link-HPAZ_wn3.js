import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { n as r } from "./shim-DlYA1Ap9.js";
import { a as ee, i, t as a } from "./useRouter-DlGunSkq.js";
import { c as te, d as o, f as s, t as ne } from "./useStore-DeDDmIeh.js";
import { a as c, c as l, n as re } from "./ClientOnly-Cl47BWjp.js";
var u = `Error preloading route! ☝️`,
  d = e(t(), 1);
n();
var ie = e(r(), 1);
function f(e, t) {
  let n = a(),
    r = i(t),
    {
      activeProps: f,
      inactiveProps: _,
      activeOptions: v,
      to: y,
      preload: fe,
      preloadDelay: pe,
      hashScrollIntoView: me,
      replace: he,
      startTransition: ge,
      resetScroll: _e,
      viewTransition: b,
      children: x,
      target: S,
      disabled: C,
      style: w,
      className: T,
      onClick: E,
      onBlur: D,
      onFocus: O,
      onMouseEnter: k,
      onMouseLeave: A,
      onTouchStart: j,
      ignoreBlocker: M,
      params: ve,
      search: ye,
      hash: be,
      state: xe,
      mask: Se,
      reloadDocument: Ce,
      unsafeRelative: we,
      from: Te,
      _fromLocation: Ee,
      ...N
    } = e,
    P = re(),
    F = d.useMemo(
      () => e,
      [
        n,
        e.from,
        e._fromLocation,
        e.hash,
        e.to,
        e.search,
        e.params,
        e.state,
        e.mask,
        e.unsafeRelative,
      ],
    ),
    I = ne(
      n.stores.location,
      (e) => e,
      (e, t) => e.href === t.href,
    ),
    L = d.useMemo(() => {
      let e = { _fromLocation: I, ...F };
      return n.buildLocation(e);
    }, [n, I, F]),
    R = L.maskedLocation ? L.maskedLocation.publicHref : L.publicHref,
    z = L.maskedLocation ? L.maskedLocation.external : L.external,
    B = d.useMemo(() => le(R, z, n.history, C), [C, z, R, n.history]),
    V = d.useMemo(() => {
      if (B?.external) return s(B.href, n.protocolAllowlist) ? void 0 : B.href;
      if (!ue(y) && !(typeof y != `string` || y.indexOf(`:`) === -1))
        try {
          return (new URL(y), s(y, n.protocolAllowlist) ? void 0 : y);
        } catch {}
    }, [y, B, n.protocolAllowlist]),
    H = d.useMemo(() => {
      if (V) return !1;
      if (v?.exact) {
        if (!c(I.pathname, L.pathname, n.basepath)) return !1;
      } else {
        let e = l(I.pathname, n.basepath),
          t = l(L.pathname, n.basepath);
        if (
          !(e.startsWith(t) && (e.length === t.length || e[t.length] === `/`))
        )
          return !1;
      }
      return (v?.includeSearch ?? !0) &&
        !te(I.search, L.search, {
          partial: !v?.exact,
          ignoreUndefined: !v?.explicitUndefined,
        })
        ? !1
        : v?.includeHash
          ? P && I.hash === L.hash
          : !0;
    }, [
      v?.exact,
      v?.explicitUndefined,
      v?.includeHash,
      v?.includeSearch,
      I,
      V,
      P,
      L.hash,
      L.pathname,
      L.search,
      n.basepath,
    ]),
    U = H ? (o(f, {}) ?? ae) : p,
    W = H ? p : (o(_, {}) ?? p),
    G = [T, U.className, W.className].filter(Boolean).join(` `),
    K = (w || U.style || W.style) && { ...w, ...U.style, ...W.style },
    [De, q] = d.useState(!1),
    J = d.useRef(!1),
    Y = e.reloadDocument || V ? !1 : (fe ?? n.options.defaultPreload),
    X = pe ?? n.options.defaultPreloadDelay ?? 0,
    Z = d.useCallback(() => {
      n.preloadRoute({ ...F, _builtLocation: L }).catch((e) => {
        (console.warn(e), console.warn(u));
      });
    }, [n, F, L]);
  (ee(
    r,
    d.useCallback(
      (e) => {
        e?.isIntersecting && Z();
      },
      [Z],
    ),
    h,
    { disabled: !!C || Y !== `viewport` },
  ),
    d.useEffect(() => {
      J.current || (!C && Y === `render` && (Z(), (J.current = !0)));
    }, [C, Z, Y]));
  let Oe = (e) => {
    let t = e.currentTarget.getAttribute(`target`),
      r = S === void 0 ? t : S;
    if (
      !C &&
      !de(e) &&
      !e.defaultPrevented &&
      (!r || r === `_self`) &&
      e.button === 0
    ) {
      (e.preventDefault(),
        (0, ie.flushSync)(() => {
          q(!0);
        }));
      let t = n.subscribe(`onResolved`, () => {
        (t(), q(!1));
      });
      n.navigate({
        ...F,
        replace: he,
        resetScroll: _e,
        hashScrollIntoView: me,
        startTransition: ge,
        viewTransition: b,
        ignoreBlocker: M,
      });
    }
  };
  if (V)
    return {
      ...N,
      ref: r,
      href: V,
      ...(x && { children: x }),
      ...(S && { target: S }),
      ...(C && { disabled: C }),
      ...(w && { style: w }),
      ...(T && { className: T }),
      ...(E && { onClick: E }),
      ...(D && { onBlur: D }),
      ...(O && { onFocus: O }),
      ...(k && { onMouseEnter: k }),
      ...(A && { onMouseLeave: A }),
      ...(j && { onTouchStart: j }),
    };
  let Q = (e) => {
      if (C || Y !== `intent`) return;
      if (!X) {
        Z();
        return;
      }
      let t = e.currentTarget;
      if (m.has(t)) return;
      let n = setTimeout(() => {
        (m.delete(t), Z());
      }, X);
      m.set(t, n);
    },
    ke = (e) => {
      C || Y !== `intent` || Z();
    },
    $ = (e) => {
      if (C || !Y || !X) return;
      let t = e.currentTarget,
        n = m.get(t);
      n && (clearTimeout(n), m.delete(t));
    };
  return {
    ...N,
    ...U,
    ...W,
    href: B?.href,
    ref: r,
    onClick: g([E, Oe]),
    onBlur: g([D, $]),
    onFocus: g([O, Q]),
    onMouseEnter: g([k, Q]),
    onMouseLeave: g([A, $]),
    onTouchStart: g([j, ke]),
    disabled: !!C,
    target: S,
    ...(K && { style: K }),
    ...(G && { className: G }),
    ...(C && oe),
    ...(H && se),
    ...(P && De && ce),
  };
}
var p = {},
  ae = { className: `active` },
  oe = { role: `link`, "aria-disabled": !0 },
  se = { "data-status": `active`, "aria-current": `page` },
  ce = { "data-transitioning": `transitioning` },
  m = new WeakMap(),
  h = { rootMargin: `100px` },
  g = (e) => (t) => {
    for (let n of e)
      if (n) {
        if (t.defaultPrevented) return;
        n(t);
      }
  };
function le(e, t, n, r) {
  if (!r)
    return t
      ? { href: e, external: !0 }
      : { href: n.createHref(e) || `/`, external: !1 };
}
function ue(e) {
  if (typeof e != `string`) return !1;
  let t = e.charCodeAt(0);
  return t === 47 ? e.charCodeAt(1) !== 47 : t === 46;
}
var _ = d.forwardRef((e, t) => {
  let { _asChild: n, ...r } = e,
    { type: ee, ...i } = f(r, t),
    a =
      typeof r.children == `function`
        ? r.children({ isActive: i[`data-status`] === `active` })
        : r.children;
  if (!n) {
    let { disabled: e, ...t } = i;
    return d.createElement(`a`, t, a);
  }
  return d.createElement(n, i, a);
});
function de(e) {
  return !!(e.metaKey || e.altKey || e.ctrlKey || e.shiftKey);
}
export { _ as t };
