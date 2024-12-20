describe('Example 20 - Basic grid inside a Shadow DOM', () => {
  const fullTitles = ['Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example20`);
    cy.get('h3').should('contain', 'Example 20 - Basic grid inside a Shadow DOM');
    cy.get('h3 span.subtitle').should('contain', '(with Salesforce Theme)');
  });

  it('should have a grid with size 800 * 450px', () => {
    cy.get('#host').shadow().find('.grid20').should('have.css', 'width', '800px');

    cy.get('#host')
      .shadow()
      .find('.grid20 > .slickgrid-container')
      .should(($el) => expect(parseInt(`${$el.height()}`, 10)).to.eq(450));
  });

  it('should have exact column titles in grid', () => {
    cy.get('#host')
      .shadow()
      .find('.grid20')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should click on the "Title" column to "Sort Ascending"', () => {
    cy.get('#host').shadow().find('.grid20').find('.slick-header-column').first().click();

    cy.get('#host').shadow().find('.slick-row').first().children('.slick-cell').first().should('contain', 'Task 0');
  });

  it('should click again on the "Title" column to "Sort Descending"', () => {
    cy.get('#host').shadow().find('.grid20').find('.slick-header-column').first().click();

    cy.get('#host').shadow().find('.slick-row').first().children('.slick-cell').first().should('contain', 'Task 99');
  });
});
