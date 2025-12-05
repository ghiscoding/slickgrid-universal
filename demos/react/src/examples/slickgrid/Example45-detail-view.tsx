import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  SlickgridReact,
  type Column,
  type GridOption,
  type GridState,
  type RowDetailViewProps,
  type SlickgridReactInstance,
} from 'slickgrid-react';
import type Example45 from './Example45.js';
import './example45-detail-view.scss';

export interface Distributor {
  id: number;
  companyId: number;
  companyName: string;
  city: string;
  streetAddress: string;
  zipCode: string;
  country: string;
  orderData: OrderData[];
  isUsingInnerGridStatePresets: boolean;
}

export interface OrderData {
  orderId: string;
  shipCity: string;
  freight: number;
  shipName: string;
}

const Example45DetailView: React.FC<RowDetailViewProps<Distributor, typeof Example45>> = (props) => {
  const { ref /*, ...rest */ } = props;
  const [showGrid, setShowGrid] = useState(false);
  const [innerGridOptions, setInnerGridOptions] = useState<GridOption | undefined>(undefined);
  const [innerColDefs, setInnerColDefs] = useState<Column[]>([]);
  const [innerDataset] = useState<any[]>([...props.model.orderData]);
  const reactGridRef = useRef<SlickgridReactInstance | null>(null);
  const innerGridClass = `row-detail-${props.model.id}`;

  useImperativeHandle(ref, () => ({
    getReactGridInstance: () => reactGridRef.current,
  }));

  useEffect(() => {
    defineGrid();
    return () => {
      console.log('inner grid unmounting');
    };
  }, []);

  const getColumnDefinitions = (): Column[] => {
    return [
      { id: 'orderId', field: 'orderId', name: 'Order ID', filterable: true, sortable: true },
      { id: 'shipCity', field: 'shipCity', name: 'Ship City', filterable: true, sortable: true },
      { id: 'freight', field: 'freight', name: 'Freight', filterable: true, sortable: true, type: 'number' },
      { id: 'shipName', field: 'shipName', name: 'Ship Name', filterable: true, sortable: true },
    ];
  };

  function defineGrid() {
    const columnDefinitions = getColumnDefinitions();
    const gridOptions = getGridOptions();

    setInnerColDefs(columnDefinitions);
    setInnerGridOptions(gridOptions);
    setShowGrid(true);
  }

  function getGridOptions(): GridOption {
    // when Grid State found in Session Storage, reapply inner Grid State then reapply it as preset
    let gridState: GridState | undefined;
    if (props.model.isUsingInnerGridStatePresets) {
      const gridStateStr = sessionStorage.getItem(`gridstate_${innerGridClass}`);
      if (gridStateStr) {
        gridState = JSON.parse(gridStateStr);
      }
    }

    return {
      autoResize: {
        container: `.${innerGridClass}`,
        rightPadding: 30,
        minHeight: 200,
      },
      enableFiltering: true,
      enableSorting: true,
      rowHeight: 33,
      enableCellNavigation: true,
      datasetIdPropertyName: 'orderId',
      presets: gridState,
      rowTopOffsetRenderType: 'top', // RowDetail and/or RowSpan don't render well with "transform", you should use "top"
    };
  }

  function handleBeforeGridDestroy() {
    if (props.model.isUsingInnerGridStatePresets) {
      const gridState = reactGridRef.current?.gridStateService.getCurrentGridState();
      sessionStorage.setItem(`gridstate_${innerGridClass}`, JSON.stringify(gridState));
    }
  }

  function reactGridReady(reactGrid: SlickgridReactInstance) {
    reactGridRef.current = reactGrid;
  }

  return (
    <div className={`container-fluid ${innerGridClass}`} style={{ marginTop: '10px' }}>
      <h4>
        {props.model.companyName} - Order Details (id: {props.model.id})
      </h4>
      <div className="container-fluid innergrid">
        {showGrid && (
          <SlickgridReact
            gridId={`innergrid-${props.model.id}`}
            columns={innerColDefs}
            options={innerGridOptions}
            dataset={innerDataset}
            onReactGridCreated={($event) => reactGridReady($event.detail)}
            onBeforeGridDestroy={handleBeforeGridDestroy}
          />
        )}
      </div>
    </div>
  );
};

export default Example45DetailView;
