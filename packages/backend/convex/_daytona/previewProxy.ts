"use node";

import type { Sandbox } from "@daytonaio/sdk";
import { exec } from "./helpers";

// Daytona preview URLs only expose HTTP ports 3000-9999, so the injected
// navigation proxy must listen inside that range.
const PROXY_PORT_MIN = 9000;
const PROXY_PORT_MAX = 9999;
const PROXY_PORT_COUNT = PROXY_PORT_MAX - PROXY_PORT_MIN + 1;
const HEALTH_PATH = "/__eva_preview_proxy/health";
const SCRIPT_MARKER = "EVA_PREVIEW_PROXY_SCRIPT";

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

async function listListeningPorts(sandbox: Sandbox): Promise<Set<number>> {
  const ports = new Set<number>();
  try {
    const output = await exec(
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
  sandbox: Sandbox,
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

function buildPreviewProxyScript(): string {
  return String.raw`
import http from "node:http";
import net from "node:net";

const targetPort = Number(process.env.EVA_PREVIEW_TARGET_PORT || "0");
const proxyPort = Number(process.env.EVA_PREVIEW_PROXY_PORT || "0");
const healthPath = "/__eva_preview_proxy/health";

if (!Number.isInteger(targetPort) || targetPort <= 0 || targetPort > 65535) {
  throw new Error("Invalid EVA_PREVIEW_TARGET_PORT");
}

if (!Number.isInteger(proxyPort) || proxyPort <= 0 || proxyPort > 65535) {
  throw new Error("Invalid EVA_PREVIEW_PROXY_PORT");
}

// Convex's browser client opens a raw WebSocket and cannot attach the Daytona
// preview token, so it can never follow the cross-origin auth redirect to a
// separate 3210-<sandbox> preview origin. Instead the client points at this
// same (already-authenticated) preview origin under /__convex, and the proxy
// forwards those requests to the local Convex backend. /__convex-site maps to
// the Convex HTTP-actions port the same way.
const CONVEX_PORT = 3210;
const CONVEX_SITE_PORT = 3211;
const CONVEX_PREFIX = "/__convex";
const CONVEX_SITE_PREFIX = "/__convex-site";

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
  return { port: targetPort, path: u, injects: true };
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
    clientRes.end("target=" + String(targetPort));
    return;
  }

  const route = resolveRoute(path);

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
  sandbox: Sandbox,
  targetPort: number,
  proxyPort: number,
): Promise<boolean> {
  try {
    const health = await exec(
      sandbox,
      `curl -fsS http://127.0.0.1:${proxyPort}${HEALTH_PATH}`,
      5,
      "/tmp",
    );
    return health.trim() === `target=${targetPort}`;
  } catch {
    return false;
  }
}

async function launchProxy(
  sandbox: Sandbox,
  targetPort: number,
  proxyPort: number,
): Promise<void> {
  const scriptPath = `/tmp/eva-preview-proxy-${targetPort}.mjs`;
  const pidPath = `/tmp/eva-preview-proxy-${targetPort}.pid`;
  const logPath = `/tmp/eva-preview-proxy-${targetPort}.log`;
  const script = buildPreviewProxyScript();
  const command = [
    `cat > '${scriptPath}' <<'${SCRIPT_MARKER}'`,
    script,
    SCRIPT_MARKER,
    `if [ -f '${pidPath}' ] && kill -0 "$(cat '${pidPath}')" 2>/dev/null; then kill "$(cat '${pidPath}')" 2>/dev/null || true; fi`,
    `EVA_PREVIEW_TARGET_PORT=${targetPort} EVA_PREVIEW_PROXY_PORT=${proxyPort} nohup node '${scriptPath}' > '${logPath}' 2>&1 & echo $! > '${pidPath}'`,
    `i=0; while [ "$i" -lt 20 ]; do if curl -fsS 'http://127.0.0.1:${proxyPort}${HEALTH_PATH}' >/dev/null 2>&1; then exit 0; fi; i=$((i+1)); sleep 0.25; done; tail -n 80 '${logPath}' 2>/dev/null || true; exit 1`,
  ].join("\n");

  await exec(sandbox, command, 15, "/tmp");
}

/**
 * Starts a small in-sandbox reverse proxy for the dev server. The proxy injects
 * a route-sync script into HTML so the cross-origin iframe can report SPA and
 * full-page navigations to Eva via postMessage.
 */
export async function ensurePreviewNavigationProxy(
  sandbox: Sandbox,
  targetPort: number,
): Promise<number> {
  if (!isPort(targetPort)) {
    throw new Error(`Invalid preview target port: ${targetPort}`);
  }

  const proxyPort = await resolvePreviewProxyPort(sandbox, targetPort);
  if (await proxyAlreadyRunning(sandbox, targetPort, proxyPort)) {
    return proxyPort;
  }

  await launchProxy(sandbox, targetPort, proxyPort);
  return proxyPort;
}
