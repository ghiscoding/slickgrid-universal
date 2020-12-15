import { SlickGrid } from './slickGrid.interface';
import { ContainerService } from '../services';

export interface ExternalResource {
  /** Initialize the External Resource (Component or Service) */
  init: (grid: SlickGrid, container?: ContainerService) => void;

  /** Dispose method */
  dispose?: () => void;
}
