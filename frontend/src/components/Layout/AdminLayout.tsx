import React, { Suspense } from 'react';
import { Layout, Menu, Button, Spin } from 'antd';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom';
import {
  DashboardOutlined, AppstoreOutlined, BookOutlined,
  FileImageOutlined, QuestionCircleOutlined, VideoCameraOutlined,
  TeamOutlined, LogoutOutlined, RocketOutlined, ExperimentOutlined, PartitionOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../../store/authStore';
import { logout } from '../../api/auth';
import { Leaf } from '../Decor/Leaf';

const { Sider, Header, Content } = Layout;

const menuItems = [
  { key: '/admin', icon: <DashboardOutlined />, label: <Link to="/admin">Dashboard</Link> },
  { key: '/admin/subjects', icon: <ExperimentOutlined />, label: <Link to="/admin/subjects">Fanlar</Link> },
  { key: '/admin/categories', icon: <AppstoreOutlined />, label: <Link to="/admin/categories">Kategoriyalar</Link> },
  { key: '/admin/topics', icon: <BookOutlined />, label: <Link to="/admin/topics">Mavzular</Link> },
  { key: '/admin/materials', icon: <FileImageOutlined />, label: <Link to="/admin/materials">Materiallar</Link> },
  { key: '/admin/infographics', icon: <PartitionOutlined />, label: <Link to="/admin/infographics">Infografikalar</Link> },
  { key: '/admin/interactives', icon: <ExperimentOutlined />, label: <Link to="/admin/interactives">Interaktiv</Link> },
  { key: '/admin/quizzes', icon: <QuestionCircleOutlined />, label: <Link to="/admin/quizzes">Testlar</Link> },
  { key: '/admin/games', icon: <VideoCameraOutlined />, label: <Link to="/admin/games">Video darslar</Link> },
  { key: '/admin/play-games', icon: <RocketOutlined />, label: <Link to="/admin/play-games">O'yinlar</Link> },
  { key: '/admin/students', icon: <TeamOutlined />, label: <Link to="/admin/students">Studentlar</Link> },
];

const AdminLayout: React.FC = () => {
  const { refreshToken, logout: storeLogout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    if (refreshToken) await logout(refreshToken).catch(() => {});
    storeLogout();
    navigate('/login');
  };

  // Eng uzun mos kelgan yo'l tanlanadi — aks holda '/admin' hammasiga mos tushib qoladi
  const selectedKey = menuItems
    .map(i => i.key)
    .filter(k => location.pathname === k || location.pathname.startsWith(k + '/'))
    .sort((a, b) => b.length - a.length)[0] ?? '/admin';

  return (
    <Layout style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Sider width={230} style={{ background: 'var(--accent-soft)', borderRight: '1px solid var(--line)' }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Leaf size={16} />
          <span style={{ color: 'var(--ink)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em' }}>
            Biometod<span style={{ color: 'var(--accent)' }}> AI</span>
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', marginLeft: 2 }}>Admin</span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          style={{ marginTop: 8, border: 'none', background: 'transparent' }}
        />
      </Sider>
      <Layout style={{ background: 'var(--bg)' }}>
        <Header style={{
          background: 'var(--surface)',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          borderBottom: '1px solid var(--line)',
          height: 60,
        }}>
          <Button icon={<LogoutOutlined />} onClick={handleLogout}>Chiqish</Button>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
