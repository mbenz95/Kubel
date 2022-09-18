import { createRoot } from 'react-dom/client';
import App from './App';

declare module 'valtio' {
  function useSnapshot<T extends object>(p: T): T;
}

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
});
// window.electron.ipcRenderer.sendMessage('ipc-example', ['ping']);
