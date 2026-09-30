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
  assert.equal(project.version, "0.2.0");
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
  assert.equal(restored.version, "0.2.0");
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
