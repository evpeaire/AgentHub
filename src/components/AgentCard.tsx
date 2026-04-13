import { Link } from 'react-router-dom';
import { AgentSummary } from '../types';
import QualityBadge from './QualityBadge';

interface AgentCardProps {
  agent: AgentSummary;
}

export default function AgentCard({ agent }: AgentCardProps) {
  return (
    <Link to={`/agent/${agent.id}`} className="agent-card">
      <div className="agent-card-header">
        <div className="agent-card-icon">
          <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" width="20" height="20" />
        </div>
        <div className="agent-card-meta">
          <h3 className="agent-card-name">{agent.name}</h3>
          <span className="agent-card-author">{agent.author}</span>
        </div>
        {agent.qualityScore !== undefined && agent.qualityScore > 0 && (
          <QualityBadge score={agent.qualityScore} size="sm" />
        )}
      </div>
      <p className="agent-card-desc">{agent.description}</p>
      <div className="agent-card-tags">
        {agent.category && <span className="label label-category">{agent.category}</span>}
        {agent.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="label">{tag}</span>
        ))}
        {agent.tags.length > 3 && <span className="label label-muted">+{agent.tags.length - 3}</span>}
      </div>
      <div className="agent-card-footer">
        {agent.solutionFileName && (
          <span className="label label-success" title="Solution available">Solution</span>
        )}
        <span className="agent-card-date">{new Date(agent.createdAt).toLocaleDateString()}</span>
      </div>
    </Link>
  );
}
