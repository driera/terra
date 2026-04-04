# CLAUDE.md

> Read this at the start of every session.

## Project

**Terra** — Draw geospatial shapes, explore them in 3D terrain, and share them — no account required.

`WORKFLOW_VERSION: forge@latest`

---

## Session start

1. Read this file
2. Check [GitHub Projects](https://github.com/users/driera/projects/2) for the current sprint
3. Pick the next issue, run `/explore-issue <NNN>`

---

## Workflow loop

```
explore-issue → plan → implement → review
```

Work artifacts per issue live in `sessions/NNN-issue-title/`:

- `context.md` — problem space, edge cases, architecture, components, data flow
- `plan.md` — ordered, testable tasks

---

## Commit convention

```
type: short imperative description
```

Types: `feat`, `fix`, `test`, `docs`, `refactor`, `chore`, `a11y`, `dx`

Examples:

```
feat: add drawing toolbar with polygon mode
a11y: implement keyboard navigation for map controls
docs: document terrain view approach
```

---

## Principles

- **TDD** — tests before or alongside implementation, always
- **Documentation-first** — README and issues written before code
- **Short, intentional commits** — each commit tells a story
- **Clean code + functional patterns** — no shortcuts for speed
