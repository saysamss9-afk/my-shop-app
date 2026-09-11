declare global {
  interface Window {
    [key: string]: any;
  }
  var window: Window & typeof globalThis;
}

export {};
