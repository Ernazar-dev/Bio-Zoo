import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Switch, Space, Popconfirm, Typography, message, Avatar, Row, Col } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { getTopics, createTopic, updateTopic, deleteTopic } from '../../../api/topics';
import { getCategories } from '../../../api/categories';
import { uploadFile } from '../../../api/materials';

const { Title } = Typography;

const AdminTopics: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();

  const { data: topics = [], isLoading } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  const save = useMutation({
    mutationFn: (values: any) => editing ? updateTopic(editing.id, values) : createTopic(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics-all'] }); setOpen(false); msg.success('Saqlandi'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Xato'),
  });

  const remove = useMutation({
    mutationFn: deleteTopic,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['topics-all'] }); msg.success("O'chirildi"); },
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('coverImage', url);
      msg.success('Rasm yuklandi');
    } catch { msg.error('Yuklashda xato'); }
    finally { setUploading(false); }
  };

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record ?? { title: '', description: '', categoryId: '', coverImage: '', has3DModel: false, order: 0 });
    setOpen(true);
  };

  const cols = [
    {
      title: '', key: 'image', width: 60,
      render: (r: any) => <Avatar shape="square" size={40} src={r.coverImage} icon={<PictureOutlined />} />,
    },
    { title: 'Mavzu', dataIndex: 'title', key: 'title' },
    { title: 'Kategoriya', key: 'cat', render: (r: any) => categories.find((c: any) => c.id === r.categoryId)?.name ?? '-' },
    { title: '3D', key: '3d', render: (r: any) => r.has3DModel ? '✅' : '—' },
    { title: 'Materiallar', key: 'm', render: (r: any) => r._count?.materials ?? 0 },
    { title: 'Testlar', key: 'q', render: (r: any) => r._count?.quizzes ?? 0 },
    {
      title: '', key: 'actions',
      render: (r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
          <Popconfirm title="O'chirilsinmi?" onConfirm={() => remove.mutate(r.id)} okText="Ha" cancelText="Yo'q">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
      {ctxHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Mavzular</Title>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()}>Qo'shish</Button>
      </div>
      <Table dataSource={topics} columns={cols} rowKey="id" loading={isLoading} />

      <Modal title={editing ? 'Tahrirlash' : 'Yangi mavzu'} open={open} onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))} confirmLoading={save.isPending} okText="Saqlash" width={760}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="categoryId" label="Kategoriya" rules={[{ required: true }]}>
                <Select options={categories.map((c: any) => ({ value: c.id, label: c.name }))} />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="title" label="Mavzu nomi" rules={[{ required: true }]}><Input /></Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Tavsif"><Input.TextArea rows={2} /></Form.Item>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="coverImage" label="Muqova rasmi URL">
                <Input placeholder="URL kiriting yoki fayl yuklang" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item label="Yoki rasm yuklang">
                <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
                {uploading && <span style={{ marginLeft: 8, color: '#1677ff' }}>Yuklanmoqda...</span>}
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="has3DModel" label="3D Model bormi?" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
            <Col xs={24} sm={12}>
              <Form.Item name="order" label="Tartib raqami"><Input type="number" /></Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTopics;
