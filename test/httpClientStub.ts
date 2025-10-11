export function basicFetchStub(input: string, init?: RequestInit, data?: any | any[]) {
  const isInvalidUrl = input.includes('invalid-url');

  const response = {
    ok: !isInvalidUrl,
    status: 200,
    url: input,
    method: init?.method || 'GET',
    json: () => {
      if (isInvalidUrl) {
        return Promise.reject(new Error('Invalid URL'));
      }
      return Promise.resolve(data);
    },
    text: () => {
      if (isInvalidUrl) {
        return Promise.reject(new Error('Invalid URL'));
      }
      return Promise.resolve(JSON.stringify(data));
    },
    headers: new Headers(init?.headers),
  };

  // Simulate bodyUsed for invalid URLs
  if (isInvalidUrl) {
    Object.defineProperty(response, 'bodyUsed', {
      writable: true,
      configurable: true,
      value: true,
    });
  }

  return Promise.resolve(response);
}
