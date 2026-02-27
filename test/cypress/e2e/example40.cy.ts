import { format } from '@formkit/tempo';

describe('Example 40 - Menus with Slots', () => {
  const fullTitles = ['Title', 'Duration', 'Start', 'Finish', 'Cost', '% Complete', 'Action'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example40`);
    cy.get('h3').should('contain', 'Example 40 - Menus with Slots');
  });

  it('should have exact column titles in the grid', () => {
    cy.get('.grid40')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should open Context Menu hover "Duration" column and expect built-in and custom items listed in specific order', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('[data-row="2"] > .slick-cell:nth(2)').rightclick({ force: true });

    // 1st item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('.edit-cell-icon').contains('✎');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item span').contains('Edit Cell');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('kbd.edit-cell').contains('F2');

    // icon should rotate while hovering
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(0)').trigger('mouseover');
    cy.wait(175); // wait for rotation
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item .edit-cell-icon')
      .invoke('css', 'transform') // Get the transform property
      .then((cssTransform) => {
        const transformValue = cssTransform as unknown as string; // Cast to string
        cy.getTransformValue(transformValue, true, 'rotate').then((rotationAngle) => {
          expect(rotationAngle).to.approximately(13, 15); // 15 degrees rotation
        });
      });

    // 2nd item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(1) .menu-item').find('i.mdi-content-copy').should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(1) .menu-item').find('span.menu-item-label').contains('Copy');

    // 3rd item - divider
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(2)').should('have.class', 'slick-menu-item-divider');

    // 4th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(3)').should('have.class', 'slick-menu-item-disabled');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('i.mdi-close').should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item')
      .find('span.menu-item-label')
      .contains('Clear all Grouping');

    // 5th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(4)').should('have.class', 'slick-menu-item-disabled');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(4) .menu-item').find('i.mdi-arrow-collapse').should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(4) .menu-item')
      .find('span.menu-item-label')
      .contains('Collapse all Groups');

    // 6th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(5)').should('have.class', 'slick-menu-item-disabled');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item').find('i.mdi-arrow-expand').should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('span.menu-item-label')
      .contains('Expand all Groups');

    // 7th item - divider
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(6)').should('have.class', 'slick-menu-item-divider');

    // 8th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item').find('i.mdi-download').should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item')
      .find('span.menu-item-label')
      .contains('Export');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(7)').find('.sub-item-chevron').should('exist');

    // 9th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(8)').should('have.class', 'slick-menu-item-divider');

    // 10th item
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(9) .menu-item')
      .find('i.mdi-delete.text-danger')
      .should('exist');
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(9) .menu-item')
      .find('span.menu-item-label')
      .contains('Delete Row');

    // 11th divider
    cy.get('.slick-context-menu .slick-menu-command-list .slick-menu-item:nth(10)').should('have.class', 'slick-menu-item-divider');

    // 12th buttons group
    cy.get('.footer-buttons-container .footer-btn.edit-btn')
      .contains('Edit')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Edit action for row #2'));

    cy.get('.footer-buttons-container .footer-btn.delete-btn')
      .contains('Delete')
      .click()
      .then(() => expect(stub.getCall(1)).to.be.calledWith('Delete action for row #2'));
  });

  it('should open Export->Excel context sub-menu', () => {
    const subCommands1 = ['Export as Excel', 'Export as CSV', 'Export as PDF'];

    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('[data-row="0"] > .slick-cell:nth(2)').should('contain', '0');
    cy.get('[data-row="0"] > .slick-cell:nth(2)').rightclick({ force: true });

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .menu-item')
      .contains(/^Export$/)
      .trigger('mouseover');

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .menu-item')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    // click different sub-menu
    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .find('.slick-menu-item .menu-item')
      .contains('Export as Excel')
      .should('exist')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Export to Excel'));

    cy.get('.slick-submenu').should('have.length', 0);
  });

  it('should open Header Menu from the "Title" column and expect some commands to have keyboard hints on the right side', () => {
    cy.get('.slick-header-column:nth(0)').trigger('mouseover', { force: true });
    cy.get('.slick-header-column:nth(0)').children('.slick-header-menu-button').invoke('show').click();

    // 1st item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item')
      .find('i.mdi-arrow-expand-horizontal')
      .should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item')
      .find('span.menu-item-label')
      .contains('Resize by Content');

    // 2nd item - divider
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(1)').should('have.class', 'slick-menu-item-divider');

    // 3rd item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item').find('i.mdi-sort-ascending').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item')
      .find('span.menu-item-label')
      .contains('Sort Ascending');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item').find('kbd.key-hint').contains('Alt+↑');

    // 4th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('i.mdi-sort-descending').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item')
      .find('span.menu-item-label')
      .contains('Sort Descending');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('kbd.key-hint').contains('Alt+↓');

    // 5th item - divider
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(4)').should('have.class', 'slick-menu-item-divider');

    // 6th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('i.mdi-filter-remove-outline')
      .should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('span.menu-item-label')
      .contains('Remove Filter');

    // 7th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item').find('i.mdi-sort-variant-off').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item')
      .find('span.menu-item-label')
      .contains('Remove Sort');

    // 8th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item').find('i.mdi-close').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item')
      .find('span.menu-item-label')
      .contains('Hide Column');
  });

  it('should open Header Menu from the "Duration" column and expect some commands to have tags on the right side', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('.slick-header-column:nth(1)').trigger('mouseover', { force: true });
    cy.get('.slick-header-column:nth(1)').children('.slick-header-menu-button').invoke('show').click();

    // 1st item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item')
      .find('i.mdi-arrow-expand-horizontal')
      .should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item')
      .find('span.menu-item-label')
      .contains('Resize by Content');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('span.key-hint.danger').contains('NEW');

    // 2nd item - divider
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(1)').should('have.class', 'slick-menu-item-divider');

    // 3rd item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item').find('i.mdi-sort-ascending').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item')
      .find('span.menu-item-label')
      .contains('Sort Ascending');

    // 4th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('i.mdi-sort-descending').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item')
      .find('span.menu-item-label')
      .contains('Sort Descending');

    // 5th item - divider
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(4)').should('have.class', 'slick-menu-item-divider');

    // 6th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('i.mdi-filter-remove-outline')
      .should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('span.menu-item-label')
      .contains('Remove Filter');

    // 7th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item').find('i.mdi-sort-variant-off').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item')
      .find('span.menu-item-label')
      .contains('Remove Sort');

    // 8th item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item').find('i.mdi-close').should('exist');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(7) .menu-item')
      .find('span.menu-item-label')
      .contains('Hide Column');

    // 9th divider
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(4)').should('have.class', 'slick-menu-item-divider');

    // 10th buttons group
    cy.get('.footer-buttons-container .footer-btn.who-btn')
      .contains('Who am I?')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('I am the "Duration" column'));

    cy.get('.footer-buttons-container .footer-btn.update-btn')
      .contains('Request Update')
      .click()
      .then(() => expect(stub.getCall(1)).to.be.calledWith('is it done yet?'));
  });

  it('should open Header Menu from the "Cost" column and expect first item to have a dynamic tooltip timestamp when hovering', () => {
    cy.get('.slick-header-column:nth(4)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    // 1st item
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('.advanced-export-icon').contains('📊');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').contains('Advanced Export');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('kbd.key-hint').contains('Ctrl+E');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0)').should(
      'have.css',
      'background-color',
      'rgba(0, 0, 0, 0)'
    );

    // icon should scale up
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0)').trigger('mouseover');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item .advanced-export-icon')
      .invoke('css', 'transform')
      .then((cssTransform) => {
        const transformValue = cssTransform as unknown as string; // Cast to string
        cy.getTransformValue(transformValue, true, 'scale').then((scaleValue) => {
          expect(scaleValue).to.be.approximately(1.1, 1.15); // Check the scale value if applied
        });
      });

    const today = format(new Date(), 'YYYY-MM-DD');
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0)').should(
      'have.css',
      'background-color',
      'rgb(133, 70, 133)'
    );
    cy.get('.slick-custom-tooltip').contains(`📈 Export timestamp: ${today}`);
    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(0)').trigger('mouseout');
    cy.get('.slick-custom-tooltip').should('not.exist');
    cy.get('body').click();
  });

  it('should open Action Menu from last column "Action" column and expect custom items listed in specific order', () => {
    cy.get('[data-row="1"] > .slick-cell:nth(6)').click();
    cy.get('.slick-command-header.with-title.with-close').contains('Cell Actions');

    // 1st item
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item').find('.mdi-content-copy').should('exist');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item span').contains('Copy Cell Value');

    // 2nd item - divider
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(1)').should('have.class', 'slick-menu-item-divider');

    // 3rd item
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item').find('.mdi-download').should('exist');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item span').contains('Export Row');

    // 4th item
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('i.mdi-download').should('exist');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').find('span.menu-item-label').contains('Export');

    // 5th item - divider
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(4)').should('have.class', 'slick-menu-item-divider');

    // 6th item
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item').find('.edit-cell-icon').should('exist');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item .edit-cell-icon').contains('✎');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(5)').should('have.css', 'background-color', 'rgba(0, 0, 0, 0)');

    // 7th item
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item').find('.mdi-delete.text-danger').should('exist');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item span').contains('Delete Row');
  });

  it('should open Export->Excel cell sub-menu', () => {
    const subCommands1 = ['Export as Excel', 'Export as CSV', 'Export as PDF'];

    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get('.slick-cell-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .menu-item')
      .contains(/^Export$/)
      .trigger('mouseover');

    cy.get('.slick-cell-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .menu-item')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    // click different sub-menu
    cy.get('.slick-cell-menu.slick-menu-level-1 .slick-menu-command-list')
      .find('.slick-menu-item .menu-item')
      .contains('Export as Excel')
      .should('exist')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Export row #1 to Excel'));

    cy.get('.slick-submenu').should('have.length', 0);
  });

  it('should open Grid Menu and expect built-in commands first then custom items listed in specific order', () => {
    cy.get('.slick-grid-menu-button .mdi-menu').click();

    // 1st item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item')
      .find('.mdi-filter-remove-outline.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(0) .menu-item span').contains('Clear all Filters');

    // 2nd item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(1) .menu-item')
      .find('.mdi-sort-variant-off.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(1) .menu-item span').contains('Clear all Sorting');

    // 3rd item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item')
      .find('.mdi-flip-vertical.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item span').contains('Toggle Filter Row');

    // 4th item - divider
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(3)').should('have.class', 'slick-menu-item-divider');

    // 5th item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(4) .menu-item')
      .find('.mdi-file-excel-outline.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(4) .menu-item span').contains('Export to Excel');

    // 6th item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item')
      .find('.mdi-download.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item span').contains('Export to CSV');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(5) .menu-item').find('span.key-hint.warn').contains('CUSTOM');

    // 7th item
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item')
      .find('.mdi-refresh.menu-item-icon')
      .should('exist');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item span').contains('Refresh Data');
    cy.get('.slick-grid-menu .slick-menu-command-list .slick-menu-item:nth(6) .menu-item').find('kbd.key-hint').contains('F5');
  });

  it('should sort ascending "Duration" even though the header menu item was override without an action callback', () => {
    cy.get('.slick-header-column:nth(1)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(2) .menu-item').should('contain', 'Sort Ascending').click();

    cy.get('[data-row=0]').children('.slick-cell:nth(1)').should('contain', '0');
    cy.get('[data-row=1]').children('.slick-cell:nth(1)').should('contain', '0');
    cy.get('[data-row=2]').children('.slick-cell:nth(1)').should('contain', '0');
  });

  it('should sort descending "Duration" even though the header menu item was override without an action callback', () => {
    cy.get('.slick-header-column:nth(1)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list .slick-menu-item:nth(3) .menu-item').should('contain', 'Sort Descending').click();

    cy.get('[data-row=0]').children('.slick-cell:nth(1)').should('contain', '100');
    cy.get('[data-row=1]').children('.slick-cell:nth(1)').should('contain', '100');
    cy.get('[data-row=2]').children('.slick-cell:nth(1)').should('contain', '100');
  });
});
