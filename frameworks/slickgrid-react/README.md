# <a href="https://react.dev/" rel="nofollow"><img alt="React" src="https://ghiscoding.github.io/slickgrid-react-demos/assets/react-logo-DuD1bc7a.png" width="75"></a> Slickgrid-React

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![NPM downloads](https://img.shields.io/npm/dy/slickgrid-react)](https://npmjs.org/package/slickgrid-react)
[![npm](https://img.shields.io/npm/v/slickgrid-react.svg?logo=npm&logoColor=fff&label=npm)](https://www.npmjs.com/package/slickgrid-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/slickgrid-react?color=success&label=gzip)](https://bundlephobia.com/result?p=slickgrid-react)
[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-react.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/test-react.yml)

### Brief introduction
SlickGrid-React is a custom component created specifically for [React](https://react.dev/) framework, it is a wrapper on top of Slickgrid-Universal library which contains the core functionalities. Slickgrid-Universal is written with TypeScript in browser native code, it is framework agnostic and is a monorepo that includes all Editors, Filters, Extensions and Services related to SlickGrid usage with also a few optional packages (like GraphQL, OData, Export to Excel, ...).

## Documentation
📘 [Documentation](https://ghiscoding.gitbook.io/slickgrid-react/getting-started/quick-start) website powered by GitBook  for version 4+ (_... or use the [Wikis](https://github.com/ghiscoding/Slickgrid-React/wiki) for older versions_).

## Installation

Available in Stackblitz (Codeflow) below, this can also be used to provide an issue repro.

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/ghiscoding/slickgrid-react-demos)

Refer to the **[Docs - Quick Start](https://ghiscoding.gitbook.io/slickgrid-react/getting-started/quick-start)** and/or clone the [Slickgrid-React-Demos](https://github.com/ghiscoding/slickgrid-react-demos) repository. Please consult all documentation before opening new issues, also consider asking installation and/or general questions on [Stack Overflow](https://stackoverflow.com/search?tab=newest&q=slickgrid) unless you think there's a bug with the library.

### NPM Package
[slickgrid-react on NPM](https://www.npmjs.com/package/slickgrid-react)

## License
[MIT License](../../LICENSE)

#### Install it

```sh
npm install slickgrid-react
```

#### Basic Usage

```tsx
import { type Column, type GridOption, SlickgridReact } from 'slickgrid-react';

interface User {
  firstName: string;
  lastName: string;
  age: number;
}

export default function Example() {
  const [columns, setColumns] = useState<Column[]>(); // it could also be `Column<User>[]`
  const [options, setOptions] = useState<GridOption>();
  const [dataset, setDataset] = useState<User[]>(getData());

  useEffect(() => defineGrid());

  function defineGrid() {
    setColumns([
      { id: 'firstName', name: 'First Name', field: 'firstName', sortable: true },
      { id: 'lastName', name: 'Last Name', field: 'lastName', sortable: true },
      { id: 'age', name: 'Age', field: 'age', type: 'number', sortable: true },
    ]);

    setOptions({ /*...*/ }); // optional grid options
  }

  function getData() {
    return [
      { id: 1, firstName: 'John', lastName: 'Doe', age: 20 },
      { id: 2, firstName: 'Jane', lastName: 'Smith', age: 21 },
    ];
  }

  return !options ? null : (
    <SlickgridReact gridId="grid1"
        columns={columns}
        options={options}
        dataset={dataset}
     />
  );
}
```

### Troubleshooting

> [!WARNING]
> This project **does not** work well with `React.StrictMode`, so please make sure to disable it to avoid getting mad at the library :P

### Versions Compatibility

> **Note** please be aware that only the latest major version of Slickgrid-React will be supported and receive bug fixes (it's already a lot of work to maintain for a single developer like me).

| Slickgrid-React | React version | Migration Guide | Notes |
|-------------------|-----------------|-----------------|------|
| 9.x               | React 19+       | [Migration 9.x](https://ghiscoding.gitbook.io/slickgrid-react/migrations/migration-to-9.x)     | ESM-Only, requires Slickgrid-Universal [9.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v9.0.0) |
| 5.x               | React 18+       | [Migration 5.x](https://ghiscoding.gitbook.io/slickgrid-react/migrations/migration-to-5.x)     | Modern UI / Dark Mode, requires Slickgrid-Universal [5.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v5.0.0) |
| 4.x               |        | [Migration 4.x](https://ghiscoding.gitbook.io/slickgrid-react/migrations/migration-to-4.x)     | merge SlickGrid into Slickgrid-Universal, requires Slickgrid-Universal [4.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v4.0.2) |
| 3.x               |        | [Migration 3.x](https://ghiscoding.gitbook.io/slickgrid-react/migrations/migration-to-3.x)     | removal of jQuery (now uses browser native code), requires Slickgrid-Universal [3.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v3.0.0) |
| 2.x               | React 18+       | [Migration 2.x](https://ghiscoding.gitbook.io/slickgrid-react/migrations/migration-to-2.x)     | removal of jQueryUI, requires Slickgrid-Universal [2.x](https://github.com/ghiscoding/slickgrid-universal/releases/tag/v2.0.0) version |

### Styling Themes

Multiple styling themes are available
- Default (UI agnostic)
- Bootstrap (see all Slickgrid-React [live demos](https://ghiscoding.github.io/slickgrid-react-demos/))
- Material (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example07))
- Salesforce (see [Slickgrid-Universal](https://ghiscoding.github.io/slickgrid-universal/#/example16))

Also note that all of these themes also have **Dark Theme** equivalent and even though Bootstrap is often used for live demos, it does work as well with any other UI framework like Bulma, Material, ...

### Live Demo page
`Slickgrid-React` works with all `Bootstrap` versions, you can see a demo of each one below. It also works well with any other frameworks like Material or Bulma and there are also couple of extra styling themes based on Material & Salesforce which are also available. You can also use different SVG icons, you may want to look at the [Docs - SVG Icons](https://ghiscoding.gitbook.io/slickgrid-react/styling/svg-icons)
- [Bootstrap 5 demo](https://ghiscoding.github.io/slickgrid-react-demos/) / [examples repo](https://github.com/ghiscoding/slickgrid-react-demos/tree/main/bootstrap5-i18n-demo)

#### Working Demos
For a complete set of working demos (40+ examples), we strongly suggest you to clone the [Slickgrid-React Demos](https://github.com/ghiscoding/slickgrid-react-demos) repository (instructions are provided inside it). The repo provides multiple examples and are updated every time a new release is out, so it is updated frequently and is used as the GitHub live demo page.

## Latest News & Releases
Check out the [Releases](https://github.com/ghiscoding/slickgrid-universal/releases) section for all latest News & Releases.

### Tested with [Vitest](https://vitest.dev/) (Unit Tests) - [Cypress](https://www.cypress.io/) (E2E Tests)
Slickgrid-Universal has **100%** Unit Test Coverage and all Slickgrid-React Examples are tested with [Cypress](https://www.cypress.io/) as E2E tests.

### Like it? ⭐ it
You like **Slickgrid-React**? Be sure to upvote ⭐, and perhaps support me with caffeine [☕](https://ko-fi.com/ghiscoding) or GitHub sponsoring and feel free to contribute. 👷👷‍♀️

<a href='https://ko-fi.com/ghiscoding' target='_blank'><img height='36' width='140' style='border:0px;height:36px;' src='https://storage.ko-fi.com/cdn/kofi3.png?v=6' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
