export function resizeColumn(header: string, delta: number) {
  return cy.get(`${header} .slick-resizable-handle`).then(($handle) => {
    const handle = $handle[0] as HTMLElement;
    const column = handle.closest('.slick-header-column') as HTMLElement;
    const initialWidth = parseFloat(column.style.width);
    const rect = handle.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const startY = rect.top + rect.height / 2;
    const win = handle.ownerDocument.defaultView!;

    handle.dispatchEvent(new win.MouseEvent('mousedown', { bubbles: true, button: 0, buttons: 1, clientX: startX, clientY: startY }));
    win.document.body.dispatchEvent(
      new win.MouseEvent('mousemove', { bubbles: true, buttons: 1, clientX: startX + delta, clientY: startY })
    );
    win.document.body.dispatchEvent(new win.MouseEvent('mouseup', { bubbles: true, button: 0, clientX: startX + delta, clientY: startY }));

    return cy
      .get(header)
      .should(($column) => expect(parseFloat($column[0].style.width)).to.be.closeTo(initialWidth + delta, 1))
      .then(() => initialWidth);
  });
}
