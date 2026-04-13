import { Agent, AgentIndex, AgentSummary } from '../types';

// In dev, data is served from /data/. In production (GitHub Pages), from the base path.
const DATA_BASE = import.meta.env.BASE_URL + 'data/';

let indexCache: AgentIndex | null = null;

export async function loadIndex(): Promise<AgentIndex> {
  if (indexCache) return indexCache;
  const res = await fetch(`${DATA_BASE}index.json`);
  if (!res.ok) {
    // If no index yet, return empty
    return { agents: [], tags: [], categories: [], generatedAt: '' };
  }
  indexCache = await res.json();
  return indexCache!;
}

export function invalidateCache() {
  indexCache = null;
}

export async function loadAgent(id: string): Promise<Agent | null> {
  try {
    const res = await fetch(`${DATA_BASE}agents/${encodeURIComponent(id)}.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function searchAgents(params: {
  query?: string;
  tags?: string[];
  category?: string;
  sortBy?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ agents: AgentSummary[]; total: number }> {
  const index = await loadIndex();
  let filtered = [...index.agents];

  // Text search
  if (params.query?.trim()) {
    const q = params.query.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.author.toLowerCase().includes(q)
    );
  }

  // Tag filter
  if (params.tags?.length) {
    filtered = filtered.filter((a) =>
      params.tags!.every((t) => a.tags.includes(t))
    );
  }

  // Category filter
  if (params.category) {
    filtered = filtered.filter((a) => a.category === params.category);
  }

  // Sort
  switch (params.sortBy) {
    case 'newest':
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      break;
    case 'oldest':
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'quality':
    default:
      filtered.sort((a, b) => (b.qualityScore ?? 0) - (a.qualityScore ?? 0));
      break;
  }

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 12;
  const start = (page - 1) * pageSize;

  return {
    agents: filtered.slice(start, start + pageSize),
    total: filtered.length,
  };
}

export async function getAllTags(): Promise<string[]> {
  const index = await loadIndex();
  return index.tags;
}

export async function getAllCategories(): Promise<string[]> {
  const index = await loadIndex();
  return index.categories;
}
