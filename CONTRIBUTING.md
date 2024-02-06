# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please start by consulting the project [Documentation](https://ghiscoding.gitbook.io/slickgrid-universal/) website. Once that is done and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

Before accepting any Pull Request, we need to make sure that you followed the step shown below.

_When we mention `VSCode`, we mean `Visual Studio Code` editor which can be downloaded [here](https://code.visualstudio.com)_

### Steps

1. clone the lib:
   - `git clone https://github.com/ghiscoding/slickgrid-universal/`
2. install with **pnpm** from the root:
   - `pnpm install` OR `npx pnpm install`
3. run Linter script (or simply execute step 5.)
  - `pnpm lint`
4. run a full TypeScript (TSC) build (this will also run Biome Lint & Format)
   - `pnpm build` OR `npx pnpm build`
5. add/run Vitest unit tests (make sure to run the previous steps first):
   - `pnpm test` (watch mode)
   - `pnpm test:coverage` (full test coverage)
6. after achieving step 2 to 5, then the final step would be to create the Pull Request...