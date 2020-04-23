# Slickgrid-Universal

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![CircleCI](https://circleci.com/gh/ghiscoding/slickgrid-universal/tree/master.svg?style=shield)](https://circleci.com/gh/ghiscoding/workflows/slickgrid-universal/tree/master)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)

This is a monorepo project (using Lerna) which is regrouping a few packages under a single repository. 
The goal is to create a common repo that includes all Editors, Filters, Extensions and Services 
that could be used by any Framework (it is framework agnostic). 
It's also a good opportunity to decouple some features/services that not every project require at all time, 
this will also help in getting smaller bundle size depending on which features (packages) are used. For example, not every project requires backend services (OData, GraphQL), 
which is why they are better handled in a monorepo structure.

### Demo page
The GitHub [demo page](https://ghiscoding.github.io/slickgrid-universal) uses the Material Design theme but you could also use Bootstrap theme which is demoed in other frameworks. 
- [Web-Demo-Vanilla-Bundle](https://ghiscoding.github.io/slickgrid-universal) with Material Design theme
- [Angular-Slickgrid](https://ghiscoding.github.io/Angular-Slickgrid/)
- [Aurelia-Slickgrid](https://ghiscoding.github.io/aurelia-slickgrid/) 

### Why create this monorepo?
You might be wondering why was this monorepo created?
1. it removes a lot of duplicate code that existed in both 
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) 
(over 80% were the same code and that is not very DRY).
2. decouple some Services that should not be required at all time (OData, GraphQL, Export to File, Export to Excel, ...)
3. framework agnostic, it could be implemented in many more frameworks in the future

### Frameworks using this monorepo
This is a Work in Progress, the goal is to eventually to rewrite 
[Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) 
and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) to use this monorepo which will simplify debugging/fixing common code. 

Note however that this project also has a Vanilla Implementation (not associated with any framework) 
and that what is used to the test the UI portion. The Vanilla bundle is also used in our SalesForce (with Lightning Web Component) hence the creation of this monorepo.

The main packages structure is the following
- `@slickgrid-universal/common`: commonly used Formatters/Editors/Filters/Services/...
  - this can then be used by any Framework (Angular, Aurelia, VanillaJS, ...)
- `@slickgrid-universal/excel-export`: export to Excel (xls/xlsx)
- `@slickgrid-universal/file-export`: export to text file (csv/txt)
- `@slickgrid-universal/vanilla-bundle`: a vanilla TypeScript/JavaScript implementation (framework-less)
  - |
- Standalone Package
  - `slickgrid-universal/web-demo-vanilla-bundle` standalone package for demo purposes and UI testing (not a public package)

### Installation
To get going with this monorepo, you will need to clone the repo and then follow the steps below

1. Lerna Bootstrap

Run it **only once**, this will install all dependencies and add necessary monorepo symlinks
```bash
npm run bootstrap
```

2. Build

To get started you must run (also once) an initial build so that all necessary `dist` is created for all the packages to work together.
```bash
npm run build
```

3. Run Dev (Vanilla Implementation)

There is a Vanilla flavour implementation of this monorepo, vanilla means that it is not associated with any framework 
and so it is plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia, 
it could be used as a guideline to implement it in other frameworks.

```bash
npm run dev:watch
```

### Tests
To run all packages Jest unit tests, you can run this command
```bash
npm run test

# or as a watch
npm run test:watch
```

## TODO
#### Code
- [x] Aggregators (6)
- [x] Editors (11)
- [x] Filters (17)
  - [ ] Add optional debounce filter delay to local grid
- [x] Formatters (31)
- [ ] Extensions
  - [x] AutoTooltip
  - [x] Cell External Copy Manager
  - [x] Cell Menu
  - [x] Checkbox Selector
  - [x] Context Menu
  - [x] Draggable Grouping
  - [x] Grid Menu
  - [x] Header Button
  - [x] Header Menu
  - [ ] Resizer
  - [ ] Row Detail
  - [x] Row Move Manager
  - [x] Row Selection
- [x] Grouping Formatters (12)
- [x] SortComparers (5)
- [ ] Services
  - [x] Collection
  - [x] Excel Export (**separate package**)
  - [x] Export Text (**separate package**)
  - [x] Extension
  - [x] Filter
  - [ ] GraphQL (**separate package**)
  - [ ] OData (**separate package**)
  - [x] Grid Event
  - [x] Grid Service (helper)
  - [x] Grid State
  - [x] Grouping & Col Span
  - [x] Pagination
  - [ ] Resizer 
    - moved the Service to an Extension
  - [x] Shared
  - [x] Sort
- [ ] Others / Vanilla Implementation
  - [x] Custom Footer
  - [ ] Dynamically Add Columns
  - [ ] Grid Presets
  - [ ] Local Pagination
  - [ ] Tree Data
    - [x] add Grid Demo
    - [x] add Collapse/Expand All into Context Menu
    - [ ] Aggregators support might be nice as well
    - [ ] Search Filter on any Column
    - [ ] Sorting from any Column

#### Other Todos
- [x] VScode Chrome Debugger
- [x] Jest Debugger
- [x] Add Multiple Example Demos with Vanilla implementation
  - [x] Add GitHub Demo website
- [x] Add CI/CD (CircleCI or GitHub Actions)
  - [x] Add Jest Unit tests
  - [ ] Add Cypress E2E tests
  - [x] Add Code Coverage (codecov)
  - [x] Build and run on every PR
- [x] Bundle Creation (vanilla bundle)
  - [ ] Eventually add Unit Tests as a PreBundle task
- [ ] Remove any Deprecated code
  - [ ] Create a Migration Guide 
- [ ] Add Typings for Grid & DataView objects
- [x] Add simple input bindings in the demo (e.g. pinned rows input)
- [ ] Can we change how SlickGrid Events are called and use same signature as SlickGrid instead of CustomEvent EventData signature?
- [ ] Cannot copy text from cell since it's not selectable
