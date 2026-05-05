# Plan: Set up GitHub Pages deploy

## Context

This issue publishes the app to GitHub Pages at `driera.github.io/terra`. CI is already in place (#4). Two things need to change:

1. `vite.config.ts` must set `base: '/terra/'` — without this, Vite produces asset paths like `/assets/index-xxx.js` which 404 on GitHub Pages (the app is served at a subpath, not the root).
2. `.github/workflows/ci.yml` gains a `deploy` job that runs after the existing `ci` job passes on pushes to main.

Files involved:

- `vite.config.ts` — add `base: '/terra/'`
- `.github/workflows/ci.yml` — add `deploy` job

## Tasks

### 1. Enable GitHub Pages via CLI

Configure the repo to deploy Pages from GitHub Actions using the GitHub API:

```bash
gh api repos/driera/terra/pages \
  --method POST \
  -f build_type=workflow
```

If the command fails with a 409 (Pages already enabled), use `PUT` instead of `POST` to update the existing configuration.

Test cases: none — verified by checking `Settings → Pages` in the GitHub UI.

What to implement:

- GitHub Pages is configured to deploy from GitHub Actions

### 2. Set Vite base path for GitHub Pages

Add `base: '/terra/'` to `vite.config.ts`. This ensures the built `dist/index.html` references assets at `/terra/assets/...` instead of `/assets/...`.

Test cases:

- `pnpm build` succeeds
- Built `dist/index.html` references assets with `/terra/` prefix

What to implement:

- `vite.config.ts` has `base: '/terra/'` in the config object

### 2. Add deploy job to ci.yml

Add a `deploy` job to `.github/workflows/ci.yml` after the existing `ci` job.

Job configuration:

- `needs: ci` — only runs if CI passes
- `if: github.ref == 'refs/heads/main'` — skips on PRs
- `permissions: pages: write, id-token: write, contents: read`
- `environment: name: github-pages, url: ${{ steps.deployment.outputs.page_url }}`

Steps:

1. `actions/checkout@v4`
2. `pnpm/action-setup@v4` with `version: 10`
3. `actions/setup-node@v4` with `node-version: 'lts/*'` and `cache: 'pnpm'`
4. `pnpm install --frozen-lockfile`
5. `pnpm build`
6. `actions/configure-pages@v4`
7. `actions/upload-pages-artifact@v3` with `path: dist`
8. `actions/deploy-pages@v4` with `id: deployment`

Test cases: none — verified by observing a successful workflow run after pushing to main.

What to implement:

- `ci.yml` has a `deploy` job that passes on push to main
- App is accessible at `driera.github.io/terra`

Commit: `chore: add GitHub Pages deploy workflow (#5)`
