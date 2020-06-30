## GraphQL Service
#### @slickgrid-universal/graphql

GraphQL Service to sync a grid with an GraphQL backend server, the service will consider any Filter/Sort and automatically build the necessary GraphQL query string that is sent to your GraphQL backend server.

### Dependencies
No external dependency

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page.

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
