[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![npm](https://img.shields.io/npm/v/@slickgrid-universal/sql.svg)](https://www.npmjs.com/package/@slickgrid-universal/sql)
[![npm](https://img.shields.io/npm/dy/@slickgrid-universal/sql)](https://www.npmjs.com/package/@slickgrid-universal/sql)

## SQL Service
#### @slickgrid-universal/sql

SQL Service to sync a grid with native SQL queries, the service will consider any Filter/Sort and automatically build the necessary cross-platform SQL query string that is sent to your backend server.

### External Dependencies
No external dependency

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal/#/example10) page.

### Usage
Simply use pass the Service into the `backendServiceApi` Grid Option.

##### ViewModel
```ts
import { SqlService, type SqlServiceApi } from '@slickgrid-universal/sql';

export class MyExample {
  initializeGrid {
    this.gridOptions = {
      backendServiceApi: {
        service: new SqlService(),
        options: {
          tableName: 'users',
          // datasetName: 'public', // optional, for schema/database
          // totalCountField: 'total_count' // optional, custom field name for total count column (default: 'totalCount')
          // identifierEscapeStyle: 'backtick', // optional style (backtick, doubleQuote, bracket)
        },
        preProcess: () => this.displaySpinner(true),
        process: (query) => this.getCustomerApiCall(query),
        postProcess: (response) => {
          this.displaySpinner(false);
          this.getCustomerCallback(response);
        }
      } satisfies SqlServiceApi<MyRowType>
    }
  }
}
```
