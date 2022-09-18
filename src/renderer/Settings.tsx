import { Alert, Button, Card, Typography } from 'antd';
import Title from 'antd/lib/typography/Title';
import { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { sleep } from './eval/Utils';
import { updateState } from './update/UpdateService';
import styles from './Settings.module.css';

const { Text } = Typography;

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
    </div>
  );
}

function UpdateSection() {
  const updateServiceState = useSnapshot(updateState);
  const [updateInfo, setUpdateInfo] = useState<string | null>(null);
  const [isLoadingUpdate, setIsLoadingUpdate] = useState(false);
  const [requestUpdate, setRequestUpdate] = useState(false);
  useEffect(() => {
    // make sure to reset download text when the downloaded flag changes
    if (requestUpdate && updateServiceState.updateDownloaded) {
      setIsLoadingUpdate(false);
    }
  }, [requestUpdate, updateServiceState.updateDownloaded]);

  const runUpdate = async () => {
    setIsLoadingUpdate(true);
    setUpdateInfo(null);
    setRequestUpdate(true);
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
      {requestUpdate && updateServiceState.updateDownloaded ? (
        <Alert
          type="success"
          message="Das Update wurde heruntergeladen. Es wird beim beenden der
        Anwendung automatisch installiert."
          className={styles.updateAlert}
        />
      ) : null}
      {requestUpdate &&
      isLoadingUpdate &&
      !updateServiceState.updateDownloaded ? (
        <Alert
          message="Der Download wurde gestartet. Das kann einen Moment dauern..."
          type="info"
        />
      ) : null}
      {requestUpdate &&
      !updateServiceState.updateDownloaded &&
      updateServiceState.isNewVersionAvailable ? (
        <Alert
          type="success"
          message="Das Update wurde heruntergeladen. Es wird beim beenden der
        Anwendung automatisch installiert."
          className={styles.updateAlert}
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
    </>
  );
}
