import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Typography } from 'antd';
import { getCategories } from '../../../api/categories';
import { getTopics } from '../../../api/topics';
import { getAllStudents, getLeaderboard } from '../../../api/users';

const { Title } = Typography;

const panelStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  borderRadius: 4,
  padding: 24,
};

const Dashboard: React.FC = () => {
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories });
  const { data: topics = [] } = useQuery({ queryKey: ['topics-all'], queryFn: () => getTopics() });
  const { data: students = [] } = useQuery({ queryKey: ['students'], queryFn: getAllStudents });
  const { data: leaders = [] } = useQuery({ queryKey: ['leaderboard'], queryFn: getLeaderboard });

  const stats = [
    { title: 'Kategoriyalar', value: categories.length },
    { title: 'Mavzular', value: topics.length },
    { title: 'Studentlar', value: students.filter((s: any) => s.role === 'STUDENT').length },
    { title: "Eng ko'p ball", value: leaders[0]?.points ?? 0 },
  ];

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24, letterSpacing: '-0.02em' }}>Dashboard</Title>
      <Row gutter={[20, 20]}>
        {stats.map((s) => (
          <Col key={s.title} xs={24} sm={12} lg={6}>
            <div style={panelStyle}>
              <span className="eyebrow">{s.title}</span>
              <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-0.02em', color: 'var(--ink)', marginTop: 10, lineHeight: 1 }}>
                {s.value}
              </div>
            </div>
          </Col>
        ))}
      </Row>

      <Row gutter={[20, 20]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <div style={panelStyle}>
            <span className="eyebrow">Top 5 student</span>
            <div style={{ marginTop: 14 }}>
              {leaders.slice(0, 5).map((u: any, i: number) => (
                <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--ink)', fontSize: 14 }}>
                    <span className="mono-index" style={{ marginRight: 10 }}>{String(i + 1).padStart(2, '0')}</span>
                    {u.name}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>{u.points} ball</span>
                </div>
              ))}
            </div>
          </div>
        </Col>
        <Col xs={24} md={12}>
          <div style={panelStyle}>
            <span className="eyebrow">Kategoriyalar</span>
            <div style={{ marginTop: 14 }}>
              {categories.map((c: any) => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                  <span style={{ color: 'var(--ink)', fontSize: 14 }}>{c.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>{c._count?.topics ?? 0} mavzu</span>
                </div>
              ))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
