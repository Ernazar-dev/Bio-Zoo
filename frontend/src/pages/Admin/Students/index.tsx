import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Typography, Tag, Avatar, Input, Row, Col } from 'antd';
import { SearchOutlined, TrophyOutlined, TeamOutlined, RiseOutlined, StarOutlined } from '@ant-design/icons';
import { getAllStudents } from '../../../api/users';

const { Title, Text } = Typography;

const AVATAR_COLORS = ['#1b8a4e', '#2f6f4f', '#4a8c2a', '#0f766e', '#5b8a1b', '#166534'];

const initialsOf = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?';

const colorOf = (name: string) => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const MEDALS = ['🥇', '🥈', '🥉'];

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 14,
    background: 'var(--accent-soft)', border: '1px solid var(--line)',
    borderRadius: 'var(--leaf-radius)', padding: '14px 18px', height: '100%',
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 12, flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--surface)', color: 'var(--accent)', fontSize: 20,
      border: '1px solid var(--line)',
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 22, fontWeight: 750, color: 'var(--ink)', lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--muted)' }}>{label}</div>
    </div>
  </div>
);

const AdminStudents: React.FC = () => {
  const { data = [], isLoading } = useQuery({ queryKey: ['students'], queryFn: getAllStudents });
  const [search, setSearch] = useState('');

  const students = useMemo(
    () => data
      .filter((u: any) => u.role === 'STUDENT')
      .sort((a: any, b: any) => (b.points ?? 0) - (a.points ?? 0)),
    [data],
  );

  // Reyting jadval saralashidan mustaqil bo'lishi uchun ball bo'yicha oldindan hisoblanadi
  const rankById = useMemo(() => {
    const map: Record<string, number> = {};
    students.forEach((s: any, i: number) => { map[s.id] = i + 1; });
    return map;
  }, [students]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return students;
    return students.filter((s: any) =>
      s.name?.toLowerCase().includes(q) || s.login?.toLowerCase().includes(q));
  }, [students, search]);

  const totalPoints = students.reduce((sum: number, s: any) => sum + (s.points ?? 0), 0);
  const last30days = students.filter((s: any) =>
    Date.now() - new Date(s.createdAt).getTime() < 30 * 24 * 60 * 60 * 1000).length;

  const cols = [
    {
      title: '№', key: 'rank', width: 64, align: 'center' as const,
      render: (r: any) => {
        const rank = rankById[r.id];
        return rank <= 3
          ? <span style={{ fontSize: 20 }}>{MEDALS[rank - 1]}</span>
          : <Text type="secondary">{rank}</Text>;
      },
    },
    {
      title: 'Student', key: 'name',
      render: (r: any) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar style={{ background: colorOf(r.name || ''), flexShrink: 0 }}>
            {initialsOf(r.name || '')}
          </Avatar>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)' }}>{r.name}</div>
            <div style={{ color: 'var(--muted)', fontSize: 12 }}>@{r.login}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Ball', dataIndex: 'points', key: 'points', width: 130,
      render: (p: number) => (
        <Tag icon={<TrophyOutlined />} color="green" style={{ fontWeight: 600 }}>
          {p ?? 0} ball
        </Tag>
      ),
      sorter: (a: any, b: any) => (a.points ?? 0) - (b.points ?? 0),
      defaultSortOrder: 'descend' as any,
    },
    {
      title: "Ro'yxatdan o'tgan", dataIndex: 'createdAt', key: 'createdAt', width: 170,
      render: (d: string) => new Date(d).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' }),
      sorter: (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
  ];

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 4, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Studentlar</Title>
        <Input
          allowClear
          prefix={<SearchOutlined style={{ color: 'var(--muted)' }} />}
          placeholder="Ism yoki login bo'yicha qidirish"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 280 }}
        />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={8}>
          <StatCard icon={<TeamOutlined />} label="Jami studentlar" value={students.length} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard icon={<StarOutlined />} label="Jami to'plangan ball" value={totalPoints} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard icon={<RiseOutlined />} label="Oxirgi 30 kunda qo'shilgan" value={last30days} />
        </Col>
      </Row>

      <Table
        dataSource={filtered}
        columns={cols}
        rowKey="id"
        loading={isLoading}
        pagination={{
          pageSize: 10,
          showSizeChanger: false,
          showTotal: (total) => `Jami: ${total} ta student`,
        }}
        locale={{ emptyText: search ? 'Qidiruv bo\'yicha student topilmadi' : 'Hozircha studentlar yo\'q' }}
      />
    </div>
  );
};

export default AdminStudents;
