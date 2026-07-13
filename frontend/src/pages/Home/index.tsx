import React, { useMemo, useRef, useState } from 'react';
import { Button, Input, Progress } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  BookOutlined,
  BulbOutlined,
  FileDoneOutlined,
  FolderOpenOutlined,
  HeartOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  PartitionOutlined,
  PlayCircleFilled,
  PlayCircleOutlined,
  ReadOutlined,
  RightOutlined,
  RobotOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { getStats, getLeaderboard, getMyProgress } from '../../api/users';
import { getTopics } from '../../api/topics';
import { useAuthStore } from '../../store/authStore';
import heroAnimals from '../../assets/hero-animals.jpg';
import './Home.css';

/* Hero ichidagi mini-xususiyatlar */
const heroFeatures = [
  { icon: <BookOutlined />, label: "Interaktiv\no'qitish" },
  { icon: <RobotOutlined />, label: "Sun'iy intellekt\nyordamchisi" },
  { icon: <BarChartOutlined />, label: 'Adaptiv testlar\nva baholash' },
  { icon: <FolderOpenOutlined />, label: 'Portfolio\nva tahlil' },
];

/* Asosiy funksiya kartochkalari */
const featureCards = [
  { icon: <ReadOutlined />, color: '#1b8a4e', bg: '#e6f4ea', title: 'Nazariya', sub: "Ma'ruza va materiallar", to: '/categories' },
  { icon: <PlayCircleOutlined />, color: '#7c4dff', bg: '#f0eaff', title: 'Video darslar', sub: "Vizual o'qitish", to: '/categories' },
  { icon: <PartitionOutlined />, color: '#f57c00', bg: '#fff3e0', title: 'Interaktiv sxema', sub: 'Bilish xaritalari', to: '/categories' },
  { icon: <RobotOutlined />, color: '#0288d1', bg: '#e1f5fe', title: 'AI yordamchi', sub: 'Savol bering', to: '/categories' },
  { icon: <FileDoneOutlined />, color: '#00acc1', bg: '#e0f7fa', title: 'Testlar', sub: 'Bilimingizni tekshiring', to: '/categories' },
  { icon: <BulbOutlined />, color: '#f9a825', bg: '#fff8e1', title: 'Keyslar', sub: 'Amaliy vaziyatlar', to: '/categories' },
  { icon: <FolderOpenOutlined />, color: '#43a047', bg: '#e8f5e9', title: 'Portfolio', sub: 'Ishlaringizni saqlang', to: '/categories' },
  { icon: <BarChartOutlined />, color: '#26a69a', bg: '#e0f2f1', title: 'Baholash', sub: 'Natijalaringiz', to: '/leaderboard' },
  { icon: <HeartOutlined />, color: '#ec407a', bg: '#fce4ec', title: 'Refleksiya', sub: "O'z-o'zingizni tahlil qiling", to: '/leaderboard' },
];

