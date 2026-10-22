# Virtual Scroll Rendering Performance Audit (v11)

Goal: remove grid blanking/lag when jumping far on very large datasets (e.g. 500K rows, drag scrollbar to ~25%), comparable to AG Grid.

## Scenario & Method

- Angular demo `http://localhost:4300/#/example18` (500K rows button), also Vanilla Example 03.
- Measurement driven by the Playwright MCP browser (not the user's Chrome):
  1. Click "500K rows", wait ~8s.
  2. 40 large jumps: set `.slick-viewport` `scrollTop` to `max * ((i * 0.37) % 1)`, wait 2 animation frames per jump.
  3. Scroll handler duration = capture-phase `scroll` listener on `document` (start) to a target listener on the viewport registered after SlickGrid's (end).
  4. CPU profile via CDP: `page.context().newCDPSession(page)` then `Profiler.enable`, `setSamplingInterval(100)`, `start`/`stop`; aggregate self/inclusive time per function name.

```js
// scroll handler timing (inside page.evaluate)
const viewport = document.querySelector('.slick-viewport');
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
let t0 = 0; const durations = [];
document.addEventListener('scroll', () => (t0 = performance.now()), true);
viewport.addEventListener('scroll', () => durations.push(performance.now() - t0));
const max = viewport.scrollHeight - viewport.clientHeight;
for (let i = 0; i < 40; i++) { viewport.scrollTop = Math.round(max * ((i * 0.37) % 1)); await nextFrame(); await nextFrame(); }
```

## Results (Angular Example 18, 500K rows, 40 jumps)

| Scroll handler per jump | Before | Date fast path off (plain-text shortcut on) | All changes |
| --- | --- | --- | --- |
| Median | 57.7 ms | 43.4 ms | 12.5 ms |
| p90 | 128 ms | 59.2 ms | 15.5 ms |
| Max | 199.7 ms | 121.1 ms | 19.6 ms |

| CPU per 40 jumps (inclusive) | Before | All changes |
| --- | --- | --- |
| `render()` | 3,431 ms | 231 ms |
| Tempo `format()` (date formatters) | ~1,625 ms | 0 |
| `DOMPurify.sanitize()` + HTML parse | ~1,230 ms | ~109 ms |

Before the fixes, the grid's own row/cell code was cheap; formatter work dominated.

## Changes Kept

1. `scrollRenderThrottling` default `10` -> `0` (`slickGrid.ts`). With `0`, large vertical jumps render synchronously in `_handleScroll()`; a value > 0 keeps the old timer-throttled path. Removed the blank frames (timer-deferred render painted an empty frame, especially on 120/144 Hz screens).
2. `formatDate()` in `packages/common/src/services/dateUtils.ts`: numeric-token fast path (`YYYY YY M MM D DD H HH h hh mm ss A a` + separators) via one regex `replace()`; any other token (`MMM`, `[...]`, `ISO8601`, single `m`/`s`, ...) falls back to Tempo. Cache is per format string (boolean), not per date, so memory is negligible. Used by `formatDateByFieldType()` and `parseDateByIOFormats()` (`formatterUtilities.ts`). Largest single gain (~30 ms per jump).
3. `applyHtmlToElement()` (`packages/common/src/core/utils.ts`): strings without `<` and `&` go straight to `textContent` (no sanitizer, no HTML parser). `&` is excluded because entities need parsing.
4. `onBeforeAppendCell` removed entirely (v11 breaking change, documented in all 5 `migration-to-11.x.md` and removed from `available-events.md`, Angular output, React/Vue props). It was published through the PubSub service as a DOM `CustomEvent` for every rendered cell (~540 per jump), and was already deprecated upstream in favor of formatter `addClasses`. Nothing in the repo used it.
5. `getParentRowSpanByCell()`: early return when the column has no rowspan cache (previously allocated `new Set()` + `Array.from()` per cell, even without rowspan).

## Tried & Dropped

- `formatCellValue()` (formatter without per-cell wrapper closure, row metadata reuse) and `EventPubSubService` event-name memoization: reverted to keep the diff minimal; re-measured after removal with no regression (median 12.7 ms, p90 15.2 ms, max 20.1 ms).
- Vertical proxy scrollbar (AG Grid style overlay over the native vertical scrollbar to commit scroll + rows in one main-thread task): no visible difference once the throttle was removed, plus thumb "fighting" from delayed scroll echoes. Removed.
- Option B (`publishCellRenderEvents` grid option) superseded by removing `onBeforeAppendCell`.

## Not Done / Future

- DOMPurify: ~77 ms of the remaining ~109 ms per 40 jumps is DOMPurify re-parsing its config on every `sanitize(html, config)` call (`DOMPurify.setConfig()` once would avoid it, but it is app-global). Deferred: DOMPurify will be replaced by the native Sanitizer API in v12 (waiting on Safari support).
- Render visible rows first and buffer rows on the next animation frame for jumps > viewport height (would roughly halve per-jump DOM work).
- CSS containment on `.slick-row` (`contain: layout style`), needs visual checks (hover shadow, rowspan overflow).
- Row DOM recycling: biggest potential gain, highest risk (formatters, plugins, rowspan, docking).
- Memory: an 11 GB Chrome tab seen in the Vanilla demo was not reproduced in Angular (677 MB); likely repeated 500K loads / HMR in a long-lived tab. Vanilla router `disposeAll()` does dispose previous view models.

## Progress / Open Items

- Unit tests added: `formatDate()` vs Tempo output, `applyHtmlToElement()` plain-text/`&` paths, `hasStringDateColumns()`, `scrollRenderThrottling` sync/throttled paths. Full Vitest suite (6225) + Angular suite (133) pass; changed files at 100% lines.
- Tempo quirk found by tests: single `m`/`s` tokens are padded or not depending on the surrounding format, so `formatDate()` leaves them to Tempo (only `mm`/`ss` use the fast path).
- `preParseDateColumns` console warning now only shows when a date column holds strings (`hasStringDateColumns()` in all 5 wrappers).
- Pending: `pnpm lint`, `pnpm prettier:check`, Cypress (`pnpm cypress:ci`, `pnpm angular:cypress:ci`).
