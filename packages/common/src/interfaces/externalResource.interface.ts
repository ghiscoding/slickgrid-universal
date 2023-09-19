import type { SlickGridUniversal } from './index';
import type { ContainerService } from '../services/index';

export interface ExternalResource {
  /** optionally provide the Service class name of the resource to make it easier to find even with minified code */
  className?: string;

  /** Initialize the External Resource (Component or Service) */
  init?: (grid: SlickGridUniversal, container: ContainerService) => void;

  /** Dispose method */
  dispose?: () => void;
}
