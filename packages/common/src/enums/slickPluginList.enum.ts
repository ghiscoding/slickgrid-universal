import type { SlickEditorLock } from '../core/index.js';
import type { ExtensionName, ExtensionNameTypeString } from '../enums/index.js';
import type {
  SlickAutoTooltip,
  SlickCellExcelCopyManager,
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCheckboxSelectColumn,
  SlickColumnPicker,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGridMenu,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickHybridSelectionModel,
  SlickRowBasedEdit,
  SlickRowMoveManager,
} from '../extensions/index.js';
import type { SlickRowDetailView } from '../interfaces/index.js';

export type SlickPluginList =
  | SlickAutoTooltip
  | SlickCellExcelCopyManager
  | SlickCellExternalCopyManager
  | SlickCellMenu
  | SlickCellRangeDecorator
  | SlickCellRangeSelector
  | SlickCheckboxSelectColumn
  | SlickContextMenu
  | SlickDraggableGrouping
  | SlickEditorLock
  | SlickGroupItemMetadataProvider
  | SlickHeaderButtons
  | SlickHeaderMenu
  | SlickHybridSelectionModel
  | SlickRowBasedEdit
  | SlickRowDetailView
  | SlickRowMoveManager;

export type InferExtensionByName<T extends ExtensionName | ExtensionNameTypeString> = T extends ExtensionName.autoTooltip
  ? SlickAutoTooltip
  : T extends ExtensionName.cellExternalCopyManager
    ? SlickCellExcelCopyManager
    : T extends ExtensionName.cellMenu
      ? SlickCellMenu
      : T extends ExtensionName.columnPicker
        ? SlickColumnPicker
        : T extends ExtensionName.contextMenu
          ? SlickContextMenu
          : T extends ExtensionName.draggableGrouping
            ? SlickDraggableGrouping
            : T extends ExtensionName.gridMenu
              ? SlickGridMenu
              : T extends ExtensionName.groupItemMetaProvider
                ? SlickGroupItemMetadataProvider
                : T extends ExtensionName.headerButton
                  ? SlickHeaderButtons
                  : T extends ExtensionName.headerMenu
                    ? SlickHeaderMenu
                    : T extends ExtensionName.hybridSelection
                      ? SlickHybridSelectionModel
                      : T extends ExtensionName.rowBasedEdit
                        ? SlickRowBasedEdit
                        : T extends ExtensionName.rowDetailView
                          ? SlickRowDetailView
                          : T extends ExtensionName.rowMoveManager
                            ? SlickRowMoveManager
                            : any;
