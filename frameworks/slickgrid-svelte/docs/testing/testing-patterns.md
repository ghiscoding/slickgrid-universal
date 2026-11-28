# Testing Patterns

### E2E (Cypress)

You can test a Slickgrid-Svelte application with Cypress or another end-to-end testing framework such as Playwright. The library's own [Svelte Cypress tests](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/svelte/test/cypress/e2e) provide more examples of testing grid interactions.

For example, the following Cypress test checks the grid from the [Quick Start](../getting-started/quick-start.md), including the button that adds a row. It assumes the grid is on your application's root page; change the route and selectors to match your application. Start your application and configure Cypress to use its URL before running the test.

```ts
describe('Tasks grid', () => {
  it('displays the columns and adds a task', () => {
    cy.visit('/');

    cy.get('#grid1').find('.slick-header-column').should('contain', 'Title');
    cy.get('#grid1').find('.slick-header-column').should('contain', 'Duration (days)');
    cy.get('#grid1').contains('.slick-cell', 'Task 1').should('be.visible');

    cy.contains('button', 'Add task').click();
    cy.get('#grid1').contains('.slick-cell', 'Task 3').should('be.visible');
  });
});
```

Use a unique `gridId` to scope selectors to the right grid. SlickGrid virtualizes rows, so a row outside the visible viewport may not be present in the DOM until you scroll to it. For each test, set up the page and data it needs according to your test runner's isolation settings.
