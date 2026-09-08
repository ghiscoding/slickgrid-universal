describe('Example 47 - Sticky Financial Report', { retries: 1 }, () => {
  const scrollOwner = '.slick-docking-horizontal-scroller';
  const row = (index: number) => `.slick-row[data-row="${index}"]`;
  const cell = (rowIndex: number, columnIndex: number) => `${row(rowIndex)} .slick-cell.l${columnIndex}.r${columnIndex}`;

  beforeEach(() => {
    cy.visit(`${Cypress.config('baseUrl')}/example47`);
  });

  it('should display the financial report title and all report columns', () => {
    cy.get('h3').should('contain', 'Example 47 - Sticky Financial Report');
    cy.get('.slick-header-column').should('have.length', 18);
    cy.get('.slick-header-column').then(($headers) => {
      const ids = [...$headers].map((header) => header.getAttribute('data-id'));
      expect(ids).to.have.members([
        'account',
        'jan',
        'feb',
        'mar',
        'q1',
        'apr',
        'may',
        'jun',
        'q2',
        'jul',
        'aug',
        'sep',
        'q3',
        'oct',
        'nov',
        'dec',
        'q4',
        'ytd',
      ]);
    });
  });

  it('should render the configured sticky columns at the initial viewport', () => {
    cy.get('.slick-header-column[data-id="account"]').should('have.class', 'financial-account-header');
    for (const columnId of ['q1', 'q2', 'q3', 'q4', 'ytd']) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`).should('have.class', 'financial-sticky-candidate-header');
    }
    cy.get(`${row(0)} .slick-cell.financial-sticky-candidate`).should('have.length.at.least', 5);
    cy.get(`${row(0)} .slick-cell.financial-account-column`).should('exist');
  });

  it('should keep the quarter and YTD headers sticky at the far right', () => {
    cy.get(scrollOwner).scrollTo('right');

    for (const [columnId, columnIndex] of [
      ['q3', 12],
      ['q4', 16],
      ['ytd', 17],
    ] as const) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`).should('have.class', 'slick-column-sticky');
      cy.get(cell(0, columnIndex)).should('have.class', 'slick-cell-sticky');
    }
  });

  it('should keep center cells visible when sticky columns occupy the trailing edge', () => {
    cy.get(scrollOwner).scrollTo(167, 0, { ensureScrollable: false });

    // Scroll events can produce one transient render using the previous band
    // assignment. Wait for the resolved trailing band before checking the
    // center hit target.
    cy.get(cell(0, 12)).should('have.class', 'slick-cell-pinned-right');
    cy.get(cell(0, 9)).should(($cell) => {
      const cellElement = $cell[0] as HTMLElement;
      const rect = cellElement.getBoundingClientRect();
      const elementAtCenter = cellElement.ownerDocument.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      expect(elementAtCenter?.closest('.slick-cell')).to.equal(cellElement);
    });

    for (const [columnId, columnIndex] of [
      ['jul', 9],
      ['q2', 8],
      ['q3', 12],
      ['q4', 16],
      ['ytd', 17],
    ] as const) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`).then(($header) => {
        cy.get(cell(0, columnIndex)).then(($cell) => {
          const headerLeft = $header[0].getBoundingClientRect().left;
          const cellLeft = $cell[0].getBoundingClientRect().left;
          expect(Math.abs(headerLeft - cellLeft), `${columnId}: header=${headerLeft}, cell=${cellLeft}`).to.be.lessThan(1);
        });
      });
    }
  });

  it('should move two-sided sticky columns between the nearest edge while scrolling horizontally', () => {
    // At the left edge, the trailing quarter columns are docked to the right.
    cy.get(scrollOwner).scrollTo(0, 0, { ensureScrollable: false });
    for (const columnId of ['q2', 'q3', 'q4', 'ytd']) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`)
        .should('have.class', 'slick-column-sticky')
        .and('have.class', 'slick-column-pinned-right');
    }

    // In the middle, the first quarter is pulled to the left while Q2/Q3/YTD
    // remain docked at the trailing edge.
    cy.get(scrollOwner).scrollTo('50%', 0);
    for (const columnId of ['account', 'q1']) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`)
        .should('have.class', 'slick-column-sticky')
        .and('have.class', 'slick-column-pinned-left');
    }
    for (const columnId of ['q3', 'q4', 'ytd']) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`)
        .should('have.class', 'slick-column-sticky')
        .and('have.class', 'slick-column-pinned-right');
    }

    // At the trailing edge, the leading Account/Q1/Q2 columns remain visible
    // on the left while the later periods occupy their natural positions.
    cy.get(scrollOwner).scrollTo('right');
    for (const columnId of ['account', 'q1', 'q2']) {
      cy.get(`.slick-header-column[data-id="${columnId}"]`)
        .should('have.class', 'slick-column-sticky')
        .and('have.class', 'slick-column-pinned-left');
    }
  });

  it('should scroll to the natural position before activating a sticky column with ArrowRight', () => {
    // At the initial position Q2 is docked at the trailing edge. ArrowRight
    // must reveal its natural position before making it active.
    cy.get(scrollOwner).scrollTo(0, 0, { ensureScrollable: false });
    cy.get('.slick-header-column[data-id="q2"]').should('have.class', 'slick-column-sticky').and('have.class', 'slick-column-pinned-right');
    cy.get(cell(0, 7)).should('exist').click({ force: true });
    cy.get(scrollOwner)
      .invoke('prop', 'scrollLeft')
      .then((beforeScroll) => {
        cy.get(cell(0, 7)).type('{rightarrow}', { force: true });
        cy.get(cell(0, 8)).should('have.class', 'active');
        cy.get(scrollOwner).should(($scroller) => {
          // Depending on which edge currently owns the sticky candidate, the
          // natural position can be either direction from the current scroll
          // offset. What matters for keyboard navigation is that the viewport
          // moves before the candidate becomes active.
          expect(Math.abs(($scroller[0] as HTMLElement).scrollLeft - Number(beforeScroll))).to.be.greaterThan(0);
        });
      });
  });

  it('should keep sticky summary rows keyboard-addressable after scrolling to the report totals', () => {
    cy.get(scrollOwner).scrollTo('right');
    cy.get('.slick-viewport-top.slick-viewport-left').scrollTo('bottom');
    cy.get(`${row(20)} .slick-cell`).should('exist');
    cy.get(`${row(20)} .slick-cell.l0.r0`)
      .click()
      .type('{downarrow}');
    cy.get(`${row(21)} .slick-cell.active`).should('exist');
  });

  it('should dock all three summary rows to the bottom after they have been seen', () => {
    const viewport = '.slick-viewport-top.slick-viewport-left';

    // First reveal the summary rows so two-sided stickiness is eligible.
    cy.get(viewport).scrollTo('bottom');
    for (const rowIndex of [20, 21, 22]) {
      cy.get(row(rowIndex)).should('exist');
    }

    // Moving back above the totals docks them at the nearest (bottom) edge.
    cy.get(viewport).scrollTo(0, 220);
    for (const rowIndex of [20, 21, 22]) {
      cy.get(row(rowIndex)).should('have.class', 'slick-row-sticky').and('have.class', 'slick-row-pinned-bottom');
    }
  });

  it('should toggle the subtitle without destroying the sticky grid', () => {
    cy.get('[data-test="toggle-subtitle"]').click();
    cy.get('.slick-header-column[data-id="account"]').should('exist');
    cy.get('[data-test="toggle-subtitle"]').click();
    cy.get('.slick-header-column[data-id="ytd"]').should('exist');
  });
});
