"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import DashboardAuthGate from '@/components/photographer/DashboardAuthGate';
import {
  FileText,
  TrendingUp,
  User,
  RotateCcw,
  Clock,
  Search,
  Barcode,
  Plus,
  Minus,
  Trash2,
  X,
  ChevronDown,
  DollarSign,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Package,
  Receipt,
  Settings,
  Bell,
  LogOut,
  Edit,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Phone,
  Printer,
  ClipboardList,
  Sun,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { clearDashboardSession, getDashboardSession, setDashboardSession } from '@/lib/dashboard-session';
import {
  formatInvoiceNumber,
  addBillingClient,
  logActivity,
  getActivity,
  calculateSalesByTurno,
} from '@/lib/store';
import {
  addPhotoSaleEvent,
  getPhotoExchangeRates,
  getLatestDailyClosure,
  savePhotoExchangeRates,
  saveDailyClosure,
} from '@/lib/photography-db';

// Background image

// Demo product data
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'PAQUETE BÁSICO',
    price: 30.00,
    code: 'PAQ-BAS',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=300&h=200&fit=crop',
    description: '30 fotos digitales HD',
  },
  {
    id: 2,
    name: 'PAQUETE ESTÁNDAR',
    price: 50.00,
    code: 'PAQ-EST',
    image: 'https://images.unsplash.com/photo-1554048612-b6a482bc67e5?w=300&h=200&fit=crop',
    description: '50 fotos digitales HD + 5 editadas',
  },
  {
    id: 3,
    name: 'PAQUETE COMPLETO',
    price: 70.00,
    code: 'PAQ-COM',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=300&h=200&fit=crop',
    description: 'Todas las fotos + edición profesional',
  },
  {
    id: 4,
    name: 'VIDEO AVENTURA',
    price: 60.00,
    code: 'VID-001',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=300&h=200&fit=crop',
    description: 'Video HD de la experiencia completa',
  },
];

// Photographers will be loaded from Supabase

// Sidebar menu items
const sidebarItems = [
  { id: 'nueva', icon: FileText, label: 'Nueva Factura' },
  { id: 'usuario', icon: User, label: 'Usuario' },
  { id: 'devolucion', icon: RotateCcw, label: 'Devolucion' },
  { id: 'turnos', icon: Clock, label: 'Ventas por Turno' },
  { id: 'cierre-turno', icon: ClipboardList, label: 'Resumen Turno' },
  { id: 'cierre-dia', icon: Sun, label: 'Historial Cierres' },
];

