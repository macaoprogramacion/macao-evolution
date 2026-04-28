import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// Portfolio duration in days
const PORTFOLIO_DURATION_DAYS = 15;

// Helper to calculate remaining days
const calculateRemainingDays = (createdAt) => {
  const now = new Date();
  const created = new Date(createdAt);
  const expirationDate = new Date(created.getTime() + PORTFOLIO_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const diffTime = expirationDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Helper to check if portfolio is expiring soon (7 days or less)
const isExpiringSoon = (createdAt, status) => {
  const remainingDays = calculateRemainingDays(createdAt);
  return remainingDays <= 7 && remainingDays > 0 && status === 'Pendiente';
};

// Helper to check if portfolio is expired
const isExpired = (createdAt) => {
  return calculateRemainingDays(createdAt) === 0;
};

const PortfolioContext = createContext();

export function PortfolioProvider({ children }) {
  const [portfolios, setPortfolios] = useState([]);
  const [clientPhotos, setClientPhotos] = useState({});
  const [clientVideos, setClientVideos] = useState({});

  const refreshFromApi = useCallback(async () => {
    try {
      const res = await fetch('/api/portfolios?all=true');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setPortfolios(Array.isArray(data.portfolios) ? data.portfolios : []);
      setClientPhotos(data.photos || {});
      setClientVideos(data.videos || {});
    } catch (err) {
      console.error('Error fetching portfolios from API:', err);
    }
  }, []);

  useEffect(() => {
    refreshFromApi();
  }, [refreshFromApi]);

  // Add new portfolio — saves to both localStorage (instant) and Supabase (persistent)
  const addPortfolio = useCallback(async (newPortfolio, photos, video = null) => {
    try {
      const res = await fetch('/api/portfolios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: newPortfolio.clientName,
          phone: newPortfolio.phone,
          invoiceCode: newPortfolio.invoiceCode || null,
          source: newPortfolio.source || 'photographer',
          turno: newPortfolio.turno || null,
          photographerName: newPortfolio.photographerName || null,
          photos,
          video,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshFromApi();
    } catch (err) {
      console.error('Error saving portfolio:', err);
      throw err;
    }
  }, [refreshFromApi]);

  // Delete portfolio
  const deletePortfolio = useCallback(async (id) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    setClientPhotos(prev => { const n = { ...prev }; delete n[id]; return n; });
    setClientVideos(prev => { const n = { ...prev }; delete n[id]; return n; });

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Error deleting portfolio:', err);
      await refreshFromApi();
    }
  }, [refreshFromApi]);

  // Update portfolio
  const updatePortfolio = useCallback(async (id, updates) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Error updating portfolio:', err);
      await refreshFromApi();
    }
  }, [refreshFromApi]);

  // Add photos to portfolio
  const addPhotosToPortfolio = useCallback(async (id, newPhotos) => {
    setClientPhotos(prev => ({ ...prev, [id]: [...(prev[id] || []), ...newPhotos] }));

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_photos', photosUrls: newPhotos }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshFromApi();
    } catch (err) {
      console.error('Error adding photos:', err);
      await refreshFromApi();
    }
  }, [refreshFromApi]);

  // Delete photos from portfolio
  const deletePhotosFromPortfolio = useCallback(async (id, indices) => {
    const current = clientPhotos[id] || [];
    const remaining = current.filter((_, i) => !indices.includes(i));
    setClientPhotos(prev => ({ ...prev, [id]: remaining }));

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'replace_photos', photosUrls: remaining }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshFromApi();
    } catch (err) {
      console.error('Error deleting photos:', err);
      await refreshFromApi();
    }
  }, [clientPhotos, refreshFromApi]);

  // Add video to portfolio
  const addVideoToPortfolio = useCallback(async (id, video) => {
    setClientVideos(prev => ({ ...prev, [id]: video }));

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_video', videoUrl: video }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refreshFromApi();
    } catch (err) {
      console.error('Error adding video:', err);
      await refreshFromApi();
    }
  }, [refreshFromApi]);

  // Delete video from portfolio
  const deleteVideoFromPortfolio = useCallback(async (id) => {
    setClientVideos(prev => { const n = { ...prev }; delete n[id]; return n; });

    try {
      const res = await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove_video' }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('Error deleting video:', err);
      await refreshFromApi();
    }
  }, [refreshFromApi]);

  // Get latest portfolios (for dashboard — last N)
  const getLatestPortfolios = useCallback((count = 6) => {
    return [...portfolios].sort((a, b) => b.createdAt - a.createdAt).slice(0, count);
  }, [portfolios]);

  // Get portfolio with expiration info
  const getPortfolioWithExpiration = useCallback((portfolio) => {
    const remainingDays = calculateRemainingDays(portfolio.createdAt);
    const expSoon = isExpiringSoon(portfolio.createdAt, portfolio.status);
    const expired = isExpired(portfolio.createdAt);
    return { ...portfolio, remainingDays, expiringSoon: expSoon, expired };
  }, []);

  // Get all portfolios with expiration info
  const getAllPortfoliosWithExpiration = useCallback(() => {
    return portfolios.map(getPortfolioWithExpiration);
  }, [portfolios, getPortfolioWithExpiration]);

  // Find portfolio by phone number
  const findByPhone = useCallback((phone) => {
    const normalised = phone?.replace(/\D/g, '');
    return portfolios.find(p => p.phone?.replace(/\D/g, '') === normalised);
  }, [portfolios]);

  // Find ALL portfolios for a phone (there could be multiple visits)
  const findAllByPhone = useCallback((phone) => {
    const normalised = phone?.replace(/\D/g, '');
    return portfolios.filter(p => p.phone?.replace(/\D/g, '') === normalised);
  }, [portfolios]);

  return (
    <PortfolioContext.Provider value={{
      portfolios,
      clientPhotos,
      clientVideos,
      addPortfolio,
      deletePortfolio,
      updatePortfolio,
      addPhotosToPortfolio,
      deletePhotosFromPortfolio,
      addVideoToPortfolio,
      deleteVideoFromPortfolio,
      getLatestPortfolios,
      getPortfolioWithExpiration,
      getAllPortfoliosWithExpiration,
      findByPhone,
      findAllByPhone,
      PORTFOLIO_DURATION_DAYS,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
}
