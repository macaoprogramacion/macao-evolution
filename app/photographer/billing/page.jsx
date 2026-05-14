"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Lock,
  Send,
} from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { saveDailyClosure } from '@/lib/photography-db';
import { clearDashboardSession, getDashboardSession } from '@/lib/dashboard-session';
import {
  getInvoices as getStoredInvoices,
  saveInvoices,
  getInvoiceCounter as getNextInvoiceNumber,
  setInvoiceCounter as saveInvoiceCounter,
  formatInvoiceNumber,
  addBillingClient,
  getReturns,
  saveReturns,
  addReturn,
  logActivity,
  getActivity,
  calculateSalesByTurno,
} from '@/lib/store';

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

const PRODUCTS_KEY = 'macao_billing_products';
const loadProducts = () => {
  try {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to pick up any new products added in code
      return DEFAULT_PRODUCTS.map(dp => {
        const saved = parsed.find(p => p.id === dp.id);
        return saved ? { ...dp, price: saved.price, name: saved.name } : dp;
      });
    }
  } catch {}
  return DEFAULT_PRODUCTS;
};
const persistProducts = (products) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

// Photographers will be loaded from Supabase

// Sidebar menu items
const sidebarItems = [
  { id: 'nueva', icon: FileText, label: 'Nueva Factura' },
  { id: 'usuario', icon: User, label: 'Usuario' },
  { id: 'devolucion', icon: RotateCcw, label: 'Devolucion' },
  { id: 'turnos', icon: Clock, label: 'Ventas por Turno' },
  { id: 'cierre-turno', icon: ClipboardList, label: 'Cierre Turno' },
  { id: 'cierre-dia', icon: Sun, label: 'Cierre del Dia' },
];

