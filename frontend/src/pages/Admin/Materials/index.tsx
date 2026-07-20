import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message, Tag, Upload, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from "@ant-design/icons";
import { createMaterial, updateMaterial, deleteMaterial, uploadFile } from '../../../api/materials';
import { getTopics } from '../../../api/topics';
import { getMaterials } from '../../../api/materials';

const { Title } = Typography;

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  TEXT: { label: 'Teoriyalıq (tekst)', color: 'purple' },
  DOCUMENT: { label: 'Teoriyalıq (hujjet)', color: 'red' },
  PRESENTATION: { label: 'Prezentaciya', color: 'geekblue' },
  INFOGRAPHIC: { label: 'Infografika', color: 'magenta' },
  IMAGE: { label: 'Súwret', color: 'green' },
  VIDEO: { label: 'Video', color: 'blue' },
  MODEL_3D: { label: '3D Model', color: 'orange' },
};

const AdminMaterials: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();
  const watchType = Form.useWatch('type', form);

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: materials = [], isLoading } = useQuery({
    queryKey: ['materials', selectedTopic],
    queryFn: () => getMaterials(selectedTopic),
    enabled: !!selectedTopic,
  });

  const save = useMutation({
    mutationFn: (values: any) => editing ? updateMaterial(editing.id, values) : createMaterial(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); setOpen(false); msg.success('Saqlandı'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Qátelik'),
  });

  const remove = useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['materials'] }); msg.success("Óshirildi"); },
  });

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('url', url);
      msg.success('Fayl júklendi');
    } catch { msg.error('Júklewde qátelik'); }
    finally { setUploading(false); }
  };

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record ?? { topicId: selectedTopic, type: 'DOCUMENT', title: '', content: '', url: '', order: 0 });
    setOpen(true);
  };

  const cols = [
    { title: 'Túr', key: 'type', render: (r: any) => <Tag color={TYPE_LABELS[r.type]?.color}>{TYPE_LABELS[r.type]?.label}</Tag> },
    { title: 'Sarlawha', dataIndex: 'title', key: 'title' },
    { title: 'Tártip', dataIndex: 'order', key: 'order', width: 80 },
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
        <Title level={3} style={{ margin: 0 }}>Materiallar</Title>
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

      {selectedTopic
        ? <Table dataSource={materials} columns={cols} rowKey="id" loading={isLoading} />
        : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Tema tañlań</div>
      }

      <Modal title={editing ? 'Redaktorlaw' : 'Jaña material'} open={open} onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))} confirmLoading={save.isPending} okText="Saqlaw" width={760}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="topicId" label="Tema" rules={[{ required: true }]}>
                <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="type" label="Túr" rules={[{ required: true }]}>
                <Select options={Object.entries(TYPE_LABELS).map(([v, { label }]) => ({ value: v, label }))} />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="title" label="Sarlawha" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item name="order" label="Tártip"><Input type="number" /></Form.Item>
            </Col>
          </Row>
          {(watchType === 'TEXT') && (
            <Form.Item name="content" label="Tekst"><Input.TextArea rows={5} /></Form.Item>
          )}
          {(watchType === 'IMAGE' || watchType === 'INFOGRAPHIC' || watchType === 'VIDEO' || watchType === 'MODEL_3D' || watchType === 'DOCUMENT' || watchType === 'PRESENTATION') && (
            <Row gutter={16}>
              <Col xs={24} sm={14}>
                <Form.Item name="url" label="URL">
                  <Input placeholder="URL kiritiń yamasa fayl júkleń" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={10}>
                <Form.Item label={`${
                  watchType === 'IMAGE' ? 'Súwret'
                  : watchType === 'INFOGRAPHIC' ? 'Infografika (súwret)'
                  : watchType === 'VIDEO' ? 'Video'
                  : watchType === 'MODEL_3D' ? '3D fayl (.glb)'
                  : watchType === 'PRESENTATION' ? 'Prezentaciya (.pptx/.pdf)'
                  : 'Hujjet'} júklew`}>
                  <Upload
                    beforeUpload={(file) => {
                      handleUploadFile(file);
                      return false;
                    }}
                    showUploadList={false}
                    accept={
                      (watchType === 'IMAGE' || watchType === 'INFOGRAPHIC') ? 'image/*' :
                      watchType === 'VIDEO' ? 'video/*' :
                      watchType === 'MODEL_3D' ? '.glb,.gltf' :
                      watchType === 'PRESENTATION' ? '.ppt,.pptx,.pdf' :
                      '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar'
                    }
                  >
                    <Button icon={<UploadOutlined />} loading={uploading}>
                      Fayl tañlaw
                    </Button>
                  </Upload>
                </Form.Item>
              </Col>
            </Row>
          )}
        </Form>
      </Modal>
    </div>
  );
};

export default AdminMaterials;
