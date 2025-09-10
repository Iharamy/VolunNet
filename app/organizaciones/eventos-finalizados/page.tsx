"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  CheckCircle,
  Star,
  Eye,
  Archive,
  Heart,
  Settings,
  Home,
  Bell
} from "lucide-react";
import Link from "next/link";
import { getCurrentUser } from "@/app/auth/actions";

interface CompletedEvent {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  maxVolunteers: number;
  currentVolunteers: number;
  status: string;
  category_name: string;
  category_icon: string;
  category_color: string;
  completedAt: string;
  participantsCount: number;
  ratingsPending: number;
}

function UserMenu({ organizationName, organizationEmail }: { organizationName: string; organizationEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition"
      >
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
          {organizationName?.[0] || "O"}
        </div>
        <span className="text-sm font-medium text-gray-700">{organizationName}</span>
        <Settings className="h-4 w-4 text-gray-500" />
      </button>

      {isOpen && (
        <motion.div
          className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
        >
          <div className="px-4 py-2 border-b border-gray-100">
            <p className="text-sm font-medium text-gray-900">{organizationName}</p>
            <p className="text-xs text-gray-500">{organizationEmail}</p>
          </div>
          <Link href="/organizaciones/perfil" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
            Perfil
          </Link>
          <Link
            href="/organizaciones/configuracion"
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Configuración
          </Link>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={async () => {
                await fetch("/api/auth/logout", { method: "POST" });
                window.location.href = "/";
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function EventosFinalizadosPage() {
  const router = useRouter();
  const [events, setEvents] = useState<CompletedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");

  useEffect(() => { loadUser() }, []);
  useEffect(() => { if (user) loadCompletedEvents() }, [user]);

  const loadUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      if (currentUser?.firstName) setOrganizationName(currentUser.firstName);
      if (currentUser?.email) setOrganizationEmail(currentUser.email);
    } catch (error) { console.error("Error loading user:", error); }
  };

  const loadCompletedEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizaciones/eventos-finalizados', { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else { setEvents([]); }
    } catch (error) { console.error(error); setEvents([]); }
    finally { setLoading(false); }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          event.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || event.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || event.category_name === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs">Completado</Badge>
      case 'ARCHIVED': return <Badge className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs">Archivado</Badge>
      default: return <Badge variant="secondary">{status}</Badge>
    }
  };

  const getCategoryBadge = (category: string, icon: string, color: string) => (
    <Badge className={`px-3 py-1 rounded-full text-xs ${color} bg-opacity-20`}>
      <span className="mr-1">{icon}</span>{category}
    </Badge>
  );

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Cargando eventos finalizados...</p>
      </div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Acceso Denegado</h1>
        <p className="text-gray-600 mb-6">Debes iniciar sesión para ver esta página</p>
        <Link href="/login"><Button>Iniciar Sesión</Button></Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      
      {/* Header superior */}
      <div className="sticky top-0 z-30 bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <Heart className="h-8 w-8 text-blue-600 fill-blue-200" />
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VolunNet
            </span>
          </div>
          <div className="flex items-center gap-6">
            <nav className="flex gap-2 text-gray-600 text-sm font-medium">
              <Link href="/organizaciones/dashboard" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50">
                <Home className="h-5 w-5" /> Inicio
              </Link>
              <Link href="/organizaciones/eventos-finalizados" className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-50 text-blue-700 border-b-2 border-blue-600">
                <CheckCircle className="h-5 w-5" /> Eventos Finalizados
              </Link>
              <Link href="/organizaciones/estadisticas" className="flex items-center gap-1 px-3 py-1 rounded-lg hover:text-blue-700 hover:bg-blue-50">
                <Bell className="h-5 w-5" /> Estadísticas
              </Link>
            </nav>
            <div className="w-px h-8 bg-gray-200 mx-2" />
            <UserMenu organizationName={organizationName} organizationEmail={organizationEmail} />
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar */}
        <div className="w-full lg:w-72 bg-white rounded-2xl shadow-lg border border-gray-200 p-6 flex flex-col gap-6 sticky top-24 h-fit">
          <h2 className="text-lg font-bold text-gray-900">Filtros</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar eventos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por estado" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="COMPLETED">Completados</SelectItem>
              <SelectItem value="ARCHIVED">Archivados</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Filtrar por categoría" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              <SelectItem value="Medio Ambiente">Medio Ambiente</SelectItem>
              <SelectItem value="Educación">Educación</SelectItem>
              <SelectItem value="Salud">Salud</SelectItem>
              <SelectItem value="Alimentación">Alimentación</SelectItem>
              <SelectItem value="Tecnología">Tecnología</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={loadCompletedEvents}
            variant="gradient"
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
          >
            <Filter className="h-4 w-4" /> Actualizar
          </Button>
        </div>

        {/* Contenido de eventos */}
        <div className="flex-1 flex flex-col gap-8">
          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-green-50 border-green-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Completados</p>
                  <p className="text-2xl font-bold text-green-900">{events.filter(e => e.status === 'COMPLETED').length}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Participantes</p>
                  <p className="text-2xl font-bold text-blue-900">{events.reduce((sum, e) => sum + e.participantsCount, 0)}</p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </CardContent>
            </Card>
            <Card className="bg-yellow-50 border-yellow-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Calificaciones Pendientes</p>
                  <p className="text-2xl font-bold text-yellow-900">{events.reduce((sum, e) => sum + e.ratingsPending, 0)}</p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </CardContent>
            </Card>
            <Card className="bg-gray-50 border-gray-200 hover:shadow-lg transition-shadow">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Eventos</p>
                  <p className="text-2xl font-bold text-gray-900">{events.length}</p>
                </div>
                <Archive className="h-8 w-8 text-gray-600" />
              </CardContent>
            </Card>
          </div>

          {/* Lista de eventos */}
          {filteredEvents.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {events.length === 0 ? "No hay eventos finalizados" : "No se encontraron eventos"}
                </h3>
                <p className="text-gray-600 mb-6">
                  {events.length === 0 
                    ? "Los eventos que marques como completados aparecerán aquí"
                    : "Intenta ajustar los filtros de búsqueda"
                  }
                </p>
                <Link href="/organizaciones/dashboard">
                  <Button variant="gradient" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700">Volver al Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6">
              {filteredEvents.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-2xl transition-shadow rounded-2xl border border-gray-200">
                    <CardHeader>
                      <div className="flex items-start justify-between flex-wrap gap-2">
                        <div className="flex-1">
                          <div className="flex items-center flex-wrap gap-2 mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                            {getStatusBadge(event.status)}
                            {getCategoryBadge(event.category_name, event.category_icon, event.category_color)}
                          </div>
                          <p className="text-gray-600 line-clamp-3">{event.description}</p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-gray-700">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span>{new Date(event.startDate).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-red-500" />
                          <span>{event.city}, {event.state}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-green-600" />
                          <span>{event.currentVolunteers}/{event.maxVolunteers} participantes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-purple-600" />
                          <span>Completado: {new Date(event.completedAt).toLocaleDateString('es-ES')}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <span className="text-sm text-gray-600">
                          Calificaciones pendientes: <span className="font-semibold">{event.ratingsPending}</span>
                        </span>

                        <div className="flex gap-2">
                          <Link href={`/eventos/${event.id}`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Eye className="h-4 w-4" /> Ver Detalles
                            </Button>
                          </Link>
                          <Link href={`/eventos/${event.id}/gestionar`}>
                            <Button variant="outline" size="sm" className="flex items-center gap-1">
                              <Users className="h-4 w-4" /> Gestionar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}