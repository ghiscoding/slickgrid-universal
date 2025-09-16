import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest';

import type { Column } from '../../interfaces/index.js';
import { InputFilter } from '../inputFilter.js';
import { FilterFactory } from '../filterFactory.js';
import { SlickgridConfig } from '../../slickgrid-config.js';
import { CollectionService } from '../../services/collection.service.js';
import { RxJsResourceStub } from '../../../../../test/rxjsResourceStub.js';
import { TranslateServiceStub } from '../../../../../test/translateServiceStub.js';
import { AutocompleterFilter } from '../autocompleterFilter.js';

vi.mock('../autocompleterFilter');

(AutocompleterFilter as Mock).mockImplementation(function () {
  return {
    constructor: vi.fn(),
    init: vi.fn(),
    destroy: vi.fn(),
  };
});

describe('Filter Factory', () => {
  const Filters = {
    input: InputFilter,
    autocompleter: AutocompleterFilter,
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
    vi.clearAllMocks();
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

    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(AutocompleterFilter).toHaveBeenCalledWith(translateService, collectionService, undefined);
  });

  it('should create AutoComplete Filter with RxJS when that is the Filter provided as a model', () => {
    factory = new FilterFactory(slickgridConfig, translateService, collectionService, rxjsResourceStub);
    const mockColumn = { filter: { model: Filters.autocompleter } } as unknown as Column;

    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(AutocompleterFilter).toHaveBeenCalledWith(translateService, collectionService, rxjsResourceStub);
  });

  it('should create AutoComplete Filter with RxJS when that is the Filter provided as a model', () => {
    const mockColumn = { filter: { model: Filters.autocompleter } } as unknown as Column;

    factory.addRxJsResource(rxjsResourceStub);
    const newFilter = factory.createFilter(mockColumn.filter);

    expect(newFilter).toBeTruthy();
    expect(AutocompleterFilter).toHaveBeenCalledWith(translateService, collectionService, rxjsResourceStub);
  });
});
