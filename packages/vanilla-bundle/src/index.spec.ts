import * as entry from './index';

describe('Testing library entry point', () => {
  it('should have an index entry point defined', () => {
    expect(entry).toBeTruthy();
  });

  it('should have all exported object defined', () => {
    expect(typeof entry.Slicker).toBe('object');
    expect(typeof entry.BindingService).toBe('function');
    expect(typeof entry.EventPubSubService).toBe('function');
    expect(typeof entry.Slicker.GridBundle).toBe('function');
    expect(typeof entry.Slicker.Aggregators).toBe('object');
    expect(typeof entry.Slicker.BindingService).toBe('function');
    expect(typeof entry.Slicker.Editors).toBe('object');
    expect(typeof entry.Slicker.Enums).toBe('object');
    expect(typeof entry.Slicker.Filters).toBe('object');
    expect(typeof entry.Slicker.Formatters).toBe('object');
    expect(typeof entry.Slicker.GroupTotalFormatters).toBe('object');
    expect(typeof entry.Slicker.SortComparers).toBe('object');
    expect(typeof entry.Slicker.Utilities).toBe('object');
    expect(typeof entry.SlickCompositeEditorComponent).toBe('function');
    expect(typeof entry.SlickEmptyWarningComponent).toBe('function');
    expect(typeof entry.SlickPaginationComponent).toBe('function');
    expect(typeof entry.SlickVanillaGridBundle).toBe('function');
    expect(typeof entry.Aggregators).toBe('object');
    expect(typeof entry.Editors).toBe('object');
    expect(typeof entry.Enums).toBe('object');
    expect(typeof entry.Filters).toBe('object');
    expect(typeof entry.Formatters).toBe('object');
    expect(typeof entry.GroupTotalFormatters).toBe('object');
    expect(typeof entry.SortComparers).toBe('object');
    expect(typeof entry.Utilities).toBe('object');
  });
});
