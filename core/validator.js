import { COMPONENT_LIBRARY, findTerminal } from "./project.js";
import { calculateProject } from "./simulator.js";

const ALLOWED_BREAKER_RATINGS = [10, 16, 20, 32, 40];
const ALLOWED_FUSE_RATINGS = [10, 16, 20, 32];
const FULLY_VALIDATED_TYPES = new Set(["source", "breaker", "switch", "lamp", "socket", "fuse", "rcd", "contactor", "motor"]);

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

function terminalConnected(project, component, terminalId) {
  const key = endpointKey(ref(component, terminalId));
  return project.wires.some(
    (wire) => endpointKey(wire.from) === key || endpointKey(wire.to) === key
  );
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

function validateTertiaryProperties(project, source, checks, errors, warnings) {
  for (const transformer of allOf(project, "transformer")) {
    const primaryVoltageV = Number(transformer.properties.primaryVoltageV);
    const secondaryVoltageV = Number(transformer.properties.secondaryVoltageV);
    const ratedPowerVA = Number(transformer.properties.ratedPowerVA);

    const primaryOk = Number.isFinite(primaryVoltageV) && primaryVoltageV > 0;
    const secondaryOk = Number.isFinite(secondaryVoltageV) && secondaryVoltageV > 0;
    const powerOk = Number.isFinite(ratedPowerVA) && ratedPowerVA > 0;

    checks.push({ id: `transformer-primary-${transformer.id}`, ok: primaryOk, label: `${transformer.name}: tension primaire positive` });
    checks.push({ id: `transformer-secondary-${transformer.id}`, ok: secondaryOk, label: `${transformer.name}: tension secondaire positive` });
    checks.push({ id: `transformer-power-${transformer.id}`, ok: powerOk, label: `${transformer.name}: puissance nominale positive` });

    if (!primaryOk || !secondaryOk || !powerOk) {
      errors.push({
        code: "INVALID_TRANSFORMER_PROPERTIES",
        message: `${transformer.name}: renseigne des tensions primaire/secondaire et une puissance nominale strictement positives.`
      });
    }

    const primaryP1Connected = terminalConnected(project, transformer, "P1");
    const primaryP2Connected = terminalConnected(project, transformer, "P2");
    const primaryAny = primaryP1Connected || primaryP2Connected;

    if (primaryAny && source) {
      const primaryComplete =
        hasTerminalConnection(project, ref(source, "L"), ref(transformer, "P1")) &&
        hasTerminalConnection(project, ref(source, "N"), ref(transformer, "P2"));

      checks.push({
        id: `transformer-primary-path-${transformer.id}`,
        ok: primaryComplete,
        label: `${transformer.name}: primaire L/N correctement raccordé`
      });

      if (!primaryComplete) {
        errors.push({
          code: "OPEN_TRANSFORMER_PRIMARY",
          message: `${transformer.name}: raccorde L source → P1 et N source → P2 pour le primaire pris en charge.`
        });
      } else if (primaryOk) {
        const sourceVoltageV = Number(source.properties.voltageV);
        const voltageMatches = Number.isFinite(sourceVoltageV) && sourceVoltageV === primaryVoltageV;
        checks.push({
          id: `transformer-primary-voltage-${transformer.id}`,
          ok: voltageMatches,
          label: `${transformer.name}: tension source compatible avec le primaire`
        });
        if (!voltageMatches) {
          errors.push({
            code: "TRANSFORMER_PRIMARY_VOLTAGE_MISMATCH",
            message: `${transformer.name}: la source est à ${sourceVoltageV} V mais le primaire est déclaré à ${primaryVoltageV} V.`
          });
        }
      }
    }

    const secondaryS1Connected = terminalConnected(project, transformer, "S1");
    const secondaryS2Connected = terminalConnected(project, transformer, "S2");
    const secondaryAny = secondaryS1Connected || secondaryS2Connected;
    if (secondaryAny && !(secondaryS1Connected && secondaryS2Connected)) {
      errors.push({
        code: "OPEN_TRANSFORMER_SECONDARY",
        message: `${transformer.name}: le secondaire doit utiliser S1 et S2 ensemble dans le modèle pris en charge.`
      });
    } else if (!secondaryAny) {
      warnings.push({
        code: "TRANSFORMER_SECONDARY_UNLOADED",
        message: `${transformer.name}: secondaire non raccordé; seuls les calculs nominaux sont disponibles.`
      });
    }
  }

  for (const motor of allOf(project, "motor")) {
    const voltageV = Number(motor.properties.voltageV);
    const powerW = Number(motor.properties.powerW);
    const voltageOk = Number.isFinite(voltageV) && voltageV > 0;
    const powerOk = Number.isFinite(powerW) && powerW > 0;

    checks.push({ id: `motor-voltage-${motor.id}`, ok: voltageOk, label: `${motor.name}: tension positive` });
    checks.push({ id: `motor-power-${motor.id}`, ok: powerOk, label: `${motor.name}: puissance positive` });

    if (!voltageOk || !powerOk) {
      errors.push({
        code: "INVALID_MOTOR_PROPERTIES",
        message: `${motor.name}: la tension et la puissance doivent être strictement positives.`
      });
    }

    const lConnected = terminalConnected(project, motor, "L");
    const nConnected = terminalConnected(project, motor, "N");
    const peConnected = terminalConnected(project, motor, "PE");
    const anyConnected = lConnected || nConnected || peConnected;

    if (anyConnected) {
      checks.push({ id: `motor-l-${motor.id}`, ok: lConnected, label: `${motor.name}: borne L raccordée` });
      checks.push({ id: `motor-n-${motor.id}`, ok: nConnected, label: `${motor.name}: borne N raccordée` });
      checks.push({ id: `motor-pe-${motor.id}`, ok: peConnected, label: `${motor.name}: borne PE raccordée` });

      if (!lConnected || !nConnected || !peConnected) {
        errors.push({
          code: "INCOMPLETE_MOTOR_TERMINALS",
          message: `${motor.name}: le modèle monophasé requiert L, N et PE raccordés.`
        });
      }
    }
  }

  for (const relay of allOf(project, "relay")) {
    const coilVoltageV = Number(relay.properties.coilVoltageV);
    const ok = Number.isFinite(coilVoltageV) && coilVoltageV > 0;
    checks.push({ id: `relay-coil-${relay.id}`, ok, label: `${relay.name}: tension bobine positive` });
    if (!ok) {
      errors.push({
        code: "INVALID_RELAY_COIL_VOLTAGE",
        message: `${relay.name}: la tension de bobine doit être strictement positive.`
      });
    }
  }

  for (const contactor of allOf(project, "contactor")) {
    const coilVoltageV = Number(contactor.properties.coilVoltageV);
    const ratingA = Number(contactor.properties.ratingA);
    const coilOk = Number.isFinite(coilVoltageV) && coilVoltageV > 0;
    const ratingOk = Number.isFinite(ratingA) && ratingA > 0;

    checks.push({ id: `contactor-coil-${contactor.id}`, ok: coilOk, label: `${contactor.name}: tension bobine positive` });
    checks.push({ id: `contactor-rating-${contactor.id}`, ok: ratingOk, label: `${contactor.name}: calibre positif` });

    if (!coilOk || !ratingOk) {
      errors.push({
        code: "INVALID_CONTACTOR_PROPERTIES",
        message: `${contactor.name}: tension bobine et calibre doivent être strictement positifs.`
      });
    }
  }
}

function validateMotorContactorTopology(project, source, checks, errors, warnings) {
  const motors = allOf(project, "motor");
  const contactors = allOf(project, "contactor");
  const breakers = allOf(project, "breaker");
  const switches = allOf(project, "switch");
  const matchedContactorIds = new Set();

  for (const motor of motors) {
    const voltageV = Number(motor.properties.voltageV);
    const powerW = Number(motor.properties.powerW);
    const ratedCurrentA = Number(motor.properties.ratedCurrentA);

    const voltageOk = Number.isFinite(voltageV) && voltageV > 0;
    const powerOk = Number.isFinite(powerW) && powerW > 0;
    const ratedCurrentOk = Number.isFinite(ratedCurrentA) && ratedCurrentA > 0;

    checks.push({ id: `motor-rated-current-${motor.id}`, ok: ratedCurrentOk, label: `${motor.name}: courant nominal plaque renseigné` });

    if (!ratedCurrentOk) {
      errors.push({
        code: "MISSING_MOTOR_RATED_CURRENT",
        message: `${motor.name}: renseigne le courant nominal indiqué sur la plaque moteur avant validation.`
      });
    }

    if (!source) continue;

    const matchingContactor = contactors.find((contactor) =>
      hasTerminalConnection(project, ref(contactor, "T1"), ref(motor, "L"))
    );

    const matchingBreaker = matchingContactor
      ? breakers.find(
          (breaker) =>
            hasTerminalConnection(project, ref(source, "L"), ref(breaker, "L_IN")) &&
            hasTerminalConnection(project, ref(breaker, "L_OUT"), ref(matchingContactor, "L1"))
        )
      : null;

    const matchingSwitch = matchingContactor
      ? switches.find(
          (switchComponent) =>
            hasTerminalConnection(project, ref(source, "L"), ref(switchComponent, "L_IN")) &&
            hasTerminalConnection(project, ref(switchComponent, "L_OUT"), ref(matchingContactor, "A1"))
        )
      : null;

    const powerPathOk = Boolean(matchingContactor && matchingBreaker);
    const controlPathOk = Boolean(
      matchingContactor &&
      matchingSwitch &&
      hasTerminalConnection(project, ref(source, "N"), ref(matchingContactor, "A2"))
    );
    const neutralOk = hasTerminalConnection(project, ref(source, "N"), ref(motor, "N"));
    const peOk = hasTerminalConnection(project, ref(source, "PE"), ref(motor, "PE"));

    checks.push({
      id: `motor-power-path-${motor.id}`,
      ok: powerPathOk,
      label: `${motor.name}: source → disjoncteur → contacteur → moteur`
    });
    checks.push({
      id: `motor-control-path-${motor.id}`,
      ok: controlPathOk,
      label: `${motor.name}: commande source → interrupteur → bobine contacteur`
    });
    checks.push({ id: `motor-neutral-path-${motor.id}`, ok: neutralOk, label: `${motor.name}: neutre raccordé` });
    checks.push({ id: `motor-pe-path-${motor.id}`, ok: peOk, label: `${motor.name}: PE raccordé` });

    if (!powerPathOk) {
      errors.push({
        code: "OPEN_MOTOR_POWER_PATH",
        message: `${motor.name}: le schéma supporté requiert L source → disjoncteur → L1/T1 contacteur → L moteur.`
      });
    }
    if (!controlPathOk) {
      errors.push({
        code: "OPEN_CONTACTOR_CONTROL_PATH",
        message: `${motor.name}: le schéma supporté requiert L source → interrupteur → A1 contacteur et N source → A2 contacteur.`
      });
    }
    if (!neutralOk) {
      errors.push({
        code: "OPEN_MOTOR_NEUTRAL",
        message: `${motor.name}: relie N source à N moteur.`
      });
    }
    if (!peOk) {
      errors.push({
        code: "OPEN_MOTOR_PE",
        message: `${motor.name}: relie PE source à PE moteur.`
      });
    }

    if (matchingContactor) {
      matchedContactorIds.add(matchingContactor.id);

      const coilVoltageV = Number(matchingContactor.properties.coilVoltageV);
      const contactorRatingA = Number(matchingContactor.properties.ratingA);
      const sourceVoltageV = Number(source.properties.voltageV);

      const coilMatches =
        Number.isFinite(sourceVoltageV) &&
        Number.isFinite(coilVoltageV) &&
        sourceVoltageV === coilVoltageV;
      checks.push({
        id: `contactor-coil-match-${matchingContactor.id}`,
        ok: coilMatches,
        label: `${matchingContactor.name}: tension bobine compatible source`
      });
      if (!coilMatches) {
        errors.push({
          code: "CONTACTOR_COIL_VOLTAGE_MISMATCH",
          message: `${matchingContactor.name}: bobine ${coilVoltageV} V incompatible avec la source ${sourceVoltageV} V.`
        });
      }

      const motorVoltageMatches =
        Number.isFinite(sourceVoltageV) &&
        voltageOk &&
        sourceVoltageV === voltageV;
      checks.push({
        id: `motor-voltage-match-${motor.id}`,
        ok: motorVoltageMatches,
        label: `${motor.name}: tension nominale compatible source`
      });
      if (!motorVoltageMatches) {
        errors.push({
          code: "MOTOR_VOLTAGE_MISMATCH",
          message: `${motor.name}: tension moteur ${voltageV} V incompatible avec la source ${sourceVoltageV} V.`
        });
      }

      if (ratedCurrentOk) {
        const contactorRatingOk =
          Number.isFinite(contactorRatingA) && contactorRatingA >= ratedCurrentA;
        checks.push({
          id: `contactor-rating-vs-motor-${matchingContactor.id}`,
          ok: contactorRatingOk,
          label: `${matchingContactor.name}: calibre ≥ courant nominal moteur`
        });
        if (!contactorRatingOk) {
          errors.push({
            code: "CONTACTOR_UNDERSIZED_FOR_MOTOR",
            message: `${matchingContactor.name}: calibre ${contactorRatingA} A inférieur au courant nominal moteur ${ratedCurrentA} A.`
          });
        }

        if (matchingBreaker) {
          const breakerRatingA = Number(matchingBreaker.properties.ratingA);
          const breakerAtLeastRatedCurrent =
            Number.isFinite(breakerRatingA) && breakerRatingA >= ratedCurrentA;
          checks.push({
            id: `motor-breaker-min-${matchingBreaker.id}-${motor.id}`,
            ok: breakerAtLeastRatedCurrent,
            label: `${matchingBreaker.name}: calibre ≥ courant nominal moteur`
          });
          if (!breakerAtLeastRatedCurrent) {
            errors.push({
              code: "BREAKER_BELOW_MOTOR_RATED_CURRENT",
              message: `${matchingBreaker.name}: calibre ${breakerRatingA} A inférieur au courant nominal moteur ${ratedCurrentA} A.`
            });
          }
        }
      }
    }

    if (powerOk) {
      warnings.push({
        code: "MOTOR_STARTING_AND_THERMAL_NOT_MODELED",
        message: `${motor.name}: courant de démarrage, facteur de puissance, rendement et coordination thermique ne sont pas encore modélisés.`
      });
    }
  }

  for (const contactor of contactors) {
    if (!matchedContactorIds.has(contactor.id)) {
      errors.push({
        code: "CONTACTOR_NOT_IN_SUPPORTED_MOTOR_TOPOLOGY",
        message: `${contactor.name}: ce contacteur n’est pas raccordé dans le schéma moteur supporté.`
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
  validateTertiaryProperties(project, source, checks, errors, warnings);
  validateMotorContactorTopology(project, source, checks, errors, warnings);
  validateLampCircuit(project, source, checks, errors);
  validateSocketCircuit(project, source, checks, errors, warnings);

  const calculations = calculateProject(project);
  for (const protection of calculations.protectionChecks) {
    checks.push({
      id: `known-load-protection-${protection.componentId}-${protection.loadComponentId}`,
      ok: protection.adequateForKnownLoad,
      label: `${protection.label}: calibre ≥ courant estimé`
    });
    if (!protection.adequateForKnownLoad) {
      warnings.push({
        code: "PROTECTION_BELOW_ESTIMATED_LOAD",
        message:
          `${protection.label}: calibre ${protection.ratingA} A inférieur au courant estimé ${protection.estimatedLoadCurrentA} A.`
      });
    }
  }

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
