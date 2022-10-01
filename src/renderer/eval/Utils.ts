import moment from 'moment';
import {
  BIRTHDAY_DATE_FORMAT,
  Category,
  CategoryDefinition,
  Phase,
  PhaseDefinition,
  Phases,
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

export const sleep = async (ms = 500) => {
  await new Promise((resolve) => setTimeout(resolve, ms));
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
  const birthdayMoment = moment(birthday, BIRTHDAY_DATE_FORMAT);
  const now = moment();
  const diffMonth = now.diff(birthdayMoment, 'months');
  return getPhasesForAgeInMonths(diffMonth);
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
