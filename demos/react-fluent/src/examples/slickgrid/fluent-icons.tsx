import React, { useState } from 'react';

const FluentIconExample: React.FC = () => {
  const [icons] = useState<any[]>([
    'fi-arrow-download',
    'fi-add',
    'fi-arrow-autofit',
    'fi-arrow-bidirection',
    'fi-arrow-export',
    'fi-arrow-import',
    'fi-arrow-maximize',
    'fi-arrow-minimize',
    'fi-arrow-reply',
    'fi-arrow-sort',
    'fi-arrow-sync',
    'fi-arrow-redo',
    'fi-arrow-undo',
    'fi-arrow-up',
    'fi-arrow-down',
    'fi-auto-arrange',
    'fi-checkmark',
    'fi-chevron-right',
    'fi-code',
    'fi-copy',
    'fi-cut',
    'fi-delete',
    'fi-dismiss',
    'fi-edit',
    'fi-filter',
    'fi-filter-dismiss',
    'fi-info',
    'fi-link',
    'fi-more-vertical',
    'fi-navigation',
    'fi-pin',
    'fi-pin-off',
    'fi-prohibited',
    'fi-reorder-dots-vertical',
    'fi-save',
    'fi-setting',
    'fi-sort-arrow-down',
    'fi-sort-arrow-up',
    'fi-sort-ascending',
    'fi-sort-descending',
    'fi-split-horizontal',
    'fi-split-vertical',
    'fi-table',
    'fi-table-edit',
    'fi-triangle-right',
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
              className={`fi ${icon}`}
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
