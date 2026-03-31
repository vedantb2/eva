import { o as e } from "./chunk-CFjPhJqf.js";
import { n as t } from "./jsx-runtime-bxCDpROR.js";
import { t as n } from "./useNavigate-B8SeWprX.js";
import { T as r, c as i } from "./index-CuMF3NGg.js";
var a = r(),
  o = e(t());
function s() {
  let e = (0, a.c)(5),
    t = n(),
    { owner: r, repo: s } = i.useParams(),
    c,
    l;
  return (
    e[0] !== t || e[1] !== r || e[2] !== s
      ? ((c = () => {
          t({
            to: `/$owner/$repo/settings/config`,
            params: { owner: r, repo: s },
            replace: !0,
          });
        }),
        (l = [t, r, s]),
        (e[0] = t),
        (e[1] = r),
        (e[2] = s),
        (e[3] = c),
        (e[4] = l))
      : ((c = e[3]), (l = e[4])),
    (0, o.useEffect)(c, l),
    null
  );
}
export { s as component };