// Usuario Panel Component
function UsuarioPanel({ activities, userProfile }) {
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
              <h2 className="text-white text-2xl font-title">{userProfile?.name || 'Usuario'}</h2>
              <p className="text-white/70">{userProfile?.role || 'Equipo de fotografia'}</p>
              <p className="text-white/50 text-sm mt-1">{userProfile?.email || 'Sin correo registrado'}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/15 rounded-2xl text-center">
              <p className="text-white text-2xl font-bold">156</p>
              <p className="text-white/70 text-xs">Ventas Este Mes</p>
            </div>
            <div className="p-4 bg-black/15 rounded-2xl text-center">
              <p className="text-white text-2xl font-bold">US$ 234K</p>
              <p className="text-white/70 text-xs">Total Vendido</p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
          <h3 className="text-white font-semibold mb-4">Configuración Rápida</h3>
          <div className="space-y-3">
            {[
              { icon: Settings, label: 'Configuración General', desc: 'Preferencias del sistema' },
              { icon: Bell, label: 'Notificaciones', desc: 'Alertas y sonidos' },
              { icon: CreditCard, label: 'Métodos de Pago', desc: 'Configurar métodos' },
              { icon: LogOut, label: 'Cerrar Sesión', desc: 'Salir de la cuenta' },
            ].map((item, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
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
          {activities.slice(0, 5).map((activity) => {
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
          {activities.length === 0 && (
            <p className="text-white/50 text-sm text-center py-4">Sin actividad reciente</p>
          )}
        </div>
      </div>
    </div>
  );
}

// Devolución Panel Component — reads real invoices from localStorage
function DevolucionPanel({ invoices }) {
  const [searchReturn, setSearchReturn] = useState('');
  const [returns, setReturns] = useState(getReturns);
  const [showNewReturn, setShowNewReturn] = useState(false);
  const [newReturnInvoice, setNewReturnInvoice] = useState('');
  const [newReturnReason, setNewReturnReason] = useState('');

  // Build returnable list from invoices that are not already returned
  const returnedInvoiceNums = new Set(returns.map(r => r.invoice));
  const returnableInvoices = invoices.filter(i => !returnedInvoiceNums.has(i.invoiceNumber) && i.status !== 'cancelled');

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

    const updated = addReturn(ret);
    setReturns(updated);
    logActivity('Devolucion creada', `${ret.invoice} — US$ ${ret.amount.toFixed(2)}`);
    setShowNewReturn(false);
    setNewReturnInvoice('');
    setNewReturnReason('');
  };

  const handleApprove = async (id) => {
    const updated = returns.map(r => r.id === id ? { ...r, status: 'aprobada' } : r);
    saveReturns(updated);
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
    saveReturns(updated);
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
                    <option key={inv.id} value={inv.invoiceNumber}>{inv.invoiceNumber} — {inv.clientName} (US$ {inv.total.toFixed(2)})</option>
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
                    US$ {ret.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
function CierreTurnoPanel({ invoices }) {
  const [selectedTurno, setSelectedTurno] = useState('');
  const todayStr = new Date().toLocaleDateString('es-DO');
  const returns = getReturns();

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
function CierreDiaPanel({ invoices, pendingDays = [], dashboardUser, onCierreSent }) {
  const todayStr = new Date().toLocaleDateString('es-DO');
  const todayISO = new Date().toISOString().slice(0, 10);
  const returns = getReturns();

  // Date selection — today or any pending past day
  const [selectedDateISO, setSelectedDateISO] = useState(
    pendingDays.length > 0 ? pendingDays[0] : todayISO
  );
  const isToday = selectedDateISO === todayISO;
  const [pastDayInvoices, setPastDayInvoices] = useState([]);
  const [loadingPastInvoices, setLoadingPastInvoices] = useState(false);
  const [sendingCierre, setSendingCierre] = useState(false);
  const [cierreMessage, setCierreMessage] = useState(null);

  // Fetch invoices for past days from Supabase
  useEffect(() => {
    if (isToday) {
      setPastDayInvoices([]);
      return;
    }
    let cancelled = false;
    async function fetchPastDayInvoices() {
      setLoadingPastInvoices(true);
      const { data, error } = await supabase
        .from('photo_invoices')
        .select('invoice_number, created_at, client_name, turno, currency, total, subtotal, tax')
        .gte('created_at', `${selectedDateISO}T00:00:00.000Z`)
        .lte('created_at', `${selectedDateISO}T23:59:59.999Z`)
        .neq('status', 'cancelled');
      if (!cancelled) {
        if (!error && data) {
          setPastDayInvoices(data.map(inv => ({
            invoiceNumber: inv.invoice_number,
            timestamp: inv.created_at,
            clientName: inv.client_name,
            turno: inv.turno,
            currency: inv.currency || 'USD',
            total: Number(inv.total || 0),
            subtotal: Number(inv.subtotal || 0),
            tax: Number(inv.tax || 0),
          })));
        }
        setLoadingPastInvoices(false);
      }
    }
    fetchPastDayInvoices();
    return () => { cancelled = true; };
  }, [selectedDateISO, isToday]);

  const activeInvoices = isToday
    ? invoices.filter(inv => new Date(inv.timestamp).toISOString().slice(0, 10) === todayISO)
    : pastDayInvoices;

  const fmtDayISO = (iso) => {
    const d = new Date(iso + 'T12:00:00');
    return d.toLocaleDateString('es-DO', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // All date options: pending past days + today
  const dateOptions = [
    ...pendingDays.map(d => ({ value: d, label: `${fmtDayISO(d)} ⚠️ sin cierre` })),
    { value: todayISO, label: `${fmtDayISO(todayISO)} (hoy)` },
  ];

  const handleSendCierre = async () => {
    if (activeInvoices.length === 0) {
      alert('No hay facturas para cerrar en este día.');
      return;
    }
    setSendingCierre(true);
    try {
      const byCurrencyForSave = {};
      activeInvoices.forEach(inv => {
        const cur = inv.currency || 'USD';
        if (!byCurrencyForSave[cur]) byCurrencyForSave[cur] = { total: 0, subtotal: 0, tax: 0, count: 0 };
        byCurrencyForSave[cur].total += inv.total;
        byCurrencyForSave[cur].subtotal += inv.subtotal;
        byCurrencyForSave[cur].tax += inv.tax;
        byCurrencyForSave[cur].count++;
      });
      const success = await saveDailyClosure({
        closureDate: selectedDateISO,
        closedBy: dashboardUser?.name || null,
        totalInvoices: activeInvoices.length,
        byCurrency: byCurrencyForSave,
      });
      if (success) {
        setCierreMessage({ type: 'ok', text: 'Cierre enviado exitosamente al administrador.' });
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('macao-photo-closure-sent', {
            detail: {
              closureDate: selectedDateISO,
              closedBy: dashboardUser?.name || null,
              totalInvoices: activeInvoices.length,
            },
          }));
        }
        onCierreSent?.();
      } else {
        setCierreMessage({ type: 'err', text: 'Error al enviar cierre. Intente de nuevo.' });
      }
    } catch (e) {
      console.error('Error sending cierre:', e);
      setCierreMessage({ type: 'err', text: 'Error inesperado al enviar cierre.' });
    } finally {
      setSendingCierre(false);
      setTimeout(() => setCierreMessage(null), 6000);
    }
  };

  // Exchange rates state — cashier can edit
  // Stored format: how many units of currency equal 1 USD (USD base)
  const [rates, setRates] = useState(() => {
    try {
      const stored = localStorage.getItem('macao_exchange_rates');
      if (!stored) return { USD: 1, EUR: 0.93, DOP: 58 };

      const parsed = JSON.parse(stored);
      const normalized = {
        USD: Number(parsed?.USD) > 0 ? Number(parsed.USD) : 1,
        EUR: Number(parsed?.EUR) > 0 ? Number(parsed.EUR) : 0.93,
        DOP: Number(parsed?.DOP) > 0 ? Number(parsed.DOP) : 58,
      };

      // Backward compatibility: old format stored "1 CUR = X USD".
      // Detect it via DOP < 1 (e.g. 0.0167) and convert to USD-base format.
      if (normalized.DOP < 1) {
        normalized.EUR = normalized.EUR > 0 ? 1 / normalized.EUR : 0.93;
        normalized.DOP = normalized.DOP > 0 ? 1 / normalized.DOP : 58;
      }

      return normalized;
    } catch {
      return { USD: 1, EUR: 0.93, DOP: 58 };
    }
  });
  const [editingRates, setEditingRates] = useState(false);
  const [convertToDOP, setConvertToDOP] = useState(false);

  const saveRates = (newRates) => {
    setRates(newRates);
    localStorage.setItem('macao_exchange_rates', JSON.stringify(newRates));
  };

  // Today's invoices (use activeInvoices which handles date selection)
  const todayInvoices = activeInvoices;

  // Group by currency
  const byCurrency = {};
  activeInvoices.forEach(inv => {
    const cur = inv.currency || 'USD';
    if (!byCurrency[cur]) byCurrency[cur] = { total: 0, subtotal: 0, tax: 0, count: 0 };
    byCurrency[cur].total += inv.total;
    byCurrency[cur].subtotal += inv.subtotal;
    byCurrency[cur].tax += inv.tax;
    byCurrency[cur].count++;
  });

  // Group by turno
  const byTurno = {};
  activeInvoices.forEach(inv => {
    const t = inv.turno || 'Turno 9:00';
    if (!byTurno[t]) byTurno[t] = { total: 0, count: 0, currencies: {} };
    byTurno[t].total += inv.total;
    byTurno[t].count++;
    const cur = inv.currency || 'USD';
    if (!byTurno[t].currencies[cur]) byTurno[t].currencies[cur] = 0;
    byTurno[t].currencies[cur] += inv.total;
  });

  // Returns
  const todayReturns = returns.filter(r => {
    const d = r.date || (r.timestamp ? new Date(r.timestamp).toLocaleDateString('es-DO') : '');
    return d === todayStr && (r.status === 'aprobada' || r.status === 'procesada');
  });
  const returnsTotal = todayReturns.reduce((s, r) => s + (r.amount || 0), 0);

  // Convert any currency total to DOP using USD-base rates (1 USD = X CUR)
  const toDOP = (amount, cur) => {
    if (cur === 'DOP') return amount;
    const curPerUSD = rates[cur] || 1;
    const dopPerUSD = rates['DOP'] || 58;

    // amount CUR -> USD -> DOP
    const amountInUSD = amount / curPerUSD;
    return amountInUSD * dopPerUSD;
  };

  const totalAllInDOP = Object.entries(byCurrency).reduce((sum, [cur, data]) => sum + toDOP(data.total, cur), 0);

  const turnoTimes = { 'Turno 9:00': '9:00 AM', 'Turno 12:00': '12:00 PM', 'Turno 3:00': '3:00 PM' };

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-title text-3xl lg:text-4xl text-white">Cierre del Dia</h1>
          <p className="text-white/50 text-sm">{fmtDayISO(selectedDateISO)}</p>
        </div>

        {/* Date selector — today or pending past days */}
        {dateOptions.length > 1 && (
          <div className="mb-4 flex gap-2 flex-wrap">
            {dateOptions.map(opt => (
              <button
                key={opt.value}
                onClick={() => setSelectedDateISO(opt.value)}
                className={`px-4 py-2 rounded-2xl text-sm font-medium border transition-all ${
                  selectedDateISO === opt.value
                    ? 'bg-[#DC2626] text-white border-[#DC2626]'
                    : 'bg-black/25 text-white/70 border-white/20 hover:border-white/40'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {/* Cierre send feedback */}
        {cierreMessage && (
          <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 ${
            cierreMessage.type === 'ok'
              ? 'bg-green-500/20 border border-green-500/30 text-green-300'
              : 'bg-red-500/20 border border-red-500/30 text-red-300'
          }`}>
            {cierreMessage.type === 'ok' ? <CheckCircle className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
            {cierreMessage.text}
          </div>
        )}

        {pendingDays.length === 0 && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-sm font-medium flex items-center gap-2 bg-green-500/20 border border-green-500/30 text-green-300">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            No hay cierres pendientes.
          </div>
        )}

        {/* Loading past invoices */}
        {loadingPastInvoices && (
          <div className="mb-4 text-white/60 text-sm text-center py-4">Cargando facturas del día...</div>
        )}

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
                <p className="text-white/50 text-xs">Equivalencia a 1 USD</p>
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

          <div className="grid grid-cols-3 gap-3">
            {Object.entries(CURRENCY_SYMBOLS).map(([cur, symbol]) => (
              <div key={cur} className="p-3 bg-black/15 rounded-2xl">
                <p className="text-white/50 text-xs mb-1">{symbol} ({cur})</p>
                {editingRates && cur !== 'USD' ? (
                  <input
                    type="number"
                    step="0.0001"
                    value={rates[cur] || ''}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val) && val > 0) saveRates({ ...rates, [cur]: val });
                    }}
                    className="w-full bg-black/30 rounded-xl px-3 py-1.5 text-white text-sm border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#DC2626]/30"
                  />
                ) : (
                  <p className="text-white font-semibold">{cur === 'USD' ? '1.0000' : (rates[cur] || 0).toFixed(4)}</p>
                )}
                {cur !== 'USD' && (
                  <p className="text-white/40 text-[10px] mt-1">
                    1 USD = {(rates[cur] || 0).toFixed(4)} {cur}
                  </p>
                )}
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
          <h3 className="text-white font-semibold mb-4">Todas las Facturas del D\u00eda</h3>
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
                {todayInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={convertToDOP ? 7 : 6} className="py-8 text-center text-white/50">No hay facturas hoy</td>
                  </tr>
                ) : todayInvoices.map(inv => {
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
      </div>

      {/* Right Summary */}
      <div className="lg:w-80 space-y-4">
        {/* Convert toggle */}
        <div className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
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
          <h3 className="text-white font-semibold mb-4">Resumen del Dia</h3>
          <div className="space-y-3">
            <div className="p-4 bg-[#DC2626]/20 rounded-2xl">
              <p className="text-white/70 text-xs mb-1">Total Facturas</p>
              <p className="text-white text-2xl font-bold">{todayInvoices.length}</p>
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
                {todayInvoices.length > 0
                  ? `US$ ${(todayInvoices.filter(i => (i.currency || 'USD') === 'USD').reduce((s, i) => s + i.total, 0) / Math.max(1, todayInvoices.filter(i => (i.currency || 'USD') === 'USD').length)).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : 'US$ 0.00'
                }
              </p>
            </div>

            {/* Send Cierre Button */}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSendCierre}
              disabled={sendingCierre || todayInvoices.length === 0}
              className="w-full py-3.5 rounded-2xl bg-[#DC2626] text-white font-semibold text-sm
                        flex items-center justify-center gap-2 mt-2
                        disabled:opacity-50 disabled:cursor-not-allowed
                        hover:bg-[#B91C1C] transition-colors"
            >
              <Send className="w-4 h-4" />
              {sendingCierre ? 'Enviando...' : 'Enviar Cierre al Administrador'}
            </motion.button>
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
          {currencyLabel(currency)} {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
          {currencyLabel(currency)} {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
  const selectedOption = options.find((option) => option.value === value);
  const displayValue = selectedOption?.label || value || placeholder;

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
        <span className={selectedOption || value ? 'text-white' : 'text-white/60/60'}>
          {displayValue}
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

// ─── Receipt HTML builder (module-level, reused by print & Supabase upload) ──
function buildReceiptHTML(inv) {
  const sym = CURRENCY_SYMBOLS[inv.currency] || 'US$';
  const itemsHTML = (inv.items || []).map(item => `
    <tr>
      <td style="text-align:left;padding:4px 0">${item.name}</td>
      <td style="text-align:center;padding:4px 0">${item.quantity}</td>
      <td style="text-align:right;padding:4px 0">${sym} ${item.price.toFixed(2)}</td>
      <td style="text-align:right;padding:4px 0">${sym} ${(item.quantity * item.price).toFixed(2)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Factura ${inv.invoiceNumber}</title>
<style>
@page{size:80mm auto;margin:0}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',Courier,monospace;font-size:11px;width:80mm;padding:3mm;background:#fff;color:#000;line-height:1.4}
.header{text-align:center;padding-bottom:10px;margin-bottom:10px;border-bottom:1px dashed #000}
.logo{width:140px;height:auto;margin-bottom:5px}
.invoice-num{font-size:14px;font-weight:bold;margin:8px 0 4px 0}
.date{font-size:10px;color:#333}
.divider{border:none;border-top:1px dashed #000;margin:10px 0}
.section-title{font-weight:bold;text-align:center;margin:8px 0;font-size:11px}
.info-table{width:100%;margin-bottom:10px}
.info-table td{padding:3px 0;vertical-align:top}
.info-table td:first-child{font-weight:bold;width:40%}
.info-table td:last-child{text-align:right}
.items-table{width:100%;border-collapse:collapse;margin:10px 0}
.items-table th{border-bottom:1px solid #000;border-top:1px solid #000;padding:5px 2px;font-size:10px;text-transform:uppercase}
.items-table td{padding:4px 2px;font-size:10px;border-bottom:1px dotted #ccc}
.totals-table{width:100%;margin-top:10px}
.totals-table td{padding:4px 0}
.totals-table td:last-child{text-align:right;font-weight:bold}
.total-row{font-size:14px;font-weight:bold;border-top:2px solid #000}
.total-row td{padding-top:8px!important}
.footer{text-align:center;margin-top:15px;padding-top:10px;border-top:1px dashed #000}
.thanks{font-size:12px;font-weight:bold;margin-bottom:5px}
.footer-note{font-size:9px;color:#555;margin-top:3px}
</style>
</head>
<body>
<div class="receipt">
  <div class="header">
    <img src="https://www.jonathanarache.com/photographer/branding/macao-logo.png" class="logo" alt="Macao"/>
    <div class="invoice-num">FACTURA No: ${inv.invoiceNumber}</div>
    <div class="date">Fecha: ${new Date(inv.timestamp).toLocaleString('es-DO')}</div>
  </div>
  <div class="section-title">DATOS DEL CLIENTE</div>
  <table class="info-table">
    <tr><td>Cliente:</td><td>${inv.clientName || 'Cliente General'}</td></tr>
    ${inv.clientPhone ? `<tr><td>Teléfono:</td><td>${inv.clientPhone}</td></tr>` : ''}
    <tr><td>Turno:</td><td>${inv.turno || 'Turno 9:00'}</td></tr>
  </table>
  <hr class="divider"/>
  <div class="section-title">DETALLE DE PRODUCTOS</div>
  <table class="items-table">
    <thead><tr>
      <th style="text-align:left">Producto</th>
      <th style="text-align:center">Cant</th>
      <th style="text-align:right">Precio</th>
      <th style="text-align:right">Total</th>
    </tr></thead>
    <tbody>${itemsHTML}</tbody>
  </table>
  <hr class="divider"/>
  <table class="totals-table">
    <tr><td>SUBTOTAL:</td><td>${sym} ${inv.subtotal.toFixed(2)}</td></tr>
    <tr class="total-row"><td>TOTAL A PAGAR:</td><td>${sym} ${inv.total.toFixed(2)}</td></tr>
  </table>
  <div class="footer">
    <div class="thanks">¡GRACIAS POR SU COMPRA!</div>
    <div style="font-size:11px;font-weight:bold;margin:8px 0;padding:6px;border:1px solid #000;text-align:center">
      📅 Tiene 15 días para descargar sus fotos y videos
    </div>
    <div class="footer-note">Conserve este recibo para cualquier reclamación</div>
    <div class="footer-note">www.jonathanarache.com</div>
  </div>
</div>
</body>
</html>`;
}

// Uploads receipt HTML to Supabase Storage and returns the public URL
async function uploadReceiptToSupabase(inv) {
  try {
    const html = buildReceiptHTML(inv);
    const blob = new Blob([html], { type: 'text/html; charset=utf-8' });
    const fileName = `${inv.invoiceNumber}.html`;

    // Ensure bucket exists (idempotent)
    await supabase.storage.createBucket('photo-tickets', { public: true }).catch(() => {});

    const { error: uploadError } = await supabase.storage
      .from('photo-tickets')
      .upload(fileName, blob, { contentType: 'text/html', upsert: true });

    if (uploadError) {
      console.warn('Ticket upload error:', uploadError.message);
      return null;
    }

    const { data } = supabase.storage.from('photo-tickets').getPublicUrl(fileName);
    return data?.publicUrl || null;
  } catch (e) {
    console.warn('uploadReceiptToSupabase failed:', e);
    return null;
  }
}

// POS Receipt Component for printing (80mm width)
function POSReceipt({ invoice, onClose, ticketUrl }) {
  const receiptRef = useRef(null);
  
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=302,height=600');
    printWindow.document.write(buildReceiptHTML(invoice));
    printWindow.document.close();
    printWindow.focus();
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
                  <td className="py-2 text-right">${item.price.toFixed(2)}</td>
                  <td className="py-2 text-right">${(item.quantity * item.price).toFixed(2)}</td>
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
                <td className="py-1 text-right font-semibold">{CURRENCY_SYMBOLS[invoice.currency] || 'US$'} {invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-2 text-sm font-bold">TOTAL A PAGAR:</td>
                <td className="py-2 text-right text-sm font-bold">{CURRENCY_SYMBOLS[invoice.currency] || 'US$'} {invoice.total.toFixed(2)}</td>
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
            <div className="text-[9px] text-gray-500">www.jonathanarache.com</div>
          </div>
        </div>
        
        {/* Share Link */}
        {ticketUrl && (
          <div className="px-4 pt-2 pb-0">
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-green-700 mb-0.5">Enlace del ticket</p>
                <p className="text-[10px] text-green-600 truncate">{ticketUrl}</p>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(ticketUrl); }}
                className="flex-shrink-0 px-3 py-1.5 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
              >
                Copiar
              </button>
            </div>
          </div>
        )}
        
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
  const [dashboardUser, setDashboardUser] = useState(null);
  const [activityFeed, setActivityFeed] = useState([]);
  const [pendingClosureDays, setPendingClosureDays] = useState([]);
  const [pendingClosuresLoaded, setPendingClosuresLoaded] = useState(false);

  useEffect(() => {
    getDashboardSession().then((session) => {
      if (session?.active) {
        setDashboardUser(session);
      }
    });
  }, []);

  const handleBillingLogout = async () => {
    await clearDashboardSession();
    window.location.reload();
  };

  // Load products from localStorage
  useEffect(() => {
    setProducts(loadProducts());
  }, []);
  
  // Invoice management state
  const [invoices, setInvoices] = useState([]);
  const [nextInvoiceNum, setNextInvoiceNum] = useState(1);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  
  // Load invoices from localStorage on mount
  useEffect(() => {
    const stored = getStoredInvoices();
    setInvoices(stored);
    setNextInvoiceNum(getNextInvoiceNumber());
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

  // Load pending closure days
  const loadPendingClosures = async () => {
    setPendingClosuresLoaded(false);
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const [{ data: invData }, { data: closureData }] = await Promise.all([
        supabase.from('photo_invoices').select('created_at').neq('status', 'cancelled'),
        supabase.from('photo_daily_closures').select('closure_date'),
      ]);
      if (invData && closureData) {
        const closureSet = new Set(closureData.map(c => c.closure_date));
        const daysWithSales = new Set();
        invData.forEach(inv => {
          const dayKey = inv.created_at ? inv.created_at.slice(0, 10) : null;
          if (dayKey && dayKey < todayKey) daysWithSales.add(dayKey);
        });
        const pending = Array.from(daysWithSales)
          .filter(day => !closureSet.has(day))
          .sort((a, b) => b.localeCompare(a));
        setPendingClosureDays(pending);
      } else {
        setPendingClosureDays([]);
      }
    } catch (e) {
      console.error('Error checking pending closures:', e);
      setPendingClosureDays([]);
    } finally {
      setPendingClosuresLoaded(true);
    }
  };

  useEffect(() => {
    loadPendingClosures();
  }, []);

  useEffect(() => {
    let active = true;
    getActivity().then((rows) => {
      if (active) setActivityFeed(Array.isArray(rows) ? rows : []);
    }).catch(() => {
      if (active) setActivityFeed([]);
    });
    return () => {
      active = false;
    };
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
  const tax = 0;
  const total = subtotal;

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
    
    const invoiceNum = formatInvoiceNumber(nextInvoiceNum);
    const now = new Date();
    const isoTimestamp = now.toISOString();
    const localDate = now.toLocaleDateString('es-DO');
    const itemsList = cart.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    // Resolve photographer name from ID
    const photographerName = photographers.find(p => p.id.toString() === photographer)?.name || photographer || null;

    // Create invoice object
    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: invoiceNum,
      timestamp: isoTimestamp,
      clientName: clientName || 'Cliente General',
      clientPhone: clientPhone,
      turno: turno || 'Turno 9:00',
      photographer: photographerName,
      source: 'billing',
      date: localDate,
      items: itemsList,
      subtotal: subtotal,
      tax: tax,
      total: total,
      currency: currency,
      status: 'active',
    };

    // Save to Supabase first, keep local fallback even if it fails.
    const { error: supabaseInsertError } = await supabase.from('photo_invoices').insert({
      invoice_number: invoiceNum,
      client_name: clientName || 'Cliente General',
      client_phone: clientPhone || null,
      turno: turno || 'Turno 9:00',
      photographer: photographerName,
      source: 'billing',
      date: localDate,
      items: itemsList,
      subtotal,
      tax,
      total,
      currency: currency,
      status: 'active',
    });

    if (supabaseInsertError) {
      console.warn('Supabase insert error (offline fallback active):', supabaseInsertError.message);
    }

    // Also save to localStorage (offline fallback)
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // Push billing client for photographer dashboard
    if (clientPhone) {
      addBillingClient({
        id: `bc_${Date.now()}`,
        name: clientName || 'Cliente General',
        phone: clientPhone,
        turno: turno || 'Turno 9:00',
        photographer: photographerName,
        invoiceNumber: newInvoice.invoiceNumber,
        total: total,
        date: newInvoice.date,
        photosReady: false,
      });
    }

    // Log activity
    logActivity('Factura generada', `${newInvoice.invoiceNumber} — ${currencyLabel(currency)} ${total.toFixed(2)} — ${clientName || 'Cliente General'}`);
    
    // Update invoice counter
    const newNum = nextInvoiceNum + 1;
    setNextInvoiceNum(newNum);
    saveInvoiceCounter(newNum);

    // Upload ticket HTML to Supabase Storage and attach public URL
    const ticketUrl = await uploadReceiptToSupabase(newInvoice);
    if (ticketUrl) {
      await supabase.from('photo_invoices')
        .update({ ticket_url: ticketUrl })
        .eq('invoice_number', invoiceNum);
      newInvoice.ticket_url = ticketUrl;
    }
    
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
        {dashboardUser?.name && (
          <div className="flex flex-col items-center gap-2 pb-4">
            <div className="text-[9px] text-white/60 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span className="hidden lg:inline">{dashboardUser.name}</span>
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
            {/* Pending cierre warning banner */}
            {pendingClosureDays.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-yellow-500/15 border border-yellow-500/40 rounded-2xl p-4 flex items-start gap-3"
              >
                <Lock className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-200 font-semibold text-sm">Cierres diarios pendientes</p>
                  <p className="text-yellow-300/80 text-xs mt-0.5">
                    {pendingClosureDays.length} día(s) sin cierre enviado. Debes enviar el cierre antes de emitir nuevas facturas.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('cierre-dia')}
                  className="text-xs px-3 py-1.5 bg-yellow-500/30 hover:bg-yellow-500/50 text-yellow-200 rounded-xl transition-colors whitespace-nowrap"
                >
                  Ir a Cierre
                </button>
              </motion.div>
            )}

            {pendingClosuresLoaded && pendingClosureDays.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 bg-green-500/15 border border-green-500/40 rounded-2xl p-4 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-green-200 font-semibold text-sm">No hay cierres pendientes</p>
                  <p className="text-green-300/80 text-xs mt-0.5">
                    Ya puedes emitir nuevas facturas normalmente.
                  </p>
                </div>
              </motion.div>
            )}

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
                    <ProductCard key={product.id} product={product} currency={currency} onAdd={addToCart} onEdit={setEditingProduct} />
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
                      currency={currency}
                      onUpdateQuantity={updateQuantity}
                      onRemove={removeFromCart}
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
                    {currencyLabel(currency)} {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/15">
                  <span className="text-white">Total</span>
                  <span className="text-[#DC2626]">
                    {currencyLabel(currency)} {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                  whileHover={pendingClosureDays.length === 0 && cart.length > 0 ? { scale: 1.02 } : {}}
                  whileTap={pendingClosureDays.length === 0 && cart.length > 0 ? { scale: 0.98 } : {}}
                  onClick={pendingClosureDays.length === 0 ? handleGenerateInvoice : () => setActiveTab('cierre-dia')}
                  className="flex-1 py-3.5 rounded-2xl font-medium transition-all duration-200 shadow-lg
                            disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2
                            text-white"
                  style={{
                    background: pendingClosureDays.length > 0
                      ? 'rgba(234, 179, 8, 0.4)'
                      : cart.length === 0 ? 'rgba(220,38,38,0.5)' : '#DC2626',
                  }}
                  disabled={cart.length === 0 && pendingClosureDays.length === 0}
                >
                  {pendingClosureDays.length > 0 ? (
                    <>
                      <Lock className="w-4 h-4" />
                      Cierre Pendiente
                    </>
                  ) : (
                    'Generar Factura'
                  )}
                </motion.button>
              </div>
            </div>
          </aside>
        </>
      )}

      {activeTab === 'usuario' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <UsuarioPanel activities={activityFeed} userProfile={dashboardUser} />
        </main>
      )}

      {activeTab === 'devolucion' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <DevolucionPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'turnos' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <VentasTurnoPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'cierre-turno' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <CierreTurnoPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'cierre-dia' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overflow-auto">
          <CierreDiaPanel
            invoices={invoices}
            pendingDays={pendingClosureDays}
            dashboardUser={dashboardUser}
            onCierreSent={loadPendingClosures}
          />
        </main>
      )}

      {/* Print Invoice Modal */}
      <AnimatePresence>
        {showPrintModal && currentInvoice && (
          <POSReceipt invoice={currentInvoice} ticketUrl={currentInvoice.ticket_url} onClose={handleClosePrintModal} />
        )}
      </AnimatePresence>

      {/* Product Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <ProductEditModal
            product={editingProduct}
            onClose={() => setEditingProduct(null)}
            onSave={(updated) => {
              const newProducts = products.map(p => p.id === updated.id ? { ...p, name: updated.name, price: updated.price } : p);
              setProducts(newProducts);
              persistProducts(newProducts);
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
