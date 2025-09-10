"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, MapPin, Users, Eye, Heart, X, Menu } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  location: string;
  participants: number;
  status: "active" | "finished" | "upcoming";
}

export default function EventosFinalizadosPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const fetchedEvents: Event[] = [
          {
            id: 1,
            title: "Taller de Voluntariado",
            description: "Aprende habilidades de liderazgo y trabajo en equipo.",
            date: "01 Sep 2025",
            location: "Centro Comunitario",
            participants: 20,
            status: "finished",
          },
          {
            id: 2,
            title: "Evento de Limpieza",
            description: "Limpieza del parque central y concienciación ambiental.",
            date: "28 Ago 2025",
            location: "Parque Central",
            participants: 15,
            status: "finished",
          },
        ];
        setEvents(fetchedEvents.filter((e) => e.status === "finished"));
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleVerDetalles = (event: Event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 overflow-hidden">
      {/* HEADER CON MENU NUEVO */}
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          mounted && scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 focus:outline-none"
              style={{ background: "none", border: "none", padding: 0, cursor: "pointer" }}
              title="Ir al inicio"
              onClick={() => router.push("/")}
            >
              <Heart className="h-8 w-8 text-blue-600 fill-blue-200" />
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                VolunNet
              </span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {["Eventos", "Organizaciones", "Acerca de"].map((item) => (
              <motion.div key={item} whileHover={{ scale: 1.05 }}>
                <Link
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  className="text-gray-700 hover:text-blue-600 transition-colors relative group"
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </motion.div>
            ))}
          </nav>

          <div className="hidden md:flex space-x-3">
            <Button variant="outline" className="rounded-full px-6" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 border-0"
              asChild
            >
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="md:hidden bg-white border-t"
          >
            <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
              {["Eventos", "Organizaciones", "Acerca de"].map((item) => (
                <Link
                  key={item}
                  href={`/${item.toLowerCase().replace(" ", "-")}`}
                  className="text-gray-700 hover:text-blue-600 transition-colors py-2"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-2 border-t">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600" asChild>
                  <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
        <h1 className="text-3xl font-extrabold text-purple-700 mb-6 text-center animate-gradient">
          Eventos Finalizados
        </h1>

        {events.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center bg-white p-10 rounded-3xl shadow-2xl">
            <Calendar className="h-12 w-12 text-gray-400 mb-3" />
            <h2 className="text-2xl font-bold text-purple-600 mb-2">No hay eventos finalizados</h2>
            <p className="text-gray-500 mb-4">Aún no se han registrado eventos que hayan finalizado.</p>
            <Button
              className="px-6 py-2 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
              asChild
            >
              <Link href="/">Volver a Inicio</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="hover:shadow-2xl transition-transform transform hover:-translate-y-2 hover:scale-105 border border-purple-100"
              >
                <CardHeader className="flex justify-between items-center">
                  <CardTitle className="text-lg font-bold text-purple-700 hover:text-purple-900 transition-colors">
                    {event.title}
                  </CardTitle>
                  <Badge className="bg-purple-100 text-purple-800 font-semibold">Finalizado</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 mb-2">{event.description}</p>
                  <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                    <Calendar className="h-4 w-4" /> {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600 mb-1">
                    <MapPin className="h-4 w-4" /> {event.location}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-purple-600">
                    <Users className="h-4 w-4" /> {event.participants} participantes
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => handleVerDetalles(event)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 shadow-lg transition-all transform hover:scale-105"
                    >
                      <Eye className="h-4 w-4" /> Ver detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* BOTÓN FLOTANTE VOLVER A INICIO */}
        <div className="flex justify-center mt-12">
          <Button
            className="px-6 py-3 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
            asChild
          >
            <Link href="/">Volver a Inicio</Link>
          </Button>
        </div>
      </main>

      {/* MODAL */}
      {showModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 transition-opacity duration-300">
          <div className="bg-white rounded-xl max-w-md w-full p-6 relative shadow-2xl transform scale-95 animate-scaleIn border border-purple-200">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowModal(false)}
            >
              <X className="h-5 w-5" />
            </button>
            <h3 className="text-xl font-bold text-purple-700 mb-4 animate-gradient">
              Acceso Requerido
            </h3>
            <p className="mb-6 text-gray-700">
              Para ver los detalles del evento <strong>{selectedEvent.title}</strong>, debes iniciar sesión.
            </p>
            <div className="flex justify-end">
              <Button
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105"
                asChild
              >
                <Link href="/">Volver a Inicio</Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out forwards;
        }

        @keyframes gradientMove {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        .animate-gradient {
          background: linear-gradient(90deg, #7e22ce, #3b82f6, #ec4899);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradientMove 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
