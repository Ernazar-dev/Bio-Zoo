import React, { lazy, Suspense, useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { Typography, Spin, Breadcrumb, Button, Image, Space, Modal } from 'antd';
import {
  ReadOutlined, BorderlessTableOutlined, QuestionCircleOutlined, PlayCircleOutlined,
  FileImageOutlined, VideoCameraOutlined, FileTextOutlined, FilePdfOutlined,
  FileOutlined, DownloadOutlined, RocketOutlined, ExperimentOutlined, RobotOutlined,
  FileDoneOutlined, FundProjectionScreenOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
// @ts-ignore
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import { getTopicById } from '../../api/topics';
import QuizSection from '../../components/Quiz/QuizSection';
import AiAssistant from '../../components/AI/AiAssistant';
import InfographicViewer from '../../components/Infographic/InfographicViewer';
import InteractiveViewer from '../../components/Interactive/InteractiveViewer';
import { Leaf, LeafOutline } from '../../components/Decor/Leaf';
import type { Material } from '../../types';

const Model3DViewer = lazy(() => import('../../components/3DModel/Model3DViewer'));

const { Title, Text, Paragraph } = Typography;

/* ——— Material bo'limi: bir xil ko'rinishdagi karta-seksiya ——— */
const Section: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode }> = ({ icon, title, children }) => (
  <section
    style={{
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--leaf-radius)',
      padding: '20px 22px',
      marginBottom: 16,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
      <span
        style={{
          width: 30,
          height: 30,
          borderRadius: 8,
          background: 'var(--accent-soft)',
          color: 'var(--accent-ink)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {icon}
      </span>
      <Text strong style={{ fontSize: 15, color: 'var(--ink)' }}>{title}</Text>
    </div>
    {children}
  </section>
);

/* ——— Bo'sh holat ——— */
const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '56px 20px',
      border: '1px dashed var(--line)',
      borderRadius: 'var(--leaf-radius)',
      background: 'var(--surface)',
    }}
  >
    <LeafOutline size={44} color="var(--muted)" style={{ opacity: 0.55 }} />
    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 12 }}>{text}</p>
  </div>
);

/* ——— Tez orada — hali tayyor bo'lmagan bo'limlar uchun ——— */
const ComingSoon: React.FC<{ title: string; text: string }> = ({ title, text }) => (
  <div
    style={{
      textAlign: 'center',
      padding: '64px 24px',
      border: '1px dashed var(--line)',
      borderRadius: 'var(--leaf-radius)',
      background: 'var(--surface)',
    }}
  >
    <div style={{
      width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
      background: 'var(--accent-soft)', color: 'var(--accent-ink)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
    }}>
      <ClockCircleOutlined />
    </div>
    <Text strong style={{ fontSize: 17, color: 'var(--ink)', display: 'block' }}>{title}</Text>
    <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 8, maxWidth: 420, marginInline: 'auto' }}>{text}</p>
  </div>
);

