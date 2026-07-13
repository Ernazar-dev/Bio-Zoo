import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Typography, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, BulbOutlined } from '@ant-design/icons';
import { askAi, type AiChatMessage } from '../../api/ai';

const { Text, Paragraph } = Typography;

const SUGGESTIONS = [
  'Bu mavzuni qisqacha tushuntirib ber',
  'Asosiy tushunchalarni sanab ber',
  'Menga 3 ta savol ber',
];

const AiAssistant: React.FC<{ topicId: string; topicTitle: string }> = ({ topicId, topicTitle }) => {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || loading) return;
    const next: AiChatMessage[] = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const res = await askAi({ topicId, messages: next });
      setMessages([...next, { role: 'assistant', content: res.reply }]);
    } catch (e: any) {
      setError(e.response?.data?.message || 'AI bilan bog\'lanishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--line)',
      borderRadius: 'var(--leaf-radius)', display: 'flex', flexDirection: 'column',
      height: 'min(640px, calc(100vh - 220px))', overflow: 'hidden',
    }}>
      {/* Sarlavha */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12, background: 'var(--accent-soft)', color: 'var(--accent-ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
        }}>
          <RobotOutlined />
        </div>
        <div>
          <Text strong style={{ fontSize: 15, color: 'var(--ink)', display: 'block' }}>AI Yordamchi</Text>
          <Text type="secondary" style={{ fontSize: 12.5 }}>{topicTitle} mavzusi bo'yicha savol bering</Text>
        </div>
      </div>

      {/* Xabarlar */}
      <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ margin: 'auto', textAlign: 'center', maxWidth: 420 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto 14px',
              background: 'var(--accent-soft)', color: 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
            }}>
              <BulbOutlined />
            </div>
            <Text strong style={{ fontSize: 16, color: 'var(--ink)', display: 'block' }}>Nimadan boshlaymiz?</Text>
            <Paragraph type="secondary" style={{ fontSize: 13.5, marginTop: 6 }}>
              Mavzu yuzasidan istalgan savolingizni yozing yoki quyidagilardan birini tanlang.
            </Paragraph>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12 }}>
              {SUGGESTIONS.map(s => (
                <Button key={s} size="small" shape="round" onClick={() => send(s)}>{s}</Button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--accent-soft)',
              color: m.role === 'user' ? '#fff' : 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              {m.role === 'user' ? <UserOutlined /> : <RobotOutlined />}
            </div>
            <div style={{
              maxWidth: '78%', padding: '10px 14px', borderRadius: 14,
              background: m.role === 'user' ? 'var(--accent)' : 'var(--bg)',
              color: m.role === 'user' ? '#fff' : 'var(--ink)',
              border: m.role === 'user' ? 'none' : '1px solid var(--line)',
              fontSize: 14.5, lineHeight: 1.7, whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
            }}>
              <RobotOutlined />
            </div>
            <div style={{ padding: '10px 14px' }}><Spin size="small" /></div>
          </div>
        )}

        {error && <Text type="danger" style={{ fontSize: 13 }}>{error}</Text>}
      </div>

      {/* Kiritish maydoni */}
      <div style={{ borderTop: '1px solid var(--line)', padding: 14, display: 'flex', gap: 10 }}>
        <Input.TextArea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Savolingizni yozing..."
          autoSize={{ minRows: 1, maxRows: 4 }}
          onPressEnter={(e) => { if (!e.shiftKey) { e.preventDefault(); send(input); } }}
          style={{ borderRadius: 12 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={() => send(input)}
          loading={loading}
          style={{ height: 'auto', borderRadius: 12 }}
        />
      </div>
    </div>
  );
};

export default AiAssistant;
