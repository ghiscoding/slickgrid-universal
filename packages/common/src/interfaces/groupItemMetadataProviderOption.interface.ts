import { FormatterResultObject } from './formatterResultObject.interface';
import { SlickCheckboxSelectColumn } from './slickCheckboxSelectColumn.interface';

export interface GroupItemMetadataProviderOption {
  checkboxSelect: boolean;
  checkboxSelectCssClass: string;
  checkboxSelectPlugin: SlickCheckboxSelectColumn;
  groupCssClass: string;
  groupTitleCssClass: string;
  totalsCssClass: string;
  groupFocusable: boolean;
  totalsFocusable: boolean;
  toggleCssClass: string;
  toggleExpandedCssClass: string;
  toggleCollapsedCssClass: string;
  enableExpandCollapse: boolean;
  groupFormatter: HTMLElement,
  totalsFormatter: string | FormatterResultObject;
  includeHeaderTotals: boolean;
}
