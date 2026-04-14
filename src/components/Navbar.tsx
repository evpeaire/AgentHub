import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '../auth/GitHubAuth';

export default function Navbar() {
  const { user, isAuthenticated, login, logout, isLoading } = useGitHubAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
              <div className="user-menu-wrapper" ref={userMenuRef}>
                <button
                  className="avatar-link"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={user.login}
                >
                  <img src={user.avatar_url} alt="" className="avatar-img" />
                  <span className="avatar-name">{user.name || user.login}</span>
                </button>
                {showUserMenu && (
                  <div className="user-menu-dropdown">
                    <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>Profile</button>
                    <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>My Agents</button>
                    <button className="user-menu-item" onClick={() => { setShowUserMenu(false); navigate('/profile'); }}>Saved</button>
                    <div className="user-menu-divider" />
                    <button className="user-menu-item" onClick={() => { setShowUserMenu(false); logout(); }}>Sign out</button>
                  </div>
                )}
              </div>
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
