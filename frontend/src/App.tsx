import { FormEvent, useState } from 'react';
import { login } from './api';
import type { User } from './types';

export function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    setUser(null);
    setError('');
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(username, password);
      if (result.success && result.user) {
        setUser(result.user);
        setUsername('');
        setPassword('');
        return;
      }

      setError(result.message || 'Invalid credentials.');
    } catch {
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <main className="page dashboard-page">
        <section className="card dashboard-card">
          <h1>Learning</h1>
          <p className="welcome">Welcome, {user.displayName}</p>
          <button type="button" onClick={handleLogout} className="logout-button">
            Logout
          </button>
          <div className="grid">
            <article>
              <h2>Machine Learning</h2>
              <p>Prepare data pipelines, model training, and experiment tracking.</p>
            </article>
            <article>
              <h2>Deep Learning</h2>
              <p>Manage GPU workloads, neural architecture experiments, and model serving.</p>
            </article>
            <article>
              <h2>Reinforcement Learning</h2>
              <p>Design agents, simulation loops, rewards, and evaluation benchmarks.</p>
            </article>
            <article>
              <h2>AGI / ASI Research</h2>
              <p>Plan long-term intelligence workflows, safety checks, and scalable orchestration.</p>
            </article>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page login-page">
      <section className="card login-card">
        <h1>Learning</h1>
        <p className="subtitle">Sign in to continue</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
            autoComplete="username"
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />

          {error ? <p className="error">{error}</p> : null}

          <button type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </section>
    </main>
  );
}
