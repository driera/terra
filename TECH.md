# Tech

> Technical source of truth. Decisions made before any code was written.
> Updated as the stack evolves.

## Stack

| Area            | Decision       | Notes                  |
| --------------- | -------------- | ---------------------- |
| Language        | TypeScript     | Strict mode            |
| Runtime         | Browser        | Static site, no server |
| Framework       | React          |                        |
| Map library     | MapLibre GL JS |                        |
| Tile server     | MapTiler       | Default base map       |
| Package manager | pnpm           |                        |

## Toolchain

| Tool         | Decision          | Notes |
| ------------ | ----------------- | ----- |
| Linter       | ESLint            |       |
| Formatter    | Prettier          |       |
| Type checker | TypeScript strict |       |
| Test runner  | Vitest            |       |
| Build        | Vite              |       |

## Deploy

| Target       | Notes                                                       |
| ------------ | ----------------------------------------------------------- |
| GitHub Pages | Static site — URL-based sharing must stay fully client-side |

## CI

Runs on every PR and push to main: lint → type-check → test → build.