// Usuario Panel Component
function UsuarioPanel({ user, invoices, onLogout, onSaveProfile, savingProfile }) {
  // Real stats from actual invoices
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const activeInvoices = invoices.filter(i => i.status !== 'cancelled');
  const monthInvoices = activeInvoices.filter(i => new Date(i.timestamp) >= monthStart);
  const ventasMes = monthInvoices.length;
  const totalMes = monthInvoices.reduce((s, i) => s + i.total, 0);

  // Exchange rates state — pesos dominicanos por unidad de moneda extranjera
  const [rates, setRates] = useState({ USD: 60, EUR: 65 });
  const [editingRates, setEditingRates] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: '', email: '', phone: '' });
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    getPhotoExchangeRates().then(setRates);
  }, []);

  useEffect(() => {
    const loadActivity = async () => {
      setActivity(await getActivity());
    };
    loadActivity();
    const interval = setInterval(loadActivity, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    });
  }, [user?.name, user?.email, user?.phone]);

  const saveRates = async (newRates) => {
    setRates(newRates);
    await savePhotoExchangeRates(newRates, user?.email || user?.name || null);
  };

  const roleLabels = {
    billing: 'Cajero(a)',
    photographer: 'Fotógrafo(a)',
    both: 'Fotógrafo(a) / Cajero(a)',
    admin: 'Administrador',
    operaciones: 'Operaciones',
    chofer: 'Chofer',
    contabilidad: 'Contabilidad',
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* User Profile */}
      <div className="flex-1">
        <h1 className="font-title text-3xl lg:text-4xl text-white mb-6">Mi Perfil</h1>
        
        {/* Profile Card */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <div className="flex items-center gap-6 mb-6">
            <div className="w-24 h-24 rounded-full bg-[#DC2626]/20 flex items-center justify-center">
              <User className="w-12 h-12 text-[#DC2626]" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-title">{user.name || 'Usuario'}</h2>
              <p className="text-white/70">{roleLabels[user.role] || user.role || 'Cajero(a)'}</p>
              {user.email && <p className="text-white/50 text-sm mt-1">{user.email}</p>}
              {user.phone && <p className="text-white/50 text-sm">{user.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Nombre"
              className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm placeholder:text-white/40"
            />
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
              placeholder="Email"
              className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm placeholder:text-white/40"
            />
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Teléfono"
              className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm placeholder:text-white/40"
            />
          </div>

          <div className="flex justify-end mb-5">
            <button
              type="button"
              disabled={savingProfile}
              onClick={() => onSaveProfile(profileForm)}
              className="px-4 py-2 rounded-xl bg-[#DC2626] text-white text-sm font-medium hover:bg-[#b91c1c] disabled:opacity-60"
            >
              {savingProfile ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/15 rounded-2xl text-center">
              <p className="text-white text-2xl font-bold">{ventasMes}</p>
              <p className="text-white/70 text-xs">Ventas Este Mes</p>
            </div>
            <div className="p-4 bg-black/15 rounded-2xl text-center">
              <p className="text-white text-2xl font-bold">{fmtMoney(totalMes)}</p>
              <p className="text-white/70 text-xs">Total Vendido</p>
            </div>
          </div>
        </div>

        {/* Exchange Rates */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Tasas de Cambio</h3>
                <p className="text-white/50 text-xs">Pesos dominicanos (RD$) por unidad</p>
              </div>
            </div>
            <button
              onClick={() => setEditingRates(!editingRates)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3 h-3" />
              {editingRates ? 'Cerrar' : 'Editar Tasas'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['USD', 'EUR'].map(cur => (
              <div key={cur} className="p-4 bg-black/15 rounded-2xl">
                <p className="text-white/50 text-xs mb-1">1 {cur} =</p>
                {editingRates ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">RD$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates[cur] || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) saveRates({ ...rates, [cur]: val });
                      }}
                      className="w-full bg-black/30 rounded-xl px-3 py-1.5 text-white text-sm border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/30"
                    />
                  </div>
                ) : (
                  <p className="text-white font-bold text-xl">RD$ {(rates[cur] || 0).toFixed(2)}</p>
                )}
                <p className="text-white/40 text-[10px] mt-1.5">
                  {CURRENCY_SYMBOLS[cur]} ({cur}) → Peso Dominicano
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Settings */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4">Configuración Rápida</h3>
          <div className="space-y-3">
            {[
              { icon: Bell, label: 'Notificaciones', desc: 'Alertas y sonidos' },
              { icon: CreditCard, label: 'Métodos de Pago', desc: 'Configurar métodos' },
              { icon: LogOut, label: 'Cerrar Sesión', desc: 'Salir de la cuenta', action: onLogout },
            ].map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
                onClick={item.action || undefined}
                className="w-full flex items-center gap-4 p-4 bg-black/15 rounded-2xl hover:bg-black/20 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-[#DC2626]" />
                </div>
                <div className="text-left">
                  <p className="text-white font-medium">{item.label}</p>
                  <p className="text-white/50 text-xs">{item.desc}</p>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="lg:w-80 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Actividad Reciente</h3>
        <div className="space-y-4">
          {activity.slice(0, 5).map((activity) => {
            const elapsed = (() => {
              const diff = Date.now() - new Date(activity.time).getTime();
              const mins = Math.floor(diff / 60000);
              if (mins < 1) return 'Justo ahora';
              if (mins < 60) return `Hace ${mins} min`;
              const hrs = Math.floor(mins / 60);
              if (hrs < 24) return `Hace ${hrs} hora${hrs > 1 ? 's' : ''}`;
              return `Hace ${Math.floor(hrs / 24)} día${Math.floor(hrs / 24) > 1 ? 's' : ''}`;
            })();
            return (
            <div key={activity.id} className="flex items-start gap-3 p-3 bg-black/15 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-[#DC2626] mt-2"></div>
              <div>
                <p className="text-white text-sm font-medium">{activity.action}</p>
                <p className="text-white/70 text-xs">{activity.detail}</p>
                <p className="text-white/60 text-xs mt-1">{elapsed}</p>
              </div>
            </div>
            );
          })}
          {activity.length === 0 && (
            <p className="text-white/50 text-sm text-center py-4">Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Devolución Panel Component
function DevolucionPanel({ invoices, returns, setReturns }) {
  const [searchReturn, setSearchReturn] = useState('');
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [newReturnInvoice, setNewReturnInvoice] = useState('');
  const [newReturnReason, setNewReturnReason] = useState('');

  // Build returnable list from invoices that are not already returned
  const returnedInvoiceNums = new Set(returns.map(r => r.invoice));
  const returnableInvoices = invoices.filter(i => !returnedInvoiceNums.has(i.invoiceNumber) && i.status !== 'cancelled');
  const getInvoiceCurrency = (invoiceNumber) => invoices.find((i) => i.invoiceNumber === invoiceNumber)?.currency || 'USD';

  const filteredReturns = returns.filter(r => {
    if (!searchReturn.trim()) return true;
    const q = searchReturn.toLowerCase();
    return r.invoice?.toLowerCase().includes(q) || r.client?.toLowerCase().includes(q);
  });

  const handleCreateReturn = async () => {
    const inv = invoices.find(i => i.invoiceNumber === newReturnInvoice);
    if (!inv) return;
    const ret = {
      id: Date.now(),
      invoice: inv.invoiceNumber,
      client: inv.clientName || 'Cliente General',
      amount: inv.total,
      currency: inv.currency || 'USD',
      reason: newReturnReason || 'Sin motivo especificado',
      date: new Date().toLocaleDateString('es-DO'),
      status: 'pendiente',
    };

    // Save to Supabase
    await supabase.from('photo_returns').insert({
      invoice_number: inv.invoiceNumber,
      client_name: inv.clientName || 'Cliente General',
      amount: inv.total,
      reason: newReturnReason || 'Sin motivo especificado',
      status: 'pendiente',
    });

    // Mark invoice as cancelled in Supabase
    await supabase.from('photo_invoices')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString(), cancel_reason: newReturnReason || 'Devolucion' })
      .eq('invoice_number', inv.invoiceNumber);

    setReturns((prev) => [ret, ...prev]);
    logActivity('Devolucion creada', `${ret.invoice} — ${fmtMoney(ret.amount, ret.currency)}`);
    setShowNewReturn(false);
    setNewReturnInvoice('');
    setNewReturnReason('');
  };

  const handleApprove = async (id) => {
    const updated = returns.map(r => r.id === id ? { ...r, status: 'aprobada' } : r);
    setReturns(updated);
    const r = updated.find(x => x.id === id);
    logActivity('Devolucion aprobada', r.invoice);

    // Update in Supabase
    await supabase.from('photo_returns')
      .update({ status: 'aprobada', updated_at: new Date().toISOString() })
      .eq('invoice_number', r.invoice);
  };

  const handleReject = async (id) => {
    const updated = returns.map(r => r.id === id ? { ...r, status: 'rechazada' } : r);
    setReturns(updated);
    const r = updated.find(x => x.id === id);

    // Update in Supabase and reactivate invoice
    await supabase.from('photo_returns')
      .update({ status: 'rechazada', updated_at: new Date().toISOString() })
      .eq('invoice_number', r.invoice);
    await supabase.from('photo_invoices')
      .update({ status: 'active', cancelled_at: null, cancel_reason: null })
      .eq('invoice_number', r.invoice);
  };

  return (
    <div className="flex-1 flex flex-col">
      <h1 className="font-title text-3xl lg:text-4xl text-white mb-6">Devoluciones</h1>
      
      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            value={searchReturn}
            onChange={(e) => setSearchReturn(e.target.value)}
            placeholder="Buscar por factura o cliente..."
            className="w-full pl-12 pr-4 py-3.5 bg-black/25 backdrop-blur-sm rounded-2xl
                      border border-white/20 text-white placeholder:text-white/50
                      focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30"
          />
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowNewReturn(!showNewReturn)}
          className="px-6 py-3.5 bg-[#DC2626] text-white rounded-2xl font-medium flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Nueva Devolución
        </motion.button>
      </div>

      {/* New Return Form */}
      <AnimatePresence>
        {showNewReturn && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 space-y-4">
            <h3 className="text-white font-semibold">Crear Devolución</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Factura</label>
                <select value={newReturnInvoice} onChange={(e) => setNewReturnInvoice(e.target.value)}
                  className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 text-sm">
                  <option value="">Seleccionar factura...</option>
                  {returnableInvoices.map(inv => (
                    <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} — {inv.clientName} ({fmtMoney(inv.total, inv.currency || 'USD')})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Motivo</label>
                <input type="text" value={newReturnReason} onChange={(e) => setNewReturnReason(e.target.value)}
                  placeholder="Motivo de la devolución..."
                  className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 text-sm" />
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowNewReturn(false)}
                className="px-5 py-2.5 rounded-2xl border border-white/30 text-white/60 text-sm font-medium">Cancelar</motion.button>
              <motion.button whileTap={{ scale: 0.98 }} onClick={handleCreateReturn} disabled={!newReturnInvoice}
                className="px-5 py-2.5 rounded-2xl bg-[#DC2626] text-white text-sm font-medium disabled:opacity-50">Crear</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Returns List */}
      <div className="flex-1 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-white/70 text-xs border-b border-white/10">
                <th className="text-left py-3 px-3">Factura</th>
                <th className="text-left py-3 px-3">Cliente</th>
                <th className="text-right py-3 px-3">Monto</th>
                <th className="text-left py-3 px-3">Motivo</th>
                <th className="text-left py-3 px-3">Fecha</th>
                <th className="text-center py-3 px-3">Estado</th>
                <th className="text-center py-3 px-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredReturns.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-white/50">No hay devoluciones registradas</td></tr>
              ) : filteredReturns.map((ret) => (
                <tr key={ret.id} className="border-b border-white/5 hover:bg-black/10 transition-colors">
                  <td className="py-4 px-3 text-white text-sm font-medium">{ret.invoice}</td>
                  <td className="py-4 px-3 text-white text-sm">{ret.client}</td>
                  <td className="py-4 px-3 text-right text-[#DC2626] text-sm font-medium">
                    {fmtMoney(ret.amount, ret.currency || getInvoiceCurrency(ret.invoice))}
                  </td>
                  <td className="py-4 px-3 text-white/70 text-sm">{ret.reason}</td>
                  <td className="py-4 px-3 text-white/70 text-sm">{ret.date}</td>
                  <td className="py-4 px-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs px-3 py-1 rounded-full ${
                      ret.status === 'aprobada' ? 'bg-green-500/20 text-green-400' :
                      ret.status === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                      ret.status === 'rechazada' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {ret.status === 'aprobada' && <CheckCircle className="w-3 h-3" />}
                      {ret.status === 'pendiente' && <AlertCircle className="w-3 h-3" />}
                      {ret.status === 'rechazada' && <XCircle className="w-3 h-3" />}
                      {ret.status}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center justify-center gap-2">
                      {ret.status === 'pendiente' && (
                        <>
                          <button onClick={() => handleApprove(ret.id)} className="p-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 transition-colors" title="Aprobar">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          </button>
                          <button onClick={() => handleReject(ret.id)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-colors" title="Rechazar">
                            <XCircle className="w-4 h-4 text-red-400" />
                          </button>
                        </>
                      )}
                      <button className="p-2 rounded-lg bg-black/15 hover:bg-black/20 transition-colors">
                        <Eye className="w-4 h-4 text-white/70" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Ventas por Turno Panel Component — reads real invoices
function VentasTurnoPanel({ invoices }) {
  const turnoData = calculateSalesByTurno(invoices);
  const turnoTimes = { 'Turno 9:00': '9:00 AM', 'Turno 12:00': '12:00 PM', 'Turno 3:00': '3:00 PM' };

  // Determine current turno by hour
  const currentHour = new Date().getHours();
  const currentTurno = currentHour < 12 ? 'Turno 9:00' : currentHour < 15 ? 'Turno 12:00' : 'Turno 3:00';
  const currentData = turnoData.find(t => t.shift === currentTurno) || { sales: 0, amount: 0 };
  const totalToday = turnoData.reduce((s, t) => s + t.amount, 0);
  const totalSales = turnoData.reduce((s, t) => s + t.sales, 0);
  const avgTicket = totalSales > 0 ? totalToday / totalSales : 0;

  // Group invoices by date for history
  const dateGroups = {};
  invoices.forEach(inv => {
    const d = inv.date || 'Sin fecha';
    if (!dateGroups[d]) dateGroups[d] = { 'Turno 9:00': 0, 'Turno 12:00': 0, 'Turno 3:00': 0 };
    const t = inv.turno || 'Turno 9:00';
    dateGroups[d][t] = (dateGroups[d][t] || 0) + inv.total;
  });
  const historyDays = Object.entries(dateGroups).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5);

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <h1 className="font-title text-3xl lg:text-4xl text-white mb-6">Ventas por Turno</h1>
        
        {/* Shift Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {turnoData.map((shift, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-black/25 backdrop-blur-xl rounded-3xl p-5 border ${shift.shift === currentTurno ? 'border-[#DC2626]/50 ring-1 ring-[#DC2626]/20' : 'border-white/20'}`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{shift.shift}</p>
                    <p className="text-white/50 text-xs">{turnoTimes[shift.shift]}</p>
                  </div>
                </div>
                {shift.shift === currentTurno && (
                  <span className="text-[10px] font-semibold bg-[#DC2626]/20 text-[#DC2626] px-2 py-0.5 rounded-full">ACTIVO</span>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Ventas</span>
                  <span className="text-white font-medium">{shift.sales}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm">Total</span>
                  <span className="text-[#DC2626] font-bold">US$ {shift.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* History */}
        <div className="flex-1 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
          <h3 className="text-white font-semibold mb-4">Historial de Turnos</h3>
          <div className="space-y-3">
            {historyDays.length === 0 ? (
              <p className="text-white/50 text-center py-6">Aún no hay datos de turnos</p>
            ) : historyDays.map(([date, turnos], i) => {
              const dayTotal = Object.values(turnos).reduce((s, v) => s + v, 0);
              return (
                <div key={i} className="flex items-center gap-4 p-4 bg-black/15 rounded-2xl">
                  <div className="w-12 h-12 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-medium">{date}</p>
                    <p className="text-white/50 text-xs">Total: US$ {dayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="flex gap-4 text-sm">
                    <div className="text-center">
                      <p className="text-white/50 text-xs">9:00 AM</p>
                      <p className="text-white">US$ {(turnos['Turno 9:00'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">12:00 PM</p>
                      <p className="text-white">US$ {(turnos['Turno 12:00'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">3:00 PM</p>
                      <p className="text-white">US$ {(turnos['Turno 3:00'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Summary */}
      <div className="lg:w-80 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Turno Actual</h3>
        <div className="p-4 bg-[#DC2626]/20 rounded-2xl mb-4">
          <p className="text-white/70 text-xs mb-1">Turno Activo</p>
          <p className="text-white text-xl font-bold">{currentTurno}</p>
          <p className="text-white/70 text-sm mt-1">{turnoTimes[currentTurno]}</p>
        </div>
        
        <div className="space-y-4">
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Ventas del Turno</p>
            <p className="text-white text-2xl font-bold">{currentData.sales}</p>
          </div>
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Total Turno</p>
            <p className="text-[#DC2626] text-2xl font-bold">US$ {currentData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Ticket Promedio</p>
            <p className="text-white text-2xl font-bold">US$ {avgTicket.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-black/15 rounded-2xl">
          <p className="text-white/70 text-xs mb-1">Total Hoy (Todos los Turnos)</p>
          <p className="text-white text-2xl font-bold">US$ {totalToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>
    </div>
  );
}

// ─── Currency helpers ────────────────────────────────────────────
const CURRENCY_SYMBOLS = { USD: 'US$', EUR: '€', DOP: 'RD$' };
const currencyLabel = (code) => CURRENCY_SYMBOLS[code] || code;
const fmtMoney = (amount, cur = 'USD') =>
  `${currencyLabel(cur)} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

// ─── Cierre Turno Panel ──────────────────────────────────────────
function CierreTurnoPanel({ invoices, returns }) {
  const [selectedTurno, setSelectedTurno] = useState('');
  const todayStr = new Date().toLocaleDateString('es-DO');

  // Only today's invoices
  const todayInvoices = invoices.filter(inv => inv.date === todayStr);

  // Current turno
  const currentHour = new Date().getHours();
  const currentTurno = currentHour < 12 ? 'Turno 9:00' : currentHour < 15 ? 'Turno 12:00' : 'Turno 3:00';
  const activeTurno = selectedTurno || currentTurno;

  // Filter invoices for selected turno
  const turnoInvoices = todayInvoices.filter(inv => (inv.turno || 'Turno 9:00') === activeTurno);

  // Group by currency
  const byCurrency = {};
  turnoInvoices.forEach(inv => {
    const cur = inv.currency || 'USD';
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, count: 0, items: [] };
    byCurrency[cur].total += inv.total;
    byCurrency[cur].count++;
    byCurrency[cur].items.push(inv);
  });

  const turnoReturns = returns.filter(r => {
    const d = r.date || (r.timestamp ? new Date(r.timestamp).toLocaleDateString('es-DO') : '');
    return d === todayStr && (r.status === 'aprobada' || r.status === 'procesada');
  });
  const returnsTotal = turnoReturns.reduce((s, r) => s + (r.amount || 0), 0);

  const turnoTimes = { 'Turno 9:00': '9:00 AM', 'Turno 12:00': '12:00 PM', 'Turno 3:00': '3:00 PM' };
  const turnos = ['Turno 9:00', 'Turno 12:00', 'Turno 3:00'];

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col">
        <h1 className="font-title text-3xl lg:text-4xl text-white mb-6">Cierre de Turno</h1>

        {/* Turno selector */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {turnos.map(t => (
            <motion.button
              key={t}
              whileTap={{ scale: 0.97 }}
              onClick={() => setSelectedTurno(t)}
              className={`p-4 rounded-2xl border text-center transition-all ${
                activeTurno === t
                  ? 'bg-[#DC2626]/20 border-[#DC2626]/50 ring-1 ring-[#DC2626]/20'
                  : 'bg-black/25 border-white/20 hover:border-white/40'
              }`}
            >
              <p className="text-white font-semibold">{t}</p>
              <p className="text-white/50 text-xs">{turnoTimes[t]}</p>
              {t === currentTurno && (
                <span className="text-[10px] font-semibold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full mt-1 inline-block">ACTIVO</span>
              )}
            </motion.button>
          ))}
        </div>

        {/* Currency Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {Object.keys(CURRENCY_SYMBOLS).map(cur => {
            const data = byCurrency[cur] || { total: 0, count: 0 };
            return (
              <motion.div
                key={cur}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">{cur}</p>
                    <p className="text-white/50 text-xs">{data.count} factura{data.count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
                <p className="text-[#DC2626] text-xl font-bold">{fmtMoney(data.total, cur)}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Invoice list for turno */}
        <div className="flex-1 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 overflow-hidden">
          <h3 className="text-white font-semibold mb-4">Facturas del {activeTurno}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/70 text-xs border-b border-white/10">
                  <th className="text-left py-3 px-2">Factura</th>
                  <th className="text-left py-3 px-2">Cliente</th>
                  <th className="text-left py-3 px-2">Moneda</th>
                  <th className="text-right py-3 px-2">Total</th>
                  <th className="text-left py-3 px-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {turnoInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/50">Sin facturas en este turno</td>
                  </tr>
                ) : turnoInvoices.map(inv => (
                  <tr key={inv.id} className="border-b border-white/5 hover:bg-black/10">
                    <td className="py-3 px-2 text-white text-sm">{inv.invoiceNumber}</td>
                    <td className="py-3 px-2 text-white text-sm">{inv.clientName}</td>
                    <td className="py-3 px-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{inv.currency || 'USD'}</span>
                    </td>
                    <td className="py-3 px-2 text-right text-white font-medium text-sm">{fmtMoney(inv.total, inv.currency || 'USD')}</td>
                    <td className="py-3 px-2 text-white/70 text-sm">{new Date(inv.timestamp).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Summary */}
      <div className="lg:w-80 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 h-fit">
        <h3 className="text-white font-semibold mb-4">Resumen {activeTurno}</h3>
        <div className="space-y-3">
          <div className="p-4 bg-[#DC2626]/20 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Total Facturas</p>
            <p className="text-white text-2xl font-bold">{turnoInvoices.length}</p>
          </div>
          {Object.entries(byCurrency).map(([cur, data]) => (
            <div key={cur} className="p-4 bg-black/15 rounded-2xl">
              <p className="text-white/70 text-xs mb-1">Total en {cur}</p>
              <p className="text-[#DC2626] text-xl font-bold">{fmtMoney(data.total, cur)}</p>
            </div>
          ))}
          {returnsTotal > 0 && (
            <div className="p-4 bg-orange-500/15 rounded-2xl">
              <p className="text-white/70 text-xs mb-1">Devoluciones</p>
              <p className="text-orange-400 text-xl font-bold">US$ {returnsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Cierre del Dia Panel ────────────────────────────────────────
function CierreDiaPanel({ invoices, returns, onCloseDay, closingDay, taxEnabled, billingUser }) {
  const toDayKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const parseDayKey = (value) => {
    if (!value) return null;
    const fromIso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (fromIso) return `${fromIso[1]}-${fromIso[2]}-${fromIso[3]}`;

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return toDayKey(parsed);

    const fromEs = String(value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (fromEs) {
      const d = String(Number(fromEs[1])).padStart(2, '0');
      const m = String(Number(fromEs[2])).padStart(2, '0');
      const y = fromEs[3];
      return `${y}-${m}-${d}`;
    }

    return null;
  };

  const formatDayLabel = (dayKey) => {
    const parsed = new Date(`${dayKey}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return dayKey;
    return parsed.toLocaleDateString('es-DO');
  };

  const invoiceDayKey = (inv) => parseDayKey(inv.timestamp) || parseDayKey(inv.date);
  const returnDayKey = (ret) => parseDayKey(ret.timestamp) || parseDayKey(ret.date);

  const todayKey = toDayKey(new Date());

  // Exchange rates state — pesos dominicanos por unidad de moneda extranjera
  const [rates, setRates] = useState({ USD: 60, EUR: 65 });
  const [editingRates, setEditingRates] = useState(false);
  const [convertToDOP, setConvertToDOP] = useState(false);
  const [dailyClosures, setDailyClosures] = useState([]);
  const [selectedClosureDate, setSelectedClosureDate] = useState(todayKey);
  const [historySearchDate, setHistorySearchDate] = useState('');

  useEffect(() => {
    getPhotoExchangeRates().then(setRates);
  }, []);

  useEffect(() => {
    async function loadClosures() {
      const { data } = await supabase
        .from('photo_daily_closures')
        .select('closure_date, closed_by, closed_at, total_invoices, by_currency')
        .order('closure_date', { ascending: false })
        .limit(180);
      setDailyClosures(Array.isArray(data) ? data : []);
    }
    loadClosures();
  }, []);

  const saveRates = async (newRates) => {
    setRates(newRates);
    await savePhotoExchangeRates(newRates, billingUser?.email || billingUser?.name || null);
  };

  const availableDayKeys = Array.from(new Set(
    invoices
      .filter(inv => inv.status !== 'cancelled')
      .map(invoiceDayKey)
      .filter(Boolean),
  )).sort((a, b) => (a > b ? -1 : 1));

  useEffect(() => {
    if (availableDayKeys.length === 0) {
      if (selectedClosureDate !== todayKey) setSelectedClosureDate(todayKey);
      return;
    }

    if (!availableDayKeys.includes(selectedClosureDate)) {
      setSelectedClosureDate(availableDayKeys[0]);
    }
  }, [availableDayKeys, selectedClosureDate, todayKey]);

  const selectedInvoices = invoices.filter(inv => (
    inv.status !== 'cancelled' && invoiceDayKey(inv) === selectedClosureDate
  ));

  const selectedDateLabel = formatDayLabel(selectedClosureDate);
  const existingClosure = dailyClosures.find((c) => String(c.closure_date || '').slice(0, 10) === selectedClosureDate) || null;
  const filteredClosures = dailyClosures.filter((c) => {
    if (!historySearchDate) return true;
    return String(c.closure_date || '').slice(0, 10) === historySearchDate;
  });

  // Group by currency
  const byCurrency = {};
  selectedInvoices.forEach(inv => {
    const cur = inv.currency || 'USD';
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, subtotal: 0, tax: 0, count: 0 };
    byCurrency[cur].total += inv.total;
    byCurrency[cur].subtotal += inv.subtotal;
    byCurrency[cur].tax += inv.tax;
    byCurrency[cur].count++;
  });

  // Group by turno
  const byTurno = {};
  selectedInvoices.forEach(inv => {
    const t = inv.turno || 'Turno 9:00';
    if (!byTurno[t]) byTurno[t] = { total: 0, count: 0, currencies: {} };
    byTurno[t].total += inv.total;
    byTurno[t].count++;
    const cur = inv.currency || 'USD';
    if (!byTurno[t].currencies[cur]) byTurno[t].currencies[cur] = 0;
    byTurno[t].currencies[cur] += inv.total;
  });

  // Returns
  const selectedReturns = returns.filter(r => {
    const d = returnDayKey(r);
    return d === selectedClosureDate && (r.status === 'aprobada' || r.status === 'procesada');
  });
  const returnsTotal = selectedReturns.reduce((s, r) => s + (r.amount || 0), 0);

  // Convert to DOP — rates = pesos por unidad (ej: USD: 60 = 1 USD = 60 DOP)
  const toDOP = (amount, cur) => {
    if (cur === 'DOP') return amount;
    return amount * (rates[cur] || 60);
  };

  const totalAllInDOP = Object.entries(byCurrency).reduce((sum, [cur, data]) => sum + toDOP(data.total, cur), 0);

  const turnoTimes = { 'Turno 9:00': '9:00 AM', 'Turno 12:00': '12:00 PM', 'Turno 3:00': '3:00 PM' };

  const getClosureTotalByCurrency = (closure, currencyCode) => {
    const bucket = closure?.by_currency?.[currencyCode];
    return Number(bucket?.total || 0);
  };

  const getClosureGrandTotal = (closure) => {
    const byCurrencyRow = closure?.by_currency || {};
    return Object.values(byCurrencyRow).reduce((sum, row) => sum + Number(row?.total || 0), 0);
  };

  const handleCloseAndDownload = async () => {
    if (selectedInvoices.length === 0) {
      alert('No hay facturas en la fecha seleccionada para cerrar.');
      return;
    }

    const closed = await onCloseDay({
      closureDate: selectedClosureDate,
      byCurrency,
      totalInvoices: selectedInvoices.length,
    });

    if (!closed) {
      alert('No se pudo registrar el cierre del dia. Intenta nuevamente.');
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryRows = [
      { Campo: 'Fecha', Valor: selectedDateLabel },
      { Campo: 'Facturas', Valor: selectedInvoices.length },
      { Campo: 'ITBIS en facturas nuevas', Valor: taxEnabled ? 'ACTIVO' : 'DESACTIVADO' },
      { Campo: 'Estado de cierre previo', Valor: existingClosure ? 'YA EXISTIA' : 'PENDIENTE' },
      { Campo: 'Devoluciones aprobadas (USD)', Valor: Number(returnsTotal.toFixed(2)) },
      { Campo: 'Total equivalente DOP', Valor: Number(totalAllInDOP.toFixed(2)) },
    ];

    Object.entries(byCurrency).forEach(([cur, data]) => {
      summaryRows.push({ Campo: `Total ${cur}`, Valor: Number((data?.total || 0).toFixed(2)) });
      summaryRows.push({ Campo: `Subtotal ${cur}`, Valor: Number((data?.subtotal || 0).toFixed(2)) });
      summaryRows.push({ Campo: `ITBIS ${cur}`, Valor: Number((data?.tax || 0).toFixed(2)) });
      summaryRows.push({ Campo: `Facturas ${cur}`, Valor: data?.count || 0 });
    });

    const turnoRows = ['Turno 9:00', 'Turno 12:00', 'Turno 3:00'].map((turno) => {
      const data = byTurno[turno] || { total: 0, count: 0, currencies: {} };
      return {
        Turno: turno,
        Facturas: data.count || 0,
        Total_USD_Ref: Number((data.total || 0).toFixed(2)),
        USD: Number((data.currencies?.USD || 0).toFixed(2)),
        EUR: Number((data.currencies?.EUR || 0).toFixed(2)),
        DOP: Number((data.currencies?.DOP || 0).toFixed(2)),
      };
    });

    const invoiceRows = selectedInvoices.map((inv) => ({
      Factura: inv.invoiceNumber,
      Cliente: inv.clientName,
      Telefono: inv.clientPhone || '',
      Turno: inv.turno || 'Turno 9:00',
      Moneda: inv.currency || 'USD',
      Subtotal: Number((inv.subtotal || 0).toFixed(2)),
      ITBIS: Number((inv.tax || 0).toFixed(2)),
      Total: Number((inv.total || 0).toFixed(2)),
      Equiv_DOP: Number((toDOP(inv.total || 0, inv.currency || 'USD') || 0).toFixed(2)),
      Hora: new Date(inv.timestamp).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' }),
      Fotografo: inv.photographer || '',
      Items: (inv.items || []).map((it) => `${it.quantity}x ${it.name}`).join(' | '),
    }));

    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(summaryRows), 'Resumen');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(turnoRows), 'Turnos');
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(invoiceRows), 'Facturas');

    XLSX.writeFile(workbook, `cierre-dia-${selectedClosureDate}.xlsx`);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-title text-3xl lg:text-4xl text-white">Historial de Cierres y Ventas</h1>
          <p className="text-white/50 text-sm">{selectedDateLabel}</p>
        </div>

        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-4 border border-white/20 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-white/60 text-xs mb-1.5">Fecha a cerrar</label>
              <select
                value={selectedClosureDate}
                onChange={(e) => setSelectedClosureDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
              >
                {availableDayKeys.length === 0 ? (
                  <option value={todayKey}>Sin ventas registradas</option>
                ) : (
                  availableDayKeys.map((dayKey) => (
                    <option key={dayKey} value={dayKey}>
                      {formatDayLabel(dayKey)}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-xs mb-1.5">Buscar historial por día</label>
              <input
                type="date"
                value={historySearchDate}
                onChange={(e) => setHistorySearchDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
              />
            </div>

            {existingClosure ? (
              <span className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                Cierre ya registrado
              </span>
            ) : (
              <span className="inline-flex items-center rounded-xl px-3 py-2 text-xs font-semibold bg-amber-500/20 text-amber-300">
                Cierre pendiente
              </span>
            )}
          </div>
        </div>

        {/* Exchange Rate Config */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#DC2626]" />
              </div>
              <div>
                <h3 className="text-white font-semibold">Tasas de Cambio</h3>
                <p className="text-white/50 text-xs">Pesos dominicanos (RD$) por unidad</p>
              </div>
            </div>
            <button
              onClick={() => setEditingRates(!editingRates)}
              className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors flex items-center gap-1.5"
            >
              <Edit className="w-3 h-3" />
              {editingRates ? 'Cerrar' : 'Editar Tasas'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {['USD', 'EUR'].map(cur => (
              <div key={cur} className="p-4 bg-black/15 rounded-2xl">
                <p className="text-white/50 text-xs mb-1">1 {cur} =</p>
                {editingRates ? (
                  <div className="flex items-center gap-2">
                    <span className="text-white/50 text-sm">RD$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={rates[cur] || ''}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0) saveRates({ ...rates, [cur]: val });
                      }}
                      className="w-full bg-black/30 rounded-xl px-3 py-1.5 text-white text-sm border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/30"
                    />
                  </div>
                ) : (
                  <p className="text-white font-bold text-xl">RD$ {(rates[cur] || 0).toFixed(2)}</p>
                )}
                <p className="text-white/40 text-[10px] mt-1.5">
                  {CURRENCY_SYMBOLS[cur]} ({cur}) → Peso Dominicano
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Currency Totals */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {Object.keys(CURRENCY_SYMBOLS).map(cur => {
            const data = byCurrency[cur] || { total: 0, subtotal: 0, tax: 0, count: 0 };
            return (
              <motion.div
                key={cur}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-[#DC2626]" />
                    </div>
                    <div>
                      <p className="text-white font-semibold">{cur}</p>
                      <p className="text-white/50 text-xs">{data.count} factura{data.count !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-1 mb-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Subtotal</span>
                    <span className="text-white">{fmtMoney(data.subtotal, cur)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">ITBIS</span>
                    <span className="text-white">{fmtMoney(data.tax, cur)}</span>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[#DC2626] text-xl font-bold">{fmtMoney(data.total, cur)}</p>
                  {convertToDOP && cur !== 'DOP' && (
                    <p className="text-white/40 text-xs mt-1">≈ RD$ {toDOP(data.total, cur).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Sales by Turno */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 mb-6">
          <h3 className="text-white font-semibold mb-4">Ventas por Turno</h3>
          <div className="space-y-3">
            {['Turno 9:00', 'Turno 12:00', 'Turno 3:00'].map(t => {
              const data = byTurno[t] || { total: 0, count: 0, currencies: {} };
              return (
                <div key={t} className="p-4 bg-black/15 rounded-2xl flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#DC2626]/20 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{t}</p>
                      <span className="text-white/40 text-xs">{turnoTimes[t]}</span>
                    </div>
                    <p className="text-white/50 text-xs">{data.count} factura{data.count !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="text-right">
                    {Object.entries(data.currencies).map(([cur, amt]) => (
                      <p key={cur} className="text-white font-medium text-sm">{fmtMoney(amt, cur)}</p>
                    ))}
                    {data.count === 0 && <p className="text-white/30 text-sm">—</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invoice Detail Table */}
        <div className="flex-1 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 overflow-hidden">
          <h3 className="text-white font-semibold mb-4">Todas las Facturas de la Fecha Seleccionada</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/70 text-xs border-b border-white/10">
                  <th className="text-left py-3 px-2">Factura</th>
                  <th className="text-left py-3 px-2">Cliente</th>
                  <th className="text-left py-3 px-2">Turno</th>
                  <th className="text-left py-3 px-2">Moneda</th>
                  <th className="text-right py-3 px-2">Total</th>
                  {convertToDOP && <th className="text-right py-3 px-2">Equiv. DOP</th>}
                  <th className="text-left py-3 px-2">Hora</th>
                </tr>
              </thead>
              <tbody>
                {selectedInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={convertToDOP ? 7 : 6} className="py-8 text-center text-white/50">No hay facturas para esta fecha</td>
                  </tr>
                ) : selectedInvoices.map(inv => {
                  const cur = inv.currency || 'USD';
                  return (
                    <tr key={inv.id} className="border-b border-white/5 hover:bg-black/10">
                      <td className="py-3 px-2 text-white text-sm">{inv.invoiceNumber}</td>
                      <td className="py-3 px-2 text-white text-sm">{inv.clientName}</td>
                      <td className="py-3 px-2 text-white/70 text-sm">{inv.turno}</td>
                      <td className="py-3 px-2">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-500/20 text-blue-400">{cur}</span>
                      </td>
                      <td className="py-3 px-2 text-right text-white font-medium text-sm">{fmtMoney(inv.total, cur)}</td>
                      {convertToDOP && (
                        <td className="py-3 px-2 text-right text-white/50 text-sm">RD$ {toDOP(inv.total, cur).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      )}
                      <td className="py-3 px-2 text-white/70 text-sm">{new Date(inv.timestamp).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 mt-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Historial de Cierres Registrados</h3>
            {historySearchDate && (
              <button
                onClick={() => setHistorySearchDate('')}
                className="text-xs px-3 py-1.5 rounded-xl bg-white/10 text-white/70 hover:bg-white/20 transition-colors"
              >
                Limpiar filtro
              </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/70 text-xs border-b border-white/10">
                  <th className="text-left py-3 px-2">Fecha</th>
                  <th className="text-right py-3 px-2">Facturas</th>
                  <th className="text-right py-3 px-2">USD</th>
                  <th className="text-right py-3 px-2">EUR</th>
                  <th className="text-right py-3 px-2">DOP</th>
                  <th className="text-right py-3 px-2">Total Ref.</th>
                  <th className="text-left py-3 px-2">Cerrado por</th>
                  <th className="text-left py-3 px-2">Hora cierre</th>
                </tr>
              </thead>
              <tbody>
                {filteredClosures.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-white/50">No hay cierres para el filtro actual</td>
                  </tr>
                ) : filteredClosures.map((closure) => {
                  const dayKey = String(closure.closure_date || '').slice(0, 10);
                  const isSelected = dayKey === selectedClosureDate;
                  return (
                    <tr key={`${dayKey}-${closure.closed_at || 'no-time'}`} className={`border-b border-white/5 hover:bg-black/10 ${isSelected ? 'bg-white/5' : ''}`}>
                      <td className="py-3 px-2 text-white text-sm">{formatDayLabel(dayKey)}</td>
                      <td className="py-3 px-2 text-right text-white text-sm">{closure.total_invoices || 0}</td>
                      <td className="py-3 px-2 text-right text-white/80 text-sm">{fmtMoney(getClosureTotalByCurrency(closure, 'USD'), 'USD')}</td>
                      <td className="py-3 px-2 text-right text-white/80 text-sm">{fmtMoney(getClosureTotalByCurrency(closure, 'EUR'), 'EUR')}</td>
                      <td className="py-3 px-2 text-right text-white/80 text-sm">{fmtMoney(getClosureTotalByCurrency(closure, 'DOP'), 'DOP')}</td>
                      <td className="py-3 px-2 text-right text-white text-sm">{fmtMoney(getClosureGrandTotal(closure), 'USD')}</td>
                      <td className="py-3 px-2 text-white/70 text-sm">{closure.closed_by || 'Sin usuario'}</td>
                      <td className="py-3 px-2 text-white/70 text-sm">{closure.closed_at ? new Date(closure.closed_at).toLocaleString('es-DO') : '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 mt-6 overflow-hidden">
          <h3 className="text-white font-semibold mb-4">Devoluciones de la Fecha Seleccionada</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/70 text-xs border-b border-white/10">
                  <th className="text-left py-3 px-2">Factura</th>
                  <th className="text-left py-3 px-2">Cliente</th>
                  <th className="text-left py-3 px-2">Motivo</th>
                  <th className="text-left py-3 px-2">Estado</th>
                  <th className="text-right py-3 px-2">Monto</th>
                </tr>
              </thead>
              <tbody>
                {selectedReturns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/50">No hay devoluciones para esta fecha</td>
                  </tr>
                ) : selectedReturns.map((ret) => (
                  <tr key={ret.id} className="border-b border-white/5 hover:bg-black/10">
                    <td className="py-3 px-2 text-white text-sm">{ret.invoice || ret.invoiceNumber || '—'}</td>
                    <td className="py-3 px-2 text-white text-sm">{ret.client || ret.clientName || 'Cliente General'}</td>
                    <td className="py-3 px-2 text-white/70 text-sm">{ret.reason || 'Sin motivo'}</td>
                    <td className="py-3 px-2 text-white/70 text-sm">{ret.status || 'pendiente'}</td>
                    <td className="py-3 px-2 text-right text-white text-sm">{fmtMoney(ret.amount || 0, 'USD')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Summary */}
      <div className="lg:w-80 space-y-4">
        {/* Convert toggle */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
          <button
            onClick={handleCloseAndDownload}
            disabled={closingDay}
            className="w-full mb-3 py-3 rounded-2xl font-medium text-sm transition-all bg-[#DC2626] text-white hover:bg-[#b91c1c] disabled:opacity-60"
          >
            {closingDay ? 'Registrando cierre...' : existingClosure ? 'Actualizar cierre y descargar resumen' : 'Cerrar dia y descargar resumen'}
          </button>
          <button
            onClick={() => setConvertToDOP(!convertToDOP)}
            className={`w-full py-3 rounded-2xl font-medium text-sm transition-all ${
              convertToDOP
                ? 'bg-[#DC2626] text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {convertToDOP ? 'Conversión a DOP Activa' : 'Convertir Todo a DOP'}
          </button>
        </div>

        {/* Summary Card */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
          <h3 className="text-white font-semibold mb-4">Resumen de la Fecha</h3>
          <div className="space-y-3">
            <div className="p-4 bg-[#DC2626]/20 rounded-2xl">
              <p className="text-white/70 text-xs mb-1">Total Facturas</p>
              <p className="text-white text-2xl font-bold">{selectedInvoices.length}</p>
            </div>

            {Object.entries(byCurrency).map(([cur, data]) => (
              <div key={cur} className="p-4 bg-black/15 rounded-2xl">
                <p className="text-white/70 text-xs mb-1">Ventas en {cur}</p>
                <p className="text-[#DC2626] text-xl font-bold">{fmtMoney(data.total, cur)}</p>
              </div>
            ))}

            {returnsTotal > 0 && (
              <div className="p-4 bg-orange-500/15 rounded-2xl">
                <p className="text-white/70 text-xs mb-1">Devoluciones</p>
                <p className="text-orange-400 text-xl font-bold">US$ {returnsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            )}

            {convertToDOP && (
              <div className="p-4 bg-green-500/15 rounded-2xl">
                <p className="text-white/70 text-xs mb-1">Total Convertido a DOP</p>
                <p className="text-green-400 text-2xl font-bold">RD$ {totalAllInDOP.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            )}

            <div className="p-4 bg-black/15 rounded-2xl">
              <p className="text-white/70 text-xs mb-1">Ticket Promedio</p>
              <p className="text-white text-xl font-bold">
                {selectedInvoices.length > 0
                  ? `US$ ${(selectedInvoices.filter(i => (i.currency || 'USD') === 'USD').reduce((s, i) => s + i.total, 0) / Math.max(1, selectedInvoices.filter(i => (i.currency || 'USD') === 'USD').length)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : 'US$ 0.00'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Product Card Component
function ProductCard({ product, onAdd, onEdit, currency = 'USD' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={() => onAdd(product)}
      className="bg-black/40 rounded-3xl overflow-hidden shadow-md hover:shadow-xl 
                 cursor-pointer transition-shadow duration-300 border border-white/20 relative group"
    >
      {/* Edit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onEdit(product); }}
        className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm
                   flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity
                   hover:bg-black/80 border border-white/20"
      >
        <Edit className="w-3.5 h-3.5 text-white/80" />
      </button>
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
        />
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white text-sm mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-[#DC2626] font-medium text-lg">
          {fmtMoney(product.price, currency)}
        </p>
      </div>
    </motion.div>
  );
}

// Product Edit Modal
function ProductEditModal({ product, onSave, onClose }) {
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price.toString());

  const handleSave = () => {
    const newPrice = parseFloat(price);
    if (isNaN(newPrice) || newPrice < 0) return;
    onSave({ ...product, name: name.trim() || product.name, price: newPrice });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#1a1a1a] rounded-3xl p-6 w-full max-w-sm border border-white/20 shadow-2xl"
      >
        <h3 className="text-white text-lg font-semibold mb-4">Editar Producto</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
            />
          </div>
          <div>
            <label className="block text-white/60 text-xs mb-1.5">Precio (USD)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 rounded-2xl border border-white/20 text-white text-sm
                        focus:outline-none focus:ring-2 focus:ring-[#DC2626]/30"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-2xl border border-white/20 text-white/60 text-sm hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-2xl bg-[#DC2626] text-white text-sm font-medium hover:bg-[#B91C1C] transition-colors"
          >
            Guardar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Cart Item Component
function CartItem({ item, onUpdateQuantity, onRemove, currency = 'USD' }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex items-center gap-3 py-3 border-b border-white/15"
    >
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm truncate">{item.name}</p>
        <p className="text-[#DC2626] text-xs">
          {fmtMoney(item.price, currency)}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
          className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center
                     hover:bg-white/30 transition-colors"
        >
          <Minus className="w-3 h-3 text-white" />
        </button>
        <span className="text-white font-medium text-sm w-6 text-center">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
          className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center
                     hover:bg-white/30 transition-colors"
        >
          <Plus className="w-3 h-3 text-white" />
        </button>
      </div>
      <button
        onClick={() => onRemove(item.id)}
        className="p-1.5 rounded-full hover:bg-red-100 transition-colors"
      >
        <Trash2 className="w-4 h-4 text-red-400" />
      </button>
    </motion.div>
  );
}

// Custom Select Component
function CustomSelect({ label, value, onChange, options, placeholder }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="relative">
      <label className="block text-white/60 text-xs mb-1.5">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2.5 bg-black/30 backdrop-blur-sm rounded-2xl 
                   border border-white/20 text-left flex items-center justify-between
                   hover:bg-black/35 transition-colors focus:outline-none focus:ring-2 
                   focus:ring-[#EF4444]/30"
      >
        <span className={value ? 'text-white' : 'text-white/60/60'}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-black/80 backdrop-blur-xl rounded-2xl 
                       border border-white/20 shadow-xl overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-left text-sm transition-colors ${
                  option.disabled
                    ? 'text-white/25 cursor-not-allowed'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// POS Receipt Component for printing (80mm width)
function POSReceipt({ invoice, onClose }) {
  const receiptRef = useRef(null);
  const invoiceCurrency = invoice.currency || 'USD';
  const invoiceCurrencyLabel = currencyLabel(invoiceCurrency);
  
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=302,height=600');
    
    // Generate items HTML
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="text-align: left; padding: 4px 0;">${item.name}</td>
        <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">${invoiceCurrencyLabel} ${item.price.toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0;">${invoiceCurrencyLabel} ${(item.quantity * item.price).toFixed(2)}</td>
      </tr>
    `).join('');
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Factura ${invoice.invoiceNumber}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            @media print {
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              width: 80mm;
              padding: 3mm;
              background: white;
              color: black;
              line-height: 1.4;
            }
            .receipt {
              width: 100%;
            }
            .header {
              text-align: center;
              padding-bottom: 10px;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
            }
            .logo {
              width: 140px;
              height: auto;
              margin-bottom: 5px;
            }
            .invoice-num {
              font-size: 14px;
              font-weight: bold;
              margin: 8px 0 4px 0;
            }
            .date {
              font-size: 10px;
              color: #333;
            }
            .divider {
              border: none;
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .section-title {
              font-weight: bold;
              text-align: center;
              margin: 8px 0;
              font-size: 11px;
            }
            .info-table {
              width: 100%;
              margin-bottom: 10px;
            }
            .info-table td {
              padding: 3px 0;
              vertical-align: top;
            }
            .info-table td:first-child {
              font-weight: bold;
              width: 40%;
            }
            .info-table td:last-child {
              text-align: right;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0;
            }
            .items-table th {
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              padding: 5px 2px;
              font-size: 10px;
              text-transform: uppercase;
            }
            .items-table td {
              padding: 4px 2px;
              font-size: 10px;
              border-bottom: 1px dotted #ccc;
            }
            .totals-table {
              width: 100%;
              margin-top: 10px;
            }
            .totals-table td {
              padding: 4px 0;
            }
            .totals-table td:last-child {
              text-align: right;
              font-weight: bold;
            }
            .total-row {
              font-size: 14px;
              font-weight: bold;
              border-top: 2px solid #000;
            }
            .total-row td {
              padding-top: 8px !important;
            }
            .footer {
              text-align: center;
              margin-top: 15px;
              padding-top: 10px;
              border-top: 1px dashed #000;
            }
            .thanks {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 5px;
            }
            .footer-note {
              font-size: 9px;
              color: #555;
              margin-top: 3px;
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <!-- Header -->
            <div class="header">
              <img src="/photographer/branding/macao-logo.png" class="logo" alt="Macao" />
              <div class="invoice-num">FACTURA No: ${invoice.invoiceNumber}</div>
              <div class="date">Fecha: ${new Date(invoice.timestamp).toLocaleString('es-DO')}</div>
            </div>
            
            <!-- Client Info -->
            <div class="section-title">DATOS DEL CLIENTE</div>
            <table class="info-table">
              <tr>
                <td>Cliente:</td>
                <td>${invoice.clientName || 'Cliente General'}</td>
              </tr>
              ${invoice.clientPhone ? `
              <tr>
                <td>Teléfono:</td>
                <td>${invoice.clientPhone}</td>
              </tr>
              ` : ''}
              <tr>
                <td>Turno:</td>
                <td>${invoice.turno || 'Turno 9:00'}</td>
              </tr>
            </table>
            
            <hr class="divider" />
            
            <!-- Items -->
            <div class="section-title">DETALLE DE PRODUCTOS</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="text-align: left;">Producto</th>
                  <th style="text-align: center;">Cant</th>
                  <th style="text-align: right;">Precio</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHTML}
              </tbody>
            </table>
            
            <hr class="divider" />
            
            <!-- Totals -->
            <table class="totals-table">
              <tr>
                <td>SUBTOTAL:</td>
                <td>${invoiceCurrencyLabel} ${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>ITBIS (18%):</td>
                <td>${invoiceCurrencyLabel} ${invoice.tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td>${invoiceCurrencyLabel} ${invoice.total.toFixed(2)}</td>
              </tr>
            </table>
            
            <!-- Footer -->
            <div class="footer">
              <div class="thanks">¡GRACIAS POR SU COMPRA!</div>
              <div style="font-size: 11px; font-weight: bold; margin: 8px 0; padding: 6px; border: 1px solid #000; text-align: center;">
                📅 Tiene 15 días para descargar sus fotos y videos
              </div>
              <div class="footer-note">Conserve este recibo para cualquier reclamación</div>
              <div class="footer-note">www.macaooffroad.com</div>
            </div>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for image to load before printing
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 600);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Receipt Preview */}
        <div ref={receiptRef} className="p-5 bg-white text-black font-mono text-xs">
          {/* Header */}
          <div className="text-center border-b border-dashed border-gray-400 pb-4 mb-4">
            <img src="/photographer/branding/macao-logo.png" alt="Macao" className="w-32 h-auto mx-auto mb-3" />
            <div className="text-sm font-bold">FACTURA No: {invoice.invoiceNumber}</div>
            <div className="text-[10px] text-gray-500 mt-1">Fecha: {new Date(invoice.timestamp).toLocaleString('es-DO')}</div>
          </div>
          
          {/* Client Info */}
          <div className="text-center font-bold text-[10px] mb-2 uppercase">Datos del Cliente</div>
          <table className="w-full mb-4 text-[11px]">
            <tbody>
              <tr>
                <td className="py-1 font-semibold">Cliente:</td>
                <td className="py-1 text-right">{invoice.clientName || 'Cliente General'}</td>
              </tr>
              {invoice.clientPhone && (
                <tr>
                  <td className="py-1 font-semibold">Teléfono:</td>
                  <td className="py-1 text-right">{invoice.clientPhone}</td>
                </tr>
              )}
              <tr>
                <td className="py-1 font-semibold">Turno:</td>
                <td className="py-1 text-right">{invoice.turno || 'Turno 9:00'}</td>
              </tr>
            </tbody>
          </table>
          
          <hr className="border-dashed border-gray-400 my-3" />
          
          {/* Items */}
          <div className="text-center font-bold text-[10px] mb-2 uppercase">Detalle de Productos</div>
          <table className="w-full text-[10px] mb-3">
            <thead>
              <tr className="border-y border-gray-800">
                <th className="py-2 text-left">Producto</th>
                <th className="py-2 text-center">Cant</th>
                <th className="py-2 text-right">Precio</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, idx) => (
                <tr key={idx} className="border-b border-dotted border-gray-300">
                  <td className="py-2 text-left">{item.name}</td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">{invoiceCurrencyLabel} {item.price.toFixed(2)}</td>
                  <td className="py-2 text-right">{invoiceCurrencyLabel} {(item.quantity * item.price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <hr className="border-dashed border-gray-400 my-3" />
          
          {/* Totals */}
          <table className="w-full text-[11px]">
            <tbody>
              <tr>
                <td className="py-1">SUBTOTAL:</td>
                <td className="py-1 text-right font-semibold">{invoiceCurrencyLabel} {invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1">ITBIS (18%):</td>
                <td className="py-1 text-right font-semibold">{invoiceCurrencyLabel} {invoice.tax.toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-2 text-sm font-bold">TOTAL A PAGAR:</td>
                <td className="py-2 text-right text-sm font-bold">{invoiceCurrencyLabel} {invoice.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400">
            <div className="font-bold text-xs mb-1">¡GRACIAS POR SU COMPRA!</div>
            <div className="text-[10px] font-bold border border-gray-800 rounded px-2 py-1.5 mx-2 my-2">
              📅 Tiene 15 días para descargar sus fotos y videos
            </div>
            <div className="text-[9px] text-gray-500">Conserve este recibo para cualquier reclamación</div>
            <div className="text-[9px] text-gray-500">www.macaooffroad.com</div>
          </div>
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-3 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-gray-300 text-gray-600 font-medium
                      hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-[#DC2626] text-white font-medium
                      hover:bg-[#B91C1C] transition-colors flex items-center justify-center gap-2"
          >
            <Printer className="w-5 h-5" />
            Imprimir
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function BillingPage() {
  const [activeTab, setActiveTab] = useState('nueva');
  const [showMobileSummary, setShowMobileSummary] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [turno, setTurno] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [photographer, setPhotographer] = useState('');
  const [photographers, setPhotographers] = useState([]);
  const [currency, setCurrency] = useState('USD');
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState(null);
  const [billingUserName, setBillingUserName] = useState('');
  const [billingUserId, setBillingUserId] = useState(null);
  const [billingUser, setBillingUser] = useState({ name: '', email: '', phone: '', role: 'billing' });

  // Read user from session
  useEffect(() => {
    getDashboardSession().then((session) => {
      if (session && session.active) {
        setBillingUserName(session.name);
        setBillingUserId(session.id || null);
        setBillingUser({
          name: session.name || '',
          email: session.email || '',
          phone: session.phone || '',
          role: session.role || 'billing',
        });
      }
    });
  }, []);

  const handleBillingLogout = async () => {
    await clearDashboardSession();
    window.location.reload();
  };

  // Load products from localStorage, then sync defaults from Supabase
  useEffect(() => {
    setProducts(DEFAULT_PRODUCTS);

    // Fetch central pricing from Supabase and update defaults
    async function syncPricing() {
      try {
        const { data, error } = await supabase
          .from('photo_pricing')
          .select('code, name, price, description')
          .eq('active', true)
          .order('sort_order', { ascending: true });
        if (error || !data || data.length === 0) return;

        setProducts(prev => {
          const updated = prev.map(p => {
            const remote = data.find(r => r.code === p.code);
            if (remote) {
              return { ...p, price: parseFloat(remote.price), name: remote.name, description: remote.description || p.description };
            }
            return p;
          });
          return updated;
        });
      } catch (err) {
        console.error('Error syncing pricing:', err);
      }
    }
    syncPricing();
  }, []);
  
  // Invoice management state
  const [invoices, setInvoices] = useState([]);
  const [returns, setReturns] = useState([]);
  const [nextInvoiceNum, setNextInvoiceNum] = useState(1);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [closingDay, setClosingDay] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  const parseInvoiceCounter = (rows) => {
    let maxNum = 0;
    rows.forEach((inv) => {
      const raw = String(inv.invoiceNumber || inv.invoice_number || '');
      const match = raw.match(/FAC-(\d+)/i);
      if (!match) return;
      const parsed = Number.parseInt(match[1], 10);
      if (!Number.isNaN(parsed) && parsed > maxNum) maxNum = parsed;
    });
    return maxNum + 1;
  };

  const extractInvoiceCounter = (rawInvoiceNumber) => {
    const raw = String(rawInvoiceNumber || '');
    const match = raw.match(/FAC-(\d+)/i);
    if (!match) return 0;
    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const isInvoiceNumberConflict = (error) => {
    if (!error) return false;
    if (error.code !== '23505') return false;
    const details = `${error.message || ''} ${error.details || ''} ${error.hint || ''}`.toLowerCase();
    return details.includes('invoice_number');
  };

  const resolveInvoiceInsertErrorMessage = (error) => {
    if (!error) {
      return 'No se pudo guardar la factura en la base de datos. Intenta nuevamente.';
    }

    if (error.code === '42P01') {
      return 'No existe la tabla de facturas en la base de datos. Ejecuta las migraciones de fotografia.';
    }

    if (error.code === '42501') {
      return 'No hay permisos para guardar facturas (RLS/policies). Revisa las politicas de Supabase.';
    }

    if (isInvoiceNumberConflict(error)) {
      return 'El numero de factura ya existe. Recarga la pagina e intenta de nuevo.';
    }

    return `No se pudo guardar la factura: ${error.message || 'error desconocido'}`;
  };
  
  // Load invoices, devoluciones y estado de cierre desde Supabase
  useEffect(() => {
    async function loadBillingData() {
      const { data: invRows, error: invErr } = await supabase
        .from('photo_invoices')
        .select('*')
        .order('created_at', { ascending: true });

      if (!invErr && Array.isArray(invRows)) {
        const mapped = invRows.map((inv) => ({
          id: inv.id,
          invoiceNumber: inv.invoice_number,
          timestamp: inv.created_at || new Date().toISOString(),
          clientName: String(inv.client_name || '').trim() || 'Cliente General',
          clientPhone: inv.client_phone || '',
          turno: inv.turno || 'Turno 9:00',
          photographer: inv.photographer || null,
          source: inv.source || 'billing',
          date: inv.date || new Date(inv.created_at || Date.now()).toLocaleDateString('es-DO'),
          items: inv.items || [],
          subtotal: Number(inv.subtotal || 0),
          tax: Number(inv.tax || 0),
          total: Number(inv.total || 0),
          currency: inv.currency || 'USD',
          status: inv.status || 'active',
        }));
        setInvoices(mapped);
        setNextInvoiceNum(parseInvoiceCounter(mapped));
      }

      const { data: returnRows, error: retErr } = await supabase
        .from('photo_returns')
        .select('*')
        .order('created_at', { ascending: false });

      if (!retErr && Array.isArray(returnRows)) {
        setReturns(
          returnRows.map((ret) => ({
            id: ret.id,
            invoice: ret.invoice_number,
            client: ret.client_name || 'Cliente General',
            amount: Number(ret.amount || 0),
            currency: ret.currency || null,
            reason: ret.reason || '',
            date: new Date(ret.created_at || Date.now()).toLocaleDateString('es-DO'),
            status: ret.status || 'pendiente',
            timestamp: ret.created_at || null,
          })),
        );
      }

      const latestClosure = await getLatestDailyClosure();
      if (latestClosure?.disable_tax_after_close) {
        setTaxEnabled(false);
      }
    }

    loadBillingData();
  }, []);

  // Load photographers from Supabase
  useEffect(() => {
    async function fetchPhotographers() {
      const { data, error } = await supabase
        .from('dashboard_users')
        .select('id, name')
        .in('role', ['photographer', 'both'])
        .eq('active', true)
        .order('name');
      if (!error && data) {
        setPhotographers(data.map((p) => ({ id: p.id, name: p.name })));
      }
    }
    fetchPhotographers();
  }, []);
  
  // Current invoice number display
  const invoiceNumber = formatInvoiceNumber(nextInvoiceNum);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
    );
  }, [searchQuery, products]);

  // Add product to cart
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  // Update cart item quantity
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item))
    );
  };

  // Remove item from cart
  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = taxEnabled ? subtotal * 0.18 : 0;
  const total = subtotal + tax;

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setTurno('');
    setClientName('');
    setClientPhone('');
    setPhotographer('');
    setCurrency('USD');
  };

  // Generate invoice
  const handleGenerateInvoice = async () => {
    if (cart.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }

    const normalizedClientName = String(clientName || '').trim();
    const effectiveClientName = normalizedClientName || 'Cliente General';
    
    const itemsList = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    // Resolve photographer name from ID
    const photographerName = photographers.find(p => p.id.toString() === photographer)?.name || photographer || null;

    let invoiceCounter = nextInvoiceNum;
    let invoiceNum = formatInvoiceNumber(invoiceCounter);
    let sbErr = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const supabaseRow = {
        invoice_number: invoiceNum,
        client_name: effectiveClientName,
        client_phone: clientPhone || null,
        turno: turno || 'Turno 9:00',
        photographer: photographerName,
        source: 'billing',
        date: new Date().toLocaleDateString('es-DO'),
        items: itemsList,
        subtotal,
        tax,
        total,
        currency: currency,
        status: 'active',
      };

      const { error } = await supabase.from('photo_invoices').insert(supabaseRow);
      sbErr = error || null;
      if (!sbErr) break;

      if (!isInvoiceNumberConflict(sbErr)) break;

      const { data: latestRows } = await supabase
        .from('photo_invoices')
        .select('invoice_number')
        .order('created_at', { ascending: false })
        .limit(1);

      const latestCounter = extractInvoiceCounter(latestRows?.[0]?.invoice_number);
      invoiceCounter = Math.max(invoiceCounter + 1, latestCounter + 1);
      invoiceNum = formatInvoiceNumber(invoiceCounter);
    }

    if (sbErr) {
      console.error('Error inserting invoice into photo_invoices:', sbErr);
      alert(resolveInvoiceInsertErrorMessage(sbErr));
      return;
    }

    // Create invoice object after DB write succeeds
    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      timestamp: new Date().toISOString(),
      clientName: effectiveClientName,
      clientPhone: clientPhone,
      turno: turno || 'Turno 9:00',
      photographer: photographerName,
      source: 'billing',
      date: new Date().toLocaleDateString('es-DO'),
      items: itemsList,
      subtotal: subtotal,
      tax: tax,
      total: total,
      currency: currency,
      status: 'active',
    };

    await addPhotoSaleEvent({
      eventType: 'online_purchase',
      phone: clientPhone || null,
      clientName: effectiveClientName,
      invoiceNumber: invoiceNum,
      planName: 'Factura Caja',
      amount: total,
      currency,
      source: 'billing',
      metadata: {
        turno: turno || 'Turno 9:00',
        photographer: photographerName,
        items: itemsList,
        tax,
        subtotal,
      },
    });

    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);

    // Push billing client for photographer dashboard
    if (clientPhone) {
      await addBillingClient({
        id: `bc_${Date.now()}`,
        clientName: effectiveClientName,
        phone: clientPhone,
        turno: turno || 'Turno 9:00',
        photographerName,
        invoiceNumber: newInvoice.invoiceNumber,
        total: total,
        date: newInvoice.date,
        photosReady: false,
      });
    }

    // Log activity
    logActivity('Factura generada', `${newInvoice.invoiceNumber} — ${currencyLabel(currency)} ${total.toFixed(2)} — ${effectiveClientName}`);
    
    // Update invoice counter
    const newNum = invoiceCounter + 1;
    setNextInvoiceNum(newNum);
    
    // Set current invoice and show print modal
    setCurrentInvoice(newInvoice);
    setShowPrintModal(true);
    
    // Clear the cart
    clearCart();
  };
  
  // Close print modal
  const handleClosePrintModal = () => {
    setShowPrintModal(false);
    setCurrentInvoice(null);
  };

  const handleCloseDay = async ({ closureDate, byCurrency, totalInvoices }) => {
    setClosingDay(true);
    const saved = await saveDailyClosure({
      closureDate,
      closedBy: billingUserName || billingUser?.name || null,
      totalInvoices,
      byCurrency,
      disableTaxAfterClose: true,
    });
    setClosingDay(false);

    if (saved) {
      setTaxEnabled(false);
      logActivity('Cierre del dia', `${closureDate} - ${totalInvoices} factura(s)`);
    }

    return saved;
  };

  const handleSaveProfile = async (nextProfile) => {
    if (!billingUserId) {
      alert('No se encontro el usuario activo para actualizar el perfil.');
      return;
    }

    setSavingProfile(true);
    const payload = {
      name: String(nextProfile?.name || '').trim(),
      email: String(nextProfile?.email || '').trim(),
      phone: String(nextProfile?.phone || '').trim(),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('dashboard_users')
      .update(payload)
      .eq('id', billingUserId);

    setSavingProfile(false);

    if (error) {
      alert('No se pudo guardar el perfil. Intenta nuevamente.');
      return;
    }

    setBillingUser((prev) => ({ ...prev, ...payload }));
    setBillingUserName(payload.name || billingUserName);

    const session = await getDashboardSession();
    if (session) {
      await setDashboardSession({
        ...session,
        ...payload,
        active: true,
      });
    }

    logActivity('Perfil actualizado', payload.name || 'Usuario');
  };

  return (
    <DashboardAuthGate allowedRoles={["billing", "both", "admin"]}>
    <div className="min-h-screen flex relative overflow-hidden">
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
        {/* Overlay with blur effect */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Left Sidebar — hidden on mobile */}
      <aside className="relative z-10 w-20 lg:w-24 bg-black/30 backdrop-blur-xl border-r border-white/20 
                        hidden lg:flex flex-col items-center py-6 gap-2">
        {/* Logo */}
        <div className="mb-6">
          <img src="/photographer/branding/macao-logo.png" alt="Macao" className="w-12 h-12 object-contain" />
        </div>

        {/* Navigation Icons */}
        <nav className="flex flex-col gap-2 flex-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <motion.button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`w-14 lg:w-16 h-14 lg:h-16 rounded-2xl flex flex-col items-center 
                           justify-center gap-1 transition-all duration-200
                           ${isActive 
                             ? 'bg-[#DC2626] text-white shadow-lg' 
                             : 'bg-black/30 text-white/60 hover:bg-black/40'
                           }`}
                title={item.label}
              >
                <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="text-[8px] lg:text-[10px] font-medium text-center leading-tight hidden lg:block">
                  {item.label.split(' ')[0]}
                </span>
              </motion.button>
            );
          })}
        </nav>

        {/* User badge + Logout at bottom of sidebar */}
        {billingUserName && (
          <div className="flex flex-col items-center gap-2 pb-4">
            <div className="text-[9px] text-white/60 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden lg:inline">{billingUserName}</span>
            </div>
            <button
              onClick={handleBillingLogout}
              className="w-10 h-10 rounded-xl bg-black/30 hover:bg-red-600/60 transition-colors flex items-center justify-center"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 text-white/60 hover:text-white" />
            </button>
          </div>
        )}
      </aside>

      {/* Mobile Bottom Tab Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-black/60 backdrop-blur-xl border-t border-white/20">
        <div className="flex justify-around items-center py-2 px-1">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-colors
                  ${isActive ? 'text-red-500' : 'text-white/60'}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-medium">{item.label.split(' ')[0]}</span>
              </button>
            );
          })}
          {/* Logout button in mobile nav */}
          <button
            onClick={handleBillingLogout}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl text-white/60"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-[9px] font-medium">Salir</span>
          </button>
        </div>
      </nav>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'nueva' && (
        <>
          {/* Main Content - Products Grid */}
          <main className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 overflow-hidden pb-20 lg:pb-6">
            {/* Header with Search */}
            <div className="mb-6">
              <h1 className="font-title text-2xl lg:text-4xl text-white mb-3 lg:mb-4">
                Facturacion
              </h1>
              
              {/* Search Bar */}
              <div className="flex gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full pl-12 pr-4 py-3.5 bg-black/35 backdrop-blur-sm rounded-2xl
                              border border-white/20 text-white placeholder:text-white/60/50
                              focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 focus:bg-black/40
                              transition-all duration-200"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-5 py-3.5 bg-black/35 backdrop-blur-sm rounded-2xl border border-white/20
                            text-white/60 hover:bg-black/40 transition-all duration-200 flex items-center gap-2"
                >
                  <Barcode className="w-5 h-5" />
                  <span className="hidden lg:inline">Escanear</span>
                </motion.button>
              </div>
            </div>

            {/* Products Grid */}
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} onEdit={setEditingProduct} currency={currency} />
                  ))}
                </AnimatePresence>
              </div>
              
              {filteredProducts.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-white/60">
                  <Search className="w-12 h-12 mb-4 opacity-40" />
                  <p className="text-lg">No se encontraron productos</p>
                  <p className="text-sm opacity-60">Intenta con otro término de búsqueda</p>
                </div>
              )}
            </div>

            {/* Mobile floating cart button */}
            <motion.button
              onClick={() => setShowMobileSummary(true)}
              className="lg:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full bg-[#DC2626] text-white
                        shadow-lg shadow-red-600/40 flex items-center justify-center"
              whileTap={{ scale: 0.9 }}
            >
              <Receipt className="w-6 h-6" />
              {cart.length > 0 && (
                <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-red-600 text-xs font-bold flex items-center justify-center">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </motion.button>
          </main>

          {/* Right Sidebar - Sale Summary */}
          <aside className={`
            fixed inset-0 z-40 lg:relative lg:inset-auto
            lg:w-[35%] lg:min-w-[320px] lg:max-w-[450px]
            bg-black/90 lg:bg-black/25 backdrop-blur-xl 
            lg:border-l border-white/20 flex flex-col
            transition-transform duration-300
            ${showMobileSummary ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            {/* Mobile close button */}
            <button
              onClick={() => setShowMobileSummary(false)}
              className="lg:hidden absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            {/* Header */}
            <div className="p-5 border-b border-white/15">
              <h2 className="font-title text-2xl text-white">Resumen de Venta</h2>
              <p className="text-white/60 text-sm mt-1">{invoiceNumber}</p>
            </div>

            {/* Client Configuration */}
            <div className="p-5 border-b border-white/15 space-y-4">
              {/* Client Type */}
              <CustomSelect
                label="Turno"
                value={turno}
                onChange={setTurno}
                placeholder="Seleccionar turno..."
                options={(() => {
                  const h = new Date().getHours();
                  return [
                    { value: 'Turno 9:00', label: 'Turno 9:00 AM', disabled: h >= 12 },
                    { value: 'Turno 12:00', label: 'Turno 12:00 PM', disabled: h >= 15 },
                    { value: 'Turno 3:00', label: 'Turno 3:00 PM', disabled: h >= 18 },
                  ];
                })()}
              />

              {/* Client Name */}
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Nombre del Cliente</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nombre completo..."
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 backdrop-blur-sm rounded-2xl
                              border border-white/20 text-white placeholder:text-white/60/50
                              focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 text-sm"
                  />
                </div>
              </div>

              {/* Client Phone */}
              <div>
                <label className="block text-white/60 text-xs mb-1.5">Teléfono</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="809-000-0000"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/30 backdrop-blur-sm rounded-2xl
                              border border-white/20 text-white placeholder:text-white/60/50
                              focus:outline-none focus:ring-2 focus:ring-[#EF4444]/30 text-sm"
                  />
                </div>
              </div>

              {/* Photographer */}
              <CustomSelect
                label="Fotógrafo Asignado"
                value={photographer}
                onChange={setPhotographer}
                placeholder="Seleccionar fotógrafo..."
                options={photographers.map((p) => ({ value: p.id.toString(), label: p.name }))}
              />

              {/* Currency */}
              <CustomSelect
                label="Moneda"
                value={currency}
                onChange={setCurrency}
                placeholder="Seleccionar moneda..."
                options={[
                  { value: 'USD', label: 'USD — Dólar Americano' },
                  { value: 'EUR', label: 'EUR — Euro' },
                  { value: 'DOP', label: 'DOP — Peso Dominicano' },
                ]}
              />
            </div>

            {/* Cart Items */}
            <div className="flex-1 p-5 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold text-sm">
                  Productos ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-400 hover:text-red-500 text-xs flex items-center gap-1
                              transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Limpiar
                  </button>
                )}
              </div>

              <AnimatePresence mode="popLayout">
                {cart.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-12 text-white/60/60"
                  >
                    <FileText className="w-10 h-10 mb-3 opacity-40" />
                    <p className="text-sm">No hay productos</p>
                    <p className="text-xs">Haz clic en un producto para agregarlo</p>
                  </motion.div>
                ) : (
                  cart.map((item) => (
                    <CartItem
                      key={item.id}
                      item={item}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
                      currency={currency}
                    />
                  ))
                )}
              </AnimatePresence>
            </div>

            {/* Price Breakdown */}
            <div className="p-5 border-t border-white/15 bg-black/20">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">Subtotal</span>
                  <span className="text-white">
                    {fmtMoney(subtotal, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">ITBIS (18%)</span>
                  <span className="text-white">
                    {fmtMoney(tax, currency)}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/15">
                  <span className="text-white">Total</span>
                  <span className="text-[#DC2626]">
                    {fmtMoney(total, currency)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={clearCart}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-white/30 text-white/60
                            font-medium hover:bg-black/25 transition-all duration-200"
                >
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleGenerateInvoice}
                  className="flex-1 py-3.5 rounded-2xl bg-[#DC2626] text-white font-medium
                            hover:bg-[#B91C1C] transition-all duration-200 shadow-lg
                            disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={cart.length === 0}
                >
                  Generar Factura
                </motion.button>
              </div>
            </div>
          </aside>
        </>
      )}

      {activeTab === 'usuario' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <UsuarioPanel
            user={billingUser}
            invoices={invoices}
            onLogout={handleBillingLogout}
            onSaveProfile={handleSaveProfile}
            savingProfile={savingProfile}
          />
        </main>
      )}

      {activeTab === 'devolucion' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <DevolucionPanel invoices={invoices} returns={returns} setReturns={setReturns} />
        </main>
      )}

      {activeTab === 'turnos' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <VentasTurnoPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'cierre-turno' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <CierreTurnoPanel invoices={invoices} returns={returns} />
        </main>
      )}

      {activeTab === 'cierre-dia' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <CierreDiaPanel
            invoices={invoices}
            returns={returns}
            onCloseDay={handleCloseDay}
            closingDay={closingDay}
            taxEnabled={taxEnabled}
            billingUser={billingUser}
          />
        </main>
      )}

      {/* Print Invoice Modal */}
      <AnimatePresence>
        {showPrintModal && currentInvoice && (
          <POSReceipt invoice={currentInvoice} onClose={handleClosePrintModal} />
        )}
      </AnimatePresence>

      {/* Product Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <ProductEditModal
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSave={async (updated) => {
              await supabase
                .from('photo_pricing')
                .update({
                  name: updated.name,
                  price: Number(updated.price || 0),
                  updated_at: new Date().toISOString(),
                })
                .eq('code', updated.code)

              const newProducts = products.map(p => p.id === updated.id ? { ...p, name: updated.name, price: updated.price } : p);
              setProducts(newProducts);
              setEditingProduct(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 115, 85, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 115, 85, 0.5);
        }
      `}</style>
    </div>
    </DashboardAuthGate>
  );
}
