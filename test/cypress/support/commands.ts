// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add("login", (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add("drag", { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add("dismiss", { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite("visit", (originalFn, url, options) => { ... })
import '@4tw/cypress-drag-drop';
import 'cypress-real-events';
// eslint-disable-next-line n/file-extension-in-import
import { convertPosition } from './common';

declare global {
  // oxlint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      // triggerHover: (elements: NodeListOf<HTMLElement>) => void;
      convertPosition(viewport: string): Chainable<HTMLElement | JQuery<HTMLElement> | { x: string; y: string }>;
      getCell(
        row: number,
        col: number,
        viewport?: string,
        options?: { parentSelector?: string; rowHeight?: number }
      ): Chainable<HTMLElement | JQuery<HTMLElement>>;
      getNthCell(
        row: number,
        nthCol: number,
        viewport?: string,
        options?: { parentSelector?: string; rowHeight?: number }
      ): Chainable<HTMLElement | JQuery<HTMLElement>>;
      getTransformValue(cssTransformMatrix: string, absoluteValue: boolean, transformType?: 'rotate' | 'scale'): Chainable<number>;
    }
  }
}

// convert position like 'topLeft' to the object { x: 'left|right', y: 'top|bottom' }
Cypress.Commands.add('convertPosition', (viewport = 'topLeft') => cy.wrap(convertPosition(viewport)));

Cypress.Commands.add('getCell', (row, col, viewport = 'topLeft', { parentSelector = '', rowHeight = 35 } = {}) => {
  const position = convertPosition(viewport);
  const canvasSelectorX = position.x ? `.grid-canvas-${position.x}` : '';
  const canvasSelectorY = position.y ? `.grid-canvas-${position.y}` : '';

  return cy.get(
    `${parentSelector} ${canvasSelectorX}${canvasSelectorY} [style="transform: translateY(${row * rowHeight}px);"] > .slick-cell.l${col}.r${col}`
  );
});

Cypress.Commands.add('getNthCell', (row, nthCol, viewport = 'topLeft', { parentSelector = '', rowHeight = 35 } = {}) => {
  const position = convertPosition(viewport);
  const canvasSelectorX = position.x ? `.grid-canvas-${position.x}` : '';
  const canvasSelectorY = position.y ? `.grid-canvas-${position.y}` : '';

  return cy.get(
    `${parentSelector} ${canvasSelectorX}${canvasSelectorY} [style="transform: translateY(${row * rowHeight}px);"] > .slick-cell:nth(${nthCol})`
  );
});

Cypress.Commands.add(
  'getTransformValue',
  (
    cssTransformMatrix: string,
    absoluteValue: boolean,
    transformType: 'rotate' | 'scale' = 'rotate' // Default to 'rotate'
  ): Cypress.Chainable<number> => {
    if (!cssTransformMatrix || cssTransformMatrix === 'none') {
      throw new Error('Transform matrix is undefined or none');
    }

    const cssTransformMatrixIndexes = cssTransformMatrix.split('(')[1].split(')')[0].split(',');

    if (transformType === 'rotate') {
      const cssTransformScale = Math.sqrt(
        +cssTransformMatrixIndexes[0] * +cssTransformMatrixIndexes[0] + +cssTransformMatrixIndexes[1] * +cssTransformMatrixIndexes[1]
      );

      const cssTransformSin = +cssTransformMatrixIndexes[1] / cssTransformScale;
      const cssTransformAngle = Math.round(Math.asin(cssTransformSin) * (180 / Math.PI));

      return cy.wrap(absoluteValue ? Math.abs(cssTransformAngle) : cssTransformAngle);
    } else if (transformType === 'scale') {
      // Assuming scale is based on the first value in the matrix.
      const scaleValue = +cssTransformMatrixIndexes[0]; // First value typically represents scaling in x direction.
      return cy.wrap(scaleValue); // Directly return the scale value.
    }

    throw new Error('Unsupported transform type');
  }
);
