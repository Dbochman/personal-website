/// <reference types="vite/client" />

declare global {
  function gtag(command: string, targetId: string, config?: Record<string, unknown>): void;
}
