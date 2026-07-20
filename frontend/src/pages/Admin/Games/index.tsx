import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message, Radio, Upload, Tag, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { getGames, createGame, updateGame, deleteGame } from '../../../api/games';
import { getTopics } from '../../../api/topics';
import { uploadFile } from '../../../api/materials';

const { Title } = Typography;

const AdminGames: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();
  const watchPlatform = Form.useWatch('platform', form);

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: allLinks = [], isLoading } = useQuery({
    queryKey: ['games', selectedTopic],
    queryFn: () => getGames(selectedTopic),
    enabled: !!selectedTopic,
  });
  // O'yin havolalari (platform='GAME') alohida "O'yinlar" sahifasida boshqariladi
  const games = allLinks.filter((g: any) => g.platform !== 'GAME');

  const save = useMutation({
    mutationFn: (values: any) => editing ? updateGame(editing.id, values) : createGame(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['games'] }); setOpen(false); msg.success('Saqlandı'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Qátelik'),
  });

  const remove = useMutation({
    mutationFn: deleteGame,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['games'] }); msg.success("Óshirildi"); },
  });

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('url', url);
      msg.success('Video fayl júklendi');
    } catch {
      msg.error('Video júklewde qátelik júz berdi');
    } finally {
      setUploading(false);
    }
  };

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record ?? { topicId: selectedTopic, title: '', url: '', description: '', platform: 'YOUTUBE' });
    setOpen(true);
  };

  const cols = [
    { title: 'Video atı', dataIndex: 'title', key: 'title' },
    {
      title: 'Túri',
      dataIndex: 'platform',
      key: 'platform',
      render: (p: string) => (
        <Tag color={p === 'FILE' ? 'blue' : 'green'}>
          {p === 'FILE' ? 'Video fayl' : 'YouTube'}
        </Tag>
      ),
    },
    { title: 'URL / Fayl', dataIndex: 'url', key: 'url', ellipsis: true, render: (u: string) => <a href={u} target="_blank" rel="noopener noreferrer">{u}</a> },
    {
      title: '', key: 'actions',
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Video sabaqlar</Title>
        <Space>
          <Select placeholder="Tema tañlań" style={{ width: 280 }} value={selectedTopic || undefined} onChange={setSelectedTopic}
            options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()} disabled={!selectedTopic}>Qosıw</Button>
        </Space>
      </div>
      {selectedTopic
        ? <Table dataSource={games} columns={cols} rowKey="id" loading={isLoading} />
        : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Tema tañlań</div>
      }

      <Modal
        title={editing ? "Video sabaqtı redaktorlaw" : "Jaña video sabaq qosıw"}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))}
        confirmLoading={save.isPending || uploading}
        okText="Saqlaw"
        width={680}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="topicId" label="Tema" rules={[{ required: true }]}>
                <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="title" label="Video atı" rules={[{ required: true, message: 'Video atın kiritiń' }]}><Input /></Form.Item>
            </Col>
          </Row>

          <Form.Item name="platform" label="Video deregi (Túri)" rules={[{ required: true }]}>
            <Radio.Group onChange={() => form.setFieldValue('url', '')}>
              <Radio.Button value="YOUTUBE">YouTube siltewi</Radio.Button>
              <Radio.Button value="FILE">Kompyuterden júklew (.mp4, .webm)</Radio.Button>
            </Radio.Group>
          </Form.Item>

          {watchPlatform === 'YOUTUBE' ? (
            <Form.Item
              name="url"
              label="YouTube video siltewi (URL)"
              rules={[
                { required: true, message: 'YouTube siltewin kiritiń' },
                { type: 'url', message: 'Durıs URL kiritiń' }
              ]}
            >
              <Input placeholder="https://www.youtube.com/watch?v=..." />
            </Form.Item>
          ) : (
            <Form.Item label="Video faylın júkleń" required>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Upload
                  beforeUpload={(file) => {
                    handleUploadFile(file);
                    return false;
                  }}
                  maxCount={1}
                  showUploadList={false}
                  accept="video/*"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>
                    {uploading ? 'Júklenbekte...' : 'Video tañlaw'}
                  </Button>
                </Upload>
                <Form.Item
                  name="url"
                  noStyle
                  rules={[{ required: true, message: 'Iltimos, video fayl júkleń' }]}
                >
                  <Input placeholder="Júklengen fayl siltewi" disabled />
                </Form.Item>
              </Space>
            </Form.Item>
          )}

          <Form.Item name="description" label="Tariyp (qálewli)"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminGames;
