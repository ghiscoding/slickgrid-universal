<script lang="ts">
  import { GraphqlService, type GraphqlResult, type GraphqlServiceApi } from '@slickgrid-universal/graphql';
  import {
    Filters,
    Formatters,
    SlickgridSvelte,
    type Column,
    type GridOption,
    type MultipleSelectOption,
    type SlickgridSvelteInstance,
  } from 'slickgrid-svelte';
  import { i18n } from './data/i18n.js';

  const COUNTRIES_API = 'https://countries.trevorblades.com/';
  void i18n.changeLanguage('en');
  const columns: Column[] = [
    { id: 'countryCode', field: 'code', name: 'Code', maxWidth: 90, sortable: true, filterable: true, columnGroup: 'Country' },
    { id: 'countryName', field: 'name', name: 'Name', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
    { id: 'countryNative', field: 'native', name: 'Native', width: 60, sortable: true, filterable: true, columnGroup: 'Country' },
    {
      id: 'countryPhone',
      field: 'phone',
      name: 'Phone Area Code',
      maxWidth: 110,
      sortable: true,
      filterable: true,
      columnGroup: 'Country',
    },
    { id: 'countryCurrency', field: 'currency', name: 'Currency', maxWidth: 90, sortable: true, filterable: true, columnGroup: 'Country' },
    { id: 'countryEmoji', field: 'emoji', name: 'Emoji', maxWidth: 90, sortable: true, columnGroup: 'Country' },
    {
      id: 'languageName',
      field: 'languages.name',
      name: 'Names',
      width: 60,
      formatter: Formatters.arrayObjectToCsv,
      columnGroup: 'Language',
      params: { propertyNames: ['name'], useFormatterOuputToFilter: true },
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collectionAsync: getLanguages(),
        operator: 'IN_CONTAINS',
        collectionOptions: { addBlankEntry: true, collectionInsideObjectProperty: 'data.languages' },
        collectionFilterBy: [
          { property: 'name', value: '', operator: 'NE' },
          { property: 'name', value: null, operator: 'NE' },
        ],
        collectionSortBy: { property: 'name' },
        customStructure: { value: 'name', label: 'name' },
        options: { filter: true } as MultipleSelectOption,
      },
    },
    {
      id: 'languageNative',
      field: 'languages.native',
      name: 'Native',
      width: 60,
      formatter: Formatters.arrayObjectToCsv,
      columnGroup: 'Language',
      params: { propertyNames: ['native'], useFormatterOuputToFilter: true },
      filterable: true,
      filter: {
        model: Filters.multipleSelect,
        collectionAsync: getLanguages(),
        operator: 'IN_CONTAINS',
        collectionOptions: { addBlankEntry: true, collectionInsideObjectProperty: 'data.languages' },
        collectionFilterBy: [
          { property: 'native', value: '', operator: 'NE' },
          { property: 'native', value: null, operator: 'NE' },
        ],
        collectionSortBy: { property: 'native' },
        customStructure: { value: 'native', label: 'native' },
        options: { filter: true } as MultipleSelectOption,
      },
    },
    {
      id: 'languageCode',
      field: 'languages.code',
      name: 'Codes',
      maxWidth: 100,
      formatter: Formatters.arrayObjectToCsv,
      params: { propertyNames: ['code'], useFormatterOuputToFilter: true },
      columnGroup: 'Language',
      filterable: true,
    },
    {
      id: 'continentName',
      field: 'continent.name',
      name: 'Name',
      width: 60,
      sortable: true,
      filterable: true,
      formatter: Formatters.complexObject,
      columnGroup: 'Continent',
    },
    {
      id: 'continentCode',
      field: 'continent.code',
      name: 'Code',
      maxWidth: 90,
      sortable: true,
      filterable: true,
      filter: {
        model: Filters.singleSelect,
        collectionAsync: getContinents(),
        collectionOptions: { collectionInsideObjectProperty: 'data.continents', addBlankEntry: true, separatorBetweenTextLabels: ': ' },
        customStructure: { value: 'code', label: 'code', labelSuffix: 'name' },
      },
      formatter: Formatters.complexObject,
      columnGroup: 'Continent',
    },
  ];

  const dataset: any[] = [];
  let grid!: SlickgridSvelteInstance;
  let showSubtitle = $state(true);
  let processing = $state(false);
  let status = $state({ text: '', class: '' });

  const options: GridOption = {
    autoResize: { container: '#demo-container', rightPadding: 10 },
    enableFiltering: true,
    enableCellNavigation: true,
    enablePagination: false,
    enableTranslate: true,
    i18n,
    createPreHeaderPanel: true,
    showPreHeaderPanel: true,
    preHeaderPanelHeight: 28,
    datasetIdPropertyName: 'code',
    showCustomFooter: true,
    backendServiceApi: {
      service: new GraphqlService(),
      useLocalFiltering: true,
      useLocalSorting: true,
      options: { datasetName: 'countries' },
      preProcess: () => displaySpinner(true),
      process: (query: string) => getCountries(query),
      postProcess: () => displaySpinner(false),
    } as GraphqlServiceApi,
  };

  interface Country {
    code: string;
    name: string;
    native: string;
    phone: number;
    currency: string;
    emoji: string;
    continent: { code: string; name: string };
    languages: Array<{ code: string; name: string; native: string }>;
  }

  function graphRequest<T>(query: string): Promise<GraphqlResult<T>> {
    return fetch(COUNTRIES_API, {
      method: 'POST',
      body: JSON.stringify({ query }),
      headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    }).then((response) => response.json() as Promise<GraphqlResult<T>>);
  }

  function getCountries(query: string) {
    return graphRequest<Country>(query);
  }

  function getContinents() {
    return graphRequest<{ code: string; name: string }>('query { continents { code, name } }');
  }

  function getLanguages() {
    return graphRequest<{ code: string; name: string; native: string }>('query { languages { code, name, native } }');
  }

  function displaySpinner(isProcessing: boolean) {
    processing = isProcessing;
    status = isProcessing ? { text: 'processing...', class: 'alert alert-danger' } : { text: 'finished', class: 'alert alert-success' };
  }

  function toggleSubtitle() {
    showSubtitle = !showSubtitle;
    requestAnimationFrame(() => grid?.resizerService.resizeGrid());
  }
