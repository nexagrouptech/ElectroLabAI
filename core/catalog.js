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
    defaultProperties: { ratingA: 40, sensitivityMA: 30 }
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