const MaterialRenderer = ({ material }: { material: Material }) => {
  switch (material.type) {
    case 'IMAGE':
    case 'INFOGRAPHIC':
      return (
        <Section icon={<FileImageOutlined />} title={material.title}>
          <Image src={material.url!} style={{ borderRadius: 12, maxHeight: 620, objectFit: 'contain' }} />
        </Section>
      );
    case 'VIDEO':
      return (
        <Section icon={<VideoCameraOutlined />} title={material.title}>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            {material.url?.includes('youtube') || material.url?.includes('youtu.be') ? (
              <iframe
                width="100%"
                height="420"
                src={material.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')}
                frameBorder="0"
                allowFullScreen
                style={{ display: 'block' }}
              />
            ) : (
              <video controls style={{ width: '100%', maxHeight: 420, display: 'block' }}>
                <source src={material.url} />
              </video>
            )}
          </div>
        </Section>
      );
    case 'TEXT':
      return (
        <Section icon={<FileTextOutlined />} title={material.title}>
          <Paragraph style={{ color: 'var(--ink)', fontSize: 15.5, lineHeight: 1.85, margin: 0, whiteSpace: 'pre-wrap' }}>
            {material.content}
          </Paragraph>
        </Section>
      );
    case 'DOCUMENT':
    case 'PRESENTATION':
      return <DocumentCard material={material} />;
    default:
      return null;
  }
};

type DocKind = 'pdf' | 'word' | 'office' | 'other' | null;

const detectKindFromName = (name: string): DocKind => {
  const clean = name.split('?')[0].split('#')[0].toLowerCase();
  if (clean.endsWith('.pdf')) return 'pdf';
  if (/\.(docx|doc)$/.test(clean)) return 'word';
  if (/\.(xlsx|xls|pptx|ppt)$/.test(clean)) return 'office';
  return null;
};

const DocumentCard = ({ material }: { material: Material }) => {
  const url = material.url || '';
  // null — turi hali aniqlanmoqda; 'other' — ko'rsatib bo'lmaydigan tur
  const [kind, setKind] = useState<DocKind>(() => detectKindFromName(url));
  const isPdf = kind === 'pdf';
  const isWord = kind === 'word';
  const isOtherOffice = kind === 'office';
  const isLocal = url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');

  // Eski yuklamalarda URL kengaytmasiz (/api/files/<id>) bo'lishi mumkin —
  // bunday holda tur server javobidagi sarlavhalardan aniqlanadi
  useEffect(() => {
    const fromName = detectKindFromName(url);
    setKind(fromName);
    if (fromName || !url) return;
    fetch(url, { method: 'HEAD' })
      .then((r) => {
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        const cd = r.headers.get('content-disposition') || '';
        const nameMatch = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(cd);
        const detected: DocKind =
          ct.includes('pdf') ? 'pdf'
          : (ct.includes('wordprocessingml') || ct.includes('msword')) ? 'word'
          : (ct.includes('spreadsheetml') || ct.includes('ms-excel') || ct.includes('presentationml') || ct.includes('ms-powerpoint')) ? 'office'
          : nameMatch ? detectKindFromName(decodeURIComponent(nameMatch[1])) : null;
        setKind(detected ?? 'other');
      })
      .catch(() => setKind('other'));
  }, [url]);

  const [wordHtml, setWordHtml] = useState<string | null>(null);
  const [loadingWord, setLoadingWord] = useState(false);
  const [wordError, setWordError] = useState<string | null>(null);

  useEffect(() => {
    if (isWord) {
      setLoadingWord(true);
      setWordError(null);
      fetch(url)
        .then((r) => {
          if (!r.ok) throw new Error("Faylni yuklab olishda xatolik");
          return r.arrayBuffer();
        })
        .then((buf) => mammoth.convertToHtml({ arrayBuffer: buf }))
        .then((result) => {
          // XSS himoyasi: hujjat ichidan kelishi mumkin bo'lgan skript/hodisalar tozalanadi
          setWordHtml(DOMPurify.sanitize(result.value));
        })
        .catch((err) => {
          console.error("Mammoth error:", err);
          setWordError("Word hújjetin sayt ishinde kórsetiwde qátelik júz berdi. Fayldi tómendegi túyme arqalı júklep alıwıńız múmkin.");
        })
        .finally(() => {
          setLoadingWord(false);
        });
    }
  }, [url, isWord]);

  return (
    <div style={{
      marginBottom: 16,
      background: 'var(--surface)',
      border: '1px solid var(--line)',
      borderRadius: 'var(--leaf-radius)',
      padding: '20px 22px',
    }}>
      <style>{`
        .mammoth-document-content p {
          margin-bottom: 1em;
          line-height: 1.75;
          font-size: 15px;
          color: var(--ink);
        }
        .mammoth-document-content h1,
        .mammoth-document-content h2,
        .mammoth-document-content h3 {
          margin-top: 1.2em;
          margin-bottom: 0.6em;
          font-weight: bold;
          color: var(--ink);
        }
        .mammoth-document-content table {
          width: 100%;
          table-layout: fixed; /* keng jadval siqilib sig'adi — gorizontal scroll chiqmaydi */
          border-collapse: collapse;
          margin-bottom: 1em;
        }
        .mammoth-document-content th,
        .mammoth-document-content td {
          border: 1px solid var(--line);
          padding: 8px;
          word-break: break-word;
        }
        .mammoth-document-content img {
          max-width: 100%;
          height: auto;
        }
      `}</style>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <Space size={12}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'var(--accent-soft)', color: 'var(--accent-ink)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19,
          }}>
            {isPdf ? <FilePdfOutlined /> : <FileOutlined />}
          </div>
          <div>
            <Text style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 15.5, display: 'block' }}>{material.title}</Text>
            <Text style={{ color: 'var(--muted)', fontSize: 12.5 }}>
              {isPdf ? 'PDF hújjet' : isWord ? 'Word hújjeti' : isOtherOffice ? 'Office hújjeti' : 'Fayl'}
            </Text>
          </div>
        </Space>
        <Button size="small" icon={<DownloadOutlined />} href={url} target="_blank">
          Júklep alıw
        </Button>
      </div>

      {isPdf && (
        <div style={{
          width: '100%',
          height: '85vh', /* PDF o'z ichki varaqlagichida ochiladi — imkon qadar baland qilamiz */
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--surface)',
        }}>
          <iframe
            src={url}
            title={material.title}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

      {isWord && (
        <>
          {loadingWord && (
            <div style={{
              height: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              borderRadius: 12,
            }}>
              <Spin tip="Word hújjeti júklenbekte hám qayta islenbekte..." />
            </div>
          )}
          {wordError && (
            <div style={{
              padding: 20,
              background: '#fdf3f2',
              border: '1px dashed #f0b4b0',
              borderRadius: 12,
              textAlign: 'center',
            }}>
              <Text type="danger">{wordError}</Text>
            </div>
          )}
          {wordHtml && (
            <div
              style={{
                width: '100%',
                borderRadius: 12,
                border: '1px solid var(--line)',
                background: 'var(--surface)',
                padding: 24,
                overflowWrap: 'anywhere', /* hujjat to'liq bo'yiga ochiladi, ichki scroll yo'q */
              }}
              className="mammoth-document-content"
              dangerouslySetInnerHTML={{ __html: wordHtml }}
            />
          )}
        </>
      )}

      {isOtherOffice && !isLocal && (
        <div style={{
          width: '100%',
          height: '650px',
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid var(--line)',
          background: 'var(--surface)',
        }}>
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
            title={material.title}
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      )}

      {isOtherOffice && isLocal && (
        <div style={{
          height: 250,
          background: 'var(--bg)',
          border: '1px dashed var(--line)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}>
          <Text style={{ color: 'var(--ink)', fontWeight: 600, fontSize: 15, marginBottom: 8, display: 'block' }}>
            Lokal kompyuterde Excel/PowerPoint hújjetlerin onlayn kórip bolmaydı
          </Text>
          <Text type="secondary" style={{ marginBottom: 16, maxWidth: 500, display: 'block' }}>
            Microsoft Office Online xızmeti Excel yamasa PowerPoint faylin oqıwı ushın fayl internette (jámiyetlik siltewde) bolıwı kerek.
            Lokal sınaqlar ushın fayldi <strong>PDF formatında</strong> júklep alıwıńızdı usınıs etemiz — PDF sayt ishinde mashqalassız ashıladı.
          </Text>
          <Button href={url} target="_blank" type="primary" icon={<DownloadOutlined />}>
            Fayldi júklep alıw
          </Button>
        </div>
      )}

      {kind === null && (
        <div style={{
          height: 180,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
          border: '1px solid var(--line)',
          borderRadius: 12,
        }}>
          <Spin tip="Fayl túri anıqlanbaqta..." />
        </div>
      )}

      {kind === 'other' && (
        <div style={{
          height: 180,
          background: 'var(--bg)',
          border: '1px dashed var(--line)',
          borderRadius: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          textAlign: 'center',
        }}>
          <Text type="secondary" style={{ marginBottom: 16 }}>Bul fayl túrin brauzerde onlayn kórip bolmaydı.</Text>
          <Button href={url} target="_blank" icon={<DownloadOutlined />}>Fayldi júklep alıw</Button>
        </div>
      )}
    </div>
  );
};

/* ——— Video darslar to'plami ——— */
const VideoGrid: React.FC<{ videos: any[] }> = ({ videos }) => {
  if (!videos.length) return <EmptyState text="Bul temaga házirshe video sabaqlar qosılmaǵan" />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 420px), 1fr))', gap: 20 }}>
      {videos.map(video => {
        const isYoutube = video.platform === 'YOUTUBE' || video.url.includes('youtube') || video.url.includes('youtu.be');
        const embedUrl = isYoutube
          ? video.url.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')
          : video.url;
        return (
          <div
            key={video.id}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 4px 12px rgba(0,0,0,0.02)',
            }}
          >
            <div style={{ background: '#000', position: 'relative', overflow: 'hidden', height: 240 }}>
              {isYoutube ? (
                <iframe
                  width="100%"
                  height="100%"
                  src={embedUrl}
                  frameBorder="0"
                  allowFullScreen
                  style={{ display: 'block' }}
                />
              ) : (
                <video controls style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}>
                  <source src={video.url} />
                </video>
              )}
            </div>
            <div style={{ padding: '18px 20px', flex: 1 }}>
              <Text strong style={{ fontSize: 16, color: 'var(--ink)', display: 'block', marginBottom: 6 }}>
                {video.title}
              </Text>
              {video.description && (
                <Paragraph type="secondary" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.6 }} ellipsis={{ rows: 2 }}>
                  {video.description}
                </Paragraph>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/* ——— O'yin havolalari to'plami ——— */
const GameGrid: React.FC<{ games: any[] }> = ({ games }) => (
  <div>
    <style>{`
      .game-card {
        position: relative;
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 24px;
        display: flex;
        flex-direction: column;
        gap: 14px;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .game-card::before {
        content: '';
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 4px;
        background: linear-gradient(90deg, var(--accent) 0%, #f0a10e 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .game-card:hover {
        transform: translateY(-4px);
        border-color: var(--accent-soft);
        box-shadow: 0 12px 28px rgba(27, 138, 78, 0.08);
      }
      .game-card:hover::before { opacity: 1; }
      .game-card-icon {
        width: 52px; height: 52px;
        border-radius: 14px;
        background: linear-gradient(135deg, var(--accent-soft), #fdf0d5);
        color: var(--accent-ink);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        flex-shrink: 0;
      }
      .game-card:hover .game-card-icon {
        animation: game-icon-wiggle 0.5s ease;
      }
      @keyframes game-icon-wiggle {
        0%, 100% { transform: rotate(0deg); }
        25%      { transform: rotate(-10deg) scale(1.08); }
        75%      { transform: rotate(10deg) scale(1.08); }
      }
    `}</style>
    {!games.length
      ? <EmptyState text="Bul temaga házirshe oyinlar qosılmaǵan" />
      : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))', gap: 20 }}>
          {games.map(game => (
            <div key={game.id} className="game-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div className="game-card-icon"><RocketOutlined /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Text strong style={{ fontSize: 16, color: 'var(--ink)', display: 'block', marginBottom: 4 }}>
                    {game.title}
                  </Text>
                  {game.description && (
                    <Paragraph type="secondary" style={{ fontSize: 13.5, margin: 0, lineHeight: 1.6 }} ellipsis={{ rows: 3 }}>
                      {game.description}
                    </Paragraph>
                  )}
                </div>
              </div>
              <Button
                type="primary"
                block
                size="large"
                icon={<PlayCircleOutlined />}
                href={game.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: 44, borderRadius: 12, marginTop: 'auto' }}
              >
                Oyindı baslaw
              </Button>
            </div>
          ))}
        </div>
    }
  </div>
);

