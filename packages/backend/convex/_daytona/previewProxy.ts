"use node";

import type { JWK } from "jose";
import type { SandboxHandle } from "../_sandbox/provider";
import { execHandle } from "./helpers";
import {
  PREVIEW_GRANT_AUDIENCE,
  PREVIEW_GRANT_ISSUER,
  PREVIEW_GRANT_PARAM,
  PREVIEW_SESSION_COOKIE,
  PREVIEW_SESSION_TTL_SECONDS,
} from "../previewGrantConfig";

// Daytona preview URLs only expose HTTP ports 3000-9999, so the injected
// navigation proxy must listen inside that range.
const PROXY_PORT_MIN = 9000;
const PROXY_PORT_MAX = 9999;
const PROXY_PORT_COUNT = PROXY_PORT_MAX - PROXY_PORT_MIN + 1;
const HEALTH_PATH = "/__eva_preview_proxy/health";
const SCRIPT_MARKER = "EVA_PREVIEW_PROXY_SCRIPT";
// Bump when the generated proxy script changes so already-running proxies from
// an older deploy are detected as stale (via the health response) and relaunched.
const SCRIPT_VERSION = "auth-v3";

/** Values injected into the generated proxy script to drive the auth gate. */
interface PreviewProxyAuthParams {
  /** Public half of the preview-grant keypair, or null to disable gating. */
  publicKeyJwk: JWK | null;
  sandboxId: string;
  repoId: string;
  /** Eva origin to redirect cold loads to for sign-in (e.g. WEB_APP_URL). */
  webAppUrl: string;
  /** Whether to inject the navigation-sync script into HTML responses. */
  inject: boolean;
}

function isPort(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 65535;
}

