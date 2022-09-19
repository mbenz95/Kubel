import { notification } from 'antd';
import semver from 'semver';
import { proxy } from 'valtio';

let init = false;

type UpdateState = {
  isUpdateAvailable: boolean;
  updateVersion: string | null;
  updateDownloaded: boolean;
  error: string | null;
  lastEvent: string;
};

type UpdateServiceState = {
  isNewVersionAvailable: boolean;
  currentVersion: string;
  updateVersion: string | null;
  error: string | null;
  updateDownloaded: boolean;
  lastEvent: string;
};

export const updateState = proxy<UpdateServiceState>({
  isNewVersionAvailable: false,
  currentVersion: '',
  updateVersion: null,
  error: null,
  updateDownloaded: false,
  lastEvent: 'none',
});

export async function initUpdateService() {
  if (init) return;
  init = true;

  updateState.currentVersion = await loadVersion();

  window.electron.ipcRenderer.on('updater-info', (info) => {
    const updateInfo = info as UpdateState;
    updateState.error = updateInfo.error;
    updateState.updateVersion = updateInfo.updateVersion;
    updateState.updateDownloaded = updateInfo.updateDownloaded;
    updateState.lastEvent = updateInfo.lastEvent;
    if (updateInfo.isUpdateAvailable && updateInfo.updateVersion != null) {
      const hasNewVersion = semver.gt(
        updateInfo.updateVersion,
        updateState.currentVersion
      );
      updateState.isNewVersionAvailable = hasNewVersion;

      // show notification
      if (
        hasNewVersion &&
        updateInfo.updateVersion != null &&
        updateInfo.lastEvent === 'update-downloaded'
      ) {
        openNotification(updateState.updateVersion ?? '?');
      }
    }
  });
  await window.electron.ipcRenderer.invoke('checkUpdate');
}

async function loadVersion(): Promise<string> {
  const currentVersion = await window.electron.ipcRenderer.invoke('getVersion');
  return currentVersion;
}

function openNotification(version: string) {
  notification.open({
    message: 'Update Verfügbar!',
    description: `Das neue Update auf Version ${version} wurde heruntergeladen. Starten Sie die Anwendung neu um das Update zu intallieren.`,
  });
}
