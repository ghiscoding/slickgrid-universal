# Filter audit disposition

Implemented and covered by focused regression tests:

- Cancel pending input debounce callbacks on clear, destroy, and immediate events.
- Preserve caller-owned autocomplete collections on destruction.
- Ignore stale select/autocomplete collection results after destruction or
  reinitialization, including skipping new collection watchers and Subjects.
  Invalid async collections still reject through the existing validation.
- Share async collection validation/rendering and FilterService argument creation.
- Obtain a column index only when formatter-based filtering needs it; remove the
  unused fallback lookup before the missing-column early return.

Candidates intentionally left unchanged in this patch:

- A persistent hierarchical-node lookup needs an explicit invalidation contract:
  callers can replace or mutate hierarchical data. No tree benchmark is included
  yet, so the proposed tree optimization is not validated or implemented.
- Moving search-term coercion entirely out of the per-row path could change
  behavior for direct calls with externally constructed or mutated filter
  arguments. This requires dedicated compatibility tests before changing it.
- Select/autocomplete Promise executor consolidation can change when init resolves
  relative to watcher installation. The lifecycle fix preserves the existing
  timing; the broader consolidation remains deferred.
- Date, slider, and input variants already share implementations. Retain those
  public classes and their extension points. Small mask/operator helpers and date
  handler extraction were not compelling enough to justify additional changes.

The before/after benchmark establishes a reproducible flat-data baseline, not a
complete performance investigation. Tree, formatter, multi-select, browser, and
typing-transition benchmarks remain outside the implemented harness. Date-range
filtering is the largest measured cost and warrants a separate profile.

The broader performance work is therefore still open. No claim is made that every
candidate from the initial audit has been implemented or that passing unit tests
proves absence of every regression across framework demos.
