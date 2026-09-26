describe('Example 46 - RTL (Right-to-Left)', () => {
  const titles = ['ID', 'Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  beforeEach(() => {
    cy.setCookie('serve-mode', 'cypress');
    cy.visit(`${Cypress.config('baseUrl')}/example46`);
  });

  describe('Basic Rendering', () => {
    it('should display Example title', () => {
      cy.get('h3').should('contain', 'Example 46 - RTL (Right-to-Left)');
    });

    it('should have exact column titles in the grid', () => {
      cy.get('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
    });
  });

  describe('Configuration', () => {
    it('should have RTL class applied to grid container', () => {
      cy.get('.grid46')
        .first()
        .then(($grid) => {
          const target = $grid.hasClass('slickgrid-container') ? $grid : $grid.find('.slickgrid-container');
          cy.wrap(target).should('have.class', 'slick-rtl');
        });
    });

    it('renders a colspan across the leading pinned boundary as one RTL cell', () => {
      const host =
        '.slick-row[data-row="2"] > .slick-pinned-left-cells > .slick-cell-colspan-crossing-docking:not(.slick-cell-colspan-part)';
      const part = '.slick-row[data-row="2"] > .slick-scrolling-cells > .slick-cell-colspan-part';

      cy.get(host).should('have.length', 1).and('not.have.class', 'slick-cell-colspan-shared-edge');
      cy.get(part).should('have.length', 1).and('have.class', 'slick-cell-colspan-shared-edge');
      cy.get(host).then(($host) => {
        const hostRect = $host[0].getBoundingClientRect();
        cy.get(part).then(($part) => {
          const partRect = $part[0].getBoundingClientRect();
          expect(partRect.right).to.be.closeTo(hostRect.left, 1.5);
          expect(partRect.left).to.be.lessThan(hostRect.left);
        });
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
        viewport.scrollLeft = maxScroll;
        if (viewport.scrollLeft === 0) {
          viewport.scrollLeft = -maxScroll;
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
        viewport.scrollLeft = maxScroll;
        if (viewport.scrollLeft === 0) {
          viewport.scrollLeft = -maxScroll;
        }
      });

      cy.wait(150);
      cy.get('.slick-header-column:visible').last().should('exist');
    });
  });
});
