describe('Example 45 - Variable Row Height (item metadata)', { retries: 1 }, () => {
  const BASE_ROW_HEIGHT = 40;
  const PINNED_ROW_COUNT = 2;

  // mirrors example45 metadata fallback output pattern
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

  const pinnedTopHeight = (hOf: (row: number) => number) => topOf(PINNED_ROW_COUNT, hOf);

  const relativeTopInCanvas = (r: number, hOf: (row: number) => number) => {
    // Pinned rows are moved into the overlay, but center rows retain their
    // natural document coordinates behind that overlay.
    return topOf(r, hOf);
  };

  const rowHostSelector = (r: number) => (r < PINNED_ROW_COUNT ? '.slick-docking-overlay' : '.grid-canvas-top');

  const assertRowStyle = (row: number, hOf: (row: number) => number) => {
    const expectedHeight = hOf(row);
    const expectedTop = relativeTopInCanvas(row, hOf);

    cy.get(`${rowHostSelector(row)} .slick-row[data-row=${row}]`)
      .should('have.attr', 'style')
      .and('contain', `transform: translateY(${expectedTop}px)`)
      .then((style) => {
        if (expectedHeight !== BASE_ROW_HEIGHT) {
          expect(style).to.contain(`height: ${expectedHeight}px`);
        } else {
          // Docked rows carry their resolved height inline so editor/content
          // styles cannot collapse the pinned row. The base-height case is
          // therefore valid with either the stylesheet fallback or an
          // explicit `height: 40px` declaration.
          expect(style).to.match(/(?:height: 40px;|^(?!.*height:))/);
        }
      });
    // Rows are split into left/center/right docking regions, so cells are
    // nested under their region wrapper rather than being direct row children.
    cy.get(`[data-row="${row}"] .slick-cell:nth(3)`).should('contain', `${expectedHeight}px`);
  };

  const ensureDefaultDensity = () => {
    cy.get('.slick-docking-overlay .slick-row[data-row=1]')
      .invoke('attr', 'style')
      .then((style) => {
        if ((style ?? '').includes('height: 50px')) {
          cy.get('[data-test="toggle-density"]').click();
        }
      });

    cy.get('.slick-docking-overlay .slick-row[data-row=1]').should('have.attr', 'style').and('contain', 'height: 44px');
  };

  beforeEach(() => {
    cy.visit(`${Cypress.config('baseUrl')}/example45`);
    ensureDefaultDensity();
  });

  it('should display Example title', () => {
    cy.get('h3').should('contain', 'Example 45 - Variable Row Height (item metadata)');
  });

  it('should render pinned and scrollable rows with expected transform and row heights from metadata fallback', () => {
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

  it('should scroll row 90 to top of scrollable pane with pinned top rows', () => {
    const expectedScrollTop = topOf(90, hDefault) - pinnedTopHeight(hDefault);

    cy.get('[data-test="scroll-row-90-example45"]').click();

    cy.get('.slick-viewport-top.slick-viewport-left').should(($viewport) => {
      expect($viewport.scrollTop()).to.be.closeTo(expectedScrollTop, 2);
    });

    cy.get('.slick-row[data-row=90]').should('exist');
  });
});
