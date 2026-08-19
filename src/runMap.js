import { rng, randInt, weightedPick } from './utils.js';
import { BIOMES, biomeForAct } from './enemyData.js';

// A run is 3 acts. Each act is a sequence of steps the player resolves in order;
// every non-boss step offers 3 node choices (Slay the Spire-style "pick what's
// next", without needing a full branching graph renderer). The final step of
// every act is always the act's boss, forced.
const STEPS_PER_ACT = 4; // + 1 forced boss step

const NODE_TYPE_WEIGHTS = [
  { weight: 40, value: 'combat' },
  { weight: 13, value: 'elite' },
  { weight: 13, value: 'shop' },
  { weight: 13, value: 'treasure' },
  { weight: 9, value: 'rest' },
  { weight: 7, value: 'boon' },
  { weight: 5, value: 'extract' },
];

const NODE_LABELS = {
  combat: ['Ambush', 'Skirmish', 'Incursion', 'Breach', 'Hunting Ground'],
  elite: ['Elite Sighting', "Champion's Den", 'Marked Target'],
  shop: ['Black Market', 'Supply Cache', "Vendor's Stall"],
  treasure: ['Vault', 'Cache', 'Stash'],
  rest: ['Safehouse', 'Sanctuary', 'Respite'],
  boon: ['Cursed Altar', 'Dark Bargain', 'Forbidden Pact'],
  extract: ['Extraction Site', 'Resource Drop', 'Salvage Run'],
  boss: ['Act Boss'],
};

function rollNodeType(excludeType) {
  let type = weightedPick(NODE_TYPE_WEIGHTS);
  if (type === excludeType) type = weightedPick(NODE_TYPE_WEIGHTS);
  return type;
}

function makeNode(type, biome, stepIndex) {
  const labels = NODE_LABELS[type];
  return {
    id: `${biome.id}-${stepIndex}-${type}-${Math.floor(rng() * 1e6)}`,
    type,
    biome,
    label: labels[randInt(0, labels.length - 1)],
  };
}

function generateAct(actNumber) {
  const biome = biomeForAct(actNumber);
  const steps = [];
  let lastType = null;
  for (let i = 0; i < STEPS_PER_ACT; i++) {
    const choices = [];
    const usedTypes = new Set();
    for (let c = 0; c < 3; c++) {
      let type = rollNodeType(i === 0 ? null : lastType);
      let attempts = 0;
      while (usedTypes.has(type) && attempts < 4) { type = rollNodeType(null); attempts++; }
      usedTypes.add(type);
      choices.push(makeNode(type, biome, i));
    }
    lastType = choices[0].type;
    steps.push({ index: i, choices, forced: null });
  }
  // Final forced boss step.
  steps.push({ index: STEPS_PER_ACT, choices: [makeNode('boss', biome, STEPS_PER_ACT)], forced: 'boss' });
  return { actNumber, biome, steps };
}

export function generateRun() {
  return {
    actIndex: 0,
    stepIndex: 0,
    acts: [generateAct(1), generateAct(2), generateAct(3)],
    nodesCleared: 0,
  };
}

export function currentAct(run) { return run.acts[run.actIndex]; }
export function currentStep(run) { return currentAct(run).steps[run.stepIndex]; }
export function isLastAct(run) { return run.actIndex >= run.acts.length - 1; }
export function isLastStepOfAct(run) { return run.stepIndex >= currentAct(run).steps.length - 1; }
export function totalActs(run) { return run.acts.length; }
