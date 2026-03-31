const __vite__mapDeps = (
  i,
  m = __vite__mapDeps,
  d = m.f ||
    (m.f = [
      "assets/code-block-37QAKDTI-DWcemtTa.js",
      "assets/chunk-CFjPhJqf.js",
      "assets/jsx-runtime-bxCDpROR.js",
    ]),
) => i.map((i) => d[i]);
import { o as e, r as t, t as n } from "./chunk-CFjPhJqf.js";
import { n as r, t as i } from "./jsx-runtime-bxCDpROR.js";
import { t as a } from "./preload-helper-CM8YhcCa.js";
function o(e) {
  var t,
    n,
    r = ``;
  if (typeof e == `string` || typeof e == `number`) r += e;
  else if (typeof e == `object`)
    if (Array.isArray(e)) {
      var i = e.length;
      for (t = 0; t < i; t++)
        e[t] && (n = o(e[t])) && (r && (r += ` `), (r += n));
    } else for (n in e) e[n] && (r && (r += ` `), (r += n));
  return r;
}
function s() {
  for (var e, t, n = 0, r = ``, i = arguments.length; n < i; n++)
    (e = arguments[n]) && (t = o(e)) && (r && (r += ` `), (r += t));
  return r;
}
function c() {}
var l = x(/[A-Za-z]/),
  u = x(/[\dA-Za-z]/),
  d = x(/[#-'*+\--9=?A-Z^-~]/);
function f(e) {
  return e !== null && (e < 32 || e === 127);
}
var p = x(/\d/),
  m = x(/[\dA-Fa-f]/),
  h = x(/[!-/:-@[-`{-~]/);
function g(e) {
  return e !== null && e < -2;
}
function _(e) {
  return e !== null && (e < 0 || e === 32);
}
function v(e) {
  return e === -2 || e === -1 || e === 32;
}
var y = x(/\p{P}|\p{S}/u),
  b = x(/\s/);
function x(e) {
  return t;
  function t(t) {
    return t !== null && t > -1 && e.test(String.fromCharCode(t));
  }
}
function S(e, t, n, r) {
  let i = e.length,
    a = 0,
    o;
  if (
    ((t = t < 0 ? (-t > i ? 0 : i + t) : t > i ? i : t),
    (n = n > 0 ? n : 0),
    r.length < 1e4)
  )
    ((o = Array.from(r)), o.unshift(t, n), e.splice(...o));
  else
    for (n && e.splice(t, n); a < r.length; )
      ((o = r.slice(a, a + 1e4)),
        o.unshift(t, 0),
        e.splice(...o),
        (a += 1e4),
        (t += 1e4));
}
function C(e, t) {
  return e.length > 0 ? (S(e, e.length, 0, t), e) : t;
}
function w(e, t, n) {
  let r = [],
    i = -1;
  for (; ++i < e.length; ) {
    let a = e[i].resolveAll;
    a && !r.includes(a) && ((t = a(t, n)), r.push(a));
  }
  return t;
}
var T = function (e) {
  if (e == null) return ne;
  if (typeof e == `function`) return te(e);
  if (typeof e == `object`) return Array.isArray(e) ? E(e) : D(e);
  if (typeof e == `string`) return ee(e);
  throw Error(`Expected function, string, or object as test`);
};
function E(e) {
  let t = [],
    n = -1;
  for (; ++n < e.length; ) t[n] = T(e[n]);
  return te(r);
  function r(...e) {
    let n = -1;
    for (; ++n < t.length; ) if (t[n].apply(this, e)) return !0;
    return !1;
  }
}
function D(e) {
  let t = e;
  return te(n);
  function n(n) {
    let r = n,
      i;
    for (i in e) if (r[i] !== t[i]) return !1;
    return !0;
  }
}
function ee(e) {
  return te(t);
  function t(t) {
    return t && t.type === e;
  }
}
function te(e) {
  return t;
  function t(t, n, r) {
    return !!(
      re(t) && e.call(this, t, typeof n == `number` ? n : void 0, r || void 0)
    );
  }
}
function ne() {
  return !0;
}
function re(e) {
  return typeof e == `object` && !!e && `type` in e;
}
function ie(e) {
  return e;
}
var O = [],
  k = `skip`;
function ae(e, t, n, r) {
  let i;
  typeof t == `function` && typeof n != `function`
    ? ((r = n), (n = t))
    : (i = t);
  let a = T(i),
    o = r ? -1 : 1;
  s(e, void 0, [])();
  function s(e, i, c) {
    let l = e && typeof e == `object` ? e : {};
    if (typeof l.type == `string`) {
      let t =
        typeof l.tagName == `string`
          ? l.tagName
          : typeof l.name == `string`
            ? l.name
            : void 0;
      Object.defineProperty(u, `name`, {
        value: `node (` + ie(e.type + (t ? `<` + t + `>` : ``)) + `)`,
      });
    }
    return u;
    function u() {
      let l = O,
        u,
        d,
        f;
      if (
        (!t || a(e, i, c[c.length - 1] || void 0)) &&
        ((l = oe(n(e, c))), l[0] === !1)
      )
        return l;
      if (`children` in e && e.children) {
        let t = e;
        if (t.children && l[0] !== `skip`)
          for (
            d = (r ? t.children.length : -1) + o, f = c.concat(t);
            d > -1 && d < t.children.length;
          ) {
            let e = t.children[d];
            if (((u = s(e, d, f)()), u[0] === !1)) return u;
            d = typeof u[1] == `number` ? u[1] : d + o;
          }
      }
      return l;
    }
  }
}
function oe(e) {
  return Array.isArray(e)
    ? e
    : typeof e == `number`
      ? [!0, e]
      : e == null
        ? O
        : [e];
}
function se(e, t, n, r) {
  let i, a, o;
  (typeof t == `function` && typeof n != `function`
    ? ((a = void 0), (o = t), (i = n))
    : ((a = t), (o = n), (i = r)),
    ae(e, a, s, i));
  function s(e, t) {
    let n = t[t.length - 1],
      r = n ? n.children.indexOf(e) : void 0;
    return o(e, r, n);
  }
}
var ce = [
    `area`,
    `base`,
    `basefont`,
    `bgsound`,
    `br`,
    `col`,
    `command`,
    `embed`,
    `frame`,
    `hr`,
    `image`,
    `img`,
    `input`,
    `keygen`,
    `link`,
    `meta`,
    `param`,
    `source`,
    `track`,
    `wbr`,
  ],
  A = class {
    constructor(e, t, n) {
      ((this.normal = t), (this.property = e), n && (this.space = n));
    }
  };
((A.prototype.normal = {}),
  (A.prototype.property = {}),
  (A.prototype.space = void 0));
function le(e, t) {
  let n = {},
    r = {};
  for (let t of e) (Object.assign(n, t.property), Object.assign(r, t.normal));
  return new A(n, r, t);
}
function ue(e) {
  return e.toLowerCase();
}
var de = class {
  constructor(e, t) {
    ((this.attribute = t), (this.property = e));
  }
};
((de.prototype.attribute = ``),
  (de.prototype.booleanish = !1),
  (de.prototype.boolean = !1),
  (de.prototype.commaOrSpaceSeparated = !1),
  (de.prototype.commaSeparated = !1),
  (de.prototype.defined = !1),
  (de.prototype.mustUseProperty = !1),
  (de.prototype.number = !1),
  (de.prototype.overloadedBoolean = !1),
  (de.prototype.property = ``),
  (de.prototype.spaceSeparated = !1),
  (de.prototype.space = void 0));
var j = t({
    boolean: () => M,
    booleanish: () => N,
    commaOrSpaceSeparated: () => he,
    commaSeparated: () => me,
    number: () => P,
    overloadedBoolean: () => pe,
    spaceSeparated: () => F,
  }),
  fe = 0,
  M = ge(),
  N = ge(),
  pe = ge(),
  P = ge(),
  F = ge(),
  me = ge(),
  he = ge();
function ge() {
  return 2 ** ++fe;
}
var _e = Object.keys(j),
  ve = class extends de {
    constructor(e, t, n, r) {
      let i = -1;
      if ((super(e, t), ye(this, `space`, r), typeof n == `number`))
        for (; ++i < _e.length; ) {
          let e = _e[i];
          ye(this, _e[i], (n & j[e]) === j[e]);
        }
    }
  };
ve.prototype.defined = !0;
function ye(e, t, n) {
  n && (e[t] = n);
}
function be(e) {
  let t = {},
    n = {};
  for (let [r, i] of Object.entries(e.properties)) {
    let a = new ve(r, e.transform(e.attributes || {}, r), i, e.space);
    (e.mustUseProperty &&
      e.mustUseProperty.includes(r) &&
      (a.mustUseProperty = !0),
      (t[r] = a),
      (n[ue(r)] = r),
      (n[ue(a.attribute)] = r));
  }
  return new A(t, n, e.space);
}
var xe = be({
  properties: {
    ariaActiveDescendant: null,
    ariaAtomic: N,
    ariaAutoComplete: null,
    ariaBusy: N,
    ariaChecked: N,
    ariaColCount: P,
    ariaColIndex: P,
    ariaColSpan: P,
    ariaControls: F,
    ariaCurrent: null,
    ariaDescribedBy: F,
    ariaDetails: null,
    ariaDisabled: N,
    ariaDropEffect: F,
    ariaErrorMessage: null,
    ariaExpanded: N,
    ariaFlowTo: F,
    ariaGrabbed: N,
    ariaHasPopup: null,
    ariaHidden: N,
    ariaInvalid: null,
    ariaKeyShortcuts: null,
    ariaLabel: null,
    ariaLabelledBy: F,
    ariaLevel: P,
    ariaLive: null,
    ariaModal: N,
    ariaMultiLine: N,
    ariaMultiSelectable: N,
    ariaOrientation: null,
    ariaOwns: F,
    ariaPlaceholder: null,
    ariaPosInSet: P,
    ariaPressed: N,
    ariaReadOnly: N,
    ariaRelevant: null,
    ariaRequired: N,
    ariaRoleDescription: F,
    ariaRowCount: P,
    ariaRowIndex: P,
    ariaRowSpan: P,
    ariaSelected: N,
    ariaSetSize: P,
    ariaSort: null,
    ariaValueMax: P,
    ariaValueMin: P,
    ariaValueNow: P,
    ariaValueText: null,
    role: null,
  },
  transform(e, t) {
    return t === `role` ? t : `aria-` + t.slice(4).toLowerCase();
  },
});
function Se(e, t) {
  return t in e ? e[t] : t;
}
function Ce(e, t) {
  return Se(e, t.toLowerCase());
}
var we = be({
    attributes: {
      acceptcharset: `accept-charset`,
      classname: `class`,
      htmlfor: `for`,
      httpequiv: `http-equiv`,
    },
    mustUseProperty: [`checked`, `multiple`, `muted`, `selected`],
    properties: {
      abbr: null,
      accept: me,
      acceptCharset: F,
      accessKey: F,
      action: null,
      allow: null,
      allowFullScreen: M,
      allowPaymentRequest: M,
      allowUserMedia: M,
      alt: null,
      as: null,
      async: M,
      autoCapitalize: null,
      autoComplete: F,
      autoFocus: M,
      autoPlay: M,
      blocking: F,
      capture: null,
      charSet: null,
      checked: M,
      cite: null,
      className: F,
      cols: P,
      colSpan: null,
      content: null,
      contentEditable: N,
      controls: M,
      controlsList: F,
      coords: P | me,
      crossOrigin: null,
      data: null,
      dateTime: null,
      decoding: null,
      default: M,
      defer: M,
      dir: null,
      dirName: null,
      disabled: M,
      download: pe,
      draggable: N,
      encType: null,
      enterKeyHint: null,
      fetchPriority: null,
      form: null,
      formAction: null,
      formEncType: null,
      formMethod: null,
      formNoValidate: M,
      formTarget: null,
      headers: F,
      height: P,
      hidden: pe,
      high: P,
      href: null,
      hrefLang: null,
      htmlFor: F,
      httpEquiv: F,
      id: null,
      imageSizes: null,
      imageSrcSet: null,
      inert: M,
      inputMode: null,
      integrity: null,
      is: null,
      isMap: M,
      itemId: null,
      itemProp: F,
      itemRef: F,
      itemScope: M,
      itemType: F,
      kind: null,
      label: null,
      lang: null,
      language: null,
      list: null,
      loading: null,
      loop: M,
      low: P,
      manifest: null,
      max: null,
      maxLength: P,
      media: null,
      method: null,
      min: null,
      minLength: P,
      multiple: M,
      muted: M,
      name: null,
      nonce: null,
      noModule: M,
      noValidate: M,
      onAbort: null,
      onAfterPrint: null,
      onAuxClick: null,
      onBeforeMatch: null,
      onBeforePrint: null,
      onBeforeToggle: null,
      onBeforeUnload: null,
      onBlur: null,
      onCancel: null,
      onCanPlay: null,
      onCanPlayThrough: null,
      onChange: null,
      onClick: null,
      onClose: null,
      onContextLost: null,
      onContextMenu: null,
      onContextRestored: null,
      onCopy: null,
      onCueChange: null,
      onCut: null,
      onDblClick: null,
      onDrag: null,
      onDragEnd: null,
      onDragEnter: null,
      onDragExit: null,
      onDragLeave: null,
      onDragOver: null,
      onDragStart: null,
      onDrop: null,
      onDurationChange: null,
      onEmptied: null,
      onEnded: null,
      onError: null,
      onFocus: null,
      onFormData: null,
      onHashChange: null,
      onInput: null,
      onInvalid: null,
      onKeyDown: null,
      onKeyPress: null,
      onKeyUp: null,
      onLanguageChange: null,
      onLoad: null,
      onLoadedData: null,
      onLoadedMetadata: null,
      onLoadEnd: null,
      onLoadStart: null,
      onMessage: null,
      onMessageError: null,
      onMouseDown: null,
      onMouseEnter: null,
      onMouseLeave: null,
      onMouseMove: null,
      onMouseOut: null,
      onMouseOver: null,
      onMouseUp: null,
      onOffline: null,
      onOnline: null,
      onPageHide: null,
      onPageShow: null,
      onPaste: null,
      onPause: null,
      onPlay: null,
      onPlaying: null,
      onPopState: null,
      onProgress: null,
      onRateChange: null,
      onRejectionHandled: null,
      onReset: null,
      onResize: null,
      onScroll: null,
      onScrollEnd: null,
      onSecurityPolicyViolation: null,
      onSeeked: null,
      onSeeking: null,
      onSelect: null,
      onSlotChange: null,
      onStalled: null,
      onStorage: null,
      onSubmit: null,
      onSuspend: null,
      onTimeUpdate: null,
      onToggle: null,
      onUnhandledRejection: null,
      onUnload: null,
      onVolumeChange: null,
      onWaiting: null,
      onWheel: null,
      open: M,
      optimum: P,
      pattern: null,
      ping: F,
      placeholder: null,
      playsInline: M,
      popover: null,
      popoverTarget: null,
      popoverTargetAction: null,
      poster: null,
      preload: null,
      readOnly: M,
      referrerPolicy: null,
      rel: F,
      required: M,
      reversed: M,
      rows: P,
      rowSpan: P,
      sandbox: F,
      scope: null,
      scoped: M,
      seamless: M,
      selected: M,
      shadowRootClonable: M,
      shadowRootDelegatesFocus: M,
      shadowRootMode: null,
      shape: null,
      size: P,
      sizes: null,
      slot: null,
      span: P,
      spellCheck: N,
      src: null,
      srcDoc: null,
      srcLang: null,
      srcSet: null,
      start: P,
      step: null,
      style: null,
      tabIndex: P,
      target: null,
      title: null,
      translate: null,
      type: null,
      typeMustMatch: M,
      useMap: null,
      value: N,
      width: P,
      wrap: null,
      writingSuggestions: null,
      align: null,
      aLink: null,
      archive: F,
      axis: null,
      background: null,
      bgColor: null,
      border: P,
      borderColor: null,
      bottomMargin: P,
      cellPadding: null,
      cellSpacing: null,
      char: null,
      charOff: null,
      classId: null,
      clear: null,
      code: null,
      codeBase: null,
      codeType: null,
      color: null,
      compact: M,
      declare: M,
      event: null,
      face: null,
      frame: null,
      frameBorder: null,
      hSpace: P,
      leftMargin: P,
      link: null,
      longDesc: null,
      lowSrc: null,
      marginHeight: P,
      marginWidth: P,
      noResize: M,
      noHref: M,
      noShade: M,
      noWrap: M,
      object: null,
      profile: null,
      prompt: null,
      rev: null,
      rightMargin: P,
      rules: null,
      scheme: null,
      scrolling: N,
      standby: null,
      summary: null,
      text: null,
      topMargin: P,
      valueType: null,
      version: null,
      vAlign: null,
      vLink: null,
      vSpace: P,
      allowTransparency: null,
      autoCorrect: null,
      autoSave: null,
      disablePictureInPicture: M,
      disableRemotePlayback: M,
      prefix: null,
      property: null,
      results: P,
      security: null,
      unselectable: null,
    },
    space: `html`,
    transform: Ce,
  }),
  Te = be({
    attributes: {
      accentHeight: `accent-height`,
      alignmentBaseline: `alignment-baseline`,
      arabicForm: `arabic-form`,
      baselineShift: `baseline-shift`,
      capHeight: `cap-height`,
      className: `class`,
      clipPath: `clip-path`,
      clipRule: `clip-rule`,
      colorInterpolation: `color-interpolation`,
      colorInterpolationFilters: `color-interpolation-filters`,
      colorProfile: `color-profile`,
      colorRendering: `color-rendering`,
      crossOrigin: `crossorigin`,
      dataType: `datatype`,
      dominantBaseline: `dominant-baseline`,
      enableBackground: `enable-background`,
      fillOpacity: `fill-opacity`,
      fillRule: `fill-rule`,
      floodColor: `flood-color`,
      floodOpacity: `flood-opacity`,
      fontFamily: `font-family`,
      fontSize: `font-size`,
      fontSizeAdjust: `font-size-adjust`,
      fontStretch: `font-stretch`,
      fontStyle: `font-style`,
      fontVariant: `font-variant`,
      fontWeight: `font-weight`,
      glyphName: `glyph-name`,
      glyphOrientationHorizontal: `glyph-orientation-horizontal`,
      glyphOrientationVertical: `glyph-orientation-vertical`,
      hrefLang: `hreflang`,
      horizAdvX: `horiz-adv-x`,
      horizOriginX: `horiz-origin-x`,
      horizOriginY: `horiz-origin-y`,
      imageRendering: `image-rendering`,
      letterSpacing: `letter-spacing`,
      lightingColor: `lighting-color`,
      markerEnd: `marker-end`,
      markerMid: `marker-mid`,
      markerStart: `marker-start`,
      navDown: `nav-down`,
      navDownLeft: `nav-down-left`,
      navDownRight: `nav-down-right`,
      navLeft: `nav-left`,
      navNext: `nav-next`,
      navPrev: `nav-prev`,
      navRight: `nav-right`,
      navUp: `nav-up`,
      navUpLeft: `nav-up-left`,
      navUpRight: `nav-up-right`,
      onAbort: `onabort`,
      onActivate: `onactivate`,
      onAfterPrint: `onafterprint`,
      onBeforePrint: `onbeforeprint`,
      onBegin: `onbegin`,
      onCancel: `oncancel`,
      onCanPlay: `oncanplay`,
      onCanPlayThrough: `oncanplaythrough`,
      onChange: `onchange`,
      onClick: `onclick`,
      onClose: `onclose`,
      onCopy: `oncopy`,
      onCueChange: `oncuechange`,
      onCut: `oncut`,
      onDblClick: `ondblclick`,
      onDrag: `ondrag`,
      onDragEnd: `ondragend`,
      onDragEnter: `ondragenter`,
      onDragExit: `ondragexit`,
      onDragLeave: `ondragleave`,
      onDragOver: `ondragover`,
      onDragStart: `ondragstart`,
      onDrop: `ondrop`,
      onDurationChange: `ondurationchange`,
      onEmptied: `onemptied`,
      onEnd: `onend`,
      onEnded: `onended`,
      onError: `onerror`,
      onFocus: `onfocus`,
      onFocusIn: `onfocusin`,
      onFocusOut: `onfocusout`,
      onHashChange: `onhashchange`,
      onInput: `oninput`,
      onInvalid: `oninvalid`,
      onKeyDown: `onkeydown`,
      onKeyPress: `onkeypress`,
      onKeyUp: `onkeyup`,
      onLoad: `onload`,
      onLoadedData: `onloadeddata`,
      onLoadedMetadata: `onloadedmetadata`,
      onLoadStart: `onloadstart`,
      onMessage: `onmessage`,
      onMouseDown: `onmousedown`,
      onMouseEnter: `onmouseenter`,
      onMouseLeave: `onmouseleave`,
      onMouseMove: `onmousemove`,
      onMouseOut: `onmouseout`,
      onMouseOver: `onmouseover`,
      onMouseUp: `onmouseup`,
      onMouseWheel: `onmousewheel`,
      onOffline: `onoffline`,
      onOnline: `ononline`,
      onPageHide: `onpagehide`,
      onPageShow: `onpageshow`,
      onPaste: `onpaste`,
      onPause: `onpause`,
      onPlay: `onplay`,
      onPlaying: `onplaying`,
      onPopState: `onpopstate`,
      onProgress: `onprogress`,
      onRateChange: `onratechange`,
      onRepeat: `onrepeat`,
      onReset: `onreset`,
      onResize: `onresize`,
      onScroll: `onscroll`,
      onSeeked: `onseeked`,
      onSeeking: `onseeking`,
      onSelect: `onselect`,
      onShow: `onshow`,
      onStalled: `onstalled`,
      onStorage: `onstorage`,
      onSubmit: `onsubmit`,
      onSuspend: `onsuspend`,
      onTimeUpdate: `ontimeupdate`,
      onToggle: `ontoggle`,
      onUnload: `onunload`,
      onVolumeChange: `onvolumechange`,
      onWaiting: `onwaiting`,
      onZoom: `onzoom`,
      overlinePosition: `overline-position`,
      overlineThickness: `overline-thickness`,
      paintOrder: `paint-order`,
      panose1: `panose-1`,
      pointerEvents: `pointer-events`,
      referrerPolicy: `referrerpolicy`,
      renderingIntent: `rendering-intent`,
      shapeRendering: `shape-rendering`,
      stopColor: `stop-color`,
      stopOpacity: `stop-opacity`,
      strikethroughPosition: `strikethrough-position`,
      strikethroughThickness: `strikethrough-thickness`,
      strokeDashArray: `stroke-dasharray`,
      strokeDashOffset: `stroke-dashoffset`,
      strokeLineCap: `stroke-linecap`,
      strokeLineJoin: `stroke-linejoin`,
      strokeMiterLimit: `stroke-miterlimit`,
      strokeOpacity: `stroke-opacity`,
      strokeWidth: `stroke-width`,
      tabIndex: `tabindex`,
      textAnchor: `text-anchor`,
      textDecoration: `text-decoration`,
      textRendering: `text-rendering`,
      transformOrigin: `transform-origin`,
      typeOf: `typeof`,
      underlinePosition: `underline-position`,
      underlineThickness: `underline-thickness`,
      unicodeBidi: `unicode-bidi`,
      unicodeRange: `unicode-range`,
      unitsPerEm: `units-per-em`,
      vAlphabetic: `v-alphabetic`,
      vHanging: `v-hanging`,
      vIdeographic: `v-ideographic`,
      vMathematical: `v-mathematical`,
      vectorEffect: `vector-effect`,
      vertAdvY: `vert-adv-y`,
      vertOriginX: `vert-origin-x`,
      vertOriginY: `vert-origin-y`,
      wordSpacing: `word-spacing`,
      writingMode: `writing-mode`,
      xHeight: `x-height`,
      playbackOrder: `playbackorder`,
      timelineBegin: `timelinebegin`,
    },
    properties: {
      about: he,
      accentHeight: P,
      accumulate: null,
      additive: null,
      alignmentBaseline: null,
      alphabetic: P,
      amplitude: P,
      arabicForm: null,
      ascent: P,
      attributeName: null,
      attributeType: null,
      azimuth: P,
      bandwidth: null,
      baselineShift: null,
      baseFrequency: null,
      baseProfile: null,
      bbox: null,
      begin: null,
      bias: P,
      by: null,
      calcMode: null,
      capHeight: P,
      className: F,
      clip: null,
      clipPath: null,
      clipPathUnits: null,
      clipRule: null,
      color: null,
      colorInterpolation: null,
      colorInterpolationFilters: null,
      colorProfile: null,
      colorRendering: null,
      content: null,
      contentScriptType: null,
      contentStyleType: null,
      crossOrigin: null,
      cursor: null,
      cx: null,
      cy: null,
      d: null,
      dataType: null,
      defaultAction: null,
      descent: P,
      diffuseConstant: P,
      direction: null,
      display: null,
      dur: null,
      divisor: P,
      dominantBaseline: null,
      download: M,
      dx: null,
      dy: null,
      edgeMode: null,
      editable: null,
      elevation: P,
      enableBackground: null,
      end: null,
      event: null,
      exponent: P,
      externalResourcesRequired: null,
      fill: null,
      fillOpacity: P,
      fillRule: null,
      filter: null,
      filterRes: null,
      filterUnits: null,
      floodColor: null,
      floodOpacity: null,
      focusable: null,
      focusHighlight: null,
      fontFamily: null,
      fontSize: null,
      fontSizeAdjust: null,
      fontStretch: null,
      fontStyle: null,
      fontVariant: null,
      fontWeight: null,
      format: null,
      fr: null,
      from: null,
      fx: null,
      fy: null,
      g1: me,
      g2: me,
      glyphName: me,
      glyphOrientationHorizontal: null,
      glyphOrientationVertical: null,
      glyphRef: null,
      gradientTransform: null,
      gradientUnits: null,
      handler: null,
      hanging: P,
      hatchContentUnits: null,
      hatchUnits: null,
      height: null,
      href: null,
      hrefLang: null,
      horizAdvX: P,
      horizOriginX: P,
      horizOriginY: P,
      id: null,
      ideographic: P,
      imageRendering: null,
      initialVisibility: null,
      in: null,
      in2: null,
      intercept: P,
      k: P,
      k1: P,
      k2: P,
      k3: P,
      k4: P,
      kernelMatrix: he,
      kernelUnitLength: null,
      keyPoints: null,
      keySplines: null,
      keyTimes: null,
      kerning: null,
      lang: null,
      lengthAdjust: null,
      letterSpacing: null,
      lightingColor: null,
      limitingConeAngle: P,
      local: null,
      markerEnd: null,
      markerMid: null,
      markerStart: null,
      markerHeight: null,
      markerUnits: null,
      markerWidth: null,
      mask: null,
      maskContentUnits: null,
      maskUnits: null,
      mathematical: null,
      max: null,
      media: null,
      mediaCharacterEncoding: null,
      mediaContentEncodings: null,
      mediaSize: P,
      mediaTime: null,
      method: null,
      min: null,
      mode: null,
      name: null,
      navDown: null,
      navDownLeft: null,
      navDownRight: null,
      navLeft: null,
      navNext: null,
      navPrev: null,
      navRight: null,
      navUp: null,
      navUpLeft: null,
      navUpRight: null,
      numOctaves: null,
      observer: null,
      offset: null,
      onAbort: null,
      onActivate: null,
      onAfterPrint: null,
      onBeforePrint: null,
      onBegin: null,
      onCancel: null,
      onCanPlay: null,
      onCanPlayThrough: null,
      onChange: null,
      onClick: null,
      onClose: null,
      onCopy: null,
      onCueChange: null,
      onCut: null,
      onDblClick: null,
      onDrag: null,
      onDragEnd: null,
      onDragEnter: null,
      onDragExit: null,
      onDragLeave: null,
      onDragOver: null,
      onDragStart: null,
      onDrop: null,
      onDurationChange: null,
      onEmptied: null,
      onEnd: null,
      onEnded: null,
      onError: null,
      onFocus: null,
      onFocusIn: null,
      onFocusOut: null,
      onHashChange: null,
      onInput: null,
      onInvalid: null,
      onKeyDown: null,
      onKeyPress: null,
      onKeyUp: null,
      onLoad: null,
      onLoadedData: null,
      onLoadedMetadata: null,
      onLoadStart: null,
      onMessage: null,
      onMouseDown: null,
      onMouseEnter: null,
      onMouseLeave: null,
      onMouseMove: null,
      onMouseOut: null,
      onMouseOver: null,
      onMouseUp: null,
      onMouseWheel: null,
      onOffline: null,
      onOnline: null,
      onPageHide: null,
      onPageShow: null,
      onPaste: null,
      onPause: null,
      onPlay: null,
      onPlaying: null,
      onPopState: null,
      onProgress: null,
      onRateChange: null,
      onRepeat: null,
      onReset: null,
      onResize: null,
      onScroll: null,
      onSeeked: null,
      onSeeking: null,
      onSelect: null,
      onShow: null,
      onStalled: null,
      onStorage: null,
      onSubmit: null,
      onSuspend: null,
      onTimeUpdate: null,
      onToggle: null,
      onUnload: null,
      onVolumeChange: null,
      onWaiting: null,
      onZoom: null,
      opacity: null,
      operator: null,
      order: null,
      orient: null,
      orientation: null,
      origin: null,
      overflow: null,
      overlay: null,
      overlinePosition: P,
      overlineThickness: P,
      paintOrder: null,
      panose1: null,
      path: null,
      pathLength: P,
      patternContentUnits: null,
      patternTransform: null,
      patternUnits: null,
      phase: null,
      ping: F,
      pitch: null,
      playbackOrder: null,
      pointerEvents: null,
      points: null,
      pointsAtX: P,
      pointsAtY: P,
      pointsAtZ: P,
      preserveAlpha: null,
      preserveAspectRatio: null,
      primitiveUnits: null,
      propagate: null,
      property: he,
      r: null,
      radius: null,
      referrerPolicy: null,
      refX: null,
      refY: null,
      rel: he,
      rev: he,
      renderingIntent: null,
      repeatCount: null,
      repeatDur: null,
      requiredExtensions: he,
      requiredFeatures: he,
      requiredFonts: he,
      requiredFormats: he,
      resource: null,
      restart: null,
      result: null,
      rotate: null,
      rx: null,
      ry: null,
      scale: null,
      seed: null,
      shapeRendering: null,
      side: null,
      slope: null,
      snapshotTime: null,
      specularConstant: P,
      specularExponent: P,
      spreadMethod: null,
      spacing: null,
      startOffset: null,
      stdDeviation: null,
      stemh: null,
      stemv: null,
      stitchTiles: null,
      stopColor: null,
      stopOpacity: null,
      strikethroughPosition: P,
      strikethroughThickness: P,
      string: null,
      stroke: null,
      strokeDashArray: he,
      strokeDashOffset: null,
      strokeLineCap: null,
      strokeLineJoin: null,
      strokeMiterLimit: P,
      strokeOpacity: P,
      strokeWidth: null,
      style: null,
      surfaceScale: P,
      syncBehavior: null,
      syncBehaviorDefault: null,
      syncMaster: null,
      syncTolerance: null,
      syncToleranceDefault: null,
      systemLanguage: he,
      tabIndex: P,
      tableValues: null,
      target: null,
      targetX: P,
      targetY: P,
      textAnchor: null,
      textDecoration: null,
      textRendering: null,
      textLength: null,
      timelineBegin: null,
      title: null,
      transformBehavior: null,
      type: null,
      typeOf: he,
      to: null,
      transform: null,
      transformOrigin: null,
      u1: null,
      u2: null,
      underlinePosition: P,
      underlineThickness: P,
      unicode: null,
      unicodeBidi: null,
      unicodeRange: null,
      unitsPerEm: P,
      values: null,
      vAlphabetic: P,
      vMathematical: P,
      vectorEffect: null,
      vHanging: P,
      vIdeographic: P,
      version: null,
      vertAdvY: P,
      vertOriginX: P,
      vertOriginY: P,
      viewBox: null,
      viewTarget: null,
      visibility: null,
      width: null,
      widths: null,
      wordSpacing: null,
      writingMode: null,
      x: null,
      x1: null,
      x2: null,
      xChannelSelector: null,
      xHeight: P,
      y: null,
      y1: null,
      y2: null,
      yChannelSelector: null,
      z: null,
      zoomAndPan: null,
    },
    space: `svg`,
    transform: Se,
  }),
  Ee = be({
    properties: {
      xLinkActuate: null,
      xLinkArcRole: null,
      xLinkHref: null,
      xLinkRole: null,
      xLinkShow: null,
      xLinkTitle: null,
      xLinkType: null,
    },
    space: `xlink`,
    transform(e, t) {
      return `xlink:` + t.slice(5).toLowerCase();
    },
  }),
  De = be({
    attributes: { xmlnsxlink: `xmlns:xlink` },
    properties: { xmlnsXLink: null, xmlns: null },
    space: `xmlns`,
    transform: Ce,
  }),
  Oe = be({
    properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
    space: `xml`,
    transform(e, t) {
      return `xml:` + t.slice(3).toLowerCase();
    },
  }),
  ke = {
    classId: `classID`,
    dataType: `datatype`,
    itemId: `itemID`,
    strokeDashArray: `strokeDasharray`,
    strokeDashOffset: `strokeDashoffset`,
    strokeLineCap: `strokeLinecap`,
    strokeLineJoin: `strokeLinejoin`,
    strokeMiterLimit: `strokeMiterlimit`,
    typeOf: `typeof`,
    xLinkActuate: `xlinkActuate`,
    xLinkArcRole: `xlinkArcrole`,
    xLinkHref: `xlinkHref`,
    xLinkRole: `xlinkRole`,
    xLinkShow: `xlinkShow`,
    xLinkTitle: `xlinkTitle`,
    xLinkType: `xlinkType`,
    xmlnsXLink: `xmlnsXlink`,
  },
  Ae = /[A-Z]/g,
  je = /-[a-z]/g,
  Me = /^data[-\w.:]+$/i;
function Ne(e, t) {
  let n = ue(t),
    r = t,
    i = de;
  if (n in e.normal) return e.property[e.normal[n]];
  if (n.length > 4 && n.slice(0, 4) === `data` && Me.test(t)) {
    if (t.charAt(4) === `-`) {
      let e = t.slice(5).replace(je, Fe);
      r = `data` + e.charAt(0).toUpperCase() + e.slice(1);
    } else {
      let e = t.slice(4);
      if (!je.test(e)) {
        let n = e.replace(Ae, Pe);
        (n.charAt(0) !== `-` && (n = `-` + n), (t = `data` + n));
      }
    }
    i = ve;
  }
  return new i(r, t);
}
function Pe(e) {
  return `-` + e.toLowerCase();
}
function Fe(e) {
  return e.charAt(1).toUpperCase();
}
var Ie = le([xe, we, Ee, De, Oe], `html`),
  Le = le([xe, Te, Ee, De, Oe], `svg`),
  Re = {}.hasOwnProperty;
function ze(e, t) {
  let n = t || {};
  function r(t, ...n) {
    let i = r.invalid,
      a = r.handlers;
    if (t && Re.call(t, e)) {
      let n = String(t[e]);
      i = Re.call(a, n) ? a[n] : r.unknown;
    }
    if (i) return i.call(this, t, ...n);
  }
  return (
    (r.handlers = n.handlers || {}),
    (r.invalid = n.invalid),
    (r.unknown = n.unknown),
    r
  );
}
function Be(e, t) {
  let n = String(e);
  if (typeof t != `string`) throw TypeError(`Expected character`);
  let r = 0,
    i = n.indexOf(t);
  for (; i !== -1; ) (r++, (i = n.indexOf(t, i + t.length)));
  return r;
}
function Ve(e) {
  let t = [],
    n = String(e || ``),
    r = n.indexOf(`,`),
    i = 0,
    a = !1;
  for (; !a; ) {
    r === -1 && ((r = n.length), (a = !0));
    let e = n.slice(i, r).trim();
    ((e || !a) && t.push(e), (i = r + 1), (r = n.indexOf(`,`, i)));
  }
  return t;
}
function He(e, t) {
  let n = t || {};
  return (e[e.length - 1] === `` ? [...e, ``] : e)
    .join((n.padRight ? ` ` : ``) + `,` + (n.padLeft === !1 ? `` : ` `))
    .trim();
}
function Ue(e) {
  let t = String(e || ``).trim();
  return t ? t.split(/[ \t\n\r\f]+/g) : [];
}
function We(e) {
  return e.join(` `).trim();
}
var Ge = /[ \t\n\f\r]/g;
function Ke(e) {
  return typeof e == `object` ? (e.type === `text` ? qe(e.value) : !1) : qe(e);
}
function qe(e) {
  return e.replace(Ge, ``) === ``;
}
var Je = /[#.]/g;
function Ye(e, t) {
  let n = e || ``,
    r = {},
    i = 0,
    a,
    o;
  for (; i < n.length; ) {
    Je.lastIndex = i;
    let e = Je.exec(n),
      t = n.slice(i, e ? e.index : n.length);
    (t &&
      (a
        ? a === `#`
          ? (r.id = t)
          : Array.isArray(r.className)
            ? r.className.push(t)
            : (r.className = [t])
        : (o = t),
      (i += t.length)),
      e && ((a = e[0]), i++));
  }
  return {
    type: `element`,
    tagName: o || t || `div`,
    properties: r,
    children: [],
  };
}
function Xe(e, t, n) {
  let r = n ? nt(n) : void 0;
  function i(n, i, ...a) {
    let o;
    if (n == null) {
      o = { type: `root`, children: [] };
      let e = i;
      a.unshift(e);
    } else {
      o = Ye(n, t);
      let s = o.tagName.toLowerCase(),
        c = r ? r.get(s) : void 0;
      if (((o.tagName = c || s), Ze(i))) a.unshift(i);
      else for (let [t, n] of Object.entries(i)) Qe(e, o.properties, t, n);
    }
    for (let e of a) $e(o.children, e);
    return (
      o.type === `element` &&
        o.tagName === `template` &&
        ((o.content = { type: `root`, children: o.children }),
        (o.children = [])),
      o
    );
  }
  return i;
}
function Ze(e) {
  if (typeof e != `object` || !e || Array.isArray(e)) return !0;
  if (typeof e.type != `string`) return !1;
  let t = e,
    n = Object.keys(e);
  for (let e of n) {
    let n = t[e];
    if (n && typeof n == `object`) {
      if (!Array.isArray(n)) return !0;
      let e = n;
      for (let t of e)
        if (typeof t != `number` && typeof t != `string`) return !0;
    }
  }
  return !!(`children` in e && Array.isArray(e.children));
}
function Qe(e, t, n, r) {
  let i = Ne(e, n),
    a;
  if (r != null) {
    if (typeof r == `number`) {
      if (Number.isNaN(r)) return;
      a = r;
    } else
      a =
        typeof r == `boolean`
          ? r
          : typeof r == `string`
            ? i.spaceSeparated
              ? Ue(r)
              : i.commaSeparated
                ? Ve(r)
                : i.commaOrSpaceSeparated
                  ? Ue(Ve(r).join(` `))
                  : et(i, i.property, r)
            : Array.isArray(r)
              ? [...r]
              : i.property === `style`
                ? tt(r)
                : String(r);
    if (Array.isArray(a)) {
      let e = [];
      for (let t of a) e.push(et(i, i.property, t));
      a = e;
    }
    (i.property === `className` &&
      Array.isArray(t.className) &&
      (a = t.className.concat(a)),
      (t[i.property] = a));
  }
}
function $e(e, t) {
  if (t != null)
    if (typeof t == `number` || typeof t == `string`)
      e.push({ type: `text`, value: String(t) });
    else if (Array.isArray(t)) for (let n of t) $e(e, n);
    else if (typeof t == `object` && `type` in t)
      t.type === `root` ? $e(e, t.children) : e.push(t);
    else throw Error("Expected node, nodes, or string, got `" + t + "`");
}
function et(e, t, n) {
  if (typeof n == `string`) {
    if (e.number && n && !Number.isNaN(Number(n))) return Number(n);
    if ((e.boolean || e.overloadedBoolean) && (n === `` || ue(n) === ue(t)))
      return !0;
  }
  return n;
}
function tt(e) {
  let t = [];
  for (let [n, r] of Object.entries(e)) t.push([n, r].join(`: `));
  return t.join(`; `);
}
function nt(e) {
  let t = new Map();
  for (let n of e) t.set(n.toLowerCase(), n);
  return t;
}
var rt =
    `altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feDropShadow.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.solidColor.textArea.textPath`.split(
      `.`,
    ),
  it = Xe(Ie, `div`),
  at = Xe(Le, `g`, rt),
  ot = {
    html: `http://www.w3.org/1999/xhtml`,
    mathml: `http://www.w3.org/1998/Math/MathML`,
    svg: `http://www.w3.org/2000/svg`,
    xlink: `http://www.w3.org/1999/xlink`,
    xml: `http://www.w3.org/XML/1998/namespace`,
    xmlns: `http://www.w3.org/2000/xmlns/`,
  };
function st(e, t) {
  let n = String(e),
    r = n.indexOf(t),
    i = r,
    a = 0,
    o = 0;
  if (typeof t != `string`) throw TypeError(`Expected substring`);
  for (; r !== -1; )
    (r === i ? ++a > o && (o = a) : (a = 1),
      (i = r + t.length),
      (r = n.indexOf(t, i)));
  return o;
}
function I(e, t, n, r) {
  let i = r ? r - 1 : 1 / 0,
    a = 0;
  return o;
  function o(r) {
    return v(r) ? (e.enter(n), s(r)) : t(r);
  }
  function s(r) {
    return v(r) && a++ < i ? (e.consume(r), s) : (e.exit(n), t(r));
  }
}
function ct({
  defaultOrigin: e = ``,
  allowedLinkPrefixes: t = [],
  allowedImagePrefixes: n = [],
  allowDataImages: r = !1,
  allowedProtocols: i = [],
  blockedImageClass:
    a = `inline-block bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded text-sm`,
  blockedLinkClass: o = `text-gray-500`,
}) {
  let s = t.length && !t.every((e) => e === `*`),
    c = n.length && !n.every((e) => e === `*`);
  if (!e && (s || c))
    throw Error(
      `defaultOrigin is required when allowedLinkPrefixes or allowedImagePrefixes are provided`,
    );
  return (s) => {
    se(s, ht(e, t, n, r, i, a, o));
  };
}
function lt(e, t) {
  if (typeof e != `string`) return null;
  try {
    return new URL(e);
  } catch {
    if (t)
      try {
        return new URL(e, t);
      } catch {
        return null;
      }
    if (e.startsWith(`/`) || e.startsWith(`./`) || e.startsWith(`../`))
      try {
        return new URL(e, `http://example.com`);
      } catch {
        return null;
      }
    return null;
  }
}
function ut(e) {
  return typeof e == `string`
    ? e.startsWith(`/`) || e.startsWith(`./`) || e.startsWith(`../`)
    : !1;
}
var dt = new Set([
    `https:`,
    `http:`,
    `irc:`,
    `ircs:`,
    `mailto:`,
    `xmpp:`,
    `blob:`,
  ]),
  ft = new Set([`javascript:`, `data:`, `file:`, `vbscript:`]);
function pt(e, t, n, r = !1, i = !1, a = []) {
  if (!e) return null;
  if (typeof e == `string` && e.startsWith(`#`) && !i)
    try {
      if (new URL(e, `http://example.com`).hash === e) return e;
    } catch {}
  if (typeof e == `string` && e.startsWith(`data:`))
    return i && r && e.startsWith(`data:image/`) ? e : null;
  if (typeof e == `string` && e.startsWith(`blob:`)) {
    try {
      if (new URL(e).protocol === `blob:` && e.length > 5) {
        let t = e.substring(5);
        if (t && t.length > 0 && t !== `invalid`) return e;
      }
    } catch {
      return null;
    }
    return null;
  }
  let o = lt(e, n);
  if (
    !o ||
    ft.has(o.protocol) ||
    !(dt.has(o.protocol) || a.includes(o.protocol) || a.includes(`*`))
  )
    return null;
  if (o.protocol === `mailto:` || !o.protocol.match(/^https?:$/)) return o.href;
  let s = ut(e);
  return o &&
    t.some((e) => {
      let t = lt(e, n);
      return !t || t.origin !== o.origin ? !1 : o.href.startsWith(t.href);
    })
    ? s
      ? o.pathname + o.search + o.hash
      : o.href
    : t.includes(`*`)
      ? o.protocol !== `https:` && o.protocol !== `http:`
        ? null
        : s
          ? o.pathname + o.search + o.hash
          : o.href
      : null;
}
var mt = Symbol(`node-seen`),
  ht = (e, t, n, r, i, a, o) => {
    let s = (c, l, u) => {
      if (c.type !== `element` || c[mt]) return !0;
      if (c.tagName === `a`) {
        let n = pt(c.properties.href, t, e, !1, !1, i);
        return n === null
          ? ((c[mt] = !0),
            se(c, s),
            u &&
              typeof l == `number` &&
              (u.children[l] = {
                type: `element`,
                tagName: `span`,
                properties: {
                  title: `Blocked URL: ` + String(c.properties.href),
                  class: o,
                },
                children: [
                  ...c.children,
                  { type: `text`, value: ` [blocked]` },
                ],
              }),
            k)
          : ((c.properties.href = n),
            (c.properties.target = `_blank`),
            (c.properties.rel = `noopener noreferrer`),
            !0);
      }
      if (c.tagName === `img`) {
        let t = pt(c.properties.src, n, e, r, !0, i);
        return t === null
          ? ((c[mt] = !0),
            se(c, s),
            u &&
              typeof l == `number` &&
              (u.children[l] = {
                type: `element`,
                tagName: `span`,
                properties: { class: a },
                children: [
                  {
                    type: `text`,
                    value:
                      `[Image blocked: ` +
                      String(c.properties.alt || `No description`) +
                      `]`,
                  },
                ],
              }),
            k)
          : ((c.properties.src = t), !0);
      }
      return !0;
    };
    return s;
  },
  gt = typeof self == `object` ? self : globalThis,
  _t = (e, t) => {
    let n = (t, n) => (e.set(n, t), t),
      r = (i) => {
        if (e.has(i)) return e.get(i);
        let [a, o] = t[i];
        switch (a) {
          case 0:
          case -1:
            return n(o, i);
          case 1: {
            let e = n([], i);
            for (let t of o) e.push(r(t));
            return e;
          }
          case 2: {
            let e = n({}, i);
            for (let [t, n] of o) e[r(t)] = r(n);
            return e;
          }
          case 3:
            return n(new Date(o), i);
          case 4: {
            let { source: e, flags: t } = o;
            return n(new RegExp(e, t), i);
          }
          case 5: {
            let e = n(new Map(), i);
            for (let [t, n] of o) e.set(r(t), r(n));
            return e;
          }
          case 6: {
            let e = n(new Set(), i);
            for (let t of o) e.add(r(t));
            return e;
          }
          case 7: {
            let { name: e, message: t } = o;
            return n(new gt[e](t), i);
          }
          case 8:
            return n(BigInt(o), i);
          case `BigInt`:
            return n(Object(BigInt(o)), i);
          case `ArrayBuffer`:
            return n(new Uint8Array(o).buffer, o);
          case `DataView`: {
            let { buffer: e } = new Uint8Array(o);
            return n(new DataView(e), o);
          }
        }
        return n(new gt[a](o), i);
      };
    return r;
  },
  vt = (e) => _t(new Map(), e)(0),
  yt = ``,
  { toString: bt } = {},
  { keys: xt } = Object,
  St = (e) => {
    let t = typeof e;
    if (t !== `object` || !e) return [0, t];
    let n = bt.call(e).slice(8, -1);
    switch (n) {
      case `Array`:
        return [1, yt];
      case `Object`:
        return [2, yt];
      case `Date`:
        return [3, yt];
      case `RegExp`:
        return [4, yt];
      case `Map`:
        return [5, yt];
      case `Set`:
        return [6, yt];
      case `DataView`:
        return [1, n];
    }
    return n.includes(`Array`) ? [1, n] : n.includes(`Error`) ? [7, n] : [2, n];
  },
  Ct = ([e, t]) => e === 0 && (t === `function` || t === `symbol`),
  wt = (e, t, n, r) => {
    let i = (e, t) => {
        let i = r.push(e) - 1;
        return (n.set(t, i), i);
      },
      a = (r) => {
        if (n.has(r)) return n.get(r);
        let [o, s] = St(r);
        switch (o) {
          case 0: {
            let t = r;
            switch (s) {
              case `bigint`:
                ((o = 8), (t = r.toString()));
                break;
              case `function`:
              case `symbol`:
                if (e) throw TypeError(`unable to serialize ` + s);
                t = null;
                break;
              case `undefined`:
                return i([-1], r);
            }
            return i([o, t], r);
          }
          case 1: {
            if (s) {
              let e = r;
              return (
                s === `DataView`
                  ? (e = new Uint8Array(r.buffer))
                  : s === `ArrayBuffer` && (e = new Uint8Array(r)),
                i([s, [...e]], r)
              );
            }
            let e = [],
              t = i([o, e], r);
            for (let t of r) e.push(a(t));
            return t;
          }
          case 2: {
            if (s)
              switch (s) {
                case `BigInt`:
                  return i([s, r.toString()], r);
                case `Boolean`:
                case `Number`:
                case `String`:
                  return i([s, r.valueOf()], r);
              }
            if (t && `toJSON` in r) return a(r.toJSON());
            let n = [],
              c = i([o, n], r);
            for (let t of xt(r))
              (e || !Ct(St(r[t]))) && n.push([a(t), a(r[t])]);
            return c;
          }
          case 3:
            return i([o, r.toISOString()], r);
          case 4: {
            let { source: e, flags: t } = r;
            return i([o, { source: e, flags: t }], r);
          }
          case 5: {
            let t = [],
              n = i([o, t], r);
            for (let [n, i] of r)
              (e || !(Ct(St(n)) || Ct(St(i)))) && t.push([a(n), a(i)]);
            return n;
          }
          case 6: {
            let t = [],
              n = i([o, t], r);
            for (let n of r) (e || !Ct(St(n))) && t.push(a(n));
            return n;
          }
        }
        let { message: c } = r;
        return i([o, { name: s, message: c }], r);
      };
    return a;
  },
  Tt = (e, { json: t, lossy: n } = {}) => {
    let r = [];
    return (wt(!(t || n), !!t, new Map(), r)(e), r);
  },
  Et =
    typeof structuredClone == `function`
      ? (e, t) =>
          t && (`json` in t || `lossy` in t) ? vt(Tt(e, t)) : structuredClone(e)
      : (e, t) => vt(Tt(e, t));
function Dt(e) {
  let t = String(e),
    n = [];
  return { toOffset: i, toPoint: r };
  function r(e) {
    if (typeof e == `number` && e > -1 && e <= t.length) {
      let r = 0;
      for (;;) {
        let i = n[r];
        if (i === void 0) {
          let e = Ot(t, n[r - 1]);
          ((i = e === -1 ? t.length + 1 : e + 1), (n[r] = i));
        }
        if (i > e)
          return {
            line: r + 1,
            column: e - (r > 0 ? n[r - 1] : 0) + 1,
            offset: e,
          };
        r++;
      }
    }
  }
  function i(e) {
    if (
      e &&
      typeof e.line == `number` &&
      typeof e.column == `number` &&
      !Number.isNaN(e.line) &&
      !Number.isNaN(e.column)
    ) {
      for (; n.length < e.line; ) {
        let e = n[n.length - 1],
          r = Ot(t, e),
          i = r === -1 ? t.length + 1 : r + 1;
        if (e === i) break;
        n.push(i);
      }
      let r = (e.line > 1 ? n[e.line - 2] : 0) + e.column - 1;
      if (r < n[e.line - 1]) return r;
    }
  }
}
function Ot(e, t) {
  let n = e.indexOf(`\r`, t),
    r = e.indexOf(
      `
`,
      t,
    );
  return r === -1 ? n : n === -1 || n + 1 === r ? r : n < r ? n : r;
}
var kt = {}.hasOwnProperty,
  At = Object.prototype;
function jt(e, t) {
  let n = t || {};
  return Mt(
    {
      file: n.file || void 0,
      location: !1,
      schema: n.space === `svg` ? Le : Ie,
      verbose: n.verbose || !1,
    },
    e,
  );
}
function Mt(e, t) {
  let n;
  switch (t.nodeName) {
    case `#comment`: {
      let r = t;
      return ((n = { type: `comment`, value: r.data }), Ft(e, r, n), n);
    }
    case `#document`:
    case `#document-fragment`: {
      let r = t,
        i =
          `mode` in r ? r.mode === `quirks` || r.mode === `limited-quirks` : !1;
      if (
        ((n = {
          type: `root`,
          children: Nt(e, t.childNodes),
          data: { quirksMode: i },
        }),
        e.file && e.location)
      ) {
        let t = String(e.file),
          r = Dt(t),
          i = r.toPoint(0),
          a = r.toPoint(t.length);
        n.position = { start: i, end: a };
      }
      return n;
    }
    case `#documentType`: {
      let r = t;
      return ((n = { type: `doctype` }), Ft(e, r, n), n);
    }
    case `#text`: {
      let r = t;
      return ((n = { type: `text`, value: r.value }), Ft(e, r, n), n);
    }
    default:
      return ((n = Pt(e, t)), n);
  }
}
function Nt(e, t) {
  let n = -1,
    r = [];
  for (; ++n < t.length; ) {
    let i = Mt(e, t[n]);
    r.push(i);
  }
  return r;
}
function Pt(e, t) {
  let n = e.schema;
  e.schema = t.namespaceURI === ot.svg ? Le : Ie;
  let r = -1,
    i = {};
  for (; ++r < t.attrs.length; ) {
    let e = t.attrs[r],
      n = (e.prefix ? e.prefix + `:` : ``) + e.name;
    kt.call(At, n) || (i[n] = e.value);
  }
  let a = (e.schema.space === `svg` ? at : it)(
    t.tagName,
    i,
    Nt(e, t.childNodes),
  );
  if ((Ft(e, t, a), a.tagName === `template`)) {
    let n = t,
      r = n.sourceCodeLocation,
      i = r && r.startTag && Lt(r.startTag),
      o = r && r.endTag && Lt(r.endTag),
      s = Mt(e, n.content);
    (i && o && e.file && (s.position = { start: i.end, end: o.start }),
      (a.content = s));
  }
  return ((e.schema = n), a);
}
function Ft(e, t, n) {
  if (`sourceCodeLocation` in t && t.sourceCodeLocation && e.file) {
    let r = It(e, n, t.sourceCodeLocation);
    r && ((e.location = !0), (n.position = r));
  }
}
function It(e, t, n) {
  let r = Lt(n);
  if (t.type === `element`) {
    let i = t.children[t.children.length - 1];
    if (
      (r &&
        !n.endTag &&
        i &&
        i.position &&
        i.position.end &&
        (r.end = Object.assign({}, i.position.end)),
      e.verbose)
    ) {
      let r = {},
        i;
      if (n.attrs)
        for (i in n.attrs)
          kt.call(n.attrs, i) && (r[Ne(e.schema, i).property] = Lt(n.attrs[i]));
      n.startTag;
      let a = Lt(n.startTag),
        o = n.endTag ? Lt(n.endTag) : void 0,
        s = { opening: a };
      (o && (s.closing = o), (s.properties = r), (t.data = { position: s }));
    }
  }
  return r;
}
function Lt(e) {
  let t = Rt({ line: e.startLine, column: e.startCol, offset: e.startOffset }),
    n = Rt({ line: e.endLine, column: e.endCol, offset: e.endOffset });
  return t || n ? { start: t, end: n } : void 0;
}
function Rt(e) {
  return e.line && e.column ? e : void 0;
}
var zt = {},
  Bt = {}.hasOwnProperty,
  Vt = ze(`type`, {
    handlers: { root: Ut, element: Jt, text: Kt, comment: qt, doctype: Gt },
  });
function Ht(e, t) {
  let n = (t || zt).space;
  return Vt(e, n === `svg` ? Le : Ie);
}
function Ut(e, t) {
  let n = {
    nodeName: `#document`,
    mode: (e.data || {}).quirksMode ? `quirks` : `no-quirks`,
    childNodes: [],
  };
  return ((n.childNodes = Xt(e.children, n, t)), Zt(e, n), n);
}
function Wt(e, t) {
  let n = { nodeName: `#document-fragment`, childNodes: [] };
  return ((n.childNodes = Xt(e.children, n, t)), Zt(e, n), n);
}
function Gt(e) {
  let t = {
    nodeName: `#documentType`,
    name: `html`,
    publicId: ``,
    systemId: ``,
    parentNode: null,
  };
  return (Zt(e, t), t);
}
function Kt(e) {
  let t = { nodeName: `#text`, value: e.value, parentNode: null };
  return (Zt(e, t), t);
}
function qt(e) {
  let t = { nodeName: `#comment`, data: e.value, parentNode: null };
  return (Zt(e, t), t);
}
function Jt(e, t) {
  let n = t,
    r = n;
  e.type === `element` &&
    e.tagName.toLowerCase() === `svg` &&
    n.space === `html` &&
    (r = Le);
  let i = [],
    a;
  if (e.properties) {
    for (a in e.properties)
      if (a !== `children` && Bt.call(e.properties, a)) {
        let t = Yt(r, a, e.properties[a]);
        t && i.push(t);
      }
  }
  let o = r.space,
    s = {
      nodeName: e.tagName,
      tagName: e.tagName,
      attrs: i,
      namespaceURI: ot[o],
      childNodes: [],
      parentNode: null,
    };
  return (
    (s.childNodes = Xt(e.children, s, r)),
    Zt(e, s),
    e.tagName === `template` && e.content && (s.content = Wt(e.content, r)),
    s
  );
}
function Yt(e, t, n) {
  let r = Ne(e, t);
  if (
    n === !1 ||
    n == null ||
    (typeof n == `number` && Number.isNaN(n)) ||
    (!n && r.boolean)
  )
    return;
  Array.isArray(n) && (n = r.commaSeparated ? He(n) : We(n));
  let i = { name: r.attribute, value: n === !0 ? `` : String(n) };
  if (r.space && r.space !== `html` && r.space !== `svg`) {
    let e = i.name.indexOf(`:`);
    (e < 0
      ? (i.prefix = ``)
      : ((i.name = i.name.slice(e + 1)), (i.prefix = r.attribute.slice(0, e))),
      (i.namespace = ot[r.space]));
  }
  return i;
}
function Xt(e, t, n) {
  let r = -1,
    i = [];
  if (e)
    for (; ++r < e.length; ) {
      let a = Vt(e[r], n);
      ((a.parentNode = t), i.push(a));
    }
  return i;
}
function Zt(e, t) {
  let n = e.position;
  n &&
    n.start &&
    n.end &&
    (n.start.offset,
    n.end.offset,
    (t.sourceCodeLocation = {
      startLine: n.start.line,
      startCol: n.start.column,
      startOffset: n.start.offset,
      endLine: n.end.line,
      endCol: n.end.column,
      endOffset: n.end.offset,
    }));
}
var Qt = new Set([
    65534, 65535, 131070, 131071, 196606, 196607, 262142, 262143, 327678,
    327679, 393214, 393215, 458750, 458751, 524286, 524287, 589822, 589823,
    655358, 655359, 720894, 720895, 786430, 786431, 851966, 851967, 917502,
    917503, 983038, 983039, 1048574, 1048575, 1114110, 1114111,
  ]),
  L;
(function (e) {
  ((e[(e.EOF = -1)] = `EOF`),
    (e[(e.NULL = 0)] = `NULL`),
    (e[(e.TABULATION = 9)] = `TABULATION`),
    (e[(e.CARRIAGE_RETURN = 13)] = `CARRIAGE_RETURN`),
    (e[(e.LINE_FEED = 10)] = `LINE_FEED`),
    (e[(e.FORM_FEED = 12)] = `FORM_FEED`),
    (e[(e.SPACE = 32)] = `SPACE`),
    (e[(e.EXCLAMATION_MARK = 33)] = `EXCLAMATION_MARK`),
    (e[(e.QUOTATION_MARK = 34)] = `QUOTATION_MARK`),
    (e[(e.AMPERSAND = 38)] = `AMPERSAND`),
    (e[(e.APOSTROPHE = 39)] = `APOSTROPHE`),
    (e[(e.HYPHEN_MINUS = 45)] = `HYPHEN_MINUS`),
    (e[(e.SOLIDUS = 47)] = `SOLIDUS`),
    (e[(e.DIGIT_0 = 48)] = `DIGIT_0`),
    (e[(e.DIGIT_9 = 57)] = `DIGIT_9`),
    (e[(e.SEMICOLON = 59)] = `SEMICOLON`),
    (e[(e.LESS_THAN_SIGN = 60)] = `LESS_THAN_SIGN`),
    (e[(e.EQUALS_SIGN = 61)] = `EQUALS_SIGN`),
    (e[(e.GREATER_THAN_SIGN = 62)] = `GREATER_THAN_SIGN`),
    (e[(e.QUESTION_MARK = 63)] = `QUESTION_MARK`),
    (e[(e.LATIN_CAPITAL_A = 65)] = `LATIN_CAPITAL_A`),
    (e[(e.LATIN_CAPITAL_Z = 90)] = `LATIN_CAPITAL_Z`),
    (e[(e.RIGHT_SQUARE_BRACKET = 93)] = `RIGHT_SQUARE_BRACKET`),
    (e[(e.GRAVE_ACCENT = 96)] = `GRAVE_ACCENT`),
    (e[(e.LATIN_SMALL_A = 97)] = `LATIN_SMALL_A`),
    (e[(e.LATIN_SMALL_Z = 122)] = `LATIN_SMALL_Z`));
})((L ||= {}));
var $t = {
  DASH_DASH: `--`,
  CDATA_START: `[CDATA[`,
  DOCTYPE: `doctype`,
  SCRIPT: `script`,
  PUBLIC: `public`,
  SYSTEM: `system`,
};
function en(e) {
  return e >= 55296 && e <= 57343;
}
function tn(e) {
  return e >= 56320 && e <= 57343;
}
function nn(e, t) {
  return (e - 55296) * 1024 + 9216 + t;
}
function rn(e) {
  return (
    (e !== 32 &&
      e !== 10 &&
      e !== 13 &&
      e !== 9 &&
      e !== 12 &&
      e >= 1 &&
      e <= 31) ||
    (e >= 127 && e <= 159)
  );
}
function an(e) {
  return (e >= 64976 && e <= 65007) || Qt.has(e);
}
var R;
(function (e) {
  ((e.controlCharacterInInputStream = `control-character-in-input-stream`),
    (e.noncharacterInInputStream = `noncharacter-in-input-stream`),
    (e.surrogateInInputStream = `surrogate-in-input-stream`),
    (e.nonVoidHtmlElementStartTagWithTrailingSolidus = `non-void-html-element-start-tag-with-trailing-solidus`),
    (e.endTagWithAttributes = `end-tag-with-attributes`),
    (e.endTagWithTrailingSolidus = `end-tag-with-trailing-solidus`),
    (e.unexpectedSolidusInTag = `unexpected-solidus-in-tag`),
    (e.unexpectedNullCharacter = `unexpected-null-character`),
    (e.unexpectedQuestionMarkInsteadOfTagName = `unexpected-question-mark-instead-of-tag-name`),
    (e.invalidFirstCharacterOfTagName = `invalid-first-character-of-tag-name`),
    (e.unexpectedEqualsSignBeforeAttributeName = `unexpected-equals-sign-before-attribute-name`),
    (e.missingEndTagName = `missing-end-tag-name`),
    (e.unexpectedCharacterInAttributeName = `unexpected-character-in-attribute-name`),
    (e.unknownNamedCharacterReference = `unknown-named-character-reference`),
    (e.missingSemicolonAfterCharacterReference = `missing-semicolon-after-character-reference`),
    (e.unexpectedCharacterAfterDoctypeSystemIdentifier = `unexpected-character-after-doctype-system-identifier`),
    (e.unexpectedCharacterInUnquotedAttributeValue = `unexpected-character-in-unquoted-attribute-value`),
    (e.eofBeforeTagName = `eof-before-tag-name`),
    (e.eofInTag = `eof-in-tag`),
    (e.missingAttributeValue = `missing-attribute-value`),
    (e.missingWhitespaceBetweenAttributes = `missing-whitespace-between-attributes`),
    (e.missingWhitespaceAfterDoctypePublicKeyword = `missing-whitespace-after-doctype-public-keyword`),
    (e.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers = `missing-whitespace-between-doctype-public-and-system-identifiers`),
    (e.missingWhitespaceAfterDoctypeSystemKeyword = `missing-whitespace-after-doctype-system-keyword`),
    (e.missingQuoteBeforeDoctypePublicIdentifier = `missing-quote-before-doctype-public-identifier`),
    (e.missingQuoteBeforeDoctypeSystemIdentifier = `missing-quote-before-doctype-system-identifier`),
    (e.missingDoctypePublicIdentifier = `missing-doctype-public-identifier`),
    (e.missingDoctypeSystemIdentifier = `missing-doctype-system-identifier`),
    (e.abruptDoctypePublicIdentifier = `abrupt-doctype-public-identifier`),
    (e.abruptDoctypeSystemIdentifier = `abrupt-doctype-system-identifier`),
    (e.cdataInHtmlContent = `cdata-in-html-content`),
    (e.incorrectlyOpenedComment = `incorrectly-opened-comment`),
    (e.eofInScriptHtmlCommentLikeText = `eof-in-script-html-comment-like-text`),
    (e.eofInDoctype = `eof-in-doctype`),
    (e.nestedComment = `nested-comment`),
    (e.abruptClosingOfEmptyComment = `abrupt-closing-of-empty-comment`),
    (e.eofInComment = `eof-in-comment`),
    (e.incorrectlyClosedComment = `incorrectly-closed-comment`),
    (e.eofInCdata = `eof-in-cdata`),
    (e.absenceOfDigitsInNumericCharacterReference = `absence-of-digits-in-numeric-character-reference`),
    (e.nullCharacterReference = `null-character-reference`),
    (e.surrogateCharacterReference = `surrogate-character-reference`),
    (e.characterReferenceOutsideUnicodeRange = `character-reference-outside-unicode-range`),
    (e.controlCharacterReference = `control-character-reference`),
    (e.noncharacterCharacterReference = `noncharacter-character-reference`),
    (e.missingWhitespaceBeforeDoctypeName = `missing-whitespace-before-doctype-name`),
    (e.missingDoctypeName = `missing-doctype-name`),
    (e.invalidCharacterSequenceAfterDoctypeName = `invalid-character-sequence-after-doctype-name`),
    (e.duplicateAttribute = `duplicate-attribute`),
    (e.nonConformingDoctype = `non-conforming-doctype`),
    (e.missingDoctype = `missing-doctype`),
    (e.misplacedDoctype = `misplaced-doctype`),
    (e.endTagWithoutMatchingOpenElement = `end-tag-without-matching-open-element`),
    (e.closingOfElementWithOpenChildElements = `closing-of-element-with-open-child-elements`),
    (e.disallowedContentInNoscriptInHead = `disallowed-content-in-noscript-in-head`),
    (e.openElementsLeftAfterEof = `open-elements-left-after-eof`),
    (e.abandonedHeadElementChild = `abandoned-head-element-child`),
    (e.misplacedStartTagForHeadElement = `misplaced-start-tag-for-head-element`),
    (e.nestedNoscriptInHead = `nested-noscript-in-head`),
    (e.eofInElementThatCanContainOnlyText = `eof-in-element-that-can-contain-only-text`));
})((R ||= {}));
var on = 65536,
  sn = class {
    constructor(e) {
      ((this.handler = e),
        (this.html = ``),
        (this.pos = -1),
        (this.lastGapPos = -2),
        (this.gapStack = []),
        (this.skipNextNewLine = !1),
        (this.lastChunkWritten = !1),
        (this.endOfChunkHit = !1),
        (this.bufferWaterline = on),
        (this.isEol = !1),
        (this.lineStartPos = 0),
        (this.droppedBufferSize = 0),
        (this.line = 1),
        (this.lastErrOffset = -1));
    }
    get col() {
      return (
        this.pos - this.lineStartPos + Number(this.lastGapPos !== this.pos)
      );
    }
    get offset() {
      return this.droppedBufferSize + this.pos;
    }
    getError(e, t) {
      let { line: n, col: r, offset: i } = this,
        a = r + t,
        o = i + t;
      return {
        code: e,
        startLine: n,
        endLine: n,
        startCol: a,
        endCol: a,
        startOffset: o,
        endOffset: o,
      };
    }
    _err(e) {
      this.handler.onParseError &&
        this.lastErrOffset !== this.offset &&
        ((this.lastErrOffset = this.offset),
        this.handler.onParseError(this.getError(e, 0)));
    }
    _addGap() {
      (this.gapStack.push(this.lastGapPos), (this.lastGapPos = this.pos));
    }
    _processSurrogate(e) {
      if (this.pos !== this.html.length - 1) {
        let t = this.html.charCodeAt(this.pos + 1);
        if (tn(t)) return (this.pos++, this._addGap(), nn(e, t));
      } else if (!this.lastChunkWritten)
        return ((this.endOfChunkHit = !0), L.EOF);
      return (this._err(R.surrogateInInputStream), e);
    }
    willDropParsedChunk() {
      return this.pos > this.bufferWaterline;
    }
    dropParsedChunk() {
      this.willDropParsedChunk() &&
        ((this.html = this.html.substring(this.pos)),
        (this.lineStartPos -= this.pos),
        (this.droppedBufferSize += this.pos),
        (this.pos = 0),
        (this.lastGapPos = -2),
        (this.gapStack.length = 0));
    }
    write(e, t) {
      (this.html.length > 0 ? (this.html += e) : (this.html = e),
        (this.endOfChunkHit = !1),
        (this.lastChunkWritten = t));
    }
    insertHtmlAtCurrentPos(e) {
      ((this.html =
        this.html.substring(0, this.pos + 1) +
        e +
        this.html.substring(this.pos + 1)),
        (this.endOfChunkHit = !1));
    }
    startsWith(e, t) {
      if (this.pos + e.length > this.html.length)
        return ((this.endOfChunkHit = !this.lastChunkWritten), !1);
      if (t) return this.html.startsWith(e, this.pos);
      for (let t = 0; t < e.length; t++)
        if ((this.html.charCodeAt(this.pos + t) | 32) !== e.charCodeAt(t))
          return !1;
      return !0;
    }
    peek(e) {
      let t = this.pos + e;
      if (t >= this.html.length)
        return ((this.endOfChunkHit = !this.lastChunkWritten), L.EOF);
      let n = this.html.charCodeAt(t);
      return n === L.CARRIAGE_RETURN ? L.LINE_FEED : n;
    }
    advance() {
      if (
        (this.pos++,
        this.isEol &&
          ((this.isEol = !1), this.line++, (this.lineStartPos = this.pos)),
        this.pos >= this.html.length)
      )
        return ((this.endOfChunkHit = !this.lastChunkWritten), L.EOF);
      let e = this.html.charCodeAt(this.pos);
      return e === L.CARRIAGE_RETURN
        ? ((this.isEol = !0), (this.skipNextNewLine = !0), L.LINE_FEED)
        : e === L.LINE_FEED && ((this.isEol = !0), this.skipNextNewLine)
          ? (this.line--,
            (this.skipNextNewLine = !1),
            this._addGap(),
            this.advance())
          : ((this.skipNextNewLine = !1),
            en(e) && (e = this._processSurrogate(e)),
            this.handler.onParseError === null ||
              (e > 31 && e < 127) ||
              e === L.LINE_FEED ||
              e === L.CARRIAGE_RETURN ||
              (e > 159 && e < 64976) ||
              this._checkForProblematicCharacters(e),
            e);
    }
    _checkForProblematicCharacters(e) {
      rn(e)
        ? this._err(R.controlCharacterInInputStream)
        : an(e) && this._err(R.noncharacterInInputStream);
    }
    retreat(e) {
      for (this.pos -= e; this.pos < this.lastGapPos; )
        ((this.lastGapPos = this.gapStack.pop()), this.pos--);
      this.isEol = !1;
    }
  },
  z;
(function (e) {
  ((e[(e.CHARACTER = 0)] = `CHARACTER`),
    (e[(e.NULL_CHARACTER = 1)] = `NULL_CHARACTER`),
    (e[(e.WHITESPACE_CHARACTER = 2)] = `WHITESPACE_CHARACTER`),
    (e[(e.START_TAG = 3)] = `START_TAG`),
    (e[(e.END_TAG = 4)] = `END_TAG`),
    (e[(e.COMMENT = 5)] = `COMMENT`),
    (e[(e.DOCTYPE = 6)] = `DOCTYPE`),
    (e[(e.EOF = 7)] = `EOF`),
    (e[(e.HIBERNATION = 8)] = `HIBERNATION`));
})((z ||= {}));
function cn(e, t) {
  for (let n = e.attrs.length - 1; n >= 0; n--)
    if (e.attrs[n].name === t) return e.attrs[n].value;
  return null;
}
var ln = new Uint16Array(
    `ᵁ<Õıʊҝջאٵ۞ޢߖࠏ੊ઑඡ๭༉༦჊ረዡᐕᒝᓃᓟᔥ\0\0\0\0\0\0ᕫᛍᦍᰒᷝ὾⁠↰⊍⏀⏻⑂⠤⤒ⴈ⹈⿎〖㊺㘹㞬㣾㨨㩱㫠㬮ࠀEMabcfglmnoprstu\\bfms¦³¹ÈÏlig耻Æ䃆P耻&䀦cute耻Á䃁reve;䄂Āiyx}rc耻Â䃂;䐐r;쀀𝔄rave耻À䃀pha;䎑acr;䄀d;橓Āgp¡on;䄄f;쀀𝔸plyFunction;恡ing耻Å䃅Ācs¾Ãr;쀀𝒜ign;扔ilde耻Ã䃃ml耻Ä䃄ЀaceforsuåûþėĜĢħĪĀcrêòkslash;或Ŷöø;櫧ed;挆y;䐑ƀcrtąċĔause;戵noullis;愬a;䎒r;쀀𝔅pf;쀀𝔹eve;䋘còēmpeq;扎܀HOacdefhilorsuōőŖƀƞƢƵƷƺǜȕɳɸɾcy;䐧PY耻©䂩ƀcpyŝŢźute;䄆Ā;iŧŨ拒talDifferentialD;慅leys;愭ȀaeioƉƎƔƘron;䄌dil耻Ç䃇rc;䄈nint;戰ot;䄊ĀdnƧƭilla;䂸terDot;䂷òſi;䎧rcleȀDMPTǇǋǑǖot;抙inus;抖lus;投imes;抗oĀcsǢǸkwiseContourIntegral;戲eCurlyĀDQȃȏoubleQuote;思uote;怙ȀlnpuȞȨɇɕonĀ;eȥȦ户;橴ƀgitȯȶȺruent;扡nt;戯ourIntegral;戮ĀfrɌɎ;愂oduct;成nterClockwiseContourIntegral;戳oss;樯cr;쀀𝒞pĀ;Cʄʅ拓ap;才րDJSZacefiosʠʬʰʴʸˋ˗ˡ˦̳ҍĀ;oŹʥtrahd;椑cy;䐂cy;䐅cy;䐏ƀgrsʿ˄ˇger;怡r;憡hv;櫤Āayː˕ron;䄎;䐔lĀ;t˝˞戇a;䎔r;쀀𝔇Āaf˫̧Ācm˰̢riticalȀADGT̖̜̀̆cute;䂴oŴ̋̍;䋙bleAcute;䋝rave;䁠ilde;䋜ond;拄ferentialD;慆Ѱ̽\0\0\0͔͂\0Ѕf;쀀𝔻ƀ;DE͈͉͍䂨ot;惜qual;扐blèCDLRUVͣͲ΂ϏϢϸontourIntegraìȹoɴ͹\0\0ͻ»͉nArrow;懓Āeo·ΤftƀARTΐΖΡrrow;懐ightArrow;懔eåˊngĀLRΫτeftĀARγιrrow;柸ightArrow;柺ightArrow;柹ightĀATϘϞrrow;懒ee;抨pɁϩ\0\0ϯrrow;懑ownArrow;懕erticalBar;戥ǹABLRTaВЪаўѿͼrrowƀ;BUНОТ憓ar;椓pArrow;懵reve;䌑eft˒к\0ц\0ѐightVector;楐eeVector;楞ectorĀ;Bљњ憽ar;楖ightǔѧ\0ѱeeVector;楟ectorĀ;BѺѻ懁ar;楗eeĀ;A҆҇护rrow;憧ĀctҒҗr;쀀𝒟rok;䄐ࠀNTacdfglmopqstuxҽӀӄӋӞӢӧӮӵԡԯԶՒ՝ՠեG;䅊H耻Ð䃐cute耻É䃉ƀaiyӒӗӜron;䄚rc耻Ê䃊;䐭ot;䄖r;쀀𝔈rave耻È䃈ement;戈ĀapӺӾcr;䄒tyɓԆ\0\0ԒmallSquare;旻erySmallSquare;斫ĀgpԦԪon;䄘f;쀀𝔼silon;䎕uĀaiԼՉlĀ;TՂՃ橵ilde;扂librium;懌Āci՗՚r;愰m;橳a;䎗ml耻Ë䃋Āipժկsts;戃onentialE;慇ʀcfiosօֈ֍ֲ׌y;䐤r;쀀𝔉lledɓ֗\0\0֣mallSquare;旼erySmallSquare;斪Ͱֺ\0ֿ\0\0ׄf;쀀𝔽All;戀riertrf;愱cò׋؀JTabcdfgorstר׬ׯ׺؀ؒؖ؛؝أ٬ٲcy;䐃耻>䀾mmaĀ;d׷׸䎓;䏜reve;䄞ƀeiy؇،ؐdil;䄢rc;䄜;䐓ot;䄠r;쀀𝔊;拙pf;쀀𝔾eater̀EFGLSTصلَٖٛ٦qualĀ;Lؾؿ扥ess;招ullEqual;执reater;檢ess;扷lantEqual;橾ilde;扳cr;쀀𝒢;扫ЀAacfiosuڅڋږڛڞڪھۊRDcy;䐪Āctڐڔek;䋇;䁞irc;䄤r;愌lbertSpace;愋ǰگ\0ڲf;愍izontalLine;攀Āctۃۅòکrok;䄦mpńېۘownHumðįqual;扏܀EJOacdfgmnostuۺ۾܃܇܎ܚܞܡܨ݄ݸދޏޕcy;䐕lig;䄲cy;䐁cute耻Í䃍Āiyܓܘrc耻Î䃎;䐘ot;䄰r;愑rave耻Ì䃌ƀ;apܠܯܿĀcgܴܷr;䄪inaryI;慈lieóϝǴ݉\0ݢĀ;eݍݎ戬Āgrݓݘral;戫section;拂isibleĀCTݬݲomma;恣imes;恢ƀgptݿރވon;䄮f;쀀𝕀a;䎙cr;愐ilde;䄨ǫޚ\0ޞcy;䐆l耻Ï䃏ʀcfosuެ޷޼߂ߐĀiyޱ޵rc;䄴;䐙r;쀀𝔍pf;쀀𝕁ǣ߇\0ߌr;쀀𝒥rcy;䐈kcy;䐄΀HJacfosߤߨ߽߬߱ࠂࠈcy;䐥cy;䐌ppa;䎚Āey߶߻dil;䄶;䐚r;쀀𝔎pf;쀀𝕂cr;쀀𝒦րJTaceflmostࠥࠩࠬࡐࡣ঳সে্਷ੇcy;䐉耻<䀼ʀcmnpr࠷࠼ࡁࡄࡍute;䄹bda;䎛g;柪lacetrf;愒r;憞ƀaeyࡗ࡜ࡡron;䄽dil;䄻;䐛Āfsࡨ॰tԀACDFRTUVarࡾࢩࢱࣦ࣠ࣼयज़ΐ४Ānrࢃ࢏gleBracket;柨rowƀ;BR࢙࢚࢞憐ar;懤ightArrow;懆eiling;挈oǵࢷ\0ࣃbleBracket;柦nǔࣈ\0࣒eeVector;楡ectorĀ;Bࣛࣜ懃ar;楙loor;挊ightĀAV࣯ࣵrrow;憔ector;楎Āerँगeƀ;AVउऊऐ抣rrow;憤ector;楚iangleƀ;BEतथऩ抲ar;槏qual;抴pƀDTVषूौownVector;楑eeVector;楠ectorĀ;Bॖॗ憿ar;楘ectorĀ;B॥०憼ar;楒ightáΜs̀EFGLSTॾঋকঝঢভqualGreater;拚ullEqual;扦reater;扶ess;檡lantEqual;橽ilde;扲r;쀀𝔏Ā;eঽা拘ftarrow;懚idot;䄿ƀnpw৔ਖਛgȀLRlr৞৷ਂਐeftĀAR০৬rrow;柵ightArrow;柷ightArrow;柶eftĀarγਊightáοightáϊf;쀀𝕃erĀLRਢਬeftArrow;憙ightArrow;憘ƀchtਾੀੂòࡌ;憰rok;䅁;扪Ѐacefiosuਗ਼੝੠੷੼અઋ઎p;椅y;䐜Ādl੥੯iumSpace;恟lintrf;愳r;쀀𝔐nusPlus;戓pf;쀀𝕄cò੶;䎜ҀJacefostuણધભીଔଙඑ඗ඞcy;䐊cute;䅃ƀaey઴હાron;䅇dil;䅅;䐝ƀgswે૰଎ativeƀMTV૓૟૨ediumSpace;怋hiĀcn૦૘ë૙eryThiî૙tedĀGL૸ଆreaterGreateòٳessLesóੈLine;䀊r;쀀𝔑ȀBnptଢନଷ଺reak;恠BreakingSpace;䂠f;愕ڀ;CDEGHLNPRSTV୕ୖ୪୼஡௫ఄ౞಄ದ೘ൡඅ櫬Āou୛୤ngruent;扢pCap;扭oubleVerticalBar;戦ƀlqxஃஊ஛ement;戉ualĀ;Tஒஓ扠ilde;쀀≂̸ists;戄reater΀;EFGLSTஶஷ஽௉௓௘௥扯qual;扱ullEqual;쀀≧̸reater;쀀≫̸ess;批lantEqual;쀀⩾̸ilde;扵umpń௲௽ownHump;쀀≎̸qual;쀀≏̸eĀfsఊధtTriangleƀ;BEచఛడ拪ar;쀀⧏̸qual;括s̀;EGLSTవశ఼ౄోౘ扮qual;扰reater;扸ess;쀀≪̸lantEqual;쀀⩽̸ilde;扴estedĀGL౨౹reaterGreater;쀀⪢̸essLess;쀀⪡̸recedesƀ;ESಒಓಛ技qual;쀀⪯̸lantEqual;拠ĀeiಫಹverseElement;戌ghtTriangleƀ;BEೋೌ೒拫ar;쀀⧐̸qual;拭ĀquೝഌuareSuĀbp೨೹setĀ;E೰ೳ쀀⊏̸qual;拢ersetĀ;Eഃആ쀀⊐̸qual;拣ƀbcpഓതൎsetĀ;Eഛഞ쀀⊂⃒qual;抈ceedsȀ;ESTലള഻െ抁qual;쀀⪰̸lantEqual;拡ilde;쀀≿̸ersetĀ;E൘൛쀀⊃⃒qual;抉ildeȀ;EFT൮൯൵ൿ扁qual;扄ullEqual;扇ilde;扉erticalBar;戤cr;쀀𝒩ilde耻Ñ䃑;䎝܀Eacdfgmoprstuvලෂ෉෕ෛ෠෧෼ขภยา฿ไlig;䅒cute耻Ó䃓Āiy෎ීrc耻Ô䃔;䐞blac;䅐r;쀀𝔒rave耻Ò䃒ƀaei෮ෲ෶cr;䅌ga;䎩cron;䎟pf;쀀𝕆enCurlyĀDQฎบoubleQuote;怜uote;怘;橔Āclวฬr;쀀𝒪ash耻Ø䃘iŬื฼de耻Õ䃕es;樷ml耻Ö䃖erĀBP๋๠Āar๐๓r;怾acĀek๚๜;揞et;掴arenthesis;揜Ҁacfhilors๿ງຊຏຒດຝະ໼rtialD;戂y;䐟r;쀀𝔓i;䎦;䎠usMinus;䂱Āipຢອncareplanåڝf;愙Ȁ;eio຺ູ໠໤檻cedesȀ;EST່້໏໚扺qual;檯lantEqual;扼ilde;找me;怳Ādp໩໮uct;戏ortionĀ;aȥ໹l;戝Āci༁༆r;쀀𝒫;䎨ȀUfos༑༖༛༟OT耻"䀢r;쀀𝔔pf;愚cr;쀀𝒬؀BEacefhiorsu༾གྷཇའཱིྦྷྪྭ႖ႩႴႾarr;椐G耻®䂮ƀcnrཎནབute;䅔g;柫rĀ;tཛྷཝ憠l;椖ƀaeyཧཬཱron;䅘dil;䅖;䐠Ā;vླྀཹ愜erseĀEUྂྙĀlq྇ྎement;戋uilibrium;懋pEquilibrium;楯r»ཹo;䎡ghtЀACDFTUVa࿁࿫࿳ဢဨၛႇϘĀnr࿆࿒gleBracket;柩rowƀ;BL࿜࿝࿡憒ar;懥eftArrow;懄eiling;按oǵ࿹\0စbleBracket;柧nǔည\0နeeVector;楝ectorĀ;Bဝသ懂ar;楕loor;挋Āerိ၃eƀ;AVဵံြ抢rrow;憦ector;楛iangleƀ;BEၐၑၕ抳ar;槐qual;抵pƀDTVၣၮၸownVector;楏eeVector;楜ectorĀ;Bႂႃ憾ar;楔ectorĀ;B႑႒懀ar;楓Āpuႛ႞f;愝ndImplies;楰ightarrow;懛ĀchႹႼr;愛;憱leDelayed;槴ڀHOacfhimoqstuფჱჷჽᄙᄞᅑᅖᅡᅧᆵᆻᆿĀCcჩხHcy;䐩y;䐨FTcy;䐬cute;䅚ʀ;aeiyᄈᄉᄎᄓᄗ檼ron;䅠dil;䅞rc;䅜;䐡r;쀀𝔖ortȀDLRUᄪᄴᄾᅉownArrow»ОeftArrow»࢚ightArrow»࿝pArrow;憑gma;䎣allCircle;战pf;쀀𝕊ɲᅭ\0\0ᅰt;戚areȀ;ISUᅻᅼᆉᆯ斡ntersection;抓uĀbpᆏᆞsetĀ;Eᆗᆘ抏qual;抑ersetĀ;Eᆨᆩ抐qual;抒nion;抔cr;쀀𝒮ar;拆ȀbcmpᇈᇛሉላĀ;sᇍᇎ拐etĀ;Eᇍᇕqual;抆ĀchᇠህeedsȀ;ESTᇭᇮᇴᇿ扻qual;檰lantEqual;扽ilde;承Tháྌ;我ƀ;esሒሓሣ拑rsetĀ;Eሜም抃qual;抇et»ሓրHRSacfhiorsሾቄ቉ቕ቞ቱቶኟዂወዑORN耻Þ䃞ADE;愢ĀHc቎ቒcy;䐋y;䐦Ābuቚቜ;䀉;䎤ƀaeyብቪቯron;䅤dil;䅢;䐢r;쀀𝔗Āeiቻ኉ǲኀ\0ኇefore;戴a;䎘Ācn኎ኘkSpace;쀀  Space;怉ldeȀ;EFTካኬኲኼ戼qual;扃ullEqual;扅ilde;扈pf;쀀𝕋ipleDot;惛Āctዖዛr;쀀𝒯rok;䅦ૡዷጎጚጦ\0ጬጱ\0\0\0\0\0ጸጽ፷ᎅ\0᏿ᐄᐊᐐĀcrዻጁute耻Ú䃚rĀ;oጇገ憟cir;楉rǣጓ\0጖y;䐎ve;䅬Āiyጞጣrc耻Û䃛;䐣blac;䅰r;쀀𝔘rave耻Ù䃙acr;䅪Ādiፁ፩erĀBPፈ፝Āarፍፐr;䁟acĀekፗፙ;揟et;掵arenthesis;揝onĀ;P፰፱拃lus;抎Āgp፻፿on;䅲f;쀀𝕌ЀADETadps᎕ᎮᎸᏄϨᏒᏗᏳrrowƀ;BDᅐᎠᎤar;椒ownArrow;懅ownArrow;憕quilibrium;楮eeĀ;AᏋᏌ报rrow;憥ownáϳerĀLRᏞᏨeftArrow;憖ightArrow;憗iĀ;lᏹᏺ䏒on;䎥ing;䅮cr;쀀𝒰ilde;䅨ml耻Ü䃜ҀDbcdefosvᐧᐬᐰᐳᐾᒅᒊᒐᒖash;披ar;櫫y;䐒ashĀ;lᐻᐼ抩;櫦Āerᑃᑅ;拁ƀbtyᑌᑐᑺar;怖Ā;iᑏᑕcalȀBLSTᑡᑥᑪᑴar;戣ine;䁼eparator;杘ilde;所ThinSpace;怊r;쀀𝔙pf;쀀𝕍cr;쀀𝒱dash;抪ʀcefosᒧᒬᒱᒶᒼirc;䅴dge;拀r;쀀𝔚pf;쀀𝕎cr;쀀𝒲Ȁfiosᓋᓐᓒᓘr;쀀𝔛;䎞pf;쀀𝕏cr;쀀𝒳ҀAIUacfosuᓱᓵᓹᓽᔄᔏᔔᔚᔠcy;䐯cy;䐇cy;䐮cute耻Ý䃝Āiyᔉᔍrc;䅶;䐫r;쀀𝔜pf;쀀𝕐cr;쀀𝒴ml;䅸ЀHacdefosᔵᔹᔿᕋᕏᕝᕠᕤcy;䐖cute;䅹Āayᕄᕉron;䅽;䐗ot;䅻ǲᕔ\0ᕛoWidtè૙a;䎖r;愨pf;愤cr;쀀𝒵௡ᖃᖊᖐ\0ᖰᖶᖿ\0\0\0\0ᗆᗛᗫᙟ᙭\0ᚕ᚛ᚲᚹ\0ᚾcute耻á䃡reve;䄃̀;Ediuyᖜᖝᖡᖣᖨᖭ戾;쀀∾̳;房rc耻â䃢te肻´̆;䐰lig耻æ䃦Ā;r²ᖺ;쀀𝔞rave耻à䃠ĀepᗊᗖĀfpᗏᗔsym;愵èᗓha;䎱ĀapᗟcĀclᗤᗧr;䄁g;樿ɤᗰ\0\0ᘊʀ;adsvᗺᗻᗿᘁᘇ戧nd;橕;橜lope;橘;橚΀;elmrszᘘᘙᘛᘞᘿᙏᙙ戠;榤e»ᘙsdĀ;aᘥᘦ戡ѡᘰᘲᘴᘶᘸᘺᘼᘾ;榨;榩;榪;榫;榬;榭;榮;榯tĀ;vᙅᙆ戟bĀ;dᙌᙍ抾;榝Āptᙔᙗh;戢»¹arr;捼Āgpᙣᙧon;䄅f;쀀𝕒΀;Eaeiop዁ᙻᙽᚂᚄᚇᚊ;橰cir;橯;扊d;手s;䀧roxĀ;e዁ᚒñᚃing耻å䃥ƀctyᚡᚦᚨr;쀀𝒶;䀪mpĀ;e዁ᚯñʈilde耻ã䃣ml耻ä䃤Āciᛂᛈoninôɲnt;樑ࠀNabcdefiklnoprsu᛭ᛱᜰ᜼ᝃᝈ᝸᝽០៦ᠹᡐᜍ᤽᥈ᥰot;櫭Ācrᛶ᜞kȀcepsᜀᜅᜍᜓong;扌psilon;䏶rime;怵imĀ;e᜚᜛戽q;拍Ŷᜢᜦee;抽edĀ;gᜬᜭ挅e»ᜭrkĀ;t፜᜷brk;掶Āoyᜁᝁ;䐱quo;怞ʀcmprtᝓ᝛ᝡᝤᝨausĀ;eĊĉptyv;榰séᜌnoõēƀahwᝯ᝱ᝳ;䎲;愶een;扬r;쀀𝔟g΀costuvwឍឝឳេ៕៛៞ƀaiuបពរðݠrc;旯p»፱ƀdptឤឨឭot;樀lus;樁imes;樂ɱឹ\0\0ើcup;樆ar;昅riangleĀdu៍្own;施p;斳plus;樄eåᑄåᒭarow;植ƀako៭ᠦᠵĀcn៲ᠣkƀlst៺֫᠂ozenge;槫riangleȀ;dlr᠒᠓᠘᠝斴own;斾eft;旂ight;斸k;搣Ʊᠫ\0ᠳƲᠯ\0ᠱ;斒;斑4;斓ck;斈ĀeoᠾᡍĀ;qᡃᡆ쀀=⃥uiv;쀀≡⃥t;挐Ȁptwxᡙᡞᡧᡬf;쀀𝕓Ā;tᏋᡣom»Ꮜtie;拈؀DHUVbdhmptuvᢅᢖᢪᢻᣗᣛᣬ᣿ᤅᤊᤐᤡȀLRlrᢎᢐᢒᢔ;敗;敔;敖;敓ʀ;DUduᢡᢢᢤᢦᢨ敐;敦;敩;敤;敧ȀLRlrᢳᢵᢷᢹ;敝;敚;敜;教΀;HLRhlrᣊᣋᣍᣏᣑᣓᣕ救;敬;散;敠;敫;敢;敟ox;槉ȀLRlrᣤᣦᣨᣪ;敕;敒;攐;攌ʀ;DUduڽ᣷᣹᣻᣽;敥;敨;攬;攴inus;抟lus;択imes;抠ȀLRlrᤙᤛᤝ᤟;敛;敘;攘;攔΀;HLRhlrᤰᤱᤳᤵᤷ᤻᤹攂;敪;敡;敞;攼;攤;攜Āevģ᥂bar耻¦䂦Ȁceioᥑᥖᥚᥠr;쀀𝒷mi;恏mĀ;e᜚᜜lƀ;bhᥨᥩᥫ䁜;槅sub;柈Ŭᥴ᥾lĀ;e᥹᥺怢t»᥺pƀ;Eeįᦅᦇ;檮Ā;qۜۛೡᦧ\0᧨ᨑᨕᨲ\0ᨷᩐ\0\0᪴\0\0᫁\0\0ᬡᬮ᭍᭒\0᯽\0ᰌƀcpr᦭ᦲ᧝ute;䄇̀;abcdsᦿᧀᧄ᧊᧕᧙戩nd;橄rcup;橉Āau᧏᧒p;橋p;橇ot;橀;쀀∩︀Āeo᧢᧥t;恁îړȀaeiu᧰᧻ᨁᨅǰ᧵\0᧸s;橍on;䄍dil耻ç䃧rc;䄉psĀ;sᨌᨍ橌m;橐ot;䄋ƀdmnᨛᨠᨦil肻¸ƭptyv;榲t脀¢;eᨭᨮ䂢räƲr;쀀𝔠ƀceiᨽᩀᩍy;䑇ckĀ;mᩇᩈ朓ark»ᩈ;䏇r΀;Ecefms᩟᩠ᩢᩫ᪤᪪᪮旋;槃ƀ;elᩩᩪᩭ䋆q;扗eɡᩴ\0\0᪈rrowĀlr᩼᪁eft;憺ight;憻ʀRSacd᪒᪔᪖᪚᪟»ཇ;擈st;抛irc;抚ash;抝nint;樐id;櫯cir;槂ubsĀ;u᪻᪼晣it»᪼ˬ᫇᫔᫺\0ᬊonĀ;eᫍᫎ䀺Ā;qÇÆɭ᫙\0\0᫢aĀ;t᫞᫟䀬;䁀ƀ;fl᫨᫩᫫戁îᅠeĀmx᫱᫶ent»᫩eóɍǧ᫾\0ᬇĀ;dኻᬂot;橭nôɆƀfryᬐᬔᬗ;쀀𝕔oäɔ脀©;sŕᬝr;愗Āaoᬥᬩrr;憵ss;朗Ācuᬲᬷr;쀀𝒸Ābpᬼ᭄Ā;eᭁᭂ櫏;櫑Ā;eᭉᭊ櫐;櫒dot;拯΀delprvw᭠᭬᭷ᮂᮬᯔ᯹arrĀlr᭨᭪;椸;椵ɰ᭲\0\0᭵r;拞c;拟arrĀ;p᭿ᮀ憶;椽̀;bcdosᮏᮐᮖᮡᮥᮨ截rcap;橈Āauᮛᮞp;橆p;橊ot;抍r;橅;쀀∪︀Ȁalrv᮵ᮿᯞᯣrrĀ;mᮼᮽ憷;椼yƀevwᯇᯔᯘqɰᯎ\0\0ᯒreã᭳uã᭵ee;拎edge;拏en耻¤䂤earrowĀlrᯮ᯳eft»ᮀight»ᮽeäᯝĀciᰁᰇoninôǷnt;戱lcty;挭ঀAHabcdefhijlorstuwz᰸᰻᰿ᱝᱩᱵᲊᲞᲬᲷ᳻᳿ᴍᵻᶑᶫᶻ᷆᷍rò΁ar;楥Ȁglrs᱈ᱍ᱒᱔ger;怠eth;愸òᄳhĀ;vᱚᱛ怐»ऊūᱡᱧarow;椏aã̕Āayᱮᱳron;䄏;䐴ƀ;ao̲ᱼᲄĀgrʿᲁr;懊tseq;橷ƀglmᲑᲔᲘ耻°䂰ta;䎴ptyv;榱ĀirᲣᲨsht;楿;쀀𝔡arĀlrᲳᲵ»ࣜ»သʀaegsv᳂͸᳖᳜᳠mƀ;oș᳊᳔ndĀ;ș᳑uit;晦amma;䏝in;拲ƀ;io᳧᳨᳸䃷de脀÷;o᳧ᳰntimes;拇nø᳷cy;䑒cɯᴆ\0\0ᴊrn;挞op;挍ʀlptuwᴘᴝᴢᵉᵕlar;䀤f;쀀𝕕ʀ;emps̋ᴭᴷᴽᵂqĀ;d͒ᴳot;扑inus;戸lus;戔quare;抡blebarwedgåúnƀadhᄮᵝᵧownarrowóᲃarpoonĀlrᵲᵶefôᲴighôᲶŢᵿᶅkaro÷གɯᶊ\0\0ᶎrn;挟op;挌ƀcotᶘᶣᶦĀryᶝᶡ;쀀𝒹;䑕l;槶rok;䄑Ādrᶰᶴot;拱iĀ;fᶺ᠖斿Āah᷀᷃ròЩaòྦangle;榦Āci᷒ᷕy;䑟grarr;柿ऀDacdefglmnopqrstuxḁḉḙḸոḼṉṡṾấắẽỡἪἷὄ὎὚ĀDoḆᴴoôᲉĀcsḎḔute耻é䃩ter;橮ȀaioyḢḧḱḶron;䄛rĀ;cḭḮ扖耻ê䃪lon;払;䑍ot;䄗ĀDrṁṅot;扒;쀀𝔢ƀ;rsṐṑṗ檚ave耻è䃨Ā;dṜṝ檖ot;檘Ȁ;ilsṪṫṲṴ檙nters;揧;愓Ā;dṹṺ檕ot;檗ƀapsẅẉẗcr;䄓tyƀ;svẒẓẕ戅et»ẓpĀ1;ẝẤĳạả;怄;怅怃ĀgsẪẬ;䅋p;怂ĀgpẴẸon;䄙f;쀀𝕖ƀalsỄỎỒrĀ;sỊị拕l;槣us;橱iƀ;lvỚớở䎵on»ớ;䏵ȀcsuvỪỳἋἣĀioữḱrc»Ḯɩỹ\0\0ỻíՈantĀglἂἆtr»ṝess»Ṻƀaeiἒ἖Ἒls;䀽st;扟vĀ;DȵἠD;橸parsl;槥ĀDaἯἳot;打rr;楱ƀcdiἾὁỸr;愯oô͒ĀahὉὋ;䎷耻ð䃰Āmrὓὗl耻ë䃫o;悬ƀcipὡὤὧl;䀡sôծĀeoὬὴctatioîՙnentialåչৡᾒ\0ᾞ\0ᾡᾧ\0\0ῆῌ\0ΐ\0ῦῪ \0 ⁚llingdotseñṄy;䑄male;晀ƀilrᾭᾳ῁lig;耀ﬃɩᾹ\0\0᾽g;耀ﬀig;耀ﬄ;쀀𝔣lig;耀ﬁlig;쀀fjƀaltῙ῜ῡt;晭ig;耀ﬂns;斱of;䆒ǰ΅\0ῳf;쀀𝕗ĀakֿῷĀ;vῼ´拔;櫙artint;樍Āao‌⁕Ācs‑⁒α‚‰‸⁅⁈\0⁐β•‥‧‪‬\0‮耻½䂽;慓耻¼䂼;慕;慙;慛Ƴ‴\0‶;慔;慖ʴ‾⁁\0\0⁃耻¾䂾;慗;慜5;慘ƶ⁌\0⁎;慚;慝8;慞l;恄wn;挢cr;쀀𝒻ࢀEabcdefgijlnorstv₂₉₟₥₰₴⃰⃵⃺⃿℃ℒℸ̗ℾ⅒↞Ā;lٍ₇;檌ƀcmpₐₕ₝ute;䇵maĀ;dₜ᳚䎳;檆reve;䄟Āiy₪₮rc;䄝;䐳ot;䄡Ȁ;lqsؾق₽⃉ƀ;qsؾٌ⃄lanô٥Ȁ;cdl٥⃒⃥⃕c;檩otĀ;o⃜⃝檀Ā;l⃢⃣檂;檄Ā;e⃪⃭쀀⋛︀s;檔r;쀀𝔤Ā;gٳ؛mel;愷cy;䑓Ȁ;Eajٚℌℎℐ;檒;檥;檤ȀEaesℛℝ℩ℴ;扩pĀ;p℣ℤ檊rox»ℤĀ;q℮ℯ檈Ā;q℮ℛim;拧pf;쀀𝕘Āci⅃ⅆr;愊mƀ;el٫ⅎ⅐;檎;檐茀>;cdlqr׮ⅠⅪⅮⅳⅹĀciⅥⅧ;檧r;橺ot;拗Par;榕uest;橼ʀadelsↄⅪ←ٖ↛ǰ↉\0↎proø₞r;楸qĀlqؿ↖lesó₈ií٫Āen↣↭rtneqq;쀀≩︀Å↪ԀAabcefkosy⇄⇇⇱⇵⇺∘∝∯≨≽ròΠȀilmr⇐⇔⇗⇛rsðᒄf»․ilôکĀdr⇠⇤cy;䑊ƀ;cwࣴ⇫⇯ir;楈;憭ar;意irc;䄥ƀalr∁∎∓rtsĀ;u∉∊晥it»∊lip;怦con;抹r;쀀𝔥sĀew∣∩arow;椥arow;椦ʀamopr∺∾≃≞≣rr;懿tht;戻kĀlr≉≓eftarrow;憩ightarrow;憪f;쀀𝕙bar;怕ƀclt≯≴≸r;쀀𝒽asè⇴rok;䄧Ābp⊂⊇ull;恃hen»ᱛૡ⊣\0⊪\0⊸⋅⋎\0⋕⋳\0\0⋸⌢⍧⍢⍿\0⎆⎪⎴cute耻í䃭ƀ;iyݱ⊰⊵rc耻î䃮;䐸Ācx⊼⊿y;䐵cl耻¡䂡ĀfrΟ⋉;쀀𝔦rave耻ì䃬Ȁ;inoܾ⋝⋩⋮Āin⋢⋦nt;樌t;戭fin;槜ta;愩lig;䄳ƀaop⋾⌚⌝ƀcgt⌅⌈⌗r;䄫ƀelpܟ⌏⌓inåގarôܠh;䄱f;抷ed;䆵ʀ;cfotӴ⌬⌱⌽⍁are;愅inĀ;t⌸⌹戞ie;槝doô⌙ʀ;celpݗ⍌⍐⍛⍡al;抺Āgr⍕⍙eróᕣã⍍arhk;樗rod;樼Ȁcgpt⍯⍲⍶⍻y;䑑on;䄯f;쀀𝕚a;䎹uest耻¿䂿Āci⎊⎏r;쀀𝒾nʀ;EdsvӴ⎛⎝⎡ӳ;拹ot;拵Ā;v⎦⎧拴;拳Ā;iݷ⎮lde;䄩ǫ⎸\0⎼cy;䑖l耻ï䃯̀cfmosu⏌⏗⏜⏡⏧⏵Āiy⏑⏕rc;䄵;䐹r;쀀𝔧ath;䈷pf;쀀𝕛ǣ⏬\0⏱r;쀀𝒿rcy;䑘kcy;䑔Ѐacfghjos␋␖␢␧␭␱␵␻ppaĀ;v␓␔䎺;䏰Āey␛␠dil;䄷;䐺r;쀀𝔨reen;䄸cy;䑅cy;䑜pf;쀀𝕜cr;쀀𝓀஀ABEHabcdefghjlmnoprstuv⑰⒁⒆⒍⒑┎┽╚▀♎♞♥♹♽⚚⚲⛘❝❨➋⟀⠁⠒ƀart⑷⑺⑼rò৆òΕail;椛arr;椎Ā;gঔ⒋;檋ar;楢ॣ⒥\0⒪\0⒱\0\0\0\0\0⒵Ⓔ\0ⓆⓈⓍ\0⓹ute;䄺mptyv;榴raîࡌbda;䎻gƀ;dlࢎⓁⓃ;榑åࢎ;檅uo耻«䂫rЀ;bfhlpst࢙ⓞⓦⓩ⓫⓮⓱⓵Ā;f࢝ⓣs;椟s;椝ë≒p;憫l;椹im;楳l;憢ƀ;ae⓿─┄檫il;椙Ā;s┉┊檭;쀀⪭︀ƀabr┕┙┝rr;椌rk;杲Āak┢┬cĀek┨┪;䁻;䁛Āes┱┳;榋lĀdu┹┻;榏;榍Ȁaeuy╆╋╖╘ron;䄾Ādi═╔il;䄼ìࢰâ┩;䐻Ȁcqrs╣╦╭╽a;椶uoĀ;rนᝆĀdu╲╷har;楧shar;楋h;憲ʀ;fgqs▋▌উ◳◿扤tʀahlrt▘▤▷◂◨rrowĀ;t࢙□aé⓶arpoonĀdu▯▴own»њp»०eftarrows;懇ightƀahs◍◖◞rrowĀ;sࣴࢧarpoonó྘quigarro÷⇰hreetimes;拋ƀ;qs▋ও◺lanôবʀ;cdgsব☊☍☝☨c;檨otĀ;o☔☕橿Ā;r☚☛檁;檃Ā;e☢☥쀀⋚︀s;檓ʀadegs☳☹☽♉♋pproøⓆot;拖qĀgq♃♅ôউgtò⒌ôছiíলƀilr♕࣡♚sht;楼;쀀𝔩Ā;Eজ♣;檑š♩♶rĀdu▲♮Ā;l॥♳;楪lk;斄cy;䑙ʀ;achtੈ⚈⚋⚑⚖rò◁orneòᴈard;楫ri;旺Āio⚟⚤dot;䅀ustĀ;a⚬⚭掰che»⚭ȀEaes⚻⚽⛉⛔;扨pĀ;p⛃⛄檉rox»⛄Ā;q⛎⛏檇Ā;q⛎⚻im;拦Ѐabnoptwz⛩⛴⛷✚✯❁❇❐Ānr⛮⛱g;柬r;懽rëࣁgƀlmr⛿✍✔eftĀar০✇ightá৲apsto;柼ightá৽parrowĀlr✥✩efô⓭ight;憬ƀafl✶✹✽r;榅;쀀𝕝us;樭imes;樴š❋❏st;戗áፎƀ;ef❗❘᠀旊nge»❘arĀ;l❤❥䀨t;榓ʀachmt❳❶❼➅➇ròࢨorneòᶌarĀ;d྘➃;業;怎ri;抿̀achiqt➘➝ੀ➢➮➻quo;怹r;쀀𝓁mƀ;egল➪➬;檍;檏Ābu┪➳oĀ;rฟ➹;怚rok;䅂萀<;cdhilqrࠫ⟒☹⟜⟠⟥⟪⟰Āci⟗⟙;檦r;橹reå◲mes;拉arr;楶uest;橻ĀPi⟵⟹ar;榖ƀ;ef⠀भ᠛旃rĀdu⠇⠍shar;楊har;楦Āen⠗⠡rtneqq;쀀≨︀Å⠞܀Dacdefhilnopsu⡀⡅⢂⢎⢓⢠⢥⢨⣚⣢⣤ઃ⣳⤂Dot;戺Ȁclpr⡎⡒⡣⡽r耻¯䂯Āet⡗⡙;時Ā;e⡞⡟朠se»⡟Ā;sျ⡨toȀ;dluျ⡳⡷⡻owîҌefôएðᏑker;斮Āoy⢇⢌mma;権;䐼ash;怔asuredangle»ᘦr;쀀𝔪o;愧ƀcdn⢯⢴⣉ro耻µ䂵Ȁ;acdᑤ⢽⣀⣄sôᚧir;櫰ot肻·Ƶusƀ;bd⣒ᤃ⣓戒Ā;uᴼ⣘;横ţ⣞⣡p;櫛ò−ðઁĀdp⣩⣮els;抧f;쀀𝕞Āct⣸⣽r;쀀𝓂pos»ᖝƀ;lm⤉⤊⤍䎼timap;抸ఀGLRVabcdefghijlmoprstuvw⥂⥓⥾⦉⦘⧚⧩⨕⨚⩘⩝⪃⪕⪤⪨⬄⬇⭄⭿⮮ⰴⱧⱼ⳩Āgt⥇⥋;쀀⋙̸Ā;v⥐௏쀀≫⃒ƀelt⥚⥲⥶ftĀar⥡⥧rrow;懍ightarrow;懎;쀀⋘̸Ā;v⥻ే쀀≪⃒ightarrow;懏ĀDd⦎⦓ash;抯ash;抮ʀbcnpt⦣⦧⦬⦱⧌la»˞ute;䅄g;쀀∠⃒ʀ;Eiop඄⦼⧀⧅⧈;쀀⩰̸d;쀀≋̸s;䅉roø඄urĀ;a⧓⧔普lĀ;s⧓ସǳ⧟\0⧣p肻\xA0ଷmpĀ;e௹ఀʀaeouy⧴⧾⨃⨐⨓ǰ⧹\0⧻;橃on;䅈dil;䅆ngĀ;dൾ⨊ot;쀀⩭̸p;橂;䐽ash;怓΀;Aadqsxஒ⨩⨭⨻⩁⩅⩐rr;懗rĀhr⨳⨶k;椤Ā;oᏲᏰot;쀀≐̸uiöୣĀei⩊⩎ar;椨í஘istĀ;s஠டr;쀀𝔫ȀEest௅⩦⩹⩼ƀ;qs஼⩭௡ƀ;qs஼௅⩴lanô௢ií௪Ā;rஶ⪁»ஷƀAap⪊⪍⪑rò⥱rr;憮ar;櫲ƀ;svྍ⪜ྌĀ;d⪡⪢拼;拺cy;䑚΀AEadest⪷⪺⪾⫂⫅⫶⫹rò⥦;쀀≦̸rr;憚r;急Ȁ;fqs఻⫎⫣⫯tĀar⫔⫙rro÷⫁ightarro÷⪐ƀ;qs఻⪺⫪lanôౕĀ;sౕ⫴»శiíౝĀ;rవ⫾iĀ;eచథiäඐĀpt⬌⬑f;쀀𝕟膀¬;in⬙⬚⬶䂬nȀ;Edvஉ⬤⬨⬮;쀀⋹̸ot;쀀⋵̸ǡஉ⬳⬵;拷;拶iĀ;vಸ⬼ǡಸ⭁⭃;拾;拽ƀaor⭋⭣⭩rȀ;ast୻⭕⭚⭟lleì୻l;쀀⫽⃥;쀀∂̸lint;樔ƀ;ceಒ⭰⭳uåಥĀ;cಘ⭸Ā;eಒ⭽ñಘȀAait⮈⮋⮝⮧rò⦈rrƀ;cw⮔⮕⮙憛;쀀⤳̸;쀀↝̸ghtarrow»⮕riĀ;eೋೖ΀chimpqu⮽⯍⯙⬄୸⯤⯯Ȁ;cerല⯆ഷ⯉uå൅;쀀𝓃ortɭ⬅\0\0⯖ará⭖mĀ;e൮⯟Ā;q൴൳suĀbp⯫⯭å೸åഋƀbcp⯶ⰑⰙȀ;Ees⯿ⰀഢⰄ抄;쀀⫅̸etĀ;eഛⰋqĀ;qണⰀcĀ;eലⰗñസȀ;EesⰢⰣൟⰧ抅;쀀⫆̸etĀ;e൘ⰮqĀ;qൠⰣȀgilrⰽⰿⱅⱇìௗlde耻ñ䃱çృiangleĀlrⱒⱜeftĀ;eచⱚñదightĀ;eೋⱥñ೗Ā;mⱬⱭ䎽ƀ;esⱴⱵⱹ䀣ro;愖p;怇ҀDHadgilrsⲏⲔⲙⲞⲣⲰⲶⳓⳣash;抭arr;椄p;쀀≍⃒ash;抬ĀetⲨⲬ;쀀≥⃒;쀀>⃒nfin;槞ƀAetⲽⳁⳅrr;椂;쀀≤⃒Ā;rⳊⳍ쀀<⃒ie;쀀⊴⃒ĀAtⳘⳜrr;椃rie;쀀⊵⃒im;쀀∼⃒ƀAan⳰⳴ⴂrr;懖rĀhr⳺⳽k;椣Ā;oᏧᏥear;椧ቓ᪕\0\0\0\0\0\0\0\0\0\0\0\0\0ⴭ\0ⴸⵈⵠⵥ⵲ⶄᬇ\0\0ⶍⶫ\0ⷈⷎ\0ⷜ⸙⸫⸾⹃Ācsⴱ᪗ute耻ó䃳ĀiyⴼⵅrĀ;c᪞ⵂ耻ô䃴;䐾ʀabios᪠ⵒⵗǈⵚlac;䅑v;樸old;榼lig;䅓Ācr⵩⵭ir;榿;쀀𝔬ͯ⵹\0\0⵼\0ⶂn;䋛ave耻ò䃲;槁Ābmⶈ෴ar;榵Ȁacitⶕ⶘ⶥⶨrò᪀Āir⶝ⶠr;榾oss;榻nå๒;槀ƀaeiⶱⶵⶹcr;䅍ga;䏉ƀcdnⷀⷅǍron;䎿;榶pf;쀀𝕠ƀaelⷔ⷗ǒr;榷rp;榹΀;adiosvⷪⷫⷮ⸈⸍⸐⸖戨rò᪆Ȁ;efmⷷⷸ⸂⸅橝rĀ;oⷾⷿ愴f»ⷿ耻ª䂪耻º䂺gof;抶r;橖lope;橗;橛ƀclo⸟⸡⸧ò⸁ash耻ø䃸l;折iŬⸯ⸴de耻õ䃵esĀ;aǛ⸺s;樶ml耻ö䃶bar;挽ૡ⹞\0⹽\0⺀⺝\0⺢⺹\0\0⻋ຜ\0⼓\0\0⼫⾼\0⿈rȀ;astЃ⹧⹲຅脀¶;l⹭⹮䂶leìЃɩ⹸\0\0⹻m;櫳;櫽y;䐿rʀcimpt⺋⺏⺓ᡥ⺗nt;䀥od;䀮il;怰enk;怱r;쀀𝔭ƀimo⺨⺰⺴Ā;v⺭⺮䏆;䏕maô੶ne;明ƀ;tv⺿⻀⻈䏀chfork»´;䏖Āau⻏⻟nĀck⻕⻝kĀ;h⇴⻛;愎ö⇴sҀ;abcdemst⻳⻴ᤈ⻹⻽⼄⼆⼊⼎䀫cir;樣ir;樢Āouᵀ⼂;樥;橲n肻±ຝim;樦wo;樧ƀipu⼙⼠⼥ntint;樕f;쀀𝕡nd耻£䂣Ԁ;Eaceinosu່⼿⽁⽄⽇⾁⾉⾒⽾⾶;檳p;檷uå໙Ā;c໎⽌̀;acens່⽙⽟⽦⽨⽾pproø⽃urlyeñ໙ñ໎ƀaes⽯⽶⽺pprox;檹qq;檵im;拨iíໟmeĀ;s⾈ຮ怲ƀEas⽸⾐⽺ð⽵ƀdfp໬⾙⾯ƀals⾠⾥⾪lar;挮ine;挒urf;挓Ā;t໻⾴ï໻rel;抰Āci⿀⿅r;쀀𝓅;䏈ncsp;怈̀fiopsu⿚⋢⿟⿥⿫⿱r;쀀𝔮pf;쀀𝕢rime;恗cr;쀀𝓆ƀaeo⿸〉〓tĀei⿾々rnionóڰnt;樖stĀ;e【】䀿ñἙô༔઀ABHabcdefhilmnoprstux぀けさすムㄎㄫㅇㅢㅲㆎ㈆㈕㈤㈩㉘㉮㉲㊐㊰㊷ƀartぇおがròႳòϝail;検aròᱥar;楤΀cdenqrtとふへみわゔヌĀeuねぱ;쀀∽̱te;䅕iãᅮmptyv;榳gȀ;del࿑らるろ;榒;榥å࿑uo耻»䂻rր;abcfhlpstw࿜ガクシスゼゾダッデナp;極Ā;f࿠ゴs;椠;椳s;椞ë≝ð✮l;楅im;楴l;憣;憝Āaiパフil;椚oĀ;nホボ戶aló༞ƀabrョリヮrò៥rk;杳ĀakンヽcĀekヹ・;䁽;䁝Āes㄂㄄;榌lĀduㄊㄌ;榎;榐Ȁaeuyㄗㄜㄧㄩron;䅙Ādiㄡㄥil;䅗ì࿲âヺ;䑀Ȁclqsㄴㄷㄽㅄa;椷dhar;楩uoĀ;rȎȍh;憳ƀacgㅎㅟངlȀ;ipsླྀㅘㅛႜnåႻarôྩt;断ƀilrㅩဣㅮsht;楽;쀀𝔯ĀaoㅷㆆrĀduㅽㅿ»ѻĀ;l႑ㆄ;楬Ā;vㆋㆌ䏁;䏱ƀgns㆕ㇹㇼht̀ahlrstㆤㆰ㇂㇘㇤㇮rrowĀ;t࿜ㆭaéトarpoonĀduㆻㆿowîㅾp»႒eftĀah㇊㇐rrowó࿪arpoonóՑightarrows;應quigarro÷ニhreetimes;拌g;䋚ingdotseñἲƀahm㈍㈐㈓rò࿪aòՑ;怏oustĀ;a㈞㈟掱che»㈟mid;櫮Ȁabpt㈲㈽㉀㉒Ānr㈷㈺g;柭r;懾rëဃƀafl㉇㉊㉎r;榆;쀀𝕣us;樮imes;樵Āap㉝㉧rĀ;g㉣㉤䀩t;榔olint;樒arò㇣Ȁachq㉻㊀Ⴜ㊅quo;怺r;쀀𝓇Ābu・㊊oĀ;rȔȓƀhir㊗㊛㊠reåㇸmes;拊iȀ;efl㊪ၙᠡ㊫方tri;槎luhar;楨;愞ൡ㋕㋛㋟㌬㌸㍱\0㍺㎤\0\0㏬㏰\0㐨㑈㑚㒭㒱㓊㓱\0㘖\0\0㘳cute;䅛quï➺Ԁ;Eaceinpsyᇭ㋳㋵㋿㌂㌋㌏㌟㌦㌩;檴ǰ㋺\0㋼;檸on;䅡uåᇾĀ;dᇳ㌇il;䅟rc;䅝ƀEas㌖㌘㌛;檶p;檺im;择olint;樓iíሄ;䑁otƀ;be㌴ᵇ㌵担;橦΀Aacmstx㍆㍊㍗㍛㍞㍣㍭rr;懘rĀhr㍐㍒ë∨Ā;oਸ਼਴t耻§䂧i;䀻war;椩mĀin㍩ðnuóñt;朶rĀ;o㍶⁕쀀𝔰Ȁacoy㎂㎆㎑㎠rp;景Āhy㎋㎏cy;䑉;䑈rtɭ㎙\0\0㎜iäᑤaraì⹯耻­䂭Āgm㎨㎴maƀ;fv㎱㎲㎲䏃;䏂Ѐ;deglnprካ㏅㏉㏎㏖㏞㏡㏦ot;橪Ā;q኱ኰĀ;E㏓㏔檞;檠Ā;E㏛㏜檝;檟e;扆lus;樤arr;楲aròᄽȀaeit㏸㐈㐏㐗Āls㏽㐄lsetmé㍪hp;樳parsl;槤Ādlᑣ㐔e;挣Ā;e㐜㐝檪Ā;s㐢㐣檬;쀀⪬︀ƀflp㐮㐳㑂tcy;䑌Ā;b㐸㐹䀯Ā;a㐾㐿槄r;挿f;쀀𝕤aĀdr㑍ЂesĀ;u㑔㑕晠it»㑕ƀcsu㑠㑹㒟Āau㑥㑯pĀ;sᆈ㑫;쀀⊓︀pĀ;sᆴ㑵;쀀⊔︀uĀbp㑿㒏ƀ;esᆗᆜ㒆etĀ;eᆗ㒍ñᆝƀ;esᆨᆭ㒖etĀ;eᆨ㒝ñᆮƀ;afᅻ㒦ְrť㒫ֱ»ᅼaròᅈȀcemt㒹㒾㓂㓅r;쀀𝓈tmîñiì㐕aræᆾĀar㓎㓕rĀ;f㓔ឿ昆Āan㓚㓭ightĀep㓣㓪psiloîỠhé⺯s»⡒ʀbcmnp㓻㕞ሉ㖋㖎Ҁ;Edemnprs㔎㔏㔑㔕㔞㔣㔬㔱㔶抂;櫅ot;檽Ā;dᇚ㔚ot;櫃ult;櫁ĀEe㔨㔪;櫋;把lus;檿arr;楹ƀeiu㔽㕒㕕tƀ;en㔎㕅㕋qĀ;qᇚ㔏eqĀ;q㔫㔨m;櫇Ābp㕚㕜;櫕;櫓c̀;acensᇭ㕬㕲㕹㕻㌦pproø㋺urlyeñᇾñᇳƀaes㖂㖈㌛pproø㌚qñ㌗g;晪ڀ123;Edehlmnps㖩㖬㖯ሜ㖲㖴㗀㗉㗕㗚㗟㗨㗭耻¹䂹耻²䂲耻³䂳;櫆Āos㖹㖼t;檾ub;櫘Ā;dሢ㗅ot;櫄sĀou㗏㗒l;柉b;櫗arr;楻ult;櫂ĀEe㗤㗦;櫌;抋lus;櫀ƀeiu㗴㘉㘌tƀ;enሜ㗼㘂qĀ;qሢ㖲eqĀ;q㗧㗤m;櫈Ābp㘑㘓;櫔;櫖ƀAan㘜㘠㘭rr;懙rĀhr㘦㘨ë∮Ā;oਫ਩war;椪lig耻ß䃟௡㙑㙝㙠ዎ㙳㙹\0㙾㛂\0\0\0\0\0㛛㜃\0㜉㝬\0\0\0㞇ɲ㙖\0\0㙛get;挖;䏄rë๟ƀaey㙦㙫㙰ron;䅥dil;䅣;䑂lrec;挕r;쀀𝔱Ȁeiko㚆㚝㚵㚼ǲ㚋\0㚑eĀ4fኄኁaƀ;sv㚘㚙㚛䎸ym;䏑Ācn㚢㚲kĀas㚨㚮pproø዁im»ኬsðኞĀas㚺㚮ð዁rn耻þ䃾Ǭ̟㛆⋧es膀×;bd㛏㛐㛘䃗Ā;aᤏ㛕r;樱;樰ƀeps㛡㛣㜀á⩍Ȁ;bcf҆㛬㛰㛴ot;挶ir;櫱Ā;o㛹㛼쀀𝕥rk;櫚á㍢rime;怴ƀaip㜏㜒㝤dåቈ΀adempst㜡㝍㝀㝑㝗㝜㝟ngleʀ;dlqr㜰㜱㜶㝀㝂斵own»ᶻeftĀ;e⠀㜾ñम;扜ightĀ;e㊪㝋ñၚot;旬inus;樺lus;樹b;槍ime;樻ezium;揢ƀcht㝲㝽㞁Āry㝷㝻;쀀𝓉;䑆cy;䑛rok;䅧Āio㞋㞎xô᝷headĀlr㞗㞠eftarro÷ࡏightarrow»ཝऀAHabcdfghlmoprstuw㟐㟓㟗㟤㟰㟼㠎㠜㠣㠴㡑㡝㡫㢩㣌㣒㣪㣶ròϭar;楣Ācr㟜㟢ute耻ú䃺òᅐrǣ㟪\0㟭y;䑞ve;䅭Āiy㟵㟺rc耻û䃻;䑃ƀabh㠃㠆㠋ròᎭlac;䅱aòᏃĀir㠓㠘sht;楾;쀀𝔲rave耻ù䃹š㠧㠱rĀlr㠬㠮»ॗ»ႃlk;斀Āct㠹㡍ɯ㠿\0\0㡊rnĀ;e㡅㡆挜r»㡆op;挏ri;旸Āal㡖㡚cr;䅫肻¨͉Āgp㡢㡦on;䅳f;쀀𝕦̀adhlsuᅋ㡸㡽፲㢑㢠ownáᎳarpoonĀlr㢈㢌efô㠭ighô㠯iƀ;hl㢙㢚㢜䏅»ᏺon»㢚parrows;懈ƀcit㢰㣄㣈ɯ㢶\0\0㣁rnĀ;e㢼㢽挝r»㢽op;挎ng;䅯ri;旹cr;쀀𝓊ƀdir㣙㣝㣢ot;拰lde;䅩iĀ;f㜰㣨»᠓Āam㣯㣲rò㢨l耻ü䃼angle;榧ހABDacdeflnoprsz㤜㤟㤩㤭㦵㦸㦽㧟㧤㧨㧳㧹㧽㨁㨠ròϷarĀ;v㤦㤧櫨;櫩asèϡĀnr㤲㤷grt;榜΀eknprst㓣㥆㥋㥒㥝㥤㦖appá␕othinçẖƀhir㓫⻈㥙opô⾵Ā;hᎷ㥢ïㆍĀiu㥩㥭gmá㎳Ābp㥲㦄setneqĀ;q㥽㦀쀀⊊︀;쀀⫋︀setneqĀ;q㦏㦒쀀⊋︀;쀀⫌︀Āhr㦛㦟etá㚜iangleĀlr㦪㦯eft»थight»ၑy;䐲ash»ံƀelr㧄㧒㧗ƀ;beⷪ㧋㧏ar;抻q;扚lip;拮Ābt㧜ᑨaòᑩr;쀀𝔳tré㦮suĀbp㧯㧱»ജ»൙pf;쀀𝕧roð໻tré㦴Ācu㨆㨋r;쀀𝓋Ābp㨐㨘nĀEe㦀㨖»㥾nĀEe㦒㨞»㦐igzag;榚΀cefoprs㨶㨻㩖㩛㩔㩡㩪irc;䅵Ādi㩀㩑Ābg㩅㩉ar;機eĀ;qᗺ㩏;扙erp;愘r;쀀𝔴pf;쀀𝕨Ā;eᑹ㩦atèᑹcr;쀀𝓌ૣណ㪇\0㪋\0㪐㪛\0\0㪝㪨㪫㪯\0\0㫃㫎\0㫘ៜ៟tré៑r;쀀𝔵ĀAa㪔㪗ròσrò৶;䎾ĀAa㪡㪤ròθrò৫að✓is;拻ƀdptឤ㪵㪾Āfl㪺ឩ;쀀𝕩imåឲĀAa㫇㫊ròώròਁĀcq㫒ីr;쀀𝓍Āpt៖㫜ré។Ѐacefiosu㫰㫽㬈㬌㬑㬕㬛㬡cĀuy㫶㫻te耻ý䃽;䑏Āiy㬂㬆rc;䅷;䑋n耻¥䂥r;쀀𝔶cy;䑗pf;쀀𝕪cr;쀀𝓎Ācm㬦㬩y;䑎l耻ÿ䃿Ԁacdefhiosw㭂㭈㭔㭘㭤㭩㭭㭴㭺㮀cute;䅺Āay㭍㭒ron;䅾;䐷ot;䅼Āet㭝㭡træᕟa;䎶r;쀀𝔷cy;䐶grarr;懝pf;쀀𝕫cr;쀀𝓏Ājn㮅㮇;怍j;怌`
      .split(``)
      .map((e) => e.charCodeAt(0)),
  ),
  un = new Map([
    [0, 65533],
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376],
  ]);
String.fromCodePoint;
function dn(e) {
  return (e >= 55296 && e <= 57343) || e > 1114111 ? 65533 : (un.get(e) ?? e);
}
var fn;
(function (e) {
  ((e[(e.NUM = 35)] = `NUM`),
    (e[(e.SEMI = 59)] = `SEMI`),
    (e[(e.EQUALS = 61)] = `EQUALS`),
    (e[(e.ZERO = 48)] = `ZERO`),
    (e[(e.NINE = 57)] = `NINE`),
    (e[(e.LOWER_A = 97)] = `LOWER_A`),
    (e[(e.LOWER_F = 102)] = `LOWER_F`),
    (e[(e.LOWER_X = 120)] = `LOWER_X`),
    (e[(e.LOWER_Z = 122)] = `LOWER_Z`),
    (e[(e.UPPER_A = 65)] = `UPPER_A`),
    (e[(e.UPPER_F = 70)] = `UPPER_F`),
    (e[(e.UPPER_Z = 90)] = `UPPER_Z`));
})((fn ||= {}));
var pn = 32,
  mn;
(function (e) {
  ((e[(e.VALUE_LENGTH = 49152)] = `VALUE_LENGTH`),
    (e[(e.BRANCH_LENGTH = 16256)] = `BRANCH_LENGTH`),
    (e[(e.JUMP_TABLE = 127)] = `JUMP_TABLE`));
})((mn ||= {}));
function hn(e) {
  return e >= fn.ZERO && e <= fn.NINE;
}
function gn(e) {
  return (
    (e >= fn.UPPER_A && e <= fn.UPPER_F) || (e >= fn.LOWER_A && e <= fn.LOWER_F)
  );
}
function _n(e) {
  return (
    (e >= fn.UPPER_A && e <= fn.UPPER_Z) ||
    (e >= fn.LOWER_A && e <= fn.LOWER_Z) ||
    hn(e)
  );
}
function vn(e) {
  return e === fn.EQUALS || _n(e);
}
var yn;
(function (e) {
  ((e[(e.EntityStart = 0)] = `EntityStart`),
    (e[(e.NumericStart = 1)] = `NumericStart`),
    (e[(e.NumericDecimal = 2)] = `NumericDecimal`),
    (e[(e.NumericHex = 3)] = `NumericHex`),
    (e[(e.NamedEntity = 4)] = `NamedEntity`));
})((yn ||= {}));
var bn;
(function (e) {
  ((e[(e.Legacy = 0)] = `Legacy`),
    (e[(e.Strict = 1)] = `Strict`),
    (e[(e.Attribute = 2)] = `Attribute`));
})((bn ||= {}));
var xn = class {
  constructor(e, t, n) {
    ((this.decodeTree = e),
      (this.emitCodePoint = t),
      (this.errors = n),
      (this.state = yn.EntityStart),
      (this.consumed = 1),
      (this.result = 0),
      (this.treeIndex = 0),
      (this.excess = 1),
      (this.decodeMode = bn.Strict));
  }
  startEntity(e) {
    ((this.decodeMode = e),
      (this.state = yn.EntityStart),
      (this.result = 0),
      (this.treeIndex = 0),
      (this.excess = 1),
      (this.consumed = 1));
  }
  write(e, t) {
    switch (this.state) {
      case yn.EntityStart:
        return e.charCodeAt(t) === fn.NUM
          ? ((this.state = yn.NumericStart),
            (this.consumed += 1),
            this.stateNumericStart(e, t + 1))
          : ((this.state = yn.NamedEntity), this.stateNamedEntity(e, t));
      case yn.NumericStart:
        return this.stateNumericStart(e, t);
      case yn.NumericDecimal:
        return this.stateNumericDecimal(e, t);
      case yn.NumericHex:
        return this.stateNumericHex(e, t);
      case yn.NamedEntity:
        return this.stateNamedEntity(e, t);
    }
  }
  stateNumericStart(e, t) {
    return t >= e.length
      ? -1
      : (e.charCodeAt(t) | pn) === fn.LOWER_X
        ? ((this.state = yn.NumericHex),
          (this.consumed += 1),
          this.stateNumericHex(e, t + 1))
        : ((this.state = yn.NumericDecimal), this.stateNumericDecimal(e, t));
  }
  addToNumericResult(e, t, n, r) {
    if (t !== n) {
      let i = n - t;
      ((this.result =
        this.result * r ** +i + Number.parseInt(e.substr(t, i), r)),
        (this.consumed += i));
    }
  }
  stateNumericHex(e, t) {
    let n = t;
    for (; t < e.length; ) {
      let r = e.charCodeAt(t);
      if (hn(r) || gn(r)) t += 1;
      else
        return (
          this.addToNumericResult(e, n, t, 16),
          this.emitNumericEntity(r, 3)
        );
    }
    return (this.addToNumericResult(e, n, t, 16), -1);
  }
  stateNumericDecimal(e, t) {
    let n = t;
    for (; t < e.length; ) {
      let r = e.charCodeAt(t);
      if (hn(r)) t += 1;
      else
        return (
          this.addToNumericResult(e, n, t, 10),
          this.emitNumericEntity(r, 2)
        );
    }
    return (this.addToNumericResult(e, n, t, 10), -1);
  }
  emitNumericEntity(e, t) {
    var n;
    if (this.consumed <= t)
      return (
        (n = this.errors) == null ||
          n.absenceOfDigitsInNumericCharacterReference(this.consumed),
        0
      );
    if (e === fn.SEMI) this.consumed += 1;
    else if (this.decodeMode === bn.Strict) return 0;
    return (
      this.emitCodePoint(dn(this.result), this.consumed),
      this.errors &&
        (e !== fn.SEMI && this.errors.missingSemicolonAfterCharacterReference(),
        this.errors.validateNumericCharacterReference(this.result)),
      this.consumed
    );
  }
  stateNamedEntity(e, t) {
    let { decodeTree: n } = this,
      r = n[this.treeIndex],
      i = (r & mn.VALUE_LENGTH) >> 14;
    for (; t < e.length; t++, this.excess++) {
      let a = e.charCodeAt(t);
      if (
        ((this.treeIndex = Sn(n, r, this.treeIndex + Math.max(1, i), a)),
        this.treeIndex < 0)
      )
        return this.result === 0 ||
          (this.decodeMode === bn.Attribute && (i === 0 || vn(a)))
          ? 0
          : this.emitNotTerminatedNamedEntity();
      if (
        ((r = n[this.treeIndex]), (i = (r & mn.VALUE_LENGTH) >> 14), i !== 0)
      ) {
        if (a === fn.SEMI)
          return this.emitNamedEntityData(
            this.treeIndex,
            i,
            this.consumed + this.excess,
          );
        this.decodeMode !== bn.Strict &&
          ((this.result = this.treeIndex),
          (this.consumed += this.excess),
          (this.excess = 0));
      }
    }
    return -1;
  }
  emitNotTerminatedNamedEntity() {
    var e;
    let { result: t, decodeTree: n } = this,
      r = (n[t] & mn.VALUE_LENGTH) >> 14;
    return (
      this.emitNamedEntityData(t, r, this.consumed),
      (e = this.errors) == null || e.missingSemicolonAfterCharacterReference(),
      this.consumed
    );
  }
  emitNamedEntityData(e, t, n) {
    let { decodeTree: r } = this;
    return (
      this.emitCodePoint(t === 1 ? r[e] & ~mn.VALUE_LENGTH : r[e + 1], n),
      t === 3 && this.emitCodePoint(r[e + 2], n),
      n
    );
  }
  end() {
    var e;
    switch (this.state) {
      case yn.NamedEntity:
        return this.result !== 0 &&
          (this.decodeMode !== bn.Attribute || this.result === this.treeIndex)
          ? this.emitNotTerminatedNamedEntity()
          : 0;
      case yn.NumericDecimal:
        return this.emitNumericEntity(0, 2);
      case yn.NumericHex:
        return this.emitNumericEntity(0, 3);
      case yn.NumericStart:
        return (
          (e = this.errors) == null ||
            e.absenceOfDigitsInNumericCharacterReference(this.consumed),
          0
        );
      case yn.EntityStart:
        return 0;
    }
  }
};
function Sn(e, t, n, r) {
  let i = (t & mn.BRANCH_LENGTH) >> 7,
    a = t & mn.JUMP_TABLE;
  if (i === 0) return a !== 0 && r === a ? n : -1;
  if (a) {
    let t = r - a;
    return t < 0 || t >= i ? -1 : e[n + t] - 1;
  }
  let o = n,
    s = o + i - 1;
  for (; o <= s; ) {
    let t = (o + s) >>> 1,
      n = e[t];
    if (n < r) o = t + 1;
    else if (n > r) s = t - 1;
    else return e[t + i];
  }
  return -1;
}
var B;
(function (e) {
  ((e.HTML = `http://www.w3.org/1999/xhtml`),
    (e.MATHML = `http://www.w3.org/1998/Math/MathML`),
    (e.SVG = `http://www.w3.org/2000/svg`),
    (e.XLINK = `http://www.w3.org/1999/xlink`),
    (e.XML = `http://www.w3.org/XML/1998/namespace`),
    (e.XMLNS = `http://www.w3.org/2000/xmlns/`));
})((B ||= {}));
var Cn;
(function (e) {
  ((e.TYPE = `type`),
    (e.ACTION = `action`),
    (e.ENCODING = `encoding`),
    (e.PROMPT = `prompt`),
    (e.NAME = `name`),
    (e.COLOR = `color`),
    (e.FACE = `face`),
    (e.SIZE = `size`));
})((Cn ||= {}));
var wn;
(function (e) {
  ((e.NO_QUIRKS = `no-quirks`),
    (e.QUIRKS = `quirks`),
    (e.LIMITED_QUIRKS = `limited-quirks`));
})((wn ||= {}));
var V;
(function (e) {
  ((e.A = `a`),
    (e.ADDRESS = `address`),
    (e.ANNOTATION_XML = `annotation-xml`),
    (e.APPLET = `applet`),
    (e.AREA = `area`),
    (e.ARTICLE = `article`),
    (e.ASIDE = `aside`),
    (e.B = `b`),
    (e.BASE = `base`),
    (e.BASEFONT = `basefont`),
    (e.BGSOUND = `bgsound`),
    (e.BIG = `big`),
    (e.BLOCKQUOTE = `blockquote`),
    (e.BODY = `body`),
    (e.BR = `br`),
    (e.BUTTON = `button`),
    (e.CAPTION = `caption`),
    (e.CENTER = `center`),
    (e.CODE = `code`),
    (e.COL = `col`),
    (e.COLGROUP = `colgroup`),
    (e.DD = `dd`),
    (e.DESC = `desc`),
    (e.DETAILS = `details`),
    (e.DIALOG = `dialog`),
    (e.DIR = `dir`),
    (e.DIV = `div`),
    (e.DL = `dl`),
    (e.DT = `dt`),
    (e.EM = `em`),
    (e.EMBED = `embed`),
    (e.FIELDSET = `fieldset`),
    (e.FIGCAPTION = `figcaption`),
    (e.FIGURE = `figure`),
    (e.FONT = `font`),
    (e.FOOTER = `footer`),
    (e.FOREIGN_OBJECT = `foreignObject`),
    (e.FORM = `form`),
    (e.FRAME = `frame`),
    (e.FRAMESET = `frameset`),
    (e.H1 = `h1`),
    (e.H2 = `h2`),
    (e.H3 = `h3`),
    (e.H4 = `h4`),
    (e.H5 = `h5`),
    (e.H6 = `h6`),
    (e.HEAD = `head`),
    (e.HEADER = `header`),
    (e.HGROUP = `hgroup`),
    (e.HR = `hr`),
    (e.HTML = `html`),
    (e.I = `i`),
    (e.IMG = `img`),
    (e.IMAGE = `image`),
    (e.INPUT = `input`),
    (e.IFRAME = `iframe`),
    (e.KEYGEN = `keygen`),
    (e.LABEL = `label`),
    (e.LI = `li`),
    (e.LINK = `link`),
    (e.LISTING = `listing`),
    (e.MAIN = `main`),
    (e.MALIGNMARK = `malignmark`),
    (e.MARQUEE = `marquee`),
    (e.MATH = `math`),
    (e.MENU = `menu`),
    (e.META = `meta`),
    (e.MGLYPH = `mglyph`),
    (e.MI = `mi`),
    (e.MO = `mo`),
    (e.MN = `mn`),
    (e.MS = `ms`),
    (e.MTEXT = `mtext`),
    (e.NAV = `nav`),
    (e.NOBR = `nobr`),
    (e.NOFRAMES = `noframes`),
    (e.NOEMBED = `noembed`),
    (e.NOSCRIPT = `noscript`),
    (e.OBJECT = `object`),
    (e.OL = `ol`),
    (e.OPTGROUP = `optgroup`),
    (e.OPTION = `option`),
    (e.P = `p`),
    (e.PARAM = `param`),
    (e.PLAINTEXT = `plaintext`),
    (e.PRE = `pre`),
    (e.RB = `rb`),
    (e.RP = `rp`),
    (e.RT = `rt`),
    (e.RTC = `rtc`),
    (e.RUBY = `ruby`),
    (e.S = `s`),
    (e.SCRIPT = `script`),
    (e.SEARCH = `search`),
    (e.SECTION = `section`),
    (e.SELECT = `select`),
    (e.SOURCE = `source`),
    (e.SMALL = `small`),
    (e.SPAN = `span`),
    (e.STRIKE = `strike`),
    (e.STRONG = `strong`),
    (e.STYLE = `style`),
    (e.SUB = `sub`),
    (e.SUMMARY = `summary`),
    (e.SUP = `sup`),
    (e.TABLE = `table`),
    (e.TBODY = `tbody`),
    (e.TEMPLATE = `template`),
    (e.TEXTAREA = `textarea`),
    (e.TFOOT = `tfoot`),
    (e.TD = `td`),
    (e.TH = `th`),
    (e.THEAD = `thead`),
    (e.TITLE = `title`),
    (e.TR = `tr`),
    (e.TRACK = `track`),
    (e.TT = `tt`),
    (e.U = `u`),
    (e.UL = `ul`),
    (e.SVG = `svg`),
    (e.VAR = `var`),
    (e.WBR = `wbr`),
    (e.XMP = `xmp`));
})((V ||= {}));
var H;
(function (e) {
  ((e[(e.UNKNOWN = 0)] = `UNKNOWN`),
    (e[(e.A = 1)] = `A`),
    (e[(e.ADDRESS = 2)] = `ADDRESS`),
    (e[(e.ANNOTATION_XML = 3)] = `ANNOTATION_XML`),
    (e[(e.APPLET = 4)] = `APPLET`),
    (e[(e.AREA = 5)] = `AREA`),
    (e[(e.ARTICLE = 6)] = `ARTICLE`),
    (e[(e.ASIDE = 7)] = `ASIDE`),
    (e[(e.B = 8)] = `B`),
    (e[(e.BASE = 9)] = `BASE`),
    (e[(e.BASEFONT = 10)] = `BASEFONT`),
    (e[(e.BGSOUND = 11)] = `BGSOUND`),
    (e[(e.BIG = 12)] = `BIG`),
    (e[(e.BLOCKQUOTE = 13)] = `BLOCKQUOTE`),
    (e[(e.BODY = 14)] = `BODY`),
    (e[(e.BR = 15)] = `BR`),
    (e[(e.BUTTON = 16)] = `BUTTON`),
    (e[(e.CAPTION = 17)] = `CAPTION`),
    (e[(e.CENTER = 18)] = `CENTER`),
    (e[(e.CODE = 19)] = `CODE`),
    (e[(e.COL = 20)] = `COL`),
    (e[(e.COLGROUP = 21)] = `COLGROUP`),
    (e[(e.DD = 22)] = `DD`),
    (e[(e.DESC = 23)] = `DESC`),
    (e[(e.DETAILS = 24)] = `DETAILS`),
    (e[(e.DIALOG = 25)] = `DIALOG`),
    (e[(e.DIR = 26)] = `DIR`),
    (e[(e.DIV = 27)] = `DIV`),
    (e[(e.DL = 28)] = `DL`),
    (e[(e.DT = 29)] = `DT`),
    (e[(e.EM = 30)] = `EM`),
    (e[(e.EMBED = 31)] = `EMBED`),
    (e[(e.FIELDSET = 32)] = `FIELDSET`),
    (e[(e.FIGCAPTION = 33)] = `FIGCAPTION`),
    (e[(e.FIGURE = 34)] = `FIGURE`),
    (e[(e.FONT = 35)] = `FONT`),
    (e[(e.FOOTER = 36)] = `FOOTER`),
    (e[(e.FOREIGN_OBJECT = 37)] = `FOREIGN_OBJECT`),
    (e[(e.FORM = 38)] = `FORM`),
    (e[(e.FRAME = 39)] = `FRAME`),
    (e[(e.FRAMESET = 40)] = `FRAMESET`),
    (e[(e.H1 = 41)] = `H1`),
    (e[(e.H2 = 42)] = `H2`),
    (e[(e.H3 = 43)] = `H3`),
    (e[(e.H4 = 44)] = `H4`),
    (e[(e.H5 = 45)] = `H5`),
    (e[(e.H6 = 46)] = `H6`),
    (e[(e.HEAD = 47)] = `HEAD`),
    (e[(e.HEADER = 48)] = `HEADER`),
    (e[(e.HGROUP = 49)] = `HGROUP`),
    (e[(e.HR = 50)] = `HR`),
    (e[(e.HTML = 51)] = `HTML`),
    (e[(e.I = 52)] = `I`),
    (e[(e.IMG = 53)] = `IMG`),
    (e[(e.IMAGE = 54)] = `IMAGE`),
    (e[(e.INPUT = 55)] = `INPUT`),
    (e[(e.IFRAME = 56)] = `IFRAME`),
    (e[(e.KEYGEN = 57)] = `KEYGEN`),
    (e[(e.LABEL = 58)] = `LABEL`),
    (e[(e.LI = 59)] = `LI`),
    (e[(e.LINK = 60)] = `LINK`),
    (e[(e.LISTING = 61)] = `LISTING`),
    (e[(e.MAIN = 62)] = `MAIN`),
    (e[(e.MALIGNMARK = 63)] = `MALIGNMARK`),
    (e[(e.MARQUEE = 64)] = `MARQUEE`),
    (e[(e.MATH = 65)] = `MATH`),
    (e[(e.MENU = 66)] = `MENU`),
    (e[(e.META = 67)] = `META`),
    (e[(e.MGLYPH = 68)] = `MGLYPH`),
    (e[(e.MI = 69)] = `MI`),
    (e[(e.MO = 70)] = `MO`),
    (e[(e.MN = 71)] = `MN`),
    (e[(e.MS = 72)] = `MS`),
    (e[(e.MTEXT = 73)] = `MTEXT`),
    (e[(e.NAV = 74)] = `NAV`),
    (e[(e.NOBR = 75)] = `NOBR`),
    (e[(e.NOFRAMES = 76)] = `NOFRAMES`),
    (e[(e.NOEMBED = 77)] = `NOEMBED`),
    (e[(e.NOSCRIPT = 78)] = `NOSCRIPT`),
    (e[(e.OBJECT = 79)] = `OBJECT`),
    (e[(e.OL = 80)] = `OL`),
    (e[(e.OPTGROUP = 81)] = `OPTGROUP`),
    (e[(e.OPTION = 82)] = `OPTION`),
    (e[(e.P = 83)] = `P`),
    (e[(e.PARAM = 84)] = `PARAM`),
    (e[(e.PLAINTEXT = 85)] = `PLAINTEXT`),
    (e[(e.PRE = 86)] = `PRE`),
    (e[(e.RB = 87)] = `RB`),
    (e[(e.RP = 88)] = `RP`),
    (e[(e.RT = 89)] = `RT`),
    (e[(e.RTC = 90)] = `RTC`),
    (e[(e.RUBY = 91)] = `RUBY`),
    (e[(e.S = 92)] = `S`),
    (e[(e.SCRIPT = 93)] = `SCRIPT`),
    (e[(e.SEARCH = 94)] = `SEARCH`),
    (e[(e.SECTION = 95)] = `SECTION`),
    (e[(e.SELECT = 96)] = `SELECT`),
    (e[(e.SOURCE = 97)] = `SOURCE`),
    (e[(e.SMALL = 98)] = `SMALL`),
    (e[(e.SPAN = 99)] = `SPAN`),
    (e[(e.STRIKE = 100)] = `STRIKE`),
    (e[(e.STRONG = 101)] = `STRONG`),
    (e[(e.STYLE = 102)] = `STYLE`),
    (e[(e.SUB = 103)] = `SUB`),
    (e[(e.SUMMARY = 104)] = `SUMMARY`),
    (e[(e.SUP = 105)] = `SUP`),
    (e[(e.TABLE = 106)] = `TABLE`),
    (e[(e.TBODY = 107)] = `TBODY`),
    (e[(e.TEMPLATE = 108)] = `TEMPLATE`),
    (e[(e.TEXTAREA = 109)] = `TEXTAREA`),
    (e[(e.TFOOT = 110)] = `TFOOT`),
    (e[(e.TD = 111)] = `TD`),
    (e[(e.TH = 112)] = `TH`),
    (e[(e.THEAD = 113)] = `THEAD`),
    (e[(e.TITLE = 114)] = `TITLE`),
    (e[(e.TR = 115)] = `TR`),
    (e[(e.TRACK = 116)] = `TRACK`),
    (e[(e.TT = 117)] = `TT`),
    (e[(e.U = 118)] = `U`),
    (e[(e.UL = 119)] = `UL`),
    (e[(e.SVG = 120)] = `SVG`),
    (e[(e.VAR = 121)] = `VAR`),
    (e[(e.WBR = 122)] = `WBR`),
    (e[(e.XMP = 123)] = `XMP`));
})((H ||= {}));
var Tn = new Map([
  [V.A, H.A],
  [V.ADDRESS, H.ADDRESS],
  [V.ANNOTATION_XML, H.ANNOTATION_XML],
  [V.APPLET, H.APPLET],
  [V.AREA, H.AREA],
  [V.ARTICLE, H.ARTICLE],
  [V.ASIDE, H.ASIDE],
  [V.B, H.B],
  [V.BASE, H.BASE],
  [V.BASEFONT, H.BASEFONT],
  [V.BGSOUND, H.BGSOUND],
  [V.BIG, H.BIG],
  [V.BLOCKQUOTE, H.BLOCKQUOTE],
  [V.BODY, H.BODY],
  [V.BR, H.BR],
  [V.BUTTON, H.BUTTON],
  [V.CAPTION, H.CAPTION],
  [V.CENTER, H.CENTER],
  [V.CODE, H.CODE],
  [V.COL, H.COL],
  [V.COLGROUP, H.COLGROUP],
  [V.DD, H.DD],
  [V.DESC, H.DESC],
  [V.DETAILS, H.DETAILS],
  [V.DIALOG, H.DIALOG],
  [V.DIR, H.DIR],
  [V.DIV, H.DIV],
  [V.DL, H.DL],
  [V.DT, H.DT],
  [V.EM, H.EM],
  [V.EMBED, H.EMBED],
  [V.FIELDSET, H.FIELDSET],
  [V.FIGCAPTION, H.FIGCAPTION],
  [V.FIGURE, H.FIGURE],
  [V.FONT, H.FONT],
  [V.FOOTER, H.FOOTER],
  [V.FOREIGN_OBJECT, H.FOREIGN_OBJECT],
  [V.FORM, H.FORM],
  [V.FRAME, H.FRAME],
  [V.FRAMESET, H.FRAMESET],
  [V.H1, H.H1],
  [V.H2, H.H2],
  [V.H3, H.H3],
  [V.H4, H.H4],
  [V.H5, H.H5],
  [V.H6, H.H6],
  [V.HEAD, H.HEAD],
  [V.HEADER, H.HEADER],
  [V.HGROUP, H.HGROUP],
  [V.HR, H.HR],
  [V.HTML, H.HTML],
  [V.I, H.I],
  [V.IMG, H.IMG],
  [V.IMAGE, H.IMAGE],
  [V.INPUT, H.INPUT],
  [V.IFRAME, H.IFRAME],
  [V.KEYGEN, H.KEYGEN],
  [V.LABEL, H.LABEL],
  [V.LI, H.LI],
  [V.LINK, H.LINK],
  [V.LISTING, H.LISTING],
  [V.MAIN, H.MAIN],
  [V.MALIGNMARK, H.MALIGNMARK],
  [V.MARQUEE, H.MARQUEE],
  [V.MATH, H.MATH],
  [V.MENU, H.MENU],
  [V.META, H.META],
  [V.MGLYPH, H.MGLYPH],
  [V.MI, H.MI],
  [V.MO, H.MO],
  [V.MN, H.MN],
  [V.MS, H.MS],
  [V.MTEXT, H.MTEXT],
  [V.NAV, H.NAV],
  [V.NOBR, H.NOBR],
  [V.NOFRAMES, H.NOFRAMES],
  [V.NOEMBED, H.NOEMBED],
  [V.NOSCRIPT, H.NOSCRIPT],
  [V.OBJECT, H.OBJECT],
  [V.OL, H.OL],
  [V.OPTGROUP, H.OPTGROUP],
  [V.OPTION, H.OPTION],
  [V.P, H.P],
  [V.PARAM, H.PARAM],
  [V.PLAINTEXT, H.PLAINTEXT],
  [V.PRE, H.PRE],
  [V.RB, H.RB],
  [V.RP, H.RP],
  [V.RT, H.RT],
  [V.RTC, H.RTC],
  [V.RUBY, H.RUBY],
  [V.S, H.S],
  [V.SCRIPT, H.SCRIPT],
  [V.SEARCH, H.SEARCH],
  [V.SECTION, H.SECTION],
  [V.SELECT, H.SELECT],
  [V.SOURCE, H.SOURCE],
  [V.SMALL, H.SMALL],
  [V.SPAN, H.SPAN],
  [V.STRIKE, H.STRIKE],
  [V.STRONG, H.STRONG],
  [V.STYLE, H.STYLE],
  [V.SUB, H.SUB],
  [V.SUMMARY, H.SUMMARY],
  [V.SUP, H.SUP],
  [V.TABLE, H.TABLE],
  [V.TBODY, H.TBODY],
  [V.TEMPLATE, H.TEMPLATE],
  [V.TEXTAREA, H.TEXTAREA],
  [V.TFOOT, H.TFOOT],
  [V.TD, H.TD],
  [V.TH, H.TH],
  [V.THEAD, H.THEAD],
  [V.TITLE, H.TITLE],
  [V.TR, H.TR],
  [V.TRACK, H.TRACK],
  [V.TT, H.TT],
  [V.U, H.U],
  [V.UL, H.UL],
  [V.SVG, H.SVG],
  [V.VAR, H.VAR],
  [V.WBR, H.WBR],
  [V.XMP, H.XMP],
]);
function En(e) {
  return Tn.get(e) ?? H.UNKNOWN;
}
var U = H,
  Dn = {
    [B.HTML]: new Set([
      U.ADDRESS,
      U.APPLET,
      U.AREA,
      U.ARTICLE,
      U.ASIDE,
      U.BASE,
      U.BASEFONT,
      U.BGSOUND,
      U.BLOCKQUOTE,
      U.BODY,
      U.BR,
      U.BUTTON,
      U.CAPTION,
      U.CENTER,
      U.COL,
      U.COLGROUP,
      U.DD,
      U.DETAILS,
      U.DIR,
      U.DIV,
      U.DL,
      U.DT,
      U.EMBED,
      U.FIELDSET,
      U.FIGCAPTION,
      U.FIGURE,
      U.FOOTER,
      U.FORM,
      U.FRAME,
      U.FRAMESET,
      U.H1,
      U.H2,
      U.H3,
      U.H4,
      U.H5,
      U.H6,
      U.HEAD,
      U.HEADER,
      U.HGROUP,
      U.HR,
      U.HTML,
      U.IFRAME,
      U.IMG,
      U.INPUT,
      U.LI,
      U.LINK,
      U.LISTING,
      U.MAIN,
      U.MARQUEE,
      U.MENU,
      U.META,
      U.NAV,
      U.NOEMBED,
      U.NOFRAMES,
      U.NOSCRIPT,
      U.OBJECT,
      U.OL,
      U.P,
      U.PARAM,
      U.PLAINTEXT,
      U.PRE,
      U.SCRIPT,
      U.SECTION,
      U.SELECT,
      U.SOURCE,
      U.STYLE,
      U.SUMMARY,
      U.TABLE,
      U.TBODY,
      U.TD,
      U.TEMPLATE,
      U.TEXTAREA,
      U.TFOOT,
      U.TH,
      U.THEAD,
      U.TITLE,
      U.TR,
      U.TRACK,
      U.UL,
      U.WBR,
      U.XMP,
    ]),
    [B.MATHML]: new Set([U.MI, U.MO, U.MN, U.MS, U.MTEXT, U.ANNOTATION_XML]),
    [B.SVG]: new Set([U.TITLE, U.FOREIGN_OBJECT, U.DESC]),
    [B.XLINK]: new Set(),
    [B.XML]: new Set(),
    [B.XMLNS]: new Set(),
  },
  On = new Set([U.H1, U.H2, U.H3, U.H4, U.H5, U.H6]);
new Set([
  V.STYLE,
  V.SCRIPT,
  V.XMP,
  V.IFRAME,
  V.NOEMBED,
  V.NOFRAMES,
  V.PLAINTEXT,
]);
var W;
(function (e) {
  ((e[(e.DATA = 0)] = `DATA`),
    (e[(e.RCDATA = 1)] = `RCDATA`),
    (e[(e.RAWTEXT = 2)] = `RAWTEXT`),
    (e[(e.SCRIPT_DATA = 3)] = `SCRIPT_DATA`),
    (e[(e.PLAINTEXT = 4)] = `PLAINTEXT`),
    (e[(e.TAG_OPEN = 5)] = `TAG_OPEN`),
    (e[(e.END_TAG_OPEN = 6)] = `END_TAG_OPEN`),
    (e[(e.TAG_NAME = 7)] = `TAG_NAME`),
    (e[(e.RCDATA_LESS_THAN_SIGN = 8)] = `RCDATA_LESS_THAN_SIGN`),
    (e[(e.RCDATA_END_TAG_OPEN = 9)] = `RCDATA_END_TAG_OPEN`),
    (e[(e.RCDATA_END_TAG_NAME = 10)] = `RCDATA_END_TAG_NAME`),
    (e[(e.RAWTEXT_LESS_THAN_SIGN = 11)] = `RAWTEXT_LESS_THAN_SIGN`),
    (e[(e.RAWTEXT_END_TAG_OPEN = 12)] = `RAWTEXT_END_TAG_OPEN`),
    (e[(e.RAWTEXT_END_TAG_NAME = 13)] = `RAWTEXT_END_TAG_NAME`),
    (e[(e.SCRIPT_DATA_LESS_THAN_SIGN = 14)] = `SCRIPT_DATA_LESS_THAN_SIGN`),
    (e[(e.SCRIPT_DATA_END_TAG_OPEN = 15)] = `SCRIPT_DATA_END_TAG_OPEN`),
    (e[(e.SCRIPT_DATA_END_TAG_NAME = 16)] = `SCRIPT_DATA_END_TAG_NAME`),
    (e[(e.SCRIPT_DATA_ESCAPE_START = 17)] = `SCRIPT_DATA_ESCAPE_START`),
    (e[(e.SCRIPT_DATA_ESCAPE_START_DASH = 18)] =
      `SCRIPT_DATA_ESCAPE_START_DASH`),
    (e[(e.SCRIPT_DATA_ESCAPED = 19)] = `SCRIPT_DATA_ESCAPED`),
    (e[(e.SCRIPT_DATA_ESCAPED_DASH = 20)] = `SCRIPT_DATA_ESCAPED_DASH`),
    (e[(e.SCRIPT_DATA_ESCAPED_DASH_DASH = 21)] =
      `SCRIPT_DATA_ESCAPED_DASH_DASH`),
    (e[(e.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN = 22)] =
      `SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN`),
    (e[(e.SCRIPT_DATA_ESCAPED_END_TAG_OPEN = 23)] =
      `SCRIPT_DATA_ESCAPED_END_TAG_OPEN`),
    (e[(e.SCRIPT_DATA_ESCAPED_END_TAG_NAME = 24)] =
      `SCRIPT_DATA_ESCAPED_END_TAG_NAME`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPE_START = 25)] =
      `SCRIPT_DATA_DOUBLE_ESCAPE_START`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPED = 26)] = `SCRIPT_DATA_DOUBLE_ESCAPED`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH = 27)] =
      `SCRIPT_DATA_DOUBLE_ESCAPED_DASH`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH = 28)] =
      `SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN = 29)] =
      `SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN`),
    (e[(e.SCRIPT_DATA_DOUBLE_ESCAPE_END = 30)] =
      `SCRIPT_DATA_DOUBLE_ESCAPE_END`),
    (e[(e.BEFORE_ATTRIBUTE_NAME = 31)] = `BEFORE_ATTRIBUTE_NAME`),
    (e[(e.ATTRIBUTE_NAME = 32)] = `ATTRIBUTE_NAME`),
    (e[(e.AFTER_ATTRIBUTE_NAME = 33)] = `AFTER_ATTRIBUTE_NAME`),
    (e[(e.BEFORE_ATTRIBUTE_VALUE = 34)] = `BEFORE_ATTRIBUTE_VALUE`),
    (e[(e.ATTRIBUTE_VALUE_DOUBLE_QUOTED = 35)] =
      `ATTRIBUTE_VALUE_DOUBLE_QUOTED`),
    (e[(e.ATTRIBUTE_VALUE_SINGLE_QUOTED = 36)] =
      `ATTRIBUTE_VALUE_SINGLE_QUOTED`),
    (e[(e.ATTRIBUTE_VALUE_UNQUOTED = 37)] = `ATTRIBUTE_VALUE_UNQUOTED`),
    (e[(e.AFTER_ATTRIBUTE_VALUE_QUOTED = 38)] = `AFTER_ATTRIBUTE_VALUE_QUOTED`),
    (e[(e.SELF_CLOSING_START_TAG = 39)] = `SELF_CLOSING_START_TAG`),
    (e[(e.BOGUS_COMMENT = 40)] = `BOGUS_COMMENT`),
    (e[(e.MARKUP_DECLARATION_OPEN = 41)] = `MARKUP_DECLARATION_OPEN`),
    (e[(e.COMMENT_START = 42)] = `COMMENT_START`),
    (e[(e.COMMENT_START_DASH = 43)] = `COMMENT_START_DASH`),
    (e[(e.COMMENT = 44)] = `COMMENT`),
    (e[(e.COMMENT_LESS_THAN_SIGN = 45)] = `COMMENT_LESS_THAN_SIGN`),
    (e[(e.COMMENT_LESS_THAN_SIGN_BANG = 46)] = `COMMENT_LESS_THAN_SIGN_BANG`),
    (e[(e.COMMENT_LESS_THAN_SIGN_BANG_DASH = 47)] =
      `COMMENT_LESS_THAN_SIGN_BANG_DASH`),
    (e[(e.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH = 48)] =
      `COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH`),
    (e[(e.COMMENT_END_DASH = 49)] = `COMMENT_END_DASH`),
    (e[(e.COMMENT_END = 50)] = `COMMENT_END`),
    (e[(e.COMMENT_END_BANG = 51)] = `COMMENT_END_BANG`),
    (e[(e.DOCTYPE = 52)] = `DOCTYPE`),
    (e[(e.BEFORE_DOCTYPE_NAME = 53)] = `BEFORE_DOCTYPE_NAME`),
    (e[(e.DOCTYPE_NAME = 54)] = `DOCTYPE_NAME`),
    (e[(e.AFTER_DOCTYPE_NAME = 55)] = `AFTER_DOCTYPE_NAME`),
    (e[(e.AFTER_DOCTYPE_PUBLIC_KEYWORD = 56)] = `AFTER_DOCTYPE_PUBLIC_KEYWORD`),
    (e[(e.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER = 57)] =
      `BEFORE_DOCTYPE_PUBLIC_IDENTIFIER`),
    (e[(e.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED = 58)] =
      `DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED`),
    (e[(e.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED = 59)] =
      `DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED`),
    (e[(e.AFTER_DOCTYPE_PUBLIC_IDENTIFIER = 60)] =
      `AFTER_DOCTYPE_PUBLIC_IDENTIFIER`),
    (e[(e.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS = 61)] =
      `BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS`),
    (e[(e.AFTER_DOCTYPE_SYSTEM_KEYWORD = 62)] = `AFTER_DOCTYPE_SYSTEM_KEYWORD`),
    (e[(e.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER = 63)] =
      `BEFORE_DOCTYPE_SYSTEM_IDENTIFIER`),
    (e[(e.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED = 64)] =
      `DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED`),
    (e[(e.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED = 65)] =
      `DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED`),
    (e[(e.AFTER_DOCTYPE_SYSTEM_IDENTIFIER = 66)] =
      `AFTER_DOCTYPE_SYSTEM_IDENTIFIER`),
    (e[(e.BOGUS_DOCTYPE = 67)] = `BOGUS_DOCTYPE`),
    (e[(e.CDATA_SECTION = 68)] = `CDATA_SECTION`),
    (e[(e.CDATA_SECTION_BRACKET = 69)] = `CDATA_SECTION_BRACKET`),
    (e[(e.CDATA_SECTION_END = 70)] = `CDATA_SECTION_END`),
    (e[(e.CHARACTER_REFERENCE = 71)] = `CHARACTER_REFERENCE`),
    (e[(e.AMBIGUOUS_AMPERSAND = 72)] = `AMBIGUOUS_AMPERSAND`));
})((W ||= {}));
var kn = {
  DATA: W.DATA,
  RCDATA: W.RCDATA,
  RAWTEXT: W.RAWTEXT,
  SCRIPT_DATA: W.SCRIPT_DATA,
  PLAINTEXT: W.PLAINTEXT,
  CDATA_SECTION: W.CDATA_SECTION,
};
function An(e) {
  return e >= L.DIGIT_0 && e <= L.DIGIT_9;
}
function jn(e) {
  return e >= L.LATIN_CAPITAL_A && e <= L.LATIN_CAPITAL_Z;
}
function Mn(e) {
  return e >= L.LATIN_SMALL_A && e <= L.LATIN_SMALL_Z;
}
function Nn(e) {
  return Mn(e) || jn(e);
}
function Pn(e) {
  return Nn(e) || An(e);
}
function Fn(e) {
  return e + 32;
}
function In(e) {
  return (
    e === L.SPACE ||
    e === L.LINE_FEED ||
    e === L.TABULATION ||
    e === L.FORM_FEED
  );
}
function Ln(e) {
  return In(e) || e === L.SOLIDUS || e === L.GREATER_THAN_SIGN;
}
function Rn(e) {
  return e === L.NULL
    ? R.nullCharacterReference
    : e > 1114111
      ? R.characterReferenceOutsideUnicodeRange
      : en(e)
        ? R.surrogateCharacterReference
        : an(e)
          ? R.noncharacterCharacterReference
          : rn(e) || e === L.CARRIAGE_RETURN
            ? R.controlCharacterReference
            : null;
}
var zn = class {
    constructor(e, t) {
      ((this.options = e),
        (this.handler = t),
        (this.paused = !1),
        (this.inLoop = !1),
        (this.inForeignNode = !1),
        (this.lastStartTagName = ``),
        (this.active = !1),
        (this.state = W.DATA),
        (this.returnState = W.DATA),
        (this.entityStartPos = 0),
        (this.consumedAfterSnapshot = -1),
        (this.currentCharacterToken = null),
        (this.currentToken = null),
        (this.currentAttr = { name: ``, value: `` }),
        (this.preprocessor = new sn(t)),
        (this.currentLocation = this.getCurrentLocation(-1)),
        (this.entityDecoder = new xn(
          ln,
          (e, t) => {
            ((this.preprocessor.pos = this.entityStartPos + t - 1),
              this._flushCodePointConsumedAsCharacterReference(e));
          },
          t.onParseError
            ? {
                missingSemicolonAfterCharacterReference: () => {
                  this._err(R.missingSemicolonAfterCharacterReference, 1);
                },
                absenceOfDigitsInNumericCharacterReference: (e) => {
                  this._err(
                    R.absenceOfDigitsInNumericCharacterReference,
                    this.entityStartPos - this.preprocessor.pos + e,
                  );
                },
                validateNumericCharacterReference: (e) => {
                  let t = Rn(e);
                  t && this._err(t, 1);
                },
              }
            : void 0,
        )));
    }
    _err(e, t = 0) {
      var n, r;
      (r = (n = this.handler).onParseError) == null ||
        r.call(n, this.preprocessor.getError(e, t));
    }
    getCurrentLocation(e) {
      return this.options.sourceCodeLocationInfo
        ? {
            startLine: this.preprocessor.line,
            startCol: this.preprocessor.col - e,
            startOffset: this.preprocessor.offset - e,
            endLine: -1,
            endCol: -1,
            endOffset: -1,
          }
        : null;
    }
    _runParsingLoop() {
      if (!this.inLoop) {
        for (this.inLoop = !0; this.active && !this.paused; ) {
          this.consumedAfterSnapshot = 0;
          let e = this._consume();
          this._ensureHibernation() || this._callState(e);
        }
        this.inLoop = !1;
      }
    }
    pause() {
      this.paused = !0;
    }
    resume(e) {
      if (!this.paused) throw Error(`Parser was already resumed`);
      ((this.paused = !1),
        !this.inLoop && (this._runParsingLoop(), this.paused || e?.()));
    }
    write(e, t, n) {
      ((this.active = !0),
        this.preprocessor.write(e, t),
        this._runParsingLoop(),
        this.paused || n?.());
    }
    insertHtmlAtCurrentPos(e) {
      ((this.active = !0),
        this.preprocessor.insertHtmlAtCurrentPos(e),
        this._runParsingLoop());
    }
    _ensureHibernation() {
      return this.preprocessor.endOfChunkHit
        ? (this.preprocessor.retreat(this.consumedAfterSnapshot),
          (this.consumedAfterSnapshot = 0),
          (this.active = !1),
          !0)
        : !1;
    }
    _consume() {
      return (this.consumedAfterSnapshot++, this.preprocessor.advance());
    }
    _advanceBy(e) {
      this.consumedAfterSnapshot += e;
      for (let t = 0; t < e; t++) this.preprocessor.advance();
    }
    _consumeSequenceIfMatch(e, t) {
      return this.preprocessor.startsWith(e, t)
        ? (this._advanceBy(e.length - 1), !0)
        : !1;
    }
    _createStartTagToken() {
      this.currentToken = {
        type: z.START_TAG,
        tagName: ``,
        tagID: H.UNKNOWN,
        selfClosing: !1,
        ackSelfClosing: !1,
        attrs: [],
        location: this.getCurrentLocation(1),
      };
    }
    _createEndTagToken() {
      this.currentToken = {
        type: z.END_TAG,
        tagName: ``,
        tagID: H.UNKNOWN,
        selfClosing: !1,
        ackSelfClosing: !1,
        attrs: [],
        location: this.getCurrentLocation(2),
      };
    }
    _createCommentToken(e) {
      this.currentToken = {
        type: z.COMMENT,
        data: ``,
        location: this.getCurrentLocation(e),
      };
    }
    _createDoctypeToken(e) {
      this.currentToken = {
        type: z.DOCTYPE,
        name: e,
        forceQuirks: !1,
        publicId: null,
        systemId: null,
        location: this.currentLocation,
      };
    }
    _createCharacterToken(e, t) {
      this.currentCharacterToken = {
        type: e,
        chars: t,
        location: this.currentLocation,
      };
    }
    _createAttr(e) {
      ((this.currentAttr = { name: e, value: `` }),
        (this.currentLocation = this.getCurrentLocation(0)));
    }
    _leaveAttrName() {
      var e;
      let t = this.currentToken;
      if (cn(t, this.currentAttr.name) === null) {
        if (
          (t.attrs.push(this.currentAttr), t.location && this.currentLocation)
        ) {
          let n = (e = t.location).attrs ?? (e.attrs = Object.create(null));
          ((n[this.currentAttr.name] = this.currentLocation),
            this._leaveAttrValue());
        }
      } else this._err(R.duplicateAttribute);
    }
    _leaveAttrValue() {
      this.currentLocation &&
        ((this.currentLocation.endLine = this.preprocessor.line),
        (this.currentLocation.endCol = this.preprocessor.col),
        (this.currentLocation.endOffset = this.preprocessor.offset));
    }
    prepareToken(e) {
      (this._emitCurrentCharacterToken(e.location),
        (this.currentToken = null),
        e.location &&
          ((e.location.endLine = this.preprocessor.line),
          (e.location.endCol = this.preprocessor.col + 1),
          (e.location.endOffset = this.preprocessor.offset + 1)),
        (this.currentLocation = this.getCurrentLocation(-1)));
    }
    emitCurrentTagToken() {
      let e = this.currentToken;
      (this.prepareToken(e),
        (e.tagID = En(e.tagName)),
        e.type === z.START_TAG
          ? ((this.lastStartTagName = e.tagName), this.handler.onStartTag(e))
          : (e.attrs.length > 0 && this._err(R.endTagWithAttributes),
            e.selfClosing && this._err(R.endTagWithTrailingSolidus),
            this.handler.onEndTag(e)),
        this.preprocessor.dropParsedChunk());
    }
    emitCurrentComment(e) {
      (this.prepareToken(e),
        this.handler.onComment(e),
        this.preprocessor.dropParsedChunk());
    }
    emitCurrentDoctype(e) {
      (this.prepareToken(e),
        this.handler.onDoctype(e),
        this.preprocessor.dropParsedChunk());
    }
    _emitCurrentCharacterToken(e) {
      if (this.currentCharacterToken) {
        switch (
          (e &&
            this.currentCharacterToken.location &&
            ((this.currentCharacterToken.location.endLine = e.startLine),
            (this.currentCharacterToken.location.endCol = e.startCol),
            (this.currentCharacterToken.location.endOffset = e.startOffset)),
          this.currentCharacterToken.type)
        ) {
          case z.CHARACTER:
            this.handler.onCharacter(this.currentCharacterToken);
            break;
          case z.NULL_CHARACTER:
            this.handler.onNullCharacter(this.currentCharacterToken);
            break;
          case z.WHITESPACE_CHARACTER:
            this.handler.onWhitespaceCharacter(this.currentCharacterToken);
            break;
        }
        this.currentCharacterToken = null;
      }
    }
    _emitEOFToken() {
      let e = this.getCurrentLocation(0);
      (e &&
        ((e.endLine = e.startLine),
        (e.endCol = e.startCol),
        (e.endOffset = e.startOffset)),
        this._emitCurrentCharacterToken(e),
        this.handler.onEof({ type: z.EOF, location: e }),
        (this.active = !1));
    }
    _appendCharToCurrentCharacterToken(e, t) {
      if (this.currentCharacterToken)
        if (this.currentCharacterToken.type === e) {
          this.currentCharacterToken.chars += t;
          return;
        } else
          ((this.currentLocation = this.getCurrentLocation(0)),
            this._emitCurrentCharacterToken(this.currentLocation),
            this.preprocessor.dropParsedChunk());
      this._createCharacterToken(e, t);
    }
    _emitCodePoint(e) {
      let t = In(e)
        ? z.WHITESPACE_CHARACTER
        : e === L.NULL
          ? z.NULL_CHARACTER
          : z.CHARACTER;
      this._appendCharToCurrentCharacterToken(t, String.fromCodePoint(e));
    }
    _emitChars(e) {
      this._appendCharToCurrentCharacterToken(z.CHARACTER, e);
    }
    _startCharacterReference() {
      ((this.returnState = this.state),
        (this.state = W.CHARACTER_REFERENCE),
        (this.entityStartPos = this.preprocessor.pos),
        this.entityDecoder.startEntity(
          this._isCharacterReferenceInAttribute() ? bn.Attribute : bn.Legacy,
        ));
    }
    _isCharacterReferenceInAttribute() {
      return (
        this.returnState === W.ATTRIBUTE_VALUE_DOUBLE_QUOTED ||
        this.returnState === W.ATTRIBUTE_VALUE_SINGLE_QUOTED ||
        this.returnState === W.ATTRIBUTE_VALUE_UNQUOTED
      );
    }
    _flushCodePointConsumedAsCharacterReference(e) {
      this._isCharacterReferenceInAttribute()
        ? (this.currentAttr.value += String.fromCodePoint(e))
        : this._emitCodePoint(e);
    }
    _callState(e) {
      switch (this.state) {
        case W.DATA:
          this._stateData(e);
          break;
        case W.RCDATA:
          this._stateRcdata(e);
          break;
        case W.RAWTEXT:
          this._stateRawtext(e);
          break;
        case W.SCRIPT_DATA:
          this._stateScriptData(e);
          break;
        case W.PLAINTEXT:
          this._statePlaintext(e);
          break;
        case W.TAG_OPEN:
          this._stateTagOpen(e);
          break;
        case W.END_TAG_OPEN:
          this._stateEndTagOpen(e);
          break;
        case W.TAG_NAME:
          this._stateTagName(e);
          break;
        case W.RCDATA_LESS_THAN_SIGN:
          this._stateRcdataLessThanSign(e);
          break;
        case W.RCDATA_END_TAG_OPEN:
          this._stateRcdataEndTagOpen(e);
          break;
        case W.RCDATA_END_TAG_NAME:
          this._stateRcdataEndTagName(e);
          break;
        case W.RAWTEXT_LESS_THAN_SIGN:
          this._stateRawtextLessThanSign(e);
          break;
        case W.RAWTEXT_END_TAG_OPEN:
          this._stateRawtextEndTagOpen(e);
          break;
        case W.RAWTEXT_END_TAG_NAME:
          this._stateRawtextEndTagName(e);
          break;
        case W.SCRIPT_DATA_LESS_THAN_SIGN:
          this._stateScriptDataLessThanSign(e);
          break;
        case W.SCRIPT_DATA_END_TAG_OPEN:
          this._stateScriptDataEndTagOpen(e);
          break;
        case W.SCRIPT_DATA_END_TAG_NAME:
          this._stateScriptDataEndTagName(e);
          break;
        case W.SCRIPT_DATA_ESCAPE_START:
          this._stateScriptDataEscapeStart(e);
          break;
        case W.SCRIPT_DATA_ESCAPE_START_DASH:
          this._stateScriptDataEscapeStartDash(e);
          break;
        case W.SCRIPT_DATA_ESCAPED:
          this._stateScriptDataEscaped(e);
          break;
        case W.SCRIPT_DATA_ESCAPED_DASH:
          this._stateScriptDataEscapedDash(e);
          break;
        case W.SCRIPT_DATA_ESCAPED_DASH_DASH:
          this._stateScriptDataEscapedDashDash(e);
          break;
        case W.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN:
          this._stateScriptDataEscapedLessThanSign(e);
          break;
        case W.SCRIPT_DATA_ESCAPED_END_TAG_OPEN:
          this._stateScriptDataEscapedEndTagOpen(e);
          break;
        case W.SCRIPT_DATA_ESCAPED_END_TAG_NAME:
          this._stateScriptDataEscapedEndTagName(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPE_START:
          this._stateScriptDataDoubleEscapeStart(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPED:
          this._stateScriptDataDoubleEscaped(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPED_DASH:
          this._stateScriptDataDoubleEscapedDash(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH:
          this._stateScriptDataDoubleEscapedDashDash(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN:
          this._stateScriptDataDoubleEscapedLessThanSign(e);
          break;
        case W.SCRIPT_DATA_DOUBLE_ESCAPE_END:
          this._stateScriptDataDoubleEscapeEnd(e);
          break;
        case W.BEFORE_ATTRIBUTE_NAME:
          this._stateBeforeAttributeName(e);
          break;
        case W.ATTRIBUTE_NAME:
          this._stateAttributeName(e);
          break;
        case W.AFTER_ATTRIBUTE_NAME:
          this._stateAfterAttributeName(e);
          break;
        case W.BEFORE_ATTRIBUTE_VALUE:
          this._stateBeforeAttributeValue(e);
          break;
        case W.ATTRIBUTE_VALUE_DOUBLE_QUOTED:
          this._stateAttributeValueDoubleQuoted(e);
          break;
        case W.ATTRIBUTE_VALUE_SINGLE_QUOTED:
          this._stateAttributeValueSingleQuoted(e);
          break;
        case W.ATTRIBUTE_VALUE_UNQUOTED:
          this._stateAttributeValueUnquoted(e);
          break;
        case W.AFTER_ATTRIBUTE_VALUE_QUOTED:
          this._stateAfterAttributeValueQuoted(e);
          break;
        case W.SELF_CLOSING_START_TAG:
          this._stateSelfClosingStartTag(e);
          break;
        case W.BOGUS_COMMENT:
          this._stateBogusComment(e);
          break;
        case W.MARKUP_DECLARATION_OPEN:
          this._stateMarkupDeclarationOpen(e);
          break;
        case W.COMMENT_START:
          this._stateCommentStart(e);
          break;
        case W.COMMENT_START_DASH:
          this._stateCommentStartDash(e);
          break;
        case W.COMMENT:
          this._stateComment(e);
          break;
        case W.COMMENT_LESS_THAN_SIGN:
          this._stateCommentLessThanSign(e);
          break;
        case W.COMMENT_LESS_THAN_SIGN_BANG:
          this._stateCommentLessThanSignBang(e);
          break;
        case W.COMMENT_LESS_THAN_SIGN_BANG_DASH:
          this._stateCommentLessThanSignBangDash(e);
          break;
        case W.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH:
          this._stateCommentLessThanSignBangDashDash(e);
          break;
        case W.COMMENT_END_DASH:
          this._stateCommentEndDash(e);
          break;
        case W.COMMENT_END:
          this._stateCommentEnd(e);
          break;
        case W.COMMENT_END_BANG:
          this._stateCommentEndBang(e);
          break;
        case W.DOCTYPE:
          this._stateDoctype(e);
          break;
        case W.BEFORE_DOCTYPE_NAME:
          this._stateBeforeDoctypeName(e);
          break;
        case W.DOCTYPE_NAME:
          this._stateDoctypeName(e);
          break;
        case W.AFTER_DOCTYPE_NAME:
          this._stateAfterDoctypeName(e);
          break;
        case W.AFTER_DOCTYPE_PUBLIC_KEYWORD:
          this._stateAfterDoctypePublicKeyword(e);
          break;
        case W.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER:
          this._stateBeforeDoctypePublicIdentifier(e);
          break;
        case W.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED:
          this._stateDoctypePublicIdentifierDoubleQuoted(e);
          break;
        case W.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED:
          this._stateDoctypePublicIdentifierSingleQuoted(e);
          break;
        case W.AFTER_DOCTYPE_PUBLIC_IDENTIFIER:
          this._stateAfterDoctypePublicIdentifier(e);
          break;
        case W.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS:
          this._stateBetweenDoctypePublicAndSystemIdentifiers(e);
          break;
        case W.AFTER_DOCTYPE_SYSTEM_KEYWORD:
          this._stateAfterDoctypeSystemKeyword(e);
          break;
        case W.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER:
          this._stateBeforeDoctypeSystemIdentifier(e);
          break;
        case W.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED:
          this._stateDoctypeSystemIdentifierDoubleQuoted(e);
          break;
        case W.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED:
          this._stateDoctypeSystemIdentifierSingleQuoted(e);
          break;
        case W.AFTER_DOCTYPE_SYSTEM_IDENTIFIER:
          this._stateAfterDoctypeSystemIdentifier(e);
          break;
        case W.BOGUS_DOCTYPE:
          this._stateBogusDoctype(e);
          break;
        case W.CDATA_SECTION:
          this._stateCdataSection(e);
          break;
        case W.CDATA_SECTION_BRACKET:
          this._stateCdataSectionBracket(e);
          break;
        case W.CDATA_SECTION_END:
          this._stateCdataSectionEnd(e);
          break;
        case W.CHARACTER_REFERENCE:
          this._stateCharacterReference();
          break;
        case W.AMBIGUOUS_AMPERSAND:
          this._stateAmbiguousAmpersand(e);
          break;
        default:
          throw Error(`Unknown state`);
      }
    }
    _stateData(e) {
      switch (e) {
        case L.LESS_THAN_SIGN:
          this.state = W.TAG_OPEN;
          break;
        case L.AMPERSAND:
          this._startCharacterReference();
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitCodePoint(e));
          break;
        case L.EOF:
          this._emitEOFToken();
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateRcdata(e) {
      switch (e) {
        case L.AMPERSAND:
          this._startCharacterReference();
          break;
        case L.LESS_THAN_SIGN:
          this.state = W.RCDATA_LESS_THAN_SIGN;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          this._emitEOFToken();
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateRawtext(e) {
      switch (e) {
        case L.LESS_THAN_SIGN:
          this.state = W.RAWTEXT_LESS_THAN_SIGN;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          this._emitEOFToken();
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateScriptData(e) {
      switch (e) {
        case L.LESS_THAN_SIGN:
          this.state = W.SCRIPT_DATA_LESS_THAN_SIGN;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          this._emitEOFToken();
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _statePlaintext(e) {
      switch (e) {
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          this._emitEOFToken();
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateTagOpen(e) {
      if (Nn(e))
        (this._createStartTagToken(),
          (this.state = W.TAG_NAME),
          this._stateTagName(e));
      else
        switch (e) {
          case L.EXCLAMATION_MARK:
            this.state = W.MARKUP_DECLARATION_OPEN;
            break;
          case L.SOLIDUS:
            this.state = W.END_TAG_OPEN;
            break;
          case L.QUESTION_MARK:
            (this._err(R.unexpectedQuestionMarkInsteadOfTagName),
              this._createCommentToken(1),
              (this.state = W.BOGUS_COMMENT),
              this._stateBogusComment(e));
            break;
          case L.EOF:
            (this._err(R.eofBeforeTagName),
              this._emitChars(`<`),
              this._emitEOFToken());
            break;
          default:
            (this._err(R.invalidFirstCharacterOfTagName),
              this._emitChars(`<`),
              (this.state = W.DATA),
              this._stateData(e));
        }
    }
    _stateEndTagOpen(e) {
      if (Nn(e))
        (this._createEndTagToken(),
          (this.state = W.TAG_NAME),
          this._stateTagName(e));
      else
        switch (e) {
          case L.GREATER_THAN_SIGN:
            (this._err(R.missingEndTagName), (this.state = W.DATA));
            break;
          case L.EOF:
            (this._err(R.eofBeforeTagName),
              this._emitChars(`</`),
              this._emitEOFToken());
            break;
          default:
            (this._err(R.invalidFirstCharacterOfTagName),
              this._createCommentToken(2),
              (this.state = W.BOGUS_COMMENT),
              this._stateBogusComment(e));
        }
    }
    _stateTagName(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.BEFORE_ATTRIBUTE_NAME;
          break;
        case L.SOLIDUS:
          this.state = W.SELF_CLOSING_START_TAG;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentTagToken());
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.tagName += `�`));
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          t.tagName += String.fromCodePoint(jn(e) ? Fn(e) : e);
      }
    }
    _stateRcdataLessThanSign(e) {
      e === L.SOLIDUS
        ? (this.state = W.RCDATA_END_TAG_OPEN)
        : (this._emitChars(`<`), (this.state = W.RCDATA), this._stateRcdata(e));
    }
    _stateRcdataEndTagOpen(e) {
      Nn(e)
        ? ((this.state = W.RCDATA_END_TAG_NAME), this._stateRcdataEndTagName(e))
        : (this._emitChars(`</`),
          (this.state = W.RCDATA),
          this._stateRcdata(e));
    }
    handleSpecialEndTag(e) {
      if (!this.preprocessor.startsWith(this.lastStartTagName, !1))
        return !this._ensureHibernation();
      this._createEndTagToken();
      let t = this.currentToken;
      switch (
        ((t.tagName = this.lastStartTagName),
        this.preprocessor.peek(this.lastStartTagName.length))
      ) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          return (
            this._advanceBy(this.lastStartTagName.length),
            (this.state = W.BEFORE_ATTRIBUTE_NAME),
            !1
          );
        case L.SOLIDUS:
          return (
            this._advanceBy(this.lastStartTagName.length),
            (this.state = W.SELF_CLOSING_START_TAG),
            !1
          );
        case L.GREATER_THAN_SIGN:
          return (
            this._advanceBy(this.lastStartTagName.length),
            this.emitCurrentTagToken(),
            (this.state = W.DATA),
            !1
          );
        default:
          return !this._ensureHibernation();
      }
    }
    _stateRcdataEndTagName(e) {
      this.handleSpecialEndTag(e) &&
        (this._emitChars(`</`), (this.state = W.RCDATA), this._stateRcdata(e));
    }
    _stateRawtextLessThanSign(e) {
      e === L.SOLIDUS
        ? (this.state = W.RAWTEXT_END_TAG_OPEN)
        : (this._emitChars(`<`),
          (this.state = W.RAWTEXT),
          this._stateRawtext(e));
    }
    _stateRawtextEndTagOpen(e) {
      Nn(e)
        ? ((this.state = W.RAWTEXT_END_TAG_NAME),
          this._stateRawtextEndTagName(e))
        : (this._emitChars(`</`),
          (this.state = W.RAWTEXT),
          this._stateRawtext(e));
    }
    _stateRawtextEndTagName(e) {
      this.handleSpecialEndTag(e) &&
        (this._emitChars(`</`),
        (this.state = W.RAWTEXT),
        this._stateRawtext(e));
    }
    _stateScriptDataLessThanSign(e) {
      switch (e) {
        case L.SOLIDUS:
          this.state = W.SCRIPT_DATA_END_TAG_OPEN;
          break;
        case L.EXCLAMATION_MARK:
          ((this.state = W.SCRIPT_DATA_ESCAPE_START), this._emitChars(`<!`));
          break;
        default:
          (this._emitChars(`<`),
            (this.state = W.SCRIPT_DATA),
            this._stateScriptData(e));
      }
    }
    _stateScriptDataEndTagOpen(e) {
      Nn(e)
        ? ((this.state = W.SCRIPT_DATA_END_TAG_NAME),
          this._stateScriptDataEndTagName(e))
        : (this._emitChars(`</`),
          (this.state = W.SCRIPT_DATA),
          this._stateScriptData(e));
    }
    _stateScriptDataEndTagName(e) {
      this.handleSpecialEndTag(e) &&
        (this._emitChars(`</`),
        (this.state = W.SCRIPT_DATA),
        this._stateScriptData(e));
    }
    _stateScriptDataEscapeStart(e) {
      e === L.HYPHEN_MINUS
        ? ((this.state = W.SCRIPT_DATA_ESCAPE_START_DASH), this._emitChars(`-`))
        : ((this.state = W.SCRIPT_DATA), this._stateScriptData(e));
    }
    _stateScriptDataEscapeStartDash(e) {
      e === L.HYPHEN_MINUS
        ? ((this.state = W.SCRIPT_DATA_ESCAPED_DASH_DASH), this._emitChars(`-`))
        : ((this.state = W.SCRIPT_DATA), this._stateScriptData(e));
    }
    _stateScriptDataEscaped(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          ((this.state = W.SCRIPT_DATA_ESCAPED_DASH), this._emitChars(`-`));
          break;
        case L.LESS_THAN_SIGN:
          this.state = W.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateScriptDataEscapedDash(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          ((this.state = W.SCRIPT_DATA_ESCAPED_DASH_DASH),
            this._emitChars(`-`));
          break;
        case L.LESS_THAN_SIGN:
          this.state = W.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.state = W.SCRIPT_DATA_ESCAPED),
            this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          ((this.state = W.SCRIPT_DATA_ESCAPED), this._emitCodePoint(e));
      }
    }
    _stateScriptDataEscapedDashDash(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          this._emitChars(`-`);
          break;
        case L.LESS_THAN_SIGN:
          this.state = W.SCRIPT_DATA_ESCAPED_LESS_THAN_SIGN;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.SCRIPT_DATA), this._emitChars(`>`));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.state = W.SCRIPT_DATA_ESCAPED),
            this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          ((this.state = W.SCRIPT_DATA_ESCAPED), this._emitCodePoint(e));
      }
    }
    _stateScriptDataEscapedLessThanSign(e) {
      e === L.SOLIDUS
        ? (this.state = W.SCRIPT_DATA_ESCAPED_END_TAG_OPEN)
        : Nn(e)
          ? (this._emitChars(`<`),
            (this.state = W.SCRIPT_DATA_DOUBLE_ESCAPE_START),
            this._stateScriptDataDoubleEscapeStart(e))
          : (this._emitChars(`<`),
            (this.state = W.SCRIPT_DATA_ESCAPED),
            this._stateScriptDataEscaped(e));
    }
    _stateScriptDataEscapedEndTagOpen(e) {
      Nn(e)
        ? ((this.state = W.SCRIPT_DATA_ESCAPED_END_TAG_NAME),
          this._stateScriptDataEscapedEndTagName(e))
        : (this._emitChars(`</`),
          (this.state = W.SCRIPT_DATA_ESCAPED),
          this._stateScriptDataEscaped(e));
    }
    _stateScriptDataEscapedEndTagName(e) {
      this.handleSpecialEndTag(e) &&
        (this._emitChars(`</`),
        (this.state = W.SCRIPT_DATA_ESCAPED),
        this._stateScriptDataEscaped(e));
    }
    _stateScriptDataDoubleEscapeStart(e) {
      if (
        this.preprocessor.startsWith($t.SCRIPT, !1) &&
        Ln(this.preprocessor.peek($t.SCRIPT.length))
      ) {
        this._emitCodePoint(e);
        for (let e = 0; e < $t.SCRIPT.length; e++)
          this._emitCodePoint(this._consume());
        this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED;
      } else
        this._ensureHibernation() ||
          ((this.state = W.SCRIPT_DATA_ESCAPED),
          this._stateScriptDataEscaped(e));
    }
    _stateScriptDataDoubleEscaped(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED_DASH),
            this._emitChars(`-`));
          break;
        case L.LESS_THAN_SIGN:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN),
            this._emitChars(`<`));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateScriptDataDoubleEscapedDash(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED_DASH_DASH),
            this._emitChars(`-`));
          break;
        case L.LESS_THAN_SIGN:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN),
            this._emitChars(`<`));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED),
            this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED), this._emitCodePoint(e));
      }
    }
    _stateScriptDataDoubleEscapedDashDash(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          this._emitChars(`-`);
          break;
        case L.LESS_THAN_SIGN:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED_LESS_THAN_SIGN),
            this._emitChars(`<`));
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.SCRIPT_DATA), this._emitChars(`>`));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED),
            this._emitChars(`�`));
          break;
        case L.EOF:
          (this._err(R.eofInScriptHtmlCommentLikeText), this._emitEOFToken());
          break;
        default:
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED), this._emitCodePoint(e));
      }
    }
    _stateScriptDataDoubleEscapedLessThanSign(e) {
      e === L.SOLIDUS
        ? ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPE_END), this._emitChars(`/`))
        : ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED),
          this._stateScriptDataDoubleEscaped(e));
    }
    _stateScriptDataDoubleEscapeEnd(e) {
      if (
        this.preprocessor.startsWith($t.SCRIPT, !1) &&
        Ln(this.preprocessor.peek($t.SCRIPT.length))
      ) {
        this._emitCodePoint(e);
        for (let e = 0; e < $t.SCRIPT.length; e++)
          this._emitCodePoint(this._consume());
        this.state = W.SCRIPT_DATA_ESCAPED;
      } else
        this._ensureHibernation() ||
          ((this.state = W.SCRIPT_DATA_DOUBLE_ESCAPED),
          this._stateScriptDataDoubleEscaped(e));
    }
    _stateBeforeAttributeName(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.SOLIDUS:
        case L.GREATER_THAN_SIGN:
        case L.EOF:
          ((this.state = W.AFTER_ATTRIBUTE_NAME),
            this._stateAfterAttributeName(e));
          break;
        case L.EQUALS_SIGN:
          (this._err(R.unexpectedEqualsSignBeforeAttributeName),
            this._createAttr(`=`),
            (this.state = W.ATTRIBUTE_NAME));
          break;
        default:
          (this._createAttr(``),
            (this.state = W.ATTRIBUTE_NAME),
            this._stateAttributeName(e));
      }
    }
    _stateAttributeName(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
        case L.SOLIDUS:
        case L.GREATER_THAN_SIGN:
        case L.EOF:
          (this._leaveAttrName(),
            (this.state = W.AFTER_ATTRIBUTE_NAME),
            this._stateAfterAttributeName(e));
          break;
        case L.EQUALS_SIGN:
          (this._leaveAttrName(), (this.state = W.BEFORE_ATTRIBUTE_VALUE));
          break;
        case L.QUOTATION_MARK:
        case L.APOSTROPHE:
        case L.LESS_THAN_SIGN:
          (this._err(R.unexpectedCharacterInAttributeName),
            (this.currentAttr.name += String.fromCodePoint(e)));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.currentAttr.name += `�`));
          break;
        default:
          this.currentAttr.name += String.fromCodePoint(jn(e) ? Fn(e) : e);
      }
    }
    _stateAfterAttributeName(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.SOLIDUS:
          this.state = W.SELF_CLOSING_START_TAG;
          break;
        case L.EQUALS_SIGN:
          this.state = W.BEFORE_ATTRIBUTE_VALUE;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentTagToken());
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          (this._createAttr(``),
            (this.state = W.ATTRIBUTE_NAME),
            this._stateAttributeName(e));
      }
    }
    _stateBeforeAttributeValue(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.QUOTATION_MARK:
          this.state = W.ATTRIBUTE_VALUE_DOUBLE_QUOTED;
          break;
        case L.APOSTROPHE:
          this.state = W.ATTRIBUTE_VALUE_SINGLE_QUOTED;
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.missingAttributeValue),
            (this.state = W.DATA),
            this.emitCurrentTagToken());
          break;
        default:
          ((this.state = W.ATTRIBUTE_VALUE_UNQUOTED),
            this._stateAttributeValueUnquoted(e));
      }
    }
    _stateAttributeValueDoubleQuoted(e) {
      switch (e) {
        case L.QUOTATION_MARK:
          this.state = W.AFTER_ATTRIBUTE_VALUE_QUOTED;
          break;
        case L.AMPERSAND:
          this._startCharacterReference();
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.currentAttr.value += `�`));
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          this.currentAttr.value += String.fromCodePoint(e);
      }
    }
    _stateAttributeValueSingleQuoted(e) {
      switch (e) {
        case L.APOSTROPHE:
          this.state = W.AFTER_ATTRIBUTE_VALUE_QUOTED;
          break;
        case L.AMPERSAND:
          this._startCharacterReference();
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.currentAttr.value += `�`));
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          this.currentAttr.value += String.fromCodePoint(e);
      }
    }
    _stateAttributeValueUnquoted(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          (this._leaveAttrValue(), (this.state = W.BEFORE_ATTRIBUTE_NAME));
          break;
        case L.AMPERSAND:
          this._startCharacterReference();
          break;
        case L.GREATER_THAN_SIGN:
          (this._leaveAttrValue(),
            (this.state = W.DATA),
            this.emitCurrentTagToken());
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter),
            (this.currentAttr.value += `�`));
          break;
        case L.QUOTATION_MARK:
        case L.APOSTROPHE:
        case L.LESS_THAN_SIGN:
        case L.EQUALS_SIGN:
        case L.GRAVE_ACCENT:
          (this._err(R.unexpectedCharacterInUnquotedAttributeValue),
            (this.currentAttr.value += String.fromCodePoint(e)));
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          this.currentAttr.value += String.fromCodePoint(e);
      }
    }
    _stateAfterAttributeValueQuoted(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          (this._leaveAttrValue(), (this.state = W.BEFORE_ATTRIBUTE_NAME));
          break;
        case L.SOLIDUS:
          (this._leaveAttrValue(), (this.state = W.SELF_CLOSING_START_TAG));
          break;
        case L.GREATER_THAN_SIGN:
          (this._leaveAttrValue(),
            (this.state = W.DATA),
            this.emitCurrentTagToken());
          break;
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          (this._err(R.missingWhitespaceBetweenAttributes),
            (this.state = W.BEFORE_ATTRIBUTE_NAME),
            this._stateBeforeAttributeName(e));
      }
    }
    _stateSelfClosingStartTag(e) {
      switch (e) {
        case L.GREATER_THAN_SIGN: {
          let e = this.currentToken;
          ((e.selfClosing = !0),
            (this.state = W.DATA),
            this.emitCurrentTagToken());
          break;
        }
        case L.EOF:
          (this._err(R.eofInTag), this._emitEOFToken());
          break;
        default:
          (this._err(R.unexpectedSolidusInTag),
            (this.state = W.BEFORE_ATTRIBUTE_NAME),
            this._stateBeforeAttributeName(e));
      }
    }
    _stateBogusComment(e) {
      let t = this.currentToken;
      switch (e) {
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentComment(t));
          break;
        case L.EOF:
          (this.emitCurrentComment(t), this._emitEOFToken());
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.data += `�`));
          break;
        default:
          t.data += String.fromCodePoint(e);
      }
    }
    _stateMarkupDeclarationOpen(e) {
      this._consumeSequenceIfMatch($t.DASH_DASH, !0)
        ? (this._createCommentToken($t.DASH_DASH.length + 1),
          (this.state = W.COMMENT_START))
        : this._consumeSequenceIfMatch($t.DOCTYPE, !1)
          ? ((this.currentLocation = this.getCurrentLocation(
              $t.DOCTYPE.length + 1,
            )),
            (this.state = W.DOCTYPE))
          : this._consumeSequenceIfMatch($t.CDATA_START, !0)
            ? this.inForeignNode
              ? (this.state = W.CDATA_SECTION)
              : (this._err(R.cdataInHtmlContent),
                this._createCommentToken($t.CDATA_START.length + 1),
                (this.currentToken.data = `[CDATA[`),
                (this.state = W.BOGUS_COMMENT))
            : this._ensureHibernation() ||
              (this._err(R.incorrectlyOpenedComment),
              this._createCommentToken(2),
              (this.state = W.BOGUS_COMMENT),
              this._stateBogusComment(e));
    }
    _stateCommentStart(e) {
      switch (e) {
        case L.HYPHEN_MINUS:
          this.state = W.COMMENT_START_DASH;
          break;
        case L.GREATER_THAN_SIGN: {
          (this._err(R.abruptClosingOfEmptyComment), (this.state = W.DATA));
          let e = this.currentToken;
          this.emitCurrentComment(e);
          break;
        }
        default:
          ((this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateCommentStartDash(e) {
      let t = this.currentToken;
      switch (e) {
        case L.HYPHEN_MINUS:
          this.state = W.COMMENT_END;
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.abruptClosingOfEmptyComment),
            (this.state = W.DATA),
            this.emitCurrentComment(t));
          break;
        case L.EOF:
          (this._err(R.eofInComment),
            this.emitCurrentComment(t),
            this._emitEOFToken());
          break;
        default:
          ((t.data += `-`), (this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateComment(e) {
      let t = this.currentToken;
      switch (e) {
        case L.HYPHEN_MINUS:
          this.state = W.COMMENT_END_DASH;
          break;
        case L.LESS_THAN_SIGN:
          ((t.data += `<`), (this.state = W.COMMENT_LESS_THAN_SIGN));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.data += `�`));
          break;
        case L.EOF:
          (this._err(R.eofInComment),
            this.emitCurrentComment(t),
            this._emitEOFToken());
          break;
        default:
          t.data += String.fromCodePoint(e);
      }
    }
    _stateCommentLessThanSign(e) {
      let t = this.currentToken;
      switch (e) {
        case L.EXCLAMATION_MARK:
          ((t.data += `!`), (this.state = W.COMMENT_LESS_THAN_SIGN_BANG));
          break;
        case L.LESS_THAN_SIGN:
          t.data += `<`;
          break;
        default:
          ((this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateCommentLessThanSignBang(e) {
      e === L.HYPHEN_MINUS
        ? (this.state = W.COMMENT_LESS_THAN_SIGN_BANG_DASH)
        : ((this.state = W.COMMENT), this._stateComment(e));
    }
    _stateCommentLessThanSignBangDash(e) {
      e === L.HYPHEN_MINUS
        ? (this.state = W.COMMENT_LESS_THAN_SIGN_BANG_DASH_DASH)
        : ((this.state = W.COMMENT_END_DASH), this._stateCommentEndDash(e));
    }
    _stateCommentLessThanSignBangDashDash(e) {
      (e !== L.GREATER_THAN_SIGN && e !== L.EOF && this._err(R.nestedComment),
        (this.state = W.COMMENT_END),
        this._stateCommentEnd(e));
    }
    _stateCommentEndDash(e) {
      let t = this.currentToken;
      switch (e) {
        case L.HYPHEN_MINUS:
          this.state = W.COMMENT_END;
          break;
        case L.EOF:
          (this._err(R.eofInComment),
            this.emitCurrentComment(t),
            this._emitEOFToken());
          break;
        default:
          ((t.data += `-`), (this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateCommentEnd(e) {
      let t = this.currentToken;
      switch (e) {
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentComment(t));
          break;
        case L.EXCLAMATION_MARK:
          this.state = W.COMMENT_END_BANG;
          break;
        case L.HYPHEN_MINUS:
          t.data += `-`;
          break;
        case L.EOF:
          (this._err(R.eofInComment),
            this.emitCurrentComment(t),
            this._emitEOFToken());
          break;
        default:
          ((t.data += `--`), (this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateCommentEndBang(e) {
      let t = this.currentToken;
      switch (e) {
        case L.HYPHEN_MINUS:
          ((t.data += `--!`), (this.state = W.COMMENT_END_DASH));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.incorrectlyClosedComment),
            (this.state = W.DATA),
            this.emitCurrentComment(t));
          break;
        case L.EOF:
          (this._err(R.eofInComment),
            this.emitCurrentComment(t),
            this._emitEOFToken());
          break;
        default:
          ((t.data += `--!`), (this.state = W.COMMENT), this._stateComment(e));
      }
    }
    _stateDoctype(e) {
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.BEFORE_DOCTYPE_NAME;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.BEFORE_DOCTYPE_NAME),
            this._stateBeforeDoctypeName(e));
          break;
        case L.EOF: {
          (this._err(R.eofInDoctype), this._createDoctypeToken(null));
          let e = this.currentToken;
          ((e.forceQuirks = !0),
            this.emitCurrentDoctype(e),
            this._emitEOFToken());
          break;
        }
        default:
          (this._err(R.missingWhitespaceBeforeDoctypeName),
            (this.state = W.BEFORE_DOCTYPE_NAME),
            this._stateBeforeDoctypeName(e));
      }
    }
    _stateBeforeDoctypeName(e) {
      if (jn(e))
        (this._createDoctypeToken(String.fromCharCode(Fn(e))),
          (this.state = W.DOCTYPE_NAME));
      else
        switch (e) {
          case L.SPACE:
          case L.LINE_FEED:
          case L.TABULATION:
          case L.FORM_FEED:
            break;
          case L.NULL:
            (this._err(R.unexpectedNullCharacter),
              this._createDoctypeToken(`�`),
              (this.state = W.DOCTYPE_NAME));
            break;
          case L.GREATER_THAN_SIGN: {
            (this._err(R.missingDoctypeName), this._createDoctypeToken(null));
            let e = this.currentToken;
            ((e.forceQuirks = !0),
              this.emitCurrentDoctype(e),
              (this.state = W.DATA));
            break;
          }
          case L.EOF: {
            (this._err(R.eofInDoctype), this._createDoctypeToken(null));
            let e = this.currentToken;
            ((e.forceQuirks = !0),
              this.emitCurrentDoctype(e),
              this._emitEOFToken());
            break;
          }
          default:
            (this._createDoctypeToken(String.fromCodePoint(e)),
              (this.state = W.DOCTYPE_NAME));
        }
    }
    _stateDoctypeName(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.AFTER_DOCTYPE_NAME;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentDoctype(t));
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.name += `�`));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          t.name += String.fromCodePoint(jn(e) ? Fn(e) : e);
      }
    }
    _stateAfterDoctypeName(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentDoctype(t));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          this._consumeSequenceIfMatch($t.PUBLIC, !1)
            ? (this.state = W.AFTER_DOCTYPE_PUBLIC_KEYWORD)
            : this._consumeSequenceIfMatch($t.SYSTEM, !1)
              ? (this.state = W.AFTER_DOCTYPE_SYSTEM_KEYWORD)
              : this._ensureHibernation() ||
                (this._err(R.invalidCharacterSequenceAfterDoctypeName),
                (t.forceQuirks = !0),
                (this.state = W.BOGUS_DOCTYPE),
                this._stateBogusDoctype(e));
      }
    }
    _stateAfterDoctypePublicKeyword(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.BEFORE_DOCTYPE_PUBLIC_IDENTIFIER;
          break;
        case L.QUOTATION_MARK:
          (this._err(R.missingWhitespaceAfterDoctypePublicKeyword),
            (t.publicId = ``),
            (this.state = W.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          (this._err(R.missingWhitespaceAfterDoctypePublicKeyword),
            (t.publicId = ``),
            (this.state = W.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.missingDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.DATA),
            this.emitCurrentDoctype(t));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateBeforeDoctypePublicIdentifier(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.QUOTATION_MARK:
          ((t.publicId = ``),
            (this.state = W.DOCTYPE_PUBLIC_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          ((t.publicId = ``),
            (this.state = W.DOCTYPE_PUBLIC_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.missingDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.DATA),
            this.emitCurrentDoctype(t));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateDoctypePublicIdentifierDoubleQuoted(e) {
      let t = this.currentToken;
      switch (e) {
        case L.QUOTATION_MARK:
          this.state = W.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.publicId += `�`));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.abruptDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            (this.state = W.DATA));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          t.publicId += String.fromCodePoint(e);
      }
    }
    _stateDoctypePublicIdentifierSingleQuoted(e) {
      let t = this.currentToken;
      switch (e) {
        case L.APOSTROPHE:
          this.state = W.AFTER_DOCTYPE_PUBLIC_IDENTIFIER;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.publicId += `�`));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.abruptDoctypePublicIdentifier),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            (this.state = W.DATA));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          t.publicId += String.fromCodePoint(e);
      }
    }
    _stateAfterDoctypePublicIdentifier(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.BETWEEN_DOCTYPE_PUBLIC_AND_SYSTEM_IDENTIFIERS;
          break;
        case L.GREATER_THAN_SIGN:
          ((this.state = W.DATA), this.emitCurrentDoctype(t));
          break;
        case L.QUOTATION_MARK:
          (this._err(
            R.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers,
          ),
            (t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          (this._err(
            R.missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers,
          ),
            (t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateBetweenDoctypePublicAndSystemIdentifiers(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.GREATER_THAN_SIGN:
          (this.emitCurrentDoctype(t), (this.state = W.DATA));
          break;
        case L.QUOTATION_MARK:
          ((t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          ((t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateAfterDoctypeSystemKeyword(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          this.state = W.BEFORE_DOCTYPE_SYSTEM_IDENTIFIER;
          break;
        case L.QUOTATION_MARK:
          (this._err(R.missingWhitespaceAfterDoctypeSystemKeyword),
            (t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          (this._err(R.missingWhitespaceAfterDoctypeSystemKeyword),
            (t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.missingDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.DATA),
            this.emitCurrentDoctype(t));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateBeforeDoctypeSystemIdentifier(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.QUOTATION_MARK:
          ((t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_DOUBLE_QUOTED));
          break;
        case L.APOSTROPHE:
          ((t.systemId = ``),
            (this.state = W.DOCTYPE_SYSTEM_IDENTIFIER_SINGLE_QUOTED));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.missingDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.DATA),
            this.emitCurrentDoctype(t));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.missingQuoteBeforeDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateDoctypeSystemIdentifierDoubleQuoted(e) {
      let t = this.currentToken;
      switch (e) {
        case L.QUOTATION_MARK:
          this.state = W.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.systemId += `�`));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.abruptDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            (this.state = W.DATA));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          t.systemId += String.fromCodePoint(e);
      }
    }
    _stateDoctypeSystemIdentifierSingleQuoted(e) {
      let t = this.currentToken;
      switch (e) {
        case L.APOSTROPHE:
          this.state = W.AFTER_DOCTYPE_SYSTEM_IDENTIFIER;
          break;
        case L.NULL:
          (this._err(R.unexpectedNullCharacter), (t.systemId += `�`));
          break;
        case L.GREATER_THAN_SIGN:
          (this._err(R.abruptDoctypeSystemIdentifier),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            (this.state = W.DATA));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          t.systemId += String.fromCodePoint(e);
      }
    }
    _stateAfterDoctypeSystemIdentifier(e) {
      let t = this.currentToken;
      switch (e) {
        case L.SPACE:
        case L.LINE_FEED:
        case L.TABULATION:
        case L.FORM_FEED:
          break;
        case L.GREATER_THAN_SIGN:
          (this.emitCurrentDoctype(t), (this.state = W.DATA));
          break;
        case L.EOF:
          (this._err(R.eofInDoctype),
            (t.forceQuirks = !0),
            this.emitCurrentDoctype(t),
            this._emitEOFToken());
          break;
        default:
          (this._err(R.unexpectedCharacterAfterDoctypeSystemIdentifier),
            (this.state = W.BOGUS_DOCTYPE),
            this._stateBogusDoctype(e));
      }
    }
    _stateBogusDoctype(e) {
      let t = this.currentToken;
      switch (e) {
        case L.GREATER_THAN_SIGN:
          (this.emitCurrentDoctype(t), (this.state = W.DATA));
          break;
        case L.NULL:
          this._err(R.unexpectedNullCharacter);
          break;
        case L.EOF:
          (this.emitCurrentDoctype(t), this._emitEOFToken());
          break;
        default:
      }
    }
    _stateCdataSection(e) {
      switch (e) {
        case L.RIGHT_SQUARE_BRACKET:
          this.state = W.CDATA_SECTION_BRACKET;
          break;
        case L.EOF:
          (this._err(R.eofInCdata), this._emitEOFToken());
          break;
        default:
          this._emitCodePoint(e);
      }
    }
    _stateCdataSectionBracket(e) {
      e === L.RIGHT_SQUARE_BRACKET
        ? (this.state = W.CDATA_SECTION_END)
        : (this._emitChars(`]`),
          (this.state = W.CDATA_SECTION),
          this._stateCdataSection(e));
    }
    _stateCdataSectionEnd(e) {
      switch (e) {
        case L.GREATER_THAN_SIGN:
          this.state = W.DATA;
          break;
        case L.RIGHT_SQUARE_BRACKET:
          this._emitChars(`]`);
          break;
        default:
          (this._emitChars(`]]`),
            (this.state = W.CDATA_SECTION),
            this._stateCdataSection(e));
      }
    }
    _stateCharacterReference() {
      let e = this.entityDecoder.write(
        this.preprocessor.html,
        this.preprocessor.pos,
      );
      if (e < 0)
        if (this.preprocessor.lastChunkWritten) e = this.entityDecoder.end();
        else {
          ((this.active = !1),
            (this.preprocessor.pos = this.preprocessor.html.length - 1),
            (this.consumedAfterSnapshot = 0),
            (this.preprocessor.endOfChunkHit = !0));
          return;
        }
      e === 0
        ? ((this.preprocessor.pos = this.entityStartPos),
          this._flushCodePointConsumedAsCharacterReference(L.AMPERSAND),
          (this.state =
            !this._isCharacterReferenceInAttribute() &&
            Pn(this.preprocessor.peek(1))
              ? W.AMBIGUOUS_AMPERSAND
              : this.returnState))
        : (this.state = this.returnState);
    }
    _stateAmbiguousAmpersand(e) {
      Pn(e)
        ? this._flushCodePointConsumedAsCharacterReference(e)
        : (e === L.SEMICOLON && this._err(R.unknownNamedCharacterReference),
          (this.state = this.returnState),
          this._callState(e));
    }
  },
  Bn = new Set([
    H.DD,
    H.DT,
    H.LI,
    H.OPTGROUP,
    H.OPTION,
    H.P,
    H.RB,
    H.RP,
    H.RT,
    H.RTC,
  ]),
  Vn = new Set([
    ...Bn,
    H.CAPTION,
    H.COLGROUP,
    H.TBODY,
    H.TD,
    H.TFOOT,
    H.TH,
    H.THEAD,
    H.TR,
  ]),
  Hn = new Set([
    H.APPLET,
    H.CAPTION,
    H.HTML,
    H.MARQUEE,
    H.OBJECT,
    H.TABLE,
    H.TD,
    H.TEMPLATE,
    H.TH,
  ]),
  Un = new Set([...Hn, H.OL, H.UL]),
  Wn = new Set([...Hn, H.BUTTON]),
  Gn = new Set([H.ANNOTATION_XML, H.MI, H.MN, H.MO, H.MS, H.MTEXT]),
  Kn = new Set([H.DESC, H.FOREIGN_OBJECT, H.TITLE]),
  qn = new Set([H.TR, H.TEMPLATE, H.HTML]),
  Jn = new Set([H.TBODY, H.TFOOT, H.THEAD, H.TEMPLATE, H.HTML]),
  Yn = new Set([H.TABLE, H.TEMPLATE, H.HTML]),
  Xn = new Set([H.TD, H.TH]),
  Zn = class {
    get currentTmplContentOrNode() {
      return this._isInTemplate()
        ? this.treeAdapter.getTemplateContent(this.current)
        : this.current;
    }
    constructor(e, t, n) {
      ((this.treeAdapter = t),
        (this.handler = n),
        (this.items = []),
        (this.tagIDs = []),
        (this.stackTop = -1),
        (this.tmplCount = 0),
        (this.currentTagId = H.UNKNOWN),
        (this.current = e));
    }
    _indexOf(e) {
      return this.items.lastIndexOf(e, this.stackTop);
    }
    _isInTemplate() {
      return (
        this.currentTagId === H.TEMPLATE &&
        this.treeAdapter.getNamespaceURI(this.current) === B.HTML
      );
    }
    _updateCurrentElement() {
      ((this.current = this.items[this.stackTop]),
        (this.currentTagId = this.tagIDs[this.stackTop]));
    }
    push(e, t) {
      (this.stackTop++,
        (this.items[this.stackTop] = e),
        (this.current = e),
        (this.tagIDs[this.stackTop] = t),
        (this.currentTagId = t),
        this._isInTemplate() && this.tmplCount++,
        this.handler.onItemPush(e, t, !0));
    }
    pop() {
      let e = this.current;
      (this.tmplCount > 0 && this._isInTemplate() && this.tmplCount--,
        this.stackTop--,
        this._updateCurrentElement(),
        this.handler.onItemPop(e, !0));
    }
    replace(e, t) {
      let n = this._indexOf(e);
      ((this.items[n] = t), n === this.stackTop && (this.current = t));
    }
    insertAfter(e, t, n) {
      let r = this._indexOf(e) + 1;
      (this.items.splice(r, 0, t),
        this.tagIDs.splice(r, 0, n),
        this.stackTop++,
        r === this.stackTop && this._updateCurrentElement(),
        this.current &&
          this.currentTagId !== void 0 &&
          this.handler.onItemPush(
            this.current,
            this.currentTagId,
            r === this.stackTop,
          ));
    }
    popUntilTagNamePopped(e) {
      let t = this.stackTop + 1;
      do t = this.tagIDs.lastIndexOf(e, t - 1);
      while (
        t > 0 &&
        this.treeAdapter.getNamespaceURI(this.items[t]) !== B.HTML
      );
      this.shortenToLength(Math.max(t, 0));
    }
    shortenToLength(e) {
      for (; this.stackTop >= e; ) {
        let t = this.current;
        (this.tmplCount > 0 && this._isInTemplate() && --this.tmplCount,
          this.stackTop--,
          this._updateCurrentElement(),
          this.handler.onItemPop(t, this.stackTop < e));
      }
    }
    popUntilElementPopped(e) {
      let t = this._indexOf(e);
      this.shortenToLength(Math.max(t, 0));
    }
    popUntilPopped(e, t) {
      let n = this._indexOfTagNames(e, t);
      this.shortenToLength(Math.max(n, 0));
    }
    popUntilNumberedHeaderPopped() {
      this.popUntilPopped(On, B.HTML);
    }
    popUntilTableCellPopped() {
      this.popUntilPopped(Xn, B.HTML);
    }
    popAllUpToHtmlElement() {
      ((this.tmplCount = 0), this.shortenToLength(1));
    }
    _indexOfTagNames(e, t) {
      for (let n = this.stackTop; n >= 0; n--)
        if (
          e.has(this.tagIDs[n]) &&
          this.treeAdapter.getNamespaceURI(this.items[n]) === t
        )
          return n;
      return -1;
    }
    clearBackTo(e, t) {
      let n = this._indexOfTagNames(e, t);
      this.shortenToLength(n + 1);
    }
    clearBackToTableContext() {
      this.clearBackTo(Yn, B.HTML);
    }
    clearBackToTableBodyContext() {
      this.clearBackTo(Jn, B.HTML);
    }
    clearBackToTableRowContext() {
      this.clearBackTo(qn, B.HTML);
    }
    remove(e) {
      let t = this._indexOf(e);
      t >= 0 &&
        (t === this.stackTop
          ? this.pop()
          : (this.items.splice(t, 1),
            this.tagIDs.splice(t, 1),
            this.stackTop--,
            this._updateCurrentElement(),
            this.handler.onItemPop(e, !1)));
    }
    tryPeekProperlyNestedBodyElement() {
      return this.stackTop >= 1 && this.tagIDs[1] === H.BODY
        ? this.items[1]
        : null;
    }
    contains(e) {
      return this._indexOf(e) > -1;
    }
    getCommonAncestor(e) {
      let t = this._indexOf(e) - 1;
      return t >= 0 ? this.items[t] : null;
    }
    isRootHtmlElementCurrent() {
      return this.stackTop === 0 && this.tagIDs[0] === H.HTML;
    }
    hasInDynamicScope(e, t) {
      for (let n = this.stackTop; n >= 0; n--) {
        let r = this.tagIDs[n];
        switch (this.treeAdapter.getNamespaceURI(this.items[n])) {
          case B.HTML:
            if (r === e) return !0;
            if (t.has(r)) return !1;
            break;
          case B.SVG:
            if (Kn.has(r)) return !1;
            break;
          case B.MATHML:
            if (Gn.has(r)) return !1;
            break;
        }
      }
      return !0;
    }
    hasInScope(e) {
      return this.hasInDynamicScope(e, Hn);
    }
    hasInListItemScope(e) {
      return this.hasInDynamicScope(e, Un);
    }
    hasInButtonScope(e) {
      return this.hasInDynamicScope(e, Wn);
    }
    hasNumberedHeaderInScope() {
      for (let e = this.stackTop; e >= 0; e--) {
        let t = this.tagIDs[e];
        switch (this.treeAdapter.getNamespaceURI(this.items[e])) {
          case B.HTML:
            if (On.has(t)) return !0;
            if (Hn.has(t)) return !1;
            break;
          case B.SVG:
            if (Kn.has(t)) return !1;
            break;
          case B.MATHML:
            if (Gn.has(t)) return !1;
            break;
        }
      }
      return !0;
    }
    hasInTableScope(e) {
      for (let t = this.stackTop; t >= 0; t--)
        if (this.treeAdapter.getNamespaceURI(this.items[t]) === B.HTML)
          switch (this.tagIDs[t]) {
            case e:
              return !0;
            case H.TABLE:
            case H.HTML:
              return !1;
          }
      return !0;
    }
    hasTableBodyContextInTableScope() {
      for (let e = this.stackTop; e >= 0; e--)
        if (this.treeAdapter.getNamespaceURI(this.items[e]) === B.HTML)
          switch (this.tagIDs[e]) {
            case H.TBODY:
            case H.THEAD:
            case H.TFOOT:
              return !0;
            case H.TABLE:
            case H.HTML:
              return !1;
          }
      return !0;
    }
    hasInSelectScope(e) {
      for (let t = this.stackTop; t >= 0; t--)
        if (this.treeAdapter.getNamespaceURI(this.items[t]) === B.HTML)
          switch (this.tagIDs[t]) {
            case e:
              return !0;
            case H.OPTION:
            case H.OPTGROUP:
              break;
            default:
              return !1;
          }
      return !0;
    }
    generateImpliedEndTags() {
      for (; this.currentTagId !== void 0 && Bn.has(this.currentTagId); )
        this.pop();
    }
    generateImpliedEndTagsThoroughly() {
      for (; this.currentTagId !== void 0 && Vn.has(this.currentTagId); )
        this.pop();
    }
    generateImpliedEndTagsWithExclusion(e) {
      for (
        ;
        this.currentTagId !== void 0 &&
        this.currentTagId !== e &&
        Vn.has(this.currentTagId);
      )
        this.pop();
    }
  },
  Qn = 3,
  $n;
(function (e) {
  ((e[(e.Marker = 0)] = `Marker`), (e[(e.Element = 1)] = `Element`));
})(($n ||= {}));
var er = { type: $n.Marker },
  tr = class {
    constructor(e) {
      ((this.treeAdapter = e), (this.entries = []), (this.bookmark = null));
    }
    _getNoahArkConditionCandidates(e, t) {
      let n = [],
        r = t.length,
        i = this.treeAdapter.getTagName(e),
        a = this.treeAdapter.getNamespaceURI(e);
      for (let e = 0; e < this.entries.length; e++) {
        let t = this.entries[e];
        if (t.type === $n.Marker) break;
        let { element: o } = t;
        if (
          this.treeAdapter.getTagName(o) === i &&
          this.treeAdapter.getNamespaceURI(o) === a
        ) {
          let t = this.treeAdapter.getAttrList(o);
          t.length === r && n.push({ idx: e, attrs: t });
        }
      }
      return n;
    }
    _ensureNoahArkCondition(e) {
      if (this.entries.length < Qn) return;
      let t = this.treeAdapter.getAttrList(e),
        n = this._getNoahArkConditionCandidates(e, t);
      if (n.length < Qn) return;
      let r = new Map(t.map((e) => [e.name, e.value])),
        i = 0;
      for (let e = 0; e < n.length; e++) {
        let t = n[e];
        t.attrs.every((e) => r.get(e.name) === e.value) &&
          ((i += 1), i >= Qn && this.entries.splice(t.idx, 1));
      }
    }
    insertMarker() {
      this.entries.unshift(er);
    }
    pushElement(e, t) {
      (this._ensureNoahArkCondition(e),
        this.entries.unshift({ type: $n.Element, element: e, token: t }));
    }
    insertElementAfterBookmark(e, t) {
      let n = this.entries.indexOf(this.bookmark);
      this.entries.splice(n, 0, { type: $n.Element, element: e, token: t });
    }
    removeEntry(e) {
      let t = this.entries.indexOf(e);
      t !== -1 && this.entries.splice(t, 1);
    }
    clearToLastMarker() {
      let e = this.entries.indexOf(er);
      e === -1 ? (this.entries.length = 0) : this.entries.splice(0, e + 1);
    }
    getElementEntryInScopeWithTagName(e) {
      let t = this.entries.find(
        (t) =>
          t.type === $n.Marker || this.treeAdapter.getTagName(t.element) === e,
      );
      return t && t.type === $n.Element ? t : null;
    }
    getElementEntry(e) {
      return this.entries.find((t) => t.type === $n.Element && t.element === e);
    }
  },
  nr = {
    createDocument() {
      return { nodeName: `#document`, mode: wn.NO_QUIRKS, childNodes: [] };
    },
    createDocumentFragment() {
      return { nodeName: `#document-fragment`, childNodes: [] };
    },
    createElement(e, t, n) {
      return {
        nodeName: e,
        tagName: e,
        attrs: n,
        namespaceURI: t,
        childNodes: [],
        parentNode: null,
      };
    },
    createCommentNode(e) {
      return { nodeName: `#comment`, data: e, parentNode: null };
    },
    createTextNode(e) {
      return { nodeName: `#text`, value: e, parentNode: null };
    },
    appendChild(e, t) {
      (e.childNodes.push(t), (t.parentNode = e));
    },
    insertBefore(e, t, n) {
      let r = e.childNodes.indexOf(n);
      (e.childNodes.splice(r, 0, t), (t.parentNode = e));
    },
    setTemplateContent(e, t) {
      e.content = t;
    },
    getTemplateContent(e) {
      return e.content;
    },
    setDocumentType(e, t, n, r) {
      let i = e.childNodes.find((e) => e.nodeName === `#documentType`);
      if (i) ((i.name = t), (i.publicId = n), (i.systemId = r));
      else {
        let i = {
          nodeName: `#documentType`,
          name: t,
          publicId: n,
          systemId: r,
          parentNode: null,
        };
        nr.appendChild(e, i);
      }
    },
    setDocumentMode(e, t) {
      e.mode = t;
    },
    getDocumentMode(e) {
      return e.mode;
    },
    detachNode(e) {
      if (e.parentNode) {
        let t = e.parentNode.childNodes.indexOf(e);
        (e.parentNode.childNodes.splice(t, 1), (e.parentNode = null));
      }
    },
    insertText(e, t) {
      if (e.childNodes.length > 0) {
        let n = e.childNodes[e.childNodes.length - 1];
        if (nr.isTextNode(n)) {
          n.value += t;
          return;
        }
      }
      nr.appendChild(e, nr.createTextNode(t));
    },
    insertTextBefore(e, t, n) {
      let r = e.childNodes[e.childNodes.indexOf(n) - 1];
      r && nr.isTextNode(r)
        ? (r.value += t)
        : nr.insertBefore(e, nr.createTextNode(t), n);
    },
    adoptAttributes(e, t) {
      let n = new Set(e.attrs.map((e) => e.name));
      for (let r = 0; r < t.length; r++) n.has(t[r].name) || e.attrs.push(t[r]);
    },
    getFirstChild(e) {
      return e.childNodes[0];
    },
    getChildNodes(e) {
      return e.childNodes;
    },
    getParentNode(e) {
      return e.parentNode;
    },
    getAttrList(e) {
      return e.attrs;
    },
    getTagName(e) {
      return e.tagName;
    },
    getNamespaceURI(e) {
      return e.namespaceURI;
    },
    getTextNodeContent(e) {
      return e.value;
    },
    getCommentNodeContent(e) {
      return e.data;
    },
    getDocumentTypeNodeName(e) {
      return e.name;
    },
    getDocumentTypeNodePublicId(e) {
      return e.publicId;
    },
    getDocumentTypeNodeSystemId(e) {
      return e.systemId;
    },
    isTextNode(e) {
      return e.nodeName === `#text`;
    },
    isCommentNode(e) {
      return e.nodeName === `#comment`;
    },
    isDocumentTypeNode(e) {
      return e.nodeName === `#documentType`;
    },
    isElementNode(e) {
      return Object.prototype.hasOwnProperty.call(e, `tagName`);
    },
    setNodeSourceCodeLocation(e, t) {
      e.sourceCodeLocation = t;
    },
    getNodeSourceCodeLocation(e) {
      return e.sourceCodeLocation;
    },
    updateNodeSourceCodeLocation(e, t) {
      e.sourceCodeLocation = { ...e.sourceCodeLocation, ...t };
    },
  },
  rr = `html`,
  ir = `about:legacy-compat`,
  ar = `http://www.ibm.com/data/dtd/v11/ibmxhtml1-transitional.dtd`,
  or =
    `+//silmaril//dtd html pro v0r11 19970101//,-//as//dtd html 3.0 aswedit + extensions//,-//advasoft ltd//dtd html 3.0 aswedit + extensions//,-//ietf//dtd html 2.0 level 1//,-//ietf//dtd html 2.0 level 2//,-//ietf//dtd html 2.0 strict level 1//,-//ietf//dtd html 2.0 strict level 2//,-//ietf//dtd html 2.0 strict//,-//ietf//dtd html 2.0//,-//ietf//dtd html 2.1e//,-//ietf//dtd html 3.0//,-//ietf//dtd html 3.2 final//,-//ietf//dtd html 3.2//,-//ietf//dtd html 3//,-//ietf//dtd html level 0//,-//ietf//dtd html level 1//,-//ietf//dtd html level 2//,-//ietf//dtd html level 3//,-//ietf//dtd html strict level 0//,-//ietf//dtd html strict level 1//,-//ietf//dtd html strict level 2//,-//ietf//dtd html strict level 3//,-//ietf//dtd html strict//,-//ietf//dtd html//,-//metrius//dtd metrius presentational//,-//microsoft//dtd internet explorer 2.0 html strict//,-//microsoft//dtd internet explorer 2.0 html//,-//microsoft//dtd internet explorer 2.0 tables//,-//microsoft//dtd internet explorer 3.0 html strict//,-//microsoft//dtd internet explorer 3.0 html//,-//microsoft//dtd internet explorer 3.0 tables//,-//netscape comm. corp.//dtd html//,-//netscape comm. corp.//dtd strict html//,-//o'reilly and associates//dtd html 2.0//,-//o'reilly and associates//dtd html extended 1.0//,-//o'reilly and associates//dtd html extended relaxed 1.0//,-//sq//dtd html 2.0 hotmetal + extensions//,-//softquad software//dtd hotmetal pro 6.0::19990601::extensions to html 4.0//,-//softquad//dtd hotmetal pro 4.0::19971010::extensions to html 4.0//,-//spyglass//dtd html 2.0 extended//,-//sun microsystems corp.//dtd hotjava html//,-//sun microsystems corp.//dtd hotjava strict html//,-//w3c//dtd html 3 1995-03-24//,-//w3c//dtd html 3.2 draft//,-//w3c//dtd html 3.2 final//,-//w3c//dtd html 3.2//,-//w3c//dtd html 3.2s draft//,-//w3c//dtd html 4.0 frameset//,-//w3c//dtd html 4.0 transitional//,-//w3c//dtd html experimental 19960712//,-//w3c//dtd html experimental 970421//,-//w3c//dtd w3 html//,-//w3o//dtd w3 html 3.0//,-//webtechs//dtd mozilla html 2.0//,-//webtechs//dtd mozilla html//`.split(
      `,`,
    ),
  sr = [
    ...or,
    `-//w3c//dtd html 4.01 frameset//`,
    `-//w3c//dtd html 4.01 transitional//`,
  ],
  cr = new Set([
    `-//w3o//dtd w3 html strict 3.0//en//`,
    `-/w3c/dtd html 4.0 transitional/en`,
    `html`,
  ]),
  lr = [
    `-//w3c//dtd xhtml 1.0 frameset//`,
    `-//w3c//dtd xhtml 1.0 transitional//`,
  ],
  ur = [
    ...lr,
    `-//w3c//dtd html 4.01 frameset//`,
    `-//w3c//dtd html 4.01 transitional//`,
  ];
function dr(e, t) {
  return t.some((t) => e.startsWith(t));
}
function fr(e) {
  return (
    e.name === rr &&
    e.publicId === null &&
    (e.systemId === null || e.systemId === ir)
  );
}
function pr(e) {
  if (e.name !== rr) return wn.QUIRKS;
  let { systemId: t } = e;
  if (t && t.toLowerCase() === ar) return wn.QUIRKS;
  let { publicId: n } = e;
  if (n !== null) {
    if (((n = n.toLowerCase()), cr.has(n))) return wn.QUIRKS;
    let e = t === null ? sr : or;
    if (dr(n, e)) return wn.QUIRKS;
    if (((e = t === null ? lr : ur), dr(n, e))) return wn.LIMITED_QUIRKS;
  }
  return wn.NO_QUIRKS;
}
var mr = { TEXT_HTML: `text/html`, APPLICATION_XML: `application/xhtml+xml` },
  hr = `definitionurl`,
  gr = `definitionURL`,
  _r = new Map(
    `attributeName.attributeType.baseFrequency.baseProfile.calcMode.clipPathUnits.diffuseConstant.edgeMode.filterUnits.glyphRef.gradientTransform.gradientUnits.kernelMatrix.kernelUnitLength.keyPoints.keySplines.keyTimes.lengthAdjust.limitingConeAngle.markerHeight.markerUnits.markerWidth.maskContentUnits.maskUnits.numOctaves.pathLength.patternContentUnits.patternTransform.patternUnits.pointsAtX.pointsAtY.pointsAtZ.preserveAlpha.preserveAspectRatio.primitiveUnits.refX.refY.repeatCount.repeatDur.requiredExtensions.requiredFeatures.specularConstant.specularExponent.spreadMethod.startOffset.stdDeviation.stitchTiles.surfaceScale.systemLanguage.tableValues.targetX.targetY.textLength.viewBox.viewTarget.xChannelSelector.yChannelSelector.zoomAndPan`
      .split(`.`)
      .map((e) => [e.toLowerCase(), e]),
  ),
  vr = new Map([
    [`xlink:actuate`, { prefix: `xlink`, name: `actuate`, namespace: B.XLINK }],
    [`xlink:arcrole`, { prefix: `xlink`, name: `arcrole`, namespace: B.XLINK }],
    [`xlink:href`, { prefix: `xlink`, name: `href`, namespace: B.XLINK }],
    [`xlink:role`, { prefix: `xlink`, name: `role`, namespace: B.XLINK }],
    [`xlink:show`, { prefix: `xlink`, name: `show`, namespace: B.XLINK }],
    [`xlink:title`, { prefix: `xlink`, name: `title`, namespace: B.XLINK }],
    [`xlink:type`, { prefix: `xlink`, name: `type`, namespace: B.XLINK }],
    [`xml:lang`, { prefix: `xml`, name: `lang`, namespace: B.XML }],
    [`xml:space`, { prefix: `xml`, name: `space`, namespace: B.XML }],
    [`xmlns`, { prefix: ``, name: `xmlns`, namespace: B.XMLNS }],
    [`xmlns:xlink`, { prefix: `xmlns`, name: `xlink`, namespace: B.XMLNS }],
  ]),
  yr = new Map(
    `altGlyph.altGlyphDef.altGlyphItem.animateColor.animateMotion.animateTransform.clipPath.feBlend.feColorMatrix.feComponentTransfer.feComposite.feConvolveMatrix.feDiffuseLighting.feDisplacementMap.feDistantLight.feFlood.feFuncA.feFuncB.feFuncG.feFuncR.feGaussianBlur.feImage.feMerge.feMergeNode.feMorphology.feOffset.fePointLight.feSpecularLighting.feSpotLight.feTile.feTurbulence.foreignObject.glyphRef.linearGradient.radialGradient.textPath`
      .split(`.`)
      .map((e) => [e.toLowerCase(), e]),
  ),
  br = new Set([
    H.B,
    H.BIG,
    H.BLOCKQUOTE,
    H.BODY,
    H.BR,
    H.CENTER,
    H.CODE,
    H.DD,
    H.DIV,
    H.DL,
    H.DT,
    H.EM,
    H.EMBED,
    H.H1,
    H.H2,
    H.H3,
    H.H4,
    H.H5,
    H.H6,
    H.HEAD,
    H.HR,
    H.I,
    H.IMG,
    H.LI,
    H.LISTING,
    H.MENU,
    H.META,
    H.NOBR,
    H.OL,
    H.P,
    H.PRE,
    H.RUBY,
    H.S,
    H.SMALL,
    H.SPAN,
    H.STRONG,
    H.STRIKE,
    H.SUB,
    H.SUP,
    H.TABLE,
    H.TT,
    H.U,
    H.UL,
    H.VAR,
  ]);
function xr(e) {
  let t = e.tagID;
  return (
    (t === H.FONT &&
      e.attrs.some(
        ({ name: e }) => e === Cn.COLOR || e === Cn.SIZE || e === Cn.FACE,
      )) ||
    br.has(t)
  );
}
function Sr(e) {
  for (let t = 0; t < e.attrs.length; t++)
    if (e.attrs[t].name === hr) {
      e.attrs[t].name = gr;
      break;
    }
}
function Cr(e) {
  for (let t = 0; t < e.attrs.length; t++) {
    let n = _r.get(e.attrs[t].name);
    n != null && (e.attrs[t].name = n);
  }
}
function wr(e) {
  for (let t = 0; t < e.attrs.length; t++) {
    let n = vr.get(e.attrs[t].name);
    n &&
      ((e.attrs[t].prefix = n.prefix),
      (e.attrs[t].name = n.name),
      (e.attrs[t].namespace = n.namespace));
  }
}
function Tr(e) {
  let t = yr.get(e.tagName);
  t != null && ((e.tagName = t), (e.tagID = En(e.tagName)));
}
function Er(e, t) {
  return (
    t === B.MATHML &&
    (e === H.MI || e === H.MO || e === H.MN || e === H.MS || e === H.MTEXT)
  );
}
function Dr(e, t, n) {
  if (t === B.MATHML && e === H.ANNOTATION_XML) {
    for (let e = 0; e < n.length; e++)
      if (n[e].name === Cn.ENCODING) {
        let t = n[e].value.toLowerCase();
        return t === mr.TEXT_HTML || t === mr.APPLICATION_XML;
      }
  }
  return (
    t === B.SVG && (e === H.FOREIGN_OBJECT || e === H.DESC || e === H.TITLE)
  );
}
function Or(e, t, n, r) {
  return (
    ((!r || r === B.HTML) && Dr(e, t, n)) ||
    ((!r || r === B.MATHML) && Er(e, t))
  );
}
var kr = `hidden`,
  Ar = 8,
  jr = 3,
  G;
(function (e) {
  ((e[(e.INITIAL = 0)] = `INITIAL`),
    (e[(e.BEFORE_HTML = 1)] = `BEFORE_HTML`),
    (e[(e.BEFORE_HEAD = 2)] = `BEFORE_HEAD`),
    (e[(e.IN_HEAD = 3)] = `IN_HEAD`),
    (e[(e.IN_HEAD_NO_SCRIPT = 4)] = `IN_HEAD_NO_SCRIPT`),
    (e[(e.AFTER_HEAD = 5)] = `AFTER_HEAD`),
    (e[(e.IN_BODY = 6)] = `IN_BODY`),
    (e[(e.TEXT = 7)] = `TEXT`),
    (e[(e.IN_TABLE = 8)] = `IN_TABLE`),
    (e[(e.IN_TABLE_TEXT = 9)] = `IN_TABLE_TEXT`),
    (e[(e.IN_CAPTION = 10)] = `IN_CAPTION`),
    (e[(e.IN_COLUMN_GROUP = 11)] = `IN_COLUMN_GROUP`),
    (e[(e.IN_TABLE_BODY = 12)] = `IN_TABLE_BODY`),
    (e[(e.IN_ROW = 13)] = `IN_ROW`),
    (e[(e.IN_CELL = 14)] = `IN_CELL`),
    (e[(e.IN_SELECT = 15)] = `IN_SELECT`),
    (e[(e.IN_SELECT_IN_TABLE = 16)] = `IN_SELECT_IN_TABLE`),
    (e[(e.IN_TEMPLATE = 17)] = `IN_TEMPLATE`),
    (e[(e.AFTER_BODY = 18)] = `AFTER_BODY`),
    (e[(e.IN_FRAMESET = 19)] = `IN_FRAMESET`),
    (e[(e.AFTER_FRAMESET = 20)] = `AFTER_FRAMESET`),
    (e[(e.AFTER_AFTER_BODY = 21)] = `AFTER_AFTER_BODY`),
    (e[(e.AFTER_AFTER_FRAMESET = 22)] = `AFTER_AFTER_FRAMESET`));
})((G ||= {}));
var Mr = {
    startLine: -1,
    startCol: -1,
    startOffset: -1,
    endLine: -1,
    endCol: -1,
    endOffset: -1,
  },
  Nr = new Set([H.TABLE, H.TBODY, H.TFOOT, H.THEAD, H.TR]),
  Pr = {
    scriptingEnabled: !0,
    sourceCodeLocationInfo: !1,
    treeAdapter: nr,
    onParseError: null,
  },
  Fr = class {
    constructor(e, t, n = null, r = null) {
      ((this.fragmentContext = n),
        (this.scriptHandler = r),
        (this.currentToken = null),
        (this.stopped = !1),
        (this.insertionMode = G.INITIAL),
        (this.originalInsertionMode = G.INITIAL),
        (this.headElement = null),
        (this.formElement = null),
        (this.currentNotInHTML = !1),
        (this.tmplInsertionModeStack = []),
        (this.pendingCharacterTokens = []),
        (this.hasNonWhitespacePendingCharacterToken = !1),
        (this.framesetOk = !0),
        (this.skipNextNewLine = !1),
        (this.fosterParentingEnabled = !1),
        (this.options = { ...Pr, ...e }),
        (this.treeAdapter = this.options.treeAdapter),
        (this.onParseError = this.options.onParseError),
        this.onParseError && (this.options.sourceCodeLocationInfo = !0),
        (this.document = t ?? this.treeAdapter.createDocument()),
        (this.tokenizer = new zn(this.options, this)),
        (this.activeFormattingElements = new tr(this.treeAdapter)),
        (this.fragmentContextID = n
          ? En(this.treeAdapter.getTagName(n))
          : H.UNKNOWN),
        this._setContextModes(n ?? this.document, this.fragmentContextID),
        (this.openElements = new Zn(this.document, this.treeAdapter, this)));
    }
    static parse(e, t) {
      let n = new this(t);
      return (n.tokenizer.write(e, !0), n.document);
    }
    static getFragmentParser(e, t) {
      let n = { ...Pr, ...t };
      e ??= n.treeAdapter.createElement(V.TEMPLATE, B.HTML, []);
      let r = n.treeAdapter.createElement(`documentmock`, B.HTML, []),
        i = new this(n, r, e);
      return (
        i.fragmentContextID === H.TEMPLATE &&
          i.tmplInsertionModeStack.unshift(G.IN_TEMPLATE),
        i._initTokenizerForFragmentParsing(),
        i._insertFakeRootElement(),
        i._resetInsertionMode(),
        i._findFormInFragmentContext(),
        i
      );
    }
    getFragment() {
      let e = this.treeAdapter.getFirstChild(this.document),
        t = this.treeAdapter.createDocumentFragment();
      return (this._adoptNodes(e, t), t);
    }
    _err(e, t, n) {
      if (!this.onParseError) return;
      let r = e.location ?? Mr,
        i = {
          code: t,
          startLine: r.startLine,
          startCol: r.startCol,
          startOffset: r.startOffset,
          endLine: n ? r.startLine : r.endLine,
          endCol: n ? r.startCol : r.endCol,
          endOffset: n ? r.startOffset : r.endOffset,
        };
      this.onParseError(i);
    }
    onItemPush(e, t, n) {
      var r, i;
      ((i = (r = this.treeAdapter).onItemPush) == null || i.call(r, e),
        n && this.openElements.stackTop > 0 && this._setContextModes(e, t));
    }
    onItemPop(e, t) {
      var n, r;
      if (
        (this.options.sourceCodeLocationInfo &&
          this._setEndLocation(e, this.currentToken),
        (r = (n = this.treeAdapter).onItemPop) == null ||
          r.call(n, e, this.openElements.current),
        t)
      ) {
        let e, t;
        (this.openElements.stackTop === 0 && this.fragmentContext
          ? ((e = this.fragmentContext), (t = this.fragmentContextID))
          : ({ current: e, currentTagId: t } = this.openElements),
          this._setContextModes(e, t));
      }
    }
    _setContextModes(e, t) {
      let n =
        e === this.document ||
        (e && this.treeAdapter.getNamespaceURI(e) === B.HTML);
      ((this.currentNotInHTML = !n),
        (this.tokenizer.inForeignNode =
          !n &&
          e !== void 0 &&
          t !== void 0 &&
          !this._isIntegrationPoint(t, e)));
    }
    _switchToTextParsing(e, t) {
      (this._insertElement(e, B.HTML),
        (this.tokenizer.state = t),
        (this.originalInsertionMode = this.insertionMode),
        (this.insertionMode = G.TEXT));
    }
    switchToPlaintextParsing() {
      ((this.insertionMode = G.TEXT),
        (this.originalInsertionMode = G.IN_BODY),
        (this.tokenizer.state = kn.PLAINTEXT));
    }
    _getAdjustedCurrentElement() {
      return this.openElements.stackTop === 0 && this.fragmentContext
        ? this.fragmentContext
        : this.openElements.current;
    }
    _findFormInFragmentContext() {
      let e = this.fragmentContext;
      for (; e; ) {
        if (this.treeAdapter.getTagName(e) === V.FORM) {
          this.formElement = e;
          break;
        }
        e = this.treeAdapter.getParentNode(e);
      }
    }
    _initTokenizerForFragmentParsing() {
      if (
        !(
          !this.fragmentContext ||
          this.treeAdapter.getNamespaceURI(this.fragmentContext) !== B.HTML
        )
      )
        switch (this.fragmentContextID) {
          case H.TITLE:
          case H.TEXTAREA:
            this.tokenizer.state = kn.RCDATA;
            break;
          case H.STYLE:
          case H.XMP:
          case H.IFRAME:
          case H.NOEMBED:
          case H.NOFRAMES:
          case H.NOSCRIPT:
            this.tokenizer.state = kn.RAWTEXT;
            break;
          case H.SCRIPT:
            this.tokenizer.state = kn.SCRIPT_DATA;
            break;
          case H.PLAINTEXT:
            this.tokenizer.state = kn.PLAINTEXT;
            break;
          default:
        }
    }
    _setDocumentType(e) {
      let t = e.name || ``,
        n = e.publicId || ``,
        r = e.systemId || ``;
      if (
        (this.treeAdapter.setDocumentType(this.document, t, n, r), e.location)
      ) {
        let t = this.treeAdapter
          .getChildNodes(this.document)
          .find((e) => this.treeAdapter.isDocumentTypeNode(e));
        t && this.treeAdapter.setNodeSourceCodeLocation(t, e.location);
      }
    }
    _attachElementToTree(e, t) {
      if (this.options.sourceCodeLocationInfo) {
        let n = t && { ...t, startTag: t };
        this.treeAdapter.setNodeSourceCodeLocation(e, n);
      }
      if (this._shouldFosterParentOnInsertion()) this._fosterParentElement(e);
      else {
        let t = this.openElements.currentTmplContentOrNode;
        this.treeAdapter.appendChild(t ?? this.document, e);
      }
    }
    _appendElement(e, t) {
      let n = this.treeAdapter.createElement(e.tagName, t, e.attrs);
      this._attachElementToTree(n, e.location);
    }
    _insertElement(e, t) {
      let n = this.treeAdapter.createElement(e.tagName, t, e.attrs);
      (this._attachElementToTree(n, e.location),
        this.openElements.push(n, e.tagID));
    }
    _insertFakeElement(e, t) {
      let n = this.treeAdapter.createElement(e, B.HTML, []);
      (this._attachElementToTree(n, null), this.openElements.push(n, t));
    }
    _insertTemplate(e) {
      let t = this.treeAdapter.createElement(e.tagName, B.HTML, e.attrs),
        n = this.treeAdapter.createDocumentFragment();
      (this.treeAdapter.setTemplateContent(t, n),
        this._attachElementToTree(t, e.location),
        this.openElements.push(t, e.tagID),
        this.options.sourceCodeLocationInfo &&
          this.treeAdapter.setNodeSourceCodeLocation(n, null));
    }
    _insertFakeRootElement() {
      let e = this.treeAdapter.createElement(V.HTML, B.HTML, []);
      (this.options.sourceCodeLocationInfo &&
        this.treeAdapter.setNodeSourceCodeLocation(e, null),
        this.treeAdapter.appendChild(this.openElements.current, e),
        this.openElements.push(e, H.HTML));
    }
    _appendCommentNode(e, t) {
      let n = this.treeAdapter.createCommentNode(e.data);
      (this.treeAdapter.appendChild(t, n),
        this.options.sourceCodeLocationInfo &&
          this.treeAdapter.setNodeSourceCodeLocation(n, e.location));
    }
    _insertCharacters(e) {
      let t, n;
      if (
        (this._shouldFosterParentOnInsertion()
          ? (({ parent: t, beforeElement: n } =
              this._findFosterParentingLocation()),
            n
              ? this.treeAdapter.insertTextBefore(t, e.chars, n)
              : this.treeAdapter.insertText(t, e.chars))
          : ((t = this.openElements.currentTmplContentOrNode),
            this.treeAdapter.insertText(t, e.chars)),
        !e.location)
      )
        return;
      let r = this.treeAdapter.getChildNodes(t),
        i = r[(n ? r.lastIndexOf(n) : r.length) - 1];
      if (this.treeAdapter.getNodeSourceCodeLocation(i)) {
        let { endLine: t, endCol: n, endOffset: r } = e.location;
        this.treeAdapter.updateNodeSourceCodeLocation(i, {
          endLine: t,
          endCol: n,
          endOffset: r,
        });
      } else
        this.options.sourceCodeLocationInfo &&
          this.treeAdapter.setNodeSourceCodeLocation(i, e.location);
    }
    _adoptNodes(e, t) {
      for (
        let n = this.treeAdapter.getFirstChild(e);
        n;
        n = this.treeAdapter.getFirstChild(e)
      )
        (this.treeAdapter.detachNode(n), this.treeAdapter.appendChild(t, n));
    }
    _setEndLocation(e, t) {
      if (this.treeAdapter.getNodeSourceCodeLocation(e) && t.location) {
        let n = t.location,
          r = this.treeAdapter.getTagName(e),
          i =
            t.type === z.END_TAG && r === t.tagName
              ? {
                  endTag: { ...n },
                  endLine: n.endLine,
                  endCol: n.endCol,
                  endOffset: n.endOffset,
                }
              : {
                  endLine: n.startLine,
                  endCol: n.startCol,
                  endOffset: n.startOffset,
                };
        this.treeAdapter.updateNodeSourceCodeLocation(e, i);
      }
    }
    shouldProcessStartTagTokenInForeignContent(e) {
      if (!this.currentNotInHTML) return !1;
      let t, n;
      return (
        this.openElements.stackTop === 0 && this.fragmentContext
          ? ((t = this.fragmentContext), (n = this.fragmentContextID))
          : ({ current: t, currentTagId: n } = this.openElements),
        e.tagID === H.SVG &&
        this.treeAdapter.getTagName(t) === V.ANNOTATION_XML &&
        this.treeAdapter.getNamespaceURI(t) === B.MATHML
          ? !1
          : this.tokenizer.inForeignNode ||
            ((e.tagID === H.MGLYPH || e.tagID === H.MALIGNMARK) &&
              n !== void 0 &&
              !this._isIntegrationPoint(n, t, B.HTML))
      );
    }
    _processToken(e) {
      switch (e.type) {
        case z.CHARACTER:
          this.onCharacter(e);
          break;
        case z.NULL_CHARACTER:
          this.onNullCharacter(e);
          break;
        case z.COMMENT:
          this.onComment(e);
          break;
        case z.DOCTYPE:
          this.onDoctype(e);
          break;
        case z.START_TAG:
          this._processStartTag(e);
          break;
        case z.END_TAG:
          this.onEndTag(e);
          break;
        case z.EOF:
          this.onEof(e);
          break;
        case z.WHITESPACE_CHARACTER:
          this.onWhitespaceCharacter(e);
          break;
      }
    }
    _isIntegrationPoint(e, t, n) {
      return Or(
        e,
        this.treeAdapter.getNamespaceURI(t),
        this.treeAdapter.getAttrList(t),
        n,
      );
    }
    _reconstructActiveFormattingElements() {
      let e = this.activeFormattingElements.entries.length;
      if (e) {
        let t = this.activeFormattingElements.entries.findIndex(
            (e) =>
              e.type === $n.Marker || this.openElements.contains(e.element),
          ),
          n = t === -1 ? e - 1 : t - 1;
        for (let e = n; e >= 0; e--) {
          let t = this.activeFormattingElements.entries[e];
          (this._insertElement(
            t.token,
            this.treeAdapter.getNamespaceURI(t.element),
          ),
            (t.element = this.openElements.current));
        }
      }
    }
    _closeTableCell() {
      (this.openElements.generateImpliedEndTags(),
        this.openElements.popUntilTableCellPopped(),
        this.activeFormattingElements.clearToLastMarker(),
        (this.insertionMode = G.IN_ROW));
    }
    _closePElement() {
      (this.openElements.generateImpliedEndTagsWithExclusion(H.P),
        this.openElements.popUntilTagNamePopped(H.P));
    }
    _resetInsertionMode() {
      for (let e = this.openElements.stackTop; e >= 0; e--)
        switch (
          e === 0 && this.fragmentContext
            ? this.fragmentContextID
            : this.openElements.tagIDs[e]
        ) {
          case H.TR:
            this.insertionMode = G.IN_ROW;
            return;
          case H.TBODY:
          case H.THEAD:
          case H.TFOOT:
            this.insertionMode = G.IN_TABLE_BODY;
            return;
          case H.CAPTION:
            this.insertionMode = G.IN_CAPTION;
            return;
          case H.COLGROUP:
            this.insertionMode = G.IN_COLUMN_GROUP;
            return;
          case H.TABLE:
            this.insertionMode = G.IN_TABLE;
            return;
          case H.BODY:
            this.insertionMode = G.IN_BODY;
            return;
          case H.FRAMESET:
            this.insertionMode = G.IN_FRAMESET;
            return;
          case H.SELECT:
            this._resetInsertionModeForSelect(e);
            return;
          case H.TEMPLATE:
            this.insertionMode = this.tmplInsertionModeStack[0];
            return;
          case H.HTML:
            this.insertionMode = this.headElement
              ? G.AFTER_HEAD
              : G.BEFORE_HEAD;
            return;
          case H.TD:
          case H.TH:
            if (e > 0) {
              this.insertionMode = G.IN_CELL;
              return;
            }
            break;
          case H.HEAD:
            if (e > 0) {
              this.insertionMode = G.IN_HEAD;
              return;
            }
            break;
        }
      this.insertionMode = G.IN_BODY;
    }
    _resetInsertionModeForSelect(e) {
      if (e > 0)
        for (let t = e - 1; t > 0; t--) {
          let e = this.openElements.tagIDs[t];
          if (e === H.TEMPLATE) break;
          if (e === H.TABLE) {
            this.insertionMode = G.IN_SELECT_IN_TABLE;
            return;
          }
        }
      this.insertionMode = G.IN_SELECT;
    }
    _isElementCausesFosterParenting(e) {
      return Nr.has(e);
    }
    _shouldFosterParentOnInsertion() {
      return (
        this.fosterParentingEnabled &&
        this.openElements.currentTagId !== void 0 &&
        this._isElementCausesFosterParenting(this.openElements.currentTagId)
      );
    }
    _findFosterParentingLocation() {
      for (let e = this.openElements.stackTop; e >= 0; e--) {
        let t = this.openElements.items[e];
        switch (this.openElements.tagIDs[e]) {
          case H.TEMPLATE:
            if (this.treeAdapter.getNamespaceURI(t) === B.HTML)
              return {
                parent: this.treeAdapter.getTemplateContent(t),
                beforeElement: null,
              };
            break;
          case H.TABLE: {
            let n = this.treeAdapter.getParentNode(t);
            return n
              ? { parent: n, beforeElement: t }
              : { parent: this.openElements.items[e - 1], beforeElement: null };
          }
          default:
        }
      }
      return { parent: this.openElements.items[0], beforeElement: null };
    }
    _fosterParentElement(e) {
      let t = this._findFosterParentingLocation();
      t.beforeElement
        ? this.treeAdapter.insertBefore(t.parent, e, t.beforeElement)
        : this.treeAdapter.appendChild(t.parent, e);
    }
    _isSpecialElement(e, t) {
      return Dn[this.treeAdapter.getNamespaceURI(e)].has(t);
    }
    onCharacter(e) {
      if (((this.skipNextNewLine = !1), this.tokenizer.inForeignNode)) {
        $a(this, e);
        return;
      }
      switch (this.insertionMode) {
        case G.INITIAL:
          Jr(this, e);
          break;
        case G.BEFORE_HTML:
          Zr(this, e);
          break;
        case G.BEFORE_HEAD:
          ei(this, e);
          break;
        case G.IN_HEAD:
          ii(this, e);
          break;
        case G.IN_HEAD_NO_SCRIPT:
          si(this, e);
          break;
        case G.AFTER_HEAD:
          ui(this, e);
          break;
        case G.IN_BODY:
        case G.IN_CAPTION:
        case G.IN_CELL:
        case G.IN_TEMPLATE:
          pi(this, e);
          break;
        case G.TEXT:
        case G.IN_SELECT:
        case G.IN_SELECT_IN_TABLE:
          this._insertCharacters(e);
          break;
        case G.IN_TABLE:
        case G.IN_TABLE_BODY:
        case G.IN_ROW:
          ca(this, e);
          break;
        case G.IN_TABLE_TEXT:
          xa(this, e);
          break;
        case G.IN_COLUMN_GROUP:
          Oa(this, e);
          break;
        case G.AFTER_BODY:
          Wa(this, e);
          break;
        case G.AFTER_AFTER_BODY:
          Xa(this, e);
          break;
        default:
      }
    }
    onNullCharacter(e) {
      if (((this.skipNextNewLine = !1), this.tokenizer.inForeignNode)) {
        Qa(this, e);
        return;
      }
      switch (this.insertionMode) {
        case G.INITIAL:
          Jr(this, e);
          break;
        case G.BEFORE_HTML:
          Zr(this, e);
          break;
        case G.BEFORE_HEAD:
          ei(this, e);
          break;
        case G.IN_HEAD:
          ii(this, e);
          break;
        case G.IN_HEAD_NO_SCRIPT:
          si(this, e);
          break;
        case G.AFTER_HEAD:
          ui(this, e);
          break;
        case G.TEXT:
          this._insertCharacters(e);
          break;
        case G.IN_TABLE:
        case G.IN_TABLE_BODY:
        case G.IN_ROW:
          ca(this, e);
          break;
        case G.IN_COLUMN_GROUP:
          Oa(this, e);
          break;
        case G.AFTER_BODY:
          Wa(this, e);
          break;
        case G.AFTER_AFTER_BODY:
          Xa(this, e);
          break;
        default:
      }
    }
    onComment(e) {
      if (((this.skipNextNewLine = !1), this.currentNotInHTML)) {
        Ur(this, e);
        return;
      }
      switch (this.insertionMode) {
        case G.INITIAL:
        case G.BEFORE_HTML:
        case G.BEFORE_HEAD:
        case G.IN_HEAD:
        case G.IN_HEAD_NO_SCRIPT:
        case G.AFTER_HEAD:
        case G.IN_BODY:
        case G.IN_TABLE:
        case G.IN_CAPTION:
        case G.IN_COLUMN_GROUP:
        case G.IN_TABLE_BODY:
        case G.IN_ROW:
        case G.IN_CELL:
        case G.IN_SELECT:
        case G.IN_SELECT_IN_TABLE:
        case G.IN_TEMPLATE:
        case G.IN_FRAMESET:
        case G.AFTER_FRAMESET:
          Ur(this, e);
          break;
        case G.IN_TABLE_TEXT:
          Sa(this, e);
          break;
        case G.AFTER_BODY:
          Wr(this, e);
          break;
        case G.AFTER_AFTER_BODY:
        case G.AFTER_AFTER_FRAMESET:
          Gr(this, e);
          break;
        default:
      }
    }
    onDoctype(e) {
      switch (((this.skipNextNewLine = !1), this.insertionMode)) {
        case G.INITIAL:
          qr(this, e);
          break;
        case G.BEFORE_HEAD:
        case G.IN_HEAD:
        case G.IN_HEAD_NO_SCRIPT:
        case G.AFTER_HEAD:
          this._err(e, R.misplacedDoctype);
          break;
        case G.IN_TABLE_TEXT:
          Sa(this, e);
          break;
        default:
      }
    }
    onStartTag(e) {
      ((this.skipNextNewLine = !1),
        (this.currentToken = e),
        this._processStartTag(e),
        e.selfClosing &&
          !e.ackSelfClosing &&
          this._err(e, R.nonVoidHtmlElementStartTagWithTrailingSolidus));
    }
    _processStartTag(e) {
      this.shouldProcessStartTagTokenInForeignContent(e)
        ? to(this, e)
        : this._startTagOutsideForeignContent(e);
    }
    _startTagOutsideForeignContent(e) {
      switch (this.insertionMode) {
        case G.INITIAL:
          Jr(this, e);
          break;
        case G.BEFORE_HTML:
          Yr(this, e);
          break;
        case G.BEFORE_HEAD:
          Qr(this, e);
          break;
        case G.IN_HEAD:
          ti(this, e);
          break;
        case G.IN_HEAD_NO_SCRIPT:
          ai(this, e);
          break;
        case G.AFTER_HEAD:
          ci(this, e);
          break;
        case G.IN_BODY:
          Ki(this, e);
          break;
        case G.IN_TABLE:
          _a(this, e);
          break;
        case G.IN_TABLE_TEXT:
          Sa(this, e);
          break;
        case G.IN_CAPTION:
          wa(this, e);
          break;
        case G.IN_COLUMN_GROUP:
          Ea(this, e);
          break;
        case G.IN_TABLE_BODY:
          ka(this, e);
          break;
        case G.IN_ROW:
          ja(this, e);
          break;
        case G.IN_CELL:
          Na(this, e);
          break;
        case G.IN_SELECT:
          Fa(this, e);
          break;
        case G.IN_SELECT_IN_TABLE:
          La(this, e);
          break;
        case G.IN_TEMPLATE:
          za(this, e);
          break;
        case G.AFTER_BODY:
          Ha(this, e);
          break;
        case G.IN_FRAMESET:
          Ga(this, e);
          break;
        case G.AFTER_FRAMESET:
          qa(this, e);
          break;
        case G.AFTER_AFTER_BODY:
          Ya(this, e);
          break;
        case G.AFTER_AFTER_FRAMESET:
          Za(this, e);
          break;
        default:
      }
    }
    onEndTag(e) {
      ((this.skipNextNewLine = !1),
        (this.currentToken = e),
        this.currentNotInHTML
          ? no(this, e)
          : this._endTagOutsideForeignContent(e));
    }
    _endTagOutsideForeignContent(e) {
      switch (this.insertionMode) {
        case G.INITIAL:
          Jr(this, e);
          break;
        case G.BEFORE_HTML:
          Xr(this, e);
          break;
        case G.BEFORE_HEAD:
          $r(this, e);
          break;
        case G.IN_HEAD:
          ni(this, e);
          break;
        case G.IN_HEAD_NO_SCRIPT:
          oi(this, e);
          break;
        case G.AFTER_HEAD:
          li(this, e);
          break;
        case G.IN_BODY:
          ia(this, e);
          break;
        case G.TEXT:
          oa(this, e);
          break;
        case G.IN_TABLE:
          va(this, e);
          break;
        case G.IN_TABLE_TEXT:
          Sa(this, e);
          break;
        case G.IN_CAPTION:
          Ta(this, e);
          break;
        case G.IN_COLUMN_GROUP:
          Da(this, e);
          break;
        case G.IN_TABLE_BODY:
          Aa(this, e);
          break;
        case G.IN_ROW:
          Ma(this, e);
          break;
        case G.IN_CELL:
          Pa(this, e);
          break;
        case G.IN_SELECT:
          Ia(this, e);
          break;
        case G.IN_SELECT_IN_TABLE:
          Ra(this, e);
          break;
        case G.IN_TEMPLATE:
          Ba(this, e);
          break;
        case G.AFTER_BODY:
          Ua(this, e);
          break;
        case G.IN_FRAMESET:
          Ka(this, e);
          break;
        case G.AFTER_FRAMESET:
          Ja(this, e);
          break;
        case G.AFTER_AFTER_BODY:
          Xa(this, e);
          break;
        default:
      }
    }
    onEof(e) {
      switch (this.insertionMode) {
        case G.INITIAL:
          Jr(this, e);
          break;
        case G.BEFORE_HTML:
          Zr(this, e);
          break;
        case G.BEFORE_HEAD:
          ei(this, e);
          break;
        case G.IN_HEAD:
          ii(this, e);
          break;
        case G.IN_HEAD_NO_SCRIPT:
          si(this, e);
          break;
        case G.AFTER_HEAD:
          ui(this, e);
          break;
        case G.IN_BODY:
        case G.IN_TABLE:
        case G.IN_CAPTION:
        case G.IN_COLUMN_GROUP:
        case G.IN_TABLE_BODY:
        case G.IN_ROW:
        case G.IN_CELL:
        case G.IN_SELECT:
        case G.IN_SELECT_IN_TABLE:
          aa(this, e);
          break;
        case G.TEXT:
          sa(this, e);
          break;
        case G.IN_TABLE_TEXT:
          Sa(this, e);
          break;
        case G.IN_TEMPLATE:
          Va(this, e);
          break;
        case G.AFTER_BODY:
        case G.IN_FRAMESET:
        case G.AFTER_FRAMESET:
        case G.AFTER_AFTER_BODY:
        case G.AFTER_AFTER_FRAMESET:
          Kr(this, e);
          break;
        default:
      }
    }
    onWhitespaceCharacter(e) {
      if (
        this.skipNextNewLine &&
        ((this.skipNextNewLine = !1), e.chars.charCodeAt(0) === L.LINE_FEED)
      ) {
        if (e.chars.length === 1) return;
        e.chars = e.chars.substr(1);
      }
      if (this.tokenizer.inForeignNode) {
        this._insertCharacters(e);
        return;
      }
      switch (this.insertionMode) {
        case G.IN_HEAD:
        case G.IN_HEAD_NO_SCRIPT:
        case G.AFTER_HEAD:
        case G.TEXT:
        case G.IN_COLUMN_GROUP:
        case G.IN_SELECT:
        case G.IN_SELECT_IN_TABLE:
        case G.IN_FRAMESET:
        case G.AFTER_FRAMESET:
          this._insertCharacters(e);
          break;
        case G.IN_BODY:
        case G.IN_CAPTION:
        case G.IN_CELL:
        case G.IN_TEMPLATE:
        case G.AFTER_BODY:
        case G.AFTER_AFTER_BODY:
        case G.AFTER_AFTER_FRAMESET:
          fi(this, e);
          break;
        case G.IN_TABLE:
        case G.IN_TABLE_BODY:
        case G.IN_ROW:
          ca(this, e);
          break;
        case G.IN_TABLE_TEXT:
          ba(this, e);
          break;
        default:
      }
    }
  };
function Ir(e, t) {
  let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(
    t.tagName,
  );
  return (
    n
      ? e.openElements.contains(n.element)
        ? e.openElements.hasInScope(t.tagID) || (n = null)
        : (e.activeFormattingElements.removeEntry(n), (n = null))
      : ra(e, t),
    n
  );
}
function Lr(e, t) {
  let n = null,
    r = e.openElements.stackTop;
  for (; r >= 0; r--) {
    let i = e.openElements.items[r];
    if (i === t.element) break;
    e._isSpecialElement(i, e.openElements.tagIDs[r]) && (n = i);
  }
  return (
    n ||
      (e.openElements.shortenToLength(Math.max(r, 0)),
      e.activeFormattingElements.removeEntry(t)),
    n
  );
}
function Rr(e, t, n) {
  let r = t,
    i = e.openElements.getCommonAncestor(t);
  for (let a = 0, o = i; o !== n; a++, o = i) {
    i = e.openElements.getCommonAncestor(o);
    let n = e.activeFormattingElements.getElementEntry(o),
      s = n && a >= jr;
    !n || s
      ? (s && e.activeFormattingElements.removeEntry(n),
        e.openElements.remove(o))
      : ((o = zr(e, n)),
        r === t && (e.activeFormattingElements.bookmark = n),
        e.treeAdapter.detachNode(r),
        e.treeAdapter.appendChild(o, r),
        (r = o));
  }
  return r;
}
function zr(e, t) {
  let n = e.treeAdapter.getNamespaceURI(t.element),
    r = e.treeAdapter.createElement(t.token.tagName, n, t.token.attrs);
  return (e.openElements.replace(t.element, r), (t.element = r), r);
}
function Br(e, t, n) {
  let r = En(e.treeAdapter.getTagName(t));
  if (e._isElementCausesFosterParenting(r)) e._fosterParentElement(n);
  else {
    let i = e.treeAdapter.getNamespaceURI(t);
    (r === H.TEMPLATE &&
      i === B.HTML &&
      (t = e.treeAdapter.getTemplateContent(t)),
      e.treeAdapter.appendChild(t, n));
  }
}
function Vr(e, t, n) {
  let r = e.treeAdapter.getNamespaceURI(n.element),
    { token: i } = n,
    a = e.treeAdapter.createElement(i.tagName, r, i.attrs);
  (e._adoptNodes(t, a),
    e.treeAdapter.appendChild(t, a),
    e.activeFormattingElements.insertElementAfterBookmark(a, i),
    e.activeFormattingElements.removeEntry(n),
    e.openElements.remove(n.element),
    e.openElements.insertAfter(t, a, i.tagID));
}
function Hr(e, t) {
  for (let n = 0; n < Ar; n++) {
    let n = Ir(e, t);
    if (!n) break;
    let r = Lr(e, n);
    if (!r) break;
    e.activeFormattingElements.bookmark = n;
    let i = Rr(e, r, n.element),
      a = e.openElements.getCommonAncestor(n.element);
    (e.treeAdapter.detachNode(i), a && Br(e, a, i), Vr(e, r, n));
  }
}
function Ur(e, t) {
  e._appendCommentNode(t, e.openElements.currentTmplContentOrNode);
}
function Wr(e, t) {
  e._appendCommentNode(t, e.openElements.items[0]);
}
function Gr(e, t) {
  e._appendCommentNode(t, e.document);
}
function Kr(e, t) {
  if (((e.stopped = !0), t.location)) {
    let n = e.fragmentContext ? 0 : 2;
    for (let r = e.openElements.stackTop; r >= n; r--)
      e._setEndLocation(e.openElements.items[r], t);
    if (!e.fragmentContext && e.openElements.stackTop >= 0) {
      let n = e.openElements.items[0],
        r = e.treeAdapter.getNodeSourceCodeLocation(n);
      if (
        r &&
        !r.endTag &&
        (e._setEndLocation(n, t), e.openElements.stackTop >= 1)
      ) {
        let n = e.openElements.items[1],
          r = e.treeAdapter.getNodeSourceCodeLocation(n);
        r && !r.endTag && e._setEndLocation(n, t);
      }
    }
  }
}
function qr(e, t) {
  e._setDocumentType(t);
  let n = t.forceQuirks ? wn.QUIRKS : pr(t);
  (fr(t) || e._err(t, R.nonConformingDoctype),
    e.treeAdapter.setDocumentMode(e.document, n),
    (e.insertionMode = G.BEFORE_HTML));
}
function Jr(e, t) {
  (e._err(t, R.missingDoctype, !0),
    e.treeAdapter.setDocumentMode(e.document, wn.QUIRKS),
    (e.insertionMode = G.BEFORE_HTML),
    e._processToken(t));
}
function Yr(e, t) {
  t.tagID === H.HTML
    ? (e._insertElement(t, B.HTML), (e.insertionMode = G.BEFORE_HEAD))
    : Zr(e, t);
}
function Xr(e, t) {
  let n = t.tagID;
  (n === H.HTML || n === H.HEAD || n === H.BODY || n === H.BR) && Zr(e, t);
}
function Zr(e, t) {
  (e._insertFakeRootElement(),
    (e.insertionMode = G.BEFORE_HEAD),
    e._processToken(t));
}
function Qr(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.HEAD:
      (e._insertElement(t, B.HTML),
        (e.headElement = e.openElements.current),
        (e.insertionMode = G.IN_HEAD));
      break;
    default:
      ei(e, t);
  }
}
function $r(e, t) {
  let n = t.tagID;
  n === H.HEAD || n === H.BODY || n === H.HTML || n === H.BR
    ? ei(e, t)
    : e._err(t, R.endTagWithoutMatchingOpenElement);
}
function ei(e, t) {
  (e._insertFakeElement(V.HEAD, H.HEAD),
    (e.headElement = e.openElements.current),
    (e.insertionMode = G.IN_HEAD),
    e._processToken(t));
}
function ti(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.BASE:
    case H.BASEFONT:
    case H.BGSOUND:
    case H.LINK:
    case H.META:
      (e._appendElement(t, B.HTML), (t.ackSelfClosing = !0));
      break;
    case H.TITLE:
      e._switchToTextParsing(t, kn.RCDATA);
      break;
    case H.NOSCRIPT:
      e.options.scriptingEnabled
        ? e._switchToTextParsing(t, kn.RAWTEXT)
        : (e._insertElement(t, B.HTML),
          (e.insertionMode = G.IN_HEAD_NO_SCRIPT));
      break;
    case H.NOFRAMES:
    case H.STYLE:
      e._switchToTextParsing(t, kn.RAWTEXT);
      break;
    case H.SCRIPT:
      e._switchToTextParsing(t, kn.SCRIPT_DATA);
      break;
    case H.TEMPLATE:
      (e._insertTemplate(t),
        e.activeFormattingElements.insertMarker(),
        (e.framesetOk = !1),
        (e.insertionMode = G.IN_TEMPLATE),
        e.tmplInsertionModeStack.unshift(G.IN_TEMPLATE));
      break;
    case H.HEAD:
      e._err(t, R.misplacedStartTagForHeadElement);
      break;
    default:
      ii(e, t);
  }
}
function ni(e, t) {
  switch (t.tagID) {
    case H.HEAD:
      (e.openElements.pop(), (e.insertionMode = G.AFTER_HEAD));
      break;
    case H.BODY:
    case H.BR:
    case H.HTML:
      ii(e, t);
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    default:
      e._err(t, R.endTagWithoutMatchingOpenElement);
  }
}
function ri(e, t) {
  e.openElements.tmplCount > 0
    ? (e.openElements.generateImpliedEndTagsThoroughly(),
      e.openElements.currentTagId !== H.TEMPLATE &&
        e._err(t, R.closingOfElementWithOpenChildElements),
      e.openElements.popUntilTagNamePopped(H.TEMPLATE),
      e.activeFormattingElements.clearToLastMarker(),
      e.tmplInsertionModeStack.shift(),
      e._resetInsertionMode())
    : e._err(t, R.endTagWithoutMatchingOpenElement);
}
function ii(e, t) {
  (e.openElements.pop(), (e.insertionMode = G.AFTER_HEAD), e._processToken(t));
}
function ai(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.BASEFONT:
    case H.BGSOUND:
    case H.HEAD:
    case H.LINK:
    case H.META:
    case H.NOFRAMES:
    case H.STYLE:
      ti(e, t);
      break;
    case H.NOSCRIPT:
      e._err(t, R.nestedNoscriptInHead);
      break;
    default:
      si(e, t);
  }
}
function oi(e, t) {
  switch (t.tagID) {
    case H.NOSCRIPT:
      (e.openElements.pop(), (e.insertionMode = G.IN_HEAD));
      break;
    case H.BR:
      si(e, t);
      break;
    default:
      e._err(t, R.endTagWithoutMatchingOpenElement);
  }
}
function si(e, t) {
  let n =
    t.type === z.EOF
      ? R.openElementsLeftAfterEof
      : R.disallowedContentInNoscriptInHead;
  (e._err(t, n),
    e.openElements.pop(),
    (e.insertionMode = G.IN_HEAD),
    e._processToken(t));
}
function ci(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.BODY:
      (e._insertElement(t, B.HTML),
        (e.framesetOk = !1),
        (e.insertionMode = G.IN_BODY));
      break;
    case H.FRAMESET:
      (e._insertElement(t, B.HTML), (e.insertionMode = G.IN_FRAMESET));
      break;
    case H.BASE:
    case H.BASEFONT:
    case H.BGSOUND:
    case H.LINK:
    case H.META:
    case H.NOFRAMES:
    case H.SCRIPT:
    case H.STYLE:
    case H.TEMPLATE:
    case H.TITLE:
      (e._err(t, R.abandonedHeadElementChild),
        e.openElements.push(e.headElement, H.HEAD),
        ti(e, t),
        e.openElements.remove(e.headElement));
      break;
    case H.HEAD:
      e._err(t, R.misplacedStartTagForHeadElement);
      break;
    default:
      ui(e, t);
  }
}
function li(e, t) {
  switch (t.tagID) {
    case H.BODY:
    case H.HTML:
    case H.BR:
      ui(e, t);
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    default:
      e._err(t, R.endTagWithoutMatchingOpenElement);
  }
}
function ui(e, t) {
  (e._insertFakeElement(V.BODY, H.BODY),
    (e.insertionMode = G.IN_BODY),
    di(e, t));
}
function di(e, t) {
  switch (t.type) {
    case z.CHARACTER:
      pi(e, t);
      break;
    case z.WHITESPACE_CHARACTER:
      fi(e, t);
      break;
    case z.COMMENT:
      Ur(e, t);
      break;
    case z.START_TAG:
      Ki(e, t);
      break;
    case z.END_TAG:
      ia(e, t);
      break;
    case z.EOF:
      aa(e, t);
      break;
    default:
  }
}
function fi(e, t) {
  (e._reconstructActiveFormattingElements(), e._insertCharacters(t));
}
function pi(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._insertCharacters(t),
    (e.framesetOk = !1));
}
function mi(e, t) {
  e.openElements.tmplCount === 0 &&
    e.treeAdapter.adoptAttributes(e.openElements.items[0], t.attrs);
}
function hi(e, t) {
  let n = e.openElements.tryPeekProperlyNestedBodyElement();
  n &&
    e.openElements.tmplCount === 0 &&
    ((e.framesetOk = !1), e.treeAdapter.adoptAttributes(n, t.attrs));
}
function gi(e, t) {
  let n = e.openElements.tryPeekProperlyNestedBodyElement();
  e.framesetOk &&
    n &&
    (e.treeAdapter.detachNode(n),
    e.openElements.popAllUpToHtmlElement(),
    e._insertElement(t, B.HTML),
    (e.insertionMode = G.IN_FRAMESET));
}
function _i(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._insertElement(t, B.HTML));
}
function vi(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e.openElements.currentTagId !== void 0 &&
      On.has(e.openElements.currentTagId) &&
      e.openElements.pop(),
    e._insertElement(t, B.HTML));
}
function yi(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._insertElement(t, B.HTML),
    (e.skipNextNewLine = !0),
    (e.framesetOk = !1));
}
function bi(e, t) {
  let n = e.openElements.tmplCount > 0;
  (!e.formElement || n) &&
    (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._insertElement(t, B.HTML),
    n || (e.formElement = e.openElements.current));
}
function xi(e, t) {
  e.framesetOk = !1;
  let n = t.tagID;
  for (let t = e.openElements.stackTop; t >= 0; t--) {
    let r = e.openElements.tagIDs[t];
    if (
      (n === H.LI && r === H.LI) ||
      ((n === H.DD || n === H.DT) && (r === H.DD || r === H.DT))
    ) {
      (e.openElements.generateImpliedEndTagsWithExclusion(r),
        e.openElements.popUntilTagNamePopped(r));
      break;
    }
    if (
      r !== H.ADDRESS &&
      r !== H.DIV &&
      r !== H.P &&
      e._isSpecialElement(e.openElements.items[t], r)
    )
      break;
  }
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._insertElement(t, B.HTML));
}
function Si(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._insertElement(t, B.HTML),
    (e.tokenizer.state = kn.PLAINTEXT));
}
function Ci(e, t) {
  (e.openElements.hasInScope(H.BUTTON) &&
    (e.openElements.generateImpliedEndTags(),
    e.openElements.popUntilTagNamePopped(H.BUTTON)),
    e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML),
    (e.framesetOk = !1));
}
function wi(e, t) {
  let n = e.activeFormattingElements.getElementEntryInScopeWithTagName(V.A);
  (n &&
    (Hr(e, t),
    e.openElements.remove(n.element),
    e.activeFormattingElements.removeEntry(n)),
    e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML),
    e.activeFormattingElements.pushElement(e.openElements.current, t));
}
function Ti(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML),
    e.activeFormattingElements.pushElement(e.openElements.current, t));
}
function Ei(e, t) {
  (e._reconstructActiveFormattingElements(),
    e.openElements.hasInScope(H.NOBR) &&
      (Hr(e, t), e._reconstructActiveFormattingElements()),
    e._insertElement(t, B.HTML),
    e.activeFormattingElements.pushElement(e.openElements.current, t));
}
function Di(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML),
    e.activeFormattingElements.insertMarker(),
    (e.framesetOk = !1));
}
function Oi(e, t) {
  (e.treeAdapter.getDocumentMode(e.document) !== wn.QUIRKS &&
    e.openElements.hasInButtonScope(H.P) &&
    e._closePElement(),
    e._insertElement(t, B.HTML),
    (e.framesetOk = !1),
    (e.insertionMode = G.IN_TABLE));
}
function ki(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._appendElement(t, B.HTML),
    (e.framesetOk = !1),
    (t.ackSelfClosing = !0));
}
function Ai(e) {
  let t = cn(e, Cn.TYPE);
  return t != null && t.toLowerCase() === kr;
}
function ji(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._appendElement(t, B.HTML),
    Ai(t) || (e.framesetOk = !1),
    (t.ackSelfClosing = !0));
}
function Mi(e, t) {
  (e._appendElement(t, B.HTML), (t.ackSelfClosing = !0));
}
function Ni(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._appendElement(t, B.HTML),
    (e.framesetOk = !1),
    (t.ackSelfClosing = !0));
}
function Pi(e, t) {
  ((t.tagName = V.IMG), (t.tagID = H.IMG), ki(e, t));
}
function Fi(e, t) {
  (e._insertElement(t, B.HTML),
    (e.skipNextNewLine = !0),
    (e.tokenizer.state = kn.RCDATA),
    (e.originalInsertionMode = e.insertionMode),
    (e.framesetOk = !1),
    (e.insertionMode = G.TEXT));
}
function Ii(e, t) {
  (e.openElements.hasInButtonScope(H.P) && e._closePElement(),
    e._reconstructActiveFormattingElements(),
    (e.framesetOk = !1),
    e._switchToTextParsing(t, kn.RAWTEXT));
}
function Li(e, t) {
  ((e.framesetOk = !1), e._switchToTextParsing(t, kn.RAWTEXT));
}
function Ri(e, t) {
  e._switchToTextParsing(t, kn.RAWTEXT);
}
function zi(e, t) {
  (e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML),
    (e.framesetOk = !1),
    (e.insertionMode =
      e.insertionMode === G.IN_TABLE ||
      e.insertionMode === G.IN_CAPTION ||
      e.insertionMode === G.IN_TABLE_BODY ||
      e.insertionMode === G.IN_ROW ||
      e.insertionMode === G.IN_CELL
        ? G.IN_SELECT_IN_TABLE
        : G.IN_SELECT));
}
function Bi(e, t) {
  (e.openElements.currentTagId === H.OPTION && e.openElements.pop(),
    e._reconstructActiveFormattingElements(),
    e._insertElement(t, B.HTML));
}
function Vi(e, t) {
  (e.openElements.hasInScope(H.RUBY) && e.openElements.generateImpliedEndTags(),
    e._insertElement(t, B.HTML));
}
function Hi(e, t) {
  (e.openElements.hasInScope(H.RUBY) &&
    e.openElements.generateImpliedEndTagsWithExclusion(H.RTC),
    e._insertElement(t, B.HTML));
}
function Ui(e, t) {
  (e._reconstructActiveFormattingElements(),
    Sr(t),
    wr(t),
    t.selfClosing
      ? e._appendElement(t, B.MATHML)
      : e._insertElement(t, B.MATHML),
    (t.ackSelfClosing = !0));
}
function Wi(e, t) {
  (e._reconstructActiveFormattingElements(),
    Cr(t),
    wr(t),
    t.selfClosing ? e._appendElement(t, B.SVG) : e._insertElement(t, B.SVG),
    (t.ackSelfClosing = !0));
}
function Gi(e, t) {
  (e._reconstructActiveFormattingElements(), e._insertElement(t, B.HTML));
}
function Ki(e, t) {
  switch (t.tagID) {
    case H.I:
    case H.S:
    case H.B:
    case H.U:
    case H.EM:
    case H.TT:
    case H.BIG:
    case H.CODE:
    case H.FONT:
    case H.SMALL:
    case H.STRIKE:
    case H.STRONG:
      Ti(e, t);
      break;
    case H.A:
      wi(e, t);
      break;
    case H.H1:
    case H.H2:
    case H.H3:
    case H.H4:
    case H.H5:
    case H.H6:
      vi(e, t);
      break;
    case H.P:
    case H.DL:
    case H.OL:
    case H.UL:
    case H.DIV:
    case H.DIR:
    case H.NAV:
    case H.MAIN:
    case H.MENU:
    case H.ASIDE:
    case H.CENTER:
    case H.FIGURE:
    case H.FOOTER:
    case H.HEADER:
    case H.HGROUP:
    case H.DIALOG:
    case H.DETAILS:
    case H.ADDRESS:
    case H.ARTICLE:
    case H.SEARCH:
    case H.SECTION:
    case H.SUMMARY:
    case H.FIELDSET:
    case H.BLOCKQUOTE:
    case H.FIGCAPTION:
      _i(e, t);
      break;
    case H.LI:
    case H.DD:
    case H.DT:
      xi(e, t);
      break;
    case H.BR:
    case H.IMG:
    case H.WBR:
    case H.AREA:
    case H.EMBED:
    case H.KEYGEN:
      ki(e, t);
      break;
    case H.HR:
      Ni(e, t);
      break;
    case H.RB:
    case H.RTC:
      Vi(e, t);
      break;
    case H.RT:
    case H.RP:
      Hi(e, t);
      break;
    case H.PRE:
    case H.LISTING:
      yi(e, t);
      break;
    case H.XMP:
      Ii(e, t);
      break;
    case H.SVG:
      Wi(e, t);
      break;
    case H.HTML:
      mi(e, t);
      break;
    case H.BASE:
    case H.LINK:
    case H.META:
    case H.STYLE:
    case H.TITLE:
    case H.SCRIPT:
    case H.BGSOUND:
    case H.BASEFONT:
    case H.TEMPLATE:
      ti(e, t);
      break;
    case H.BODY:
      hi(e, t);
      break;
    case H.FORM:
      bi(e, t);
      break;
    case H.NOBR:
      Ei(e, t);
      break;
    case H.MATH:
      Ui(e, t);
      break;
    case H.TABLE:
      Oi(e, t);
      break;
    case H.INPUT:
      ji(e, t);
      break;
    case H.PARAM:
    case H.TRACK:
    case H.SOURCE:
      Mi(e, t);
      break;
    case H.IMAGE:
      Pi(e, t);
      break;
    case H.BUTTON:
      Ci(e, t);
      break;
    case H.APPLET:
    case H.OBJECT:
    case H.MARQUEE:
      Di(e, t);
      break;
    case H.IFRAME:
      Li(e, t);
      break;
    case H.SELECT:
      zi(e, t);
      break;
    case H.OPTION:
    case H.OPTGROUP:
      Bi(e, t);
      break;
    case H.NOEMBED:
    case H.NOFRAMES:
      Ri(e, t);
      break;
    case H.FRAMESET:
      gi(e, t);
      break;
    case H.TEXTAREA:
      Fi(e, t);
      break;
    case H.NOSCRIPT:
      e.options.scriptingEnabled ? Ri(e, t) : Gi(e, t);
      break;
    case H.PLAINTEXT:
      Si(e, t);
      break;
    case H.COL:
    case H.TH:
    case H.TD:
    case H.TR:
    case H.HEAD:
    case H.FRAME:
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
    case H.CAPTION:
    case H.COLGROUP:
      break;
    default:
      Gi(e, t);
  }
}
function qi(e, t) {
  if (
    e.openElements.hasInScope(H.BODY) &&
    ((e.insertionMode = G.AFTER_BODY), e.options.sourceCodeLocationInfo)
  ) {
    let n = e.openElements.tryPeekProperlyNestedBodyElement();
    n && e._setEndLocation(n, t);
  }
}
function Ji(e, t) {
  e.openElements.hasInScope(H.BODY) &&
    ((e.insertionMode = G.AFTER_BODY), Ua(e, t));
}
function Yi(e, t) {
  let n = t.tagID;
  e.openElements.hasInScope(n) &&
    (e.openElements.generateImpliedEndTags(),
    e.openElements.popUntilTagNamePopped(n));
}
function Xi(e) {
  let t = e.openElements.tmplCount > 0,
    { formElement: n } = e;
  (t || (e.formElement = null),
    (n || t) &&
      e.openElements.hasInScope(H.FORM) &&
      (e.openElements.generateImpliedEndTags(),
      t
        ? e.openElements.popUntilTagNamePopped(H.FORM)
        : n && e.openElements.remove(n)));
}
function Zi(e) {
  (e.openElements.hasInButtonScope(H.P) || e._insertFakeElement(V.P, H.P),
    e._closePElement());
}
function Qi(e) {
  e.openElements.hasInListItemScope(H.LI) &&
    (e.openElements.generateImpliedEndTagsWithExclusion(H.LI),
    e.openElements.popUntilTagNamePopped(H.LI));
}
function $i(e, t) {
  let n = t.tagID;
  e.openElements.hasInScope(n) &&
    (e.openElements.generateImpliedEndTagsWithExclusion(n),
    e.openElements.popUntilTagNamePopped(n));
}
function ea(e) {
  e.openElements.hasNumberedHeaderInScope() &&
    (e.openElements.generateImpliedEndTags(),
    e.openElements.popUntilNumberedHeaderPopped());
}
function ta(e, t) {
  let n = t.tagID;
  e.openElements.hasInScope(n) &&
    (e.openElements.generateImpliedEndTags(),
    e.openElements.popUntilTagNamePopped(n),
    e.activeFormattingElements.clearToLastMarker());
}
function na(e) {
  (e._reconstructActiveFormattingElements(),
    e._insertFakeElement(V.BR, H.BR),
    e.openElements.pop(),
    (e.framesetOk = !1));
}
function ra(e, t) {
  let n = t.tagName,
    r = t.tagID;
  for (let t = e.openElements.stackTop; t > 0; t--) {
    let i = e.openElements.items[t],
      a = e.openElements.tagIDs[t];
    if (r === a && (r !== H.UNKNOWN || e.treeAdapter.getTagName(i) === n)) {
      (e.openElements.generateImpliedEndTagsWithExclusion(r),
        e.openElements.stackTop >= t && e.openElements.shortenToLength(t));
      break;
    }
    if (e._isSpecialElement(i, a)) break;
  }
}
function ia(e, t) {
  switch (t.tagID) {
    case H.A:
    case H.B:
    case H.I:
    case H.S:
    case H.U:
    case H.EM:
    case H.TT:
    case H.BIG:
    case H.CODE:
    case H.FONT:
    case H.NOBR:
    case H.SMALL:
    case H.STRIKE:
    case H.STRONG:
      Hr(e, t);
      break;
    case H.P:
      Zi(e);
      break;
    case H.DL:
    case H.UL:
    case H.OL:
    case H.DIR:
    case H.DIV:
    case H.NAV:
    case H.PRE:
    case H.MAIN:
    case H.MENU:
    case H.ASIDE:
    case H.BUTTON:
    case H.CENTER:
    case H.FIGURE:
    case H.FOOTER:
    case H.HEADER:
    case H.HGROUP:
    case H.DIALOG:
    case H.ADDRESS:
    case H.ARTICLE:
    case H.DETAILS:
    case H.SEARCH:
    case H.SECTION:
    case H.SUMMARY:
    case H.LISTING:
    case H.FIELDSET:
    case H.BLOCKQUOTE:
    case H.FIGCAPTION:
      Yi(e, t);
      break;
    case H.LI:
      Qi(e);
      break;
    case H.DD:
    case H.DT:
      $i(e, t);
      break;
    case H.H1:
    case H.H2:
    case H.H3:
    case H.H4:
    case H.H5:
    case H.H6:
      ea(e);
      break;
    case H.BR:
      na(e);
      break;
    case H.BODY:
      qi(e, t);
      break;
    case H.HTML:
      Ji(e, t);
      break;
    case H.FORM:
      Xi(e);
      break;
    case H.APPLET:
    case H.OBJECT:
    case H.MARQUEE:
      ta(e, t);
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    default:
      ra(e, t);
  }
}
function aa(e, t) {
  e.tmplInsertionModeStack.length > 0 ? Va(e, t) : Kr(e, t);
}
function oa(e, t) {
  var n;
  (t.tagID === H.SCRIPT &&
    ((n = e.scriptHandler) == null || n.call(e, e.openElements.current)),
    e.openElements.pop(),
    (e.insertionMode = e.originalInsertionMode));
}
function sa(e, t) {
  (e._err(t, R.eofInElementThatCanContainOnlyText),
    e.openElements.pop(),
    (e.insertionMode = e.originalInsertionMode),
    e.onEof(t));
}
function ca(e, t) {
  if (
    e.openElements.currentTagId !== void 0 &&
    Nr.has(e.openElements.currentTagId)
  )
    switch (
      ((e.pendingCharacterTokens.length = 0),
      (e.hasNonWhitespacePendingCharacterToken = !1),
      (e.originalInsertionMode = e.insertionMode),
      (e.insertionMode = G.IN_TABLE_TEXT),
      t.type)
    ) {
      case z.CHARACTER:
        xa(e, t);
        break;
      case z.WHITESPACE_CHARACTER:
        ba(e, t);
        break;
    }
  else ya(e, t);
}
function la(e, t) {
  (e.openElements.clearBackToTableContext(),
    e.activeFormattingElements.insertMarker(),
    e._insertElement(t, B.HTML),
    (e.insertionMode = G.IN_CAPTION));
}
function ua(e, t) {
  (e.openElements.clearBackToTableContext(),
    e._insertElement(t, B.HTML),
    (e.insertionMode = G.IN_COLUMN_GROUP));
}
function da(e, t) {
  (e.openElements.clearBackToTableContext(),
    e._insertFakeElement(V.COLGROUP, H.COLGROUP),
    (e.insertionMode = G.IN_COLUMN_GROUP),
    Ea(e, t));
}
function fa(e, t) {
  (e.openElements.clearBackToTableContext(),
    e._insertElement(t, B.HTML),
    (e.insertionMode = G.IN_TABLE_BODY));
}
function pa(e, t) {
  (e.openElements.clearBackToTableContext(),
    e._insertFakeElement(V.TBODY, H.TBODY),
    (e.insertionMode = G.IN_TABLE_BODY),
    ka(e, t));
}
function ma(e, t) {
  e.openElements.hasInTableScope(H.TABLE) &&
    (e.openElements.popUntilTagNamePopped(H.TABLE),
    e._resetInsertionMode(),
    e._processStartTag(t));
}
function ha(e, t) {
  (Ai(t) ? e._appendElement(t, B.HTML) : ya(e, t), (t.ackSelfClosing = !0));
}
function ga(e, t) {
  !e.formElement &&
    e.openElements.tmplCount === 0 &&
    (e._insertElement(t, B.HTML),
    (e.formElement = e.openElements.current),
    e.openElements.pop());
}
function _a(e, t) {
  switch (t.tagID) {
    case H.TD:
    case H.TH:
    case H.TR:
      pa(e, t);
      break;
    case H.STYLE:
    case H.SCRIPT:
    case H.TEMPLATE:
      ti(e, t);
      break;
    case H.COL:
      da(e, t);
      break;
    case H.FORM:
      ga(e, t);
      break;
    case H.TABLE:
      ma(e, t);
      break;
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
      fa(e, t);
      break;
    case H.INPUT:
      ha(e, t);
      break;
    case H.CAPTION:
      la(e, t);
      break;
    case H.COLGROUP:
      ua(e, t);
      break;
    default:
      ya(e, t);
  }
}
function va(e, t) {
  switch (t.tagID) {
    case H.TABLE:
      e.openElements.hasInTableScope(H.TABLE) &&
        (e.openElements.popUntilTagNamePopped(H.TABLE),
        e._resetInsertionMode());
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    case H.BODY:
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.HTML:
    case H.TBODY:
    case H.TD:
    case H.TFOOT:
    case H.TH:
    case H.THEAD:
    case H.TR:
      break;
    default:
      ya(e, t);
  }
}
function ya(e, t) {
  let n = e.fosterParentingEnabled;
  ((e.fosterParentingEnabled = !0), di(e, t), (e.fosterParentingEnabled = n));
}
function ba(e, t) {
  e.pendingCharacterTokens.push(t);
}
function xa(e, t) {
  (e.pendingCharacterTokens.push(t),
    (e.hasNonWhitespacePendingCharacterToken = !0));
}
function Sa(e, t) {
  let n = 0;
  if (e.hasNonWhitespacePendingCharacterToken)
    for (; n < e.pendingCharacterTokens.length; n++)
      ya(e, e.pendingCharacterTokens[n]);
  else
    for (; n < e.pendingCharacterTokens.length; n++)
      e._insertCharacters(e.pendingCharacterTokens[n]);
  ((e.insertionMode = e.originalInsertionMode), e._processToken(t));
}
var Ca = new Set([
  H.CAPTION,
  H.COL,
  H.COLGROUP,
  H.TBODY,
  H.TD,
  H.TFOOT,
  H.TH,
  H.THEAD,
  H.TR,
]);
function wa(e, t) {
  let n = t.tagID;
  Ca.has(n)
    ? e.openElements.hasInTableScope(H.CAPTION) &&
      (e.openElements.generateImpliedEndTags(),
      e.openElements.popUntilTagNamePopped(H.CAPTION),
      e.activeFormattingElements.clearToLastMarker(),
      (e.insertionMode = G.IN_TABLE),
      _a(e, t))
    : Ki(e, t);
}
function Ta(e, t) {
  let n = t.tagID;
  switch (n) {
    case H.CAPTION:
    case H.TABLE:
      e.openElements.hasInTableScope(H.CAPTION) &&
        (e.openElements.generateImpliedEndTags(),
        e.openElements.popUntilTagNamePopped(H.CAPTION),
        e.activeFormattingElements.clearToLastMarker(),
        (e.insertionMode = G.IN_TABLE),
        n === H.TABLE && va(e, t));
      break;
    case H.BODY:
    case H.COL:
    case H.COLGROUP:
    case H.HTML:
    case H.TBODY:
    case H.TD:
    case H.TFOOT:
    case H.TH:
    case H.THEAD:
    case H.TR:
      break;
    default:
      ia(e, t);
  }
}
function Ea(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.COL:
      (e._appendElement(t, B.HTML), (t.ackSelfClosing = !0));
      break;
    case H.TEMPLATE:
      ti(e, t);
      break;
    default:
      Oa(e, t);
  }
}
function Da(e, t) {
  switch (t.tagID) {
    case H.COLGROUP:
      e.openElements.currentTagId === H.COLGROUP &&
        (e.openElements.pop(), (e.insertionMode = G.IN_TABLE));
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    case H.COL:
      break;
    default:
      Oa(e, t);
  }
}
function Oa(e, t) {
  e.openElements.currentTagId === H.COLGROUP &&
    (e.openElements.pop(), (e.insertionMode = G.IN_TABLE), e._processToken(t));
}
function ka(e, t) {
  switch (t.tagID) {
    case H.TR:
      (e.openElements.clearBackToTableBodyContext(),
        e._insertElement(t, B.HTML),
        (e.insertionMode = G.IN_ROW));
      break;
    case H.TH:
    case H.TD:
      (e.openElements.clearBackToTableBodyContext(),
        e._insertFakeElement(V.TR, H.TR),
        (e.insertionMode = G.IN_ROW),
        ja(e, t));
      break;
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
      e.openElements.hasTableBodyContextInTableScope() &&
        (e.openElements.clearBackToTableBodyContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE),
        _a(e, t));
      break;
    default:
      _a(e, t);
  }
}
function Aa(e, t) {
  let n = t.tagID;
  switch (t.tagID) {
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
      e.openElements.hasInTableScope(n) &&
        (e.openElements.clearBackToTableBodyContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE));
      break;
    case H.TABLE:
      e.openElements.hasTableBodyContextInTableScope() &&
        (e.openElements.clearBackToTableBodyContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE),
        va(e, t));
      break;
    case H.BODY:
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.HTML:
    case H.TD:
    case H.TH:
    case H.TR:
      break;
    default:
      va(e, t);
  }
}
function ja(e, t) {
  switch (t.tagID) {
    case H.TH:
    case H.TD:
      (e.openElements.clearBackToTableRowContext(),
        e._insertElement(t, B.HTML),
        (e.insertionMode = G.IN_CELL),
        e.activeFormattingElements.insertMarker());
      break;
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
    case H.TR:
      e.openElements.hasInTableScope(H.TR) &&
        (e.openElements.clearBackToTableRowContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE_BODY),
        ka(e, t));
      break;
    default:
      _a(e, t);
  }
}
function Ma(e, t) {
  switch (t.tagID) {
    case H.TR:
      e.openElements.hasInTableScope(H.TR) &&
        (e.openElements.clearBackToTableRowContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE_BODY));
      break;
    case H.TABLE:
      e.openElements.hasInTableScope(H.TR) &&
        (e.openElements.clearBackToTableRowContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE_BODY),
        Aa(e, t));
      break;
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
      (e.openElements.hasInTableScope(t.tagID) ||
        e.openElements.hasInTableScope(H.TR)) &&
        (e.openElements.clearBackToTableRowContext(),
        e.openElements.pop(),
        (e.insertionMode = G.IN_TABLE_BODY),
        Aa(e, t));
      break;
    case H.BODY:
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.HTML:
    case H.TD:
    case H.TH:
      break;
    default:
      va(e, t);
  }
}
function Na(e, t) {
  let n = t.tagID;
  Ca.has(n)
    ? (e.openElements.hasInTableScope(H.TD) ||
        e.openElements.hasInTableScope(H.TH)) &&
      (e._closeTableCell(), ja(e, t))
    : Ki(e, t);
}
function Pa(e, t) {
  let n = t.tagID;
  switch (n) {
    case H.TD:
    case H.TH:
      e.openElements.hasInTableScope(n) &&
        (e.openElements.generateImpliedEndTags(),
        e.openElements.popUntilTagNamePopped(n),
        e.activeFormattingElements.clearToLastMarker(),
        (e.insertionMode = G.IN_ROW));
      break;
    case H.TABLE:
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
    case H.TR:
      e.openElements.hasInTableScope(n) && (e._closeTableCell(), Ma(e, t));
      break;
    case H.BODY:
    case H.CAPTION:
    case H.COL:
    case H.COLGROUP:
    case H.HTML:
      break;
    default:
      ia(e, t);
  }
}
function Fa(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.OPTION:
      (e.openElements.currentTagId === H.OPTION && e.openElements.pop(),
        e._insertElement(t, B.HTML));
      break;
    case H.OPTGROUP:
      (e.openElements.currentTagId === H.OPTION && e.openElements.pop(),
        e.openElements.currentTagId === H.OPTGROUP && e.openElements.pop(),
        e._insertElement(t, B.HTML));
      break;
    case H.HR:
      (e.openElements.currentTagId === H.OPTION && e.openElements.pop(),
        e.openElements.currentTagId === H.OPTGROUP && e.openElements.pop(),
        e._appendElement(t, B.HTML),
        (t.ackSelfClosing = !0));
      break;
    case H.INPUT:
    case H.KEYGEN:
    case H.TEXTAREA:
    case H.SELECT:
      e.openElements.hasInSelectScope(H.SELECT) &&
        (e.openElements.popUntilTagNamePopped(H.SELECT),
        e._resetInsertionMode(),
        t.tagID !== H.SELECT && e._processStartTag(t));
      break;
    case H.SCRIPT:
    case H.TEMPLATE:
      ti(e, t);
      break;
    default:
  }
}
function Ia(e, t) {
  switch (t.tagID) {
    case H.OPTGROUP:
      (e.openElements.stackTop > 0 &&
        e.openElements.currentTagId === H.OPTION &&
        e.openElements.tagIDs[e.openElements.stackTop - 1] === H.OPTGROUP &&
        e.openElements.pop(),
        e.openElements.currentTagId === H.OPTGROUP && e.openElements.pop());
      break;
    case H.OPTION:
      e.openElements.currentTagId === H.OPTION && e.openElements.pop();
      break;
    case H.SELECT:
      e.openElements.hasInSelectScope(H.SELECT) &&
        (e.openElements.popUntilTagNamePopped(H.SELECT),
        e._resetInsertionMode());
      break;
    case H.TEMPLATE:
      ri(e, t);
      break;
    default:
  }
}
function La(e, t) {
  let n = t.tagID;
  n === H.CAPTION ||
  n === H.TABLE ||
  n === H.TBODY ||
  n === H.TFOOT ||
  n === H.THEAD ||
  n === H.TR ||
  n === H.TD ||
  n === H.TH
    ? (e.openElements.popUntilTagNamePopped(H.SELECT),
      e._resetInsertionMode(),
      e._processStartTag(t))
    : Fa(e, t);
}
function Ra(e, t) {
  let n = t.tagID;
  n === H.CAPTION ||
  n === H.TABLE ||
  n === H.TBODY ||
  n === H.TFOOT ||
  n === H.THEAD ||
  n === H.TR ||
  n === H.TD ||
  n === H.TH
    ? e.openElements.hasInTableScope(n) &&
      (e.openElements.popUntilTagNamePopped(H.SELECT),
      e._resetInsertionMode(),
      e.onEndTag(t))
    : Ia(e, t);
}
function za(e, t) {
  switch (t.tagID) {
    case H.BASE:
    case H.BASEFONT:
    case H.BGSOUND:
    case H.LINK:
    case H.META:
    case H.NOFRAMES:
    case H.SCRIPT:
    case H.STYLE:
    case H.TEMPLATE:
    case H.TITLE:
      ti(e, t);
      break;
    case H.CAPTION:
    case H.COLGROUP:
    case H.TBODY:
    case H.TFOOT:
    case H.THEAD:
      ((e.tmplInsertionModeStack[0] = G.IN_TABLE),
        (e.insertionMode = G.IN_TABLE),
        _a(e, t));
      break;
    case H.COL:
      ((e.tmplInsertionModeStack[0] = G.IN_COLUMN_GROUP),
        (e.insertionMode = G.IN_COLUMN_GROUP),
        Ea(e, t));
      break;
    case H.TR:
      ((e.tmplInsertionModeStack[0] = G.IN_TABLE_BODY),
        (e.insertionMode = G.IN_TABLE_BODY),
        ka(e, t));
      break;
    case H.TD:
    case H.TH:
      ((e.tmplInsertionModeStack[0] = G.IN_ROW),
        (e.insertionMode = G.IN_ROW),
        ja(e, t));
      break;
    default:
      ((e.tmplInsertionModeStack[0] = G.IN_BODY),
        (e.insertionMode = G.IN_BODY),
        Ki(e, t));
  }
}
function Ba(e, t) {
  t.tagID === H.TEMPLATE && ri(e, t);
}
function Va(e, t) {
  e.openElements.tmplCount > 0
    ? (e.openElements.popUntilTagNamePopped(H.TEMPLATE),
      e.activeFormattingElements.clearToLastMarker(),
      e.tmplInsertionModeStack.shift(),
      e._resetInsertionMode(),
      e.onEof(t))
    : Kr(e, t);
}
function Ha(e, t) {
  t.tagID === H.HTML ? Ki(e, t) : Wa(e, t);
}
function Ua(e, t) {
  if (t.tagID === H.HTML) {
    if (
      (e.fragmentContext || (e.insertionMode = G.AFTER_AFTER_BODY),
      e.options.sourceCodeLocationInfo && e.openElements.tagIDs[0] === H.HTML)
    ) {
      e._setEndLocation(e.openElements.items[0], t);
      let n = e.openElements.items[1];
      n &&
        !e.treeAdapter.getNodeSourceCodeLocation(n)?.endTag &&
        e._setEndLocation(n, t);
    }
  } else Wa(e, t);
}
function Wa(e, t) {
  ((e.insertionMode = G.IN_BODY), di(e, t));
}
function Ga(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.FRAMESET:
      e._insertElement(t, B.HTML);
      break;
    case H.FRAME:
      (e._appendElement(t, B.HTML), (t.ackSelfClosing = !0));
      break;
    case H.NOFRAMES:
      ti(e, t);
      break;
    default:
  }
}
function Ka(e, t) {
  t.tagID === H.FRAMESET &&
    !e.openElements.isRootHtmlElementCurrent() &&
    (e.openElements.pop(),
    !e.fragmentContext &&
      e.openElements.currentTagId !== H.FRAMESET &&
      (e.insertionMode = G.AFTER_FRAMESET));
}
function qa(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.NOFRAMES:
      ti(e, t);
      break;
    default:
  }
}
function Ja(e, t) {
  t.tagID === H.HTML && (e.insertionMode = G.AFTER_AFTER_FRAMESET);
}
function Ya(e, t) {
  t.tagID === H.HTML ? Ki(e, t) : Xa(e, t);
}
function Xa(e, t) {
  ((e.insertionMode = G.IN_BODY), di(e, t));
}
function Za(e, t) {
  switch (t.tagID) {
    case H.HTML:
      Ki(e, t);
      break;
    case H.NOFRAMES:
      ti(e, t);
      break;
    default:
  }
}
function Qa(e, t) {
  ((t.chars = `�`), e._insertCharacters(t));
}
function $a(e, t) {
  (e._insertCharacters(t), (e.framesetOk = !1));
}
function eo(e) {
  for (
    ;
    e.treeAdapter.getNamespaceURI(e.openElements.current) !== B.HTML &&
    e.openElements.currentTagId !== void 0 &&
    !e._isIntegrationPoint(e.openElements.currentTagId, e.openElements.current);
  )
    e.openElements.pop();
}
function to(e, t) {
  if (xr(t)) (eo(e), e._startTagOutsideForeignContent(t));
  else {
    let n = e._getAdjustedCurrentElement(),
      r = e.treeAdapter.getNamespaceURI(n);
    (r === B.MATHML ? Sr(t) : r === B.SVG && (Tr(t), Cr(t)),
      wr(t),
      t.selfClosing ? e._appendElement(t, r) : e._insertElement(t, r),
      (t.ackSelfClosing = !0));
  }
}
function no(e, t) {
  if (t.tagID === H.P || t.tagID === H.BR) {
    (eo(e), e._endTagOutsideForeignContent(t));
    return;
  }
  for (let n = e.openElements.stackTop; n > 0; n--) {
    let r = e.openElements.items[n];
    if (e.treeAdapter.getNamespaceURI(r) === B.HTML) {
      e._endTagOutsideForeignContent(t);
      break;
    }
    let i = e.treeAdapter.getTagName(r);
    if (i.toLowerCase() === t.tagName) {
      ((t.tagName = i), e.openElements.shortenToLength(n));
      break;
    }
  }
}
new Set([
  V.AREA,
  V.BASE,
  V.BASEFONT,
  V.BGSOUND,
  V.BR,
  V.COL,
  V.EMBED,
  V.FRAME,
  V.HR,
  V.IMG,
  V.INPUT,
  V.KEYGEN,
  V.LINK,
  V.META,
  V.PARAM,
  V.SOURCE,
  V.TRACK,
  V.WBR,
]);
var ro = ao(`end`),
  io = ao(`start`);
function ao(e) {
  return t;
  function t(t) {
    let n = (t && t.position && t.position[e]) || {};
    if (
      typeof n.line == `number` &&
      n.line > 0 &&
      typeof n.column == `number` &&
      n.column > 0
    )
      return {
        line: n.line,
        column: n.column,
        offset:
          typeof n.offset == `number` && n.offset > -1 ? n.offset : void 0,
      };
  }
}
function oo(e) {
  let t = io(e),
    n = ro(e);
  if (t && n) return { start: t, end: n };
}
var so =
    /<(\/?)(iframe|noembed|noframes|plaintext|script|style|textarea|title|xmp)(?=[\t\n\f\r />])/gi,
  co = new Set([
    `mdxFlowExpression`,
    `mdxJsxFlowElement`,
    `mdxJsxTextElement`,
    `mdxTextExpression`,
    `mdxjsEsm`,
  ]),
  lo = { sourceCodeLocationInfo: !0, scriptingEnabled: !1 };
function uo(e, t) {
  let n = To(e),
    r = ze(`type`, {
      handlers: {
        root: po,
        element: mo,
        text: ho,
        comment: vo,
        doctype: go,
        raw: yo,
      },
      unknown: bo,
    }),
    i = {
      parser: n ? new Fr(lo) : Fr.getFragmentParser(void 0, lo),
      handle(e) {
        r(e, i);
      },
      stitches: !1,
      options: t || {},
    };
  (r(e, i), xo(i, io()));
  let a = jt(n ? i.parser.document : i.parser.getFragment(), {
    file: i.options.file,
  });
  return (
    i.stitches &&
      se(a, `comment`, function (e, t, n) {
        let r = e;
        if (r.value.stitch && n && t !== void 0) {
          let e = n.children;
          return ((e[t] = r.value.stitch), t);
        }
      }),
    a.type === `root` &&
    a.children.length === 1 &&
    a.children[0].type === e.type
      ? a.children[0]
      : a
  );
}
function fo(e, t) {
  let n = -1;
  if (e) for (; ++n < e.length; ) t.handle(e[n]);
}
function po(e, t) {
  fo(e.children, t);
}
function mo(e, t) {
  (Co(e, t), fo(e.children, t), wo(e, t));
}
function ho(e, t) {
  t.parser.tokenizer.state > 4 && (t.parser.tokenizer.state = 0);
  let n = { type: z.CHARACTER, chars: e.value, location: Eo(e) };
  (xo(t, io(e)),
    (t.parser.currentToken = n),
    t.parser._processToken(t.parser.currentToken));
}
function go(e, t) {
  let n = {
    type: z.DOCTYPE,
    name: `html`,
    forceQuirks: !1,
    publicId: ``,
    systemId: ``,
    location: Eo(e),
  };
  (xo(t, io(e)),
    (t.parser.currentToken = n),
    t.parser._processToken(t.parser.currentToken));
}
function _o(e, t) {
  t.stitches = !0;
  let n = Do(e);
  (`children` in e &&
    `children` in n &&
    (n.children = uo(
      { type: `root`, children: e.children },
      t.options,
    ).children),
    vo({ type: `comment`, value: { stitch: n } }, t));
}
function vo(e, t) {
  let n = e.value,
    r = { type: z.COMMENT, data: n, location: Eo(e) };
  (xo(t, io(e)),
    (t.parser.currentToken = r),
    t.parser._processToken(t.parser.currentToken));
}
function yo(e, t) {
  if (
    ((t.parser.tokenizer.preprocessor.html = ``),
    (t.parser.tokenizer.preprocessor.pos = -1),
    (t.parser.tokenizer.preprocessor.lastGapPos = -2),
    (t.parser.tokenizer.preprocessor.gapStack = []),
    (t.parser.tokenizer.preprocessor.skipNextNewLine = !1),
    (t.parser.tokenizer.preprocessor.lastChunkWritten = !1),
    (t.parser.tokenizer.preprocessor.endOfChunkHit = !1),
    (t.parser.tokenizer.preprocessor.isEol = !1),
    So(t, io(e)),
    t.parser.tokenizer.write(
      t.options.tagfilter ? e.value.replace(so, `&lt;$1$2`) : e.value,
      !1,
    ),
    t.parser.tokenizer._runParsingLoop(),
    t.parser.tokenizer.state === 72 || t.parser.tokenizer.state === 78)
  ) {
    t.parser.tokenizer.preprocessor.lastChunkWritten = !0;
    let e = t.parser.tokenizer._consume();
    t.parser.tokenizer._callState(e);
  }
}
function bo(e, t) {
  let n = e;
  if (t.options.passThrough && t.options.passThrough.includes(n.type)) _o(n, t);
  else {
    let e = ``;
    throw (
      co.has(n.type) &&
        (e =
          ". It looks like you are using MDX nodes with `hast-util-raw` (or `rehype-raw`). If you use this because you are using remark or rehype plugins that inject `'html'` nodes, then please raise an issue with that plugin, as its a bad and slow idea. If you use this because you are using markdown syntax, then you have to configure this utility (or plugin) to pass through these nodes (see `passThrough` in docs), but you can also migrate to use the MDX syntax"),
      Error("Cannot compile `" + n.type + "` node" + e)
    );
  }
}
function xo(e, t) {
  So(e, t);
  let n = e.parser.tokenizer.currentCharacterToken;
  (n &&
    n.location &&
    ((n.location.endLine = e.parser.tokenizer.preprocessor.line),
    (n.location.endCol = e.parser.tokenizer.preprocessor.col + 1),
    (n.location.endOffset = e.parser.tokenizer.preprocessor.offset + 1),
    (e.parser.currentToken = n),
    e.parser._processToken(e.parser.currentToken)),
    (e.parser.tokenizer.paused = !1),
    (e.parser.tokenizer.inLoop = !1),
    (e.parser.tokenizer.active = !1),
    (e.parser.tokenizer.returnState = kn.DATA),
    (e.parser.tokenizer.charRefCode = -1),
    (e.parser.tokenizer.consumedAfterSnapshot = -1),
    (e.parser.tokenizer.currentLocation = null),
    (e.parser.tokenizer.currentCharacterToken = null),
    (e.parser.tokenizer.currentToken = null),
    (e.parser.tokenizer.currentAttr = { name: ``, value: `` }));
}
function So(e, t) {
  if (t && t.offset !== void 0) {
    let n = {
      startLine: t.line,
      startCol: t.column,
      startOffset: t.offset,
      endLine: -1,
      endCol: -1,
      endOffset: -1,
    };
    ((e.parser.tokenizer.preprocessor.lineStartPos = -t.column + 1),
      (e.parser.tokenizer.preprocessor.droppedBufferSize = t.offset),
      (e.parser.tokenizer.preprocessor.line = t.line),
      (e.parser.tokenizer.currentLocation = n));
  }
}
function Co(e, t) {
  let n = e.tagName.toLowerCase();
  if (t.parser.tokenizer.state === kn.PLAINTEXT) return;
  xo(t, io(e));
  let r = t.parser.openElements.current,
    i = `namespaceURI` in r ? r.namespaceURI : ot.html;
  i === ot.html && n === `svg` && (i = ot.svg);
  let a = Ht({ ...e, children: [] }, { space: i === ot.svg ? `svg` : `html` }),
    o = {
      type: z.START_TAG,
      tagName: n,
      tagID: En(n),
      selfClosing: !1,
      ackSelfClosing: !1,
      attrs: `attrs` in a ? a.attrs : [],
      location: Eo(e),
    };
  ((t.parser.currentToken = o),
    t.parser._processToken(t.parser.currentToken),
    (t.parser.tokenizer.lastStartTagName = n));
}
function wo(e, t) {
  let n = e.tagName.toLowerCase();
  if (
    (!t.parser.tokenizer.inForeignNode && ce.includes(n)) ||
    t.parser.tokenizer.state === kn.PLAINTEXT
  )
    return;
  xo(t, ro(e));
  let r = {
    type: z.END_TAG,
    tagName: n,
    tagID: En(n),
    selfClosing: !1,
    ackSelfClosing: !1,
    attrs: [],
    location: Eo(e),
  };
  ((t.parser.currentToken = r),
    t.parser._processToken(t.parser.currentToken),
    n === t.parser.tokenizer.lastStartTagName &&
      (t.parser.tokenizer.state === kn.RCDATA ||
        t.parser.tokenizer.state === kn.RAWTEXT ||
        t.parser.tokenizer.state === kn.SCRIPT_DATA) &&
      (t.parser.tokenizer.state = kn.DATA));
}
function To(e) {
  let t = e.type === `root` ? e.children[0] : e;
  return !!(
    t &&
    (t.type === `doctype` ||
      (t.type === `element` && t.tagName.toLowerCase() === `html`))
  );
}
function Eo(e) {
  let t = io(e) || { line: void 0, column: void 0, offset: void 0 },
    n = ro(e) || { line: void 0, column: void 0, offset: void 0 };
  return {
    startLine: t.line,
    startCol: t.column,
    startOffset: t.offset,
    endLine: n.line,
    endCol: n.column,
    endOffset: n.offset,
  };
}
function Do(e) {
  return `children` in e ? Et({ ...e, children: [] }) : Et(e);
}
function Oo(e) {
  return function (t, n) {
    return uo(t, { ...e, file: n });
  };
}
var ko = [`ariaDescribedBy`, `ariaLabel`, `ariaLabelledBy`],
  Ao = {
    ancestors: {
      tbody: [`table`],
      td: [`table`],
      th: [`table`],
      thead: [`table`],
      tfoot: [`table`],
      tr: [`table`],
    },
    attributes: {
      a: [
        ...ko,
        `dataFootnoteBackref`,
        `dataFootnoteRef`,
        [`className`, `data-footnote-backref`],
        `href`,
      ],
      blockquote: [`cite`],
      code: [[`className`, /^language-./]],
      del: [`cite`],
      div: [`itemScope`, `itemType`],
      dl: [...ko],
      h2: [[`className`, `sr-only`]],
      img: [...ko, `longDesc`, `src`],
      input: [
        [`disabled`, !0],
        [`type`, `checkbox`],
      ],
      ins: [`cite`],
      li: [[`className`, `task-list-item`]],
      ol: [...ko, [`className`, `contains-task-list`]],
      q: [`cite`],
      section: [`dataFootnotes`, [`className`, `footnotes`]],
      source: [`srcSet`],
      summary: [...ko],
      table: [...ko],
      ul: [...ko, [`className`, `contains-task-list`]],
      "*": `abbr.accept.acceptCharset.accessKey.action.align.alt.axis.border.cellPadding.cellSpacing.char.charOff.charSet.checked.clear.colSpan.color.cols.compact.coords.dateTime.dir.encType.frame.hSpace.headers.height.hrefLang.htmlFor.id.isMap.itemProp.label.lang.maxLength.media.method.multiple.name.noHref.noShade.noWrap.open.prompt.readOnly.rev.rowSpan.rows.rules.scope.selected.shape.size.span.start.summary.tabIndex.title.useMap.vAlign.value.width`.split(
        `.`,
      ),
    },
    clobber: [`ariaDescribedBy`, `ariaLabelledBy`, `id`, `name`],
    clobberPrefix: `user-content-`,
    protocols: {
      cite: [`http`, `https`],
      href: [`http`, `https`, `irc`, `ircs`, `mailto`, `xmpp`],
      longDesc: [`http`, `https`],
      src: [`http`, `https`],
    },
    required: { input: { disabled: !0, type: `checkbox` } },
    strip: [`script`],
    tagNames:
      `a.b.blockquote.br.code.dd.del.details.div.dl.dt.em.h1.h2.h3.h4.h5.h6.hr.i.img.input.ins.kbd.li.ol.p.picture.pre.q.rp.rt.ruby.s.samp.section.source.span.strike.strong.sub.summary.sup.table.tbody.td.tfoot.th.thead.tr.tt.ul.var`.split(
        `.`,
      ),
  },
  jo = {}.hasOwnProperty;
function Mo(e, t) {
  let n = { type: `root`, children: [] },
    r = No({ schema: t ? { ...Ao, ...t } : Ao, stack: [] }, e);
  return (
    r &&
      (Array.isArray(r)
        ? r.length === 1
          ? (n = r[0])
          : (n.children = r)
        : (n = r)),
    n
  );
}
function No(e, t) {
  if (t && typeof t == `object`) {
    let n = t;
    switch (typeof n.type == `string` ? n.type : ``) {
      case `comment`:
        return Po(e, n);
      case `doctype`:
        return Fo(e, n);
      case `element`:
        return Io(e, n);
      case `root`:
        return Lo(e, n);
      case `text`:
        return Ro(e, n);
      default:
    }
  }
}
function Po(e, t) {
  if (e.schema.allowComments) {
    let e = typeof t.value == `string` ? t.value : ``,
      n = e.indexOf(`-->`),
      r = { type: `comment`, value: n < 0 ? e : e.slice(0, n) };
    return (Go(r, t), r);
  }
}
function Fo(e, t) {
  if (e.schema.allowDoctypes) {
    let e = { type: `doctype` };
    return (Go(e, t), e);
  }
}
function Io(e, t) {
  let n = typeof t.tagName == `string` ? t.tagName : ``;
  e.stack.push(n);
  let r = zo(e, t.children),
    i = Bo(e, t.properties);
  e.stack.pop();
  let a = !1;
  if (
    n &&
    n !== `*` &&
    (!e.schema.tagNames || e.schema.tagNames.includes(n)) &&
    ((a = !0), e.schema.ancestors && jo.call(e.schema.ancestors, n))
  ) {
    let t = e.schema.ancestors[n],
      r = -1;
    for (a = !1; ++r < t.length; ) e.stack.includes(t[r]) && (a = !0);
  }
  if (!a) return e.schema.strip && !e.schema.strip.includes(n) ? r : void 0;
  let o = { type: `element`, tagName: n, properties: i, children: r };
  return (Go(o, t), o);
}
function Lo(e, t) {
  let n = { type: `root`, children: zo(e, t.children) };
  return (Go(n, t), n);
}
function Ro(e, t) {
  let n = { type: `text`, value: typeof t.value == `string` ? t.value : `` };
  return (Go(n, t), n);
}
function zo(e, t) {
  let n = [];
  if (Array.isArray(t)) {
    let r = t,
      i = -1;
    for (; ++i < r.length; ) {
      let t = No(e, r[i]);
      t && (Array.isArray(t) ? n.push(...t) : n.push(t));
    }
  }
  return n;
}
function Bo(e, t) {
  let n = e.stack[e.stack.length - 1],
    r = e.schema.attributes,
    i = e.schema.required,
    a = r && jo.call(r, n) ? r[n] : void 0,
    o = r && jo.call(r, `*`) ? r[`*`] : void 0,
    s = t && typeof t == `object` ? t : {},
    c = {},
    l;
  for (l in s)
    if (jo.call(s, l)) {
      let t = s[l],
        n = Vo(e, Ko(a, l), l, t);
      ((n ??= Vo(e, Ko(o, l), l, t)), n != null && (c[l] = n));
    }
  if (i && jo.call(i, n)) {
    let e = i[n];
    for (l in e) jo.call(e, l) && !jo.call(c, l) && (c[l] = e[l]);
  }
  return c;
}
function Vo(e, t, n, r) {
  return t ? (Array.isArray(r) ? Ho(e, t, n, r) : Uo(e, t, n, r)) : void 0;
}
function Ho(e, t, n, r) {
  let i = -1,
    a = [];
  for (; ++i < r.length; ) {
    let o = Uo(e, t, n, r[i]);
    (typeof o == `number` || typeof o == `string`) && a.push(o);
  }
  return a;
}
function Uo(e, t, n, r) {
  if (
    !(typeof r != `boolean` && typeof r != `number` && typeof r != `string`) &&
    Wo(e, n, r)
  ) {
    if (typeof t == `object` && t.length > 1) {
      let e = !1,
        n = 0;
      for (; ++n < t.length; ) {
        let i = t[n];
        if (i && typeof i == `object` && `flags` in i) {
          if (i.test(String(r))) {
            e = !0;
            break;
          }
        } else if (i === r) {
          e = !0;
          break;
        }
      }
      if (!e) return;
    }
    return e.schema.clobber &&
      e.schema.clobberPrefix &&
      e.schema.clobber.includes(n)
      ? e.schema.clobberPrefix + r
      : r;
  }
}
function Wo(e, t, n) {
  let r =
    e.schema.protocols && jo.call(e.schema.protocols, t)
      ? e.schema.protocols[t]
      : void 0;
  if (!r || r.length === 0) return !0;
  let i = String(n),
    a = i.indexOf(`:`),
    o = i.indexOf(`?`),
    s = i.indexOf(`#`),
    c = i.indexOf(`/`);
  if (a < 0 || (c > -1 && a > c) || (o > -1 && a > o) || (s > -1 && a > s))
    return !0;
  let l = -1;
  for (; ++l < r.length; ) {
    let e = r[l];
    if (a === e.length && i.slice(0, e.length) === e) return !0;
  }
  return !1;
}
function Go(e, t) {
  let n = oo(t);
  (t.data && (e.data = Et(t.data)), n && (e.position = n));
}
function Ko(e, t) {
  let n,
    r = -1;
  if (e)
    for (; ++r < e.length; ) {
      let i = e[r],
        a = typeof i == `string` ? i : i[0];
      if (a === t) return i;
      a === `data*` && (n = i);
    }
  if (t.length > 4 && t.slice(0, 4).toLowerCase() === `data`) return n;
}
function qo(e) {
  return function (t) {
    return Mo(t, e);
  };
}
function Jo(e) {
  if (typeof e != `string`) throw TypeError(`Expected a string`);
  return e.replace(/[|\\{}()[\]^$+*?.]/g, `\\$&`).replace(/-/g, `\\x2d`);
}
function Yo(e, t, n) {
  let r = T((n || {}).ignore || []),
    i = Xo(t),
    a = -1;
  for (; ++a < i.length; ) ae(e, `text`, o);
  function o(e, t) {
    let n = -1,
      i;
    for (; ++n < t.length; ) {
      let e = t[n],
        a = i ? i.children : void 0;
      if (r(e, a ? a.indexOf(e) : void 0, i)) return;
      i = e;
    }
    if (i) return s(e, t);
  }
  function s(e, t) {
    let n = t[t.length - 1],
      r = i[a][0],
      o = i[a][1],
      s = 0,
      c = n.children.indexOf(e),
      l = !1,
      u = [];
    r.lastIndex = 0;
    let d = r.exec(e.value);
    for (; d; ) {
      let n = d.index,
        i = { index: d.index, input: d.input, stack: [...t, e] },
        a = o(...d, i);
      if (
        (typeof a == `string` &&
          (a = a.length > 0 ? { type: `text`, value: a } : void 0),
        a === !1
          ? (r.lastIndex = n + 1)
          : (s !== n && u.push({ type: `text`, value: e.value.slice(s, n) }),
            Array.isArray(a) ? u.push(...a) : a && u.push(a),
            (s = n + d[0].length),
            (l = !0)),
        !r.global)
      )
        break;
      d = r.exec(e.value);
    }
    return (
      l
        ? (s < e.value.length &&
            u.push({ type: `text`, value: e.value.slice(s) }),
          n.children.splice(c, 1, ...u))
        : (u = [e]),
      c + u.length
    );
  }
}
function Xo(e) {
  let t = [];
  if (!Array.isArray(e))
    throw TypeError(`Expected find and replace tuple or list of tuples`);
  let n = !e[0] || Array.isArray(e[0]) ? e : [e],
    r = -1;
  for (; ++r < n.length; ) {
    let e = n[r];
    t.push([Zo(e[0]), Qo(e[1])]);
  }
  return t;
}
function Zo(e) {
  return typeof e == `string` ? new RegExp(Jo(e), `g`) : e;
}
function Qo(e) {
  return typeof e == `function`
    ? e
    : function () {
        return e;
      };
}
var $o = `phrasing`,
  es = [`autolink`, `link`, `image`, `label`];
function ts() {
  return {
    transforms: [ls],
    enter: {
      literalAutolink: rs,
      literalAutolinkEmail: is,
      literalAutolinkHttp: is,
      literalAutolinkWww: is,
    },
    exit: {
      literalAutolink: cs,
      literalAutolinkEmail: ss,
      literalAutolinkHttp: as,
      literalAutolinkWww: os,
    },
  };
}
function ns() {
  return {
    unsafe: [
      {
        character: `@`,
        before: `[+\\-.\\w]`,
        after: `[\\-.\\w]`,
        inConstruct: $o,
        notInConstruct: es,
      },
      {
        character: `.`,
        before: `[Ww]`,
        after: `[\\-.\\w]`,
        inConstruct: $o,
        notInConstruct: es,
      },
      {
        character: `:`,
        before: `[ps]`,
        after: `\\/`,
        inConstruct: $o,
        notInConstruct: es,
      },
    ],
  };
}
function rs(e) {
  this.enter({ type: `link`, title: null, url: ``, children: [] }, e);
}
function is(e) {
  this.config.enter.autolinkProtocol.call(this, e);
}
function as(e) {
  this.config.exit.autolinkProtocol.call(this, e);
}
function os(e) {
  this.config.exit.data.call(this, e);
  let t = this.stack[this.stack.length - 1];
  (t.type, (t.url = `http://` + this.sliceSerialize(e)));
}
function ss(e) {
  this.config.exit.autolinkEmail.call(this, e);
}
function cs(e) {
  this.exit(e);
}
function ls(e) {
  Yo(
    e,
    [
      [/(https?:\/\/|www(?=\.))([-.\w]+)([^ \t\r\n]*)/gi, us],
      [/(?<=^|\s|\p{P}|\p{S})([-.\w+]+)@([-\w]+(?:\.[-\w]+)+)/gu, ds],
    ],
    { ignore: [`link`, `linkReference`] },
  );
}
function us(e, t, n, r, i) {
  let a = ``;
  if (
    !ms(i) ||
    (/^w/i.test(t) && ((n = t + n), (t = ``), (a = `http://`)), !fs(n))
  )
    return !1;
  let o = ps(n + r);
  if (!o[0]) return !1;
  let s = {
    type: `link`,
    title: null,
    url: a + t + o[0],
    children: [{ type: `text`, value: t + o[0] }],
  };
  return o[1] ? [s, { type: `text`, value: o[1] }] : s;
}
function ds(e, t, n, r) {
  return !ms(r, !0) || /[-\d_]$/.test(n)
    ? !1
    : {
        type: `link`,
        title: null,
        url: `mailto:` + t + `@` + n,
        children: [{ type: `text`, value: t + `@` + n }],
      };
}
function fs(e) {
  let t = e.split(`.`);
  return !(
    t.length < 2 ||
    (t[t.length - 1] &&
      (/_/.test(t[t.length - 1]) || !/[a-zA-Z\d]/.test(t[t.length - 1]))) ||
    (t[t.length - 2] &&
      (/_/.test(t[t.length - 2]) || !/[a-zA-Z\d]/.test(t[t.length - 2])))
  );
}
function ps(e) {
  let t = /[!"&'),.:;<>?\]}]+$/.exec(e);
  if (!t) return [e, void 0];
  e = e.slice(0, t.index);
  let n = t[0],
    r = n.indexOf(`)`),
    i = Be(e, `(`),
    a = Be(e, `)`);
  for (; r !== -1 && i > a; )
    ((e += n.slice(0, r + 1)), (n = n.slice(r + 1)), (r = n.indexOf(`)`)), a++);
  return [e, n];
}
function ms(e, t) {
  let n = e.input.charCodeAt(e.index - 1);
  return (e.index === 0 || b(n) || y(n)) && (!t || n !== 47);
}
function hs(e) {
  return e
    .replace(/[\t\n\r ]+/g, ` `)
    .replace(/^ | $/g, ``)
    .toLowerCase()
    .toUpperCase();
}
Ts.peek = ws;
function gs() {
  this.buffer();
}
function _s(e) {
  this.enter({ type: `footnoteReference`, identifier: ``, label: `` }, e);
}
function vs() {
  this.buffer();
}
function ys(e) {
  this.enter(
    { type: `footnoteDefinition`, identifier: ``, label: ``, children: [] },
    e,
  );
}
function bs(e) {
  let t = this.resume(),
    n = this.stack[this.stack.length - 1];
  (n.type,
    (n.identifier = hs(this.sliceSerialize(e)).toLowerCase()),
    (n.label = t));
}
function xs(e) {
  this.exit(e);
}
function Ss(e) {
  let t = this.resume(),
    n = this.stack[this.stack.length - 1];
  (n.type,
    (n.identifier = hs(this.sliceSerialize(e)).toLowerCase()),
    (n.label = t));
}
function Cs(e) {
  this.exit(e);
}
function ws() {
  return `[`;
}
function Ts(e, t, n, r) {
  let i = n.createTracker(r),
    a = i.move(`[^`),
    o = n.enter(`footnoteReference`),
    s = n.enter(`reference`);
  return (
    (a += i.move(n.safe(n.associationId(e), { after: `]`, before: a }))),
    s(),
    o(),
    (a += i.move(`]`)),
    a
  );
}
function Es() {
  return {
    enter: {
      gfmFootnoteCallString: gs,
      gfmFootnoteCall: _s,
      gfmFootnoteDefinitionLabelString: vs,
      gfmFootnoteDefinition: ys,
    },
    exit: {
      gfmFootnoteCallString: bs,
      gfmFootnoteCall: xs,
      gfmFootnoteDefinitionLabelString: Ss,
      gfmFootnoteDefinition: Cs,
    },
  };
}
function Ds(e) {
  let t = !1;
  return (
    e && e.firstLineBlank && (t = !0),
    {
      handlers: { footnoteDefinition: n, footnoteReference: Ts },
      unsafe: [
        { character: `[`, inConstruct: [`label`, `phrasing`, `reference`] },
      ],
    }
  );
  function n(e, n, r, i) {
    let a = r.createTracker(i),
      o = a.move(`[^`),
      s = r.enter(`footnoteDefinition`),
      c = r.enter(`label`);
    return (
      (o += a.move(r.safe(r.associationId(e), { before: o, after: `]` }))),
      c(),
      (o += a.move(`]:`)),
      e.children &&
        e.children.length > 0 &&
        (a.shift(4),
        (o += a.move(
          (t
            ? `
`
            : ` `) +
            r.indentLines(r.containerFlow(e, a.current()), t ? ks : Os),
        ))),
      s(),
      o
    );
  }
}
function Os(e, t, n) {
  return t === 0 ? e : ks(e, t, n);
}
function ks(e, t, n) {
  return (n ? `` : `    `) + e;
}
var As = [
  `autolink`,
  `destinationLiteral`,
  `destinationRaw`,
  `reference`,
  `titleQuote`,
  `titleApostrophe`,
];
Fs.peek = Is;
function js() {
  return {
    canContainEols: [`delete`],
    enter: { strikethrough: Ns },
    exit: { strikethrough: Ps },
  };
}
function Ms() {
  return {
    unsafe: [{ character: `~`, inConstruct: `phrasing`, notInConstruct: As }],
    handlers: { delete: Fs },
  };
}
function Ns(e) {
  this.enter({ type: `delete`, children: [] }, e);
}
function Ps(e) {
  this.exit(e);
}
function Fs(e, t, n, r) {
  let i = n.createTracker(r),
    a = n.enter(`strikethrough`),
    o = i.move(`~~`);
  return (
    (o += n.containerPhrasing(e, { ...i.current(), before: o, after: `~` })),
    (o += i.move(`~~`)),
    a(),
    o
  );
}
function Is() {
  return `~`;
}
function Ls(e) {
  return e.length;
}
function Rs(e, t) {
  let n = t || {},
    r = (n.align || []).concat(),
    i = n.stringLength || Ls,
    a = [],
    o = [],
    s = [],
    c = [],
    l = 0,
    u = -1;
  for (; ++u < e.length; ) {
    let t = [],
      r = [],
      a = -1;
    for (e[u].length > l && (l = e[u].length); ++a < e[u].length; ) {
      let o = zs(e[u][a]);
      if (n.alignDelimiters !== !1) {
        let e = i(o);
        ((r[a] = e), (c[a] === void 0 || e > c[a]) && (c[a] = e));
      }
      t.push(o);
    }
    ((o[u] = t), (s[u] = r));
  }
  let d = -1;
  if (typeof r == `object` && `length` in r) for (; ++d < l; ) a[d] = Bs(r[d]);
  else {
    let e = Bs(r);
    for (; ++d < l; ) a[d] = e;
  }
  d = -1;
  let f = [],
    p = [];
  for (; ++d < l; ) {
    let e = a[d],
      t = ``,
      r = ``;
    e === 99
      ? ((t = `:`), (r = `:`))
      : e === 108
        ? (t = `:`)
        : e === 114 && (r = `:`);
    let i =
        n.alignDelimiters === !1 ? 1 : Math.max(1, c[d] - t.length - r.length),
      o = t + `-`.repeat(i) + r;
    (n.alignDelimiters !== !1 &&
      ((i = t.length + i + r.length), i > c[d] && (c[d] = i), (p[d] = i)),
      (f[d] = o));
  }
  (o.splice(1, 0, f), s.splice(1, 0, p), (u = -1));
  let m = [];
  for (; ++u < o.length; ) {
    let e = o[u],
      t = s[u];
    d = -1;
    let r = [];
    for (; ++d < l; ) {
      let i = e[d] || ``,
        o = ``,
        s = ``;
      if (n.alignDelimiters !== !1) {
        let e = c[d] - (t[d] || 0),
          n = a[d];
        n === 114
          ? (o = ` `.repeat(e))
          : n === 99
            ? e % 2
              ? ((o = ` `.repeat(e / 2 + 0.5)), (s = ` `.repeat(e / 2 - 0.5)))
              : ((o = ` `.repeat(e / 2)), (s = o))
            : (s = ` `.repeat(e));
      }
      (n.delimiterStart !== !1 && !d && r.push(`|`),
        n.padding !== !1 &&
          !(n.alignDelimiters === !1 && i === ``) &&
          (n.delimiterStart !== !1 || d) &&
          r.push(` `),
        n.alignDelimiters !== !1 && r.push(o),
        r.push(i),
        n.alignDelimiters !== !1 && r.push(s),
        n.padding !== !1 && r.push(` `),
        (n.delimiterEnd !== !1 || d !== l - 1) && r.push(`|`));
    }
    m.push(n.delimiterEnd === !1 ? r.join(``).replace(/ +$/, ``) : r.join(``));
  }
  return m.join(`
`);
}
function zs(e) {
  return e == null ? `` : String(e);
}
function Bs(e) {
  let t = typeof e == `string` ? e.codePointAt(0) : 0;
  return t === 67 || t === 99
    ? 99
    : t === 76 || t === 108
      ? 108
      : t === 82 || t === 114
        ? 114
        : 0;
}
function Vs(e, t, n, r) {
  let i = n.enter(`blockquote`),
    a = n.createTracker(r);
  (a.move(`> `), a.shift(2));
  let o = n.indentLines(n.containerFlow(e, a.current()), Hs);
  return (i(), o);
}
function Hs(e, t, n) {
  return `>` + (n ? `` : ` `) + e;
}
function Us(e, t) {
  return Ws(e, t.inConstruct, !0) && !Ws(e, t.notInConstruct, !1);
}
function Ws(e, t, n) {
  if ((typeof t == `string` && (t = [t]), !t || t.length === 0)) return n;
  let r = -1;
  for (; ++r < t.length; ) if (e.includes(t[r])) return !0;
  return !1;
}
function Gs(e, t, n, r) {
  let i = -1;
  for (; ++i < n.unsafe.length; )
    if (
      n.unsafe[i].character ===
        `
` &&
      Us(n.stack, n.unsafe[i])
    )
      return /[ \t]/.test(r.before) ? `` : ` `;
  return `\\
`;
}
function Ks(e, t) {
  return !!(
    t.options.fences === !1 &&
    e.value &&
    !e.lang &&
    /[^ \r\n]/.test(e.value) &&
    !/^[\t ]*(?:[\r\n]|$)|(?:^|[\r\n])[\t ]*$/.test(e.value)
  );
}
function qs(e) {
  let t = e.options.fence || "`";
  if (t !== "`" && t !== `~`)
    throw Error(
      "Cannot serialize code with `" +
        t +
        "` for `options.fence`, expected `` ` `` or `~`",
    );
  return t;
}
function Js(e, t, n, r) {
  let i = qs(n),
    a = e.value || ``,
    o = i === "`" ? `GraveAccent` : `Tilde`;
  if (Ks(e, n)) {
    let e = n.enter(`codeIndented`),
      t = n.indentLines(a, Ys);
    return (e(), t);
  }
  let s = n.createTracker(r),
    c = i.repeat(Math.max(st(a, i) + 1, 3)),
    l = n.enter(`codeFenced`),
    u = s.move(c);
  if (e.lang) {
    let t = n.enter(`codeFencedLang${o}`);
    ((u += s.move(
      n.safe(e.lang, { before: u, after: ` `, encode: ["`"], ...s.current() }),
    )),
      t());
  }
  if (e.lang && e.meta) {
    let t = n.enter(`codeFencedMeta${o}`);
    ((u += s.move(` `)),
      (u += s.move(
        n.safe(e.meta, {
          before: u,
          after: `
`,
          encode: ["`"],
          ...s.current(),
        }),
      )),
      t());
  }
  return (
    (u += s.move(`
`)),
    a &&
      (u += s.move(
        a +
          `
`,
      )),
    (u += s.move(c)),
    l(),
    u
  );
}
function Ys(e, t, n) {
  return (n ? `` : `    `) + e;
}
function Xs(e) {
  let t = e.options.quote || `"`;
  if (t !== `"` && t !== `'`)
    throw Error(
      "Cannot serialize title with `" +
        t +
        "` for `options.quote`, expected `\"`, or `'`",
    );
  return t;
}
function Zs(e, t, n, r) {
  let i = Xs(n),
    a = i === `"` ? `Quote` : `Apostrophe`,
    o = n.enter(`definition`),
    s = n.enter(`label`),
    c = n.createTracker(r),
    l = c.move(`[`);
  return (
    (l += c.move(
      n.safe(n.associationId(e), { before: l, after: `]`, ...c.current() }),
    )),
    (l += c.move(`]: `)),
    s(),
    !e.url || /[\0- \u007F]/.test(e.url)
      ? ((s = n.enter(`destinationLiteral`)),
        (l += c.move(`<`)),
        (l += c.move(n.safe(e.url, { before: l, after: `>`, ...c.current() }))),
        (l += c.move(`>`)))
      : ((s = n.enter(`destinationRaw`)),
        (l += c.move(
          n.safe(e.url, {
            before: l,
            after: e.title
              ? ` `
              : `
`,
            ...c.current(),
          }),
        ))),
    s(),
    e.title &&
      ((s = n.enter(`title${a}`)),
      (l += c.move(` ` + i)),
      (l += c.move(n.safe(e.title, { before: l, after: i, ...c.current() }))),
      (l += c.move(i)),
      s()),
    o(),
    l
  );
}
function Qs(e) {
  let t = e.options.emphasis || `*`;
  if (t !== `*` && t !== `_`)
    throw Error(
      "Cannot serialize emphasis with `" +
        t +
        "` for `options.emphasis`, expected `*`, or `_`",
    );
  return t;
}
function $s(e) {
  return `&#x` + e.toString(16).toUpperCase() + `;`;
}
function ec(e) {
  if (e === null || _(e) || b(e)) return 1;
  if (y(e)) return 2;
}
function tc(e, t, n) {
  let r = ec(e),
    i = ec(t);
  return r === void 0
    ? i === void 0
      ? n === `_`
        ? { inside: !0, outside: !0 }
        : { inside: !1, outside: !1 }
      : i === 1
        ? { inside: !0, outside: !0 }
        : { inside: !1, outside: !0 }
    : r === 1
      ? i === void 0
        ? { inside: !1, outside: !1 }
        : i === 1
          ? { inside: !0, outside: !0 }
          : { inside: !1, outside: !1 }
      : i === void 0
        ? { inside: !1, outside: !1 }
        : i === 1
          ? { inside: !0, outside: !1 }
          : { inside: !1, outside: !1 };
}
nc.peek = rc;
function nc(e, t, n, r) {
  let i = Qs(n),
    a = n.enter(`emphasis`),
    o = n.createTracker(r),
    s = o.move(i),
    c = o.move(n.containerPhrasing(e, { after: i, before: s, ...o.current() })),
    l = c.charCodeAt(0),
    u = tc(r.before.charCodeAt(r.before.length - 1), l, i);
  u.inside && (c = $s(l) + c.slice(1));
  let d = c.charCodeAt(c.length - 1),
    f = tc(r.after.charCodeAt(0), d, i);
  f.inside && (c = c.slice(0, -1) + $s(d));
  let p = o.move(i);
  return (
    a(),
    (n.attentionEncodeSurroundingInfo = {
      after: f.outside,
      before: u.outside,
    }),
    s + c + p
  );
}
function rc(e, t, n) {
  return n.options.emphasis || `*`;
}
var ic = {};
function ac(e, t) {
  let n = t || ic;
  return oc(
    e,
    typeof n.includeImageAlt == `boolean` ? n.includeImageAlt : !0,
    typeof n.includeHtml == `boolean` ? n.includeHtml : !0,
  );
}
function oc(e, t, n) {
  if (cc(e)) {
    if (`value` in e) return e.type === `html` && !n ? `` : e.value;
    if (t && `alt` in e && e.alt) return e.alt;
    if (`children` in e) return sc(e.children, t, n);
  }
  return Array.isArray(e) ? sc(e, t, n) : ``;
}
function sc(e, t, n) {
  let r = [],
    i = -1;
  for (; ++i < e.length; ) r[i] = oc(e[i], t, n);
  return r.join(``);
}
function cc(e) {
  return !!(e && typeof e == `object`);
}
function lc(e, t) {
  let n = !1;
  return (
    se(e, function (e) {
      if ((`value` in e && /\r?\n|\r/.test(e.value)) || e.type === `break`)
        return ((n = !0), !1);
    }),
    !!((!e.depth || e.depth < 3) && ac(e) && (t.options.setext || n))
  );
}
function uc(e, t, n, r) {
  let i = Math.max(Math.min(6, e.depth || 1), 1),
    a = n.createTracker(r);
  if (lc(e, n)) {
    let t = n.enter(`headingSetext`),
      r = n.enter(`phrasing`),
      o = n.containerPhrasing(e, {
        ...a.current(),
        before: `
`,
        after: `
`,
      });
    return (
      r(),
      t(),
      o +
        `
` +
        (i === 1 ? `=` : `-`).repeat(
          o.length -
            (Math.max(
              o.lastIndexOf(`\r`),
              o.lastIndexOf(`
`),
            ) +
              1),
        )
    );
  }
  let o = `#`.repeat(i),
    s = n.enter(`headingAtx`),
    c = n.enter(`phrasing`);
  a.move(o + ` `);
  let l = n.containerPhrasing(e, {
    before: `# `,
    after: `
`,
    ...a.current(),
  });
  return (
    /^[\t ]/.test(l) && (l = $s(l.charCodeAt(0)) + l.slice(1)),
    (l = l ? o + ` ` + l : o),
    n.options.closeAtx && (l += ` ` + o),
    c(),
    s(),
    l
  );
}
dc.peek = fc;
function dc(e) {
  return e.value || ``;
}
function fc() {
  return `<`;
}
pc.peek = mc;
function pc(e, t, n, r) {
  let i = Xs(n),
    a = i === `"` ? `Quote` : `Apostrophe`,
    o = n.enter(`image`),
    s = n.enter(`label`),
    c = n.createTracker(r),
    l = c.move(`![`);
  return (
    (l += c.move(n.safe(e.alt, { before: l, after: `]`, ...c.current() }))),
    (l += c.move(`](`)),
    s(),
    (!e.url && e.title) || /[\0- \u007F]/.test(e.url)
      ? ((s = n.enter(`destinationLiteral`)),
        (l += c.move(`<`)),
        (l += c.move(n.safe(e.url, { before: l, after: `>`, ...c.current() }))),
        (l += c.move(`>`)))
      : ((s = n.enter(`destinationRaw`)),
        (l += c.move(
          n.safe(e.url, {
            before: l,
            after: e.title ? ` ` : `)`,
            ...c.current(),
          }),
        ))),
    s(),
    e.title &&
      ((s = n.enter(`title${a}`)),
      (l += c.move(` ` + i)),
      (l += c.move(n.safe(e.title, { before: l, after: i, ...c.current() }))),
      (l += c.move(i)),
      s()),
    (l += c.move(`)`)),
    o(),
    l
  );
}
function mc() {
  return `!`;
}
hc.peek = gc;
function hc(e, t, n, r) {
  let i = e.referenceType,
    a = n.enter(`imageReference`),
    o = n.enter(`label`),
    s = n.createTracker(r),
    c = s.move(`![`),
    l = n.safe(e.alt, { before: c, after: `]`, ...s.current() });
  ((c += s.move(l + `][`)), o());
  let u = n.stack;
  ((n.stack = []), (o = n.enter(`reference`)));
  let d = n.safe(n.associationId(e), { before: c, after: `]`, ...s.current() });
  return (
    o(),
    (n.stack = u),
    a(),
    i === `full` || !l || l !== d
      ? (c += s.move(d + `]`))
      : i === `shortcut`
        ? (c = c.slice(0, -1))
        : (c += s.move(`]`)),
    c
  );
}
function gc() {
  return `!`;
}
_c.peek = vc;
function _c(e, t, n) {
  let r = e.value || ``,
    i = "`",
    a = -1;
  for (; RegExp("(^|[^`])" + i + "([^`]|$)").test(r); ) i += "`";
  for (
    /[^ \r\n]/.test(r) &&
    ((/^[ \r\n]/.test(r) && /[ \r\n]$/.test(r)) || /^`|`$/.test(r)) &&
    (r = ` ` + r + ` `);
    ++a < n.unsafe.length;
  ) {
    let e = n.unsafe[a],
      t = n.compilePattern(e),
      i;
    if (e.atBreak)
      for (; (i = t.exec(r)); ) {
        let e = i.index;
        (r.charCodeAt(e) === 10 && r.charCodeAt(e - 1) === 13 && e--,
          (r = r.slice(0, e) + ` ` + r.slice(i.index + 1)));
      }
  }
  return i + r + i;
}
function vc() {
  return "`";
}
function yc(e, t) {
  let n = ac(e);
  return !!(
    !t.options.resourceLink &&
    e.url &&
    !e.title &&
    e.children &&
    e.children.length === 1 &&
    e.children[0].type === `text` &&
    (n === e.url || `mailto:` + n === e.url) &&
    /^[a-z][a-z+.-]+:/i.test(e.url) &&
    !/[\0- <>\u007F]/.test(e.url)
  );
}
bc.peek = xc;
function bc(e, t, n, r) {
  let i = Xs(n),
    a = i === `"` ? `Quote` : `Apostrophe`,
    o = n.createTracker(r),
    s,
    c;
  if (yc(e, n)) {
    let t = n.stack;
    ((n.stack = []), (s = n.enter(`autolink`)));
    let r = o.move(`<`);
    return (
      (r += o.move(
        n.containerPhrasing(e, { before: r, after: `>`, ...o.current() }),
      )),
      (r += o.move(`>`)),
      s(),
      (n.stack = t),
      r
    );
  }
  ((s = n.enter(`link`)), (c = n.enter(`label`)));
  let l = o.move(`[`);
  return (
    (l += o.move(
      n.containerPhrasing(e, { before: l, after: `](`, ...o.current() }),
    )),
    (l += o.move(`](`)),
    c(),
    (!e.url && e.title) || /[\0- \u007F]/.test(e.url)
      ? ((c = n.enter(`destinationLiteral`)),
        (l += o.move(`<`)),
        (l += o.move(n.safe(e.url, { before: l, after: `>`, ...o.current() }))),
        (l += o.move(`>`)))
      : ((c = n.enter(`destinationRaw`)),
        (l += o.move(
          n.safe(e.url, {
            before: l,
            after: e.title ? ` ` : `)`,
            ...o.current(),
          }),
        ))),
    c(),
    e.title &&
      ((c = n.enter(`title${a}`)),
      (l += o.move(` ` + i)),
      (l += o.move(n.safe(e.title, { before: l, after: i, ...o.current() }))),
      (l += o.move(i)),
      c()),
    (l += o.move(`)`)),
    s(),
    l
  );
}
function xc(e, t, n) {
  return yc(e, n) ? `<` : `[`;
}
Sc.peek = Cc;
function Sc(e, t, n, r) {
  let i = e.referenceType,
    a = n.enter(`linkReference`),
    o = n.enter(`label`),
    s = n.createTracker(r),
    c = s.move(`[`),
    l = n.containerPhrasing(e, { before: c, after: `]`, ...s.current() });
  ((c += s.move(l + `][`)), o());
  let u = n.stack;
  ((n.stack = []), (o = n.enter(`reference`)));
  let d = n.safe(n.associationId(e), { before: c, after: `]`, ...s.current() });
  return (
    o(),
    (n.stack = u),
    a(),
    i === `full` || !l || l !== d
      ? (c += s.move(d + `]`))
      : i === `shortcut`
        ? (c = c.slice(0, -1))
        : (c += s.move(`]`)),
    c
  );
}
function Cc() {
  return `[`;
}
function wc(e) {
  let t = e.options.bullet || `*`;
  if (t !== `*` && t !== `+` && t !== `-`)
    throw Error(
      "Cannot serialize items with `" +
        t +
        "` for `options.bullet`, expected `*`, `+`, or `-`",
    );
  return t;
}
function Tc(e) {
  let t = wc(e),
    n = e.options.bulletOther;
  if (!n) return t === `*` ? `-` : `*`;
  if (n !== `*` && n !== `+` && n !== `-`)
    throw Error(
      "Cannot serialize items with `" +
        n +
        "` for `options.bulletOther`, expected `*`, `+`, or `-`",
    );
  if (n === t)
    throw Error(
      "Expected `bullet` (`" +
        t +
        "`) and `bulletOther` (`" +
        n +
        "`) to be different",
    );
  return n;
}
function Ec(e) {
  let t = e.options.bulletOrdered || `.`;
  if (t !== `.` && t !== `)`)
    throw Error(
      "Cannot serialize items with `" +
        t +
        "` for `options.bulletOrdered`, expected `.` or `)`",
    );
  return t;
}
function Dc(e) {
  let t = e.options.rule || `*`;
  if (t !== `*` && t !== `-` && t !== `_`)
    throw Error(
      "Cannot serialize rules with `" +
        t +
        "` for `options.rule`, expected `*`, `-`, or `_`",
    );
  return t;
}
function Oc(e, t, n, r) {
  let i = n.enter(`list`),
    a = n.bulletCurrent,
    o = e.ordered ? Ec(n) : wc(n),
    s = e.ordered ? (o === `.` ? `)` : `.`) : Tc(n),
    c = t && n.bulletLastUsed ? o === n.bulletLastUsed : !1;
  if (!e.ordered) {
    let t = e.children ? e.children[0] : void 0;
    if (
      ((o === `*` || o === `-`) &&
        t &&
        (!t.children || !t.children[0]) &&
        n.stack[n.stack.length - 1] === `list` &&
        n.stack[n.stack.length - 2] === `listItem` &&
        n.stack[n.stack.length - 3] === `list` &&
        n.stack[n.stack.length - 4] === `listItem` &&
        n.indexStack[n.indexStack.length - 1] === 0 &&
        n.indexStack[n.indexStack.length - 2] === 0 &&
        n.indexStack[n.indexStack.length - 3] === 0 &&
        (c = !0),
      Dc(n) === o && t)
    ) {
      let t = -1;
      for (; ++t < e.children.length; ) {
        let n = e.children[t];
        if (
          n &&
          n.type === `listItem` &&
          n.children &&
          n.children[0] &&
          n.children[0].type === `thematicBreak`
        ) {
          c = !0;
          break;
        }
      }
    }
  }
  (c && (o = s), (n.bulletCurrent = o));
  let l = n.containerFlow(e, r);
  return ((n.bulletLastUsed = o), (n.bulletCurrent = a), i(), l);
}
function kc(e) {
  let t = e.options.listItemIndent || `one`;
  if (t !== `tab` && t !== `one` && t !== `mixed`)
    throw Error(
      "Cannot serialize items with `" +
        t +
        "` for `options.listItemIndent`, expected `tab`, `one`, or `mixed`",
    );
  return t;
}
function Ac(e, t, n, r) {
  let i = kc(n),
    a = n.bulletCurrent || wc(n);
  t &&
    t.type === `list` &&
    t.ordered &&
    (a =
      (typeof t.start == `number` && t.start > -1 ? t.start : 1) +
      (n.options.incrementListMarker === !1 ? 0 : t.children.indexOf(e)) +
      a);
  let o = a.length + 1;
  (i === `tab` ||
    (i === `mixed` && ((t && t.type === `list` && t.spread) || e.spread))) &&
    (o = Math.ceil(o / 4) * 4);
  let s = n.createTracker(r);
  (s.move(a + ` `.repeat(o - a.length)), s.shift(o));
  let c = n.enter(`listItem`),
    l = n.indentLines(n.containerFlow(e, s.current()), u);
  return (c(), l);
  function u(e, t, n) {
    return t
      ? (n ? `` : ` `.repeat(o)) + e
      : (n ? a : a + ` `.repeat(o - a.length)) + e;
  }
}
function jc(e, t, n, r) {
  let i = n.enter(`paragraph`),
    a = n.enter(`phrasing`),
    o = n.containerPhrasing(e, r);
  return (a(), i(), o);
}
var Mc = T([
  `break`,
  `delete`,
  `emphasis`,
  `footnote`,
  `footnoteReference`,
  `image`,
  `imageReference`,
  `inlineCode`,
  `inlineMath`,
  `link`,
  `linkReference`,
  `mdxJsxTextElement`,
  `mdxTextExpression`,
  `strong`,
  `text`,
  `textDirective`,
]);
function Nc(e, t, n, r) {
  return (
    e.children.some(function (e) {
      return Mc(e);
    })
      ? n.containerPhrasing
      : n.containerFlow
  ).call(n, e, r);
}
function Pc(e) {
  let t = e.options.strong || `*`;
  if (t !== `*` && t !== `_`)
    throw Error(
      "Cannot serialize strong with `" +
        t +
        "` for `options.strong`, expected `*`, or `_`",
    );
  return t;
}
Fc.peek = Ic;
function Fc(e, t, n, r) {
  let i = Pc(n),
    a = n.enter(`strong`),
    o = n.createTracker(r),
    s = o.move(i + i),
    c = o.move(n.containerPhrasing(e, { after: i, before: s, ...o.current() })),
    l = c.charCodeAt(0),
    u = tc(r.before.charCodeAt(r.before.length - 1), l, i);
  u.inside && (c = $s(l) + c.slice(1));
  let d = c.charCodeAt(c.length - 1),
    f = tc(r.after.charCodeAt(0), d, i);
  f.inside && (c = c.slice(0, -1) + $s(d));
  let p = o.move(i + i);
  return (
    a(),
    (n.attentionEncodeSurroundingInfo = {
      after: f.outside,
      before: u.outside,
    }),
    s + c + p
  );
}
function Ic(e, t, n) {
  return n.options.strong || `*`;
}
function Lc(e, t, n, r) {
  return n.safe(e.value, r);
}
function Rc(e) {
  let t = e.options.ruleRepetition || 3;
  if (t < 3)
    throw Error(
      "Cannot serialize rules with repetition `" +
        t +
        "` for `options.ruleRepetition`, expected `3` or more",
    );
  return t;
}
function zc(e, t, n) {
  let r = (Dc(n) + (n.options.ruleSpaces ? ` ` : ``)).repeat(Rc(n));
  return n.options.ruleSpaces ? r.slice(0, -1) : r;
}
var Bc = {
    blockquote: Vs,
    break: Gs,
    code: Js,
    definition: Zs,
    emphasis: nc,
    hardBreak: Gs,
    heading: uc,
    html: dc,
    image: pc,
    imageReference: hc,
    inlineCode: _c,
    link: bc,
    linkReference: Sc,
    list: Oc,
    listItem: Ac,
    paragraph: jc,
    root: Nc,
    strong: Fc,
    text: Lc,
    thematicBreak: zc,
  },
  Vc = document.createElement(`i`);
function Hc(e) {
  let t = `&` + e + `;`;
  Vc.innerHTML = t;
  let n = Vc.textContent;
  return (n.charCodeAt(n.length - 1) === 59 && e !== `semi`) || n === t
    ? !1
    : n;
}
function Uc(e, t) {
  let n = Number.parseInt(e, t);
  return n < 9 ||
    n === 11 ||
    (n > 13 && n < 32) ||
    (n > 126 && n < 160) ||
    (n > 55295 && n < 57344) ||
    (n > 64975 && n < 65008) ||
    (n & 65535) == 65535 ||
    (n & 65535) == 65534 ||
    n > 1114111
    ? `�`
    : String.fromCodePoint(n);
}
var Wc = /\\([!-/:-@[-`{-~])|&(#(?:\d{1,7}|x[\da-f]{1,6})|[\da-z]{1,31});/gi;
function Gc(e) {
  return e.replace(Wc, Kc);
}
function Kc(e, t, n) {
  if (t) return t;
  if (n.charCodeAt(0) === 35) {
    let e = n.charCodeAt(1),
      t = e === 120 || e === 88;
    return Uc(n.slice(t ? 2 : 1), t ? 16 : 10);
  }
  return Hc(n) || e;
}
function qc() {
  return {
    enter: { table: Jc, tableData: Qc, tableHeader: Qc, tableRow: Xc },
    exit: {
      codeText: $c,
      table: Yc,
      tableData: Zc,
      tableHeader: Zc,
      tableRow: Zc,
    },
  };
}
function Jc(e) {
  let t = e._align;
  (this.enter(
    {
      type: `table`,
      align: t.map(function (e) {
        return e === `none` ? null : e;
      }),
      children: [],
    },
    e,
  ),
    (this.data.inTable = !0));
}
function Yc(e) {
  (this.exit(e), (this.data.inTable = void 0));
}
function Xc(e) {
  this.enter({ type: `tableRow`, children: [] }, e);
}
function Zc(e) {
  this.exit(e);
}
function Qc(e) {
  this.enter({ type: `tableCell`, children: [] }, e);
}
function $c(e) {
  let t = this.resume();
  this.data.inTable && (t = t.replace(/\\([\\|])/g, el));
  let n = this.stack[this.stack.length - 1];
  (n.type, (n.value = t), this.exit(e));
}
function el(e, t) {
  return t === `|` ? t : e;
}
function tl(e) {
  let t = e || {},
    n = t.tableCellPadding,
    r = t.tablePipeAlign,
    i = t.stringLength,
    a = n ? ` ` : `|`;
  return {
    unsafe: [
      { character: `\r`, inConstruct: `tableCell` },
      {
        character: `
`,
        inConstruct: `tableCell`,
      },
      { atBreak: !0, character: `|`, after: `[	 :-]` },
      { character: `|`, inConstruct: `tableCell` },
      { atBreak: !0, character: `:`, after: `-` },
      { atBreak: !0, character: `-`, after: `[:|-]` },
    ],
    handlers: { inlineCode: f, table: o, tableCell: c, tableRow: s },
  };
  function o(e, t, n, r) {
    return l(u(e, n, r), e.align);
  }
  function s(e, t, n, r) {
    let i = l([d(e, n, r)]);
    return i.slice(
      0,
      i.indexOf(`
`),
    );
  }
  function c(e, t, n, r) {
    let i = n.enter(`tableCell`),
      o = n.enter(`phrasing`),
      s = n.containerPhrasing(e, { ...r, before: a, after: a });
    return (o(), i(), s);
  }
  function l(e, t) {
    return Rs(e, { align: t, alignDelimiters: r, padding: n, stringLength: i });
  }
  function u(e, t, n) {
    let r = e.children,
      i = -1,
      a = [],
      o = t.enter(`table`);
    for (; ++i < r.length; ) a[i] = d(r[i], t, n);
    return (o(), a);
  }
  function d(e, t, n) {
    let r = e.children,
      i = -1,
      a = [],
      o = t.enter(`tableRow`);
    for (; ++i < r.length; ) a[i] = c(r[i], e, t, n);
    return (o(), a);
  }
  function f(e, t, n) {
    let r = Bc.inlineCode(e, t, n);
    return (n.stack.includes(`tableCell`) && (r = r.replace(/\|/g, `\\$&`)), r);
  }
}
function nl() {
  return {
    exit: {
      taskListCheckValueChecked: il,
      taskListCheckValueUnchecked: il,
      paragraph: al,
    },
  };
}
function rl() {
  return {
    unsafe: [{ atBreak: !0, character: `-`, after: `[:|-]` }],
    handlers: { listItem: ol },
  };
}
function il(e) {
  let t = this.stack[this.stack.length - 2];
  (t.type, (t.checked = e.type === `taskListCheckValueChecked`));
}
function al(e) {
  let t = this.stack[this.stack.length - 2];
  if (t && t.type === `listItem` && typeof t.checked == `boolean`) {
    let e = this.stack[this.stack.length - 1];
    e.type;
    let n = e.children[0];
    if (n && n.type === `text`) {
      let r = t.children,
        i = -1,
        a;
      for (; ++i < r.length; ) {
        let e = r[i];
        if (e.type === `paragraph`) {
          a = e;
          break;
        }
      }
      a === e &&
        ((n.value = n.value.slice(1)),
        n.value.length === 0
          ? e.children.shift()
          : e.position &&
            n.position &&
            typeof n.position.start.offset == `number` &&
            (n.position.start.column++,
            n.position.start.offset++,
            (e.position.start = Object.assign({}, n.position.start))));
    }
  }
  this.exit(e);
}
function ol(e, t, n, r) {
  let i = e.children[0],
    a = typeof e.checked == `boolean` && i && i.type === `paragraph`,
    o = `[` + (e.checked ? `x` : ` `) + `] `,
    s = n.createTracker(r);
  a && s.move(o);
  let c = Bc.listItem(e, t, n, { ...r, ...s.current() });
  return (a && (c = c.replace(/^(?:[*+-]|\d+\.)([\r\n]| {1,3})/, l)), c);
  function l(e) {
    return e + o;
  }
}
function sl() {
  return [ts(), Es(), js(), qc(), nl()];
}
function cl(e) {
  return { extensions: [ns(), Ds(e), Ms(), tl(e), rl()] };
}
var ll = {}.hasOwnProperty;
function ul(e) {
  let t = {},
    n = -1;
  for (; ++n < e.length; ) dl(t, e[n]);
  return t;
}
function dl(e, t) {
  let n;
  for (n in t) {
    let r = (ll.call(e, n) ? e[n] : void 0) || (e[n] = {}),
      i = t[n],
      a;
    if (i)
      for (a in i) {
        ll.call(r, a) || (r[a] = []);
        let e = i[a];
        fl(r[a], Array.isArray(e) ? e : e ? [e] : []);
      }
  }
}
function fl(e, t) {
  let n = -1,
    r = [];
  for (; ++n < t.length; ) (t[n].add === `after` ? e : r).push(t[n]);
  S(e, 0, 0, r);
}
var pl = { tokenize: Dl, partial: !0 },
  ml = { tokenize: Ol, partial: !0 },
  hl = { tokenize: kl, partial: !0 },
  gl = { tokenize: Al, partial: !0 },
  _l = { tokenize: jl, partial: !0 },
  vl = { name: `wwwAutolink`, tokenize: Tl, previous: Ml },
  yl = { name: `protocolAutolink`, tokenize: El, previous: Nl },
  bl = { name: `emailAutolink`, tokenize: wl, previous: Pl },
  xl = {};
function Sl() {
  return { text: xl };
}
for (var Cl = 48; Cl < 123; )
  ((xl[Cl] = bl), Cl++, Cl === 58 ? (Cl = 65) : Cl === 91 && (Cl = 97));
((xl[43] = bl),
  (xl[45] = bl),
  (xl[46] = bl),
  (xl[95] = bl),
  (xl[72] = [bl, yl]),
  (xl[104] = [bl, yl]),
  (xl[87] = [bl, vl]),
  (xl[119] = [bl, vl]));
function wl(e, t, n) {
  let r = this,
    i,
    a;
  return o;
  function o(t) {
    return !Fl(t) || !Pl.call(r, r.previous) || Il(r.events)
      ? n(t)
      : (e.enter(`literalAutolink`), e.enter(`literalAutolinkEmail`), s(t));
  }
  function s(t) {
    return Fl(t) ? (e.consume(t), s) : t === 64 ? (e.consume(t), c) : n(t);
  }
  function c(t) {
    return t === 46
      ? e.check(_l, f, d)(t)
      : t === 45 || t === 95 || u(t)
        ? ((a = !0), e.consume(t), c)
        : f(t);
  }
  function d(t) {
    return (e.consume(t), (i = !0), c);
  }
  function f(o) {
    return a && i && l(r.previous)
      ? (e.exit(`literalAutolinkEmail`), e.exit(`literalAutolink`), t(o))
      : n(o);
  }
}
function Tl(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return (t !== 87 && t !== 119) || !Ml.call(r, r.previous) || Il(r.events)
      ? n(t)
      : (e.enter(`literalAutolink`),
        e.enter(`literalAutolinkWww`),
        e.check(pl, e.attempt(ml, e.attempt(hl, a), n), n)(t));
  }
  function a(n) {
    return (e.exit(`literalAutolinkWww`), e.exit(`literalAutolink`), t(n));
  }
}
function El(e, t, n) {
  let r = this,
    i = ``,
    a = !1;
  return o;
  function o(t) {
    return (t === 72 || t === 104) && Nl.call(r, r.previous) && !Il(r.events)
      ? (e.enter(`literalAutolink`),
        e.enter(`literalAutolinkHttp`),
        (i += String.fromCodePoint(t)),
        e.consume(t),
        s)
      : n(t);
  }
  function s(t) {
    if (l(t) && i.length < 5)
      return ((i += String.fromCodePoint(t)), e.consume(t), s);
    if (t === 58) {
      let n = i.toLowerCase();
      if (n === `http` || n === `https`) return (e.consume(t), c);
    }
    return n(t);
  }
  function c(t) {
    return t === 47 ? (e.consume(t), a ? u : ((a = !0), c)) : n(t);
  }
  function u(t) {
    return t === null || f(t) || _(t) || b(t) || y(t)
      ? n(t)
      : e.attempt(ml, e.attempt(hl, d), n)(t);
  }
  function d(n) {
    return (e.exit(`literalAutolinkHttp`), e.exit(`literalAutolink`), t(n));
  }
}
function Dl(e, t, n) {
  let r = 0;
  return i;
  function i(t) {
    return (t === 87 || t === 119) && r < 3
      ? (r++, e.consume(t), i)
      : t === 46 && r === 3
        ? (e.consume(t), a)
        : n(t);
  }
  function a(e) {
    return e === null ? n(e) : t(e);
  }
}
function Ol(e, t, n) {
  let r, i, a;
  return o;
  function o(t) {
    return t === 46 || t === 95
      ? e.check(gl, c, s)(t)
      : t === null || _(t) || b(t) || (t !== 45 && y(t))
        ? c(t)
        : ((a = !0), e.consume(t), o);
  }
  function s(t) {
    return (t === 95 ? (r = !0) : ((i = r), (r = void 0)), e.consume(t), o);
  }
  function c(e) {
    return i || r || !a ? n(e) : t(e);
  }
}
function kl(e, t) {
  let n = 0,
    r = 0;
  return i;
  function i(o) {
    return o === 40
      ? (n++, e.consume(o), i)
      : o === 41 && r < n
        ? a(o)
        : o === 33 ||
            o === 34 ||
            o === 38 ||
            o === 39 ||
            o === 41 ||
            o === 42 ||
            o === 44 ||
            o === 46 ||
            o === 58 ||
            o === 59 ||
            o === 60 ||
            o === 63 ||
            o === 93 ||
            o === 95 ||
            o === 126
          ? e.check(gl, t, a)(o)
          : o === null || _(o) || b(o)
            ? t(o)
            : (e.consume(o), i);
  }
  function a(t) {
    return (t === 41 && r++, e.consume(t), i);
  }
}
function Al(e, t, n) {
  return r;
  function r(o) {
    return o === 33 ||
      o === 34 ||
      o === 39 ||
      o === 41 ||
      o === 42 ||
      o === 44 ||
      o === 46 ||
      o === 58 ||
      o === 59 ||
      o === 63 ||
      o === 95 ||
      o === 126
      ? (e.consume(o), r)
      : o === 38
        ? (e.consume(o), a)
        : o === 93
          ? (e.consume(o), i)
          : o === 60 || o === null || _(o) || b(o)
            ? t(o)
            : n(o);
  }
  function i(e) {
    return e === null || e === 40 || e === 91 || _(e) || b(e) ? t(e) : r(e);
  }
  function a(e) {
    return l(e) ? o(e) : n(e);
  }
  function o(t) {
    return t === 59 ? (e.consume(t), r) : l(t) ? (e.consume(t), o) : n(t);
  }
}
function jl(e, t, n) {
  return r;
  function r(t) {
    return (e.consume(t), i);
  }
  function i(e) {
    return u(e) ? n(e) : t(e);
  }
}
function Ml(e) {
  return (
    e === null ||
    e === 40 ||
    e === 42 ||
    e === 95 ||
    e === 91 ||
    e === 93 ||
    e === 126 ||
    _(e)
  );
}
function Nl(e) {
  return !l(e);
}
function Pl(e) {
  return !(e === 47 || Fl(e));
}
function Fl(e) {
  return e === 43 || e === 45 || e === 46 || e === 95 || u(e);
}
function Il(e) {
  let t = e.length,
    n = !1;
  for (; t--; ) {
    let r = e[t][1];
    if ((r.type === `labelLink` || r.type === `labelImage`) && !r._balanced) {
      n = !0;
      break;
    }
    if (r._gfmAutolinkLiteralWalkedInto) {
      n = !1;
      break;
    }
  }
  return (
    e.length > 0 &&
      !n &&
      (e[e.length - 1][1]._gfmAutolinkLiteralWalkedInto = !0),
    n
  );
}
function Ll(e) {
  let t = [],
    n = -1,
    r = 0,
    i = 0;
  for (; ++n < e.length; ) {
    let a = e.charCodeAt(n),
      o = ``;
    if (a === 37 && u(e.charCodeAt(n + 1)) && u(e.charCodeAt(n + 2))) i = 2;
    else if (a < 128)
      /[!#$&-;=?-Z_a-z~]/.test(String.fromCharCode(a)) ||
        (o = String.fromCharCode(a));
    else if (a > 55295 && a < 57344) {
      let t = e.charCodeAt(n + 1);
      a < 56320 && t > 56319 && t < 57344
        ? ((o = String.fromCharCode(a, t)), (i = 1))
        : (o = `�`);
    } else o = String.fromCharCode(a);
    ((o &&=
      (t.push(e.slice(r, n), encodeURIComponent(o)), (r = n + i + 1), ``)),
      (i &&= ((n += i), 0)));
  }
  return t.join(``) + e.slice(r);
}
var Rl = { name: `attention`, resolveAll: zl, tokenize: Bl };
function zl(e, t) {
  let n = -1,
    r,
    i,
    a,
    o,
    s,
    c,
    l,
    u;
  for (; ++n < e.length; )
    if (
      e[n][0] === `enter` &&
      e[n][1].type === `attentionSequence` &&
      e[n][1]._close
    ) {
      for (r = n; r--; )
        if (
          e[r][0] === `exit` &&
          e[r][1].type === `attentionSequence` &&
          e[r][1]._open &&
          t.sliceSerialize(e[r][1]).charCodeAt(0) ===
            t.sliceSerialize(e[n][1]).charCodeAt(0)
        ) {
          if (
            (e[r][1]._close || e[n][1]._open) &&
            (e[n][1].end.offset - e[n][1].start.offset) % 3 &&
            !(
              (e[r][1].end.offset -
                e[r][1].start.offset +
                e[n][1].end.offset -
                e[n][1].start.offset) %
              3
            )
          )
            continue;
          c =
            e[r][1].end.offset - e[r][1].start.offset > 1 &&
            e[n][1].end.offset - e[n][1].start.offset > 1
              ? 2
              : 1;
          let d = { ...e[r][1].end },
            f = { ...e[n][1].start };
          (Vl(d, -c),
            Vl(f, c),
            (o = {
              type: c > 1 ? `strongSequence` : `emphasisSequence`,
              start: d,
              end: { ...e[r][1].end },
            }),
            (s = {
              type: c > 1 ? `strongSequence` : `emphasisSequence`,
              start: { ...e[n][1].start },
              end: f,
            }),
            (a = {
              type: c > 1 ? `strongText` : `emphasisText`,
              start: { ...e[r][1].end },
              end: { ...e[n][1].start },
            }),
            (i = {
              type: c > 1 ? `strong` : `emphasis`,
              start: { ...o.start },
              end: { ...s.end },
            }),
            (e[r][1].end = { ...o.start }),
            (e[n][1].start = { ...s.end }),
            (l = []),
            e[r][1].end.offset - e[r][1].start.offset &&
              (l = C(l, [
                [`enter`, e[r][1], t],
                [`exit`, e[r][1], t],
              ])),
            (l = C(l, [
              [`enter`, i, t],
              [`enter`, o, t],
              [`exit`, o, t],
              [`enter`, a, t],
            ])),
            (l = C(
              l,
              w(t.parser.constructs.insideSpan.null, e.slice(r + 1, n), t),
            )),
            (l = C(l, [
              [`exit`, a, t],
              [`enter`, s, t],
              [`exit`, s, t],
              [`exit`, i, t],
            ])),
            e[n][1].end.offset - e[n][1].start.offset
              ? ((u = 2),
                (l = C(l, [
                  [`enter`, e[n][1], t],
                  [`exit`, e[n][1], t],
                ])))
              : (u = 0),
            S(e, r - 1, n - r + 3, l),
            (n = r + l.length - u - 2));
          break;
        }
    }
  for (n = -1; ++n < e.length; )
    e[n][1].type === `attentionSequence` && (e[n][1].type = `data`);
  return e;
}
function Bl(e, t) {
  let n = this.parser.constructs.attentionMarkers.null,
    r = this.previous,
    i = ec(r),
    a;
  return o;
  function o(t) {
    return ((a = t), e.enter(`attentionSequence`), s(t));
  }
  function s(o) {
    if (o === a) return (e.consume(o), s);
    let c = e.exit(`attentionSequence`),
      l = ec(o),
      u = !l || (l === 2 && i) || n.includes(o),
      d = !i || (i === 2 && l) || n.includes(r);
    return (
      (c._open = !!(a === 42 ? u : u && (i || !d))),
      (c._close = !!(a === 42 ? d : d && (l || !u))),
      t(o)
    );
  }
}
function Vl(e, t) {
  ((e.column += t), (e.offset += t), (e._bufferIndex += t));
}
var Hl = { name: `autolink`, tokenize: Ul };
function Ul(e, t, n) {
  let r = 0;
  return i;
  function i(t) {
    return (
      e.enter(`autolink`),
      e.enter(`autolinkMarker`),
      e.consume(t),
      e.exit(`autolinkMarker`),
      e.enter(`autolinkProtocol`),
      a
    );
  }
  function a(t) {
    return l(t) ? (e.consume(t), o) : t === 64 ? n(t) : p(t);
  }
  function o(e) {
    return e === 43 || e === 45 || e === 46 || u(e) ? ((r = 1), s(e)) : p(e);
  }
  function s(t) {
    return t === 58
      ? (e.consume(t), (r = 0), c)
      : (t === 43 || t === 45 || t === 46 || u(t)) && r++ < 32
        ? (e.consume(t), s)
        : ((r = 0), p(t));
  }
  function c(r) {
    return r === 62
      ? (e.exit(`autolinkProtocol`),
        e.enter(`autolinkMarker`),
        e.consume(r),
        e.exit(`autolinkMarker`),
        e.exit(`autolink`),
        t)
      : r === null || r === 32 || r === 60 || f(r)
        ? n(r)
        : (e.consume(r), c);
  }
  function p(t) {
    return t === 64 ? (e.consume(t), m) : d(t) ? (e.consume(t), p) : n(t);
  }
  function m(e) {
    return u(e) ? h(e) : n(e);
  }
  function h(n) {
    return n === 46
      ? (e.consume(n), (r = 0), m)
      : n === 62
        ? ((e.exit(`autolinkProtocol`).type = `autolinkEmail`),
          e.enter(`autolinkMarker`),
          e.consume(n),
          e.exit(`autolinkMarker`),
          e.exit(`autolink`),
          t)
        : g(n);
  }
  function g(t) {
    if ((t === 45 || u(t)) && r++ < 63) {
      let n = t === 45 ? g : h;
      return (e.consume(t), n);
    }
    return n(t);
  }
}
var Wl = { partial: !0, tokenize: Gl };
function Gl(e, t, n) {
  return r;
  function r(t) {
    return v(t) ? I(e, i, `linePrefix`)(t) : i(t);
  }
  function i(e) {
    return e === null || g(e) ? t(e) : n(e);
  }
}
var Kl = {
  continuation: { tokenize: Jl },
  exit: Yl,
  name: `blockQuote`,
  tokenize: ql,
};
function ql(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    if (t === 62) {
      let n = r.containerState;
      return (
        (n.open ||= (e.enter(`blockQuote`, { _container: !0 }), !0)),
        e.enter(`blockQuotePrefix`),
        e.enter(`blockQuoteMarker`),
        e.consume(t),
        e.exit(`blockQuoteMarker`),
        a
      );
    }
    return n(t);
  }
  function a(n) {
    return v(n)
      ? (e.enter(`blockQuotePrefixWhitespace`),
        e.consume(n),
        e.exit(`blockQuotePrefixWhitespace`),
        e.exit(`blockQuotePrefix`),
        t)
      : (e.exit(`blockQuotePrefix`), t(n));
  }
}
function Jl(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return v(t)
      ? I(
          e,
          a,
          `linePrefix`,
          r.parser.constructs.disable.null.includes(`codeIndented`)
            ? void 0
            : 4,
        )(t)
      : a(t);
  }
  function a(r) {
    return e.attempt(Kl, t, n)(r);
  }
}
function Yl(e) {
  e.exit(`blockQuote`);
}
var Xl = { name: `characterEscape`, tokenize: Zl };
function Zl(e, t, n) {
  return r;
  function r(t) {
    return (
      e.enter(`characterEscape`),
      e.enter(`escapeMarker`),
      e.consume(t),
      e.exit(`escapeMarker`),
      i
    );
  }
  function i(r) {
    return h(r)
      ? (e.enter(`characterEscapeValue`),
        e.consume(r),
        e.exit(`characterEscapeValue`),
        e.exit(`characterEscape`),
        t)
      : n(r);
  }
}
var Ql = { name: `characterReference`, tokenize: $l };
function $l(e, t, n) {
  let r = this,
    i = 0,
    a,
    o;
  return s;
  function s(t) {
    return (
      e.enter(`characterReference`),
      e.enter(`characterReferenceMarker`),
      e.consume(t),
      e.exit(`characterReferenceMarker`),
      c
    );
  }
  function c(t) {
    return t === 35
      ? (e.enter(`characterReferenceMarkerNumeric`),
        e.consume(t),
        e.exit(`characterReferenceMarkerNumeric`),
        l)
      : (e.enter(`characterReferenceValue`), (a = 31), (o = u), d(t));
  }
  function l(t) {
    return t === 88 || t === 120
      ? (e.enter(`characterReferenceMarkerHexadecimal`),
        e.consume(t),
        e.exit(`characterReferenceMarkerHexadecimal`),
        e.enter(`characterReferenceValue`),
        (a = 6),
        (o = m),
        d)
      : (e.enter(`characterReferenceValue`), (a = 7), (o = p), d(t));
  }
  function d(s) {
    if (s === 59 && i) {
      let i = e.exit(`characterReferenceValue`);
      return o === u && !Hc(r.sliceSerialize(i))
        ? n(s)
        : (e.enter(`characterReferenceMarker`),
          e.consume(s),
          e.exit(`characterReferenceMarker`),
          e.exit(`characterReference`),
          t);
    }
    return o(s) && i++ < a ? (e.consume(s), d) : n(s);
  }
}
var eu = { partial: !0, tokenize: ru },
  tu = { concrete: !0, name: `codeFenced`, tokenize: nu };
function nu(e, t, n) {
  let r = this,
    i = { partial: !0, tokenize: C },
    a = 0,
    o = 0,
    s;
  return c;
  function c(e) {
    return l(e);
  }
  function l(t) {
    let n = r.events[r.events.length - 1];
    return (
      (a =
        n && n[1].type === `linePrefix`
          ? n[2].sliceSerialize(n[1], !0).length
          : 0),
      (s = t),
      e.enter(`codeFenced`),
      e.enter(`codeFencedFence`),
      e.enter(`codeFencedFenceSequence`),
      u(t)
    );
  }
  function u(t) {
    return t === s
      ? (o++, e.consume(t), u)
      : o < 3
        ? n(t)
        : (e.exit(`codeFencedFenceSequence`),
          v(t) ? I(e, d, `whitespace`)(t) : d(t));
  }
  function d(n) {
    return n === null || g(n)
      ? (e.exit(`codeFencedFence`), r.interrupt ? t(n) : e.check(eu, h, S)(n))
      : (e.enter(`codeFencedFenceInfo`),
        e.enter(`chunkString`, { contentType: `string` }),
        f(n));
  }
  function f(t) {
    return t === null || g(t)
      ? (e.exit(`chunkString`), e.exit(`codeFencedFenceInfo`), d(t))
      : v(t)
        ? (e.exit(`chunkString`),
          e.exit(`codeFencedFenceInfo`),
          I(e, p, `whitespace`)(t))
        : t === 96 && t === s
          ? n(t)
          : (e.consume(t), f);
  }
  function p(t) {
    return t === null || g(t)
      ? d(t)
      : (e.enter(`codeFencedFenceMeta`),
        e.enter(`chunkString`, { contentType: `string` }),
        m(t));
  }
  function m(t) {
    return t === null || g(t)
      ? (e.exit(`chunkString`), e.exit(`codeFencedFenceMeta`), d(t))
      : t === 96 && t === s
        ? n(t)
        : (e.consume(t), m);
  }
  function h(t) {
    return e.attempt(i, S, _)(t);
  }
  function _(t) {
    return (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), y);
  }
  function y(t) {
    return a > 0 && v(t) ? I(e, b, `linePrefix`, a + 1)(t) : b(t);
  }
  function b(t) {
    return t === null || g(t)
      ? e.check(eu, h, S)(t)
      : (e.enter(`codeFlowValue`), x(t));
  }
  function x(t) {
    return t === null || g(t)
      ? (e.exit(`codeFlowValue`), b(t))
      : (e.consume(t), x);
  }
  function S(n) {
    return (e.exit(`codeFenced`), t(n));
  }
  function C(e, t, n) {
    let i = 0;
    return a;
    function a(t) {
      return (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), c);
    }
    function c(t) {
      return (
        e.enter(`codeFencedFence`),
        v(t)
          ? I(
              e,
              l,
              `linePrefix`,
              r.parser.constructs.disable.null.includes(`codeIndented`)
                ? void 0
                : 4,
            )(t)
          : l(t)
      );
    }
    function l(t) {
      return t === s ? (e.enter(`codeFencedFenceSequence`), u(t)) : n(t);
    }
    function u(t) {
      return t === s
        ? (i++, e.consume(t), u)
        : i >= o
          ? (e.exit(`codeFencedFenceSequence`),
            v(t) ? I(e, d, `whitespace`)(t) : d(t))
          : n(t);
    }
    function d(r) {
      return r === null || g(r) ? (e.exit(`codeFencedFence`), t(r)) : n(r);
    }
  }
}
function ru(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return t === null
      ? n(t)
      : (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), a);
  }
  function a(e) {
    return r.parser.lazy[r.now().line] ? n(e) : t(e);
  }
}
var iu = { name: `codeIndented`, tokenize: ou },
  au = { partial: !0, tokenize: su };
function ou(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return (e.enter(`codeIndented`), I(e, a, `linePrefix`, 5)(t));
  }
  function a(e) {
    let t = r.events[r.events.length - 1];
    return t &&
      t[1].type === `linePrefix` &&
      t[2].sliceSerialize(t[1], !0).length >= 4
      ? o(e)
      : n(e);
  }
  function o(t) {
    return t === null
      ? c(t)
      : g(t)
        ? e.attempt(au, o, c)(t)
        : (e.enter(`codeFlowValue`), s(t));
  }
  function s(t) {
    return t === null || g(t)
      ? (e.exit(`codeFlowValue`), o(t))
      : (e.consume(t), s);
  }
  function c(n) {
    return (e.exit(`codeIndented`), t(n));
  }
}
function su(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return r.parser.lazy[r.now().line]
      ? n(t)
      : g(t)
        ? (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), i)
        : I(e, a, `linePrefix`, 5)(t);
  }
  function a(e) {
    let a = r.events[r.events.length - 1];
    return a &&
      a[1].type === `linePrefix` &&
      a[2].sliceSerialize(a[1], !0).length >= 4
      ? t(e)
      : g(e)
        ? i(e)
        : n(e);
  }
}
var cu = { name: `codeText`, previous: uu, resolve: lu, tokenize: du };
function lu(e) {
  let t = e.length - 4,
    n = 3,
    r,
    i;
  if (
    (e[n][1].type === `lineEnding` || e[n][1].type === `space`) &&
    (e[t][1].type === `lineEnding` || e[t][1].type === `space`)
  ) {
    for (r = n; ++r < t; )
      if (e[r][1].type === `codeTextData`) {
        ((e[n][1].type = `codeTextPadding`),
          (e[t][1].type = `codeTextPadding`),
          (n += 2),
          (t -= 2));
        break;
      }
  }
  for (r = n - 1, t++; ++r <= t; )
    i === void 0
      ? r !== t && e[r][1].type !== `lineEnding` && (i = r)
      : (r === t || e[r][1].type === `lineEnding`) &&
        ((e[i][1].type = `codeTextData`),
        r !== i + 2 &&
          ((e[i][1].end = e[r - 1][1].end),
          e.splice(i + 2, r - i - 2),
          (t -= r - i - 2),
          (r = i + 2)),
        (i = void 0));
  return e;
}
function uu(e) {
  return (
    e !== 96 ||
    this.events[this.events.length - 1][1].type === `characterEscape`
  );
}
function du(e, t, n) {
  let r = 0,
    i,
    a;
  return o;
  function o(t) {
    return (e.enter(`codeText`), e.enter(`codeTextSequence`), s(t));
  }
  function s(t) {
    return t === 96
      ? (e.consume(t), r++, s)
      : (e.exit(`codeTextSequence`), c(t));
  }
  function c(t) {
    return t === null
      ? n(t)
      : t === 32
        ? (e.enter(`space`), e.consume(t), e.exit(`space`), c)
        : t === 96
          ? ((a = e.enter(`codeTextSequence`)), (i = 0), u(t))
          : g(t)
            ? (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), c)
            : (e.enter(`codeTextData`), l(t));
  }
  function l(t) {
    return t === null || t === 32 || t === 96 || g(t)
      ? (e.exit(`codeTextData`), c(t))
      : (e.consume(t), l);
  }
  function u(n) {
    return n === 96
      ? (e.consume(n), i++, u)
      : i === r
        ? (e.exit(`codeTextSequence`), e.exit(`codeText`), t(n))
        : ((a.type = `codeTextData`), l(n));
  }
}
var fu = class {
  constructor(e) {
    ((this.left = e ? [...e] : []), (this.right = []));
  }
  get(e) {
    if (e < 0 || e >= this.left.length + this.right.length)
      throw RangeError(
        "Cannot access index `" +
          e +
          "` in a splice buffer of size `" +
          (this.left.length + this.right.length) +
          "`",
      );
    return e < this.left.length
      ? this.left[e]
      : this.right[this.right.length - e + this.left.length - 1];
  }
  get length() {
    return this.left.length + this.right.length;
  }
  shift() {
    return (this.setCursor(0), this.right.pop());
  }
  slice(e, t) {
    let n = t ?? 1 / 0;
    return n < this.left.length
      ? this.left.slice(e, n)
      : e > this.left.length
        ? this.right
            .slice(
              this.right.length - n + this.left.length,
              this.right.length - e + this.left.length,
            )
            .reverse()
        : this.left
            .slice(e)
            .concat(
              this.right
                .slice(this.right.length - n + this.left.length)
                .reverse(),
            );
  }
  splice(e, t, n) {
    let r = t || 0;
    this.setCursor(Math.trunc(e));
    let i = this.right.splice(this.right.length - r, 1 / 0);
    return (n && pu(this.left, n), i.reverse());
  }
  pop() {
    return (this.setCursor(1 / 0), this.left.pop());
  }
  push(e) {
    (this.setCursor(1 / 0), this.left.push(e));
  }
  pushMany(e) {
    (this.setCursor(1 / 0), pu(this.left, e));
  }
  unshift(e) {
    (this.setCursor(0), this.right.push(e));
  }
  unshiftMany(e) {
    (this.setCursor(0), pu(this.right, e.reverse()));
  }
  setCursor(e) {
    if (
      !(
        e === this.left.length ||
        (e > this.left.length && this.right.length === 0) ||
        (e < 0 && this.left.length === 0)
      )
    )
      if (e < this.left.length) {
        let t = this.left.splice(e, 1 / 0);
        pu(this.right, t.reverse());
      } else {
        let t = this.right.splice(
          this.left.length + this.right.length - e,
          1 / 0,
        );
        pu(this.left, t.reverse());
      }
  }
};
function pu(e, t) {
  let n = 0;
  if (t.length < 1e4) e.push(...t);
  else for (; n < t.length; ) (e.push(...t.slice(n, n + 1e4)), (n += 1e4));
}
function mu(e) {
  let t = {},
    n = -1,
    r,
    i,
    a,
    o,
    s,
    c,
    l,
    u = new fu(e);
  for (; ++n < u.length; ) {
    for (; n in t; ) n = t[n];
    if (
      ((r = u.get(n)),
      n &&
        r[1].type === `chunkFlow` &&
        u.get(n - 1)[1].type === `listItemPrefix` &&
        ((c = r[1]._tokenizer.events),
        (a = 0),
        a < c.length && c[a][1].type === `lineEndingBlank` && (a += 2),
        a < c.length && c[a][1].type === `content`))
    )
      for (; ++a < c.length && c[a][1].type !== `content`; )
        c[a][1].type === `chunkText` &&
          ((c[a][1]._isInFirstContentOfListItem = !0), a++);
    if (r[0] === `enter`)
      r[1].contentType && (Object.assign(t, hu(u, n)), (n = t[n]), (l = !0));
    else if (r[1]._container) {
      for (a = n, i = void 0; a--; )
        if (
          ((o = u.get(a)),
          o[1].type === `lineEnding` || o[1].type === `lineEndingBlank`)
        )
          o[0] === `enter` &&
            (i && (u.get(i)[1].type = `lineEndingBlank`),
            (o[1].type = `lineEnding`),
            (i = a));
        else if (
          !(o[1].type === `linePrefix` || o[1].type === `listItemIndent`)
        )
          break;
      i &&
        ((r[1].end = { ...u.get(i)[1].start }),
        (s = u.slice(i, n)),
        s.unshift(r),
        u.splice(i, n - i + 1, s));
    }
  }
  return (S(e, 0, 1 / 0, u.slice(0)), !l);
}
function hu(e, t) {
  let n = e.get(t)[1],
    r = e.get(t)[2],
    i = t - 1,
    a = [],
    o = n._tokenizer;
  o ||
    ((o = r.parser[n.contentType](n.start)),
    n._contentTypeTextTrailing && (o._contentTypeTextTrailing = !0));
  let s = o.events,
    c = [],
    l = {},
    u,
    d,
    f = -1,
    p = n,
    m = 0,
    h = 0,
    g = [h];
  for (; p; ) {
    for (; e.get(++i)[1] !== p; );
    (a.push(i),
      p._tokenizer ||
        ((u = r.sliceStream(p)),
        p.next || u.push(null),
        d && o.defineSkip(p.start),
        p._isInFirstContentOfListItem &&
          (o._gfmTasklistFirstContentOfListItem = !0),
        o.write(u),
        p._isInFirstContentOfListItem &&
          (o._gfmTasklistFirstContentOfListItem = void 0)),
      (d = p),
      (p = p.next));
  }
  for (p = n; ++f < s.length; )
    s[f][0] === `exit` &&
      s[f - 1][0] === `enter` &&
      s[f][1].type === s[f - 1][1].type &&
      s[f][1].start.line !== s[f][1].end.line &&
      ((h = f + 1),
      g.push(h),
      (p._tokenizer = void 0),
      (p.previous = void 0),
      (p = p.next));
  for (
    o.events = [],
      p ? ((p._tokenizer = void 0), (p.previous = void 0)) : g.pop(),
      f = g.length;
    f--;
  ) {
    let t = s.slice(g[f], g[f + 1]),
      n = a.pop();
    (c.push([n, n + t.length - 1]), e.splice(n, 2, t));
  }
  for (c.reverse(), f = -1; ++f < c.length; )
    ((l[m + c[f][0]] = m + c[f][1]), (m += c[f][1] - c[f][0] - 1));
  return l;
}
var gu = { resolve: vu, tokenize: yu },
  _u = { partial: !0, tokenize: bu };
function vu(e) {
  return (mu(e), e);
}
function yu(e, t) {
  let n;
  return r;
  function r(t) {
    return (
      e.enter(`content`),
      (n = e.enter(`chunkContent`, { contentType: `content` })),
      i(t)
    );
  }
  function i(t) {
    return t === null ? a(t) : g(t) ? e.check(_u, o, a)(t) : (e.consume(t), i);
  }
  function a(n) {
    return (e.exit(`chunkContent`), e.exit(`content`), t(n));
  }
  function o(t) {
    return (
      e.consume(t),
      e.exit(`chunkContent`),
      (n.next = e.enter(`chunkContent`, {
        contentType: `content`,
        previous: n,
      })),
      (n = n.next),
      i
    );
  }
}
function bu(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return (
      e.exit(`chunkContent`),
      e.enter(`lineEnding`),
      e.consume(t),
      e.exit(`lineEnding`),
      I(e, a, `linePrefix`)
    );
  }
  function a(i) {
    if (i === null || g(i)) return n(i);
    let a = r.events[r.events.length - 1];
    return !r.parser.constructs.disable.null.includes(`codeIndented`) &&
      a &&
      a[1].type === `linePrefix` &&
      a[2].sliceSerialize(a[1], !0).length >= 4
      ? t(i)
      : e.interrupt(r.parser.constructs.flow, n, t)(i);
  }
}
function xu(e, t, n, r, i, a, o, s, c) {
  let l = c || 1 / 0,
    u = 0;
  return d;
  function d(t) {
    return t === 60
      ? (e.enter(r), e.enter(i), e.enter(a), e.consume(t), e.exit(a), p)
      : t === null || t === 32 || t === 41 || f(t)
        ? n(t)
        : (e.enter(r),
          e.enter(o),
          e.enter(s),
          e.enter(`chunkString`, { contentType: `string` }),
          v(t));
  }
  function p(n) {
    return n === 62
      ? (e.enter(a), e.consume(n), e.exit(a), e.exit(i), e.exit(r), t)
      : (e.enter(s), e.enter(`chunkString`, { contentType: `string` }), m(n));
  }
  function m(t) {
    return t === 62
      ? (e.exit(`chunkString`), e.exit(s), p(t))
      : t === null || t === 60 || g(t)
        ? n(t)
        : (e.consume(t), t === 92 ? h : m);
  }
  function h(t) {
    return t === 60 || t === 62 || t === 92 ? (e.consume(t), m) : m(t);
  }
  function v(i) {
    return !u && (i === null || i === 41 || _(i))
      ? (e.exit(`chunkString`), e.exit(s), e.exit(o), e.exit(r), t(i))
      : u < l && i === 40
        ? (e.consume(i), u++, v)
        : i === 41
          ? (e.consume(i), u--, v)
          : i === null || i === 32 || i === 40 || f(i)
            ? n(i)
            : (e.consume(i), i === 92 ? y : v);
  }
  function y(t) {
    return t === 40 || t === 41 || t === 92 ? (e.consume(t), v) : v(t);
  }
}
function Su(e, t, n, r, i, a) {
  let o = this,
    s = 0,
    c;
  return l;
  function l(t) {
    return (e.enter(r), e.enter(i), e.consume(t), e.exit(i), e.enter(a), u);
  }
  function u(l) {
    return s > 999 ||
      l === null ||
      l === 91 ||
      (l === 93 && !c) ||
      (l === 94 && !s && `_hiddenFootnoteSupport` in o.parser.constructs)
      ? n(l)
      : l === 93
        ? (e.exit(a), e.enter(i), e.consume(l), e.exit(i), e.exit(r), t)
        : g(l)
          ? (e.enter(`lineEnding`), e.consume(l), e.exit(`lineEnding`), u)
          : (e.enter(`chunkString`, { contentType: `string` }), d(l));
  }
  function d(t) {
    return t === null || t === 91 || t === 93 || g(t) || s++ > 999
      ? (e.exit(`chunkString`), u(t))
      : (e.consume(t), (c ||= !v(t)), t === 92 ? f : d);
  }
  function f(t) {
    return t === 91 || t === 92 || t === 93 ? (e.consume(t), s++, d) : d(t);
  }
}
function Cu(e, t, n, r, i, a) {
  let o;
  return s;
  function s(t) {
    return t === 34 || t === 39 || t === 40
      ? (e.enter(r),
        e.enter(i),
        e.consume(t),
        e.exit(i),
        (o = t === 40 ? 41 : t),
        c)
      : n(t);
  }
  function c(n) {
    return n === o
      ? (e.enter(i), e.consume(n), e.exit(i), e.exit(r), t)
      : (e.enter(a), l(n));
  }
  function l(t) {
    return t === o
      ? (e.exit(a), c(o))
      : t === null
        ? n(t)
        : g(t)
          ? (e.enter(`lineEnding`),
            e.consume(t),
            e.exit(`lineEnding`),
            I(e, l, `linePrefix`))
          : (e.enter(`chunkString`, { contentType: `string` }), u(t));
  }
  function u(t) {
    return t === o || t === null || g(t)
      ? (e.exit(`chunkString`), l(t))
      : (e.consume(t), t === 92 ? d : u);
  }
  function d(t) {
    return t === o || t === 92 ? (e.consume(t), u) : u(t);
  }
}
function wu(e, t) {
  let n;
  return r;
  function r(i) {
    return g(i)
      ? (e.enter(`lineEnding`), e.consume(i), e.exit(`lineEnding`), (n = !0), r)
      : v(i)
        ? I(e, r, n ? `linePrefix` : `lineSuffix`)(i)
        : t(i);
  }
}
var Tu = { name: `definition`, tokenize: Du },
  Eu = { partial: !0, tokenize: Ou };
function Du(e, t, n) {
  let r = this,
    i;
  return a;
  function a(t) {
    return (e.enter(`definition`), o(t));
  }
  function o(t) {
    return Su.call(
      r,
      e,
      s,
      n,
      `definitionLabel`,
      `definitionLabelMarker`,
      `definitionLabelString`,
    )(t);
  }
  function s(t) {
    return (
      (i = hs(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1))),
      t === 58
        ? (e.enter(`definitionMarker`),
          e.consume(t),
          e.exit(`definitionMarker`),
          c)
        : n(t)
    );
  }
  function c(t) {
    return _(t) ? wu(e, l)(t) : l(t);
  }
  function l(t) {
    return xu(
      e,
      u,
      n,
      `definitionDestination`,
      `definitionDestinationLiteral`,
      `definitionDestinationLiteralMarker`,
      `definitionDestinationRaw`,
      `definitionDestinationString`,
    )(t);
  }
  function u(t) {
    return e.attempt(Eu, d, d)(t);
  }
  function d(t) {
    return v(t) ? I(e, f, `whitespace`)(t) : f(t);
  }
  function f(a) {
    return a === null || g(a)
      ? (e.exit(`definition`), r.parser.defined.push(i), t(a))
      : n(a);
  }
}
function Ou(e, t, n) {
  return r;
  function r(t) {
    return _(t) ? wu(e, i)(t) : n(t);
  }
  function i(t) {
    return Cu(
      e,
      a,
      n,
      `definitionTitle`,
      `definitionTitleMarker`,
      `definitionTitleString`,
    )(t);
  }
  function a(t) {
    return v(t) ? I(e, o, `whitespace`)(t) : o(t);
  }
  function o(e) {
    return e === null || g(e) ? t(e) : n(e);
  }
}
var ku = { name: `hardBreakEscape`, tokenize: Au };
function Au(e, t, n) {
  return r;
  function r(t) {
    return (e.enter(`hardBreakEscape`), e.consume(t), i);
  }
  function i(r) {
    return g(r) ? (e.exit(`hardBreakEscape`), t(r)) : n(r);
  }
}
var ju = { name: `headingAtx`, resolve: Mu, tokenize: Nu };
function Mu(e, t) {
  let n = e.length - 2,
    r = 3,
    i,
    a;
  return (
    e[r][1].type === `whitespace` && (r += 2),
    n - 2 > r && e[n][1].type === `whitespace` && (n -= 2),
    e[n][1].type === `atxHeadingSequence` &&
      (r === n - 1 || (n - 4 > r && e[n - 2][1].type === `whitespace`)) &&
      (n -= r + 1 === n ? 2 : 4),
    n > r &&
      ((i = { type: `atxHeadingText`, start: e[r][1].start, end: e[n][1].end }),
      (a = {
        type: `chunkText`,
        start: e[r][1].start,
        end: e[n][1].end,
        contentType: `text`,
      }),
      S(e, r, n - r + 1, [
        [`enter`, i, t],
        [`enter`, a, t],
        [`exit`, a, t],
        [`exit`, i, t],
      ])),
    e
  );
}
function Nu(e, t, n) {
  let r = 0;
  return i;
  function i(t) {
    return (e.enter(`atxHeading`), a(t));
  }
  function a(t) {
    return (e.enter(`atxHeadingSequence`), o(t));
  }
  function o(t) {
    return t === 35 && r++ < 6
      ? (e.consume(t), o)
      : t === null || _(t)
        ? (e.exit(`atxHeadingSequence`), s(t))
        : n(t);
  }
  function s(n) {
    return n === 35
      ? (e.enter(`atxHeadingSequence`), c(n))
      : n === null || g(n)
        ? (e.exit(`atxHeading`), t(n))
        : v(n)
          ? I(e, s, `whitespace`)(n)
          : (e.enter(`atxHeadingText`), l(n));
  }
  function c(t) {
    return t === 35 ? (e.consume(t), c) : (e.exit(`atxHeadingSequence`), s(t));
  }
  function l(t) {
    return t === null || t === 35 || _(t)
      ? (e.exit(`atxHeadingText`), s(t))
      : (e.consume(t), l);
  }
}
var Pu =
    `address.article.aside.base.basefont.blockquote.body.caption.center.col.colgroup.dd.details.dialog.dir.div.dl.dt.fieldset.figcaption.figure.footer.form.frame.frameset.h1.h2.h3.h4.h5.h6.head.header.hr.html.iframe.legend.li.link.main.menu.menuitem.nav.noframes.ol.optgroup.option.p.param.search.section.summary.table.tbody.td.tfoot.th.thead.title.tr.track.ul`.split(
      `.`,
    ),
  Fu = [`pre`, `script`, `style`, `textarea`],
  Iu = { concrete: !0, name: `htmlFlow`, resolveTo: zu, tokenize: Bu },
  Lu = { partial: !0, tokenize: Hu },
  Ru = { partial: !0, tokenize: Vu };
function zu(e) {
  let t = e.length;
  for (; t-- && !(e[t][0] === `enter` && e[t][1].type === `htmlFlow`); );
  return (
    t > 1 &&
      e[t - 2][1].type === `linePrefix` &&
      ((e[t][1].start = e[t - 2][1].start),
      (e[t + 1][1].start = e[t - 2][1].start),
      e.splice(t - 2, 2)),
    e
  );
}
function Bu(e, t, n) {
  let r = this,
    i,
    a,
    o,
    s,
    c;
  return d;
  function d(e) {
    return f(e);
  }
  function f(t) {
    return (e.enter(`htmlFlow`), e.enter(`htmlFlowData`), e.consume(t), p);
  }
  function p(s) {
    return s === 33
      ? (e.consume(s), m)
      : s === 47
        ? (e.consume(s), (a = !0), b)
        : s === 63
          ? (e.consume(s), (i = 3), r.interrupt ? t : ue)
          : l(s)
            ? (e.consume(s), (o = String.fromCharCode(s)), x)
            : n(s);
  }
  function m(a) {
    return a === 45
      ? (e.consume(a), (i = 2), h)
      : a === 91
        ? (e.consume(a), (i = 5), (s = 0), y)
        : l(a)
          ? (e.consume(a), (i = 4), r.interrupt ? t : ue)
          : n(a);
  }
  function h(i) {
    return i === 45 ? (e.consume(i), r.interrupt ? t : ue) : n(i);
  }
  function y(i) {
    return i === `CDATA[`.charCodeAt(s++)
      ? (e.consume(i), s === 6 ? (r.interrupt ? t : O) : y)
      : n(i);
  }
  function b(t) {
    return l(t) ? (e.consume(t), (o = String.fromCharCode(t)), x) : n(t);
  }
  function x(s) {
    if (s === null || s === 47 || s === 62 || _(s)) {
      let c = s === 47,
        l = o.toLowerCase();
      return !c && !a && Fu.includes(l)
        ? ((i = 1), r.interrupt ? t(s) : O(s))
        : Pu.includes(o.toLowerCase())
          ? ((i = 6), c ? (e.consume(s), S) : r.interrupt ? t(s) : O(s))
          : ((i = 7),
            r.interrupt && !r.parser.lazy[r.now().line]
              ? n(s)
              : a
                ? C(s)
                : w(s));
    }
    return s === 45 || u(s)
      ? (e.consume(s), (o += String.fromCharCode(s)), x)
      : n(s);
  }
  function S(i) {
    return i === 62 ? (e.consume(i), r.interrupt ? t : O) : n(i);
  }
  function C(t) {
    return v(t) ? (e.consume(t), C) : re(t);
  }
  function w(t) {
    return t === 47
      ? (e.consume(t), re)
      : t === 58 || t === 95 || l(t)
        ? (e.consume(t), T)
        : v(t)
          ? (e.consume(t), w)
          : re(t);
  }
  function T(t) {
    return t === 45 || t === 46 || t === 58 || t === 95 || u(t)
      ? (e.consume(t), T)
      : E(t);
  }
  function E(t) {
    return t === 61 ? (e.consume(t), D) : v(t) ? (e.consume(t), E) : w(t);
  }
  function D(t) {
    return t === null || t === 60 || t === 61 || t === 62 || t === 96
      ? n(t)
      : t === 34 || t === 39
        ? (e.consume(t), (c = t), ee)
        : v(t)
          ? (e.consume(t), D)
          : te(t);
  }
  function ee(t) {
    return t === c
      ? (e.consume(t), (c = null), ne)
      : t === null || g(t)
        ? n(t)
        : (e.consume(t), ee);
  }
  function te(t) {
    return t === null ||
      t === 34 ||
      t === 39 ||
      t === 47 ||
      t === 60 ||
      t === 61 ||
      t === 62 ||
      t === 96 ||
      _(t)
      ? E(t)
      : (e.consume(t), te);
  }
  function ne(e) {
    return e === 47 || e === 62 || v(e) ? w(e) : n(e);
  }
  function re(t) {
    return t === 62 ? (e.consume(t), ie) : n(t);
  }
  function ie(t) {
    return t === null || g(t) ? O(t) : v(t) ? (e.consume(t), ie) : n(t);
  }
  function O(t) {
    return t === 45 && i === 2
      ? (e.consume(t), se)
      : t === 60 && i === 1
        ? (e.consume(t), ce)
        : t === 62 && i === 4
          ? (e.consume(t), de)
          : t === 63 && i === 3
            ? (e.consume(t), ue)
            : t === 93 && i === 5
              ? (e.consume(t), le)
              : g(t) && (i === 6 || i === 7)
                ? (e.exit(`htmlFlowData`), e.check(Lu, j, k)(t))
                : t === null || g(t)
                  ? (e.exit(`htmlFlowData`), k(t))
                  : (e.consume(t), O);
  }
  function k(t) {
    return e.check(Ru, ae, j)(t);
  }
  function ae(t) {
    return (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), oe);
  }
  function oe(t) {
    return t === null || g(t) ? k(t) : (e.enter(`htmlFlowData`), O(t));
  }
  function se(t) {
    return t === 45 ? (e.consume(t), ue) : O(t);
  }
  function ce(t) {
    return t === 47 ? (e.consume(t), (o = ``), A) : O(t);
  }
  function A(t) {
    if (t === 62) {
      let n = o.toLowerCase();
      return Fu.includes(n) ? (e.consume(t), de) : O(t);
    }
    return l(t) && o.length < 8
      ? (e.consume(t), (o += String.fromCharCode(t)), A)
      : O(t);
  }
  function le(t) {
    return t === 93 ? (e.consume(t), ue) : O(t);
  }
  function ue(t) {
    return t === 62
      ? (e.consume(t), de)
      : t === 45 && i === 2
        ? (e.consume(t), ue)
        : O(t);
  }
  function de(t) {
    return t === null || g(t)
      ? (e.exit(`htmlFlowData`), j(t))
      : (e.consume(t), de);
  }
  function j(n) {
    return (e.exit(`htmlFlow`), t(n));
  }
}
function Vu(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return g(t)
      ? (e.enter(`lineEnding`), e.consume(t), e.exit(`lineEnding`), a)
      : n(t);
  }
  function a(e) {
    return r.parser.lazy[r.now().line] ? n(e) : t(e);
  }
}
function Hu(e, t, n) {
  return r;
  function r(r) {
    return (
      e.enter(`lineEnding`),
      e.consume(r),
      e.exit(`lineEnding`),
      e.attempt(Wl, t, n)
    );
  }
}
var Uu = { name: `htmlText`, tokenize: Wu };
function Wu(e, t, n) {
  let r = this,
    i,
    a,
    o;
  return s;
  function s(t) {
    return (e.enter(`htmlText`), e.enter(`htmlTextData`), e.consume(t), c);
  }
  function c(t) {
    return t === 33
      ? (e.consume(t), d)
      : t === 47
        ? (e.consume(t), E)
        : t === 63
          ? (e.consume(t), w)
          : l(t)
            ? (e.consume(t), te)
            : n(t);
  }
  function d(t) {
    return t === 45
      ? (e.consume(t), f)
      : t === 91
        ? (e.consume(t), (a = 0), y)
        : l(t)
          ? (e.consume(t), C)
          : n(t);
  }
  function f(t) {
    return t === 45 ? (e.consume(t), h) : n(t);
  }
  function p(t) {
    return t === null
      ? n(t)
      : t === 45
        ? (e.consume(t), m)
        : g(t)
          ? ((o = p), ce(t))
          : (e.consume(t), p);
  }
  function m(t) {
    return t === 45 ? (e.consume(t), h) : p(t);
  }
  function h(e) {
    return e === 62 ? se(e) : e === 45 ? m(e) : p(e);
  }
  function y(t) {
    return t === `CDATA[`.charCodeAt(a++)
      ? (e.consume(t), a === 6 ? b : y)
      : n(t);
  }
  function b(t) {
    return t === null
      ? n(t)
      : t === 93
        ? (e.consume(t), x)
        : g(t)
          ? ((o = b), ce(t))
          : (e.consume(t), b);
  }
  function x(t) {
    return t === 93 ? (e.consume(t), S) : b(t);
  }
  function S(t) {
    return t === 62 ? se(t) : t === 93 ? (e.consume(t), S) : b(t);
  }
  function C(t) {
    return t === null || t === 62
      ? se(t)
      : g(t)
        ? ((o = C), ce(t))
        : (e.consume(t), C);
  }
  function w(t) {
    return t === null
      ? n(t)
      : t === 63
        ? (e.consume(t), T)
        : g(t)
          ? ((o = w), ce(t))
          : (e.consume(t), w);
  }
  function T(e) {
    return e === 62 ? se(e) : w(e);
  }
  function E(t) {
    return l(t) ? (e.consume(t), D) : n(t);
  }
  function D(t) {
    return t === 45 || u(t) ? (e.consume(t), D) : ee(t);
  }
  function ee(t) {
    return g(t) ? ((o = ee), ce(t)) : v(t) ? (e.consume(t), ee) : se(t);
  }
  function te(t) {
    return t === 45 || u(t)
      ? (e.consume(t), te)
      : t === 47 || t === 62 || _(t)
        ? ne(t)
        : n(t);
  }
  function ne(t) {
    return t === 47
      ? (e.consume(t), se)
      : t === 58 || t === 95 || l(t)
        ? (e.consume(t), re)
        : g(t)
          ? ((o = ne), ce(t))
          : v(t)
            ? (e.consume(t), ne)
            : se(t);
  }
  function re(t) {
    return t === 45 || t === 46 || t === 58 || t === 95 || u(t)
      ? (e.consume(t), re)
      : ie(t);
  }
  function ie(t) {
    return t === 61
      ? (e.consume(t), O)
      : g(t)
        ? ((o = ie), ce(t))
        : v(t)
          ? (e.consume(t), ie)
          : ne(t);
  }
  function O(t) {
    return t === null || t === 60 || t === 61 || t === 62 || t === 96
      ? n(t)
      : t === 34 || t === 39
        ? (e.consume(t), (i = t), k)
        : g(t)
          ? ((o = O), ce(t))
          : v(t)
            ? (e.consume(t), O)
            : (e.consume(t), ae);
  }
  function k(t) {
    return t === i
      ? (e.consume(t), (i = void 0), oe)
      : t === null
        ? n(t)
        : g(t)
          ? ((o = k), ce(t))
          : (e.consume(t), k);
  }
  function ae(t) {
    return t === null ||
      t === 34 ||
      t === 39 ||
      t === 60 ||
      t === 61 ||
      t === 96
      ? n(t)
      : t === 47 || t === 62 || _(t)
        ? ne(t)
        : (e.consume(t), ae);
  }
  function oe(e) {
    return e === 47 || e === 62 || _(e) ? ne(e) : n(e);
  }
  function se(r) {
    return r === 62
      ? (e.consume(r), e.exit(`htmlTextData`), e.exit(`htmlText`), t)
      : n(r);
  }
  function ce(t) {
    return (
      e.exit(`htmlTextData`),
      e.enter(`lineEnding`),
      e.consume(t),
      e.exit(`lineEnding`),
      A
    );
  }
  function A(t) {
    return v(t)
      ? I(
          e,
          le,
          `linePrefix`,
          r.parser.constructs.disable.null.includes(`codeIndented`)
            ? void 0
            : 4,
        )(t)
      : le(t);
  }
  function le(t) {
    return (e.enter(`htmlTextData`), o(t));
  }
}
var Gu = { name: `labelEnd`, resolveAll: Yu, resolveTo: Xu, tokenize: Zu },
  Ku = { tokenize: Qu },
  qu = { tokenize: $u },
  Ju = { tokenize: ed };
function Yu(e) {
  let t = -1,
    n = [];
  for (; ++t < e.length; ) {
    let r = e[t][1];
    if (
      (n.push(e[t]),
      r.type === `labelImage` ||
        r.type === `labelLink` ||
        r.type === `labelEnd`)
    ) {
      let e = r.type === `labelImage` ? 4 : 2;
      ((r.type = `data`), (t += e));
    }
  }
  return (e.length !== n.length && S(e, 0, e.length, n), e);
}
function Xu(e, t) {
  let n = e.length,
    r = 0,
    i,
    a,
    o,
    s;
  for (; n--; )
    if (((i = e[n][1]), a)) {
      if (i.type === `link` || (i.type === `labelLink` && i._inactive)) break;
      e[n][0] === `enter` && i.type === `labelLink` && (i._inactive = !0);
    } else if (o) {
      if (
        e[n][0] === `enter` &&
        (i.type === `labelImage` || i.type === `labelLink`) &&
        !i._balanced &&
        ((a = n), i.type !== `labelLink`)
      ) {
        r = 2;
        break;
      }
    } else i.type === `labelEnd` && (o = n);
  let c = {
      type: e[a][1].type === `labelLink` ? `link` : `image`,
      start: { ...e[a][1].start },
      end: { ...e[e.length - 1][1].end },
    },
    l = { type: `label`, start: { ...e[a][1].start }, end: { ...e[o][1].end } },
    u = {
      type: `labelText`,
      start: { ...e[a + r + 2][1].end },
      end: { ...e[o - 2][1].start },
    };
  return (
    (s = [
      [`enter`, c, t],
      [`enter`, l, t],
    ]),
    (s = C(s, e.slice(a + 1, a + r + 3))),
    (s = C(s, [[`enter`, u, t]])),
    (s = C(
      s,
      w(t.parser.constructs.insideSpan.null, e.slice(a + r + 4, o - 3), t),
    )),
    (s = C(s, [[`exit`, u, t], e[o - 2], e[o - 1], [`exit`, l, t]])),
    (s = C(s, e.slice(o + 1))),
    (s = C(s, [[`exit`, c, t]])),
    S(e, a, e.length, s),
    e
  );
}
function Zu(e, t, n) {
  let r = this,
    i = r.events.length,
    a,
    o;
  for (; i--; )
    if (
      (r.events[i][1].type === `labelImage` ||
        r.events[i][1].type === `labelLink`) &&
      !r.events[i][1]._balanced
    ) {
      a = r.events[i][1];
      break;
    }
  return s;
  function s(t) {
    return a
      ? a._inactive
        ? d(t)
        : ((o = r.parser.defined.includes(
            hs(r.sliceSerialize({ start: a.end, end: r.now() })),
          )),
          e.enter(`labelEnd`),
          e.enter(`labelMarker`),
          e.consume(t),
          e.exit(`labelMarker`),
          e.exit(`labelEnd`),
          c)
      : n(t);
  }
  function c(t) {
    return t === 40
      ? e.attempt(Ku, u, o ? u : d)(t)
      : t === 91
        ? e.attempt(qu, u, o ? l : d)(t)
        : o
          ? u(t)
          : d(t);
  }
  function l(t) {
    return e.attempt(Ju, u, d)(t);
  }
  function u(e) {
    return t(e);
  }
  function d(e) {
    return ((a._balanced = !0), n(e));
  }
}
function Qu(e, t, n) {
  return r;
  function r(t) {
    return (
      e.enter(`resource`),
      e.enter(`resourceMarker`),
      e.consume(t),
      e.exit(`resourceMarker`),
      i
    );
  }
  function i(t) {
    return _(t) ? wu(e, a)(t) : a(t);
  }
  function a(t) {
    return t === 41
      ? u(t)
      : xu(
          e,
          o,
          s,
          `resourceDestination`,
          `resourceDestinationLiteral`,
          `resourceDestinationLiteralMarker`,
          `resourceDestinationRaw`,
          `resourceDestinationString`,
          32,
        )(t);
  }
  function o(t) {
    return _(t) ? wu(e, c)(t) : u(t);
  }
  function s(e) {
    return n(e);
  }
  function c(t) {
    return t === 34 || t === 39 || t === 40
      ? Cu(
          e,
          l,
          n,
          `resourceTitle`,
          `resourceTitleMarker`,
          `resourceTitleString`,
        )(t)
      : u(t);
  }
  function l(t) {
    return _(t) ? wu(e, u)(t) : u(t);
  }
  function u(r) {
    return r === 41
      ? (e.enter(`resourceMarker`),
        e.consume(r),
        e.exit(`resourceMarker`),
        e.exit(`resource`),
        t)
      : n(r);
  }
}
function $u(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return Su.call(
      r,
      e,
      a,
      o,
      `reference`,
      `referenceMarker`,
      `referenceString`,
    )(t);
  }
  function a(e) {
    return r.parser.defined.includes(
      hs(r.sliceSerialize(r.events[r.events.length - 1][1]).slice(1, -1)),
    )
      ? t(e)
      : n(e);
  }
  function o(e) {
    return n(e);
  }
}
function ed(e, t, n) {
  return r;
  function r(t) {
    return (
      e.enter(`reference`),
      e.enter(`referenceMarker`),
      e.consume(t),
      e.exit(`referenceMarker`),
      i
    );
  }
  function i(r) {
    return r === 93
      ? (e.enter(`referenceMarker`),
        e.consume(r),
        e.exit(`referenceMarker`),
        e.exit(`reference`),
        t)
      : n(r);
  }
}
var td = { name: `labelStartImage`, resolveAll: Gu.resolveAll, tokenize: nd };
function nd(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return (
      e.enter(`labelImage`),
      e.enter(`labelImageMarker`),
      e.consume(t),
      e.exit(`labelImageMarker`),
      a
    );
  }
  function a(t) {
    return t === 91
      ? (e.enter(`labelMarker`),
        e.consume(t),
        e.exit(`labelMarker`),
        e.exit(`labelImage`),
        o)
      : n(t);
  }
  function o(e) {
    return e === 94 && `_hiddenFootnoteSupport` in r.parser.constructs
      ? n(e)
      : t(e);
  }
}
var rd = { name: `labelStartLink`, resolveAll: Gu.resolveAll, tokenize: id };
function id(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return (
      e.enter(`labelLink`),
      e.enter(`labelMarker`),
      e.consume(t),
      e.exit(`labelMarker`),
      e.exit(`labelLink`),
      a
    );
  }
  function a(e) {
    return e === 94 && `_hiddenFootnoteSupport` in r.parser.constructs
      ? n(e)
      : t(e);
  }
}
var ad = { name: `lineEnding`, tokenize: od };
function od(e, t) {
  return n;
  function n(n) {
    return (
      e.enter(`lineEnding`),
      e.consume(n),
      e.exit(`lineEnding`),
      I(e, t, `linePrefix`)
    );
  }
}
var sd = { name: `thematicBreak`, tokenize: cd };
function cd(e, t, n) {
  let r = 0,
    i;
  return a;
  function a(t) {
    return (e.enter(`thematicBreak`), o(t));
  }
  function o(e) {
    return ((i = e), s(e));
  }
  function s(a) {
    return a === i
      ? (e.enter(`thematicBreakSequence`), c(a))
      : r >= 3 && (a === null || g(a))
        ? (e.exit(`thematicBreak`), t(a))
        : n(a);
  }
  function c(t) {
    return t === i
      ? (e.consume(t), r++, c)
      : (e.exit(`thematicBreakSequence`),
        v(t) ? I(e, s, `whitespace`)(t) : s(t));
  }
}
var ld = {
    continuation: { tokenize: pd },
    exit: hd,
    name: `list`,
    tokenize: fd,
  },
  ud = { partial: !0, tokenize: gd },
  dd = { partial: !0, tokenize: md };
function fd(e, t, n) {
  let r = this,
    i = r.events[r.events.length - 1],
    a =
      i && i[1].type === `linePrefix`
        ? i[2].sliceSerialize(i[1], !0).length
        : 0,
    o = 0;
  return s;
  function s(t) {
    let i =
      r.containerState.type ||
      (t === 42 || t === 43 || t === 45 ? `listUnordered` : `listOrdered`);
    if (
      i === `listUnordered`
        ? !r.containerState.marker || t === r.containerState.marker
        : p(t)
    ) {
      if (
        (r.containerState.type ||
          ((r.containerState.type = i), e.enter(i, { _container: !0 })),
        i === `listUnordered`)
      )
        return (
          e.enter(`listItemPrefix`),
          t === 42 || t === 45 ? e.check(sd, n, l)(t) : l(t)
        );
      if (!r.interrupt || t === 49)
        return (e.enter(`listItemPrefix`), e.enter(`listItemValue`), c(t));
    }
    return n(t);
  }
  function c(t) {
    return p(t) && ++o < 10
      ? (e.consume(t), c)
      : (!r.interrupt || o < 2) &&
          (r.containerState.marker
            ? t === r.containerState.marker
            : t === 41 || t === 46)
        ? (e.exit(`listItemValue`), l(t))
        : n(t);
  }
  function l(t) {
    return (
      e.enter(`listItemMarker`),
      e.consume(t),
      e.exit(`listItemMarker`),
      (r.containerState.marker = r.containerState.marker || t),
      e.check(Wl, r.interrupt ? n : u, e.attempt(ud, f, d))
    );
  }
  function u(e) {
    return ((r.containerState.initialBlankLine = !0), a++, f(e));
  }
  function d(t) {
    return v(t)
      ? (e.enter(`listItemPrefixWhitespace`),
        e.consume(t),
        e.exit(`listItemPrefixWhitespace`),
        f)
      : n(t);
  }
  function f(n) {
    return (
      (r.containerState.size =
        a + r.sliceSerialize(e.exit(`listItemPrefix`), !0).length),
      t(n)
    );
  }
}
function pd(e, t, n) {
  let r = this;
  return ((r.containerState._closeFlow = void 0), e.check(Wl, i, a));
  function i(n) {
    return (
      (r.containerState.furtherBlankLines =
        r.containerState.furtherBlankLines ||
        r.containerState.initialBlankLine),
      I(e, t, `listItemIndent`, r.containerState.size + 1)(n)
    );
  }
  function a(n) {
    return r.containerState.furtherBlankLines || !v(n)
      ? ((r.containerState.furtherBlankLines = void 0),
        (r.containerState.initialBlankLine = void 0),
        o(n))
      : ((r.containerState.furtherBlankLines = void 0),
        (r.containerState.initialBlankLine = void 0),
        e.attempt(dd, t, o)(n));
  }
  function o(i) {
    return (
      (r.containerState._closeFlow = !0),
      (r.interrupt = void 0),
      I(
        e,
        e.attempt(ld, t, n),
        `linePrefix`,
        r.parser.constructs.disable.null.includes(`codeIndented`) ? void 0 : 4,
      )(i)
    );
  }
}
function md(e, t, n) {
  let r = this;
  return I(e, i, `listItemIndent`, r.containerState.size + 1);
  function i(e) {
    let i = r.events[r.events.length - 1];
    return i &&
      i[1].type === `listItemIndent` &&
      i[2].sliceSerialize(i[1], !0).length === r.containerState.size
      ? t(e)
      : n(e);
  }
}
function hd(e) {
  e.exit(this.containerState.type);
}
function gd(e, t, n) {
  let r = this;
  return I(
    e,
    i,
    `listItemPrefixWhitespace`,
    r.parser.constructs.disable.null.includes(`codeIndented`) ? void 0 : 5,
  );
  function i(e) {
    let i = r.events[r.events.length - 1];
    return !v(e) && i && i[1].type === `listItemPrefixWhitespace` ? t(e) : n(e);
  }
}
var _d = { name: `setextUnderline`, resolveTo: vd, tokenize: yd };
function vd(e, t) {
  let n = e.length,
    r,
    i,
    a;
  for (; n--; )
    if (e[n][0] === `enter`) {
      if (e[n][1].type === `content`) {
        r = n;
        break;
      }
      e[n][1].type === `paragraph` && (i = n);
    } else
      (e[n][1].type === `content` && e.splice(n, 1),
        !a && e[n][1].type === `definition` && (a = n));
  let o = {
    type: `setextHeading`,
    start: { ...e[r][1].start },
    end: { ...e[e.length - 1][1].end },
  };
  return (
    (e[i][1].type = `setextHeadingText`),
    a
      ? (e.splice(i, 0, [`enter`, o, t]),
        e.splice(a + 1, 0, [`exit`, e[r][1], t]),
        (e[r][1].end = { ...e[a][1].end }))
      : (e[r][1] = o),
    e.push([`exit`, o, t]),
    e
  );
}
function yd(e, t, n) {
  let r = this,
    i;
  return a;
  function a(t) {
    let a = r.events.length,
      s;
    for (; a--; )
      if (
        r.events[a][1].type !== `lineEnding` &&
        r.events[a][1].type !== `linePrefix` &&
        r.events[a][1].type !== `content`
      ) {
        s = r.events[a][1].type === `paragraph`;
        break;
      }
    return !r.parser.lazy[r.now().line] && (r.interrupt || s)
      ? (e.enter(`setextHeadingLine`), (i = t), o(t))
      : n(t);
  }
  function o(t) {
    return (e.enter(`setextHeadingLineSequence`), s(t));
  }
  function s(t) {
    return t === i
      ? (e.consume(t), s)
      : (e.exit(`setextHeadingLineSequence`),
        v(t) ? I(e, c, `lineSuffix`)(t) : c(t));
  }
  function c(r) {
    return r === null || g(r) ? (e.exit(`setextHeadingLine`), t(r)) : n(r);
  }
}
var bd = { tokenize: Od, partial: !0 };
function xd() {
  return {
    document: {
      91: {
        name: `gfmFootnoteDefinition`,
        tokenize: Td,
        continuation: { tokenize: Ed },
        exit: Dd,
      },
    },
    text: {
      91: { name: `gfmFootnoteCall`, tokenize: wd },
      93: {
        name: `gfmPotentialFootnoteCall`,
        add: `after`,
        tokenize: Sd,
        resolveTo: Cd,
      },
    },
  };
}
function Sd(e, t, n) {
  let r = this,
    i = r.events.length,
    a = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []),
    o;
  for (; i--; ) {
    let e = r.events[i][1];
    if (e.type === `labelImage`) {
      o = e;
      break;
    }
    if (
      e.type === `gfmFootnoteCall` ||
      e.type === `labelLink` ||
      e.type === `label` ||
      e.type === `image` ||
      e.type === `link`
    )
      break;
  }
  return s;
  function s(i) {
    if (!o || !o._balanced) return n(i);
    let s = hs(r.sliceSerialize({ start: o.end, end: r.now() }));
    return s.codePointAt(0) !== 94 || !a.includes(s.slice(1))
      ? n(i)
      : (e.enter(`gfmFootnoteCallLabelMarker`),
        e.consume(i),
        e.exit(`gfmFootnoteCallLabelMarker`),
        t(i));
  }
}
function Cd(e, t) {
  let n = e.length;
  for (; n--; )
    if (e[n][1].type === `labelImage` && e[n][0] === `enter`) {
      e[n][1];
      break;
    }
  ((e[n + 1][1].type = `data`),
    (e[n + 3][1].type = `gfmFootnoteCallLabelMarker`));
  let r = {
      type: `gfmFootnoteCall`,
      start: Object.assign({}, e[n + 3][1].start),
      end: Object.assign({}, e[e.length - 1][1].end),
    },
    i = {
      type: `gfmFootnoteCallMarker`,
      start: Object.assign({}, e[n + 3][1].end),
      end: Object.assign({}, e[n + 3][1].end),
    };
  (i.end.column++, i.end.offset++, i.end._bufferIndex++);
  let a = {
      type: `gfmFootnoteCallString`,
      start: Object.assign({}, i.end),
      end: Object.assign({}, e[e.length - 1][1].start),
    },
    o = {
      type: `chunkString`,
      contentType: `string`,
      start: Object.assign({}, a.start),
      end: Object.assign({}, a.end),
    },
    s = [
      e[n + 1],
      e[n + 2],
      [`enter`, r, t],
      e[n + 3],
      e[n + 4],
      [`enter`, i, t],
      [`exit`, i, t],
      [`enter`, a, t],
      [`enter`, o, t],
      [`exit`, o, t],
      [`exit`, a, t],
      e[e.length - 2],
      e[e.length - 1],
      [`exit`, r, t],
    ];
  return (e.splice(n, e.length - n + 1, ...s), e);
}
function wd(e, t, n) {
  let r = this,
    i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []),
    a = 0,
    o;
  return s;
  function s(t) {
    return (
      e.enter(`gfmFootnoteCall`),
      e.enter(`gfmFootnoteCallLabelMarker`),
      e.consume(t),
      e.exit(`gfmFootnoteCallLabelMarker`),
      c
    );
  }
  function c(t) {
    return t === 94
      ? (e.enter(`gfmFootnoteCallMarker`),
        e.consume(t),
        e.exit(`gfmFootnoteCallMarker`),
        e.enter(`gfmFootnoteCallString`),
        (e.enter(`chunkString`).contentType = `string`),
        l)
      : n(t);
  }
  function l(s) {
    if (a > 999 || (s === 93 && !o) || s === null || s === 91 || _(s))
      return n(s);
    if (s === 93) {
      e.exit(`chunkString`);
      let a = e.exit(`gfmFootnoteCallString`);
      return i.includes(hs(r.sliceSerialize(a)))
        ? (e.enter(`gfmFootnoteCallLabelMarker`),
          e.consume(s),
          e.exit(`gfmFootnoteCallLabelMarker`),
          e.exit(`gfmFootnoteCall`),
          t)
        : n(s);
    }
    return (_(s) || (o = !0), a++, e.consume(s), s === 92 ? u : l);
  }
  function u(t) {
    return t === 91 || t === 92 || t === 93 ? (e.consume(t), a++, l) : l(t);
  }
}
function Td(e, t, n) {
  let r = this,
    i = r.parser.gfmFootnotes || (r.parser.gfmFootnotes = []),
    a,
    o = 0,
    s;
  return c;
  function c(t) {
    return (
      (e.enter(`gfmFootnoteDefinition`)._container = !0),
      e.enter(`gfmFootnoteDefinitionLabel`),
      e.enter(`gfmFootnoteDefinitionLabelMarker`),
      e.consume(t),
      e.exit(`gfmFootnoteDefinitionLabelMarker`),
      l
    );
  }
  function l(t) {
    return t === 94
      ? (e.enter(`gfmFootnoteDefinitionMarker`),
        e.consume(t),
        e.exit(`gfmFootnoteDefinitionMarker`),
        e.enter(`gfmFootnoteDefinitionLabelString`),
        (e.enter(`chunkString`).contentType = `string`),
        u)
      : n(t);
  }
  function u(t) {
    if (o > 999 || (t === 93 && !s) || t === null || t === 91 || _(t))
      return n(t);
    if (t === 93) {
      e.exit(`chunkString`);
      let n = e.exit(`gfmFootnoteDefinitionLabelString`);
      return (
        (a = hs(r.sliceSerialize(n))),
        e.enter(`gfmFootnoteDefinitionLabelMarker`),
        e.consume(t),
        e.exit(`gfmFootnoteDefinitionLabelMarker`),
        e.exit(`gfmFootnoteDefinitionLabel`),
        f
      );
    }
    return (_(t) || (s = !0), o++, e.consume(t), t === 92 ? d : u);
  }
  function d(t) {
    return t === 91 || t === 92 || t === 93 ? (e.consume(t), o++, u) : u(t);
  }
  function f(t) {
    return t === 58
      ? (e.enter(`definitionMarker`),
        e.consume(t),
        e.exit(`definitionMarker`),
        i.includes(a) || i.push(a),
        I(e, p, `gfmFootnoteDefinitionWhitespace`))
      : n(t);
  }
  function p(e) {
    return t(e);
  }
}
function Ed(e, t, n) {
  return e.check(Wl, t, e.attempt(bd, t, n));
}
function Dd(e) {
  e.exit(`gfmFootnoteDefinition`);
}
function Od(e, t, n) {
  let r = this;
  return I(e, i, `gfmFootnoteDefinitionIndent`, 5);
  function i(e) {
    let i = r.events[r.events.length - 1];
    return i &&
      i[1].type === `gfmFootnoteDefinitionIndent` &&
      i[2].sliceSerialize(i[1], !0).length === 4
      ? t(e)
      : n(e);
  }
}
function kd(e) {
  let t = (e || {}).singleTilde,
    n = { name: `strikethrough`, tokenize: i, resolveAll: r };
  return (
    (t ??= !0),
    {
      text: { 126: n },
      insideSpan: { null: [n] },
      attentionMarkers: { null: [126] },
    }
  );
  function r(e, t) {
    let n = -1;
    for (; ++n < e.length; )
      if (
        e[n][0] === `enter` &&
        e[n][1].type === `strikethroughSequenceTemporary` &&
        e[n][1]._close
      ) {
        let r = n;
        for (; r--; )
          if (
            e[r][0] === `exit` &&
            e[r][1].type === `strikethroughSequenceTemporary` &&
            e[r][1]._open &&
            e[n][1].end.offset - e[n][1].start.offset ===
              e[r][1].end.offset - e[r][1].start.offset
          ) {
            ((e[n][1].type = `strikethroughSequence`),
              (e[r][1].type = `strikethroughSequence`));
            let i = {
                type: `strikethrough`,
                start: Object.assign({}, e[r][1].start),
                end: Object.assign({}, e[n][1].end),
              },
              a = {
                type: `strikethroughText`,
                start: Object.assign({}, e[r][1].end),
                end: Object.assign({}, e[n][1].start),
              },
              o = [
                [`enter`, i, t],
                [`enter`, e[r][1], t],
                [`exit`, e[r][1], t],
                [`enter`, a, t],
              ],
              s = t.parser.constructs.insideSpan.null;
            (s && S(o, o.length, 0, w(s, e.slice(r + 1, n), t)),
              S(o, o.length, 0, [
                [`exit`, a, t],
                [`enter`, e[n][1], t],
                [`exit`, e[n][1], t],
                [`exit`, i, t],
              ]),
              S(e, r - 1, n - r + 3, o),
              (n = r + o.length - 2));
            break;
          }
      }
    for (n = -1; ++n < e.length; )
      e[n][1].type === `strikethroughSequenceTemporary` &&
        (e[n][1].type = `data`);
    return e;
  }
  function i(e, n, r) {
    let i = this.previous,
      a = this.events,
      o = 0;
    return s;
    function s(t) {
      return i === 126 && a[a.length - 1][1].type !== `characterEscape`
        ? r(t)
        : (e.enter(`strikethroughSequenceTemporary`), c(t));
    }
    function c(a) {
      let s = ec(i);
      if (a === 126) return o > 1 ? r(a) : (e.consume(a), o++, c);
      if (o < 2 && !t) return r(a);
      let l = e.exit(`strikethroughSequenceTemporary`),
        u = ec(a);
      return (
        (l._open = !u || (u === 2 && !!s)),
        (l._close = !s || (s === 2 && !!u)),
        n(a)
      );
    }
  }
}
var Ad = class {
  constructor() {
    this.map = [];
  }
  add(e, t, n) {
    jd(this, e, t, n);
  }
  consume(e) {
    if (
      (this.map.sort(function (e, t) {
        return e[0] - t[0];
      }),
      this.map.length === 0)
    )
      return;
    let t = this.map.length,
      n = [];
    for (; t > 0; )
      (--t,
        n.push(e.slice(this.map[t][0] + this.map[t][1]), this.map[t][2]),
        (e.length = this.map[t][0]));
    (n.push(e.slice()), (e.length = 0));
    let r = n.pop();
    for (; r; ) {
      for (let t of r) e.push(t);
      r = n.pop();
    }
    this.map.length = 0;
  }
};
function jd(e, t, n, r) {
  let i = 0;
  if (!(n === 0 && r.length === 0)) {
    for (; i < e.map.length; ) {
      if (e.map[i][0] === t) {
        ((e.map[i][1] += n), e.map[i][2].push(...r));
        return;
      }
      i += 1;
    }
    e.map.push([t, n, r]);
  }
}
function Md(e, t) {
  let n = !1,
    r = [];
  for (; t < e.length; ) {
    let i = e[t];
    if (n) {
      if (i[0] === `enter`)
        i[1].type === `tableContent` &&
          r.push(e[t + 1][1].type === `tableDelimiterMarker` ? `left` : `none`);
      else if (i[1].type === `tableContent`) {
        if (e[t - 1][1].type === `tableDelimiterMarker`) {
          let e = r.length - 1;
          r[e] = r[e] === `left` ? `center` : `right`;
        }
      } else if (i[1].type === `tableDelimiterRow`) break;
    } else i[0] === `enter` && i[1].type === `tableDelimiterRow` && (n = !0);
    t += 1;
  }
  return r;
}
function Nd() {
  return { flow: { null: { name: `table`, tokenize: Pd, resolveAll: Fd } } };
}
function Pd(e, t, n) {
  let r = this,
    i = 0,
    a = 0,
    o;
  return s;
  function s(e) {
    let t = r.events.length - 1;
    for (; t > -1; ) {
      let e = r.events[t][1].type;
      if (e === `lineEnding` || e === `linePrefix`) t--;
      else break;
    }
    let i = t > -1 ? r.events[t][1].type : null,
      a = i === `tableHead` || i === `tableRow` ? T : c;
    return a === T && r.parser.lazy[r.now().line] ? n(e) : a(e);
  }
  function c(t) {
    return (e.enter(`tableHead`), e.enter(`tableRow`), l(t));
  }
  function l(e) {
    return e === 124 ? u(e) : ((o = !0), (a += 1), u(e));
  }
  function u(t) {
    return t === null
      ? n(t)
      : g(t)
        ? a > 1
          ? ((a = 0),
            (r.interrupt = !0),
            e.exit(`tableRow`),
            e.enter(`lineEnding`),
            e.consume(t),
            e.exit(`lineEnding`),
            p)
          : n(t)
        : v(t)
          ? I(e, u, `whitespace`)(t)
          : ((a += 1),
            o && ((o = !1), (i += 1)),
            t === 124
              ? (e.enter(`tableCellDivider`),
                e.consume(t),
                e.exit(`tableCellDivider`),
                (o = !0),
                u)
              : (e.enter(`data`), d(t)));
  }
  function d(t) {
    return t === null || t === 124 || _(t)
      ? (e.exit(`data`), u(t))
      : (e.consume(t), t === 92 ? f : d);
  }
  function f(t) {
    return t === 92 || t === 124 ? (e.consume(t), d) : d(t);
  }
  function p(t) {
    return (
      (r.interrupt = !1),
      r.parser.lazy[r.now().line]
        ? n(t)
        : (e.enter(`tableDelimiterRow`),
          (o = !1),
          v(t)
            ? I(
                e,
                m,
                `linePrefix`,
                r.parser.constructs.disable.null.includes(`codeIndented`)
                  ? void 0
                  : 4,
              )(t)
            : m(t))
    );
  }
  function m(t) {
    return t === 45 || t === 58
      ? y(t)
      : t === 124
        ? ((o = !0),
          e.enter(`tableCellDivider`),
          e.consume(t),
          e.exit(`tableCellDivider`),
          h)
        : w(t);
  }
  function h(t) {
    return v(t) ? I(e, y, `whitespace`)(t) : y(t);
  }
  function y(t) {
    return t === 58
      ? ((a += 1),
        (o = !0),
        e.enter(`tableDelimiterMarker`),
        e.consume(t),
        e.exit(`tableDelimiterMarker`),
        b)
      : t === 45
        ? ((a += 1), b(t))
        : t === null || g(t)
          ? C(t)
          : w(t);
  }
  function b(t) {
    return t === 45 ? (e.enter(`tableDelimiterFiller`), x(t)) : w(t);
  }
  function x(t) {
    return t === 45
      ? (e.consume(t), x)
      : t === 58
        ? ((o = !0),
          e.exit(`tableDelimiterFiller`),
          e.enter(`tableDelimiterMarker`),
          e.consume(t),
          e.exit(`tableDelimiterMarker`),
          S)
        : (e.exit(`tableDelimiterFiller`), S(t));
  }
  function S(t) {
    return v(t) ? I(e, C, `whitespace`)(t) : C(t);
  }
  function C(n) {
    return n === 124
      ? m(n)
      : n === null || g(n)
        ? !o || i !== a
          ? w(n)
          : (e.exit(`tableDelimiterRow`), e.exit(`tableHead`), t(n))
        : w(n);
  }
  function w(e) {
    return n(e);
  }
  function T(t) {
    return (e.enter(`tableRow`), E(t));
  }
  function E(n) {
    return n === 124
      ? (e.enter(`tableCellDivider`),
        e.consume(n),
        e.exit(`tableCellDivider`),
        E)
      : n === null || g(n)
        ? (e.exit(`tableRow`), t(n))
        : v(n)
          ? I(e, E, `whitespace`)(n)
          : (e.enter(`data`), D(n));
  }
  function D(t) {
    return t === null || t === 124 || _(t)
      ? (e.exit(`data`), E(t))
      : (e.consume(t), t === 92 ? ee : D);
  }
  function ee(t) {
    return t === 92 || t === 124 ? (e.consume(t), D) : D(t);
  }
}
function Fd(e, t) {
  let n = -1,
    r = !0,
    i = 0,
    a = [0, 0, 0, 0],
    o = [0, 0, 0, 0],
    s = !1,
    c = 0,
    l,
    u,
    d,
    f = new Ad();
  for (; ++n < e.length; ) {
    let p = e[n],
      m = p[1];
    p[0] === `enter`
      ? m.type === `tableHead`
        ? ((s = !1),
          c !== 0 && (Ld(f, t, c, l, u), (u = void 0), (c = 0)),
          (l = {
            type: `table`,
            start: Object.assign({}, m.start),
            end: Object.assign({}, m.end),
          }),
          f.add(n, 0, [[`enter`, l, t]]))
        : m.type === `tableRow` || m.type === `tableDelimiterRow`
          ? ((r = !0),
            (d = void 0),
            (a = [0, 0, 0, 0]),
            (o = [0, n + 1, 0, 0]),
            s &&
              ((s = !1),
              (u = {
                type: `tableBody`,
                start: Object.assign({}, m.start),
                end: Object.assign({}, m.end),
              }),
              f.add(n, 0, [[`enter`, u, t]])),
            (i = m.type === `tableDelimiterRow` ? 2 : u ? 3 : 1))
          : i &&
              (m.type === `data` ||
                m.type === `tableDelimiterMarker` ||
                m.type === `tableDelimiterFiller`)
            ? ((r = !1),
              o[2] === 0 &&
                (a[1] !== 0 &&
                  ((o[0] = o[1]),
                  (d = Id(f, t, a, i, void 0, d)),
                  (a = [0, 0, 0, 0])),
                (o[2] = n)))
            : m.type === `tableCellDivider` &&
              (r
                ? (r = !1)
                : (a[1] !== 0 &&
                    ((o[0] = o[1]), (d = Id(f, t, a, i, void 0, d))),
                  (a = o),
                  (o = [a[1], n, 0, 0])))
      : m.type === `tableHead`
        ? ((s = !0), (c = n))
        : m.type === `tableRow` || m.type === `tableDelimiterRow`
          ? ((c = n),
            a[1] === 0
              ? o[1] !== 0 && (d = Id(f, t, o, i, n, d))
              : ((o[0] = o[1]), (d = Id(f, t, a, i, n, d))),
            (i = 0))
          : i &&
            (m.type === `data` ||
              m.type === `tableDelimiterMarker` ||
              m.type === `tableDelimiterFiller`) &&
            (o[3] = n);
  }
  for (
    c !== 0 && Ld(f, t, c, l, u), f.consume(t.events), n = -1;
    ++n < t.events.length;
  ) {
    let e = t.events[n];
    e[0] === `enter` &&
      e[1].type === `table` &&
      (e[1]._align = Md(t.events, n));
  }
  return e;
}
function Id(e, t, n, r, i, a) {
  let o = r === 1 ? `tableHeader` : r === 2 ? `tableDelimiter` : `tableData`;
  n[0] !== 0 &&
    ((a.end = Object.assign({}, Rd(t.events, n[0]))),
    e.add(n[0], 0, [[`exit`, a, t]]));
  let s = Rd(t.events, n[1]);
  if (
    ((a = { type: o, start: Object.assign({}, s), end: Object.assign({}, s) }),
    e.add(n[1], 0, [[`enter`, a, t]]),
    n[2] !== 0)
  ) {
    let i = Rd(t.events, n[2]),
      a = Rd(t.events, n[3]),
      o = {
        type: `tableContent`,
        start: Object.assign({}, i),
        end: Object.assign({}, a),
      };
    if ((e.add(n[2], 0, [[`enter`, o, t]]), r !== 2)) {
      let r = t.events[n[2]],
        i = t.events[n[3]];
      if (
        ((r[1].end = Object.assign({}, i[1].end)),
        (r[1].type = `chunkText`),
        (r[1].contentType = `text`),
        n[3] > n[2] + 1)
      ) {
        let t = n[2] + 1,
          r = n[3] - n[2] - 1;
        e.add(t, r, []);
      }
    }
    e.add(n[3] + 1, 0, [[`exit`, o, t]]);
  }
  return (
    i !== void 0 &&
      ((a.end = Object.assign({}, Rd(t.events, i))),
      e.add(i, 0, [[`exit`, a, t]]),
      (a = void 0)),
    a
  );
}
function Ld(e, t, n, r, i) {
  let a = [],
    o = Rd(t.events, n);
  (i && ((i.end = Object.assign({}, o)), a.push([`exit`, i, t])),
    (r.end = Object.assign({}, o)),
    a.push([`exit`, r, t]),
    e.add(n + 1, 0, a));
}
function Rd(e, t) {
  let n = e[t],
    r = n[0] === `enter` ? `start` : `end`;
  return n[1][r];
}
var zd = { name: `tasklistCheck`, tokenize: Vd };
function Bd() {
  return { text: { 91: zd } };
}
function Vd(e, t, n) {
  let r = this;
  return i;
  function i(t) {
    return r.previous !== null || !r._gfmTasklistFirstContentOfListItem
      ? n(t)
      : (e.enter(`taskListCheck`),
        e.enter(`taskListCheckMarker`),
        e.consume(t),
        e.exit(`taskListCheckMarker`),
        a);
  }
  function a(t) {
    return _(t)
      ? (e.enter(`taskListCheckValueUnchecked`),
        e.consume(t),
        e.exit(`taskListCheckValueUnchecked`),
        o)
      : t === 88 || t === 120
        ? (e.enter(`taskListCheckValueChecked`),
          e.consume(t),
          e.exit(`taskListCheckValueChecked`),
          o)
        : n(t);
  }
  function o(t) {
    return t === 93
      ? (e.enter(`taskListCheckMarker`),
        e.consume(t),
        e.exit(`taskListCheckMarker`),
        e.exit(`taskListCheck`),
        s)
      : n(t);
  }
  function s(r) {
    return g(r) ? t(r) : v(r) ? e.check({ tokenize: Hd }, t, n)(r) : n(r);
  }
}
function Hd(e, t, n) {
  return I(e, r, `whitespace`);
  function r(e) {
    return e === null ? n(e) : t(e);
  }
}
function Ud(e) {
  return ul([Sl(), xd(), kd(e), Nd(), Bd()]);
}
var Wd = {};
function Gd(e) {
  let t = this,
    n = e || Wd,
    r = t.data(),
    i = (r.micromarkExtensions ||= []),
    a = (r.fromMarkdownExtensions ||= []),
    o = (r.toMarkdownExtensions ||= []);
  (i.push(Ud(n)), a.push(sl()), o.push(cl(n)));
}
var Kd = Object.defineProperty,
  qd = Object.defineProperties,
  Jd = Object.getOwnPropertyDescriptors,
  Yd = Object.getOwnPropertySymbols,
  Xd = Object.prototype.hasOwnProperty,
  Zd = Object.prototype.propertyIsEnumerable,
  Qd = (e, t, n) =>
    t in e
      ? Kd(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  $d = (e, t) => {
    for (var n in (t ||= {})) Xd.call(t, n) && Qd(e, n, t[n]);
    if (Yd) for (var n of Yd(t)) Zd.call(t, n) && Qd(e, n, t[n]);
    return e;
  },
  ef = (e, t) => qd(e, Jd(t)),
  tf = /(\*\*)([^*]*\*?)$/,
  nf = /(__)([^_]*?)$/,
  rf = /(\*\*\*)([^*]*?)$/,
  af = /(\*)([^*]*?)$/,
  of = /(_)([^_]*?)$/,
  sf = /(`)([^`]*?)$/,
  cf = /(~~)([^~]*?)$/,
  lf = /^[\s_~*`]*$/,
  uf = /^[\s]*[-*+][\s]+$/,
  df = /[\p{L}\p{N}_]/u,
  ff = /^```[^`\n]*```?$/,
  pf = /^\*{4,}$/,
  mf = /(__)([^_]+)_$/,
  hf = /(~~)([^~]+)~$/,
  gf = /__/g,
  _f = /~~/g,
  vf = (e) => {
    if (!e) return !1;
    let t = e.charCodeAt(0);
    return (t >= 48 && t <= 57) ||
      (t >= 65 && t <= 90) ||
      (t >= 97 && t <= 122) ||
      t === 95
      ? !0
      : df.test(e);
  },
  yf = (e, t) => {
    let n = !1;
    for (let r = 0; r < t; r += 1)
      e[r] === "`" &&
        e[r + 1] === "`" &&
        e[r + 2] === "`" &&
        ((n = !n), (r += 2));
    return n;
  },
  bf = (e, t) => {
    let n = 1;
    for (let r = t - 1; r >= 0; --r)
      if (e[r] === `]`) n += 1;
      else if (e[r] === `[` && (--n, n === 0)) return r;
    return -1;
  },
  xf = (e, t) => {
    let n = 1;
    for (let r = t + 1; r < e.length; r += 1)
      if (e[r] === `[`) n += 1;
      else if (e[r] === `]` && (--n, n === 0)) return r;
    return -1;
  },
  Sf = (e, t) => {
    let n = !1,
      r = !1;
    for (let i = 0; i < e.length && i < t; i += 1) {
      if (e[i] === `\\` && e[i + 1] === `$`) {
        i += 1;
        continue;
      }
      e[i] === `$` &&
        (e[i + 1] === `$` ? ((r = !r), (i += 1), (n = !1)) : r || (n = !n));
    }
    return n || r;
  },
  Cf = (e, t) => {
    for (let n = t; n < e.length; n += 1) {
      if (e[n] === `)`) return !0;
      if (
        e[n] ===
        `
`
      )
        return !1;
    }
    return !1;
  },
  wf = (e, t) => {
    for (let n = t - 1; n >= 0; --n) {
      if (e[n] === `)`) return !1;
      if (e[n] === `(`) return n > 0 && e[n - 1] === `]` ? Cf(e, t) : !1;
      if (
        e[n] ===
        `
`
      )
        return !1;
    }
    return !1;
  },
  Tf = (e, t, n) => {
    let r = 0;
    for (let n = t - 1; n >= 0; --n)
      if (
        e[n] ===
        `
`
      ) {
        r = n + 1;
        break;
      }
    let i = e.length;
    for (let n = t; n < e.length; n += 1)
      if (
        e[n] ===
        `
`
      ) {
        i = n;
        break;
      }
    let a = e.substring(r, i),
      o = 0,
      s = !1;
    for (let e of a)
      if (e === n) o += 1;
      else if (e !== ` ` && e !== `	`) {
        s = !0;
        break;
      }
    return o >= 3 && !s;
  },
  Ef = (e, t, n) => {
    if (n !== ` ` && n !== `	`) return !1;
    let r = 0;
    for (let n = t - 1; n >= 0; --n)
      if (
        e[n] ===
        `
`
      ) {
        r = n + 1;
        break;
      }
    for (let n = r; n < t; n += 1) if (e[n] !== ` ` && e[n] !== `	`) return !1;
    return !0;
  },
  Df = (e, t, n, r) =>
    n === `\\` || (e.includes(`$`) && Sf(e, t))
      ? !0
      : n !== `*` && r === `*`
        ? (t < e.length - 2 ? e[t + 2] : ``) !== `*`
        : !!(n === `*` || (n && r && vf(n) && vf(r)) || Ef(e, t, r)),
  Of = (e) => {
    let t = 0,
      n = e.length;
    for (let r = 0; r < n; r += 1) {
      if (e[r] !== `*`) continue;
      let i = r > 0 ? e[r - 1] : ``,
        a = r < n - 1 ? e[r + 1] : ``;
      Df(e, r, i, a) || (t += 1);
    }
    return t;
  },
  kf = (e, t, n, r) =>
    !!(
      n === `\\` ||
      (e.includes(`$`) && Sf(e, t)) ||
      wf(e, t) ||
      n === `_` ||
      r === `_` ||
      (n && r && vf(n) && vf(r))
    ),
  Af = (e) => {
    let t = 0,
      n = e.length;
    for (let r = 0; r < n; r += 1) {
      if (e[r] !== `_`) continue;
      let i = r > 0 ? e[r - 1] : ``,
        a = r < n - 1 ? e[r + 1] : ``;
      kf(e, r, i, a) || (t += 1);
    }
    return t;
  },
  jf = (e) => {
    let t = 0,
      n = 0;
    for (let r = 0; r < e.length; r += 1)
      e[r] === `*` ? (n += 1) : (n >= 3 && (t += Math.floor(n / 3)), (n = 0));
    return (n >= 3 && (t += Math.floor(n / 3)), t);
  },
  Mf = (e, t, n) => {
    if (!t || lf.test(t)) return !0;
    let r = e.substring(0, n).lastIndexOf(`
`),
      i = r === -1 ? 0 : r + 1,
      a = e.substring(i, n);
    return uf.test(a) &&
      t.includes(`
`)
      ? !0
      : Tf(e, n, `*`);
  },
  Nf = (e) => {
    let t = e.match(tf);
    if (!t) return e;
    let n = t[2],
      r = e.lastIndexOf(t[1]);
    return yf(e, r) || Mf(e, n, r)
      ? e
      : (e.match(/\*\*/g) || []).length % 2 == 1
        ? n.endsWith(`*`)
          ? `${e}*`
          : `${e}**`
        : e;
  },
  Pf = (e, t, n) => {
    if (!t || lf.test(t)) return !0;
    let r = e.substring(0, n).lastIndexOf(`
`),
      i = r === -1 ? 0 : r + 1,
      a = e.substring(i, n);
    return uf.test(a) &&
      t.includes(`
`)
      ? !0
      : Tf(e, n, `_`);
  },
  Ff = (e) => {
    let t = e.match(nf);
    if (!t) {
      let t = e.match(mf);
      return t &&
        !yf(e, e.lastIndexOf(t[1])) &&
        (e.match(gf) || []).length % 2 == 1
        ? `${e}_`
        : e;
    }
    let n = t[2],
      r = e.lastIndexOf(t[1]);
    return yf(e, r) || Pf(e, n, r)
      ? e
      : (e.match(/__/g) || []).length % 2 == 1
        ? `${e}__`
        : e;
  },
  If = (e) => {
    for (let t = 0; t < e.length; t += 1)
      if (
        e[t] === `*` &&
        e[t - 1] !== `*` &&
        e[t + 1] !== `*` &&
        e[t - 1] !== `\\` &&
        !Sf(e, t)
      ) {
        let n = t > 0 ? e[t - 1] : ``,
          r = t < e.length - 1 ? e[t + 1] : ``;
        if (n && r && vf(n) && vf(r)) continue;
        return t;
      }
    return -1;
  },
  Lf = (e) => {
    if (!e.match(af)) return e;
    let t = If(e);
    if (t === -1 || yf(e, t)) return e;
    let n = e.substring(t + 1);
    return !n || lf.test(n) ? e : Of(e) % 2 == 1 ? `${e}*` : e;
  },
  Rf = (e) => {
    for (let t = 0; t < e.length; t += 1)
      if (
        e[t] === `_` &&
        e[t - 1] !== `_` &&
        e[t + 1] !== `_` &&
        e[t - 1] !== `\\` &&
        !Sf(e, t) &&
        !wf(e, t)
      ) {
        let n = t > 0 ? e[t - 1] : ``,
          r = t < e.length - 1 ? e[t + 1] : ``;
        if (n && r && vf(n) && vf(r)) continue;
        return t;
      }
    return -1;
  },
  zf = (e) => {
    let t = e.length;
    for (
      ;
      t > 0 &&
      e[t - 1] ===
        `
`;
    )
      --t;
    return t < e.length ? `${e.slice(0, t)}_${e.slice(t)}` : `${e}_`;
  },
  Bf = (e) => {
    if (!e.endsWith(`**`)) return null;
    let t = e.slice(0, -2);
    if ((t.match(/\*\*/g) || []).length % 2 != 1) return null;
    let n = t.indexOf(`**`),
      r = Rf(t);
    return n !== -1 && r !== -1 && n < r ? `${t}_**` : null;
  },
  Vf = (e) => {
    if (!e.match(of)) return e;
    let t = Rf(e);
    if (t === -1 || yf(e, t)) return e;
    let n = e.substring(t + 1);
    if (!n || lf.test(n)) return e;
    if (Af(e) % 2 == 1) {
      let t = Bf(e);
      return t === null ? zf(e) : t;
    }
    return e;
  },
  Hf = (e) => {
    let t = (e.match(/\*\*/g) || []).length,
      n = Of(e);
    return t % 2 == 0 && n % 2 == 0;
  },
  Uf = (e, t, n) => (!t || lf.test(t) || yf(e, n) ? !0 : Tf(e, n, `*`)),
  Wf = (e) => {
    if (pf.test(e)) return e;
    let t = e.match(rf);
    if (!t) return e;
    let n = t[2];
    return Uf(e, n, e.lastIndexOf(t[1]))
      ? e
      : jf(e) % 2 == 1
        ? Hf(e)
          ? e
          : `${e}***`
        : e;
  },
  Gf = (e, t) => {
    let n = !1,
      r = !1;
    for (let i = 0; i < t; i += 1) {
      if (e.substring(i, i + 3) === "```") {
        ((r = !r), (i += 2));
        continue;
      }
      !r && e[i] === "`" && (n = !n);
    }
    return n || r;
  },
  Kf = (e, t) => {
    let n = e.substring(t, t + 3) === "```",
      r = t > 0 && e.substring(t - 1, t + 2) === "```",
      i = t > 1 && e.substring(t - 2, t + 1) === "```";
    return n || r || i;
  },
  qf = (e) => {
    let t = 0;
    for (let n = 0; n < e.length; n += 1) e[n] === "`" && !Kf(e, n) && (t += 1);
    return t;
  },
  Jf = (e) =>
    !e.match(ff) ||
    e.includes(`
`)
      ? null
      : e.endsWith("``") && !e.endsWith("```")
        ? `${e}\``
        : e,
  Yf = (e) => (e.match(/```/g) || []).length % 2 == 1,
  Xf = (e) => {
    let t = Jf(e);
    if (t !== null) return t;
    let n = e.match(sf);
    if (n && !Yf(e)) {
      let t = n[2];
      if (!t || lf.test(t)) return e;
      if (qf(e) % 2 == 1) return `${e}\``;
    }
    return e;
  },
  Zf = (e, t) =>
    (t >= 2 && e.substring(t - 2, t + 1) === "```") ||
    (t >= 1 && e.substring(t - 1, t + 2) === "```") ||
    (t <= e.length - 3 && e.substring(t, t + 3) === "```"),
  Qf = (e) => {
    let t = 0,
      n = !1;
    for (let r = 0; r < e.length - 1; r += 1)
      (e[r] === "`" && !Zf(e, r) && (n = !n),
        !n && e[r] === `$` && e[r + 1] === `$` && ((t += 1), (r += 1)));
    return t;
  },
  $f = (e) => {
    let t = e.indexOf(`$$`);
    return t !== -1 &&
      e.indexOf(
        `
`,
        t,
      ) !== -1 &&
      !e.endsWith(`
`)
      ? `${e}
$$`
      : `${e}$$`;
  },
  ep = (e) => (Qf(e) % 2 == 0 ? e : $f(e)),
  tp = (e, t, n) => {
    if (e.substring(t + 2).includes(`)`)) return null;
    let r = bf(e, t);
    if (r === -1 || Gf(e, r)) return null;
    let i = r > 0 && e[r - 1] === `!`,
      a = i ? r - 1 : r,
      o = e.substring(0, a);
    if (i) return o;
    let s = e.substring(r + 1, t);
    return n === `text-only`
      ? `${o}${s}`
      : `${o}[${s}](streamdown:incomplete-link)`;
  },
  np = (e, t) => {
    for (let n = 0; n <= t; n++)
      if (e[n] === `[` && !Gf(e, n)) {
        if (n > 0 && e[n - 1] === `!`) continue;
        let t = xf(e, n);
        if (t === -1) return n;
        if (t + 1 < e.length && e[t + 1] === `(`) {
          let r = e.indexOf(`)`, t + 2);
          r !== -1 && (n = r);
        }
      }
    return -1;
  },
  rp = (e, t, n) => {
    let r = t > 0 && e[t - 1] === `!`,
      i = r ? t - 1 : t,
      a = e.substring(t + 1);
    if (!a.includes(`]`)) {
      let o = e.substring(0, i);
      if (r) return o;
      if (n === `text-only`) {
        let n = np(e, t);
        return n === -1 ? `${o}${a}` : e.substring(0, n) + e.substring(n + 1);
      }
      return `${e}](streamdown:incomplete-link)`;
    }
    if (xf(e, t) === -1) {
      let a = e.substring(0, i);
      if (r) return a;
      if (n === `text-only`) {
        let n = np(e, t);
        return n === -1
          ? `${a}${e.substring(t + 1)}`
          : e.substring(0, n) + e.substring(n + 1);
      }
      return `${e}](streamdown:incomplete-link)`;
    }
    return null;
  },
  ip = (e, t = `protocol`) => {
    let n = e.lastIndexOf(`](`);
    if (n !== -1 && !Gf(e, n)) {
      let r = tp(e, n, t);
      if (r !== null) return r;
    }
    for (let n = e.length - 1; n >= 0; --n)
      if (e[n] === `[` && !Gf(e, n)) {
        let r = rp(e, n, t);
        if (r !== null) return r;
      }
    return e;
  },
  ap = /^-{1,2}$/,
  op = /^[\s]*-{1,2}[\s]+$/,
  sp = /^={1,2}$/,
  cp = /^[\s]*={1,2}[\s]+$/,
  lp = (e) => {
    if (!e || typeof e != `string`) return e;
    let t = e.lastIndexOf(`
`);
    if (t === -1) return e;
    let n = e.substring(t + 1),
      r = e.substring(0, t),
      i = n.trim();
    if (ap.test(i) && !n.match(op)) {
      let t = r
        .split(
          `
`,
        )
        .at(-1);
      if (t && t.trim().length > 0) return `${e}\u200B`;
    }
    if (sp.test(i) && !n.match(cp)) {
      let t = r
        .split(
          `
`,
        )
        .at(-1);
      if (t && t.trim().length > 0) return `${e}\u200B`;
    }
    return e;
  },
  up = (e) => {
    let t = e.match(cf);
    if (t) {
      let n = t[2];
      if (!n || lf.test(n)) return e;
      if ((e.match(_f) || []).length % 2 == 1) return `${e}~~`;
    } else if (e.match(hf) && (e.match(_f) || []).length % 2 == 1)
      return `${e}~`;
    return e;
  },
  dp = (e) => e !== !1,
  fp = {
    SETEXT_HEADINGS: 0,
    LINKS: 10,
    BOLD_ITALIC: 20,
    BOLD: 30,
    ITALIC_DOUBLE_UNDERSCORE: 40,
    ITALIC_SINGLE_ASTERISK: 41,
    ITALIC_SINGLE_UNDERSCORE: 42,
    INLINE_CODE: 50,
    STRIKETHROUGH: 60,
    KATEX: 70,
    DEFAULT: 100,
  },
  pp = [
    {
      handler: {
        name: `setextHeadings`,
        handle: lp,
        priority: fp.SETEXT_HEADINGS,
      },
      optionKey: `setextHeadings`,
    },
    {
      handler: { name: `links`, handle: ip, priority: fp.LINKS },
      optionKey: `links`,
      earlyReturn: (e) => e.endsWith(`](streamdown:incomplete-link)`),
    },
    {
      handler: { name: `boldItalic`, handle: Wf, priority: fp.BOLD_ITALIC },
      optionKey: `boldItalic`,
    },
    {
      handler: { name: `bold`, handle: Nf, priority: fp.BOLD },
      optionKey: `bold`,
    },
    {
      handler: {
        name: `italicDoubleUnderscore`,
        handle: Ff,
        priority: fp.ITALIC_DOUBLE_UNDERSCORE,
      },
      optionKey: `italic`,
    },
    {
      handler: {
        name: `italicSingleAsterisk`,
        handle: Lf,
        priority: fp.ITALIC_SINGLE_ASTERISK,
      },
      optionKey: `italic`,
    },
    {
      handler: {
        name: `italicSingleUnderscore`,
        handle: Vf,
        priority: fp.ITALIC_SINGLE_UNDERSCORE,
      },
      optionKey: `italic`,
    },
    {
      handler: { name: `inlineCode`, handle: Xf, priority: fp.INLINE_CODE },
      optionKey: `inlineCode`,
    },
    {
      handler: {
        name: `strikethrough`,
        handle: up,
        priority: fp.STRIKETHROUGH,
      },
      optionKey: `strikethrough`,
    },
    {
      handler: { name: `katex`, handle: ep, priority: fp.KATEX },
      optionKey: `katex`,
    },
  ],
  mp = (e) => {
    let t = e?.linkMode ?? `protocol`;
    return pp
      .filter(({ handler: t, optionKey: n }) =>
        t.name === `links` ? dp(e?.links) || dp(e?.images) : dp(e?.[n]),
      )
      .map(({ handler: e, earlyReturn: n }) =>
        e.name === `links`
          ? {
              handler: ef($d({}, e), { handle: (e) => ip(e, t) }),
              earlyReturn: t === `protocol` ? n : void 0,
            }
          : { handler: e, earlyReturn: n },
      );
  },
  hp = (e, t) => {
    if (!e || typeof e != `string`) return e;
    let n = e.endsWith(` `) && !e.endsWith(`  `) ? e.slice(0, -1) : e,
      r = mp(t),
      i = (t?.handlers ?? []).map((e) => ({
        handler: ef($d({}, e), { priority: e.priority ?? fp.DEFAULT }),
        earlyReturn: void 0,
      })),
      a = [...r, ...i].sort(
        (e, t) =>
          (e.handler.priority ?? fp.DEFAULT) -
          (t.handler.priority ?? fp.DEFAULT),
      );
    for (let { handler: e, earlyReturn: t } of a)
      if (((n = e.handle(n)), t != null && t(n))) return n;
    return n;
  },
  gp = (e, t) => {
    let n = Array(e.length + t.length);
    for (let t = 0; t < e.length; t++) n[t] = e[t];
    for (let r = 0; r < t.length; r++) n[e.length + r] = t[r];
    return n;
  },
  _p = (e, t) => ({ classGroupId: e, validator: t }),
  vp = (e = new Map(), t = null, n) => ({
    nextPart: e,
    validators: t,
    classGroupId: n,
  }),
  yp = `-`,
  bp = [],
  xp = `arbitrary..`,
  Sp = (e) => {
    let t = Tp(e),
      { conflictingClassGroups: n, conflictingClassGroupModifiers: r } = e;
    return {
      getClassGroupId: (e) => {
        if (e.startsWith(`[`) && e.endsWith(`]`)) return wp(e);
        let n = e.split(yp);
        return Cp(n, n[0] === `` && n.length > 1 ? 1 : 0, t);
      },
      getConflictingClassGroupIds: (e, t) => {
        if (t) {
          let t = r[e],
            i = n[e];
          return t ? (i ? gp(i, t) : t) : i || bp;
        }
        return n[e] || bp;
      },
    };
  },
  Cp = (e, t, n) => {
    if (e.length - t === 0) return n.classGroupId;
    let r = e[t],
      i = n.nextPart.get(r);
    if (i) {
      let n = Cp(e, t + 1, i);
      if (n) return n;
    }
    let a = n.validators;
    if (a === null) return;
    let o = t === 0 ? e.join(yp) : e.slice(t).join(yp),
      s = a.length;
    for (let e = 0; e < s; e++) {
      let t = a[e];
      if (t.validator(o)) return t.classGroupId;
    }
  },
  wp = (e) =>
    e.slice(1, -1).indexOf(`:`) === -1
      ? void 0
      : (() => {
          let t = e.slice(1, -1),
            n = t.indexOf(`:`),
            r = t.slice(0, n);
          return r ? xp + r : void 0;
        })(),
  Tp = (e) => {
    let { theme: t, classGroups: n } = e;
    return Ep(n, t);
  },
  Ep = (e, t) => {
    let n = vp();
    for (let r in e) {
      let i = e[r];
      Dp(i, n, r, t);
    }
    return n;
  },
  Dp = (e, t, n, r) => {
    let i = e.length;
    for (let a = 0; a < i; a++) {
      let i = e[a];
      Op(i, t, n, r);
    }
  },
  Op = (e, t, n, r) => {
    if (typeof e == `string`) {
      kp(e, t, n);
      return;
    }
    if (typeof e == `function`) {
      Ap(e, t, n, r);
      return;
    }
    jp(e, t, n, r);
  },
  kp = (e, t, n) => {
    let r = e === `` ? t : Mp(t, e);
    r.classGroupId = n;
  },
  Ap = (e, t, n, r) => {
    if (Np(e)) {
      Dp(e(r), t, n, r);
      return;
    }
    (t.validators === null && (t.validators = []), t.validators.push(_p(n, e)));
  },
  jp = (e, t, n, r) => {
    let i = Object.entries(e),
      a = i.length;
    for (let e = 0; e < a; e++) {
      let [a, o] = i[e];
      Dp(o, Mp(t, a), n, r);
    }
  },
  Mp = (e, t) => {
    let n = e,
      r = t.split(yp),
      i = r.length;
    for (let e = 0; e < i; e++) {
      let t = r[e],
        i = n.nextPart.get(t);
      (i || ((i = vp()), n.nextPart.set(t, i)), (n = i));
    }
    return n;
  },
  Np = (e) => `isThemeGetter` in e && e.isThemeGetter === !0,
  Pp = (e) => {
    if (e < 1) return { get: () => void 0, set: () => {} };
    let t = 0,
      n = Object.create(null),
      r = Object.create(null),
      i = (i, a) => {
        ((n[i] = a),
          t++,
          t > e && ((t = 0), (r = n), (n = Object.create(null))));
      };
    return {
      get(e) {
        let t = n[e];
        if (t !== void 0) return t;
        if ((t = r[e]) !== void 0) return (i(e, t), t);
      },
      set(e, t) {
        e in n ? (n[e] = t) : i(e, t);
      },
    };
  },
  Fp = `!`,
  Ip = `:`,
  Lp = [],
  Rp = (e, t, n, r, i) => ({
    modifiers: e,
    hasImportantModifier: t,
    baseClassName: n,
    maybePostfixModifierPosition: r,
    isExternal: i,
  }),
  zp = (e) => {
    let { prefix: t, experimentalParseClassName: n } = e,
      r = (e) => {
        let t = [],
          n = 0,
          r = 0,
          i = 0,
          a,
          o = e.length;
        for (let s = 0; s < o; s++) {
          let o = e[s];
          if (n === 0 && r === 0) {
            if (o === Ip) {
              (t.push(e.slice(i, s)), (i = s + 1));
              continue;
            }
            if (o === `/`) {
              a = s;
              continue;
            }
          }
          o === `[`
            ? n++
            : o === `]`
              ? n--
              : o === `(`
                ? r++
                : o === `)` && r--;
        }
        let s = t.length === 0 ? e : e.slice(i),
          c = s,
          l = !1;
        s.endsWith(Fp)
          ? ((c = s.slice(0, -1)), (l = !0))
          : s.startsWith(Fp) && ((c = s.slice(1)), (l = !0));
        let u = a && a > i ? a - i : void 0;
        return Rp(t, l, c, u);
      };
    if (t) {
      let e = t + Ip,
        n = r;
      r = (t) =>
        t.startsWith(e) ? n(t.slice(e.length)) : Rp(Lp, !1, t, void 0, !0);
    }
    if (n) {
      let e = r;
      r = (t) => n({ className: t, parseClassName: e });
    }
    return r;
  },
  Bp = (e) => {
    let t = new Map();
    return (
      e.orderSensitiveModifiers.forEach((e, n) => {
        t.set(e, 1e6 + n);
      }),
      (e) => {
        let n = [],
          r = [];
        for (let i = 0; i < e.length; i++) {
          let a = e[i],
            o = a[0] === `[`,
            s = t.has(a);
          o || s
            ? (r.length > 0 && (r.sort(), n.push(...r), (r = [])), n.push(a))
            : r.push(a);
        }
        return (r.length > 0 && (r.sort(), n.push(...r)), n);
      }
    );
  },
  Vp = (e) => ({
    cache: Pp(e.cacheSize),
    parseClassName: zp(e),
    sortModifiers: Bp(e),
    ...Sp(e),
  }),
  Hp = /\s+/,
  Up = (e, t) => {
    let {
        parseClassName: n,
        getClassGroupId: r,
        getConflictingClassGroupIds: i,
        sortModifiers: a,
      } = t,
      o = [],
      s = e.trim().split(Hp),
      c = ``;
    for (let e = s.length - 1; e >= 0; --e) {
      let t = s[e],
        {
          isExternal: l,
          modifiers: u,
          hasImportantModifier: d,
          baseClassName: f,
          maybePostfixModifierPosition: p,
        } = n(t);
      if (l) {
        c = t + (c.length > 0 ? ` ` + c : c);
        continue;
      }
      let m = !!p,
        h = r(m ? f.substring(0, p) : f);
      if (!h) {
        if (!m) {
          c = t + (c.length > 0 ? ` ` + c : c);
          continue;
        }
        if (((h = r(f)), !h)) {
          c = t + (c.length > 0 ? ` ` + c : c);
          continue;
        }
        m = !1;
      }
      let g = u.length === 0 ? `` : u.length === 1 ? u[0] : a(u).join(`:`),
        _ = d ? g + Fp : g,
        v = _ + h;
      if (o.indexOf(v) > -1) continue;
      o.push(v);
      let y = i(h, m);
      for (let e = 0; e < y.length; ++e) {
        let t = y[e];
        o.push(_ + t);
      }
      c = t + (c.length > 0 ? ` ` + c : c);
    }
    return c;
  },
  Wp = (...e) => {
    let t = 0,
      n,
      r,
      i = ``;
    for (; t < e.length; )
      (n = e[t++]) && (r = Gp(n)) && (i && (i += ` `), (i += r));
    return i;
  },
  Gp = (e) => {
    if (typeof e == `string`) return e;
    let t,
      n = ``;
    for (let r = 0; r < e.length; r++)
      e[r] && (t = Gp(e[r])) && (n && (n += ` `), (n += t));
    return n;
  },
  Kp = (e, ...t) => {
    let n,
      r,
      i,
      a,
      o = (o) => (
        (n = Vp(t.reduce((e, t) => t(e), e()))),
        (r = n.cache.get),
        (i = n.cache.set),
        (a = s),
        s(o)
      ),
      s = (e) => {
        let t = r(e);
        if (t) return t;
        let a = Up(e, n);
        return (i(e, a), a);
      };
    return ((a = o), (...e) => a(Wp(...e)));
  },
  qp = [],
  Jp = (e) => {
    let t = (t) => t[e] || qp;
    return ((t.isThemeGetter = !0), t);
  },
  Yp = /^\[(?:(\w[\w-]*):)?(.+)\]$/i,
  Xp = /^\((?:(\w[\w-]*):)?(.+)\)$/i,
  Zp = /^\d+\/\d+$/,
  Qp = /^(\d+(\.\d+)?)?(xs|sm|md|lg|xl)$/,
  $p =
    /\d+(%|px|r?em|[sdl]?v([hwib]|min|max)|pt|pc|in|cm|mm|cap|ch|ex|r?lh|cq(w|h|i|b|min|max))|\b(calc|min|max|clamp)\(.+\)|^0$/,
  em = /^(rgba?|hsla?|hwb|(ok)?(lab|lch)|color-mix)\(.+\)$/,
  tm = /^(inset_)?-?((\d+)?\.?(\d+)[a-z]+|0)_-?((\d+)?\.?(\d+)[a-z]+|0)/,
  nm =
    /^(url|image|image-set|cross-fade|element|(repeating-)?(linear|radial|conic)-gradient)\(.+\)$/,
  rm = (e) => Zp.test(e),
  K = (e) => !!e && !Number.isNaN(Number(e)),
  im = (e) => !!e && Number.isInteger(Number(e)),
  am = (e) => e.endsWith(`%`) && K(e.slice(0, -1)),
  om = (e) => Qp.test(e),
  sm = () => !0,
  cm = (e) => $p.test(e) && !em.test(e),
  lm = () => !1,
  um = (e) => tm.test(e),
  dm = (e) => nm.test(e),
  fm = (e) => !q(e) && !J(e),
  pm = (e) => Tm(e, km, lm),
  q = (e) => Yp.test(e),
  mm = (e) => Tm(e, Am, cm),
  hm = (e) => Tm(e, jm, K),
  gm = (e) => Tm(e, Dm, lm),
  _m = (e) => Tm(e, Om, dm),
  vm = (e) => Tm(e, Nm, um),
  J = (e) => Xp.test(e),
  ym = (e) => Em(e, Am),
  bm = (e) => Em(e, Mm),
  xm = (e) => Em(e, Dm),
  Sm = (e) => Em(e, km),
  Cm = (e) => Em(e, Om),
  wm = (e) => Em(e, Nm, !0),
  Tm = (e, t, n) => {
    let r = Yp.exec(e);
    return r ? (r[1] ? t(r[1]) : n(r[2])) : !1;
  },
  Em = (e, t, n = !1) => {
    let r = Xp.exec(e);
    return r ? (r[1] ? t(r[1]) : n) : !1;
  },
  Dm = (e) => e === `position` || e === `percentage`,
  Om = (e) => e === `image` || e === `url`,
  km = (e) => e === `length` || e === `size` || e === `bg-size`,
  Am = (e) => e === `length`,
  jm = (e) => e === `number`,
  Mm = (e) => e === `family-name`,
  Nm = (e) => e === `shadow`,
  Pm = Kp(() => {
    let e = Jp(`color`),
      t = Jp(`font`),
      n = Jp(`text`),
      r = Jp(`font-weight`),
      i = Jp(`tracking`),
      a = Jp(`leading`),
      o = Jp(`breakpoint`),
      s = Jp(`container`),
      c = Jp(`spacing`),
      l = Jp(`radius`),
      u = Jp(`shadow`),
      d = Jp(`inset-shadow`),
      f = Jp(`text-shadow`),
      p = Jp(`drop-shadow`),
      m = Jp(`blur`),
      h = Jp(`perspective`),
      g = Jp(`aspect`),
      _ = Jp(`ease`),
      v = Jp(`animate`),
      y = () => [
        `auto`,
        `avoid`,
        `all`,
        `avoid-page`,
        `page`,
        `left`,
        `right`,
        `column`,
      ],
      b = () => [
        `center`,
        `top`,
        `bottom`,
        `left`,
        `right`,
        `top-left`,
        `left-top`,
        `top-right`,
        `right-top`,
        `bottom-right`,
        `right-bottom`,
        `bottom-left`,
        `left-bottom`,
      ],
      x = () => [...b(), J, q],
      S = () => [`auto`, `hidden`, `clip`, `visible`, `scroll`],
      C = () => [`auto`, `contain`, `none`],
      w = () => [J, q, c],
      T = () => [rm, `full`, `auto`, ...w()],
      E = () => [im, `none`, `subgrid`, J, q],
      D = () => [`auto`, { span: [`full`, im, J, q] }, im, J, q],
      ee = () => [im, `auto`, J, q],
      te = () => [`auto`, `min`, `max`, `fr`, J, q],
      ne = () => [
        `start`,
        `end`,
        `center`,
        `between`,
        `around`,
        `evenly`,
        `stretch`,
        `baseline`,
        `center-safe`,
        `end-safe`,
      ],
      re = () => [
        `start`,
        `end`,
        `center`,
        `stretch`,
        `center-safe`,
        `end-safe`,
      ],
      ie = () => [`auto`, ...w()],
      O = () => [
        rm,
        `auto`,
        `full`,
        `dvw`,
        `dvh`,
        `lvw`,
        `lvh`,
        `svw`,
        `svh`,
        `min`,
        `max`,
        `fit`,
        ...w(),
      ],
      k = () => [e, J, q],
      ae = () => [...b(), xm, gm, { position: [J, q] }],
      oe = () => [`no-repeat`, { repeat: [``, `x`, `y`, `space`, `round`] }],
      se = () => [`auto`, `cover`, `contain`, Sm, pm, { size: [J, q] }],
      ce = () => [am, ym, mm],
      A = () => [``, `none`, `full`, l, J, q],
      le = () => [``, K, ym, mm],
      ue = () => [`solid`, `dashed`, `dotted`, `double`],
      de = () => [
        `normal`,
        `multiply`,
        `screen`,
        `overlay`,
        `darken`,
        `lighten`,
        `color-dodge`,
        `color-burn`,
        `hard-light`,
        `soft-light`,
        `difference`,
        `exclusion`,
        `hue`,
        `saturation`,
        `color`,
        `luminosity`,
      ],
      j = () => [K, am, xm, gm],
      fe = () => [``, `none`, m, J, q],
      M = () => [`none`, K, J, q],
      N = () => [`none`, K, J, q],
      pe = () => [K, J, q],
      P = () => [rm, `full`, ...w()];
    return {
      cacheSize: 500,
      theme: {
        animate: [`spin`, `ping`, `pulse`, `bounce`],
        aspect: [`video`],
        blur: [om],
        breakpoint: [om],
        color: [sm],
        container: [om],
        "drop-shadow": [om],
        ease: [`in`, `out`, `in-out`],
        font: [fm],
        "font-weight": [
          `thin`,
          `extralight`,
          `light`,
          `normal`,
          `medium`,
          `semibold`,
          `bold`,
          `extrabold`,
          `black`,
        ],
        "inset-shadow": [om],
        leading: [`none`, `tight`, `snug`, `normal`, `relaxed`, `loose`],
        perspective: [
          `dramatic`,
          `near`,
          `normal`,
          `midrange`,
          `distant`,
          `none`,
        ],
        radius: [om],
        shadow: [om],
        spacing: [`px`, K],
        text: [om],
        "text-shadow": [om],
        tracking: [`tighter`, `tight`, `normal`, `wide`, `wider`, `widest`],
      },
      classGroups: {
        aspect: [{ aspect: [`auto`, `square`, rm, q, J, g] }],
        container: [`container`],
        columns: [{ columns: [K, q, J, s] }],
        "break-after": [{ "break-after": y() }],
        "break-before": [{ "break-before": y() }],
        "break-inside": [
          { "break-inside": [`auto`, `avoid`, `avoid-page`, `avoid-column`] },
        ],
        "box-decoration": [{ "box-decoration": [`slice`, `clone`] }],
        box: [{ box: [`border`, `content`] }],
        display: [
          `block`,
          `inline-block`,
          `inline`,
          `flex`,
          `inline-flex`,
          `table`,
          `inline-table`,
          `table-caption`,
          `table-cell`,
          `table-column`,
          `table-column-group`,
          `table-footer-group`,
          `table-header-group`,
          `table-row-group`,
          `table-row`,
          `flow-root`,
          `grid`,
          `inline-grid`,
          `contents`,
          `list-item`,
          `hidden`,
        ],
        sr: [`sr-only`, `not-sr-only`],
        float: [{ float: [`right`, `left`, `none`, `start`, `end`] }],
        clear: [{ clear: [`left`, `right`, `both`, `none`, `start`, `end`] }],
        isolation: [`isolate`, `isolation-auto`],
        "object-fit": [
          { object: [`contain`, `cover`, `fill`, `none`, `scale-down`] },
        ],
        "object-position": [{ object: x() }],
        overflow: [{ overflow: S() }],
        "overflow-x": [{ "overflow-x": S() }],
        "overflow-y": [{ "overflow-y": S() }],
        overscroll: [{ overscroll: C() }],
        "overscroll-x": [{ "overscroll-x": C() }],
        "overscroll-y": [{ "overscroll-y": C() }],
        position: [`static`, `fixed`, `absolute`, `relative`, `sticky`],
        inset: [{ inset: T() }],
        "inset-x": [{ "inset-x": T() }],
        "inset-y": [{ "inset-y": T() }],
        start: [{ start: T() }],
        end: [{ end: T() }],
        top: [{ top: T() }],
        right: [{ right: T() }],
        bottom: [{ bottom: T() }],
        left: [{ left: T() }],
        visibility: [`visible`, `invisible`, `collapse`],
        z: [{ z: [im, `auto`, J, q] }],
        basis: [{ basis: [rm, `full`, `auto`, s, ...w()] }],
        "flex-direction": [
          { flex: [`row`, `row-reverse`, `col`, `col-reverse`] },
        ],
        "flex-wrap": [{ flex: [`nowrap`, `wrap`, `wrap-reverse`] }],
        flex: [{ flex: [K, rm, `auto`, `initial`, `none`, q] }],
        grow: [{ grow: [``, K, J, q] }],
        shrink: [{ shrink: [``, K, J, q] }],
        order: [{ order: [im, `first`, `last`, `none`, J, q] }],
        "grid-cols": [{ "grid-cols": E() }],
        "col-start-end": [{ col: D() }],
        "col-start": [{ "col-start": ee() }],
        "col-end": [{ "col-end": ee() }],
        "grid-rows": [{ "grid-rows": E() }],
        "row-start-end": [{ row: D() }],
        "row-start": [{ "row-start": ee() }],
        "row-end": [{ "row-end": ee() }],
        "grid-flow": [
          { "grid-flow": [`row`, `col`, `dense`, `row-dense`, `col-dense`] },
        ],
        "auto-cols": [{ "auto-cols": te() }],
        "auto-rows": [{ "auto-rows": te() }],
        gap: [{ gap: w() }],
        "gap-x": [{ "gap-x": w() }],
        "gap-y": [{ "gap-y": w() }],
        "justify-content": [{ justify: [...ne(), `normal`] }],
        "justify-items": [{ "justify-items": [...re(), `normal`] }],
        "justify-self": [{ "justify-self": [`auto`, ...re()] }],
        "align-content": [{ content: [`normal`, ...ne()] }],
        "align-items": [{ items: [...re(), { baseline: [``, `last`] }] }],
        "align-self": [{ self: [`auto`, ...re(), { baseline: [``, `last`] }] }],
        "place-content": [{ "place-content": ne() }],
        "place-items": [{ "place-items": [...re(), `baseline`] }],
        "place-self": [{ "place-self": [`auto`, ...re()] }],
        p: [{ p: w() }],
        px: [{ px: w() }],
        py: [{ py: w() }],
        ps: [{ ps: w() }],
        pe: [{ pe: w() }],
        pt: [{ pt: w() }],
        pr: [{ pr: w() }],
        pb: [{ pb: w() }],
        pl: [{ pl: w() }],
        m: [{ m: ie() }],
        mx: [{ mx: ie() }],
        my: [{ my: ie() }],
        ms: [{ ms: ie() }],
        me: [{ me: ie() }],
        mt: [{ mt: ie() }],
        mr: [{ mr: ie() }],
        mb: [{ mb: ie() }],
        ml: [{ ml: ie() }],
        "space-x": [{ "space-x": w() }],
        "space-x-reverse": [`space-x-reverse`],
        "space-y": [{ "space-y": w() }],
        "space-y-reverse": [`space-y-reverse`],
        size: [{ size: O() }],
        w: [{ w: [s, `screen`, ...O()] }],
        "min-w": [{ "min-w": [s, `screen`, `none`, ...O()] }],
        "max-w": [
          { "max-w": [s, `screen`, `none`, `prose`, { screen: [o] }, ...O()] },
        ],
        h: [{ h: [`screen`, `lh`, ...O()] }],
        "min-h": [{ "min-h": [`screen`, `lh`, `none`, ...O()] }],
        "max-h": [{ "max-h": [`screen`, `lh`, ...O()] }],
        "font-size": [{ text: [`base`, n, ym, mm] }],
        "font-smoothing": [`antialiased`, `subpixel-antialiased`],
        "font-style": [`italic`, `not-italic`],
        "font-weight": [{ font: [r, J, hm] }],
        "font-stretch": [
          {
            "font-stretch": [
              `ultra-condensed`,
              `extra-condensed`,
              `condensed`,
              `semi-condensed`,
              `normal`,
              `semi-expanded`,
              `expanded`,
              `extra-expanded`,
              `ultra-expanded`,
              am,
              q,
            ],
          },
        ],
        "font-family": [{ font: [bm, q, t] }],
        "fvn-normal": [`normal-nums`],
        "fvn-ordinal": [`ordinal`],
        "fvn-slashed-zero": [`slashed-zero`],
        "fvn-figure": [`lining-nums`, `oldstyle-nums`],
        "fvn-spacing": [`proportional-nums`, `tabular-nums`],
        "fvn-fraction": [`diagonal-fractions`, `stacked-fractions`],
        tracking: [{ tracking: [i, J, q] }],
        "line-clamp": [{ "line-clamp": [K, `none`, J, hm] }],
        leading: [{ leading: [a, ...w()] }],
        "list-image": [{ "list-image": [`none`, J, q] }],
        "list-style-position": [{ list: [`inside`, `outside`] }],
        "list-style-type": [{ list: [`disc`, `decimal`, `none`, J, q] }],
        "text-alignment": [
          { text: [`left`, `center`, `right`, `justify`, `start`, `end`] },
        ],
        "placeholder-color": [{ placeholder: k() }],
        "text-color": [{ text: k() }],
        "text-decoration": [
          `underline`,
          `overline`,
          `line-through`,
          `no-underline`,
        ],
        "text-decoration-style": [{ decoration: [...ue(), `wavy`] }],
        "text-decoration-thickness": [
          { decoration: [K, `from-font`, `auto`, J, mm] },
        ],
        "text-decoration-color": [{ decoration: k() }],
        "underline-offset": [{ "underline-offset": [K, `auto`, J, q] }],
        "text-transform": [
          `uppercase`,
          `lowercase`,
          `capitalize`,
          `normal-case`,
        ],
        "text-overflow": [`truncate`, `text-ellipsis`, `text-clip`],
        "text-wrap": [{ text: [`wrap`, `nowrap`, `balance`, `pretty`] }],
        indent: [{ indent: w() }],
        "vertical-align": [
          {
            align: [
              `baseline`,
              `top`,
              `middle`,
              `bottom`,
              `text-top`,
              `text-bottom`,
              `sub`,
              `super`,
              J,
              q,
            ],
          },
        ],
        whitespace: [
          {
            whitespace: [
              `normal`,
              `nowrap`,
              `pre`,
              `pre-line`,
              `pre-wrap`,
              `break-spaces`,
            ],
          },
        ],
        break: [{ break: [`normal`, `words`, `all`, `keep`] }],
        wrap: [{ wrap: [`break-word`, `anywhere`, `normal`] }],
        hyphens: [{ hyphens: [`none`, `manual`, `auto`] }],
        content: [{ content: [`none`, J, q] }],
        "bg-attachment": [{ bg: [`fixed`, `local`, `scroll`] }],
        "bg-clip": [{ "bg-clip": [`border`, `padding`, `content`, `text`] }],
        "bg-origin": [{ "bg-origin": [`border`, `padding`, `content`] }],
        "bg-position": [{ bg: ae() }],
        "bg-repeat": [{ bg: oe() }],
        "bg-size": [{ bg: se() }],
        "bg-image": [
          {
            bg: [
              `none`,
              {
                linear: [
                  { to: [`t`, `tr`, `r`, `br`, `b`, `bl`, `l`, `tl`] },
                  im,
                  J,
                  q,
                ],
                radial: [``, J, q],
                conic: [im, J, q],
              },
              Cm,
              _m,
            ],
          },
        ],
        "bg-color": [{ bg: k() }],
        "gradient-from-pos": [{ from: ce() }],
        "gradient-via-pos": [{ via: ce() }],
        "gradient-to-pos": [{ to: ce() }],
        "gradient-from": [{ from: k() }],
        "gradient-via": [{ via: k() }],
        "gradient-to": [{ to: k() }],
        rounded: [{ rounded: A() }],
        "rounded-s": [{ "rounded-s": A() }],
        "rounded-e": [{ "rounded-e": A() }],
        "rounded-t": [{ "rounded-t": A() }],
        "rounded-r": [{ "rounded-r": A() }],
        "rounded-b": [{ "rounded-b": A() }],
        "rounded-l": [{ "rounded-l": A() }],
        "rounded-ss": [{ "rounded-ss": A() }],
        "rounded-se": [{ "rounded-se": A() }],
        "rounded-ee": [{ "rounded-ee": A() }],
        "rounded-es": [{ "rounded-es": A() }],
        "rounded-tl": [{ "rounded-tl": A() }],
        "rounded-tr": [{ "rounded-tr": A() }],
        "rounded-br": [{ "rounded-br": A() }],
        "rounded-bl": [{ "rounded-bl": A() }],
        "border-w": [{ border: le() }],
        "border-w-x": [{ "border-x": le() }],
        "border-w-y": [{ "border-y": le() }],
        "border-w-s": [{ "border-s": le() }],
        "border-w-e": [{ "border-e": le() }],
        "border-w-t": [{ "border-t": le() }],
        "border-w-r": [{ "border-r": le() }],
        "border-w-b": [{ "border-b": le() }],
        "border-w-l": [{ "border-l": le() }],
        "divide-x": [{ "divide-x": le() }],
        "divide-x-reverse": [`divide-x-reverse`],
        "divide-y": [{ "divide-y": le() }],
        "divide-y-reverse": [`divide-y-reverse`],
        "border-style": [{ border: [...ue(), `hidden`, `none`] }],
        "divide-style": [{ divide: [...ue(), `hidden`, `none`] }],
        "border-color": [{ border: k() }],
        "border-color-x": [{ "border-x": k() }],
        "border-color-y": [{ "border-y": k() }],
        "border-color-s": [{ "border-s": k() }],
        "border-color-e": [{ "border-e": k() }],
        "border-color-t": [{ "border-t": k() }],
        "border-color-r": [{ "border-r": k() }],
        "border-color-b": [{ "border-b": k() }],
        "border-color-l": [{ "border-l": k() }],
        "divide-color": [{ divide: k() }],
        "outline-style": [{ outline: [...ue(), `none`, `hidden`] }],
        "outline-offset": [{ "outline-offset": [K, J, q] }],
        "outline-w": [{ outline: [``, K, ym, mm] }],
        "outline-color": [{ outline: k() }],
        shadow: [{ shadow: [``, `none`, u, wm, vm] }],
        "shadow-color": [{ shadow: k() }],
        "inset-shadow": [{ "inset-shadow": [`none`, d, wm, vm] }],
        "inset-shadow-color": [{ "inset-shadow": k() }],
        "ring-w": [{ ring: le() }],
        "ring-w-inset": [`ring-inset`],
        "ring-color": [{ ring: k() }],
        "ring-offset-w": [{ "ring-offset": [K, mm] }],
        "ring-offset-color": [{ "ring-offset": k() }],
        "inset-ring-w": [{ "inset-ring": le() }],
        "inset-ring-color": [{ "inset-ring": k() }],
        "text-shadow": [{ "text-shadow": [`none`, f, wm, vm] }],
        "text-shadow-color": [{ "text-shadow": k() }],
        opacity: [{ opacity: [K, J, q] }],
        "mix-blend": [
          { "mix-blend": [...de(), `plus-darker`, `plus-lighter`] },
        ],
        "bg-blend": [{ "bg-blend": de() }],
        "mask-clip": [
          {
            "mask-clip": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
          `mask-no-clip`,
        ],
        "mask-composite": [
          { mask: [`add`, `subtract`, `intersect`, `exclude`] },
        ],
        "mask-image-linear-pos": [{ "mask-linear": [K] }],
        "mask-image-linear-from-pos": [{ "mask-linear-from": j() }],
        "mask-image-linear-to-pos": [{ "mask-linear-to": j() }],
        "mask-image-linear-from-color": [{ "mask-linear-from": k() }],
        "mask-image-linear-to-color": [{ "mask-linear-to": k() }],
        "mask-image-t-from-pos": [{ "mask-t-from": j() }],
        "mask-image-t-to-pos": [{ "mask-t-to": j() }],
        "mask-image-t-from-color": [{ "mask-t-from": k() }],
        "mask-image-t-to-color": [{ "mask-t-to": k() }],
        "mask-image-r-from-pos": [{ "mask-r-from": j() }],
        "mask-image-r-to-pos": [{ "mask-r-to": j() }],
        "mask-image-r-from-color": [{ "mask-r-from": k() }],
        "mask-image-r-to-color": [{ "mask-r-to": k() }],
        "mask-image-b-from-pos": [{ "mask-b-from": j() }],
        "mask-image-b-to-pos": [{ "mask-b-to": j() }],
        "mask-image-b-from-color": [{ "mask-b-from": k() }],
        "mask-image-b-to-color": [{ "mask-b-to": k() }],
        "mask-image-l-from-pos": [{ "mask-l-from": j() }],
        "mask-image-l-to-pos": [{ "mask-l-to": j() }],
        "mask-image-l-from-color": [{ "mask-l-from": k() }],
        "mask-image-l-to-color": [{ "mask-l-to": k() }],
        "mask-image-x-from-pos": [{ "mask-x-from": j() }],
        "mask-image-x-to-pos": [{ "mask-x-to": j() }],
        "mask-image-x-from-color": [{ "mask-x-from": k() }],
        "mask-image-x-to-color": [{ "mask-x-to": k() }],
        "mask-image-y-from-pos": [{ "mask-y-from": j() }],
        "mask-image-y-to-pos": [{ "mask-y-to": j() }],
        "mask-image-y-from-color": [{ "mask-y-from": k() }],
        "mask-image-y-to-color": [{ "mask-y-to": k() }],
        "mask-image-radial": [{ "mask-radial": [J, q] }],
        "mask-image-radial-from-pos": [{ "mask-radial-from": j() }],
        "mask-image-radial-to-pos": [{ "mask-radial-to": j() }],
        "mask-image-radial-from-color": [{ "mask-radial-from": k() }],
        "mask-image-radial-to-color": [{ "mask-radial-to": k() }],
        "mask-image-radial-shape": [{ "mask-radial": [`circle`, `ellipse`] }],
        "mask-image-radial-size": [
          {
            "mask-radial": [
              { closest: [`side`, `corner`], farthest: [`side`, `corner`] },
            ],
          },
        ],
        "mask-image-radial-pos": [{ "mask-radial-at": b() }],
        "mask-image-conic-pos": [{ "mask-conic": [K] }],
        "mask-image-conic-from-pos": [{ "mask-conic-from": j() }],
        "mask-image-conic-to-pos": [{ "mask-conic-to": j() }],
        "mask-image-conic-from-color": [{ "mask-conic-from": k() }],
        "mask-image-conic-to-color": [{ "mask-conic-to": k() }],
        "mask-mode": [{ mask: [`alpha`, `luminance`, `match`] }],
        "mask-origin": [
          {
            "mask-origin": [
              `border`,
              `padding`,
              `content`,
              `fill`,
              `stroke`,
              `view`,
            ],
          },
        ],
        "mask-position": [{ mask: ae() }],
        "mask-repeat": [{ mask: oe() }],
        "mask-size": [{ mask: se() }],
        "mask-type": [{ "mask-type": [`alpha`, `luminance`] }],
        "mask-image": [{ mask: [`none`, J, q] }],
        filter: [{ filter: [``, `none`, J, q] }],
        blur: [{ blur: fe() }],
        brightness: [{ brightness: [K, J, q] }],
        contrast: [{ contrast: [K, J, q] }],
        "drop-shadow": [{ "drop-shadow": [``, `none`, p, wm, vm] }],
        "drop-shadow-color": [{ "drop-shadow": k() }],
        grayscale: [{ grayscale: [``, K, J, q] }],
        "hue-rotate": [{ "hue-rotate": [K, J, q] }],
        invert: [{ invert: [``, K, J, q] }],
        saturate: [{ saturate: [K, J, q] }],
        sepia: [{ sepia: [``, K, J, q] }],
        "backdrop-filter": [{ "backdrop-filter": [``, `none`, J, q] }],
        "backdrop-blur": [{ "backdrop-blur": fe() }],
        "backdrop-brightness": [{ "backdrop-brightness": [K, J, q] }],
        "backdrop-contrast": [{ "backdrop-contrast": [K, J, q] }],
        "backdrop-grayscale": [{ "backdrop-grayscale": [``, K, J, q] }],
        "backdrop-hue-rotate": [{ "backdrop-hue-rotate": [K, J, q] }],
        "backdrop-invert": [{ "backdrop-invert": [``, K, J, q] }],
        "backdrop-opacity": [{ "backdrop-opacity": [K, J, q] }],
        "backdrop-saturate": [{ "backdrop-saturate": [K, J, q] }],
        "backdrop-sepia": [{ "backdrop-sepia": [``, K, J, q] }],
        "border-collapse": [{ border: [`collapse`, `separate`] }],
        "border-spacing": [{ "border-spacing": w() }],
        "border-spacing-x": [{ "border-spacing-x": w() }],
        "border-spacing-y": [{ "border-spacing-y": w() }],
        "table-layout": [{ table: [`auto`, `fixed`] }],
        caption: [{ caption: [`top`, `bottom`] }],
        transition: [
          {
            transition: [
              ``,
              `all`,
              `colors`,
              `opacity`,
              `shadow`,
              `transform`,
              `none`,
              J,
              q,
            ],
          },
        ],
        "transition-behavior": [{ transition: [`normal`, `discrete`] }],
        duration: [{ duration: [K, `initial`, J, q] }],
        ease: [{ ease: [`linear`, `initial`, _, J, q] }],
        delay: [{ delay: [K, J, q] }],
        animate: [{ animate: [`none`, v, J, q] }],
        backface: [{ backface: [`hidden`, `visible`] }],
        perspective: [{ perspective: [h, J, q] }],
        "perspective-origin": [{ "perspective-origin": x() }],
        rotate: [{ rotate: M() }],
        "rotate-x": [{ "rotate-x": M() }],
        "rotate-y": [{ "rotate-y": M() }],
        "rotate-z": [{ "rotate-z": M() }],
        scale: [{ scale: N() }],
        "scale-x": [{ "scale-x": N() }],
        "scale-y": [{ "scale-y": N() }],
        "scale-z": [{ "scale-z": N() }],
        "scale-3d": [`scale-3d`],
        skew: [{ skew: pe() }],
        "skew-x": [{ "skew-x": pe() }],
        "skew-y": [{ "skew-y": pe() }],
        transform: [{ transform: [J, q, ``, `none`, `gpu`, `cpu`] }],
        "transform-origin": [{ origin: x() }],
        "transform-style": [{ transform: [`3d`, `flat`] }],
        translate: [{ translate: P() }],
        "translate-x": [{ "translate-x": P() }],
        "translate-y": [{ "translate-y": P() }],
        "translate-z": [{ "translate-z": P() }],
        "translate-none": [`translate-none`],
        accent: [{ accent: k() }],
        appearance: [{ appearance: [`none`, `auto`] }],
        "caret-color": [{ caret: k() }],
        "color-scheme": [
          {
            scheme: [
              `normal`,
              `dark`,
              `light`,
              `light-dark`,
              `only-dark`,
              `only-light`,
            ],
          },
        ],
        cursor: [
          {
            cursor: [
              `auto`,
              `default`,
              `pointer`,
              `wait`,
              `text`,
              `move`,
              `help`,
              `not-allowed`,
              `none`,
              `context-menu`,
              `progress`,
              `cell`,
              `crosshair`,
              `vertical-text`,
              `alias`,
              `copy`,
              `no-drop`,
              `grab`,
              `grabbing`,
              `all-scroll`,
              `col-resize`,
              `row-resize`,
              `n-resize`,
              `e-resize`,
              `s-resize`,
              `w-resize`,
              `ne-resize`,
              `nw-resize`,
              `se-resize`,
              `sw-resize`,
              `ew-resize`,
              `ns-resize`,
              `nesw-resize`,
              `nwse-resize`,
              `zoom-in`,
              `zoom-out`,
              J,
              q,
            ],
          },
        ],
        "field-sizing": [{ "field-sizing": [`fixed`, `content`] }],
        "pointer-events": [{ "pointer-events": [`auto`, `none`] }],
        resize: [{ resize: [`none`, ``, `y`, `x`] }],
        "scroll-behavior": [{ scroll: [`auto`, `smooth`] }],
        "scroll-m": [{ "scroll-m": w() }],
        "scroll-mx": [{ "scroll-mx": w() }],
        "scroll-my": [{ "scroll-my": w() }],
        "scroll-ms": [{ "scroll-ms": w() }],
        "scroll-me": [{ "scroll-me": w() }],
        "scroll-mt": [{ "scroll-mt": w() }],
        "scroll-mr": [{ "scroll-mr": w() }],
        "scroll-mb": [{ "scroll-mb": w() }],
        "scroll-ml": [{ "scroll-ml": w() }],
        "scroll-p": [{ "scroll-p": w() }],
        "scroll-px": [{ "scroll-px": w() }],
        "scroll-py": [{ "scroll-py": w() }],
        "scroll-ps": [{ "scroll-ps": w() }],
        "scroll-pe": [{ "scroll-pe": w() }],
        "scroll-pt": [{ "scroll-pt": w() }],
        "scroll-pr": [{ "scroll-pr": w() }],
        "scroll-pb": [{ "scroll-pb": w() }],
        "scroll-pl": [{ "scroll-pl": w() }],
        "snap-align": [{ snap: [`start`, `end`, `center`, `align-none`] }],
        "snap-stop": [{ snap: [`normal`, `always`] }],
        "snap-type": [{ snap: [`none`, `x`, `y`, `both`] }],
        "snap-strictness": [{ snap: [`mandatory`, `proximity`] }],
        touch: [{ touch: [`auto`, `none`, `manipulation`] }],
        "touch-x": [{ "touch-pan": [`x`, `left`, `right`] }],
        "touch-y": [{ "touch-pan": [`y`, `up`, `down`] }],
        "touch-pz": [`touch-pinch-zoom`],
        select: [{ select: [`none`, `text`, `all`, `auto`] }],
        "will-change": [
          { "will-change": [`auto`, `scroll`, `contents`, `transform`, J, q] },
        ],
        fill: [{ fill: [`none`, ...k()] }],
        "stroke-w": [{ stroke: [K, ym, mm, hm] }],
        stroke: [{ stroke: [`none`, ...k()] }],
        "forced-color-adjust": [{ "forced-color-adjust": [`auto`, `none`] }],
      },
      conflictingClassGroups: {
        overflow: [`overflow-x`, `overflow-y`],
        overscroll: [`overscroll-x`, `overscroll-y`],
        inset: [
          `inset-x`,
          `inset-y`,
          `start`,
          `end`,
          `top`,
          `right`,
          `bottom`,
          `left`,
        ],
        "inset-x": [`right`, `left`],
        "inset-y": [`top`, `bottom`],
        flex: [`basis`, `grow`, `shrink`],
        gap: [`gap-x`, `gap-y`],
        p: [`px`, `py`, `ps`, `pe`, `pt`, `pr`, `pb`, `pl`],
        px: [`pr`, `pl`],
        py: [`pt`, `pb`],
        m: [`mx`, `my`, `ms`, `me`, `mt`, `mr`, `mb`, `ml`],
        mx: [`mr`, `ml`],
        my: [`mt`, `mb`],
        size: [`w`, `h`],
        "font-size": [`leading`],
        "fvn-normal": [
          `fvn-ordinal`,
          `fvn-slashed-zero`,
          `fvn-figure`,
          `fvn-spacing`,
          `fvn-fraction`,
        ],
        "fvn-ordinal": [`fvn-normal`],
        "fvn-slashed-zero": [`fvn-normal`],
        "fvn-figure": [`fvn-normal`],
        "fvn-spacing": [`fvn-normal`],
        "fvn-fraction": [`fvn-normal`],
        "line-clamp": [`display`, `overflow`],
        rounded: [
          `rounded-s`,
          `rounded-e`,
          `rounded-t`,
          `rounded-r`,
          `rounded-b`,
          `rounded-l`,
          `rounded-ss`,
          `rounded-se`,
          `rounded-ee`,
          `rounded-es`,
          `rounded-tl`,
          `rounded-tr`,
          `rounded-br`,
          `rounded-bl`,
        ],
        "rounded-s": [`rounded-ss`, `rounded-es`],
        "rounded-e": [`rounded-se`, `rounded-ee`],
        "rounded-t": [`rounded-tl`, `rounded-tr`],
        "rounded-r": [`rounded-tr`, `rounded-br`],
        "rounded-b": [`rounded-br`, `rounded-bl`],
        "rounded-l": [`rounded-tl`, `rounded-bl`],
        "border-spacing": [`border-spacing-x`, `border-spacing-y`],
        "border-w": [
          `border-w-x`,
          `border-w-y`,
          `border-w-s`,
          `border-w-e`,
          `border-w-t`,
          `border-w-r`,
          `border-w-b`,
          `border-w-l`,
        ],
        "border-w-x": [`border-w-r`, `border-w-l`],
        "border-w-y": [`border-w-t`, `border-w-b`],
        "border-color": [
          `border-color-x`,
          `border-color-y`,
          `border-color-s`,
          `border-color-e`,
          `border-color-t`,
          `border-color-r`,
          `border-color-b`,
          `border-color-l`,
        ],
        "border-color-x": [`border-color-r`, `border-color-l`],
        "border-color-y": [`border-color-t`, `border-color-b`],
        translate: [`translate-x`, `translate-y`, `translate-none`],
        "translate-none": [
          `translate`,
          `translate-x`,
          `translate-y`,
          `translate-z`,
        ],
        "scroll-m": [
          `scroll-mx`,
          `scroll-my`,
          `scroll-ms`,
          `scroll-me`,
          `scroll-mt`,
          `scroll-mr`,
          `scroll-mb`,
          `scroll-ml`,
        ],
        "scroll-mx": [`scroll-mr`, `scroll-ml`],
        "scroll-my": [`scroll-mt`, `scroll-mb`],
        "scroll-p": [
          `scroll-px`,
          `scroll-py`,
          `scroll-ps`,
          `scroll-pe`,
          `scroll-pt`,
          `scroll-pr`,
          `scroll-pb`,
          `scroll-pl`,
        ],
        "scroll-px": [`scroll-pr`, `scroll-pl`],
        "scroll-py": [`scroll-pt`, `scroll-pb`],
        touch: [`touch-x`, `touch-y`, `touch-pz`],
        "touch-x": [`touch`],
        "touch-y": [`touch`],
        "touch-pz": [`touch`],
      },
      conflictingClassGroupModifiers: { "font-size": [`leading`] },
      orderSensitiveModifiers: [
        `*`,
        `**`,
        `after`,
        `backdrop`,
        `before`,
        `details-content`,
        `file`,
        `first-letter`,
        `first-line`,
        `marker`,
        `placeholder`,
        `selection`,
      ],
    };
  }),
  Fm = /^[$_\p{ID_Start}][$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,
  Im = /^[$_\p{ID_Start}][-$_\u{200C}\u{200D}\p{ID_Continue}]*$/u,
  Lm = {};
function Rm(e, t) {
  return ((t || Lm).jsx ? Im : Fm).test(e);
}
var zm = n((e, t) => {
    var n = /\/\*[^*]*\*+([^/*][^*]*\*+)*\//g,
      r = /\n/g,
      i = /^\s*/,
      a = /^(\*?[-#/*\\\w]+(\[[0-9a-z_-]+\])?)\s*/,
      o = /^:\s*/,
      s = /^((?:'(?:\\'|.)*?'|"(?:\\"|.)*?"|\([^)]*?\)|[^};])+)/,
      c = /^[;\s]*/,
      l = /^\s+|\s+$/g,
      u = `
`,
      d = `/`,
      f = `*`,
      p = ``,
      m = `comment`,
      h = `declaration`;
    function g(e, t) {
      if (typeof e != `string`)
        throw TypeError(`First argument must be a string`);
      if (!e) return [];
      t ||= {};
      var l = 1,
        g = 1;
      function v(e) {
        var t = e.match(r);
        t && (l += t.length);
        var n = e.lastIndexOf(u);
        g = ~n ? e.length - n : g + e.length;
      }
      function y() {
        var e = { line: l, column: g };
        return function (t) {
          return ((t.position = new b(e)), C(), t);
        };
      }
      function b(e) {
        ((this.start = e),
          (this.end = { line: l, column: g }),
          (this.source = t.source));
      }
      b.prototype.content = e;
      function x(n) {
        var r = Error(t.source + `:` + l + `:` + g + `: ` + n);
        if (
          ((r.reason = n),
          (r.filename = t.source),
          (r.line = l),
          (r.column = g),
          (r.source = e),
          !t.silent)
        )
          throw r;
      }
      function S(t) {
        var n = t.exec(e);
        if (n) {
          var r = n[0];
          return (v(r), (e = e.slice(r.length)), n);
        }
      }
      function C() {
        S(i);
      }
      function w(e) {
        var t;
        for (e ||= []; (t = T()); ) t !== !1 && e.push(t);
        return e;
      }
      function T() {
        var t = y();
        if (!(d != e.charAt(0) || f != e.charAt(1))) {
          for (
            var n = 2;
            p != e.charAt(n) && (f != e.charAt(n) || d != e.charAt(n + 1));
          )
            ++n;
          if (((n += 2), p === e.charAt(n - 1)))
            return x(`End of comment missing`);
          var r = e.slice(2, n - 2);
          return (
            (g += 2),
            v(r),
            (e = e.slice(n)),
            (g += 2),
            t({ type: m, comment: r })
          );
        }
      }
      function E() {
        var e = y(),
          t = S(a);
        if (t) {
          if ((T(), !S(o))) return x(`property missing ':'`);
          var r = S(s),
            i = e({
              type: h,
              property: _(t[0].replace(n, p)),
              value: r ? _(r[0].replace(n, p)) : p,
            });
          return (S(c), i);
        }
      }
      function D() {
        var e = [];
        w(e);
        for (var t; (t = E()); ) t !== !1 && (e.push(t), w(e));
        return e;
      }
      return (C(), D());
    }
    function _(e) {
      return e ? e.replace(l, p) : p;
    }
    t.exports = g;
  }),
  Bm = n((e) => {
    var t =
      (e && e.__importDefault) ||
      function (e) {
        return e && e.__esModule ? e : { default: e };
      };
    (Object.defineProperty(e, `__esModule`, { value: !0 }), (e.default = r));
    var n = t(zm());
    function r(e, t) {
      let r = null;
      if (!e || typeof e != `string`) return r;
      let i = (0, n.default)(e),
        a = typeof t == `function`;
      return (
        i.forEach((e) => {
          if (e.type !== `declaration`) return;
          let { property: n, value: i } = e;
          a ? t(n, i, e) : i && ((r ||= {}), (r[n] = i));
        }),
        r
      );
    }
  }),
  Vm = n((e) => {
    (Object.defineProperty(e, `__esModule`, { value: !0 }),
      (e.camelCase = void 0));
    var t = /^--[a-zA-Z0-9_-]+$/,
      n = /-([a-z])/g,
      r = /^[^-]+$/,
      i = /^-(webkit|moz|ms|o|khtml)-/,
      a = /^-(ms)-/,
      o = function (e) {
        return !e || r.test(e) || t.test(e);
      },
      s = function (e, t) {
        return t.toUpperCase();
      },
      c = function (e, t) {
        return `${t}-`;
      };
    e.camelCase = function (e, t) {
      return (
        t === void 0 && (t = {}),
        o(e)
          ? e
          : ((e = e.toLowerCase()),
            (e = t.reactCompat ? e.replace(a, c) : e.replace(i, c)),
            e.replace(n, s))
      );
    };
  }),
  Hm = n((e, t) => {
    var n = (
        (e && e.__importDefault) ||
        function (e) {
          return e && e.__esModule ? e : { default: e };
        }
      )(Bm()),
      r = Vm();
    function i(e, t) {
      var i = {};
      return (
        !e ||
          typeof e != `string` ||
          (0, n.default)(e, function (e, n) {
            e && n && (i[(0, r.camelCase)(e, t)] = n);
          }),
        i
      );
    }
    ((i.default = i), (t.exports = i));
  });
function Um(e) {
  return !e || typeof e != `object`
    ? ``
    : `position` in e || `type` in e
      ? Gm(e.position)
      : `start` in e || `end` in e
        ? Gm(e)
        : `line` in e || `column` in e
          ? Wm(e)
          : ``;
}
function Wm(e) {
  return Km(e && e.line) + `:` + Km(e && e.column);
}
function Gm(e) {
  return Wm(e && e.start) + `-` + Wm(e && e.end);
}
function Km(e) {
  return e && typeof e == `number` ? e : 1;
}
var qm = class extends Error {
  constructor(e, t, n) {
    (super(), typeof t == `string` && ((n = t), (t = void 0)));
    let r = ``,
      i = {},
      a = !1;
    if (
      (t &&
        (i =
          (`line` in t && `column` in t) || (`start` in t && `end` in t)
            ? { place: t }
            : `type` in t
              ? { ancestors: [t], place: t.position }
              : { ...t }),
      typeof e == `string`
        ? (r = e)
        : !i.cause && e && ((a = !0), (r = e.message), (i.cause = e)),
      !i.ruleId && !i.source && typeof n == `string`)
    ) {
      let e = n.indexOf(`:`);
      e === -1
        ? (i.ruleId = n)
        : ((i.source = n.slice(0, e)), (i.ruleId = n.slice(e + 1)));
    }
    if (!i.place && i.ancestors && i.ancestors) {
      let e = i.ancestors[i.ancestors.length - 1];
      e && (i.place = e.position);
    }
    let o = i.place && `start` in i.place ? i.place.start : i.place;
    ((this.ancestors = i.ancestors || void 0),
      (this.cause = i.cause || void 0),
      (this.column = o ? o.column : void 0),
      (this.fatal = void 0),
      (this.file = ``),
      (this.message = r),
      (this.line = o ? o.line : void 0),
      (this.name = Um(i.place) || `1:1`),
      (this.place = i.place || void 0),
      (this.reason = this.message),
      (this.ruleId = i.ruleId || void 0),
      (this.source = i.source || void 0),
      (this.stack =
        a && i.cause && typeof i.cause.stack == `string` ? i.cause.stack : ``),
      (this.actual = void 0),
      (this.expected = void 0),
      (this.note = void 0),
      (this.url = void 0));
  }
};
((qm.prototype.file = ``),
  (qm.prototype.name = ``),
  (qm.prototype.reason = ``),
  (qm.prototype.message = ``),
  (qm.prototype.stack = ``),
  (qm.prototype.column = void 0),
  (qm.prototype.line = void 0),
  (qm.prototype.ancestors = void 0),
  (qm.prototype.cause = void 0),
  (qm.prototype.fatal = void 0),
  (qm.prototype.place = void 0),
  (qm.prototype.ruleId = void 0),
  (qm.prototype.source = void 0));
var Jm = e(Hm(), 1),
  Ym = {}.hasOwnProperty,
  Xm = new Map(),
  Zm = /[A-Z]/g,
  Qm = new Set([`table`, `tbody`, `thead`, `tfoot`, `tr`]),
  $m = new Set([`td`, `th`]),
  eh = `https://github.com/syntax-tree/hast-util-to-jsx-runtime`;
function th(e, t) {
  if (!t || t.Fragment === void 0)
    throw TypeError("Expected `Fragment` in options");
  let n = t.filePath || void 0,
    r;
  if (t.development) {
    if (typeof t.jsxDEV != `function`)
      throw TypeError("Expected `jsxDEV` in options when `development: true`");
    r = fh(n, t.jsxDEV);
  } else {
    if (typeof t.jsx != `function`)
      throw TypeError("Expected `jsx` in production options");
    if (typeof t.jsxs != `function`)
      throw TypeError("Expected `jsxs` in production options");
    r = dh(n, t.jsx, t.jsxs);
  }
  let i = {
      Fragment: t.Fragment,
      ancestors: [],
      components: t.components || {},
      create: r,
      elementAttributeNameCase: t.elementAttributeNameCase || `react`,
      evaluater: t.createEvaluater ? t.createEvaluater() : void 0,
      filePath: n,
      ignoreInvalidStyle: t.ignoreInvalidStyle || !1,
      passKeys: t.passKeys !== !1,
      passNode: t.passNode || !1,
      schema: t.space === `svg` ? Le : Ie,
      stylePropertyNameCase: t.stylePropertyNameCase || `dom`,
      tableCellAlignToStyle: t.tableCellAlignToStyle !== !1,
    },
    a = nh(i, e, void 0);
  return a && typeof a != `string`
    ? a
    : i.create(e, i.Fragment, { children: a || void 0 }, void 0);
}
function nh(e, t, n) {
  if (t.type === `element`) return rh(e, t, n);
  if (t.type === `mdxFlowExpression` || t.type === `mdxTextExpression`)
    return ih(e, t);
  if (t.type === `mdxJsxFlowElement` || t.type === `mdxJsxTextElement`)
    return oh(e, t, n);
  if (t.type === `mdxjsEsm`) return ah(e, t);
  if (t.type === `root`) return sh(e, t, n);
  if (t.type === `text`) return ch(e, t);
}
function rh(e, t, n) {
  let r = e.schema,
    i = r;
  (t.tagName.toLowerCase() === `svg` &&
    r.space === `html` &&
    ((i = Le), (e.schema = i)),
    e.ancestors.push(t));
  let a = vh(e, t.tagName, !1),
    o = ph(e, t),
    s = hh(e, t);
  return (
    Qm.has(t.tagName) &&
      (s = s.filter(function (e) {
        return typeof e == `string` ? !Ke(e) : !0;
      })),
    lh(e, o, a, t),
    uh(o, s),
    e.ancestors.pop(),
    (e.schema = r),
    e.create(t, a, o, n)
  );
}
function ih(e, t) {
  if (t.data && t.data.estree && e.evaluater) {
    let n = t.data.estree.body[0];
    return (n.type, e.evaluater.evaluateExpression(n.expression));
  }
  yh(e, t.position);
}
function ah(e, t) {
  if (t.data && t.data.estree && e.evaluater)
    return e.evaluater.evaluateProgram(t.data.estree);
  yh(e, t.position);
}
function oh(e, t, n) {
  let r = e.schema,
    i = r;
  (t.name === `svg` && r.space === `html` && ((i = Le), (e.schema = i)),
    e.ancestors.push(t));
  let a = t.name === null ? e.Fragment : vh(e, t.name, !0),
    o = mh(e, t),
    s = hh(e, t);
  return (
    lh(e, o, a, t),
    uh(o, s),
    e.ancestors.pop(),
    (e.schema = r),
    e.create(t, a, o, n)
  );
}
function sh(e, t, n) {
  let r = {};
  return (uh(r, hh(e, t)), e.create(t, e.Fragment, r, n));
}
function ch(e, t) {
  return t.value;
}
function lh(e, t, n, r) {
  typeof n != `string` && n !== e.Fragment && e.passNode && (t.node = r);
}
function uh(e, t) {
  if (t.length > 0) {
    let n = t.length > 1 ? t : t[0];
    n && (e.children = n);
  }
}
function dh(e, t, n) {
  return r;
  function r(e, r, i, a) {
    let o = Array.isArray(i.children) ? n : t;
    return a ? o(r, i, a) : o(r, i);
  }
}
function fh(e, t) {
  return n;
  function n(n, r, i, a) {
    let o = Array.isArray(i.children),
      s = io(n);
    return t(
      r,
      i,
      a,
      o,
      {
        columnNumber: s ? s.column - 1 : void 0,
        fileName: e,
        lineNumber: s ? s.line : void 0,
      },
      void 0,
    );
  }
}
function ph(e, t) {
  let n = {},
    r,
    i;
  for (i in t.properties)
    if (i !== `children` && Ym.call(t.properties, i)) {
      let a = gh(e, i, t.properties[i]);
      if (a) {
        let [i, o] = a;
        e.tableCellAlignToStyle &&
        i === `align` &&
        typeof o == `string` &&
        $m.has(t.tagName)
          ? (r = o)
          : (n[i] = o);
      }
    }
  if (r) {
    let t = (n.style ||= {});
    t[e.stylePropertyNameCase === `css` ? `text-align` : `textAlign`] = r;
  }
  return n;
}
function mh(e, t) {
  let n = {};
  for (let r of t.attributes)
    if (r.type === `mdxJsxExpressionAttribute`)
      if (r.data && r.data.estree && e.evaluater) {
        let t = r.data.estree.body[0];
        t.type;
        let i = t.expression;
        i.type;
        let a = i.properties[0];
        (a.type, Object.assign(n, e.evaluater.evaluateExpression(a.argument)));
      } else yh(e, t.position);
    else {
      let i = r.name,
        a;
      if (r.value && typeof r.value == `object`)
        if (r.value.data && r.value.data.estree && e.evaluater) {
          let t = r.value.data.estree.body[0];
          (t.type, (a = e.evaluater.evaluateExpression(t.expression)));
        } else yh(e, t.position);
      else a = r.value === null ? !0 : r.value;
      n[i] = a;
    }
  return n;
}
function hh(e, t) {
  let n = [],
    r = -1,
    i = e.passKeys ? new Map() : Xm;
  for (; ++r < t.children.length; ) {
    let a = t.children[r],
      o;
    if (e.passKeys) {
      let e =
        a.type === `element`
          ? a.tagName
          : a.type === `mdxJsxFlowElement` || a.type === `mdxJsxTextElement`
            ? a.name
            : void 0;
      if (e) {
        let t = i.get(e) || 0;
        ((o = e + `-` + t), i.set(e, t + 1));
      }
    }
    let s = nh(e, a, o);
    s !== void 0 && n.push(s);
  }
  return n;
}
function gh(e, t, n) {
  let r = Ne(e.schema, t);
  if (!(n == null || (typeof n == `number` && Number.isNaN(n)))) {
    if (
      (Array.isArray(n) && (n = r.commaSeparated ? He(n) : We(n)),
      r.property === `style`)
    ) {
      let t = typeof n == `object` ? n : _h(e, String(n));
      return (e.stylePropertyNameCase === `css` && (t = bh(t)), [`style`, t]);
    }
    return [
      e.elementAttributeNameCase === `react` && r.space
        ? ke[r.property] || r.property
        : r.attribute,
      n,
    ];
  }
}
function _h(e, t) {
  try {
    return (0, Jm.default)(t, { reactCompat: !0 });
  } catch (t) {
    if (e.ignoreInvalidStyle) return {};
    let n = t,
      r = new qm("Cannot parse `style` attribute", {
        ancestors: e.ancestors,
        cause: n,
        ruleId: `style`,
        source: `hast-util-to-jsx-runtime`,
      });
    throw (
      (r.file = e.filePath || void 0),
      (r.url = eh + `#cannot-parse-style-attribute`),
      r
    );
  }
}
function vh(e, t, n) {
  let r;
  if (!n) r = { type: `Literal`, value: t };
  else if (t.includes(`.`)) {
    let e = t.split(`.`),
      n = -1,
      i;
    for (; ++n < e.length; ) {
      let t = Rm(e[n])
        ? { type: `Identifier`, name: e[n] }
        : { type: `Literal`, value: e[n] };
      i = i
        ? {
            type: `MemberExpression`,
            object: i,
            property: t,
            computed: !!(n && t.type === `Literal`),
            optional: !1,
          }
        : t;
    }
    r = i;
  } else
    r =
      Rm(t) && !/^[a-z]/.test(t)
        ? { type: `Identifier`, name: t }
        : { type: `Literal`, value: t };
  if (r.type === `Literal`) {
    let t = r.value;
    return Ym.call(e.components, t) ? e.components[t] : t;
  }
  if (e.evaluater) return e.evaluater.evaluateExpression(r);
  yh(e);
}
function yh(e, t) {
  let n = new qm("Cannot handle MDX estrees without `createEvaluater`", {
    ancestors: e.ancestors,
    place: t,
    ruleId: `mdx-estree`,
    source: `hast-util-to-jsx-runtime`,
  });
  throw (
    (n.file = e.filePath || void 0),
    (n.url = eh + `#cannot-handle-mdx-estrees-without-createevaluater`),
    n
  );
}
function bh(e) {
  let t = {},
    n;
  for (n in e) Ym.call(e, n) && (t[xh(n)] = e[n]);
  return t;
}
function xh(e) {
  let t = e.replace(Zm, Sh);
  return (t.slice(0, 3) === `ms-` && (t = `-` + t), t);
}
function Sh(e) {
  return `-` + e.toLowerCase();
}
var Ch = { tokenize: wh };
function wh(e) {
  let t = e.attempt(this.parser.constructs.contentInitial, r, i),
    n;
  return t;
  function r(n) {
    if (n === null) {
      e.consume(n);
      return;
    }
    return (
      e.enter(`lineEnding`),
      e.consume(n),
      e.exit(`lineEnding`),
      I(e, t, `linePrefix`)
    );
  }
  function i(t) {
    return (e.enter(`paragraph`), a(t));
  }
  function a(t) {
    let r = e.enter(`chunkText`, { contentType: `text`, previous: n });
    return (n && (n.next = r), (n = r), o(t));
  }
  function o(t) {
    if (t === null) {
      (e.exit(`chunkText`), e.exit(`paragraph`), e.consume(t));
      return;
    }
    return g(t) ? (e.consume(t), e.exit(`chunkText`), a) : (e.consume(t), o);
  }
}
var Th = { tokenize: Dh },
  Eh = { tokenize: Oh };
function Dh(e) {
  let t = this,
    n = [],
    r = 0,
    i,
    a,
    o;
  return s;
  function s(i) {
    if (r < n.length) {
      let a = n[r];
      return ((t.containerState = a[1]), e.attempt(a[0].continuation, c, l)(i));
    }
    return l(i);
  }
  function c(e) {
    if ((r++, t.containerState._closeFlow)) {
      ((t.containerState._closeFlow = void 0), i && y());
      let n = t.events.length,
        a = n,
        o;
      for (; a--; )
        if (t.events[a][0] === `exit` && t.events[a][1].type === `chunkFlow`) {
          o = t.events[a][1].end;
          break;
        }
      v(r);
      let s = n;
      for (; s < t.events.length; ) ((t.events[s][1].end = { ...o }), s++);
      return (
        S(t.events, a + 1, 0, t.events.slice(n)),
        (t.events.length = s),
        l(e)
      );
    }
    return s(e);
  }
  function l(a) {
    if (r === n.length) {
      if (!i) return f(a);
      if (i.currentConstruct && i.currentConstruct.concrete) return m(a);
      t.interrupt = !!(i.currentConstruct && !i._gfmTableDynamicInterruptHack);
    }
    return ((t.containerState = {}), e.check(Eh, u, d)(a));
  }
  function u(e) {
    return (i && y(), v(r), f(e));
  }
  function d(e) {
    return (
      (t.parser.lazy[t.now().line] = r !== n.length),
      (o = t.now().offset),
      m(e)
    );
  }
  function f(n) {
    return ((t.containerState = {}), e.attempt(Eh, p, m)(n));
  }
  function p(e) {
    return (r++, n.push([t.currentConstruct, t.containerState]), f(e));
  }
  function m(n) {
    if (n === null) {
      (i && y(), v(0), e.consume(n));
      return;
    }
    return (
      (i ||= t.parser.flow(t.now())),
      e.enter(`chunkFlow`, { _tokenizer: i, contentType: `flow`, previous: a }),
      h(n)
    );
  }
  function h(n) {
    if (n === null) {
      (_(e.exit(`chunkFlow`), !0), v(0), e.consume(n));
      return;
    }
    return g(n)
      ? (e.consume(n),
        _(e.exit(`chunkFlow`)),
        (r = 0),
        (t.interrupt = void 0),
        s)
      : (e.consume(n), h);
  }
  function _(e, n) {
    let s = t.sliceStream(e);
    if (
      (n && s.push(null),
      (e.previous = a),
      a && (a.next = e),
      (a = e),
      i.defineSkip(e.start),
      i.write(s),
      t.parser.lazy[e.start.line])
    ) {
      let e = i.events.length;
      for (; e--; )
        if (
          i.events[e][1].start.offset < o &&
          (!i.events[e][1].end || i.events[e][1].end.offset > o)
        )
          return;
      let n = t.events.length,
        a = n,
        s,
        c;
      for (; a--; )
        if (t.events[a][0] === `exit` && t.events[a][1].type === `chunkFlow`) {
          if (s) {
            c = t.events[a][1].end;
            break;
          }
          s = !0;
        }
      for (v(r), e = n; e < t.events.length; )
        ((t.events[e][1].end = { ...c }), e++);
      (S(t.events, a + 1, 0, t.events.slice(n)), (t.events.length = e));
    }
  }
  function v(r) {
    let i = n.length;
    for (; i-- > r; ) {
      let r = n[i];
      ((t.containerState = r[1]), r[0].exit.call(t, e));
    }
    n.length = r;
  }
  function y() {
    (i.write([null]),
      (a = void 0),
      (i = void 0),
      (t.containerState._closeFlow = void 0));
  }
}
function Oh(e, t, n) {
  return I(
    e,
    e.attempt(this.parser.constructs.document, t, n),
    `linePrefix`,
    this.parser.constructs.disable.null.includes(`codeIndented`) ? void 0 : 4,
  );
}
var kh = { tokenize: Ah };
function Ah(e) {
  let t = this,
    n = e.attempt(
      Wl,
      r,
      e.attempt(
        this.parser.constructs.flowInitial,
        i,
        I(
          e,
          e.attempt(this.parser.constructs.flow, i, e.attempt(gu, i)),
          `linePrefix`,
        ),
      ),
    );
  return n;
  function r(r) {
    if (r === null) {
      e.consume(r);
      return;
    }
    return (
      e.enter(`lineEndingBlank`),
      e.consume(r),
      e.exit(`lineEndingBlank`),
      (t.currentConstruct = void 0),
      n
    );
  }
  function i(r) {
    if (r === null) {
      e.consume(r);
      return;
    }
    return (
      e.enter(`lineEnding`),
      e.consume(r),
      e.exit(`lineEnding`),
      (t.currentConstruct = void 0),
      n
    );
  }
}
var jh = { resolveAll: Fh() },
  Mh = Ph(`string`),
  Nh = Ph(`text`);
function Ph(e) {
  return { resolveAll: Fh(e === `text` ? Ih : void 0), tokenize: t };
  function t(t) {
    let n = this,
      r = this.parser.constructs[e],
      i = t.attempt(r, a, o);
    return a;
    function a(e) {
      return c(e) ? i(e) : o(e);
    }
    function o(e) {
      if (e === null) {
        t.consume(e);
        return;
      }
      return (t.enter(`data`), t.consume(e), s);
    }
    function s(e) {
      return c(e) ? (t.exit(`data`), i(e)) : (t.consume(e), s);
    }
    function c(e) {
      if (e === null) return !0;
      let t = r[e],
        i = -1;
      if (t)
        for (; ++i < t.length; ) {
          let e = t[i];
          if (!e.previous || e.previous.call(n, n.previous)) return !0;
        }
      return !1;
    }
  }
}
function Fh(e) {
  return t;
  function t(t, n) {
    let r = -1,
      i;
    for (; ++r <= t.length; )
      i === void 0
        ? t[r] && t[r][1].type === `data` && ((i = r), r++)
        : (!t[r] || t[r][1].type !== `data`) &&
          (r !== i + 2 &&
            ((t[i][1].end = t[r - 1][1].end),
            t.splice(i + 2, r - i - 2),
            (r = i + 2)),
          (i = void 0));
    return e ? e(t, n) : t;
  }
}
function Ih(e, t) {
  let n = 0;
  for (; ++n <= e.length; )
    if (
      (n === e.length || e[n][1].type === `lineEnding`) &&
      e[n - 1][1].type === `data`
    ) {
      let r = e[n - 1][1],
        i = t.sliceStream(r),
        a = i.length,
        o = -1,
        s = 0,
        c;
      for (; a--; ) {
        let e = i[a];
        if (typeof e == `string`) {
          for (o = e.length; e.charCodeAt(o - 1) === 32; ) (s++, o--);
          if (o) break;
          o = -1;
        } else if (e === -2) ((c = !0), s++);
        else if (e !== -1) {
          a++;
          break;
        }
      }
      if ((t._contentTypeTextTrailing && n === e.length && (s = 0), s)) {
        let i = {
          type:
            n === e.length || c || s < 2 ? `lineSuffix` : `hardBreakTrailing`,
          start: {
            _bufferIndex: a ? o : r.start._bufferIndex + o,
            _index: r.start._index + a,
            line: r.end.line,
            column: r.end.column - s,
            offset: r.end.offset - s,
          },
          end: { ...r.end },
        };
        ((r.end = { ...i.start }),
          r.start.offset === r.end.offset
            ? Object.assign(r, i)
            : (e.splice(n, 0, [`enter`, i, t], [`exit`, i, t]), (n += 2)));
      }
      n++;
    }
  return e;
}
var Lh = t({
    attentionMarkers: () => Gh,
    contentInitial: () => zh,
    disable: () => Kh,
    document: () => Rh,
    flow: () => Vh,
    flowInitial: () => Bh,
    insideSpan: () => Wh,
    string: () => Hh,
    text: () => Uh,
  }),
  Rh = {
    42: ld,
    43: ld,
    45: ld,
    48: ld,
    49: ld,
    50: ld,
    51: ld,
    52: ld,
    53: ld,
    54: ld,
    55: ld,
    56: ld,
    57: ld,
    62: Kl,
  },
  zh = { 91: Tu },
  Bh = { [-2]: iu, [-1]: iu, 32: iu },
  Vh = {
    35: ju,
    42: sd,
    45: [_d, sd],
    60: Iu,
    61: _d,
    95: sd,
    96: tu,
    126: tu,
  },
  Hh = { 38: Ql, 92: Xl },
  Uh = {
    [-5]: ad,
    [-4]: ad,
    [-3]: ad,
    33: td,
    38: Ql,
    42: Rl,
    60: [Hl, Uu],
    91: rd,
    92: [ku, Xl],
    93: Gu,
    95: Rl,
    96: cu,
  },
  Wh = { null: [Rl, jh] },
  Gh = { null: [42, 95] },
  Kh = { null: [] };
function qh(e, t, n) {
  let r = {
      _bufferIndex: -1,
      _index: 0,
      line: (n && n.line) || 1,
      column: (n && n.column) || 1,
      offset: (n && n.offset) || 0,
    },
    i = {},
    a = [],
    o = [],
    s = [],
    c = {
      attempt: D(T),
      check: D(E),
      consume: y,
      enter: b,
      exit: x,
      interrupt: D(E, { interrupt: !0 }),
    },
    l = {
      code: null,
      containerState: {},
      defineSkip: h,
      events: [],
      now: m,
      parser: e,
      previous: null,
      sliceSerialize: f,
      sliceStream: p,
      write: d,
    },
    u = t.tokenize.call(l, c);
  return (t.resolveAll && a.push(t), l);
  function d(e) {
    return (
      (o = C(o, e)),
      _(),
      o[o.length - 1] === null
        ? (ee(t, 0), (l.events = w(a, l.events, l)), l.events)
        : []
    );
  }
  function f(e, t) {
    return Yh(p(e), t);
  }
  function p(e) {
    return Jh(o, e);
  }
  function m() {
    let { _bufferIndex: e, _index: t, line: n, column: i, offset: a } = r;
    return { _bufferIndex: e, _index: t, line: n, column: i, offset: a };
  }
  function h(e) {
    ((i[e.line] = e.column), ne());
  }
  function _() {
    let e;
    for (; r._index < o.length; ) {
      let t = o[r._index];
      if (typeof t == `string`)
        for (
          e = r._index, r._bufferIndex < 0 && (r._bufferIndex = 0);
          r._index === e && r._bufferIndex < t.length;
        )
          v(t.charCodeAt(r._bufferIndex));
      else v(t);
    }
  }
  function v(e) {
    u = u(e);
  }
  function y(e) {
    (g(e)
      ? (r.line++, (r.column = 1), (r.offset += e === -3 ? 2 : 1), ne())
      : e !== -1 && (r.column++, r.offset++),
      r._bufferIndex < 0
        ? r._index++
        : (r._bufferIndex++,
          r._bufferIndex === o[r._index].length &&
            ((r._bufferIndex = -1), r._index++)),
      (l.previous = e));
  }
  function b(e, t) {
    let n = t || {};
    return (
      (n.type = e),
      (n.start = m()),
      l.events.push([`enter`, n, l]),
      s.push(n),
      n
    );
  }
  function x(e) {
    let t = s.pop();
    return ((t.end = m()), l.events.push([`exit`, t, l]), t);
  }
  function T(e, t) {
    ee(e, t.from);
  }
  function E(e, t) {
    t.restore();
  }
  function D(e, t) {
    return n;
    function n(n, r, i) {
      let a, o, s, u;
      return Array.isArray(n) ? f(n) : `tokenize` in n ? f([n]) : d(n);
      function d(e) {
        return t;
        function t(t) {
          let n = t !== null && e[t],
            r = t !== null && e.null;
          return f([
            ...(Array.isArray(n) ? n : n ? [n] : []),
            ...(Array.isArray(r) ? r : r ? [r] : []),
          ])(t);
        }
      }
      function f(e) {
        return ((a = e), (o = 0), e.length === 0 ? i : p(e[o]));
      }
      function p(e) {
        return n;
        function n(n) {
          return (
            (u = te()),
            (s = e),
            e.partial || (l.currentConstruct = e),
            e.name && l.parser.constructs.disable.null.includes(e.name)
              ? h(n)
              : e.tokenize.call(
                  t ? Object.assign(Object.create(l), t) : l,
                  c,
                  m,
                  h,
                )(n)
          );
        }
      }
      function m(t) {
        return (e(s, u), r);
      }
      function h(e) {
        return (u.restore(), ++o < a.length ? p(a[o]) : i);
      }
    }
  }
  function ee(e, t) {
    (e.resolveAll && !a.includes(e) && a.push(e),
      e.resolve &&
        S(l.events, t, l.events.length - t, e.resolve(l.events.slice(t), l)),
      e.resolveTo && (l.events = e.resolveTo(l.events, l)));
  }
  function te() {
    let e = m(),
      t = l.previous,
      n = l.currentConstruct,
      i = l.events.length,
      a = Array.from(s);
    return { from: i, restore: o };
    function o() {
      ((r = e),
        (l.previous = t),
        (l.currentConstruct = n),
        (l.events.length = i),
        (s = a),
        ne());
    }
  }
  function ne() {
    r.line in i &&
      r.column < 2 &&
      ((r.column = i[r.line]), (r.offset += i[r.line] - 1));
  }
}
function Jh(e, t) {
  let n = t.start._index,
    r = t.start._bufferIndex,
    i = t.end._index,
    a = t.end._bufferIndex,
    o;
  if (n === i) o = [e[n].slice(r, a)];
  else {
    if (((o = e.slice(n, i)), r > -1)) {
      let e = o[0];
      typeof e == `string` ? (o[0] = e.slice(r)) : o.shift();
    }
    a > 0 && o.push(e[i].slice(0, a));
  }
  return o;
}
function Yh(e, t) {
  let n = -1,
    r = [],
    i;
  for (; ++n < e.length; ) {
    let a = e[n],
      o;
    if (typeof a == `string`) o = a;
    else
      switch (a) {
        case -5:
          o = `\r`;
          break;
        case -4:
          o = `
`;
          break;
        case -3:
          o = `\r
`;
          break;
        case -2:
          o = t ? ` ` : `	`;
          break;
        case -1:
          if (!t && i) continue;
          o = ` `;
          break;
        default:
          o = String.fromCharCode(a);
      }
    ((i = a === -2), r.push(o));
  }
  return r.join(``);
}
function Xh(e) {
  let t = {
    constructs: ul([Lh, ...((e || {}).extensions || [])]),
    content: n(Ch),
    defined: [],
    document: n(Th),
    flow: n(kh),
    lazy: {},
    string: n(Mh),
    text: n(Nh),
  };
  return t;
  function n(e) {
    return n;
    function n(n) {
      return qh(t, e, n);
    }
  }
}
function Zh(e) {
  for (; !mu(e); );
  return e;
}
var Qh = /[\0\t\n\r]/g;
function $h() {
  let e = 1,
    t = ``,
    n = !0,
    r;
  return i;
  function i(i, a, o) {
    let s = [],
      c,
      l,
      u,
      d,
      f;
    for (
      i =
        t +
        (typeof i == `string`
          ? i.toString()
          : new TextDecoder(a || void 0).decode(i)),
        u = 0,
        t = ``,
        n &&= (i.charCodeAt(0) === 65279 && u++, void 0);
      u < i.length;
    ) {
      if (
        ((Qh.lastIndex = u),
        (c = Qh.exec(i)),
        (d = c && c.index !== void 0 ? c.index : i.length),
        (f = i.charCodeAt(d)),
        !c)
      ) {
        t = i.slice(u);
        break;
      }
      if (f === 10 && u === d && r) (s.push(-3), (r = void 0));
      else
        switch (
          ((r &&= (s.push(-5), void 0)),
          u < d && (s.push(i.slice(u, d)), (e += d - u)),
          f)
        ) {
          case 0:
            (s.push(65533), e++);
            break;
          case 9:
            for (l = Math.ceil(e / 4) * 4, s.push(-2); e++ < l; ) s.push(-1);
            break;
          case 10:
            (s.push(-4), (e = 1));
            break;
          default:
            ((r = !0), (e = 1));
        }
      u = d + 1;
    }
    return (o && (r && s.push(-5), t && s.push(t), s.push(null)), s);
  }
}
var eg = {}.hasOwnProperty;
function tg(e, t, n) {
  return (
    typeof t != `string` && ((n = t), (t = void 0)),
    ng(n)(
      Zh(
        Xh(n)
          .document()
          .write($h()(e, t, !0)),
      ),
    )
  );
}
function ng(e) {
  let t = {
    transforms: [],
    canContainEols: [`emphasis`, `fragment`, `heading`, `paragraph`, `strong`],
    enter: {
      autolink: a(ye),
      autolinkProtocol: T,
      autolinkEmail: T,
      atxHeading: a(he),
      blockQuote: a(N),
      characterEscape: T,
      characterReference: T,
      codeFenced: a(pe),
      codeFencedFenceInfo: o,
      codeFencedFenceMeta: o,
      codeIndented: a(pe, o),
      codeText: a(P, o),
      codeTextData: T,
      data: T,
      codeFlowValue: T,
      definition: a(F),
      definitionDestinationString: o,
      definitionLabelString: o,
      definitionTitleString: o,
      emphasis: a(me),
      hardBreakEscape: a(ge),
      hardBreakTrailing: a(ge),
      htmlFlow: a(_e, o),
      htmlFlowData: T,
      htmlText: a(_e, o),
      htmlTextData: T,
      image: a(ve),
      label: o,
      link: a(ye),
      listItem: a(xe),
      listItemValue: f,
      listOrdered: a(be, d),
      listUnordered: a(be),
      paragraph: a(Se),
      reference: A,
      referenceString: o,
      resourceDestinationString: o,
      resourceTitleString: o,
      setextHeading: a(he),
      strong: a(Ce),
      thematicBreak: a(Te),
    },
    exit: {
      atxHeading: c(),
      atxHeadingSequence: x,
      autolink: c(),
      autolinkEmail: M,
      autolinkProtocol: fe,
      blockQuote: c(),
      characterEscapeValue: E,
      characterReferenceMarkerHexadecimal: ue,
      characterReferenceMarkerNumeric: ue,
      characterReferenceValue: de,
      characterReference: j,
      codeFenced: c(g),
      codeFencedFence: h,
      codeFencedFenceInfo: p,
      codeFencedFenceMeta: m,
      codeFlowValue: E,
      codeIndented: c(_),
      codeText: c(re),
      codeTextData: E,
      data: E,
      definition: c(),
      definitionDestinationString: b,
      definitionLabelString: v,
      definitionTitleString: y,
      emphasis: c(),
      hardBreakEscape: c(ee),
      hardBreakTrailing: c(ee),
      htmlFlow: c(te),
      htmlFlowData: E,
      htmlText: c(ne),
      htmlTextData: E,
      image: c(O),
      label: ae,
      labelText: k,
      lineEnding: D,
      link: c(ie),
      listItem: c(),
      listOrdered: c(),
      listUnordered: c(),
      paragraph: c(),
      referenceString: le,
      resourceDestinationString: oe,
      resourceTitleString: se,
      resource: ce,
      setextHeading: c(w),
      setextHeadingLineSequence: C,
      setextHeadingText: S,
      strong: c(),
      thematicBreak: c(),
    },
  };
  ig(t, (e || {}).mdastExtensions || []);
  let n = {};
  return r;
  function r(e) {
    let r = { type: `root`, children: [] },
      a = {
        stack: [r],
        tokenStack: [],
        config: t,
        enter: s,
        exit: l,
        buffer: o,
        resume: u,
        data: n,
      },
      c = [],
      d = -1;
    for (; ++d < e.length; )
      (e[d][1].type === `listOrdered` || e[d][1].type === `listUnordered`) &&
        (e[d][0] === `enter` ? c.push(d) : (d = i(e, c.pop(), d)));
    for (d = -1; ++d < e.length; ) {
      let n = t[e[d][0]];
      eg.call(n, e[d][1].type) &&
        n[e[d][1].type].call(
          Object.assign({ sliceSerialize: e[d][2].sliceSerialize }, a),
          e[d][1],
        );
    }
    if (a.tokenStack.length > 0) {
      let e = a.tokenStack[a.tokenStack.length - 1];
      (e[1] || og).call(a, void 0, e[0]);
    }
    for (
      r.position = {
        start: rg(
          e.length > 0 ? e[0][1].start : { line: 1, column: 1, offset: 0 },
        ),
        end: rg(
          e.length > 0
            ? e[e.length - 2][1].end
            : { line: 1, column: 1, offset: 0 },
        ),
      },
        d = -1;
      ++d < t.transforms.length;
    )
      r = t.transforms[d](r) || r;
    return r;
  }
  function i(e, t, n) {
    let r = t - 1,
      i = -1,
      a = !1,
      o,
      s,
      c,
      l;
    for (; ++r <= n; ) {
      let t = e[r];
      switch (t[1].type) {
        case `listUnordered`:
        case `listOrdered`:
        case `blockQuote`:
          (t[0] === `enter` ? i++ : i--, (l = void 0));
          break;
        case `lineEndingBlank`:
          t[0] === `enter` && (o && !l && !i && !c && (c = r), (l = void 0));
          break;
        case `linePrefix`:
        case `listItemValue`:
        case `listItemMarker`:
        case `listItemPrefix`:
        case `listItemPrefixWhitespace`:
          break;
        default:
          l = void 0;
      }
      if (
        (!i && t[0] === `enter` && t[1].type === `listItemPrefix`) ||
        (i === -1 &&
          t[0] === `exit` &&
          (t[1].type === `listUnordered` || t[1].type === `listOrdered`))
      ) {
        if (o) {
          let i = r;
          for (s = void 0; i--; ) {
            let t = e[i];
            if (t[1].type === `lineEnding` || t[1].type === `lineEndingBlank`) {
              if (t[0] === `exit`) continue;
              (s && ((e[s][1].type = `lineEndingBlank`), (a = !0)),
                (t[1].type = `lineEnding`),
                (s = i));
            } else if (
              !(
                t[1].type === `linePrefix` ||
                t[1].type === `blockQuotePrefix` ||
                t[1].type === `blockQuotePrefixWhitespace` ||
                t[1].type === `blockQuoteMarker` ||
                t[1].type === `listItemIndent`
              )
            )
              break;
          }
          (c && (!s || c < s) && (o._spread = !0),
            (o.end = Object.assign({}, s ? e[s][1].start : t[1].end)),
            e.splice(s || r, 0, [`exit`, o, t[2]]),
            r++,
            n++);
        }
        if (t[1].type === `listItemPrefix`) {
          let i = {
            type: `listItem`,
            _spread: !1,
            start: Object.assign({}, t[1].start),
            end: void 0,
          };
          ((o = i),
            e.splice(r, 0, [`enter`, i, t[2]]),
            r++,
            n++,
            (c = void 0),
            (l = !0));
        }
      }
    }
    return ((e[t][1]._spread = a), n);
  }
  function a(e, t) {
    return n;
    function n(n) {
      (s.call(this, e(n), n), t && t.call(this, n));
    }
  }
  function o() {
    this.stack.push({ type: `fragment`, children: [] });
  }
  function s(e, t, n) {
    (this.stack[this.stack.length - 1].children.push(e),
      this.stack.push(e),
      this.tokenStack.push([t, n || void 0]),
      (e.position = { start: rg(t.start), end: void 0 }));
  }
  function c(e) {
    return t;
    function t(t) {
      (e && e.call(this, t), l.call(this, t));
    }
  }
  function l(e, t) {
    let n = this.stack.pop(),
      r = this.tokenStack.pop();
    if (r)
      r[0].type !== e.type &&
        (t ? t.call(this, e, r[0]) : (r[1] || og).call(this, e, r[0]));
    else
      throw Error(
        "Cannot close `" +
          e.type +
          "` (" +
          Um({ start: e.start, end: e.end }) +
          `): it’s not open`,
      );
    n.position.end = rg(e.end);
  }
  function u() {
    return ac(this.stack.pop());
  }
  function d() {
    this.data.expectingFirstListItemValue = !0;
  }
  function f(e) {
    if (this.data.expectingFirstListItemValue) {
      let t = this.stack[this.stack.length - 2];
      ((t.start = Number.parseInt(this.sliceSerialize(e), 10)),
        (this.data.expectingFirstListItemValue = void 0));
    }
  }
  function p() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.lang = e;
  }
  function m() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.meta = e;
  }
  function h() {
    this.data.flowCodeInside ||
      (this.buffer(), (this.data.flowCodeInside = !0));
  }
  function g() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    ((t.value = e.replace(/^(\r?\n|\r)|(\r?\n|\r)$/g, ``)),
      (this.data.flowCodeInside = void 0));
  }
  function _() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.value = e.replace(/(\r?\n|\r)$/g, ``);
  }
  function v(e) {
    let t = this.resume(),
      n = this.stack[this.stack.length - 1];
    ((n.label = t), (n.identifier = hs(this.sliceSerialize(e)).toLowerCase()));
  }
  function y() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.title = e;
  }
  function b() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.url = e;
  }
  function x(e) {
    let t = this.stack[this.stack.length - 1];
    t.depth ||= this.sliceSerialize(e).length;
  }
  function S() {
    this.data.setextHeadingSlurpLineEnding = !0;
  }
  function C(e) {
    let t = this.stack[this.stack.length - 1];
    t.depth = this.sliceSerialize(e).codePointAt(0) === 61 ? 1 : 2;
  }
  function w() {
    this.data.setextHeadingSlurpLineEnding = void 0;
  }
  function T(e) {
    let t = this.stack[this.stack.length - 1].children,
      n = t[t.length - 1];
    ((!n || n.type !== `text`) &&
      ((n = we()),
      (n.position = { start: rg(e.start), end: void 0 }),
      t.push(n)),
      this.stack.push(n));
  }
  function E(e) {
    let t = this.stack.pop();
    ((t.value += this.sliceSerialize(e)), (t.position.end = rg(e.end)));
  }
  function D(e) {
    let n = this.stack[this.stack.length - 1];
    if (this.data.atHardBreak) {
      let t = n.children[n.children.length - 1];
      ((t.position.end = rg(e.end)), (this.data.atHardBreak = void 0));
      return;
    }
    !this.data.setextHeadingSlurpLineEnding &&
      t.canContainEols.includes(n.type) &&
      (T.call(this, e), E.call(this, e));
  }
  function ee() {
    this.data.atHardBreak = !0;
  }
  function te() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.value = e;
  }
  function ne() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.value = e;
  }
  function re() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.value = e;
  }
  function ie() {
    let e = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      let t = this.data.referenceType || `shortcut`;
      ((e.type += `Reference`),
        (e.referenceType = t),
        delete e.url,
        delete e.title);
    } else (delete e.identifier, delete e.label);
    this.data.referenceType = void 0;
  }
  function O() {
    let e = this.stack[this.stack.length - 1];
    if (this.data.inReference) {
      let t = this.data.referenceType || `shortcut`;
      ((e.type += `Reference`),
        (e.referenceType = t),
        delete e.url,
        delete e.title);
    } else (delete e.identifier, delete e.label);
    this.data.referenceType = void 0;
  }
  function k(e) {
    let t = this.sliceSerialize(e),
      n = this.stack[this.stack.length - 2];
    ((n.label = Gc(t)), (n.identifier = hs(t).toLowerCase()));
  }
  function ae() {
    let e = this.stack[this.stack.length - 1],
      t = this.resume(),
      n = this.stack[this.stack.length - 1];
    ((this.data.inReference = !0),
      n.type === `link` ? (n.children = e.children) : (n.alt = t));
  }
  function oe() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.url = e;
  }
  function se() {
    let e = this.resume(),
      t = this.stack[this.stack.length - 1];
    t.title = e;
  }
  function ce() {
    this.data.inReference = void 0;
  }
  function A() {
    this.data.referenceType = `collapsed`;
  }
  function le(e) {
    let t = this.resume(),
      n = this.stack[this.stack.length - 1];
    ((n.label = t),
      (n.identifier = hs(this.sliceSerialize(e)).toLowerCase()),
      (this.data.referenceType = `full`));
  }
  function ue(e) {
    this.data.characterReferenceType = e.type;
  }
  function de(e) {
    let t = this.sliceSerialize(e),
      n = this.data.characterReferenceType,
      r;
    n
      ? ((r = Uc(t, n === `characterReferenceMarkerNumeric` ? 10 : 16)),
        (this.data.characterReferenceType = void 0))
      : (r = Hc(t));
    let i = this.stack[this.stack.length - 1];
    i.value += r;
  }
  function j(e) {
    let t = this.stack.pop();
    t.position.end = rg(e.end);
  }
  function fe(e) {
    E.call(this, e);
    let t = this.stack[this.stack.length - 1];
    t.url = this.sliceSerialize(e);
  }
  function M(e) {
    E.call(this, e);
    let t = this.stack[this.stack.length - 1];
    t.url = `mailto:` + this.sliceSerialize(e);
  }
  function N() {
    return { type: `blockquote`, children: [] };
  }
  function pe() {
    return { type: `code`, lang: null, meta: null, value: `` };
  }
  function P() {
    return { type: `inlineCode`, value: `` };
  }
  function F() {
    return {
      type: `definition`,
      identifier: ``,
      label: null,
      title: null,
      url: ``,
    };
  }
  function me() {
    return { type: `emphasis`, children: [] };
  }
  function he() {
    return { type: `heading`, depth: 0, children: [] };
  }
  function ge() {
    return { type: `break` };
  }
  function _e() {
    return { type: `html`, value: `` };
  }
  function ve() {
    return { type: `image`, title: null, url: ``, alt: null };
  }
  function ye() {
    return { type: `link`, title: null, url: ``, children: [] };
  }
  function be(e) {
    return {
      type: `list`,
      ordered: e.type === `listOrdered`,
      start: null,
      spread: e._spread,
      children: [],
    };
  }
  function xe(e) {
    return { type: `listItem`, spread: e._spread, checked: null, children: [] };
  }
  function Se() {
    return { type: `paragraph`, children: [] };
  }
  function Ce() {
    return { type: `strong`, children: [] };
  }
  function we() {
    return { type: `text`, value: `` };
  }
  function Te() {
    return { type: `thematicBreak` };
  }
}
function rg(e) {
  return { line: e.line, column: e.column, offset: e.offset };
}
function ig(e, t) {
  let n = -1;
  for (; ++n < t.length; ) {
    let r = t[n];
    Array.isArray(r) ? ig(e, r) : ag(e, r);
  }
}
function ag(e, t) {
  let n;
  for (n in t)
    if (eg.call(t, n))
      switch (n) {
        case `canContainEols`: {
          let r = t[n];
          r && e[n].push(...r);
          break;
        }
        case `transforms`: {
          let r = t[n];
          r && e[n].push(...r);
          break;
        }
        case `enter`:
        case `exit`: {
          let r = t[n];
          r && Object.assign(e[n], r);
          break;
        }
      }
}
function og(e, t) {
  throw Error(
    e
      ? "Cannot close `" +
          e.type +
          "` (" +
          Um({ start: e.start, end: e.end }) +
          "): a different token (`" +
          t.type +
          "`, " +
          Um({ start: t.start, end: t.end }) +
          `) is open`
      : "Cannot close document, a token (`" +
          t.type +
          "`, " +
          Um({ start: t.start, end: t.end }) +
          `) is still open`,
  );
}
function sg(e) {
  let t = this;
  t.parser = n;
  function n(n) {
    return tg(n, {
      ...t.data(`settings`),
      ...e,
      extensions: t.data(`micromarkExtensions`) || [],
      mdastExtensions: t.data(`fromMarkdownExtensions`) || [],
    });
  }
}
function cg(e, t) {
  let n = {
    type: `element`,
    tagName: `blockquote`,
    properties: {},
    children: e.wrap(e.all(t), !0),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
function lg(e, t) {
  let n = { type: `element`, tagName: `br`, properties: {}, children: [] };
  return (
    e.patch(t, n),
    [
      e.applyData(t, n),
      {
        type: `text`,
        value: `
`,
      },
    ]
  );
}
function ug(e, t) {
  let n = t.value
      ? t.value +
        `
`
      : ``,
    r = {},
    i = t.lang ? t.lang.split(/\s+/) : [];
  i.length > 0 && (r.className = [`language-` + i[0]]);
  let a = {
    type: `element`,
    tagName: `code`,
    properties: r,
    children: [{ type: `text`, value: n }],
  };
  return (
    t.meta && (a.data = { meta: t.meta }),
    e.patch(t, a),
    (a = e.applyData(t, a)),
    (a = { type: `element`, tagName: `pre`, properties: {}, children: [a] }),
    e.patch(t, a),
    a
  );
}
function dg(e, t) {
  let n = {
    type: `element`,
    tagName: `del`,
    properties: {},
    children: e.all(t),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
function fg(e, t) {
  let n = {
    type: `element`,
    tagName: `em`,
    properties: {},
    children: e.all(t),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
function pg(e, t) {
  let n =
      typeof e.options.clobberPrefix == `string`
        ? e.options.clobberPrefix
        : `user-content-`,
    r = String(t.identifier).toUpperCase(),
    i = Ll(r.toLowerCase()),
    a = e.footnoteOrder.indexOf(r),
    o,
    s = e.footnoteCounts.get(r);
  (s === void 0
    ? ((s = 0), e.footnoteOrder.push(r), (o = e.footnoteOrder.length))
    : (o = a + 1),
    (s += 1),
    e.footnoteCounts.set(r, s));
  let c = {
    type: `element`,
    tagName: `a`,
    properties: {
      href: `#` + n + `fn-` + i,
      id: n + `fnref-` + i + (s > 1 ? `-` + s : ``),
      dataFootnoteRef: !0,
      ariaDescribedBy: [`footnote-label`],
    },
    children: [{ type: `text`, value: String(o) }],
  };
  e.patch(t, c);
  let l = { type: `element`, tagName: `sup`, properties: {}, children: [c] };
  return (e.patch(t, l), e.applyData(t, l));
}
function mg(e, t) {
  let n = {
    type: `element`,
    tagName: `h` + t.depth,
    properties: {},
    children: e.all(t),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
function hg(e, t) {
  if (e.options.allowDangerousHtml) {
    let n = { type: `raw`, value: t.value };
    return (e.patch(t, n), e.applyData(t, n));
  }
}
function gg(e, t) {
  let n = t.referenceType,
    r = `]`;
  if (
    (n === `collapsed`
      ? (r += `[]`)
      : n === `full` && (r += `[` + (t.label || t.identifier) + `]`),
    t.type === `imageReference`)
  )
    return [{ type: `text`, value: `![` + t.alt + r }];
  let i = e.all(t),
    a = i[0];
  a && a.type === `text`
    ? (a.value = `[` + a.value)
    : i.unshift({ type: `text`, value: `[` });
  let o = i[i.length - 1];
  return (
    o && o.type === `text`
      ? (o.value += r)
      : i.push({ type: `text`, value: r }),
    i
  );
}
function _g(e, t) {
  let n = String(t.identifier).toUpperCase(),
    r = e.definitionById.get(n);
  if (!r) return gg(e, t);
  let i = { src: Ll(r.url || ``), alt: t.alt };
  r.title !== null && r.title !== void 0 && (i.title = r.title);
  let a = { type: `element`, tagName: `img`, properties: i, children: [] };
  return (e.patch(t, a), e.applyData(t, a));
}
function vg(e, t) {
  let n = { src: Ll(t.url) };
  (t.alt !== null && t.alt !== void 0 && (n.alt = t.alt),
    t.title !== null && t.title !== void 0 && (n.title = t.title));
  let r = { type: `element`, tagName: `img`, properties: n, children: [] };
  return (e.patch(t, r), e.applyData(t, r));
}
function yg(e, t) {
  let n = { type: `text`, value: t.value.replace(/\r?\n|\r/g, ` `) };
  e.patch(t, n);
  let r = { type: `element`, tagName: `code`, properties: {}, children: [n] };
  return (e.patch(t, r), e.applyData(t, r));
}
function bg(e, t) {
  let n = String(t.identifier).toUpperCase(),
    r = e.definitionById.get(n);
  if (!r) return gg(e, t);
  let i = { href: Ll(r.url || ``) };
  r.title !== null && r.title !== void 0 && (i.title = r.title);
  let a = { type: `element`, tagName: `a`, properties: i, children: e.all(t) };
  return (e.patch(t, a), e.applyData(t, a));
}
function xg(e, t) {
  let n = { href: Ll(t.url) };
  t.title !== null && t.title !== void 0 && (n.title = t.title);
  let r = { type: `element`, tagName: `a`, properties: n, children: e.all(t) };
  return (e.patch(t, r), e.applyData(t, r));
}
function Sg(e, t, n) {
  let r = e.all(t),
    i = n ? Cg(n) : wg(t),
    a = {},
    o = [];
  if (typeof t.checked == `boolean`) {
    let e = r[0],
      n;
    (e && e.type === `element` && e.tagName === `p`
      ? (n = e)
      : ((n = { type: `element`, tagName: `p`, properties: {}, children: [] }),
        r.unshift(n)),
      n.children.length > 0 && n.children.unshift({ type: `text`, value: ` ` }),
      n.children.unshift({
        type: `element`,
        tagName: `input`,
        properties: { type: `checkbox`, checked: t.checked, disabled: !0 },
        children: [],
      }),
      (a.className = [`task-list-item`]));
  }
  let s = -1;
  for (; ++s < r.length; ) {
    let e = r[s];
    ((i || s !== 0 || e.type !== `element` || e.tagName !== `p`) &&
      o.push({
        type: `text`,
        value: `
`,
      }),
      e.type === `element` && e.tagName === `p` && !i
        ? o.push(...e.children)
        : o.push(e));
  }
  let c = r[r.length - 1];
  c &&
    (i || c.type !== `element` || c.tagName !== `p`) &&
    o.push({
      type: `text`,
      value: `
`,
    });
  let l = { type: `element`, tagName: `li`, properties: a, children: o };
  return (e.patch(t, l), e.applyData(t, l));
}
function Cg(e) {
  let t = !1;
  if (e.type === `list`) {
    t = e.spread || !1;
    let n = e.children,
      r = -1;
    for (; !t && ++r < n.length; ) t = wg(n[r]);
  }
  return t;
}
function wg(e) {
  return e.spread ?? e.children.length > 1;
}
function Tg(e, t) {
  let n = {},
    r = e.all(t),
    i = -1;
  for (
    typeof t.start == `number` && t.start !== 1 && (n.start = t.start);
    ++i < r.length;
  ) {
    let e = r[i];
    if (
      e.type === `element` &&
      e.tagName === `li` &&
      e.properties &&
      Array.isArray(e.properties.className) &&
      e.properties.className.includes(`task-list-item`)
    ) {
      n.className = [`contains-task-list`];
      break;
    }
  }
  let a = {
    type: `element`,
    tagName: t.ordered ? `ol` : `ul`,
    properties: n,
    children: e.wrap(r, !0),
  };
  return (e.patch(t, a), e.applyData(t, a));
}
function Eg(e, t) {
  let n = { type: `element`, tagName: `p`, properties: {}, children: e.all(t) };
  return (e.patch(t, n), e.applyData(t, n));
}
function Dg(e, t) {
  let n = { type: `root`, children: e.wrap(e.all(t)) };
  return (e.patch(t, n), e.applyData(t, n));
}
function Og(e, t) {
  let n = {
    type: `element`,
    tagName: `strong`,
    properties: {},
    children: e.all(t),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
function kg(e, t) {
  let n = e.all(t),
    r = n.shift(),
    i = [];
  if (r) {
    let n = {
      type: `element`,
      tagName: `thead`,
      properties: {},
      children: e.wrap([r], !0),
    };
    (e.patch(t.children[0], n), i.push(n));
  }
  if (n.length > 0) {
    let r = {
        type: `element`,
        tagName: `tbody`,
        properties: {},
        children: e.wrap(n, !0),
      },
      a = io(t.children[1]),
      o = ro(t.children[t.children.length - 1]);
    (a && o && (r.position = { start: a, end: o }), i.push(r));
  }
  let a = {
    type: `element`,
    tagName: `table`,
    properties: {},
    children: e.wrap(i, !0),
  };
  return (e.patch(t, a), e.applyData(t, a));
}
function Ag(e, t, n) {
  let r = n ? n.children : void 0,
    i = (r ? r.indexOf(t) : 1) === 0 ? `th` : `td`,
    a = n && n.type === `table` ? n.align : void 0,
    o = a ? a.length : t.children.length,
    s = -1,
    c = [];
  for (; ++s < o; ) {
    let n = t.children[s],
      r = {},
      o = a ? a[s] : void 0;
    o && (r.align = o);
    let l = { type: `element`, tagName: i, properties: r, children: [] };
    (n && ((l.children = e.all(n)), e.patch(n, l), (l = e.applyData(n, l))),
      c.push(l));
  }
  let l = {
    type: `element`,
    tagName: `tr`,
    properties: {},
    children: e.wrap(c, !0),
  };
  return (e.patch(t, l), e.applyData(t, l));
}
function jg(e, t) {
  let n = {
    type: `element`,
    tagName: `td`,
    properties: {},
    children: e.all(t),
  };
  return (e.patch(t, n), e.applyData(t, n));
}
var Mg = 9,
  Ng = 32;
function Pg(e) {
  let t = String(e),
    n = /\r?\n|\r/g,
    r = n.exec(t),
    i = 0,
    a = [];
  for (; r; )
    (a.push(Fg(t.slice(i, r.index), i > 0, !0), r[0]),
      (i = r.index + r[0].length),
      (r = n.exec(t)));
  return (a.push(Fg(t.slice(i), i > 0, !1)), a.join(``));
}
function Fg(e, t, n) {
  let r = 0,
    i = e.length;
  if (t) {
    let t = e.codePointAt(r);
    for (; t === Mg || t === Ng; ) (r++, (t = e.codePointAt(r)));
  }
  if (n) {
    let t = e.codePointAt(i - 1);
    for (; t === Mg || t === Ng; ) (i--, (t = e.codePointAt(i - 1)));
  }
  return i > r ? e.slice(r, i) : ``;
}
function Ig(e, t) {
  let n = { type: `text`, value: Pg(String(t.value)) };
  return (e.patch(t, n), e.applyData(t, n));
}
function Lg(e, t) {
  let n = { type: `element`, tagName: `hr`, properties: {}, children: [] };
  return (e.patch(t, n), e.applyData(t, n));
}
var Rg = {
  blockquote: cg,
  break: lg,
  code: ug,
  delete: dg,
  emphasis: fg,
  footnoteReference: pg,
  heading: mg,
  html: hg,
  imageReference: _g,
  image: vg,
  inlineCode: yg,
  linkReference: bg,
  link: xg,
  listItem: Sg,
  list: Tg,
  paragraph: Eg,
  root: Dg,
  strong: Og,
  table: kg,
  tableCell: jg,
  tableRow: Ag,
  text: Ig,
  thematicBreak: Lg,
  toml: zg,
  yaml: zg,
  definition: zg,
  footnoteDefinition: zg,
};
function zg() {}
function Bg(e, t) {
  let n = [{ type: `text`, value: `↩` }];
  return (
    t > 1 &&
      n.push({
        type: `element`,
        tagName: `sup`,
        properties: {},
        children: [{ type: `text`, value: String(t) }],
      }),
    n
  );
}
function Vg(e, t) {
  return `Back to reference ` + (e + 1) + (t > 1 ? `-` + t : ``);
}
function Hg(e) {
  let t =
      typeof e.options.clobberPrefix == `string`
        ? e.options.clobberPrefix
        : `user-content-`,
    n = e.options.footnoteBackContent || Bg,
    r = e.options.footnoteBackLabel || Vg,
    i = e.options.footnoteLabel || `Footnotes`,
    a = e.options.footnoteLabelTagName || `h2`,
    o = e.options.footnoteLabelProperties || { className: [`sr-only`] },
    s = [],
    c = -1;
  for (; ++c < e.footnoteOrder.length; ) {
    let i = e.footnoteById.get(e.footnoteOrder[c]);
    if (!i) continue;
    let a = e.all(i),
      o = String(i.identifier).toUpperCase(),
      l = Ll(o.toLowerCase()),
      u = 0,
      d = [],
      f = e.footnoteCounts.get(o);
    for (; f !== void 0 && ++u <= f; ) {
      d.length > 0 && d.push({ type: `text`, value: ` ` });
      let e = typeof n == `string` ? n : n(c, u);
      (typeof e == `string` && (e = { type: `text`, value: e }),
        d.push({
          type: `element`,
          tagName: `a`,
          properties: {
            href: `#` + t + `fnref-` + l + (u > 1 ? `-` + u : ``),
            dataFootnoteBackref: ``,
            ariaLabel: typeof r == `string` ? r : r(c, u),
            className: [`data-footnote-backref`],
          },
          children: Array.isArray(e) ? e : [e],
        }));
    }
    let p = a[a.length - 1];
    if (p && p.type === `element` && p.tagName === `p`) {
      let e = p.children[p.children.length - 1];
      (e && e.type === `text`
        ? (e.value += ` `)
        : p.children.push({ type: `text`, value: ` ` }),
        p.children.push(...d));
    } else a.push(...d);
    let m = {
      type: `element`,
      tagName: `li`,
      properties: { id: t + `fn-` + l },
      children: e.wrap(a, !0),
    };
    (e.patch(i, m), s.push(m));
  }
  if (s.length !== 0)
    return {
      type: `element`,
      tagName: `section`,
      properties: { dataFootnotes: !0, className: [`footnotes`] },
      children: [
        {
          type: `element`,
          tagName: a,
          properties: { ...Et(o), id: `footnote-label` },
          children: [{ type: `text`, value: i }],
        },
        {
          type: `text`,
          value: `
`,
        },
        {
          type: `element`,
          tagName: `ol`,
          properties: {},
          children: e.wrap(s, !0),
        },
        {
          type: `text`,
          value: `
`,
        },
      ],
    };
}
var Ug = {}.hasOwnProperty,
  Wg = {};
function Gg(e, t) {
  let n = t || Wg,
    r = new Map(),
    i = new Map(),
    a = {
      all: s,
      applyData: qg,
      definitionById: r,
      footnoteById: i,
      footnoteCounts: new Map(),
      footnoteOrder: [],
      handlers: { ...Rg, ...n.handlers },
      one: o,
      options: n,
      patch: Kg,
      wrap: Yg,
    };
  return (
    se(e, function (e) {
      if (e.type === `definition` || e.type === `footnoteDefinition`) {
        let t = e.type === `definition` ? r : i,
          n = String(e.identifier).toUpperCase();
        t.has(n) || t.set(n, e);
      }
    }),
    a
  );
  function o(e, t) {
    let n = e.type,
      r = a.handlers[n];
    if (Ug.call(a.handlers, n) && r) return r(a, e, t);
    if (a.options.passThrough && a.options.passThrough.includes(n)) {
      if (`children` in e) {
        let { children: t, ...n } = e,
          r = Et(n);
        return ((r.children = a.all(e)), r);
      }
      return Et(e);
    }
    return (a.options.unknownHandler || Jg)(a, e, t);
  }
  function s(e) {
    let t = [];
    if (`children` in e) {
      let n = e.children,
        r = -1;
      for (; ++r < n.length; ) {
        let i = a.one(n[r], e);
        if (i) {
          if (
            r &&
            n[r - 1].type === `break` &&
            (!Array.isArray(i) && i.type === `text` && (i.value = Xg(i.value)),
            !Array.isArray(i) && i.type === `element`)
          ) {
            let e = i.children[0];
            e && e.type === `text` && (e.value = Xg(e.value));
          }
          Array.isArray(i) ? t.push(...i) : t.push(i);
        }
      }
    }
    return t;
  }
}
function Kg(e, t) {
  e.position && (t.position = oo(e));
}
function qg(e, t) {
  let n = t;
  if (e && e.data) {
    let t = e.data.hName,
      r = e.data.hChildren,
      i = e.data.hProperties;
    (typeof t == `string` &&
      (n.type === `element`
        ? (n.tagName = t)
        : (n = {
            type: `element`,
            tagName: t,
            properties: {},
            children: `children` in n ? n.children : [n],
          })),
      n.type === `element` && i && Object.assign(n.properties, Et(i)),
      `children` in n && n.children && r != null && (n.children = r));
  }
  return n;
}
function Jg(e, t) {
  let n = t.data || {},
    r =
      `value` in t && !(Ug.call(n, `hProperties`) || Ug.call(n, `hChildren`))
        ? { type: `text`, value: t.value }
        : {
            type: `element`,
            tagName: `div`,
            properties: {},
            children: e.all(t),
          };
  return (e.patch(t, r), e.applyData(t, r));
}
function Yg(e, t) {
  let n = [],
    r = -1;
  for (
    t &&
    n.push({
      type: `text`,
      value: `
`,
    });
    ++r < e.length;
  )
    (r &&
      n.push({
        type: `text`,
        value: `
`,
      }),
      n.push(e[r]));
  return (
    t &&
      e.length > 0 &&
      n.push({
        type: `text`,
        value: `
`,
      }),
    n
  );
}
function Xg(e) {
  let t = 0,
    n = e.charCodeAt(t);
  for (; n === 9 || n === 32; ) (t++, (n = e.charCodeAt(t)));
  return e.slice(t);
}
function Zg(e, t) {
  let n = Gg(e, t),
    r = n.one(e, void 0),
    i = Hg(n),
    a = Array.isArray(r)
      ? { type: `root`, children: r }
      : r || { type: `root`, children: [] };
  return (
    i &&
      (`children` in a,
      a.children.push(
        {
          type: `text`,
          value: `
`,
        },
        i,
      )),
    a
  );
}
function Qg(e, t) {
  return e && `run` in e
    ? async function (n, r) {
        let i = Zg(n, { file: r, ...t });
        await e.run(i, r);
      }
    : function (n, r) {
        return Zg(n, { file: r, ...(e || t) });
      };
}
function $g(e) {
  if (e) throw e;
}
var e_ = n((e, t) => {
  var n = Object.prototype.hasOwnProperty,
    r = Object.prototype.toString,
    i = Object.defineProperty,
    a = Object.getOwnPropertyDescriptor,
    o = function (e) {
      return typeof Array.isArray == `function`
        ? Array.isArray(e)
        : r.call(e) === `[object Array]`;
    },
    s = function (e) {
      if (!e || r.call(e) !== `[object Object]`) return !1;
      var t = n.call(e, `constructor`),
        i =
          e.constructor &&
          e.constructor.prototype &&
          n.call(e.constructor.prototype, `isPrototypeOf`);
      if (e.constructor && !t && !i) return !1;
      for (var a in e);
      return a === void 0 || n.call(e, a);
    },
    c = function (e, t) {
      i && t.name === `__proto__`
        ? i(e, t.name, {
            enumerable: !0,
            configurable: !0,
            value: t.newValue,
            writable: !0,
          })
        : (e[t.name] = t.newValue);
    },
    l = function (e, t) {
      if (t === `__proto__`) {
        if (!n.call(e, t)) return;
        if (a) return a(e, t).value;
      }
      return e[t];
    };
  t.exports = function e() {
    var t,
      n,
      r,
      i,
      a,
      u,
      d = arguments[0],
      f = 1,
      p = arguments.length,
      m = !1;
    for (
      typeof d == `boolean` && ((m = d), (d = arguments[1] || {}), (f = 2)),
        (d == null || (typeof d != `object` && typeof d != `function`)) &&
          (d = {});
      f < p;
      ++f
    )
      if (((t = arguments[f]), t != null))
        for (n in t)
          ((r = l(d, n)),
            (i = l(t, n)),
            d !== i &&
              (m && i && (s(i) || (a = o(i)))
                ? (a
                    ? ((a = !1), (u = r && o(r) ? r : []))
                    : (u = r && s(r) ? r : {}),
                  c(d, { name: n, newValue: e(m, u, i) }))
                : i !== void 0 && c(d, { name: n, newValue: i })));
    return d;
  };
});
function t_(e) {
  if (typeof e != `object` || !e) return !1;
  let t = Object.getPrototypeOf(e);
  return (
    (t === null ||
      t === Object.prototype ||
      Object.getPrototypeOf(t) === null) &&
    !(Symbol.toStringTag in e) &&
    !(Symbol.iterator in e)
  );
}
function n_() {
  let e = [],
    t = { run: n, use: r };
  return t;
  function n(...t) {
    let n = -1,
      r = t.pop();
    if (typeof r != `function`)
      throw TypeError(`Expected function as last argument, not ` + r);
    i(null, ...t);
    function i(a, ...o) {
      let s = e[++n],
        c = -1;
      if (a) {
        r(a);
        return;
      }
      for (; ++c < t.length; )
        (o[c] === null || o[c] === void 0) && (o[c] = t[c]);
      ((t = o), s ? r_(s, i)(...o) : r(null, ...o));
    }
  }
  function r(n) {
    if (typeof n != `function`)
      throw TypeError("Expected `middelware` to be a function, not " + n);
    return (e.push(n), t);
  }
}
function r_(e, t) {
  let n;
  return r;
  function r(...t) {
    let r = e.length > t.length,
      o;
    r && t.push(i);
    try {
      o = e.apply(this, t);
    } catch (e) {
      let t = e;
      if (r && n) throw t;
      return i(t);
    }
    r ||
      (o && o.then && typeof o.then == `function`
        ? o.then(a, i)
        : o instanceof Error
          ? i(o)
          : a(o));
  }
  function i(e, ...r) {
    n || ((n = !0), t(e, ...r));
  }
  function a(e) {
    i(null, e);
  }
}
var i_ = { basename: a_, dirname: o_, extname: s_, join: c_, sep: `/` };
function a_(e, t) {
  if (t !== void 0 && typeof t != `string`)
    throw TypeError(`"ext" argument must be a string`);
  d_(e);
  let n = 0,
    r = -1,
    i = e.length,
    a;
  if (t === void 0 || t.length === 0 || t.length > e.length) {
    for (; i--; )
      if (e.codePointAt(i) === 47) {
        if (a) {
          n = i + 1;
          break;
        }
      } else r < 0 && ((a = !0), (r = i + 1));
    return r < 0 ? `` : e.slice(n, r);
  }
  if (t === e) return ``;
  let o = -1,
    s = t.length - 1;
  for (; i--; )
    if (e.codePointAt(i) === 47) {
      if (a) {
        n = i + 1;
        break;
      }
    } else
      (o < 0 && ((a = !0), (o = i + 1)),
        s > -1 &&
          (e.codePointAt(i) === t.codePointAt(s--)
            ? s < 0 && (r = i)
            : ((s = -1), (r = o))));
  return (n === r ? (r = o) : r < 0 && (r = e.length), e.slice(n, r));
}
function o_(e) {
  if ((d_(e), e.length === 0)) return `.`;
  let t = -1,
    n = e.length,
    r;
  for (; --n; )
    if (e.codePointAt(n) === 47) {
      if (r) {
        t = n;
        break;
      }
    } else r ||= !0;
  return t < 0
    ? e.codePointAt(0) === 47
      ? `/`
      : `.`
    : t === 1 && e.codePointAt(0) === 47
      ? `//`
      : e.slice(0, t);
}
function s_(e) {
  d_(e);
  let t = e.length,
    n = -1,
    r = 0,
    i = -1,
    a = 0,
    o;
  for (; t--; ) {
    let s = e.codePointAt(t);
    if (s === 47) {
      if (o) {
        r = t + 1;
        break;
      }
      continue;
    }
    (n < 0 && ((o = !0), (n = t + 1)),
      s === 46 ? (i < 0 ? (i = t) : a !== 1 && (a = 1)) : i > -1 && (a = -1));
  }
  return i < 0 || n < 0 || a === 0 || (a === 1 && i === n - 1 && i === r + 1)
    ? ``
    : e.slice(i, n);
}
function c_(...e) {
  let t = -1,
    n;
  for (; ++t < e.length; )
    (d_(e[t]), e[t] && (n = n === void 0 ? e[t] : n + `/` + e[t]));
  return n === void 0 ? `.` : l_(n);
}
function l_(e) {
  d_(e);
  let t = e.codePointAt(0) === 47,
    n = u_(e, !t);
  return (
    n.length === 0 && !t && (n = `.`),
    n.length > 0 && e.codePointAt(e.length - 1) === 47 && (n += `/`),
    t ? `/` + n : n
  );
}
function u_(e, t) {
  let n = ``,
    r = 0,
    i = -1,
    a = 0,
    o = -1,
    s,
    c;
  for (; ++o <= e.length; ) {
    if (o < e.length) s = e.codePointAt(o);
    else if (s === 47) break;
    else s = 47;
    if (s === 47) {
      if (!(i === o - 1 || a === 1))
        if (i !== o - 1 && a === 2) {
          if (
            n.length < 2 ||
            r !== 2 ||
            n.codePointAt(n.length - 1) !== 46 ||
            n.codePointAt(n.length - 2) !== 46
          ) {
            if (n.length > 2) {
              if (((c = n.lastIndexOf(`/`)), c !== n.length - 1)) {
                (c < 0
                  ? ((n = ``), (r = 0))
                  : ((n = n.slice(0, c)),
                    (r = n.length - 1 - n.lastIndexOf(`/`))),
                  (i = o),
                  (a = 0));
                continue;
              }
            } else if (n.length > 0) {
              ((n = ``), (r = 0), (i = o), (a = 0));
              continue;
            }
          }
          t && ((n = n.length > 0 ? n + `/..` : `..`), (r = 2));
        } else
          (n.length > 0
            ? (n += `/` + e.slice(i + 1, o))
            : (n = e.slice(i + 1, o)),
            (r = o - i - 1));
      ((i = o), (a = 0));
    } else s === 46 && a > -1 ? a++ : (a = -1);
  }
  return n;
}
function d_(e) {
  if (typeof e != `string`)
    throw TypeError(`Path must be a string. Received ` + JSON.stringify(e));
}
var f_ = { cwd: p_ };
function p_() {
  return `/`;
}
function m_(e) {
  return !!(
    typeof e == `object` &&
    e &&
    `href` in e &&
    e.href &&
    `protocol` in e &&
    e.protocol &&
    e.auth === void 0
  );
}
function h_(e) {
  if (typeof e == `string`) e = new URL(e);
  else if (!m_(e)) {
    let t = TypeError(
      'The "path" argument must be of type string or an instance of URL. Received `' +
        e +
        "`",
    );
    throw ((t.code = `ERR_INVALID_ARG_TYPE`), t);
  }
  if (e.protocol !== `file:`) {
    let e = TypeError(`The URL must be of scheme file`);
    throw ((e.code = `ERR_INVALID_URL_SCHEME`), e);
  }
  return g_(e);
}
function g_(e) {
  if (e.hostname !== ``) {
    let e = TypeError(`File URL host must be "localhost" or empty on darwin`);
    throw ((e.code = `ERR_INVALID_FILE_URL_HOST`), e);
  }
  let t = e.pathname,
    n = -1;
  for (; ++n < t.length; )
    if (t.codePointAt(n) === 37 && t.codePointAt(n + 1) === 50) {
      let e = t.codePointAt(n + 2);
      if (e === 70 || e === 102) {
        let e = TypeError(
          `File URL path must not include encoded / characters`,
        );
        throw ((e.code = `ERR_INVALID_FILE_URL_PATH`), e);
      }
    }
  return decodeURIComponent(t);
}
var __ = [`history`, `path`, `basename`, `stem`, `extname`, `dirname`],
  v_ = class {
    constructor(e) {
      let t;
      ((t = e
        ? m_(e)
          ? { path: e }
          : typeof e == `string` || S_(e)
            ? { value: e }
            : e
        : {}),
        (this.cwd = `cwd` in t ? `` : f_.cwd()),
        (this.data = {}),
        (this.history = []),
        (this.messages = []),
        this.value,
        this.map,
        this.result,
        this.stored);
      let n = -1;
      for (; ++n < __.length; ) {
        let e = __[n];
        e in t &&
          t[e] !== void 0 &&
          t[e] !== null &&
          (this[e] = e === `history` ? [...t[e]] : t[e]);
      }
      let r;
      for (r in t) __.includes(r) || (this[r] = t[r]);
    }
    get basename() {
      return typeof this.path == `string` ? i_.basename(this.path) : void 0;
    }
    set basename(e) {
      (b_(e, `basename`),
        y_(e, `basename`),
        (this.path = i_.join(this.dirname || ``, e)));
    }
    get dirname() {
      return typeof this.path == `string` ? i_.dirname(this.path) : void 0;
    }
    set dirname(e) {
      (x_(this.basename, `dirname`),
        (this.path = i_.join(e || ``, this.basename)));
    }
    get extname() {
      return typeof this.path == `string` ? i_.extname(this.path) : void 0;
    }
    set extname(e) {
      if ((y_(e, `extname`), x_(this.dirname, `extname`), e)) {
        if (e.codePointAt(0) !== 46)
          throw Error("`extname` must start with `.`");
        if (e.includes(`.`, 1))
          throw Error("`extname` cannot contain multiple dots");
      }
      this.path = i_.join(this.dirname, this.stem + (e || ``));
    }
    get path() {
      return this.history[this.history.length - 1];
    }
    set path(e) {
      (m_(e) && (e = h_(e)),
        b_(e, `path`),
        this.path !== e && this.history.push(e));
    }
    get stem() {
      return typeof this.path == `string`
        ? i_.basename(this.path, this.extname)
        : void 0;
    }
    set stem(e) {
      (b_(e, `stem`),
        y_(e, `stem`),
        (this.path = i_.join(this.dirname || ``, e + (this.extname || ``))));
    }
    fail(e, t, n) {
      let r = this.message(e, t, n);
      throw ((r.fatal = !0), r);
    }
    info(e, t, n) {
      let r = this.message(e, t, n);
      return ((r.fatal = void 0), r);
    }
    message(e, t, n) {
      let r = new qm(e, t, n);
      return (
        this.path &&
          ((r.name = this.path + `:` + r.name), (r.file = this.path)),
        (r.fatal = !1),
        this.messages.push(r),
        r
      );
    }
    toString(e) {
      return this.value === void 0
        ? ``
        : typeof this.value == `string`
          ? this.value
          : new TextDecoder(e || void 0).decode(this.value);
    }
  };
function y_(e, t) {
  if (e && e.includes(i_.sep))
    throw Error(
      "`" + t + "` cannot be a path: did not expect `" + i_.sep + "`",
    );
}
function b_(e, t) {
  if (!e) throw Error("`" + t + "` cannot be empty");
}
function x_(e, t) {
  if (!e) throw Error("Setting `" + t + "` requires `path` to be set too");
}
function S_(e) {
  return !!(
    e &&
    typeof e == `object` &&
    `byteLength` in e &&
    `byteOffset` in e
  );
}
var C_ = function (e) {
    let t = this.constructor.prototype,
      n = t[e],
      r = function () {
        return n.apply(r, arguments);
      };
    return (Object.setPrototypeOf(r, t), r);
  },
  w_ = e(e_(), 1),
  T_ = {}.hasOwnProperty,
  E_ = new (class e extends C_ {
    constructor() {
      (super(`copy`),
        (this.Compiler = void 0),
        (this.Parser = void 0),
        (this.attachers = []),
        (this.compiler = void 0),
        (this.freezeIndex = -1),
        (this.frozen = void 0),
        (this.namespace = {}),
        (this.parser = void 0),
        (this.transformers = n_()));
    }
    copy() {
      let t = new e(),
        n = -1;
      for (; ++n < this.attachers.length; ) {
        let e = this.attachers[n];
        t.use(...e);
      }
      return (t.data((0, w_.default)(!0, {}, this.namespace)), t);
    }
    data(e, t) {
      return typeof e == `string`
        ? arguments.length === 2
          ? (k_(`data`, this.frozen), (this.namespace[e] = t), this)
          : (T_.call(this.namespace, e) && this.namespace[e]) || void 0
        : e
          ? (k_(`data`, this.frozen), (this.namespace = e), this)
          : this.namespace;
    }
    freeze() {
      if (this.frozen) return this;
      let e = this;
      for (; ++this.freezeIndex < this.attachers.length; ) {
        let [t, ...n] = this.attachers[this.freezeIndex];
        if (n[0] === !1) continue;
        n[0] === !0 && (n[0] = void 0);
        let r = t.call(e, ...n);
        typeof r == `function` && this.transformers.use(r);
      }
      return ((this.frozen = !0), (this.freezeIndex = 1 / 0), this);
    }
    parse(e) {
      this.freeze();
      let t = M_(e),
        n = this.parser || this.Parser;
      return (D_(`parse`, n), n(String(t), t));
    }
    process(e, t) {
      let n = this;
      return (
        this.freeze(),
        D_(`process`, this.parser || this.Parser),
        O_(`process`, this.compiler || this.Compiler),
        t ? r(void 0, t) : new Promise(r)
      );
      function r(r, i) {
        let a = M_(e),
          o = n.parse(a);
        n.run(o, a, function (e, t, r) {
          if (e || !t || !r) return s(e);
          let i = t,
            a = n.stringify(i, r);
          (P_(a) ? (r.value = a) : (r.result = a), s(e, r));
        });
        function s(e, n) {
          e || !n ? i(e) : r ? r(n) : t(void 0, n);
        }
      }
    }
    processSync(e) {
      let t = !1,
        n;
      return (
        this.freeze(),
        D_(`processSync`, this.parser || this.Parser),
        O_(`processSync`, this.compiler || this.Compiler),
        this.process(e, r),
        j_(`processSync`, `process`, t),
        n
      );
      function r(e, r) {
        ((t = !0), $g(e), (n = r));
      }
    }
    run(e, t, n) {
      (A_(e), this.freeze());
      let r = this.transformers;
      return (
        !n && typeof t == `function` && ((n = t), (t = void 0)),
        n ? i(void 0, n) : new Promise(i)
      );
      function i(i, a) {
        let o = M_(t);
        r.run(e, o, s);
        function s(t, r, o) {
          let s = r || e;
          t ? a(t) : i ? i(s) : n(void 0, s, o);
        }
      }
    }
    runSync(e, t) {
      let n = !1,
        r;
      return (this.run(e, t, i), j_(`runSync`, `run`, n), r);
      function i(e, t) {
        ($g(e), (r = t), (n = !0));
      }
    }
    stringify(e, t) {
      this.freeze();
      let n = M_(t),
        r = this.compiler || this.Compiler;
      return (O_(`stringify`, r), A_(e), r(e, n));
    }
    use(e, ...t) {
      let n = this.attachers,
        r = this.namespace;
      if ((k_(`use`, this.frozen), e != null))
        if (typeof e == `function`) s(e, t);
        else if (typeof e == `object`) Array.isArray(e) ? o(e) : a(e);
        else throw TypeError("Expected usable value, not `" + e + "`");
      return this;
      function i(e) {
        if (typeof e == `function`) s(e, []);
        else if (typeof e == `object`)
          if (Array.isArray(e)) {
            let [t, ...n] = e;
            s(t, n);
          } else a(e);
        else throw TypeError("Expected usable value, not `" + e + "`");
      }
      function a(e) {
        if (!(`plugins` in e) && !(`settings` in e))
          throw Error(
            "Expected usable value but received an empty preset, which is probably a mistake: presets typically come with `plugins` and sometimes with `settings`, but this has neither",
          );
        (o(e.plugins),
          e.settings &&
            (r.settings = (0, w_.default)(!0, r.settings, e.settings)));
      }
      function o(e) {
        let t = -1;
        if (e != null)
          if (Array.isArray(e))
            for (; ++t < e.length; ) {
              let n = e[t];
              i(n);
            }
          else throw TypeError("Expected a list of plugins, not `" + e + "`");
      }
      function s(e, t) {
        let r = -1,
          i = -1;
        for (; ++r < n.length; )
          if (n[r][0] === e) {
            i = r;
            break;
          }
        if (i === -1) n.push([e, ...t]);
        else if (t.length > 0) {
          let [r, ...a] = t,
            o = n[i][1];
          (t_(o) && t_(r) && (r = (0, w_.default)(!0, o, r)),
            (n[i] = [e, r, ...a]));
        }
      }
    }
  })().freeze();
function D_(e, t) {
  if (typeof t != `function`)
    throw TypeError("Cannot `" + e + "` without `parser`");
}
function O_(e, t) {
  if (typeof t != `function`)
    throw TypeError("Cannot `" + e + "` without `compiler`");
}
function k_(e, t) {
  if (t)
    throw Error(
      "Cannot call `" +
        e +
        "` on a frozen processor.\nCreate a new processor first, by calling it: use `processor()` instead of `processor`.",
    );
}
function A_(e) {
  if (!t_(e) || typeof e.type != `string`)
    throw TypeError("Expected node, got `" + e + "`");
}
function j_(e, t, n) {
  if (!n) throw Error("`" + e + "` finished async. Use `" + t + "` instead");
}
function M_(e) {
  return N_(e) ? e : new v_(e);
}
function N_(e) {
  return !!(e && typeof e == `object` && `message` in e && `messages` in e);
}
function P_(e) {
  return typeof e == `string` || F_(e);
}
function F_(e) {
  return !!(
    e &&
    typeof e == `object` &&
    `byteLength` in e &&
    `byteOffset` in e
  );
}
function I_() {
  return {
    async: !1,
    breaks: !1,
    extensions: null,
    gfm: !0,
    hooks: null,
    pedantic: !1,
    renderer: null,
    silent: !1,
    tokenizer: null,
    walkTokens: null,
  };
}
var L_ = I_();
function R_(e) {
  L_ = e;
}
var z_ = { exec: () => null };
function Y(e, t = ``) {
  let n = typeof e == `string` ? e : e.source,
    r = {
      replace: (e, t) => {
        let i = typeof t == `string` ? t : t.source;
        return ((i = i.replace(V_.caret, `$1`)), (n = n.replace(e, i)), r);
      },
      getRegex: () => new RegExp(n, t),
    };
  return r;
}
var B_ = (() => {
    try {
      return !0;
    } catch {
      return !1;
    }
  })(),
  V_ = {
    codeRemoveIndent: /^(?: {1,4}| {0,3}\t)/gm,
    outputLinkReplace: /\\([\[\]])/g,
    indentCodeCompensation: /^(\s+)(?:```)/,
    beginningSpace: /^\s+/,
    endingHash: /#$/,
    startingSpaceChar: /^ /,
    endingSpaceChar: / $/,
    nonSpaceChar: /[^ ]/,
    newLineCharGlobal: /\n/g,
    tabCharGlobal: /\t/g,
    multipleSpaceGlobal: /\s+/g,
    blankLine: /^[ \t]*$/,
    doubleBlankLine: /\n[ \t]*\n[ \t]*$/,
    blockquoteStart: /^ {0,3}>/,
    blockquoteSetextReplace: /\n {0,3}((?:=+|-+) *)(?=\n|$)/g,
    blockquoteSetextReplace2: /^ {0,3}>[ \t]?/gm,
    listReplaceTabs: /^\t+/,
    listReplaceNesting: /^ {1,4}(?=( {4})*[^ ])/g,
    listIsTask: /^\[[ xX]\] +\S/,
    listReplaceTask: /^\[[ xX]\] +/,
    listTaskCheckbox: /\[[ xX]\]/,
    anyLine: /\n.*\n/,
    hrefBrackets: /^<(.*)>$/,
    tableDelimiter: /[:|]/,
    tableAlignChars: /^\||\| *$/g,
    tableRowBlankLine: /\n[ \t]*$/,
    tableAlignRight: /^ *-+: *$/,
    tableAlignCenter: /^ *:-+: *$/,
    tableAlignLeft: /^ *:-+ *$/,
    startATag: /^<a /i,
    endATag: /^<\/a>/i,
    startPreScriptTag: /^<(pre|code|kbd|script)(\s|>)/i,
    endPreScriptTag: /^<\/(pre|code|kbd|script)(\s|>)/i,
    startAngleBracket: /^</,
    endAngleBracket: />$/,
    pedanticHrefTitle: /^([^'"]*[^\s])\s+(['"])(.*)\2/,
    unicodeAlphaNumeric: /[\p{L}\p{N}]/u,
    escapeTest: /[&<>"']/,
    escapeReplace: /[&<>"']/g,
    escapeTestNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/,
    escapeReplaceNoEncode: /[<>"']|&(?!(#\d{1,7}|#[Xx][a-fA-F0-9]{1,6}|\w+);)/g,
    unescapeTest: /&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/gi,
    caret: /(^|[^\[])\^/g,
    percentDecode: /%25/g,
    findPipe: /\|/g,
    splitPipe: / \|/,
    slashPipe: /\\\|/g,
    carriageReturn: /\r\n|\r/g,
    spaceLine: /^ +$/gm,
    notSpaceStart: /^\S*/,
    endingNewline: /\n$/,
    listItemRegex: (e) => RegExp(`^( {0,3}${e})((?:[	 ][^\\n]*)?(?:\\n|$))`),
    nextBulletRegex: (e) =>
      RegExp(
        `^ {0,${Math.min(3, e - 1)}}(?:[*+-]|\\d{1,9}[.)])((?:[ 	][^\\n]*)?(?:\\n|$))`,
      ),
    hrRegex: (e) =>
      RegExp(
        `^ {0,${Math.min(3, e - 1)}}((?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$)`,
      ),
    fencesBeginRegex: (e) =>
      RegExp(`^ {0,${Math.min(3, e - 1)}}(?:\`\`\`|~~~)`),
    headingBeginRegex: (e) => RegExp(`^ {0,${Math.min(3, e - 1)}}#`),
    htmlBeginRegex: (e) =>
      RegExp(`^ {0,${Math.min(3, e - 1)}}<(?:[a-z].*>|!--)`, `i`),
  },
  H_ = /^(?:[ \t]*(?:\n|$))+/,
  U_ = /^((?: {4}| {0,3}\t)[^\n]+(?:\n(?:[ \t]*(?:\n|$))*)?)+/,
  W_ =
    /^ {0,3}(`{3,}(?=[^`\n]*(?:\n|$))|~{3,})([^\n]*)(?:\n|$)(?:|([\s\S]*?)(?:\n|$))(?: {0,3}\1[~`]* *(?=\n|$)|$)/,
  G_ = /^ {0,3}((?:-[\t ]*){3,}|(?:_[ \t]*){3,}|(?:\*[ \t]*){3,})(?:\n+|$)/,
  K_ = /^ {0,3}(#{1,6})(?=\s|$)(.*)(?:\n+|$)/,
  q_ = /(?:[*+-]|\d{1,9}[.)])/,
  J_ =
    /^(?!bull |blockCode|fences|blockquote|heading|html|table)((?:.|\n(?!\s*?\n|bull |blockCode|fences|blockquote|heading|html|table))+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
  Y_ = Y(J_)
    .replace(/bull/g, q_)
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
    .replace(/blockquote/g, / {0,3}>/)
    .replace(/heading/g, / {0,3}#{1,6}/)
    .replace(/html/g, / {0,3}<[^\n>]+>\n/)
    .replace(/\|table/g, ``)
    .getRegex(),
  X_ = Y(J_)
    .replace(/bull/g, q_)
    .replace(/blockCode/g, /(?: {4}| {0,3}\t)/)
    .replace(/fences/g, / {0,3}(?:`{3,}|~{3,})/)
    .replace(/blockquote/g, / {0,3}>/)
    .replace(/heading/g, / {0,3}#{1,6}/)
    .replace(/html/g, / {0,3}<[^\n>]+>\n/)
    .replace(/table/g, / {0,3}\|?(?:[:\- ]*\|)+[\:\- ]*\n/)
    .getRegex(),
  Z_ =
    /^([^\n]+(?:\n(?!hr|heading|lheading|blockquote|fences|list|html|table| +\n)[^\n]+)*)/,
  Q_ = /^[^\n]+/,
  $_ = /(?!\s*\])(?:\\[\s\S]|[^\[\]\\])+/,
  ev = Y(
    /^ {0,3}\[(label)\]: *(?:\n[ \t]*)?([^<\s][^\s]*|<.*?>)(?:(?: +(?:\n[ \t]*)?| *\n[ \t]*)(title))? *(?:\n+|$)/,
  )
    .replace(`label`, $_)
    .replace(
      `title`,
      /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
    )
    .getRegex(),
  tv = Y(/^( {0,3}bull)([ \t][^\n]+?)?(?:\n|$)/)
    .replace(/bull/g, q_)
    .getRegex(),
  nv = `address|article|aside|base|basefont|blockquote|body|caption|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option|p|param|search|section|summary|table|tbody|td|tfoot|th|thead|title|tr|track|ul`,
  rv = /<!--(?:-?>|[\s\S]*?(?:-->|$))/,
  iv = Y(
    `^ {0,3}(?:<(script|pre|style|textarea)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)|comment[^\\n]*(\\n+|$)|<\\?[\\s\\S]*?(?:\\?>\\n*|$)|<![A-Z][\\s\\S]*?(?:>\\n*|$)|<!\\[CDATA\\[[\\s\\S]*?(?:\\]\\]>\\n*|$)|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|<(?!script|pre|style|textarea)([a-z][\\w-]*)(?:attribute)*? */?>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$)|</(?!script|pre|style|textarea)[a-z][\\w-]*\\s*>(?=[ \\t]*(?:\\n|$))[\\s\\S]*?(?:(?:\\n[ 	]*)+\\n|$))`,
    `i`,
  )
    .replace(`comment`, rv)
    .replace(`tag`, nv)
    .replace(
      `attribute`,
      / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/,
    )
    .getRegex(),
  av = Y(Z_)
    .replace(`hr`, G_)
    .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
    .replace(`|lheading`, ``)
    .replace(`|table`, ``)
    .replace(`blockquote`, ` {0,3}>`)
    .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
    .replace(`list`, ` {0,3}(?:[*+-]|1[.)]) `)
    .replace(
      `html`,
      `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
    )
    .replace(`tag`, nv)
    .getRegex(),
  ov = {
    blockquote: Y(/^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/)
      .replace(`paragraph`, av)
      .getRegex(),
    code: U_,
    def: ev,
    fences: W_,
    heading: K_,
    hr: G_,
    html: iv,
    lheading: Y_,
    list: tv,
    newline: H_,
    paragraph: av,
    table: z_,
    text: Q_,
  },
  sv = Y(
    `^ *([^\\n ].*)\\n {0,3}((?:\\| *)?:?-+:? *(?:\\| *:?-+:? *)*(?:\\| *)?)(?:\\n((?:(?! *\\n|hr|heading|blockquote|code|fences|list|html).*(?:\\n|$))*)\\n*|$)`,
  )
    .replace(`hr`, G_)
    .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
    .replace(`blockquote`, ` {0,3}>`)
    .replace(`code`, `(?: {4}| {0,3}	)[^\\n]`)
    .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
    .replace(`list`, ` {0,3}(?:[*+-]|1[.)]) `)
    .replace(
      `html`,
      `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
    )
    .replace(`tag`, nv)
    .getRegex(),
  cv = {
    ...ov,
    lheading: X_,
    table: sv,
    paragraph: Y(Z_)
      .replace(`hr`, G_)
      .replace(`heading`, ` {0,3}#{1,6}(?:\\s|$)`)
      .replace(`|lheading`, ``)
      .replace(`table`, sv)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`fences`, " {0,3}(?:`{3,}(?=[^`\\n]*\\n)|~{3,})[^\\n]*\\n")
      .replace(`list`, ` {0,3}(?:[*+-]|1[.)]) `)
      .replace(
        `html`,
        `</?(?:tag)(?: +|\\n|/?>)|<(?:script|pre|style|textarea|!--)`,
      )
      .replace(`tag`, nv)
      .getRegex(),
  },
  lv = {
    ...ov,
    html: Y(
      `^ *(?:comment *(?:\\n|\\s*$)|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)|<tag(?:"[^"]*"|'[^']*'|\\s[^'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))`,
    )
      .replace(`comment`, rv)
      .replace(
        /tag/g,
        `(?!(?:a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)\\b)\\w+(?!:|[^\\w\\s@]*@)\\b`,
      )
      .getRegex(),
    def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/,
    heading: /^(#{1,6})(.*)(?:\n+|$)/,
    fences: z_,
    lheading: /^(.+?)\n {0,3}(=+|-+) *(?:\n+|$)/,
    paragraph: Y(Z_)
      .replace(`hr`, G_)
      .replace(
        `heading`,
        ` *#{1,6} *[^
]`,
      )
      .replace(`lheading`, Y_)
      .replace(`|table`, ``)
      .replace(`blockquote`, ` {0,3}>`)
      .replace(`|fences`, ``)
      .replace(`|list`, ``)
      .replace(`|html`, ``)
      .replace(`|tag`, ``)
      .getRegex(),
  },
  uv = /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
  dv = /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
  fv = /^( {2,}|\\)\n(?!\s*$)/,
  pv =
    /^(`+|[^`])(?:(?= {2,}\n)|[\s\S]*?(?:(?=[\\<!\[`*_]|\b_|$)|[^ ](?= {2,}\n)))/,
  mv = /[\p{P}\p{S}]/u,
  hv = /[\s\p{P}\p{S}]/u,
  gv = /[^\s\p{P}\p{S}]/u,
  _v = Y(/^((?![*_])punctSpace)/, `u`)
    .replace(/punctSpace/g, hv)
    .getRegex(),
  vv = /(?!~)[\p{P}\p{S}]/u,
  yv = /(?!~)[\s\p{P}\p{S}]/u,
  bv = /(?:[^\s\p{P}\p{S}]|~)/u,
  xv = Y(/link|precode-code|html/, `g`)
    .replace(
      `link`,
      /\[(?:[^\[\]`]|(?<a>`+)[^`]+\k<a>(?!`))*?\]\((?:\\[\s\S]|[^\\\(\)]|\((?:\\[\s\S]|[^\\\(\)])*\))*\)/,
    )
    .replace(`precode-`, B_ ? "(?<!`)()" : "(^^|[^`])")
    .replace(`code`, /(?<b>`+)[^`]+\k<b>(?!`)/)
    .replace(`html`, /<(?! )[^<>]*?>/)
    .getRegex(),
  Sv = /^(?:\*+(?:((?!\*)punct)|[^\s*]))|^_+(?:((?!_)punct)|([^\s_]))/,
  Cv = Y(Sv, `u`).replace(/punct/g, mv).getRegex(),
  wv = Y(Sv, `u`).replace(/punct/g, vv).getRegex(),
  Tv = `^[^_*]*?__[^_*]*?\\*[^_*]*?(?=__)|[^*]+(?=[^*])|(?!\\*)punct(\\*+)(?=[\\s]|$)|notPunctSpace(\\*+)(?!\\*)(?=punctSpace|$)|(?!\\*)punctSpace(\\*+)(?=notPunctSpace)|[\\s](\\*+)(?!\\*)(?=punct)|(?!\\*)punct(\\*+)(?!\\*)(?=punct)|notPunctSpace(\\*+)(?=notPunctSpace)`,
  Ev = Y(Tv, `gu`)
    .replace(/notPunctSpace/g, gv)
    .replace(/punctSpace/g, hv)
    .replace(/punct/g, mv)
    .getRegex(),
  Dv = Y(Tv, `gu`)
    .replace(/notPunctSpace/g, bv)
    .replace(/punctSpace/g, yv)
    .replace(/punct/g, vv)
    .getRegex(),
  Ov = Y(
    `^[^_*]*?\\*\\*[^_*]*?_[^_*]*?(?=\\*\\*)|[^_]+(?=[^_])|(?!_)punct(_+)(?=[\\s]|$)|notPunctSpace(_+)(?!_)(?=punctSpace|$)|(?!_)punctSpace(_+)(?=notPunctSpace)|[\\s](_+)(?!_)(?=punct)|(?!_)punct(_+)(?!_)(?=punct)`,
    `gu`,
  )
    .replace(/notPunctSpace/g, gv)
    .replace(/punctSpace/g, hv)
    .replace(/punct/g, mv)
    .getRegex(),
  kv = Y(/\\(punct)/, `gu`)
    .replace(/punct/g, mv)
    .getRegex(),
  Av = Y(/^<(scheme:[^\s\x00-\x1f<>]*|email)>/)
    .replace(`scheme`, /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/)
    .replace(
      `email`,
      /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
    )
    .getRegex(),
  jv = Y(rv).replace(`(?:-->|$)`, `-->`).getRegex(),
  Mv = Y(
    `^comment|^</[a-zA-Z][\\w:-]*\\s*>|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>|^<\\?[\\s\\S]*?\\?>|^<![a-zA-Z]+\\s[\\s\\S]*?>|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>`,
  )
    .replace(`comment`, jv)
    .replace(
      `attribute`,
      /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
    )
    .getRegex(),
  Nv = /(?:\[(?:\\[\s\S]|[^\[\]\\])*\]|\\[\s\S]|`+[^`]*?`+(?!`)|[^\[\]\\`])*?/,
  Pv = Y(/^!?\[(label)\]\(\s*(href)(?:(?:[ \t]*(?:\n[ \t]*)?)(title))?\s*\)/)
    .replace(`label`, Nv)
    .replace(`href`, /<(?:\\.|[^\n<>\\])+>|[^ \t\n\x00-\x1f]*/)
    .replace(
      `title`,
      /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/,
    )
    .getRegex(),
  Fv = Y(/^!?\[(label)\]\[(ref)\]/)
    .replace(`label`, Nv)
    .replace(`ref`, $_)
    .getRegex(),
  Iv = Y(/^!?\[(ref)\](?:\[\])?/)
    .replace(`ref`, $_)
    .getRegex(),
  Lv = Y(`reflink|nolink(?!\\()`, `g`)
    .replace(`reflink`, Fv)
    .replace(`nolink`, Iv)
    .getRegex(),
  Rv = /[hH][tT][tT][pP][sS]?|[fF][tT][pP]/,
  zv = {
    _backpedal: z_,
    anyPunctuation: kv,
    autolink: Av,
    blockSkip: xv,
    br: fv,
    code: dv,
    del: z_,
    emStrongLDelim: Cv,
    emStrongRDelimAst: Ev,
    emStrongRDelimUnd: Ov,
    escape: uv,
    link: Pv,
    nolink: Iv,
    punctuation: _v,
    reflink: Fv,
    reflinkSearch: Lv,
    tag: Mv,
    text: pv,
    url: z_,
  },
  Bv = {
    ...zv,
    link: Y(/^!?\[(label)\]\((.*?)\)/)
      .replace(`label`, Nv)
      .getRegex(),
    reflink: Y(/^!?\[(label)\]\s*\[([^\]]*)\]/)
      .replace(`label`, Nv)
      .getRegex(),
  },
  Vv = {
    ...zv,
    emStrongRDelimAst: Dv,
    emStrongLDelim: wv,
    url: Y(/^((?:protocol):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/)
      .replace(`protocol`, Rv)
      .replace(
        `email`,
        /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
      )
      .getRegex(),
    _backpedal:
      /(?:[^?!.,:;*_'"~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_'"~)]+(?!$))+/,
    del: /^(~~?)(?=[^\s~])((?:\\[\s\S]|[^\\])*?(?:\\[\s\S]|[^\s~\\]))\1(?=[^~]|$)/,
    text: Y(
      /^([`~]+|[^`~])(?:(?= {2,}\n)|(?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)|[\s\S]*?(?:(?=[\\<!\[`*~_]|\b_|protocol:\/\/|www\.|$)|[^ ](?= {2,}\n)|[^a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-](?=[a-zA-Z0-9.!#$%&'*+\/=?_`{\|}~-]+@)))/,
    )
      .replace(`protocol`, Rv)
      .getRegex(),
  },
  Hv = {
    ...Vv,
    br: Y(fv).replace(`{2,}`, `*`).getRegex(),
    text: Y(Vv.text)
      .replace(`\\b_`, `\\b_| {2,}\\n`)
      .replace(/\{2,\}/g, `*`)
      .getRegex(),
  },
  Uv = { normal: ov, gfm: cv, pedantic: lv },
  Wv = { normal: zv, gfm: Vv, breaks: Hv, pedantic: Bv },
  Gv = { "&": `&amp;`, "<": `&lt;`, ">": `&gt;`, '"': `&quot;`, "'": `&#39;` },
  Kv = (e) => Gv[e];
function qv(e, t) {
  if (t) {
    if (V_.escapeTest.test(e)) return e.replace(V_.escapeReplace, Kv);
  } else if (V_.escapeTestNoEncode.test(e))
    return e.replace(V_.escapeReplaceNoEncode, Kv);
  return e;
}
function Jv(e) {
  try {
    e = encodeURI(e).replace(V_.percentDecode, `%`);
  } catch {
    return null;
  }
  return e;
}
function Yv(e, t) {
  let n = e
      .replace(V_.findPipe, (e, t, n) => {
        let r = !1,
          i = t;
        for (; --i >= 0 && n[i] === `\\`; ) r = !r;
        return r ? `|` : ` |`;
      })
      .split(V_.splitPipe),
    r = 0;
  if (
    (n[0].trim() || n.shift(), n.length > 0 && !n.at(-1)?.trim() && n.pop(), t)
  )
    if (n.length > t) n.splice(t);
    else for (; n.length < t; ) n.push(``);
  for (; r < n.length; r++) n[r] = n[r].trim().replace(V_.slashPipe, `|`);
  return n;
}
function Xv(e, t, n) {
  let r = e.length;
  if (r === 0) return ``;
  let i = 0;
  for (; i < r; ) {
    let a = e.charAt(r - i - 1);
    if (a === t && !n) i++;
    else if (a !== t && n) i++;
    else break;
  }
  return e.slice(0, r - i);
}
function Zv(e, t) {
  if (e.indexOf(t[1]) === -1) return -1;
  let n = 0;
  for (let r = 0; r < e.length; r++)
    if (e[r] === `\\`) r++;
    else if (e[r] === t[0]) n++;
    else if (e[r] === t[1] && (n--, n < 0)) return r;
  return n > 0 ? -2 : -1;
}
function Qv(e, t, n, r, i) {
  let a = t.href,
    o = t.title || null,
    s = e[1].replace(i.other.outputLinkReplace, `$1`);
  r.state.inLink = !0;
  let c = {
    type: e[0].charAt(0) === `!` ? `image` : `link`,
    raw: n,
    href: a,
    title: o,
    text: s,
    tokens: r.inlineTokens(s),
  };
  return ((r.state.inLink = !1), c);
}
function $v(e, t, n) {
  let r = e.match(n.other.indentCodeCompensation);
  if (r === null) return t;
  let i = r[1];
  return t
    .split(
      `
`,
    )
    .map((e) => {
      let t = e.match(n.other.beginningSpace);
      if (t === null) return e;
      let [r] = t;
      return r.length >= i.length ? e.slice(i.length) : e;
    }).join(`
`);
}
var ey = class {
    options;
    rules;
    lexer;
    constructor(e) {
      this.options = e || L_;
    }
    space(e) {
      let t = this.rules.block.newline.exec(e);
      if (t && t[0].length > 0) return { type: `space`, raw: t[0] };
    }
    code(e) {
      let t = this.rules.block.code.exec(e);
      if (t) {
        let e = t[0].replace(this.rules.other.codeRemoveIndent, ``);
        return {
          type: `code`,
          raw: t[0],
          codeBlockStyle: `indented`,
          text: this.options.pedantic
            ? e
            : Xv(
                e,
                `
`,
              ),
        };
      }
    }
    fences(e) {
      let t = this.rules.block.fences.exec(e);
      if (t) {
        let e = t[0],
          n = $v(e, t[3] || ``, this.rules);
        return {
          type: `code`,
          raw: e,
          lang: t[2]
            ? t[2].trim().replace(this.rules.inline.anyPunctuation, `$1`)
            : t[2],
          text: n,
        };
      }
    }
    heading(e) {
      let t = this.rules.block.heading.exec(e);
      if (t) {
        let e = t[2].trim();
        if (this.rules.other.endingHash.test(e)) {
          let t = Xv(e, `#`);
          (this.options.pedantic ||
            !t ||
            this.rules.other.endingSpaceChar.test(t)) &&
            (e = t.trim());
        }
        return {
          type: `heading`,
          raw: t[0],
          depth: t[1].length,
          text: e,
          tokens: this.lexer.inline(e),
        };
      }
    }
    hr(e) {
      let t = this.rules.block.hr.exec(e);
      if (t)
        return {
          type: `hr`,
          raw: Xv(
            t[0],
            `
`,
          ),
        };
    }
    blockquote(e) {
      let t = this.rules.block.blockquote.exec(e);
      if (t) {
        let e = Xv(
            t[0],
            `
`,
          ).split(`
`),
          n = ``,
          r = ``,
          i = [];
        for (; e.length > 0; ) {
          let t = !1,
            a = [],
            o;
          for (o = 0; o < e.length; o++)
            if (this.rules.other.blockquoteStart.test(e[o]))
              (a.push(e[o]), (t = !0));
            else if (!t) a.push(e[o]);
            else break;
          e = e.slice(o);
          let s = a.join(`
`),
            c = s
              .replace(
                this.rules.other.blockquoteSetextReplace,
                `
    $1`,
              )
              .replace(this.rules.other.blockquoteSetextReplace2, ``);
          ((n = n
            ? `${n}
${s}`
            : s),
            (r = r
              ? `${r}
${c}`
              : c));
          let l = this.lexer.state.top;
          if (
            ((this.lexer.state.top = !0),
            this.lexer.blockTokens(c, i, !0),
            (this.lexer.state.top = l),
            e.length === 0)
          )
            break;
          let u = i.at(-1);
          if (u?.type === `code`) break;
          if (u?.type === `blockquote`) {
            let t = u,
              a =
                t.raw +
                `
` +
                e.join(`
`),
              o = this.blockquote(a);
            ((i[i.length - 1] = o),
              (n = n.substring(0, n.length - t.raw.length) + o.raw),
              (r = r.substring(0, r.length - t.text.length) + o.text));
            break;
          } else if (u?.type === `list`) {
            let t = u,
              a =
                t.raw +
                `
` +
                e.join(`
`),
              o = this.list(a);
            ((i[i.length - 1] = o),
              (n = n.substring(0, n.length - u.raw.length) + o.raw),
              (r = r.substring(0, r.length - t.raw.length) + o.raw),
              (e = a.substring(i.at(-1).raw.length).split(`
`)));
            continue;
          }
        }
        return { type: `blockquote`, raw: n, tokens: i, text: r };
      }
    }
    list(e) {
      let t = this.rules.block.list.exec(e);
      if (t) {
        let n = t[1].trim(),
          r = n.length > 1,
          i = {
            type: `list`,
            raw: ``,
            ordered: r,
            start: r ? +n.slice(0, -1) : ``,
            loose: !1,
            items: [],
          };
        ((n = r ? `\\d{1,9}\\${n.slice(-1)}` : `\\${n}`),
          this.options.pedantic && (n = r ? n : `[*+-]`));
        let a = this.rules.other.listItemRegex(n),
          o = !1;
        for (; e; ) {
          let n = !1,
            r = ``,
            s = ``;
          if (!(t = a.exec(e)) || this.rules.block.hr.test(e)) break;
          ((r = t[0]), (e = e.substring(r.length)));
          let c = t[2]
              .split(
                `
`,
                1,
              )[0]
              .replace(this.rules.other.listReplaceTabs, (e) =>
                ` `.repeat(3 * e.length),
              ),
            l = e.split(
              `
`,
              1,
            )[0],
            u = !c.trim(),
            d = 0;
          if (
            (this.options.pedantic
              ? ((d = 2), (s = c.trimStart()))
              : u
                ? (d = t[1].length + 1)
                : ((d = t[2].search(this.rules.other.nonSpaceChar)),
                  (d = d > 4 ? 1 : d),
                  (s = c.slice(d)),
                  (d += t[1].length)),
            u &&
              this.rules.other.blankLine.test(l) &&
              ((r +=
                l +
                `
`),
              (e = e.substring(l.length + 1)),
              (n = !0)),
            !n)
          ) {
            let t = this.rules.other.nextBulletRegex(d),
              n = this.rules.other.hrRegex(d),
              i = this.rules.other.fencesBeginRegex(d),
              a = this.rules.other.headingBeginRegex(d),
              o = this.rules.other.htmlBeginRegex(d);
            for (; e; ) {
              let f = e.split(
                  `
`,
                  1,
                )[0],
                p;
              if (
                ((l = f),
                this.options.pedantic
                  ? ((l = l.replace(this.rules.other.listReplaceNesting, `  `)),
                    (p = l))
                  : (p = l.replace(this.rules.other.tabCharGlobal, `    `)),
                i.test(l) || a.test(l) || o.test(l) || t.test(l) || n.test(l))
              )
                break;
              if (p.search(this.rules.other.nonSpaceChar) >= d || !l.trim())
                s +=
                  `
` + p.slice(d);
              else {
                if (
                  u ||
                  c
                    .replace(this.rules.other.tabCharGlobal, `    `)
                    .search(this.rules.other.nonSpaceChar) >= 4 ||
                  i.test(c) ||
                  a.test(c) ||
                  n.test(c)
                )
                  break;
                s +=
                  `
` + l;
              }
              (!u && !l.trim() && (u = !0),
                (r +=
                  f +
                  `
`),
                (e = e.substring(f.length + 1)),
                (c = p.slice(d)));
            }
          }
          (i.loose ||
            (o
              ? (i.loose = !0)
              : this.rules.other.doubleBlankLine.test(r) && (o = !0)),
            i.items.push({
              type: `list_item`,
              raw: r,
              task: !!this.options.gfm && this.rules.other.listIsTask.test(s),
              loose: !1,
              text: s,
              tokens: [],
            }),
            (i.raw += r));
        }
        let s = i.items.at(-1);
        if (s) ((s.raw = s.raw.trimEnd()), (s.text = s.text.trimEnd()));
        else return;
        i.raw = i.raw.trimEnd();
        for (let e of i.items) {
          if (
            ((this.lexer.state.top = !1),
            (e.tokens = this.lexer.blockTokens(e.text, [])),
            e.task)
          ) {
            if (
              ((e.text = e.text.replace(this.rules.other.listReplaceTask, ``)),
              e.tokens[0]?.type === `text` || e.tokens[0]?.type === `paragraph`)
            ) {
              ((e.tokens[0].raw = e.tokens[0].raw.replace(
                this.rules.other.listReplaceTask,
                ``,
              )),
                (e.tokens[0].text = e.tokens[0].text.replace(
                  this.rules.other.listReplaceTask,
                  ``,
                )));
              for (let e = this.lexer.inlineQueue.length - 1; e >= 0; e--)
                if (
                  this.rules.other.listIsTask.test(
                    this.lexer.inlineQueue[e].src,
                  )
                ) {
                  this.lexer.inlineQueue[e].src = this.lexer.inlineQueue[
                    e
                  ].src.replace(this.rules.other.listReplaceTask, ``);
                  break;
                }
            }
            let t = this.rules.other.listTaskCheckbox.exec(e.raw);
            if (t) {
              let n = {
                type: `checkbox`,
                raw: t[0] + ` `,
                checked: t[0] !== `[ ]`,
              };
              ((e.checked = n.checked),
                i.loose
                  ? e.tokens[0] &&
                    [`paragraph`, `text`].includes(e.tokens[0].type) &&
                    `tokens` in e.tokens[0] &&
                    e.tokens[0].tokens
                    ? ((e.tokens[0].raw = n.raw + e.tokens[0].raw),
                      (e.tokens[0].text = n.raw + e.tokens[0].text),
                      e.tokens[0].tokens.unshift(n))
                    : e.tokens.unshift({
                        type: `paragraph`,
                        raw: n.raw,
                        text: n.raw,
                        tokens: [n],
                      })
                  : e.tokens.unshift(n));
            }
          }
          if (!i.loose) {
            let t = e.tokens.filter((e) => e.type === `space`);
            i.loose =
              t.length > 0 &&
              t.some((e) => this.rules.other.anyLine.test(e.raw));
          }
        }
        if (i.loose)
          for (let e of i.items) {
            e.loose = !0;
            for (let t of e.tokens) t.type === `text` && (t.type = `paragraph`);
          }
        return i;
      }
    }
    html(e) {
      let t = this.rules.block.html.exec(e);
      if (t)
        return {
          type: `html`,
          block: !0,
          raw: t[0],
          pre: t[1] === `pre` || t[1] === `script` || t[1] === `style`,
          text: t[0],
        };
    }
    def(e) {
      let t = this.rules.block.def.exec(e);
      if (t) {
        let e = t[1]
            .toLowerCase()
            .replace(this.rules.other.multipleSpaceGlobal, ` `),
          n = t[2]
            ? t[2]
                .replace(this.rules.other.hrefBrackets, `$1`)
                .replace(this.rules.inline.anyPunctuation, `$1`)
            : ``,
          r = t[3]
            ? t[3]
                .substring(1, t[3].length - 1)
                .replace(this.rules.inline.anyPunctuation, `$1`)
            : t[3];
        return { type: `def`, tag: e, raw: t[0], href: n, title: r };
      }
    }
    table(e) {
      let t = this.rules.block.table.exec(e);
      if (!t || !this.rules.other.tableDelimiter.test(t[2])) return;
      let n = Yv(t[1]),
        r = t[2].replace(this.rules.other.tableAlignChars, ``).split(`|`),
        i = t[3]?.trim()
          ? t[3].replace(this.rules.other.tableRowBlankLine, ``).split(`
`)
          : [],
        a = { type: `table`, raw: t[0], header: [], align: [], rows: [] };
      if (n.length === r.length) {
        for (let e of r)
          this.rules.other.tableAlignRight.test(e)
            ? a.align.push(`right`)
            : this.rules.other.tableAlignCenter.test(e)
              ? a.align.push(`center`)
              : this.rules.other.tableAlignLeft.test(e)
                ? a.align.push(`left`)
                : a.align.push(null);
        for (let e = 0; e < n.length; e++)
          a.header.push({
            text: n[e],
            tokens: this.lexer.inline(n[e]),
            header: !0,
            align: a.align[e],
          });
        for (let e of i)
          a.rows.push(
            Yv(e, a.header.length).map((e, t) => ({
              text: e,
              tokens: this.lexer.inline(e),
              header: !1,
              align: a.align[t],
            })),
          );
        return a;
      }
    }
    lheading(e) {
      let t = this.rules.block.lheading.exec(e);
      if (t)
        return {
          type: `heading`,
          raw: t[0],
          depth: t[2].charAt(0) === `=` ? 1 : 2,
          text: t[1],
          tokens: this.lexer.inline(t[1]),
        };
    }
    paragraph(e) {
      let t = this.rules.block.paragraph.exec(e);
      if (t) {
        let e =
          t[1].charAt(t[1].length - 1) ===
          `
`
            ? t[1].slice(0, -1)
            : t[1];
        return {
          type: `paragraph`,
          raw: t[0],
          text: e,
          tokens: this.lexer.inline(e),
        };
      }
    }
    text(e) {
      let t = this.rules.block.text.exec(e);
      if (t)
        return {
          type: `text`,
          raw: t[0],
          text: t[0],
          tokens: this.lexer.inline(t[0]),
        };
    }
    escape(e) {
      let t = this.rules.inline.escape.exec(e);
      if (t) return { type: `escape`, raw: t[0], text: t[1] };
    }
    tag(e) {
      let t = this.rules.inline.tag.exec(e);
      if (t)
        return (
          !this.lexer.state.inLink && this.rules.other.startATag.test(t[0])
            ? (this.lexer.state.inLink = !0)
            : this.lexer.state.inLink &&
              this.rules.other.endATag.test(t[0]) &&
              (this.lexer.state.inLink = !1),
          !this.lexer.state.inRawBlock &&
          this.rules.other.startPreScriptTag.test(t[0])
            ? (this.lexer.state.inRawBlock = !0)
            : this.lexer.state.inRawBlock &&
              this.rules.other.endPreScriptTag.test(t[0]) &&
              (this.lexer.state.inRawBlock = !1),
          {
            type: `html`,
            raw: t[0],
            inLink: this.lexer.state.inLink,
            inRawBlock: this.lexer.state.inRawBlock,
            block: !1,
            text: t[0],
          }
        );
    }
    link(e) {
      let t = this.rules.inline.link.exec(e);
      if (t) {
        let e = t[2].trim();
        if (
          !this.options.pedantic &&
          this.rules.other.startAngleBracket.test(e)
        ) {
          if (!this.rules.other.endAngleBracket.test(e)) return;
          let t = Xv(e.slice(0, -1), `\\`);
          if ((e.length - t.length) % 2 == 0) return;
        } else {
          let e = Zv(t[2], `()`);
          if (e === -2) return;
          if (e > -1) {
            let n = (t[0].indexOf(`!`) === 0 ? 5 : 4) + t[1].length + e;
            ((t[2] = t[2].substring(0, e)),
              (t[0] = t[0].substring(0, n).trim()),
              (t[3] = ``));
          }
        }
        let n = t[2],
          r = ``;
        if (this.options.pedantic) {
          let e = this.rules.other.pedanticHrefTitle.exec(n);
          e && ((n = e[1]), (r = e[3]));
        } else r = t[3] ? t[3].slice(1, -1) : ``;
        return (
          (n = n.trim()),
          this.rules.other.startAngleBracket.test(n) &&
            (n =
              this.options.pedantic && !this.rules.other.endAngleBracket.test(e)
                ? n.slice(1)
                : n.slice(1, -1)),
          Qv(
            t,
            {
              href: n && n.replace(this.rules.inline.anyPunctuation, `$1`),
              title: r && r.replace(this.rules.inline.anyPunctuation, `$1`),
            },
            t[0],
            this.lexer,
            this.rules,
          )
        );
      }
    }
    reflink(e, t) {
      let n;
      if (
        (n = this.rules.inline.reflink.exec(e)) ||
        (n = this.rules.inline.nolink.exec(e))
      ) {
        let e =
          t[
            (n[2] || n[1])
              .replace(this.rules.other.multipleSpaceGlobal, ` `)
              .toLowerCase()
          ];
        if (!e) {
          let e = n[0].charAt(0);
          return { type: `text`, raw: e, text: e };
        }
        return Qv(n, e, n[0], this.lexer, this.rules);
      }
    }
    emStrong(e, t, n = ``) {
      let r = this.rules.inline.emStrongLDelim.exec(e);
      if (
        !(!r || (r[3] && n.match(this.rules.other.unicodeAlphaNumeric))) &&
        (!(r[1] || r[2]) || !n || this.rules.inline.punctuation.exec(n))
      ) {
        let n = [...r[0]].length - 1,
          i,
          a,
          o = n,
          s = 0,
          c =
            r[0][0] === `*`
              ? this.rules.inline.emStrongRDelimAst
              : this.rules.inline.emStrongRDelimUnd;
        for (
          c.lastIndex = 0, t = t.slice(-1 * e.length + n);
          (r = c.exec(t)) != null;
        ) {
          if (((i = r[1] || r[2] || r[3] || r[4] || r[5] || r[6]), !i))
            continue;
          if (((a = [...i].length), r[3] || r[4])) {
            o += a;
            continue;
          } else if ((r[5] || r[6]) && n % 3 && !((n + a) % 3)) {
            s += a;
            continue;
          }
          if (((o -= a), o > 0)) continue;
          a = Math.min(a, a + o + s);
          let t = [...r[0]][0].length,
            c = e.slice(0, n + r.index + t + a);
          if (Math.min(n, a) % 2) {
            let e = c.slice(1, -1);
            return {
              type: `em`,
              raw: c,
              text: e,
              tokens: this.lexer.inlineTokens(e),
            };
          }
          let l = c.slice(2, -2);
          return {
            type: `strong`,
            raw: c,
            text: l,
            tokens: this.lexer.inlineTokens(l),
          };
        }
      }
    }
    codespan(e) {
      let t = this.rules.inline.code.exec(e);
      if (t) {
        let e = t[2].replace(this.rules.other.newLineCharGlobal, ` `),
          n = this.rules.other.nonSpaceChar.test(e),
          r =
            this.rules.other.startingSpaceChar.test(e) &&
            this.rules.other.endingSpaceChar.test(e);
        return (
          n && r && (e = e.substring(1, e.length - 1)),
          { type: `codespan`, raw: t[0], text: e }
        );
      }
    }
    br(e) {
      let t = this.rules.inline.br.exec(e);
      if (t) return { type: `br`, raw: t[0] };
    }
    del(e) {
      let t = this.rules.inline.del.exec(e);
      if (t)
        return {
          type: `del`,
          raw: t[0],
          text: t[2],
          tokens: this.lexer.inlineTokens(t[2]),
        };
    }
    autolink(e) {
      let t = this.rules.inline.autolink.exec(e);
      if (t) {
        let e, n;
        return (
          t[2] === `@`
            ? ((e = t[1]), (n = `mailto:` + e))
            : ((e = t[1]), (n = e)),
          {
            type: `link`,
            raw: t[0],
            text: e,
            href: n,
            tokens: [{ type: `text`, raw: e, text: e }],
          }
        );
      }
    }
    url(e) {
      let t;
      if ((t = this.rules.inline.url.exec(e))) {
        let e, n;
        if (t[2] === `@`) ((e = t[0]), (n = `mailto:` + e));
        else {
          let r;
          do
            ((r = t[0]),
              (t[0] = this.rules.inline._backpedal.exec(t[0])?.[0] ?? ``));
          while (r !== t[0]);
          ((e = t[0]), (n = t[1] === `www.` ? `http://` + t[0] : t[0]));
        }
        return {
          type: `link`,
          raw: t[0],
          text: e,
          href: n,
          tokens: [{ type: `text`, raw: e, text: e }],
        };
      }
    }
    inlineText(e) {
      let t = this.rules.inline.text.exec(e);
      if (t) {
        let e = this.lexer.state.inRawBlock;
        return { type: `text`, raw: t[0], text: t[0], escaped: e };
      }
    }
  },
  ty = class e {
    tokens;
    options;
    state;
    inlineQueue;
    tokenizer;
    constructor(e) {
      ((this.tokens = []),
        (this.tokens.links = Object.create(null)),
        (this.options = e || L_),
        (this.options.tokenizer = this.options.tokenizer || new ey()),
        (this.tokenizer = this.options.tokenizer),
        (this.tokenizer.options = this.options),
        (this.tokenizer.lexer = this),
        (this.inlineQueue = []),
        (this.state = { inLink: !1, inRawBlock: !1, top: !0 }));
      let t = { other: V_, block: Uv.normal, inline: Wv.normal };
      (this.options.pedantic
        ? ((t.block = Uv.pedantic), (t.inline = Wv.pedantic))
        : this.options.gfm &&
          ((t.block = Uv.gfm),
          this.options.breaks ? (t.inline = Wv.breaks) : (t.inline = Wv.gfm)),
        (this.tokenizer.rules = t));
    }
    static get rules() {
      return { block: Uv, inline: Wv };
    }
    static lex(t, n) {
      return new e(n).lex(t);
    }
    static lexInline(t, n) {
      return new e(n).inlineTokens(t);
    }
    lex(e) {
      ((e = e.replace(
        V_.carriageReturn,
        `
`,
      )),
        this.blockTokens(e, this.tokens));
      for (let e = 0; e < this.inlineQueue.length; e++) {
        let t = this.inlineQueue[e];
        this.inlineTokens(t.src, t.tokens);
      }
      return ((this.inlineQueue = []), this.tokens);
    }
    blockTokens(e, t = [], n = !1) {
      for (
        this.options.pedantic &&
        (e = e.replace(V_.tabCharGlobal, `    `).replace(V_.spaceLine, ``));
        e;
      ) {
        let r;
        if (
          this.options.extensions?.block?.some((n) =>
            (r = n.call({ lexer: this }, e, t))
              ? ((e = e.substring(r.raw.length)), t.push(r), !0)
              : !1,
          )
        )
          continue;
        if ((r = this.tokenizer.space(e))) {
          e = e.substring(r.raw.length);
          let n = t.at(-1);
          r.raw.length === 1 && n !== void 0
            ? (n.raw += `
`)
            : t.push(r);
          continue;
        }
        if ((r = this.tokenizer.code(e))) {
          e = e.substring(r.raw.length);
          let n = t.at(-1);
          n?.type === `paragraph` || n?.type === `text`
            ? ((n.raw +=
                (n.raw.endsWith(`
`)
                  ? ``
                  : `
`) + r.raw),
              (n.text +=
                `
` + r.text),
              (this.inlineQueue.at(-1).src = n.text))
            : t.push(r);
          continue;
        }
        if ((r = this.tokenizer.fences(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.heading(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.hr(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.blockquote(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.list(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.html(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.def(e))) {
          e = e.substring(r.raw.length);
          let n = t.at(-1);
          n?.type === `paragraph` || n?.type === `text`
            ? ((n.raw +=
                (n.raw.endsWith(`
`)
                  ? ``
                  : `
`) + r.raw),
              (n.text +=
                `
` + r.raw),
              (this.inlineQueue.at(-1).src = n.text))
            : this.tokens.links[r.tag] ||
              ((this.tokens.links[r.tag] = { href: r.href, title: r.title }),
              t.push(r));
          continue;
        }
        if ((r = this.tokenizer.table(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.lheading(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        let i = e;
        if (this.options.extensions?.startBlock) {
          let t = 1 / 0,
            n = e.slice(1),
            r;
          (this.options.extensions.startBlock.forEach((e) => {
            ((r = e.call({ lexer: this }, n)),
              typeof r == `number` && r >= 0 && (t = Math.min(t, r)));
          }),
            t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1)));
        }
        if (this.state.top && (r = this.tokenizer.paragraph(i))) {
          let a = t.at(-1);
          (n && a?.type === `paragraph`
            ? ((a.raw +=
                (a.raw.endsWith(`
`)
                  ? ``
                  : `
`) + r.raw),
              (a.text +=
                `
` + r.text),
              this.inlineQueue.pop(),
              (this.inlineQueue.at(-1).src = a.text))
            : t.push(r),
            (n = i.length !== e.length),
            (e = e.substring(r.raw.length)));
          continue;
        }
        if ((r = this.tokenizer.text(e))) {
          e = e.substring(r.raw.length);
          let n = t.at(-1);
          n?.type === `text`
            ? ((n.raw +=
                (n.raw.endsWith(`
`)
                  ? ``
                  : `
`) + r.raw),
              (n.text +=
                `
` + r.text),
              this.inlineQueue.pop(),
              (this.inlineQueue.at(-1).src = n.text))
            : t.push(r);
          continue;
        }
        if (e) {
          let t = `Infinite loop on byte: ` + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(t);
            break;
          } else throw Error(t);
        }
      }
      return ((this.state.top = !0), t);
    }
    inline(e, t = []) {
      return (this.inlineQueue.push({ src: e, tokens: t }), t);
    }
    inlineTokens(e, t = []) {
      let n = e,
        r = null;
      if (this.tokens.links) {
        let e = Object.keys(this.tokens.links);
        if (e.length > 0)
          for (
            ;
            (r = this.tokenizer.rules.inline.reflinkSearch.exec(n)) != null;
          )
            e.includes(r[0].slice(r[0].lastIndexOf(`[`) + 1, -1)) &&
              (n =
                n.slice(0, r.index) +
                `[` +
                `a`.repeat(r[0].length - 2) +
                `]` +
                n.slice(this.tokenizer.rules.inline.reflinkSearch.lastIndex));
      }
      for (; (r = this.tokenizer.rules.inline.anyPunctuation.exec(n)) != null; )
        n =
          n.slice(0, r.index) +
          `++` +
          n.slice(this.tokenizer.rules.inline.anyPunctuation.lastIndex);
      let i;
      for (; (r = this.tokenizer.rules.inline.blockSkip.exec(n)) != null; )
        ((i = r[2] ? r[2].length : 0),
          (n =
            n.slice(0, r.index + i) +
            `[` +
            `a`.repeat(r[0].length - i - 2) +
            `]` +
            n.slice(this.tokenizer.rules.inline.blockSkip.lastIndex)));
      n = this.options.hooks?.emStrongMask?.call({ lexer: this }, n) ?? n;
      let a = !1,
        o = ``;
      for (; e; ) {
        (a || (o = ``), (a = !1));
        let r;
        if (
          this.options.extensions?.inline?.some((n) =>
            (r = n.call({ lexer: this }, e, t))
              ? ((e = e.substring(r.raw.length)), t.push(r), !0)
              : !1,
          )
        )
          continue;
        if ((r = this.tokenizer.escape(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.tag(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.link(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.reflink(e, this.tokens.links))) {
          e = e.substring(r.raw.length);
          let n = t.at(-1);
          r.type === `text` && n?.type === `text`
            ? ((n.raw += r.raw), (n.text += r.text))
            : t.push(r);
          continue;
        }
        if ((r = this.tokenizer.emStrong(e, n, o))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.codespan(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.br(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.del(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if ((r = this.tokenizer.autolink(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        if (!this.state.inLink && (r = this.tokenizer.url(e))) {
          ((e = e.substring(r.raw.length)), t.push(r));
          continue;
        }
        let i = e;
        if (this.options.extensions?.startInline) {
          let t = 1 / 0,
            n = e.slice(1),
            r;
          (this.options.extensions.startInline.forEach((e) => {
            ((r = e.call({ lexer: this }, n)),
              typeof r == `number` && r >= 0 && (t = Math.min(t, r)));
          }),
            t < 1 / 0 && t >= 0 && (i = e.substring(0, t + 1)));
        }
        if ((r = this.tokenizer.inlineText(i))) {
          ((e = e.substring(r.raw.length)),
            r.raw.slice(-1) !== `_` && (o = r.raw.slice(-1)),
            (a = !0));
          let n = t.at(-1);
          n?.type === `text`
            ? ((n.raw += r.raw), (n.text += r.text))
            : t.push(r);
          continue;
        }
        if (e) {
          let t = `Infinite loop on byte: ` + e.charCodeAt(0);
          if (this.options.silent) {
            console.error(t);
            break;
          } else throw Error(t);
        }
      }
      return t;
    }
  },
  ny = class {
    options;
    parser;
    constructor(e) {
      this.options = e || L_;
    }
    space(e) {
      return ``;
    }
    code({ text: e, lang: t, escaped: n }) {
      let r = (t || ``).match(V_.notSpaceStart)?.[0],
        i =
          e.replace(V_.endingNewline, ``) +
          `
`;
      return r
        ? `<pre><code class="language-` +
            qv(r) +
            `">` +
            (n ? i : qv(i, !0)) +
            `</code></pre>
`
        : `<pre><code>` +
            (n ? i : qv(i, !0)) +
            `</code></pre>
`;
    }
    blockquote({ tokens: e }) {
      return `<blockquote>
${this.parser.parse(e)}</blockquote>
`;
    }
    html({ text: e }) {
      return e;
    }
    def(e) {
      return ``;
    }
    heading({ tokens: e, depth: t }) {
      return `<h${t}>${this.parser.parseInline(e)}</h${t}>
`;
    }
    hr(e) {
      return `<hr>
`;
    }
    list(e) {
      let t = e.ordered,
        n = e.start,
        r = ``;
      for (let t = 0; t < e.items.length; t++) {
        let n = e.items[t];
        r += this.listitem(n);
      }
      let i = t ? `ol` : `ul`,
        a = t && n !== 1 ? ` start="` + n + `"` : ``;
      return (
        `<` +
        i +
        a +
        `>
` +
        r +
        `</` +
        i +
        `>
`
      );
    }
    listitem(e) {
      return `<li>${this.parser.parse(e.tokens)}</li>
`;
    }
    checkbox({ checked: e }) {
      return (
        `<input ` + (e ? `checked="" ` : ``) + `disabled="" type="checkbox"> `
      );
    }
    paragraph({ tokens: e }) {
      return `<p>${this.parser.parseInline(e)}</p>
`;
    }
    table(e) {
      let t = ``,
        n = ``;
      for (let t = 0; t < e.header.length; t++)
        n += this.tablecell(e.header[t]);
      t += this.tablerow({ text: n });
      let r = ``;
      for (let t = 0; t < e.rows.length; t++) {
        let i = e.rows[t];
        n = ``;
        for (let e = 0; e < i.length; e++) n += this.tablecell(i[e]);
        r += this.tablerow({ text: n });
      }
      return (
        (r &&= `<tbody>${r}</tbody>`),
        `<table>
<thead>
` +
          t +
          `</thead>
` +
          r +
          `</table>
`
      );
    }
    tablerow({ text: e }) {
      return `<tr>
${e}</tr>
`;
    }
    tablecell(e) {
      let t = this.parser.parseInline(e.tokens),
        n = e.header ? `th` : `td`;
      return (
        (e.align ? `<${n} align="${e.align}">` : `<${n}>`) +
        t +
        `</${n}>
`
      );
    }
    strong({ tokens: e }) {
      return `<strong>${this.parser.parseInline(e)}</strong>`;
    }
    em({ tokens: e }) {
      return `<em>${this.parser.parseInline(e)}</em>`;
    }
    codespan({ text: e }) {
      return `<code>${qv(e, !0)}</code>`;
    }
    br(e) {
      return `<br>`;
    }
    del({ tokens: e }) {
      return `<del>${this.parser.parseInline(e)}</del>`;
    }
    link({ href: e, title: t, tokens: n }) {
      let r = this.parser.parseInline(n),
        i = Jv(e);
      if (i === null) return r;
      e = i;
      let a = `<a href="` + e + `"`;
      return (t && (a += ` title="` + qv(t) + `"`), (a += `>` + r + `</a>`), a);
    }
    image({ href: e, title: t, text: n, tokens: r }) {
      r && (n = this.parser.parseInline(r, this.parser.textRenderer));
      let i = Jv(e);
      if (i === null) return qv(n);
      e = i;
      let a = `<img src="${e}" alt="${n}"`;
      return (t && (a += ` title="${qv(t)}"`), (a += `>`), a);
    }
    text(e) {
      return `tokens` in e && e.tokens
        ? this.parser.parseInline(e.tokens)
        : `escaped` in e && e.escaped
          ? e.text
          : qv(e.text);
    }
  },
  ry = class {
    strong({ text: e }) {
      return e;
    }
    em({ text: e }) {
      return e;
    }
    codespan({ text: e }) {
      return e;
    }
    del({ text: e }) {
      return e;
    }
    html({ text: e }) {
      return e;
    }
    text({ text: e }) {
      return e;
    }
    link({ text: e }) {
      return `` + e;
    }
    image({ text: e }) {
      return `` + e;
    }
    br() {
      return ``;
    }
    checkbox({ raw: e }) {
      return e;
    }
  },
  iy = class e {
    options;
    renderer;
    textRenderer;
    constructor(e) {
      ((this.options = e || L_),
        (this.options.renderer = this.options.renderer || new ny()),
        (this.renderer = this.options.renderer),
        (this.renderer.options = this.options),
        (this.renderer.parser = this),
        (this.textRenderer = new ry()));
    }
    static parse(t, n) {
      return new e(n).parse(t);
    }
    static parseInline(t, n) {
      return new e(n).parseInline(t);
    }
    parse(e) {
      let t = ``;
      for (let n = 0; n < e.length; n++) {
        let r = e[n];
        if (this.options.extensions?.renderers?.[r.type]) {
          let e = r,
            n = this.options.extensions.renderers[e.type].call(
              { parser: this },
              e,
            );
          if (
            n !== !1 ||
            ![
              `space`,
              `hr`,
              `heading`,
              `code`,
              `table`,
              `blockquote`,
              `list`,
              `html`,
              `def`,
              `paragraph`,
              `text`,
            ].includes(e.type)
          ) {
            t += n || ``;
            continue;
          }
        }
        let i = r;
        switch (i.type) {
          case `space`:
            t += this.renderer.space(i);
            break;
          case `hr`:
            t += this.renderer.hr(i);
            break;
          case `heading`:
            t += this.renderer.heading(i);
            break;
          case `code`:
            t += this.renderer.code(i);
            break;
          case `table`:
            t += this.renderer.table(i);
            break;
          case `blockquote`:
            t += this.renderer.blockquote(i);
            break;
          case `list`:
            t += this.renderer.list(i);
            break;
          case `checkbox`:
            t += this.renderer.checkbox(i);
            break;
          case `html`:
            t += this.renderer.html(i);
            break;
          case `def`:
            t += this.renderer.def(i);
            break;
          case `paragraph`:
            t += this.renderer.paragraph(i);
            break;
          case `text`:
            t += this.renderer.text(i);
            break;
          default: {
            let e = `Token with "` + i.type + `" type was not found.`;
            if (this.options.silent) return (console.error(e), ``);
            throw Error(e);
          }
        }
      }
      return t;
    }
    parseInline(e, t = this.renderer) {
      let n = ``;
      for (let r = 0; r < e.length; r++) {
        let i = e[r];
        if (this.options.extensions?.renderers?.[i.type]) {
          let e = this.options.extensions.renderers[i.type].call(
            { parser: this },
            i,
          );
          if (
            e !== !1 ||
            ![
              `escape`,
              `html`,
              `link`,
              `image`,
              `strong`,
              `em`,
              `codespan`,
              `br`,
              `del`,
              `text`,
            ].includes(i.type)
          ) {
            n += e || ``;
            continue;
          }
        }
        let a = i;
        switch (a.type) {
          case `escape`:
            n += t.text(a);
            break;
          case `html`:
            n += t.html(a);
            break;
          case `link`:
            n += t.link(a);
            break;
          case `image`:
            n += t.image(a);
            break;
          case `checkbox`:
            n += t.checkbox(a);
            break;
          case `strong`:
            n += t.strong(a);
            break;
          case `em`:
            n += t.em(a);
            break;
          case `codespan`:
            n += t.codespan(a);
            break;
          case `br`:
            n += t.br(a);
            break;
          case `del`:
            n += t.del(a);
            break;
          case `text`:
            n += t.text(a);
            break;
          default: {
            let e = `Token with "` + a.type + `" type was not found.`;
            if (this.options.silent) return (console.error(e), ``);
            throw Error(e);
          }
        }
      }
      return n;
    }
  },
  ay = class {
    options;
    block;
    constructor(e) {
      this.options = e || L_;
    }
    static passThroughHooks = new Set([
      `preprocess`,
      `postprocess`,
      `processAllTokens`,
      `emStrongMask`,
    ]);
    static passThroughHooksRespectAsync = new Set([
      `preprocess`,
      `postprocess`,
      `processAllTokens`,
    ]);
    preprocess(e) {
      return e;
    }
    postprocess(e) {
      return e;
    }
    processAllTokens(e) {
      return e;
    }
    emStrongMask(e) {
      return e;
    }
    provideLexer() {
      return this.block ? ty.lex : ty.lexInline;
    }
    provideParser() {
      return this.block ? iy.parse : iy.parseInline;
    }
  },
  oy = new (class {
    defaults = I_();
    options = this.setOptions;
    parse = this.parseMarkdown(!0);
    parseInline = this.parseMarkdown(!1);
    Parser = iy;
    Renderer = ny;
    TextRenderer = ry;
    Lexer = ty;
    Tokenizer = ey;
    Hooks = ay;
    constructor(...e) {
      this.use(...e);
    }
    walkTokens(e, t) {
      let n = [];
      for (let r of e)
        switch (((n = n.concat(t.call(this, r))), r.type)) {
          case `table`: {
            let e = r;
            for (let r of e.header) n = n.concat(this.walkTokens(r.tokens, t));
            for (let r of e.rows)
              for (let e of r) n = n.concat(this.walkTokens(e.tokens, t));
            break;
          }
          case `list`: {
            let e = r;
            n = n.concat(this.walkTokens(e.items, t));
            break;
          }
          default: {
            let e = r;
            this.defaults.extensions?.childTokens?.[e.type]
              ? this.defaults.extensions.childTokens[e.type].forEach((r) => {
                  let i = e[r].flat(1 / 0);
                  n = n.concat(this.walkTokens(i, t));
                })
              : e.tokens && (n = n.concat(this.walkTokens(e.tokens, t)));
          }
        }
      return n;
    }
    use(...e) {
      let t = this.defaults.extensions || { renderers: {}, childTokens: {} };
      return (
        e.forEach((e) => {
          let n = { ...e };
          if (
            ((n.async = this.defaults.async || n.async || !1),
            e.extensions &&
              (e.extensions.forEach((e) => {
                if (!e.name) throw Error(`extension name required`);
                if (`renderer` in e) {
                  let n = t.renderers[e.name];
                  n
                    ? (t.renderers[e.name] = function (...t) {
                        let r = e.renderer.apply(this, t);
                        return (r === !1 && (r = n.apply(this, t)), r);
                      })
                    : (t.renderers[e.name] = e.renderer);
                }
                if (`tokenizer` in e) {
                  if (!e.level || (e.level !== `block` && e.level !== `inline`))
                    throw Error(`extension level must be 'block' or 'inline'`);
                  let n = t[e.level];
                  (n ? n.unshift(e.tokenizer) : (t[e.level] = [e.tokenizer]),
                    e.start &&
                      (e.level === `block`
                        ? t.startBlock
                          ? t.startBlock.push(e.start)
                          : (t.startBlock = [e.start])
                        : e.level === `inline` &&
                          (t.startInline
                            ? t.startInline.push(e.start)
                            : (t.startInline = [e.start]))));
                }
                `childTokens` in e &&
                  e.childTokens &&
                  (t.childTokens[e.name] = e.childTokens);
              }),
              (n.extensions = t)),
            e.renderer)
          ) {
            let t = this.defaults.renderer || new ny(this.defaults);
            for (let n in e.renderer) {
              if (!(n in t)) throw Error(`renderer '${n}' does not exist`);
              if ([`options`, `parser`].includes(n)) continue;
              let r = n,
                i = e.renderer[r],
                a = t[r];
              t[r] = (...e) => {
                let n = i.apply(t, e);
                return (n === !1 && (n = a.apply(t, e)), n || ``);
              };
            }
            n.renderer = t;
          }
          if (e.tokenizer) {
            let t = this.defaults.tokenizer || new ey(this.defaults);
            for (let n in e.tokenizer) {
              if (!(n in t)) throw Error(`tokenizer '${n}' does not exist`);
              if ([`options`, `rules`, `lexer`].includes(n)) continue;
              let r = n,
                i = e.tokenizer[r],
                a = t[r];
              t[r] = (...e) => {
                let n = i.apply(t, e);
                return (n === !1 && (n = a.apply(t, e)), n);
              };
            }
            n.tokenizer = t;
          }
          if (e.hooks) {
            let t = this.defaults.hooks || new ay();
            for (let n in e.hooks) {
              if (!(n in t)) throw Error(`hook '${n}' does not exist`);
              if ([`options`, `block`].includes(n)) continue;
              let r = n,
                i = e.hooks[r],
                a = t[r];
              ay.passThroughHooks.has(n)
                ? (t[r] = (e) => {
                    if (
                      this.defaults.async &&
                      ay.passThroughHooksRespectAsync.has(n)
                    )
                      return (async () => {
                        let n = await i.call(t, e);
                        return a.call(t, n);
                      })();
                    let r = i.call(t, e);
                    return a.call(t, r);
                  })
                : (t[r] = (...e) => {
                    if (this.defaults.async)
                      return (async () => {
                        let n = await i.apply(t, e);
                        return (n === !1 && (n = await a.apply(t, e)), n);
                      })();
                    let n = i.apply(t, e);
                    return (n === !1 && (n = a.apply(t, e)), n);
                  });
            }
            n.hooks = t;
          }
          if (e.walkTokens) {
            let t = this.defaults.walkTokens,
              r = e.walkTokens;
            n.walkTokens = function (e) {
              let n = [];
              return (
                n.push(r.call(this, e)),
                t && (n = n.concat(t.call(this, e))),
                n
              );
            };
          }
          this.defaults = { ...this.defaults, ...n };
        }),
        this
      );
    }
    setOptions(e) {
      return ((this.defaults = { ...this.defaults, ...e }), this);
    }
    lexer(e, t) {
      return ty.lex(e, t ?? this.defaults);
    }
    parser(e, t) {
      return iy.parse(e, t ?? this.defaults);
    }
    parseMarkdown(e) {
      return (t, n) => {
        let r = { ...n },
          i = { ...this.defaults, ...r },
          a = this.onError(!!i.silent, !!i.async);
        if (this.defaults.async === !0 && r.async === !1)
          return a(
            Error(
              `marked(): The async option was set to true by an extension. Remove async: false from the parse options object to return a Promise.`,
            ),
          );
        if (typeof t > `u` || t === null)
          return a(Error(`marked(): input parameter is undefined or null`));
        if (typeof t != `string`)
          return a(
            Error(
              `marked(): input parameter is of type ` +
                Object.prototype.toString.call(t) +
                `, string expected`,
            ),
          );
        if ((i.hooks && ((i.hooks.options = i), (i.hooks.block = e)), i.async))
          return (async () => {
            let n = i.hooks ? await i.hooks.preprocess(t) : t,
              r = await (
                i.hooks
                  ? await i.hooks.provideLexer()
                  : e
                    ? ty.lex
                    : ty.lexInline
              )(n, i),
              a = i.hooks ? await i.hooks.processAllTokens(r) : r;
            i.walkTokens &&
              (await Promise.all(this.walkTokens(a, i.walkTokens)));
            let o = await (
              i.hooks
                ? await i.hooks.provideParser()
                : e
                  ? iy.parse
                  : iy.parseInline
            )(a, i);
            return i.hooks ? await i.hooks.postprocess(o) : o;
          })().catch(a);
        try {
          i.hooks && (t = i.hooks.preprocess(t));
          let n = (
            i.hooks ? i.hooks.provideLexer() : e ? ty.lex : ty.lexInline
          )(t, i);
          (i.hooks && (n = i.hooks.processAllTokens(n)),
            i.walkTokens && this.walkTokens(n, i.walkTokens));
          let r = (
            i.hooks ? i.hooks.provideParser() : e ? iy.parse : iy.parseInline
          )(n, i);
          return (i.hooks && (r = i.hooks.postprocess(r)), r);
        } catch (e) {
          return a(e);
        }
      };
    }
    onError(e, t) {
      return (n) => {
        if (
          ((n.message += `
Please report this to https://github.com/markedjs/marked.`),
          e)
        ) {
          let e =
            `<p>An error occurred:</p><pre>` +
            qv(n.message + ``, !0) +
            `</pre>`;
          return t ? Promise.resolve(e) : e;
        }
        if (t) return Promise.reject(n);
        throw n;
      };
    }
  })();
function X(e, t) {
  return oy.parse(e, t);
}
((X.options = X.setOptions =
  function (e) {
    return (oy.setOptions(e), (X.defaults = oy.defaults), R_(X.defaults), X);
  }),
  (X.getDefaults = I_),
  (X.defaults = L_),
  (X.use = function (...e) {
    return (oy.use(...e), (X.defaults = oy.defaults), R_(X.defaults), X);
  }),
  (X.walkTokens = function (e, t) {
    return oy.walkTokens(e, t);
  }),
  (X.parseInline = oy.parseInline),
  (X.Parser = iy),
  (X.parser = iy.parse),
  (X.Renderer = ny),
  (X.TextRenderer = ry),
  (X.Lexer = ty),
  (X.lexer = ty.lex),
  (X.Tokenizer = ey),
  (X.Hooks = ay),
  (X.parse = X),
  X.options,
  X.setOptions,
  X.use,
  X.walkTokens,
  X.parseInline,
  iy.parse,
  ty.lex);
var Z = e(r(), 1),
  Q = i(),
  sy = 300,
  cy = `300px`,
  ly = 500;
function uy(e = {}) {
  let {
      immediate: t = !1,
      debounceDelay: n = sy,
      rootMargin: r = cy,
      idleTimeout: i = ly,
    } = e,
    [a, o] = (0, Z.useState)(!1),
    s = (0, Z.useRef)(null),
    c = (0, Z.useRef)(null),
    l = (0, Z.useRef)(null),
    u = (0, Z.useMemo)(
      () => (e) => {
        let t = Date.now();
        return window.setTimeout(() => {
          e({
            didTimeout: !1,
            timeRemaining: () => Math.max(0, 50 - (Date.now() - t)),
          });
        }, 1);
      },
      [],
    ),
    d = (0, Z.useMemo)(
      () =>
        typeof window < `u` && window.requestIdleCallback
          ? (e, t) => window.requestIdleCallback(e, t)
          : u,
      [u],
    ),
    f = (0, Z.useMemo)(
      () =>
        typeof window < `u` && window.cancelIdleCallback
          ? (e) => window.cancelIdleCallback(e)
          : (e) => {
              clearTimeout(e);
            },
      [],
    );
  return (
    (0, Z.useEffect)(() => {
      if (t) {
        o(!0);
        return;
      }
      let e = s.current;
      if (!e) return;
      ((c.current &&= (clearTimeout(c.current), null)),
        (l.current &&= (f(l.current), null)));
      let a = () => {
          ((c.current &&= (clearTimeout(c.current), null)),
            (l.current &&= (f(l.current), null)));
        },
        u = (e) => {
          l.current = d(
            (t) => {
              t.timeRemaining() > 0 || t.didTimeout
                ? (o(!0), e.disconnect())
                : (l.current = d(
                    () => {
                      (o(!0), e.disconnect());
                    },
                    { timeout: i / 2 },
                  ));
            },
            { timeout: i },
          );
        },
        p = (e) => {
          (a(),
            (c.current = window.setTimeout(() => {
              var t;
              let n = e.takeRecords();
              (n.length === 0 ||
                ((t = n.at(-1)?.isIntersecting) != null && t)) &&
                u(e);
            }, n)));
        },
        m = (e, t) => {
          e.isIntersecting ? p(t) : a();
        },
        h = new IntersectionObserver(
          (e) => {
            for (let t of e) m(t, h);
          },
          { rootMargin: r, threshold: 0 },
        );
      return (
        h.observe(e),
        () => {
          (c.current && clearTimeout(c.current),
            l.current && f(l.current),
            h.disconnect());
        }
      );
    }, [t, n, r, i, f, d]),
    { shouldRender: a, containerRef: s }
  );
}
var dy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  fy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M2.75 0.5C1.7835 0.5 1 1.2835 1 2.25V9.75C1 10.7165 1.7835 11.5 2.75 11.5H3.75H4.5V10H3.75H2.75C2.61193 10 2.5 9.88807 2.5 9.75V2.25C2.5 2.11193 2.61193 2 2.75 2H8.25C8.38807 2 8.5 2.11193 8.5 2.25V3H10V2.25C10 1.2835 9.2165 0.5 8.25 0.5H2.75ZM7.75 4.5C6.7835 4.5 6 5.2835 6 6.25V13.75C6 14.7165 6.7835 15.5 7.75 15.5H13.25C14.2165 15.5 15 14.7165 15 13.75V6.25C15 5.2835 14.2165 4.5 13.25 4.5H7.75ZM7.5 6.25C7.5 6.11193 7.61193 6 7.75 6H13.25C13.3881 6 13.5 6.11193 13.5 6.25V13.75C13.5 13.8881 13.3881 14 13.25 14H7.75C7.61193 14 7.5 13.8881 7.5 13.75V6.25Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  py = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M8.75 1V1.75V8.68934L10.7197 6.71967L11.25 6.18934L12.3107 7.25L11.7803 7.78033L8.70711 10.8536C8.31658 11.2441 7.68342 11.2441 7.29289 10.8536L4.21967 7.78033L3.68934 7.25L4.75 6.18934L5.28033 6.71967L7.25 8.68934V1.75V1H8.75ZM13.5 9.25V13.5H2.5V9.25V8.5H1V9.25V14C1 14.5523 1.44771 15 2 15H14C14.5523 15 15 14.5523 15 14V9.25V8.5H13.5V9.25Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  my = (e) =>
    (0, Q.jsxs)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: [
        (0, Q.jsx)(`path`, {
          d: `M8 0V4`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M8 16V12`,
          opacity: `0.5`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M3.29773 1.52783L5.64887 4.7639`,
          opacity: `0.9`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M12.7023 1.52783L10.3511 4.7639`,
          opacity: `0.1`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M12.7023 14.472L10.3511 11.236`,
          opacity: `0.4`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M3.29773 14.472L5.64887 11.236`,
          opacity: `0.6`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M15.6085 5.52783L11.8043 6.7639`,
          opacity: `0.2`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M0.391602 10.472L4.19583 9.23598`,
          opacity: `0.7`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M15.6085 10.4722L11.8043 9.2361`,
          opacity: `0.3`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
        (0, Q.jsx)(`path`, {
          d: `M0.391602 5.52783L4.19583 6.7639`,
          opacity: `0.8`,
          stroke: `currentColor`,
          strokeWidth: `1.5`,
        }),
      ],
    }),
  hy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M1 5.25V6H2.5V5.25V2.5H5.25H6V1H5.25H2C1.44772 1 1 1.44772 1 2V5.25ZM5.25 14.9994H6V13.4994H5.25H2.5V10.7494V9.99939H1V10.7494V13.9994C1 14.5517 1.44772 14.9994 2 14.9994H5.25ZM15 10V10.75V14C15 14.5523 14.5523 15 14 15H10.75H10V13.5H10.75H13.5V10.75V10H15ZM10.75 1H10V2.5H10.75H13.5V5.25V6H15V5.25V2C15 1.44772 14.5523 1 14 1H10.75Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  gy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M13.5 8C13.5 4.96643 11.0257 2.5 7.96452 2.5C5.42843 2.5 3.29365 4.19393 2.63724 6.5H5.25H6V8H5.25H0.75C0.335787 8 0 7.66421 0 7.25V2.75V2H1.5V2.75V5.23347C2.57851 2.74164 5.06835 1 7.96452 1C11.8461 1 15 4.13001 15 8C15 11.87 11.8461 15 7.96452 15C5.62368 15 3.54872 13.8617 2.27046 12.1122L1.828 11.5066L3.03915 10.6217L3.48161 11.2273C4.48831 12.6051 6.12055 13.5 7.96452 13.5C11.0257 13.5 13.5 11.0336 13.5 8Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  _y = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  vy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M13.5 10.25V13.25C13.5 13.3881 13.3881 13.5 13.25 13.5H2.75C2.61193 13.5 2.5 13.3881 2.5 13.25L2.5 2.75C2.5 2.61193 2.61193 2.5 2.75 2.5H5.75H6.5V1H5.75H2.75C1.7835 1 1 1.7835 1 2.75V13.25C1 14.2165 1.7835 15 2.75 15H13.25C14.2165 15 15 14.2165 15 13.25V10.25V9.5H13.5V10.25ZM9 1H9.75H14.2495C14.6637 1 14.9995 1.33579 14.9995 1.75V6.25V7H13.4995V6.25V3.56066L8.53033 8.52978L8 9.06011L6.93934 7.99945L7.46967 7.46912L12.4388 2.5H9.75H9V1Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  yy = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M1.5 6.5C1.5 3.73858 3.73858 1.5 6.5 1.5C9.26142 1.5 11.5 3.73858 11.5 6.5C11.5 9.26142 9.26142 11.5 6.5 11.5C3.73858 11.5 1.5 9.26142 1.5 6.5ZM6.5 0C2.91015 0 0 2.91015 0 6.5C0 10.0899 2.91015 13 6.5 13C8.02469 13 9.42677 12.475 10.5353 11.596L13.9697 15.0303L14.5 15.5607L15.5607 14.5L15.0303 13.9697L11.596 10.5353C12.475 9.42677 13 8.02469 13 6.5C13 2.91015 10.0899 0 6.5 0ZM4.125 5.875H4.75H5.875V4.75V4.125H7.125V4.75V5.875H8.25H8.875V7.125H8.25H7.125V8.25V8.875H5.875V8.25V7.125H4.75H4.125V5.875Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  by = (e) =>
    (0, Q.jsx)(`svg`, {
      color: `currentColor`,
      height: 16,
      strokeLinejoin: `round`,
      viewBox: `0 0 16 16`,
      width: 16,
      ...e,
      children: (0, Q.jsx)(`path`, {
        clipRule: `evenodd`,
        d: `M15.5607 3.99999L15.0303 4.53032L6.23744 13.3232C5.55403 14.0066 4.44599 14.0066 3.76257 13.3232L4.2929 12.7929L3.76257 13.3232L0.969676 10.5303L0.439346 9.99999L1.50001 8.93933L2.03034 9.46966L4.82323 12.2626C4.92086 12.3602 5.07915 12.3602 5.17678 12.2626L13.9697 3.46966L14.5 2.93933L15.5607 3.99999Z`,
        fill: `currentColor`,
        fillRule: `evenodd`,
      }),
    }),
  $ = (...e) => Pm(s(e)),
  xy = (e, t, n) => {
    let r = typeof t == `string` ? new Blob([t], { type: n }) : t,
      i = URL.createObjectURL(r),
      a = document.createElement(`a`);
    ((a.href = i),
      (a.download = e),
      document.body.appendChild(a),
      a.click(),
      document.body.removeChild(a),
      URL.revokeObjectURL(i));
  },
  Sy = (0, Z.createContext)({ code: `` }),
  Cy = () => (0, Z.useContext)(Sy),
  wy = ({
    onCopy: e,
    onError: t,
    timeout: n = 2e3,
    children: r,
    className: i,
    code: a,
    ...o
  }) => {
    let [s, c] = (0, Z.useState)(!1),
      l = (0, Z.useRef)(0),
      { code: u } = Cy(),
      { isAnimating: d } = (0, Z.useContext)(Qb),
      f = a ?? u,
      p = async () => {
        var r;
        if (
          typeof window > `u` ||
          !(
            (r = navigator == null ? void 0 : navigator.clipboard) != null &&
            r.writeText
          )
        ) {
          t?.(Error(`Clipboard API not available`));
          return;
        }
        try {
          s ||
            (await navigator.clipboard.writeText(f),
            c(!0),
            e?.(),
            (l.current = window.setTimeout(() => c(!1), n)));
        } catch (e) {
          t?.(e);
        }
      };
    (0, Z.useEffect)(
      () => () => {
        window.clearTimeout(l.current);
      },
      [],
    );
    let m = s ? dy : fy;
    return (0, Q.jsx)(`button`, {
      className: $(
        `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
        i,
      ),
      "data-streamdown": `code-block-copy-button`,
      disabled: d,
      onClick: p,
      title: `Copy Code`,
      type: `button`,
      ...o,
      children: r ?? (0, Q.jsx)(m, { size: 14 }),
    });
  },
  Ty = {
    "1c": `1c`,
    "1c-query": `1cq`,
    abap: `abap`,
    "actionscript-3": `as`,
    ada: `ada`,
    adoc: `adoc`,
    "angular-html": `html`,
    "angular-ts": `ts`,
    apache: `conf`,
    apex: `cls`,
    apl: `apl`,
    applescript: `applescript`,
    ara: `ara`,
    asciidoc: `adoc`,
    asm: `asm`,
    astro: `astro`,
    awk: `awk`,
    ballerina: `bal`,
    bash: `sh`,
    bat: `bat`,
    batch: `bat`,
    be: `be`,
    beancount: `beancount`,
    berry: `berry`,
    bibtex: `bib`,
    bicep: `bicep`,
    blade: `blade.php`,
    bsl: `bsl`,
    c: `c`,
    "c#": `cs`,
    "c++": `cpp`,
    cadence: `cdc`,
    cairo: `cairo`,
    cdc: `cdc`,
    clarity: `clar`,
    clj: `clj`,
    clojure: `clj`,
    "closure-templates": `soy`,
    cmake: `cmake`,
    cmd: `cmd`,
    cobol: `cob`,
    codeowners: `CODEOWNERS`,
    codeql: `ql`,
    coffee: `coffee`,
    coffeescript: `coffee`,
    "common-lisp": `lisp`,
    console: `sh`,
    coq: `v`,
    cpp: `cpp`,
    cql: `cql`,
    crystal: `cr`,
    cs: `cs`,
    csharp: `cs`,
    css: `css`,
    csv: `csv`,
    cue: `cue`,
    cypher: `cql`,
    d: `d`,
    dart: `dart`,
    dax: `dax`,
    desktop: `desktop`,
    diff: `diff`,
    docker: `dockerfile`,
    dockerfile: `dockerfile`,
    dotenv: `env`,
    "dream-maker": `dm`,
    edge: `edge`,
    elisp: `el`,
    elixir: `ex`,
    elm: `elm`,
    "emacs-lisp": `el`,
    erb: `erb`,
    erl: `erl`,
    erlang: `erl`,
    f: `f`,
    "f#": `fs`,
    f03: `f03`,
    f08: `f08`,
    f18: `f18`,
    f77: `f77`,
    f90: `f90`,
    f95: `f95`,
    fennel: `fnl`,
    fish: `fish`,
    fluent: `ftl`,
    for: `for`,
    "fortran-fixed-form": `f`,
    "fortran-free-form": `f90`,
    fs: `fs`,
    fsharp: `fs`,
    fsl: `fsl`,
    ftl: `ftl`,
    gdresource: `tres`,
    gdscript: `gd`,
    gdshader: `gdshader`,
    genie: `gs`,
    gherkin: `feature`,
    "git-commit": `gitcommit`,
    "git-rebase": `gitrebase`,
    gjs: `js`,
    gleam: `gleam`,
    "glimmer-js": `js`,
    "glimmer-ts": `ts`,
    glsl: `glsl`,
    gnuplot: `plt`,
    go: `go`,
    gql: `gql`,
    graphql: `graphql`,
    groovy: `groovy`,
    gts: `gts`,
    hack: `hack`,
    haml: `haml`,
    handlebars: `hbs`,
    haskell: `hs`,
    haxe: `hx`,
    hbs: `hbs`,
    hcl: `hcl`,
    hjson: `hjson`,
    hlsl: `hlsl`,
    hs: `hs`,
    html: `html`,
    "html-derivative": `html`,
    http: `http`,
    hxml: `hxml`,
    hy: `hy`,
    imba: `imba`,
    ini: `ini`,
    jade: `jade`,
    java: `java`,
    javascript: `js`,
    jinja: `jinja`,
    jison: `jison`,
    jl: `jl`,
    js: `js`,
    json: `json`,
    json5: `json5`,
    jsonc: `jsonc`,
    jsonl: `jsonl`,
    jsonnet: `jsonnet`,
    jssm: `jssm`,
    jsx: `jsx`,
    julia: `jl`,
    kotlin: `kt`,
    kql: `kql`,
    kt: `kt`,
    kts: `kts`,
    kusto: `kql`,
    latex: `tex`,
    lean: `lean`,
    lean4: `lean`,
    less: `less`,
    liquid: `liquid`,
    lisp: `lisp`,
    lit: `lit`,
    llvm: `ll`,
    log: `log`,
    logo: `logo`,
    lua: `lua`,
    luau: `luau`,
    make: `mak`,
    makefile: `mak`,
    markdown: `md`,
    marko: `marko`,
    matlab: `m`,
    md: `md`,
    mdc: `mdc`,
    mdx: `mdx`,
    mediawiki: `wiki`,
    mermaid: `mmd`,
    mips: `s`,
    mipsasm: `s`,
    mmd: `mmd`,
    mojo: `mojo`,
    move: `move`,
    nar: `nar`,
    narrat: `narrat`,
    nextflow: `nf`,
    nf: `nf`,
    nginx: `conf`,
    nim: `nim`,
    nix: `nix`,
    nu: `nu`,
    nushell: `nu`,
    objc: `m`,
    "objective-c": `m`,
    "objective-cpp": `mm`,
    ocaml: `ml`,
    pascal: `pas`,
    perl: `pl`,
    perl6: `p6`,
    php: `php`,
    plsql: `pls`,
    po: `po`,
    polar: `polar`,
    postcss: `pcss`,
    pot: `pot`,
    potx: `potx`,
    powerquery: `pq`,
    powershell: `ps1`,
    prisma: `prisma`,
    prolog: `pl`,
    properties: `properties`,
    proto: `proto`,
    protobuf: `proto`,
    ps: `ps`,
    ps1: `ps1`,
    pug: `pug`,
    puppet: `pp`,
    purescript: `purs`,
    py: `py`,
    python: `py`,
    ql: `ql`,
    qml: `qml`,
    qmldir: `qmldir`,
    qss: `qss`,
    r: `r`,
    racket: `rkt`,
    raku: `raku`,
    razor: `cshtml`,
    rb: `rb`,
    reg: `reg`,
    regex: `regex`,
    regexp: `regexp`,
    rel: `rel`,
    riscv: `s`,
    rs: `rs`,
    rst: `rst`,
    ruby: `rb`,
    rust: `rs`,
    sas: `sas`,
    sass: `sass`,
    scala: `scala`,
    scheme: `scm`,
    scss: `scss`,
    sdbl: `sdbl`,
    sh: `sh`,
    shader: `shader`,
    shaderlab: `shader`,
    shell: `sh`,
    shellscript: `sh`,
    shellsession: `sh`,
    smalltalk: `st`,
    solidity: `sol`,
    soy: `soy`,
    sparql: `rq`,
    spl: `spl`,
    splunk: `spl`,
    sql: `sql`,
    "ssh-config": `config`,
    stata: `do`,
    styl: `styl`,
    stylus: `styl`,
    svelte: `svelte`,
    swift: `swift`,
    "system-verilog": `sv`,
    systemd: `service`,
    talon: `talon`,
    talonscript: `talon`,
    tasl: `tasl`,
    tcl: `tcl`,
    templ: `templ`,
    terraform: `tf`,
    tex: `tex`,
    tf: `tf`,
    tfvars: `tfvars`,
    toml: `toml`,
    ts: `ts`,
    "ts-tags": `ts`,
    tsp: `tsp`,
    tsv: `tsv`,
    tsx: `tsx`,
    turtle: `ttl`,
    twig: `twig`,
    typ: `typ`,
    typescript: `ts`,
    typespec: `tsp`,
    typst: `typ`,
    v: `v`,
    vala: `vala`,
    vb: `vb`,
    verilog: `v`,
    vhdl: `vhdl`,
    vim: `vim`,
    viml: `vim`,
    vimscript: `vim`,
    vue: `vue`,
    "vue-html": `html`,
    "vue-vine": `vine`,
    vy: `vy`,
    vyper: `vy`,
    wasm: `wasm`,
    wenyan: `wy`,
    wgsl: `wgsl`,
    wiki: `wiki`,
    wikitext: `wiki`,
    wit: `wit`,
    wl: `wl`,
    wolfram: `wl`,
    xml: `xml`,
    xsl: `xsl`,
    yaml: `yaml`,
    yml: `yml`,
    zenscript: `zs`,
    zig: `zig`,
    zsh: `zsh`,
    文言: `wy`,
  },
  Ey = ({
    onDownload: e,
    onError: t,
    language: n,
    children: r,
    className: i,
    code: a,
    ...o
  }) => {
    let { code: s } = Cy(),
      { isAnimating: c } = (0, Z.useContext)(Qb),
      l = a ?? s,
      u = `file.${n && n in Ty ? Ty[n] : `txt`}`,
      d = () => {
        try {
          (xy(u, l, `text/plain`), e?.());
        } catch (e) {
          t?.(e);
        }
      };
    return (0, Q.jsx)(`button`, {
      className: $(
        `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
        i,
      ),
      "data-streamdown": `code-block-download-button`,
      disabled: c,
      onClick: d,
      title: `Download file`,
      type: `button`,
      ...o,
      children: r ?? (0, Q.jsx)(py, { size: 14 }),
    });
  },
  Dy = () =>
    (0, Q.jsxs)(`div`, {
      className: `w-full divide-y divide-border overflow-hidden rounded-xl border border-border`,
      children: [
        (0, Q.jsx)(`div`, { className: `h-[46px] w-full bg-muted/80` }),
        (0, Q.jsx)(`div`, {
          className: `flex w-full items-center justify-center p-4`,
          children: (0, Q.jsx)(my, { className: `size-4 animate-spin` }),
        }),
      ],
    }),
  Oy = /\.[^/.]+$/,
  ky = ({ node: e, className: t, src: n, alt: r, ...i }) => {
    let a = async () => {
      if (n)
        try {
          let e = await (await fetch(n)).blob(),
            t =
              new URL(n, window.location.origin).pathname.split(`/`).pop() ||
              ``,
            i = t.split(`.`).pop(),
            a = t.includes(`.`) && i !== void 0 && i.length <= 4,
            o = ``;
          if (a) o = t;
          else {
            let n = e.type,
              i = `png`;
            (n.includes(`jpeg`) || n.includes(`jpg`)
              ? (i = `jpg`)
              : n.includes(`png`)
                ? (i = `png`)
                : n.includes(`svg`)
                  ? (i = `svg`)
                  : n.includes(`gif`)
                    ? (i = `gif`)
                    : n.includes(`webp`) && (i = `webp`),
              (o = `${(r || t || `image`).replace(Oy, ``)}.${i}`));
          }
          xy(o, e, e.type);
        } catch {
          window.open(n, `_blank`);
        }
    };
    return n
      ? (0, Q.jsxs)(`div`, {
          className: `group relative my-4 inline-block`,
          "data-streamdown": `image-wrapper`,
          children: [
            (0, Q.jsx)(`img`, {
              alt: r,
              className: $(`max-w-full rounded-lg`, t),
              "data-streamdown": `image`,
              src: n,
              ...i,
            }),
            (0, Q.jsx)(`div`, {
              className: `pointer-events-none absolute inset-0 hidden rounded-lg bg-black/10 group-hover:block`,
            }),
            (0, Q.jsx)(`button`, {
              className: $(
                `absolute right-2 bottom-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-border bg-background/90 shadow-sm backdrop-blur-sm transition-all duration-200 hover:bg-background`,
                `opacity-0 group-hover:opacity-100`,
              ),
              onClick: a,
              title: `Download image`,
              type: `button`,
              children: (0, Q.jsx)(py, { size: 14 }),
            }),
          ],
        })
      : null;
  },
  Ay = 0,
  jy = () => {
    ((Ay += 1), Ay === 1 && (document.body.style.overflow = `hidden`));
  },
  My = () => {
    ((Ay = Math.max(0, Ay - 1)),
      Ay === 0 && (document.body.style.overflow = ``));
  },
  Ny = ({ url: e, isOpen: t, onClose: n, onConfirm: r }) => {
    let [i, a] = (0, Z.useState)(!1),
      o = (0, Z.useCallback)(async () => {
        try {
          (await navigator.clipboard.writeText(e),
            a(!0),
            setTimeout(() => a(!1), 2e3));
        } catch {}
      }, [e]),
      s = (0, Z.useCallback)(() => {
        (r(), n());
      }, [r, n]);
    return (
      (0, Z.useEffect)(() => {
        if (t) {
          jy();
          let e = (e) => {
            e.key === `Escape` && n();
          };
          return (
            document.addEventListener(`keydown`, e),
            () => {
              (document.removeEventListener(`keydown`, e), My());
            }
          );
        }
      }, [t, n]),
      t
        ? (0, Q.jsx)(`div`, {
            className: `fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm`,
            "data-streamdown": `link-safety-modal`,
            onClick: n,
            onKeyDown: (e) => {
              e.key === `Escape` && n();
            },
            role: `button`,
            tabIndex: 0,
            children: (0, Q.jsxs)(`div`, {
              className: `relative mx-4 flex w-full max-w-md flex-col gap-4 rounded-xl border bg-background p-6 shadow-lg`,
              onClick: (e) => e.stopPropagation(),
              onKeyDown: (e) => e.stopPropagation(),
              role: `presentation`,
              children: [
                (0, Q.jsx)(`button`, {
                  className: `absolute top-4 right-4 rounded-md p-1 text-muted-foreground transition-all hover:bg-muted hover:text-foreground`,
                  onClick: n,
                  title: `Close`,
                  type: `button`,
                  children: (0, Q.jsx)(_y, { size: 16 }),
                }),
                (0, Q.jsxs)(`div`, {
                  className: `flex flex-col gap-2`,
                  children: [
                    (0, Q.jsxs)(`div`, {
                      className: `flex items-center gap-2 font-semibold text-lg`,
                      children: [
                        (0, Q.jsx)(vy, { size: 20 }),
                        (0, Q.jsx)(`span`, { children: `Open external link?` }),
                      ],
                    }),
                    (0, Q.jsx)(`p`, {
                      className: `text-muted-foreground text-sm`,
                      children: `You're about to visit an external website.`,
                    }),
                  ],
                }),
                (0, Q.jsx)(`div`, {
                  className: $(
                    `break-all rounded-md bg-muted p-3 font-mono text-sm`,
                    e.length > 100 && `max-h-32 overflow-y-auto`,
                  ),
                  children: e,
                }),
                (0, Q.jsxs)(`div`, {
                  className: `flex gap-2`,
                  children: [
                    (0, Q.jsx)(`button`, {
                      className: `flex flex-1 items-center justify-center gap-2 rounded-md border bg-background px-4 py-2 font-medium text-sm transition-all hover:bg-muted`,
                      onClick: o,
                      type: `button`,
                      children: i
                        ? (0, Q.jsxs)(Q.Fragment, {
                            children: [
                              (0, Q.jsx)(dy, { size: 14 }),
                              (0, Q.jsx)(`span`, { children: `Copied` }),
                            ],
                          })
                        : (0, Q.jsxs)(Q.Fragment, {
                            children: [
                              (0, Q.jsx)(fy, { size: 14 }),
                              (0, Q.jsx)(`span`, { children: `Copy link` }),
                            ],
                          }),
                    }),
                    (0, Q.jsxs)(`button`, {
                      className: `flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground text-sm transition-all hover:bg-primary/90`,
                      onClick: s,
                      type: `button`,
                      children: [
                        (0, Q.jsx)(vy, { size: 14 }),
                        (0, Q.jsx)(`span`, { children: `Open link` }),
                      ],
                    }),
                  ],
                }),
              ],
            }),
          })
        : null
    );
  },
  Py = (0, Z.createContext)(null),
  Fy = () => (0, Z.useContext)(Py),
  Iy = () => Fy()?.code ?? null,
  Ly = () => Fy()?.mermaid ?? null,
  Ry = (e, t) =>
    new Promise((t, n) => {
      let r =
          `data:image/svg+xml;base64,` + btoa(unescape(encodeURIComponent(e))),
        i = new Image();
      ((i.crossOrigin = `anonymous`),
        (i.onload = () => {
          let e = document.createElement(`canvas`),
            r = i.width * 5,
            a = i.height * 5;
          ((e.width = r), (e.height = a));
          let o = e.getContext(`2d`);
          if (!o) {
            n(Error(`Failed to create 2D canvas context for PNG export`));
            return;
          }
          (o.drawImage(i, 0, 0, r, a),
            e.toBlob((e) => {
              if (!e) {
                n(Error(`Failed to create PNG blob`));
                return;
              }
              t(e);
            }, `image/png`));
        }),
        (i.onerror = () => n(Error(`Failed to load SVG image`))),
        (i.src = r));
    }),
  zy = ({
    chart: e,
    children: t,
    className: n,
    onDownload: r,
    config: i,
    onError: a,
  }) => {
    let [o, s] = (0, Z.useState)(!1),
      c = (0, Z.useRef)(null),
      { isAnimating: l } = (0, Z.useContext)(Qb),
      u = Ly(),
      d = async (t) => {
        try {
          if (t === `mmd`) {
            (xy(`diagram.mmd`, e, `text/plain`), s(!1), r?.(t));
            return;
          }
          if (!u) {
            a?.(Error(`Mermaid plugin not available`));
            return;
          }
          let n = u.getMermaid(i),
            o = e
              .split(``)
              .reduce((e, t) => ((e << 5) - e + t.charCodeAt(0)) | 0, 0),
            c = `mermaid-${Math.abs(o)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            { svg: l } = await n.render(c, e);
          if (!l) {
            a?.(Error(`SVG not found. Please wait for the diagram to render.`));
            return;
          }
          if (t === `svg`) {
            (xy(`diagram.svg`, l, `image/svg+xml`), s(!1), r?.(t));
            return;
          }
          if (t === `png`) {
            (xy(`diagram.png`, await Ry(l), `image/png`), r?.(t), s(!1));
            return;
          }
        } catch (e) {
          a?.(e);
        }
      };
    return (
      (0, Z.useEffect)(() => {
        let e = (e) => {
          let t = e.composedPath();
          c.current && !t.includes(c.current) && s(!1);
        };
        return (
          document.addEventListener(`mousedown`, e),
          () => {
            document.removeEventListener(`mousedown`, e);
          }
        );
      }, []),
      (0, Q.jsxs)(`div`, {
        className: `relative`,
        ref: c,
        children: [
          (0, Q.jsx)(`button`, {
            className: $(
              `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
              n,
            ),
            disabled: l,
            onClick: () => s(!o),
            title: `Download diagram`,
            type: `button`,
            children: t ?? (0, Q.jsx)(py, { size: 14 }),
          }),
          o
            ? (0, Q.jsxs)(`div`, {
                className: `absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg`,
                children: [
                  (0, Q.jsx)(`button`, {
                    className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                    onClick: () => d(`svg`),
                    title: `Download diagram as SVG`,
                    type: `button`,
                    children: `SVG`,
                  }),
                  (0, Q.jsx)(`button`, {
                    className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                    onClick: () => d(`png`),
                    title: `Download diagram as PNG`,
                    type: `button`,
                    children: `PNG`,
                  }),
                  (0, Q.jsx)(`button`, {
                    className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                    onClick: () => d(`mmd`),
                    title: `Download diagram as MMD`,
                    type: `button`,
                    children: `MMD`,
                  }),
                ],
              })
            : null,
        ],
      })
    );
  },
  By = 0,
  Vy = () => {
    ((By += 1), By === 1 && (document.body.style.overflow = `hidden`));
  },
  Hy = () => {
    ((By = Math.max(0, By - 1)),
      By === 0 && (document.body.style.overflow = ``));
  },
  Uy = ({
    chart: e,
    config: t,
    onFullscreen: n,
    onExit: r,
    className: i,
    ...a
  }) => {
    let [o, s] = (0, Z.useState)(!1),
      { isAnimating: c, controls: l } = (0, Z.useContext)(Qb),
      u = (() => {
        if (typeof l == `boolean`) return l;
        let e = l.mermaid;
        return e === !1 ? !1 : e === !0 || e === void 0 ? !0 : e.panZoom !== !1;
      })(),
      d = () => {
        s(!o);
      };
    return (
      (0, Z.useEffect)(() => {
        if (o) {
          Vy();
          let e = (e) => {
            e.key === `Escape` && s(!1);
          };
          return (
            document.addEventListener(`keydown`, e),
            () => {
              (document.removeEventListener(`keydown`, e), Hy());
            }
          );
        }
      }, [o]),
      (0, Z.useEffect)(() => {
        o ? n?.() : r && r();
      }, [o, n, r]),
      (0, Q.jsxs)(Q.Fragment, {
        children: [
          (0, Q.jsx)(`button`, {
            className: $(
              `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
              i,
            ),
            disabled: c,
            onClick: d,
            title: `View fullscreen`,
            type: `button`,
            ...a,
            children: (0, Q.jsx)(hy, { size: 14 }),
          }),
          o
            ? (0, Q.jsxs)(`div`, {
                className: `fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm`,
                onClick: d,
                onKeyDown: (e) => {
                  e.key === `Escape` && d();
                },
                role: `button`,
                tabIndex: 0,
                children: [
                  (0, Q.jsx)(`button`, {
                    className: `absolute top-4 right-4 z-10 rounded-md p-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground`,
                    onClick: d,
                    title: `Exit fullscreen`,
                    type: `button`,
                    children: (0, Q.jsx)(_y, { size: 20 }),
                  }),
                  (0, Q.jsx)(`div`, {
                    className: `flex size-full items-center justify-center p-4`,
                    onClick: (e) => e.stopPropagation(),
                    onKeyDown: (e) => e.stopPropagation(),
                    role: `presentation`,
                    children: (0, Q.jsx)(rx, {
                      chart: e,
                      className: `size-full [&_svg]:h-auto [&_svg]:w-auto`,
                      config: t,
                      fullscreen: !0,
                      showControls: u,
                    }),
                  }),
                ],
              })
            : null,
        ],
      })
    );
  },
  Wy = (e) => {
    let t = [],
      n = [],
      r = e.querySelectorAll(`thead th`);
    for (let e of r) t.push(e.textContent?.trim() || ``);
    let i = e.querySelectorAll(`tbody tr`);
    for (let e of i) {
      let t = [],
        r = e.querySelectorAll(`td`);
      for (let e of r) t.push(e.textContent?.trim() || ``);
      n.push(t);
    }
    return { headers: t, rows: n };
  },
  Gy = (e) => {
    let { headers: t, rows: n } = e,
      r = (e) => {
        let t = !1,
          n = !1;
        for (let r of e) {
          if (r === `"`) {
            ((t = !0), (n = !0));
            break;
          }
          (r === `,` ||
            r ===
              `
`) &&
            (t = !0);
        }
        return t ? (n ? `"${e.replace(/"/g, `""`)}"` : `"${e}"`) : e;
      },
      i = t.length > 0 ? n.length + 1 : n.length,
      a = Array(i),
      o = 0;
    t.length > 0 && ((a[o] = t.map(r).join(`,`)), (o += 1));
    for (let e of n) ((a[o] = e.map(r).join(`,`)), (o += 1));
    return a.join(`
`);
  },
  Ky = (e) => {
    let { headers: t, rows: n } = e,
      r = (e) => {
        let t = !1;
        for (let n of e)
          if (
            n === `	` ||
            n ===
              `
` ||
            n === `\r`
          ) {
            t = !0;
            break;
          }
        if (!t) return e;
        let n = [];
        for (let t of e)
          t === `	`
            ? n.push(`\\t`)
            : t ===
                `
`
              ? n.push(`\\n`)
              : t === `\r`
                ? n.push(`\\r`)
                : n.push(t);
        return n.join(``);
      },
      i = t.length > 0 ? n.length + 1 : n.length,
      a = Array(i),
      o = 0;
    t.length > 0 && ((a[o] = t.map(r).join(`	`)), (o += 1));
    for (let e of n) ((a[o] = e.map(r).join(`	`)), (o += 1));
    return a.join(`
`);
  },
  qy = (e) => {
    let t = !1;
    for (let n of e)
      if (n === `\\` || n === `|`) {
        t = !0;
        break;
      }
    if (!t) return e;
    let n = [];
    for (let t of e)
      t === `\\` ? n.push(`\\\\`) : t === `|` ? n.push(`\\|`) : n.push(t);
    return n.join(``);
  },
  Jy = (e) => {
    let { headers: t, rows: n } = e;
    if (t.length === 0) return ``;
    let r = Array(n.length + 2),
      i = 0;
    ((r[i] = `| ${t.map((e) => qy(e)).join(` | `)} |`), (i += 1));
    let a = Array(t.length);
    for (let e = 0; e < t.length; e += 1) a[e] = `---`;
    ((r[i] = `| ${a.join(` | `)} |`), (i += 1));
    for (let e of n)
      if (e.length < t.length) {
        let n = Array(t.length);
        for (let r = 0; r < t.length; r += 1)
          n[r] = r < e.length ? qy(e[r]) : ``;
        ((r[i] = `| ${n.join(` | `)} |`), (i += 1));
      } else ((r[i] = `| ${e.map((e) => qy(e)).join(` | `)} |`), (i += 1));
    return r.join(`
`);
  },
  Yy = ({
    children: e,
    className: t,
    onCopy: n,
    onError: r,
    timeout: i = 2e3,
  }) => {
    let [a, o] = (0, Z.useState)(!1),
      [s, c] = (0, Z.useState)(!1),
      l = (0, Z.useRef)(null),
      u = (0, Z.useRef)(0),
      { isAnimating: d } = (0, Z.useContext)(Qb),
      f = async (e) => {
        var t;
        if (
          typeof window > `u` ||
          !(
            (t = navigator == null ? void 0 : navigator.clipboard) != null &&
            t.write
          )
        ) {
          r?.(Error(`Clipboard API not available`));
          return;
        }
        try {
          let t = l.current
            ?.closest(`[data-streamdown="table-wrapper"]`)
            ?.querySelector(`table`);
          if (!t) {
            r?.(Error(`Table not found`));
            return;
          }
          let a = Wy(t),
            s = e === `csv` ? Gy(a) : Ky(a),
            d = new ClipboardItem({
              "text/plain": new Blob([s], { type: `text/plain` }),
              "text/html": new Blob([t.outerHTML], { type: `text/html` }),
            });
          (await navigator.clipboard.write([d]),
            c(!0),
            o(!1),
            n?.(e),
            (u.current = window.setTimeout(() => c(!1), i)));
        } catch (e) {
          r?.(e);
        }
      };
    (0, Z.useEffect)(() => {
      let e = (e) => {
        let t = e.composedPath();
        l.current && !t.includes(l.current) && o(!1);
      };
      return (
        document.addEventListener(`mousedown`, e),
        () => {
          (document.removeEventListener(`mousedown`, e),
            window.clearTimeout(u.current));
        }
      );
    }, []);
    let p = s ? dy : fy;
    return (0, Q.jsxs)(`div`, {
      className: `relative`,
      ref: l,
      children: [
        (0, Q.jsx)(`button`, {
          className: $(
            `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
            t,
          ),
          disabled: d,
          onClick: () => o(!a),
          title: `Copy table`,
          type: `button`,
          children: e ?? (0, Q.jsx)(p, { size: 14 }),
        }),
        a
          ? (0, Q.jsxs)(`div`, {
              className: `absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg`,
              children: [
                (0, Q.jsx)(`button`, {
                  className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                  onClick: () => f(`csv`),
                  title: `Copy table as CSV`,
                  type: `button`,
                  children: `CSV`,
                }),
                (0, Q.jsx)(`button`, {
                  className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                  onClick: () => f(`tsv`),
                  title: `Copy table as TSV`,
                  type: `button`,
                  children: `TSV`,
                }),
              ],
            })
          : null,
      ],
    });
  },
  Xy = ({ children: e, className: t, onDownload: n, onError: r }) => {
    let [i, a] = (0, Z.useState)(!1),
      o = (0, Z.useRef)(null),
      { isAnimating: s } = (0, Z.useContext)(Qb),
      c = (e) => {
        try {
          let t = o.current
            ?.closest(`[data-streamdown="table-wrapper"]`)
            ?.querySelector(`table`);
          if (!t) {
            r?.(Error(`Table not found`));
            return;
          }
          let i = Wy(t),
            s = e === `csv` ? Gy(i) : Jy(i);
          (xy(
            `table.${e === `csv` ? `csv` : `md`}`,
            s,
            e === `csv` ? `text/csv` : `text/markdown`,
          ),
            a(!1),
            n?.(e));
        } catch (e) {
          r?.(e);
        }
      };
    return (
      (0, Z.useEffect)(() => {
        let e = (e) => {
          let t = e.composedPath();
          o.current && !t.includes(o.current) && a(!1);
        };
        return (
          document.addEventListener(`mousedown`, e),
          () => {
            document.removeEventListener(`mousedown`, e);
          }
        );
      }, []),
      (0, Q.jsxs)(`div`, {
        className: `relative`,
        ref: o,
        children: [
          (0, Q.jsx)(`button`, {
            className: $(
              `cursor-pointer p-1 text-muted-foreground transition-all hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
              t,
            ),
            disabled: s,
            onClick: () => a(!i),
            title: `Download table`,
            type: `button`,
            children: e ?? (0, Q.jsx)(py, { size: 14 }),
          }),
          i
            ? (0, Q.jsxs)(`div`, {
                className: `absolute top-full right-0 z-10 mt-1 min-w-[120px] overflow-hidden rounded-md border border-border bg-background shadow-lg`,
                children: [
                  (0, Q.jsx)(`button`, {
                    className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                    onClick: () => c(`csv`),
                    title: `Download table as CSV`,
                    type: `button`,
                    children: `CSV`,
                  }),
                  (0, Q.jsx)(`button`, {
                    className: `w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted/40`,
                    onClick: () => c(`markdown`),
                    title: `Download table as Markdown`,
                    type: `button`,
                    children: `Markdown`,
                  }),
                ],
              })
            : null,
        ],
      })
    );
  },
  Zy = ({ children: e, className: t, showControls: n, ...r }) =>
    (0, Q.jsxs)(`div`, {
      className: `my-4 flex flex-col space-y-2`,
      "data-streamdown": `table-wrapper`,
      children: [
        n
          ? (0, Q.jsxs)(`div`, {
              className: `flex items-center justify-end gap-1`,
              children: [(0, Q.jsx)(Yy, {}), (0, Q.jsx)(Xy, {})],
            })
          : null,
        (0, Q.jsx)(`div`, {
          className: `overflow-x-auto`,
          children: (0, Q.jsx)(`table`, {
            className: $(`w-full border-collapse border border-border`, t),
            "data-streamdown": `table`,
            ...r,
            children: e,
          }),
        }),
      ],
    }),
  Qy = (0, Z.lazy)(() =>
    a(
      () =>
        import(`./code-block-37QAKDTI-DWcemtTa.js`).then((e) => ({
          default: e.CodeBlock,
        })),
      __vite__mapDeps([0, 1, 2]),
    ),
  ),
  $y = (0, Z.lazy)(() =>
    a(
      () =>
        import(`./mermaid-4DMBBIKO-90tKZYRm.js`).then((e) => ({
          default: e.Mermaid,
        })),
      [],
    ),
  ),
  eb = /language-([^\s]+)/;
function tb(e, t) {
  if (!((e != null && e.position) || (t != null && t.position))) return !0;
  if (!(e != null && e.position && t != null && t.position)) return !1;
  let n = e.position.start,
    r = t.position.start,
    i = e.position.end,
    a = t.position.end;
  return (
    n?.line === r?.line &&
    n?.column === r?.column &&
    i?.line === a?.line &&
    i?.column === a?.column
  );
}
function nb(e, t) {
  return e.className === t.className && tb(e.node, t.node);
}
var rb = (e, t) => (typeof e == `boolean` ? e : e[t] !== !1),
  ib = (e, t) => {
    if (typeof e == `boolean`) return e;
    let n = e.mermaid;
    return n === !1 ? !1 : n === !0 || n === void 0 ? !0 : n[t] !== !1;
  },
  ab = (0, Z.memo)(
    ({ children: e, className: t, node: n, ...r }) =>
      (0, Q.jsx)(`ol`, {
        className: $(
          `list-inside list-decimal whitespace-normal [li_&]:pl-6`,
          t,
        ),
        "data-streamdown": `ordered-list`,
        ...r,
        children: e,
      }),
    (e, t) => nb(e, t),
  );
ab.displayName = `MarkdownOl`;
var ob = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`li`, {
      className: $(`py-1 [&>p]:inline`, t),
      "data-streamdown": `list-item`,
      ...r,
      children: e,
    }),
  (e, t) => e.className === t.className && tb(e.node, t.node),
);
ob.displayName = `MarkdownLi`;
var sb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`ul`, {
      className: $(`list-inside list-disc whitespace-normal [li_&]:pl-6`, t),
      "data-streamdown": `unordered-list`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
sb.displayName = `MarkdownUl`;
var cb = (0, Z.memo)(
  ({ className: e, node: t, ...n }) =>
    (0, Q.jsx)(`hr`, {
      className: $(`my-6 border-border`, e),
      "data-streamdown": `horizontal-rule`,
      ...n,
    }),
  (e, t) => nb(e, t),
);
cb.displayName = `MarkdownHr`;
var lb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`span`, {
      className: $(`font-semibold`, t),
      "data-streamdown": `strong`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
lb.displayName = `MarkdownStrong`;
var ub = (0, Z.memo)(
  ({ children: e, className: t, href: n, node: r, ...i }) => {
    let { linkSafety: a } = (0, Z.useContext)(Qb),
      [o, s] = (0, Z.useState)(!1),
      c = n === `streamdown:incomplete-link`,
      l = (0, Z.useCallback)(
        async (e) => {
          if (!(!(a != null && a.enabled && n) || c)) {
            if (
              (e.preventDefault(), a.onLinkCheck && (await a.onLinkCheck(n)))
            ) {
              window.open(n, `_blank`, `noreferrer`);
              return;
            }
            s(!0);
          }
        },
        [a, n, c],
      ),
      u = (0, Z.useCallback)(() => {
        n && window.open(n, `_blank`, `noreferrer`);
      }, [n]),
      d = (0, Z.useCallback)(() => {
        s(!1);
      }, []),
      f = { url: n ?? ``, isOpen: o, onClose: d, onConfirm: u };
    return a != null && a.enabled && n
      ? (0, Q.jsxs)(Q.Fragment, {
          children: [
            (0, Q.jsx)(`button`, {
              className: $(
                `wrap-anywhere appearance-none text-left font-medium text-primary underline`,
                t,
              ),
              "data-incomplete": c,
              "data-streamdown": `link`,
              onClick: l,
              type: `button`,
              children: e,
            }),
            a.renderModal ? a.renderModal(f) : (0, Q.jsx)(Ny, { ...f }),
          ],
        })
      : (0, Q.jsx)(`a`, {
          className: $(`wrap-anywhere font-medium text-primary underline`, t),
          "data-incomplete": c,
          "data-streamdown": `link`,
          href: n,
          rel: `noreferrer`,
          target: `_blank`,
          ...i,
          children: e,
        });
  },
  (e, t) => nb(e, t) && e.href === t.href,
);
ub.displayName = `MarkdownA`;
var db = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h1`, {
      className: $(`mt-6 mb-2 font-semibold text-3xl`, t),
      "data-streamdown": `heading-1`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
db.displayName = `MarkdownH1`;
var fb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h2`, {
      className: $(`mt-6 mb-2 font-semibold text-2xl`, t),
      "data-streamdown": `heading-2`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
fb.displayName = `MarkdownH2`;
var pb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h3`, {
      className: $(`mt-6 mb-2 font-semibold text-xl`, t),
      "data-streamdown": `heading-3`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
pb.displayName = `MarkdownH3`;
var mb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h4`, {
      className: $(`mt-6 mb-2 font-semibold text-lg`, t),
      "data-streamdown": `heading-4`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
mb.displayName = `MarkdownH4`;
var hb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h5`, {
      className: $(`mt-6 mb-2 font-semibold text-base`, t),
      "data-streamdown": `heading-5`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
hb.displayName = `MarkdownH5`;
var gb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`h6`, {
      className: $(`mt-6 mb-2 font-semibold text-sm`, t),
      "data-streamdown": `heading-6`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
gb.displayName = `MarkdownH6`;
var _b = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) => {
    let { controls: i } = (0, Z.useContext)(Qb);
    return (0, Q.jsx)(Zy, {
      className: t,
      showControls: rb(i, `table`),
      ...r,
      children: e,
    });
  },
  (e, t) => nb(e, t),
);
_b.displayName = `MarkdownTable`;
var vb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`thead`, {
      className: $(`bg-muted/80`, t),
      "data-streamdown": `table-header`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
vb.displayName = `MarkdownThead`;
var yb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`tbody`, {
      className: $(`divide-y divide-border bg-muted/40`, t),
      "data-streamdown": `table-body`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
yb.displayName = `MarkdownTbody`;
var bb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`tr`, {
      className: $(`border-border border-b`, t),
      "data-streamdown": `table-row`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
bb.displayName = `MarkdownTr`;
var xb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`th`, {
      className: $(
        `whitespace-nowrap px-4 py-2 text-left font-semibold text-sm`,
        t,
      ),
      "data-streamdown": `table-header-cell`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
xb.displayName = `MarkdownTh`;
var Sb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`td`, {
      className: $(`px-4 py-2 text-sm`, t),
      "data-streamdown": `table-cell`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
Sb.displayName = `MarkdownTd`;
var Cb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`blockquote`, {
      className: $(
        `my-4 border-muted-foreground/30 border-l-4 pl-4 text-muted-foreground italic`,
        t,
      ),
      "data-streamdown": `blockquote`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
Cb.displayName = `MarkdownBlockquote`;
var wb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`sup`, {
      className: $(`text-sm`, t),
      "data-streamdown": `superscript`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
wb.displayName = `MarkdownSup`;
var Tb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) =>
    (0, Q.jsx)(`sub`, {
      className: $(`text-sm`, t),
      "data-streamdown": `subscript`,
      ...r,
      children: e,
    }),
  (e, t) => nb(e, t),
);
Tb.displayName = `MarkdownSub`;
var Eb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) => {
    if (`data-footnotes` in r) {
      let n = (e) => {
          if (!(0, Z.isValidElement)(e)) return !1;
          let t = Array.isArray(e.props.children)
              ? e.props.children
              : [e.props.children],
            n = !1,
            r = !1;
          for (let e of t)
            if (e) {
              if (typeof e == `string`) e.trim() !== `` && (n = !0);
              else if ((0, Z.isValidElement)(e))
                if (e.props?.[`data-footnote-backref`] !== void 0) r = !0;
                else {
                  let t = Array.isArray(e.props.children)
                    ? e.props.children
                    : [e.props.children];
                  for (let e of t) {
                    if (typeof e == `string` && e.trim() !== ``) {
                      n = !0;
                      break;
                    }
                    if (
                      (0, Z.isValidElement)(e) &&
                      e.props?.[`data-footnote-backref`] === void 0
                    ) {
                      n = !0;
                      break;
                    }
                  }
                }
            }
          return r && !n;
        },
        i = Array.isArray(e)
          ? e.map((e) => {
              if (!(0, Z.isValidElement)(e)) return e;
              if (e.type === ab) {
                let t = (
                  Array.isArray(e.props.children)
                    ? e.props.children
                    : [e.props.children]
                ).filter((e) => !n(e));
                return t.length === 0
                  ? null
                  : { ...e, props: { ...e.props, children: t } };
              }
              return e;
            })
          : e;
      return (Array.isArray(i) ? i.some((e) => e !== null) : i !== null)
        ? (0, Q.jsx)(`section`, { className: t, ...r, children: i })
        : null;
    }
    return (0, Q.jsx)(`section`, { className: t, ...r, children: e });
  },
  (e, t) => nb(e, t),
);
Eb.displayName = `MarkdownSection`;
var Db = (0, Z.memo)(
  ({ node: e, className: t, children: n, ...r }) => {
    let i = e?.position?.start.line === e?.position?.end.line,
      { mermaid: a, controls: o } = (0, Z.useContext)(Qb),
      s = Ly();
    if (i)
      return (0, Q.jsx)(`code`, {
        className: $(`rounded bg-muted px-1.5 py-0.5 font-mono text-sm`, t),
        "data-streamdown": `inline-code`,
        ...r,
        children: n,
      });
    let c = t?.match(eb)?.at(1) ?? ``,
      l = ``;
    if (
      ((0, Z.isValidElement)(n) &&
      n.props &&
      typeof n.props == `object` &&
      `children` in n.props &&
      typeof n.props.children == `string`
        ? (l = n.props.children)
        : typeof n == `string` && (l = n),
      c === `mermaid` && s)
    ) {
      let e = rb(o, `mermaid`),
        n = ib(o, `download`),
        r = ib(o, `copy`),
        i = ib(o, `fullscreen`),
        s = ib(o, `panZoom`),
        c = e && (n || r || i);
      return (0, Q.jsx)(Z.Suspense, {
        fallback: (0, Q.jsx)(Dy, {}),
        children: (0, Q.jsxs)(`div`, {
          className: $(`group relative my-4 h-auto rounded-xl border p-4`, t),
          "data-streamdown": `mermaid-block`,
          children: [
            c
              ? (0, Q.jsxs)(`div`, {
                  className: `flex items-center justify-end gap-2`,
                  children: [
                    n ? (0, Q.jsx)(zy, { chart: l, config: a?.config }) : null,
                    r ? (0, Q.jsx)(wy, { code: l }) : null,
                    i ? (0, Q.jsx)(Uy, { chart: l, config: a?.config }) : null,
                  ],
                })
              : null,
            (0, Q.jsx)($y, { chart: l, config: a?.config, showControls: s }),
          ],
        }),
      });
    }
    let u = rb(o, `code`);
    return (0, Q.jsx)(Z.Suspense, {
      fallback: (0, Q.jsx)(Dy, {}),
      children: (0, Q.jsx)(Qy, {
        className: $(`overflow-x-auto border-border border-t`, t),
        code: l,
        language: c,
        children: u
          ? (0, Q.jsxs)(Q.Fragment, {
              children: [
                (0, Q.jsx)(Ey, { code: l, language: c }),
                (0, Q.jsx)(wy, {}),
              ],
            })
          : null,
      }),
    });
  },
  (e, t) => e.className === t.className && tb(e.node, t.node),
);
Db.displayName = `MarkdownCode`;
var Ob = (0, Z.memo)(
  ky,
  (e, t) => e.className === t.className && tb(e.node, t.node),
);
Ob.displayName = `MarkdownImg`;
var kb = (0, Z.memo)(
  ({ children: e, className: t, node: n, ...r }) => {
    let i = (Array.isArray(e) ? e : [e]).filter((e) => e != null && e !== ``);
    if (i.length === 1 && (0, Z.isValidElement)(i[0])) {
      let t = i[0].props.node,
        n = t?.tagName;
      if (
        n === `img` ||
        (n === `code` && t?.position?.start.line !== t?.position?.end.line)
      )
        return (0, Q.jsx)(Q.Fragment, { children: e });
    }
    return (0, Q.jsx)(`p`, { className: t, ...r, children: e });
  },
  (e, t) => nb(e, t),
);
kb.displayName = `MarkdownParagraph`;
var Ab = {
    ol: ab,
    li: ob,
    ul: sb,
    hr: cb,
    strong: lb,
    a: ub,
    h1: db,
    h2: fb,
    h3: pb,
    h4: mb,
    h5: hb,
    h6: gb,
    table: _b,
    thead: vb,
    tbody: yb,
    tr: bb,
    th: xb,
    td: Sb,
    blockquote: Cb,
    code: Db,
    img: Ob,
    pre: ({ children: e }) => e,
    sup: wb,
    sub: Tb,
    p: kb,
    section: Eb,
  },
  jb = [],
  Mb = { allowDangerousHtml: !0 },
  Nb = new WeakMap(),
  Pb = new (class {
    constructor() {
      ((this.cache = new Map()),
        (this.keyCache = new WeakMap()),
        (this.maxSize = 100));
    }
    generateCacheKey(e) {
      let t = this.keyCache.get(e);
      if (t) return t;
      let n = e.rehypePlugins,
        r = e.remarkPlugins,
        i = e.remarkRehypeOptions;
      if (!(n || r || i)) {
        let t = `default`;
        return (this.keyCache.set(e, t), t);
      }
      let a = (e) => {
          if (!e || e.length === 0) return ``;
          let t = ``;
          for (let n = 0; n < e.length; n += 1) {
            let r = e[n];
            if ((n > 0 && (t += `,`), Array.isArray(r))) {
              let [e, n] = r;
              if (typeof e == `function`) {
                let n = Nb.get(e);
                (n || ((n = e.name), Nb.set(e, n)), (t += n));
              } else t += String(e);
              ((t += `:`), (t += JSON.stringify(n)));
            } else if (typeof r == `function`) {
              let e = Nb.get(r);
              (e || ((e = r.name), Nb.set(r, e)), (t += e));
            } else t += String(r);
          }
          return t;
        },
        o = a(n),
        s = `${a(r)}::${o}::${i ? JSON.stringify(i) : ``}`;
      return (this.keyCache.set(e, s), s);
    }
    get(e) {
      let t = this.generateCacheKey(e),
        n = this.cache.get(t);
      return (n && (this.cache.delete(t), this.cache.set(t, n)), n);
    }
    set(e, t) {
      let n = this.generateCacheKey(e);
      if (this.cache.size >= this.maxSize) {
        let e = this.cache.keys().next().value;
        e && this.cache.delete(e);
      }
      this.cache.set(n, t);
    }
    clear() {
      this.cache.clear();
    }
  })(),
  Fb = (e) => {
    let t = Ib(e),
      n = e.children || ``;
    return Rb(t.runSync(t.parse(n), n), e);
  },
  Ib = (e) => {
    let t = Pb.get(e);
    if (t) return t;
    let n = Lb(e);
    return (Pb.set(e, n), n);
  },
  Lb = (e) => {
    let t = e.rehypePlugins || jb,
      n = e.remarkPlugins || jb,
      r = e.remarkRehypeOptions ? { ...Mb, ...e.remarkRehypeOptions } : Mb;
    return E_().use(sg).use(n).use(Qg, r).use(t);
  },
  Rb = (e, t) =>
    th(e, {
      Fragment: Q.Fragment,
      components: t.components,
      ignoreInvalidStyle: !0,
      jsx: Q.jsx,
      jsxs: Q.jsxs,
      passKeys: !0,
      passNode: !0,
    }),
  zb = /\[\^[^\]\s]{1,200}\](?!:)/,
  Bb = /\[\^[^\]\s]{1,200}\]:/,
  Vb = /<\/(\w+)>/,
  Hb = /<(\w+)[\s>]/,
  Ub = (e) => {
    let t = 0;
    for (
      ;
      t < e.length &&
      (e[t] === ` ` ||
        e[t] === `	` ||
        e[t] ===
          `
` ||
        e[t] === `\r`);
    )
      t += 1;
    return t + 1 < e.length && e[t] === `$` && e[t + 1] === `$`;
  },
  Wb = (e) => {
    let t = e.length - 1;
    for (
      ;
      t >= 0 &&
      (e[t] === ` ` ||
        e[t] === `	` ||
        e[t] ===
          `
` ||
        e[t] === `\r`);
    )
      --t;
    return t >= 1 && e[t] === `$` && e[t - 1] === `$`;
  },
  Gb = (e) => {
    let t = 0;
    for (let n = 0; n < e.length - 1; n += 1)
      e[n] === `$` && e[n + 1] === `$` && ((t += 1), (n += 1));
    return t;
  },
  Kb = (e) => {
    let t = zb.test(e),
      n = Bb.test(e);
    if (t || n) return [e];
    let r = ty.lex(e, { gfm: !0 }),
      i = [],
      a = [];
    for (let e of r) {
      let t = e.raw,
        n = i.length;
      if (a.length > 0) {
        if (((i[n - 1] += t), e.type === `html`)) {
          let e = t.match(Vb);
          if (e) {
            let t = e[1];
            a.at(-1) === t && a.pop();
          }
        }
        continue;
      }
      if (e.type === `html` && e.block) {
        let e = t.match(Hb);
        if (e) {
          let n = e[1];
          t.includes(`</${n}>`) || a.push(n);
        }
      }
      if (t.trim() === `$$` && n > 0) {
        let e = i[n - 1],
          r = Ub(e),
          a = Gb(e);
        if (r && a % 2 == 1) {
          i[n - 1] = e + t;
          continue;
        }
      }
      if (n > 0 && Wb(t)) {
        let e = i[n - 1],
          r = Ub(e),
          a = Gb(e),
          o = Gb(t);
        if (r && a % 2 == 1 && !Ub(t) && o === 1) {
          i[n - 1] = e + t;
          continue;
        }
      }
      i.push(t);
    }
    return i;
  },
  qb = {
    raw: Oo,
    sanitize: [qo, {}],
    harden: [
      ct,
      {
        allowedImagePrefixes: [`*`],
        allowedLinkPrefixes: [`*`],
        allowedProtocols: [`*`],
        defaultOrigin: void 0,
        allowDataImages: !0,
      },
    ],
  },
  Jb = { gfm: [Gd, {}] },
  Yb = Object.values(qb),
  Xb = Object.values(Jb),
  Zb = { block: ` ▋`, circle: ` ●` },
  Qb = (0, Z.createContext)({
    shikiTheme: [`github-light`, `github-dark`],
    controls: !0,
    isAnimating: !1,
    mode: `streaming`,
    mermaid: void 0,
    linkSafety: { enabled: !0 },
  }),
  $b = (0, Z.memo)(
    ({ content: e, shouldParseIncompleteMarkdown: t, index: n, ...r }) =>
      (0, Q.jsx)(Fb, { ...r, children: e }),
    (e, t) => {
      if (e.content !== t.content || e.index !== t.index) return !1;
      if (e.components !== t.components) {
        let n = Object.keys(e.components || {}),
          r = Object.keys(t.components || {});
        if (
          n.length !== r.length ||
          n.some((n) => e.components?.[n] !== t.components?.[n])
        )
          return !1;
      }
      return !(
        e.rehypePlugins !== t.rehypePlugins ||
        e.remarkPlugins !== t.remarkPlugins
      );
    },
  );
$b.displayName = `Block`;
var ex = [`github-light`, `github-dark`],
  tx = (0, Z.memo)(
    ({
      children: e,
      mode: t = `streaming`,
      parseIncompleteMarkdown: n = !0,
      components: r,
      rehypePlugins: i = Yb,
      remarkPlugins: a = Xb,
      className: o,
      shikiTheme: s = ex,
      mermaid: c,
      controls: l = !0,
      isAnimating: u = !1,
      BlockComponent: d = $b,
      parseMarkdownIntoBlocksFn: f = Kb,
      caret: p,
      plugins: m,
      remend: h,
      linkSafety: g = { enabled: !0 },
      ..._
    }) => {
      let v = (0, Z.useId)(),
        [y, b] = (0, Z.useTransition)(),
        x = (0, Z.useMemo)(
          () =>
            typeof e == `string` ? (t === `streaming` && n ? hp(e, h) : e) : ``,
          [e, t, n, h],
        ),
        S = (0, Z.useMemo)(() => f(x), [x, f]),
        [C, w] = (0, Z.useState)(S);
      (0, Z.useEffect)(() => {
        t === `streaming`
          ? b(() => {
              w(S);
            })
          : w(S);
      }, [S, t]);
      let T = t === `streaming` ? C : S,
        E = (0, Z.useMemo)(() => T.map((e, t) => `${v}-${t}`), [T.length, v]),
        D = (0, Z.useMemo)(
          () => ({
            shikiTheme: m?.code?.getThemes() ?? s,
            controls: l,
            isAnimating: u,
            mode: t,
            mermaid: c,
            linkSafety: g,
          }),
          [s, l, u, t, c, g, m?.code],
        ),
        ee = (0, Z.useMemo)(() => ({ ...Ab, ...r }), [r]),
        te = (0, Z.useMemo)(() => {
          let e = [];
          return (
            m != null && m.cjk && (e = [...e, ...m.cjk.remarkPluginsBefore]),
            (e = [...e, ...a]),
            m != null && m.cjk && (e = [...e, ...m.cjk.remarkPluginsAfter]),
            m != null && m.math && (e = [...e, m.math.remarkPlugin]),
            e
          );
        }, [a, m?.math, m?.cjk]),
        ne = (0, Z.useMemo)(
          () => (m != null && m.math ? [...i, m.math.rehypePlugin] : i),
          [i, m?.math],
        ),
        re = (0, Z.useMemo)(
          () => (p && u ? { "--streamdown-caret": `"${Zb[p]}"` } : void 0),
          [p, u],
        );
      return t === `static`
        ? (0, Q.jsx)(Py.Provider, {
            value: m ?? null,
            children: (0, Q.jsx)(Qb.Provider, {
              value: D,
              children: (0, Q.jsx)(`div`, {
                className: $(
                  `space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0`,
                  o,
                ),
                children: (0, Q.jsx)(Fb, {
                  components: ee,
                  rehypePlugins: ne,
                  remarkPlugins: te,
                  ..._,
                  children: e,
                }),
              }),
            }),
          })
        : (0, Q.jsx)(Py.Provider, {
            value: m ?? null,
            children: (0, Q.jsx)(Qb.Provider, {
              value: D,
              children: (0, Q.jsxs)(`div`, {
                className: $(
                  `space-y-4 whitespace-normal *:first:mt-0 *:last:mb-0`,
                  p
                    ? `*:last:after:inline *:last:after:align-baseline *:last:after:content-(--streamdown-caret)`
                    : null,
                  o,
                ),
                style: re,
                children: [
                  T.length === 0 && p && u && (0, Q.jsx)(`span`, {}),
                  T.map((e, t) =>
                    (0, Q.jsx)(
                      d,
                      {
                        components: ee,
                        content: e,
                        index: t,
                        rehypePlugins: ne,
                        remarkPlugins: te,
                        shouldParseIncompleteMarkdown: n,
                        ..._,
                      },
                      E[t],
                    ),
                  ),
                ],
              }),
            }),
          });
    },
    (e, t) =>
      e.children === t.children &&
      e.shikiTheme === t.shikiTheme &&
      e.isAnimating === t.isAnimating &&
      e.mode === t.mode &&
      e.plugins === t.plugins &&
      e.className === t.className &&
      e.linkSafety === t.linkSafety,
  );
tx.displayName = `Streamdown`;
var nx = ({
    children: e,
    className: t,
    minZoom: n = 0.5,
    maxZoom: r = 3,
    zoomStep: i = 0.1,
    showControls: a = !0,
    initialZoom: o = 1,
    fullscreen: s = !1,
  }) => {
    let c = (0, Z.useRef)(null),
      l = (0, Z.useRef)(null),
      [u, d] = (0, Z.useState)(o),
      [f, p] = (0, Z.useState)({ x: 0, y: 0 }),
      [m, h] = (0, Z.useState)(!1),
      [g, _] = (0, Z.useState)({ x: 0, y: 0 }),
      [v, y] = (0, Z.useState)({ x: 0, y: 0 }),
      b = (0, Z.useCallback)(
        (e) => {
          d((t) => Math.max(n, Math.min(r, t + e)));
        },
        [n, r],
      ),
      x = (0, Z.useCallback)(() => {
        b(i);
      }, [b, i]),
      S = (0, Z.useCallback)(() => {
        b(-i);
      }, [b, i]),
      C = (0, Z.useCallback)(() => {
        (d(o), p({ x: 0, y: 0 }));
      }, [o]),
      w = (0, Z.useCallback)(
        (e) => {
          (e.preventDefault(), b(e.deltaY > 0 ? -i : i));
        },
        [b, i],
      ),
      T = (0, Z.useCallback)(
        (e) => {
          if (e.button !== 0 || e.isPrimary === !1) return;
          (h(!0), _({ x: e.clientX, y: e.clientY }), y(f));
          let t = e.currentTarget;
          t instanceof HTMLElement && t.setPointerCapture(e.pointerId);
        },
        [f],
      ),
      E = (0, Z.useCallback)(
        (e) => {
          if (!m) return;
          e.preventDefault();
          let t = e.clientX - g.x,
            n = e.clientY - g.y;
          p({ x: v.x + t, y: v.y + n });
        },
        [m, g, v],
      ),
      D = (0, Z.useCallback)((e) => {
        h(!1);
        let t = e.currentTarget;
        t instanceof HTMLElement && t.releasePointerCapture(e.pointerId);
      }, []);
    return (
      (0, Z.useEffect)(() => {
        let e = c.current;
        if (e)
          return (
            e.addEventListener(`wheel`, w, { passive: !1 }),
            () => {
              e.removeEventListener(`wheel`, w);
            }
          );
      }, [w]),
      (0, Z.useEffect)(() => {
        let e = l.current;
        if (e && m)
          return (
            (document.body.style.userSelect = `none`),
            e.addEventListener(`pointermove`, E, { passive: !1 }),
            e.addEventListener(`pointerup`, D),
            e.addEventListener(`pointercancel`, D),
            () => {
              ((document.body.style.userSelect = ``),
                e.removeEventListener(`pointermove`, E),
                e.removeEventListener(`pointerup`, D),
                e.removeEventListener(`pointercancel`, D));
            }
          );
      }, [m, E, D]),
      (0, Q.jsxs)(`div`, {
        className: $(
          `relative flex flex-col`,
          s ? `h-full w-full` : `min-h-28 w-full`,
          t,
        ),
        ref: c,
        style: { cursor: m ? `grabbing` : `grab` },
        children: [
          a
            ? (0, Q.jsxs)(`div`, {
                className: $(
                  `absolute z-10 flex flex-col gap-1 rounded-md border border-border bg-background/90 p-1 shadow-sm backdrop-blur-sm`,
                  s ? `bottom-4 left-4` : `bottom-2 left-2`,
                ),
                children: [
                  (0, Q.jsx)(`button`, {
                    className: `flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
                    disabled: u >= r,
                    onClick: x,
                    title: `Zoom in`,
                    type: `button`,
                    children: (0, Q.jsx)(yy, { size: 16 }),
                  }),
                  (0, Q.jsx)(`button`, {
                    className: `flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50`,
                    disabled: u <= n,
                    onClick: S,
                    title: `Zoom out`,
                    type: `button`,
                    children: (0, Q.jsx)(by, { size: 16 }),
                  }),
                  (0, Q.jsx)(`button`, {
                    className: `flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground`,
                    onClick: C,
                    title: `Reset zoom and pan`,
                    type: `button`,
                    children: (0, Q.jsx)(gy, { size: 16 }),
                  }),
                ],
              })
            : null,
          (0, Q.jsx)(`div`, {
            className: $(
              `flex-1 origin-center transition-transform duration-150 ease-out`,
              s
                ? `flex h-full w-full items-center justify-center`
                : `flex w-full items-center justify-center`,
            ),
            onPointerDown: T,
            ref: l,
            role: `application`,
            style: {
              transform: `translate(${f.x}px, ${f.y}px) scale(${u})`,
              transformOrigin: `center center`,
              touchAction: `none`,
              willChange: `transform`,
            },
            children: e,
          }),
        ],
      })
    );
  },
  rx = ({
    chart: e,
    className: t,
    config: n,
    fullscreen: r = !1,
    showControls: i = !0,
  }) => {
    let [a, o] = (0, Z.useState)(null),
      [s, c] = (0, Z.useState)(!1),
      [l, u] = (0, Z.useState)(``),
      [d, f] = (0, Z.useState)(``),
      [p, m] = (0, Z.useState)(0),
      { mermaid: h } = (0, Z.useContext)(Qb),
      g = Ly(),
      _ = h?.errorComponent,
      { shouldRender: v, containerRef: y } = uy({ immediate: r });
    if (
      ((0, Z.useEffect)(() => {
        if (v) {
          if (!g) {
            o(
              `Mermaid plugin not available. Please add the mermaid plugin to enable diagram rendering.`,
            );
            return;
          }
          (async () => {
            try {
              (o(null), c(!0));
              let t = g.getMermaid(n),
                r = e
                  .split(``)
                  .reduce((e, t) => ((e << 5) - e + t.charCodeAt(0)) | 0, 0),
                i = `mermaid-${Math.abs(r)}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                { svg: a } = await t.render(i, e);
              (u(a), f(a));
            } catch (e) {
              d ||
                l ||
                o(
                  e instanceof Error
                    ? e.message
                    : `Failed to render Mermaid chart`,
                );
            } finally {
              c(!1);
            }
          })();
        }
      }, [e, n, p, v, g]),
      !(v || l || d))
    )
      return (0, Q.jsx)(`div`, {
        className: $(`my-4 min-h-[200px]`, t),
        ref: y,
      });
    if (s && !l && !d)
      return (0, Q.jsx)(`div`, {
        className: $(`my-4 flex justify-center p-4`, t),
        ref: y,
        children: (0, Q.jsxs)(`div`, {
          className: `flex items-center space-x-2 text-muted-foreground`,
          children: [
            (0, Q.jsx)(`div`, {
              className: `h-4 w-4 animate-spin rounded-full border-current border-b-2`,
            }),
            (0, Q.jsx)(`span`, {
              className: `text-sm`,
              children: `Loading diagram...`,
            }),
          ],
        }),
      });
    if (a && !l && !d)
      return _
        ? (0, Q.jsx)(`div`, {
            ref: y,
            children: (0, Q.jsx)(_, {
              chart: e,
              error: a,
              retry: () => m((e) => e + 1),
            }),
          })
        : (0, Q.jsxs)(`div`, {
            className: $(`rounded-lg border border-red-200 bg-red-50 p-4`, t),
            ref: y,
            children: [
              (0, Q.jsxs)(`p`, {
                className: `font-mono text-red-700 text-sm`,
                children: [`Mermaid Error: `, a],
              }),
              (0, Q.jsxs)(`details`, {
                className: `mt-2`,
                children: [
                  (0, Q.jsx)(`summary`, {
                    className: `cursor-pointer text-red-600 text-xs`,
                    children: `Show Code`,
                  }),
                  (0, Q.jsx)(`pre`, {
                    className: `mt-2 overflow-x-auto rounded bg-red-100 p-2 text-red-800 text-xs`,
                    children: e,
                  }),
                ],
              }),
            ],
          });
    let b = l || d;
    return (0, Q.jsx)(`div`, {
      className: $(`size-full`, t),
      "data-streamdown": `mermaid`,
      ref: y,
      children: (0, Q.jsx)(nx, {
        className: $(
          r ? `size-full overflow-hidden` : `my-4 overflow-hidden`,
          t,
        ),
        fullscreen: r,
        maxZoom: 3,
        minZoom: 0.5,
        showControls: i,
        zoomStep: 0.1,
        children: (0, Q.jsx)(`div`, {
          "aria-label": `Mermaid chart`,
          className: $(
            `flex justify-center`,
            r ? `size-full items-center` : null,
          ),
          dangerouslySetInnerHTML: { __html: b },
          role: `img`,
        }),
      }),
    });
  };
export {
  _ as A,
  k as C,
  C as D,
  w as E,
  s as M,
  S as O,
  se as S,
  T,
  ze as _,
  rx as a,
  Ne as b,
  I as c,
  it as d,
  at as f,
  Be as g,
  He as h,
  Iy as i,
  c as j,
  g as k,
  st as l,
  We as m,
  Sy as n,
  tx as o,
  Ke as p,
  $ as r,
  Hc as s,
  Qb as t,
  ot as u,
  Ie as v,
  ae as w,
  ce as x,
  Le as y,
};
