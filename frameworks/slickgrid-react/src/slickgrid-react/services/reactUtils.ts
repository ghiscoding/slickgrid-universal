import React from 'react';
import { createRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// these 2 functions are the same except that 1 is synch and the promise is delayed by a CPU cycle before resolving

export function createReactComponentDynamically<T = any>(
  customComponent: any,
  targetElm: HTMLElement,
  props?: any,
  root?: Root | null
): { component: T; root: Root } {
  const compRef = createRef();
  root ??= createRoot(targetElm);
  root.render(React.createElement(customComponent, { ...props, ref: compRef }));

  return { component: compRef.current as T, root: root as Root };
}

export function loadReactComponentDynamically<T = any>(
  customComponent: any,
  targetElm: HTMLElement,
  props?: any,
  root?: Root | null
): Promise<{ component: T; root: Root }> {
  return new Promise((resolve) => {
    const compRef = createRef();
    root ??= createRoot(targetElm);
    root.render(React.createElement(customComponent, { ...props, ref: compRef }));

    queueMicrotask(() => resolve({ component: compRef.current as T, root: root as Root }));
  });
}
