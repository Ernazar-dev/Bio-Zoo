import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Modal, Form, Input, Space, Popconfirm, Typography, message, Avatar } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined } from '@ant-design/icons';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../../../api/subjects';
import { uploadFile } from '../../../api/materials';

const { Title } = Typography;

const AdminSubjects: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();

  const { data = [], isLoading } = useQuery({ queryKey: ['subjects'], queryFn: getSubjects });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('imageUrl', url);
      msg.success('Súwret júklendi');
    } catch { msg.error('Júklewde qátelik'); }
    finally { setUploading(false); }
  };

  const save = useMutation({
    mutationFn: (values: any) => editing ? updateSubject(editing.id, values) : createSubject(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      setOpen(false);
      msg.success('Saqlandı');
    },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Qátelik'),
  });

  const remove = useMutation({
    mutationFn: deleteSubject,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subjects'] });
      qc.invalidateQueries({ queryKey: ['categories'] });
      msg.success("Óshirildi");
    },
  });

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    form.setFieldsValue(record ?? { name: '', imageUrl: '', order: 0 });
    setOpen(true);
  };

  const cols = [
    {
      title: '', key: 'image', width: 60,
      render: (r: any) => <Avatar shape="square" size={40} src={r.imageUrl} icon={<PictureOutlined />} />,
    },
    { title: 'Atı', dataIndex: 'name', key: 'name' },
    { title: 'Kategoriyalar', key: 'count', render: (r: any) => r._count?.categories ?? 0 },
    { title: 'Tártip', dataIndex: 'order', key: 'order' },
    {
      title: '', key: 'actions',
      render: (r: any) => (
        <Space>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
          <Popconfirm
            title="Pán óshirilsin be?"
            description="Ishindegi kategoriyalar óshirilmeydi, tek pánden ajratıladı."
            onConfirm={() => remove.mutate(r.id)}
            okText="Awa"
            cancelText="Yaq"
          >
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
        <Title level={3} style={{ margin: 0 }}>Pánler</Title>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()}>Qosıw</Button>
      </div>
      <Table dataSource={data} columns={cols} rowKey="id" loading={isLoading} />
 
      <Modal title={editing ? 'Redaktorlaw' : "Jaña pán"} open={open} onCancel={() => setOpen(false)}
        onOk={() => form.validateFields().then(v => save.mutate(v))} confirmLoading={save.isPending} okText="Saqlaw">
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Atı" rules={[{ required: true }]}><Input placeholder="Mısalı: Zoologiya" /></Form.Item>
          <Form.Item name="description" label="Tariyp"><Input.TextArea rows={2} /></Form.Item>
          <Form.Item name="imageUrl" label="Fon súwreti URL">
            <Input placeholder="URL kiritiń yamasa tómende fayl júkleń" />
          </Form.Item>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 12, color: '#666' }}>Yamasa súwret júkleń: </label>
            <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} />
            {uploading && <span style={{ marginLeft: 8, color: '#1677ff' }}>Júklenbekte...</span>}
          </div>
          <Form.Item name="order" label="Tártip sanı"><Input type="number" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminSubjects;
