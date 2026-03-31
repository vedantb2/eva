import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t, t as n } from "./jsx-runtime-bxCDpROR.js";
import { T as r } from "./index-CuMF3NGg.js";
import { l as i, n as a } from "./backend-BVlbQtYj.js";
import { Rt as o, Vt as s, zt as c } from "./src-DHCpG1Q-.js";
import { n as l } from "./dates-DHZmrCUU.js";
function u(e) {
  let t = 0;
  for (let n = 0; n < e.length; n++) {
    let r = e.charCodeAt(n);
    ((t = (t << 5) - t + r), (t &= t));
  }
  return Math.abs(t);
}
var d = e(t(), 1),
  f = n(),
  p = `
@keyframes facehash-blink {
	0%, 92%, 100% { transform: scaleY(1); }
	96% { transform: scaleY(0.05); }
}
`,
  m = !1;
function h() {
  if (m || typeof document > `u`) return;
  let e = document.createElement(`style`);
  ((e.textContent = p), document.head.appendChild(e), (m = !0));
}
function g(e) {
  return e
    ? {
        animation: `facehash-blink ${e.duration}s ease-in-out ${e.delay}s infinite`,
        transformOrigin: `center center`,
      }
    : {};
}
var _ = [
    ({ className: e, style: t, enableBlink: n, blinkTimings: r }) => (
      n && h(),
      (0, f.jsxs)(`svg`, {
        "aria-hidden": `true`,
        className: e,
        fill: `none`,
        style: t,
        viewBox: `0 0 63 15`,
        xmlns: `http://www.w3.org/2000/svg`,
        children: [
          (0, f.jsx)(`g`, {
            style: n ? g(r?.right) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M62.4 7.2C62.4 11.1765 59.1765 14.4 55.2 14.4C51.2236 14.4 48 11.1765 48 7.2C48 3.22355 51.2236 0 55.2 0C59.1765 0 62.4 3.22355 62.4 7.2Z`,
              fill: `currentColor`,
            }),
          }),
          (0, f.jsx)(`g`, {
            style: n ? g(r?.left) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M14.4 7.2C14.4 11.1765 11.1765 14.4 7.2 14.4C3.22355 14.4 0 11.1765 0 7.2C0 3.22355 3.22355 0 7.2 0C11.1765 0 14.4 3.22355 14.4 7.2Z`,
              fill: `currentColor`,
            }),
          }),
        ],
      })
    ),
    ({ className: e, style: t, enableBlink: n, blinkTimings: r }) => (
      n && h(),
      (0, f.jsxs)(`svg`, {
        "aria-hidden": `true`,
        className: e,
        fill: `none`,
        style: t,
        viewBox: `0 0 71 23`,
        xmlns: `http://www.w3.org/2000/svg`,
        children: [
          (0, f.jsx)(`g`, {
            style: n ? g(r?.left) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M11.5 0C12.9411 0 13.6619 0.000460386 14.1748 0.354492C14.3742 0.49213 14.547 0.664882 14.6846 0.864258C15.0384 1.37711 15.0391 2.09739 15.0391 3.53809V7.96094H19.4619C20.9027 7.96094 21.6229 7.9615 22.1357 8.31543C22.3352 8.45308 22.5079 8.62578 22.6455 8.8252C22.9995 9.3381 23 10.0589 23 11.5C23 12.9408 22.9995 13.661 22.6455 14.1738C22.5079 14.3733 22.3352 14.5459 22.1357 14.6836C21.6229 15.0375 20.9027 15.0381 19.4619 15.0381H15.0391V19.4619C15.0391 20.9026 15.0384 21.6229 14.6846 22.1357C14.547 22.3351 14.3742 22.5079 14.1748 22.6455C13.6619 22.9995 12.9411 23 11.5 23C10.0592 23 9.33903 22.9994 8.82617 22.6455C8.62674 22.5079 8.45309 22.3352 8.31543 22.1357C7.96175 21.6229 7.96191 20.9024 7.96191 19.4619V15.0381H3.53809C2.0973 15.0381 1.37711 15.0375 0.864258 14.6836C0.664834 14.5459 0.492147 14.3733 0.354492 14.1738C0.000498831 13.661 -5.88036e-08 12.9408 0 11.5C6.2999e-08 10.0589 0.000460356 9.3381 0.354492 8.8252C0.492144 8.62578 0.664842 8.45308 0.864258 8.31543C1.37711 7.9615 2.09731 7.96094 3.53809 7.96094H7.96191V3.53809C7.96191 2.09765 7.96175 1.37709 8.31543 0.864258C8.45309 0.664828 8.62674 0.492149 8.82617 0.354492C9.33903 0.000555366 10.0592 1.62347e-09 11.5 0Z`,
              fill: `currentColor`,
            }),
          }),
          (0, f.jsx)(`g`, {
            style: n ? g(r?.right) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M58.7695 0C60.2107 0 60.9314 0.000460386 61.4443 0.354492C61.6437 0.49213 61.8165 0.664882 61.9541 0.864258C62.308 1.37711 62.3086 2.09739 62.3086 3.53809V7.96094H66.7314C68.1722 7.96094 68.8924 7.9615 69.4053 8.31543C69.6047 8.45308 69.7774 8.62578 69.915 8.8252C70.2691 9.3381 70.2695 10.0589 70.2695 11.5C70.2695 12.9408 70.269 13.661 69.915 14.1738C69.7774 14.3733 69.6047 14.5459 69.4053 14.6836C68.8924 15.0375 68.1722 15.0381 66.7314 15.0381H62.3086V19.4619C62.3086 20.9026 62.308 21.6229 61.9541 22.1357C61.8165 22.3351 61.6437 22.5079 61.4443 22.6455C60.9314 22.9995 60.2107 23 58.7695 23C57.3287 23 56.6086 22.9994 56.0957 22.6455C55.8963 22.5079 55.7226 22.3352 55.585 22.1357C55.2313 21.6229 55.2314 20.9024 55.2314 19.4619V15.0381H50.8076C49.3668 15.0381 48.6466 15.0375 48.1338 14.6836C47.9344 14.5459 47.7617 14.3733 47.624 14.1738C47.27 13.661 47.2695 12.9408 47.2695 11.5C47.2695 10.0589 47.27 9.3381 47.624 8.8252C47.7617 8.62578 47.9344 8.45308 48.1338 8.31543C48.6466 7.9615 49.3668 7.96094 50.8076 7.96094H55.2314V3.53809C55.2314 2.09765 55.2313 1.37709 55.585 0.864258C55.7226 0.664828 55.8963 0.492149 56.0957 0.354492C56.6086 0.000555366 57.3287 1.62347e-09 58.7695 0Z`,
              fill: `currentColor`,
            }),
          }),
        ],
      })
    ),
    ({ className: e, style: t, enableBlink: n, blinkTimings: r }) => (
      n && h(),
      (0, f.jsxs)(`svg`, {
        "aria-hidden": `true`,
        className: e,
        fill: `none`,
        style: t,
        viewBox: `0 0 82 8`,
        xmlns: `http://www.w3.org/2000/svg`,
        children: [
          (0, f.jsxs)(`g`, {
            style: n ? g(r?.left) : void 0,
            children: [
              (0, f.jsx)(`path`, {
                d: `M3.53125 0.164063C4.90133 0.164063 5.58673 0.163893 6.08301 0.485352C6.31917 0.638428 6.52075 0.840012 6.67383 1.07617C6.99555 1.57252 6.99512 2.25826 6.99512 3.62891C6.99512 4.99911 6.99536 5.68438 6.67383 6.18066C6.52075 6.41682 6.31917 6.61841 6.08301 6.77148C5.58672 7.09305 4.90147 7.09277 3.53125 7.09277C2.16062 7.09277 1.47486 7.09319 0.978516 6.77148C0.742356 6.61841 0.540772 6.41682 0.387695 6.18066C0.0662401 5.68439 0.0664063 4.999 0.0664063 3.62891C0.0664063 2.25838 0.0660571 1.57251 0.387695 1.07617C0.540772 0.840012 0.742356 0.638428 0.978516 0.485352C1.47485 0.163744 2.16076 0.164063 3.53125 0.164063Z`,
                fill: `currentColor`,
              }),
              (0, f.jsx)(`path`, {
                d: `M25.1836 0.164063C26.5542 0.164063 27.24 0.163638 27.7363 0.485352C27.9724 0.638384 28.1731 0.8401 28.3262 1.07617C28.6479 1.57252 28.6484 2.25825 28.6484 3.62891C28.6484 4.99931 28.6478 5.68436 28.3262 6.18066C28.1731 6.41678 27.9724 6.61842 27.7363 6.77148C27.24 7.09321 26.5542 7.09277 25.1836 7.09277H11.3262C9.95557 7.09277 9.26978 7.09317 8.77344 6.77148C8.53728 6.61841 8.33569 6.41682 8.18262 6.18066C7.86115 5.68438 7.86133 4.99902 7.86133 3.62891C7.86133 2.25835 7.86096 1.57251 8.18262 1.07617C8.33569 0.840012 8.53728 0.638428 8.77344 0.485352C9.26977 0.163768 9.95572 0.164063 11.3262 0.164063H25.1836Z`,
                fill: `currentColor`,
              }),
            ],
          }),
          (0, f.jsxs)(`g`, {
            style: n ? g(r?.right) : void 0,
            children: [
              (0, f.jsx)(`path`, {
                d: `M78.2034 7.09325C76.8333 7.09325 76.1479 7.09342 75.6516 6.77197C75.4155 6.61889 75.2139 6.4173 75.0608 6.18114C74.7391 5.6848 74.7395 4.99905 74.7395 3.62841C74.7395 2.2582 74.7393 1.57294 75.0608 1.07665C75.2139 0.840493 75.4155 0.638909 75.6516 0.485832C76.1479 0.164271 76.8332 0.164543 78.2034 0.164543C79.574 0.164543 80.2598 0.164122 80.7561 0.485832C80.9923 0.638909 81.1939 0.840493 81.347 1.07665C81.6684 1.57293 81.6682 2.25831 81.6682 3.62841C81.6682 4.99894 81.6686 5.68481 81.347 6.18114C81.1939 6.4173 80.9923 6.61889 80.7561 6.77197C80.2598 7.09357 79.5739 7.09325 78.2034 7.09325Z`,
                fill: `currentColor`,
              }),
              (0, f.jsx)(`path`, {
                d: `M56.5511 7.09325C55.1804 7.09325 54.4947 7.09368 53.9983 6.77197C53.7622 6.61893 53.5615 6.41722 53.4085 6.18114C53.0868 5.6848 53.0862 4.99907 53.0862 3.62841C53.0862 2.258 53.0868 1.57296 53.4085 1.07665C53.5615 0.840539 53.7622 0.638898 53.9983 0.485832C54.4947 0.164105 55.1804 0.164543 56.5511 0.164543H70.4085C71.7791 0.164543 72.4649 0.164146 72.9612 0.485832C73.1974 0.638909 73.399 0.840493 73.552 1.07665C73.8735 1.57293 73.8733 2.25829 73.8733 3.62841C73.8733 4.99896 73.8737 5.68481 73.552 6.18114C73.399 6.4173 73.1974 6.61889 72.9612 6.77197C72.4649 7.09355 71.7789 7.09325 70.4085 7.09325H56.5511Z`,
                fill: `currentColor`,
              }),
            ],
          }),
        ],
      })
    ),
    ({ className: e, style: t, enableBlink: n, blinkTimings: r }) => (
      n && h(),
      (0, f.jsxs)(`svg`, {
        "aria-hidden": `true`,
        className: e,
        fill: `none`,
        style: t,
        viewBox: `0 0 63 9`,
        xmlns: `http://www.w3.org/2000/svg`,
        children: [
          (0, f.jsx)(`g`, {
            style: n ? g(r?.left) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M0 5.06511C0 4.94513 0 4.88513 0.00771184 4.79757C0.0483059 4.33665 0.341025 3.76395 0.690821 3.46107C0.757274 3.40353 0.783996 3.38422 0.837439 3.34559C2.40699 2.21129 6.03888 0 10.5 0C14.9611 0 18.593 2.21129 20.1626 3.34559C20.216 3.38422 20.2427 3.40353 20.3092 3.46107C20.659 3.76395 20.9517 4.33665 20.9923 4.79757C21 4.88513 21 4.94513 21 5.06511C21 6.01683 21 6.4927 20.9657 6.6754C20.7241 7.96423 19.8033 8.55941 18.5289 8.25054C18.3483 8.20676 17.8198 7.96876 16.7627 7.49275C14.975 6.68767 12.7805 6 10.5 6C8.21954 6 6.02504 6.68767 4.23727 7.49275C3.18025 7.96876 2.65174 8.20676 2.47108 8.25054C1.19668 8.55941 0.275917 7.96423 0.0342566 6.6754C0 6.4927 0 6.01683 0 5.06511Z`,
              fill: `currentColor`,
            }),
          }),
          (0, f.jsx)(`g`, {
            style: n ? g(r?.right) : void 0,
            children: (0, f.jsx)(`path`, {
              d: `M42 5.06511C42 4.94513 42 4.88513 42.0077 4.79757C42.0483 4.33665 42.341 3.76395 42.6908 3.46107C42.7573 3.40353 42.784 3.38422 42.8374 3.34559C44.407 2.21129 48.0389 0 52.5 0C56.9611 0 60.593 2.21129 62.1626 3.34559C62.216 3.38422 62.2427 3.40353 62.3092 3.46107C62.659 3.76395 62.9517 4.33665 62.9923 4.79757C63 4.88513 63 4.94513 63 5.06511C63 6.01683 63 6.4927 62.9657 6.6754C62.7241 7.96423 61.8033 8.55941 60.5289 8.25054C60.3483 8.20676 59.8198 7.96876 58.7627 7.49275C56.975 6.68767 54.7805 6 52.5 6C50.2195 6 48.025 6.68767 46.2373 7.49275C45.1802 7.96876 44.6517 8.20676 44.4711 8.25054C43.1967 8.55941 42.2759 7.96423 42.0343 6.6754C42 6.4927 42 6.01683 42 5.06511Z`,
              fill: `currentColor`,
            }),
          }),
        ],
      })
    ),
  ],
  v = {
    none: { rotateRange: 0, translateZ: 0, perspective: `none` },
    subtle: { rotateRange: 5, translateZ: 4, perspective: `800px` },
    medium: { rotateRange: 10, translateZ: 8, perspective: `500px` },
    dramatic: { rotateRange: 15, translateZ: 12, perspective: `300px` },
  },
  y = [
    { x: -1, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
  ],
  b = {
    background: `radial-gradient(ellipse 100% 100% at 50% 50%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
  },
  x = d.forwardRef(
    (
      {
        name: e,
        size: t = 40,
        variant: n = `gradient`,
        intensity3d: r = `dramatic`,
        interactive: i = !0,
        showInitial: a = !0,
        colors: o,
        colorClasses: s,
        gradientOverlayClass: c,
        onRenderMouth: l,
        enableBlink: p = !1,
        className: m,
        style: h,
        onMouseEnter: g,
        onMouseLeave: x,
        ...S
      },
      C,
    ) => {
      let [w, T] = d.useState(!1),
        {
          FaceComponent: E,
          colorIndex: D,
          rotation: O,
          blinkTimings: k,
        } = d.useMemo(() => {
          let t = u(e),
            n = t % _.length,
            r = t % (s?.length ?? o?.length ?? 1),
            i = y[t % y.length] ?? { x: 0, y: 0 },
            a = t * 31,
            c = { delay: (a % 40) / 10, duration: 2 + (a % 40) / 10 };
          return {
            FaceComponent: _[n] ?? _[0],
            colorIndex: r,
            rotation: i,
            blinkTimings: { left: c, right: c },
          };
        }, [e, o?.length, s?.length]),
        A = v[r],
        j = d.useMemo(() => {
          if (r !== `none`)
            return `rotateX(${w && i ? 0 : O.x * A.rotateRange}deg) rotateY(${w && i ? 0 : O.y * A.rotateRange}deg) translateZ(${A.translateZ}px)`;
        }, [r, w, i, O, A]),
        M = typeof t == `number` ? `${t}px` : t,
        N = e.charAt(0).toUpperCase(),
        P = s?.[D],
        F = o?.[D],
        I = d.useCallback(
          (e) => {
            (i && T(!0), g?.(e));
          },
          [i, g],
        ),
        L = d.useCallback(
          (e) => {
            (i && T(!1), x?.(e));
          },
          [i, x],
        );
      return (0, f.jsxs)(`div`, {
        className: [`facehash`, P, m].filter(Boolean).join(` `),
        "data-facehash": ``,
        "data-interactive": i || void 0,
        onMouseEnter: I,
        onMouseLeave: L,
        ref: C,
        style: {
          width: M,
          height: M,
          position: `relative`,
          display: `flex`,
          alignItems: `center`,
          justifyContent: `center`,
          overflow: `hidden`,
          containerType: `size`,
          ...(r !== `none` && {
            perspective: A.perspective,
            transformStyle: `preserve-3d`,
          }),
          ...(F && !P && { backgroundColor: F }),
          ...h,
        },
        ...S,
        children: [
          n === `gradient` &&
            (0, f.jsx)(`div`, {
              className: c,
              "data-facehash-gradient": ``,
              style: {
                position: `absolute`,
                inset: 0,
                pointerEvents: `none`,
                zIndex: 1,
                ...(c ? {} : b),
              },
            }),
          (0, f.jsxs)(`div`, {
            "data-facehash-face": ``,
            style: {
              position: `absolute`,
              inset: 0,
              display: `flex`,
              flexDirection: `column`,
              alignItems: `center`,
              justifyContent: `center`,
              zIndex: 2,
              transform: j,
              transformStyle: r === `none` ? void 0 : `preserve-3d`,
              transition: i
                ? `transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
                : void 0,
            },
            children: [
              (0, f.jsx)(E, {
                blinkTimings: k,
                enableBlink: p,
                style: {
                  width: `60%`,
                  height: `auto`,
                  maxWidth: `90%`,
                  maxHeight: `40%`,
                },
              }),
              l
                ? (0, f.jsx)(`div`, {
                    "data-facehash-mouth": ``,
                    style: {
                      marginTop: `8%`,
                      display: `flex`,
                      alignItems: `center`,
                      justifyContent: `center`,
                    },
                    children: l(),
                  })
                : a &&
                  (0, f.jsx)(`span`, {
                    "data-facehash-initial": ``,
                    style: {
                      marginTop: `8%`,
                      fontSize: `26cqw`,
                      lineHeight: 1,
                    },
                    children: N,
                  }),
            ],
          }),
        ],
      });
    },
  );
x.displayName = `Facehash`;
var S = d.createContext(null),
  C = () => {
    let e = d.useContext(S);
    if (!e)
      throw Error(
        `Avatar compound components must be rendered within an Avatar component`,
      );
    return e;
  },
  w = d.forwardRef(
    ({ children: e, className: t, style: n, asChild: r = !1, ...i }, a) => {
      let [o, s] = d.useState(`idle`),
        c = d.useMemo(
          () => ({ imageLoadingStatus: o, onImageLoadingStatusChange: s }),
          [o],
        ),
        l = r ? d.Fragment : `span`,
        u = r
          ? {}
          : {
              ref: a,
              className: t,
              style: {
                position: `relative`,
                display: `flex`,
                alignItems: `center`,
                justifyContent: `center`,
                flexShrink: 0,
                overflow: `hidden`,
                ...n,
              },
              "data-avatar": ``,
              "data-state": o,
              ...i,
            };
      return (0, f.jsx)(S.Provider, {
        value: c,
        children: (0, f.jsx)(l, { ...u, children: e }),
      });
    },
  );
w.displayName = `Avatar`;
var T = /\s+/;
function E(e) {
  let t = e.trim().split(T);
  return t.length === 0
    ? ``
    : t.length === 1
      ? t[0]?.charAt(0).toUpperCase() || ``
      : ((t[0]?.charAt(0) || ``) + (t.at(-1)?.charAt(0) || ``)).toUpperCase();
}
var D = d.forwardRef(
  (
    {
      name: e = ``,
      delayMs: t = 0,
      children: n,
      facehash: r = !0,
      facehashProps: i,
      className: a,
      style: o,
      ...s
    },
    c,
  ) => {
    let { imageLoadingStatus: l } = C(),
      [u, p] = d.useState(t === 0);
    d.useEffect(() => {
      if (t > 0) {
        let e = window.setTimeout(() => p(!0), t);
        return () => window.clearTimeout(e);
      }
    }, [t]);
    let m = d.useMemo(() => E(e), [e]);
    return u && l !== `loaded` && l !== `loading`
      ? n
        ? (0, f.jsx)(`span`, {
            className: a,
            "data-avatar-fallback": ``,
            ref: c,
            style: {
              display: `flex`,
              alignItems: `center`,
              justifyContent: `center`,
              width: `100%`,
              height: `100%`,
              ...o,
            },
            ...s,
            children: n,
          })
        : r
          ? (0, f.jsx)(x, {
              className: a,
              "data-avatar-fallback": ``,
              name: e,
              ref: c,
              size: `100%`,
              ...i,
              style: { ...o },
              ...s,
            })
          : (0, f.jsx)(`span`, {
              className: a,
              "data-avatar-fallback": ``,
              ref: c,
              style: {
                display: `flex`,
                alignItems: `center`,
                justifyContent: `center`,
                width: `100%`,
                height: `100%`,
                ...o,
              },
              ...s,
              children: m,
            })
      : null;
  },
);
D.displayName = `AvatarFallback`;
var O = d.forwardRef(
  (
    {
      src: e,
      alt: t = ``,
      className: n,
      style: r,
      onLoadingStatusChange: i,
      ...a
    },
    o,
  ) => {
    let { imageLoadingStatus: s, onImageLoadingStatusChange: c } = C(),
      l = d.useRef(null);
    d.useImperativeHandle(o, () => l.current);
    let u = d.useCallback(
      (e) => {
        (c(e), i?.(e));
      },
      [c, i],
    );
    return (
      d.useLayoutEffect(() => {
        if (!e) {
          u(`error`);
          return;
        }
        let t = !0,
          n = new Image(),
          r = (e) => {
            t && u(e);
          };
        return (
          r(`loading`),
          (n.onload = () => r(`loaded`)),
          (n.onerror = () => r(`error`)),
          (n.src = e),
          () => {
            t = !1;
          }
        );
      }, [e, u]),
      s === `loaded`
        ? (0, f.jsx)(`img`, {
            alt: t,
            className: n,
            "data-avatar-image": ``,
            ref: l,
            src: e ?? void 0,
            style: {
              aspectRatio: `1 / 1`,
              width: `100%`,
              height: `100%`,
              objectFit: `cover`,
              ...r,
            },
            ...a,
          })
        : null
    );
  },
);
O.displayName = `AvatarImage`;
var k = r();
function A(e) {
  return (
    `${e.firstName?.[0] ?? ``}${e.lastName?.[0] ?? ``}`.toUpperCase() ||
    (e.fullName
      ? e.fullName
          .split(/\s+/)
          .map((e) => e[0])
          .join(``)
          .toUpperCase()
          .slice(0, 2)
      : `?`)
  );
}
function j(e) {
  return `${e.firstName ?? ``} ${e.lastName ?? ``}`.trim() || e.fullName || ``;
}
function M(e) {
  let t = (0, k.c)(27),
    { userId: n, user: r, hideLastSeen: u, size: d } = e,
    p;
  t[0] !== r || t[1] !== n
    ? ((p = !r && n ? { id: n } : `skip`), (t[0] = r), (t[1] = n), (t[2] = p))
    : (p = t[2]);
  let m = i(a.users.get, p),
    h = r ?? m;
  if (!h) return null;
  let g;
  t[3] === h ? (g = t[4]) : ((g = A(h)), (t[3] = h), (t[4] = g));
  let _ = g,
    v;
  t[5] === h ? (v = t[6]) : ((v = j(h)), (t[5] = h), (t[6] = v));
  let y = v,
    b = !!h.lastSeenAt && Date.now() - h.lastSeenAt < 12e4,
    S;
  t[7] !== y || t[8] !== b || t[9] !== h.lastSeenAt
    ? ((S = b
        ? `${y} · Online`
        : h.lastSeenAt
          ? `${y} · Active ${l(h.lastSeenAt).fromNow()}`
          : y),
      (t[7] = y),
      (t[8] = b),
      (t[9] = h.lastSeenAt),
      (t[10] = S))
    : (S = t[10]);
  let C = S,
    w = d === `md` ? 24 : d === `lg` ? 32 : 16,
    T = d === `lg` ? `h-3 w-3` : d === `md` ? `h-2.5 w-2.5` : `h-1.5 w-1.5`,
    E;
  t[11] !== w || t[12] !== _
    ? ((E = (0, f.jsx)(x, {
        size: w,
        name: _,
        enableBlink: !0,
        interactive: !0,
      })),
      (t[11] = w),
      (t[12] = _),
      (t[13] = E))
    : (E = t[13]);
  let D;
  t[14] !== T || t[15] !== u || t[16] !== b || t[17] !== h.lastSeenAt
    ? ((D =
        !u &&
        h.lastSeenAt &&
        (0, f.jsx)(`span`, {
          className: `absolute bottom-0 left-0 ${T} block rounded-full border-2 border-background ${b ? `bg-success` : `bg-warning`}`,
        })),
      (t[14] = T),
      (t[15] = u),
      (t[16] = b),
      (t[17] = h.lastSeenAt),
      (t[18] = D))
    : (D = t[18]);
  let O;
  t[19] !== E || t[20] !== D
    ? ((O = (0, f.jsx)(s, {
        asChild: !0,
        children: (0, f.jsxs)(`div`, {
          className: `relative flex items-center justify-center rounded-full bg-accent`,
          children: [E, D],
        }),
      })),
      (t[19] = E),
      (t[20] = D),
      (t[21] = O))
    : (O = t[21]);
  let M;
  t[22] === C
    ? (M = t[23])
    : ((M = (0, f.jsx)(c, { children: C })), (t[22] = C), (t[23] = M));
  let N;
  return (
    t[24] !== O || t[25] !== M
      ? ((N = (0, f.jsxs)(o, { children: [O, M] })),
        (t[24] = O),
        (t[25] = M),
        (t[26] = N))
      : (N = t[26]),
    N
  );
}
export { A as n, x as r, M as t };
