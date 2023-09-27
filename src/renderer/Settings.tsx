import {
  Alert,
  Button,
  Card,
  Checkbox,
  Collapse,
  Divider,
  Popconfirm,
  Tooltip,
  Typography,
  message,
} from 'antd';
import Title from 'antd/lib/typography/Title';
import { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import ReactMarkdown from 'react-markdown';
import { CheckboxChangeEvent } from 'antd/es/checkbox';
import { updateState } from './update/UpdateService';
import styles from './Settings.module.css';
import { config, saveConfig } from './ConfigState';

const { Text } = Typography;
const { Panel } = Collapse;

type UpdateCheckResult = {
  readonly version: string;
  readonly releaseName?: string | null;
  readonly releaseDate: string;
};

export default function SettingsPage() {
  return (
    <div style={{ marginTop: '10px', paddingBottom: '50px' }}>
      <Title level={2}>Einstellungen</Title>
      <Card title="Version &amp; Updates">
        <UpdateSection />
      </Card>
      <Card title="Andere Einstellungen" style={{ marginTop: '12px' }}>
        <OverwriteCategories />
        <Divider />
        <OpenPdfAfterSaveConfig />
      </Card>
    </div>
  );
}

function UpdateSection() {
  const updateServiceState = useSnapshot(updateState);
  const [updateInfo, setUpdateInfo] = useState<string | null>(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  useEffect(() => {
    // 'hack' to ensure we reset the loading state on the button once the update has downloaded
    if (updateServiceState.lastEvent === 'update-downloaded') {
      setIsLoadingUpdate(false);
    }
  }, [updateServiceState.lastEvent]);

  const runUpdate = async () => {
    setIsLoadingUpdate(true);
    setUpdateInfo(null);
    let willUpdate =
      updateServiceState.isNewVersionAvailable &&
      !updateServiceState.updateDownloaded;
    const result: UpdateCheckResult | null =
      await window.electron.ipcRenderer.invoke('runUpdate');
    if (result != null) {
      const date = new Date(result.releaseDate);
      setUpdateInfo(
        `Aktuellste Version: ${result.version} vom ${date.toLocaleString()}`
      );
    } else {
      willUpdate = false;
      setUpdateInfo('Keine Updates gefunden');
    }
    if (!willUpdate) setIsLoadingUpdate(false);
  };

  return (
    <>
      <h4>Aktuelle Version: {updateServiceState.currentVersion}</h4>
      <Button loading={isLoadingUpdate} onClick={runUpdate}>
        Update Kubel
      </Button>
      {updateInfo != null ? (
        <Text strong className={styles.updateText}>
          {updateInfo}
        </Text>
      ) : null}
      {updateServiceState.updateDownloaded ? (
        <Alert
          type="success"
          message="Das Update wurde heruntergeladen. Es wird beim beenden der
        Anwendung automatisch installiert."
          className={styles.updateAlert}
        />
      ) : null}
      {isLoadingUpdate && !updateServiceState.updateDownloaded ? (
        <Alert
          message="Der Download wurde gestartet. Das kann einen Moment dauern..."
          type="info"
        />
      ) : null}
      {updateServiceState.isNewVersionAvailable &&
      !updateServiceState.updateDownloaded ? (
        <Alert
          type="info"
          message="Es ist ein neues Update verfügbar!"
          description={`Neue Version: ${
            updateServiceState.updateVersion ?? '?'
          }`}
          className={styles.updateAlert}
        />
      ) : null}

      <Changelog />
      <Button
        type="link"
        target="_blank"
        href="https://github.com/mbenz95/Kubel"
        style={{ marginTop: '12px' }}
      >
        View source code on GitHub
      </Button>
    </>
  );
}

function Changelog() {
  const [changelog, setChangelog] = useState('');
  useEffect(() => {
    const loadData = async () => {
      const data = await fetch(
        'https://kubel-releases.s3.eu-central-1.amazonaws.com/CHANGELOG.md',
        { cache: 'no-cache' }
      );
      const text = await data.text();
      setChangelog(text);
    };
    loadData();
  });
  return (
    <>
      <Collapse style={{ marginTop: '20px' }}>
        <Panel header="Changelog" key="1">
          <ReactMarkdown>{changelog}</ReactMarkdown>
        </Panel>
      </Collapse>
    </>
  );
}

function OverwriteCategories() {
  const [loading, setLoading] = useState(false);
  const overwrite = () => {
    setLoading(true);
    window.electron.ipcRenderer.invoke('overwriteCategories');
    setTimeout(() => {
      // overwrite reloads to avoid having to update the categories so
      // this won't be running anyway...
      setLoading(false);
    }, 500);
  };
  return (
    <Popconfirm
      title="Achtung!"
      description="Manuelle Änderungen in der categories.json datei gehen verloren!"
      onConfirm={overwrite}
    >
      <Button danger loading={loading}>
        Kategorien überschreiben
      </Button>
    </Popconfirm>
  );
}

function OpenPdfAfterSaveConfig() {
  const cfg = useSnapshot(config);
  const change = (evt: CheckboxChangeEvent) => {
    config.openPdfAfterSave = evt.target.checked;
    (async () => {
      await saveConfig();
    })();
  };
  return (
    <Checkbox checked={cfg.openPdfAfterSave} onChange={change}>
      PDF nach dem Speichern öffnen
    </Checkbox>
  );
}
