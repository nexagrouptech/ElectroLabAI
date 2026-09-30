# ElectroLab AI — Project Status

## Current target

**v0.2 — Installation domestique**

Current work is split into small certifiable parts.

### Part 1 — Domestic component primitives

Goal: extend the v0.1 electrical model and visible palette without yet pretending that all domestic validation rules are complete.

Implemented in this part:

- project model version moved to `0.2.0`;
- Source now exposes L, N and PE terminals for new v0.2 projects;
- new **Prise** component with L / N / PE;
- new **Fusible** component with L in / L out and configurable rating;
- new **Différentiel** component with L/N input/output terminals, configurable rating and sensitivity;
- v0.2 palette exposes all seven component types;
- v0.1 local saves remain loadable as a legacy fallback;
- v0.1 lamp validation remains intact while v0.2 domestic validation is built next;
- automated tests cover the new component definitions.

### Part 2 — Domestic validation rules

Implemented:

- deterministic socket validation supports either a **Disjoncteur** or **Fusible** as the overcurrent protection;
- phase path checked as Source L → Différentiel → protection → Prise L;
- neutral path checked as Source N → Différentiel → Prise N;
- PE continuity checked as Source PE → Prise PE;
- Fuse ratings 10 / 16 / 20 / 32 A are enforced;
- RCD rating and sensitivity must be positive values;
- blocking electrical/topology problems go to `errors`;
- non-blocking conditions such as unused terminals or multiple overcurrent devices go to `warnings`;
- the **Exemple** button now loads a complete domestic socket example;
- the example lays out vertically on narrow/mobile screens and horizontally on wider screens;
- v0.1 lamp validation remains supported;
- focused tests cover valid breaker/fuse socket paths and invalid PE/neutral/rating/sensitivity cases.

Status: **Part 2 complete and automated validation green**.

- GitHub Actions Node 20: PASS
- GitHub Actions Node 22: PASS
- Vercel Preview deployment: READY
- Next gate: owner usability check before certifying/merging v0.2.

## v0.1 certified foundation

- [x] Circuit Lampe implementation complete.
- [x] GitHub Actions passed.
- [x] Vercel Preview reached Ready.
- [x] Owner approved progression.
- [x] Pull request #1 merged into `main`.
- [ ] Tag `v0.1.0` still needs to be created on the certified main history.

## Current branch

`feature/v0.2-installation-domestique`

## Deployment

- Vercel Git integration is active.
- Feature pushes create Preview deployments automatically.
- Local development uses port 4174 because NLabel uses 4173.
- Static deployment contract: `npm run build` → `dist/` with `"framework": null`.

## External validation gate

The structured remote-electrician review remains scheduled for **v0.5**, after v0.2 domestic rules, v0.3 exercises, v0.4 component library work, and v0.5 AI Lite are internally usable.

See `ROADMAP.md`.


## v0.2 current certification state

- [x] Part 1 — domestic component primitives.
- [x] Part 2 — deterministic domestic validation rules.
- [x] Automated tests pass on Node 20 and Node 22.
- [x] Vercel Preview deployment succeeds.
- [x] Owner approved the v0.2 Preview for progression.
- [ ] Merge PR #2 to `main` after acceptance.
