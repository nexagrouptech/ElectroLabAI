# ElectroLab AI — Project Status

## Current target

**Session 1 — v0.1 Circuit Lampe**

A user must be able to:

1. open ElectroLab;
2. add a 230 V source, breaker, switch and lamp;
3. move the components on a 2D grid;
4. connect terminals visually;
5. edit component properties, including breaker rating;
6. validate the circuit with deterministic rules;
7. save and reload the project locally.

## Current implementation

Branch: `feature/v0.1-circuit-lampe`

Implemented in this branch:

- Node.js + Express local server;
- structured `Project / Component / Terminal / Wire` model;
- first component library: source, breaker, switch, lamp;
- interactive 2D workspace;
- visual terminal-to-terminal wiring;
- component dragging;
- breaker rating and component property editing;
- deterministic lamp-circuit validation;
- local save/reload;
- ready-made working example;
- automated unit tests;
- GitHub Actions CI on Node.js 20 and 22.

## Definition of done for v0.1

- [x] Four core components exist.
- [x] User can place and move them.
- [x] User can wire terminals.
- [x] Breaker rating is editable.
- [x] Validation gives reproducible errors.
- [x] A correct circuit can pass validation.
- [x] Project can be saved and reloaded locally.
- [x] Automated tests exist.
- [x] GitHub Actions green on pull request #1 (Node.js 20 and 22).
- [ ] Manual usability check on the user's device.
- [x] Default local port moved to 4174 to avoid conflict with NLabel on 4173.
- [ ] Merge into `main` and tag `v0.1.0`.

## Next version

**v0.2 — Installation domestique**

Do not start before v0.1 is accepted.


## Remote tester deployment

- [x] Vercel-ready static build added (`npm run build` → `dist/`).
- [x] GitHub Actions now validates the static build.
- [ ] Public Vercel deployment URL created and tested.



## Vercel remote tester

- [x] Vercel project `electro-lab-ai` created.
- [x] GitHub repository `nexagrouptech/ElectroLabAI` connected to Vercel.
- [x] Static build configuration available (`npm run build` → `dist/`).
- [x] Vercel preview deployment reached Ready on the feature branch (deployment `Bdk7qfhcGScwqKSeUkKAgGn8Ys1D`).
- [ ] Public access from an external browser/user verified.
- [ ] Remote electrician usability validation completed.
