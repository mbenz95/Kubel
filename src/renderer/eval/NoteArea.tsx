import { Typography } from 'antd';
import { ChangeEvent } from 'react';
import { evalState } from 'renderer/eval/evalState';
import { useSnapshot } from 'valtio';

export default function NoteArea() {
  const { person } = useSnapshot(evalState);
  const note = person?.note ?? '';
  const updateNodeText = (e: ChangeEvent<HTMLTextAreaElement>) => {
    if (evalState.person != null) {
      evalState.person.note = e.target.value;
    }
  };
  return (
    <>
      <Typography.Title level={3}>Notizen</Typography.Title>
      <textarea
        style={{ width: '100%', font: '14pt large', marginBottom: '128px' }}
        value={note}
        rows={20}
        onChange={updateNodeText}
      />
    </>
  );
}
