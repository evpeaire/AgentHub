import { Link } from 'react-router-dom';
import { useGitHubAuth } from '../auth/GitHubAuth';

export default function Navbar() {
  const { user, isAuthenticated, login, logout, isLoading } = useGitHubAuth();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="navbar-logo" />
          <span className="navbar-title">Microsoft Agent Hub</span>
        </Link>
        <div className="navbar-links">
          <Link to="/" className="nav-link">Explore</Link>
          {isAuthenticated && <Link to="/submit" className="nav-link nav-link-cta">Submit Agent</Link>}
        </div>
        <div className="navbar-right">
          {isAuthenticated && user ? (
            <div className="auth-info">
              <img src={user.avatar_url} alt="" className="avatar-img" />
              <span className="avatar-name">{user.name || user.login}</span>
              <button className="btn btn-ghost btn-sm" onClick={logout}>Sign out</button>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={login} disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in with GitHub'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
