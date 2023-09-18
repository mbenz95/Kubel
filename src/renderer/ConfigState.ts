import { proxy } from 'valtio';

export type Config = {
  personlist?: {
    order?: 'name' | 'birthday';
    orderdir?: 'asc' | 'desc';
  },
  openPdfAfterSave: boolean
};

export const config = proxy<Config>({ openPdfAfterSave: true });

export async function loadConfig(): Promise<boolean> {
  const result: Config | { error: string } =
    await window.electron.ipcRenderer.invoke('loadfile', 'config.json');
  if ('error' in result) {
    return false;
  }
  config.personlist = result.personlist;
  config.openPdfAfterSave = result.openPdfAfterSave ?? true;
  return true;
}

export async function saveConfig() {
  const data = JSON.stringify(config, null, 2);
  await window.electron.ipcRenderer.invoke('savefile', 'config.json', data);
}

/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
export function setPersonListOrder(order?: string, orderDir?: string) {
  if (order == null && orderDir == null) return;
  config.personlist ??= {};

  if (order != null) {
    if (order === 'name' || order === 'birthday') {
      config.personlist!.order = order;
    } else {
      console.log(
        `Error, got value for person list order ${order} but it is not allowed`
      );
    }
  }
  if (orderDir != null) {
    if (orderDir === 'asc' || orderDir === 'desc') {
      config.personlist!.orderdir = orderDir;
    } else {
      console.log(
        `Error, got value for person list order direction ${orderDir} but it is not allowed`
      );
    }
  }
}
