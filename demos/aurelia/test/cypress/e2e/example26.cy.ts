describe('Example 26 - Use of Aurelia Custom Elements', () => {
  const fullTitles = ['Title', 'Assignee', 'Assignee with Aurelia Component', 'Duration (days)', '% Complete', 'Start', 'Finish'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example26`);
    cy.get('h2').should('contain', 'Example 26: Use of Aurelia Custom Elements');
  });

  it('should have exact column titles in grid', () => {
    cy.get('#slickGridContainer-grid26')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should expect a Custom Aurelia Select Dropdown Editor then select 1st option of 3 Assignee names', () => {
    cy.get('.slick-row:nth(0)')
      .children('.slick-cell:nth(1)')
      .click();

    cy.get('.slick-cell select.form-control option')
      .should('have.length', 4);

    cy.get('.slick-cell select.form-control')
      .select('John');

    cy.get('[data-test="auto-edit-checkbox"]')
      .check();

    cy.get('.slick-row:nth(1)')
      .children('.slick-cell:nth(1)')
      .click();

    cy.get('.slick-cell select.form-control')
      .select('Paul');
  });

  it('should have 2 first rows with "Assignee" of "John" (0) then "Paul" (1)', () => {
    const tasks = [['Task 0', 'John', 'John'], ['Task 1', 'Paul', 'Paul']];

    cy.get('#grid26')
      .find('.slick-row')
      .each(($row, index) => {
        if (index > tasks.length - 1) {
          return;
        }
        cy.wrap($row).children('.slick-cell:nth(0)').should('contain', tasks[index][0]);
        cy.wrap($row).children('.slick-cell:nth(1)').should('contain', tasks[index][1]);
        if (index === 0) {
          // cy.wrap($row).children('.slick-cell:nth(2)').should('contain', '...');
        } else {
          cy.wrap($row).children('.slick-cell:nth(2)').should('contain', tasks[index][2]);
        }
      });
  });

  it('should filter Assignee and expect only 1 row with Paul', () => {
    cy.get('#grid26')
      .find('.slick-headerrow-column:nth(1)')
      .find('select.form-control')
      .select('Paul');

    cy.get('#grid26')
      .find('.slick-row')
      .children('.slick-cell:nth(1)')
      .should('contain', 'Paul');

    cy.get('#grid26')
      .find('.slick-row')
      .should('have.length', 1);
  });

  it('should be able to clear the filter and expect more than 1 row in the grid', () => {
    cy.get('[data-test="clear-filters"]')
      .click();

    cy.get('#grid26')
      .find('.slick-row')
      .children('.slick-cell:nth(1)')
      .should('not.contain', 'Paul');

    cy.get('#grid26')
      .find('.slick-row')
      .should('have.length.greaterThan', 1);
  });
});
