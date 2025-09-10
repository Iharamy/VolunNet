"use client";

import { useState, useEffect } from "react";
import { getCurrentUser } from "../auth/actions";
import { Button } from "@/components/ui/button";
import { Home, Bell, Users, Calendar, Heart, LogOut, User, Settings, Info, AlertTriangle, CheckCircle, Clock, BellRing } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "info" | "alert" | "done" | "pending" | "reminder";
  date: string;
}

const exampleNotifications: Notification[] = [
  { id: 1, title: "Bienvenida", message: "Has iniciado sesión correctamente.", type: "info", date: "31 Ago 2025" },
  { id: 2, title: "Tarea pendiente", message: "Recuerda enviar tu proyecto antes de las 5 PM.", type: "alert", date: "31 Ago 2025" },
  { id: 3, title: "Evento completado", message: "Tu asistencia al taller fue registrada correctamente.", type: "done", date: "30 Ago 2025" },
  { id: 4, title: "Actualización", message: "Se ha actualizado tu perfil de usuario.", type: "info", date: "29 Ago 2025" },
  { id: 5, title: "Tarea por hacer", message: "Tienes tareas pendientes para hoy.", type: "pending", date: "31 Ago 2025" },
  { id: 6, title: "Recordatorio", message: "No olvides asistir a la reunión de mañana.", type: "reminder", date: "31 Ago 2025" },
];

function UserMenu({ user }: { user: any }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold"
        onClick={() => setOpen((v) => !v)}
      >
        {user?.firstName?.[0] || "M"}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-gray-800 text-sm">{user?.firstName || "María"} {user?.lastName || "González"}</div>
            <div className="text-xs text-gray-500">{user?.email || "voluntario@volunnet.com"}</div>
          </div>
          <Link href="/perfil" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
            <User className="h-4 w-4 text-gray-500" /> Perfil
          </Link>
          <Link href="/configuracion" className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50">
            <Settings className="h-4 w-4 text-gray-500" /> Configuración
          </Link>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-blue-50"
            onClick={async () => { await fetch("/api/auth/logout", { method: "POST" }); window.location.href = "/"; }}
          >
            <LogOut className="h-4 w-4 text-gray-500" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default function NotificacionesPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error loading user:", error);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 font-semibold">Cargando notificaciones...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center p-6 bg-white rounded-3xl shadow-2xl">
          <h1 className="text-3xl font-bold text-gray-700 mb-4">Acceso Denegado</h1>
          <p className="text-gray-600 mb-6">Debes iniciar sesión para ver tus notificaciones</p>
          <Link href="/login">
            <Button className="bg-purple-400 text-white hover:bg-purple-500 shadow-lg">Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  const filters = [
    { label: "Todas", value: "all", color: "bg-gray-200 text-gray-800" },
    { label: "Informativas", value: "info", color: "bg-blue-100 text-blue-800" },
    { label: "Importantes", value: "alert", color: "bg-red-100 text-red-800" },
    { label: "Completadas", value: "done", color: "bg-green-100 text-green-800" },
    { label: "Pendientes", value: "pending", color: "bg-yellow-100 text-yellow-800" },
    { label: "Recordatorios", value: "reminder", color: "bg-purple-100 text-purple-800" },
  ];

  const typeStyles = {
    info: { bg: "bg-gradient-to-r from-blue-50 to-blue-100", border: "border-l-4 border-blue-500" },
    alert: { bg: "bg-gradient-to-r from-red-50 to-red-100", border: "border-l-4 border-red-500" },
    done: { bg: "bg-gradient-to-r from-green-50 to-green-100", border: "border-l-4 border-green-500" },
    pending: { bg: "bg-gradient-to-r from-yellow-50 to-yellow-100", border: "border-l-4 border-yellow-500" },
    reminder: { bg: "bg-gradient-to-r from-purple-50 to-purple-100", border: "border-l-4 border-purple-500" },
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "info": return <Info className="h-6 w-6 text-blue-500" />;
      case "alert": return <AlertTriangle className="h-6 w-6 text-red-500" />;
      case "done": return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "pending": return <Clock className="h-6 w-6 text-yellow-500" />;
      case "reminder": return <BellRing className="h-6 w-6 text-purple-500" />;
      default: return <Info className="h-6 w-6 text-gray-500" />;
    }
  };

  const filteredNotifications =
    filter === "all"
      ? exampleNotifications
      : exampleNotifications.filter((n) => n.type === filter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-yellow-50">
      {/* TOP NAVBAR */}
      <header className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Heart className="h-7 w-7 text-purple-600 fill-purple-200" />
            <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">VolunNet</span>
          </div>

          {/* Navegación */}
          <nav className="flex items-center gap-6 text-gray-600 font-medium">
            <Link href="/dashboard" className="flex items-center gap-1 hover:text-purple-600"><Home className="h-5 w-5" />Inicio</Link>
            <Link href="/eventos/buscar" className="flex items-center gap-1 hover:text-purple-600"><Calendar className="h-5 w-5" />Eventos</Link>
            <Link href="/comunidad" className="flex items-center gap-1 hover:text-purple-600"><Users className="h-5 w-5" />Comunidad</Link>
            <Link href="/notificaciones" className="flex items-center gap-1 text-purple-600 font-semibold"><Bell className="h-5 w-5" />Notificaciones</Link>
          </nav>

          {/* User Menu */}
          <UserMenu user={user} />
        </div>
      </header>

      {/* CONTENIDO NOTIFICACIONES CON FILTROS AL COSTADO */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Filtros laterales */}
        <aside className="space-y-3">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`w-full px-4 py-2 rounded-lg font-semibold text-sm text-left transition shadow-sm ${
                filter === f.value ? f.color + " shadow-md" : "bg-white text-gray-700 hover:" + f.color
              }`}
            >
              {f.label}
            </button>
          ))}
        </aside>

        {/* Lista de notificaciones */}
        <section className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotifications.map((n, idx) => (
            <div
              key={n.id}
              className={`p-5 rounded-2xl shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2 animate-fadeIn ${typeStyles[n.type].bg} ${typeStyles[n.type].border}`}
              style={{ animationDelay: `${idx * 100}ms`, animationFillMode: "forwards" }}
            >
              <div className="flex items-center gap-3 mb-3">
                {getIcon(n.type)}
                <h2 className="font-bold text-gray-800 text-lg">{n.title}</h2>
              </div>
              <p className="text-gray-700 mb-3">{n.message}</p>
              <div className="flex justify-end text-sm text-gray-500">{n.date}</div>
            </div>
          ))}
          {filteredNotifications.length === 0 && (
            <p className="text-center text-gray-600 font-medium col-span-full">No hay notificaciones en esta categoría.</p>
          )}
        </section>
      </main>

      {/* Animación Fade In */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { opacity: 0; animation: fadeIn 0.5s ease forwards; }
      `}</style>
    </div>
  );
}
