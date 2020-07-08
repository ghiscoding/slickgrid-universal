/// <reference types="cypress" />
import moment from 'moment-mini';

function removeExtraSpaces(textS) {
  return `${textS}`.replace(/\s+/g, ' ').trim();
}

describe('Example 2 - Grid with Formatters', () => {
  const fullTitles = ['#', 'Title', 'Duration', '% Complete', 'Start', 'Finish', 'Cost', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseExampleUrl')}/example02`);
    cy.get('h3').should('contain', 'Example 02 - Grouping & Aggregators');
    cy.get('h3 span.subtitle').should('contain', '(with Material Theme)');
  });

  it('should have exact column titles on 1st grid', () => {
    cy.get('.grid2')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should show a custom text in the grid footer left portion', () => {
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.left-footer')
      .contains('created with Slickgrid-Universal');
  });

  it('should have some metrics shown in the grid right footer', () => {
    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 500 of 500 items`);
      });
  });

  it('should type a filter in the Title and expect 176 items shown in the footer', () => {
    cy.get('.search-filter.filter-title')
      .clear()
      .type('2');

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 176 of 500 items`);
      });
  });

  it('should add another filter "Effort-Driven" set to True and expect 28 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(1)')
      .click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 28 of 500 items`);
      });
  });

  it('should change filter "Effort-Driven" to False and expect 148 items shown in the footer', () => {
    cy.get('div.ms-filter.filter-effortDriven')
      .trigger('click');

    cy.get('.ms-drop')
      .find('span:nth(2)')
      .click();

    cy.get('.grid2')
      .find('.slick-custom-footer')
      .find('.right-footer')
      .should($span => {
        const text = removeExtraSpaces($span.text()); // remove all white spaces
        expect(text).to.eq(`Last Update ${moment().format('YYYY-MM-DD, hh:mm a')} | 148 of 500 items`);
      });
  });
});
