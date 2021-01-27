import { AutoCompleteEditor, Column, ColumnEditor, Formatter, Formatters, SelectEditor, SlickGrid } from '@slickgrid-universal/common';

/**
 * Automatically add a Custom Formatter on all column definitions that have an Editor.
 * Instead of manually adding a Custom Formatter on every column definitions that are editables, let's ask the system to do it in an easier automated way.
 * It will loop through all column definitions and add an Custom Editor Formatter when necessary,
 * also note that if there's already a Formatter on the column definition it will automatically use the Formatters.multiple and add the custom formatter into the `params: formatters: {}}`
 */
export function autoAddEditorFormatterToColumnsWithEditor(columnDefinitions: Column[], customEditableFormatter: Formatter) {
  if (Array.isArray(columnDefinitions)) {
    for (const columnDef of columnDefinitions) {
      if (columnDef.editor) {
        if (columnDef.formatter && columnDef.formatter !== Formatters.multiple) {
          const prevFormatter = columnDef.formatter;
          columnDef.formatter = Formatters.multiple;
          columnDef.params = { ...columnDef.params, formatters: [prevFormatter, customEditableFormatter] };
        } else if (columnDef.formatter && columnDef.formatter === Formatters.multiple && columnDef.params) {
          columnDef.params.formatters = [...columnDef.params.formatters, customEditableFormatter];
        } else {
          columnDef.formatter = customEditableFormatter;
        }
      }
    }
  }
}

/** Load the Editor Collection asynchronously and replace the "collection" property when Promise resolves */
export function loadEditorCollectionAsync(column: Column, grid: SlickGrid) {
  const collectionAsync = (column?.editor as ColumnEditor).collectionAsync;
  (column?.editor as ColumnEditor).disabled = true; // disable the Editor DOM element, we'll re-enable it after receiving the collection with "updateEditorCollection()"

  if (collectionAsync) {
    // wait for the "collectionAsync", once resolved we will save it into the "collection"
    // the collectionAsync can be of 3 types HttpClient, HttpFetch or a Promise
    collectionAsync.then((response: any | any[]) => {
      if (Array.isArray(response)) {
        updateEditorCollection(column, response, grid); // from Promise
      } else if (response instanceof Response && typeof response.json === 'function') {
        if (response.bodyUsed) {
          console.warn(`[SlickGrid-Universal] The response body passed to collectionAsync was already read.`
            + `Either pass the dataset from the Response or clone the response first using response.clone()`);
        } else {
          // from Fetch
          (response as Response).json().then(data => updateEditorCollection(column, data, grid));
        }
      } else if (response && response['content']) {
        updateEditorCollection(column, response['content'], grid); // from http-client
      }
    });
  }
}

/**
 * For convenience to the user, we provide the property "editor" as an Slickgrid-Universal editor complex object
 * however "editor" is used internally by SlickGrid for it's own Editor Factory
 * so in our lib we will swap "editor" and copy it into a new property called "internalColumnEditor"
 * then take back "editor.model" and make it the new "editor" so that SlickGrid Editor Factory still works
 */
export function swapInternalEditorToSlickGridFactoryEditor(columnDefinitions: Column[], grid: SlickGrid) {
  const columns = Array.isArray(columnDefinitions) ? columnDefinitions : [];

  if (columns.some(col => `${col.id}`.includes('.'))) {
    console.error('[Slickgrid-Universal] Make sure that none of your Column Definition "id" property includes a dot in its name because that will cause some problems with the Editors. For example if your column definition "field" property is "user.firstName" then use "firstName" as the column "id".');
  }

  return columns.map((column: Column) => {
    // on every Editor that have a "collectionAsync", resolve the data and assign it to the "collection" property
    if (column.editor?.collectionAsync) {
      loadEditorCollectionAsync(column, grid);
    }

    // if there's already an internalColumnEditor we'll use it, else it would be inside the editor
    const columnEditor = column.internalColumnEditor || column.editor as ColumnEditor;

    return { ...column, editor: columnEditor?.model, internalColumnEditor: { ...columnEditor } };
  });
}

/**
 * Update the "internalColumnEditor.collection" property.
 * Since this is called after the async call resolves, the pointer will not be the same as the "column" argument passed.
 * Once we found the new pointer, we will reassign the "editor" and "collection" to the "internalColumnEditor" so it has newest collection
 */
export function updateEditorCollection<T = any>(column: Column<T>, newCollection: T[], grid: SlickGrid) {
  (column.editor as ColumnEditor).collection = newCollection;
  (column.editor as ColumnEditor).disabled = false;

  // find the new column reference pointer & re-assign the new editor to the internalColumnEditor
  const columns = grid.getColumns();
  if (Array.isArray(columns)) {
    const columnRef = columns.find((col: Column) => col.id === column.id);
    if (columnRef) {
      columnRef.internalColumnEditor = column.editor as ColumnEditor;
    }
  }

  // get current Editor, remove it from the DOm then re-enable it and re-render it with the new collection.
  const currentEditor = grid.getCellEditor() as AutoCompleteEditor | SelectEditor;
  if (currentEditor?.disable && currentEditor?.renderDomElement) {
    currentEditor.destroy();
    currentEditor.disable(false);
    currentEditor.renderDomElement(newCollection);
  }
}