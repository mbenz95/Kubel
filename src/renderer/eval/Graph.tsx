import { InputNumber, Space } from 'antd';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useSnapshot } from 'valtio';
import { evalState } from './evalState';
import { DisplaySettings, Person, Phase, Selection } from './models';
import styles from './Person.module.css';
import { filterPhasesByAge } from './Utils';

export const Graph = ({ showControls }: { showControls: boolean }) => {
  const { person, categoryData } = useSnapshot(evalState);
  const baseline = person?.displaySettings?.baseline ?? 15;
  const setBaseline = (v: number) => {
    if (evalState.person == null) return;
    setInitialDisplaysettings(evalState.person).baseline = v;
  };
  const setMinValue = (v: number) => {
    if (evalState.person == null) return;
    setInitialDisplaysettings(evalState.person).minValue = v;
  };
  const minValue = person?.displaySettings?.minValue ?? 6;
  if (person == null || categoryData == null) throw new Error('no data');

  const data = Object.entries(person.categories).map(([id, category]) => {
    const filteredPhases = filterPhasesByAge(person.birthday, category.phases);
    const totalResult = Object.values(filteredPhases)
      .map(calculateResult)
      .reduce((p, c) => p + c, 0);
    return {
      name: categoryData[id]?.name ?? ` Kategorie nicht gefunden (${id})`,
      result: Math.round(100 * (totalResult + minValue)) / 100,
      baseline,
    };
  });

  return (
    <div className={styles.graphContainer}>
      {showControls && (
        <Space>
          <InputNumber
            addonBefore="Entwicklungsstand"
            value={baseline}
            onChange={setBaseline}
            min={0}
          />
          <InputNumber
            addonBefore="Min-Wert"
            value={minValue}
            onChange={setMinValue}
            min={0}
            max={18}
          />
        </Space>
      )}

      <div style={{ height: '20px' }}> </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <ChartTooltip />
          <Legend />
          <Line
            type="linear"
            dataKey="result"
            stroke="#8884d8"
            activeDot={{ r: 10 }}
            dot={{ r: 6 }}
            strokeWidth={3}
            name="Ergebnis"
          />
          <Line
            type="linear"
            dataKey="baseline"
            stroke="#82ca9d"
            name="Entwicklungsstand"
            strokeWidth={2}
            dot={{ r: 1 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export function calculateResult(phase: Phase): number {
  const weights = [1, 0.5, 0];
  const validSelections = [Selection.Do, Selection.Partially, Selection.Dont];
  let sumWeight = 0;
  let numWeights = 0;
  phase.entries.forEach((sel: number) => {
    // ignore -1 (not set) and 3 (unknown)
    if (validSelections.includes(sel)) {
      sumWeight += weights[sel];
      numWeights += 1;
    }
  });
  return numWeights > 0 ? sumWeight / numWeights : 0;
}

function setInitialDisplaysettings(person: Person): DisplaySettings {
  person.displaySettings ??= {
    minValue: 6,
    baseline: 15,
  };
  return person.displaySettings;
}
