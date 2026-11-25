import type { BasePaginationComponent, PaginationService, SlickGrid, TranslaterService } from '@slickgrid-universal/common';
import type { BasePubSubService } from '@slickgrid-universal/event-pub-sub';
import { flushSync, mount, unmount, type Component } from 'svelte';

export interface SveltePaginationProps {
  grid: SlickGrid;
  paginationService: PaginationService;
  eventPubSubService: BasePubSubService;
  translaterService?: TranslaterService;
}

/** Adapt a Svelte component to SlickGrid's pagination lifecycle. */
export function createSveltePagination(component: Component<SveltePaginationProps>): typeof BasePaginationComponent {
  return class SveltePagination implements BasePaginationComponent {
    protected props!: SveltePaginationProps;
    protected instance?: Record<string, any>;
    protected target?: HTMLElement;

    init(
      grid: SlickGrid,
      paginationService: PaginationService,
      eventPubSubService: BasePubSubService,
      translaterService?: TranslaterService
    ): void {
      this.props = { grid, paginationService, eventPubSubService, translaterService };
    }

    renderPagination(container: HTMLElement): void {
      this.target = document.createElement('div');
      container.appendChild(this.target);
      this.instance = mount(component, { target: this.target, props: this.props });
      flushSync();
      this.instance.init?.(this.props.grid, this.props.paginationService, this.props.eventPubSubService, this.props.translaterService);
      this.instance.renderPagination?.(this.target);
    }

    dispose(): void {
      if (this.instance) {
        this.instance.dispose?.();
        void unmount(this.instance);
        this.instance = undefined;
      }
      this.target?.remove();
      this.target = undefined;
    }
  };
}
