describe('Example 03 - Draggable Grouping', () => {
  const fullTitles = ['', 'Title', 'Duration', 'Cost', '% Complete', 'Start', 'Finish', 'Effort-Driven', 'Action'];
  const GRID_ROW_HEIGHT = 33;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example03`);
    cy.get('h3').should('contain', 'Example 03 - Draggable Grouping');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid3')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "True" and expect the cell to be updated and have checkmark to be enabled', () => {
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(8)`).find('.checkmark-icon').should('have.length', 0);
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(8)`).find('.checkmark-icon').should('have.length', 0);

    cy.get('.grid3').find(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();
    cy.get('.grid3').find(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();

    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
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

    it('should click on the group by Duration sort icon and expect data to become sorted as descending order with all rows being expanded', () => {
      cy.get('.mdi-arrow-up:nth(0)').click();
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
    });

    it('should collapse all rows and make sure Duration group is sorted in descending order', () => {
      cy.get('.slick-preheader-panel .slick-group-toggle-all').click();
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 100');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 99');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 98');
    });

    it('should click on the group by Duration sort icon and now expect data to become sorted as ascending order with all rows being expanded', () => {
      cy.get('.mdi-arrow-down:nth(0)').click();
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
    });

    it('should collapse all rows again and make sure Duration group is sorted in descending order', () => {
      cy.get('.slick-preheader-panel .slick-group-toggle-all').click();
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 1');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 2');
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

    it('should show 1 column title (Duration) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
    });

    it('should "Group by Duration then Effort-Driven" and expect 1st row to be expanded, 2nd row to be expanded and 3rd row to be a regular row', () => {
      cy.get('[data-test="group-duration-effort-btn"]').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should show 2 column titles (Duration, Effort-Driven) shown in the pre-header section', () => {
      cy.get('.slick-dropped-grouping:nth(0) div').contains('Duration');
      cy.get('.slick-dropped-grouping:nth(1) div').contains('Effort-Driven');
    });

    it('should be able to drag and swap pre-header grouped column titles (Effort-Driven, Duration)', () => {
      cy.get('.slick-dropped-grouping:nth(0) div')
        .contains('Duration')
        .drag('.slick-dropped-grouping:nth(1) div');

      cy.get('.slick-dropped-grouping:nth(0) div').contains('Effort-Driven');
      cy.get('.slick-dropped-grouping:nth(1) div').contains('Duration');
    });

    it('should expect the grouping to be swapped as well in the grid', () => {
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"].slick-group-level-0 > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: False');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"].slick-group-level-1 .slick-group-title`).should('contain', 'Duration: 0');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(1)`).should('contain', 'Task');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 2}px;"] > .slick-cell:nth(2)`).should('contain', '0');
    });

    it('should use the preheader Toggle All button and expect all groups to now be collapsed', () => {
      cy.get('.slick-preheader-panel .slick-group-toggle-all').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: False');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: True');
    });

    it('should expand all rows with "Expand All" from context menu and expect all the Groups to be expanded and the Toogle All icon to be collapsed', () => {
      cy.get('.grid3')
        .find('.slick-row .slick-cell:nth(1)')
        .rightclick({ force: true });

      cy.get('.slick-context-menu.dropright .slick-menu-command-list')
        .find('.slick-menu-item')
        .find('.slick-menu-content')
        .contains('Expand all Groups')
        .click();

      cy.get('.grid3')
        .find('.slick-group-toggle.collapsed')
        .should('have.length', 0);

      cy.get('.grid3')
        .find('.slick-group-toggle.expanded')
        .should(($rows) => expect($rows).to.have.length.greaterThan(0));

      cy.get('.slick-group-toggle-all-icon.expanded')
        .should('exist');
    });

    it('should collapse all rows with "Collapse All" from context menu and expect all the Groups to be collapsed and the Toogle All icon to be collapsed', () => {
      cy.get('.grid3')
        .find('.slick-row .slick-cell:nth(1)')
        .rightclick({ force: true });

      cy.get('.slick-context-menu.dropright .slick-menu-command-list')
        .find('.slick-menu-item')
        .find('.slick-menu-content')
        .contains('Collapse all Groups')
        .click();

      cy.get('.grid3')
        .find('.slick-group-toggle.expanded')
        .should('have.length', 0);

      cy.get('.grid3')
        .find('.slick-group-toggle.collapsed')
        .should(($rows) => expect($rows).to.have.length.greaterThan(0));

      cy.get('.slick-group-toggle-all-icon.collapsed')
        .should('exist');
    });

    it('should use the preheader Toggle All button and expect all groups to now be expanded', () => {
      cy.get('.slick-preheader-panel .slick-group-toggle-all').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: False');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`)
        .should('have.css', 'marginLeft').and('eq', `0px`);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-toggle.expanded`)
        .should('have.css', 'marginLeft').and('eq', `15px`);
    });

    it('should use the preheader Toggle All button again and expect all groups to now be collapsed', () => {
      cy.get('.slick-preheader-panel .slick-group-toggle-all').click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-toggle.collapsed`).should('have.length', 1);
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: False');
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Effort-Driven: True');
    });

    it('should clear all groups with "Clear all Grouping" from context menu and expect all the Groups to be collapsed and the Toogle All icon to be collapsed', () => {
      cy.get('.grid3')
        .find('.slick-row .slick-cell:nth(1)')
        .rightclick({ force: true });

      cy.get('.slick-context-menu.dropright .slick-menu-command-list')
        .find('.slick-menu-item')
        .find('.slick-menu-content')
        .contains('Clear all Grouping')
        .click();

      cy.get('.grid3')
        .find('.slick-group-toggle-all')
        .should('be.hidden');

      cy.get('.grid3')
        .find('.slick-draggable-dropzone-placeholder')
        .should('be.visible')
        .should('have.text', 'Drop a column header here to group by the column');
    });

    it('should add 500 items and expect 500 of 500 items displayed', () => {
      cy.get('[data-test="add-500-rows-btn"]')
        .click();

      cy.get('.right-footer')
        .contains('500 of 500 items');
    });

    it('should click on Select All checkbox in filter header row and expect all 500 items to be selected and full selection count show in left footer', () => {
      cy.get('#filter-checkbox-selectall-container')
        .click();

      cy.get('#filter-checkbox-selectall-container')
        .find('input[type=checkbox]')
        .should('be.checked');

      cy.get('.left-footer')
        .contains('500 items selected');
    });

    it('should uncheck 2 first rows and expect the Select All checkbox to become unchecked', () => {
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`)
        .find('label')
        .click();

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`)
        .find('label')
        .click();

      cy.get('#filter-checkbox-selectall-container')
        .find('input[type=checkbox]')
        .should('not.be.checked');
    });

    it('should recheck the 2 first rows and expect the Select All checkbox to become unchecked', () => {
      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 0}px;"] > .slick-cell:nth(0)`)
        .find('label')
        .click();

      cy.get('#filter-checkbox-selectall-container')
        .find('input[type=checkbox]')
        .should('not.be.checked');

      cy.get(`[style="top: ${GRID_ROW_HEIGHT * 1}px;"] > .slick-cell:nth(0)`)
        .find('label')
        .click();

      cy.get('#filter-checkbox-selectall-container')
        .find('input')
        .should('be.checked');
    });
  });
});
