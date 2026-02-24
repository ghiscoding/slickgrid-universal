# Accessibility (A11y) in Vue SlickGrid Universal

Vue SlickGrid Universal includes all core accessibility features, such as keyboard navigation, ARIA roles, and focus management.

## Accessibility Features

- Keyboard navigation (Tab, Arrow keys, Enter, Space, etc.)
- ARIA roles and attributes for grid, rows, headers, and cells
- Focus indicators and logical tab order
- Accessible checkboxes and selection
- Announcements for important grid changes

## Focus Outline Styling

The a11y focus outline can be customized using the SASS variable `$slick-focus-outline-color` or its CSS equivalent `--slick-focus-outline-color` (CSS custom property). This allows you to style the focus indicator to match your application's design.

**Note:** Header filters have their own box shadow styling and are styled separately.

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

- All Vue-specific features and wrappers follow these accessibility patterns.
- For custom Vue components, follow the same a11y guidelines.

---

For suggestions or issues, please open an issue or PR.