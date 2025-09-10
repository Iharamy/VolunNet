"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Heart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AcercaDePage() {
  const router = useRouter();
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (path: string) =>
    pathname === path ? "text-[#7B61FF] font-semibold" : "text-gray-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#eaeefc] via-[#f9faff] to-[#f4f5ff] text-gray-800 font-sans flex flex-col">
      <header className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-blue-600 fill-blue-200" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              VolunNet
            </h1>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/eventosfin" className={`${isActive("/eventosfin")} hover:text-blue-600`}>
              Eventos
            </Link>
            <Link href="/organizaciones" className={`${isActive("/organizaciones")} hover:text-blue-600`}>
              Organizaciones
            </Link>
            <Link href="/acerca-de" className={`${isActive("/acerca-de")} hover:text-blue-600`}>
              Acerca de
            </Link>
          </nav>

          <div className="hidden md:flex space-x-3">
            <Button variant="outline" className="rounded-full px-6" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button className="rounded-full px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white" asChild>
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu" className="p-2">
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden px-6 pb-4 pt-2 bg-white shadow-md">
            <nav className="flex flex-col space-y-3">
              <Link href="/eventosfin" className="text-gray-700 hover:text-blue-600">Eventos</Link>
              <Link href="/organizaciones" className="text-gray-700 hover:text-blue-600">Organizaciones</Link>
              <Link href="/acerca-de" className="text-gray-700 hover:text-blue-600">Acerca de</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">Iniciar Sesión</Link>
              <Link href="/registro" className="text-gray-700 hover:text-blue-600">Registrarse</Link>
            </nav>
          </div>
        )}
      </header>

      <header className="pt-32 text-center px-6">
        <div className="flex justify-center items-center gap-3 mb-4">
          <Heart className="h-10 w-10 text-purple-600 fill-purple-200" />
          <h1 className="text-4xl font-extrabold text-gray-800">
            Acerca de <span className="text-[#7B61FF]">VolunNet</span>
          </h1>
        </div>
        <p className="max-w-2xl mx-auto text-gray-600 text-lg">
          Conecta con causas sociales, organizaciones y personas que desean transformar su comunidad.
        </p>
      </header>

      <main className="max-w-6xl mx-auto py-16 px-6 grid md:grid-cols-2 gap-12 items-center">
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-[#7B61FF] mb-4">Nuestra Misión</h2>
          <p className="text-gray-700 mb-4">
            En <strong>VolunNet</strong>, creemos en el poder de la solidaridad. Nuestra misión es ser un puente entre quienes desean aportar su tiempo, talento y pasión por ayudar, y las organizaciones que trabajan incansablemente por causas que impactan a nuestra sociedad.
          </p>
          <p className="text-gray-700 mb-4">
            Buscamos fomentar una cultura de voluntariado accesible, incluyente y significativa. Soñamos con una comunidad activa que no solo observe los problemas sociales, sino que participe activamente en la construcción de soluciones sostenibles.
          </p>
          <p className="text-gray-700 mb-6">
            Cada acción cuenta. Ya sea plantando un árbol, ayudando a un niño a leer o rescatando un animal, cada voluntario forma parte del cambio que el mundo necesita.
          </p>

          <h2 className="text-2xl font-bold text-[#7B61FF] mb-4">¿Qué hacemos?</h2>
          <ul className="list-disc list-inside text-gray-700 space-y-3">
            <li><strong>Difusión de causas:</strong> Promovemos campañas y actividades de organizaciones sin fines de lucro, facilitando que más personas se enteren y participen.</li>
            <li><strong>Conexión con voluntarios:</strong> Creamos un espacio donde voluntarios potenciales pueden explorar oportunidades que se alineen con sus valores e intereses.</li>
            <li><strong>Plataforma de registro:</strong> Brindamos herramientas para que las organizaciones publiquen eventos, lleven control de asistencia y gestionen sus equipos de voluntariado.</li>
            <li><strong>Educación y sensibilización:</strong> Compartimos contenido para crear conciencia sobre problemáticas sociales, ambientales y educativas.</li>
            <li><strong>Reconocimiento:</strong> A través de medallas digitales, certificados y estadísticas, motivamos a los voluntarios a seguir contribuyendo.</li>
          </ul>
        </div>

        <div className="rounded-3xl overflow-hidden shadow-2xl">
          <Image
            src="/img/acercade.jpg"
            alt="Personas voluntariando"
            width={800}
            height={600}
            className="w-full h-full object-cover"
          />
        </div>
      </main>

      <div className="text-center my-8">
        <button
          onClick={() => router.push("/")}
          className="float-bounce inline-flex items-center gap-5 px-10 py-4 rounded-full text-white bg-gradient-to-r from-[#7B61FF] to-[#a48dff] hover:from-[#6a53e0] hover:to-[#947bff] transition font-semibold shadow-lg"
        >
          ← Volver al inicio
        </button>
      </div>

      <footer className="text-center text-sm text-gray-500 py-8 border-t">
        © 2025 VolunNet - CUCEI. Todos los derechos reservados.💜
      </footer>

      <style jsx>{`
        @keyframes pulseFloat {
          0% {
            transform: translateY(0);
            box-shadow: 0 0 0 0 rgba(123, 97, 255, 0.5);
          }
          50% {
            transform: translateY(-4px);
            box-shadow: 0 8px 16px rgba(123, 97, 255, 0.3);
          }
          100% {
            transform: translateY(0);
            box-shadow: 0 0 0 0 rgba(123, 97, 255, 0.5);
          }
        }
        .float-bounce {
          animation: pulseFloat 2.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
