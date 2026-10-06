import test from "node:test";
import assert from "node:assert/strict";
import {
  addComponent,
  connect,
  createProject,
  deserializeProject,
  serializeProject,
  updateComponent
} from "../core/project.js";
import { validateProject } from "../core/validator.js";
import { calculateProject } from "../core/simulator.js";
import { getComponentVisualState } from "../core/visual-state.js";
import {
  COMPONENT_CATALOG,
  getComponentDefinition,
  listComponentDefinitions,
  searchComponentDefinitions
} from "../core/catalog.js";
import { createExerciseProject, evaluateExercise, getExercise, isComponentAllowed, listExercises, recordExerciseAttempt } from "../core/exercises.js";

function validSocketProject(protectionType = "fuse") {
  const project = createProject({ id: "socket-project" });
  const source = addComponent(project, "source", { id: "source-domestic" });
  const rcd = addComponent(project, "rcd", { id: "rcd" });
  const protection = addComponent(project, protectionType, { id: "protection" });
  const socket = addComponent(project, "socket", { id: "socket" });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: rcd.id, terminalId: "L_IN" }, { id: "d1" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: rcd.id, terminalId: "N_IN" }, { id: "d2" });
  connect(project, { componentId: rcd.id, terminalId: "L_OUT" }, { componentId: protection.id, terminalId: "L_IN" }, { id: "d3" });
  connect(project, { componentId: protection.id, terminalId: "L_OUT" }, { componentId: socket.id, terminalId: "L" }, { id: "d4" });
  connect(project, { componentId: rcd.id, terminalId: "N_OUT" }, { componentId: socket.id, terminalId: "N" }, { id: "d5" });
  connect(project, { componentId: source.id, terminalId: "PE" }, { componentId: socket.id, terminalId: "PE" }, { id: "d6" });
  return project;
}

function validLampProject() {
  const project = createProject({ id: "p1" });
  const source = addComponent(project, "source", { id: "source" });
  const breaker = addComponent(project, "breaker", { id: "breaker" });
  const sw = addComponent(project, "switch", { id: "switch" });
  const lamp = addComponent(project, "lamp", { id: "lamp" });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: breaker.id, terminalId: "L_IN" }, { id: "w1" });
  connect(project, { componentId: breaker.id, terminalId: "L_OUT" }, { componentId: sw.id, terminalId: "L_IN" }, { id: "w2" });
  connect(project, { componentId: sw.id, terminalId: "L_OUT" }, { componentId: lamp.id, terminalId: "L" }, { id: "w3" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: lamp.id, terminalId: "N" }, { id: "w4" });
  return project;
}

function validMotorContactorProject() {
  const project = createProject({ id: "motor-project" });
  const source = addComponent(project, "source", { id: "motor-source" });
  const breaker = addComponent(project, "breaker", {
    id: "motor-breaker",
    properties: { ratingA: 16 }
  });
  const controlSwitch = addComponent(project, "switch", { id: "motor-switch" });
  const contactor = addComponent(project, "contactor", {
    id: "motor-contactor",
    properties: { coilVoltageV: 230, ratingA: 25 }
  });
  const motor = addComponent(project, "motor", {
    id: "motor",
    properties: { voltageV: 230, powerW: 750, ratedCurrentA: 4.2 }
  });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: breaker.id, terminalId: "L_IN" }, { id: "m1" });
  connect(project, { componentId: breaker.id, terminalId: "L_OUT" }, { componentId: contactor.id, terminalId: "L1" }, { id: "m2" });
  connect(project, { componentId: contactor.id, terminalId: "T1" }, { componentId: motor.id, terminalId: "L" }, { id: "m3" });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: controlSwitch.id, terminalId: "L_IN" }, { id: "m4" });
  connect(project, { componentId: controlSwitch.id, terminalId: "L_OUT" }, { componentId: contactor.id, terminalId: "A1" }, { id: "m5" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: contactor.id, terminalId: "A2" }, { id: "m6" });

  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: motor.id, terminalId: "N" }, { id: "m7" });
  connect(project, { componentId: source.id, terminalId: "PE" }, { componentId: motor.id, terminalId: "PE" }, { id: "m8" });
  return project;
}

