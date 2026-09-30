# ElectroLab AI — Project Status

## Current target

**v0.4 — Bibliothèque électrique**

### Part 1 — Structured catalog + searchable dynamic palette

Implemented:

- new `core/catalog.js` is the structured source of truth for component definitions;
- each component has a stable `catalogId`, type, label, symbol, category, tags, terminals and default properties;
- current residential catalog contains Source, Disjoncteur, Interrupteur, Lampe, Prise, Fusible and Différentiel;
- project model moved to `0.4.0`;
- new components persist their stable `catalogId`;
- older saved projects are normalized with the matching catalog id on reload;
- component palette is no longer hard-coded in HTML;
- palette is generated dynamically from the catalog;
- text search works across labels, ids and tags;
- category filter supports Alimentation, Protection, Commande and Récepteurs;
- exercise restrictions still disable components that are not allowed;
- automated tests cover catalog ids, search, category filtering and save normalization.

### Part 2 — Catalog expansion + configurable characteristics

Implemented:

- added first tertiary components: **Relais**, **Contacteur**, **Transformateur** and **Moteur monophasé**;
- each new component has a stable catalog id and stable terminal definitions;
- all catalog components now expose property metadata through `propertySchema`;
- inspector fields are generated from catalog metadata instead of hard-coded property names;
- select/number inputs, units, minimums and options come from the catalog;
- search/tags/categories automatically include the new components;
- validator explicitly blocks certification of newly cataloged components whose electrical rules are not yet implemented, preventing false “Circuit valide” results;
- automated tests cover new components, terminal stability, defaults, property metadata and validation-pending behavior.

## Certified foundations

- [x] v0.1 — Circuit Lampe merged to `main`.
- [x] v0.2 — Installation domestique merged to `main`.
- [x] v0.3 — Mini laboratoire pédagogique merged to `main`.
- [ ] v0.1 tag remains pending.

## Current branch

`feature/v0.4-library`

## Validation

- [x] GitHub Actions Node 20 passed.
- [x] GitHub Actions Node 22 passed.
- [x] Vercel Preview deployment succeeded.
- [x] Owner GO for Part 2.

## Deployment

GitHub → Vercel automatic previews remain active. Local port remains 4174.

## AI policy — owner decision 2026-10-01

ElectroLab must be built as a complete useful product without AI first.

- No AI model, AI API, prompt layer or natural-language circuit generation during the current build.
- The deterministic electrical engine remains the source of truth.
- AI is optional only after a complete and validated non-AI v1.0.


## v0.4 certification state

- [x] Part 1 — structured searchable catalog.
- [x] Part 2 — initial tertiary expansion and metadata-driven characteristics.
- [x] GitHub Actions Node 20 passing on the implementation.
- [x] GitHub Actions Node 22 passing on the implementation.
- [x] Vercel Preview deployment succeeds.
- [ ] Owner usability check before merging v0.4.
