import { describe, expect, it } from 'vitest';
import type { GridOption } from '../../interfaces/index.js';
import { ViewportMgr } from '../viewportManager.js';

describe('ViewportMgr', () => {
  it('should ignore optional layout operations before a band exists', () => {
    const manager = new ViewportMgr(document.createElement('div'));

    manager.ensureFooter({ createFooterRow: true } as GridOption);
    manager.attachRight(false);
    manager.detachRight();

    expect(manager.right).toBeUndefined();
  });

  it('should create, reuse, attach, and detach a complete RTL right band', () => {
    const container = document.createElement('div');
    const manager = new ViewportMgr(container);
    const options = {
      createFooterRow: true,
      rtl: true,
      showColumnHeader: true,
      showFooterRow: true,
      showHeaderRow: true,
      showTopPanel: true,
    } as GridOption;

    const right = manager.ensureRight(options);
    expect(right.header.style.right).toBe('-1000px');
    expect(manager.ensureRight(options)).toBe(right);
    manager.ensureFooter(options);
    manager.attachRight(true);
    expect(container.children).toHaveLength(3);

    manager.detachRight();
    expect(container.children).toHaveLength(0);
  });
});
