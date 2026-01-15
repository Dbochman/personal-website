// Polyfills for browser environment
import { Buffer } from 'buffer';

// Extend global types for Buffer polyfill
declare global {
  interface Window {
    Buffer: typeof Buffer;
  }
}

// Make Buffer available globally
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  globalThis.Buffer = Buffer;
}
