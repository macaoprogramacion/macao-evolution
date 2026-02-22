import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Phone, 
  User, 
  Upload,
  Filter,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  X,
  Check,
  Plus,
  FileText
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import BottomNav from '../components/BottomNav';
import { GlassCard, GlassButton, GlassInput } from '../components/ui';
import { usePortfolio } from '../context/PortfolioContext';

// Background image
import bgFtg from '../assets/branding/photos/bg-4k-ftg.png';

const statusColors = {
  'Vendido': 'bg-green-500/80',
  'Descargado': 'bg-blue-500/80',
  'Pendiente': 'bg-amber-500/80',
};

// Client View Modal Component
function ClientViewModal({ client, onClose, photos, onDeletePhoto, onUploadPhotos, onEditClient, onDeleteClient }) {
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    clientName: client.clientName,
    phone: client.phone,
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

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-4xl h-[85vh]"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <GlassCard className="h-full flex flex-col p-0 overflow-hidden" hover={false}>
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30">
                  <img src={client.image} alt={client.clientName} className="w-full h-full object-cover" />
                </div>
                <div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editForm.clientName}
                        onChange={(e) => setEditForm(prev => ({ ...prev, clientName: e.target.value }))}
                        className="px-3 py-1 bg-black/30 rounded-lg border border-white/20 text-white text-lg font-medium"
                      />
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="px-3 py-1 bg-black/30 rounded-lg border border-white/20 text-white/70 text-sm block"
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-xl font-title text-white">{client.clientName}</h2>
                      <p className="text-white/70">{client.phone}</p>
                      {client.remainingDays !== undefined && (
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          client.expired ? 'text-red-400' : 
                          client.expiringSoon ? 'text-amber-400' : 'text-white/50'
                        }`}>
                          <Clock className="w-3 h-3" />
                          {client.expired ? 'Expirado' : `${client.remainingDays} días restantes`}
                        </div>
                      )}
                    </>
                  )}
                </div>
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
                  ¿Eliminar Cliente?
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

export default function ClientesPage() {
  const { 
    getAllPortfoliosWithExpiration, 
    clientPhotos, 
    addPortfolio, 
    deletePortfolio, 
    updatePortfolio, 
    addPhotosToPortfolio, 
    deletePhotosFromPortfolio,
    PORTFOLIO_DURATION_DAYS 
  } = usePortfolio();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
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

  // Get all portfolios with expiration info
  const portfolios = getAllPortfoliosWithExpiration();

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

  // Calculate stats
  const totalPortfolios = portfolios.length;
  const expiringCount = portfolios.filter(p => p.expiringSoon).length;
  const pendingCount = portfolios.filter(p => p.status === 'Pendiente').length;
  const soldCount = portfolios.filter(p => p.status === 'Vendido').length;

  return (
    <div className="min-h-screen flex flex-col relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgFtg})`,
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
          title="MACAO MEMORIES - Clientes" 
          mobileTitle="Clientes"
        />
      </div>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <Sidebar />

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6 overflow-auto">
          {/* Header */}
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

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-white">{totalPortfolios}</p>
              <p className="text-white/60 text-sm">Total Clientes</p>
            </GlassCard>
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-amber-400">{pendingCount}</p>
              <p className="text-white/60 text-sm">Pendientes</p>
            </GlassCard>
            <GlassCard className="p-4 text-center" hover={false}>
              <p className="text-3xl font-bold text-green-400">{soldCount}</p>
              <p className="text-white/60 text-sm">Vendidos</p>
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
                <p className="text-white/70 text-sm">Los portafolios tienen una vigencia de {PORTFOLIO_DURATION_DAYS} días. Contacta a los clientes pendientes.</p>
              </div>
            </motion.div>
          )}

          {/* Clients/Portfolios grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredPortfolios.map((portfolio, index) => (
              <motion.div
                key={portfolio.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard 
                  className={`p-4 ${
                    portfolio.expired ? 'border-2 border-gray-500/50' :
                    portfolio.expiringSoon ? 'border-2 border-red-500/50 animate-pulse' : ''
                  }`} 
                  hover={true}
                >
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-white/30">
                        <img 
                          src={portfolio.image} 
                          alt={portfolio.clientName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Expiring soon indicator */}
                      {portfolio.expiringSoon && (
                        <div className="absolute -top-1 -right-1 bg-red-500 rounded-full p-1">
                          <AlertTriangle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-white font-medium truncate">{portfolio.clientName}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-0.5 rounded-full text-xs text-white ${statusColors[portfolio.status]}`}>
                              {portfolio.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Phone className="w-3 h-3" />
                          <span>{portfolio.phone}</span>
                        </div>
                        <div className="flex items-center gap-2 text-white/70 text-sm">
                          <Calendar className="w-3 h-3" />
                          <span>{portfolio.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expiration info */}
                  <div className={`mt-3 p-2 rounded-xl ${
                    portfolio.expired ? 'bg-gray-500/20' :
                    portfolio.expiringSoon ? 'bg-red-500/20' : 'bg-white/5'
                  } flex items-center justify-between`}>
                    <div className="flex items-center gap-2">
                      <Clock className={`w-4 h-4 ${
                        portfolio.expired ? 'text-gray-400' :
                        portfolio.expiringSoon ? 'text-red-400' : 'text-white/60'
                      }`} />
                      <span className={`text-sm ${
                        portfolio.expired ? 'text-gray-400' :
                        portfolio.expiringSoon ? 'text-red-400 font-medium' : 'text-white/70'
                      }`}>
                        {portfolio.expired 
                          ? 'Expirado' 
                          : `${portfolio.remainingDays} días restantes`
                        }
                      </span>
                    </div>
                    {portfolio.expiringSoon && (
                      <span className="text-xs text-red-400 font-medium">¡Urgente!</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <GlassButton 
                      variant="primary" 
                      className="flex-1 py-2 text-sm"
                      onClick={() => setSelectedClient(portfolio)}
                    >
                      <Eye className="w-4 h-4 mr-1" /> Ver
                    </GlassButton>
                    <motion.button
                      className="p-2 rounded-xl bg-black/30 hover:bg-black/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => window.open(`tel:${portfolio.phone}`)}
                    >
                      <Phone className="w-4 h-4 text-green-400" />
                    </motion.button>
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
              <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg">No se encontraron clientes</p>
            </div>
          )}
        </main>
      </div>

      {/* Client View Modal */}
      <AnimatePresence>
        {selectedClient && (
          <ClientViewModal
            client={selectedClient}
            photos={clientPhotos[selectedClient.id] || []}
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
          />
        )}
      </AnimatePresence>

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

                {/* Info about duration */}
                <div className="flex items-center gap-2 text-white/50 text-xs">
                  <Clock className="w-4 h-4" />
                  <span>El portafolio estará activo por {PORTFOLIO_DURATION_DAYS} días</span>
                </div>

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
      <BottomNav />
    </div>
  );
}
