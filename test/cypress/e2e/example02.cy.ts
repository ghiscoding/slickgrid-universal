import { format } from '@formkit/tempo';
// eslint-disable-next-line n/file-extension-in-import
import { removeExtraSpaces } from '../plugins/utilities';

describe('Example 02 - Grouping & Aggregators', () => {
  const fullTitles = ['Id Click me', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Cost', 'Effort Driven'];
  const GRID_ROW_HEIGHT = 45;
  let currentTimestamp = '';

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example02`);
    cy.get('h3').should('contain', 'Example 02 - Grouping & Aggregators');
    cy.get('h3 span.subtitle').should('contain', '(with Material Theme)');

    // after demo is rendered, let's grab current timestamp displayed in right footer
    currentTimestamp = format(new Date(), 'YYYY-MM-DD, hh:mm a');
  });

  it('should have some metrics shown in the grid right footer', () => {
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${currentTimestamp} | 5000 of 5000 items`);
      });
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have a min size, to verify that autoResize works properly', () => {
    cy.get('.grid2').invoke('width').should('be.gt', 10);
  });

  it('should show a custom text in the grid footer left portion', () => {
    cy.get('.grid2').find('.slick-custom-footer').find('.left-footer').contains('created with Slickgrid-Universal');
  });

  it('should expect grid to be Grouped by "Duration" when loaded', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should(
      'have.length',
      1
    );
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
      'contain',
      'Duration: 0'
    );

    // 2nd row should be a regular row
    cy.get('[data-row="1"] > .slick-cell.l1').contains(/Task [0-9]*/);
    cy.get('[data-row="1"] > .slick-cell.l2').contains('0');
  });

  it('should clear all Groupings', () => {
    cy.get('[data-test="clear-grouping-btn"]').click();

    // 1st and 2nd row should now be a regular row
    cy.get('[data-row="0"] > .slick-cell.l1').contains(/Task [0-9]*/);
    cy.get('[data-row="1"] > .slick-cell.l1').contains(/Task [0-9]*/);
  });

  it('should copy "Task 2" cell text to clipboard and paste it and expect 111 items shown in the footer', () => {
    cy.get('.search-filter.filter-title').clear();
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).rightclick({ force: true });
    cy.get('.slick-context-menu.dropright .slick-menu-command-list')
      .find('.slick-menu-item:nth(0)')
      .find('.slick-menu-content')
      .contains('Copy')
      .click();

    // paste in filter
    // paste is not yet supported in Cypress, so we need to invoke the value manually (see: https://github.com/cypress-io/cypress/issues/2386)
    cy.get('.search-filter.filter-title').clear().type('{ctrl+v}');
    cy.get('.search-filter.filter-title').invoke('val', 'Task 2');
    cy.get('.search-filter.filter-title').type('{enter}');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.include('111 of 5000 items');
      });
  });

  it('should type a filter in the Title and expect 2084 items shown in the footer', () => {
    cy.get('.search-filter.filter-title').clear().type('2');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${format(new Date(), 'YYYY-MM-DD, hh:mm a')} | 2084 of 5000 items`);
      });
  });

  it('should add another filter "Effort-Driven" set to True and expect 352 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven').trigger('click');

    cy.get('.ms-drop').find('span:nth(1)').click();

    const currentDateTime = format(new Date(), 'YYYY-MM-DD, hh:mm a');
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${currentDateTime} | 352 of 5000 items`);
      });
  });

  it('should change filter "Effort-Driven" to False and expect 1732 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven').trigger('click');

    cy.get('.ms-drop').find('span:nth(2)').click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${format(new Date(), 'YYYY-MM-DD, hh:mm a')} | 1732 of 5000 items`);
      });
  });

  it('should change filter "Effort-Driven" to the null option and expect 2084 items shown in the footer and also no label to show in the drop parent', () => {
    cy.get('div.ms-filter.filter-effortDriven').trigger('click');

    cy.get('.ms-drop').find('li:nth(0)').click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should(($span) => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${format(new Date(), 'YYYY-MM-DD, hh:mm a')} | 2084 of 5000 items`);
      });

    cy.get('.ms-drop').should('contain', '');
  });

  it('should clear filters of grid2 using the Grid Menu "Clear all Filters" command', () => {
    cy.get('.grid2').find('button.slick-grid-menu-button').trigger('click').click({ force: true });

    cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();
  });

  describe('Grouping Tests', () => {
    it('should "Group by Duration & sort groups by value" then Collapse All and expect only group titles', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="collapse-all-btn"]').click();

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should(
        'have.length',
        1
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 0'
      );

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 1'
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 2'
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 3'
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 4'
      );
    });

    it('should click on Expand All columns and expect 1st row as grouping title and 2nd row as a regular row', () => {
      cy.get('[data-test="add-50k-rows-btn"]').click();
      cy.get('[data-test="group-duration-sort-value-btn"]').click();
      cy.get('[data-test="expand-all-btn"]').click();

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should(
        'have.length',
        1
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(0) .slick-group-title`).should(
        'contain',
        'Duration: 0'
      );

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should "Group by Duration then Effort-Driven" and expect 1st row to be expanded, 2nd row to be collapsed and 3rd row to have group totals', () => {
      cy.get('[data-test="group-duration-effort-btn"]').click();

      cy.get('div.ms-filter.filter-effortDriven').trigger('click');

      cy.get('.ms-drop').find('span:nth(2)').click();

      cy.get(
        `[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`
      ).should('have.length', 1);
      cy.get(
        `[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`
      ).should('contain', 'Duration: 0');

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"].slick-group-level-1 .slick-group-toggle.collapsed`).should(
        'have.length',
        1
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"].slick-group-level-1 .slick-group-title`).should(
        'contain',
        'Effort-Driven: False'
      );

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"].slick-group-totals.slick-group-level-0 .slick-cell:nth(2)`).should(
        'contain',
        'Total: 0'
      );
    });

    it('should "Group by Duration then Effort-Driven then Percent" and expect fist 2 rows to be expanded, 3rd row to be collapsed then 4th row to have group total', () => {
      cy.get('[data-test="group-duration-effort-percent-btn"]').click();

      cy.get(
        `[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`
      ).should('have.length', 1);
      cy.get(
        `[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`
      ).should('contain', 'Duration: 0');

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"].slick-group-level-1 .slick-group-toggle.expanded`).should(
        'have.length',
        1
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"].slick-group-level-1 .slick-group-title`).should(
        'contain',
        'Effort-Driven: False'
      );

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"].slick-group-level-2 .slick-group-toggle.collapsed`).should(
        'have.length',
        1
      );
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"].slick-group-level-2 .slick-group-title`).contains(
        /^% Complete: [0-9]/
      );

      cy.get(
        `[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"].slick-group-totals.slick-group-level-2 .slick-cell:nth(3)`
      ).contains(/^Avg: [0-9]%$/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"].slick-group-totals.slick-group-level-2`)
        .find('.slick-cell:nth(3)')
        .contains('Avg: ');
    });
  });

  describe('Diverse Input Text Filters with multiple symbol variances', () => {
    it('should clear all Groupings', () => {
      cy.get('[data-test="clear-grouping-btn"]').click();
    });

    it('should return 500 rows using "Ta*33" (starts with "Ta" + ends with 33)', () => {
      cy.get('.search-filter.filter-title').clear().type('Ta*3');

      cy.get('.item-count').should('contain', 5000);

      cy.get('.search-filter.filter-title').clear().type('Ta*33');

      cy.get('.item-count').should('contain', 500);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 33');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 133');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 233');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 333');
    });

    it('should return 40000 rows using "Ta*" (starts with "Ta")', () => {
      cy.get('.search-filter.filter-title').clear().type('Ta*');

      cy.get('.item-count').should('contain', 40000);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 3');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 4');
    });

    it('should return 500 rows using "*11" (ends with "11")', () => {
      cy.get('.search-filter.filter-title').clear().type('*11');

      cy.get('.item-count').should('contain', 500);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 11');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 21');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 31');
    });

    it('should return 497 rows using ">222" (greater than 222)', () => {
      cy.get('.search-filter.filter-sel').clear().type('>222');

      cy.get('.item-count').should('contain', 497);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 311');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 411');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 511');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 611');
    });

    it('should return 499 rows using "<>311" (not equal to 311)', () => {
      cy.get('.search-filter.filter-sel').clear().type('<>311');

      cy.get('.item-count').should('contain', 499);

      cy.get('.search-filter.filter-sel').clear().type('!=311');

      cy.get('.item-count').should('contain', 499);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 11');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 111');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 211');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 411');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 511');
    });

    it('should return 1 rows using "=311" or "==311" (equal to 311)', () => {
      cy.get('.search-filter.filter-sel').clear().type('=311');

      cy.get('.item-count').should('contain', 1);

      cy.get('.search-filter.filter-sel').clear().type('==311');

      cy.get('.item-count').should('contain', 1);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 311');
    });
  });

  describe('Column Header with HTML Elements', () => {
    it('should trigger an alert when clicking on the 1st column button inside its header', () => {
      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('button[data-test=col1-hello-btn]')
        .click({ force: true })
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Hello World'));
    });

    it('should open Column Picker and have a "Custom Label" as the 1st column label', () => {
      cy.get('.grid2').find('.slick-header-column').first().trigger('mouseover').trigger('contextmenu').invoke('show');

      cy.get('.slick-column-picker').find('.slick-column-picker-list li:nth-child(1) .checkbox-label').should('have.text', 'Custom Label');
    });

    it('should open Grid Menu and have a "Custom Label" as the 1st column label', () => {
      cy.get('.grid2').find('button.slick-grid-menu-button').trigger('click').click({ force: true });

      cy.get(`.slick-grid-menu:visible`)
        .find('.slick-column-picker-list li:nth-child(1) .checkbox-label')
        .should('have.text', 'Custom Label');

      cy.get('[data-dismiss="slick-grid-menu"]').click();
    });
  });

  describe('Date Parsing', () => {
    beforeEach(() => {
      window.console.clear();
      // create a console.log spy for later use
      cy.window().then((win) => {
        cy.spy(win.console, 'log');
      });
    });

    it('should clear all filters before sorting', () => {
      cy.get('.grid2').find('button.slick-grid-menu-button').trigger('click').click({ force: true });

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();
    });

    it('should sort by "Start" date and to wait about 1.5sec', () => {
      cy.get('[data-id="start"').click();
      cy.wait(200);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '01/05/2010');
      cy.window().then((win) => {
        expect(win.console.log).to.be.calledWithMatch(/sort: [0-9]{3,4}.?[0-9]* ms/);
      });
    });

    it('should sort by "Finish" date without having to wait', () => {
      cy.get('[data-id="finish"').click();
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(5)`).should('contain', '02/05/2010');
      cy.window().then((win) => {
        expect(win.console.log).to.be.calledWithMatch(/sort: [0-9]{2,3}.?[0-9]* ms/);
      });
    });

    it('should sort by "Start" date again but DESC and not have to wait', () => {
      cy.get('[data-id="start"').click().click();
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(4)`).should('contain', '12/28/2035');
      cy.window().then((win) => {
        expect(win.console.log).to.be.calledWithMatch(/sort: [0-9]{2,3}.?[0-9]* ms/);
      });
    });
  });
});
