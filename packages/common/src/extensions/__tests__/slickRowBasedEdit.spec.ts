import type { Column, RowBasedEditOptions } from "../../interfaces/index";
import { SlickEvent, SlickGrid } from "../../core/index";
import { SlickRowBasedEdit } from "../slickRowBasedEdit";
import { GridService } from "../../services";

let addonOptions: RowBasedEditOptions = {
  actionsColumnLabel: "MyActions",
};

const mockColumns = [
  // The column definitions
  { name: "Short", field: "short", width: 100 },
  { name: "Medium", field: "medium", width: 100 },
  { name: "Long", field: "long", width: 100 },
  { name: "Mixed", field: "mixed", width: 100 },
  { name: "Long header creates tooltip", field: "header", width: 50 },
  {
    name: "Long header with predefined tooltip",
    field: "tooltipHeader",
    width: 50,
    toolTip: "Already have a tooltip!",
  },
] as Column[];

const gridStubBlueprint = {
  getData: jest.fn().mockReturnValue({
    getItemMetadata: jest.fn(),
  }),
  getCellNode: jest.fn(),
  getCellFromEvent: jest.fn(),
  getOptions: jest.fn(),
  registerPlugin: jest.fn(),
  onBeforeEditCell: new SlickEvent(),
  setColumns: jest.fn().mockImplementation((columns) => {
    (gridStubBlueprint as any).columns = columns;
  }),
  getColumns: jest
    .fn()
    .mockImplementation(() => (gridStubBlueprint as any).columns || []),
} as unknown as SlickGrid;

describe("Row Based Edit Plugin", () => {
  let plugin: SlickRowBasedEdit;
  let gridStub: SlickGrid;
  let gridService: GridService;

  beforeEach(() => {
    const _any = {} as any;
    gridStub = {
      ...(gridStubBlueprint as unknown as SlickGrid),
      columns: [...mockColumns],
    } as unknown as SlickGrid;
    gridService = new GridService(_any, _any, _any, _any, _any, _any, _any);
    plugin = new SlickRowBasedEdit(addonOptions);
  });

  afterEach(() => {
    plugin.destroy();
    plugin.dispose();
  });

  it("should create the plugin", () => {
    expect(plugin).toBeTruthy();
    expect(plugin.eventHandler).toBeTruthy();
  });

  it("should use default options when instantiating the plugin without passing any arguments", () => {
    plugin = new SlickRowBasedEdit();
    plugin.init(gridStub, gridService);

    expect(plugin.addonOptions).toEqual((plugin as any)._defaults);
  });

  it("should append a new column for actions using the defined column label", () => {
    plugin.init(gridStub, gridService);

    expect(gridStub.getColumns()[gridStub.getColumns().length - 1]).toMatchObject({
      id: "slick_rowbasededit_action",
      name: addonOptions.actionsColumnLabel
    });
  });
});
