# ElectroLab AI — Version Roadmap

This file is the canonical product-version roadmap for the incremental build.

The roadmap below preserves the version split already agreed for the project. Each version must end with a usable increment, automated validation, and updated continuity documentation.

## v0.1 — Circuit Lampe

Goal: one complete, deterministic lamp circuit.

Scope:

- Source 230 V
- Disjoncteur
- Interrupteur
- Lampe
- 2D placement and dragging
- terminal-to-terminal wiring
- editable component properties
- breaker rating
- deterministic validation
- local save/reload
- automated tests
- browser-usable build

Status: internally certified and merged to `main`; tag `v0.1.0` is still pending.

## v0.2 — Installation domestique

Status: **internally certified and merged to `main`**.

Goal: move from one lamp circuit to a small realistic domestic installation.

Scope:

- add Prise
- add Fusible
- add protection différentielle
- support common protection ratings: 10 A, 16 A, 20 A, 32 A
- extend deterministic wiring/protection rules
- distinguish blocking errors from warnings
- keep the electrical model as the source of truth
- preserve save/reload and 2D editing

Done when a user can assemble and validate a small domestic installation without AI.

## v0.3 — Mini laboratoire pédagogique

Status: **internally certified and merged to `main`**.

Goal: turn the editor into a first teachable laboratory.

Scope:

- predefined electrical exercises
- exercise instructions
- expected circuit criteria
- “Vérifier mon circuit” workflow
- deterministic feedback on mistakes
- basic pass/fail exercise result
- reusable exercise definitions rather than hard-coded UI-only behavior

Done when a learner can open an exercise, build a circuit, verify it, and receive reproducible feedback.

## v0.4 — Bibliothèque électrique

Status: **internally certified and merged to `main`**.

Goal: make component discovery and configuration usable beyond the tiny starter palette.

Scope:

- structured component library
- residential components first
- initial tertiary components where useful
- search/filter component library
- configurable electrical characteristics
- stable component identifiers and terminal definitions
- library-driven palette rather than one-off UI buttons

Done when the editor can grow by registering components without rewriting the whole interface.

## v0.5 — Validation électrique & simulation sans IA

Status: **Part 2A implemented — conservative transformer/motor/relay/contacteur rules; complete tertiary topology support remains in Part 2B**.

Goal: strengthen the deterministic non-AI product before 3D and classroom work.

Scope:

- expand deterministic electrical rules;
- improve supported calculations and protection checks;
- refine feedback and UX;
- prepare a stable electrical/pedagogical baseline for expert review.

**AI is explicitly out of scope.**

## External electrician review gate

The structured electrician review remains planned around the mature non-AI electrical/pedagogical milestone.

It should cover:

- electrical correctness of components, terminals and protection rules;
- practical realism of domestic circuits;
- clarity of warnings/errors;
- usefulness of the exercise workflow;
- major missing electrical rules before 3D/classroom work.

## Later versions

- **v0.6 — 3D Viewer**
- **v0.7 — Classe Lite**
- **v0.8 — LIVE professeur**
- **v0.9 — Évaluation**
- **v0.10 — Pilote école**
- **v0.11 — Pilote terrain**
- **v1.0 — Produit pilote**

## Product sequencing rule

The deterministic electrical model remains the source of truth.

Current progression:

electrical model → reliable 2D → richer library/rules → pedagogy → deterministic validation/simulation → 3D → classroom/collaboration → evaluation → pilots → v1.0 complete non-AI product.

## AI — deferred post-v1.0

AI was previously planned at v0.5. The owner changed the strategy on 2026-10-01.

**Do not integrate AI before the non-AI product is complete.**

After v1.0 is complete and validated, AI may be reconsidered as an optional v1.x/post-v1.0 layer.
