import { StaticPageShell } from "@/components/sections/static-page-shell";

export default function CancelacionesPage() {
  return (
    <StaticPageShell
      title="Política de Cancelaciones"
      subtitle="Consulta las condiciones de cancelación, cambios de fecha y reembolsos para experiencias MACAO."
    >
      <article className="rounded-xl border border-border bg-card p-5 text-sm leading-7 text-foreground/90 shadow-sm md:p-8 md:text-base">
        <h2 className="text-lg font-semibold text-foreground md:text-xl">1. Cancelación por parte del cliente</h2>
        <p className="mt-2">
          Las cancelaciones realizadas con más de 48 horas de antelación pueden aplicar a reembolso total o crédito,
          según el método de pago y el canal de reserva.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground md:text-xl">2. Cambios de fecha</h2>
        <p className="mt-2">
          Los cambios están sujetos a disponibilidad. Recomendamos solicitarlos con al menos 24 horas de anticipación
          para gestionar la mejor alternativa posible.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground md:text-xl">3. No show</h2>
        <p className="mt-2">
          En caso de no presentación sin aviso previo, la reserva podrá considerarse utilizada y no aplicará reembolso.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground md:text-xl">4. Cancelaciones por clima o seguridad</h2>
        <p className="mt-2">
          Si MACAO cancela por condiciones climáticas extremas o razones de seguridad, se ofrecerá reprogramación o
          reembolso conforme a la opción elegida por el cliente.
        </p>

        <h2 className="mt-6 text-lg font-semibold text-foreground md:text-xl">5. Contacto oficial</h2>
        <p className="mt-2">
          Para solicitudes de cancelación o cambios, utiliza nuestros canales oficiales en la página de contacto
          indicando tu nombre, correo y número de reserva.
        </p>
      </article>
    </StaticPageShell>
  );
}
