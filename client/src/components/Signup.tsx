import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function Signup() {
  const { signup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signup(username, password);
    } catch (err: any) {
      setError(err?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '3rem auto', padding: '2rem', background: 'white', borderRadius: 8 }}>
      <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Create an account</h2>
      {error && <div style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} className="form-input" />
        </div>
        <div style={{ marginBottom: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: 4 }}>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="form-input" />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" disabled={loading} style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 6 }}>
            {loading ? 'Creating...' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
