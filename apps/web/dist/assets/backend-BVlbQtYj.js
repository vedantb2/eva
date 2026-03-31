import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
for (
  var n = [],
    r = [],
    i = Uint8Array,
    a = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/`,
    o = 0,
    s = a.length;
  o < s;
  ++o
)
  ((n[o] = a[o]), (r[a.charCodeAt(o)] = o));
((r[45] = 62), (r[95] = 63));
function c(e) {
  var t = e.length;
  if (t % 4 > 0) throw Error(`Invalid string. Length must be a multiple of 4`);
  var n = e.indexOf(`=`);
  n === -1 && (n = t);
  var r = n === t ? 0 : 4 - (n % 4);
  return [n, r];
}
function l(e, t, n) {
  return ((t + n) * 3) / 4 - n;
}
function u(e) {
  var t,
    n = c(e),
    a = n[0],
    o = n[1],
    s = new i(l(e, a, o)),
    u = 0,
    d = o > 0 ? a - 4 : a,
    f;
  for (f = 0; f < d; f += 4)
    ((t =
      (r[e.charCodeAt(f)] << 18) |
      (r[e.charCodeAt(f + 1)] << 12) |
      (r[e.charCodeAt(f + 2)] << 6) |
      r[e.charCodeAt(f + 3)]),
      (s[u++] = (t >> 16) & 255),
      (s[u++] = (t >> 8) & 255),
      (s[u++] = t & 255));
  return (
    o === 2 &&
      ((t = (r[e.charCodeAt(f)] << 2) | (r[e.charCodeAt(f + 1)] >> 4)),
      (s[u++] = t & 255)),
    o === 1 &&
      ((t =
        (r[e.charCodeAt(f)] << 10) |
        (r[e.charCodeAt(f + 1)] << 4) |
        (r[e.charCodeAt(f + 2)] >> 2)),
      (s[u++] = (t >> 8) & 255),
      (s[u++] = t & 255)),
    s
  );
}
function d(e) {
  return n[(e >> 18) & 63] + n[(e >> 12) & 63] + n[(e >> 6) & 63] + n[e & 63];
}
function f(e, t, n) {
  for (var r, i = [], a = t; a < n; a += 3)
    ((r =
      ((e[a] << 16) & 16711680) + ((e[a + 1] << 8) & 65280) + (e[a + 2] & 255)),
      i.push(d(r)));
  return i.join(``);
}
function p(e) {
  for (
    var t, r = e.length, i = r % 3, a = [], o = 16383, s = 0, c = r - i;
    s < c;
    s += o
  )
    a.push(f(e, s, s + o > c ? c : s + o));
  return (
    i === 1
      ? ((t = e[r - 1]), a.push(n[t >> 2] + n[(t << 4) & 63] + `==`))
      : i === 2 &&
        ((t = (e[r - 2] << 8) + e[r - 1]),
        a.push(n[t >> 10] + n[(t >> 4) & 63] + n[(t << 2) & 63] + `=`)),
    a.join(``)
  );
}
function m(e) {
  if (e === void 0) return {};
  if (!te(e))
    throw Error(
      `The arguments to a Convex function must be an object. Received: ${e}`,
    );
  return e;
}
function ee(e) {
  if (e === void 0)
    throw Error(
      `Client created with undefined deployment address. If you used an environment variable, check that it's set.`,
    );
  if (typeof e != `string`)
    throw Error(`Invalid deployment address: found ${e}".`);
  if (!(e.startsWith(`http:`) || e.startsWith(`https:`)))
    throw Error(
      `Invalid deployment address: Must start with "https://" or "http://". Found "${e}".`,
    );
  try {
    new URL(e);
  } catch {
    throw Error(
      `Invalid deployment address: "${e}" is not a valid URL. If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
  }
  if (e.endsWith(`.convex.site`))
    throw Error(
      `Invalid deployment address: "${e}" ends with .convex.site, which is used for HTTP Actions. Convex deployment URLs typically end with .convex.cloud? If you believe this URL is correct, use the \`skipConvexDeploymentUrlCheck\` option to bypass this.`,
    );
}
function te(e) {
  let t = typeof e == `object`,
    n = Object.getPrototypeOf(e),
    r =
      n === null || n === Object.prototype || n?.constructor?.name === `Object`;
  return t && r;
}
var ne = !0,
  h = BigInt(`-9223372036854775808`),
  re = BigInt(`9223372036854775807`),
  g = BigInt(`0`),
  ie = BigInt(`8`),
  ae = BigInt(`256`);
function oe(e) {
  return Number.isNaN(e) || !Number.isFinite(e) || Object.is(e, -0);
}
function se(e) {
  e < g && (e -= h + h);
  let t = e.toString(16);
  t.length % 2 == 1 && (t = `0` + t);
  let n = new Uint8Array(new ArrayBuffer(8)),
    r = 0;
  for (let i of t.match(/.{2}/g).reverse())
    (n.set([parseInt(i, 16)], r++), (e >>= ie));
  return p(n);
}
function ce(e) {
  let t = u(e);
  if (t.byteLength !== 8)
    throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
  let n = g,
    r = g;
  for (let e of t) ((n += BigInt(e) * ae ** r), r++);
  return (n > re && (n += h + h), n);
}
function le(e) {
  if (e < h || re < e)
    throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
  let t = new ArrayBuffer(8);
  return (new DataView(t).setBigInt64(0, e, !0), p(new Uint8Array(t)));
}
function ue(e) {
  let t = u(e);
  if (t.byteLength !== 8)
    throw Error(`Received ${t.byteLength} bytes, expected 8 for $integer`);
  return new DataView(t.buffer).getBigInt64(0, !0);
}
var de = DataView.prototype.setBigInt64 ? le : se,
  fe = DataView.prototype.getBigInt64 ? ue : ce,
  pe = 1024;
