/// <reference types="cypress" />

describe('Example 03 - Draggable Grouping', () => {
  const fullTitles = ['', 'Title', 'Duration', 'Cost', '% Complete', 'Start', 'Finish', 'Effort Driven', 'Action'];
  const GRID_ROW_HEIGHT = 33;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example03`);
    cy.get('h3').should('contain', 'Example 03 - Draggable Grouping');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid3')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  describe('Grouping Tests', () => {
    it('should "Group by Duration & sort groups by value" then Collapse All and expect only group titles', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="collapse-all-btn"]').click();

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 1');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 2');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 3');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 4');
    });

    it('should click on Expand All columns and expect 1st row as grouping title and 2nd row as a regular row', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="expand-all-btn"]').click();

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should show 1 column title (Duration) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
    });

    it('should "Group by Duration then Effort-Driven" and expect 1st row to be expanded, 2nd row to be expanded and 3rd row to be a regular row', () => {
      cy.get('[data-test="group-duration-effort-btn"]').click();

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"].slick-group-level-1 .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"].slick-group-level-1 .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should show 2 column titles (Duration, Effort Driven) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
      cy.get('.slick-dropped-grouping:nth(1) div').contains('Effort Driven');
    });

    it('should be able to drag and swap grouped column titles inside the pre-header', () => {
      cy.get('.slick-dropped-grouping:nth(0) div')
        .contains('Duration')
        .trigger('mousedown', 'bottom', { which: 1 });

      cy.get('.slick-dropped-grouping:nth(1) div')
        .contains('Effort Driven')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { force: true });
    });

    it('should expect the grouping to be swapped as well in the grid', () => {
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"].slick-group-level-1 .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"].slick-group-level-1 .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', '0');
    });
  });
});
