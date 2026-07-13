import React, { Suspense, useEffect, useState } from 'react';
import { Layout, Button, Spin, Drawer } from 'antd';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogoutOutlined, MenuOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { logout } from '../../api/auth';
import { getMe } from '../../api/users';
import { Leaf, LeafOutline } from '../Decor/Leaf';

const { Header, Content } = Layout;

const navItems = [
  { key: '/', label: 'Bosh sahifa' },
  { key: '/categories', label: "Bo'limlar" },
  { key: '/leaderboard', label: 'Reyting' },
];

const Wordmark: React.FC<{ size?: number; light?: boolean }> = ({ size = 17, light = false }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
    <Leaf size={size + 1} color={light ? '#8fd0a8' : 'var(--accent)'} />
    <span style={{ color: light ? '#fff' : 'var(--ink)', fontSize: size, fontWeight: 800, letterSpacing: '-0.02em' }}>
      Biometod<span style={{ color: light ? '#8fd0a8' : 'var(--accent)' }}> AI</span>
    </span>
  </span>
);

const ClientLayout: React.FC = () => {
  const { user, refreshToken, logout: storeLogout, updatePoints } = useAuthStore();
  const { mode, toggle } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const [menuOpen, setMenuOpen] = useState(false);

  // Sahifa almashganda mobil menyu yopiladi
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  // Ballni serverdan real vaqtda yangilab turamiz: har 30 soniyada,
  // oynaga qaytganda va test topshirilganda ('me' query invalidatsiyasi orqali)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    enabled: !!user && user.role !== 'ADMIN',
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (me && user && me.points !== user.points) updatePoints(me.points);
  }, [me?.points]);

  const handleLogout = async () => {
    if (refreshToken) await logout(refreshToken).catch(() => {});
    storeLogout();
    navigate('/');
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
      <Header
        className="bz-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid var(--line)',
          height: 64,
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 48 }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
            <Wordmark />
          </Link>
          <nav className="bz-nav-desktop" style={{ display: 'flex', gap: 28 }}>
            {navItems.map((item) => {
              const active = location.pathname === item.key;
              return (
                <Link
                  key={item.key}
                  to={item.key}
                  style={{
                    color: active ? 'var(--accent-ink)' : 'var(--muted)',
                    fontWeight: active ? 600 : 500,
                    fontSize: 13.5,
                    textDecoration: 'none',
                    borderBottom: active ? '1px solid var(--accent)' : '1px solid transparent',
                    paddingBottom: 2,
                    transition: 'color 0.2s ease',
                  }}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Button
            type="text"
            shape="circle"
            onClick={toggle}
            aria-label={mode === 'light' ? 'Tungi rejim' : 'Kunduzgi rejim'}
            icon={mode === 'light' ? <MoonOutlined style={{ fontSize: 17 }} /> : <SunOutlined style={{ fontSize: 17, color: '#f6b93b' }} />}
          />
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <style>{`
                  .nav-points-value {
                    display: inline-block;
                    animation: nav-points-pop 0.45s ease;
                  }
                  @keyframes nav-points-pop {
                    0%   { transform: scale(1); }
                    40%  { transform: scale(1.15); color: var(--accent); }
                    100% { transform: scale(1); }
                  }
                `}</style>
                <Leaf size={11} color="var(--accent)" />
                <strong key={user.points} className="nav-points-value" style={{ color: 'var(--accent-ink)', fontWeight: 700 }}>{user.points}</strong> ball
              </span>
              <span className="bz-user-desktop" style={{ width: 1, height: 16, background: 'var(--line)' }} />
              <Link
                className="bz-user-desktop"
                to="/profile"
                style={{ fontSize: 13.5, fontWeight: 600, color: location.pathname === '/profile' ? 'var(--accent-ink)' : 'var(--ink)', textDecoration: 'none' }}
              >
                {user.name}
              </Link>
              <Button className="bz-user-desktop" type="text" size="small" icon={<LogoutOutlined />} onClick={handleLogout} aria-label="Chiqish" />
            </>
          ) : (
            <>
              <Button className="bz-user-desktop" type="text" onClick={() => navigate('/login')}>Kirish</Button>
              <Button className="bz-user-desktop" type="primary" onClick={() => navigate('/register')}>Ro'yxatdan o'tish</Button>
            </>
          )}
          {/* Mobil menyu tugmasi — faqat tor ekranlarda ko'rinadi */}
          <Button
            className="bz-burger"
            type="text"
            icon={<MenuOutlined style={{ fontSize: 18 }} />}
            onClick={() => setMenuOpen(true)}
            aria-label="Menyu"
          />
        </div>
      </Header>

      {/* Mobil navigatsiya menyusi */}
      <Drawer
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        placement="right"
        width={290}
        title={<Wordmark />}
        styles={{ body: { display: 'flex', flexDirection: 'column', padding: '16px 20px' } }}
      >
        <nav style={{ display: 'flex', flexDirection: 'column' }}>
          {navItems.map((item) => {
            const active = location.pathname === item.key;
            return (
              <Link
                key={item.key}
                to={item.key}
                onClick={() => setMenuOpen(false)}
                style={{
                  padding: '13px 12px',
                  borderRadius: 10,
                  fontSize: 15,
                  fontWeight: active ? 700 : 500,
                  color: active ? 'var(--accent-ink)' : 'var(--ink)',
                  background: active ? 'var(--accent-soft)' : 'transparent',
                  textDecoration: 'none',
                  marginBottom: 4,
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
          {user ? (
            <>
              <Link
                to="/profile"
                onClick={() => setMenuOpen(false)}
                style={{ display: 'block', marginBottom: 14, textDecoration: 'none' }}
              >
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{user.name}</div>
                <div style={{ fontSize: 13, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Leaf size={11} color="var(--accent)" />
                  <strong style={{ color: 'var(--accent-ink)' }}>{user.points}</strong> ball · Profilim
                </div>
              </Link>
              <Button block icon={<LogoutOutlined />} onClick={() => { setMenuOpen(false); handleLogout(); }}>
                Chiqish
              </Button>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button type="primary" block size="large" onClick={() => { setMenuOpen(false); navigate('/register'); }}>
                Ro'yxatdan o'tish
              </Button>
              <Button block size="large" onClick={() => { setMenuOpen(false); navigate('/login'); }}>
                Kirish
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      <Content style={{ background: 'transparent' }}>
        <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spin size="large" /></div>}>
          <Outlet />
        </Suspense>
      </Content>

      {!isAuthPage && (
        <footer
          className="bz-footer"
          style={{
            background: 'var(--accent-deep)',
            padding: '56px 32px 0',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Fon dekori — katta konturli barg */}
          <LeafOutline
            size={420}
            color="rgba(255,255,255,0.06)"
            strokeWidth={0.8}
            style={{ position: 'absolute', right: -80, bottom: -120 }}
          />

          <div style={{ maxWidth: 1520, margin: '0 auto', position: 'relative' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 32,
                paddingBottom: 40,
              }}
            >
              <div>
                <Wordmark size={16} light />
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, lineHeight: 1.7, marginTop: 12, maxWidth: 280 }}>
                  Biometod AI — biologiya fanlarini 3D modellar, interaktiv
                  testlar, AI yordamchi va video darsliklar orqali o'rganish
                  platformasi.
                </p>
              </div>

              <div>
                <span className="eyebrow" style={{ color: '#8fd0a8' }}>Sahifalar</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <Link to="/" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>Bosh sahifa</Link>
                  <Link to="/categories" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>Bo'limlar</Link>
                  <Link to="/leaderboard" style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13, textDecoration: 'none' }}>Reyting</Link>
                </div>
              </div>

              <div>
                <span className="eyebrow" style={{ color: '#8fd0a8' }}>Bo'limlar</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Umurtqasizlar</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Umurtqalilar</span>
                </div>
              </div>

              <div>
                <span className="eyebrow" style={{ color: '#8fd0a8' }}>Aloqa</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>info@biometod.ai</span>
                  <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: 13 }}>Toshkent, O'zbekiston</span>
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 12,
                padding: '18px 0',
                borderTop: '1px solid rgba(255,255,255,0.12)',
                fontSize: 12,
                color: 'rgba(255,255,255,0.45)',
              }}
            >
              <span>© {new Date().getFullYear()} Biometod AI — Barcha huquqlar himoyalangan</span>
              <span>Ta'lim maqsadida yaratilgan platforma</span>
            </div>
          </div>
        </footer>
      )}
    </Layout>
  );
};

export default ClientLayout;
