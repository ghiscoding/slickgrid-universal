/// <reference types="cypress" />

function removeExtraSpaces(textS) {
  return `${textS}`.replace(/\s+/g, ' ').trim();
}

describe('Example 08 - Column Span & Header Grouping', () => {
  // NOTE:  everywhere there's a * 2 is because we have a top+bottom (frozen rows) containers even after clear frozen columns
  const fullPreTitles = ['', 'Common Factor', 'Period', 'Analysis'];
  const fullTitles = ['#', 'Title', 'Duration', 'Start', 'Finish', '% Complete', 'Effort Driven'];
  const GRID_ROW_HEIGHT = 33;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example08`);
    cy.get('h3').should('contain', 'Example 08 - Column Span & Header Grouping');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have a frozen grid on page load with 3 columns on the left and 4 columns on the right', () => {
    cy.get('.grid2').find(`[style="top:${GRID_ROW_HEIGHT * 0}px"]`).should('have.length', 2);
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 3);
    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 4);

    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]> .slick-cell:nth(0)`).should('contain', '0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]> .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]> .slick-cell:nth(2)`).should('contain', '5 days');

    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"]> .slick-cell:nth(0)`).should('contain', '01/01/2009');
    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"]> .slick-cell:nth(1)`).should('contain', '01/05/2009');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Remove Frozen Columns" button to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('[data-test="remove-frozen-column-button"]')
      .click();

    cy.get('.grid2').find(`[style="top:${GRID_ROW_HEIGHT * 0}px"]`).should('have.length', 1);
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 7);

    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '5 days');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).should('contain', '01/01/2009');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '01/05/2009');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Set 3 Frozen Columns" button to switch frozen columns grid and expect 3 frozen columns on the left and 4 columns on the right', () => {
    cy.contains('Set 3 Frozen Columns')
      .click({ force: true });

    cy.get('.grid2').find(`[style="top:${GRID_ROW_HEIGHT * 0}px"]`).should('have.length', 2);
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 3);
    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 4);

    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '5 days');

    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', '01/01/2009');
    cy.get('.grid2').find(`.grid-canvas-right > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', '01/05/2009');
  });

  it('should have exact Column Pre-Header & Column Header Titles in the grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullPreTitles[index]));

    cy.get('.grid2')
      .find('.slick-header-columns:nth(1)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the Grid Menu command "Clear Frozen Columns" to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('.grid2')
      .find('button.slick-gridmenu-button')
      .click({ force: true });

    cy.contains('Clear Frozen Columns')
      .click({ force: true });

    cy.get('.grid2').find(`[style="top:${GRID_ROW_HEIGHT * 0}px"]`).should('have.length', 1);
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"]`).children().should('have.length', 7);

    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(0)`).should('contain', '0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', '5 days');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).should('contain', '01/01/2009');
    cy.get('.grid2').find(`.grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '01/05/2009');
  });

  it('should search for Title ending with text "5" expect rows to be (Task 5, 15, 25, ...)', () => {
    cy.get('[data-test="search-column-list"]')
      .select('title');

    cy.get('[data-test="search-operator-list"]')
      .select('EndsWith');

    cy.get('[data-test="search-value-input"]')
      .type('5');

    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'Task 5');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'Task 15');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'Task 25');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'Task 35');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).should('contain', 'Task 45');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`50 of 500 items`);
      });
  });

  it('should search for "% Complete" below 50 and expect rows to be that', () => {
    cy.get('[data-test="clear-search-input"]')
      .click();

    cy.get('[data-test="search-column-list"]')
      .select('percentComplete');

    cy.get('[data-test="search-operator-list"]')
      .select('<');

    cy.get('[data-test="search-value-input"]')
      .type('50');

    cy.wait(50);

    cy.get('.grid2')
      .find('.slick-row .slick-cell:nth-child(6):visible')
      .each(($child, index) => {
        if (index > 8) {
          return;
        }
        expect(+$child.text()).to.be.lt(50);
      });
  });

  it('should type a filter which returns an empty dataset', () => {
    cy.get('[data-test="search-value-input"]')
      .clear()
      .type('zzz');

    cy.get('.slick-empty-data-warning:visible')
      .contains('No data to display.');
  });

  it('should clear search input and expect empty dataset warning to go away and also expect data back (Task 0, 1, 2, ...)', () => {
    cy.get('[data-test="clear-search-input"]')
      .click();

    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'Task 3');
    cy.get(`.grid2 .grid-canvas-left > [style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).should('contain', 'Task 4');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`500 of 500 items`);
      });
  });
});
