import type { ContainerService } from '../services/index';
import type { SlickGrid } from '../core/index';

export interface ExternalResource {
  /** optionally provide the Service class name of the resource to make it easier to find even with minified code */
  className?: string;

  /** Initialize the External Resource (Component or Service) */
  init?: (grid: SlickGrid, container: ContainerService) => void;

  /** Dispose method */
  dispose?: () => void;
}
