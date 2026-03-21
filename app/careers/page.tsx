import { InfoForm } from "@/components/forms/info-form";
import { StaticPageShell } from "@/components/sections/static-page-shell";

export default function CareersPage() {
  return (
    <StaticPageShell
      title="Careers"
      subtitle="Buscamos talento comprometido con el servicio al cliente, la seguridad y la pasión por la aventura."
    >
      <InfoForm
        formTitle="Trabaja con nosotros"
        submitLabel="Enviar candidatura"
        successMessage="¡Gracias! Hemos recibido tu candidatura."
      />
    </StaticPageShell>
  );
}
