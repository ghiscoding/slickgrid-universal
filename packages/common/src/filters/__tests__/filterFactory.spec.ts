import type { Column } from '../../interfaces/index';
import { InputFilter } from '../inputFilter';
import { FilterFactory } from '../filterFactory';
import { SlickgridConfig } from '../../slickgrid-config';
import { CollectionService } from '../../services/collection.service';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub';
import type { AutocompleterFilter } from '../autocompleterFilter';

const mockAutocompleterFilter = jest.fn().mockImplementation(() => ({
  constructor: jest.fn(),
  init: jest.fn(),
  destroy: jest.fn(),
} as unknown as AutocompleterFilter));

describe('Filter Factory', () => {
  jest.mock('../autocompleterFilter', () => mockAutocompleterFilter);
  const Filters = {
    input: InputFilter,
    autocompleter: mockAutocompleterFilter
  };
  let factory: FilterFactory;
  let collectionService: CollectionService;
  let slickgridConfig: SlickgridConfig;
  let rxjsResourceStub: RxJsResourceStub;
  let translateService: TranslateServiceStub;

  beforeEach(() => {
    translateService = new TranslateServiceStub();
    collectionService = new CollectionService(translateService);
    rxjsResourceStub = new RxJsResourceStub();
    slickgridConfig = new SlickgridConfig();
    slickgridConfig.options.defaultFilter = Filters.input;
    factory = new FilterFactory(slickgridConfig, translateService, collectionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create the factory', () => {
    expect(factory).toBeTruthy();
  });

  it('should create default Filter when no argument provided', () => {
    const newFilter = factory.createFilter();
    expect(newFilter).toEqual(new Filters.input(translateService));
  });

  it('should create AutoComplete Filter when that is the Filter provided as a model', () => {
    const mockColumn = { filter: { model: Filters.autocompleter } } as unknown as Column;
    const filterSpy = jest.spyOn(mockAutocompleterFilter.prototype, 'constructor');

    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(filterSpy).toHaveBeenCalledWith(translateService, collectionService, undefined);
  });

  it('should create AutoComplete Filter with RxJS when that is the Filter provided as a model', () => {
    factory = new FilterFactory(slickgridConfig, translateService, collectionService, rxjsResourceStub);
    const mockColumn = { filter: { model: Filters.autocompleter } } as unknown as Column;
    const filterSpy = jest.spyOn(mockAutocompleterFilter.prototype, 'constructor');

    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(filterSpy).toHaveBeenCalledWith(translateService, collectionService, rxjsResourceStub);
  });

  it('should create AutoComplete Filter with RxJS when that is the Filter provided as a model', () => {
    const mockColumn = { filter: { model: Filters.autocompleter } } as unknown as Column;
    const filterSpy = jest.spyOn(mockAutocompleterFilter.prototype, 'constructor');

    factory.addRxJsResource(rxjsResourceStub);
    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(filterSpy).toHaveBeenCalledWith(translateService, collectionService, rxjsResourceStub);
  });
});