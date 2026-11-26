import type { SlickGrid } from '@slickgrid-universal/common';

export function visitWithGrid(url: string, selector: string, onGridCreated: (grid: SlickGrid) => void) {
  return cy.visit(url, {
    onBeforeLoad(win) {
      // Grid creation events do not bubble, so listen during capture.
      win.document.addEventListener(
        'ongridcreated',
        (event) => {
          if ((event.target as Element).matches(selector)) {
            onGridCreated((event as CustomEvent<SlickGrid>).detail);
          }
        },
        true
      );
    },
  });
}
