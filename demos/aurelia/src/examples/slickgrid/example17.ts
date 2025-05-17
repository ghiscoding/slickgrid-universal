import { type AureliaGridInstance, type Column, type GridOption, toCamelCase } from 'aurelia-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

const sampleDataRoot = 'assets/data';

export class Example17 {
  aureliaGrid!: AureliaGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  gridCreated = false;
  hideSubTitle = false;
  dataset: any[] = [];
  paginationPosition: 'bottom' | 'top' = 'top';
  templateUrl = `${sampleDataRoot}/users.csv`;
  uploadFileRef = '';

  aureliaGridReady(aureliaGrid: AureliaGridInstance) {
    this.aureliaGrid = aureliaGrid;
  }

  destroyGrid() {
    this.gridCreated = false;
  }

  handleFileImport(event: any) {
    const file: File = event.target.files[0];
    if (file.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const content = e.target.result;
        this.dynamicallyCreateGrid(content);
      };
      reader.readAsText(file);
    } else {
      alert('File must be a CSV file');
    }
  }

  handleDefaultCsv() {
    const staticDataCsv = `First Name,Last Name,Age,Type\nBob,Smith,33,Teacher\nJohn,Doe,20,Student\nJane,Doe,21,Student`;
    this.dynamicallyCreateGrid(staticDataCsv);
    this.uploadFileRef = '';
  }

  dynamicallyCreateGrid(csvContent: string) {
    // dispose of any previous grid before creating a new one
    this.gridCreated = false;

    const dataRows = csvContent?.split('\n');
    const colDefs: Column[] = [];
    const outputData: any[] = [];

    // create column definitions
    dataRows.forEach((dataRow, rowIndex) => {
      const cellValues = dataRow.split(',');
      const dataEntryObj: any = {};

      if (rowIndex === 0) {
        // the 1st row is considered to be the header titles, we can create the column definitions from it
        for (const cellVal of cellValues) {
          const camelFieldName = toCamelCase(cellVal);
          colDefs.push({
            id: camelFieldName,
            name: cellVal,
            field: camelFieldName,
            filterable: true,
            sortable: true,
          });
        }
      } else {
        // at this point all column defs were created and we can loop through them and
        // we can now start adding data as an object and then simply push it to the dataset array
        cellValues.forEach((cellVal, colIndex) => {
          dataEntryObj[colDefs[colIndex].id] = cellVal;
        });

        // a unique "id" must be provided, if not found then use the row index and push it to the dataset
        if ('id' in dataEntryObj) {
          outputData.push(dataEntryObj);
        } else {
          outputData.push({ ...dataEntryObj, id: rowIndex });
        }
      }
    });

    this.gridOptions = {
      gridHeight: 300,
      gridWidth: 800,
      enableFiltering: true,
      enableExcelExport: true,
      externalResources: [new ExcelExportService()],
      headerRowHeight: 35,
      rowHeight: 33,
    };

    this.dataset = outputData;
    this.columnDefinitions = colDefs;
    console.log(this.columnDefinitions, this.dataset);
    this.gridCreated = true;
  }

  toggleSubTitle() {
    this.hideSubTitle = !this.hideSubTitle;
    const action = this.hideSubTitle ? 'add' : 'remove';
    document.querySelector('.subtitle')?.classList[action]('hidden');
    this.aureliaGrid.resizerService.resizeGrid(0);
  }
}
