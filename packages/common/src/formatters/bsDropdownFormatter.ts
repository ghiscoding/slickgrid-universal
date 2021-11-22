import { Formatter } from '../interfaces/formatter.interface';

/**
 * @deprecated @use `CellMenu`, which is a lot more generic instead of `bsDropdownFormatter`.
 * A simple Bootstrap Dropdown Formatter which requires a Formatter Label.
 */
export const bsDropdownFormatter: Formatter = (row, cell, _val, columnDef) => {
  const columnParams = columnDef && columnDef.params || {};
  const label = columnParams.label || columnParams.formatterLabel;

  if (!label) {
    throw new Error(`You must provide the "label" or "formatterLabel" via the generic "params" options (e.g.: { formatter: Formatters.bsDropdown, params: { formatterLabel: 'Label' }}`);
  }

  return `<div id="myDrop-r${row}-c${cell}" class="dropdown pointer">
    <a class="dropdown-toggle">
      ${label}
      <span class="caret"></span>
    </a>
  </div>`;
};