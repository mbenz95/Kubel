import {
  Affix,
  Button,
  Checkbox,
  Col,
  Divider,
  Input,
  Row,
  Slider,
  Typography,
} from 'antd';
import { proxy, useSnapshot } from 'valtio';
import { useEffect } from 'react';
import { SliderMarks } from 'antd/lib/slider';
import { PrinterOutlined } from '@ant-design/icons';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { Graph } from './Graph';
import { evalState } from './evalState';
import { CategoryData } from './models';
import { createPhaseEntries, getPhaseForBirthday, PhaseEntry } from './Utils';
import styles from './PrintView.module.css';
import '../GlobalStyles.css';

const { Title, Text } = Typography;

type PrinterCategoryOption = {
  enabled: boolean;
  min: number;
  max: number;
};
type PrinterState = {
  showGraph: boolean;
  tablePerRow: number;
  categories: { [id: string]: PrinterCategoryOption };
  fontSizeEm: number;
};

const printerState = proxy<PrinterState>({
  showGraph: true,
  categories: {},
  tablePerRow: 2,
  fontSizeEm: 1,
});

function PrintCategories() {
  const { categoryData } = useSnapshot(evalState);
  const state = useSnapshot(printerState);
  const categories = Object.entries(categoryData || {});
  return (
    <div style={{ marginTop: '10px' }}>
      {categories
        .filter(([id]) => state.categories[id]?.enabled ?? false)
        .map(([id, categoryDef]) => (
          <div key={id}>
            <Title level={3} key={id} style={{ marginTop: '15px' }}>
              {categoryDef.name}
            </Title>
            <hr color="black" />
            <PrintCategory categoryId={id} />
          </div>
        ))}
    </div>
  );
}

export default function PrintView() {
  const evalStateSnapshot = useSnapshot(evalState);
  const { person, categoryData: catData } = evalStateSnapshot;
  const state = useSnapshot(printerState);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories: CategoryData = catData ?? {};
  useEffect(() => {
    printerState.showGraph = true;
    const printerOptions: { [id: string]: PrinterCategoryOption } = {};
    Object.keys(categories).forEach((catKey) => {
      const [min, max] = minMaxKey(person?.birthday, categories[catKey].phases);
      printerOptions[catKey] = { enabled: true, min, max };
    });
    printerState.categories = printerOptions;
  }, [evalStateSnapshot, categories, person?.birthday]);
  const tablePerRowMarks: SliderMarks = {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
  };
  const fontSizeRowMarks: SliderMarks = {};
  for (let i = 2; i < 20; i += 2) {
    // 0.1 to 2.0
    fontSizeRowMarks[i] = (i / 10).toFixed(1);
  }

  const onPrintClicked = () => {
    window.print();
  };
  /*
    // TODO: export pdf
  const onSavePdfClick = async () => {
    const body = document.body;
    const opt = {
      margin: 1,
      filename: 'export.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    };
    document.body.classList.add('pdf-export');
    await sleep(1000);
    html2pdf().set(opt).from(body).save();
    // await sleep(10000)
    // document.body.classList.remove('pdf-export') fuck....
  };
  */

  return (
    <div className={styles.printPageContainer}>
      <div className={`hiddenPrint ${styles.printControls}`}>
        <div className={styles.printHeader}>
          <Title level={2}>Druckansicht</Title>
          <Affix offsetTop={5}>
            <Button
              onClick={onPrintClicked}
              type="primary"
              className={styles.printButton}
              icon={<PrinterOutlined />}
            >
              Drucken
            </Button>
          </Affix>
        </div>
        <Title level={5}>Einstellungen</Title>
        {Object.entries(categories).map(([catId, categoryData]) => (
          <div key={catId} className={styles.categoryOptionsContainer}>
            <Checkbox
              className={styles.categoryCheckbox}
              checked={state.categories[catId]?.enabled ?? false}
              onChange={(e) => {
                printerState.categories[catId].enabled = e.target.checked;
              }}
            >
              {categoryData.name}
            </Checkbox>
            <Input
              className={styles.categoryInput}
              type="number"
              placeholder="von"
              value={state.categories[catId]?.min ?? 0}
              onChange={(e) => {
                printerState.categories[catId].min = parseInt(
                  e.target.value,
                  10
                );
              }}
            />
            <Input
              className={styles.categoryInput}
              type="number"
              placeholder="bis"
              value={state.categories[catId]?.max ?? 0}
              onChange={(e) => {
                printerState.categories[catId].max = parseInt(
                  e.target.value,
                  10
                );
              }}
            />
          </div>
        ))}
        <Checkbox
          checked={state.showGraph}
          onChange={(e) => {
            printerState.showGraph = e.target.checked;
          }}
        >
          <Title level={4}>Graph anzeigen</Title>
        </Checkbox>
        <div className={styles.sliderContainer}>
          <Text>Tabellen pro Zeile</Text>
          <Slider
            defaultValue={2}
            value={state.tablePerRow}
            onChange={(v) => {
              printerState.tablePerRow = v;
              printerState.fontSizeEm = getFontSizeForTablePerRow(v);
            }}
            min={1}
            max={4}
            marks={tablePerRowMarks}
            style={{ flexGrow: '1' }}
          />
        </div>
        <Divider />
      </div>
      <div className={styles.printAreaContainer}>
        <div className={styles.printArea}>
          <p style={{ float: 'right' }}>
            Generiert am {new Date().toLocaleDateString('de-DE')}
          </p>
          <Title level={1}>{person?.name}</Title>
          <PrintCategories />
          {state.showGraph && <Graph showControls={false} />}
        </div>
      </div>
    </div>
  );
}

