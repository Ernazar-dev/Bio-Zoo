import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RocketOutlined, LinkOutlined } from '@ant-design/icons';
import { getGames, createGame, updateGame, deleteGame } from '../../../api/games';
import { getTopics } from '../../../api/topics';

const { Title, Text } = Typography;

/* O'yin havolalari GameLink jadvalida platform='GAME' bilan saqlanadi —
   shu bilan video darslardan (YOUTUBE/FILE) ajratiladi */
const AdminPlayGames: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: allLinks = [], isLoading } = useQuery({
    queryKey: ['games', selectedTopic],
    queryFn: () => getGames(selectedTopic),
    enabled: !!selectedTopic,
  });
  const games = allLinks.filter((g: any) => g.platform === 'GAME');

  const save = useMutation({
    mutationFn: (values: any) =>
      editing
        ? updateGame(editing.id, { ...values, platform: 'GAME' })
        : createGame({ ...values, platform: 'GAME' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['games'] }); setOpen(false); msg.success('Saqlandı'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Qátelik'),
  });

  const remove = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['games'] }); msg.success("Óshirildi"); },
  });

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record ?? { topicId: selectedTopic, title: '', url: '', description: '' });
    setOpen(true);
  };

  const cols = [
    { title: "Oyin atı", dataIndex: 'title', key: 'title' },
    {
      title: 'Siltew (URL)',
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (u: string) => (
        <a href={u} target="_blank" rel="noopener noreferrer">
          <LinkOutlined style={{ marginRight: 6 }} />{u}
        </a>
      ),
    },
    {
      title: 'Tariyp',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (d: string) => d || <Text type="secondary">—</Text>,
    },
    {
      title: '', key: 'actions', width: 100,
      render: (r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
          <Popconfirm title="Óshirilsin be?" onConfirm={() => remove.mutate(r.id)} okText="Awa" cancelText="Yaq">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
      {ctxHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}><RocketOutlined style={{ marginRight: 8 }} />Oyinlar</Title>
        <Space>
          <Select placeholder="Tema tañlań" style={{ width: 280 }} value={selectedTopic || undefined} onChange={setSelectedTopic}
            options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()} disabled={!selectedTopic}>Qosıw</Button>
        </Space>
      </div>
      <Text type="secondary" style={{ display: 'block', marginBottom: 20 }}>
        Wordwall, Kahoot, Quizizz sıyaqlı saytlarda tayarlanǵan oyin siltewin usı jerge qoyıń — oqıwshılar tema ishendegi "Oyinlar" bóliminen bir túyme arqalı ótedi.
      </Text>
      {selectedTopic
        ? <Table dataSource={games} columns={cols} rowKey="id" loading={isLoading} />
        : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Tema tañlań</div>
      }

      <Modal
        title={editing ? "Oyindi redaktorlaw" : "Jaña oyin qosıw"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))}
        confirmLoading={save.isPending}
        okText="Saqlaw"
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="topicId" label="Tema" rules={[{ required: true }]}>
            <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
          </Form.Item>

          <Form.Item name="title" label="Oyin atı" rules={[{ required: true, message: "Oyin atın kiritiń" }]}>
            <Input placeholder="Mısalı: Súyekler atın tap!" />
          </Form.Item>

          <Form.Item
            name="url"
            label="Oyin siltewi (URL)"
            rules={[
              { required: true, message: "Oyin siltewin kiritiń" },
              { type: 'url', message: "Durıs URL kiritiń (https://... penen baslansın)" },
            ]}
            extra="Wordwall, Kahoot, Quizizz hám usı sıyaqlı sayttan alınǵan siltew"
          >
            <Input placeholder="https://wordwall.net/resource/..." />
          </Form.Item>

          <Form.Item name="description" label="Tariyp (qálewli)">
            <Input.TextArea rows={2} placeholder="Oyin haqqında qısqasha maǵlıwmat" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminPlayGames;
