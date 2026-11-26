describe('Example 48 - Popups inside Cells', () => {
  const titles = ['Title', 'Owner', 'Status', 'Notes', 'Actions'];

  const expectFullyVisibleAndOnTop = (elm: HTMLElement, containerSelector: string) => {
    const rect = elm.getBoundingClientRect();
    const hitElm = elm.ownerDocument.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    expect(rect.height).to.be.greaterThan(0);
    expect(hitElm?.closest(containerSelector)).to.eq(elm.closest(containerSelector));
  };

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example48`);
    cy.get('h3').should('contain', 'Example 48 - Popups inside Cells');
  });

  it('should have exact Column Titles in the grid', () => {
    cy.get('.grid48')
      .find('.slick-header-columns .slick-column-name')
      .each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('should open a popup from a pinned column into "getPopupContainer()" and expect all its items to be visible past the grid viewport', () => {
    cy.get('.grid48 [data-row="6"] .example48-action-btn').click();

    cy.get('[data-test="action-popup"]').should('have.length', 1).parent().should('match', 'body');
    cy.get('[data-test="action-popup"] .example48-popup-item').should('have.length', 5);
    cy.get('[data-test="action-popup"] .example48-popup-item').each(($item) =>
      expectFullyVisibleAndOnTop($item[0], '.example48-popup-item')
    );

    cy.get('.grid48 .slick-viewport-top.slick-viewport-left').then(($viewport) => {
      cy.get('[data-test="action-popup"]').then(($popup) => {
        expect($popup[0].getBoundingClientRect().bottom).to.be.greaterThan($viewport[0].getBoundingClientRect().bottom);
      });
    });
  });

  it('should click the last popup item and expect the action to be executed', () => {
    cy.get('[data-test="action-popup"] .example48-popup-item').contains('Delete').click();

    cy.get('[data-test="last-action"]').should('have.text', 'Delete Task 6');
    cy.get('[data-test="action-popup"]').should('not.exist');
  });

  it('should open the grid in a modal dialog and expect the Cell Menu to be appended to the dialog with "popupContainer"', () => {
    cy.get('[data-test="open-modal-btn"]').click();
    cy.get('[data-test="dialog48"]').should('have.attr', 'open');

    cy.get('.grid48-modal [data-row="5"] [data-test="cell-menu-btn"]').click();

    cy.get('.slick-cell-menu').should('have.length', 1).parent().should('match', '[data-test="dialog48"]');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item').should('have.length', 5);
    cy.get('.slick-cell-menu .slick-menu-item').each(($item) => expectFullyVisibleAndOnTop($item[0], '.slick-menu-item'));
  });

  it('should position the Cell Menu next to its cell even though the dialog is the menu containing block', () => {
    cy.get('.grid48-modal [data-row="5"] [data-test="cell-menu-btn"]').then(($btn) => {
      const cellRect = $btn[0].closest('.slick-cell')!.getBoundingClientRect();
      cy.get('.slick-cell-menu').then(($menu) => {
        const menuRect = $menu[0].getBoundingClientRect();
        const isBelowCell = Math.abs(menuRect.top - cellRect.bottom) < 10;
        const isAboveCell = Math.abs(menuRect.bottom - cellRect.top) < 10;
        expect(isBelowCell || isAboveCell).to.eq(true);
        expect(
          Math.abs(menuRect.right - cellRect.right) < cellRect.width || Math.abs(menuRect.left - cellRect.left) < cellRect.width
        ).to.eq(true);
      });
    });
  });

  it('should click a Cell Menu command inside the modal and expect its action to be executed', () => {
    cy.get('.slick-cell-menu .slick-menu-item').contains('Archive').click();

    cy.get('[data-test="last-action"]').should('have.text', 'Archive Task 5 (modal)');
    cy.get('.slick-cell-menu').should('not.exist');
  });

  it('should close the modal dialog', () => {
    cy.get('[data-test="close-modal-btn"]').click();
    cy.get('[data-test="dialog48"]').should('not.have.attr', 'open');
  });
});
