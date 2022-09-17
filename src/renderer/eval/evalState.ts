import { proxy } from 'valtio';
import { CategoryData, Person } from './models';

export type EvalState = {
  person: Person | undefined;
  categoryData: CategoryData | undefined;
};
export const evalState = proxy<EvalState>({
  person: undefined,
  categoryData: undefined,
});
