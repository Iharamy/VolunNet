"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, MapPin, Calendar, Users, Filter, Grid, List, Star, Clock, Building2, AlertTriangle, Heart, Home, Bell, ArrowLeft } from "lucide-react"
import { getCurrentUser } from "@/app/auth/actions"
import Link from "next/link"
import { ApplicationStatusBadge } from "@/components/ui/application-status-badge"

// Funciones auxiliares
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  })
}

const getTimeUntilEvent = (dateString: string) => {
  const now = new Date()
  const eventDate = new Date(dateString)
  const diffTime = eventDate.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays < 0) return "Evento pasado"
  if (diffDays === 0) return "Hoy"
  if (diffDays === 1) return "Mañana"
  return `En ${diffDays} días`
}

const getAvailabilityStatus = (event: Event) => {
  if (event.currentVolunteers >= event.maxVolunteers) {
    return { text: "Completo", color: "bg-red-100 text-red-700" }
  }
  if (event.currentVolunteers >= event.maxVolunteers * 0.8) {
    return { text: "Casi completo", color: "bg-yellow-100 text-yellow-700" }
  }
  return { text: "Disponible", color: "bg-green-100 text-green-700" }
}

interface Event {
  id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  country: string
  startDate: string
  endDate: string
  maxVolunteers: number
  currentVolunteers: number
  skills: string[]
  requirements: string[]
  benefits: string[]
  imageUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  organization_name: string
  organization_verified: boolean
  category_name: string
  category_icon: string
  category_color: string
  alreadyRegistered?: boolean
  hasApplied?: boolean
  applicationStatus?: string
}

interface Filters {
  query: string
  city: string
  state: string
  category: string | "all"
  skills: string[]
  maxDistance: number
  onlyVerified: boolean
  onlyAvailable: boolean
}

