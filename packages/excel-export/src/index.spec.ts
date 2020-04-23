import * as entry from './index';
import * as interfaceEntry from './interfaces/index';

describe('Testing Export Package entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have Service defined', () => {
    expect(typeof entry.ExcelExportService).toBeTruthy();
  });

  it('should have an Interfaces index entry point defined', () => {
    expect(interfaceEntry).toBeTruthy();
  });
});
