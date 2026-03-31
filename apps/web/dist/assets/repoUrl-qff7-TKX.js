function e(e, t, n) {
  return n ? `/${e}/${t}--${n.split(`/`).pop()}` : `/${e}/${t}`;
}
function t(e) {
  let t = e.split(`--`);
  return { name: t[0], appName: t.length > 1 ? t[1] : void 0 };
}
export { e as n, t };
