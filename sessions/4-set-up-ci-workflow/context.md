# Context: Set up CI workflow

## Problem

No CI is configured. Lint, type-check, tests, and build are not verified automatically on pull requests or pushes to main. Broken code can reach main undetected.

### Problem Space

All toolchain scripts are in place from issues #1–3: `pnpm lint`, `pnpm test:run`, `pnpm build`. This issue wires them into a GitHub Actions workflow that runs automatically on every PR and push to main.

### Edge Cases

- `pnpm build` already runs `tsc -b` internally, so type-checking is technically covered by the build step. A dedicated type-check step is still added before build so failures are attributed to the correct step in the Actions UI.
- `--frozen-lockfile` on install prevents accidental lockfile drift in CI.

### Constraints

- Trigger: push to `main` and pull_request targeting `main`
- Pipeline order: lint → type-check → test → build
- Fail-fast: default GitHub Actions behaviour — no extra config needed
- pnpm must be set up explicitly on the GitHub-hosted runner

## Solution

### Approach

Single job with sequential steps. Fail-fast is the default. Simple, cheap, correct for this project size. No parallel jobs needed.

### Architecture

One workflow file at `.github/workflows/ci.yml`. One job (`ci`) on `ubuntu-latest`. Steps run in sequence; any non-zero exit stops the job.

### Components

- `.github/workflows/ci.yml` — workflow file with steps:
  1. `actions/checkout@v4` — check out the repo
  2. `actions/setup-node@v4` (LTS) — set up Node
  3. `pnpm/action-setup@v4` — set up pnpm
  4. `pnpm install --frozen-lockfile` — install deps
  5. `pnpm lint` — lint
  6. `pnpm exec tsc -b --noEmit` — type-check (explicit, so failures are attributed correctly)
  7. `pnpm test:run` — run tests once
  8. `pnpm build` — production build

### Dependencies

None — GitHub-hosted Actions only.

### Data Flow

GitHub triggers workflow → runner checks out code → installs deps → runs each script in sequence → reports pass/fail as a commit status visible on PRs.

### Error Handling

Fail-fast is default GitHub Actions behaviour. No additional configuration needed. If any step fails, subsequent steps are skipped and the job is marked failed.

### Testing

No automated tests for the workflow itself. Verified by pushing to main and observing the Actions run.

## Open Questions

None.
