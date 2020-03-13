import * as entry from './index';

describe('Testing library entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have Enums object defined', () => {
    expect(typeof entry.Enums).toBe('object');
  });

  it('should have Global Grid Options defined', () => {
    expect(entry.GlobalGridOptions).toBeTruthy();
  });
});
