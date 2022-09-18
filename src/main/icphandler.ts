import { ipcMain, app } from 'electron';
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

  try {
    await access(targetDataFile);
  } catch {
    console.log(
      ` No data file found, copying ${initialDataFile} to ${targetDataFile}`
    );
    try {
      await copyFile(initialDataFile, targetDataFile);
    } catch (err: any) {
      error.error = err;
    }
  }

  const initialCategoriesFile = path.join(appResourceDir, 'categories.json');
  const targetCategoriesFile = path.join(kubelDataDir, 'categories.json');
  try {
    await access(targetCategoriesFile);
  } catch {
    console.log(
      ` No categories file found, copying ${initialDataFile} to ${targetCategoriesFile}`
    );
    try {
      await copyFile(
        initialCategoriesFile,
        path.join(kubelDataDir, 'categories.json')
      );
    } catch (err) {
      error.error = err;
    }
  }
})();

export default function setupIcpHandler() {
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
}
