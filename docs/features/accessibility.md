# Accessibility (A11y) in SlickGrid Universal

SlickGrid Universal is committed to providing accessible data grids for all users, including those using assistive technologies. This document outlines the accessibility features, keyboard navigation, ARIA attributes, and best practices for building inclusive grid experiences.

## Accessibility Features

- **Keyboard Navigation**: Full support for navigating the grid using keyboard only (Tab, Arrow keys, Enter, Space, etc.).
- **ARIA Roles & Attributes**: Proper ARIA roles (e.g., `grid`, `row`, `columnheader`, `cell`) and attributes are applied to grid elements for screen reader compatibility.
- **Focus Management**: Logical focus order and visible focus indicators for all interactive elements.
- **Checkbox & Selection**: Accessible checkboxes in header and rows, with correct labeling and keyboard toggling.
- **Column Menus & Plugins**: Menus and plugins are accessible via keyboard and screen readers.
- **Announcements**: Important grid changes (like selection or sorting) are announced to assistive technologies where possible.

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

*Note: Some shortcuts may depend on grid configuration or plugins.*

## ARIA Roles & Attributes

- The grid root uses `role="grid"`.
- Rows use `role="row"`.
- Header cells use `role="columnheader"`.
- Data cells use `role="gridcell"`.
- Checkboxes and interactive elements have appropriate `aria-checked`, `aria-label`, and `tabindex` attributes.
- Live regions or announcements are used for dynamic updates (where supported).

## Best Practices

- Ensure all custom cell editors and plugins are keyboard accessible.
- Use semantic HTML and ARIA attributes for any custom controls.
- Test with screen readers (NVDA, JAWS, VoiceOver) and keyboard-only navigation.
- Avoid using color alone to convey information; provide text or icon alternatives.
- Keep focus indicators visible and clear.

## Framework Notes

- All framework wrappers (Angular, React, Vue, Aurelia) inherit these accessibility features.
- If you extend or customize the grid, follow the same accessibility patterns.

## Resources

- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM: ARIA Landmarks and Roles](https://webaim.org/techniques/aria/)
- [MDN: ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles)

---

If you have suggestions or find accessibility issues, please open an issue or pull request to help us improve!
