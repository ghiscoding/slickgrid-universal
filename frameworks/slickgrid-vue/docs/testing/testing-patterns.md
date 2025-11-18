##### index
- [E2E (Cypress)](#e2e-cypress)

---

### E2E (Cypress)
The library is fully tested with Cypress, you can take a look at the [test/cypress/e2e](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/vue/test/cypress/e2e) folder to see the full list of Slickgrid-Vue E2E tests that run with every PR. You could also use other testing framework like Playwright.

Below is a super small Cypress test

```ts
describe('Example 3 - Grid with Editors', () => {
  const fullTitles = ['Title', 'Duration (days)', '% Complete', 'Start', 'Finish', 'Effort Driven'];

  it('should display Example title', () => {
    cy.visit(`${Cypress.config('baseUrl')}/editor`);
    cy.get('h2').should('contain', 'Example 3: Editors / Delete');
  });

  it('should have exact Column Titles in the grid', () => {
    cy.get('#grid3')
      .find('.slick-header-columns')
      .children()
      .each(($child, index) => expect($child.text()).to.eq(fullTitles[index]));
  });

  it('should be able to change "Task 1" in first column of second row to a different Task', () => {
    cy.get('[data-row="1"] > .slick-cell:nth(1)').should('contain', 'Task 1').click();
    cy.get('input[type=text].editor-text')
      .type('Task 8888')
      .type('{enter}');

    // revalidate the cell
    cy.get('[data-row="1"] > .slick-cell:nth(1)').should('contain', 'Task 8888');
  });
});
```
