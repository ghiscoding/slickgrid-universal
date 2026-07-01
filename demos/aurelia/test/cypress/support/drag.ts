/* eslint-disable n/file-extension-in-import */
import { convertPosition } from './common';

declare global {
  // oxlint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      // triggerHover: (elements: NodeListOf<HTMLElement>) => void;
      drag(target: string | HTMLElement | JQuery<HTMLElement>, options?: any): Chainable<any>;
      dragOutside(
        viewport?: string,
        ms?: number,
        px?: number,
        options?: { parentSelector?: string; scrollbarDimension?: number; rowHeight?: number }
      ): Chainable<HTMLElement>;
      dragStart(options?: { cellWidth?: number; cellHeight?: number }): Chainable<HTMLElement>;
      dragCell(addRow: number, addCell: number, options?: { cellWidth?: number; cellHeight?: number }): Chainable<HTMLElement>;
      dragEnd(gridSelector?: string): Chainable<HTMLElement>;
    }
  }
}

Cypress.Commands.overwrite('drag', (_originalFn: any, subject: any, target: any, _options: any = {}) => {
  return cy.wrap(subject as JQuery<HTMLElement>).then(($source) => {
    const rawSourceElm = $source?.[0] as HTMLElement | undefined;
    const rawTargetElm =
      typeof target === 'string'
        ? (Cypress.$(target).first()?.[0] as HTMLElement | undefined)
        : ((target as JQuery<HTMLElement>)?.[0] as HTMLElement | undefined);
    const sourceElm =
      rawSourceElm?.closest<HTMLElement>('.slick-header-column, .slick-dropped-grouping, [draggable="true"]') ?? rawSourceElm;
    const targetElm =
      rawTargetElm?.closest<HTMLElement>('.slick-header-column, .slick-dropped-grouping, [draggable="true"]') ?? rawTargetElm;

    if (!sourceElm || !targetElm) {
      return $source;
    }

    const sourceRect = sourceElm.getBoundingClientRect();
    const targetRect = targetElm.getBoundingClientRect();
    const sourceX = Number.isFinite(sourceRect.left + sourceRect.width / 2) ? sourceRect.left + sourceRect.width / 2 : 0;
    const sourceY = Number.isFinite(sourceRect.top + sourceRect.height / 2) ? sourceRect.top + sourceRect.height / 2 : 0;
    const targetX = Number.isFinite(targetRect.left + targetRect.width / 2) ? targetRect.left + targetRect.width / 2 : 0;
    const targetY = Number.isFinite(targetRect.top + targetRect.height / 2) ? targetRect.top + targetRect.height / 2 : 0;

    const dataTransfer = new DataTransfer();
    const createDragLikeEvent = (eventName: string, x: number, y: number): Event => {
      const evt = new Event(eventName, { bubbles: true, cancelable: true });
      Object.defineProperty(evt, 'dataTransfer', { value: dataTransfer });
      Object.defineProperty(evt, 'clientX', { value: x });
      Object.defineProperty(evt, 'clientY', { value: y });
      Object.defineProperty(evt, 'pageX', { value: x });
      Object.defineProperty(evt, 'pageY', { value: y });
      Object.defineProperty(evt, 'screenX', { value: x });
      Object.defineProperty(evt, 'screenY', { value: y });
      return evt;
    };

    sourceElm.dispatchEvent(createDragLikeEvent('dragstart', sourceX, sourceY));
    targetElm.dispatchEvent(createDragLikeEvent('dragenter', targetX, targetY));
    targetElm.dispatchEvent(createDragLikeEvent('dragover', targetX, targetY));
    targetElm.dispatchEvent(createDragLikeEvent('drop', targetX, targetY));
    sourceElm.dispatchEvent(createDragLikeEvent('dragend', targetX, targetY));

    return $source;
  });
});

// @ts-ignore
Cypress.Commands.add('dragStart', { prevSubject: true }, (subject: HTMLElement, { cellWidth = 90, cellHeight = 35 } = {}) => {
  return cy
    .wrap(subject)
    .click({ force: true })
    .trigger('mousedown', { which: 1 } as any, { force: true })
    .trigger('mousemove', cellWidth / 3, cellHeight / 3);
});

// use a different command name than 'drag' so that it doesn't conflict with the '@4tw/cypress-drag-drop' lib
Cypress.Commands.add(
  'dragCell',
  // @ts-ignore
  { prevSubject: true },
  (subject: HTMLElement, addRow: number, addCell: number, { cellWidth = 90, cellHeight = 35 } = {}) => {
    return cy.wrap(subject).trigger('mousemove', cellWidth * (addCell + 0.5), cellHeight * (addRow + 0.5), { force: true });
  }
);

Cypress.Commands.add(
  'dragOutside',
  (viewport = 'topLeft', ms = 0, px = 0, { parentSelector = 'div[class^="slickgrid_"]', scrollbarDimension = 17 } = {}) => {
    const $parent = cy.$$(parentSelector);
    const gridWidth = $parent.width() as number;
    const gridHeight = $parent.height() as number;
    let x = gridWidth / 2;
    let y = gridHeight / 2;
    const position = convertPosition(viewport);
    if (position.x === 'left') {
      x = -px;
    } else if (position.x === 'right') {
      x = gridWidth - scrollbarDimension + 3 + px;
    }
    if (position.y === 'top') {
      y = -px;
    } else if (position.y === 'bottom') {
      y = gridHeight - scrollbarDimension + 3 + px;
    }

    cy.get(parentSelector).trigger('mousemove', x, y, { force: true });
    if (ms) {
      cy.wait(ms);
    }
    return;
  }
);

Cypress.Commands.add('dragEnd', { prevSubject: 'optional' }, (_subject, gridSelector = 'div[class^="slickgrid_"]') => {
  cy.get(gridSelector).trigger('mouseup', { force: true });
  return;
});

export function getScrollDistanceWhenDragOutsideGrid(
  selector: string,
  viewport: string,
  dragDirection: string,
  fromRow: number,
  fromCol: number,
  px = 140
) {
  return (cy as any).convertPosition(viewport).then((_viewportPosition: { x: number; y: number }) => {
    const viewportSelector = `${selector} .slick-viewport-${_viewportPosition.x}.slick-viewport-${_viewportPosition.y}`;
    (cy as any).getNthCell(fromRow, fromCol, viewport, { parentSelector: selector }).dragStart();
    return cy.get(viewportSelector).then(($viewport) => {
      const scrollTopBefore = $viewport.scrollTop();
      const scrollLeftBefore = $viewport.scrollLeft();
      cy.dragOutside(dragDirection, 300, px, { parentSelector: selector });
      return cy.get(viewportSelector).then(($viewportAfter) => {
        cy.dragEnd(selector);
        const scrollTopAfter = $viewportAfter.scrollTop();
        const scrollLeftAfter = $viewportAfter.scrollLeft();
        cy.get(viewportSelector).scrollTo(0, 0, { ensureScrollable: false });
        return cy.wrap({
          scrollTopBefore,
          scrollLeftBefore,
          scrollTopAfter,
          scrollLeftAfter,
        });
      });
    });
  });
}
