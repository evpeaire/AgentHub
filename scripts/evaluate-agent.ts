/**
 * Evaluate agent quality score (0-5) based on completeness.
 *
 * Used by:
 * 1. GitHub Actions on PR to score new agents
 * 2. npm run evaluate -- to score all agents locally
 *
 * Scoring criteria:
 * - Has name, description, overview (required): 1 point
 * - Has instructions: 0.5 points
 * - Has 1+ topics: 0.5 points
 * - Has topics with YAML: 0.5 points
 * - Has 1+ tools: 0.5 points
 * - Has category: 0.25 points
 * - Has 2+ tags: 0.25 points
 * - Has solution file: 0.5 points
 * - Has GitHub URL: 0.25 points
 * - Has additional sections: 0.25 points
 * - Has screenshots: 0.25 points (capped at 0.25)
 * - Has trigger phrases in topics: 0.25 points
 *
 * Total possible: 5.0
 */
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface Agent {
  id: string;
  name: string;
  description: string;
  overview: string;
  instructions: string;
  tags: string[];
  category: string;
  topics: { yamlContent?: string; triggerPhrases?: string[] }[];
  tools: unknown[];
  powerAutomateFlows: unknown[];
  additionalSections: unknown[];
  solutionFileName?: string;
  screenshotUrls: string[];
  githubUrl?: string;
  qualityScore?: number;
}

function evaluateAgent(agent: Agent): number {
  let score = 0;

  // Core fields
  if (agent.name && agent.description && agent.overview) score += 1;
  if (agent.instructions?.trim()) score += 0.5;

  // Topics
  if (agent.topics?.length > 0) {
    score += 0.5;
    if (agent.topics.some((t) => t.yamlContent?.trim())) score += 0.5;
    if (agent.topics.some((t) => t.triggerPhrases && t.triggerPhrases.length > 0)) score += 0.25;
  }

  // Tools
  if (agent.tools?.length > 0) score += 0.5;

  // Metadata
  if (agent.category?.trim()) score += 0.25;
  if (agent.tags?.length >= 2) score += 0.25;

  // Assets
  if (agent.solutionFileName?.trim()) score += 0.5;
  if (agent.githubUrl?.trim()) score += 0.25;
  if (agent.additionalSections?.length > 0) score += 0.25;
  if (agent.screenshotUrls?.length > 0) score += 0.25;

  return Math.min(5, Math.round(score * 10) / 10);
}

async function main() {
  const targetFile = process.argv[2];
  const dataDir = path.resolve(process.cwd(), 'data/agents');

  if (targetFile) {
    // Evaluate a single file (used by CI)
    const filePath = path.resolve(targetFile);
    const raw = fs.readFileSync(filePath, 'utf-8');
    const agent: Agent = JSON.parse(raw);
    const score = evaluateAgent(agent);

    // Write score back
    agent.qualityScore = score;
    fs.writeFileSync(filePath, JSON.stringify(agent, null, 2));

    console.log(`${agent.name}: ${score}/5`);
    // Output for GitHub Actions
    console.log(`::set-output name=score::${score}`);
    console.log(`::set-output name=agent-name::${agent.name}`);
  } else {
    // Evaluate all agents
    const files = await glob('*.json', { cwd: dataDir });
    let updated = 0;

    for (const file of files) {
      if (file.startsWith('_')) continue;
      const filePath = path.join(dataDir, file);
      const raw = fs.readFileSync(filePath, 'utf-8');
      const agent: Agent = JSON.parse(raw);
      const score = evaluateAgent(agent);

      if (agent.qualityScore !== score) {
        agent.qualityScore = score;
        fs.writeFileSync(filePath, JSON.stringify(agent, null, 2));
        updated++;
      }

      console.log(`  ${score.toFixed(1)}/5  ${agent.name}`);
    }

    console.log(`\nEvaluated ${files.length} agents, updated ${updated}`);
  }
}

main().catch((err) => {
  console.error('Evaluation failed:', err);
  process.exit(1);
});