const medalColors = ['#f6b93b', '#b0bec5', '#cd7f32'];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isStudent = !!user && user.role !== 'ADMIN';
  const featuresRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');

  const { data: stats } = useQuery({ queryKey: ['site-stats'], queryFn: getStats });
  const { data: topics } = useQuery({ queryKey: ['topics'], queryFn: () => getTopics() });
  const { data: leaders } = useQuery({ queryKey: ['leaderboard'], queryFn: getLeaderboard });
  const { data: progress } = useQuery({
    queryKey: ['my-progress'],
    queryFn: getMyProgress,
    enabled: isStudent,
  });

  const percentByTopic = useMemo(() => {
    const m = new Map<string, number>();
    progress?.byTopic.forEach((t) => m.set(t.topicId, t.percent));
    return m;
  }, [progress]);

  const topicPercent = (id: string) => percentByTopic.get(id) ?? 0;

  /* Keyingi mavzu — hali 100% o'zlashtirilmagan birinchi mavzu */
  const nextTopic = useMemo(() => {
    if (!topics?.length) return undefined;
    return topics.find((t) => topicPercent(t.id) < 100) ?? topics[0];
  }, [topics, percentByTopic]);

  const filteredTopics = useMemo(() => {
    if (!topics) return [];
    const s = q.trim().toLowerCase();
    if (!s) return topics;
    return topics.filter(
      (t) => t.title.toLowerCase().includes(s) || (t.description ?? '').toLowerCase().includes(s),
    );
  }, [topics, q]);

  /* Donut ulushlari */
  const donut = useMemo(() => {
    const total = progress?.totalQuizzes ?? 0;
    if (!total) return { mastered: 0, learning: 0, remaining: 100, percent: 0 };
    return {
      mastered: Math.round(((progress!.mastered) / total) * 100),
      learning: Math.round(((progress!.learning) / total) * 100),
      remaining: Math.round(((progress!.remaining) / total) * 100),
      percent: progress!.percent,
    };
  }, [progress]);

  const scrollRail = (dir: number) => {
    railRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  const activityStats = [
    { num: stats?.topics ?? '—', label: 'Mavzular' },
    { num: isStudent ? `${progress?.percent ?? 0}%` : '—', label: 'Progress' },
    { num: isStudent ? user!.points : '—', label: 'Ball' },
    { num: stats?.students ?? '—', label: 'Studentlar' },
  ];

  return (
    <div className="bh-page">
      {/* ——— HERO ——— */}
      <section className="bh-hero" style={{ backgroundImage: `linear-gradient(95deg, rgba(7,38,22,0.94) 0%, rgba(7,38,22,0.80) 28%, rgba(7,38,22,0.30) 56%, rgba(7,38,22,0.20) 78%, rgba(7,38,22,0.45) 100%), url(${heroAnimals})` }}>
        <div className="bh-hero-left">
          <h1 className="bh-hero-title">Biometod AI</h1>
          <p className="bh-hero-sub">
            Biometod AI — biologiya fanlarini o'rganishga
            innovatsion, aqlli yondashuv!
          </p>

          <div className="bh-hero-feats">
            {heroFeatures.map((f) => (
              <div className="bh-hero-feat" key={f.label}>
                <span className="bh-hero-feat-icon">{f.icon}</span>
                <span className="bh-hero-feat-label">{f.label}</span>
              </div>
            ))}
          </div>

          <div className="bh-hero-actions">
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleFilled />}
              onClick={() => navigate('/categories')}
              style={{ height: 46, padding: '0 24px', fontWeight: 700 }}
            >
              O'qishni boshlash
            </Button>
            <Button
              size="large"
              ghost
              icon={<InfoCircleOutlined />}
              onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              style={{ height: 46, padding: '0 22px', color: '#fff', borderColor: 'rgba(255,255,255,0.55)' }}
            >
              Qanday ishlaydi?
            </Button>
          </div>
        </div>

        {/* O'ng panel — faoliyat */}
        <aside className="bh-hero-panel">
          <span className="bh-panel-title">Faoliyatingiz</span>
          <div className="bh-panel-stats">
            {activityStats.map((s) => (
              <div className="bh-panel-stat" key={s.label}>
                <span className="bh-panel-num">{s.num}</span>
                <span className="bh-panel-label">{s.label}</span>
              </div>
            ))}
          </div>

          {nextTopic && (
            <>
              <span className="bh-panel-title" style={{ marginTop: 14 }}>Keyingi mavzu</span>
              <div className="bh-next-topic">
                {nextTopic.coverImage ? (
                  <img src={nextTopic.coverImage} alt="" className="bh-next-img" />
                ) : (
                  <div className="bh-next-img bh-next-img-ph"><ReadOutlined /></div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="bh-next-title">{nextTopic.title}</div>
                  <Progress
                    percent={topicPercent(nextTopic.id)}
                    size="small"
                    strokeColor="#1b8a4e"
                    style={{ marginBottom: 0 }}
                  />
                </div>
              </div>
              <Button
                type="primary"
                block
                onClick={() => navigate(`/topics/${nextTopic.id}`)}
                style={{ height: 42, fontWeight: 700, marginTop: 12 }}
              >
                Davom ettirish <RightOutlined />
              </Button>
            </>
          )}
        </aside>
      </section>

      {/* ——— QIDIRUV ——— */}
      <div className="bh-search">
        <Input
          size="large"
          allowClear
          prefix={<SearchOutlined style={{ color: 'var(--muted)' }} />}
          placeholder="Mavzu, tushuncha yoki savolni qidiring..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {/* ——— FUNKSIYA KARTOCHKALARI ——— */}
      <div className="bh-features" ref={featuresRef}>
        {featureCards.map((f) => (
          <button className="bh-feature" key={f.title} onClick={() => navigate(f.to)}>
            <span className="bh-feature-icon" style={{ background: f.bg, color: f.color }}>{f.icon}</span>
            <span className="bh-feature-title">{f.title}</span>
            <span className="bh-feature-sub">{f.sub}</span>
          </button>
        ))}
      </div>

      {/* ——— PASTKI QISM: MAVZULAR + YON PANEL ——— */}
      <div className="bh-bottom">
        <section className="bh-topics card-surface">
          <div className="bh-topics-head">
            <h2 className="bh-h2">Mavzular</h2>
            <Button type="primary" size="small" onClick={() => navigate('/categories')} style={{ fontWeight: 600 }}>
              Barcha mavzular <ArrowRightOutlined />
            </Button>
          </div>

          <div className="bh-rail-wrap">
            <button className="bh-rail-btn bh-rail-prev" onClick={() => scrollRail(-1)} aria-label="Oldingi">
              <LeftOutlined />
            </button>
            <div className="bh-rail" ref={railRef}>
              {filteredTopics.map((t, i) => (
                <Link to={`/topics/${t.id}`} className="bh-topic-card" key={t.id}>
                  <div className="bh-topic-media">
                    <span className="bh-topic-num">{i + 1}</span>
                    {t.coverImage ? (
                      <img src={t.coverImage} alt={t.title} loading="lazy" />
                    ) : (
                      <div className="bh-topic-ph"><ReadOutlined /></div>
                    )}
                  </div>
                  <div className="bh-topic-body">
                    <div className="bh-topic-title">{t.title}</div>
                    <div className="bh-topic-progress">
                      <span>{topicPercent(t.id)}%</span>
                      <Progress percent={topicPercent(t.id)} size="small" showInfo={false} strokeColor="#1b8a4e" style={{ flex: 1, margin: 0 }} />
                    </div>
                  </div>
                </Link>
              ))}
              {filteredTopics.length === 0 && (
                <div className="bh-empty">Hech narsa topilmadi</div>
              )}
            </div>
            <button className="bh-rail-btn bh-rail-next" onClick={() => scrollRail(1)} aria-label="Keyingi">
              <RightOutlined />
            </button>
          </div>
        </section>

        <aside className="bh-side">
          {/* Bilim darajasi */}
          <div className="card-surface bh-side-card">
            <h3 className="bh-h3">Bilim darajangiz</h3>
            {isStudent ? (
              <div className="bh-donut-row">
                <DonutChart mastered={donut.mastered} learning={donut.learning} percent={donut.percent} />
                <div className="bh-legend">
                  <span><i style={{ background: '#1b8a4e' }} /> O'zlashtirilgan <b>{donut.mastered}%</b></span>
                  <span><i style={{ background: '#f9a825' }} /> O'rganishda <b>{donut.learning}%</b></span>
                  <span><i style={{ background: 'var(--line)' }} /> Qoladi <b>{donut.remaining}%</b></span>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0, lineHeight: 1.7 }}>
                Progressingizni kuzatish uchun <Link to="/login" style={{ fontWeight: 600 }}>tizimga kiring</Link>.
              </p>
            )}
          </div>

          {/* Eng faol foydalanuvchilar */}
          <div className="card-surface bh-side-card">
            <h3 className="bh-h3">Eng faol foydalanuvchilar</h3>
            <div className="bh-leaders">
              {(leaders ?? []).slice(0, 3).map((u, i) => (
                <div className="bh-leader" key={u.id}>
                  <span className="bh-leader-rank" style={{ background: medalColors[i] }}>{i + 1}</span>
                  <span className="bh-leader-avatar">{u.name.charAt(0).toUpperCase()}</span>
                  <span className="bh-leader-name">{u.name}</span>
                  <span className="bh-leader-points">{u.points}</span>
                </div>
              ))}
              {(!leaders || leaders.length === 0) && (
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>Hozircha ma'lumot yo'q</span>
              )}
            </div>
            <Link to="/leaderboard" className="bh-side-link">
              Reytingni ko'rish <ArrowRightOutlined />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
};

/* Uch qismli donut diagramma (SVG) */
const DonutChart: React.FC<{ mastered: number; learning: number; percent: number }> = ({
  mastered,
  learning,
  percent,
}) => {
  const r = 40;
  const c = 2 * Math.PI * r;
  const seg = (p: number) => (p / 100) * c;
  return (
    <svg width="104" height="104" viewBox="0 0 104 104" className="bh-donut">
      <circle cx="52" cy="52" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
      <circle
        cx="52" cy="52" r={r} fill="none" stroke="#f9a825" strokeWidth="12"
        strokeDasharray={`${seg(mastered + learning)} ${c}`}
        strokeLinecap="round" transform="rotate(-90 52 52)"
      />
      <circle
        cx="52" cy="52" r={r} fill="none" stroke="#1b8a4e" strokeWidth="12"
        strokeDasharray={`${seg(mastered)} ${c}`}
        strokeLinecap="round" transform="rotate(-90 52 52)"
      />
      <text x="52" y="57" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--accent-ink)">
        {percent}%
      </text>
    </svg>
  );
};

export default Home;