</script>

<h2>
  Example 25: GraphQL Basic API without Pagination
  <span class="float-end">
    <a
      style="font-size:18px"
      target="_blank"
      rel="noreferrer"
      href="https://github.com/ghiscoding/slickgrid-universal/blob/master/demos/svelte/src/Example25.svelte"
    >
      <i class="mdi mdi-link-variant"></i> code
    </a>
  </span>
  <button
    class="ms-2 btn btn-outline-secondary btn-sm btn-icon"
    type="button"
    data-test="toggle-subtitle"
    aria-label="Toggle example sub-title details"
    onclick={toggleSubtitle}
  >
    <i class="mdi mdi-information-outline"></i>
  </button>
</h2>
{#if showSubtitle}
  <div class="subtitle">
    Use basic GraphQL query with any external public APIs (<a
      href="https://ghiscoding.gitbook.io/svelte-slickgrid/backend-services/graphql"
      target="_blank"
      rel="noreferrer"
    >
      Wiki docs
    </a>).
    <ul>
      <li>
        This Examples uses a Public GraphQL API that you can find at this link
        <a href="https://countries.trevorblades.com/" target="_blank" rel="noreferrer">https://countries.trevorblades.com/</a>
      </li>
      <li>Compare to the regular and default GraphQL implementation, you will find the following differences</li>
      <ul>
        <li>
          There are no Pagination and we only use GraphQL <b>once</b> to load the data, then we use the grid as a regular local in-memory grid
        </li>
        <li>
          We enabled the following 2 flags "useLocalFiltering" and "useLocalSorting" to use regular (in memory) DataView filtering/sorting
        </li>
      </ul>
      <li>
        NOTE - This Example calls multiple GraphQL queries, this is <b>ONLY</b> for demo purposes, you would typically only call 1 query (which
        is what GraphQL is good at)
      </li>
      <li>
        This example is mainly to demo the use of GraphqlService to build the query and retrieve the data but also to demo how to mix that
        with local (in-memory) Filtering/Sorting strategies
      </li>
    </ul>
  </div>
{/if}
<div class="row">
  <div class="col-xs-6 col-sm-3">
    <div class={status.class} role="alert" data-test="status">
      <strong>Status: </strong>
      {status.text}
      <span hidden={!processing}><i class="mdi mdi-sync mdi-spin"></i></span>
    </div>
  </div>
</div>
<SlickgridSvelte gridId="grid25" {columns} {options} {dataset} onSvelteGridCreated={(instance) => (grid = instance)} />

<style>
  :global(#grid25 .slick-preheader-column) {
    font-size: 18px;
    border-right: 1px solid lightgrey;
  }
  :global(.alert) {
    padding: 8px;
  }
</style>
