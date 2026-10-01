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

export function calculateProject(project) {
  const source = project.components.find((item) => item.type === "source") || null;
  const voltageV = Number(source?.properties?.voltageV);
  const usableVoltage = Number.isFinite(voltageV) && voltageV > 0 ? voltageV : null;

  const loads = [];
  const protectionChecks = [];
  const notes = [];

  if (!usableVoltage) {
    notes.push("Aucune tension source exploitable pour les calculs.");
  }

  const lamps = project.components.filter((item) => item.type === "lamp");
  for (const lamp of lamps) {
    const powerW = Number(lamp.properties?.powerW);
    if (!usableVoltage || !Number.isFinite(powerW) || powerW <= 0) continue;

    const currentA = powerW / usableVoltage;
    loads.push({
      componentId: lamp.id,
      name: lamp.name,
      type: lamp.type,
      powerW: round(powerW, 2),
      estimatedCurrentA: round(currentA)
    });

    const breakers = project.components.filter((item) => item.type === "breaker");
    const switches = project.components.filter((item) => item.type === "switch");

    for (const breaker of breakers) {
      for (const switchComponent of switches) {
        const exactLampPath =
          hasConnection(project, ref(source, "L"), ref(breaker, "L_IN")) &&
          hasConnection(project, ref(breaker, "L_OUT"), ref(switchComponent, "L_IN")) &&
          hasConnection(project, ref(switchComponent, "L_OUT"), ref(lamp, "L")) &&
          hasConnection(project, ref(source, "N"), ref(lamp, "N"));

        if (!exactLampPath) continue;

        const ratingA = Number(breaker.properties?.ratingA);
        if (Number.isFinite(ratingA) && ratingA > 0) {
          protectionChecks.push({
            componentId: breaker.id,
            loadComponentId: lamp.id,
            label: `${breaker.name} → ${lamp.name}`,
            ratingA,
            estimatedLoadCurrentA: round(currentA),
            adequateForKnownLoad: ratingA >= currentA
          });
        }
      }
    }
  }

  const sockets = project.components.filter((item) => item.type === "socket");
  if (sockets.length) {
    notes.push("La consommation des prises n’est pas calculée sans charge renseignée.");
  }

  const pendingTypes = [...new Set(
    project.components
      .filter((item) => ["relay", "contactor", "transformer", "motor"].includes(item.type))
      .map((item) => item.type)
  )];
  if (pendingTypes.length) {
    notes.push(`Calculs complets non disponibles pour: ${pendingTypes.join(", ")}.`);
  }

  const totalKnownPowerW = round(loads.reduce((sum, item) => sum + item.powerW, 0), 2);
  const totalEstimatedCurrentA =
    usableVoltage && totalKnownPowerW > 0 ? round(totalKnownPowerW / usableVoltage) : null;

  return {
    voltageV: usableVoltage,
    loads,
    totalKnownPowerW,
    totalEstimatedCurrentA,
    protectionChecks,
    notes
  };
}
