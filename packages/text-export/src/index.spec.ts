import * as entry from './index';

describe('Testing Export Package entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have Service defined', () => {
    expect(typeof entry.TextExportService).toBeTruthy();
  });
});
