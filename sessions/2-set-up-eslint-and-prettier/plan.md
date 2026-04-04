# Plan: Set up ESLint and Prettier

## Context

This issue configures linting and formatting before any product code is written. The scaffold from #1 installed ESLint packages but never created `eslint.config.js` — `pnpm lint` currently fails with "no config file found". Prettier is not installed at all. Two dead public assets from the Vite scaffold (`public/icons.svg`, `public/favicon.svg`) are also removed here.

Files involved:

- `package.json` — scripts and devDependencies
- `eslint.config.js` — new file, ESLint 9 flat config
- `.prettierrc` — new file, Prettier options
- `public/icons.svg`, `public/favicon.svg` — deleted

Key constraint: `eslint-config-prettier` must be the **last** item in the ESLint config so it wins over any conflicting rules. ESLint 9 uses flat config format — no `.eslintrc`.

## Tasks

### 1. Install Prettier and eslint-config-prettier

Install the two missing devDependencies:

```
pnpm add -D prettier eslint-config-prettier
```

- `prettier` — standalone code formatter
- `eslint-config-prettier` — disables ESLint rules that conflict with Prettier output

Test cases: none — install only.

What to implement:

- Both packages appear in `package.json` devDependencies
- `pnpm-lock.yaml` updated

Commit: `chore: install prettier and eslint-config-prettier (#2)`

---

### 2. Create eslint.config.js

Create `eslint.config.js` in the project root using ESLint 9 flat config format.

Extend in this order (order matters — prettier must be last):

1. `@eslint/js` recommended
2. `typescript-eslint` recommended
3. `eslint-plugin-react-hooks` recommended rules
4. `eslint-plugin-react-refresh` — warn on non-component exports
5. `eslint-config-prettier` — disables conflicting rules

Target files: `**/*.{ts,tsx}`. Browser globals. Ignore `dist/`.

Test cases:

- `pnpm lint` exits 0 on the current codebase
- `pnpm lint` exits non-zero if a deliberate violation is introduced (e.g. unused variable)

What to implement:

- `eslint.config.js` exists and `pnpm lint` passes cleanly

### 3. Create .prettierrc and add format scripts

Create `.prettierrc` with sensible defaults. Suggested config:

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

Add to `package.json` scripts:

- `"format": "prettier --write ."`
- `"format:check": "prettier --check ."`

Add `.prettierignore` to exclude `dist/`, `node_modules/`, and `pnpm-lock.yaml`.

Test cases:

- `pnpm format:check` exits 0 on the current codebase (after running `pnpm format` once to normalise)
- `pnpm format:check` exits non-zero if a file has incorrect formatting

What to implement:

- `.prettierrc` exists with the above config
- `.prettierignore` exists
- `pnpm format` and `pnpm format:check` both work

### 4. Remove dead public assets

Delete `public/icons.svg` and `public/favicon.svg` — both are Vite boilerplate with no references in the codebase.

Test cases: none — deletion only.

What to implement:

- Both files removed
- `pnpm build` still exits 0

Commit: `chore: set up ESLint and Prettier (#2)`
