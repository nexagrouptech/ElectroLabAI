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

test("creates the four supported components", () => {
  const project = createProject();
  for (const type of ["source", "breaker", "switch", "lamp"]) addComponent(project, type);
  assert.deepEqual(project.components.map((item) => item.type), ["source", "breaker", "switch", "lamp"]);
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
});