function PrintCategory({ categoryId }: { categoryId: string }) {
  const { person, categoryData } = useSnapshot(evalState);
  const state = useSnapshot(printerState);
  if (person == null || categoryData == null) return <></>;
  const categoryDefinition = categoryData[categoryId];
  const personCategory = person.categories[categoryId];
  const phases = createPhaseEntries(categoryDefinition, personCategory.phases);
  const span = 24 / state.tablePerRow;
  return (
    <div className={styles.category}>
      <Row gutter={24}>
        {phases
          .filter((p) => displayPhase(state, categoryId, p))
          .map((phase) => (
            <Col key={phase.id} span={span} style={{ marginTop: '10px' }}>
              <Title level={5} style={{ marginBottom: '-1px' }}>
                {categoryDefinition.name}{' '}
                {phase.phaseDefinition.name || phase.id}
              </Title>
              <SimpleTable phaseEntry={phase} />
            </Col>
          ))}
      </Row>
    </div>
  );
}

function SimpleTable({ phaseEntry }: { phaseEntry: PhaseEntry }) {
  const state = useSnapshot(printerState);
  const def = phaseEntry.phaseDefinition;
  const cellClass = (rowIdx: number, idx: number) =>
    idx === phaseEntry.phase.entries[rowIdx]
      ? `${styles.crossed1} ${styles.crossed2}`
      : '';
  const tableCellSizeStyle = getSizeStylesForFontSize(state.fontSizeEm);
  return (
    <table
      className={styles.table}
      style={{ fontSize: `${state.fontSizeEm}em` }}
    >
      <thead>
        <tr>
          <th className={styles.table}>Erklärung</th>
          <th
            className={`${styles.table} ${styles.tableMarkerCell}`}
            style={tableCellSizeStyle}
          >
            Tut es
          </th>
          <th
            className={`${styles.table} ${styles.tableMarkerCell}`}
            style={tableCellSizeStyle}
          >
            Teil&#8203;weise
          </th>
          <th
            className={`${styles.table} ${styles.tableMarkerCell}`}
            style={tableCellSizeStyle}
          >
            Nicht
          </th>
          <th
            className={`${styles.table} ${styles.tableMarkerCell}`}
            style={tableCellSizeStyle}
          >
            Unbe&#8203;kannt
          </th>
        </tr>
      </thead>
      <tbody>
        {phaseEntry.phase.entries.map((_, rowIdx) => (
          <tr key={uuidv4()}>
            <td className={`${styles.table}`}>
              {def.entries[rowIdx]?.description ??
                'Keine Beschreibung gefunden'}
            </td>
            <td
              className={`${styles.table} ${styles.tableMarkerCell} ${cellClass(
                rowIdx,
                0
              )}`}
              style={tableCellSizeStyle}
            />
            <td
              className={`${styles.table} ${styles.tableMarkerCell} ${cellClass(
                rowIdx,
                1
              )}`}
              style={tableCellSizeStyle}
            />
            <td
              className={`${styles.table} ${styles.tableMarkerCell} ${cellClass(
                rowIdx,
                2
              )}`}
              style={tableCellSizeStyle}
            />
            <td
              className={`${styles.table} ${styles.tableMarkerCell} ${cellClass(
                rowIdx,
                3
              )}`}
              style={tableCellSizeStyle}
            />
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function displayPhase(
  state: PrinterState,
  categoryId: string,
  phase: PhaseEntry
): boolean {
  const key = parseInt(phase.id, 10);
  const limits = state.categories[categoryId];
  if (limits == null) return false;
  return limits.min <= key && key <= limits.max;
}

function getSizeStylesForFontSize(fontSizeEm: number): {
  [key: string]: string;
} {
  const sizePx = `${fontSizeEm * 50}px`;
  return {
    width: sizePx,
    height: sizePx,
    maxWidth: sizePx,
    maxHeight: sizePx,
    minWidth: sizePx,
    minHeight: sizePx,
  };
}

function getFontSizeForTablePerRow(tablesPerRow: number): number {
  const mapping: { [key: number]: number } = {
    1: 1.2,
    2: 1.2,
    3: 0.8,
    4: 0.6,
  };
  const defaultSize = 1.0;
  return mapping[tablesPerRow] ?? defaultSize;
}

function minMaxKey(
  birthday: string | undefined,
  obj: { [key: string]: unknown }
): [number, number] {
  const phase =
    birthday == null ? Number.MAX_SAFE_INTEGER : getPhaseForBirthday(birthday);
  const keys = Object.keys(obj)
    .map((k) => parseInt(k, 10))
    .filter((v) => !Number.isNaN(v));
  if (keys.length === 0) return [7, 18];
  const min = Math.min(...keys);
  const max = Math.max(...keys);
  return [min, Math.min(phase, max)];
}
