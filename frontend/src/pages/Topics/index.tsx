import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Spin, Breadcrumb } from 'antd';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getCategoryBySlug } from '../../api/categories';
import { Leaf, LeafOutline } from '../../components/Decor/Leaf';

const Topics: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({
    queryKey: ['category', slug],
    queryFn: () => getCategoryBySlug(slug!),
    enabled: !!slug,
  });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!data) return null;

  return (
    <div style={{ minHeight: 'calc(100vh - 64px)', padding: '32px 0 96px' }}>
      <div className="page fade-in-up">
        <Breadcrumb
          style={{ marginBottom: 20 }}
          items={[
            { title: <Link to="/">Bas bet</Link> },
            { title: <Link to="/categories">Bólimler</Link> },
            { title: data.name },
          ]}
        />

        {/* Ixcham sarlavha: chapda nom, o'ngda tavsif — bitta qator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px 32px',
            borderBottom: '1px solid var(--line)',
            paddingBottom: 20,
            marginBottom: 32,
          }}
        >
          <div>
            <span className="eyebrow">
              <Leaf size={12} /> Bólim · {data.topics.length} tema
            </span>
            <h1 className="display" style={{ fontSize: 'clamp(26px, 3.2vw, 38px)', margin: '8px 0 0' }}>
              {data.name}
            </h1>
          </div>
          {data.description && (
            <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6, margin: 0, maxWidth: 380 }}>
              {data.description}
            </p>
          )}
        </div>

        <Row gutter={[20, 20]}>
          {data.topics.map((topic: any, index: number) => {
            const counts = topic._count ?? {};
            const meta = [
              counts.materials > 0 && `${counts.materials} sabaqlıq`,
              counts.quizzes > 0 && `${counts.quizzes} test`,
              counts.gameLinks > 0 && `${counts.gameLinks} video/oyin`,
            ].filter(Boolean).join(' · ');

            return (
              <Col key={topic.id} xs={24} sm={12} md={8} lg={6} style={{ display: 'flex' }}>
                <div
                  className="min-card"
                  onClick={() => navigate(`/topics/${topic.id}`)}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
                >
                  <div style={{ height: 110, overflow: 'hidden', background: 'var(--accent-soft)', position: 'relative' }}>
                    {topic.coverImage ? (
                      <img
                        src={topic.coverImage}
                        alt={topic.title}
                        className="gray-img"
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <LeafOutline size={52} color="var(--accent)" strokeWidth={1} style={{ opacity: 0.45 }} />
                      </div>
                    )}
                    {/* Indeks — rasm ustida, joy tejash uchun */}
                    <span
                      className="mono-index"
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        background: 'rgba(255,255,255,0.92)',
                        color: 'var(--accent-ink)',
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {topic.has3DModel && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          color: '#fff',
                          background: 'var(--accent)',
                          borderRadius: 999,
                          padding: '2px 8px',
                        }}
                      >
                        3D
                      </span>
                    )}
                  </div>

                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <h3
                      style={{
                        fontSize: 14.5,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.35,
                        margin: 0,
                        color: 'var(--ink)',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {topic.title}
                    </h3>

                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px solid var(--line)',
                        paddingTop: 10,
                        marginTop: 'auto',
                      }}
                    >
                      <span style={{ fontSize: 11.5, color: 'var(--muted)' }}>{meta || 'Tez arada'}</span>
                      <ArrowRightOutlined className="arrow" style={{ fontSize: 12, color: 'var(--accent-ink)' }} />
                    </div>
                  </div>
                </div>
              </Col>
            );
          })}
        </Row>
      </div>
    </div>
  );
};

export default Topics;
