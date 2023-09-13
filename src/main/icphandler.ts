import { ipcMain, app, dialog, BrowserWindow } from 'electron';
import { access, mkdir, readFile, writeFile, copyFile } from 'fs/promises';
import path from 'path';
import { checkUpdate, runUpdate } from './updater';

const appDataDir =
  process.env.APPDATA ||
  (process.platform === 'darwin'
    ? `${process.env.HOME}/Library/Preferences`
    : `${process.env.HOME}/.local/share`);
const kubelDataDir = path.join(appDataDir, 'KuBel');

const error: any = {};
// create kubel dir in appdata if not exists and copy data and category file

let initialCategoriesFile: string
let targetCategoriesFile: string
(async () => {
  try {
    await access(kubelDataDir);
    // TODO: check await fs.lstat('test.txt').isDirectory()
  } catch {
    await mkdir(kubelDataDir);
  }

  const appResourceDir = app.isPackaged
    ? path.join(__dirname, '..', '..', 'resources')
    : path.join(__dirname, '..', '..', 'release', 'app', 'resources');

  const initialDataFile = path.join(appResourceDir, 'data.json');
  const targetDataFile = path.join(kubelDataDir, 'data.json');

  const configDefaultFile = path.join(appResourceDir, 'config.json');
  const configFile = path.join(kubelDataDir, 'config.json');

  initialCategoriesFile = path.join(appResourceDir, 'categories.json');
  targetCategoriesFile = path.join(kubelDataDir, 'categories.json');

  async function copyDefaultFile(dataFile: string, defaultFile: string) {
    try {
      await access(dataFile);
    } catch {
      console.log(`No data file found, copying ${defaultFile} to ${dataFile}`);
      try {
        await copyFile(defaultFile, dataFile);
      } catch (err: any) {
        error.error = err;
      }
    }
  }

  copyDefaultFile(targetDataFile, initialDataFile);
  copyDefaultFile(configFile, configDefaultFile);
  copyDefaultFile(targetCategoriesFile, initialCategoriesFile);
})();

export default function setupIcpHandler(mainWindow: BrowserWindow) {
  ipcMain.handle('loadfile', async (_event, file) => {
    try {
      const data = await readFile(path.join(kubelDataDir, file));
      return JSON.parse(data.toString());
    } catch {
      return { error: `could not read file: ${file} (pwd=${process.cwd()})` };
    }
  });

  ipcMain.handle('savefile', async (_event, file, data) => {
    try {
      let dataStr = data;
      if (typeof dataStr !== 'string') {
        dataStr = JSON.stringify(data, null, 2);
      }
      await writeFile(path.join(kubelDataDir, file), dataStr);
      return { success: true };
    } catch {
      return { error: `could not write file: ${file} (pwd=${process.cwd()})` };
    }
  });

  ipcMain.handle('loadConfig', async (_event) => {});

  ipcMain.handle('receiveError', async () => {
    return error;
  });

  ipcMain.handle('getVersion', async () => {
    if (app.isPackaged) {
      return app.getVersion();
    }
    return `Application is not packaged. Electron Version: ${app.getVersion()}`;
  });

  ipcMain.handle('checkUpdate', async () => {
    return checkUpdate();
  });

  ipcMain.handle('runUpdate', async () => {
    const info = await runUpdate();
    return info?.updateInfo;
  });

  ipcMain.handle('printToPdf', async (evnt, options) => {
    const saveSelection = await dialog.showSaveDialog({
      title: 'Wähle Datei',
      defaultPath: options.name,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    });
    if (!saveSelection.canceled && saveSelection.filePath != null) {
      console.log('Save destination ', saveSelection.filePath);
      const data = await evnt.sender.printToPDF({
        pageSize: 'A4',
      });
      await writeFile(saveSelection.filePath, data);
    }
  });
  
  ipcMain.handle('overwriteCategories', async (evnt, options) => {
    await copyFile(initialCategoriesFile, targetCategoriesFile);
    mainWindow.reload()
  })

}