function previewProxyPortCandidates(targetPort: number): number[] {
  const start = PROXY_PORT_MIN + (targetPort % PROXY_PORT_COUNT);
  const candidates: number[] = [];

  for (let offset = 0; offset < PROXY_PORT_COUNT; offset += 1) {
    const candidate =
      PROXY_PORT_MIN + ((start - PROXY_PORT_MIN + offset) % PROXY_PORT_COUNT);
    if (candidate !== targetPort) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

async function listListeningPorts(
  sandbox: SandboxHandle,
): Promise<Set<number>> {
  const ports = new Set<number>();
  try {
    const output = await execHandle(
      sandbox,
      "(ss -ltnH 2>/dev/null || netstat -ltn 2>/dev/null || true) | awk '{print $4}'",
      5,
      "/tmp",
    );
    for (const line of output.split(/\r?\n/)) {
      const match = line.trim().match(/:(\d+)$/);
      if (!match?.[1]) continue;

      const port = Number(match[1]);
      if (isPort(port)) {
        ports.add(port);
      }
    }
  } catch {
    return ports;
  }
  return ports;
}

async function resolvePreviewProxyPort(
  sandbox: SandboxHandle,
  targetPort: number,
): Promise<number> {
  const candidates = previewProxyPortCandidates(targetPort);
  const listeningPorts = await listListeningPorts(sandbox);

  for (const candidate of candidates) {
    if (!listeningPorts.has(candidate)) continue;
    if (await proxyAlreadyRunning(sandbox, targetPort, candidate)) {
      return candidate;
    }
  }

  for (const candidate of candidates) {
    if (!listeningPorts.has(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `No available Daytona preview proxy port in ${PROXY_PORT_MIN}-${PROXY_PORT_MAX}`,
  );
}

function buildPreviewProxyScript(params: PreviewProxyAuthParams): string {
  return String.raw`
import http from "node:http";
import net from "node:net";
import crypto from "node:crypto";

const targetPort = Number(process.env.EVA_PREVIEW_TARGET_PORT || "0");
const proxyPort = Number(process.env.EVA_PREVIEW_PROXY_PORT || "0");
const healthPath = "/__eva_preview_proxy/health";

if (!Number.isInteger(targetPort) || targetPort <= 0 || targetPort > 65535) {
  throw new Error("Invalid EVA_PREVIEW_TARGET_PORT");
}

if (!Number.isInteger(proxyPort) || proxyPort <= 0 || proxyPort > 65535) {
  throw new Error("Invalid EVA_PREVIEW_PROXY_PORT");
}

// ---------------------------------------------------------------------------
// Auth gate. These constants are interpolated by the Convex-side builder. When
// no public key is configured GATE_ENABLED is false and the proxy behaves as
// the original pass-through (legacy mode), so previews keep working until the
// PREVIEW_GRANT_PRIVATE_KEY + WEB_APP_URL env vars are set.
// ---------------------------------------------------------------------------
const PUBLIC_KEY_JWK = ${params.publicKeyJwk ? JSON.stringify(params.publicKeyJwk) : "null"};
const SANDBOX_ID = ${JSON.stringify(params.sandboxId)};
const REPO_ID = ${JSON.stringify(params.repoId)};
const WEB_APP_URL = ${JSON.stringify(params.webAppUrl)};
const EXPECTED_ISS = ${JSON.stringify(PREVIEW_GRANT_ISSUER)};
const EXPECTED_AUD = ${JSON.stringify(PREVIEW_GRANT_AUDIENCE)};
const SESSION_COOKIE = ${JSON.stringify(PREVIEW_SESSION_COOKIE)};
const GRANT_PARAM = ${JSON.stringify(PREVIEW_GRANT_PARAM)};
const SESSION_TTL_SECONDS = ${PREVIEW_SESSION_TTL_SECONDS};
const INJECT_ENABLED = ${params.inject ? "true" : "false"};
const SCRIPT_VERSION = ${JSON.stringify(SCRIPT_VERSION)};
const GATE_ENABLED = PUBLIC_KEY_JWK !== null && WEB_APP_URL.length > 0;

let PUBLIC_KEY = null;
if (GATE_ENABLED) {
  try {
    PUBLIC_KEY = crypto.createPublicKey({ key: PUBLIC_KEY_JWK, format: "jwk" });
  } catch (e) {
    console.error("Eva preview proxy: invalid grant public key", e);
  }
}
// Random per-process secret for the proxy's own session cookie. The proxy only
// holds the grant's public key (cannot mint long-lived grants), so it exchanges
// a validated short-lived grant for an HMAC session cookie it can verify itself.
// A proxy restart invalidates sessions, which just forces a fast re-auth.
const SESSION_SECRET = crypto.randomBytes(32);

function b64urlToBuf(s) {
  let v = String(s).replace(/-/g, "+").replace(/_/g, "/");
  while (v.length % 4) v += "=";
  return Buffer.from(v, "base64");
}

function bufToB64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (!k) continue;
    out[k] = part.slice(idx + 1).trim();
  }
  return out;
}

// Verifies an ES256 grant JWT. JOSE signatures are raw r||s (IEEE P-1363), not
// the DER form node:crypto defaults to, hence dsaEncoding.
function verifyGrant(token) {
  if (!PUBLIC_KEY) return null;
  try {
    const parts = String(token).split(".");
    if (parts.length !== 3) return null;
    const signingInput = Buffer.from(parts[0] + "." + parts[1]);
    const ok = crypto.verify(
      "sha256",
      signingInput,
      { key: PUBLIC_KEY, dsaEncoding: "ieee-p1363" },
      b64urlToBuf(parts[2]),
    );
    if (!ok) return null;
    const payload = JSON.parse(b64urlToBuf(parts[1]).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (payload.iss !== EXPECTED_ISS) return null;
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    if (aud.indexOf(EXPECTED_AUD) === -1) return null;
    if (payload.sandboxId !== SANDBOX_ID) return null;
    return payload;
  } catch {
    return null;
  }
}

function signSession(payload) {
  const body = bufToB64url(Buffer.from(JSON.stringify(payload)));
  const mac = bufToB64url(
    crypto.createHmac("sha256", SESSION_SECRET).update(body).digest(),
  );
  return body + "." + mac;
}

function verifySession(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length !== 2) return null;
    const expected = bufToB64url(
      crypto.createHmac("sha256", SESSION_SECRET).update(parts[0]).digest(),
    );
    const a = Buffer.from(parts[1]);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(b64urlToBuf(parts[0]).toString("utf8"));
    const now = Math.floor(Date.now() / 1000);
    if (typeof payload.exp !== "number" || payload.exp < now) return null;
    if (payload.sandboxId !== SANDBOX_ID) return null;
    return payload;
  } catch {
    return null;
  }
}

// HTML interstitial for unauthenticated document loads. Daytona forwards to the
// sandbox with the Host header rewritten to the internal upstream
// (localhost:proxyPort), so the proxy cannot know its own browser-facing URL.
// We therefore compute the return URL in the browser from location.href, which
// is the real external preview origin, and embed the server-known port + ids.
function buildAuthBootstrapHtml() {
  const base =
    WEB_APP_URL +
    "/preview-auth?sandbox=" + encodeURIComponent(SANDBOX_ID) +
    "&repo=" + encodeURIComponent(REPO_ID) +
    "&port=" + encodeURIComponent(String(targetPort)) +
    "&return=";
  const inline =
    "var u=new URL(location.href);" +
    "u.searchParams.delete(" + JSON.stringify(GRANT_PARAM) + ");" +
    "location.replace(" + JSON.stringify(base) +
    "+encodeURIComponent(u.toString()));";
  return (
    '<!doctype html><html><head><meta charset="utf-8">' +
    "<title>Sign in to preview</title>" +
    "<script>" + inline + "</scr" + "ipt></head>" +
    "<body><noscript>Open this preview from Eva to sign in.</noscript>" +
    "</body></html>"
  );
}

// Returns true if the request is authorized and may proceed. Returns false when
// it has already written a response (cookie-set redirect, login redirect, 401).
function authorize(clientReq, clientRes) {
  if (!GATE_ENABLED) return true;

  let parsed = null;
  try {
    parsed = new URL(
      clientReq.url || "/",
      "https://" + (clientReq.headers["host"] || "127.0.0.1"),
    );
  } catch {}

  const cookies = parseCookies(clientReq.headers["cookie"]);
  const session = cookies[SESSION_COOKIE];
  if (session && verifySession(session)) return true;

  const grant = parsed ? parsed.searchParams.get(GRANT_PARAM) : null;
  if (grant) {
    const claims = verifyGrant(grant);
    if (claims && parsed) {
      const now = Math.floor(Date.now() / 1000);
      const token = signSession({
        sandboxId: SANDBOX_ID,
        sub: typeof claims.sub === "string" ? claims.sub : "",
        exp: now + SESSION_TTL_SECONDS,
      });
      parsed.searchParams.delete(GRANT_PARAM);
      const cleanPath = parsed.pathname + parsed.search + parsed.hash;
      const cookie =
        SESSION_COOKIE + "=" + token +
        "; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=" +
        String(SESSION_TTL_SECONDS);
      clientRes.writeHead(302, {
        location: cleanPath,
        "set-cookie": cookie,
        "referrer-policy": "no-referrer",
        "cache-control": "no-store",
      });
      clientRes.end();
      return false;
    }
  }

  const accept = String(clientReq.headers["accept"] || "");
  const isGet = (clientReq.method || "GET").toUpperCase() === "GET";
  if (isGet && accept.indexOf("text/html") !== -1) {
    clientRes.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "referrer-policy": "no-referrer",
      "cache-control": "no-store",
    });
    clientRes.end(buildAuthBootstrapHtml());
  } else {
    clientRes.writeHead(401, { "content-type": "text/plain" });
    clientRes.end("Unauthorized");
  }
  return false;
}

// Convex's browser client opens a raw WebSocket and cannot attach the Daytona
// preview token, so it can never follow the cross-origin auth redirect to a
// separate 3210-<sandbox> preview origin. Instead the client points at this
// same (already-authenticated) preview origin under /__convex, and the proxy
// forwards those requests to the local Convex backend. /__convex-site maps to
// the Convex HTTP-actions port the same way.
//
// The agentation annotation widget has the same problem: it runs in the browser
// but its server listens on sandbox-localhost:4747, which the user's machine
// cannot reach. /__agentation forwards to it on the authenticated preview origin.
const CONVEX_PORT = 3210;
const CONVEX_SITE_PORT = 3211;
const AGENTATION_PORT = 4747;
const CONVEX_PREFIX = "/__convex";
const CONVEX_SITE_PREFIX = "/__convex-site";
const AGENTATION_PREFIX = "/__agentation";

// Returns the path with the prefix stripped (always leading-slashed), or null
// when "url" is not the prefix or a "/", "?", "#" delimited sub-path of it.
function matchPrefix(url, prefix) {
  if (url === prefix) return "/";
  if (!url.startsWith(prefix)) return null;
  const next = url[prefix.length];
  if (next !== "/" && next !== "?" && next !== "#") return null;
  const rest = url.slice(prefix.length);
  return next === "/" ? rest : "/" + rest;
}

// Maps an incoming request URL to an upstream port + stripped path. Anything
// outside the Convex prefixes goes to the dev server and gets HTML injection.
function resolveRoute(url) {
  const u = url || "/";
  const siteMatch = matchPrefix(u, CONVEX_SITE_PREFIX);
  if (siteMatch !== null) {
    return { port: CONVEX_SITE_PORT, path: siteMatch, injects: false };
  }
  const convexMatch = matchPrefix(u, CONVEX_PREFIX);
  if (convexMatch !== null) {
    return { port: CONVEX_PORT, path: convexMatch, injects: false };
  }
  const agentationMatch = matchPrefix(u, AGENTATION_PREFIX);
  if (agentationMatch !== null) {
    return { port: AGENTATION_PORT, path: agentationMatch, injects: false };
  }
  return { port: targetPort, path: u, injects: INJECT_ENABLED };
}

const injectedScript = "(" + function () {
  const flag = "__evaPreviewNavigationSync";
  if (window[flag]) return;
  window[flag] = true;

  let parentOrigin = "*";
  try {
    if (document.referrer) {
      parentOrigin = new URL(document.referrer).origin;
    }
  } catch {}

  let lastHref = "";

  function sendLocation() {
    const href = window.location.href;
    if (href === lastHref) return;
    lastHref = href;
    window.parent.postMessage({ type: "navigation", url: href }, parentOrigin);
  }

  function scheduleLocationSend() {
    window.requestAnimationFrame(sendLocation);
  }

  const originalPushState = window.history.pushState;
  window.history.pushState = function pushState() {
    const result = originalPushState.apply(window.history, arguments);
    scheduleLocationSend();
    return result;
  };

  const originalReplaceState = window.history.replaceState;
  window.history.replaceState = function replaceState() {
    const result = originalReplaceState.apply(window.history, arguments);
    scheduleLocationSend();
    return result;
  };

  window.addEventListener("popstate", scheduleLocationSend);
  window.addEventListener("hashchange", scheduleLocationSend);
  window.addEventListener("pageshow", scheduleLocationSend);
  window.addEventListener("load", scheduleLocationSend);
  document.addEventListener("click", function () {
    window.setTimeout(sendLocation, 0);
  }, true);

  window.addEventListener("message", function (event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;
    if (data.type === "eva-preview-history-back") {
      window.history.back();
    }
    if (data.type === "eva-preview-history-forward") {
      window.history.forward();
    }
  });

  sendLocation();
}.toString() + ")();";

function buildInjectionTag() {
  const safeScript = injectedScript.replace(/<\/script/gi, "<\\/script");
  return "<script data-eva-preview-nav-sync>" + safeScript + "</scr" + "ipt>";
}

function injectHtml(html) {
  if (html.includes("data-eva-preview-nav-sync")) return html;

  const tag = buildInjectionTag();
  if (html.includes("</head>")) {
    return html.replace("</head>", tag + "</head>");
  }
  if (html.includes("</body>")) {
    return html.replace("</body>", tag + "</body>");
  }
  return tag + html;
}

function rewriteLocationHeader(value) {
  try {
    const parsed = new URL(value, "http://127.0.0.1:" + String(targetPort));
    const isLocal =
      (parsed.hostname === "127.0.0.1" || parsed.hostname === "localhost") &&
      Number(parsed.port || "80") === targetPort;
    if (isLocal) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
    return value;
  } catch {
    return value;
  }
}

function responseHeaders(upstreamHeaders, injectsHtml) {
  const headers = {};
  for (const name of Object.keys(upstreamHeaders)) {
    const lower = name.toLowerCase();
    if (lower === "content-security-policy") continue;
    if (lower === "x-frame-options") continue;
    if (injectsHtml && lower === "content-length") continue;

    const value = upstreamHeaders[name];
    if (value === undefined) continue;

    if (lower === "location") {
      if (Array.isArray(value)) {
        headers[name] = value.map(rewriteLocationHeader);
      } else {
        headers[name] = rewriteLocationHeader(String(value));
      }
      continue;
    }

    headers[name] = value;
  }

  if (injectsHtml) {
    headers["cache-control"] = "no-store";
  }

  return headers;
}

function requestHeaders(clientHeaders, routePort) {
  const headers = {};
  for (const name of Object.keys(clientHeaders)) {
    const lower = name.toLowerCase();
    if (lower === "host") continue;
    if (lower === "accept-encoding") continue;

    const value = clientHeaders[name];
    if (value === undefined) continue;
    headers[name] = value;
  }
  headers.host = "127.0.0.1:" + String(routePort);
  headers["accept-encoding"] = "identity";
  return headers;
}

const server = http.createServer(function handleRequest(clientReq, clientRes) {
  const path = clientReq.url || "/";
  if (path === healthPath) {
    clientRes.writeHead(200, { "content-type": "text/plain" });
    clientRes.end("target=" + String(targetPort) + ";" + SCRIPT_VERSION);
    return;
  }

  if (!authorize(clientReq, clientRes)) return;

  // Strip a (consumed/stale) grant param before forwarding so it never leaks
  // to the dev server's own request logs.
  let routePath = path;
  if (GATE_ENABLED && routePath.indexOf(GRANT_PARAM) !== -1) {
    try {
      const u = new URL(routePath, "https://127.0.0.1");
      u.searchParams.delete(GRANT_PARAM);
      routePath = u.pathname + u.search + u.hash;
    } catch {}
  }

  const route = resolveRoute(routePath);

  const upstreamReq = http.request(
    {
      hostname: "127.0.0.1",
      port: route.port,
      path: route.path,
      method: clientReq.method,
      headers: requestHeaders(clientReq.headers, route.port),
    },
    function handleUpstream(upstreamRes) {
      const contentType = String(upstreamRes.headers["content-type"] || "");
      const contentEncoding = String(upstreamRes.headers["content-encoding"] || "");
      const injectsHtml =
        route.injects &&
        contentType.toLowerCase().includes("text/html") &&
        !contentEncoding;

      clientRes.writeHead(
        upstreamRes.statusCode || 502,
        responseHeaders(upstreamRes.headers, injectsHtml),
      );

      if (!injectsHtml) {
        upstreamRes.pipe(clientRes);
        return;
      }

      const chunks = [];
      upstreamRes.on("data", function handleData(chunk) {
        chunks.push(chunk);
      });
      upstreamRes.on("end", function handleEnd() {
        const html = Buffer.concat(chunks).toString("utf8");
        clientRes.end(injectHtml(html));
      });
    },
  );

  upstreamReq.on("error", function handleProxyError(error) {
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { "content-type": "text/plain" });
    }
    clientRes.end("Preview proxy upstream error: " + error.message);
  });

  clientReq.pipe(upstreamReq);
});

server.on("upgrade", function handleUpgrade(req, socket, head) {
  if (GATE_ENABLED) {
    const cookies = parseCookies(req.headers["cookie"]);
    const session = cookies[SESSION_COOKIE];
    if (!session || !verifySession(session)) {
      socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }
  }
  const route = resolveRoute(req.url || "/");
  const upstream = net.connect(route.port, "127.0.0.1", function handleConnect() {
    const lines = [
      (req.method || "GET") + " " + route.path + " HTTP/" + req.httpVersion,
    ];

    for (const name of Object.keys(req.headers)) {
      const value = req.headers[name];
      if (value === undefined) continue;
      if (name.toLowerCase() === "host") {
        lines.push("host: 127.0.0.1:" + String(route.port));
        continue;
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          lines.push(name + ": " + item);
        }
      } else {
        lines.push(name + ": " + String(value));
      }
    }

    upstream.write(lines.join("\r\n") + "\r\n\r\n");
    if (head.length > 0) {
      upstream.write(head);
    }

    upstream.pipe(socket);
    socket.pipe(upstream);
  });

  upstream.on("error", function handleUpgradeError() {
    socket.destroy();
  });
});

server.listen(proxyPort, "0.0.0.0", function handleListen() {
  console.log(
    "Eva preview proxy listening on " +
      String(proxyPort) +
      " -> 127.0.0.1:" +
      String(targetPort),
  );
});
`.trim();
}

async function proxyAlreadyRunning(
  sandbox: SandboxHandle,
  targetPort: number,
  proxyPort: number,
): Promise<boolean> {
  try {
    const health = await execHandle(
      sandbox,
      `curl -fsS http://127.0.0.1:${proxyPort}${HEALTH_PATH}`,
      5,
      "/tmp",
    );
    // Version suffix forces a relaunch when the script changes across deploys.
    return health.trim() === `target=${targetPort};${SCRIPT_VERSION}`;
  } catch {
    return false;
  }
}

async function launchProxy(
  sandbox: SandboxHandle,
  targetPort: number,
  proxyPort: number,
  authParams: PreviewProxyAuthParams,
): Promise<void> {
  const scriptPath = `/tmp/eva-preview-proxy-${targetPort}.mjs`;
  const pidPath = `/tmp/eva-preview-proxy-${targetPort}.pid`;
  const logPath = `/tmp/eva-preview-proxy-${targetPort}.log`;
  const script = buildPreviewProxyScript(authParams);
  const command = [
    `cat > '${scriptPath}' <<'${SCRIPT_MARKER}'`,
    script,
    SCRIPT_MARKER,
    `if [ -f '${pidPath}' ] && kill -0 "$(cat '${pidPath}')" 2>/dev/null; then kill "$(cat '${pidPath}')" 2>/dev/null || true; fi`,
    `EVA_PREVIEW_TARGET_PORT=${targetPort} EVA_PREVIEW_PROXY_PORT=${proxyPort} nohup node '${scriptPath}' > '${logPath}' 2>&1 & echo $! > '${pidPath}'`,
    `i=0; while [ "$i" -lt 20 ]; do if curl -fsS 'http://127.0.0.1:${proxyPort}${HEALTH_PATH}' >/dev/null 2>&1; then exit 0; fi; i=$((i+1)); sleep 0.25; done; tail -n 80 '${logPath}' 2>/dev/null || true; exit 1`,
  ].join("\n");

  await execHandle(sandbox, command, 15, "/tmp");
}

/**
 * Starts a small in-sandbox reverse proxy for the dev server. The proxy injects
 * a route-sync script into HTML so the cross-origin iframe can report SPA and
 * full-page navigations to Eva via postMessage.
 */
export async function ensurePreviewNavigationProxy(
  sandbox: SandboxHandle,
  targetPort: number,
  authParams: PreviewProxyAuthParams,
): Promise<number> {
  if (!isPort(targetPort)) {
    throw new Error(`Invalid preview target port: ${targetPort}`);
  }

  const proxyPort = await resolvePreviewProxyPort(sandbox, targetPort);
  if (await proxyAlreadyRunning(sandbox, targetPort, proxyPort)) {
    return proxyPort;
  }

  await launchProxy(sandbox, targetPort, proxyPort, authParams);
  return proxyPort;
}