function validRelayLampProject() {
  const project = createProject({ id: "relay-project" });
  const source = addComponent(project, "source", { id: "relay-source" });
  const breaker = addComponent(project, "breaker", {
    id: "relay-breaker",
    properties: { ratingA: 10 }
  });
  const controlSwitch = addComponent(project, "switch", { id: "relay-switch" });
  const relay = addComponent(project, "relay", {
    id: "relay",
    properties: { coilVoltageV: 230 }
  });
  const lamp = addComponent(project, "lamp", {
    id: "relay-lamp",
    properties: { powerW: 60 }
  });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: breaker.id, terminalId: "L_IN" }, { id: "r1" });
  connect(project, { componentId: breaker.id, terminalId: "L_OUT" }, { componentId: relay.id, terminalId: "COM" }, { id: "r2" });
  connect(project, { componentId: relay.id, terminalId: "NO" }, { componentId: lamp.id, terminalId: "L" }, { id: "r3" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: lamp.id, terminalId: "N" }, { id: "r4" });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: controlSwitch.id, terminalId: "L_IN" }, { id: "r5" });
  connect(project, { componentId: controlSwitch.id, terminalId: "L_OUT" }, { componentId: relay.id, terminalId: "A1" }, { id: "r6" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: relay.id, terminalId: "A2" }, { id: "r7" });
  return project;
}

function validTransformerSecondaryLampProject() {
  const project = createProject({ id: "transformer-project" });
  const source = addComponent(project, "source", { id: "tx-source" });
  const transformer = addComponent(project, "transformer", {
    id: "tx",
    properties: { primaryVoltageV: 230, secondaryVoltageV: 24, ratedPowerVA: 250 }
  });
  const breaker = addComponent(project, "breaker", {
    id: "tx-breaker",
    properties: { ratingA: 10 }
  });
  const sw = addComponent(project, "switch", { id: "tx-switch" });
  const lamp = addComponent(project, "lamp", {
    id: "tx-lamp",
    properties: { powerW: 60 }
  });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: transformer.id, terminalId: "P1" }, { id: "t1" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: transformer.id, terminalId: "P2" }, { id: "t2" });
  connect(project, { componentId: transformer.id, terminalId: "S1" }, { componentId: breaker.id, terminalId: "L_IN" }, { id: "t3" });
  connect(project, { componentId: breaker.id, terminalId: "L_OUT" }, { componentId: sw.id, terminalId: "L_IN" }, { id: "t4" });
  connect(project, { componentId: sw.id, terminalId: "L_OUT" }, { componentId: lamp.id, terminalId: "L" }, { id: "t5" });
  connect(project, { componentId: transformer.id, terminalId: "S2" }, { componentId: lamp.id, terminalId: "N" }, { id: "t6" });
  return project;
}


test("keeps a lamp visually off while its supported supply topology is incomplete", () => {
  const project = createProject({ id: "visual-lamp-off" });
  const lamp = addComponent(project, "lamp", { id: "lamp-off" });
  const state = getComponentVisualState(lamp, calculateProject(project));

  assert.equal(state.key, "inactive");
  assert.equal(state.energized, false);
  assert.equal(state.label, "Éteinte");
});

test("lights a lamp visually when a supported supply topology is complete", () => {
  const project = validLampProject();
  const lamp = project.components.find((item) => item.type === "lamp");
  const state = getComponentVisualState(lamp, calculateProject(project));

  assert.equal(state.key, "energized");
  assert.equal(state.energized, true);
  assert.equal(state.label, "Allumée");
});

test("creates the v0.2 supported components", () => {
  const project = createProject();
  for (const type of ["source", "breaker", "switch", "lamp", "socket", "fuse", "rcd"]) addComponent(project, type);
  assert.deepEqual(project.components.map((item) => item.type), [
    "source",
    "breaker",
    "switch",
    "lamp",
    "socket",
    "fuse",
    "rcd"
  ]);
  assert.equal(project.version, "0.5.0");
});

