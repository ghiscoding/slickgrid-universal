## Custom Menu Slots - Rendering

All menu plugins (Header Menu, Cell Menu, Context Menu, Grid Menu) support **cross-framework compatible slot rendering** for custom content injection in menu items. This is achieved through the `slotRenderer` callback at the item level combined with an optional `defaultItemRenderer` at the menu level.

### Core Concept

Each menu item can define a `slotRenderer` callback function that receives the item and args, and returns either an HTML string or an HTMLElement. This single API works uniformly across all menu plugins.

### Slot Renderer Callback

```typescript
slotRenderer?: (item: any, args: any, event?: Event) => string | HTMLElement
```

- **item** - The menu item object containing command, title, iconCssClass, etc.
- **args** - The callback args providing access to grid, column, dataContext, and other context
- **event** - Optional DOM event passed during click handling (allows `stopPropagation()`)

### Basic Example - HTML String Rendering

```typescript
const menuItem = {
  command: 'custom-command',
  title: 'Custom Action',
  iconCssClass: 'mdi mdi-star',
  // Return custom HTML string for the entire menu item
  slotRenderer: () => `
    <div class="custom-menu-item">
      <i class="mdi mdi-star"></i>
      <span>Custom Action</span>
      <span class="badge">NEW</span>
    </div>
  `
};
```

### Advanced Example - HTMLElement Objects

```typescript
// Create custom element with full DOM control
const menuItem = {
  command: 'notifications',
  title: 'Notifications',
  // Return HTMLElement for more control and event listeners
  slotRenderer: (item, args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    
    const icon = document.createElement('i');
    icon.className = 'mdi mdi-bell';
    icon.style.marginRight = '8px';
    
    const text = document.createElement('span');
    text.textContent = item.title;
    
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = '5';
    badge.style.marginLeft = 'auto';
    
    container.appendChild(icon);
    container.appendChild(text);
    container.appendChild(badge);
    
    return container;
  }
};
```

### Default Menu-Level Renderer

Set a `defaultItemRenderer` at the menu option level to apply to all items (unless overridden by individual `slotRenderer`):

```typescript
const menuOption = {
  // Apply this renderer to all menu items (can be overridden per item)
  defaultItemRenderer: (item, args) => {
    return `
      <div style="display: flex; align-items: center; gap: 8px;">
        ${item.iconCssClass ? `<i class="${item.iconCssClass}" style="font-size: 18px;"></i>` : ''}
        <span style="flex: 1;">${item.title}</span>
      </div>
    `;
  },
  commandItems: [
    {
      command: 'action-1',
      title: 'Action One',
      iconCssClass: 'mdi mdi-check',
      // This item uses defaultItemRenderer
    },
    {
      command: 'custom',
      title: 'Custom Item',
      // This item overrides defaultItemRenderer with its own slotRenderer
      slotRenderer: () => `
        <div style="color: #ff6b6b; font-weight: bold;">
          Custom rendering overrides default
        </div>
      `
    }
  ]
};
```

### Menu Types & Configuration

The `slotRenderer` and `defaultItemRenderer` work identically across all menu plugins:

#### Header Menu
```typescript
const columnDef = {
  id: 'name',
  header: {
    menu: {
      defaultItemRenderer: (item, args) => `<div>${item.title}</div>`,
      commandItems: [
        {
          command: 'sort',
          title: 'Sort',
          slotRenderer: () => '<div>Custom sort</div>'
        }
      ]
    }
  }
};
```

#### Cell Menu
```typescript
const columnDef = {
  id: 'action',
  cellMenu: {
    defaultItemRenderer: (item, args) => `<div>${item.title}</div>`,
    commandItems: [
      {
        command: 'edit',
        title: 'Edit',
        slotRenderer: (item, args) => `<div>Edit row ${args.dataContext.id}</div>`
      }
    ]
  }
};
```

#### Context Menu
```typescript
const gridOptions = {
  enableContextMenu: true,
  contextMenu: {
    defaultItemRenderer: (item, args) => `<div>${item.title}</div>`,
    commandItems: [
      {
        command: 'export',
        title: 'Export',
        slotRenderer: () => '<div>📊 Export data</div>'
      }
    ]
  }
};
```

