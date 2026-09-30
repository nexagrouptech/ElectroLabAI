import { COMPONENT_LIBRARY, findTerminal } from "./project.js";

const ALLOWED_BREAKER_RATINGS = [10, 16, 20, 32, 40];

function endpointKey(ref) {
  return `${ref.componentId}::${ref.terminalId}`;
}

function hasTerminalConnection(project, a, b) {
  const keyA = endpointKey(a);
  const keyB = endpointKey(b);
  return project.wires.some((wire) => {
    const from = endpointKey(wire.from);
    const to = endpointKey(wire.to);
    return (from === keyA && to === keyB) || (from === keyB && to === keyA);
  });
}

function componentAdjacency(project) {
  const map = new Map(project.components.map((item) => [item.id, new Set()]));
  for (const wire of project.wires) {
    if (map.has(wire.from.componentId) && map.has(wire.to.componentId)) {
      map.get(wire.from.componentId).add(wire.to.componentId);
      map.get(wire.to.componentId).add(wire.from.componentId);
    }
  }
  return map;
}

function hasComponentPath(adjacency, orderedIds) {
  for (let index = 0; index < orderedIds.length - 1; index += 1) {
    if (!adjacency.get(orderedIds[index])?.has(orderedIds[index + 1])) return false;
  }
  return true;
}

export function validateProject(project) {
  const errors = [];
  const warnings = [];
  const checks = [];

  if (!project || !Array.isArray(project.components) || !Array.isArray(project.wires)) {
    return {
      valid: false,
      errors: [{ code: "INVALID_PROJECT", message: "Le projet est invalide." }],
      warnings,
      checks
    };
  }

  const ids = new Set();
  for (const component of project.components) {
    if (ids.has(component.id)) {
      errors.push({ code: "DUPLICATE_COMPONENT_ID", message: `Identifiant dupliqué: ${component.id}` });
    }
    ids.add(component.id);

    if (!COMPONENT_LIBRARY[component.type]) {
      errors.push({ code: "UNKNOWN_COMPONENT", message: `Composant inconnu: ${component.type}` });
    }
  }

  const wirePairs = new Set();
  for (const wire of project.wires) {
    if (!findTerminal(project, wire.from) || !findTerminal(project, wire.to)) {
      errors.push({ code: "INVALID_WIRE_ENDPOINT", message: `Le fil ${wire.id} pointe vers une borne inexistante.` });
      continue;
    }
    const pair = [endpointKey(wire.from), endpointKey(wire.to)].sort().join("|");
    if (wirePairs.has(pair)) {
      errors.push({ code: "DUPLICATE_WIRE", message: "Une connexion est présente plusieurs fois." });
    }
    wirePairs.add(pair);
  }

  const source = project.components.find((item) => item.type === "source");
  const breaker = project.components.find((item) => item.type === "breaker");
  const switchComponent = project.components.find((item) => item.type === "switch");
  const lamp = project.components.find((item) => item.type === "lamp");

  for (const [type, component, label] of [
    ["source", source, "source"],
    ["breaker", breaker, "disjoncteur"],
    ["switch", switchComponent, "interrupteur"],
    ["lamp", lamp, "lampe"]
  ]) {
    const ok = Boolean(component);
    checks.push({ id: `component-${type}`, ok, label: `Présence: ${label}` });
    if (!ok) errors.push({ code: `MISSING_${type.toUpperCase()}`, message: `Ajoute un ${label}.` });
  }

  if (breaker) {
    const rating = Number(breaker.properties.ratingA);
    const ok = ALLOWED_BREAKER_RATINGS.includes(rating);
    checks.push({ id: "breaker-rating", ok, label: "Calibre du disjoncteur" });
    if (!ok) {
      errors.push({
        code: "INVALID_BREAKER_RATING",
        message: "Le calibre doit être 10 A, 16 A, 20 A, 32 A ou 40 A."
      });
    }
  }

  if (lamp && Number(lamp.properties.powerW) <= 0) {
    errors.push({ code: "INVALID_LAMP_POWER", message: "La puissance de la lampe doit être positive." });
  }

  if (source && breaker && switchComponent && lamp) {
    const adjacency = componentAdjacency(project);
    const phasePath = hasComponentPath(adjacency, [
      source.id,
      breaker.id,
      switchComponent.id,
      lamp.id
    ]);
    checks.push({
      id: "phase-path",
      ok: phasePath,
      label: "Phase: source → disjoncteur → interrupteur → lampe"
    });
    if (!phasePath) {
      errors.push({
        code: "OPEN_PHASE_PATH",
        message: "Le chemin de phase doit relier source → disjoncteur → interrupteur → lampe."
      });
    }

    const neutralConnected = hasTerminalConnection(
      project,
      { componentId: source.id, terminalId: "N" },
      { componentId: lamp.id, terminalId: "N" }
    );
    checks.push({ id: "neutral-path", ok: neutralConnected, label: "Neutre: source N → lampe N" });
    if (!neutralConnected) {
      errors.push({
        code: "OPEN_NEUTRAL",
        message: "Relie la borne N de la source à la borne N de la lampe."
      });
    }
  }

  const connectedTerminalKeys = new Set();
  for (const wire of project.wires) {
    connectedTerminalKeys.add(endpointKey(wire.from));
    connectedTerminalKeys.add(endpointKey(wire.to));
  }
  const unconnected = project.components.flatMap((component) =>
    component.terminals
      .filter((terminal) => !connectedTerminalKeys.has(endpointKey({ componentId: component.id, terminalId: terminal.id })))
      .map((terminal) => `${component.name} / ${terminal.label}`)
  );
  if (unconnected.length) {
    warnings.push({
      code: "UNCONNECTED_TERMINALS",
      message: `Bornes non raccordées: ${unconnected.join(", ")}`
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    checks
  };
}
