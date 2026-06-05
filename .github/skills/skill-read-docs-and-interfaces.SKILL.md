# Skill: Read Docs & Interfaces

Purpose
- Guide an AI assistant where to look for documentation and TypeScript interfaces in this slickgrid-universal monorepo.

Behavior summary
- When asked to find information, prefer human-written docs first, then fall back to code (TypeScript interfaces and types) when docs are missing or insufficient. The AI may choose to read interfaces first for highly technical type questions.

Search order (recommended)
1. Root docs: `docs/` — vanilla JS/TS documentation, how-tos, features, and API overviews.
2. Package READMEs: `packages/*/README.md` — package-specific usage and examples (including `packages/web-mcp/README.md`).
3. Framework docs: `frameworks/*/docs/` — framework-specific implementations and integration notes (Angular, React, Vue, Aurelia).
4. Demos and demo READMEs: `demos/*/` — runnable examples and demo-specific notes (often show how services are registered).
5. Tests and coverage notes: `test/` and `test/vitest-coverage/` — can provide practical usage and uncovered code paths.
6. Code (interfaces and types): `packages/**/src/**/*.ts`, `frameworks/**/src/**/*.ts` — read exported `interface`, `type`, class public methods and JSDoc comments.

Useful file patterns and places to check
- Project root: `README.md`, `CHANGELOG.md`, `docs/**`
- Core package: `packages/common` — primary interfaces and shared types used across packages.
- Optional packages (external resources/plugins): `packages/excel-export`, `packages/pdf-export`, `packages/graphql`, `packages/odata`, `packages/web-mcp`, etc. — check each `README.md` and `src/` for exported APIs.
- Framework wrappers: `frameworks/angular-slickgrid`, `frameworks/slickgrid-react`, `frameworks/slickgrid-vue`, `frameworks/aurelia-slickgrid` — check `docs/` in each framework folder, then `src/` for public adapters.
- Demos: `demos/vanilla`, `demos/angular`, `demos/react`, `demos/vue`, `demos/aurelia` — example files often show how to instantiate services like `WebMcpService`.

How to choose between docs vs interfaces
- Use docs first for conceptual questions, feature overviews, and examples. Docs will often mention cross-package considerations and recommended usage.
- Use interfaces/types first for precise API shapes, parameter and return types, required fields, and method names.
- If the question is about behavior (how-to, examples, backwards-compatibility), prefer docs. If the question is about typing, method signatures or exact option names, prefer reading the TypeScript sources.

Practical search tips for the AI
- Look for keywords in docs: "WebMCP", "WebMcpService", "ExternalResource", "applyGridState", "getStructuredSchema".
- Grep/search patterns to run programmatically: `packages/**/src/**/*.{ts,tsx}`, `frameworks/**/docs/**`, `docs/**`, `packages/*/README.md`, `demos/**/src/**`.
- When reading TypeScript, focus on exported members (`export interface`, `export class`, `export type`, `export function`). Prefer the package's public entry (`packages/<name>/src/index.ts` or `packages/<name>/README.md`) for the public surface.

Fallback and completeness
- If docs and package READMEs don't answer the question, traverse `packages/*/src` and `frameworks/*/src` to collect all exported interfaces and classes related to the topic.
- For compatibility questions, check migration docs under `docs/migrations/` and changelogs at package roots.

Example workflow
1. Question: "How does WebMCP apply filters?"
2. Check `docs/ai/ai-toolkit.md` for a conceptual overview and examples.
3. If specifics needed, open `packages/web-mcp/src/web-mcp.service.ts` and `packages/common/src/*` to inspect `applyGridState` and related interfaces (`FilterService`, `CurrentFilter`).

Notes for implementers
- Keep this skill up to date when adding new top-level docs or moving package READMEs. The monorepo structure is stable but new packages may be added.
