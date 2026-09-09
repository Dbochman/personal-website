/// <reference types="vite/client" />

declare global {
  function gtag(command: string, targetId: string, config?: Record<string, unknown>): void;
}

export {};

declare module 'react' {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
