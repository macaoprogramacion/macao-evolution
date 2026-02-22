import { InfoForm } from "@/components/forms/info-form";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export default function ContactPage() {
  return (
    <StaticPageShell
      title="Contacto"
      subtitle="Estamos listos para ayudarte con reservas, dudas sobre tours y recomendaciones para tu próxima aventura en Macao."
    >
      <InfoForm
        formTitle="Envíanos un mensaje"
        submitLabel="Enviar mensaje"
        successMessage="¡Mensaje enviado! Te responderemos pronto."
      />
    </StaticPageShell>
  );
}
