import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const ROOT = process.cwd();
const EXT_DIR = join(ROOT, "apps", "chrome-extension");
const DIST_DIR = join(EXT_DIR, "dist");
const PEM_PATH = join(EXT_DIR, "keys", "extension.pem");
const CRX_OUTPUT = join(EXT_DIR, "dist.crx");

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const ADMIN_KEY = process.env.EXTENSION_ADMIN_KEY;
const UPDATE_URL = process.env.EXTENSION_UPDATE_URL;

function fatal(msg: string): never {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function findChrome(): string {
  const candidates =
    process.platform === "win32"
      ? [
          "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
          "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
          join(
            process.env.LOCALAPPDATA ?? "",
            "Google",
            "Chrome",
            "Application",
            "chrome.exe",
          ),
        ]
      : process.platform === "darwin"
        ? ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        : ["google-chrome", "google-chrome-stable", "chromium-browser"];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  fatal("Chrome not found. Install Google Chrome or set CHROME_PATH env var.");
}

interface ConvexResponse {
  status: string;
  value: string;
  errorMessage?: string;
}

interface StorageResponse {
  storageId: string;
}

async function convexMutation(
  path: string,
  args: Record<string, string>,
): Promise<string> {
  const res = await fetch(`${CONVEX_URL}/api/mutation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });

  if (!res.ok) {
    const text = await res.text();
    fatal(`Convex mutation ${path} failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as ConvexResponse;
  if (data.status === "error") {
    fatal(`Convex mutation ${path} error: ${data.errorMessage ?? "unknown"}`);
  }

  return data.value;
}

async function main() {
  if (!CONVEX_URL) fatal("NEXT_PUBLIC_CONVEX_URL env var required");
  if (!ADMIN_KEY) fatal("EXTENSION_ADMIN_KEY env var required");
  if (!UPDATE_URL)
    fatal(
      "EXTENSION_UPDATE_URL env var required (e.g. https://your-app.vercel.app/api/updates/extension?file=updates.xml)",
    );

  if (!existsSync(PEM_PATH)) {
    fatal(
      `PEM key not found at ${PEM_PATH}\n` +
        "Generate one by running Chrome's pack extension once:\n" +
        '  chrome --pack-extension="apps/chrome-extension/dist"\n' +
        "Then move the generated dist.pem to apps/chrome-extension/keys/extension.pem",
    );
  }

  console.log("1/5 Building extension...");
  execSync("pnpm ext:build", { stdio: "inherit", cwd: ROOT });

  const manifestPath = join(DIST_DIR, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const version: string = manifest.version;
  console.log(`    Version: ${version}`);

  console.log("2/5 Injecting update_url...");
  manifest.update_url = UPDATE_URL;
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log("3/5 Packing CRX...");
  const chrome = process.env.CHROME_PATH ?? findChrome();

  if (existsSync(CRX_OUTPUT)) unlinkSync(CRX_OUTPUT);

  execSync(
    `"${chrome}" --pack-extension="${DIST_DIR}" --pack-extension-key="${PEM_PATH}"`,
    { stdio: "inherit" },
  );

  if (!existsSync(CRX_OUTPUT)) {
    fatal("CRX file was not created. Check Chrome output above.");
  }

  const crxBuffer = readFileSync(CRX_OUTPUT);
  console.log(
    `    CRX size: ${(crxBuffer.length / 1024 / 1024).toFixed(1)} MB`,
  );

  console.log("4/5 Uploading to Convex storage...");
  const uploadUrl = await convexMutation(
    "extensionReleases:generateUploadUrl",
    { adminKey: ADMIN_KEY },
  );

  const uploadRes = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-chrome-extension" },
    body: crxBuffer,
  });

  if (!uploadRes.ok) {
    fatal(
      `Storage upload failed (${uploadRes.status}): ${await uploadRes.text()}`,
    );
  }

  const uploadData = (await uploadRes.json()) as StorageResponse;
  const storageId = uploadData.storageId;

  console.log("5/5 Recording release...");
  await convexMutation("extensionReleases:recordRelease", {
    adminKey: ADMIN_KEY,
    version,
    crxStorageId: storageId,
  });

  unlinkSync(CRX_OUTPUT);

  console.log("\nRelease complete!");
  console.log(`  Version: ${version}`);
  console.log(`  Update URL: ${UPDATE_URL}`);
  console.log("\nChrome will auto-update within ~5 hours.");
  console.log("Force update: chrome://extensions > Developer Mode > Update");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
