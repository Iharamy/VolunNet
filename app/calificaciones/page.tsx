"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { getCurrentUser } from "../auth/actions"
import { RatingModal } from "@/components/RatingModal/RatingModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, Calendar, MapPin, Users, Heart, Home, Bell, LogOut, User, Settings } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

interface RatingPendingEvent {
  id: string
  event: {
    id: string
    title: string
    description: string
    city: string
    state: string
    startDate: string
    endDate?: string
    status: string
    organization: {
      id: string
      name: string
    }
  }
  status: string
  volunteerId: string
}

function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center text-blue-600 font-bold shadow-md hover:scale-105 transition"
        onClick={() => setOpen((v) => !v)}
      >
        {user?.firstName?.[0] || 'M'}
      </button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
            <div className="font-semibold text-gray-800 text-sm">{user?.firstName || 'María'} {user?.lastName || 'González'}</div>
            <div className="text-xs text-gray-500">{user?.email || 'voluntario@volunnet.com'}</div>
          </div>
          <Link href="/perfil" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
            <User className="h-4 w-4 text-gray-500" /> Perfil
          </Link>
          <Link href="/configuracion" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
            <Settings className="h-4 w-4 text-gray-500" /> Configuración
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600"
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}
          >
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </motion.div>
      )}
    </div>
  )
}

export default function CalificacionesPage() {
  const searchParams = useSearchParams()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [events, setEvents] = useState<RatingPendingEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<RatingPendingEvent | null>(null)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [eventIdFromUrl, setEventIdFromUrl] = useState<string | null>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error("Error loading user:", error)
      } finally {
        setLoading(false)
      }
    }
    loadUser()
  }, [])

  useEffect(() => {
    const eventId = searchParams.get('eventId')
    if (eventId) {
      setEventIdFromUrl(eventId)
    }
  }, [searchParams])

  useEffect(() => {
    if (user) {
      loadRatingPendingEvents()
    }
  }, [user])

  const loadRatingPendingEvents = async () => {
    try {
      const response = await fetch('/api/dashboard/events', { credentials: 'include' })
      if (response.ok) {
        const data = await response.json()
        const completedEvents = data.events?.filter((event: any) => event.status === 'COMPLETED') || []
        const eventsData = completedEvents.map((event: any) => ({
          id: event.id,
          event: {
            id: event.id,
            title: event.title || 'Evento sin título',
            description: event.description || 'Sin descripción',
            city: event.city || 'Ciudad no especificada',
            state: event.state || 'Estado no especificado',
            startDate: event.start_date || event.startDate,
            endDate: event.end_date || event.endDate,
            status: event.status,
            organization: {
              id: event.organization_id || 'org_unknown',
              name: event.organization_name || 'Organización no especificada'
            }
          },
          status: 'COMPLETED',
          volunteerId: user?.id || ''
        }))

        setEvents(eventsData)

        if (eventIdFromUrl) {
          const eventToRate = eventsData.find((e: RatingPendingEvent) => e.event.id === eventIdFromUrl)
          if (eventToRate) {
            setSelectedEvent(eventToRate)
            setShowRatingModal(true)
            setEventIdFromUrl(null)
          }
        }
      }
    } catch (error) {
      console.error("Error loading rating pending events:", error)
    }
  }

  const handleRateEvent = (event: RatingPendingEvent) => {
    setSelectedEvent(event)
    setShowRatingModal(true)
  }

  const handleRatingComplete = () => {
    setShowRatingModal(false)
    setSelectedEvent(null)
    loadRatingPendingEvents()
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50"><div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-lg text-center">
          <h1 className="text-2xl font-bold mb-2">Acceso Denegado</h1>
          <p className="text-gray-600 mb-4">Debes iniciar sesión para continuar</p>
          <Link href="/login"><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Iniciar Sesión</Button></Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* HEADER SUPERIOR */}
      <div className="sticky top-0 z-30 bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600 fill-blue-200" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">VolunNet</span>
          </div>
          <div className="flex-1 mx-8 max-w-xl">
            <input type="text" placeholder="Buscar eventos, iglesias..." className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-200 bg-gray-50 shadow-sm" />
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-2 text-gray-600 text-sm font-medium">
              <Link href="/dashboard" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50">
                <Home className="h-5 w-5" /> Inicio
              </Link>
              <Link href="/eventos/buscar" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-50 hover:text-blue-700">
                <Calendar className="h-5 w-5" /> Eventos
              </Link>
              <Link href="/comunidad" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-700">
                <Users className="h-5 w-5" /> Comunidad
              </Link>
              <Link href="/notificaciones" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:bg-blue-50 hover:text-blue-700">
                <Bell className="h-5 w-5" /> Notificaciones
              </Link>
            </nav>
            <UserMenu user={user} />
          </div>
        </div>
      </div>

      {/* CONTENIDO CENTRADO */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-10">
        <div className="w-full max-w-5xl text-center">
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl font-bold mb-8 flex items-center justify-center gap-3 text-gray-900"
          >
            <Star className="h-8 w-8 text-yellow-500" /> Calificaciones
          </motion.h2>

          {events.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-100 mx-auto max-w-xl"
            >
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay eventos pendientes de calificación</h3>
              <p className="text-gray-600 mb-6">Los eventos completados aparecerán aquí para calificarlos</p>
              <Link href="/dashboard"><Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">Volver al Dashboard</Button></Link>
            </motion.div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 justify-center">
              {events.map((eventItem, idx) => (
                <motion.div
                  key={eventItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-shadow rounded-2xl overflow-hidden border border-gray-100">
                    <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50">
                      <CardTitle className="text-lg font-semibold text-gray-900">{eventItem.event.title}</CardTitle>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">{eventItem.event.status}</Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {eventItem.event.organization.name}</div>
                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {new Date(eventItem.event.startDate).toLocaleDateString('es-ES')}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {eventItem.event.city}, {eventItem.event.state}</div>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-3">{eventItem.event.description}</p>
                      <Button className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold" onClick={() => handleRateEvent(eventItem)}>
                        <Star className="h-4 w-4 mr-2" /> Calificar
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE CALIFICACIÓN */}
      {showRatingModal && selectedEvent && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          event={{
            id: selectedEvent.event.id,
            title: selectedEvent.event.title,
            startDate: selectedEvent.event.startDate,
            endDate: selectedEvent.event.endDate || selectedEvent.event.startDate
          }}
          userToRate={{
            id: selectedEvent.event.organization.id,
            name: selectedEvent.event.organization.name,
            role: 'ORGANIZATION'
          }}
          onSubmit={async (rating, feedback) => {
            try {
              const response = await fetch(`/api/events/${selectedEvent.event.id}/rate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  volunteerId: user.id,
                  rating,
                  comment: feedback,
                  type: 'VOLUNTEER_TO_ORGANIZATION'
                })
              })
              if (response.ok) {
                handleRatingComplete()
              } else {
                const errorText = await response.text()
                console.error('❌ Error submitting rating:', response.status, errorText)
              }
            } catch (error) {
              console.error('❌ Error submitting rating:', error)
            }
          }}
        />
      )}
    </div>
  )
}
