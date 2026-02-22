import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StaticPageShell } from "@/components/sections/static-page-shell";

const faqItems = [
  {
    id: "item-1",
    question: "¿Cómo reservo una experiencia?",
    answer:
      "Selecciona tu servicio y productos, completa el checkout y recibirás la confirmación por correo electrónico.",
  },
  {
    id: "item-2",
    question: "¿Qué incluye el tour?",
    answer:
      "Cada tour incluye guía, equipo básico de seguridad y paradas en puntos destacados. Los detalles varían por producto.",
  },
  {
    id: "item-3",
    question: "¿Puedo modificar mi reserva?",
    answer:
      "Sí. Puedes solicitar cambios escribiendo a contacto con al menos 24 horas de anticipación, sujeto a disponibilidad.",
  },
  {
    id: "item-4",
    question: "¿Qué métodos de pago aceptan?",
    answer:
      "Aceptamos pago completo o parcial y métodos de pago digitales habilitados durante el checkout.",
  },
];

export default function FaqPage() {
  return (
    <StaticPageShell
      title="Preguntas Frecuentes"
      subtitle="Respuestas rápidas sobre reservas, tours, pagos y políticas para que organices tu aventura con confianza."
      ctaHref="/contact"
      ctaLabel="Hablar con soporte"
    >
      <div className="rounded-xl border border-border bg-card px-5 py-3 shadow-sm md:px-8 md:py-4">
        <Accordion type="single" collapsible className="w-full">
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className="text-left text-base hover:no-underline md:text-lg">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-7 text-muted-foreground md:text-base">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </StaticPageShell>
  );
}
