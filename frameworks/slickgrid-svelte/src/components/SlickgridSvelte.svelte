<script lang="ts">
  import { GlobalGridOptions, type Column, type CustomDataView, type ExtensionList, type Pagination } from '@slickgrid-universal/common';
  import { EventPubSubService } from '@slickgrid-universal/event-pub-sub';
  import { getContext, onMount, type Component } from 'svelte';
  import type { GridOption, I18Next, SlickgridSvelteInstance } from '../models/index.js';
  import { createSveltePagination, type SveltePaginationProps } from '../services/sveltePagination.js';
  import { TranslaterI18NextService } from '../services/translaterI18Next.service.js';
  import { SlickgridSvelteCore } from '../slickgridSvelteCore.js';
  import type { SvelteGridEventHandlers } from './slickgridSvelteEvents.interface.js';
  import type { SlickgridSvelteProps } from './slickgridSvelteProps.interface.js';

  interface $$Props extends SlickgridSvelteProps, Omit<SvelteGridEventHandlers, 'onSvelteGridCreated'> {}

  export let gridId: string;
  export let className = '';
  export let columns: Column[] = [];
  export let options: GridOption = {};
  export let dataset: any[] = [];
  export let customDataView: CustomDataView | undefined = undefined;
  export let datasetHierarchical: any[] | undefined = undefined;
  export let paginationOptions: Pagination | undefined = undefined;
  export let events: SvelteGridEventHandlers = {};
  export let i18n: I18Next | undefined = undefined;
  export let customPaginationComponent: Component<SveltePaginationProps> | undefined = undefined;
  export let instances: SlickgridSvelteInstance | undefined = undefined;
  export let extensions: ExtensionList<any> | undefined = undefined;
  export let onSvelteGridCreated: ((instance: SlickgridSvelteInstance) => void) | undefined = undefined;

  const contextI18n = getContext<I18Next | undefined>('i18next');
  let container: HTMLDivElement;
  let footerAnchor: HTMLSpanElement;
  let grid: SlickgridSvelteCore | undefined;
  let previousColumns: Column[];
  let previousOptions: GridOption;
  let previousDataset: any[];
  let previousHierarchical: any[] | undefined;
  let previousPagination: Pagination | undefined;
  let eventPubSub: EventPubSubService;
  let disposed = false;
  let eventSubscriptions: Array<{ unsubscribe(): void }> = [];
  let previousEvents: SvelteGridEventHandlers;
  $: eventHandlers = { ...$$restProps, ...events } as SvelteGridEventHandlers;

  function subscribeEvents(handlers: SvelteGridEventHandlers) {
    eventSubscriptions.forEach((subscription) => subscription.unsubscribe());
    eventSubscriptions = Object.keys(handlers)
      .filter((name) => name.startsWith('on') && typeof (handlers as any)[name] === 'function')
      .map((name) =>
        eventPubSub.subscribeEvent(name, (event) => {
          if ((handlers as Record<string, ((event: CustomEvent<any>) => unknown) | undefined>)[name]?.(event) === false) {
            event.preventDefault();
          }
        })
      );
  }

  function getPaginationComponent(gridOptions: GridOption) {
    const component = customPaginationComponent ?? gridOptions.customPaginationComponent;
    return component && !(component as any).prototype?.renderPagination
      ? createSveltePagination(component as Component<SveltePaginationProps>)
      : component;
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
    previousColumns = columns;
    previousOptions = options;
    previousDataset = dataset;
    previousHierarchical = datasetHierarchical;
    previousPagination = paginationOptions;
    previousEvents = eventHandlers;
    eventPubSub = new EventPubSubService(container);
    eventPubSub.eventNamingStyle = options.eventNamingStyle ?? GlobalGridOptions.eventNamingStyle ?? 'camelCase';
    subscribeEvents(eventHandlers);
    const i18next = i18n ?? options.i18n ?? contextI18n;
    const sveltePagination = getPaginationComponent(options);
    const translater = options.translater ?? (i18next ? new TranslaterI18NextService() : undefined);
    if (translater instanceof TranslaterI18NextService && i18next) {
      translater.i18nInstance = i18next;
    }
    if (options.enableTranslate && !translater) {
      throw new Error('[Slickgrid-Svelte] Translation requires an i18n instance or a translater service.');
    }
    const languageChanged = (language: string) => eventPubSub.publish('onLanguageChange', language);
    const rowDetailClass = options.externalResources?.find((resource: any) => resource?.pluginName === 'SvelteRowDetailView') as any;
    const existingExtensions = options.preRegisterExternalExtensions;
    const externalResources = options.externalResources?.filter((resource) => resource !== rowDetailClass);
    const rowDetailOptions =
      options.enableRowDetailView && rowDetailClass
        ? {
            externalResources,
            preRegisterExternalExtensions: (pubSub: any) => [
              ...(existingExtensions?.(pubSub) ?? []),
              {
                name: 'rowDetailView' as const,
                instance: new rowDetailClass(pubSub),
                columnIndexPosition: options.rowDetailView?.columnIndexPosition,
              },
            ],
          }
        : {};
    if (options.enableRowDetailView && !rowDetailClass && !existingExtensions) {
      throw new Error('[Slickgrid-Svelte] Row detail requires SvelteRowDetailView in externalResources.');
    }
    i18next?.on('languageChanged', languageChanged);
    grid = new SlickgridSvelteCore(
      container,
      columns,
      {
        ...options,
        ...rowDetailOptions,
        translater,
        ...(paginationOptions ? { pagination: paginationOptions } : {}),
        ...(sveltePagination ? { customPaginationComponent: sveltePagination } : {}),
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
      instances = undefined;
      extensions = undefined;
      grid = undefined;
    };
  });

  $: if (grid && columns !== previousColumns) {
    previousColumns = columns;
    grid.columns = columns;
  }
  $: if (grid && options !== previousOptions) {
    previousOptions = options;
    const paginationComponent = getPaginationComponent(options);
    grid.options = { ...options, ...(paginationComponent ? { customPaginationComponent: paginationComponent } : {}) };
  }
  $: if (grid && dataset !== previousDataset) {
    previousDataset = dataset;
    grid.dataset = dataset;
  }
  $: if (grid && datasetHierarchical !== previousHierarchical) {
    previousHierarchical = datasetHierarchical;
    grid.datasetHierarchical = datasetHierarchical;
  }
  $: if (grid && paginationOptions !== previousPagination) {
    previousPagination = paginationOptions;
    if (paginationOptions) {
      grid.paginationOptions = paginationOptions;
    }
  }
  $: if (grid && eventHandlers !== previousEvents) {
    previousEvents = eventHandlers;
    subscribeEvents(eventHandlers);
  }
</script>

<div id={'slickGridContainer-' + gridId} class={className} bind:this={container}>
  <slot name="header"></slot>
  <span bind:this={footerAnchor} hidden aria-hidden="true"></span>
  <slot name="footer"></slot>
</div>
