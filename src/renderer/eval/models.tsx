export type Data = {
  version: string;
  people: People;
};

export type People = {
  [id: string]: Person;
};

export type Person = {
  name: string;
  birthday?: string;
  lastChanged: string;
  categories: Categories;
  displaySettings?: DisplaySettings;
  note?: string;
};

export type DisplaySettings = {
  baseline: number;
};

export type Categories = {
  [id: string]: Category;
};

export type Category = {
  phases: Phases;
};

export type Phases = {
  [id: string]: Phase;
};

export type Phase = {
  entries: Selection[];
};

export type CategoryData = {
  [id: string]: CategoryDefinition;
};

export type CategoryDefinition = {
  name: string;
  phases: PhaseDefinitions;
};

export type PhaseDefinitions = {
  [id: string]: PhaseDefinition;
};

export type PhaseDefinition = {
  name?: string;
  entries: EntryDefinition[];
};

export type EntryDefinition = {
  description: string;
  additionalInformation?: string;
};

export function emptyPhase(def: PhaseDefinition): Phase {
  const entries = def.entries.map(() => -1);
  return {
    entries,
  };
}

export function emptyCategory(def: CategoryDefinition): Category {
  const phaseKeys = Object.keys(def.phases);
  const phases: Phases = {};
  phaseKeys.forEach((phaseKey) => {
    phases[phaseKey] = emptyPhase(def.phases[phaseKey]);
  });
  return { phases };
}

export function emptyPerson(name: string, categoryData: CategoryData): Person {
  const categories: Categories = {};
  Object.entries(categoryData).forEach(([key, category]) => {
    categories[key] = emptyCategory(category);
  });

  return {
    name,
    lastChanged: new Date().toISOString(),
    categories,
  };
}

export enum Selection {
  Unset = -1,
  Do = 0,
  Partially = 1,
  Dont = 2,
  Unknown = 3,
}

export const BIRTHDAY_DATE_FORMAT = 'DD.MM.YYYY';
