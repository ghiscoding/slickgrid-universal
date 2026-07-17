describe('Example 56 - Variable Row Height (Dynamic)', { retries: 1 }, () => {
  const BASE_ROW_HEIGHT = 40;
  const FROZEN_ROW_COUNT = 2;

  const hDefault = (r: number) => {
    const cycle = [33, 44, 44, 80];
    return cycle[r % cycle.length];
  };
  const hCompact = (r: number) => {
    const cycle = [40, 50, 50, 92];
    return cycle[r % cycle.length];
  };
  const topOf = (r: number, hOf: (row: number) => number) => {
    let t = 0;
    for (let i = 0; i < r; i++) {
      t += hOf(i);
    }
    return t;
  };

  const frozenTopHeight = (hOf: (row: number) => number) => topOf(FROZEN_ROW_COUNT, hOf);

  const relativeTopInCanvas = (r: number, hOf: (row: number) => number) => {
    if (r < FROZEN_ROW_COUNT) {
      return topOf(r, hOf);
    }
    return topOf(r, hOf) - frozenTopHeight(hOf);
  };

  const canvasSelector = (r: number) =>
    r < FROZEN_ROW_COUNT ? '#slickGridContainer-grid56 .grid-canvas-top' : '#slickGridContainer-grid56 .grid-canvas-bottom';

  const assertRowStyle = (r: number, hOf: (row: number) => number) => {
    const expectedHeight = hOf(r);
    const expectedTop = relativeTopInCanvas(r, hOf);

    cy.get(`${canvasSelector(r)} .slick-row[data-row=${r}]`)
      .should('have.attr', 'style')
      .and('contain', `transform: translateY(${expectedTop}px)`)
      .then((style) => {
        if (expectedHeight !== BASE_ROW_HEIGHT) {
          expect(style).to.contain(`height: ${expectedHeight}px`);
        } else {
          expect(style).not.to.contain('height:');
        }
      });
  };

  const ensureDefaultDensity = () => {
    cy.get('#slickGridContainer-grid56 .grid-canvas-top .slick-row[data-row=1]')
      .invoke('attr', 'style')
      .then((style) => {
        if ((style ?? '').includes('height: 50px')) {
          cy.get('[data-test="toggle-density"]').click();
        }
      });

    cy.get('#slickGridContainer-grid56 .grid-canvas-top .slick-row[data-row=1]')
      .should('have.attr', 'style')
      .and('contain', 'height: 44px');
  };

  beforeEach(() => {
    cy.visit(`${Cypress.config('baseUrl')}/example56`);
    ensureDefaultDensity();
  });

  it('should display Example title', () => {
    cy.get('h2').should('contain', 'Example 56: Variable Row Height (Dynamic)');
  });

  it('should render frozen and scrollable rows with expected transform and row heights from metadata fallback', () => {
    for (const r of [0, 1, 2, 3, 4, 5, 6]) {
      assertRowStyle(r, hDefault);
    }
  });

  it('should increase row heights and row positions after toggling density', () => {
    assertRowStyle(10, hDefault);

    cy.get('[data-test="toggle-density"]').click();

    assertRowStyle(10, hCompact);

    for (const r of [0, 1, 2, 3, 4, 5, 6]) {
      assertRowStyle(r, hCompact);
    }
  });

  it('should scroll row 90 to top of scrollable pane with frozen top rows', () => {
    const expectedScrollTop = topOf(90, hDefault) - frozenTopHeight(hDefault);

    cy.get('[data-test="scroll-row-90-example56"]').click();

    cy.get('#slickGridContainer-grid56 .slick-viewport-bottom.slick-viewport-left').should(($viewport) => {
      expect($viewport.scrollTop()).to.be.closeTo(expectedScrollTop, 2);
    });

    cy.get('#slickGridContainer-grid56 .slick-row[data-row=90]').should('exist');
  });
});
