import { SlickEditorLock } from '../interfaces/index';
import {
  SlickAutoTooltip,
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickCheckboxSelectColumn,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowDetailView,
  SlickRowMoveManager,
  SlickRowSelectionModel,
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
