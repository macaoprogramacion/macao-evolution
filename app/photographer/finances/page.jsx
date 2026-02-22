"use client"

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Wallet,
  PieChart
} from 'lucide-react';
import Navbar from '@/components/photographer/Navbar';
import Sidebar from '@/components/photographer/Sidebar';
import BottomNav from '@/components/photographer/BottomNav';
import { GlassCard, GlassButton } from '@/components/photographer/ui';

// Background image

// Invoice storage key (same as BillingPage)
const INVOICES_STORAGE_KEY = 'macao_invoices';

// Get all invoices from localStorage
const getStoredInvoices = () => {
  try {
    const data = localStorage.getItem(INVOICES_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

// Calculate stats from invoices
const calculateStats = (invoices, period) => {
  const now = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'semana':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'mes':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'trimestre':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case 'año':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }
  
  const filteredInvoices = invoices.filter(inv => new Date(inv.timestamp) >= startDate);
  
  const totalVentas = filteredInvoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalComisiones = totalVentas * 0.10; // 10% commission
  const ticketPromedio = filteredInvoices.length > 0 ? totalVentas / filteredInvoices.length : 0;
  const facturasCount = filteredInvoices.length;
  
  return { totalVentas, totalComisiones, ticketPromedio, facturasCount, filteredInvoices };
};

// Get monthly data for chart
const getMonthlyData = (invoices) => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const now = new Date();
  const data = [];
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    const monthInvoices = invoices.filter(inv => {
      const invDate = new Date(inv.timestamp);
      return invDate >= monthStart && invDate <= monthEnd;
    });
    
    const ventas = monthInvoices.reduce((sum, inv) => sum + inv.total, 0);
    data.push({
      month: months[date.getMonth()],
      ventas: ventas,
      comisiones: ventas * 0.10,
    });
  }
  
  return data;
};

export default function FinanzasPage() {
  
  const [selectedPeriod, setSelectedPeriod] = useState('mes');
  const [invoices, setInvoices] = useState([]);
  
  // Load invoices from localStorage
  useEffect(() => {
    const stored = getStoredInvoices();
    setInvoices(stored);
  }, []);
  
  // Calculate stats based on selected period
  const { totalVentas, totalComisiones, ticketPromedio, facturasCount, filteredInvoices } = calculateStats(invoices, selectedPeriod);
  const monthlyData = getMonthlyData(invoices);
  
  // Get recent transactions from invoices
  const recentTransactions = invoices.slice(-6).reverse().map(inv => ({
    id: inv.id,
    type: 'venta',
    description: `${inv.items[0]?.name || 'Venta'} - ${inv.clientName}`,
    amount: inv.total,
    date: new Date(inv.timestamp).toLocaleDateString('es-DO'),
  }));
  
  // Calculate growth (simplified - comparing to previous period)
  const crecimiento = invoices.length > 0 ? 0 : 0;

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
          title="MACAO MEMORIES - Finanzas" 
          mobileTitle="Finanzas"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <Sidebar  />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {/* Header */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <h1 className="text-2xl font-title text-white">Resumen Financiero</h1>
            
            <div className="flex gap-3">
              <GlassCard className="flex items-center gap-2 px-4 py-2" hover={false}>
                <Calendar className="w-4 h-4 text-white/60" />
                <select 
                  className="bg-transparent text-white font-medium focus:outline-none"
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                >
                  <option value="semana">Esta Semana</option>
                  <option value="mes">Este Mes</option>
                  <option value="trimestre">Trimestre</option>
                  <option value="año">Este Año</option>
                </select>
              </GlassCard>
              
              <GlassButton variant="secondary" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exportar
              </GlassButton>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-5" hover={false}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Total Ventas</p>
                  <p className="text-3xl font-bold text-white">US$ {totalVentas.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 rounded-2xl bg-green-500/20">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-green-400 text-sm">
                <ArrowUpRight className="w-4 h-4" />
                <span>{facturasCount} facturas</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Comisiones</p>
                  <p className="text-3xl font-bold text-white">US$ {totalComisiones.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 rounded-2xl bg-blue-500/20">
                  <Wallet className="w-6 h-6 text-blue-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-blue-400 text-sm">
                <span>10% del total de ventas</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Ticket Promedio</p>
                  <p className="text-3xl font-bold text-white">US$ {ticketPromedio.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-500/20">
                  <CreditCard className="w-6 h-6 text-amber-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-amber-400 text-sm">
                <span>Por factura</span>
              </div>
            </GlassCard>

            <GlassCard className="p-5" hover={false}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white/60 text-sm mb-1">Facturas Emitidas</p>
                  <p className="text-3xl font-bold text-white">{facturasCount}</p>
                </div>
                <div className="p-3 rounded-2xl bg-purple-500/20">
                  <PieChart className="w-6 h-6 text-purple-400" />
                </div>
              </div>
              <div className="flex items-center gap-1 mt-3 text-purple-400 text-sm">
                <span>Total en período</span>
              </div>
            </GlassCard>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Chart */}
            <GlassCard className="xl:col-span-2 p-6" hover={false}>
              <h3 className="text-lg font-medium text-white mb-6">Ventas vs Comisiones</h3>
              
              <div className="h-64 flex items-end gap-2">
                {monthlyData.map((data, i) => {
                  const maxVentas = Math.max(...monthlyData.map(d => d.ventas), 1);
                  const maxComisiones = Math.max(...monthlyData.map(d => d.comisiones), 1);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div className="w-full flex gap-1 h-48 items-end">
                        <motion.div
                          className="flex-1 bg-gradient-to-t from-red-500/80 to-red-400/60 rounded-t-lg"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((data.ventas / maxVentas) * 100, data.ventas > 0 ? 5 : 0)}%` }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                        <motion.div
                          className="flex-1 bg-gradient-to-t from-blue-500/80 to-blue-400/60 rounded-t-lg"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max((data.comisiones / maxComisiones) * 100, data.comisiones > 0 ? 5 : 0)}%` }}
                          transition={{ delay: i * 0.1 + 0.2, duration: 0.5 }}
                        />
                      </div>
                      <span className="text-white/60 text-xs">{data.month}</span>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-white/70 text-sm">Ventas</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-white/70 text-sm">Comisiones</span>
                </div>
              </div>
            </GlassCard>

            {/* Recent transactions */}
            <GlassCard className="p-6" hover={false}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Últimas Transacciones</h3>
                <Filter className="w-4 h-4 text-white/60" />
              </div>

              <div className="space-y-3">
                {recentTransactions.length === 0 ? (
                  <div className="text-center py-8 text-white/50">
                    No hay transacciones registradas
                  </div>
                ) : (
                  recentTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-xl bg-black/20">
                      <div className={`p-2 rounded-xl ${tx.amount > 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        {tx.amount > 0 ? (
                          <ArrowUpRight className="w-4 h-4 text-green-400" />
                        ) : (
                          <ArrowDownRight className="w-4 h-4 text-red-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm truncate">{tx.description}</p>
                        <p className="text-white/50 text-xs">{tx.date}</p>
                      </div>
                      <p className={`font-medium ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}US$ {Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <GlassButton variant="secondary" className="w-full mt-4">
                Ver Todas
              </GlassButton>
            </GlassCard>
          </div>
        </main>
      </div>

      {/* Bottom navigation */}
      <BottomNav  />
    </div>
  );
}
