## Grid OData Service
#### @slickgrid-universal/odata

OData Service to sync a grid with an OData backend server, the service will consider any Filter/Sort and automatically build the necessary OData query string that is sent to your OData backend server.

### Dependencies
No external dependency

### Installation
Follow the instruction provided in the main [README](https://github.com/ghiscoding/slickgrid-universal#installation), you can see a demo by looking at the [GitHub Demo](https://ghiscoding.github.io/slickgrid-universal) page.

### Usage
In order to use the Service, you will need to register it in your grid options via the `registerExternalServices` as shown below.

##### ViewModel
```ts
import { GridOdataService, OdataServiceApi } from '@slickgrid-universal/odata';

export class MyExample {
  prepareGrid {
    this.gridOptions = {
      backendServiceApi: {
        service: new GridOdataService(),
        options: {
          version: 4 // OData v4
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
