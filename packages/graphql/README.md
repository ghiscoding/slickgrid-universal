[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lerna.js.org/)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/graphql.svg?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/graphql)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/graphql?color=forest)](https://www.npmjs.com/package/@slickgrid-universal/graphql)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/GitHub%20Actions/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![jest](https://jestjs.io/img/jest-badge.svg)](https://github.com/facebook/jest)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## GraphQL Service
#### @slickgrid-universal/graphql

GraphQL Service to sync a grid with an GraphQL backend server, the service will consider any Filter/Sort and automatically build the necessary GraphQL query string that is sent to your GraphQL backend server.

### External Dependencies
No external dependency

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal/#/example10) page.

### Usage
Simply use pass the Service into the `backendServiceApi` Grid Option.

##### ViewModel
```ts
import { GraphqlService, GraphqlServiceApi } from '@slickgrid-universal/graphql';

export class MyExample {
  prepareGrid {
    this.gridOptions = {
      backendServiceApi: {
        service: new GraphqlService(),
        options: {
          datasetName: 'users',
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        }
      } as GraphqlServiceApi
    }
  }
}
```
