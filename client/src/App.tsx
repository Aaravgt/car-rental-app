import { useState } from 'react';
import Login from './Login';

export default function App() {
  const [user, setUser] = useState<string | null>(null);

  const handleLogin = (email: string) => {
    setUser(email);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #7b9acc 100%)',
      color: 'white'
    }}>
      <h1>Welcome to Car Rental System!</h1>
      <p style={{ marginTop: '16px', fontSize: '18px' }}>Logged in as: {user}</p>
      <button
        onClick={handleLogout}
        style={{
          marginTop: '24px',
          padding: '12px 24px',
          backgroundColor: 'white',
          color: '#2563eb',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
        }}
      >
        Log Out
      </button>
    </div>
  );
}