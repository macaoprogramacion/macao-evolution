import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getPortfolios as lsGetPortfolios,
  savePortfolios as lsSavePortfolios,
  getPortfolioPhotos as lsGetPhotos,
  savePortfolioPhotos as lsSavePhotos,
  getPortfolioVideos as lsGetVideos,
  savePortfolioVideos as lsSaveVideos,
  getBillingClients,
} from '../lib/store';

// Demo photos for each client (used as seed when localStorage is empty)
const seedClientPhotos = {
  1: [
    'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400',
    'https://images.unsplash.com/photo-1682687221038-404670f01d03?w=400',
    'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?w=400',
    'https://images.unsplash.com/photo-1682695796954-bad0d0f59ff1?w=400',
    'https://images.unsplash.com/photo-1682695797221-8164ff1fafc9?w=400',
    'https://images.unsplash.com/photo-1682687982501-1e58ab814714?w=400',
  ],
  2: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400',
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=400',
  ],
  3: [
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=400',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
  ],
  4: [
    'https://images.unsplash.com/photo-1518173946687-a4c036bc4a7a?w=400',
    'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=400',
  ],
  5: [
    'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=400',
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400',
    'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400',
  ],
  6: [
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=400',
    'https://images.unsplash.com/photo-1482938289607-e9573fc25ebb?w=400',
  ],
};

// Portfolio duration in days
const PORTFOLIO_DURATION_DAYS = 30;

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

// Demo portfolio data with recent dates
const initialPortfolios = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    clientName: 'Ana G.',
    phone: '809-555-0101',
    status: 'Vendido',
    commission: 30,
    date: '20/01/2026',
    dateLabel: 'Vendido el',
    createdAt: new Date('2026-01-20').getTime(),
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    clientName: 'Luis P.',
    phone: '809-555-0102',
    status: 'Descargado',
    commission: 0,
    date: '25/01/2026',
    dateLabel: 'Acceso el',
    createdAt: new Date('2026-01-25').getTime(),
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    clientName: 'Carla M.',
    phone: '809-555-0103',
    status: 'Pendiente',
    commission: 0,
    date: '01/02/2026',
    dateLabel: 'Subido el',
    createdAt: new Date('2026-02-01').getTime(),
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
    clientName: 'María S.',
    phone: '809-555-0104',
    status: 'Pendiente',
    commission: 0,
    date: '15/01/2026',
    dateLabel: 'Subido el',
    createdAt: new Date('2026-01-15').getTime(), // Expiring soon!
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200',
    clientName: 'Elena R.',
    phone: '809-555-0105',
    status: 'Pendiente',
    commission: 0,
    date: '03/02/2026',
    dateLabel: 'Subido el',
    createdAt: new Date('2026-02-03').getTime(),
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200',
    clientName: 'Rosa J.',
    phone: '809-555-0106',
    status: 'Pendiente',
    commission: 0,
    date: '10/01/2026',
    dateLabel: 'Subido el',
    createdAt: new Date('2026-01-10').getTime(), // Almost expired!
  },
];

const PortfolioContext = createContext();

// --- Initialise from localStorage or fall back to demo seed ---
function loadInitialPortfolios() {
  const stored = lsGetPortfolios();
  return stored.length > 0 ? stored : initialPortfolios;
}
function loadInitialPhotos() {
  const stored = lsGetPhotos();
  return Object.keys(stored).length > 0 ? stored : seedClientPhotos;
}
function loadInitialVideos() {
  return lsGetVideos();
}

export function PortfolioProvider({ children }) {
  const [portfolios, setPortfolios] = useState(loadInitialPortfolios);
  const [clientPhotos, setClientPhotos] = useState(loadInitialPhotos);
  const [clientVideos, setClientVideos] = useState(loadInitialVideos);

  // ---- Persist every state change to localStorage ----
  useEffect(() => { lsSavePortfolios(portfolios); }, [portfolios]);
  useEffect(() => { lsSavePhotos(clientPhotos); }, [clientPhotos]);
  useEffect(() => { lsSaveVideos(clientVideos); }, [clientVideos]);

  // ---- Listen for billing clients added by the cashier (cross-tab) ----
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'macao_billing_clients') {
        // New billing client may have been added — refresh portfolios from LS
        setPortfolios(lsGetPortfolios());
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Add new portfolio
  const addPortfolio = useCallback((newPortfolio, photos, video = null) => {
    const id = Date.now();
    const today = new Date();
    const dateStr = today.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' });
    
    const portfolio = {
      id,
      image: photos[0] || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      clientName: newPortfolio.clientName,
      phone: newPortfolio.phone,
      status: 'Pendiente',
      commission: 0,
      date: dateStr,
      dateLabel: 'Subido el',
      invoiceCode: newPortfolio.invoiceCode || null,
      source: newPortfolio.source || 'photographer', // 'billing' | 'photographer'
      turno: newPortfolio.turno || null,
      photographerName: newPortfolio.photographerName || null,
      createdAt: today.getTime(),
    };

    setPortfolios(prev => [portfolio, ...prev]);
    setClientPhotos(prev => ({ ...prev, [id]: photos }));
    if (video) { setClientVideos(prev => ({ ...prev, [id]: video })); }
    return id;
  }, []);

  // Delete portfolio
  const deletePortfolio = useCallback((id) => {
    setPortfolios(prev => prev.filter(p => p.id !== id));
    setClientPhotos(prev => { const n = { ...prev }; delete n[id]; return n; });
    setClientVideos(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

  // Update portfolio
  const updatePortfolio = useCallback((id, updates) => {
    setPortfolios(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  }, []);

  // Add photos to portfolio
  const addPhotosToPortfolio = useCallback((id, newPhotos) => {
    setClientPhotos(prev => ({ ...prev, [id]: [...(prev[id] || []), ...newPhotos] }));
  }, []);

  // Delete photos from portfolio
  const deletePhotosFromPortfolio = useCallback((id, indices) => {
    setClientPhotos(prev => ({ ...prev, [id]: prev[id].filter((_, i) => !indices.includes(i)) }));
  }, []);

  // Add video to portfolio
  const addVideoToPortfolio = useCallback((id, video) => {
    setClientVideos(prev => ({ ...prev, [id]: video }));
  }, []);

  // Delete video from portfolio
  const deleteVideoFromPortfolio = useCallback((id) => {
    setClientVideos(prev => { const n = { ...prev }; delete n[id]; return n; });
  }, []);

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
