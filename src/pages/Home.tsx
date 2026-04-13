import { useState, useEffect, useCallback } from 'react';
import SearchBar from '../components/SearchBar';
import AgentCard from '../components/AgentCard';
import { searchAgents } from '../services/data';
import { AgentSummary } from '../types';

export default function Home() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchState, setSearchState] = useState({ query: '', tags: [] as string[], sortBy: 'quality', category: '' });
  const pageSize = 12;

  const loadAgents = useCallback(async (q: string, tags: string[], sort: string, p: number, cat: string) => {
    setLoading(true);
    try {
      const result = await searchAgents({ query: q, tags, sortBy: sort, page: p, pageSize, category: cat });
      setAgents(result.agents);
      setTotal(result.total);
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgents(searchState.query, searchState.tags, searchState.sortBy, page, searchState.category);
  }, [page, loadAgents, searchState]);

  const handleSearch = (query: string, tags: string[], sortBy: string, category: string) => {
    setSearchState({ query, tags, sortBy, category });
    setPage(1);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="page-home">
      <div className="hero">
        <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="hero-sparkle" />
        <h1>Microsoft Agent Hub</h1>
        <p className="hero-subtitle">Discover, share, and reuse custom Microsoft Copilot agents built for customers.</p>
      </div>

      <SearchBar onSearch={handleSearch} />

      <div className="results-info">
        <span>{total} agent{total !== 1 ? 's' : ''} found</span>
      </div>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner" />
          <p>Loading agents...</p>
        </div>
      ) : agents.length === 0 ? (
        <div className="empty-state">
          <img src={import.meta.env.BASE_URL + 'copilot-icon.svg'} alt="" className="empty-sparkle" />
          <h2>No agents found</h2>
          <p>Try adjusting your search or be the first to submit an agent!</p>
        </div>
      ) : (
        <>
          <div className="agent-grid">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                &larr; Previous
              </button>
              <span className="pagination-info">
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
              >
                Next &rarr;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
