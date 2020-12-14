import { ContainerService, SlickGrid, TextExportOption } from '@slickgrid-universal/common';
import { TextExportService as UniversalExportService } from '@slickgrid-universal/text-export';

export class TextExportService extends UniversalExportService {
  constructor() {
    super();
  }

  init(grid: SlickGrid, containerService: ContainerService): void {
    super.init(grid, containerService);
  }

  exportToFile(options: TextExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
