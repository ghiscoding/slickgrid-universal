##### index
- [E2E (Cypress)](#e2e-cypress)
- [Angular-Testing-Library](#angular-testing-library) (or Jest)

---

### E2E (Cypress)
The library is fully tested with Cypress, you can take a look at the [test/cypress/e2e](https://github.com/ghiscoding/Angular-Slickgrid/tree/master/test/cypress/e2e) folder to see the full list of Angular-Slickgrid E2E tests that run with every PR. You could also use other testing framework like Playwright.

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

### Angular Testing Library

As one of the currently trendy approaches to unit/dom testing your application for behavioral vs internal functionality, Testing-Library and more specifically the Angular wrapper [Angular Testing Library](https://testing-library.com/docs/angular-testing-library/intro/) have emerged.

These tests are typically based on either Jest or Vitest leveraging JSDOM, hence a node environment. Slickgrid supports these cases with the `devMode` grid option.

```typescript
describe('Example 3 - Grid with Editors', () => {
  it('should have exact Column Titles in the grid', async () => {
    const fullTitles = ['Name', 'Owner', '% Complete', 'Start', 'Finish', 'Effort Driven'];
    await render(GridDemoComponent, {
      imports: [
        AppModule,
        AngularSlickgridModule.forRoot({
          autoResize: {
            container: '#container',
          },
          devMode: {
            // fake the default container clientWidth since that's not available in jsdom
            containerClientWidth: 1000,

            // if no other dynamic stylesheets are created index 0 is fine to workaround an issue with lack of ownerNode
            ownerNodeIndex: 0
          },
        }),
      ]
    });

    fullTitles.forEach(async (title) => {
      const element = await screen.findByText(title);

      expect(element).toHaveClass('slick-header-column');
    });
  });
});
```
