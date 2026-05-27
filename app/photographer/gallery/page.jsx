"use client"

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import PhotoCard from '@/components/photographer/PhotoCard';
import { GlassCard, GlassButton } from '@/components/photographer/ui';
import { CheckCircle, Package, Video, Download, Play, Receipt, ShieldCheck, AlertCircle, Phone, User, Loader2 } from 'lucide-react';
import { logActivity } from '@/lib/store';
import {
  addPhotoSaleEvent,
  findInvoiceByNumberFromDb,
  findInvoicesByPhoneFromDb,
  markInvoiceRedeemedInDb,
} from '@/lib/photography-db';
import { supabase } from '@/lib/supabase';

// Background image

// Local fallback photos

const fallbackPhotos = Array.from({ length: 8 }, (_, i) => `/photographer/photos/bubble-photos (${i + 1}).png`);

// Default plans (fallback if Supabase unavailable)
const DEFAULT_PLANS = [
  { id: 'basic', name: 'Básico', price: 30, minPhotos: 1, maxPhotos: 2, description: '1-2 fotos' },
  { id: 'standard', name: 'Estándar', price: 50, minPhotos: 3, maxPhotos: 4, description: '3-4 fotos' },
  { id: 'full', name: 'Completo', price: 70, minPhotos: 5, maxPhotos: Infinity, description: '5+ fotos' },
];

const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || '';
const PAYPAL_OPTIONS = {
  clientId: PAYPAL_CLIENT_ID,
  currency: 'USD',
  intent: 'capture',
  enableFunding: 'card',
  disableFunding: 'paylater,venmo',
  locale: 'es_DO',
};

async function createPayPalOrderFromApi(amount) {
  const response = await fetch('/api/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount,
      currency: 'USD',
      description: 'Compra de fotografia - Macao Evolution',
    }),
  });

  const payload = await response.json();
  if (!response.ok || !payload?.id) {
    throw new Error(payload?.error || 'No se pudo crear la orden de PayPal');
  }

  return payload.id;
}

async function capturePayPalOrderFromApi(orderId) {
  const response = await fetch('/api/paypal/capture-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ orderId }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error || 'No se pudo capturar el pago de PayPal');
  }

  return payload;
}

