## Create a new SlickGrid‑Universal package

New packages in the slickgrid‑universal monorepo are typically created when adding a new optional **External Resource** (i.e. a plugin or component that integrates with the grid but is not part of the core). This skill documents the recommended steps and minimal references for doing so. Use `SlickEmptyWarningComponent` ([packages/empty-warning-component](packages/empty-warning-component)) as a simple reference implementation.

Key points
- New packages that integrate with the grid should implement the `ExternalResource` interface from `@slickgrid-universal/common`.
- Every package should provide an `init(grid: SlickGrid)` method. When you need services from `@slickgrid-universal/common`, use the second argument `init(grid: SlickGrid, containerService: ContainerService)` to obtain them.
- Available Services (examples) are listed in the vanilla bundle; see [packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts](packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts#L399-L414).

Quick checklist
- Create package folder under `packages/your-package-name/`.
- Add `package.json`, `tsconfig.json`, `src/` with an exported entry (e.g. `src/index.ts`).
- Implement an `ExternalResource` class (see example below).
- Add unit tests (Vitest) under `__tests__` or `src/__tests__`.
- Add the package to `pnpm-workspace.yaml` (if needed) and ensure the root `pnpm build` covers it.
- Any local dependency on another slickgrid-universal package must use `"workspace:*"` in `package.json` (e.g. `"@slickgrid-universal/common": "workspace:*"`).
- Configure TypeScript project references:
  - In the package's own `tsconfig.json`, add a `references` entry for each slickgrid-universal package it depends on, e.g. `"references": [{ "path": "../common" }]`.
  - In the monorepo root `tsconfig.packages.json`, add a reference entry pointing to the new package, e.g. `{ "path": "packages/your-new-package" }`.
- Add docs/README and (optionally) a demo under `demos/` or framework wrappers.
- Ensure Prettier / OXLint rules are satisfied and run `pnpm lint:fix` + `pnpm prettier:write` before committing.

Minimal package structure

- packages/your-new-package/
  - package.json
  - tsconfig.json
  - src/
    - index.ts
    - your-package.ts
  - README.md
  - __tests__/your-package.spec.ts

Example: ExternalResource implementation (TypeScript)

```ts
import type { ContainerService, ExternalResource, SlickGrid } from '@slickgrid-universal/common';

export class MyNewPackage implements ExternalResource {
  readonly pluginName = 'MyNewPackage';
  protected _grid!: SlickGrid;

  // Accepts either one or two args; the ContainerService allows access to shared services
  init(grid: SlickGrid, containerService?: ContainerService): void {
    this._grid = grid;
    // example: const translator = containerService?.get<TranslaterService>('TranslaterService');
  }

  // optional lifecycle hooks
  create?(): void {}
  dispose?(): void {}
}
```

Notes on `init` and services
- `init(grid: SlickGrid)` is always present for grid-facing plugins. If your package needs container-provided services, declare `init(grid: SlickGrid, containerService: ContainerService)` and access services with `containerService.get<T>('ServiceName')`.
- The canonical list of services used in the vanilla bundle can be inspected at: [packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts](packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts#L399-L414).

Testing and demos
- Add unit tests with Vitest following repository conventions. See `test/vitest.config.mts` and existing package tests for examples.
- Add a demo or example usage in `demos/vanilla` or framework-specific demos to validate integration.

Publishing (OIDC trusted publish)
- For the initial publish using a secure OIDC token, refer to [azu/setup-npm-trusted-publish](https://github.com/azu/setup-npm-trusted-publish).

References
- Reference implementation: [packages/empty-warning-component](packages/empty-warning-component) (`SlickEmptyWarningComponent`).
- Services list: [packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts](packages/vanilla-bundle/src/slick-vanilla-grid-bundle.ts#L399-L414).
- TypeScript project references: [tsconfig.packages.json](tsconfig.packages.json).
- OIDC publish action: https://github.com/azu/setup-npm-trusted-publish
