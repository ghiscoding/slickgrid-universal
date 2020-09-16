import './icons.scss';

export class Icons {
  attached() {
    const iconContainerElm = document.querySelector<HTMLDivElement>(`.icons-container`);
    const iconCounter = document.querySelector<HTMLDivElement>(`.icon-counter`);

    const icons = this.getIcons();
    iconCounter.textContent = `(${icons.length} icons)`;

    icons.forEach((icon) => {
      const iconDivElm = document.createElement('div');
      iconDivElm.className = 'slick-col-medium-2';
      iconDivElm.style.paddingBottom = '5px';

      const iconElm = document.createElement('span');
      iconElm.className = icon.replace(/\./gi, ' ');
      iconElm.classList.add('mdi-24px');
      iconElm.title = icon.replace('.mdi.', '');
      iconElm.style.marginRight = '2px';
      iconDivElm.appendChild(iconElm);

      const iconNameElm = document.createElement('span');
      iconNameElm.textContent = icon.replace('.mdi.', '');
      iconDivElm.appendChild(iconNameElm);

      iconContainerElm.appendChild(iconDivElm);
    });
  }

  getIcons() {
    return [
      '.mdi.mdi-alert-circle',
      '.mdi.mdi-alert-octagon',
      '.mdi.mdi-arrow-collapse',
      '.mdi.mdi-arrow-down-bold-box',
      '.mdi.mdi-arrow-down-bold-box-outline',
      '.mdi.mdi-arrow-expand',
      '.mdi.mdi-call-split',
      '.mdi.mdi-cancel',
      '.mdi.mdi-cash-check',
      '.mdi.mdi-cash-remove',
      '.mdi.mdi-check',
      '.mdi.mdi-checkbox-blank-outline',
      '.mdi.mdi-check-box-outline',
      '.mdi.mdi-checkbox-marked',
      '.mdi.mdi-check-circle',
      '.mdi.mdi-check-outline',
      '.mdi.mdi-chevron-down',
      '.mdi.mdi-chevron-down-box',
      '.mdi.mdi-chevron-down-box-outline',
      '.mdi.mdi-chevron-down-circle',
      '.mdi.mdi-chevron-down-circle-outline',
      '.mdi.mdi-clipboard-check-outline',
      '.mdi.mdi-clipboard-edit',
      '.mdi.mdi-clipboard-edit-outline',
      '.mdi.mdi-clipboard-multiple',
      '.mdi.mdi-clipboard-multiple-outline',
      '.mdi.mdi-clipboard-outline',
      '.mdi.mdi-close',
      '.mdi.mdi-close-circle',
      '.mdi.mdi-close-circle-outline',
      '.mdi.mdi-close-thick',
      '.mdi.mdi-coffee',
      '.mdi.mdi-coffee-outline',
      '.mdi.mdi-content-copy',
      '.mdi.mdi-currency-usd',
      '.mdi.mdi-currency-usd-off',
      '.mdi.mdi-database-refresh',
      '.mdi.mdi-delete',
      '.mdi.mdi-delete-outline',
      '.mdi.mdi-dots-vertical',
      '.mdi.mdi-download',
      '.mdi.mdi-drag',
      '.mdi.mdi-drag-vertical',
      '.mdi.mdi-file-document-outline',
      '.mdi.mdi-file-excel-outline',
      '.mdi.mdi-file-music-outline',
      '.mdi.mdi-file-pdf-outline',
      '.mdi.mdi-filter-minus-outline',
      '.mdi.mdi-filter-off-outline',
      '.mdi.mdi-filter-plus-outline',
      '.mdi.mdi-filter-remove-outline',
      '.mdi.mdi-flip-vertical',
      '.mdi.mdi-folder',
      '.mdi.mdi-folder-open',
      '.mdi.mdi-help-circle',
      '.mdi.mdi-help-circle-outline',
      '.mdi.mdi-history',
      '.mdi.mdi-information',
      '.mdi.mdi-information-outline',
      '.mdi.mdi-link',
      '.mdi.mdi-link-variant',
      '.mdi.mdi-load',
      '.mdi.mdi-menu',
      '.mdi.mdi-microsoft-excel',
      '.mdi.mdi-minus',
      '.mdi.mdi-order-bool-ascending-variant',
      '.mdi.mdi-page-first',
      '.mdi.mdi-page-last',
      '.mdi.mdi-paperclip',
      '.mdi.mdi-pencil-box-multiple',
      '.mdi.mdi-pencil-box-multiple-outline',
      '.mdi.mdi-pin-off-outline',
      '.mdi.mdi-pin-outline',
      '.mdi.mdi-playlist-plus',
      '.mdi.mdi-playlist-remove',
      '.mdi.mdi-plus',
      '.mdi.mdi-redo',
      '.mdi.mdi-refresh',
      '.mdi.mdi-shape-square-plus',
      '.mdi.mdi-sort-ascending',
      '.mdi.mdi-sort-descending',
      '.mdi.mdi-square-edit-outline',
      '.mdi.mdi-swap-horizontal',
      '.mdi.mdi-swap-vertical',
      '.mdi.mdi-sync',
      '.mdi.mdi-sync-circle',
      '.mdi.mdi-table-edit',
      '.mdi.mdi-table-refresh',
      '.mdi.mdi-toggle-switch',
      '.mdi.mdi-toggle-switch-off-outline',
      '.mdi.mdi-trash-can',
      '.mdi.mdi-trash-can-outline',
      '.mdi.mdi-tune',
      '.mdi.mdi-tune-variant',
      '.mdi.mdi-undo',
      '.mdi.mdi-vanish',
    ];
  }
}
