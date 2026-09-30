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

Status: **implementation complete — awaiting owner usability certification before merge**.

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

## v0.5 — Assistant IA Lite

Goal: add a useful AI layer without allowing AI to bypass electrical correctness.

Scope:

- user describes a simple circuit in natural language
- AI produces or proposes a structured circuit representation
- deterministic engine validates the proposed result
- invalid AI output is rejected or returned for correction
- guided correction/explanation for simple mistakes
- AI remains an orchestration layer, never the electrical source of truth

Done when a user can request a simple supported circuit in text and obtain a structured, deterministic-validated result.

## External electrician review gate

The remote electrician review is intentionally deferred until **v0.5**.

At v0.5, the shared test should cover:

- electrical correctness of components, terminals and protection rules;
- practical realism of domestic circuits;
- clarity of warnings/errors;
- usefulness of the exercise workflow;
- usefulness and safety of AI-generated circuit proposals;
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

Do not let AI, 3D or collaboration become the source of truth.

The progression remains:

electrical model → reliable 2D → richer library/rules → pedagogy → AI Lite → 3D → classroom/collaboration → evaluation → pilots.
