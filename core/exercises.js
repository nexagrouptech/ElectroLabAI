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


function requiredCriteria(exerciseId, project) {
  const counts = (type) => project.components.filter((item) => item.type === type).length;

  if (exerciseId === "lamp-basic") {
    return [
      { id: "required-source", ok: counts("source") >= 1, label: "Source présente", failMessage: "Ajoute une source 230 V." },
      { id: "required-breaker", ok: counts("breaker") >= 1, label: "Disjoncteur présent", failMessage: "Ajoute un disjoncteur." },
      { id: "required-switch", ok: counts("switch") >= 1, label: "Interrupteur présent", failMessage: "Ajoute un interrupteur." },
      { id: "required-lamp", ok: counts("lamp") >= 1, label: "Lampe présente", failMessage: "Ajoute une lampe." }
    ];
  }

  if (exerciseId === "socket-protected") {
    return [
      { id: "required-source", ok: counts("source") >= 1, label: "Source présente", failMessage: "Ajoute une source 230 V." },
      { id: "required-rcd", ok: counts("rcd") >= 1, label: "Différentiel présent", failMessage: "Ajoute un différentiel." },
      {
        id: "required-overcurrent",
        ok: counts("breaker") + counts("fuse") >= 1,
        label: "Protection de surintensité présente",
        failMessage: "Ajoute un disjoncteur ou un fusible."
      },
      { id: "required-socket", ok: counts("socket") >= 1, label: "Prise présente", failMessage: "Ajoute une prise." }
    ];
  }

  return [];
}

export function evaluateExercise(project, validationResult) {
  const exercise = getExercise(project.exerciseId);
  if (!exercise) {
    return {
      exerciseId: null,
      passed: false,
      score: 0,
      scoreMax: 100,
      criteria: [],
      feedback: ["Commence d’abord un exercice."]
    };
  }

  const criteria = requiredCriteria(exercise.id, project);
  const disallowed = project.components.filter(
    (component) => !exercise.allowedComponents.includes(component.type)
  );

  criteria.push({
    id: "allowed-components",
    ok: disallowed.length === 0,
    label: "Composants autorisés uniquement",
    failMessage: "Retire les composants qui ne sont pas autorisés pour cet exercice."
  });
  criteria.push({
    id: "electrical-validation",
    ok: Boolean(validationResult?.valid),
    label: "Validation électrique déterministe",
    failMessage: "Corrige les erreurs électriques indiquées par le moteur."
  });

  const passedCount = criteria.filter((item) => item.ok).length;
  const passed = criteria.length > 0 && criteria.every((item) => item.ok);
  const rawScore = criteria.length ? Math.round((passedCount / criteria.length) * exercise.scoreMax) : 0;
  const score = passed ? exercise.scoreMax : Math.min(exercise.scoreMax - 1, rawScore);

  const feedback = criteria.filter((item) => !item.ok).map((item) => item.failMessage);
  for (const error of validationResult?.errors || []) {
    if (!feedback.includes(error.message)) feedback.push(error.message);
  }

  return {
    exerciseId: exercise.id,
    passed,
    score,
    scoreMax: exercise.scoreMax,
    criteria: criteria.map(({ failMessage, ...item }) => item),
    feedback
  };
}

export function recordExerciseAttempt(project, result, timestamp = new Date().toISOString()) {
  if (!project.exerciseProgress) {
    project.exerciseProgress = { attempts: 0, lastResult: null, history: [] };
  }

  project.exerciseProgress.attempts += 1;
  const attempt = {
    attempt: project.exerciseProgress.attempts,
    timestamp,
    passed: Boolean(result.passed),
    score: Number(result.score || 0),
    scoreMax: Number(result.scoreMax || 100),
    feedback: [...(result.feedback || [])]
  };

  project.exerciseProgress.lastResult = attempt;
  project.exerciseProgress.history = [...project.exerciseProgress.history, attempt].slice(-20);
  project.updatedAt = timestamp;
  return attempt;
}
