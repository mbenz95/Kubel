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
import {
  ExportOutlined,
  PrinterOutlined,
  SignalFilled,
} from '@ant-design/icons';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
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
  showNotes: boolean;
  showSignature: boolean;
  tablePerRow: number;
  categories: { [id: string]: PrinterCategoryOption };
  fontSizeEm: number;
};

const printerState = proxy<PrinterState>({
  showGraph: true,
  showNotes: true,
  showSignature: true,
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
  const fontSizeRowMarks: SliderMarks = {};
  for (let i = 2; i < 20; i += 2) {
    // 0.1 to 2.0
    fontSizeRowMarks[i] = (i / 10).toFixed(1);
  }

  const onPrintClicked = () => {
    window.print();
  };

  const onSavePdfClick = async () => {
    const filename = `kubel-${evalState.person?.name}.pdf`;
    window.electron.ipcRenderer.invoke('printToPdf', { name: filename });
  };

  return (
    <div className={styles.printPageContainer}>
      <div className={`hiddenPrint ${styles.printControls}`}>
        <div className={styles.printHeader}>
          <Title level={2}>Druckansicht</Title>
          <Affix offsetTop={5}>
            <div>
              <Button
                type="primary"
                icon={<ExportOutlined />}
                onClick={onSavePdfClick}
              >
                Als PDF exportieren
              </Button>
              <Button
                onClick={onPrintClicked}
                type="primary"
                className={styles.printButton}
                icon={<PrinterOutlined />}
              >
                Drucken
              </Button>
            </div>
          </Affix>
        </div>
      </div>
      <div className="hiddenPrint">
        <PrintViewControls />
        <Divider />
      </div>
      <div className={styles.printAreaContainer}>
        <div className={styles.printArea}>
          <p style={{ float: 'right' }}>
            Generiert am {new Date().toLocaleDateString('de-DE')}
          </p>
          <Title level={1}>{person?.name}</Title>
          <PrintCategories />
          <GraphToggle />
          <NoteToggle />
          <SignatureToggle />
        </div>
      </div>
    </div>
  );
}

// factor out the toggles so we only have to re-render those on change
function GraphToggle() {
  const state = useSnapshot(printerState);
  return <>{state.showGraph && <Graph showControls={false} />}</>;
}

function NoteToggle() {
  const state = useSnapshot(printerState);
  return <>{state.showNotes && <NoteArea />}</>;
}

function SignatureToggle() {
  const state = useSnapshot(printerState);
  return <>{state.showSignature && <SignatureArea />}</>;
}

function PrintViewControls() {
  const evalStateSnapshot = useSnapshot(evalState);
  const { categoryData: catData } = evalStateSnapshot;
  const categories: CategoryData = catData ?? {};
  const state = useSnapshot(printerState);
  const tablePerRowMarks: SliderMarks = {
    1: '1',
    2: '2',
    3: '3',
    4: '4',
  };
  return (
    <>
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
              printerState.categories[catId].min = parseInt(e.target.value, 10);
            }}
          />
          <Input
            className={styles.categoryInput}
            type="number"
            placeholder="bis"
            value={state.categories[catId]?.max ?? 0}
            onChange={(e) => {
              printerState.categories[catId].max = parseInt(e.target.value, 10);
            }}
          />
        </div>
      ))}
      <div>
        <Checkbox
          style={{ margin: '0' }}
          checked={state.showGraph}
          onChange={(e) => {
            printerState.showGraph = e.target.checked;
          }}
        >
          <Title level={5}>Graph anzeigen</Title>
        </Checkbox>
      </div>
      <div>
        <Checkbox
          style={{ margin: '0' }}
          checked={state.showNotes}
          onChange={(e) => {
            printerState.showNotes = e.target.checked;
          }}
        >
          <Title level={5}>Notizen anzeigen</Title>
        </Checkbox>
      </div>
      <div>
        <Checkbox
          style={{ margin: '0', marginBottom: '24px' }}
          checked={state.showSignature}
          onChange={(e) => {
            printerState.showSignature = e.target.checked;
          }}
        >
          <Title level={5}>Unterschriftszeile anzeigen</Title>
        </Checkbox>
      </div>
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
    </>
  );
}

