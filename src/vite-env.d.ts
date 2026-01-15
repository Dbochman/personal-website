/// <reference types="vite/client" />

declare global {
  function gtag(command: string, targetId: string, config?: Record<string, unknown>): void;

  interface ViewTransition {
    finished: Promise<void>;
    ready: Promise<void>;
    updateCallbackDone: Promise<void>;
  }

  interface Document {
    startViewTransition?(callback: () => void | Promise<void>): ViewTransition;
  }
}
