import { Category, CategoryDefinition, Phase, PhaseDefinition } from './models';

export type PhaseEntry = {
  id: string;
  phase: Phase;
  phaseDefinition: PhaseDefinition;
};
// combine category definition and person category
export const createPhaseEntries = (
  categoryDefinition: CategoryDefinition,
  personCategory: Category
): PhaseEntry[] => {
  return Object.entries(categoryDefinition.phases)
    .map(([phaseId, phase]) => {
      if (personCategory.phases[phaseId] == null) return undefined;
      return {
        id: phaseId,
        phase: personCategory.phases[phaseId],
        phaseDefinition: phase,
      };
    })
    .filter((val) => val != null) as PhaseEntry[];
};

export const sleep = async (ms = 500) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};
