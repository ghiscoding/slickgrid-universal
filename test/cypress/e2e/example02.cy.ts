import moment from 'moment-tiny';
import { removeExtraSpaces } from '../plugins/utilities';

describe('Example 02 - Grouping & Aggregators', () => {
  const fullTitles = ['#', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Cost', 'Effort Driven'];
  const GRID_ROW_HEIGHT = 45;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example02`);
    cy.get('h3').should('contain', 'Example 02 - Grouping & Aggregators');
    cy.get('h3 span.subtitle').should('contain', '(with Material Theme)');
  });

  it('should have a min size, to verify that autoResize works properly', () => {
    cy.get('.grid2')
      .invoke('width')
      .should('be.gt', 10);
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should show a custom text in the grid footer left portion', () => {
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.left-footer')
      .contains('created with Slickgrid-Universal');
  });

  it('should have some metrics shown in the grid right footer', () => {
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 500 of 500 items`);
      });
  });

  it('should type a filter in the Title and expect 176 items shown in the footer', () => {
    cy.get('.search-filter.filter-title')
      .clear()
      .type('2');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 176 of 500 items`);
      });
  });

  it('should add another filter "Effort-Driven" set to True and expect 28 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(1)')
      .click();

    const currentDateTime = moment().format('YYYY-MM-DD, hh:mm a');
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${currentDateTime} | 28 of 500 items`);
      });
  });

  it('should change filter "Effort-Driven" to False and expect 148 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(2)')
      .click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 148 of 500 items`);
      });
  });

  it('should change filter "Effort-Driven" to the null option and expect 176 items shown in the footer and also no label to show in the drop parent', () => {
    cy.get('div.ms-filter.filter-effortDriven')
      .trigger('click');

    cy.get('.ms-drop')
      .find('li:nth(0)')
      .click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 176 of 500 items`);
      });

    cy.get('.ms-drop').should('contain', '');
  });

  it('should clear filters of grid2 using the Grid Menu "Clear all Filters" command', () => {
    cy.get('.grid2')
      .find('button.slick-grid-menu-button')
      .trigger('click')
      .click({ force: true });

    cy.get(`.slick-grid-menu:visible`)
      .find('.slick-menu-item')
      .first()
      .find('span')
      .contains('Clear all Filters')
      .click();
  });

  describe('Grouping Tests', () => {
    it('should "Group by Duration & sort groups by value" then Collapse All and expect only group titles', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="collapse-all-btn"]').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 1');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 2');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 3');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 4');
    });

    it('should click on Expand All columns and expect 1st row as grouping title and 2nd row as a regular row', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="expand-all-btn"]').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should "Group by Duration then Effort-Driven" and expect 1st row to be expanded, 2nd row to be collapsed and 3rd row to have group totals', () => {
      cy.get('[data-test="group-duration-effort-btn"]').click();

      cy.get('div.ms-filter.filter-effortDriven')
        .trigger('click');

      cy.get('.ms-drop')
        .find('span:nth(2)')
        .click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"].slick-group-totals.slick-group-level-0 .slick-cell:nth(2)`).should('contain', 'Total: 0');
    });

    it('should "Group by Duration then Effort-Driven then Percent" and expect fist 2 rows to be expanded, 3rd row to be collapsed then 4th row to have group total', () => {
      cy.get('[data-test="group-duration-effort-percent-btn"]').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"].slick-group-level-2 .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"].slick-group-level-2 .slick-group-title`).contains(/^% Complete: [0-9]/);

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"].slick-group-totals.slick-group-level-2 .slick-cell:nth(3)`).contains(/^Avg: [0-9]\%$/);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"].slick-group-totals.slick-group-level-2`)
        .find('.slick-cell:nth(3)').contains('Avg: ');
    });
  });
});
