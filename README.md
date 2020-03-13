## Slickgrid-Universal

This is a monorepo project (using Lerna) that regroups a few packages under a single repository. The goal is to create a Common package that is framework agnostic and can be used by any other Frameworks. There are also some packages, like backend services (OData, GraphQL) that now all user requires and are better handled in a monorepo structure. 

### Why create this monorepo?
You might be wondernig why was this monorepo created?
1. removes lot of duplicate code that existed in both [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) (over 80% were the same code and that is not very DRY).
2. removes any Services that not all user want (OData, GraphQL, ...)
3. framework agnostic, we could add more frameworks in the future
   - anyone who wish to go that route, please contact me by opening an issue

### Framework using this monorepo
This a Work in Progress, eventually [Angular-Slickgrid](https://github.com/ghiscoding/Angular-Slickgrid) and [Aurelia-Slickgrid](https://github.com/ghiscoding/aurelia-slickgrid) will be rewritten to use this monorepo and have shared common code. 

However, this project is built with a Vanilla Implementation (no associated to any framework) and that is what the UI will be tested with. The Vanilla bundle is also used in our SalesForce (with Lighning Web Component) hence the creation of this monorepo.

The main packages structure is the following
- `@slickgrid-universal/common` where are commonly used Services/Formatters/Editors/... are created
  - this can then be used by any Framework (Angular, Aurelia, Vanilla, ...)
- `@slickgrid-universal/vanilla-bundle` is a vanilla implementation (no framework)
- `slickgrid-universal/vanilla-bundle-examples` uses public packages for demo purposes (standalone, not a public package)

### Installation
To get going with this monorepo, you will need to clone the repo and then follow the steps below

1. Lerna Bootstrap
Run it **only once**, this will install all dependencies and add necessary monorepo symlinks
```bash
npm run bootstrap
```

2. Build
To get started you must also run (also once) an initial build so that all necessary `dist` are created for all the packages to work together.
```bash
npm run build
```

3. Run Dev (Vanilla Implementation)
There is a Vanilla flavor implementation in this monorepo, vanilla means that it is not associated to any framework in other words it is plain TypeScript without being bound to any framework. The implementation is very similar to Angular and Aurelia, it could be used to implement other frameworks. 

Run the following command
```bash
npm run dev:watch
```

##### Run Unit Tests
To run all packages Jest unit test, you can run this command
```bash
npm run test

# or as a watch
npm run test:watch
```
