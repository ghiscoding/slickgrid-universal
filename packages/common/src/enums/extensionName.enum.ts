/** @deprecated @use extension name type as string instead (ie: `ExtensionName.cellMenu` => 'cellMenu', `ExtensionName.draggableGrouping` => 'draggableGrouping') */
export enum ExtensionName {
  autoTooltip = 'autoTooltip',
  cellExternalCopyManager = 'cellExternalCopyManager',
  cellMenu = 'cellMenu',
  checkboxSelector = 'checkboxSelector',
  columnPicker = 'columnPicker',
  contextMenu = 'contextMenu',
  customTooltip = 'customTooltip',
  draggableGrouping = 'draggableGrouping',
  groupItemMetaProvider = 'groupItemMetaProvider',
  gridMenu = 'gridMenu',
  headerButton = 'headerButton',
  headerMenu = 'headerMenu',
  hybridSelection = 'hybridSelection',
  rowBasedEdit = 'rowBasedEdit',
  rowDetailView = 'rowDetailView',
  rowMoveManager = 'rowMoveManager',
}

/** List of available SlickGrid Extensions (Controls & Plugins) */
export type ExtensionNameTypeString =
  | 'autoTooltip'
  | 'cellExternalCopyManager'
  | 'cellMenu'
  | 'checkboxSelector'
  | 'columnPicker'
  | 'contextMenu'
  | 'customTooltip'
  | 'draggableGrouping'
  | 'groupItemMetaProvider'
  | 'gridMenu'
  | 'headerButton'
  | 'headerMenu'
  | 'hybridSelection'
  | 'rowBasedEdit'
  | 'rowDetailView'
  | 'rowMoveManager';
