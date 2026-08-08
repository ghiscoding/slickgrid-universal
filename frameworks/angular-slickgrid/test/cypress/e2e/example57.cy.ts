describe('Example 57 - RTL (Right-to-Left)', () => {
  const fullTitles = ['ID', 'Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  beforeEach(() => {
    cy.setCookie('serve-mode', 'cypress');
    cy.window().then((win) => cy.spy(win.console, 'log'));
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example57`);
    cy.get('h2').should('contain', 'Example 57: RTL (Right-to-Left)');
  });

  it('should have grid with RTL direction class', () => {
    cy.get('#grid57').should('exist').should('have.css', 'direction', 'rtl');
  });

  it('should have exact column titles', () => {
    cy.get('#grid57')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should be able to resize a column', () => {
    cy.get('#grid57 .slick-header-column:nth(1)').then(($header) => {
      const originalWidth = $header.width();

      // Find and drag the resize handle
      cy.get('#grid57 .slick-header-column:nth(1) .slick-resizable-handle')
        .should('exist')
        .trigger('mousedown', { which: 1 })
        .then(() => {
          cy.get('body').trigger('mousemove', { clientX: 300, clientY: 0 });
          cy.get('body').trigger('mouseup');
        });

      // Verify the column width changed
      cy.get('#grid57 .slick-header-column:nth(1)').then(($resizedHeader) => {
        expect($resizedHeader.width()).not.to.equal(originalWidth);
      });
    });
  });

  it('should display multiple rows of data', () => {
    cy.get('#grid57 .slick-row').should('have.length.greaterThan', 10);
  });

  it('should have sorting enabled', () => {
    cy.get('#grid57')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item')
      .should('contain', 'Sort Ascending');
  });

  it('should work correctly with text column content', () => {
    cy.get('#grid57 .slick-row .slick-cell:nth(1)').should('contain', 'Task');
  });
});
