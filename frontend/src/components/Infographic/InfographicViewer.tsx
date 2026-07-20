import React, { useState } from 'react';
import { Drawer, Typography, Image, Button, Input, Spin, Tag } from 'antd';
import {
  ReadOutlined, VideoCameraOutlined, BulbOutlined, RobotOutlined,
  CheckCircleFilled, CloseCircleFilled, SendOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { askAi } from '../../api/ai';
import type { Infographic, InfographicBlock } from '../../types';

const { Text, Paragraph } = Typography;

const DEFAULT_COLOR = '#1b8a4e';

/* ——— Blok ichidagi mini-test ——— */
const MiniQuiz: React.FC<{ quiz: NonNullable<InfographicBlock['quiz']> }> = ({ quiz }) => {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <BulbOutlined style={{ color: 'var(--accent-ink)' }} />
        <Text strong style={{ color: 'var(--ink)' }}>Mini-test</Text>
      </div>
      <Text style={{ color: 'var(--ink)', fontSize: 14.5, display: 'block', marginBottom: 12 }}>{quiz.question}</Text>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {quiz.options.map((opt, i) => {
          const isCorrect = i === quiz.correctIndex;
          const show = answered && (i === picked || isCorrect);
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                padding: '10px 14px', borderRadius: 10, cursor: answered ? 'default' : 'pointer',
                border: '1px solid ' + (show ? (isCorrect ? '#1b8a4e' : '#d64545') : 'var(--line)'),
                background: show ? (isCorrect ? 'rgba(27,138,78,0.10)' : 'rgba(214,69,69,0.08)') : 'var(--surface)',
                color: 'var(--ink)', fontSize: 14, transition: 'all 0.15s ease',
              }}
            >
              <span style={{ flex: 1 }}>{opt}</span>
              {show && isCorrect && <CheckCircleFilled style={{ color: '#1b8a4e' }} />}
              {show && !isCorrect && i === picked && <CloseCircleFilled style={{ color: '#d64545' }} />}
            </button>
          );
        })}
      </div>
      {answered && (
        <Text style={{ display: 'block', marginTop: 12, fontSize: 13.5, color: picked === quiz.correctIndex ? '#1b8a4e' : '#d64545' }}>
          {picked === quiz.correctIndex ? "Durıs juwap! 🎉" : "Qáte. Durıs juwap belgilengen."}
        </Text>
      )}
    </div>
  );
};

/* ——— Blok bo'yicha AI savol-javob ——— */
const BlockAi: React.FC<{ topicId: string; blockLabel: string }> = ({ topicId, blockLabel }) => {
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    const text = q.trim();
    if (!text || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await askAi({ topicId, messages: [{ role: 'user', content: `[${blockLabel}] ${text}` }] });
      setAnswer(res.reply);
    } catch {
      setAnswer("AI menen baylanısıwda qátelik júz berdi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <RobotOutlined style={{ color: 'var(--accent-ink)' }} />
        <Text strong style={{ color: 'var(--ink)' }}>AI'dan soraw</Text>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder={`"${blockLabel}" boyınsha soraw...`}
          onPressEnter={ask}
          style={{ borderRadius: 10 }}
        />
        <Button type="primary" icon={<SendOutlined />} onClick={ask} loading={loading} style={{ borderRadius: 10 }} />
      </div>
      {loading && <div style={{ marginTop: 12 }}><Spin size="small" /></div>}
      {answer && (
        <Paragraph style={{ marginTop: 12, marginBottom: 0, color: 'var(--ink)', fontSize: 14, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
          {answer}
        </Paragraph>
      )}
    </div>
  );
};

/* ——— Bosilганda ochiladigan panel ——— */
const BlockPanel: React.FC<{ block: InfographicBlock | null; topicId: string; onClose: () => void }> = ({ block, topicId, onClose }) => {
  const color = block?.color || DEFAULT_COLOR;
  const isYoutube = block?.videoUrl && (block.videoUrl.includes('youtube') || block.videoUrl.includes('youtu.be'));
  const embedUrl = block?.videoUrl?.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/');

  return (
    <Drawer
      open={!!block}
      onClose={onClose}
      width={Math.min(560, typeof window !== 'undefined' ? window.innerWidth : 560)}
      title={block && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 12, height: 12, borderRadius: 4, background: color, display: 'inline-block' }} />
          <span style={{ fontWeight: 700 }}>{block.label}</span>
        </div>
      )}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 16 } }}
    >
      {block && (
        <>
          {/* Punktlar */}
          {block.items.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {block.items.map((it, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, marginTop: 8, flexShrink: 0 }} />
                  <Text style={{ color: 'var(--ink)', fontSize: 15 }}>{it}</Text>
                </div>
              ))}
            </div>
          )}

          {/* Nazariya */}
          {block.theory && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <ReadOutlined style={{ color: 'var(--accent-ink)' }} /><Text strong style={{ color: 'var(--ink)' }}>Teoriya</Text>
              </div>
              <Paragraph style={{ color: 'var(--ink)', fontSize: 14.5, lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>
                {block.theory}
              </Paragraph>
            </div>
          )}

          {/* Rasm */}
          {block.imageUrl && <Image src={block.imageUrl} style={{ borderRadius: 12 }} />}

          {/* Video */}
          {block.videoUrl && (
            <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
              {isYoutube ? (
                <iframe width="100%" height="260" src={embedUrl} frameBorder="0" allowFullScreen style={{ display: 'block' }} />
              ) : (
                <video controls style={{ width: '100%', maxHeight: 300, display: 'block' }}><source src={block.videoUrl} /></video>
              )}
            </div>
          )}

          {/* Mini-test */}
          {block.quiz && <MiniQuiz quiz={block.quiz} />}

          {/* AI */}
          {block.aiEnabled && <BlockAi topicId={topicId} blockLabel={block.label} />}
        </>
      )}
    </Drawer>
  );
};