#### Grid Menu
```typescript
const gridOptions = {
  enableGridMenu: true,
  gridMenu: {
    defaultItemRenderer: (item, args) => `<div>${item.title}</div>`,
    commandItems: [
      {
        command: 'refresh',
        title: 'Refresh',
        slotRenderer: () => '<div>🔄 Refresh data</div>'
      }
    ]
  }
};
```

### Framework Integration Examples

#### Vanilla JavaScript
```typescript
const menuItem = {
  command: 'custom',
  title: 'Action',
  slotRenderer: () => `
    <button onclick="console.log('clicked')">Click Me</button>
  `
};
```

#### Angular - Dynamic Components
```typescript
// In component class
const menuItem = {
  command: 'with-component',
  title: 'With Angular Component',
  slotRenderer: (item, args) => {
    // Create a placeholder element
    const placeholder = document.createElement('div');
    placeholder.id = `angular-slot-${Date.now()}`;
    
    // Schedule component creation for after rendering
    setTimeout(() => {
      const element = document.getElementById(placeholder.id);
      if (element) {
        const componentRef = this.viewContainerRef.createComponent(MyComponent);
        element.appendChild(componentRef.location.nativeElement);
      }
    }, 0);
    
    return placeholder;
  }
};
```

#### React - Using Hooks
```typescript
// Define menu item with slotRenderer
const menuItem = {
  command: 'with-react',
  title: 'With React Component',
  slotRenderer: (item, args) => {
    const container = document.createElement('div');
    container.id = `react-slot-${Date.now()}`;
    
    // Schedule component render for after menu renders
    setTimeout(() => {
      const element = document.getElementById(container.id);
      if (element) {
        ReactDOM.render(<MyComponent data={args} />, element);
      }
    }, 0);
    
    return container;
  }
};
```

#### Vue - Using createApp
```typescript
// Define menu item with slotRenderer
const menuItem = {
  command: 'with-vue',
  title: 'With Vue Component',
  slotRenderer: (item, args) => {
    const container = document.createElement('div');
    container.id = `vue-slot-${Date.now()}`;
    
    // Schedule component mount for after menu renders
    setTimeout(() => {
      const element = document.getElementById(container.id);
      if (element && !element._appInstance) {
        const app = createApp(MyComponent, { data: args });
        app.mount(element);
        element._appInstance = app;
      }
    }, 0);
    
    return container;
  }
};
```

### Real-World Use Cases

