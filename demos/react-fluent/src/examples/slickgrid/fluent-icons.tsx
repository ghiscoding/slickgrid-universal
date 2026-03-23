import React, { useState } from 'react';

const FluentIconExample: React.FC = () => {
  const [icons] = useState<any[]>([
    'fic-arrow-download',
    'fic-add',
    'fic-arrow-autofit',
    'fic-arrow-bidirection',
    'fic-arrow-export',
    'fic-arrow-import',
    'fic-arrow-maximize',
    'fic-arrow-minimize',
    'fic-arrow-reply',
    'fic-arrow-sort',
    'fic-arrow-sync',
    'fic-arrow-redo',
    'fic-arrow-undo',
    'fic-arrow-up',
    'fic-arrow-down',
    'fic-auto-arrange',
    'fic-checkmark',
    'fic-chevron-right',
    'fic-code',
    'fic-copy',
    'fic-cut',
    'fic-delete',
    'fic-dismiss',
    'fic-edit',
    'fic-filter',
    'fic-filter-dismiss',
    'fic-info',
    'fic-link',
    'fic-more-vertical',
    'fic-navigation',
    'fic-pin',
    'fic-pin-off',
    'fic-prohibited',
    'fic-reorder-dots-vertical',
    'fic-save',
    'fic-setting',
    'fic-sort-arrow-down',
    'fic-sort-arrow-up',
    'fic-sort-ascending',
    'fic-sort-descending',
    'fic-split-horizontal',
    'fic-split-vertical',
    'fic-table',
    'fic-table-edit',
    'fic-triangle-right',
  ]);

  return (
    <div id="demo-container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px' }}>
      <h2>Fluent Theme Icons</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginTop: '24px' }}>
        {icons.map((icon) => (
          <div
            key={icon}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px',
              borderRadius: '4px',
            }}
          >
            <i
              className={`fic ${icon}`}
              style={{
                fontSize: '28px',
                flexShrink: 0,
              }}
            />
            <span>{icon}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FluentIconExample;
