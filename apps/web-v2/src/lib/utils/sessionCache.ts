export function createSessionCache(prefix: string) {
  const key = (sessionId: string) => `conductor:${prefix}:${sessionId}`;

  return {
    get(sessionId: string): string | null {
      try {
        const raw = sessionStorage.getItem(key(sessionId));
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed.url;
      } catch {
        return null;
      }
    },

    set(sessionId: string, url: string) {
      sessionStorage.setItem(key(sessionId), JSON.stringify({ url }));
    },

    clear(sessionId: string) {
      sessionStorage.removeItem(key(sessionId));
    },
  };
}
