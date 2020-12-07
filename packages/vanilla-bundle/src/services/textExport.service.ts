import { SharedService, SlickGrid, TextExportOption } from '@slickgrid-universal/common';
import { TextExportService as UniversalExportService } from '@slickgrid-universal/text-export';

export class TextExportService extends UniversalExportService {
  constructor() {
    super();
  }

  init(grid: SlickGrid, sharedService: SharedService): void {
    super.init(grid, sharedService);
  }

  exportToFile(options: TextExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
