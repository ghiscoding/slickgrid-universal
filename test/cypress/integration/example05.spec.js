/// <reference types="cypress" />

describe('Example 05 - Tree Data (from a flat dataset with parentId references)', () => {
  const GRID_ROW_HEIGHT = 45;
  const titles = ['Title', 'Duration', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example05`);
    cy.get('h3').should('contain', 'Example 05 - Tree Data');
    cy.get('h3 span.subtitle').should('contain', '(from a flat dataset with parentId references)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid5')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('should have a Grid Preset Filter on 3rd column "% Complete" and expect all rows to be filtered as well', () => {
    cy.get('.input-group-text.rangeOutput_percentComplete')
      .contains('25');

    cy.get('.search-filter.filter-percentComplete')
      .find('.input-group-addon.operator select')
      .contains('>=');
  });
});
