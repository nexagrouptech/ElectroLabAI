import { COMPONENT_LIBRARY, findTerminal } from "./project.js";

const ALLOWED_BREAKER_RATINGS = [10, 16, 20, 32, 40];
const ALLOWED_FUSE_RATINGS = [10, 16, 20, 32];
const FULLY_VALIDATED_TYPES = new Set(["source", "breaker", "switch", "lamp", "socket", "fuse", "rcd"]);

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

function hasExactPath(project, segments) {
  return segments.every(([from, to]) => hasTerminalConnection(project, from, to));
}

function ref(component, terminalId) {
  return { componentId: component.id, terminalId };
}

function firstOf(project, type) {
  return project.components.find((item) => item.type === type);
}

function allOf(project, type) {
  return project.components.filter((item) => item.type === type);
}

function addPresenceCheck(checks, errors, id, component, label, errorCode) {
  const ok = Boolean(component);
  checks.push({ id, ok, label: `Présence: ${label}` });
  if (!ok) errors.push({ code: errorCode, message: `Ajoute ${label}.` });
}

function validateProtectionProperties(project, checks, errors) {
  for (const breaker of allOf(project, "breaker")) {
    const rating = Number(breaker.properties.ratingA);
    const ok = ALLOWED_BREAKER_RATINGS.includes(rating);
    checks.push({ id: `breaker-rating-${breaker.id}`, ok, label: `Calibre disjoncteur: ${breaker.name}` });
    if (!ok) {
      errors.push({
        code: "INVALID_BREAKER_RATING",
        message: "Le calibre du disjoncteur doit être 10 A, 16 A, 20 A, 32 A ou 40 A."
      });
    }
  }

  for (const fuse of allOf(project, "fuse")) {
    const rating = Number(fuse.properties.ratingA);
    const ok = ALLOWED_FUSE_RATINGS.includes(rating);
    checks.push({ id: `fuse-rating-${fuse.id}`, ok, label: `Calibre fusible: ${fuse.name}` });
    if (!ok) {
      errors.push({
        code: "INVALID_FUSE_RATING",
        message: "Le calibre du fusible doit être 10 A, 16 A, 20 A ou 32 A."
      });
    }
  }

  for (const rcd of allOf(project, "rcd")) {
    const rating = Number(rcd.properties.ratingA);
    const sensitivity = Number(rcd.properties.sensitivityMA);
    const ratingOk = Number.isFinite(rating) && rating > 0;
    const sensitivityOk = Number.isFinite(sensitivity) && sensitivity > 0;

    checks.push({ id: `rcd-rating-${rcd.id}`, ok: ratingOk, label: `Calibre différentiel: ${rcd.name}` });
    checks.push({
      id: `rcd-sensitivity-${rcd.id}`,
      ok: sensitivityOk,
      label: `Sensibilité différentielle: ${rcd.name}`
    });

    if (!ratingOk) {
      errors.push({
        code: "INVALID_RCD_RATING",
        message: "Le calibre du différentiel doit être une valeur positive."
      });
    }
    if (!sensitivityOk) {
      errors.push({
        code: "INVALID_RCD_SENSITIVITY",
        message: "La sensibilité du différentiel doit être une valeur positive."
      });
    }
  }
}

function validateLampCircuit(project, source, checks, errors) {
  const lamp = firstOf(project, "lamp");
  if (!lamp) return;

  const breaker = firstOf(project, "breaker");
  const switchComponent = firstOf(project, "switch");

  addPresenceCheck(checks, errors, "lamp-breaker", breaker, "un disjoncteur pour la lampe", "MISSING_BREAKER");
  addPresenceCheck(checks, errors, "lamp-switch", switchComponent, "un interrupteur pour la lampe", "MISSING_SWITCH");

  if (Number(lamp.properties.powerW) <= 0) {
    errors.push({ code: "INVALID_LAMP_POWER", message: "La puissance de la lampe doit être positive." });
  }

  if (!source || !breaker || !switchComponent) return;

  const phasePath = hasExactPath(project, [
    [ref(source, "L"), ref(breaker, "L_IN")],
    [ref(breaker, "L_OUT"), ref(switchComponent, "L_IN")],
    [ref(switchComponent, "L_OUT"), ref(lamp, "L")]
  ]);
  checks.push({
    id: "lamp-phase-path",
    ok: phasePath,
    label: "Lampe — phase: source → disjoncteur → interrupteur → lampe"
  });
  if (!phasePath) {
    errors.push({
      code: "OPEN_PHASE_PATH",
      message: "Lampe: câble L source → disjoncteur → interrupteur → L lampe."
    });
  }

  const neutralConnected = hasTerminalConnection(project, ref(source, "N"), ref(lamp, "N"));
  checks.push({ id: "lamp-neutral-path", ok: neutralConnected, label: "Lampe — neutre: source N → lampe N" });
  if (!neutralConnected) {
    errors.push({
      code: "OPEN_NEUTRAL",
      message: "Lampe: relie la borne N de la source à la borne N de la lampe."
    });
  }
}

