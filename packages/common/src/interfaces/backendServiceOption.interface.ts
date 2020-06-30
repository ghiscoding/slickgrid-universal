export interface BackendServiceOption {
  /** What are the pagination options? ex.: (first, last, offset) */
  paginationOptions?: any;

  /** array of Filtering Options, ex.: [{ field: 'firstName', operator: 'EQ', value: 'John' }] */
  filteringOptions?: any[];

  /** array of Filtering Options, ex.: [{ field: 'firstName', direction: 'DESC' }] */
  sortingOptions?: any[];

  /** Execute the process callback command on component init (page load) */
  executeProcessCommandOnInit?: boolean;
}
