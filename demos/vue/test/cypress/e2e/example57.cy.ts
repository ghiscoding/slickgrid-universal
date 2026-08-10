describe('Example 57 - RTL (Right-to-Left)', () => {
  const titles = ['ID', 'Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  beforeEach(() => {
    cy.setCookie('serve-mode', 'cypress');
    cy.visit(`${Cypress.config('baseUrl')}/example57`);
  });

  describe('Basic Rendering', () => {
    it('should display Example title', () => {
      cy.get('h2').should('contain', 'Example 57: RTL (Right-to-Left)');
    });

    it('should have exact column titles in the grid', () => {
      cy.get('#grid57')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
    });
  });

  describe('Configuration', () => {
    it('should have RTL class applied to grid container', () => {
      cy.get('#grid57').then(($grid) => {
        const target = $grid.hasClass('slickgrid-container') ? $grid : $grid.find('.slickgrid-container');
        cy.wrap(target).should('have.class', 'slick-rtl');
      });
    });

    it('should have proper RTL cell content alignment', () => {
      cy.get('#grid57 .slick-cell:first').should('have.css', 'direction', 'rtl');
    });
  });

  describe('UI Interactions', () => {
    it('should have resize handle on the left side', () => {
      cy.get('#grid57 .slick-header-column:first .slick-resizable-handle').should('exist').and('have.css', 'left', '0px');
    });

    it('should maintain RTL column order after resize', () => {
      cy.get('#grid57 .slick-header-column:first .slick-resizable-handle')
        .trigger('mousedown', { which: 1 })
        .then(() => {
          cy.get('body').trigger('mousemove', { clientX: 260, clientY: 0 });
          cy.get('body').trigger('mouseup');
        });

      cy.get('#grid57')
        .find('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
    });
  });

  describe('Scrolling Behavior', () => {
    it('should have horizontal scroll enabled', () => {
      cy.get('#grid57 .slick-viewport').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        expect(viewport.scrollWidth).to.be.greaterThan(viewport.clientWidth);
      });
    });

    it('should update visible header columns when scrolling', () => {
      cy.get('#grid57 .slick-viewport').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        const maxScroll = viewport.scrollWidth - viewport.clientWidth;
        viewport.scrollLeft = maxScroll;
        if (viewport.scrollLeft === 0) {
          viewport.scrollLeft = -maxScroll;
        }
      });

      cy.wait(150);

      cy.get('#grid57 .slick-viewport').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        expect(Math.abs(viewport.scrollLeft)).to.be.greaterThan(0);
      });
    });
  });
});
