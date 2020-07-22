# Contributing

We'd love for you to contribute and to make this project even better than it is today! If this interests you, please begin by reading the project [Wiki documentation](https://github.com/ghiscoding/slickgrid-universal/wiki). Once you consulted them and you believe that you can help us with new features, improvement or even fixes then go ahead and submit a Pull Request.

When we mention `VSCode`, we mean `Visual Studio Code` editor which can be downloaded [here](https://code.visualstudio.com)

Before accepting any Pull Request, we need to make sure that you followed these steps:
1. Install `Yarn` globally since it is used in all `package.json` scripts and VSCode Tasks if you want to use them.
2. Have you tested all your changes with Jest?
3. Have you run the TypeScript Build?
   - you can run the build with `yarn run build` from the root of the project
4. If you did step 2 and 3, then the final step would be the Pull Request... but wait! For readability purposes, we would like you to only submit the relevant pieces of code that you changed. We are basically asking you to do a Build and make sure there's no errors (Yes please) but to not include the produced `dist` folder. We just want to see the real changes, nothing else (but we still want to make sure it Builds before creating a PR).