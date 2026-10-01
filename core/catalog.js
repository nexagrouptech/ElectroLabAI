export const COMPONENT_CATEGORIES = Object.freeze({
  all: "Tous",
  supply: "Alimentation",
  protection: "Protection",
  control: "Commande",
  load: "Récepteurs"
});

export const COMPONENT_CATALOG = Object.freeze({
  source: Object.freeze({
    catalogId: "residential.source.230v",
    type: "source",
    label: "Source 230 V",
    symbol: "⎓",
    category: "supply",
    tags: ["source", "230v", "alimentation", "monophasé"],
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" },
      { id: "PE", label: "PE", role: "protective-earth" }
    ],
    propertySchema: {
      voltageV: { label: "Tension", input: "number", unit: "V", min: 1, step: 1 }
    },
    defaultProperties: { voltageV: 230 }
  }),
  breaker: Object.freeze({
    catalogId: "residential.protection.breaker",
    type: "breaker",
    label: "Disjoncteur",
    symbol: "Q",
    category: "protection",
    tags: ["disjoncteur", "protection", "surintensité"],
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    propertySchema: {
      ratingA: { label: "Calibre", input: "select", unit: "A", options: [10, 16, 20, 32, 40] }
    },
    defaultProperties: { ratingA: 16 }
  }),
  switch: Object.freeze({
    catalogId: "residential.control.switch",
    type: "switch",
    label: "Interrupteur",
    symbol: "S",
    category: "control",
    tags: ["interrupteur", "commande", "éclairage"],
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    propertySchema: {},
    defaultProperties: {}
  }),
  lamp: Object.freeze({
    catalogId: "residential.load.lamp",
    type: "lamp",
    label: "Lampe",
    symbol: "✕",
    category: "load",
    tags: ["lampe", "éclairage", "récepteur"],
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" }
    ],
    propertySchema: {
      powerW: { label: "Puissance", input: "number", unit: "W", min: 1, step: 1 }
    },
    defaultProperties: { powerW: 60 }
  }),
  socket: Object.freeze({
    catalogId: "residential.load.socket",
    type: "socket",
    label: "Prise",
    symbol: "◉",
    category: "load",
    tags: ["prise", "socle", "récepteur", "pe"],
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" },
      { id: "PE", label: "PE", role: "protective-earth" }
    ],
    propertySchema: {},
    defaultProperties: {}
  }),
  fuse: Object.freeze({
    catalogId: "residential.protection.fuse",
    type: "fuse",
    label: "Fusible",
    symbol: "F",
    category: "protection",
    tags: ["fusible", "protection", "surintensité"],
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    propertySchema: {
      ratingA: { label: "Calibre", input: "select", unit: "A", options: [10, 16, 20, 32] }
    },
    defaultProperties: { ratingA: 16 }
  }),
  rcd: Object.freeze({
    catalogId: "residential.protection.rcd",
    type: "rcd",
    label: "Différentiel",
    symbol: "Δ",
    category: "protection",
    tags: ["différentiel", "rcd", "protection", "30ma"],
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "N_IN", label: "N in", role: "neutral-in" },
      { id: "L_OUT", label: "L out", role: "line-out" },
      { id: "N_OUT", label: "N out", role: "neutral-out" }
    ],
    propertySchema: {
      ratingA: { label: "Calibre", input: "select", unit: "A", options: [25, 40, 63] },
      sensitivityMA: { label: "Sensibilité", input: "select", unit: "mA", options: [10, 30, 100, 300] }
    },
    defaultProperties: { ratingA: 40, sensitivityMA: 30 }
  }),
  relay: Object.freeze({
    catalogId: "tertiary.control.relay",
    type: "relay",
    label: "Relais",
    symbol: "R",
    category: "control",
    tags: ["relais", "commande", "bobine", "tertiaire"],
    terminals: [
      { id: "A1", label: "A1", role: "coil-in" },
      { id: "A2", label: "A2", role: "coil-out" },
      { id: "COM", label: "COM", role: "common" },
      { id: "NO", label: "NO", role: "normally-open" },
      { id: "NC", label: "NC", role: "normally-closed" }
    ],
    propertySchema: {
      coilVoltageV: { label: "Tension bobine", input: "number", unit: "V", min: 1, step: 1 }
    },
    defaultProperties: { coilVoltageV: 230 }
  }),
  contactor: Object.freeze({
    catalogId: "tertiary.control.contactor",
    type: "contactor",
    label: "Contacteur",
    symbol: "KM",
    category: "control",
    tags: ["contacteur", "commande", "moteur", "tertiaire"],
    terminals: [
      { id: "A1", label: "A1", role: "coil-in" },
      { id: "A2", label: "A2", role: "coil-out" },
      { id: "L1", label: "L1", role: "line-in" },
      { id: "T1", label: "T1", role: "line-out" }
    ],
    propertySchema: {
      coilVoltageV: { label: "Tension bobine", input: "number", unit: "V", min: 1, step: 1 },
      ratingA: { label: "Calibre", input: "number", unit: "A", min: 1, step: 1 }
    },
    defaultProperties: { coilVoltageV: 230, ratingA: 25 }
  }),
  transformer: Object.freeze({
    catalogId: "tertiary.supply.transformer",
    type: "transformer",
    label: "Transformateur",
    symbol: "T",
    category: "supply",
    tags: ["transformateur", "tension", "primaire", "secondaire", "tertiaire"],
    terminals: [
      { id: "P1", label: "P1", role: "primary-in" },
      { id: "P2", label: "P2", role: "primary-out" },
      { id: "S1", label: "S1", role: "secondary-in" },
      { id: "S2", label: "S2", role: "secondary-out" }
    ],
    propertySchema: {
      primaryVoltageV: { label: "Tension primaire", input: "number", unit: "V", min: 1, step: 1 },
      secondaryVoltageV: { label: "Tension secondaire", input: "number", unit: "V", min: 1, step: 1 },
      ratedPowerVA: { label: "Puissance nominale", input: "number", unit: "VA", min: 1, step: 1 }
    },
    defaultProperties: { primaryVoltageV: 230, secondaryVoltageV: 24, ratedPowerVA: 250 }
  }),
  motor: Object.freeze({
    catalogId: "tertiary.load.motor.single-phase",
    type: "motor",
    label: "Moteur monophasé",
    symbol: "M",
    category: "load",
    tags: ["moteur", "monophasé", "récepteur", "tertiaire"],
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" },
      { id: "PE", label: "PE", role: "protective-earth" }
    ],
    propertySchema: {
      voltageV: { label: "Tension", input: "number", unit: "V", min: 1, step: 1 },
      powerW: { label: "Puissance mécanique", input: "number", unit: "W", min: 1, step: 1 },
      ratedCurrentA: { label: "Courant nominal plaque", input: "number", unit: "A", min: 0.1, step: 0.1 }
    },
    defaultProperties: { voltageV: 230, powerW: 750, ratedCurrentA: 0 }
  })
});

export function getComponentDefinition(type) {
  return COMPONENT_CATALOG[type] || null;
}

export function listComponentDefinitions() {
  return Object.values(COMPONENT_CATALOG);
}

export function searchComponentDefinitions({ query = "", category = "all" } = {}) {
  const normalizedQuery = String(query).trim().toLocaleLowerCase("fr");

  return listComponentDefinitions().filter((definition) => {
    const categoryMatches = category === "all" || definition.category === category;
    if (!categoryMatches) return false;
    if (!normalizedQuery) return true;

    const haystack = [
      definition.type,
      definition.catalogId,
      definition.label,
      definition.category,
      ...(definition.tags || [])
    ]
      .join(" ")
      .toLocaleLowerCase("fr");

    return haystack.includes(normalizedQuery);
  });
}
