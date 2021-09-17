/// <reference types="cypress" />

describe('Example 04 - Frozen Grid', { retries: 1 }, () => {
  // NOTE:  everywhere there's a * 2 is because we have a top+bottom (frozen rows) containers even after Unfreeze Columns/Rows

  const fullTitles = ['', 'Title', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];
  const GRID_ROW_HEIGHT = 45;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example04`);
    cy.get('h3').should('contain', 'Example 04 - Pinned (frozen) Columns/Rows');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should have a frozen grid with 4 containers on page load with 3 columns on the left and 6 columns on the right', () => {
    cy.get('[style="top:0px"]').should('have.length', 2 * 2);
    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should hide "Title" column from Grid Menu and expect last frozen column to be "% Complete"', () => {
    const newColumnList = ['', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];

    cy.get('.grid4')
      .find('button.slick-grid-menu-button')
      .click({ force: true });

    cy.get('.grid4')
      .get('.slick-grid-menu:visible')
      .find('.slick-grid-menu-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));

    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 2 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should show again "Title" column from Grid Menu and expect last frozen column to still be "% Complete"', () => {
    cy.get('.grid4')
      .get('.slick-grid-menu:visible')
      .find('.slick-grid-menu-list')
      .children('li:visible:nth(0)')
      .children('label')
      .should('contain', 'Title')
      .click({ force: true });

    cy.get('.grid4')
      .get('.slick-grid-menu:visible')
      .find('span.close')
      .click({ force: true });

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));

    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should hide "Title" column from Header Menu and expect last frozen column to be "% Complete"', () => {
    const newColumnList = ['', '% Complete', 'Start', 'Finish', 'Completed', 'Cost | Duration', 'City of Origin', 'Action'];

    cy.get('.grid4')
      .find('.slick-header-column:nth(1)')
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .click();

    cy.get('.slick-header-menu')
      .should('be.visible')
      .children('.slick-header-menu-item:nth-child(9)')
      .children('.slick-header-menu-content')
      .should('contain', 'Hide Column')
      .click();

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(newColumnList[index]));

    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 2 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should show again "Title" column from Column Picker and expect last frozen column to still be "% Complete"', () => {
    cy.get('.grid4')
      .find('.slick-header-column:nth(4)')
      .trigger('mouseover')
      .trigger('contextmenu')
      .invoke('show');

    cy.get('.slick-columnpicker')
      .find('.slick-columnpicker-list')
      .children('li:nth-child(2)')
      .children('label')
      .should('contain', 'Title')
      .click();

    cy.get('.slick-columnpicker:visible')
      .find('span.close')
      .trigger('click')
      .click();

    cy.get('.grid4')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));

    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should click on the "Remove Frozen Columns" button to switch to a regular grid without frozen columns and expect 7 columns on the left container', () => {
    cy.get('[data-test=remove-frozen-column-button]')
      .click({ force: true });

    cy.get('[style="top:0px"]').should('have.length', 1 * 2);
    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 9 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(3)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(4)').should('contain', '2009-05-05');
  });

  it('should have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Set 3 Frozen Columns" button to switch frozen columns grid and expect 3 frozen columns on the left and 4 columns on the right', () => {
    cy.get('[data-test=set-3frozen-columns]')
      .click({ force: true });

    cy.get('[style="top:0px"]').should('have.length', 2 * 2);
    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 3 * 2);
    cy.get('.grid-canvas-right > [style="top:0px"]').children().should('have.length', 6 * 2);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-right > [style="top:0px"] > .slick-cell:nth(1)').should('contain', '2009-05-05');
  });

  it('should have exact Column Header Titles in the grid', () => {
    cy.get('.grid4')
      .find('.slick-header-columns:nth(0)')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the Grid Menu command "Unfreeze Columns/Rows" to switch to a regular grid without frozen columns/rows', () => {
    cy.get('.grid4')
      .find('button.slick-grid-menu-button')
      .click({ force: true });

    cy.contains('Unfreeze Columns/Rows')
      .click({ force: true });

    cy.get('[style="top:0px"]').should('have.length', 1);
    cy.get('.grid-canvas-left > [style="top:0px"]').children().should('have.length', 9);

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(0)').should('contain', '');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(1)').should('contain', 'Task 0');

    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(3)').should('contain', '2009-01-01');
    cy.get('.grid-canvas-left > [style="top:0px"] > .slick-cell:nth(4)').should('contain', '2009-05-05');
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "True" and expect the cell to be updated and have checkmark icon', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(1)`).should('contain', 'Task 1');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(8)`).find('.checkmark-icon').should('have.length', 0);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(1)`).should('contain', 'Task 2');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(8)`).find('.checkmark-icon').should('have.length', 0);

    cy.get('.grid4').find(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-cell-menu-option-list .slick-cell-menu-item').contains('True').click();
    cy.get('.grid4').find(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-cell-menu-option-list .slick-cell-menu-item').contains('True').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 1);
  });

  it('should open the Cell Menu on 2nd and 3rd row and change the Effort-Driven to "False" and expect the cell to be updated and no longer have checkmark', () => {
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 1);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 1);

    cy.get('.grid4').find(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-cell-menu-option-list .slick-cell-menu-item').contains('False').click();
    cy.get('.grid4').find(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-cell-menu-option-list .slick-cell-menu-item').contains('False').click();

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 1}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 0);
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 2}px"] > .slick-cell:nth(5)`).find('.checkmark-icon').should('have.length', 0);
  });

  it('should open the Cell Menu and delete Row 3 and 4 from the Cell Menu', () => {
    const confirmStub = cy.stub();
    cy.on('window:confirm', confirmStub);

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'Task 3');
    cy.get(`[style="top:${GRID_ROW_HEIGHT * 4}px"] > .slick-cell:nth(1)`).should('contain', 'Task 4');

    cy.get('.grid4').find(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(8)`).contains('Action').click({ force: true });
    cy.get('.slick-cell-menu .slick-cell-menu-command-list .slick-cell-menu-item').contains('Delete Row').click()
      .then(() => expect(confirmStub.getCall(0)).to.be.calledWith('Do you really want to delete row (4) with "Task 3"?'));

    cy.get(`[style="top:${GRID_ROW_HEIGHT * 3}px"] > .slick-cell:nth(1)`).should('contain', 'Task 4');
  });
});
