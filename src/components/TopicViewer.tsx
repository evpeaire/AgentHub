import { useState } from 'react';
import { Topic } from '../types';

interface TopicViewerProps {
  topics: Topic[];
}

export default function TopicViewer({ topics }: TopicViewerProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (yaml: string, id: string) => {
    try {
      await navigator.clipboard.writeText(yaml);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = yaml;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (topics.length === 0) {
    return <p className="empty-message">No topics have been added yet.</p>;
  }

  return (
    <div className="topic-list">
      {topics.map((topic) => (
        <div key={topic.id} className="topic-item">
          <button
            className="topic-header"
            onClick={() => setExpandedId(expandedId === topic.id ? null : topic.id)}
          >
            <div className="topic-header-left">
              <span className={`topic-chevron ${expandedId === topic.id ? 'topic-chevron-open' : ''}`}>
                &#9654;
              </span>
              <span className="topic-name">{topic.name}</span>
            </div>
            {topic.triggerPhrases.length > 0 && (
              <span className="topic-trigger-count">
                {topic.triggerPhrases.length} trigger{topic.triggerPhrases.length !== 1 ? 's' : ''}
              </span>
            )}
          </button>

          {expandedId === topic.id && (
            <div className="topic-detail">
              <p className="topic-description">{topic.description}</p>

              {topic.triggerPhrases.length > 0 && (
                <div className="topic-triggers">
                  <h5>Trigger Phrases:</h5>
                  <div className="trigger-list">
                    {topic.triggerPhrases.map((phrase, i) => (
                      <span key={i} className="trigger-phrase">"{phrase}"</span>
                    ))}
                  </div>
                </div>
              )}

              {topic.yamlContent && (
                <div className="topic-yaml">
                  <div className="yaml-header">
                    <h5>Topic YAML</h5>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleCopy(topic.yamlContent, topic.id)}
                    >
                      {copiedId === topic.id ? '✓ Copied!' : 'Copy YAML'}
                    </button>
                  </div>
                  <pre className="yaml-code">
                    <code>{topic.yamlContent}</code>
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
