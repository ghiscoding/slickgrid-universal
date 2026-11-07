describe('Example 46 - RTL (Right-to-Left)', () => {
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

  const scrollHorizontally = (toEnd: boolean) =>
    cy.get('.slick-docking-horizontal-scroller').then(($scroller) => {
      const element = $scroller[0];
      const max = element.scrollWidth - element.clientWidth;
      expect(max, 'the RTL grid has horizontal overflow').to.be.greaterThan(0);
      cy.wrap($scroller).realMouseWheel({ deltaX: (toEnd ? -1 : 1) * element.scrollWidth, deltaY: 0 });
      cy.get('.slick-docking-horizontal-scroller').should(($current) => {
        expect($current[0].scrollLeft, 'the browser reaches the requested RTL scroll edge').to.be.closeTo(toEnd ? -max : 0, 1);
      });
      return cy.get('.slickgrid-container.slick-docking-horizontal-scroll-proxy').should(($container) => {
        const offset = Number.parseFloat(getComputedStyle($container[0]).getPropertyValue('--slick-docking-scroll-left'));
        expect(offset, 'SlickGrid synchronizes the horizontal scroll offset').to.be.closeTo(toEnd ? -max : 0, 1);
      });
    });

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

  describe('Column Reordering', () => {
    it('should reorder center headers in RTL while preserving both pinned bands', () => {
      let centerIds: Array<string | undefined>;
      let pinnedIds: Array<string | undefined>;
      const pinnedSelector = '.slick-header-columns-left .slick-header-column, .slick-header-columns-right .slick-header-column';
      cy.get(pinnedSelector).then(($headers) => {
        pinnedIds = [...$headers].map((header) => header.dataset.id);
      });
      cy.get('.slick-header-columns-center .slick-header-column').then(($headers) => {
        centerIds = [...$headers].map((header) => header.dataset.id);
        expect(centerIds.slice(0, 2)).to.deep.equal(['start', 'finish']);
      });

      cy.get('.slick-header-columns-center [data-id="start"]').drag('.slick-header-columns-center [data-id="finish"]');
      cy.get('.slick-header-columns-center .slick-header-column').should(($headers) => {
        expect([...$headers].map((header) => header.dataset.id)).to.deep.equal(['finish', 'start', ...centerIds.slice(2)]);
      });
      // A leading pinned header must stay in its own region when dragged across the boundary.
      cy.get('.slick-header-columns-left [data-id="title"]').drag('.slick-header-columns-center [data-id="finish"]');
      cy.get(pinnedSelector).should(($headers) => {
        expect([...$headers].map((header) => header.dataset.id)).to.deep.equal(pinnedIds);
      });
      cy.get('.slick-header-columns-center .slick-header-column').should(($headers) => {
        expect([...$headers].map((header) => header.dataset.id)).to.deep.equal(['finish', 'start', ...centerIds.slice(2)]);
      });
      // Restore the original order for the subsequent tests, which share the page state.
      cy.get('.slick-header-columns-center [data-id="finish"]').drag('.slick-header-columns-center [data-id="start"]');
      cy.get('.slick-header-columns-center .slick-header-column').should(($headers) => {
        expect([...$headers].map((header) => header.dataset.id)).to.deep.equal(centerIds);
      });
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
      cy.get('.slick-header-column[data-id="start"] .slick-resizable-handle').should('exist').and('have.css', 'left', '0px');
    });

    it('should maintain RTL column order after resize', () => {
      cy.get('.slick-header-column[data-id="start"] .slick-resizable-handle').then(($handle) => {
        const handle = $handle[0] as HTMLElement;
        const column = handle.closest('.slick-header-column') as HTMLElement;
        const initialWidth = column.getBoundingClientRect().width;
        const startX = handle.getBoundingClientRect().left;
        const targetX = startX - 40;

        cy.wrap($handle)
          .trigger('mousedown', { which: 1, clientX: startX, pageX: startX })
          .then(() => {
            cy.get('body')
              .trigger('mousemove', { clientX: targetX, pageX: targetX, clientY: 0 })
              .trigger('mouseup', { clientX: targetX, pageX: targetX })
              .then(() => expect(column.getBoundingClientRect().width).to.be.greaterThan(initialWidth));
          });
      });

      cy.get('.slick-header-columns')
        .children()
        .each(($child, index) => expect($child.text()).to.eq(titles[index]));
      scrollHorizontally(true);
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
      scrollHorizontally(true);

      cy.get('.slick-horizontal-scroller').then(($viewport) => {
        const viewport = $viewport[0] as HTMLElement;
        expect(Math.abs(viewport.scrollLeft)).to.be.greaterThan(0);
      });
    });
  });

  describe('Edge Cases & Stability', () => {
    it('should handle max horizontal scroll in RTL mode', () => {
      scrollHorizontally(true);
      cy.get('.slick-header-column:visible').last().should('exist');
    });
  });
  describe('Combined RTL pinning, sticky columns, and colspan', () => {
    it('renders both pinning edges, pinned rows, and a crossing colspan together', () => {
      cy.get('.slick-header-column[data-id="title"]').should('have.class', 'slick-column-pinned-left');
      cy.get('.slick-header-column[data-id="effort-driven"]').should('have.class', 'slick-column-pinned-right');
      cy.get('.slick-docking-overlay .slick-row-pinned-top[data-row="0"]').should('exist');
      cy.get('.slick-docking-overlay .slick-row-pinned-bottom').should('not.exist');

      const host =
        '.slick-row[data-row="2"] > .slick-pinned-left-cells > .slick-cell-colspan-crossing-docking:not(.slick-cell-colspan-part)';
      const part = '.slick-row[data-row="2"] > .slick-scrolling-cells > .slick-cell-colspan-part';
      cy.get(host).should('exist').and('not.have.class', 'slick-cell-colspan-shared-edge');
      cy.get(part).should('exist').and('have.class', 'slick-cell-colspan-shared-edge');
      scrollHorizontally(false);
      cy.get('.slick-horizontal-scroller').then(($scroller) => {
        const element = $scroller[0] as HTMLElement;
        cy.get('.slickgrid-container.slick-docking-horizontal-scroll-proxy').should(($container) => {
          expect(getComputedStyle($container[0]).getPropertyValue('--slick-docking-scroll-left').trim()).to.eq('0px');
        });
        cy.get(part).then(($initialPart) => {
          const startScrollLeft = element.scrollLeft;
          const initialHostRect = Cypress.$(host)[0].getBoundingClientRect();
          const initialPartRect = $initialPart[0].getBoundingClientRect();
          const content = $initialPart[0].querySelector('.slick-cell-colspan-part-content') as HTMLElement;
          const initialContentLeft = content.getBoundingClientRect().left;
          expect(startScrollLeft, 'the RTL scroller resets to its origin').to.eq(0);
          expect(initialPartRect.right, 'continuation starts at the pinned host edge').to.be.closeTo(initialHostRect.left, 1.5);

          const max = element.scrollWidth - element.clientWidth;
          expect(max, 'the RTL grid has horizontal overflow').to.be.greaterThan(0);
          scrollHorizontally(true);
          cy.get(part).should(($part) => {
            const scrollDelta = element.scrollLeft - startScrollLeft;
            const partDelta = $part[0].getBoundingClientRect().right - initialPartRect.right;
            const contentDelta =
              ($part[0].querySelector('.slick-cell-colspan-part-content') as HTMLElement).getBoundingClientRect().left - initialContentLeft;
            const hostDelta = Cypress.$(host)[0].getBoundingClientRect().left - initialHostRect.left;

            expect(scrollDelta, 'the RTL scroller moved toward its negative maximum').to.be.lessThan(0);
            expect(hostDelta, 'the pinned host stays fixed').to.be.closeTo(0, 1);
            expect(partDelta, 'the continuation follows horizontal scrolling').to.be.closeTo(-scrollDelta, 1.5);
            expect(contentDelta, 'the continuation text follows horizontal scrolling').to.be.closeTo(-scrollDelta, 1.5);
          });
        });
      });
      cy.get('.slick-header-column[data-id="priority"]').should('have.class', 'slick-column-sticky');
    });

    it('applies and removes two-sided column pinning at runtime', () => {
      const trailingHeaderOffset = { left: 0, right: 0 };
      cy.get('.slick-row[data-row="1"] .slick-cell.l15').then(($cell) => {
        const header = Cypress.$('.slick-header-column[data-id="effort-driven"]')[0];
        const headerRect = header.getBoundingClientRect();
        const cellRect = $cell[0].getBoundingClientRect();
        const scale = headerRect.width / header.offsetWidth;
        expect(cellRect.width - headerRect.width, 'the last header reserves its 2px Grid Menu allowance').to.be.closeTo(2 * scale, 1.5);
        trailingHeaderOffset.left = headerRect.left - cellRect.left;
        trailingHeaderOffset.right = headerRect.right - cellRect.right;
      });
      cy.get('#clearPinning').click();
      cy.get('.slick-header-column[data-id="title"]').should('not.have.class', 'slick-column-pinned-left');
      cy.get('.slick-header-column[data-id="effort-driven"]').should('not.have.class', 'slick-column-pinned-right');
      cy.get('.slick-docking-overlay .slick-row-pinned-top').should('not.exist');
      cy.get('#setPinning').click();
      cy.get('.slick-header-column[data-id="title"]').should('have.class', 'slick-column-pinned-left');
      cy.get('.slick-header-column[data-id="effort-driven"]').should('have.class', 'slick-column-pinned-right');
      cy.get('.slick-docking-overlay .slick-row-pinned-top[data-row="0"]').should('exist');
      const alignedColumns = [
        { id: 'title', cell: 0 },
        { id: 'duration', cell: 1 },
        { id: 'priority', cell: 4 },
        { id: 'notes', cell: 14 },
        { id: 'effort-driven', cell: 15 },
      ];
      alignedColumns.forEach(({ id, cell }) => {
        cy.get(`.slick-row[data-row="1"] .slick-cell.l${cell}`).should(($cell) => {
          const headerRect = Cypress.$(`.slick-header-column[data-id="${id}"]`)[0].getBoundingClientRect();
          const cellRect = $cell[0].getBoundingClientRect();
          const headerOffset = id === 'effort-driven' ? trailingHeaderOffset : { left: 0, right: 0 };
          expect(cellRect.left, `${id} cell aligns with its header after restoring pinning`).to.be.closeTo(
            headerRect.left - headerOffset.left,
            1.5
          );
          expect(cellRect.right, `${id} cell width matches its header after restoring pinning`).to.be.closeTo(
            headerRect.right - headerOffset.right,
            1.5
          );
        });
      });
    });
  });
});
