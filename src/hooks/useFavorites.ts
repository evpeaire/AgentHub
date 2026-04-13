import { useState, useEffect } from 'react';

const FAVORITES_KEY = 'agent-hub-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const isFavorited = (agentId: string) => favorites.includes(agentId);

  const toggleFavorite = (agentId: string) => {
    setFavorites((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId]
    );
  };

  return { favorites, isFavorited, toggleFavorite };
}
