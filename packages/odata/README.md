[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![lerna--lite](https://img.shields.io/badge/maintained%20with-lerna--lite-e137ff)](https://github.com/ghiscoding/lerna-lite)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/odata.svg)](https://www.npmjs.com/package/@slickgrid-universal/odata)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/odata)](https://www.npmjs.com/package/@slickgrid-universal/odata)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@slickgrid-universal/odata?color=success&label=gzip)](https://bundlephobia.com/result?p=@slickgrid-universal/odata)

[![Actions Status](https://github.com/ghiscoding/slickgrid-universal/workflows/CI%20Build/badge.svg)](https://github.com/ghiscoding/slickgrid-universal/actions)
[![Cypress.io](https://img.shields.io/badge/tested%20with-Cypress-04C38E.svg)](https://www.cypress.io/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-fcc72b.svg?logo=vitest)](https://vitest.dev/)
[![codecov](https://codecov.io/gh/ghiscoding/slickgrid-universal/branch/master/graph/badge.svg)](https://codecov.io/gh/ghiscoding/slickgrid-universal)

## Grid OData Service
#### @slickgrid-universal/odata

OData Service to sync a grid with an OData backend server, the service will consider any Filter/Sort and automatically build the necessary OData query string that is sent to your OData backend server.

### Internal Dependencies
- [@slickgrid-universal/common](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/common)
- [@slickgrid-universal/utils](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages/utils)

### External Dependencies
No external dependency

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal/#/example09) page.

### Usage
Simply use pass the Service into the `backendServiceApi` Grid Option.

##### ViewModel
```ts
import { GridOdataService, OdataServiceApi } from '@slickgrid-universal/odata';

export class MyExample {
  initializeGrid {
    this.gridOptions = {
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          version: 4 // OData v2 or v4
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        }
      } as OdataServiceApi
    }
  }
}
```
