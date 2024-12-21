describe('Example 21 - Row Detail View', () => {
  const fullTitles = ['', '', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Effort Driven'];
  const GRID_ROW_HEIGHT = 33;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example21`);
    cy.get('h3').should('contain', 'Example 21 - Row Detail');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid21')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should change server delay to 10ms for faster testing', () => {
    cy.get('[data-test="server-delay"]').type('{backspace}');
  });

  it('should open the 1st Row Detail of the 2nd row and expect to find some details', () => {
    cy.get('.slick-cell.detail-view-toggle:nth(1)').click().wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', 'Task 1');

    cy.get('input[id="assignee_1"]').should('exist');

    cy.get('input[type="checkbox"]:checked').should('have.length', 0);
  });

  it('should open the 2nd Row Detail of the 4th row and expect to find some details', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 9}px;"] .slick-cell:nth(1)`)
      .click()
      .wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail').find('h4').should('contain', 'Task 3');

    cy.get('input[id="assignee_3"]').should('exist');

    cy.get('input[type="checkbox"]:checked').should('have.length', 0);
  });

  it('should be able to collapse all row details', () => {
    cy.get('.dynamic-cell-detail').should('have.length', 2);
    cy.get('[data-test="collapse-all-btn"]').click();
    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });

  it('should open the Task 3 Row Detail and still expect same detail', () => {
    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 3}px;"] .slick-cell:nth(1)`)
      .click()
      .wait(40);

    cy.get('.dynamic-cell-detail').should('have.length', 1);

    cy.get('.slick-cell + .dynamic-cell-detail .innerDetailView_3').find('h4').should('contain', 'Task 3');

    cy.get('input[id="assignee_3"]').should('exist');
  });

  it('should click on "click me" and expect an Alert to show the Help text', () => {
    cy.on('window:alert', (str) => {
      expect(str).to.contain('Assignee is');
    });

    cy.contains('Click Me').click();
  });

  it('should click on the "Delete Row" button and expect the Task 2 to be deleted from the grid', () => {
    const expectedTasks = ['Task 0', 'Task 1', 'Task 2', 'Task 4', 'Task 5'];

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_3').as('detailContainer3');

    cy.get('@detailContainer3').find('[data-test=delete-btn]').click();

    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');

    cy.get('.grid21')
      .find('.slick-row')
      .each(($row, index) => {
        if (index > expectedTasks.length - 1) {
          return;
        }
        cy.wrap($row).children('.slick-cell:nth(2)').first().should('contain', expectedTasks[index]);
      });

    cy.get('.notification.is-danger[data-test=status]').contains('Deleted row with Task 3');
  });

  it('should open a few Row Details and expect them to be closed after clicking on the "Close All Row Details" button', () => {
    const expectedTasks = ['Task 0', 'Task 1', 'Task 2', 'Task 4', 'Task 5'];

    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 4}px;"] .slick-cell:nth(1)`)
      .click()
      .wait(40);

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_5').as('detailContainer5');

    cy.get('@detailContainer5').find('h4').contains('Task 5');

    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 1}px;"] .slick-cell:nth(1)`)
      .click()
      .wait(40);

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_1').as('detailContainer1');

    cy.get('@detailContainer1').find('h4').contains('Task 1');

    cy.get('[data-test=collapse-all-btn]').click();

    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_1').should('not.exist');

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_1').should('not.exist');

    cy.get('.grid21')
      .find('.slick-row')
      .each(($row, index) => {
        if (index > expectedTasks.length - 1) {
          return;
        }
        cy.wrap($row).children('.slick-cell:nth(2)').first().should('contain', expectedTasks[index]);
      });
  });

  it('should open a few Row Details, then sort by Title and expect all Row Details to be closed afterward', () => {
    const expectedTasks = ['Task 0', 'Task 1', 'Task 10', 'Task 100', 'Task 101', 'Task 102', 'Task 103', 'Task 104'];

    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 1}px;"] .slick-cell:nth(1)`)
      .click()
      .wait(40);

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_1').as('detailContainer1');

    cy.get('@detailContainer1').find('h4').contains('Task 1');

    cy.get('.grid21').find('.slick-row:nth(9) .slick-cell:nth(1)').click();

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_5').as('detailContainer5');

    cy.get('@detailContainer5').find('h4').contains('Task 5');

    cy.get('.grid21')
      .find('.slick-header-column:nth(2)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .should('be.hidden')
      .invoke('show')
      .click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(4)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Descending')
      .click();

    cy.get('.grid21').find('.slick-header-column:nth(2)').trigger('mouseover').children('.slick-header-menu-button').invoke('show').click();

    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending')
      .click();

    cy.get('.grid21').find('.slick-header-column:nth(2)').find('.slick-sort-indicator-asc').should('have.length', 1);

    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_0').should('not.exist');

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_5').should('not.exist');

    cy.get('.grid21')
      .find('.slick-row')
      .each(($row, index) => {
        if (index > expectedTasks.length - 1) {
          return;
        }
        cy.wrap($row).children('.slick-cell:nth(2)').first().should('contain', expectedTasks[index]);
      });
  });

  it('should click open Row Detail of Task 1 and Task 101 then type a title filter of "Task 101" and expect Row Detail to be opened and still be rendered', () => {
    cy.get('.grid21').find('.slick-row:nth(4) .slick-cell:nth(1)').click();

    cy.get('.grid21').find('.slick-row:nth(1) .slick-cell:nth(1)').click();

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_101').as('detailContainer');

    cy.get('@detailContainer').find('h4').contains('Task 101');

    cy.get('.search-filter.filter-title').type('Task 101');
  });

  it('should call "Clear all Filters" from Grid Menu and expect "Task 101" to still be rendered correctly', () => {
    cy.get('.grid21').find('button.slick-grid-menu-button').trigger('click').click();

    cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').first().find('span').contains('Clear all Filters').click();

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_101').as('detailContainer');

    cy.get('@detailContainer').find('h4').contains('Task 101');
  });

  it('should call "Clear all Sorting" from Grid Menu and expect all row details to be collapsed', () => {
    cy.get('.grid21').find('button.slick-grid-menu-button').trigger('click').click();

    cy.get(`.slick-grid-menu:visible`).find('.slick-menu-item').find('span').contains('Clear all Sorting').click();

    cy.get('.grid21').find('.slick-sort-indicator-asc').should('have.length', 0);

    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });

  it('should close all row details & make grid editable', () => {
    cy.get('[data-test="collapse-all-btn"]').click();
    cy.get('[data-test="toggle-readonly-btn"]').click();
  });

  it('should click on 5th row detail open icon and expect it to open', () => {
    cy.get('.grid21').find('.slick-row:nth(4) .slick-cell:nth(1)').click();

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_5').as('detailContainer');

    cy.get('@detailContainer').find('h4').contains('Task 5');
  });

  it('should click on 2nd row "Title" cell to edit it and expect Task 5 row detail to get closed', () => {
    cy.get('.grid21').find('.slick-row:nth(1) .slick-cell:nth(2)').dblclick();

    cy.get('.editor-title')
      .invoke('val')
      .then((text) => expect(text).to.eq('Task 1'));

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_5').should('not.exist');

    cy.get('[data-test="toggle-readonly-btn"]').click();
  });

  it('should open two Row Details and expect 2 detail panels opened', () => {
    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');

    cy.get(`.slick-row[style="top: ${GRID_ROW_HEIGHT * 8}px;"] .slick-cell:nth(2)`)
      .click()
      .wait(40);

    cy.get('.slick-cell.detail-view-toggle:nth(1)').click().wait(40);

    cy.get('.dynamic-cell-detail').should('have.length', 2);
  });

  it('should toggle to Dark Mode and expect all row details to get closed', () => {
    cy.get('[data-test="toggle-dark-mode"]').click();

    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });

  it('should open 1st row detail again and be able to delete the row detail', () => {
    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');

    cy.get('.slick-cell.detail-view-toggle:nth(1)').click().wait(40);

    cy.get('.dynamic-cell-detail').should('have.length', 1);

    cy.get('.grid21').find('.slick-cell + .dynamic-cell-detail .innerDetailView_1').as('detailContainer1');

    cy.get('@detailContainer1').find('[data-test=delete-btn]').click();

    cy.get('.notification.is-danger[data-test=status]').contains('Deleted row with Task 1');

    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });

  it('should be able to select any rows, i.e.: row 2 and 4', () => {
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(0)`).click();
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 4}px;"] > .slick-cell:nth(0)`).click();

    cy.get('[data-test="row-selections"]').contains('2,4');
  });
});
