import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Button, Tabs, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import { LockOutlined, UserOutlined, EditOutlined } from '@ant-design/icons';
import { login, register } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Leaf } from '../../components/Decor/Leaf';

const MAX_ATTEMPTS = 5;
const LOCK_DURATION = 2 * 60 * 1000;

interface RateLimitData {
  attempts: number;
  lockedUntil: number | null;
}

function getRateLimit(): RateLimitData {
  try {
    const raw = sessionStorage.getItem('_rl');
    return raw ? JSON.parse(raw) : { attempts: 0, lockedUntil: null };
  } catch {
    return { attempts: 0, lockedUntil: null };
  }
}

function saveRateLimit(data: RateLimitData) {
  sessionStorage.setItem('_rl', JSON.stringify(data));
}

function clearRateLimit() {
  sessionStorage.removeItem('_rl');
}

const loginRules = [
  { required: true, message: 'Login kiriting!' },
  { min: 3, message: 'Kamida 3 ta belgi!' },
  { max: 50, message: 'Juda uzun!' },
  { pattern: /^[a-zA-Z0-9._@-]+$/, message: 'Faqat harf, raqam va . _ @ -' },
];

const passwordRules = [
  { required: true, message: 'Parol kiriting!' },
  { min: 6, message: 'Kamida 6 ta belgi!' },
  { max: 100, message: 'Juda uzun!' },
];

