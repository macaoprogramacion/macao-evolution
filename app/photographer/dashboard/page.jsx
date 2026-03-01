"use client"

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, Upload, X, Trash2, Edit, Phone, Calendar, User, Plus, Check, Image, Video, Play, Receipt, Clock } from 'lucide-react';
import Navbar from '@/components/photographer/Navbar';
import Sidebar from '@/components/photographer/Sidebar';
import BottomNav from '@/components/photographer/BottomNav';
import PortfolioCard from '@/components/photographer/PortfolioCard';
import { GlassCard, GlassButton, GlassInput } from '@/components/photographer/ui';
import { usePortfolio } from '@/context/PortfolioContext';
import { getBillingClients } from '@/lib/store';

// Background image

// Client View Modal Component
function ClientViewModal({ client, onClose, photos, video, onDeletePhoto, onUploadPhotos, onEditClient, onDeleteClient, onDeleteVideo, onUploadVideo }) {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: client?.clientName || '',
    phone: client?.phone || '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const togglePhotoSelection = (index) => {
    setSelectedPhotos(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDeleteSelected = () => {
    onDeletePhoto(selectedPhotos);
    setSelectedPhotos([]);
  };

  const handleSaveEdit = () => {
    onEditClient(editForm);
    setIsEditing(false);
  };

  if (!client) return null;

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="flex flex-col max-h-[90vh] overflow-hidden" hover={false}>
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                  <img src={client.image} alt={client.clientName} className="w-full h-full object-cover" />
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.clientName}
                      onChange={(e) => setEditForm({...editForm, clientName: e.target.value})}
                      className="px-3 py-1.5 bg-black/30 rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="px-3 py-1.5 bg-black/30 rounded-lg border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                ) : (
                  <div>
                    <h2 className="text-xl font-title text-white">{client.clientName}</h2>
                    <div className="flex items-center gap-2 text-white/70 text-sm mt-1">
                      <Phone className="w-4 h-4" />
                      <span>{client.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/60 text-sm mt-1">
                      <Calendar className="w-4 h-4" />
                      <span>{client.dateLabel}: {client.date}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <GlassButton variant="secondary" onClick={() => setIsEditing(false)}>
                      Cancelar
                    </GlassButton>
                    <GlassButton variant="primary" onClick={handleSaveEdit}>
                      <Check className="w-4 h-4 mr-1" /> Guardar
                    </GlassButton>
                  </>
                ) : (
                  <>
                    <motion.button
                      onClick={() => setIsEditing(true)}
                      className="p-2 rounded-xl bg-black/30 hover:bg-black/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Edit className="w-5 h-5 text-white" />
                    </motion.button>
                    <motion.button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="p-2 rounded-xl bg-red-500/20 hover:bg-red-500/40 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </motion.button>
                  </>
                )}
                <motion.button
                  onClick={onClose}
                  className="p-2 rounded-xl bg-black/30 hover:bg-black/50 transition-colors ml-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 text-white" />
                </motion.button>
              </div>
            </div>

            {/* Photo count and actions */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-white/60 text-sm">{photos.length} fotos en este portafolio</p>
              <div className="flex gap-2">
                {selectedPhotos.length > 0 && (
                  <GlassButton 
                    variant="secondary" 
                    className="text-sm text-red-400"
                    onClick={handleDeleteSelected}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Eliminar ({selectedPhotos.length})
                  </GlassButton>
                )}
                <label className="cursor-pointer">
                  <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadPhotos} />
                  <GlassButton variant="primary" className="text-sm" as="span">
                    <Plus className="w-4 h-4 mr-1" />
                    Subir Fotos
                  </GlassButton>
                </label>
              </div>
            </div>
          </div>

          {/* Photo Grid */}
          <div className="flex-1 overflow-auto p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {photos.map((photo, index) => (
                <motion.div
                  key={index}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group
                    ${selectedPhotos.includes(index) ? 'ring-4 ring-red-500' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => togglePhotoSelection(index)}
                >
                  <img 
                    src={photo} 
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className={`absolute inset-0 transition-opacity ${
                    selectedPhotos.includes(index) ? 'bg-red-500/30' : 'bg-black/0 group-hover:bg-black/30'
                  }`}>
                    {selectedPhotos.includes(index) && (
                      <div className="absolute top-2 right-2 bg-red-500 rounded-full p-1">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Delete single photo button */}
                  <motion.button
                    className="absolute bottom-2 right-2 p-2 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePhoto([index]);
                    }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </motion.button>
                </motion.div>
              ))}

              {/* Upload placeholder */}
              <label className="aspect-square rounded-xl border-2 border-dashed border-white/30 hover:border-red-500/60 
                               flex flex-col items-center justify-center cursor-pointer transition-colors">
                <input type="file" multiple accept="image/*" className="hidden" onChange={onUploadPhotos} />
                <Plus className="w-8 h-8 text-white/40 mb-2" />
                <span className="text-white/40 text-sm">Agregar</span>
              </label>
            </div>

            {/* Video Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  <Video className="w-5 h-5 text-red-500" />
                  Video del Cliente
                </h3>
                {!video && (
                  <label className="cursor-pointer">
                    <input type="file" accept="video/*" className="hidden" onChange={onUploadVideo} />
                    <GlassButton variant="primary" className="text-sm" as="span">
                      <Plus className="w-4 h-4 mr-1" />
                      Subir Video
                    </GlassButton>
                  </label>
                )}
              </div>

              {video ? (
                <div className="relative rounded-xl overflow-hidden max-w-md">
                  <video 
                    src={video} 
                    className="w-full h-48 object-cover"
                    controls
                  />
                  <motion.button
                    className="absolute top-2 right-2 p-2 rounded-lg bg-red-500/80 hover:bg-red-600 transition-colors"
                    onClick={onDeleteVideo}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 text-white" />
                  </motion.button>
                </div>
              ) : (
                <div className="max-w-md rounded-xl border-2 border-dashed border-white/20 p-8 text-center">
                  <Video className="w-12 h-12 mx-auto text-white/30 mb-2" />
                  <p className="text-white/40 text-sm">No hay video subido</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Delete Client Confirmation Modal */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center bg-black/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <GlassCard className="p-6 max-w-sm" hover={false}>
                <h3 className="text-lg font-title text-white text-center mb-4">
                  Eliminar Cliente?
                </h3>
                <p className="text-white/70 text-center mb-6">
                  Esta acción eliminará el cliente y todas sus fotos. No se puede deshacer.
                </p>
                <div className="flex gap-3">
                  <GlassButton 
                    variant="secondary" 
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </GlassButton>
                  <GlassButton 
                    variant="primary" 
                    className="flex-1 bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      onDeleteClient();
                      onClose();
                    }}
                  >
                    Eliminar
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export default function PhotographerDashboard() {
  const { getLatestPortfolios, clientPhotos, clientVideos, addPortfolio, deletePortfolio, updatePortfolio, addPhotosToPortfolio, deletePhotosFromPortfolio, addVideoToPortfolio, deleteVideoFromPortfolio, getPortfolioWithExpiration } = usePortfolio();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  // Billing clients from cashier
  const [billingClients, setBillingClients] = useState(getBillingClients);
  useEffect(() => {
    const interval = setInterval(() => setBillingClients(getBillingClients()), 3000);
    const handleStorage = (e) => { if (e.key === 'macao_billing_clients') setBillingClients(getBillingClients()); };
    window.addEventListener('storage', handleStorage);
    return () => { clearInterval(interval); window.removeEventListener('storage', handleStorage); };
  }, []);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    clientName: '',
    phone: '',
    date: new Date().toISOString().split('T')[0],
    invoiceCode: '',
  });
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState(null);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Get only the last 6 portfolios for dashboard with expiration info
  const latestPortfolios = getLatestPortfolios(6).map(getPortfolioWithExpiration);

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

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideo({
        file,
        url: URL.createObjectURL(file),
        name: file.name
      });
    }
  };

  const removeUploadedVideo = () => {
    if (uploadedVideo?.url) {
      URL.revokeObjectURL(uploadedVideo.url);
    }
    setUploadedVideo(null);
  };

  const handleSubmitPortfolio = () => {
    if (!uploadForm.clientName || !uploadForm.phone || uploadedPhotos.length === 0) {
      alert('Por favor complete el nombre, teléfono y suba al menos una foto');
      return;
    }

    addPortfolio(uploadForm, uploadedPhotos, uploadedVideo?.url);
    
    // Reset form
    setUploadForm({
      clientName: '',
      phone: '',
      date: new Date().toISOString().split('T')[0],
      invoiceCode: '',
    });
    setUploadedPhotos([]);
    removeUploadedVideo();
  };

  const removeUploadedPhoto = (index) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url("/photographer/branding/photos/bg-4k-ftg.png")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Navbar */}
      <div className="relative z-10">
        <Navbar 
          title="MACAO OFFROAD EXPERIENCE - Panel del Fotografo" 
          mobileTitle="Panel del Fotografo"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar (desktop only) */}
        <Sidebar  />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {/* Filters row */}
          <div className="flex flex-wrap gap-4 mb-6">
            <GlassCard className="flex items-center gap-2 px-4 py-2" hover={false}>
              <span className="text-white/70 text-sm">Filtrar por</span>
              <select className="bg-transparent text-white font-medium focus:outline-none">
                <option>Estado</option>
                <option>Pendiente</option>
                <option>Vendido</option>
                <option>Descargado</option>
              </select>
            </GlassCard>

            <GlassCard className="flex items-center gap-2 px-4 py-2" hover={false}>
              <span className="text-white/70 text-sm">Fecha</span>
              <select className="bg-transparent text-white font-medium focus:outline-none">
                <option>Fecha</option>
                <option>Más reciente</option>
                <option>Más antiguo</option>
              </select>
            </GlassCard>

            <div className="flex-1 min-w-[200px]">
              <GlassInput
                type="text"
                placeholder="Buscar"
                icon={Search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="py-2"
              />
            </div>

            <GlassButton variant="secondary" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filtrar por
            </GlassButton>
          </div>

          {/* Upload new portfolio button (mobile) */}
          <GlassButton 
            variant="secondary" 
            className="w-full mb-6 lg:hidden flex items-center justify-center gap-2"
          >
            <Upload className="w-5 h-5" />
            Subir Nuevo Portafolio
          </GlassButton>

          <div className="flex gap-6">
            {/* Portfolios section */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-title text-white mb-4 text-center">
                Portafolios Activos
              </h2>

              {/* Portfolio grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                {latestPortfolios.map((portfolio, index) => (
                  <motion.div
                    key={portfolio.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <PortfolioCard
                      {...portfolio}
                      onView={() => setSelectedClient(portfolio)}
                      onEdit={() => setSelectedClient(portfolio)}
                      onDelete={() => deletePortfolio(portfolio.id)}
                      onCall={() => window.open(`tel:${portfolio.phone}`)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Billing Clients (from cashier) */}
              {billingClients.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-title text-white mb-4 text-center flex items-center justify-center gap-3">
                    <Receipt className="w-6 h-6 text-[#DC2626]" />
                    Clientes de Facturacion
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
                    {billingClients.filter(bc => !bc.photosReady).map((bc, idx) => (
                      <motion.div key={bc.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}>
                        <GlassCard className="p-5" hover={true}>
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-[#DC2626]/20 flex items-center justify-center">
                                <User className="w-6 h-6 text-[#DC2626]" />
                              </div>
                              <div>
                                <p className="text-white font-semibold">{bc.name}</p>
                                <p className="text-white/50 text-xs flex items-center gap-1"><Phone className="w-3 h-3" /> {bc.phone}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">PENDIENTE</span>
                          </div>
                          <div className="space-y-1.5 text-sm mb-4">
                            <div className="flex justify-between">
                              <span className="text-white/60">Factura</span>
                              <span className="text-white font-medium">{bc.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Turno</span>
                              <span className="text-white">{bc.turno}</span>
                            </div>
                            {bc.photographer && (
                              <div className="flex justify-between">
                                <span className="text-white/60">Fotógrafo</span>
                                <span className="text-white">{bc.photographer}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-white/60">Total</span>
                              <span className="text-[#DC2626] font-bold">US$ {bc.total?.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-white/60">Fecha</span>
                              <span className="text-white/70">{bc.date}</span>
                            </div>
                          </div>
                          <GlassButton variant="primary" className="w-full text-sm" onClick={() => {
                            // Pre-fill the upload form with billing client data
                            setUploadForm({
                              clientName: bc.name,
                              phone: bc.phone,
                              date: new Date().toISOString().split('T')[0],
                              invoiceCode: bc.invoiceNumber,
                            });
                            // Scroll to upload form on desktop, or open the form
                            document.querySelector('#upload-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}>
                            <Image className="w-4 h-4 mr-2 inline" />
                            Subir Fotos
                          </GlassButton>
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sales summary */}
              <GlassCard className="mt-6 p-6" hover={false}>
                <h3 className="text-xl font-medium text-white text-center mb-4">
                  Resumen de Ventas
                </h3>
                <div className="flex justify-around">
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Total Comisiones (10%):</p>
                    <p className="text-3xl font-semibold text-white">$450</p>
                  </div>
                  <div className="text-center">
                    <p className="text-white/70 text-sm">Ventas Recientes:</p>
                    <p className="text-3xl font-semibold text-white">$3000</p>
                  </div>
                </div>
              </GlassCard>
            </div>

            {/* Right sidebar (desktop only) */}
            <div className="hidden xl:block w-72 flex-shrink-0 space-y-6">
              {/* Upload section */}
              <GlassCard className="p-6" hover={false} id="upload-section">
                <h3 className="text-lg font-medium text-white text-center mb-4">
                  Subir Nuevo Portafolio
                </h3>
                
                {/* Client Name */}
                <div className="mb-3">
                  <label className="block text-white/60 text-xs mb-1">Nombre del Cliente</label>
                  <input
                    type="text"
                    placeholder="Nombre completo"
                    value={uploadForm.clientName}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, clientName: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/30 rounded-xl border border-white/20 
                              text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <label className="block text-white/60 text-xs mb-1">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="809-000-0000"
                    value={uploadForm.phone}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/30 rounded-xl border border-white/20 
                              text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                {/* Date */}
                <div className="mb-3">
                  <label className="block text-white/60 text-xs mb-1">Fecha</label>
                  <input
                    type="date"
                    value={uploadForm.date}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/30 rounded-xl border border-white/20 
                              text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                {/* Invoice Code (optional) */}
                <div className="mb-4">
                  <label className="block text-white/60 text-xs mb-1">Código Factura (Opcional)</label>
                  <input
                    type="text"
                    placeholder="FAC-000"
                    value={uploadForm.invoiceCode}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, invoiceCode: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-black/30 rounded-xl border border-white/20 
                              text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                  />
                </div>

                {/* Drag and drop zone for photos */}
                <div 
                  ref={dropZoneRef}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/40 rounded-2xl p-4 text-center mb-3 hover:border-red-500/60 transition-colors cursor-pointer"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <Image className="w-6 h-6 mx-auto text-white/60 mb-1" />
                  <p className="text-white/70 text-sm">Arrastrar y Soltar Fotos</p>
                  <p className="text-white/50 text-xs mt-1">o clic para seleccionar</p>
                </div>

                {/* Video upload zone */}
                <div 
                  onClick={() => videoInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-4 text-center mb-4 transition-colors cursor-pointer ${uploadedVideo ? 'border-red-500 bg-red-500/10' : 'border-white/40 hover:border-red-500/60'}`}
                >
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    onChange={handleVideoSelect}
                    className="hidden"
                  />
                  <Video className={`w-6 h-6 mx-auto mb-1 ${uploadedVideo ? 'text-red-500' : 'text-white/60'}`} />
                  <p className={`text-sm ${uploadedVideo ? 'text-red-400' : 'text-white/70'}`}>
                    {uploadedVideo ? 'Video Seleccionado' : 'Subir Video (Opcional)'}
                  </p>
                  <p className="text-white/50 text-xs mt-1">
                    {uploadedVideo ? uploadedVideo.name : 'MP4, MOV, AVI'}
                  </p>
                </div>

                {/* Video preview */}
                {uploadedVideo && (
                  <div className="mb-4">
                    <div className="relative rounded-lg overflow-hidden">
                      <video 
                        src={uploadedVideo.url} 
                        className="w-full h-32 object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeUploadedVideo(); }}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )}

                {/* Preview uploaded photos */}
                {uploadedPhotos.length > 0 && (
                  <div className="mb-4">
                    <p className="text-white/60 text-xs mb-2">{uploadedPhotos.length} foto(s) seleccionada(s)</p>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedPhotos.map((photo, idx) => (
                        <div key={idx} className="relative aspect-square">
                          <img src={photo} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover rounded-lg" />
                          <button
                            onClick={() => removeUploadedPhoto(idx)}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <GlassButton variant="primary" className="w-full" onClick={handleSubmitPortfolio}>
                  Subir y Asignar
                </GlassButton>
              </GlassCard>

              {/* Finances chart */}
              <GlassCard className="p-6" hover={false}>
                <h3 className="text-lg font-medium text-white text-center mb-4">
                  Finanzas
                </h3>
                {/* Simple chart placeholder */}
                <div className="h-32 flex items-end justify-around gap-1">
                  {[200, 400, 300, 600, 800, 400].map((height, i) => (
                    <motion.div
                      key={i}
                      className="w-8 bg-gradient-to-t from-rose-400/60 to-rose-300/40 rounded-t-lg"
                      initial={{ height: 0 }}
                      animate={{ height: `${(height / 800) * 100}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  ))}
                </div>
                <div className="flex justify-around text-xs text-white/60 mt-2">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </GlassCard>
            </div>
          </div>
        </main>
      </div>

      {/* Bottom navigation (mobile only) */}
      <BottomNav  />

      {/* Client View Modal */}
      <AnimatePresence>
        {selectedClient && (
          <ClientViewModal
            client={selectedClient}
            photos={clientPhotos[selectedClient.id] || []}
            video={clientVideos[selectedClient.id] || null}
            onClose={() => setSelectedClient(null)}
            onDeletePhoto={(indices) => {
              deletePhotosFromPortfolio(selectedClient.id, indices);
            }}
            onUploadPhotos={(e) => {
              const files = Array.from(e.target.files);
              const newUrls = files.map(file => URL.createObjectURL(file));
              addPhotosToPortfolio(selectedClient.id, newUrls);
            }}
            onEditClient={(editForm) => {
              updatePortfolio(selectedClient.id, { clientName: editForm.clientName, phone: editForm.phone });
              setSelectedClient(prev => ({ ...prev, ...editForm }));
            }}
            onDeleteClient={() => {
              deletePortfolio(selectedClient.id);
            }}
            onDeleteVideo={() => {
              deleteVideoFromPortfolio(selectedClient.id);
            }}
            onUploadVideo={(e) => {
              const file = e.target.files[0];
              if (file && file.type.startsWith('video/')) {
                addVideoToPortfolio(selectedClient.id, URL.createObjectURL(file));
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
