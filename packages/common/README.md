[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/common.svg)](https://www.npmjs.com/package/@slickgrid-universal/common)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/common)](https://www.npmjs.com/package/@slickgrid-universal/common)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/actions/workflows/main.yml/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Common Filters/Editors/Extensions/Services
#### @slickgrid-universal/common

This package is regrouping the most common features, extensions, interfaces that can be used by other Frameworks (it is framework agnostic). It includes all Editors, Filters, Formatters, Grouping, Extensions and Services as can be seen below.

### Internal Dependencies
- [@slickgrid-universal/binding](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/binding)
- [@slickgrid-universal/event-pub-sub](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/event-pub-sub)
- [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils)

### Installation
Go to the root of the repo and follow the instructions provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation)

### What is included?
- **Aggregators** (min, max, avg, sum, ...)
- **Editors & Filters** (input, singleSelect, multipleSelect, date, slider, ...)
- **Extensions** (SlickGrid 3rd party controls/plugins)
- **Formatters** (date formats, decimal, dollars, percent, bold, checkmark, ...)
- **Grouping Formatters** (min, max, avg, sum, ...)
- **Services** (filter, pagination, sort, grid state, ...)
- **SortComparers** (date, numeric, string, ...)
