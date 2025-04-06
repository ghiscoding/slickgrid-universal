describe('Home Page', () => {
  it('should display Home Page', () => {
    cy.visit(`${Cypress.config('baseUrl')}/home`);

    cy.get('h1').should('have.text', 'Aurelia-Slickgrid');
  });
});
