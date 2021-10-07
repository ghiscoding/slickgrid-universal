export interface DragPosition {
  startX: number;
  startY: number;
  range: DragRange;
}

export interface DragRange {
  start: {
    row?: number;
    cell?: number;
  };
  end: {
    row?: number;
    cell?: number;
  };
}