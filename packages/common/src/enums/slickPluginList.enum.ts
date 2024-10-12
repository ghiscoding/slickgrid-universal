import type { ExtensionName } from '../enums/index.js';
import type { SlickEditorLock } from '../core/index.js';
import type { SlickRowDetailView } from '../interfaces/index.js';
import type {
  SlickAutoTooltip,
  SlickCellExcelCopyManager,
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickCheckboxSelectColumn,
  SlickColumnPicker,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowBasedEdit,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../extensions/index.js';

export type SlickPluginList =
  SlickAutoTooltip |
  SlickCellExcelCopyManager |
  SlickCellExternalCopyManager |
  SlickCellMenu |
  SlickCellRangeDecorator |
  SlickCellRangeSelector |
  SlickCellSelectionModel |
  SlickCheckboxSelectColumn |
  SlickContextMenu |
  SlickDraggableGrouping |
  SlickEditorLock |
  SlickGroupItemMetadataProvider |
  SlickHeaderButtons |
  SlickHeaderMenu |
  SlickRowBasedEdit |
  SlickRowDetailView |
  SlickRowMoveManager |
  SlickRowSelectionModel;

export type InferExtensionByName<T extends ExtensionName> =
  T extends ExtensionName.autoTooltip ? SlickAutoTooltip :
  T extends ExtensionName.cellExternalCopyManager ? SlickCellExcelCopyManager :
  T extends ExtensionName.cellMenu ? SlickCellMenu :
  T extends ExtensionName.columnPicker ? SlickColumnPicker :
  T extends ExtensionName.contextMenu ? SlickContextMenu :
  T extends ExtensionName.draggableGrouping ? SlickDraggableGrouping :
  T extends ExtensionName.gridMenu ? SlickGridMenu :
  T extends ExtensionName.groupItemMetaProvider ? SlickGroupItemMetadataProvider :
  T extends ExtensionName.headerButton ? SlickHeaderButtons :
  T extends ExtensionName.headerMenu ? SlickHeaderMenu :
  T extends ExtensionName.rowBasedEdit ? SlickRowBasedEdit :
  T extends ExtensionName.rowDetailView ? SlickRowDetailView :
  T extends ExtensionName.rowMoveManager ? SlickRowMoveManager :
  T extends ExtensionName.rowSelection ? SlickRowSelectionModel : any;
