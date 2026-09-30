import { createProject } from "./project.js";

export const EXERCISES = Object.freeze({
  "lamp-basic": Object.freeze({
    id: "lamp-basic",
    title: "Allumer une lampe",
    instruction: "Construis un circuit avec une source 230 V, un disjoncteur, un interrupteur et une lampe.",
    objective: "Obtenir un circuit lampe complet avec phase protégée et neutre raccordé.",
    allowedComponents: ["source", "breaker", "switch", "lamp"],
    constraints: ["Une source", "Un disjoncteur", "Un interrupteur", "Une lampe"],
    ruleId: "lamp-circuit",
    scoreMax: 100
  }),
  "socket-protected": Object.freeze({
    id: "socket-protected",
    title: "Protéger une prise domestique",
    instruction: "Construis une prise alimentée à travers un différentiel et une protection de surintensité.",
    objective: "Raccorder correctement phase, neutre et PE jusqu’à la prise.",
    allowedComponents: ["source", "rcd", "breaker", "fuse", "socket"],
    constraints: ["Une source", "Un différentiel", "Un disjoncteur ou fusible", "Une prise", "PE obligatoire"],
    ruleId: "socket-protected",
    scoreMax: 100
  })
});

export function listExercises() {
  return Object.values(EXERCISES);
}

export function getExercise(exerciseId) {
  return EXERCISES[exerciseId] || null;
}

export function createExerciseProject(exerciseId) {
  const exercise = getExercise(exerciseId);
  if (!exercise) throw new Error(`Unknown exercise: ${exerciseId}`);
  return createProject({ name: `Exercice — ${exercise.title}`, exerciseId: exercise.id });
}

export function isComponentAllowed(exerciseId, componentType) {
  const exercise = getExercise(exerciseId);
  return exercise ? exercise.allowedComponents.includes(componentType) : true;
}
