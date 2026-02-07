import type { SlickGrid } from '../core/index.js';
import type { ContainerService } from '../services/index.js';
import type { Column } from './column.interface.js';
import type { GridOption } from './gridOption.interface.js';

export interface ExternalResource {
  /** optionally provide the Service plugin name of the resource to make it easier to find even with minified code */
  pluginName: string;

  /** Initialize the External Resource (Component or Service) */
  init?: (grid: SlickGrid, container: ContainerService) => void;

  /** optionally Create the plugin before the Grid creation to avoid having odd behaviors. */
  create?: (columns: Column[], gridOptions: GridOption) => void;

  /** Dispose method */
  dispose?: () => void;
}

export interface ExternalResourceConstructor {
  /** optionally provide the Service plugin name of the resource to make it easier to find even with minified code */
  pluginName: string;

  new (...args: any[]): ExternalResource;
}
