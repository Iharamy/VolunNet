"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Heart, Menu, X } from "lucide-react";

export default function OrganizacionesMenuPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const filterCards = (category: string) => {
      const cards = document.querySelectorAll(".org-card") as NodeListOf<HTMLElement>;
      const buttons = document.querySelectorAll("button");
      buttons.forEach((btn) => btn.classList.remove("active-category"));
      const activeBtn = document.getElementById("btn-" + category);
      if (activeBtn) activeBtn.classList.add("active-category");
      cards.forEach((card) => {
        card.style.display =
          category === "todas" || card.classList.contains(category) ? "block" : "none";
      });
    };

    filterCards("todas");

    ["todas", "infancia", "medio", "animales", "educacion"].forEach((cat) => {
      const btn = document.getElementById("btn-" + cat);
      if (btn) {
        btn.onclick = () => filterCards(cat);
      }
    });
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <div className="bg-gradient-to-tr from-[#f3f0ff] via-[#f9f6ff] to-[#fffaff] text-gray-800 font-sans min-h-screen flex flex-col">
      <header
        className={`fixed w-full z-50 transition-all duration-300 ${
          scrolled ? "bg-white/90 backdrop-blur-md shadow-md" : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Heart className="h-8 w-8 text-[#7B61FF] fill-purple-200" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#7B61FF] to-[#A78BFA] bg-clip-text text-transparent">
              VolunNet
            </h1>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Link
              href="/eventosfin"
              className={`$${
                isActive("/eventosfin")
                  ? "text-[#7B61FF] font-semibold"
                  : "text-gray-700 hover:text-[#7B61FF]"
              }`}
            >
              Eventos
            </Link>
            <Link
              href="/organizaciones"
              className={`$${
                isActive("/organizaciones")
                  ? "text-[#7B61FF] font-semibold"
                  : "text-gray-700 hover:text-[#7B61FF]"
              }`}
            >
              Organizaciones
            </Link>
            <Link
              href="/acerca-de"
              className={`$${
                isActive("/acerca-de")
                  ? "text-[#7B61FF] font-semibold"
                  : "text-gray-700 hover:text-[#7B61FF]"
              }`}
            >
              Acerca de
            </Link>
          </nav>
          <div className="hidden md:flex space-x-3">
            <Button variant="outline" className="rounded-full px-6" asChild>
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              className="rounded-full px-6 bg-gradient-to-r from-[#7B61FF] to-[#A78BFA] text-white"
              asChild
            >
              <Link href="/registro">Registrarse</Link>
            </Button>
          </div>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden px-6 pb-4 pt-2 bg-white shadow-md">
            <nav className="flex flex-col space-y-3">
              <Link href="/eventosfin">Eventos</Link>
              <Link href="/organizaciones">Organizaciones</Link>
              <Link href="/acerca-de">Acerca de</Link>
              <Link href="/login">Iniciar Sesión</Link>
              <Link href="/registro">Registrarse</Link>
            </nav>
          </div>
        )}
      </header>

      <section className="text-center py-12 px-4 pt-32">
        <h2 className="text-4xl font-extrabold mb-4 text-gray-800">
          Organizaciones que <span className="bg-gradient-to-r from-[#7B61FF] via-[#A78BFA] to-[#C084FC] bg-clip-text text-transparent">transforman</span> vidas
        </h2>
        <p className="text-lg text-gray-600 max-w-xl mx-auto">
          Elige una causa, explora organizaciones y comienza a colaborar.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-4">
        <div className="flex flex-wrap gap-3 justify-center text-sm font-medium">
          {[{ id: "todas", label: "Todas" }, { id: "infancia", label: "👶 Infancia" }, { id: "medio", label: "🌿 Medio ambiente" }, { id: "animales", label: "🐶 Animales" }, { id: "educacion", label: "📚 Educación" }].map((cat) => (
            <button key={cat.id} id={`btn-${cat.id}`} className={`px-4 py-2 rounded-full bg-white shadow hover:bg-gray-100 ${cat.id === "todas" ? "active-category" : ""}`}>
              {cat.label}
            </button>
          ))}
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 pt-16 pb-20 grid gap-10 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 flex-grow">
        {[{
          img: "/img/organizacion1.jpg", clase: "infancia", titulo: "Fundación Sonrisas", lugar: "CDMX · Infancia", desc: "Actividades y apoyo emocional para niños vulnerables."
        }, {
          img: "/img/organizacion2.jpg", clase: "medio", titulo: "Verde Vivo A.C.", lugar: "Querétaro · Medio ambiente", desc: "Reforestación, educación ecológica y limpieza de espacios."
        }, {
          img: "/img/organizacion3.jpg", clase: "animales", titulo: "Apoyo Animal MX", lugar: "Guadalajara · Animales", desc: "Rescate, rehabilitación y adopción de animales."
        }, {
          img: "/img/organizacion4.jpg", clase: "educacion", titulo: "Educar para el Futuro", lugar: "Monterrey · Educación", desc: "Clases gratuitas y mentoría a jóvenes en situación de riesgo."
        }].map((card, i) => (
          <div key={i} className={`org-card ${card.clase} bg-white rounded-3xl overflow-hidden shadow-2xl hover:shadow-[0_10px_30px_rgba(123,97,255,0.4)] transition-all`}>
            <Image src={card.img} alt={card.titulo} width={400} height={200} className="w-full h-48 object-cover" />
            <div className="p-6">
              <h3 className="text-2xl font-bold text-[#7B61FF] mb-2">{card.titulo}</h3>
              <p className="text-sm text-gray-500 mb-2">{card.lugar}</p>
              <p className="text-gray-700">{card.desc}</p>
            </div>
          </div>
        ))}
      </main>

      <div className="text-center my-8">
        <button onClick={() => router.push("/")} className="float-bounce inline-flex items-center gap-5 px-10 py-4 rounded-full text-white bg-gradient-to-r from-[#7B61FF] via-[#9675ff] to-[#c0a7ff] hover:brightness-110 transition font-semibold shadow-xl">
          ← Volver al inicio
        </button>
      </div>

      <footer className="text-center text-sm bg-gradient-to-r from-[#e2dbff] via-[#f7f3ff] to-[#fff8ff] text-[#6b5ca9] py-8 border-t border-gray-200">
        © 2025 VolunNet - CUCEI. Todos los derechos reservados.💜
      </footer>

      <style jsx>{`
        .active-category {
          background-color: #7b61ff;
          color: white;
        }
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