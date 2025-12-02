import { useState } from 'react';
import { useAuth } from '../AuthContext';

interface LoginProps {
  onSuccess?: () => void;
}

export default function Login({ onSuccess }: LoginProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate input
    if (!username || !password) {
      setError('Please enter both username and password');
      setLoading(false);
      return;
    }

    try {
      await login(username, password);
      // Clear form on success
      setUsername('');
      setPassword('');
      // Close modal on successful login
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <style>{`
        .login-form {
          max-width: 420px;
          margin: 3rem auto;
          padding: 2.5rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          font-family: var(--font-body);
        }

        .login-form h2 {
          font-family: var(--font-heading);
          font-size: 2rem;
          margin-bottom: 1.5rem;
          color: #1a1a1a;
          text-align: center;
        }

        .login-form .error {
          background-color: #fee2e2;
          border: 1px solid #ef4444;
          color: #dc2626;
          padding: 0.75rem;
          border-radius: 6px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .login-form .form-group {
          margin-bottom: 1.25rem;
        }

        .login-form label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: #374151;
        }

        .login-form input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .login-form input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .login-form button {
          width: 100%;
          padding: 0.875rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--font-body);
        }

        .login-form button:hover {
          background: #2563eb;
        }

        .login-form button:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .login-credentials {
          margin-top: 1rem;
          padding: 1rem;
          background: #f3f4f6;
          border-radius: 6px;
          font-size: 0.875rem;
          color: #4b5563;
        }

        .login-credentials h3 {
          font-family: var(--font-heading);
          font-size: 1rem;
          margin-bottom: 0.5rem;
          color: #374151;
        }

        .login-credentials p {
          margin: 0.25rem 0;
        }
      `}</style>

      <h2>Welcome Back</h2>
      {error && <div className="error">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <div className="login-credentials">
        <h3>Demo Credentials</h3>
        <p>Username: aarav</p>
        <p>Password: shah</p>
        <p>- or -</p>
        <p>Username: demo</p>
        <p>Password: password</p>
      </div>
    </div>
  );
}