export default function EventSearchPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    query: "",
    city: "",
    state: "",
    category: "all",
    skills: [],
    maxDistance: 50,
    onlyVerified: false,
    onlyAvailable: false
  })
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState("date")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  useEffect(() => {
    loadUser()
    fetchEvents()
  }, [])

  const loadUser = async () => {
    try {
      setUserLoading(true)
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    } catch (error) {
      setUser(null)
    } finally {
      setUserLoading(false)
    }
  }

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.query) params.append("query", filters.query)
      if (filters.city) params.append("city", filters.city)
      if (filters.state) params.append("state", filters.state)
      if (filters.category) params.append("category", filters.category)
      params.append("limit", "50")
      params.append("upcomingOnly", "true")

      const response = await fetch(`/api/eventos?${params.toString()}`)
      if (response.ok) {
        let data = await response.json()
        
        if (!Array.isArray(data)) {
          if (data && typeof data === 'object' && data.events && Array.isArray(data.events)) {
            data = data.events
          } else if (data && typeof data === 'object' && data.data && Array.isArray(data.data)) {
            data = data.data
          } else {
            setEvents([])
            return
          }
        }

        if (filters.onlyVerified) data = data.filter((event: Event) => event.organization_verified)
        if (filters.onlyAvailable) data = data.filter((event: Event) => event.currentVolunteers < event.maxVolunteers)
        if (filters.category && filters.category !== "all") data = data.filter((event: Event) => event.category_name === filters.category)
        if (filters.skills.length > 0) data = data.filter((event: Event) => filters.skills.some(skill => event.skills.includes(skill)))

        data.sort((a: Event, b: Event) => {
          switch (sortBy) {
            case "date": return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
            case "volunteers": return b.currentVolunteers - a.currentVolunteers
            case "title": return a.title.localeCompare(b.title)
            default: return 0
          }
        })

        const eventsWithApplicationStatus = await Promise.all(
          data.map(async (event: Event) => {
            try {
              const checkResponse = await fetch(`/api/events/apply?eventId=${event.id}`)
              if (checkResponse.ok) {
                const checkData = await checkResponse.json()
                return {
                  ...event,
                  hasApplied: checkData.hasApplied,
                  applicationStatus: checkData.application?.status
                }
              }
            } catch (error) {}
            return event
          })
        )
        
        setEvents(eventsWithApplicationStatus)
      }
    } catch (error) {
      console.error("Error fetching events:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async (event: Event) => {
    if (!user) {
      alert("Debes iniciar sesión para postularte a eventos")
      return
    }
    setSelectedEvent({ ...event, alreadyRegistered: false })
    setShowConfirmModal(true)
  }

  const confirmApplication = async () => {
    if (!selectedEvent) return

    try {
      const response = await fetch("/api/events/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id }),
      })

      const data = await response.json()

      if (response.ok) {
        setEvents(prev => prev.map(e =>
          e.id === selectedEvent.id
            ? { 
                ...e, 
                currentVolunteers: e.currentVolunteers + 1,
                hasApplied: true,
                applicationStatus: 'PENDING'
              }
            : e
        ))
        if (data.status === 'ACCEPTED') {
          alert("¡Felicidades! Has sido aceptado al evento")
        } else {
          alert("Postulación enviada exitosamente. Estás en lista de espera.")
        }
        setShowConfirmModal(false)
        setSelectedEvent(null)
      } else {
        if (response.status === 400 && data.error === "Ya te has postulado a este evento") {
          alert("Ya te has postulado a este evento anteriormente")
        } else {
          alert(data.error || "Error al postularse al evento")
        }
        setShowConfirmModal(false)
        setSelectedEvent(null)
      }
    } catch (error) {
      console.error("Error applying to event:", error)
      alert("Error al postularse al evento")
      setShowConfirmModal(false)
      setSelectedEvent(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Cargando eventos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-100/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
               <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Heart className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  VolunNet
                </span>
              </div>
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 transition flex items-center space-x-2">
                <Home className="h-4 w-4" />
                <span>Inicio</span>
              </Link>
              <Link href="/eventos/buscar" className="text-blue-600 font-medium flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Eventos</span>
              </Link>
              <Link href="/comunidad" className="text-gray-600 hover:text-blue-600 transition flex items-center space-x-2">
                <Users className="h-4 w-4" />
                <span>Comunidad</span>
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 bg-white/50 hover:bg-white/80 border-blue-200 md:hidden"
              >
                <Filter className="h-4 w-4" />
                <span>Filtros</span>
              </Button>

              <div className="flex items-center space-x-2 border border-blue-200 rounded-lg p-1 bg-white/50">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={viewMode === "grid" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-blue-600 text-white" : "text-gray-600 hover:text-blue-600"}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {userLoading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : user ? (
                <div className="flex items-center space-x-3">
                  <Link href="/notificaciones" className="relative p-2 text-gray-600 hover:text-blue-600 transition">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
                  </Link>
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {user.firstName?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                  </div>
                </div>
              ) : (
                <Link href="/login" className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition">
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm">
                    <Users className="h-4 w-4" />
                  </div>
                  <span className="hidden sm:block text-sm font-medium">Iniciar Sesión</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Buscar Eventos</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Encuentra oportunidades de voluntariado que se ajusten a tus intereses y habilidades
          </p>
        </div>

        {/* Barra de búsqueda */}
        <div className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-6 w-6" />
              <Input
                placeholder="Buscar eventos por título, descripción o habilidades..."
                value={filters.query}
                onChange={(e) => setFilters(prev => ({ ...prev, query: e.target.value }))}
                className="pl-12 pr-32 py-4 text-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-xl shadow-lg"
              />
              <Button 
                onClick={fetchEvents}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-semibold shadow-lg"
                size="sm"
              >
                Buscar
              </Button>
            </div>

            <div className="mt-4 text-center">
              <span className="text-gray-600 font-medium">{events.length} eventos encontrados</span>
            </div>
          </div>
        </div>

        {/* Layout principal */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar filtros */}
          <aside className={`lg:w-1/4 ${showFilters ? "block" : "hidden"} md:block`}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100/50 p-6 mb-6 lg:mb-0 sticky top-24"
            >
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    placeholder="Ciudad"
                    value={filters.city}
                    onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="state">Estado</Label>
                  <Input
                    id="state"
                    placeholder="Estado"
                    value={filters.state}
                    onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="category">Categoría</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las categorías</SelectItem>
                      <SelectItem value="Medio Ambiente">Medio Ambiente</SelectItem>
                      <SelectItem value="Educación">Educación</SelectItem>
                      <SelectItem value="Salud">Salud</SelectItem>
                      <SelectItem value="Alimentación">Alimentación</SelectItem>
                      <SelectItem value="Arte y Cultura">Arte y Cultura</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="verified"
                    checked={filters.onlyVerified}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onlyVerified: !!checked }))}
                  />
                  <Label htmlFor="verified">Solo organizaciones verificadas</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="available"
                    checked={filters.onlyAvailable}
                    onCheckedChange={(checked) => setFilters(prev => ({ ...prev, onlyAvailable: !!checked }))}
                  />
                  <Label htmlFor="available">Solo eventos con espacios disponibles</Label>
                </div>

                <div className="mt-4">
                  <Button onClick={fetchEvents} className="w-full bg-purple-600 hover:bg-purple-700">
                    Aplicar Filtros
                  </Button>
                </div>
              </div>
            </motion.div>
          </aside>

          {/* Contenido eventos */}
          <main className="flex-1">
            {events.length === 0 && !loading ? (
              <div className="text-center py-20">
                <Search className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron eventos</h3>
                <p className="text-gray-600">Intenta ajustar tus filtros de búsqueda</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events.map(event => (
  <motion.div
    key={event.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="group"
  >
    <Card className="overflow-hidden shadow-2xl rounded-3xl flex flex-col h-full hover:scale-105 transform transition-transform duration-300 bg-white">
      {/* Imagen con overlay y zoom */}
      <div className="relative h-56 w-full overflow-hidden rounded-t-3xl">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <Calendar className="h-16 w-16 text-gray-400" />
          </div>
        )}

        {/* Badges flotantes */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          <span className="px-3 py-1 rounded-full text-white text-xs font-semibold shadow" style={{ backgroundColor: event.category_color }}>
            {event.category_name}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow ${getAvailabilityStatus(event).color}`}>
            {getAvailabilityStatus(event).text}
          </span>
        </div>

        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <Badge variant="secondary">{event.city}</Badge>
          <Badge variant="secondary">{event.state}</Badge>
        </div>

        {/* Overlay con info adicional al hover */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
          <p className="text-white font-bold">{event.organization_name}</p>
          <p className="text-gray-200 text-sm">{formatDate(event.startDate)}</p>
        </div>
      </div>

      {/* Contenido */}
      <CardContent className="flex flex-col flex-1 p-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2 line-clamp-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>

        {/* Barra de progreso de plazas */}
        <div className="mb-4">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-2 bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500"
              style={{ width: `${Math.min(100, (event.currentVolunteers / event.maxVolunteers) * 100)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {event.currentVolunteers} de {event.maxVolunteers} plazas ocupadas
          </p>
        </div>

        <Button
          onClick={() => handleApply(event)}
          disabled={event.hasApplied || getAvailabilityStatus(event).text === "Completo"}
          className={`mt-auto w-full py-2 font-semibold rounded-xl shadow-lg
            ${event.hasApplied 
              ? "bg-gray-400 cursor-not-allowed text-white"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"}`
          }
        >
          {event.hasApplied ? "Postulado" : "Aplicar"}
        </Button>
      </CardContent>
    </Card>
  </motion.div>
))}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* Modal de confirmación */}
      {showConfirmModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-xl p-8 max-w-md w-full"
          >
            <h3 className="text-xl font-bold mb-4">Confirmar aplicación</h3>
            <p className="mb-6">¿Deseas postularte al evento <strong>{selectedEvent.title}</strong>?</p>
            <div className="flex justify-end space-x-4">
              <Button onClick={() => { setShowConfirmModal(false); setSelectedEvent(null); }}>Cancelar</Button>
              <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={confirmApplication}>Confirmar</Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
