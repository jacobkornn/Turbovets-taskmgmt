import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateAccount() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [organization, setOrganization] = useState('');
  const [organizations, setOrganizations] = useState<{ id: number; name: string }[]>([]);
  const [notification, setNotification] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const navigate = useNavigate();

  // ✅ Fetch organizations from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/organizations');
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrganizations(data);
        }
      } catch (e) {
        console.error('Failed to load organizations', e);
      }
    })();
  }, []);

  const handleCreate = async () => {
    if (password !== confirm) {
      setNotification({ text: 'Passwords do not match', type: 'error' });
      return;
    }

    // ✅ Default to Organization C if none selected
    const selectedOrg =
      organization || organizations.find(o => o.name.toLowerCase() === 'organization c')?.id || 3;

    try {
      const res = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          organization: Number(selectedOrg),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.message?.includes('exists')) {
          setNotification({ text: 'Username already exists', type: 'error' });
        } else {
          setNotification({ text: 'Account creation failed', type: 'error' });
        }
        return;
      }

      navigate('/', { state: { fromSignup: true } });
    } catch {
      setNotification({ text: 'Network error. Please try again.', type: 'error' });
    }
  };

  const inputStyle = {
    width: '100%',
    marginBottom: '1rem',
    padding: '0.75rem',
    borderRadius: '12px',
    border: '1px solid #ccc',
    outline: 'none',
    fontSize: '1rem',
    fontFamily: 'inherit' as const,
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
          Create Account
        </h2>

        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />

        <input
          placeholder="Confirm Password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={inputStyle}
        />

        {/* ✅ Dynamic Organization Dropdown */}
        <select
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          style={inputStyle}
        >
          <option value="">Select Organization</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.name}
            </option>
          ))}
        </select>

        <button
          onClick={handleCreate}
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
          Create Account
        </button>

        <button
          onClick={() => navigate('/')}
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
          Cancel
        </button>
      </div>
    </div>
  );
}
