# ElectroLab AI — Project Status

## Current target

**v0.3 — Mini laboratoire pédagogique**

### Part 1 — Exercise model + learner entry flow

Implemented:

- project model version moved to `0.3.0`;
- projects can carry an `exerciseId`;
- reusable `core/exercises.js` registry;
- exercise fields: instruction, objective, allowed components, constraints, rule id and maximum score;
- predefined **Allumer une lampe** exercise;
- predefined **Protéger une prise domestique** exercise;
- learner can choose an exercise and press **Commencer l’exercice**;
- the active exercise disables components that are not allowed;
- v0.2/v0.1 local saves remain loadable;
- automated tests cover exercise definitions, project binding, restrictions and persistence.

### Part 2 — Exercise verification

Implemented:

- dedicated **Vérifier mon circuit** workflow;
- exercise-specific required criteria;
- deterministic pass/fail using the existing electrical validator;
- deterministic pedagogical feedback;
- attempt counter with local history;
- basic score structure from 0 to 100;
- exercise result persists with the project.

## Certified foundations

- [x] v0.1 merged to `main`.
- [x] v0.2 merged to `main`.
- [ ] v0.1 tag remains pending.

## Current branch

`feature/v0.3-mini-lab`

## Deployment

GitHub → Vercel automatic previews remain active. Local port remains 4174.

## External validation gate

Remote electrician review remains scheduled for **v0.5**.


## Part 1 certification

- [x] Exercise registry implemented.
- [x] Learner entry flow implemented.
- [x] GitHub Actions Node 20 passed.
- [x] GitHub Actions Node 22 passed.
- [x] Vercel Preview deployment succeeded.
- [x] Owner GO for Part 2.


## AI policy — owner decision 2026-10-01

ElectroLab must be built as a complete useful product **without AI** first.

- Do not add an AI model, AI API, prompt layer, natural-language circuit generation or AI correction during the current product build.
- The deterministic electrical engine remains the source of truth.
- All core product capabilities must work without AI.
- AI is deferred to an optional **post-v1.0** phase, after the non-AI product is complete and validated.

## v0.3 Part 2 certification state

- [x] Deterministic exercise evaluation implemented.
- [x] Pass/fail and score implemented.
- [x] Attempt persistence implemented.
- [x] Vercel deployment succeeds.
- [x] GitHub Actions has passing Node 20 and Node 22 runs for the implementation.
- [x] Owner approved v0.3 for progression.
