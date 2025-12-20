
// This cache lives in server memory (RAM).
// It makes Kuddus faster by not hitting DB on every message.
export const MENU_CACHE = {
  items: [],
  lastFetch: 0,
  ttlMs: 2 * 60 * 1000, // 2 minutes
};

// Call this whenever menu changes (add/remove/update)
export function invalidateMenuCache() {
  MENU_CACHE.items = [];
  MENU_CACHE.lastFetch = 0;
}
