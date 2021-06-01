import {
  SlickCellExternalCopyManager,
  SlickCellMenu,
  SlickCellRangeDecorator,
  SlickCellRangeSelector,
  SlickCellSelectionModel,
  SlickCheckboxSelectColumn,
  SlickContextMenu,
  SlickDraggableGrouping,
  SlickEditorLock,
  SlickGroupItemMetadataProvider,
  SlickHeaderButtons,
  SlickHeaderMenu,
  SlickRowDetailView,
  SlickRowMoveManager,
  SlickRowSelectionModel,
} from '../interfaces/index';
import { AutoTooltipsPlugin } from '../plugins/index';

export type SlickPluginList =
  AutoTooltipsPlugin |
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
