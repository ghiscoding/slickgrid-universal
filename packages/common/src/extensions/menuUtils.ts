import type { MenuCommandItem, MenuDivider } from '../interfaces/menuCommandItem.interface.js';
import type { ExcelExportService } from '../services/excelExport.service.js';
import type { PdfExportService } from '../services/pdfExport.service.js';
import type { SharedService } from '../services/shared.service.js';
import type { TextExportService } from '../services/textExport.service.js';

export function commandMatcher<T extends Pick<MenuCommandItem, 'command'> = MenuCommandItem>(
  commands: string | readonly string[]
): (item: T | MenuDivider<any>) => item is T {
  return (item): item is T =>
    item !== 'divider' &&
    item.command !== undefined &&
    (typeof commands === 'string' ? item.command === commands : commands.includes(item.command));
}

/** Preserve the command list builder's existing input contract for object dividers. */
export function normalizeMenuCommandItems<T extends MenuCommandItem<any, any>>(items: Array<T | MenuDivider<any>>): Array<T | 'divider'> {
  return items.map((item) => (item !== 'divider' && item.command === undefined ? { ...item, command: '' } : item)) as Array<T | 'divider'>;
}

export function exportMenuResource(sharedService: SharedService, format: 'csv' | 'txt' | 'excel' | 'pdf', isContextMenu = false): void {
  const isText = format === 'csv' || format === 'txt';
  const serviceName = isText ? 'TextExportService' : format === 'excel' ? 'ExcelExportService' : 'PdfExportService';
  const service = sharedService?.externalRegisteredResources?.find((resource) => resource.pluginName === serviceName);

  if (isText && (service as TextExportService | undefined)?.exportToFile) {
    (service as TextExportService).exportToFile({ delimiter: format === 'csv' ? ',' : '\t', format });
  } else if (format === 'excel' && (service as ExcelExportService | undefined)?.exportToExcel) {
    (service as ExcelExportService).exportToExcel();
  } else if (format === 'pdf' && (service as PdfExportService | undefined)?.exportToPdf) {
    (service as PdfExportService).exportToPdf();
  } else {
    const menuName = isContextMenu ? 'Context Menu' : 'Grid Menu';
    const message = `[Slickgrid-Universal] Register ${serviceName} to export from the ${menuName}.`;
    if (isContextMenu) {
      throw new Error(message);
    }
    console.error(message);
  }
}
