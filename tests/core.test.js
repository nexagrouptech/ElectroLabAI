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
  assert.equal(project.version, "0.3.0");
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
  assert.equal(restored.version, "0.3.0");
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
  assert.equal(project.version, "0.3.0");
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
