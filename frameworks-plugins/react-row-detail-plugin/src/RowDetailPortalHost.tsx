import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import type { PortalEntry, ReactRowDetailView } from './reactRowDetailView.js';

export type { PortalEntry };

export interface RowDetailPortalHostProps {
  plugin: ReactRowDetailView;
}

/**
 * RowDetailPortalHost — place this component once in your app tree (e.g. alongside your SlickGrid component).
 * It renders each open row detail via React.createPortal, keeping every detail panel inside the app's
 * React component tree so that Context, Redux, Zustand, and other providers are fully accessible.
 *
 * Without this host, the plugin falls back to creating an isolated `createRoot()` per row detail,
 * which breaks context propagation and produces a React dev warning on every render.
 *
 * @example
 * ```tsx
 * import { ReactRowDetailView } from '@slickgrid-universal/react-row-detail-plugin';
 * import { RowDetailPortalHost } from '@slickgrid-universal/react-row-detail-plugin';
 *
 * // create the plugin instance once
 * const rowDetailPlugin = new ReactRowDetailView(eventPubSubService);
 *
 * // place the host anywhere in the same React tree as your grid (e.g. same component)
 * return (
 *   <>
 *     <SlickgridReact ... externalResources={[rowDetailPlugin]} />
 *     <RowDetailPortalHost plugin={rowDetailPlugin} />
 *   </>
 * );
 * ```
 */
export function RowDetailPortalHost({ plugin }: RowDetailPortalHostProps): ReactElement {
  const [entries, setEntries] = useState<PortalEntry[]>([]);

  useEffect(() => {
    plugin.registerPortalHost(setEntries);
    return () => {
      plugin.registerPortalHost(undefined);
    };
  }, [plugin]);

  return (
    <>
      {entries.map((entry) => {
        const Component = entry.component;
        const key = `${String(entry.id)}-${entry.gen ?? 0}`;
        return createPortal(<Component {...entry.data} key={key} />, entry.container, key);
      })}
    </>
  );
}
