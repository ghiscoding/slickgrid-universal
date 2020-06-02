import { ExportOption, SharedService, SlickGrid } from '@slickgrid-universal/common';
import { FileExportService as UniversalExportService } from '@slickgrid-universal/file-export';

export class FileExportService extends UniversalExportService {
  constructor() {
    super();
  }

  init(grid: SlickGrid, sharedService: SharedService): void {
    super.init(grid, sharedService);
  }

  exportToFile(options: ExportOption): Promise<boolean> {
    return super.exportToFile(options);
  }
}
