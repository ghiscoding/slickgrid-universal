describe('Home Page', () => {
  it('should display Home Page', () => {
    cy.visit(`${Cypress.config('baseUrl')}/home`);

    cy.get('h2').should('contain', 'Slickgrid-Vue');

    cy.get('h4').contains('Quick intro');

    cy.get('h4').contains('Documentation');
  });
});
