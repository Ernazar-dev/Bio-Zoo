import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message,
  InputNumber, Upload, Image,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import {
  getInfographicsByTopic, createInfographic, updateInfographic, deleteInfographic,
} from '../../../api/infographics';
import { uploadFile } from '../../../api/materials';
import { getTopics } from '../../../api/topics';
import type { Infographic } from '../../../types';

const { Title } = Typography;

const AdminInfographics: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Infographic | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();
  const watchImageUrl = Form.useWatch('imageUrl', form);

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['infographics', selectedTopic],
    queryFn: () => getInfographicsByTopic(selectedTopic),
    enabled: !!selectedTopic,
  });

  const save = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        topicId: values.topicId,
        title: values.title,
        imageUrl: values.imageUrl,
        order: values.order || 0,
      };
      return editing ? updateInfographic(editing.id, payload) : createInfographic(payload);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['infographics'] }); setOpen(false); msg.success('Saqlandi'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Xato'),
  });

  const remove = useMutation({
    mutationFn: deleteInfographic,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['infographics'] }); msg.success("O'chirildi"); },
  });

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('imageUrl', url);
      msg.success('Rasm yuklandi');
    } catch { msg.error('Yuklashda xato'); }
    finally { setUploading(false); }
  };

  const openModal = (record?: Infographic) => {
    setEditing(record ?? null);
    form.setFieldsValue({
      topicId: record?.topicId ?? selectedTopic,
      title: record?.title ?? '',
      imageUrl: record?.imageUrl ?? '',
      order: record?.order ?? 0,
    });
    setOpen(true);
  };

  const cols = [
    {
      title: 'Rasm', key: 'image', width: 110,
      render: (r: Infographic) => r.imageUrl
        ? <Image src={r.imageUrl} width={80} height={54} style={{ objectFit: 'cover', borderRadius: 6 }} />
        : <span style={{ color: '#999' }}>—</span>,
    },
    { title: 'Sarlavha', dataIndex: 'title', key: 'title' },
    { title: 'Tartib', dataIndex: 'order', key: 'order', width: 80 },
    {
      title: '', key: 'actions', width: 100,
      render: (r: Infographic) => (
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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <Title level={3} style={{ margin: 0 }}>Infografikalar</Title>
        <Space>
          <Select
            placeholder="Mavzu tanlang"
            style={{ width: 280 }}
            value={selectedTopic || undefined}
            onChange={setSelectedTopic}
            options={topics.map((t: any) => ({ value: t.id, label: t.title }))}
            showSearch
            optionFilterProp="label"
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()} disabled={!selectedTopic}>
            Qo'shish
          </Button>
        </Space>
      </div>

      {selectedTopic
        ? <Table dataSource={items} columns={cols} rowKey="id" loading={isLoading} />
        : <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>Mavzu tanlang</div>
      }

      <Modal
        title={editing ? 'Infografikani tahrirlash' : 'Yangi infografika'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))}
        confirmLoading={save.isPending}
        okText="Saqlash"
        width={520}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="topicId" label="Mavzu" rules={[{ required: true, message: 'Mavzuni tanlang' }]}>
            <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" />
          </Form.Item>
          <Form.Item name="title" label="Sarlavha" rules={[{ required: true, message: 'Sarlavha kiriting' }]}>
            <Input placeholder="Masalan: Zoologiya — mental karta" />
          </Form.Item>
          <Form.Item
            name="imageUrl"
            label="Infografika rasmi (mental karta)"
            rules={[{ required: true, message: 'Rasm yuklang' }]}
          >
            <Input hidden />
          </Form.Item>
          <div style={{ marginTop: -12, marginBottom: 16 }}>
            <Upload
              beforeUpload={(file) => { handleUpload(file); return false; }}
              showUploadList={false}
              accept="image/*"
            >
              <Button icon={<UploadOutlined />} loading={uploading}>Rasm tanlash</Button>
            </Upload>
            {watchImageUrl && (
              <div style={{ marginTop: 12 }}>
                <Image src={watchImageUrl} style={{ maxHeight: 220, borderRadius: 8 }} />
              </div>
            )}
          </div>
          <Form.Item name="order" label="Tartib">
            <InputNumber min={0} style={{ width: 120 }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminInfographics;
