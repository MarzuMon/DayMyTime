import { lazy } from "react";

const RETRY_PREFIX = "lazy-retry:";

export function lazyWithRetry<T extends { default: React.ComponentType<any> }>(
  importer: () => Promise<T>,
  key: string,
) {
  return lazy(async () => {
    const storageKey = `${RETRY_PREFIX}${key}`;
    const hasRetried = sessionStorage.getItem(storageKey) === "1";

    try {
      const module = await importer();
      sessionStorage.removeItem(storageKey);
      return module;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const isChunkLoadFailure =
        message.includes("Failed to fetch dynamically imported module") ||
        message.includes("Importing a module script failed");

      if (isChunkLoadFailure && !hasRetried) {
        sessionStorage.setItem(storageKey, "1");
        window.location.reload();
      }

      throw error;
    }
  });
}