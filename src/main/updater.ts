import { autoUpdater, UpdateCheckResult } from 'electron-updater';
import log from 'electron-log';
import { app, BrowserWindow } from 'electron';

let isInit = false;

export const updateState: {
  isUpdateAvailable: boolean;
  updateVersion: string | null;
  updateDownloaded: boolean;
  error: string | null;
  lastEvent: string;
} = {
  isUpdateAvailable: false,
  updateVersion: null,
  updateDownloaded: false,
  error: null,
  lastEvent: 'none',
};

export function initUpdater(win: BrowserWindow) {
  if (isInit) return;
  isInit = true;
  log.transports.file.level = 'info';
  autoUpdater.logger = log;

  log.info('updater initialized');
  autoUpdater.on('error', (err) => {
    log.error(err);
    updateState.error = `${err.name}: ${err.message}`;
    updateState.lastEvent = 'error';
    win.webContents.send('updater-info', updateState);
  });
  autoUpdater.on('update-available', (info) => {
    log.info(`Update available: ${info.version}`);
    updateState.isUpdateAvailable = true;
    updateState.updateVersion = info.version;
    updateState.lastEvent = 'update-available';
    win.webContents.send('updater-info', updateState);
  });
  autoUpdater.on('update-downloaded', (info) => {
    log.info(`Update downloaded: ${info.version}`);
    updateState.updateDownloaded = true;
    updateState.lastEvent = 'update-downloaded';
    win.webContents.send('updater-info', updateState);
  });
}

export function checkUpdate(): Promise<UpdateCheckResult | null> {
  log.info('Checking for update (no-install)');
  resetUpdateState();
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  return autoUpdater.checkForUpdates();
}

export async function runUpdate(): Promise<UpdateCheckResult | null> {
  if (!isInit) {
    throw new Error('Updater not initialized');
  }
  if (!app.isPackaged) {
    log.error('Tried to update but application is not packaged!');
    return null;
  }
  resetUpdateState();
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  return autoUpdater.checkForUpdatesAndNotify();
}

function resetUpdateState() {
  updateState.isUpdateAvailable = false;
  updateState.updateDownloaded = false;
  updateState.updateVersion = null;
  updateState.error = null;
}