function _(e) {
  if (e.length > pe)
    throw Error(`Field name ${e} exceeds maximum field name length ${pe}.`);
  if (e.startsWith(`$`))
    throw Error(`Field name ${e} starts with a '$', which is reserved.`);
  for (let t = 0; t < e.length; t += 1) {
    let n = e.charCodeAt(t);
    if (n < 32 || n >= 127)
      throw Error(
        `Field name ${e} has invalid character '${e[t]}': Field names can only contain non-control ASCII characters`,
      );
  }
}
function v(e) {
  if (
    e === null ||
    typeof e == `boolean` ||
    typeof e == `number` ||
    typeof e == `string`
  )
    return e;
  if (Array.isArray(e)) return e.map((e) => v(e));
  if (typeof e != `object`) throw Error(`Unexpected type of ${e}`);
  let t = Object.entries(e);
  if (t.length === 1) {
    let n = t[0][0];
    if (n === `$bytes`) {
      if (typeof e.$bytes != `string`)
        throw Error(`Malformed $bytes field on ${e}`);
      return u(e.$bytes).buffer;
    }
    if (n === `$integer`) {
      if (typeof e.$integer != `string`)
        throw Error(`Malformed $integer field on ${e}`);
      return fe(e.$integer);
    }
    if (n === `$float`) {
      if (typeof e.$float != `string`)
        throw Error(`Malformed $float field on ${e}`);
      let t = u(e.$float);
      if (t.byteLength !== 8)
        throw Error(`Received ${t.byteLength} bytes, expected 8 for $float`);
      let n = new DataView(t.buffer).getFloat64(0, ne);
      if (!oe(n)) throw Error(`Float ${n} should be encoded as a number`);
      return n;
    }
    if (n === `$set`)
      throw Error(
        `Received a Set which is no longer supported as a Convex type.`,
      );
    if (n === `$map`)
      throw Error(
        `Received a Map which is no longer supported as a Convex type.`,
      );
  }
  let n = {};
  for (let [t, r] of Object.entries(e)) (_(t), (n[t] = v(r)));
  return n;
}
var me = 16384;
function y(e) {
  let t = JSON.stringify(e, (e, t) =>
    t === void 0 ? `undefined` : typeof t == `bigint` ? `${t.toString()}n` : t,
  );
  if (t.length > me) {
    let e = me - 14,
      n = t.codePointAt(e - 1);
    return (
      n !== void 0 && n > 65535 && --e,
      t.substring(0, e) + `[...truncated]`
    );
  }
  return t;
}
function b(e, t, n, r) {
  if (e === void 0) {
    let e = n && ` (present at path ${n} in original object ${y(t)})`;
    throw Error(
      `undefined is not a valid Convex value${e}. To learn about Convex's supported types, see https://docs.convex.dev/using/types.`,
    );
  }
  if (e === null) return e;
  if (typeof e == `bigint`) {
    if (e < h || re < e)
      throw Error(`BigInt ${e} does not fit into a 64-bit signed integer.`);
    return { $integer: de(e) };
  }
  if (typeof e == `number`)
    if (oe(e)) {
      let t = new ArrayBuffer(8);
      return (
        new DataView(t).setFloat64(0, e, ne),
        { $float: p(new Uint8Array(t)) }
      );
    } else return e;
  if (typeof e == `boolean` || typeof e == `string`) return e;
  if (e instanceof ArrayBuffer) return { $bytes: p(new Uint8Array(e)) };
  if (Array.isArray(e)) return e.map((e, r) => b(e, t, n + `[${r}]`, !1));
  if (e instanceof Set) throw Error(x(n, `Set`, [...e], t));
  if (e instanceof Map) throw Error(x(n, `Map`, [...e], t));
  if (!te(e)) {
    let r = e?.constructor?.name,
      i = r ? `${r} ` : ``;
    throw Error(x(n, i, e, t));
  }
  let i = {},
    a = Object.entries(e);
  a.sort(([e, t], [n, r]) => (e === n ? 0 : e < n ? -1 : 1));
  for (let [e, o] of a)
    o === void 0
      ? r && (_(e), (i[e] = he(o, t, n + `.${e}`)))
      : (_(e), (i[e] = b(o, t, n + `.${e}`, !1)));
  return i;
}
function x(e, t, n, r) {
  return e
    ? `${t}${y(n)} is not a supported Convex type (present at path ${e} in original object ${y(r)}). To learn about Convex's supported types, see https://docs.convex.dev/using/types.`
    : `${t}${y(n)} is not a supported Convex type.`;
}
function he(e, t, n) {
  if (e === void 0) return { $undefined: null };
  if (t === void 0)
    throw Error(
      `Programming error. Current value is ${y(e)} but original value is undefined`,
    );
  return b(e, t, n, !1);
}
function S(e) {
  return b(e, e, ``, !1);
}
var ge = Object.defineProperty,
  _e = (e, t, n) =>
    t in e
      ? ge(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  C = (e, t, n) => _e(e, typeof t == `symbol` ? t : t + ``, n),
  ve = `https://docs.convex.dev/error#undefined-validator`;
function w(e, t) {
  let n = t === void 0 ? `` : ` for field "${t}"`;
  throw Error(
    `A validator is undefined${n} in ${e}. This is often caused by circular imports. See ${ve} for details.`,
  );
}
var T = class {
    constructor({ isOptional: e }) {
      (C(this, `type`),
        C(this, `fieldPaths`),
        C(this, `isOptional`),
        C(this, `isConvexValidator`),
        (this.isOptional = e),
        (this.isConvexValidator = !0));
    }
  },
  ye = class e extends T {
    constructor({ isOptional: e, tableName: t }) {
      if (
        (super({ isOptional: e }),
        C(this, `tableName`),
        C(this, `kind`, `id`),
        typeof t != `string`)
      )
        throw Error(`v.id(tableName) requires a string`);
      this.tableName = t;
    }
    get json() {
      return { type: `id`, tableName: this.tableName };
    }
    asOptional() {
      return new e({ isOptional: `optional`, tableName: this.tableName });
    }
  },
  be = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `float64`));
    }
    get json() {
      return { type: `number` };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  xe = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `int64`));
    }
    get json() {
      return { type: `bigint` };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  Se = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `boolean`));
    }
    get json() {
      return { type: this.kind };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  Ce = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `bytes`));
    }
    get json() {
      return { type: this.kind };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  we = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `string`));
    }
    get json() {
      return { type: this.kind };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  Te = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `null`));
    }
    get json() {
      return { type: this.kind };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  Ee = class e extends T {
    constructor() {
      (super(...arguments), C(this, `kind`, `any`));
    }
    get json() {
      return { type: this.kind };
    }
    asOptional() {
      return new e({ isOptional: `optional` });
    }
  },
  De = class e extends T {
    constructor({ isOptional: e, fields: t }) {
      (super({ isOptional: e }),
        C(this, `fields`),
        C(this, `kind`, `object`),
        globalThis.Object.entries(t).forEach(([e, t]) => {
          if ((t === void 0 && w(`v.object()`, e), !t.isConvexValidator))
            throw Error(`v.object() entries must be validators`);
        }),
        (this.fields = t));
    }
    get json() {
      return {
        type: this.kind,
        value: globalThis.Object.fromEntries(
          globalThis.Object.entries(this.fields).map(([e, t]) => [
            e,
            { fieldType: t.json, optional: t.isOptional === `optional` },
          ]),
        ),
      };
    }
    asOptional() {
      return new e({ isOptional: `optional`, fields: this.fields });
    }
    omit(...t) {
      let n = { ...this.fields };
      for (let e of t) delete n[e];
      return new e({ isOptional: this.isOptional, fields: n });
    }
    pick(...t) {
      let n = {};
      for (let e of t) n[e] = this.fields[e];
      return new e({ isOptional: this.isOptional, fields: n });
    }
    partial() {
      let t = {};
      for (let [e, n] of globalThis.Object.entries(this.fields))
        t[e] = n.asOptional();
      return new e({ isOptional: this.isOptional, fields: t });
    }
    extend(t) {
      return new e({
        isOptional: this.isOptional,
        fields: { ...this.fields, ...t },
      });
    }
  },
  Oe = class e extends T {
    constructor({ isOptional: e, value: t }) {
      if (
        (super({ isOptional: e }),
        C(this, `value`),
        C(this, `kind`, `literal`),
        typeof t != `string` &&
          typeof t != `boolean` &&
          typeof t != `number` &&
          typeof t != `bigint`)
      )
        throw Error(`v.literal(value) must be a string, number, or boolean`);
      this.value = t;
    }
    get json() {
      return { type: this.kind, value: S(this.value) };
    }
    asOptional() {
      return new e({ isOptional: `optional`, value: this.value });
    }
  },
  ke = class e extends T {
    constructor({ isOptional: e, element: t }) {
      (super({ isOptional: e }),
        C(this, `element`),
        C(this, `kind`, `array`),
        t === void 0 && w(`v.array()`),
        (this.element = t));
    }
    get json() {
      return { type: this.kind, value: this.element.json };
    }
    asOptional() {
      return new e({ isOptional: `optional`, element: this.element });
    }
  },
  Ae = class e extends T {
    constructor({ isOptional: e, key: t, value: n }) {
      if (
        (super({ isOptional: e }),
        C(this, `key`),
        C(this, `value`),
        C(this, `kind`, `record`),
        t === void 0 && w(`v.record()`, `key`),
        n === void 0 && w(`v.record()`, `value`),
        t.isOptional === `optional`)
      )
        throw Error(`Record validator cannot have optional keys`);
      if (n.isOptional === `optional`)
        throw Error(`Record validator cannot have optional values`);
      if (!t.isConvexValidator || !n.isConvexValidator)
        throw Error(`Key and value of v.record() but be validators`);
      ((this.key = t), (this.value = n));
    }
    get json() {
      return {
        type: this.kind,
        keys: this.key.json,
        values: { fieldType: this.value.json, optional: !1 },
      };
    }
    asOptional() {
      return new e({
        isOptional: `optional`,
        key: this.key,
        value: this.value,
      });
    }
  },
  je = class e extends T {
    constructor({ isOptional: e, members: t }) {
      (super({ isOptional: e }),
        C(this, `members`),
        C(this, `kind`, `union`),
        t.forEach((e, t) => {
          if (
            (e === void 0 && w(`v.union()`, `member at index ${t}`),
            !e.isConvexValidator)
          )
            throw Error(`All members of v.union() must be validators`);
        }),
        (this.members = t));
    }
    get json() {
      return { type: this.kind, value: this.members.map((e) => e.json) };
    }
    asOptional() {
      return new e({ isOptional: `optional`, members: this.members });
    }
  },
  E = {
    id: (e) => new ye({ isOptional: `required`, tableName: e }),
    null: () => new Te({ isOptional: `required` }),
    number: () => new be({ isOptional: `required` }),
    float64: () => new be({ isOptional: `required` }),
    bigint: () => new xe({ isOptional: `required` }),
    int64: () => new xe({ isOptional: `required` }),
    boolean: () => new Se({ isOptional: `required` }),
    string: () => new we({ isOptional: `required` }),
    bytes: () => new Ce({ isOptional: `required` }),
    literal: (e) => new Oe({ isOptional: `required`, value: e }),
    array: (e) => new ke({ isOptional: `required`, element: e }),
    object: (e) => new De({ isOptional: `required`, fields: e }),
    record: (e, t) => new Ae({ isOptional: `required`, key: e, value: t }),
    union: (...e) => new je({ isOptional: `required`, members: e }),
    any: () => new Ee({ isOptional: `required` }),
    optional: (e) => e.asOptional(),
    nullable: (e) => E.union(e, E.null()),
  },
  Me = Object.defineProperty,
  Ne = (e, t, n) =>
    t in e
      ? Me(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Pe = (e, t, n) => Ne(e, typeof t == `symbol` ? t : t + ``, n),
  Fe,
  Ie,
  Le = Symbol.for(`ConvexError`),
  D = class extends ((Ie = Error), (Fe = Le), Ie) {
    constructor(e) {
      (super(typeof e == `string` ? e : y(e)),
        Pe(this, `name`, `ConvexError`),
        Pe(this, `data`),
        Pe(this, Fe, !0),
        (this.data = e));
    }
  },
  Re = `1.31.7`,
  ze = Object.defineProperty,
  Be = (e, t, n) =>
    t in e
      ? ze(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Ve = (e, t, n) => Be(e, typeof t == `symbol` ? t : t + ``, n),
  He = `color:rgb(0, 145, 255)`;
function Ue(e) {
  switch (e) {
    case `query`:
      return `Q`;
    case `mutation`:
      return `M`;
    case `action`:
      return `A`;
    case `any`:
      return `?`;
  }
}
var We = class {
  constructor(e) {
    (Ve(this, `_onLogLineFuncs`),
      Ve(this, `_verbose`),
      (this._onLogLineFuncs = {}),
      (this._verbose = e.verbose));
  }
  addLogLineListener(e) {
    let t = Math.random().toString(36).substring(2, 15);
    for (let e = 0; e < 10 && this._onLogLineFuncs[t] !== void 0; e++)
      t = Math.random().toString(36).substring(2, 15);
    return (
      (this._onLogLineFuncs[t] = e),
      () => {
        delete this._onLogLineFuncs[t];
      }
    );
  }
  logVerbose(...e) {
    if (this._verbose)
      for (let t of Object.values(this._onLogLineFuncs))
        t(`debug`, `${new Date().toISOString()}`, ...e);
  }
  log(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`info`, ...e);
  }
  warn(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`warn`, ...e);
  }
  error(...e) {
    for (let t of Object.values(this._onLogLineFuncs)) t(`error`, ...e);
  }
};
function Ge(e) {
  let t = new We(e);
  return (
    t.addLogLineListener((e, ...t) => {
      switch (e) {
        case `debug`:
          console.debug(...t);
          break;
        case `info`:
          console.log(...t);
          break;
        case `warn`:
          console.warn(...t);
          break;
        case `error`:
          console.error(...t);
          break;
        default:
          console.log(...t);
      }
    }),
    t
  );
}
function Ke(e) {
  return new We(e);
}
function O(e, t, n, r, i) {
  let a = Ue(n);
  if (
    (typeof i == `object` &&
      (i = `ConvexError ${JSON.stringify(i.errorData, null, 2)}`),
    t === `info`)
  ) {
    let t = i.match(/^\[.*?\] /);
    if (t === null) {
      e.error(`[CONVEX ${a}(${r})] Could not parse console.log`);
      return;
    }
    let n = i.slice(1, t[0].length - 2),
      o = i.slice(t[0].length);
    e.log(`%c[CONVEX ${a}(${r})] [${n}]`, He, o);
  } else e.error(`[CONVEX ${a}(${r})] ${i}`);
}
function qe(e, t) {
  let n = `[CONVEX FATAL ERROR] ${t}`;
  return (e.error(n), Error(n));
}
function k(e, t, n) {
  return `[CONVEX ${Ue(e)}(${t})] ${n.errorMessage}
  Called by client`;
}
function Je(e, t) {
  return ((t.data = e.errorData), t);
}
function A(e) {
  let t = e.split(`:`),
    n,
    r;
  return (
    t.length === 1
      ? ((n = t[0]), (r = `default`))
      : ((n = t.slice(0, t.length - 1).join(`:`)), (r = t[t.length - 1])),
    n.endsWith(`.js`) && (n = n.slice(0, -3)),
    `${n}:${r}`
  );
}
function j(e, t) {
  return JSON.stringify({ udfPath: A(e), args: S(t) });
}
function Ye(e, t, n) {
  let { initialNumItems: r, id: i } = n;
  return JSON.stringify({
    type: `paginated`,
    udfPath: A(e),
    args: S(t),
    options: S({ initialNumItems: r, id: i }),
  });
}
var Xe = Object.defineProperty,
  Ze = (e, t, n) =>
    t in e
      ? Xe(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  M = (e, t, n) => Ze(e, typeof t == `symbol` ? t : t + ``, n),
  Qe = class {
    constructor() {
      (M(this, `nextQueryId`),
        M(this, `querySetVersion`),
        M(this, `querySet`),
        M(this, `queryIdToToken`),
        M(this, `identityVersion`),
        M(this, `auth`),
        M(this, `outstandingQueriesOlderThanRestart`),
        M(this, `outstandingAuthOlderThanRestart`),
        M(this, `paused`),
        M(this, `pendingQuerySetModifications`),
        (this.nextQueryId = 0),
        (this.querySetVersion = 0),
        (this.identityVersion = 0),
        (this.querySet = new Map()),
        (this.queryIdToToken = new Map()),
        (this.outstandingQueriesOlderThanRestart = new Set()),
        (this.outstandingAuthOlderThanRestart = !1),
        (this.paused = !1),
        (this.pendingQuerySetModifications = new Map()));
    }
    hasSyncedPastLastReconnect() {
      return (
        this.outstandingQueriesOlderThanRestart.size === 0 &&
        !this.outstandingAuthOlderThanRestart
      );
    }
    markAuthCompletion() {
      this.outstandingAuthOlderThanRestart = !1;
    }
    subscribe(e, t, n, r) {
      let i = A(e),
        a = j(i, t),
        o = this.querySet.get(a);
      if (o !== void 0)
        return (
          (o.numSubscribers += 1),
          {
            queryToken: a,
            modification: null,
            unsubscribe: () => this.removeSubscriber(a),
          }
        );
      {
        let e = this.nextQueryId++,
          o = {
            id: e,
            canonicalizedUdfPath: i,
            args: t,
            numSubscribers: 1,
            journal: n,
            componentPath: r,
          };
        (this.querySet.set(a, o), this.queryIdToToken.set(e, a));
        let s = this.querySetVersion,
          c = this.querySetVersion + 1,
          l = {
            type: `Add`,
            queryId: e,
            udfPath: i,
            args: [S(t)],
            journal: n,
            componentPath: r,
          };
        return (
          this.paused
            ? this.pendingQuerySetModifications.set(e, l)
            : (this.querySetVersion = c),
          {
            queryToken: a,
            modification: {
              type: `ModifyQuerySet`,
              baseVersion: s,
              newVersion: c,
              modifications: [l],
            },
            unsubscribe: () => this.removeSubscriber(a),
          }
        );
      }
    }
    transition(e) {
      for (let t of e.modifications)
        switch (t.type) {
          case `QueryUpdated`:
          case `QueryFailed`: {
            this.outstandingQueriesOlderThanRestart.delete(t.queryId);
            let e = t.journal;
            if (e !== void 0) {
              let n = this.queryIdToToken.get(t.queryId);
              n !== void 0 && (this.querySet.get(n).journal = e);
            }
            break;
          }
          case `QueryRemoved`:
            this.outstandingQueriesOlderThanRestart.delete(t.queryId);
            break;
          default:
            throw Error(`Invalid modification ${t.type}`);
        }
    }
    queryId(e, t) {
      let n = j(A(e), t),
        r = this.querySet.get(n);
      return r === void 0 ? null : r.id;
    }
    isCurrentOrNewerAuthVersion(e) {
      return e >= this.identityVersion;
    }
    getAuth() {
      return this.auth;
    }
    setAuth(e) {
      this.auth = { tokenType: `User`, value: e };
      let t = this.identityVersion;
      return (
        this.paused || (this.identityVersion = t + 1),
        { type: `Authenticate`, baseVersion: t, ...this.auth }
      );
    }
    setAdminAuth(e, t) {
      let n = { tokenType: `Admin`, value: e, impersonating: t };
      this.auth = n;
      let r = this.identityVersion;
      return (
        this.paused || (this.identityVersion = r + 1),
        { type: `Authenticate`, baseVersion: r, ...n }
      );
    }
    clearAuth() {
      ((this.auth = void 0), this.markAuthCompletion());
      let e = this.identityVersion;
      return (
        this.paused || (this.identityVersion = e + 1),
        { type: `Authenticate`, tokenType: `None`, baseVersion: e }
      );
    }
    hasAuth() {
      return !!this.auth;
    }
    isNewAuth(e) {
      return this.auth?.value !== e;
    }
    queryPath(e) {
      let t = this.queryIdToToken.get(e);
      return t ? this.querySet.get(t).canonicalizedUdfPath : null;
    }
    queryArgs(e) {
      let t = this.queryIdToToken.get(e);
      return t ? this.querySet.get(t).args : null;
    }
    queryToken(e) {
      return this.queryIdToToken.get(e) ?? null;
    }
    queryJournal(e) {
      return this.querySet.get(e)?.journal;
    }
    restart(e) {
      (this.unpause(), this.outstandingQueriesOlderThanRestart.clear());
      let t = [];
      for (let n of this.querySet.values()) {
        let r = {
          type: `Add`,
          queryId: n.id,
          udfPath: n.canonicalizedUdfPath,
          args: [S(n.args)],
          journal: n.journal,
          componentPath: n.componentPath,
        };
        (t.push(r),
          e.has(n.id) || this.outstandingQueriesOlderThanRestart.add(n.id));
      }
      this.querySetVersion = 1;
      let n = {
        type: `ModifyQuerySet`,
        baseVersion: 0,
        newVersion: 1,
        modifications: t,
      };
      if (!this.auth) return ((this.identityVersion = 0), [n, void 0]);
      this.outstandingAuthOlderThanRestart = !0;
      let r = { type: `Authenticate`, baseVersion: 0, ...this.auth };
      return ((this.identityVersion = 1), [n, r]);
    }
    pause() {
      this.paused = !0;
    }
    resume() {
      let e =
          this.pendingQuerySetModifications.size > 0
            ? {
                type: `ModifyQuerySet`,
                baseVersion: this.querySetVersion,
                newVersion: ++this.querySetVersion,
                modifications: Array.from(
                  this.pendingQuerySetModifications.values(),
                ),
              }
            : void 0,
        t =
          this.auth === void 0
            ? void 0
            : {
                type: `Authenticate`,
                baseVersion: this.identityVersion++,
                ...this.auth,
              };
      return (this.unpause(), [e, t]);
    }
    unpause() {
      ((this.paused = !1), this.pendingQuerySetModifications.clear());
    }
    removeSubscriber(e) {
      let t = this.querySet.get(e);
      if (t.numSubscribers > 1) return (--t.numSubscribers, null);
      {
        (this.querySet.delete(e),
          this.queryIdToToken.delete(t.id),
          this.outstandingQueriesOlderThanRestart.delete(t.id));
        let n = this.querySetVersion,
          r = this.querySetVersion + 1,
          i = { type: `Remove`, queryId: t.id };
        return (
          this.paused
            ? this.pendingQuerySetModifications.has(t.id)
              ? this.pendingQuerySetModifications.delete(t.id)
              : this.pendingQuerySetModifications.set(t.id, i)
            : (this.querySetVersion = r),
          {
            type: `ModifyQuerySet`,
            baseVersion: n,
            newVersion: r,
            modifications: [i],
          }
        );
      }
    }
  },
  $e = Object.defineProperty,
  et = (e, t, n) =>
    t in e
      ? $e(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  N = (e, t, n) => et(e, typeof t == `symbol` ? t : t + ``, n),
  tt = class {
    constructor(e, t) {
      ((this.logger = e),
        (this.markConnectionStateDirty = t),
        N(this, `inflightRequests`),
        N(this, `requestsOlderThanRestart`),
        N(this, `inflightMutationsCount`, 0),
        N(this, `inflightActionsCount`, 0),
        (this.inflightRequests = new Map()),
        (this.requestsOlderThanRestart = new Set()));
    }
    request(e, t) {
      let n = new Promise((n) => {
        let r = t ? `Requested` : `NotSent`;
        (this.inflightRequests.set(e.requestId, {
          message: e,
          status: { status: r, requestedAt: new Date(), onResult: n },
        }),
          e.type === `Mutation`
            ? this.inflightMutationsCount++
            : e.type === `Action` && this.inflightActionsCount++);
      });
      return (this.markConnectionStateDirty(), n);
    }
    onResponse(e) {
      let t = this.inflightRequests.get(e.requestId);
      if (t === void 0 || t.status.status === `Completed`) return null;
      let n = t.message.type === `Mutation` ? `mutation` : `action`,
        r = t.message.udfPath;
      for (let t of e.logLines) O(this.logger, `info`, n, r, t);
      let i = t.status,
        a,
        o;
      if (e.success)
        ((a = { success: !0, logLines: e.logLines, value: v(e.result) }),
          (o = () => i.onResult(a)));
      else {
        let t = e.result,
          { errorData: s } = e;
        (O(this.logger, `error`, n, r, t),
          (a = {
            success: !1,
            errorMessage: t,
            errorData: s === void 0 ? void 0 : v(s),
            logLines: e.logLines,
          }),
          (o = () => i.onResult(a)));
      }
      return e.type === `ActionResponse` || !e.success
        ? (o(),
          this.inflightRequests.delete(e.requestId),
          this.requestsOlderThanRestart.delete(e.requestId),
          t.message.type === `Action`
            ? this.inflightActionsCount--
            : t.message.type === `Mutation` && this.inflightMutationsCount--,
          this.markConnectionStateDirty(),
          { requestId: e.requestId, result: a })
        : ((t.status = {
            status: `Completed`,
            result: a,
            ts: e.ts,
            onResolve: o,
          }),
          null);
    }
    removeCompleted(e) {
      let t = new Map();
      for (let [n, r] of this.inflightRequests.entries()) {
        let i = r.status;
        i.status === `Completed` &&
          i.ts.lessThanOrEqual(e) &&
          (i.onResolve(),
          t.set(n, i.result),
          r.message.type === `Mutation`
            ? this.inflightMutationsCount--
            : r.message.type === `Action` && this.inflightActionsCount--,
          this.inflightRequests.delete(n),
          this.requestsOlderThanRestart.delete(n));
      }
      return (t.size > 0 && this.markConnectionStateDirty(), t);
    }
    restart() {
      this.requestsOlderThanRestart = new Set(this.inflightRequests.keys());
      let e = [];
      for (let [t, n] of this.inflightRequests) {
        if (n.status.status === `NotSent`) {
          ((n.status.status = `Requested`), e.push(n.message));
          continue;
        }
        if (n.message.type === `Mutation`) e.push(n.message);
        else if (n.message.type === `Action`) {
          if (
            (this.inflightRequests.delete(t),
            this.requestsOlderThanRestart.delete(t),
            this.inflightActionsCount--,
            n.status.status === `Completed`)
          )
            throw Error(`Action should never be in 'Completed' state`);
          n.status.onResult({
            success: !1,
            errorMessage: `Connection lost while action was in flight`,
            logLines: [],
          });
        }
      }
      return (this.markConnectionStateDirty(), e);
    }
    resume() {
      let e = [];
      for (let [, t] of this.inflightRequests)
        if (t.status.status === `NotSent`) {
          ((t.status.status = `Requested`), e.push(t.message));
          continue;
        }
      return e;
    }
    hasIncompleteRequests() {
      for (let e of this.inflightRequests.values())
        if (e.status.status === `Requested`) return !0;
      return !1;
    }
    hasInflightRequests() {
      return this.inflightRequests.size > 0;
    }
    hasSyncedPastLastReconnect() {
      return this.requestsOlderThanRestart.size === 0;
    }
    timeOfOldestInflightRequest() {
      if (this.inflightRequests.size === 0) return null;
      let e = Date.now();
      for (let t of this.inflightRequests.values())
        t.status.status !== `Completed` &&
          t.status.requestedAt.getTime() < e &&
          (e = t.status.requestedAt.getTime());
      return new Date(e);
    }
    inflightMutations() {
      return this.inflightMutationsCount;
    }
    inflightActions() {
      return this.inflightActionsCount;
    }
  },
  P = Symbol.for(`functionName`),
  nt = Symbol.for(`toReferencePath`);
function rt(e) {
  return e[nt] ?? null;
}
function it(e) {
  return e.startsWith(`function://`);
}
function at(e) {
  let t;
  if (typeof e == `string`) t = it(e) ? { functionHandle: e } : { name: e };
  else if (e[P]) t = { name: e[P] };
  else {
    let n = rt(e);
    if (!n) throw Error(`${e} is not a functionReference`);
    t = { reference: n };
  }
  return t;
}
function F(e) {
  let t = at(e);
  if (t.name === void 0)
    throw t.functionHandle === void 0
      ? t.reference === void 0
        ? Error(
            `Expected function reference like "api.file.func" or "internal.file.func", but received ${JSON.stringify(t)}`,
          )
        : Error(
            `Expected function reference in the current component like "api.file.func" or "internal.file.func", but received reference ${t.reference}`,
          )
      : Error(
          `Expected function reference like "api.file.func" or "internal.file.func", but received function handle ${t.functionHandle}`,
        );
  if (typeof e == `string`) return e;
  let n = e[P];
  if (!n) throw Error(`${e} is not a functionReference`);
  return n;
}
function I(e) {
  return { [P]: e };
}
function ot(e = []) {
  return new Proxy(
    {},
    {
      get(t, n) {
        if (typeof n == `string`) return ot([...e, n]);
        if (n === P) {
          if (e.length < 2) {
            let t = [`api`, ...e].join(`.`);
            throw Error(
              `API path is expected to be of the form \`api.moduleName.functionName\`. Found: \`${t}\``,
            );
          }
          let t = e.slice(0, -1).join(`/`),
            n = e[e.length - 1];
          return n === `default` ? t : t + `:` + n;
        } else if (n === Symbol.toStringTag) return `FunctionReference`;
        else return;
      },
    },
  );
}
var st = ot(),
  ct = Object.defineProperty,
  lt = (e, t, n) =>
    t in e
      ? ct(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  L = (e, t, n) => lt(e, typeof t == `symbol` ? t : t + ``, n),
  ut = class e {
    constructor(e) {
      (L(this, `queryResults`),
        L(this, `modifiedQueries`),
        (this.queryResults = e),
        (this.modifiedQueries = []));
    }
    getQuery(t, ...n) {
      let r = m(n[0]),
        i = F(t),
        a = this.queryResults.get(j(i, r));
      if (a !== void 0) return e.queryValue(a.result);
    }
    getAllQueries(t) {
      let n = [],
        r = F(t);
      for (let t of this.queryResults.values())
        t.udfPath === A(r) &&
          n.push({ args: t.args, value: e.queryValue(t.result) });
      return n;
    }
    setQuery(e, t, n) {
      let r = m(t),
        i = F(e),
        a = j(i, r),
        o;
      o = n === void 0 ? void 0 : { success: !0, value: n, logLines: [] };
      let s = { udfPath: i, args: r, result: o };
      (this.queryResults.set(a, s), this.modifiedQueries.push(a));
    }
    static queryValue(e) {
      if (e !== void 0 && e.success) return e.value;
    }
  },
  dt = class {
    constructor() {
      (L(this, `queryResults`),
        L(this, `optimisticUpdates`),
        (this.queryResults = new Map()),
        (this.optimisticUpdates = []));
    }
    ingestQueryResultsFromServer(e, t) {
      this.optimisticUpdates = this.optimisticUpdates.filter(
        (e) => !t.has(e.mutationId),
      );
      let n = this.queryResults;
      this.queryResults = new Map(e);
      let r = new ut(this.queryResults);
      for (let e of this.optimisticUpdates) e.update(r);
      let i = [];
      for (let [e, t] of this.queryResults) {
        let r = n.get(e);
        (r === void 0 || r.result !== t.result) && i.push(e);
      }
      return i;
    }
    applyOptimisticUpdate(e, t) {
      this.optimisticUpdates.push({ update: e, mutationId: t });
      let n = new ut(this.queryResults);
      return (e(n), n.modifiedQueries);
    }
    rawQueryResult(e) {
      let t = this.queryResults.get(e);
      if (t !== void 0) return t.result;
    }
    queryResult(e) {
      let t = this.queryResults.get(e);
      if (t === void 0) return;
      let n = t.result;
      if (n !== void 0) {
        if (n.success) return n.value;
        throw n.errorData === void 0
          ? Error(k(`query`, t.udfPath, n))
          : Je(n, new D(k(`query`, t.udfPath, n)));
      }
    }
    hasQueryResult(e) {
      return this.queryResults.get(e) !== void 0;
    }
    queryLogs(e) {
      return this.queryResults.get(e)?.result?.logLines;
    }
  },
  ft = Object.defineProperty,
  pt = (e, t, n) =>
    t in e
      ? ft(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  R = (e, t, n) => pt(e, typeof t == `symbol` ? t : t + ``, n),
  z = class e {
    constructor(e, t) {
      (R(this, `low`),
        R(this, `high`),
        R(this, `__isUnsignedLong__`),
        (this.low = e | 0),
        (this.high = t | 0),
        (this.__isUnsignedLong__ = !0));
    }
    static isLong(e) {
      return (e && e.__isUnsignedLong__) === !0;
    }
    static fromBytesLE(t) {
      return new e(
        t[0] | (t[1] << 8) | (t[2] << 16) | (t[3] << 24),
        t[4] | (t[5] << 8) | (t[6] << 16) | (t[7] << 24),
      );
    }
    toBytesLE() {
      let e = this.high,
        t = this.low;
      return [
        t & 255,
        (t >>> 8) & 255,
        (t >>> 16) & 255,
        t >>> 24,
        e & 255,
        (e >>> 8) & 255,
        (e >>> 16) & 255,
        e >>> 24,
      ];
    }
    static fromNumber(t) {
      return isNaN(t) || t < 0
        ? mt
        : t >= gt
          ? _t
          : new e((t % B) | 0, (t / B) | 0);
    }
    toString() {
      return (BigInt(this.high) * BigInt(B) + BigInt(this.low)).toString();
    }
    equals(t) {
      return (
        e.isLong(t) || (t = e.fromValue(t)),
        this.high >>> 31 == 1 && t.high >>> 31 == 1
          ? !1
          : this.high === t.high && this.low === t.low
      );
    }
    notEquals(e) {
      return !this.equals(e);
    }
    comp(t) {
      return (
        e.isLong(t) || (t = e.fromValue(t)),
        this.equals(t)
          ? 0
          : t.high >>> 0 > this.high >>> 0 ||
              (t.high === this.high && t.low >>> 0 > this.low >>> 0)
            ? -1
            : 1
      );
    }
    lessThanOrEqual(e) {
      return this.comp(e) <= 0;
    }
    static fromValue(t) {
      return typeof t == `number` ? e.fromNumber(t) : new e(t.low, t.high);
    }
  },
  mt = new z(0, 0),
  ht = 65536,
  B = ht * ht,
  gt = B * B,
  _t = new z(-1, -1),
  vt = Object.defineProperty,
  yt = (e, t, n) =>
    t in e
      ? vt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  V = (e, t, n) => yt(e, typeof t == `symbol` ? t : t + ``, n),
  bt = class {
    constructor(e, t) {
      (V(this, `version`),
        V(this, `remoteQuerySet`),
        V(this, `queryPath`),
        V(this, `logger`),
        (this.version = { querySet: 0, ts: z.fromNumber(0), identity: 0 }),
        (this.remoteQuerySet = new Map()),
        (this.queryPath = e),
        (this.logger = t));
    }
    transition(e) {
      let t = e.startVersion;
      if (
        this.version.querySet !== t.querySet ||
        this.version.ts.notEquals(t.ts) ||
        this.version.identity !== t.identity
      )
        throw Error(
          `Invalid start version: ${t.ts.toString()}:${t.querySet}:${t.identity}, transitioning from ${this.version.ts.toString()}:${this.version.querySet}:${this.version.identity}`,
        );
      for (let t of e.modifications)
        switch (t.type) {
          case `QueryUpdated`: {
            let e = this.queryPath(t.queryId);
            if (e)
              for (let n of t.logLines) O(this.logger, `info`, `query`, e, n);
            let n = v(t.value ?? null);
            this.remoteQuerySet.set(t.queryId, {
              success: !0,
              value: n,
              logLines: t.logLines,
            });
            break;
          }
          case `QueryFailed`: {
            let e = this.queryPath(t.queryId);
            if (e)
              for (let n of t.logLines) O(this.logger, `info`, `query`, e, n);
            let { errorData: n } = t;
            this.remoteQuerySet.set(t.queryId, {
              success: !1,
              errorMessage: t.errorMessage,
              errorData: n === void 0 ? void 0 : v(n),
              logLines: t.logLines,
            });
            break;
          }
          case `QueryRemoved`:
            this.remoteQuerySet.delete(t.queryId);
            break;
          default:
            throw Error(`Invalid modification ${t.type}`);
        }
      this.version = e.endVersion;
    }
    remoteQueryResults() {
      return this.remoteQuerySet;
    }
    timestamp() {
      return this.version.ts;
    }
  };
function H(e) {
  let t = u(e);
  return z.fromBytesLE(Array.from(t));
}
function xt(e) {
  return p(new Uint8Array(e.toBytesLE()));
}
function St(e) {
  switch (e.type) {
    case `FatalError`:
    case `AuthError`:
    case `ActionResponse`:
    case `TransitionChunk`:
    case `Ping`:
      return { ...e };
    case `MutationResponse`:
      return e.success ? { ...e, ts: H(e.ts) } : { ...e };
    case `Transition`:
      return {
        ...e,
        startVersion: { ...e.startVersion, ts: H(e.startVersion.ts) },
        endVersion: { ...e.endVersion, ts: H(e.endVersion.ts) },
      };
    default:
  }
}
function Ct(e) {
  switch (e.type) {
    case `Authenticate`:
    case `ModifyQuerySet`:
    case `Mutation`:
    case `Action`:
    case `Event`:
      return { ...e };
    case `Connect`:
      return e.maxObservedTimestamp === void 0
        ? { ...e, maxObservedTimestamp: void 0 }
        : { ...e, maxObservedTimestamp: xt(e.maxObservedTimestamp) };
    default:
  }
}
var wt = Object.defineProperty,
  Tt = (e, t, n) =>
    t in e
      ? wt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  U = (e, t, n) => Tt(e, typeof t == `symbol` ? t : t + ``, n),
  Et = 1e3,
  Dt = 1001,
  Ot = 1005,
  kt = 4040,
  W;
function G() {
  return (
    W === void 0 && (W = Date.now()),
    typeof performance > `u` || !performance.now
      ? Date.now()
      : Math.round(W + performance.now())
  );
}
function At() {
  return `t=${Math.round((G() - W) / 100) / 10}s`;
}
var jt = {
  InternalServerError: { timeout: 1e3 },
  SubscriptionsWorkerFullError: { timeout: 3e3 },
  TooManyConcurrentRequests: { timeout: 3e3 },
  CommitterFullError: { timeout: 3e3 },
  AwsTooManyRequestsException: { timeout: 3e3 },
  ExecuteFullError: { timeout: 3e3 },
  SystemTimeoutError: { timeout: 3e3 },
  ExpiredInQueue: { timeout: 3e3 },
  VectorIndexesUnavailable: { timeout: 1e3 },
  SearchIndexesUnavailable: { timeout: 1e3 },
  TableSummariesUnavailable: { timeout: 1e3 },
  VectorIndexTooLarge: { timeout: 3e3 },
  SearchIndexTooLarge: { timeout: 3e3 },
  TooManyWritesInTimePeriod: { timeout: 3e3 },
};
function Mt(e) {
  if (e === void 0) return `Unknown`;
  for (let t of Object.keys(jt)) if (e.startsWith(t)) return t;
  return `Unknown`;
}
var Nt = class {
  constructor(e, t, n, r, i, a) {
    ((this.markConnectionStateDirty = i),
      (this.debug = a),
      U(this, `socket`),
      U(this, `connectionCount`),
      U(this, `_hasEverConnected`, !1),
      U(this, `lastCloseReason`),
      U(this, `transitionChunkBuffer`, null),
      U(this, `defaultInitialBackoff`),
      U(this, `maxBackoff`),
      U(this, `retries`),
      U(this, `serverInactivityThreshold`),
      U(this, `reconnectDueToServerInactivityTimeout`),
      U(this, `scheduledReconnect`, null),
      U(this, `networkOnlineHandler`, null),
      U(this, `pendingNetworkRecoveryInfo`, null),
      U(this, `uri`),
      U(this, `onOpen`),
      U(this, `onResume`),
      U(this, `onMessage`),
      U(this, `webSocketConstructor`),
      U(this, `logger`),
      U(this, `onServerDisconnectError`),
      (this.webSocketConstructor = n),
      (this.socket = { state: `disconnected` }),
      (this.connectionCount = 0),
      (this.lastCloseReason = `InitialConnect`),
      (this.defaultInitialBackoff = 1e3),
      (this.maxBackoff = 16e3),
      (this.retries = 0),
      (this.serverInactivityThreshold = 6e4),
      (this.reconnectDueToServerInactivityTimeout = null),
      (this.uri = e),
      (this.onOpen = t.onOpen),
      (this.onResume = t.onResume),
      (this.onMessage = t.onMessage),
      (this.onServerDisconnectError = t.onServerDisconnectError),
      (this.logger = r),
      this.setupNetworkListener(),
      this.connect());
  }
  setSocketState(e) {
    ((this.socket = e),
      this._logVerbose(
        `socket state changed: ${this.socket.state}, paused: ${`paused` in this.socket ? this.socket.paused : void 0}`,
      ),
      this.markConnectionStateDirty());
  }
  setupNetworkListener() {
    typeof window > `u` ||
      typeof window.addEventListener != `function` ||
      (this.networkOnlineHandler === null &&
        ((this.networkOnlineHandler = () => {
          (this._logVerbose(`network online event detected`),
            this.tryReconnectImmediately());
        }),
        window.addEventListener(`online`, this.networkOnlineHandler),
        this._logVerbose(`network online event listener registered`)));
  }
  cleanupNetworkListener() {
    this.networkOnlineHandler &&
      typeof window < `u` &&
      typeof window.removeEventListener == `function` &&
      (window.removeEventListener(`online`, this.networkOnlineHandler),
      (this.networkOnlineHandler = null),
      this._logVerbose(`network online event listener removed`));
  }
  assembleTransition(e) {
    if (
      e.partNumber < 0 ||
      e.partNumber >= e.totalParts ||
      e.totalParts === 0 ||
      (this.transitionChunkBuffer &&
        (this.transitionChunkBuffer.totalParts !== e.totalParts ||
          this.transitionChunkBuffer.transitionId !== e.transitionId))
    )
      throw (
        (this.transitionChunkBuffer = null),
        Error(`Invalid TransitionChunk`)
      );
    if (
      (this.transitionChunkBuffer === null &&
        (this.transitionChunkBuffer = {
          chunks: [],
          totalParts: e.totalParts,
          transitionId: e.transitionId,
        }),
      e.partNumber !== this.transitionChunkBuffer.chunks.length)
    ) {
      let t = this.transitionChunkBuffer.chunks.length;
      throw (
        (this.transitionChunkBuffer = null),
        Error(
          `TransitionChunk received out of order: expected part ${t}, got ${e.partNumber}`,
        )
      );
    }
    if (
      (this.transitionChunkBuffer.chunks.push(e.chunk),
      this.transitionChunkBuffer.chunks.length === e.totalParts)
    ) {
      let e = this.transitionChunkBuffer.chunks.join(``);
      this.transitionChunkBuffer = null;
      let t = St(JSON.parse(e));
      if (t.type !== `Transition`)
        throw Error(
          `Expected Transition, got ${t.type} after assembling chunks`,
        );
      return t;
    }
    return null;
  }
  connect() {
    if (this.socket.state === `terminated`) return;
    if (this.socket.state !== `disconnected` && this.socket.state !== `stopped`)
      throw Error(
        `Didn't start connection from disconnected state: ` + this.socket.state,
      );
    let e = new this.webSocketConstructor(this.uri);
    (this._logVerbose(`constructed WebSocket`),
      this.setSocketState({ state: `connecting`, ws: e, paused: `no` }),
      this.resetServerInactivityTimeout(),
      (e.onopen = () => {
        if (
          (this.logger.logVerbose(`begin ws.onopen`),
          this.socket.state !== `connecting`)
        )
          throw Error(`onopen called with socket not in connecting state`);
        if (
          (this.setSocketState({
            state: `ready`,
            ws: e,
            paused: this.socket.paused === `yes` ? `uninitialized` : `no`,
          }),
          this.resetServerInactivityTimeout(),
          this.socket.paused === `no` &&
            ((this._hasEverConnected = !0),
            this.onOpen({
              connectionCount: this.connectionCount,
              lastCloseReason: this.lastCloseReason,
              clientTs: G(),
            })),
          this.lastCloseReason !== `InitialConnect` &&
            (this.lastCloseReason
              ? this.logger.log(
                  `WebSocket reconnected at`,
                  At(),
                  `after disconnect due to`,
                  this.lastCloseReason,
                )
              : this.logger.log(`WebSocket reconnected at`, At())),
          (this.connectionCount += 1),
          (this.lastCloseReason = null),
          this.pendingNetworkRecoveryInfo !== null)
        ) {
          let { timeSavedMs: e } = this.pendingNetworkRecoveryInfo;
          ((this.pendingNetworkRecoveryInfo = null),
            this.sendMessage({
              type: `Event`,
              eventType: `NetworkRecoveryReconnect`,
              event: { timeSavedMs: e },
            }),
            this.logger.log(
              `Network recovery reconnect saved ~${Math.round(e / 1e3)}s of waiting`,
            ));
        }
      }),
      (e.onerror = (e) => {
        this.transitionChunkBuffer = null;
        let t = e.message;
        t && this.logger.log(`WebSocket error message: ${t}`);
      }),
      (e.onmessage = (e) => {
        this.resetServerInactivityTimeout();
        let t = e.data.length,
          n = St(JSON.parse(e.data));
        if (
          (this._logVerbose(`received ws message with type ${n.type}`),
          n.type !== `Ping`)
        ) {
          if (n.type === `TransitionChunk`) {
            let e = this.assembleTransition(n);
            if (!e) return;
            ((n = e),
              this._logVerbose(`assembled full ws message of type ${n.type}`));
          }
          (this.transitionChunkBuffer !== null &&
            ((this.transitionChunkBuffer = null),
            this.logger.log(
              `Received unexpected ${n.type} while buffering TransitionChunks`,
            )),
            n.type === `Transition` &&
              this.reportLargeTransition({ messageLength: t, transition: n }),
            this.onMessage(n).hasSyncedPastLastReconnect &&
              ((this.retries = 0), this.markConnectionStateDirty()));
        }
      }),
      (e.onclose = (e) => {
        if (
          (this._logVerbose(`begin ws.onclose`),
          (this.transitionChunkBuffer = null),
          this.lastCloseReason === null &&
            (this.lastCloseReason = e.reason || `closed with code ${e.code}`),
          e.code !== Et && e.code !== Dt && e.code !== Ot && e.code !== kt)
        ) {
          let t = `WebSocket closed with code ${e.code}`;
          (e.reason && (t += `: ${e.reason}`),
            this.logger.log(t),
            this.onServerDisconnectError &&
              e.reason &&
              this.onServerDisconnectError(t));
        }
        let t = Mt(e.reason);
        this.scheduleReconnect(t);
      }));
  }
  socketState() {
    return this.socket.state;
  }
  sendMessage(e) {
    let t = {
      type: e.type,
      ...(e.type === `Authenticate` && e.tokenType === `User`
        ? { value: `...${e.value.slice(-7)}` }
        : {}),
    };
    if (this.socket.state === `ready` && this.socket.paused === `no`) {
      let n = Ct(e),
        r = JSON.stringify(n),
        i = !1;
      try {
        (this.socket.ws.send(r), (i = !0));
      } catch (e) {
        (this.logger.log(
          `Failed to send message on WebSocket, reconnecting: ${e}`,
        ),
          this.closeAndReconnect(`FailedToSendMessage`));
      }
      return (
        this._logVerbose(
          `${i ? `sent` : `failed to send`} message with type ${e.type}: ${JSON.stringify(t)}`,
        ),
        !0
      );
    }
    return (
      this._logVerbose(
        `message not sent (socket state: ${this.socket.state}, paused: ${`paused` in this.socket ? this.socket.paused : void 0}): ${JSON.stringify(t)}`,
      ),
      !1
    );
  }
  resetServerInactivityTimeout() {
    this.socket.state !== `terminated` &&
      (this.reconnectDueToServerInactivityTimeout !== null &&
        (clearTimeout(this.reconnectDueToServerInactivityTimeout),
        (this.reconnectDueToServerInactivityTimeout = null)),
      (this.reconnectDueToServerInactivityTimeout = setTimeout(() => {
        this.closeAndReconnect(`InactiveServer`);
      }, this.serverInactivityThreshold)));
  }
  scheduleReconnect(e) {
    ((this.scheduledReconnect &&=
      (clearTimeout(this.scheduledReconnect.timeout), null)),
      (this.socket = { state: `disconnected` }));
    let t = this.nextBackoff(e);
    (this.markConnectionStateDirty(),
      this.logger.log(`Attempting reconnect in ${Math.round(t)}ms`));
    let n = G(),
      r = setTimeout(() => {
        this.scheduledReconnect?.timeout === r &&
          ((this.scheduledReconnect = null), this.connect());
      }, t);
    this.scheduledReconnect = { timeout: r, scheduledAt: n, backoffMs: t };
  }
  closeAndReconnect(e) {
    switch (
      (this._logVerbose(`begin closeAndReconnect with reason ${e}`),
      this.socket.state)
    ) {
      case `disconnected`:
      case `terminated`:
      case `stopped`:
        return;
      case `connecting`:
      case `ready`:
        ((this.lastCloseReason = e),
          this.close(),
          this.scheduleReconnect(`client`));
        return;
      default:
        this.socket;
    }
  }
  close() {
    switch (((this.transitionChunkBuffer = null), this.socket.state)) {
      case `disconnected`:
      case `terminated`:
      case `stopped`:
        return Promise.resolve();
      case `connecting`: {
        let e = this.socket.ws;
        return (
          (e.onmessage = (e) => {
            this._logVerbose(`Ignoring message received after close`);
          }),
          new Promise((t) => {
            ((e.onclose = () => {
              (this._logVerbose(`Closed after connecting`), t());
            }),
              (e.onopen = () => {
                (this._logVerbose(`Opened after connecting`), e.close());
              }));
          })
        );
      }
      case `ready`: {
        this._logVerbose(`ws.close called`);
        let e = this.socket.ws;
        e.onmessage = (e) => {
          this._logVerbose(`Ignoring message received after close`);
        };
        let t = new Promise((t) => {
          e.onclose = () => {
            t();
          };
        });
        return (e.close(), t);
      }
      default:
        return (this.socket, Promise.resolve());
    }
  }
  terminate() {
    switch (
      (this.reconnectDueToServerInactivityTimeout &&
        clearTimeout(this.reconnectDueToServerInactivityTimeout),
      (this.scheduledReconnect &&=
        (clearTimeout(this.scheduledReconnect.timeout), null)),
      this.cleanupNetworkListener(),
      this.socket.state)
    ) {
      case `terminated`:
      case `stopped`:
      case `disconnected`:
      case `connecting`:
      case `ready`: {
        let e = this.close();
        return (this.setSocketState({ state: `terminated` }), e);
      }
      default:
        throw (
          this.socket,
          Error(`Invalid websocket state: ${this.socket.state}`)
        );
    }
  }
  stop() {
    switch (this.socket.state) {
      case `terminated`:
        return Promise.resolve();
      case `connecting`:
      case `stopped`:
      case `disconnected`:
      case `ready`: {
        this.cleanupNetworkListener();
        let e = this.close();
        return ((this.socket = { state: `stopped` }), e);
      }
      default:
        return (this.socket, Promise.resolve());
    }
  }
  tryRestart() {
    switch (this.socket.state) {
      case `stopped`:
        break;
      case `terminated`:
      case `connecting`:
      case `ready`:
      case `disconnected`:
        this.logger.logVerbose(`Restart called without stopping first`);
        return;
      default:
        this.socket;
    }
    (this.setupNetworkListener(), this.connect());
  }
  pause() {
    switch (this.socket.state) {
      case `disconnected`:
      case `stopped`:
      case `terminated`:
        return;
      case `connecting`:
      case `ready`:
        this.socket = { ...this.socket, paused: `yes` };
        return;
      default:
        this.socket;
        return;
    }
  }
  tryReconnectImmediately() {
    if (
      (this._logVerbose(`tryReconnectImmediately called`),
      this.socket.state !== `disconnected`)
    ) {
      this._logVerbose(
        `tryReconnectImmediately called but socket state is ${this.socket.state}, no action taken`,
      );
      return;
    }
    let e = null;
    if (this.scheduledReconnect) {
      let t = G() - this.scheduledReconnect.scheduledAt;
      ((e = Math.max(0, this.scheduledReconnect.backoffMs - t)),
        this._logVerbose(
          `would have waited ${Math.round(e)}ms more (backoff was ${Math.round(this.scheduledReconnect.backoffMs)}ms, elapsed ${Math.round(t)}ms)`,
        ),
        clearTimeout(this.scheduledReconnect.timeout),
        (this.scheduledReconnect = null),
        this._logVerbose(`canceled scheduled reconnect`));
    }
    (this.logger.log(`Network recovery detected, reconnecting immediately`),
      (this.pendingNetworkRecoveryInfo =
        e === null ? null : { timeSavedMs: e }),
      this.connect());
  }
  resume() {
    switch (this.socket.state) {
      case `connecting`:
        this.socket = { ...this.socket, paused: `no` };
        return;
      case `ready`:
        this.socket.paused === `uninitialized`
          ? ((this.socket = { ...this.socket, paused: `no` }),
            this.onOpen({
              connectionCount: this.connectionCount,
              lastCloseReason: this.lastCloseReason,
              clientTs: G(),
            }))
          : this.socket.paused === `yes` &&
            ((this.socket = { ...this.socket, paused: `no` }), this.onResume());
        return;
      case `terminated`:
      case `stopped`:
      case `disconnected`:
        return;
      default:
        this.socket;
    }
    this.connect();
  }
  connectionState() {
    return {
      isConnected: this.socket.state === `ready`,
      hasEverConnected: this._hasEverConnected,
      connectionCount: this.connectionCount,
      connectionRetries: this.retries,
    };
  }
  _logVerbose(e) {
    this.logger.logVerbose(e);
  }
  nextBackoff(e) {
    let t =
      (e === `client`
        ? 100
        : e === `Unknown`
          ? this.defaultInitialBackoff
          : jt[e].timeout) *
      2 ** this.retries;
    this.retries += 1;
    let n = Math.min(t, this.maxBackoff);
    return n + n * (Math.random() - 0.5);
  }
  reportLargeTransition({ transition: e, messageLength: t }) {
    if (e.clientClockSkew === void 0 || e.serverTs === void 0) return;
    let n = G() - e.clientClockSkew - e.serverTs / 1e6,
      r = `${Math.round(n)}ms`,
      i = `${Math.round(t / 1e4) / 100}MB`,
      a = t / (n / 1e3),
      o = `${Math.round(a / 1e4) / 100}MB per second`;
    (this._logVerbose(`received ${i} transition in ${r} at ${o}`),
      t > 2e7
        ? this.logger.log(
            `received query results totaling more that 20MB (${i}) which will take a long time to download on slower connections`,
          )
        : n > 2e4 &&
          this.logger.log(
            `received query results totaling ${i} which took more than 20s to arrive (${r})`,
          ),
      this.debug &&
        this.sendMessage({
          type: `Event`,
          eventType: `ClientReceivedTransition`,
          event: { transitionTransitTime: n, messageLength: t },
        }));
  }
};
function Pt() {
  return Ft();
}
function Ft() {
  return `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`.replace(/[xy]/g, (e) => {
    let t = (Math.random() * 16) | 0;
    return (e === `x` ? t : (t & 3) | 8).toString(16);
  });
}
var K = class extends Error {};
K.prototype.name = `InvalidTokenError`;
function It(e) {
  return decodeURIComponent(
    atob(e).replace(/(.)/g, (e, t) => {
      let n = t.charCodeAt(0).toString(16).toUpperCase();
      return (n.length < 2 && (n = `0` + n), `%` + n);
    }),
  );
}
function Lt(e) {
  let t = e.replace(/-/g, `+`).replace(/_/g, `/`);
  switch (t.length % 4) {
    case 0:
      break;
    case 2:
      t += `==`;
      break;
    case 3:
      t += `=`;
      break;
    default:
      throw Error(`base64 string is not of the correct length`);
  }
  try {
    return It(t);
  } catch {
    return atob(t);
  }
}
function Rt(e, t) {
  if (typeof e != `string`)
    throw new K(`Invalid token specified: must be a string`);
  t ||= {};
  let n = t.header === !0 ? 0 : 1,
    r = e.split(`.`)[n];
  if (typeof r != `string`)
    throw new K(`Invalid token specified: missing part #${n + 1}`);
  let i;
  try {
    i = Lt(r);
  } catch (e) {
    throw new K(
      `Invalid token specified: invalid base64 for part #${n + 1} (${e.message})`,
    );
  }
  try {
    return JSON.parse(i);
  } catch (e) {
    throw new K(
      `Invalid token specified: invalid json for part #${n + 1} (${e.message})`,
    );
  }
}
var zt = Object.defineProperty,
  Bt = (e, t, n) =>
    t in e
      ? zt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  q = (e, t, n) => Bt(e, typeof t == `symbol` ? t : t + ``, n),
  Vt = 480 * 60 * 60 * 1e3,
  Ht = 2,
  Ut = class {
    constructor(e, t, n) {
      (q(this, `authState`, { state: `noAuth` }),
        q(this, `configVersion`, 0),
        q(this, `syncState`),
        q(this, `authenticate`),
        q(this, `stopSocket`),
        q(this, `tryRestartSocket`),
        q(this, `pauseSocket`),
        q(this, `resumeSocket`),
        q(this, `clearAuth`),
        q(this, `logger`),
        q(this, `refreshTokenLeewaySeconds`),
        q(this, `tokenConfirmationAttempts`, 0),
        (this.syncState = e),
        (this.authenticate = t.authenticate),
        (this.stopSocket = t.stopSocket),
        (this.tryRestartSocket = t.tryRestartSocket),
        (this.pauseSocket = t.pauseSocket),
        (this.resumeSocket = t.resumeSocket),
        (this.clearAuth = t.clearAuth),
        (this.logger = n.logger),
        (this.refreshTokenLeewaySeconds = n.refreshTokenLeewaySeconds));
    }
    async setConfig(e, t) {
      (this.resetAuthState(),
        this._logVerbose(`pausing WS for auth token fetch`),
        this.pauseSocket());
      let n = await this.fetchTokenAndGuardAgainstRace(e, {
        forceRefreshToken: !1,
      });
      n.isFromOutdatedConfig ||
        (n.value
          ? (this.setAuthState({
              state: `waitingForServerConfirmationOfCachedToken`,
              config: { fetchToken: e, onAuthChange: t },
              hasRetried: !1,
            }),
            this.authenticate(n.value))
          : (this.setAuthState({
              state: `initialRefetch`,
              config: { fetchToken: e, onAuthChange: t },
            }),
            await this.refetchToken()),
        this._logVerbose(`resuming WS after auth token fetch`),
        this.resumeSocket());
    }
    onTransition(e) {
      if (
        this.syncState.isCurrentOrNewerAuthVersion(e.endVersion.identity) &&
        !(e.endVersion.identity <= e.startVersion.identity)
      ) {
        if (
          this.authState.state === `waitingForServerConfirmationOfCachedToken`
        ) {
          (this._logVerbose(`server confirmed auth token is valid`),
            this.refetchToken(),
            this.authState.config.onAuthChange(!0));
          return;
        }
        this.authState.state === `waitingForServerConfirmationOfFreshToken` &&
          (this._logVerbose(`server confirmed new auth token is valid`),
          this.scheduleTokenRefetch(this.authState.token),
          (this.tokenConfirmationAttempts = 0),
          this.authState.hadAuth || this.authState.config.onAuthChange(!0));
      }
    }
    onAuthError(e) {
      if (
        e.authUpdateAttempted === !1 &&
        (this.authState.state === `waitingForServerConfirmationOfFreshToken` ||
          this.authState.state === `waitingForServerConfirmationOfCachedToken`)
      ) {
        this._logVerbose(`ignoring non-auth token expired error`);
        return;
      }
      let { baseVersion: t } = e;
      if (!this.syncState.isCurrentOrNewerAuthVersion(t + 1)) {
        this._logVerbose(`ignoring auth error for previous auth attempt`);
        return;
      }
      this.tryToReauthenticate(e);
    }
    async tryToReauthenticate(e) {
      if (
        (this._logVerbose(`attempting to reauthenticate: ${e.error}`),
        this.authState.state === `noAuth` ||
          (this.authState.state ===
            `waitingForServerConfirmationOfFreshToken` &&
            this.tokenConfirmationAttempts >= Ht))
      ) {
        (this.logger.error(
          `Failed to authenticate: "${e.error}", check your server auth config`,
        ),
          this.syncState.hasAuth() && this.syncState.clearAuth(),
          this.authState.state !== `noAuth` &&
            this.setAndReportAuthFailed(this.authState.config.onAuthChange));
        return;
      }
      (this.authState.state === `waitingForServerConfirmationOfFreshToken` &&
        (this.tokenConfirmationAttempts++,
        this._logVerbose(
          `retrying reauthentication, ${Ht - this.tokenConfirmationAttempts} attempts remaining`,
        )),
        await this.stopSocket());
      let t = await this.fetchTokenAndGuardAgainstRace(
        this.authState.config.fetchToken,
        { forceRefreshToken: !0 },
      );
      t.isFromOutdatedConfig ||
        (t.value && this.syncState.isNewAuth(t.value)
          ? (this.authenticate(t.value),
            this.setAuthState({
              state: `waitingForServerConfirmationOfFreshToken`,
              config: this.authState.config,
              token: t.value,
              hadAuth:
                this.authState.state === `notRefetching` ||
                this.authState.state === `waitingForScheduledRefetch`,
            }))
          : (this._logVerbose(
              `reauthentication failed, could not fetch a new token`,
            ),
            this.syncState.hasAuth() && this.syncState.clearAuth(),
            this.setAndReportAuthFailed(this.authState.config.onAuthChange)),
        this.tryRestartSocket());
    }
    async refetchToken() {
      if (this.authState.state === `noAuth`) return;
      this._logVerbose(`refetching auth token`);
      let e = await this.fetchTokenAndGuardAgainstRace(
        this.authState.config.fetchToken,
        { forceRefreshToken: !0 },
      );
      e.isFromOutdatedConfig ||
        (e.value
          ? this.syncState.isNewAuth(e.value)
            ? (this.setAuthState({
                state: `waitingForServerConfirmationOfFreshToken`,
                hadAuth: this.syncState.hasAuth(),
                token: e.value,
                config: this.authState.config,
              }),
              this.authenticate(e.value))
            : this.setAuthState({
                state: `notRefetching`,
                config: this.authState.config,
              })
          : (this._logVerbose(`refetching token failed`),
            this.syncState.hasAuth() && this.clearAuth(),
            this.setAndReportAuthFailed(this.authState.config.onAuthChange)),
        this._logVerbose(
          `restarting WS after auth token fetch (if currently stopped)`,
        ),
        this.tryRestartSocket());
    }
    scheduleTokenRefetch(e) {
      if (this.authState.state === `noAuth`) return;
      let t = this.decodeToken(e);
      if (!t) {
        this.logger.error(
          `Auth token is not a valid JWT, cannot refetch the token`,
        );
        return;
      }
      let { iat: n, exp: r } = t;
      if (!n || !r) {
        this.logger.error(
          `Auth token does not have required fields, cannot refetch the token`,
        );
        return;
      }
      let i = r - n;
      if (i <= 2) {
        this.logger.error(
          `Auth token does not live long enough, cannot refetch the token`,
        );
        return;
      }
      let a = Math.min(Vt, (i - this.refreshTokenLeewaySeconds) * 1e3);
      a <= 0 &&
        (this.logger.warn(
          `Refetching auth token immediately, configured leeway ${this.refreshTokenLeewaySeconds}s is larger than the token's lifetime ${i}s`,
        ),
        (a = 0));
      let o = setTimeout(() => {
        (this._logVerbose(`running scheduled token refetch`),
          this.refetchToken());
      }, a);
      (this.setAuthState({
        state: `waitingForScheduledRefetch`,
        refetchTokenTimeoutId: o,
        config: this.authState.config,
      }),
        this._logVerbose(
          `scheduled preemptive auth token refetching in ${a}ms`,
        ));
    }
    async fetchTokenAndGuardAgainstRace(e, t) {
      let n = ++this.configVersion;
      this._logVerbose(`fetching token with config version ${n}`);
      let r = await e(t);
      return this.configVersion === n
        ? { isFromOutdatedConfig: !1, value: r }
        : (this._logVerbose(
            `stale config version, expected ${n}, got ${this.configVersion}`,
          ),
          { isFromOutdatedConfig: !0 });
    }
    stop() {
      (this.resetAuthState(),
        this.configVersion++,
        this._logVerbose(`config version bumped to ${this.configVersion}`));
    }
    setAndReportAuthFailed(e) {
      (e(!1), this.resetAuthState());
    }
    resetAuthState() {
      this.setAuthState({ state: `noAuth` });
    }
    setAuthState(e) {
      let t =
        e.state === `waitingForServerConfirmationOfFreshToken`
          ? {
              hadAuth: e.hadAuth,
              state: e.state,
              token: `...${e.token.slice(-7)}`,
            }
          : { state: e.state };
      switch (
        (this._logVerbose(`setting auth state to ${JSON.stringify(t)}`),
        e.state)
      ) {
        case `waitingForScheduledRefetch`:
        case `notRefetching`:
        case `noAuth`:
          this.tokenConfirmationAttempts = 0;
          break;
        case `waitingForServerConfirmationOfFreshToken`:
        case `waitingForServerConfirmationOfCachedToken`:
        case `initialRefetch`:
          break;
        default:
      }
      (this.authState.state === `waitingForScheduledRefetch` &&
        (clearTimeout(this.authState.refetchTokenTimeoutId),
        this.syncState.markAuthCompletion()),
        (this.authState = e));
    }
    decodeToken(e) {
      try {
        return Rt(e);
      } catch (e) {
        return (
          this._logVerbose(
            `Error decoding token: ${e instanceof Error ? e.message : `Unknown error`}`,
          ),
          null
        );
      }
    }
    _logVerbose(e) {
      this.logger.logVerbose(`${e} [v${this.configVersion}]`);
    }
  },
  Wt = [
    `convexClientConstructed`,
    `convexWebSocketOpen`,
    `convexFirstMessageReceived`,
  ];
function Gt(e, t) {
  let n = { sessionId: t };
  typeof performance > `u` ||
    !performance.mark ||
    performance.mark(e, { detail: n });
}
function Kt(e) {
  let t = e.name.slice(6);
  return (
    (t = t.charAt(0).toLowerCase() + t.slice(1)),
    { name: t, startTime: e.startTime }
  );
}
function qt(e) {
  if (typeof performance > `u` || !performance.getEntriesByName) return [];
  let t = [];
  for (let n of Wt) {
    let r = performance
      .getEntriesByName(n)
      .filter((e) => e.entryType === `mark`)
      .filter((t) => t.detail.sessionId === e);
    t.push(...r);
  }
  return t.map(Kt);
}
var Jt = Object.defineProperty,
  Yt = (e, t, n) =>
    t in e
      ? Jt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  J = (e, t, n) => Yt(e, typeof t == `symbol` ? t : t + ``, n),
  Xt = class {
    constructor(e, t, n) {
      if (
        (J(this, `address`),
        J(this, `state`),
        J(this, `requestManager`),
        J(this, `webSocketManager`),
        J(this, `authenticationManager`),
        J(this, `remoteQuerySet`),
        J(this, `optimisticQueryResults`),
        J(this, `_transitionHandlerCounter`, 0),
        J(this, `_nextRequestId`),
        J(this, `_onTransitionFns`, new Map()),
        J(this, `_sessionId`),
        J(this, `firstMessageReceived`, !1),
        J(this, `debug`),
        J(this, `logger`),
        J(this, `maxObservedTimestamp`),
        J(this, `connectionStateSubscribers`, new Map()),
        J(this, `nextConnectionStateSubscriberId`, 0),
        J(this, `_lastPublishedConnectionState`),
        J(this, `markConnectionStateDirty`, () => {
          Promise.resolve().then(() => {
            let e = this.connectionState();
            if (
              JSON.stringify(e) !==
              JSON.stringify(this._lastPublishedConnectionState)
            ) {
              this._lastPublishedConnectionState = e;
              for (let t of this.connectionStateSubscribers.values()) t(e);
            }
          });
        }),
        J(this, `mark`, (e) => {
          this.debug && Gt(e, this.sessionId);
        }),
        typeof e == `object`)
      )
        throw Error(
          `Passing a ClientConfig object is no longer supported. Pass the URL of the Convex deployment as a string directly.`,
        );
      (n?.skipConvexDeploymentUrlCheck !== !0 && ee(e), (n = { ...n }));
      let r = n.authRefreshTokenLeewaySeconds ?? 2,
        i = n.webSocketConstructor;
      if (!i && typeof WebSocket > `u`)
        throw Error(
          `No WebSocket global variable defined! To use Convex in an environment without WebSocket try the HTTP client: https://docs.convex.dev/api/classes/browser.ConvexHttpClient`,
        );
      ((i ||= WebSocket),
        (this.debug = n.reportDebugInfoToConvex ?? !1),
        (this.address = e),
        (this.logger =
          n.logger === !1
            ? Ke({ verbose: n.verbose ?? !1 })
            : n.logger !== !0 && n.logger
              ? n.logger
              : Ge({ verbose: n.verbose ?? !1 })));
      let a = e.search(`://`);
      if (a === -1) throw Error(`Provided address was not an absolute URL.`);
      let o = e.substring(a + 3),
        s = e.substring(0, a),
        c;
      if (s === `http`) c = `ws`;
      else if (s === `https`) c = `wss`;
      else throw Error(`Unknown parent protocol ${s}`);
      let l = `${c}://${o}/api/${Re}/sync`;
      ((this.state = new Qe()),
        (this.remoteQuerySet = new bt(
          (e) => this.state.queryPath(e),
          this.logger,
        )),
        (this.requestManager = new tt(
          this.logger,
          this.markConnectionStateDirty,
        )));
      let u = () => {
        (this.webSocketManager.pause(), this.state.pause());
      };
      ((this.authenticationManager = new Ut(
        this.state,
        {
          authenticate: (e) => {
            let t = this.state.setAuth(e);
            return (this.webSocketManager.sendMessage(t), t.baseVersion);
          },
          stopSocket: () => this.webSocketManager.stop(),
          tryRestartSocket: () => this.webSocketManager.tryRestart(),
          pauseSocket: u,
          resumeSocket: () => this.webSocketManager.resume(),
          clearAuth: () => {
            this.clearAuth();
          },
        },
        { logger: this.logger, refreshTokenLeewaySeconds: r },
      )),
        (this.optimisticQueryResults = new dt()),
        this.addOnTransitionHandler((e) => {
          t(e.queries.map((e) => e.token));
        }),
        (this._nextRequestId = 0),
        (this._sessionId = Pt()));
      let { unsavedChangesWarning: d } = n;
      if (typeof window > `u` || window.addEventListener === void 0) {
        if (d === !0)
          throw Error(
            `unsavedChangesWarning requested, but window.addEventListener not found! Remove {unsavedChangesWarning: true} from Convex client options.`,
          );
      } else
        d !== !1 &&
          window.addEventListener(`beforeunload`, (e) => {
            if (this.requestManager.hasIncompleteRequests()) {
              e.preventDefault();
              let t = `Are you sure you want to leave? Your changes may not be saved.`;
              return (((e || window.event).returnValue = t), t);
            }
          });
      ((this.webSocketManager = new Nt(
        l,
        {
          onOpen: (e) => {
            (this.mark(`convexWebSocketOpen`),
              this.webSocketManager.sendMessage({
                ...e,
                type: `Connect`,
                sessionId: this._sessionId,
                maxObservedTimestamp: this.maxObservedTimestamp,
              }));
            let t = new Set(this.remoteQuerySet.remoteQueryResults().keys());
            this.remoteQuerySet = new bt(
              (e) => this.state.queryPath(e),
              this.logger,
            );
            let [n, r] = this.state.restart(t);
            (r && this.webSocketManager.sendMessage(r),
              this.webSocketManager.sendMessage(n));
            for (let e of this.requestManager.restart())
              this.webSocketManager.sendMessage(e);
          },
          onResume: () => {
            let [e, t] = this.state.resume();
            (t && this.webSocketManager.sendMessage(t),
              e && this.webSocketManager.sendMessage(e));
            for (let e of this.requestManager.resume())
              this.webSocketManager.sendMessage(e);
          },
          onMessage: (e) => {
            switch (
              (this.firstMessageReceived ||
                ((this.firstMessageReceived = !0),
                this.mark(`convexFirstMessageReceived`),
                this.reportMarks()),
              e.type)
            ) {
              case `Transition`: {
                (this.observedTimestamp(e.endVersion.ts),
                  this.authenticationManager.onTransition(e),
                  this.remoteQuerySet.transition(e),
                  this.state.transition(e));
                let t = this.requestManager.removeCompleted(
                  this.remoteQuerySet.timestamp(),
                );
                this.notifyOnQueryResultChanges(t);
                break;
              }
              case `MutationResponse`: {
                e.success && this.observedTimestamp(e.ts);
                let t = this.requestManager.onResponse(e);
                t !== null &&
                  this.notifyOnQueryResultChanges(
                    new Map([[t.requestId, t.result]]),
                  );
                break;
              }
              case `ActionResponse`:
                this.requestManager.onResponse(e);
                break;
              case `AuthError`:
                this.authenticationManager.onAuthError(e);
                break;
              case `FatalError`: {
                let t = qe(this.logger, e.error);
                throw (this.webSocketManager.terminate(), t);
              }
              default:
            }
            return {
              hasSyncedPastLastReconnect: this.hasSyncedPastLastReconnect(),
            };
          },
          onServerDisconnectError: n.onServerDisconnectError,
        },
        i,
        this.logger,
        this.markConnectionStateDirty,
        this.debug,
      )),
        this.mark(`convexClientConstructed`),
        n.expectAuth && u());
    }
    hasSyncedPastLastReconnect() {
      return (
        this.requestManager.hasSyncedPastLastReconnect() ||
        this.state.hasSyncedPastLastReconnect()
      );
    }
    observedTimestamp(e) {
      (this.maxObservedTimestamp === void 0 ||
        this.maxObservedTimestamp.lessThanOrEqual(e)) &&
        (this.maxObservedTimestamp = e);
    }
    getMaxObservedTimestamp() {
      return this.maxObservedTimestamp;
    }
    notifyOnQueryResultChanges(e) {
      let t = this.remoteQuerySet.remoteQueryResults(),
        n = new Map();
      for (let [e, r] of t) {
        let t = this.state.queryToken(e);
        if (t !== null) {
          let i = {
            result: r,
            udfPath: this.state.queryPath(e),
            args: this.state.queryArgs(e),
          };
          n.set(t, i);
        }
      }
      let r = this.optimisticQueryResults.ingestQueryResultsFromServer(
        n,
        new Set(e.keys()),
      );
      this.handleTransition({
        queries: r.map((e) => ({
          token: e,
          modification: {
            kind: `Updated`,
            result: this.optimisticQueryResults.rawQueryResult(e),
          },
        })),
        reflectedMutations: Array.from(e).map(([e, t]) => ({
          requestId: e,
          result: t,
        })),
        timestamp: this.remoteQuerySet.timestamp(),
      });
    }
    handleTransition(e) {
      for (let t of this._onTransitionFns.values()) t(e);
    }
    addOnTransitionHandler(e) {
      let t = this._transitionHandlerCounter++;
      return (
        this._onTransitionFns.set(t, e),
        () => this._onTransitionFns.delete(t)
      );
    }
    getCurrentAuthClaims() {
      let e = this.state.getAuth(),
        t = {};
      if (e && e.tokenType === `User`)
        try {
          t = e ? Rt(e.value) : {};
        } catch {
          t = {};
        }
      else return;
      return { token: e.value, decoded: t };
    }
    setAuth(e, t) {
      this.authenticationManager.setConfig(e, t);
    }
    hasAuth() {
      return this.state.hasAuth();
    }
    setAdminAuth(e, t) {
      let n = this.state.setAdminAuth(e, t);
      this.webSocketManager.sendMessage(n);
    }
    clearAuth() {
      let e = this.state.clearAuth();
      this.webSocketManager.sendMessage(e);
    }
    subscribe(e, t, n) {
      let r = m(t),
        {
          modification: i,
          queryToken: a,
          unsubscribe: o,
        } = this.state.subscribe(e, r, n?.journal, n?.componentPath);
      return (
        i !== null && this.webSocketManager.sendMessage(i),
        {
          queryToken: a,
          unsubscribe: () => {
            let e = o();
            e && this.webSocketManager.sendMessage(e);
          },
        }
      );
    }
    localQueryResult(e, t) {
      let n = j(e, m(t));
      return this.optimisticQueryResults.queryResult(n);
    }
    localQueryResultByToken(e) {
      return this.optimisticQueryResults.queryResult(e);
    }
    hasLocalQueryResultByToken(e) {
      return this.optimisticQueryResults.hasQueryResult(e);
    }
    localQueryLogs(e, t) {
      let n = j(e, m(t));
      return this.optimisticQueryResults.queryLogs(n);
    }
    queryJournal(e, t) {
      let n = j(e, m(t));
      return this.state.queryJournal(n);
    }
    connectionState() {
      let e = this.webSocketManager.connectionState();
      return {
        hasInflightRequests: this.requestManager.hasInflightRequests(),
        isWebSocketConnected: e.isConnected,
        hasEverConnected: e.hasEverConnected,
        connectionCount: e.connectionCount,
        connectionRetries: e.connectionRetries,
        timeOfOldestInflightRequest:
          this.requestManager.timeOfOldestInflightRequest(),
        inflightMutations: this.requestManager.inflightMutations(),
        inflightActions: this.requestManager.inflightActions(),
      };
    }
    subscribeToConnectionState(e) {
      let t = this.nextConnectionStateSubscriberId++;
      return (
        this.connectionStateSubscribers.set(t, e),
        () => {
          this.connectionStateSubscribers.delete(t);
        }
      );
    }
    async mutation(e, t, n) {
      let r = await this.mutationInternal(e, t, n);
      if (!r.success)
        throw r.errorData === void 0
          ? Error(k(`mutation`, e, r))
          : Je(r, new D(k(`mutation`, e, r)));
      return r.value;
    }
    async mutationInternal(e, t, n, r) {
      let { mutationPromise: i } = this.enqueueMutation(e, t, n, r);
      return i;
    }
    enqueueMutation(e, t, n, r) {
      let i = m(t);
      this.tryReportLongDisconnect();
      let a = this.nextRequestId;
      if ((this._nextRequestId++, n !== void 0)) {
        let e = n.optimisticUpdate;
        if (e !== void 0) {
          let t = this.optimisticQueryResults
            .applyOptimisticUpdate((t) => {
              e(t, i) instanceof Promise &&
                this.logger.warn(
                  `Optimistic update handler returned a Promise. Optimistic updates should be synchronous.`,
                );
            }, a)
            .map((e) => {
              let t = this.localQueryResultByToken(e);
              return {
                token: e,
                modification: {
                  kind: `Updated`,
                  result:
                    t === void 0
                      ? void 0
                      : { success: !0, value: t, logLines: [] },
                },
              };
            });
          this.handleTransition({
            queries: t,
            reflectedMutations: [],
            timestamp: this.remoteQuerySet.timestamp(),
          });
        }
      }
      let o = {
          type: `Mutation`,
          requestId: a,
          udfPath: e,
          componentPath: r,
          args: [S(i)],
        },
        s = this.webSocketManager.sendMessage(o);
      return {
        requestId: a,
        mutationPromise: this.requestManager.request(o, s),
      };
    }
    async action(e, t) {
      let n = await this.actionInternal(e, t);
      if (!n.success)
        throw n.errorData === void 0
          ? Error(k(`action`, e, n))
          : Je(n, new D(k(`action`, e, n)));
      return n.value;
    }
    async actionInternal(e, t, n) {
      let r = m(t),
        i = this.nextRequestId;
      (this._nextRequestId++, this.tryReportLongDisconnect());
      let a = {
          type: `Action`,
          requestId: i,
          udfPath: e,
          componentPath: n,
          args: [S(r)],
        },
        o = this.webSocketManager.sendMessage(a);
      return this.requestManager.request(a, o);
    }
    async close() {
      return (
        this.authenticationManager.stop(),
        this.webSocketManager.terminate()
      );
    }
    get url() {
      return this.address;
    }
    get nextRequestId() {
      return this._nextRequestId;
    }
    get sessionId() {
      return this._sessionId;
    }
    reportMarks() {
      if (this.debug) {
        let e = qt(this.sessionId);
        this.webSocketManager.sendMessage({
          type: `Event`,
          eventType: `ClientConnect`,
          event: e,
        });
      }
    }
    tryReportLongDisconnect() {
      if (!this.debug) return;
      let e = this.connectionState().timeOfOldestInflightRequest;
      if (e === null || Date.now() - e.getTime() <= 60 * 1e3) return;
      let t = `${this.address}/api/debug_event`;
      fetch(t, {
        method: `POST`,
        headers: {
          "Content-Type": `application/json`,
          "Convex-Client": `npm-${Re}`,
        },
        body: JSON.stringify({ event: `LongWebsocketDisconnect` }),
      })
        .then((e) => {
          e.ok ||
            this.logger.warn(`Analytics request failed with response:`, e.body);
        })
        .catch((e) => {
          this.logger.warn(`Analytics response failed with error:`, e);
        });
    }
  };
function Y(e) {
  if (
    typeof e != `object` ||
    !e ||
    !Array.isArray(e.page) ||
    typeof e.isDone != `boolean` ||
    typeof e.continueCursor != `string`
  )
    throw Error(`Not a valid paginated query result: ${e?.toString()}`);
  return e;
}
var Zt = Object.defineProperty,
  Qt = (e, t, n) =>
    t in e
      ? Zt(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  $t = (e, t, n) => Qt(e, typeof t == `symbol` ? t : t + ``, n),
  en = class {
    constructor(e, t) {
      ((this.client = e),
        (this.onTransition = t),
        $t(this, `paginatedQuerySet`, new Map()),
        $t(this, `lastTransitionTs`),
        (this.lastTransitionTs = z.fromNumber(0)),
        this.client.addOnTransitionHandler((e) => this.onBaseTransition(e)));
    }
    subscribe(e, t, n) {
      let r = A(e),
        i = Ye(r, t, n),
        a = () => this.removePaginatedQuerySubscriber(i),
        o = this.paginatedQuerySet.get(i);
      return o
        ? ((o.numSubscribers += 1), { paginatedQueryToken: i, unsubscribe: a })
        : (this.paginatedQuerySet.set(i, {
            token: i,
            canonicalizedUdfPath: r,
            args: t,
            numSubscribers: 1,
            options: { initialNumItems: n.initialNumItems },
            nextPageKey: 0,
            pageKeys: [],
            pageKeyToQuery: new Map(),
            ongoingSplits: new Map(),
            skip: !1,
            id: n.id,
          }),
          this.addPageToPaginatedQuery(i, null, n.initialNumItems),
          { paginatedQueryToken: i, unsubscribe: a });
    }
    localQueryResult(e, t, n) {
      let r = Ye(A(e), t, n);
      return this.localQueryResultByToken(r);
    }
    localQueryResultByToken(e) {
      let t = this.paginatedQuerySet.get(e);
      if (!t) return;
      let n = this.activePageQueryTokens(t);
      if (n.length === 0)
        return {
          results: [],
          status: `LoadingFirstPage`,
          loadMore: (t) => this.loadMoreOfPaginatedQuery(e, t),
        };
      let r = [],
        i = !1,
        a = !1;
      for (let e of n) {
        let t = this.client.localQueryResultByToken(e);
        if (t === void 0) {
          ((i = !0), (a = !1));
          continue;
        }
        let n = Y(t);
        ((r = r.concat(n.page)), (a = !!n.isDone));
      }
      let o;
      return (
        (o = i
          ? r.length === 0
            ? `LoadingFirstPage`
            : `LoadingMore`
          : a
            ? `Exhausted`
            : `CanLoadMore`),
        {
          results: r,
          status: o,
          loadMore: (t) => this.loadMoreOfPaginatedQuery(e, t),
        }
      );
    }
    onBaseTransition(e) {
      let t = e.queries.map((e) => e.token),
        n = this.queriesContainingTokens(t),
        r = [];
      n.length > 0 &&
        (this.processPaginatedQuerySplits(n, (e) =>
          this.client.localQueryResultByToken(e),
        ),
        (r = n.map((e) => ({
          token: e,
          modification: {
            kind: `Updated`,
            result: this.localQueryResultByToken(e),
          },
        }))));
      let i = { ...e, paginatedQueries: r };
      this.onTransition(i);
    }
    loadMoreOfPaginatedQuery(e, t) {
      this.mustGetPaginatedQuery(e);
      let n = this.queryTokenForLastPageOfPaginatedQuery(e),
        r = this.client.localQueryResultByToken(n);
      if (!r) return !1;
      let i = Y(r);
      if (i.isDone) return !1;
      this.addPageToPaginatedQuery(e, i.continueCursor, t);
      let a = {
        timestamp: this.lastTransitionTs,
        reflectedMutations: [],
        queries: [],
        paginatedQueries: [
          {
            token: e,
            modification: {
              kind: `Updated`,
              result: this.localQueryResultByToken(e),
            },
          },
        ],
      };
      return (this.onTransition(a), !0);
    }
    queriesContainingTokens(e) {
      if (e.length === 0) return [];
      let t = [],
        n = new Set(e);
      for (let [e, r] of this.paginatedQuerySet)
        for (let i of this.allQueryTokens(r))
          if (n.has(i)) {
            t.push(e);
            break;
          }
      return t;
    }
    processPaginatedQuerySplits(e, t) {
      for (let n of e) {
        let e = this.mustGetPaginatedQuery(n),
          { ongoingSplits: r, pageKeyToQuery: i, pageKeys: a } = e;
        for (let [n, [a, o]] of r)
          t(i.get(a).queryToken) !== void 0 &&
            t(i.get(o).queryToken) !== void 0 &&
            this.completePaginatedQuerySplit(e, n, a, o);
        for (let n of a) {
          if (r.has(n)) continue;
          let a = i.get(n).queryToken,
            o = t(a);
          if (!o) continue;
          let s = Y(o);
          s.splitCursor &&
            (s.pageStatus === `SplitRecommended` ||
              s.pageStatus === `SplitRequired` ||
              s.page.length > e.options.initialNumItems * 2) &&
            this.splitPaginatedQueryPage(e, n, s.splitCursor, s.continueCursor);
        }
      }
    }
    splitPaginatedQueryPage(e, t, n, r) {
      let i = e.nextPageKey++,
        a = e.nextPageKey++,
        o = { cursor: r, numItems: e.options.initialNumItems, id: e.id },
        s = this.client.subscribe(e.canonicalizedUdfPath, {
          ...e.args,
          paginationOpts: { ...o, cursor: null, endCursor: n },
        });
      e.pageKeyToQuery.set(i, s);
      let c = this.client.subscribe(e.canonicalizedUdfPath, {
        ...e.args,
        paginationOpts: { ...o, cursor: n, endCursor: r },
      });
      (e.pageKeyToQuery.set(a, c), e.ongoingSplits.set(t, [i, a]));
    }
    addPageToPaginatedQuery(e, t, n) {
      let r = this.mustGetPaginatedQuery(e),
        i = r.nextPageKey++,
        a = { cursor: t, numItems: n, id: r.id },
        o = { ...r.args, paginationOpts: a },
        s = this.client.subscribe(r.canonicalizedUdfPath, o);
      return (r.pageKeys.push(i), r.pageKeyToQuery.set(i, s), s);
    }
    removePaginatedQuerySubscriber(e) {
      let t = this.paginatedQuerySet.get(e);
      if (t && (--t.numSubscribers, !(t.numSubscribers > 0))) {
        for (let e of t.pageKeyToQuery.values()) e.unsubscribe();
        this.paginatedQuerySet.delete(e);
      }
    }
    completePaginatedQuerySplit(e, t, n, r) {
      let i = e.pageKeyToQuery.get(t);
      e.pageKeyToQuery.delete(t);
      let a = e.pageKeys.indexOf(t);
      (e.pageKeys.splice(a, 1, n, r),
        e.ongoingSplits.delete(t),
        i.unsubscribe());
    }
    activePageQueryTokens(e) {
      return e.pageKeys.map((t) => e.pageKeyToQuery.get(t).queryToken);
    }
    allQueryTokens(e) {
      return Array.from(e.pageKeyToQuery.values()).map((e) => e.queryToken);
    }
    queryTokenForLastPageOfPaginatedQuery(e) {
      let t = this.mustGetPaginatedQuery(e),
        n = t.pageKeys[t.pageKeys.length - 1];
      if (n === void 0) throw Error(`No pages for paginated query ${e}`);
      return t.pageKeyToQuery.get(n).queryToken;
    }
    mustGetPaginatedQuery(e) {
      let t = this.paginatedQuerySet.get(e);
      if (!t) throw Error(`paginated query no longer exists for token ` + e);
      return t;
    }
  },
  X = e(t(), 1);
function tn({ getCurrentValue: e, subscribe: t }) {
  let [n, r] = (0, X.useState)(() => ({
      getCurrentValue: e,
      subscribe: t,
      value: e(),
    })),
    i = n.value;
  return (
    (n.getCurrentValue !== e || n.subscribe !== t) &&
      ((i = e()), r({ getCurrentValue: e, subscribe: t, value: i })),
    (0, X.useEffect)(() => {
      let n = !1,
        i = () => {
          n ||
            r((n) => {
              if (n.getCurrentValue !== e || n.subscribe !== t) return n;
              let r = e();
              return n.value === r ? n : { ...n, value: r };
            });
        },
        a = t(i);
      return (
        i(),
        () => {
          ((n = !0), a());
        }
      );
    }, [e, t]),
    i
  );
}
var nn = Object.defineProperty,
  rn = (e, t, n) =>
    t in e
      ? nn(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  Z = (e, t, n) => rn(e, typeof t == `symbol` ? t : t + ``, n),
  an = 5e3;
if (X.default === void 0) throw Error(`Required dependency 'react' not found`);
function on(e, t, n) {
  function r(r) {
    return (mn(r), t.mutation(e, r, { optimisticUpdate: n }));
  }
  return (
    (r.withOptimisticUpdate = function (r) {
      if (n !== void 0)
        throw Error(`Already specified optimistic update for mutation ${F(e)}`);
      return on(e, t, r);
    }),
    r
  );
}
function sn(e, t) {
  return function (n) {
    return t.action(e, n);
  };
}
var cn = class {
    constructor(e, t) {
      if (
        (Z(this, `address`),
        Z(this, `cachedSync`),
        Z(this, `cachedPaginatedQueryClient`),
        Z(this, `listeners`),
        Z(this, `options`),
        Z(this, `closed`, !1),
        Z(this, `_logger`),
        Z(this, `adminAuth`),
        Z(this, `fakeUserIdentity`),
        e === void 0)
      )
        throw Error(`No address provided to ConvexReactClient.
If trying to deploy to production, make sure to follow all the instructions found at https://docs.convex.dev/production/hosting/
If running locally, make sure to run \`convex dev\` and ensure the .env.local file is populated.`);
      if (typeof e != `string`)
        throw Error(
          `ConvexReactClient requires a URL like 'https://happy-otter-123.convex.cloud', received something of type ${typeof e} instead.`,
        );
      if (!e.includes(`://`))
        throw Error(`Provided address was not an absolute URL.`);
      ((this.address = e),
        (this.listeners = new Map()),
        (this._logger =
          t?.logger === !1
            ? Ke({ verbose: t?.verbose ?? !1 })
            : t?.logger !== !0 && t?.logger
              ? t.logger
              : Ge({ verbose: t?.verbose ?? !1 })),
        (this.options = { ...t, logger: this._logger }));
    }
    get url() {
      return this.address;
    }
    get sync() {
      if (this.closed)
        throw Error(`ConvexReactClient has already been closed.`);
      return this.cachedSync
        ? this.cachedSync
        : ((this.cachedSync = new Xt(this.address, () => {}, this.options)),
          this.adminAuth &&
            this.cachedSync.setAdminAuth(this.adminAuth, this.fakeUserIdentity),
          (this.cachedPaginatedQueryClient = new en(this.cachedSync, (e) =>
            this.handleTransition(e),
          )),
          this.cachedSync);
    }
    get paginatedQueryClient() {
      if ((this.sync, this.cachedPaginatedQueryClient))
        return this.cachedPaginatedQueryClient;
      throw Error(`Should already be instantiated`);
    }
    setAuth(e, t) {
      if (typeof e == `string`)
        throw Error(
          `Passing a string to ConvexReactClient.setAuth is no longer supported, please upgrade to passing in an async function to handle reauthentication.`,
        );
      this.sync.setAuth(e, t ?? (() => {}));
    }
    clearAuth() {
      this.sync.clearAuth();
    }
    setAdminAuth(e, t) {
      if (((this.adminAuth = e), (this.fakeUserIdentity = t), this.closed))
        throw Error(`ConvexReactClient has already been closed.`);
      this.cachedSync && this.sync.setAdminAuth(e, t);
    }
    watchQuery(e, ...t) {
      let [n, r] = t,
        i = F(e);
      return {
        onUpdate: (e) => {
          let { queryToken: t, unsubscribe: a } = this.sync.subscribe(i, n, r),
            o = this.listeners.get(t);
          return (
            o === void 0 ? this.listeners.set(t, new Set([e])) : o.add(e),
            () => {
              if (this.closed) return;
              let n = this.listeners.get(t);
              (n.delete(e), n.size === 0 && this.listeners.delete(t), a());
            }
          );
        },
        localQueryResult: () => {
          if (this.cachedSync) return this.cachedSync.localQueryResult(i, n);
        },
        localQueryLogs: () => {
          if (this.cachedSync) return this.cachedSync.localQueryLogs(i, n);
        },
        journal: () => {
          if (this.cachedSync) return this.cachedSync.queryJournal(i, n);
        },
      };
    }
    prewarmQuery(e) {
      let t = e.extendSubscriptionFor ?? an,
        n = this.watchQuery(e.query, e.args || {}).onUpdate(() => {});
      setTimeout(n, t);
    }
    watchPaginatedQuery(e, t, n) {
      let r = F(e);
      return {
        onUpdate: (e) => {
          let { paginatedQueryToken: i, unsubscribe: a } =
              this.paginatedQueryClient.subscribe(r, t || {}, n),
            o = this.listeners.get(i);
          return (
            o === void 0 ? this.listeners.set(i, new Set([e])) : o.add(e),
            () => {
              if (this.closed) return;
              let t = this.listeners.get(i);
              (t.delete(e), t.size === 0 && this.listeners.delete(i), a());
            }
          );
        },
        localQueryResult: () =>
          this.paginatedQueryClient.localQueryResult(r, t, n),
      };
    }
    mutation(e, ...t) {
      let [n, r] = t,
        i = F(e);
      return this.sync.mutation(i, n, r);
    }
    action(e, ...t) {
      let n = F(e);
      return this.sync.action(n, ...t);
    }
    query(e, ...t) {
      let n = this.watchQuery(e, ...t),
        r = n.localQueryResult();
      return r === void 0
        ? new Promise((e, t) => {
            let r = n.onUpdate(() => {
              r();
              try {
                e(n.localQueryResult());
              } catch (e) {
                t(e);
              }
            });
          })
        : Promise.resolve(r);
    }
    connectionState() {
      return this.sync.connectionState();
    }
    subscribeToConnectionState(e) {
      return this.sync.subscribeToConnectionState(e);
    }
    get logger() {
      return this._logger;
    }
    async close() {
      if (
        ((this.closed = !0),
        (this.listeners = new Map()),
        (this.cachedPaginatedQueryClient &&= void 0),
        this.cachedSync)
      ) {
        let e = this.cachedSync;
        ((this.cachedSync = void 0), await e.close());
      }
    }
    handleTransition(e) {
      let t = e.queries.map((e) => e.token),
        n = e.paginatedQueries.map((e) => e.token);
      this.transition([...t, ...n]);
    }
    transition(e) {
      for (let t of e) {
        let e = this.listeners.get(t);
        if (e) for (let t of e) t();
      }
    }
  },
  Q = X.createContext(void 0);
function ln() {
  return (0, X.useContext)(Q);
}
var un = ({ client: e, children: t }) =>
  X.createElement(Q.Provider, { value: e }, t);
function dn(e, ...t) {
  let n = t[0] === `skip`,
    r = t[0] === `skip` ? {} : m(t[0]),
    i = typeof e == `string` ? I(e) : e,
    a = F(i),
    o = yn(
      (0, X.useMemo)(
        () => (n ? {} : { query: { query: i, args: r } }),
        [JSON.stringify(S(r)), a, n],
      ),
    ).query;
  if (o instanceof Error) throw o;
  return o;
}
function fn(e) {
  let t = typeof e == `string` ? I(e) : e,
    n = (0, X.useContext)(Q);
  if (n === void 0)
    throw Error(
      "Could not find Convex client! `useMutation` must be used in the React component tree under `ConvexProvider`. Did you forget it? See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app",
    );
  return (0, X.useMemo)(() => on(t, n), [n, F(t)]);
}
function pn(e) {
  let t = (0, X.useContext)(Q),
    n = typeof e == `string` ? I(e) : e;
  if (t === void 0)
    throw Error(
      "Could not find Convex client! `useAction` must be used in the React component tree under `ConvexProvider`. Did you forget it? See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app",
    );
  return (0, X.useMemo)(() => sn(n, t), [t, F(n)]);
}
function mn(e) {
  if (
    typeof e == `object` &&
    e &&
    `bubbles` in e &&
    `persist` in e &&
    `isDefaultPrevented` in e
  )
    throw Error(
      "Convex function called with SyntheticEvent object. Did you use a Convex function as an event handler directly? Event handlers like onClick receive an event object as their first argument. These SyntheticEvent objects are not valid Convex values. Try wrapping the function like `const handler = () => myMutation();` and using `handler` in the event handler.",
    );
}
var hn = Object.defineProperty,
  gn = (e, t, n) =>
    t in e
      ? hn(e, t, { enumerable: !0, configurable: !0, writable: !0, value: n })
      : (e[t] = n),
  _n = (e, t, n) => gn(e, typeof t == `symbol` ? t : t + ``, n),
  vn = class {
    constructor(e) {
      (_n(this, `createWatch`),
        _n(this, `queries`),
        _n(this, `listeners`),
        (this.createWatch = e),
        (this.queries = {}),
        (this.listeners = new Set()));
    }
    setQueries(e) {
      for (let t of Object.keys(e)) {
        let { query: n, args: r, paginationOptions: i } = e[t];
        if ((F(n), this.queries[t] === void 0))
          this.addQuery(t, n, r, i ? { paginationOptions: i } : {});
        else {
          let e = this.queries[t];
          (F(n) !== F(e.query) ||
            JSON.stringify(S(r)) !== JSON.stringify(S(e.args)) ||
            JSON.stringify(i) !== JSON.stringify(e.paginationOptions)) &&
            (this.removeQuery(t),
            this.addQuery(t, n, r, i ? { paginationOptions: i } : {}));
        }
      }
      for (let t of Object.keys(this.queries))
        e[t] === void 0 && this.removeQuery(t);
    }
    subscribe(e) {
      return (
        this.listeners.add(e),
        () => {
          this.listeners.delete(e);
        }
      );
    }
    getLocalResults(e) {
      let t = {};
      for (let n of Object.keys(e)) {
        let { query: r, args: i } = e[n],
          a = e[n].paginationOptions;
        F(r);
        let o = this.createWatch(r, i, a ? { paginationOptions: a } : {}),
          s;
        try {
          s = o.localQueryResult();
        } catch (e) {
          if (e instanceof Error) s = e;
          else throw e;
        }
        t[n] = s;
      }
      return t;
    }
    setCreateWatch(e) {
      this.createWatch = e;
      for (let e of Object.keys(this.queries)) {
        let {
            query: t,
            args: n,
            watch: r,
            paginationOptions: i,
          } = this.queries[e],
          a = `journal` in r ? r.journal() : void 0;
        (this.removeQuery(e),
          this.addQuery(e, t, n, {
            ...(a ? { journal: a } : []),
            ...(i ? { paginationOptions: i } : {}),
          }));
      }
    }
    destroy() {
      for (let e of Object.keys(this.queries)) this.removeQuery(e);
      this.listeners = new Set();
    }
    addQuery(e, t, n, { paginationOptions: r, journal: i }) {
      if (this.queries[e] !== void 0)
        throw Error(
          `Tried to add a new query with identifier ${e} when it already exists.`,
        );
      let a = this.createWatch(t, n, {
          ...(i ? { journal: i } : []),
          ...(r ? { paginationOptions: r } : {}),
        }),
        o = a.onUpdate(() => this.notifyListeners());
      this.queries[e] = {
        query: t,
        args: n,
        watch: a,
        unsubscribe: o,
        ...(r ? { paginationOptions: r } : {}),
      };
    }
    removeQuery(e) {
      let t = this.queries[e];
      if (t === void 0) throw Error(`No query found with identifier ${e}.`);
      (t.unsubscribe(), delete this.queries[e]);
    }
    notifyListeners() {
      for (let e of this.listeners) e();
    }
  };
function yn(e) {
  let t = ln();
  if (t === void 0)
    throw Error(
      "Could not find Convex client! `useQuery` must be used in the React component tree under `ConvexProvider`. Did you forget it? See https://docs.convex.dev/quick-start#set-up-convex-in-your-react-app",
    );
  return bn(
    e,
    (0, X.useMemo)(
      () =>
        (e, n, { journal: r, paginationOptions: i }) =>
          i
            ? t.watchPaginatedQuery(e, n, i)
            : t.watchQuery(e, n, r ? { journal: r } : {}),
      [t],
    ),
  );
}
function bn(e, t) {
  let [n] = (0, X.useState)(() => new vn(t));
  return (
    n.createWatch !== t && n.setCreateWatch(t),
    (0, X.useEffect)(() => () => n.destroy(), [n]),
    tn(
      (0, X.useMemo)(
        () => ({
          getCurrentValue: () => n.getLocalResults(e),
          subscribe: (t) => (n.setQueries(e), n.subscribe(t)),
        }),
        [n, e],
      ),
    )
  );
}
function xn(e, t) {
  return new Proxy(
    {},
    {
      get(n, r) {
        if (typeof r == `string`) return xn(e, [...t, r]);
        if (r === nt) {
          if (t.length < 1) {
            let n = [e, ...t].join(`.`);
            throw Error(
              `API path is expected to be of the form \`${e}.childComponent.functionName\`. Found: \`${n}\``,
            );
          }
          return `_reference/childComponent/` + t.join(`/`);
        } else return;
      },
    },
  );
}
var Sn = () => xn(`components`, []),
  Cn = st;
(Sn(),
  E.object({
    success: E.boolean(),
    result: E.union(E.string(), E.null()),
    error: E.union(E.string(), E.null()),
    activityLog: E.union(E.string(), E.null()),
  }),
  E.union(
    E.literal(`draft`),
    E.literal(`todo`),
    E.literal(`in_progress`),
    E.literal(`code_review`),
    E.literal(`business_review`),
    E.literal(`done`),
    E.literal(`cancelled`),
  ),
  E.union(
    E.literal(`queued`),
    E.literal(`running`),
    E.literal(`success`),
    E.literal(`error`),
  ));
var wn = E.union(E.literal(`info`), E.literal(`warn`), E.literal(`error`)),
  Tn = E.union(E.literal(`user`), E.literal(`assistant`)),
  En = E.union(E.literal(`execute`), E.literal(`ask`), E.literal(`plan`));
(E.union(E.literal(`active`), E.literal(`starting`), E.literal(`closed`)),
  E.union(
    E.literal(`draft`),
    E.literal(`finalized`),
    E.literal(`active`),
    E.literal(`completed`),
    E.literal(`cancelled`),
  ),
  E.union(
    E.literal(`pending`),
    E.literal(`indexing`),
    E.literal(`complete`),
    E.literal(`error`),
  ),
  E.union(
    E.literal(`pending`),
    E.literal(`running`),
    E.literal(`completed`),
    E.literal(`error`),
  ),
  E.union(
    E.literal(`fixing`),
    E.literal(`fix_completed`),
    E.literal(`fix_error`),
  ),
  E.union(E.literal(`light`), E.literal(`dark`)));
var Dn = E.union(
    E.literal(`critical`),
    E.literal(`high`),
    E.literal(`medium`),
    E.literal(`low`),
  ),
  On = E.object({
    requirement: E.string(),
    passed: E.boolean(),
    detail: E.string(),
    severity: E.optional(Dn),
  });
(E.object({ name: E.string(), results: E.array(On) }),
  E.object({ name: E.string(), steps: E.array(E.string()) }),
  E.union(
    E.literal(`routine_complete`),
    E.literal(`export_ready`),
    E.literal(`task_complete`),
    E.literal(`task_assigned`),
    E.literal(`comment_added`),
    E.literal(`run_completed`),
    E.literal(`rate_limit`),
    E.literal(`system`),
  ));
var kn = E.union(E.literal(`rate_limit`), E.literal(`generic`)),
  An = E.union(
    E.literal(`queued`),
    E.literal(`building`),
    E.literal(`deployed`),
    E.literal(`error`),
  );
E.union(E.literal(`business`), E.literal(`dev`));
var $ = E.union(E.literal(`opus`), E.literal(`sonnet`), E.literal(`haiku`)),
  jn = [`opus`, `sonnet`, `haiku`],
  Mn = E.union(
    E.literal(`pending`),
    E.literal(`confirmed`),
    E.literal(`cancelled`),
  );
(E.string(),
  E.union(E.literal(`running`), E.literal(`success`), E.literal(`error`)),
  E.union(E.literal(`cron`), E.literal(`manual`)),
  E.union(E.literal(`pending`), E.literal(`success`), E.literal(`error`)),
  E.union(E.literal(`owner`), E.literal(`member`)));
var Nn = E.union(E.literal(`implementation`), E.literal(`resolve_conflicts`));
(E.union(E.literal(`run`), E.literal(`audit`), E.literal(`fix`)),
  E.union(E.literal(`pending`), E.literal(`completed`), E.literal(`skipped`)));
var Pn = E.object({
    label: E.string(),
    route: E.optional(E.string()),
    filePath: E.optional(E.string()),
  }),
  Fn = E.union(
    E.literal(`teal`),
    E.literal(`blue`),
    E.literal(`purple`),
    E.literal(`rose`),
    E.literal(`orange`),
    E.literal(`green`),
    E.literal(`amber`),
    E.literal(`cyan`),
    E.literal(`pink`),
    E.literal(`indigo`),
    E.literal(`red`),
  ),
  In = E.union(
    E.literal(`none`),
    E.literal(`sm`),
    E.literal(`md`),
    E.literal(`lg`),
    E.literal(`xl`),
    E.literal(`full`),
  ),
  Ln = E.union(
    E.literal(`inter`),
    E.literal(`roboto`),
    E.literal(`poppins`),
    E.literal(`dm-sans`),
    E.literal(`space-grotesk`),
    E.literal(`geist`),
    E.literal(`source-serif`),
    E.literal(`jakarta`),
    E.literal(`outfit`),
    E.literal(`nunito`),
    E.literal(`ibm-plex`),
    E.literal(`figtree`),
  ),
  Rn = E.union(
    E.literal(`tighter`),
    E.literal(`tight`),
    E.literal(`normal`),
    E.literal(`wide`),
    E.literal(`wider`),
  );
E.object({
  accentColor: E.optional(Fn),
  radius: E.optional(In),
  fontFamily: E.optional(Ln),
  letterSpacing: E.optional(Rn),
});
var zn = E.object({ timestamp: E.number(), level: wn, message: E.string() });
(E.string(),
  E.optional(E.string()),
  E.optional(E.id(`githubRepos`)),
  E.optional(E.id(`projects`)),
  E.optional(E.array(E.string())),
  E.optional(E.number()),
  E.number(),
  E.number(),
  E.optional(E.id(`users`)),
  E.optional(E.id(`users`)),
  E.optional($),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.number()),
  E.optional(E.number()),
  E.optional(E.id(`_scheduled_functions`)),
  E.id(`agentTasks`),
  E.array(zn),
  E.optional(E.number()),
  E.optional(E.number()),
  E.optional(E.number()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(kn),
  E.optional(E.number()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.id(`githubRepos`)),
  E.optional(An),
  E.optional(E.string()),
  E.optional(Nn),
  E.id(`githubRepos`),
  E.id(`users`),
  E.string(),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.number()),
  E.optional(E.boolean()),
  E.optional(E.array(E.string())),
  E.optional(E.id(`users`)),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.number()),
  E.optional(E.string()),
  E.string(),
  E.string(),
  E.boolean(),
  E.string(),
  E.string(),
  E.number(),
  E.optional(E.number()),
  E.optional(E.boolean()),
  E.optional(E.id(`users`)),
  E.optional(E.id(`teams`)),
  E.optional(E.string()),
  E.optional(E.id(`githubRepos`)),
  E.optional(E.string()),
  E.optional($),
  E.optional(E.boolean()),
  E.optional(E.boolean()),
  E.optional(E.boolean()),
  E.optional(E.string()),
  E.optional(E.array(E.string())),
  E.optional(E.string()),
  E.optional(E.boolean()));
var Bn = E.object({
  role: Tn,
  content: E.string(),
  activityLog: E.optional(E.string()),
  userId: E.optional(E.id(`users`)),
});
(E.id(`githubRepos`),
  E.id(`users`),
  E.string(),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.number()),
  E.string(),
  E.optional(E.id(`users`)),
  E.optional(E.array(E.id(`users`))),
  E.optional(E.number()),
  E.optional(E.number()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.number()),
  E.optional(E.id(`_scheduled_functions`)),
  E.optional(E.string()),
  E.optional(E.number()),
  E.id(`projects`),
  E.array(Bn),
  E.optional(E.string()));
var Vn = E.union(
    E.literal(`low`),
    E.literal(`medium`),
    E.literal(`high`),
    E.literal(`critical`),
  ),
  Hn = E.object({
    id: E.string(),
    title: E.string(),
    description: E.string(),
    severity: Vn,
    filePaths: E.optional(E.array(E.string())),
    suggestedFix: E.optional(E.string()),
    taskId: E.optional(E.id(`agentTasks`)),
  });
(E.id(`githubRepos`),
  E.string(),
  E.string(),
  E.string(),
  E.optional($),
  E.boolean(),
  E.optional(E.boolean()),
  E.optional(E.boolean()),
  E.optional(E.string()),
  E.id(`users`),
  E.number(),
  E.number(),
  E.id(`automations`),
  E.id(`githubRepos`),
  E.number(),
  E.optional(E.number()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.boolean(),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.string()),
  E.optional(E.array(Hn)),
  E.string(),
  E.number(),
  E.optional(E.number()),
  E.optional(E.string()),
  E.optional(E.id(`users`)),
  E.union(E.id(`sessions`), E.id(`designSessions`), E.id(`researchQueries`)),
  E.optional(En),
  E.optional(E.boolean()),
  E.optional(E.string()),
  E.optional(E.id(`designPersonas`)),
  E.optional(E.array(Pn)),
  E.optional(E.string()),
  E.optional(Mn),
  E.optional(E.id(`_storage`)),
  E.optional(E.id(`_storage`)),
  E.union(E.id(`sessions`), E.id(`designSessions`)),
  E.string(),
  E.number(),
  E.optional(En),
  E.optional($),
  E.optional(E.string()),
  E.optional(E.id(`designPersonas`)),
  E.optional(E.number()));
export {
  cn as a,
  fn as c,
  S as d,
  un as i,
  dn as l,
  Cn as n,
  pn as o,
  yn as r,
  ln as s,
  jn as t,
  F as u,
};
