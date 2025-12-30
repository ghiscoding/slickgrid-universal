import { vi } from 'vitest';

const mock = () => {
  let storage: any = {};
  return {
    getItem: (key: any) => (key in storage ? storage[key] : null),
    setItem: (key: any, value: any) => (storage[key] = value || ''),
    removeItem: (key: any) => delete storage[key],
    clear: () => (storage = {}),
  };
};

window.HTMLElement.prototype.scrollIntoView = () => {};

Object.defineProperty(document, 'styleSheets', {
  value: [
    {
      ownerNode: null,
      cssRules: [
        { cssText: '.slickgrid_124343 .l0 { left: 0px; }', selectorText: '.slickgrid_124343 .l0', style: {} },
        { cssText: '.slickgrid_124343 .r0 { left: 0px; }', selectorText: '.slickgrid_124343 .r0', style: {} },
      ],
    },
  ],
});
Object.defineProperty(window, 'localStorage', { value: mock() });
Object.defineProperty(window, 'sessionStorage', { value: mock() });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ['-webkit-appearance'],
});

Object.defineProperty(window, '__env', { value: { env: { backendUrl: 'mocked URL' } } });

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => {
      return '';
    },
  }),
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

(HTMLCanvasElement.prototype as any).getContext = () => {
  return {
    // mock the methods you need
    getImageData: () => ({
      data: new Uint8ClampedArray(4),
    }),
    putImageData: () => {},
  };
};
