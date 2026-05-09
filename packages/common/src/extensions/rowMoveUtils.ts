import type { SlickDataView } from '../core/slickDataview';
import type { SlickGrid } from '../core/slickGrid';

export function defaultOnBeforeMoveRows(
  e: MouseEvent | TouchEvent,
  args: { rows: number[]; insertBefore: number; grid: SlickGrid }
): boolean {
  const dataView = args.grid.getData<SlickDataView>();
  if (dataView?.getItemCount) {
    const itemCount = dataView.getItemCount();
    for (const rowIdx of args.rows) {
      // no point in moving before or after itself
      if (rowIdx === args.insertBefore || (rowIdx === args.insertBefore - 1 && args.insertBefore - 1 !== itemCount)) {
        e.stopPropagation();
        return false;
      }
    }
    return true;
  }
  return false;
}

export function defaultOnMoveRows(_e: MouseEvent | TouchEvent, args: { rows: number[]; insertBefore: number; grid: SlickGrid }): void {
  // rows and insertBefore references,
  // note that these references are assuming that the dataset isn't filtered at all
  // which is not always the case so we will recalcualte them and we won't use these reference afterward
  const dataView = args.grid.getData<SlickDataView>();
  if (dataView?.getItemCount) {
    const rows = args.rows as number[];
    const insertBefore = args.insertBefore;
    const extractedRows: any[] = [];

    // when moving rows, we need to cancel any sorting that might happen
    // we can do this by providing an undefined sort comparer
    // which basically destroys the current sort comparer without resorting the dataset, it basically keeps the previous sorting
    dataView?.sort(undefined as any, true);

    // the dataset might be filtered/sorted,
    // so we need to get the same dataset as the one that the SlickGrid DataView uses
    const tmpDataset = dataView?.getItems() as any[];
    const filteredItems = dataView?.getFilteredItems() as any[];

    const itemOnRight = dataView?.getItem(insertBefore);
    const insertBeforeFilteredIdx = (itemOnRight ? dataView?.getIdxById(itemOnRight.id) : dataView?.getItemCount()) as number;

    const filteredRowItems: any[] = [];
    rows.forEach((row) => filteredRowItems.push(filteredItems[row] as any));
    const filteredRows = filteredRowItems.map((item) => dataView?.getIdxById(item.id)) as number[];

    const left = tmpDataset.slice(0, insertBeforeFilteredIdx);
    const right = tmpDataset.slice(insertBeforeFilteredIdx, tmpDataset.length);

    // convert into a final new dataset that has the new order
    // we need to resort with
    rows.sort((a: number, b: number) => a - b);
    for (const filteredRow of filteredRows) {
      extractedRows.push(tmpDataset[filteredRow as number]);
    }
    filteredRows.reverse();
    for (const row of filteredRows) {
      if (row < insertBeforeFilteredIdx) {
        left.splice(row, 1);
      } else {
        right.splice(row - insertBeforeFilteredIdx, 1);
      }
    }

    // final updated dataset, we need to overwrite the DataView dataset (and our local one) with this new dataset that has a new order
    args.grid?.resetActiveCell();
    const finalDataset = left.concat(extractedRows.concat(right));
    dataView.setItems(finalDataset);
    args.grid.invalidate();
  } else {
    console.error('Sorry `defaultOnMoveRows()` only works with SlickDataView');
  }
}
