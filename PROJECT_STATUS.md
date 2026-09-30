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

Next after GO:

- **Vérifier mon circuit** workflow;
- exercise-specific expected criteria;
- deterministic pass/fail result;
- pedagogical feedback;
- attempt tracking;
- basic score/result structure.

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
- [ ] Owner GO for Part 2.
