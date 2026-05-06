"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Image as ImageIcon,
  DollarSign,
  Percent,
  Save,
  X,
  Upload,
  Globe,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DashboardLayout } from "@/components/admin/dashboard-layout"
import { supabase } from "@/lib/supabase"
import { products as fallbackProducts } from "@/lib/products"

// Webs disponibles (sin Viator ni GetYourGuide)
const websites = [
  { value: "macaooffroad", label: "Macao Off Road", url: "www.jonathanarache.com", color: "#dc2626" },
  { value: "caribebuggy", label: "Caribe Buggy", url: "caribebuggy.com", color: "#3b82f6" },
  { value: "saonaisland", label: "Saona Island", url: "saonaislandpuntacana.com", color: "#10b981" },
]

interface Product {
  id: string
  name: string
  slug: string
  website: string
  websiteLabel: string
  websiteColor: string
  price: number
  originalPrice: number | null
  hasDiscount: boolean
  discountPercent: number
  description: string
  image: string
  gallery: string[]
  highlights: string[]
  itinerary: { title: string; duration: string; description: string; details?: string[] }[]
  generalInfo: {
    minAge?: string
    notAllowed?: string
    freeCancellation?: string
    bookNowPayLater?: string
    duration?: string
    guide?: string
    pickupService?: string
  }
  duration: string
  capacity: string
  active: boolean
  category: string
}

function mapRowToAdminProduct(row: any): Product {
  return {
    id: row.id,
    name: row.title,
    slug: row.slug,
    website: row.website || "",
    websiteLabel: row.website_label || "",
    websiteColor: row.website_color || "",
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : null,
    hasDiscount: row.has_discount || false,
    discountPercent: row.discount_percent ? Number(row.discount_percent) : 0,
    description: row.description || "",
    image: row.image || "",
    gallery: Array.isArray(row.gallery) ? row.gallery : [],
    highlights: Array.isArray(row.highlights) ? row.highlights : [],
    itinerary: Array.isArray(row.itinerary) ? row.itinerary : [],
    generalInfo: row.general_info || {},
    duration: row.duration || "",
    capacity: row.capacity || "",
    active: row.active,
    category: row.category || "",
  }
}

