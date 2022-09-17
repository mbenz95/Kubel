import { Button, Form, Input, List, Modal, Popconfirm, Spin } from 'antd';
import 'antd/dist/antd.css';
import { Link } from 'react-router-dom';
import { PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { CategoryData, Data, emptyPerson, Person } from './models';

const AddPersonModal = ({
  isVisible,
  onCancel,
  onSave,
  isSaving,
}: {
  isVisible: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}) => {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [form] = Form.useForm();

  const clear = () => {
    form.resetFields();
    setName('');
    setError(false);
  };

  return (
    <Modal
      title="Person hinzufügen"
      open={isVisible}
      confirmLoading={isSaving}
      onOk={() => {
        if (name.trim() === '') setError(true);
        else {
          const currName = name;
          clear();
          onSave(currName);
        }
      }}
      onCancel={() => {
        clear();
        onCancel();
      }}
    >
      <Form
        form={form}
        name="basic"
        labelCol={{ span: 8 }}
        wrapperCol={{ span: 16 }}
        autoComplete="off"
      >
        <Form.Item
          label="Name"
          name="name"
          help={error ? 'Namen eingeben' : undefined}
          validateStatus={error ? 'error' : 'validating'}
        >
          <Input onChange={(val) => setName(val.target.value)} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

const EntryDeleteButton = ({ onDelete }: { onDelete: () => Promise<void> }) => {
  return (
    <Popconfirm
      title="Wollen Sie diese Person wirklich löschen?"
      onConfirm={onDelete}
      onCancel={() => {}}
      okText="Weg mit dem!"
      cancelText="Noi doch it!"
    >
      <Button style={{ padding: '0' }} type="text" size="small">
        Löschen
      </Button>
    </Popconfirm>
  );
};

export default function PeopleList({
  data,
  categoryData,
  onDeletePerson,
  onAddPerson,
  isSaving,
}: {
  data: Data | undefined;
  categoryData: CategoryData | undefined;
  onDeletePerson: (id: string) => Promise<void>;
  onAddPerson: (person: Person) => Promise<void>;
  isSaving: boolean;
}) {
  const [isNewModalVisible, setIsNewModalVisible] = useState(false);
  if (data == null || categoryData == null) {
    return (
      <div style={{ padding: '40px' }}>
        <Spin size="large" />
        <span
          style={{
            fontSize: 'x-large',
            marginLeft: '20px',
            display: 'inline-block',
          }}
        >
          Lädt, bitte warten...
        </span>
      </div>
    );
  }

  const handleAddPersonButton = () => {
    setIsNewModalVisible(true);
  };
  const handleAddPerson = async (name: string) => {
    const newPerson = emptyPerson(name, categoryData);
    await onAddPerson(newPerson);
    setIsNewModalVisible(false);
  };

  const people = Object.entries(data.people);
  return (
    <>
      <div className="hiddenPrint">
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleAddPersonButton}
          style={{ marginTop: '10px', marginBottom: '20px' }}
        >
          Neue Person hinzufügen
        </Button>
      </div>
      <List
        style={{ backgroundColor: 'white' }}
        bordered
        dataSource={people}
        locale={{ emptyText: 'Keine Personen vorhanden' }}
        renderItem={([id, person]: [string, Person]) => (
          <List.Item
            actions={[
              <EntryDeleteButton onDelete={async () => onDeletePerson(id)} />,
            ]}
          >
            <List.Item.Meta
              title={<Link to={`/person/${id}`}>{person.name}</Link>}
            />
          </List.Item>
        )}
      />
      <div style={{ height: '100px' }}> </div>
      <AddPersonModal
        isVisible={isNewModalVisible}
        isSaving={isSaving}
        onCancel={() => {
          setIsNewModalVisible(false);
        }}
        onSave={(name: string) => {
          handleAddPerson(name);
        }}
      />
    </>
  );
}
