/// <reference types="Cypress" />

function removeExtraSpaces(textS) {
  return `${textS}`.replace(/\s+/g, ' ').trim();
}

describe('Example 07 - Row Move & Checkbox Selector Selector Plugins', { retries: 1 }, () => {
  const GRID_ROW_HEIGHT = 45;
  const fullTitles = ['', '', 'Title', 'Action', 'Duration', '% Complete', 'Start', 'Finish', 'Completed', 'Prerequisites'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example07`);
    cy.get('h3').should('contain', 'Example 07 - Row Move & Row Selections');
  });

  it('should have exact Column Titles in the grid', () => {
    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have 2 row selected count shown in the grid left footer', () => {
    cy.get('.slick-custom-footer')
      .find('div.left-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`2 items selected`);
      });
  });

  it('should have 11 prerequisites filters and 11 rows in grid/footer', () => {
    cy.get('.ms-filter.search-filter.filter-prerequisites.filled')
      .find('.ms-choice')
      .contains('11 of 500 selected');

    cy.get('.right-footer.metrics')
      .find('.item-count')
      .contains('11');

    cy.get('.right-footer.metrics')
      .contains('11 of 500 items');
  });

  it('should clear all filters', () => {
    cy.get('[data-test="clear-filters-btn"]').click();
  });

  it('should have all rows shown in the grid', () => {
    cy.get('.right-footer.metrics')
      .find('.item-count')
      .contains('500');

    cy.get('.right-footer.metrics')
      .contains('500 of 500 items');
  });

  it('should have 4 rows pre-selected by the grid presets', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(2)`).should('contain', 'Task 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell:nth(2)`).should('contain', 'Task 5');

    // Task 4 and 3 should be selected
    cy.get('input[type="checkbox"]:checked').should('have.length', 4);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 6}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 7}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
  });

  it('should drag row to another position in the grid', () => {
    cy.get('[style="top:45px"] > .slick-cell.cell-reorder').as('moveIconTask1');
    cy.get('[style="top:135px"] > .slick-cell.cell-reorder').as('moveIconTask3');

    cy.get('@moveIconTask3').should('have.length', 1);

    cy.get('@moveIconTask3')
      .trigger('mousedown', { button: 0, force: true })
      .trigger('mousemove', 'bottomRight');

    cy.get('@moveIconTask1')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { force: true });

    cy.get('input[type="checkbox"]:checked')
      .should('have.length', 4);
  });

  it('should expect the row to have moved to another row index', () => {
    cy.get('.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');

    cy.get('input[type="checkbox"]:checked')
      .should('have.length', 4);
  });

  it('should uncheck all rows', () => {
    // click twice to check then uncheck all
    cy.get('.slick-column-name > input[type=checkbox]')
      .click({ force: true });
    cy.get('.slick-column-name > input[type=checkbox]')
      .click({ force: true });
  });

  it('should have 0 row selected count shown in the grid left footer', () => {
    cy.get('.slick-custom-footer')
      .find('div.left-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`0 items selected`);
      });
  });

  it('should select 2 rows (Task 3,4), then move the rows and expect both rows to still be selected without any other rows', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).click();
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell.cell-reorder`).as('moveIconTask3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell.cell-reorder`).as('moveIconTask5');

    cy.get('@moveIconTask3').should('have.length', 1);

    cy.get('@moveIconTask3')
      .trigger('mousedown', { button: 0, force: true })
      .trigger('mousemove', 'bottomRight');

    cy.get('@moveIconTask5')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { force: true });

    cy.get('.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(2)`).should('contain', 'Task 5');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell:nth(2)`).should('contain', 'Task 3');

    // Task 4 and 3 should be selected
    cy.get('input[type="checkbox"]:checked').should('have.length', 2);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 5}px"] > .slick-cell:nth(1) input[type="checkbox"]:checked`).should('have.length', 1);
  });

  it('should be able to change all values of 3rd row', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2').click();

    cy.get('.editor-title > textarea')
      .type('Task 2222');

    cy.get('.editor-title .btn-save')
      .click();

    // change duration
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', 'day').click();
    cy.get('.editor-duration').type('2222').type('{enter}');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '2222 days');

    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 25).trigger('change');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).should('contain', '25');

    // change Finish date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).should('contain', '2009-01-05').click();
    cy.get('.flatpickr-calendar:visible .flatpickr-day').contains('22').click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(7)`).should('contain', '2009-01-22');

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should dynamically add 2x new "Title" columns', () => {
    const updatedTitles = ['', '', 'Title', 'Action', 'Duration', '% Complete', 'Start', 'Finish', 'Completed', 'Prerequisites', 'Title', 'Title'];

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(10)`).should('not.exist');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(11)`).should('not.exist');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`)
      .should('contain', 'Task 0')
      .should('have.length', 1);

    cy.get('[data-test=add-title-column-btn]')
      .click()
      .click();

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(updatedTitles[index]));

    cy.get('.slick-header-menu-button')
      .should('have.length', 9);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(10)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(11)`).should('contain', 'Task 0');
  });

  it('should open Grid Menu and expect new columns to be added to the column picker section', () => {
    const updatedTitles = ['', '', 'Title', 'Action', 'Duration', '% Complete', 'Start', 'Finish', 'Completed', 'Prerequisites', 'Title', 'Title'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .click({ force: true });

    cy.get('.grid7 .slickgrid-container')
      .then(() => {
        cy.get(`.slick-grid-menu`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              expect($input.prop('checked')).to.eq(true);
              expect($label.text()).to.eq(updatedTitles[index]);
            }
          });
      });
  });

  it('should be able to filter and search "Task 2222" in the new column and expect only 1 row showing in the grid', () => {
    cy.get('input.search-filter.filter-title1')
      .type('Task 2222', { force: true })
      .should('have.value', 'Task 2222');

    cy.get('.slick-row').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2222');
  });

  it('should hover over the last "Title" column and click on "Clear Filter" and expect grid to have all rows shown', () => {
    cy.get('.slick-header-column:nth(10)')
      .first()
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      // .invoke('show')
      .click();

    cy.get('.slick-header-menu')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(6)')
      .children('.slick-menu-content')
      .should('contain', 'Remove Filter')
      .click();

    cy.get('.slick-row').should('have.length.greaterThan', 1);
  });

  it('should dynamically remove 1x of the new "Title" columns', () => {
    const updatedTitles = ['', '', 'Title', 'Action', 'Duration', '% Complete', 'Start', 'Finish', 'Completed', 'Prerequisites', 'Title'];

    cy.get('[data-test=remove-title-column-btn]')
      .click();

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(updatedTitles[index]));
  });

  it('should be able to change value of 1st row "Title" column and expect same value set in all 2 "Title" columns', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0').click();

    cy.get('.editor-title > textarea')
      .type('Task 0000');

    cy.get('.editor-title .btn-save')
      .click();

    // change duration
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', 'day').click();
    cy.get('.editor-duration').type('0000').type('{enter}');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '0000 day');

    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).click();
    cy.get('.slider-editor input[type=range]').as('range').invoke('val', 50).trigger('change');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', '50');

    // change Finish date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('contain', '2009-01-05').click();
    cy.get('.flatpickr-calendar:visible .flatpickr-day').contains('22').click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).should('contain', '2009-01-22');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(10)`).should('contain', 'Task 0000');
  });

  it('should move "Duration" column to a different position in the grid', () => {
    const expectedTitles = ['', '', 'Title', 'Action', '% Complete', 'Start', 'Finish', 'Duration', 'Completed', 'Prerequisites', 'Title'];

    cy.get('.slick-header-columns')
      .children('.slick-header-column:nth(4)')
      .should('contain', 'Duration')
      .trigger('mousedown', 'center', { which: 1 });

    cy.get('.slick-header-columns')
      .children('.slick-header-column:nth(7)')
      .should('contain', 'Finish')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { force: true });

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));
  });

  it('should be able to hide "Finish" column', () => {
    const expectedTitles = ['', '', 'Title', 'Action', '% Complete', 'Start', 'Duration', 'Completed', 'Prerequisites', 'Title'];

    cy.get('[data-test="hide-finish-btn"]').click();

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));
  });

  it('should be able to click disable Filters functionality button and expect no Filters', () => {
    const expectedTitles = ['', '', 'Title', 'Action', '% Complete', 'Start', 'Duration', 'Completed', 'Prerequisites', 'Title'];

    cy.get('[data-test="disable-filters-btn"]').click().click(); // even clicking twice should have same result

    cy.get('.slick-headerrow').should('not.be.visible');
    cy.get('.slick-headerrow-columns .slick-headerrow-column').should('have.length', 0);

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));

    cy.get('[data-test="toggle-filtering-btn"]').click(); // show it back
  });

  it('should open the Cell Menu on row 9-10 row and change the Completed to "True" and expect the cell to be updated and have checkmark icon', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 9}px"] > .slick-cell:nth(2)`).should('contain', 'Task 9');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 10}px"] > .slick-cell:nth(2)`).should('contain', 'Task 10');

    cy.get('.grid7').find(`[style="top:${GRID_ROW_HEIGHT * 9}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-title').contains('Commands');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-content').contains('Delete Row');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-content').contains('Help');
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-title').contains('Change Completed Flag');
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();
    cy.get('.grid7').find(`[style="top:${GRID_ROW_HEIGHT * 10}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('True').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 9}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 10}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 1);
  });

  it('should expect "Clear all Filters" command to be hidden in the Grid Menu', () => {
    const expectedFullHeaderMenuCommands = ['Clear all Filters', 'Clear all Sorting', 'Toggle Filter Row', 'Export to Excel'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .trigger('click')
      .click({ force: true });

    cy.get('.slick-menu-command-list')
      .find('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Clear all Filters' || commandTitle === 'Toggle Filter Row') {
          expect($child).to.be.visible;
        }
      });
  });

  it('should be able to toggle Filters functionality', () => {
    const expectedTitles = ['', '', 'Title', 'Action', '% Complete', 'Start', 'Duration', 'Completed', 'Prerequisites', 'Title'];

    cy.get('[data-test="toggle-filtering-btn"]').click(); // hide it

    cy.get('.slick-headerrow').should('not.be.visible');
    cy.get('.slick-headerrow-columns .slick-headerrow-column').should('have.length', 0);

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));

    cy.get('[data-test="toggle-filtering-btn"]').click(); // show it
    cy.get('.slick-headerrow-columns .slick-headerrow-column').should('have.length', 10);

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));
  });

  it('should be able to toggle Sorting functionality (disable) and expect all header menu Sorting commands to be hidden and also not show Sort hint while hovering a column', () => {
    const expectedFullHeaderMenuCommands = ['Resize by Content', '', 'Sort Ascending', 'Sort Descending', '', 'Remove Filter', 'Remove Sort', 'Hide Column'];

    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch').should('exist');
    cy.get('.slick-sort-indicator').should('have.length.greaterThan', 0); // sort icon hints
    cy.get('[data-test="toggle-sorting-btn"]').click(); // disable it
    cy.get('.slick-sort-indicator').should('have.length', 0);
    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch-off-outline').should('exist');

    cy.get('.grid7')
      .find('.slick-header-column:nth(8)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .children('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Sort Ascending' || commandTitle === 'Sort Descending' || commandTitle === 'Remove Sort') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should expect "Clear Sorting" command to be hidden in the Grid Menu', () => {
    const expectedFullHeaderMenuCommands = ['Clear all Filters', 'Clear all Sorting', 'Toggle Filter Row', 'Export to Excel'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .trigger('click')
      .click();

    cy.get('.slick-menu-command-list')
      .find('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Clear all Sorting') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should be able to toggle Sorting functionality (re-enable) and expect all Sorting header menu commands to be visible and also Sort hints to show up also', () => {
    const expectedFullHeaderMenuCommands = ['Resize by Content', '', 'Sort Ascending', 'Sort Descending', '', 'Remove Filter', 'Remove Sort', 'Hide Column'];

    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch-off-outline').should('exist');
    cy.get('.slick-sort-indicator').should('have.length', 0); // sort icon hints
    cy.get('[data-test="toggle-sorting-btn"]').click(); // enable it back
    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch').should('exist');
    cy.get('.slick-sort-indicator').should('have.length.greaterThan', 0);

    cy.get('.grid7')
      .find('.slick-header-column:nth-of-type(8)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .children('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);
        expect($child).to.be.visible;
      });
  });

  it('should expect "Clear Sorting" command to be visible again in the Grid Menu', () => {
    const expectedFullHeaderMenuCommands = ['Clear all Filters', 'Clear all Sorting', 'Toggle Filter Row', 'Export to Excel'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .trigger('click')
      .click();

    cy.get('.slick-menu-command-list')
      .find('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Clear all Sorting') {
          expect($child).to.be.visible;
        }
      });
  });

  it('should be able to click disable Sorting functionality button and expect all Sorting commands to be hidden and also not show Sort hint while hovering a column', () => {
    const expectedFullHeaderMenuCommands = ['Resize by Content', '', 'Sort Ascending', 'Sort Descending', '', 'Remove Filter', 'Remove Sort', 'Hide Column'];

    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch').should('exist');
    cy.get('.slick-sort-indicator').should('have.length.greaterThan', 0); // sort icon hints
    cy.get('[data-test="disable-sorting-btn"]').click().click(); // even clicking twice should have same result
    cy.get('.slick-sort-indicator').should('have.length', 0);
    cy.get('[data-test="toggle-sorting-btn"] .mdi-toggle-switch-off-outline').should('exist');

    cy.get('.grid7')
      .find('.slick-header-column:nth(5)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .children('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Sort Ascending' || commandTitle === 'Sort Descending' || commandTitle === 'Remove Sort') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should be able to click disable Filter functionality button and expect all Filter commands to be hidden and also not show Sort hint while hovering a column', () => {
    const expectedFullHeaderMenuCommands = ['Resize by Content', '', 'Sort Ascending', 'Sort Descending', '', 'Remove Filter', 'Remove Sort', 'Hide Column'];

    cy.get('[data-test="disable-filters-btn"]').click().click(); // even clicking twice should have same result

    cy.get('.grid7')
      .find('.slick-header-column:nth(5)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .children('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Remove Filter') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should expect "Clear all Filters" command to be hidden in the Grid Menu', () => {
    const expectedFullHeaderMenuCommands = ['Clear all Filters', 'Clear all Sorting', 'Toggle Filter Row', 'Export to Excel'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .trigger('click')
      .click();

    cy.get('.slick-menu-command-list')
      .find('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Clear all Filters' || commandTitle === 'Toggle Filter Row') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should open Column Picker and show the "Finish" column back to visible and expect it to have kept its position after toggling filter/sorting', () => {
    // first 2 cols are hidden but they do count as li item
    const expectedFullPickerTitles = ['', '', 'Title', 'Action', '% Complete', 'Start', 'Finish', 'Duration', 'Completed', 'Prerequisites', 'Title'];

    cy.get('.grid7')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .trigger('contextmenu')
      .invoke('show');

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children()
      .each(($child, index) => {
        if (index < expectedFullPickerTitles.length) {
          expect($child.text()).to.eq(expectedFullPickerTitles[index]);
        }
      });

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children('li:nth-of-type(7)')
      .children('label')
      .should('contain', 'Finish')
      .click();

    cy.get('.grid7')
      .get('.slick-column-picker:visible')
      .find('.close')
      .trigger('click')
      .click();

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => {
        if (index <= 5) {
          expect($child.text()).to.eq(expectedFullPickerTitles[index]);
        }
      });
  });

  it('should click Add Item button 2x times and expect "Task 500" and "Task 501" to be created', () => {
    cy.get('[data-test="add-item-btn"]').click();
    cy.wait(200);
    cy.get('[data-test="add-item-btn"]').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 501');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 500');

    cy.get('[data-test="toggle-filtering-btn"]').click(); // show it back
  });

  it('should open the "Prerequisites" Filter and expect to have Task 500 & 501 in the Filter', () => {
    cy.get('div.ms-filter.filter-prerequisites')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(1)')
      .contains('Task 501');

    cy.get('.ms-drop')
      .find('span:nth(2)')
      .contains('Task 500');

    cy.get('div.ms-filter.filter-prerequisites')
      .trigger('click');
  });

  it('should open the "Prerequisites" Editor and expect to have Task 500 & 501 in the Editor', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`)
      .should('contain', '')
      .click();

    cy.get('.ms-drop')
      .find('span:nth(1)')
      .contains('Task 501');

    cy.get('.ms-drop')
      .find('span:nth(2)')
      .contains('Task 500');

    cy.get('[name=editor-prerequisites].ms-drop ul > li:nth(0)')
      .click();

    cy.get('.ms-ok-button')
      .last()
      .click({ force: true });

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Task 501');
  });

  it('should delete the last item "Task 501" and expect it to be removed from the Filter', () => {
    cy.get('[data-test="delete-item-btn"]').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 500');

    cy.get('div.ms-filter.filter-prerequisites')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(1)')
      .contains('Task 500');

    cy.get('div.ms-filter.filter-prerequisites')
      .trigger('click');
  });

  it('should open the "Prerequisites" Filter then choose "Task 3", "Task 4" and "Task 8" from the list and expect to see 2 rows of data in the grid', () => {
    cy.get('div.ms-filter.filter-prerequisites')
      .trigger('click');

    cy.get('.ms-drop')
      .contains(/^Task 3$/) // use regexp to avoid finding first Task 3 which is in fact Task 399
      .click();

    cy.get('.ms-drop')
      .contains(/^Task 4$/)
      .click();

    cy.get('.ms-drop')
      .contains(/^Task 8$/)
      .click();

    cy.get('.ms-ok-button')
      .click();

    cy.get('.slick-row')
      .should('have.length', 2);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 8');
  });

  it('should have 1 row selected count shown in the grid left footer as English', () => {
    cy.get('.slick-custom-footer')
      .find('div.left-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`1 items selected`);
      });
  });

  it('should have 2 of 501 items shown as metrics on the right footer shown in English', () => {
    cy.get('.right-footer.metrics')
      .contains('2 of 501 items');
  });

  it('should reorder "Start" column to be after the "Completed" column', () => {
    const expectedTitles = ['', '', 'Title', 'Action', '% Complete', 'Finish', 'Duration', 'Completed', 'Start', 'Prerequisites', 'Title'];

    cy.get('.slick-header-columns')
      .children('.slick-header-column:nth(5)')
      .should('contain', 'Start')
      .trigger('mousedown', 'bottom', { which: 1 });

    cy.get('.slick-header-columns')
      .children('.slick-header-column:nth(8)')
      .should('contain', 'Completed')
      .trigger('mousemove', 'bottomRight')
      .trigger('mouseup', 'bottomRight', { force: true });

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(expectedTitles[index]));
  });

  it('should hide "Finish" column from column picker', () => {
    const originalColumns = ['', '', 'Title', 'Action', '% Complete', 'Finish', 'Duration', 'Completed', 'Start', 'Prerequisites', 'Title'];

    cy.get('.grid7')
      .find('.slick-header-column')
      .first()
      .trigger('mouseover')
      .trigger('contextmenu')
      .invoke('show');

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children()
      .each(($child, index) => {
        if (index < originalColumns.length) {
          expect($child.text()).to.eq(originalColumns[index]);
        }
      });

    cy.get('.slick-column-picker')
      .find('.slick-column-picker-list')
      .children('li:nth-of-type(6)')
      .children('label')
      .should('contain', 'Finish')
      .click();

    cy.get('.slick-column-picker:visible')
      .find('.close')
      .trigger('click')
      .click();
  });

  it('should have 2 rows in the grid', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', '0 day');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 8');
  });

  it('should open Context Menu and expect 2 commands in English', () => {
    cy.get('.grid7')
      .find('.slick-row .slick-cell:nth(2)')
      .rightclick({ force: true });

    cy.get('.slick-context-menu.dropright .slick-menu-command-list')
      .find('.slick-menu-item:nth(1)')
      .find('.slick-menu-content')
      .contains('Export to Excel');

    cy.get('.slick-context-menu.dropright .slick-menu-command-list')
      .find('.slick-menu-item:nth(0)')
      .find('.slick-menu-content')
      .contains('Copy')
      .click();

    cy.get('.slick-context-menu .slick-menu-command-list')
      .should('not.exist');
  });

  it('should switch language', () => {
    cy.get('[data-test="language-button"]')
      .click();

    cy.get('[data-test="selected-locale"]')
      .contains('fr');
  });

  it('should have 1 row selected count shown in the grid left footer as French', () => {
    cy.get('.slick-custom-footer')
      .find('div.left-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`1 éléments sélectionnés`);
      });
  });

  it('should have 2 of 501 items shown as metrics on the right footer shown in French', () => {
    cy.get('.right-footer.metrics')
      .contains('2 de 501 éléments');
  });

  it('should re-open Header Menu of last "Titre" column and expect all commands to be translated to French', () => {
    const expectedFullHeaderMenuCommands = ['Redimensionner par contenu', '', 'Trier par ordre croissant', 'Trier par ordre décroissant', '', 'Supprimer le filtre', 'Supprimer le tri', 'Cacher la colonne'];

    cy.get('.grid7')
      .find('.slick-header-column:nth(9)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .children('.slick-menu-item')
      .each(($child, index) => {
        const commandTitle = $child.text();
        expect(commandTitle).to.eq(expectedFullHeaderMenuCommands[index]);

        // expect all Sorting commands to be hidden
        if (commandTitle === 'Trier par ordre croissant' || commandTitle === 'Trier par ordre décroissant' || commandTitle === 'Supprimer le tri') {
          expect($child).not.to.be.visible;
        }
      });
  });

  it('should open Grid Menu and expect new columns to be added to the column picker section, also "Finish" to be unchecked while "Duration" to be at new position', () => {
    const updatedTitles = ['', '', 'Titre', 'Action', '% Achevée', 'Durée', 'Terminé', 'Début', 'Prerequisites', 'Titre'];

    cy.get('.grid7')
      .find('button.slick-grid-menu-button')
      .click({ force: true });

    cy.get('.grid7 .slickgrid-container')
      .then(() => {
        cy.get(`.slick-grid-menu`)
          .find('.slick-column-picker-list')
          .children('li')
          .each(($child, index) => {
            if (index <= 5) {
              const $input = $child.children('input');
              const $label = $child.children('label');
              if ($label.text() === 'Fin') {
                expect($input.prop('checked')).to.eq(false);
              } else {
                expect($input.prop('checked')).to.eq(true);
              }
              expect($label.text()).to.eq(updatedTitles[index]);
            }
          });
      });

    cy.get('.slick-grid-menu')
      .find('.close')
      .click();
  });

  it('should open the Cell Menu on first 2 rows and change the Completed to "True" and expect the cell to be updated and have checkmark icon', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 8');

    cy.get('.grid7').find(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-title').contains('Commandes');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-content').contains('Supprimer la ligne');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-content').contains('Aide');
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-title').contains(`Changer l'indicateur terminé`);
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('Faux').click();
    cy.get('.grid7').find(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-option-list .slick-menu-item').contains('Faux').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 0);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(7)`).find('.checkmark-icon').should('have.length', 0);
  });

  it('should open the Cell Menu on 2nr row and delete it', () => {
    const confirmStub = cy.stub();
    cy.on('window:confirm', confirmStub);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 8');

    cy.get('.grid7').find(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(3)`).click({ force: true });
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-title').contains('Commandes');
    cy.get('.slick-cell-menu .slick-menu-command-list .slick-menu-content')
      .contains('Supprimer la ligne')
      .click()
      .then(() => expect(confirmStub.getCall(0)).to.be.calledWith('Do you really want to delete row (2) with "Task 8"?'));
  });

  it('should have "1 de 500 éléments" shown as metrics on the right footer shown in French', () => {
    cy.get('.right-footer.metrics')
      .contains('1 de 500 éléments');
  });

  it('should have 1 row in the grid with "Duration" showing French text in the grid', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(5)`).should('contain', '0 journée');
  });

  it('should open Context Menu and expect 2 commands in French', () => {
    cy.get('.grid7')
      .find('.slick-row .slick-cell:nth(2)')
      .rightclick({ force: true });

    cy.get('.slick-context-menu.dropright .slick-menu-command-list')
      .find('.slick-menu-item:nth(1)')
      .find('.slick-menu-content')
      .contains('Exporter vers Excel');

    cy.get('.slick-context-menu.dropright .slick-menu-command-list')
      .find('.slick-menu-item:nth(0)')
      .find('.slick-menu-content')
      .contains('Copier')
      .click();

    cy.get('.slick-context-menu .slick-menu-command-list')
      .should('not.exist');
  });

  it('should reload the page', () => {
    cy.reload();
  });

  it('should clear all filters and expect 500 of 500 éléments displayed', () => {
    cy.get('[data-test="clear-filters-btn"]')
      .click();

    cy.get('.right-footer')
      .contains('500 of 500 items');
  });

  it('should click on Select All checkbox in filter header row and expect all 500 items to be selected and full selection count show in left footer', () => {
    cy.get('.slick-header-column:nth-of-type(2)')
      .find('label')
      .click({ force: true });

    // cy.get('#filter-checkbox-selectall-container label')
    //   .click({ force: true });

    cy.get('.slick-header-column:nth(1)')
      .find('input[type=checkbox]')
      .should('be.checked');

    cy.get('.left-footer')
      .contains('500 items selected');
  });

  it('should uncheck 2 first rows and expect the Select All checkbox to become unchecked', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`)
      .find('label')
      .click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`)
      .find('label')
      .click();

    cy.get('.slick-header-column:nth(1)')
      .find('input[type=checkbox]')
      .should('not.be.checked');
  });

  it('should recheck the 2 first rows and expect the Select All checkbox to become unchecked', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(1)`)
      .find('label')
      .click();

    cy.get('.slick-header-column:nth(1)')
      .find('input[type=checkbox]')
      .should('not.be.checked');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`)
      .find('label')
      .click();

    cy.get('.slick-header-column:nth(1)')
      .find('input[type=checkbox]')
      .should('be.checked');
  });
});
