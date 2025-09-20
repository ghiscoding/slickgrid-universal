describe('Example 36 - Row Detail View + Grouping', () => {
  const fullTitles = ['', '', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Cost', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example36`);
    cy.get('h3').should('contain', 'Example 36 - Row Detail View + Grouping');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should change server delay to 40ms for faster testing', () => {
    cy.get('[data-test="server-delay"]').type('{backspace}');
  });

  it('should expect grid to be Grouped by "Duration" when loaded', () => {
    cy.get(`[data-row="0"] > .slick-cell:nth(0) .slick-group-toggle.expanded`).should('have.length', 1);
    cy.get(`[data-row="0"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 0');

    // 2nd row should be a regular row
    cy.get('[data-row="1"] > .slick-cell.l2').contains(/Task [0-9]*/);
    cy.get('[data-row="1"] > .slick-cell.l3').contains('0');
  });

  it('should open the 1st Row Detail of Duration(0) Group and expect to find some details', () => {
    cy.get('.slick-cell.l1.r1.detail-view-toggle:nth(0)').click().wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail')
      .find('h4')
      .contains(/Task [0-9]*/);

    cy.get('.dynamic-cell-detail').should('have.length', 1);
    cy.get('.detail label').should('contain', 'Assignee:');
    cy.get('.detail input').should('exist');

    cy.get('input[type="checkbox"]:checked').should('have.length', 0);
  });

  it('should open the 2st Row Detail of Duration(0) Group and expect to find some details', () => {
    cy.get('[data-row="8"] > .slick-cell.l1').click();
    cy.get('[data-row="8"] > .slick-cell.l2').contains(/Task [0-9]*/);

    cy.get('.slick-cell + .dynamic-cell-detail')
      .find('h4')
      .contains(/Task [0-9]*/);

    cy.get('.dynamic-cell-detail').should('have.length', 2);
    cy.get('.detail label').should('contain', 'Assignee:');
    cy.get('.detail input').should('exist');

    cy.get('input[type="checkbox"]:checked').should('have.length', 0);
  });

  it('should collapse 1st Duration(0) Group and not expect any Row Detail shown', () => {
    cy.get('[data-row="0"] .slick-group-toggle.expanded').click();
    cy.get('.dynamic-cell-detail').should('have.length', 0);
    cy.get(`[data-row="1"] > .slick-cell:nth(0) .slick-group-title`).should('contain', 'Duration: 1');
  });

  it('should re-open 1st Duration(0) Group and expect both Row Detail to be shown', () => {
    cy.get('[data-row="0"] .slick-group-toggle.collapsed').click();
    cy.get('.dynamic-cell-detail').should('have.length', 2);

    cy.get('.dynamic-cell-detail').should('have.length', 2);
    cy.get('.detail label').should('contain', 'Assignee:');
    cy.get('.detail input').should('exist');
  });

  it('should be able to collapse all Row Details', () => {
    cy.get('.dynamic-cell-detail').should('have.length', 2);
    cy.get('[data-test="collapse-all-rowdetail-btn"]').click();
    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });

  it('should be able to select any rows, i.e.: row 2 and 4', () => {
    cy.get('[data-row="2"] > .slick-cell:nth(0)').click();
    cy.get('[data-row="4"] > .slick-cell:nth(0)').click();

    cy.get('[data-test="row-selections"]').contains('2,4');
  });

  it('should be able to collapse all Groups', () => {
    cy.get('[data-row="0"] > .slick-cell:nth(0) .slick-group-title').should('contain', 'Duration: 0');
    cy.get('[data-row="1"] > .slick-cell:nth(0) .slick-group-title').should('not.exist');
    cy.get('[data-row="2"] > .slick-cell:nth(0) .slick-group-title').should('not.exist');

    cy.get('.slick-group-toggle.collapsed').should('have.length', 0);
    cy.get('.slick-group-toggle.expanded').should('have.length.above', 2);

    cy.get('[data-test="collapse-all-group-btn"]').click();

    cy.get('.slick-group-toggle.expanded').should('have.length', 0);
    cy.get('.slick-group-toggle.collapsed').should('have.length.above', 2);
  });

  it('should re-open the 1st Group and 1st Row Detail of Duration(0) Group and be able to click on the "Delete Row" button and expect row to be deleted from the grid', () => {
    cy.get('[data-row="0"] .slick-group-toggle.collapsed').click();
    cy.get('.slick-cell.l1.r1.detail-view-toggle:nth(0)').click().wait(40);

    cy.get('.slick-cell + .dynamic-cell-detail')
      .find('h4')
      .contains(/Task [0-9]*/);

    cy.get('.dynamic-cell-detail').should('have.length', 1);
    cy.get('.detail label').should('contain', 'Assignee:');
    cy.get('.detail input').should('exist');

    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('top');
    cy.get('.slick-cell + .dynamic-cell-detail').find('[data-test=delete-btn]').click();
    cy.get('.notification.is-danger').contains(/Deleted row with Task [0-9]*/);
    cy.get('.dynamic-cell-detail').should('have.length', 0);
  });
});
