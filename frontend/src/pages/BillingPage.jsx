import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
} from 'lucide-react';
import macaoLogo from '../assets/branding/macao-logo.png';

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
  calculateFinanceStats,
  calculateSalesByTurno,
} from '../lib/store';

// Background image
import bgPortafolio from '../assets/branding/photos/bg-4k-portafolio.png';

// Demo product data
const demoProducts = [
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

// Demo photographers
const photographers = [
  { id: 1, name: 'Carlos Méndez' },
  { id: 2, name: 'Ana García' },
  { id: 3, name: 'Luis Rodríguez' },
  { id: 4, name: 'María López' },
];

// Sidebar menu items
const sidebarItems = [
  { id: 'nueva', icon: FileText, label: 'Nueva Factura' },
  { id: 'finanzas', icon: TrendingUp, label: 'Finanzas' },
  { id: 'usuario', icon: User, label: 'Usuario' },
  { id: 'devolucion', icon: RotateCcw, label: 'Devolución' },
  { id: 'turnos', icon: Clock, label: 'Ventas por Turno' },
];

// Generate dynamic finance stats from invoices — now includes real returns
const generateFinanceStats = (stats) => [
  { label: 'Ventas Hoy', value: `US$ ${stats.salesToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: '+0%', positive: true, icon: DollarSign },
  { label: 'Ventas Semana', value: `US$ ${stats.salesWeek.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: '+0%', positive: true, icon: TrendingUp },
  { label: 'Ventas Mes', value: `US$ ${stats.salesMonth.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: '+0%', positive: true, icon: CreditCard },
  { label: 'Devoluciones', value: `US$ ${stats.returnsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: '0%', positive: stats.returnsTotal === 0, icon: RotateCcw },
];

// Finanzas Panel Component
function FinanzasPanel({ invoices }) {
  const returns = getReturns();
  const stats = calculateFinanceStats(invoices, returns);
  const financeStats = generateFinanceStats(stats);
  
  // Get recent transactions from invoices
  const recentTx = invoices.slice(-10).reverse().map(inv => ({
    id: inv.id,
    client: inv.clientName || 'Cliente General',
    amount: inv.total,
    type: 'venta',
    date: new Date(inv.timestamp).toLocaleString('es-DO'),
    status: 'completada',
  }));
  
  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-6">
      {/* Main Stats Area */}
      <div className="flex-1 flex flex-col">
        <h1 className="font-title text-3xl lg:text-4xl text-white mb-6">Finanzas</h1>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {financeStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#DC2626]/20 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-[#DC2626]" />
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-medium ${stat.positive ? 'text-green-500' : 'text-red-400'}`}>
                    {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {stat.change}
                  </div>
                </div>
                <p className="text-white font-semibold text-lg">{stat.value}</p>
                <p className="text-white/70 text-xs">{stat.label}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Transactions Table */}
        <div className="flex-1 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20 overflow-hidden">
          <h3 className="text-white font-semibold mb-4">Transacciones Recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-white/70 text-xs border-b border-white/10">
                  <th className="text-left py-3 px-2">Cliente</th>
                  <th className="text-left py-3 px-2">Tipo</th>
                  <th className="text-right py-3 px-2">Monto</th>
                  <th className="text-left py-3 px-2">Fecha</th>
                  <th className="text-center py-3 px-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-white/50">
                      No hay transacciones registradas
                    </td>
                  </tr>
                ) : (
                  recentTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/5 hover:bg-black/10 transition-colors">
                      <td className="py-3 px-2 text-white text-sm">{tx.client}</td>
                      <td className="py-3 px-2">
                        <span className={`text-xs px-2 py-1 rounded-full ${tx.type === 'venta' ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right text-white text-sm font-medium">
                        US$ {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-2 text-white/70 text-sm">{tx.date}</td>
                      <td className="py-3 px-2 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          tx.status === 'completada' ? 'bg-green-500/20 text-green-400' :
                          tx.status === 'pendiente' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Summary */}
      <div className="lg:w-80 bg-black/25 backdrop-blur-xl rounded-3xl p-5 border border-white/20">
        <h3 className="text-white font-semibold mb-4">Resumen del Día</h3>
        <div className="space-y-4">
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Total Facturado</p>
            <p className="text-white text-2xl font-bold">US$ {stats.salesToday.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Facturas Emitidas</p>
            <p className="text-white text-2xl font-bold">{stats.invoicesToday}</p>
          </div>
          <div className="p-4 bg-black/15 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Ticket Promedio</p>
            <p className="text-white text-2xl font-bold">US$ {stats.ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="p-4 bg-[#DC2626]/20 rounded-2xl">
            <p className="text-white/70 text-xs mb-1">Meta Diaria</p>
            <div className="flex items-center justify-between">
              <p className="text-white text-xl font-bold">{Math.min(100, Math.round((stats.salesToday / 1000) * 100))}%</p>
              <p className="text-white/70 text-xs">US$ 1,000.00</p>
            </div>
            <div className="w-full h-2 bg-black/20 rounded-full mt-2">
              <div 
                className="h-full bg-[#DC2626] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (stats.salesToday / 1000) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Usuario Panel Component
function UsuarioPanel() {
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
              <h2 className="text-white text-2xl font-semibold">Carlos Méndez</h2>
              <p className="text-white/70">Fotógrafo Senior</p>
              <p className="text-white/50 text-sm mt-1">carlos.mendez@macao.com</p>
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
          {getActivity().slice(0, 5).map((activity) => {
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
          {getActivity().length === 0 && (
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
  const returnableInvoices = invoices.filter(i => !returnedInvoiceNums.has(i.invoiceNumber));

  const filteredReturns = returns.filter(r => {
    if (!searchReturn.trim()) return true;
    const q = searchReturn.toLowerCase();
    return r.invoice?.toLowerCase().includes(q) || r.client?.toLowerCase().includes(q);
  });

  const handleCreateReturn = () => {
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
    const updated = addReturn(ret);
    setReturns(updated);
    logActivity('Devolución creada', `${ret.invoice} — US$ ${ret.amount.toFixed(2)}`);
    setShowNewReturn(false);
    setNewReturnInvoice('');
    setNewReturnReason('');
  };

  const handleApprove = (id) => {
    const updated = returns.map(r => r.id === id ? { ...r, status: 'aprobada' } : r);
    saveReturns(updated);
    setReturns(updated);
    const r = updated.find(x => x.id === id);
    logActivity('Devolución aprobada', r.invoice);
  };

  const handleReject = (id) => {
    const updated = returns.map(r => r.id === id ? { ...r, status: 'rechazada' } : r);
    saveReturns(updated);
    setReturns(updated);
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
  const turnoTimes = { 'Primer Turno': '06:00 – 14:00', 'Segundo Turno': '14:00 – 22:00', 'Tercer Turno': '22:00 – 06:00' };

  // Determine current turno by hour
  const currentHour = new Date().getHours();
  const currentTurno = currentHour >= 6 && currentHour < 14 ? 'Primer Turno' : currentHour >= 14 && currentHour < 22 ? 'Segundo Turno' : 'Tercer Turno';
  const currentData = turnoData.find(t => t.shift === currentTurno) || { sales: 0, amount: 0 };
  const totalToday = turnoData.reduce((s, t) => s + t.amount, 0);
  const totalSales = turnoData.reduce((s, t) => s + t.sales, 0);
  const avgTicket = totalSales > 0 ? totalToday / totalSales : 0;

  // Group invoices by date for history
  const dateGroups = {};
  invoices.forEach(inv => {
    const d = inv.date || 'Sin fecha';
    if (!dateGroups[d]) dateGroups[d] = { 'Primer Turno': 0, 'Segundo Turno': 0, 'Tercer Turno': 0 };
    const t = inv.turno || 'Primer Turno';
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
                      <p className="text-white/50 text-xs">1er Turno</p>
                      <p className="text-white">US$ {(turnos['Primer Turno'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">2do Turno</p>
                      <p className="text-white">US$ {(turnos['Segundo Turno'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-white/50 text-xs">3er Turno</p>
                      <p className="text-white">US$ {(turnos['Tercer Turno'] || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
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

// Product Card Component
function ProductCard({ product, onAdd }) {
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
                 cursor-pointer transition-shadow duration-300 border border-white/20"
    >
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
          US$ {product.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </motion.div>
  );
}

// Cart Item Component
function CartItem({ item, onUpdateQuantity, onRemove }) {
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
          US$ {item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2.5 text-left text-white hover:bg-white/10 
                           transition-colors text-sm"
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
  
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=302,height=600');
    
    // Generate items HTML
    const itemsHTML = invoice.items.map(item => `
      <tr>
        <td style="text-align: left; padding: 4px 0;">${item.name}</td>
        <td style="text-align: center; padding: 4px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 4px 0;">$${item.price.toFixed(2)}</td>
        <td style="text-align: right; padding: 4px 0;">$${(item.quantity * item.price).toFixed(2)}</td>
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
              <img src="${macaoLogo}" class="logo" alt="Macao" />
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
                <td>${invoice.turno || 'Primer Turno'}</td>
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
                <td>US$ ${invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td>ITBIS (18%):</td>
                <td>US$ ${invoice.tax.toFixed(2)}</td>
              </tr>
              <tr class="total-row">
                <td>TOTAL A PAGAR:</td>
                <td>US$ ${invoice.total.toFixed(2)}</td>
              </tr>
            </table>
            
            <!-- Footer -->
            <div class="footer">
              <div class="thanks">¡GRACIAS POR SU COMPRA!</div>
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
            <img src={macaoLogo} alt="Macao" className="w-32 h-auto mx-auto mb-3" />
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
                <td className="py-1 text-right">{invoice.turno || 'Primer Turno'}</td>
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
                <td className="py-1 text-right font-semibold">US$ {invoice.subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="py-1">ITBIS (18%):</td>
                <td className="py-1 text-right font-semibold">US$ {invoice.tax.toFixed(2)}</td>
              </tr>
              <tr className="border-t-2 border-black">
                <td className="py-2 text-sm font-bold">TOTAL A PAGAR:</td>
                <td className="py-2 text-right text-sm font-bold">US$ {invoice.total.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          
          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-t border-dashed border-gray-400">
            <div className="font-bold text-xs mb-1">¡GRACIAS POR SU COMPRA!</div>
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
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [turno, setTurno] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [photographer, setPhotographer] = useState('');
  
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
  
  // Current invoice number display
  const invoiceNumber = formatInvoiceNumber(nextInvoiceNum);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return demoProducts;
    const query = searchQuery.toLowerCase();
    return demoProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.code.toLowerCase().includes(query)
    );
  }, [searchQuery]);

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
  const tax = subtotal * 0.18; // 18% ITBIS
  const total = subtotal + tax;

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setTurno('');
    setClientName('');
    setClientPhone('');
    setPhotographer('');
  };

  // Generate invoice
  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      alert('Agrega productos al carrito');
      return;
    }
    
    // Create invoice object
    const newInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber: formatInvoiceNumber(nextInvoiceNum),
      timestamp: new Date().toISOString(),
      clientName: clientName || 'Cliente General',
      clientPhone: clientPhone,
      turno: turno || 'Primer Turno',
      photographer: photographer,
      source: 'billing',
      date: new Date().toLocaleDateString('es-DO'),
      items: cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
      subtotal: subtotal,
      tax: tax,
      total: total,
    };
    
    // Save invoice to localStorage
    const updatedInvoices = [...invoices, newInvoice];
    setInvoices(updatedInvoices);
    saveInvoices(updatedInvoices);

    // Push billing client for photographer dashboard
    if (clientPhone) {
      addBillingClient({
        id: `bc_${Date.now()}`,
        name: clientName || 'Cliente General',
        phone: clientPhone,
        turno: turno || 'Primer Turno',
        photographer: photographer,
        invoiceNumber: newInvoice.invoiceNumber,
        total: total,
        date: newInvoice.date,
        photosReady: false,
      });
    }

    // Log activity
    logActivity('Factura generada', `${newInvoice.invoiceNumber} — US$ ${total.toFixed(2)} — ${clientName || 'Cliente General'}`);
    
    // Update invoice counter
    const newNum = nextInvoiceNum + 1;
    setNextInvoiceNum(newNum);
    saveInvoiceCounter(newNum);
    
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
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgPortafolio})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed',
        }}
      >
        {/* Overlay with blur effect */}
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />
      </div>

      {/* Left Sidebar */}
      <aside className="relative z-10 w-20 lg:w-24 bg-black/30 backdrop-blur-xl border-r border-white/20 
                        flex flex-col items-center py-6 gap-2">
        {/* Logo */}
        <div className="mb-6">
          <img src={macaoLogo} alt="Macao" className="w-12 h-12 object-contain" />
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
      </aside>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'nueva' && (
        <>
          {/* Main Content - Products Grid */}
          <main className="relative z-10 flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
            {/* Header with Search */}
            <div className="mb-6">
              <h1 className="font-title text-3xl lg:text-4xl text-white mb-4">
                Facturación
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 gap-4">
                <AnimatePresence mode="popLayout">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} onAdd={addToCart} />
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
          </main>

          {/* Right Sidebar - Sale Summary */}
          <aside className="relative z-10 w-[35%] min-w-[320px] max-w-[450px] bg-black/25 backdrop-blur-xl 
                            border-l border-white/20 flex flex-col">
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
                options={[
                  { value: 'Primer Turno', label: 'Primer Turno (06:00 – 14:00)' },
                  { value: 'Segundo Turno', label: 'Segundo Turno (14:00 – 22:00)' },
                  { value: 'Tercer Turno', label: 'Tercer Turno (22:00 – 06:00)' },
                ]}
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
                    US$ {subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">ITBIS (18%)</span>
                  <span className="text-white">
                    US$ {tax.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-white/15">
                  <span className="text-white">Total</span>
                  <span className="text-[#DC2626]">
                    US$ {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

      {activeTab === 'finanzas' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 overflow-auto">
          <FinanzasPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'usuario' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 overflow-auto">
          <UsuarioPanel />
        </main>
      )}

      {activeTab === 'devolucion' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 overflow-auto">
          <DevolucionPanel invoices={invoices} />
        </main>
      )}

      {activeTab === 'turnos' && (
        <main className="relative z-10 flex-1 p-4 lg:p-6 overflow-auto">
          <VentasTurnoPanel invoices={invoices} />
        </main>
      )}

      {/* Print Invoice Modal */}
      <AnimatePresence>
        {showPrintModal && currentInvoice && (
          <POSReceipt invoice={currentInvoice} onClose={handleClosePrintModal} />
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
  );
}
