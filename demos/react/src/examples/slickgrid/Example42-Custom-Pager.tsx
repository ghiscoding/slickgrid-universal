import type { PaginationMetadata, PaginationService, PubSubService, SlickGrid, Subscription } from '@slickgrid-universal/common';
import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import './Example42-Custom-Pager.scss';

export interface CustomPagerComponentRef {
  init: (grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) => void;
  dispose: () => void;
  renderPagination: () => void;
}

const CustomPagerComponent = (_props: any) => {
  const { ref /*, ...props */ } = _props;
  const [currentPagination, setCurrentPagination] = useState<PaginationMetadata>({} as PaginationMetadata);
  const [isLeftPaginationDisabled, setIsLeftPaginationDisabled] = useState(false);
  const [isRightPaginationDisabled, setIsRightPaginationDisabled] = useState(false);

  const paginationElementRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<SlickGrid | null>(null);
  const paginationServiceRef = useRef<PaginationService | null>(null);
  const pubSubServiceRef = useRef<PubSubService | null>(null);
  const subscriptionsRef = useRef<Subscription[]>([]);

  const checkLeftPaginationDisabled = (pagination: PaginationMetadata): boolean => {
    return pagination.pageNumber === 1 || pagination.totalItems === 0;
  };

  const checkRightPaginationDisabled = (pagination: PaginationMetadata): boolean => {
    return pagination.pageNumber === pagination.pageCount || pagination.totalItems === 0;
  };

  const init = (grid: SlickGrid, paginationService: PaginationService, pubSubService: PubSubService) => {
    gridRef.current = grid;
    paginationServiceRef.current = paginationService;
    pubSubServiceRef.current = pubSubService;

    const currentPagination = paginationService.getFullPagination();
    setCurrentPagination(currentPagination);
    setIsLeftPaginationDisabled(checkLeftPaginationDisabled(currentPagination));
    setIsRightPaginationDisabled(checkRightPaginationDisabled(currentPagination));

    const subscription = pubSubService.subscribe<PaginationMetadata>('onPaginationRefreshed', (paginationChanges) => {
      setCurrentPagination(paginationChanges);
      setIsLeftPaginationDisabled(checkLeftPaginationDisabled(paginationChanges));
      setIsRightPaginationDisabled(checkRightPaginationDisabled(paginationChanges));
    });

    subscriptionsRef.current.push(subscription);
  };

  const dispose = () => {
    pubSubServiceRef.current?.unsubscribeAll(subscriptionsRef.current);
    paginationElementRef.current?.remove();
  };

  const renderPagination = () => {
    console.log('Rendering pagination...');
    // Add any custom logic here to re-render or update the pagination UI
    if (paginationServiceRef.current) {
      const currentPagination = paginationServiceRef.current.getFullPagination();
      setCurrentPagination(currentPagination);
      setIsLeftPaginationDisabled(checkLeftPaginationDisabled(currentPagination));
      setIsRightPaginationDisabled(checkRightPaginationDisabled(currentPagination));
    }
  };

  const onFirstPageClicked = (event: any) => {
    if (!checkLeftPaginationDisabled(currentPagination)) {
      paginationServiceRef.current?.goToFirstPage(event);
    }
  };

  const onLastPageClicked = (event: any) => {
    if (!checkRightPaginationDisabled(currentPagination)) {
      paginationServiceRef.current?.goToLastPage(event);
    }
  };

  const onNextPageClicked = (event: any) => {
    if (!checkRightPaginationDisabled(currentPagination)) {
      paginationServiceRef.current?.goToNextPage(event);
    }
  };

  const onPreviousPageClicked = (event: any) => {
    if (!checkLeftPaginationDisabled(currentPagination)) {
      paginationServiceRef.current?.goToPreviousPage(event);
    }
  };

  useEffect(() => {
    return () => {
      dispose();
    };
  }, []);

  // Expose `init`, `dispose`, and `renderPagination` methods via the ref
  useImperativeHandle(ref, () => ({
    init,
    dispose,
    renderPagination,
  }));

  return (
    <div className="custom-pagination" ref={paginationElementRef}>
      <span className="custom-pagination-settings">
        <span className="custom-pagination-count">
          <span className="page-info-from-to">
            <span className="item-from" aria-label="Page Item From" data-test="item-from">
              {currentPagination.dataFrom}
            </span>
            -
            <span className="item-to" aria-label="Page Item To" data-test="item-to">
              {currentPagination.dataTo}
            </span>
            of
          </span>
          <span className="page-info-total-items">
            <span className="total-items" aria-label="Total Items" data-test="total-items">
              {currentPagination.totalItems}
            </span>
            <span className="text-items"> items</span>
          </span>
        </span>
      </span>
      <div className="custom-pagination-nav">
        <nav aria-label="Page navigation">
          <ul className="custom-pagination-ul">
            <li className={'li page-item seek-first' + (isLeftPaginationDisabled ? ' disabled' : '')}>
              <a
                className="pagination-link mdi mdi-page-first icon-seek-first font-22px"
                aria-label="First Page"
                role="button"
                onClick={onFirstPageClicked}
              ></a>
            </li>
            <li className={'li page-item seek-prev' + (isLeftPaginationDisabled ? ' disabled' : '')}>
              <a
                className="pagination-link icon-seek-prev mdi mdi-chevron-down font-22px mdi-rotate-90"
                aria-label="Previous Page"
                role="button"
                onClick={onPreviousPageClicked}
              ></a>
            </li>
          </ul>
        </nav>
        <div className="page-number">
          <span className="text-page">Page</span>
          <span className="page-number" aria-label="Page Number" data-test="page-number-label">
            {currentPagination.pageNumber}
          </span>
          of
          <span className="page-count" data-test="page-count">
            {currentPagination.pageCount}
          </span>
        </div>
        <nav aria-label="Page navigation">
          <ul className="custom-pagination-ul">
            <li className={'li page-item seek-next' + (isRightPaginationDisabled ? ' disabled' : '')} onClick={onNextPageClicked}>
              <a
                className="pagination-link icon-seek-next mdi mdi-chevron-down font-22px mdi-rotate-270"
                aria-label="Next Page"
                role="button"
              ></a>
            </li>
            <li className={'li page-item seek-end' + (isRightPaginationDisabled ? ' disabled' : '')}>
              <a
                className="pagination-link icon-seek-end mdi mdi-page-last font-22px"
                aria-label="Last Page"
                role="button"
                onClick={onLastPageClicked}
              ></a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default CustomPagerComponent;
