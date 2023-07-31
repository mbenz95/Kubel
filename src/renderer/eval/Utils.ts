import dayjs from 'dayjs';
import {
  BIRTHDAY_DATE_FORMAT,
  Category,
  CategoryData,
  CategoryDefinition,
  Person,
  Phase,
  PhaseDefinition,
  Phases,
  emptyCategory,
  emptyPhase,
  Selection
} from './models';

export type PhaseEntry = {
  id: string;
  phase: Phase;
  phaseDefinition: PhaseDefinition;
};
// combine category definition and person category
export const createPhaseEntries = (
  categoryDefinition: CategoryDefinition,
  phases: Phases
): PhaseEntry[] => {
  return Object.entries(categoryDefinition.phases)
    .map(([phaseId, phase]) => {
      if (phases[phaseId] == null) return undefined;
      return {
        id: phaseId,
        phase: phases[phaseId],
        phaseDefinition: phase,
      };
    })
    .filter((val) => val != null) as PhaseEntry[];
};

export function getPhasesForAgeInMonths(ageInMonths: number): number {
  const ageInMonthsToPhase: { [key: number]: number } = {
    2: 1,
    5: 2,
    8: 3,
    11: 4,
    17: 5,
    23: 6,
    29: 7,
    35: 8,
    41: 9,
    47: 10,
    53: 11,
    59: 12,
    65: 13,
    71: 14,
    84: 15,
    97: 16,
    110: 17,
    123: 18,
  };
  const key = Object.keys(ageInMonthsToPhase).find(
    (age) => ageInMonths <= parseInt(age, 10)
  );
  return key != null ? ageInMonthsToPhase[parseInt(key, 10)] : 18;
}

export function getPhaseForBirthday(birthday: string): number {
  const age = ageInMonth(birthday);
  return getPhasesForAgeInMonths(age);
}

function ageInMonth(birthday: string): number {
  const birthdayDate = dayjs(birthday, BIRTHDAY_DATE_FORMAT);
  const now = dayjs();
  const diffMonth = now.diff(birthdayDate, 'months');
  return diffMonth;
}

export function filterPhasesByAge(
  birthday: string | undefined,
  phases: Phases
): Phases {
  if (birthday == null) return phases;
  const maxPhase = getPhaseForBirthday(birthday);
  return Object.keys(phases)
    .filter((key) => parseInt(key, 10) <= maxPhase)
    .reduce((res, key) => {
      res[key] = phases[key];
      return res;
    }, {} as Phases);
}

export function getCurrentPhaseByBirthday(birthday: string): number {
  return getPhasesForAgeInMonths(ageInMonth(birthday));
}

// mutates person, add missing categories, phases and entries
export function syncPersonWithCategoryDef(person: Person, categoryData: CategoryData) {
  const categoryKeys = Object.keys(categoryData)
  for (const key of categoryKeys) {
    if (person.categories[key] == null) {
      person.categories[key] = emptyCategory(categoryData[key])
    } else {
      const phaseDefs = categoryData[key].phases
      const phases = person.categories[key].phases
      for (const phaseKey of Object.keys(phaseDefs)) {
        if (phases[phaseKey] == null) {
          phases[phaseKey] = emptyPhase(phaseDefs[phaseKey])
        } else {
          const personPhaseEntries = phases[phaseKey].entries
          const phaseDefEntries = phaseDefs[phaseKey].entries
          if (personPhaseEntries.length < phaseDefEntries.length) {
            // fill up arrays so that more entries don't cause issues
            for (let i = personPhaseEntries.length; i < phaseDefEntries.length; i++) {
              personPhaseEntries.push(Selection.Unset)
            }
          } else if (personPhaseEntries.length > phaseDefEntries.length) {
            // remove entries
            personPhaseEntries.splice(phaseDefEntries.length)
          }
        }
      }
    }
  }
  for (const personCategoryKey of Object.keys(person.categories)) {
    if (categoryData[personCategoryKey] == null) {
      // remove missing category
      delete person.categories[personCategoryKey]
    } else {
      // remove missing phase
      const phaseDefs = categoryData[personCategoryKey].phases
      const phases = person.categories[personCategoryKey].phases
      for (const personPhaseKey of Object.keys(phases)) {
        if (phaseDefs[personPhaseKey] == null) {
          delete phases[personPhaseKey]
        }
      }
    }
  }
}
