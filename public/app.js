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

const STORAGE_KEY = "electrolab.v0.1.project";
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

let project = createProject();
let selectedComponentId = null;
let pendingTerminal = null;

document.querySelectorAll("[data-add]").forEach((button) => {
  button.addEventListener("click", () => {
    const index = project.components.length;
    const component = addComponent(project, button.dataset.add, {
      x: 35 + (index % 3) * 180,
      y: 45 + Math.floor(index / 3) * 145
    });
    selectedComponentId = component.id;
    render();
  });
});

document.querySelector("#new-project").addEventListener("click", () => {
  project = createProject();
  selectedComponentId = null;
  pendingTerminal = null;
  clearValidation();
  render();
});

document.querySelector("#demo-project").addEventListener("click", () => {
  project = createProject({ name: "Exemple — Circuit lampe" });
  const source = addComponent(project, "source", { id: "source-demo", x: 40, y: 140 });
  const breaker = addComponent(project, "breaker", { id: "breaker-demo", x: 230, y: 140 });
  const sw = addComponent(project, "switch", { id: "switch-demo", x: 420, y: 140 });
  const lamp = addComponent(project, "lamp", { id: "lamp-demo", x: 610, y: 140 });

  connect(project, { componentId: source.id, terminalId: "L" }, { componentId: breaker.id, terminalId: "L_IN" });
  connect(project, { componentId: breaker.id, terminalId: "L_OUT" }, { componentId: sw.id, terminalId: "L_IN" });
  connect(project, { componentId: sw.id, terminalId: "L_OUT" }, { componentId: lamp.id, terminalId: "L" });
  connect(project, { componentId: source.id, terminalId: "N" }, { componentId: lamp.id, terminalId: "N" });

  selectedComponentId = breaker.id;
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
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    validationTitle.textContent = "Aucune sauvegarde";
    validationSummary.textContent = "Sauvegarde d’abord un projet sur cet appareil.";
    return;
  }
  try {
    project = deserializeProject(raw);
    selectedComponentId = null;
    pendingTerminal = null;
    clearValidation();
    render();
  } catch (error) {
    showError(error.message);
  }
});

document.querySelector("#validate-project").addEventListener("click", runValidation);

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
    ? "Le circuit lampe respecte les contrôles de la version 0.1."
    : `${result.errors.length} erreur(s), ${result.warnings.length} avertissement(s).`;

  validationList.replaceChildren();
  for (const check of result.checks) {
    addValidationLine(`${check.ok ? "✓" : "✗"} ${check.label}`);
  }
  for (const error of result.errors) addValidationLine(`Erreur — ${error.message}`);
  for (const warning of result.warnings) addValidationLine(`Attention — ${warning.message}`);
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
    powerW: "Puissance (W)"
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

render();