/* ——— Materiallar ro'yxati (filtrlab ko'rsatish) ——— */
const MaterialList: React.FC<{ items: Material[]; emptyText: string }> = ({ items, emptyText }) => (
  <div>
    {!items.length ? <EmptyState text={emptyText} /> : items.map(m => <MaterialRenderer key={m.id} material={m} />)}
  </div>
);

const heroChip: React.CSSProperties = {
  background: 'rgba(255,255,255,0.16)',
  border: '1px solid rgba(255,255,255,0.28)',
  color: '#fff',
  borderRadius: 999,
  padding: '3px 12px',
  fontSize: 12,
  fontWeight: 600,
  backdropFilter: 'blur(4px)',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
};

type NavChild = { key: string; label: string; count?: number };
type NavGroup = { key: string; icon: React.ReactNode; label: string; children: NavChild[] };

const TopicDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeKey, setActiveKey] = useState('nazariy');
  const [examStarted, setExamStarted] = useState(false);

  const { data: topic, isLoading } = useQuery({
    queryKey: ['topic', id],
    queryFn: () => getTopicById(id!),
    enabled: !!id,
  });

  // Materiallarni bo'limlarga ajratish
  const parts = useMemo(() => {
    if (!topic) return null;
    const model3D = topic.materials.find(m => m.type === 'MODEL_3D');
    const nazariy = topic.materials.filter(m => m.type === 'TEXT' || m.type === 'DOCUMENT');
    const prezentatsiya = topic.materials.filter(m => m.type === 'PRESENTATION');
    const infografikaImages = topic.materials.filter(m => m.type === 'INFOGRAPHIC' || m.type === 'IMAGE');
    const infographics = topic.infographics || [];
    const infografikaCount = infographics.length + infografikaImages.length;
    // gameLinks ikkiga bo'linadi: video darslar va tashqi o'yin havolalari
    const videos = topic.gameLinks.filter(g => g.platform !== 'GAME');
    const playGames = topic.gameLinks.filter(g => g.platform === 'GAME');
    // Tashqi interaktiv resurslar (Sketchfab, PhET...) bo'limlarga ajratiladi
    const interactives = topic.interactives || [];
    const models3d = interactives.filter(i => i.kind === 'MODEL_3D');
    const simulations = interactives.filter(i => i.kind === 'SIMULATION');
    const virtualLabs = interactives.filter(i => i.kind === 'VIRTUAL_LAB');
    return { model3D, nazariy, prezentatsiya, infografikaImages, infographics, infografikaCount, videos, playGames, models3d, simulations, virtualLabs };
  }, [topic]);

  // Birinchi ochilishda kontenti bor birinchi bo'limga o'tamiz
  useEffect(() => {
    if (!parts) return;
    const firstWith =
      parts.nazariy.length ? 'nazariy'
      : parts.prezentatsiya.length ? 'prezentatsiya'
      : parts.videos.length ? 'video'
      : parts.infografikaCount ? 'infografika'
      : parts.model3D ? '3d'
      : topic!.quizzes.length ? 'test'
      : 'nazariy';
    setActiveKey(firstWith);
  }, [parts]);

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!topic || !parts) return null;

  const { model3D, nazariy, prezentatsiya, infografikaImages, infographics, infografikaCount, videos, playGames, models3d, simulations, virtualLabs } = parts;

  const navGroups: NavGroup[] = [
    {
      key: 'oquv', icon: <ReadOutlined />, label: "Oqıw materialları",
      children: [
        { key: 'nazariy', label: 'Teoriyalıq materiallar', count: nazariy.length },
        { key: 'prezentatsiya', label: 'Prezentaciyalar', count: prezentatsiya.length },
        { key: 'video', label: 'Video sabaqlar', count: videos.length },
        { key: 'infografika', label: 'Infografikalar', count: infografikaCount },
      ],
    },
    {
      key: 'interaktiv', icon: <ExperimentOutlined />, label: "Interaktiv oqıw",
      children: [
        { key: '3d', label: '3D modeller', count: (model3D ? 1 : 0) + models3d.length },
        { key: 'simulyatsiya', label: 'Simulyaciya', count: simulations.length },
        { key: 'virtual-lab', label: 'Virtual laboratoriya', count: virtualLabs.length },
      ],
    },
    {
      key: 'ai', icon: <RobotOutlined />, label: 'AI Járdemshi',
      children: [{ key: 'ai-chat', label: 'AI Chat' }],
    },
    {
      key: 'baholash', icon: <FileDoneOutlined />, label: 'Baholaw',
      children: [
        { key: 'test', label: 'Testler', count: topic.quizzes.length },
        { key: 'oyinlar', label: "Oyinlar", count: playGames.length },
      ],
    },
  ];

  const childIcon: Record<string, React.ReactNode> = {
    nazariy: <FileTextOutlined />, prezentatsiya: <FundProjectionScreenOutlined />,
    video: <VideoCameraOutlined />, infografika: <FileImageOutlined />,
    '3d': <BorderlessTableOutlined />, simulyatsiya: <ExperimentOutlined />, 'virtual-lab': <ExperimentOutlined />,
    'ai-chat': <RobotOutlined />, test: <QuestionCircleOutlined />, oyinlar: <RocketOutlined />,
  };

  const renderContent = () => {
    switch (activeKey) {
      case 'nazariy':
        return <MaterialList items={nazariy} emptyText="Bul temaga házirshe teoriyalıq materiallar qosılmaǵan" />;
      case 'prezentatsiya':
        return <MaterialList items={prezentatsiya} emptyText="Bul temaga házirshe prezentaciyalar qosılmaǵan" />;
      case 'video':
        return <VideoGrid videos={videos} />;
      case 'infografika':
        return infografikaCount === 0
          ? <EmptyState text="Bul temaga házirshe infografikalar qosılmaǵan" />
          : (
            <div>
              <InfographicViewer infographics={infographics} topicId={topic.id} />
              {infografikaImages.map(m => <MaterialRenderer key={m.id} material={m} />)}
            </div>
          );
      case '3d':
        return (model3D || models3d.length)
          ? (
            <div>
              {model3D && (
                <Suspense fallback={<div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>}>
                  <div style={{ marginBottom: 20 }}><Model3DViewer url={model3D.url!} height={520} /></div>
                </Suspense>
              )}
              <InteractiveViewer items={models3d} />
            </div>
          )
          : <EmptyState text="Bul temaga házirshe 3D model qosılmaǵan" />;
      case 'simulyatsiya':
        return simulations.length
          ? <InteractiveViewer items={simulations} />
          : <ComingSoon title="Simulyaciya" text="Bul temaga házirshe simulyaciya qosılmaǵan." />;
      case 'virtual-lab':
        return virtualLabs.length
          ? <InteractiveViewer items={virtualLabs} />
          : <ComingSoon title="Virtual laboratoriya" text="Bul temaga házirshe virtual laboratoriya qosılmaǵan." />;
      case 'ai-chat':
        return <AiAssistant topicId={topic.id} topicTitle={topic.title} />;
      case 'test':
        return (
          <QuizSection
            quizzes={topic.quizzes}
            topicId={topic.id}
            examStarted={examStarted}
            setExamStarted={setExamStarted}
          />
        );
      case 'oyinlar':
        return <GameGrid games={playGames} />;
      default:
        return null;
    }
  };

  const containerMaxWidth = (activeKey === 'test' && examStarted) ? 1480 : 1120;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '28px 24px 80px' }}>
      <style>{`
        .td-body { display: flex; gap: 22px; align-items: flex-start; }
        .td-sidebar { width: 252px; flex-shrink: 0; position: sticky; top: 84px; }
        .td-content { flex: 1; min-width: 0; }
        .td-nav-group + .td-nav-group { margin-top: 6px; }
        .td-nav-head {
          display: flex; align-items: center; gap: 9px;
          padding: 10px 12px; font-weight: 700; font-size: 13.5px;
          color: var(--ink); text-transform: none;
        }
        .td-nav-head .anticon { color: var(--accent-ink); font-size: 15px; }
        .td-nav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 12px 8px 34px; border-radius: 9px; cursor: pointer;
          font-size: 13px; color: var(--muted); transition: all 0.15s ease;
          border: none; background: transparent; width: 100%; text-align: left;
        }
        .td-nav-item:hover { background: var(--accent-soft); color: var(--accent-ink); }
        .td-nav-item.active { background: var(--accent); color: #fff; font-weight: 600; }
        .td-nav-item.active .td-nav-badge { background: rgba(255,255,255,0.24); color: #fff; }
        .td-nav-badge {
          margin-left: auto; background: var(--accent-soft); color: var(--accent-ink);
          border-radius: 999px; font-size: 11px; font-weight: 700; padding: 0 7px; line-height: 18px;
        }
        @media (max-width: 860px) {
          .td-body { flex-direction: column; }
          .td-sidebar { width: 100%; position: static; }
        }
      `}</style>

      <div style={{ maxWidth: containerMaxWidth, margin: '0 auto', transition: 'max-width 0.3s ease-in-out' }}>
        {examStarted ? (
          /* Test topshirish jarayoni uchun sodda sarlavha */
          <div
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              flexWrap: 'wrap', gap: 10, marginBottom: 16,
              background: 'var(--surface)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '16px 20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 38, height: 38, borderRadius: 10,
                background: 'var(--accent-soft)', color: 'var(--accent-ink)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
              }}>
                <QuestionCircleOutlined />
              </div>
              <div>
                <Text strong style={{ fontSize: 16, color: 'var(--ink)', display: 'block' }}>{topic.title}</Text>
                <Text type="secondary" style={{ display: 'block', fontSize: 12.5 }}>Tema boyınsha test tapsırıw procesi</Text>
              </div>
            </div>
            <Button
              danger
              type="text"
              onClick={() => {
                Modal.confirm({
                  title: 'Testten shıgıw',
                  content: 'Haqıyqattan da test tapsırıwdı toqtatpaqshısız ba? Barlıq kiritilgen juwaplarıńız óship ketedi.',
                  okText: 'Awa, shıgıw',
                  cancelText: 'Yaq, dawam etiw',
                  onOk() { setExamStarted(false); },
                });
              }}
            >
              Testten shıgıw
            </Button>
          </div>
        ) : (
          <>
            <Breadcrumb
              style={{ marginBottom: 16 }}
              items={[
                { title: <Link to="/">Bas bet</Link> },
                { title: <Link to="/categories">Bólimler</Link> },
                topic.category && { title: <Link to={`/categories/${topic.category.slug}`}>{topic.category.name}</Link> },
                { title: topic.title },
              ].filter(Boolean) as any}
            />

            {/* Hero: muqova rasm va sarlavha */}
            <div
              className="fade-in-up"
              style={{
                position: 'relative', borderRadius: 'var(--leaf-radius)', overflow: 'hidden',
                minHeight: 200, display: 'flex', alignItems: 'flex-end', marginBottom: 20,
              }}
            >
              {topic.coverImage ? (
                <img
                  src={topic.coverImage}
                  alt={topic.title}
                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(140deg, var(--accent-ink), var(--accent-deep))' }}>
                  <LeafOutline size={210} color="rgba(255,255,255,0.12)" strokeWidth={0.9} style={{ position: 'absolute', right: -30, bottom: -50 }} />
                </div>
              )}
              <div
                style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, rgba(11,58,35,0.05) 20%, rgba(11,58,35,0.62) 65%, rgba(11,58,35,0.9) 100%)',
                }}
              />
              <div style={{ position: 'relative', padding: '48px 26px 22px', width: '100%' }}>
                {topic.category && (
                  <span style={{ ...heroChip, background: 'rgba(255,255,255,0.92)', color: 'var(--accent-ink)', border: 'none', marginBottom: 12 }}>
                    <Leaf size={11} /> {topic.category.name}
                  </span>
                )}
                <Title style={{ color: '#fff', margin: '10px 0 0', fontSize: 'clamp(24px, 3.2vw, 34px)', fontWeight: 750, letterSpacing: '-0.02em' }}>
                  {topic.title}
                </Title>
                {topic.description && (
                  <Paragraph
                    style={{ color: 'rgba(255,255,255,0.8)', margin: '8px 0 0', fontSize: 14, maxWidth: 620 }}
                    ellipsis={{ rows: 2 }}
                  >
                    {topic.description}
                  </Paragraph>
                )}
              </div>
            </div>
          </>
        )}

        <div className="td-body">
          {/* Chap menyu — test topshirilayotganda yashiriladi */}
          {!examStarted && (
            <aside className="td-sidebar">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--leaf-radius)', padding: 8 }}>
                {navGroups.map(group => (
                  <div className="td-nav-group" key={group.key}>
                    <div className="td-nav-head">{group.icon}<span>{group.label}</span></div>
                    {group.children.map(child => (
                      <button
                        key={child.key}
                        className={`td-nav-item${activeKey === child.key ? ' active' : ''}`}
                        onClick={() => setActiveKey(child.key)}
                      >
                        <span className="anticon" style={{ fontSize: 13 }}>{childIcon[child.key]}</span>
                        <span>{child.label}</span>
                        {typeof child.count === 'number' && child.count > 0 && (
                          <span className="td-nav-badge">{child.count}</span>
                        )}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </aside>
          )}

          <div className="td-content">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopicDetail;
