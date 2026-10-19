/// <reference types="vite/client" />

export {};

declare global {
  // Analytics loads lazily and can be blocked or removed by the browser.
  var gtag: ((command: string, targetId: string, config?: Record<string, unknown>) => void) | undefined;
}
