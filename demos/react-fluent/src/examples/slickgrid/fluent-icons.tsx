import React, { useState } from 'react';

const FluentIconExample: React.FC = () => {
  const [icons] = useState<any[]>([
    'fui-arrow-download',
    'fui-add',
    'fui-arrow-autofit',
    'fui-arrow-bidirection',
    'fui-arrow-export',
    'fui-arrow-import',
    'fui-arrow-maximize',
    'fui-arrow-minimize',
    'fui-arrow-reply',
    'fui-arrow-sort',
    'fui-arrow-sync',
    'fui-arrow-redo',
    'fui-arrow-undo',
    'fui-arrow-up',
    'fui-arrow-down',
    'fui-auto-arrange',
    'fui-checkmark',
    'fui-chevron-right',
    'fui-code',
    'fui-copy',
    'fui-cut',
    'fui-delete',
    'fui-dismiss',
    'fui-edit',
    'fui-filter',
    'fui-filter-dismiss',
    'fui-info',
    'fui-link',
    'fui-more-vertical',
    'fui-navigation',
    'fui-pin',
    'fui-pin-off',
    'fui-prohibited',
    'fui-reorder-dots-vertical',
    'fui-save',
    'fui-setting',
    'fui-sort-arrow-down',
    'fui-sort-arrow-up',
    'fui-sort-ascending',
    'fui-sort-descending',
    'fui-split-horizontal',
    'fui-split-vertical',
    'fui-table',
    'fui-table-edit',
    'fui-triangle-right',
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
              className={`fui ${icon}`}
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
