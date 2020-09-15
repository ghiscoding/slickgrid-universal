/// <reference types="Cypress" />

describe('Example 07 - Row Move & Checkbox Selector Selector Plugins', () => {
  const GRID_ROW_HEIGHT = 45;
  const fullTitles = ['', '', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Completed'];

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

  it('should uncheck all rows', () => {
    // click twice to check then uncheck all
    cy.get('.slick-column-name > input[type=checkbox]')
      .click({ force: true });
    cy.get('.slick-column-name > input[type=checkbox]')
      .click({ force: true });
  });

  it('should drag opened Row Detail to another position in the grid', () => {
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
      .should('have.length', 0);
  });

  it('should expect row to be moved to another row index', () => {
    cy.get('.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(2)`).should('contain', 'Task 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(2)`).should('contain', 'Task 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(2)`).should('contain', 'Task 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(2)`).should('contain', 'Task 4');

    cy.get('input[type="checkbox"]:checked')
      .should('have.length', 0);
  });

  it('should select 2 rows (Task 3,4), then move row and expect the 2 rows to still be selected without any others', () => {
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
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', 'day').click();
    cy.get('.editor-duration').type('2222').type('{enter}');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(3)`).should('contain', '2222 days');

    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range')
      .invoke('val', 25)
      .trigger('change')
      .type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(4)`).should('contain', '25');

    // change Finish date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-05').click();
    cy.get('.flatpickr-day:nth(25)').click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');

    cy.get('.slick-viewport.slick-viewport-top.slick-viewport-left')
      .scrollTo('top');
  });

  it('should dynamically add 2x new "Title" columns', () => {
    const updatedTitles = ['', '', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Completed', 'Title', 'Title'];

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('not.exist');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('not.exist');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`)
      .should('contain', 'Task 0')
      .should('have.length', 1);

    cy.get('[data-test=add-title-column]')
      .click()
      .click();

    cy.get('.grid7')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(updatedTitles[index]));

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('contain', 'Task 0');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Task 0');
  });

  it('should be able to change value of 1st row "Title" column and expect same value set in all 3 "Title" columns', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(2)`).should('contain', 'Task 0').click();

    cy.get('.editor-title > textarea')
      .type('Task 0000');

    cy.get('.editor-title .btn-save')
      .click();

    // change duration
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).should('contain', 'day').click();
    cy.get('.editor-duration').type('0000').type('{enter}');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(3)`).should('contain', '0000 day');

    // change % complete
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).click();
    cy.get('.slider-editor input[type=range]').as('range')
      .invoke('val', 50)
      .trigger('change')
      .type('{enter}', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(4)`).should('contain', '50');

    // change Finish date
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-05').click();
    cy.get('.flatpickr-day:nth(25)').click('bottom', { force: true });
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(6)`).should('contain', '2009-01-22');

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(8)`).should('contain', 'Task 0000');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 0}px"] > .slick-cell:nth(9)`).should('contain', 'Task 0000');
  });
});