#### 1. Add Keyboard Shortcuts
```typescript
{
  command: 'copy',
  title: 'Copy',
  iconCssClass: 'mdi mdi-content-copy',
  slotRenderer: () => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="mdi mdi-content-copy" style="font-size: 18px;"></i>
      <span style="flex: 1;">Copy</span>
      <kbd style="background: #eee; border: 1px solid #ccc; border-radius: 2px; padding: 2px 4px; font-size: 10px;">Ctrl+C</kbd>
    </div>
  `
}
```

#### 2. Add Status Indicators
```typescript
{
  command: 'filter',
  title: 'Filter',
  iconCssClass: 'mdi mdi-filter',
  slotRenderer: () => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="mdi mdi-filter" style="font-size: 18px;"></i>
      <span style="flex: 1;">Filter</span>
      <span style="width: 6px; height: 6px; border-radius: 50%; background: #44ff44; box-shadow: 0 0 4px #44ff44;"></span>
    </div>
  `
}
```

#### 3. Add Dynamic Content Based on Context
```typescript
{
  command: 'edit-row',
  title: 'Edit Row',
  slotRenderer: (item, args) => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="mdi mdi-pencil" style="font-size: 18px;"></i>
      <span>Edit Row #${args.dataContext?.id || 'N/A'}</span>
    </div>
  `
}
```

#### 4. Add Interactive Elements
```typescript
{
  command: 'toggle-setting',
  title: 'Auto Refresh',
  slotRenderer: (item, args, event) => {
    const container = document.createElement('label');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    container.style.marginRight = 'auto';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.addEventListener('change', (e) => {
      // Prevent menu item click from firing when toggling checkbox
      event?.stopPropagation?.();
      console.log('Auto refresh:', checkbox.checked);
    });
    
    const label = document.createElement('span');
    label.textContent = item.title;
    
    container.appendChild(label);
    container.appendChild(checkbox);
    return container;
  }
}
```

#### 5. Add Badges and Status Labels
```typescript
{
  command: 'export-excel',
  title: 'Export as Excel',
  slotRenderer: (item, args) => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="mdi mdi-file-excel-outline"></i>
      <span style="flex: 1;">${item.title}</span>
      <span style="background: #44ff44; color: #000; padding: 2px 4px; border-radius: 3px; font-size: 9px; font-weight: bold;">RECOMMENDED</span>
    </div>
  `
}
```

#### 6. Gradient and Styled Icons
```typescript
{
  command: 'advanced-export',
  title: 'Advanced Export',
  slotRenderer: (item, args) => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.alignItems = 'center';
    container.style.gap = '8px';
    
    const iconDiv = document.createElement('div');
    iconDiv.style.width = '20px';
    iconDiv.style.height = '20px';
    iconDiv.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    iconDiv.style.borderRadius = '4px';
    iconDiv.style.display = 'flex';
    iconDiv.style.alignItems = 'center';
    iconDiv.style.justifyContent = 'center';
    iconDiv.style.color = 'white';
    iconDiv.style.fontSize = '12px';
    iconDiv.innerHTML = '📊';
    
    const textSpan = document.createElement('span');
    textSpan.textContent = item.title;
    
    container.appendChild(iconDiv);
    container.appendChild(textSpan);
    return container;
  }
}
```

### Notes and Best Practices

- **HTML strings** are inserted via `innerHTML` - ensure content is sanitized if user-provided
- **HTMLElement objects** are appended directly - safer for dynamic content and allows event listeners
- **Cross-framework compatible** - works in vanilla JS, Angular, React, Vue, Aurelia using the same API
- **Priority order** - Item-level `slotRenderer` overrides menu-level `defaultItemRenderer`
- **Accessibility** - Include proper ARIA attributes when creating custom elements
- **Event handling** - Call `event.stopPropagation()` in interactive elements to prevent menu commands from firing
- **Default fallback** - If neither `slotRenderer` nor `defaultItemRenderer` is provided, the default icon + text rendering is used
- **Performance** - Avoid heavy DOM manipulation inside renderer callbacks (they may be called multiple times)
- **Event parameter** - The optional `event` parameter is passed during click handling and allows you to control menu behavior
- **All menus supported** - This API works uniformly across Header Menu, Cell Menu, Context Menu, and Grid Menu

### Styling Custom Menu Items

```css
/* Example CSS for styled menu items */
.slick-menu-item {
  padding: 4px 8px;
}

.slick-menu-item div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slick-menu-item kbd {
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  padding: 2px 6px;
  font-size: 11px;
  font-family: monospace;
  color: #666;
}

.slick-menu-item .badge {
  background: #ff6b6b;
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: bold;
  white-space: nowrap;
}

.slick-menu-item:hover {
  background: #f5f5f5;
}

.slick-menu-item.slick-menu-item-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Migration from Static Rendering

**Before (Static HTML Title):**
```typescript
{
  command: 'action',
  title: 'Action ⭐',  // Emoji embedded in title
  iconCssClass: 'mdi mdi-star'
}
```

**After (Custom Rendering):**
```typescript
{
  command: 'action',
  title: 'Action',
  slotRenderer: () => `
    <div style="display: flex; align-items: center; gap: 8px;">
      <i class="mdi mdi-star" style="font-size: 18px;"></i>
      <span style="flex: 1;">Action</span>
      <span style="font-size: 18px;">⭐</span>
    </div>
  `
}
```

### Error Handling

When creating custom renderers, handle potential errors gracefully:

```typescript
{
  command: 'safe-render',
  title: 'Safe Render',
  slotRenderer: (item, args) => {
    try {
      if (args?.dataContext?.status === 'error') {
        return `<div style="color: red;">❌ Error loading</div>`;
      }
      return `<div>✓ Data loaded</div>`;
    } catch (error) {
      console.error('Render error:', error);
      return '<div>Render error</div>';
    }
  }
}
```
