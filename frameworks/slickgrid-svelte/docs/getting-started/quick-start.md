# Quick start

### Easiest Way to Get Started

The easiest way to get started is to clone the [Slickgrid-Svelte-Demos](https://github.com/ghiscoding/slickgrid-svelte-demos) project or open it in [StackBlitz](https://stackblitz.com/github/ghiscoding/slickgrid-svelte-demos). If you prefer to start from scratch, follow the steps below.

### 1. Install NPM Package

Install `Slickgrid-Svelte` in your Svelte application. Slickgrid-Svelte requires Svelte 5 or later.

```sh
npm install slickgrid-svelte
```

You can also install any UI framework you wish to use, for example `Bootstrap`. Bootstrap is optional; SlickGrid themes can be used without it.

The wrapper depends on `@slickgrid-universal/common`, which provides the grid themes. If your package manager requires direct dependencies for imports, install `@slickgrid-universal/common` in your application as well.

### 2. Import necessary dependencies in `main.ts`

Import any application-wide dependencies in your Svelte entry point. For example, if you use Bootstrap, install it and import its styles and JavaScript:

```ts
// Bootstrap is optional
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap';
```

The SlickGrid theme can also be imported in `main.ts`, as shown below.

### 3. CSS / SASS Styles

Load a SlickGrid theme or customize it to your taste (customization requires Sass).

> The `slickgrid-theme-default` theme is framework agnostic and is recommended when getting started. Try it first and customize it if necessary.

#### CSS

Import the compiled CSS theme once in your application entry point:

```ts
// main.ts
import '@slickgrid-universal/common/dist/styles/css/slickgrid-theme-default.css';
```

Bootstrap is optional. Import `slickgrid-theme-bootstrap.css` only if you are using Bootstrap and have loaded its styles. Available themes include `slickgrid-theme-default`, `slickgrid-theme-bootstrap`, `slickgrid-theme-material`, `slickgrid-theme-salesforce`, and `slickgrid-theme-fluent`, with CSS and SCSS versions.

#### SASS (scss)

You can compile the Sass theme with your own customizations. Install a Sass compiler such as `sass`, then override the [Sass variables](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/styles/_variables.scss) using `@use ... with`:

```scss
// app.scss
@use '@slickgrid-universal/common/dist/styles/sass/slickgrid-theme-default.scss' with (
  $cell-odd-background-color: lightyellow,
  $row-mouse-hover-color: lightgreen
);
```

Import `app.scss` in `main.ts` instead of the compiled CSS theme. See [Styling CSS/SASS/Themes](../styling/styling.md) for more details.

### 4. Install/Setup `i18next` for Localization (optional)

Localization is optional; English is the default. There are two approaches:

1. Use [Custom Locale](../localization/localization-single-locale.md) for a single locale, or to change individual grid texts.
2. Use [Localization with i18next](../localization/svelte-i18n.md) to switch between multiple locales dynamically.

For i18next, install the package and create an instance:

```sh
npm install i18next
```

```ts
// i18n.ts
import { createInstance } from 'i18next';

export const i18n = createInstance();
void i18n.init({
  resources: {
    en: { translation: { TITLE: 'Title', DURATION: 'Duration' } },
    fr: { translation: { TITLE: 'Titre', DURATION: 'Durée' } },
  },
  lng: 'en',
  fallbackLng: 'en',
  initAsync: false,
  interpolation: { escapeValue: false },
});
```

Pass the instance to the grid, enable translation in its options, and use `headerKey` for translated column names:

```svelte
<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption } from 'slickgrid-svelte';
  import { i18n } from './i18n.js';

  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', headerKey: 'TITLE' },
    { id: 'duration', name: 'Duration', field: 'duration', headerKey: 'DURATION' },
  ];
  const options: GridOption = { enableTranslate: true, enableAutoResize: false, gridHeight: 320, gridWidth: 800 };
  const dataset = [{ id: 1, title: 'Task 1', duration: 5 }];
</script>

<SlickgridSvelte gridId="translated-grid" {columns} {options} {dataset} {i18n} />
```

You can also provide i18next through Svelte context, or use a custom translate service. See [Svelte and i18next](../localization/svelte-i18n.md) for details.

### 5. Create a basic grid

```svelte
<script lang="ts">
  import { SlickgridSvelte, type Column, type GridOption } from 'slickgrid-svelte';

  const columns: Column[] = [
    { id: 'title', name: 'Title', field: 'title', sortable: true, minWidth: 100 },
    { id: 'duration', name: 'Duration (days)', field: 'duration', sortable: true, minWidth: 100 },
    { id: '%', name: '% Complete', field: 'percentComplete', sortable: true, minWidth: 100 },
    { id: 'start', name: 'Start', field: 'start', minWidth: 100 },
    { id: 'finish', name: 'Finish', field: 'finish', minWidth: 100 },
    { id: 'effort-driven', name: 'Effort Driven', field: 'effortDriven', sortable: true, minWidth: 100 },
  ];

  const options: GridOption = {
    enableAutoResize: false,
    gridHeight: 600,
    gridWidth: 800,
  };

  let dataset = $state.raw([
    { id: 1, title: 'Task 1', duration: 5, percentComplete: 25, start: '2026-01-01', finish: '2026-01-05', effortDriven: true },
    { id: 2, title: 'Task 2', duration: 8, percentComplete: 50, start: '2026-01-06', finish: '2026-01-14', effortDriven: false },
  ]);

  function addTask() {
    const id = dataset.length + 1;
    dataset = [...dataset, { id, title: `Task ${id}`, duration: 3, percentComplete: 0, start: '2026-01-15', finish: '2026-01-18', effortDriven: false }];
  }
</script>

<button onclick={addTask}>Add task</button>
<SlickgridSvelte gridId="grid1" {columns} {options} {dataset} />
```

Each grid needs a unique `gridId`, and each data item needs a unique ID. The grid uses `id` by default; set `datasetIdPropertyName` in the grid options if your items use a different key.

Use `$state.raw` for large datasets and reassign the array when updating it. Reassign `columns`, `options`, `datasetHierarchical`, or `paginationOptions` when updating them as well. See [reactive updates](wrapper-api.md#reactive-updates) for details and runtime option limitations.

### 6. Explore the Documentation page content

Explore the documentation for the grid features available in Slickgrid-Svelte. A few good starting points are:

- [Grid Options](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/gridOption.interface.ts)
- [Formatters](../column-functionalities/formatters.md)
- [Editors](../column-functionalities/editors.md)
- [Filters](../column-functionalities/filters/select-filter.md)
- [Grid Menu](../grid-functionalities/grid-menu.md)
- [Svelte wrapper API](wrapper-api.md)

The documentation is updated frequently, and new or updated guides are generally mentioned in the release notes.

### 7. Get Started

The [Slickgrid-Svelte-Demos](https://github.com/ghiscoding/slickgrid-svelte-demos) repository provides a working project. It includes examples with i18next and a single locale without i18next.

- [Slickgrid-Svelte live demos](https://ghiscoding.github.io/slickgrid-svelte-demos) / [examples repository](https://github.com/ghiscoding/slickgrid-svelte-demos)
- [Open the demo in StackBlitz](https://stackblitz.com/github/ghiscoding/slickgrid-svelte-demos)
- [Svelte example source](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/svelte/src) / [Cypress tests](https://github.com/ghiscoding/slickgrid-universal/tree/master/demos/svelte/test/cypress/e2e)

##### All Live Demo Examples have links to the actual code

To see the code for an example, click its code link in the live demo.

### 8. CSP Compliance

The project supports Content Security Policy (CSP) when you provide a `sanitizer` in your grid options. We recommend [DOMPurify](https://github.com/cure53/DOMPurify). See [CSP Compliance](../developer-guides/csp-compliance.md) for more information.

### 9. Add Optional Feature like Excel Export

Excel Export is an optional package. To use it, install it from npm:

```sh
npm install @slickgrid-universal/excel-export
```

Register `ExcelExportService` in the grid's `externalResources`. See the [Excel Export documentation](../grid-functionalities/export-to-excel.md) for a Svelte example.

Some optional packages include:

- [@slickgrid-universal/excel-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/excel-export)
- [@slickgrid-universal/text-export](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/text-export)
- [@slickgrid-universal/graphql](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/graphql)
- [@slickgrid-universal/odata](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/odata)

### 10. Missing Features?

If you need direct access to a feature, use the SlickGrid and DataView objects exposed by the Svelte wrapper. Access them through `bind:instances` or the `onSvelteGridCreated` callback. The wrapper creates the grid when the component mounts and disposes it when the component is destroyed.

See [SlickGrid & DataView objects](../slick-grid-dataview-objects/SlickGrid-&-DataView-Objects.md), [Grid & DataView Events](../events/grid-dataview-events.md), and the [Svelte wrapper API](wrapper-api.md#access-grid-instances-and-services).

### 11. Having some issues?

After reading the getting started guide and relevant documentation, search the existing [issues](https://github.com/ghiscoding/slickgrid-universal/issues). If you cannot find an answer, open a [new issue](https://github.com/ghiscoding/slickgrid-universal/issues/new) and include a reproducible example. The StackBlitz demo is a useful starting point.

### Final word

This project is open source and is developed largely in spare time. Please be respectful when creating issues and fill in the issue template. If you find the project useful, consider giving it a star or [buying the maintainer a coffee](https://ko-fi.com/ghiscoding). Thank you!
