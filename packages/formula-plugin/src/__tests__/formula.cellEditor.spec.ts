import type { EditorArguments } from '@slickgrid-universal/common';
import { describe, expect, it, vi } from 'vitest';
import { FormulaCellEditor } from '../formula.cellEditor.js';

describe('FormulaCellEditor', () => {
  it('should move Home and End across token spans', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
    } as any;

    const editor = new FormulaCellEditor({
      column: { field: 'total' },
      container: hostContainer,
      grid: gridStub,
      item: { total: '=C1*SUM(D1:D5)+C2' },
    } as any);
    editor.loadValue({ total: '=C1*SUM(D1:D5)+C2' });

    (editor as any).restoreCaretOffset(2);
    const homeEvent = new KeyboardEvent('keydown', { key: 'Home', cancelable: true });
    (editor as any).handleKeydown(homeEvent);
    expect(homeEvent.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe((editor as any)._editorElm);
    expect((editor as any).getCaretOffset()).toBe(0);

    const endEvent = new KeyboardEvent('keydown', { key: 'End', cancelable: true });
    (editor as any).handleKeydown(endEvent);
    expect(endEvent.defaultPrevented).toBe(true);
    expect((editor as any).getCaretOffset()).toBe('=C1*SUM(D1:D5)+C2'.length);

    (editor as any).moveCaretToOffset(0);
    const rightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, cancelable: true });
    (editor as any).handleKeydown(rightEvent);
    expect(rightEvent.defaultPrevented).toBe(true);
    expect((editor as any).getCaretOffset()).toBe('=C1'.length);

    const secondRightEvent = new KeyboardEvent('keydown', { key: 'ArrowRight', ctrlKey: true, cancelable: true });
    (editor as any).handleKeydown(secondRightEvent);
    expect((editor as any).getCaretOffset()).toBe('=C1*SUM(D1:D5'.length);

    const leftEvent = new KeyboardEvent('keydown', { key: 'ArrowLeft', ctrlKey: true, cancelable: true });
    (editor as any).handleKeydown(leftEvent);
    expect(leftEvent.defaultPrevented).toBe(true);
    expect((editor as any).getCaretOffset()).toBe('=C1*SUM('.length);

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should display stable references as A1 while serializing the stable form', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const item = { id: 'a_01', total: '=REF(COLUMN("price"),ROW("a_01"))*REF(COLUMN("quantity"),ROW("a_01"))' };
    const committed = vi.fn();
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 2 }),
      getColumns: () => [{ id: 'price' }, { id: 'quantity' }, { id: 'total' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
    } as any;

    const args = {
      column: {
        field: 'total',
        editor: {
          params: {
            toDisplayFormula: (formula: string) =>
              formula.replace(/REF\(COLUMN\("price"\),ROW\("a_01"\)\)/g, 'A1').replace(/REF\(COLUMN\("quantity"\),ROW\("a_01"\)\)/g, 'B1'),
            toStoredFormula: (formula: string) =>
              formula.replace('A1', 'REF(COLUMN("price"),ROW("a_01"))').replace('B1', 'REF(COLUMN("quantity"),ROW("a_01"))'),
            onFormulaCommit: committed,
          },
        },
      },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item,
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue(item);

    expect(editor.serializeValue()).toBe(item.total);
    expect((editor as any)._editorElm.textContent).toBe('=A1*B1');

    editor.applyValue(item, editor.serializeValue());
    expect(committed).toHaveBeenCalledWith(item.total, item);

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should assign a __proto__ field as an own data property', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({}),
    } as any;
    const item: Record<string, unknown> = { id: 'row-1' };
    const editor = new FormulaCellEditor({
      column: { field: '__proto__', editor: { params: {} } },
      container: hostContainer,
      grid: gridStub,
      item,
    } as any);

    editor.applyValue(item, '=1');

    expect(Object.prototype.hasOwnProperty.call(item, '__proto__')).toBe(true);
    expect(item.__proto__).toBe('=1');
    expect(Object.getPrototypeOf(item)).toBe(Object.prototype);
    editor.destroy();
  });

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

    const initialSelectionRange = selectionRangesCalls[selectionRangesCalls.length - 1]?.[0];
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

    const updatedSelectionRange = selectionRangesCalls[selectionRangesCalls.length - 1]?.[0];
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

    const updatedSelectionRange = selectionRangesCalls[selectionRangesCalls.length - 1]?.[0];
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
    (editor as any)._referenceEditRange = undefined;
    expect((editor as any).resolveReferenceEditRangeForGridSelection()).toEqual({ start: 5, end: 5 });
    vi.spyOn(editor as any, 'resolveReferenceEditRangeForGridSelection').mockReturnValue(undefined);

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
    // Call handleInput directly to simulate user typing, which applies colors
    (editor as any).handleInput();

    expect(setCellCssStylesSpy).toHaveBeenCalledTimes(1);
    const cssHash = setCellCssStylesSpy.mock.calls[0][1] as Record<number, Record<string, string>>;
    expect(cssHash[0].b).toBe('formula-cell-color-1');
    expect(cssHash[0].c).toBe('formula-cell-color-1');
    expect(cssHash[1].b).toBe('formula-cell-color-1');
    expect(cssHash[1].c).toBe('formula-cell-color-1');
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

  it('should not apply persistent cell colors on initial load', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const setCellCssStylesSpy = vi.fn();
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
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

    expect(setCellCssStylesSpy).not.toHaveBeenCalled();

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should copy and cut plain text from editor DOM on Ctrl+C/Ctrl+X', async () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const writeTextSpy = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextSpy },
      configurable: true,
    });

    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: () => undefined,
      setCellCssStyles: () => undefined,
      getSelectionModel: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    (editor as any)._editorElm.textContent = '=SUM(A1\u00a0+\u00a0B1)';
    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true }));

    expect(writeTextSpy).toHaveBeenNthCalledWith(1, '=SUM(A1 + B1)');
    expect((editor as any)._editorElm.textContent).toBe('=SUM(A1\u00a0+\u00a0B1)');

    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true, cancelable: true }));

    expect(writeTextSpy).toHaveBeenNthCalledWith(2, '=SUM(A1 + B1)');
    expect(editor.serializeValue()).toBe('');

    writeTextSpy.mockRejectedValueOnce(new Error('clipboard unavailable'));
    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true, cancelable: true }));
    writeTextSpy.mockRejectedValueOnce(new Error('clipboard unavailable'));
    (editor as any)._editorElm.dispatchEvent(new KeyboardEvent('keydown', { key: 'x', ctrlKey: true, bubbles: true, cancelable: true }));

    await Promise.resolve();

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should use live editor DOM text when selecting autocomplete item', () => {
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
      item: { total: '=A1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Keep stale internal value to ensure selection logic reads from DOM textContent.
    (editor as any)._plainTextValue = '=A1';
    (editor as any)._editorElm.textContent = '=su';
    (editor as any).restoreCaretOffset(3);
    (editor as any).selectAutocompleteItem('SUM');

    expect(editor.serializeValue()).toBe('=SUM(');

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should replace typed function name at caret in middle of formula and preserve surrounding text', () => {
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
      item: { total: '=A1+B1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Keep stale internal value to ensure replacement is driven by current DOM text.
    (editor as any)._plainTextValue = '=A1+OLD(B1)+C1';
    (editor as any)._editorElm.textContent = '=A1+su(B1)+C1';
    (editor as any).restoreCaretOffset(6); // right after "su"
    (editor as any).selectAutocompleteItem('SUM');

    expect(editor.serializeValue()).toBe('=A1+SUM(B1)+C1');

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should not remove selection highlight style when no selection highlight is active', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.appendChild(hostContainer);
    document.body.appendChild(gridContainer);

    const removeCellCssStylesSpy = vi.fn();
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => true }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      removeCellCssStyles: removeCellCssStylesSpy,
      setCellCssStyles: () => undefined,
      getSelectionModel: () => undefined,
    } as any;

    const args = {
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: () => undefined,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;

    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    (editor as any)._isSelectionModelHighlightActive = false;
    (editor as any).clearReferenceSelectionHighlight();

    expect(removeCellCssStylesSpy).not.toHaveBeenCalledWith('formula-editor-grid-sel-highlight');

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should cover persistent color cleanup, selection color fallback, and caret guards', () => {
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.append(hostContainer, gridContainer);
    const removeCellCssStylesSpy = vi.fn();
    const setCellCssStylesSpy = vi.fn();
    const gridStub = {
      focus: () => undefined,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }, { id: 'b' }],
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
      item: { total: '=A1' },
      cancelChanges: () => undefined,
    } as unknown as EditorArguments;
    const editor = new FormulaCellEditor(args);
    editor.loadValue((args as any).item);

    // Reapply colors after an existing cache so both cleanup paths are exercised.
    (editor as any)._editorElm.textContent = '=B1';
    (editor as any).handleInput();
    (editor as any)._editorElm.textContent = '=1';
    (editor as any).handleInput();
    (editor as any)._editorElm.textContent = '=A1';
    (editor as any).handleInput();

    expect((editor as any).getColorForSelectedCells({ row: 0, cell: 0 }, { row: 0, cell: 0 })).toBe('formula-cell-color-1');
    (editor as any)._editorElm.textContent = '=Z1';
    (editor as any).handleInput();
    (editor as any)._plainTextValue = '=A1';
    expect((editor as any).getColorForSelectedCells({ row: 8, cell: 8 }, { row: 8, cell: 8 })).toBe('formula-cell-color-1');
    (editor as any)._plainTextValue = 'plain text';
    expect((editor as any).getColorForSelectedCells({ row: 8, cell: 8 }, { row: 8, cell: 8 })).toBe('formula-cell-color-1');

    expect((editor as any).parseExcelReferenceCellRange('')).toBeUndefined();
    expect((editor as any).parseExcelReferenceCellRange('A0')).toBeUndefined();
    expect((editor as any).parseExcelReferenceCellRange('A1:B')).toBeUndefined();
    (editor as any)._plainTextValue = '=A1';
    (editor as any)._editorElm.textContent = '=A1';
    (editor as any).restoreCaretOffset(3);
    expect((editor as any).getReferenceTokenRangeAtCaret()).toEqual({ start: 1, end: 3 });
    expect((editor as any).resolveReferenceEditRangeForGridSelection()).toEqual({ start: 1, end: 3 });
    (editor as any)._referenceEditRange = { start: 0, end: 0 };
    expect((editor as any).resolveReferenceEditRangeForGridSelection()).toEqual({ start: 1, end: 3 });
    (editor as any)._plainTextValue = 'plain';
    (editor as any)._editorElm.textContent = 'plain';
    (editor as any).restoreCaretOffset(5);
    expect((editor as any).shouldInsertReferenceAtCaret()).toBe(false);
    expect((editor as any).getSingleReferenceTokenRangeOrUndefined()).toBeUndefined();
    (editor as any)._plainTextValue = '=A1+B1';
    (editor as any)._editorElm.textContent = '=A1+B1';
    expect((editor as any).getSingleReferenceTokenRangeOrUndefined()).toBeUndefined();
    (editor as any)._plainTextValue = '=A1';
    (editor as any)._editorElm.textContent = '=A1';
    (editor as any).restoreCaretOffset(1);
    expect((editor as any).shouldInsertReferenceAtCaret()).toBe(true);
    expect((editor as any).getSingleReferenceTokenRangeOrUndefined()).toEqual({ start: 1, end: 3 });
    (editor as any)._plainTextValue = '=   ';
    (editor as any)._editorElm.textContent = '=   ';
    (editor as any).restoreCaretOffset(4);
    expect((editor as any).shouldInsertReferenceAtCaret()).toBe(true);
    expect((editor as any).resolveReferenceSelectionAnchorCell({ row: 0, cell: 0 }, { startCell: { row: 0, cell: 0 }, endCell: { row: 1, cell: 1 } })).toEqual({
      row: 1,
      cell: 1,
    });
    (editor as any)._formulaRefColorCache.markClean();
    (editor as any).applyFormulaReferenceCellColors();

    (editor as any)._isExitingEditor = true;
    (editor as any).clearReferenceSelectionHighlight();
    expect(removeCellCssStylesSpy).toHaveBeenCalledWith('formula-editor-grid-persistent-colors');

    (editor as any)._isExitingEditor = false;
    (editor as any).restoreCaretOffset(999);
    (editor as any)._isDestroyed = true;
    (editor as any).restoreCaretOffset(0);
    (editor as any)._isDestroyed = false;
    const selectionSpy = vi.spyOn(window, 'getSelection').mockReturnValue(null);
    (editor as any).restoreCaretOffset(0);
    selectionSpy.mockRestore();
    (editor as any)._editorElm.textContent = 'plain text';
    (editor as any).updateAutocomplete();

    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
  });

  it('should cover paste, keyboard navigation, and editor lifecycle guards', () => {
    vi.useFakeTimers();
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    document.body.append(hostContainer, gridContainer);
    const focusSpy = vi.fn();
    const commitCurrentEdit = vi.fn(() => true);
    const navigateNext = vi.fn();
    const navigatePrev = vi.fn();
    const cancelChanges = vi.fn();
    const gridStub = {
      focus: focusSpy,
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => null,
      getColumns: () => [{ id: 'a' }, { id: 'b' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      navigateNext,
      navigatePrev,
      removeCellCssStyles: vi.fn(),
      setCellCssStyles: vi.fn(),
    } as any;

    const editor = new FormulaCellEditor({
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges: vi.fn(),
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges,
    } as unknown as EditorArguments);
    editor.loadValue({ total: '=A1' });

    editor.focus();
    expect(editor.validate()).toEqual({ valid: true, msg: '' });
    expect(editor.isValueChanged()).toBe(false);

    const execCommandSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', { configurable: true, value: execCommandSpy });
    (editor as any).handlePaste({
      preventDefault: vi.fn(),
      clipboardData: { getData: () => '+B1' },
    });
    expect(execCommandSpy).toHaveBeenCalledWith('insertText', false, '+B1');

    (editor as any)._editorElm.textContent = '=su';
    (editor as any).restoreCaretOffset(3);
    (editor as any).handleInput();
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowUp', cancelable: true }));
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));

    (editor as any)._autocompleteItems = [];
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowLeft', cancelable: true }));
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(commitCurrentEdit).toHaveBeenCalledTimes(1);
    editor.destroy();

    const invalidRangeEditor = new FormulaCellEditor({
      column: { field: 'total' },
      commitChanges: vi.fn(),
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1:B' },
      cancelChanges: vi.fn(),
    } as unknown as EditorArguments);
    invalidRangeEditor.loadValue({ total: '=A1:B' });
    (invalidRangeEditor as any).restoreCaretOffset(5);
    (invalidRangeEditor as any).handleInput();
    (invalidRangeEditor as any)._referenceEditRange = undefined;
    (invalidRangeEditor as any)._plainTextValue = '=1+A1';
    (invalidRangeEditor as any)._editorElm.textContent = '=1+A1';
    (invalidRangeEditor as any).restoreCaretOffset(2);
    expect((invalidRangeEditor as any).resolveReferenceEditRangeForGridSelection()).toEqual({ start: 3, end: 5 });
    invalidRangeEditor.destroy();

    // A newly opened editor from Tab ignores the initial untouched Tab blur.
    const tabEditor = new FormulaCellEditor({
      event: new KeyboardEvent('keydown', { key: 'Tab' }),
      column: { field: 'total' },
      commitChanges: vi.fn(),
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges: vi.fn(),
    } as unknown as EditorArguments);
    tabEditor.loadValue({ total: '=A1' });
    (tabEditor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    expect(navigateNext).not.toHaveBeenCalled();
    tabEditor.destroy();

    // A changed editor commits and navigates in both directions after the timer.
    const navigateEditor = new FormulaCellEditor({
      column: { field: 'total' },
      commitChanges: vi.fn(),
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges,
    } as unknown as EditorArguments);
    navigateEditor.loadValue({ total: '=A1' });
    (navigateEditor as any)._isValueTouched = true;
    (navigateEditor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, cancelable: true }));
    vi.runAllTimers();
    expect(navigatePrev).toHaveBeenCalled();
    navigateEditor.destroy();

    const escapeEditor = new FormulaCellEditor({
      column: { field: 'total' },
      commitChanges: vi.fn(),
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges,
    } as unknown as EditorArguments);
    escapeEditor.loadValue({ total: '=A1' });
    (escapeEditor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Escape', cancelable: true }));
    expect(cancelChanges).toHaveBeenCalled();
    escapeEditor.destroy();

    delete (document as any).execCommand;
    hostContainer.remove();
    gridContainer.remove();
    vi.useRealTimers();
  });

  it('should cover focus, commit fallback, pointer guards, and reference-sync cleanup', () => {
    vi.useFakeTimers();
    const hostContainer = document.createElement('div');
    const gridContainer = document.createElement('div');
    const gridCell = document.createElement('div');
    gridContainer.appendChild(gridCell);
    document.body.append(hostContainer, gridContainer);
    let commitResult = false;
    let eventCell: { row: number; cell: number } | null = null;
    const commitChanges = vi.fn();
    const navigateNext = vi.fn();
    const gridStub = {
      focus: vi.fn(),
      getActiveCell: () => ({ row: 0, cell: 0 }),
      getCellFromEvent: () => eventCell,
      getColumns: () => [{ id: 'a' }],
      getContainerNode: () => gridContainer,
      getEditorLock: () => ({ commitCurrentEdit: () => commitResult }),
      getOptions: () => ({ editorNavigateOnArrows: false }),
      navigateNext,
      navigatePrev: vi.fn(),
      removeCellCssStyles: vi.fn(),
      setCellCssStyles: vi.fn(),
    } as any;
    const editor = new FormulaCellEditor({
      column: { field: 'total', editor: { params: { formulaFunctionList: ['SUM'] } } },
      commitChanges,
      container: hostContainer,
      grid: gridStub,
      item: { total: '=A1' },
      cancelChanges: vi.fn(),
    } as unknown as EditorArguments);
    editor.loadValue({ total: '=A1' });

    (editor as any).handleFocusIn();
    (editor as any)._initialLoadComplete = true;
    (editor as any).handleFocusIn();
    (editor as any).handleEditorKeyUp();
    (editor as any).handleEditorMouseUp();
    (editor as any).handleFocusOut(new FocusEvent('focusout', { relatedTarget: null }));
    vi.runAllTimers();
    (editor as any)._isExitingEditor = true;
    (editor as any).handleFocusOut(new FocusEvent('focusout', { relatedTarget: null }));
    (editor as any)._isExitingEditor = false;
    (editor as any)._suppressInitialTabBlur = false;
    (editor as any).ensureAutocompleteElement();
    (editor as any).handleFocusOut(new FocusEvent('focusout', { relatedTarget: null }));
    (editor as any)._suppressInitialTabBlur = true;
    (editor as any)._isValueTouched = false;
    (editor as any).handleFocusOut(new FocusEvent('focusout', { relatedTarget: null }));
    (editor as any)._isDestroyed = true;
    vi.runAllTimers();
    (editor as any)._isDestroyed = false;

    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }));
    expect(commitChanges).toHaveBeenCalled();
    (editor as any)._isExitingEditor = false;
    (editor as any)._isValueTouched = true;
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    vi.runAllTimers();

    commitResult = true;
    (editor as any)._isExitingEditor = false;
    (editor as any)._isValueTouched = true;
    (editor as any).handleKeydown(new KeyboardEvent('keydown', { key: 'Tab', cancelable: true }));
    vi.runAllTimers();
    expect(navigateNext).toHaveBeenCalled();

    (editor as any)._plainTextValue = 'plain';
    (editor as any)._editorElm.textContent = 'plain';
    (editor as any).syncReferenceSelectionFromCaret();
    expect((editor as any).getReferenceTokenRangeAtCaret()).toEqual({ start: 0, end: 0 });

    const gridTargetEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    Object.defineProperty(gridTargetEvent, 'target', { configurable: true, value: gridCell });
    (editor as any)._isExitingEditor = false;
    (editor as any)._plainTextValue = '=A1';
    eventCell = { row: -1, cell: -1 };
    (editor as any).handleWindowMouseDown(gridTargetEvent);
    eventCell = null;
    (editor as any)._plainTextValue = 'plain';
    (editor as any).handleWindowMouseDown(gridTargetEvent);
    (editor as any)._plainTextValue = '=A1';
    (editor as any)._gridContainerElm = (editor as any)._editorElm;
    const editorTarget = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    Object.defineProperty(editorTarget, 'target', { configurable: true, value: (editor as any)._editorElm });
    (editor as any).handleWindowMouseDown(editorTarget);
    (editor as any)._gridContainerElm = gridContainer;
    gridContainer.appendChild((editor as any)._autocompleteElm);
    const autocompleteTarget = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    Object.defineProperty(autocompleteTarget, 'target', { configurable: true, value: (editor as any)._autocompleteElm });
    (editor as any).handleWindowMouseDown(autocompleteTarget);

    const selectionSpy = vi.spyOn(window, 'getSelection').mockReturnValue(null);
    (editor as any).setCursorAtEnd();
    selectionSpy.mockRestore();

    (editor as any)._editorElm.remove();
    expect((editor as any).shouldCaptureGridReferenceSelection(gridTargetEvent)).toBe(false);

    (editor as any)._plainTextValue = '=A1';
    (editor as any)._editorElm.textContent = '=A1';
    (editor as any).restoreCaretOffset(1);
    const editorTargetEvent = new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 });
    (editor as any).handleWindowMouseDown(editorTargetEvent);
    (editor as any)._autocompleteElm = document.createElement('div');
    (editor as any).handleWindowMouseDown(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));

    gridCell.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true, button: 0 }));
    (editor as any)._isDraggingGridRefSelection = true;
    (editor as any)._referenceRangeAnchorCell = { row: 0, cell: 0 };
    gridCell.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, cancelable: true, button: 0 }));
    gridCell.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true, button: 0 }));
    vi.runAllTimers();

    (editor as any).setCursorAtEnd();
    editor.destroy();
    hostContainer.remove();
    gridContainer.remove();
    vi.useRealTimers();
  });
});
