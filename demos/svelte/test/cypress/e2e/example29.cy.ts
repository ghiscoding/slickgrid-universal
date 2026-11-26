describe('Example 29 - Header and Footer slots', () => {
  it('should display a custom header as slot', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example29`);
    cy.get('div.custom-header-slot').find('h3').contains('Grid with header and footer slot');
  });

  it('should render a footer slot', () => {
    cy.get('div.custom-footer-slot').should('exist');
  });

  it('should render a custom element inside footer slot', () => {
    cy.get('div.custom-footer-slot').find('button').click().click().click().siblings('div').should('contain', '3 time(s)');
  });
});
