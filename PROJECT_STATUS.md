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

#### Part 2A — Conservative tertiary rules

Implemented:

- Transformateur: declared primary/secondary voltages and VA must be positive;
- when transformer primary wiring starts, the supported topology expects source L → P1 and source N → P2;
- connected transformer primary voltage must match the declared source voltage;
- transformer secondary wiring cannot be left half-connected;
- deterministic transformer nominal calculations expose voltage ratio plus S/V primary and secondary rated currents;
- the UI clearly states that transformer losses/efficiency are not modeled;
- Moteur monophasé: declared voltage and power must be positive;
- once motor wiring starts, L, N and PE must all be connected;
- motor current is deliberately **not calculated** because power factor, efficiency and starting current are not yet modeled;
- Relais and Contacteur: declared coil voltage / contactor rating receive deterministic positive-value checks;
- all four tertiary types still keep the explicit `VALIDATION_PENDING_FOR_COMPONENT` blocker until their complete topology/control/protection rules are finished, preventing false certification.

#### Part 2B — Remaining tertiary topology/control rules

Next after owner GO:

- complete supported relay coil/contact behavior;
- complete supported contactor control/power behavior;
- add a supported motor protection/control topology;
- decide the first supported transformer-secondary load topology;
- remove `VALIDATION_PENDING_FOR_COMPONENT` only per component after its complete supported rule set is covered by tests.

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
- [x] Owner GO for Part 2A.
- [ ] Owner GO for Part 2B.

## AI policy

No AI is integrated. The complete useful product must work without AI through v1.0.


## v0.5 Part 2A validation

Implementation pushed with dedicated tests.

- GitHub Actions Node 20: PASS
- GitHub Actions Node 22: PASS
- Vercel Preview: READY
- Next gate: owner GO for Part 2B.
