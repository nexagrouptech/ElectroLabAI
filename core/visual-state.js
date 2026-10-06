export const VISUAL_STATES = Object.freeze({
  neutral: "neutral",
  inactive: "inactive",
  energized: "energized"
});

export function getComponentVisualState(component, calculations = {}) {
  if (!component) {
    return { key: VISUAL_STATES.neutral, label: "", energized: false };
  }

  if (component.type === "lamp") {
    const energized = Array.isArray(calculations.loads)
      && calculations.loads.some((load) => load.componentId === component.id);

    return {
      key: energized ? VISUAL_STATES.energized : VISUAL_STATES.inactive,
      label: energized ? "Allumée" : "Éteinte",
      energized
    };
  }

  return { key: VISUAL_STATES.neutral, label: "", energized: false };
}
