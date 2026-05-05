# Plan: Set up CI workflow

## Context

This issue creates the GitHub Actions CI pipeline. There is no `.github/workflows/` config yet (only issue templates). All toolchain scripts already exist: `pnpm lint`, `pnpm test:run`, `pnpm build`.

The workflow must:

- Trigger on push to `main` and on pull requests targeting `main`
- Run steps in order: lint → type-check → test → build
- Fail fast (default GitHub Actions behaviour — no extra config needed)
- Surface as a status check on PRs automatically

Key constraint: pnpm must be set up explicitly on the GitHub runner. `--frozen-lockfile` prevents lockfile drift in CI. A dedicated `tsc -b --noEmit` step runs before build so type errors are attributed to the right step (even though `pnpm build` also runs tsc internally).

Files involved:

- `.github/workflows/ci.yml` — new file, the entire deliverable for this issue

## Tasks

### 1. Create the CI workflow

Create `.github/workflows/ci.yml` with a single job (`ci`) running on `ubuntu-latest`.

Triggers:

- `push` to `main`
- `pull_request` targeting `main`

Steps in order:

1. `actions/checkout@v4`
2. `pnpm/action-setup@v4` with `version: 10` — must come before setup-node so pnpm cache can be resolved
3. `actions/setup-node@v4` with `node-version: 'lts/*'` and `cache: 'pnpm'`
4. `pnpm install --frozen-lockfile`
5. `pnpm lint`
6. `pnpm exec tsc -b --noEmit`
7. `pnpm test:run`
8. `pnpm build`

Test cases: none — workflow correctness is verified by observing a green Actions run after pushing to main.

What to implement:

- `.github/workflows/ci.yml` exists and is valid YAML
- Pushing to main triggers the workflow and all steps pass

Commit: `chore: add CI workflow (#4)`
