# Context: Set up GitHub Pages deploy

## Problem

No deploy pipeline exists. The app builds locally but isn't published anywhere. It can't be accessed publicly.

### Problem Space

CI is in place (#4). This issue adds a deploy job that runs after CI passes on pushes to main. The deploy target is GitHub Pages, which serves the app at `driera.github.io/terra/`.

### Edge Cases

- Vite's default `base` is `/`, which produces absolute asset paths (`/assets/...`). GitHub Pages serves the app at a subpath (`/terra/`), so assets 404 without `base: '/terra/'` in `vite.config.ts`.
- The deploy job must not run on PRs — only on push to main. Enforced with `if: github.ref == 'refs/heads/main'`.
- GitHub Pages source must be set to "GitHub Actions" before the first deploy. Configured via `gh api repos/driera/terra/pages --method POST -f build_type=workflow` (use `PUT` if Pages is already enabled).

### Constraints

- Deploy only runs if CI passes — enforced via `needs: ci`
- GitHub Pages must be configured to deploy from GitHub Actions (not a branch)
- Uses GitHub's official deployment actions (`upload-pages-artifact`, `deploy-pages`)

## Solution

### Approach

Add a `deploy` job to the existing `.github/workflows/ci.yml`. It runs `needs: ci` so it only executes after CI passes. Single workflow file, clean job dependency, no cross-workflow complexity.

### Architecture

`ci.yml` gains a second job (`deploy`) that depends on the first (`ci`). On push to main, both jobs run sequentially. On PRs, only `ci` runs. GitHub's official Pages actions handle artifact upload and deployment.

### Components

- `.github/workflows/ci.yml` — add `deploy` job:
  - `needs: ci`
  - `if: github.ref == 'refs/heads/main'`
  - `permissions: pages: write, id-token: write, contents: read`
  - `environment: github-pages` (required for Pages OIDC token)
  - Steps: checkout → pnpm setup → node setup → install → build → `actions/configure-pages@v4` → `actions/upload-pages-artifact@v3` (uploads `dist/`) → `actions/deploy-pages@v4`
- `vite.config.ts` — add `base: '/terra/'`

### Dependencies

No new packages. GitHub-hosted Actions: `actions/configure-pages@v4`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`.

### Data Flow

Push to main → CI job passes → deploy job starts → Vite builds with `base: '/terra/'` → `dist/` uploaded as Pages artifact → GitHub Pages deploys → app live at `driera.github.io/terra`.

### Error Handling

- `needs: ci` blocks deploy if CI fails
- `if: github.ref == 'refs/heads/main'` prevents deploy on PR runs
- If Pages source not set to "GitHub Actions", deploy step fails with a clear GitHub error

### Testing

No automated tests. Verified by pushing to main and confirming `driera.github.io/terra` loads correctly.

## Open Questions

None.
