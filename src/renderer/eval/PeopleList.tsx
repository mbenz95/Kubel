import {
  Button,
  Dropdown,
  Form,
  Input,
  List,
  MenuProps,
  Modal,
  Popconfirm,
  Select,
  Spin,
  Typography,
} from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { PlusOutlined, SortAscendingOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { saveConfig, config, setPersonListOrder } from 'renderer/ConfigState';
import { CategoryData, Data, emptyPerson, Person } from './models';
import styles from './PeopleList.module.css';

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

const EditPersonModal = ({
  name,
  isVisible,
  onCancel,
  onSave,
  isSaving,
}: {
  name: string;
  isVisible: boolean;
  onCancel: () => void;
  onSave: (name: string) => void;
  isSaving: boolean;
}) => {
  const [newName, setName] = useState(name);
  const [error, setError] = useState(false);
  const [form] = Form.useForm();
  useEffect(() => {
    // resets to initial value (requires force render or the form thing rest does not work)
    form.resetFields();
  }, [name, form]);

  const clear = () => {
    form.resetFields();
    setName('');
    setError(false);
  };
  return (
    <Modal
      forceRender
      title="Person Editieren"
      open={isVisible}
      confirmLoading={isSaving}
      onOk={() => {
        if (newName.trim() === '') setError(true);
        else {
          const currName = newName;
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
        initialValues={{ name }}
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
  const deleteConfirm = (e: React.MouseEvent | undefined) => {
    e?.stopPropagation();
    onDelete();
  };
  return (
    <Popconfirm
      title="Wollen Sie diese Person wirklich löschen?"
      onConfirm={deleteConfirm}
      onCancel={(e) => {
        e?.stopPropagation();
      }}
      okText="Weg mit dem!"
      cancelText="Noi doch it!"
    >
      <Button type="text" size="small" onClick={(e) => e.stopPropagation()}>
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
  onEditPerson,
  isSaving,
}: {
  data: Data | undefined;
  categoryData: CategoryData | undefined;
  onDeletePerson: (id: string) => Promise<void>;
  onAddPerson: (person: Person) => Promise<void>;
  onEditPerson: (id: string, name: string) => Promise<void>;
  isSaving: boolean;
}) {
  const [isNewModalVisible, setIsNewModalVisible] = useState(false);
  const [editModalId, setEditModalId] = useState<string | undefined>(undefined);
  const [currentSort, setSort] = useState('name');
  const navigation = useNavigate();
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
  const handleSortChanged = async (value: string) => {
    setPersonListOrder(value);
    await saveConfig();
    setSort(value);
  };
  const sort = [
    {
      label: 'Name',
      value: 'name',
    },
    {
      label: 'Geburtsdatum',
      value: 'birthday',
    },
  ];

  const people = Object.entries(data.people);
  const defaultDate = dayjs('0000-1-01');
  people.sort((p1, p2) => {
    if (currentSort === 'name') return p1[1].name.localeCompare(p2[1].name);
    if (currentSort === 'birthday') {
      const p1Birthday = dayjs(p1[1].birthday) ?? defaultDate;
      const p2Birthday = dayjs(p2[1].birthday) ?? defaultDate;
      return p1Birthday.diff(p2Birthday);
    }

    return 0;
  });
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
      <div className={styles.sortContainer}>
        <Select
          suffixIcon={<SortAscendingOutlined />}
          style={{ width: '150px' }}
          defaultValue="name"
          options={sort}
          onChange={handleSortChanged}
        />
      </div>
      <List
        style={{ backgroundColor: 'white' }}
        bordered
        dataSource={people}
        locale={{ emptyText: 'Keine Personen vorhanden' }}
        renderItem={([id, person]: [string, Person]) => (
          <List.Item
            className={styles.personListItem}
            onClick={() => navigation(`/person/${id}`)}
            actions={[
              <Button
                type="text"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setEditModalId(id);
                }}
              >
                Edit
              </Button>,
              <EntryDeleteButton
                onDelete={async () => {
                  onDeletePerson(id);
                }}
              />,
            ]}
          >
            <Typography.Text strong>{person.name}</Typography.Text>
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
      <EditPersonModal
        name={editModalId != null ? data.people[editModalId].name : ''}
        isVisible={editModalId != null}
        isSaving={isSaving}
        onCancel={() => {
          setEditModalId(undefined);
        }}
        onSave={(name: string) => {
          if (editModalId != null) {
            onEditPerson(editModalId, name);
            setEditModalId(undefined);
          }
        }}
      />
    </>
  );
}
