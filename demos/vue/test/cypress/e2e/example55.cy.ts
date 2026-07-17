describe('Example 55 - Variable Row Height (Provider)', { retries: 1 }, () => {
  const hOf = (r: number) => {
    const cycle = [33, 40, 56, 72];
    return cycle[r % cycle.length];
  };
  const topOf = (r: number) => {
    let t = 0;
    for (let i = 0; i < r; i++) {
      t += hOf(i);
    }
    return t;
  };

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example55`);
    cy.get('h2').should('contain', 'Example 55: Variable Row Height (Provider)');
  });

  it('should render looping row heights (33, 40, 56, 72)', () => {
    const expectedHeights = [33, 40, 56, 72, 33, 40, 56, 72];
    const defaultRowHeight = 40;

    for (const [r, expectedHeight] of expectedHeights.entries()) {
      cy.get(`#slickGridContainer-grid55 .slick-row[data-row=${r}]`)
        .invoke('attr', 'style')
        .then((style = '') => {
          expect(style).to.contain(`transform: translateY(${topOf(r)}px)`);
          if (expectedHeight === defaultRowHeight) {
            expect(style).not.to.contain('height:');
          } else {
            expect(style).to.contain(`height: ${expectedHeight}px`);
          }
        });
    }
  });

  it('should keep row 90 aligned at top after clicking scroll button', () => {
    cy.get('[data-test="scroll-row-90-example55"]').click();

    cy.get('#slickGridContainer-grid55 .slick-viewport-top.slick-viewport-left')
      .invoke('scrollTop')
      .then((scrollTop) => {
        expect(Number(scrollTop)).to.be.closeTo(topOf(90), 2);
      });

    cy.get('#slickGridContainer-grid55 .slick-row[data-row=90]').should('exist');
  });
});
