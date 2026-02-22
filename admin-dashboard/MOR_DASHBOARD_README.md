# MOR Dashboard - Sistema de Gestión de Tours

## 🎯 Descripción

MOR Dashboard es un sistema administrativo completo para la gestión de ventas de experiencias de tours (Buggies y Caballos). Este dashboard proporciona análisis en tiempo real, gestión de clientes y seguimiento de ventas.

## 🚀 Tours Disponibles

### Elite Tours
- **Elite Couple Experience**: $160 USD
- **Elite Family Experience**: $200 USD

### Predator Tours
- **Apex Predator**: $130 USD
- **Predator Family Experience**: $145 USD

### Flintstone Tours (Con Descuento)
- **Flintstone Era**: ~~$100~~ **$85 USD** (15% OFF)
- **The Flintstone Family**: ~~$125~~ **$100 USD** (20% OFF)

### ATV Tours (Con Descuento)
- **ATV QUAD EXPERIENCE**: ~~$110~~ **$90 USD** (18% OFF)
- **THE COMBINED**: ~~$110~~ **$90 USD** (18% OFF)

## 📊 Características Principales

### Dashboard Principal (/)
- **Métricas en Tiempo Real**:
  - Ventas Totales
  - Nuevos Clientes
  - Tráfico Web
  - Dispositivos Activos

- **Análisis de Ventas**:
  - Gráficos de ventas (Diario/Semanal/Mensual)
  - Comparación de ventas vs visitas
  - Tendencias y análisis de rendimiento

- **Gestión de Ventas Recientes**:
  - ID de Orden
  - Cliente
  - Tour adquirido
  - Monto
  - Estado (Completado/Pendiente)
  - Hora de transacción

- **Base de Datos de Clientes**:
  - Nombre completo
  - Email
  - Teléfono
  - Tours reservados
  - Hora de registro

- **Tours Más Vendidos**:
  - Ranking de experiencias más populares
  - Porcentaje de ventas
  - Ingresos por tour

- **Catálogo Completo**:
  - Lista de todos los tours
  - Precios regulares y con descuento
  - Porcentaje de descuento

- **Estadísticas en Vivo**:
  - Visitantes hoy
  - Dispositivos activos en tiempo real
  - Ventas del día

### Página de Analytics (/analytics)
- **Análisis Detallado por Período**:
  - Vista Diaria
  - Vista Semanal
  - Vista Mensual

- **KPIs Principales**:
  - Ingresos Totales
  - Tasa de Conversión
  - Valor Promedio por Pedido
  - Visitantes Únicos

- **Gráficos Interactivos**:
  - Rendimiento de Ventas
  - Tráfico de Visitas
  - Ingresos
  - Conversiones

- **Distribución de Tours**:
  - Elite Tours (35%)
  - Predator Tours (28%)
  - Flintstone Tours (22%)
  - ATV Tours (15%)

- **Análisis de Dispositivos**:
  - Móvil (58%)
  - Desktop (32%)
  - Tablet (10%)

- **Fuentes de Tráfico**:
  - Google
  - Redes Sociales
  - Directo
  - Referencias

- **Páginas Más Visitadas**:
  - Tours con mejor rendimiento
  - Tasas de conversión por página
  - Visitas y conversiones

- **Rendimiento por Hora**:
  - Análisis de actividad durante el día
  - Horas pico de ventas
  - Patrones de comportamiento

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 15.2.6
- **UI**: React 19 + Tailwind CSS
- **Gráficos**: Recharts
- **Iconos**: Lucide React
- **Componentes**: Radix UI
- **TypeScript**: Para type safety

## 🎨 Características de Diseño

- **Tema de Colores**: Naranja/Rojo (#f97316 - #fb923c)
- **Diseño Responsivo**: Adaptado a todos los dispositivos
- **Interfaz Intuitiva**: Fácil navegación y uso
- **Tiempo Real**: Indicadores visuales de actividad en vivo
- **Exportación de Datos**: Capacidad de exportar reportes

## 📱 Páginas Disponibles

1. **Overview** (`/`) - Dashboard principal con métricas generales
2. **Workflows** (`/workflows`) - [Por configurar]
3. **Analytics** (`/analytics`) - Análisis detallado de ventas y tráfico
4. **Templates** (`/templates`) - [Por configurar]
5. **Team** (`/team`) - [Por configurar]
6. **Settings** (`/settings`) - [Por configurar]

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Compilar para producción
npm run build

# Ejecutar en producción
npm start
```

El dashboard estará disponible en `http://localhost:3000`

## 📝 Notas de Implementación

- Los datos mostrados actualmente son de ejemplo/mock
- Para producción, conectar con APIs reales de:
  - Sistema de ventas
  - Google Analytics
  - Base de datos de clientes
  - Sistema de reservas

## 🔐 Seguridad

- Implementar autenticación antes de producción
- Configurar roles y permisos de usuario
- Proteger rutas administrativas
- Validar datos de entrada

## 📊 Próximos Pasos

1. Integrar con base de datos real
2. Implementar sistema de autenticación
3. Conectar con pasarela de pagos
4. Agregar notificaciones en tiempo real
5. Implementar sistema de reportes PDF
6. Agregar calendario de reservas
7. Sistema de gestión de inventario de tours

## 👥 Contacto y Soporte

Este dashboard ha sido diseñado específicamente para MOR Tours.

---

**Versión**: 1.0.0  
**Última actualización**: Febrero 2026
