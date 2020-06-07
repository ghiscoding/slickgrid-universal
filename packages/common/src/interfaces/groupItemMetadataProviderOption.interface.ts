import { FormatterResultObject } from './formatterResultObject.interface';

export interface GroupItemMetadataProviderOption {
  checkboxSelect: boolean;
  checkboxSelectCssClass: string;
  checkboxSelectPlugin: any; // TODO replace by SlickCheckboxSelect plugin
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