test("defines domestic terminals and default protection properties", () => {
  const project = createProject();
  const source = addComponent(project, "source", { id: "source-domestic" });
  const socket = addComponent(project, "socket", { id: "socket" });
  const fuse = addComponent(project, "fuse", { id: "fuse" });
  const rcd = addComponent(project, "rcd", { id: "rcd" });

  assert.deepEqual(source.terminals.map((item) => item.id), ["L", "N", "PE"]);
  assert.deepEqual(socket.terminals.map((item) => item.id), ["L", "N", "PE"]);
  assert.equal(fuse.properties.ratingA, 16);
  assert.equal(rcd.properties.ratingA, 40);
  assert.equal(rcd.properties.sensitivityMA, 30);
  assert.deepEqual(rcd.terminals.map((item) => item.id), ["L_IN", "N_IN", "L_OUT", "N_OUT"]);
});

test("validates a complete lamp circuit", () => {
  const result = validateProject(validLampProject());
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("rejects an open neutral", () => {
  const project = validLampProject();
  project.wires = project.wires.filter((wire) => wire.id !== "w4");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_NEUTRAL"));
});

test("rejects an incomplete phase path", () => {
  const project = validLampProject();
  project.wires = project.wires.filter((wire) => wire.id !== "w2");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_PHASE_PATH"));
});

test("rejects a phase wire placed on the wrong terminal", () => {
  const project = validLampProject();
  project.wires.find((wire) => wire.id === "w1").from.terminalId = "N";
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_PHASE_PATH"));
});

test("supports manual breaker ratings", () => {
  const project = validLampProject();
  updateComponent(project, "breaker", { properties: { ratingA: 32 } });
  assert.equal(validateProject(project).valid, true);

  updateComponent(project, "breaker", { properties: { ratingA: 13 } });
  assert.ok(validateProject(project).errors.some((error) => error.code === "INVALID_BREAKER_RATING"));
});

test("refuses duplicate connections", () => {
  const project = validLampProject();
  assert.throws(
    () => connect(project, { componentId: "source", terminalId: "N" }, { componentId: "lamp", terminalId: "N" }),
    /already exists/
  );
});

test("round-trips saved projects without losing data", () => {
  const project = validLampProject();
  const restored = deserializeProject(serializeProject(project));
  assert.equal(restored.components.length, 4);
  assert.equal(restored.wires.length, 4);
  assert.equal(restored.components.find((item) => item.id === "breaker").properties.ratingA, 16);
  assert.equal(restored.version, "0.5.0");
});


test("validates a protected domestic socket circuit with a fuse", () => {
  const result = validateProject(validSocketProject("fuse"));
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("validates a protected domestic socket circuit with a breaker", () => {
  const result = validateProject(validSocketProject("breaker"));
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("rejects a domestic socket without PE continuity", () => {
  const project = validSocketProject("fuse");
  project.wires = project.wires.filter((wire) => wire.id !== "d6");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_PROTECTIVE_EARTH"));
});

test("rejects a domestic socket with an open neutral after the differential", () => {
  const project = validSocketProject("fuse");
  project.wires = project.wires.filter((wire) => wire.id !== "d5");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_SOCKET_NEUTRAL_PATH"));
});

test("rejects unsupported fuse ratings", () => {
  const project = validSocketProject("fuse");
  updateComponent(project, "protection", { properties: { ratingA: 13 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "INVALID_FUSE_RATING"));
});

test("rejects non-positive differential sensitivity", () => {
  const project = validSocketProject("breaker");
  updateComponent(project, "rcd", { properties: { sensitivityMA: 0 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "INVALID_RCD_SENSITIVITY"));
});

test("keeps warnings separate from blocking errors", () => {
  const project = validSocketProject("breaker");
  addComponent(project, "fuse", { id: "unused-fuse" });
  const result = validateProject(project);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.code === "MULTIPLE_OVERCURRENT_PROTECTIONS"));
  assert.ok(result.warnings.some((warning) => warning.code === "UNCONNECTED_TERMINALS"));
});

test("exposes reusable predefined exercises", () => {
  assert.ok(listExercises().length >= 2);
  assert.equal(getExercise("lamp-basic").ruleId, "lamp-circuit");
  assert.equal(getExercise("socket-protected").ruleId, "socket-protected");
});

test("creates an exercise-bound project", () => {
  const project = createExerciseProject("lamp-basic");
  assert.equal(project.version, "0.5.0");
  assert.equal(project.exerciseId, "lamp-basic");
});

test("restricts components from exercise definitions", () => {
  assert.equal(isComponentAllowed("lamp-basic", "lamp"), true);
  assert.equal(isComponentAllowed("lamp-basic", "socket"), false);
  assert.equal(isComponentAllowed("socket-protected", "rcd"), true);
  assert.equal(isComponentAllowed("socket-protected", "switch"), false);
});

test("persists exercise identity", () => {
  const project = createExerciseProject("socket-protected");
  const restored = deserializeProject(serializeProject(project));
  assert.equal(restored.exerciseId, "socket-protected");
});


test("passes the lamp exercise only when deterministic validation passes", () => {
  const project = validLampProject();
  project.exerciseId = "lamp-basic";
  const result = evaluateExercise(project, validateProject(project));
  assert.equal(result.passed, true);
  assert.equal(result.score, 100);
});

test("fails the lamp exercise with deterministic feedback", () => {
  const project = validLampProject();
  project.exerciseId = "lamp-basic";
  project.wires = project.wires.filter((wire) => wire.id !== "w2");
  const result = evaluateExercise(project, validateProject(project));
  assert.equal(result.passed, false);
  assert.ok(result.feedback.length > 0);
  assert.ok(result.score < 100);
});

test("passes the protected socket exercise", () => {
  const project = validSocketProject("breaker");
  project.exerciseId = "socket-protected";
  const result = evaluateExercise(project, validateProject(project));
  assert.equal(result.passed, true);
  assert.equal(result.score, 100);
});

test("records exercise attempts and persists the latest result", () => {
  const project = createExerciseProject("lamp-basic");
  const result = { passed: false, score: 50, scoreMax: 100, feedback: ["À corriger"] };
  const attempt = recordExerciseAttempt(project, result, "2026-10-01T00:00:00.000Z");
  assert.equal(attempt.attempt, 1);
  assert.equal(project.exerciseProgress.attempts, 1);
  assert.equal(project.exerciseProgress.lastResult.score, 50);

  const restored = deserializeProject(serializeProject(project));
  assert.equal(restored.exerciseProgress.attempts, 1);
  assert.equal(restored.exerciseProgress.history.length, 1);
});


test("catalog exposes stable component identifiers", () => {
  const source = getComponentDefinition("source");
  assert.equal(source.catalogId, "residential.source.230v");
  assert.equal(COMPONENT_CATALOG.breaker.category, "protection");
  assert.equal(listComponentDefinitions().length, 11);
});

test("catalog search finds components by label and tags", () => {
  assert.deepEqual(
    searchComponentDefinitions({ query: "prise" }).map((item) => item.type),
    ["socket"]
  );
  assert.ok(
    searchComponentDefinitions({ query: "protection" }).some((item) => item.type === "breaker")
  );
});

test("catalog filters by category", () => {
  const protections = searchComponentDefinitions({ category: "protection" });
  assert.deepEqual(
    protections.map((item) => item.type).sort(),
    ["breaker", "fuse", "rcd"]
  );
});

test("new components carry catalog ids and old saves are normalized", () => {
  const project = createProject();
  const source = addComponent(project, "source", { id: "catalog-source" });
  assert.equal(source.catalogId, "residential.source.230v");

  const saved = JSON.parse(serializeProject(project));
  delete saved.components[0].catalogId;
  const restored = deserializeProject(saved);
  assert.equal(restored.components[0].catalogId, "residential.source.230v");
});


test("catalog registers first tertiary components", () => {
  for (const type of ["relay", "contactor", "transformer", "motor"]) {
    const definition = getComponentDefinition(type);
    assert.ok(definition, type);
    assert.ok(definition.catalogId.startsWith("tertiary."));
    assert.ok(definition.terminals.length >= 2);
  }
});

test("catalog exposes property metadata for configurable components", () => {
  assert.deepEqual(
    getComponentDefinition("breaker").propertySchema.ratingA.options,
    [10, 16, 20, 32, 40]
  );
  assert.equal(getComponentDefinition("motor").propertySchema.powerW.unit, "W");
  assert.equal(getComponentDefinition("transformer").propertySchema.secondaryVoltageV.input, "number");
});

test("new tertiary components inherit stable ids, terminals and defaults", () => {
  const project = createProject();
  const motor = addComponent(project, "motor", { id: "motor-1" });
  const transformer = addComponent(project, "transformer", { id: "transformer-1" });

  assert.equal(motor.catalogId, "tertiary.load.motor.single-phase");
  assert.deepEqual(motor.terminals.map((item) => item.id), ["L", "N", "PE"]);
  assert.equal(motor.properties.powerW, 750);

  assert.equal(transformer.catalogId, "tertiary.supply.transformer");
  assert.deepEqual(transformer.terminals.map((item) => item.id), ["P1", "P2", "S1", "S2"]);
  assert.equal(transformer.properties.secondaryVoltageV, 24);
});

test("relay outside the supported topology is rejected explicitly", () => {
  const project = validLampProject();
  addComponent(project, "relay", { id: "relay-extra" });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_RELAY_POWER_PATH"));
  assert.equal(result.errors.some((error) => error.code === "VALIDATION_PENDING_FOR_COMPONENT"), false);
});


test("calculates deterministic lamp current from known power and source voltage", () => {
  const project = validLampProject();
  const result = calculateProject(project);
  assert.equal(result.voltageV, 230);
  assert.equal(result.totalKnownPowerW, 60);
  assert.equal(result.totalEstimatedCurrentA, 0.261);
  assert.equal(result.loads[0].estimatedCurrentA, 0.261);
});

test("checks the exact lamp protection path against known load current", () => {
  const project = validLampProject();
  const result = calculateProject(project);
  assert.equal(result.protectionChecks.length, 1);
  assert.equal(result.protectionChecks[0].adequateForKnownLoad, true);
  assert.equal(result.protectionChecks[0].ratingA, 16);
});

test("warns when a known lamp load exceeds the upstream breaker rating", () => {
  const project = validLampProject();
  updateComponent(project, "lamp", { properties: { powerW: 5000 } });
  updateComponent(project, "breaker", { properties: { ratingA: 10 } });

  const validation = validateProject(project);
  assert.equal(validation.valid, true);
  assert.ok(validation.warnings.some((warning) => warning.code === "PROTECTION_BELOW_ESTIMATED_LOAD"));

  const calculations = calculateProject(project);
  assert.equal(calculations.protectionChecks[0].adequateForKnownLoad, false);
});

test("does not invent socket consumption without a declared load", () => {
  const project = validSocketProject("breaker");
  const result = calculateProject(project);
  assert.equal(result.totalKnownPowerW, 0);
  assert.equal(result.totalEstimatedCurrentA, null);
  assert.ok(result.notes.some((note) => /prises/.test(note)));
});


test("calculates transformer nominal currents from declared VA and voltages", () => {
  const project = createProject();
  addComponent(project, "transformer", { id: "tx" });
  const result = calculateProject(project);
  assert.equal(result.transformers.length, 1);
  assert.equal(result.transformers[0].voltageRatio, 0.1043);
  assert.equal(result.transformers[0].ratedPrimaryCurrentA, 1.087);
  assert.equal(result.transformers[0].ratedSecondaryCurrentA, 10.417);
});

test("rejects a connected transformer when source voltage mismatches declared primary", () => {
  const project = createProject();
  const source = addComponent(project, "source", { id: "source-tx" });
  const transformer = addComponent(project, "transformer", {
    id: "tx",
    properties: { primaryVoltageV: 120 }
  });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: transformer.id, terminalId: "P1" }, { id: "tx1" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: transformer.id, terminalId: "P2" }, { id: "tx2" });

  const result = validateProject(project);
  assert.ok(result.errors.some((error) => error.code === "TRANSFORMER_PRIMARY_VOLTAGE_MISMATCH"));
});

test("rejects an incomplete transformer secondary pair", () => {
  const project = createProject();
  const transformer = addComponent(project, "transformer", { id: "tx" });
  const lamp = addComponent(project, "lamp", { id: "secondary-lamp" });

  connect(project, { componentId: transformer.id, terminalId: "S1" }, { componentId: lamp.id, terminalId: "L" }, { id: "tx-secondary" });

  const result = validateProject(project);
  assert.ok(result.errors.some((error) => error.code === "OPEN_TRANSFORMER_SECONDARY"));
});

test("checks motor properties and rejects incomplete unsupported wiring", () => {
  const project = createProject();
  const source = addComponent(project, "source", { id: "source-motor" });
  const motor = addComponent(project, "motor", {
    id: "motor",
    properties: { ratedCurrentA: 4.2 }
  });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: motor.id, terminalId: "L" }, { id: "m1" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: motor.id, terminalId: "N" }, { id: "m2" });

  const result = validateProject(project);
  assert.ok(result.errors.some((error) => error.code === "INCOMPLETE_MOTOR_TERMINALS"));
  assert.ok(result.errors.some((error) => error.code === "OPEN_MOTOR_POWER_PATH"));
  assert.equal(result.errors.some((error) => error.code === "VALIDATION_PENDING_FOR_COMPONENT"), false);
});

test("does not fabricate motor current without power factor and efficiency modeling", () => {
  const project = createProject();
  addComponent(project, "motor", { id: "motor" });
  const result = calculateProject(project);
  assert.equal(result.loads.some((item) => item.type === "motor"), false);
  assert.ok(result.notes.some((note) => /Moteur/.test(note) && /pas calculé/.test(note)));
});

test("validates positive relay and contactor declared properties before topology support", () => {
  const project = createProject();
  const relay = addComponent(project, "relay", { id: "relay", properties: { coilVoltageV: 0 } });
  const contactor = addComponent(project, "contactor", {
    id: "contactor",
    properties: { coilVoltageV: 230, ratingA: 0 }
  });

  const result = validateProject(project);
  assert.ok(result.errors.some((error) => error.code === "INVALID_RELAY_COIL_VOLTAGE"));
  assert.ok(result.errors.some((error) => error.code === "INVALID_CONTACTOR_PROPERTIES"));
  assert.equal(relay.properties.coilVoltageV, 0);
  assert.equal(contactor.properties.ratingA, 0);
});


test("validates the supported contactor motor topology", () => {
  const project = validMotorContactorProject();
  const result = validateProject(project);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.code === "MOTOR_STARTING_AND_THERMAL_NOT_MODELED"));
  assert.equal(result.errors.some((error) => error.code === "VALIDATION_PENDING_FOR_COMPONENT"), false);
});

