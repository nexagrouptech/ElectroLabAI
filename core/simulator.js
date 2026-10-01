function endpointKey(ref) {
  return `${ref.componentId}::${ref.terminalId}`;
}

function hasConnection(project, a, b) {
  const keyA = endpointKey(a);
  const keyB = endpointKey(b);
  return project.wires.some((wire) => {
    const from = endpointKey(wire.from);
    const to = endpointKey(wire.to);
    return (from === keyA && to === keyB) || (from === keyB && to === keyA);
  });
}

function ref(component, terminalId) {
  return { componentId: component.id, terminalId };
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function findDirectLampSupply(project, source, lamp) {
  if (!source) return null;

  const breakers = project.components.filter((item) => item.type === "breaker");
  const switches = project.components.filter((item) => item.type === "switch");

  for (const breaker of breakers) {
    for (const switchComponent of switches) {
      const complete =
        hasConnection(project, ref(source, "L"), ref(breaker, "L_IN")) &&
        hasConnection(project, ref(breaker, "L_OUT"), ref(switchComponent, "L_IN")) &&
        hasConnection(project, ref(switchComponent, "L_OUT"), ref(lamp, "L")) &&
        hasConnection(project, ref(source, "N"), ref(lamp, "N"));

      if (complete) {
        return {
          kind: "source-direct",
          label: "Source directe",
          voltageV: Number(source.properties?.voltageV),
          breaker
        };
      }
    }
  }

  return null;
}

function findRelayLampSupply(project, source, lamp) {
  if (!source) return null;

  const relays = project.components.filter((item) => item.type === "relay");
  const breakers = project.components.filter((item) => item.type === "breaker");
  const switches = project.components.filter((item) => item.type === "switch");

  for (const relay of relays) {
    if (!hasConnection(project, ref(relay, "NO"), ref(lamp, "L"))) continue;
    if (!hasConnection(project, ref(source, "N"), ref(lamp, "N"))) continue;

    const breaker = breakers.find(
      (candidate) =>
        hasConnection(project, ref(source, "L"), ref(candidate, "L_IN")) &&
        hasConnection(project, ref(candidate, "L_OUT"), ref(relay, "COM"))
    );
    const switchComponent = switches.find(
      (candidate) =>
        hasConnection(project, ref(source, "L"), ref(candidate, "L_IN")) &&
        hasConnection(project, ref(candidate, "L_OUT"), ref(relay, "A1"))
    );
    const coilNeutral = hasConnection(project, ref(source, "N"), ref(relay, "A2"));

    if (breaker && switchComponent && coilNeutral) {
      return {
        kind: "relay-no",
        label: `Relais NO ${relay.name}`,
        voltageV: Number(source.properties?.voltageV),
        breaker,
        relay
      };
    }
  }

  return null;
}

function findTransformerLampSupply(project, source, lamp) {
  if (!source) return null;

  const transformers = project.components.filter((item) => item.type === "transformer");
  const breakers = project.components.filter((item) => item.type === "breaker");
  const switches = project.components.filter((item) => item.type === "switch");

  for (const transformer of transformers) {
    const primaryComplete =
      hasConnection(project, ref(source, "L"), ref(transformer, "P1")) &&
      hasConnection(project, ref(source, "N"), ref(transformer, "P2"));
    if (!primaryComplete) continue;
    if (!hasConnection(project, ref(transformer, "S2"), ref(lamp, "N"))) continue;

    for (const breaker of breakers) {
      if (!hasConnection(project, ref(transformer, "S1"), ref(breaker, "L_IN"))) continue;

      const switchComponent = switches.find(
        (candidate) =>
          hasConnection(project, ref(breaker, "L_OUT"), ref(candidate, "L_IN")) &&
          hasConnection(project, ref(candidate, "L_OUT"), ref(lamp, "L"))
      );

      if (switchComponent) {
        return {
          kind: "transformer-secondary",
          label: `Secondaire ${transformer.name}`,
          voltageV: Number(transformer.properties?.secondaryVoltageV),
          breaker,
          transformer
        };
      }
    }
  }

  return null;
}

function findSupportedLampSupply(project, source, lamp) {
  return (
    findDirectLampSupply(project, source, lamp) ||
    findRelayLampSupply(project, source, lamp) ||
    findTransformerLampSupply(project, source, lamp)
  );
}

export function calculateProject(project) {
  const source = project.components.find((item) => item.type === "source") || null;
  const voltageV = Number(source?.properties?.voltageV);
  const usableVoltage = Number.isFinite(voltageV) && voltageV > 0 ? voltageV : null;

  const loads = [];
  const transformers = [];
  const protectionChecks = [];
  const notes = [];

  if (!usableVoltage) {
    notes.push("Aucune tension source exploitable pour les calculs.");
  }

  const lamps = project.components.filter((item) => item.type === "lamp");
  for (const lamp of lamps) {
    const powerW = Number(lamp.properties?.powerW);
    if (!Number.isFinite(powerW) || powerW <= 0) continue;

    const supply = findSupportedLampSupply(project, source, lamp);
    const supplyVoltageV = Number(supply?.voltageV);

    if (!supply || !Number.isFinite(supplyVoltageV) || supplyVoltageV <= 0) {
      notes.push(`${lamp.name}: calcul non disponible tant que la topologie d’alimentation supportée n’est pas complète.`);
      continue;
    }

    const currentA = powerW / supplyVoltageV;
    loads.push({
      componentId: lamp.id,
      name: lamp.name,
      type: lamp.type,
      supplyKind: supply.kind,
      supplyLabel: supply.label,
      supplyVoltageV: round(supplyVoltageV, 2),
      powerW: round(powerW, 2),
      estimatedCurrentA: round(currentA)
    });

    const ratingA = Number(supply.breaker?.properties?.ratingA);
    if (Number.isFinite(ratingA) && ratingA > 0) {
      protectionChecks.push({
        componentId: supply.breaker.id,
        loadComponentId: lamp.id,
        label: `${supply.breaker.name} → ${lamp.name}`,
        ratingA,
        estimatedLoadCurrentA: round(currentA),
        adequateForKnownLoad: ratingA >= currentA,
        supplyKind: supply.kind
      });
    }
  }

  const transformerComponents = project.components.filter((item) => item.type === "transformer");
  for (const transformer of transformerComponents) {
    const primaryVoltageV = Number(transformer.properties?.primaryVoltageV);
    const secondaryVoltageV = Number(transformer.properties?.secondaryVoltageV);
    const ratedPowerVA = Number(transformer.properties?.ratedPowerVA);

    if (
      !Number.isFinite(primaryVoltageV) ||
      primaryVoltageV <= 0 ||
      !Number.isFinite(secondaryVoltageV) ||
      secondaryVoltageV <= 0 ||
      !Number.isFinite(ratedPowerVA) ||
      ratedPowerVA <= 0
    ) {
      continue;
    }

    transformers.push({
      componentId: transformer.id,
      name: transformer.name,
      primaryVoltageV,
      secondaryVoltageV,
      ratedPowerVA,
      voltageRatio: round(secondaryVoltageV / primaryVoltageV, 4),
      ratedPrimaryCurrentA: round(ratedPowerVA / primaryVoltageV),
      ratedSecondaryCurrentA: round(ratedPowerVA / secondaryVoltageV)
    });
  }

  if (transformers.length) {
    notes.push("Transformateur: courants nominaux calculés avec S/V; pertes et rendement ne sont pas modélisés.");
  }

  const relays = project.components.filter((item) => item.type === "relay");
  if (relays.length) {
    notes.push("Relais: topologie NO validée statiquement; dynamique de collage/décollage non simulée.");
  }

  const motors = project.components.filter((item) => item.type === "motor");
  if (motors.length) {
    notes.push(
      "Moteur: courant calculé à partir de la puissance non disponible; utiliser le courant nominal de plaque pour les contrôles supportés."
    );
  }

  const contactors = project.components.filter((item) => item.type === "contactor");
  if (contactors.length) {
    notes.push("Contacteur: topologie de commande validée; dynamique et coordination thermique non simulées.");
  }

  const sockets = project.components.filter((item) => item.type === "socket");
  if (sockets.length) {
    notes.push("La consommation des prises n’est pas calculée sans charge renseignée.");
  }

  const totalKnownPowerW = round(loads.reduce((sum, item) => sum + item.powerW, 0), 2);
  const allLoadsOnSourceVoltage =
    loads.length > 0 &&
    usableVoltage &&
    loads.every((item) => item.supplyVoltageV === round(usableVoltage, 2));

  const totalEstimatedCurrentA = allLoadsOnSourceVoltage
    ? round(loads.reduce((sum, item) => sum + item.estimatedCurrentA, 0))
    : null;

  if (loads.some((item) => item.supplyKind === "transformer-secondary")) {
    notes.push("Le courant global n’est pas additionné entre domaines de tension primaire et secondaire.");
  }

  return {
    voltageV: usableVoltage,
    loads,
    transformers,
    totalKnownPowerW,
    totalEstimatedCurrentA,
    protectionChecks,
    notes
  };
}
