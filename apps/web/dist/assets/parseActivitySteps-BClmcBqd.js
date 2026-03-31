function e(e) {
  if (!e) return null;
  try {
    let t = JSON.parse(e);
    if (Array.isArray(t) && t.length > 0 && t[0].type) return t;
  } catch {}
  return null;
}
export { e as t };
