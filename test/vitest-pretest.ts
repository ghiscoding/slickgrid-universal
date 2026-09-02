// (global as any).Storage = window.localStorage;
if (!globalThis.navigator) {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node.js' },
    configurable: true,
  });
}
