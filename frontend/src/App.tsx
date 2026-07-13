import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme, Spin, App as AntApp } from 'antd';
import uzUZ from 'antd/locale/uz_UZ';
import ClientLayout from './components/Layout/ClientLayout';
import AdminLayout from './components/Layout/AdminLayout';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 * 5, retry: 1 } },
});

const Home = lazy(() => import('./pages/Home'));
const Categories = lazy(() => import('./pages/Categories'));
const Topics = lazy(() => import('./pages/Topics'));
const TopicDetail = lazy(() => import('./pages/TopicDetail'));
const Auth = lazy(() => import('./pages/Auth'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const AdminSubjects = lazy(() => import('./pages/Admin/Subjects'));
const AdminCategories = lazy(() => import('./pages/Admin/Categories'));
const AdminTopics = lazy(() => import('./pages/Admin/Topics'));
const AdminMaterials = lazy(() => import('./pages/Admin/Materials'));
const AdminInfographics = lazy(() => import('./pages/Admin/Infographics'));
const AdminInteractives = lazy(() => import('./pages/Admin/Interactives'));
const AdminQuizzes = lazy(() => import('./pages/Admin/Quizzes'));
const AdminGames = lazy(() => import('./pages/Admin/Games'));
const AdminPlayGames = lazy(() => import('./pages/Admin/PlayGames'));
const AdminStudents = lazy(() => import('./pages/Admin/Students'));

const RequireAdmin: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore();
  if (!user || user.role !== 'ADMIN') return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Loader = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--bg)' }}>
    <Spin size="large" />
  </div>
);

const App: React.FC = () => {
  const mode = useThemeStore((s) => s.mode);
  const dark = mode === 'dark';

  return (
  <QueryClientProvider client={queryClient}>
    <ConfigProvider
      locale={uzUZ}
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: dark ? '#2fb56b' : '#1b8a4e',
          colorLink: dark ? '#2fb56b' : '#1b8a4e',
          colorText: dark ? '#e8f1ea' : '#14291b',
          colorTextSecondary: dark ? '#9cb2a2' : '#5d7263',
          colorBorder: dark ? '#2a3a2f' : '#dceade',
          colorBorderSecondary: dark ? '#233129' : '#e6f0e8',
          colorBgLayout: dark ? '#0f1712' : '#f5faf5',
          colorBgContainer: dark ? '#16211a' : '#ffffff',
          colorBgElevated: dark ? '#1b2820' : '#ffffff',
          borderRadius: 8,
          fontFamily: "'Inter', system-ui, 'Segoe UI', Roboto, sans-serif",
        },
        components: {
          Button: { fontWeight: 600, defaultShadow: 'none', primaryShadow: 'none', borderRadius: 999, borderRadiusLG: 999, borderRadiusSM: 999 },
          Table: { headerBg: 'transparent', headerSplitColor: 'transparent' },
          Tabs: { itemSelectedColor: dark ? '#e8f1ea' : '#14291b', inkBarColor: dark ? '#2fb56b' : '#1b8a4e', titleFontSize: 14 },
          Menu: {
            itemBg: 'transparent',
            itemSelectedBg: dark ? '#2fb56b' : '#1b8a4e',
            itemSelectedColor: '#ffffff',
            itemHoverBg: 'rgba(47, 181, 107, 0.14)',
            itemColor: dark ? '#b9cabe' : '#3d5245',
            itemBorderRadius: 8,
          },
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route element={<ClientLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/categories/:slug" element={<Topics />} />
                <Route path="/topics/:id" element={<TopicDetail />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/login" element={<Auth mode="login" />} />
                <Route path="/register" element={<Auth mode="register" />} />
              </Route>
              <Route element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route path="/admin" element={<Dashboard />} />
                <Route path="/admin/subjects" element={<AdminSubjects />} />
                <Route path="/admin/categories" element={<AdminCategories />} />
                <Route path="/admin/topics" element={<AdminTopics />} />
                <Route path="/admin/materials" element={<AdminMaterials />} />
                <Route path="/admin/infographics" element={<AdminInfographics />} />
                <Route path="/admin/interactives" element={<AdminInteractives />} />
                <Route path="/admin/quizzes" element={<AdminQuizzes />} />
                <Route path="/admin/games" element={<AdminGames />} />
                <Route path="/admin/play-games" element={<AdminPlayGames />} />
                <Route path="/admin/students" element={<AdminStudents />} />
              </Route>
              {/* Noma'lum URL — bosh sahifaga qaytariladi */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  </QueryClientProvider>
  );
};

export default App;