function formatExpiryInput(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function isValidCardNumber(value) {
  const digits = value.replace(/\D/g, '');
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function isValidExpiry(value) {
  if (!/^\d{2}\/\d{2}$/.test(value)) return false;
  const [mmRaw, yyRaw] = value.split('/');
  const mm = Number(mmRaw);
  const yy = Number(yyRaw);
  if (mm < 1 || mm > 12) return false;

  const now = new Date();
  const expiry = new Date(2000 + yy, mm, 0, 23, 59, 59, 999);
  return expiry >= now;
}

function sanitizeCardholderName(value) {
  return value
    .replace(/[0-9]/g, '')
    .replace(/[^A-Za-zÀ-ÿ'\-\s]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trimStart();
}

function isValidCardholderName(value) {
  return /^[A-Za-zÀ-ÿ'\-\s]{2,}$/.test(value.trim());
}

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

  // State for data fetched from Supabase
  const [dbPortfolios, setDbPortfolios] = useState([]);
  const [dbPhotos, setDbPhotos] = useState({});
  const [dbVideos, setDbVideos] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [videoPrice, setVideoPrice] = useState(60);

  // Fetch pricing from Supabase
  useEffect(() => {
    async function fetchPricing() {
      try {
        const { data, error } = await supabase
          .from('photo_pricing')
          .select('*')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (error) throw error;
        if (data && data.length > 0) {
          const packages = data
            .filter(p => p.category === 'package')
            .map(p => ({
              id: p.code,
              name: p.name,
              price: parseFloat(p.price),
              minPhotos: p.min_photos ?? 1,
              maxPhotos: p.max_photos ?? Infinity,
              description: p.description || '',
            }));
          if (packages.length > 0) setPlans(packages);
          const vid = data.find(p => p.category === 'video');
          if (vid) setVideoPrice(parseFloat(vid.price));
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
        // Keep defaults
      }
    }
    fetchPricing();
  }, []);

  // Fetch portfolio data from Supabase via API
  useEffect(() => {
    if (!phone) {
      setIsLoading(false);
      return;
    }

    async function fetchPortfolios() {
      try {
        setIsLoading(true);
        setFetchError(null);
        const res = await fetch(`/api/portfolios?phone=${encodeURIComponent(phone)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setDbPortfolios(data.portfolios || []);
        setDbPhotos(data.photos || {});
        setDbVideos(data.videos || {});
      } catch (err) {
        console.error('Error fetching gallery:', err);
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolios();
  }, [phone]);

  const [phoneInvoices, setPhoneInvoices] = useState([]);
  // Lookup invoices by phone from Supabase
  useEffect(() => {
    async function loadPhoneInvoices() {
      if (!phone) {
        setPhoneInvoices([]);
        return;
      }
      const rows = await findInvoicesByPhoneFromDb(phone);
      setPhoneInvoices(
        rows.map((r) => ({
          invoiceNumber: r.invoice_number,
          clientName: r.client_name,
          clientPhone: r.client_phone,
          total: Number(r.total || 0),
          currency: r.currency || 'USD',
          redeemed: Boolean(r.redeemed),
          redeemedAt: r.redeemed_at,
        })),
      );
    }
    loadPhoneInvoices();
  }, [phone]);
  const hasInvoice = phoneInvoices.length > 0;

  // Saved payment state (card data stored after a successful purchase)
  const [savedPayment, setSavedPayment] = useState(null);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [savedCardCvc, setSavedCardCvc] = useState('');
  const [savedCardCvcError, setSavedCardCvcError] = useState('');

  // Load saved payment method for this phone
  useEffect(() => {
    async function loadSavedPayment() {
      if (!phone) return;
      const { data, error } = await supabase
        .from('photo_saved_payments')
        .select('cardholder_name, last4, exp')
        .eq('phone', phone)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!error && data) setSavedPayment(data);
    }
    loadSavedPayment();
  }, [phone]);

  // Build gallery photos from Supabase data, fall back to demo
  const galleryPhotos = useMemo(() => {
    const realPhotos = [];
    dbPortfolios.forEach(p => {
      const photos = dbPhotos[p.id] || [];
      photos.forEach((img, i) => realPhotos.push({ id: `${p.id}_${i}`, image: img }));
    });
    if (realPhotos.length > 0) return realPhotos;
    return fallbackPhotos.map((img, i) => ({ id: i + 1, image: img }));
  }, [dbPortfolios, dbPhotos]);

  // Get video if any
  const portfolioVideo = useMemo(() => {
    for (const p of dbPortfolios) {
      if (dbVideos[p.id]) return dbVideos[p.id];
    }
    return null;
  }, [dbPortfolios, dbVideos]);

  const clientName = dbPortfolios[0]?.clientName || phoneInvoices[0]?.clientName || 'Cliente';

  const [selectedIds, setSelectedIds] = useState([]);
  const [videoSelected, setVideoSelected] = useState(false);
  
  // Invoice verification states
  const [invoiceCode, setInvoiceCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verifiedInvoice, setVerifiedInvoice] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [visibleCount, setVisibleCount] = useState(4);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchaseTarget, setPurchaseTarget] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('paypal');
  const [paymentForm, setPaymentForm] = useState({
    name: '',
    cardNumber: '',
    exp: '',
    cvc: '',
  });
  const [paymentErrors, setPaymentErrors] = useState({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const LOAD_MORE_COUNT = 12;

  const visiblePhotos = galleryPhotos.slice(0, visibleCount);
  const hasMorePhotos = visibleCount < galleryPhotos.length;

  const handleLoadMore = () => {
    setVisibleCount(prev => Math.min(prev + LOAD_MORE_COUNT, galleryPhotos.length));
  };

  const handleShowAll = () => {
    setVisibleCount(galleryPhotos.length);
  };

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

  const updateAllPortfoliosStatus = async (status) => {
    const ids = dbPortfolios.map((p) => p.id).filter(Boolean);
    if (ids.length === 0) return;

    await Promise.all(ids.map(async (id) => {
      try {
        await fetch(`/api/portfolios?id=${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'set_status', status }),
        });
      } catch (err) {
        console.error(`Error updating status for portfolio ${id}:`, err);
      }
    }));

    setDbPortfolios((prev) => prev.map((p) => ({ ...p, status })));
  };

  const openPaymentForPlan = (plan) => {
    if (!isPlanActive(plan)) return;
    setPurchaseTarget({ type: 'plan', plan });
    setPaymentMethod('paypal');
    setPaymentErrors({});
    setUseSavedCard(!!savedPayment);
    setSavedCardCvc('');
    setSavedCardCvcError('');
    setShowPaymentModal(true);
  };

  const openPaymentForVideo = () => {
    if (videoSelected && portfolioVideo) {
      setPurchaseTarget({ type: 'video' });
      setPaymentMethod('paypal');
      setPaymentErrors({});
      setUseSavedCard(!!savedPayment);
      setSavedCardCvc('');
      setSavedCardCvcError('');
      setShowPaymentModal(true);
    } else if (videoSelected) {
      alert('El video aún no está disponible.');
    }
  };

  const getPaymentAmount = () => {
    if (purchaseTarget?.type === 'plan') return Number(purchaseTarget?.plan?.price || 0);
    if (purchaseTarget?.type === 'video') return Number(videoPrice || 0);
    return 0;
  };

  const validateCardPayment = () => {
    const nextErrors = {};

    if (!isValidCardholderName(paymentForm.name)) {
      nextErrors.name = 'El nombre debe tener solo letras y espacios.';
    }
    if (!isValidCardNumber(paymentForm.cardNumber)) {
      nextErrors.cardNumber = 'Número de tarjeta inválido.';
    }
    if (!isValidExpiry(paymentForm.exp)) {
      nextErrors.exp = 'Fecha inválida o expirada.';
    }
    if (!/^\d{3,4}$/.test(paymentForm.cvc)) {
      nextErrors.cvc = 'CVC inválido.';
    }

    setPaymentErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const completePurchase = async (method = 'card') => {
    if (purchaseTarget?.type === 'plan') {
      const plan = purchaseTarget.plan;
      await addPhotoSaleEvent({
        eventType: 'online_purchase',
        phone,
        clientName,
        planName: plan.name,
        amount: Number(plan.price || 0),
        currency: 'USD',
        source: method === 'paypal' ? 'paypal' : 'online',
        metadata: {
          photos: selectedIds.length,
          type: 'plan',
          selectedPhotoIds: selectedIds,
        },
      });
      logActivity('Venta online', `${clientName} - Plan ${plan.name} - US$ ${plan.price}`);
      await updateAllPortfoliosStatus('Vendido');
      await handleDownloadSelected();
      alert(`Pago aprobado. Plan ${plan.name} comprado y descarga iniciada.`);
    }

    if (purchaseTarget?.type === 'video' && portfolioVideo) {
      await addPhotoSaleEvent({
        eventType: 'online_purchase',
        phone,
        clientName,
        planName: 'Video',
        amount: Number(videoPrice || 0),
        currency: 'USD',
        source: method === 'paypal' ? 'paypal' : 'online',
        metadata: {
          photos: 0,
          type: 'video',
        },
      });
      logActivity('Venta video online', `${clientName} - US$ ${videoPrice}`);
      await updateAllPortfoliosStatus('Vendido');
      await downloadImage(portfolioVideo, 'macao-video-aventura.mp4');
      await updateAllPortfoliosStatus('Descargado');
      alert('Pago aprobado. Video comprado y descargado.');
    }

    // Save card for future payments (only when using a new card, not saved card)
    if (method === 'card' && !useSavedCard && paymentForm.name && paymentForm.cardNumber) {
      const last4 = paymentForm.cardNumber.replace(/\D/g, '').slice(-4);
      const captured = { cardholder_name: paymentForm.name, last4, exp: paymentForm.exp };
      supabase
        .from('photo_saved_payments')
        .upsert({ phone, ...captured, updated_at: new Date().toISOString() }, { onConflict: 'phone' })
        .then(({ error }) => { if (!error) setSavedPayment(captured); });
    }

    setShowPaymentModal(false);
    setPurchaseTarget(null);
    setPaymentMethod('paypal');
    setPaymentErrors({});
    setPaymentForm({ name: '', cardNumber: '', exp: '', cvc: '' });
    setSavedCardCvc('');
    setSavedCardCvcError('');
  };

  const handleConfirmPayment = async () => {
    if (paymentMethod !== 'card') {
      alert('Selecciona PayPal o usa tarjeta para completar el pago.');
      return;
    }

    // Paying with saved card — only need CVC
    if (useSavedCard && savedPayment) {
      if (!/^\d{3,4}$/.test(savedCardCvc)) {
        setSavedCardCvcError('CVC inválido.');
        return;
      }
      setSavedCardCvcError('');
      setIsProcessingPayment(true);
      try {
        await completePurchase('card');
      } finally {
        setIsProcessingPayment(false);
      }
      return;
    }

    if (!validateCardPayment()) return;

    setIsProcessingPayment(true);

    try {
      await completePurchase('card');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Verify invoice code
  const handleVerifyInvoice = async () => {
    if (!invoiceCode.trim()) {
      setVerificationError('Por favor ingresa un código de factura');
      return;
    }

    setIsVerifying(true);
    setVerificationError('');
    const found = await findInvoiceByNumberFromDb(invoiceCode.trim());

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

    const marked = await markInvoiceRedeemedInDb(found.invoice_number);
    if (!marked) {
      setVerificationError('No se pudo validar la factura en este momento. Intenta nuevamente.');
      setIsVerifying(false);
      return;
    }

    await addPhotoSaleEvent({
      eventType: 'invoice_redeemed',
      phone,
      clientName: found.client_name || clientName,
      invoiceNumber: found.invoice_number,
      amount: Number(found.total || 0),
      currency: found.currency || 'USD',
      source: 'billing_redeem',
    });

    logActivity('Factura canjeada', `${found.invoice_number} — ${clientName}`);

    setVerifiedInvoice({
      invoiceNumber: found.invoice_number,
      clientName: found.client_name,
      redeemed: true,
    });
    setIsVerified(true);
    setVerificationError('');
    setIsVerifying(false);
  };

  // Download a single file by creating a temporary link
  const downloadImage = async (src, filename) => {
    try {
      // Use no-cors fetch to get the file as a blob for same-origin download
      const response = await fetch(src, { mode: 'cors' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoking the blob URL so the browser has time to start the download,
      // especially important for large video files.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      // Fallback: proxy the download through our own API to avoid CORS issues
      // and ensure the Content-Disposition header triggers a download
      try {
        const proxyUrl = `/api/download?url=${encodeURIComponent(src)}&filename=${encodeURIComponent(filename)}`;
        const a = document.createElement('a');
        a.href = proxyUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } catch {
        // Last resort: open in new tab
        window.open(src, '_blank');
      }
    }
  };

  // Handle download all photos + video (sequential with small delay to avoid browser blocking)
  const handleDownloadAll = async () => {
    if (galleryPhotos.length === 0 && !portfolioVideo) return;
    for (let i = 0; i < galleryPhotos.length; i++) {
      const photo = galleryPhotos[i];
      await downloadImage(photo.image, `macao-foto-${i + 1}.png`);
      // Small delay so the browser doesn't block rapid downloads
      if (i < galleryPhotos.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    // Also download video if available
    if (portfolioVideo) {
      await new Promise(r => setTimeout(r, 400));
      await downloadImage(portfolioVideo, 'macao-video-aventura.mp4');
    }
    logActivity('Descarga completa', `${clientName} descargó ${galleryPhotos.length} fotos${portfolioVideo ? ' + video' : ''}`);
    await updateAllPortfoliosStatus('Descargado');
    await addPhotoSaleEvent({
      eventType: 'download',
      phone,
      clientName,
      invoiceNumber: verifiedInvoice?.invoiceNumber || null,
      amount: 0,
      source: 'gallery',
      metadata: {
        photos: galleryPhotos.length,
        includesVideo: Boolean(portfolioVideo),
        mode: 'all',
      },
    });
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
    await updateAllPortfoliosStatus('Descargado');
    await addPhotoSaleEvent({
      eventType: 'download',
      phone,
      clientName,
      invoiceNumber: verifiedInvoice?.invoiceNumber || null,
      amount: 0,
      source: 'gallery',
      metadata: {
        photos: selected.length,
        includesVideo: false,
        mode: 'selected',
      },
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/70 text-lg">Cargando tu galería...</p>
        </div>
      </div>
    );
  }

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

        {/* Expiration warning */}
        {dbPortfolios.length > 0 && (() => {
          const minDays = Math.min(...dbPortfolios.map(p => p.remainingDays ?? 15));
          if (minDays <= 0) return null;
          const urgent = minDays <= 3;
          const warning = minDays <= 7;
          return (
            <motion.div
              className={`mt-4 block mx-auto w-fit px-8 py-3 rounded-xl text-base font-bold tracking-wide ${
                urgent ? 'bg-red-600 text-white shadow-lg shadow-red-600/40' :
                warning ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30' :
                'bg-white/20 backdrop-blur-sm text-white border border-white/30'
              }`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              {urgent
                ? `⚠️ Tu galería expira en ${minDays} día${minDays !== 1 ? 's' : ''}. ¡Descarga tus fotos ahora!`
                : `📅 Tienes ${minDays} días para descargar tus fotos y videos`
              }
            </motion.div>
          );
        })()}
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
              Tu pago ha sido confirmado. Puedes descargar todas tus fotos{portfolioVideo ? ' y video' : ''} sin costo adicional.
            </p>
            <GlassButton
              variant="primary"
              className="w-full flex items-center justify-center gap-2"
              onClick={handleDownloadAll}
            >
              <Download className="w-5 h-5" />
              Descargar Todo {portfolioVideo ? '(Fotos + Video)' : '(Fotos)'}
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
          {visiblePhotos.map((photo, index) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(index * 0.05, 0.5) }}
              className="relative"
            >
              <PhotoCard
                image={photo.image}
                isSelected={selectedIds.includes(photo.id)}
                onSelect={() => toggleSelect(photo.id)}
              />
              {/* "Ver más" overlay on the 4th photo */}
              {index === 3 && hasMorePhotos && visibleCount === 4 && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleLoadMore}
                  className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl cursor-pointer z-10"
                >
                  <span className="text-white text-3xl font-bold">+{galleryPhotos.length - 4}</span>
                  <span className="text-white text-sm font-medium mt-1">Ver más</span>
                </motion.button>
              )}
            </motion.div>
          ))}
        </div>

        {/* Load more / Show all buttons */}
        {hasMorePhotos && visibleCount > 4 && (
          <motion.div
            className="flex justify-center gap-4 mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassButton variant="secondary" onClick={handleLoadMore} className="px-6">
              Ver más ({Math.min(LOAD_MORE_COUNT, galleryPhotos.length - visibleCount)} fotos)
            </GlassButton>
            <GlassButton variant="primary" onClick={handleShowAll} className="px-6">
              Ver todas ({galleryPhotos.length - visibleCount} restantes)
            </GlassButton>
          </motion.div>
        )}

        {hasMorePhotos && visibleCount === 4 && (
          <motion.div
            className="flex justify-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <GlassButton variant="primary" onClick={handleShowAll} className="px-8">
              Ver todas las fotos ({galleryPhotos.length})
            </GlassButton>
          </motion.div>
        )}

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
                    onClick={() => openPaymentForPlan(plan)}
                    disabled={!isActive}
                  >
                    {isActive ? 'Comprar' : plan.description}
                  </GlassButton>
                </GlassCard>
              );
            })}
          </div>

          {/* Video Section — only show if photographer uploaded a video */}
          {portfolioVideo && (
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
                    src={galleryPhotos[0]?.image || '/photographer/photos/bubble-photos (1).png'} 
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
                  ${videoPrice} <span className="text-base font-normal">USD</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <GlassButton
                    variant={videoSelected ? "primary" : "secondary"}
                    className={`flex items-center gap-2 ${!videoSelected ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      openPaymentForVideo();
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
          )}
        </motion.div>
        )}

        {/* If user has verified invoice → show video for separate download */}
        {isVerified && portfolioVideo && (
          <motion.div
            className="mt-8 max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="font-title text-2xl text-center text-white mb-4">
              Video de tu Aventura
            </h2>
            <GlassCard className="p-6" hover={false}>
              <video
                src={portfolioVideo}
                controls
                className="w-full rounded-lg mb-4"
                style={{ maxHeight: '300px' }}
              />
              <GlassButton
                variant="primary"
                className="w-full flex items-center justify-center gap-2"
                onClick={() => downloadImage(portfolioVideo, 'macao-video-aventura.mp4')}
              >
                <Download className="w-5 h-5" />
                Descargar Video
              </GlassButton>
            </GlassCard>
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

      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { setShowPaymentModal(false); setSavedCardCvc(''); setSavedCardCvcError(''); }}
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <GlassCard className="p-6" hover={false}>
                <h3 className="text-white text-xl font-semibold mb-1">Pagar ahora</h3>
                <p className="text-white/60 text-sm mb-5">
                  {purchaseTarget?.type === 'plan'
                    ? `Plan ${purchaseTarget?.plan?.name} - US$ ${purchaseTarget?.plan?.price}`
                    : `Video Aventura - US$ ${videoPrice}`}
                </p>

                <div className="mb-4 rounded-xl border border-white/20 bg-white/5 p-3 text-center text-sm text-white/80">
                  Método: PayPal (cuenta o tarjeta)
                </div>

                <div className="rounded-xl border border-white/15 p-3 bg-black/20">
                  {!PAYPAL_CLIENT_ID ? (
                    <p className="text-sm text-yellow-300">Falta configurar PayPal. Define `NEXT_PUBLIC_PAYPAL_CLIENT_ID` para habilitarlo.</p>
                  ) : (
                    <PayPalScriptProvider options={PAYPAL_OPTIONS}>
                      <p className="text-xs text-white/70 mb-3">
                        Puedes pagar con cuenta PayPal o con tarjeta sin crear cuenta.
                      </p>
                      <PayPalButtons
                        style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                        forceReRender={[getPaymentAmount()]}
                        createOrder={async () => createPayPalOrderFromApi(getPaymentAmount())}
                        onApprove={async (data) => {
                          if (!data?.orderID) throw new Error('Orden de PayPal inválida');
                          setIsProcessingPayment(true);
                          try {
                            await capturePayPalOrderFromApi(data.orderID);
                            await completePurchase('paypal');
                          } finally {
                            setIsProcessingPayment(false);
                          }
                        }}
                        onError={(err) => {
                          console.error('PayPal error:', err);
                          alert('No se pudo completar el pago con PayPal. Intenta de nuevo.');
                        }}
                      />
                    </PayPalScriptProvider>
                  )}
                </div>

                <div className="flex gap-3 mt-6">
                  <GlassButton variant="secondary" className="flex-1" onClick={() => { setShowPaymentModal(false); setSavedCardCvc(''); setSavedCardCvcError(''); }}>
                    Cancelar
                  </GlassButton>
                  <GlassButton variant="primary" className="flex-1" disabled>
                    Completa el pago arriba
                  </GlassButton>
                </div>
              </GlassCard>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
