# ElectroLab AI — Development Workflow

## Core rule

Every work session must finish with a usable version or a clearly usable increment of the version currently being certified.

Large tasks are split into small parts to avoid long-running sessions and timeouts.

## Version workflow

1. Work on a dedicated branch.
2. Keep the electrical model as the source of truth.
3. Add or update automated tests with every functional change.
4. Push changes to GitHub.
5. Let GitHub Actions run syntax checks and tests.
6. Fix failures before merging.
7. Perform a short manual usability check.
8. Merge only an accepted version into `main`.
9. Update `PROJECT_STATUS.md`.
10. Start the next version only after the current one is accepted.

## Product constraints

- Do not build complex AI or 3D before the electrical model and 2D editor are reliable.
- AI may propose structures, but the deterministic electrical engine validates them.
- 2D and future 3D representations must use the same logical project model.
- User-visible progress is preferred over long invisible infrastructure work.

## Current branch

`feature/v0.1-circuit-lampe`
