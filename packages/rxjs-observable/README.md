[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/rxjs-observable.svg)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/rxjs-observable)](https://www.npmjs.com/package/@slickgrid-universal/rxjs-observable)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/rxjs-observable?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/rxjs-observable)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## RxJS Observable Service Wrapper
#### @slickgrid-universal/rxjs-observable

An RxJS Observable Service Wrapper to make it possible to use RxJS with Slickgrid-Universal (with a Backend Service like OData/GraphQL). By default any Backend Service will be using Promises unless we use this RxJS Observable package.

This package is simply a bridge, a facade, to make it possible to use RxJS without adding RxJS to the `@slickgrid-universal/common` list of dependencies, so RxJS is a dependency of this package without being a dependency of the common (core) package, This will avoid adding dependencies not everyone need and won't clutter the common package (the common package will simply use an empty interface, which won't do anything, without requiring to install RxJS at all. We also have full unit tests coverage for all of that).

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)

### External Dependencies
- [RxJS 7+](https://github.com/ReactiveX/RxJS)

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page.

### Usage
In order to use the Service, you will need to register it in your grid options via the `externalResources` as shown below and of course install RxJS itself (this package requires [RxJS 7](https://github.com/ReactiveX/RxJS)).

##### ViewModel
```ts
import { GridOdataService } from '@slickgrid-universal/odata';
import { RxJsResource } from '@slickgrid-universal/rxjs-observable';

export class MyExample {
  gridOptions: GridOption;

  initializeGrid {
    this.gridOptions = {
      // you will most probably use it with a Backend Service, for example with OData or GraphQL
      backendServiceApi: {
        service: new GridOdataService(),
        preProcess: () => this.displaySpinner(true),
        postProcess: () => this.displaySpinner(false),

        // assuming your Http call is with an RxJS Observable
        process: (query) => this.getAllCustomers$(query),
      } as OdataServiceApi,

      // ...
      externalResources: [new RxJsResource()],
    };
  }
}
```
