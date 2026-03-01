"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FormData = {
  name: string;
  email: string;
  phone: string;
  message: string;
};

export function InfoForm({
  formTitle,
  submitLabel,
  successMessage,
}: {
  formTitle: string;
  submitLabel: string;
  successMessage: string;
}) {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  function handleChange<K extends keyof FormData>(field: K, value: FormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
    setFormData({ name: "", email: "", phone: "", message: "" });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-5 shadow-sm md:p-8">
      <h2 className="text-xl font-title md:text-2xl">{formTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Completa el formulario y nuestro equipo te contactará lo antes posible.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={`${submitLabel}-name`}>Nombre</Label>
          <Input
            id={`${submitLabel}-name`}
            value={formData.name}
            onChange={(event) => handleChange("name", event.target.value)}
            placeholder="Tu nombre completo"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${submitLabel}-email`}>Email</Label>
          <Input
            id={`${submitLabel}-email`}
            type="email"
            value={formData.email}
            onChange={(event) => handleChange("email", event.target.value)}
            placeholder="tuemail@dominio.com"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${submitLabel}-phone`}>Teléfono</Label>
          <Input
            id={`${submitLabel}-phone`}
            type="tel"
            value={formData.phone}
            onChange={(event) => handleChange("phone", event.target.value)}
            placeholder="+1 (809) 555-1234"
            required
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor={`${submitLabel}-message`}>Mensaje</Label>
          <Textarea
            id={`${submitLabel}-message`}
            value={formData.message}
            onChange={(event) => handleChange("message", event.target.value)}
            placeholder="Cuéntanos cómo podemos ayudarte"
            className="min-h-32"
            required
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <Button type="submit" className="h-11 rounded-full text-sm font-semibold" style={{ backgroundColor: "#FF6B00", color: "#FFFFFF" }}>
          {submitLabel}
        </Button>
        {isSubmitted ? <p className="text-sm font-medium" style={{ color: "#FF6B00" }}>{successMessage}</p> : null}
      </div>
    </form>
  );
}
