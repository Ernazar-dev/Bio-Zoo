import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message,
  Tag, InputNumber, Alert,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ExperimentOutlined } from '@ant-design/icons';
import {
  getInteractivesByTopic, createInteractive, updateInteractive, deleteInteractive,
  getAllowedHosts, extractEmbedUrl,
} from '../../../api/interactives';
import { getTopics } from '../../../api/topics';
import type { Interactive } from '../../../types';

const { Title, Text } = Typography;

const KIND_OPTIONS = [
  { value: 'MODEL_3D', label: '3D model (Sketchfab)' },
  { value: 'SIMULATION', label: 'Simulyaciya (PhET, JavaLab...)' },
  { value: 'VIRTUAL_LAB', label: 'Virtual laboratoriya' },
];
const KIND_TAG: Record<string, { color: string; label: string }> = {
  MODEL_3D: { color: 'geekblue', label: '3D model' },
  SIMULATION: { color: 'green', label: 'Simulyaciya' },
  VIRTUAL_LAB: { color: 'purple', label: 'Virtual lab' },
};

const AdminInteractives: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Interactive | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();
  const watchEmbedRaw = Form.useWatch('embedRaw', form);

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: allowedHosts = [] } = useQuery({ queryKey: ['interactive-hosts'], queryFn: getAllowedHosts });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['interactives', selectedTopic],
    queryFn: () => getInteractivesByTopic(selectedTopic),
    enabled: !!selectedTopic,
  });

  // Qo'yilgan matndan (iframe kodi yoki havola) embed URL ni jonli ajratish
  const previewUrl = useMemo(() => extractEmbedUrl(watchEmbedRaw || ''), [watchEmbedRaw]);
  const previewValid = useMemo(() => {
    if (!previewUrl) return false;
    try {
      const u = new URL(previewUrl);
      const host = u.hostname.toLowerCase();
      return u.protocol === 'https:' && allowedHosts.some(d => host === d || host.endsWith('.' + d));
    } catch { return false; }
  }, [previewUrl, allowedHosts]);

  const save = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        topicId: values.topicId,
        kind: values.kind,
        title: values.title,
        embedUrl: extractEmbedUrl(values.embedRaw),
        description: values.description || null,
        order: values.order || 0,
      };
      return editing ? updateInteractive(editing.id, payload) : createInteractive(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interactives'] }); setOpen(false); msg.success('Saqlandı'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Qátelik'),
  });

  const remove = useMutation({
    mutationFn: deleteInteractive,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['interactives'] }); msg.success("Óshirildi"); },
  });

  const openModal = (record?: Interactive) => {
    setEditing(record ?? null);
    form.setFieldsValue({
      topicId: record?.topicId ?? selectedTopic,
      kind: record?.kind ?? 'MODEL_3D',
      title: record?.title ?? '',
      embedRaw: record?.embedUrl ?? '',
      description: record?.description ?? '',
      order: record?.order ?? 0,
    });
    setOpen(true);
  };

  const cols = [
    {
      title: 'Túri', dataIndex: 'kind', key: 'kind', width: 130,
      render: (v: string) => <Tag color={KIND_TAG[v]?.color}>{KIND_TAG[v]?.label || v}</Tag>,
    },
    { title: 'Sarlawha', dataIndex: 'title', key: 'title' },
    {
      title: 'Deregi', dataIndex: 'embedUrl', key: 'embedUrl',
      render: (v: string) => { try { return new URL(v).hostname; } catch { return v; } },
    },
    { title: 'Tártip', dataIndex: 'order', key: 'order', width: 80 },
    {
      title: '', key: 'actions', width: 100,
      render: (r: Interactive) => (
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
        <Title level={3} style={{ margin: 0 }}><ExperimentOutlined /> Interaktiv resurslar</Title>
        <Space>
          <Select
            placeholder="Tema tañlań"
            style={{ width: 280 }}
            value={selectedTopic || undefined}
            onChange={setSelectedTopic}
            options={topics.map((t: any) => ({ value: t.id, label: t.title }))}
            showSearch
            optionFilterProp="label"
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()} disabled={!selectedTopic}>
            Qosıw
          </Button>
        </Space>
      </div>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Biypul derekler"
        description={
          <span>
            3D modeller: <b>sketchfab.com</b> (Embed tugmasi → kodni nusxalang) · Simulyaciyalar: <b>phet.colorado.edu</b>, <b>javalab.org</b>, <b>biologysimulations.com</b> — bet siltewin yamasa embed kodın usı jerge qoyıń.
          </span>
        }
      />

      {selectedTopic
        ? <Table dataSource={items} columns={cols} rowKey="id" loading={isLoading} />
        : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Tema tañlań</div>
      }

      <Modal
        title={editing ? 'Interaktiv resurstı redaktorlaw' : 'Jaña interaktiv resurs'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))}
        confirmLoading={save.isPending}
        okText="Saqlaw"
        width={640}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="topicId" label="Tema" rules={[{ required: true, message: 'Temanı tañlań' }]}>
            <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="kind" label="Qaysı bólimde shıqsın?" rules={[{ required: true }]}>
            <Select options={KIND_OPTIONS} />
          </Form.Item>
          <Form.Item name="title" label="Sarlawha" rules={[{ required: true, message: 'Sarlawha kiritiń' }]}>
            <Input placeholder="Mısalı: Eukariot kletka — 3D model" />
          </Form.Item>
          <Form.Item
            name="embedRaw"
            label="Embed kod yamasa siltew"
            rules={[{ required: true, message: 'Embed kod yamasa siltewdi qoyıń' }]}
            extra="Sketchfab'dan tolıq <iframe> kodın yamasa model betiniń siltewin qoysańız boladı — kerekli bólimin ózim ajıratıp alaman."
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder={'<div class="sketchfab-embed-wrapper"> <iframe ... src="https://sketchfab.com/models/.../embed"> ...\nyoki\nhttps://sketchfab.com/3d-models/...'}
            />
          </Form.Item>

          {previewUrl && (
            previewValid ? (
              <div style={{ marginBottom: 16 }}>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 6 }}>
                  Ko'rinish: {previewUrl}
                </Text>
                <iframe
                  title="Oldindan ko'rish"
                  src={previewUrl}
                  style={{ width: '100%', aspectRatio: '16 / 9', border: '1px solid var(--line)', borderRadius: 8 }}
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  allowFullScreen
                />
              </div>
            ) : (
              <Alert
                type="warning"
                showIcon
                style={{ marginBottom: 16 }}
                message="Siltew tabılmadı yamasa bul domenge ruxsat joq"
                description={`Ruxsat etilgen saytlar: ${allowedHosts.join(', ')}`}
              />
            )
          )}

          <Form.Item name="description" label="Qısqasha túsindirme (qálewli)">
            <Input placeholder="Studentke kórsetpe: nege itibar bersin" />
          </Form.Item>
          <Form.Item name="order" label="Tártip">
            <InputNumber min={0} style={{ width: 120 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminInteractives;
