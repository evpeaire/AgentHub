/**
 * Build-time script: reads all data/agents/*.json files and generates
 * a single data/index.json for the client to fetch.
 *
 * Run: npx tsx scripts/build-index.ts
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface AgentFile {
  id: string;
  name: string;
  description: string;
  author: string;
  authorEmail: string;
  tags: string[];
  category: string;
  qualityScore?: number;
  createdAt: string;
  solutionFileName?: string;
}

async function buildIndex() {
  const dataDir = path.resolve(process.cwd(), 'data/agents');
  const publicDir = path.resolve(process.cwd(), 'public/data');
  const publicAgentsDir = path.resolve(publicDir, 'agents');

  // Ensure directories exist
  fs.mkdirSync(publicDir, { recursive: true });
  fs.mkdirSync(publicAgentsDir, { recursive: true });

  // Find all agent JSON files
  const files = await glob('*.json', { cwd: dataDir });

  if (files.length === 0) {
    console.log('No agent files found in data/agents/. Creating empty index.');
    const emptyIndex = { agents: [], tags: [], categories: [], generatedAt: new Date().toISOString() };
    fs.writeFileSync(path.join(publicDir, 'index.json'), JSON.stringify(emptyIndex, null, 2));
    return;
  }

  const agents: AgentFile[] = [];
  const tagSet = new Set<string>();
  const categorySet = new Set<string>();

  for (const file of files) {
    if (file.startsWith('_')) continue; // Skip template files

    const filePath = path.join(dataDir, file);
    try {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const agent = JSON.parse(raw);

      agents.push({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        author: agent.author,
        authorEmail: agent.authorEmail || '',
        tags: agent.tags || [],
        category: agent.category || '',
        qualityScore: agent.qualityScore,
        createdAt: agent.createdAt,
        solutionFileName: agent.solutionFileName,
      });

      (agent.tags || []).forEach((t: string) => tagSet.add(t));
      if (agent.category) categorySet.add(agent.category);

      // Copy full agent file to public/data/agents/
      fs.copyFileSync(filePath, path.join(publicAgentsDir, file));

      console.log(`  + ${agent.name} (${file})`);
    } catch (err) {
      console.error(`  ! Failed to parse ${file}:`, err);
    }
  }

  // Sort agents by quality score descending
  agents.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));

  const index = {
    agents,
    tags: [...tagSet].sort(),
    categories: [...categorySet].sort(),
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(path.join(publicDir, 'index.json'), JSON.stringify(index, null, 2));
  console.log(`\nIndex built: ${agents.length} agents, ${tagSet.size} tags, ${categorySet.size} categories`);
}

buildIndex().catch((err) => {
  console.error('Build index failed:', err);
  process.exit(1);
});
