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
      if (icon.includes('sgi-change-record-type')) {
        iconElm.classList.add('sgi-20px');
      } else {
        iconElm.classList.add('sgi-24px');
      }
      iconElm.title = icon.replace('.sgi.', '');
      iconElm.style.marginRight = '5px';
      iconDivElm.appendChild(iconElm);

      const iconNameElm = document.createElement('span');
      iconNameElm.textContent = icon.replace('.sgi.', '');
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
      '.sgi.sgi-account',
      '.sgi.sgi-account-box',
      '.sgi.sgi-account-box-outline',
      '.sgi.sgi-account-circle',
      '.sgi.sgi-account-edit',
      '.sgi.sgi-account-minus',
      '.sgi.sgi-account-off',
      '.sgi.sgi-account-plus',
      '.sgi.sgi-account-search',
      '.sgi.sgi-alarm',
      '.sgi.sgi-alarm-check',
      '.sgi.sgi-alarm-off',
      '.sgi.sgi-alert',
      '.sgi.sgi-alert-box',
      '.sgi.sgi-alert-box-outline',
      '.sgi.sgi-alert-circle',
      '.sgi.sgi-alert-octagon',
      '.sgi.sgi-alert-outline',
      '.sgi.sgi-alert-rhombus',
      '.sgi.sgi-alert-rhombus-outline',
      '.sgi.sgi-arrow-collapse',
      '.sgi.sgi-arrow-down',
      '.sgi.sgi-arrow-down-bold',
      '.sgi.sgi-arrow-down-bold-box',
      '.sgi.sgi-arrow-down-bold-box-outline',
      '.sgi.sgi-arrow-down-bold-outline',
      '.sgi.sgi-arrow-expand',
      '.sgi.sgi-arrow-expand-horizontal',
      '.sgi.sgi-arrow-split-vertical',
      '.sgi.sgi-brightness-4',
      '.sgi.sgi-calendar',
      '.sgi.sgi-calendar-check',
      '.sgi.sgi-calendar-clock',
      '.sgi.sgi-calendar-edit',
      '.sgi.sgi-calendar-remove',
      '.sgi.sgi-calendar-search',
      '.sgi.sgi-call-split',
      '.sgi.sgi-cancel',
      '.sgi.sgi-cash-check',
      '.sgi.sgi-cash-remove',
      '.sgi.sgi-certificate',
      '.sgi.sgi-certificate-outline',
      '.sgi.sgi-change-record-type',
      '.sgi.sgi-check',
      '.sgi.sgi-check-all',
      '.sgi.sgi-check-bold',
      '.sgi.sgi-checkbox-blank-outline',
      '.sgi.sgi-checkbox-marked-circle-outline',
      '.sgi.sgi-check-box-outline',
      '.sgi.sgi-checkbox-marked',
      '.sgi.sgi-check-circle',
      '.sgi.sgi-check-circle-outline',
      '.sgi.sgi-check-outline',
      '.sgi.sgi-check-underline',
      '.sgi.sgi-chevron-down',
      '.sgi.sgi-chevron-down-box',
      '.sgi.sgi-chevron-down-box-outline',
      '.sgi.sgi-chevron-down-circle',
      '.sgi.sgi-chevron-down-circle-outline',
      '.sgi.sgi-clipboard-check',
      '.sgi.sgi-clipboard-check-outline',
      '.sgi.sgi-clipboard-edit',
      '.sgi.sgi-clipboard-edit-outline',
      '.sgi.sgi-clipboard-multiple',
      '.sgi.sgi-clipboard-multiple-outline',
      '.sgi.sgi-clipboard-outline',
      '.sgi.sgi-close',
      '.sgi.sgi-close-circle',
      '.sgi.sgi-close-circle-outline',
      '.sgi.sgi-close-thick',
      '.sgi.sgi-coffee',
      '.sgi.sgi-coffee-outline',
      '.sgi.sgi-cog',
      '.sgi.sgi-cog-outline',
      '.sgi.sgi-content-copy',
      '.sgi.sgi-currency-usd',
      '.sgi.sgi-currency-usd-off',
      '.sgi.sgi-database-refresh',
      '.sgi.sgi-delete',
      '.sgi.sgi-delete-outline',
      '.sgi.sgi-dots-grid',
      '.sgi.sgi-dots-vertical',
      '.sgi.sgi-download',
      '.sgi.sgi-drag',
      '.sgi.sgi-drag-vertical',
      '.sgi.sgi-eye-off-outline',
      '.sgi.sgi-eye-outline',
      '.sgi.sgi-file',
      '.sgi.sgi-file-alert',
      '.sgi.sgi-file-alert-outline',
      '.sgi.sgi-file-cad',
      '.sgi.sgi-file-check',
      '.sgi.sgi-file-check-outline',
      '.sgi.sgi-file-document-outline',
      '.sgi.sgi-file-excel-outline',
      '.sgi.sgi-file-move',
      '.sgi.sgi-file-move-outline',
      '.sgi.sgi-file-multiple',
      '.sgi.sgi-file-multiple-outline',
      '.sgi.sgi-file-music-outline',
      '.sgi.sgi-file-outline',
      '.sgi.sgi-file-pdf-outline',
      '.sgi.sgi-file-question',
      '.sgi.sgi-file-question-outline',
      '.sgi.sgi-file-search-outline',
      '.sgi.sgi-file-send',
      '.sgi.sgi-file-send-outline',
      '.sgi.sgi-file-tree',
      '.sgi.sgi-file-tree-outline',
      '.sgi.sgi-file-upload',
      '.sgi.sgi-file-upload-outline',
      '.sgi.sgi-filter',
      '.sgi.sgi-filter-minus-outline',
      '.sgi.sgi-filter-off-outline',
      '.sgi.sgi-filter-outline',
      '.sgi.sgi-filter-plus-outline',
      '.sgi.sgi-filter-remove-outline',
      '.sgi.sgi-fire',
      '.sgi.sgi-flip-vertical',
      '.sgi.sgi-folder',
      '.sgi.sgi-folder-open',
      '.sgi.sgi-forum',
      '.sgi.sgi-forum-outline',
      '.sgi.sgi-github',
      '.sgi.sgi-help',
      '.sgi.sgi-help-circle',
      '.sgi.sgi-help-circle-outline',
      '.sgi.sgi-history',
      '.sgi.sgi-information',
      '.sgi.sgi-information-outline',
      '.sgi.sgi-lightbulb',
      '.sgi.sgi-lightbulb-off',
      '.sgi.sgi-lightbulb-off-outline',
      '.sgi.sgi-lightbulb-on',
      '.sgi.sgi-lightbulb-on-outline',
      '.sgi.sgi-lightbulb-outline',
      '.sgi.sgi-link',
      '.sgi.sgi-link-variant',
      '.sgi.sgi-load',
      '.sgi.sgi-magnify',
      '.sgi.sgi-map-marker-radius',
      '.sgi.sgi-map-marker-radius-outline',
      '.sgi.sgi-menu',
      '.sgi.sgi-message-text',
      '.sgi.sgi-message-text-outline',
      '.sgi.sgi-microsoft-excel',
      '.sgi.sgi-minus',
      '.sgi.sgi-minus-circle',
      '.sgi.sgi-minus-circle-outline',
      '.sgi.sgi-order-bool-ascending-variant',
      '.sgi.sgi-page-first',
      '.sgi.sgi-page-last',
      '.sgi.sgi-paperclip',
      '.sgi.sgi-pencil',
      '.sgi.sgi-pencil-outline',
      '.sgi.sgi-pencil-box-multiple',
      '.sgi.sgi-pencil-box-multiple-outline',
      '.sgi.sgi-percent',
      '.sgi.sgi-percent-outline',
      '.sgi.sgi-pin-off-outline',
      '.sgi.sgi-pin-outline',
      '.sgi.sgi-play-circle-outline',
      '.sgi.sgi-playlist-plus',
      '.sgi.sgi-playlist-remove',
      '.sgi.sgi-plus',
      '.sgi.sgi-plus-circle',
      '.sgi.sgi-plus-circle-outline',
      '.sgi.sgi-progress-download',
      '.sgi.sgi-redo',
      '.sgi.sgi-refresh',
      '.sgi.sgi-shape-square-plus',
      '.sgi.sgi-snowflake',
      '.sgi.sgi-sort-ascending',
      '.sgi.sgi-sort-descending',
      '.sgi.sgi-sort-variant-off',
      '.sgi.sgi-sort-variant-remove',
      '.sgi.sgi-square-edit-outline',
      '.sgi.sgi-star',
      '.sgi.sgi-star-outline',
      '.sgi.sgi-stop-circle-outline',
      '.sgi.sgi-subdirectory-arrow-right',
      '.sgi.sgi-swap-horizontal',
      '.sgi.sgi-swap-vertical',
      '.sgi.sgi-sync',
      '.sgi.sgi-sync-circle',
      '.sgi.sgi-table-edit',
      '.sgi.sgi-table-refresh',
      '.sgi.sgi-text-box-remove',
      '.sgi.sgi-text-box-remove-outline',
      '.sgi.sgi-text-box-search-outline',
      '.sgi.sgi-theme-light-dark',
      '.sgi.sgi-toggle-switch',
      '.sgi.sgi-toggle-switch-off-outline',
      '.sgi.sgi-trash-can',
      '.sgi.sgi-trash-can-outline',
      '.sgi.sgi-truck',
      '.sgi.sgi-truck-delivery-outline',
      '.sgi.sgi-tune',
      '.sgi.sgi-tune-variant',
      '.sgi.sgi-undo',
      '.sgi.sgi-upload',
      '.sgi.sgi-vanish',
      '.sgi.sgi-wrench',
      '.sgi.sgi-wrench-outline',
    ];
  }
}
