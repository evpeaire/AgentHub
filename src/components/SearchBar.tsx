import { useState, useMemo } from 'react';
import { getAllTags, getAllCategories } from '../services/data';
import { useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string, tags: string[], sortBy: string, category: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('quality');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [showTags, setShowTags] = useState(false);
  const [tagSearch, setTagSearch] = useState('');

  useEffect(() => {
    getAllTags().then(setAvailableTags).catch(console.error);
    getAllCategories().then(setAvailableCategories).catch(console.error);
  }, []);

  const handleSearch = () => {
    onSearch(query, selectedTags, sortBy, category);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const toggleTag = (tag: string) => {
    const next = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(next);
    onSearch(query, next, sortBy, category);
  };

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort);
    onSearch(query, selectedTags, newSort, category);
  };

  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    onSearch(query, selectedTags, sortBy, newCat);
  };

  const displayedTags = useMemo(() => {
    if (!tagSearch.trim()) return availableTags;
    const lower = tagSearch.toLowerCase();
    return availableTags.filter((t) => t.toLowerCase().includes(lower));
  }, [tagSearch, availableTags]);

  return (
    <div className="search-bar">
      <div className="search-row">
        <div className="search-input-wrap">
          <span className="search-icon">&#x1F50D;</span>
          <input
            type="text"
            className="search-input"
            placeholder="Search agents by name, description, or keyword..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <button className="btn btn-primary" onClick={handleSearch}>
          Search
        </button>
      </div>
      <div className="search-controls">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => handleSortChange(e.target.value)} className="sort-select">
            <option value="quality">Quality Score</option>
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name</option>
          </select>
        </div>
        {availableCategories.length > 0 && (
          <div className="sort-controls">
            <label>Category:</label>
            <select value={category} onChange={(e) => handleCategoryChange(e.target.value)} className="sort-select">
              <option value="">All Categories</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        )}
        {availableTags.length > 0 && (
          <button
            className="btn btn-outline btn-sm"
            onClick={() => setShowTags(!showTags)}
          >
            {showTags ? 'Hide Tags' : 'Filter by Tags'} ({selectedTags.length})
          </button>
        )}
      </div>
      {selectedTags.length > 0 && (
        <div className="selected-tags">
          {selectedTags.map((tag) => (
            <button
              key={tag}
              className="tag-chip tag-chip-active tag-chip-removable"
              onClick={() => toggleTag(tag)}
            >
              {tag} ✕
            </button>
          ))}
        </div>
      )}
      {showTags && (
        <div className="tag-filter">
          <input
            type="text"
            className="tag-search-input"
            placeholder="Search for tags..."
            value={tagSearch}
            onChange={(e) => setTagSearch(e.target.value)}
          />
          {displayedTags.map((tag) => (
            <button
              key={tag}
              className={`tag-chip ${selectedTags.includes(tag) ? 'tag-chip-active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {tagSearch && displayedTags.length === 0 && (
            <span className="tag-no-results">No tags match "{tagSearch}"</span>
          )}
        </div>
      )}
    </div>
  );
}
