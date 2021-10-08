import {
  SlickCheckboxSelectColumn,
  SlickEditorLock,
  SlickGroupItemMetadataProvider,
  SlickRowDetailView,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../interfaces/index';
import {
  SlickAutoTooltip,
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickHeaderButtons,
  SlickHeaderMenu,
} from '../plugins/index';

export type SlickPluginList =
  SlickAutoTooltip |
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
  SlickRowDetailView |
  SlickRowMoveManager |
  SlickRowSelectionModel;
