function e(e, t) {
  let n = Math.round((t - e) / 1e3);
  if (n < 60) return `${n}s`;
  let r = Math.floor(n / 60);
  if (r < 60) return `${r}m`;
  let i = Math.floor(r / 60),
    a = r % 60;
  return a > 0 ? `${i}h ${a}m` : `${i}h`;
}
function t(e) {
  let t = Math.floor(e / 1e3);
  if (t < 60) return `${t}s`;
  let n = Math.floor(t / 60),
    r = t % 60;
  return n < 60 ? `${n}m ${r}s` : `${Math.floor(n / 60)}h ${n % 60}m`;
}
function n(e) {
  return e === 0 ? `-` : e < 1e3 ? `${e}ms` : `${(e / 1e3).toFixed(1)}s`;
}
export { t as n, n as r, e as t };
