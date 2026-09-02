describe('Example 04 - right frozen columns', () => {
  it('keeps the right band vertically synchronized while scrolling', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example04`);

    cy.get('.slick-viewport-bottom.slick-viewport-right').scrollTo(0, 600);
    cy.get('.slick-viewport-bottom.slick-viewport-right-frozen').should(($right) => {
      expect($right[0].scrollTop).to.be.greaterThan(0);
    });
    cy.get('.grid-canvas-bottom.grid-canvas-right-frozen .slick-row').should('not.be.empty');

    cy.get('.slick-viewport-bottom.slick-viewport-right').then(($middle) => {
      const row = $middle.find('.slick-row').first().attr('data-row');
      cy.get(`.grid-canvas-bottom.grid-canvas-right-frozen .slick-row[data-row="${row}"]`).should(($frozen) => {
        expect($frozen[0].getBoundingClientRect().top).to.be.closeTo(
          $middle.find(`.slick-row[data-row="${row}"]`)[0].getBoundingClientRect().top,
          1
        );
      });
    });
  });
});
