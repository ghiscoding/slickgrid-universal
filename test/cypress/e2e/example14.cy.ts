describe('Example 14 - Columns Resize by Content', () => {
  const GRID_ROW_HEIGHT = 33;

  beforeEach(() => {
    // create a console.log spy for later use
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example14`);
    cy.get('h3').should('contain', 'Example 14 - Columns Resize by Content');
  });

  it('should have cell that fit the text content', () => {
    cy.get('.slick-row').find('.slick-cell:nth(1)').invoke('width').should('equal', 79);
    cy.get('.slick-row').find('.slick-cell:nth(2)').invoke('width').should('equal', 98);
    cy.get('.slick-row').find('.slick-cell:nth(3)').invoke('width').should('equal', 67);
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('equal', 160);
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
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('equal', 152);
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
    cy.get('.slick-row').find('.slick-cell:nth(4)').invoke('width').should('be.lt', 150);
    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.lt', 100);
    cy.get('.slick-row').find('.slick-cell:nth(6)').invoke('width').should('be.lt', 85);
    cy.get('.slick-row').find('.slick-cell:nth(7)').invoke('width').should('be.lt', 70);
    cy.get('.slick-row').find('.slick-cell:nth(8)').invoke('width').should('be.lt', 85);
    cy.get('.slick-row').find('.slick-cell:nth(9)').invoke('width').should('be.lt', 120);
    cy.get('.slick-row').find('.slick-cell:nth(10)').invoke('width').should('be.lt', 100);
    cy.get('.slick-row').find('.slick-cell:nth(11)').invoke('width').should('equal', 58);
  });

  it('should double-click on the "Complexity" column resize handle and expect the column to become wider and show all text', () => {
    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.lt', 80);

    cy.get('.slick-header-column:nth-of-type(6) .slick-resizable-handle')
      .dblclick();

    cy.get('.slick-row').find('.slick-cell:nth(5)').invoke('width').should('be.gt', 95);
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
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 3}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
  });

  it('should go to next page and expect 1 row selected in that second page', () => {
    cy.get('.icon-seek-next').click();

    cy.get('input[type="checkbox"]:checked').should('have.length', 1); // only 1x row in page 2
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) input[type="checkbox"]`).should('be.checked');
  });

  it('should click on "Select All" checkbox and expect all rows selected in current page', () => {
    const expectedRowIds = [11, 3, 4];

    // go back to 1st page
    cy.get('.icon-seek-prev')
      .click();

    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .click({ force: true });

    cy.window().then((win) => {
      expect(win.console.log).to.have.callCount(6);
      expect(win.console.log).to.be.calledWith('Selected Ids:', expectedRowIds);
    });
  });

  it('should go to the next 2 pages and expect all rows selected in each page', () => {
    cy.get('.icon-seek-next')
      .click();

    cy.get('.slick-cell-checkboxsel input:checked')
      .should('have.length', 10);

    cy.get('.icon-seek-next')
      .click();

    cy.get('.slick-cell-checkboxsel input:checked')
      .should('have.length', 10);
  });

  it('should uncheck 1 row and expect current and next page to have "Select All" uncheck', () => {
    cy.get('.slick-row:nth(0) .slick-cell:nth(0) input[type=checkbox]')
      .click({ force: true });

    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .should('not.be.checked', true);

    cy.get('.icon-seek-next')
      .click();

    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .should('not.be.checked', true);
  });

  it('should go back to previous page, select the row that was unchecked and expect "Select All" to be selected again', () => {
    cy.get('.icon-seek-prev')
      .click();

    cy.get('.slick-row:nth(0) .slick-cell:nth(0) input[type=checkbox]')
      .click({ force: true });

    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .should('be.checked', true);

    cy.get('.icon-seek-next')
      .click();

    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .should('be.checked', true);
  });

  it('should Unselect All and expect all pages to no longer have any row selected', () => {
    cy.get('#filter-checkbox-selectall-container input[type=checkbox]')
      .click({ force: true });

    cy.get('.slick-cell-checkboxsel input:checked')
      .should('have.length', 0);

    cy.get('.icon-seek-prev')
      .click();

    cy.get('.slick-cell-checkboxsel input:checked')
      .should('have.length', 0);

    cy.get('.icon-seek-prev')
      .click();

    cy.get('.slick-cell-checkboxsel input:checked')
      .should('have.length', 0);
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

      cy.get('.slick-menu-item.slick-menu-item')
        .contains('Hello')
        .should('exist')
        .trigger('mouseover'); // mouseover or click should work

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
        .find('.slick-header-column:nth-of-type(8).slick-header-sortable')
        .trigger('mouseover')
        .children('.slick-header-menu-button')
        .invoke('show')
        .click();

      cy.get('.slick-header-menu.slick-menu-level-0')
        .find('.slick-menu-item.slick-menu-item')
        .contains('Hello')
        .should('exist')
        .click();

      cy.get('.slick-submenu').should('have.length', 1);
      cy.get('.slick-header-menu.slick-menu-level-1.dropright') // right align
        .should('exist')
        .find('.slick-menu-item')
        .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

      // click different sub-menu
      cy.get('.slick-header-menu.slick-menu-level-0')
        .find('.slick-menu-item.slick-menu-item')
        .contains('Feedback')
        .should('exist')
        .click();

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
});
