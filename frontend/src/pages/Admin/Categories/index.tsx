import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message, Avatar, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../../api/categories';
import { getSubjects } from '../../../api/subjects';
import { uploadFile } from '../../../api/materials';

const { Title } = Typography;

const AdminCategories: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();

  const { data = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('imageUrl', url);
      msg.success('Rasm yuklandi');
    } catch { msg.error('Yuklashda xato'); }
    finally { setUploading(false); }
  };

  const save = useMutation({
    mutationFn: (values: any) => editing ? updateCategory(editing.id, values) : createCategory(values),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); setOpen(false); msg.success('Saqlandi'); },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Xato'),
  });

  const remove = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['categories'] }); msg.success("O'chirildi"); },
  });

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record
      ? { ...record, subjectId: record.subjectId ?? undefined }
      : { name: '', imageUrl: '', order: 0, subjectId: subjects[0]?.id });
    setOpen(true);
  };

  const cols = [
    {
      title: '', key: 'image', width: 60,
      render: (r: any) => <Avatar shape="square" size={40} src={r.imageUrl} icon={<PictureOutlined />} />,
    },
    { title: 'Nomi', dataIndex: 'name', key: 'name' },
    {
      title: 'Fan', key: 'subject',
      render: (r: any) => r.subject ? <Tag color="green">{r.subject.name}</Tag> : <Tag>—</Tag>,
    },
    { title: 'Mavzular', key: 'count', render: (r: any) => r._count?.topics ?? 0 },
    { title: 'Tartib', dataIndex: 'order', key: 'order' },
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
        <Title level={3} style={{ margin: 0 }}>Kategoriyalar</Title>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()}>Qo'shish</Button>
      </div>
      <Table dataSource={data} columns={cols} rowKey="id" loading={isLoading} />

      <Modal title={editing ? 'Tahrirlash' : "Yangi kategoriya"} open={open} onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))} confirmLoading={save.isPending} okText="Saqlash">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Nomi" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="subjectId" label="Fan" rules={[{ required: true, message: 'Fan tanlang' }]}>
            <Select
              placeholder="Fan tanlang"
              options={subjects.map(s => ({ label: s.name, value: s.id }))}
            />
          </Form.Item>
          <Form.Item name="imageUrl" label="Fon rasmi URL">
            <Input placeholder="URL kiriting yoki quyida fayl yuklang" />
          </Form.Item>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#666' }}>Yoki rasm yuklang: </label>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            {uploading && <span style={{ marginLeft: 8, color: '#1677ff' }}>Yuklanmoqda...</span>}
          </div>
          <Form.Item name="order" label="Tartib raqami"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminCategories;
