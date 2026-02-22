"use client"

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Upload, Eye, Trash2, Phone, Calendar, User, FileText, Clock, AlertTriangle } from 'lucide-react';
import Navbar from '@/components/photographer/Navbar';
import Sidebar from '@/components/photographer/Sidebar';
import BottomNav from '@/components/photographer/BottomNav';
import PortfolioCard from '@/components/photographer/PortfolioCard';
import { GlassCard, GlassButton, GlassInput } from '@/components/photographer/ui';
import { usePortfolio } from '@/context/PortfolioContext';

// Background image

const statusColors = {
  'Vendido': 'bg-green-500/80',
  'Descargado': 'bg-blue-500/80',
  'Pendiente': 'bg-amber-500/80',
};

export default function PortfoliosPage() {
  const { getAllPortfoliosWithExpiration, addPortfolio, deletePortfolio, PORTFOLIO_DURATION_DAYS } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Get all portfolios with expiration info
  const portfolios = getAllPortfoliosWithExpiration();
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    clientName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    invoiceCode: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Calculate stats
  const expiringCount = portfolios.filter(p => p.expiringSoon).length;

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-red-500');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-red-500');
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-red-500');
    
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    const newPhotos = files.map(file => URL.createObjectURL(file));
    setUploadedPhotos(prev => [...prev, ...newPhotos]);
  };

  const handleSubmitPortfolio = () => {
    if (!uploadForm.clientName || !uploadForm.phone || uploadedPhotos.length === 0) {
      alert('Por favor complete el nombre, teléfono y suba al menos una foto');
      return;
    }

    addPortfolio(uploadForm, uploadedPhotos);
    
    // Reset form and close modal
    setUploadForm({
      clientName: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      invoiceCode: '',
    });
    setUploadedPhotos([]);
    setShowUploadModal(false);
  };

  const removeUploadedPhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const filteredPortfolios = portfolios.filter(p => {
    const matchesSearch = p.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         p.phone.includes(searchQuery);
    const matchesStatus = filterStatus === 'Todos' || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url($"/photographer/branding/photos/bg-4k-ftg.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Navbar */}
      <div className="relative z-10">
        <Navbar 
          title="MACAO MEMORIES - Portafolios" 
          mobileTitle="Portafolios"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <Sidebar  />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {/* Header with search and filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
              <GlassInput
                type="text"
                placeholder="Buscar por nombre o teléfono..."
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <GlassCard className="flex items-center gap-2 px-4 py-2" hover={false}>
              <Filter className="w-4 h-4 text-white/60" />
              <select 
                className="bg-transparent text-white font-medium focus:outline-none"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Todos">Todos</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Vendido">Vendido</option>
                <option value="Descargado">Descargado</option>
              </select>
            </GlassCard>

            <GlassButton 
              variant="primary" 
              className="flex items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <Upload className="w-5 h-5" />
              Nuevo Portafolio
            </GlassButton>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-white">{portfolios.length}</p>
              <p className="text-white/60 text-sm">Total Portafolios</p>
            </GlassCard>
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-green-400">{portfolios.filter(p => p.status === 'Vendido').length}</p>
              <p className="text-white/60 text-sm">Vendidos</p>
            </GlassCard>
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-amber-400">{portfolios.filter(p => p.status === 'Pendiente').length}</p>
              <p className="text-white/60 text-sm">Pendientes</p>
            </GlassCard>
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-blue-400">{portfolios.filter(p => p.status === 'Descargado').length}</p>
              <p className="text-white/60 text-sm">Descargados</p>
            </GlassCard>
            <GlassCard className={`p-4 text-center ${expiringCount > 0 ? 'border-2 border-red-500/50' : ''}`} hover={false}>
              <p className="text-3xl font-bold text-red-400">{expiringCount}</p>
              <p className="text-white/60 text-sm flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Por Vencer
              </p>
            </GlassCard>
          </div>

          {/* Alert for expiring portfolios */}
          {expiringCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center gap-3"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">¡Atención! Hay {expiringCount} portafolio(s) por vencer</p>
                <p className="text-white/70 text-sm">Los portafolios tienen una vigencia de {PORTFOLIO_DURATION_DAYS} días.</p>
              </div>
            </motion.div>
          )}

          {/* Portfolios grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard className="p-4" hover={true}>
                  <div className="flex gap-4">
                    {/* Client photo */}
                    <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/30">
                      <img 
                        src={portfolio.image} 
                        alt={portfolio.clientName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-medium truncate">
                            {portfolio.clientName}
                          </p>
                          <p className="text-white/70 text-sm">{portfolio.phone}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusColors[portfolio.status]}`}>
                              {portfolio.status}
                            </span>
                            <span className="text-white/60 text-xs">{portfolio.photos} fotos</span>
                          </div>
                          <p className="text-white/50 text-xs mt-1">
                            {portfolio.invoiceCode ? `Factura: ${portfolio.invoiceCode}` : 'Sin factura'}
                          </p>
                        </div>
                        
                        <motion.button
                          className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Phone className="w-4 h-4 text-white" />
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2 mt-4">
                    <GlassButton variant="primary" className="flex-1 py-2 text-sm">
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </GlassButton>
                    <GlassButton variant="secondary" className="flex-1 py-2 text-sm">
                      Editar
                    </GlassButton>
                    <motion.button
                      className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => deletePortfolio(portfolio.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </motion.button>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>

          {filteredPortfolios.length === 0 && (
            <div className="text-center py-12 text-white/60">
              <p className="text-lg">No se encontraron portafolios</p>
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setShowUploadModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <GlassCard className="w-full max-w-md p-6" hover={false}>
              <h2 className="text-xl font-title text-white text-center mb-6">
                Subir Nuevo Portafolio
              </h2>

              <div className="space-y-4">
                {/* Client Name */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Nombre del Cliente</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="Nombre completo"
                      value={uploadForm.clientName}
                      onChange={(e) => setUploadForm({...uploadForm, clientName: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                                text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Número de Teléfono</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      type="tel"
                      placeholder="809-000-0000"
                      value={uploadForm.phone}
                      onChange={(e) => setUploadForm({...uploadForm, phone: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                                text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Fecha</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      type="date"
                      value={uploadForm.date}
                      onChange={(e) => setUploadForm({...uploadForm, date: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                                text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Invoice Code (optional) */}
                <div>
                  <label className="block text-white/60 text-xs mb-1.5">Código de Factura (Opcional)</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                    <input
                      type="text"
                      placeholder="FAC-000"
                      value={uploadForm.invoiceCode}
                      onChange={(e) => setUploadForm({...uploadForm, invoiceCode: e.target.value})}
                      className="w-full pl-10 pr-4 py-3 bg-black/30 rounded-2xl border border-white/20 
                                text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                {/* Upload area */}
                <div 
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/40 rounded-2xl p-8 text-center hover:border-red-500/60 transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Upload className="w-10 h-10 mx-auto text-white/60 mb-2" />
                  <p className="text-white/70">Arrastrar y Soltar Fotos Aquí</p>
                  <p className="text-white/40 text-sm mt-1">o haz clic para seleccionar</p>
                </div>

                {/* Preview uploaded photos */}
                {uploadedPhotos.length > 0 && (
                  <div>
                    <p className="text-white/60 text-xs mb-2">{uploadedPhotos.length} foto(s) seleccionada(s)</p>
                    <div className="grid grid-cols-4 gap-2">
                      {uploadedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={(e) => { e.stopPropagation(); removeUploadedPhoto(idx); }}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-3 mt-6">
                  <GlassButton 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadedPhotos([]);
                    }}
                  >
                    Cancelar
                  </GlassButton>
                  <GlassButton 
                    variant="primary" 
                    className="flex-1"
                    onClick={handleSubmitPortfolio}
                  >
                    Subir y Asignar
                  </GlassButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}

      {/* Bottom navigation */}
      <BottomNav  />
    </div>
  );
}
