# 004. Store and hook pattern for reactive map state

**Date:** 2026-05-13
**Status:** Accepted

## Context

As map domains (pointer, camera, drawing) need to expose state to React components, a consistent pattern for external store → React binding is required. The naive approach — `useState` + `useEffect` subscribe — is simple but can tear in React 18 concurrent mode: two reads of the same store during one render can observe different values. A consistent pattern also needs to solve selective rerenders: a component subscribed to `coordinates` should not rerender when `zoom` changes.

## Decision

Each domain module owns a `Store<T>` instance (a typed `StateManager` class). The store notifies all subscribers on `set()`, passing the full new state and `changedKeys`. React binding is done via `useSyncExternalStore` — the React 18 primitive for external stores — with a `changedKeys` guard in the subscribe callback to skip `setState` when no observed key changed.

Split stores per domain (pointer, camera) rather than a unified map state store.

## Alternatives Considered

**`useState` + `useEffect`** — simpler, but can tear in concurrent mode. Ruled out in favour of the React-blessed primitive.

**Per-key subscriber routing in the store** — the store maintains a `Map<keyof T, Set<() => void>>` and only calls subscribers whose keys changed. Avoids calling subscriber functions at all when irrelevant keys change. Ruled out: the `changedKeys` guard in the hook achieves the same rerender prevention with less store complexity; the extra function calls are negligible for a small subscriber count.

**Single unified map state store** — one store for all map state (pointer + camera + drawing). Simpler wiring, but domains become coupled through a shared type. Split stores keep each domain independently testable and avoid unrelated rerenders across domains.

## Consequences

- All future domain modules follow the same shape: `Store<T>`, `init(map)`, `destroy()`, `useX(keys)` hook.
- `useSyncExternalStore` requires stable `subscribe` and `getSnapshot` references — hook implementations must use `useMemo` or module-level functions.
- Adding a new observable key to a domain is a one-line change to the state type; consumers opt in via the `keys` array.
- Camera, drawing, and future domains have a clear template to follow.