const Auth: React.FC<{ mode?: 'login' | 'register' }> = ({ mode = 'login' }) => {
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(mode);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockLeft, setLockLeft] = useState(0);
  const [shake, setShake] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const { message } = App.useApp();

  // /login ↔ /register o'rtasida o'tilganda komponent qayta mount bo'lmaydi,
  // shuning uchun tab mode prop'iga qarab sinxronlanadi
  useEffect(() => {
    setActiveTab(mode);
  }, [mode]);

  useEffect(() => {
    const rl = getRateLimit();
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      startLockTimer(rl.lockedUntil);
    } else if (rl.lockedUntil) {
      clearRateLimit();
    }
    setAttempts(rl.attempts || 0);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startLockTimer(until: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const left = Math.ceil((until - Date.now()) / 1000);
      if (left <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        clearRateLimit();
        setLockLeft(0);
        setAttempts(0);
      } else {
        setLockLeft(left);
      }
    }, 500);
  }

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 600);
  }

  const handleLogin = async (values: any) => {
    const rl = getRateLimit();
    if (rl.lockedUntil && Date.now() < rl.lockedUntil) {
      triggerShake();
      return;
    }

    setLoading(true);
    try {
      const data = await login({
        login: values.login.trim(),
        password: values.password,
      });
      clearRateLimit();
      message.success('Xush kelibsiz!');
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate(data.user.role === 'ADMIN' ? '/admin' : '/categories');
    } catch (error: any) {
      const newAttempts = (rl.attempts || 0) + 1;
      const lockedUntil = newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCK_DURATION : null;
      saveRateLimit({ attempts: newAttempts, lockedUntil });
      setAttempts(newAttempts);
      if (lockedUntil) startLockTimer(lockedUntil);
      triggerShake();

      if (newAttempts >= MAX_ATTEMPTS) {
        message.error("Juda ko'p urinish! 2 daqiqa kuting.");
      } else {
        const left = MAX_ATTEMPTS - newAttempts;
        message.error(
          error.response?.data?.message ||
            `Login yoki parol xato. ${left} ta urinish qoldi.`
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (values: any) => {
    setLoading(true);
    try {
      const data = await register({
        name: values.name.trim(),
        login: values.login.trim(),
        password: values.password,
      });
      clearRateLimit();
      message.success("Ro'yxatdan muvaffaqiyatli o'tdingiz!");
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/categories');
    } catch (error: any) {
      triggerShake();
      message.error(error.response?.data?.message || "Ro'yxatdan o'tishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const isLocked = lockLeft > 0;

  return (
    <>
      <style>{`
        .auth-page {
          min-height: calc(100vh - 64px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 16px;
        }
        .auth-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: var(--leaf-radius);
          padding: 36px 36px 28px;
          width: 100%;
          max-width: 400px;
        }
        .auth-card.shake {
          animation: shake 0.6s cubic-bezier(.36,.07,.19,.97);
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0) }
          15%      { transform: translateX(-7px) }
          30%      { transform: translateX(7px) }
          50%      { transform: translateX(-5px) }
          70%      { transform: translateX(5px) }
          90%      { transform: translateX(-2px) }
        }
        .auth-lockbar {
          border: 1px solid #f0b4b0;
          background: #fdf3f2;
          border-radius: 4px;
          padding: 10px 14px;
          margin-top: 8px;
          font-size: 13px;
          color: #b62b23;
          text-align: center;
        }
      `}</style>

      <div className="auth-page">
        <div className={`auth-card${shake ? ' shake' : ''} fade-in-up`}>
          <div style={{ marginBottom: 20 }}>
            <Leaf size={22} style={{ marginBottom: 10 }} />
            <h1 style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--ink)' }}>
              Biometod<span style={{ color: 'var(--accent)' }}> AI</span>
            </h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Aqlli biologiya ta'limi platformasi
            </p>
          </div>

          <Tabs
            activeKey={activeTab}
            onChange={(k) => {
              setActiveTab(k as 'login' | 'register');
              // Tab almashganda URL ham mos ravishda yangilanadi
              navigate(k === 'login' ? '/login' : '/register', { replace: true });
            }}
            items={[
              {
                key: 'login',
                label: 'Kirish',
                children: (
                  <Form name="login" onFinish={handleLogin} autoComplete="off" layout="vertical" requiredMark={false}>
                    <Form.Item name="login" label="Login" rules={loginRules}>
                      <Input
                        size="large"
                        prefix={<UserOutlined style={{ color: 'var(--muted)' }} />}
                        placeholder="Loginni kiriting"
                        disabled={isLocked}
                        autoComplete="username"
                      />
                    </Form.Item>
                    <Form.Item name="password" label="Parol" rules={passwordRules}>
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: 'var(--muted)' }} />}
                        placeholder="Parolni kiriting"
                        disabled={isLocked}
                        autoComplete="current-password"
                      />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 8 }}>
                      <Button type="primary" htmlType="submit" block size="large" loading={loading} disabled={isLocked} style={{ height: 46 }}>
                        {isLocked ? `${lockLeft} soniya kuting` : 'Kirish'}
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
              {
                key: 'register',
                label: "Ro'yxatdan o'tish",
                children: (
                  <Form name="register" onFinish={handleRegister} autoComplete="off" layout="vertical" requiredMark={false}>
                    <Form.Item
                      name="name"
                      label="To'liq ismingiz"
                      rules={[
                        { required: true, message: 'Ismingizni kiriting!' },
                        { min: 3, message: 'Kamida 3 ta belgi!' },
                        { max: 80, message: 'Juda uzun!' },
                      ]}
                    >
                      <Input
                        size="large"
                        prefix={<EditOutlined style={{ color: 'var(--muted)' }} />}
                        placeholder="Ism va familiyangiz"
                        disabled={loading}
                      />
                    </Form.Item>
                    <Form.Item name="login" label="Login" rules={loginRules}>
                      <Input
                        size="large"
                        prefix={<UserOutlined style={{ color: 'var(--muted)' }} />}
                        placeholder="Yangi login"
                        disabled={loading}
                        autoComplete="username"
                      />
                    </Form.Item>
                    <Form.Item name="password" label="Parol" rules={passwordRules}>
                      <Input.Password
                        size="large"
                        prefix={<LockOutlined style={{ color: 'var(--muted)' }} />}
                        placeholder="Yangi parol"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: 8 }}>
                      <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ height: 46 }}>
                        Ro'yxatdan o'tish
                      </Button>
                    </Form.Item>
                  </Form>
                ),
              },
            ]}
          />

          {isLocked && activeTab === 'login' && (
            <div className="auth-lockbar">
              Juda ko'p urinish — {lockLeft} soniya kutish kerak
            </div>
          )}

          {attempts > 0 && !isLocked && activeTab === 'login' && (
            <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted)', marginTop: 8 }}>
              {attempts} / {MAX_ATTEMPTS} urinish ishlatildi
            </p>
          )}

          <p style={{ marginTop: 18, textAlign: 'center', fontSize: 12, color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
            © {new Date().getFullYear()} Biometod AI · Ruxsatsiz kirish taqiqlanadi
          </p>
        </div>
      </div>
    </>
  );
};

export default Auth;
