import * as entry from './index';

describe('Testing library entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have all exported object defined', () => {
    expect(typeof entry.BindingHelper).toBe('function');
    expect(typeof entry.BindingService).toBe('function');
  });
});
