# Accessibility (A11y) in Angular SlickGrid Universal

Angular SlickGrid Universal inherits all core accessibility features from the main package. This includes keyboard navigation, ARIA roles, focus management, and accessible plugins.

## Accessibility Features

- Keyboard navigation (Tab, Arrow keys, Enter, Space, etc.)
- ARIA roles and attributes for grid, rows, headers, and cells
- Focus indicators and logical tab order
- Accessible checkboxes and selection
- Announcements for important grid changes

## Keyboard Navigation

| Key                | Action                                      |
|--------------------|---------------------------------------------|
| Tab / Shift+Tab    | Move focus between grid and other controls  |
| Arrow Keys         | Navigate between cells                      |
| Enter              | Activate cell/editor or toggle checkbox     |
| Space              | Toggle selection (checkbox)                 |
| Home / End         | Jump to first/last cell in row              |
| Ctrl+Home/End      | Jump to first/last cell in grid             |
| Page Up / Down     | Scroll grid by page                         |

## ARIA Roles & Attributes

- `role="grid"` on the grid root
- `role="row"` on rows
- `role="columnheader"` on header cells
- `role="gridcell"` on data cells
- Proper `aria-checked`, `aria-label`, and `tabindex` on interactive elements

## Best Practices

- Ensure custom editors and plugins are accessible
- Use semantic HTML and ARIA for custom controls
- Test with screen readers and keyboard navigation
- Avoid color-only cues; provide text or icons
- Keep focus indicators visible

## Notes

- All Angular-specific features and wrappers follow these accessibility patterns.
- For custom Angular components, follow the same a11y guidelines.

---

For suggestions or issues, please open an issue or PR.