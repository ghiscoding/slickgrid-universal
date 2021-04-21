/// <reference types="cypress" />

describe('Example 14 - Columns Resize by Content', () => {
  const titles = ['', 'Title', 'Duration', 'Cost', '% Complete', 'Complexity', 'Start', 'Completed', 'Finish', 'Product', 'Country of Origin', 'Action'];

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example14`);
    cy.get('h3').should('contain', 'Example 14 - Columns Resize by Content');
  });

  it('should have cell that fit the text content', () => {
    cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('equal', 79);
    cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('equal', 98);
    cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('equal', 67);
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('equal', 110);
    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('equal', 106);
    cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('equal', 88);
    cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('equal', 68);
    cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('equal', 88);
    cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('equal', 173);
    cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('equal', 100);
    cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('equal', 58);
  });

  it('should make the grid readonly and export to fit the text by content and expect column width to be a bit smaller', () => {
    cy.get('[data-test="toggle-readonly-btn"]').click();

    cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('equal', 71);
    cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('equal', 98);
    cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('equal', 67);
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('equal', 102);
    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('equal', 98);
    cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('equal', 80);
    cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('equal', 68);
    cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('equal', 80);
    cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('equal', 165);
    cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('equal', 92);
    cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('equal', 58);
  });

  it('should click on (default resize "autosizeColumns") and expect column to be much thinner and fit all its column within the grid container', () => {
    cy.get('[data-text="autosize-columns-btn"]').click();

    cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('be.lt', 75);
    cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('be.lt', 95);
    cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('be.lt', 70);
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('be.lt', 100);
    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.lt', 100);
    cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('be.lt', 85);
    cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('be.lt', 70);
    cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('be.lt', 85);
    cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.lt', 120);
    cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('be.lt', 100);
    cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('equal', 58);
  });
});
