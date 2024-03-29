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
    <div style={{marginTop: "100px", marginBottom: "48px"}}>
      <Typography.Title level={3}>Notizen</Typography.Title>
      <textarea
        style={{ width: '100%', font: '14pt large' }}
        value={note}
        rows={20}
        onChange={updateNodeText}
      />
    </div>
  );
}
