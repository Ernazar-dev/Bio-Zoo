import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, Navigate } from 'react-router-dom';
import { Typography, Progress, Tag, Avatar, Empty } from 'antd';
import {
  TrophyOutlined, RiseOutlined, CheckCircleOutlined, ReadOutlined,
  FileDoneOutlined, ProfileOutlined, CrownOutlined, RightOutlined,
} from '@ant-design/icons';
import { getMe, getMyProgress, getMyRank, getMyPortfolio } from '../../api/users';
import { getTopics } from '../../api/topics';
import { useAuthStore } from '../../store/authStore';
import { Leaf } from '../../components/Decor/Leaf';

const { Title, Text, Paragraph } = Typography;

const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--line)',
    borderRadius: 'var(--leaf-radius)', padding: '22px 24px', ...style,
  }}>{children}</div>
);

const SectionTitle: React.FC<{ icon: React.ReactNode; title: string; extra?: React.ReactNode }> = ({ icon, title, extra }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
    <span style={{
      width: 32, height: 32, borderRadius: 9, background: 'var(--accent-soft)', color: 'var(--accent-ink)',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
    }}>{icon}</span>
    <Text strong style={{ fontSize: 17, color: 'var(--ink)' }}>{title}</Text>
    <div style={{ marginLeft: 'auto' }}>{extra}</div>
  </div>
);

const StatTile: React.FC<{ label: string; value: React.ReactNode; icon: React.ReactNode; color?: string }> = ({ label, value, icon, color }) => (
  <div style={{
    flex: '1 1 130px', background: 'var(--bg)', border: '1px solid var(--line)',
    borderRadius: 14, padding: '16px 18px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: color || 'var(--accent-ink)', fontSize: 18 }}>
      {icon}
      <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)' }}>{value}</span>
    </div>
    <Text style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4, display: 'block' }}>{label}</Text>
  </div>
);

const scoreColor = (s: number) => (s >= 80 ? 'green' : s >= 60 ? 'gold' : 'red');