function PrintCategory({ categoryId }: { categoryId: string }) {
  const { person, categoryData } = useSnapshot(evalState);
  const state = useSnapshot(printerState);
  if (person == null || categoryData == null) return <></>;
  const categoryDefinition = categoryData[categoryId];
  const personCategory = person.categories[categoryId];
  const printerCategoryOption = state.categories[categoryId];
  const tablePerRow = state.tablePerRow;
  const phases = createPhaseEntries(
    categoryDefinition,
    personCategory.phases
  ).filter((p) => displayPhase(printerCategoryOption, p));
  const span = 24 / tablePerRow;
  return (
    <div className={styles.category}>
      <Row gutter={24}>
        {phases.map((phase) => (
          <Col
            key={phase.id}
            span={span}
            style={{ marginTop: '10px' }}
            className={styles.pageGroup}
          >
            <Title level={5} style={{ marginBottom: '-1px' }}>
              {categoryDefinition.name} {phase.phaseDefinition.name || phase.id}
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
  const isMarked = (rowIdx: number, idx: number) =>
    idx === phaseEntry.phase.entries[rowIdx];
  const tableCellSizeStyle = getSizeStylesForTablePerRow(state.tablePerRow);
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
              className={`${styles.table} ${styles.tableMarkerCell}`}
              style={tableCellSizeStyle}
            >
              {isMarked(rowIdx, 0) && (
                <>
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      true
                    )}
                  />
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      false
                    )}
                  />
                </>
              )}
            </td>
            <td
              className={`${styles.table} ${styles.tableMarkerCell}`}
              style={tableCellSizeStyle}
            >
              {isMarked(rowIdx, 1) && (
                <>
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      true
                    )}
                  />
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      false
                    )}
                  />
                </>
              )}
            </td>
            <td
              className={`${styles.table} ${styles.tableMarkerCell}`}
              style={tableCellSizeStyle}
            >
              {isMarked(rowIdx, 2) && (
                <>
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      true
                    )}
                  />
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      false
                    )}
                  />
                </>
              )}
            </td>
            <td
              className={`${styles.table} ${styles.tableMarkerCell}`}
              style={tableCellSizeStyle}
            >
              {isMarked(rowIdx, 3) && (
                <>
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      true
                    )}
                  />
                  <div
                    style={getCrossStyleForTablesPerRow(
                      state.tablePerRow,
                      false
                    )}
                  />
                </>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function displayPhase(
  printerCategoryOption: PrinterCategoryOption,
  phase: PhaseEntry
): boolean {
  const key = parseInt(phase.id, 10);
  const limits = printerCategoryOption;
  if (limits == null) return false;
  return limits.min <= key && key <= limits.max;
}

const tableScaling: {
  [key: number]: {
    fontSize: number;
    cellSize: number;
    crossSize: number;
    crossOffset: number;
  };
} = {
  1: { fontSize: 1.2, cellSize: 60, crossSize: 60, crossOffset: 0 },
  2: { fontSize: 1.0, cellSize: 50, crossSize: 50, crossOffset: 0 },
  3: { fontSize: 0.8, cellSize: 35, crossSize: 35, crossOffset: 0 },
  4: { fontSize: 0.6, cellSize: 25, crossSize: 20, crossOffset: 0 },
};

function getSizeStylesForTablePerRow(tablePerRow: number): {
  [key: string]: string;
} {
  const size = tableScaling[tablePerRow].cellSize;
  const sizePx = `${size}px`;
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
  const defaultSize = 1.0;
  return tableScaling[tablesPerRow].fontSize ?? defaultSize;
}
function getCrossStyleForTablesPerRow(
  tablesPerRow: number,
  firstCross: boolean
): {
  [key: string]: string;
} {
  const mapping = tableScaling[tablesPerRow];
  return {
    position: 'absolute',
    border: '1px solid black',
    width: `${mapping.crossSize}px`,
    transform: `rotate(${!firstCross ? '-' : ''}45deg)`,
    left: `${mapping.crossOffset}px`,
  };
}

function minMaxKey(
  birthday: string | undefined,
  obj: { [key: string]: unknown }
): [number, number] {
  const phase = birthday == null ? null : getPhaseForBirthday(birthday);
  const keys = Object.keys(obj)
    .map((k) => parseInt(k, 10))
    .filter((v) => !Number.isNaN(v));
  if (keys.length === 0) return [7, 18];
  const min = Math.min(...keys);
  const max = Math.max(...keys);
  if (phase == null) return [min, max];
  return [
    Math.max(min, phase - 1),
    Math.max(Math.min(max, phase + 1), min + 1),
  ];
}

function NoteArea() {
  const { person } = useSnapshot(evalState);
  const note = person?.note ?? '';
  return (
    <>
      <div
        style={{
          marginTop: '100px',
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography.Title level={3} style={{ marginLeft: '24px' }}>
          Notizen
        </Typography.Title>
        <div
          style={{
            border: '1px solid black',
            flexGrow: '1',
            margin: '0 24px 24px 24px',
            padding: '8px 8px 200px 8px',
          }}
        >
          {note}
        </div>
      </div>
    </>
  );
}

function SignatureArea() {
  return (
    <>
      <div
        style={{
          printColorAdjust: 'exact',
          width: '95%',
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '40px',
          marginBottom: '32px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '50%',
          }}
        >
          <span style={{ font: '1.3em "Arial", sans-serif' }}>
            {dayjs().format('DD.MM.YYYY')}
          </span>
          <div
            style={{
              height: '1px',
              backgroundColor: 'black',
              width: '100%',
            }}
            className={styles.printColorAdjust}
          />
          <span style={{ alignSelf: 'flex-end' }}>Unterschrift</span>
        </div>
      </div>
    </>
  );
}
