import { StaticPageShell } from "@/components/sections/static-page-shell";

export default function OurStoryPage() {
  return (
    <StaticPageShell
      title="Nuestra Historia"
      subtitle="MACAO nació para ofrecer una experiencia offroad auténtica en Punta Cana, combinando aventura, seguridad y un servicio cercano para cada visitante."
      ctaHref="/contact"
      ctaLabel="Contactanos"
    >
      <div className="space-y-6 text-sm leading-7 text-foreground/90 md:text-base">
        <p>
          Comenzamos con una misión simple: crear recorridos que conecten a las personas con los paisajes más impresionantes de Macao,
          con rutas diseñadas para principiantes y amantes de la adrenalina.
        </p>
        <p>
          Con el tiempo, incorporamos nuevas unidades, guías certificados y protocolos de seguridad que hoy nos convierten en una referencia
          para experiencias offroad en la región.
        </p>
        <p>
          Cada salida es planificada para mantener el equilibrio entre emoción, cuidado del entorno y atención personalizada.
        </p>
      </div>
    </StaticPageShell>
  );
}
