export const COMPONENT_LIBRARY = Object.freeze({
  source: {
    label: "Source 230 V",
    symbol: "⎓",
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" },
      { id: "PE", label: "PE", role: "protective-earth" }
    ],
    defaultProperties: { voltageV: 230 }
  },
  breaker: {
    label: "Disjoncteur",
    symbol: "Q",
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    defaultProperties: { ratingA: 16 }
  },
  switch: {
    label: "Interrupteur",
    symbol: "S",
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    defaultProperties: {}
  },
  lamp: {
    label: "Lampe",
    symbol: "✕",
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" }
    ],
    defaultProperties: { powerW: 60 }
  },
  socket: {
    label: "Prise",
    symbol: "◉",
    terminals: [
      { id: "L", label: "L", role: "line" },
      { id: "N", label: "N", role: "neutral" },
      { id: "PE", label: "PE", role: "protective-earth" }
    ],
    defaultProperties: {}
  },
  fuse: {
    label: "Fusible",
    symbol: "F",
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "L_OUT", label: "L out", role: "line-out" }
    ],
    defaultProperties: { ratingA: 16 }
  },
  rcd: {
    label: "Différentiel",
    symbol: "Δ",
    terminals: [
      { id: "L_IN", label: "L in", role: "line-in" },
      { id: "N_IN", label: "N in", role: "neutral-in" },
      { id: "L_OUT", label: "L out", role: "line-out" },
      { id: "N_OUT", label: "N out", role: "neutral-out" }
    ],
    defaultProperties: { ratingA: 40, sensitivityMA: 30 }
  }
});

function makeId(prefix) {
  const uuid = globalThis.crypto?.randomUUID?.();
  return uuid ? `${prefix}-${uuid}` : `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function createProject({ id = makeId("project"), name = "Mini laboratoire", exerciseId = null } = {}) {
  return {
    id,
    name,
    version: "0.3.0",
    exerciseId,
    exerciseProgress: {
      attempts: 0,
      lastResult: null,
      history: []
    },
    components: [],
    wires: [],
    updatedAt: new Date().toISOString()
  };
}

export function createComponent(type, options = {}) {
  const definition = COMPONENT_LIBRARY[type];
  if (!definition) throw new Error(`Unknown component type: ${type}`);

  return {
    id: options.id || makeId(type),
    type,
    name: options.name || definition.label,
    x: Number.isFinite(options.x) ? options.x : 40,
    y: Number.isFinite(options.y) ? options.y : 40,
    properties: {
      ...definition.defaultProperties,
      ...(options.properties || {})
    },
    terminals: definition.terminals.map((terminal) => ({ ...terminal }))
  };
}

export function addComponent(project, type, options = {}) {
  const component = createComponent(type, options);
  if (project.components.some((item) => item.id === component.id)) {
    throw new Error(`Duplicate component id: ${component.id}`);
  }
  project.components.push(component);
  touch(project);
  return component;
}

export function removeComponent(project, componentId) {
  project.components = project.components.filter((item) => item.id !== componentId);
  project.wires = project.wires.filter(
    (wire) => wire.from.componentId !== componentId && wire.to.componentId !== componentId
  );
  touch(project);
}

export function findTerminal(project, ref) {
  const component = project.components.find((item) => item.id === ref.componentId);
  if (!component) return null;
  const terminal = component.terminals.find((item) => item.id === ref.terminalId);
  return terminal ? { component, terminal } : null;
}

export function connect(project, from, to, options = {}) {
  if (!findTerminal(project, from)) throw new Error("Source terminal does not exist");
  if (!findTerminal(project, to)) throw new Error("Destination terminal does not exist");
  if (from.componentId === to.componentId && from.terminalId === to.terminalId) {
    throw new Error("A terminal cannot be connected to itself");
  }

  const samePair = (wire) => {
    const forward =
      wire.from.componentId === from.componentId &&
      wire.from.terminalId === from.terminalId &&
      wire.to.componentId === to.componentId &&
      wire.to.terminalId === to.terminalId;
    const reverse =
      wire.from.componentId === to.componentId &&
      wire.from.terminalId === to.terminalId &&
      wire.to.componentId === from.componentId &&
      wire.to.terminalId === from.terminalId;
    return forward || reverse;
  };

  if (project.wires.some(samePair)) throw new Error("This connection already exists");

  const wire = {
    id: options.id || makeId("wire"),
    from: { ...from },
    to: { ...to },
    conductor: options.conductor || "copper"
  };
  project.wires.push(wire);
  touch(project);
  return wire;
}

export function updateComponent(project, componentId, patch) {
  const component = project.components.find((item) => item.id === componentId);
  if (!component) throw new Error(`Component not found: ${componentId}`);

  if (patch.name !== undefined) component.name = String(patch.name);
  if (patch.x !== undefined && Number.isFinite(Number(patch.x))) component.x = Number(patch.x);
  if (patch.y !== undefined && Number.isFinite(Number(patch.y))) component.y = Number(patch.y);
  if (patch.properties) {
    component.properties = { ...component.properties, ...patch.properties };
  }
  touch(project);
  return component;
}

export function serializeProject(project) {
  return JSON.stringify(project);
}

export function deserializeProject(json) {
  const parsed = typeof json === "string" ? JSON.parse(json) : json;
  if (!parsed || typeof parsed !== "object") throw new Error("Invalid project");
  if (!Array.isArray(parsed.components) || !Array.isArray(parsed.wires)) {
    throw new Error("Invalid project structure");
  }
  return {
    ...parsed,
    version: parsed.version || "0.3.0",
    exerciseId: parsed.exerciseId || null,
    exerciseProgress: {
      attempts: Number(parsed.exerciseProgress?.attempts || 0),
      lastResult: parsed.exerciseProgress?.lastResult || null,
      history: Array.isArray(parsed.exerciseProgress?.history) ? parsed.exerciseProgress.history : []
    },
    updatedAt: parsed.updatedAt || new Date().toISOString()
  };
}

function touch(project) {
  project.updatedAt = new Date().toISOString();
}
