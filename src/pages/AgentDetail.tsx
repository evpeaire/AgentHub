import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { loadAgent } from '../services/data';
import { Agent } from '../types';
import TopicViewer from '../components/TopicViewer';
import QualityBadge from '../components/QualityBadge';
import GiscusComments from '../components/GiscusComments';
import { useFavorites } from '../hooks/useFavorites';

type TabId = 'overview' | 'instructions' | 'topics' | 'tools' | 'flows' | 'additional' | 'deploy' | 'discussion';

const CATEGORIES: Record<string, string> = {
  hr: 'HR', it: 'IT Support', sales: 'Sales', 'customer-service': 'Customer Service',
  finance: 'Finance', legal: 'Legal', marketing: 'Marketing', operations: 'Operations',
  education: 'Education', healthcare: 'Healthcare', other: 'Other',
};

function formatContent(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isFavorited, toggleFavorite } = useFavorites();
  const giscusRef = useRef<HTMLDivElement>(null);

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    loadAgent(id)
      .then((a) => {
        if (!a) setError('Agent not found');
        setAgent(a);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // Load giscus script when discussion tab is shown
  useEffect(() => {
    if (activeTab !== 'discussion' || !giscusRef.current || !id) return;

    const repo = import.meta.env.VITE_GISCUS_REPO || '';
    const repoId = import.meta.env.VITE_GISCUS_REPO_ID || '';
    const categoryId = import.meta.env.VITE_GISCUS_CATEGORY_ID || '';

    if (!repo || !repoId || !categoryId) return;

    // Clear previous
    giscusRef.current.innerHTML = '';

    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', repo);
    script.setAttribute('data-repo-id', repoId);
    script.setAttribute('data-category', 'Agent Discussions');
    script.setAttribute('data-category-id', categoryId);
    script.setAttribute('data-mapping', 'specific');
    script.setAttribute('data-term', id);
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '0');
    script.setAttribute('data-input-position', 'top');
    script.setAttribute('data-theme', 'dark_dimmed');
    script.setAttribute('data-lang', 'en');
    script.setAttribute('data-loading', 'lazy');
    script.crossOrigin = 'anonymous';
    script.async = true;
    giscusRef.current.appendChild(script);
  }, [activeTab, id]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner" />
        <p>Loading agent...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="empty-state">
        <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="empty-sparkle" />
        <h2>Agent not found</h2>
        <p>{error || 'The agent you are looking for does not exist.'}</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>Back to Browse</button>
      </div>
    );
  }

  const topics = agent.topics || [];
  const tools = agent.tools || [];
  const flows = agent.powerAutomateFlows || [];
  const sections = agent.additionalSections || [];

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'instructions', label: 'Instructions' },
    { id: 'topics', label: 'Topics', count: topics.length },
    { id: 'tools', label: 'Tools', count: tools.length },
    { id: 'flows', label: 'Power Automate Flows', count: flows.length },
    ...(sections.length > 0
      ? [{ id: 'additional' as TabId, label: 'Additional Info', count: sections.length }]
      : []),
    ...(agent.solutionFileName
      ? [{ id: 'deploy' as TabId, label: 'Deploy Guide' }]
      : []),
    { id: 'discussion', label: 'Discussion' },
  ];

  return (
    <div className="page-detail">
      <button className="btn btn-outline btn-sm back-btn" onClick={() => navigate('/')}>
        &larr; Back to Browse
      </button>

      <div className="detail-header">
        <div className="detail-header-left">
          <div className="detail-icon">
            <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" width="32" height="32" />
          </div>
          <div>
            <h1 className="detail-name">{agent.name}</h1>
            <p className="detail-author">
              by {agent.author}
              {agent.authorEmail && <span className="author-email"> ({agent.authorEmail})</span>}
              {' '}&middot; {new Date(agent.createdAt).toLocaleDateString()}
              {agent.updatedAt !== agent.createdAt && (
                <span className="detail-updated"> &middot; Updated {new Date(agent.updatedAt).toLocaleDateString()}</span>
              )}
            </p>
            {agent.forkedFromId && (
              <p className="detail-forked">
                Forked from <Link to={`/agent/${agent.forkedFromId}`}>{agent.forkedFromName}</Link>
              </p>
            )}
          </div>
        </div>
        <div className="detail-header-right">
          <button
            className={`btn btn-sm ${isFavorited(agent.id) ? 'btn-favorited' : 'btn-outline'}`}
            onClick={() => toggleFavorite(agent.id)}
            title={isFavorited(agent.id) ? 'Remove from favorites' : 'Add to favorites'}
          >
            {isFavorited(agent.id) ? '★ Saved' : '☆ Save'}
          </button>
        </div>
      </div>

      <p className="detail-description">{agent.description}</p>

      <div className="detail-meta-row">
        <div className="detail-tags">
          {agent.category && <span className="tag-chip tag-chip-category">{CATEGORIES[agent.category] || agent.category}</span>}
          {(agent.tags || []).map((tag) => (
            <span key={tag} className="tag-chip">{tag}</span>
          ))}
        </div>
        {agent.qualityScore !== undefined && agent.qualityScore > 0 && (
          <div className="detail-quality">
            <span className="detail-quality-label">Quality Score</span>
            <QualityBadge score={agent.qualityScore} size="lg" />
          </div>
        )}
      </div>

      {agent.solutionFileName && (
        <div className="solution-download">
          <span className="solution-icon">&#x1F4E6;</span>
          <div className="solution-info">
            <strong>Exported Solution Available</strong>
            <span className="solution-filename">{agent.solutionFileName}</span>
          </div>
          <a
            href={`${import.meta.env.BASE_URL}solutions/${encodeURIComponent(agent.solutionFileName)}`}
            download
            className="btn btn-primary"
          >
            &#x2B07; Download Solution
          </a>
        </div>
      )}

      {agent.githubUrl && /^https?:\/\//i.test(agent.githubUrl) && (
        <div className="github-link-section">
          <span className="github-icon">&#x1F4C2;</span>
          <div className="github-info">
            <strong>GitHub Repository</strong>
            <a href={agent.githubUrl} target="_blank" rel="noopener noreferrer" className="github-url">
              {agent.githubUrl}
            </a>
          </div>
        </div>
      )}

      <div className="detail-tabs">
        <div className="tab-bar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && <span className="tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>

        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="tab-panel">
              {agent.screenshotUrls && agent.screenshotUrls.length > 0 && (
                <div className="screenshot-gallery">
                  {agent.screenshotUrls.filter(url => /^https?:\/\//i.test(url)).map((url, i) => (
                    <img key={i} src={url} alt={`Screenshot ${i + 1}`} className="screenshot-img" />
                  ))}
                </div>
              )}
              <div className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(agent.overview) }} />
            </div>
          )}

          {activeTab === 'instructions' && (
            <div className="tab-panel">
              {agent.instructions ? (
                <div className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(agent.instructions) }} />
              ) : (
                <p className="empty-message">No instructions provided.</p>
              )}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="tab-panel">
              <TopicViewer topics={topics} />
            </div>
          )}

          {activeTab === 'tools' && (
            <div className="tab-panel">
              {tools.length === 0 ? (
                <p className="empty-message">No tools listed.</p>
              ) : (
                <div className="tool-list">
                  {tools.map((tool) => (
                    <div key={tool.id} className="tool-card">
                      <div className="tool-card-header">
                        <span className="tool-icon">&#x1F527;</span>
                        <h4>{tool.name}</h4>
                        <span className="tool-type">{tool.type}</span>
                      </div>
                      <p>{tool.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'flows' && (
            <div className="tab-panel">
              {flows.length === 0 ? (
                <p className="empty-message">No Power Automate flows listed.</p>
              ) : (
                <div className="flow-list">
                  {flows.map((flow) => (
                    <div key={flow.id} className="flow-card">
                      <div className="flow-card-header">
                        <span className="flow-icon">&#x26A1;</span>
                        <h4>{flow.name}</h4>
                        <span className="flow-trigger">{flow.triggerType}</span>
                      </div>
                      <p>{flow.description}</p>
                      {flow.purpose && (
                        <p className="flow-purpose"><strong>Purpose:</strong> {flow.purpose}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'additional' && (
            <div className="tab-panel">
              {sections.map((section) => (
                <div key={section.id} className="additional-section">
                  <h3>{section.title}</h3>
                  <div className="markdown-content" dangerouslySetInnerHTML={{ __html: formatContent(section.content) }} />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deploy' && (
            <div className="tab-panel">
              <div className="deploy-guide">
                <h3>How to Deploy This Agent</h3>
                <p>Follow these steps to import and deploy this Copilot agent in your own environment:</p>

                <div className="deploy-steps">
                  <div className="deploy-step">
                    <div className="deploy-step-num">1</div>
                    <div>
                      <h4>Download the Solution</h4>
                      <p>Click the "Download Solution" button above to get the exported solution file (.zip).</p>
                    </div>
                  </div>
                  <div className="deploy-step">
                    <div className="deploy-step-num">2</div>
                    <div>
                      <h4>Open Power Platform Admin Center</h4>
                      <p>Navigate to <strong>make.powerapps.com</strong> and select your target demo/dev environment.</p>
                    </div>
                  </div>
                  <div className="deploy-step">
                    <div className="deploy-step-num">3</div>
                    <div>
                      <h4>Import the Solution</h4>
                      <p>Go to <strong>Solutions &rarr; Import solution</strong>, upload the .zip file, and follow the wizard.</p>
                    </div>
                  </div>
                  <div className="deploy-step">
                    <div className="deploy-step-num">4</div>
                    <div>
                      <h4>Configure Connections</h4>
                      <p>After import, open the solution and configure any data connections to point to your tenant's resources.</p>
                    </div>
                  </div>
                  <div className="deploy-step">
                    <div className="deploy-step-num">5</div>
                    <div>
                      <h4>Publish &amp; Test</h4>
                      <p>Publish all customizations, then open <strong>Copilot Studio</strong> to test the agent.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="tab-panel">
              <div ref={giscusRef} className="giscus-container">
                <GiscusComments agentId={agent.id} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
