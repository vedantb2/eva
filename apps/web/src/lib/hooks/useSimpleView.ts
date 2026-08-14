"use client";

import { useQuery } from "convex/react";
import { api } from "@eva/backend";

/** Convex opt-in for the simplified UI (false while flags are loading). */
export function useSimpleView(): boolean {
  const flags = useQuery(api.auth.getExperimentalFlags);
  return flags?.simpleView === true;
}

const SIMPLE_VIEW_SANDBOX_TABS = new Set([
  "preview",
  "browser",
  "prd",
  "designs",
]);

/** Anything outside Preview / Browser / Plan / Designs bounces to Preview. */
export function isSimpleViewHiddenSandboxTab(tab: string): boolean {
  return !SIMPLE_VIEW_SANDBOX_TABS.has(tab);
}

const SIMPLE_VIEW_HIDDEN_SETTINGS_SEGMENTS = [
  "/settings/config",
  "/settings/monorepo",
  "/settings/app",
  "/settings/tabs",
  "/settings/env-variables",
  "/settings/snapshots",
] as const;

/** Repo settings pages that simple view does not show (bounce to Skills). */
export function isSimpleViewHiddenSettingsPath(pathname: string): boolean {
  return SIMPLE_VIEW_HIDDEN_SETTINGS_SEGMENTS.some((segment) =>
    pathname.includes(segment),
  );
}
