import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGitHubAuth } from '../auth/GitHubAuth';
import { submitAgentViaPR } from '../services/github';
import { AgentFormData, Topic, AgentTool, PowerAutomateFlow, AdditionalSection } from '../types';

const CATEGORY_OPTIONS = [
  'HR', 'IT Support', 'Sales', 'Customer Service', 'Finance',
  'Legal', 'Marketing', 'Operations', 'Education', 'Healthcare', 'Other',
];

export default function SubmitAgent() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, login } = useGitHubAuth();

  const [form, setForm] = useState<AgentFormData>({
    name: '', description: '', overview: '', instructions: '',
    tags: [], category: '', githubUrl: '',
    topics: [], tools: [], powerAutomateFlows: [], additionalSections: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<{ prUrl: string } | null>(null);
  const [activeSection, setActiveSection] = useState('basic');

  if (!isAuthenticated) {
    return (
      <div className="empty-state">
        <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="empty-sparkle" />
        <h2>Sign in required</h2>
        <p>Sign in with your GitHub account to submit an agent.</p>
        <button className="btn btn-primary" onClick={login}>Sign in with GitHub</button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="empty-state">
        <h2>Agent Submitted!</h2>
        <p>Your agent has been submitted as a Pull Request. It will appear on the site once a maintainer approves it.</p>
        <div className="submit-success-actions">
          <a href={success.prUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            View Pull Request
          </a>
          <button className="btn btn-outline" onClick={() => navigate('/')}>
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.description || !form.overview) {
      setError('Name, description, and overview are required.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const result = await submitAgentViaPR(form, token!, {
        login: user!.login,
        name: user!.name || user!.login,
      });
      setSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Failed to submit agent');
    } finally {
      setSubmitting(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const addTopic = () => {
    setForm({ ...form, topics: [...form.topics, { name: '', description: '', yamlContent: '', triggerPhrases: [] }] });
  };
  const updateTopic = (index: number, field: keyof Omit<Topic, 'id'>, value: any) => {
    const topics = [...form.topics];
    (topics[index] as any)[field] = value;
    setForm({ ...form, topics });
  };
  const removeTopic = (index: number) => {
    setForm({ ...form, topics: form.topics.filter((_, i) => i !== index) });
  };

  const addTool = () => {
    setForm({ ...form, tools: [...form.tools, { name: '', description: '', type: '' }] });
  };
  const updateTool = (index: number, field: keyof Omit<AgentTool, 'id'>, value: string) => {
    const tools = [...form.tools];
    (tools[index] as any)[field] = value;
    setForm({ ...form, tools });
  };
  const removeTool = (index: number) => {
    setForm({ ...form, tools: form.tools.filter((_, i) => i !== index) });
  };

  const addFlow = () => {
    setForm({
      ...form,
      powerAutomateFlows: [...form.powerAutomateFlows, { name: '', description: '', triggerType: '', purpose: '' }],
    });
  };
  const updateFlow = (index: number, field: keyof Omit<PowerAutomateFlow, 'id'>, value: string) => {
    const flows = [...form.powerAutomateFlows];
    (flows[index] as any)[field] = value;
    setForm({ ...form, powerAutomateFlows: flows });
  };
  const removeFlow = (index: number) => {
    setForm({ ...form, powerAutomateFlows: form.powerAutomateFlows.filter((_, i) => i !== index) });
  };

  const addSection = () => {
    setForm({ ...form, additionalSections: [...form.additionalSections, { title: '', content: '' }] });
  };
  const updateSection = (index: number, field: keyof Omit<AdditionalSection, 'id'>, value: string) => {
    const sections = [...form.additionalSections];
    (sections[index] as any)[field] = value;
    setForm({ ...form, additionalSections: sections });
  };
  const removeSection = (index: number) => {
    setForm({ ...form, additionalSections: form.additionalSections.filter((_, i) => i !== index) });
  };

  const sectionTabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'topics', label: `Topics (${form.topics.length})` },
    { id: 'tools', label: `Tools (${form.tools.length})` },
    { id: 'flows', label: `Flows (${form.powerAutomateFlows.length})` },
    { id: 'additional', label: 'Additional' },
  ];

  return (
    <div className="page-submit">
      <h1>Submit a new agent</h1>
      <p className="page-subtitle">
        Share your custom Copilot agent with the community. Your submission will create a Pull Request for review.
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-nav">
          {sectionTabs.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`form-nav-btn ${activeSection === s.id ? 'form-nav-btn-active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {activeSection === 'basic' && (
          <div className="form-section">
            <h2>Basic Information</h2>

            <div className="form-group">
              <label className="form-label">Agent Name *</label>
              <input type="text" className="form-input" value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., HR Benefits Assistant" required />
            </div>

            <div className="form-group">
              <label className="form-label">Short Description *</label>
              <input type="text" className="form-input" value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="A brief one-line description of what the agent does" required />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-input" value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select a category...</option>
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">GitHub Repository</label>
              <input type="url" className="form-input" value={form.githubUrl || ''}
                onChange={(e) => setForm({ ...form, githubUrl: e.target.value })}
                placeholder="https://github.com/username/repo" />
              <span className="form-hint">Optional. Link to the agent source or docs.</span>
            </div>

            <div className="form-group">
              <label className="form-label">Overview *</label>
              <textarea className="form-textarea" value={form.overview}
                onChange={(e) => setForm({ ...form, overview: e.target.value })}
                placeholder="Detailed overview — what problem it solves, who it's for, key capabilities..."
                rows={6} required />
            </div>

            <div className="form-group">
              <label className="form-label">Instructions</label>
              <textarea className="form-textarea" value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                placeholder="The system instructions / prompt that powers this agent..."
                rows={6} />
            </div>

            <div className="form-group">
              <label className="form-label">Tags</label>
              <div className="tag-input-wrap">
                <input type="text" className="form-input" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  placeholder="Type a tag and press Enter" />
                <button type="button" className="btn btn-outline btn-sm" onClick={addTag}>Add</button>
              </div>
              {form.tags.length > 0 && (
                <div className="tag-list">
                  {form.tags.map((tag) => (
                    <span key={tag} className="tag-chip tag-chip-removable">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'topics' && (
          <div className="form-section">
            <div className="form-section-header">
              <h2>Topics</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={addTopic}>+ Add Topic</button>
            </div>
            <p className="form-hint">Define the conversation topics. Include the YAML so others can copy it.</p>

            {form.topics.map((topic, i) => (
              <div key={i} className="form-card">
                <div className="form-card-header">
                  <h3>Topic {i + 1}</h3>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTopic(i)}>Remove</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Topic Name</label>
                  <input type="text" className="form-input" value={topic.name}
                    onChange={(e) => updateTopic(i, 'name', e.target.value)} placeholder="e.g., Greeting" />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={topic.description}
                    onChange={(e) => updateTopic(i, 'description', e.target.value)}
                    placeholder="What does this topic do?" rows={3} />
                </div>
                <div className="form-group">
                  <label className="form-label">Trigger Phrases (comma separated)</label>
                  <input type="text" className="form-input" value={topic.triggerPhrases.join(', ')}
                    onChange={(e) => updateTopic(i, 'triggerPhrases', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                    placeholder="hello, hi, hey there" />
                </div>
                <div className="form-group">
                  <label className="form-label">Topic YAML</label>
                  <textarea className="form-textarea form-textarea-code" value={topic.yamlContent}
                    onChange={(e) => updateTopic(i, 'yamlContent', e.target.value)}
                    placeholder="Paste the topic YAML here..." rows={10} />
                </div>
              </div>
            ))}
            {form.topics.length === 0 && <p className="empty-message">No topics added yet.</p>}
          </div>
        )}

        {activeSection === 'tools' && (
          <div className="form-section">
            <div className="form-section-header">
              <h2>Tools</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={addTool}>+ Add Tool</button>
            </div>
            <p className="form-hint">List the connectors, plugins, or custom tools used by this agent.</p>

            {form.tools.map((tool, i) => (
              <div key={i} className="form-card">
                <div className="form-card-header">
                  <h3>Tool {i + 1}</h3>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeTool(i)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group form-group-flex">
                    <label className="form-label">Tool Name</label>
                    <input type="text" className="form-input" value={tool.name}
                      onChange={(e) => updateTool(i, 'name', e.target.value)} placeholder="e.g., SharePoint Connector" />
                  </div>
                  <div className="form-group form-group-small">
                    <label className="form-label">Type</label>
                    <select className="form-input" value={tool.type}
                      onChange={(e) => updateTool(i, 'type', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="connector">Connector</option>
                      <option value="custom-connector">Custom Connector</option>
                      <option value="ai-plugin">AI Plugin</option>
                      <option value="flow">Power Automate Flow</option>
                      <option value="api">Custom API</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={tool.description}
                    onChange={(e) => updateTool(i, 'description', e.target.value)}
                    placeholder="What does this tool do?" rows={2} />
                </div>
              </div>
            ))}
            {form.tools.length === 0 && <p className="empty-message">No tools added yet.</p>}
          </div>
        )}

        {activeSection === 'flows' && (
          <div className="form-section">
            <div className="form-section-header">
              <h2>Power Automate Flows</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={addFlow}>+ Add Flow</button>
            </div>
            {form.powerAutomateFlows.map((flow, i) => (
              <div key={i} className="form-card">
                <div className="form-card-header">
                  <h3>Flow {i + 1}</h3>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeFlow(i)}>Remove</button>
                </div>
                <div className="form-row">
                  <div className="form-group form-group-flex">
                    <label className="form-label">Flow Name</label>
                    <input type="text" className="form-input" value={flow.name}
                      onChange={(e) => updateFlow(i, 'name', e.target.value)} placeholder="e.g., Create Ticket Flow" />
                  </div>
                  <div className="form-group form-group-small">
                    <label className="form-label">Trigger Type</label>
                    <select className="form-input" value={flow.triggerType}
                      onChange={(e) => updateFlow(i, 'triggerType', e.target.value)}>
                      <option value="">Select...</option>
                      <option value="http">HTTP Request</option>
                      <option value="automated">Automated</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="instant">Instant (Manual)</option>
                      <option value="copilot">Copilot Plugin</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={flow.description}
                    onChange={(e) => updateFlow(i, 'description', e.target.value)}
                    placeholder="Describe what this flow does..." rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Purpose</label>
                  <input type="text" className="form-input" value={flow.purpose}
                    onChange={(e) => updateFlow(i, 'purpose', e.target.value)}
                    placeholder="Why is this flow needed?" />
                </div>
              </div>
            ))}
            {form.powerAutomateFlows.length === 0 && <p className="empty-message">No flows added yet.</p>}
          </div>
        )}

        {activeSection === 'additional' && (
          <div className="form-section">
            <div className="form-section-header">
              <h2>Additional Sections</h2>
              <button type="button" className="btn btn-primary btn-sm" onClick={addSection}>+ Add Section</button>
            </div>
            {form.additionalSections.map((section, i) => (
              <div key={i} className="form-card">
                <div className="form-card-header">
                  <h3>Section {i + 1}</h3>
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => removeSection(i)}>Remove</button>
                </div>
                <div className="form-group">
                  <label className="form-label">Section Title</label>
                  <input type="text" className="form-input" value={section.title}
                    onChange={(e) => updateSection(i, 'title', e.target.value)} placeholder="e.g., Prerequisites" />
                </div>
                <div className="form-group">
                  <label className="form-label">Content</label>
                  <textarea className="form-textarea" value={section.content}
                    onChange={(e) => updateSection(i, 'content', e.target.value)}
                    placeholder="Section content..." rows={5} />
                </div>
              </div>
            ))}
            {form.additionalSections.length === 0 && <p className="empty-message">No additional sections.</p>}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={() => navigate('/')}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Agent (opens PR)'}
          </button>
        </div>
      </form>
    </div>
  );
}