const Profile: React.FC = () => {
  const { user } = useAuthStore();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe, enabled: !!user });
  const { data: progress } = useQuery({ queryKey: ['my-progress'], queryFn: getMyProgress, enabled: !!user });
  const { data: rank } = useQuery({ queryKey: ['my-rank'], queryFn: getMyRank, enabled: !!user });
  const { data: portfolio = [] } = useQuery({ queryKey: ['my-portfolio'], queryFn: getMyPortfolio, enabled: !!user });
  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics(), enabled: !!user });

  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'ADMIN') return <Navigate to="/admin" replace />;

  const topicTitle = (id: string) => topics.find((t: any) => t.id === id)?.title || 'Mavzu';
  const memberSince = me?.createdAt ? new Date(me.createdAt).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long' }) : '';

  const byTopic = (progress?.byTopic || [])
    .slice()
    .sort((a, b) => b.percent - a.percent);

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '28px 24px 80px' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* ——— Profil sarlavhasi ——— */}
        <Card style={{ marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <Avatar size={72} src={me?.avatar} style={{ background: 'var(--accent)', fontSize: 30, flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase()}
            </Avatar>
            <div style={{ flex: 1, minWidth: 200 }}>
              <Title level={3} style={{ margin: 0, color: 'var(--ink)' }}>{user.name}</Title>
              <Text type="secondary" style={{ fontSize: 13.5 }}>
                @{me?.login || user.login}{memberSince && ` · ${memberSince} dan beri`}
              </Text>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--accent-soft)', borderRadius: 14 }}>
                <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-ink)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                  <Leaf size={16} color="var(--accent)" />{me?.points ?? user.points}
                </div>
                <Text style={{ color: 'var(--muted)', fontSize: 12.5 }}>ball</Text>
              </div>
              {rank && rank.rank > 0 && (
                <div style={{ textAlign: 'center', padding: '10px 20px', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 14 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                    <CrownOutlined style={{ color: '#f0a10e', fontSize: 22 }} />{rank.rank}
                  </div>
                  <Text style={{ color: 'var(--muted)', fontSize: 12.5 }}>reyting o'rni</Text>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))', gap: 20, alignItems: 'start' }}>

          {/* ——— Taraqqiyot ——— */}
          <Card>
            <SectionTitle icon={<RiseOutlined />} title="Taraqqiyot" />
            <div style={{ display: 'flex', alignItems: 'center', gap: 22, marginBottom: 20, flexWrap: 'wrap' }}>
              <Progress
                type="circle"
                percent={progress?.percent ?? 0}
                size={104}
                strokeColor="var(--accent)"
                format={(p) => <span style={{ color: 'var(--ink)', fontWeight: 700 }}>{p}%</span>}
              />
              <div style={{ flex: 1, minWidth: 160 }}>
                <Text strong style={{ color: 'var(--ink)', fontSize: 15 }}>Umumiy o'zlashtirish</Text>
                <Paragraph type="secondary" style={{ fontSize: 13, margin: '4px 0 0' }}>
                  Jami {progress?.totalQuizzes ?? 0} ta testdan {progress?.mastered ?? 0} tasini muvaffaqiyatli topshirdingiz.
                </Paragraph>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: byTopic.length ? 20 : 0 }}>
              <StatTile label="O'zlashtirilgan" value={progress?.mastered ?? 0} icon={<CheckCircleOutlined />} color="#1b8a4e" />
              <StatTile label="O'rganilmoqda" value={progress?.learning ?? 0} icon={<ReadOutlined />} color="#f0a10e" />
              <StatTile label="Qolgan" value={progress?.remaining ?? 0} icon={<FileDoneOutlined />} color="var(--muted)" />
            </div>

            {byTopic.length > 0 && (
              <div>
                <Text strong style={{ color: 'var(--ink)', fontSize: 13.5, display: 'block', marginBottom: 10 }}>Mavzular bo'yicha</Text>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {byTopic.map((t) => (
                    <div key={t.topicId}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <Text style={{ color: 'var(--ink)', fontSize: 13 }} ellipsis>{topicTitle(t.topicId)}</Text>
                        <Text style={{ color: 'var(--muted)', fontSize: 12.5 }}>{t.percent}%</Text>
                      </div>
                      <Progress percent={t.percent} showInfo={false} strokeColor="var(--accent)" size="small" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* ——— Reyting ——— */}
          <Card>
            <SectionTitle
              icon={<TrophyOutlined />}
              title="Reyting"
              extra={<Link to="/leaderboard" style={{ fontSize: 13, color: 'var(--accent-ink)' }}>To'liq reyting <RightOutlined style={{ fontSize: 10 }} /></Link>}
            />
            <div style={{
              textAlign: 'center', padding: '20px 16px', background: 'linear-gradient(135deg, var(--accent-soft), var(--bg))',
              borderRadius: 16, border: '1px solid var(--line)',
            }}>
              <CrownOutlined style={{ fontSize: 40, color: '#f0a10e' }} />
              <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--ink)', lineHeight: 1.1, marginTop: 6 }}>
                #{rank?.rank ?? '—'}
              </div>
              <Text style={{ color: 'var(--muted)', fontSize: 13.5 }}>
                {rank?.total ? `${rank.total} o'quvchi orasida` : "Reyting ma'lumoti yo'q"}
              </Text>
              <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: 'var(--surface)', borderRadius: 999, border: '1px solid var(--line)' }}>
                <Leaf size={13} color="var(--accent)" />
                <Text strong style={{ color: 'var(--accent-ink)' }}>{rank?.points ?? me?.points ?? 0}</Text>
                <Text style={{ color: 'var(--muted)', fontSize: 13 }}>ball</Text>
              </div>
            </div>
          </Card>

          {/* ——— Portfolio ——— */}
          <Card style={{ gridColumn: '1 / -1' }}>
            <SectionTitle icon={<ProfileOutlined />} title="Portfolio" extra={
              <Text type="secondary" style={{ fontSize: 13 }}>{portfolio.length} ta topshirilgan test</Text>
            } />
            {portfolio.length === 0 ? (
              <Empty description="Hali test topshirilmagan" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 14 }}>
                {portfolio.map((item) => (
                  <div key={item.id} style={{
                    background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 14, padding: '16px 18px',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <Text strong style={{ color: 'var(--ink)', fontSize: 14.5, display: 'block' }} ellipsis>
                          {item.quiz?.topic?.title || 'Mavzu'}
                        </Text>
                        {item.quiz?.topic?.category?.name && (
                          <Text type="secondary" style={{ fontSize: 12.5 }}>{item.quiz.topic.category.name}</Text>
                        )}
                      </div>
                      <Tag color={scoreColor(item.score)} style={{ margin: 0, fontWeight: 700 }}>{Math.round(item.score)}%</Tag>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                      <Text style={{ color: 'var(--muted)', fontSize: 12.5 }}>
                        {item.correctCount}/{item.totalCount} to'g'ri
                      </Text>
                      <Text style={{ color: 'var(--accent-ink)', fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <Leaf size={11} color="var(--accent)" />+{item.earnedPoints}
                      </Text>
                    </div>
                    <Text type="secondary" style={{ fontSize: 11.5, display: 'block', marginTop: 8 }}>
                      {new Date(item.createdAt).toLocaleDateString('uz-UZ', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Profile;
