import { loadEnv, type Plugin } from "vite";

/**
 * Same path the sandbox preview proxy forwards to the local Convex backend —
 * kept in sync with `PROXIED_CONVEX_PATH` in src/lib/convex.ts and
 * `CONVEX_PREFIX` in the preview proxy.
 */
const CONVEX_PATH = "/__convex";

/**
 * Serves `/__convex` off the dev server, forwarding to whatever local Convex
 * backend `VITE_CONVEX_URL` names.
 *
 * A page loaded from a non-loopback origin cannot use a loopback Convex address,
 * so `convexDeploymentUrl` sends it to `/__convex` on its own origin. In a
 * sandbox that origin is usually the preview proxy, which already forwards the
 * path; this covers reaching the dev server directly (a LAN address, a tunnel
 * onto the Vite port) where nothing else would answer it.
 *
 * `ws: true` matters most: the sync socket is the connection that fails
 * loudly — HTTP queries would still work through a plain proxy.
 */
export function convexDevProxy(): Plugin {
  return {
    name: "eva-convex-dev-proxy",
    config(_config, { mode }) {
      const target = loadEnv(mode, process.cwd(), "").VITE_CONVEX_URL;
      if (target === undefined || target === "") return undefined;
      let hostname: string;
      try {
        hostname = new URL(target).hostname;
      } catch {
        return undefined;
      }
      // A hosted deployment is reachable from the browser directly; only a
      // local backend needs the dev server to stand in front of it.
      if (hostname !== "127.0.0.1" && hostname !== "localhost") {
        return undefined;
      }
      return {
        server: {
          proxy: {
            [CONVEX_PATH]: {
              target,
              ws: true,
              rewrite: (path: string) =>
                path.slice(CONVEX_PATH.length) || "/",
            },
          },
        },
      };
    },
  };
}
