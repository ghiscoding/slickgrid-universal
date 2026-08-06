import type { EditorArguments } from '@slickgrid-universal/common';
import { describe, expect, it, vi } from 'vitest';
import { FormulaCellEditor } from './formula.cellEditor.js';

describe('FormulaCellEditor', () => {
  it('should keep editor open and suppress grid click after selecting a reference cell', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    const gridCell = document.createElement('div');
    gridCell.className = 'slick-cell';
    gridContainer.appendChild(gridCell);
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 2 }),
      getCellFromEvent: (event: MouseEvent) => (gridContainer.contains(event.target as Node) ? { row: 1, cell: 2 } : null),
      getColumns: () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { debug: false } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=C1*D1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Place caret inside C1 so the clicked cell replaces C1.
    (editor as any).restoreCaretOffset(2);

    let wasGridClickHandled = false;
    gridContainer.addEventListener('click', () => {
      wasGridClickHandled = true;
      editor.destroy();
    });

    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    gridCell.dispatchEvent(mouseDownEvent);
    expect(mouseDownEvent.defaultPrevented).toBe(true);
    expect(editor.serializeValue()).toBe('=C2*D1');

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 });
    gridCell.dispatchEvent(mouseUpEvent);
    expect(mouseUpEvent.defaultPrevented).toBe(true);

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
    gridCell.dispatchEvent(clickEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(wasGridClickHandled).toBe(false);
    expect((editor as any)._editorElm.isConnected).toBe(true);

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should highlight range under caret and rewrite that range through grid drag selection', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const columnIds = ['a', 'b', 'c', 'd', 'e'];
    const cellMap = new Map<HTMLElement, { row: number; cell: number }>();

    const startCellElm = document.createElement('div');
    startCellElm.className = 'slick-cell';
    gridContainer.appendChild(startCellElm);
    cellMap.set(startCellElm, { row: 0, cell: 4 });

    const endCellElm = document.createElement('div');
    endCellElm.className = 'slick-cell';
    gridContainer.appendChild(endCellElm);
    cellMap.set(endCellElm, { row: 2, cell: 4 });

    const setCellCssStylesCalls: Array<Record<number, Record<string | number, string>>> = [];
    const selectionRangesCalls: Array<Array<{ fromRow: number; fromCell: number; toRow: number; toCell: number }>> = [];
    const selectionModelStub = {
      setSelectedRanges: (ranges: Array<{ fromRow: number; fromCell: number; toRow: number; toCell: number }>) => {
        selectionRangesCalls.push(ranges);
      },
    };

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 3 }),
      getCellFromEvent: (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        return target ? (cellMap.get(target) ?? null) : null;
      },
      getColumns: () => columnIds.map((id) => ({ id })),
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      getSelectionModel: () => selectionModelStub,
      removeCellCssStyles: () => undefined,
      setCellCssStyles: (_key: string, hash: Record<number, Record<string | number, string>>) => {
        setCellCssStylesCalls.push(hash);
      },
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { debug: false } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=SUM(D1:D2)' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Place caret in D1:D2 token and trigger caret-sync highlight.
    (editor as any).restoreCaretOffset(7);
    (editor as any)._editorElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    const initialSelectionRange = selectionRangesCalls.at(-1)?.[0];
    expect(initialSelectionRange).toMatchObject({ fromRow: 0, fromCell: 3, toRow: 1, toCell: 3 });
    expect(setCellCssStylesCalls).toHaveLength(0);

    const mouseDownEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    startCellElm.dispatchEvent(mouseDownEvent);
    expect(mouseDownEvent.defaultPrevented).toBe(true);

    const mouseMoveEvent = new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0 });
    endCellElm.dispatchEvent(mouseMoveEvent);
    expect(mouseMoveEvent.defaultPrevented).toBe(true);

    const mouseUpEvent = new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 });
    endCellElm.dispatchEvent(mouseUpEvent);
    expect(mouseUpEvent.defaultPrevented).toBe(true);
    expect(editor.serializeValue()).toBe('=SUM(E1:E3)');

    const updatedSelectionRange = selectionRangesCalls.at(-1)?.[0];
    expect(updatedSelectionRange).toMatchObject({ fromRow: 0, fromCell: 4, toRow: 2, toCell: 4 });

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should keep existing range anchor when dragging from range endpoint to expand selection', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const cellMap = new Map<HTMLElement, { row: number; cell: number }>();

    const rangeEndCellElm = document.createElement('div');
    rangeEndCellElm.className = 'slick-cell';
    gridContainer.appendChild(rangeEndCellElm);
    cellMap.set(rangeEndCellElm, { row: 2, cell: 3 }); // D3

    const dragEndCellElm = document.createElement('div');
    dragEndCellElm.className = 'slick-cell';
    gridContainer.appendChild(dragEndCellElm);
    cellMap.set(dragEndCellElm, { row: 5, cell: 3 }); // D6

    const selectionRangesCalls: Array<Array<{ fromRow: number; fromCell: number; toRow: number; toCell: number }>> = [];
    const selectionModelStub = {
      setSelectedRanges: (ranges: Array<{ fromRow: number; fromCell: number; toRow: number; toCell: number }>) => {
        selectionRangesCalls.push(ranges);
      },
    };

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 3 }),
      getCellFromEvent: (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        return target ? (cellMap.get(target) ?? null) : null;
      },
      getColumns: () => ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id })),
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      getSelectionModel: () => selectionModelStub,
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { debug: false } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=SUM(D1:D3)' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Place caret in D1:D3 token so it is selected as the editable reference range.
    (editor as any).restoreCaretOffset(7);
    (editor as any)._editorElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    rangeEndCellElm.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    dragEndCellElm.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0 }));
    dragEndCellElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));

    expect(editor.serializeValue()).toBe('=SUM(D1:D6)');
    expect(editor.serializeValue().startsWith('=')).toBe(true);

    const updatedSelectionRange = selectionRangesCalls.at(-1)?.[0];
    expect(updatedSelectionRange).toMatchObject({ fromRow: 0, fromCell: 3, toRow: 5, toCell: 3 });

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should keep Ctrl+A in editor and not bubble to grid keyboard handlers', () => {
    const gridContainer = document.createElement('div');
    const hostContainer = document.createElement('div');
    gridContainer.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    let gridKeydownCount = 0;
    gridContainer.addEventListener('keydown', () => {
      gridKeydownCount++;
    });

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { debug: false } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=C1*D1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    const keydownEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'a',
      ctrlKey: true,
    });
    (editor as any)._editorElm.dispatchEvent(keydownEvent);

    expect(gridKeydownCount).toBe(0);
    expect(keydownEvent.defaultPrevented).toBe(false);

    editor.destroy();
    gridContainer.remove();
  });

  it('should append a second grid reference after an operator instead of replacing the first argument', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const cellMap = new Map<HTMLElement, { row: number; cell: number }>();
    const c1CellElm = document.createElement('div');
    c1CellElm.className = 'slick-cell';
    gridContainer.appendChild(c1CellElm);
    cellMap.set(c1CellElm, { row: 0, cell: 2 });

    const d1CellElm = document.createElement('div');
    d1CellElm.className = 'slick-cell';
    gridContainer.appendChild(d1CellElm);
    cellMap.set(d1CellElm, { row: 0, cell: 3 });

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: (event: MouseEvent) => {
        const target = event.target as HTMLElement | null;
        return target ? (cellMap.get(target) ?? null) : null;
      },
      getColumns: () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=SUM(' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);
    (editor as any).restoreCaretOffset(5);

    c1CellElm.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    c1CellElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
    c1CellElm.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));
    expect(editor.serializeValue()).toBe('=SUM(C1');

    (editor as any)._editorElm.textContent = '=SUM(C1*';
    (editor as any).restoreCaretOffset(8);
    (editor as any)._editorElm.dispatchEvent(new Event('input', { bubbles: true }));
    expect(editor.serializeValue()).toBe('=SUM(C1*');

    d1CellElm.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    d1CellElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
    d1CellElm.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 }));

    expect(editor.serializeValue()).toBe('=SUM(C1*D1');

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should provide autocomplete suggestions and insert selected function on Enter', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM', 'SUMIF'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    (editor as any)._editorElm.textContent = '=su';
    (editor as any).restoreCaretOffset(3);
    (editor as any).handleInput();

    expect((editor as any)._autocompleteItems).toEqual(['SUM', 'SUMIF']);
    expect((editor as any)._autocompleteElm?.style.display).toBe('block');

    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));

    expect(editor.serializeValue()).toBe('=SUMIF(');
    expect((editor as any)._autocompleteItems).toHaveLength(0);

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should fallback to cell-css highlighting when no selection model is available', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const setCellCssStylesSpy = vi.fn();
    const removeCellCssStylesSpy = vi.fn();
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: removeCellCssStylesSpy,
      setCellCssStyles: setCellCssStylesSpy,
      getSelectionModel: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=SUM(B1:C2)' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);
    (editor as any).restoreCaretOffset(8);
    (editor as any)._editorElm.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));

    expect(setCellCssStylesSpy).toHaveBeenCalledTimes(1);
    const cssHash = setCellCssStylesSpy.mock.calls[0][1] as Record<number, Record<string, string>>;
    expect(cssHash[0].b).toBe('formula-ref-cell-color-1');
    expect(cssHash[0].c).toBe('formula-ref-cell-color-1');
    expect(cssHash[1].b).toBe('formula-ref-cell-color-1');
    expect(cssHash[1].c).toBe('formula-ref-cell-color-1');
    expect(removeCellCssStylesSpy).not.toHaveBeenCalled();

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should handle autocomplete selection edge cases safely', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // guard branch when menu element is absent
    (editor as any)._autocompleteElm = undefined;
    (editor as any)._autocompleteItems = ['SUM'];
    (editor as any).renderAutocompleteItems();

    (editor as any)._editorElm.textContent = '=A1+1';
    (editor as any).restoreCaretOffset(5);
    const beforeInvalid = editor.serializeValue();
    (editor as any).selectAutocompleteItem();
    (editor as any).selectAutocompleteItem('SUM');
    expect(editor.serializeValue()).toBe(beforeInvalid);

    (editor as any)._editorElm.textContent = '=zz';
    (editor as any).restoreCaretOffset(3);
    (editor as any).handleInput();
    expect((editor as any)._autocompleteItems).toHaveLength(0);

    (editor as any).ensureAutocompleteElement();
    const existingAutocompleteElm = (editor as any)._autocompleteElm;
    (editor as any).ensureAutocompleteElement();
    expect((editor as any)._autocompleteElm).toBe(existingAutocompleteElm);

    (editor as any)._autocompleteElm = undefined;
    (editor as any).positionAutocomplete();

    (editor as any)._editorElm.textContent = '=su   (A1)';
    (editor as any).restoreCaretOffset(3);
    (editor as any).handleInput();
    const firstOption = (editor as any)._autocompleteElm?.querySelector('div') as HTMLDivElement;
    firstOption.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    expect(editor.serializeValue()).toBe('=SUM   (A1)');

    (editor as any)._editorElm.textContent = '=su   (A1)';
    (editor as any).restoreCaretOffset(3);
    (editor as any).selectAutocompleteItem('SUM');
    expect(editor.serializeValue()).toBe('=SUM   (A1)');

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });
});
