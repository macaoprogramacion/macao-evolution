"use client"

import { useState } from "react"
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

// Webs disponibles (sin Viator ni GetYourGuide)
const websites = [
  { value: "macaooffroad", label: "Macao Off Road", url: "macaooffroad.com", color: "#dc2626" },
  { value: "caribebuggy", label: "Caribe Buggy", url: "caribebuggy.com", color: "#3b82f6" },
  { value: "saonaisland", label: "Saona Island", url: "saonaislandpuntacana.com", color: "#10b981" },
]

interface Product {
  id: number
  name: string
  website: string
  websiteLabel: string
  websiteColor: string
  price: number
  originalPrice: number | null
  hasDiscount: boolean
  discountPercent: number
  description: string
  image: string
  active: boolean
  category: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      name: "Elite Couple",
      website: "macaooffroad",
      websiteLabel: "Macao Off Road",
      websiteColor: "#dc2626",
      price: 160,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      description: "Experiencia exclusiva para parejas en buggies de alta gama",
      image: "/tours/elite-couple.jpg",
      active: true,
      category: "Elite",
    },
    {
      id: 2,
      name: "Elite Family",
      website: "macaooffroad",
      websiteLabel: "Macao Off Road",
      websiteColor: "#dc2626",
      price: 200,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      description: "Aventura familiar premium con espacio para toda la familia",
      image: "/tours/elite-family.jpg",
      active: true,
      category: "Elite",
    },
    {
      id: 3,
      name: "Apex Predator",
      website: "caribebuggy",
      websiteLabel: "Caribe Buggy",
      websiteColor: "#3b82f6",
      price: 130,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      description: "Tour extremo para los amantes de la adrenalina",
      image: "/tours/apex-predator.jpg",
      active: true,
      category: "Adventure",
    },
    {
      id: 4,
      name: "Predator Family",
      website: "caribebuggy",
      websiteLabel: "Caribe Buggy",
      websiteColor: "#3b82f6",
      price: 145,
      originalPrice: null,
      hasDiscount: false,
      discountPercent: 0,
      description: "Aventura familiar en buggy todo terreno",
      image: "/tours/predator-family.jpg",
      active: true,
      category: "Adventure",
    },
    {
      id: 5,
      name: "Flintstone Era",
      website: "saonaisland",
      websiteLabel: "Saona Island",
      websiteColor: "#10b981",
      price: 85,
      originalPrice: 100,
      hasDiscount: true,
      discountPercent: 15,
      description: "Viaje en el tiempo con caballos y naturaleza",
      image: "/tours/flintstone-era.jpg",
      active: true,
      category: "Nature",
    },
    {
      id: 6,
      name: "Flintstone Family",
      website: "saonaisland",
      websiteLabel: "Saona Island",
      websiteColor: "#10b981",
      price: 100,
      originalPrice: 125,
      hasDiscount: true,
      discountPercent: 20,
      description: "Experiencia natural para toda la familia",
      image: "/tours/flintstone-family.jpg",
      active: true,
      category: "Nature",
    },
    {
      id: 7,
      name: "ATV QUAD",
      website: "macaooffroad",
      websiteLabel: "Macao Off Road",
      websiteColor: "#dc2626",
      price: 90,
      originalPrice: 110,
      hasDiscount: true,
      discountPercent: 18,
      description: "Adrenalina pura en cuatrimoto individual",
      image: "/tours/atv-quad.jpg",
      active: true,
      category: "ATV",
    },
    {
      id: 8,
      name: "THE COMBINED",
      website: "caribebuggy",
      websiteLabel: "Caribe Buggy",
      websiteColor: "#3b82f6",
      price: 90,
      originalPrice: 110,
      hasDiscount: true,
      discountPercent: 18,
      description: "Combinación perfecta de aventuras múltiples",
      image: "/tours/the-combined.jpg",
      active: true,
      category: "Combo",
    },
  ])

  const [searchQuery, setSearchQuery] = useState("")
  const [websiteFilter, setWebsiteFilter] = useState("all")
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    price: 0,
    originalPrice: 0,
    hasDiscount: false,
    description: "",
    image: "",
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
      active: product.active,
      category: product.category,
    })
    setIsEditDialogOpen(true)
  }

  const handleSaveProduct = () => {
    if (!editingProduct) return

    const websiteData = websites.find((w) => w.value === formData.website)
    const discountPercent = formData.hasDiscount && formData.originalPrice > 0
      ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
      : 0

    setProducts(
      products.map((product) =>
        product.id === editingProduct.id
          ? {
              ...product,
              name: formData.name,
              website: formData.website,
              websiteLabel: websiteData?.label || "",
              websiteColor: websiteData?.color || "",
              price: formData.price,
              originalPrice: formData.hasDiscount ? formData.originalPrice : null,
              hasDiscount: formData.hasDiscount,
              discountPercent: discountPercent,
              description: formData.description,
              image: formData.image,
              active: formData.active,
              category: formData.category,
            }
          : product
      )
    )

    setIsEditDialogOpen(false)
    setEditingProduct(null)
  }

  const handleDeleteProduct = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar este producto?")) {
      setProducts(products.filter((product) => product.id !== id))
    }
  }

  const handleToggleActive = (id: number) => {
    setProducts(
      products.map((product) =>
        product.id === id ? { ...product, active: !product.active } : product
      )
    )
  }

  const stats = {
    total: products.length,
    active: products.filter((p) => p.active).length,
    withDiscount: products.filter((p) => p.hasDiscount).length,
    totalRevenue: products.reduce((sum, p) => sum + p.price, 0),
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-title text-gray-900">Gestion de Productos</h1>
            <p className="text-gray-600 mt-1">
              Administra precios, ofertas y fotos de tus experiencias
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-gray-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Productos</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
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
                  <p className="text-sm text-gray-600">Activos</p>
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
                  <p className="text-sm text-gray-600">Con Oferta</p>
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
                  <p className="text-sm text-gray-600">Valor Total</p>
                  <p className="text-2xl font-bold text-gray-900">${stats.totalRevenue}</p>
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
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 line-clamp-1">{product.description}</div>
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
                          <span className="text-lg font-semibold text-gray-900">${product.price}</span>
                          {product.hasDiscount && product.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">${product.originalPrice}</span>
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
                          <span className="text-sm text-gray-600">
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-2">
                  <Search className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">No se encontraron productos</p>
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

              <div className="space-y-2">
                <Label htmlFor="edit-category">Categoría</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-gray-900">Precios</h3>
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

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label htmlFor="has-discount" className="font-medium">
                      Activar Oferta
                    </Label>
                    <p className="text-sm text-gray-600">
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
                <h3 className="font-semibold text-gray-900">Imagen Principal</h3>
                <div className="space-y-2">
                  <Label htmlFor="edit-image">URL de la Imagen</Label>
                  <Input
                    id="edit-image"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    placeholder="/tours/product-name.jpg"
                  />
                </div>
                <Button variant="outline" className="w-full">
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Nueva Imagen
                </Button>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
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
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
