describe('Example 04 - Frozen Grid', () => {
  // NOTE:  everywhere there's a * 2 is because we have a top+bottom (frozen rows) containers even after Unfreeze Columns/Rows

  const withTitleRowTitles = ['Sel', 'Title', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];
  const withoutTitleRowTitles = ['', 'Title', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];
  const GRID_ROW_HEIGHT = 45;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example04`);
    cy.get('h3').should('contain', 'Example 04 - Pinned (frozen) Columns/Rows');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));
  });

  it('should have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));
  });

  it('should have a frozen grid with 4 containers on page load with 3 columns on the left and 6 columns on the right', () => {
    cy.get('[style="transform: translateY(0px);"]').should('have.length', 2 * 2);
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should hide "Title" column from Grid Menu and expect last frozen column to be "% Complete"', () => {
    const newColumnList = ['Sel', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];

    cy.get('.grid4').find('button.slick-grid-menu-button').click({ force: true });

    cy.get('.grid4')
      .get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 2 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should show again "Title" column from Grid Menu and expect last frozen column to still be "% Complete"', () => {
    cy.get('.grid4')
      .get('.slick-grid-menu:visible')
      .find('.slick-column-picker-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid4').get('.slick-grid-menu:visible').find('.close').click({ force: true });

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should hide "Title" column from Header Menu and expect last frozen column to be "% Complete"', () => {
    const newColumnList = ['Sel', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];

    cy.get('.grid4').find('.slick-header-column:nth(1)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(9)')
      .children('.slick-menu-content')
      .should('contain', 'Hide Column')
      .click();

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 2 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should show again "Title" column from Column Picker and expect last frozen column to still be "% Complete"', () => {
    cy.get('.grid4').find('.slick-header-column:nth(4)').trigger('mouseover').trigger('contextmenu').invoke('show');

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children('li:nth-of-type(2)')
      .children('label')
      .should('contain', 'Title')
      .click();

    cy.get('.slick-column-picker:visible').find('.close').trigger('click').click();

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should click on the "Remove Frozen Columns" button to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('[data-test=remove-frozen-column-button]').click({ force: true });

    cy.get('[style="transform: translateY(0px);"]').should('have.length', 1 * 2);
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 9 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(3)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(4)').should('contain', '2009-05-05');
  });

  it('should expect to have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));
  });

  it('should click on the "Set 3 Frozen Columns" button to switch frozen columns grid and expect 3 frozen columns on the left and 4 columns on the right', () => {
    cy.get('[data-test=set-3frozen-columns]').click({ force: true });

    cy.get('[style="transform: translateY(0px);"]').should('have.length', 2 * 2);
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"]')
      .children()
      .should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should recheck again and still have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));
  });

  it('should click on the Grid Menu command "Unfreeze Columns/Rows" to switch to a regular grid without frozen columns/rows', () => {
    cy.get('.grid4').find('button.slick-grid-menu-button').click({ force: true });

    cy.contains('Unfreeze Columns/Rows').click({ force: true });

    cy.get('[style="transform: translateY(0px);"]').should('have.length', 1);
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"]').children().should('have.length', 9);

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(3)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-left > [style="transform: translateY(0px);"] > .slick-cell:nth(4)').should('contain', '2009-05-05');
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "True" and expect the cell to be updated and have checkmark icon', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`)
      .find('.checkmark-icon')
      .should('have.length', 0);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .find('.checkmark-icon')
      .should('have.length', 0);

    cy.get('.grid4')
      .find(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`)
      .contains('Action')
      .click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();
    cy.get('.grid4')
      .find(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .contains('Action')
      .click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 1);
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "False" and expect the cell to be updated and no longer have checkmark', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 1);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 1);

    cy.get('.grid4')
      .find(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(8)`)
      .contains('Action')
      .click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('False').click();
    cy.get('.grid4')
      .find(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(8)`)
      .contains('Action')
      .click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('False').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 0);
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(5)`)
      .find('.checkmark-icon')
      .should('have.length', 0);
  });

  it('should open the Cell Menu and delete Row 3 and 4 from the Cell Menu', () => {
    const confirmStub = cy.stub();
    cy.on('window:confirm', confirmStub);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 3');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 4');

    cy.get('.grid4')
      .find(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(8)`)
      .contains('Action')
      .click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-item')
      .contains('Delete Row')
      .click()
      .then(() => expect(confirmStub.getCall(0)).to.be.calledWith('Do you really want to delete row (4) with "Task 3"?'));

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 4');
  });

  it.skip('should filter autocomplete by typing Vancouver in the "City of Origin" and expect only filtered rows to show up', () => {
    cy.get('.search-filter.filter-cityOfOrigin').type('Vancouver');

    cy.get('.slick-autocomplete').should('be.visible');
    cy.get('.slick-autocomplete div').should('have.length', 2);
    cy.get('.slick-autocomplete').find('div:nth(0)').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 1}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 5');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 7');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 3}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 9');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 4}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 11');
  });

  it('should Clear all Filters', () => {
    cy.get('.grid4').find('button.slick-grid-menu-button').trigger('click').click({ force: true });

    cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();
  });

  it.skip('should edit first row (Task 1) and change its city by choosing it inside the autocomplete editor list', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`).click();
    cy.get('input.autocomplete.editor-cityOfOrigin').type('Sydney');

    cy.get('.slick-autocomplete').should('be.visible');
    cy.get('.slick-autocomplete div').should('have.length', 3);
    cy.get('.slick-autocomplete').find('div:nth(1)').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(1)`).should('contain', 'Task 0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(7)`).should('contain', 'Sydney, NS, Australia');
  });

  it('should open Context Menu hover "% Complete" column then select "Not Started (0%)" option and expect Task to be at 0', () => {
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick();

    cy.get('.slick-context-menu .slick-menu-option-list').should('exist').contains('Not Started (0%)').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
  });

  it('should reopen Context Menu hover "% Complete" column then open options sub-menu & select "Half Completed (50%)" option and expect Task to be at 50', () => {
    const subOptions = ['Not Started (0%)', 'Half Completed (50%)', 'Completed (100%)'];

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick();

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-option-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Sub-Options (demo)')
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-option-list').as('subMenuList');
    cy.get('@subMenuList').find('.slick-menu-title').contains('Set Percent Complete');
    cy.get('@subMenuList')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.eq(subOptions[index]));

    cy.get('@subMenuList').find('.slick-menu-item .slick-menu-content').contains('Half Completed (50%)').click();

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '50');
  });

  it('should be able to open Context Menu and click on Export->Text and expect alert triggered with Text Export', () => {
    const subCommands1 = ['Text', 'Excel'];
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick();

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains(/^Exports$/)
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .find('.slick-menu-item')
      .contains('Text')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Text (tab delimited)'));
  });

  it('should be able to open Context Menu and click on Export->Excel-> sub-commands to see 1 context menu + 1 sub-menu then clicking on Text should call alert action', () => {
    const subCommands1 = ['Text', 'Excel'];
    const subCommands2 = ['Excel (csv)', 'Excel (xlsx)'];
    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick();

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains(/^Exports$/)
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Excel')
      .click();

    cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list').as('subMenuList2');

    cy.get('@subMenuList2').find('.slick-menu-title').contains('available formats');

    cy.get('@subMenuList2')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

    cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Excel (xlsx)')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Exporting as Excel (xlsx)'));
  });

  it('should open Export->Excel sub-menu & open again Sub-Options on top and expect sub-menu to be recreated with that Sub-Options list instead of the Export->Excel list', () => {
    const subCommands1 = ['Text', 'Excel'];
    const subCommands2 = ['Excel (csv)', 'Excel (xlsx)'];
    const subOptions = ['Not Started (0%)', 'Half Completed (50%)', 'Completed (100%)'];

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick();

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains(/^Exports$/)
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Excel')
      .click();

    cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-option-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Sub-Options')
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-option-list').as('optionSubList2');

    cy.get('@optionSubList2').find('.slick-menu-title').contains('Set Percent Complete');

    cy.get('@optionSubList2')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($option, index) => expect($option.text()).to.contain(subOptions[index]));
  });

  it('should open Export->Excel context sub-menu then open Feedback->ContactUs sub-menus and expect previous Export menu to no longer exists', () => {
    const subCommands1 = ['Text', 'Excel'];
    const subCommands2 = ['Request update from supplier', '', 'Contact Us'];
    const subCommands2_1 = ['Email us', 'Chat with us', 'Book an appointment'];

    const stub = cy.stub();
    cy.on('window:alert', stub);

    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).should('contain', '0');
    cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 0}px);"] > .slick-cell:nth(2)`).rightclick({ force: true });

    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains(/^Exports$/)
      .click();

    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands1[index]));

    // click different sub-menu
    cy.get('.slick-context-menu.slick-menu-level-0 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Feedback')
      .should('exist')
      .click();

    cy.get('.slick-submenu').should('have.length', 1);
    cy.get('.slick-context-menu.slick-menu-level-1 .slick-menu-command-list')
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.contain(subCommands2[index]));

    // click on Feedback->ContactUs
    cy.get('.slick-context-menu.slick-menu-level-1.dropright') // right align
      .find('.slick-menu-item .slick-menu-content')
      .contains('Contact Us')
      .should('exist')
      .trigger('mouseover'); // mouseover or click should work

    cy.get('.slick-submenu').should('have.length', 2);
    cy.get('.slick-context-menu.slick-menu-level-2.dropright') // right align
      .should('exist')
      .find('.slick-menu-item .slick-menu-content')
      .each(($command, index) => expect($command.text()).to.eq(subCommands2_1[index]));

    cy.get('.slick-context-menu.slick-menu-level-2');

    cy.get('.slick-context-menu.slick-menu-level-2 .slick-menu-command-list')
      .find('.slick-menu-item .slick-menu-content')
      .contains('Chat with us')
      .click()
      .then(() => expect(stub.getCall(0)).to.be.calledWith('Command: contact-chat'));

    cy.get('.slick-submenu').should('have.length', 0);
  });

  it('should toggle Select All checkbox and expect back "Sel" column title to show when Select All checkbox is shown in the header row', () => {
    cy.get('.slick-header-column:nth(0)').find('.slick-column-name').should('contain', 'Sel');
    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));

    cy.get('[data-test="toggle-select-all-row"]').click();

    cy.get('.slick-header-column:nth(0)').find('.slick-column-name').should('not.contain', 'Sel');

    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withoutTitleRowTitles[index]));
  });

  it('should toggle back Select All checkbox and expect back "Sel" column title to show when Select All checkbox is shown in the header row', () => {
    cy.get('[data-test="toggle-select-all-row"]').click();

    cy.get('.slick-header-column:nth(0)').find('.slick-column-name').should('contain', 'Sel');
    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withTitleRowTitles[index]));

    cy.get('[data-test="toggle-select-all-row"]').click();

    cy.get('.slick-header-column:nth(0)').find('.slick-column-name').should('not.contain', 'Sel');

    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withoutTitleRowTitles[index]));
  });

  it('should open Column Picker and try unchecked all the columns on the right of the column pinning and expect an error and abort of the execution', () => {
    const stub = cy.stub();
    cy.on('window:alert', stub);
    cy.get('[data-test=set-3frozen-columns]').click({ force: true });

    const leftColumns = ['', 'Title', '% Complete'];
    const rightColumns = ['Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];
    cy.get('.grid4').find('.slick-header-column').first().trigger('mouseover').trigger('contextmenu').invoke('show');

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children()
      .each(($child, index) => {
        if (index >= leftColumns.length) {
          if ($child.text() === rightColumns[index - leftColumns.length]) {
            expect($child.text()).to.eq(rightColumns[index - leftColumns.length]);
            if (index <= rightColumns.length + 1) {
              cy.wrap($child).children('label').click();
            } else {
              cy.wrap($child)
                .children('label')
                .click()
                .then(() => {
                  expect(stub.getCall(0)).to.be.calledWith(
                    '[SlickGrid] Action not allowed and cancelled, you need to have at least 1 or more column on the right section of the frozen column. ' +
                      'You could alternatively "Unfreeze all the columns" before trying again.'
                  );
                });
            }
          }
        }
      });
  });

  it('should reset hidden column from the Column Picker and expect all columns to be back', () => {
    const leftColumns = ['', 'Title', '% Complete'];
    const rightColumns = ['Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children()
      .each(($child, index) => {
        if (index >= leftColumns.length) {
          if ($child.text() === rightColumns[index - leftColumns.length]) {
            expect($child.text()).to.eq(rightColumns[index - leftColumns.length]);
            if (index <= rightColumns.length + 1) {
              cy.wrap($child).children('label').click();
            }
          }
        }
      });

    cy.get('.slick-column-picker:visible').find('.close').trigger('click').click();

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(withoutTitleRowTitles[index]));
  });

  describe('Test UI rendering after Scrolling with large columns', () => {
    it('should unfreeze all columns/rows', () => {
      cy.get('.grid4').find('button.slick-grid-menu-button').click({ force: true });

      cy.contains('Unfreeze Columns/Rows').click({ force: true });
    });

    it('should resize all columns and make them wider', () => {
      // resize CityOfOrigin column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(7)').should('contain', 'City of Origin');

      cy.get('.slick-resizable-handle:nth(7)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(8)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize Cost|Duration column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(6)').should('contain', 'Cost | Duration');

      cy.get('.slick-resizable-handle:nth(6)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(8)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize Completed column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(5)').should('contain', 'Completed');

      cy.get('.slick-resizable-handle:nth(5)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(7)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize Finish column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(4)').should('contain', 'Finish');

      cy.get('.slick-resizable-handle:nth(4)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(6)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize Start column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(3)').should('contain', 'Start');

      cy.get('.slick-resizable-handle:nth(3)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(6)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize %Complete column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(2)').should('contain', '% Complete');

      cy.get('.slick-resizable-handle:nth(2)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(3)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });

      // resize Title column
      cy.get('.slick-header-columns').children('.slick-header-column:nth(1)').should('contain', 'Title');

      cy.get('.slick-resizable-handle:nth(1)').trigger('mousedown', { which: 1, force: true }).trigger('mousemove', 'bottomRight');

      cy.get('.slick-header-column:nth(3)')
        .trigger('mousemove', 'bottomRight')
        .trigger('mouseup', 'bottomRight', { which: 1, force: true });
    });

    it('should scroll horizontally completely to the right and expect all cell to be rendered', () => {
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l1`).contains(/Task [0-9]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l2`).contains(/[0-9]*/);

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l1`).contains(/Task [0-9]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l2`).contains(/[0-9]*/);

      // horizontal scroll to right
      cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('100%', '0%', { duration: 1500 });

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l3`).should('contain', '2009-01-01');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l4`).should('contain', '2009-05-05');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l7`).contains(/[United State|Canada]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 2}px);"] > .slick-cell.l8`).should('contain', 'Action');

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l3`).should('contain', '2009-01-01');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l4`).should('contain', '2009-05-05');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l7`).contains(/[United State|Canada]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 15}px);"] > .slick-cell.l8`).should('contain', 'Action');
    });

    it('should scroll vertically to the middle of the grid and expect all cell to be rendered', () => {
      // vertical scroll to middle
      cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('100%', '40%', { duration: 1500 });

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 195}px);"] > .slick-cell.l3`).should('contain', '2009-01-01');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 195}px);"] > .slick-cell.l4`).should('contain', '2009-05-05');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 195}px);"] > .slick-cell.l7`).contains(/[United State|Canada]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 195}px);"] > .slick-cell.l8`).should('contain', 'Action');

      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 210}px);"] > .slick-cell.l3`).should('contain', '2009-01-01');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 210}px);"] > .slick-cell.l4`).should('contain', '2009-05-05');
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 210}px);"] > .slick-cell.l7`).contains(/[United State|Canada]*/);
      cy.get(`[style="transform: translateY(${GRID_ROW_HEIGHT * 210}px);"] > .slick-cell.l8`).should('contain', 'Action');
    });
  });
});
