import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowRightOutlined } from '@ant-design/icons';
import { getCategories } from '../../api/categories';
import { Leaf, LeafOutline } from '../../components/Decor/Leaf';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { data: categories = [], isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories });

  if (isLoading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '10px 0 48px',
      }}
    >
      <div className="page fade-in-up" style={{ width: '100%', maxWidth: 920 }}>
        {/* Markazlashgan sarlavha — kartalar bilan bitta kompozitsiyada */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <span className="eyebrow" style={{fontSize: '28px'}} ><Leaf size={40} /> Bo'limlar</span>
          <h1 className="display" style={{ fontSize: 'clamp(30px, 4vw, 46px)', margin: '12px 0 10px' }}>
            Nimani <em>o'rganamiz?</em>
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 14.5, margin: '0 auto', maxWidth: 420 }}>
            O'rganishni xohlagan bo'limingizni tanlang
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginTop: 22 }}>
            <span style={{ width: 56, height: 1, background: 'var(--line)' }} />
            <Leaf size={13} style={{ opacity: 0.7 }} />
            <span style={{ width: 56, height: 1, background: 'var(--line)' }} />
          </div>
        </div>

        <Row gutter={[24, 24]}>
          {categories.map((cat, index) => (
            <Col key={cat.id} xs={24} md={12}>
              <div
                className="min-card"
                onClick={() => navigate(`/categories/${cat.slug}`)}
                style={{ position: 'relative', height: 'clamp(240px, 36vh, 320px)' }}
              >
                {/* To'liq qoplama rasm */}
                {cat.imageUrl ? (
                  <img
                    src={cat.imageUrl}
                    alt={cat.name}
                    className="gray-img"
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'linear-gradient(160deg, var(--accent-soft), #d4ecd9)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <LeafOutline size={110} color="var(--accent)" strokeWidth={0.9} style={{ opacity: 0.4 }} />
                  </div>
                )}

                {/* Pastdan to'q yashil gradient — matn o'qilishi uchun */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(180deg, rgba(11,58,35,0) 35%, rgba(11,58,35,0.55) 65%, rgba(11,58,35,0.92) 100%)',
                  }}
                />

                {/* Indeks chip — yuqori chapda */}
                <span
                  className="mono-index"
                  style={{
                    position: 'absolute',
                    top: 18,
                    left: 18,
                    background: 'rgba(255,255,255,0.9)',
                    color: 'var(--accent-ink)',
                    padding: '5px 12px',
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                >
                  {String(index + 1).padStart(2, '0')}
                </span>

                {/* Kontent — pastda */}
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '0 22px 18px' }}>
                  <h2
                    style={{
                      color: '#fff',
                      fontSize: 'clamp(20px, 2.2vw, 26px)',
                      fontWeight: 750,
                      letterSpacing: '-0.02em',
                      margin: 0,
                      lineHeight: 1.15,
                    }}
                  >
                    {cat.name}
                  </h2>
                  {cat.description && (
                    <p
                      style={{
                        color: 'rgba(255,255,255,0.78)',
                        fontSize: 13,
                        lineHeight: 1.55,
                        margin: '6px 0 0',
                        maxWidth: 380,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {cat.description}
                    </p>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255,255,255,0.22)',
                      paddingTop: 12,
                      marginTop: 12,
                    }}
                  >
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                      <Leaf size={12} color="#8fd0a8" /> {cat._count?.topics ?? 0} mavzu
                    </span>
                    <span className="arrow-cue" style={{ color: '#fff' }}>
                      O'rganish <ArrowRightOutlined className="arrow" style={{ fontSize: 12 }} />
                    </span>
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );
};

export default Categories;