function validateSocketCircuit(project, source, checks, errors, warnings) {
  const sockets = allOf(project, "socket");
  if (!sockets.length) return;

  const rcd = firstOf(project, "rcd");
  const protections = [...allOf(project, "breaker"), ...allOf(project, "fuse")];

  addPresenceCheck(
    checks,
    errors,
    "socket-rcd",
    rcd,
    "un différentiel pour la prise",
    "MISSING_RCD"
  );

  const hasProtection = protections.length > 0;
  checks.push({ id: "socket-overcurrent-protection", ok: hasProtection, label: "Prise — protection de surintensité présente" });
  if (!hasProtection) {
    errors.push({
      code: "MISSING_SOCKET_PROTECTION",
      message: "Ajoute un disjoncteur ou un fusible pour protéger la prise."
    });
  }

  if (protections.length > 1) {
    warnings.push({
      code: "MULTIPLE_OVERCURRENT_PROTECTIONS",
      message: "Plusieurs protections de surintensité sont présentes; vérifie laquelle alimente la prise."
    });
  }

  if (!source || !rcd || !hasProtection) return;

  for (const socket of sockets) {
    const sourceToRcdPhase = hasTerminalConnection(project, ref(source, "L"), ref(rcd, "L_IN"));
    const matchingProtection = protections.find((protection) =>
      hasExactPath(project, [
        [ref(rcd, "L_OUT"), ref(protection, "L_IN")],
        [ref(protection, "L_OUT"), ref(socket, "L")]
      ])
    );
    const phasePath = sourceToRcdPhase && Boolean(matchingProtection);

    checks.push({
      id: `socket-phase-${socket.id}`,
      ok: phasePath,
      label: `${socket.name} — phase protégée: source → différentiel → protection → L`
    });
    if (!phasePath) {
      errors.push({
        code: "OPEN_SOCKET_PHASE_PATH",
        message: `${socket.name}: relie L source → L in différentiel → L out → disjoncteur/fusible → L prise.`
      });
    }

    const neutralPath = hasExactPath(project, [
      [ref(source, "N"), ref(rcd, "N_IN")],
      [ref(rcd, "N_OUT"), ref(socket, "N")]
    ]);
    checks.push({
      id: `socket-neutral-${socket.id}`,
      ok: neutralPath,
      label: `${socket.name} — neutre: source → différentiel → N`
    });
    if (!neutralPath) {
      errors.push({
        code: "OPEN_SOCKET_NEUTRAL_PATH",
        message: `${socket.name}: relie N source → N in différentiel → N out → N prise.`
      });
    }

    const pePath = hasTerminalConnection(project, ref(source, "PE"), ref(socket, "PE"));
    checks.push({
      id: `socket-pe-${socket.id}`,
      ok: pePath,
      label: `${socket.name} — protection PE: source PE → prise PE`
    });
    if (!pePath) {
      errors.push({
        code: "OPEN_PROTECTIVE_EARTH",
        message: `${socket.name}: relie PE source à PE prise.`
      });
    }
  }
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
  const validWires = [];
  for (const wire of project.wires) {
    if (!findTerminal(project, wire.from) || !findTerminal(project, wire.to)) {
      errors.push({ code: "INVALID_WIRE_ENDPOINT", message: `Le fil ${wire.id} pointe vers une borne inexistante.` });
      continue;
    }
    validWires.push(wire);
    const pair = [endpointKey(wire.from), endpointKey(wire.to)].sort().join("|");
    if (wirePairs.has(pair)) {
      errors.push({ code: "DUPLICATE_WIRE", message: "Une connexion est présente plusieurs fois." });
    }
    wirePairs.add(pair);
  }

  const source = firstOf(project, "source");
  addPresenceCheck(checks, errors, "component-source", source, "une source", "MISSING_SOURCE");

  const lamp = firstOf(project, "lamp");
  const sockets = allOf(project, "socket");
  const loads = project.components.filter((component) => COMPONENT_LIBRARY[component.type]?.category === "load");
  if (loads.length === 0) {
    checks.push({ id: "load-present", ok: false, label: "Au moins un récepteur" });
    errors.push({
      code: "MISSING_LOAD",
      message: "Ajoute au moins un récepteur à l’installation."
    });
  } else {
    checks.push({ id: "load-present", ok: true, label: "Au moins un récepteur" });
  }

  for (const component of project.components) {
    if (!FULLY_VALIDATED_TYPES.has(component.type)) {
      errors.push({
        code: "VALIDATION_PENDING_FOR_COMPONENT",
        message: `${component.name}: la bibliothèque connaît ce composant, mais ses règles électriques complètes seront ajoutées à l’étape de validation/simulation.`
      });
    }
  }

  validateProtectionProperties(project, checks, errors);
  validateLampCircuit(project, source, checks, errors);
  validateSocketCircuit(project, source, checks, errors, warnings);

  const connectedTerminalKeys = new Set();
  for (const wire of validWires) {
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
