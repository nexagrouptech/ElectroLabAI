import {
  COMPONENT_LIBRARY,
  addComponent,
  connect,
  createProject,
  deserializeProject,
  removeComponent,
  serializeProject,
  updateComponent
} from "./core/project.js";
import { validateProject } from "./core/validator.js";
import { createExerciseProject, evaluateExercise, getExercise, isComponentAllowed, listExercises, recordExerciseAttempt } from "./core/exercises.js";
import { COMPONENT_CATEGORIES, searchComponentDefinitions } from "./core/catalog.js";

const STORAGE_KEY = "electrolab.v0.4.project";
const LEGACY_STORAGE_KEYS = ["electrolab.v0.3.project", "electrolab.v0.2.project", "electrolab.v0.1.project"];
const workspace = document.querySelector("#workspace");
const componentLayer = document.querySelector("#component-layer");
const wireLayer = document.querySelector("#wire-layer");
const emptyState = document.querySelector("#empty-state");
const inspectorForm = document.querySelector("#inspector-form");
const inspectorEmpty = document.querySelector("#inspector-empty");
const componentName = document.querySelector("#component-name");
const propertyFields = document.querySelector("#property-fields");
const validationPanel = document.querySelector("#validation-panel");
const validationTitle = document.querySelector("#validation-title");
const validationSummary = document.querySelector("#validation-summary");
const validationList = document.querySelector("#validation-list");
const exerciseSelect = document.querySelector("#exercise-select");
const exerciseName = document.querySelector("#exercise-name");
const exerciseObjective = document.querySelector("#exercise-objective");
const exerciseInstruction = document.querySelector("#exercise-instruction");
const verifyExerciseButton = document.querySelector("#verify-exercise");
const exerciseResult = document.querySelector("#exercise-result");
const exerciseResultTitle = document.querySelector("#exercise-result-title");
const exerciseResultSummary = document.querySelector("#exercise-result-summary");
const componentSearch = document.querySelector("#component-search");
const componentCategory = document.querySelector("#component-category");
const componentButtons = document.querySelector("#component-buttons");
const componentEmpty = document.querySelector("#component-empty");

let project = createProject();
let selectedComponentId = null;
let pendingTerminal = null;

for (const exercise of listExercises()) {
  const option = document.createElement("option");
  option.value = exercise.id;
  option.textContent = exercise.title;
  exerciseSelect.appendChild(option);
}

exerciseSelect.addEventListener("change", renderExerciseSelection);
document.querySelector("#start-exercise").addEventListener("click", () => {
  project = createExerciseProject(exerciseSelect.value);
  selectedComponentId = null;
  pendingTerminal = null;
  clearValidation();
  renderExerciseSelection();
  render();
});

for (const [value, label] of Object.entries(COMPONENT_CATEGORIES)) {
  const option = document.createElement("option");
  option.value = value;
  option.textContent = label;
  componentCategory.appendChild(option);
}

componentSearch.addEventListener("input", renderComponentPalette);
componentCategory.addEventListener("change", renderComponentPalette);

document.querySelector("#new-project").addEventListener("click", () => {
  project = createProject();
  selectedComponentId = null;
  pendingTerminal = null;
  clearValidation();
  render();
});

