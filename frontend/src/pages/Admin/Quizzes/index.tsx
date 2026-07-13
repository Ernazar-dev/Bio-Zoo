import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button, Modal, Form, Input, Select, Space, Popconfirm, Typography, message, InputNumber, Upload, Radio, Row, Col, Table, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, FileTextOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { getQuizzes, createQuiz, updateQuiz, deleteQuiz, getQuizResults } from '../../../api/quizzes';
import { getTopics } from '../../../api/topics';
import { uploadFile } from '../../../api/materials';

const { Title, Text } = Typography;

const AdminQuizzes: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedTopic, setSelectedTopic] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [msg, ctxHolder] = message.useMessage();
  const watchQuestionCount = Form.useWatch('questionCount', form) || 0;

  // Student results modal states
  const [resultsOpen, setResultsOpen] = useState(false);
  const [resultsQuiz, setResultsQuiz] = useState<any>(null);

  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ['quizzes', selectedTopic],
    queryFn: () => getQuizzes(selectedTopic),
    enabled: !!selectedTopic,
  });

  const { data: studentResults = [], isLoading: loadingResults } = useQuery({
    queryKey: ['quiz-results-admin', resultsQuiz?.id],
    queryFn: () => getQuizResults(resultsQuiz.id),
    enabled: !!resultsQuiz?.id,
  });

  const save = useMutation({
    mutationFn: (values: any) => {
      const payload = {
        ...values,
        answerKey: answers,
      };
      return editing ? updateQuiz(editing.id, payload) : createQuiz(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      setOpen(false);
      msg.success('Saqlandi');
    },
    onError: (e: any) => msg.error(e.response?.data?.message || 'Xato yuz berdi'),
  });

  const remove = useMutation({
    mutationFn: deleteQuiz,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quizzes'] });
      msg.success("O'chirildi");
    },
  });

  const handleUploadFile = async (file: File) => {
    setUploading(true);
    try {
      const { url } = await uploadFile(file);
      form.setFieldValue('fileUrl', url);
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      form.setFieldValue('fileType', ext);
      msg.success('Fayl yuklandi');
    } catch {
      msg.error('Fayl yuklashda xato');
    } finally {
      setUploading(false);
    }
  };

  const openModal = (record?: any) => {
    setEditing(record ?? null);
    if (record) {
      form.setFieldsValue({
        topicId: record.topicId,
        fileUrl: record.fileUrl,
        fileType: record.fileType,
        questionCount: record.questionCount,
        timeLimit: record.timeLimit,
      });
      setAnswers(record.answerKey || {});
    } else {
      form.setFieldsValue({
        topicId: selectedTopic,
        fileUrl: '',
        fileType: '',
        questionCount: 10,
        timeLimit: 0,
      });
      setAnswers({});
    }
    setOpen(true);
  };

  const openResultsModal = (quizRecord: any) => {
    setResultsQuiz(quizRecord);
    setResultsOpen(true);
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const count = values.questionCount;
      const missing = Array.from({ length: count }, (_, i) => i + 1).filter(n => !answers[String(n)]);
      if (missing.length > 0) {
        msg.error(`Quyidagi savollarning javoblari belgilanmagan: ${missing.join(', ')}`);
        return;
      }
      save.mutate(values);
    });
  };

  const quizCols = [
    {
      title: '№',
      key: 'index',
      width: 60,
      render: (_: any, __: any, index: number) => index + 1,
    },
    {
      title: 'Test Fayli',
      key: 'file',
      render: (r: any) => (
        <Space>
          <FileTextOutlined style={{ color: '#1890ff' }} />
          <a href={r.fileUrl} target="_blank" rel="noreferrer" style={{ fontWeight: 500 }}>
            Faylni ochish ({r.fileType?.toUpperCase()})
          </a>
        </Space>
      ),
    },
    { title: 'Savollar', dataIndex: 'questionCount', key: 'questionCount', render: (q: number) => `${q} ta` },
    { title: 'Vaqt', dataIndex: 'timeLimit', key: 'timeLimit', render: (t: number) => t > 0 ? `${t} daqiqa` : 'Cheklanmagan' },
    {
      title: 'Amallar',
      key: 'actions',
      render: (r: any) => (
        <Space>
          <Button icon={<TeamOutlined />} size="small" type="primary" ghost onClick={() => openResultsModal(r)}>
            Natijalar
          </Button>
          <Button icon={<EditOutlined />} size="small" onClick={() => openModal(r)} />
          <Popconfirm title="Test o'chirilsinmi?" onConfirm={() => remove.mutate(r.id)} okText="Ha" cancelText="Yo'q">
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const resultCols = [
    { title: 'F.I.Sh (Ism)', dataIndex: ['user', 'name'], key: 'userName' },
    { title: 'Login', dataIndex: ['user', 'login'], key: 'login' },
    {
      title: 'Natija (%)',
      dataIndex: 'score',
      key: 'score',
      render: (s: number) => (
        <span style={{ fontWeight: 700, color: s >= 70 ? 'var(--accent)' : '#b62b23' }}>
          {Math.round(s)}%
        </span>
      )
    },
    {
      title: 'To\'g\'ri javoblar',
      key: 'correct',
      render: (r: any) => `${r.correctCount} / ${r.totalCount}`
    },
    {
      title: 'Ball',
      dataIndex: 'earnedPoints',
      key: 'points',
      render: (p: number) => <Tag color="green">+{p} ball</Tag>
    },
    {
      title: 'Topshirilgan vaqt',
      dataIndex: 'createdAt',
      key: 'date',
      render: (d: string) => new Date(d).toLocaleString('uz-UZ')
    }
  ];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 24, minHeight: 'calc(100vh - 100px)' }}>
      {ctxHolder}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>Mavzu testlari boshqaruvi</Title>
        <Space>
          <Select
            placeholder="Mavzu tanlang"
            style={{ width: 300 }}
            value={selectedTopic || undefined}
            onChange={setSelectedTopic}
            options={topics.map((t: any) => ({ value: t.id, label: t.title }))}
            showSearch
            optionFilterProp="label"
          />
          <Button icon={<PlusOutlined />} type="primary" onClick={() => openModal()} disabled={!selectedTopic}>
            Yangi test qo'shish
          </Button>
        </Space>
      </div>

      {!selectedTopic ? (
        <div style={{ textAlign: 'center', padding: 80, color: '#999', background: '#fafafa', borderRadius: 12, border: '1px dashed #e8e8e8' }}>
          <InfoCircleOutlined style={{ fontSize: 32, marginBottom: 12, color: '#ccc' }} />
          <div>Mavzuga oid testlarni boshqarish uchun yuqoridan mavzu tanlang.</div>
        </div>
      ) : (
        <Table dataSource={quizzes} columns={quizCols} rowKey="id" loading={isLoading} />
      )}

      {/* Test yaratish/tahrirlash Modali */}
      <Modal
        title={editing ? 'Test tahrirlash' : 'Yangi test qo\'shish'}
        open={open}
        onCancel={() => setOpen(false)}
        onOk={handleSubmit}
        confirmLoading={save.isPending}
        okText="Saqlash"
        width={900}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item name="topicId" label="Mavzu" rules={[{ required: true }]}>
                <Select options={topics.map((t: any) => ({ value: t.id, label: t.title }))} showSearch optionFilterProp="label" disabled />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="questionCount" label="Savollar soni" rules={[{ required: true, message: 'Kiritish majburiy' }]}>
                <InputNumber min={1} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={6}>
              <Form.Item name="timeLimit" label="Vaqt (daqiqa, 0 - cheksiz)">
                <InputNumber min={0} max={300} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={16}>
              <Form.Item name="fileUrl" label="Test fayli (Word yoki PDF) URL manzili" rules={[{ required: true, message: 'Fayl yuklash majburiy' }]}>
                <Input placeholder="Fayl URL manzili yoki yuklang" />
              </Form.Item>
            </Col>
            <Col xs={24} sm={8}>
              <Form.Item label="Test faylini yuklash">
                <Upload
                  beforeUpload={(file) => {
                    handleUploadFile(file);
                    return false;
                  }}
                  showUploadList={false}
                  accept=".pdf,.doc,.docx"
                >
                  <Button icon={<UploadOutlined />} loading={uploading}>Fayl tanlash</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="fileType" style={{ display: 'none' }}><Input /></Form.Item>

          {watchQuestionCount > 0 && (
            <div>
              <Title level={5} style={{ marginBottom: 12 }}>To'g'ri javoblar kalitini belgilang:</Title>
              <div style={{
                maxHeight: 'min(45vh, 420px)',
                overflowY: 'auto',
                padding: '16px',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                background: '#fafafa'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 8 }}>
                  {Array.from({ length: watchQuestionCount }, (_, i) => i + 1).map(num => (
                    <div key={num} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '6px 10px', background: 'var(--surface)',
                      border: `1px solid ${answers[String(num)] ? '#b7d8b7' : '#e0e0e0'}`,
                      borderRadius: 8,
                    }}>
                      <Text strong style={{ width: 26, textAlign: 'right', flexShrink: 0 }}>{num}.</Text>
                      <Radio.Group
                        value={answers[String(num)] || undefined}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [String(num)]: e.target.value }))}
                        buttonStyle="solid"
                        size="small"
                      >
                        <Radio.Button value="A">A</Radio.Button>
                        <Radio.Button value="B">B</Radio.Button>
                        <Radio.Button value="C">C</Radio.Button>
                        <Radio.Button value="D">D</Radio.Button>
                      </Radio.Group>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Form>
      </Modal>

      {/* Natijalar Modali */}
      <Modal
        title={resultsQuiz ? `"${topics.find((t: any) => t.id === resultsQuiz.topicId)?.title}" testi natijalari` : "Test natijalari"}
        open={resultsOpen}
        onCancel={() => setResultsOpen(false)}
        footer={null}
        width={850}
      >
        <div style={{ marginTop: 16 }}>
          <Table 
            dataSource={studentResults} 
            columns={resultCols} 
            rowKey="id" 
            loading={loadingResults} 
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: "Bu testni hali hech kim topshirmagan." }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminQuizzes;
