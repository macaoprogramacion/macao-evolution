import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { PortfolioProvider } from './context/PortfolioContext';
import LandingPage from './pages/LandingPage';
import HeroLanding from './pages/HeroLanding';
import ClientGallery from './pages/ClientGallery';
import PhotographerDashboard from './pages/PhotographerDashboard';
import BillingPage from './pages/BillingPage';
import PortfoliosPage from './pages/PortfoliosPage';
import FinanzasPage from './pages/FinanzasPage';
import ClientesPage from './pages/ClientesPage';
import AjustesPage from './pages/AjustesPage';

function App() {
  return (
    <Router>
      <PortfolioProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/hero" element={<HeroLanding />} />
          <Route path="/gallery/:phone" element={<ClientGallery />} />
          <Route path="/gallery" element={<ClientGallery />} />
          
          {/* Photographer routes */}
          <Route path="/dashboard" element={<PhotographerDashboard />} />
          <Route path="/portfolios" element={<PortfoliosPage />} />
          <Route path="/finances" element={<FinanzasPage />} />
          <Route path="/clients" element={<ClientesPage />} />
          <Route path="/settings" element={<AjustesPage />} />
          
          {/* Billing routes */}
          <Route path="/billing" element={<BillingPage />} />
          <Route path="/facturacion" element={<BillingPage />} />
        </Routes>
      </PortfolioProvider>
    </Router>
  );
}

export default App;