/* ——— Blok kartasi (bosiladigan) ——— */
const BlockCard: React.FC<{ block: InfographicBlock; index?: number; onClick: () => void }> = ({ block, index, onClick }) => {
  const color = block.color || DEFAULT_COLOR;
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative', textAlign: 'left', cursor: 'pointer', width: '100%',
        background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 14,
        padding: '16px 18px', paddingLeft: 20, transition: 'all 0.18s ease', overflow: 'hidden',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.06)'; e.currentTarget.style.borderColor = color; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--line)'; }}
    >
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 5, background: color }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        {typeof index === 'number' && (
          <span style={{
            width: 22, height: 22, borderRadius: '50%', background: color, color: '#fff',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0,
          }}>{index + 1}</span>
        )}
        <Text strong style={{ fontSize: 15.5, color: 'var(--ink)' }}>{block.label}</Text>
      </div>
      {block.items.length > 0 && (
        <Text style={{ color: 'var(--muted)', fontSize: 13, display: 'block' }} ellipsis>
          {block.items.join(' · ')}
        </Text>
      )}
      <div style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
        {block.theory && <Tag icon={<ReadOutlined />} color="green" style={{ margin: 0 }}>Teoriya</Tag>}
        {block.videoUrl && <Tag icon={<VideoCameraOutlined />} color="blue" style={{ margin: 0 }}>Video</Tag>}
        {block.quiz && <Tag icon={<BulbOutlined />} color="gold" style={{ margin: 0 }}>Test</Tag>}
        {block.aiEnabled && <Tag icon={<RobotOutlined />} color="purple" style={{ margin: 0 }}>AI</Tag>}
      </div>
    </button>
  );
};

/* ——— Bitta infografika ——— */
const SingleInfographic: React.FC<{ data: Infographic; topicId: string }> = ({ data, topicId }) => {
  const [active, setActive] = useState<InfographicBlock | null>(null);
  const isTimeline = data.layout === 'TIMELINE';

  // Yangi format: ustoz yuklagan tayyor rasm (mental karta) — bosganda kattalashadi
  if (data.imageUrl) {
    return (
      <section style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--leaf-radius)', padding: '24px 22px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AppstoreOutlined />
          </span>
          <Text strong style={{ fontSize: 16, color: 'var(--ink)' }}>{data.title}</Text>
        </div>
        <Image
          src={data.imageUrl}
          alt={data.title}
          style={{ borderRadius: 12, maxWidth: '100%' }}
          preview={{ mask: 'Úlkeytiw' }}
        />
      </section>
    );
  }

  return (
    <section style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--leaf-radius)', padding: '24px 22px', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--accent-soft)', color: 'var(--accent-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <AppstoreOutlined />
        </span>
        <Text strong style={{ fontSize: 16, color: 'var(--ink)' }}>{data.title}</Text>
      </div>

      {/* Markaz */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: isTimeline ? 20 : 8 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 26px', borderRadius: 999,
          background: 'linear-gradient(135deg, var(--accent-ink), var(--accent-deep))', color: '#fff',
          fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', boxShadow: '0 6px 18px rgba(27,138,78,0.18)',
        }}>
          {data.centerLabel}
        </div>
      </div>

      {!isTimeline && (
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0 0 14px' }}>
          <span style={{ width: 2, height: 22, background: 'var(--line)' }} />
        </div>
      )}

      {/* Bloklar */}
      {isTimeline ? (
        <div style={{ position: 'relative', paddingLeft: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {data.blocks.map((b, i) => (
              <BlockCard key={i} block={b} index={i} onClick={() => setActive(b)} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 14 }}>
          {data.blocks.map((b, i) => (
            <BlockCard key={i} block={b} onClick={() => setActive(b)} />
          ))}
        </div>
      )}

      {/* Eslatma */}
      {data.note && (
        <div style={{ marginTop: 18, padding: '12px 16px', background: 'var(--accent-soft)', borderRadius: 12, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <BulbOutlined style={{ color: 'var(--accent-ink)', marginTop: 3 }} />
          <Text style={{ color: 'var(--accent-ink)', fontSize: 13.5 }}>{data.note}</Text>
        </div>
      )}

      <BlockPanel block={active} topicId={topicId} onClose={() => setActive(null)} />
    </section>
  );
};

const InfographicViewer: React.FC<{ infographics: Infographic[]; topicId: string }> = ({ infographics, topicId }) => {
  if (!infographics.length) return null;
  return (
    <div>
      {infographics.map(ig => <SingleInfographic key={ig.id} data={ig} topicId={topicId} />)}
    </div>
  );
};

export default InfographicViewer;