document.querySelector("#demo-project").addEventListener("click", () => {
  project = createProject({ name: "Exemple — Prise domestique protégée" });

  const compact = workspace.clientWidth < 650;
  const positions = compact
    ? [
        { x: 24, y: 24 },
        { x: 24, y: 145 },
        { x: 24, y: 266 },
        { x: 24, y: 387 }
      ]
    : [
        { x: 35, y: 140 },
        { x: 225, y: 140 },
        { x: 415, y: 140 },
        { x: 605, y: 140 }
      ];

  const source = addComponent(project, "source", { id: "source-demo", ...positions[0] });
  const rcd = addComponent(project, "rcd", { id: "rcd-demo", ...positions[1] });
  const fuse = addComponent(project, "fuse", { id: "fuse-demo", ...positions[2] });
  const socket = addComponent(project, "socket", { id: "socket-demo", ...positions[3] });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: rcd.id, terminalId: "L_IN" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: rcd.id, terminalId: "N_IN" });
  connect(project, { componentId: rcd.id, terminalId: "L_OUT" }, { componentId: fuse.id, terminalId: "L_IN" });
  connect(project, { componentId: fuse.id, terminalId: "L_OUT" }, { componentId: socket.id, terminalId: "L" });
  connect(project, { componentId: rcd.id, terminalId: "N_OUT" }, { componentId: socket.id, terminalId: "N" });
  connect(project, { componentId: source.id, terminalId: "PE" }, { componentId: socket.id, terminalId: "PE" });

  selectedComponentId = rcd.id;
  pendingTerminal = null;
  render();
  runValidation();
});

document.querySelector("#save-project").addEventListener("click", () => {
  localStorage.setItem(STORAGE_KEY, serializeProject(project));
  validationTitle.textContent = "Projet sauvegardé";
  validationSummary.textContent = "La copie locale a été mise à jour sur cet appareil.";
});

document.querySelector("#load-project").addEventListener("click", () => {
  const raw =
    localStorage.getItem(STORAGE_KEY) ||
    LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean);
  if (!raw) {
    validationTitle.textContent = "Aucune sauvegarde";
    validationSummary.textContent = "Sauvegarde d’abord un projet sur cet appareil.";
    return;
  }
  try {
    project = deserializeProject(raw);
    if (project.exerciseId && getExercise(project.exerciseId)) {
      exerciseSelect.value = project.exerciseId;
    }
    selectedComponentId = null;
    pendingTerminal = null;
    clearValidation();
    render();
  } catch (error) {
    showError(error.message);
  }
});

document.querySelector("#validate-project").addEventListener("click", runValidation);

verifyExerciseButton.addEventListener("click", () => {
  if (!project.exerciseId) {
    showError("Commence d’abord un exercice.");
    return;
  }

  const validation = runValidation();
  const result = evaluateExercise(project, validation);
  const attempt = recordExerciseAttempt(project, result);
  renderExerciseResult(attempt);
});

document.querySelector("#delete-component").addEventListener("click", () => {
  if (!selectedComponentId) return;
  removeComponent(project, selectedComponentId);
  selectedComponentId = null;
  pendingTerminal = null;
  clearValidation();
  render();
});

inspectorForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const component = project.components.find((item) => item.id === selectedComponentId);
  if (!component) return;

  const properties = {};
  propertyFields.querySelectorAll("[data-property]").forEach((input) => {
    properties[input.dataset.property] = input.type === "number" ? Number(input.value) : input.value;
  });

  updateComponent(project, component.id, {
    name: componentName.value.trim() || COMPONENT_LIBRARY[component.type].label,
    properties
  });
  clearValidation();
  render();
});

window.addEventListener("resize", drawWires);

function render() {
  componentLayer.replaceChildren();
  renderComponentPalette();
  verifyExerciseButton.disabled = !project.exerciseId;
  renderExerciseResult(project.exerciseProgress?.lastResult || null);
  emptyState.hidden = project.components.length > 0;

  for (const component of project.components) {
    const definition = COMPONENT_LIBRARY[component.type];
    const element = document.createElement("article");
    element.className = `component${component.id === selectedComponentId ? " selected" : ""}`;
    element.dataset.componentId = component.id;
    element.style.left = `${component.x}px`;
    element.style.top = `${component.y}px`;
    element.innerHTML = `
      <div class="component-title">
        <span class="component-symbol">${definition.symbol}</span>
        <span>${escapeHtml(component.name)}</span>
      </div>
      <div class="terminals"></div>
    `;

    element.addEventListener("click", (event) => {
      if (event.target.closest(".terminal")) return;
      selectedComponentId = component.id;
      render();
    });

    const terminals = element.querySelector(".terminals");
    for (const terminal of component.terminals) {
      const button = document.createElement("button");
      button.className = "terminal";
      button.textContent = terminal.label;
      button.dataset.componentId = component.id;
      button.dataset.terminalId = terminal.id;
      if (
        pendingTerminal?.componentId === component.id &&
        pendingTerminal?.terminalId === terminal.id
      ) {
        button.classList.add("pending");
      }
      button.addEventListener("click", () => handleTerminal(component.id, terminal.id));
      terminals.appendChild(button);
    }

    makeDraggable(element, component);
    componentLayer.appendChild(element);
  }

  renderInspector();
  requestAnimationFrame(drawWires);
}

