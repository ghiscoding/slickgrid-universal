import 'jsdom-global/register';

// (global as any).Storage = window.localStorage;
(global as any).navigator = { userAgent: 'node.js' };
