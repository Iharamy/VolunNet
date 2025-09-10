"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { motion } from "framer-motion"
import {
  Heart, MapPin, Calendar, Users, Clock, Building, Star,
  Share2, Bookmark, Mail, Globe, Menu, User, ArrowLeft, Home, Bell, LogOut, Settings
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { getCurrentUser } from "@/app/auth/actions"
import { EventCompletionButton } from "@/components/EventCompletionButton"

interface Event {
  id: string
  title: string
  description: string
  organization_name: string
  organization_verified: boolean
  city: string
  state: string
  country: string
  address: string
  startDate: string
  endDate: string
  maxVolunteers: number
  currentVolunteers: number
  category_name: string
  category_icon: string
  category_color: string
  skills: string[]
  requirements: string[]
  benefits: string[]
  status: string
  imageUrl?: string
}

interface Organization {
  name: string
  description?: string
  email?: string
  phone?: string
  website?: string
  verified: boolean
  rating?: number
  totalEvents?: number
}

export default function EventDetails() {
  const params = useParams()
  const router = useRouter()
  const [event, setEvent] = useState<Event | null>(null)
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [hasApplied, setHasApplied] = useState(false)
  const [applying, setApplying] = useState(false)
  const [isEventOwner, setIsEventOwner] = useState(false)

  // Modal postulación
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<
    "checking" | "already-applied" | "can-apply" | "applying" | "success" | "error"
  >("checking")
  const [modalMessage, setModalMessage] = useState("")

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentUser()
      setUser(currentUser)
    }
    loadUser()
  }, [])

  useEffect(() => {
    if (params.id) fetchEventDetails()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, user])

  const fetchEventDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/events/${params.id}`)
      const data = await response.json()

      if (data.event) {
        setEvent(data.event)
        if (data.event.organization_name) {
          setOrganization({
            name: data.event.organization_name,
            verified: data.event.organization_verified,
            rating: 4.5,
            totalEvents: 15,
          })
        }

        if (user) {
          const applicationResponse = await fetch(`/api/events/apply?eventId=${params.id}`)
          const applicationData = await applicationResponse.json()
          setHasApplied(applicationData.hasApplied || false)

          if (user.role === "ORGANIZATION") {
            const orgResponse = await fetch("/api/organizations/me")
            if (orgResponse.ok) {
              const orgData = await orgResponse.json()
              if (orgData.organization && data.event.organizationId === orgData.organization.id) {
                setIsEventOwner(true)
              }
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching event details:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user) {
      router.push("/login")
      return
    }
    if (!event) return

    setShowApplicationModal(true)
    setApplicationStatus("checking")
    setModalMessage("Verificando estado de postulación...")

    try {
      const checkResponse = await fetch(`/api/events/apply?eventId=${event.id}&volunteerId=${user.id}`)
      if (checkResponse.ok) {
        const checkData = await checkResponse.json()
        if (checkData.applications && checkData.applications.length > 0) {
          setApplicationStatus("already-applied")
          setModalMessage("Ya te has postulado a este evento anteriormente")
          return
        }
      }
      setApplicationStatus("can-apply")
      setModalMessage("¿Estás seguro de que quieres postularte a este evento?")
    } catch {
      setApplicationStatus("error")
      setModalMessage("Error al verificar el estado de la postulación")
    }
  }

  const confirmApplication = async () => {
    if (!event) return

    setApplicationStatus("applying")
    setModalMessage("Enviando postulación...")

    try {
      const response = await fetch("/api/events/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: event.id }),
      })

      if (response.ok) {
        setHasApplied(true)
        setEvent(prev =>
          prev ? { ...prev, currentVolunteers: prev.currentVolunteers + 1 } : null
        )
        setApplicationStatus("success")
        setModalMessage("¡Postulación enviada exitosamente!")
        setTimeout(() => closeModal(), 2000)
      } else {
        setApplicationStatus("error")
        setModalMessage("Error al postularse al evento")
      }
    } catch {
      setApplicationStatus("error")
      setModalMessage("Error al postularse al evento")
    }
  }

  const closeModal = () => {
    setShowApplicationModal(false)
    setApplicationStatus("checking")
    setModalMessage("")
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("es-ES", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })

  const getTimeUntilEvent = (dateString: string) => {
    const now = new Date()
    const eventDate = new Date(dateString)
    const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays < 0) return "Evento pasado"
    if (diffDays === 0) return "Hoy"
    if (diffDays === 1) return "Mañana"
    if (diffDays < 7) return `En ${diffDays} días`
    if (diffDays < 30) return `En ${Math.floor(diffDays / 7)} semanas`
    return `En ${Math.floor(diffDays / 30)} meses`
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Cargando evento...</span>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-gray-900">Evento no encontrado</h2>
          <Button onClick={() => router.push("/eventos/buscar")}>Volver a buscar eventos</Button>
        </div>
      </div>
    )
  }

  const isEventFull = event.currentVolunteers >= event.maxVolunteers
  const isEventPast = new Date(event.startDate) < new Date()
  const isVolunteer = user?.role === "VOLUNTEER"

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* --- HEADER MODERNO (reemplaza el NAV anterior) --- */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          {/* izquierda: botón volver + logo */}
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => router.back()}
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5 text-blue-600" />
            </button>

            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => router.push("/dashboard")}
              title="Ir al inicio"
              style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              <Heart className="h-8 w-8 text-blue-600 fill-blue-200" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">VolunNet</span>
            </button>
          </div>

          {/* barra de búsqueda */}
          <div className="flex-1 mx-8 max-w-xl">
            <input
              type="text"
              placeholder="Buscar eventos, iglesias..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gray-50 text-gray-700 shadow-sm"
            />
          </div>

          {/* navegación y usermenu */}
          <div className="flex items-center gap-6">
            <nav className="flex gap-2 text-gray-600 text-sm font-medium">
              <Link href="/dashboard" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition group relative">
                <Home className="h-5 w-5 group-hover:text-blue-700 transition" />
                <span>Inicio</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link href="/eventos/buscar" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition group relative">
                <Calendar className="h-5 w-5 group-hover:text-blue-700 transition" />
                <span>Eventos</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link href="/comunidad" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition group relative">
                <Users className="h-5 w-5 group-hover:text-blue-700 transition" />
                <span>Comunidad</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link href="/notificaciones" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50 transition group relative">
                <Bell className="h-5 w-5 group-hover:text-blue-700 transition" />
                <span>Notificaciones</span>
                <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            </nav>

            {/* avatar / user menu */}
            <div className="w-px h-8 bg-gray-200 mx-2" />
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      {/* HERO */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative rounded-2xl shadow-xl overflow-hidden border border-blue-50 mb-8">
        <div className="h-72 w-full bg-gradient-to-r from-blue-100 to-purple-100 relative">
          {event.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.imageUrl} alt={event.title} className="h-full w-full object-cover" />
          ) : (
            <div className="flex items-center justify-center text-6xl">{event.category_icon}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-6 left-8 text-white">
            <h1 className="text-4xl font-bold drop-shadow-lg">{event.title}</h1>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={`${event.category_color} text-sm`}>{event.category_name}</Badge>
            </div>
          </div>
        </div>
        <div className="absolute top-4 right-4 flex gap-2">
          <Button variant="outline" size="sm" className="bg-white/80 hover:bg-white">
            <Share2 className="h-4 w-4 mr-2" /> Compartir
          </Button>
          <Button variant="outline" size="sm" className="bg-white/80 hover:bg-white">
            <Bookmark className="h-4 w-4 mr-2" /> Guardar
          </Button>
        </div>
      </motion.div>

      {/* CONTENIDO */}
      <div className="max-w-7xl mx-auto px-4 pb-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PRINCIPAL */}
        <div className="lg:col-span-2 space-y-6">
          {/* Info clave */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl">
              <Calendar className="h-6 w-6 text-blue-600" />
              <div>
                <p className="font-semibold">{formatDate(event.startDate)}</p>
                <p className="text-sm text-gray-600">{formatTime(event.startDate)} - {formatTime(event.endDate)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-red-50 p-4 rounded-xl">
              <MapPin className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-semibold">{event.city}, {event.state}</p>
                <p className="text-sm text-gray-600">{event.address}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-green-50 p-4 rounded-xl">
              <Users className="h-6 w-6 text-green-600" />
              <div>
                <p className="font-semibold">{event.currentVolunteers}/{event.maxVolunteers} voluntarios</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: `${(event.currentVolunteers / event.maxVolunteers) * 100}%` }} />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-purple-50 p-4 rounded-xl">
              <Clock className="h-6 w-6 text-purple-600" />
              <div>
                <p className="font-semibold">{getTimeUntilEvent(event.startDate)}</p>
                <p className="text-sm text-gray-600">Tiempo restante</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border p-6">
            <Tabs defaultValue="detalles">
              <TabsList className="mb-6">
                <TabsTrigger value="detalles">Detalles</TabsTrigger>
                <TabsTrigger value="organizacion">Organización</TabsTrigger>
                <TabsTrigger value="similares">Similares</TabsTrigger>
              </TabsList>

              <TabsContent value="detalles">
                <h2 className="text-2xl font-bold mb-4">Detalles del Evento</h2>
                <p className="text-gray-700 mb-6">{event.description}</p>
                {event.skills?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Habilidades</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.skills.map((s, i) => <Badge key={i} variant="secondary">{s}</Badge>)}
                    </div>
                  </div>
                )}
                {event.requirements?.length > 0 && (
                  <div className="mb-6">
                    <h3 className="font-semibold mb-2">Requisitos</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {event.requirements.map((r, i) => <li key={i}>{r}</li>)}
                    </ul>
                  </div>
                )}
                {event.benefits?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Beneficios</h3>
                    <ul className="list-disc list-inside text-gray-700">
                      {event.benefits.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="organizacion">
                {organization && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">Organización</h2>
                    <h4 className="font-semibold">{organization.name}</h4>
                    <div className="flex items-center gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < Math.floor(organization.rating || 0) ? "text-yellow-400 fill-current" : "text-gray-300"}`} />
                      ))}
                      <span className="text-sm text-gray-600">({organization.rating})</span>
                    </div>
                    <p className="text-sm text-gray-600">{organization.totalEvents} eventos organizados</p>
                    {organization.email && <p className="flex items-center gap-2"><Mail className="h-4 w-4" /> {organization.email}</p>}
                    {organization.website && <p className="flex items-center gap-2"><Globe className="h-4 w-4" /> {organization.website}</p>}
                    <Separator className="my-4" />
                    <Button variant="outline" onClick={() => router.push(`/organizaciones/${event.organization_name}`)}>Ver perfil completo</Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="similares">
                <h2 className="text-xl font-bold mb-4">Eventos Similares</h2>
                <div className="space-y-2">
                  <div className="p-3 border rounded-lg"><h4 className="font-medium">Limpieza de Playa</h4><p className="text-sm text-gray-600">Puerto Vallarta • 15 ago</p></div>
                  <div className="p-3 border rounded-lg"><h4 className="font-medium">Taller de Programación</h4><p className="text-sm text-gray-600">Guadalajara • 18 ago</p></div>
                </div>
                <Button variant="outline" className="mt-4">Ver más eventos</Button>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>

        {/* SIDEBAR - Solo mostrar para voluntarios */}
        {isVolunteer && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border p-6 h-fit">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">{hasApplied ? "Ya postulado" : "¿Quieres participar?"}</h3>
              <p className="text-gray-600">
                {hasApplied ? "Tu postulación está en revisión" : "Únete y haz la diferencia"}
              </p>
            </div>
            {!hasApplied && !isEventPast && (
              <Button
                onClick={handleApply}
                disabled={isEventFull || applying}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                {applying ? "Postulando..." : isEventFull ? "Evento completo" : "Postularme"}
              </Button>
            )}
            {hasApplied && <Badge className="bg-green-100 text-green-700">Postulación enviada</Badge>}
            {isEventPast && <Badge variant="secondary">Evento finalizado</Badge>}
          </motion.div>
        )}

        {/* SIDEBAR PARA ORGANIZADORES - Solo botón de completar evento */}
        {isEventOwner && event.status === "PUBLISHED" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg border p-6 h-fit">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold mb-2">Gestión del Evento</h3>
              <p className="text-gray-600">Administra tu evento</p>
            </div>
            <EventCompletionButton
              eventId={event.id}
              eventTitle={event.title}
              currentVolunteers={event.currentVolunteers}
              maxVolunteers={event.maxVolunteers}
              startDate={event.startDate}
              city={event.city}
              state={event.state}
              canComplete={isEventOwner}
              onCompletion={() => fetchEventDetails()}
            />
          </motion.div>
        )}
      </div>

      {/* MODAL POSTULACIÓN */}
      {showApplicationModal && event && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                {applicationStatus === "checking" && <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>}
                {applicationStatus === "already-applied" && <span className="text-white text-2xl">⚠️</span>}
                {applicationStatus === "can-apply" && <span className="text-white text-2xl">🎯</span>}
                {applicationStatus === "applying" && <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>}
                {applicationStatus === "success" && <span className="text-white text-2xl">✅</span>}
                {applicationStatus === "error" && <span className="text-white text-2xl">❌</span>}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {applicationStatus === "checking" && "Verificando..."}
                {applicationStatus === "already-applied" && "Ya te has postulado"}
                {applicationStatus === "can-apply" && "Confirmar Postulación"}
                {applicationStatus === "applying" && "Enviando..."}
                {applicationStatus === "success" && "¡Éxito!"}
                {applicationStatus === "error" && "Error"}
              </h3>
              <p className="text-gray-600 text-sm">{modalMessage}</p>
            </div>

            {/* Botones modal */}
            <div className="flex gap-3">
              {applicationStatus === "can-apply" && (
                <>
                  <Button variant="outline" onClick={closeModal} className="flex-1">Cancelar</Button>
                  <Button onClick={confirmApplication} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    Confirmar
                  </Button>
                </>
              )}
              {["already-applied", "success", "error"].includes(applicationStatus) && (
                <Button onClick={closeModal} className="w-full bg-blue-600 text-white">Cerrar</Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* -----------------------------
   Menú de usuario (UserMenu)
   Traído del dashboard para mantener
   el mismo estilo/funcionalidad.
   ----------------------------- */
function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú de usuario"
      >
        {user?.firstName?.[0] || 'M'}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50 animate-fade-in">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-gray-800 text-sm">{user?.firstName || 'María'} {user?.lastName || 'González'}</div>
            <div className="text-xs text-gray-500">{user?.email || 'voluntario@volunnet.com'}</div>
          </div>
          <Link
            href="/organizaciones/perfil"
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
          >
            <User className="h-4 w-4 text-gray-500" />
            Perfil
          </Link>
          <Link
            href="/configuracion"
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition"
          >
            <Settings className="h-4 w-4 text-gray-500" />
            Configuración
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-b-xl transition"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/");
            }}
          >
            <LogOut className="h-4 w-4 text-gray-500" />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
