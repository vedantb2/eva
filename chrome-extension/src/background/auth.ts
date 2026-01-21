import type { UserInfo } from "@/shared/types";

const TOKEN_KEY = "conductor_auth_token";
const USER_KEY = "conductor_user";

export async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(TOKEN_KEY);
  return result[TOKEN_KEY] || null;
}

export async function getUser(): Promise<UserInfo | null> {
  const result = await chrome.storage.local.get(USER_KEY);
  return result[USER_KEY] || null;
}

export async function setAuth(token: string, user: UserInfo): Promise<void> {
  await chrome.storage.local.set({
    [TOKEN_KEY]: token,
    [USER_KEY]: user,
  });
}

export async function clearAuth(): Promise<void> {
  await chrome.storage.local.remove([TOKEN_KEY, USER_KEY]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}
