import { GroupItemMetadataProviderOption } from './groupItemMetadataProviderOption.interface';
import { ItemMetadata } from './itemMetaData.interface';
import { SlickGrid } from './slickGrid.interface';

/**
  * Provides item metadata for group (Slick.Group) and totals (Slick.Totals) rows produced by the DataView.
  * This metadata overrides the default behavior and formatting of those rows so that they appear and function
  * correctly when processed by the grid.
  *
  * This class also acts as a grid plugin providing event handlers to expand & collapse groups.
  * If "grid.registerPlugin(...)" is not called, expand & collapse will not work.
  *
  */
export interface SlickGroupItemMetadataProvider {

  /** Constructor of the Slick 3rd party plugin, it can optionally receive options */
  constructor: (options?: Partial<GroupItemMetadataProviderOption>) => void;

  /** Initialize the SlickGrid 3rd party plugin */
  init(grid: SlickGrid): void;

  /** Destroy (dispose) the SlickGrid 3rd party plugin */
  destroy(): void;

  /** Get the Group Row Metadata information */
  getGroupRowMetadata: (item: any) => ItemMetadata;

  /** Get the Totals Row Metadata information */
  getTotalsRowMetadata: (item: any) => Omit<ItemMetadata, 'columns'>;

  /** Get the options defined for the GroupItemMetadataProvider */
  getOptions: () => GroupItemMetadataProviderOption;

  /** Set new options for the GroupItemMetadataProvider */
  setOptions: (options?: GroupItemMetadataProviderOption) => void;
}
