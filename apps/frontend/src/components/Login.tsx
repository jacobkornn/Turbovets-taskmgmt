import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToken } from '../context/TokenContext';
import { useUser } from '../context/UserContext';

function decodeJwt(token: string): { sub: number; username: string; role: string } {
  const [, payload] = token.split('.');
  const decoded = JSON.parse(atob(payload));
  return {
    sub: Number(decoded.sub),
    username: decoded.username,
    role: String(decoded.role).toLowerCase(),
  };
}

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notification, setNotification] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { setToken } = useToken();
  const { setUser } = useUser();

  // ✅ Show success notification if redirected from signup
  const fromSignup = location.state?.fromSignup;
  if (fromSignup && !notification) {
    setNotification({ text: 'New user created', type: 'success' });
    navigate(location.pathname, { replace: true, state: {} });
  }

  const handleLogin = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        setNotification({ text: 'Incorrect username or password, please try again.', type: 'error' });
        return;
      }

      const data = await res.json();
      const token = data.access_token;

      const isValidJwt = token && token.split('.').length === 3;
      if (isValidJwt) {
        localStorage.setItem('access_token', token);
        setToken(token);

        const claims = decodeJwt(token);
        setUser({
          id: claims.sub,
          username: claims.username,
          role: claims.role,
        });

        navigate('/dashboard');
      } else {
        setNotification({ text: 'Invalid token received.', type: 'error' });
      }
    } catch {
      setNotification({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        padding: '2rem',
        boxSizing: 'border-box',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {/* 🔔 Notification Banner */}
      {notification && (
        <div className={`notification ${notification.type}`}>{notification.text}</div>
      )}

      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          fontFamily: 'inherit',
        }}
      >
        <h2
          style={{
            marginBottom: '1.5rem',
            textAlign: 'center',
            fontSize: '1.5rem',
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          Sign In
        </h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '1rem',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid #ccc',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit',
          }}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: '100%',
            marginBottom: '1.5rem',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '1px solid #ccc',
            outline: 'none',
            fontSize: '1rem',
            fontFamily: 'inherit',
          }}
        />

        <button
          onClick={handleLogin}
          style={{
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#007aff',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Login
        </button>

        <button
          onClick={() => navigate('/create-account')}
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.75rem',
            backgroundColor: '#f2f2f7',
            color: '#333',
            border: '1px solid #ccc',
            borderRadius: '12px',
            fontSize: '1rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Create Account
        </button>
      </div>
    </div>
  );
}
