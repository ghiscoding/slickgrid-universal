import { createElement, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { ReactRowDetailView, RowDetailPortalEntry } from './reactRowDetailView.js';

/** Render row details under this component's React providers. */
export function RowDetailPortalHost({ plugin }: { plugin: ReactRowDetailView }) {
  const [entries, setEntries] = useState<RowDetailPortalEntry[]>([]);
  const pending = useRef<(() => void)[]>([]);
  useLayoutEffect(() => {
    pending.current.splice(0).forEach((resolve) => resolve());
  }, [entries]);
  useEffect(() => {
    plugin.registerPortalHost((value) => {
      setEntries(value);
      return new Promise<void>((resolve) => pending.current.push(resolve));
    });
    return () => {
      plugin.registerPortalHost();
      pending.current.splice(0).forEach((resolve) => resolve());
    };
  }, [plugin]);
  return entries.map(({ id, target, component, props }) => createPortal(createElement(component, props), target, String(id)));
}
