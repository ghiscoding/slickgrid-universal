describe('Example 57 - RTL (Right-to-Left)', () => {
  const titles = [
    'Title',
    'Duration',
    'Start',
    'Finish',
    'Priority',
    '% Complete',
    'Assignee',
    'Department',
    'Project',
    'Reviewer',
    'Region',
    'Stage',
    'Budget',
    'Spent',
    'Notes',
    'Effort Driven',
  ];

  beforeEach(() => {
    cy.setCookie('serve-mode', 'cypress');
    cy.visit(`${Cypress.config('baseUrl')}/example57`);
  });

  describe('Basic Rendering', () => {
    it('should display Example title', () => {
      cy.get('h2').should('contain', 'Example 57: RTL (Right-to-Left)');
    });

    it('should have exact column titles in the grid', () => {
      cy.get('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
    });
  });

  describe('Configuration', () => {
    it('should have RTL class applied to grid container', () => {
      cy.get('#grid57')
        .first()
        .then(($grid) => {
          const target = $grid.hasClass('slickgrid-container') ? $grid : $grid.find('.slickgrid-container');
          cy.wrap(target).should('have.class', 'slick-rtl');
        });
    });

    it('should have proper RTL cell content alignment', () => {
      cy.get('.slick-cell:first').should('have.css', 'direction', 'rtl');
    });
  });

  describe('UI Interactions', () => {
    it('should have resize handle on the left side', () => {
      cy.get('.slick-header-column:first .slick-resizable-handle').should('exist').and('have.css', 'left', '0px');
    });

    it('should maintain RTL column order after resize', () => {
      cy.get('.slick-header-column:first .slick-resizable-handle')
        .trigger('mousedown', { which: 1 })
        .then(() => {
          cy.get('body').trigger('mousemove', { clientX: 260, clientY: 0 });
          cy.get('body').trigger('mouseup');
        });

      cy.get('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
      cy.get('#grid57 .slick-docking-horizontal-scroller').then(($scroller) => {
        const scroller = $scroller[0] as HTMLElement;
        const maxScroll = scroller.scrollWidth - scroller.clientWidth;
        scroller.scrollLeft = -maxScroll;
        if (scroller.scrollLeft === 0) {
          scroller.scrollLeft = maxScroll;
        }
        expect(Math.abs(scroller.scrollLeft)).to.be.greaterThan(0);
      });
    });
  });

  describe('Scrolling Behavior', () => {
    it('should have horizontal scroll enabled', () => {
      cy.get('.slick-horizontal-scroller').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        expect(viewport.scrollWidth).to.be.greaterThan(viewport.clientWidth);
      });
    });

    it('should update visible header columns when scrolling', () => {
      cy.get('.slick-horizontal-scroller').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        viewport.scrollLeft = -maxScroll;
        if (viewport.scrollLeft === 0) {
          viewport.scrollLeft = maxScroll;
        }
      });

      cy.wait(150);

      cy.get('.slick-horizontal-scroller').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        expect(Math.abs(viewport.scrollLeft)).to.be.greaterThan(0);
      });
    });
  });

  describe('Edge Cases & Stability', () => {
    it('should handle max horizontal scroll in RTL mode', () => {
      cy.get('.slick-horizontal-scroller').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        viewport.scrollLeft = -maxScroll;
        if (viewport.scrollLeft === 0) {
          viewport.scrollLeft = maxScroll;
        }
      });

      cy.wait(150);
      cy.get('.slick-header-column:visible').last().should('exist');
    });
  });

  describe('Combined RTL pinning, sticky columns, and colspan', () => {
    it('renders both pinning edges, pinned rows, and a crossing colspan together', () => {
      cy.get('#grid57 .slick-header-column[data-id="title"]').should('have.class', 'slick-column-pinned-left');
      cy.get('#grid57 .slick-header-column[data-id="effort-driven"]').should('have.class', 'slick-column-pinned-right');
      cy.get('#grid57 .slick-docking-overlay .slick-row-pinned-top[data-row="0"]').should('exist');
      cy.get('#grid57 .slick-docking-overlay .slick-row-pinned-bottom').should('not.exist');
      const host =
        '#grid57 .slick-row[data-row="2"] > .slick-pinned-left-cells > .slick-cell-colspan-crossing-docking:not(.slick-cell-colspan-part)';
      const part = '#grid57 .slick-row[data-row="2"] > .slick-scrolling-cells > .slick-cell-colspan-part';
      cy.get(host).should('exist').and('not.have.class', 'slick-cell-colspan-shared-edge');
      cy.get(part).should('exist').and('have.class', 'slick-cell-colspan-shared-edge');
      cy.get(host).then(($host) => {
        const hostRect = $host[0].getBoundingClientRect();
        cy.get(part).then(($part) => expect($part[0].getBoundingClientRect().right).to.be.closeTo(hostRect.left, 1.5));
      });
      cy.get('#grid57 .slick-horizontal-scroller').then(($scroller) => {
        const element = $scroller[0] as HTMLElement;
        const max = element.scrollWidth - element.clientWidth;
        element.scrollLeft = -max;
        if (element.scrollLeft === 0) {
          element.scrollLeft = max;
        }
      });
      cy.get('#grid57 .slick-header-column[data-id="priority"]').should('have.class', 'slick-column-sticky');
    });

    it('applies and removes two-sided column pinning at runtime', () => {
      cy.get('#clearPinning').click();
      cy.get('#grid57 .slick-header-column[data-id="title"]').should('not.have.class', 'slick-column-pinned-left');
      cy.get('#grid57 .slick-header-column[data-id="effort-driven"]').should('not.have.class', 'slick-column-pinned-right');
      cy.get('#grid57 .slick-docking-overlay .slick-row-pinned-top').should('not.exist');
      cy.get('#setPinning').click();
      cy.get('#grid57 .slick-header-column[data-id="title"]').should('have.class', 'slick-column-pinned-left');
      cy.get('#grid57 .slick-header-column[data-id="effort-driven"]').should('have.class', 'slick-column-pinned-right');
      cy.get('#grid57 .slick-docking-overlay .slick-row-pinned-top[data-row="0"]').should('exist');
    });
  });
});