test("requires motor nameplate current before motor topology validation", () => {
  const project = validMotorContactorProject();
  updateComponent(project, "motor", { properties: { ratedCurrentA: 0 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "MISSING_MOTOR_RATED_CURRENT"));
});

test("rejects motor topology without PE", () => {
  const project = validMotorContactorProject();
  project.wires = project.wires.filter((wire) => wire.id !== "m8");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "OPEN_MOTOR_PE"));
});

test("rejects contactor coil voltage mismatch", () => {
  const project = validMotorContactorProject();
  updateComponent(project, "motor-contactor", { properties: { coilVoltageV: 24 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "CONTACTOR_COIL_VOLTAGE_MISMATCH"));
});

test("rejects contactor undersized for motor nameplate current", () => {
  const project = validMotorContactorProject();
  updateComponent(project, "motor", { properties: { ratedCurrentA: 30 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "CONTACTOR_UNDERSIZED_FOR_MOTOR"));
});

test("rejects breaker below motor nameplate current", () => {
  const project = validMotorContactorProject();
  updateComponent(project, "motor", { properties: { ratedCurrentA: 12 } });
  updateComponent(project, "motor-contactor", { properties: { ratingA: 25 } });
  updateComponent(project, "motor-breaker", { properties: { ratingA: 10 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "BREAKER_BELOW_MOTOR_RATED_CURRENT"));
});

test("rejects contactor outside the supported motor topology", () => {
  const project = validLampProject();
  addComponent(project, "contactor", {
    id: "orphan-contactor",
    properties: { coilVoltageV: 230, ratingA: 25 }
  });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "CONTACTOR_NOT_IN_SUPPORTED_MOTOR_TOPOLOGY"));
});


test("validates the supported relay NO lamp topology", () => {
  const project = validRelayLampProject();
  const result = validateProject(project);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.ok(result.warnings.some((warning) => warning.code === "RELAY_STATIC_CONTACT_MODEL"));
  assert.equal(result.errors.some((error) => error.code === "VALIDATION_PENDING_FOR_COMPONENT"), false);
});

test("rejects relay coil voltage mismatch", () => {
  const project = validRelayLampProject();
  updateComponent(project, "relay", { properties: { coilVoltageV: 24 } });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "RELAY_COIL_VOLTAGE_MISMATCH"));
});

