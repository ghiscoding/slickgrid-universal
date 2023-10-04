describe('Example 19 - ExcelCopyBuffer with Cell Selection', { retries: 1 }, () => {
  const titles = ['Title', 'Phone Number using mask', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven', 'Completed'];
  const GRID_ROW_HEIGHT = 40;

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example19`);
    cy.get('h3').should('contain', 'Example 19 - ExcelCopyBuffer with Cell Selection');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid19')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(titles[index]));
  });

  it('should check first 5 rows and expect certain data', () => {
    for (let i = 0; i < 5; i++) {
      cy.get(`[style="top:${GRID_ROW_HEIGHT * i}px"] > .slick-cell:nth(0)`).contains(`Task ${i}`);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * i}px"] > .slick-cell:nth(1)`).contains(/\(\d{3}\)\s\d{3}\-\d{4}/);
      cy.get(`[style="top:${GRID_ROW_HEIGHT * i}px"] > .slick-cell:nth(2)`).contains(/[0-9\.]*/);
    }
  });

});