function normalizeImageSrc(image: string): string {
  if (!image) return ""
  return encodeURI(image.trim())
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [syncingMissing, setSyncingMissing] = useState(false)
  const [uploadingMain, setUploadingMain] = useState(false)
  const [uploadingGallery, setUploadingGallery] = useState(false)

  const mainImageInputRef = useRef<HTMLInputElement | null>(null)
  const galleryImagesInputRef = useRef<HTMLInputElement | null>(null)

  const [searchQuery, setSearchQuery] = useState("")
  const [websiteFilter, setWebsiteFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Fetch products from Supabase
  const loadProducts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error loading products:", error)
    } else if (data) {
      setProducts(data.map(mapRowToAdminProduct))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    price: 0,
    originalPrice: 0,
    hasDiscount: false,
    description: "",
    image: "",
    galleryText: "",
    highlightsText: "",
    itineraryJson: "[]",
    generalInfoJson: "{}",
    duration: "",
    capacity: "",
    active: true,
    category: "",
  })

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesWebsite = websiteFilter === "all" || product.website === websiteFilter
    return matchesSearch && matchesWebsite
  })

  const openEditDialog = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name,
      website: product.website,
      price: product.price,
      originalPrice: product.originalPrice || 0,
      hasDiscount: product.hasDiscount,
      description: product.description,
      image: product.image,
      galleryText: product.gallery.join("\n"),
      highlightsText: product.highlights.join("\n"),
      itineraryJson: JSON.stringify(product.itinerary || [], null, 2),
      generalInfoJson: JSON.stringify(product.generalInfo || {}, null, 2),
      duration: product.duration || "",
      capacity: product.capacity || "",
      active: product.active,
      category: product.category,
    })
    setIsEditDialogOpen(true)
  }

  const uploadToProductMediaBucket = useCallback(
    async (file: File, kind: "main" | "gallery") => {
      if (!editingProduct) return null

      const sanitizedName = file.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9._-]/g, "")

      const path = `products/${editingProduct.slug}/${Date.now()}-${kind}-${sanitizedName}`

      const { error: uploadError } = await supabase.storage
        .from("portfolio-media")
        .upload(path, file, { upsert: false, cacheControl: "3600" })

      if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("portfolio-media").getPublicUrl(path)
      return data.publicUrl
    },
    [editingProduct]
  )

  const handleMainImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadingMain(true)
    try {
      const publicUrl = await uploadToProductMediaBucket(file, "main")
      if (publicUrl) {
        setFormData((prev) => ({ ...prev, image: publicUrl }))
      }
    } catch (error: any) {
      alert("Error subiendo imagen principal: " + (error?.message || "Error desconocido"))
    } finally {
      setUploadingMain(false)
      event.target.value = ""
    }
  }

  const handleGalleryImagesUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploadingGallery(true)
    try {
      const uploadTasks = Array.from(files).map((file) => uploadToProductMediaBucket(file, "gallery"))
      const urls = (await Promise.all(uploadTasks)).filter(Boolean) as string[]

      if (urls.length > 0) {
        setFormData((prev) => {
          const existing = prev.galleryText
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean)
          return { ...prev, galleryText: [...existing, ...urls].join("\n") }
        })
      }
    } catch (error: any) {
      alert("Error subiendo imágenes de galería: " + (error?.message || "Error desconocido"))
    } finally {
      setUploadingGallery(false)
      event.target.value = ""
    }
  }

  const handleSaveProduct = async () => {
    if (!editingProduct) return
    setSaving(true)

    const websiteData = websites.find((w) => w.value === formData.website)
    const discountPercent = formData.hasDiscount && formData.originalPrice > 0
      ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
      : 0

    const gallery = formData.galleryText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    const highlights = formData.highlightsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)

    let itinerary: Product["itinerary"] = []
    let generalInfo: Product["generalInfo"] = {}

    try {
      itinerary = JSON.parse(formData.itineraryJson || "[]")
      generalInfo = JSON.parse(formData.generalInfoJson || "{}")
    } catch {
      alert("Itinerario o Información General tienen JSON inválido.")
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from("products")
      .update({
        title: formData.name,
        description: formData.description,
        capacity: formData.capacity,
        duration: formData.duration,
        price: formData.price,
        original_price: formData.hasDiscount ? formData.originalPrice : null,
        has_discount: formData.hasDiscount,
        discount_percent: discountPercent,
        image: formData.image,
        gallery,
        highlights,
        itinerary,
        general_info: generalInfo,
        active: formData.active,
        category: formData.category,
        website: formData.website,
        website_label: websiteData?.label || "",
        website_color: websiteData?.color || "",
      })
      .eq("id", editingProduct.id)

    if (error) {
      console.error("Error updating product:", error)
      alert("Error al guardar: " + error.message)
    } else {
      await loadProducts()
    }

    setSaving(false)
    setIsEditDialogOpen(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este producto?")) return

    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) {
      console.error("Error deleting product:", error)
      alert("Error al eliminar: " + error.message)
    } else {
      await loadProducts()
    }
  }

  const handleToggleActive = async (id: string) => {
    const product = products.find((p) => p.id === id)
    if (!product) return

    const { error } = await supabase
      .from("products")
      .update({ active: !product.active })
      .eq("id", id)

    if (error) {
      console.error("Error toggling active:", error)
    } else {
      await loadProducts()
    }
  }

  const stats = {
    total: products.length,
    active: products.filter((p) => p.active).length,
    withDiscount: products.filter((p) => p.hasDiscount).length,
    totalRevenue: products.reduce((sum, p) => sum + p.price, 0),
  }

  const missingFallbackProducts = fallbackProducts.filter(
    (fallbackProduct) => !products.some((product) => product.slug === fallbackProduct.slug)
  )

  const handleSyncMissingProducts = async () => {
    if (missingFallbackProducts.length === 0) return

    setSyncingMissing(true)

    const rows = missingFallbackProducts.map((product) => {
      const websiteData = websites.find((website) => website.value === product.website)

      return {
        slug: product.slug,
        title: product.title,
        description: product.description,
        capacity: product.capacity,
        image: product.image,
        price: product.price,
        original_price: product.originalPrice ?? null,
        has_discount: product.hasDiscount ?? false,
        discount_percent: product.discountPercent ?? 0,
        duration: product.duration,
        highlights: product.highlights,
        gallery: product.gallery,
        itinerary: product.itinerary,
        general_info: product.generalInfo,
        category: product.category || "",
        website: product.website || "",
        website_label: product.websiteLabel || websiteData?.label || "",
        website_color: product.websiteColor || websiteData?.color || "",
        active: product.active ?? true,
      }
    })

    const { error } = await supabase.from("products").insert(rows)

    if (error) {
      console.error("Error syncing missing products:", error)
      alert("Error importando productos faltantes: " + error.message)
    } else {
      await loadProducts()
      alert(`Se importaron ${rows.length} productos faltantes.`)
    }

    setSyncingMissing(false)
  }

  return (
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl md:text-3xl font-title whitespace-nowrap text-gray-900 dark:text-gray-100">Gestion de Productos</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
              Administra precios, ofertas y fotos de tus experiencias
            </p>
          </div>
          {missingFallbackProducts.length > 0 && (
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleSyncMissingProducts}
              disabled={syncingMissing}
            >
              {syncingMissing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {syncingMissing
                ? "Importando productos..."
                : `Importar ${missingFallbackProducts.length} productos faltantes`}
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.active}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Con Oferta</p>
                  <p className="text-2xl font-bold text-red-600">{stats.withDiscount}</p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <Percent className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">${stats.totalRevenue}</p>
                </div>
                <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-gray-800" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar producto..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <Select value={websiteFilter} onValueChange={setWebsiteFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sitio web" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los sitios</SelectItem>
                  {websites.map((website) => (
                    <SelectItem key={website.value} value={website.value}>
                      {website.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card className="border-gray-200">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Productos</CardTitle>
                <CardDescription>
                  Mostrando {filteredProducts.length} de {products.length} productos
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                <span className="ml-3 text-gray-500">Cargando productos...</span>
              </div>
            ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Sitio Web</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Precio</TableHead>
                    <TableHead>Oferta</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border border-gray-200">
                            {product.image ? (
                              <img
                                src={normalizeImageSrc(product.image)}
                                alt={product.name}
                                className="w-full h-full object-cover"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none"
                                  const fallback = event.currentTarget.nextElementSibling as HTMLElement | null
                                  if (fallback) {
                                    fallback.style.display = "flex"
                                  }
                                }}
                              />
                            ) : null}
                            <div
                              className="w-full h-full items-center justify-center"
                              style={{ display: product.image ? "none" : "flex" }}
                            >
                              <ImageIcon className="w-6 h-6 text-gray-400" />
                            </div>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-gray-100">{product.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">{product.description}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          style={{
                            backgroundColor: `${product.websiteColor}20`,
                            color: product.websiteColor,
                          }}
                        >
                          <Globe className="w-3 h-3 mr-1" />
                          {product.websiteLabel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">${product.price}</span>
                          {product.hasDiscount && product.originalPrice && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 line-through">${product.originalPrice}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.hasDiscount ? (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                            <Percent className="w-3 h-3 mr-1" />
                            {product.discountPercent}% OFF
                          </Badge>
                        ) : (
                          <span className="text-sm text-gray-500">Sin oferta</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={product.active}
                            onCheckedChange={() => handleToggleActive(product.id)}
                          />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {product.active ? "Activo" : "Inactivo"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEditDialog(product)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            )}

            {filteredProducts.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600 dark:text-gray-400">No se encontraron productos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Product Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Editar Producto</DialogTitle>
              <DialogDescription>
                Actualiza la información del producto, precios y ofertas
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Nombre del Producto</Label>
                  <Input
                    id="edit-name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-website">Sitio Web</Label>
                  <Select
                    value={formData.website}
                    onValueChange={(value) => setFormData({ ...formData, website: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {websites.map((website) => (
                        <SelectItem key={website.value} value={website.value}>
                          {website.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descripción</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-capacity">Capacidad</Label>
                  <Input
                    id="edit-capacity"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                    placeholder="1 person"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-duration">Duración</Label>
                  <Input
                    id="edit-duration"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="4 hours"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Precios</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-price">Precio Actual ($)</Label>
                    <Input
                      id="edit-price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-original-price">Precio Original ($)</Label>
                    <Input
                      id="edit-original-price"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) =>
                        setFormData({ ...formData, originalPrice: Number(e.target.value) })
                      }
                      disabled={!formData.hasDiscount}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <Label htmlFor="has-discount" className="font-medium">
                      Activar Oferta
                    </Label>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Mostrar precio con descuento en el sitio web
                    </p>
                  </div>
                  <Switch
                    id="has-discount"
                    checked={formData.hasDiscount}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, hasDiscount: checked })
                    }
                  />
                </div>

                {formData.hasDiscount && formData.originalPrice > formData.price && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-red-800">
                      <Percent className="w-5 h-5" />
                      <span className="font-semibold">
                        Descuento:{" "}
                        {Math.round(
                          ((formData.originalPrice - formData.price) / formData.originalPrice) * 100
                        )}
                        % OFF
                      </span>
                    </div>
                    <p className="text-sm text-red-700 mt-1">
                      Ahorro: ${formData.originalPrice - formData.price}
                    </p>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">Imagen Principal</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">URL de la Imagen</Label>
                  <Input
                    id="edit-image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/tours/product-name.jpg"
                  />
                </div>
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => mainImageInputRef.current?.click()}
                  disabled={uploadingMain || saving}
                >
                  {uploadingMain ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingMain ? "Subiendo imagen principal..." : "Subir Imagen Principal al Bucket"}
                </Button>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Galería e Información</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-gallery">Galería (1 URL por línea)</Label>
                  <Textarea
                    id="edit-gallery"
                    value={formData.galleryText}
                    onChange={(e) => setFormData({ ...formData, galleryText: e.target.value })}
                    rows={5}
                    placeholder="https://.../img-1.webp"
                  />
                </div>

                <input
                  ref={galleryImagesInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryImagesUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => galleryImagesInputRef.current?.click()}
                  disabled={uploadingGallery || saving}
                >
                  {uploadingGallery ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 mr-2" />
                  )}
                  {uploadingGallery ? "Subiendo galería..." : "Subir Imágenes de Galería al Bucket"}
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="edit-highlights">Highlights (1 item por línea)</Label>
                  <Textarea
                    id="edit-highlights"
                    value={formData.highlightsText}
                    onChange={(e) => setFormData({ ...formData, highlightsText: e.target.value })}
                    rows={4}
                    placeholder="Complete horseback riding experience"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-itinerary">Itinerary (JSON)</Label>
                  <Textarea
                    id="edit-itinerary"
                    value={formData.itineraryJson}
                    onChange={(e) => setFormData({ ...formData, itineraryJson: e.target.value })}
                    rows={8}
                    placeholder='[{"title":"Pick-Up","duration":"30 mins","description":"..."}]'
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-general-info">Información General (JSON)</Label>
                  <Textarea
                    id="edit-general-info"
                    value={formData.generalInfoJson}
                    onChange={(e) => setFormData({ ...formData, generalInfoJson: e.target.value })}
                    rows={8}
                    placeholder='{"minAge":"...","notAllowed":"..."}'
                  />
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <Label htmlFor="edit-active" className="font-medium">
                      Producto Activo
                    </Label>
                    <p className="text-sm text-gray-600">
                      Mostrar producto en el sitio web
                    </p>
                  </div>
                  <Switch
                    id="edit-active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleSaveProduct}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                {saving ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
