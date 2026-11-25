<script lang="ts">
  import { GlobalGridOptions, type Pagination } from '@slickgrid-universal/common';
  import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
  import { getContext, onMount, untrack } from 'svelte';
  import type { GridOption, I18Next } from '../models/index.js';
  import { createSveltePagination } from '../services/sveltePagination.js';
  import { TranslaterI18NextService } from '../services/translaterI18Next.service.js';
  import { SlickgridSvelteCore } from '../slickgridSvelteCore.js';
  import type { SlickgridSvelteProps } from './slickgridSvelteProps.interface.js';

  type EventCallback = (event: CustomEvent<any>) => unknown;

  let {
    gridId,
    className = '',
    columns = [],
    options = {},
    dataset = [],
    customDataView,
    datasetHierarchical,
    paginationOptions,
    events = {},
    i18n,
    customPaginationComponent,
    instances = $bindable(),
    extensions = $bindable(),
    onSvelteGridCreated,
    header,
    footer,
    ...handlerProps
  }: SlickgridSvelteProps = $props();

  const contextI18n = getContext<I18Next | undefined>('i18next');
  const eventSubscriptions = new Map<string, { unsubscribe(): void }>();
  let container: HTMLDivElement;
  let footerAnchor: HTMLSpanElement | undefined = $state();
  let grid: SlickgridSvelteCore | undefined;
  let eventPubSub: EventPubSubService | undefined;
  let currentHandlers: Record<string, unknown> = {};
  let disposed = false;

  // last values pushed to the grid, so an effect only reacts to a real prop change
  const applied = {
    columns: untrack(() => columns),
    options: untrack(() => options),
    dataset: untrack(() => dataset),
    datasetHierarchical: untrack(() => datasetHierarchical),
    paginationOptions: untrack(() => paginationOptions),
  };

  function applyWhenChanged<K extends keyof typeof applied>(
    key: K,
    value: (typeof applied)[K],
    apply: (value: (typeof applied)[K]) => void
  ) {
    if (grid && value !== applied[key]) {
      applied[key] = value;
      untrack(() => apply(value));
    }
  }

  /** Subscribe once per event name, the latest handler is resolved when the event fires. */
  function syncEventSubscriptions(handlers: Record<string, unknown>) {
    currentHandlers = handlers;
    const names = Object.keys(handlers).filter((name) => name.startsWith('on') && typeof handlers[name] === 'function');
    for (const [name, subscription] of eventSubscriptions) {
      if (!names.includes(name)) {
        subscription.unsubscribe();
        eventSubscriptions.delete(name);
      }
    }
    for (const name of names) {
      if (!eventSubscriptions.has(name)) {
        eventSubscriptions.set(
          name,
          eventPubSub!.subscribeEvent(name, (event) => {
            if ((currentHandlers[name] as EventCallback | undefined)?.(event) === false) {
              event.preventDefault();
            }
          })
        );
      }
    }
  }

  function getPaginationComponent(gridOptions: GridOption) {
    const component = customPaginationComponent ?? gridOptions.customPaginationComponent;
    return component && !(component as any).prototype?.renderPagination ? createSveltePagination(component as any) : component;
  }

  /** The Row Detail resource is instantiated by the extension service (not the grid) so it receives the grid PubSub service. */
  function getRowDetailOptions(gridOptions: GridOption): Partial<GridOption> {
    const RowDetailClass = gridOptions.externalResources?.find((resource: any) => resource?.pluginName === 'SvelteRowDetailView') as any;
    const existingExtensions = gridOptions.preRegisterExternalExtensions;
    if (gridOptions.enableRowDetailView && !RowDetailClass && !existingExtensions) {
      throw new Error('[Slickgrid-Svelte] Row detail requires SvelteRowDetailView in externalResources.');
    }
    if (!gridOptions.enableRowDetailView || !RowDetailClass) {
      return {};
    }
    return {
      externalResources: gridOptions.externalResources?.filter((resource) => resource !== RowDetailClass),
      preRegisterExternalExtensions: (pubSub: any) => [
        ...(existingExtensions?.(pubSub) ?? []),
        {
          name: 'rowDetailView' as const,
          instance: new RowDetailClass(pubSub),
          columnIndexPosition: gridOptions.rowDetailView?.columnIndexPosition,
        },
      ],
    };
  }

  function disposeGrid(emptyDomElementContainer = false) {
    if (!disposed && grid) {
      disposed = true;
      grid.dispose();
      if (emptyDomElementContainer) {
        container.querySelector(':scope > .slickgrid-container')?.remove();
      }
    }
  }

  onMount(() => {
    eventPubSub = new EventPubSubService(container);
    eventPubSub.eventNamingStyle = options.eventNamingStyle ?? GlobalGridOptions.eventNamingStyle ?? 'camelCase';
    syncEventSubscriptions({ ...handlerProps, ...events });

    const i18next = i18n ?? options.i18n ?? contextI18n;
    const translater = options.translater ?? (i18next ? new TranslaterI18NextService() : undefined);
    if (translater instanceof TranslaterI18NextService && i18next) {
      translater.i18nInstance = i18next;
    }
    if (options.enableTranslate && !translater) {
      throw new Error('[Slickgrid-Svelte] Translation requires an i18n instance or a translater service.');
    }
    const languageChanged = (language: string) => eventPubSub!.publish('onLanguageChange', language);
    const rowDetailOptions = getRowDetailOptions(options);
    const paginationComponent = getPaginationComponent(options);
    i18next?.on('languageChanged', languageChanged);

    grid = new SlickgridSvelteCore(
      container,
      columns,
      {
        ...options,
        ...rowDetailOptions,
        translater,
        ...(paginationOptions ? { pagination: paginationOptions } : {}),
        ...(paginationComponent ? { customPaginationComponent: paginationComponent } : {}),
      },
      dataset,
      datasetHierarchical,
      { eventPubSubService: eventPubSub, customDataView, gridElementId: gridId, gridInsertBefore: footerAnchor }
    );

    instances = { ...grid.instances!, element: container, paginationComponent: grid.paginationComponent, dispose: disposeGrid };
    extensions = grid.extensions;
    eventPubSub.publish('onSvelteGridCreated', instances);
    onSvelteGridCreated?.(instances);

    return () => {
      i18next?.off('languageChanged', languageChanged);
      disposeGrid();
      eventSubscriptions.forEach((subscription) => subscription.unsubscribe());
      eventSubscriptions.clear();
      instances = undefined;
      extensions = undefined;
      grid = undefined;
    };
  });

  $effect(() => applyWhenChanged('columns', columns, (value) => (grid!.columns = value)));
  $effect(() =>
    applyWhenChanged('options', options, (value) => {
      const paginationComponent = getPaginationComponent(value);
      grid!.options = { ...value, ...(paginationComponent ? { customPaginationComponent: paginationComponent } : {}) };
    })
  );
  $effect(() => applyWhenChanged('dataset', dataset, (value) => (grid!.dataset = value)));
  $effect(() => applyWhenChanged('datasetHierarchical', datasetHierarchical, (value) => (grid!.datasetHierarchical = value)));
  $effect(() =>
    applyWhenChanged('paginationOptions', paginationOptions, (value) => {
      if (value) {
        grid!.paginationOptions = value as Pagination;
      }
    })
  );
  $effect(() => {
    const handlers: Record<string, unknown> = { ...handlerProps, ...events };
    if (eventPubSub) {
      untrack(() => syncEventSubscriptions(handlers));
    }
  });
</script>

<div id={'slickGridContainer-' + gridId} class={className} bind:this={container}>
  {@render header?.()}
  {#if footer}
    <span bind:this={footerAnchor} hidden aria-hidden="true"></span>
    {@render footer()}
  {/if}
</div>
