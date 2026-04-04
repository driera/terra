# Context: Set up ESLint and Prettier

## Problem

No linter or formatter is configured. `pnpm lint` fails entirely (no config file). Code quality and style are not enforced automatically.

### Problem Space

The scaffold from #1 installed ESLint-related packages (`@eslint/js`, `eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, `typescript-eslint`, `globals`) but never created `eslint.config.js`. Prettier is not installed at all. This issue creates the full linting and formatting setup before any product code is written.

Additionally, `public/icons.svg` and `public/favicon.svg` are dead boilerplate left over from the Vite scaffold — both will be removed here.

### Edge Cases

- ESLint and Prettier can have conflicting rules (e.g. both trying to enforce quote style). `eslint-config-prettier` must be the last item in the ESLint config's `extends` array so it wins.
- `pnpm format` writes files in place; `pnpm format:check` is the CI-safe variant that exits non-zero without writing.

### Constraints

- ESLint 9 flat config format (no legacy `.eslintrc`)
- React + TypeScript target
- Prettier runs independently — no `eslint-plugin-prettier`

## Solution

### Approach

ESLint flat config + Prettier as independent tools. `eslint-config-prettier` disables conflicting ESLint rules. Industry standard, clear separation of concerns, well-supported.

### Architecture

Two independent tools invoked via pnpm scripts:

- `pnpm lint` → ESLint (`eslint.config.js`)
- `pnpm format` → Prettier, writes in place
- `pnpm format:check` → Prettier, exits non-zero if files would change (used in CI)

No plugin that runs Prettier inside ESLint.

### Components

- `eslint.config.js` — flat config extending `@eslint/js`, `typescript-eslint`, `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`, and `eslint-config-prettier` (last, so it wins)
- `.prettierrc` — Prettier config (quotes, semicolons, trailing commas, print width)
- `package.json` — add `format` and `format:check` scripts

### Dependencies

New packages (devDependencies):

- `prettier` — code formatter
- `eslint-config-prettier` — disables ESLint rules that conflict with Prettier output

All other ESLint packages already installed from scaffold.

### Data Flow

Both tools run independently against the filesystem. No shared state. ESLint reads source files and reports violations. Prettier reads source files and rewrites them (or exits non-zero in check mode).

### Error handling

Both tools exit non-zero on failure — sufficient for CI. `eslint-config-prettier` prevents rule conflicts by design.

### Testing

No unit tests. Verification:

- `pnpm lint` exits 0 on the current codebase
- `pnpm format:check` exits 0 on the current codebase
- Manual spot check: both fail correctly on intentionally malformed input

## Open Questions

None.
