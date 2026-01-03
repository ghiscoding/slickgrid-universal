# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please start by consulting the project [Documentation](https://ghiscoding.gitbook.io/slickgrid-universal/) website. Once that is done and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

Before accepting any Pull Request, we need to make sure that you followed the steps shown below.

### <a name="submit-pr"></a> Submitting a PR

This project follows [GitHub's standard forking model](https://guides.github.com/activities/forking/). Please fork the project to submit pull requests.

### Steps

1. clone the lib (or your own fork copy):
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
6. after achieving step 2 to 5, then the final step would be to create a new branch and Pull Request...
   - create a new branch `git checkout -b your-branch-name`
   - create a new Pull Request
