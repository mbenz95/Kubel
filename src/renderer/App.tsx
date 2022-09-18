import { Dispatch, useEffect, useState } from 'react';
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Link,
  useNavigate,
} from 'react-router-dom';
import { Badge, Button, Layout } from 'antd';
import { Content, Header } from 'antd/lib/layout/layout';
import {
  ArrowLeftOutlined,
  InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import { useSnapshot } from 'valtio';
import PersonEvaluation from './eval/Evaluation';
import { CategoryData, Data, Person } from './eval/models';
import PeopleList from './eval/PeopleList';
import {} from './preload';
import PrintView from './eval/PrintView';
import { sleep } from './eval/Utils';
import styles from './App.module.css';
import 'antd/dist/antd.css';
import SettingsPage from './Settings';
import { initUpdateService, updateState } from './update/UpdateService';

function showError(err: any) {
  alert(err);
}

async function loadData<T>(file: string, setData?: Dispatch<T>) {
  const result: T | { error: string } =
    await window.electron.ipcRenderer.invoke('loadfile', file);
  if ('error' in result) {
    showError(result.error);
    return undefined;
  }
  if (setData != null) setData(result);
  return result;
}

const updatePeopleFile = async (id: string, person: Person | undefined) => {
  const peopleData: Data | { error: string } | undefined = await loadData(
    'data.json'
  );
  if (peopleData == null || 'error' in peopleData) {
    showError(peopleData?.error ?? 'Fehler beim Laden der Daten');
    return;
  }
  if (person != null) {
    peopleData.people[id] = person;
  } else {
    // undefined is interpreted as delete
    delete peopleData.people[id];
  }

  const result = await window.electron.ipcRenderer.invoke(
    'savefile',
    'data.json',
    JSON.stringify(peopleData)
  );
  if (result.error != null) {
    showError(result.error);
  }
};

export default function App() {
  return (
    <Router>
      <RoutedApp />
    </Router>
  );
}

function RoutedApp() {
  const [data, setData] = useState<Data | undefined>(undefined);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    initUpdateService();
  }, []);
  useEffect(() => {
    // display initial errors if any
    (async () => {
      const error = await window.electron.ipcRenderer.invoke('receiveError');
      if ('error' in error) {
        showError(error.error);
      }
    })();

    loadData('data.json', setData);
  }, []);
  const [categories, setCategories] = useState<CategoryData | undefined>(
    undefined
  );
  useEffect(() => {
    loadData('categories.json', setCategories);
  }, []);
  const handleSavePerson = async (id: string, person: Person) => {
    setIsSaving(true);
    await updatePeopleFile(id, person);
    const newData = JSON.parse(JSON.stringify(data));
    newData.people[id] = person;
    setData(newData);
    await sleep();
    setIsSaving(false);
  };
  const handleDeletePerson = async (id: string) => {
    setIsSaving(true);
    await updatePeopleFile(id, undefined);
    const newData = JSON.parse(JSON.stringify(data));
    delete newData.people[id];
    await sleep();
    setData(newData);
    setIsSaving(false);
  };
  const handleAddPerson = async (person: Person) => {
    setIsSaving(true);
    const id = uuidv4();
    await updatePeopleFile(id, person);
    const newData = JSON.parse(JSON.stringify(data));
    newData.people[id] = person;

    setData(newData);
    setIsSaving(false);
  };

  return (
    <Layout>
      <Header className={styles.header}>
        <div className={styles.headerContentContainer}>
          <Button
            style={{ color: 'white', fontSize: '2em' }}
            type="link"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftOutlined />
          </Button>
          <Link to="/" style={{ fontSize: 'xx-large', color: 'white' }}>
            Project: KuBel
          </Link>
          <SettingsLink />
        </div>
      </Header>
      <Content style={{ padding: '0 50px' }}>
        <Routes>
          <Route
            path="/"
            element={
              <PeopleList
                data={data}
                categoryData={categories}
                onDeletePerson={handleDeletePerson}
                onAddPerson={handleAddPerson}
                isSaving={isSaving}
              />
            }
          />
          <Route
            path="/person/:id"
            element={
              <PersonEvaluation
                data={data}
                categoryData={categories}
                onSavePerson={handleSavePerson}
                isSaving={isSaving}
              />
            }
          />
          <Route path="/print/:id" element={<PrintView />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Content>
    </Layout>
  );
}

function SettingsLink() {
  const updateServiceState = useSnapshot(updateState);
  return (
    <Link to="/settings" className={styles.settingsLink}>
      <Badge
        count={
          updateServiceState.isNewVersionAvailable ? (
            <InfoCircleOutlined className={styles.settingsBadge} />
          ) : (
            0
          )
        }
        offset={[-6, 6]}
      >
        <Button
          className={styles.settingsButton}
          shape="circle"
          ghost
          size="large"
          icon={<SettingOutlined />}
        />
      </Badge>
    </Link>
  );
}