test("rejects NC use in the first supported relay topology", () => {
  const project = validRelayLampProject();
  connect(project, { componentId: "relay", terminalId: "NC" }, { componentId: "relay-lamp", terminalId: "L" }, { id: "r8" });
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "RELAY_NC_NOT_SUPPORTED"));
});

test("calculates a relay-fed lamp from the source voltage", () => {
  const result = calculateProject(validRelayLampProject());
  assert.equal(result.loads.length, 1);
  assert.equal(result.loads[0].supplyKind, "relay-no");
  assert.equal(result.loads[0].supplyVoltageV, 230);
  assert.equal(result.loads[0].estimatedCurrentA, 0.261);
  assert.equal(result.protectionChecks[0].adequateForKnownLoad, true);
});

test("validates the first supported transformer secondary lamp topology", () => {
  const project = validTransformerSecondaryLampProject();
  const result = validateProject(project);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
  assert.equal(result.errors.some((error) => error.code === "VALIDATION_PENDING_FOR_COMPONENT"), false);
});

test("rejects unsupported transformer secondary wiring", () => {
  const project = validTransformerSecondaryLampProject();
  project.wires = project.wires.filter((wire) => wire.id !== "t4");
  const result = validateProject(project);
  assert.equal(result.valid, false);
  assert.ok(result.errors.some((error) => error.code === "UNSUPPORTED_TRANSFORMER_SECONDARY_TOPOLOGY"));
});

test("calculates transformer-secondary lamp current at secondary voltage", () => {
  const result = calculateProject(validTransformerSecondaryLampProject());
  assert.equal(result.loads.length, 1);
  assert.equal(result.loads[0].supplyKind, "transformer-secondary");
  assert.equal(result.loads[0].supplyVoltageV, 24);
  assert.equal(result.loads[0].estimatedCurrentA, 2.5);
  assert.equal(result.totalEstimatedCurrentA, null);
  assert.ok(result.notes.some((note) => /domaines de tension/.test(note)));
});

test("warns when transformer lamp watts exceed declared transformer VA", () => {
  const project = validTransformerSecondaryLampProject();
  updateComponent(project, "tx-lamp", { properties: { powerW: 300 } });
  updateComponent(project, "tx-breaker", { properties: { ratingA: 16 } });

  const result = validateProject(project);
  assert.equal(result.valid, true);
  assert.ok(result.warnings.some((warning) => warning.code === "TRANSFORMER_LOAD_POWER_EXCEEDS_RATED_VA"));
});
