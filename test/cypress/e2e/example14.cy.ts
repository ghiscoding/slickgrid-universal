import { addDay, format } from '@formkit/tempo';

describe('Example 14 - Columns Resize by Content', () => {
  const GRID_ROW_HEIGHT = 33;

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  describe('Main Tests', () => {
    it('should display Example title', () => {
      cy.visit(`${Cypress.config('baseUrl')}/example14`);
      cy.get('h3').should('contain', 'Example 14 - Columns Resize by Content');
    });

    it('should navigate to bottom/top of the grid with command execution', () => {
      cy.get('.items-per-page').select('500');
      cy.get('[data-test="navigate-bottom"]').click();
      cy.get('[data-row=399] > .slick-cell.l1.r1').should('contain', 'Task 399');

      cy.get('[data-test="navigate-top"]').click();
      cy.get('[data-row=1]').should('contain', 'Task 1');
      cy.get('.items-per-page').select('10');
    });

    it('should have cell that fit the text content', () => {
      cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('be.approximately', 79, 1);
      cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('be.approximately', 98, 1);
      cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('be.approximately', 67, 1);
      cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('be.approximately', 160, 1);
      cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.approximately', 98, 1);
      cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('be.approximately', 82, 1);
      cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('be.approximately', 68, 1);
      cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('be.approximately', 82, 1);
      cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.approximately', 162, 1);
      cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('be.approximately', 98, 1);
      cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('be.approximately', 58, 1);
    });

    it('should make the grid readonly and expect to fit the text by content and expect column width to be the same as earlier', () => {
      cy.get('[data-test="toggle-readonly-btn"]').click();

      cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('be.approximately', 71, 1);
      cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('be.approximately', 98, 1);
      cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('be.approximately', 67, 1);
      cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('be.approximately', 152, 1);
      cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.approximately', 91, 1);
      cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('be.approximately', 74, 1);
      cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('be.approximately', 68, 1);
      cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('be.approximately', 74, 1);
      cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.approximately', 154, 1);
      cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('be.approximately', 90, 1);
      cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('be.approximately', 58, 1);
    });

    it('should click on (default resize "autosizeColumns") and expect column to be much thinner and fit all its column within the grid container', () => {
      cy.get('[data-test="autosize-columns-btn"]').click();

      cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('be.lt', 75);
      cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('be.lt', 91);
      cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('be.lt', 70);
      cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('be.lt', 150);
      cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.lt', 100);
      cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('be.lt', 85);
      cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('be.lt', 70);
      cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('be.lt', 85);
      cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.lt', 120);
      cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('be.lt', 100);
      cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('be.approximately', 58, 1);
    });

    it('should double-click on the "Complexity" column resize handle and expect the column to become wider and show all text', () => {
      cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.lt', 80);

      cy.get('.slick-header-column:nth-of-type(6) .slick-resizable-handle').dblclick();

      cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.gt', 90);
    });

    it('should open the "Product" header menu and click on "Resize by Content" and expect the column to become wider and show all text', () => {
      cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.lt', 120);

      cy.get('.grid14')
        .find('.slick-header-column:nth-of-type(10)')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu .slick-menu-command-list')
        .should('be.visible')
        .children('.slick-menu-item:nth-of-type(1)')
        .children('.slick-menu-content')
        .should('contain', 'Resize by Content')
        .click();

      cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.gt', 120);
    });

    it('should change row selection across multiple pages, first page should have 2 selected', () => {
      cy.get('[data-test="set-dynamic-rows-btn"]').click();

      // Row index 3, 4 and 11 (last one will be on 2nd page)
      cy.get('input[type="checkbox"]:checked').should('have.length', 2); // 2x in current page and 1x in next page
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
    });

    it('should go to next page and expect 1 row selected in that second page', () => {
      cy.get('.icon-seek-next').click();

      cy.get('input[type="checkbox"]:checked').should('have.length', 1); // only 1x row in page 2
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
    });

    it('should click on "Select All" checkbox and expect all rows selected in current page', () => {
      const expectedRowIds = [11, 3, 4];

      // go back to 1st page
      cy.get('.icon-seek-prev').click();

      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').click({ force: true });

      cy.window().then((win) => {
        expect(win.console.log).to.have.callCount(6);
        expect(win.console.log).to.be.calledWith('Selected Ids:', expectedRowIds);
      });
    });

    it('should go to the next 2 pages and expect all rows selected in each page', () => {
      cy.get('.icon-seek-next').click();

      cy.get('.slick-cell-checkboxsel input:checked').should('have.length', 10);

      cy.get('.icon-seek-next').click();

      cy.get('.slick-cell-checkboxsel input:checked').should('have.length', 10);
    });

    it('should uncheck 1 row and expect current and next page to have "Select All" uncheck', () => {
      cy.get('.slick-row:nth(1) .slick-cell:nth(0) input[type=checkbox]').click({ force: true });

      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').should('not.be.checked', true);

      cy.get('.icon-seek-next').click();

      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').should('not.be.checked', true);
    });

    it('should go back to previous page, select the row that was unchecked and expect "Select All" to be selected again', () => {
      cy.get('.icon-seek-prev').click();

      cy.get('.slick-row:nth(1) .slick-cell:nth(0) input[type=checkbox]').click({ force: true });

      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').should('be.checked', true);

      cy.get('.icon-seek-next').click();

      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').should('be.checked', true);
    });

    it('should Unselect All and expect all pages to no longer have any row selected', () => {
      cy.get('#filter-checkbox-selectall-container input[type=checkbox]').click({ force: true });

      cy.get('.slick-cell-checkboxsel input:checked').should('have.length', 0);

      cy.get('.icon-seek-prev').click();

      cy.get('.slick-cell-checkboxsel input:checked').should('have.length', 0);

      cy.get('.icon-seek-prev').click();

      cy.get('.slick-cell-checkboxsel input:checked').should('have.length', 0);
    });

    it('should NOT be able to choose a Finish date older than today', () => {
      // make grid editable
      cy.get('[data-test="toggle-readonly-btn"]').click();

      // 1st click on "Completed" to enable "Finish" date
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`).dblclick();
      cy.get('.editor-completed').check();

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(8)`)
        .should('contain', '')
        .dblclick(); // this date should also always be initially empty

      const yesterdayDate = format(addDay(new Date(), -1), 'YYYY-MM-DD');
      const todayDate = format(new Date(), 'YYYY-MM-DD');

      // Check if yesterday's date element exists (may not be visible when 1st day of the month is a Sunday, e.g. 2026-02-01)
      cy.get(`[data-vc-date=${yesterdayDate}]`).then(($el) => {
        if ($el.length > 0) {
          expect($el).to.have.attr('data-vc-date-disabled');
        }
      });
      cy.get(`[data-vc-date=${todayDate}]`).should('not.have.attr', 'data-vc-date-disabled');

      // make grid readonly again
      cy.get('[data-test="toggle-readonly-btn"]').click();
    });
  });

  describe('Filter Predicate on "Title" column that act similarly to an SQL LIKE matcher', () => {
    it('should return 4 rows using "%10" (ends with 10)', () => {
      cy.get('.search-filter.filter-title').clear().type('%10');

      cy.get('[data-test="total-items"]').should('have.text', 4);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 10');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 110');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 210');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 310');
    });

    it('should return 4 rows using "%ask%20" (contains "ask" + ends with 20)', () => {
      cy.get('.search-filter.filter-title').clear().type('%ask%20');

      cy.get('[data-test="total-items"]').should('have.text', 4);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 20');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 120');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 220');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 320');
    });

    it('should return all 400 rows using "%ask%" (contains "ask")', () => {
      cy.get('.search-filter.filter-title').clear().type('%ask%');

      cy.get('[data-test="total-items"]').should('have.text', 400);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 0');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 1');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 2');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 3');
    });

    it('should return 4 rows using "Ta%30" (starts with "Ta" + ends with 30)', () => {
      cy.get('.search-filter.filter-title').clear().type('Ta%30');

      cy.get('[data-test="total-items"]').should('have.text', 4);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 30');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 130');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 230');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 330');
    });

    it('should return 14 rows using "Ta%30%" (starts with "Ta" + ends with 30)', () => {
      cy.get('.search-filter.filter-title').clear().type('Ta%30%');

      cy.get('[data-test="total-items"]').should('have.text', 14);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 30');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 130');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 230');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 300');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 301');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 5}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 302');
    });

    it('should return all 400 rows using "Ta%" (starts with "Ta")', () => {
      cy.get('.search-filter.filter-title').clear().type('Ta%');

      cy.get('[data-test="total-items"]').should('have.text', 400);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 0');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 1');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 2');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 3');
    });

    it('should return 14 rows using "25" (contains 25)', () => {
      cy.get('.search-filter.filter-title').clear().type('25');

      cy.get('[data-test="total-items"]').should('have.text', 14);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 25');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 125');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 225');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 250');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 251');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 5}px);"] > .slick-cell:nth(1)`).should('have.text', 'Task 252');
    });

    it('should not return any row when filtering Title with "%%"', () => {
      cy.get('.search-filter.filter-title').clear().type('%%');

      cy.get('[data-test="total-items"]').should('have.text', 0);
    });

    it('return all 400 rows when filtering Title as "%ask%"', () => {
      cy.get('.search-filter.filter-duration').clear();
      cy.get('.search-filter.filter-title').clear().type('%ask%');

      cy.get('[data-test="total-items"]').should('have.text', 400);
    });

    it('return some rows (not all 400) when filtering Title as "%ask%" AND a Duration ">50" to test few filters still working', () => {
      cy.get('.search-filter.filter-title').clear();
      cy.get('.search-filter.filter-duration').clear().type('>50');

      cy.get('[data-test="total-items"]').should('not.have.text', 0);

      cy.get('[data-test="total-items"]').should('not.have.text', 400);
    });
  });

  describe('Custom Header Menu & sub-menus tests', () => {
    it('should open Hello sub-menu with 2 options expect it to be aligned to right then trigger alert when command is clicked', () => {
      const subCommands = ['Hello World', 'Hello SlickGrid', `Let's play`];
      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.grid14')
        .find('.slick-header-column:nth-of-type(2).slick-header-sortable')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-menu-item.slick-menu-item').contains('Hello').should('exist').trigger('mouseover'); // mouseover or click should work

      cy.get('.slick-header-menu.slick-menu-level-1.dropright')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands[index]));

      cy.get('.slick-header-menu.slick-menu-level-1')
        .find('.slick-menu-item')
        .contains('Hello SlickGrid')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Hello SlickGrid'));
    });

    it(`should open Hello sub-menu and expect 3 options, then open Feedback->ContactUs sub-menus and expect previous Hello menu to no longer exists`, () => {
      const subCommands1 = ['Hello World', 'Hello SlickGrid', `Let's play`];
      const subCommands2 = ['Request update from supplier', '', 'Contact Us'];
      const subCommands2_1 = ['Email us', 'Chat with us', 'Book an appointment'];

      const stub = cy.stub();
      cy.on('window:alert', stub);

      cy.get('.grid14')
        .find('.slick-header-column:nth-of-type(7).slick-header-sortable')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu.slick-menu-level-0').find('.slick-menu-item.slick-menu-item').contains('Hello').should('exist').click();

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-header-menu.slick-menu-level-1.dropright') // right align
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      // click different sub-menu
      cy.get('.slick-header-menu.slick-menu-level-0').find('.slick-menu-item.slick-menu-item').contains('Feedback').should('exist').click();

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-header-menu.slick-menu-level-1')
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

      // click on Feedback->ContactUs
      cy.get('.slick-header-menu.slick-menu-level-1.dropleft') // left align
        .find('.slick-menu-item.slick-menu-item')
        .contains('Contact Us')
        .should('exist')
        .trigger('mouseover'); // mouseover or click should work

      cy.get('.slick-submenu').should('have.length', 2);
      cy.get('.slick-header-menu.slick-menu-level-2.dropright') // right align
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands2_1[index]));

      cy.get('.slick-header-menu.slick-menu-level-2')
        .find('.slick-menu-item')
        .contains('Chat with us')
        .click()
        .then(() => expect(stub.getCall(0)).to.be.calledWith('Command: contact-chat'));

      cy.get('.slick-submenu').should('have.length', 0);
    });
  });

  describe('edit by typing character in active cell', () => {
    it('should clear filters by using the Grid Menu "Clear all Filters" command & toggle back grid to be editable', () => {
      cy.get('button.slick-grid-menu-button').click({ force: true });

      cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();

      cy.get('button.slick-grid-menu-button').trigger('click').click({ force: true });
      cy.get('[data-test="toggle-readonly-btn"]').click();
    });

    it('should click on "Auto-Edit by keyboard ON" button', () => {
      cy.get('[data-test="auto-edit-off-btn"]').click();
      cy.get('[data-test="auto-edit-key-on-btn"]').click();
    });

    it('should be able to edit "Duration" when "autoEditByKeypress" is enabled and by clicking once on second row and expect next row to become editable', () => {
      // Check if yesterday's date element exists (may not be visible when we run the test on the 1st day of the month and it is a Sunday, e.g. 2026-02-01)
      cy.get('[data-row="2"] .slick-cell.l2.r2').then(($el) => {
        if ($el.length > 0) {
          cy.wrap($el).contains(/[0-9]* days/);
          cy.wrap($el).click();
          cy.get('[data-row="2"] .slick-cell.l2.r2.active.editable').should('have.length', 0);

          cy.get('[data-row="2"] .slick-cell.l2.r2').type('123');
          cy.get('[data-row="2"] .slick-cell.l2.r2.active.editable').should('have.length', 1);
          cy.get('[data-row="2"] .slick-cell.l2.r2').type('{enter}');
          cy.get('[data-row="2"] .slick-cell.l2.r2.active.editable').should('have.length', 0);

          cy.get('[data-row="2"] .slick-cell.l2.r2').should('contain', '123 days');
        }
      });
    });

    it('should click on "Auto-Edit by keyboard OFF" button', () => {
      cy.get('[data-test="auto-edit-off-btn"]').click();
      cy.get('[data-test="auto-edit-key-off-btn"]').click();
    });

    it('should NOT be able to edit "Duration" when "autoEditByKeypress" is disabled', () => {
      cy.get('[data-row="2"] .slick-cell.l2.r2').contains(/[0-9]* days/);
      cy.get('[data-row="3"] .slick-cell.l2.r2').click();
      cy.get('[data-row="3"] .slick-cell.l2.r2.active.editable').should('have.length', 0);

      cy.get('[data-row="3"] .slick-cell.l2.r2').type('123');
      cy.get('[data-row="3"] .slick-cell.l2.r2.active.editable').should('have.length', 0);

      cy.get('[data-row="2"] .slick-cell.l2.r2').contains(/[0-9]* days/);
    });
  });
});
