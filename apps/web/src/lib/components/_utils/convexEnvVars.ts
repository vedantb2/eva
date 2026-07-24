import { ConvexLogo } from "@/lib/components/ui/providerLogos";
import type { EnvVarSlotEntry } from "./envVarSlotTypes";

/**
 * Convex credentials for sandboxed apps (BYOK). Deploy keys and deployment URLs
 * are kept out of the sandbox by default.
 */
export const CONVEX_ENV_VARS: ReadonlyArray<EnvVarSlotEntry> = [
  {
    id: "convex-deploy-key",
    label: "Convex deploy key",
    primaryKey: "CONVEX_DEPLOY_KEY",
    matchKeys: ["CONVEX_DEPLOY_KEY", "CONVEX_ADMIN_KEY"],
    Logo: ConvexLogo,
    hint: "Deploy/admin key for the app's Convex deployment. Kept out of the sandbox by default.",
    placeholder: "prod:…|dev:…",
    multiline: false,
    sandboxExclude: true,
  },
  {
    id: "convex-url",
    label: "Convex URL",
    primaryKey: "NEXT_PUBLIC_CONVEX_URL",
    matchKeys: ["NEXT_PUBLIC_CONVEX_URL", "VITE_CONVEX_URL", "CONVEX_URL"],
    Logo: ConvexLogo,
    hint: "Convex deployment URL (e.g. https://….convex.cloud). Kept out of the sandbox.",
    placeholder: "https://….convex.cloud",
    multiline: false,
    sandboxExclude: true,
  },
  {
    id: "prod-convex-deploy-key",
    label: "Prod Convex deploy key",
    primaryKey: "PROD_CONVEX_DEPLOY_KEY",
    matchKeys: ["PROD_CONVEX_DEPLOY_KEY", "PROD_CONVEX_ADMIN_KEY"],
    Logo: ConvexLogo,
    hint: "Deploy/admin key for the production Convex deployment. Kept out of the sandbox.",
    placeholder: "prod:…",
    multiline: false,
    sandboxExclude: true,
  },
  {
    id: "prod-convex-url",
    label: "Prod Convex URL",
    primaryKey: "PROD_CONVEX_URL",
    matchKeys: ["PROD_CONVEX_URL"],
    Logo: ConvexLogo,
    hint: "Production Convex deployment URL. Kept out of the sandbox.",
    placeholder: "https://….convex.cloud",
    multiline: false,
    sandboxExclude: true,
  },
];
