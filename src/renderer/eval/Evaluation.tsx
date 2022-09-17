import {
  CheckOutlined,
  CloseOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import {
  Button,
  Collapse,
  DatePicker,
  Divider,
  message,
  Modal,
  Radio,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { evalState } from 'renderer/eval/evalState';
import { useSnapshot } from 'valtio';
import moment from 'moment';
import { calculateResult, Graph } from './Graph';
import {
  CategoryData,
  Data,
  emptyCategory,
  EntryDefinition,
  Person,
  Selection,
  Category,
  BIRTHDAY_DATE_FORMAT,
} from './models';
import styles from './Person.module.css';
import { createPhaseEntries, PhaseEntry } from './Utils';

const { Panel } = Collapse;

const handleAutomaticPhaseCompletion = (
  category: Category,
  phase: string,
  sel: Selection
) => {
  if (sel !== Selection.Do && sel !== Selection.Dont) return;
  // check if phase is all complete or incomplete
  let changed = false;
  const allComplete = category.phases[phase].entries.every(
    (e) => e === Selection.Do
  );
  if (allComplete) {
    const keys = Object.keys(category.phases);
    const indexOfCurrent = keys.indexOf(phase);
    for (let phaseIdx = 0; phaseIdx < indexOfCurrent; phaseIdx += 1) {
      const entries = category.phases[keys[phaseIdx]].entries;
      for (let entryIdx = 0; entryIdx < entries.length; entryIdx += 1) {
        if (entries[entryIdx] !== Selection.Do) changed = true;
        entries[entryIdx] = Selection.Do;
      }
    }
    if (changed) {
      message.info("Alle vorherigen Phasen wurden auf 'Tut Es' gesetzt");
    }
  }
  const allIncomplete = category.phases[phase].entries.every(
    (e) => e === Selection.Dont
  );
  if (allIncomplete) {
    const keys = Object.keys(category.phases);
    const indexOfCurrent = keys.indexOf(phase);
    changed = false;
    for (
      let phaseIdx = indexOfCurrent + 1;
      phaseIdx < keys.length;
      phaseIdx += 1
    ) {
      const entries = category.phases[keys[phaseIdx]].entries;
      for (let entryIdx = 0; entryIdx < entries.length; entryIdx += 1) {
        if (entries[entryIdx] !== Selection.Dont) changed = true;
        entries[entryIdx] = Selection.Dont;
      }
    }
    if (changed) {
      message.info("Alle nachfolgenden Phasen wurden auf 'Nicht' gesetzt");
    }
  }
};

function CategoryTab({ categoryId }: { categoryId: string }) {
  const [highlightRow, setHighlightRow] = useState<[string | null, number]>([
    null,
    -1,
  ]);
  const { person, categoryData } = useSnapshot(evalState);
  if (person == null || categoryData == null) throw new Error('no data');
  const categoryDefinition = categoryData[categoryId];
  const personCategory = person.categories[categoryId];
  const [additionalInformation, setAdditionalInformation] = useState<
    string | null
  >(null);

  const phases = createPhaseEntries(categoryDefinition, personCategory);

  const selectionChange = (phase: string, entry: number, sel: Selection) => {
    // const newCategory: Category = JSON.parse(JSON.stringify(personCategory));
    const personState = evalState.person;
    if (personState != null) {
      personState.categories[categoryId].phases[phase].entries[entry] = sel;

      handleAutomaticPhaseCompletion(
        personState.categories[categoryId],
        phase,
        sel
      );
    }
    // newCategory.phases[phase].entries[entry] = sel;
    // onCategoryChanged(newCategory);
  };

  const handleRowMouseEnter = (phaseId: string, rowIdx: number) => {
    setHighlightRow([phaseId, rowIdx]);
  };
  const handleRowMouseLeave = () => {
    setHighlightRow([null, -1]);
  };
  const showAdditionalInfoModal = (entry: EntryDefinition) => {
    setAdditionalInformation(entry.additionalInformation ?? null);
  };

  const highlightClass = (phaseId: string, rowIdx: number) => {
    return phaseId === highlightRow[0] && highlightRow[1] === rowIdx
      ? styles.rowHighlight
      : '';
  };
  const header = (phaseEntry: PhaseEntry) => {
    const result = calculateResult(phaseEntry.phase);
    const phaseName = phaseEntry.phaseDefinition.name || phaseEntry.id;
    const resultRounded = Math.round(result * 100) / 100;
    return (
      <div className={styles.collapseHeader}>
        {`${categoryDefinition.name} ${phaseName}`}
        <span
          className={styles.collapseResult}
        >{`Ergebnis: ${resultRounded}`}</span>
      </div>
    );
  };

  return (
    <>
      <Collapse>
        {phases.map((phase) => (
          <Panel header={header(phase)} key={phase.id}>
            <div className={styles.row}>
              <div className={styles.colFirst}>Erklärung</div>
              <div className={styles.col}>Tut Es</div>
              <div className={styles.col}>Teilweise</div>
              <div className={styles.col}>Nicht</div>
              <div className={styles.col}>Unbekannt</div>
            </div>
            <Divider className={styles.colHeaderDivider} />
            {phase.phase.entries.map((row, rowIdx) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={rowIdx}
                className={`${styles.row} ${highlightClass(phase.id, rowIdx)}`}
                onMouseEnter={() => handleRowMouseEnter(phase.id, rowIdx)}
                onMouseLeave={handleRowMouseLeave}
              >
                <div className={styles.colFirst}>
                  {phase.phaseDefinition.entries[rowIdx]?.description ??
                    'Keine Beschreibung gefunden'}
                  {phase.phaseDefinition.entries[rowIdx]
                    ?.additionalInformation && (
                    <Tooltip title="Zusätzliche Informationen">
                      <Button
                        type="text"
                        shape="circle"
                        size="small"
                        onClick={() =>
                          showAdditionalInfoModal(
                            phase.phaseDefinition.entries[rowIdx]
                          )
                        }
                        style={{ marginLeft: '10px' }}
                        icon={<InfoCircleOutlined />}
                      />
                    </Tooltip>
                  )}
                </div>
                <div className={styles.colContainer}>
                  <Radio.Group buttonStyle="solid" value={row.toString()}>
                    <div className={styles.col}>
                      <Radio.Button
                        value="0"
                        onChange={() =>
                          selectionChange(phase.id, rowIdx, Selection.Do)
                        }
                      />
                    </div>
                    <div
                      className={styles.col}
                      onChange={() =>
                        selectionChange(phase.id, rowIdx, Selection.Partially)
                      }
                    >
                      <Radio.Button value="1" />
                    </div>
                    <div
                      className={styles.col}
                      onChange={() =>
                        selectionChange(phase.id, rowIdx, Selection.Dont)
                      }
                    >
                      <Radio.Button value="2" />
                    </div>
                    <div
                      className={styles.col}
                      onChange={() =>
                        selectionChange(phase.id, rowIdx, Selection.Unknown)
                      }
                    >
                      <Radio.Button value="3" />
                    </div>
                  </Radio.Group>
                </div>
              </div>
            ))}
          </Panel>
        ))}
      </Collapse>
      <Modal
        title="Zusätzliche Informationen"
        open={additionalInformation != null}
        onCancel={() => setAdditionalInformation(null)}
        footer={
          <Button onClick={() => setAdditionalInformation(null)}>Ok</Button>
        }
      >
        <Typography.Text>{additionalInformation}</Typography.Text>
      </Modal>
    </>
  );
}

const CategoryTabs = () => {
  const callback = () => {};
  const { person, categoryData } = useSnapshot(evalState);
  if (person == null || categoryData == null) throw new Error('no data');

  const categories = Object.entries(categoryData);
  categories.forEach(([id, category]) => {
    // add missing categories as categories might be added in the definition file
    if (person.categories[id] == null && evalState.person != null) {
      evalState.person.categories[id] = emptyCategory(category);
    }
  });

  const tabItems = categories.map(([id, categoryDef]) => ({
    label: categoryDef.name,
    key: id,
    children: <CategoryTab categoryId={id} />,
  }));
  return (
    <Tabs
      items={tabItems}
      defaultActiveKey="0"
      onChange={callback}
      size="large"
    />
  );
};

export default function PersonEvaluation({
  data,
  categoryData,
  onSavePerson,
  isSaving,
}: {
  data: Data | undefined;
  categoryData: CategoryData | undefined;
  onSavePerson: (id: string, person: Person) => void;
  isSaving: boolean;
}) {
  const { id } = useParams();
  const navigate = useNavigate();
  const intialPerson = id != null ? data?.people?.[id] : undefined;
  useState(() => {
    // TODO: why does this have to be in use state?
    evalState.person = intialPerson;
    evalState.categoryData = categoryData;
  });
  const { person } = useSnapshot(evalState);

  if (id == null || data == null) {
    navigate('/');
    return null;
  }

  if (person == null) return <h1>Error: Es wurde keine Person geladen</h1>;
  if (categoryData == null)
    return <h1>Error: Es wurde keine Kategorien geladen</h1>;
  return (
    <>
      <div className={styles.headerContainer}>
        <h1 className={styles.title}>{person.name}</h1>
        <div>
          <Link to={`/print/${id}`} style={{ marginRight: '10px' }}>
            <Button icon={<PrinterOutlined />}>Zur Druckansicht</Button>
          </Link>
          <Button
            loading={isSaving}
            onClick={() => {
              if (evalState.person != null) onSavePerson(id, evalState.person);
            }}
          >
            Speichern
          </Button>
        </div>
      </div>
      <BirthdayDisplay />
      <CategoryTabs />
      <Graph showControls />
    </>
  );
}

function BirthdayDisplay() {
  const [edit, setEdit] = useState(false);
  const { person } = useSnapshot(evalState);
  const defaultDate = () =>
    person?.birthday == null
      ? undefined
      : moment(person.birthday, BIRTHDAY_DATE_FORMAT).local();
  const [date, setDate] = useState(defaultDate());
  const onAccept = () => {
    setEdit(false);
    const formatted = date?.format(BIRTHDAY_DATE_FORMAT);
    if (evalState.person != null) evalState.person.birthday = formatted;
  };
  const onCancel = () => {
    setDate(defaultDate); // reset to default
    setEdit(false);
  };
  const onDateChanged = (curDate: moment.Moment | null) => {
    setDate(curDate ?? undefined);
  };
  const dateParsed =
    date == null ? undefined : moment(date, BIRTHDAY_DATE_FORMAT);
  return (
    <>
      <h4 style={{ marginBottom: '-5px' }}>
        {edit ? (
          <>
            <DatePicker
              defaultValue={dateParsed}
              onChange={onDateChanged}
              format={BIRTHDAY_DATE_FORMAT}
            />
            <Tooltip title="Ok">
              <Button
                type="text"
                shape="circle"
                icon={<CheckOutlined />}
                onClick={onAccept}
              />
            </Tooltip>
            <Tooltip title="Abbrechen">
              <Button
                type="text"
                shape="circle"
                icon={<CloseOutlined />}
                onClick={onCancel}
              />
            </Tooltip>
          </>
        ) : (
          <>
            <span>Geburtsdatum: {person?.birthday ?? '-'}</span>
            <Tooltip title="Editieren">
              <Button
                type="text"
                shape="circle"
                icon={<EditOutlined />}
                onClick={() => setEdit(!edit)}
              />
            </Tooltip>
          </>
        )}
      </h4>
    </>
  );
}
