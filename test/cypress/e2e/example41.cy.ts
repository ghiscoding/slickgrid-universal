function removeSpaces(text: string): string {
  return `${text}`.replace(/\s+/g, ' ');
}

const currentYear = new Date().getFullYear();
const presetLowestDay = `${currentYear}-01-01`;
const presetHighestDay = `${currentYear}-02-15`;

describe('Example 41 - SQL Grid', () => {
  beforeEach(() => {
    cy.window().then((win) => {
      cy.spy(win.console, 'log');
    });
  });

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/example41`);
    cy.get('h3').should('contain', 'Example 41 - Grid with SQL Backend Service');
  });

  it('should have a grid of size 900 by 275px', () => {
    cy.get('.grid41').should('have.css', 'width', '900px');
    cy.get('.grid41 > .slickgrid-container').should(($el) => expect(parseInt(`${$el.height()}`, 10)).to.eq(275));
  });

  it('should have English Text inside some of the Filters', () => {
    cy.get('.search-filter.filter-gender .ms-choice > span').contains('Male');
  });

  it('should have SQL query with defined Grid Presets', () => {
    cy.get('.search-filter.filter-name select').should('not.have.value');
    cy.get('.search-filter.filter-name')
      .find('input')
      .invoke('val')
      .then((text) => expect(text).to.eq('Joh*oe'));
    cy.get('.search-filter.filter-gender .ms-choice > span').contains('Male');
    cy.get('.search-filter.filter-company .ms-choice > span').contains('Company XYZ');
    cy.get('.search-filter.filter-finish')
      .find('input')
      .invoke('val')
      .then((text) => expect(text).to.eq(`${presetLowestDay} — ${presetHighestDay}`));
    cy.get('[data-test=alert-sql-query]').should('exist');
    cy.get('[data-test=alert-sql-query]').should('contain', 'SQL Query');
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('SELECT');
      expect(text).to.contain('FROM users');
      expect(text).to.contain('LIMIT');
      expect(text).to.contain('OFFSET');
    });
  });

  it('should use fake smaller server wait delay for faster E2E tests', () => {
    cy.get('[data-test="server-delay"]').clear().type('20');
  });

  it('should change Pagination to next page', () => {
    cy.get('.icon-seek-next').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('OFFSET');
    });
  });

  it('should change Pagination to last page', () => {
    cy.get('.icon-seek-end').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('OFFSET');
    });
  });

  it('should change Pagination to first page using the external button', () => {
    cy.get('[data-test=goto-first-page').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('OFFSET 0');
    });
  });

  it('should change Pagination to last page using the external button', () => {
    cy.get('[data-test=goto-last-page').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('OFFSET');
    });
  });

  it('should change Pagination to first page with 30 items', () => {
    cy.get('.icon-seek-first').click();
    cy.get('#items-per-page-label').select('30');
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('LIMIT 30');
      expect(text).to.contain('OFFSET 0');
    });
  });

  it('should click on "Clear all Filters & Sorts" then "Set Dynamic Sorting" buttons', () => {
    cy.get('[data-test=clear-filters-sorting]').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=set-dynamic-sorting]').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('ORDER BY');
    });
  });

  it('should click on Set Dynamic Filter and expect query and filters to be changed', () => {
    cy.get('[data-test=set-dynamic-filter]').click();
    cy.get('.search-filter.filter-name select').should('have.value', 'a*');
    cy.get('.search-filter.filter-name')
      .find('input')
      .invoke('val')
      .then((text) => expect(text).to.eq('Jane'));
    cy.get('.search-filter.filter-gender .ms-choice > span').contains('Female');
    cy.get('.search-filter.filter-company .ms-choice > span').contains('Acme');
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('Jane%');
      expect(text.toLowerCase()).to.contain('acme');
    });
  });

  it('should use a range filter when searching with ".."', () => {
    cy.get('.slick-header-columns').children('.slick-header-left .slick-header-column:nth(0)').contains('Name').click();
    cy.get('.search-filter.filter-name').find('input').clear().type('Anthony Joyner..Ayers Hood');
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('Anthony Joyner');
      expect(text).to.contain('Ayers Hood');
      expect(text).to.contain('>=');
      expect(text).to.contain('<=');
    });
  });

  it('should open Date picker and expect date range between 01-Jan to 15-Feb', () => {
    cy.get('.search-filter.filter-finish.filled input').click({ force: true });
    cy.get('.vc:visible');
    cy.get('[data-vc="column"]:nth(0) [data-vc="month"]').should('have.text', 'January');
    cy.get('[data-vc="column"]:nth(1) [data-vc="month"]').should('have.text', 'February');
    cy.get('[data-vc="year"]:nth(0)').should('have.text', currentYear);
    cy.get('.vc:visible [data-vc-date-selected] button').should('have.length.greaterThan', 0);
    cy.get('.vc:visible [data-vc-date-selected]').first().should('have.text', '1');
    cy.get('.vc:visible [data-vc-date-selected]').last().should('have.text', '15');
  });

  it('should click on "Name" column to sort it Ascending', () => {
    cy.get('.slick-header-column').first().click();
    cy.get('.slick-header-columns')
      .children('.slick-header-left .slick-header-column:nth(0)')
      .find('.slick-sort-indicator.slick-sort-indicator-desc')
      .should('be.visible');

    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('ORDER BY');
      expect(text).to.contain('DESC');
    });
  });

  it('should perform filterQueryOverride when operator "%%" is selected', () => {
    cy.get('.search-filter.filter-name select')
      .find('option')
      .last()
      .then((element: any) => {
        cy.get('.search-filter.filter-name select').select(element.val());
      });
    cy.get('.search-filter.filter-name').find('input').clear().type('Jo%yn%er');
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('LIKE');
      expect(text).to.contain('Jo%yn%er');
    });
  });

  it('should Clear all Filters & Sorts', () => {
    cy.contains('Clear all Filter & Sorts').click();
    cy.get('[data-test=status]').should('contain', 'finished');
    cy.get('[data-test=sql-query-result]').should(($span) => {
      const text = removeSpaces($span.text());
      expect(text).to.contain('SELECT');
      expect(text).not.to.contain('WHERE');
    });
  });

  it('should hover over the "Name" column header menu and expect all commands be displayed in English', () => {
    cy.get('.grid41')
      .find('.slick-header-columns.slick-header-columns-left .slick-header-column')
      .first()
      .trigger('mouseover')
      .children('.slick-header-menu-button')
      .invoke('show')
      .click();
    cy.get('.slick-header-menu .slick-menu-command-list')
      .should('be.visible')
      .children('.slick-menu-item:nth-of-type(3)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Ascending');
    cy.get('.slick-header-menu .slick-menu-command-list')
      .children('.slick-menu-item:nth-of-type(4)')
      .children('.slick-menu-content')
      .should('contain', 'Sort Descending');
    cy.get('.slick-header-menu .slick-menu-command-list')
      .children('.slick-menu-item:nth-of-type(6)')
      .children('.slick-menu-content')
      .should('contain', 'Remove Filter');
    cy.get('.slick-header-menu .slick-menu-command-list')
      .children('.slick-menu-item:nth-of-type(7)')
      .children('.slick-menu-content')
      .should('contain', 'Remove Sort');
    cy.get('.slick-header-menu .slick-menu-command-list')
      .children('.slick-menu-item:nth-of-type(8)')
      .children('.slick-menu-content')
      .should('contain', 'Hide Column');
  });
});
