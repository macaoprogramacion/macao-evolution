"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoCard from '@/components/photographer/PhotoCard';
import { GlassCard, GlassButton } from '@/components/photographer/ui';
import { CheckCircle, Package, Video, Download, Play, Receipt, ShieldCheck, AlertCircle, Phone, User } from 'lucide-react';
import { usePortfolio } from '@/context/PortfolioContext';
import { findInvoicesByPhone, findInvoiceByNumber, markInvoiceRedeemed, logActivity, addPhotoSale } from '@/lib/store';

// Background image

// Local fallback photos

const fallbackPhotos = Array.from({ length: 8 }, (_, i) => `/photographer/photos/bubble-photos (${i + 1}).png`);

// Plans configuration
const plans = [
  { id: 'basic', name: 'Básico', price: 30, minPhotos: 1, maxPhotos: 2, description: '1-2 fotos' },
  { id: 'standard', name: 'Estándar', price: 50, minPhotos: 3, maxPhotos: 4, description: '3-4 fotos' },
  { id: 'full', name: 'Completo', price: 70, minPhotos: 5, maxPhotos: Infinity, description: '5+ fotos' },
];

export default function ClientGalleryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-black text-white">Cargando galería...</div>}>
      <ClientGallery />
    </Suspense>
  );
}

function ClientGallery() {
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone');
  const { findByPhone, findAllByPhone, clientPhotos, clientVideos } = usePortfolio();

  // Lookup invoices and portfolio by phone
  const phoneInvoices = useMemo(() => phone ? findInvoicesByPhone(phone) : [], [phone]);
  const hasInvoice = phoneInvoices.length > 0;
  const portfolios = useMemo(() => phone ? findAllByPhone(phone) : [], [phone, findAllByPhone]);

  // Build gallery photos from real portfolio data, fall back to demo
  const galleryPhotos = useMemo(() => {
    const realPhotos = [];
    portfolios.forEach(p => {
      const photos = clientPhotos[p.id] || [];
      photos.forEach((img, i) => realPhotos.push({ id: `${p.id}_${i}`, image: img }));
    });
    if (realPhotos.length > 0) return realPhotos;
    return fallbackPhotos.map((img, i) => ({ id: i + 1, image: img }));
  }, [portfolios, clientPhotos]);

  // Get video if any
  const portfolioVideo = useMemo(() => {
    for (const p of portfolios) {
      if (clientVideos[p.id]) return clientVideos[p.id];
    }
    return null;
  }, [portfolios, clientVideos]);

  const clientName = portfolios[0]?.clientName || phoneInvoices[0]?.clientName || 'Cliente';

  const [selectedIds, setSelectedIds] = useState([]);
  const [videoSelected, setVideoSelected] = useState(false);
  
  // Invoice verification states
  const [invoiceCode, setInvoiceCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verifiedInvoice, setVerifiedInvoice] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const toggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedIds.length === galleryPhotos.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(galleryPhotos.map(p => p.id));
    }
  };

  const isPlanActive = (plan) => {
    const count = selectedIds.length;
    return count >= plan.minPhotos && count <= plan.maxPhotos;
  };

  const handlePlanSelect = async (plan) => {
    if (isPlanActive(plan)) {
      addPhotoSale({
        id: `sale_${Date.now()}`,
        phone,
        clientName,
        plan: plan.name,
        amount: plan.price,
        photos: selectedIds.length,
        date: new Date().toLocaleDateString('es-DO'),
        source: 'online',
      });
      logActivity('Venta online', `${clientName} — Plan ${plan.name} — US$ ${plan.price}`);
      // Download the selected photos
      await handleDownloadSelected();
      alert(`¡Compra exitosa! Plan ${plan.name} por $${plan.price}. Tus fotos se están descargando.`);
    }
  };

  const handleVideoPurchase = async () => {
    if (videoSelected && portfolioVideo) {
      addPhotoSale({
        id: `sale_video_${Date.now()}`,
        phone,
        clientName,
        plan: 'Video',
        amount: 60,
        photos: 0,
        date: new Date().toLocaleDateString('es-DO'),
        source: 'online',
      });
      logActivity('Venta video online', `${clientName} — US$ 60`);
      await downloadImage(portfolioVideo, 'macao-video-aventura.mp4');
      alert('¡Video comprado y descargado exitosamente!');
    } else if (videoSelected) {
      alert('El video aún no está disponible.');
    }
  };

  // Verify invoice code
  const handleVerifyInvoice = () => {
    if (!invoiceCode.trim()) {
      setVerificationError('Por favor ingresa un código de factura');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');

    setTimeout(() => {
      const found = findInvoiceByNumber(invoiceCode.trim());

      if (!found) {
        setVerificationError('Código de factura no encontrado. Verifica que esté correcto.');
        setIsVerifying(false);
        return;
      }

      if (found.redeemed) {
        setVerificationError('Esta factura ya fue canjeada anteriormente.');
        setIsVerifying(false);
        return;
      }

      // Mark invoice as redeemed
      markInvoiceRedeemed(found.invoiceNumber);
      logActivity('Factura canjeada', `${found.invoiceNumber} — ${clientName}`);

      setVerifiedInvoice(found);
      setIsVerified(true);
      setVerificationError('');
      setIsVerifying(false);
    }, 500);
  };

  // Download a single image by creating a temporary link
  const downloadImage = async (src, filename) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // Fallback: open in new tab
      window.open(src, '_blank');
    }
  };

  // Handle download all photos (sequential with small delay to avoid browser blocking)
  const handleDownloadAll = async () => {
    if (galleryPhotos.length === 0) return;
    for (let i = 0; i < galleryPhotos.length; i++) {
      const photo = galleryPhotos[i];
      await downloadImage(photo.image, `macao-foto-${i + 1}.png`);
      // Small delay so the browser doesn't block rapid downloads
      if (i < galleryPhotos.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    logActivity('Descarga completa', `${clientName} descargó ${galleryPhotos.length} fotos`);
  };

  // Handle download only selected photos
  const handleDownloadSelected = async () => {
    const selected = galleryPhotos.filter(p => selectedIds.includes(p.id));
    if (selected.length === 0) return;
    for (let i = 0; i < selected.length; i++) {
      await downloadImage(selected[i].image, `macao-foto-${i + 1}.png`);
      if (i < selected.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    logActivity('Descarga parcial', `${clientName} descargó ${selected.length} fotos`);
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(/photographer/branding/photos/bg-4k-portafolio.png)`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay for better readability */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-8">
        {/* Header */}
      <motion.div
        className="text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-title text-4xl md:text-5xl tracking-widest text-white mb-4">
          MACAO OFFROAD EXPERIENCE
        </h1>

        {/* Client name */}
        <GlassCard className="inline-block px-8 py-3" hover={false}>
          <p className="text-xl text-white/80">
            Galería de <span className="font-semibold">{clientName}</span>
          </p>
        </GlassCard>
      </motion.div>

      {/* Invoice Verification Section */}
      <motion.div
        className="max-w-xl mx-auto mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        {isVerified ? (
          // Verified state
          <GlassCard className="p-6 ring-2 ring-green-500/50" hover={false}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">¡Factura Verificada!</h3>
                <p className="text-green-400 text-sm">Código: {verifiedInvoice?.invoiceNumber}</p>
              </div>
            </div>
            <p className="text-white/70 text-sm mb-4">
              Tu pago ha sido confirmado. Puedes descargar todas tus fotos sin costo adicional.
            </p>
            <GlassButton
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDownloadAll}
            >
              <Download className="w-5 h-5" />
              Descargar Todas las Fotos
            </GlassButton>
          </GlassCard>
        ) : (
          // Input state
          <GlassCard className="p-6" hover={false}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <h3 className="text-white font-semibold">¿Ya pagaste en persona?</h3>
                <p className="text-white/60 text-sm">Ingresa tu código de factura para desbloquear tus fotos</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <input
                type="text"
                value={invoiceCode}
                onChange={(e) => {
                  setInvoiceCode(e.target.value.toUpperCase());
                  setVerificationError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyInvoice()}
                placeholder="FAC-0001"
                className="flex-1 px-4 py-3 bg-black/30 rounded-xl border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all"
              />
              <GlassButton
                variant="primary"
                onClick={handleVerifyInvoice}
                disabled={isVerifying}
                className="px-6"
              >
                {isVerifying ? 'Verificando...' : 'Verificar'}
              </GlassButton>
            </div>

            {verificationError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 mt-3 text-red-400 text-sm"
              >
                <AlertCircle className="w-4 h-4" />
                {verificationError}
              </motion.div>
            )}

            <p className="text-white/40 text-xs mt-3 text-center">
              El código aparece en tu factura impresa (ej: FAC-0001)
            </p>
          </GlassCard>
        )}
      </motion.div>

      {/* Select all & Download buttons */}
      <motion.div
        className="max-w-6xl mx-auto mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex flex-wrap gap-3 items-center">
          <GlassButton
            variant={selectedIds.length === galleryPhotos.length ? "primary" : "secondary"}
            onClick={selectAll}
            className="flex items-center gap-2"
          >
            <CheckCircle className="w-5 h-5" />
            {selectedIds.length === galleryPhotos.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
          </GlassButton>

          {/* Download selected — only if verified or user bought */}
          {isVerified && selectedIds.length > 0 && (
            <GlassButton
              variant="primary"
              onClick={handleDownloadSelected}
              className="flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              Descargar Seleccionadas ({selectedIds.length})
            </GlassButton>
          )}
        </div>
        <p className="text-white/70 mt-2">
          {selectedIds.length} de {galleryPhotos.length} fotos seleccionadas
        </p>
      </motion.div>

      {/* Photo Grid */}
      <motion.div
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryPhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <PhotoCard
                image={photo.image}
                isSelected={selectedIds.includes(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
              />
            </motion.div>
          ))}
        </div>

        {/* Plans section — only show if NO paid invoice for this phone */}
        {!hasInvoice && !isVerified && (
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <h2 className="font-title text-2xl md:text-3xl text-center text-white mb-6">
            Planes
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {plans.map((plan) => {
              const isActive = isPlanActive(plan);
              return (
                <GlassCard 
                  key={plan.id}
                  className={`p-6 text-center ${isActive ? 'ring-2 ring-red-500' : 'opacity-60'}`}
                  hover={isActive}
                >
                  <Package className={`w-10 h-10 mx-auto mb-3 ${isActive ? 'text-red-500' : 'text-white/50'}`} />
                  <h3 className="font-semibold text-xl text-white mb-1">{plan.name}</h3>
                  <p className="text-white/70 text-sm mb-3">{plan.description}</p>
                  <p className={`text-3xl font-bold mb-4 ${isActive ? 'text-red-500' : 'text-white/50'}`}>
                    ${plan.price}
                  </p>
                  <GlassButton
                    variant={isActive ? "primary" : "secondary"}
                    className={`w-full ${!isActive ? 'cursor-not-allowed opacity-50' : ''}`}
                    onClick={() => handlePlanSelect(plan)}
                    disabled={!isActive}
                  >
                    {isActive ? 'Comprar' : plan.description}
                  </GlassButton>
                </GlassCard>
              );
            })}
          </div>

          {/* Video Section */}
          <motion.div
            className="mt-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <h2 className="font-title text-2xl md:text-3xl text-center text-white mb-6">
              Video de tu Aventura
            </h2>
            
            <div className="max-w-md mx-auto">
              <GlassCard 
                className={`p-6 text-center cursor-pointer transition-all ${videoSelected ? 'ring-2 ring-red-500' : ''}`}
                hover={true}
                onClick={() => setVideoSelected(!videoSelected)}
              >
                {/* Video Thumbnail Preview */}
                <div className="relative mb-4 rounded-lg overflow-hidden group">
                  <img 
                    src={photo1} 
                    alt="Video preview" 
                    className="w-full h-40 object-cover rounded-lg"
                  />
                  {/* Overlay */}
                  <div className={`absolute inset-0 flex items-center justify-center bg-black/40 transition-all ${videoSelected ? 'bg-red-500/30' : 'group-hover:bg-black/50'}`}>
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${videoSelected ? 'bg-red-500' : 'bg-white/20 group-hover:bg-white/30'}`}>
                      <Play className={`w-8 h-8 ml-1 ${videoSelected ? 'text-white' : 'text-white'}`} fill="currentColor" />
                    </div>
                  </div>
                  {/* Selected indicator */}
                  {videoSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className="w-8 h-8 text-red-500 bg-white rounded-full" />
                    </div>
                  )}
                  {/* Duration badge */}
                  <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs font-medium">
                    03:24
                  </div>
                </div>
                <h3 className="font-semibold text-xl text-white mb-2">Video Aventura</h3>
                <p className="text-white/70 text-sm mb-3">
                  Video HD de tu experiencia completa
                </p>
                <p className={`text-3xl font-bold mb-4 ${videoSelected ? 'text-red-500' : 'text-white/70'}`}>
                  $60 <span className="text-base font-normal">USD</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <GlassButton
                    variant={videoSelected ? "primary" : "secondary"}
                    className={`flex items-center gap-2 ${!videoSelected ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVideoPurchase();
                    }}
                    disabled={!videoSelected}
                  >
                    <Download className="w-5 h-5" />
                    Comprar Video
                  </GlassButton>
                </div>
                <p className="text-white/50 text-xs mt-3">
                  {videoSelected ? 'Video seleccionado - Click para deseleccionar' : 'Click para seleccionar el video'}
                </p>
              </GlassCard>
            </div>
          </motion.div>
        </motion.div>
        )}

        {/* If user has invoice → show message that photos are included */}
        {hasInvoice && !isVerified && (
          <motion.div className="mt-8 max-w-xl mx-auto text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
            <GlassCard className="p-6" hover={false}>
              <Receipt className="w-10 h-10 text-[#DC2626] mx-auto mb-3" />
              <h3 className="text-white font-semibold text-lg mb-2">Tienes una factura pagada en tienda</h3>
              <p className="text-white/60 text-sm mb-4">
                Ingresa tu código de factura arriba para desbloquear la descarga de todas tus fotos sin costo adicional.
              </p>
            </GlassCard>
          </motion.div>
        )}
      </motion.div>
      </div>
    </div>
  );
}
