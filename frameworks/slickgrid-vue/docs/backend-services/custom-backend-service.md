### Intro
The lib currently supports OData and GraphQL with built-in Services, if you want to use and create a different and Custom Backend Service, then follow the steps below.

### Instructions
To create your own Custom Backend Service, I suggest you take the code of the [GraphqlService](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/graphql/src/services/graphql.service.ts) and then rewrite the internal of each methods. The thing to remember is that you have to implement the `BackendService` as defined in the GraphqlService (`export class GraphqlService implements BackendService`).

You typically want to implement your service following these TypeScript interfaces
- [backendService.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/backendService.interface.ts)
- [backendServiceApi.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/backendServiceApi.interface.ts)
- [backendServiceOption.interface.ts](https://github.com/ghiscoding/slickgrid-universal/blob/master/packages/common/src/interfaces/backendServiceOption.interface.ts)

At the end of it, you'll have a Custom Backend Service that will be instantiated just like the GraphQL or OData that I've created, it should look similar to this (also note, try to avoid passing anything in the `constructor` of your Service to keep it usable by everyone)
```vue
<script setup lang="ts">
import { type Column, Filters, Formatters, SlickgridVue, SortDirection } from 'slickgrid-vue';
import { onBeforeMount, onMounted, onUnmounted, ref, type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);
const isDataLoaded = ref(false);

onBeforeMount(() => {
  defineGrid();
});

function defineGrid() {
  columnDefinitions.value = [/* ... */];

  gridOptions.value = {
    backendServiceApi: {
      service: new YourCustomBackendService(),
      options: {
        // custom service options that extends "backendServiceOption" interface
      },
      preProcess: () => !isDataLoaded.value ? displaySpinner(true) : '',
      process: (query, options) => getCountries(query, options),
      postProcess: (result) => {
        displaySpinner(false);
        isDataLoaded.value = true;
      }
    } as YourCustomBackendServiceApi
  };
}

// Note: The second parameter contains the AbortSignal for an optional request cancellation
function getCountries(query: string, options?: { signal?: AbortSignal }) {
  return fetch(`/api/countries?${query}`, {
    signal: options?.signal  // Pass the signal to enable automatic request cancellation
  });
}
</script>
```

If you need to reference your Service for other purposes then you better instantiate it in a separate variable and then just pass it to the `service` property of the `backendServiceApi`.
```vue
<script setup lang="ts">
import { type Column, type GridOption } from 'slickgrid-vue';
import { type Ref } from 'vue';

const gridOptions = ref<GridOption>();
const columnDefinitions: Ref<Column[]> = ref([]);
const dataset = ref<any[]>([]);

const myCustomService = new YourCustomBackendService();

function defineGrid() {
  gridOptions.value = {
      backendServiceApi: {
        service: myCustomService,
        // ...
      } as YourCustomBackendServiceApi
  };
}
</script>
```

If your Service is for a well known DB or API framework, then it might be possible to add your Service to the lib itself, however it should be added to the new monorepo lib [Slickgrid-Universal](https://github.com/ghiscoding/slickgrid-universal) in the list of [slickgrid-universal/packages](https://github.com/ghiscoding/slickgrid-universal/tree/master/packages). Since that is a monorepo lib, users will have the ability to use and download only the package they need.
## Request Cancellation with AbortSignal

SlickGrid automatically supports request cancellation for Promise-based backend services using the standard `AbortSignal` API. This feature prevents stale results from being processed when users rapidly trigger new filter or sort operations.

### Why Cancellation is Important

Without cancellation, if a user is typing a filter (e.g., "Jo", then "Joe", then "John"), each letter triggers a backend request. If the requests complete out of order, the result from the "Jo" query might arrive AFTER the "John" query result, overwriting the correct data with outdated results.

### How It Works

1. **Automatic**: SlickGrid manages the AbortController internally - you don't need to create one
2. **Transparent**: The `AbortSignal` is automatically passed to your `process` method
3. **Smart**: Only the most recent request result is processed; cancelled requests are silently ignored

### Implementation

All you need to do is accept the optional second parameter in your `process` method and, if you want to support automatic request cancellation, pass the `signal` to your fetch/HTTP call:

```ts
process: (query: string, options?: { signal?: AbortSignal }) => Promise<any>
```

#### Example with Fetch API
```ts
function getCountries(query: string, options?: { signal?: AbortSignal }) {
  return fetch(`/api/countries?q=${query}`, {
    signal: options?.signal  // This automatically aborts when a new request comes in
  }).then(r => r.json());
}
```

#### Example with Axios
```ts
function getCountries(query: string, options?: { signal?: AbortSignal }) {
  return axios.get(`/api/countries?q=${query}`, {
    signal: options?.signal
  });
}
```

#### Example with Error Handling

If you want to handle cancellation errors explicitly:

```ts
function getCountries(query: string, options?: { signal?: AbortSignal }) {
  return fetch(`/api/countries?q=${query}`, {
    signal: options?.signal
  }).then(r => {
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  }).catch(error => {
    // Warning: Aborted requests throw DOMException with name 'AbortError'
    // SlickGrid handles these automatically, so you can ignore them
    if (error.name === 'AbortError') {
      console.log('Request cancelled due to newer filter/sort');
    } else {
      throw error;  // Re-throw real errors
    }
  });
}
```

### Important Notes

- The `AbortSignal` parameter is **optional** - existing implementations without it will continue to work
- **AbortError handling**: When a request is cancelled, it throws an error with `name: 'AbortError'`. SlickGrid handles these automatically
- **Real errors**: Non-AbortError exceptions are still passed to your error callbacks
- **Backwards compatible**: Older implementations that don't use the signal parameter will work as before