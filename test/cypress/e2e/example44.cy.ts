describe('Example 44 - Variable Row Height (Provider)', { retries: 1 }, () => {
  // mirrors example44 provider output pattern
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
    cy.visit(`${Cypress.config('baseUrl')}/example44`);
    cy.get('h3').should('contain', 'Example 44 - Variable Row Height (Provider)');
  });

  it('should render looping row heights (33, 40, 56, 72)', () => {
    const expectedHeights = [33, 40, 56, 72, 33, 40, 56, 72];
    const defaultRowHeight = 40;

    for (const [row, expectedHeight] of expectedHeights.entries()) {
      cy.get(`.grid44 .slick-row[data-row=${row}]`)
        .invoke('attr', 'style')
        .then((style = '') => {
          expect(style).to.contain(`transform: translateY(${topOf(row)}px)`);
          if (expectedHeight === defaultRowHeight) {
            expect(style).not.to.contain('height:');
          } else {
            expect(style).to.contain(`height: ${expectedHeight}px`);
          }
        });
      cy.get(`[data-row="${row}"] > .slick-cell:nth(3)`).should('contain', `${expectedHeight}px`);
    }
  });

  it('should keep row 90 aligned at top after clicking scroll button', () => {
    cy.get('[data-test="scroll-row-90-example44"]').click();

    cy.get('.grid44 .slick-viewport-top.slick-viewport-left')
      .invoke('scrollTop')
      .then((scrollTop) => {
        expect(Number(scrollTop)).to.be.closeTo(topOf(90), 2);
      });

    cy.get('.grid44 .slick-row[data-row=90]').should('exist');
  });
});
