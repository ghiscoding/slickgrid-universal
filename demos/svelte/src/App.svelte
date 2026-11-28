<script lang="ts">
  import { onMount, untrack, type Component } from 'svelte';
  import Example01 from './Example01.svelte';
  import Example38 from './Example38.svelte';
  import Example39 from './Example39.svelte';
  import Home from './Home.svelte';

  const examples = [
    { id: '01', name: '1- Basic Grid / 2 Grids' },
    { id: '02', name: '2- Formatters' },
    { id: '03', name: '3- Editors / Delete' },
    { id: '04', name: '4- Client Side Sort/Filter' },
    { id: '05', name: '5- Backend OData Service' },
    { id: '06', name: '6- Backend GraphQL Service' },
    { id: '07', name: '7- Header Button Plugin' },
    { id: '08', name: '8- Header Menu Plugin' },
    { id: '09', name: '9- Grid Menu Control' },
    { id: '10', name: '10- Row Selection / 2 Grids' },
    { id: '11', name: '11- Add/Update Grid Item' },
    { id: '12', name: '12- Localization (i18n)' },
    { id: '13', name: '13- Grouping & Aggregators' },
    { id: '14', name: '14- Column Span & Header Grouping' },
    { id: '15', name: '15- Grid State & Local Storage' },
    { id: '16', name: '16- Row Move Plugin' },
    { id: '17', name: '17- Create Grid from CSV' },
    { id: '18', name: '18- Draggable Grouping' },
    { id: '19', name: '19- Row Detail View' },
    { id: '20', name: '20- Pinned Columns / Rows' },
    { id: '21', name: '21- Grid AutoHeight (full height)' },
    { id: '22', name: '22- with Bootstrap Tabs' },
    { id: '23', name: '23- Filter by Range of Values' },
    { id: '24', name: '24- Cell & Context Menu' },
    { id: '25', name: '25- GraphQL without Pagination' },
    { id: '26', name: '26- Use of Svelte Components' },
    { id: '27', name: '27- Tree Data (Parent/Child)' },
    { id: '28', name: '28- Tree Data (Hierarchical set)' },
    { id: '29', name: '29- Grid Header & Footer Slots' },
    { id: '30', name: '30- Composite Editor Modal' },
    { id: '31', name: '31- Backend OData with RxJS' },
    { id: '32', name: '32- Columns Resize by Content' },
    { id: '33', name: '33- Regular & Custom Tooltip' },
    { id: '34', name: '34- Real-Time Trading Platform' },
    { id: '35', name: '35- Row Based Editing' },
    { id: '36', name: '36- Excel Export Formulas' },
    { id: '37', name: '37- Footer Totals Row' },
    { id: '38', name: '38- Infinite Scroll with OData' },
    { id: '39', name: '39- Infinite Scroll with GraphQL' },
    { id: '40', name: '40- Infinite Scroll from JSON data' },
    { id: '41', name: '41- Drag & Drop' },
    { id: '42', name: '42- Custom Pagination' },
    { id: '43', name: '43- Colspan/Rowspan (timesheets)' },
    { id: '44', name: '44- Colspan/Rowspan (large data)' },
    { id: '45', name: '45- Row Detail with inner Grid' },
    { id: '46', name: '46- Tree Data with Lazy Loading' },
    { id: '47', name: '47- Row Detail + Grouping' },
    { id: '48', name: '48- Hybrid Selection Model' },
    { id: '49', name: '49- Spreadsheet Drag-Fill' },
    { id: '50', name: '50- Master/Detail Grids' },
    { id: '51', name: '51- Menus with Slots' },
    { id: '52', name: '52- SQL Backend Service' },
    { id: '53', name: '53- Custom Filter Bar' },
    { id: '54', name: '54- AI / Web MCP Toolkit' },
    { id: '55', name: '55- Variable Row Height (provider)' },
    { id: '56', name: '56- Variable Row Height (metadata)' },
    { id: '57', name: '57- RTL (Right-to-Left)' },
    { id: '58', name: '58- Sticky Financial Report' },
  ];

  // Match Vue's eager loading exceptions for the first example and the two infinite-scroll demos,
  // which have historically been sensitive to async route loading in Cypress.
  const eagerExampleComponents: Record<string, Component> = {
    '01': Example01,
    '38': Example38,
    '39': Example39,
  };
  const lazyExampleModules = import.meta.glob<{ default: Component }>([
    './Example*.svelte',
    '!./Example01.svelte',
    '!./Example38.svelte',
    '!./Example39.svelte',
  ]);

  let current = $state(window.location.hash.match(/^#\/example(\d+)$/)?.[1] ?? (window.location.hash === '#/home' ? 'home' : '01'));
  let menuOpen = $state(false);
  let CurrentExample: Component | undefined = $state.raw();
  let isLoadingExample = $state(false);
  let failedToLoadExample = $state(false);
  let exampleLoadSequence = 0;
  const selected = $derived(examples.find((example) => example.id === current));

  async function loadExampleComponent(exampleId: string) {
    const loadSequence = ++exampleLoadSequence;
    CurrentExample = undefined;
    failedToLoadExample = false;

    if (exampleId === 'home') {
      isLoadingExample = false;
      return;
    }

    const eagerComponent = eagerExampleComponents[exampleId];
    const moduleLoader = eagerComponent ? async () => ({ default: eagerComponent }) : lazyExampleModules[`./Example${exampleId}.svelte`];

    if (!moduleLoader) {
      isLoadingExample = false;
      return;
    }

    isLoadingExample = true;
    try {
      const exampleModule = await moduleLoader();
      if (loadSequence === exampleLoadSequence) {
        CurrentExample = exampleModule.default;
      }
    } catch (error) {
      console.error(`Failed to load Svelte example ${exampleId}`, error);
      if (loadSequence === exampleLoadSequence) {
        failedToLoadExample = true;
      }
    } finally {
      if (loadSequence === exampleLoadSequence) {
        isLoadingExample = false;
      }
    }
  }

  $effect(() => {
    const exampleId = current;
    untrack(() => void loadExampleComponent(exampleId));
  });

  function syncRoute() {
    const match = window.location.hash.match(/^#\/example(\d+)$/);
    current = match?.[1] ?? (window.location.hash === '#/home' ? 'home' : '01');
  }

  onMount(() => {
    syncRoute();
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  });
</script>

<nav class="navbar navbar-expand-md navbar-dark bg-dark fixed-top">
  <a class="navbar-brand ms-2" href="https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/slickgrid-svelte">
    <i class="mdi mdi-github" aria-hidden="true"></i><span class="ms-2">Slickgrid-Svelte</span>
  </a>
  <div class="github-button-container">
    <a href="https://github.com/ghiscoding/slickgrid-universal">
      <img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social" alt="GitHub stars" />
    </a>
  </div>
  <button
    class="navbar-toggler"
    type="button"
    aria-label="Toggle navigation"
    aria-expanded={menuOpen}
    aria-controls="navbarContent"
    onclick={() => (menuOpen = !menuOpen)}
  >
    <span class="navbar-toggler-icon"></span>
  </button>
  <div id="navbarContent" class:show={menuOpen} class="navbar-collapse collapse justify-content-end me-2">
    <ul class="navbar-nav">
      <li class="nav-item"><a class="nav-link" href="#/home" onclick={() => (menuOpen = false)}>Home</a></li>
      <li class="nav-item">
        <a class="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-svelte/"> Documentation </a>
      </li>
    </ul>
  </div>
</nav>

<div class="panel-wm">
  <aside id="panel-left" class="panel-wm-left" aria-label="Examples">
    <ul class="nav nav-pills nav-stacked">
      <li class="nav-item fw-bold nav-docs">
        <a class="nav-link" href="https://ghiscoding.gitbook.io/slickgrid-svelte/"> 📙 Documentation </a>
      </li>
      {#each examples as example (example.id)}
        <li class="nav-item">
          <a
            class="nav-link"
            class:active={current === example.id}
            aria-current={current === example.id ? 'page' : undefined}
            href={'#/example' + example.id}
          >
            {example.name}
          </a>
        </li>
      {/each}
    </ul>
  </aside>
  <section class="panel-wm-content">
    <div id="demo-container" class:grid8={current === '08'}>
      {#if current === 'home'}
        <Home />
      {:else if CurrentExample}
        <CurrentExample />
      {:else if isLoadingExample}
        <div>Loading...</div>
      {:else if failedToLoadExample}
        <p>Failed to load this example. Try refreshing the page.</p>
      {:else}
        <h2>{selected?.name ?? 'Example not found'}</h2>
        <p>{selected ? 'This example has not been implemented in Svelte yet.' : 'Choose an example from the sidebar.'}</p>
      {/if}
    </div>
  </section>
</div>
