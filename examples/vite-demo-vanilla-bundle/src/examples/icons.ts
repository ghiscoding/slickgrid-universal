import './icons.scss';

export default class Icons {
  private _darkMode = false;

  attached() {
    const iconContainerElm = document.querySelector(`.icons-container`) as HTMLDivElement;
    const iconCounter = document.querySelector(`.icon-counter`) as HTMLDivElement;

    const icons = this.getIcons();
    iconCounter.textContent = `(${icons.length} icons)`;

    icons.forEach((icon) => {
      const iconDivElm = document.createElement('div');
      iconDivElm.className = 'slick-col-medium-2 icon-box';
      iconDivElm.style.marginBottom = '5px';

      const iconElm = document.createElement('span');
      iconElm.className = icon.replace(/\./gi, ' ');
      if (icon.includes('mdi-change-record-type')) {
        iconElm.classList.add('mdi-20px');
      } else {
        iconElm.classList.add('mdi-24px');
      }
      iconElm.title = icon.replace('.mdi.', '');
      iconElm.style.marginRight = '5px';
      iconDivElm.appendChild(iconElm);

      const iconNameElm = document.createElement('span');
      iconNameElm.textContent = icon.replace('.mdi.', '');
      iconDivElm.appendChild(iconNameElm);

      iconContainerElm.appendChild(iconDivElm);
    });
  }

  dispose() {
    document.querySelector('.demo-container')?.classList.remove('dark-mode');
    document.body.setAttribute('data-theme', 'light');
  }

  toggleDarkMode() {
    this._darkMode = !this._darkMode;
    if (this._darkMode) {
      document.body.setAttribute('data-theme', 'dark');
      document.querySelector('.demo-container')?.classList.add('dark-mode');
    } else {
      document.body.setAttribute('data-theme', 'light');
      document.querySelector('.demo-container')?.classList.remove('dark-mode');
    }
  }