function handleTerminal(componentId, terminalId) {
  const ref = { componentId, terminalId };
  if (!pendingTerminal) {
    pendingTerminal = ref;
    render();
    return;
  }

  try {
    connect(project, pendingTerminal, ref);
    pendingTerminal = null;
    clearValidation();
    render();
  } catch (error) {
    pendingTerminal = null;
    showError(error.message);
    render();
  }
}

function makeDraggable(element, component) {
  const handle = element.querySelector(".component-title");
  handle.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    const startX = event.clientX;
    const startY = event.clientY;
    const originX = component.x;
    const originY = component.y;

    const move = (moveEvent) => {
      const maxX = Math.max(0, workspace.clientWidth - element.offsetWidth);
      const maxY = Math.max(0, workspace.clientHeight - element.offsetHeight);
      component.x = Math.min(maxX, Math.max(0, originX + moveEvent.clientX - startX));
      component.y = Math.min(maxY, Math.max(0, originY + moveEvent.clientY - startY));
      element.style.left = `${component.x}px`;
      element.style.top = `${component.y}px`;
      drawWires();
    };

    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      project.updatedAt = new Date().toISOString();
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up, { once: true });
  });
}

function drawWires() {
  wireLayer.replaceChildren();
  const workspaceRect = workspace.getBoundingClientRect();

  for (const wire of project.wires) {
    const from = terminalElement(wire.from);
    const to = terminalElement(wire.to);
    if (!from || !to) continue;

    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const x1 = a.left + a.width / 2 - workspaceRect.left;
    const y1 = a.top + a.height / 2 - workspaceRect.top;
    const x2 = b.left + b.width / 2 - workspaceRect.left;
    const y2 = b.top + b.height / 2 - workspaceRect.top;
    const middle = (x1 + x2) / 2;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("class", "wire");
    path.setAttribute("d", `M ${x1} ${y1} C ${middle} ${y1}, ${middle} ${y2}, ${x2} ${y2}`);
    wireLayer.appendChild(path);
  }
}

function terminalElement(ref) {
  return componentLayer.querySelector(
    `[data-component-id="${CSS.escape(ref.componentId)}"][data-terminal-id="${CSS.escape(ref.terminalId)}"]`
  );
}

function renderInspector() {
  const component = project.components.find((item) => item.id === selectedComponentId);
  if (!component) {
    inspectorForm.hidden = true;
    inspectorEmpty.hidden = false;
    return;
  }

  inspectorEmpty.hidden = true;
  inspectorForm.hidden = false;
  componentName.value = component.name;
  propertyFields.replaceChildren();

  for (const [key, value] of Object.entries(component.properties)) {
    const label = document.createElement("label");
    label.textContent = propertyLabel(key);

    let input;
    if (key === "ratingA") {
      input = document.createElement("select");
      for (const rating of [10, 16, 20, 32, 40]) {
        const option = document.createElement("option");
        option.value = String(rating);
        option.textContent = `${rating} A`;
        option.selected = Number(value) === rating;
        input.appendChild(option);
      }
    } else {
      input = document.createElement("input");
      input.type = typeof value === "number" ? "number" : "text";
      input.value = String(value);
      if (input.type === "number") input.min = "1";
    }

    input.dataset.property = key;
    label.appendChild(input);
    propertyFields.appendChild(label);
  }
}

