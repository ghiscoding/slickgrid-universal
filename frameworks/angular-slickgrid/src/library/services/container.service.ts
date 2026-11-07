import { Service } from '@angular/core';
import { MapContainerService } from '@slickgrid-universal/common';

@Service()
export class ContainerService extends MapContainerService {
  constructor() {
    super(false);
  }
}
