import { REPO_OWNER, REPO_NAME } from '../auth/GitHubAuth';
import { AgentFormData } from '../types';

const API = 'https://api.github.com';

function generateId(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60)
    + '-' + Date.now().toString(36);
}

/**
 * Submit an agent by creating a branch, committing the agent JSON, and opening a PR.
 * All done client-side via the GitHub API.
 */
export async function submitAgentViaPR(
  form: AgentFormData,
  token: string,
  author: { login: string; name: string; email?: string }
): Promise<{ prUrl: string }> {
  const agentId = generateId(form.name);
  const branchName = `add-agent/${agentId}`;

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
  };

  // 1. Get the default branch SHA
  const repoRes = await fetch(`${API}/repos/${REPO_OWNER}/${REPO_NAME}`, { headers });
  if (!repoRes.ok) throw new Error('Failed to access repository. Check VITE_REPO_OWNER and VITE_REPO_NAME.');
  const repo = await repoRes.json();
  const defaultBranch = repo.default_branch;

  const refRes = await fetch(`${API}/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${defaultBranch}`, { headers });
  if (!refRes.ok) throw new Error('Failed to get default branch ref');
  const ref = await refRes.json();
  const baseSha = ref.object.sha;

  // 2. Create a new branch
  const createRefRes = await fetch(`${API}/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      ref: `refs/heads/${branchName}`,
      sha: baseSha,
    }),
  });
  if (!createRefRes.ok) {
    const err = await createRefRes.json();
    throw new Error(`Failed to create branch: ${err.message}`);
  }

  // 3. Build the agent JSON
  const now = new Date().toISOString();
  const agent = {
    id: agentId,
    name: form.name,
    description: form.description,
    overview: form.overview,
    instructions: form.instructions,
    author: author.name || author.login,
    authorEmail: author.email || '',
    createdAt: now,
    updatedAt: now,
    tags: form.tags,
    category: form.category,
    topics: form.topics.map((t, i) => ({ id: `topic-${i + 1}`, ...t })),
    tools: form.tools.map((t, i) => ({ id: `tool-${i + 1}`, ...t })),
    powerAutomateFlows: form.powerAutomateFlows.map((f, i) => ({ id: `flow-${i + 1}`, ...f })),
    additionalSections: form.additionalSections.map((s, i) => ({ id: `section-${i + 1}`, ...s })),
    screenshotUrls: [],
    qualityScore: 0,
    githubUrl: form.githubUrl || '',
  };

  // 4. Commit the file
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(agent, null, 2))));
  const filePath = `data/agents/${agentId}.json`;

  const commitRes = await fetch(`${API}/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Add agent: ${form.name}`,
      content,
      branch: branchName,
    }),
  });
  if (!commitRes.ok) {
    const err = await commitRes.json();
    throw new Error(`Failed to commit file: ${err.message}`);
  }

  // 5. Open a PR
  const prRes = await fetch(`${API}/repos/${REPO_OWNER}/${REPO_NAME}/pulls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: `Add agent: ${form.name}`,
      body: `## New Agent Submission\n\n**Name:** ${form.name}\n**Category:** ${form.category || 'N/A'}\n**Tags:** ${form.tags.join(', ') || 'None'}\n\n**Description:** ${form.description}\n\n---\n*Submitted via Agent Hub*`,
      head: branchName,
      base: defaultBranch,
    }),
  });
  if (!prRes.ok) {
    const err = await prRes.json();
    throw new Error(`Failed to create PR: ${err.message}`);
  }

  const pr = await prRes.json();
  return { prUrl: pr.html_url };
}