function runValidation() {
  const result = validateProject(project);
  validationPanel.classList.toggle("ok", result.valid);
  validationPanel.classList.toggle("bad", !result.valid);
  validationTitle.textContent = result.valid ? "Circuit valide" : "Circuit à corriger";
  validationSummary.textContent = result.valid
    ? result.warnings.length
      ? `Circuit valide avec ${result.warnings.length} avertissement(s).`
      : "Le circuit respecte les contrôles déterministes actuellement actifs."
    : `${result.errors.length} erreur(s), ${result.warnings.length} avertissement(s).`;

  validationList.replaceChildren();
  for (const check of result.checks) {
    addValidationLine(`${check.ok ? "✓" : "✗"} ${check.label}`);
  }
  for (const error of result.errors) addValidationLine(`Erreur — ${error.message}`);
  for (const warning of result.warnings) addValidationLine(`Attention — ${warning.message}`);
  return result;
}

function renderExerciseSelection() {
  const exercise = getExercise(exerciseSelect.value);
  if (!exercise) return;
  exerciseName.textContent = exercise.title;
  exerciseObjective.textContent = `Objectif : ${exercise.objective}`;
  exerciseInstruction.textContent = exercise.instruction;
  verifyExerciseButton.disabled = !project.exerciseId;
}

function renderExerciseResult(attempt) {
  if (!attempt) {
    exerciseResult.hidden = true;
    exerciseResultTitle.textContent = "";
    exerciseResultSummary.textContent = "";
    return;
  }

  exerciseResult.hidden = false;
  exerciseResult.classList.toggle("passed", Boolean(attempt.passed));
  exerciseResult.classList.toggle("failed", !attempt.passed);
  exerciseResultTitle.textContent = attempt.passed ? "Exercice réussi" : "Exercice à corriger";
  exerciseResultSummary.textContent =
    `Tentative ${attempt.attempt} • Score ${attempt.score}/${attempt.scoreMax}` +
    (attempt.feedback?.length ? ` • ${attempt.feedback[0]}` : "");
}

function renderComponentPalette() {
  const definitions = searchComponentDefinitions({
    query: componentSearch.value,
    category: componentCategory.value || "all"
  });

  componentButtons.replaceChildren();
  componentEmpty.hidden = definitions.length > 0;

  for (const definition of definitions) {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.add = definition.type;
    button.innerHTML = `<span>${definition.symbol}</span><span>${escapeHtml(definition.label)}</span>`;

    const allowed = isComponentAllowed(project.exerciseId, definition.type);
    button.disabled = !allowed;
    button.title = allowed ? definition.catalogId : "Composant non autorisé pour l’exercice actif";

    button.addEventListener("click", () => {
      if (!isComponentAllowed(project.exerciseId, definition.type)) {
        showError("Ce composant n’est pas autorisé dans cet exercice.");
        return;
      }

      const index = project.components.length;
      const component = addComponent(project, definition.type, {
        x: 35 + (index % 3) * 180,
        y: 45 + Math.floor(index / 3) * 145
      });
      selectedComponentId = component.id;
      clearValidation();
      render();
    });

    componentButtons.appendChild(button);
  }
}

function clearValidation() {
  validationPanel.classList.remove("ok", "bad");
  validationTitle.textContent = "Pas encore vérifié";
  validationSummary.textContent = "Construis le circuit puis appuie sur « Valider ».";
  validationList.replaceChildren();
}

function showError(message) {
  validationPanel.classList.remove("ok");
  validationPanel.classList.add("bad");
  validationTitle.textContent = "Action impossible";
  validationSummary.textContent = message;
}

function addValidationLine(text) {
  const li = document.createElement("li");
  li.textContent = text;
  validationList.appendChild(li);
}

function propertyLabel(key) {
  return {
    ratingA: "Calibre",
    voltageV: "Tension (V)",
    powerW: "Puissance (W)",
    sensitivityMA: "Sensibilité différentielle (mA)"
  }[key] || key;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

renderExerciseSelection();
render();
