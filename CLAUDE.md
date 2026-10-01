# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For the generic app structure this repo follows (folder layout, routing
pattern, i18n approach, naming conventions, testing split) see
[`maat-core/STRUCTURE.md`](https://github.com/maat-apps/maat-core/blob/main/STRUCTURE.md).
For the "verify each change exactly once" principle behind this repo's
automation setup, see
[`maat-core/VERIFICATION.md`](https://github.com/maat-apps/maat-core/blob/main/VERIFICATION.md).
What follows here is what's specific to **trainer**.

<!-- BEGIN AUTO-GENERATED: setup-claude-workflow -->
<!-- Only Project Snapshot and Commands below are ever rewritten by --refresh. -->

## Project Snapshot

- Vite + React + TypeScript, Tailwind v4, shadcn (`base-nova`).
- Mobile-only (`@maat-apps/ui`'s `MobileGate`, used from `src/app/root.tsx`), like routines.

## Commands

| Purpose   | Command                 |
| --------- | ----------------------- |
| Dev       | `npm run dev`           |
| Build     | `npm run build`         |
| Lint      | `npm run lint:fix`      |
| Format    | `npm run format`        |
| Typecheck | `npm run typecheck`     |
| Unit test | `npm run test:coverage` |
| E2E test  | `npm run test:e2e`      |
| Validate  | `npm run validate`      |

<!-- Everything below is seeded once, then append-only — --refresh never rewrites it. -->

## Conventions

- Filenames: kebab-case everywhere, including components; component names
  inside a file stay PascalCase.
- Named exports throughout.
- Hooks (`use*`) live in `src/hooks/`, not `src/lib/` — `lib/` stays free
  of `react`/`react-dom` imports.
- A Playwright project's reusable test-helper file belongs at
  `e2e/utils.ts`, not `fixtures.ts` — these are plain functions specs call
  directly, not Playwright's own `test.extend()` fixture-injection system.
- Full pattern log: none yet — run `/learn-patterns` after a non-trivial
  session to start one.
- **UI stack.** Every shared component — `Button`/`Input`/`Select`/
  `Textarea`, drawers, `DatePicker`, charts, `SortableList` — comes from
  [`@maat-apps/ui`](https://www.npmjs.com/package/@maat-apps/ui), with no
  local `src/components/ui/` copies; prefer the package over regenerating
  shadcn primitives by hand. The clients list is the package's
  `SortableList` + `SortableListRow`, with `ClientRowContent` as each row's
  content. Base UI's `Select` renders via
  a portal, not a native `<select>` — e2e specs interact with it as
  `getByRole("combobox", { name })` + `getByRole("option", { name })`,
  not `.selectOption()`. `src/app/globals.css`'s `@source` covers the
  package's whole compiled `dist/`, or its classes get purged. The theme
  (true black + white on Outfit: tokens, font, base styles) comes from
  `@import "@maat-apps/ui/theme.css"` in the same file — shared by every
  app, so don't redefine tokens here; only trainer's own additions (the
  larger inputs) live in `globals.css`.
  `src/lib/utils.ts` re-exports `cn` from the `cn` npm package, matching
  the alias `components.json` declares.
- **Platform plumbing** comes from
  [`@maat-apps/core`](https://github.com/maat-apps/maat-core/tree/main/packages/core):
  `src/lib/idb-store.ts` (`/storage`, the `"trainer"` database),
  `app-settings.ts` (`/persisted`), `app-update.ts` (`/update`, with this
  app's backup format as the snapshot), `src/hooks/use-install-prompt.ts`
  (`/install`) and `src/sw.ts` (`/sw` — bump its `cacheName` when the
  shell changes). They're thin wrappers that keep their own exports, so
  tests import them, not core; a test needing a failing read/write spies
  on `keyValueStore`'s `get`/`set`. Backups (`src/lib/backup.ts`) and the
  chart PNG export (`chart-export.ts`) use `/backup` for the envelope,
  file and share/download; `schemas.ts`' lenient per-entry parsing uses
  `/validation`. The data schemas and Polish messages stay here.
- **App lock + encryption.** Every maat-apps app has it: logic from
  `@maat-apps/core/lock`, the lock screen from `@maat-apps/ui/app-lock-gate`
  (inside `MobileGate`, `src/app/root.tsx`). Trainer's wiring:
  `src/lib/app-lock.ts` (`appLock`; enrolment in `app-settings.ts`,
  rewrite/erase over `storage.ts` + the update snapshot),
  `src/lib/encryption-key.ts` (the key holder `storage.ts` and
  `app-update.ts` encrypt with), `src/components/app-lock-gate.tsx`
  (Polish labels) and Settings' `settings-security-section.tsx`. With WebAuthn
  PRF `trainer-data` is encrypted; without it the lock is a UI gate only and
  Settings says so. **Never change `HKDF_INFO` (`"trainer-data-v1"`)** —
  existing encrypted data would become unreadable.
- **Navigation.** App-wide bottom nav (Klienci / Ćwiczenia / Ustawienia),
  `src/components/bottom-nav.tsx`'s `AppLayout` — fixed to the viewport
  bottom, `flex justify-around` across three `NavLink`s (icon + label),
  not a top header bar. Every route renders through its nested `<Outlet/>`
  (wired in `src/app/router.tsx`), wrapped in a `pb-16` div so the fixed
  bar never covers the last bit of scrolled content — add the same bottom
  padding to any new full-screen view that doesn't go through that
  wrapper.

## Workflow Rules

- Don't manually re-run lint/format/typecheck/build/test to double-check a
  change before committing — CI runs the full `npm run validate` gate on
  every PR; see `maat-core/VERIFICATION.md` for why running it twice is
  pure waste, not extra safety. `.github/workflows/` only holds small
  callers of maat-core's reusable workflows (`app-*.yml`, maat-core
  STRUCTURE.md's CI/CD) — change a pipeline there, not here.
- Check the current branch before editing or committing anything — never
  edit or commit directly on `main`.
- Name branches `<type>/<short-descriptive-slug>` — see
  `maat-core/STRUCTURE.md`'s "Branch naming" section — not a generic or
  session-scoped name; cut a fresh branch per PR/task rather than reusing
  one across unrelated changes.
- Commit once a task's changes are complete, then use `/open-pr` to push
  and open the PR, and merge it (squash) once CI is green — see maat-core
  `STRUCTURE.md`'s Claude Code workflow. `.claude/commands/` and
  `.claude/skills/` are copies of maat-core's `configs/claude` standard:
  change them there first, then sync.

<!-- END AUTO-GENERATED: setup-claude-workflow -->
