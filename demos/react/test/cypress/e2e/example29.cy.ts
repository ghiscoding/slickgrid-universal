describe('Example 29 - Header and Footer slots', () => {
  it('should display a custom header as slot', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example29`);
    cy.get('h5:nth(0)').contains('Header Slot');
  });

  it('should render a footer slot', () => {
    cy.get('h5:nth(1)').contains('Footer Slot');
  });

  it('should render a custom element inside footer slot', () => {
    cy.get('[data-test="footer-btn"]').click().click().click().siblings('div').should('contain', '3 time(s)');
  });
});