  getIcons() {
    return [
      '.mdi.mdi-account',
      '.mdi.mdi-account-box',
      '.mdi.mdi-account-box-outline',
      '.mdi.mdi-account-circle',
      '.mdi.mdi-account-edit',
      '.mdi.mdi-account-minus',
      '.mdi.mdi-account-off',
      '.mdi.mdi-account-plus',
      '.mdi.mdi-account-search',
      '.mdi.mdi-alarm',
      '.mdi.mdi-alarm-check',
      '.mdi.mdi-alarm-off',
      '.mdi.mdi-alert',
      '.mdi.mdi-alert-box',
      '.mdi.mdi-alert-box-outline',
      '.mdi.mdi-alert-circle',
      '.mdi.mdi-alert-octagon',
      '.mdi.mdi-alert-outline',
      '.mdi.mdi-alert-rhombus',
      '.mdi.mdi-alert-rhombus-outline',
      '.mdi.mdi-arrow-collapse',
      '.mdi.mdi-arrow-down',
      '.mdi.mdi-arrow-down-bold',
      '.mdi.mdi-arrow-down-bold-box',
      '.mdi.mdi-arrow-down-bold-box-outline',
      '.mdi.mdi-arrow-down-bold-outline',
      '.mdi.mdi-arrow-expand',
      '.mdi.mdi-arrow-expand-horizontal',
      '.mdi.mdi-arrow-split-vertical',
      '.mdi.mdi-brightness-4',
      '.mdi.mdi-calendar',
      '.mdi.mdi-calendar-check',
      '.mdi.mdi-calendar-clock',
      '.mdi.mdi-calendar-edit',
      '.mdi.mdi-calendar-remove',
      '.mdi.mdi-calendar-search',
      '.mdi.mdi-call-split',
      '.mdi.mdi-cancel',
      '.mdi.mdi-cash-check',
      '.mdi.mdi-cash-remove',
      '.mdi.mdi-certificate',
      '.mdi.mdi-certificate-outline',
      '.mdi.mdi-change-record-type',
      '.mdi.mdi-check',
      '.mdi.mdi-check-all',
      '.mdi.mdi-check-bold',
      '.mdi.mdi-checkbox-blank-outline',
      '.mdi.mdi-checkbox-marked-circle-outline',
      '.mdi.mdi-check-box-outline',
      '.mdi.mdi-checkbox-marked',
      '.mdi.mdi-check-circle',
      '.mdi.mdi-check-circle-outline',
      '.mdi.mdi-check-outline',
      '.mdi.mdi-check-underline',
      '.mdi.mdi-chevron-down',
      '.mdi.mdi-chevron-down-box',
      '.mdi.mdi-chevron-down-box-outline',
      '.mdi.mdi-chevron-down-circle',
      '.mdi.mdi-chevron-down-circle-outline',
      '.mdi.mdi-clipboard-check',
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
      '.mdi.mdi-cog',
      '.mdi.mdi-cog-outline',
      '.mdi.mdi-content-copy',
      '.mdi.mdi-currency-usd',
      '.mdi.mdi-currency-usd-off',
      '.mdi.mdi-database-refresh',
      '.mdi.mdi-delete',
      '.mdi.mdi-delete-outline',
      '.mdi.mdi-dots-grid',
      '.mdi.mdi-dots-vertical',
      '.mdi.mdi-download',
      '.mdi.mdi-drag',
      '.mdi.mdi-drag-vertical',
      '.mdi.mdi-eye-off-outline',
      '.mdi.mdi-eye-outline',
      '.mdi.mdi-file',
      '.mdi.mdi-file-alert',
      '.mdi.mdi-file-alert-outline',
      '.mdi.mdi-file-cad',
      '.mdi.mdi-file-check',
      '.mdi.mdi-file-check-outline',
      '.mdi.mdi-file-document-outline',
      '.mdi.mdi-file-excel-outline',
      '.mdi.mdi-file-move',
      '.mdi.mdi-file-move-outline',
      '.mdi.mdi-file-multiple',
      '.mdi.mdi-file-multiple-outline',
      '.mdi.mdi-file-music-outline',
      '.mdi.mdi-file-outline',
      '.mdi.mdi-file-pdf-outline',
      '.mdi.mdi-file-question',
      '.mdi.mdi-file-question-outline',
      '.mdi.mdi-file-search-outline',
      '.mdi.mdi-file-send',
      '.mdi.mdi-file-send-outline',
      '.mdi.mdi-file-tree',
      '.mdi.mdi-file-tree-outline',
      '.mdi.mdi-file-upload',
      '.mdi.mdi-file-upload-outline',
      '.mdi.mdi-filter',
      '.mdi.mdi-filter-minus-outline',
      '.mdi.mdi-filter-off-outline',
      '.mdi.mdi-filter-outline',
      '.mdi.mdi-filter-plus-outline',
      '.mdi.mdi-filter-remove-outline',
      '.mdi.mdi-fire',
      '.mdi.mdi-flip-vertical',
      '.mdi.mdi-folder',
      '.mdi.mdi-folder-open',
      '.mdi.mdi-forum',
      '.mdi.mdi-forum-outline',
      '.mdi.mdi-github',
      '.mdi.mdi-help',
      '.mdi.mdi-help-circle',
      '.mdi.mdi-help-circle-outline',
      '.mdi.mdi-history',
      '.mdi.mdi-information',
      '.mdi.mdi-information-outline',
      '.mdi.mdi-lightbulb',
      '.mdi.mdi-lightbulb-off',
      '.mdi.mdi-lightbulb-off-outline',
      '.mdi.mdi-lightbulb-on',
      '.mdi.mdi-lightbulb-on-outline',
      '.mdi.mdi-lightbulb-outline',
      '.mdi.mdi-link',
      '.mdi.mdi-link-variant',
      '.mdi.mdi-load',
      '.mdi.mdi-magnify',
      '.mdi.mdi-map-marker-radius',
      '.mdi.mdi-map-marker-radius-outline',
      '.mdi.mdi-menu',
      '.mdi.mdi-message-text',
      '.mdi.mdi-message-text-outline',
      '.mdi.mdi-microsoft-excel',
      '.mdi.mdi-minus',
      '.mdi.mdi-minus-circle',
      '.mdi.mdi-minus-circle-outline',
      '.mdi.mdi-order-bool-ascending-variant',
      '.mdi.mdi-page-first',
      '.mdi.mdi-page-last',
      '.mdi.mdi-paperclip',
      '.mdi.mdi-pencil',
      '.mdi.mdi-pencil-outline',
      '.mdi.mdi-pencil-box-multiple',
      '.mdi.mdi-pencil-box-multiple-outline',
      '.mdi.mdi-percent',
      '.mdi.mdi-percent-outline',
      '.mdi.mdi-pin-off-outline',
      '.mdi.mdi-pin-outline',
      '.mdi.mdi-play-circle-outline',
      '.mdi.mdi-playlist-plus',
      '.mdi.mdi-playlist-remove',
      '.mdi.mdi-plus',
      '.mdi.mdi-plus-circle',
      '.mdi.mdi-plus-circle-outline',
      '.mdi.mdi-progress-download',
      '.mdi.mdi-redo',
      '.mdi.mdi-refresh',
      '.mdi.mdi-shape-square-plus',
      '.mdi.mdi-snowflake',
      '.mdi.mdi-sort-ascending',
      '.mdi.mdi-sort-descending',
      '.mdi.mdi-sort-variant-off',
      '.mdi.mdi-sort-variant-remove',
      '.mdi.mdi-square-edit-outline',
      '.mdi.mdi-star',
      '.mdi.mdi-star-outline',
      '.mdi.mdi-stop-circle-outline',
      '.mdi.mdi-subdirectory-arrow-right',
      '.mdi.mdi-swap-horizontal',
      '.mdi.mdi-swap-vertical',
      '.mdi.mdi-sync',
      '.mdi.mdi-sync-circle',
      '.mdi.mdi-table-edit',
      '.mdi.mdi-table-refresh',
      '.mdi.mdi-text-box-remove',
      '.mdi.mdi-text-box-remove-outline',
      '.mdi.mdi-text-box-search-outline',
      '.mdi.mdi-theme-light-dark',
      '.mdi.mdi-toggle-switch',
      '.mdi.mdi-toggle-switch-off-outline',
      '.mdi.mdi-trash-can',
      '.mdi.mdi-trash-can-outline',
      '.mdi.mdi-truck',
      '.mdi.mdi-truck-delivery-outline',
      '.mdi.mdi-tune',
      '.mdi.mdi-tune-variant',
      '.mdi.mdi-undo',
      '.mdi.mdi-upload',
      '.mdi.mdi-vanish',
      '.mdi.mdi-wrench',
      '.mdi.mdi-wrench-outline',
    ];
  }
}
