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

#### Part 2B1 — Supported motor + contactor topology

Implemented:

- motor now requires a user-entered **nameplate rated current** instead of an invented current;
- supported power path: Source L → Disjoncteur → Contacteur L1/T1 → Moteur L;
- supported control path: Source L → Interrupteur → Contacteur A1, with Source N → A2;
- motor neutral and PE are required;
- motor nominal voltage must match source voltage;
- contactor coil voltage must match source voltage;
- contactor rating must be at least the motor nameplate current;
- breaker rating must not be below the motor nameplate current;
- motor/contacteur lose the generic pending-validation blocker only inside this explicitly supported rule set;
- ElectroLab still warns that starting current, thermal coordination, power factor and efficiency are not yet modeled;
- orphan contactors are rejected instead of silently accepted.

#### Part 2B2 — Relay + transformer-secondary supported topology

Implemented:

- first supported **Relais NO + Lampe** topology:
  - Source L → Disjoncteur → COM relais;
  - NO relais → L lampe;
  - Source N → N lampe;
  - Source L → Interrupteur → A1 relais;
  - Source N → A2 relais;
- relay coil voltage must match source voltage;
- relay NC use is explicitly rejected in this first supported topology;
- relay contact behavior is validated statically and the UI documents that dynamic coil/contact state is not yet simulated;
- first supported **Transformateur secondaire + Lampe** topology:
  - primary Source L/N → P1/P2;
  - secondary S1 → Disjoncteur → Interrupteur → L lampe;
  - S2 → N lampe;
- secondary lamp current is calculated from the declared secondary voltage, not from the primary/source voltage;
- the secondary breaker is checked against the estimated supported lamp current;
- global current is not incorrectly aggregated across different voltage domains;
- transformer overload comparison W vs VA is emitted only as an explicit warning because full power-factor modeling is not present;
- relay and transformer generic pending-validation blockers were removed only after these supported topologies were covered by tests.

Status: **v0.5 functional scope complete; awaiting owner usability certification before merge.**

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
- [x] Owner GO for Part 2B1.
- [x] Owner GO for Part 2B2.

## AI policy

No AI is integrated. The complete useful product must work without AI through v1.0.


## v0.5 Part 2A validation

Implementation pushed with dedicated tests.

- GitHub Actions Node 20: PASS
- GitHub Actions Node 22: PASS
- Vercel Preview: READY
- Next gate: owner GO for Part 2B.


## v0.5 Part 2B1 validation

- GitHub Actions Node 20: PASS
- GitHub Actions Node 22: PASS
- Vercel Preview: READY
- Next gate: owner GO for Part 2B2.


## v0.5 final certification state

- [x] Part 1 — deterministic calculation summary.
- [x] Part 2A — conservative tertiary rules.
- [x] Part 2B1 — supported motor/contacteur topology.
- [x] Part 2B2 — supported relay and transformer-secondary topologies.
- [x] GitHub Actions Node 20: PASS.
- [x] GitHub Actions Node 22: PASS.
- [x] Vercel Preview: READY.
- [ ] Owner usability check on final v0.5 Preview.
- [ ] Merge PR #5 to `main`.
- [ ] Prepare the short/public production URL for electrician review.
- [ ] Structured remote-electrician review before proceeding into 3D/classroom work.
