const mock = () => {
  let storage: any = {};
  return {
    getItem: (key: any) => key in storage ? storage[key] : null,
    setItem: (key: any, value: any) => storage[key] = value || '',
    removeItem: (key: any) => delete storage[key],
    clear: () => storage = {},
  };
};

window.HTMLElement.prototype.scrollIntoView = () => { };

Object.defineProperty(window, 'localStorage', { value: mock() });
Object.defineProperty(window, 'sessionStorage', { value: mock() });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ['-webkit-appearance']
});

Object.defineProperty(window, '__env', { value: { env: { backendUrl: 'mocked URL' } } });

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => {
      return '';
    }
  })
});

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
