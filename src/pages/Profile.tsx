import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useGitHubAuth } from '../auth/GitHubAuth';
import { useFavorites } from '../hooks/useFavorites';
import { loadIndex, loadAgent } from '../services/data';
import { AgentSummary, Agent } from '../types';
import AgentCard from '../components/AgentCard';
import QualityBadge from '../components/QualityBadge';

type TabId = 'agents' | 'favorites' | 'activity';

export default function Profile() {
  const { user, isAuthenticated, login } = useGitHubAuth();
  const { favorites } = useFavorites();
  const [myAgents, setMyAgents] = useState<AgentSummary[]>([]);
  const [favoriteAgents, setFavoriteAgents] = useState<AgentSummary[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('agents');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    loadIndex()
      .then((index) => {
        // Find agents authored by this user
        const mine = index.agents.filter(
          (a) => a.author === user.login || a.author === user.name
        );
        setMyAgents(mine);

        // Find favorited agents
        const favs = index.agents.filter((a) => favorites.includes(a.id));
        setFavoriteAgents(favs);
      })
      .finally(() => setLoading(false));
  }, [user, favorites]);

  if (!isAuthenticated || !user) {
    return (
      <div className="empty-state">
        <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="empty-sparkle" />
        <h2>Sign in to view your profile</h2>
        <p>Sign in with your GitHub account to see your agents, favorites, and activity.</p>
        <button className="btn btn-primary" onClick={login}>Sign in with GitHub</button>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count: number }[] = [
    { id: 'agents', label: 'My Agents', count: myAgents.length },
    { id: 'favorites', label: 'Saved', count: favoriteAgents.length },
    { id: 'activity', label: 'Activity', count: 0 },
  ];

  return (
    <div className="page-profile">
      <div className="profile-header">
        <img src={user.avatar_url} alt="" className="profile-avatar-img" />
        <div className="profile-info">
          <h1 className="profile-name">{user.name || user.login}</h1>
          <p className="profile-login">@{user.login}</p>
          <a
            href={user.html_url}
            target="_blank"
            rel="noopener noreferrer"
            className="profile-github-link"
          >
            View GitHub Profile
          </a>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{myAgents.length}</span>
          <span className="profile-stat-label">Agents</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{favoriteAgents.length}</span>
          <span className="profile-stat-label">Saved</span>
        </div>
      </div>

      <div className="detail-tabs">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'agents' && (
            <div className="tab-panel">
              {loading ? (
                <div className="loading">
                  <div className="loading-spinner" />
                  <p>Loading...</p>
                </div>
              ) : myAgents.length === 0 ? (
                <div className="profile-empty">
                  <p>You haven't submitted any agents yet.</p>
                  <Link to="/submit" className="btn btn-primary">Submit Your First Agent</Link>
                </div>
              ) : (
                <div className="agent-grid">
                  {myAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="tab-panel">
              {favoriteAgents.length === 0 ? (
                <div className="profile-empty">
                  <p>No saved agents yet. Click the "Save" button on any agent to bookmark it here.</p>
                  <Link to="/" className="btn btn-outline">Browse Agents</Link>
                </div>
              ) : (
                <div className="agent-grid">
                  {favoriteAgents.map((agent) => (
                    <AgentCard key={agent.id} agent={agent} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="tab-panel">
              <div className="profile-activity">
                <p className="profile-activity-info">
                  Your discussion activity (comments, reactions) lives on GitHub Discussions.
                </p>
                <a
                  href={`https://github.com/evpeaire/AgentHub/discussions`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                >
                  View Discussions on GitHub
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
