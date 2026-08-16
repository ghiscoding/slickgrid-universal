# GitHub Copilot instructions

Follow the repository guidance in `AGENTS.md` when it is available. These additional rules apply to Copilot:

- Keep responses and commit messages concise, while remaining clear.
- Before changing shared code under `packages/`, consider its impact on Angular, React, Vue, and Aurelia.
- Preserve backward compatibility and avoid unnecessary API changes.
- Add or update tests for behavior changes.
- Do not modify generated `dist/` output unless explicitly requested.
- Use pnpm commands from `package.json`; do not invent replacement scripts.
