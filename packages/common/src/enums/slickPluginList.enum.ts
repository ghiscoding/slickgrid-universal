import type { SlickEditorLock } from '../core/index.js';
import type { ExtensionName } from '../enums/index.js';
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

export type InferExtensionByName<T extends ExtensionName> = T extends 'autoTooltip'
  ? SlickAutoTooltip
  : T extends 'cellExternalCopyManager'
    ? SlickCellExcelCopyManager
    : T extends 'cellMenu'
      ? SlickCellMenu
      : T extends 'columnPicker'
        ? SlickColumnPicker
        : T extends 'contextMenu'
          ? SlickContextMenu
          : T extends 'draggableGrouping'
            ? SlickDraggableGrouping
            : T extends 'gridMenu'
              ? SlickGridMenu
              : T extends 'groupItemMetaProvider'
                ? SlickGroupItemMetadataProvider
                : T extends 'headerButton'
                  ? SlickHeaderButtons
                  : T extends 'headerMenu'
                    ? SlickHeaderMenu
                    : T extends 'hybridSelection'
                      ? SlickHybridSelectionModel
                      : T extends 'rowBasedEdit'
                        ? SlickRowBasedEdit
                        : T extends 'rowDetailView'
                          ? SlickRowDetailView
                          : T extends 'rowMoveManager'
                            ? SlickRowMoveManager
                            : any;
