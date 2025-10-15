import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import LoginScreen from './components/Login';
import Dashboard from './components/Dashboard';
import CreateAccount from './components/CreateAccount'; 
import { useUser } from './context/UserContext'; 

function App() {
  const { setUser } = useUser();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    (async () => {
      try {
        const res = await fetch('http://localhost:3000/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;

        const me = await res.json();
        setUser({
          id: me.id,
          username: me.username,
          role: String(me.role).toLowerCase(), 
        });
      } catch {

      }
    })();
  }, [setUser]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Routes>
        <Route path="/" element={<LoginScreen />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-account" element={<CreateAccount />} /> 
      </Routes>
    </div>
  );
}

export default App;