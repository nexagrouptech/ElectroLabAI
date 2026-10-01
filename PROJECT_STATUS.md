# ElectroLab AI — Project Status

## Current target

**v0.5 — Validation électrique & simulation sans IA**

### Part 1 — Deterministic calculation summary

Implemented:

- project model version moved to `0.5.0`;
- new `core/simulator.js` performs deterministic calculations only from known project values;
- supported lamp calculations use declared power and source voltage to estimate current;
- exact supported lamp topology links the upstream breaker to the calculated load;
- validator warns when an upstream breaker rating is below the known estimated lamp current;
- socket consumption is deliberately **not invented** when no downstream load is declared;
- newly cataloged tertiary components remain blocked from false validation until their own electrical rules exist;
- validation UI now displays source voltage, known power, estimated current, supported protection checks and calculation limitations;
- calculations remain fully non-AI and reproducible.

### Part 2 — Expanded deterministic component rules

Next after owner GO:

- begin electrical rules for selected tertiary components;
- add supported transformer/motor/relay/contacteur validation incrementally;
- add stronger topology/protection checks without pretending unsupported rules are complete;
- prepare the non-AI baseline for expert electrician review.

## Certified foundations

- [x] v0.1 — Circuit Lampe merged to `main`.
- [x] v0.2 — Installation domestique merged to `main`.
- [x] v0.3 — Mini laboratoire pédagogique merged to `main`.
- [x] v0.4 — Bibliothèque électrique merged to `main`.
- [ ] v0.1 tag remains pending.

## Current branch

`feature/v0.5-validation-simulation`

## Validation gate

- [x] GitHub Actions Node 20.
- [x] GitHub Actions Node 22.
- [x] Vercel Preview.
- [ ] Owner GO for Part 2.

## AI policy

No AI is integrated. The complete useful product must work without AI through v1.0.
